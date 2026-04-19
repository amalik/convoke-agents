'use strict';

// T4 — Migration idempotency CLI test.
//
// Verifies that running `convoke-migrate --apply --force` twice doesn't
// break state. `scripts/migrate-artifacts.js:278` (`detectMigrationState`)
// implements idempotent recovery: if the previous migration is complete and
// no new ungoverned files exist, the second run exits cleanly with
// "Nothing to migrate" and makes no new commits.
//
// Existing coverage: unit tests cover `parseArgs` and `detectMigrationState`
// in isolation. This suite closes the gap at the CLI integration level:
// the full `convoke-migrate` child-process flow against a real git repo.

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const fs = require('fs-extra');
const os = require('os');
const { execFileSync } = require('child_process');

const { runScript, PACKAGE_ROOT } = require('../helpers');

const MIGRATE_SCRIPT = path.join(PACKAGE_ROOT, 'scripts/migrate-artifacts.js');

// Hermetic git invocation. Neutralize global pollution that could hang CI:
//  - `core.hooksPath=/dev/null`: ignore globally-configured pre-commit hooks
//    (husky, etc.) that would block waiting on an interactive editor.
//  - `commit.gpgsign=false`: force-off signing regardless of user config.
//  - `GIT_TERMINAL_PROMPT=0`: bail on any prompt instead of hanging.
//  - `timeout: 15000`: cap each git call (seed commits are sub-second in practice).
function git(cwd, args) {
  return execFileSync(
    'git',
    ['-c', 'core.hooksPath=/dev/null', '-c', 'commit.gpgsign=false', ...args],
    {
      cwd,
      stdio: 'pipe',
      encoding: 'utf8',
      timeout: 15000,
      env: { ...process.env, GIT_TERMINAL_PROMPT: '0' },
    }
  );
}

// Seed a minimal Convoke-shaped project: git-initialized, one ungoverned
// planning artifact using the legacy `type-initiative` convention that the
// migration should rewrite to `initiative-type`.
async function seedProject(tmpDir) {
  git(tmpDir, ['init', '-q']);
  git(tmpDir, ['config', 'user.email', 'test@convoke.test']);
  git(tmpDir, ['config', 'user.name', 'Convoke T4 Test']);

  // `findProjectRoot` walks up looking for a `_bmad/` dir — create it so the
  // CLI recognizes the tmp dir as a Convoke project.
  await fs.ensureDir(path.join(tmpDir, '_bmad'));

  const planning = path.join(tmpDir, '_bmad-output/planning-artifacts');
  await fs.ensureDir(planning);

  // Seed an ungoverned file in legacy format. "gyre" is a platform initiative;
  // "prd" is a canonical artifact_type. Migration should rename
  //   prd-gyre.md  →  gyre-prd.md
  // and inject frontmatter + generate an ADR.
  await fs.writeFile(
    path.join(planning, 'prd-gyre.md'),
    '# Gyre PRD\n\nSeeded by T4 fixture.\n',
    'utf8'
  );

  // Initial commit so `detectMigrationState` has a git log to read.
  git(tmpDir, ['add', '-A']);
  git(tmpDir, ['commit', '-q', '-m', 'seed: ungoverned gyre PRD']);
}

function gitLogCount(cwd) {
  const out = git(cwd, ['rev-list', '--count', 'HEAD']).trim();
  const n = parseInt(out, 10);
  // Defensive: `parseInt('', 10)` is NaN; catch silent failure modes early.
  if (!Number.isInteger(n)) {
    throw new Error(`gitLogCount: expected integer, got ${JSON.stringify(out)}`);
  }
  return n;
}

// Guard against silently-downgraded failures in the migration CLI —
// `scripts/migrate-artifacts.js` emits `Warning: …` on stderr while still
// exiting 0. A regression in `verifyHistoryChain` or the ADR phase would pass
// the exit-code check but leave a warning trail.
//
// Two warning classes are ALLOWED in this test's fixture context:
//   1. "Previous ADR not found ... Skipping supersession." — expected on the
//      first run of any fresh fixture; the supersede-target ADR from the
//      2026-03-22 era isn't present.
//   2. "ADR generation failed: Command failed: git commit …" — the known
//      byte-identical-ADR bug documented in deferred-work.md under
//      "scope of T4". Fires on the third run because the ADR content is
//      deterministic over (date, rename-count, scopeDirs) and therefore
//      identical to the first run's ADR → `git commit` errors on empty tree.
// Any OTHER `Warning:` / `failed` line indicates an unexpected regression.
const ALLOWED_WARNING_PATTERNS = [
  /Previous ADR not found at expected path\. Skipping supersession\./,
  /ADR generation failed: Command failed: git commit/,
  /Migration data is intact/,
];

function assertNoUnexpectedWarnings(stderr, label) {
  const lines = stderr.split('\n').filter(l => l.length > 0);
  const unexpected = lines.filter(l =>
    /Warning:|failed/i.test(l) && !ALLOWED_WARNING_PATTERNS.some(re => re.test(l))
  );
  assert.equal(
    unexpected.length,
    0,
    `${label} stderr contains unexpected warnings:\n${unexpected.join('\n')}\n\nFull stderr:\n${stderr}`
  );
}

describe('convoke-migrate CLI idempotency (T4)', () => {
  let tmpDir;

  before(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'convoke-t4-migrate-'));
    await seedProject(tmpDir);
  });

  after(async () => {
    await fs.remove(tmpDir);
  });

  it('first run renames ungoverned file and creates migration commits', async () => {
    const baselineCommits = gitLogCount(tmpDir);
    assert.equal(baselineCommits, 1, 'fixture should start with exactly 1 commit');

    const result = await runScript(MIGRATE_SCRIPT, ['--apply', '--force'], { cwd: tmpDir, timeout: 60000 });
    assert.equal(result.exitCode, 0, `first migrate run must exit 0\nstdout:\n${result.stdout}\nstderr:\n${result.stderr}`);
    // Guard against silently-downgraded failures: `scripts/migrate-artifacts.js`
    // emits `Warning: …` / `ADR generation failed: …` on stderr while still
    // exiting 0. A regression in `verifyHistoryChain` or the ADR phase would
    // pass the exit-code check but leave a warning trail.
    assertNoUnexpectedWarnings(result.stderr, 'first run');

    // File renamed to governance convention.
    const newPath = path.join(tmpDir, '_bmad-output/planning-artifacts/gyre-prd.md');
    const oldPath = path.join(tmpDir, '_bmad-output/planning-artifacts/prd-gyre.md');
    assert.ok(fs.existsSync(newPath), 'gyre-prd.md must exist after migration');
    assert.ok(!fs.existsSync(oldPath), 'prd-gyre.md must no longer exist');

    const commitsAfterFirstRun = gitLogCount(tmpDir);
    assert.ok(
      commitsAfterFirstRun > baselineCommits,
      `migration must create commits (baseline=${baselineCommits}, after=${commitsAfterFirstRun})`
    );
  });

  it('second run is a functional no-op — exits 0 AND creates zero new commits', async () => {
    // Re-read commit count fresh — no cross-test state coupling, so a failure
    // in test 1 can't cascade into a misleading undefined-baseline comparison.
    const commitsBefore = gitLogCount(tmpDir);

    const result = await runScript(MIGRATE_SCRIPT, ['--apply', '--force'], { cwd: tmpDir, timeout: 60000 });
    assert.equal(result.exitCode, 0, `second run must exit 0\nstdout:\n${result.stdout}\nstderr:\n${result.stderr}`);
    assertNoUnexpectedWarnings(result.stderr, 'second run');

    const commitsAfter = gitLogCount(tmpDir);
    // The HARD idempotency proof — stdout messages are not the contract
    // (they vary between `"Nothing to migrate"` and `"Nothing to rename"`
    // depending on whether the first run's meta-artifacts got re-flagged —
    // see `deferred-work.md` under "scope of T4"). Commit-count equality is
    // the actual functional guarantee.
    assert.equal(
      commitsAfter,
      commitsBefore,
      `second run must not add commits (before=${commitsBefore}, after=${commitsAfter})`
    );
  });

  it('third run after adding a new ungoverned file resumes migration with the expected commit delta', async () => {
    const newFile = path.join(tmpDir, '_bmad-output/planning-artifacts/epic-gyre.md');
    await fs.writeFile(newFile, '# New Gyre Epic\n\nAdded after first migration.\n', 'utf8');
    git(tmpDir, ['add', '-A']);
    git(tmpDir, ['commit', '-q', '-m', 'seed: add ungoverned epic after migration']);

    const commitsBefore = gitLogCount(tmpDir);
    const result = await runScript(MIGRATE_SCRIPT, ['--apply', '--force'], { cwd: tmpDir, timeout: 60000 });
    assert.equal(result.exitCode, 0, `third run must exit 0\nstdout:\n${result.stdout}\nstderr:\n${result.stderr}`);
    assertNoUnexpectedWarnings(result.stderr, 'third run');

    // New file renamed to governance convention.
    const migratedPath = path.join(tmpDir, '_bmad-output/planning-artifacts/gyre-epic.md');
    const origPath = path.join(tmpDir, '_bmad-output/planning-artifacts/epic-gyre.md');
    assert.ok(fs.existsSync(migratedPath), 'gyre-epic.md must exist after third run');
    assert.ok(!fs.existsSync(origPath), 'epic-gyre.md must no longer exist');

    // Tight commit-count bound — migration creates up to 3 commits
    // (rename, injection, ADR). ADR commit may be skipped when the ADR content
    // is byte-identical to the previous run's ADR (same date, same rename count).
    // Accept 2-3 new commits; reject 1 (rename-without-injection would indicate
    // a real regression) and reject 4+ (unexpected extra work).
    const delta = gitLogCount(tmpDir) - commitsBefore;
    assert.ok(
      delta >= 2 && delta <= 3,
      `third run should produce 2-3 new commits (rename + injection [+ ADR]); got ${delta}`
    );
  });
});
