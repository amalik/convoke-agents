'use strict';

/**
 * The containment case table — tfr-1-1 (T163a), AC#3.
 *
 * ONE table, iterated across EVERY call site. `project-context.md` rule
 * `shared-test-constants`: the three predicates this replaced drifted apart
 * precisely because each had its own cases, so three separate tests here would
 * recreate the defect they exist to prevent.
 *
 * Each case carries `why` because the interesting ones are not self-evident:
 * `..foo` looks like an escape and is not, and the bare root looks valid and is
 * not.
 */

const CONTAINMENT_CASES = [
  // --- accepted ---
  {
    value: '_bmad-output/team-artifacts',
    contained: true,
    why: 'the ordinary case — what step-02 defaults to',
  },
  {
    value: '_bmad-output/a/b/c',
    contained: true,
    why: 'nesting is allowed; depth is not the property under test',
  },
  {
    value: '_bmad-output/..foo',
    contained: true,
    why: 'T163a ITSELF. A directory whose NAME begins with two dots resolves inside the root. '
       + 'The predicate this replaced used startsWith("..") on the relative path and refused it, '
       + 'while the parser accepted it — so a spec that passed parseSpec died at step-04 §5a-ii, '
       + 'AFTER §5a had already written config.yaml pointing at it',
  },
  {
    value: '_bmad-output/foo..bar',
    contained: true,
    why: 'dots inside a segment are just characters',
  },
  {
    value: '_bmad-output/team-artifacts/',
    contained: true,
    why: 'a trailing slash is cosmetic and is normalised away',
  },
  {
    value: '{project-root}/_bmad-output/team-artifacts',
    contained: true,
    why: 'the CONFIG shape. Only buildConfigData\'s bypass path produces it. A unified predicate '
       + 'that forgot to strip the prefix would reject every legitimate config value — the '
       + 'regression this half of the table exists to catch',
  },
  {
    value: '{project-root}/_bmad-output/..foo',
    contained: true,
    why: 'both special cases at once: prefixed AND a dotted segment name',
  },

  {
    value: '_bmad-output/a/../b',
    contained: true,
    why: 'normalises to _bmad-output/b, genuinely inside. Listed among the ACCEPTED cases after '
       + 'a correction: this table first claimed it was rejected "because the abort manifest '
       + 'records the value it was GIVEN", which is false — ensureOutputDirectory returns the '
       + 'RESOLVED path and that is what the manifest records. Kept as a case because the '
       + 'reasoning is tempting and wrong',
  },

  // --- rejected ---
  {
    value: '_bmad-output/../etc',
    contained: false,
    why: 'a one-level escape to a sibling of _bmad-output — moved here from a separate list in '
       + 'config-creator.test.js so every call site sees it (tfr-1-1 additional review)',
  },
  {
    value: '/abs/path',
    contained: false,
    why: 'an absolute path with no _bmad-output segment at all — moved here from the same separate list',
  },
  {
    value: '_bmad-output/../../escaped',
    contained: false,
    why: 'the real escape (tf-2-13 R2): created OUTSIDE the project root, written into the '
       + 'generated config.yaml, and recorded in the abort manifest as an rm target',
  },
  {
    value: '_bmad-output/a/../../..',
    contained: false,
    why: 'escapes after normalisation even though every segment looks innocent',
  },
  {
    value: '_bmad-output',
    contained: false,
    why: 'the bare root is the shared artifacts directory every module writes into. One '
       + 'character from valid, and it made the abort manifest claim the whole tree',
  },
  {
    value: '_bmad-output/',
    contained: false,
    why: 'the bare root with a trailing slash is still the bare root',
  },
  {
    value: '{project-root}/_bmad-output',
    contained: false,
    why: 'the bare root in config shape is no better than in spec shape',
  },
  {
    value: 'other-dir/team-artifacts',
    contained: false,
    why: 'outside the output root entirely',
  },
  {
    value: '_bmad-outputs/team-artifacts',
    contained: false,
    why: 'a PREFIX match is not a containment match — the separator is what makes it containment',
  },
  {
    value: '/absolute/_bmad-output/x',
    contained: false,
    why: 'absolute paths are never repo-relative',
  },
  { value: '', contained: false, why: 'empty' },
  { value: '   ', contained: false, why: 'whitespace only' },
  { value: null, contained: false, why: 'non-string' },
  { value: undefined, contained: false, why: 'non-string' },
  { value: 42, contained: false, why: 'non-string' },
  { value: {}, contained: false, why: 'non-string' },
  { value: ['_bmad-output/x'], contained: false, why: 'an array is not a path' },

  // --- shell-safety, added in Round 2 ---
  // This value is interpolated into `rm "${entry.path}"` by
  // manifest-tracker.js::formatAbortInstructions. Containment alone is not enough:
  // a perfectly contained path can still end the argument.
  {
    value: '_bmad-output/x"; rm -rf ~; echo "',
    contained: false,
    why: 'COMMAND INJECTION. Accepted at all three call sites before Round 2, written into the '
       + 'generated config.yaml, and emitted to the operator as three shell commands',
  },
  {
    value: '_bmad-output/$(id)',
    contained: false,
    why: 'command substitution in the same position',
  },
  {
    value: '_bmad-output/`id`',
    contained: false,
    why: 'backtick substitution — the older spelling, and live inside double quotes',
  },
  {
    value: '_bmad-output/notes[draft]',
    contained: true,
    why: 'brackets are inert inside double quotes. Pinned as ACCEPTED so nobody re-widens the '
       + 'shell-safety class back to the ~17 character classes it briefly carried',
  },
  {
    value: '_bmad-output/a b',
    contained: true,
    why: 'a space is INERT inside the double quotes the abort path emits, and "my team artifacts" is '
       + 'a name a contributor would plausibly choose. Listed among the accepted cases after a '
       + 'correction: it was rejected with the rationale "a space splits the rm argument in two", '
       + 'which is false — formatAbortInstructions emits rm "…" and the argument stays whole',
  },
  {
    value: `_bmad-output/x${String.fromCharCode(0)}y`,
    contained: false,
    why: 'NUL byte. Before Round 2 this reproduced the exact two-site divergence this module was '
       + 'written to delete: assertContainedOutputDirectory accepted it and wrote config.yaml, '
       + 'ensureOutputDirectory then rejected it',
  },
  {
    value: '_bmad-output\\foo',
    contained: false,
    why: 'BACKSLASH. The check used to fold \\ to / while resolution used the raw value, so this '
       + 'was reported contained and then created as a SIBLING of _bmad-output at the repo root. '
       + 'A check whose answer does not describe what the caller will do is worse than none',
  },
];

/**
 * Cases in CONFIG shape — carrying the `{project-root}/` prefix.
 *
 * `spec-parser` must reject every one of these regardless of containment: a spec
 * field is repo-relative by `step-02-connect.md`'s default, and the config shape
 * appearing there is the defect tf-2-13 R2 fixed. Round 2 caught the first
 * version of the unified predicate silently undoing that ruling.
 */
const PREFIXED = CONTAINMENT_CASES.filter(c => typeof c.value === 'string' && c.value.startsWith('{project-root}/'));

/** Cases the predicate must accept. */
const ACCEPTED = CONTAINMENT_CASES.filter(c => c.contained);
/** Cases the predicate must reject. */
const REJECTED = CONTAINMENT_CASES.filter(c => !c.contained);

module.exports = { CONTAINMENT_CASES, ACCEPTED, REJECTED, PREFIXED };
