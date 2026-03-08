#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const yaml = require('js-yaml');
const versionDetector = require('./lib/version-detector');
const { findProjectRoot, compareVersions } = require('./lib/utils');

/**
 * Convoke Version CLI
 * Show version information and migration history
 */

async function main() {
  const projectRoot = findProjectRoot();
  const targetVersion = versionDetector.getTargetVersion();

  console.log('');
  console.log(chalk.bold('Convoke Version Information'));
  console.log('');

  // Not in a Convoke project
  if (!projectRoot) {
    console.log(chalk.yellow('Status:           Not in a Convoke project'));
    console.log(`Package version:  ${chalk.cyan(targetVersion)}`);
    console.log('');
    console.log('Run: ' + chalk.cyan('npx -p convoke-agents convoke-install'));
    console.log('');
    return;
  }

  const currentVersion = versionDetector.getCurrentVersion(projectRoot);
  const scenario = versionDetector.detectInstallationScenario(projectRoot);

  // Fresh install - not installed yet
  if (scenario === 'fresh') {
    console.log(chalk.yellow('Status:           Not installed'));
    console.log(`Package version:  ${chalk.cyan(targetVersion)}`);
    console.log('');
    console.log('Run: ' + chalk.cyan('npx -p convoke-agents convoke-install'));
    console.log('');
    return;
  }

  // Partial installation - config.yaml missing but some files exist
  if (scenario === 'partial' || !currentVersion) {
    console.log(chalk.red('Status:           Partial installation (config.yaml missing)'));
    console.log(`Package version:  ${chalk.cyan(targetVersion)}`);
    console.log('');
    console.log(chalk.yellow('This indicates an installation error.'));
    console.log('');
    console.log('Try running: ' + chalk.cyan('npx -p convoke-agents convoke-install'));
    console.log('');
    console.log('If the problem persists, check the installation logs.');
    console.log('');
    return;
  }

  // Corrupted installation
  if (scenario === 'corrupted') {
    console.log(chalk.red('Status:           Corrupted installation (missing required files)'));
    console.log(`Package version:  ${chalk.cyan(targetVersion)}`);
    console.log('');
    console.log(chalk.yellow('Some required files are missing.'));
    console.log('');
    console.log('Run: ' + chalk.cyan('npx -p convoke-agents convoke-install') + ' to reinstall');
    console.log('');
    return;
  }

  // Installed
  console.log(`Installed version: ${chalk.cyan(currentVersion)}`);
  console.log(`Package version:   ${chalk.cyan(targetVersion)}`);
  console.log('');

  // Status
  if (currentVersion === targetVersion) {
    console.log(chalk.green('Status: ✓ Up to date'));
  } else if (compareVersions(currentVersion, targetVersion) < 0) {
    console.log(chalk.yellow('Status: ⚠ Update available'));
    console.log('');
    console.log('Run: ' + chalk.cyan('npx -p convoke-agents@latest convoke-update --dry-run') + ' (to preview)');
    console.log('     ' + chalk.cyan('npx -p convoke-agents@latest convoke-update') + ' (to apply)');
  } else {
    console.log(chalk.yellow(`Status: Package version (${targetVersion}) is older than installed (${currentVersion})`));
  }

  // Show migration history
  const migrationHistory = await getMigrationHistory(projectRoot);
  if (migrationHistory && migrationHistory.length > 0) {
    console.log('');
    console.log(chalk.cyan('Migration History:'));
    migrationHistory.forEach((entry, index) => {
      const timestamp = new Date(entry.timestamp).toLocaleDateString();
      console.log(chalk.gray(`  ${index + 1}. ${entry.from_version} → ${entry.to_version} (${timestamp})`));
      if (entry.migrations_applied && entry.migrations_applied.length > 0) {
        entry.migrations_applied.forEach(m => {
          console.log(chalk.gray(`     - ${m}`));
        });
      }
    });
  }

  console.log('');
}

/**
 * Get migration history from config.yaml
 * @param {string} projectRoot - Project root
 * @returns {Promise<Array|null>} Migration history or null
 */
async function getMigrationHistory(projectRoot) {
  const configPath = path.join(projectRoot, '_bmad/bme/_vortex/config.yaml');

  if (!fs.existsSync(configPath)) {
    return null;
  }

  try {
    const configContent = await fs.readFile(configPath, 'utf8');
    const config = yaml.load(configContent);

    return config.migration_history || null;
  } catch (_error) {
    return null;
  }
}

// Run main
main().catch(error => {
  console.error('Error:', error.message);
  process.exit(1);
});
