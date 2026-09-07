'use strict';

/**
 * The migration guide ships; the rest of `docs/` does not (story dist-2.3c).
 *
 * WHY THIS FILE EXISTS
 * --------------------
 * ADR-002 Class 3 rules that `docs/migration/3.x-to-4.0.md` must reach the package: CHANGELOG.md
 * links it twice and it is the single most useful page an upgrading npm reader can follow. The
 * other 17 files under `docs/` are repository-facing.
 *
 * That turned out not to be expressible in `files[]` alone. npm keeps `README.md` in any directory
 * it walks, so ANY `docs/` entry also ships `docs/README.md` — measured 2026-09-07 by controlled
 * experiment, and the named-file form `docs/migration/3.x-to-4.0.md` did NOT avoid it either. That
 * file carries 7 relative links into repository-only siblings, so it arrives in the package with 7
 * broken links. `docs/.npmignore` excludes it.
 *
 * These tests exist because that exclusion is invisible from `files[]`. A reader checking
 * `package.json` sees `docs/migration/` and concludes the guide ships and nothing else does; both
 * halves are true only because of a file in another directory that nothing else references.
 *
 * WHAT THESE TESTS DO NOT PROVE. They assert what reaches the PACKAGE, not what reaches an
 * installed project — no install path copies `docs/`, the same gap `_bmad/bme/_portability/` and
 * `_bmad/bme/covenant/` have (dist-2-6, backlogged). Said plainly because a test file that implies
 * the problem is fully solved is worse than one that names what is left.
 */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const { execFileSync } = require('child_process');
const path = require('path');

const { PACKAGE_ROOT } = require('../helpers');

const GUIDE = 'docs/migration/3.x-to-4.0.md';
const EXCLUDED = 'docs/README.md';
const pkg = JSON.parse(fs.readFileSync(path.join(PACKAGE_ROOT, 'package.json'), 'utf8'));

/** Ask npm what it would publish, rather than re-deriving its glob and ignore semantics here. */
function packedPaths() {
  const out = execFileSync('npm', ['pack', '--dry-run', '--json'], {
    cwd: PACKAGE_ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'],
  });
  const files = JSON.parse(out)[0].files.map(f => f.path);
  assert.ok(files.length > 100, `sanity: expected a full listing, got ${files.length}`);
  return files;
}

describe('dist-2.3c: docs/ ships the migration guide and nothing else', () => {
  it('lists docs/migration/ as a DIRECTORY, so a second guide would also ship', () => {
    // The coupling this avoids: a named-file entry ships exactly one guide, so `4.0-to-4.1.md`
    // would be added later and silently not ship. The directory form has no such edge.
    assert.ok(
      pkg.files.includes('docs/migration/'),
      'files[] must carry the docs/migration/ DIRECTORY, not a named file',
    );
  });

  it('the packed TARBALL carries the migration guide — asked of npm, not of files[]', () => {
    assert.ok(packedPaths().includes(GUIDE), `${GUIDE} is not in the tarball`);
  });

  it('the packed TARBALL does not carry docs/README.md', () => {
    const packed = packedPaths();
    const strays = packed.filter(p => p.startsWith('docs/') && p !== GUIDE);
    assert.deepEqual(strays, [], `unexpected docs/ files in the tarball: ${strays.join(', ')}`);
  });

  it('the exclusion is not passing vacuously — docs/README.md exists on disk', () => {
    // THE VACUITY GUARD, and the reason the assertion above is worth anything. If the file were
    // deleted, "does not ship" would pass while `docs/.npmignore` did nothing, and the next
    // person to recreate docs/README.md would ship 7 broken links with every check green.
    assert.ok(
      fs.existsSync(path.join(PACKAGE_ROOT, EXCLUDED)),
      `${EXCLUDED} is absent — the exclusion test above is now vacuous; delete it or restore the file`,
    );
  });

  it('docs/.npmignore excludes exactly one ANCHORED path and does not exclude the tree', () => {
    // Two failure modes, one assertion. `*` would exclude the migration guide too — the CHANGELOG
    // links would then break, which dist-2.2's checker DOES catch, but only after a pack; this is
    // the cheaper signal. A BARE `README.md` is the subtler one: `.npmignore` uses gitignore
    // matching, so an unanchored basename matches at any depth and would silently drop a future
    // `docs/migration/README.md` that ought to ship. Round 1 review found exactly that — two
    // layers independently created the file, packed, and watched it disappear with every check
    // green. The leading slash binds the pattern to `docs/` alone.
    //
    // WHAT THIS DOES NOT PROVE, stated so nobody reads more into it: this asserts the RULE, not
    // npm's honouring of it. The behavioural check (create docs/migration/README.md, pack, assert
    // it ships) was run by hand at fix time and passed, but is not automated here — it writes into
    // the working tree, and two sessions sharing one tree is a standing hazard in this repository.
    // This assertion catches the regression that actually happened; it would not catch npm
    // changing its anchoring semantics.
    const body = fs.readFileSync(path.join(PACKAGE_ROOT, 'docs/.npmignore'), 'utf8');
    const rules = body.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('#'));
    assert.deepEqual(
      rules, ['/README.md'],
      `docs/.npmignore must exclude exactly the anchored /README.md, got: ${rules.join(', ')}`,
    );
  });

  it('the migration guide carries no relative link that would break once packaged', () => {
    // It has none today. This is what keeps that true: `docs/migration/` ships alone, so any
    // relative link out of it lands outside the package. ADR-002 Amendment 3(2) — a document
    // entering shipped space brings its own outbound links with it.
    const body = fs.readFileSync(path.join(PACKAGE_ROOT, GUIDE), 'utf8');
    const escaping = relativeLinks(body);
    assert.deepEqual(escaping, [], `${GUIDE} links outside the package: ${escaping.join(', ')}`);
  });

  it('the relative-link check can actually fail', () => {
    // Positive control. The guide contains no relative links at all, so the assertion above is
    // unreachable against the real input and would pass against an implementation checking
    // nothing. Drive it with inputs that MUST be caught, in each form a reader might write.
    for (const sample of ['[x](../escaped.md)', '[x](./sibling.md)', '[x](<../escaped.md>)', '[ref]: ../escaped.md']) {
      assert.ok(relativeLinks(sample).length > 0, `the relative-link check missed: ${sample}`);
    }
  });
});

/** Every relative-link form, declared once so the control exercises the same code as the check. */
function relativeLinks(body) {
  const RE = /\]\(\s*<?([^)>\s]+)>?[^)]*\)|^\[[^\]]+\]:\s*(\S+)/gm;
  const out = [];
  let m;
  while ((m = RE.exec(body)) !== null) {
    const target = (m[1] || m[2] || '').split('#')[0];
    if (!target || /^[a-z][a-z0-9+.-]*:/i.test(target) || target.startsWith('#')) continue;
    out.push(target);
  }
  return out;
}
