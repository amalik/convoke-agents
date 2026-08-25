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
