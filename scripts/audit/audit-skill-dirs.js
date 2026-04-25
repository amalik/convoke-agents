#!/usr/bin/env node

'use strict';

/**
 * @module scripts/audit/audit-skill-dirs
 *
 * Story v63-3-2 (Epic 3 / NFR12 + NFR4): runtime audit over ALL
 * `.claude/skills/` directories (~98 on a typical Convoke install).
 * Verifies every skill dir has a `SKILL.md` with v6.3-compliant
 * frontmatter (`name:` + `description:` non-empty strings).
 *
 * Distinct from `validate-marketplace.js`'s `auditSkillDirs`, which is
 * marketplace-pre-submission-scoped (7 Vortex paths only). This tool is
 * full-tree runtime validation; the two coexist as specialists.
 *
 * Bin entry: `convoke-audit-skill-dirs` (see package.json).
 *
 * Hardening (per Story 3.1 R1/R2 patterns + Story 2.x precedents):
 *   - Pattern 1 module structure (shebang + `'use strict'` + `@module` +
 *     `findProjectRoot()` + frozen `_internal`)
 *   - Symlink-escape guard with strict `startsWith(rootWithSep)` (R2-H3)
 *   - TOCTOU try/catch on lstatSync/realpathSync (R2-H2)
 *   - SKILL.md size guard `>= SKILL_MD_MAX_BYTES` (R1-M2 + R2-L1
 *     fix-forward — inclusive upper bound)
 *   - Trim-reject for frontmatter `name`/`description` empty/whitespace
 *     (R1-M6 + R2-M5)
 *   - `--help` short-circuit wins over other parse errors (R2-M5)
 *
 * Exit codes: 0 all passed / 1 any hard failure / --dry-run always 0.
 */

const fs = require('fs-extra');
const path = require('path');
const yaml = require('js-yaml');
const chalk = require('chalk');
const { findProjectRoot } = require('../update/lib/utils');

const SKILLS_REL = '.claude/skills';
// Inclusive upper bound — Story 3.1 R2-L1 fix-forward. Realistic SKILL.md
// is well under 100KB; anything ≥1MB is a red flag (DoS surface for
// unbounded readFileSync).
const SKILL_MD_MAX_BYTES = 1_000_000;

// ─── Per-dir check ────────────────────────────────────────────────

/**
 * Audit a single skill directory.
 * Returns `{passed, error?, info?, realPath?}` per Story 2.2's check shape.
 * R1-H3: post-resolution operations use `effectivePath` (the realpath when
 * symlinked, original path otherwise) so a TOCTOU between the realpath
 * check and the readFileSync can't bypass the containment guard.
 * R1-H4: returns `realPath` so the caller can dedup intra-project symlinks
 * pointing at the same target.
 *
 * @param {string} skillDirAbsPath - Absolute path to the candidate skill dir.
 * @param {string} skillRel - Path relative to project root (for error messages).
 * @param {string} rootWithSep - projectRoot + path.sep (for symlink containment).
 */
function checkSkillDir(skillDirAbsPath, skillRel, rootWithSep) {
  const name = `skill dir: ${skillRel}`;

  // Symlink-escape guard with TOCTOU try/catch (R2-H2 + R1-H2/H3).
  // After resolution, all subsequent ops use `effectivePath` — the realpath
  // (R2-H2: both symlink AND non-symlink branches set it). Closes the
  // TOCTOU window between realpath check and readFileSync.
  let effectivePath;
  let realPath;
  try {
    const lstat = fs.lstatSync(skillDirAbsPath);
    if (lstat.isSymbolicLink()) {
      const realDir = fs.realpathSync(skillDirAbsPath);
      if (!realDir.startsWith(rootWithSep)) {
        return {
          name,
          passed: false,
          error: `symlink escapes project root: ${skillRel} → ${realDir}`,
        };
      }
      effectivePath = realDir;
      realPath = realDir;
    } else {
      // R2-H2: also update `effectivePath` to realPath so post-resolution
      // ops are consistent across symlink and non-symlink branches. R1-H3
      // updated effectivePath only in the symlink branch; on macOS where
      // projectRoot=/var/x resolves to /private/var/x, non-symlink entries
      // had `effectivePath=/var/...` while `rootWithSep=/private/var/...`
      // — defeating the R1-H2 + R1-H3 consistency goal.
      realPath = fs.realpathSync(skillDirAbsPath);
      effectivePath = realPath;
    }
  } catch (err) {
    return {
      name,
      passed: false,
      error: `cannot stat path: ${skillRel} — ${(err && err.message) || String(err)}`,
    };
  }

  if (!fs.statSync(effectivePath).isDirectory()) {
    // R2-H3: include `realPath` so the caller's dedup Map recognizes
    // multiple skill dirs symlinked to the same non-directory target
    // (e.g., both skill-x → README.md and skill-y → README.md) and
    // emits one clean duplicate-target error rather than two misleading
    // "not a directory" errors.
    return { name, passed: false, error: `not a directory: ${skillRel}`, realPath };
  }

  const skillMdPath = path.join(effectivePath, 'SKILL.md');
  if (!fs.existsSync(skillMdPath)) {
    return { name, passed: false, error: `missing SKILL.md: ${skillRel}/SKILL.md`, realPath };
  }

  // Size guard (inclusive upper bound — R2-L1 fix-forward).
  const skillMdStat = fs.statSync(skillMdPath);
  if (skillMdStat.size >= SKILL_MD_MAX_BYTES) {
    return {
      name,
      passed: false,
      error: `SKILL.md exceeds ${SKILL_MD_MAX_BYTES} bytes (${skillMdStat.size}): ${skillRel}/SKILL.md`,
      realPath,
    };
  }

  // R1-M5: normalize BOM + CRLF before regex match. Windows Notepad saves
  // SKILL.md with U+FEFF (BOM) + CRLF line endings; bare regex would
  // produce a misleading "missing frontmatter block" diagnosis.
  const rawContent = fs.readFileSync(skillMdPath, 'utf8');
  const content = rawContent.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n');
  const fmMatch = content.match(/^---\s*\n([\s\S]*?)\n---/);
  if (!fmMatch) {
    return { name, passed: false, error: `missing frontmatter block: ${skillRel}/SKILL.md`, realPath };
  }

  let frontmatter;
  try {
    frontmatter = yaml.load(fmMatch[1]);
  } catch (err) {
    return {
      name,
      passed: false,
      error: `invalid frontmatter YAML: ${skillRel}/SKILL.md — ${err.message}`,
      realPath,
    };
  }
  if (!frontmatter || typeof frontmatter !== 'object') {
    return { name, passed: false, error: `frontmatter not an object: ${skillRel}/SKILL.md`, realPath };
  }

  // Trim-reject empty/whitespace/literal-undefined for both required fields.
  for (const field of ['name', 'description']) {
    const v = frontmatter[field];
    if (typeof v !== 'string' || v.trim() === '' || v === 'undefined' || v === 'null') {
      return {
        name,
        passed: false,
        error: `frontmatter '${field}' missing or invalid: ${skillRel}/SKILL.md`,
        realPath,
      };
    }
  }

  return { name, passed: true, info: `name=${frontmatter.name}`, realPath };
}

/**
 * Walk `.claude/skills/` one level deep, audit each candidate dir.
 * Skips non-directory entries (e.g., stray `.DS_Store`).
 *
 * @param {string} projectRoot
 * @returns {{ findings: Array, scanned: number }}
 */
function auditAllSkillDirs(projectRoot) {
  const skillsDir = path.join(projectRoot, SKILLS_REL);
  const findings = [];

  // R1-M4: lstat-based directory check survives stale config where
  // `.claude/skills` is a regular file or broken symlink (operator who
  // accidentally `touch .claude/skills`). Returns clean fresh-install
  // state on absent dir; clean error on file-shaped target.
  let skillsLstat;
  try {
    skillsLstat = fs.lstatSync(skillsDir);
  } catch (_err) {
    findings.push({
      name: 'skills directory',
      passed: true,
      info: `no skills directory found at ${SKILLS_REL} (fresh install state)`,
    });
    return { findings, scanned: 0 };
  }
  if (!skillsLstat.isDirectory() && !skillsLstat.isSymbolicLink()) {
    findings.push({
      name: 'skills directory',
      passed: false,
      error: `${SKILLS_REL} exists but is not a directory (stale or corrupted state)`,
    });
    return { findings, scanned: 0 };
  }

  // R1-H2: realpath-normalize projectRoot once so containment checks survive
  // platform-specific symlinks (macOS `/var → /private/var` is the canonical
  // case — process.cwd() returns un-resolved `/var/folders/...` while
  // realpathSync(skillDirAbsPath) resolves to `/private/var/folders/...`).
  // R2-M4: fail-loud if realpath resolution itself fails (broken project
  // root, missing dir, perm error). Silently degrading to unresolved path
  // breaks containment for ALL non-symlink entries on macOS — better to
  // emit a clean diagnostic finding than a cascade of false positives.
  let resolvedRoot;
  try {
    resolvedRoot = fs.realpathSync(projectRoot);
  } catch (err) {
    findings.push({
      name: 'project root',
      passed: false,
      error: `cannot resolve project root realpath: ${(err && err.message) || String(err)}`,
    });
    return { findings, scanned: 0 };
  }
  const rootWithSep = resolvedRoot.endsWith(path.sep) ? resolvedRoot : resolvedRoot + path.sep;

  let entries;
  try {
    entries = fs.readdirSync(skillsDir, { withFileTypes: true });
  } catch (err) {
    findings.push({
      name: 'skills directory',
      passed: false,
      error: `cannot read ${SKILLS_REL}: ${(err && err.message) || String(err)}`,
    });
    return { findings, scanned: 0 };
  }
  // R2-M3: deterministic iteration order. `readdirSync` returns
  // filesystem-defined order (Linux: hash-bucket; macOS APFS: insertion;
  // tmpfs: arbitrary). Without sorting, "first-occurrence wins" dedup
  // points at the wrong culprit when an operator created the symlink
  // before the real dir. Sort by name for stable output across platforms.
  entries.sort((a, b) => a.name.localeCompare(b.name));

  // R1-H4: track visited realpaths so intra-project symlinks (e.g.,
  // `./skills/foo → ./skills/bar`) don't double-audit the same SKILL.md.
  // First-occurrence wins; subsequent occurrences emit a clean error
  // pointing at the original entry.
  const visitedRealPaths = new Map(); // realPath → original skillRel
  let scanned = 0;
  for (const entry of entries) {
    // Skip non-directory entries silently (stray .DS_Store, etc.).
    if (!entry.isDirectory() && !entry.isSymbolicLink()) continue;
    const skillRel = path.posix.join(SKILLS_REL, entry.name);
    const skillAbs = path.join(skillsDir, entry.name);
    const finding = checkSkillDir(skillAbs, skillRel, rootWithSep);

    // Dedup: if this entry resolves to a realPath we already audited,
    // emit a duplication error rather than double-counting.
    if (finding.realPath && visitedRealPaths.has(finding.realPath)) {
      const original = visitedRealPaths.get(finding.realPath);
      findings.push({
        name: finding.name,
        passed: false,
        error: `duplicate audit target: ${skillRel} resolves to same realpath as ${original} (likely a symlink)`,
      });
    } else {
      if (finding.realPath) visitedRealPaths.set(finding.realPath, skillRel);
      findings.push(finding);
    }
    scanned += 1;
  }

  return { findings, scanned };
}

// ─── Main dispatcher ─────────────────────────────────────────────

function renderHelp() {
  console.log('');
  console.log(chalk.bold('convoke-audit-skill-dirs') + ' — runtime audit over all .claude/skills/ directories');
  console.log('');
  console.log('Usage:');
  console.log('  convoke-audit-skill-dirs [options]');
  console.log('');
  console.log('Options:');
  console.log('  --verbose, -v   Print per-dir pass/fail with info lines.');
  console.log('  --dry-run       Run all checks; exit 0 regardless of outcome (preview mode).');
  console.log('  --help, -h      Show this help.');
  console.log('');
  console.log('Distinct from `convoke-validate-marketplace`, which is marketplace-submission-scoped.');
  console.log('');
}

function renderResults(findings, scanned, verbose) {
  console.log('');
  console.log(chalk.cyan.bold('Skill directory audit:'));
  let hardFails = 0;
  for (const f of findings) {
    const fname = typeof f.name === 'string' ? f.name : '(unnamed)';
    if (f.passed) {
      // Special case: "skills directory" placeholder finding (fresh-install
      // state — no `.claude/skills/` dir at all) always prints its info,
      // even without --verbose, so the operator understands the zero-scan
      // outcome.
      if (fname === 'skills directory' && typeof f.info === 'string') {
        console.log(chalk.gray(`  ${f.info}`));
        continue;
      }
      if (verbose) {
        console.log(chalk.green(`  ✓ ${fname}`));
        if (typeof f.info === 'string' && f.info.length > 0) {
          console.log(chalk.gray(`    ${f.info}`));
        }
      }
    } else {
      hardFails += 1;
      console.log(chalk.red(`  ✗ ${fname}`));
      if (typeof f.error === 'string' && f.error.length > 0) {
        console.log(chalk.red(`    ${f.error}`));
      }
    }
  }
  console.log('');
  if (hardFails === 0) {
    console.log(chalk.green(`  ${scanned} skill dir(s) audited; all passed.`));
  } else {
    const passed = scanned - hardFails;
    console.log(chalk.red(`  ${scanned} skill dir(s) audited; ${passed} passed; ${hardFails} failed.`));
  }
  console.log('');
  return hardFails;
}

function parseArgs(argv) {
  const flags = { verbose: false, dryRun: false, help: false, unknown: [] };
  // R2-M5 precedent: --help wins over other flag parse errors. Pre-scan first.
  for (const a of argv) {
    if (a === '--help' || a === '-h') {
      flags.help = true;
      return flags;
    }
  }
  // R1-M3: reject unknown flags rather than silently ignore. Catches typos
  // like `--verbosee` / `--dryrun` (missing dash) that operators would
  // otherwise see exit 0 with no effect.
  for (const a of argv) {
    if (a === '--verbose' || a === '-v') flags.verbose = true;
    else if (a === '--dry-run') flags.dryRun = true;
    else flags.unknown.push(a);
  }
  return flags;
}

function main(argv) {
  const flags = parseArgs(argv);
  if (flags.help) { renderHelp(); return 0; }

  // R1-M3: reject unknown flags loudly. --help wins above; everything else
  // not in the allowlist surfaces with a non-zero exit so typos don't fail
  // silently.
  // R2-M2: AC2 clause 5 says "--dry-run always exits 0". When dry-run is
  // active, downgrade unknown-flag rejection to a warning + exit 0 so
  // preview-mode operators aren't trapped by typos.
  // R2-D1: render each flag with JSON.stringify so empty/whitespace tokens
  // (e.g., `convoke-audit-skill-dirs ""` from `$EMPTYVAR` expansion) are
  // visible to the operator instead of disappearing into trailing space.
  if (flags.unknown.length > 0) {
    const rendered = flags.unknown.map(a => JSON.stringify(a)).join(' ');
    if (flags.dryRun) {
      console.error(chalk.yellow(`  ⚠ Unknown flag(s) ignored under --dry-run: ${rendered}`));
      console.error(chalk.gray('    Run with --help for usage.'));
    } else {
      console.error(chalk.red(`  ✗ Unknown flag(s): ${rendered}`));
      console.error(chalk.gray('    Run with --help for usage.'));
      return 2;
    }
  }

  const projectRoot = findProjectRoot();
  if (!projectRoot) {
    console.log(chalk.red('  ✗ Not inside a Convoke project (no _bmad/ directory found).'));
    console.log(chalk.gray('    Run: npx -p convoke-agents convoke-install'));
    return 1;
  }

  const { findings, scanned } = auditAllSkillDirs(projectRoot);
  const hardFails = renderResults(findings, scanned, flags.verbose);
  if (flags.dryRun) return 0;
  return hardFails > 0 ? 1 : 0;
}

// ─── Exports ─────────────────────────────────────────────────────

module.exports = {
  main,
  auditAllSkillDirs,
  // R2-L5 pattern (from Story 2.3): Object.freeze prevents test-order leaks.
  _internal: Object.freeze({
    parseArgs,
    renderResults,
    renderHelp,
    checkSkillDir,
    SKILLS_REL,
    SKILL_MD_MAX_BYTES,
  }),
};

if (require.main === module) {
  process.exit(main(process.argv.slice(2)));
}
