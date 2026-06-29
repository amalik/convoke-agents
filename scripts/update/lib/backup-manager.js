#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');
const { countUserDataFiles } = require('./utils');

/**
 * Backup Manager for Convoke
 * Creates backups before migrations and restores on failure
 */

/**
 * Create a backup of critical installation files
 * @param {string} version - Current version being backed up
 * @param {string} projectRoot - Absolute path to project root
 * @returns {Promise<object>} Backup metadata
 */
async function createBackup(version, projectRoot, extraEntries = []) {
  const timestamp = Date.now();
  const backupDir = path.join(
    projectRoot,
    '_bmad-output/.backups',
    `backup-${version}-${timestamp}`
  );

  console.log(`Creating backup in: ${backupDir}`);

  // Ensure backup directory exists
  await ensureBackupDirectory(projectRoot);

  // Create backup directory
  await fs.ensureDir(backupDir);

  // Unify the fixed install-file set with any migration-declared write-set
  // (BUG-8): dynamic entries are path-mirrored under tree/ so files sharing a
  // basename (e.g. many SKILL.md) never collide in the flat backup dir.
  const entries = _normalizeBackupEntries(getFilesToBackup(), extraEntries);
  const backedUpFiles = [];
  const backupEntries = [];

  for (const entry of entries) {
    // delete-class: the migration CREATES this file, so there is nothing to
    // copy now — record it so rollback can remove it (audit #3, e.g. the
    // migration-state file).
    if (entry.onRollback === 'delete') {
      backupEntries.push({ relPath: entry.relPath, type: entry.type, onRollback: 'delete' });
      continue;
    }

    const sourcePath = path.join(projectRoot, entry.relPath);

    if (!fs.existsSync(sourcePath)) {
      console.log(`  Skipping ${entry.relPath} (does not exist)`);
      continue;
    }

    const destPath = path.join(backupDir, entry.storedAt);

    try {
      await fs.copy(sourcePath, destPath);
      backedUpFiles.push(entry.relPath);
      backupEntries.push({
        relPath: entry.relPath,
        type: entry.type,
        onRollback: 'restore',
        storedAt: entry.storedAt
      });
      console.log(`  ✓ Backed up: ${entry.relPath}`);
    } catch (error) {
      console.error(`  ✗ Failed to backup ${entry.relPath}:`, error.message);
      throw error;
    }
  }

  // Count user data files (for integrity check)
  const userDataCount = await countUserDataFiles(projectRoot);

  // Create backup manifest. `backup_entries` is the rollback source of truth
  // (BUG-8); `files_backed_up` is retained for back-compat / logging.
  const manifest = {
    version,
    timestamp: new Date().toISOString(),
    timestampMs: timestamp,
    files_backed_up: backedUpFiles,
    backup_entries: backupEntries,
    user_data_count: userDataCount,
    backup_dir: backupDir
  };

  await fs.writeJson(path.join(backupDir, 'backup-manifest.json'), manifest, { spaces: 2 });

  console.log(`  ✓ Backup manifest created`);
  console.log(`  ✓ Backup complete: ${backedUpFiles.length} items backed up`);

  return manifest;
}

/**
 * Normalize backup targets into one internal shape.
 * Static install files keep their flat `storedAt` name (preserves the existing
 * backup layout); migration-declared entries are path-mirrored under `tree/`
 * so files that share a basename never clobber each other (BUG-8 hardening #1).
 * @param {Array} staticFiles - from getFilesToBackup()
 * @param {Array} extraEntries - [{ relPath, type?, onRollback? }] from a migration's getBackupManifest()
 * @returns {Array} [{ relPath, type, onRollback, storedAt }]
 */
function _normalizeBackupEntries(staticFiles, extraEntries) {
  const entries = staticFiles.map((f) => ({
    relPath: f.path,
    type: f.type,
    onRollback: 'restore',
    storedAt: f.name
  }));

  for (const e of extraEntries || []) {
    const relPath = String(e.relPath).replace(/\\/g, '/');
    entries.push({
      relPath,
      type: e.type || 'file',
      onRollback: e.onRollback === 'delete' ? 'delete' : 'restore',
      storedAt: `tree/${relPath}`
    });
  }

  return entries;
}

/**
 * Restore from backup after migration failure
 * @param {object} backupMetadata - Metadata from createBackup
 * @param {string} projectRoot - Absolute path to project root
 * @returns {Promise<void>}
 */
async function restoreBackup(backupMetadata, projectRoot) {
  const backupDir = backupMetadata.backup_dir;

  console.log('');
  console.log(`Restoring from backup: ${backupDir}`);

  if (!fs.existsSync(backupDir)) {
    throw new Error(`Backup directory not found: ${backupDir}`);
  }

  // Manifest-driven (BUG-8): restore exactly what was backed up. Fall back to
  // the legacy static list for backups created before backup_entries existed.
  const entries = Array.isArray(backupMetadata.backup_entries)
    ? backupMetadata.backup_entries
    : getFilesToBackup().map((f) => ({
        relPath: f.path, type: f.type, onRollback: 'restore', storedAt: f.name
      }));

  // Best-effort (hardening #3): attempt every entry, collect failures, and
  // throw an aggregated error at the end so one bad entry never strands the rest.
  const failures = [];
  const rootResolved = path.resolve(projectRoot);

  for (const entry of entries) {
    const relPath = String(entry.relPath).replace(/\\/g, '/');
    const destPath = path.resolve(projectRoot, relPath);

    // path-safety: never touch anything outside projectRoot.
    if (destPath !== rootResolved && !destPath.startsWith(rootResolved + path.sep)) {
      console.error(`  ✗ Refusing ${relPath} — resolves outside project root`);
      failures.push({ relPath, reason: 'escapes projectRoot' });
      continue;
    }

    try {
      if (entry.onRollback === 'delete') {
        // The migration created this file; rollback removes it (audit #3).
        // Extra guard: only ever delete inside _bmad/_memory/.
        if (!relPath.startsWith('_bmad/_memory/')) {
          console.error(`  ✗ Refusing to delete ${relPath} — outside _bmad/_memory/`);
          failures.push({ relPath, reason: 'delete target outside _memory' });
          continue;
        }
        if (fs.existsSync(destPath)) {
          await fs.remove(destPath);
          console.log(`  ✓ Removed (rollback): ${relPath}`);
        }
        continue;
      }

      // restore-class
      const sourcePath = path.join(backupDir, entry.storedAt);
      if (!fs.existsSync(sourcePath)) {
        console.log(`  Skipping ${relPath} (not in backup)`);
        continue;
      }
      if (fs.existsSync(destPath)) {
        await fs.remove(destPath);
      }
      await fs.copy(sourcePath, destPath);
      console.log(`  ✓ Restored: ${relPath}`);
    } catch (error) {
      console.error(`  ✗ Failed to restore ${relPath}:`, error.message);
      failures.push({ relPath, reason: error.message });
    }
  }

  if (failures.length > 0) {
    const list = failures.map((f) => `${f.relPath} (${f.reason})`).join(', ');
    throw new Error(
      `Restore incomplete — ${failures.length} entr${failures.length === 1 ? 'y' : 'ies'} not restored: ${list}`
    );
  }

  console.log(`  ✓ Restoration complete`);
}

/**
 * List available backups
 * @param {string} projectRoot - Absolute path to project root
 * @returns {Promise<Array>} List of backup metadata
 */
async function listBackups(projectRoot) {
  const backupsDir = path.join(projectRoot, '_bmad-output/.backups');

  if (!fs.existsSync(backupsDir)) {
    return [];
  }

  const entries = await fs.readdir(backupsDir);
  const backups = [];

  for (const entry of entries) {
    const backupPath = path.join(backupsDir, entry);
    const manifestPath = path.join(backupPath, 'backup-manifest.json');

    if (fs.existsSync(manifestPath)) {
      try {
        const manifest = await fs.readJson(manifestPath);
        backups.push(manifest);
      } catch (error) {
        console.warn(`Could not read manifest for ${entry}:`, error.message);
      }
    }
  }

  // Sort by timestamp (newest first)
  backups.sort((a, b) => b.timestampMs - a.timestampMs);

  return backups;
}

/**
 * Clean up old backups, keeping only the most recent N
 * @param {number} keepCount - Number of backups to keep
 * @param {string} projectRoot - Absolute path to project root
 * @returns {Promise<number>} Number of backups deleted
 */
async function cleanupOldBackups(keepCount = 5, projectRoot) {
  const backups = await listBackups(projectRoot);

  if (backups.length <= keepCount) {
    return 0; // Nothing to clean up
  }

  const toDelete = backups.slice(keepCount);
  let deletedCount = 0;

  for (const backup of toDelete) {
    try {
      await fs.remove(backup.backup_dir);
      console.log(`  Deleted old backup: ${path.basename(backup.backup_dir)}`);
      deletedCount++;
    } catch (error) {
      console.warn(`  Could not delete backup ${backup.backup_dir}:`, error.message);
    }
  }

  return deletedCount;
}

/**
 * Ensure backup directory exists
 * @param {string} projectRoot - Absolute path to project root
 * @returns {Promise<void>}
 */
async function ensureBackupDirectory(projectRoot) {
  const backupDir = path.join(projectRoot, '_bmad-output/.backups');

  if (!fs.existsSync(backupDir)) {
    const outputDir = path.join(projectRoot, '_bmad-output');

    if (!fs.existsSync(outputDir)) {
      throw new Error('_bmad-output directory not found. Is BMAD Method installed?');
    }

    await fs.ensureDir(backupDir);
  }
}

/**
 * Get list of files/directories to backup
 * @returns {Array} List of file/directory definitions
 */
function getFilesToBackup() {
  return [
    {
      name: 'config.yaml',
      path: '_bmad/bme/_vortex/config.yaml',
      type: 'file'
    },
    {
      name: 'agents',
      path: '_bmad/bme/_vortex/agents',
      type: 'directory'
    },
    {
      name: 'workflows',
      path: '_bmad/bme/_vortex/workflows',
      type: 'directory'
    },
    {
      name: 'agent-manifest.csv',
      path: '_bmad/_config/agent-manifest.csv',
      type: 'file'
    }
  ];
}

module.exports = {
  createBackup,
  restoreBackup,
  listBackups,
  cleanupOldBackups,
  ensureBackupDirectory
};
