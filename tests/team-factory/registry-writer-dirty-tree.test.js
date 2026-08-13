'use strict';

const { describe, it, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const { checkDirtyTree } = require('../../_bmad/bme/_team-factory/lib/writers/registry-writer');

// Regression tests for backlog I127.
//
// WHY THIS FILE EXISTS
// --------------------
// `checkDirtyTree` guards every team-factory write: if the target file carries uncommitted
// user edits, the writer refuses to touch it. The guard silently did not work for RELATIVE
// paths. `cwd` is set to the file's own directory, so git resolved the pathspec against that
// directory and looked for `<dirname>/<full-relative-path>` — a path that does not exist —
// then reported a genuinely-modified file as clean. The write proceeded and overwrote the
// user's work.
//
// It went unnoticed because the sibling helper `runNodeRequire` DID resolve its path, so the
// two code paths disagreed and only one was wrong. Five call sites depend on this guard
// (registry-writer, csv-appender, config-appender ×2, registry-appender ×2).
//
// These tests run against a REAL throwaway git repo rather than mocks, because the defect
// lived in git's pathspec resolution, not in JavaScript — a mocked `spawnSync` would have
// happily reproduced the bug and passed.

function git(cwd, args) {
  execFileSync('git', args, { cwd, stdio: 'pipe' });
}

/** A disposable git repo with one committed file. Returns { dir, rel, abs }. */
function makeRepo() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'i127-'));
  git(dir, ['init', '-q']);
  git(dir, ['config', 'user.email', 't@t']);
  git(dir, ['config', 'user.name', 't']);
  const rel = path.join('nested', 'deep', 'registry.js');
  const abs = path.join(dir, rel);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, 'module.exports = {};\n');
  git(dir, ['add', '-A']);
  git(dir, ['commit', '-qm', 'base']);
  return { dir, rel, abs };
}

const created = [];
afterEach(() => {
  while (created.length) fs.rmSync(created.pop(), { recursive: true, force: true });
});

describe('checkDirtyTree path resolution (I127)', () => {
  it('detects a dirty file when given a RELATIVE path (the regression)', () => {
    const { dir, rel, abs } = makeRepo();
    created.push(dir);
    fs.appendFileSync(abs, '// uncommitted user edit\n');

    // Run from inside the repo so a relative path is meaningful.
    const cwd = process.cwd();
    try {
      process.chdir(dir);
      const result = checkDirtyTree(rel);
      assert.equal(
        result.dirty,
        true,
        'relative path reported a modified file as CLEAN — the writer would overwrite uncommitted work'
      );
      assert.match(result.diff, /registry\.js/);
    } finally {
      process.chdir(cwd);
    }
  });

  it('relative and absolute paths agree', () => {
    const { dir, rel, abs } = makeRepo();
    created.push(dir);
    fs.appendFileSync(abs, '// uncommitted user edit\n');

    const cwd = process.cwd();
    try {
      process.chdir(dir);
      const viaRel = checkDirtyTree(rel);
      const viaAbs = checkDirtyTree(abs);
      assert.deepEqual(viaRel, viaAbs, 'the two path forms disagree — one of them is lying');
    } finally {
      process.chdir(cwd);
    }
  });

  it('reports a committed, unmodified file as clean', () => {
    const { dir, abs } = makeRepo();
    created.push(dir);
    // Guards against "fix" by always returning dirty: the check must still be able to say no.
    assert.deepEqual(checkDirtyTree(abs), { dirty: false, diff: '' });
  });

  it('detects staged-only changes, not just unstaged', () => {
    const { dir, abs } = makeRepo();
    created.push(dir);
    fs.appendFileSync(abs, '// staged edit\n');
    git(dir, ['add', abs]);
    assert.equal(checkDirtyTree(abs).dirty, true, 'staged changes are uncommitted work too');
  });

  it('treats pathspec metacharacters literally', () => {
    // Without --literal-pathspecs a `*` in a real filename is a glob: it would match unrelated
    // files and report a clean file as dirty (blocking a legitimate write), while a leading `:`
    // errors to status 128 and folds into the false-clean path.
    const { dir } = makeRepo();
    created.push(dir);
    const odd = path.join(dir, 'we*ird.js');
    fs.writeFileSync(odd, 'x\n');
    git(dir, ['add', '-A']);
    git(dir, ['commit', '-qm', 'odd']);
    assert.deepEqual(
      checkDirtyTree(odd),
      { dirty: false, diff: '' },
      'a committed file whose name contains * was misread as a glob'
    );
  });

  it('returns clean outside a git repo rather than throwing', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'i127-nogit-'));
    created.push(dir);
    const f = path.join(dir, 'x.js');
    fs.writeFileSync(f, 'x\n');
    // Fail-open is the pre-existing, deliberate contract: no git means no opinion.
    assert.deepEqual(checkDirtyTree(f), { dirty: false, diff: '' });
  });
});
