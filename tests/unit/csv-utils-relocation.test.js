'use strict';

/**
 * `csv-utils` lives under `scripts/lib/`, and nothing requires it from inside `_team-factory`.
 *
 * WHY THIS EXISTS (story `tfu-1-1`, AC#3). The Team Factory stops shipping, but its source tree stays
 * tracked in git — so `_bmad/bme/_team-factory/lib/utils/csv-utils.js` would still RESOLVE in a clone
 * while being absent from the published tarball. That is the `I139` class: a shipped bin whose
 * dependency was not packed parses cleanly in the repo and throws `MODULE_NOT_FOUND` on a user's first
 * run. `scripts/audit/audit-bmm-dependencies.js` is exactly that bin's target, and it required
 * csv-utils at the top level, unguarded.
 *
 * The relocation is therefore not tidying — it is what makes dropping `_bmad/bme/_team-factory/` from
 * `package.json` `files[]` safe. This test is the standing guard, because the failure it prevents is
 * invisible in a clone: every path resolves locally.
 *
 * WHAT THIS TEST CANNOT DETECT. It reads the require GRAPH, not the tarball. It cannot tell you that
 * the package ships correctly — only `scripts/audit/try-fresh-install.sh` packs and installs a real
 * tarball, and it is the gate that would actually catch a regression here. Nor does it check that
 * `csv-utils`' BEHAVIOUR is unchanged by the move; `tests/team-factory/csv-utils.test.js` owns that.
 *
 * Round 1 of `tfu-1-1` found the original AC listed only two of the four consumers, and that the
 * re-derivation command written to find them was filtered so it could not see the other two. The
 * assertion below is deliberately a whole-repository sweep with no exclusions for that reason.
 */

const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '..', '..');
const OLD_SPECIFIER = 'utils/csv-utils';
const RELOCATED = path.join(REPO_ROOT, 'scripts', 'lib', 'csv-utils.js');

/** Every `.js` file in the repo, excluding dependency and VCS trees. */
function jsFiles(dir, acc = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === 'coverage') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) jsFiles(full, acc);
    else if (entry.name.endsWith('.js')) acc.push(full);
  }
  return acc;
}

test('csv-utils is relocated under scripts/lib and still exports both functions', () => {
  assert.ok(fs.existsSync(RELOCATED), `expected ${path.relative(REPO_ROOT, RELOCATED)} to exist`);
  const mod = require(RELOCATED);
  assert.strictEqual(typeof mod.parseCsvRow, 'function', 'parseCsvRow must be exported');
  assert.strictEqual(typeof mod.formatCsvRow, 'function', 'formatCsvRow must be exported');
});

test('no file requires csv-utils from inside _team-factory', () => {
  // The offenders are listed rather than counted: a bare count tells you something broke and not
  // what, which is the failure mode `verification-must-be-falsifiable` is about.
  const offenders = [];
  for (const file of jsFiles(REPO_ROOT)) {
    const src = fs.readFileSync(file, 'utf8');
    for (const [i, line] of src.split('\n').entries()) {
      if (!line.includes(OLD_SPECIFIER)) continue;
      if (!/require\(/.test(line)) continue;
      // A require reaching INTO the unshipped module is the defect, whether it spells the path
      // relatively (`../utils/csv-utils`) or from the repo root (`_bmad/bme/_team-factory/...`).
      if (/_team-factory/.test(line) || /_team-factory/.test(file)) {
        offenders.push(`${path.relative(REPO_ROOT, file)}:${i + 1}`);
      }
    }
  }
  assert.deepStrictEqual(
    offenders,
    [],
    `these files still require csv-utils from the unshipped module:\n  ${offenders.join('\n  ')}`
  );
});
