#!/usr/bin/env node
'use strict';

/**
 * Coverage-denominator gate (docs-1-7, FR8/FR10).
 *
 * Asserts that a derivation pass was **RECORDED** over the full in-scope documentation
 * set. It does **not** assert that any document is correct — no check can decide whether
 * a sentence is true, which is why this epic gates on coverage instead.
 *
 * The in-scope set is DERIVED, not maintained: every tracked markdown file under `docs/`
 * (recursively) and at the repository root, minus a declared exclusion list, plus an
 * explicit inclusion list for module documentation.
 *
 * Three design points, each with a reason, because an unexplained rule is how a file
 * silently leaves scope:
 *
 *  1. RECURSIVE under `docs/`. A depth-1 glob misses `docs/adr/` and `docs/migration/`,
 *     and `convoke-update` links operators to the latter on breaking changes. It would
 *     also make FR10's justification — "a new document appears unexamined on its own" —
 *     false for anything in a subdirectory.
 *
 *  2. TRACKED, via `git ls-files`, not `fs.readdirSync`. An untracked scratch note in
 *     `docs/` must not turn a release gate red, and an untracked file that satisfies a
 *     developer vanishes in CI. `name-registry-integrity.js` ruled the same way.
 *
 *  3. Module docs are an explicit INCLUSION LIST, not a glob. Globbing
 *     `_bmad/bme/_vortex/**\/*.md` matches 223 files — 186 of them workflow step files —
 *     none of which this epic scoped. The cost is that a future module doc must be added
 *     by hand; that is the trade, recorded rather than left implicit.
 *
 * NOT an extension of `scripts/docs-audit.js`, which the epic's tooling inventory
 * originally proposed. `USER_FACING_DOCS` is a different set with a different purpose —
 * 9 of its entries are absent from the coverage table and 7 table rows are absent from it
 * — and `tests/unit/docs-audit.test.js` pins its length against prose in
 * `BMAD-METHOD-COMPATIBILITY.md`, so widening it would turn that test red and falsify a
 * shipped sentence. Recorded as an epic amendment in docs-1-7.
 */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

/** The coverage table this gate reads. */
const TABLE_PATH = path.join(
  '_bmad-output',
  'planning-artifacts',
  'convoke-note-docs-accuracy-findings-4-0-2.md'
);

/**
 * Files the glob reaches that are deliberately NOT in the derivation pass.
 * Each reason is a ruling, not a derivation — do not infer these from the filesystem.
 */
const EXCLUSIONS = new Map([
  // Ruled 2026-09-10, findings note §"Explicitly out of scope" — vision/draft/snapshot.
  ['docs/Convoke-Ecosystem-v0.2-Updated-With-Gyre.md', 'Vision/draft artifact, not published documentation'],
  ['docs/KORE-Method-v0.1-Draft.md', 'Self-declared draft'],
  ['docs/lifecycle-expansion-vision.md', 'Vision artifact'],
  ['docs/lifecycle-expansion-references.md', 'Sibling of the vision artifact; same treatment'],
  ['docs/codebase-audit-2026-06-27.md', 'Dated historical snapshot — a record of what was true on that date'],
  // Ruled 2026-09-10 — warm tier, written during dist-epic-2, low expected yield.
  ['INSTALLATION.md', 'Warm tier (written during dist-epic-2)'],
  ['CONTRIBUTING.md', 'Warm tier (written during dist-epic-2)'],
  ['docs/npm-publishing-access-playbook.md', 'Warm tier (written during dist-epic-2)'],
  ['docs/pre-tag-release-checklist.md',
    'Warm tier. Also docs-1-7\'s own edit subject — being EDITED is not being EXAMINED, and the distinction is deliberate'],
  // Ruled 2026-09-12 by the operator.
  ['CHANGELOG.md',
    'RULED 2026-09-12: admitted for NEVER-TRUE claims only, and out of the derivation pass. Not "historical record"'],
  // Class rulings recorded with this gate.
  ['docs/README.md', 'A directory index, not documentation carrying repository claims'],
  ['docs/vortex-step-01-round-split-scaffold.md', 'Contributor-normative spec; self-declared audience'],
  ['project-context.md', 'AI agent rules, not documentation'],
  ['docs/adr/adr-bmad-coupling-v4.0.md', 'A dated decision record — same class as the snapshot exclusion'],
  ['docs/migration/3.x-to-4.0.md',
    'Operator-facing and linked by convoke-update, so a genuine candidate — but no story in this epic examined it, and admitting it here would assert coverage that was never performed. Filed for a later pass rather than back-dated'],
]);

/** Coverage rows no glob in this gate reaches. See design point 3. */
const MODULE_INCLUSIONS = [
  '_bmad/bme/_vortex/compass-routing-reference.md',
  '_bmad/bme/_vortex/guides/VORTEX-TEAM-GUIDE.md',
];

/** Blank out fenced blocks so an illustrative table cannot be parsed as the real one. */
function stripFences(text) {
  let inFence = false;
  return text
    .split('\n')
    .map((line) => {
      if (/^\s*(```|~~~)/.test(line)) {
        inFence = !inFence;
        return '';
      }
      return inFence ? '' : line;
    })
    .join('\n');
}

/**
 * Strip code ticks and bold/italic asterisks so `**yes**` compares equal to `yes`.
 *
 * ⚠ Underscores are NOT stripped. They are markdown emphasis in prose but PATH characters
 * here: stripping them turns `_bmad/bme/_vortex/...` into `bmad/bme/vortex/...` and
 * `CODE_OF_CONDUCT.md` into `CODEOFCONDUCT.md`, so every such row reads as an orphan and
 * every such file reads as unexamined. Caught by this gate refusing the real repository.
 */
function cell(raw) {
  return String(raw).replace(/[`*]/g, '').trim();
}

function tracked(root) {
  const out = execFileSync('git', ['ls-files', '-z', '--', 'docs', '.'], {
    cwd: root,
    encoding: 'utf8',
    maxBuffer: 32 * 1024 * 1024,
  });
  return out.split('\0').filter(Boolean);
}

/**
 * Tracked markdown under docs/ (recursively) and at the repository root, minus the
 * exclusion list, plus the module inclusions that exist.
 */
function deriveInScope(root, { exclusions, moduleInclusions } = {}) {
  const EXCL = exclusions || EXCLUSIONS;
  const INCL = moduleInclusions || MODULE_INCLUSIONS;
  const all = tracked(root);
  const globbed = all.filter(
    (f) => f.endsWith('.md') && (f.startsWith('docs/') || !f.includes('/'))
  );
  const kept = globbed.filter((f) => !EXCL.has(f));
  const mods = INCL.filter((f) => all.includes(f));
  return [...new Set([...kept, ...mods])].sort();
}

/**
 * Parse the SIX-column coverage table. Three tables in the note begin `| File |`, so
 * anchoring on the first column alone parses the wrong one.
 */
function parseCoverageTable(text) {
  const lines = stripFences(text).split('\n');
  const rows = [];
  let inTable = false;
  for (const line of lines) {
    const cells = line.split('|');
    if (cells.length < 3) {
      inTable = false;
      continue;
    }
    const head = cells.slice(1, -1).map(cell);
    if (
      head.length === 6 &&
      head[0] === 'File' && head[1] === 'In scope' && head[2] === 'Assertions' &&
      head[3] === 'Examined' && head[4] === 'Story' && head[5] === 'Findings'
    ) {
      inTable = true;
      continue;
    }
    if (!inTable) continue;
    if (/^\|[-: |]+\|$/.test(line.trim())) continue;
    const c = cells.slice(1, -1).map(cell);
    if (c.length !== 6 || !c[0]) {
      inTable = false;
      continue;
    }
    rows.push({ file: c[0], inScope: c[1], examined: c[3], story: c[4] || null });
  }
  return rows;
}

/**
 * @param {object} [opts]
 * @param {string} [opts.root] project root (injected so tests never scan PACKAGE_ROOT)
 * @param {string} [opts.tablePath] coverage table to read
 * @param {Map<string,string>} [opts.exclusions] override for fixtures; defaults to the real list
 * @param {string[]} [opts.moduleInclusions] override for fixtures
 */
function audit({ root, tablePath, exclusions, moduleInclusions } = {}) {
  const base = root || path.resolve(__dirname, '..', '..');
  const table = tablePath || path.join(base, TABLE_PATH);
  const EXCL = exclusions || EXCLUSIONS;
  const INCL = moduleInclusions || MODULE_INCLUSIONS;
  const findings = [];

  const all = tracked(base);
  for (const [rel] of EXCL) {
    if (!all.includes(rel)) {
      findings.push({ file: rel, story: null, reason: 'stale exclusion — entry names no tracked file' });
    }
  }
  for (const rel of INCL) {
    if (!all.includes(rel)) {
      findings.push({ file: rel, story: null, reason: 'stale inclusion — entry names no tracked file' });
    }
  }

  const inScope = deriveInScope(base, { exclusions: EXCL, moduleInclusions: INCL });
  const rows = fs.existsSync(table) ? parseCoverageTable(fs.readFileSync(table, 'utf8')) : [];
  const byFile = new Map(rows.map((r) => [r.file, r]));

  for (const file of inScope) {
    const row = byFile.get(file);
    if (!row) {
      findings.push({ file, story: null, reason: 'in scope but has no row in the coverage table' });
      continue;
    }
    if (row.inScope.toLowerCase() === 'no') {
      findings.push({
        file, story: row.story,
        reason: 'row says In scope: no, but the derivation puts it in scope',
      });
    }
    if (row.examined.toLowerCase() !== 'yes') {
      findings.push({ file, story: row.story, reason: 'in scope and not examined' });
    }
  }

  const derived = new Set(inScope);
  for (const row of rows) {
    if (!derived.has(row.file)) {
      findings.push({ file: row.file, story: row.story, reason: 'orphan row — not in the derived in-scope set' });
    }
  }

  return { ok: findings.length === 0, findings, inScope, rows };
}

function format(result) {
  if (result.ok) {
    return `✓ Coverage denominator: ${result.inScope.length} in-scope files, all recorded as examined.\n` +
      '  This asserts a derivation pass was RECORDED — never that any document is correct.';
  }
  const lines = ['✗ Coverage denominator FAILED', ''];
  for (const f of result.findings) {
    lines.push(`  ${f.file}`);
    lines.push(`      ${f.reason}${f.story ? ` (owner: story ${f.story})` : ' (owner: none — no row in the coverage table)'}`);
  }
  lines.push('', `  ${result.findings.length} finding(s).`);
  return lines.join('\n');
}

function main(root = path.resolve(__dirname, '..', '..'), tablePath) {
  const result = audit({ root, tablePath });
  process.stdout.write(format(result) + '\n');
  return result.ok ? 0 : 1;
}

if (require.main === module) {
  try {
    process.exit(main());
  } catch (err) {
    process.stderr.write(`coverage-denominator failed to run: ${err.message}\n`);
    process.exit(99);
  }
}

module.exports = {
  deriveInScope, parseCoverageTable, audit, format, main,
  stripFences, cell, EXCLUSIONS, MODULE_INCLUSIONS, TABLE_PATH,
};
