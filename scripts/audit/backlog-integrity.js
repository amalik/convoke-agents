#!/usr/bin/env node
'use strict';

/**
 * Backlog Integrity Check
 *
 * One assertion over `convoke-note-initiative-lifecycle-backlog.md`:
 * every `BUG-n` / `T-n` mentioned in a row exists as a row.
 *
 * WHY THIS EXISTS
 *   Specified by BUG-16 on 2026-08-14 after commit `c841fcd2` deleted the BUG-16 row while
 *   shipping BUG-16's own fix. Nine cross-references pointed at nothing, an unrelated commit
 *   restored the row incidentally, and every check stayed green throughout — nothing validated
 *   backlog referential integrity. It was written down and not built.
 *
 *   On 2026-08-17 the identical mechanism fired again: commit `3a3de195` dropped the T35 and
 *   T39 rows, T35 being an *open* risk item, while its message claimed to have repaired them.
 *   Root cause both times was line-level staging of a MODIFIED row — the diff carries `-old`
 *   and `+new`, and staging only the `-` side deletes the row. Silent, and green.
 *
 *   Twice is the threshold. This is four lines of logic that would have caught both.
 *
 * SCOPE. A column-arity check was written alongside this and removed before shipping: §2.5
 * legitimately contains several sub-tables of differing width, so a lane has no single column
 * contract, and the check produced 71 false positives against a correct file. A gate nobody
 * can read is worse than no gate. The sibling defect it aimed at — the T39 row shipping with a
 * trailing `| — |` — needs a per-table contract, not a per-lane one.
 */

const fs = require('fs');
const path = require('path');

const BACKLOG = '_bmad-output/planning-artifacts/convoke-note-initiative-lifecycle-backlog.md';

/** Split a markdown table row on unescaped pipes. `\|` inside code spans is content. */
function splitRow(line) {
  return line.split(/(?<!\\)\|/);
}

function isRow(line) {
  return line.startsWith('| ') && !line.startsWith('| ID') && !line.startsWith('|--');
}

/**
 * Parse the backlog into lanes of rows.
 *
 * Pure and side-effect free so it can be unit tested against fixture text without touching
 * the repository.
 *
 * @param {string} text Full backlog markdown.
 * @returns {{lanes: Array<{heading: string, rows: Array<{line: number, id: string, cols: number, raw: string}>}>}}
 */
function parseBacklog(text) {
  const lines = text.split('\n');
  const lanes = [];
  let current = null;
  lines.forEach((line, idx) => {
    if (/^### \d+\.\d+/.test(line)) {
      current = { heading: line.trim(), rows: [] };
      lanes.push(current);
      return;
    }
    if (!current || !isRow(line)) return;
    const cells = splitRow(line);
    current.rows.push({
      line: idx + 1,
      id: (cells[1] || '').trim(),
      cols: cells.length,
      raw: line,
    });
  });
  return { lanes };
}

/** Row IDs that exist, and IDs referenced from row text. */
function collectIds(text) {
  const defined = new Set();
  for (const m of text.matchAll(/^\| ((?:BUG-|T|I|A|U|P|D)\d+) \|/gm)) defined.add(m[1]);
  const referenced = new Set();
  for (const m of text.matchAll(/\b((?:BUG-|T)\d+)\b/g)) referenced.add(m[1]);
  return { defined, referenced };
}

function check(text) {
  const problems = [];
  const { defined, referenced } = collectIds(text);

  // 1. Referential integrity.
  for (const ref of [...referenced].sort()) {
    if (!defined.has(ref)) problems.push(`dangling reference: ${ref} is cited but has no row`);
  }

  return problems;
}

function main(root = path.resolve(__dirname, '..', '..')) {
  const file = path.join(root, BACKLOG);
  console.log('Backlog Integrity Check');
  console.log('');
  if (!fs.existsSync(file)) {
    console.log(`  FAIL — backlog not found at ${BACKLOG}`);
    return 1;
  }
  const text = fs.readFileSync(file, 'utf8');
  const { defined } = collectIds(text);

  // Zero-floor: refuse to report PASS on a file we clearly failed to parse.
  if (defined.size < 50) {
    console.log(`  FAIL — only ${defined.size} rows parsed; expected 50+. The table shape may have changed.`);
    return 1;
  }

  const problems = check(text);
  if (problems.length === 0) {
    console.log(`  PASS — ${defined.size} rows; every referenced BUG-n/T-n exists.`);
    return 0;
  }
  console.log(`  FAIL — ${problems.length} problem(s):`);
  console.log('');
  for (const p of problems) console.log(`    ${p}`);
  console.log('');
  console.log('  A dangling reference usually means a row was deleted — most often by staging the');
  console.log('  `-` side of a MODIFIED row without its `+` side. Check `git diff` before committing.');
  return 1;
}

if (require.main === module) {
  try {
    process.exit(main());
  } catch (err) {
    console.error(`Unhandled error: ${err.message}`);
    if (err.stack) console.error(err.stack);
    process.exit(99);
  }
}

module.exports = { BACKLOG, splitRow, isRow, parseBacklog, collectIds, check, main };
