'use strict';

/**
 * The conversion tooling must stay OUT of the package (story dist-2.3a) and IN the repository.
 *
 * WHY THIS FILE EXISTS
 * --------------------
 * Nothing else asserts the exclusion, and the gate that would eventually notice a regression
 * (`assert-shipped-links.js`) is not blocking until dist-2.3c — so between now and then a
 * re-inclusion would be invisible, and with it the 18 unfollowable links the story removed.
 *
 * THE ASSERTION THAT MATTERS IS THE ONE PUT TO NPM. Rounds 1-3 of this story produced four
 * hand-written attempts to reason about npm's pattern semantics — first inside
 * `installed-tree.js`, then in an earlier version of this file's "does a later entry re-include
 * it?" guard. Adversarial review broke every one; the last fell to `scripts/../_bmad/bme/_ghost`,
 * which npm resolves and ships. The lesson is in the test below: ask npm, which owns the
 * semantics, and the answer covers vectors nobody has thought of.
 *
 * The second half is the AC3 half: the directory is removed from `files[]` ONLY. Five i97 agent
 * conversions still run through it (I97 Epic 2 is 2 of 7), so a future cleanup that deletes it
 * would break live tooling. `tests/lib/format-conversion-load.test.js` proves the modules still
 * load; this proves they are still there to load.
 */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const { execFileSync } = require('child_process');
const path = require('path');

const { PACKAGE_ROOT } = require('../helpers');

const DIR = 'scripts/migration/format-conversion';
const pkg = JSON.parse(fs.readFileSync(path.join(PACKAGE_ROOT, 'package.json'), 'utf8'));

describe('dist-2.3a: the conversion tooling is excluded from the package', () => {
  it('the exclusion lives in a .npmignore INSIDE the directory', () => {
    // Not a `!` negation in files[], deliberately. A negation puts a glob metacharacter into
    // files[], which `scripts/audit/lib/installed-tree.js` reads to build the expected set of
    // `_bmad/bme/*` modules — and teaching that to tell a harmless negation from a pattern which
    // shrinks the set means re-deriving npm's glob semantics by hand. Four attempts, all broken.
    // Excluding from inside the directory needs no pattern in files[] at all.
    const ignore = fs.readFileSync(path.join(PACKAGE_ROOT, DIR, '.npmignore'), 'utf8');
    assert.match(ignore, /^\*$/m, '.npmignore must exclude the directory contents');
  });

  it('files[] carries no glob metacharacter, so the module enumerator cannot misread it', () => {
    // The property the .npmignore approach buys, asserted rather than assumed. If a future change
    // reintroduces a pattern here, `shippedBmeModules` has to reason about it again.
    const patterned = pkg.files.filter(f => /[*?[\]{}!]/.test(f));
    assert.deepEqual(patterned, [], `files[] entries carrying glob metacharacters: ${patterned.join(', ')}`);
  });

  it('the packed TARBALL contains none of it — asked of npm, not of the pattern list', () => {
    // THE ONLY ASSERTION HERE THAT TESTS THE ARTIFACT, and the one that would survive any change
    // of mechanism. Every other case reads configuration; this one reads what npm would actually
    // publish. It is what catches a re-inclusion however it arrives — a widened files[], a deleted
    // .npmignore, a pattern nobody predicted.
    //
    // `--dry-run` performs no network I/O and does not write a tarball.
    const out = execFileSync('npm', ['pack', '--dry-run', '--json'], {
      cwd: PACKAGE_ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'],
    });
    const packed = JSON.parse(out)[0].files.map(f => f.path);
    assert.ok(packed.length > 100, `sanity: expected a full package listing, got ${packed.length} paths`);
    const leaked = packed.filter(f => f.startsWith(DIR));
    assert.deepEqual(leaked, [], `${leaked.length} conversion-tooling file(s) shipped: ${leaked.slice(0, 3).join(', ')}`);
  });

  it('records WHY, in both places a reader might look', () => {
    // AC3: an operator has no use for the tooling, but a contributor does, so the reason it is
    // excluded AND the reason it must not be DELETED have to be findable. The mechanism lives in
    // the directory, so someone reading package.json needs a pointer to it, and someone reading
    // the .npmignore needs the rationale there too.
    assert.equal(typeof pkg['//files'], 'string');
    assert.match(pkg['//files'], /format-conversion/);
    assert.match(pkg['//files'], /must not be deleted/i);
    assert.match(pkg['//files'], /npmignore/i, 'package.json must point at where the exclusion lives');
    const ignore = fs.readFileSync(path.join(PACKAGE_ROOT, DIR, '.npmignore'), 'utf8');
    assert.match(ignore, /NOT DELETED/i, 'the .npmignore must say the directory is still maintained');
  });
});

describe('dist-2.3a: …and still present in the repository (AC3)', () => {
  it('the directory and its modules are still on disk', () => {
    // Excluded from the PACKAGE only. Five i97 conversions still run through these.
    for (const f of ['README.md', 'fixup-checklist.md', 'parity-harness.js',
      'covenant-survival-harness.js', 'personality-harness.js',
      'fixtures/tmpDir-setup.js', 'fixtures/isolated-install.js']) {
      assert.ok(fs.existsSync(path.join(PACKAGE_ROOT, DIR, f)), `${DIR}/${f} must not be deleted`);
    }
  });

  it('is still linted — and this RUNS eslint rather than reading its config', () => {
    // An earlier version asserted only that eslint.config.mjs does not name the directory, which
    // narrowing eslint's `files` globs would leave green. Ask the tool: exit 0 AND a non-empty
    // file list, so "linted clean" cannot be confused with "linted nothing".
    const out = execFileSync('npx', ['eslint', '--format', 'json', DIR], {
      cwd: PACKAGE_ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'],
    });
    const results = JSON.parse(out);
    assert.ok(results.length > 0, 'eslint linted zero files — the directory has fallen out of scope');
    const errors = results.reduce((n, r) => n + r.errorCount, 0);
    assert.equal(errors, 0, 'the conversion tooling must stay lint-clean while it is still maintained');
  });
});
