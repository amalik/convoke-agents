const path = require('path');
const fs = require('fs-extra');
const os = require('os');
const { readTaxonomy } = require('../../scripts/lib/artifact-utils');
const { findProjectRoot } = require('../../scripts/update/lib/utils');

// --- Integration tests: load real taxonomy.yaml ---

describe('readTaxonomy — integration with real taxonomy.yaml', () => {
  let projectRoot;

  beforeAll(() => {
    projectRoot = findProjectRoot();
    if (!projectRoot) {
      throw new Error('Cannot find project root — run tests from within the Convoke repo');
    }
  });

  test('loads and parses _bmad/_config/taxonomy.yaml successfully', () => {
    const config = readTaxonomy(projectRoot);
    expect(config).toBeDefined();
    expect(config.initiatives).toBeDefined();
    expect(config.artifact_types).toBeDefined();
  });

  test('initiatives.platform contains exactly 8 IDs', () => {
    const config = readTaxonomy(projectRoot);
    expect(config.initiatives.platform).toHaveLength(8);
    expect(config.initiatives.platform).toEqual([
      'vortex', 'gyre', 'bmm', 'forge', 'helm', 'enhance', 'loom', 'convoke'
    ]);
  });

  test('initiatives.user is an empty array', () => {
    const config = readTaxonomy(projectRoot);
    expect(config.initiatives.user).toEqual([]);
  });

  test('aliases contains 3 entries', () => {
    const config = readTaxonomy(projectRoot);
    expect(Object.keys(config.aliases)).toHaveLength(3);
    expect(config.aliases['strategy-perimeter']).toBe('helm');
    expect(config.aliases['strategy']).toBe('helm');
    expect(config.aliases['team-factory']).toBe('loom');
  });

  test('artifact_types contains ~21 entries', () => {
    const config = readTaxonomy(projectRoot);
    expect(config.artifact_types.length).toBeGreaterThanOrEqual(20);
    expect(config.artifact_types).toContain('prd');
    expect(config.artifact_types).toContain('epic');
    expect(config.artifact_types).toContain('lean-persona');
    expect(config.artifact_types).toContain('hypothesis');
    expect(config.artifact_types).toContain('spec');
  });

  test('all initiative IDs pass validation pattern', () => {
    const config = readTaxonomy(projectRoot);
    const idPattern = /^[a-z][a-z0-9-]*$/;
    for (const id of config.initiatives.platform) {
      expect(id).toMatch(idPattern);
    }
    for (const type of config.artifact_types) {
      expect(type).toMatch(idPattern);
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

  test('rejects uppercase initiative ID', async () => {
    const root = await writeTempTaxonomy(`
initiatives:
  platform:
    - Helm
  user: []
artifact_types:
  - prd
`);
    expect(() => readTaxonomy(root)).toThrow(/invalid initiative id.*helm/i);
  });

  test('rejects initiative ID with spaces', async () => {
    const root = await writeTempTaxonomy(`
initiatives:
  platform:
    - my project
  user: []
artifact_types:
  - prd
`);
    expect(() => readTaxonomy(root)).toThrow(/invalid initiative id/i);
  });

  test('rejects initiative ID with special characters', async () => {
    const root = await writeTempTaxonomy(`
initiatives:
  platform:
    - helm@v2
  user: []
artifact_types:
  - prd
`);
    expect(() => readTaxonomy(root)).toThrow(/invalid initiative id/i);
  });

  test('rejects duplicate IDs across platform and user sections', async () => {
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
    expect(() => readTaxonomy(root)).toThrow(/duplicate initiative id.*helm/i);
  });

  test('rejects invalid artifact type', async () => {
    const root = await writeTempTaxonomy(`
initiatives:
  platform:
    - helm
  user: []
artifact_types:
  - Valid Type
`);
    expect(() => readTaxonomy(root)).toThrow(/invalid artifact type/i);
  });

  test('throws on missing file', () => {
    const fakeRoot = path.join(os.tmpdir(), 'nonexistent-project');
    expect(() => readTaxonomy(fakeRoot)).toThrow(/taxonomy config not found/i);
  });

  test('throws on malformed YAML', async () => {
    const root = await writeTempTaxonomy(`
initiatives:
  platform:
    - valid
  user: [
    unclosed array
artifact_types:
  - prd
`);
    expect(() => readTaxonomy(root)).toThrow(/invalid yaml/i);
  });

  test('throws on missing initiatives.platform', async () => {
    const root = await writeTempTaxonomy(`
artifact_types:
  - prd
`);
    expect(() => readTaxonomy(root)).toThrow(/missing required field.*initiatives\.platform/i);
  });

  test('throws on missing artifact_types', async () => {
    const root = await writeTempTaxonomy(`
initiatives:
  platform:
    - helm
  user: []
`);
    expect(() => readTaxonomy(root)).toThrow(/missing required field.*artifact_types/i);
  });
});
