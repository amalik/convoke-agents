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
// The TAP reporter DOES emit `not ok` for such a suite, so we run two reporters: the
// normal human one to stdout (unchanged output), and TAP to a side file we inspect.
// `--test-reporter` landed in Node 18.15/19.6 while engines allows >=18.0.0, so the
// side channel is skipped on older runtimes rather than crashing on an unknown flag.
function supportsReporters() {
  const [maj, min] = process.versions.node.split('.').map(Number);
  // Backported to 18.15 and landed in 19.6 — so 19.0-19.5 does NOT have it, and a
  // bare `maj > 18` would abort the entire suite on an unknown option there.
  if (maj === 18) return min >= 15;
  if (maj === 19) return min >= 6;
  return maj > 19;
}

const args = ['--test'];
let tapPath = null;
let tapDir = null;
if (supportsReporters()) {
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
    console.error(
      `note: cannot create the T66 side channel (${err.code || err.message}); ` +
        'describe-scoped after() hook failures will not be detected.'
    );
  }
  // Specifying any reporter replaces node:test's defaults, so the human stream has
  // to be named explicitly. `spec` is chosen deliberately rather than mirroring the
  // default: that default varies by Node version (measured — Node 20 piped emits TAP,
  // Node 25 piped emits spec), so CI logs currently change format across the matrix.
  // Pinning spec makes output identical on every leg. Nothing parses it — CI runs
  // `npm test` and uploads the output as an artifact.
  if (tapPath) {
    args.push(
      '--test-reporter', 'spec', '--test-reporter-destination', 'stdout',
      '--test-reporter', 'tap', '--test-reporter-destination', tapPath
    );
  }
} else {
  console.error(
    `note: node ${process.versions.node} predates --test-reporter; ` +
      'suite-level after() hook failures cannot be detected (see T66).'
  );
}
args.push(...files);

const result = spawnSync(process.execPath, args, { stdio: 'inherit' });

/** Read the TAP side channel, then remove it. Returns [] when unavailable. */
function readTapFailures() {
  if (!tapPath) return [];
  try {
    const raw = fs.readFileSync(tapPath, 'utf8');
    // A completed TAP stream always ends with a `1..N` plan. Empty or truncated means
    // the reporter never finished — unflushed stream, disk full, writer killed — and
    // reading that as "no failures" is failing OPEN, which is the whole defect class.
    if (!/^1\.\.\d+/m.test(raw)) {
      console.error(
        'T66 side channel is empty or truncated (no TAP plan) — treating as failure ' +
          'rather than assuming the run was clean.'
      );
      return ['not ok - T66 side channel incomplete'];
    }
    return raw
      .split('\n')
      // A `# SKIP` / `# TODO` directive marks a pass in TAP semantics whatever the
      // token, and node emits `not ok N - x # TODO` for a todo whose body throws.
      //
      // The ESCAPE check is what does the work, and it is sufficient on its own:
      // node escapes any literal hash in a test name (and in a directive's reason) as
      // `\#`, so an UNescaped `#` can only introduce a real directive. Anchoring to
      // end-of-line was tried and is wrong — `{ todo: 'see issue #42' }` emits
      // `not ok 1 - x # TODO see issue \#42`, whose trailing `\#` defeated the anchor
      // and turned a legitimate todo into a failure.
      .filter((line) => /^not ok /.test(line) && !/(?<!\\)#\s*(TODO|SKIP)\b/i.test(line));
  } catch (err) {
    // Fail CLOSED. Returning [] here would silently disable the guard, which is the
    // exact failure mode T66 exists to remove: a check that reports success because
    // it could not run.
    console.error(`T66 side channel unreadable (${err.code || err.message}) — treating as failure.`);
    return ['not ok - T66 side channel unreadable'];
  }
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
// diagnostic with a confusing one. Cleanup still runs on every path.
if (result.error) {
  cleanupTap();
  console.error(`failed to spawn ${process.execPath}: ${result.error.message}`);
  process.exit(1);
}
if (result.signal) {
  cleanupTap();
  // POSIX convention: killed by signal N → exit 128 + N (SIGTERM=143, SIGKILL=137).
  // Preserves CI debug info vs. collapsing all signals to a bare 128.
  process.exit(128 + (os.constants.signals[result.signal] ?? 0));
}

if ((result.status ?? 1) !== 0) {
  cleanupTap();
  process.exit(result.status ?? 1);
}

const tapFailures = readTapFailures();
if (tapFailures.length > 0) {
  console.error(
    `\nnode:test exited 0 but TAP recorded ${tapFailures.length} failure(s) (T66). ` +
      'The known cause is an `after` hook inside a `describe`, but do not assume it — ' +
      'the lines below are what the reporter actually said:'
  );
  for (const line of tapFailures) console.error(`  ${line}`);
  if (tapPath) {
    // Deliberately NOT reaped on this path: the TAP YAML block is the only record of
    // why the hook threw, and node:test printed nothing about it. Leaving it is the
    // point of the mechanism; a temp file is a small price for a debuggable failure.
    console.error(`\n  full TAP report retained at: ${tapPath}`);
  }
  process.exit(1);
}
cleanupTap();
process.exit(result.status ?? 1);
