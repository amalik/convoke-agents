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
 * SCOPE (extended by T58, 2026-08-25; hardened after two adversarial review rounds).
 *
 * Every table in the backlog carries its own header, so each table's column contract is read
 * from the file itself rather than from a lane -> width map that would rot on the first added
 * column. `parseTables` splits on header/separator pairs, which makes an H4 sub-table its own
 * table and dissolves the 71 false positives that got the first attempt withdrawn.
 *
 * FOUR assertions ship:
 *   1. Referential integrity — every referenced BUG-n/T-n has a row.
 *   2. Per-table arity      — every row matches its own table's header width.
 *   3. Lane shape           — lanes are score-ordered and hold NO closed rows.
 *   4. Structure + coverage — the document has the sections the spec requires, each lane
 *                             resolves to exactly one checkable table, and every table row in
 *                             the file was actually walked.
 *
 * WHY (4) EXISTS, AND WHY IT COUNTS ROWS A DIFFERENT WAY.
 *   This gate's worst failure is printing PASS over content it never scanned — the class that
 *   got BUG-10's guard withdrawn after it hand-rolled a lexer in regex and blinded ~1,000
 *   lines while reporting PASS. Round 1 added a coverage reconciliation to prevent it. Round 2
 *   proved that reconciliation could not work: it computed both sides with the SAME predicate,
 *   so any line the predicate misclassified was subtracted from both and cancelled out. A row
 *   indented by one space (valid GFM) was invisible to the parser and to its own coverage
 *   check simultaneously.
 *
 *   The lesson generalises past this file: a check that shares its classifier with the thing it
 *   checks cannot detect a classification bug. So `expected` is now counted by a deliberately
 *   PERMISSIVE, GFM-conformant rule while the parser stays strict — divergence between them is
 *   the signal. Where they agree, the file is clean; where they disagree, rows exist that no
 *   check saw.
 *
 *   `assertStructure` is the second half, and it is the part that does not depend on the parser
 *   being right at all. It asserts the document still has the shape the format spec mandates
 *   and that each declared lane produced exactly one checkable table. A parser bug that drops a
 *   lane now fails loudly instead of printing "0 lanes ordered" and exiting 0 — which the
 *   shipped Round-2 code did.
 */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const BACKLOG = '_bmad-output/planning-artifacts/convoke-note-initiative-lifecycle-backlog.md';
const SPRINT_STATUS = '_bmad-output/implementation-artifacts/sprint-status.yaml';

/** Split a markdown table row on unescaped pipes. `\|` inside code spans is content. */
function splitRow(line) {
  return line.split(/(?<!\\)\|/);
}

/**
 * True for any line that is part of a markdown table (header, separator or row).
 *
 * Deliberately NOT keyed on the first cell's text. The previous form excluded any line
 * starting `| ID`, which meant a *data* row whose first cell is literally `ID` was read as a
 * non-row — silently ending its table and dropping every row below it from all three checks.
 * Header-vs-row is a question of POSITION (a header is the line above a separator), not of
 * content, and the parser already detects separators.
 */
function isTableLine(line) {
  // GFM permits up to three leading spaces. Requiring column zero made an indented row
  // invisible to the parser AND to the coverage check that shared this predicate.
  return /^ {0,3}\|/.test(line);
}

/** True for the `|----|----|` rule under a table header. */
function isSeparator(line) {
  // Must contain at least one dash. The previous form matched `|  |  |` and `|||`, so a row of
  // empty cells promoted the real data row above it into a table header — dropping that row
  // from every check while the counts still reconciled.
  return /^ {0,3}\|[-:\s|]*-[-:\s|]*\|\s*$/.test(line);
}

/** Closed status values per Lane Ordering clause 3. */
const CLOSED = /^(Done|Closed|Shipped|Superseded|Rescoped|Absorbed|Invalid)\b/i;

/** True when a Status/Stage cell marks the row closed. */
function isClosed(cell) {
  // Strip emphasis, checkbox and leading symbols before matching. Only `*` was stripped
  // before, so `_Done_`, `[x] Done` and `🔴 Closed` all read as live.
  const c = String(cell || '')
    .replace(/[*_~`]/g, '')
    .replace(/^\s*(?:\[[ xX]\]|[^\w\s(]+)\s*/u, '')
    .trim();
  return String(cell).includes('\u2705') || CLOSED.test(c);
}

/**
 * Split the backlog into tables, one per header/separator pair.
 *
 * Keyed on the header rather than on the heading, because §2.5 nests several sub-tables of
 * differing width under a single H3 — the exact shape that made a per-lane arity check
 * unusable. Each table therefore carries its own column contract, read from its own header.
 *
 * Pure and side-effect free so it can be unit tested against fixture text.
 *
 * @param {string} text Full backlog markdown.
 * @returns {Array<{heading: string, subheading: string, columns: string[], expected: number,
 *                  isLane: boolean, rows: Array<{line: number, id: string, cols: number, cells: string[]}>}>}
 */
function parseTables(text) {
  const lines = text.split('\n');
  const tables = [];
  let heading = '';
  let subheading = '';
  let current = null;

  const orphans = [];
  let inFence = false;
  lines.forEach((line, idx) => {
    const next = lines[idx + 1] || '';

    // Fenced blocks hold examples, CLI output and diagrams. Without fence state a fenced
    // `| not | a | table |` produced coverage + orphan failures on a correct file, and a
    // fenced example row could SILENCE a real dangling reference by defining its id.
    if (/^\s*(```|~~~)/.test(line)) { inFence = !inFence; current = null; return; }
    if (inFence) return;

    // L10: reset on ANY heading depth. H1 and H5+ previously left stale section state,
    // which mislabelled findings and misdirects whoever reads them.
    const h = line.match(/^(#+) /);
    if (h) {
      if (h[1].length <= 3) { heading = line.trim(); subheading = ''; } else { subheading = line.trim(); }
      current = null;
      return;
    }

    if (isSeparator(line)) return; // the table's own rule

    if (isTableLine(line) && isSeparator(next)) { // header: identified by position
      const cells = splitRow(line);
      current = {
        heading,
        subheading,
        columns: cells.map((c) => c.trim()),
        expected: cells.length,
        // M5: a lane's table sits DIRECTLY under its H3. Anything under an H4 is an auxiliary
        // table (the §2.5 pattern) and is not lane-checked — otherwise adding a detail
        // sub-table under a lane heading hard-fails CI, which is the per-lane false-positive
        // shape this design exists to avoid, re-introduced one level up.
        isLane: /^#{2,4} 2\.[234](?![.\d])/.test(heading) && subheading === '',
        rows: [],
      };
      tables.push(current);
      return;
    }

    if (isTableLine(line)) {
      if (!current) { orphans.push(idx + 1); return; } // H1: a row with no header above it
      const cells = splitRow(line);
      current.rows.push({
        line: idx + 1,
        id: (cells[1] || '').trim(),
        cols: cells.length,
        cells: cells.map((c) => c.trim()),
      });
      return;
    }

    // GFM: a blank line terminates a table. Keeping `current` alive across blanks made a
    // pipe-delimited paragraph after a table parse as a lane row, producing a closed-row
    // finding on text that renders as prose.
    current = null;
  });
  return { tables, orphans };
}

/**
 * Index of the column matching the FIRST name that is present, searched in the order given.
 *
 * The previous form used `findIndex` over a `names.some(...)` predicate, which returns the
 * first column matching ANY name — so argument order was ignored and a `Stage` column
 * preempted the real `Status`. That silently pointed the closed-row check at the wrong cell,
 * which is precisely the misalignment this helper was written to prevent.
 */
function columnIndex(table, ...names) {
  for (const n of names) {
    const i = table.columns.findIndex((c) => c.toLowerCase() === n.toLowerCase());
    if (i !== -1) return i;
  }
  return -1;
}

/** Strip markdown emphasis so a decorated score is still read as a number (M4). */
function numericCell(cell) {
  // Anchored on purpose. `parseFloat` read `4.5 → 1.9` as 4.5 and `1 2` as 12, so a rescoped
  // row annotated in-cell sorted by its PRE-rescope score — the exact stale-priority failure
  // the ordering check exists to catch.
  // Emphasis is stripped; INTERNAL whitespace is not. Collapsing it first turned `1 2` into
  // 12 — a value above any RICE-reachable score, silently accepted as an ordering key.
  const c = String(cell || '').replace(/[*~`_]/g, '').trim();
  return /^-?\d+(\.\d+)?$/.test(c) ? Number.parseFloat(c) : NaN;
}

/**
 * Every row must match its own table's header width.
 *
 * Catches both observed classes: a row short a column (BUG-17/BUG-18 at 10 of 11) and a
 * foreign-width row pasted into a narrower table (BUG-14 at 11 inside §2.5's 5).
 */
function checkArity(tables) {
  const problems = [];
  for (const t of tables) {
    for (const r of t.rows) {
      if (r.cols === t.expected) continue;
      const where = t.subheading || t.heading || 'table';
      // L9: a row missing only its trailing `|` yields one fewer empty edge element, so the
      // raw arithmetic under-reports by one and never names the actual error. The author
      // counts N cells, the gate says N-1, and the likeliest hand-edit goes undiagnosed.
      const hint = r.cols === t.expected - 1 && !r.cells[r.cells.length - 1] === false
        ? ' (row may be missing its trailing `|`)'
        : '';
      problems.push(
        `column count: ${r.id || 'row'} (line ${r.line}) has ${r.cols - 2} columns, `
        + `but ${where} declares ${t.expected - 2}${hint}`,
      );
    }
  }
  return problems;
}

/**
 * Lane tables are score-ordered and hold no closed rows.
 *
 * Closed rows are reported and then EXCLUDED from the ordering walk, so a closed row that is
 * also out of position is named once, as the closing-move failure it is.
 */
function checkLaneShape(tables) {
  const problems = [];
  // Grouped by heading so the ordering cursor spans a whole lane. Scoping `prev` per table let
  // a score jump back up at any table boundary inside a lane — prose or an H4 between two runs
  // of rows was enough, and returned zero problems over an inverted pair.
  const byLane = new Map();
  for (const t of tables) {
    if (!t.isLane) continue;
    if (!byLane.has(t.heading)) byLane.set(t.heading, []);
    byLane.get(t.heading).push(t);
  }
  for (const [heading, group] of byLane) {
    let prev = null;
    for (const t of group) {
      const si = columnIndex(t, 'Score');
      const ti = columnIndex(t, 'Status', 'Stage');
      if (si === -1 || ti === -1) {
        problems.push(`lane shape: ${heading} has a table with no Score and/or Status column — cannot check order`);
        continue;
      }
      for (const r of t.rows) {
        if (r.cols !== t.expected) {
          problems.push(
            `lane checks skipped: ${r.id} (line ${r.line}) — its column count is wrong, so Score `
            + 'and Status cannot be located. Fix the arity finding above and re-run.',
          );
          continue;
        }
        if (isClosed(r.cells[ti])) {
          problems.push(
            `closed row in lane: ${r.id} (line ${r.line}) is closed but still sits in ${heading}. `
            + 'Clause 3 evicts closed rows to §2.5 — complete the Closing a Row move rather than re-sorting.',
          );
          continue;
        }
        // T69: arity proves the Filed cell EXISTS; nothing proved it holds a date. An empty or
      // free-text cell would pass every other check, and a date column nobody can trust is
      // worse than no column — the staleness rule would key its trigger on noise.
      const fi = columnIndex(t, 'Filed');
      if (fi !== -1) {
        const filed = String(r.cells[fi] || '').trim();
        if (!/^(\d{4}-\d{2}-\d{2}|[—–-])$/.test(filed)) {
          problems.push(
            `filed date: ${r.id} (line ${r.line}) has Filed \`${filed}\` — expected YYYY-MM-DD or \`—\``,
          );
        }
      }

      const raw = r.cells[si];
        const score = numericCell(raw);
        if (!Number.isFinite(score)) {
          if (!/^[—–-]$/.test(String(raw).trim())) {
            problems.push(`unparseable score: ${r.id} (line ${r.line}) has Score \`${raw}\` — not a number and not \`—\``);
          }
          continue;
        }
        if (prev !== null && score > prev.score + 1e-9) {
          problems.push(
            `lane order: ${r.id} (line ${r.line}, score ${score}) sits below ${prev.id} (score ${prev.score})`,
          );
        }
        prev = { id: r.id, score };
      }
    }
  }
  return problems;
}

/**
 * H2: reconcile what the parser walked against an independent count of table lines.
 *
 * Without this the PASS line is computed by a different code path than the scan — `defined.size`
 * is a regex over raw text and `tables.length` counts objects — so a truncated parse produced a
 * byte-identical PASS. Any divergence here means rows exist that no check ever saw.
 */
function checkCoverage(text, tables, orphans = []) {
  const lines = text.split('\n');
  let expected = 0;
  let inFence = false;
  lines.forEach((line, idx) => {
    if (/^\s*(```|~~~)/.test(line)) { inFence = !inFence; return; }
    if (inFence) return;
    // DELIBERATELY PERMISSIVE and independent of the parser's predicates. Any line that opens
    // with a pipe and carries at least two of them is a table row unless it is a separator or
    // a header. Sharing `isTableLine` here is what made the Round 1 version incapable of
    // detecting a classification bug: a misclassified line was subtracted from both sides.
    if (!/^\s*\|/.test(line)) return;
    if ((line.match(/(?<!\\)\|/g) || []).length < 2) return;
    if (/^\s*\|[-:\s|]*-[-:\s|]*\|\s*$/.test(line)) return;
    const next = lines[idx + 1] || '';
    if (/^\s*\|[-:\s|]*-[-:\s|]*\|\s*$/.test(next)) return; // header
    expected += 1;
  });
  const scanned = tables.reduce((a, t) => a + t.rows.length, 0);
  const problems = [];
  if (scanned !== expected) {
    problems.push(
      `row coverage: parser walked ${scanned} table rows but a permissive independent count `
      + `finds ${expected}. ${Math.abs(expected - scanned)} row(s) diverge — a PASS here could `
      + 'cover content no check ever saw.',
    );
  }
  for (const line of orphans) {
    problems.push(`orphan row at line ${line}: a table row with no header/separator pair above it`);
  }
  return { problems, scanned, expected };
}

/**
 * Assert the document still has the shape the format spec mandates.
 *
 * This is the only check that does not depend on the parser being correct, which is the point.
 * The Round 2 code printed `PASS — ... 0 lanes ordered and free of closed rows` and exited 0
 * when every lane heading was demoted one level: `checkLaneShape` iterated nothing, returned
 * `[]`, and the vacuous sentence was literally true. A floor turns that into a failure without
 * needing to know why the parse went wrong.
 *
 * Lane identity is derived from the spec's required section anchors, not from a magic number.
 */
const REQUIRED_SECTIONS = ['2.1', '2.2', '2.3', '2.4', '2.5'];
const LANE_SECTIONS = ['2.2', '2.3', '2.4'];

function assertStructure(text, tables) {
  const problems = [];
  for (const sec of REQUIRED_SECTIONS) {
    if (!new RegExp(`^### ${sec.replace('.', '\\.')}\\b`, 'm').test(text)) {
      problems.push(`structure: required section \`### ${sec}\` is missing or not an H3`);
    }
  }
  for (const sec of LANE_SECTIONS) {
    const lanes = tables.filter((t) => t.isLane && new RegExp(`^### ${sec.replace('.', '\\.')}\\b`).test(t.heading));
    if (lanes.length === 0) {
      problems.push(
        `structure: §${sec} declares a lane but produced no checkable lane table — `
        + 'its rows were never order-checked. This is the failure that prints "0 lanes ordered" and exits 0.',
      );
    } else if (lanes.length > 1) {
      problems.push(`structure: §${sec} produced ${lanes.length} lane tables; expected exactly one`);
    }
  }
  return problems;
}

/** Row IDs that exist, and IDs referenced from row text. */
/** Blank out fenced blocks so examples inside them neither define nor reference an id. */
function stripFences(text) {
  let inFence = false;
  return text.split('\n').map((line) => {
    if (/^\s*(```|~~~)/.test(line)) { inFence = !inFence; return ''; }
    return inFence ? '' : line;
  }).join('\n');
}

function collectIds(rawText) {
  const text = stripFences(rawText);
  const defined = new Set();
  for (const m of text.matchAll(/^\| ((?:BUG-|T|I|A|U|P|D)\d+) \|/gm)) defined.add(m[1]);
  const referenced = new Set();
  for (const m of text.matchAll(/\b((?:BUG-|T)\d+)\b/g)) referenced.add(m[1]);
  return { defined, referenced };
}

/**
 * T79: detect that a CLOSE IS OWED — a row whose work has already shipped but whose
 * row is still sitting in a lane.
 *
 * WHY THIS EXISTS
 *   Six times between 2026-08-25 and 2026-08-27 a work commit landed and left its row
 *   `Open`/`Backlog`: `8f543cdc` (BUG-13), `3c605a37` (T58), `9740d61d`+`78af4f6d` (T51),
 *   plus T70(b), T57 and T69 caught mid-session. Every one was found by a human happening
 *   to look. Two were left open by the agent who had, hours earlier, told a sibling session
 *   that the close is part of the work — so exhortation demonstrably does not fix this.
 *
 * WARN, NEVER FAIL
 *   A fix legitimately precedes its close within a session, and this check runs in the same
 *   CI that would gate the very commit shipping the fix. A hard failure would make the
 *   correct workflow impossible. This reports and exits 0; `main` never adds it to `problems`.
 *
 * VERBS
 *   `docs(<ID>)` is excluded deliberately, and that exclusion is the load-bearing one: in this
 *   repo `docs(...)` is the CLOSING verb. Measured against this tree — adding `docs` produces FIVE
 *   false positives (T53, T75, T77, T78, T80), every one a filing or recording commit rather than
 *   a fix, which would flag correctly-handled rows as owing a close. (`chore` adds none on its own;
 *   an earlier version of this comment said "docs/chore" and cited six, counting T79 before this
 *   change closed it. Both numbers move as rows close — re-measure, do not trust the figure.)
 *
 *   The included set widens T79's specified `fix|feat` to the other verbs that ship WORK. Stated
 *   honestly: that widening is PRECAUTIONARY and there is NO baseline showing it helps — measured
 *   on this tree, the wide set and `fix|feat` both find zero pass-1 hits, so "the wide set adds
 *   nothing" and "neither finds anything" are the same observation. It is here because history
 *   contains real work commits under other verbs — `87a86b72 governance(T71)` and
 *   `198deece test(BUG-13)` — whose rows happen to be closed already.
 */
const WORK_VERBS = new Set(['fix', 'feat', 'perf', 'refactor', 'test', 'governance']);

/**
 * Read commit subjects, or explain why it could not.
 *
 * Returns `inert: true` rather than an empty list when history is unavailable. That distinction
 * is the whole point: this check runs in the `agent-surface-parity` job, which sets
 * `fetch-depth: 0` for the PARITY step's benefit, not for this one. If that is ever relaxed, a
 * shallow clone yields zero subjects, zero hits and a silent clean bill of health — a check that
 * cannot fail. Three of those shipped in this project in a single session on 2026-08-25.
 */
function gitSubjects(root) {
  try {
    const shallow = execFileSync('git', ['rev-parse', '--is-shallow-repository'], {
      cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'],
    }).trim();
    if (shallow === 'true') {
      return { subjects: [], inert: true, reason: 'the clone is shallow, so most history is absent' };
    }
    const out = execFileSync('git', ['log', '--no-merges', '--pretty=%h %s'], {
      cwd: root, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'],
    });
    const subjects = out.split('\n').filter(Boolean);
    if (subjects.length === 0) {
      return { subjects: [], inert: true, reason: 'git returned no commits' };
    }
    return { subjects, inert: false, reason: null };
  } catch (err) {
    // stderr is captured, not discarded: without it an empty repo reports "git is unavailable",
    // whose real cause is "does not have any commits yet", and a bad cwd reports ENOENT as if the
    // binary were missing. The safety property holds either way -- this is about the diagnosis
    // being true, not about the branch being reached.
    const stderr = err && err.stderr ? String(err.stderr).trim().split('\n')[0] : '';
    const detail = stderr || (err && err.message ? String(err.message).split('\n')[0] : String(err));
    return { subjects: [], inert: true, reason: `git log could not be read (${detail.slice(0, 140)})` };
  }
}

/**
 * T103: the SECOND SOURCE. Story status lives in `sprint-status.yaml`, which no gate read.
 *
 * WHY THIS EXISTS
 *   T79 gave the project an owed-close scan over LANE ROWS. Stories are tracked in a different
 *   file, so a story whose work ships stays `backlog` with nothing watching. Measured
 *   2026-08-30 by the `dist-epic-2` readiness assessment: `dist-2-1` and `dist-2-5` both read
 *   `backlog` while their work had landed. Both were found by a human reading the file, not by
 *   a gate — without that pass Epic 2 would have been picked up with two phantom stories.
 *
 * WHY NO YAML PARSER
 *   This script requires only `fs`, `path` and `child_process` — zero third-party deps in a
 *   CI-blocking audit. `8c5de2f8` had just finished fixing that exact class for `dist-2-4`,
 *   where a `js-yaml` require resolved on every developer machine and did not exist on the
 *   `fresh-install` runner (T104).
 *
 * EVERY IN-BLOCK LINE LANDS IN EXACTLY ONE BUCKET, AND THAT IS THE WHOLE POINT.
 *   The first version of this function returned only the lines it understood. Anything else --
 *   a key whose value fell outside the charset -- was dropped before any counter could see it,
 *   so it was neither scanned nor reported. That was live, not theoretical: line 689 reads
 *   `v63-4-3-...: descoped-by-ADR`, and uppercase `ADR` fails `[a-z-]+`. 451 candidate lines
 *   parsed to 450 rows, and the scan printed `93 live stories (0 key(s) unparseable)` over a
 *   story it had silently lost. Both Round 1 reviewers found it independently.
 *
 *   So: blank and comment lines are ignored, matched lines become `rows`, and EVERYTHING ELSE
 *   becomes `unrecognized`.
 *
 * AND A CONSERVATION LAW OVER THE WHOLE FILE, WHICH IS THE ACTUAL INSTRUMENT.
 *   Round 1 fixed the line-level drop. Round 2 then found the SAME defect one level up: a
 *   single de-indented key closes the block permanently, and `inBlock` never re-opens, so on
 *   this tree 302 of 451 keys vanished -- every bucket printing 0, exit 0, and the one true
 *   positive gone. De-indenting a line is the likeliest hand-edit error in a 987-line YAML
 *   file that humans flip statuses in by hand.
 *
 *   Enumerating drop paths one at a time is the wrong instrument: each fix covers the instance
 *   and the next level up stays open. So every line that has the shape of a story key, and that
 *   the block bound did NOT cover, is collected into `outsideBlock` and reported. A truncation
 *   therefore surfaces as a pile of stranded keys instead of a shorter clean-looking count.
 *
 * WHAT THIS DOES NOT GUARANTEE -- stated because an earlier version of this comment claimed it
 * did. The residue predicate runs in the `!inBlock` branch and shares `inBlock` with the parse,
 * so it is NOT independent of the bound. It detects a bound that closed too EARLY, and also one
 * that never opened at all (every key then falls into the residue) -- an earlier version of this
 * sentence claimed the latter was undetectable, which is false and was measured. What it cannot
 * detect is a bound that closed too LATE, since those lines are inside the block by definition.
 * It also keys
 * on the lowercase-slug shape real story keys have, so a de-indented `Dist-2-5-x:` or
 * `dist_2_5_x:` is still dropped without trace. Narrow in practice, not nothing.
 */
function parseStoryStatuses(text) {
  // Split on CRLF as well as LF. `\r` survives `/^...$/` in the key regex but not in the block
  // opener, so a Windows checkout previously opened the block and then matched no key at all --
  // reporting "yielded no entries", which names the wrong cause. There is no `.gitattributes`
  // in this repo, so `core.autocrlf=true` reaches it.
  // Sole-CR is included: a classic-Mac or mangled file would otherwise collapse to one line,
  // opening no block and losing every key at once.
  const lines = String(text).split(/\r\n|\n|\r/);
  const rows = [];
  const unrecognized = [];
  const outsideBlock = [];
  let inBlock = false;
  lines.forEach((line, idx) => {
    if (!inBlock) {
      if (/^development_status:\s*$/.test(line)) inBlock = true;
      // The residue. A LOOSER predicate than the row regex below, so a key the row regex would
      // have rejected is still seen. It runs only while the block is closed, which is the whole
      // of what it can detect: keys stranded by a bound that ended too early. Anything shaped
      // like a story key at story indent belongs inside the block, so finding one here means
      // the parse stopped somewhere it should not have.
      else if (/^ {2}[a-z0-9-]+: *\S/.test(line)) outsideBlock.push({ line: idx + 1, text: line.trim() });
      return;
    }
    // The bound: the next key at zero indent closes the block, which is what keeps
    // `action_items:` out of scope. Blank lines and comments do not close it -- both are
    // ordinary YAML, and closing on them would truncate the scan silently.
    //
    // A second `development_status:` RE-OPENS rather than closing. Reached only on malformed
    // input -- a duplicate top-level key -- but the previous form consumed that line as a
    // closer and then never re-entered, so every key below it vanished with no bucket and no
    // trace, printing a clean denominator. That is the exact silent-drop class this function
    // exists to prevent, one level up from where it was fixed.
    if (/^[^\s#]/.test(line)) {
      // THE CLOSING LINE ITSELF IS ACCOUNTED FOR. The conservation law had a blind spot at its
      // own boundary: a story key that loses its indent is consumed here, and the residue
      // predicate below requires two-space indent, so it could match nothing. De-indenting the
      // LAST key of the block therefore lost it with every bucket empty and the arithmetic
      // still balancing -- exactly the hand-edit the comment above calls most likely, and the
      // one input this whole mechanism exists to catch.
      //
      // FALSE-POSITIVE EXPOSURE, MEASURED. `action_items:` and `last_updated:` are excluded by
      // the underscore and by needing a value, but `generated:` and `project:` are neither, and
      // both match this predicate. They are safe ONLY because they sit above `development_status:`
      // and so are never reached with the block open -- safety by ordering, not by the slug
      // class. Move either below the block, or add an underscore-free sibling, and the gate
      // reports it as a lost story key. Tracked in deferred-work.
      if (/^[a-z0-9-]+: *\S/.test(line)) outsideBlock.push({ line: idx + 1, text: line.trim() });
      inBlock = /^development_status:\s*$/.test(line);
      return;
    }
    if (!line.trim()) return;
    if (/^\s*#/.test(line)) return;
    // Two-space indent is the story level. The VALUE charset is deliberately structural (a bare
    // scalar token) rather than a list of the status words we happen to know: `[a-z-]+` was an
    // allowlist wearing a regex, and the frozen rule is that the live set is an EXCLUSION. It
    // cost a real story -- line 689's `descoped-by-ADR` failed on the uppercase `ADR` and left
    // the population without a trace. Quoted values, nested maps and trailing comments still
    // fall through to `unrecognized`, which is what that bucket is for: structural surprises,
    // not unfamiliar vocabulary.
    // The value must START WITH A LETTER. Widening the charset to stop rejecting
    // `descoped-by-ADR` also began admitting `2026-08-30`, `1.5`, `0`, `-` and `.` as statuses,
    // any of which would make a key "live" on a value that is not a status word at all. A
    // leading-letter rule keeps every real status and sends the rest to `unrecognized`, where
    // it is named rather than silently believed. Trailing spaces are tolerated: a status is not
    // less terminal for having one, and treating `done ` as a coverage hole is a false alarm.
    const m = /^ {2}([a-z0-9-]+):[ \t]*([A-Za-z][A-Za-z0-9_.-]*)[ \t]*$/.exec(line);
    if (m) rows.push({ line: idx + 1, key: m[1], status: m[2] });
    else unrecognized.push({ line: idx + 1, text: line.trim() });
  });
  return { rows, unrecognized, outsideBlock };
}

/** A story-number segment: `2`, `5`, `1b`. The trailing letter is real -- `v63-1b-1` ships. */
const STORY_SEGMENT = /^\d+[a-z]*$/;

/**
 * Guard for a DERIVED story id. Deliberately separate from `checkOwedCloses`' lane `ID_SHAPE`,
 * which is load-bearing against blank cells and must not be widened to admit `dist-2-5`.
 */
const STORY_ID_SHAPE = /^(?:[a-z][a-z0-9]*-)*\d+[a-z]*-\d+[a-z]*$/;

/**
 * Map a `development_status` key to the id a commit would scope itself with.
 *
 * The key is a full slug and the scope is its prefix: `dist-2-5-close-bug-19-...` is scoped
 * `fix(dist-2-5)`. Verified against history -- 18 story-shaped scope tokens across 4105
 * commits, zero of which match no derived key.
 *
 * RETURNS A DISCRIMINATED RESULT, NOT A BARE `null`, so a deliberate skip and a coverage hole
 * are never confused. `i97-bug-1-fix-p0-activation-defects` is a real key that yields no id
 * (`bug` sits where a number must be); it is `done` today, but the caller names it either way.
 */
function storyId(key) {
  const seg = String(key).split('-');
  for (let i = 0; i < seg.length; i += 1) {
    // Epics are excluded by operator decision (Amalik, 2026-08-30): an epic key is
    // `in-progress` BY DEFINITION while its stories ship, so warning on it is noise by
    // construction. Measured before the decision: including them made `dist-epic-2` warn 3x.
    //
    // `epic` must be FOLLOWED BY A NUMBER to count. A bare segment test would swallow a story
    // whose name merely contains the word -- `x-epic-flow-1-2` -- and, unlike `unparseable`,
    // the epic path is a silent skip by design, so there would be no trace of the loss.
    //
    // `epic` counts only when followed by a number AND NOT by a second one. `dist-epic-2` is an
    // epic; `x-epic-1-2` and `dist-epic-2-1-a-story` carry a full story pair and are stories.
    // Without the second clause both were swallowed by the epic path -- which, unlike
    // `unparseable`, is a silent skip by design, so the loss left no trace anywhere.
    if (seg[i] === 'epic'
      && STORY_SEGMENT.test(seg[i + 1] || '')
      && !STORY_SEGMENT.test(seg[i + 2] || '')) return { kind: 'epic' };
    if (STORY_SEGMENT.test(seg[i]) && STORY_SEGMENT.test(seg[i + 1] || '')) {
      const id = seg.slice(0, i + 2).join('-');
      return STORY_ID_SHAPE.test(id) ? { kind: 'story', id } : { kind: 'unparseable' };
    }
  }
  return { kind: 'unparseable' };
}

/**
 * Read the story statuses, or explain why it could not.
 *
 * Mirrors `gitSubjects`' contract for the same reason: a missing file yields zero rows, zero
 * hits and a silent clean bill of health. `inert` is the difference between "nothing diverges"
 * and "nothing was looked at".
 */
function readSprintStatus(root) {
  let text;
  try {
    text = fs.readFileSync(path.join(root, SPRINT_STATUS), 'utf8');
  } catch (err) {
    const detail = err && err.message ? String(err.message).split('\n')[0] : String(err);
    return {
      rows: [], unrecognized: [], outsideBlock: [], inert: true,
      reason: `${SPRINT_STATUS} could not be read (${detail.slice(0, 140)})`,
    };
  }
  const { rows, unrecognized, outsideBlock } = parseStoryStatuses(text);
  if (rows.length === 0 && unrecognized.length === 0 && outsideBlock.length === 0) {
    return {
      rows: [], unrecognized: [], outsideBlock: [], inert: true,
      reason: `${SPRINT_STATUS} yielded no \`development_status:\` entries`,
    };
  }
  return { rows, unrecognized, outsideBlock, inert: false, reason: null };
}

/**
 * The story pass matches a NARROWER verb set than the lane pass, and the narrowing is measured.
 *
 * `WORK_VERBS` is precautionary and says so. For stories there is a baseline. Classified by
 * `storyId` below -- i.e. the population this pass actually scans, epics excluded -- the
 * story-scoped subjects across 4105 commits carry `docs` 37, `fix` 10, `feat` 8,
 * `governance` 1, `chore` 1, `revert` 0. (Including epic-scoped commits gives docs 41,
 * governance 4, revert 1; that is a different population and the earlier figures here quoted it
 * by mistake.) The only hit the wide set adds is
 * `5fae72ae governance(dist-2-8): retract ADR-005`, a retraction rather than a ship.
 *
 * That matters more here than elsewhere, because THIS gate's failure mode is being ignored. It
 * is warn-level inside a job that passes; one unactionable warning is what turns the scan into
 * wallpaper, and it dilutes T79's four lane warnings alongside. The same reasoning is already
 * in this repo's history: `51f6f21c` was deliberately scoped `governance(backlog)` rather than
 * `governance(T103)` so it would not manufacture a false positive against its own row, and it
 * names `fca40f62 governance(T99)` as one that was manufactured exactly that way.
 */
const STORY_VERBS = new Set(['fix', 'feat']);

/**
 * How a skip bucket is described. ONE source for both output channels.
 *
 * `superseded` is not a coverage hole: the later value WAS scanned, and last-write-wins is
 * correct YAML semantics. The first fix for that corrected the console line and left the CI
 * annotation -- the noisier channel, and the one a human reads in the PR UI rather than in log
 * scrollback -- still saying "not scanned". Two templates for one fact is how that happened, so
 * there is now one.
 */
function bucketLabel(name) {
  return name === 'superseded'
    ? 'superseded — the later value was scanned instead'
    : `${name} — NOT scanned, so no divergence could be found for them`;
}

/** Percent-escape a GitHub Actions workflow-command payload. The payload is a commit subject. */
function escapeAnnotation(s) {
  return String(s).replace(/%/g, '%25').replace(/\r/g, '%0D').replace(/\n/g, '%0A');
}

function checkOwedCloses(tables, root) {
  // Only rows whose first cell actually LOOKS like an ID. `r.id` is whatever sits in column 1,
  // and a malformed row can leave it empty -- in which case pass 2 below builds `new RegExp('\\b\\b')`,
  // which matches at every word boundary and reports one row as owed against the entire legacy
  // history. This matters because `main()` runs the scan on its FAILURE path too, so the very
  // documents most likely to contain a blank cell are the ones that reach here.
  // Also the reason pass 2 can interpolate an id into a RegExp without escaping it.
  const ID_SHAPE = /^[A-Za-z]+-?\d+$/;
  const live = new Map();
  for (const t of tables.filter((x) => x.isLane)) {
    for (const r of t.rows) {
      if (!ID_SHAPE.test(r.id) || live.has(r.id)) continue;
      live.set(r.id, r);
    }
  }
  // T103's second population. Built BEFORE the git read so a missing sprint-status.yaml is
  // reported as its own failure rather than being masked by an inert git one.
  const sprint = readSprintStatus(root);
  const storyLive = new Map();
  // Every key that did NOT enter the live set, and why. Named rather than counted: a bare
  // number leaves the reader hand-scanning a 987-line file, which is not an actionable finding.
  const storySkipped = {
    'outside the block': sprint.outsideBlock.map((u) => `${SPRINT_STATUS}:${u.line} \`${u.text}\``),
    unrecognized: sprint.unrecognized.map((u) => `${SPRINT_STATUS}:${u.line} \`${u.text}\``),
    superseded: [],
    unparseable: [],
    collapsed: [],
  };
  // Last write wins, matching YAML: a duplicated key's effective value is the last one. First-
  // wins would warn on a story the file has already reconciled.
  //
  // The superseded row is RECORDED, not merely overwritten. `keys read` counts raw lines, so a
  // dedup that reports nothing makes the denominator overcount by exactly the rows it dropped
  // -- the same accounting hole as an unbucketed line, arriving one step later.
  // Counted, not bucketed: `done` and `epic` are legitimate exits, but 319 + 38 keys leaving
  // the population with no trace made 357 of 451 unaccounted for in a denominator that read
  // clean. With them present the arithmetic reconciles, so an epic-guard regression that
  // reclassifies real stories shows up as a shifted count instead of a quiet shrink.
  let storyDone = 0;
  let storyEpic = 0;
  const byKey = new Map();
  for (const r of sprint.rows) {
    if (byKey.has(r.key)) storySkipped.superseded.push(`${r.key} (line ${byKey.get(r.key).line}, superseded by line ${r.line})`);
    byKey.set(r.key, r);
  }
  for (const r of byKey.values()) {
    // LIVE IS EVERY STATUS EXCEPT `done` -- an exclusion, never an allowlist. `review` appears
    // 120 times in this file's history and is absent from it today; an allowlist of the four
    // statuses currently present would go silent on exactly the ship-to-close window this scan
    // watches, while the denominator kept reading healthy.
    //
    // Compared case-INSENSITIVELY. The widened value charset admits `Done` and `DONE`, and an
    // exact match would report a finished story as diverging -- a false positive, which for a
    // warn-level gate is the failure that gets it ignored.
    if (r.status.toLowerCase() === 'done') { storyDone += 1; continue; }
    const d = storyId(r.key);
    if (d.kind === 'epic') { storyEpic += 1; continue; }
    if (d.kind === 'unparseable') { storySkipped.unparseable.push(`${r.key} (line ${r.line})`); continue; }
    if (storyLive.has(d.id)) {
      storySkipped.collapsed.push(`${r.key} (line ${r.line}) → ${d.id}, already taken`);
      continue;
    }
    storyLive.set(d.id, r);
  }

  const { subjects, inert, reason } = gitSubjects(root);
  if (inert) {
    return {
      warnings: [], inert, reason, liveCount: live.size, scanned: 0,
      storyWarnings: [], storyLiveCount: storyLive.size, storySkipped,
      storyRead: sprint.rows.length, storyDone, storyEpic,
      storyInert: sprint.inert, storyReason: sprint.reason,
    };
  }

  // TWO PASSES, because the repo predates its own commit convention.
  //
  // Pass 1 -- conventional subjects. The verb carries the signal, so trust it and match the
  // scope tokens exactly. Splitting is required (`fix(T50,T32)` is a real commit here) and
  // exactness is required (a substring test lets `fix(T5)` claim T51; both IDs exist).
  //
  // Pass 2 -- subjects with NO conventional prefix at all. 3854 of this repo's 4042 subjects
  // predate the convention, and for those there is no verb to read, so pass 1 is structurally
  // blind to them. `92d4506b Ship I20 -- Portfolio markdown formatter` shipped I20's work in
  // April; the row is still `Backlog` in the Fast Lane today and pass 1 cannot see it.
  //
  // Pass 2 falls back to a bare whole-word ID match, and is confined to non-conventional
  // subjects for a measured reason: run over ALL subjects it produces 18 hits of which 17 are
  // false -- `docs(backlog): file T42`, `chore(backlog): log BUG-9 and T30` -- because filing
  // commits name rows too. Confined to legacy subjects it produces exactly ONE hit across 3854
  // of them, and that hit is I20, the true positive. The confinement IS the precision.
  const CONVENTIONAL = /^[a-z]+(\([^)]*\))?!?:/;
  const hits = new Map();
  const record = (id, hash, subject, pass) => {
    if (!hits.has(id)) hits.set(id, []);
    hits.get(id).push({ hash, subject, pass });
  };
  const storyHits = new Map();
  const recordStory = (id, hash, subject) => {
    if (!storyHits.has(id)) storyHits.set(id, []);
    storyHits.get(id).push({ hash, subject });
  };
  for (const line of subjects) {
    const sp = line.indexOf(' ');
    if (sp < 0) continue;
    const hash = line.slice(0, sp);
    const subject = line.slice(sp + 1);
    const m = /^([a-z]+)\(([^)]*)\)!?:/.exec(subject);
    if (m) {
      const toks = m[2].split(/[,\s]+/).filter(Boolean);
      if (WORK_VERBS.has(m[1])) {
        for (const tok of toks) if (live.has(tok)) record(tok, hash, subject, 1);
      }
      // Stories share the parse and the exact-token rule, but NOT the verb set, and they never
      // reach pass 2 below. Pass 2's bare whole-word match is confined to pre-convention
      // subjects for a measured precision reason; stories postdate the convention entirely, so
      // it would buy nothing and cost plenty -- the slug `dist-2-5-close-bug-19-...` literally
      // contains `bug-19`, and a loose tokenizer would cross-contaminate it with the BUG-19
      // lane row.
      if (STORY_VERBS.has(m[1])) {
        for (const tok of toks) if (storyLive.has(tok)) recordStory(tok, hash, subject);
      }
      continue;
    }
    if (CONVENTIONAL.test(subject)) continue; // conventional but scope-less: pass 1's business
    for (const id of live.keys()) {
      // Two constraints that are NOT decoration:
      //
      // CASE-SENSITIVE. Artifact filenames in this repo are ID-prefixed and lowercase --
      // `p3-epic-4-retro-2026-03-07.md`, `i97-*`, `a39-*`. Measured: matching case-insensitively
      // takes pass 2 from 1 hit to ~36, almost all of them a *different*, historical P3. A future
      // edit adding `/i` to "make matching robust" would silently destroy this check's precision;
      // a test pins it.
      //
      // NOT A FILENAME PREFIX. `\b` treats the hyphen in `P4-enhance-module-architecture.md` as a
      // boundary, so a bare `\bP4\b` matches it. P4 sits in §2.5 today, but parked rows are
      // reinstated by copy-back into a lane, and the day P4 comes back it would arrive with two
      // false positives attached. Excluding `<ID>-<letter>` costs nothing real: measured, it drops
      // P4's 2 false hits and keeps both of I20's true ones.
      if (new RegExp(`\\b${id}\\b(?!-[A-Za-z])`).test(subject)) {
        record(id, hash, subject, 2);
      }
    }
  }

  const warnings = [...hits.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([id, cs]) => {
      const row = live.get(id);
      // One constant for both, so the list and the count cannot disagree: deriving `more` from a
      // separate literal let a widened slice show every commit while still claiming N withheld.
      const SHOW = 2;
      const shown = cs.slice(0, SHOW).map((c) => `${c.hash} ${c.subject}`).join('; ');
      const more = cs.length > SHOW ? ` (+${cs.length - SHOW} more)` : '';
      // Pass 2 is a bare name match on a pre-convention subject, so it is weaker evidence than
      // a `fix(<ID>)` scope. Say so rather than presenting both at the same confidence.
      const weak = cs.every((c) => c.pass === 2) ? ' [named in a pre-convention subject, verify by hand]' : '';
      return `close may be owed: ${id} (line ${row.line}) is still in a lane, but ${cs.length} `
        + `work commit(s) name it${weak} — ${shown}${more}`;
    });

  // Phrased as DIVERGENCE, deliberately -- never as "a close is owed". The scan compares a
  // status against history; it cannot tell whether the work is finished. `dist-2-5` is the
  // worked example: it merged FR17 and FR18 so one story would close BUG-19, only FR17 shipped,
  // and the correct response there is RE-SCOPE, not close. Asserting a close would be wrong
  // advice delivered confidently. Mirrors T79's footer, which already declines to assert that a
  // fix closes a row.
  const storyWarnings = [...storyHits.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([id, cs]) => {
      const row = storyLive.get(id);
      const SHOW = 2;
      const shown = cs.slice(0, SHOW).map((c) => `${c.hash} ${c.subject}`).join('; ');
      const more = cs.length > SHOW ? ` (+${cs.length - SHOW} more)` : '';
      return `status divergence: ${id} (${SPRINT_STATUS}:${row.line}) reads \`${row.status}\`, `
        + `but ${cs.length} work commit(s) name it — ${shown}${more}`;
    });

  return {
    warnings, inert: false, reason: null, liveCount: live.size, scanned: subjects.length,
    storyWarnings, storyLiveCount: storyLive.size, storySkipped,
    storyRead: sprint.rows.length, storyDone, storyEpic,
    storyInert: sprint.inert, storyReason: sprint.reason,
  };
}

function check(text) {
  const problems = [];
  const { defined, referenced } = collectIds(text);

  // 1. Referential integrity.
  for (const ref of [...referenced].sort()) {
    if (!defined.has(ref)) problems.push(`dangling reference: ${ref} is cited but has no row`);
  }

  // 2 & 3. Shape and lane invariants, per T58.
  const { tables, orphans } = parseTables(text);
  problems.push(...assertStructure(text, tables));
  problems.push(...checkCoverage(text, tables, orphans).problems);
  problems.push(...checkArity(tables));
  problems.push(...checkLaneShape(tables));

  return problems;
}

/**
 * Print the T79 warnings. Called on BOTH the PASS and FAIL paths on purpose: an owed close is
 * most likely precisely when something else about the file is also wrong, and reporting it only
 * on the clean path would hide it exactly when it matters.
 */
function reportOwedCloses(tables, root) {
  const res = checkOwedCloses(tables, root);
  reportLaneOwedCloses(res);
  reportStoryDivergences(res);
}

/**
 * T79's lane block. Kept BYTE-IDENTICAL while T103 was added around it — the story source is a
 * second population feeding the same scanner, not a change to what the lane scan says. Any edit
 * here is a change to a shipped output that other readers, and tests, pin.
 */
function reportLaneOwedCloses({ warnings, inert, reason, liveCount, scanned }) {
  if (inert) {
    console.log('');
    console.log(`  WARN — owed-close scan did not run: ${reason}.`);
    console.log('         This is reported rather than skipped: with no history the scan finds');
    console.log('         nothing and would otherwise read as a clean result. The job running this');
    console.log('         needs `fetch-depth: 0`.');
    return;
  }
  if (warnings.length === 0) {
    // Print the denominators rather than staying silent. A silent clean run is byte-identical to
    // a scan whose matcher has quietly stopped matching -- a regex edit, a WORK_VERBS typo, an
    // `isLane` change -- and this project's own rule is that a check must be shown to be able to
    // fail before it counts as evidence. The numbers are already computed; throwing them away was
    // what made the two states indistinguishable.
    console.log(`  owed-close scan: 0 across ${liveCount} live lane rows (${scanned} commits scanned).`);
    return;
  }
  console.log('');
  console.log(`  WARN — ${warnings.length} possible owed close(s) across ${liveCount} live lane rows `
    + `(${scanned} commits scanned):`);
  console.log('');
  for (const w of warnings) console.log(`    ${w}`);
  console.log('');
  console.log('  A shipped fix does not close a row. Closing is a MOVE: flip the status, delete the');
  console.log('  row from its lane, append a receipt to §2.5, and add a Change Log entry.');
  console.log('  Warn-level by design — a fix may legitimately precede its close within a session.');
}

/**
 * T103's story block. Printed AFTER the lane block and separately from it, so the lane output
 * stays byte-identical and a reader can tell the two sources apart.
 */
function reportStoryDivergences(res) {
  const {
    inert, storyWarnings, storyLiveCount, storySkipped, storyRead, storyDone, storyEpic,
    storyInert, storyReason,
  } = res;
  // Surfacing is env-guarded so local and fixture output are unchanged, and story-only so the
  // lane block stays byte-identical. It covers the SILENT states too, not just the loud one:
  // "the file could not be read" and "N keys were not scanned" need a reader's attention more
  // than a divergence does, because nothing else in a green job hints at them.
  const annotate = (msgs) => {
    if (process.env.GITHUB_ACTIONS !== 'true') return;
    for (const m of msgs) console.log(`::warning::${escapeAnnotation(m)}`);
  };

  if (storyInert) {
    console.log('');
    console.log(`  WARN — story-status scan did not run: ${storyReason}.`);
    console.log('         Reported rather than skipped: with no story statuses the scan finds');
    console.log('         nothing and would otherwise read as a clean result.');
    annotate([`story-status scan did not run: ${storyReason}`]);
    return;
  }
  // Every skip bucket is counted in the denominator and NAMED when non-empty. A key that left
  // the population silently is the defect Round 1 found live on this tree; a bare count is
  // barely better, since it leaves the reader scanning a 987-line file to find which key.
  const skips = [
    ['outside the block', storySkipped['outside the block']],
    ['unrecognized', storySkipped.unrecognized],
    ['superseded', storySkipped.superseded],
    ['unparseable', storySkipped.unparseable],
    ['collapsed', storySkipped.collapsed],
  ];
  // The arithmetic is printed so it can be RECONCILED, not just read. Every key read leaves the
  // population through exactly one exit: live, done, epic, or a named bucket. Round 2 found 357
  // of 451 keys exiting untracked, which is what let a truncated parse look healthy.
  //
  // HONEST SCOPE: over any possible INPUT this sum is forced true -- `rows.length` is
  // `superseded + byKey.size`, and the loop below partitions `byKey` into exactly these exits.
  // So it cannot catch a truncated parse; `outsideBlock` is what catches that. What it does
  // catch is a FUTURE EDIT adding an exit with no counter, which is how the 357 went missing in
  // the first place. Proven by mutation: inserting one uncounted `continue` turns it red.
  const denom = `${storyLiveCount} live stories (${storyRead} keys read = ${storyLiveCount} live `
    + `+ ${storyDone} done + ${storyEpic} epic + ${storySkipped.superseded.length} superseded `
    + `+ ${storySkipped.unparseable.length} unparseable + ${storySkipped.collapsed.length} collapsed)`;
  const balanced = storyRead === storyLiveCount + storyDone + storyEpic
    + storySkipped.superseded.length + storySkipped.unparseable.length + storySkipped.collapsed.length;
  const named = skips.filter(([, v]) => v.length > 0);
  const SHOW_KEYS = 10;
  const printNamed = () => {
    // Capped for the same reason the commit list at the top of this file is capped: if the file
    // is ever re-indented wholesale, every line lands in a bucket and an uncapped loop turns one
    // warning into hundreds of lines of CI log, burying it.
    for (const [name, entries] of named) {
      console.log('');
      console.log(`  ${entries.length} key(s) ${bucketLabel(name)}:`);
      for (const e of entries.slice(0, SHOW_KEYS)) console.log(`    ${e}`);
      if (entries.length > SHOW_KEYS) console.log(`    (+${entries.length - SHOW_KEYS} more)`);
    }
    if (!balanced) {
      console.log('');
      console.log('  RECONCILIATION FAILED — keys read do not equal the sum of their exits. Some');
      console.log('  key left the population by a path with no counter, which means this code has');
      console.log('  an exit nobody is counting. Treat the figures above as unreliable.');
    }
  };

  if (inert) {
    // git is what is missing and the lane block has already named it -- but staying silent here
    // would hide that a whole population WAS read and never compared, which reads as "no
    // stories diverge". The skip buckets are still reported: whether a key was recognised is a
    // property of the yaml alone, and a coverage hole does not stop being one because history
    // is unavailable.
    console.log(`  story-status scan: ${denom} read but NOT compared — no commit history.`);
    printNamed();
    annotate(named.map(([n, v]) => `${v.length} sprint-status key(s) ${bucketLabel(n)}`)
      .concat(balanced ? [] : ['sprint-status key accounting does not reconcile — figures unreliable']));
    return;
  }

  // `balanced` is part of the condition. Without it the early return fired first and the
  // RECONCILIATION FAILED line was unreachable in precisely the state it exists for: an
  // imbalance with every bucket empty and no divergence, which is what a clean-looking output
  // over unscanned data looks like.
  if (storyWarnings.length === 0 && named.length === 0 && balanced) {
    console.log(`  story-status scan: 0 across ${denom}.`);
    return;
  }
  console.log('');
  if (storyWarnings.length > 0) {
    console.log(`  WARN — ${storyWarnings.length} story status(es) diverge from history, across ${denom}:`);
    console.log('');
    // Capped like the skip lists, and for the same reason: a mass status reset would otherwise
    // turn one warning into hundreds of log lines and hundreds of CI annotations, burying it.
    for (const w of storyWarnings.slice(0, SHOW_KEYS)) console.log(`    ${w}`);
    if (storyWarnings.length > SHOW_KEYS) console.log(`    (+${storyWarnings.length - SHOW_KEYS} more)`);
    console.log('');
    console.log('  This detects DIVERGENCE, not completion: the status and the commit disagree. The');
    console.log('  resolution — close, re-scope, or split — is yours. A story that merged two');
    console.log('  requirements can legitimately have shipped only one, in which case re-scoping is');
    console.log('  correct and closing is wrong.');
    console.log('  Warn-level by design — a fix may legitimately precede its status flip.');
  } else {
    console.log(`  story-status scan: 0 across ${denom}.`);
  }
  printNamed();

  // Without this the finding lives in a passing job's stdout, read only by someone who opens
  // the log. This repo already annotates elsewhere (`ci.yml:148`, `ci.yml:437`). Env-guarded so
  // local and fixture output are unchanged, and story-only so the lane block stays identical.
  annotate(storyWarnings.slice(0, SHOW_KEYS).concat(
    named.map(([n, v]) => `${v.length} sprint-status key(s) ${bucketLabel(n)}`),
    balanced ? [] : ['sprint-status key accounting does not reconcile — figures unreliable'],
  ));
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
    const { tables, orphans } = parseTables(text);
    const lanes = tables.filter((t) => t.isLane).length;
    const { scanned } = checkCoverage(text, tables, orphans);
    // The count reported is the count WALKED, not a regex tally computed elsewhere — otherwise
    // a truncated parse prints a PASS line identical to a clean one.
    console.log(`  PASS — ${scanned} rows walked across ${tables.length} tables; references resolve, `
      + `every row matches its own header, ${lanes} lanes ordered and free of closed rows.`);
    reportOwedCloses(tables, root);
    return 0;
  }
  console.log(`  FAIL — ${problems.length} problem(s):`);
  console.log('');
  for (const p of problems) console.log(`    ${p}`);
  console.log('');
  console.log('  A dangling reference usually means a row was deleted — most often by staging the');
  console.log('  `-` side of a MODIFIED row without its `+` side. Check `git diff` before committing.');
  console.log('  A closed row in a lane is an incomplete Closing a Row move: delete it from the lane');
  console.log('  and append its receipt to §2.5. Do not re-sort it downward.');
  reportOwedCloses(parseTables(text).tables, root);
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

module.exports = {
  BACKLOG, splitRow, isTableLine, isSeparator, isClosed, numericCell,
  parseTables, columnIndex, checkArity, checkLaneShape, checkCoverage, assertStructure, stripFences,
  REQUIRED_SECTIONS, LANE_SECTIONS, collectIds, check, main,
  checkOwedCloses, gitSubjects, reportOwedCloses, WORK_VERBS,
  SPRINT_STATUS, parseStoryStatuses, storyId, readSprintStatus, STORY_VERBS, escapeAnnotation,
  bucketLabel, reportStoryDivergences,
};
