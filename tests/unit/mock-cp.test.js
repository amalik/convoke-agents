'use strict';

/**
 * Smoke test for tests/mock-cp.js — the child_process mock helper used by
 * tests/lib/* conversions (Story B). This test does NOT exercise any
 * production code under test; it verifies the helper itself behaves the
 * way the conversion work assumes.
 *
 * If this file goes red, every Story B conversion is suspect.
 */

const { describe, it, beforeEach, afterEach, mock } = require('node:test');
const assert = require('node:assert/strict');

const { mockExecFileSync } = require('../mock-cp');

// We mock against scripts/lib/artifact-utils because:
//  1. It's a real module that internally calls child_process.execFileSync.
//  2. It exports executeRenames, the highest-blast-radius function we need
//     to be confident the helper supports.
//  3. It's already in the dependency graph so no extra fixture is needed.
const TARGET = '../../scripts/lib/artifact-utils';

describe('mock-cp helper: basic spy installation', () => {
  let mock;

  beforeEach(() => {
    mock = mockExecFileSync(TARGET, __dirname);
  });

  afterEach(() => {
    mock.restore();
  });

  it('returns a fresh module instance via .module', () => {
    assert.ok(mock.module, 'module getter returns the target module');
    assert.equal(typeof mock.module.executeRenames, 'function',
      'fresh require resolved executeRenames export');
  });

  it('callCount starts at 0 before any invocation', () => {
    assert.equal(mock.callCount(), 0);
  });

  it('calls() starts as an empty array', () => {
    assert.deepEqual(mock.calls(), []);
  });
});

describe('mock-cp helper: setImpl + call inspection', () => {
  let mock;

  beforeEach(() => {
    mock = mockExecFileSync(TARGET, __dirname);
  });

  afterEach(() => {
    mock.restore();
  });

  it('setImpl is invoked when target module shells out', () => {
    let receivedArgs = null;
    mock.setImpl((cmd, args) => {
      receivedArgs = { cmd, args };
      if (args && args[0] === 'rev-parse') return 'fake-sha\n';
      return '';
    });

    const { executeRenames } = mock.module;
    const manifest = {
      entries: [
        { action: 'RENAME', oldPath: 'a.md', newPath: 'b.md', collisionWith: null },
      ],
      collisions: new Map(),
      summary: { total: 1, rename: 1 },
    };

    const result = executeRenames(manifest, '/fake/root');
    assert.equal(result.renamedCount, 1);
    assert.equal(result.commitSha, 'fake-sha');
    assert.ok(receivedArgs, 'setImpl callback was invoked');
  });

  it('callCount reflects every shell-out', () => {
    mock.setImpl((cmd, args) => args && args[0] === 'rev-parse' ? 'sha\n' : '');
    const { executeRenames } = mock.module;
    executeRenames({
      entries: [
        { action: 'RENAME', oldPath: 'a.md', newPath: 'b.md', collisionWith: null },
        { action: 'RENAME', oldPath: 'c.md', newPath: 'd.md', collisionWith: null },
      ],
      collisions: new Map(),
      summary: { total: 2, rename: 2 },
    }, '/fake/root');

    // 2 git mv + 1 commit + 1 rev-parse = 4 calls minimum
    assert.ok(mock.callCount() >= 4,
      `expected >=4 calls, got ${mock.callCount()}`);
  });

  it('calls() returns full argument tuples', () => {
    mock.setImpl((cmd, args) => args && args[0] === 'rev-parse' ? 'sha\n' : '');
    const { executeRenames } = mock.module;
    executeRenames({
      entries: [{ action: 'RENAME', oldPath: 'a.md', newPath: 'b.md', collisionWith: null }],
      collisions: new Map(),
      summary: { total: 1, rename: 1 },
    }, '/fake/root');

    const all = mock.calls();
    assert.ok(Array.isArray(all));
    assert.ok(all.length > 0);
    // Each entry should be a tuple [cmd, args, opts] (opts may be undefined)
    for (const tuple of all) {
      assert.equal(typeof tuple[0], 'string', 'first element is cmd string');
      assert.ok(Array.isArray(tuple[1]) || tuple[1] === undefined,
        'second element is args array or undefined');
    }
  });

  it('callsMatching filters by args predicate', () => {
    mock.setImpl((cmd, args) => args && args[0] === 'rev-parse' ? 'sha\n' : '');
    const { executeRenames } = mock.module;
    executeRenames({
      entries: [
        { action: 'RENAME', oldPath: 'a.md', newPath: 'b.md', collisionWith: null },
        { action: 'RENAME', oldPath: 'c.md', newPath: 'd.md', collisionWith: null },
      ],
      collisions: new Map(),
      summary: { total: 2, rename: 2 },
    }, '/fake/root');

    const mvCalls = mock.callsMatching((args) => args[0] === 'mv');
    assert.equal(mvCalls.length, 2, 'two git mv invocations expected');

    const commitCalls = mock.callsMatching((args) => args[0] === 'commit');
    assert.equal(commitCalls.length, 1, 'one git commit invocation expected');
  });
});

describe('mock-cp helper: setReturnValue shorthand', () => {
  let mock;

  beforeEach(() => {
    mock = mockExecFileSync(TARGET, __dirname);
  });

  afterEach(() => {
    mock.restore();
  });

  it('setReturnValue makes every spy invocation return the configured value', () => {
    mock.setReturnValue('constant-output\n');
    // Invoke execFileSync directly to verify the spy returns what
    // setReturnValue configured. We don't go through mock.module here because
    // that would couple this assertion to a specific source-code path —
    // the helper's contract is "the spy returns this value," and that's what
    // we verify directly.
    const cp = require('node:child_process');
    const result1 = cp.execFileSync('git', ['rev-parse', 'HEAD']);
    const result2 = cp.execFileSync('git', ['log', '-1']);
    assert.equal(result1, 'constant-output\n');
    assert.equal(result2, 'constant-output\n');
    assert.equal(mock.callCount(), 2, 'both invocations were captured');
  });
});

describe('mock-cp helper: throwing impl + restore semantics', () => {
  let mock;

  beforeEach(() => {
    mock = mockExecFileSync(TARGET, __dirname);
  });

  afterEach(() => {
    mock.restore();
  });

  it('setImpl that throws propagates as expected (rollback path)', () => {
    let mvCount = 0;
    mock.setImpl((cmd, args) => {
      if (args && args[0] === 'mv') {
        mvCount++;
        if (mvCount === 2) throw new Error('simulated git mv failure');
      }
      return '';
    });

    const { executeRenames, ArtifactMigrationError } = mock.module;
    assert.throws(
      () => executeRenames({
        entries: [
          { action: 'RENAME', oldPath: 'a.md', newPath: 'b.md', collisionWith: null },
          { action: 'RENAME', oldPath: 'c.md', newPath: 'd.md', collisionWith: null },
        ],
        collisions: new Map(),
        summary: { total: 2, rename: 2 },
      }, '/fake/root'),
      ArtifactMigrationError,
    );

    // The rollback path should have called git reset --hard.
    const resetCalls = mock.callsMatching((args) => args[0] === 'reset' && args[1] === '--hard');
    assert.equal(resetCalls.length, 1, 'rollback called exactly once');
  });
});

describe('mock-cp helper: restore() does NOT destroy sibling spies', () => {
  // Regression test for a real bug found during self-review: an earlier
  // version of restore() called mock.restoreAll(), which would have torn
  // down any other spies the test installed (e.g. console.warn). This test
  // installs the helper AND a separate console.warn spy, then asserts the
  // sibling spy still works after the helper restores.
  let cpMock;
  let warnSpy;

  beforeEach(() => {
    cpMock = mockExecFileSync(TARGET, __dirname);
    warnSpy = mock.method(console, 'warn', () => {});
  });

  afterEach(() => {
    // Defensive teardown: only restore the warnSpy if it hasn't already been
    // touched. If finding #2 regresses, the cpMock.restore() inside the test
    // body will destroy warnSpy and this afterEach call becomes a no-op
    // (calling .restore() on an already-restored spy is safe in node:test).
    warnSpy.mock.restore();
  });

  it('restoring the cp helper does not restore the console.warn spy', () => {
    // Sanity: the warn spy is currently active.
    console.warn('first call — should be silenced');
    assert.equal(warnSpy.mock.callCount(), 1);

    // Restore the cp helper. If restore() incorrectly uses restoreAll(),
    // this also tears down the warnSpy and the next console.warn call will
    // hit the real implementation (and the assertion below will fail
    // because callCount() will report the restored-spy state).
    cpMock.restore();

    // The warn spy must still be active after the cp helper is torn down.
    console.warn('second call — should also be silenced');
    assert.equal(
      warnSpy.mock.callCount(),
      2,
      'warnSpy should still be capturing calls after cpMock.restore()',
    );
  });
});

describe('mock-cp helper: isolation across beforeEach cycles', () => {
  // Two consecutive tests with their own mocks must not see each other's
  // call history. This is the bug that surfaces if module cache reset is
  // wrong.
  let mock;

  beforeEach(() => {
    mock = mockExecFileSync(TARGET, __dirname);
  });

  afterEach(() => {
    mock.restore();
  });

  it('first test: makes one call', () => {
    mock.setImpl((cmd, args) => args && args[0] === 'rev-parse' ? 'sha\n' : '');
    const { executeRenames } = mock.module;
    executeRenames({
      entries: [{ action: 'RENAME', oldPath: 'a.md', newPath: 'b.md', collisionWith: null }],
      collisions: new Map(),
      summary: { total: 1, rename: 1 },
    }, '/fake/root');
    assert.ok(mock.callCount() > 0);
  });

  it('second test: starts with zero calls (isolation check)', () => {
    assert.equal(mock.callCount(), 0,
      'second test should start with a fresh spy and zero history');
  });
});
