#!/usr/bin/env node
'use strict';

// Cross-platform replacement for POSIX shell glob expansion in `npm test` scripts.
// For each passed directory, recursively walks and collects `*.test.js` files, then
// invokes `node --test` with the explicit file list. Works identically on cmd.exe,
// PowerShell, bash, and zsh — no shell-glob expansion required, no runtime deps.
//
// Discovery semantics: ANY `*.test.js` file under a passed root (at any depth) is
// executed. `node_modules` and dot-prefixed dirs (.git, .nyc_output, coverage, etc.)
// are skipped. Fixtures and snapshot files that should NOT run must avoid the
// `.test.js` suffix.
//
// Why not `node --test <dir>`? Directory-argument recursion was added in Node 22.6.0;
// Convoke's engines floor is `>=18.0.0`, so dir-args fail on Node 18/20. This helper
// is the Node-version-independent path until/unless the engines floor is bumped.
// See IN-65 in the initiative-lifecycle backlog for the engines-bump follow-up.

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { tapFailureLines, supportsReporters, SIDE_CHANNEL_PREFIX } = require('./lib/t66-gate');

function walk(root) {
  const out = [];
  let entries;
  try {
    entries = fs.readdirSync(root, { withFileTypes: true });
  } catch (err) {
    if (err.code === 'ENOTDIR') {
      console.error(`expected a directory, got a file: ${root}`);
    } else {
      console.error(`cannot read ${root}: ${err.code || err.message}`);
    }
    process.exit(2);
  }
  for (const entry of entries) {
    const full = path.join(root, entry.name);
    // Skip node_modules and dot-prefixed dirs. Dirent.isDirectory() is false for
    // symlinks, so symlinked subdirs are also skipped — no cycle risk.
    if (entry.isDirectory() && entry.name !== 'node_modules' && !entry.name.startsWith('.')) {
      out.push(...walk(full));
    } else if (entry.isFile() && entry.name.endsWith('.test.js')) {
      out.push(full);
    }
  }
  return out;
}

const roots = process.argv.slice(2);
if (roots.length === 0) {
  console.error('usage: node scripts/test-runner.js <test-dir>...');
  process.exit(2);
}

const files = roots.flatMap(walk);
if (files.length === 0) {
  console.error(`No *.test.js files found under: ${roots.join(', ')}`);
  process.exit(2);
}

// Use process.execPath (not bare 'node') so the child runs the same binary as the
// parent — avoids PATH-resolution ambiguity under nvm/Volta/Windows node.exe shims.
// NODE_V8_COVERAGE (set by c8 when wrapping this process) propagates via inherited
// env to the child, which is how `npm run test:coverage` captures coverage across
// the two-level spawn chain. Do not pass { env: ... } here without preserving it.
// T66: node:test hides one specific teardown failure, on SOME versions. A failing
// `afterEach` fails its test and exits non-zero; a failing FILE-level `after` also
// exits non-zero. But an `after` inside a `describe` prints a `✖`, reports `fail 0`,
// and exits 0.
//
// The version boundary is real and was found the hard way, by CI: Node 18 and 20 fail
// such a run natively; Node 22 and 25 do not. So this gate is a no-op on the older
// legs and load-bearing on the newer ones — it must never assume which. That is why
// it only consults the side channel when the child exited 0. A broken suite teardown therefore ships green, which is exactly how a real
// regression survived three "green" verifications during T61.
//
// The TAP reporter DOES emit `not ok` for such a suite, so we run two reporters: a
// human one to stdout (pinned to `spec` — see below, this is a deliberate format
// change, not a preservation), and TAP to a side file we inspect.

/** Notes to repeat after the run, where they are actually read. */
const deferredNotes = [];

const args = ['--test'];
let tapPath = null;
let tapDir = null;
let reportersOk = false;
let versionUnparseable = false;
try {
  reportersOk = supportsReporters();
} catch (err) {
  versionUnparseable = true;
  // Degrade, do not abort: the gate is an add-on, and on 18.x/20.x node catches the
  // defect natively anyway. Killing `npm test` over an unreadable version string
  // would be a far worse outcome than running without the gate.
  deferredNotes.push(`${err.message}; the T66 gate is off.`);
}
if (reportersOk) {
  // Private directory rather than a predictable filename: `convoke-test-runner-<pid>`
  // in a shared /tmp can already exist as a stale file, a symlink pointing elsewhere,
  // or another run's live file when two runners share a PID namespace.
  try {
    tapDir = fs.mkdtempSync(path.join(os.tmpdir(), 'convoke-test-runner-'));
    tapPath = path.join(tapDir, 'run.tap');
  } catch (err) {
    // Read-only /tmp, a bogus TMPDIR, a hardened runner. Without this the CHILD dies
    // on open() before running a single test — a verification helper must not turn a
    // writable tmpdir into a prerequisite for running the suite.
    tapDir = null;
    tapPath = null;
    deferredNotes.push(
      `cannot create the T66 side channel (${err.code || err.message}); ` +
        'describe-scoped after() hook failures were NOT detected.'
    );
  }
  // Specifying any reporter replaces node:test's defaults, so the human stream has
  // to be named explicitly. `spec` is chosen deliberately rather than mirroring the
  // default: that default varies by Node version (measured — Node 20 piped emits TAP,
  // Node 25 piped emits spec), so CI logs currently change format across the matrix.
  // Pinning spec makes output identical on every leg. Nothing parses it — CI runs
  // `npm test` and uploads the output as an artifact.
  args.push('--test-reporter', 'spec', '--test-reporter-destination', 'stdout');
  if (tapPath) {
    args.push('--test-reporter', 'tap', '--test-reporter-destination', tapPath);
  }
} else if (!versionUnparseable) {
  deferredNotes.push(
    `node ${process.versions.node} predates --test-reporter (needs 18.15+ or 19.6+), ` +
      'so the T66 gate is off. Believed harmless here: node fails a describe-scoped ' +
      'after() throw natively on 18.x and 20.x, and the blind spot appears on 22+. ' +
      'The 19.x range was never measured.'
  );
}
args.push(...files);

// NOTE (T67 item b): a SIGINT/SIGTERM handler to reap the side channel was tried and
// REVERTED. spawnSync blocks the event loop, so the handler can never run — but
// registering it removes the default disposition, and a SIGTERM to this process is
// then swallowed entirely (measured: exit 0 and the suite runs to completion, versus
// 143 without). An un-killable test runner is worse than a leaked temp dir. Ctrl-C is
// unaffected: it signals the process group, the child dies, and the result.signal
// branch below handles it. The leak on a group-external kill remains open.
const result = spawnSync(process.execPath, args, { stdio: 'inherit' });

/** Read the TAP side channel. Returns [] when there is no side channel to read. */
function readTapFailures() {
  if (!tapPath) return [];
  try {
    return tapFailureLines(fs.readFileSync(tapPath, 'utf8'));
  } catch (err) {
    // Fail CLOSED: returning [] would silently disable the guard — a check reporting
    // success because it could not run.
    console.error(`T66 side channel unreadable (${err.code || err.message}) — treating as failure.`);
    return [`${SIDE_CHANNEL_PREFIX} unreadable`];
  }
}

/**
 * Exit, printing any deferred notes first.
 *
 * Notes previously printed on the normal path only, so a red run whose gate never ran
 * lost the one line saying the gate never ran. Routing every post-spawn exit through
 * here means a new exit path cannot silently drop them.
 *
 * @param {number} code
 */
function finish(code) {
  cleanupTap();
  for (const note of deferredNotes) console.error(`note: ${note}`);
  process.exit(code);
}

/** Remove the private side-channel directory. Safe to call more than once. */
function cleanupTap() {
  if (!tapDir) return;
  try {
    fs.rmSync(tapDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 20 });
  } catch {
    // Best effort — never fail a run over the side channel's cleanup.
  }
}

// The spawn-level outcomes are checked FIRST: on a spawn error or a signal kill the
// side channel is absent or half-written, and reading it there would replace a clear
// diagnostic with a confusing one. Cleanup runs on every path except a gate-fired one
// with a readable report, which is retained on purpose.
if (result.error) {
  console.error(`failed to spawn ${process.execPath}: ${result.error.message}`);
  finish(1);
}
if (result.signal) {
  // POSIX convention: killed by signal N → exit 128 + N (SIGTERM=143, SIGKILL=137).
  // Preserves CI debug info vs. collapsing all signals to a bare 128.
  finish(128 + (os.constants.signals[result.signal] ?? 0));
}

if ((result.status ?? 1) !== 0) {
  finish(result.status ?? 1);
}

const tapFailures = readTapFailures();
if (tapFailures.length > 0) {
  console.error(
    `\nnode:test exited 0 but the T66 side channel reported ${tapFailures.length} problem(s). ` +
      'Lines beginning `not ok` are verbatim from the TAP reporter (column-0 only, so ' +
      'nested failures are not double-counted); lines beginning `not ok - T66` are this ' +
      "runner's own, describing the side channel rather than a test. " +
      'The known cause is an `after` hook inside a `describe`, but do not assume it:'
  );
  for (const line of tapFailures) console.error(`  ${line}`);
  // Do not advertise a report that could not be read — the unreadable path is exactly
  // when the file is absent or unopenable, and pointing the operator at it wastes their
  // time and leaks a stale dir for nothing.
  // Any synthetic marker means the side channel itself is the problem — unreadable OR
  // incomplete — so there is no report worth advertising or keeping. R3-6: keyed off
  // the shared SIDE_CHANNEL_PREFIX rather than one message string, so editing a message
  // (e.g. appending an errno) cannot silently invert this.
  const reportUsable = tapFailures.every((l) => !l.startsWith(SIDE_CHANNEL_PREFIX));
  if (reportUsable) {
    // Deliberately NOT reaped on this path: the TAP YAML block is the only record of
    // why the hook threw, and node:test printed nothing about it. Leaving it is the
    // point of the mechanism; a temp file is a small price for a debuggable failure.
    console.error(`\n  full TAP report retained at: ${tapPath}`);
    console.error('  (not reaped automatically — delete it when you are done with it)');
  }
  // Deliberately NOT finish(): that calls cleanupTap(), which would delete the report
  // the line above advertised as retained. Notes are still printed, so a future note
  // that can coexist with a live side channel cannot be silently dropped here.
  for (const note of deferredNotes) console.error(`note: ${note}`);
  if (!reportUsable) cleanupTap();
  process.exit(1);
}
finish(result.status ?? 1);
