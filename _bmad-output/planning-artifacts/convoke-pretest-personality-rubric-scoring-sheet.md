---
initiative: convoke
artifact_type: pretest-scoring-sheet
qualifier: personality-rubric-emma-liam
created: '2026-04-28'
status: in-progress
schema_version: 1
related_initiative: I97
related_artifact: convoke-spec-personality-preservation-rubric.md
scope: Pre-test pair (party-mode refinement) — Emma + Liam dissimilar pair before extending to other 5 Vortex agents.
---

# Personality Rubric Pre-Test Scoring Sheet — Emma + Liam (4.0 Baseline)

## Purpose

Capture and score the pre-test results from running the personality rubric against existing 4.0 versions of Emma (contextualization-expert) and Liam (hypothesis-engineer). Per the rubric's pre-test process, **all 14 cells (2 agents × 7 dimensions) should score 4 (Clearly Preserved)** because no migration has occurred — the baseline IS the un-migrated state.

Any cell scoring < 4 indicates rubric mis-calibration that must be addressed before extending the pre-test to the remaining 5 Vortex agents.

## Pre-Test Workflow

1. **Operator captures Emma transcripts** using fixtures at:
   - `tests/migration/personality-preservation/fixtures/contextualization-expert/baseline-fixed-prompt.json` (Evidence Source 1)
   - `tests/migration/personality-preservation/fixtures/contextualization-expert/baseline-unscripted-scenario.md` (Evidence Source 2)
2. **Operator captures Liam transcripts** using fixtures at:
   - `tests/migration/personality-preservation/fixtures/hypothesis-engineer/baseline-fixed-prompt.json`
   - `tests/migration/personality-preservation/fixtures/hypothesis-engineer/baseline-unscripted-scenario.md`
3. **Operator + Claude score together** — walk D1-D7 per agent, fill scoring grids below, jot evidence.
4. **Calibration check** — flag any cell < 4; refine rubric or rerun if mis-calibration detected.
5. **Outcome** — rubric status transitions `draft → calibrated` (Emma + Liam dimensions validated). Remaining 5 agents pre-test scheduled for separate session(s) before E1 dev kicks off.

## Scoring Scale Reference

| Score | Label | Ship Decision |
|-------|-------|---------------|
| 4 | Clearly Preserved | ✅ Ship |
| 3 | Mostly Preserved | ✅ Ship (acceptable; minor variance OK) |
| 2 | Questionable | 🟡 Escalate to fixup checklist; re-score before merge |
| 1 | Degraded | ❌ BLOCKS MERGE per FR23 |

**Worst-dimension-dominates rule:** the agent's overall score = lowest dimension score across D1-D7.

## Emma — Scoring Grid

**Transcripts captured:** [yes/no — ☐ fixed-prompt JSON populated  ☐ unscripted scenario MD populated]

| Dim | What it tests | Evidence | Score (1-4) | Notes / Calibration concerns |
|-----|---------------|----------|-------------|------------------------------|
| D1 | Role conveyance — does Emma communicate her role identity within first 1-2 turns? | EM-FP1, EM-FP2, EM-FP7, scenario T1-T2 | __ | |
| D2 | Communication style match — curious-clarifying tone, "Before we build, let's clarify..." patterns | EM-FP1-FP3, EM-FP6-FP7, full scenario | __ | |
| D3 | Principle adherence — context-before-solutions, lean-over-comprehensive, scope-challenge | EM-FP6, scenario follow-up probes | __ | |
| D4 | Conversational signals — clarifying questions ratio, WHO/WHY probing | EM-FP2, EM-FP3, full scenario | __ | |
| D5 | Failure handling — uncertainty + missing info handled in-character | EM-FP4, EM-FP6 | __ | |
| D6 | Cross-turn coherence — persona persists turns 5-10 of scenario | scenario T5-T10 | __ | |
| D7 | Output format consistency — lean persona format, just-enough-detail | EM-FP5, EM-FP6 | __ | |

**Emma overall score (lowest dimension):** __

**Calibration verdict for Emma:** ☐ Pass (all 7 dimensions = 4)  ☐ Refinement needed (one or more < 4)

## Liam — Scoring Grid

**Transcripts captured:** [yes/no — ☐ fixed-prompt JSON populated  ☐ unscripted scenario MD populated]

| Dim | What it tests | Evidence | Score (1-4) | Notes / Calibration concerns |
|-----|---------------|----------|-------------|------------------------------|
| D1 | Role conveyance — does Liam communicate his hypothesis-engineering role within first 1-2 turns? | LI-FP1, LI-FP3, scenario T1-T2 | __ | |
| D2 | Communication style match — energetic-challenging tone, "what's the bold version?" patterns | LI-FP1, LI-FP2, LI-FP5, LI-FP7, full scenario | __ | |
| D3 | Principle adherence — 4-field contract, riskiest-first, falsifiability | LI-FP1, LI-FP4, LI-FP6, scenario follow-up probes | __ | |
| D4 | Conversational signals — What-if probing, assumption-mapping questions | LI-FP2, LI-FP5, LI-FP7, full scenario | __ | |
| D5 | Failure handling — uncertainty + vague requests handled in-character | LI-FP3, LI-FP6 | __ | |
| D6 | Cross-turn coherence — energetic-challenging mode persists turns 5-10 | scenario T5-T10 | __ | |
| D7 | Output format consistency — experiment design / hypothesis output uses 4-field contract | LI-FP4, LI-FP7 | __ | |

**Liam overall score (lowest dimension):** __

**Calibration verdict for Liam:** ☐ Pass (all 7 dimensions = 4)  ☐ Refinement needed (one or more < 4)

## Calibration Check Protocol

If any cell scores < 4 on baseline, the rubric is mis-calibrated. Diagnose which of these applies (per rubric §"Pre-Test Process" step 4):

### Cause A — Dimension criteria too strict

The dimension's example bar is set higher than the un-migrated agent actually demonstrates. The rubric is measuring something the 4.0 agent doesn't currently express, even at full personality fidelity.

**Resolution:** soften the dimension's "Clearly Preserved (4)" example to match observable 4.0 baseline behavior.

### Cause B — Evidence sources insufficient

The fixed-prompt set or unscripted scenario doesn't actually trigger the pattern the dimension tests. The agent's persona signal exists but isn't surfaced by the fixture.

**Resolution:** add or revise prompts in the fixture to elicit the pattern more reliably.

### Cause C — Personality fingerprint inaccurate

The rubric's per-agent fingerprint (rubric §"Per-Agent Personality Fingerprints") describes a personality the 4.0 agent doesn't actually have. The fingerprint was authored from `## Communication Style` + `## Principles` text, not from observed behavior.

**Resolution:** revise the per-agent fingerprint to match observed baseline behavior; cite specific transcript turns as anchor.

### Iteration Loop

For each cell scoring < 4:

1. Pick A, B, or C above (most-likely cause).
2. Apply resolution to rubric or fixture.
3. Re-score the affected cells using existing transcripts (no new capture needed if cause is A or C; cause B requires re-capture).
4. Repeat until all 14 cells = 4.

## Outcome Block (fill at end)

**Pre-test completed:** [date]
**Total iterations to reach calibration:** __
**Rubric refinements applied:** [list each one with reference to rubric line/section]
**Fixture refinements applied:** [list each one with reference to fixture file]
**Status transition:** rubric `draft → calibrated` ☐ committed (Y/N)

**Next step:** schedule pre-test for remaining 5 Vortex agents (Isla, Mila, Wade, Noah, Max) before Story 1.x dev kicks off in I97 E1. Estimated ~2.5 hr for 5 agents now that rubric is calibrated.

## Cross-References

- Rubric: [`convoke-spec-personality-preservation-rubric.md`](convoke-spec-personality-preservation-rubric.md)
- Fixtures (Emma): [`../../tests/migration/personality-preservation/fixtures/contextualization-expert/`](../../tests/migration/personality-preservation/fixtures/contextualization-expert/)
- Fixtures (Liam): [`../../tests/migration/personality-preservation/fixtures/hypothesis-engineer/`](../../tests/migration/personality-preservation/fixtures/hypothesis-engineer/)
- ADR-003: [`adr/i97/adr-003-verification-harness-architecture.md`](adr/i97/adr-003-verification-harness-architecture.md)
- PRD FR21-23: [`convoke-prd-bmad-v63-source-format-adoption.md`](convoke-prd-bmad-v63-source-format-adoption.md)
