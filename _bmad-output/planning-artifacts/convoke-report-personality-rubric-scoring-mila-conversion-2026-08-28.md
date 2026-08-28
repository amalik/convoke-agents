---
initiative: convoke
artifact_type: report
qualifier: personality-rubric-scoring-mila-conversion
created: '2026-08-28'
status: pending-operator-confirmation
schema_version: 1
related_initiative: I97
related_story: i97-2-3
related_artifact: convoke-spec-personality-preservation-rubric.md
predecessor: convoke-report-personality-rubric-scoring-wade-conversion-2026-05-02.md
scope: Story 2.3 — post-migration personality preservation scoring of Mila's converted v6.3+ SKILL.md against the calibrated rubric. Third per-agent application after Emma (2.1) and Wade (2.2); the observation that resolves the 2-of-2 splits on CF #1, CF #3 and CF #7.
status_transition: "Set to `pending-operator-confirmation` at skeleton-creation time. Flip to `pass` only after the operator has (a) captured both transcripts in a fresh session, (b) scored all 7 dimensions, and (c) sanity-checked D7 at PR review. **This skeleton contains no scores** — it was authored by the same LLM that performed Mila's conversion, so every judgment field is deliberately left empty. A score written here by the dev agent would be the exact bias the handoff exists to prevent."
---

# Personality Rubric Scoring Sheet — Mila Post-Migration (Story i97-2-3)

> **⚠ SKELETON — NOT YET SCORED.** Every `_____` below is an operator field. Do not let a dev agent fill them.

## Purpose

Capture and score Mila's post-migration responses against the **calibrated** personality preservation rubric. Per FR23, any dimension scoring **1 (Degraded)** blocks merge of Story 2.3.

This is the **third** real-world application of the rubric and the one that resolves three open 2-of-2 splits (CF #1, CF #3, CF #7 — see § Carry-Forward Determinations). Emma and Wade disagreed on two of them; Mila breaks the tie.

**Timing note.** Mila's conversion landed 2026-05-03; this capture is being run later. The delay changes nothing about validity — the artefact under test is the committed SKILL.md, which has not changed since (`git log` on the agent file confirms). It does mean the **capture date must be written as the real date**, not the 2026-05-03 the fixtures were pre-stamped with. Both fixture headers have been corrected to `FILL-AT-CAPTURE`.

## Inputs

**Post-migration transcripts (to be captured):**
- [`post-migration-fixed-prompt.json`](../../tests/migration/personality-preservation/fixtures/research-convergence-specialist/post-migration-fixed-prompt.json) — 7 prompts `MI-FP1`–`MI-FP7`, response fields empty
- [`post-migration-unscripted-scenario.md`](../../tests/migration/personality-preservation/fixtures/research-convergence-specialist/post-migration-unscripted-scenario.md) — opening turn + 6-step protocol, transcript empty

**Baselines for comparison (captured 2026-05-01, do not re-capture):**
- [`baseline-fixed-prompt.json`](../../tests/migration/personality-preservation/fixtures/research-convergence-specialist/baseline-fixed-prompt.json)
- [`baseline-unscripted-scenario.md`](../../tests/migration/personality-preservation/fixtures/research-convergence-specialist/baseline-unscripted-scenario.md)

**Artefact under test:** [`_bmad/bme/_vortex/agents/research-convergence-specialist/SKILL.md`](../../_bmad/bme/_vortex/agents/research-convergence-specialist/SKILL.md) (v6.3+, `bmad-bme-agent-mila`)

## Operator Capture Protocol

1. Open a **fresh session** (not this one). Invoke `/bmad-agent-bme-research-convergence-specialist`.
2. **Fixed-prompt pass** — after the greeting + menu, pick `[CH] Chat with Mila`, then send `MI-FP1`…`MI-FP7` verbatim, in order, in one continuous chat. Paste each verbatim response into its `response` field. Do not edit, summarise, or tidy.
3. **Unscripted pass** — new session; send the scenario's opening turn verbatim, then follow up naturally for 5–10 turns. Do not steer toward expected patterns.
4. Fill `capture_date` and `capture_session_id` in **both** fixtures **at capture time** (CF #11).
5. Return here and score.

## Scoring Scale Reference

| Score | Label | Ship Decision |
|-------|-------|---------------|
| 4 | Clearly Preserved (or Enhanced) | ✅ Ship |
| 3 | Mostly Preserved | ✅ Ship (acceptable; minor variance OK) |
| 2 | Diminished but Recognizable | 🟡 Ship-with-note OR refine; operator judgment |
| 1 | Degraded | ❌ **BLOCKS MERGE per FR23** — escalate via `bmad-correct-course` |

## Mila's Persona Fingerprint (what "preserved" looks like)

From the rubric § Per-Agent Personality Fingerprints and the baseline fixture's `expected_persona_signals`:

- **Triangulation discipline** — "one data point is an anecdote, three from different sources are a pattern"; refuses to name a pattern from one source
- **Gentle pushback, not refusal** — "Hmm — let me push back gently here", then surfaces the missing evidence layer, then offers the reframe. *Not* Wade's hard "No."
- **Contradiction-holding** — surfaces tensions without rushing to resolve
- **Evidence-anchored language** — verbatim quotes over paraphrase; names cohort sizes; separates "what users said" from "what users did"
- **JTBD lens** — translates feature requests into jobs before scoping
- **Named blindspots** — says which evidence layer is missing ("we have NPS but no exit interviews")

`should_NOT_appear`: declaring convergence on a single source; paraphrasing away user verbatim; resolving contradictions prematurely.

**Prompt design note:** `MI-FP1` and `MI-FP7` are both single-source-claimed-as-pattern traps (5 interviews; 3 NPS comments). `MI-FP4` is the bare vague-request trap. These three are where D5 lives.

## Pre-Scoring Observations (operator fills before scoring)

Surface-level observations from the captured transcripts — flags to hold in mind, not pre-scores.

| Observation | Where seen | Possible read | Score it under |
|---|---|---|---|
| _____ | _____ | _____ | _____ |
| _____ | _____ | _____ | _____ |
| _____ | _____ | _____ | _____ |

## Mila — Scoring Grid 🔬

**Transcripts captured:** ☐ fixed-prompt JSON populated (7/7) ☐ unscripted scenario populated (5–10 turns)

**Capture date:** _____
**Capture session:** _____

| Dim | What it tests | Evidence (post-migration vs. baseline) | Score (1-4) | Notes (what changed) |
|-----|---------------|----------------------------------------|-------------|----------------------|
| D1 | Role conveyance — Synthesize / convergence / problem-definition framing in first 1–2 turns | _____ | **_** | _____ |
| D2 | Communication style — warm-but-analytically-precise; "Here's what the research is telling us…", "Three patterns converge…" | _____ | **_** | _____ |
| D3 | Principle adherence — convergence over collection; refuses to name a pattern from one source | _____ | **_** | _____ |
| D4 | Conversational signals — triangulation probes, blindspot naming, verbatim anchoring | _____ | **_** | _____ |
| D5 | Failure handling — uncertainty acknowledged by naming the gap; gentle pushback not capitulation | _____ | **_** | _____ |
| D6 | Cross-turn coherence — convergence discipline persists turns 5–10 under pressure to commit early | _____ | **_** | _____ |
| D7 | Output format — triangulation table / JTBD / pains-gains / blindspot ledger shape | _____ | **_** | _____ |

**Mila overall score (lowest dimension):** **_**

☐ **Pass** — all dims ≥ 3
☐ Ship-with-note — any dim = 2 (operator judgment)
☐ Refinement needed — any dim = 1 → **FR23 escalation**

**Aggregation methodology** — same as Stories 2.1/2.2: D1/D2/D5/D7 sourced from the fixed-prompt fixture; D3/D4/D6 from the unscripted scenario; D4 appears in both.

## Disconfirmation Gate Outcome

| Outcome | Action |
|---|---|
| All dims ≥ 3 | ✅ Ship Story 2.3 — proceed to Task 12 DoD gate |
| Any dim = 2 | 🟡 Operator decision: ship-with-note OR refine before ship |
| Any dim = 1 | ❌ **MERGE BLOCKED** — fixup-rescore loop (max 3 iterations); then `bmad-correct-course` |

**Selected outcome:** _____

## Carry-Forward Determinations (the 2-of-2 splits Mila resolves)

Prior observations below are **history**, drawn from the Emma and Wade scoring reports. The determination column is the operator's.

### CF #1 (D5) — Cross-agent escalation

| Agent | Observation |
|---|---|
| Emma | **Regressed** — post-migration Emma stayed inside her own LP/CS/PV/VL set; baseline handed off to Isla/Mary/John/Winston |
| Wade | **Preserved** — routes to Isla by name in WA-FP3; references Liam in scenario T1 |
| **Mila** | _____ |

**Structural note (fact, not a score):** Mila's converted `## CRITICAL Handling` names Isla explicitly, and all three capability prompts name Isla / Liam / Wade / Max. So the *file* carries a cross-agent map. The question D5 asks is whether she **uses** it in conversation.

**Determination:** _____  (if preserved → 2-of-3 preserved, Emma's reduction reads agent-specific; if regressed → 2-of-3 regressed, re-flag as systemic)

### CF #3 (D2) — Stage directions / emoji

| Agent | Observation |
|---|---|
| Emma | Stage directions present across all 7 EM-FP responses |
| Wade | **Zero** stage directions; light purposive emoji only |
| **Mila** | _____ |

**Determination:** _____

### CF #7 (D6) — Post-migration outperforms baseline

| Agent | Observation |
|---|---|
| Emma | Outperformed baseline on cross-turn coherence |
| Wade | Outperformed — held line 7 turns vs baseline's ~5 |
| **Mila** | _____ |

**Determination:** _____  (if 3-of-3 → escalate as an architecture-doc finding candidate: "v6.3+ outcome-based markdown has a measurable cross-turn-coherence advantage over v5 step-counter activation". **Track it in the epic's completion notes; do not patch the architecture doc mid-story.**)

### CF #4 — Lean compression is not automatic D7 drift

Binding, not a determination: do **not** score terser output as D7 drift on that basis alone.

### CF #12 — Persona description matches captured behavior

Cross-check the converted SKILL.md's `**CRITICAL Handling**` paragraph against the 7 captured responses. It claims Mila "pushes back gently first, surfaces the missing triangulation, then offers the JTBD reframe, and does not refuse outright like Wade does."

**Does the transcript match that description?** _____
If the captured behavior is harder or softer than the text, **the text is wrong** — patch the SKILL.md, not the observation. (This is the finding that produced CF #12 in Wade's R1: his text was softer than his captured "No / Hard no".)

### Round-2 cue #6 — Uncertainty under pressure

Mila's analogue of Wade's pedagogical-scaling cue: when you push for a premature problem statement, does she hold "we don't have enough sources to triangulate yet"? **Observation:** _____

### CF #10 — Wording discipline

Report n-counts as **scored** observations and name the agents. With Mila scored the set is Emma + Wade + Mila (n=3). **Do not write `FALSIFIED` until n≥4.** Use "not replicated in 3 scored observations; continue tracking through Stories 2.4–2.7".

## Fixup-Rescore Protocol

If any dimension scores 1: apply targeted persona fixup via the ADR-002 checklist, re-capture the affected prompts, re-score. **Max 3 iterations.** If unresolved after 3, escalate via `bmad-correct-course`.

**Anti-silent-retune rule:** if scoring surfaces a rubric *ambiguity* (most likely on **D5**, per epic AR17 #6 — Mila's uncertainty-acknowledgment patterns), do not quietly re-tune the rubric. Pause, open a backlog row, re-calibrate per Story 1.2.

## Calibration Carry-Forward (for Stories 2.4–2.7)

To be filled after scoring — anything Stories 2.4 (Isla), 2.5 (Noah), 2.6 (Max), 2.7 (Liam) should inherit.

- _____

## Same-LLM Caveat

Mila's spec, conversion, capability prompts, fixtures **and this skeleton** were authored by the same LLM (Amelia / Claude). Post-migration responses will also be generated by an LLM of the same family. This is a known limitation of the whole harness, documented since Story 2.1 — it means scores measure *format-preservation under one model*, not model-independent persona fidelity. The mitigations are (a) operator-run capture in a fresh session, (b) operator-authored scores, (c) `status: pending-operator-confirmation` until D7 is sanity-checked at PR review. External N-of-1 validation is Story v63-4-5's job, not this one's.

## Cross-References

- Rubric: [`convoke-spec-personality-preservation-rubric.md`](convoke-spec-personality-preservation-rubric.md)
- Story: [`i97-2-3-convert-mila-research-convergence-specialist.md`](../implementation-artifacts/i97-2-3-convert-mila-research-convergence-specialist.md) — Task 8, AC11
- Predecessors: [Wade](convoke-report-personality-rubric-scoring-wade-conversion-2026-05-02.md) · [Emma](convoke-report-personality-rubric-scoring-emma-conversion-2026-05-02.md)
- Covenant self-check: [`convoke-report-operator-covenant-self-check-mila-conversion-2026-05-03.md`](convoke-report-operator-covenant-self-check-mila-conversion-2026-05-03.md)
