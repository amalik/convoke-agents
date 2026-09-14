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
];

/** Cases the predicate must accept. */
const ACCEPTED = CONTAINMENT_CASES.filter(c => c.contained);
/** Cases the predicate must reject. */
const REJECTED = CONTAINMENT_CASES.filter(c => !c.contained);

module.exports = { CONTAINMENT_CASES, ACCEPTED, REJECTED };
