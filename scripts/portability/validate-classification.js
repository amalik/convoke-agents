#!/usr/bin/env node
/**
 * validate-classification.js — Story sp-1-3
 *
 * Read-only validator for the classified skill manifest. Checks completeness,
 * vocabulary correctness, and dependency integrity. Writes a markdown report.
 *
 * Usage:
 *   node scripts/portability/validate-classification.js
 *
 * Exit codes:
 *   0 — PASS (no hard errors; warnings allowed)
 *   1 — FAIL (one or more hard findings)
 *
 * Hard findings (exit 1):
 *   [MISSING]         empty tier or intent
 *   [INVALID]         out-of-vocabulary tier or intent
 *   [BROKEN-DEP]      file-path dep doesn't resolve (or escapes project root)
 *   [BAD-CONFIG-DEP]  malformed config: dep
 *   [ORPHAN-DEP]      bare skill-name dep not in manifest
 *
 * Warnings (exit 0):
 *   [MISSING-PREREQS] pipeline skill (non-meta) with empty deps
 *
 * The script is read-only EXCEPT for the report file. It does not modify
 * skill-manifest.csv, the schema doc, or any source files.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { findProjectRoot } = require('../update/lib/utils');
const { readManifest } = require('./manifest-csv');

// =============================================================================
// CONSTANTS — must match scripts/portability/classify-skills.js
// =============================================================================

const VALID_TIERS = ['standalone', 'light-deps', 'pipeline'];
const VALID_INTENTS = [
  'think-through-problem',
  'define-what-to-build',
  'review-something',
  'write-documentation',
  'plan-your-work',
  'test-your-code',
  'discover-product-fit',
  'assess-readiness',
  'meta-platform',
];

const CONFIG_KEY_PATTERN = /^config:[a-z_][a-z0-9_]*$/;

// =============================================================================
// VALIDATION CHECKS
// =============================================================================

/**
 * Check completeness + vocabulary for a single row.
 * Returns an array of findings (may be empty).
 */
function checkRowVocabulary(row, header) {
  const findings = [];
  const name = row[header.indexOf('name')];
  const tier = row[header.indexOf('tier')];
  const intent = row[header.indexOf('intent')];

  if (!tier) {
    findings.push({
      type: '[MISSING]',
      skill: name,
      detail: 'tier is empty',
      recommendation: 'Run classify-skills.js to populate, or hand-edit if classifier produces a heuristic miss',
    });
  } else if (!VALID_TIERS.includes(tier)) {
    findings.push({
      type: '[INVALID]',
      skill: name,
      detail: `tier="${tier}" (not in canonical set: ${VALID_TIERS.join(', ')})`,
      recommendation: 'Fix the tier value to one of the canonical values',
    });
  }

  if (!intent) {
    findings.push({
      type: '[MISSING]',
      skill: name,
      detail: 'intent is empty',
      recommendation: 'Run classify-skills.js to populate, or hand-edit if classifier produces a heuristic miss',
    });
  } else if (!VALID_INTENTS.includes(intent)) {
    findings.push({
      type: '[INVALID]',
      skill: name,
      detail: `intent="${intent}" (not in canonical set)`,
      recommendation: 'Fix the intent value to one of the 9 canonical categories from portability-schema.md',
    });
  }

  return findings;
}

/**
 * Check that a project-relative path stays inside projectRoot.
 */
function isInsideProjectRoot(absPath, projectRoot) {
  const rootWithSep = projectRoot.endsWith(path.sep) ? projectRoot : projectRoot + path.sep;
  return absPath === projectRoot || absPath.startsWith(rootWithSep);
}

/**
 * Resolve a relative dep against a skill's source tree.
 *
 * Why this is non-trivial: sp-1-2's classifier flattens content from
 * SKILL.md + workflow.md + step files into one blob, then extracts
 * relative-template references. The references are correct relative to
 * the file they appeared in (e.g., a step file in `steps-c/`), but the
 * validator only knows the skill's SKILL.md path. Naïvely resolving
 * `../templates/X` against `path.dirname(SKILL.md)` gives the wrong
 * answer when the reference originated in a step subdirectory.
 *
 * Strategy: try the SKILL.md directory first (the simple case), then
 * search the skill's subtree by basename. The first existing match wins.
 *
 * Returns one of:
 *   - {string} absolute resolved path (success)
 *   - {{ error: 'escapes project root' | 'not found', resolved: string }} (failure)
 *
 * Note: never returns null. The caller discriminates with
 * `typeof result === 'string'`.
 */
function resolveRelativeDep(dep, skillDir, projectRoot) {
  // Attempt 1: resolve against the skill's own directory (handles `./templates/X`)
  const direct = path.resolve(skillDir, dep);
  if (isInsideProjectRoot(direct, projectRoot) && fs.existsSync(direct)) {
    return direct;
  }

  // Attempt 2: search the skill subtree for a file with the same basename.
  // sp-1-2's classifier stripped the originating step-file directory context,
  // so we walk the skill dir to recover it.
  const basename = path.basename(dep);
  try {
    const found = findFileInSubtree(skillDir, basename, projectRoot);
    if (found) return found;
  } catch (e) {
    // ignore stat errors during subtree walk
  }

  // Attempt 3 (escape check): if the direct resolution escaped the project
  // root, surface that as the failure reason; otherwise fall through to "missing".
  if (!isInsideProjectRoot(direct, projectRoot)) {
    return { error: 'escapes project root', resolved: direct };
  }
  return { error: 'not found', resolved: direct };
}

/**
 * Walk a directory subtree (bounded to projectRoot) looking for a file
 * matching the target basename. Returns the first absolute match, or null.
 *
 * P3 (sp-1-3 review): symlinks are followed via `fs.statSync` (rather than
 * Dirent.isFile/isDirectory which return false for symlinks). Cycles are
 * prevented with a realpath visited-set.
 *
 * Stops descending at common skip directories to avoid runaway walks.
 */
function findFileInSubtree(dir, targetBasename, projectRoot) {
  const SKIP = new Set(['node_modules', '.git', '_archive']);
  const MAX_DEPTH = 6;
  const visited = new Set();

  function walk(currentDir, depth) {
    if (depth > MAX_DEPTH) return null;
    if (!isInsideProjectRoot(currentDir, projectRoot)) return null;

    // Cycle protection via realpath (follows symlinks)
    let realDir;
    try {
      realDir = fs.realpathSync(currentDir);
    } catch (e) {
      return null;
    }
    if (visited.has(realDir)) return null;
    visited.add(realDir);

    let entries;
    try {
      entries = fs.readdirSync(currentDir);
    } catch (e) {
      return null;
    }

    // Files first (cheap match) — use statSync to follow symlinks
    for (const name of entries) {
      if (name !== targetBasename) continue;
      const fullPath = path.join(currentDir, name);
      try {
        const stat = fs.statSync(fullPath); // follows symlinks
        if (stat.isFile()) return fullPath;
      } catch (e) {
        // broken symlink or stat failure — skip
      }
    }

    // Then recurse into subdirectories (also follows symlinks via statSync)
    for (const name of entries) {
      if (SKIP.has(name)) continue;
      const fullPath = path.join(currentDir, name);
      try {
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
          const found = walk(fullPath, depth + 1);
          if (found) return found;
        }
      } catch (e) {
        // broken symlink or stat failure — skip
      }
    }
    return null;
  }

  return walk(dir, 0);
}

/**
 * Check dependency entries for one row. Returns an array of findings.
 *
 * @param {string[]} row
 * @param {string[]} header
 * @param {string} projectRoot
 * @param {Set<string>} validSkillNames
 */
function checkRowDependencies(row, header, projectRoot, validSkillNames) {
  const findings = [];
  const name = row[header.indexOf('name')];
  const skillPath = row[header.indexOf('path')];
  const depsStr = row[header.indexOf('dependencies')];

  if (!depsStr) return findings;

  const deps = depsStr.split(';').filter((d) => d.length > 0);
  const skillDir = path.dirname(path.join(projectRoot, skillPath));

  for (const dep of deps) {
    // 1. Self-reference: skip silently
    if (dep === name) continue;

    // 2. Absolute project-relative file path
    if (dep.startsWith('_bmad/')) {
      const absPath = path.join(projectRoot, dep);
      if (!fs.existsSync(absPath)) {
        findings.push({
          type: '[BROKEN-DEP]',
          skill: name,
          detail: `dependency "${dep}" → ${path.relative(projectRoot, absPath)} (does not exist)`,
          recommendation: 'Verify the dep path is correct, or remove the entry if the file was deleted',
        });
      }
      continue;
    }

    // 3. Relative path. sp-1-2's classifier flattens content from SKILL.md +
    // workflow + step files into one blob, so a `../templates/X` reference
    // may have originated in a step subdirectory rather than the SKILL.md
    // directory. resolveRelativeDep handles both: tries SKILL.md first, then
    // searches the skill subtree by basename.
    if (dep.startsWith('./') || dep.startsWith('../')) {
      const result = resolveRelativeDep(dep, skillDir, projectRoot);
      if (typeof result === 'string') {
        // Resolved cleanly to an existing file — no finding
        continue;
      }
      // Failure case: result is { error, resolved }
      const escapesRoot = result && result.error === 'escapes project root';
      findings.push({
        type: '[BROKEN-DEP]',
        skill: name,
        detail: escapesRoot
          ? `relative dep "${dep}" escapes project root (resolves to ${result.resolved})`
          : `relative dep "${dep}" not found in skill subtree (searched ${path.relative(projectRoot, skillDir)} for ${path.basename(dep)})`,
        recommendation: escapesRoot
          ? 'Use a project-relative `_bmad/...` path instead'
          : 'Verify the file exists somewhere in the skill directory tree, or remove the entry',
      });
      continue;
    }

    // 4. Config key
    if (dep.startsWith('config:')) {
      if (!CONFIG_KEY_PATTERN.test(dep)) {
        findings.push({
          type: '[BAD-CONFIG-DEP]',
          skill: name,
          detail: `malformed config dep "${dep}" (must match config:[a-z_][a-z0-9_]*)`,
          recommendation: 'Fix the config key format — lowercase, alphanumeric + underscore only',
        });
      }
      continue;
    }

    // 5. Bare skill name → check membership in manifest
    if (!validSkillNames.has(dep)) {
      findings.push({
        type: '[ORPHAN-DEP]',
        skill: name,
        detail: `skill-name dep "${dep}" not found in manifest`,
        recommendation: 'Dependency may have been removed; re-run classify-skills.js or remove the entry',
      });
    }
  }

  return findings;
}

/**
 * Check Tier 3 prerequisite documentation. Returns warning findings.
 */
function checkTier3Prereqs(row, header) {
  const tier = row[header.indexOf('tier')];
  const intent = row[header.indexOf('intent')];
  const deps = row[header.indexOf('dependencies')];
  const name = row[header.indexOf('name')];

  if (tier !== 'pipeline') return [];
  if (intent === 'meta-platform') return []; // framework-internal exemption
  if (deps && deps.length > 0) return [];

  return [
    {
      type: '[MISSING-PREREQS]',
      skill: name,
      detail: 'pipeline skill has empty dependencies column',
      recommendation: 'Known limitation of sp-1-2 classifier (does not extract artifact-consumption patterns) — not a fix in this story',
    },
  ];
}

// =============================================================================
// REPORT GENERATION
// =============================================================================

const FINDING_TYPES = [
  '[MISSING]',
  '[INVALID]',
  '[BROKEN-DEP]',
  '[BAD-CONFIG-DEP]',
  '[ORPHAN-DEP]',
  '[MISSING-PREREQS]',
];

const HARD_FINDING_TYPES = new Set([
  '[MISSING]',
  '[INVALID]',
  '[BROKEN-DEP]',
  '[BAD-CONFIG-DEP]',
  '[ORPHAN-DEP]',
]);

function escapeMarkdownTableCell(s) {
  if (s == null) return '';
  return String(s).replace(/\|/g, '\\|').replace(/\n/g, ' ');
}

function renderReport(date, totalSkills, status, findings) {
  const counts = Object.create(null);
  for (const t of FINDING_TYPES) counts[t] = 0;
  for (const f of findings) counts[f.type]++;

  const lines = [
    '# Portability Classification — Validation Report',
    '',
    `Generated by \`scripts/portability/validate-classification.js\` on ${date}.`,
    '',
    `**Total skills checked:** ${totalSkills}`,
    `**Status:** ${status}`,
    '',
    '## Summary',
    '',
    '| Finding type | Count |',
    '|--------------|-------|',
    `| [MISSING]          | ${counts['[MISSING]']} |`,
    `| [INVALID]          | ${counts['[INVALID]']} |`,
    `| [BROKEN-DEP]       | ${counts['[BROKEN-DEP]']} |`,
    `| [BAD-CONFIG-DEP]   | ${counts['[BAD-CONFIG-DEP]']} |`,
    `| [ORPHAN-DEP]       | ${counts['[ORPHAN-DEP]']} |`,
    `| [MISSING-PREREQS]  | ${counts['[MISSING-PREREQS]']} (warning) |`,
    '',
  ];

  const sectionTitles = {
    '[MISSING]': '[MISSING] — Unclassified rows',
    '[INVALID]': '[INVALID] — Out-of-vocabulary values',
    '[BROKEN-DEP]': "[BROKEN-DEP] — File-path dependencies that don't resolve",
    '[BAD-CONFIG-DEP]': '[BAD-CONFIG-DEP] — Malformed config: dependencies',
    '[ORPHAN-DEP]': "[ORPHAN-DEP] — Skill-name dependencies that don't exist in the manifest",
    '[MISSING-PREREQS]': '[MISSING-PREREQS] — Pipeline skills with empty dependencies (warning)',
  };

  for (const t of FINDING_TYPES) {
    lines.push(`## ${sectionTitles[t]}`);
    lines.push('');
    const rows = findings.filter((f) => f.type === t);
    if (rows.length === 0) {
      lines.push('_None._');
      lines.push('');
      continue;
    }
    lines.push('| Skill | Finding detail | Recommendation |');
    lines.push('|-------|----------------|----------------|');
    for (const r of rows) {
      lines.push(
        `| \`${escapeMarkdownTableCell(r.skill)}\` | ${escapeMarkdownTableCell(r.detail)} | ${escapeMarkdownTableCell(r.recommendation)} |`
      );
    }
    lines.push('');
  }

  return lines.join('\n');
}

// =============================================================================
// MAIN
// =============================================================================

function validate(projectRoot) {
  const manifestPath = path.join(projectRoot, '_bmad', '_config', 'skill-manifest.csv');
  const { header, rows } = readManifest(manifestPath);

  const tierIdx = header.indexOf('tier');
  const intentIdx = header.indexOf('intent');
  const depsIdx = header.indexOf('dependencies');
  if (tierIdx < 0 || intentIdx < 0 || depsIdx < 0) {
    throw new Error(
      'skill-manifest.csv is missing tier/intent/dependencies columns. Run sp-1-1 first.'
    );
  }

  const nameIdx = header.indexOf('name');
  const validSkillNames = new Set(rows.map((r) => r[nameIdx]));

  const findings = [];
  for (const row of rows) {
    // P2 (sp-1-3 review): a malformed row (missing path column, undefined
    // fields) shouldn't crash the entire validator. Catch per-row errors
    // and surface them as a [MISSING] finding so the rest of the manifest
    // still gets validated.
    try {
      findings.push(...checkRowVocabulary(row, header));
      findings.push(...checkRowDependencies(row, header, projectRoot, validSkillNames));
      findings.push(...checkTier3Prereqs(row, header));
    } catch (e) {
      const skillName = row[nameIdx] || '(unknown row)';
      findings.push({
        type: '[MISSING]',
        skill: skillName,
        detail: `row processing failed: ${e.message}`,
        recommendation: 'Inspect this row in skill-manifest.csv for malformed fields (missing columns, undefined path, etc.)',
      });
    }
  }

  return { totalSkills: rows.length, findings };
}

function main() {
  const projectRoot = findProjectRoot();
  let result;
  try {
    result = validate(projectRoot);
  } catch (e) {
    console.error(`ERROR: ${e.message}`);
    process.exit(1);
  }

  const { totalSkills, findings } = result;
  const errorCount = findings.filter((f) => HARD_FINDING_TYPES.has(f.type)).length;
  const warningCount = findings.length - errorCount;
  const status = errorCount === 0 ? 'PASS' : 'FAIL';

  const date = new Date().toISOString().slice(0, 10);
  const report = renderReport(date, totalSkills, status, findings);

  const reportPath = path.join(
    projectRoot,
    '_bmad-output',
    'planning-artifacts',
    'portability-validation-report.md'
  );
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, report, 'utf8');

  // Single-line stdout summary
  if (errorCount === 0) {
    console.log(`PASS: ${totalSkills} skills validated, 0 errors, ${warningCount} warnings`);
  } else {
    const breakdown = {};
    for (const f of findings) {
      if (HARD_FINDING_TYPES.has(f.type)) {
        breakdown[f.type] = (breakdown[f.type] || 0) + 1;
      }
    }
    const breakdownStr = Object.entries(breakdown)
      .map(([k, v]) => `${v} ${k}`)
      .join(', ');
    console.log(
      `FAIL: ${totalSkills} skills checked, ${errorCount} errors (${breakdownStr}), ${warningCount} warnings`
    );
  }

  console.log(`Report written to ${path.relative(projectRoot, reportPath)}`);
  process.exit(errorCount === 0 ? 0 : 1);
}

if (require.main === module) {
  main();
}

module.exports = {
  validate,
  checkRowVocabulary,
  checkRowDependencies,
  checkTier3Prereqs,
  renderReport,
  VALID_TIERS,
  VALID_INTENTS,
  HARD_FINDING_TYPES,
};
