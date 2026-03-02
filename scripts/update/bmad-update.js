#!/usr/bin/env node

const readline = require('readline');
const chalk = require('chalk');
const versionDetector = require('./lib/version-detector');
const migrationRunner = require('./lib/migration-runner');
const registry = require('./migrations/registry');
const { findProjectRoot } = require('./lib/utils');

/**
 * BMAD-Enhanced Update CLI
 * Main update command for users
 */

/**
 * Assess the current installation and determine what update action is needed.
 * Pure logic — no I/O, no process.exit. Returns a structured decision object.
 *
 * @param {string|null} projectRoot - Project root path (null if not found)
 * @returns {object} Assessment result with action, versions, migrations, breakingChanges
 */
function assessUpdate(projectRoot) {
  if (!projectRoot) {
    return { action: 'no-project' };
  }

  const currentVersion = versionDetector.getCurrentVersion(projectRoot);
  const targetVersion = versionDetector.getTargetVersion();
  const scenario = versionDetector.detectInstallationScenario(projectRoot);

  if (scenario === 'fresh') {
    return { action: 'fresh', scenario };
  }

  if (scenario === 'partial' || scenario === 'corrupted') {
    return { action: 'broken', scenario };
  }

  if (!currentVersion) {
    return { action: 'no-version', scenario };
  }

  const migrationPath = versionDetector.getMigrationPath(currentVersion, targetVersion);

  if (migrationPath.type === 'up-to-date') {
    return { action: 'up-to-date', currentVersion, targetVersion };
  }

  if (migrationPath.type === 'downgrade') {
    return { action: 'downgrade', currentVersion, targetVersion };
  }

  const migrations = registry.getMigrationsFor(currentVersion);
  const breakingChanges = registry.getBreakingChanges(currentVersion);

  if (migrations.length === 0) {
    return { action: 'no-migrations', currentVersion, targetVersion };
  }

  return {
    action: 'upgrade',
    currentVersion,
    targetVersion,
    migrations,
    breakingChanges
  };
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const yes = args.includes('--yes') || args.includes('-y');
  const verbose = args.includes('--verbose') || args.includes('-v');

  // Header
  console.log('');
  console.log(chalk.bold.magenta('╔════════════════════════════════════════╗'));
  console.log(chalk.bold.magenta('║   BMAD-Enhanced Update Manager         ║'));
  console.log(chalk.bold.magenta('╚════════════════════════════════════════╝'));
  console.log('');

  const projectRoot = findProjectRoot();
  const assessment = assessUpdate(projectRoot);

  switch (assessment.action) {
    case 'no-project':
      console.log(chalk.red('Not in a BMAD project. Could not find _bmad/ directory.'));
      console.log('');
      console.log('Run: ' + chalk.cyan('npx bmad-install-agents'));
      console.log('');
      process.exit(1);
      break;

    case 'fresh':
      console.log(chalk.yellow('No previous installation detected.'));
      console.log('');
      console.log('Run: ' + chalk.cyan('npx bmad-install-agents'));
      console.log('');
      process.exit(0);
      break;

    case 'broken':
      console.log(chalk.red('Installation appears incomplete or corrupted.'));
      console.log('');
      console.log('Recommend running: ' + chalk.cyan('npx bmad-install-agents'));
      console.log('');
      process.exit(1);
      break;

    case 'no-version':
      console.log(chalk.yellow('Could not detect current version.'));
      console.log('');
      console.log('Run: ' + chalk.cyan('npx bmad-install-agents'));
      console.log('');
      process.exit(0);
      break;

    case 'up-to-date':
      console.log(chalk.green(`✓ Already up to date! (v${assessment.currentVersion})`));
      console.log('');
      console.log(chalk.gray('If you expected a newer version, npx may be serving a cached copy.'));
      console.log(chalk.gray('Run: ') + chalk.cyan('npx -p bmad-enhanced@latest bmad-update'));
      console.log('');
      process.exit(0);
      break;

    case 'downgrade':
      console.log(chalk.red.bold('⚠ DOWNGRADE DETECTED'));
      console.log('');
      console.log(`  Current version: ${assessment.currentVersion}`);
      console.log(`  Package version: ${assessment.targetVersion}`);
      console.log('');
      console.log(chalk.gray('This usually means npx is serving a cached older package.'));
      console.log(chalk.gray('Run: ') + chalk.cyan('npx -p bmad-enhanced@latest bmad-update'));
      console.log('');
      console.log(chalk.gray('If the issue persists, clear the cache and reinstall:'));
      console.log(chalk.cyan('  npm cache clean --force && npm install bmad-enhanced@latest'));
      console.log('');
      console.log(chalk.yellow('If you intentionally want to downgrade:'));
      console.log('  1. Backup your installation');
      console.log('  2. Uninstall current version');
      console.log('  3. Install desired version');
      console.log('');
      process.exit(1);
      break;

    case 'no-migrations':
      console.log(chalk.yellow('No migrations needed (versions compatible)'));
      console.log('');
      process.exit(0);
      break;

    case 'upgrade':
      break; // Continue below
  }

  // Show migration plan
  console.log(chalk.cyan('Migration Plan:'));
  console.log(`  From: ${chalk.red(assessment.currentVersion)}`);
  console.log(`  To:   ${chalk.green(assessment.targetVersion)}`);
  console.log('');

  console.log(chalk.cyan('Migrations to apply:'));
  assessment.migrations.forEach((m, i) => {
    const icon = m.breaking ? chalk.red('⚠') : chalk.green('✓');
    console.log(`  ${i + 1}. ${icon} ${m.description}`);
  });
  console.log('');

  if (assessment.breakingChanges.length > 0) {
    console.log(chalk.red.bold('⚠ BREAKING CHANGES:'));
    assessment.breakingChanges.forEach(change => {
      console.log(chalk.yellow(`  - ${change}`));
    });
    console.log('');
  }

  // Dry run - preview only
  if (dryRun) {
    console.log(chalk.yellow.bold('DRY RUN - Previewing changes'));
    console.log('');

    try {
      await migrationRunner.runMigrations(assessment.currentVersion, { dryRun: true, verbose });
    } catch (error) {
      console.error(chalk.red('Error during preview:'), error.message);
      process.exit(1);
    }

    process.exit(0);
  }

  // Confirm with user (unless --yes)
  if (!yes) {
    console.log(chalk.cyan('Your data will be backed up automatically before migration.'));
    console.log('');

    const confirmed = await confirm('Proceed with migration?');

    if (!confirmed) {
      console.log('');
      console.log(chalk.yellow('Migration cancelled.'));
      console.log('');
      process.exit(0);
    }
  }

  // Run migrations
  console.log('');
  console.log(chalk.cyan.bold('Starting migration...'));

  try {
    const result = await migrationRunner.runMigrations(assessment.currentVersion, { verbose });

    console.log('');
    console.log(chalk.green.bold('✓ Migration completed successfully!'));
    console.log('');
    console.log(chalk.cyan('Changes applied:'));
    result.results.forEach(r => {
      console.log(chalk.green(`  ✓ ${r.name}`));
      if (verbose) {
        r.changes.forEach(change => {
          console.log(chalk.gray(`    - ${change}`));
        });
      }
    });
    console.log('');
    console.log(chalk.gray(`Backup location: ${result.backupMetadata.backup_dir}`));
    console.log('');

  } catch (_error) {
    // Error already logged by migration-runner
    process.exit(1);
  }
}

/**
 * Confirm action with user
 * @param {string} message - Confirmation message
 * @returns {Promise<boolean>} True if user confirms
 */
async function confirm(message) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise(resolve => {
    rl.question(chalk.yellow(`${message} [y/N]: `), answer => {
      rl.close();
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
    });
  });
}

// Export assessUpdate for testing
module.exports = { assessUpdate };

// Run main when executed directly
if (require.main === module) {
  main().catch(error => {
    console.error('');
    console.error(chalk.red.bold('Unexpected error:'));
    console.error(chalk.red(error.message));
    console.error('');
    if (error.stack) {
      console.error(chalk.gray(error.stack));
      console.error('');
    }
    process.exit(1);
  });
}
