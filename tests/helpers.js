'use strict';

const path = require('path');
const fs = require('fs-extra');
const os = require('os');
const yaml = require('js-yaml');
const { execFile, execFileSync } = require('node:child_process');
const nodeFs = require('node:fs');
const nodeFsPromises = require('node:fs/promises');

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

/**
 * Recursive-remove options used by both temp-dir removers.
 *
 * fs-extra's `remove()` is `fs.rm({ recursive, force })` with `maxRetries`
 * DEFAULTED TO 0, so the first ENOTEMPTY is fatal. CI run 32115225495 lost
 * three jobs (test(20), test(22), coverage) to exactly that, in an afterEach:
 *
 *   ENOTEMPTY: directory not empty, rmdir '/tmp/convoke-inject-XXXXXX/.git/objects'
 *
 * Node retries ENOTEMPTY/EBUSY/EPERM with a LINEAR backoff — `retryDelay`
 * longer on each attempt — so 10 x 50ms is roughly a 2.75s tolerance window,
 * not 500ms.
 */
const TEMP_RM_OPTS = { recursive: true, force: true, maxRetries: 10, retryDelay: 50 };

/** Cap on entries named in a teardown-failure message. */
const SURVIVOR_LIMIT = 40;

/**
 * List what is still inside `dir`, for a teardown-failure message.
 *
 * Hand-walked rather than `readdirSync(dir, { recursive: true })` because that
 * option needs Node >= 20.1 and package.json declares `node: >=18.0.0` — CI
 * still runs an 18 matrix leg.
 *
 * @param {string} dir
 * @returns {string} Comma-joined relative paths, capped, or a reason it could not be read.
 */
function _listSurvivors(dir) {
  const found = [];
  // Tracked explicitly rather than inferred from `found.length === SURVIVOR_LIMIT`:
  // a tree holding exactly SURVIVOR_LIMIT entries is complete, not truncated, and
  // a listing that lies about being capped defeats the point of listing at all.
  let truncated = false;
  const walk = (current, rel) => {
    if (found.length >= SURVIVOR_LIMIT) { truncated = true; return; }
    let entries;
    try {
      entries = nodeFs.readdirSync(current, { withFileTypes: true });
    } catch (err) {
      found.push(`${rel || '.'} <unreadable: ${err.code || err.message}>`);
      return;
    }
    for (const entry of entries) {
      if (found.length >= SURVIVOR_LIMIT) { truncated = true; return; }
      const relPath = rel ? `${rel}/${entry.name}` : entry.name;
      found.push(relPath);
      if (entry.isDirectory()) walk(path.join(current, entry.name), relPath);
    }
  };
  walk(dir, '');
  if (found.length === 0) return '<nothing listed>';
  return found.join(', ') + (truncated ? `, ... (capped at ${SURVIVOR_LIMIT})` : '');
}

/**
 * Annotate a teardown failure with what survived, then rethrow.
 *
 * The race this guards against is not reproducible on a developer machine —
 * 300 local iterations of init + 2 commits + zero-retry rmSync produced zero
 * failures. So the next occurrence has to arrive carrying its own diagnosis,
 * or it costs another investigation to find out who the writer was.
 */
function _rethrowWithSurvivors(err, dir) {
  err.message = `${err.message}\n  survivors under ${dir}: ${_listSurvivors(dir)}`;
  throw err;
}

/**
 * Refuse to recursively force-delete anything that is not under the OS temp dir.
 *
 * `project-context.md` rule `path-safety-for-destructive-ops`: a destructive op
 * taking a caller-supplied path must resolve, normalise and contain-check it.
 * These removers run `{ recursive: true, force: true }`, so an `undefined` that
 * became `'undefined'`, a relative path, or a typo is one call away from deleting
 * real work. Refusing costs nothing — every legitimate caller is a `mkdtemp` path.
 *
 * @param {string} dir
 * @throws {Error} when `dir` is relative, or resolves outside (or exactly onto) the temp root.
 */
function _assertRemovableTempPath(dir) {
  if (!path.isAbsolute(dir)) {
    throw new Error(`removeTempDir refuses a relative path: ${JSON.stringify(dir)}`);
  }
  const resolved = path.resolve(dir);
  // Both spellings of the temp root: macOS reports `/var/folders/...` from
  // os.tmpdir() but `/private/var/folders/...` once realpath'd, and callers may
  // hold either form.
  const roots = new Set([os.tmpdir()]);
  try {
    roots.add(nodeFs.realpathSync(os.tmpdir()));
  } catch {
    // Non-existent or unreadable temp root — the raw value is still a usable prefix.
  }
  const contained = [...roots].some((root) => resolved.startsWith(root.endsWith(path.sep) ? root : root + path.sep));
  if (!contained) {
    throw new Error(
      `removeTempDir refuses a path outside the OS temp directory (${os.tmpdir()}): ${resolved}`
    );
  }
}

/**
 * Remove a temp directory, tolerating a concurrent writer.
 *
 * Use this in `afterEach`/`after` instead of `fs.remove(tmpDir)`.
 *
 * @param {string|undefined} dir - Absolute path; falsy is a no-op.
 * @returns {Promise<void>}
 */
async function removeTempDir(dir) {
  if (!dir) return;
  _assertRemovableTempPath(dir);
  try {
    await nodeFsPromises.rm(dir, TEMP_RM_OPTS);
  } catch (err) {
    _rethrowWithSurvivors(err, dir);
  }
}

/**
 * Synchronous form of {@link removeTempDir}, for suites whose hooks are sync.
 *
 * @param {string|undefined} dir - Absolute path; falsy is a no-op.
 * @returns {void}
 */
function removeTempDirSync(dir) {
  if (!dir) return;
  _assertRemovableTempPath(dir);
  try {
    nodeFs.rmSync(dir, TEMP_RM_OPTS);
  } catch (err) {
    _rethrowWithSurvivors(err, dir);
  }
}

/**
 * Initialise a git repo inside `dir` for use as a test fixture.
 *
 * WHY THIS EXISTS, AND WHY THE CONFIG IS REPO-LOCAL
 * -------------------------------------------------
 * `git commit` calls run_auto_maintenance(), which forks
 * `git maintenance run --auto --no-quiet --detach` — a DETACHED child that
 * outlives the parent execFileSync and keeps working inside `.git/objects`.
 * That child is what races teardown. Confirmed with GIT_TRACE=1 (git 2.50.1),
 * one commit per row:
 *
 *   (no config)              -> spawns the child
 *   gc.auto=0                -> STILL SPAWNS. A decoy: it only makes the child
 *                               decline to gc once it is already running in
 *                               .git/objects. Do not use it for this.
 *   maintenance.auto=false   -> no spawn
 *
 * Repo-local, not wrapped around the caller's own git invocations: the code
 * under test (scripts/lib/artifact-utils.js — executeRenames, executeInjections)
 * runs its OWN `git commit` inside this directory, and only repo-local config
 * reaches those.
 *
 * @param {string} dir - Absolute path to an existing directory.
 * @returns {string} `dir`, for chaining.
 */
function initGitFixture(dir) {
  // Without this, a falsy or relative `dir` makes execFileSync inherit the
  // process cwd — so `git config maintenance.auto false` would be written into
  // the DEVELOPER'S OWN repository rather than a fixture.
  if (!dir || !path.isAbsolute(dir)) {
    throw new TypeError(
      `initGitFixture requires an absolute directory path; got ${JSON.stringify(dir)}`
    );
  }
  if (!nodeFs.existsSync(dir) || !nodeFs.statSync(dir).isDirectory()) {
    throw new Error(`initGitFixture requires an existing directory; got ${dir}`);
  }
  const git = (args) => {
    try {
      return execFileSync('git', args, { cwd: dir, stdio: 'pipe' });
    } catch (err) {
      // execFileSync's default message is a bare "Command failed", which throws
      // away the one thing that explains the failure.
      const stderr = err.stderr ? String(err.stderr).trim() : '';
      throw new Error(
        `initGitFixture: \`git ${args.join(' ')}\` failed in ${dir}` +
          (stderr ? `: ${stderr}` : ` (${err.code || err.message})`),
        { cause: err }
      );
    }
  };
  git(['init', '-q']);
  git(['config', 'user.email', 'test@test.com']);
  git(['config', 'user.name', 'Test']);
  git(['config', 'maintenance.auto', 'false']);
  return dir;
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

  // Agent files (all from registry) — Story v63-3-1: Vortex migrated to
  // skill-dir layout (`<agentId>/SKILL.md`) per BMAD v6.3 convention.
  // Minimal v6.3-compliant frontmatter so the fixture matches real layout.
  for (const agentId of AGENT_IDS) {
    const skillDir = path.join(agentsDir, agentId);
    await fs.ensureDir(skillDir);
    await fs.writeFile(
      path.join(skillDir, 'SKILL.md'),
      `---\nname: ${agentId}\ndescription: test fixture ${agentId}\n---\n\n# ${agentId}\n`,
      'utf8'
    );
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
  removeTempDir,
  removeTempDirSync,
  initGitFixture,
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
