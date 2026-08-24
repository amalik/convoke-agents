'use strict';

// T66 — `scripts/test-runner.js` must fail when a `describe`-scoped `after()` hook throws.
//
// node:test hides exactly one teardown failure. A failing `afterEach` fails its test
// and exits non-zero; a failing FILE-level `after` also exits non-zero. But an `after`
// inside a `describe` does neither: it prints a `✖`, reports `fail 0`, and exits 0.
// The scope is that narrow — measured, not assumed.
//
// It is not academic. During T61 a real teardown regression survived three separate
// "green" verifications in one session, and was caught only because the leaked
// directory happened to appear in `git status`.
//
// The runner detects it by running a second TAP reporter to a private temp dir and
// treating a column-0 `not ok` as failure when the child exits 0.

const { describe, it, before: beforeHook, after: afterHook } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('node:child_process');

const { removeTempDirSync } = require('../helpers');
const { supportsReporters } = require('../../scripts/lib/t66-gate');

const RUNNER = path.join(__dirname, '..', '..', 'scripts', 'test-runner.js');

// Imported, not re-implemented: a second copy that drifts in the permissive direction
// silently converts this suite to t.skip and leaves the gate untested behind a green run.
const reportersAvailable = supportsReporters;

/**
 * Write a throwaway suite into its own directory and run the project runner over it.
 *
 * The fixture is created at runtime, never committed: any committed `*.test.js` under
 * `tests/` is collected by the runner itself, so a deliberately-failing fixture would
 * fail the real suite.
 */
function runFixture(dir, source) {
  fs.writeFileSync(path.join(dir, 'fixture.test.js'), source);
  const env = { ...process.env };
  // NODE_TEST_CONTEXT: node:test sets it in every child, and a nested `node --test`
  // inheriting it exits 0 even on genuine failures — without this the assertions
  // measure the harness, not the runner. Verified: same fixture, exit 1 clean vs 0 set.
  delete env.NODE_TEST_CONTEXT;
  // NODE_V8_COVERAGE: under `npm run test:coverage` the fixture subprocesses would
  // otherwise merge their coverage into the parent's directory, inflating the runner's
  // own numbers with four self-executions nothing asserts against.
  delete env.NODE_V8_COVERAGE;
  const res = spawnSync(process.execPath, [RUNNER, dir], {
    encoding: 'utf8',
    env,
    timeout: 60_000,
    maxBuffer: 32 * 1024 * 1024,
  });
  noteRetained(res);
  return res;
}

/** Side channels the runner deliberately kept because the gate fired. */
const retainedPaths = [];

/** Record a retained TAP report so the suite can reap what it deliberately caused. */
function noteRetained(res) {
  const m = /full TAP report retained at: (.+)/.exec(res.stderr || '');
  if (m) retainedPaths.push(m[1].trim());
}

const GATE_MARKER = /side channel reported \d+ problem/;

/**
 * Does THIS runtime actually have the blind spot?
 *
 * It is version-specific and the boundary is real: measured in CI, Node 18 and 20
 * already exit non-zero on a describe-scoped `after()` failure, while Node 22 and 25
 * exit 0. Asserting the gate fires on every runtime is asserting a premise that is
 * false on half the support matrix — which is exactly how this suite went red on
 * 18/20 while passing locally.
 *
 * Probed once against plain `node --test`, never assumed.
 */
let blindSpotCache = null;
function runtimeHidesDescribeAfterFailure(dir) {
  if (blindSpotCache !== null) return blindSpotCache;
  const probe = path.join(dir, 'probe.test.js');
  fs.writeFileSync(
    probe,
    `const { describe, it, after } = require('node:test');
describe('probe', () => {
  after(() => { throw new Error('probe teardown'); });
  it('passes', () => {});
});
`
  );
  const env = { ...process.env };
  delete env.NODE_TEST_CONTEXT;
  delete env.NODE_V8_COVERAGE;
  const res = spawnSync(process.execPath, ['--test', probe], { encoding: 'utf8', env, timeout: 60_000 });
  blindSpotCache = res.status === 0;
  return blindSpotCache;
}

describe('test-runner surfaces the hook failure node:test hides', () => {
  let tmpDir;

  beforeHook(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'convoke-t66-'));
  });

  afterHook(() => {
    // Reap every retained report this suite provoked. Retention is correct behaviour
    // for a real failure; a suite that manufactures failures must not rely on it.
    for (const kept of retainedPaths) {
      try {
        removeTempDirSync(path.dirname(kept));
      } catch {
        // Already gone, or reaped by the test that asserted on it.
      }
    }
    removeTempDirSync(tmpDir);
  });

  const fixtureDir = (name) => fs.mkdtempSync(path.join(tmpDir, `${name}-`));

  it('fails when a describe-scoped after() hook throws', (t) => {
    if (!reportersAvailable()) {
      t.skip(`node ${process.versions.node} predates --test-reporter; the gate is absent by design`);
      return;
    }
    const res = runFixture(
      fixtureDir('after'),
      `const { describe, it, after } = require('node:test');
describe('boom', () => {
  after(() => { throw new Error('teardown exploded'); });
  it('passes', () => {});
});
`
    );
    // Exactly 1, not merely non-zero: exit 2 (no files found) or 9 (bad option) would
    // satisfy a `notEqual(0)` while proving the gate had vanished.
    assert.equal(res.status, 1, `the run must fail either way\nstdout:\n${res.stdout}\nstderr:\n${res.stderr}`);
    // The marker is only expected where the blind spot actually exists. On a runtime
    // that fails natively the run is red either way, and asserting WHICH mechanism
    // produced the failure would be a claim about node internals this suite cannot
    // verify on the runtimes it has.
    if (runtimeHidesDescribeAfterFailure(fixtureDir('probe'))) {
      assert.match(res.stderr, GATE_MARKER, `the gate must say why it failed\nstderr:\n${res.stderr}`);
    }
  });

  it('fails when the throwing after() is in a NESTED describe', (t) => {
    if (!reportersAvailable()) return t.skip('gate absent by design on this node');
    // Pins TAP's propagation: the inner `not ok` is indented, so detection depends on
    // the failure being re-reported at column 0 on the outer suite. If node:test ever
    // stops propagating, the runner silently stops gating and this catches it.
    const res = runFixture(
      fixtureDir('nested'),
      `const { describe, it, after } = require('node:test');
describe('outer', () => { describe('inner', () => {
  after(() => { throw new Error('deep teardown exploded'); });
  it('passes', () => {});
}); });
`
    );
    assert.equal(res.status, 1, `nested after() must be caught\nstdout:\n${res.stdout}`);
    if (runtimeHidesDescribeAfterFailure(fixtureDir('probe'))) {
      assert.match(res.stderr, GATE_MARKER, 'exit 1 must come from the gate, not a fixture error');
    }
  });

  it('does NOT fail a todo test whose body throws', (t) => {
    if (!reportersAvailable()) return t.skip('gate absent by design on this node');
    // A live false positive found in review. node:test emits `not ok 1 - x # TODO` at
    // column 0 for this, which is a PASS in TAP semantics — a naive /^not ok / would
    // turn `npm test` permanently red for any todo test with a failing body.
    const res = runFixture(
      fixtureDir('todo'),
      `const { it } = require('node:test');
it('failing todo', { todo: 'not done' }, () => { throw new Error('x'); });
`
    );
    assert.equal(res.status, 0, `a todo directive is not a failure\nstdout:\n${res.stdout}\nstderr:\n${res.stderr}`);
    // Positive control: status 0 also holds if the side channel never engaged, which
    // would make this the one negative-guarding test that passes for the wrong reason.
    assert.doesNotMatch(
      res.stderr,
      /cannot create the T66 side channel|predates --test-reporter/,
      'the side channel must have been active for this assertion to mean anything'
    );
  });

  it('does NOT fail a todo whose reason contains a hash', (t) => {
    if (!reportersAvailable()) return t.skip('gate absent by design on this node');
    // Round 3. An end-of-line anchor on the directive was wrong: node emits
    // `not ok 1 - x # TODO see issue \\#42`, and the escaped hash in the REASON
    // defeated the anchor, turning a legitimate todo into a red build.
    const res = runFixture(
      fixtureDir('todohash'),
      `const { it } = require('node:test');
it('x', { todo: 'see issue #42' }, () => { throw new Error('x'); });
`
    );
    assert.equal(res.status, 0, `a todo reason containing '#' is still a todo\nstdout:\n${res.stdout}`);
  });

  it('is not fooled by a directive-looking string inside a test NAME', (t) => {
    if (!reportersAvailable()) return t.skip('gate absent by design on this node');
    // Round 2 found the first directive filter matched `# TODO` ANYWHERE in the line,
    // so `not ok 1 - renders the \\# TODO badge` was swallowed — trading the Round 1
    // false positive for a false negative on a genuine teardown failure.
    const res = runFixture(
      fixtureDir('nametodo'),
      `const { describe, it, after } = require('node:test');
describe('renders the # TODO badge', () => {
  after(() => { throw new Error('teardown exploded'); });
  it('passes', () => {});
});
`
    );
    assert.equal(res.status, 1, `a real failure must survive a name containing '# TODO'\nstdout:\n${res.stdout}`);
    if (runtimeHidesDescribeAfterFailure(fixtureDir('probe'))) {
      assert.match(res.stderr, GATE_MARKER, 'exit 1 must come from the gate, not a fixture error');
    }
  });

  it('degrades without writing a stray file when the side channel cannot be created', (t) => {
    if (!reportersAvailable()) return t.skip('gate absent by design on this node');
    // Round 2 found `tapPath = null` was still pushed as an argument, and spawnSync
    // coerced it to the string "null" — writing the whole TAP stream to ./null (the
    // repo root under `npm test`) while readTapFailures() returned [] on the falsy
    // path, silently un-gating the runner.
    const dir = fixtureDir('nochannel');
    const cwd = fs.mkdtempSync(path.join(tmpDir, 'cwd-'));
    fs.writeFileSync(
      path.join(dir, 'fixture.test.js'),
      `const { it } = require('node:test');
it('passes', () => {});
`
    );
    const env = { ...process.env, TMPDIR: path.join(dir, 'definitely-absent') };
    delete env.NODE_TEST_CONTEXT;
    delete env.NODE_V8_COVERAGE;
    const res = spawnSync(process.execPath, [RUNNER, dir], {
      encoding: 'utf8', env, cwd, timeout: 60_000, maxBuffer: 32 * 1024 * 1024,
    });
    assert.equal(res.status, 0, `the suite must still run\nstderr:\n${res.stderr}`);
    // Positive control. os.tmpdir() honours TMPDIR only on POSIX — on Windows it reads
    // TEMP/TMP — so without this the degradation path never executes there and the
    // assertion below passes having tested nothing.
    assert.match(
      res.stderr,
      /cannot create the T66 side channel/,
      'the degradation path must actually have run for this assertion to mean anything'
    );
    assert.deepEqual(
      fs.readdirSync(cwd),
      [],
      'an unusable side channel must not write a stray file into the working directory'
    );
  });

  it('still fails when an afterEach() hook throws (control)', () => {
    // If this control ever passes-on-failure, the asymmetry has changed and the whole
    // premise needs re-measuring rather than the runner being patched further.
    const res = runFixture(
      fixtureDir('each'),
      `const { describe, it, afterEach } = require('node:test');
describe('boom', () => {
  afterEach(() => { throw new Error('teardown exploded'); });
  it('passes', () => {});
});
`
    );
    // Exit 1 specifically: exit 2 (no files found) or 9 (bad option) would satisfy a
    // bare notEqual while proving the control had stopped controlling anything.
    assert.equal(res.status, 1, `afterEach failure must fail the run\n${res.stdout}`);
  });

  it('exits zero when every hook and test passes', () => {
    // A gate that always fires is as useless as one that never does.
    const res = runFixture(
      fixtureDir('clean'),
      `const { describe, it, after, afterEach } = require('node:test');
describe('fine', () => {
  after(() => {});
  afterEach(() => {});
  it('passes', () => {});
});
`
    );
    assert.equal(res.status, 0, `a clean run must succeed\nstdout:\n${res.stdout}\nstderr:\n${res.stderr}`);
  });

  it('reaps the side channel on a clean run, and RETAINS it when the gate fires', (t) => {
    if (!reportersAvailable()) {
      // Would otherwise pass vacuously: nothing is ever created on old node.
      t.skip('no side channel is created on this node');
      return;
    }

    // Clean run: nothing should survive.
    const before = new Set(fs.readdirSync(os.tmpdir()).filter((f) => f.startsWith('convoke-test-runner-')));
    const okRes = runFixture(
      fixtureDir('reap'),
      `const { describe, it, after } = require('node:test');
describe('fine', () => { after(() => {}); it('passes', () => {}); });
`
    );
    assert.equal(okRes.status, 0, `clean run must pass\n${okRes.stdout}`);
    const afterClean = fs
      .readdirSync(os.tmpdir())
      .filter((f) => f.startsWith('convoke-test-runner-') && !before.has(f));
    assert.deepEqual(afterClean, [], `clean run left a side channel: ${afterClean.join(', ')}`);

    // Failing run: the TAP report is the ONLY record of why the hook threw, since
    // node:test printed nothing about it. Retention is the point, not a leak.
    const badRes = runFixture(
      fixtureDir('retain'),
      `const { describe, it, after } = require('node:test');
describe('boom', () => {
  after(() => { throw new Error('teardown exploded'); });
  it('passes', () => {});
});
`
    );
    assert.equal(badRes.status, 1, `the run must fail either way\n${badRes.stdout}`);
    if (!runtimeHidesDescribeAfterFailure(fixtureDir('probe'))) {
      // Node failed it natively; there is no retained report to assert on.
      return;
    }
    const retained = /full TAP report retained at: (.+)/.exec(badRes.stderr);
    assert.ok(retained, `the retained path must be printed\nstderr:\n${badRes.stderr}`);
    const kept = retained[1].trim();
    assert.ok(fs.existsSync(kept), `the retained report must actually exist: ${kept}`);
    assert.match(fs.readFileSync(kept, 'utf8'), /not ok/, 'the retained report must contain the failure');

    // This suite triggers the gate deliberately, so it reaps what it caused —
    // otherwise every `npm test` would accumulate directories in tmp.
    removeTempDirSync(path.dirname(kept));
  });
});
