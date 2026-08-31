const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');

const {
  assertStructure,
  main,
  parseTables,
  checkArity,
  checkLaneShape,
  checkCoverage,
  columnIndex,
  isClosed,
  isSeparator,
  isTableLine,
  numericCell,
  splitRow,
  collectIds,
  check,
  gitSubjects,
  WORK_VERBS,
  parseStoryStatuses,
  storyId,
  STORY_VERBS,
  escapeAnnotation,
} = require('../../scripts/audit/backlog-integrity');

// GITHUB_ACTIONS is neutralised for the WHOLE FILE, not just inside `runIn`.
//
// The reporter emits an extra annotation line per finding when that variable is set, and
// GitHub Actions always sets it — a test counting occurrences of a message therefore passed
// locally and failed on every CI job. `runIn` owns the variable for its own cases, but two
// other harnesses call `main()` directly and would still read the ambient value; today they
// happen to exit on an inert branch before the annotation, which is a coupling between test
// env hygiene and branch ordering in production code. This makes the whole file deterministic
// regardless. `fixture-determinism` names inherited env as one of its non-determinism axes.
const AMBIENT_GITHUB_ACTIONS = process.env.GITHUB_ACTIONS;
before(() => { delete process.env.GITHUB_ACTIONS; });
after(() => {
  if (AMBIENT_GITHUB_ACTIONS === undefined) delete process.env.GITHUB_ACTIONS;
  else process.env.GITHUB_ACTIONS = AMBIENT_GITHUB_ACTIONS;
});

/** parseTables returns { tables, orphans }; most assertions only want the tables. */
const tablesOf = (text) => parseTables(text).tables;

/**
 * Fixtures are hand-built markdown, never the live backlog — per `test-fixture-isolation`,
 * a test that asserts against repository state fails on drift rather than on regression.
 */
const HEAD_BUG = '| ID | Description | R | I | C | E | Score | Portfolio | Status | Dependencies | Linked Follow-up |';
const SEP_BUG = '|----|-------------|---|---|---|---|-------|-----------|--------|--------------|------------------|';
const HEAD_C = '| ID | Description | Shipped | Score | Portfolio |';
const SEP_C = '|----|-------------|---------|-------|-----------|';

const bugRow = (id, score, status) =>
  `| ${id} | desc | 4 | 2 | 90% | 1 | ${score} | convoke | ${status} | — | — |`;

function doc(...parts) {
  return parts.join('\n');
}

describe('parseTables', () => {
  it('derives each table\'s column contract from its own header, not a hardcoded map', () => {
    const t = tablesOf(doc('### 2.2 Bug Lane', '', HEAD_BUG, SEP_BUG, bugRow('BUG-1', '5.0', 'Open')));
    assert.equal(t.length, 1);
    assert.equal(t[0].expected, 13); // 11 cells + 2 empty edges from the split
    assert.equal(t[0].heading, '### 2.2 Bug Lane');
  });

  it('treats an H4 sub-table as its own table — this is why the per-lane check produced 71 false positives', () => {
    const t = tablesOf(doc(
      '### 2.5 Absorbed / Archived', '',
      '#### Completed (shipped)', '', HEAD_C, SEP_C, '| I1 | d | 2026-08-01 | 3.0 | convoke |',
    ));
    assert.equal(t.length, 1);
    assert.equal(t[0].subheading, '#### Completed (shipped)');
    assert.equal(t[0].expected, 7);
  });

  it('separates two sub-tables of different widths under one H3 without conflating them', () => {
    const t = tablesOf(doc(
      '### 2.5 Absorbed / Archived', '',
      '#### A', '', HEAD_C, SEP_C, '| I1 | d | 2026-08-01 | 3.0 | convoke |', '',
      '#### B', '', HEAD_BUG, SEP_BUG, bugRow('BUG-1', '5.0', 'Open'),
    ));
    assert.equal(t.length, 2);
    assert.notEqual(t[0].expected, t[1].expected);
  });
});

describe('checkArity', () => {
  it('passes when every row matches its own table header', () => {
    const t = tablesOf(doc('### 2.2 Bug Lane', '', HEAD_BUG, SEP_BUG, bugRow('BUG-1', '5.0', 'Open')));
    assert.deepEqual(checkArity(t), []);
  });

  it('catches a row with a MISSING column — the BUG-17/BUG-18 defect (10 of 11)', () => {
    const short = '| BUG-17 | desc | 4 | 2 | 90% | 1 | 4.5 | convoke | Open | — |';
    const t = tablesOf(doc('### 2.2 Bug Lane', '', HEAD_BUG, SEP_BUG, short));
    const p = checkArity(t);
    assert.equal(p.length, 1);
    assert.match(p[0], /BUG-17/);
    assert.match(p[0], /10.*11|11.*10/);
  });

  it('catches a FOREIGN-WIDTH row — the BUG-14 defect (11 columns inside the 5-column table)', () => {
    const t = tablesOf(doc(
      '### 2.5 Absorbed / Archived', '', '#### Completed (shipped)', '', HEAD_C, SEP_C,
      bugRow('BUG-14', '—', 'Closed'),
    ));
    const p = checkArity(t);
    assert.equal(p.length, 1);
    assert.match(p[0], /BUG-14/);
  });

  it('does not miscount a row whose cell contains an ESCAPED pipe', () => {
    const esc = '| BUG-1 | a \\| b | 4 | 2 | 90% | 1 | 5.0 | convoke | Open | — | — |';
    const t = tablesOf(doc('### 2.2 Bug Lane', '', HEAD_BUG, SEP_BUG, esc));
    assert.deepEqual(checkArity(t), []);
  });
});

describe('checkLaneShape', () => {
  it('passes a lane sorted by score descending with no closed rows', () => {
    const t = tablesOf(doc('### 2.2 Bug Lane', '', HEAD_BUG, SEP_BUG,
      bugRow('BUG-1', '9.0', 'Open'), bugRow('BUG-2', '5.0', 'Open')));
    assert.deepEqual(checkLaneShape(t), []);
  });

  it('catches an out-of-order live row', () => {
    const t = tablesOf(doc('### 2.2 Bug Lane', '', HEAD_BUG, SEP_BUG,
      bugRow('BUG-1', '2.0', 'Open'), bugRow('BUG-2', '8.0', 'Open')));
    const p = checkLaneShape(t);
    assert.equal(p.length, 1);
    assert.match(p[0], /BUG-2/);
    assert.match(p[0], /order/i);
  });

  it('catches a CLOSED row left in a lane — clause 3 evicts, it does not demote', () => {
    const t = tablesOf(doc('### 2.2 Bug Lane', '', HEAD_BUG, SEP_BUG,
      bugRow('BUG-1', '9.0', 'Open'), bugRow('BUG-2', '5.0', '✅ Done 2026-08-15')));
    const p = checkLaneShape(t);
    assert.equal(p.length, 1);
    assert.match(p[0], /BUG-2/);
    assert.match(p[0], /closed/i);
  });

  it('reports a closed row as a closing-move failure, NOT as an ordering violation', () => {
    const t = tablesOf(doc('### 2.2 Bug Lane', '', HEAD_BUG, SEP_BUG,
      bugRow('BUG-1', '2.0', '✅ Done 2026-08-15'), bugRow('BUG-2', '8.0', 'Open')));
    const p = checkLaneShape(t);
    // BUG-1 closed AND out of order — must be named once, as the closed-row problem only.
    assert.equal(p.length, 1);
    assert.match(p[0], /closed/i);
  });

  it('does not treat an untriaged row as an ordering break (clause 2 position is NOT asserted — T70a)', () => {
    const t = tablesOf(doc('### 2.2 Bug Lane', '', HEAD_BUG, SEP_BUG,
      bugRow('BUG-1', '9.0', 'Open'),
      '| BUG-2 | desc | ? | ? | ? | ? | — | convoke | Open | — | — |'));
    assert.deepEqual(checkLaneShape(t), []);
  });

  it('ignores non-lane tables — §2.5 carries a Score column but is a receipt table, never sorted', () => {
    const t = tablesOf(doc('### 2.5 Absorbed / Archived', '', '#### Completed (shipped)', '', HEAD_C, SEP_C,
      '| I1 | d | 2026-08-01 | 9.0 | convoke |', '| I2 | d | 2026-08-02 | 1.0 | convoke |',
      '| I3 | d | 2026-08-03 | 5.0 | convoke |'));
    assert.deepEqual(checkLaneShape(t), []);
  });

  it('locates Score and Status by header NAME, so it survives a column being added (T69)', () => {
    const h = '| ID | Filed | Description | R | I | C | E | Score | Portfolio | Status | Dependencies | Linked Follow-up |';
    const s = '|----|-------|-------------|---|---|---|---|-------|-----------|--------|--------------|------------------|';
    const r = (id, sc, st) => `| ${id} | 2026-08-01 | desc | 4 | 2 | 90% | 1 | ${sc} | convoke | ${st} | — | — |`;
    const t = tablesOf(doc('### 2.2 Bug Lane', '', h, s, r('BUG-1', '2.0', 'Open'), r('BUG-2', '8.0', 'Open')));
    const p = checkLaneShape(t);
    assert.equal(p.length, 1);
    assert.match(p[0], /BUG-2/);
  });
});

describe('check (integration)', () => {
  it('still catches a dangling reference', () => {
    const text = doc('### 2.2 Bug Lane', '', HEAD_BUG, SEP_BUG,
      '| BUG-1 | see T99 | 4 | 2 | 90% | 1 | 5.0 | convoke | Open | — | — |');
    assert.ok(check(text).some((p) => /T99/.test(p)));
  });

  it('aggregates arity, ordering AND closed-row problems together', () => {
    // The earlier version of this test carried this name with no closed row in its fixture —
    // the name is what a future reader trusts, so it now exercises all three.
    const text = doc('### 2.2 Bug Lane', '', HEAD_BUG, SEP_BUG,
      bugRow('BUG-1', '2.0', 'Open'),
      bugRow('BUG-2', '8.0', 'Open'),
      bugRow('BUG-4', '1.5', '✅ Done 2026-08-15'),
      '| BUG-3 | short | 4 | 2 | 90% | 1 | 1.0 | convoke | Open | — |');
    const p = check(text);
    assert.ok(p.some((x) => /lane order/i.test(x)), 'expected an ordering problem');
    assert.ok(p.some((x) => /column count.*BUG-3/.test(x)), 'expected an arity problem');
    assert.ok(p.some((x) => /closed row in lane.*BUG-4/.test(x)), 'expected a closed-row problem');
  });
});


/**
 * Round 1 regressions. Every case below reproduces a defect that shipped and was caught by
 * independent review, not by the author. The truncation cases are the load-bearing ones: the
 * gate previously printed PASS while never scanning the rows.
 */
describe('truncation (R1-HIGH: gate must never PASS over unscanned rows)', () => {
  const lane = (...rows) => doc('### 2.2 Bug Lane', '', HEAD_BUG, SEP_BUG, ...rows);

  it('does not let a data row whose first cell is `ID` end its table', () => {
    const t = tablesOf(lane(bugRow('BUG-1', '9.0', 'Open'),
      '| ID | d | 4 | 2 | 90% | 1 | 8.0 | convoke | Open | — | — |',
      bugRow('BUG-2', '7.0', 'Open')));
    assert.equal(t[0].rows.length, 3, 'all three rows must be scanned');
  });

  it('does not let a row lacking a space after the leading pipe end its table', () => {
    const t = tablesOf(lane(bugRow('BUG-1', '9.0', 'Open'),
      '|BUG-2 | d | 4 | 2 | 90% | 1 | 8.0 | convoke | Open | — | — |',
      bugRow('BUG-3', '7.0', 'Open')));
    assert.equal(t[0].rows.length, 3);
  });

  it('reports coverage loss when prose interrupts a table', () => {
    const text = lane(bugRow('BUG-1', '9.0', 'Open'), '<!-- note -->', bugRow('BUG-2', '7.0', 'Open'));
    const { problems, scanned, expected } = checkCoverage(text, tablesOf(text), parseTables(text).orphans);
    assert.ok(scanned < expected, 'scanned must fall short of the file total');
    assert.match(problems[0], /row coverage/);
  });

  it('reports an orphan row that has no header above it', () => {
    const text = doc('### 2.2 Bug Lane', '', 'prose', bugRow('BUG-1', '9.0', 'Open'));
    const { problems } = checkCoverage(text, tablesOf(text), parseTables(text).orphans);
    assert.match(problems.join(' '), /orphan row/);
  });

  it('a header with no separator does not swallow its rows silently', () => {
    const text = doc('### 2.2 Bug Lane', '', HEAD_BUG, bugRow('BUG-1', '9.0', 'Open'));
    const { problems } = checkCoverage(text, tablesOf(text), parseTables(text).orphans);
    assert.ok(problems.length > 0, 'must not be silent');
  });
});

describe('column lookup, scores and masking (R1-MEDIUM)', () => {
  it('columnIndex honours NAME order — Status wins over an earlier Stage column', () => {
    const t = { columns: ['', 'ID', 'Stage', 'Description', 'Score', 'Portfolio', 'Status', ''] };
    assert.equal(columnIndex(t, 'Status', 'Stage'), 6);
    assert.equal(columnIndex(t, 'Stage', 'Status'), 2);
  });

  it('a decorated score is still read as a number, not silently exempted', () => {
    assert.equal(numericCell('**5.4**'), 5.4);
    assert.equal(numericCell('`9.9`'), 9.9);
    const t = tablesOf(doc('### 2.2 Bug Lane', '', HEAD_BUG, SEP_BUG,
      bugRow('BUG-1', '2.0', 'Open'), bugRow('BUG-2', '**8.0**', 'Open')));
    assert.match(checkLaneShape(t)[0], /BUG-2/);
  });

  it('flags an unparseable score rather than treating it as untriaged', () => {
    const t = tablesOf(doc('### 2.2 Bug Lane', '', HEAD_BUG, SEP_BUG, bugRow('BUG-1', 'soon', 'Open')));
    assert.match(checkLaneShape(t)[0], /unparseable score/);
  });

  it('still treats a bare em-dash as untriaged, silently', () => {
    const t = tablesOf(doc('### 2.2 Bug Lane', '', HEAD_BUG, SEP_BUG, bugRow('BUG-1', '—', 'Open')));
    assert.deepEqual(checkLaneShape(t), []);
  });

  it('announces that lane checks were skipped on an arity-violating row', () => {
    const t = tablesOf(doc('### 2.2 Bug Lane', '', HEAD_BUG, SEP_BUG,
      '| BUG-1 | d | 4 | 2 | 90% | 1 | 9.0 | convoke | Open | — |'));
    assert.match(checkLaneShape(t)[0], /lane checks skipped/);
  });

  it('does not lane-check an auxiliary sub-table under a lane heading', () => {
    const t = tablesOf(doc('### 2.4 Initiative Lane', '', '#### Full descriptions', '',
      '| ID | Full description |', '|----|------------------|', '| P21 | long text |'));
    assert.deepEqual(checkLaneShape(t), []);
  });
});

describe('exported helpers', () => {
  it('splitRow treats an escaped pipe as content', () => {
    assert.equal(splitRow('| a \\| b | c |').length, 4);
  });
  it('isSeparator and isTableLine classify correctly', () => {
    assert.ok(isSeparator('|----|----|'));
    assert.ok(!isSeparator('| a | b |'));
    assert.ok(isTableLine('|x'));
    assert.ok(!isTableLine('prose'));
  });
  it('isClosed covers the spec vocabulary and ignores decoration', () => {
    for (const c of ['Done', '✅ Done 2026-01-01', '**Superseded**', '~~Rescoped~~', 'Absorbed', 'Invalid']) {
      assert.ok(isClosed(c), `${c} should be closed`);
    }
    for (const c of ['Open', 'Backlog', 'Qualified', 'In Sprint']) {
      assert.ok(!isClosed(c), `${c} should be live`);
    }
  });
  it('collectIds separates defined from referenced', () => {
    const { defined, referenced } = collectIds('| BUG-1 | cites T99 |');
    assert.ok(defined.has('BUG-1'));
    assert.ok(referenced.has('T99'));
  });
});


/**
 * Round 2 regressions. Every case below is a defect that survived Round 1 and was found by
 * independent review. The `main()` cases matter most: R2 proved the gate could print PASS and
 * exit 0 over a file whose lanes were never checked, and no test constrained `main` at all.
 */
const fs = require('fs');
const os = require('os');
const { BACKLOG, SPRINT_STATUS } = require('../../scripts/audit/backlog-integrity');


/** Run main() against a throwaway tree — never against the live repo (test-fixture-isolation). */
function runMain(text) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'bi-test-'));
  fs.mkdirSync(path.dirname(path.join(dir, BACKLOG)), { recursive: true });
  fs.writeFileSync(path.join(dir, BACKLOG), text);
  const log = console.log;
  let out = '';
  console.log = (...a) => { out += `${a.join(' ')}\n`; };
  let code;
  try { code = main(dir); } finally { console.log = log; }
  fs.rmSync(dir, { recursive: true, force: true });
  return { code, out };
}

/** A minimal but structurally valid backlog: all five sections, three populated lanes. */
function validDoc(overrides = {}) {
  const lane = (sec, name, id) => [
    `### ${sec} ${name}`, '',
    '| ID | Description | R | I | C | E | Score | Portfolio | Status |',
    '|----|-------------|---|---|---|---|-------|-----------|--------|',
    `| ${id} | d | 4 | 2 | 90% | 1 | 5.0 | convoke | Open |`, '',
  ].join('\n');
  return [
    // 60 intake rows so main()'s `defined.size < 50` zero-floor is cleared and the structural
    // checks are actually reached — the floor is production behaviour and must not be weakened
    // to suit a fixture.
    '### 2.1 Intakes (Unqualified)', '', '| ID | Description |', '|----|-------------|',
    ...Array.from({ length: 60 }, (_, i) => `| D${i + 1} | d |`), '',
    overrides.bug || lane('2.2', 'Bug Lane', 'BUG-1'),
    overrides.fast || lane('2.3', 'Fast Lane', 'T1'),
    overrides.init || lane('2.4', 'Initiative Lane', 'P1'),
    '### 2.5 Absorbed / Archived', '', '| ID | Description |', '|----|-------------|', '| X1 | d |', '',
  ].join('\n');
}

describe('main() and the structural floor (R2-HIGH)', () => {
  it('exits 0 and reports the WALKED row count on a valid document', () => {
    const { code, out } = runMain(validDoc());
    assert.equal(code, 0);
    assert.match(out, /PASS — 64 rows walked/);
    assert.match(out, /3 lanes/);
  });

  it('FAILS rather than printing "0 lanes ordered" when lane headings are demoted', () => {
    const { code, out } = runMain(validDoc().replace(/^### 2\.([234])/gm, '#### 2.$1'));
    assert.notEqual(code, 0, 'a document with no checkable lane must not pass');
    assert.match(out, /structure: required section/);
  });

  it('FAILS when an entire lane section is deleted', () => {
    const doc2 = validDoc().replace(/### 2\.4 Initiative Lane[\s\S]*?(?=### 2\.5)/, '');
    const { code, out } = runMain(doc2);
    assert.notEqual(code, 0);
    assert.match(out, /### 2\.4/);
  });

  it('assertStructure names a lane that produced no checkable table', () => {
    const text = validDoc();
    const { tables } = parseTables(text.replace('|----|-------------|---|---|---|---|-------|-----------|--------|\n| T1', '| T1'));
    assert.match(assertStructure(text, tables).join(' '), /§2\.3/);
  });
});

describe('coverage counts rows independently of the parser (R2-HIGH)', () => {
  it('a row indented by one space is still parsed and fully checked', () => {
    const text = validDoc({
      fast: ['### 2.3 Fast Lane', '',
        '| ID | Description | R | I | C | E | Score | Portfolio | Status |',
        '|----|-------------|---|---|---|---|-------|-----------|--------|',
        '| T1 | d | 4 | 2 | 90% | 1 | 5.0 | convoke | Open |',
        ' | T2 | indented | 4 | 2 | 90% | 1 | 9.0 | convoke | Open |', ''].join('\n'),
    });
    assert.ok(check(text).some((p) => /lane order: T2/.test(p)), 'the indented row must be order-checked');
  });

  it('an empty spacer row does not promote the row above into a header', () => {
    const text = validDoc({
      fast: ['### 2.3 Fast Lane', '',
        '| ID | Description | R | I | C | E | Score | Portfolio | Status |',
        '|----|-------------|---|---|---|---|-------|-----------|--------|',
        '| T1 | d | 4 | 2 | 90% | 1 | 5.0 | convoke | Open |',
        '|  |  |  |  |  |  |  |  |  |', ''].join('\n'),
    });
    assert.ok(check(text).length > 0, 'must not be silent');
  });
});

describe('fences, lane cursor and score parsing (R2-MEDIUM)', () => {
  it('ignores a pipe table inside a fenced code block', () => {
    const text = validDoc().replace('### 2.5 Absorbed / Archived',
      '```\n| not | a | table |\n|-----|---|-------|\n| x | y | z |\n```\n\n### 2.5 Absorbed / Archived');
    assert.deepEqual(check(text), []);
  });

  it('a fenced example row cannot silence a real dangling reference', () => {
    const text = validDoc().replace('| D1 | d |', '| D1 | cites T999 |')
      .replace('### 2.5', '```\n| T999 | fenced example |\n```\n\n### 2.5');
    assert.ok(check(text).some((p) => /dangling reference: T999/.test(p)));
  });

  it('the ordering cursor spans a whole lane, not one table', () => {
    const text = validDoc({
      fast: ['### 2.3 Fast Lane', '',
        '| ID | Description | R | I | C | E | Score | Portfolio | Status |',
        '|----|-------------|---|---|---|---|-------|-----------|--------|',
        '| T1 | d | 4 | 2 | 90% | 1 | 5.0 | convoke | Open |', '',
        'prose between the two tables', '',
        '| ID | Description | R | I | C | E | Score | Portfolio | Status |',
        '|----|-------------|---|---|---|---|-------|-----------|--------|',
        '| T2 | d | 4 | 2 | 90% | 1 | 9.9 | convoke | Open |', ''].join('\n'),
    });
    assert.ok(check(text).some((p) => /lane order: T2/.test(p)), 'a score must not jump up at a table boundary');
  });

  it('rejects an annotated score instead of reading its leading number', () => {
    assert.ok(Number.isNaN(numericCell('4.5 → 1.9')));
    assert.ok(Number.isNaN(numericCell('1 2')));
    assert.ok(Number.isNaN(numericCell('5.4 (pending recompute)')));
    assert.equal(numericCell('**5.4**'), 5.4);
  });

  it('isClosed sees through decoration other than bold', () => {
    for (const c of ['[x] Done', '_Done_', '🔴 Closed 2026-01-01', '✔ Shipped']) {
      assert.ok(isClosed(c), `${c} should read as closed`);
    }
  });
});


describe('Filed column (T69)', () => {
  const H = '| ID | Filed | Description | R | I | C | E | Score | Portfolio | Status |';
  const S = '|----|-------|-------------|---|---|---|---|-------|-----------|--------|';
  const row = (id, filed, score) => `| ${id} | ${filed} | d | 4 | 2 | 90% | 1 | ${score} | convoke | Open |`;
  const lane = (...rows) => doc('### 2.2 Bug Lane', '', H, S, ...rows);

  it('accepts an ISO date', () => {
    assert.deepEqual(checkLaneShape(tablesOf(lane(row('BUG-1', '2026-08-15', '5.0')))), []);
  });

  it('accepts an em-dash for a row whose filing date cannot be established', () => {
    assert.deepEqual(checkLaneShape(tablesOf(lane(row('BUG-1', '—', '5.0')))), []);
  });

  it('flags an EMPTY Filed cell — arity alone cannot catch this', () => {
    const p = checkLaneShape(tablesOf(lane(row('BUG-1', '', '5.0'))));
    assert.match(p[0], /filed date: BUG-1/);
  });

  it('flags free text in the Filed cell', () => {
    const p = checkLaneShape(tablesOf(lane(row('BUG-1', 'last week', '5.0'))));
    assert.match(p[0], /filed date/);
  });

  it('locates Score and Status by name despite the inserted column', () => {
    // The whole point of the T58 name-based lookup: adding Filed must not shift what is read.
    const p = checkLaneShape(tablesOf(lane(row('BUG-1', '2026-01-01', '2.0'), row('BUG-2', '2026-01-02', '8.0'))));
    assert.equal(p.length, 1);
    assert.match(p[0], /lane order: BUG-2/);
  });
});

describe('T79 — owed-close detection', () => {
  const { execFileSync } = require('child_process');

  // HERMETIC BY CONSTRUCTION. The first version of these tests read the REAL repo's git log and
  // asserted `inert === false`. That passes locally and fails in CI: `actions/checkout` defaults
  // to `fetch-depth: 1`, and only the `agent-surface-parity` job overrides it — so the `test`,
  // `burn-in` and `coverage` jobs all run against a shallow clone where the scan is correctly
  // inert. The tests would have broken the build that shipped them. Each case now builds its own
  // one-commit repository, which also makes the fixtures readable: the commit that should trigger
  // a warning sits three lines from the assertion.
  // T103 default: a structurally valid sprint-status carrying one `done` story and nothing
  // live, so the twelve T79 cases below exercise the LANE scan against a quiet story scan
  // rather than against its inert branch. Cases wanting the file absent pass `null`.
  const QUIET_SPRINT = ['development_status:', '  quiet-9-9-nothing-to-see: done', ''].join('\n');

  // GITHUB_ACTIONS IS NEUTRALISED FOR EVERY CASE THAT DOES NOT ASK FOR IT.
  //
  // The reporter emits an extra `::warning::` line per divergence when that variable is set,
  // and GitHub Actions always sets it. A test counting occurrences of `status divergence:`
  // therefore passed locally and failed on every CI job running `npm test` — Node 18/20/22 at
  // `ci.yml:65` plus burn-in at `:100`, red simultaneously. `fixture-determinism` names
  // inherited env as one of its four non-determinism axes; this is that axis, and the fixture
  // has to own the variable rather than read whatever the runner happens to export.
  function runIn(subjects, doc, sprint = QUIET_SPRINT, { githubActions = false } = {}) {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'bi-t79-'));
    const git = (...args) => execFileSync('git', args, { cwd: dir, stdio: 'ignore' });
    const prevGa = process.env.GITHUB_ACTIONS;
    try {
      if (githubActions) process.env.GITHUB_ACTIONS = 'true';
      else delete process.env.GITHUB_ACTIONS;
      git('init', '-q');
      git('config', 'user.email', 't@example.invalid');
      git('config', 'user.name', 'T79 fixture');
      for (const subject of subjects) git('commit', '--allow-empty', '-q', '-m', subject);
      fs.mkdirSync(path.dirname(path.join(dir, BACKLOG)), { recursive: true });
      fs.writeFileSync(path.join(dir, BACKLOG), doc);
      if (sprint !== null) {
        fs.mkdirSync(path.dirname(path.join(dir, SPRINT_STATUS)), { recursive: true });
        fs.writeFileSync(path.join(dir, SPRINT_STATUS), sprint);
      }
      const log = console.log;
      let out = '';
      console.log = (...a) => { out += `${a.join(' ')}\n`; };
      let code;
      try { code = main(dir); } finally { console.log = log; }
      return { code, out };
    } finally {
      if (prevGa === undefined) delete process.env.GITHUB_ACTIONS;
      else process.env.GITHUB_ACTIONS = prevGa;
      fs.rmSync(dir, { recursive: true, force: true });
    }
  }

  // APPEND to the Fast Lane, in validDoc's own 9-column shape, with descending scores below its
  // existing 5.0 row. Getting either wrong makes main() fail on arity or lane order and the test
  // then proves nothing about owed closes — which is exactly what happened on the first attempt.
  const docWith = (ids) => validDoc().replace(
    /(### 2\.3 [^\n]*\n\n\|[^\n]*\n\|[^\n]*\n(?:\|[^\n]*\n)*)/,
    (m) => m + ids.map((id, i) => `| ${id} | d | 4 | 2 | 90% | 1 | ${(4 - i).toFixed(1)} | convoke | Open |\n`).join(''),
  );

  /** Put an ID in the §2.5 archive table instead of a lane, in that table's own 2-column shape. */
  const docArchiving = (id) => validDoc().replace('| X1 | d |', `| X1 | d |\n| ${id} | d |`);

  it('warns AND still exits 0 when a lane row already has a work commit', () => {
    // The property that matters: warn-level. A fix legitimately precedes its close inside one
    // session, and this gate runs in the CI that would block that very commit. The previous
    // version of this test filtered check() for /owed/ — but check() never calls the owed-close
    // code at all, so it passed no matter what main() did. Two mutations (process.exitCode = 1
    // in the reporter; `return 1` in main's PASS branch) survived the whole suite.
    const { code, out } = runIn(['fix(T42): ship the thing'], docWith(['T42']));
    assert.match(out, /close may be owed: T42\b/);
    assert.equal(code, 0, 'an owed close must never fail the build');
    // The warning's payload is what makes it actionable, so assert the parts an operator uses:
    // the abbreviated hash to check out, the subject to judge by, and the row's line number --
    // their only pointer back into a 723-row file. R2 found all three unasserted.
    assert.match(out, /ship the thing/, 'the warning must name the commit subject');
    assert.match(out, /\b[0-9a-f]{7,40}\b ?fix\(T42\)/, 'the warning must carry the commit hash');
    // Assert the line number equals where the row ACTUALLY sits. `> 0` was not enough --
    // a hardcoded `line 1` satisfies it, and that mutant survived.
    const doc = docWith(['T42']);
    const expected = doc.split('\n').findIndex((l) => l.startsWith('| T42 |')) + 1;
    assert.match(out, new RegExp(`close may be owed: T42 \\(line ${expected}\\)`),
      `the warning must point at line ${expected}, the row's real position`);
  });

  it('caps the listed commits and says how many it withheld', () => {
    // Three commits, two shown: the `(+1 more)` suffix is the only signal that the list is
    // truncated. Without it an operator reads two commits as the whole story. Nothing asserted
    // it, and dropping the suffix passed the entire suite.
    const { out } = runIn(
      ['fix(T42): one', 'fix(T42): two', 'fix(T42): three'],
      docWith(['T42']),
    );
    assert.match(out, /3 work commit\(s\) name it/, 'the count must be the true total');
    assert.match(out, /\(\+1 more\)/, 'a truncated commit list must say how many were withheld');
  });

  it('says nothing about a row whose only commits are filing commits', () => {
    const { code, out } = runIn(['docs(T42): file the row'], docWith(['T42']));
    assert.doesNotMatch(out, /close may be owed/);
    assert.equal(code, 0);
    // A clean scan must still prove it ran: silence is indistinguishable from a matcher that
    // has quietly stopped matching.
    assert.match(out, /owed-close scan: 0 across \d+ live lane rows \(\d+ commits scanned\)/);
  });

  it('excludes docs() — this repo closes rows with it', () => {
    assert.equal(WORK_VERBS.has('docs'), false);
    assert.equal(WORK_VERBS.has('chore'), false);
    assert.equal(WORK_VERBS.has('fix'), true);
    assert.equal(WORK_VERBS.has('feat'), true);
  });

  it('splits multi-scope commits and matches tokens whole', () => {
    // `fix(T50,T32)` is a real subject in this repo. T5 must not be claimed by it.
    const { out } = runIn(['fix(T50,T32): two rows at once'], docWith(['T5', 'T32']));
    assert.match(out, /close may be owed: T32\b/);
    assert.doesNotMatch(out, /close may be owed: T5\b/, 'a short ID was matched inside a longer one');
  });

  it('pass 2 sees a pre-convention subject that pass 1 is structurally blind to', () => {
    // 3854 of this repo's 4042 subjects predate the commit convention; for those there is no
    // verb to read. `92d4506b Ship I20 — Portfolio markdown formatter` is the live instance.
    const { out } = runIn(['Ship T42 — the portfolio formatter'], docWith(['T42']));
    assert.match(out, /close may be owed: T42\b/);
    assert.match(out, /pre-convention subject/, 'a pass-2 hit must be marked as weaker evidence');
  });

  it('pass 2 does NOT fire on a SCOPE-LESS conventional subject naming a row', () => {
    // The confinement IS the precision. Unconfined, a bare-ID scan gives 18 hits on the live
    // file, 17 of them filing commits; confined to non-conventional subjects it gives 1.
    //
    // The subject here has no parenthesised scope on purpose. A scoped one like
    // `docs(backlog): file T42` never reaches the CONVENTIONAL guard at all — it matches the
    // scoped-verb regex and exits at the WORK_VERBS check, which the docs() test already covers.
    // An earlier version of this test used a scoped subject and therefore passed with the guard
    // deleted; mutation caught it. This is the only case that constrains the guard.
    const { out } = runIn(['chore: file T42, T43 and T44 from the review'], docWith(['T42']));
    assert.doesNotMatch(out, /close may be owed/,
      'a conventional subject must be judged by its verb, never by bare ID matching');
    // Anchor: without this the test also passes when the whole feature is deleted.
    assert.match(out, /owed-close scan: 0 across/, 'the scan must have run at all');
  });

  it('ignores rows that have already been archived to §2.5', () => {
    // Without the isLane filter the check inverts into pure noise: every closed row with a
    // fix() commit is reported as owing a close. Measured on the live file: 1 warning becomes
    // 23 across 535 "live" rows. (An earlier version of this comment said 0 -> 21/586; all three
    // numbers were wrong, and R2 caught it. The baseline is 1, not 0, because the live file
    // legitimately warns on I20 today.) No other test constrains the live-row set.
    const { code, out } = runIn(['fix(T42): shipped and already closed'], docArchiving('T42'));
    assert.equal(code, 0, 'the fixture itself must be a valid document');
    assert.doesNotMatch(out, /close may be owed: T42\b/,
      'an archived row is not a lane row and must never be reported as owing a close');
    assert.match(out, /owed-close scan: 0 across/, 'the scan must have actually run over this doc');
  });

  it('a blank ID cell cannot turn pass 2 into a match-everything scan', () => {
    // `r.id` is just column 1, and a malformed row leaves it ''. Pass 2 then builds
    // `new RegExp('\\b' + '' + '\\b')` -- which matches at every word boundary, so ONE broken row
    // reports itself as owed against the whole legacy history. It reaches here easily because
    // main() runs this scan on its FAILURE path too, and a blank cell is exactly the kind of
    // document that fails. Found by mutation-hunting after R1, not by R1.
    const doc = docWith(['T42']).replace('| T42 | d |', '|  | d |');
    const { out } = runIn(['Ship something from the archives'], doc);
    assert.doesNotMatch(out, /close may be owed/,
      'a row with no usable ID must be skipped, not matched against everything');
    assert.match(out, /owed-close scan: 0 across/, 'the scan must have run at all');
  });

  it('pass 2 is case-sensitive, because artifact filenames are ID-prefixed and lowercase', () => {
    // `p3-epic-4-retro-2026-03-07.md`, `i97-*`, `a39-*` are real files here, and their names reach
    // commit subjects. Measured: matching case-insensitively takes pass 2 from 1 hit to ~36 on the
    // live corpus, nearly all a DIFFERENT historical P3. Nothing else pins this, so a well-meant
    // `/i` would quietly destroy the precision that makes the check usable.
    const { out } = runIn(['Update t42-some-artifact.md and t42 notes'], docWith(['T42']));
    assert.doesNotMatch(out, /close may be owed/,
      'a lowercased ID in a filename must not be read as a citation of the row');
    assert.match(out, /owed-close scan: 0 across/);
  });

  it('pass 2 ignores an ID used as a filename prefix', () => {
    // `\b` treats the hyphen as a boundary, so a bare `\bP4\b` matches `P4-enhance-module.md`.
    // P4 is parked in §2.5 today and parked rows are reinstated by copy-back, so the day it
    // returns it would arrive with two false positives already attached.
    const { out } = runIn(['Update T42-enhance-module-architecture.md'], docWith(['T42']));
    assert.doesNotMatch(out, /close may be owed/,
      'an ID followed by -<letter> is a filename prefix, not a citation');
  });

  it('reports inability to run rather than reporting clean', () => {
    // The failure mode that matters most, and the reason the tests above build their own repo:
    // with no history the scan finds nothing and would otherwise read as success.
    const res = gitSubjects('/nonexistent-path-for-this-test');
    assert.equal(res.inert, true);
    assert.equal(res.subjects.length, 0);
    assert.ok(res.reason && res.reason.length > 0, 'an inert scan must say why');
  });

  it('a shallow clone is reported, not silently clean', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'bi-t79-shallow-'));
    let srcDir = null;
    try {
      const src = fs.mkdtempSync(path.join(os.tmpdir(), 'bi-t79-src-'));
      const git = (cwd, ...args) => execFileSync('git', args, { cwd, stdio: 'ignore' });
      git(src, 'init', '-q');
      git(src, 'config', 'user.email', 't@example.invalid');
      git(src, 'config', 'user.name', 'T79 fixture');
      git(src, 'commit', '--allow-empty', '-q', '-m', 'one');
      git(src, 'commit', '--allow-empty', '-q', '-m', 'two');
      execFileSync('git', ['clone', '--depth', '1', '-q', `file://${src}`, dir], { stdio: 'ignore' });
      srcDir = src;
      const res = gitSubjects(dir);
      assert.equal(res.inert, true, 'a shallow clone must be inert, not empty-and-clean');
      assert.match(res.reason, /shallow/);
    } finally {
      // Both dirs in the finally: an assertion failure above used to leak the source repo.
      fs.rmSync(dir, { recursive: true, force: true });
      if (srcDir) fs.rmSync(srcDir, { recursive: true, force: true });
    }
  });

  // T103 nests here deliberately: it is a second SOURCE feeding T79's scanner, not a second
  // scanner, and it reuses `runIn` so both populations can be exercised in one fixture tree.
  describe('T103 — story-status divergence, with sprint-status.yaml as a second source', () => {
    /** A `development_status:` block. The two-space indent IS the story level. */
    const sprint = (...keys) => ['development_status:', ...keys.map((k) => `  ${k}`), ''].join('\n');

    it('warns when a live story is named by a fix() commit, and still exits 0', () => {
      const { code, out } = runIn(
        ['fix(dist-2-5): make the registry label agree with its own finding'],
        validDoc(),
        sprint('dist-2-5-close-bug-19-and-the-label: backlog'),
      );
      assert.equal(code, 0, 'a divergence must never fail the build');
      assert.match(out, /status divergence: dist-2-5\b/);
      assert.match(out, /reads `backlog`/, 'the warning must name the status it disagrees with');
      assert.match(out, /make the registry label agree/, 'the warning must name the commit subject');
      assert.match(out, /\b[0-9a-f]{7,40}\b fix\(dist-2-5\)/, 'the warning must carry the commit hash');
      // The line number is the reader's only pointer into a 950-line file. `> 0` is not enough:
      // a hardcoded `:1` satisfies that and tells them nothing.
      assert.match(out, /sprint-status\.yaml:2\b/, "the warning must point at the key's real line");
    });

    it('says nothing once the story is reconciled to done', () => {
      const { out } = runIn(
        ['fix(dist-2-5): ship it'], validDoc(),
        sprint('dist-2-5-close-bug-19-and-the-label: done'),
      );
      assert.doesNotMatch(out, /status divergence/);
      // A clean scan must still prove it ran; silence is indistinguishable from a matcher that
      // has quietly stopped matching. Same reasoning as T79's denominators.
      assert.match(out, /story-status scan: 0 across 0 live stories \(1 keys read = 0 live \+ 1 done/);
    });

    it('treats an UNFAMILIAR status as live — the charset must not become an allowlist', () => {
      // The defect Round 1 found live: `sprint-status.yaml:689` reads `descoped-by-ADR`, and a
      // value charset of `[a-z-]+` rejected the uppercase `ADR`, dropping the line before any
      // counter could see it. The frozen rule is that the live set is an EXCLUSION — only
      // `done` is terminal — so an unrecognised status word must still be watched.
      const { out } = runIn(
        ['fix(v63-4-3): ship it'], validDoc(),
        sprint('v63-4-3-execute-pf1-validation: descoped-by-ADR'),
      );
      assert.match(out, /status divergence: v63-4-3\b/);
      assert.match(out, /reads `descoped-by-ADR`/);
      assert.match(out, /1 live stories/, 'it must be IN the population, not merely named as lost');
    });

    it('treats `review` as live too', () => {
      // 120 occurrences in this file's history, zero today. An allowlist of the statuses
      // currently present passes every other case here and goes silent on exactly the
      // ship-to-close window the scan exists to watch.
      const { out } = runIn(['feat(foo-1-2): ship it'], validDoc(), sprint('foo-1-2-a-story: review'));
      assert.match(out, /status divergence: foo-1-2\b/);
      assert.match(out, /reads `review`/);
    });

    it('every in-block line lands in exactly one bucket — nothing is dropped', () => {
      // The general form of the Round 1 blocker. A quoted value is structurally surprising and
      // belongs in `unrecognized`; what must never happen is a line reaching neither bucket.
      const { out } = runIn(['chore: unrelated'], validDoc(), sprint('a-1-2-x: "backlog"', 'b-3-4-y: done'));
      assert.match(out, /1 key\(s\) unrecognized/, 'the odd line must be surfaced');
      assert.match(out, /a-1-2-x: "backlog"/, 'and it must be NAMED, not merely counted');
      assert.match(out, /1 keys read = 0 live \+ 1 done/, 'the parsed key is still accounted for');
    });

    it('parses a CRLF checkout instead of reporting an empty block', () => {
      // No .gitattributes in this repo, so `core.autocrlf=true` produces this. `\r` survives
      // `$` in the key regex but not in the block opener, so a `split(String.fromCharCode(10))`
      // implementation opens the block and then matches nothing — reporting "yielded no
      // entries", which names the wrong cause.
      const crlf = ['development_status:', '  a-1-2-x: backlog', ''].join('\r\n');
      const { out } = runIn(['fix(a-1-2): ship it'], validDoc(), crlf);
      assert.match(out, /status divergence: a-1-2\b/);
      assert.doesNotMatch(out, /yielded no/, 'a CRLF file is not an empty one');
    });

    it('ignores epic-level keys even under a verb that WOULD otherwise match', () => {
      // The verb is deliberately `feat`, not the `governance` the live tree happens to carry:
      // under a non-matching verb this case passes with epic-exclusion deleted, proving nothing.
      const { out } = runIn(
        ['feat(dist-epic-2): ship a story inside the epic'], validDoc(),
        sprint('dist-epic-2: in-progress', 'dist-epic-2-retrospective: optional'),
      );
      assert.doesNotMatch(out, /status divergence/,
        'an epic is in-progress by definition while its stories ship');
      assert.match(out, /0 live stories/, 'the scan must have run at all');
    });

    it('does not mistake a story whose NAME contains "epic" for an epic', () => {
      // `epic` must be followed by a number to count. A bare segment test swallows this key,
      // and unlike `unparseable` the epic path is a silent skip by design — no trace at all.
      const { out } = runIn(['fix(x-epic-flow-1-2): ship it'], validDoc(),
        sprint('x-epic-flow-1-2-a-story: backlog'));
      assert.match(out, /status divergence: x-epic-flow-1-2\b/);
    });

    it('matches fix|feat only — governance() and docs() name a story without shipping it', () => {
      const live = sprint('dist-2-8-repair-the-manifest: backlog');
      assert.doesNotMatch(runIn(['governance(dist-2-8): retract ADR-005'], validDoc(), live).out,
        /status divergence/, 'a retraction names the story but does not ship it');
      assert.doesNotMatch(runIn(['docs(dist-2-8): file the row'], validDoc(), live).out,
        /status divergence/, 'docs() is this repo’s closing verb');
      // Anchor: without this the case also passes when the entire story pass is deleted.
      assert.match(runIn(['fix(dist-2-8): ship it'], validDoc(), live).out, /status divergence: dist-2-8\b/,
        'the same fixture under fix() must warn, or the two assertions above prove nothing');
    });

    it('names a key it cannot derive an id for, rather than dropping it', () => {
      // `i97-bug-1-fix-p0-activation-defects` is a real key of this shape: `bug` sits where a
      // number must be, so no id can be derived.
      const { out } = runIn(['chore: unrelated'], validDoc(),
        sprint('i97-bug-1-fix-p0-activation-defects: backlog'));
      assert.match(out, /1 key\(s\) unparseable/);
      assert.match(out, /i97-bug-1-fix-p0-activation-defects/, 'the key must be named');
    });

    it('takes the LAST value for a duplicated key, as YAML does', () => {
      // First-wins would warn on a story the file has already reconciled.
      const { out } = runIn(['fix(a-1-2): ship it'], validDoc(),
        sprint('a-1-2-x: backlog', 'a-1-2-x: done'));
      assert.doesNotMatch(out, /status divergence/, "YAML's effective value here is `done`");
    });

    it('names two live keys that collapse onto one story id', () => {
      const { out } = runIn(['chore: unrelated'], validDoc(),
        sprint('a-1-2-first: backlog', 'a-1-2-second: backlog'));
      assert.match(out, /1 key\(s\) collapsed/);
      assert.match(out, /a-1-2-second/, 'the shadowed key must be named, not silently lost');
    });

    it('does not read a comment inside the block as a key', () => {
      const { out } = runIn(
        ['fix(dist-2-5): ship it'], validDoc(),
        sprint('# Epic 2: dist-2-5-close-bug-19: backlog', 'dist-2-5-real-key: done'),
      );
      assert.doesNotMatch(out, /status divergence/, 'a `#` line is a comment, not a key');
      // Anchored on the NAMED-bucket heading, not the bare word: the denominator always carries
      // `0 unrecognized`, so a loose /unrecognized/ can never fail and asserts nothing.
      assert.doesNotMatch(out, /key\(s\) unrecognized/, 'nor is it an unrecognised line');
      assert.doesNotMatch(out, /RECONCILIATION FAILED/, 'and the arithmetic still balances');
    });

    it('stops at the next zero-indent key, so a sibling block is out of scope', () => {
      const doc = [
        'development_status:', '  real-1-1-a-story: done', '',
        'action_items:', '  fake-2-2-not-a-story: backlog', '',
      ].join('\n');
      const { out } = runIn(['fix(fake-2-2): ship it'], validDoc(), doc);
      assert.doesNotMatch(out, /status divergence/, 'keys under action_items: must not be scanned');
      assert.match(out, /0 live stories/, 'the scan must have run at all');
    });

    it('reports a missing sprint-status.yaml rather than reporting clean', () => {
      const { code, out } = runIn(['fix(dist-2-5): ship it'], validDoc(), null);
      assert.equal(code, 0);
      assert.match(out, /story-status scan did not run/);
      assert.match(out, /sprint-status\.yaml could not be read/);
      assert.doesNotMatch(out, /story-status scan: 0 across/,
        'a file that was never read must not print a clean denominator');
    });

    it('says stories were read but NOT compared when history is unavailable', () => {
      // Otherwise a whole population is loaded, never checked, and the silence reads as
      // "no stories diverge" — the failure mode gitSubjects` own inert branch exists to avoid.
      const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'bi-t103-nogit-'));
      try {
        fs.mkdirSync(path.dirname(path.join(dir, BACKLOG)), { recursive: true });
        fs.writeFileSync(path.join(dir, BACKLOG), validDoc());
        fs.mkdirSync(path.dirname(path.join(dir, SPRINT_STATUS)), { recursive: true });
        fs.writeFileSync(path.join(dir, SPRINT_STATUS), sprint('a-1-2-x: backlog'));
        const log = console.log;
        let out = '';
        console.log = (...a) => { out += `${a.join(' ')}\n`; };
        try { main(dir); } finally { console.log = log; }
        assert.match(out, /owed-close scan did not run/, 'the lane block must report the git failure');
        assert.match(out, /1 live stories .*read but NOT compared/,
          'the story population must not be silently discarded');
      } finally {
        fs.rmSync(dir, { recursive: true, force: true });
      }
    });

    it('emits an escaped CI annotation only under GITHUB_ACTIONS', () => {
      const args = [['fix(dist-2-5): ship it'], validDoc(), sprint('dist-2-5-a-story: backlog')];
      assert.doesNotMatch(runIn(...args).out, /^::warning::/m, 'a local run must not annotate');
      const on = runIn(...args, { githubActions: true }).out;
      assert.match(on, /^::warning::status divergence: dist-2-5\b/m);
      // The payload is an arbitrary commit subject, and `%` is the Actions escape character.
      assert.equal(escapeAnnotation('100% \r\n done'), '100%25 %0D%0A done');
      const pct = runIn(['fix(dist-2-5): ship 100% of it'], validDoc(),
        sprint('dist-2-5-a-story: backlog'), { githubActions: true }).out;
      assert.match(pct, /100%25 of it/, 'a literal % in a subject must be percent-escaped');
    });

    it('passes with GITHUB_ACTIONS set in the ambient environment', () => {
      // The regression that reddened four CI jobs: the count-pinning case below inherited the
      // runner's own GITHUB_ACTIONS and saw the annotation line as a second divergence.
      const prev = process.env.GITHUB_ACTIONS;
      try {
        process.env.GITHUB_ACTIONS = 'true';
        const { out } = runIn(['fix(dist-2-5): ship it'], validDoc(), sprint('dist-2-5-a-story: backlog'));
        assert.equal((out.match(/status divergence:/g) || []).length, 1,
          'runIn must own the variable rather than inherit it');
      } finally {
        if (prev === undefined) delete process.env.GITHUB_ACTIONS;
        else process.env.GITHUB_ACTIONS = prev;
      }
    });

    it('leaves the lane scan untouched when both sources are live at once', () => {
      const { out } = runIn(
        ['fix(T42): ship the row', 'fix(dist-2-5): ship the story'],
        docWith(['T42']),
        sprint('dist-2-5-a-story: backlog'),
      );
      assert.equal((out.match(/close may be owed:/g) || []).length, 1, 'exactly one lane warning');
      assert.match(out, /close may be owed: T42 \(line \d+\) is still in a lane, but 1 work commit\(s\) name it/);
      assert.equal((out.match(/status divergence:/g) || []).length, 1, 'exactly one story warning');
    });


    it('reports keys OUTSIDE the block — the conservation law, not another drop-path patch', () => {
      // Round 2's blocker. One de-indented key closes the block and it never re-opens, so on
      // the live tree 302 of 451 keys vanished with every bucket printing 0 and exit 0 — taking
      // the only true positive with them. Enumerating drop paths one at a time was the wrong
      // instrument: each fix covered its instance and the next level up stayed open. So the
      // parser now counts every story-key-shaped line ANYWHERE in the file, by a predicate
      // blind to the block bound, and anything found outside is reported.
      const doc = [
        'development_status:', '  a-1-2-x: backlog', '',
        'stray-top-level-key: oops', '  b-3-4-y: backlog', '  c-5-6-z: backlog', '',
      ].join('\n');
      const { code, out } = runIn(['fix(b-3-4): ship it'], validDoc(), doc);
      assert.equal(code, 0);
      // Three, not two: the closing line `stray-top-level-key: oops` is itself slug-shaped and
      // is now counted, which is the Round 3 fix. Over-reporting here is the safe direction —
      // a named line a reader can dismiss beats a key that vanishes.
      assert.match(out, /3 key\(s\) outside the block/, 'the truncation must be LOUD, not clean');
      assert.match(out, /b-3-4-y: backlog/, 'and the lost keys must be named');
      assert.doesNotMatch(out, /status divergence/, 'the key was never scanned, so nothing is claimed about it');
    });

    it('prints an arithmetic that reconciles, so a key cannot exit uncounted', () => {
      // 357 of 451 keys used to leave the population untracked (319 done + 38 epic), which is
      // what let a truncated parse look healthy. Every exit is now a term in the sum.
      const { out } = runIn(['chore: unrelated'], validDoc(),
        sprint('a-1-2-x: backlog', 'b-3-4-y: done', 'c-epic-1: in-progress'));
      assert.match(out, /3 keys read = 1 live \+ 1 done \+ 1 epic \+ 0 superseded \+ 0 unparseable \+ 0 collapsed/);
      assert.doesNotMatch(out, /RECONCILIATION FAILED/);
    });

    it('treats a capitalised terminal status as done, not as a divergence', () => {
      // Widening the charset to admit `descoped-by-ADR` also began admitting `Done`, and an
      // exact-match terminal test would warn on a finished story — a false positive, which for
      // a warn-level gate is the failure that gets it ignored.
      const { out } = runIn(['fix(a-1-2): ship it'], validDoc(), sprint('a-1-2-x: Done'));
      assert.doesNotMatch(out, /status divergence/);
      assert.match(out, /1 done/);
    });

    it('sends a non-word scalar to unrecognized rather than believing it is a status', () => {
      const { out } = runIn(['chore: unrelated'], validDoc(), sprint('a-1-2-x: 2026-08-30'));
      assert.match(out, /1 key\(s\) unrecognized/, 'a date is not a status');
      assert.match(out, /0 live/, 'and it must not make the key live');
    });

    it('tolerates trailing whitespace after a valid status', () => {
      const { out } = runIn(['fix(a-1-2): ship it'], validDoc(),
        ['development_status:', '  a-1-2-x: done ', ''].join('\n'));
      assert.doesNotMatch(out, /unrecognized/, 'a status is not less terminal for having a trailing space');
      assert.doesNotMatch(out, /status divergence/);
    });

    it('does not swallow a story that carries a full pair after an epic segment', () => {
      // The Round 1 epic fix stopped `x-epic-flow-1-2` but not `x-epic-1-2`. `epic` counts only
      // when followed by a number AND not by a second one.
      assert.deepEqual(storyId('x-epic-1-2'), { kind: 'story', id: 'x-epic-1-2' });
      assert.deepEqual(storyId('dist-epic-2-1-a-story'), { kind: 'story', id: 'dist-epic-2-1' });
      assert.deepEqual(storyId('dist-epic-2'), { kind: 'epic' }, 'a real epic key still reads as one');
    });

    it('names a superseded duplicate rather than letting the denominator overcount', () => {
      const { out } = runIn(['chore: unrelated'], validDoc(),
        sprint('a-1-2-x: backlog', 'a-1-2-x: done'));
      assert.match(out, /1 key\(s\) superseded/);
      assert.match(out, /2 keys read = 0 live \+ 1 done \+ 0 epic \+ 1 superseded/,
        'the raw read count must still reconcile against the dedup');
    });

    it('caps a long skip list so one warning cannot become hundreds of log lines', () => {
      const many = Array.from({ length: 14 }, (_, i) => `k-${i + 1}-1-x: 2026-08-30`);
      const { out } = runIn(['chore: unrelated'], validDoc(), sprint(...many));
      assert.match(out, /14 key\(s\) unrecognized/, 'the true total is still reported');
      assert.match(out, /\(\+4 more\)/, 'and the withheld count is stated');
      // Count the LISTED entries. Asserting only on `(+4 more)` cannot detect an uncapped
      // listing, because the summary line prints either way — mutation caught that.
      assert.equal((out.match(/^ {4}.*sprint-status\.yaml:\d+ `k-/gm) || []).length, 10,
        'at most ten keys may be listed, however many were skipped');
    });

    it('re-opens the block on a duplicate development_status: key', () => {
      // Reached only on malformed input, but the previous form consumed that line as a closer
      // and never re-entered — so every key below vanished with no bucket and no trace, which
      // is the silent-drop class this whole area exists to prevent.
      const doc = [
        'development_status:', '  a-1-2-x: done', 'development_status:', '  b-3-4-y: backlog', '',
      ].join('\n');
      const { out } = runIn(['fix(b-3-4): ship it'], validDoc(), doc);
      assert.match(out, /status divergence: b-3-4\b/, 'keys after the second opener must be scanned');
      assert.match(out, /2 keys read/, 'and counted');
      assert.doesNotMatch(out, /outside the block/, 'they are inside a block, not stranded');
    });

    it('annotates the SILENT states too, not only the loud one', () => {
      // The rationale for annotating — a finding buried in a passing job's log — applies with
      // more force to "the file could not be read" and "N keys were not scanned" than to a
      // divergence, yet only the divergence was surfaced.
      const missing = runIn(['fix(a-1-2): ship it'], validDoc(), null, { githubActions: true }).out;
      assert.match(missing, /^::warning::story-status scan did not run/m);
      const skipped = runIn(['chore: unrelated'], validDoc(), sprint('a-1-2-x: 2026-08-30'),
        { githubActions: true }).out;
      assert.match(skipped, /^::warning::1 sprint-status key\(s\) unrecognized — not scanned/m);
    });


    it('accounts for a de-indented key on the block-closing line itself', () => {
      // Round 3's hole in the conservation law, at its own boundary: the closing line is
      // consumed by the bound before any bucket sees it, and the residue predicate needs a
      // two-space indent, so de-indenting the LAST key of the block lost it with every bucket
      // empty and the arithmetic still balancing. Reproduced on the live tree.
      const doc = ['development_status:', '  a-1-2-x: done', 'b-3-4-y: backlog', ''].join('\n');
      const { code, out } = runIn(['fix(b-3-4): ship it'], validDoc(), doc);
      assert.equal(code, 0);
      assert.match(out, /1 key\(s\) outside the block/, 'the closing line must be counted, not consumed');
      assert.match(out, /b-3-4-y: backlog/, 'and named');
    });

    it('does not mistake a real sibling top-level key for a lost story key', () => {
      // The residue predicate must not fire on `action_items:` — the slug class excludes the
      // underscore, which is what keeps this file's real siblings out of the bucket.
      const doc = [
        'development_status:', '  a-1-2-x: done', '', 'action_items:', '  - epic: gen-epic-1', '',
      ].join('\n');
      const { out } = runIn(['chore: unrelated'], validDoc(), doc);
      assert.doesNotMatch(out, /outside the block/, 'a legitimate sibling key is not a lost story');
    });

    it('keeps the reconciliation report reachable when every bucket is empty', () => {
      // The check was dead in exactly the state it guards: the clean-looking early return fired
      // first, so an imbalance with no buckets and no divergence printed a tidy denominator.
      // Today the arithmetic is algebraically forced to balance, so this asserts the ABSENCE —
      // and the mutation that adds an uncounted exit makes the message appear and kills it.
      // `wontfix` is deliberately an unfamiliar status: it must be counted as live, so that a
      // future exit added without a counter produces a real imbalance here. That is what makes
      // the RECONCILIATION FAILED path falsifiable — the mutation "introduce an uncounted exit"
      // turns this fixture red. Without such a fixture the check could never fire at all.
      const { out } = runIn(['chore: unrelated'], validDoc(),
        sprint('a-1-2-x: backlog', 'b-3-4-y: done', 'c-epic-1: optional', 'd-7-8-z: wontfix'));
      assert.doesNotMatch(out, /RECONCILIATION FAILED/);
      assert.match(out, /4 keys read = 2 live \+ 1 done \+ 1 epic/);
    });

    it('does not call a superseded duplicate a coverage hole', () => {
      // Last-write-wins is correct YAML semantics; the later value WAS scanned. Reporting it as
      // "NOT scanned" turns a correct dedup into a false alarm.
      const { out } = runIn(['chore: unrelated'], validDoc(), sprint('a-1-2-x: backlog', 'a-1-2-x: done'));
      assert.match(out, /superseded — the later value was scanned instead/);
      assert.doesNotMatch(out, /superseded — NOT scanned/);
    });

    it('accepts a tab between the colon and the status', () => {
      const doc = ['development_status:', '  a-1-2-x:\tbacklog', ''].join('\n');
      const { out } = runIn(['fix(a-1-2): ship it'], validDoc(), doc);
      assert.match(out, /status divergence: a-1-2\b/, 'a tab is whitespace, not a malformed line');
    });

    it('parses a sole-CR file instead of collapsing it into one line', () => {
      const cr = 'development_status:\r  a-1-2-x: backlog\r  b-3-4-y: done\r';
      const { out } = runIn(['fix(a-1-2): ship it'], validDoc(), cr);
      assert.match(out, /status divergence: a-1-2\b/);
      assert.match(out, /2 keys read/, 'both keys must survive the split');
    });

    it('caps the divergence listing as well as the skip listing', () => {
      // A mass status reset would otherwise emit hundreds of lines and hundreds of annotations.
      const keys = Array.from({ length: 13 }, (_, i) => `d-${i + 1}-1-x: backlog`);
      const subjects = Array.from({ length: 13 }, (_, i) => `fix(d-${i + 1}-1): ship it`);
      const { out } = runIn(subjects, validDoc(), sprint(...keys), { githubActions: true });
      assert.match(out, /13 story status\(es\) diverge/, 'the true total is reported');
      assert.equal((out.match(/^ {4}status divergence:/gm) || []).length, 10, 'listing capped at ten');
      assert.match(out, /\(\+3 more\)/);
      assert.equal((out.match(/^::warning::status divergence:/gm) || []).length, 10,
        'annotations capped too — they are the noisier channel');
    });

    it('parseStoryStatuses and storyId are pure and independently checkable', () => {
      const parsed = parseStoryStatuses(
        ['development_status:', '  a-1-2-x: backlog', '  junk here', 'other:', '  b-3-4-y: done'].join('\n'),
      );
      assert.deepEqual(parsed.rows, [{ line: 2, key: 'a-1-2-x', status: 'backlog' }]);
      assert.deepEqual(parsed.unrecognized, [{ line: 3, text: 'junk here' }]);
      assert.deepEqual(storyId('dist-2-5-close-bug-19'), { kind: 'story', id: 'dist-2-5' });
      // The trailing letter is real: `v63-1b-1` ships, and a digits-only rule made three live
      // stories invisible when this was first measured.
      assert.deepEqual(storyId('v63-1b-1-remove-agents'), { kind: 'story', id: 'v63-1b-1' });
      assert.deepEqual(storyId('1-1-expand-agent-registry'), { kind: 'story', id: '1-1' });
      assert.deepEqual(storyId('dist-epic-2'), { kind: 'epic' });
      assert.deepEqual(storyId('dist-epic-2-retrospective'), { kind: 'epic' });
      assert.deepEqual(storyId('x-epic-flow-1-2-y'), { kind: 'story', id: 'x-epic-flow-1-2' });
      assert.deepEqual(storyId('i97-bug-1-fix-p0'), { kind: 'unparseable' });
      assert.equal(STORY_VERBS.has('fix'), true);
      assert.equal(STORY_VERBS.has('feat'), true);
      assert.equal(STORY_VERBS.has('governance'), false, 'the story pass is narrower than WORK_VERBS');
      assert.equal(WORK_VERBS.has('governance'), true, 'and the lane pass is deliberately not narrowed');
    });
  });
});
