'use strict';

/**
 * The two operator-tooling skills tracked under `.claude/skills/` reach the npm tarball.
 *
 * `.gitignore` ignores `.claude/skills/*` and un-ignores these two by name; `package.json`
 * `files[]` is what actually ships them. Nothing tied the two together, so `bmad-register-skill`
 * was tracked, exempted, and absent from every published tarball — verified against
 * `npm pack convoke-agents@4.0.0` through `@4.0.3` — while `bmad-audit-skill-dirs` shipped.
 *
 * The expected set is written out as literals, following `covenant-packaging.test.js`. An earlier
 * version of this file derived it from `git ls-files` and was worse in three measured ways:
 * narrowing the one shared constant shrank both sides together and disarmed the file with every
 * gate green; a tracked `.npmignore` or symlink — the exclusion mechanism this repo documents and
 * uses twice — could never satisfy equality; and the git call needed a catch that turned real npm
 * failures into green skips.
 *
 * Asked of npm rather than read from `files[]`, because npm's own always-exclude list and any
 * skill-local `.npmignore` subtract from what `files[]` declares and neither is visible in that
 * array. A ROOT `.npmignore` is NOT consulted when `files[]` is present — measured, and already
 * documented at `docs/.npmignore` and `scripts/migration/format-conversion/.npmignore`.
 *
 * WHAT THIS DOES NOT PROVE. That either skill reaches an operator: nothing copies
 * `.claude/skills/<name>/` out of `node_modules/` into a project, so neither is invokable as a
 * slash command by an installed user. That is backlog `I80` Option B, open. Nor that the files
 * arrived with anything in them — this compares paths, not content.
 */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const { PACKAGE_ROOT } = require('../helpers');

const SKILLS_ROOT = '.claude/skills';
const pkg = JSON.parse(fs.readFileSync(path.join(PACKAGE_ROOT, 'package.json'), 'utf8'));

/** Every file both tracked skills must publish. Literal on purpose — see the header. */
const EXPECTED = [
  '.claude/skills/bmad-audit-skill-dirs/SKILL.md',
  '.claude/skills/bmad-audit-skill-dirs/workflow.md',
  '.claude/skills/bmad-register-skill/SKILL.md',
  '.claude/skills/bmad-register-skill/workflow.md',
].sort();

/**
 * Paths under the skills root that npm would publish.
 *
 * No try/catch: a pack that fails, returns nothing, or changes shape must turn this suite RED.
 * An earlier version wrapped this in a catch that reported every such case as a green skip, which
 * made the gate fail-open on every path while `test` sits in `publish.needs`.
 *
 * `timeout` goes to execFileSync, not to node:test — a synchronous child starves the event loop,
 * so a `{ timeout }` test option never fires against it.
 */
function packedSkillFiles() {
  const out = execFileSync('npm', ['pack', '--dry-run', '--json', '--ignore-scripts'], {
    cwd: PACKAGE_ROOT, encoding: 'utf8', timeout: 120000,
  });
  const [result] = JSON.parse(out);
  assert.ok(result && Array.isArray(result.files), 'npm pack returned no file listing');
  assert.ok(result.files.length > 100, `sanity: expected a full listing, got ${result.files.length}`);
  return result.files.map((f) => f.path).filter((p) => p.startsWith(`${SKILLS_ROOT}/`)).sort();
}

describe('the tracked operator skills ship', () => {
  it('the tarball carries exactly these files under the skills root', () => {
    // Equality, not inclusion. Under-shipping is the defect that happened; over-shipping is the
    // likelier next one, because broadening the files[] entry to the parent is the natural move
    // for whoever adds a third skill and would publish ~100 directories belonging to BMAD, WDS
    // and CIS. `SKILL.md` alone is not enough either: it is six lines saying "follow workflow.md".
    assert.deepEqual(packedSkillFiles(), EXPECTED);
  });

  it('files[] declares no skill directory that EXPECTED does not cover', () => {
    // The coupling. Shipping a third skill means adding it to files[]; this makes that edit fail
    // until EXPECTED names its files too, so the assertion above cannot quietly go out of date.
    const declared = pkg.files
      .filter((f) => f.startsWith(`${SKILLS_ROOT}/`))
      .map((f) => f.replace(/\/+$/, ''))
      .sort();
    const covered = [...new Set(EXPECTED.map((p) => p.split('/').slice(0, 3).join('/')))].sort();
    assert.deepEqual(declared, covered);
  });
});
