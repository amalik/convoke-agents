'use strict';

/**
 * The REPO_ROOT guard in `portability-fixture.js` can actually fail.
 *
 * WHY THIS FILE EXISTS. `REPO_ROOT` is derived from `__dirname` and guarded by a structural
 * check. Twelve suites import it. Round 1 of the Test 1b fix observed that the guard itself
 * had ZERO coverage: a refactor could neuter it and the suite would stay green, leaving those
 * twelve suites to resolve a wrong root silently — which is the failure the guard exists to
 * prevent, so an unguarded guard is worse than none.
 *
 * The guard is a module-load-time throw, so it is exercised by copying the module to a
 * deliberately wrong depth rather than by calling a function.
 */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');

const SOURCE = path.join(__dirname, 'portability-fixture.js');

/** Copy the fixture module to `<tmp>/tests/lib/` and require it, returning any throw. */
function loadFromPlantedTree(build) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fixture-guard-'));
  fs.mkdirSync(path.join(dir, 'tests', 'lib'), { recursive: true });
  const planted = path.join(dir, 'tests', 'lib', 'portability-fixture.js');
  fs.copyFileSync(SOURCE, planted);
  build(dir);
  try {
    // No require.cache eviction: `planted` lives under a fresh mkdtemp per call, so its path is
    // unique and can never already be cached. A delete here would guard a collision that cannot
    // occur, and would read as though one could.
    require(planted);
    return null;
  } catch (err) {
    return err;
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

describe('portability-fixture REPO_ROOT guard', () => {
  it('the real module loads and resolves to this repository', () => {
    // Non-vacuity floor: if this ever fails, the negative cases below prove nothing.
    const { REPO_ROOT } = require('./portability-fixture');
    assert.equal(REPO_ROOT, path.resolve(__dirname, '..', '..'));
    assert.ok(fs.existsSync(path.join(REPO_ROOT, 'package.json')));
  });

  for (const missing of ['package.json', 'scripts/portability', 'tests/fixtures/portability-project']) {
    it(`throws when ${missing} is absent from the derived root`, () => {
      const err = loadFromPlantedTree((dir) => {
        // Build every required path EXCEPT the one under test, so each assertion pins its own
        // branch instead of passing because the tree is empty.
        for (const rel of ['package.json', 'scripts/portability', 'tests/fixtures/portability-project']) {
          if (rel === missing) continue;
          const target = path.join(dir, rel);
          if (rel.endsWith('.json')) {
            fs.mkdirSync(path.dirname(target), { recursive: true });
            fs.writeFileSync(target, JSON.stringify({ name: 'anything-at-all' }));
          } else {
            fs.mkdirSync(target, { recursive: true });
          }
        }
      });
      assert.ok(err, `guard did not fire with ${missing} missing — it cannot fail`);
      // Substring, not a regex. The previous `new RegExp(missing.replace('/', '\\/'))` escaped
      // nothing useful — `/` is literal in a RegExp constructor, `String.replace` with a string
      // pattern only touches the FIRST match anyway, and the unescaped `.` in `package.json`
      // silently meant "any character". False precision; this says the same thing truthfully.
      assert.ok(
        err.message.includes(`${missing} is missing`),
        `guard fired for the wrong path: ${err.message}`
      );
    });
  }

  it('does NOT depend on the package name, which this package has changed once already', () => {
    // Regression pin for Round 1's finding: the first guard asserted name === 'convoke-agents'.
    const err = loadFromPlantedTree((dir) => {
      fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify({ name: 'bmad-enhanced' }));
      fs.mkdirSync(path.join(dir, 'scripts', 'portability'), { recursive: true });
      fs.mkdirSync(path.join(dir, 'tests', 'fixtures', 'portability-project'), { recursive: true });
    });
    assert.equal(err, null, `a differently-named package must load, but threw: ${err && err.message}`);
  });
});
