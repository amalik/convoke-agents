'use strict';

// I64 — `runScript` helper return-shape contract.
//
// Pre-I64 the helper mapped `err.code` directly to `exitCode`, so an
// `execFile` timeout (which sets `err.killed = true`, `err.signal = 'SIGTERM'`,
// `err.code = null`) leaked out as `exitCode: null`. Any test asserting
// `exitCode === 0` failed with the unreadable `null !== 0` diagnostic.
//
// Post-I64: `exitCode` is always a finite integer; `timedOut` and `signal`
// surface distinct timeout semantics. These tests lock that contract.

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs-extra');
const os = require('os');
const path = require('path');

const { runScript } = require('../helpers');

describe('runScript return-shape contract (I64)', () => {
  let tmpDir;
  let hangScript;
  let cleanScript;
  let failScript;

  before(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'convoke-i64-'));

    // Hangs forever — used to exercise the timeout path.
    hangScript = path.join(tmpDir, 'hang.js');
    await fs.writeFile(hangScript, 'setInterval(() => {}, 1000);\n', 'utf8');

    // Exits cleanly with code 0.
    cleanScript = path.join(tmpDir, 'clean.js');
    await fs.writeFile(cleanScript, 'process.exit(0);\n', 'utf8');

    // Exits with non-zero exit code.
    failScript = path.join(tmpDir, 'fail.js');
    await fs.writeFile(failScript, 'process.exit(2);\n', 'utf8');
  });

  after(async () => {
    await fs.remove(tmpDir);
  });

  it('returns exitCode 0 + timedOut false + signal null for a clean exit', async () => {
    const result = await runScript(cleanScript, [], { timeout: 5000 });
    assert.equal(result.exitCode, 0);
    assert.equal(result.timedOut, false);
    assert.equal(result.signal, null);
  });

  it('returns non-zero exitCode + timedOut false + signal null for a non-zero exit', async () => {
    const result = await runScript(failScript, [], { timeout: 5000 });
    assert.equal(result.exitCode, 2);
    assert.equal(result.timedOut, false);
    assert.equal(result.signal, null);
  });

  it('returns numeric exitCode + timedOut true on timeout (not null exitCode)', async () => {
    // Hang script with a 500ms timeout forces execFile to kill the child.
    // 500ms (vs tighter bounds) absorbs Node start-up + CI load jitter without
    // changing the assertion — we only need the timeout path exercised.
    const result = await runScript(hangScript, [], { timeout: 500 });
    assert.equal(
      result.timedOut,
      true,
      `timedOut must be true on timeout; got result=${JSON.stringify(result)}`
    );
    // Assert signal is a string (kill signal name) rather than hard-coding
    // 'SIGTERM' — the helper's JSDoc contract is that `timedOut` works under
    // an operator-overridden `killSignal`, so the test must not silently
    // re-couple to the default signal.
    assert.equal(typeof result.signal, 'string', `signal must be a string on timeout; got ${JSON.stringify(result.signal)}`);
    // The key I64 contract: exitCode must be a finite integer, never null.
    // Pre-I64 this was `null`, which made `exitCode === 0` assertions
    // fail with the opaque `null !== 0` diagnostic.
    assert.ok(
      Number.isInteger(result.exitCode),
      `exitCode must be a finite integer post-I64; got ${JSON.stringify(result.exitCode)}`
    );
    assert.notEqual(result.exitCode, 0, 'timeout must produce a non-zero exitCode');
  });

  it('coerces spawn failure (ENOENT) to integer exitCode 1', async () => {
    // Non-existent script path forces execFile to fail at spawn time with
    // err.code = 'ENOENT' (string). The I64 P1 patch coerces any non-integer
    // err.code to 1 so the "exitCode is always a finite integer" contract holds.
    const missingScript = path.join(tmpDir, 'does-not-exist.js');
    const result = await runScript(missingScript, [], { timeout: 5000 });
    assert.ok(
      Number.isInteger(result.exitCode),
      `exitCode must be a finite integer on spawn failure; got ${JSON.stringify(result.exitCode)}`
    );
    assert.equal(result.exitCode, 1, 'ENOENT must coerce to exitCode 1');
    assert.equal(result.timedOut, false);
  });

  it('shape: result object has exactly the five expected keys (no more, no less)', async () => {
    const result = await runScript(cleanScript, [], { timeout: 5000 });
    const expectedKeys = ['exitCode', 'stdout', 'stderr', 'timedOut', 'signal'];
    for (const key of expectedKeys) {
      assert.ok(key in result, `result missing key: ${key}`);
    }
    // Strict five-key contract — locks the shape so a future refactor can't
    // silently leak extra fields (e.g., the raw err object).
    assert.equal(
      Object.keys(result).length,
      expectedKeys.length,
      `result must have exactly ${expectedKeys.length} keys; got ${JSON.stringify(Object.keys(result))}`
    );
  });
});

// ---------------------------------------------------------------------------
// CI run 32115225495 — git-fixture teardown determinism.
//
// One test failed (`executeInjections > preserves existing frontmatter fields
// (NFR20)`, tests/lib/migration-execution.test.js) and took three jobs red:
// test(20), test(22) and coverage. Node 18 passed, so it is a race, not a defect.
// The failure was in the afterEach hook, not the assertions:
//   ENOTEMPTY: directory not empty, rmdir '/tmp/convoke-inject-XXXXXX/.git/objects'
//
// Two causes stacked. `git commit` forks a DETACHED
// `git maintenance run --auto --no-quiet --detach` child that outlives the
// parent execFileSync and keeps working inside .git/objects; and fs-extra's
// remove() is fs.rm({recursive, force}) with maxRetries defaulted to 0, so the
// first ENOTEMPTY is fatal with no retry.
//
// These tests lock both halves of the fix.
// ---------------------------------------------------------------------------

const { spawnSync } = require('node:child_process');
const nodeFs = require('node:fs');

const { PACKAGE_ROOT, initGitFixture, removeTempDir, removeTempDirSync } = require('../helpers');

/**
 * Commit a change in `dir` under GIT_TRACE and count the detached
 * auto-maintenance spawns it produced.
 *
 * Asserts the commit actually succeeded first: a failed commit also yields a
 * count of 0, which would make the whole assertion pass for the wrong reason.
 */
function maintenanceSpawnsOnCommit(dir, label) {
  nodeFs.writeFileSync(path.join(dir, `${label}.md`), 'x\n');
  const add = spawnSync('git', ['add', '-A'], { cwd: dir, encoding: 'utf8' });
  assert.ok(!add.error, `git add could not spawn in ${label}: ${add.error && add.error.code}`);
  assert.equal(add.status, 0, `git add failed in ${label}: ${add.stderr}`);
  const res = spawnSync('git', ['commit', '-m', label], {
    cwd: dir,
    encoding: 'utf8',
    env: { ...process.env, GIT_TRACE: '1' },
  });
  // A spawn failure leaves status null and stderr undefined, so asserting on
  // status alone reports "git commit failed: undefined" and hides the ENOENT.
  assert.ok(!res.error, `git commit could not spawn in ${label}: ${res.error && res.error.code}`);
  assert.equal(res.status, 0, `git commit failed in ${label}: ${res.stderr}`);
  return (res.stderr.match(/maintenance run --auto/g) || []).length;
}

/** Build a fixture repo the way this suite did BEFORE initGitFixture existed. */
function legacyGitFixture(dir) {
  nodeFs.mkdirSync(dir, { recursive: true });
  for (const args of [['init', '-q'], ['config', 'user.email', 't@t'], ['config', 'user.name', 't']]) {
    const r = spawnSync('git', args, { cwd: dir, encoding: 'utf8' });
    assert.equal(r.status, 0, `control setup failed: ${r.stderr}`);
  }
  return dir;
}

describe("initGitFixture — suppresses git's detached auto-maintenance child", () => {
  let tmpDir;

  before(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'convoke-gitfix-'));
  });

  after(async () => {
    await removeTempDir(tmpDir);
  });

  it('a plain `git init` fixture DOES spawn the detached child, and initGitFixture does not', (t) => {
    // Control: the fixture pattern used today at tests/lib/migration-execution.test.js:248
    // and :509 — git init plus identity, nothing else.
    const control = legacyGitFixture(path.join(tmpDir, 'control'));
    const controlSpawns = maintenanceSpawnsOnCommit(control, 'control');

    // If the control does not spawn, this git predates auto-maintenance (or it
    // is disabled globally) and the assertion below would pass vacuously.
    // Skip loudly rather than report coverage we did not get.
    if (controlSpawns === 0) {
      t.skip('this git does not run auto-maintenance after commit — nothing to suppress');
      return;
    }

    const fixture = path.join(tmpDir, 'fixture');
    nodeFs.mkdirSync(fixture);
    initGitFixture(fixture);
    const fixtureSpawns = maintenanceSpawnsOnCommit(fixture, 'fixture');

    assert.equal(
      fixtureSpawns,
      0,
      `initGitFixture must suppress the detached maintenance child; control spawned ${controlSpawns}, fixture spawned ${fixtureSpawns}`
    );
  });

  it('suppression also covers a commit issued by other code in the same repo', (t) => {
    // The code under test (scripts/lib/artifact-utils.js executeRenames /
    // executeInjections) runs its OWN `git commit` inside the fixture. Only
    // repo-local config reaches those; wrapping the test's own git calls would not.
    //
    // Same vacuity guard as the test above: without a control arm this asserts
    // 0 == 0 on any git that never auto-maintains.
    const control = legacyGitFixture(path.join(tmpDir, 'foreign-control'));
    if (maintenanceSpawnsOnCommit(control, 'foreign-control') === 0) {
      t.skip('this git does not run auto-maintenance after commit — nothing to suppress');
      return;
    }
    const repo = path.join(tmpDir, 'foreign-caller');
    nodeFs.mkdirSync(repo);
    initGitFixture(repo);
    maintenanceSpawnsOnCommit(repo, 'seed');
    assert.equal(maintenanceSpawnsOnCommit(repo, 'foreign'), 0);
  });
});

describe('initGitFixture — refuses a path that would touch the real repository', () => {
  it('rejects falsy and relative paths rather than inheriting process.cwd()', () => {
    // execFileSync with cwd:undefined runs in the developer's own repo, where
    // `git config maintenance.auto false` would be a real, silent mutation.
    assert.throws(() => initGitFixture(undefined), /absolute directory path/);
    assert.throws(() => initGitFixture(''), /absolute directory path/);
    assert.throws(() => initGitFixture('some/relative/dir'), /absolute directory path/);
  });

  it('rejects an absolute path that is not an existing directory', () => {
    assert.throws(
      () => initGitFixture(path.join(os.tmpdir(), 'convoke-not-there-77120')),
      /existing directory/
    );
  });
});

describe('removeTempDir — teardown survives a writer, and names it when it cannot', () => {
  it('removes a populated nested tree', async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'convoke-rm-'));
    await fs.ensureDir(path.join(dir, 'a', 'b', 'c'));
    await fs.writeFile(path.join(dir, 'a', 'b', 'c', 'f.txt'), 'x');
    await removeTempDir(dir);
    assert.equal(nodeFs.existsSync(dir), false);
  });

  it('is a no-op on a falsy path or an already-removed directory', async () => {
    await removeTempDir(undefined);
    await removeTempDir(path.join(os.tmpdir(), 'convoke-never-existed-84213'));
    removeTempDirSync(undefined);
  });

  it('refuses a path outside the OS temp directory, and any relative path', async () => {
    // path-safety-for-destructive-ops: these removers are recursive+force.
    await assert.rejects(() => removeTempDir(path.join(PACKAGE_ROOT, 'scripts')), /outside the OS temp directory/);
    assert.throws(() => removeTempDirSync('relative/path'), /refuses a relative path/);
    assert.throws(() => removeTempDirSync(os.tmpdir()), /outside the OS temp directory/);
  });

  it('names the surviving entries when removal cannot complete', (t) => {
    // chmod 0500 on the TARGET (not its parent): the directory stays readable,
    // so the survivors can be listed, but its contents cannot be unlinked —
    // which reproduces ENOTEMPTY, the same error class as the CI failure.
    // chmod on the parent instead yields EACCES with an empty listing, which
    // would prove nothing.
    // Windows has no getuid and ignores these mode bits; root bypasses them.
    // Either way chmod cannot block the unlink, so the case is unreachable —
    // skip loudly rather than report coverage that was never obtained.
    if (process.platform === 'win32' || typeof process.getuid !== 'function') {
      t.skip('platform does not enforce POSIX directory permissions');
      return;
    }
    if (process.getuid() === 0) {
      t.skip('running as root — chmod cannot block unlink, so this case is unreachable');
      return;
    }
    const dir = nodeFs.mkdtempSync(path.join(os.tmpdir(), 'convoke-stuck-'));
    nodeFs.writeFileSync(path.join(dir, 'stuck.txt'), 'x');
    nodeFs.chmodSync(dir, 0o500);
    try {
      assert.throws(
        () => removeTempDirSync(dir),
        (err) => {
          assert.ok(
            err.message.includes('stuck.txt'),
            `error must name the survivors so the next occurrence is diagnosable; got: ${err.message}`
          );
          return true;
        }
      );
    } finally {
      // Cleanup must never replace the assertion failure it is unwinding from:
      // if the removal unexpectedly SUCCEEDED, `dir` is already gone and an
      // unguarded chmod would throw ENOENT over the real AssertionError.
      try {
        nodeFs.chmodSync(dir, 0o700);
      } catch {
        // already removed
      }
      nodeFs.rmSync(dir, { recursive: true, force: true });
    }
  });
});
