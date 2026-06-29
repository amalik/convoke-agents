// BUG-8 / audit HIGH-2 (+ #3): migration rollback must restore the files the
// migration rewrites — manifest-driven, path-mirrored, best-effort, with a
// delete-on-rollback class for migration-created state. (test-fixture-isolation)
const { describe, it, before, after, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const fs = require('fs-extra');
const os = require('os');

const backupManager = require('../../scripts/update/lib/backup-manager');
const migration = require('../../scripts/update/migrations/3.3.x-to-4.0.0');

// Silence console (matches backup-manager.test.js — avoids node:test IPC noise)
const _log = console.log, _warn = console.warn, _error = console.error;
before(() => { console.log = console.warn = console.error = () => {}; });
after(() => { console.log = _log; console.warn = _warn; console.error = _error; });

describe('backup-manager rollback scope (BUG-8)', () => {
  let root;
  beforeEach(async () => {
    root = await fs.mkdtemp(path.join(os.tmpdir(), 'bug8-'));
    await fs.ensureDir(path.join(root, '_bmad-output')); // required for backup dir
  });
  afterEach(async () => { await fs.remove(root); });

  it('path-mirrors dynamic entries so files sharing a basename do not collide (hardening #1)', async () => {
    // Two distinct files both named SKILL.md.
    const a = '_bmad/bmm/x/SKILL.md';
    const b = '_bmad/cis/y/SKILL.md';
    await fs.outputFile(path.join(root, a), 'ORIGINAL A');
    await fs.outputFile(path.join(root, b), 'ORIGINAL B');

    const meta = await backupManager.createBackup('4.0.0', root, [
      { relPath: a, type: 'file', onRollback: 'restore' },
      { relPath: b, type: 'file', onRollback: 'restore' }
    ]);

    // Both must be recorded (no flat-name clobber) and stored under distinct paths.
    const stored = meta.backup_entries.filter((e) => e.onRollback === 'restore').map((e) => e.storedAt);
    assert.equal(new Set(stored).size, stored.length, 'storedAt paths must be unique (no collision)');

    // Simulate the migration rewriting both, then roll back.
    await fs.outputFile(path.join(root, a), 'REWRITTEN A');
    await fs.outputFile(path.join(root, b), 'REWRITTEN B');
    await backupManager.restoreBackup(meta, root);

    assert.equal(await fs.readFile(path.join(root, a), 'utf8'), 'ORIGINAL A');
    assert.equal(await fs.readFile(path.join(root, b), 'utf8'), 'ORIGINAL B', 'second SKILL.md must not be clobbered');
  });

  it('deletes a delete-class (migration-created) file on rollback (absorbs audit #3)', async () => {
    const stateRel = '_bmad/_memory/migration-state-4.0.yaml';
    const meta = await backupManager.createBackup('4.0.0', root, [
      { relPath: stateRel, type: 'file', onRollback: 'delete' }
    ]);
    // The migration creates the state file during apply().
    await fs.outputFile(path.join(root, stateRel), 'phase5_complete: true\n');

    await backupManager.restoreBackup(meta, root);

    assert.equal(fs.existsSync(path.join(root, stateRel)), false, 'state file must be removed on rollback');
  });

  it('is best-effort: one bad entry does not strand the rest, and the failure is reported (hardening #3)', async () => {
    const good = '_bmad/bmm/keep/SKILL.md';
    await fs.outputFile(path.join(root, good), 'ORIGINAL');
    const meta = await backupManager.createBackup('4.0.0', root, [
      { relPath: good, type: 'file', onRollback: 'restore' }
    ]);
    // Inject a path-escaping entry that restore must refuse without aborting.
    meta.backup_entries.push({ relPath: '../escape.txt', type: 'file', onRollback: 'restore', storedAt: 'tree/escape.txt' });

    await fs.outputFile(path.join(root, good), 'REWRITTEN');
    await assert.rejects(
      () => backupManager.restoreBackup(meta, root),
      /Restore incomplete/,
      'should throw an aggregated error naming the unrestored entry'
    );
    // ...but the good file was still restored.
    assert.equal(await fs.readFile(path.join(root, good), 'utf8'), 'ORIGINAL');
  });

  it('refuses delete-class targets outside _bmad/_memory/ (path-safety)', async () => {
    const meta = await backupManager.createBackup('4.0.0', root, []);
    meta.backup_entries.push({ relPath: '_bmad/bme/_vortex/config.yaml', type: 'file', onRollback: 'delete' });
    await fs.outputFile(path.join(root, '_bmad/bme/_vortex/config.yaml'), 'keep me');

    await assert.rejects(() => backupManager.restoreBackup(meta, root), /Restore incomplete/);
    assert.equal(fs.existsSync(path.join(root, '_bmad/bme/_vortex/config.yaml')), true, 'must NOT delete outside _memory');
  });

  it('back-compat: an old manifest without backup_entries restores the legacy static set', async () => {
    await fs.outputFile(path.join(root, '_bmad/bme/_vortex/config.yaml'), 'ORIGINAL');
    const meta = await backupManager.createBackup('4.0.0', root, []);
    delete meta.backup_entries; // simulate a pre-BUG-8 manifest
    await fs.outputFile(path.join(root, '_bmad/bme/_vortex/config.yaml'), 'REWRITTEN');

    await backupManager.restoreBackup(meta, root);
    assert.equal(await fs.readFile(path.join(root, '_bmad/bme/_vortex/config.yaml'), 'utf8'), 'ORIGINAL');
  });
});

describe('3.3.x-to-4.0.0 getBackupManifest (BUG-8 hardening #2 — single source)', () => {
  let root;
  const HEADER = 'file,module_config_path,module,agent_name,pattern_matched,candidate_status';
  const writeInventory = async (files) => {
    const rows = files.map((f) => `${f},mod,mod,agent,marker,canonical`).join('\n');
    await fs.outputFile(path.join(root, '_bmad/_config/v6.3-migration-inventory.csv'), `${HEADER}\n${rows}\n`);
  };

  before(async () => { root = await fs.mkdtemp(path.join(os.tmpdir(), 'bug8-mani-')); });
  after(async () => { await fs.remove(root); });

  it('derives the restore set from the same inventory CSV _phase3 sweeps, plus bmad-init + state file', async () => {
    await writeInventory(['_bmad/bmm/a/SKILL.md', '_bmad/cis/b/SKILL.md']);
    const entries = migration.getBackupManifest(root);

    const restorePaths = entries.filter((e) => e.onRollback === 'restore').map((e) => e.relPath);
    assert.ok(restorePaths.includes('_bmad/bmm/a/SKILL.md'));
    assert.ok(restorePaths.includes('_bmad/cis/b/SKILL.md'));
    assert.ok(restorePaths.includes('_bmad/core/bmad-init/SKILL.md'), 'phase-4 bmad-init must be backed up');

    const del = entries.filter((e) => e.onRollback === 'delete');
    assert.equal(del.length, 1);
    assert.equal(del[0].relPath, '_bmad/_memory/migration-state-4.0.yaml', 'phase-5 state file is delete-class (audit #3)');
  });

  it('tracks the CSV as the single source — adding a row grows the backup set (hardening #2)', async () => {
    await writeInventory(['_bmad/m/one/SKILL.md']);
    const before = migration.getBackupManifest(root).filter((e) => e.onRollback === 'restore').length;
    await writeInventory(['_bmad/m/one/SKILL.md', '_bmad/m/two/SKILL.md']);
    const after = migration.getBackupManifest(root).filter((e) => e.onRollback === 'restore').length;
    assert.equal(after, before + 1, 'a new inventory row must appear in the backup set');
  });
});
