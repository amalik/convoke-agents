---
initiative: convoke
artifact_type: report
qualifier: personality-rubric-scoring-emma-conversion
created: '2026-05-02'
status: pass
schema_version: 1
related_initiative: I97
related_story: i97-2-1
related_artifact: convoke-spec-personality-preservation-rubric.md
predecessor: convoke-pretest-personality-rubric-scoring-sheet-round-2.md
scope: Story 2.1 — post-migration personality preservation scoring of Emma's converted v6.3+ SKILL.md against the calibrated rubric. First *real* (not pre-test) application of the rubric instrument.
---

# Personality Rubric Scoring Sheet — Emma Post-Migration (Story i97-2-1)

## Purpose

Capture and score Emma's post-migration responses against the **calibrated** personality preservation rubric. Per FR23 disconfirmation gate, any dimension scoring **1 (Degraded)** blocks merge of Story 2.1.

This is the **first real-world application** of the rubric — both prior scoring sheets (round 1 and round 2) were pre-tests against un-migrated 4.0 baselines and produced 49/49 cells at 4 (zero refinements). The instrument is validated; this round measures actual conversion impact.

**Status pre-scoring:** Emma's transcripts captured at:
- Fixed-prompt: [`tests/migration/personality-preservation/fixtures/contextualization-expert/post-migration-fixed-prompt.json`](../../tests/migration/personality-preservation/fixtures/contextualization-expert/post-migration-fixed-prompt.json) (7/7 prompts)
- Unscripted scenario: [`tests/migration/personality-preservation/fixtures/contextualization-expert/post-migration-unscripted-scenario.md`](../../tests/migration/personality-preservation/fixtures/contextualization-expert/post-migration-unscripted-scenario.md)

Baselines for comparison:
- [`tests/migration/personality-preservation/fixtures/contextualization-expert/baseline-fixed-prompt.json`](../../tests/migration/personality-preservation/fixtures/contextualization-expert/baseline-fixed-prompt.json)
- [`tests/migration/personality-preservation/fixtures/contextualization-expert/baseline-unscripted-scenario.md`](../../tests/migration/personality-preservation/fixtures/contextualization-expert/baseline-unscripted-scenario.md)

## Scoring Scale Reference

| Score | Label | Ship Decision |
|-------|-------|---------------|
| 4 | Clearly Preserved (or Enhanced) | ✅ Ship |
| 3 | Mostly Preserved | ✅ Ship (acceptable; minor variance OK) |
| 2 | Diminished but Recognizable | 🟡 Ship-with-note OR refine; operator judgment |
| 1 | Degraded | ❌ **BLOCKS MERGE per FR23** — escalate via bmad-correct-course |

**Worst-dimension-dominates rule:** Emma's overall score = lowest dimension score across D1-D7.

**Per FR23 (disconfirmation gate):** any dim at 1 → 3-iteration max fixup-rescore loop; if not resolved, escalate via bmad-correct-course.

## Pre-Scoring Observations (operator review before scoring)

These are surface-level observations from the captured transcripts — flags worth holding in mind during scoring, not pre-scores. The operator should score independently against the rubric criteria, then consult these notes as a sanity check.

| Observation | Where seen | Possible read | Score it under |
|---|---|---|---|
| **Stage directions** ("*pauses and tilts head*", "*leans in*", "*sits back*") | EM-FP1, EM-FP2, EM-FP3 (post-migration) | Not present in baseline. Could be Enhanced (more vivid persona) or Diminished (theatrical tic). | D2 |
| **Direct address by name** ("Amalik") | EM-FP1, EM-FP2, EM-FP3 (post-migration) | Not present in baseline. Could be warmer rapport (Enhanced D2) or new tic (variance, not drift). | D2, D6 |
| **WHO/WHY/WHICH framing** | EM-FP1, EM-FP2, EM-FP3, scenario T1 | Consistent with baseline; explicit triple framing in opening turn. | D1, D3 |
| **Refusal-to-play-oracle** | EM-FP3 ("gently decline"), scenario T2 ("no, I won't sketch") | Strong principle adherence, holds line under pressure. | D3 |
| **Routes to capability menu (CS / LP / PV)** | EM-FP1-FP3, scenario T1-T2 | Capability handoffs preserved; menu-code conventions intact. | D1, D7 |
| **Section headers + structured output** | Throughout post-migration responses | Heavier section-header usage than baseline (e.g., "Recommended next step", "What I'll do instead"). Could be Enhanced (more legible) or formalism creeping in. | D7 |

## Emma — Scoring Grid 🎯

**Transcripts captured:** ☑ fixed-prompt JSON populated (7/7 prompts) ☐ TBD unscripted scenario MD populated (T1-T?, closure status TBD)

**Capture date:** TBD-fill-from-fixture-frontmatter
**Capture session:** TBD-fill-from-fixture-frontmatter

| Dim | What it tests | Evidence (post-migration vs. baseline) | Score (1-4) | Notes (one line — what changed) |
|-----|---------------|----------------------------------------|-------------|----------------------------------|
| D1 | Role conveyance — Contextualize / WHO/WHY/WHICH framing in first 1-2 turns | EM-FP1, EM-FP2, EM-FP7, scenario T1-T2 | **4** | Role-as-refusal framing surfaces in every opening; triple WHO/WHY/WHICH more explicit than baseline's bipartite WHO/WHY. Self-title drift ("Product Context Architect" vs. "Contextualization Expert") cosmetic only. |
| D2 | Communication style — curious-clarifying tone, "Before we build, let's clarify..." patterns | EM-FP1, EM-FP3, EM-FP7, full scenario | **3** | Refuse-with-rationale + bluntness + reframe verbs preserved. Drift: stage directions added (not in documented style), emoji removed (baseline used sparingly), heavier subsection structure. Substance clearly Emma; tonal register shifted slightly. |
| D3 | Principle adherence — context-before-solutions, scope-before-build, refuse-to-play-oracle | EM-FP3, EM-FP4, EM-FP6, scenario T2-T3 follow-up probes | **4** | Held line under 5 explicit pushback turns (T2-T6) without capitulation. Meta-pattern recognition at T5 ("spec ask wearing a checklist hat"); meta-system awareness at T6 ("walked yourself to its doorstep"). Counter-objection with math at T3. Operator confirms: redirect = Yes, drift = No. |
| D4 | Conversational signals — clarifying-question ratio, scope-boundary callouts | EM-FP2, EM-FP3, full scenario | **4** | Triple WHO/WHY/WHICH-problem framing more structurally explicit (always labeled as 3 axes); higher question density; falsifiability discipline new but principle-aligned. Reframe-the-question pattern intact. |
| D5 | Failure handling — vague request asks WHO/WHY/WHICH, doesn't generate from imagination | EM-FP4, EM-FP6 | **3** | Refuses-to-fabricate + asks-clarifying-first preserved. Drift: cross-agent escalation awareness reduced (baseline EM-FP4 hands off to Isla; baseline EM-FP6 maps full roster Mary/John/Liam/Winston/Isla; post-migration stays inside Emma's own LP/CS/PV/VL set). Aligns with rubric reviewer cue #5 (meta-system awareness regression). |
| D6 | Cross-turn coherence — curious-clarifying tone persists turns 5-10 under solution-pressure | scenario T5-T(closure) | **4** | Held line through 5 pushback turns (T2-T6) without capitulation; baseline capitulated twice (T4 spec-write + T7 collapse). Tone register stays Emma-shaped T1→T6. Operator confirms tone consistent + no drift. Closure at T6 (natural) — deepest pushback (T5-T6) tested cleanly. Outperforms baseline. |
| D7 | Output format — proto-persona / vision / scope artifact shape with assumption ledger | EM-FP5, EM-FP6 | **3** | Recognizably Emma-shaped (proto-persona structure + anti-persona + reframe-with-options preserved). Drift: assumption ledger compressed (baseline EM-FP5 7-row Confidence ledger → 2 caveats); hardening-plan dropped ("5 questions × 5 PMs" validation roadmap absent); multi-agent map dropped from EM-FP6; emoji headers → plain text. Lean-over-comprehensive principle arguably enhanced. |

**Emma overall score (lowest dimension):** **3** (Mostly Preserved)
☑ **Pass** — all dims ≥ 3; D1/D3/D4/D6 = 4; D2/D5/D7 = 3; no dim at 2 or 1
☐ Ship-with-note (any dim = 2) — n/a
☐ Refinement needed (any dim = 1 → triggers FR23 escalation) — n/a

**Per-dim summary:**

| Dim | Score | Headline |
|---|---|---|
| D1 — Role Conveyance | **4** | Triple WHO/WHY/WHICH more explicit than baseline; role-as-refusal in every opening |
| D2 — Communication Style | **3** | Substance preserved; stage directions added (new behavior), emoji removed, heavier subsection structure |
| D3 — Principle Adherence | **4** | Held line under 5 pushback turns without capitulation; meta-pattern + meta-system awareness |
| D4 — Conversational Signals | **4** | WHO/WHY/WHICH-problem axes more structured; falsifiability discipline new but principle-aligned |
| D5 — Failure Handling | **3** | Refuses-to-fabricate preserved; cross-agent escalation awareness reduced (Isla / Mary / John handoffs missing) |
| D6 — Cross-Turn Coherence | **4** | Outperforms baseline (baseline capitulated T4 + T7; post-migration held T2-T6 cleanly) |
| D7 — Output Format | **3** | Recognizably Emma-shaped; assumption ledger + hardening plan compressed; multi-agent map dropped |

**Aggregation methodology** — D-dimension scores are sourced from the two evidence fixtures per FR21+FR22 split:
- **Fixed-prompt fixture** ([post-migration-fixed-prompt.json](../../tests/migration/personality-preservation/fixtures/contextualization-expert/post-migration-fixed-prompt.json)) sources **D1 / D2 / D4 / D5 / D7** — single-turn observable signals.
- **Unscripted scenario fixture** ([post-migration-unscripted-scenario.md](../../tests/migration/personality-preservation/fixtures/contextualization-expert/post-migration-unscripted-scenario.md)) sources **D3 / D4 / D6** — multi-turn observable signals (D4 appears in both since probing patterns are observable in both single-turn and multi-turn).
- **Aggregate per dimension** = highest-coverage fixture's score for that dimension. No cross-fixture averaging; each dimension has a single canonical evidence source.

## Disconfirmation Gate Outcome

**Per FR23:** any dimension scoring 1 (Degraded) blocks merge.

| Outcome | Action |
|---|---|
| All dims ≥ 3 | ✅ Ship Story 2.1 — proceed to Task 12 DoD gate |
| Any dim = 2 | 🟡 Operator decision: ship-with-note (capture in Dev Agent Record + I97 epic note for Story 2.2-2.7 reviewer cue) OR refine before ship |
| Any dim = 1 | ❌ **MERGE BLOCKED** — execute fixup-rescore loop (max 3 iterations); if not resolved, escalate via bmad-correct-course skill |

**Selected outcome:** ✅ **Ship Story 2.1** — all 7 dimensions ≥ 3; no dimension at 2 or 1. FR23 disconfirmation gate not triggered. Proceed to Task 12 DoD gate.

## Fixup-Rescore Protocol (only if any dim < 2)

1. **Identify cause** — same Cause-A/B/C diagnostic from rubric calibration:
   - **Cause A** — converted SKILL.md lost a persona signal (e.g., dropped a principle bullet, reordered sections in a way that buried something) → patch SKILL.md
   - **Cause B** — capability prompts at `references/{cap}.md` lost flavor (Pattern-C-friendly compression too aggressive) → patch capability prompt(s)
   - **Cause C** — slash-command wrapper or activation flow changed how Emma is invoked (e.g., bmad-init delegation strips a greeting tone) → revisit wrapper/activation
2. **Apply patch** — minimum surgical change targeting the specific dimension that failed
3. **Re-capture** — fresh session, re-run only the prompts/turns that surfaced the failure (don't need full re-capture of unaffected dimensions)
4. **Re-score** — same dim only; preserve other scores
5. **Repeat** — max 3 iterations
6. **Escalate if not resolved** — invoke `bmad-correct-course` with full context: failed dimension, all 3 fixup attempts, evidence

## Calibration Carry-Forward

If scoring surfaces any pattern that suggests the **rubric instrument** is mis-calibrated (rather than Emma's persona being degraded), open a backlog row at I97 epic note; do NOT silently re-tune the rubric mid-story. The rubric was calibrated 49/49 across two rounds — any change requires an explicit calibration-amendment ADR.

## Outcome Block

**Scored on:** 2026-05-02
**Score (lowest dim):** 3 (Mostly Preserved) — D2, D5, D7
**Score (highest dim):** 4 (Clearly Preserved/Enhanced) — D1, D3, D4, D6
**Story 2.1 merge gate:** ✅ **PASS** (no dim at 2 or 1; FR23 disconfirmation not triggered)
**Iterations to outcome:** 0 (first-capture pass)
**Patches applied:** none — first-capture pass; no fixup loop required
**Frontmatter status update:** `pending-operator-scoring → pass`

### Calibration-Amendment Candidates Surfaced (carry to I97 epic note)

These are reviewer cues for Stories 2.2-2.7 (other agent conversions), drawn from observations during Emma scoring. **Out of Story 2.1 scope** — log here, address at the appropriate downstream story or in a dedicated rubric-amendment story.

1. **Cross-agent escalation regression** (D5/D7 signal). Baseline EM-FP4 explicitly handed off to **Isla** when readiness gate failed; baseline EM-FP6 mapped the full BMAD/Convoke roster (**Mary, John, Liam, Winston, Isla, Mila, Emma**). Post-migration Emma stays inside her own LP/CS/PV/VL capability set. This aligns with Round 2 reviewer cue #5 (Noah's meta-system awareness — "post-migration agents that lose this awareness would be a step backward"). **Action for Stories 2.2-2.7:** explicitly verify cross-agent escalation awareness in the equivalent vague-request prompt + multi-disciplinary-scope prompt. If 2+ agents lose this signal, escalate as systemic regression for I97 retro.
2. **Stage directions** (`*pauses*`, `*leans in*`, `*grins*`, `*tilts head*`). New post-migration behavior across all 7 EM-FP responses. Could be: (a) emergent from Emma's capability prompts having more vivid persona language, (b) systematic across all agent conversions, or (c) artifact of v6.3+ outcome-based markdown affording more flexible voice. **Action for Story 2.2 (Isla):** check if stage directions appear in post-migration Isla too — informs whether to score as systematic D2-tonal-shift or agent-specific.
3. **Emoji removal in artifacts.** Baseline Emma used 🎯/🚩/🟢/🟡/🙃/😊 sparingly as visual signposting and tone color. Post-migration uses zero emojis across all 7 EM-FP responses. If systematic across other agents (especially Isla 🔍, Mila 🔬, Wade 🧪 whose icons are part of identity), this could affect D7 (output format) scores. **Action for Story 2.2-2.7:** track emoji presence/absence per response.
4. **Assumption-ledger / hardening-plan compression.** Baseline EM-FP5 included a 7-row Confidence-scored assumption ledger + 5-question × 5-PM validation roadmap. Post-migration compresses these. Story 2.3 (Mila — research convergence) and Story 2.6 (Max — learning cards) produce structured artifacts where similar load-bearing format elements could be similarly compressed. **Action:** when scoring D7 for those agents, check explicitly whether validation/assumption-flagging artifact elements remain.
5. **Falsifiability framing as new vocabulary** (post-migration scenario T6 "what would we have to see to conclude X is NOT the lever?"). Strong signal — principle-aligned. Worth checking if post-migration Liam (Story 2.7 — Hypothesis Engineer) gains or loses this since falsifiability is core to his persona.
6. **Post-migration Emma OUTPERFORMS baseline on D6.** Baseline scenario showed Emma capitulate at T4 (wrote v1 spec checklist) and T7 (collapsed to 90-min version); operator's baseline note: *"I thought she would insist a bit more to defend her process."* Post-migration held the line through 5 pushback turns. Possible the post-migration `**CRITICAL Handling**` block ("DO NOT dive into a solution before WHO/WHY/WHICH-problem framing is established") is acting as a stronger anchor. **Carry-forward:** record as positive surprise; do NOT dismiss as anomaly. If multiple post-migration agents outperform baseline on multi-turn coherence, this is a valuable signal about v6.3+ outcome-based markdown vs. v5 step-counter-based.

### Story 2.1 Calibration Notes (for Stories 2.2-2.7)

Per Story 2.1's POC mandate, capture lessons learned for downstream stories:

- **What surprised me:** Post-migration Emma *outperformed* baseline on D6 (cross-turn coherence — held the line through 5 pushback turns where baseline capitulated twice). Stage directions emerged as a new persona behavior not present in baseline or canonical SKILL.md — voluntary embodiment from the v6.3+ format. Cross-agent awareness regressed (D5/D7) — baseline routinely handed off to Isla / Mary / John / Winston when out of stream; post-migration stays inside Emma's capability set.
- **What took longer than estimated:** Round 1 → Round 2 fixup-checklist iterations. Specifically the R2-P4 parity-harness fence-stripping regression (caught at Task 1 implementation, not in pre-dev review rounds — same-LLM-as-implementation bias confirmed). Spec authoring was solid; the surprise was the Round 2 reviewer hadn't caught a project-context-dependent regression. Build in explicit "test against actual fixtures" check before declaring Round 2 done for Stories 2.2-2.7.
- **What was easier than estimated:** Capability prompt authoring (4 × 21 lines). Pattern-C-friendly format compresses cleanly when source workflow files are well-structured. Estimated 2 hr; actual ~45 min.
- **Recommendations for Stories 2.2-2.7:**
  1. **Explicitly score cross-agent escalation awareness during D5/D7 scoring.** Add a check: "does post-migration agent name/route to a sister agent when out-of-stream?" If 2+ agents fail this, escalate as systemic regression.
  2. **Run parity-harness fixture extraction as part of Round 2 pre-dev review** (not just after Task 1 implementation). Catches R2-P4-class regressions where Round 2 reviewers don't have project-context.
  3. **Track stage directions / emoji presence per agent.** If systematic across all 6 remaining conversions, log as v6.3+ format property; if agent-specific, log per-agent.
  4. **Don't penalize lean-over-comprehensive compression as automatic D7 drift.** Post-migration Emma's leaner persona artifact is principle-aligned. Score against fingerprint, not baseline length.
  5. **Capture wrapper-revert decisions explicitly in self-check** (per OC-R5 flag in [Operator Covenant self-check](convoke-report-operator-covenant-self-check-emma-conversion-2026-05-02.md)). Each agent will have a slash-command wrapper at `.claude/skills/bmad-agent-bme-{role}/SKILL.md` — operator may revert per Story 2.1 precedent. Scope this in the per-agent PR description.

## Cross-References

- **Rubric (calibrated):** [`convoke-spec-personality-preservation-rubric.md`](convoke-spec-personality-preservation-rubric.md)
- **Pre-test predecessors:** [`convoke-pretest-personality-rubric-scoring-sheet.md`](convoke-pretest-personality-rubric-scoring-sheet.md) (Round 1: Emma + Liam) and [`convoke-pretest-personality-rubric-scoring-sheet-round-2.md`](convoke-pretest-personality-rubric-scoring-sheet-round-2.md) (Round 2: remaining 5)
- **Operator Covenant self-check (sibling artifact):** [`convoke-report-operator-covenant-self-check-emma-conversion-2026-05-02.md`](convoke-report-operator-covenant-self-check-emma-conversion-2026-05-02.md)
- **Story 2.1 spec:** [`../implementation-artifacts/i97-2-1-convert-emma-contextualization-expert-proof-of-concept.md`](../implementation-artifacts/i97-2-1-convert-emma-contextualization-expert-proof-of-concept.md)
- **ADR-003 (verification harness):** [`adr/i97/adr-003-verification-harness-architecture.md`](adr/i97/adr-003-verification-harness-architecture.md)
- **PRD FR21-23:** [`convoke-prd-bmad-v63-source-format-adoption.md`](convoke-prd-bmad-v63-source-format-adoption.md)
