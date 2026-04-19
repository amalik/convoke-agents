---
initiative: convoke
artifact_type: report
created: '2026-04-19'
schema_version: 1
---

# Vortex Audit Expansion Report (A24 / IN-12)

**Scope:** Vortex-team expansion of the [2026-04-18 Covenant Audit](convoke-report-operator-covenant-audit-2026-04-18.md). Audits 3 additional Vortex workflows (`assumption-mapping`, `empathy-map`, `hypothesis-engineering`) under the locked oc-1-1 methodology to raise the Vortex team cell from N=1 to N=4, enabling T1 trigger evaluation per [convoke-epic-operator-covenant.md §Retrofit Trigger Rule](convoke-epic-operator-covenant.md).

**Headline finding:** **T1 FIRES for Vortex × Right to pacing** (25% compliance, 1/4 skills PASS, N=4 ≥ 3 floor). The Vortex team systematically violates Right to pacing at step-01 of HC-contract-consuming workflows. Empathy-map is the sole Vortex PASS on pacing. All 6 other rights PASS at 100% (4/4) across Vortex — Right to pacing is the single concentrated bottleneck.

---

## 1. Scope and Non-Scope

**In scope:**
- Score 3 new Vortex workflows × 7 Operator Rights (21 new cells) using oc-1-1 §2.3 / §2.4 / §2.6 verbatim.
- Carry `lean-persona` verdicts from oc-1-1 §8.7 forward unchanged (no re-scoring).
- Compute Vortex (team × Right) row (N=4) and evaluate T1 trigger.
- Identify retrofit candidates for Epic 2 Story 2.1 scope.

**Not in scope:**
- Full re-audit of oc-1-1's 8-skill matrix. Non-Vortex verdicts stay locked.
- Methodology revision. Any rubric ambiguities surfaced are logged as backlog intakes, not resolved here.
- T2 (systemic) trigger re-evaluation across all teams — would require full re-audit to be honest. Observations only.

**Methodology reuse (AC #1 affirmation):**
- Scoring scheme: oc-1-1 §2.3 (strict binary PASS/FAIL, no partial credit).
- Rubric: oc-1-1 §2.4 (per-right audit questions).
- Novel-concept glossary: oc-1-1 §2.6 (pre-existing terms, workflow-inherited rule, compound-concept treatment).
- Unit of analysis: oc-1-1 §2.2 — one representative step per workflow. `step-01` selected for all three, matching lean-persona's oc-1-1 §8.7 scoping and allowing like-for-like Vortex cell comparison.

---

## 2. Workflow Selection and Representative Step

AC #3 required `assumption-mapping` (IN-12 origin) and `empathy-map`, plus a third from `hypothesis-engineering` or `lean-experiment`. **Third pick: `hypothesis-engineering`.**

**Rationale for `hypothesis-engineering` over `lean-experiment`:**
- Pairs naturally with `assumption-mapping` — step-04 of hypothesis-engineering invokes assumption-mapping logic, so the two together probe whether structural similarity drives similar Right-to-pacing outcomes (control for workflow-family effect).
- Covers the **Hypothesize** Vortex stream (Liam); combined with Empathize (Isla's empathy-map), Externalize-analysis (Wade-adjacent via assumption-mapping), and Empathize-authoring (Isla's lean-persona from oc-1-1) this gives 3 distinct Vortex streams covered.
- Structural parity with assumption-mapping: both lack `template.md` and `validate.md` scaffolding, so the audit surface is comparable. Lean-experiment's scaffolding would introduce a confounding surface-area variable.

**Representative step per workflow:** `step-01` for all 3, matching lean-persona oc-1-1 §8.7. Step-01 is the first operator-prompted round and is where workflow-level concept load concentrates.

| # | Workflow | Representative step | Rationale |
|---|----------|---------------------|-----------|
| 1 | `assumption-mapping` | `steps/step-01-setup.md` | IN-12 origin spot-check target. Same scope as lean-persona step-01 for Vortex-row comparability. |
| 2 | `empathy-map` | `steps/step-01-define-user.md` | Has `template.md` and `validate.md` but step-01 is the operator's first decision point; scoping matches lean-persona. |
| 3 | `hypothesis-engineering` | `steps/step-01-setup.md` | Structural twin of assumption-mapping step-01. Tests HC-contract pattern generalizability. |

---

## 3. Audit Matrix — New Vortex Cells

Binary verdicts per oc-1-1 §2.3. Evidence notes cite `workflow:step:§section` anchored to specific behavior.

| Right | `assumption-mapping` step-01 | `empathy-map` step-01 | `hypothesis-engineering` step-01 |
|-------|:---:|:---:|:---:|
| Right to a default | ✅ | ✅ | ✅ |
| Right to the full universe | ✅ | ✅ | ✅ |
| Right to rationale | ✅ | ✅ | ✅ |
| Right to completeness | ✅ | ✅ | ✅ |
| Right to pause | ✅ | ✅ | ✅ |
| Right to next action | ✅ | ✅ | ✅ |
| Right to pacing | ❌ | ✅ | ❌ |

**21 cells scored. 2 FAILs (both Right to pacing). 19 PASSes. 0 N/A.**

---

## 4. Per-Cell Evidence

### 4.1 `assumption-mapping` step-01-setup

- **Right to a default — PASS.** `step-01-setup.md:52` commits a documented fallback for non-conforming input: "That's okay — we don't reject hypotheses. I'll guide you to identify which elements are present and which gaps we need to work around during assumption mapping." No "unknown" is emitted.
- **Right to the full universe — PASS.** `step-01-setup.md:36–50` §3 enumerates the full HC3 schema scope (7 frontmatter fields + 5 body sections) upfront before validation runs. Operator sees the full check universe before submitting input.
- **Right to rationale — PASS.** `step-01-setup.md:11–13` §Why This Matters: "Assumption mapping is only as good as the hypotheses it analyzes. If the hypothesis contracts are vague, the assumptions will be invisible." Workflow.md adds the framing question ("What if your riskiest assumption isn't the one you think it is?").
- **Right to completeness — PASS.** No exclusion mechanics in step-01; §3 explicitly commits to surfacing gaps rather than dropping them. Input is preserved wholesale.
- **Right to pause — PASS.** `step-01-setup.md:58–60` §Your Turn: "Please provide your hypothesis contracts — file path(s), description, or both. I'll validate them and we'll proceed…" Implicit wait pattern, equivalent to lean-persona oc-1-1 §8.7 scoring.
- **Right to next action — PASS.** No error surface at step-01; non-conforming inputs are routed into the next step with gaps named, not errors.
- **Right to pacing — FAIL.** `step-01-setup.md:36–52` §3 Input Validation introduces ≥ 6 novel concepts in a single intake round: (1) **HC3** contract identifier, (2) the **4-field hypothesis contract** structure with its 4 named sub-fields (Expected Outcome / Target Behavior Change / Rationale / Riskiest Assumption), (3) **Assumption Risk Map**, (4) **Recommended Testing Order**, (5) **Flagged Concerns**, (6) **target_agents / input_artifacts / source_agent / source_workflow** frontmatter mechanics. Even under generous compound-concept treatment (collapsing the 4 sub-fields into 1 concept per §2.6 compound-concept grouping A13), the round still introduces ≥ 5 novel concepts. Exceeds 3-concept budget. IN-12 spot-check estimated ~10 novel concepts; strict enumeration measures 6–9 depending on compound-concept treatment.

### 4.2 `empathy-map` step-01-define-user

- **Right to a default — PASS.** `step-01-define-user.md:37–48` §Example block provides a fully-worked persona ("Sarah, a 34-year-old marketing manager…") that functions as an acceptable-default template — same pattern as lean-persona oc-1-1 §8.7.
- **Right to the full universe — PASS.** `step-01-define-user.md:17–36` §1–§4 enumerates all 4 question groups (Demographics / JTBD / Context / Research Sources) upfront. Operator sees the full scope of what will be asked before answering.
- **Right to rationale — PASS.** `step-01-define-user.md:11–13` §Why This Matters: "An empathy map is only as useful as its specificity. 'Users' is too broad. 'Mobile app users' is still too broad." Anchors all 4 subsequent question groups.
- **Right to completeness — PASS.** All 4 question groups shown explicitly; operator input preserved wholesale; no exclusion mechanics.
- **Right to pause — PASS.** `step-01-define-user.md:52–58` §Your Turn: "Please define your target user using the structure above." Implicit wait (lean-persona §8.7 pattern).
- **Right to next action — PASS.** No error surface at step-01. If AI rejects as "not specific enough" at step transition, the §Example block serves as implicit remediation pointer (same deference as lean-persona §8.7).
- **Right to pacing — PASS.** Step-01 introduces ≤ 2 novel concepts: (1) **Empathy map** framework identity (inherited from workflow.md), (2) **Job-to-be-Done** (`step-01-define-user.md:25–26` §2). Demographics, context, and research-source categories use general-literacy terms (interview transcripts / surveys / observational studies / analytics data) that don't require domain-specific redefinition — pre-existing per §2.6. The 6 empathy-map quadrants (Says/Thinks, Does/Feels, Pain Points, Gains) named in workflow.md's Steps Overview are framework signposts not unpacked in step-01 and do not constrain the operator's action in this round. Within 3-concept budget.

### 4.3 `hypothesis-engineering` step-01-setup

- **Right to a default — PASS.** `step-01-setup.md:52` commits a documented fallback: "That's okay — we don't reject problem definitions. I'll guide you to identify which elements are present and which gaps we need to work around during hypothesis engineering." Same pattern as assumption-mapping §4.1.
- **Right to the full universe — PASS.** `step-01-setup.md:35–50` §3 enumerates full HC2 schema (7 frontmatter fields + 6 body sections) upfront before validation.
- **Right to rationale — PASS.** `step-01-setup.md:11–13` §Why This Matters: "Good hypotheses are falsifiable — if you can't prove it wrong, it's not a hypothesis. But falsifiability starts with a clear problem definition."
- **Right to completeness — PASS.** No exclusion mechanics; non-conforming inputs have gaps named rather than dropped.
- **Right to pause — PASS.** `step-01-setup.md:58–60` §Your Turn: "Please provide your problem definition — file path, description, or both. I'll validate it and we'll proceed…" Implicit wait.
- **Right to next action — PASS.** No error surface at step-01; non-conforming routes into step-02 with gaps identified.
- **Right to pacing — FAIL.** `step-01-setup.md:35–51` §3 introduces ≥ 6 novel concepts: (1) **HC2** contract, (2) **Converged Problem Statement** (with sub-axes: Confidence, Scope), (3) **Jobs-to-be-Done** with 3 sub-axes (Functional / Emotional / Social Jobs), (4) **Pains** (prioritized with evidence), (5) **Gains**, (6) **Evidence Summary** (convergence assessment + gaps), (7) **Assumptions (with basis and risk if wrong)**. §Why This Matters additionally introduces (8) the **falsifiability** mental model ("if you can't prove it wrong, it's not a hypothesis"). Under compound-concept grouping (each multi-axis concept as 1), still ≥ 6 novel concepts. Exceeds 3-budget.

**Pattern observation:** `assumption-mapping` step-01 and `hypothesis-engineering` step-01 are structural twins — both enumerate an HC-schema (HC2 / HC3) in §3 Input Validation as the first operator-facing surface. Both FAIL on Right to pacing for the same reason. This is a **shared architectural pattern**, not two independent violations. See §6 Implications.

---

## 5. Vortex (Team × Right) Row — T1 Trigger Evaluation

N_vortex = 4 (lean-persona + 3 new workflows). Meets T1's N ≥ 3 floor.

| Right | lean-persona (oc-1-1 §8.7) | assumption-mapping | empathy-map | hypothesis-engineering | **Vortex compliance** | **T1 verdict (< 70% at N ≥ 3)** |
|-------|:---:|:---:|:---:|:---:|:---:|:---:|
| Right to a default | ✅ | ✅ | ✅ | ✅ | **4/4 (100%)** | Does not fire |
| Right to the full universe | ✅ | ✅ | ✅ | ✅ | **4/4 (100%)** | Does not fire |
| Right to rationale | ✅ | ✅ | ✅ | ✅ | **4/4 (100%)** | Does not fire |
| Right to completeness | ✅ | ✅ | ✅ | ✅ | **4/4 (100%)** | Does not fire |
| Right to pause | ✅ | ✅ | ✅ | ✅ | **4/4 (100%)** | Does not fire |
| Right to next action | ✅ | ✅ | ✅ | ✅ | **4/4 (100%)** | Does not fire |
| **Right to pacing** | ❌ | ❌ | ✅ | ❌ | **1/4 (25%)** | **T1 FIRES (25% < 70%)** |

**Vortex team cell summary:** 25/28 PASS (89% overall compliance). 6 rights at 100%. 1 right at 25%. **Single concentrated bottleneck: Right to pacing.**

---

## 6. Implications

### 6.1 Epic 2 Story 2.1 retrofit scope — 2 new cells added

The T1 firing adds **2 new Vortex × Right-to-pacing cells** to Epic 2 Story 2.1's retrofit scope, on top of oc-1-1 retrofit item #4 (lean-persona):

- **R7-V1: `assumption-mapping` step-01-setup × Right to pacing.** Retrofit pattern: split step-01 into (a) step-01a "Identify input" (receive HC3 paths or description — no schema enumeration; 0-1 novel concepts) and (b) step-01b "Validate against HC3 schema" (introduce the 4-field contract + Assumption Risk Map + Recommended Testing Order + Flagged Concerns with a `Concept count: N/3` footer per sub-round). Mirrors retrofit #4's lean-persona pattern.
- **R7-V2: `hypothesis-engineering` step-01-setup × Right to pacing.** Retrofit pattern: split step-01 into (a) step-01a "Identify problem definition" (receive HC2 paths — no schema enumeration) and (b) step-01b "Validate against HC2 schema" (introduce HC2 contract + 4-field hypothesis contract + Pains/Gains/Evidence Summary across ≥ 2 sub-rounds). Same shape as R7-V1 retrofit.

Carried forward from oc-1-1:
- **Retrofit #4: `lean-persona` step-01-define-job × Right to pacing.** Already in oc-1-1 §9.1 Priority retrofits. No change.

Total Vortex pacing retrofits: 3 cells. Non-pacing rights: 0 retrofits (Vortex is compliant on 6/7 rights).

### 6.2 Shared architectural pattern — HC-schema-at-step-01 anti-pattern

Assumption-mapping and hypothesis-engineering share a structural pattern: **§3 Input Validation enumerates the full upstream HC schema (frontmatter + body sections) in a single operator-visible round.** This dumps 6–9 novel concepts before any domain work begins.

This is not a lean-persona-specific oddity. It is a **Vortex-wide authoring convention** — probably present in any workflow whose step-01 receives an HC-contract artifact as input. Candidate workflows with likely same pattern (not audited in this pass):

- `research-convergence` (consumes HC1?)
- `lean-experiment` (consumes HC3)
- `learning-card` (consumes experiment output)
- `pivot-resynthesis` (consumes HC2)
- `production-monitoring` / `signal-interpretation` / `behavior-analysis` (stream 6)

A **recommended follow-up audit** (candidate initiative: "A26 — Vortex HC-schema pattern audit") would verify the hypothesis that this pattern is Vortex-wide, and motivate a **class-level retrofit** rather than per-workflow patches. Rough estimate: if 8+ of the 23 Vortex workflows share the pattern, a shared `step-01-receive-contract` template fix would close all cells at once.

### 6.3 Discovery-workflow pacing structural tension (confirms oc-1-1 §10)

oc-1-1 §10 observed that "Discovery workflows may need a budget-aware pattern" based on lean-persona alone (N=1). A24's N=4 Vortex sample **confirms this as a class-level pattern, not a single-workflow observation.** 75% of Vortex step-01 surfaces fail pacing. The Covenant v2 (Epic 2 Story 2.3 publication scope) should carry a concrete discovery-workflow pattern:

> **Discovery-workflow pacing pattern (proposed):** Step-01 of any workflow consuming an HC-contract or introducing a domain mental model must split into sub-steps, each within the ≤ 3 novel concepts budget. Schema enumeration is a separate sub-step from input receipt.

This formalization is **out of scope for A24**. It is a candidate for Covenant Compliance Checklist §Discovery patterns (if/when authored) or a project-context.md rule.

### 6.4 T2 (systemic) trigger — observation only, out of scope

Adding A24's 2 new Right-to-pacing FAILs to oc-1-1's global matrix (for illustration):
- oc-1-1 Right to pacing: 3/8 fails (38%) = 62.5% compliance (already < 70% per strict reading).
- Post-A24 combined: 5/11 fails (45%) = 55% compliance globally if the global matrix were recomputed.

**However:** T2 re-evaluation would require full re-audit of the 8 oc-1-1 skills (Migration, Portfolio, export-skill, validate-exports, Loom add-team, enhance-backlog, Gyre stack-detection are not re-audited here). A24's scope is Vortex-only per AC anti-pattern. **T2 is NOT re-evaluated in this report.** The number above is observational, not a trigger verdict.

Separately, oc-1-1 line 367 states "v1 baseline result: No trigger fires … every Right ≥ 70%" — but oc-1-1 §7 Right-to-pacing is 62.5% compliance globally. This apparent internal inconsistency in oc-1-1 is flagged as a **backlog intake candidate** (not resolved in A24 — out of scope per AC #1's methodology-reuse-not-revision constraint).

### 6.5 Covenant v2 audit baseline advances

Per [convoke-epic-operator-covenant.md §Retrofit Trigger Rule](convoke-epic-operator-covenant.md): "Trigger evaluation re-runs after each audit refresh (v1 oc-1-1 = 2026-04-18 baseline; v2 post-IN-12 Vortex-focused re-audit; v3+ post future re-audits)."

**This report is the v2 audit refresh.** Epic 2 §Retrofit Trigger Rule baseline now reads:
- v1 oc-1-1 (2026-04-18): Vortex N=1, T1 inconclusive for Vortex.
- **v2 A24 (2026-04-19): Vortex N=4. T1 FIRES on Right to pacing. 3 pacing cells in retrofit scope (2 new + 1 carried).**

Epic 2 Story 2.3 Publication Gate precondition: "all fails addressed or documented" (per oc-1-1 D3a) now includes the 2 new Vortex pacing cells.

---

## 7. Reproducibility Gate — Declared Limitation

A10 (Compliance Checklist §Reproducibility gate for multi-skill audits) requires ≥ 3 cells with independent reviewer agreement for v2+ audits. **This report does NOT satisfy A10's 3-cell gate.** Only a single auditor executed A24. The headline T1 verdict is provisional pending:

- (a) Independent re-scoring of at least 3 cells (one expected-PASS, one expected-FAIL, one borderline) before A24 findings are used to drive Epic 2 Story 2.1 retrofit commitments; or
- (b) Explicit waiver from Amalik acknowledging the single-reviewer limitation for this audit.

**Recommendation:** Treat the T1-FIRES verdict as a **strong provisional finding** — the 3/4 Vortex pacing failure rate is large enough that single-reviewer variance is unlikely to flip the trigger. But schedule a reproducibility pass before scoping Epic 2 Story 2.1 retrofit commits. This is consistent with AC #1 in the story spec (methodology reuse, not revision) and A10's prospective application to v2 audits.

A reproducibility pass can be scoped as a micro-task (score 3 cells, compute agreement rate, report; ~1 hour) or bundled into A25 (decision-support archetype addition) which will also require reproducibility.

---

## 8. Conflict-of-Interest Disclosure

The auditor (Claude working under Amalik's direction in this session) has **not authored or materially edited** `assumption-mapping/steps/step-01-setup.md`, `empathy-map/steps/step-01-define-user.md`, or `hypothesis-engineering/steps/step-01-setup.md` prior to this audit session. Workflow authorship attributed in frontmatter: Isla (empathy-map), Liam (assumption-mapping and hypothesis-engineering). No COI concern on step-01 authorship.

Note: auditor did author the A24 story spec ([oc-vortex-audit-expansion-a24.md](../implementation-artifacts/oc-vortex-audit-expansion-a24.md)) earlier in the same session; the story spec defined AC-level constraints (e.g., AC #4 representative-step scoping) that shaped this audit's frame. This is not a workflow-content COI but a methodology-frame COI worth noting: the audit frame was authored by the auditor rather than a separate reviewer.

---

## 9. Rubric Ambiguities Surfaced (Backlog Intake Candidates)

Per AC #1, rubric ambiguities go to the initiatives backlog, not resolved in-story. Logged here for the next triage pass:

1. **Compound-concept treatment for 4-field contracts.** The 4-field hypothesis contract (Expected Outcome / Target Behavior Change / Rationale / Riskiest Assumption) is structurally a "named contract" (1 concept) but enumerating it adds 4 sub-fields. Under A13 (OC-R7 concept-counting rules for compound concepts), this needs a glossary rule. My audit used the charitable reading (1 compound concept) to avoid over-counting, but the FAIL verdict holds under either reading.
2. **HC-schema enumeration as single vs. multiple concepts.** §3 Input Validation lists "HC3 frontmatter fields" (7 items) and "HC3 body sections" (5-6 items). Are these 12 distinct concepts or 2 compound ones? Related to A13 above.
3. **oc-1-1 line 367 vs. line 271 internal consistency.** Line 367 claims "every Right ≥ 70%" at v1 baseline but line 271 shows Right to pacing at 62.5% compliance. Either the threshold is compliance-averaged-across-teams (not compliance-across-all-skills) or the v1 baseline calculation is internally inconsistent. Logged as a clarification request; does not affect A24 Vortex-only findings.

---

## 10. Activity Trail

- **2026-04-18:** oc-1-1 Round 3 Edge Case Hunter deferred "Vortex sampling representativeness" to backlog (per no-R4 rule). Triaged as IN-12 → A8 by Winston.
- **2026-04-19:** A8 renamed to **A24** (collision with v6.3 Adoption A8/WS3). Story spec authored at [oc-vortex-audit-expansion-a24.md](../implementation-artifacts/oc-vortex-audit-expansion-a24.md).
- **2026-04-19:** A24 executed (this report). T1 fires for Vortex × Right to pacing. 2 new retrofit cells added to Epic 2 Story 2.1 scope. Single-reviewer limitation declared per §7.
