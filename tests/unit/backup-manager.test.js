const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const fs = require('fs-extra');
const os = require('os');
const yaml = require('js-yaml');

const backupManager = require('../../scripts/update/lib/backup-manager');
const { refreshInstallation } = require('../../scripts/update/lib/refresh-installation');

// Silence console output during tests to prevent node:test IPC serialization
// issues on Node 20 (V8 structured clone deserialization bug)
const _log = console.log;
const _warn = console.warn;
const _error = console.error;
before(() => { console.log = console.warn = console.error = () => {}; });
after(() => { console.log = _log; console.warn = _warn; console.error = _error; });

describe('createBackup — anything a refresh CHANGES has a copy (T234)', () => {
  // DERIVED, NOT LISTED, and that is the whole point of this test.
  //
  // `convoke-update` prints "Your data will be backed up automatically" immediately before the
  // consent prompt. Round 1 of the T234 review found a lost config KEY with no copy; the fix added
  // the three `config.yaml` files. Round 2 then found a lost operator FILE with no copy — the same
  // promise still false, because the fix had matched the instance the reviewer happened to send
  // instead of the class. Two hand-written lists had failed in a row, so this asserts the property
  // instead: plant a marker in every `_bmad/bme/*` module, take the backup the CLI promises, run a
  // real refresh, and require a copy of anything that vanished.
  //
  // A fourth module cannot be missed by forgetting to extend a list, and the failure names the
  // module. Dropping an entry from `getFilesToBackup()` reddens this with that module's own path.
  //
  // REMOVED *and* OVERWRITTEN, because the first version of this test checked removal only — the
  // half of the harm Round 2 had just demonstrated — and so dropping `_enhance` reddened nothing:
  // that module is a bare `fs.copy` with no `fs.remove`, so a planted file survives and only its
  // `config.yaml` is replaced. A derived pin can inherit the blind spot of the instance that
  // prompted it, which is the same mistake one level up.
  let dir;

  before(async () => {
    dir = await fs.mkdtemp(path.join(os.tmpdir(), 'bmad-backup-destroy-'));
    await fs.ensureDir(path.join(dir, '_bmad'));
    await fs.ensureDir(path.join(dir, '_bmad-output'));
    await refreshInstallation(dir, { verbose: false });
  });

  after(async () => { await fs.remove(dir); });

  it('every file the refresh removes is in the backup it just made', async () => {
    // PER DIRECTORY, not per module. T235: the first version of this pin planted one marker at each
    // `_bmad/bme/*` root, and nothing removes a module root — the destructive `fs.remove` calls are
    // on SUBTREES (`_vortex/contracts`, `_vortex/examples`, `_gyre/workflows/*`). So `_gyre`, the one
    // module with a destructive subtree and no backup entry of its own, was enumerated, never
    // entered the changed set, and was skipped. One marker per module root is still a hand-written
    // list, one level up. This walks every directory the installer owns.
    const bmeDir = path.join(dir, '_bmad/bme');
    const dirs = [];
    const walk = async (d) => {
      dirs.push(d);
      for (const e of await fs.readdir(d, { withFileTypes: true })) {
        if (e.isDirectory()) await walk(path.join(d, e.name));
      }
    };
    await walk(bmeDir);
    assert.ok(dirs.length >= 20, `fixture precondition: expected a populated module tree, saw ${dirs.length} directories`);

    for (const d of dirs) {
      await fs.writeFile(path.join(d, 'MARKER.md'), `operator content for ${path.relative(dir, d)}`, 'utf8');
    }

    const metadata = await backupManager.createBackup('4.0.3', dir);
    await refreshInstallation(dir, { verbose: false });

    const destroyed = [];
    const unprotected = [];
    for (const d of dirs) {
      const rel = path.relative(dir, d);
      if (await fs.pathExists(path.join(d, 'MARKER.md'))) continue; // survived
      destroyed.push(rel);
      if (!(await fs.pathExists(path.join(metadata.backup_dir, 'tree', rel, 'MARKER.md')))) {
        unprotected.push(rel);
      }
    }

    // Guards against passing because the refresh destroyed nothing.
    assert.ok(destroyed.length > 0, 'the refresh destroyed no operator file; this test would prove nothing');
    assert.deepEqual(unprotected, [], `a refresh destroyed operator files in ${unprotected.join(', ')} and the backup has no copy — the promise the CLI prints is false for them`);
  });

  it('restores a destroyed operator file, so the loss is recoverable and not merely recorded', async () => {
    const target = path.join(dir, '_bmad/bme/_artifacts/RESTORE-ME.md');
    await fs.writeFile(target, 'operator content', 'utf8');
    const metadata = await backupManager.createBackup('4.0.3', dir);
    await refreshInstallation(dir, { verbose: false });
    assert.equal(await fs.pathExists(target), false, 'precondition: the refresh must have removed it');
    await backupManager.restoreBackup(metadata, dir);
    assert.equal(await fs.readFile(target, 'utf8'), 'operator content');
  });
});

describe('createBackup', () => {
  let tmpDir;

  before(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'bmad-backup-'));

    // Set up a project structure
    const vortexDir = path.join(tmpDir, '_bmad/bme/_vortex');
    await fs.ensureDir(path.join(vortexDir, 'agents'));
    await fs.ensureDir(path.join(vortexDir, 'workflows'));
    await fs.writeFile(path.join(vortexDir, 'config.yaml'), yaml.dump({ version: '1.3.0' }));
    await fs.writeFile(path.join(vortexDir, 'agents/contextualization-expert.md'), '# Emma');
    await fs.writeFile(path.join(vortexDir, 'agents/lean-experiments-specialist.md'), '# Wade');

    // Create _bmad-output so backup directory can be created
    await fs.ensureDir(path.join(tmpDir, '_bmad-output'));

    // Create manifest
    await fs.ensureDir(path.join(tmpDir, '_bmad/_config'));
    await fs.writeFile(path.join(tmpDir, '_bmad/_config/agent-manifest.csv'), 'header\nrow1');
  });

  after(async () => {
    await fs.remove(tmpDir);
  });

  it('creates a backup directory with manifest', async () => {
    const metadata = await backupManager.createBackup('1.3.0', tmpDir);

    assert.ok(metadata.backup_dir, 'should have backup_dir');
    assert.ok(fs.existsSync(metadata.backup_dir), 'backup dir should exist');

    const manifestPath = path.join(metadata.backup_dir, 'backup-manifest.json');
    assert.ok(fs.existsSync(manifestPath), 'manifest should exist');

    const manifest = await fs.readJson(manifestPath);
    assert.equal(manifest.version, '1.3.0');
    assert.ok(manifest.files_backed_up.length > 0);
  });

  it('backs up config.yaml and agents', async () => {
    const metadata = await backupManager.createBackup('1.3.0', tmpDir);

    assert.ok(fs.existsSync(path.join(metadata.backup_dir, 'config.yaml')));
    assert.ok(fs.existsSync(path.join(metadata.backup_dir, 'agents')));
  });

  it('records user_data_count in manifest', async () => {
    const metadata = await backupManager.createBackup('1.3.0', tmpDir);
    assert.equal(typeof metadata.user_data_count, 'number');
  });
});

describe('restoreBackup', () => {
  let tmpDir;

  before(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'bmad-restore-'));

    // Set up project
    const vortexDir = path.join(tmpDir, '_bmad/bme/_vortex');
    await fs.ensureDir(path.join(vortexDir, 'agents'));
    await fs.ensureDir(path.join(vortexDir, 'workflows'));
    await fs.writeFile(path.join(vortexDir, 'config.yaml'), yaml.dump({ version: '1.3.0' }));
    await fs.writeFile(path.join(vortexDir, 'agents/contextualization-expert.md'), '# Emma Original');
    await fs.ensureDir(path.join(tmpDir, '_bmad-output'));
    await fs.ensureDir(path.join(tmpDir, '_bmad/_config'));
    await fs.writeFile(path.join(tmpDir, '_bmad/_config/agent-manifest.csv'), 'original');
  });

  after(async () => {
    await fs.remove(tmpDir);
  });

  it('restores files from backup after modification', async () => {
    // Create backup
    const metadata = await backupManager.createBackup('1.3.0', tmpDir);

    // Simulate a failed migration by modifying files
    const agentPath = path.join(tmpDir, '_bmad/bme/_vortex/agents/contextualization-expert.md');
    await fs.writeFile(agentPath, '# Emma CORRUPTED');

    // Restore
    await backupManager.restoreBackup(metadata, tmpDir);

    // Verify restoration
    const content = await fs.readFile(agentPath, 'utf8');
    assert.equal(content, '# Emma Original');
  });

  it('throws when backup directory does not exist', async () => {
    const fakeMetadata = { backup_dir: '/nonexistent/backup' };
    await assert.rejects(
      () => backupManager.restoreBackup(fakeMetadata, tmpDir),
      /Backup directory not found/
    );
  });
});

describe('listBackups', () => {
  let tmpDir;

  before(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'bmad-list-'));
  });

  after(async () => {
    await fs.remove(tmpDir);
  });

  it('returns empty array when no backups exist', async () => {
    const backups = await backupManager.listBackups(tmpDir);
    assert.deepEqual(backups, []);
  });

  it('lists backups sorted newest first', async () => {
    const backupsDir = path.join(tmpDir, '_bmad-output/.backups');

    // Create two fake backups
    const backup1Dir = path.join(backupsDir, 'backup-1.0.0-1000');
    const backup2Dir = path.join(backupsDir, 'backup-1.3.0-2000');
    await fs.ensureDir(backup1Dir);
    await fs.ensureDir(backup2Dir);

    await fs.writeJson(path.join(backup1Dir, 'backup-manifest.json'), {
      version: '1.0.0', timestampMs: 1000, backup_dir: backup1Dir
    });
    await fs.writeJson(path.join(backup2Dir, 'backup-manifest.json'), {
      version: '1.3.0', timestampMs: 2000, backup_dir: backup2Dir
    });

    const backups = await backupManager.listBackups(tmpDir);
    assert.equal(backups.length, 2);
    assert.equal(backups[0].version, '1.3.0'); // newest first
    assert.equal(backups[1].version, '1.0.0');
  });
});

describe('cleanupOldBackups', () => {
  let tmpDir;

  before(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'bmad-cleanup-'));
    const backupsDir = path.join(tmpDir, '_bmad-output/.backups');

    // Create 3 backups
    for (let i = 1; i <= 3; i++) {
      const dir = path.join(backupsDir, `backup-1.0.0-${i * 1000}`);
      await fs.ensureDir(dir);
      await fs.writeJson(path.join(dir, 'backup-manifest.json'), {
        version: '1.0.0', timestampMs: i * 1000, backup_dir: dir
      });
    }
  });

  after(async () => {
    await fs.remove(tmpDir);
  });

  it('returns 0 when under keepCount', async () => {
    const deleted = await backupManager.cleanupOldBackups(5, tmpDir);
    assert.equal(deleted, 0);
  });

  it('deletes oldest backups when over keepCount', async () => {
    const deleted = await backupManager.cleanupOldBackups(1, tmpDir);
    assert.equal(deleted, 2);

    const remaining = await backupManager.listBackups(tmpDir);
    assert.equal(remaining.length, 1);
  });
});

describe('ensureBackupDirectory', () => {
  let tmpDir;

  before(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'bmad-ensuredir-'));
  });

  after(async () => {
    await fs.remove(tmpDir);
  });

  it('throws when _bmad-output does not exist', async () => {
    await assert.rejects(
      () => backupManager.ensureBackupDirectory(tmpDir),
      /not found/
    );
  });

  it('creates .backups directory when _bmad-output exists', async () => {
    await fs.ensureDir(path.join(tmpDir, '_bmad-output'));
    await backupManager.ensureBackupDirectory(tmpDir);
    assert.ok(fs.existsSync(path.join(tmpDir, '_bmad-output/.backups')));
  });
});
