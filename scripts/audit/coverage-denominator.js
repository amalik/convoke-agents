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
 *     `_bmad/bme/_vortex/**\/*.md` matches 223 files — 186 of them under `workflows/` —
 *     none of which this epic scoped. The cost is that a future module doc must be added
 *     by hand; that is the trade, recorded rather than left implicit.
 *
 * NOT an extension of `scripts/docs-audit.js`, which the epic's tooling inventory
 * originally proposed. `USER_FACING_DOCS` is a different set with a different purpose —
 * 9 of its entries are absent from the coverage table and 7 table rows are absent from it
 * — and `tests/unit/docs-audit.test.js` pins its length against prose in
 * `BMAD-METHOD-COMPATIBILITY.md`, so widening it would turn that test red and falsify a
 * shipped sentence. The epic's tooling inventory is amended in place to say so (Story 1.7,
 * 2026-09-13), the way Stories 1.1 and 1.3 recorded theirs.
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

/** Trim only. Used for columns whose content is a value, not prose. */
function cell(raw) {
  return String(raw).trim();
}

/**
 * A VERDICT cell (`Examined`, `In scope`) — strip markdown emphasis so `**yes**` compares
 * equal to `yes`.
 */
function verdictCell(raw) {
  return String(raw).replace(/[`*_]/g, '').trim();
}

/**
 * A PATH cell (the `File` column) — strip the surrounding code ticks that the table uses as
 * formatting, and nothing else.
 *
 * ⚠ Do NOT strip `*`, `_` or backticks globally here. They are markdown emphasis in prose but
 * PATH characters in a filename: a global strip turns `_bmad/bme/_vortex/…` into
 * `bmad/bme/vortex/…`, `CODE_OF_CONDUCT.md` into `CODEOFCONDUCT.md`, and `docs/a*b.md` into
 * `docs/ab.md` — so the row reads as an orphan and the file as unexamined, forever. The
 * underscore half of this was found by the gate refusing the real repository; the `*` and
 * backtick half survived that fix and was found at review. Same root cause, fixed once here.
 */
function pathCell(raw) {
  return String(raw).trim().replace(/^`+|`+$/g, '').trim();
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
  const malformed = [];
  let inTable = false;
  lines.forEach((line, i) => {
    // A `\|` inside a cell is escaped content, not a delimiter. Splitting naively is how a
    // Findings cell containing `| wc -l` silently detonated a whole table.
    const cells = line.split(/(?<!\\)\|/);
    if (cells.length < 3) {
      inTable = false;
      return;
    }
    const head = cells.slice(1, -1).map(verdictCell);
    if (
      head.length === 6 &&
      head[0] === 'File' && head[1] === 'In scope' && head[2] === 'Assertions' &&
      head[3] === 'Examined' && head[4] === 'Story' && head[5] === 'Findings'
    ) {
      inTable = true;
      return;
    }
    if (!inTable) return;
    if (/^\|[-: |]+\|$/.test(line.trim())) return;
    const c = cells.slice(1, -1);
    if (c.length !== 6 || !cell(c[0])) {
      // ⚠ Do NOT silently stop parsing. A malformed row used to set inTable=false, so every
      // LATER row left the audit unnoticed and the verdict could still be green — a gate
      // failing OPEN. Record it and keep going.
      malformed.push({ line: i + 1, text: line.trim().slice(0, 120) });
      return;
    }
    rows.push({
      file: pathCell(c[0]),
      inScope: verdictCell(c[1]),
      examined: verdictCell(c[3]),
      story: verdictCell(c[4]) || null,
      line: i + 1,
    });
  });
  rows.malformed = malformed;
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

  // ⚠ A missing table is its OWN failure, reported once. It used to fall through to
  // `rows = []`, which blamed every in-scope file for "having no row" — 15 findings naming
  // 15 innocent documents while the real cause (a moved file, a sparse checkout) went
  // unmentioned.
  if (!fs.existsSync(table)) {
    // The stale-list findings above are about the DECLARED LISTS, not the table, so they
    // survive a missing table — otherwise a moved table would mask a rotten exclusion.
    findings.push({ file: table, story: null, reason: 'coverage table not found — this gate has no input' });
    return { ok: false, fatal: true, findings, inScope, rows: [] };
  }

  const rows = parseCoverageTable(fs.readFileSync(table, 'utf8'));

  // ⚠ An unparseable row is a defect in its own right. Silently skipping them is how a gate
  // reports health over a table it only half-read.
  for (const bad of rows.malformed || []) {
    findings.push({
      file: `${table}:${bad.line}`, story: null,
      reason: `unparseable table row (not six cells): ${bad.text}`,
    });
  }

  // ⚠ Duplicate rows: a Map is last-wins, so a later `Examined: yes` used to override an
  // earlier `no` and the gate exited 0. Report the duplication instead of resolving it.
  const seen = new Map();
  for (const r of rows) {
    if (seen.has(r.file)) {
      findings.push({
        file: r.file, story: r.story,
        reason: `duplicate row (lines ${seen.get(r.file).line} and ${r.line}) — a later row must not override an earlier verdict`,
      });
    } else {
      seen.set(r.file, r);
    }
  }
  const byFile = seen;

  for (const file of inScope) {
    const row = byFile.get(file);
    if (!row) {
      findings.push({ file, story: null, reason: 'in scope but has no row in the coverage table' });
      continue;
    }
    // Fail-closed, like `Examined`: anything that is not an affirmative `yes` is a finding.
    // `=== 'no'` used to let `""`, `n/a` and `partial` through silently.
    if (row.inScope.toLowerCase() !== 'yes') {
      findings.push({
        file, story: row.story,
        reason: `row says In scope: ${JSON.stringify(row.inScope)}, but the derivation puts it in scope`,
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

  // ⚠ A FLOOR. `✓ 0 in-scope files, all recorded as examined` is not a pass — it is the
  // gate reporting health while inert, which this project has recorded five times under
  // other names. An empty derivation means the enumeration failed, not that the work is done.
  if (inScope.length === 0) {
    findings.push({
      file: base, story: null,
      reason: 'derived in-scope set is EMPTY — the enumeration failed; this is never a pass',
    });
  }
  if (rows.length === 0) {
    findings.push({
      file: table, story: null,
      reason: 'coverage table parsed to zero rows — the six-column header was not found',
    });
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
    // ⚠ Only a finding that IS about a missing row may say so. This clause used to key off
    // `story` alone, so a stale-exclusion finding — which concerns a list entry, not a row —
    // was reported as "no row in the coverage table", and an orphan-row finding claimed the
    // row it had just found did not exist.
    let owner = '';
    if (f.story) owner = ` (owner: story ${f.story})`;
    else if (/no row in the coverage table/.test(f.reason)) owner = ' (owner: none — nobody has examined it)';
    lines.push(`      ${f.reason}${owner}`);
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
