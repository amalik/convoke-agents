#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');

/**
 * Shared utilities for the Convoke update system.
 * Single source of truth for version, comparison, project detection.
 */

/**
 * Get the package version at runtime from package.json.
 * This is the SINGLE SOURCE OF TRUTH for version - never hardcode versions elsewhere.
 * @returns {string} e.g. "1.3.8"
 */
function getPackageVersion() {
  const pkg = require('../../../package.json');
  return pkg.version;
}

/**
 * Compare two semantic version strings.
 * @param {string} v1
 * @param {string} v2
 * @returns {number} -1 if v1 < v2, 0 if equal, 1 if v1 > v2
 */
function compareVersions(v1, v2) {
  const parts1 = v1.split('.').map(Number);
  const parts2 = v2.split('.').map(Number);

  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const p1 = parts1[i] || 0;
    const p2 = parts2[i] || 0;
    if (p1 < p2) return -1;
    if (p1 > p2) return 1;
  }

  return 0;
}

/**
 * Count user data files in _bmad-output/ (excluding .backups, .logs).
 * @param {string} projectRoot - Absolute path to project root
 * @returns {Promise<number>}
 */
async function countUserDataFiles(projectRoot) {
  const outputDir = path.join(projectRoot, '_bmad-output');

  if (!fs.existsSync(outputDir)) {
    return 0;
  }

  let count = 0;

  async function walk(dir) {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name === '.backups' || entry.name === '.logs') continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        await walk(full);
      } else if (entry.isFile()) {
        count++;
      }
    }
  }

  await walk(outputDir);
  return count;
}

/**
 * Find the project root by walking up from cwd looking for _bmad/ directory.
 * @returns {string|null} Absolute path to project root, or null if not found
 */
function findProjectRoot() {
  let dir = process.cwd();
  const root = path.parse(dir).root;

  while (true) {
    if (fs.existsSync(path.join(dir, '_bmad'))) {
      return dir;
    }
    if (dir === root) break;
    dir = path.dirname(dir);
  }

  return null;
}

/**
 * Assert that a version string is valid before stamping a config file.
 * Throws a clear error if version is undefined, null, or empty.
 * Used by refresh-installation.js, config-merger.js, and any future config writer
 * that stamps a version field — closes I30 (ag-7-1).
 *
 * @param {string} version - The version string to validate
 * @param {string} callSite - Identifier for the call site (e.g., 'enhance', 'artifacts', 'config-merger')
 * @throws {Error} if version is not a non-empty string
 */
function assertVersion(version, callSite) {
  if (version === undefined || version === null || version === '') {
    let displayed;
    if (version === null) displayed = 'null';
    else if (version === '') displayed = "''";
    else displayed = 'undefined';
    throw new Error(
      `Refresh: cannot stamp config — getPackageVersion() returned ${displayed}; check package.json (call site: ${callSite})`
    );
  }
}

module.exports = {
  getPackageVersion,
  compareVersions,
  countUserDataFiles,
  findProjectRoot,
  assertVersion
};
