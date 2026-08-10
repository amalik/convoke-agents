'use strict';

const fs = require('fs');
const path = require('path');
const { findProjectRoot } = require('../../scripts/update/lib/utils');
const { readManifest } = require('../../scripts/portability/manifest-csv');

/**
 * Shared precondition guard for the portability/export suites.
 *
 * WHY THIS EXISTS
 * ---------------
 * The exporter reads each skill's content from the `path` declared in
 * `_bmad/_config/skill-manifest.csv`. BMAD Update commit `a16fa340` (2026-06-27)
 * deleted Convoke's vendored copy of upstream BMAD skill content — 1,162 files
 * including 78 `SKILL.md` (tracked skill content went 113 -> 44). That content now
 * exists only inside the gitignored `.claude/skills/` install directory, so it is
 * present on a developer machine with BMAD installed and ABSENT in a clean CI
 * checkout.
 *
 * That asymmetry is a trap: a suite that reads it passes locally and fails in CI,
 * which is exactly how this class of failure went undiagnosed for six weeks. These
 * suites are therefore SKIPPED — loudly, with the count in the reason — rather than
 * deleted or silently excluded, so the coverage returns by itself once either:
 *
 *   (a) the suites are converted to fixtures per `project-context.md`'s
 *       `test-fixture-isolation` rule (all 14 portability suites currently call
 *       `findProjectRoot()` and assert against live repo state, which that rule
 *       forbids) — tracked in the initiative backlog; or
 *   (b) the vendored skill content is restored to the repo.
 *
 * Do NOT "fix" a failing portability suite by pointing manifest paths at
 * `.claude/skills/...`. Those paths are gitignored; it produces a false green.
 *
 * @returns {string|undefined} A skip reason when required content is missing,
 *   or `undefined` when the preconditions hold (node:test treats `skip:
 *   undefined` as "do not skip").
 */
function vendoredContentSkipReason() {
  let rows, header;
  try {
    const projectRoot = findProjectRoot();
    const manifest = readManifest(path.join(projectRoot, '_bmad', '_config', 'skill-manifest.csv'));
    header = manifest.header;
    rows = manifest.rows;
    const pathIdx = header.indexOf('path');
    if (pathIdx < 0) return 'skill-manifest.csv has no `path` column';

    const missing = rows
      .map((r) => r[pathIdx])
      .filter((p) => p && !fs.existsSync(path.join(projectRoot, p)));

    if (missing.length === 0) return undefined;

    return (
      `vendored skill content absent: ${missing.length}/${rows.length} manifest paths do not resolve ` +
      `(e.g. ${missing[0]}). Upstream commit a16fa340 removed the vendored BMAD skill tree; ` +
      `it lives only in gitignored .claude/skills/. See tests/lib/portability-preconditions.js.`
    );
  } catch (err) {
    return `portability preconditions could not be evaluated: ${err.message}`;
  }
}

module.exports = { vendoredContentSkipReason };
