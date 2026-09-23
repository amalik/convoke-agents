'use strict';

/**
 * The personality-preservation captures — each agent's fixed-prompt JSON and unscripted-scenario
 * markdown, before and after conversion — parse, belong to the agent and phase they are filed under,
 * are complete against the record, and the harness loads every baseline.
 *
 * WHY THIS EXISTS (T135). The harness shipped and then never executed: 9 of its 10 fixed-prompt
 * captures were invalid JSON — agent responses pasted in with raw newlines and unescaped inner quotes —
 * so `runPersonalityCheck` threw on every agent. Nothing noticed, because the only tests of the
 * harness called it with an INVALID mode to exercise its error handling, and `tests/migration/` is
 * not in the `npm test` suite.
 *
 * THIS TEST READS REPOSITORY DATA ON PURPOSE, under `test-fixture-isolation`'s one exception,
 * `committed-artifact-integrity` (ruled 2026-09-23 on this test's escalation). The subject here is the
 * integrity of these specific files and the record that cites them; a fixture copy would test the copy.
 * The exception's four conditions bind this file: assert only about the artifact; take expectations
 * from sources the artifact does not control (the agent registry, the SKILL.md files, the scoring
 * sheets); state what the test cannot detect (THE FLOOR, below); and accept that a newly registered
 * agent turns this suite red until its capture exists.
 *
 * WHAT "COMPLETE" MEANS HERE — each check below names the loss it catches. A first repair of these
 * files produced valid JSON that had cut Emma's baseline from 7 prompts to 3, so validity is not
 * enough. Identity and completeness are checked against the agent registry, the converted-agent
 * SKILL.md files, the scoring sheets' cited prompt ids, and — for a scored capture — the internal
 * arithmetic of its own scores.
 *
 * THE FLOOR, stated because a green run here is easy to over-read. Mutation-tested 2026-09-21, this
 * file does NOT detect:
 *   - a response or a prompt text truncated (for prompt text: in both captures alike, or in a
 *     baseline-only agent's), or two responses swapped between prompts;
 *   - a scenario capture's content truncated — only its presence is checked;
 *   - descriptive fields deleted (`rationale`, `expected_persona_signals`, `fixture_purpose`, …);
 *   - a `scoring_results` block dropped outright. Wade's post-migration scores live only in his
 *     scoring report, never in the capture, so "has a report" cannot imply "carries a block".
 * The text losses need a record of the text, and the only record is the capture itself. A length
 * floor or pinned content hashes would close them at the cost of an arbitrary threshold or
 * golden-file brittleness — a decision, not a fix. Content integrity for Emma's repaired files was
 * established at repair time by an independent character-level diff, not here.
 */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const { PACKAGE_ROOT } = require('../helpers');
const { runPersonalityCheck } = require('../../scripts/migration/format-conversion/personality-harness');
const { AGENTS: REGISTRY } = require('../../scripts/update/lib/agent-registry');

const FIXTURES = path.join(PACKAGE_ROOT, 'tests/migration/personality-preservation/fixtures');
const RUBRIC = path.join(PACKAGE_ROOT, '_bmad-output/planning-artifacts/convoke-spec-personality-preservation-rubric.md');
const SCORING_SHEETS = [
  '_bmad-output/planning-artifacts/convoke-pretest-personality-rubric-scoring-sheet.md',
  '_bmad-output/planning-artifacts/convoke-pretest-personality-rubric-scoring-sheet-round-2.md',
].map((p) => path.join(PACKAGE_ROOT, p));
const PHASES = ['baseline', 'post-migration'];

// The roster comes from the agent registry, NOT from listing the fixtures directory — a roster
// derived from the directories stays green when an agent's directory is deleted. So does each
// agent's prompt-id prefix (Emma → EM): taking it from the fixture's own first id let a capture
// filed under the wrong agent choose which slice of the record it was checked against.
const AGENTS = [...REGISTRY].sort((a, b) => a.id.localeCompare(b.id));
const PREFIX = Object.fromEntries(AGENTS.map((a) => [a.id, a.name.slice(0, 2).toUpperCase()]));

function fixture(agent, phase) {
  const p = path.join(FIXTURES, agent, `${phase}-fixed-prompt.json`);
  return fs.existsSync(p) ? p : null;
}

function load(p) {
  let raw = fs.readFileSync(p, 'utf8');
  if (raw.charCodeAt(0) === 0xFEFF) raw = raw.slice(1);
  return JSON.parse(raw);
}

function skillFile(agent) {
  return path.join(PACKAGE_ROOT, '_bmad/bme/_vortex/agents', agent, 'SKILL.md');
}

// Converted-ness is DERIVED: a v5 agent file opens its XML body with an `<agent …>` element at the
// start of a line; a v6.3 one has none. Anchored to line start so prose that merely mentions the
// element does not count. A missing SKILL.md fails the roster test rather than reading as "v5".
function isConverted(agent) {
  return !/^<agent\s/m.test(fs.readFileSync(skillFile(agent), 'utf8'));
}

// Every prompt id the committed pre-test scores cite. Those scores rest on these prompts existing,
// so this is completeness against the RECORD rather than against the fixture's own contents.
const CITED_IDS = new Set(
  SCORING_SHEETS.flatMap((p) => fs.readFileSync(p, 'utf8').match(/\b[A-Z]{2}-FP\d+\b/g) || []),
);

describe('personality fixtures — every capture parses, is filed correctly, and is complete', () => {
  it('every registered agent has a SKILL.md, a distinct prompt prefix, and a baseline capture', () => {
    assert.ok(AGENTS.length > 0, 'agent registry exported no AGENTS');
    const prefixes = Object.values(PREFIX);
    assert.equal(new Set(prefixes).size, prefixes.length,
      `two agents share a prompt-id prefix (${prefixes.join(', ')}) — they would share one slice of the record`);
    for (const { id } of AGENTS) {
      assert.ok(fs.existsSync(skillFile(id)), `${id} is a registered agent with no SKILL.md`);
      assert.ok(fixture(id, 'baseline'), `${id} is a registered agent with no baseline-fixed-prompt.json`);
    }
  });

  it('an agent has a post-migration capture exactly when it is converted', () => {
    const converted = AGENTS.map((a) => a.id).filter(isConverted);
    assert.ok(converted.length > 0, 'no converted agents derived — the SKILL.md check itself may be broken');
    for (const { id } of AGENTS) {
      assert.equal(Boolean(fixture(id, 'post-migration')), isConverted(id), isConverted(id)
        ? `${id} is converted (its SKILL.md has no v5 <agent> element) but has no post-migration capture to compare`
        : `${id} has a post-migration capture but its SKILL.md is still v5 — the capture cannot be of a conversion`);
    }
  });

  for (const { id: agent } of AGENTS) {
    for (const phase of PHASES) {
      it(`${agent} ${phase}: parses strictly, is ${agent}'s, and runs ${PREFIX[agent]}-FP1..FPn`, (t) => {
        const p = fixture(agent, phase);
        // The two roster tests above decide whether an absence is allowed; this one only checks
        // captures that exist.
        if (!p) { t.skip(`${agent} has no ${phase} capture`); return; }
        let doc;
        assert.doesNotThrow(() => { doc = load(p); }, `${agent}/${phase} is not valid JSON — the harness will throw on it`);
        assert.equal(doc.agent_role, agent, `${agent}/${phase} holds a capture of ${doc.agent_role}`);
        assert.ok(Array.isArray(doc.prompts) && doc.prompts.length > 0, `${agent}/${phase} has no prompts`);

        const ids = doc.prompts.map((x) => x.id);
        assert.deepEqual(ids, ids.map((_, i) => `${PREFIX[agent]}-FP${i + 1}`),
          `${agent}/${phase} prompt ids must run ${PREFIX[agent]}-FP1..FP${ids.length} without a gap; got ${ids.join(', ')}`);
        for (const x of doc.prompts) {
          assert.ok(typeof x.prompt === 'string' && x.prompt.trim(), `${agent}/${phase} ${x.id}: empty prompt`);
          assert.ok(typeof x.response === 'string' && x.response.trim(), `${agent}/${phase} ${x.id}: empty response`);
          assert.ok(Array.isArray(x.primary_dimensions) && x.primary_dimensions.length > 0
            && x.primary_dimensions.every((d) => /^D[1-7]$/.test(d)),
          `${agent}/${phase} ${x.id}: primary_dimensions must name the D1-D7 dimensions this prompt is scored on`);
        }

        const scenario = path.join(FIXTURES, agent, `${phase}-unscripted-scenario.md`);
        assert.ok(fs.existsSync(scenario) && fs.readFileSync(scenario, 'utf8').trim(),
          `${agent}/${phase} has a fixed-prompt capture but no ${phase}-unscripted-scenario.md — the multi-turn dimensions are scored from it`);
      });
    }
  }

  // Completeness against the RECORD. The rubric allows "~5-7 prompts per agent", so no count is
  // asserted — but every id the scoring sheets cite must still exist. This covers unconverted
  // agents too, which a baseline-vs-post-migration comparison cannot.
  for (const { id: agent } of AGENTS) {
    it(`${agent}: every prompt the scoring sheets cite still exists in its baseline`, () => {
      const ids = load(fixture(agent, 'baseline')).prompts.map((x) => x.id);
      const cited = [...CITED_IDS].filter((id) => id.startsWith(`${PREFIX[agent]}-`)).sort();
      assert.ok(cited.length > 0, `the scoring sheets cite no ${PREFIX[agent]}- prompts — the source this check relies on has moved`);
      const missing = cited.filter((id) => !ids.includes(id));
      assert.deepEqual(missing, [], `${agent}: the scoring record cites prompts its baseline no longer has — ${missing.join(', ')}`);
    });
  }

  // Before and after are the same prompts put to two different agent builds. So the prompts must
  // match, and no response may: an identical response means one capture has been copied over the
  // other, in whole or in part. BOUND: prompt text cut identically in both files passes.
  for (const { id: agent } of AGENTS) {
    it(`${agent}: the two captures share their prompts and differ in every response`, (t) => {
      const m = fixture(agent, 'post-migration');
      if (!m) { t.skip(`${agent} has no post-migration capture to compare`); return; }
      const bp = load(fixture(agent, 'baseline')).prompts;
      const mp = load(m).prompts;
      assert.deepEqual(mp.map((x) => x.id), bp.map((x) => x.id),
        `${agent}: the two captures must cover the same prompts — a mismatch means one lost or gained some`);
      for (let i = 0; i < bp.length; i++) {
        assert.equal(mp[i].prompt, bp[i].prompt, `${agent} ${bp[i].id}: prompt text differs between captures`);
        assert.notEqual(mp[i].response, bp[i].response,
          `${agent} ${bp[i].id}: the post-migration response is the baseline's — one capture was copied over the other`);
      }
    });
  }

  // A scored capture must still hold every score its verdict rests on. The per-prompt scores must
  // cover each prompt's own primary_dimensions, and the aggregate, the lowest dimension and the
  // degraded flag must agree with them — so a block with keys dropped or values gutted fails. A
  // block dropped outright skips: see THE FLOOR.
  for (const { id: agent } of AGENTS) {
    it(`${agent}: where scores are recorded, they are complete and consistent`, (t) => {
      const m = fixture(agent, 'post-migration');
      const doc = m && load(m);
      if (!doc || !doc.scoring_results) { t.skip(`${agent} has no recorded scoring_results`); return; }
      const sr = doc.scoring_results;
      const isScore = (v) => Number.isInteger(v) && v >= 1 && v <= 4;
      for (const f of ['scored_on', 'scored_by', 'merge_gate']) {
        assert.ok(typeof sr[f] === 'string' && sr[f].trim(), `${agent}: scoring_results.${f} is missing — the verdict has lost its provenance`);
      }
      const pp = sr.per_prompt;
      assert.ok(pp && typeof pp === 'object', `${agent}: scoring_results has no per_prompt block`);
      assert.deepEqual(Object.keys(pp).sort(), doc.prompts.map((x) => x.id).sort(),
        `${agent}: per_prompt scores must key exactly the captured prompt ids`);
      const scored = new Set();
      for (const x of doc.prompts) {
        for (const d of x.primary_dimensions) {
          assert.ok(pp[x.id] && isScore(pp[x.id][d]), `${agent} ${x.id}: no 1-4 score for its primary dimension ${d}`);
          scored.add(d);
        }
      }
      const agg = sr.aggregate_per_dimension;
      assert.ok(agg && typeof agg === 'object', `${agent}: scoring_results has no aggregate_per_dimension`);
      for (const d of scored) assert.ok(isScore(agg[d]), `${agent}: aggregate_per_dimension has no 1-4 score for ${d}`);
      const all = Object.values(agg);
      assert.ok(all.every(isScore), `${agent}: aggregate_per_dimension holds a non-score value`);
      assert.equal(sr.lowest_dimension, Math.min(...all), `${agent}: lowest_dimension disagrees with the aggregate`);
      const anyOne = all.includes(1) || doc.prompts.some((x) => x.primary_dimensions.some((d) => pp[x.id][d] === 1));
      assert.equal(sr.any_degraded, anyOne, `${agent}: any_degraded disagrees with the scores (1 = Degraded)`);
    });
  }
});

describe('personality harness — loads every agent\'s baseline', () => {
  // The existing harness tests only exercise its error path. The harness reads only
  // `baseline-fixed-prompt.json` and `baseline-unscripted-scenario.md`; post-migration captures are
  // checked by the parse above, not by the harness.
  for (const { id: agent } of AGENTS) {
    it(`runPersonalityCheck loads ${agent}'s baseline capture and scenario`, () => {
      let result;
      assert.doesNotThrow(() => {
        result = runPersonalityCheck({
          projectRoot: PACKAGE_ROOT, agentRoleName: agent,
          fixtureRoot: FIXTURES, rubricPath: RUBRIC, mode: 'verify',
        });
      }, `the harness threw on ${agent}`);
      assert.deepEqual(result.fixedPromptCapture, load(fixture(agent, 'baseline')),
        `the harness did not load ${agent}'s baseline capture`);
      assert.ok(result.scenarioCapture && result.scenarioCapture.trim(),
        `the harness found no baseline scenario for ${agent}`);
    });
  }
});
