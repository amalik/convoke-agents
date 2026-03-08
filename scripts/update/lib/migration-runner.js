#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const yaml = require('js-yaml');
const { findProjectRoot, getPackageVersion } = require('./utils');
const backupManager = require('./backup-manager');
const configMerger = require('./config-merger');
const validator = require('./validator');
const { refreshInstallation } = require('./refresh-installation');
const registry = require('../migrations/registry');
const { WORKFLOW_NAMES } = require('./agent-registry');

/**
 * Migration Runner for Convoke
 * Core orchestration: executes migration deltas, refreshes installation, handles backups and rollback.
 */

/**
 * Run migrations from current version to the current package version.
 * @param {string} fromVersion - Current installed version
 * @param {object} options - Options { dryRun, verbose }
 * @returns {Promise<object>} Migration result
 */
async function runMigrations(fromVersion, options = {}) {
  const { dryRun = false, verbose = false } = options;
  const toVersion = getPackageVersion();

  // Resolve project root
  const projectRoot = findProjectRoot();
  if (!projectRoot) {
    throw new Error('Not in a Convoke project. Could not find _bmad/ directory.');
  }

  console.log('');
  if (dryRun) {
    console.log(chalk.yellow.bold('═══ DRY RUN MODE ═══'));
    console.log(chalk.yellow('No changes will be made to your installation'));
    console.log('');
  }

  // 1. Get applicable migration deltas
  const migrations = registry.getMigrationsFor(fromVersion);

  if (migrations.length === 0) {
    console.log(chalk.yellow('No migrations needed'));
    return { success: true, migrations: [], skipped: true };
  }

  console.log(chalk.cyan(`Found ${migrations.length} migration(s) to apply:`));
  migrations.forEach((m, i) => {
    const icon = m.breaking ? chalk.red('⚠') : chalk.green('✓');
    console.log(`  ${i + 1}. ${icon} ${m.name} - ${m.description}`);
  });
  console.log('');

  // If dry run, just preview
  if (dryRun) {
    return await previewMigrations(migrations);
  }

  // 2. Acquire migration lock
  await acquireMigrationLock(projectRoot);

  let backupMetadata = null;
  const results = [];

  try {
    // 3. Create backup
    console.log(chalk.cyan('[1/5] Creating backup...'));
    backupMetadata = await backupManager.createBackup(fromVersion, projectRoot);
    console.log(chalk.green(`✓ Backup created: ${path.basename(backupMetadata.backup_dir)}`));
    console.log('');

    // 4. Execute migration deltas sequentially
    console.log(chalk.cyan('[2/5] Running migration deltas...'));
    for (let i = 0; i < migrations.length; i++) {
      const migration = migrations[i];
      console.log(chalk.cyan(`\nMigration ${i + 1}/${migrations.length}: ${migration.name}`));

      try {
        const changes = await executeMigration(migration, projectRoot, { verbose });
        results.push({
          name: migration.name,
          success: true,
          changes
        });

        console.log(chalk.green(`✓ ${migration.name} completed`));
      } catch (error) {
        console.error(chalk.red(`✗ ${migration.name} failed: ${error.message}`));
        throw new MigrationError(migration.name, error);
      }
    }
    console.log('');
    console.log(chalk.green('✓ All migration deltas completed'));
    console.log('');

    // 5. Refresh installation (copy latest files from package)
    console.log(chalk.cyan('[3/5] Refreshing installation files...'));
    const refreshChanges = await refreshInstallation(projectRoot);
    results.push({
      name: 'refresh-installation',
      success: true,
      changes: refreshChanges
    });
    console.log(chalk.green('✓ Installation refreshed'));
    console.log('');

    // 6. Validate installation (before writing history, so rollback stays clean)
    console.log(chalk.cyan('[4/5] Validating installation...'));
    const validationResult = await validator.validateInstallation(backupMetadata, projectRoot);

    validationResult.checks.forEach(check => {
      if (check.passed) {
        console.log(chalk.green(`  ✓ ${check.name}`));
        if (check.info || check.warning) {
          console.log(chalk.gray(`    ${check.info || check.warning}`));
        }
      } else {
        console.log(chalk.red(`  ✗ ${check.name}`));
        if (check.error) {
          console.log(chalk.red(`    Error: ${check.error}`));
        }
      }
    });
    console.log('');

    if (!validationResult.valid) {
      throw new Error('Installation validation failed');
    }

    console.log(chalk.green('✓ Installation validated'));
    console.log('');

    // 7. Update migration history in config.yaml (after validation succeeds)
    console.log(chalk.cyan('[5/5] Updating configuration...'));
    await updateMigrationHistory(projectRoot, fromVersion, toVersion, results);
    console.log(chalk.green('✓ Migration history updated'));
    console.log('');

    // 8. Cleanup old backups
    const deletedCount = await backupManager.cleanupOldBackups(5, projectRoot);
    if (deletedCount > 0) {
      console.log(chalk.green(`✓ Cleaned up ${deletedCount} old backup(s)`));
    }

    // Release lock
    await releaseMigrationLock(projectRoot);

    // Create migration log
    await createMigrationLog(projectRoot, fromVersion, toVersion, results, backupMetadata);

    return {
      success: true,
      fromVersion,
      toVersion,
      results,
      backupMetadata
    };

  } catch (error) {
    console.error('');
    console.error(chalk.red.bold('✗ Migration failed!'));
    console.error('');
    console.error(chalk.red(error.message));
    console.error('');

    // Rollback if we have a backup
    if (backupMetadata) {
      console.log(chalk.yellow('Restoring from backup...'));
      try {
        await backupManager.restoreBackup(backupMetadata, projectRoot);
        console.log(chalk.green('✓ Installation restored from backup'));
        console.log('');
      } catch (restoreError) {
        console.error(chalk.red('✗ Restore failed!'));
        console.error(chalk.red(restoreError.message));
        console.error('');
        console.error(chalk.yellow(`Manual restore may be needed from: ${backupMetadata.backup_dir}`));
        console.error('');
      }
    }

    // Release lock
    await releaseMigrationLock(projectRoot);

    // Create error log
    await createErrorLog(projectRoot, fromVersion, toVersion, error, backupMetadata);

    throw error;
  }
}

/**
 * Preview migrations without applying
 */
async function previewMigrations(migrations) {
  const previews = [];

  for (const migration of migrations) {
    console.log(chalk.cyan(`\n${migration.name}:`));
    console.log(chalk.gray(migration.description));

    if (migration.module && migration.module.preview) {
      const preview = await migration.module.preview();
      console.log('');
      console.log(chalk.white('Actions:'));
      preview.actions.forEach(action => {
        console.log(chalk.gray(`  - ${action}`));
      });
      previews.push({ name: migration.name, preview });
    }
  }

  console.log('');
  console.log(chalk.white('After deltas, installation will be refreshed:'));
  console.log(chalk.gray('  - Refresh agent files'));
  console.log(chalk.gray(`  - Refresh ${WORKFLOW_NAMES.length} workflow directories`));
  console.log(chalk.gray('  - Update config.yaml (preserving user preferences)'));
  console.log(chalk.gray('  - Update user guides (with .bak backup)'));
  console.log('');
  console.log(chalk.green('To apply these changes, run:'));
  console.log(chalk.cyan('  npx convoke-update'));
  console.log('');

  return { success: true, dryRun: true, previews };
}

/**
 * Execute a single migration delta
 */
async function executeMigration(migration, projectRoot, options = {}) {
  const { verbose = false } = options;

  if (!migration.module || !migration.module.apply) {
    throw new Error(`Migration ${migration.name} has no apply function`);
  }

  const changes = await migration.module.apply(projectRoot);

  if (verbose) {
    changes.forEach(change => {
      console.log(chalk.gray(`    - ${change}`));
    });
  }

  return changes;
}

/**
 * Update migration history in config.yaml
 */
async function updateMigrationHistory(projectRoot, fromVersion, toVersion, results) {
  const configPath = path.join(projectRoot, '_bmad/bme/_vortex/config.yaml');

  if (!fs.existsSync(configPath)) {
    throw new Error('config.yaml not found after refresh');
  }

  const configContent = fs.readFileSync(configPath, 'utf8');
  const config = yaml.load(configContent);

  const migrationsApplied = results
    .filter(r => r.name !== 'refresh-installation')
    .map(r => r.name);

  const updatedConfig = configMerger.addMigrationHistory(
    config, fromVersion, toVersion, migrationsApplied
  );

  await configMerger.writeConfig(configPath, updatedConfig);
}

async function acquireMigrationLock(projectRoot) {
  const lockFile = path.join(projectRoot, '_bmad-output/.migration-lock');

  if (fs.existsSync(lockFile)) {
    const lock = await fs.readJson(lockFile);
    const age = Date.now() - lock.timestamp;

    if (age > 5 * 60 * 1000) {
      console.log(chalk.yellow('Removing stale migration lock'));
      await fs.remove(lockFile);
    } else {
      throw new Error('Migration already in progress. Please wait and try again.');
    }
  }

  await fs.ensureDir(path.join(projectRoot, '_bmad-output'));
  await fs.writeJson(lockFile, { timestamp: Date.now(), pid: process.pid });
}

async function releaseMigrationLock(projectRoot) {
  const lockFile = path.join(projectRoot, '_bmad-output/.migration-lock');
  if (fs.existsSync(lockFile)) {
    await fs.remove(lockFile);
  }
}

async function createMigrationLog(projectRoot, fromVersion, toVersion, results, backupMetadata) {
  const logsDir = path.join(projectRoot, '_bmad-output/.logs');
  await fs.ensureDir(logsDir);

  const logFile = path.join(logsDir, `migration-${Date.now()}.log`);
  const logContent = [
    `Convoke Migration Log`,
    `Date: ${new Date().toISOString()}`,
    `From Version: ${fromVersion}`,
    `To Version: ${toVersion}`,
    '',
    'Migrations Applied:',
    ...results.map(r => `  - ${r.name}`),
    '',
    'Changes:',
    ...results.flatMap(r => r.changes.map(c => `  - ${c}`)),
    '',
    `Backup: ${backupMetadata.backup_dir}`,
    '',
    'Status: SUCCESS'
  ].join('\n');

  await fs.writeFile(logFile, logContent, 'utf8');
}

async function createErrorLog(projectRoot, fromVersion, toVersion, error, backupMetadata) {
  const logsDir = path.join(projectRoot, '_bmad-output/.logs');
  await fs.ensureDir(logsDir);

  const logFile = path.join(logsDir, `migration-error-${Date.now()}.log`);
  const logContent = [
    `Convoke Migration Error Log`,
    `Date: ${new Date().toISOString()}`,
    `From Version: ${fromVersion}`,
    `To Version: ${toVersion}`,
    '',
    `Error: ${error.message}`,
    '',
    'Stack Trace:',
    error.stack,
    '',
    backupMetadata ? `Backup: ${backupMetadata.backup_dir}` : 'No backup created',
    backupMetadata ? 'Status: ROLLED BACK' : 'Status: FAILED (no backup)',
    '',
    'Please report this issue at: https://github.com/amalik/convoke-agents/issues'
  ].join('\n');

  await fs.writeFile(logFile, logContent, 'utf8');
  console.log(chalk.gray(`Migration log: ${logFile}`));
}

class MigrationError extends Error {
  constructor(migrationName, originalError) {
    super(`Migration ${migrationName} failed: ${originalError.message}`);
    this.name = 'MigrationError';
    this.migrationName = migrationName;
    this.originalError = originalError;
  }
}

module.exports = {
  runMigrations,
  previewMigrations,
  executeMigration,
  MigrationError
};
