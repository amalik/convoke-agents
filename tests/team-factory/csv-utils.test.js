const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

const { parseCsvRow, formatCsvRow } = require('../../_bmad/bme/_team-factory/lib/utils/csv-utils');

describe('parseCsvRow', () => {
  it('parses simple row with no quoted fields', () => {
    const row = 'a,b,c,d';
    assert.deepEqual(parseCsvRow(row), ['a', 'b', 'c', 'd']);
  });

  it('parses row with empty fields', () => {
    const row = 'a,,c,';
    assert.deepEqual(parseCsvRow(row), ['a', '', 'c', '']);
  });

  it('parses row with quoted field containing comma', () => {
    const row = 'a,b,"hello, world",d';
    assert.deepEqual(parseCsvRow(row), ['a', 'b', 'hello, world', 'd']);
  });

  it('parses row with escaped double quotes inside quoted field', () => {
    const row = 'a,"say ""hello""",c';
    assert.deepEqual(parseCsvRow(row), ['a', 'say "hello"', 'c']);
  });

  it('parses full CSV row matching team-factory format', () => {
    const row = 'bme/_test-team,anytime,Data Analysis,DA,10,workflow.md,bmad-test-team-data-analysis,false,alpha-analyzer,Create Mode,"Analyzes data, patterns, and trends",{project-root}/_bmad-output/test-team-artifacts,data-analysis,';
    const cols = parseCsvRow(row);
    assert.equal(cols[8], 'alpha-analyzer');
    assert.equal(cols[2], 'Data Analysis');
    assert.equal(cols[10], 'Analyzes data, patterns, and trends');
  });

  it('handles row with trailing comma (team-factory CSV pattern)', () => {
    const row = 'a,b,c,';
    const cols = parseCsvRow(row);
    assert.equal(cols.length, 4);
    assert.equal(cols[3], '');
  });

  it('parses row where only later columns are quoted', () => {
    // Columns 0-9 are simple, columns 10+ may contain commas
    const row = 'mod,phase,name,code,10,wf.md,cmd,false,agent-id,opts,"description, with comma",output,"out1, out2",';
    const cols = parseCsvRow(row);
    assert.equal(cols[8], 'agent-id');
    assert.equal(cols[10], 'description, with comma');
    assert.equal(cols[12], 'out1, out2');
  });
});

describe('formatCsvRow', () => {
  it('formats plain fields without quoting', () => {
    assert.equal(formatCsvRow(['a', 'b', 'c']), 'a,b,c');
  });

  it('quotes fields containing commas', () => {
    assert.equal(formatCsvRow(['a', 'hello, world', 'c']), 'a,"hello, world",c');
  });

  it('quotes fields containing embedded double quotes and escapes them as ""', () => {
    assert.equal(formatCsvRow(['a', 'say "hi"', 'c']), 'a,"say ""hi""",c');
  });

  it('quotes fields containing newlines', () => {
    assert.equal(formatCsvRow(['a', 'line1\nline2', 'c']), 'a,"line1\nline2",c');
  });

  it('returns empty string for empty array', () => {
    assert.equal(formatCsvRow([]), '');
  });

  it('serializes a single-element array without trailing comma', () => {
    assert.equal(formatCsvRow(['only']), 'only');
    assert.equal(formatCsvRow(['needs,quote']), '"needs,quote"');
  });

  it('round-trips parseCsvRow ∘ formatCsvRow for representative inputs', () => {
    const inputs = [
      ['a', 'b', 'c'],
      ['a', '', 'c', ''],
      ['a', 'hello, world', 'd'],
      ['a', 'say "hi"', 'c'],
      ['multi\nline', 'ok', 'with "quote" and,comma'],
    ];
    for (const fields of inputs) {
      assert.deepEqual(parseCsvRow(formatCsvRow(fields)), fields);
    }
  });

  it('throws TypeError on non-array input', () => {
    assert.throws(() => formatCsvRow('not-an-array'), TypeError);
    assert.throws(() => formatCsvRow(null), TypeError);
    assert.throws(() => formatCsvRow(undefined), TypeError);
  });

  it('coerces null and undefined field values to empty string', () => {
    assert.equal(formatCsvRow(['a', null, undefined, 'd']), 'a,,,d');
  });
});
