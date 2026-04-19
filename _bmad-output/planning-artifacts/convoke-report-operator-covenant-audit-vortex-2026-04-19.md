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
- **Right to pacing — FAIL.** `step-01-setup.md:36–52` §3 Input Validation introduces 6 novel concepts in a single intake round: HC3 contract; 4-field hypothesis contract (Expected Outcome / Target Behavior Change / Rationale / Riskiest Assumption); Assumption Risk Map; Recommended Testing Order; Flagged Concerns; frontmatter mechanics (target_agents / input_artifacts / source_agent / source_workflow). Exceeds 3-concept budget — see §4.4 Notes for IN-12 estimate comparison and compound-concept caveat.

### 4.2 `empathy-map` step-01-define-user

- **Right to a default — PASS.** `step-01-define-user.md:37–48` §Example block provides a fully-worked persona ("Sarah, a 34-year-old marketing manager…") that functions as an acceptable-default template — same pattern as lean-persona oc-1-1 §8.7.
- **Right to the full universe — PASS.** `step-01-define-user.md:17–36` §1–§4 enumerates all 4 question groups (Demographics / JTBD / Context / Research Sources) upfront. Operator sees the full scope of what will be asked before answering.
- **Right to rationale — PASS.** `step-01-define-user.md:11–13` §Why This Matters: "An empathy map is only as useful as its specificity. 'Users' is too broad. 'Mobile app users' is still too broad." Anchors all 4 subsequent question groups.
- **Right to completeness — PASS.** All 4 question groups shown explicitly; operator input preserved wholesale; no exclusion mechanics.
- **Right to pause — PASS.** `step-01-define-user.md:52–58` §Your Turn: "Please define your target user using the structure above." Implicit wait (lean-persona §8.7 pattern).
- **Right to next action — PASS.** No error surface at step-01. If AI rejects as "not specific enough" at step transition, the §Example block serves as implicit remediation pointer (same deference as lean-persona §8.7).
- **Right to pacing — PASS.** Step-01 introduces only 1 novel concept: Job-to-be-Done (`step-01-define-user.md:25–26` §2). Empathy map + the 6 quadrants (workflow.md Steps Overview) are pre-existing per §2.6 "previously encountered" semantics; general-literacy research-source categories are in the §2.6 pre-existing list; within 3-concept budget. See §4.4 Notes for workflow.md-vs-step-01 scope caveat (§9 ambiguity #5).

### 4.3 `hypothesis-engineering` step-01-setup

- **Right to a default — PASS.** `step-01-setup.md:52` commits a documented fallback: "That's okay — we don't reject problem definitions. I'll guide you to identify which elements are present and which gaps we need to work around during hypothesis engineering." Same pattern as assumption-mapping §4.1.
- **Right to the full universe — PASS.** `step-01-setup.md:35–50` §3 enumerates full HC2 schema (7 frontmatter fields + 6 body sections) upfront before validation.
- **Right to rationale — PASS.** `step-01-setup.md:11–13` §Why This Matters: "Good hypotheses are falsifiable — if you can't prove it wrong, it's not a hypothesis. But falsifiability starts with a clear problem definition."
- **Right to completeness — PASS.** No exclusion mechanics; non-conforming inputs have gaps named rather than dropped.
- **Right to pause — PASS.** `step-01-setup.md:58–60` §Your Turn: "Please provide your problem definition — file path, description, or both. I'll validate it and we'll proceed…" Implicit wait.
- **Right to next action — PASS.** No error surface at step-01; non-conforming routes into step-02 with gaps identified.
- **Right to pacing — FAIL.** `step-01-setup.md:35–51` §3 introduces 7 novel concepts: HC2 contract; Converged Problem Statement (Confidence, Scope); Jobs-to-be-Done (Functional / Emotional / Social); Pains (prioritized with evidence); Gains; Evidence Summary (convergence + gaps); Assumptions-with-risk — plus falsifiability mental model in §Why This Matters (§Why-Matters:11–13). Exceeds 3-concept budget — see §4.4 Notes for compound-concept caveat.

**Pattern observation:** `assumption-mapping` step-01 and `hypothesis-engineering` step-01 are structural twins — both enumerate an HC-schema (HC2 / HC3) in §3 Input Validation as the first operator-facing surface. Both FAIL on Right to pacing for the same reason. This is a **shared architectural pattern**, not two independent violations. See §6 Implications.

### 4.4 Notes (AC #6 — supporting evidence not required in-line)

- **Compound-concept caveat.** The 4-field hypothesis contract (§4.1) and the 3 JTBD sub-axes (§4.3) are each structurally a named compound. Under strict §2.6, sub-fields count separately; under a charitable grouping reading, each compound counts as 1. Both FAIL verdicts hold under either reading: assumption-mapping remains ≥ 5 novel concepts under grouping (6 distinct items), hypothesis-engineering remains ≥ 6. The grouping rule itself is not in the locked §2.6 glossary; the compound-concept counting rule is a backlog candidate tracked as A13 (OC-R7 compound-concept counting, §9 ambiguity #1).
- **IN-12 spot-check estimate vs. measured count (AC #6).** IN-12's spot-check estimated "~10 novel concepts" in assumption-mapping step-01. Strict enumeration here measures 6 distinct items (or 9 if sub-fields count separately). The estimate was directionally correct (clearly over-budget) but over-counted; the FAIL verdict is unaffected.
- **workflow.md-vs-step-01 scope.** §2.6's workflow-inherited rule explicitly covers earlier steps but is silent on workflow.md. §4.2 (empathy-map) applies the broader reading (workflow.md concepts pre-exist by step-01); §4.1 and §4.3 don't need the broader reading (their novel concepts are introduced in step-01 itself). Tracked as §9 ambiguity #5.

---

## 5. Vortex (Team × Right) Row — T1 Trigger Evaluation

N_vortex = 4 (lean-persona + 3 new workflows). Meets T1's N ≥ 3 floor.

Per AC #8: `vortex_fail_rate = fails_in_vortex / N_vortex_audited`. Compliance shown alongside for readability.

| Right | lean-persona (oc-1-1 §8.7) | assumption-mapping | empathy-map | hypothesis-engineering | **Fails / N** | **Fail rate** | **Compliance** | **T1 verdict (< 70% compliance at N ≥ 3)** |
|-------|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| Right to a default | ✅ | ✅ | ✅ | ✅ | 0/4 | 0% | 100% | Does not fire |
| Right to the full universe | ✅ | ✅ | ✅ | ✅ | 0/4 | 0% | 100% | Does not fire |
| Right to rationale | ✅ | ✅ | ✅ | ✅ | 0/4 | 0% | 100% | Does not fire |
| Right to completeness | ✅ | ✅ | ✅ | ✅ | 0/4 | 0% | 100% | Does not fire |
| Right to pause | ✅ | ✅ | ✅ | ✅ | 0/4 | 0% | 100% | Does not fire |
| Right to next action | ✅ | ✅ | ✅ | ✅ | 0/4 | 0% | 100% | Does not fire |
| **Right to pacing** | ❌ | ❌ | ✅ | ❌ | **3/4** | **75%** | **25%** | **T1 FIRES (25% < 70%)** |

**Vortex team cell summary:** 25/28 PASS (89% overall compliance). 6 rights at 100% compliance / 0% fail rate. 1 right at 25% compliance / 75% fail rate. **Single concentrated bottleneck: Right to pacing.**

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

A **recommended follow-up audit** (logged as IN-43 → A26 in the initiatives backlog — Vortex HC-schema pattern audit) would verify the hypothesis that this pattern is Vortex-wide, and motivate a **class-level retrofit** rather than per-workflow patches. Rough estimate pending a proper Vortex-wide workflow inventory: if a majority of Vortex workflows share the pattern (≈23 workflows listed in `_bmad/bme/_vortex/workflows/`; exact count and pattern-overlap to be measured by A26), a shared `step-01-receive-contract` template fix would close all cells at once.

### 6.3 Discovery-workflow pacing structural tension (confirms oc-1-1 §10)

oc-1-1 §10 observed that "Discovery workflows may need a budget-aware pattern" based on lean-persona alone (N=1). A24's N=4 Vortex sample **confirms this as a class-level pattern, not a single-workflow observation.** 75% of Vortex step-01 surfaces fail pacing. The Covenant v2 (Epic 2 Story 2.3 publication scope) should carry a concrete discovery-workflow pattern:

> **Discovery-workflow pacing pattern (proposed):** Step-01 of any workflow consuming an HC-contract or introducing a domain mental model must split into sub-steps, each within the ≤ 3 novel concepts budget. Schema enumeration is a separate sub-step from input receipt.

This formalization is **out of scope for A24**. It is a candidate for Covenant Compliance Checklist §Discovery patterns (if/when authored) or a project-context.md rule.

### 6.4 T2 (systemic) trigger — out of scope

A24 adds 2 new Right-to-pacing FAILs. A rigorous T2 re-evaluation would require a full re-audit of the 8 oc-1-1 skills (Migration, Portfolio, export-skill, validate-exports, Loom add-team, enhance-backlog, Gyre stack-detection are not re-audited here). A24's scope is Vortex-only per AC anti-pattern. **T2 is NOT re-evaluated in this report.** Any directional observation about post-A24 systemic Right-to-pacing compliance would mix A24's Vortex-only cells with oc-1-1's frozen non-Vortex cells, which violates Anti-Pattern #5 — so no number is emitted here.

Separately, a **cross-document consistency question** is logged as a backlog intake candidate: `convoke-epic-operator-covenant.md:367` states the v1 baseline result "every Right ≥ 70%", but the oc-1-1 matrix at `convoke-report-operator-covenant-audit-2026-04-18.md:271` shows Right-to-pacing at 62.5% compliance (3/8 fail). The threshold phrasing may refer to a different computation (e.g., compliance-averaged-across-teams rather than across-all-skills). This is a cross-document (Epic vs. oc-1-1) clarification, not an internal inconsistency in oc-1-1 itself. Not resolved here per AC #1 methodology-reuse constraint.

### 6.5 Covenant v2 audit baseline advances

Per [convoke-epic-operator-covenant.md §Retrofit Trigger Rule](convoke-epic-operator-covenant.md): "Trigger evaluation re-runs after each audit refresh (v1 oc-1-1 = 2026-04-18 baseline; v2 post-IN-12 Vortex-focused re-audit; v3+ post future re-audits)."

**This report is the v2 audit refresh.** Epic 2 §Retrofit Trigger Rule baseline **should be updated** (subject to Epic 2 governance ratification, gated on G1 per §8.1) to read:
- v1 oc-1-1 (2026-04-18): Vortex N=1, T1 inconclusive for Vortex.
- **v2 A24 (2026-04-19, provisional): Vortex N=4. T1 FIRES on Right to pacing. 3 pacing cells flagged for retrofit scope (2 new + 1 carried).**

Epic 2 Story 2.3 Publication Gate precondition "all fails addressed or documented" (per oc-1-1 D3a) **should extend** to cover the 2 new Vortex pacing cells once the reproducibility gate clears and Epic 2 owner ratifies the v2 baseline.

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

### 8.1 Mitigation Gates (locked 2026-04-19 via Round 1 code review)

Because §7 declares the T1-FIRES verdict provisional (A10 reproducibility gate not yet cleared) AND §8 discloses a methodology-frame COI, downstream actions that treat A24 findings as load-bearing MUST satisfy these gates first:

- **G1 — Epic 2 Story 2.1 retrofit scoping block:** The 2 new retrofit cells introduced in §6.1 (R7-V1 `assumption-mapping`, R7-V2 `hypothesis-engineering`) MUST NOT be added to Epic 2 Story 2.1 retrofit commitments until the A10 reproducibility gate clears ≥ 3 cells per the Compliance Checklist §Reproducibility gate rule.
- **G2 — Independent FAIL cell verification:** Before retrofit work begins for either R7-V1 or R7-V2, at least one FAIL cell per new workflow (i.e., one from each of `assumption-mapping` step-01 or `hypothesis-engineering` step-01) must be independently re-scored by a second reviewer. G2 is subsumed by G1 if the ≥3-cell reproducibility pool happens to include both.
- **G3 — Rubric ambiguities stay intake-only:** The 5 ambiguities logged in §9 MUST be triaged as backlog intakes via `bmad-enhance-initiatives-backlog` Triage mode — not resolved in this story per AC #1's methodology-reuse-not-revision constraint.
- **G4 — Carried-forward cells locked:** `lean-persona` verdicts from oc-1-1 §8.7 carry forward **unchanged**. If the reproducibility pass surfaces a drift concern on lean-persona, it becomes a v3 audit input, not an in-story correction.

The Covenant v2 audit baseline advancement described in §6.5 is effective for this report's own records but requires Epic 2 governance ratification before it becomes the authoritative v2 baseline. That ratification is itself gated on G1.

---

## 9. Rubric Ambiguities Surfaced (Backlog Intake Candidates)

Per AC #1, rubric ambiguities go to the initiatives backlog, not resolved in-story. Logged here for the next triage pass:

1. **Compound-concept treatment for 4-field contracts.** The 4-field hypothesis contract (Expected Outcome / Target Behavior Change / Rationale / Riskiest Assumption) is structurally a "named contract" (1 concept) but enumerating it adds 4 sub-fields. Under A13 (OC-R7 concept-counting rules for compound concepts), this needs a glossary rule. My audit used the charitable reading (1 compound concept) to avoid over-counting, but the FAIL verdict holds under either reading.
2. **HC-schema enumeration as single vs. multiple concepts.** §3 Input Validation lists "HC3 frontmatter fields" (7 items) and "HC3 body sections" (5-6 items). Are these 12 distinct concepts or 2 compound ones? Related to A13 above.
3. **Cross-document consistency — Epic v1 baseline claim vs. oc-1-1 matrix.** `convoke-epic-operator-covenant.md:367` states v1 baseline "every Right ≥ 70%"; oc-1-1 §7 (line 271) shows Right to pacing at 62.5% compliance across 8 skills. Either the threshold is compliance-averaged-across-teams (not across-all-skills) or the Epic claim is loose. Logged as a clarification request; corrected from an earlier draft which mis-attributed the phrase to the oc-1-1 report itself. Does not affect A24 Vortex-only findings.
4. **Right-to-next-action scoring at intake-only steps — PASS vs N/A ambiguity.** All 3 workflows scored PASS for Right to next action with the reasoning "no error surface at step-01; non-conforming routes into step-02+ with gaps named". This matches oc-1-1 §8.7 lean-persona verbatim ("No error surface in this discovery step; validation happens in later steps") and is method-consistent with the locked methodology — but both audits rely on the next step for the evidence, which is a vacuous PASS at the step-01 unit of analysis (AC #4 "one representative step per workflow"). §2.3 N/A discipline ("right cannot apply to the skill's interaction surface") could arguably cover intake-only steps. Added 2026-04-19 via Round 1 code review (Edge Case Hunter). Logged for v3+ rubric clarification; does not affect A24 or oc-1-1 verdicts.
5. **workflow.md-vs-step-01 scope for §2.6 novel-concept counting.** §2.6's workflow-inherited rule explicitly covers "concepts introduced in earlier steps" but is silent on whether concepts introduced in workflow.md (the orchestration file, loaded before any step) count as "previously encountered in the current workflow" by the time the operator reaches step-01. This audit applies the broader reading (workflow.md counts as prior encounter) — e.g., §4.2 treats the 6 empathy-map quadrants named in workflow.md's Steps Overview as pre-existing. Under the narrower reading (only earlier steps count), empathy-map's step-01 cell might flip FAIL. Verdicts are stable under either reading for all 3 A24 cells (empathy-map PASS holds both ways once JTBD is the only net-new step-01 concept; assumption-mapping + hypothesis-engineering FAILs hold either way with ≥ 6 step-01-introduced concepts). Added 2026-04-19 via Round 1 code review (Edge Case Hunter + Acceptance Auditor). Logged for v3+ glossary clarification.

---

## 10. Activity Trail

- **2026-04-18:** oc-1-1 Round 3 Edge Case Hunter deferred "Vortex sampling representativeness" to backlog (per no-R4 rule). Triaged as IN-12 → A8 by Winston.
- **2026-04-19:** A8 renamed to **A24** (collision with v6.3 Adoption A8/WS3). Story spec authored at [oc-vortex-audit-expansion-a24.md](../implementation-artifacts/oc-vortex-audit-expansion-a24.md).
- **2026-04-19:** A24 executed (this report). T1 fires for Vortex × Right to pacing. 2 new retrofit cells added to Epic 2 Story 2.1 scope. Single-reviewer limitation declared per §7.
