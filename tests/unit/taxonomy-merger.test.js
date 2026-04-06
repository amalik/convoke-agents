const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs-extra');
const os = require('os');
const path = require('path');
const yaml = require('js-yaml');
const { mergeTaxonomy, PLATFORM_INITIATIVES, DEFAULT_ARTIFACT_TYPES, DEFAULT_ALIASES } = require('../../scripts/update/lib/taxonomy-merger');

describe('mergeTaxonomy', () => {
  let tmpDir;

  before(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'convoke-tax-'));
    await fs.ensureDir(path.join(tmpDir, '_bmad', '_config'));
  });

  after(async () => {
    await fs.remove(tmpDir);
  });

  it('creates taxonomy.yaml with platform defaults when absent', async () => {
    const freshDir = await fs.mkdtemp(path.join(os.tmpdir(), 'convoke-fresh-'));
    await fs.ensureDir(path.join(freshDir, '_bmad'));

    const result = await mergeTaxonomy(freshDir);
    assert.equal(result.created, true);
    assert.equal(result.merged, false);
    assert.deepEqual(result.promoted, []);

    const configPath = path.join(freshDir, '_bmad', '_config', 'taxonomy.yaml');
    assert.ok(await fs.pathExists(configPath));

    const content = yaml.load(await fs.readFile(configPath, 'utf8'));
    assert.deepEqual(content.initiatives.platform, PLATFORM_INITIATIVES);
    assert.deepEqual(content.initiatives.user, []);
    assert.deepEqual(content.artifact_types, DEFAULT_ARTIFACT_TYPES);
    assert.deepEqual(content.aliases, DEFAULT_ALIASES);

    await fs.remove(freshDir);
  });

  it('merges platform entries without overwriting user additions', async () => {
    const configPath = path.join(tmpDir, '_bmad', '_config', 'taxonomy.yaml');
    // Write partial taxonomy with user additions
    const partial = {
      initiatives: {
        platform: ['vortex', 'gyre'],
        user: ['my-custom-initiative']
      },
      artifact_types: ['prd', 'epic'],
      aliases: {}
    };
    await fs.writeFile(configPath, yaml.dump(partial), 'utf8');

    const result = await mergeTaxonomy(tmpDir);
    assert.equal(result.created, false);
    assert.equal(result.merged, true);

    const content = yaml.load(await fs.readFile(configPath, 'utf8'));
    // All platform initiatives present
    for (const id of PLATFORM_INITIATIVES) {
      assert.ok(content.initiatives.platform.includes(id), `Missing platform initiative: ${id}`);
    }
    // User addition preserved
    assert.ok(content.initiatives.user.includes('my-custom-initiative'));
    // All artifact types present
    for (const type of DEFAULT_ARTIFACT_TYPES) {
      assert.ok(content.artifact_types.includes(type), `Missing artifact type: ${type}`);
    }
    // Aliases merged
    for (const key of Object.keys(DEFAULT_ALIASES)) {
      assert.ok(key in content.aliases, `Missing alias: ${key}`);
    }
  });

  it('promotes user initiative matching platform ID (FR42)', async () => {
    const promoteDir = await fs.mkdtemp(path.join(os.tmpdir(), 'convoke-promo-'));
    await fs.ensureDir(path.join(promoteDir, '_bmad', '_config'));
    const configPath = path.join(promoteDir, '_bmad', '_config', 'taxonomy.yaml');

    // User has 'helm' before it became platform
    const existing = {
      initiatives: {
        platform: ['vortex', 'gyre'],
        user: ['helm', 'my-project']
      },
      artifact_types: ['prd'],
      aliases: {}
    };
    await fs.writeFile(configPath, yaml.dump(existing), 'utf8');

    const result = await mergeTaxonomy(promoteDir);
    assert.deepEqual(result.promoted, ['helm']);

    const content = yaml.load(await fs.readFile(configPath, 'utf8'));
    // helm now in platform
    assert.ok(content.initiatives.platform.includes('helm'));
    // helm removed from user
    assert.ok(!content.initiatives.user.includes('helm'));
    // my-project still in user
    assert.ok(content.initiatives.user.includes('my-project'));

    // Promotion comment present in raw file
    const raw = await fs.readFile(configPath, 'utf8');
    assert.ok(raw.includes('helm: promoted from user section'));

    await fs.remove(promoteDir);
  });

  it('is idempotent — running twice produces same result', async () => {
    const idempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'convoke-idem-'));
    await fs.ensureDir(path.join(idempDir, '_bmad'));

    // First run: create
    const result1 = await mergeTaxonomy(idempDir);
    assert.equal(result1.created, true);

    const configPath = path.join(idempDir, '_bmad', '_config', 'taxonomy.yaml');
    const content1 = await fs.readFile(configPath, 'utf8');

    // Second run: no changes
    const result2 = await mergeTaxonomy(idempDir);
    assert.equal(result2.created, false);
    assert.equal(result2.merged, false);
    assert.deepEqual(result2.promoted, []);

    // Content unchanged
    const content2 = await fs.readFile(configPath, 'utf8');
    assert.equal(content1, content2);

    await fs.remove(idempDir);
  });
});

describe('2.0.x-to-3.1.0 migration', () => {
  let tmpDir;

  before(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'convoke-mig-'));
    await fs.ensureDir(path.join(tmpDir, '_bmad'));
  });

  after(async () => {
    await fs.remove(tmpDir);
  });

  it('has correct module shape', () => {
    const migration = require('../../scripts/update/migrations/2.0.x-to-3.1.0');
    assert.equal(migration.name, '2.0.x-to-3.1.0');
    assert.equal(migration.fromVersion, '2.0.x');
    assert.equal(migration.breaking, false);
    assert.equal(typeof migration.preview, 'function');
    assert.equal(typeof migration.apply, 'function');
  });

  it('preview returns action list', async () => {
    const migration = require('../../scripts/update/migrations/2.0.x-to-3.1.0');
    const result = await migration.preview();
    assert.ok(Array.isArray(result.actions));
    assert.ok(result.actions.length > 0);
  });

  it('apply creates taxonomy and returns changes array', async () => {
    const migration = require('../../scripts/update/migrations/2.0.x-to-3.1.0');
    const changes = await migration.apply(tmpDir);
    assert.ok(Array.isArray(changes));
    assert.ok(changes.length > 0);
    assert.ok(changes[0].includes('Created'));

    // Taxonomy file exists
    const configPath = path.join(tmpDir, '_bmad', '_config', 'taxonomy.yaml');
    assert.ok(await fs.pathExists(configPath));
  });
});
