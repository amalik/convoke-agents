'use strict';

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
 *
 * @module scripts/update/lib/config-loader
 *
 * API frozen 2026-04-21 per Story 1A.2 AC9 (FM6-1). Signature changes require a spec amendment.
 */

// --- Public API ---

/**
 * Load a module's config.yaml from the v4 direct-load layout.
 *
 * @param {string} projectRoot - Absolute path to the Convoke project root (from findProjectRoot()).
 * @param {string} moduleConfigPath - Module subdirectory under `_bmad/` (e.g. 'bme/_vortex',
 *   'core', 'bme/_enhance'). Despite the parameter name, this is a directory, not a file path;
 *   the loader appends `/config.yaml` to it. Name retained from architecture Decision 1 API
 *   contract. See audit §4 for naming discussion.
 * @returns {object} Plain JS object from the YAML config, with `{project-root}` resolved.
 * @throws {Error} If the v4 config is missing AND no bmad-init fallback is available, the YAML
 *   is malformed, or the top-level value is not a YAML object.
 */
function loadModuleConfig(projectRoot, moduleConfigPath) {
  const configPath = path.join(projectRoot, '_bmad', moduleConfigPath, 'config.yaml');

  if (!fs.existsSync(configPath)) {
    const legacyInitDir = path.join(projectRoot, '_bmad', 'core', 'bmad-init');
    if (fs.existsSync(legacyInitDir)) {
      console.warn(
        `[DEPRECATED] bmad-init detected at ${legacyInitDir}. ` +
        `Run 'convoke-update' to migrate to the v4 direct-load layout. ` +
        `Support for bmad-init is removed in Convoke 4.1.`
      );
      return _loadLegacyConfig(projectRoot, moduleConfigPath);
    }
    throw new Error(
      `Config not found: ${configPath}. Run 'convoke-install' to bootstrap this project.`
    );
  }

  const raw = fs.readFileSync(configPath, 'utf8');
  const doc = yaml.parseDocument(raw);

  if (doc.errors.length) {
    throw new Error(
      `YAML parse error in ${configPath}: ${doc.errors[0].message}`
    );
  }
  if (doc.warnings.length) {
    console.warn(`YAML warning in ${configPath}: ${doc.warnings[0].message}`);
  }

  const parsed = doc.toJSON();
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error(
      `Config file must be a YAML object (dict/map at top level): ${configPath}`
    );
  }

  return _resolveProjectRootPlaceholder(parsed, projectRoot);
}

// --- Internal helpers ---

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
 * @param {string} projectRoot - Absolute path to the project root.
 * @param {string} moduleConfigPath - Module subpath (passed through to `--module`).
 * @returns {object} Parsed config from the legacy Python loader, with `{project-root}` resolved.
 * @throws {Error} If python3 is missing, the subprocess exits non-zero, stdout is not
 *   parseable JSON, or the 30-second timeout expires. Error messages always include
 *   a "run convoke-update" hint — if the fallback breaks, the operator must migrate.
 */
function _loadLegacyConfig(projectRoot, moduleConfigPath) {
  const bmadInitPath = path.join(
    projectRoot,
    '_bmad', 'core', 'bmad-init', 'scripts', 'bmad_init.py'
  );

  let stdout;
  try {
    stdout = execFileSync(
      'python3',
      [bmadInitPath, 'load', '--all', '--module', moduleConfigPath, '--project-root', projectRoot],
      { encoding: 'utf8', timeout: 30000 }
    );
  } catch (err) {
    // execFileSync throws on non-zero exit, spawn failure, or timeout.
    // err.status, err.stderr, err.signal are attached by node when available.
    const stderrText = (err && err.stderr) ? String(err.stderr).trim() : '';
    const statusInfo = err && err.status != null ? ` (exit ${err.status})` : '';
    const signalInfo = err && err.signal ? ` (signal ${err.signal})` : '';
    throw new Error(
      `Legacy bmad-init fallback failed${statusInfo}${signalInfo}: ${stderrText || err.message}. ` +
      `Run 'convoke-update' to migrate off bmad-init.`
    );
  }

  let parsed;
  try {
    parsed = JSON.parse(stdout);
  } catch (err) {
    throw new Error(
      `Legacy bmad-init fallback returned non-JSON stdout: ${err.message}. ` +
      `Run 'convoke-update' to migrate off bmad-init.`
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
