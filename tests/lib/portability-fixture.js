'use strict';

const path = require('path');
const { findProjectRoot } = require('../../scripts/update/lib/utils');

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

/** The real repository root — for locating the SCRIPTS under test, never their input data. */
const REPO_ROOT = findProjectRoot();

module.exports = { FIXTURE_ROOT, REPO_ROOT };
