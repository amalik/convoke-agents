const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const fs = require('fs-extra');
const os = require('os');
const yaml = require('js-yaml');

const backupManager = require('../../scripts/update/lib/backup-manager');

// Silence console output during tests to prevent node:test IPC serialization
// issues on Node 20 (V8 structured clone deserialization bug)
const _log = console.log;
const _warn = console.warn;
const _error = console.error;
before(() => { console.log = console.warn = console.error = () => {}; });
after(() => { console.log = _log; console.warn = _warn; console.error = _error; });

describe('createBackup — the configs a refresh overwrites (T234)', () => {
  // A refresh replaces `_enhance`, `_artifacts` and `_portability` configs wholesale from the
  // package template, losing operator values (T221), and `convoke-update` promises "Your data
  // will be backed up automatically" before asking for consent. Until T234 these three were not
  // in the backup set, so that promise was false and the loss unrecoverable. All three basenames
  // are `config.yaml`, so they are stored path-mirrored under `tree/`; a flat name would clobber
  // `_vortex`'s, which is the BUG-8 hazard `_normalizeBackupEntries` documents.
  const MODULES = ['_enhance', '_artifacts', '_portability'];
  let tmpDir;

  before(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'bmad-backup-t234-'));
    const vortexDir = path.join(tmpDir, '_bmad/bme/_vortex');
    await fs.ensureDir(path.join(vortexDir, 'agents'));
    await fs.ensureDir(path.join(vortexDir, 'workflows'));
    await fs.writeFile(path.join(vortexDir, 'config.yaml'), yaml.dump({ version: '1.3.0', keep: 'vortex' }));
    for (const m of MODULES) {
      await fs.ensureDir(path.join(tmpDir, '_bmad/bme', m));
      await fs.writeFile(path.join(tmpDir, '_bmad/bme', m, 'config.yaml'), yaml.dump({ version: '1.3.0', keep: m }));
    }
    await fs.ensureDir(path.join(tmpDir, '_bmad-output'));
    await fs.ensureDir(path.join(tmpDir, '_bmad/_config'));
    await fs.writeFile(path.join(tmpDir, '_bmad/_config/agent-manifest.csv'), 'header\nrow1');
  });

  after(async () => { await fs.remove(tmpDir); });

  it('backs up each overwritten config, and no basename clobbers another', async () => {
    const metadata = await backupManager.createBackup('1.3.0', tmpDir);
    for (const m of MODULES) {
      const stored = path.join(metadata.backup_dir, 'tree/_bmad/bme', m, 'config.yaml');
      assert.ok(fs.existsSync(stored), `${m}/config.yaml must be in the backup`);
      assert.match(await fs.readFile(stored, 'utf8'), new RegExp(`keep: ${m}`), `${m}'s own content, not another module's`);
    }
    // The pre-existing flat entry must still hold Vortex's, not a later module's.
    assert.match(await fs.readFile(path.join(metadata.backup_dir, 'config.yaml'), 'utf8'), /keep: vortex/);
  });

  it('restores them, so the loss is recoverable rather than merely recorded', async () => {
    const metadata = await backupManager.createBackup('1.3.0', tmpDir);
    for (const m of MODULES) {
      await fs.writeFile(path.join(tmpDir, '_bmad/bme', m, 'config.yaml'), yaml.dump({ version: '9.9.9' }));
    }
    await backupManager.restoreBackup(metadata, tmpDir);
    for (const m of MODULES) {
      const body = await fs.readFile(path.join(tmpDir, '_bmad/bme', m, 'config.yaml'), 'utf8');
      assert.match(body, new RegExp(`keep: ${m}`), `${m}'s value must come back`);
    }
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
