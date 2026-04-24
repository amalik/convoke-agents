#!/usr/bin/env node

'use strict';

/**
 * @module scripts/audit/validate-marketplace
 *
 * Story v63-3-1 (Epic 3 / FR19 / FR20 / NFR11 / NFR13 / FM5-1): pre-submission
 * local validator for `.claude-plugin/marketplace.json`. Gate for Story 3.3
 * (submit marketplace registry PR) — operators must run this cleanly before
 * opening the PR to `bmad-plugins-marketplace`.
 *
 * Bin entry: `convoke-validate-marketplace` (see package.json).
 *
 * Six checks (each returns `{passed, error?, warning?, info?}` — same shape
 * as Story 2.2's `checkBmmDependencies` findings):
 *   1. `validateMarketplaceJson` — file exists + parseable JSON.
 *   2. `validateTopLevelFields` — required fields present with correct types.
 *   3. `validatePluginEntry` — plugin entry structure + plugin invariants.
 *   4. `auditSkillDirs` (FM5-1) — each `skills[]` path is a dir with v6.3 SKILL.md.
 *   5. `validateModuleYaml` — module.yaml exists + parseable + required fields.
 *   6. `checkVersionDrift` — `marketplace.json.plugins[0].version` vs `package.json.version`.
 *
 * Exit codes: 0 all passed / 1 any hard failure / --dry-run always 0.
 */

const fs = require('fs-extra');
const path = require('path');
const yaml = require('js-yaml');
const chalk = require('chalk');
const { findProjectRoot } = require('../update/lib/utils');
// R2-H4: hoist AGENT_IDS to module scope (was require()'d inline inside
// validatePluginEntry — Pattern 1 smell; also enables set-identity match).
const { AGENT_IDS } = require('../update/lib/agent-registry');

// ─── Constants ────────────────────────────────────────────────────

const MARKETPLACE_REL = '.claude-plugin/marketplace.json';
const MODULE_YAML_REL = '_bmad/bme/_vortex/module.yaml';
const EXPECTED_PLUGIN_NAME = 'convoke-vortex';
const EXPECTED_MODULE_CODE = 'bme';
const REQUIRED_TOP_FIELDS = ['name', 'owner', 'license', 'repository', 'keywords', 'plugins'];
const REQUIRED_PLUGIN_FIELDS = ['name', 'source', 'description', 'version', 'author', 'skills'];
const REQUIRED_MODULE_YAML_FIELDS = ['code', 'name', 'description'];
// R1-M2: cap on SKILL.md size for the frontmatter scan. A well-formed v6.3
// SKILL.md is well under 100 KB; anything past 1 MB is a red flag and could
// DoS this auditor if copy-pasted from a large binary. feedback_path_safety
// dictates failing loud on suspicious inputs rather than silently reading.
const SKILL_MD_MAX_BYTES = 1_000_000;

// ─── Check helpers ────────────────────────────────────────────────

/**
 * Parse `.claude-plugin/marketplace.json`. Returns `{passed, error?, parsed?}`.
 * Caller re-uses `parsed` for subsequent structural checks.
 */
function validateMarketplaceJson(projectRoot) {
  const name = 'marketplace.json — parseable';
  const filePath = path.join(projectRoot, MARKETPLACE_REL);
  if (!fs.existsSync(filePath)) {
    return {
      name,
      passed: false,
      error: `${MARKETPLACE_REL} not found — run Story 3.1 migration to create it.`,
    };
  }
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    const parsed = JSON.parse(raw);
    return { name, passed: true, info: `parsed successfully (${raw.length} bytes)`, parsed };
  } catch (err) {
    return {
      name,
      passed: false,
      error: `${MARKETPLACE_REL} is not valid JSON — ${(err && err.message) || String(err)}`,
    };
  }
}

/**
 * Confirm all required top-level fields present + correct types.
 */
function validateTopLevelFields(parsed) {
  const name = 'marketplace.json — required top-level fields';
  if (!parsed || typeof parsed !== 'object') {
    return { name, passed: false, error: 'parsed JSON is not an object' };
  }
  const missing = REQUIRED_TOP_FIELDS.filter(f => !(f in parsed));
  if (missing.length > 0) {
    return { name, passed: false, error: `missing required field(s): ${missing.join(', ')}` };
  }
  const typeErrors = [];
  if (typeof parsed.name !== 'string' || parsed.name.length === 0) typeErrors.push('name must be non-empty string');
  if (typeof parsed.owner !== 'object' || !parsed.owner || typeof parsed.owner.name !== 'string') typeErrors.push('owner must be object with `name` string');
  if (typeof parsed.license !== 'string') typeErrors.push('license must be string');
  if (typeof parsed.repository !== 'string') typeErrors.push('repository must be string');
  if (!Array.isArray(parsed.keywords) || parsed.keywords.some(k => typeof k !== 'string')) typeErrors.push('keywords must be array of strings');
  if (!Array.isArray(parsed.plugins) || parsed.plugins.length !== 1) typeErrors.push('plugins must be array with exactly 1 entry');
  if (typeErrors.length > 0) {
    return { name, passed: false, error: typeErrors.join('; ') };
  }
  return { name, passed: true, info: `${REQUIRED_TOP_FIELDS.length} required fields present; 1 plugin entry` };
}

/**
 * Validate the plugin entry — required fields, name invariant, types.
 */
function validatePluginEntry(parsed) {
  const name = 'marketplace.json — plugin entry structure';
  const plugin = parsed && parsed.plugins && parsed.plugins[0];
  if (!plugin || typeof plugin !== 'object') {
    return { name, passed: false, error: 'plugins[0] is not an object' };
  }
  const missing = REQUIRED_PLUGIN_FIELDS.filter(f => !(f in plugin));
  if (missing.length > 0) {
    return { name, passed: false, error: `plugins[0] missing required field(s): ${missing.join(', ')}` };
  }
  const typeErrors = [];
  // R1-M8: short-circuit — when plugin.name fails the non-empty-string
  // check, skip the invariant-match check to avoid emitting double errors
  // for one root cause.
  const nameTypeOk = typeof plugin.name === 'string' && plugin.name.length > 0;
  if (!nameTypeOk) {
    typeErrors.push('plugins[0].name must be non-empty string');
  } else if (plugin.name !== EXPECTED_PLUGIN_NAME) {
    typeErrors.push(`plugins[0].name must be "${EXPECTED_PLUGIN_NAME}" per Architecture Decision 5 (FR20); got "${plugin.name}"`);
  }
  if (typeof plugin.source !== 'string') typeErrors.push('plugins[0].source must be string');
  if (typeof plugin.description !== 'string' || plugin.description.length === 0) typeErrors.push('plugins[0].description must be non-empty string');
  if (typeof plugin.version !== 'string') typeErrors.push('plugins[0].version must be string');
  if (typeof plugin.author !== 'object' || !plugin.author || typeof plugin.author.name !== 'string') typeErrors.push('plugins[0].author must be object with `name` string');
  if (!Array.isArray(plugin.skills) || plugin.skills.some(s => typeof s !== 'string')) typeErrors.push('plugins[0].skills must be array of strings');
  // R1-D3 + R2-H4: skill IDENTITY invariant — marketplace.json must list
  // exactly the registered Vortex agents, with matching basenames. R1-D3
  // only enforced length equality; a renamed/typoed path (e.g., British
  // spelling `contextualisation-expert`) would pass a length check and
  // fail silently downstream. R2-H4 upgrades to set-identity match.
  if (Array.isArray(plugin.skills) && plugin.skills.every(s => typeof s === 'string')) {
    const actualBasenames = new Set(plugin.skills.map(s => path.basename(s.replace(/\/+$/, ''))));
    const expected = new Set(AGENT_IDS);
    const missing = [...expected].filter(id => !actualBasenames.has(id));
    const unexpected = [...actualBasenames].filter(id => !expected.has(id));
    if (missing.length > 0 || unexpected.length > 0) {
      const parts = [];
      if (missing.length > 0) parts.push(`missing Vortex agent(s): ${missing.join(', ')}`);
      if (unexpected.length > 0) parts.push(`unexpected skill path(s): ${unexpected.join(', ')}`);
      typeErrors.push(`plugins[0].skills identity mismatch — ${parts.join('; ')}`);
    }
  }
  if (typeErrors.length > 0) {
    return { name, passed: false, error: typeErrors.join('; ') };
  }
  return { name, passed: true, info: `plugin "${plugin.name}" v${plugin.version} with ${plugin.skills.length} skills` };
}

/**
 * FM5-1: each `skills[]` path resolves to a directory on disk containing a
 * SKILL.md with v6.3-compliant frontmatter (`name` + `description`).
 */
function auditSkillDirs(skills, projectRoot) {
  const name = 'skills[] paths — FM5-1 audit';
  if (!Array.isArray(skills)) {
    return { name, passed: false, error: 'plugins[0].skills is not an array' };
  }
  const errors = [];
  // R1-M2: normalized project root with trailing sep for containment checks.
  const rootWithSep = projectRoot.endsWith(path.sep) ? projectRoot : projectRoot + path.sep;
  for (const rel of skills) {
    if (typeof rel !== 'string' || rel.length === 0) {
      errors.push(`invalid path: ${JSON.stringify(rel)}`);
      continue;
    }
    const absDir = path.resolve(projectRoot, rel);
    if (!fs.existsSync(absDir)) {
      errors.push(`path does not exist: ${rel}`);
      continue;
    }
    // R1-M2 + R2-H2 + R2-H3: symlink guard — reject skill-dir symlinks
    // that escape the project root. feedback_path_safety requires safety
    // analysis for any script walking operator-controlled paths.
    //
    // R2-H2: wrap lstatSync/realpathSync in try/catch to survive TOCTOU
    // race (concurrent delete between existsSync and lstatSync) or broken
    // symlink targets — emit a clean per-path error instead of crashing
    // the whole audit.
    //
    // R2-H3: strict `startsWith(rootWithSep)` — symlink resolving exactly
    // to projectRoot is never a valid skill dir (later SKILL.md check
    // would fail with a misleading "missing SKILL.md" message).
    try {
      const lstat = fs.lstatSync(absDir);
      if (lstat.isSymbolicLink()) {
        const realDir = fs.realpathSync(absDir);
        if (!realDir.startsWith(rootWithSep)) {
          errors.push(`symlink escapes project root: ${rel} → ${realDir}`);
          continue;
        }
      }
    } catch (err) {
      errors.push(`cannot stat path: ${rel} — ${(err && err.message) || String(err)}`);
      continue;
    }
    if (!fs.statSync(absDir).isDirectory()) {
      errors.push(`path is not a directory: ${rel}`);
      continue;
    }
    const skillMdPath = path.join(absDir, 'SKILL.md');
    if (!fs.existsSync(skillMdPath)) {
      errors.push(`missing SKILL.md: ${rel}/SKILL.md`);
      continue;
    }
    // R1-M2: size guard — refuse to read pathologically large SKILL.md.
    const skillMdStat = fs.statSync(skillMdPath);
    if (skillMdStat.size > SKILL_MD_MAX_BYTES) {
      errors.push(`SKILL.md exceeds ${SKILL_MD_MAX_BYTES} bytes (${skillMdStat.size}): ${rel}/SKILL.md`);
      continue;
    }
    // Minimal v6.3 frontmatter check: must have `name:` and `description:` keys.
    const content = fs.readFileSync(skillMdPath, 'utf8');
    const match = content.match(/^---\s*\n([\s\S]*?)\n---/);
    if (!match) {
      errors.push(`missing frontmatter block: ${rel}/SKILL.md`);
      continue;
    }
    let frontmatter;
    try {
      frontmatter = yaml.load(match[1]);
    } catch (err) {
      errors.push(`invalid frontmatter YAML: ${rel}/SKILL.md — ${err.message}`);
      continue;
    }
    if (!frontmatter || typeof frontmatter !== 'object') {
      errors.push(`frontmatter not an object: ${rel}/SKILL.md`);
      continue;
    }
    if (!frontmatter.name || typeof frontmatter.name !== 'string') {
      errors.push(`frontmatter missing non-empty 'name': ${rel}/SKILL.md`);
      continue;
    }
    if (!frontmatter.description || typeof frontmatter.description !== 'string') {
      errors.push(`frontmatter missing non-empty 'description': ${rel}/SKILL.md`);
      continue;
    }
  }
  if (errors.length > 0) {
    return { name, passed: false, error: errors.join('; ') };
  }
  return { name, passed: true, info: `${skills.length} skill dirs audited; all v6.3-compliant` };
}

/**
 * Validate `_bmad/bme/_vortex/module.yaml` per AC2 / NFR13.
 */
function validateModuleYaml(projectRoot) {
  const name = 'module.yaml — parseable + required fields';
  const filePath = path.join(projectRoot, MODULE_YAML_REL);
  if (!fs.existsSync(filePath)) {
    return {
      name,
      passed: false,
      error: `${MODULE_YAML_REL} not found — module_definition target required by FR20`,
    };
  }
  let parsed;
  try {
    parsed = yaml.load(fs.readFileSync(filePath, 'utf8'));
  } catch (err) {
    return {
      name,
      passed: false,
      error: `${MODULE_YAML_REL} is not valid YAML — ${(err && err.message) || String(err)}`,
    };
  }
  if (!parsed || typeof parsed !== 'object') {
    return { name, passed: false, error: `${MODULE_YAML_REL} parsed YAML is not an object` };
  }
  const missing = REQUIRED_MODULE_YAML_FIELDS.filter(f => !(f in parsed));
  if (missing.length > 0) {
    return { name, passed: false, error: `${MODULE_YAML_REL} missing required field(s): ${missing.join(', ')}` };
  }
  // R1-M1: type guards — YAML can coerce `code: 01` → number, `name: null`
  // → null, etc. Without string-type assertions the EXPECTED_MODULE_CODE
  // equality check below would silently pass a bad module.yaml.
  const typeErrors = [];
  if (typeof parsed.code !== 'string' || parsed.code.length === 0) {
    typeErrors.push('code must be non-empty string');
  }
  if (typeof parsed.name !== 'string' || parsed.name.length === 0) {
    typeErrors.push('name must be non-empty string');
  }
  if (typeof parsed.description !== 'string' || parsed.description.length === 0) {
    typeErrors.push('description must be non-empty string');
  }
  if (typeErrors.length > 0) {
    return { name, passed: false, error: `${MODULE_YAML_REL} field type errors: ${typeErrors.join('; ')}` };
  }
  if (parsed.code !== EXPECTED_MODULE_CODE) {
    return {
      name,
      passed: false,
      error: `${MODULE_YAML_REL} has code="${parsed.code}"; expected "${EXPECTED_MODULE_CODE}" (must match parent directory convention)`,
    };
  }
  return { name, passed: true, info: `code=${parsed.code}; ${Object.keys(parsed).length} fields` };
}

/**
 * Warn (not error) if `marketplace.json.plugins[0].version` differs from
 * `package.json.version`. Ship-time drift is expected; publish-gate escalates.
 */
function checkVersionDrift(marketplaceVersion, pkgVersion) {
  const name = 'version alignment (marketplace.json vs package.json)';
  if (!marketplaceVersion || !pkgVersion) {
    return { name, passed: false, error: 'one or both versions missing' };
  }
  // R1-M6 + R2-M5: reject literal "undefined"/"null" AND whitespace-only
  // strings. Build scripts with `VERSION=""` can inject empty or blank
  // version strings that pass the outer truthiness guard (well, empty
  // string is falsy so the outer guard catches it, but `"   "` and
  // multi-whitespace are truthy). Also rejects literal "undefined"/"null"
  // from stringified-undefined bugs in upstream tooling.
  for (const [label, value] of [['marketplaceVersion', marketplaceVersion], ['pkgVersion', pkgVersion]]) {
    if (typeof value !== 'string' || value === 'undefined' || value === 'null' || value.trim() === '') {
      return { name, passed: false, error: `${label} is not a valid version string: ${JSON.stringify(value)}` };
    }
  }
  if (marketplaceVersion === pkgVersion) {
    return { name, passed: true, info: `both at ${pkgVersion}` };
  }
  return {
    name,
    passed: true, // soft warning, not hard failure
    warning: `marketplace.json v${marketplaceVersion} vs package.json v${pkgVersion} — expected during pre-4.0 dev; escalates to ERROR at Story 3.3's publish gate`,
  };
}

// ─── Main dispatcher ─────────────────────────────────────────────

function renderHelp() {
  console.log('');
  console.log(chalk.bold('convoke-validate-marketplace') + ' — pre-submission validator for BMAD marketplace metadata');
  console.log('');
  console.log('Usage:');
  console.log('  convoke-validate-marketplace [options]');
  console.log('');
  console.log('Options:');
  console.log('  --verbose, -v   Print per-check pass/fail with info lines.');
  console.log('  --dry-run       Run all checks; exit 0 regardless of outcome (preview mode).');
  console.log('  --help, -h      Show this help.');
  console.log('');
  console.log('Exit codes:');
  console.log('  0  all checks passed (or any outcome under --dry-run).');
  console.log('  1  one or more hard failures.');
  console.log('');
}

function renderResults(findings, verbose) {
  console.log('');
  console.log(chalk.cyan.bold('Marketplace validation:'));
  let hardFails = 0;
  let warnings = 0;
  for (const f of findings) {
    const name = typeof f.name === 'string' ? f.name : '(unnamed)';
    if (f.passed && !f.warning) {
      console.log(chalk.green(`  ✓ ${name}`));
      if (verbose && typeof f.info === 'string' && f.info.length > 0) {
        console.log(chalk.gray(`    ${f.info}`));
      }
    } else if (f.passed && f.warning) {
      warnings += 1;
      console.log(chalk.yellow(`  ⚠ ${name}`));
      console.log(chalk.yellow(`    ${f.warning}`));
    } else {
      hardFails += 1;
      console.log(chalk.red(`  ✗ ${name}`));
      if (typeof f.error === 'string' && f.error.length > 0) {
        console.log(chalk.red(`    ${f.error}`));
      }
    }
  }
  console.log('');
  if (hardFails === 0 && warnings === 0) {
    console.log(chalk.green(`  All ${findings.length} marketplace checks passed.`));
  } else if (hardFails === 0) {
    console.log(chalk.yellow(`  ${findings.length - warnings} check(s) passed; ${warnings} warning(s).`));
  } else {
    console.log(chalk.red(`  ${hardFails} hard failure(s); ${warnings} warning(s).`));
  }
  console.log('');
  return hardFails;
}

function parseArgs(argv) {
  const flags = { verbose: false, dryRun: false, help: false };
  for (const a of argv) {
    if (a === '--help' || a === '-h') flags.help = true;
    else if (a === '--verbose' || a === '-v') flags.verbose = true;
    else if (a === '--dry-run') flags.dryRun = true;
  }
  return flags;
}

function runValidation(projectRoot) {
  const findings = [];
  const step1 = validateMarketplaceJson(projectRoot);
  findings.push(step1);
  if (!step1.passed) return findings;
  const parsed = step1.parsed;

  findings.push(validateTopLevelFields(parsed));
  findings.push(validatePluginEntry(parsed));

  const plugin = parsed && parsed.plugins && parsed.plugins[0];
  if (plugin && Array.isArray(plugin.skills)) {
    findings.push(auditSkillDirs(plugin.skills, projectRoot));
  }

  findings.push(validateModuleYaml(projectRoot));

  const pkg = require(path.join(projectRoot, 'package.json'));
  const marketplaceVersion = plugin && plugin.version;
  findings.push(checkVersionDrift(marketplaceVersion, pkg.version));

  return findings;
}

function main(argv) {
  const flags = parseArgs(argv);
  if (flags.help) { renderHelp(); return 0; }

  const projectRoot = findProjectRoot();
  if (!projectRoot) {
    console.log(chalk.red('  ✗ Not inside a Convoke project (no _bmad/ directory found).'));
    console.log(chalk.gray('    Run: npx -p convoke-agents convoke-install'));
    return 1;
  }

  const findings = runValidation(projectRoot);
  const hardFails = renderResults(findings, flags.verbose);
  if (flags.dryRun) return 0;
  return hardFails > 0 ? 1 : 0;
}

// ─── Exports ─────────────────────────────────────────────────────

module.exports = {
  main,
  runValidation,
  // R2-L5 pattern (from Story 2.3): Object.freeze prevents test-order leaks.
  _internal: Object.freeze({
    parseArgs,
    renderResults,
    validateMarketplaceJson,
    validateTopLevelFields,
    validatePluginEntry,
    auditSkillDirs,
    validateModuleYaml,
    checkVersionDrift,
    MARKETPLACE_REL,
    MODULE_YAML_REL,
    EXPECTED_PLUGIN_NAME,
    EXPECTED_MODULE_CODE,
    REQUIRED_TOP_FIELDS,
    REQUIRED_PLUGIN_FIELDS,
    REQUIRED_MODULE_YAML_FIELDS,
  }),
};

if (require.main === module) {
  process.exit(main(process.argv.slice(2)));
}
