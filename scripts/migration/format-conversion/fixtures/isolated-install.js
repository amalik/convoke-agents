'use strict';

/**
 * @module scripts/migration/format-conversion/fixtures/isolated-install
 *
 * Shared utility for creating an isolated 4.x BMAD/Convoke install in a tmpDir
 * for harness tests. Honors the `test-fixture-isolation` rule (NFR4) — every
 * harness invocation runs against this isolated install rather than
 * PACKAGE_ROOT.
 *
 * Authored by: Story i97-1.1 (Migration Tooling Foundation Scaffolded).
 * Round 1 code-review patches applied 2026-05-01:
 *   - P1: agentRoleName whitelist regex (path-traversal protection).
 *   - P2: tmpDir safety preconditions (must be under os.tmpdir() AND empty).
 *   - P18: silent-skip on missing module.yaml/workflows/config.yaml only
 *     when defaulted; explicit-true requests now throw on missing source.
 *   - P24: real cleanup that removes the install subtree (the previous
 *     no-op cleanup was confusing — callers reading the API thought it
 *     did work).
 *   - P27: `fs.copySync({ dereference: false })` so symlinks in the
 *     source tree are preserved as symlinks in the copy (not silently
 *     dereferenced).
 *
 * **Round 2 code-review patches applied 2026-05-02:**
 *   - R2-P6: `dereference: false` reverted → `dereference: true`. Round 1
 *     P27's symlink-preservation introduces a fixture-isolation hazard:
 *     a preserved symlink in `tmpDir` still points at the source tree, so
 *     a test mutating the "fixture" silently mutates the real source.
 *     `dereference: true` copies real bytes — fixtures are properly
 *     isolated. The Round 1 concern (silent dereference surprise) is
 *     better addressed by documenting the bytes-copy contract explicitly.
 *   - R2-P10: agentRoleName regex tightened to disallow trailing /
 *     consecutive hyphens.
 *
 * Derives from ADR-003 (three harnesses with shared fixture pattern).
 * Reusable for I98 (Gyre) and I99 (Team Factory) per NFR18.
 */

const fs = require('fs-extra');
const os = require('os');
const path = require('path');

const VORTEX_AGENTS_REL = '_bmad/bme/_vortex/agents';
const VORTEX_MODULE_YAML_REL = '_bmad/bme/_vortex/module.yaml';
const VORTEX_WORKFLOWS_REL = '_bmad/bme/_vortex/workflows';
const VORTEX_CONFIG_YAML_REL = '_bmad/bme/_vortex/config.yaml';
const PACKAGE_JSON_REL = 'package.json';

// Whitelist regex for agentRoleName — Round 1 review patch P1.
const AGENT_ROLE_NAME_RE = /^[a-z0-9](?:[a-z0-9]|-(?=[a-z0-9]))*$/;

// Symbol used to detect when the caller explicitly passed `true` for
// includeWorkflows / includeModuleYaml vs accepted the default (Round 1
// review patch P18 — distinguishes "I want this; throw if missing" from
// "include if available").
const COPY_OPT_DEFAULT = Symbol('default');

// Standard cp options across all copies. `dereference: true` copies real
// bytes (Round 2 review patch R2-P6) — preserves fixture isolation: a
// test mutating a file under `installRoot` cannot leak through a symlink
// to the source tree.
const COPY_OPTS = { dereference: true, errorOnExist: false, overwrite: true };

// ─── Public API ─────────────────────────────────────────────────────

/**
 * Create an isolated 4.x Convoke install in tmpDir.
 *
 * @param {Object} options
 * @param {string} options.tmpDir              Absolute path to an empty tmp
 *                                              directory. Must be under
 *                                              `os.tmpdir()` (Round 1
 *                                              review patch P2 — prevents
 *                                              accidentally using a real
 *                                              project root and having
 *                                              cleanup destroy user files).
 * @param {string} options.sourceProjectRoot   Absolute path to the source
 *                                              project.
 * @param {string[]} options.agentRoleNamesToInclude  Array of agent role-name
 *                                              directories to copy.
 *                                              Each must match
 *                                              `/^[a-z0-9](?:[a-z0-9]|-(?=[a-z0-9]))*$/`
 *                                              (Round 1 review patch P1).
 * @param {boolean} [options.includeWorkflows]  If true (default), include
 *                                              `_bmad/bme/_vortex/workflows/`.
 *                                              Explicit `true` throws if
 *                                              source is missing; default
 *                                              `true` silently skips
 *                                              (Round 1 review patch P18).
 * @param {boolean} [options.includeModuleYaml]  Same semantics for
 *                                              `module.yaml`.
 * @returns {{ installRoot: string, cleanup: () => void }}
 */
function setupIsolatedInstall(options) {
  if (!options || typeof options !== 'object') {
    throw new TypeError('setupIsolatedInstall: options object is required');
  }
  const {
    tmpDir,
    sourceProjectRoot,
    agentRoleNamesToInclude,
  } = options;
  // Per P18: track whether the caller explicitly passed includeWorkflows /
  // includeModuleYaml or accepted the default. If explicit-true, missing
  // source throws; if default, missing source silently skips.
  const includeWorkflows = Object.prototype.hasOwnProperty.call(options, 'includeWorkflows')
    ? options.includeWorkflows
    : COPY_OPT_DEFAULT;
  const includeModuleYaml = Object.prototype.hasOwnProperty.call(options, 'includeModuleYaml')
    ? options.includeModuleYaml
    : COPY_OPT_DEFAULT;

  if (typeof tmpDir !== 'string' || tmpDir.length === 0) {
    throw new TypeError('setupIsolatedInstall: options.tmpDir must be a non-empty string');
  }
  if (typeof sourceProjectRoot !== 'string' || sourceProjectRoot.length === 0) {
    throw new TypeError('setupIsolatedInstall: options.sourceProjectRoot must be a non-empty string');
  }
  if (!Array.isArray(agentRoleNamesToInclude) || agentRoleNamesToInclude.length === 0) {
    throw new TypeError('setupIsolatedInstall: options.agentRoleNamesToInclude must be a non-empty array');
  }

  // Round 1 review patch P2: tmpDir safety preconditions.
  // (a) Must resolve to a path under os.tmpdir() (canonical Node tmp).
  const realTmp = fs.realpathSync(os.tmpdir());
  let realTmpDir;
  try {
    realTmpDir = fs.realpathSync(tmpDir);
  } catch (err) {
    throw new Error(`setupIsolatedInstall: cannot stat tmpDir '${tmpDir}': ${err.message}`, { cause: err });
  }
  if (!realTmpDir.startsWith(realTmp + path.sep) && realTmpDir !== realTmp) {
    throw new Error(`setupIsolatedInstall: tmpDir '${tmpDir}' is not under os.tmpdir() (resolved: ${realTmpDir} vs ${realTmp}). Refusing to write — use setupTmpDir() to create a safe path.`);
  }
  // (b) Must be empty before any writes (so accidental misuse can't
  // overwrite user files).
  let existing;
  try {
    existing = fs.readdirSync(realTmpDir);
  } catch (err) {
    throw new Error(`setupIsolatedInstall: cannot read tmpDir '${tmpDir}': ${err.message}`, { cause: err });
  }
  if (existing.length > 0) {
    throw new Error(`setupIsolatedInstall: tmpDir '${tmpDir}' is not empty (contains ${existing.length} entries). Refusing to write to a non-empty directory.`);
  }

  // Validate each agent role-name (Round 1 review patch P1).
  for (const roleName of agentRoleNamesToInclude) {
    if (typeof roleName !== 'string' || roleName.length === 0) {
      throw new TypeError(`setupIsolatedInstall: agentRoleNamesToInclude contains invalid entry: ${JSON.stringify(roleName)}`);
    }
    if (!AGENT_ROLE_NAME_RE.test(roleName)) {
      throw new TypeError(`setupIsolatedInstall: agent role-name '${roleName}' must match ${AGENT_ROLE_NAME_RE.source}`);
    }
  }

  // Track files written so the real cleanup (P24) can undo them. We use
  // path-set semantics: at cleanup time, remove the entire install subtree
  // under tmpDir.
  const writtenPaths = [];

  // Ensure the destination agents directory exists.
  const destAgentsDir = path.join(tmpDir, VORTEX_AGENTS_REL);
  fs.ensureDirSync(destAgentsDir);
  writtenPaths.push(destAgentsDir);

  // Copy each requested agent dir.
  for (const roleName of agentRoleNamesToInclude) {
    const srcAgentDir = path.join(sourceProjectRoot, VORTEX_AGENTS_REL, roleName);
    const destAgentDir = path.join(destAgentsDir, roleName);
    if (!fs.existsSync(srcAgentDir)) {
      throw new Error(`setupIsolatedInstall: source agent directory not found: ${srcAgentDir}`);
    }
    fs.copySync(srcAgentDir, destAgentDir, COPY_OPTS);
    writtenPaths.push(destAgentDir);
  }

  // Module.yaml — semantics per P18.
  if (includeModuleYaml === true || includeModuleYaml === COPY_OPT_DEFAULT) {
    const srcModuleYaml = path.join(sourceProjectRoot, VORTEX_MODULE_YAML_REL);
    const exists = fs.existsSync(srcModuleYaml);
    if (!exists && includeModuleYaml === true) {
      throw new Error(`setupIsolatedInstall: includeModuleYaml=true but source not found at ${srcModuleYaml}`);
    }
    if (exists) {
      const destModuleYaml = path.join(tmpDir, VORTEX_MODULE_YAML_REL);
      fs.ensureDirSync(path.dirname(destModuleYaml));
      fs.copySync(srcModuleYaml, destModuleYaml, COPY_OPTS);
      writtenPaths.push(destModuleYaml);
    }
  }

  // Workflows — semantics per P18.
  if (includeWorkflows === true || includeWorkflows === COPY_OPT_DEFAULT) {
    const srcWorkflows = path.join(sourceProjectRoot, VORTEX_WORKFLOWS_REL);
    const exists = fs.existsSync(srcWorkflows);
    if (!exists && includeWorkflows === true) {
      throw new Error(`setupIsolatedInstall: includeWorkflows=true but source not found at ${srcWorkflows}`);
    }
    if (exists) {
      const destWorkflows = path.join(tmpDir, VORTEX_WORKFLOWS_REL);
      fs.copySync(srcWorkflows, destWorkflows, COPY_OPTS);
      writtenPaths.push(destWorkflows);
    }
  }

  // Always copy config.yaml if present (most agents activation-error if
  // absent). Default-include (no explicit option), so silent-skip on
  // missing.
  const srcConfig = path.join(sourceProjectRoot, VORTEX_CONFIG_YAML_REL);
  if (fs.existsSync(srcConfig)) {
    const destConfig = path.join(tmpDir, VORTEX_CONFIG_YAML_REL);
    fs.ensureDirSync(path.dirname(destConfig));
    fs.copySync(srcConfig, destConfig, COPY_OPTS);
    writtenPaths.push(destConfig);
  }

  // Always copy package.json (so `getPackageVersion()` resolves correctly).
  const srcPackage = path.join(sourceProjectRoot, PACKAGE_JSON_REL);
  if (fs.existsSync(srcPackage)) {
    const destPackage = path.join(tmpDir, PACKAGE_JSON_REL);
    fs.copySync(srcPackage, destPackage, COPY_OPTS);
    writtenPaths.push(destPackage);
  }

  // Real cleanup (Round 1 review patch P24) — removes everything we
  // wrote into tmpDir. The caller's setupTmpDir cleanup also removes the
  // tmpDir itself; this cleanup is for finer-grained per-fixture-cleanup
  // (e.g., reseed the same tmpDir between multiple test cases).
  const cleanup = function cleanup() {
    for (const p of writtenPaths.reverse()) {
      try {
        fs.removeSync(p);
      } catch (err) {
        // Best-effort — surface but don't throw.
        console.warn(`[isolated-install] cleanup(${p}) failed: ${err.message}`);
      }
    }
  };

  return { installRoot: tmpDir, cleanup };
}

module.exports = {
  setupIsolatedInstall,
};
