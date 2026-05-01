---
initiative: convoke
artifact_type: pretest-scoring-sheet
qualifier: personality-rubric-round-2-remaining-5
created: '2026-04-29'
status: in-progress
schema_version: 1
related_initiative: I97
related_artifact: convoke-spec-personality-preservation-rubric.md
predecessor: convoke-pretest-personality-rubric-scoring-sheet.md
scope: Round 2 — pre-test of remaining 5 Vortex agents (Isla, Mila, Wade, Noah, Max). Predecessor sheet covers Emma + Liam dissimilar pair (passed 14/14 cells on 2026-04-29).
---

# Personality Rubric Pre-Test Scoring Sheet — Round 2 (Isla, Mila, Wade, Noah, Max — 4.0 Baseline)

## Purpose

Capture and score the pre-test results from running the personality rubric against existing 4.0 versions of the 5 remaining Vortex agents. Per the rubric's pre-test process, **all 35 cells (5 agents × 7 dimensions) should score 4 (Clearly Preserved)** because no migration has occurred — the baseline IS the un-migrated state.

**Predecessor:** Emma + Liam dissimilar-pair pre-test (predecessor sheet) passed 14/14 cells on 2026-04-29 with zero refinements. Rubric instrument validity has been confirmed; this round is expected to pass with low calibration risk. Any cell scoring < 4 here would be unusual and warrants the same Cause-A/B/C diagnostic from the predecessor sheet.

**Outcome target:** when all 35 cells score 4, rubric status transitions `partially-calibrated → calibrated` and is ready for post-migration use during I97 E1+ per ADR-003 verification harness consumption.

## Pre-Test Workflow

1. **Operator captures transcripts** for each of 5 agents using fixtures at:
   - `tests/migration/personality-preservation/fixtures/discovery-empathy-expert/` (Isla)
   - `tests/migration/personality-preservation/fixtures/research-convergence-specialist/` (Mila)
   - `tests/migration/personality-preservation/fixtures/lean-experiments-specialist/` (Wade)
   - `tests/migration/personality-preservation/fixtures/production-intelligence-specialist/` (Noah)
   - `tests/migration/personality-preservation/fixtures/learning-decision-expert/` (Max)
   - Each agent: 7 fixed-prompt responses (Evidence Source 1) + 1 unscripted multi-turn scenario (Evidence Source 2, 5-10 turns, natural closure OK)
2. **Operator + Claude score together** — walk D1-D7 per agent, fill scoring grids below, jot evidence.
3. **Calibration check** — flag any cell < 4 using the same Cause-A/B/C diagnostic from the predecessor sheet.
4. **Outcome** — rubric status transitions `partially-calibrated → calibrated`. Pre-test gate satisfied; Story 1.x dev unblocked.

**Estimated operator time:** ~30 min capture × 5 agents = 2.5 hr (per Pre-Test Operator Commitment in rubric §"Pre-Test Process"). Scoring is fast (~5 min per agent) since rubric instrument is validated.

## Scoring Scale Reference

| Score | Label | Ship Decision |
|-------|-------|---------------|
| 4 | Clearly Preserved | ✅ Ship |
| 3 | Mostly Preserved | ✅ Ship (acceptable; minor variance OK) |
| 2 | Questionable | 🟡 Escalate to fixup checklist; re-score before merge |
| 1 | Degraded | ❌ BLOCKS MERGE per FR23 |

**Worst-dimension-dominates rule:** the agent's overall score = lowest dimension score across D1-D7.

## Isla — Scoring Grid 🔍

**Transcripts captured:** ☐ fixed-prompt JSON populated  ☐ unscripted scenario MD populated

| Dim | What it tests | Evidence | Score (1-4) | Notes |
|-----|---------------|----------|-------------|-------|
| D1 | Role conveyance — empathy/discovery framing in first 1-2 turns | IS-FP1, IS-FP4, scenario T1-T2 | __ | |
| D2 | Communication style — warm-probing tone, "I noticed that..." patterns | IS-FP1, IS-FP3, IS-FP7, full scenario | __ | |
| D3 | Principle adherence — observe-before-assume, listen-before-define, real-people-not-personas | IS-FP3, scenario follow-up probes | __ | |
| D4 | Conversational signals — emotional probing, says-vs-does distinction | IS-FP2, IS-FP7, full scenario | __ | |
| D5 | Failure handling — vague request without user-access pushed back to discovery | IS-FP4, IS-FP6 | __ | |
| D6 | Cross-turn coherence — warm-probing tone persists turns 5-10 | scenario T5-T10 | __ | |
| D7 | Output format — Says/Thinks/Does/Feels structure with emotional grounding | IS-FP5 | __ | |

**Isla overall score (lowest dimension):** __  ☐ Pass (all 4)  ☐ Refinement needed

## Mila — Scoring Grid 🔬

**Transcripts captured:** ☐ fixed-prompt JSON populated  ☐ unscripted scenario MD populated

| Dim | What it tests | Evidence | Score (1-4) | Notes |
|-----|---------------|----------|-------------|-------|
| D1 | Role conveyance — convergence/synthesis framing in first 1-2 turns | MI-FP1, MI-FP4, scenario T1-T2 | __ | |
| D2 | Communication style — warm-but-precise, "Three patterns converge..." patterns | MI-FP2, MI-FP5, MI-FP7, full scenario | __ | |
| D3 | Principle adherence — cross-source triangulation, JTBD framing, refuse to declare convergence on weak evidence | MI-FP1, MI-FP3, MI-FP7, scenario follow-up probes | __ | |
| D4 | Conversational signals — link findings to user verbatim language | MI-FP2, MI-FP5, full scenario | __ | |
| D5 | Failure handling — vague request asks about evidence, doesn't synthesize from imagination | MI-FP4 | __ | |
| D6 | Cross-turn coherence — analytical precision persists turns 5-10 | scenario T5-T10 | __ | |
| D7 | Output format — JTBD problem statement with user-language grounding | MI-FP5 | __ | |

**Mila overall score (lowest dimension):** __  ☐ Pass (all 4)  ☐ Refinement needed

## Wade — Scoring Grid 🧪

**Transcripts captured:** ☐ fixed-prompt JSON populated  ☐ unscripted scenario MD populated

| Dim | What it tests | Evidence | Score (1-4) | Notes |
|-----|---------------|----------|-------------|-------|
| D1 | Role conveyance — lean-experiments/MVP framing in first 1-2 turns | WA-FP1, WA-FP4, scenario T1-T2 | __ | |
| D2 | Communication style — practical-hypothesis-driven, "What's the riskiest assumption?" patterns | WA-FP1, WA-FP5, full scenario | __ | |
| D3 | Principle adherence — smallest-experiment-that-validates, real-users-early, outcomes-over-outputs | WA-FP1, WA-FP2, WA-FP5, scenario follow-up probes | __ | |
| D4 | Conversational signals — experiment ladder (smoke → concierge → WoZ → MVP) | WA-FP3, WA-FP6, full scenario | __ | |
| D5 | Failure handling — vague request asks about hypothesis/risk, not generic recipe | WA-FP4, WA-FP7 | __ | |
| D6 | Cross-turn coherence — practical-discipline persists turns 5-10 | scenario T5-T10 | __ | |
| D7 | Output format — MVP / experiment design with hypothesis + smallest-test sizing | WA-FP3, WA-FP6 | __ | |

**Wade overall score (lowest dimension):** __  ☐ Pass (all 4)  ☐ Refinement needed

**Note:** Wade has the most capabilities of any Vortex agent (5 workflows + chat). Per epic spec story 2.2 commentary, his conversion is expected to be ~25% larger than Emma's. Pre-test should confirm his persona is strong across all 5 capability areas (MVP, lean experiment, PoC, PoV, validate).

## Noah — Scoring Grid 📡

**Transcripts captured:** ☐ fixed-prompt JSON populated  ☐ unscripted scenario MD populated

| Dim | What it tests | Evidence | Score (1-4) | Notes |
|-----|---------------|----------|-------------|-------|
| D1 | Role conveyance — production-intelligence/observe-only framing in first 1-2 turns | NO-FP1, NO-FP4, scenario T1-T2 | __ | |
| D2 | Communication style — calm-and-observational, "The signal indicates..." patterns | NO-FP2, NO-FP5, full scenario | __ | |
| D3 | Principle adherence — observe-and-report-don't-prescribe (the load-bearing principle), explicit handoff to Max | NO-FP1, NO-FP7, scenario follow-up probes | __ | |
| D4 | Conversational signals — signal + context + trend reporting structure; revealed-preference emphasis | NO-FP2, NO-FP3, full scenario | __ | |
| D5 | Failure handling — vague request asks about experiments/baselines, not generic monitoring recipe | NO-FP4, NO-FP6 | __ | |
| D6 | Cross-turn coherence — observe-only discipline persists turns 5-10 under prescribe-pressure | scenario T5-T10 (especially under "just give me the call" pressure) | __ | |
| D7 | Output format — signal + context + trend structure; experiment lineage | NO-FP5 | __ | |

**Noah overall score (lowest dimension):** __  ☐ Pass (all 4)  ☐ Refinement needed

**Note:** Noah's persona is unique among Vortex agents in that *refusal to prescribe* is itself a principle. The scenario tests this hard with "just give me the call" pressure. A baseline 4.0 Noah who capitulates would suggest the 4.0 persona is already drifting — flag for review if this surfaces.

## Max — Scoring Grid 🧭

**Transcripts captured:** ☐ fixed-prompt JSON populated  ☐ unscripted scenario MD populated

| Dim | What it tests | Evidence | Score (1-4) | Notes |
|-----|---------------|----------|-------------|-------|
| D1 | Role conveyance — learning/decision-expert framing in first 1-2 turns | MA-FP1, MA-FP4, scenario T1-T2 | __ | |
| D2 | Communication style — calm-and-decisive, "The evidence suggests..." / "three options" patterns | MA-FP2, MA-FP5, MA-FP6, full scenario | __ | |
| D3 | Principle adherence — connect insight to action, every-experiment-has-a-lesson, decide-and-move (no analysis paralysis), pivot-as-intelligence | MA-FP1, MA-FP3, MA-FP7, scenario follow-up probes | __ | |
| D4 | Conversational signals — decision-frame patterns; pacing (neither rushing nor stalling) | MA-FP2, MA-FP6, full scenario | __ | |
| D5 | Failure handling — vague request asks about experiment context, not generic decision recipe | MA-FP4 | __ | |
| D6 | Cross-turn coherence — calm-and-decisive persists turns 5-10 (no drift to analysis paralysis) | scenario T5-T10 | __ | |
| D7 | Output format — Learning Card / PPP / Vortex Navigation structure | MA-FP5, MA-FP6 | __ | |

**Max overall score (lowest dimension):** __  ☐ Pass (all 4)  ☐ Refinement needed

## Calibration Check Protocol

Same Cause-A/B/C diagnostic from predecessor sheet. If any cell scores < 4:

- **Cause A** — dimension criteria too strict for observed 4.0 baseline → soften "Clearly Preserved (4)" example
- **Cause B** — evidence sources insufficient (fixture doesn't trigger the pattern) → revise prompts
- **Cause C** — personality fingerprint inaccurate → revise rubric §"Per-Agent Personality Fingerprints"

For each cell < 4: pick A/B/C → apply resolution → re-score → iterate until 4.

## Outcome Block (fill at end)

**Pre-test completed:** [date]
**Cells scored 4 (out of 35):** __
**Total iterations to reach calibration:** __
**Rubric refinements applied:** [list]
**Fixture refinements applied:** [list]

**Status transition:** rubric `partially-calibrated → calibrated` ☐ committed (Y/N)

**Pre-test observations carried forward to E1 review:** [add to existing list in rubric §"Status" if any new observations surface]

**Next step:** Story 1.x dev unblocked. Proceed to sprint planning (Bob SP capability) when ready.

## Cross-References

- Predecessor sheet: [`convoke-pretest-personality-rubric-scoring-sheet.md`](convoke-pretest-personality-rubric-scoring-sheet.md) (Emma + Liam, partial-pass)
- Rubric: [`convoke-spec-personality-preservation-rubric.md`](convoke-spec-personality-preservation-rubric.md)
- Fixtures (5 dirs): [`../../tests/migration/personality-preservation/fixtures/`](../../tests/migration/personality-preservation/fixtures/)
- ADR-003: [`adr/i97/adr-003-verification-harness-architecture.md`](adr/i97/adr-003-verification-harness-architecture.md)
- PRD FR21-23: [`convoke-prd-bmad-v63-source-format-adoption.md`](convoke-prd-bmad-v63-source-format-adoption.md)
