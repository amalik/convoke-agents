const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const fs = require('fs-extra');
const os = require('os');
const yaml = require('js-yaml');

const { createCsv, buildCsvRows, deriveCode, toTitleCase, CSV_HEADER } = require('../../_bmad/bme/_team-factory/lib/writers/csv-creator');

const FIXTURE_PATH = path.join(__dirname, 'fixtures', 'test-team-spec.yaml');
const GOLDEN_PATH = path.join(__dirname, 'golden', 'golden-help-csv.csv');

function loadFixtureSpec() {
  return yaml.load(fs.readFileSync(FIXTURE_PATH, 'utf8'));
}

// === createCsv ===

describe('createCsv', () => {
  let tmpDir;

  before(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'bmad-tf-csv-'));
  });

  after(async () => {
    await fs.remove(tmpDir);
  });

  it('creates module-help.csv matching golden file', async () => {
    const specData = loadFixtureSpec();
    const outputPath = path.join(tmpDir, '_test-team', 'module-help.csv');

    const result = await createCsv(specData, outputPath);
    assert.equal(result.success, true);
    assert.deepEqual(result.errors, []);
    assert.equal(result.rowCount, 2);

    const actual = fs.readFileSync(outputPath, 'utf8');
    const expected = fs.readFileSync(GOLDEN_PATH, 'utf8');
    assert.equal(actual, expected, 'module-help.csv does not match golden file');
  });

  it('header matches standard format', async () => {
    const specData = loadFixtureSpec();
    const outputPath = path.join(tmpDir, '_header-test', 'module-help.csv');

    await createCsv(specData, outputPath);
    const content = await fs.readFile(outputPath, 'utf8');
    const firstLine = content.split('\n')[0];
    assert.equal(firstLine, CSV_HEADER);
  });

  it('row count matches workflow count', async () => {
    const specData = loadFixtureSpec();
    const outputPath = path.join(tmpDir, '_count-test', 'module-help.csv');

    const result = await createCsv(specData, outputPath);
    assert.equal(result.rowCount, specData.agents.length);

    // Verify actual lines (header + data rows + trailing newline)
    const content = await fs.readFile(outputPath, 'utf8');
    const lines = content.split('\n').filter(l => l.trim());
    assert.equal(lines.length, specData.agents.length + 1); // +1 for header
  });

  it('refuses to overwrite existing file (additive-only)', async () => {
    const specData = loadFixtureSpec();
    const existingDir = path.join(tmpDir, '_existing-csv');
    await fs.ensureDir(existingDir);
    const outputPath = path.join(existingDir, 'module-help.csv');
    await fs.writeFile(outputPath, 'existing', 'utf8');

    const result = await createCsv(specData, outputPath);
    assert.equal(result.success, false);
    assert.ok(result.errors[0].includes('already exists'));

    const content = await fs.readFile(outputPath, 'utf8');
    assert.equal(content, 'existing');
  });
});

// === buildCsvRows ===

describe('buildCsvRows', () => {
  it('generates correct module path', () => {
    const specData = loadFixtureSpec();
    const rows = buildCsvRows(specData);
    assert.equal(rows[0].module, 'bme/_test-team');
  });

  it('generates ascending sequence numbers', () => {
    const specData = loadFixtureSpec();
    const rows = buildCsvRows(specData);
    assert.equal(rows[0].sequence, 10);
    assert.equal(rows[1].sequence, 20);
  });

  it('maps agent ID to agent column', () => {
    const specData = loadFixtureSpec();
    const rows = buildCsvRows(specData);
    assert.equal(rows[0].agent, 'alpha-analyzer');
    assert.equal(rows[1].agent, 'beta-builder');
  });
});

// === deriveCode ===

describe('deriveCode', () => {
  it('takes first letter of first two words', () => {
    assert.equal(deriveCode('stack-detection'), 'SD');
    assert.equal(deriveCode('data-analysis'), 'DA');
  });

  it('handles single-word names', () => {
    assert.equal(deriveCode('analysis'), 'AN');
  });
});

// === toTitleCase ===

describe('toTitleCase', () => {
  it('converts kebab to title case', () => {
    assert.equal(toTitleCase('data-analysis'), 'Data Analysis');
    assert.equal(toTitleCase('full-analysis'), 'Full Analysis');
  });
});

// ── tf-2-13 Task 2 (T133b): command codes must be unique within a module ──
// deriveCode returned the initials of the first two words, so `run-check-a` and
// `run-check-b` both yielded `RC`. Reproduced on the tf-2-11 pilot: both rows of
// the generated module-help.csv carried code RC, making the second unreachable.
describe('tf-2-13: module-help.csv command codes', () => {
  const specWith = (workflows) => ({
    team_name: 'Code Probe',
    team_name_kebab: 'code-probe',
    description: 'probe',
    agents: workflows.map((w, i) => ({ id: `agent-${i}`, role: `Role ${i}`, capabilities: [w] })),
    integration: { output_directory: '_bmad-output/code-probe-artifacts' }
  });

  it('gives colliding workflow names distinct codes', () => {
    const rows = buildCsvRows(specWith(['run-check-a', 'run-check-b']));
    const codes = rows.map(r => r.code);
    assert.equal(new Set(codes).size, codes.length, `duplicate codes: ${codes.join(', ')}`);
  });

  it('is deterministic — the same spec yields the same codes (NFR4, within-version)', () => {
    const a = buildCsvRows(specWith(['run-check-a', 'run-check-b', 'run-check-c'])).map(r => r.code);
    const b = buildCsvRows(specWith(['run-check-a', 'run-check-b', 'run-check-c'])).map(r => r.code);
    assert.deepEqual(a, b);
  });
});
