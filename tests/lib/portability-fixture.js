'use strict';

const fs = require('fs');
const path = require('path');

/**
 * Fixture project root for the portability/export suites (backlog I123).
 *
 * WHY THIS EXISTS
 * ---------------
 * These 15 suites used to point the exporter at the LIVE repo — `exportSkill(id,
 * findProjectRoot())`. That violated `project-context.md`'s `test-fixture-isolation` rule
 * ("Exception: None") and it broke for real: BMAD Update `a16fa340` (2026-06-27) deleted
 * Convoke's vendored copy of upstream skill content (1,162 files; tracked `SKILL.md` went
 * 113 -> 35 by 2026-08-14). 75 of 106 manifest paths stopped resolving in a clean checkout,
 * the material surviving only in gitignored `.claude/skills/`. Twelve suites were quarantined
 * behind a precondition guard and `scripts/portability/**` was dropped from the coverage gate
 * — i.e. the shipped `convoke-export` bin went untested to keep the build green.
 *
 * Re-vendoring would have restored green and re-armed the identical failure on the next
 * upstream update. A committed fixture cannot be deleted by an upstream commit, which is the
 * whole point.
 *
 * TWO ROOTS, DELIBERATELY
 * -----------------------
 * These suites need both, and conflating them is the easy mistake:
 *
 *   FIXTURE_ROOT — the DATA the code under test reads (manifests + skill content).
 *                  Always this constant. Never `findProjectRoot()`.
 *   REPO_ROOT    — where the code under test LIVES, for spawning
 *                  `scripts/portability/*.js` as a subprocess. Still the real repo.
 *
 * A CLI suite legitimately uses both: it spawns `REPO_ROOT/scripts/portability/x.js` and
 * passes it `FIXTURE_ROOT` to operate on.
 *
 * WHAT IS IN THE FIXTURE
 * ----------------------
 * `tests/fixtures/portability-project/` mirrors the real layout for the 19 manifest ids these
 * suites actually reference, with content copied verbatim (tracked sources where they still
 * exist, the installed `.claude/skills/` copy where upstream deleted them). Its
 * `skill-manifest.csv` holds exactly those 19 rows, so suites that iterate "every skill"
 * iterate a complete, self-consistent set. No suite asserts a hardcoded total — counts are
 * derived from the manifest, per `derive-counts-from-source`.
 *
 * ADDING A SKILL: copy its `SKILL.md` (and sibling `workflow.md`, if the exporter would read
 * one) to the same relative path under the fixture, and append its manifest row verbatim.
 */
const FIXTURE_ROOT = path.join(__dirname, '..', 'fixtures', 'portability-project');

/**
 * The real repository root — for locating the SCRIPTS under test, never their input data.
 *
 * DERIVED FROM `__dirname`, NOT FROM `process.cwd()`. This file lives at a known depth inside
 * the repository, so the repository root is a STATIC FACT about the source tree. It was
 * previously `findProjectRoot()`, which walks up from the working directory and therefore
 * returns whatever `_bmad`-bearing directory happens to be current: `null` from `/tmp`, and —
 * the sharp case — a TEMP PROJECT ROOT if anything has `process.chdir()`ed into one of the
 * throwaway projects other suites build, since those carry a `_bmad/` and a seeded
 * `skill-manifest.csv` of their own. Test 1b would then ratchet against the wrong manifest and
 * report findings that are real for that tree and meaningless for this one.
 *
 * ON THE FLAKE THIS DOES AND DOES NOT EXPLAIN. `deferred-work.md` recorded a false red in Test 1b
 * (`[BROKEN-DEP] bmad-advanced-elicitation`, one run in four) and attributed it to exactly that
 * `chdir` race across the three suites that call `process.chdir()`. That attribution is WRONG and
 * is corrected there: `node --test` runs each FILE in its own child process (measured — two probe
 * files report different pids, and a `chdir` in one leaves the other's cwd untouched), so no other
 * suite's `chdir` can reach this process. The hazard fixed here is real and demonstrated in
 * isolation, but it is a LATENT one. Two of the three `chdir`-calling suites build temp projects that
 * really do carry a seeded manifest (the migration-runner pair); the third builds a bare git repo with
 * no `_bmad/` at all, where the same walk-up returns `null` instead. Both shapes are loaded traps that
 * process isolation stops anything from springing today. (An earlier draft of this comment said all
 * three seeded a manifest — asserted, not checked. Review caught it.) The observed
 * flake remains unexplained, and more sharply than "unpinned": that finding is not constructible from
 * the committed manifest at all (the row's dependencies column is empty, and the validator returns
 * before attaching a finding), so whatever that run read was not the committed tree.
 */
const REPO_ROOT = path.resolve(__dirname, '..', '..');

// A wrong root must fail loudly here, not surface later as a mystery finding against a tree that
// is not this repository — the failure mode the old cwd-derived value produced.
//
// STRUCTURAL, NOT NOMINAL. The first version asserted `package.json`'s `name` was
// `convoke-agents`. That pins a structural question ("did `__dirname` land on the repo root?")
// to a cosmetic value THIS PACKAGE HAS ALREADY CHANGED ONCE (`bmad-enhanced` ->
// `convoke-agents`): a second rename, or a downstream fork, would hard-crash all twelve
// importing suites at module load with no other change. These three paths are what this module
// actually promises its callers, so their absence is the real failure. Guarded by
// `portability-fixture-guard.test.js`.
for (const rel of ['package.json', 'scripts/portability', 'tests/fixtures/portability-project']) {
  if (!fs.existsSync(path.join(REPO_ROOT, rel))) {
    throw new Error(
      `REPO_ROOT (${REPO_ROOT}) does not look like this repository root: ${rel} is missing`
    );
  }
}

module.exports = { FIXTURE_ROOT, REPO_ROOT };
