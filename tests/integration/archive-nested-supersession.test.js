'use strict';

// BUG-21 / scan-1-1 AC4 — supersession must not cross directory boundaries.
//
// `scripts/archive.js` MOVES the older of two dated files sharing a base name. Its
// `groupByKey` keys on the base name alone and has no notion of depth. Before BUG-21,
// `scanArtifactDirs` never recursed, so that was safe by accident: a nested file was
// never in the input. Making the scanner recursive removed the accident.
//
// Two failures were possible, and this suite covers both:
//   1. Cross-directory grouping — `planning-artifacts/x-2026-01-01.md` treated as a
//      superseded version of `planning-artifacts/adr/x-2026-02-01.md`, and archived.
//   2. Path reconstruction — the action was built as `path.join(fullDir, filename)`,
//      which for a nested file names a path that does not exist, or a *different* file
//      that happens to share the base name.
//
// Runs the real CLI in DRY-RUN (no `--apply`): the script prints its plan and moves
// nothing. Asserting on the plan is what makes this test safe to run.

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const fs = require('fs-extra');
const os = require('os');

const { runScript, PACKAGE_ROOT, removeTempDir } = require('../helpers');

const ARCHIVE_SCRIPT = path.join(PACKAGE_ROOT, 'scripts/archive.js');

describe('archive.js — nested supersession (BUG-21 AC4)', () => {
  let tmpDir;
  let planning;

  before(async () => {
    // Fixture in a real temp dir, never PACKAGE_ROOT (`test-fixture-isolation`).
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'convoke-archive-nested-'));
    planning = path.join(tmpDir, '_bmad-output', 'planning-artifacts');
    await fs.ensureDir(path.join(planning, 'adr'));
    await fs.ensureDir(path.join(tmpDir, '_bmad-output', '_archive'));

    // findProjectRoot walks up looking for a project marker; give it one.
    await fs.writeJson(path.join(tmpDir, 'package.json'), { name: 'fixture', version: '0.0.0' });
    await fs.ensureDir(path.join(tmpDir, '_bmad'));

    // Same base name, different dated versions, DIFFERENT directories. Nothing here
    // may be grouped: they are unrelated documents that share a stem.
    await fs.writeFile(path.join(planning, 'convoke-note-x-2026-01-01.md'), '# top level, older');
    await fs.writeFile(path.join(planning, 'adr', 'convoke-note-x-2026-02-01.md'), '# nested, newer');

    // A genuine same-directory pair, to prove the guard did not disable supersession
    // altogether — the failure mode a naive fix produces.
    await fs.writeFile(path.join(planning, 'convoke-note-y-2026-01-01.md'), '# older');
    await fs.writeFile(path.join(planning, 'convoke-note-y-2026-03-01.md'), '# newer');
  });

  after(async () => {
    await removeTempDir(tmpDir);
  });

  it('does not group same-named dated files across directories', async () => {
    const res = await runScript(ARCHIVE_SCRIPT, [], { cwd: tmpDir });
    assert.equal(res.exitCode, 0, `archive.js exited ${res.exitCode}: ${res.stderr}`);
    assert.ok(
      !res.stdout.includes('convoke-note-x-2026-01-01.md'),
      'the top-level x file must not be proposed for archival — its "newer version" is a ' +
      `different document in adr/. Output was:\n${res.stdout}`
    );
  });

  it('still supersedes within a single directory', async () => {
    const res = await runScript(ARCHIVE_SCRIPT, [], { cwd: tmpDir });
    assert.equal(res.exitCode, 0);
    assert.ok(
      res.stdout.includes('convoke-note-y-2026-01-01.md'),
      `the older y file shares a directory with its successor and must still be proposed. ` +
      `Output was:\n${res.stdout}`
    );
  });

  it('moves nothing in dry-run', async () => {
    await runScript(ARCHIVE_SCRIPT, [], { cwd: tmpDir });
    for (const rel of [
      'convoke-note-x-2026-01-01.md',
      'convoke-note-y-2026-01-01.md',
      path.join('adr', 'convoke-note-x-2026-02-01.md')
    ]) {
      assert.ok(await fs.pathExists(path.join(planning, rel)), `${rel} must still exist`);
    }
  });
});
