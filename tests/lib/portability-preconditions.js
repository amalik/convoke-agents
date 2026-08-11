'use strict';

const path = require('path');
const { execFileSync } = require('child_process');
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
 * exists only inside the gitignored `.claude/skills/` install directory: present on a
 * developer machine with BMAD installed, ABSENT in a clean CI checkout.
 *
 * These suites are SKIPPED — loudly — rather than deleted, so coverage returns by
 * itself once either (a) they are converted to fixtures per `test-fixture-isolation`
 * (backlog I123), or (b) the vendored content is restored.
 *
 * WHY GIT-TRACKING, NOT `fs.existsSync` (code review 2026-08-10, HIGH)
 * -------------------------------------------------------------------
 * The first version of this guard used `fs.existsSync`. That is the precise oracle
 * this module warns against: `.claude/skills/*` is gitignored, so `existsSync` returns
 * TRUE on a dev machine and FALSE in CI. A guard built on it would un-skip locally,
 * pass, and then fail CI — reproducing verbatim the false-green error this file was
 * written to prevent. Presence is therefore decided by `git ls-files`, which answers
 * the only question that matters: *will this path exist in a clean checkout?*
 *
 * FAILURE POLICY (code review 2026-08-10, HIGH)
 * --------------------------------------------
 * Only the ONE known, expected condition — vendored content absent — yields a skip.
 * Every other failure (missing/corrupt manifest, unreadable git index, no project
 * root, schema drift) THROWS. A structural break must not be indistinguishable from
 * the expected condition; silently disabling 10 suites on a corrupt manifest is worse
 * than failing loudly.
 */

let cached;

function _computeSkipReason() {
  // Deliberately NOT wrapped in try/catch: per the failure policy above, anything
  // other than "vendored content absent" must surface as a real error.
  const projectRoot = findProjectRoot();
  const manifestPath = path.join(projectRoot, '_bmad', '_config', 'skill-manifest.csv');
  const { header, rows } = readManifest(manifestPath);

  const pathIdx = header.indexOf('path');
  if (pathIdx < 0) {
    throw new Error('skill-manifest.csv has no `path` column — schema drift, not a skip condition');
  }
  if (rows.length === 0) {
    throw new Error('skill-manifest.csv has zero data rows — a vacuous pass is not a valid outcome');
  }

  // Single `git ls-files` call rather than one spawn per row.
  const tracked = new Set(
    execFileSync('git', ['ls-files'], { cwd: projectRoot, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 })
      .split('\n')
      .filter(Boolean)
  );
  if (tracked.size === 0) {
    throw new Error('git ls-files returned nothing — cannot evaluate preconditions');
  }

  const declared = rows.map((r) => r[pathIdx]);
  if (declared.some((p) => !p)) {
    throw new Error('skill-manifest.csv has rows with a blank `path` — schema drift, not a skip condition');
  }

  const missing = declared.filter((p) => !tracked.has(p));
  if (missing.length === 0) return undefined;

  return (
    `vendored skill content absent: ${missing.length}/${rows.length} manifest paths are not tracked in git ` +
    `(e.g. ${missing[0]}). Upstream commit a16fa340 removed the vendored BMAD skill tree; it survives only in ` +
    `gitignored .claude/skills/, so these suites cannot run in a clean checkout. Backlog I123. ` +
    `See tests/lib/portability-preconditions.js.`
  );
}

/**
 * @param {string} [suiteName] Suite label, recorded for accounting when skipped.
 * @returns {string|undefined} Skip reason, or `undefined` when preconditions hold.
 */
function vendoredContentSkipReason(suiteName) {
  if (cached === undefined) cached = { value: _computeSkipReason() };
  if (cached.value && suiteName) {
    // `describe(name, { skip })` suppresses subtests BEFORE they register, so node:test
    // reports `tests 0 / skipped 0` — the disabled tests vanish from the totals rather
    // than appearing as skipped (code review 2026-08-10, HIGH). This warning is the
    // accounting: it names every disabled suite in the CI log.
    console.warn(`[portability] SUITE DISABLED: ${suiteName} — ${cached.value}`);
  }
  return cached.value;
}

// NOTE: an earlier revision exported a `disabledSuites()` accumulator. It was removed as
// dead code that could never work: `node --test` runs each test file in its own child
// process, so any in-process registry only ever sees the single suite that file
// registered. Cross-suite accounting has to come from the runner, not from us — the
// warning above is a log line, NOT a substitute for tests registering as skipped.
// That gap is real and unfixed here; it is tracked in the initiative backlog.
module.exports = { vendoredContentSkipReason };
