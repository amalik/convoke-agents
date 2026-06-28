'use strict';

/*
 * PROVENANCE (2026-06-28): NOT dead code, despite zero production consumers today.
 * RESERVED for v4.1 Epic E4 "Managed Currency" — the read primitive for cadence
 * state in _bmad/_config/cadence.yaml (AD1). Idle until v4.1, which is
 * `depends: I97 close (v4.0 ship)`. See docs/codebase-audit-2026-06-27.md (#20).
 * OPEN QUESTION OQ-1 (arch §AD1 / I113 backlog row): AD1 says cadence is "read via
 * config-loader" but AD8 says only cadence-state.js touches the file, and this
 * frozen API hardcodes the filename `config.yaml` — resolve at v4.1 sprint-planning
 * before wiring (blocks E4 Story 1.1).
 */

const fs = require('fs-extra');
const path = require('path');
const yaml = require('yaml');
const { execFileSync } = require('node:child_process');

/**
 * Config Loader for Convoke (Story v63-1a-2)
 *
 * Replaces the legacy `bmad-init` skill's load path with a direct-YAML utility.
 * Reads `_bmad/{moduleConfigPath}/config.yaml`, resolves the `{project-root}`
 * placeholder, and returns the parsed object. Backwards-compat: if the v4
 * config is missing but the legacy `_bmad/core/bmad-init/` directory exists,
 * emits a deprecation warning and shells out to `bmad_init.py` (removed in 4.1).
 *
 * Scope — what this module does NOT do (intentional, see audit
 * _bmad-output/planning-artifacts/convoke-spec-bmad-init-behavior-audit.md):
 *   - NO project-root detection (caller passes projectRoot; use findProjectRoot() from utils.js).
 *   - NO module.yaml reading (bootstrap concern, belongs to convoke-install).
 *   - NO config writing.
 *   - NO core/module merge logic (configs are already flat with core vars merged in).
 *   - NO CLI flags (`--all`, `--vars`, `--module`) — library API, not CLI.
 *   - NO `{user}` placeholder resolution (Convoke-bme activation convention handled by agents).
 *   - NO recursion into nested objects/arrays during `{project-root}` resolution (top-level strings only).
 *
 * @module scripts/update/lib/config-loader
 *
 * API frozen 2026-04-21 per Story 1A.2 AC9 (FM6-1). Signature changes require a spec amendment.
 * A test at tests/lib/config-loader.test.js pins the public surface (exports + arity).
 */

const WARN_PREFIX = '[config-loader]';
const SUBPROCESS_TIMEOUT_MS = 30000;
const SUBPROCESS_MAX_BUFFER = 10 * 1024 * 1024; // 10 MB

// --- Public API ---

/**
 * Load a module's config.yaml from the v4 direct-load layout.
 *
 * @param {string} projectRoot - Absolute path to the Convoke project root (from findProjectRoot()).
 *   Non-empty string required. Trailing separators are normalized away before resolution.
 * @param {string} moduleConfigPath - Module subdirectory under `_bmad/` (e.g. 'bme/_vortex',
 *   'core', 'bme/_enhance'). Non-empty relative string required. Absolute paths and paths
 *   containing `..` segments that escape `_bmad/` are rejected with a traversal-guard error.
 *   Despite the parameter name, this is a directory, not a file path; the loader appends
 *   `/config.yaml` to it. Name retained from architecture Decision 1 API contract.
 * @returns {object} Plain JS object from the YAML config, with `{project-root}` resolved at
 *   top-level string values. Non-string top-level values and nested structures pass through.
 * @throws {TypeError} if `projectRoot` or `moduleConfigPath` is not a non-empty string.
 * @throws {Error} if `moduleConfigPath` would escape `_bmad/` (traversal); if the v4 config
 *   is missing AND no `_bmad/core/bmad-init/` fallback is present; if `readFileSync` hits a
 *   permission / directory / other IO error; if the YAML is malformed; if the top-level value
 *   is not a YAML object (null, array, scalar); if the legacy subprocess fallback fails
 *   (non-zero exit, ENOENT, timeout, non-JSON output, non-object JSON).
 */
function loadModuleConfig(projectRoot, moduleConfigPath) {
  if (typeof projectRoot !== 'string' || !projectRoot) {
    throw new TypeError(
      `loadModuleConfig: projectRoot must be a non-empty string (got ${_describeType(projectRoot)})`
    );
  }
  if (typeof moduleConfigPath !== 'string' || !moduleConfigPath) {
    throw new TypeError(
      `loadModuleConfig: moduleConfigPath must be a non-empty string (got ${_describeType(moduleConfigPath)})`
    );
  }

  // Normalize trailing separator so placeholder resolution + path join behave predictably.
  const normalizedRoot = projectRoot.replace(/[\\/]+$/, '');

  // Re-validate after normalization: projectRoot='/' (or '\\\\' / '//') normalizes to '',
  // which would then resolve against process.cwd() — a silent wrong-project load. Also
  // enforce the JSDoc contract that projectRoot is an absolute path; a caller passing
  // a relative path would otherwise silently anchor to cwd with no warning.
  if (!normalizedRoot) {
    throw new TypeError(
      'loadModuleConfig: projectRoot must be a non-empty absolute path (normalized to empty string)'
    );
  }
  if (!path.isAbsolute(normalizedRoot)) {
    throw new TypeError(
      `loadModuleConfig: projectRoot must be an absolute path (got '${projectRoot}')`
    );
  }

  // Path-traversal guard — two layers:
  //   (1) Reject absolute paths explicitly (path.join's absolute-segment handling varies by
  //       platform: Unix silently strips leading `/`; Windows handles drive letters specially).
  //   (2) After resolving, assert the final path stays under `_bmad/` to catch `..` escape.
  //
  // Note: both checks are LEXICAL only. Symlinks inside `_bmad/` that point outside are
  // NOT detected by this guard — they are treated as trusted operator-managed state.
  // If future requirements demand symlink-escape protection, wrap `bmadRoot` with
  // `fs.realpathSync()` before the startsWith check; out of scope for 4.0.
  if (path.isAbsolute(moduleConfigPath)) {
    throw new Error(
      `loadModuleConfig: moduleConfigPath '${moduleConfigPath}' escapes _bmad/ scope ` +
      `(absolute paths are not allowed).`
    );
  }
  const bmadRoot = path.resolve(normalizedRoot, '_bmad');
  const configPath = path.join(bmadRoot, moduleConfigPath, 'config.yaml');
  const resolvedConfigPath = path.resolve(configPath);
  if (!resolvedConfigPath.startsWith(bmadRoot + path.sep)) {
    throw new Error(
      `loadModuleConfig: moduleConfigPath '${moduleConfigPath}' escapes _bmad/ scope ` +
      `(resolved to ${resolvedConfigPath}, which is outside ${bmadRoot}).`
    );
  }

  // TOCTOU-free read: skip existsSync, branch on err.code from readFileSync itself.
  let raw;
  try {
    raw = fs.readFileSync(configPath, 'utf8');
  } catch (err) {
    if (err && err.code === 'ENOENT') {
      return _handleMissingConfig(normalizedRoot, moduleConfigPath, configPath);
    }
    if (err && err.code === 'EACCES') {
      throw new Error(
        `Cannot read ${configPath}: permission denied (EACCES). Check file permissions.`,
        { cause: err }
      );
    }
    if (err && err.code === 'EISDIR') {
      throw new Error(
        `Cannot read ${configPath}: path is a directory, not a file.`,
        { cause: err }
      );
    }
    const codeTag = err && err.code ? `${err.code} ` : '';
    throw new Error(
      `Cannot read ${configPath}: ${codeTag}${(err && err.message) || 'unknown error'}`.trim(),
      { cause: err }
    );
  }

  const doc = yaml.parseDocument(raw);

  if (doc.errors.length) {
    // Collapse embedded newlines in each error message so the bulleted `\n  - ` prefix
    // stays attached to each entry rather than breaking at inner newlines.
    const messages = doc.errors.map(e => e.message.replace(/\s*\n\s*/g, ' ')).join('\n  - ');
    const label = doc.errors.length > 1
      ? `YAML parse errors (${doc.errors.length})`
      : 'YAML parse error';
    throw new Error(`${label} in ${configPath}:\n  - ${messages}`);
  }
  if (doc.warnings.length) {
    console.warn(
      `${WARN_PREFIX} YAML warning in ${configPath}: ${doc.warnings[0].message}`
    );
  }

  const parsed = doc.toJSON();
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error(
      `Config file must be a YAML object (dict/map at top level): ${configPath}`
    );
  }

  return _resolveProjectRootPlaceholder(parsed, normalizedRoot);
}

// --- Internal helpers ---

function _describeType(value) {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  if (value === '') return "''";
  return `${typeof value}`;
}

function _handleMissingConfig(normalizedRoot, moduleConfigPath, configPath) {
  const legacyInitDir = path.join(normalizedRoot, '_bmad', 'core', 'bmad-init');
  if (fs.existsSync(legacyInitDir)) {
    console.warn(
      `${WARN_PREFIX} [DEPRECATED] bmad-init detected at ${legacyInitDir}. ` +
      `Run 'convoke-update' to migrate to the v4 direct-load layout. ` +
      `Support for bmad-init is removed in Convoke 4.1.`
    );
    return _loadLegacyConfig(normalizedRoot, moduleConfigPath);
  }
  throw new Error(
    `Config not found: ${configPath}. Run 'convoke-install' to bootstrap this project.`
  );
}

/**
 * Replace `{project-root}` in every top-level string value with the actual path.
 * Returns a new object — does NOT mutate the input (clone-then-mutate pattern,
 * prevents test-mocking surprises per Story 1A.2 Task 2.3 recommendation).
 *
 * Nested objects/arrays pass through unchanged by reference — out of scope
 * for 4.0 per audit §5. If a future config ships nested strings with
 * `{project-root}`, extend this helper recursively as a separate change.
 *
 * Other placeholders (notably `{user}` in some Convoke-bme configs) are NOT
 * resolved here — they're activation-time conventions handled by the agent.
 *
 * @param {object} config - Parsed YAML object (plain JS dict).
 * @param {string} projectRoot - Absolute path to substitute for `{project-root}`.
 *   Trailing separators should already be normalized by the caller.
 * @returns {object} New object with placeholders resolved in top-level string values.
 */
function _resolveProjectRootPlaceholder(config, projectRoot) {
  const out = { ...config };
  for (const key of Object.keys(out)) {
    const value = out[key];
    if (typeof value === 'string' && value.includes('{project-root}')) {
      out[key] = value.replaceAll('{project-root}', projectRoot);
    }
  }
  return out;
}

/**
 * Load config via the legacy `bmad-init` Python script — backwards-compat
 * fallback for pre-4.0 installs. Invoked only when the v4 config.yaml is
 * missing but `_bmad/core/bmad-init/` is still present. Removed in Convoke 4.1.
 *
 * **Pattern 3 exception:** this helper consumes the legacy script's stdout as
 * JSON; it does NOT use `yaml.parseDocument` because the Python loader already
 * parsed the YAML (via `yaml.safe_load`) and emitted the result as JSON. The
 * YAML-safety guarantees therefore come from Python, not from JS — an
 * acknowledged departure from the loader's native Pattern 3 compliance.
 * See audit §Anti-Drift Compliance Walk for the full rationale.
 *
 * Distinguishes five subprocess failure modes with distinct error messages:
 *   - `err.code === 'ENOENT'` → python3 missing from PATH
 *   - `err.signal === 'SIGTERM'` → `SUBPROCESS_TIMEOUT_MS` exceeded (30s default)
 *   - `err.signal === 'SIG*' other` → killed by signal (OOM / SIGPIPE / etc.)
 *   - `!fs.existsSync(bmadInitPath)` → script missing (pre-check, not a catch path)
 *   - non-zero exit → Python script failed (stderr surfaced)
 *
 * @param {string} projectRoot - Absolute path to the project root (trailing-slash-normalized).
 * @param {string} moduleConfigPath - Module subpath (passed through to `--module`).
 * @returns {object} Parsed config from the legacy Python loader, with `{project-root}` resolved.
 * @throws {Error} If python3 is missing (ENOENT), subprocess exits non-zero, script is missing,
 *   stdout is not parseable JSON, top-level JSON is not an object, or the
 *   `SUBPROCESS_TIMEOUT_MS` timeout expires. Error messages always include a
 *   `"run convoke-update"` hint — if the fallback breaks, the operator must migrate.
 */
function _loadLegacyConfig(projectRoot, moduleConfigPath) {
  const bmadInitPath = path.join(
    projectRoot, '_bmad', 'core', 'bmad-init', 'scripts', 'bmad_init.py'
  );

  if (!fs.existsSync(bmadInitPath)) {
    throw new Error(
      `bmad-init directory present but script missing at ${bmadInitPath}. ` +
      `Run 'convoke-update' to repair or migrate off bmad-init.`
    );
  }

  let stdout;
  try {
    stdout = execFileSync(
      'python3',
      [bmadInitPath, 'load', '--all', '--module', moduleConfigPath, '--project-root', projectRoot],
      {
        encoding: 'utf8',
        timeout: SUBPROCESS_TIMEOUT_MS,
        maxBuffer: SUBPROCESS_MAX_BUFFER,
        stdio: ['ignore', 'pipe', 'pipe'],
      }
    );
  } catch (err) {
    if (err && err.code === 'ENOENT') {
      throw new Error(
        `python3 not found on PATH. Install Python 3 or run 'convoke-update' to migrate off bmad-init.`,
        { cause: err }
      );
    }
    if (err && err.signal === 'SIGTERM') {
      throw new Error(
        `Legacy bmad-init fallback exceeded ${SUBPROCESS_TIMEOUT_MS / 1000}s timeout. ` +
        `Run 'convoke-update' to migrate off bmad-init.`,
        { cause: err }
      );
    }
    // Catch other signals (SIGKILL from OOM, SIGPIPE, etc.) with a distinct message so
    // the operator doesn't see a confusing "(exit null)" for a signal-killed process.
    if (err && err.signal) {
      throw new Error(
        `Legacy bmad-init fallback killed by signal ${err.signal}. ` +
        `Run 'convoke-update' to migrate off bmad-init.`,
        { cause: err }
      );
    }
    const stderrText = (err && err.stderr) ? String(err.stderr).trim() : '';
    const statusInfo = err && err.status != null ? ` (exit ${err.status})` : '';
    throw new Error(
      `Legacy bmad-init fallback failed${statusInfo}: ${stderrText || (err && err.message) || 'unknown error'}. ` +
      `Run 'convoke-update' to migrate off bmad-init.`,
      { cause: err }
    );
  }

  let parsed;
  try {
    parsed = JSON.parse(stdout);
  } catch (err) {
    throw new Error(
      `Legacy bmad-init fallback returned non-JSON stdout: ${err.message}. ` +
      `Run 'convoke-update' to migrate off bmad-init.`,
      { cause: err }
    );
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error(
      `Legacy bmad-init fallback returned non-object value. ` +
      `Run 'convoke-update' to migrate off bmad-init.`
    );
  }

  return _resolveProjectRootPlaceholder(parsed, projectRoot);
}

// --- Exports ---

module.exports = { loadModuleConfig };
