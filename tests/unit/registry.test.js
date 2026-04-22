const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const fs = require('fs-extra');
const os = require('os');

const registry = require('../../scripts/update/migrations/registry');

describe('matchesVersionRange', () => {
  it('matches exact version', () => {
    assert.equal(registry.matchesVersionRange('1.0.5', '1.0.5'), true);
  });

  it('matches wildcard pattern', () => {
    assert.equal(registry.matchesVersionRange('1.0.5', '1.0.x'), true);
    assert.equal(registry.matchesVersionRange('1.0.0', '1.0.x'), true);
  });

  it('rejects non-matching wildcard', () => {
    assert.equal(registry.matchesVersionRange('1.1.0', '1.0.x'), false);
    assert.equal(registry.matchesVersionRange('2.0.0', '1.0.x'), false);
  });

  it('rejects non-matching exact version', () => {
    assert.equal(registry.matchesVersionRange('1.0.6', '1.0.5'), false);
  });
});

describe('parseTargetVersion', () => {
  it('parses standard migration names', () => {
    assert.equal(registry.parseTargetVersion('1.0.x-to-1.3.0'), '1.3.0');
    assert.equal(registry.parseTargetVersion('1.5.x-to-1.6.0'), '1.6.0');
    assert.equal(registry.parseTargetVersion('1.7.x-to-2.0.0'), '2.0.0');
    assert.equal(registry.parseTargetVersion('2.0.x-to-3.1.0'), '3.1.0');
  });

  it('returns null for unparseable names', () => {
    assert.equal(registry.parseTargetVersion('no-version-here'), null);
    assert.equal(registry.parseTargetVersion(''), null);
  });
});

describe('getMigrationsFor', () => {
  it('returns correct entry point for each starting version', () => {
    assert.equal(registry.getMigrationsFor('1.0.5')[0].name, '1.0.x-to-1.3.0');
    assert.equal(registry.getMigrationsFor('1.1.3')[0].name, '1.1.x-to-1.3.0');
    assert.equal(registry.getMigrationsFor('1.2.0')[0].name, '1.2.x-to-1.3.0');
    assert.equal(registry.getMigrationsFor('1.3.8')[0].name, '1.3.x-to-1.5.0');
    assert.equal(registry.getMigrationsFor('1.4.1')[0].name, '1.4.x-to-1.5.0');
    assert.equal(registry.getMigrationsFor('1.5.2')[0].name, '1.5.x-to-1.6.0');
    assert.equal(registry.getMigrationsFor('1.6.0')[0].name, '1.6.x-to-1.7.0');
    assert.equal(registry.getMigrationsFor('1.7.1')[0].name, '1.7.x-to-2.0.0');
  });

  it('returns empty for unknown future version', () => {
    const migrations = registry.getMigrationsFor('99.0.0');
    assert.equal(migrations.length, 0);
  });

  it('returns empty for future version beyond all migrations', () => {
    const migrations = registry.getMigrationsFor('99.0.1');
    assert.equal(migrations.length, 0);
  });
});

describe('getMigrationsFor - chain traversal', () => {
  // Note: Story 1A.4 (v6.3 direct-load migration) extends every chain from any
  // 3.x entry to 4.0.0. Users from 1.x/2.x chain through 2.0.x-to-3.1.0 →
  // targets 3.1.0 → first match is `3.1.x-to-4.0.0` (added by Story 1A.4).
  it('chains from 1.0.5 through to 4.0.0', () => {
    const migrations = registry.getMigrationsFor('1.0.5');
    const names = migrations.map(m => m.name);
    assert.deepEqual(names, [
      '1.0.x-to-1.3.0',
      '1.3.x-to-1.5.0',
      '1.5.x-to-1.6.0',
      '1.6.x-to-1.7.0',
      '1.7.x-to-2.0.0',
      '2.0.x-to-3.1.0',
      '3.1.x-to-4.0.0',
    ]);
  });

  it('chains from 1.1.3 through to 4.0.0', () => {
    const migrations = registry.getMigrationsFor('1.1.3');
    const names = migrations.map(m => m.name);
    assert.deepEqual(names, [
      '1.1.x-to-1.3.0',
      '1.3.x-to-1.5.0',
      '1.5.x-to-1.6.0',
      '1.6.x-to-1.7.0',
      '1.7.x-to-2.0.0',
      '2.0.x-to-3.1.0',
      '3.1.x-to-4.0.0',
    ]);
  });

  it('chains from 1.3.7 through to 4.0.0', () => {
    const migrations = registry.getMigrationsFor('1.3.7');
    const names = migrations.map(m => m.name);
    assert.deepEqual(names, [
      '1.3.x-to-1.5.0',
      '1.5.x-to-1.6.0',
      '1.6.x-to-1.7.0',
      '1.7.x-to-2.0.0',
      '2.0.x-to-3.1.0',
      '3.1.x-to-4.0.0',
    ]);
  });

  it('chains from 1.5.2 through to 4.0.0', () => {
    const migrations = registry.getMigrationsFor('1.5.2');
    const names = migrations.map(m => m.name);
    assert.deepEqual(names, [
      '1.5.x-to-1.6.0',
      '1.6.x-to-1.7.0',
      '1.7.x-to-2.0.0',
      '2.0.x-to-3.1.0',
      '3.1.x-to-4.0.0',
    ]);
  });

  it('chains from 1.6.0 through to 4.0.0', () => {
    const migrations = registry.getMigrationsFor('1.6.0');
    const names = migrations.map(m => m.name);
    assert.deepEqual(names, [
      '1.6.x-to-1.7.0',
      '1.7.x-to-2.0.0',
      '2.0.x-to-3.1.0',
      '3.1.x-to-4.0.0',
    ]);
  });

  it('chains from 1.7.1 through to 4.0.0', () => {
    const migrations = registry.getMigrationsFor('1.7.1');
    const names = migrations.map(m => m.name);
    assert.deepEqual(names, [
      '1.7.x-to-2.0.0',
      '2.0.x-to-3.1.0',
      '3.1.x-to-4.0.0',
    ]);
  });

  it('chains from 2.0.1 through to 4.0.0', () => {
    const migrations = registry.getMigrationsFor('2.0.1');
    const names = migrations.map(m => m.name);
    assert.deepEqual(names, ['2.0.x-to-3.1.0', '3.1.x-to-4.0.0']);
  });

  it('chains from 3.0.4 through to 4.0.0 (parallel entry for 3.0.x users)', () => {
    const migrations = registry.getMigrationsFor('3.0.4');
    const names = migrations.map(m => m.name);
    // Walker finds `3.0.x-to-3.1.0` first (older entry wins), targets 3.1.0,
    // then hits `3.1.x-to-4.0.0` added by Story 1A.4.
    assert.deepEqual(names, ['3.0.x-to-3.1.0', '3.1.x-to-4.0.0']);
  });
});

describe('getMigrationsFor - parallel entry exclusion', () => {
  it('1.1.3 does not include 1.0.x or 1.2.x parallel entries', () => {
    const migrations = registry.getMigrationsFor('1.1.3');
    const names = migrations.map(m => m.name);
    assert.ok(!names.includes('1.0.x-to-1.3.0'), 'should not include 1.0.x-to-1.3.0');
    assert.ok(!names.includes('1.2.x-to-1.3.0'), 'should not include 1.2.x-to-1.3.0');
  });

  it('1.0.5 does not include 1.1.x or 1.2.x parallel entries', () => {
    const migrations = registry.getMigrationsFor('1.0.5');
    const names = migrations.map(m => m.name);
    assert.ok(!names.includes('1.1.x-to-1.3.0'), 'should not include 1.1.x-to-1.3.0');
    assert.ok(!names.includes('1.2.x-to-1.3.0'), 'should not include 1.2.x-to-1.3.0');
  });

  it('1.4.1 does not include 1.3.x parallel entry', () => {
    const migrations = registry.getMigrationsFor('1.4.1');
    const names = migrations.map(m => m.name);
    assert.ok(!names.includes('1.3.x-to-1.5.0'), 'should not include 1.3.x-to-1.5.0');
    assert.equal(names[0], '1.4.x-to-1.5.0');
  });
});

describe('getBreakingChanges', () => {
  // Story 1A.4 adds breaking `3.x-to-4.0.0` entries — every 1.x/2.x/3.x chain
  // now picks up the 4.0 breaking change on the tail.
  it('returns breaking changes for 1.0.x (1.0.x-to-1.3.0 + 1.7.x-to-2.0.0 + 3.1.x-to-4.0.0)', () => {
    const changes = registry.getBreakingChanges('1.0.5');
    assert.equal(changes.length, 3);
  });

  it('returns breaking changes for 1.1.x (1.7.x-to-2.0.0 + 3.1.x-to-4.0.0)', () => {
    const changes = registry.getBreakingChanges('1.1.0');
    assert.equal(changes.length, 2);
    assert.ok(changes.some(c => c.includes('Product rename')));
    assert.ok(changes.some(c => c.includes('v6.3 direct-load')));
  });

  it('returns breaking changes for 1.5.x (1.7.x-to-2.0.0 + 3.1.x-to-4.0.0)', () => {
    const changes = registry.getBreakingChanges('1.5.2');
    assert.equal(changes.length, 2);
    assert.ok(changes.some(c => c.includes('Product rename')));
    assert.ok(changes.some(c => c.includes('v6.3 direct-load')));
  });

  it('returns empty for future version beyond all migrations', () => {
    const changes = registry.getBreakingChanges('99.0.1');
    assert.equal(changes.length, 0);
  });
});

describe('getAllMigrations', () => {
  it('returns a copy of all migrations', () => {
    const all = registry.getAllMigrations();
    assert.ok(Array.isArray(all));
    assert.ok(all.length >= 8);
    // Verify it is a copy
    all.push({ name: 'fake' });
    assert.ok(registry.getAllMigrations().length < all.length);
  });
});

describe('hasMigrationBeenApplied', () => {
  let tmpDir;
  let configPath;

  before(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'convoke-reg-'));
    configPath = path.join(tmpDir, 'config.yaml');
  });

  after(async () => {
    await fs.remove(tmpDir);
  });

  it('returns false when config does not exist', () => {
    assert.equal(registry.hasMigrationBeenApplied('1.0.x-to-1.3.0', '/nonexistent/config.yaml'), false);
  });

  it('returns false when no migration_history', async () => {
    const yaml = require('js-yaml');
    await fs.writeFile(configPath, yaml.dump({ version: '1.3.0' }));
    assert.equal(registry.hasMigrationBeenApplied('1.0.x-to-1.3.0', configPath), false);
  });

  it('returns true when migration is in history', async () => {
    const yaml = require('js-yaml');
    const config = {
      version: '1.4.0',
      migration_history: [{
        timestamp: '2026-01-01T00:00:00Z',
        from_version: '1.0.5',
        to_version: '1.3.0',
        migrations_applied: ['1.0.x-to-1.3.0']
      }]
    };
    await fs.writeFile(configPath, yaml.dump(config));
    assert.equal(registry.hasMigrationBeenApplied('1.0.x-to-1.3.0', configPath), true);
  });

  it('returns false for migration not in history', async () => {
    assert.equal(registry.hasMigrationBeenApplied('1.1.x-to-1.3.0', configPath), false);
  });
});
