#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const yaml = require('js-yaml');
const { findProjectRoot, getPackageVersion } = require('./update/lib/utils');
const { AGENTS, GYRE_AGENTS, EXTRA_BME_AGENTS } = require('./update/lib/agent-registry');
const {
  scanBmmDependencies,
  readExistingCsv,
  OUTPUT_CSV_REL: BMM_DEPS_CSV_REL,
  _internal: bmmDepsInternal,
} = require('./audit/audit-bmm-dependencies');
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
  checks.push(checkAgentSkillWrappers(projectRoot, modules));

  // 5. Global checks (module-agnostic)
  checks.push(await checkOutputDir(projectRoot));
  checks.push(checkMigrationLock(projectRoot));
  checks.push(checkVersionConsistency(projectRoot, modules));
  checks.push(...checkTaxonomy(projectRoot));
  // Governance grouping: BMM dependency registry check follows taxonomy so both
  // drift-style checks appear together in doctor output (Story 2.2 AC wire-up).
  checks.push(...checkBmmDependencies(projectRoot));

  printResults(checks);

  // NFR9: governance warnings are fail-soft — `softWarning` findings do NOT
  // contribute to the exit code. Only hard failures (passed=false without
  // softWarning) cause non-zero exit.
  const hardFailed = checks.filter(c => !c.passed && !c.softWarning);
  process.exit(hardFailed.length > 0 ? 1 : 0);
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
  // U8: `agents` in config.yaml already has exclusions filtered out (mergeConfig does this
  // at upgrade time). We read `excluded_agents` purely to surface the opt-out list in the
  // info line — so operators can see what's excluded without cross-referencing files.
  const excluded = Array.isArray(mod.config.excluded_agents)
    ? mod.config.excluded_agents.filter(a => typeof a === 'string')
    : [];

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

  let info = `${agentIds.length} agents present`;
  if (excluded.length > 0) {
    info += ` (${excluded.length} excluded: ${excluded.join(', ')})`;
  }
  return { name: label, passed: true, info };
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

function checkAgentSkillWrappers(projectRoot, modules = []) {
  const label = 'BME agent skill wrappers';
  // U8: gather excluded agent IDs across all discovered modules so their wrappers
  // don't get flagged as missing (they are intentionally absent).
  const excludedIds = new Set();
  for (const mod of modules) {
    if (mod.config && Array.isArray(mod.config.excluded_agents)) {
      for (const id of mod.config.excluded_agents) {
        if (typeof id === 'string') excludedIds.add(id);
      }
    }
  }

  const allAgents = [...AGENTS, ...GYRE_AGENTS, ...EXTRA_BME_AGENTS].filter(
    a => !excludedIds.has(a.id)
  );
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

  const info = excludedIds.size > 0
    ? `${allAgents.length} agent skill wrappers verified (${excludedIds.size} excluded)`
    : `${allAgents.length} agent skill wrappers verified`;
  return { name: label, passed: true, info };
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
  const softWarned = checks.filter(c => !c.passed && c.softWarning);
  const hardFailed = checks.filter(c => !c.passed && !c.softWarning);

  checks.forEach(check => {
    if (check.passed) {
      console.log(chalk.green(`  ✓ ${check.name}`));
      if (check.info) {
        console.log(chalk.gray(`    ${check.info}`));
      }
    } else if (check.softWarning) {
      // NFR9 fail-soft: governance warnings render distinctly from hard failures.
      console.log(chalk.yellow(`  ⚠ ${check.name}`));
      const msg = check.warning || check.error;
      if (msg) console.log(chalk.yellow(`    ${msg}`));
      if (check.fix) {
        const fixLines = String(check.fix).split('\n');
        fixLines.forEach(line => console.log(chalk.gray(`    ${line}`)));
      }
    } else {
      console.log(chalk.red(`  ✗ ${check.name}`));
      // Field precedence unified with soft-warning branch: `warning` first,
      // then `error` as fallback. Prevents confusion if a check accidentally
      // sets both fields.
      const msg = check.warning || check.error;
      if (msg) console.log(chalk.red(`    ${msg}`));
      if (check.fix) {
        console.log(chalk.yellow(`    Fix: ${check.fix}`));
      }
    }
  });

  console.log('');
  if (hardFailed.length === 0 && softWarned.length === 0) {
    console.log(chalk.green.bold(`All ${passed.length} checks passed. Installation looks healthy!`));
  } else if (hardFailed.length === 0) {
    console.log(chalk.yellow.bold(`${softWarned.length} governance warning(s) surfaced, ${passed.length} checks passed (no hard failures).`));
  } else {
    const warnSuffix = softWarned.length > 0 ? `, ${softWarned.length} governance warning(s)` : '';
    console.log(chalk.red.bold(`${hardFailed.length} issue(s) found, ${passed.length} checks passed${warnSuffix}.`));
  }
  console.log('');
}

// --- BMM Dependency Governance Check (Story 2.2) ---

/**
 * Summary-mode threshold (AC7a): when a single drift category produces at least
 * this many findings, collapse into a single summary finding instead of emitting
 * one finding per row. Prevents flooding doctor output when a systemic cause
 * (empty `.claude/skills/`, wholesale migration, etc.) produces N>>1 drift rows.
 */
const BMM_DRIFT_SUMMARY_THRESHOLD = 10;

/**
 * Sort rows deterministically by (skill_name, bmm_agent, dependency_type) for
 * CI-stable output. The tertiary `dependency_type` key guards against two
 * distinct triples sharing a (skill, agent) pair (e.g. same skill with both
 * `frontmatter` and `code-reference` deps on the same agent) — without it, the
 * relative ordering would depend on input-insertion order from the scan tool,
 * coupling doctor determinism to unrelated scan-tool changes.
 */
function _bmmRowCmp(a, b) {
  if (a.skill_name !== b.skill_name) return a.skill_name < b.skill_name ? -1 : 1;
  if (a.bmm_agent !== b.bmm_agent) return a.bmm_agent < b.bmm_agent ? -1 : 1;
  if (a.dependency_type !== b.dependency_type) return a.dependency_type < b.dependency_type ? -1 : 1;
  return 0;
}

/**
 * Suppress `scanBmmDependencies`'s stderr (`[FR18] ...` / `[stale:*]` logs)
 * during the call — those belong to the scan tool's CLI mode, not the doctor's
 * structured output. Captured messages are discarded in production.
 *
 * IMPORTANT — sync-only invariant: this function mutates `console.error` as a
 * process-global. It is safe ONLY because `scanBmmDependencies` is synchronous
 * AND because `main()` runs checks serially (no concurrent invocations). If a
 * future change makes the scan async OR lets multiple callers invoke this
 * simultaneously, the nested try/finally will stomp each other's restore
 * (caller A saves `original`; caller B saves A's stub as "original"; A restores;
 * B restores the stub permanently). Refactor to a stack-counted reentrant shim
 * (or `process.stderr.write` override with ref-count) before relaxing either
 * invariant.
 *
 * @param {string} projectRoot
 * @returns {Array}
 */
function _scanWithSuppressedStderr(projectRoot) {
  const originalConsoleError = console.error;
  console.error = () => {};
  try {
    const result = scanBmmDependencies(projectRoot);
    // R2-P3: runtime enforcement of the sync-only invariant documented above.
    // If scanBmmDependencies ever returns a Promise, the async value would
    // settle AFTER `finally` restores console.error — silently corrupting the
    // suppression contract. Fail loud instead.
    if (result && typeof result.then === 'function') {
      throw new Error(
        '_scanWithSuppressedStderr: scanBmmDependencies returned a Promise; '
        + 'the stderr-suppression shim requires synchronous scan. '
        + 'Refactor to a reference-counted reentrant pattern before making scan async.'
      );
    }
    return result;
  } finally {
    console.error = originalConsoleError;
  }
}

/**
 * Validate the BMM dependency registry as a standing health check (FR14).
 * Surfaces drift as fail-soft governance warnings (NFR9) — never hard-fails
 * convoke-doctor's exit code. Reuses Story 2.1's scan primitives; doctor is
 * READ-ONLY and performs no writes.
 *
 * Four drift categories (Story 2.2 AC3):
 *  1. stale-autoscan — auto-scan row for triple the fresh scan no longer emits
 *  2. unregistered-custom-skill — fresh scan detects source_module=unknown dep
 *     the CSV doesn't have (FR17 honest warning with registration instructions)
 *  3. missing-scan-target — CSV row references a known-prefix skill absent on disk
 *  4. scan-vs-csv-mismatch — first-party skill scan sees that CSV doesn't know
 *
 * @param {string} projectRoot - Absolute project root.
 * @returns {Array<{name: string, passed: boolean, softWarning?: boolean, warning?: string, info?: string, fix?: string}>}
 */
function checkBmmDependencies(projectRoot) {
  const csvAbs = path.join(projectRoot, BMM_DEPS_CSV_REL);

  // AC5: CSV absent → informational finding, no scan attempted.
  if (!fs.existsSync(csvAbs)) {
    return [{
      name: 'BMM dependencies: registry present',
      passed: false,
      softWarning: true,
      warning: 'bmm-dependencies.csv not found — governance registry has not been generated yet',
      fix: 'Run: node scripts/audit/audit-bmm-dependencies.js',
    }];
  }

  // AC6: fail-soft if scan throws. Scan stderr suppressed either way.
  let scanRows;
  try {
    scanRows = _scanWithSuppressedStderr(projectRoot);
  } catch (err) {
    return [{
      name: 'BMM dependencies: scan',
      passed: false,
      softWarning: true,
      warning: `scan failed: ${(err && err.message) || String(err)}`,
      fix: 'Debug with: node scripts/audit/audit-bmm-dependencies.js --dry-run',
    }];
  }

  const csvRows = readExistingCsv(csvAbs);
  const claudeSkillsRoot = path.join(projectRoot, '.claude', 'skills');
  const { _tripleKey } = bmmDepsInternal;

  const scanTripleKeys = new Set(scanRows.map(_tripleKey));
  const csvTripleKeys = new Set(csvRows.map(_tripleKey));

  const AUTO_SCAN = 'auto-scan';
  const isAutoScan = (r) => String(r.registered_by || '').toLowerCase().trim() === AUTO_SCAN;

  // Category 1: stale-autoscan — auto-scan rows whose triple is not in scan output.
  const staleEntries = csvRows
    .filter(isAutoScan)
    .filter(r => !scanTripleKeys.has(_tripleKey(r)));
  const staleSkillGone = staleEntries.filter(r =>
    !fs.existsSync(path.join(claudeSkillsRoot, r.skill_name))).sort(_bmmRowCmp);
  const staleDepRemoved = staleEntries.filter(r =>
    fs.existsSync(path.join(claudeSkillsRoot, r.skill_name))).sort(_bmmRowCmp);

  // Category 2: unregistered-custom-skill — scan sees source_module=unknown,
  // CSV doesn't have this triple (FR17).
  const unregisteredCustom = scanRows
    .filter(r => r.source_module === 'unknown')
    .filter(r => !csvTripleKeys.has(_tripleKey(r)))
    .sort(_bmmRowCmp);

  // Category 3: missing-scan-target — MANUAL CSV row (non-auto-scan) whose
  // skill directory is absent on disk. Applies regardless of `source_module`
  // (R2-1 fix): previously restricted to known-prefix rows, which silently
  // dropped manually-registered custom skills (`source_module: 'unknown'`)
  // whose dirs were later deleted. The `!isAutoScan` predicate is what
  // prevents Cat 1/Cat 3 double-count, not the prefix restriction.
  const missingScanTarget = csvRows
    .filter(r => !isAutoScan(r))
    .filter(r => !fs.existsSync(path.join(claudeSkillsRoot, r.skill_name)))
    .sort(_bmmRowCmp);

  // Category 4: scan-vs-csv-mismatch — first-party (known-prefix) scan triple
  // absent from CSV. The truthiness check on `source_module` rejects both
  // undefined and empty-string values (both falsy in JS); an explicit
  // `!== ''` conjunct would be dead code.
  const scanVsCsvMismatch = scanRows
    .filter(r => r.source_module && r.source_module !== 'unknown')
    .filter(r => !csvTripleKeys.has(_tripleKey(r)))
    .sort(_bmmRowCmp);

  const totalDrift = staleEntries.length + unregisteredCustom.length
    + missingScanTarget.length + scanVsCsvMismatch.length;

  // All clean — emit single success finding.
  if (totalDrift === 0) {
    const autoCount = csvRows.filter(isAutoScan).length;
    const manualCount = csvRows.length - autoCount;
    return [{
      name: 'BMM dependencies: registry consistent',
      passed: true,
      info: `${autoCount} auto-scan + ${manualCount} manual rows, no drift`,
    }];
  }

  // Emit findings per-category (deterministic order per AC8).
  const results = [];

  // Category 1: stale-autoscan.
  if (staleEntries.length >= BMM_DRIFT_SUMMARY_THRESHOLD) {
    results.push({
      name: `BMM dependencies: stale-autoscan (${staleEntries.length} findings)`,
      passed: false,
      softWarning: true,
      warning: `${staleEntries.length} stale entries detected — likely systemic cause (empty .claude/skills/, wholesale migration, etc.)`,
      fix: 'Run: node scripts/audit/audit-bmm-dependencies.js --dry-run to see individual drift entries; regenerate with: node scripts/audit/audit-bmm-dependencies.js',
    });
  } else {
    staleSkillGone.forEach(r => {
      results.push({
        name: `BMM dependencies: [stale:skill-gone] ${r.skill_name} → ${r.bmm_agent}`,
        passed: false,
        softWarning: true,
        warning: `auto-scan row references skill directory '${r.skill_name}' which is not present on disk`,
        fix: 'Remove the row or restore the skill; regenerate with: node scripts/audit/audit-bmm-dependencies.js',
      });
    });
    staleDepRemoved.forEach(r => {
      results.push({
        name: `BMM dependencies: [stale:dep-removed] ${r.skill_name} → ${r.bmm_agent}`,
        passed: false,
        softWarning: true,
        warning: `auto-scan row for (${r.skill_name}, ${r.bmm_agent}, ${r.dependency_type}) no longer matches scan output`,
        fix: 'Regenerate with: node scripts/audit/audit-bmm-dependencies.js',
      });
    });
  }

  // Category 2: unregistered-custom-skill (FR17).
  if (unregisteredCustom.length >= BMM_DRIFT_SUMMARY_THRESHOLD) {
    results.push({
      name: `BMM dependencies: unregistered-custom-skill (${unregisteredCustom.length} findings)`,
      passed: false,
      softWarning: true,
      warning: `${unregisteredCustom.length} custom skills detected that are not in the registry — future upgrades won't validate them`,
      fix: 'Register each by adding a row to _bmad/_config/bmm-dependencies.csv, or regenerate auto-scan with: node scripts/audit/audit-bmm-dependencies.js',
    });
  } else {
    unregisteredCustom.forEach(r => {
      results.push({
        name: `BMM dependencies: [unregistered] ${r.skill_name} → ${r.bmm_agent}`,
        passed: false,
        softWarning: true,
        warning: `custom skill not in registry — future upgrades won't validate it`,
        // Literal `<YYYY-MM-DD>` placeholder rather than today's date: (a) matches
        // the spec's AC4 template wording, (b) keeps AC8 output deterministic
        // across UTC midnight, (c) correctly prompts the operator to substitute
        // the date they're actually registering on.
        fix:
          'Register this skill by adding a row to _bmad/_config/bmm-dependencies.csv:\n'
          + `  ${r.skill_name},${r.bmm_agent},${r.dependency_type},${r.source_module},your-email@example.com,<YYYY-MM-DD>\n`
          + '\nOr regenerate the auto-scan baseline with:\n'
          + '  node scripts/audit/audit-bmm-dependencies.js',
      });
    });
  }

  // Category 3: missing-scan-target.
  if (missingScanTarget.length >= BMM_DRIFT_SUMMARY_THRESHOLD) {
    results.push({
      name: `BMM dependencies: missing-scan-target (${missingScanTarget.length} findings)`,
      passed: false,
      softWarning: true,
      warning: `${missingScanTarget.length} registry rows reference skills not present on disk`,
      fix: 'Either add the skills back or run: node scripts/audit/audit-bmm-dependencies.js to reconcile',
    });
  } else {
    missingScanTarget.forEach(r => {
      results.push({
        name: `BMM dependencies: [missing-target] ${r.skill_name}`,
        passed: false,
        softWarning: true,
        warning: `registry row references skill '${r.skill_name}' (${r.source_module}) which is not present on disk`,
        fix: 'Either add the skill back or run: node scripts/audit/audit-bmm-dependencies.js to reconcile',
      });
    });
  }

  // Category 4: scan-vs-csv-mismatch.
  if (scanVsCsvMismatch.length >= BMM_DRIFT_SUMMARY_THRESHOLD) {
    results.push({
      name: `BMM dependencies: scan-vs-csv-mismatch (${scanVsCsvMismatch.length} findings)`,
      passed: false,
      softWarning: true,
      warning: `${scanVsCsvMismatch.length} first-party dependencies in scan output not reflected in registry`,
      fix: 'Run: node scripts/audit/audit-bmm-dependencies.js to sync registry with current scan output',
    });
  } else {
    scanVsCsvMismatch.forEach(r => {
      results.push({
        name: `BMM dependencies: [drift] ${r.skill_name} → ${r.bmm_agent}`,
        passed: false,
        softWarning: true,
        warning: `first-party dependency (${r.skill_name}, ${r.bmm_agent}, ${r.dependency_type}) is in scan output but not the registry`,
        fix: 'Run: node scripts/audit/audit-bmm-dependencies.js to sync',
      });
    });
  }

  return results;
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

module.exports = {
  checkTaxonomy,
  loadSkillManifest,
  checkModuleSkillWrappers,
  checkBmmDependencies,
  // Exposed for tests: allow direct verification of the summary-mode threshold
  // without mutating a copy of the check function.
  BMM_DRIFT_SUMMARY_THRESHOLD,
};
