'use strict';

/**
 * output-directory — the ONE containment predicate. tfr-1-1 (T163a).
 *
 * WHY THIS FILE IS A DELETION, NOT A FOURTH REWRITE. The same property had three
 * implementations, written across two review rounds, and they disagreed:
 *
 *   spec-parser.js::isContainedOutputDirectory     normalise + segment scan
 *   config-creator.js::assertContainedOutputDirectory  a near-copy, plus prefix stripping
 *   config-creator.js::ensureOutputDirectory (inline)  path.relative + startsWith('..')
 *
 * Measured at HEAD before this change, `_bmad-output/..foo` — a directory whose
 * name begins with two dots, which resolves genuinely INSIDE the output root —
 * was accepted by the first two and refused by the third. Worse than a false
 * rejection: `step-04` §5a writes `config.yaml` before §5a-ii runs, so the flow
 * left a config on disk pointing at a directory the factory then declared
 * illegal. `config-creator.js::buildConfigData` accepted it and wrote
 * `output_folder: '{project-root}/_bmad-output/..foo'`; `ensureOutputDirectory`
 * then refused it with "fix before continuing".
 *
 * Patching `startsWith('..')` into `rel === '..' || rel.startsWith('..' + sep)`
 * would have produced a FOURTH implementation and left the duplication that
 * caused the drift. `project-context.md` rule `code-review-convergence`: *"When a
 * fix keeps leaking in the same place, suspect OVER-BUILD, and prefer deletion to
 * a further rewrite."* So the two copies and the inline check are gone and all
 * three call sites call this.
 *
 * THE RULE, stated once. A value is contained when, after stripping an optional
 * `{project-root}/` prefix and normalising:
 *
 *   - it is a non-empty string and not an absolute path;
 *   - it is not the bare root `_bmad-output` (that is the shared artifacts root
 *     every module writes into — one character from a valid value, and it made
 *     the abort manifest claim the whole tree as this run's creation);
 *   - it lies under `_bmad-output/`;
 *   - no path SEGMENT is exactly `..`.
 *
 * The last clause is the one that took three attempts. `..` as a segment escapes;
 * `..foo` as a segment is an ordinary directory name and must be accepted.
 *
 * `path-safety-for-destructive-ops`: this value reaches
 * `manifest-tracker.js::formatAbortInstructions` as a removal target, so
 * resolve + normalise + contains-check are all three required. The escape this
 * guards — `_bmad-output/../../escaped` — was real: it was created outside the
 * project root, written into the generated config, and recorded as an `rm`
 * target (tf-2-13 R2).
 */

const path = require('path');

/** The single artifacts root every generated team writes beneath. */
const OUTPUT_ROOT = '_bmad-output';

/** The prefix the config shape carries and the spec shape does not. */
const PROJECT_ROOT_PREFIX = '{project-root}/';

/**
 * Strip an optional `{project-root}/` prefix.
 *
 * Only `buildConfigData`'s bypass path produces an already-prefixed value — the
 * spec field is repo-relative by `step-02-connect.md`'s own default. Stripping
 * here rather than at one call site is why all three sites can share a predicate:
 * a unified check that FORGOT the stripping would reject every legitimate
 * prefixed value, which is the regression `tests/team-factory/output-directory.test.js`
 * pins in both directions.
 *
 * @param {string} value
 * @returns {string}
 */
function stripProjectRoot(value) {
  return value.startsWith(PROJECT_ROOT_PREFIX) ? value.slice(PROJECT_ROOT_PREFIX.length) : value;
}

/**
 * Is `value` a repo-relative path genuinely contained under `_bmad-output/`?
 *
 * @param {*} value - the candidate, with or without a `{project-root}/` prefix
 * @returns {boolean}
 */
function isContainedOutputDirectory(value) {
  if (typeof value !== 'string' || value.trim() === '') return false;

  const candidate = stripProjectRoot(value);
  if (candidate === '' || path.isAbsolute(candidate)) return false;

  const normalised = path
    .normalize(candidate)
    .replace(/\\/g, '/')
    .replace(/\/+$/, '');

  if (normalised === OUTPUT_ROOT) return false;
  if (!normalised.startsWith(`${OUTPUT_ROOT}/`)) return false;
  // Segment-exact, NOT a prefix test: `..` escapes, `..foo` is a directory name.
  if (normalised.split('/').includes('..')) return false;

  return true;
}

/**
 * Assert containment, returning the value unchanged.
 *
 * Throws rather than returning a result object because `buildConfigData` is
 * synchronous with no error channel, and `createConfig` already converts throws
 * into `{success: false, errors: […]}`.
 *
 * @param {*} value
 * @returns {string} the value, unchanged and still carrying any prefix
 * @throws {Error} when it is not contained
 */
function assertContainedOutputDirectory(value) {
  if (!isContainedOutputDirectory(value)) {
    throw new Error(
      `integration.output_directory must be a repo-relative path strictly inside ${OUTPUT_ROOT}/ ` +
      `(got ${JSON.stringify(value)})`
    );
  }
  return value;
}

module.exports = {
  isContainedOutputDirectory,
  assertContainedOutputDirectory,
  stripProjectRoot,
  OUTPUT_ROOT,
  PROJECT_ROOT_PREFIX,
};
