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
  const { subjects, inert, reason } = gitSubjects(root);
  if (inert) return { warnings: [], inert, reason, liveCount: live.size, scanned: 0 };

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
  for (const line of subjects) {
    const sp = line.indexOf(' ');
    if (sp < 0) continue;
    const hash = line.slice(0, sp);
    const subject = line.slice(sp + 1);
    const m = /^([a-z]+)\(([^)]*)\)!?:/.exec(subject);
    if (m) {
      if (!WORK_VERBS.has(m[1])) continue;
      for (const tok of m[2].split(/[,\s]+/).filter(Boolean)) {
        if (live.has(tok)) record(tok, hash, subject, 1);
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
  return { warnings, inert: false, reason: null, liveCount: live.size, scanned: subjects.length };
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
  const { warnings, inert, reason, liveCount, scanned } = checkOwedCloses(tables, root);
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
};
