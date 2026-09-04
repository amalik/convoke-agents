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
 * Compare two semantic version strings, SemVer 2.0.0-aware.
 *
 * Numeric core (major.minor.patch) is compared first. When cores are equal,
 * SemVer §11 precedence applies: a version WITH a pre-release ranks LOWER than
 * the same version without one (e.g. `4.0.0-rc.1` < `4.0.0`), and two
 * pre-releases compare identifier-by-identifier (numeric < alphanumeric).
 * Build metadata (`+...`) is ignored per SemVer §10.
 *
 * NOTE: the prior implementation did `v.split('.').map(Number)`, so any
 * pre-release suffix coerced to NaN and silently fell through to "equal" —
 * which on the rc→final upgrade path made `convoke-update` read the upgrade as
 * a downgrade and refuse (backlog U11 / audit HIGH-1). This is the fix.
 *
 * @param {string} v1
 * @param {string} v2
 * @returns {number} -1 if v1 < v2, 0 if equal, 1 if v1 > v2
 */
function compareVersions(v1, v2) {
  const parse = (v) => {
    const noBuild = String(v).split('+')[0]; // drop build metadata (SemVer §10)
    const dash = noBuild.indexOf('-');
    const core = (dash === -1 ? noBuild : noBuild.slice(0, dash)).split('.').map(Number);
    const pre = dash === -1 ? '' : noBuild.slice(dash + 1);
    return { core, pre };
  };
  const a = parse(v1);
  const b = parse(v2);

  // 1. Compare numeric core, padding missing parts with 0.
  for (let i = 0; i < Math.max(a.core.length, b.core.length); i++) {
    const p1 = a.core[i] || 0;
    const p2 = b.core[i] || 0;
    if (p1 < p2) return -1;
    if (p1 > p2) return 1;
  }

  // 2. Cores equal → SemVer §11 pre-release precedence.
  // A version WITHOUT a pre-release outranks the same version WITH one.
  if (!a.pre && !b.pre) return 0;
  if (!a.pre) return 1;
  if (!b.pre) return -1;

  // 3. Both have pre-releases → compare dot-separated identifiers.
  const ids1 = a.pre.split('.');
  const ids2 = b.pre.split('.');
  for (let i = 0; i < Math.max(ids1.length, ids2.length); i++) {
    const x = ids1[i];
    const y = ids2[i];
    if (x === undefined) return -1; // fewer identifiers → lower precedence
    if (y === undefined) return 1;
    const xNum = /^\d+$/.test(x);
    const yNum = /^\d+$/.test(y);
    if (xNum && yNum) {
      const d = Number(x) - Number(y);
      if (d !== 0) return d < 0 ? -1 : 1;
    } else if (xNum) {
      return -1; // numeric identifiers rank below alphanumeric
    } else if (yNum) {
      return 1;
    } else if (x < y) {
      return -1;
    } else if (x > y) {
      return 1;
    }
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
  // Reject all non-string types (numeric 0, boolean false, etc.) — version
  // must be a non-empty string. Closes Blind Hunter finding #9 (ag-7-1 review).
  if (typeof version !== 'string' || version === '') {
    let displayed;
    if (version === null) displayed = 'null';
    else if (version === undefined) displayed = 'undefined';
    else if (version === '') displayed = "''";
    else displayed = `${typeof version} (${String(version)})`;
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
