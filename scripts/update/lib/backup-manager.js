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
    // path-safety (BUG-8 review): reject empty / absolute / escaping / root-equal
    // relPaths at BACKUP time too, so we never read outside the project, never
    // write a `..` past the backup dir, and never record an unsafe entry to
    // restore. `sourcePath` is the validated absolute path == projectRoot/relPath.
    const sourcePath = _resolveContained(projectRoot, entry.relPath);
    if (!sourcePath) {
      console.warn(`  ⚠ Skipping unsafe backup entry: ${JSON.stringify(entry.relPath)}`);
      continue;
    }

    // delete-class: the migration CREATES this file, so there is nothing to
    // copy now — record it so rollback can remove it (audit #3, e.g. the
    // migration-state file).
    if (entry.onRollback === 'delete') {
      backupEntries.push({ relPath: entry.relPath, type: entry.type, onRollback: 'delete' });
      continue;
    }

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
    // Round-2 review: drop malformed entries rather than coerce a missing
    // relPath to the literal string "undefined".
    if (!e || typeof e.relPath !== 'string' || e.relPath.length === 0) continue;
    const relPath = e.relPath.replace(/\\/g, '/');
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
 * Resolve a relPath against projectRoot and confirm it stays strictly INSIDE
 * the project (BUG-8 review). Returns the absolute dest path, or null if the
 * relPath is empty, absolute, escapes via `..`, or equals the project root
 * itself (an empty inventory cell yields relPath '' → would target the whole
 * tree). One gate, used by both backup and restore, so the destructive paths
 * can never read/write/delete outside the project.
 * @param {string} projectRoot
 * @param {string} relPath
 * @returns {string|null} absolute contained path, or null if unsafe
 */
function _resolveContained(projectRoot, relPath) {
  if (!relPath || typeof relPath !== 'string') return null;
  const norm = relPath.replace(/\\/g, '/');
  if (path.isAbsolute(norm) || path.isAbsolute(relPath)) return null;
  // Round-2 review: reject Windows drive-letter / UNC forms that path.isAbsolute
  // does not catch on POSIX (e.g. `C:\x` → `C:/x`, `\\server\share` → `//server`).
  if (/^[A-Za-z]:/.test(norm) || norm.startsWith('//')) return null;
  const rootResolved = path.resolve(projectRoot);
  const dest = path.resolve(projectRoot, norm);
  if (dest === rootResolved || !dest.startsWith(rootResolved + path.sep)) return null;
  return dest;
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
  const memRootResolved = path.resolve(projectRoot, '_bmad/_memory');

  for (const entry of entries) {
    const relPath = String(entry.relPath).replace(/\\/g, '/');

    // path-safety (BUG-8 review): one containment gate — rejects empty,
    // absolute, `..`-escaping, AND project-root-equal relPaths (the last would
    // otherwise let an empty inventory cell delete the whole tree).
    const destPath = _resolveContained(projectRoot, entry.relPath);
    if (!destPath) {
      console.error(`  ✗ Refusing ${JSON.stringify(entry.relPath)} — empty, absolute, or escapes project root`);
      failures.push({ relPath, reason: 'unsafe path' });
      continue;
    }

    try {
      if (entry.onRollback === 'delete') {
        // The migration created this file; rollback removes it (audit #3).
        // Guard on the RESOLVED path (not the raw string) so `_bmad/_memory/../x`
        // cannot slip through: only ever delete inside _bmad/_memory/.
        // Round-2 review: reject equality too — a delete entry resolving to
        // `_bmad/_memory` itself must not wipe the whole memory dir, only leaves.
        if (destPath === memRootResolved || !destPath.startsWith(memRootResolved + path.sep)) {
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

      // restore-class. Round-2 review: validate the backup source stays inside
      // the backup dir too (a tampered manifest with `storedAt: tree/../secret`
      // must not copy out-of-backup content into a validated project path).
      const sourcePath = _resolveContained(backupDir, entry.storedAt);
      if (!sourcePath) {
        console.error(`  ✗ Refusing backup source ${JSON.stringify(entry.storedAt)} — escapes backup dir`);
        failures.push({ relPath, reason: 'backup source escapes backup dir' });
        continue;
      }
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
