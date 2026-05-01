'use strict';

/**
 * @module scripts/migration/format-conversion/fixtures/tmpDir-setup
 *
 * Shared temp-directory utility for I97 migration harnesses (parity-harness,
 * covenant-survival-harness, personality-harness) and any per-agent test that
 * needs an isolated install per the `test-fixture-isolation` rule (NFR4).
 *
 * Honors `test-fixture-isolation` (project-context.md): no test should run
 * against `PACKAGE_ROOT`. Every harness invocation passes `{ cwd: tmpDir }`
 * to anything that resolves project root or scans the tree.
 *
 * Authored by: Story i97-1.1 (Migration Tooling Foundation Scaffolded).
 * Consumers: Stories 2.1–2.7 (per-agent conversions); Story 3.x harness
 * productionization; Story 4.2 Covenant cell re-audit.
 *
 * Reusable for I98 (Gyre) and I99 (Team Factory) per NFR18.
 */

const fs = require('fs-extra');
const os = require('os');
const path = require('path');

const TMP_DIR_PREFIX = 'convoke-i97-';

// ─── Public API ─────────────────────────────────────────────────────

/**
 * Create an isolated tmp directory for a single test or harness invocation.
 *
 * Returns the path AND a cleanup callback so the caller can invoke
 * `cleanup()` in `after()` / `finally` regardless of nesting style.
 *
 * @param {Object} [options]
 * @param {string} [options.prefix] Override the default tmp dir prefix
 *                                   (e.g. 'convoke-parity-' for parity tests).
 * @returns {{ tmpDir: string, cleanup: () => void }}
 */
function setupTmpDir(options = {}) {
  const prefix = typeof options.prefix === 'string' && options.prefix.length > 0
    ? options.prefix
    : TMP_DIR_PREFIX;

  // Round 1 review patch P23: prefix must not contain path separators or
  // `..` — prevents accidental escape from os.tmpdir() and defends
  // against future misuse where a caller passes an attacker-controlled
  // string.
  if (prefix.includes(path.sep) || prefix.includes('/') || prefix.includes('..')) {
    throw new TypeError(`setupTmpDir: prefix '${prefix}' must not contain path separators or '..' — it is a tmpdir name prefix, not a path`);
  }

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), prefix));

  const cleanup = function cleanup() {
    // Best-effort cleanup. If the dir was already removed (e.g., test ran
    // cleanup itself), or contains symlinks pointing outside, fs-extra's
    // removeSync is forgiving — we only care that the test suite doesn't
    // leave a permanent residue.
    try {
      fs.removeSync(tmpDir);
    } catch (err) {
      // Surface but don't throw — cleanup failures shouldn't fail the test.
      console.warn(`[tmpDir-setup] cleanup(${tmpDir}) failed: ${err.message}`);
    }
  };

  return { tmpDir, cleanup };
}

/**
 * Async-wrapper helper for the most common use case: run an async testFn
 * inside an isolated tmp dir, then clean up automatically.
 *
 * Usage:
 *   await withTmpDir(async ({ tmpDir }) => {
 *     // ... use tmpDir ...
 *   });
 *
 * Cleanup happens in `finally`, so it runs even if testFn throws.
 *
 * @param {(ctx: { tmpDir: string }) => Promise<unknown>} testFn
 * @param {Object} [options] Same shape as setupTmpDir options.
 * @returns {Promise<unknown>} The resolved value of testFn.
 */
async function withTmpDir(testFn, options = {}) {
  const { tmpDir, cleanup } = setupTmpDir(options);
  try {
    return await testFn({ tmpDir });
  } finally {
    cleanup();
  }
}

module.exports = {
  setupTmpDir,
  withTmpDir,
};
