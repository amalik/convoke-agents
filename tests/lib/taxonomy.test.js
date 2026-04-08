'use strict';

const { describe, it, before, afterEach } = require('node:test');
const assert = require('node:assert/strict');

const path = require('path');
const fs = require('fs-extra');
const os = require('os');
const { readTaxonomy } = require('../../scripts/lib/artifact-utils');
const { findProjectRoot } = require('../../scripts/update/lib/utils');

// --- Integration tests: load real taxonomy.yaml ---

describe('readTaxonomy — integration with real taxonomy.yaml', () => {
  let projectRoot;

  before(() => {
    projectRoot = findProjectRoot();
    if (!projectRoot) {
      throw new Error('Cannot find project root — run tests from within the Convoke repo');
    }
  });

  it('loads and parses _bmad/_config/taxonomy.yaml successfully', () => {
    const config = readTaxonomy(projectRoot);
    assert.notEqual(config, undefined);
    assert.notEqual(config.initiatives, undefined);
    assert.notEqual(config.artifact_types, undefined);
  });

  it('initiatives.platform contains exactly 8 IDs', () => {
    const config = readTaxonomy(projectRoot);
    assert.equal(config.initiatives.platform.length, 8);
    assert.deepEqual(config.initiatives.platform, [
      'vortex', 'gyre', 'bmm', 'forge', 'helm', 'enhance', 'loom', 'convoke',
    ]);
  });

  it('initiatives.user is an empty array', () => {
    const config = readTaxonomy(projectRoot);
    assert.deepEqual(config.initiatives.user, []);
  });

  it('aliases contains 6 entries', () => {
    const config = readTaxonomy(projectRoot);
    assert.equal(Object.keys(config.aliases).length, 6);
    assert.equal(config.aliases['strategy-perimeter'], 'helm');
    assert.equal(config.aliases['strategy'], 'helm');
    assert.equal(config.aliases['strategic'], 'helm');
    assert.equal(config.aliases['strategic-navigator'], 'helm');
    assert.equal(config.aliases['strategic-practitioner'], 'helm');
    assert.equal(config.aliases['team-factory'], 'loom');
  });

  it('artifact_types contains ~21 entries', () => {
    const config = readTaxonomy(projectRoot);
    assert.ok(config.artifact_types.length >= 20);
    assert.ok(config.artifact_types.includes('prd'));
    assert.ok(config.artifact_types.includes('epic'));
    assert.ok(config.artifact_types.includes('lean-persona'));
    assert.ok(config.artifact_types.includes('hypothesis'));
    assert.ok(config.artifact_types.includes('spec'));
  });

  it('all initiative IDs pass validation pattern', () => {
    const config = readTaxonomy(projectRoot);
    const idPattern = /^[a-z][a-z0-9-]*$/;
    for (const id of config.initiatives.platform) {
      assert.match(id, idPattern);
    }
    for (const type of config.artifact_types) {
      assert.match(type, idPattern);
    }
  });
});

// --- Validation tests: rejection cases with temp directories ---

describe('readTaxonomy — validation rejection cases', () => {
  let tmpDir;

  async function writeTempTaxonomy(content) {
    tmpDir = path.join(os.tmpdir(), `taxonomy-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    const configDir = path.join(tmpDir, '_bmad', '_config');
    await fs.ensureDir(configDir);
    await fs.writeFile(path.join(configDir, 'taxonomy.yaml'), content, 'utf8');
    return tmpDir;
  }

  afterEach(async () => {
    if (tmpDir) {
      await fs.remove(tmpDir);
      tmpDir = null;
    }
  });

  it('rejects uppercase initiative ID', async () => {
    const root = await writeTempTaxonomy(`
initiatives:
  platform:
    - Helm
  user: []
artifact_types:
  - prd
`);
    assert.throws(() => readTaxonomy(root), /invalid initiative id.*helm/i);
  });

  it('rejects initiative ID with spaces', async () => {
    const root = await writeTempTaxonomy(`
initiatives:
  platform:
    - my project
  user: []
artifact_types:
  - prd
`);
    assert.throws(() => readTaxonomy(root), /invalid initiative id/i);
  });

  it('rejects initiative ID with special characters', async () => {
    const root = await writeTempTaxonomy(`
initiatives:
  platform:
    - helm@v2
  user: []
artifact_types:
  - prd
`);
    assert.throws(() => readTaxonomy(root), /invalid initiative id/i);
  });

  it('rejects duplicate IDs across platform and user sections', async () => {
    const root = await writeTempTaxonomy(`
initiatives:
  platform:
    - helm
    - gyre
  user:
    - helm
artifact_types:
  - prd
`);
    assert.throws(() => readTaxonomy(root), /duplicate initiative id.*helm/i);
  });

  it('rejects invalid artifact type', async () => {
    const root = await writeTempTaxonomy(`
initiatives:
  platform:
    - helm
  user: []
artifact_types:
  - Valid Type
`);
    assert.throws(() => readTaxonomy(root), /invalid artifact type/i);
  });

  it('throws on missing file', () => {
    const fakeRoot = path.join(os.tmpdir(), 'nonexistent-project');
    assert.throws(() => readTaxonomy(fakeRoot), /taxonomy config not found/i);
  });

  it('throws on malformed YAML', async () => {
    const root = await writeTempTaxonomy(`
initiatives:
  platform:
    - valid
  user: [
    unclosed array
artifact_types:
  - prd
`);
    assert.throws(() => readTaxonomy(root), /invalid yaml/i);
  });

  it('throws on missing initiatives.platform', async () => {
    const root = await writeTempTaxonomy(`
artifact_types:
  - prd
`);
    assert.throws(() => readTaxonomy(root), /missing required field.*initiatives\.platform/i);
  });

  it('throws on missing artifact_types', async () => {
    const root = await writeTempTaxonomy(`
initiatives:
  platform:
    - helm
  user: []
`);
    assert.throws(() => readTaxonomy(root), /missing required field.*artifact_types/i);
  });
});
