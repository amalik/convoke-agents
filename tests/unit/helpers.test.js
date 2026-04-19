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
