'use strict';

/**
 * output-directory — the single containment predicate for `integration.output_directory`.
 *
 * Callers: `spec-parser.js` (spec shape), `config-creator.js::buildConfigData` and
 * `::ensureOutputDirectory` (config shape). One implementation, because three
 * copies drifted apart and disagreed about `_bmad-output/..foo` (`T163a`).
 *
 * A value is contained when, after stripping an optional `{project-root}/` prefix
 * and normalising:
 *   - it is a non-empty string and not absolute;
 *   - it is not the bare root `_bmad-output`;
 *   - it lies under `_bmad-output/` — which is also what rejects traversal, since
 *     `_bmad-output/../../escaped` normalises to `../escaped`;
 *   - it carries no character that is live inside double quotes (see SHELL_UNSAFE_RE).
 *
 * `..foo` as a SEGMENT is an ordinary directory name and is accepted; that is
 * `T163a`.
 *
 * LIMIT — containment is LEXICAL. No `realpath` is performed, so a pre-existing
 * symlink under `_bmad-output/` pointing outside the repository is accepted and
 * artifacts land outside the project root. Resolution cannot run here:
 * `ensureOutputDirectory` is what creates the directory, so at check time the path
 * usually does not exist. Closing it means re-verifying after `ensureDir`, in the
 * caller that holds the resolved path.
 *
 * `path-safety-for-destructive-ops`: this value reaches
 * `manifest-tracker.js::formatAbortInstructions` as a removal target.
 *
 * Reproduce the guarantees:
 *   node --test tests/team-factory/output-directory.test.js
 */

const path = require('path');

/** The single artifacts root every generated team writes beneath. */
const OUTPUT_ROOT = '_bmad-output';

/** The prefix the config shape carries and the spec shape does not. */
const PROJECT_ROOT_PREFIX = '{project-root}/';

/**
 * Characters that retain meaning inside the double quotes this value lands in.
 *
 * `manifest-tracker.js::formatAbortInstructions` emits ``rm "${entry.path}"``.
 * Inside double quotes only `"`, `$`, backtick, backslash and a newline are live;
 * a space, `;`, `|`, `*` and the rest are inert and are therefore allowed —
 * `my team artifacts` is a legitimate directory name.
 *
 * This narrows the injection and does not close it: every other `created` entry
 * reaches the same line, and agent ids, workflow names and guide filenames are
 * contributor-named. Root cause is `T165`.
 */
// eslint-disable-next-line no-control-regex
const SHELL_UNSAFE_RE = /[\x00-\x1f\x7f"$`\\]/;

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

  // Shell-safety BEFORE containment. A value can be perfectly contained and still
  // end the `rm` argument it is interpolated into. Tested on the STRIPPED
  // candidate so the `{project-root}/` prefix's own braces do not trip it.
  if (SHELL_UNSAFE_RE.test(candidate)) return false;

  // Fold separators AFTER normalise, not before. Input backslashes are already
  // rejected by SHELL_UNSAFE_RE, but `path.normalize` EMITS them on win32:
  // `normalize('_bmad-output/x')` returns `_bmad-output\\x` there, so without
  // this fold `startsWith('_bmad-output/')` is false for every legitimate value
  // and the predicate rejects everything. Round 3 caught that; Round 2 had
  // deleted the fold on the strength of an argument about INPUT backslashes that
  // did not cover the ones normalise produces. CI is ubuntu-only, so nothing
  // would have caught it — `backup-manager.js` and `activation-validator.js`
  // both fold for the same reason.
  const normalised = path
    .normalize(candidate)
    .replace(/\\/g, '/')
    .replace(/\/+$/, '');

  if (normalised === OUTPUT_ROOT) return false;
  if (!normalised.startsWith(`${OUTPUT_ROOT}/`)) return false;

  // There is deliberately no `..`-segment check. It is unreachable:
  // `path.normalize` can only leave a `..` at the start of its result, and the
  // `startsWith` above has already rejected that. Verified exhaustively.

  return true;
}

/**
 * Assert containment, returning the value unchanged.
 *
 * Throws rather than returning a result object because `buildConfigData` is
 * synchronous with no error channel. `createConfig` does NOT convert that throw:
 * it calls `buildConfigData` outside its `try`, so an uncontained value rejects
 * its promise. In the flow that is unreachable — step-04 §5a's `loadSpec` rejects
 * the same value first — and the config-creator CLI catches the rejection.
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

/**
 * Is `value` a contained output directory in SPEC shape — repo-relative, with no
 * `{project-root}/` prefix?
 *
 * `spec-parser` must reject the prefix. `tests/team-factory/fixtures/test-team-spec.yaml`
 * carries the reason in its own comment: `step-02-connect.md` defaults the field
 * to repo-relative, validates that shape, and adds the prefix only when composing
 * `config.yaml`. A spec carrying the config shape was a real defect (tf-2-13 R2),
 * and the first version of this file reintroduced it by moving the prefix
 * stripping into the base predicate where every caller inherited it.
 *
 * @param {*} value
 * @returns {boolean}
 */
function isRepoRelativeOutputDirectory(value) {
  if (typeof value !== 'string') return false;
  if (value.startsWith(PROJECT_ROOT_PREFIX)) return false;
  return isContainedOutputDirectory(value);
}

module.exports = {
  SHELL_UNSAFE_RE,
  isContainedOutputDirectory,
  isRepoRelativeOutputDirectory,
  assertContainedOutputDirectory,
  stripProjectRoot,
  OUTPUT_ROOT,
  PROJECT_ROOT_PREFIX,
};
