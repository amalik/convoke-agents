'use strict';

/**
 * @module scripts/update/lib/compat-preflight
 *
 * Story v63-3-2 (Epic 3 / FR23): runtime BMAD-version compatibility
 * preflight check. Called from `convoke-install`, `convoke-install-gyre`,
 * and `convoke-update` entry points BEFORE any filesystem writes.
 *
 * Detection strategy (Decision 1, pinned in story spec):
 *   1. Read `node_modules/bmad-method/package.json` `version` field.
 *   2. If `>= 6.3.0`: silent pass.
 *   3. If `< 6.3.0`: yellow WARNING with version + upgrade hint; exit 0.
 *   4. If absent / unparseable / missing version field: yellow WARNING
 *      "BMAD core not detected" — exit 0 (best-effort detection).
 *
 * Critical caveat: Convoke does NOT depend on `bmad-method` in its own
 * package.json (it's a parallel BMAD extension, not a dependent), so the
 * absent-package WARNING is the ONLY path that fires on Convoke's own dev
 * machine + most CI runners. Live smoke (Task 8.4) verifies the WARNING
 * appears; mocked node_modules fixtures verify the version-present
 * branches.
 *
 * Soft-warn design (Decision 3, pinned): preflight ALWAYS continues the
 * install/update flow (exit 0 pass-through). FR23 says "emits version
 * warning"; literal interpretation. False-positive hard-blocks would trap
 * operators with legitimate non-standard installs. Harder gates ship in
 * Story 3.3 (publish-gate) + Story 4.x (behavioral-equivalence).
 */

const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const { compareVersions } = require('./utils');

const REQUIRED_BMAD_VERSION = '6.3.0';
const BMAD_PACKAGE_NAME = 'bmad-method';
// R1-M6: cap on `node_modules/bmad-method/package.json` size for the
// version-read scan. A well-formed package.json is well under 100 KB;
// anything past 1 MB is a red flag (corrupted install OR DoS surface for
// unbounded readFileSync). Mirror SKILL_MD_MAX_BYTES from audit-skill-dirs.
const PKG_JSON_MAX_BYTES = 1_000_000;

/**
 * Read the BMAD package.json and return the parsed `version` field.
 * @param {string} projectRoot
 * @returns {{ found: boolean, version?: string, reason?: string }}
 */
function _readBmadPackageJson(projectRoot) {
  const pkgPath = path.join(projectRoot, 'node_modules', BMAD_PACKAGE_NAME, 'package.json');
  if (!fs.existsSync(pkgPath)) {
    return { found: false, reason: 'package not in node_modules' };
  }
  // R1-M6: size guard before unbounded readFileSync — corrupted/hostile
  // package.json that's multi-GB would block the event loop or OOM.
  let stat;
  try {
    stat = fs.statSync(pkgPath);
  } catch (err) {
    return { found: false, reason: `cannot stat package.json: ${err.message}` };
  }
  if (stat.size >= PKG_JSON_MAX_BYTES) {
    // R2-M5: include the limit explicitly so operator + dev agent can
    // see how close they are to the cap (and what to grep for if the
    // cap ever needs raising).
    return { found: false, reason: `package.json size ${stat.size} >= cap ${PKG_JSON_MAX_BYTES} bytes` };
  }
  let parsed;
  try {
    parsed = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  } catch (err) {
    return { found: false, reason: `package.json unparseable: ${err.message}` };
  }
  if (!parsed || typeof parsed !== 'object') {
    return { found: false, reason: 'package.json is not an object' };
  }
  const v = parsed.version;
  if (typeof v !== 'string' || v.trim() === '' || v === 'undefined' || v === 'null') {
    return { found: false, reason: `version field invalid: ${JSON.stringify(v)}` };
  }
  return { found: true, version: v };
}

/**
 * Run the FR23 preflight check. Side effect: writes WARNING to stderr
 * when applicable. Returns metadata so callers can introspect (mostly
 * for tests).
 *
 * @param {string} projectRoot
 * @returns {{ detected: boolean, version: string|null, warning: string|null }}
 */
function runCompatPreflight(projectRoot) {
  if (!projectRoot || typeof projectRoot !== 'string') {
    throw new Error('runCompatPreflight: projectRoot must be a non-empty string');
  }

  const probe = _readBmadPackageJson(projectRoot);

  if (!probe.found) {
    const msg = `BMAD core not detected (${probe.reason}) — cannot verify v6.3 compatibility; proceeding anyway`;
    process.stderr.write(chalk.yellow(`  ⚠ ${msg}\n`));
    return { detected: false, version: null, warning: msg };
  }

  // R1-H5 + R2-M1: strip pre-release / build-metadata suffix before
  // compareVersions. utils.js's `compareVersions` uses naive `Number(part)`
  // which yields NaN for parts like `"0-rc"` — NaN comparisons fall
  // through to `return 0` ("equal"), so `6.3.0-rc.1` would silently pass
  // as `>= 6.3.0`. Strip the suffix to avoid the NaN trap.
  // R2-M1: validate the stripped string is purely numeric `N(.N){0,2}`.
  // Rejects placeholder `"6.3.x"` or other non-numeric components that
  // would otherwise silently fall through `compareVersions` as "equal".
  const cleanVersion = probe.version.split('-')[0].split('+')[0];
  if (!/^\d+(\.\d+){0,2}$/.test(cleanVersion)) {
    const msg = `BMAD core not detected (version field non-numeric after strip: ${JSON.stringify(probe.version)} → ${JSON.stringify(cleanVersion)}) — cannot verify v6.3 compatibility; proceeding anyway`;
    process.stderr.write(chalk.yellow(`  ⚠ ${msg}\n`));
    return { detected: false, version: probe.version, warning: msg };
  }
  const cmp = compareVersions(cleanVersion, REQUIRED_BMAD_VERSION);
  if (cmp >= 0) {
    // R2-H4: prerelease/build-metadata visible-info WARNING. Per SemVer
    // 2.0.0 §11, prereleases are LESS than their target; our strip
    // approach treats `6.3.0-rc.1` as `6.3.0` for gate purposes, but
    // operators on prerelease builds deserve a visible signal that
    // they're on an unreleased version. Soft-warn (Decision 3) — exit 0,
    // operator can proceed.
    if (probe.version !== cleanVersion) {
      const msg = `BMAD ${probe.version} detected (prerelease/build-metadata; treating as ${cleanVersion} for compat gate)`;
      process.stderr.write(chalk.yellow(`  ⚠ ${msg}\n`));
      return { detected: true, version: probe.version, warning: msg };
    }
    return { detected: true, version: probe.version, warning: null };
  }

  const msg = `BMAD ${probe.version} detected; Convoke 4.0 requires >= ${REQUIRED_BMAD_VERSION}. Upgrade BMAD core: npm install ${BMAD_PACKAGE_NAME}@latest`;
  process.stderr.write(chalk.yellow(`  ⚠ ${msg}\n`));
  return { detected: true, version: probe.version, warning: msg };
}

module.exports = {
  runCompatPreflight,
  REQUIRED_BMAD_VERSION,
  BMAD_PACKAGE_NAME,
  // R2-L5 pattern (from Story 2.3): Object.freeze prevents test-order leaks.
  _internal: Object.freeze({
    _readBmadPackageJson,
  }),
};
