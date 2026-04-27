#!/usr/bin/env node
'use strict';

/**
 * drift-snapshot.js — produce side-by-side pre/post drift snapshot artifact for retrospective review.
 *
 * Story 4.4 (FR39 + NFR22 + NFR32). Pure-function renderer; release-engineering tool, operator-invoked.
 *
 * Consumes Story 4.3 recordings at _bmad-output/pf1-baselines/ + _bmad-output/pf1-post-migration/
 * (digit-only `## Prompt N` header contract per Story 4.2 H1 fix).
 *
 * Usage (default 3-skill subset Emma/John/Winston):
 *   node scripts/audit/drift-snapshot.js --date 2026-XX-XX --output <path>
 *
 * Usage (5-agent expansion):
 *   node scripts/audit/drift-snapshot.js --skills emma,john,winston,carson,murat --date ... --output ...
 *
 * Usage (ad-hoc non-PF1 skill pair, AC4):
 *   node scripts/audit/drift-snapshot.js --input-pre <pre.md> --input-post <post.md> --date ... --output ...
 *
 * Exit codes:
 *   0 — success
 *   1 — parser error (Story 4.2 parseRecording threw; e.g., wrong section structure)
 *   2 — recording file missing
 *   3 — output write error
 *   4 — path-safety violation (output outside project root)
 *   5 — invalid args (e.g., --skills empty after dedup)
 *   99 — unexpected
 */

const fs = require('fs');
const path = require('path');
const { parseRecording } = require('./pf1-validation-battery');
const { findProjectRoot } = require('../update/lib/utils');

// --- Constants (exported for testability per AC1) ---

const DEFAULT_SKILLS = ['emma', 'john', 'winston'];

const SKILL_DISPLAY = {
  emma: { display: 'Emma', manifestSkill: 'bmad-agent-bme-contextualization-expert' },
  john: { display: 'John', manifestSkill: 'bmad-agent-pm' },
  winston: { display: 'Winston', manifestSkill: 'bmad-agent-architect' },
  carson: { display: 'Carson', manifestSkill: 'bmad-cis-agent-brainstorming-coach' },
  murat: { display: 'Murat', manifestSkill: 'bmad-tea' },
};

const BASELINE_DIR_DEFAULT = '_bmad-output/pf1-baselines';
const POST_MIGRATION_DIR_DEFAULT = '_bmad-output/pf1-post-migration';
const OUTPUT_PATH_DEFAULT = '_bmad-output/implementation-artifacts/v63-4-4-drift-snapshot.md';
const PROMPTS_PER_SKILL = 4;

const PROMPT_LABELS = ['Prompt 1', 'Prompt 2', 'Prompt 3', 'Prompt 4'];

// --- Pure functions ---

/**
 * LCS-based line-diff. Pure, deterministic.
 * Edge cases: both empty → [] (CR-M4 patch); one empty → all removed/added; identical → all unchanged;
 * disjoint → all removed then all added; mixed → LCS-correct alternation. O(m*n) DP.
 * Cross-platform line endings: CRLF normalized to LF before split (CR-H2 patch).
 * Trailing newlines stripped before split to avoid phantom empty rows (CR-M5 patch).
 *
 * @param {string} a baseline text (newline-separated lines)
 * @param {string} b post-migration text (newline-separated lines)
 * @returns {{type: 'unchanged'|'removed'|'added', text: string}[]}
 */
function lineDiff(a, b) {
  // CR-M4: empty-string short-circuit (both inputs blank → no diff records)
  if (a === '' && b === '') return [];
  // CR-H2: normalize CRLF → LF for cross-platform determinism (NFR32)
  // CR-M5: strip a single trailing newline so files with vs without trailing \n compare equal
  const normalize = (s) => s.replace(/\r\n/g, '\n').replace(/\n$/, '');
  const linesA = normalize(a).split('\n');
  const linesB = normalize(b).split('\n');
  const m = linesA.length;
  const n = linesB.length;

  // Build LCS DP table
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (linesA[i - 1] === linesB[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  // Backtrack to emit records
  const records = [];
  let i = m;
  let j = n;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && linesA[i - 1] === linesB[j - 1]) {
      records.unshift({ type: 'unchanged', text: linesA[i - 1] });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      records.unshift({ type: 'added', text: linesB[j - 1] });
      j--;
    } else {
      records.unshift({ type: 'removed', text: linesA[i - 1] });
      i--;
    }
  }
  return records;
}

/**
 * Render side-by-side markdown table comparing baseline vs post-migration sections.
 * Each row = one diff record; left column = baseline, right column = post.
 * Diff markers: prefix unchanged with ` `, removed with `-`, added with `+`.
 * Pipe characters in content are escaped to `\|` to preserve table syntax.
 *
 * @param {string} baselineSection
 * @param {string} postSection
 * @returns {string} markdown table
 */
function renderSidebySide(baselineSection, postSection) {
  const records = lineDiff(baselineSection, postSection);
  // R2-M1: backslash-escape doesn't work inside CommonMark code spans.
  // HTML-entity-encode backticks (&#96;) so content with inline code renders without breaking the table cell.
  // Pipe still needs `\|` because escaping IS honored in regular table-cell text outside code spans;
  // but our content lives inside backticks → fully encode pipe as &#124; for safety.
  const escape = (s) => String(s).replace(/\|/g, '&#124;').replace(/`/g, '&#96;');

  const rows = ['| Baseline (3.x) | Post-migration (4.0) |', '|---|---|'];
  for (const r of records) {
    // R2-L1: prefix all three diff types with one space so +/- align with unchanged content
    if (r.type === 'unchanged') {
      const t = escape(r.text);
      rows.push(`| \` ${t}\` | \` ${t}\` |`);
    } else if (r.type === 'removed') {
      rows.push(`| \`- ${escape(r.text)}\` |  |`);
    } else if (r.type === 'added') {
      rows.push(`|  | \`+ ${escape(r.text)}\` |`);
    }
  }

  const changed = records.filter((r) => r.type !== 'unchanged').length;
  const total = records.length;
  rows.push('');
  rows.push(`_${changed} line${changed === 1 ? '' : 's'} changed of ${total} total._`);

  return rows.join('\n');
}

/**
 * Read a skill recording file. Resolves canonical manifest filename per SKILL_DISPLAY.
 *
 * @param {string} skill skill key (e.g., 'emma') OR canonical manifest name (passthrough)
 * @param {string} dir baseline-dir or post-dir
 * @param {string} suffix 'baseline' or 'post'
 * @returns {string} file content
 * @throws Error with exitCode=2 if file missing
 */
function loadSkillRecording(skill, dir, suffix) {
  const manifestSkill = SKILL_DISPLAY[skill] ? SKILL_DISPLAY[skill].manifestSkill : skill;
  const filePath = path.join(dir, `${manifestSkill}-${suffix}.md`);
  if (!fs.existsSync(filePath)) {
    const err = new Error(`recording not found: ${filePath}`);
    err.exitCode = 2;
    throw err;
  }
  return fs.readFileSync(filePath, 'utf8');
}

/**
 * Render full drift snapshot markdown. Pure deterministic given fixed inputs + date.
 *
 * @param {{skills: string[], baselineDir: string, postDir: string, date: string}} args
 * @returns {string} full markdown
 */
function renderSnapshot({ skills, baselineDir, postDir, date }) {
  const sortedSkills = [...skills].sort();

  // Frontmatter (8 keys per Decision 4)
  const lines = [
    '---',
    'initiative: convoke',
    'artifact_type: drift-snapshot',
    'release_target: 4.0.0',
    `created: '${date}'`,
    `skills: [${sortedSkills.join(', ')}]`,
    `baseline_dir: ${baselineDir}`,
    `post_migration_dir: ${postDir}`,
    `prompts_per_skill: ${PROMPTS_PER_SKILL}`,
    '---',
    '',
    '# PF1 Drift Snapshot — Convoke 4.0',
    '',
    'Side-by-side pre/post migration drift artifact (FR39 + NFR22 + NFR32). Retrospective observation only — NOT a release-blocking gate (see Story 4.3 for the M9 PF1 gate).',
    '',
  ];

  for (const skill of sortedSkills) {
    const display = SKILL_DISPLAY[skill] ? SKILL_DISPLAY[skill].display : skill;
    lines.push(`## Skill: ${display}`, '');

    const baselineText = loadSkillRecording(skill, baselineDir, 'baseline');
    const postText = loadSkillRecording(skill, postDir, 'post');
    const baselineSections = parseRecording(baselineText);
    const postSections = parseRecording(postText);

    for (const label of PROMPT_LABELS) {
      lines.push(`### ${label}`, '');
      const baselineSection = baselineSections[label] || '';
      const postSection = postSections[label] || '';
      lines.push(renderSidebySide(baselineSection, postSection), '');
    }
  }

  return lines.join('\n');
}

/**
 * Render ad-hoc pair snapshot (AC4) for a single skill pair from arbitrary input files.
 *
 * @param {{inputPre: string, inputPost: string, date: string}} args
 * @returns {string} full markdown
 */
function renderAdhocSnapshot({ inputPre, inputPost, date }) {
  // Derive skill display name from input filenames. CR-M7 (R1): inspect BOTH files
  // and surface mismatch (asymmetric rename → silent cross-skill compare).
  const stripSuffix = (s) => s.replace(/-baseline\.md$|-pre\.md$|-post\.md$|\.md$/, '');
  // R2 Edge: sanitize basenames — pathological filenames (empty / brackets / hash) corrupt headings + YAML.
  const sanitize = (s) => {
    const stripped = stripSuffix(s);
    return /^[A-Za-z0-9._-]+$/.test(stripped) ? stripped : 'unnamed';
  };
  const rawPre = stripSuffix(path.basename(inputPre));
  const rawPost = stripSuffix(path.basename(inputPost));
  const baseNamePre = sanitize(path.basename(inputPre));
  const baseNamePost = sanitize(path.basename(inputPost));
  if (baseNamePre === 'unnamed' || baseNamePost === 'unnamed') {
    process.stderr.write(`Warning: ad-hoc filename(s) contain non-safe characters; using 'unnamed' fallback. raw pre='${rawPre}' raw post='${rawPost}'.\n`);
  }
  const heading = baseNamePre === baseNamePost
    ? baseNamePre
    : `${baseNamePre} (pre) vs ${baseNamePost} (post)`;
  if (baseNamePre !== baseNamePost) {
    process.stderr.write(`Warning: ad-hoc filenames differ — pre='${baseNamePre}' post='${baseNamePost}'. Heading reflects mismatch.\n`);
  }
  // R2-M3: emit `skills:` as a list of actual skill names — single entry when matched,
  // two entries when mismatched (NOT a description string overloading the key).
  const skillsList = baseNamePre === baseNamePost
    ? [baseNamePre]
    : [baseNamePre, baseNamePost];

  const lines = [
    '---',
    'initiative: convoke',
    'artifact_type: drift-snapshot',
    'release_target: 4.0.0',
    `created: '${date}'`,
    `skills: [${skillsList.join(', ')}]`,
    `input_pre: ${inputPre}`,
    `input_post: ${inputPost}`,
    `prompts_per_skill: ${PROMPTS_PER_SKILL}`,
    '---',
    '',
    '# PF1 Drift Snapshot (ad-hoc) — Convoke 4.0',
    '',
    `Side-by-side pre/post migration drift artifact for **${heading}** (ad-hoc pair mode per Story 4.4 AC4).`,
    '',
    `## Skill: ${heading}`,
    '',
  ];

  if (!fs.existsSync(inputPre)) {
    const err = new Error(`recording not found: ${inputPre}`);
    err.exitCode = 2;
    throw err;
  }
  if (!fs.existsSync(inputPost)) {
    const err = new Error(`recording not found: ${inputPost}`);
    err.exitCode = 2;
    throw err;
  }

  const baselineSections = parseRecording(fs.readFileSync(inputPre, 'utf8'));
  const postSections = parseRecording(fs.readFileSync(inputPost, 'utf8'));

  for (const label of PROMPT_LABELS) {
    lines.push(`### ${label}`, '');
    const baselineSection = baselineSections[label] || '';
    const postSection = postSections[label] || '';
    lines.push(renderSidebySide(baselineSection, postSection), '');
  }

  return lines.join('\n');
}

/**
 * Parse CLI argv. Returns shape with all flag overrides + defaults.
 *
 * @param {string[]} argv
 * @returns {{skills: string[], baselineDir: string, postDir: string, output: string,
 *           date: string, inputPre?: string, inputPost?: string}}
 */
function parseArgs(argv) {
  const args = {
    skills: DEFAULT_SKILLS,
    baselineDir: BASELINE_DIR_DEFAULT,
    postDir: POST_MIGRATION_DIR_DEFAULT,
    output: OUTPUT_PATH_DEFAULT,
    date: getTodayDate(),
  };

  // CR-H1 + R2-M2: every value-taking flag must have a defined `next` AND `next` must not look like another flag.
  const requireValue = (flag, next) => {
    if (typeof next === 'undefined') {
      const err = new Error(`${flag} requires a value`);
      err.exitCode = 5;
      throw err;
    }
    if (typeof next === 'string' && next.startsWith('--')) {
      const err = new Error(`${flag} expected a value, got another flag: ${next}`);
      err.exitCode = 5;
      throw err;
    }
    return next;
  };

  for (let i = 0; i < argv.length; i++) {
    const flag = argv[i];
    const next = argv[i + 1];
    switch (flag) {
      case '--skills': {
        const raw = requireValue(flag, next);
        // CR-M8: dedup; CR-M2: validate against SKILL_DISPLAY (unknown keys cause clear error)
        const split = raw.split(',').map((s) => s.trim()).filter(Boolean);
        const deduped = Array.from(new Set(split));
        const unknown = deduped.filter((s) => !SKILL_DISPLAY[s]);
        if (unknown.length > 0) {
          const err = new Error(`unknown --skills key(s): ${unknown.join(', ')}. Known keys: ${Object.keys(SKILL_DISPLAY).join(', ')}`);
          err.exitCode = 5;
          throw err;
        }
        args.skills = deduped;
        i++;
        break;
      }
      case '--baseline-dir':
        args.baselineDir = requireValue(flag, next);
        i++;
        break;
      case '--post-dir':
        args.postDir = requireValue(flag, next);
        i++;
        break;
      case '--output':
        args.output = requireValue(flag, next);
        i++;
        break;
      case '--date': {
        const v = requireValue(flag, next);
        // CR-L6: validate ISO-8601 YYYY-MM-DD shape; R2 Edge: also semantic round-trip
        // (rejects 2026-13-32, 2026-02-30, etc.)
        if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) {
          const err = new Error(`--date must be YYYY-MM-DD, got: ${v}`);
          err.exitCode = 5;
          throw err;
        }
        const d = new Date(`${v}T00:00:00Z`);
        if (Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== v) {
          const err = new Error(`--date is not a valid calendar date: ${v}`);
          err.exitCode = 5;
          throw err;
        }
        args.date = v;
        i++;
        break;
      }
      case '--input-pre':
        args.inputPre = requireValue(flag, next);
        i++;
        break;
      case '--input-post':
        args.inputPost = requireValue(flag, next);
        i++;
        break;
    }
  }

  // CR-M9: --input-pre + --input-post must both be set or neither (XOR)
  if ((args.inputPre && !args.inputPost) || (!args.inputPre && args.inputPost)) {
    const err = new Error('--input-pre and --input-post must be used together (both or neither)');
    err.exitCode = 5;
    throw err;
  }

  return args;
}

/**
 * Resolve "today" for default --date. Test-only escape hatch via env var per OS-1 V-pass.
 * NEVER documented as operator-facing; comment per spec Task 3.8.
 */
function getTodayDate() {
  if (process.env.DRIFT_SNAPSHOT_TODAY_OVERRIDE) {
    return process.env.DRIFT_SNAPSHOT_TODAY_OVERRIDE;
  }
  return new Date().toISOString().slice(0, 10);
}

/**
 * Path-safety check per AC5 + path-safety-for-destructive-ops rule.
 * Resolved + normalized + symlink-resolved path MUST be under project root.
 *
 * CR-H3 (R1): adds `fs.realpathSync` to defeat symlink escapes. If the candidate path
 * doesn't exist yet (common for new --output), we walk up to the nearest existing
 * ancestor and realpath that, then append the unresolved tail — ensuring no symlink
 * in the existing-prefix lets the candidate escape the project root.
 *
 * @param {string} candidatePath path to validate (read or write)
 * @param {string} flagName name of flag for error message
 * @throws Error with exitCode=4 if path escapes project root or candidatePath is undefined
 */
function checkPathSafety(candidatePath, flagName = '--output') {
  // CR-H1: defensive — undefined/empty path comes from missing flag value
  if (typeof candidatePath !== 'string' || candidatePath.length === 0) {
    const err = new Error(`${flagName} value missing or empty`);
    err.exitCode = 5;
    throw err;
  }
  const projectRoot = findProjectRoot();
  // R2-H1: guard against findProjectRoot returning null (script run outside any BMAD project)
  if (!projectRoot) {
    const err = new Error('not inside a BMAD project (no _bmad/ ancestor found)');
    err.exitCode = 4;
    throw err;
  }
  const rootResolved = fs.realpathSync(path.resolve(projectRoot));

  // Walk up from candidate to find nearest existing ancestor; realpath that, then re-append tail.
  let current = path.resolve(candidatePath);
  const tail = [];
  while (!fs.existsSync(current)) {
    const parent = path.dirname(current);
    if (parent === current) break;
    tail.unshift(path.basename(current));
    current = parent;
  }
  let resolvedReal;
  try {
    resolvedReal = fs.realpathSync(current);
  } catch {
    resolvedReal = current; // fallback if realpath fails on existing path (rare)
  }
  const normalized = path.normalize(path.join(resolvedReal, ...tail));

  if (!normalized.startsWith(rootResolved + path.sep) && normalized !== rootResolved) {
    const err = new Error(`${flagName} path outside project root: ${candidatePath} (resolved → ${normalized})`);
    err.exitCode = 4;
    throw err;
  }
}

/**
 * Atomic write: temp file + rename. Same pattern as Story 4.2 writeResults.
 */
function atomicWrite(outputPath, content) {
  try {
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const tmpPath = `${outputPath}.tmp`;
    fs.writeFileSync(tmpPath, content, 'utf8');
    fs.renameSync(tmpPath, outputPath);
  } catch (e) {
    const err = new Error(`output write failed: ${e.message}`);
    err.exitCode = 3;
    throw err;
  }
}

/**
 * CLI entry point. Orchestrates parseArgs → path-safety → renderSnapshot (or ad-hoc) → atomic write.
 */
/**
 * Resolve a default-relative path against `findProjectRoot()` when the value
 * is one of our known DEFAULTS. Operator-supplied relative paths still resolve
 * against `cwd` (the standard CLI convention). R2 Edge fix: prevents silent
 * path-safety failures when running the script from outside the project tree.
 */
function resolveDefaultRelative(value, defaultValue) {
  if (value !== defaultValue) return value; // operator-supplied; honor cwd
  const projectRoot = findProjectRoot();
  if (!projectRoot) return value; // null-guard; let downstream surface the error
  return path.join(projectRoot, defaultValue);
}

function main() {
  try {
    const args = parseArgs(process.argv.slice(2));
    // R2 Edge fix: resolve default relative paths against project root, not cwd
    args.output = resolveDefaultRelative(args.output, OUTPUT_PATH_DEFAULT);
    args.baselineDir = resolveDefaultRelative(args.baselineDir, BASELINE_DIR_DEFAULT);
    args.postDir = resolveDefaultRelative(args.postDir, POST_MIGRATION_DIR_DEFAULT);
    // CR-H3: --output is the write surface (most critical safety check)
    checkPathSafety(args.output, '--output');

    let content;
    if (args.inputPre && args.inputPost) {
      // AC4 ad-hoc pair mode (CR-M9 already validated XOR in parseArgs)
      // CR-M1: read-path safety for ad-hoc inputs
      checkPathSafety(args.inputPre, '--input-pre');
      checkPathSafety(args.inputPost, '--input-post');
      content = renderAdhocSnapshot({
        inputPre: args.inputPre,
        inputPost: args.inputPost,
        date: args.date,
      });
    } else {
      // Default skills mode
      if (!args.skills || args.skills.length === 0) {
        const err = new Error('--skills resolved to empty list');
        err.exitCode = 5;
        throw err;
      }
      // CR-M1: read-path safety for skill-mode dirs
      checkPathSafety(args.baselineDir, '--baseline-dir');
      checkPathSafety(args.postDir, '--post-dir');
      content = renderSnapshot({
        skills: args.skills,
        baselineDir: args.baselineDir,
        postDir: args.postDir,
        date: args.date,
      });
    }

    atomicWrite(args.output, content);
    // CR-M3: success path → stdout (UNIX convention); errors → stderr
    process.stdout.write(`drift snapshot written: ${args.output}\n`);
    process.exit(0);
  } catch (e) {
    process.stderr.write(`Error: ${e.message}\n`);
    if (typeof e.exitCode === 'number') {
      process.exit(e.exitCode);
    }
    process.exit(99);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  DEFAULT_SKILLS,
  SKILL_DISPLAY,
  BASELINE_DIR_DEFAULT,
  POST_MIGRATION_DIR_DEFAULT,
  OUTPUT_PATH_DEFAULT,
  PROMPTS_PER_SKILL,
  lineDiff,
  renderSidebySide,
  renderSnapshot,
  renderAdhocSnapshot,
  loadSkillRecording,
  parseArgs,
  checkPathSafety,
  getTodayDate,
  resolveDefaultRelative,
};
