'use strict';

/**
 * @module scripts/update/lib/compat-preflight
 *
 * Story v63-3-2 (Epic 3 / FR23): runtime BMAD-version compatibility
 * preflight check. Called from `convoke-install`, `convoke-install-gyre`,
 * and `convoke-update` entry points BEFORE any filesystem writes.
 *
 * Detection strategy (BUG-20, operator ruling 2026-11-04 — supersedes Decision 1):
 *   1. Read BMAD's own install record, `_bmad/_config/manifest.yaml`: the
 *      `core` module's `version`, else `installation.version`. This is where
 *      `npx bmad-method install` records what it installed.
 *   2. If that yields no usable version (absent, unreadable, not a regular
 *      file, over the cap, or no value that is a version), read
 *      `node_modules/bmad-method/package.json`.
 *   3. If `>= 6.3.0`: silent pass.
 *   4. If `< 6.3.0`: yellow WARNING with version + upgrade hint; exit 0.
 *   5. If neither source yields a version: yellow WARNING
 *      "BMAD core not detected", naming both — exit 0 (best-effort detection).
 *
 * Why the order. Decision 1 read node_modules only. BMAD's installer never
 * writes there, so on every project where BMAD IS installed the preflight
 * said it was not, and the version floor never ran — including on this
 * repository, which carries BMAD 6.10.0. Convoke still does not depend on
 * `bmad-method` (a parallel extension, not a dependent); node_modules stays
 * as the fallback for a project that does install it as a package.
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
const yaml = require('js-yaml');
const { compareVersions } = require('./utils');

const REQUIRED_BMAD_VERSION = '6.3.0';
const BMAD_PACKAGE_NAME = 'bmad-method';
// R1-M6: cap on `node_modules/bmad-method/package.json` size for the
// version-read scan. A well-formed package.json is well under 100 KB;
// anything past 1 MB is a red flag (corrupted install OR DoS surface for
// unbounded readFileSync). Mirror SKILL_MD_MAX_BYTES from audit-skill-dirs.
const PKG_JSON_MAX_BYTES = 1_000_000;
// BMAD's install record, relative to the project root. The same cap applies. Messages name it
// with forward slashes on every platform; only the filesystem path is built with path.join.
const BMAD_MANIFEST_REL = '_bmad/_config/manifest.yaml';
// A version this module can compare: `N`, `N.N` or `N.N.N`, optionally followed by a
// prerelease (`-rc.1`) or build (`+abc`) suffix, which the floor check strips.
const VERSION_RE = /^\d+(\.\d+){0,2}([-+].*)?$/;

/** BMAD writes external module versions as `v1.21.7`; accept `v`/`V`, and stray spaces, for core too. */
function _normalizeVersion(raw) {
  return typeof raw === 'string' ? raw.trim().replace(/^v\s*/i, '') : '';
}

/**
 * Stat a record file, refusing anything that is not a regular file (a named pipe or a device would
 * block `readFileSync` forever) or that is at or over the size cap.
 * @returns {{ ok: true } | { ok: false, reason: string }}
 */
function _checkRecordFile(filePath, label) {
  let stat;
  try {
    stat = fs.statSync(filePath);
  } catch (err) {
    return { ok: false, reason: `cannot stat ${label}: ${err.message}` };
  }
  if (!stat.isFile()) {
    return { ok: false, reason: `${label} is not a regular file` };
  }
  if (stat.size >= PKG_JSON_MAX_BYTES) {
    // R2-M5: include the limit explicitly so operator + dev agent can
    // see how close they are to the cap (and what to grep for if the
    // cap ever needs raising).
    return { ok: false, reason: `${label} size ${stat.size} >= cap ${PKG_JSON_MAX_BYTES} bytes` };
  }
  return { ok: true };
}

/**
 * Read the BMAD version from BMAD's own install record.
 * @param {string} projectRoot
 * @returns {{ found: boolean, version?: string, reason?: string }}
 */
function _readBmadManifest(projectRoot) {
  const manifestPath = path.join(projectRoot, ...BMAD_MANIFEST_REL.split('/'));
  if (!fs.existsSync(manifestPath)) {
    return { found: false, reason: `no ${BMAD_MANIFEST_REL}` };
  }
  const file = _checkRecordFile(manifestPath, BMAD_MANIFEST_REL);
  if (!file.ok) return { found: false, reason: file.reason };
  let doc;
  try {
    // FAILSAFE keeps every scalar a string: the default schema reads an unquoted `6.10` as the
    // number 6.1 (below the floor), `7` as a number and a bare date as a Date.
    doc = yaml.load(fs.readFileSync(manifestPath, 'utf8'), { schema: yaml.FAILSAFE_SCHEMA });
  } catch (err) {
    return { found: false, reason: `${BMAD_MANIFEST_REL} unparseable: ${err.message.split('\n')[0]}` };
  }
  const modules = doc && Array.isArray(doc.modules) ? doc.modules : [];
  const core = modules.find((m) => m && typeof m === 'object' && m.name === 'core');
  const candidates = [
    ['core', core && core.version],
    ['installation', doc && doc.installation && typeof doc.installation === 'object' ? doc.installation.version : undefined],
  ];
  // A value that is not a version falls through to the next source rather than masking it.
  for (const [, raw] of candidates) {
    const v = _normalizeVersion(raw);
    if (VERSION_RE.test(v)) return { found: true, version: v };
  }
  const seen = candidates.filter(([, raw]) => raw !== undefined)
    .map(([k, raw]) => `${k} ${JSON.stringify(raw)}`);
  return {
    found: false,
    reason: seen.length
      ? `${BMAD_MANIFEST_REL} records no usable version (${seen.join(', ')})`
      : `${BMAD_MANIFEST_REL} records no core or installation version`,
  };
}

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
  const file = _checkRecordFile(pkgPath, 'package.json');
  if (!file.ok) return { found: false, reason: file.reason };
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
  // R2-M1: a placeholder such as `6.3.x` would NaN-fall-through compareVersions as "equal".
  if (!VERSION_RE.test(v)) {
    return { found: false, reason: `package.json version field non-numeric: ${JSON.stringify(v)}` };
  }
  return { found: true, version: v };
}

/** The comparable part of a version that passed VERSION_RE: the suffix is dropped. */
function _cleanVersion(version) {
  return version.split('-')[0].split('+')[0];
}

/**
 * Whether a detected BMAD version is at or above REQUIRED_BMAD_VERSION. Shared with the installers'
 * "BMAD Method found" line, so it cannot show a green check for a version the preflight calls too old.
 * @param {string} version — as returned by detectBmadInstall
 * @returns {boolean}
 */
function meetsBmadFloor(version) {
  return compareVersions(_cleanVersion(version), REQUIRED_BMAD_VERSION) >= 0;
}

/**
 * Find the installed BMAD version, from BMAD's install record first and
 * node_modules second. Writes nothing. A source whose version is not a
 * version (VERSION_RE) counts as not found, so it cannot mask the next one.
 * The installers' "BMAD Method found" line and the preflight both use this
 * and meetsBmadFloor, so the two cannot disagree (BUG-20).
 *
 * @param {string} projectRoot
 * @returns {{ found: boolean, version?: string, source: 'manifest'|'package'|null, reason?: string }}
 */
function detectBmadInstall(projectRoot) {
  const fromManifest = _readBmadManifest(projectRoot);
  if (fromManifest.found) return { ...fromManifest, source: 'manifest' };
  const fromPackage = _readBmadPackageJson(projectRoot);
  if (fromPackage.found) return { ...fromPackage, source: 'package' };
  return { found: false, source: null, reason: `${fromManifest.reason}; ${fromPackage.reason}` };
}

/**
 * Run the FR23 preflight check. Side effect: writes WARNING to stderr
 * when applicable. Returns metadata so callers can introspect (mostly
 * for tests).
 *
 * @param {string} projectRoot
 * @returns {{ detected: boolean, version: string|null, source: 'manifest'|'package'|null, warning: string|null }}
 */
function runCompatPreflight(projectRoot) {
  if (!projectRoot || typeof projectRoot !== 'string') {
    throw new Error('runCompatPreflight: projectRoot must be a non-empty string');
  }

  const probe = detectBmadInstall(projectRoot);
  const { source } = probe;

  if (!probe.found) {
    const msg = `BMAD core not detected (${probe.reason}) — cannot verify v6.3 compatibility; proceeding anyway`;
    process.stderr.write(chalk.yellow(`  ⚠ ${msg}\n`));
    return { detected: false, version: null, source: null, warning: msg };
  }

  // R1-H5: strip pre-release / build-metadata suffix before compareVersions
  // (its naive `Number(part)` makes `"0-rc"` NaN, which falls through as
  // "equal"). R2-M1's non-numeric guard now lives in the readers, as
  // VERSION_RE, so an unusable value falls through to the next source.
  const cleanVersion = _cleanVersion(probe.version);
  if (meetsBmadFloor(probe.version)) {
    // R2-H4: prerelease/build-metadata visible-info WARNING. Per SemVer
    // 2.0.0 §11, prereleases are LESS than their target; our strip
    // approach treats `6.3.0-rc.1` as `6.3.0` for gate purposes, but
    // operators on prerelease builds deserve a visible signal that
    // they're on an unreleased version. Soft-warn (Decision 3) — exit 0,
    // operator can proceed.
    if (probe.version !== cleanVersion) {
      const msg = `BMAD ${probe.version} detected (prerelease/build-metadata; treating as ${cleanVersion} for compat gate)`;
      process.stderr.write(chalk.yellow(`  ⚠ ${msg}\n`));
      return { detected: true, version: probe.version, source, warning: msg };
    }
    return { detected: true, version: probe.version, source, warning: null };
  }

  // A manifest install is upgraded by re-running BMAD's installer; a package install by npm.
  const upgrade = source === 'manifest'
    ? `npx ${BMAD_PACKAGE_NAME}@latest install`
    : `npm install ${BMAD_PACKAGE_NAME}@latest`;
  const msg = `BMAD ${probe.version} detected; Convoke 4.0 requires >= ${REQUIRED_BMAD_VERSION}. Upgrade BMAD core: ${upgrade}`;
  process.stderr.write(chalk.yellow(`  ⚠ ${msg}\n`));
  return { detected: true, version: probe.version, source, warning: msg };
}

module.exports = {
  runCompatPreflight,
  detectBmadInstall,
  meetsBmadFloor,
  REQUIRED_BMAD_VERSION,
  BMAD_PACKAGE_NAME,
  // R2-L5 pattern (from Story 2.3): Object.freeze prevents test-order leaks.
  _internal: Object.freeze({
    _readBmadPackageJson,
    _readBmadManifest,
    PKG_JSON_MAX_BYTES,
  }),
};
