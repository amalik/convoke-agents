const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs-extra');
const os = require('os');
const path = require('path');
const yaml = require('js-yaml');
const { checkTaxonomy } = require('../../scripts/convoke-doctor');

describe('checkTaxonomy', () => {
  let tmpDir;

  before(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'convoke-doc-'));
  });

  after(async () => {
    await fs.remove(tmpDir);
  });

  it('returns warning when taxonomy.yaml missing', () => {
    const results = checkTaxonomy(tmpDir);
    assert.equal(results.length, 1);
    assert.equal(results[0].passed, false);
    assert.ok(results[0].warning);
    assert.ok(results[0].warning.includes('not found'));
    assert.ok(results[0].fix);
  });

  it('passes all checks for valid taxonomy', async () => {
    const configDir = path.join(tmpDir, '_bmad', '_config');
    await fs.ensureDir(configDir);
    const valid = {
      initiatives: { platform: ['vortex', 'gyre'], user: ['my-project'] },
      artifact_types: ['prd', 'epic', 'arch'],
      aliases: { 'team-factory': 'loom' }
    };
    await fs.writeFile(path.join(configDir, 'taxonomy.yaml'), yaml.dump(valid), 'utf8');

    const results = checkTaxonomy(tmpDir);
    assert.ok(results.every(r => r.passed), `All checks should pass: ${JSON.stringify(results.filter(r => !r.passed))}`);
    assert.ok(results.length >= 5); // file + yaml + structure + format + duplicates + collisions
  });

  it('returns error for malformed YAML', async () => {
    const configDir = path.join(tmpDir, '_bmad', '_config');
    await fs.ensureDir(configDir);
    await fs.writeFile(path.join(configDir, 'taxonomy.yaml'), 'not: valid: yaml: [broken', 'utf8');

    const results = checkTaxonomy(tmpDir);
    const yamlCheck = results.find(r => r.name.includes('valid YAML'));
    assert.ok(yamlCheck);
    assert.equal(yamlCheck.passed, false);
    assert.ok(yamlCheck.error.includes('Invalid YAML'));
  });

  it('detects invalid ID format', async () => {
    const configDir = path.join(tmpDir, '_bmad', '_config');
    await fs.ensureDir(configDir);
    const invalid = {
      initiatives: { platform: ['Valid-id', 'UPPERCASE'], user: [] },
      artifact_types: ['prd'],
      aliases: {}
    };
    await fs.writeFile(path.join(configDir, 'taxonomy.yaml'), yaml.dump(invalid), 'utf8');

    const results = checkTaxonomy(tmpDir);
    const formatCheck = results.find(r => r.name.includes('ID format'));
    assert.ok(formatCheck);
    assert.equal(formatCheck.passed, false);
    assert.ok(formatCheck.error.includes('UPPERCASE'));
  });

  it('detects duplicates between platform and user', async () => {
    const configDir = path.join(tmpDir, '_bmad', '_config');
    await fs.ensureDir(configDir);
    const dupe = {
      initiatives: { platform: ['gyre', 'helm'], user: ['helm', 'my-thing'] },
      artifact_types: ['prd'],
      aliases: {}
    };
    await fs.writeFile(path.join(configDir, 'taxonomy.yaml'), yaml.dump(dupe), 'utf8');

    const results = checkTaxonomy(tmpDir);
    const dupeCheck = results.find(r => r.name.includes('no duplicates'));
    assert.ok(dupeCheck);
    assert.equal(dupeCheck.passed, false);
    assert.ok(dupeCheck.error.includes('helm'));
  });

  it('detects collisions between initiatives and artifact types', async () => {
    const configDir = path.join(tmpDir, '_bmad', '_config');
    await fs.ensureDir(configDir);
    const collision = {
      initiatives: { platform: ['prd', 'gyre'], user: [] },
      artifact_types: ['prd', 'epic'],
      aliases: {}
    };
    await fs.writeFile(path.join(configDir, 'taxonomy.yaml'), yaml.dump(collision), 'utf8');

    const results = checkTaxonomy(tmpDir);
    const collisionCheck = results.find(r => r.name.includes('no collisions'));
    assert.ok(collisionCheck);
    assert.equal(collisionCheck.passed, false);
    assert.ok(collisionCheck.error.includes('prd'));
  });
});
