'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const os = require('os');
const fs = require('fs-extra');
const { spawn } = require('node:child_process');

const {
  createTempDir,
  createInstallation,
  PACKAGE_ROOT,
} = require('../helpers');

const SCRIPT_PATH = path.join(PACKAGE_ROOT, 'scripts/update/convoke-update.js');

// R1-L4: extract fixture version as a named constant. All integration-style
// tests in this file spawn convoke-update against a pre-4.0 installation so
// the migration chain exercises the upgrade path. 1.4.1 chains through
// 1.4.x → 1.5.0 → 1.6.0 → 1.7.0 → 2.0.0 → 3.1.0 → 4.0.0 — verified by R1
// Edge-hunter chain walk. If registry evolution ever breaks the chain from
// this version, edit this constant and the impact is localized.
const FIXTURE_VERSION = '1.4.1';

// R2-L1: Test 1b uses fixture 2.5.0 to exercise the refresh-only path, which
// depends on the registry having no entries for 2.5.x. Pin the invariant so
// if a future migration (e.g., 2.5.x-to-3.0.0) is ever added, the guard fires
// loudly instead of silently rehoming Test 1b onto the upgrade path.
const REFRESH_ONLY_FIXTURE = '2.5.0';
{
  const { getMigrationsFor } = require('../../scripts/update/migrations/registry');
  assert.equal(
    getMigrationsFor(REFRESH_ONLY_FIXTURE).length,
    0,
    `REFRESH_ONLY_FIXTURE (${REFRESH_ONLY_FIXTURE}) must have zero registry entries — Test 1b would otherwise silently hit the upgrade path. Update fixture version if registry evolves.`
  );
}

/**
 * Spawn convoke-update with piped stdin. Mirror of the inline helper in
 * convoke-update.test.js — kept local to avoid cross-test coupling.
 */
function runScriptWithInput(script, args, input, opts = {}) {
  const cwd = opts.cwd || PACKAGE_ROOT;
  const timeout = opts.timeout || 15000;

  return new Promise((resolve) => {
    const child = spawn('node', [script, ...args], { cwd });
    let stdout = '';
    let stderr = '';
    const timer = setTimeout(() => {
      child.kill();
      resolve({ exitCode: null, stdout, stderr });
    }, timeout);

    child.stdout.on('data', (data) => { stdout += data; });
    child.stderr.on('data', (data) => { stderr += data; });
    child.on('close', (code) => {
      clearTimeout(timer);
      resolve({ exitCode: code, stdout, stderr });
    });

    setTimeout(() => {
      child.stdin.write(input);
      child.stdin.end();
    }, 200);
  });
}

// ─── Story v63-2-3: post-upgrade governance gate tests ─────────────

describe('convoke-update governance gate (Story v63-2-3)', () => {
  // ── AC7 case 1: governance header renders after successful update (upgrade path) ──

  it('emits governance section header on successful upgrade-path update', async () => {
    const tmpDir = await createTempDir('bmad-gov-');
    try {
      // FIXTURE_VERSION (1.4.1) triggers the upgrade path via runMigrations.
      // Refresh-only path coverage is in a dedicated test below (R1-L5).
      await createInstallation(tmpDir, FIXTURE_VERSION);

      const { exitCode, stdout } = await runScriptWithInput(
        SCRIPT_PATH, ['--yes'], '', { cwd: tmpDir }
      );
      assert.equal(exitCode, 0, 'successful update should exit 0');
      // The governance header must appear after migration completes.
      assert.ok(
        stdout.includes('Post-upgrade governance check:'),
        `expected governance header; got:\n${stdout}`,
      );
    } finally {
      await fs.remove(tmpDir);
    }
  });

  // ── AC7 case 1b (R1-L5): governance header renders on refresh-only path ──

  it('emits governance section header on successful refresh-only update', async () => {
    const tmpDir = await createTempDir('bmad-gov-');
    try {
      // REFRESH_ONLY_FIXTURE (2.5.0) has no migration-registry entry matching
      // `2.5.x`, so `migrations.length === 0` and `assessUpdate` returns
      // `refresh-only` instead of `upgrade`. This exercises call-site #1 at
      // convoke-update.js line 207 (after `runRefreshOnly`), which the
      // FIXTURE_VERSION path doesn't touch. Closes the Round 1 L5 coverage
      // gap. The invariant is pinned by the assertion at the top of this
      // file (R2-L1).
      await createInstallation(tmpDir, REFRESH_ONLY_FIXTURE);

      const { exitCode, stdout } = await runScriptWithInput(
        SCRIPT_PATH, ['--yes'], '', { cwd: tmpDir }
      );
      assert.equal(exitCode, 0, 'refresh-only should exit 0');
      assert.ok(
        stdout.includes('Post-upgrade governance check:'),
        `expected governance header on refresh-only path; got:\n${stdout}`,
      );
      // Sanity: confirm refresh-only path was actually taken.
      assert.ok(
        stdout.includes('No migration deltas needed')
        || stdout.includes('refresh')
        || stdout.includes('Update completed'),
        `expected refresh-only path indicator; got:\n${stdout}`,
      );
    } finally {
      await fs.remove(tmpDir);
    }
  });

  // ── AC7 case 2: softWarning path (CSV absent — fresh fixture) ──

  it('emits yellow ⚠ when bmm-dependencies.csv is absent post-upgrade (softWarning)', async () => {
    const tmpDir = await createTempDir('bmad-gov-');
    try {
      await createInstallation(tmpDir, FIXTURE_VERSION);
      // createInstallation creates an _bmad/ tree but does NOT create
      // _bmad/_config/bmm-dependencies.csv — that's Story 2.1's artifact,
      // absent in pre-4.0 fixtures. The gate should emit the "registry not
      // found" softWarning and exit 0.
      const { exitCode, stdout } = await runScriptWithInput(
        SCRIPT_PATH, ['--yes'], '', { cwd: tmpDir }
      );
      assert.equal(exitCode, 0, 'softWarning must not escalate exit code (NFR9)');
      assert.ok(
        stdout.includes('Post-upgrade governance check:'),
        `expected governance header; got:\n${stdout}`,
      );
      // R2-M2: tightened from a permissive 3-way || (previous `'governance
      // warning'` alternative matched the summary-line wording regardless of
      // which finding surfaced — allowed false-positive greens). Now assert
      // the specific CSV-absent text that only Story 2.2's registry-missing
      // finding can emit.
      assert.ok(
        stdout.includes('bmm-dependencies.csv') && stdout.includes('not found'),
        `expected specific CSV-absent softWarning (bmm-dependencies.csv + "not found"); got:\n${stdout}`,
      );
    } finally {
      await fs.remove(tmpDir);
    }
  });

  // ── AC7 case 3: rendering — section header present ─────────────

  it('renders "Post-upgrade governance check:" section header', async () => {
    const tmpDir = await createTempDir('bmad-gov-');
    try {
      await createInstallation(tmpDir, FIXTURE_VERSION);
      const { stdout } = await runScriptWithInput(
        SCRIPT_PATH, ['--yes'], '', { cwd: tmpDir }
      );
      assert.ok(
        stdout.includes('Post-upgrade governance check:'),
        `section header missing; got:\n${stdout}`,
      );
    } finally {
      await fs.remove(tmpDir);
    }
  });

  // ── AC7 case 4: exit 0 with governance warnings (fail-soft) ────

  it('exits 0 even when governance warnings are surfaced', async () => {
    const tmpDir = await createTempDir('bmad-gov-');
    try {
      await createInstallation(tmpDir, FIXTURE_VERSION);
      const { exitCode, stdout } = await runScriptWithInput(
        SCRIPT_PATH, ['--yes'], '', { cwd: tmpDir }
      );
      assert.equal(exitCode, 0, 'NFR9 fail-soft: governance warnings must not affect exit code');
      // Sanity: the gate actually ran (not skipped by some prior failure).
      assert.ok(stdout.includes('Post-upgrade governance check:'));
    } finally {
      await fs.remove(tmpDir);
    }
  });

  // ── AC7 case 5: --dry-run skip ─────────────────────────────────

  it('does NOT render governance header in --dry-run mode', async () => {
    const tmpDir = await createTempDir('bmad-gov-');
    try {
      await createInstallation(tmpDir, FIXTURE_VERSION);
      const { exitCode, stdout } = await runScriptWithInput(
        SCRIPT_PATH, ['--dry-run', '--yes'], '', { cwd: tmpDir }
      );
      assert.equal(exitCode, 0);
      assert.ok(
        !stdout.includes('Post-upgrade governance check:'),
        `dry-run must skip the governance gate; got:\n${stdout}`,
      );
    } finally {
      await fs.remove(tmpDir);
    }
  });

  // ── AC7 case 6: governance link hint present when findings exist ──

  it('includes "Run `convoke-doctor`" hint when softWarnings are surfaced', async () => {
    const tmpDir = await createTempDir('bmad-gov-');
    try {
      await createInstallation(tmpDir, FIXTURE_VERSION);
      const { stdout } = await runScriptWithInput(
        SCRIPT_PATH, ['--yes'], '', { cwd: tmpDir }
      );
      // Either finding is present AND hint is present, or all-clean AND hint
      // is absent. Check both: if warning surfaced, hint must follow.
      if (stdout.includes('governance warning(s) surfaced')) {
        assert.ok(
          stdout.includes('Run `convoke-doctor`'),
          `hint missing after governance warnings; got:\n${stdout}`,
        );
      } else {
        // All-clean — hint should NOT appear per AC5.
        assert.ok(
          !stdout.includes('Run `convoke-doctor`'),
          `hint must not appear on all-clean summary; got:\n${stdout}`,
        );
      }
    } finally {
      await fs.remove(tmpDir);
    }
  });

  // ── AC7 case 7 (R1-H1 rewrite): direct helper test — gate-throw-tolerance ──
  //
  // Round 1 found the previous CLI-spawn-based test was broken: spawning
  // convoke-update after removing `.claude/skills/` didn't exercise the
  // fail-soft catch because `refreshInstallation` recreates the directory
  // before the gate runs. The scan couldn't throw. Test passed on incidental
  // string matches in other output, not on the intended path.
  //
  // Fix: directly invoke `_runPostUpgradeGate(projectRoot)` via the exposed
  // `_internal` export. Point it at a projectRoot with no `.claude/skills/`
  // to force `scanBmmDependencies` to throw, then assert the helper emits
  // the yellow fail-soft warning and returns without rethrowing.
  it('R1-H1: _runPostUpgradeGate catches checkBmmDependencies throws and does NOT rethrow', async () => {
    const { _internal } = require('../../scripts/update/convoke-update');
    const { _runPostUpgradeGate } = _internal;

    // Story 2.2's `checkBmmDependencies` catches its own scan errors and
    // returns structured findings. To exercise `_runPostUpgradeGate`'s OUTER
    // catch — which handles invocation-throw (contract drift in convoke-doctor
    // or unexpected internal errors in the check function) — we stub
    // `checkBmmDependencies` via require.cache so it throws directly.
    //
    // Scope-of-coverage note (R2-M1): this test covers the POST-LOAD contract-
    // drift / invocation-throw path. It does NOT cover actual cold-load
    // failure of convoke-doctor (syntax error, missing transitive dep) — the
    // pre-require at the next line warms the cache, so the gate's lazy-require
    // succeeds and sees the stubbed exports. Cold-load failure is covered
    // implicitly by the outer catch being shaped the same way; a dedicated
    // test would need a module-level mock framework not yet in use here.
    require('../../scripts/convoke-doctor');
    const doctorModulePath = require.resolve('../../scripts/convoke-doctor');
    const cached = require.cache[doctorModulePath];
    const original = cached.exports.checkBmmDependencies;
    cached.exports.checkBmmDependencies = () => {
      throw new Error('simulated gate internal bug');
    };

    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'gate-throw-'));
    try {
      const originalLog = console.log;
      const logs = [];
      console.log = (...args) => logs.push(args.join(' '));

      let threw = false;
      try {
        _runPostUpgradeGate(tmpDir);
      } catch (_err) {
        threw = true;
      } finally {
        console.log = originalLog;
      }

      assert.equal(threw, false,
        '_runPostUpgradeGate must never rethrow — NFR9 fail-soft contract');

      const combined = logs.join('\n');
      assert.ok(
        combined.includes('Governance gate: scan failed'),
        `expected outer-catch fail-soft warning; got:\n${combined}`,
      );
      assert.ok(
        combined.includes('simulated gate internal bug'),
        `warning should carry the underlying error message; got:\n${combined}`,
      );
      assert.ok(
        combined.includes('audit-bmm-dependencies.js --dry-run'),
        `warning should point at the debug command; got:\n${combined}`,
      );
    } finally {
      // Restore the real checkBmmDependencies so subsequent tests see the
      // normal contract. R2-M1 defensive guard: if another test removed the
      // cache entry between setup and restore, `cached` could be detached
      // from require.cache — guard the write to avoid a confusing TypeError
      // that would mask the original assertion failure (if any).
      if (cached && cached.exports) {
        cached.exports.checkBmmDependencies = original;
      }
      await fs.remove(tmpDir);
    }
  });

  // ── AC7 case 8 (R1-H1 bonus): direct helper test — summary math w/ hard-fails ──
  //
  // Story 2.2 never emits hard-fail (passed:false, softWarning:undefined)
  // findings in normal flow, but the R1-M1 fix added defensive accounting
  // for them. This test injects a synthetic findings array with both
  // soft and hard rows and asserts the summary line reports BOTH counts,
  // not just softWarnCount.
  it('R1-M1: summary math includes hardFailCount when both soft + hard findings exist', async () => {
    const { _internal } = require('../../scripts/update/convoke-update');
    const { _printPostUpgradeGate } = _internal;

    const originalLog = console.log;
    const logs = [];
    console.log = (...args) => logs.push(args.join(' '));

    try {
      _printPostUpgradeGate([
        { name: 'fake-hard', passed: false, error: 'simulated hard fail' },
        { name: 'fake-soft', passed: false, softWarning: true, warning: 'simulated soft' },
      ]);
    } finally {
      console.log = originalLog;
    }

    const combined = logs.join('\n');
    assert.ok(
      combined.includes('1 issue(s)') && combined.includes('1 governance warning(s)'),
      `summary must report BOTH hard and soft counts; got:\n${combined}`,
    );
  });

  // R2-M2: removed Legacy Test 9 (CLI-spawn with missing .claude/skills/).
  // It admitted in its own comment that `refreshInstallation` recreates the
  // directory before the gate runs, so `scanBmmDependencies` doesn't throw
  // — the assertion passed on incidental `.claude/skills` / `scan failed`
  // substring matches in unrelated output, not on the intended fail-soft
  // path. The direct-unit R1-H1 test above covers the real contract cleanly.
});
