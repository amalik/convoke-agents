#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const yaml = require('js-yaml');
const { findProjectRoot, getPackageVersion } = require('./update/lib/utils');
const { AGENTS, GYRE_AGENTS, EXTRA_BME_AGENTS } = require('./update/lib/agent-registry');
// Note: parseCsvRow is loaded LAZILY inside loadSkillManifest() (ag-7-2 review patch).
// Top-level require would crash the doctor on installs missing _team-factory/ — exactly
// the broken-install case the doctor exists to diagnose. The lazy require is wrapped
// in try/catch so a missing _team-factory degrades to "skip wrapper checks" instead
// of crashing the entire CLI.

/**
 * convoke-doctor — Diagnose common Convoke installation issues.
 *
 * Config-driven: discovers all modules by scanning _bmad/bme/ config.yaml
 * and validates file existence dynamically per module.
 */

async function main() {
  console.log('');
  console.log(chalk.cyan.bold('Convoke Doctor'));
  console.log(chalk.gray(`Package version: ${getPackageVersion()}`));
  console.log('');

  const projectRoot = findProjectRoot();
  const checks = [];

  // 1. Project root detection
  checks.push(checkProjectRoot(projectRoot));

  if (!projectRoot) {
    printResults(checks);
    process.exit(1);
    return;
  }

  // 2. Discover modules from _bmad/bme/*/config.yaml
  const modules = discoverModules(projectRoot);

  if (modules.length === 0) {
    checks.push({
      name: 'Module discovery',
      passed: false,
      error: 'No modules found — expected config.yaml files in _bmad/bme/*/',
      fix: 'Run: npx -p convoke-agents convoke-install'
    });
    printResults(checks);
    process.exit(1);
    return;
  }

  checks.push({
    name: 'Module discovery',
    passed: true,
    info: `Found ${modules.length} module(s): ${modules.map(m => m.name).join(', ')}`
  });

  // 3. Per-module checks
  // ag-7-2 (I31): load skill-manifest once for the wrapper-name lookup used by
  // checkModuleSkillWrappers below. Empty Map is safe (falls back to verbatim).
  const manifestMap = loadSkillManifest(projectRoot);

  for (const mod of modules) {
    const configCheck = checkModuleConfig(mod);
    checks.push(configCheck);
    if (configCheck.passed) {
      if (Array.isArray(mod.config.agents) && mod.config.agents.length > 0) {
        checks.push(checkModuleAgents(mod));
      }
      if (Array.isArray(mod.config.workflows) && mod.config.workflows.length > 0) {
        checks.push(checkModuleWorkflows(mod));
      }
      // ag-7-2 (I31): verify skill wrappers exist on disk for standalone-skill workflows.
      // checkModuleSkillWrappers returns null if the module has no manifest entries
      // (i.e., no standalone-skill workflows), so we filter those out.
      if (Array.isArray(mod.config.workflows) && mod.config.workflows.length > 0) {
        const wrapperCheck = checkModuleSkillWrappers(mod, projectRoot, manifestMap);
        if (wrapperCheck) checks.push(wrapperCheck);
      }
    }
  }

  // 4. Agent skill wrapper check (I43: spans all bme modules)
  checks.push(checkAgentSkillWrappers(projectRoot));

  // 5. Global checks (module-agnostic)
  checks.push(await checkOutputDir(projectRoot));
  checks.push(checkMigrationLock(projectRoot));
  checks.push(checkVersionConsistency(projectRoot, modules));
  checks.push(...checkTaxonomy(projectRoot));

  printResults(checks);

  const failed = checks.filter(c => !c.passed);
  process.exit(failed.length > 0 ? 1 : 0);
}

/**
 * Scan _bmad/bme/ for subdirectories containing config.yaml.
 * Returns an array of module descriptors with parsed config (or null on error).
 */
function discoverModules(projectRoot) {
  const bmeDir = path.join(projectRoot, '_bmad/bme');
  if (!fs.existsSync(bmeDir)) return [];

  const entries = fs.readdirSync(bmeDir, { withFileTypes: true });
  const modules = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const configPath = path.join(bmeDir, entry.name, 'config.yaml');
    if (!fs.existsSync(configPath)) continue;

    let config = null;
    let parseError = null;
    try {
      const content = fs.readFileSync(configPath, 'utf8');
      config = yaml.load(content);
    } catch (err) {
      parseError = err.message;
    }

    modules.push({
      name: entry.name,
      dir: path.join(bmeDir, entry.name),
      configPath,
      config,
      parseError,
    });
  }

  return modules;
}

function checkProjectRoot(projectRoot) {
  if (projectRoot) {
    return {
      name: 'Project root',
      passed: true,
      info: projectRoot
    };
  }
  return {
    name: 'Project root',
    passed: false,
    error: 'Could not find _bmad/ directory',
    fix: 'Run this command from inside a Convoke project, or run: npx -p convoke-agents convoke-install'
  };
}

function checkModuleConfig(mod) {
  const label = `${mod.name} config`;

  if (mod.parseError) {
    return {
      name: label,
      passed: false,
      error: `YAML parse error: ${mod.parseError}`,
      fix: `Check ${mod.configPath} for syntax errors`
    };
  }

  if (!mod.config || typeof mod.config !== 'object') {
    return {
      name: label,
      passed: false,
      error: 'config.yaml is empty or invalid',
      fix: `Reinstall the ${mod.name} module`
    };
  }

  const hasAgents = Array.isArray(mod.config.agents) && mod.config.agents.length > 0;
  const hasWorkflows = Array.isArray(mod.config.workflows) && mod.config.workflows.length > 0;

  // A module must have at least agents or workflows
  if (!hasAgents && !hasWorkflows) {
    return {
      name: label,
      passed: false,
      error: 'config.yaml missing both agents and workflows sections',
      fix: `Check ${mod.configPath}`
    };
  }

  const parts = [];
  if (hasAgents) parts.push(`${mod.config.agents.length} agents`);
  if (hasWorkflows) parts.push(`${mod.config.workflows.length} workflows`);

  return {
    name: label,
    passed: true,
    info: parts.join(', ')
  };
}

function checkModuleAgents(mod) {
  const label = `${mod.name} agents`;
  const agentsDir = path.join(mod.dir, 'agents');
  const agentIds = mod.config.agents;

  if (!fs.existsSync(agentsDir)) {
    return {
      name: label,
      passed: false,
      error: 'agents/ directory not found',
      fix: `Reinstall the ${mod.name} module`
    };
  }

  const missing = agentIds.filter(id => !fs.existsSync(path.join(agentsDir, `${id}.md`)));

  if (missing.length > 0) {
    return {
      name: label,
      passed: false,
      error: `Missing: ${missing.map(id => `${id}.md`).join(', ')}`,
      fix: `Reinstall the ${mod.name} module`
    };
  }

  // Check files are non-empty
  const empty = agentIds.filter(id => {
    const stat = fs.statSync(path.join(agentsDir, `${id}.md`));
    return stat.size === 0;
  });

  if (empty.length > 0) {
    return {
      name: label,
      passed: false,
      error: `Empty agent files: ${empty.map(id => `${id}.md`).join(', ')}`,
      fix: `Reinstall the ${mod.name} module`
    };
  }

  return { name: label, passed: true, info: `${agentIds.length} agents present` };
}

function checkModuleWorkflows(mod) {
  const label = `${mod.name} workflows`;
  const workflowsDir = path.join(mod.dir, 'workflows');
  const workflowNames = mod.config.workflows;

  if (!fs.existsSync(workflowsDir)) {
    return {
      name: label,
      passed: false,
      error: 'workflows/ directory not found',
      fix: `Reinstall the ${mod.name} module`
    };
  }

  const missing = workflowNames.filter(w => {
    const name = typeof w === 'object' ? w.name : w;
    return !fs.existsSync(path.join(workflowsDir, name, 'workflow.md'));
  });

  if (missing.length > 0) {
    return {
      name: label,
      passed: false,
      error: `Missing: ${missing.join(', ')}`,
      fix: `Reinstall the ${mod.name} module`
    };
  }

  return { name: label, passed: true, info: `${workflowNames.length} workflows present` };
}

/**
 * Load skill-manifest.csv into a Map keyed by source path → canonicalId.
 * The manifest is the authoritative source for wrapper directory names
 * (canonicalId = the directory name under .claude/skills/).
 *
 * Returns an empty Map and logs a warning on any read/parse error — never throws,
 * never fails the doctor. checkModuleSkillWrappers will fall back to verbatim
 * workflow names for any source path not in the map.
 *
 * Closes I31 (ag-7-2).
 *
 * @param {string} projectRoot - Absolute path to project root
 * @returns {Map<string, string>} sourcePath → canonicalId
 */
function loadSkillManifest(projectRoot) {
  const manifestPath = path.join(projectRoot, '_bmad/_config/skill-manifest.csv');
  const map = new Map();

  if (!fs.existsSync(manifestPath)) {
    console.warn(chalk.yellow(`  ⚠ skill-manifest.csv not found at ${manifestPath}; skill wrapper checks will be skipped`));
    return map;
  }

  // Lazy-load parseCsvRow from the optional _team-factory submodule.
  // ag-7-2 review patch (Edge Case Hunter EH#1): if _team-factory/ is missing
  // (e.g., user opted out of the team-factory module), the top-level require
  // would crash the doctor before main() even runs — exactly the broken-install
  // case the doctor exists to diagnose. Lazy + try/catch degrades cleanly.
  let parseCsvRow;
  try {
    ({ parseCsvRow } = require('../_bmad/bme/_team-factory/lib/utils/csv-utils'));
  } catch (_err) {
    console.warn(chalk.yellow(`  ⚠ csv-utils unavailable (_team-factory submodule not installed); skill wrapper checks will be skipped`));
    return map;
  }

  try {
    const content = fs.readFileSync(manifestPath, 'utf8');
    const lines = content.split('\n').filter(l => l.trim().length > 0);
    if (lines.length === 0) return map;

    // Parse header to find column indices
    const header = parseCsvRow(lines[0]);
    const canonicalIdIdx = header.indexOf('canonicalId');
    const pathIdx = header.indexOf('path');
    if (canonicalIdIdx === -1 || pathIdx === -1) {
      console.warn(chalk.yellow(`  ⚠ skill-manifest.csv missing required columns (canonicalId, path); skill wrapper checks will be skipped`));
      return map;
    }

    // Parse data rows
    for (let i = 1; i < lines.length; i++) {
      const fields = parseCsvRow(lines[i]);
      if (fields.length <= Math.max(canonicalIdIdx, pathIdx)) continue;
      const canonicalId = fields[canonicalIdIdx];
      const sourcePath = fields[pathIdx];
      if (canonicalId && sourcePath) {
        map.set(sourcePath, canonicalId);
      }
    }
  } catch (err) {
    console.warn(chalk.yellow(`  ⚠ skill-manifest.csv parse error (${err.message}); skill wrapper checks will be skipped`));
    return new Map();
  }

  return map;
}

/**
 * Check that every standalone-skill workflow declared in a module's config.yaml
 * has a corresponding skill wrapper at .claude/skills/{canonicalId}/SKILL.md.
 *
 * Manifest-as-opt-in semantics:
 * - The skill-manifest.csv is the OPT-IN marker for "this workflow is a standalone
 *   skill that needs a wrapper." Modules whose workflows are NOT in the manifest
 *   (Vortex, Gyre, team-factory, ...) generate menu-patch workflows or agent
 *   skills, NOT standalone wrappers — those modules are silently skipped here.
 * - Only Enhance + Artifacts workflows are in the manifest today (after ag-7-2
 *   Task 0 added the Enhance row).
 * - If a module has SOME workflows in the manifest and SOME not, only the
 *   in-manifest ones are checked.
 *
 * Resolution: source path `_bmad/bme/{mod.name}/workflows/{workflowName}/SKILL.md`
 *             → manifest lookup → canonicalId is the wrapper directory name.
 *
 * Failures are aggregated into a single result (mirrors validateEnhanceModule
 * pattern from Story 6.6) so the operator sees every missing wrapper at once.
 *
 * Returns null if the module has NO standalone-skill workflows (caller skips
 * pushing null results into the checks array).
 *
 * Closes I31 (ag-7-2).
 *
 * @param {object} mod - Module descriptor from discoverModules()
 * @param {string} projectRoot - Absolute path to project root
 * @param {Map<string, string>} manifestMap - From loadSkillManifest()
 * @returns {object|null} Doctor check result, or null if module has no standalone-skill workflows
 */
function checkModuleSkillWrappers(mod, projectRoot, manifestMap) {
  const label = `${mod.name} skill wrappers`;
  const workflowNames = mod.config.workflows;
  const failures = [];
  const checked = [];

  // Build the source-path prefix from mod.dir (the absolute module directory
  // discovered by discoverModules) relative to projectRoot. ag-7-2 review patch
  // (Blind Hunter BH#1): the previous hardcoded `_bmad/bme/` prefix was correct
  // for current callers (discoverModules only scans bme submodules) but would
  // silently miss if a future caller scans a different team directory.
  const moduleRelPath = path.relative(projectRoot, mod.dir);

  for (const w of workflowNames) {
    // Null/empty/object-without-name guard. ag-7-2 review patch (Edge Case
    // Hunter EH#4 / Blind Hunter BH#7): a malformed config.yaml with
    // `workflows: [null]` or `workflows: [{}]` would otherwise crash the doctor
    // with a TypeError instead of producing a clean diagnostic.
    if (!w) continue;
    const wfName = typeof w === 'object' ? w.name : w;
    if (!wfName || typeof wfName !== 'string') continue;

    const sourcePath = `${moduleRelPath}/workflows/${wfName}/SKILL.md`;

    // Manifest is opt-in: only workflows declared in skill-manifest.csv are
    // standalone-skill workflows that need wrappers. Skip the rest silently.
    const wrapperName = manifestMap.get(sourcePath);
    if (!wrapperName) continue;

    checked.push(wfName);
    const wrapperPath = path.join(projectRoot, '.claude', 'skills', wrapperName, 'SKILL.md');
    if (!fs.existsSync(wrapperPath)) {
      failures.push(`Missing skill wrapper for ${wfName}: .claude/skills/${wrapperName}/SKILL.md`);
    }
  }

  // If no workflows in this module are standalone skills, skip the check entirely.
  if (checked.length === 0) {
    return null;
  }

  if (failures.length > 0) {
    return {
      name: label,
      passed: false,
      error: failures.join('; '),
      fix: 'Run convoke-update to regenerate skill wrappers'
    };
  }

  return {
    name: label,
    passed: true,
    info: `${checked.length} standalone-skill workflows have wrappers`
  };
}

function checkAgentSkillWrappers(projectRoot) {
  const label = 'BME agent skill wrappers';
  const allAgents = [...AGENTS, ...GYRE_AGENTS, ...EXTRA_BME_AGENTS];
  const failures = [];

  for (const agent of allAgents) {
    const wrapperPath = path.join(projectRoot, '.claude', 'skills', `bmad-agent-bme-${agent.id}`, 'SKILL.md');
    if (!fs.existsSync(wrapperPath)) {
      failures.push(`Missing: .claude/skills/bmad-agent-bme-${agent.id}/SKILL.md`);
    }
  }

  if (failures.length > 0) {
    return {
      name: label,
      passed: false,
      error: failures.join('; '),
      fix: 'Run convoke-update to regenerate agent skill wrappers'
    };
  }

  return {
    name: label,
    passed: true,
    info: `${allAgents.length} agent skill wrappers verified`
  };
}

async function checkOutputDir(projectRoot) {
  const outputDir = path.join(projectRoot, '_bmad-output');

  if (!fs.existsSync(outputDir)) {
    return {
      name: 'Output directory',
      passed: true,
      info: 'Not created yet (will be created on first use)'
    };
  }

  try {
    const testFile = path.join(outputDir, '.doctor-write-test');
    await fs.writeFile(testFile, 'test', 'utf8');
    await fs.remove(testFile);
    return { name: 'Output directory', passed: true, info: 'Writable' };
  } catch (_err) {
    return {
      name: 'Output directory',
      passed: false,
      error: '_bmad-output/ is not writable',
      fix: 'Check directory permissions: chmod -R u+w _bmad-output/'
    };
  }
}

function checkMigrationLock(projectRoot) {
  const lockFile = path.join(projectRoot, '_bmad-output/.migration-lock');

  if (!fs.existsSync(lockFile)) {
    return { name: 'Migration lock', passed: true, info: 'No active lock' };
  }

  try {
    const lock = fs.readJsonSync(lockFile);
    const age = Date.now() - lock.timestamp;
    const minutes = Math.round(age / 60000);

    if (age > 5 * 60 * 1000) {
      return {
        name: 'Migration lock',
        passed: false,
        error: `Stale lock file (${minutes} minutes old, PID ${lock.pid})`,
        fix: 'Remove the stale lock: rm _bmad-output/.migration-lock'
      };
    }

    return {
      name: 'Migration lock',
      passed: true,
      info: `Active lock (${minutes}m old, PID ${lock.pid}) — migration may be running`
    };
  } catch (_err) {
    return {
      name: 'Migration lock',
      passed: false,
      error: 'Corrupt lock file',
      fix: 'Remove the lock: rm _bmad-output/.migration-lock'
    };
  }
}

function checkVersionConsistency(projectRoot, modules) {
  const packageVersion = getPackageVersion();
  const mismatched = [];

  for (const mod of modules) {
    if (!mod.config) continue;
    const installedVersion = mod.config.version || mod.config.installed_version;
    if (installedVersion && installedVersion !== packageVersion) {
      mismatched.push(`${mod.name}: ${installedVersion}`);
    }
  }

  if (mismatched.length > 0) {
    return {
      name: 'Version consistency',
      passed: false,
      error: `Package: ${packageVersion}, ${mismatched.join(', ')}`,
      fix: 'Run: npx -p convoke-agents convoke-update'
    };
  }

  return {
    name: 'Version consistency',
    passed: true,
    info: `${packageVersion} — package and config versions consistent`
  };
}

function printResults(checks) {
  const passed = checks.filter(c => c.passed);
  const failed = checks.filter(c => !c.passed);

  checks.forEach(check => {
    if (check.passed) {
      console.log(chalk.green(`  ✓ ${check.name}`));
      if (check.info) {
        console.log(chalk.gray(`    ${check.info}`));
      }
    } else {
      console.log(chalk.red(`  ✗ ${check.name}`));
      console.log(chalk.red(`    ${check.error}`));
      if (check.fix) {
        console.log(chalk.yellow(`    Fix: ${check.fix}`));
      }
    }
  });

  console.log('');
  if (failed.length === 0) {
    console.log(chalk.green.bold(`All ${passed.length} checks passed. Installation looks healthy!`));
  } else {
    console.log(chalk.red.bold(`${failed.length} issue(s) found, ${passed.length} checks passed.`));
  }
  console.log('');
}

// --- Taxonomy Validation ---

/** Valid ID pattern: lowercase alphanumeric with optional dashes */
const TAXONOMY_ID_PATTERN = /^[a-z][a-z0-9-]*$/;

/**
 * Validate taxonomy configuration file.
 * Returns array of check results (never throws).
 * @param {string} projectRoot
 * @returns {Array<{name: string, passed: boolean, error?: string, warning?: string, fix?: string, info?: string}>}
 */
function checkTaxonomy(projectRoot) {
  const results = [];
  const configPath = path.join(projectRoot, '_bmad', '_config', 'taxonomy.yaml');

  // Check 1: file exists
  if (!fs.existsSync(configPath)) {
    results.push({
      name: 'Taxonomy: file exists',
      passed: false,
      warning: 'taxonomy.yaml not found at _bmad/_config/taxonomy.yaml',
      fix: 'Run convoke-migrate-artifacts or convoke-update to create it'
    });
    return results;
  }
  results.push({ name: 'Taxonomy: file exists', passed: true });

  // Check 2: YAML parseable
  let config;
  try {
    config = yaml.load(fs.readFileSync(configPath, 'utf8'));
  } catch (err) {
    results.push({
      name: 'Taxonomy: valid YAML',
      passed: false,
      error: `Invalid YAML in taxonomy.yaml: ${err.message}`,
      fix: 'Fix the YAML syntax in _bmad/_config/taxonomy.yaml'
    });
    return results;
  }
  results.push({ name: 'Taxonomy: valid YAML', passed: true });

  if (!config || typeof config !== 'object') {
    results.push({ name: 'Taxonomy: structure', passed: false, error: 'taxonomy.yaml is empty or not an object' });
    return results;
  }

  // Check 3: required sections
  const issues = [];
  if (!config.initiatives || !Array.isArray(config.initiatives.platform)) {
    issues.push('Missing initiatives.platform (must be an array)');
  }
  if (!config.initiatives || !Array.isArray(config.initiatives.user)) {
    issues.push('Missing initiatives.user (must be an array)');
  }
  if (!Array.isArray(config.artifact_types)) {
    issues.push('Missing artifact_types (must be an array)');
  }

  if (issues.length > 0) {
    results.push({ name: 'Taxonomy: structure', passed: false, error: issues.join('; ') });
    return results;
  }
  results.push({ name: 'Taxonomy: structure', passed: true });

  // Check 4: ID format validation
  const allPlatform = config.initiatives.platform || [];
  const allUser = config.initiatives.user || [];
  const allTypes = config.artifact_types || [];
  const invalidIds = [];

  for (const id of [...allPlatform, ...allUser]) {
    if (!TAXONOMY_ID_PATTERN.test(id)) {
      invalidIds.push(`initiative "${id}"`);
    }
  }
  for (const id of allTypes) {
    if (!TAXONOMY_ID_PATTERN.test(id)) {
      invalidIds.push(`artifact_type "${id}"`);
    }
  }

  if (invalidIds.length > 0) {
    results.push({
      name: 'Taxonomy: ID format',
      passed: false,
      error: `Invalid IDs (must be lowercase alphanumeric with dashes): ${invalidIds.join(', ')}`
    });
  } else {
    results.push({ name: 'Taxonomy: ID format', passed: true });
  }

  // Check 5: duplicates between platform and user
  const platformSet = new Set(allPlatform);
  const duplicates = allUser.filter(id => platformSet.has(id));
  if (duplicates.length > 0) {
    results.push({
      name: 'Taxonomy: no duplicates',
      passed: false,
      error: `Duplicate IDs in both platform and user sections: ${duplicates.join(', ')}`,
      fix: 'Remove duplicates from the user section (they are already in platform)'
    });
  } else {
    results.push({ name: 'Taxonomy: no duplicates', passed: true });
  }

  // Check 6: collisions between initiatives and artifact types
  const allInitiatives = new Set([...allPlatform, ...allUser]);
  const collisions = allTypes.filter(t => allInitiatives.has(t));
  if (collisions.length > 0) {
    results.push({
      name: 'Taxonomy: no collisions',
      passed: false,
      error: `IDs used as both initiative and artifact type: ${collisions.join(', ')}`,
      fix: 'Rename the colliding IDs to be unique across sections'
    });
  } else {
    results.push({ name: 'Taxonomy: no collisions', passed: true });
  }

  return results;
}

if (require.main === module) {
  main().catch(err => {
    console.error(chalk.red(`Doctor failed: ${err.message}`));
    process.exit(1);
  });
}

module.exports = { checkTaxonomy, loadSkillManifest, checkModuleSkillWrappers };
