const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const fs = require('fs-extra');
const os = require('os');

const { appendCsvRow } = require('../../_bmad/bme/_team-factory/lib/writers/csv-appender');
const { CSV_HEADER } = require('../../_bmad/bme/_team-factory/lib/writers/csv-creator');

function buildExistingCsv() {
  return [
    CSV_HEADER,
    'bme/_test-team,anytime,Data Analysis,DA,10,_bmad/bme/_test-team/workflows/data-analysis/workflow.md,bmad-test-team-data-analysis,false,alpha-analyzer,Create Mode,Analyzes data patterns,{project-root}/_bmad-output/test-team-artifacts,data-analysis,',
  ].join('\n') + '\n';
}

function buildNewRowData() {
  return {
    module: 'bme/_test-team',
    workflowName: 'integrity-check',
    agentId: 'gamma-guardian',
    agentRole: 'Guards system integrity',
    teamNameKebab: 'test-team',
    outputLocation: '{project-root}/_bmad-output/test-team-artifacts',
  };
}

// === Happy path ===

describe('appendCsvRow — happy path', () => {
  let tmpDir, csvPath;

  before(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'bmad-tf-csvapp-'));
    csvPath = path.join(tmpDir, 'module-help.csv');
    await fs.writeFile(csvPath, buildExistingCsv(), 'utf8');
  });

  after(async () => { await fs.remove(tmpDir); });

  it('appends new row to existing CSV', async () => {
    const result = await appendCsvRow(buildNewRowData(), csvPath);

    assert.equal(result.success, true);
    assert.equal(result.rowCount, 2);
    assert.deepEqual(result.errors, []);

    const content = await fs.readFile(csvPath, 'utf8');
    const lines = content.trim().split('\n');
    assert.equal(lines.length, 3); // header + 2 data rows
    assert.equal(lines[0], CSV_HEADER);
    assert.ok(lines[2].includes('gamma-guardian'));
    assert.ok(lines[2].includes('integrity-check'));
  });
});

// === Idempotency ===

describe('appendCsvRow — idempotency', () => {
  let tmpDir, csvPath;

  before(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'bmad-tf-csvapp-'));
    csvPath = path.join(tmpDir, 'module-help.csv');
    await fs.writeFile(csvPath, buildExistingCsv(), 'utf8');
  });

  after(async () => { await fs.remove(tmpDir); });

  it('skips when agent row already exists', async () => {
    const existingRow = buildNewRowData();
    existingRow.agentId = 'alpha-analyzer';

    const result = await appendCsvRow(existingRow, csvPath);

    assert.equal(result.success, true);
    assert.equal(result.skipped, 'agent row already exists');
  });
});

// === File not found ===

describe('appendCsvRow — file not found', () => {
  it('fails when CSV does not exist', async () => {
    const result = await appendCsvRow(buildNewRowData(), '/nonexistent/module-help.csv');

    assert.equal(result.success, false);
    assert.ok(result.errors[0].includes('does not exist'));
  });
});

// === Header mismatch ===

describe('appendCsvRow — header mismatch', () => {
  let tmpDir, csvPath;

  before(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'bmad-tf-csvapp-'));
    csvPath = path.join(tmpDir, 'module-help.csv');
    await fs.writeFile(csvPath, 'wrong,header,format\ndata,row,here\n', 'utf8');
  });

  after(async () => { await fs.remove(tmpDir); });

  it('fails on header mismatch', async () => {
    const result = await appendCsvRow(buildNewRowData(), csvPath);

    assert.equal(result.success, false);
    assert.ok(result.errors[0].includes('header mismatch'));
  });
});

// === Input validation ===

describe('appendCsvRow — input validation', () => {
  it('fails with null rowData', async () => {
    const result = await appendCsvRow(null, '/fake/path');

    assert.equal(result.success, false);
    assert.ok(result.errors[0].includes('rowData'));
  });
});

// === Preserves existing rows ===

describe('appendCsvRow — preserves existing rows', () => {
  let tmpDir, csvPath;

  before(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'bmad-tf-csvapp-'));
    csvPath = path.join(tmpDir, 'module-help.csv');
    await fs.writeFile(csvPath, buildExistingCsv(), 'utf8');
  });

  after(async () => { await fs.remove(tmpDir); });

  it('does not modify existing rows', async () => {
    const contentBefore = await fs.readFile(csvPath, 'utf8');
    const linesBefore = contentBefore.trim().split('\n');

    await appendCsvRow(buildNewRowData(), csvPath);

    const contentAfter = await fs.readFile(csvPath, 'utf8');
    const linesAfter = contentAfter.trim().split('\n');

    // Original lines unchanged
    assert.equal(linesAfter[0], linesBefore[0]); // header
    assert.equal(linesAfter[1], linesBefore[1]); // first data row
  });
});

// === Atomic write ===

describe('appendCsvRow — atomic write', () => {
  let tmpDir, csvPath;

  before(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'bmad-tf-csvapp-'));
    csvPath = path.join(tmpDir, 'module-help.csv');
    await fs.writeFile(csvPath, buildExistingCsv(), 'utf8');
  });

  after(async () => { await fs.remove(tmpDir); });

  it('does not leave .tmp file after successful write', async () => {
    await appendCsvRow(buildNewRowData(), csvPath);

    assert.equal(await fs.pathExists(csvPath + '.tmp'), false);
  });
});
