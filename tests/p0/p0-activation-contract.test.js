'use strict';

/**
 * The v6.3 config-error-handling CONTRACT itself, not its effect on the real agent files.
 *
 * WHY THIS EXISTS (T183, Round 2). `p0-activation.test.js` and the per-agent suites assert that the
 * shipped agents satisfy the contract. Nothing asserted that the contract can REJECT anything, so
 * replacing the whole computation with `true` left all 613 P0 tests green — the contract was an
 * unfalsifiable check, which `verification-must-be-falsifiable` in project-context.md calls worse than
 * no check at all. A comment in helpers.js also claimed the contract was "mutation-verified in
 * p0-activation.test.js", where no mutation existed; that claim is now this file.
 *
 * It also closes the hole Round 2 found in the contract's coverage: the wording pin is satisfied by an
 * ADDITIVE restoration of `Load config via bmad-init skill` alongside the new text, which is the shape a
 * real regression takes. `NO_BMAD_INIT_RE` is the assertion that forbids it, and it is the one genuinely
 * semantic check here — the closing note for T183 named `grep -rl bmad-init _bmad/bme/` as the primary
 * assertion for the whole row and never committed it.
 *
 * WHAT THIS DOES NOT CLAIM. `V63_NEVER_STOP_RE` is lexical. A negated, quoted or commented-out copy of
 * the sentence satisfies it, and the cases below record that rather than pretending otherwise. It is a
 * regression tripwire on operator-ruled wording, not a proof of behaviour.
 */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

const fs = require('fs');

const {
  V63_NEVER_STOP_RE, NO_BMAD_INIT_RE, v63ConfigRefRe, parseV63Definition, discoverAgents,
  loadAgentDefinition,
} = require('./helpers');

const OK_STEP1 = 'Read `{project-root}/_bmad/bme/_vortex/config.yaml`. **Never stop on a config problem.**';

// Run a synthetic step-1 body through the REAL computation, so every assertion below is about
// `parseV63Definition` rather than about a regex replayed against a literal it was built from.
const REGISTRY_AGENT = discoverAgents()[0];
const parse = (step1) => parseV63Definition(
  '---\nname: x\n---\n\n# X\n\n## Capabilities\n\n| Code | Description | Skill |\n|---|---|---|\n| MH | m | (in-agent) |\n\n'
  + `## On Activation\n\n1. ${step1}\n\n2. **Continue**\n\n3. STOP and WAIT\n`,
  REGISTRY_AGENT, '_vortex',
).hasErrorHandling;

describe('T183 contract — the config reference half is per-module and can reject', () => {
  it('accepts an agent that names its OWN module config', () => {
    assert.ok(v63ConfigRefRe('_vortex').test(OK_STEP1));
    assert.ok(v63ConfigRefRe('_gyre').test('Read `{project-root}/_bmad/bme/_gyre/config.yaml`.'));
  });

  it('REJECTS an agent that names a DIFFERENT module\'s config', () => {
    assert.equal(v63ConfigRefRe('_gyre').test(OK_STEP1), false,
      'a _gyre agent must not satisfy the check by naming Vortex\'s config');
  });

  it('REJECTS a near-miss path — the extension and the prefix both matter', () => {
    assert.equal(v63ConfigRefRe('_vortex').test('Read `_bmad/bme/_vortex/config.yml`.'), false);
    assert.equal(v63ConfigRefRe('_vortex').test('Read `_bmad/bmm/_vortex/config.yaml`.'), false,
      'the check is anchored to _bmad/bme/, so a wrong-module prefix that resolves to nothing must fail');
  });
});

describe('T183 contract — the wording pin can reject, and tolerates reflow', () => {
  it('accepts the ruled sentence', () => {
    assert.ok(V63_NEVER_STOP_RE.test(OK_STEP1));
  });

  it('accepts it across a line break, so a prose-wrap pass does not redden the suite', () => {
    assert.ok(V63_NEVER_STOP_RE.test('**Never stop on a config\n   problem.**'));
  });

  it('REJECTS a vague synonym that drops the guarantee', () => {
    assert.equal(V63_NEVER_STOP_RE.test('**Handle config problems gracefully.**'), false);
  });

  // NOT ASSERTED, deliberately. The pin is lexical, so a negated or quoted copy of the sentence
  // satisfies it — `parse('Do not never stop on a config problem; STOP instead.' + a valid path)` is
  // `true`. That is a real limit and it is recorded here, but asserting it would turn the suite red on
  // any future hardening of the regex, which is exactly the trap the marker this contract replaced fell
  // into. Keep the knowledge; do not pin the weakness.
});

describe('T183 contract — the retired call is a disqualifier, not a note', () => {
  it('REJECTS an additive restoration alongside otherwise-correct text', () => {
    // The wording pin and the config reference are both satisfied by this string; only the absence
    // conjunct rejects it. Asserted through the real computation, not against the regex it is built from.
    assert.equal(
      parse(`**Load config via bmad-init skill** — Pass \`--module bme\`. Then ${OK_STEP1}`),
      false,
      'an additive re-introduction must not pass — this is the shape a real regression takes',
    );
  });

  it('accepts the shipped shape, so the disqualifier is not simply always-on', () => {
    assert.equal(parse(OK_STEP1), true);
  });

  it('no shipped v6.3 agent mentions the retired skill anywhere in its file', () => {
    // Wider than the contract, which only inspects step 1. Narrower than `grep -rl bmad-init _bmad/bme/`,
    // which also covers reference files, workflows and guides and is not expressible as a unit test.
    const v63 = discoverAgents()
      .map(a => ({ id: a.id, path: a.agentFilePath, def: loadAgentDefinition(a.id) }))
      .filter(x => x.def.format === 'v6.3');
    assert.deepEqual(
      v63.map(x => x.id).sort(),
      ['contextualization-expert', 'lean-experiments-specialist', 'research-convergence-specialist'],
      'the converted set changed — update this list deliberately rather than letting the sweep drift',
    );
    for (const { id, path: file } of v63) {
      assert.equal(NO_BMAD_INIT_RE.test(fs.readFileSync(file, 'utf8')), false,
        `${id}/SKILL.md still mentions bmad-init`);
    }
  });
});

describe('T183 contract — the computation is load-bearing end to end', () => {
  it('is true only when every conjunct is satisfied', () => {
    assert.equal(parse(OK_STEP1), true, 'both halves present');
    assert.equal(parse('Read `{project-root}/_bmad/bme/_vortex/config.yaml`. Stop on error.'), false,
      'config named, no never-stop clause');
    assert.equal(parse('**Never stop on a config problem.** Read some config somewhere.'), false,
      'never-stop clause, no config named');
    assert.equal(parse('Nothing relevant here.'), false, 'neither half');
  });
});
