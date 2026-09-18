'use strict';

/**
 * The two operator-tooling skills tracked under `.claude/skills/` reach the npm tarball.
 *
 * `.gitignore` ignores `.claude/skills/*` and un-ignores these two by name; `package.json`
 * `files[]` is what actually ships them. Nothing tied the two together, so `bmad-register-skill`
 * was tracked, exempted, and absent from every published tarball — verified against
 * `npm pack convoke-agents@4.0.0` through `@4.0.3` — while `bmad-audit-skill-dirs` shipped.
 *
 * The literal `EXPECTED` list follows `covenant-packaging.test.js`, and so does the derived half
 * that makes literals safe there: a list nobody is forced to update rots. Git is the authority on
 * which skills exist, because the defect is a file that is tracked and unpublished. Comparison is
 * by DIRECTORY — a tracked `.npmignore` or symlink adds no directory, so this cannot raise the
 * false alarm a file-level comparison does.
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

/**
 * The skill directories named by a list of paths, however they are spelled.
 *
 * `files[]` may carry a directory (`.claude/skills/x/`) or named files (`.claude/skills/x/SKILL.md`)
 * — `covenant-packaging.test.js` uses the second form deliberately — and both ship the same thing,
 * so both must normalise the same way. A parent entry such as `.claude/skills/` normalises to two
 * segments and matches no skill, which is the intent: it would publish every untracked directory.
 */
function skillDirs(paths) {
  return [...new Set(
    paths
      .filter((p) => p.startsWith(`${SKILLS_ROOT}/`))
      .map((p) => p.replace(/\/+$/, '').split('/').slice(0, 3).join('/')),
  )].sort();
}

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

  it('git, files[] and EXPECTED name the same skill directories', () => {
    // The link that was missing. Without it, exempting a skill in .gitignore and forgetting
    // files[] ships nothing and passes — which is exactly how bmad-register-skill went unpacked
    // for five months. EXPECTED needs no separate coupling: a skill that is tracked AND declared
    // but unnamed here arrives in the tarball, which the equality above already catches.
    const tracked = skillDirs(
      execFileSync('git', ['ls-files', '-z', '--', `${SKILLS_ROOT}/`], {
        cwd: PACKAGE_ROOT, encoding: 'utf8',
      }).split('\0').filter(Boolean),
    );
    assert.deepEqual(skillDirs(pkg.files), tracked, 'files[] and git disagree about which skills exist');
    assert.deepEqual(skillDirs(EXPECTED), tracked, 'EXPECTED and git disagree about which skills exist');
  });
});
