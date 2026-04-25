---
initiative: convoke
artifact_type: report
created: '2026-04-25'
schema_version: 1
---

# Operator Covenant Audit — Decision-Support Archetype Supplement (A25)

**Audit date:** 2026-04-25
**Scope:** 1 Convoke-owned decision-support skill × 7 canonical Operator Rights = 7 cells (calibration-case audit per §A41-12)
**Skill audited:** `bmad-portfolio-status` (Layer 2: `_bmad/bme/_artifacts/workflows/bmad-portfolio-status/steps/step-01-scan.md`)
**Methodology version:** v4 (post-A41+A42 ship; per `created` date)
**Story:** A25 (calibration-case audit per IN-13 origin — break the single-sample-with-COI dependency on `enhance-backlog` in oc-1-1 baseline)
**Spec:** [oc-decision-support-archetype-audit-a25.md](../implementation-artifacts/oc-decision-support-archetype-audit-a25.md)

## 1. Headline

**A25 calibration-case audit clears A10 reproducibility gate at 3/3 pairwise agreement** (significantly better than A39's 1/3) and produces 3 PASS verdicts on evaluable cells (OC-R4, OC-R6, OC-R7-reading-dependent), 4 N/A-vacuous cells (OC-R1, OC-R2, OC-R3, OC-R5 — step-01 has no operator-decision branches).

**Cross-audit aggregate** (per A25 spec AC9 P4 — side-by-side, NOT arithmetic-summed across version-pinned methodologies): decision-support archetype baseline N=2 (was N=1) achieved. **Single-sample-with-COI dependency broken** on archetype-diversity dimension; **operator-author dependency persists** (both samples Amalik-authored — disclosed in §8). T1 not evaluable on aggregate (mixed v3 N_total + v4 N_effective per §A41-13 cell-mechanism naming stability).

**Key finding (cross-audit insight):** OC-R7 (Right to pacing) verdict diverges between samples — enhance-backlog FAIL (qualify-menu concept density) vs portfolio-status PASS (auto-transit display step has no operator-input boundary, so concept count is moot per §2.6). This is an archetype-level signal: **R7 violations cluster in operator-decision-rich UX, not in display-only UX**.

## 2. Selection Discipline (per A29 + §A41-12)

### 2.1 Single-skill calibration-case scope (per §A41-12)

A25 is a **calibration-case audit** per Compliance Checklist §A41-12 ("N=1 acceptable for single-surface teams or calibration-case audits"). Selection intent:

- **Justification:** break single-sample-with-COI dependency in oc-1-1 baseline for decision-support archetype (only sample was `enhance-backlog`, with disclosed COI).
- **No structural-dimension variation declared:** per §A41-12, single-skill audits are exempt from the ≥2-pick variation requirement.
- **No archetype-cluster claim:** A25 is a *targeted gap-fill* (calibration-case), not a representative-pattern audit. Findings apply to the sampled skill only; archetype-level claims require cross-audit aggregation (§6).

### 2.2 Pick: `bmad-portfolio-status`

Located at [`_bmad/bme/_artifacts/workflows/bmad-portfolio-status/`](../../_bmad/bme/_artifacts/workflows/bmad-portfolio-status/) — Convoke-owned (preserves modules-ownership rule from project-context.md). Decision-support function: 3-step guided conversation (scan → explore → recommend) for initiative prioritization. Distinct from `enhance-backlog` (decision-support for backlog management).

**Why not CIS skills (originally suggested in IN-13):** `bmad-cis-problem-solving` and `bmad-cis-innovation-strategy` live at `_bmad/cis/` (upstream BMAD), not `_bmad/bme/` (Convoke-owned). Per modules-ownership rule, Covenant audits should target Convoke-owned content; cross-module-scope expansion is a separate methodology question. If oc-1-1 Acceptance Auditor objects post-ship, log as follow-up intake.

### 2.3 Step Selection (per A28 v1; §A41-8 v2 not applicable)

A25 scopes to **step-01** (`step-01-scan.md`) per A28 v1 single-step rationale: cross-audit comparability with oc-1-1 + A24 + A39 baselines (which all scoped to step-01); step-01 is also where `portfolio-status` receives its primary inputs (scope dir traversal + decision-tree probing). §A41-8 v2 (≥2 steps default) applies to Production-readiness archetypes only — `portfolio-status` is decision-support, so v2 default does not bind A25.

## 3. Cell Matrix (1 skill × 7 canonical rights = 7 cells)

Binary verdict per cell. Evidence notes in §4.

| Right | Slug (per Compliance Checklist) | Verdict |
|-------|--------------------------------|---------|
| OC-R1 — Right to a default | `right-to-default` | N/A — vacuous (no operator-decision branch at step-01) |
| OC-R2 — Right to the full universe | `right-to-full-universe` | N/A — vacuous (no menu/option presentation at step-01) |
| OC-R3 — Right to rationale | `right-to-rationale` | N/A — vacuous (no operator-facing decision points at step-01) |
| OC-R4 — Right to completeness | `right-to-completeness` | ✅ PASS |
| OC-R5 — Right to pause | `right-to-pause` | N/A — vacuous (auto-transition by design; no halt marker per §A41-4 v4+) |
| OC-R6 — Right to next action | `right-to-next-action` | ✅ PASS |
| OC-R7 — Right to pacing | `right-to-pacing` | ✅ PASS (reading-dependent per §A41-5 — see §4.7 + §9.1) |

**N_effective per right (post-§A41-3 vacuous exclusion):** OC-R1=0, OC-R2=0, OC-R3=0, OC-R4=1, OC-R5=0, OC-R6=1, OC-R7=1. Total evaluable cells: 3 of 7.

**Per-skill compliance rate (N_effective basis):** 3/3 PASS = 100%. **Per-skill compliance rate (N_total basis):** 3/7 PASS, 4 vacuous, 0 FAIL. Both metrics provided per §A41-3 dual-display convention.

## 4. Evidence Notes

### 4.1 OC-R1 — Right to a default

**Verdict:** N/A — vacuous

**Evidence:** Step-01 explicitly auto-transitions to step-02 with no menu HALT (`step-01-scan.md:33`: "FORBIDDEN to load next step until presentation completes — auto-transition to Step 2 (no menu HALT here)"). No operator-decision branch exists at step-01; no choice requires a default. Per §A41-3, this is vacuous-PASS — excluded from N_effective.

### 4.2 OC-R2 — Right to the full universe

**Verdict:** N/A — vacuous

**Evidence:** Step-01 has no menu/option presentation; engine output is presented verbatim per `step-01-scan.md:10-14` ("FORBIDDEN to filter, reformat, or 'interpret' engine output"). The "universe" question (operator sees all options before choosing) requires a choice point, which step-01 does not provide. Vacuous per §A41-3.

### 4.3 OC-R3 — Right to rationale

**Verdict:** N/A — vacuous

**Evidence:** Step-01 has no operator-facing decision points requiring per-decision rationale. The only branching is engine-success-vs-error (lines 60-77), which surfaces error rationale via verbatim stderr display — but the rationale is engine-emitted, not decision-prompt-attached. Per §A41-3, no operator decision = vacuous.

### 4.4 OC-R4 — Right to completeness

**Verdict:** ✅ PASS

**Evidence:** Output framing enumerates all phase states with explicit "unknown" catch-all (`step-01-scan.md:84-89`); `Total: N artifacts | Governed: G | Ungoverned: U | Unattributed: X` (line 97) partitions the artifact universe completely; explicit lines for attributable-but-ungoverned (line 100) and unattributed (line 101) catch-all categories prevent silent drops.

### 4.5 OC-R5 — Right to pause

**Verdict:** N/A — vacuous

**Evidence:** Step-01 explicitly auto-transitions (`step-01-scan.md:33`); no operator pause point and no literal halt marker per §A41-4 v4+ requirement. Workflow's pause points are at step-02 menu (per workflow.md docstring). Vacuous per §A41-3 + §A41-4 (no halt marker present at step-01).

### 4.6 OC-R6 — Right to next action

**Verdict:** ✅ PASS

**Evidence:** Engine errors displayed verbatim (`step-01-scan.md:64-72`) preserving the engine's actionable error format (example at line 74: `taxonomy.yaml not found — run convoke-migrate-artifacts or convoke-update to create`). The HALT-permanently directive (line 76) is non-silent failure with operator next-action provided via the engine error message. **OC-R6 external-declared carve-out does NOT apply** — `portfolio-engine.js` is internal Convoke code (`scripts/lib/portfolio/portfolio-engine.js`), not externally-owned CLI; the skill remains responsible for OC-R6 and earns PASS via the engine's actionable error contract.

### 4.7 OC-R7 — Right to pacing

**Verdict:** ✅ PASS (reading-dependent per §A41-5)

**Evidence (committed reading — charitable):** Per §2.6 "interaction round = operator-input boundary", step-01 has zero operator-input boundaries (auto-transit). The OC-R7 ≤3-novel-concepts-per-round budget therefore does not apply at step-01; first interaction round occurs at step-02 menu. Concepts surfaced in step-01 operator-facing text (phase, status, next action, context re-entry hint, WIP radar, governance tuple) become pre-existing for step-02 per §workflow-inheritance rule (Checklist line 116-126). PASS.

**Alternative reading (strict):** If OC-R7 budget is applied per-step regardless of interaction-round semantics, step-01 introduces ≥4 novel concepts in welcome (phase, status, next action, context re-entry hint at line 48) plus output-framing concepts (chain-gap analysis, WIP radar, governance tuple) — exceeds ≤3 budget → FAIL. Logged in §9.1 as Rubric Ambiguity.

### 4.8 §Notes — Methodology-application observations

- **Vacuous-PASS pattern (4 of 7 cells):** display-only steps with no operator-input boundary produce vacuous cells across multiple rights (R1/R2/R3/R5). This is a structural property of scan/display archetypes, not a rubric weakness. Per §A41-3, vacuous cells are excluded from N_effective; per A25 calibration-case scope, this means A25's evaluable surface is intentionally narrow.
- **OC-R6 carve-out clarification:** `portfolio-engine.js` is internal Convoke code, not external CLI — the §"OC-R6 external-declared carve-out" does not apply. The PASS verdict rests on the engine's actionable error contract (engine emits `tool-name + remediation-command` format), preserved verbatim by step-01.
- **Reading-dependent OC-R7 (per §A41-5):** A genuine ambiguity exists in the rubric — does ≤3-novel-concepts-per-round apply at every step (strict) or only at operator-input boundaries (charitable)? Both A39 and A25 surfaced this. Logged in §9.1.

## 5. Per-Right Aggregation

Per A25 calibration-case scope (single-skill audit, N=1), no `portfolio_status_fail_rate` is computed at the per-right level (statistically vacuous at N=1). The matrix in §3 provides direct binary verdicts per right.

## 6. Cross-Audit Archetype Aggregate (per AC9 P4 — side-by-side, NOT arithmetic-summed)

**Methodology version-pinning (per §A41-13 cell-mechanism naming stability):** oc-1-1's enhance-backlog cells are v3-locked (N_total semantics, no vacuous-PASS exclusion); A25's cells are v4-evaluated (N_effective semantics applies per §A41-3). Cross-audit aggregate is **informational side-by-side, NOT arithmetic-summed** to avoid version-incommensurability.

**Side-by-side per-right table** (decision-support archetype, N=2 samples):

| Right | oc-1-1 enhance-backlog (v3 N_total) | A25 portfolio-status (v4 N_effective) | Archetype framing (N=2) |
|-------|:---:|:---:|---|
| OC-R1 — Right to a default | ✅ PASS | N/A — vacuous | enhance-backlog provides evidence; A25 vacuous (different surface — qualify-menu vs scan-only) |
| OC-R2 — Right to the full universe | ✅ PASS | N/A — vacuous | enhance-backlog covers; A25 vacuous |
| OC-R3 — Right to rationale | ✅ PASS | N/A — vacuous | enhance-backlog covers; A25 vacuous |
| OC-R4 — Right to completeness | ✅ PASS | ✅ PASS | **Both PASS — archetype consistent** |
| OC-R5 — Right to pause | ✅ PASS | N/A — vacuous | enhance-backlog covers; A25 vacuous |
| OC-R6 — Right to next action | ✅ PASS | ✅ PASS | **Both PASS — archetype consistent** |
| OC-R7 — Right to pacing | ❌ FAIL | ✅ PASS (reading-dependent) | **DIVERGENT** — see §6.1 |

**Aggregate statement:** 7 rights with N=2 archetype samples per right; 0 rights T1-eligible on aggregate (mixed v3/v4 cells per §A41-13; A25 has 4 vacuous cells per §A41-3 v4 semantics, oc-1-1 used v3 N_total). Single-sample-with-COI dependency **broken on archetype-diversity dimension** (decision-support for backlog vs portfolio prioritization — distinct decision-support functions); **operator-author dependency persists** (both samples Amalik-authored per §8 disclosure).

### 6.1 OC-R7 divergence — archetype insight

**The R7 verdict divergence is structurally meaningful, not a rubric inconsistency.** enhance-backlog's R7 FAIL came from the **qualify-menu concept density** (oc-1-1 §3.6 evidence: "qualify menu presents 5 lane × 4 score factors = ≥3 novel concepts in a single round"). A25's R7 PASS comes from **step-01 having zero operator-input boundaries** (auto-transit display step) — the interaction-round budget doesn't apply where there's no interaction round.

**Implication:** R7 violations cluster in **operator-decision-rich UX** (menus, multi-field forms), not in **display-only UX** (scan-and-present steps). For Epic 2 Story 2.1 retrofit prioritization, this is actionable evidence: R7 retrofit pattern should target menu/form-density steps, not display-density steps.

### 6.2 Compliance rates (informational; not for cross-audit T1 evaluation per §A41-13)

- **enhance-backlog (v3 N_total):** 6/7 PASS = 86%
- **portfolio-status (v4 N_effective basis):** 3/3 PASS = 100% (4 vacuous excluded per §A41-3)
- **portfolio-status (v4 N_total basis):** 3/7 PASS, 4 vacuous, 0 FAIL

## 7. Implications

### 7.1 Reproducibility — A10 GATE CLEARED

**A10 selection per §A41-6 escape clause** (A25's matrix has 0 reading-dependent and 0 borderline cells; per escape clause, next-best composition selected): OC-R7 (FAIL-expected per main auditor pre-gate prediction) + OC-R4 (PASS) + OC-R6 (PASS) = 1 expected-FAIL + 2 expected-PASS, documented escape from §A41-6 strict composition rule.

**Result:** 3/3 pairwise reviewer agreement — **A10 GATE CLEARED at 100%**.

| Cell | Reviewer #1 verdict | Reviewer #2 verdict | Main auditor pre-gate | Agreement |
|---|---|---|---|---|
| OC-R7 | PASS (reading-dependent) | PASS | FAIL (mispredicted) | ✅ Reviewers agree PASS |
| OC-R4 | PASS | PASS | PASS | ✅ |
| OC-R6 | PASS | PASS | PASS | ✅ |

**Misprediction logged (per Compliance Checklist line 269 — calibration signal, NOT counted against gate threshold):** Main auditor predicted OC-R7 FAIL under strict per-step concept counting. Both blind reviewers identified the §2.6 "interaction round" semantics make step-01 OC-R7 budget moot (no operator-input boundary at step-01). Per §A41-5, OC-R7 verdict committed to PASS (reviewer-charitable reading); strict alternative documented in §4.7 + §9.1.

**Honest caveat (per A24 §7.1 honest-limitations #1):** same-model LLM reviewers share base training; agreement validates rubric unambiguity *for LLMs*, not against human judgment.

**Comparison to A39:** A39's A10 cleared at 1/3 (gate did not clear under v3 expectations). A25's A10 cleared at 3/3 — significantly better. Likely explanation: A25's 3 selected cells (OC-R4 enumeration, OC-R6 actionable error, OC-R7 reading-dependent) had clearer rubric mapping than A39's compound-mechanism cells.

### 7.2 Decision-support archetype baseline status

- **Pre-A25:** N=1 (enhance-backlog only; with disclosed COI)
- **Post-A25:** N=2 (enhance-backlog + portfolio-status)
- **Single-sample-with-COI dependency:** **broken on archetype-diversity dimension** (two distinct decision-support functions: backlog management + portfolio prioritization)
- **Operator-author dependency:** **persists** (both samples Amalik-authored)
- **T1 trigger threshold (N≥3):** still not met for archetype-level fail rates; A25 does NOT unblock archetype-level T1 evaluation

### 7.3 Publication Gate readiness (Story 2.3 — input only, no commitment here)

A25 is a calibration-case audit per §A41-12, NOT a portfolio audit per §A41-9. **Gate-counting status pending §A41-9 clarification** — does §A41-9 admit single-skill calibration audits toward the Publication Gate's ≥2-portfolio threshold, or only multi-skill portfolio audits? Without clarification, A25's contribution to Publication Gate readiness is **archetype-baseline-strengthening only**, not portfolio-coverage-counting.

If §A41-9 admits calibration audits: A25 + oc-1-1 + A24 (Vortex) + A39 (Gyre) = 4 distinct audited surfaces, gate would clear on coverage breadth.

If §A41-9 only counts portfolio audits: A25 + A24 + A39 = 3 portfolio audits (oc-1-1 is the methodology source-of-truth per Checklist line 374, doesn't count); gate would still clear on coverage breadth.

### 7.4 Retrofit candidates from A25

**None.** A25 produced 0 FAIL verdicts on evaluable cells (3/3 PASS). Per A25 calibration-case scope (single-skill audit, no archetype-level T1 trigger), no retrofit cascade is initiated by A25.

The cross-audit OC-R7 divergence (§6.1) is an **insight for existing retrofit work** (Epic 2 Story 2.1 should target menu/form-density UX, not display-density UX) — it does not add new retrofit cells.

## 8. Conflict-of-Interest Disclosure

### 8.1 Operator-author COI

- **`bmad-portfolio-status/step-01-scan.md`:** authored single-commit by Amalik (operator) on 2026-04-08 (commit 8db298ee). Single-author single-day operator-facing surface — same shape as A39 Gyre.
- **`bmad-portfolio-status/SKILL.md`:** authored by Amalik 2026-04-08 (commit aa36f336, prior commit d15459f3 same day).
- Disclosed at significant severity per A39 Gyre precedent.

### 8.2 Auditor COI

- Claude (auditor) has NOT authored or edited any `bmad-portfolio-status` workflow files (verified via `git log --follow`).
- Auditor authored A25 spec + this report in the same session — methodology-frame COI disclosed.
- Auditor authored §A41-Clarifications in the Compliance Checklist (concurrent ship 2026-04-25) — meta-COI: auditor is applying rubric clarifications they themselves authored. Mitigation: A10 reproducibility gate per §A41-6 (cleared at 3/3); blind reviewer agreement validates rubric reproducibility independent of auditor judgment.

### 8.3 Cross-audit COI

**Verified 2026-04-25:** `git log --follow _bmad/bme/_enhance/workflows/initiatives-backlog/` shows enhance-backlog is **also Amalik-authored** (commits 2026-04-15 + 2026-04-18). **Both samples are operator-authored (Amalik).** A25 does NOT break the single-author dependency.

The COI break is on **archetype-diversity dimension** (decision-support for backlog management vs portfolio prioritization — distinct decision-support functions), NOT on author-independence dimension. Auditor COI (Claude) is identical across both samples.

**COI Mitigation Tier (per §A41-10):** Tier-0 (disclosure-only). No external review (Tier-2) added — single-skill calibration-case audits do not warrant the Tier-2 escalation cost. If Story 2.3 Publication Gate review demands stronger COI mitigation for the decision-support archetype claim, escalate to Tier-1 (blind sub-reviewers — already executed via A10) or Tier-2 (external review) at that gate, not at A25 ship.

## 9. Rubric Ambiguities Surfaced (per §A41-5 v4+ requirement)

### 9.1 OC-R7 interaction-round semantics (DISPUTED — reading-dependent per §A41-5)

**Issue:** Does ≤3-novel-concepts-per-round apply at every step, or only at operator-input boundaries?

**Charitable reading (committed in §4.7):** Per §2.6 "interaction round = operator-input boundary". Steps without operator-input boundaries (auto-transit / display-only steps) have zero rounds → OC-R7 budget does not apply at those steps. Concepts introduced in such steps are pre-existing for downstream steps per workflow-inheritance rule. Verdict: PASS for step-01.

**Strict reading (alternative documented):** OC-R7 budget applies per-step regardless of interaction-round semantics; step-01's operator-facing text introduces ≥4 novel concepts → FAIL.

**Surface:** Both A39 and A25 hit this ambiguity. A39's matrix had similar reading-dependent cells. The rubric (§2.6) defines "interaction round" but doesn't explicitly resolve the per-step-vs-per-boundary question for display-only steps.

**Proposed resolution path:** Add explicit clarification to §2.6 OR add §A41-14 sub-clarification: "OC-R7 budget applies per interaction round; steps without operator-input boundaries are vacuous for OC-R7 (concepts surfaced become pre-existing for downstream steps via workflow-inheritance)."

**Backlog action:** Log as A25-deferred intake for §A41 future-revision input.

### 9.2 §A41-9 portfolio-vs-calibration audit Publication Gate counting

**Issue:** Does §A41-9 admit single-skill calibration-case audits (per §A41-12) toward the Publication Gate's ≥2-portfolio coverage threshold, or only multi-skill portfolio audits?

**Surface:** A25 is the first single-skill calibration audit shipped post-A41. The §A41-9 portfolio audit definition doesn't explicitly address calibration-case audits.

**Impact:** A25's gate-counting status is pending §A41-9 clarification per §7.3.

**Proposed resolution path:** §A41-9 author (Winston, per A41+A42 ship) to clarify whether calibration-case audits count.

**Backlog action:** Log as A25-deferred intake → already partially captured in IN-136 family (gate-counting clarifications).

## 10. Activity Log

- **2026-04-25 09:00** Spec V-pass R1: 10 patches applied (P1-P10) per adversarial + edge-case parallel review
- **2026-04-25 12:00** Mid-execution finding: A25 spec used non-canonical 7-rights list (3 of 7 fictitious — Right to revoke / Right to a sound mental model / Right to non-blocking failure are NOT canonical); halted execution, surfaced to operator
- **2026-04-25 12:15** Operator selected Option 1 (correct + re-execute); P11 patch applied to spec replacing fictitious rights with canonical OC-R1..OC-R7
- **2026-04-25 12:30** 7 cells re-scored under canonical rights: 4 vacuous (R1, R2, R3, R5), 3 evaluable (R4 PASS, R6 PASS, R7 PASS reading-dependent)
- **2026-04-25 12:45** A10 R2 executed: 2 Explore Agent subagents in parallel, blind to each other and main verdict; 3 cells (R7, R4, R6) selected per §A41-6 escape clause (no borderline cells in matrix); 3/3 reviewer agreement → A10 GATE CLEARED at 100%
- **2026-04-25 13:00** Cross-audit aggregate computed (oc-1-1 enhance-backlog + A25 portfolio-status, side-by-side per AC9 P4); R7 divergence identified as archetype insight (menu-density vs display-density UX)
- **2026-04-25 13:15** Report drafted; §9 ambiguities logged for future §A41 revision
- **2026-04-25 13:30** Report saved + convoke-doctor gate to be run; backlog update pending
