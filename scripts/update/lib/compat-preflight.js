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
// A version this module can compare: `N`, `N.N` or `N.N.N`; a prerelease (`-rc.1`) or build
// (`+abc`) suffix only after a full `N.N.N`, and never empty. Both readers apply it, so a value that
// is not a version is "not found" in that source and the next one is read.
const VERSION_RE = /^\d+(\.\d+){0,2}$|^\d+\.\d+\.\d+[-+][0-9A-Za-z.+-]+$/;
// Longest value quoted back in a message; the 1 MB cap alone would let a near-1 MB value through.
const QUOTE_MAX = 60;

// The manifest is parsed with the default YAML types — so explicit tags (`!!timestamp`), merge keys
// (`<<: *anchor`) and nulls resolve as usual — except that numbers and dates keep their source text.
// The default schema reads an unquoted `6.10` as the number 6.1, which is below the floor; a pure
// FAILSAFE schema avoids that but rejects the whole file at any explicit tag (BUG-20 Round 2).
// Accepted limit (Round 3): a tag no type here resolves (`!foo`, or `!!int 6.3.0`) still makes the
// whole file unparseable — the preflight falls back to node_modules and warns. BMAD writes no tags.
const _asText = (type) => new yaml.Type(type.tag, { kind: 'scalar', resolve: type.resolve, construct: (data) => data });
const MANIFEST_SCHEMA = yaml.FAILSAFE_SCHEMA.extend({
  implicit: [yaml.types.null, yaml.types.bool, _asText(yaml.types.int), _asText(yaml.types.float),
    _asText(yaml.types.timestamp), yaml.types.merge],
  explicit: [yaml.types.binary, yaml.types.omap, yaml.types.pairs, yaml.types.set],
});

/** BMAD writes external module versions as `v1.21.7`; accept `v`/`V`, and stray spaces, in both sources. */
function _normalizeVersion(raw) {
  return typeof raw === 'string' ? raw.trim().replace(/^v\s*/i, '') : '';
}

/**
 * Name a value for a message without serialising it: a YAML alias can make it circular or
 * exponentially large, and `JSON.stringify` on either throws (BUG-20 Round 2).
 */
function _describe(raw) {
  if (typeof raw === 'string') {
    return JSON.stringify(raw.length > QUOTE_MAX ? `${raw.slice(0, QUOTE_MAX)}…` : raw);
  }
  if (raw === null) return 'empty';
  // js-yaml 4 builds `!!binary` as a Uint8Array (a Buffer is one too).
  if (raw instanceof Uint8Array) return 'binary data';
  if (Array.isArray(raw)) return 'a list';
  return typeof raw === 'object' ? 'a map' : typeof raw;
}

/**
 * Read a record file through one open handle, refusing anything that is not a regular file (a named
 * pipe or a device would block a read forever) or that is at or over the size cap. Checking and
 * reading the same descriptor leaves no window for the path to be swapped in between; the open is
 * non-blocking, so opening a pipe does not wait for a writer either. The cap is enforced on the bytes
 * actually read as well, so a file that grows after the check is still refused (BUG-20 Round 3).
 * @returns {{ ok: true, text: string } | { ok: false, reason: string }}
 */
function _readRecordFile(filePath, label) {
  let fd;
  try {
    fd = fs.openSync(filePath, fs.constants.O_RDONLY | (fs.constants.O_NONBLOCK || 0));
  } catch (err) {
    if (err.code === 'EISDIR') return { ok: false, reason: `${label} is not a regular file` };
    return { ok: false, reason: `cannot open ${label}: ${err.message}` };
  }
  try {
    const stat = fs.fstatSync(fd);
    if (!stat.isFile()) {
      return { ok: false, reason: `${label} is not a regular file` };
    }
    if (stat.size >= PKG_JSON_MAX_BYTES) {
      // R2-M5: include the limit explicitly so operator + dev agent can
      // see how close they are to the cap (and what to grep for if the
      // cap ever needs raising).
      return { ok: false, reason: `${label} size ${stat.size} >= cap ${PKG_JSON_MAX_BYTES} bytes` };
    }
    const buf = Buffer.alloc(PKG_JSON_MAX_BYTES);
    let total = 0;
    let n;
    while (total < buf.length && (n = fs.readSync(fd, buf, total, buf.length - total, null)) > 0) {
      total += n;
    }
    if (total >= PKG_JSON_MAX_BYTES) {
      return { ok: false, reason: `${label} grew to >= cap ${PKG_JSON_MAX_BYTES} bytes while being read` };
    }
    return { ok: true, text: buf.toString('utf8', 0, total) };
  } catch (err) {
    return { ok: false, reason: `cannot read ${label}: ${err.message}` };
  } finally {
    // A failed close must not replace a result already read (BUG-20 Round 3).
    try { fs.closeSync(fd); } catch { /* nothing to do */ }
  }
}

/**
 * Read the BMAD version from BMAD's own install record.
 * @param {string} projectRoot
 * @returns {{ found: boolean, version?: string, reason?: string }}
 */
function _readBmadManifest(projectRoot) {
  const manifestPath = path.join(projectRoot, ...BMAD_MANIFEST_REL.split('/'));
  if (!fs.existsSync(manifestPath)) {
    return { found: false, present: false, reason: `no ${BMAD_MANIFEST_REL}` };
  }
  const file = _readRecordFile(manifestPath, BMAD_MANIFEST_REL);
  if (!file.ok) return { found: false, reason: file.reason };
  let doc;
  try {
    doc = yaml.load(file.text, { schema: MANIFEST_SCHEMA });
  } catch (err) {
    return { found: false, reason: `${BMAD_MANIFEST_REL} unparseable: ${err.message.split('\n')[0]}` };
  }
  const modules = doc && Array.isArray(doc.modules) ? doc.modules : [];
  // The first `core` entry is the one read; BMAD writes one.
  const core = modules.find((m) => m && typeof m === 'object' && m.name === 'core');
  const installation = doc && doc.installation && typeof doc.installation === 'object' ? doc.installation : null;
  const candidates = [
    ['core', core ? core.version : undefined],
    ['installation', installation ? installation.version : undefined],
  ];
  // Core first, then installation.version; a value that is not a version is passed over.
  for (const [, raw] of candidates) {
    const v = _normalizeVersion(raw);
    if (VERSION_RE.test(v)) return { found: true, version: v };
  }
  const seen = candidates.filter(([, raw]) => raw !== undefined).map(([k, raw]) => `${k} ${_describe(raw)}`);
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
    return { found: false, present: false, reason: 'package not in node_modules' };
  }
  // R1-M6: size guard before reading — corrupted/hostile package.json that's
  // multi-GB would block the event loop or OOM.
  const file = _readRecordFile(pkgPath, 'package.json');
  if (!file.ok) return { found: false, reason: file.reason };
  let parsed;
  try {
    parsed = JSON.parse(file.text);
  } catch (err) {
    return { found: false, reason: `package.json unparseable: ${err.message}` };
  }
  if (!parsed || typeof parsed !== 'object') {
    return { found: false, reason: 'package.json is not an object' };
  }
  const raw = parsed.version;
  if (typeof raw !== 'string' || raw.trim() === '') {
    return { found: false, reason: `version field invalid: ${raw === undefined ? 'missing' : _describe(raw)}` };
  }
  // R2-M1: a placeholder such as `6.3.x` is not a version and must not be compared.
  const v = _normalizeVersion(raw);
  if (!VERSION_RE.test(v)) {
    return { found: false, reason: `package.json version field non-numeric: ${_describe(raw)}` };
  }
  return { found: true, version: v };
}

/** The comparable part of a version that passed VERSION_RE: the suffix is dropped. */
function _cleanVersion(version) {
  return version.split('-')[0].split('+')[0];
}

/**
 * Whether a BMAD version is at or above REQUIRED_BMAD_VERSION. A prerelease is compared as its
 * release (`6.3.0-rc.1` as `6.3.0`), which runCompatPreflight then notes (R2-H4).
 * @param {string} version
 * @returns {boolean}
 */
function meetsBmadFloor(version) {
  // Anything that is not a version fails the floor, rather than comparing as 0 or throwing.
  if (typeof version !== 'string' || !VERSION_RE.test(version)) return false;
  return compareVersions(_cleanVersion(version), REQUIRED_BMAD_VERSION) >= 0;
}

/**
 * Find the installed BMAD version, from BMAD's install record first and
 * node_modules second. Writes nothing. A source whose version is not a
 * version (VERSION_RE) counts as not found there, and the next one is read.
 *
 * @param {string} projectRoot
 * @returns {{ found: boolean, version?: string, source: 'manifest'|'package'|null, reason?: string, present?: boolean }}
 *   `present` (when not found): whether either record exists at all, readable or not.
 */
function detectBmadInstall(projectRoot) {
  const fromManifest = _readBmadManifest(projectRoot);
  if (fromManifest.found) return { ...fromManifest, source: 'manifest' };
  const fromPackage = _readBmadPackageJson(projectRoot);
  if (fromPackage.found) return { ...fromPackage, source: 'package' };
  return {
    found: false,
    source: null,
    present: fromManifest.present !== false || fromPackage.present !== false,
    reason: `${fromManifest.reason}; ${fromPackage.reason}`,
  };
}

/**
 * Run the FR23 preflight check. Side effect: writes WARNING to stderr
 * when applicable. Returns metadata so callers can introspect (mostly
 * for tests).
 *
 * @param {string} projectRoot
 * @returns {{ detected: boolean, version: string|null, source: 'manifest'|'package'|null, warning: string|null, recordPresent: boolean }}
 *   `recordPresent`: an install record exists, even if no version could be read from it.
 */
function runCompatPreflight(projectRoot) {
  if (!projectRoot || typeof projectRoot !== 'string') {
    throw new Error('runCompatPreflight: projectRoot must be a non-empty string');
  }

  // preflight-soft-warn: never throw to the caller. The readers already turn every expected failure
  // into a reason; this catch is what makes that hold for an unexpected one too (BUG-20 Round 2).
  let probe;
  try {
    probe = detectBmadInstall(projectRoot);
  } catch (err) {
    let detail;
    try { detail = String(err && err.message).slice(0, 200); } catch { detail = 'unreadable error'; }
    // Unknown whether a record exists; "not determined" is the honest wording either way.
    probe = { found: false, source: null, present: true, reason: `detection failed: ${detail}` };
  }
  const { source } = probe;

  if (!probe.found) {
    const msg = `BMAD core not detected (${probe.reason}) — cannot verify v6.3 compatibility; proceeding anyway`;
    process.stderr.write(chalk.yellow(`  ⚠ ${msg}\n`));
    return { detected: false, version: null, source: null, warning: msg, recordPresent: probe.present };
  }

  // The floor compares a prerelease as its release (R2-H4, below). compareVersions
  // itself orders `6.3.0-rc.1` below `6.3.0`, per SemVer §11; the strip is the choice.
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
      return { detected: true, version: probe.version, source, warning: msg, recordPresent: true };
    }
    return { detected: true, version: probe.version, source, warning: null, recordPresent: true };
  }

  // A manifest install is upgraded by re-running BMAD's installer; a package install by npm.
  const upgrade = source === 'manifest'
    ? `npx ${BMAD_PACKAGE_NAME}@latest install`
    : `npm install ${BMAD_PACKAGE_NAME}@latest`;
  const msg = `BMAD ${probe.version} detected; Convoke 4.0 requires >= ${REQUIRED_BMAD_VERSION}. Upgrade BMAD core: ${upgrade}`;
  process.stderr.write(chalk.yellow(`  ⚠ ${msg}\n`));
  return { detected: true, version: probe.version, source, warning: msg, recordPresent: true };
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
