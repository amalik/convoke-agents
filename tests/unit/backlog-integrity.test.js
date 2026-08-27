const { describe, it } = require('node:test');
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
} = require('../../scripts/audit/backlog-integrity');

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
const { BACKLOG } = require('../../scripts/audit/backlog-integrity');


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
  function runIn(subjects, doc) {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'bi-t79-'));
    const git = (...args) => execFileSync('git', args, { cwd: dir, stdio: 'ignore' });
    try {
      git('init', '-q');
      git('config', 'user.email', 't@example.invalid');
      git('config', 'user.name', 'T79 fixture');
      for (const subject of subjects) git('commit', '--allow-empty', '-q', '-m', subject);
      fs.mkdirSync(path.dirname(path.join(dir, BACKLOG)), { recursive: true });
      fs.writeFileSync(path.join(dir, BACKLOG), doc);
      const log = console.log;
      let out = '';
      console.log = (...a) => { out += `${a.join(' ')}\n`; };
      let code;
      try { code = main(dir); } finally { console.log = log; }
      return { code, out };
    } finally {
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
});
