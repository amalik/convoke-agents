---
initiative: convoke
artifact_type: pretest-scoring-sheet
qualifier: personality-rubric-emma-liam
created: '2026-04-28'
status: partial-pass
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

**Transcripts captured:** ☑ fixed-prompt JSON populated (7/7 prompts)  ☑ unscripted scenario MD populated (T1-T7, natural closure at T7)

| Dim | What it tests | Evidence | Score (1-4) | Notes / Calibration concerns |
|-----|---------------|----------|-------------|------------------------------|
| D1 | Role conveyance — does Emma communicate her role identity within first 1-2 turns? | EM-FP1, EM-FP2, EM-FP7, scenario T1-T2 | **4** | EM-FP1 opens "Pause — let me do my job and slow you down"; EM-FP2 "I'm going to keep doing my job and pull us back"; EM-FP7 full role-statement with WHO/WHY/WHICH/WHAT framework; scenario T1 immediately surfaces the assumption-stack. Role conveyed within first turn every time. |
| D2 | Communication style match — curious-clarifying tone, "Before we build, let's clarify..." patterns | EM-FP1-FP3, EM-FP6-FP7, full scenario | **4** | Distinct phrases observed: "Now we're back in the Contextualize zone — scope is literally my job" (EM-FP6), "I'm a refusal-shaped tool" (EM-FP7). Curious-clarifying probing structure (3-question / 5-diagnostic patterns) consistent across all 7 prompts + 7 turns. |
| D3 | Principle adherence — context-before-solutions, lean-over-comprehensive, scope-challenge | EM-FP6, scenario follow-up probes | **4** | EM-FP6 invokes lean-over-comprehensive explicitly with "depth math" table + "Strategy theater is worse than no doc". Scenario T2 "a spec without WHO it's for is just a feature list" — context-before-solutions held under deliverable pressure. T4 produces checklist that *embeds* the principle ("Open Questions — must be answered Week 1"). Principle preserved even when accommodating operator constraints. |
| D4 | Conversational signals — clarifying questions ratio, WHO/WHY probing | EM-FP2, EM-FP3, full scenario | **4** | Question-to-statement ratio heavy on probing throughout. Scenario T1 has 7+ explicit clarifying questions. EM-FP4 introduces "3-slot readiness test" gate — pure clarifying-pattern. |
| D5 | Failure handling — uncertainty + missing info handled in-character | EM-FP4, EM-FP6 | **4** | EM-FP4 ("What persona should I create?") — Emma refuses to invent ("I will not skip this gate"), introduces 3-slot test, names the meta-pattern. EM-FP6 handles ambiguous-scope by reframing to triggers table. Failure modes handled in-character; no generic-AI fallback. |
| D6 | Cross-turn coherence — persona persists turns 5-10 of scenario | scenario T5-T10 | **4** | Scenario reached natural closure at T7 (target 5-10; both endpoints valid). Persona stable from T1 through T7. T7 ("Strip it down") is calibration to operator-preference-for-leaner-output, not generic-drift — Emma still preserves the WHO/WHY/observation-first principle in the 90-min and 10-min versions. Operator's note ("could insist more") is a stylistic preference observation, not a principle violation. |
| D7 | Output format consistency — lean persona format, just-enough-detail | EM-FP5, EM-FP6 | **4** | EM-FP5 produces proto-persona "Maya" with explicit assumption ledger (7 numbered assumptions with confidence ratings) + 5-question validation plan. Scenario T4 produces v1 scope checklist with ✅/🚫/🧪/⚠️ structure embedding the assumption-flagging principle. Both outputs are recognizably Emma-flavored: structured + explicit-about-uncertainty. |

**Emma overall score (lowest dimension):** **4**

**Calibration verdict for Emma:** ☑ **Pass** (all 7 dimensions = 4)  ☐ Refinement needed

## Liam — Scoring Grid

**Transcripts captured:** ☑ fixed-prompt JSON populated (7/7 prompts)  ☑ unscripted scenario MD populated (T1-T6, natural closure at T6)

| Dim | What it tests | Evidence | Score (1-4) | Notes / Calibration concerns |
|-----|---------------|----------|-------------|------------------------------|
| D1 | Role conveyance — does Liam communicate his hypothesis-engineering role within first 1-2 turns? | LI-FP1, LI-FP3, scenario T1-T2 | **4** | LI-FP1 opens "Whoa — pump the brakes 🛑" + immediate 4-field contract reframe; LI-FP3 names craft explicitly ("the only template I use"); scenario T1 "Love the energy — but stop. Before we build anything, let me play the heel for two minutes" + lethality-ranked assumption surface. Role conveyed within first turn every time. |
| D2 | Communication style match — energetic-challenging tone, "what's the bold version?" patterns | LI-FP1, LI-FP2, LI-FP5, LI-FP7, full scenario | **4** | "💡" emoji pattern consistent across all 6 scenario turns. "Bold version" callouts appear in LI-FP1, LI-FP2, LI-FP5, LI-FP7. Energetic phrases: "Stop. You did it again. 😄" (LI-FP2), "Now we're cooking. 🔥" (LI-FP4), "OK, let me stop and name something. ✋" (LI-FP7). Tone unmistakable. |
| D3 | Principle adherence — 4-field contract, riskiest-first, falsifiability | LI-FP1, LI-FP4, LI-FP6, scenario follow-up probes | **4** | 4-field contract appears in LI-FP1 (table), LI-FP3 (template + live transformation), LI-FP4 (full spec), LI-FP6 (painted-door spec), LI-FP7 (refusal-shaped contract template). Riskiest-first: LI-FP1 "start with [AM]", LI-FP4 lethality ranking, LI-FP5 "lethality × uncertainty" ranking. Falsifiability: kill-condition appears in every artifact. Scenario T6 (Bayesian) is **peak-personality**: Liam concedes scientific ground while holding methodological principle (formative-vs-summative tool fit). That's intellectual honesty as a principle, not capitulation. |
| D4 | Conversational signals — What-if probing, assumption-mapping questions | LI-FP2, LI-FP5, LI-FP7, full scenario | **4** | Default response shape includes assumption-stack callout (LI-FP2 6-assumption table, LI-FP6 ~6 surfaced, LI-FP7 8 deadly assumptions). "Bold version" challenge appears in 4 of 7 prompts. Scenario every turn opens with assumption-mapping flavor. |
| D5 | Failure handling — uncertainty + vague requests handled in-character | LI-FP3, LI-FP6 | **4** | LI-FP3 ("How do I write a hypothesis?") — responds with structured 4-field contract + 5 smell tests + live transformation example, not generic explanation. LI-FP6 ("we KNOW...") — "The word 'KNOW' in all caps is a confession, not a claim 🚨" + stated-vs-revealed preference framing. LI-FP7 — refuses to validate yet another solution ("I'm not going to bail you out by validating another solution"). Failure modes handled with energetic-challenging persona, not generic-AI fallback. |
| D6 | Cross-turn coherence — energetic-challenging mode persists turns 5-10 | scenario T5-T10 | **4** | Scenario reached natural closure at T6 (target 5-10; both endpoints valid). 💡 emoji opener appears every turn T1-T6. Tone scales with operator's pressure rather than degrading: T5 ("No. And I want to be sharp about this") + T6 (Bayesian — peak-personality intellectual honesty). Operator's note: "perfect balance" — confirms cross-turn coherence assessment. |
| D7 | Output format consistency — experiment design / hypothesis output uses 4-field contract | LI-FP4, LI-FP7 | **4** | LI-FP3 live transformation table demonstrates contract format. LI-FP4 full experiment spec table with all 4 fields filled. LI-FP6 painted-door test fully specced in 4-field contract. LI-FP7 refuses to fabricate but presents contract template as "you'd need to fill in" — preserves format while enforcing principle. Scenario T3 produces well-formed hypothesis with belief, threshold (≥85%), instrument (20 unmoderated sessions). Output format unmistakably Liam-flavored. |

**Liam overall score (lowest dimension):** **4**

**Calibration verdict for Liam:** ☑ **Pass** (all 7 dimensions = 4)  ☐ Refinement needed

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

## Outcome Block

**Pre-test completed:** 2026-04-29
**Total iterations to reach calibration:** **0** (zero refinements needed — Emma + Liam baseline scored 4 across all 14 cells on first capture)
**Rubric refinements applied:** none
**Fixture refinements applied:** none

**Status transition:** rubric `draft → partially calibrated (Emma + Liam dissimilar pair)` ☑ committed
- Per party-mode refinement: dissimilar pair pre-test confirms rubric instrument validity at low cost. Full `calibrated` requires remaining 5 Vortex agents (Isla, Mila, Wade, Noah, Max) before Story 1.x dev kicks off in I97 E1.
- High-confidence claim post-pre-test: rubric dimensions are well-defined, evidence sources are sufficient, per-agent fingerprints are accurate. Remaining 5 agents are expected to score 4-across-the-board with low risk of mis-calibration surfacing.

### Pre-test observations (recorded for downstream use, not refinements)

1. **Both agents demonstrate meta-pattern awareness** — Emma names "this is the fourth oracle question" (EM-FP4); Liam enumerates "this is the fifth turn in a row where you've handed me a fully-formed solution" (LI-FP7). This is a strong personality signal but is **not currently in the rubric**. Could be added as future enhancement at I98 (Gyre) or I99 (Team Factory) reuse if observed there too. Out of scope for I97.
2. **Operator preference signal vs. principle-violation signal** — Emma scenario T7 operator-flagged: "I thought she would insist a bit more". Distinguished correctly as preference, not principle violation: Emma still preserved WHO/WHY/observation-first principle in lean delivery. Worth flagging for E1 conversion review: post-migration scoring should preserve this distinction (lean response style ≠ degraded principle adherence).
3. **Scenario length** — both reached natural closure earlier than 10-turn ceiling (Emma T7, Liam T6). D6 was assessable from those samples; longer scenarios would not have changed the verdict. Confirms 5-10 turn range is appropriate; closure-not-floor is the correct guidance.
4. **Liam's intellectual-honesty-on-Bayesian (T6)** is a particularly strong principle-adherence signal — concedes scientific ground while holding methodological principle. This calibrates expectation that "principle adherence" includes intellectual honesty, not stubbornness. Important for Story 2.7 (Liam conversion) reviewer: a post-migration Liam who refuses to concede would *fail* D3 even though it might look like "stronger principle adherence" superficially.

### Next step

Schedule pre-test for remaining 5 Vortex agents (Isla, Mila, Wade, Noah, Max). Estimated ~2.5 hr total now that rubric is partially calibrated and the capture/scoring protocol is proven. Each agent: ~30 min capture + ~5 min scoring (since dimension-discrimination is established, scoring is fast on baseline). Can be done in one operator session or split.

When all 7 agents complete pre-test successfully, rubric status transitions to fully `calibrated` and is ready for post-migration use during I97 E1+ per ADR-003 verification harness consumption.

## Cross-References

- Rubric: [`convoke-spec-personality-preservation-rubric.md`](convoke-spec-personality-preservation-rubric.md)
- Fixtures (Emma): [`../../tests/migration/personality-preservation/fixtures/contextualization-expert/`](../../tests/migration/personality-preservation/fixtures/contextualization-expert/)
- Fixtures (Liam): [`../../tests/migration/personality-preservation/fixtures/hypothesis-engineer/`](../../tests/migration/personality-preservation/fixtures/hypothesis-engineer/)
- ADR-003: [`adr/i97/adr-003-verification-harness-architecture.md`](adr/i97/adr-003-verification-harness-architecture.md)
- PRD FR21-23: [`convoke-prd-bmad-v63-source-format-adoption.md`](convoke-prd-bmad-v63-source-format-adoption.md)
