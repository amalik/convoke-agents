'use strict';

const { describe, it, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const { checkDirtyTree } = require('../../_bmad/bme/_team-factory/lib/writers/registry-writer');
const { initGitFixture, removeTempDirSync } = require('../helpers');

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
  initGitFixture(dir);
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
  while (created.length) removeTempDirSync(created.pop());
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

  it('treats pathspec metacharacters literally (glob must not match a sibling)', () => {
    // An earlier version of this test committed a `we*ird.js` file and asserted it was clean.
    // That assertion CANNOT FAIL: a committed file is clean whether or not `*` is globbed,
    // because anything the glob also matched was equally clean. Verified vacuous by removing
    // `--literal-pathspecs` and watching it still pass. Caught by code review 2026-08-13.
    //
    // To discriminate, the glob must be able to change the answer: query the LITERAL
    // `we*ird.js` (clean) while a DIRTY sibling `weird.js` exists, which `we*ird` would match.
    //   with --literal-pathspecs -> clean  (correct: only the literal file is considered)
    //   without                  -> dirty  (wrong: the glob picks up the sibling)
    const { dir } = makeRepo();
    created.push(dir);
    const literal = path.join(dir, 'we*ird.js');
    const sibling = path.join(dir, 'weird.js');
    fs.writeFileSync(literal, 'literal\n');
    fs.writeFileSync(sibling, 'sibling\n');
    git(dir, ['add', '-A']);
    git(dir, ['commit', '-qm', 'both']);

    // Dirty ONLY the sibling. The literal file is untouched.
    fs.appendFileSync(sibling, '// uncommitted\n');

    assert.deepEqual(
      checkDirtyTree(literal),
      { dirty: false, diff: '' },
      '`*` was interpreted as a glob and picked up the dirty sibling — a legitimate write would be blocked'
    );
    // Control: the sibling really is dirty, so the assertion above is not passing by accident.
    assert.equal(checkDirtyTree(sibling).dirty, true, 'fixture is wrong — the sibling is not dirty');
  });

  // --- fail-closed behaviours (code review 2026-08-14) -------------------------------
  // The I127 fix corrected ONE input that fell into the fail-open bucket (relative paths); it
  // did not change the bucket. `runGitDiff` collapsed spawn failure, timeout and every non-zero
  // exit into '', which read as "no diff, safe to overwrite". These cover the four doors into
  // that silent false-clean. Each was verified to report `dirty:false` before the fix.

  it('refuses an UNTRACKED file carrying user content', () => {
    const { dir } = makeRepo();
    created.push(dir);
    // The case that will actually bite: team-factory writes config.yaml / module-help.csv, and a
    // file the user just created is untracked by definition — so it produces no diff output.
    const untracked = path.join(dir, 'config.yaml');
    fs.writeFileSync(untracked, 'user: precious content\n');
    assert.equal(checkDirtyTree(untracked).dirty, true, 'untracked user content would be overwritten');
  });

  it('refuses a GITIGNORED file carrying user content', () => {
    const { dir } = makeRepo();
    created.push(dir);
    fs.writeFileSync(path.join(dir, '.gitignore'), 'local.yaml\n');
    git(dir, ['add', '-A']);
    git(dir, ['commit', '-qm', 'ignore']);
    const ignored = path.join(dir, 'local.yaml');
    fs.writeFileSync(ignored, 'local override\n');
    assert.equal(checkDirtyTree(ignored).dirty, true, 'gitignored local overrides would be overwritten');
  });

  it('follows a SYMLINK to the real file, and agrees with the direct path', () => {
    const { dir, abs } = makeRepo();
    created.push(dir);
    fs.appendFileSync(abs, '// uncommitted\n');
    const link = path.join(dir, 'link.js');
    fs.symlinkSync(abs, link);
    assert.deepEqual(
      checkDirtyTree(link),
      checkDirtyTree(abs),
      'the same dirty file gave different answers via symlink vs direct path'
    );
    assert.equal(checkDirtyTree(link).dirty, true);
  });

  it('refuses non-string or empty input instead of silently reporting clean', () => {
    for (const bad of [undefined, null, 42, {}, '', '   ']) {
      const r = checkDirtyTree(bad);
      assert.equal(r.dirty, true, `checkDirtyTree(${JSON.stringify(bad)}) reported CLEAN`);
      assert.match(r.diff, /unverifiable/);
    }
  });

  it('is not fooled by an inherited GIT_DIR pointing at another repo', () => {
    // THIS TEST WAS VACUOUS until 2026-08-14 and is kept as a worked example of the failure mode.
    //
    // The original asserted that a DIRTY file still reported dirty with GIT_DIR spoofed. That
    // cannot fail. When GIT_DIR is set but GIT_WORK_TREE is not, git falls back to `cwd` for the
    // work tree — which is already correct here — so only the object database comes from the
    // wrong repo. And because `makeRepo()` committed byte-identical content in both repos, a diff
    // against the WRONG repo's blob still surfaced the real edit. It passed for a reason that had
    // nothing to do with the fix. Proven by deleting gitEnv()'s neutralisation and watching it
    // stay green.
    //
    // To discriminate, the wrong repo must give a DIFFERENT answer from the right one. So: commit
    // DIFFERENT content at the same relative path in the other repo, and assert on a CLEAN file.
    //   neutralised (correct) -> clean, because the real repo's blob matches the file
    //   leaked GIT_DIR        -> dirty, because the other repo's blob does not
    const { dir, abs } = makeRepo();
    const other = makeRepo();
    created.push(dir, other.dir);
    fs.writeFileSync(other.abs, 'module.exports = { DIFFERENT: true };\n');
    git(other.dir, ['add', '-A']);
    git(other.dir, ['commit', '-qm', 'divergent']);

    const saved = process.env.GIT_DIR;
    process.env.GIT_DIR = path.join(other.dir, '.git');
    try {
      assert.deepEqual(
        checkDirtyTree(abs),
        { dirty: false, diff: '' },
        'inherited GIT_DIR leaked into the child — the guard answered about the wrong repo'
      );
    } finally {
      if (saved === undefined) delete process.env.GIT_DIR;
      else process.env.GIT_DIR = saved;
    }
  });

  // NOT TESTED, deliberately: gitEnv() also clears GIT_WORK_TREE and GIT_INDEX_FILE, and no
  // discriminating test for those two exists. Two attempts were written and both proved VACUOUS
  // under mutation (neuter gitEnv(), test stays green):
  //   - GIT_WORK_TREE alone: git ignores it without a paired GIT_DIR, so it has no effect at all.
  //   - all three together: git then reports cwd as OUTSIDE the work tree, so `isInsideWorkTree`
  //     returns false and the guard fails open to `{dirty:false}` — the same observable as the
  //     correct answer, for an entirely different reason.
  // Clearing them is retained as defence-in-depth, but it is UNVERIFIED and should not be counted
  // as covered. The GIT_DIR test below is the real one.

  it('refuses a file marked assume-unchanged (git stops reporting edits)', () => {
    const { dir, abs } = makeRepo();
    created.push(dir);
    git(dir, ['update-index', '--assume-unchanged', abs]);
    fs.appendFileSync(abs, '// uncommitted user work\n');
    // Control: git itself is now blind, so all three diff probes legitimately see nothing.
    assert.equal(execFileSync('git', ['diff', '--name-only', '--', abs], { cwd: dir }).toString().trim(), '');
    assert.equal(checkDirtyTree(abs).dirty, true, 'assume-unchanged hid real uncommitted work');
  });

  it('refuses a file marked skip-worktree (the sparse-checkout idiom)', () => {
    const { dir, abs } = makeRepo();
    created.push(dir);
    git(dir, ['update-index', '--skip-worktree', abs]);
    fs.appendFileSync(abs, '// uncommitted user work\n');
    assert.equal(checkDirtyTree(abs).dirty, true, 'skip-worktree hid real uncommitted work');
  });

  describe('git refusing to operate is NOT the same as "no repo"', () => {
    // git >= 2.35.2 refuses a repo owned by another UID ("detected dubious ownership") with
    // exit 128 and EMPTY stdout — byte-for-byte the same shape as a genuine non-repo, differing
    // only in localised stderr text that cannot be matched on. Treating that as "no repo"
    // disabled this guard outright in containers and CI. A stub `git` on PATH reproduces the
    // shape deterministically, without needing another UID.
    function withStubGit(fn) {
      const bin = fs.mkdtempSync(path.join(os.tmpdir(), 'stubgit-'));
      fs.writeFileSync(path.join(bin, 'git'), '#!/bin/sh\nexit 128\n');
      fs.chmodSync(path.join(bin, 'git'), 0o755);
      const saved = process.env.PATH;
      process.env.PATH = `${bin}:${saved}`;
      try {
        return fn();
      } finally {
        process.env.PATH = saved;
        fs.rmSync(bin, { recursive: true, force: true });
      }
    }

    it('fails CLOSED when git refuses inside a real repo', () => {
      const { dir, abs } = makeRepo();
      created.push(dir);
      const result = withStubGit(() => checkDirtyTree(abs));
      assert.equal(result.dirty, true, 'a git refusal inside a real repo was read as "clean"');
      assert.match(result.diff, /unverifiable/);
    });

    it('still fails OPEN in a genuine non-git project', () => {
      // The operator contract. The discriminator is the presence of a `.git` ancestor, so this
      // must keep working even when git itself is telling us nothing.
      const plain = fs.mkdtempSync(path.join(os.tmpdir(), 'i127-plain-'));
      created.push(plain);
      const f = path.join(plain, 'x.js');
      fs.writeFileSync(f, 'x\n');
      assert.deepEqual(withStubGit(() => checkDirtyTree(f)), { dirty: false, diff: '' });
    });
  });

  it('returns clean outside a git repo rather than throwing', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'i127-nogit-'));
    created.push(dir);
    const f = path.join(dir, 'x.js');
    fs.writeFileSync(f, 'x\n');
    // Fail-open here is the pre-existing, DELIBERATE contract — Team Factory is supported in
    // projects that are not git repositories. Code review 2026-08-14 tightened everything else to
    // fail CLOSED, so this case is now established positively via `git rev-parse
    // --is-inside-work-tree` rather than by treating every git failure as "clean". Exit status
    // alone cannot separate them: `git diff` outside a repo and `git diff --bogus` inside one both
    // exit 129.
    assert.deepEqual(checkDirtyTree(f), { dirty: false, diff: '' });
  });
});
