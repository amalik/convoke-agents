#!/usr/bin/env node

const fs = require('fs-extra');
const yaml = require('js-yaml');


/**
 * Migration Registry for Convoke
 *
 * APPEND-ONLY: Add new migrations at the bottom. Never edit old entries.
 * No toVersion needed - target is always the current package version at runtime.
 */

const MIGRATIONS = [
  {
    name: '1.0.x-to-1.3.0',
    fromVersion: '1.0.x',
    breaking: true,
    description: 'Archive deprecated empathy-map/wireframe workflows, rename agents in manifest',
    module: null
  },
  {
    name: '1.1.x-to-1.3.0',
    fromVersion: '1.1.x',
    breaking: false,
    description: 'No-op delta (refresh handles all file updates)',
    module: null
  },
  {
    name: '1.2.x-to-1.3.0',
    fromVersion: '1.2.x',
    breaking: false,
    description: 'No-op delta (refresh handles all file updates)',
    module: null
  },
  {
    name: '1.3.x-to-1.5.0',
    fromVersion: '1.3.x',
    breaking: false,
    description: 'No-op delta (refresh handles Wave 2 agents and workflows)',
    module: null
  },
  {
    name: '1.4.x-to-1.5.0',
    fromVersion: '1.4.x',
    breaking: false,
    description: 'No-op delta (refresh handles Wave 2 agents and workflows)',
    module: null
  },
  {
    name: '1.5.x-to-1.6.0',
    fromVersion: '1.5.x',
    breaking: false,
    description: 'Add Wave 3 agents (Mila, Liam, Noah) and 9 workflows to config',
    module: null
  },
  {
    name: '1.6.x-to-1.7.0',
    fromVersion: '1.6.x',
    breaking: false,
    description: 'Quality & onboarding (production workflow steps, updated guides, smart-merge)',
    module: null
  },
  {
    name: '1.7.x-to-2.0.0',
    fromVersion: '1.7.x',
    breaking: true,
    description: 'Product rename: BMAD-Enhanced -> Convoke. CLI commands renamed from bmad-* to convoke-*. _bmad/ directory preserved.',
    module: null
  },
  {
    name: '2.0.x-to-3.1.0',
    fromVersion: '2.0.x',
    breaking: false,
    description: 'Artifact governance: create or merge _bmad/_config/taxonomy.yaml with platform defaults, aliases, and artifact types',
    module: null
  },
  {
    name: '3.0.x-to-3.1.0',
    fromVersion: '3.0.x',
    breaking: false,
    description: 'Artifact governance: create or merge _bmad/_config/taxonomy.yaml (parallel entry for 3.0.x users)',
    module: null
  }
  // Future migrations: append here. Only add delta logic for version-specific changes.
];

/**
 * Get migrations applicable for upgrading from a given version.
 * Walks the full migration chain: finds the entry-point migration matching
 * the user's version, then follows the chain forward by parsing each
 * migration's target version and finding the next hop.
 *
 * @param {string} fromVersion - Current installed version (e.g., "1.0.5")
 * @returns {Array} List of applicable migrations with loaded modules, in chain order
 */
function getMigrationsFor(fromVersion) {
  const applicable = [];

  // Step 1: Find the entry-point migration matching the user's current version
  let entryMigration = null;
  for (const migration of MIGRATIONS) {
    if (matchesVersionRange(fromVersion, migration.fromVersion)) {
      entryMigration = migration;
      break;
    }
  }

  if (!entryMigration) return applicable;

  // Load and add entry migration
  if (!loadMigrationModule(entryMigration)) return applicable;
  applicable.push(entryMigration);

  // Step 2: Chain forward — parse target version from migration name,
  // then find the next migration whose fromVersion matches that target
  let targetVersion = parseTargetVersion(entryMigration.name);

  while (targetVersion) {
    const nextMigration = MIGRATIONS.find(m =>
      matchesVersionRange(targetVersion, m.fromVersion) && !applicable.includes(m)
    );

    if (!nextMigration) break;
    if (!loadMigrationModule(nextMigration)) break;

    applicable.push(nextMigration);
    targetVersion = parseTargetVersion(nextMigration.name);
  }

  return applicable;
}

/**
 * Parse the target version from a migration name.
 * E.g., "1.0.x-to-1.3.0" → "1.3.0"
 * @param {string} migrationName
 * @returns {string|null} Target version or null if unparseable
 */
function parseTargetVersion(migrationName) {
  const match = migrationName.match(/-to-(\d+\.\d+\.\d+)$/);
  return match ? match[1] : null;
}

/**
 * Lazy-load a migration's module file.
 * @param {object} migration - Migration entry from MIGRATIONS array
 * @returns {boolean} True if module loaded successfully
 */
function loadMigrationModule(migration) {
  if (migration.module) return true;
  try {
    migration.module = require(`./${migration.name}`);
    return true;
  } catch (error) {
    console.error(`Failed to load migration ${migration.name}:`, error.message);
    return false;
  }
}

/**
 * Check if migration has already been applied
 * @param {string} migrationName - Name of migration
 * @param {string} configPath - Path to config.yaml
 * @returns {boolean} True if already applied
 */
function hasMigrationBeenApplied(migrationName, configPath) {
  if (!fs.existsSync(configPath)) {
    return false;
  }

  try {
    const configContent = fs.readFileSync(configPath, 'utf8');
    const config = yaml.load(configContent);

    if (!config.migration_history || !Array.isArray(config.migration_history)) {
      return false;
    }

    return config.migration_history.some(entry =>
      entry.migrations_applied && entry.migrations_applied.includes(migrationName)
    );
  } catch (error) {
    console.warn('Could not check migration history:', error.message);
    return false;
  }
}

/**
 * Get breaking changes for upgrading from a given version.
 * @param {string} fromVersion - Current installed version
 * @returns {Array<string>} List of breaking change descriptions
 */
function getBreakingChanges(fromVersion) {
  const migrations = getMigrationsFor(fromVersion);
  const breakingChanges = [];

  for (const migration of migrations) {
    if (migration.breaking) {
      breakingChanges.push(migration.description);
    }
  }

  return breakingChanges;
}

/**
 * Match version against version range pattern
 * @param {string} version - Version to check (e.g., "1.0.5")
 * @param {string} pattern - Pattern to match (e.g., "1.0.x")
 * @returns {boolean} True if matches
 */
function matchesVersionRange(version, pattern) {
  if (pattern === version) {
    return true;
  }

  // Handle wildcard patterns (e.g., "1.0.x")
  if (pattern.endsWith('.x')) {
    const patternParts = pattern.split('.');
    const versionParts = version.split('.');

    return patternParts[0] === versionParts[0] &&
           patternParts[1] === versionParts[1];
  }

  return false;
}

/**
 * Get all registered migrations
 * @returns {Array} All migrations (shallow copy)
 */
function getAllMigrations() {
  return [...MIGRATIONS];
}

module.exports = {
  MIGRATIONS,
  getMigrationsFor,
  hasMigrationBeenApplied,
  getBreakingChanges,
  matchesVersionRange,
  parseTargetVersion,
  getAllMigrations
};
