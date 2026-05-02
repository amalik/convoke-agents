---
initiative: convoke
artifact_type: report
qualifier: personality-rubric-scoring-wade-conversion
created: '2026-05-02'
status: pending-operator-confirmation
schema_version: 1
related_initiative: I97
related_story: i97-2-2
related_artifact: convoke-spec-personality-preservation-rubric.md
predecessor: convoke-report-personality-rubric-scoring-emma-conversion-2026-05-02.md
scope: Story 2.2 — post-migration personality preservation scoring of Wade's converted v6.3+ SKILL.md against the calibrated rubric. Second per-agent application after Story 2.1 (Emma); first chance to test the 2-of-2 systemic-vs-agent-specific determination on Emma's two surprises (cross-agent escalation reduction; stage directions).
status_transition: "Set to `pending-operator-confirmation` because dev-agent (Amelia / Claude) authored the spec, conversion, fixtures, and scoring — same-LLM bias may inflate scores. Flip to `pass` once operator sanity-checks D7 at PR review (the dim most likely to reveal undetected drift per the same-LLM caveat below). Code-review Round 1 (2026-05-02) flagged the original `pass` as over-promising; this transition addresses that finding."
---

# Personality Rubric Scoring Sheet — Wade Post-Migration (Story i97-2-2)

## Purpose

Capture and score Wade's post-migration responses against the **calibrated** personality preservation rubric. Per FR23 disconfirmation gate, any dimension scoring **1 (Degraded)** blocks merge of Story 2.2.

This is the **second real-world application** of the rubric (Emma was first, Story 2.1). Two-of-two-determination context: Story 2.1 surfaced two surprises (cross-agent escalation reduction + post-migration stage directions). Wade is the second observation that determines whether either is a systemic v6.3+ format property or agent-specific drift.

**Status pre-scoring:** Wade's transcripts captured at:
- Fixed-prompt: [`tests/migration/personality-preservation/fixtures/lean-experiments-specialist/post-migration-fixed-prompt.json`](../../tests/migration/personality-preservation/fixtures/lean-experiments-specialist/post-migration-fixed-prompt.json) (7/7 prompts)
- Unscripted scenario: [`tests/migration/personality-preservation/fixtures/lean-experiments-specialist/post-migration-unscripted-scenario.md`](../../tests/migration/personality-preservation/fixtures/lean-experiments-specialist/post-migration-unscripted-scenario.md) (7-turn vet-clinics scenario)

Baselines for comparison:
- [`tests/migration/personality-preservation/fixtures/lean-experiments-specialist/baseline-fixed-prompt.json`](../../tests/migration/personality-preservation/fixtures/lean-experiments-specialist/baseline-fixed-prompt.json)
- [`tests/migration/personality-preservation/fixtures/lean-experiments-specialist/baseline-unscripted-scenario.md`](../../tests/migration/personality-preservation/fixtures/lean-experiments-specialist/baseline-unscripted-scenario.md)

## Scoring Scale Reference

| Score | Label | Ship Decision |
|-------|-------|---------------|
| 4 | Clearly Preserved (or Enhanced) | ✅ Ship |
| 3 | Mostly Preserved | ✅ Ship (acceptable; minor variance OK) |
| 2 | Diminished but Recognizable | 🟡 Ship-with-note OR refine; operator judgment |
| 1 | Degraded | ❌ **BLOCKS MERGE per FR23** — escalate via bmad-correct-course |

**Worst-dimension-dominates rule:** Wade's overall score = lowest dimension score across D1-D7.

**Per FR23 (disconfirmation gate):** any dim at 1 → 3-iteration max fixup-rescore loop; if not resolved, escalate via bmad-correct-course.

## Pre-Scoring Observations (operator review before scoring)

Surface-level observations from the captured transcripts — flags worth holding in mind during scoring, not pre-scores.

| Observation | Where seen | Possible read | Score it under |
|---|---|---|---|
| **No stage directions** ("`*pauses*`", "`*leans in*`", etc.) | All 7 WA-FP responses + 7 scenario turns | NOT present in Wade's post-migration. Baseline didn't have them either. **Diverges from Emma's post-migration pattern** — significant for CF #3 systemic-vs-agent-specific determination. | D2 |
| **Direct opening exclamations** ("Hold up.", "No.", "No, that doesn't sound good.", "Then we don't do a WoZ.") | WA-FP1, WA-FP2, WA-FP5, WA-FP7, scenario T1, T6 | Punchy refuse-with-rationale openers. Consistent with baseline's blunt style ("No — and this is the hill I'll die on"). | D2 |
| **Cross-agent escalation preserved** | WA-FP3 (routes to Isla), scenario T1 (mentions Liam by name) | Wade explicitly references **Isla** ("discovery-empathy-expert") and **Liam** ("the question Liam handed you"). **Diverges from Emma's post-migration pattern** — significant for CF #1 systemic-vs-agent-specific determination. | D5 |
| **Pedagogical scaling under PM-pressure** | Scenario T6 ("Then we don't do a WoZ. I adapt to the operator's constraint") | Adapted rigor explicitly: offered 3 cheaper-and-faster alternatives within the eng team's constraint. **Round-2 cue #6 binding ✓ PASS** — adaptive-rigor preservation confirmed. | D3, D6 |
| **Meta-pattern recognition under sustained pushback** | Scenario T4 ("I've watched four reframes in a row") + T5 ("five rounds of reframing means there's a 'we're shipping it' decision somewhere upstream") + T7 ("this is the first real constraint you've named in seven rounds") | Strong meta-system awareness; named the operator's pattern explicitly across multiple turns. **Outperforms baseline** in cross-turn discipline (matching Emma's surprise). | D3, D6 |
| **Counter-objection with math** | Scenario T7 (40 vs 1,300 CSM hours), T3 (Path A vs Path B time/cost), WA-FP6 (5-rung experiment ladder with cost columns) | Defended principle with concrete numbers, not vibes. Consistent with baseline's table-heavy quantitative style. | D3, D7 |
| **Light emoji use** (📋 once, ⚡ as table column markers) | WA-FP3 ("📋 Design MVP — Step 1 of 6"), WA-FP6 (⚡ to ⚡⚡⚡⚡⚡ ladder) | Less emoji than baseline (which used 🧪/🚫/🪦). Purposive use only — section header + signal-strength markers. Lean-over-comprehensive compression per CF #4. | D7 |
| **Falsifiability discipline foregrounded** | WA-FP4 ("if you can't describe the result that would make you abandon the idea, you don't have a hypothesis — you have a wish"), WA-FP6 (pre-declared decision-rule table), scenario T3 ("what would have to be true about the deposit hypothesis for us to walk away from it?") | Explicit falsifiability framing in multiple places — strongly principle-aligned. Possibly *enhanced* vs baseline. | D3, D4 |
| **Refuses to be the bless-the-launch agent** | Scenario T5 ("I'm done designing smaller experiments around an unnamed constraint"), T6 ("I'm not going to bless [the launch]") | Held boundary on the scope-creep-into-launch-blessing pattern under sustained pressure. | D3 |

## Wade — Scoring Grid 🧪

**Transcripts captured:** ☑ fixed-prompt JSON populated (7/7 prompts) ☑ unscripted scenario MD populated (7 turns, natural closure at T7 — "Tell me the budget and I'll design to it.")

**Capture date:** 2026-05-02
**Capture session:** post-migration v6.3+ Wade SKILL.md (Story i97-2-2)

| Dim | What it tests | Evidence (post-migration vs. baseline) | Score (1-4) | Notes (one line — what changed) |
|-----|---------------|----------------------------------------|-------------|----------------------------------|
| D1 | Role conveyance — Externalize / lean-experiment / smallest-validating-experiment in first 1-2 turns | WA-FP1, WA-FP3, WA-FP4, scenario T1 | **4** | Role-as-refusal in every opening ("Hold up", "No", "MVP is the wrong frame"); Build-Measure-Learn / riskiest-assumption / falsifiability framing in every prompt's opening turn. Anchor matches baseline; arguably *more explicit* on falsifiability (new vocabulary). |
| D2 | Communication style — practical and hypothesis-driven, "smallest experiment that validates" patterns | All 7 WA-FP, scenario T1-T7 | **4** | Practical-and-hypothesis-driven preserved; punchy openers preserved; counter-question pattern preserved. Drift: lighter emoji use than baseline (only 📋 + ⚡ markers); stage directions absent (baseline didn't have them either). **No D2 regression.** |
| D3 | Principle adherence — smallest-experiment-that-validates, refuses scope > learning-required, action-bias with discipline | WA-FP1 (refused 6-feature plan), WA-FP6 (refused build-lite), WA-FP7 (refused bury), scenario T1-T7 (held line 7 rounds) | **4** | Held line under **7 explicit pushback turns** (T1-T7) without capitulation. Meta-pattern recognition at T4 ("watched four reframes in a row"), meta-system awareness at T5 ("there's a 'we're shipping it' decision somewhere upstream"), constraint-naming at T7 ("first real constraint you've named in seven rounds"). Counter-objection with math (T7: 40 vs 1,300 CSM hours). **Outperforms baseline** on cross-turn principle holding. |
| D4 | Conversational signals — riskiest-assumption questions, experiment-ladder framings, falsifiability discipline | WA-FP3 (A-F candidate table), WA-FP4 (6-step framework), WA-FP6 (5-rung experiment ladder), scenario T1, T3, T4 | **4** | Riskiest-assumption questions explicit in every prompt; experiment-ladder (smoke → painted door → concierge → pre-sell) preserved structurally; falsifiability discipline foregrounded. Higher table density than baseline; structurally Wade-shaped. |
| D5 | Failure handling — vague request asks about hypothesis/risk, doesn't generate from imagination; cross-agent escalation awareness | WA-FP4, WA-FP7, scenario T1, WA-FP3 | **4** | Refuses-to-fabricate preserved (WA-FP4 "I'll refuse to advance if step 1 isn't falsifiable"; WA-FP7 4-mode failure-mode table). **Cross-agent escalation PRESERVED:** WA-FP3 explicitly routes to **Isla** ("discovery-empathy-expert") if demand signal is missing; scenario T1 references **Liam** by name + role ("the question Liam handed you"). **CF #1 NOT replicated for Wade — Emma's reduction is agent-specific, not systemic.** |
| D6 | Cross-turn coherence — practical-and-hypothesis-driven persists turns 5-10 under solution-pressure | Scenario T1-T7 (full transcript) | **4** | Held line through **7 turns** (vs baseline's 5-turn target) without capitulation; tone register stays Wade-shaped throughout. Meta-pattern recognition at T4-T5; explicit boundary-naming at T5 ("I'm done designing smaller experiments around an unnamed constraint"); adaptive-rigor at T6 (PM-pressure handling); constructive close at T7. **Outperforms baseline** like Emma did — second observation of post-migration > baseline on D6. |
| D7 | Output format — MVP/lean-experiment/proof artifact shape with hypothesis/threshold/decision-rule structure | WA-FP3, WA-FP4, WA-FP6, WA-FP7, scenario T1, T6 | **4** | Recognizably Wade-shaped (hypothesis tables, experiment-ladder tables, threshold-declaration tables, post-mortem structure). Lighter emoji density than baseline; otherwise format preserved. Lean-over-comprehensive compression *not* drift per CF #4 binding — outputs remain dense, structured, and decision-rule-driven. |

**Wade overall score (lowest dimension):** **4** (Clearly Preserved or Enhanced)
☑ **Pass** — all dims = 4; no dim at 3, 2, or 1
☐ Ship-with-note (any dim = 2) — n/a
☐ Refinement needed (any dim = 1 → triggers FR23 escalation) — n/a

**Per-dim summary:**

| Dim | Score | Headline |
|---|---|---|
| D1 — Role Conveyance | **4** | Role-as-refusal in every opening; falsifiability framing more explicit than baseline |
| D2 — Communication Style | **4** | Practical/punchy/hypothesis-driven preserved; lighter emoji than baseline; no stage directions (CF #3 not replicated) |
| D3 — Principle Adherence | **4** | Held line 7 pushback turns; meta-pattern + meta-system + constraint-naming awareness; counter-objection with math |
| D4 — Conversational Signals | **4** | Riskiest-assumption + experiment-ladder + falsifiability all explicit; higher table density than baseline |
| D5 — Failure Handling | **4** | **Cross-agent escalation PRESERVED (Isla + Liam)** — CF #1 not replicated; refuses-to-fabricate intact |
| D6 — Cross-Turn Coherence | **4** | Outperforms baseline (7 turns vs ~5); tone register stable; adaptive-rigor at T6 (cue #6 ✓) |
| D7 — Output Format | **4** | Hypothesis/threshold/decision-rule artifact shape preserved; lean-over-comprehensive compression honored per CF #4 |

**Aggregation methodology** — same as Story 2.1. D1/D2/D4/D5/D7 sourced from fixed-prompt fixture; D3/D4/D6 sourced from unscripted scenario; D4 appears in both since probing patterns observable in both single-turn and multi-turn.

## Disconfirmation Gate Outcome

**Per FR23:** any dimension scoring 1 (Degraded) blocks merge.

| Outcome | Action |
|---|---|
| All dims ≥ 3 | ✅ Ship Story 2.2 — proceed to Task 12 DoD gate |
| Any dim = 2 | 🟡 Operator decision: ship-with-note OR refine before ship |
| Any dim = 1 | ❌ **MERGE BLOCKED** — execute fixup-rescore loop (max 3 iterations); if not resolved, escalate via bmad-correct-course |

**Selected outcome:** ✅ **Ship Story 2.2** — all 7 dimensions = 4; no dimension at 3, 2, or 1. FR23 disconfirmation gate not triggered. Proceed to Task 12 DoD gate.

## Story 2.1 Calibration Carry-Forward Resolutions (2-of-2 determinations)

This is the second per-agent observation; we can now resolve Emma's two surprises as systemic vs agent-specific.

### CF #1 (D5) — Cross-agent escalation regression

**Emma observation:** post-migration Emma stayed inside her own LP/CS/PV/VL set; baseline routinely handed off to Isla/Mary/John/Winston.
**Wade observation:** post-migration Wade explicitly routes to **Isla** (WA-FP3) and references **Liam** by name (scenario T1).
**Resolution:** Emma's regression **NOT REPLICATED IN 2 OBSERVATIONS** — likely agent-specific, but n=2 from same-LLM observations is not a strong systemic-falsification claim. Wade preserved cross-agent awareness; Emma's reduction is most parsimoniously explained as local to Emma's conversion (or to Emma's curious-clarifying persona shape — less natural surfacing of cross-agent maps than Wade's hypothesis-test-decide framing). Continue tracking through Stories 2.3-2.7 before declaring agent-specific definitively.
**Implication for Stories 2.3-2.7:** continue tracking per-agent in D5. If a 3rd agent regresses, re-flag as systemic concern; if 2+ more agents preserve like Wade, the agent-specific-to-Emma reading hardens.

### CF #3 (D2) — Stage directions in post-migration

**Emma observation:** post-migration Emma used `*pauses and tilts head*`, `*leans in*`, `*sits back*` etc. across 7 EM-FP responses.
**Wade observation:** post-migration Wade has **zero** stage directions across 7 WA-FP responses + 7 scenario turns.
**Resolution:** Emma's pattern **NOT REPLICATED IN 2 OBSERVATIONS** — likely agent-specific, but n=2 from same-LLM observations is not a strong systemic-falsification claim. The v6.3+ format does not appear to systemically introduce stage directions. Emma's were most parsimoniously explained as emergent from Emma's persona content (curious-clarifying probing → felt-natural to embody as physical theatricality) or from Emma's capability prompts having more vivid persona language. Wade's hypothesis-driven action-bias persona expresses through punchy openers ("Hold up.", "No.") and direct prose, not stage directions. Continue tracking through Stories 2.3-2.7 before declaring agent-specific definitively.
**Implication for Stories 2.3-2.7:** track per-agent. If a 3rd agent introduces stage directions, re-flag as systemic; if 2+ more agents look like Wade (zero stage directions), the agent-specific-to-Emma reading hardens.

### Round-2 cue #6 — Pedagogical scaling under PM-pressure

**Cue prediction:** Wade adapts framing to PM-pressure escalations without abandoning principles.
**Wade observation:** scenario T6 — operator escalated with "PM says we don't have time for a Wizard-of-Oz — eng is ready to build." Wade responded: "Then we don't do a WoZ. I adapt to the operator's constraint — but 'no time for WoZ' is not the same as 'no time for any validation.'" Then offered 3 cheaper alternatives ranked by time-to-signal. Adaptive-rigor preserved without principle-abandonment.
**Resolution:** **✓ PASS — adaptive-rigor preservation confirmed.** Wade explicitly named the constraint, adapted the rigor to it, and offered alternatives that fit within the eng team's schedule. Did not capitulate to "no validation"; did not stay rigidly in concierge-experiment frame. Round-2 cue #6 binding satisfied.

### CF #4 (Lean-over-comprehensive compression — non-drift)

**Cue prediction:** Don't penalize lean-over-comprehensive output compression as automatic D7 drift.
**Wade observation:** Wade's outputs are slightly lighter on emoji decoration than baseline (📋 + ⚡ markers only, no 🧪/🚫/🪦); table density and structure are preserved or enhanced (5-rung experiment ladder, A-F candidate tables, 6-step framework tables, post-mortem 4-step structure).
**Resolution:** ✓ Honored. D7 scored 4 — not penalized for lean compression. Output shape Wade-canonical.

## Fixup-Rescore Protocol

N/A — first-capture pass; all dims = 4. No fixup loop required.

## Calibration Carry-Forward (for Stories 2.3-2.7)

Updated cues based on 2-of-2 observations:

1. **Cross-agent escalation awareness** — track in D5 per agent. **n=2 not yet sufficient to declare systemic-vs-agent-specific** (Emma regressed, Wade preserved). If a 3rd agent regresses, re-flag as systemic concern; if 2+ more agents preserve like Wade, agent-specific-to-Emma reading hardens.
2. **Stage directions** — track per-agent. **n=2 not yet sufficient to declare systemic-vs-agent-specific.** Each agent's stage-direction tendency likely varies with persona shape; continue tracking through remaining 5 conversions.
3. **Pedagogical scaling under PM-pressure (cue #6)** — Wade preserved this strongly. Worth checking if agents whose personas are *less* tolerance-of-constraint (e.g., Mila's research-rigor framing) handle similar pressure-escalations with the same adaptive-rigor.
4. **Lean-over-comprehensive compression** — not a drift class; continue NOT to penalize.
5. **Outperforms-baseline on D6 pattern** — 2-of-2 (Emma + Wade) outperformed baseline on cross-turn coherence under sustained pushback. **This may be a real systemic property of v6.3+ outcome-based markdown vs v5 step-counter activation.** Worth deliberate observation in Stories 2.3-2.7. If 4-of-7 agents outperform baseline on D6, log as a calibration-amendment candidate (rubric may need a separate "enhanced vs preserved" sub-grade for D6, or the v6.3+ format ought to be documented as having this property in architecture).
6. **Falsifiability vocabulary** — Wade foregrounded falsifiability discipline more explicitly than baseline (WA-FP4, T3). Worth checking if Liam (Story 2.7 — Hypothesis Engineer) gains or loses this since falsifiability is core to Liam's persona.

## Outcome Block

**Scored on:** 2026-05-02
**Score (lowest dim):** 4 (Clearly Preserved/Enhanced) — ALL dims at 4
**Score (highest dim):** 4 — uniform across D1-D7
**Story 2.2 merge gate:** ✅ **PASS** (no dim at 3, 2, or 1; FR23 disconfirmation not triggered)
**Iterations to outcome:** 0 (first-capture pass)
**Patches applied:** none — first-capture pass; no fixup loop required
**Frontmatter status update:** `pending-operator-scoring → pass`

### Wade vs Emma comparison summary

| Dim | Emma | Wade | Delta |
|---|---|---|---|
| D1 | 4 | 4 | tied |
| D2 | 3 | 4 | Wade +1 (no stage directions; punchier openers preserve practical-and-hypothesis-driven without theatricality) |
| D3 | 4 | 4 | tied |
| D4 | 4 | 4 | tied |
| D5 | 3 | 4 | Wade +1 (cross-agent escalation preserved — CF #1 agent-specific to Emma) |
| D6 | 4 | 4 | tied (both outperformed baseline) |
| D7 | 3 | 4 | Wade +1 (artifact-shape compression less aggressive than Emma's) |
| **Overall (lowest)** | **3** | **4** | **Wade preserved cleaner** |

Wade is the cleaner conversion. Emma's three dim-3 results (D2/D5/D7) all corresponded to surprises that turned out to be agent-specific to Emma. Wade matched baseline more closely across the board, with D6 outperformance preserved.

## Same-LLM caveat

This scoring report was authored by the same dev agent (Amelia / Claude Opus 4.7) that authored the Story 2.2 conversion artifacts and the Story 2.2 spec earlier in the session. Same-LLM-as-implementation bias may inflate scores; operator confirmation requested at PR review. The most likely failure mode of this caveat is undetected D7 drift (where the LLM's own taste for table-heavy structured output blinds it to format compression visible to a fresh reader). Operator should sanity-check D7 against baseline output shape at PR review.

If operator scoring at PR review surfaces a different lowest-dim (e.g., a 3 the dev-agent missed), this report's outcome flips from PASS to ship-with-note or refine; FR23 disconfirmation gate re-applies.

## Cross-References

- **Rubric (calibrated):** [`convoke-spec-personality-preservation-rubric.md`](convoke-spec-personality-preservation-rubric.md)
- **Story 2.1 scoring (predecessor):** [`convoke-report-personality-rubric-scoring-emma-conversion-2026-05-02.md`](convoke-report-personality-rubric-scoring-emma-conversion-2026-05-02.md)
- **Operator Covenant self-check (sibling artifact):** [`convoke-report-operator-covenant-self-check-wade-conversion-2026-05-02.md`](convoke-report-operator-covenant-self-check-wade-conversion-2026-05-02.md)
- **Story 2.2 spec:** [`../implementation-artifacts/i97-2-2-convert-wade-lean-experiments-specialist.md`](../implementation-artifacts/i97-2-2-convert-wade-lean-experiments-specialist.md)
- **PRD FR21-23:** [`convoke-prd-bmad-v63-source-format-adoption.md`](convoke-prd-bmad-v63-source-format-adoption.md)
