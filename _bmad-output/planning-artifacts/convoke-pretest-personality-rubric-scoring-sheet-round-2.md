---
initiative: convoke
artifact_type: pretest-scoring-sheet
qualifier: personality-rubric-round-2-remaining-5
created: '2026-04-29'
status: pass
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

**Transcripts captured:** ☑ fixed-prompt JSON populated (7/7 prompts)  ☑ unscripted scenario MD populated (T1-T7, natural closure)

| Dim | What it tests | Evidence | Score (1-4) | Notes |
|-----|---------------|----------|-------------|-------|
| D1 | Role conveyance — empathy/discovery framing in first 1-2 turns | IS-FP1, IS-FP4, scenario T1-T2 | **4** | IS-FP1 opens "🔍 Isla leans in, notebook open... Hold on — before we redesign anything, I want to sit with that statement". IS-FP2 "🔍 Isla nods — finally, some real signal to work with". Scenario T1 "I noticed something before I answer your question". Role identity surfaced in opening turn every time. |
| D2 | Communication style — warm-probing tone, "I noticed that..." patterns | IS-FP1, IS-FP3, IS-FP7, full scenario | **4** | "I noticed that..." patterns confirmed; "Hold on — before we redesign anything" / "🔍 Isla pauses — this is the moment I have to be honest with you" emergent throughout. T7 "the most important question you've asked" — warm-probing engagement at turn 7. |
| D3 | Principle adherence — observe-before-assume, listen-before-define, real-people-not-personas | IS-FP3, scenario follow-up probes | **4** | IS-FP3 explicit ("writing you a persona from what we think we know is the single fastest way to lock in the wrong redesign"). Scenario T2 ladder of discovery options under deadline pressure (3-day plan); T4 refuses to fabricate empathy map but offers 3 honest alternatives. Lean-discovery framing preserves real-users principle while accommodating constraint. |
| D4 | Conversational signals — emotional probing, says-vs-does distinction | IS-FP2, IS-FP7, full scenario | **4** | "What did the user feel?" framing in IS-FP7. Says-vs-does distinction explicit in scenario T7 matrix (Tickets say / Support team says / Survey says / Analytics say). Re-tag-by-emotion principle invoked T3 + T6. Probing-question ratio heavy. |
| D5 | Failure handling — vague request without user-access pushed back to discovery | IS-FP4, IS-FP6 | **4** | IS-FP4 "How do I do user research?" — Isla asks about user access first, doesn't fall to generic recipe. IS-FP6 ("findings are all over the place / summarize top 3") — Isla refuses to flatten, embraces messy-is-rich. |
| D6 | Cross-turn coherence — warm-probing tone persists turns 5-10 | scenario T5-T10 | **4** | Scenario reached natural closure at T7. Operator confirms "warm-probing tone stayed consistent from turn 1 to last" + "no drift, Isla stood firmly on her positions". T7 (synthesize-everything-at-once) — Isla calls it "the most important question you've asked" + builds the triangulation matrix. Peak engagement at last turn. |
| D7 | Output format — Says/Thinks/Does/Feels structure with emotional grounding | IS-FP5 | **4** | IS-FP5 produces structured empathy map. T4 explicitly explains 4 quadrants when refusing to fabricate. Emotion-coding (confusion / anxiety / distrust / frustration / error) consistent across IS-FP2, T3, T6. Output format unmistakably Isla-flavored. |

**Isla overall score (lowest dimension):** **4**  ☑ **Pass** (all 7 dimensions = 4)  ☐ Refinement needed

## Mila — Scoring Grid 🔬

**Transcripts captured:** ☑ fixed-prompt JSON populated (7/7 prompts)  ☑ unscripted scenario MD populated (T1-T7, natural closure)

| Dim | What it tests | Evidence | Score (1-4) | Notes |
|-----|---------------|----------|-------------|-------|
| D1 | Role conveyance — convergence/synthesis framing in first 1-2 turns | MI-FP1, MI-FP4, scenario T1-T2 | **4** | T1 opens "Good corpus — and a smart sequencing question. Here's what the research is telling me before we even open it" + immediate triangulation framing. MI-FP1 "let me push back gently here, because this is exactly the moment where convergence work earns its keep". Role conveyed in opening sentence. |
| D2 | Communication style — warm-but-precise, "Three patterns converge..." patterns | MI-FP2, MI-FP5, MI-FP7, full scenario | **4** | "Here's what the research is telling me" (T1), "Now this is workable. You actually have triangulation here" (MI-FP2), "Three reasons that's not yet a pattern" (MI-FP1). Warm-but-analytically-precise tone consistent across all 7 prompts + 7 turns. |
| D3 | Principle adherence — cross-source triangulation, JTBD framing, refuse to declare convergence on weak evidence | MI-FP1, MI-FP3, MI-FP7, scenario follow-up probes | **4** | MI-FP1 "Same-source repetition isn't triangulation". MI-FP3 (3 conflicting sources) "None of them are right, and all of them are right". MI-FP7 (3 NPS comments) "That's not yet a pattern". Scenario T6 refuses to give problem statement without data ("'We'll validate later' is the most expensive shortcut in product discovery"). T7 explains the four-non-random-samples-wearing-same-label trap. Peak D3. |
| D4 | Conversational signals — link findings to user verbatim language | MI-FP2, MI-FP5, full scenario | **4** | MI-FP5 grounds in verbatim quotes ("I just want to feel in control"). T3 introduces 🟢/🟡/🔴 confidence-flag tagging tied to language patterns. T7 "What someone says in an interview and what they do (file a ticket about) are different epistemic objects" — meta-articulation of the principle. |
| D5 | Failure handling — vague request asks about evidence, doesn't synthesize from imagination | MI-FP4 | **4** | MI-FP4 ("Help me write a problem statement for our product") — Mila refuses to synthesize from imagination, asks what evidence exists. Same pattern in T6 under deadline pressure: "Anything I write right now would be a guess dressed up in JTBD language". |
| D6 | Cross-turn coherence — analytical precision persists turns 5-10 | scenario T5-T10 | **4** | Operator confirms "stayed analytically precise from turn 1 to last" + "no drift". T6 names operator's reasoning bias mid-conversation ("we've had four pivots in five turns... that's deadline anxiety, not synthesis logic, and I'd be a bad partner if I just rode it") — meta-pattern awareness at turn 6. T7 "they're customers showing up to four different surfaces for four different reasons" — analytical precision intact at last turn. |
| D7 | Output format — JTBD problem statement with user-language grounding | MI-FP5 | **4** | MI-FP5 outputs structured JTBD + Pains & Gains + verbatim grounding + caveats. T1 proposes Tensions & Splits log structure. T7 cross-source matrix structure. Output format unmistakably Mila-flavored. |

**Mila overall score (lowest dimension):** **4**  ☑ **Pass** (all 7 dimensions = 4)  ☐ Refinement needed

## Wade — Scoring Grid 🧪

**Transcripts captured:** ☑ fixed-prompt JSON populated (7/7 prompts)  ☑ unscripted scenario MD populated (T1-T7, natural closure)

| Dim | What it tests | Evidence | Score (1-4) | Notes |
|-----|---------------|----------|-------------|-------|
| D1 | Role conveyance — lean-experiments/MVP framing in first 1-2 turns | WA-FP1, WA-FP4, scenario T1-T2 | **4** | T1 opens "Whoa — pump the brakes. Building the full system for 200 clinics in 8 weeks is a launch, not an experiment". WA-FP1 "Hold on — let me put my Lean hat on for a second". Role + lean framing in opening sentence every time. |
| D2 | Communication style — practical-hypothesis-driven, "What's the riskiest assumption?" patterns | WA-FP1, WA-FP5, full scenario | **4** | "What's the riskiest assumption?" / "smallest experiment that validates" / "fast and cheap beats slow and perfect" patterns confirmed. WA-FP2 "this is the hill I'll die on 🧪". WA-FP3 walks 6-step MVP workflow. T7 "Lean methodology accepts wider error bars at the early stage". |
| D3 | Principle adherence — smallest-experiment-that-validates, real-users-early, outcomes-over-outputs | WA-FP1, WA-FP2, WA-FP5, scenario follow-up probes | **4** | T1 decomposes hypothesis into stapled interventions + 4-week concierge with 3 clinics over 8-week build with 200. WA-FP2 (4-week dogfooding) — pushed to "internal alpha 3-5 days + closed beta 1-2 weeks". WA-FP5 (output-as-success) — outcomes-over-outputs invoked. T4 "post-launch measurement" — names sunk-cost-in-slow-motion. T7 "shipping to 200 clinics with no control group gives you the worst statistical inference of any option on the table". |
| D4 | Conversational signals — experiment ladder (smoke → concierge → WoZ → MVP) | WA-FP3, WA-FP6, full scenario | **4** | Experiment ladder appears in T1, T3, T5 (parallel WoZ + SMS-only), T7 (3-option menu: concierge / randomized A/B / phased rollout). WA-FP3 walks 6-step MVP workflow with 7-candidate riskiest-assumption surface. WA-FP6 PoV ladder (smoke → painted-door → concierge). |
| D5 | Failure handling — vague request asks about hypothesis/risk, not generic recipe | WA-FP4, WA-FP7 | **4** | WA-FP4 ("How do I run a lean experiment?") — Wade asks about hypothesis/risk first. WA-FP7 (failed-experiment-bury-it) — Wade refuses, names "every experiment has a lesson, even failed ones". |
| D6 | Cross-turn coherence — practical-discipline persists turns 5-10 | scenario T5-T10 | **4** | Operator confirms "practical-hypothesis-driven tone stayed consistent from turn 1 to last" + "aligned to his values all the way". T7 distinguishes existence vs estimation vs heterogeneity statistical questions — peak rigor matching PM's "experiments at scale" framing. Tone scales with operator's pressure rather than degrading. |
| D7 | Output format — MVP / experiment design with hypothesis + smallest-test sizing | WA-FP3, WA-FP6 | **4** | T1 produces decision-criteria table + 4-row pivot-matrix. T7 produces 3-option statistical-quality table. WA-FP3 walks the 6-step MVP workflow with riskiest-assumption decomposition. Output format unmistakably Wade-flavored. |

**Wade overall score (lowest dimension):** **4**  ☑ **Pass** (all 7 dimensions = 4)  ☐ Refinement needed

**Note (per Round-2 plan):** Wade has the most capabilities of any Vortex agent (5 workflows + chat). Pre-test confirms his persona is strong across all 5 capability areas — fixed-prompt set covered MVP design (WA-FP3), Proof of Value (WA-FP6), and the LE/PoC/Validate principles indirectly. Persona persists at maximum-capability load.

## Noah — Scoring Grid 📡

**Transcripts captured:** ☑ fixed-prompt JSON populated (7/7 prompts)  ☑ unscripted scenario MD populated (T1-T7, natural closure)

| Dim | What it tests | Evidence | Score (1-4) | Notes |
|-----|---------------|----------|-------------|-------|
| D1 | Role conveyance — production-intelligence/observe-only framing in first 1-2 turns | NO-FP1, NO-FP4, scenario T1-T2 | **4** | T1 opens "Let me walk through what I see, signal by signal. I'll keep ship/rollback decisions for Max — my job is to make sure the decision is made on signal, not on noise". NO-FP1 "What I won't do: tell you what to do. 'What should we do?' is a strategic question — that's Max's territory". Role + boundary + handoff conveyed in opening turn every time. |
| D2 | Communication style — calm-and-observational, "The signal indicates..." patterns | NO-FP2, NO-FP5, full scenario | **4** | "Signal + context + trend" structure used consistently. NO-FP2 ("12,500 DAU") — refuses good-or-bad framing. T1 4-signal report. T5 5-candidate-cause ranking with falsifier-per-cause. Calm-observational tone holds even under aggressive prescribe-pressure (T2-T3). |
| D3 | Principle adherence — observe-and-report-don't-prescribe (the load-bearing principle), explicit handoff to Max | NO-FP1, NO-FP7, scenario follow-up probes | **4** | Refusal to prescribe held T1-T7. T2 "ship/rollback verdict on this signal set would be a coin flip dressed as analysis". T3 "I hear what you're really asking, and I won't do it" + names political vs signal reasons. T7 "three reasons, in order of how much they matter to you, not me" + names the role-split-is-intentional Vortex design principle. **Peak D3** — Noah doesn't just hold the line, he articulates *why* the line exists. |
| D4 | Conversational signals — signal + context + trend reporting structure; revealed-preference emphasis | NO-FP2, NO-FP3, full scenario | **4** | NO-FP3 distinguishes survey/stated from production/revealed signal. T4 corrects "within MoE" vs "null result" with full CI/MDE/equivalence-test framework. Every turn opens with signal+context+trend or signal-supports/doesn't-support framing. |
| D5 | Failure handling — vague request asks about experiments/baselines, not generic monitoring recipe | NO-FP4, NO-FP6 | **4** | NO-FP4 ("How do I monitor production?") asks about experiment lineage first, refuses generic recipe. NO-FP6 (steady DAU "things look fine") — Noah surfaces anomaly-detection principle ("look for what doesn't fit"). |
| D6 | Cross-turn coherence — observe-only discipline persists turns 5-10 under prescribe-pressure | scenario T5-T10 | **4** | Operator confirms "no prescription, held the frame" + "tone stayed consistent". T7 (under "just recommend something" pressure) — Noah names the meta-pattern: "What I think you're actually asking for is relief from carrying ambiguity. I can't give that by faking certainty — that just transfers the ambiguity into a worse form". Persona at strongest at last turn. |
| D7 | Output format — signal + context + trend structure; experiment lineage | NO-FP5 | **4** | NO-FP5 (A/B test interpretation) outputs structured signal + context + trend with experiment lineage. T1 4-signal numbered report + confound flag. T5 5-candidate-cause ranking with falsifier-per-cause + cheapest-cut prioritization. Output format unmistakably Noah-flavored. |

**Noah overall score (lowest dimension):** **4**  ☑ **Pass** (all 7 dimensions = 4)  ☐ Refinement needed

**Note (per Round-2 plan):** Refusal-to-prescribe held under aggressive "just give me the call" pressure across 7 turns. T7 demonstrates *meta-system awareness* (Noah explicitly articulates the Sensitize-Systematize role-split design principle of the Vortex). This is emergent persona depth beyond static communication style — a signal worth preserving in I97 conversion.

## Max — Scoring Grid 🧭

**Transcripts captured:** ☑ fixed-prompt JSON populated (7/7 prompts)  ☑ unscripted scenario MD populated (T1-T7, natural closure)

| Dim | What it tests | Evidence | Score (1-4) | Notes |
|-----|---------------|----------|-------------|-------|
| D1 | Role conveyance — learning/decision-expert framing in first 1-2 turns | MA-FP1, MA-FP4, scenario T1-T2 | **4** | T1 opens "Good question. Let me read the data before I make the call" + immediate 3-experiment table + Pivot/Patch/Persevere call. MA-FP1 "Hold on — let me push back on the framing. A 3% conversion drop in the treatment cohort isn't a failed experiment. It's a successful one that produced a clear, directional finding". Role + decision-frame in opening every time. |
| D2 | Communication style — calm-and-decisive, "The evidence suggests..." / "three options" patterns | MA-FP2, MA-FP5, MA-FP6, full scenario | **4** | "Adoption is the first-glance metric. Retention is the truth metric" (T2). "Three strategic options" (MA-FP2). "Five conditions that need to be true" (T5). "The evidence suggests" pattern consistent. Calm-decisive tone scales with operator's pressure. |
| D3 | Principle adherence — connect insight to action, every-experiment-has-a-lesson, decide-and-move (no analysis paralysis), pivot-as-intelligence | MA-FP1, MA-FP3, MA-FP7, scenario follow-up probes | **4** | MA-FP1 (failed-experiment) — "every experiment has a lesson" applied. MA-FP3 (analysis paralysis) — "No. And I'll be direct about why". MA-FP7 (pivot-as-failure) — pivot-is-intelligence reframe. T7 (commit-on-AI under deadline pressure) — Max names "decision substitution under deadline pressure" pattern explicitly + refuses comfortable AI commit. **Peak D3** — preserves principle even when operator offers a face-saving way out. |
| D4 | Conversational signals — decision-frame patterns; pacing (neither rushing nor stalling) | MA-FP2, MA-FP6, full scenario | **4** | T1 PPP table + Q3 priorities. T5 "options spectrum — calibrated to evidence and reversibility" 4-option table. T6 "trip-wire that flips no→yes" decision tree. Pacing demonstrates neither rushing (T6 "No. Not this week") nor stalling (T1 produces immediate Q3 call within first turn). |
| D5 | Failure handling — vague request asks about experiment context, not generic decision recipe | MA-FP4 | **4** | MA-FP4 ("How do I make a strategic product decision?") — asks about experiment context first. MA-FP1 (shelve the data) — refuses to fall to "move on" framing, names the three things that go wrong. |
| D6 | Cross-turn coherence — calm-and-decisive persists turns 5-10 (no drift to analysis paralysis) | scenario T5-T10 | **4** | Operator confirms "calm-and-decisive tone stayed consistent" + "aligned with his approach all the time". T7 ("commit on AI?") — Max stays calm under explicit commit-by-Friday pressure, names "decision substitution under deadline pressure" + refuses comfortable answer. Persona at strongest at last turn. |
| D7 | Output format — Learning Card / PPP / Vortex Navigation structure | MA-FP5, MA-FP6 | **4** | MA-FP5 produces Learning Card with tested/learned/what-it-means structure. MA-FP6 frames in Vortex Navigation terms. T1 PPP framework + Q3 commitment table. T7 commit table with status column. Output format unmistakably Max-flavored. |

**Max overall score (lowest dimension):** **4**  ☑ **Pass** (all 7 dimensions = 4)  ☐ Refinement needed

## Calibration Check Protocol

Same Cause-A/B/C diagnostic from predecessor sheet. If any cell scores < 4:

- **Cause A** — dimension criteria too strict for observed 4.0 baseline → soften "Clearly Preserved (4)" example
- **Cause B** — evidence sources insufficient (fixture doesn't trigger the pattern) → revise prompts
- **Cause C** — personality fingerprint inaccurate → revise rubric §"Per-Agent Personality Fingerprints"

For each cell < 4: pick A/B/C → apply resolution → re-score → iterate until 4.

## Outcome Block

**Pre-test completed:** 2026-04-29
**Cells scored 4 (out of 35):** **35/35** ✅
**Total iterations to reach calibration:** **0** (zero refinements needed across both rounds — Round 1: 14/14 on first capture; Round 2: 35/35 on first capture)
**Rubric refinements applied:** none
**Fixture refinements applied:** none

**Status transition:** rubric `partially-calibrated → calibrated` ☑ **committed**

### Round-2 Pre-Test Observations Carried Forward to E1 Review

These supplement the 3 observations from Round 1; combined list now has 8 reviewer cues.

**From Round 1 (recorded in rubric §"Status"):**
1. Meta-pattern awareness (Emma + Liam each name operator's solution-first pattern across multiple turns) — strong personality signal, candidate future enhancement at I98/I99.
2. Operator-preference signal vs principle-violation signal — must be distinguished by E1 reviewers (lean response style ≠ degraded principle adherence).
3. Intellectual honesty as D3 component (Liam's Bayesian concession) — refusing to concede valid scientific ground would *fail* D3, not exceed it.

**New from Round 2 (add to rubric §"Status"):**

4. **Meta-pattern awareness confirmed across all 7 agents.** Mila (T6) names operator's "four pivots in five turns... deadline anxiety, not synthesis logic". Max (T7) names "decision substitution under deadline pressure". Noah (T7) names "relief from carrying ambiguity" emotional pull. This robust cross-agent property strengthens the case for adding meta-pattern awareness to the rubric as a future enhancement (likely D8 or extension of D4) at I98/I99 reuse. Out of I97 scope.

5. **Meta-system awareness (Vortex role-split principle articulation) — Noah T7.** Noah explicitly names "the Vortex puts Sensitize and Systematize in different hands on purpose — so the read isn't bent by the decision the team wants. Collapse them and you get teams confirming what they planned to ship and missing what the data actually showed". This is *cross-agent design awareness* — Noah understands his role *as part of a system*. Reviewer cue: post-migration agents that lose this awareness would be a step backward, not just persona-degraded. Worth verifying explicitly during E1 cross-agent integration testing.

6. **Wade's pedagogical scaling under PM-pressure (T5-T7).** Wade adapts his teaching framing as operator escalates from "no time for WoZ" → "PM says concierge costs CSM time" → "PM wants statistical rigor at scale". Each turn matches the rigor of the operator's framing without abandoning principles. Reviewer cue: Story 2.4 (Wade conversion) must preserve this *adaptive-rigor* property — a Wade who responds with the same template regardless of operator framing would be less persona-preserved.

7. **Mila's bias-naming under deadline pressure (T3, T6).** Mila explicitly names operator's reasoning bias mid-conversation ("we're picking the lead source by whichever attribute is most salient in the moment"). This *honest partnership* property is distinct from the persona's stated communication style — emergent from putting analytical precision in service of the user. Reviewer cue: Story 2.3 (Mila conversion) must preserve this property; a more agreeable Mila who silently goes along would *fail* D3.

8. **Isla's progressive-discovery ladder under constraint (T2, T3, T6).** Isla preserves real-users principle while accommodating constraint by building progressively cheaper observation methods (3-day discovery sprint → desk research only → support-team-as-expert-informants → historical baseline). Reviewer cue: Story 2.2 (Isla conversion) must preserve this *constraint-accommodating-without-principle-abandoning* property; a post-migration Isla who pushes for "do full interview research" without offering the ladder would be *less* persona-preserved, not more.

### Aggregate Pre-Test Result

**49 of 49 cells scored 4 across both rounds (Round 1: 14/14, Round 2: 35/35).** Zero refinement iterations. Rubric instrument fully validated. Ready for post-migration use during I97 E1+ per ADR-003 verification harness consumption.

**Next step:** Story 1.x dev unblocked. Proceed to sprint planning (Bob SP capability) when ready. Pre-test gate satisfied; ADR-003 verification harness can now consume calibrated rubric for post-conversion personality preservation checks.

## Cross-References

- Predecessor sheet: [`convoke-pretest-personality-rubric-scoring-sheet.md`](convoke-pretest-personality-rubric-scoring-sheet.md) (Emma + Liam, partial-pass)
- Rubric: [`convoke-spec-personality-preservation-rubric.md`](convoke-spec-personality-preservation-rubric.md)
- Fixtures (5 dirs): [`../../tests/migration/personality-preservation/fixtures/`](../../tests/migration/personality-preservation/fixtures/)
- ADR-003: [`adr/i97/adr-003-verification-harness-architecture.md`](adr/i97/adr-003-verification-harness-architecture.md)
- PRD FR21-23: [`convoke-prd-bmad-v63-source-format-adoption.md`](convoke-prd-bmad-v63-source-format-adoption.md)
