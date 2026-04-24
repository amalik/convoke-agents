#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');
const yaml = require('js-yaml');
const { findProjectRoot, compareVersions, getPackageVersion } = require('./utils');

/**
 * Version Detector for Convoke
 * Reliably detects current installed version and determines migration path
 */

/**
 * Get current installed version from config.yaml
 * @param {string} [projectRoot] - Project root (auto-detected if omitted)
 * @returns {string|null} Version string or null if not found
 */
function getCurrentVersion(projectRoot) {
  if (!projectRoot) {
    projectRoot = findProjectRoot();
  }
  if (!projectRoot) {
    return null; // Not in a BMAD project
  }

  try {
    const configPath = path.join(projectRoot, '_bmad/bme/_vortex/config.yaml');

    if (!fs.existsSync(configPath)) {
      return null; // No config = fresh install
    }

    const configContent = fs.readFileSync(configPath, 'utf8');
    const config = yaml.load(configContent);

    if (config && config.version) {
      return config.version;
    }

    // Fallback: Check for deprecated folder structure to guess version
    console.warn('Warning: config.yaml exists but has no version field');
    return guessVersionFromFileStructure(projectRoot);

  } catch (error) {
    console.warn('Warning: Could not read config.yaml:', error.message);
    return guessVersionFromFileStructure(projectRoot);
  }
}

/**
 * Guess version from file structure (fallback method)
 * @param {string} [projectRoot] - Project root (auto-detected if omitted)
 * @returns {string|null} Guessed version or null
 */
function guessVersionFromFileStructure(projectRoot) {
  if (!projectRoot) {
    projectRoot = findProjectRoot();
  }
  if (!projectRoot) {
    return null;
  }

  const vortexDir = path.join(projectRoot, '_bmad/bme/_vortex');

  if (!fs.existsSync(vortexDir)) {
    return null; // No installation
  }

  // Check for deprecated folder (exists in v1.1.0+)
  const deprecatedDir = path.join(vortexDir, 'workflows/_deprecated');
  if (fs.existsSync(deprecatedDir)) {
    return '1.1.0'; // Has deprecated folder = v1.1.0+
  }

  // Check for old empathy-map workflow (v1.0.0)
  const empathyMapDir = path.join(vortexDir, 'workflows/empathy-map');
  if (fs.existsSync(empathyMapDir)) {
    return '1.0.0'; // Has empathy-map in workflows = v1.0.0
  }

  // Has vortex dir but can't determine version - return null instead of guessing
  return null;
}

/**
 * Get target version from package.json
 * @returns {string} Target version
 */
function getTargetVersion() {
  return getPackageVersion();
}

/**
 * Determine migration path based on versions
 * @param {string|null} currentVersion - Current installed version
 * @param {string} targetVersion - Target version from package
 * @returns {object} Migration path info
 */
function getMigrationPath(currentVersion, targetVersion) {
  // Fresh install (no current version)
  if (!currentVersion) {
    return {
      type: 'fresh-install',
      needsMigration: false,
      breaking: false
    };
  }

  // Already up to date
  if (currentVersion === targetVersion) {
    return {
      type: 'up-to-date',
      needsMigration: false,
      breaking: false
    };
  }

  // Downgrade attempt (not supported)
  if (compareVersions(currentVersion, targetVersion) > 0) {
    return {
      type: 'downgrade',
      needsMigration: false,
      breaking: false,
      fromVersion: currentVersion,
      toVersion: targetVersion
    };
  }

  // Upgrade needed
  const breaking = isBreakingChange(currentVersion, targetVersion);

  return {
    type: 'upgrade-needed',
    needsMigration: true,
    breaking,
    fromVersion: currentVersion,
    toVersion: targetVersion
  };
}

/**
 * Detect installation scenario
 * @param {string} [projectRoot] - Project root (auto-detected if omitted)
 * @returns {string} Scenario: 'fresh' | 'partial' | 'complete' | 'corrupted'
 */
function detectInstallationScenario(projectRoot) {
  if (!projectRoot) {
    projectRoot = findProjectRoot();
  }
  if (!projectRoot) {
    return 'fresh';
  }

  const vortexDir = path.join(projectRoot, '_bmad/bme/_vortex');
  const configPath = path.join(vortexDir, 'config.yaml');
  const agentsDir = path.join(vortexDir, 'agents');
  const workflowsDir = path.join(vortexDir, 'workflows');

  // No vortex directory = fresh install
  if (!fs.existsSync(vortexDir)) {
    return 'fresh';
  }

  // No config.yaml = partial installation
  if (!fs.existsSync(configPath)) {
    return 'partial';
  }

  // R1-H4 (post-Story-3.1 hardening): iterate ALL 7 Vortex AGENT_IDS, not
  // just 2 hardcoded sentinels. Accept BOTH flat `.md` (pre-4.0) AND
  // skill-dir `<id>/SKILL.md` (post-4.0) as "present" so upgrade flow can
  // fire `refreshInstallation` without tripping "corrupted." Mixed-shape
  // (some agents flat, some skill-dir) means mid-migration drift — return
  // 'corrupted' so the operator is routed through recovery.
  const { AGENT_IDS } = require('./agent-registry');

  if (!fs.existsSync(agentsDir)) {
    return 'corrupted';
  }

  let flatCount = 0;
  let dirCount = 0;
  const missingAgents = [];
  for (const agentId of AGENT_IDS) {
    const hasFlat = fs.existsSync(path.join(agentsDir, `${agentId}.md`));
    const hasDir = fs.existsSync(path.join(agentsDir, agentId, 'SKILL.md'));
    if (!hasFlat && !hasDir) {
      missingAgents.push(agentId);
    } else {
      if (hasFlat) flatCount += 1;
      if (hasDir) dirCount += 1;
    }
  }

  // Mixed-shape drift: some agents in flat layout, some in skill-dir.
  // Indicates an in-progress migration (crash during R1-H2 cleanup, or
  // operator interrupted convoke-update). R2-H6 returns 'partial' (not
  // 'corrupted') so `refreshInstallation` is routed to auto-remediate on
  // next run — 'corrupted' would brick the operator by routing to manual
  // recovery even though `refreshInstallation` can finish the migration.
  if (flatCount > 0 && dirCount > 0 && missingAgents.length === 0) {
    return 'partial';
  }

  if (missingAgents.length > 0) {
    return 'corrupted';
  }

  // Check workflows directory
  if (!fs.existsSync(workflowsDir)) {
    return 'corrupted';
  }

  return 'complete';
}

/**
 * Determine if upgrade involves breaking changes
 * @param {string} fromVersion - Current version
 * @param {string} toVersion - Target version
 * @returns {boolean} True if breaking changes exist
 */
function isBreakingChange(fromVersion, toVersion) {
  // v1.0.x → any later version = breaking (empathy-map removed)
  if (fromVersion.startsWith('1.0.')) {
    return true;
  }

  // v1.1.x → v1.2.0 = not breaking (just updates)
  if (fromVersion.startsWith('1.1.') && toVersion.startsWith('1.2.')) {
    return false;
  }

  // Major version change = breaking
  const fromMajor = parseInt(fromVersion.split('.')[0]);
  const toMajor = parseInt(toVersion.split('.')[0]);

  if (fromMajor < toMajor) {
    return true;
  }

  return false;
}

/**
 * Get version range pattern for migrations (e.g., "1.0.x")
 * @param {string} version - Full version string
 * @returns {string} Version range pattern
 */
function getVersionRange(version) {
  const parts = version.split('.');
  return `${parts[0]}.${parts[1]}.x`;
}

module.exports = {
  getCurrentVersion,
  getTargetVersion,
  getMigrationPath,
  detectInstallationScenario,
  isBreakingChange,
  getVersionRange,
  guessVersionFromFileStructure
};
