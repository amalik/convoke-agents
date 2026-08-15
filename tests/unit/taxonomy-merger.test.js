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

  // ── Backlog I140: operator comments must survive a merge ──────────────────────────────
  //
  // `mergeTaxonomy` wrote `TAXONOMY_HEADER + yaml.dump(existing)`, reserialising from a plain
  // object and discarding every comment the operator had written. taxonomy.yaml explicitly
  // invites operator edits (`initiatives.user` is documented "Operator-managed. Add custom
  // initiative IDs here"), so the content most likely to carry an explanatory comment is exactly
  // what this function rewrites.
  //
  // Exposure was widened by I137: before it, mergeTaxonomy ran only from two migrations; it now
  // runs at the end of every refreshInstallation(). Measured rather than assumed — a
  // steady-state refresh writes nothing, so the loss is once-per-release-that-changes-defaults,
  // not every run. Both halves are asserted below.

  it('I140: a steady-state merge does not write, so comments are untouched', async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'convoke-tax-noop-'));
    try {
      await fs.ensureDir(path.join(dir, '_bmad', '_config'));
      const file = path.join(dir, '_bmad', '_config', 'taxonomy.yaml');
      await mergeTaxonomy(dir);
      const seeded = `# OPERATOR NOTE: do not touch initiatives.user\n${await fs.readFile(file, 'utf8')}`;
      await fs.writeFile(file, seeded, 'utf8');

      const result = await mergeTaxonomy(dir);
      assert.equal(result.merged, false, 'nothing changed, so nothing should have been written');
      assert.equal(await fs.readFile(file, 'utf8'), seeded, 'file was rewritten despite no changes');
    } finally {
      await fs.remove(dir);
    }
  });

  it('I140: a merge that DOES write preserves operator comments and formatting', async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'convoke-tax-cmt-'));
    try {
      await fs.ensureDir(path.join(dir, '_bmad', '_config'));
      const file = path.join(dir, '_bmad', '_config', 'taxonomy.yaml');
      await mergeTaxonomy(dir);

      // Operator edits: a leading comment, an inline comment, and a custom initiative.
      let seeded = await fs.readFile(file, 'utf8');
      seeded = `# OPERATOR NOTE: keep this\n${seeded}`.replace(
        'user: []',
        'user:\n    - my-custom-initiative # added for the Q3 engagement'
      );
      await fs.writeFile(file, seeded, 'utf8');

      // Force a real write the way a release does: introduce a platform default that is missing
      // from the file. Derived from the module's own constant, per `derive-counts-from-source`.
      const newType = `i140-probe-type-${Date.now()}`;
      DEFAULT_ARTIFACT_TYPES.push(newType);
      let after;
      try {
        const result = await mergeTaxonomy(dir);
        assert.equal(result.merged, true, 'a new platform default should have triggered a write');
        after = await fs.readFile(file, 'utf8');
      } finally {
        DEFAULT_ARTIFACT_TYPES.pop(); // shared module state — never leak it to sibling tests
      }

      assert.match(after, /# OPERATOR NOTE: keep this/, 'leading operator comment was discarded');
      assert.match(after, /Q3 engagement/, 'inline operator comment was discarded');
      assert.match(after, /my-custom-initiative/, 'operator initiative was dropped');
      assert.ok(after.includes(newType), 'the new platform default was not applied');
      assert.equal(
        (after.match(/Artifact Governance Taxonomy/g) || []).length,
        1,
        'the managed header was duplicated'
      );
      // Still valid YAML with the expected shape.
      const parsed = yaml.load(after);
      assert.ok(Array.isArray(parsed.initiatives.user));
      assert.ok(parsed.initiatives.user.includes('my-custom-initiative'));
    } finally {
      await fs.remove(dir);
    }
  });

  // ── Review 2026-08-15: the I140 rewrite regressed on operator-plausible YAML ──────────
  //
  // Mutating a parsed Document assumed every key it touched resolved to a collection. `has`/
  // `hasIn` return TRUE for a key holding null or a scalar, so the repair branch was skipped and
  // `.toJSON()` was called on a Scalar. Five shapes threw that the previous `yaml.dump(existing)`
  // path handled — js-yaml normalisation repaired them. The throw is caught by
  // refreshInstallation, so an install "succeeds" while the taxonomy is never merged again.

  const MALFORMED = {
    'user held null': 'initiatives:\n  platform: [vortex]\n  user:\nartifact_types: [prd]\naliases: {}\n',
    'platform a scalar': 'initiatives:\n  platform: vortex\n  user: [keep-me]\nartifact_types: [prd]\naliases: {}\n',
    'artifact_types null': 'initiatives:\n  platform: [vortex]\n  user: [keep-me]\nartifact_types:\naliases: {}\n',
    'initiatives null': 'initiatives:\nartifact_types: [prd]\naliases: {}\n',
    'aliases a list': 'initiatives:\n  platform: [vortex]\n  user: [keep-me]\nartifact_types: [prd]\naliases:\n  - a\n',
  };

  for (const [label, content] of Object.entries(MALFORMED)) {
    it(`I140 review: does not throw when ${label}`, async () => {
      const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'convoke-tax-mal-'));
      try {
        await fs.ensureDir(path.join(dir, '_bmad', '_config'));
        const file = path.join(dir, '_bmad', '_config', 'taxonomy.yaml');
        await fs.writeFile(file, content, 'utf8');

        await mergeTaxonomy(dir); // must not throw
        const parsed = yaml.load(await fs.readFile(file, 'utf8'));
        assert.ok(Array.isArray(parsed.initiatives.platform), 'platform was not repaired to a list');
        assert.ok(Array.isArray(parsed.initiatives.user), 'user was not repaired to a list');
        assert.ok(Array.isArray(parsed.artifact_types), 'artifact_types was not repaired to a list');
        assert.equal(typeof parsed.aliases, 'object', 'aliases was not repaired to a map');
        if (content.includes('keep-me')) {
          assert.ok(parsed.initiatives.user.includes('keep-me'), 'operator entry was dropped during repair');
        }
      } finally {
        await fs.remove(dir);
      }
    });
  }

  it('I140 review: an unreadable taxonomy.yaml is preserved, not silently overwritten', async () => {
    // js-yaml throws on an unknown local tag while YAML.parseDocument reports no errors, so
    // "is this file OK?" must not be re-derived from the more permissive parser. The rewrite
    // discards operator content, so the original is salvaged beside it first
    // (`path-safety-for-destructive-ops`).
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'convoke-tax-bad-'));
    try {
      await fs.ensureDir(path.join(dir, '_bmad', '_config'));
      const file = path.join(dir, '_bmad', '_config', 'taxonomy.yaml');
      await fs.writeFile(
        file,
        'initiatives:\n  platform: [vortex]\n  user: [my-precious]\nartifact_types: [prd]\naliases: {}\ncustom: !mytag foo\n',
        'utf8'
      );

      await mergeTaxonomy(dir);

      const files = await fs.readdir(path.join(dir, '_bmad', '_config'));
      const salvaged = files.filter((f) => f.includes('unreadable'));
      assert.equal(salvaged.length, 1, `original was not preserved; files: ${files.join(', ')}`);
      const original = await fs.readFile(path.join(dir, '_bmad', '_config', salvaged[0]), 'utf8');
      assert.match(original, /my-precious/, 'the salvaged copy does not contain the operator data');
    } finally {
      await fs.remove(dir);
    }
  });

  it('I140 review: an aliased user list does not grow the file on every run', async () => {
    // `user: *p` aliasing platform made every platform id look promoted on every run while
    // deleteIn removed nothing — measured 858 -> 1259 -> 1659 bytes across three runs.
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'convoke-tax-alias-'));
    try {
      await fs.ensureDir(path.join(dir, '_bmad', '_config'));
      const file = path.join(dir, '_bmad', '_config', 'taxonomy.yaml');
      await fs.writeFile(
        file,
        'initiatives:\n  platform: &p [vortex]\n  user: *p\nartifact_types: [prd]\naliases: {}\n',
        'utf8'
      );

      const sizes = [];
      for (let i = 0; i < 3; i++) {
        await mergeTaxonomy(dir);
        sizes.push((await fs.stat(file)).size);
      }
      assert.equal(sizes[1], sizes[2], `file is still growing across runs: ${sizes.join(' -> ')}`);
    } finally {
      await fs.remove(dir);
    }
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
