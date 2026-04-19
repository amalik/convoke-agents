'use strict';

const path = require('path');
const fs = require('fs-extra');
const os = require('os');
const yaml = require('js-yaml');
const { execFile } = require('node:child_process');

const { AGENT_IDS, WORKFLOW_NAMES } = require('../scripts/update/lib/agent-registry');
const pkg = require('../package.json');

const PACKAGE_ROOT = path.join(__dirname, '..');

// ─── Temp Directory ──────────────────────────────────────────────

/**
 * Create an isolated temp directory for a test suite.
 * @param {string} prefix - Short prefix (e.g. 'convoke-val-')
 * @returns {Promise<string>} Absolute path to temp dir
 */
async function createTempDir(prefix = 'convoke-test-') {
  return fs.mkdtemp(path.join(os.tmpdir(), prefix));
}

// ─── Config Factories ────────────────────────────────────────────

/**
 * Build a complete, valid Vortex config.
 * All agents + workflows are sourced from the registry.
 * Version tracks package.json to satisfy project-context.md rule
 * "no-hardcoded-versions" — callers needing a specific historical version
 * should override via `fullConfig({ version: '1.3.8' })`.
 */
function fullConfig(overrides = {}) {
  return {
    submodule_name: '_vortex',
    description: 'Vortex Pattern',
    module: 'bme',
    version: pkg.version,
    output_folder: '{project-root}/_bmad-output/vortex-artifacts',
    agents: [...AGENT_IDS],
    workflows: [...WORKFLOW_NAMES],
    ...overrides
  };
}

/** v1.0.x installation config (deprecated agent names). */
function v1_0_x_config(overrides = {}) {
  return {
    version: '1.0.5',
    agents: ['empathy-mapper', 'wireframe-designer'],
    workflows: ['empathy-map', 'wireframe'],
    ...overrides
  };
}

/** v1.3.x installation config (Emma + Wade only). */
function v1_3_x_config(overrides = {}) {
  return {
    version: '1.3.8',
    submodule_name: 'vortex',
    description: 'test',
    module: 'bme',
    output_folder: '_bmad-output/vortex-artifacts',
    agents: ['contextualization-expert', 'lean-experiments-specialist'],
    workflows: ['lean-persona'],
    ...overrides
  };
}

/** v1.4.x installation config (Emma + Wade, 7 workflows). */
function v1_4_x_config(overrides = {}) {
  return {
    version: '1.4.1',
    submodule_name: 'vortex',
    description: 'test',
    module: 'bme',
    output_folder: '_bmad-output/vortex-artifacts',
    agents: ['contextualization-expert', 'lean-experiments-specialist'],
    workflows: [
      'lean-persona', 'product-vision', 'contextualize-scope',
      'mvp', 'lean-experiment', 'proof-of-concept', 'proof-of-value'
    ],
    ...overrides
  };
}

// ─── Installation Builders ───────────────────────────────────────

/**
 * Create a fully valid current-version installation in a temp dir.
 * All agents, workflows, and config sourced from registry.
 */
async function createValidInstallation(tmpDir) {
  const vortexDir = path.join(tmpDir, '_bmad/bme/_vortex');
  const agentsDir = path.join(vortexDir, 'agents');
  const workflowsDir = path.join(vortexDir, 'workflows');

  await fs.ensureDir(agentsDir);

  const config = fullConfig();
  await fs.writeFile(path.join(vortexDir, 'config.yaml'), yaml.dump(config), 'utf8');

  // Agent files (all from registry)
  for (const agentId of AGENT_IDS) {
    await fs.writeFile(path.join(agentsDir, `${agentId}.md`), `# ${agentId}`, 'utf8');
  }

  // Workflow dirs with workflow.md
  for (const wf of config.workflows) {
    const wfDir = path.join(workflowsDir, wf);
    await fs.ensureDir(wfDir);
    await fs.writeFile(path.join(wfDir, 'workflow.md'), `# ${wf}`, 'utf8');
  }

  return vortexDir;
}

/**
 * Create a valid installation, then override its version.
 * Useful for simulating an older installation for migration tests.
 */
async function createInstallation(tmpDir, version) {
  const { refreshInstallation } = require('../scripts/update/lib/refresh-installation');
  await fs.ensureDir(path.join(tmpDir, '_bmad'));
  await refreshInstallation(tmpDir, { backupGuides: false, verbose: false });

  const configPath = path.join(tmpDir, '_bmad/bme/_vortex/config.yaml');
  const config = yaml.load(fs.readFileSync(configPath, 'utf8'));
  config.version = version;
  fs.writeFileSync(configPath, yaml.dump(config), 'utf8');
}

// ─── CLI Runner ──────────────────────────────────────────────────

/**
 * Run a Node script as a child process and capture output.
 * @param {string} script - Absolute path to script
 * @param {string[]} [args=[]] - CLI arguments
 * @param {object} [opts={}] - Options: cwd, timeout
 * @returns {Promise<{exitCode: number, stdout: string, stderr: string, timedOut: boolean, signal: string | null}>}
 *
 * Return-shape notes (I64):
 *   - `exitCode` is always a finite integer. On timeout the child is killed
 *     (SIGTERM by default) and `err.code` is `null`; on spawn failure `err.code`
 *     is a string like `'ENOENT'`. Both cases previously leaked out as
 *     `exitCode: null` / `exitCode: 'ENOENT'` and produced opaque assertions.
 *     We now coerce any non-integer err.code (null, string, undefined) to 1
 *     so `exitCode === 0` assertions fail with an actionable numeric mismatch,
 *     and the caller can distinguish timeout from other error classes via
 *     the `timedOut` / `signal` fields.
 *   - `timedOut` is true iff execFile killed the child for exceeding `timeout`.
 *     Keyed on `err.killed` (not signal name) so an operator-overridden
 *     `killSignal` still reports correctly.
 *   - `signal` is the signal that killed the child (e.g., 'SIGTERM') or null.
 */
function runScript(script, args = [], opts = {}) {
  const cwd = opts.cwd || PACKAGE_ROOT;
  const timeout = opts.timeout || 15000;

  return new Promise((resolve) => {
    execFile('node', [script, ...args], { cwd, timeout }, (err, stdout, stderr) => {
      // `err.killed` is the authoritative "Node killed the child" flag — it is
      // set iff execFile's own timeout mechanism called `child.kill()`. The
      // caller has no handle to the child, so external signals that happen to
      // also produce SIGTERM cannot be confused with Node's kill here.
      const timedOut = !!(err && err.killed);
      const signal = (err && err.signal) || null;
      // `err.code` is the child's numeric exit code when the process exited
      // normally with non-zero. On spawn failure (ENOENT / EACCES / …) Node
      // sets it to a string like 'ENOENT'; coerce any non-integer to 1 so the
      // contract "exitCode is always a finite integer" holds.
      const exitCode = err ? (Number.isInteger(err.code) ? err.code : 1) : 0;
      resolve({ exitCode, stdout, stderr, timedOut, signal });
    });
  });
}

// ─── Console Silencing ───────────────────────────────────────────

const _origLog = console.log;
const _origWarn = console.warn;
const _origError = console.error;

function silenceConsole() {
  console.log = () => {};
  console.warn = () => {};
  console.error = () => {};
}

function restoreConsole() {
  console.log = _origLog;
  console.warn = _origWarn;
  console.error = _origError;
}

// ─── Exports ─────────────────────────────────────────────────────

module.exports = {
  PACKAGE_ROOT,
  createTempDir,
  fullConfig,
  v1_0_x_config,
  v1_3_x_config,
  v1_4_x_config,
  createValidInstallation,
  createInstallation,
  runScript,
  silenceConsole,
  restoreConsole
};
