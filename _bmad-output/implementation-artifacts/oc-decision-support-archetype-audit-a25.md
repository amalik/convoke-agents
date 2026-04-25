# A25: Decision-Support Archetype Audit Supplement (IN-13)

Status: **Draft 2026-04-25 — V-pass R2 complete (P11 canonical-rights correction applied)** — ready for dev execution under canonical OC-R1..OC-R7

**Epic:** [P21 Convoke Operator Covenant — Epic 2](../planning-artifacts/convoke-epic-operator-covenant.md) (input artifact for Story 2.3 Publication Gate baseline robustness — breaks the single-sample-with-COI dependency on `enhance-backlog` in oc-1-1 baseline)
**Origin:** IN-13 — oc-1-1 Round 3 Acceptance Auditor (2026-04-18): "Decision-support archetype undersampled — oc-1-1 had only 1 decision-support skill (enhance-backlog) which also carried COI disclosure. Add 1 more decision-support skill to v2 Covenant audit baseline."
**Sprint:** Parallel to v6.3.3 (Marketplace) — pure content work, zero code-collision surface
**Namespace decision:** No new skills or `_bmad/bme/` content. Output is a new supplement report at `_bmad-output/planning-artifacts/`. The `namespace-decision-for-new-skills` rule from [project-context.md](../../project-context.md) is N/A by construction. The `covenant-compliance-for-convoke-skills` rule is also N/A — this story authors *about* the `bmad-portfolio-status` skill but does not modify it.
**Safety analysis (path-safety rule):** N/A — no scripts, no destructive operations. Read-only access to [`_bmad/bme/_artifacts/workflows/bmad-portfolio-status/`](../../_bmad/bme/_artifacts/workflows/bmad-portfolio-status/) and write-only to a new supplement report file under `_bmad-output/planning-artifacts/`.

## Story

As a Convoke contributor preparing P21 Epic 2 Story 2.3 Publication Gate clearance,
I want a second decision-support archetype audit (1 Convoke-owned skill × 7 Operator Rights = 7 cells) using the locked methodology (oc-1-1 §2.3/§2.4/§2.6 + A10 reproducibility gate where applicable + A28 Step Selection),
so that the v2 Covenant baseline does not rest on a single COI-flagged decision-support sample (`enhance-backlog`), and the Publication Gate's archetype-coverage robustness can be defended against the methodological objection that one-sample-with-COI is insufficient evidence for the decision-support archetype claims in the oc-1-1 baseline.

## Context & Motivation

**Why now:**
- IN-13 logged this gap from oc-1-1 Round 3 (2026-04-18). At that time the only decision-support skill in the audit was `bmad-enhance-initiatives-backlog` (enhance-backlog), which also carried COI disclosure (Acceptance Auditor: same author for the skill and the audit). The v1 baseline thus rests on a *single sample with disclosed COI* for the decision-support archetype — a weak evidence position for any external publication claim about the archetype's Covenant compliance.
- v2 baseline (Vortex via A24, Gyre via A39) added breadth across teams but did NOT remediate the decision-support archetype undersampling. A25 is the targeted fix.
- Methodology locked per Compliance Checklist as of A25 spec V-pass on 2026-04-25, incorporating A41+A42 amendments (which shipped concurrently). Stack: A28 Step Selection v2 (§A41-8 — applies to Production-readiness archetypes only; portfolio-status is decision-support, so step-01 scope is in-scope), A29 Skill Selection + §A41-12 single-skill exemption (calibration-case audits qualify), A10 reproducibility gate per §A41-6 cell composition rule. A25 is locked-methodology application — not methodology revision. **(P2 patch 2026-04-25: temporal anomaly fix — original spec said "locked 2026-04-20", but A41+A42 shipped 2026-04-25; the methodology lock is concurrent with A41 ship, not retroactive.)**
- **Code-collision avoidance:** v6.3 Epic 3 (Marketplace) is touching `scripts/update/migrations/`, `scripts/portability/`, and `.claude-plugin/` — A25 touches none of these. Pure content work.

**Why `bmad-portfolio-status` (operator-confirmed pick 2026-04-25):**
The original IN-13 framing suggested CIS skills (`creative-problem-solver` / `innovation-strategy`), but those live at `_bmad/cis/` (upstream BMAD), not `_bmad/bme/` (Convoke-owned). Per the modules-ownership rule, Covenant audits should target Convoke-owned content; cross-module-scope expansion is a separate methodology question. **IN-13 acceptance acknowledgment:** modules-ownership discipline overrides IN-13's CIS framing; if oc-1-1 Acceptance Auditor objects post-ship to the CIS→Convoke substitution, log as follow-up intake (not a blocker for A25 execution). `bmad-portfolio-status` is the cleanest Convoke-owned decision-support archetype:

- Located at [`_bmad/bme/_artifacts/workflows/bmad-portfolio-status/`](../../_bmad/bme/_artifacts/workflows/bmad-portfolio-status/) — explicitly Convoke-owned
- Decision-support function: 3-step guided conversation (scan → explore → recommend) that helps the operator decide what to work on next across the initiative portfolio
- Distinct from `enhance-backlog` (which is decision-support for *backlog management* itself); `portfolio-status` is decision-support for *initiative prioritization*
- COI risk: Claude (auditor) has not authored the `bmad-portfolio-status` workflow files; sole author per `git log` is Amalik (operator) on 2026-04-08 — same operator-author shape as A39 Gyre, manageable via §8 disclosure. **(P1 patch 2026-04-25: enhance-backlog also Amalik-authored per `git log --follow _bmad/bme/_enhance/workflows/initiatives-backlog/` verified 2026-04-25; same-author across both samples — see AC12 for COI framing correction.)**

**Why the audit is small (7 cells, not 28):**
A25's purpose is to *break the single-sample-with-COI dependency* in oc-1-1's decision-support archetype, not to re-audit a team. One additional skill audited × 7 rights = 7 cells is sufficient evidence to support or refute the claim "decision-support archetype findings in v2 baseline rest on >1 sample". RICE 3.2 (R:4 I:1 CF:80% E:1) reflects this scoped scope.

## Acceptance Criteria

**AC1 — Methodology reuse, not revision.** The audit applies §2.3 scoring scheme (strict binary PASS/FAIL, no partial credit) + §2.4 per-right rubric + §2.6 novel-concept glossary from [convoke-report-operator-covenant-audit-2026-04-18.md](../planning-artifacts/convoke-report-operator-covenant-audit-2026-04-18.md) verbatim, **plus** the A41-Clarifications (§A41-1..§A41-13) from [convoke-spec-covenant-compliance-checklist.md](../planning-artifacts/convoke-spec-covenant-compliance-checklist.md). If a rubric ambiguity surfaces, it is recorded as a backlog intake (not resolved in-story). Same constraint A24 + A39 carried.

**AC2 — Audit findings reference rights by name** (e.g., "Right to pacing"), not number — same rule as oc-1-1 AC #2 and A24/A39 AC #2.

**AC3 — Scope: 1 Convoke-owned decision-support skill audited.** The audit covers:
- `bmad-portfolio-status` ([_bmad/bme/_artifacts/workflows/bmad-portfolio-status/](../../_bmad/bme/_artifacts/workflows/bmad-portfolio-status/) — decision-support archetype; locked 2026-04-25 — see Pre-Author Decision 1 in Dev Notes for the CIS-vs-Convoke-owned scope analysis and the resolved trade-off)

The pick is the **second decision-support sample** for the v2 baseline (first sample: `bmad-enhance-initiatives-backlog` per oc-1-1). Per A29 §single-skill exemption (Compliance Checklist §A41-12 — explicitly includes "calibration-case audits"), a single-skill calibration-case audit does NOT need to declare structural-dimension variation since variation requires ≥2 picks. **(P6 patch 2026-04-25: reframed Selection Intent from "Targeted Gap-Fill" to "Calibration-Case Audit" — calibration-case is the §A41-12 explicit category that admits A25's N=1; "gap-fill" was an unfit term that risked scope-creeping the exemption.)** The report's §2 must instead declare:
1. The justification for single-skill scope (calibration-case audit per §A41-12 — breaking the single-sample-with-COI dependency in oc-1-1 baseline; specific archetype gap, not breadth claim).
2. The classification of the pick (decision-support archetype).
3. The disclosure that single-skill scope means **no archetype-cluster claim** is made — A25 is a *calibration-case* sample, not a representative-pattern audit.

**AC4 — Unit of analysis matches oc-1-1 §2.2 + A28 Step Selection rule.** Per A28 v1 ("each picked skill's audit MUST cover ≥2 steps OR explicitly scope to single step with documented rationale") and A28 v2 / §A41-8 ("≥2 steps default for Production-readiness archetypes only" — portfolio-status is decision-support, NOT Production-readiness, so A28 v2 default does not bind A25): A25 scopes to **step-01** (`step-01-scan.md`) for `bmad-portfolio-status` with the documented rationale "cross-audit comparability with oc-1-1 + A24 + A39 baselines (which all scoped to step-01); step-01 is also where `portfolio-status` receives its primary inputs (scope dir traversal + decision-tree probing) and where workflow-level concept load concentrates per the A39 pattern." This rationale is **not** the explicitly-forbidden circular reasoning ("step-01 is the highest-concept-density step"); it is cross-audit comparability + receipt-point reasoning.

**(P5 patch 2026-04-25 — empirical-validation fallback):** If during Task 3 (representative-step identification) the step-01 representativeness rationale is invalidated empirically (e.g., decision-support function actually concentrates in step-03-recommend; step-01 is pure data-gathering with no operator-decision branches for some rights), surface as Decision-Needed at execution time: re-scope to ≥2 steps per §A41-3 deferral-resolution mechanism. **Important:** §A41-3 specifies that additional steps must introduce R-relevant operator-decision branches to lift N_effective; data-loading-only steps don't lift N_effective regardless of count. If step-01 vacuous-PASS cells are encountered (right has no error surface at the scan step), the Task 4 cell scoring records them as `N/A — vacuous (step-01 has no operator-decision branch for this right)` and the §6 cross-audit aggregate counts them per §A41-3 (excluded from N_effective).

**AC5 — Each workflow × right cell produces a binary PASS / FAIL verdict** with a ≤ 2-sentence evidence note citing specific file references and behaviors (no partial-credit language, no "reading-dependent" partial-credit-shaped constructs per §A41-4). 7 cells total. 0 N/A unless explicitly justified per cell with one of the §A41 N/A variants (`out-of-scope`, `external-declared`, `vacuous-no-error-surface`, `conditional-<branch>`).

**AC6 — §Notes section captures methodology-application observations** that don't belong in evidence notes (e.g., compound-concept counting, vacuous-PASS pattern instances, decision-support-specific concept-load patterns). §A41-1 (compound-mechanism evidence-note convention) applies if any cell scoring requires multi-mechanism reasoning.

**AC7 — Output report saved** at `_bmad-output/planning-artifacts/convoke-report-operator-covenant-audit-decision-support-supplement-YYYY-MM-DD.md` with governance frontmatter `initiative: convoke`, `artifact_type: report`, `created: 'YYYY-MM-DD'`, `schema_version: 1` — **matching A24/A39 report frontmatter exactly** (no `qualifier` field; the qualifier `operator-covenant-audit-decision-support-supplement` is filename-encoded only per the convention `{initiative}-{artifact_type}[-{qualifier}]-{date}.md` from [taxonomy.yaml:25](../../_bmad/_config/taxonomy.yaml#L25)). `npx convoke-doctor` must pass on the saved file.

**AC8 — Per-right verdict recorded** — for each of the 7 rights, the report emits the cell verdict (PASS / FAIL) with evidence note. Single-skill scope means there is **no `portfolio_status_fail_rate` aggregate** computed (would be 0/1 or 1/1 per right, statistically vacuous); the value of A25 is per-cell binary evidence on a Convoke-owned decision-support skill, not a rate. **(P9 patch 2026-04-25 — distribution edge-case framing):** If 7/7 PASS, §Implications notes "single-sample all-PASS for portfolio-status; not archetype-wide claim (N=1 calibration-case)"; if 7/7 FAIL, §Implications notes "single-skill anomaly requiring skill-level retrofit; archetype T1 status remains §A41-9 deferred" (single-skill calibration cannot itself trigger archetype-level T1).

**AC9 — T1 trigger applicability + cross-audit version-pinning.** A25 is a single-skill calibration-case audit (N=1 per right), so per [Epic 2 retrofit trigger rule](../planning-artifacts/convoke-epic-operator-covenant.md) "T1 fires at <70% compliance for cells with N≥3", T1 does not fire on A25 alone. A25 results **feed into the cross-audit aggregate** for the decision-support archetype: oc-1-1's `enhance-backlog` 7 cells + A25's portfolio-status 7 cells = 14 cells across N=2 samples per right.

**(P4 patch 2026-04-25 — version-pinning explicit):** Per §A41-13 cell-mechanism naming stability and §A41-3 vacuous-PASS N_effective rule, oc-1-1's enhance-backlog cells are v3-locked (N_total semantics, no vacuous-PASS exclusion); A25's cells are v4-evaluated (N_effective semantics applies). The cross-audit aggregate is **informational side-by-side, NOT arithmetic-summed** to avoid version-incommensurability. Per-right report shows: (oc-1-1 v3 verdict | A25 v4 verdict | qualitative N=2 archetype claim). T1 is **not evaluable on the aggregate** (mixed-version cells; arithmetic combination would conflate v3 N_total with v4 N_effective).

Report §Implications must explicitly state: "decision-support archetype baseline now rests on 2 samples (was 1); T1 trigger threshold (N≥3) still not met for the archetype; single-sample-with-COI dependency on the archetype-diversity dimension is broken (decision-support for backlog vs portfolio prioritization), though the operator-author dependency persists (per AC12 P1 — both samples Amalik-authored)."

**AC10 — A10 Reproducibility Pass executed (PAD 2 RESOLVED at V-pass; §A41-6 escape clause invoked per P11 outcome).** A10 baseline rule: "≥3 cells with independent reviewer agreement at 100%". A25 has 7 cells total — sufficient population for A10 sampling (3 of 7 cells). Per A41-Clarifications §A41-6 (A10 cell-composition rule), select 3 cells covering one expected-PASS (must be reading-dependent or borderline, NOT stable-PASS, per §A41-6), one expected-FAIL, one borderline. **(P3 patch 2026-04-25: PAD 2 resolved at V-pass — Option A locked.)** A25 executes A10 with the same Explore-subagent blind-pair pattern as A39, for methodology consistency. If A10 fails (1/3 or 2/3 agreement, mirroring A39's outcome), the verdict is marked provisional per A39 §1 headline precedent — provisional verdict still satisfies AC9's archetype-N=2 claim because "N=2" is a count of audited samples (not a quality assertion); A10 reproducibility quality is a separate axis from sample count. **§A41-6 escape clause WILL apply (per P11 corrected matrix):** A25's canonical-rights matrix has 4 vacuous cells + 2 stable-PASS + 1 stable-FAIL — zero reading-dependent and zero borderline. Per §A41-6 escape clause, document the escape in §7.1 and select 3 cells using next-best composition: OC-R7 (FAIL) + OC-R4 (PASS) + OC-R6 (PASS) = 1 FAIL + 2 PASS.

**AC11 — Initiatives-backlog log entry** — on completion, add a 2026-MM-DD row to the backlog §2.5 Completed lane summarizing: skill audited, per-right verdicts, archetype baseline aggregate (oc-1-1 enhance-backlog + A25 portfolio-status side-by-side per AC9 P4), A10 outcome (executed per AC10 P3), and **gate-counting status pending §A41-9 (portfolio audit definition)** — A25 is N=1 single-skill calibration audit; §A41-9 needs to clarify whether single-skill calibration audits count toward Publication Gate's ≥2-portfolio threshold or only multi-skill portfolio audits count. **(P7 patch 2026-04-25 — specifies §A41-9 as the blocking rule, not the prior generic "pending A41".)** Move A25 from §2.3 Fast Lane → §2.5 Completed.

**AC12 — Conflict-of-Interest disclosure.** §8 disclosure required:
- **Operator-author COI:** `git log --follow` per file (verified 2026-04-25): `bmad-portfolio-status/step-01-scan.md` authored single-commit by Amalik (operator) 2026-04-08; SKILL.md authored by Amalik 2026-04-08. Single-author single-day operator-facing surface, same shape as A39 Gyre disclosure.
- **Auditor COI:** Claude (auditor) has NOT authored or edited `bmad-portfolio-status/step-01-scan.md` or `SKILL.md` (verified via git log). Auditor authored A25 spec + report same session — methodology-frame COI disclosed.
- **(P1 patch 2026-04-25 — false-claim correction)** **Cross-audit COI:** A25 supplements oc-1-1's decision-support archetype findings, where the only prior sample (`enhance-backlog`) carried COI disclosure (skill author). **Verified 2026-04-25:** `git log --follow _bmad/bme/_enhance/workflows/initiatives-backlog/` shows enhance-backlog is **also Amalik-authored** (commits 2026-04-15 + 2026-04-18). Both samples are operator-authored (Amalik). **A25 does NOT break the single-author dependency.** The COI break is in **archetype diversity** (decision-support for backlog management vs decision-support for portfolio prioritization), not author independence. Auditor COI (Claude) is identical across both samples; disclosed at **Tier-0 (disclosure-only)** per §A41-10 COI Mitigation Tier Taxonomy. No external review (Tier-2) added — single-skill calibration-case audits do not warrant the Tier-2 escalation cost; if Story 2.3 Publication Gate review demands stronger COI mitigation for the decision-support archetype claim, escalate to Tier-1 (blind sub-reviewers) at that gate, not at A25 ship.

## Tasks / Subtasks

### Task Dependency Matrix (scannable execution order)

| # | Task | Depends on | Primary input | Primary output | AC ref |
|---|---|---|---|---|---|
| 0 | Pre-check workflow file | none | `_bmad/bme/_artifacts/workflows/bmad-portfolio-status/steps/step-01-scan.md` | confirm exists (verified 2026-04-25 — 131 lines) | AC3, AC4 |
| 1 | ✓ Pre-Author Decision 1 (skill pick) | none | Dev Notes table | locked: `bmad-portfolio-status` (resolved 2026-04-25) | AC3 |
| 2 | A29 single-skill scope declaration | T0, T1 | `bmad-portfolio-status` SKILL.md + workflow.md | report §2: single-skill justification + classification + no-cluster-claim disclosure | AC3 |
| 3 | Identify representative step | T0 | workflow `steps/` dir | step-01-scan.md path + rationale | AC4 |
| 4 | Score 1 workflow × 7 rights | T3, oc-1-1 §2.3/§2.4/§2.6 + §A41-Clarifications | step-01-scan.md | 7 cells (PASS/FAIL + ≤2-sentence evidence) | AC5, AC6 |
| 5 | Per-right verdict table | T4 | 7-cell matrix | report §5: per-right cell verdicts (no rate column for N=1) | AC8 |
| 6 | Cross-audit archetype aggregate | T5, oc-1-1 enhance-backlog 7 cells | A25's 7 cells + oc-1-1's 7 cells | report §6: combined N=2 archetype baseline per right; T1 not triggered (N<3); single-sample-with-COI dependency-broken statement | AC9 |
| 7 | Draft §Implications | T6, A24/A39 §6.1 patterns | retrofit catalogue, T6 output | §Implications prose (cross-audit aggregate insights, archetype gap status) | AC9 |
| 8 | A10 Reproducibility Pass (optional per AC10) | T4 (cells exist) | 3 selected cells (PASS/FAIL/borderline per §A41-6) | report §7.1 results table + convergence verdict | AC10 |
| 9 | §8 Conflict-of-Interest disclosure | T0 (workflow files known) | git log --follow on workflow files | §8 prose (operator-author + auditor + cross-audit COI) | AC12 |
| 10 | Save report + doctor gate | T2-T9 (report drafted) | report file | committed report; convoke-doctor pass | AC7 |
| 11 | Update initiatives backlog | T10 | backlog A25 row | §2.5 Completed move + activity-log row | AC11 |

### Task details

- [ ] **Task 0: Pre-check workflow file existence** — verified 2026-04-25 during spec authoring: step-01-scan.md exists, 131 lines.
- [ ] **Task 1: ~~Confirm Pre-Author Decision 1 (skill pick)~~** — RESOLVED 2026-04-25 → `bmad-portfolio-status` (operator-confirmed Option C). Trade-off documented in Dev Notes Pre-Author Decision 1.
- [ ] **Task 2: A29 single-skill scope declaration** (AC3 §2 of report) — declare: "**Selection Intent: Targeted Gap-Fill** — single Convoke-owned decision-support sample to break single-sample-with-COI dependency in oc-1-1 baseline; per A29 §single-skill-exemption (Compliance Checklist §A41-12), no structural-dimension variation declared (variation requires ≥2 picks); no archetype-cluster claim made — A25 is targeted gap-fill, not representative-pattern audit."
- [ ] **Task 3: Identify representative step** (AC4) — `step-01-scan.md` selected; rationale per AC4: cross-audit comparability with oc-1-1 + A24 + A39 baselines (all step-01) + receipt-point for primary inputs (scope dir traversal + decision-tree probing).
- [ ] **Task 4: Score 1 workflow × 7 rights** (AC5, AC6) — **(P11 patch 2026-04-25 — CRITICAL canonical-rights correction)** produce 7-cell matrix scoring `bmad-portfolio-status` step-01 against the **canonical 7 rights from Compliance Checklist lines 90-96** (NOT the fictitious list in earlier draft):
  - **OC-R1** Right to a default — each decision point includes a default value
  - **OC-R2** Right to the full universe — operator sees all options before choosing
  - **OC-R3** Right to rationale — each decision point includes ≥1 sentence of rationale
  - **OC-R4** Right to completeness — operator can see all options/cases enumerated (no truncation, exhaustive coverage)
  - **OC-R5** Right to pause — operator can halt/pause at decision points (per §A41-4 v4+ literal halt marker required)
  - **OC-R6** Right to next action — errors tell the operator what to do (actionable next-action surface)
  - **OC-R7** Right to pacing — ≤3 novel concepts per interaction round per §2.6 + §A41-2 hybrid count rule

  Each cell PASS/FAIL with ≤2-sentence evidence citing `step-01-scan.md:line` references. Document any compound-mechanism cells per §A41-1 evidence-note convention. **(Earlier draft listed Right to revoke / Right to a sound mental model / Right to non-blocking failure — these are NOT in the canonical Covenant rubric and were author-error from memory; corrected in P11.)**

- [ ] **Task 5: Per-right verdict table** (AC8) — report §5 emits per-right cell verdict (PASS/FAIL) + evidence note. NO rate column (N=1; single-cell aggregates are vacuous).
- [ ] **Task 6: Cross-audit archetype aggregate** (AC9) — **(P8 patch 2026-04-25 — compute mechanic explicit)** Produce a side-by-side per-right table (rows = 7 rights; columns = oc-1-1 v3 verdict | A25 v4 verdict | qualitative N=2 framing). **Do NOT sum cells** (per AC9 P4 version-mismatch — v3 N_total and v4 N_effective are not commensurable). Output statement: "7 rights with N=2 archetype samples per right; 0 rights T1-eligible on aggregate (mixed v3/v4 cells); single-sample-with-COI dependency broken on archetype-diversity dimension, NOT on author-diversity dimension (both samples Amalik-authored per AC12 P1)." If A25's matrix introduces vacuous-PASS cells per §A41-3, the side-by-side table flags them as `N/A — vacuous (v4 §A41-3)` in the A25 column; oc-1-1 column stays at v3 N_total per version-pinning.
- [ ] **Task 7: Draft §Implications section** — cover: archetype gap status (N=2, not yet T1-eligible), cross-audit COI assessment (operator-author both samples — not auditor-author), retrofit candidates (only if A25 cells fail; no auto-cascade from A25 alone), Publication Gate readiness implication for Story 2.3 (decision-support archetype defensibility increased; archetype-level T1 still requires N≥3 — A25 does not unblock that gate).
- [ ] **Task 8: A10 Reproducibility Pass** (AC10) — operator-decision: execute (Option A) or skip (Option B). Default Option A: spawn 2 Explore Agent subagents in parallel, blind to each other and main audit; score 3 cells (one expected-PASS, one expected-FAIL, one borderline per §A41-6). Honest caveat: A39's A10 1/3 outcome shows the gate is hard to clear; A25 may inherit that outcome.
- [ ] **Task 9: §8 Conflict-of-Interest disclosure** (AC12) — `git log --follow` per file; cross-reference oc-1-1 enhance-backlog author for cross-audit COI assessment.
- [ ] **Task 10: Save report** (AC7) — report saved at `_bmad-output/planning-artifacts/convoke-report-operator-covenant-audit-decision-support-supplement-2026-04-25.md`. Frontmatter shape matches A24/A39 (no `qualifier` field; initiative=convoke + artifact_type=report + created + schema_version per taxonomy.yaml registered values). `npx convoke-doctor` must pass.
- [ ] **Task 11: Update initiatives backlog** (AC11) — A25 row moved §2.3 Fast Lane (status `Backlog`) → §2.5 Completed. Activity-log row content per report §10 includes per-right verdicts, cross-audit aggregate, A10 outcome, COI summary, gate-counting status PENDING A41.

## Dev Notes

### Pre-Author Decision 1: Skill pick (RESOLVED 2026-04-25)

**Question:** Which decision-support skill to audit as the second sample?

**Options considered:**

| Option | Pick | Pros | Cons | Resolution |
|---|---|---|---|---|
| A | `bmad-cis-problem-solving` (CIS upstream) | Matches IN-13 original framing; clean decision-support archetype | Cross-module scope expansion (`_bmad/cis/` is upstream BMAD, not `_bmad/bme/`); audits non-Convoke content | Rejected — violates modules-ownership rule |
| B | `bmad-cis-innovation-strategy` (CIS upstream) | Same as A | Same as A | Rejected — same reason |
| C | `bmad-portfolio-status` (`_bmad/bme/_artifacts/`) | **Convoke-owned**; decision-support function (initiative priority decisions); preserves modules-ownership discipline; zero auditor-COI | Diverges from IN-13's original CIS pick; "decision-support" classification needs justification (provided in Context & Motivation) | **SELECTED** |

**Rationale for Option C:**
1. Stays inside `_bmad/bme/` — preserves modules-ownership rule
2. Genuine decision-support function: `portfolio-status` drives "what should I work on next" decisions across the initiative portfolio; analogous to how `enhance-backlog` drives "what should the backlog look like" decisions
3. Zero COI risk for auditor (Claude has not authored portfolio-status workflow)
4. Sets precedent: v2 baseline = audit only Convoke-owned content; cross-module-scope expansion to upstream BMAD is a separate methodology question (logged as future intake if needed)

**Operator confirmation:** 2026-04-25 (operator selected Option C in spec V-pass conversation).

### Pre-Author Decision 2: A10 execute vs skip (RESOLVED 2026-04-25 → Option A per P3)

**Question:** Should A25 execute the A10 Reproducibility Pass, or skip it as out-of-scope for a single-skill targeted gap-fill?

**Trade-off considered:**
- **Execute (Option A) — SELECTED:** methodology consistency with A39; honest signal of LLM-rubric-application reliability for portfolio-status; risk: A39's A10 1/3 outcome suggests the gate is hard to clear, A25 may inherit that result and produce a "provisional" verdict (same shape as A39 §1) — accepted.
- **Skip (Option B) — REJECTED:** justified by AC9 (A25 is not a rate-claim audit — single-skill, no T1 trigger); avoids A10 fail noise; clean gate-counting framing as "calibration, not standalone audit"; risk: weakens A25's defensibility against external reviewers asking "did you re-verify reproducibility on the supplement?"

**Resolution rationale:** Per V-pass P3 patch (Adversarial #5 + EC #1 — spec-lock violation if deferred to execution time): methodology consistency with A39 outweighs the avoidance of provisional-verdict noise. A25 ships with A10 executed. If A10 fails (1/3 or 2/3), provisional verdict is logged and AC9's archetype-N=2 claim still holds (sample count unchanged by A10 quality outcome).

### Cross-audit dependency on oc-1-1 baseline

A25 reads but does NOT modify [convoke-report-operator-covenant-audit-2026-04-18.md](../planning-artifacts/convoke-report-operator-covenant-audit-2026-04-18.md). The oc-1-1 baseline's `enhance-backlog` cells are inputs to A25's cross-audit aggregate (Task 6). Per doc-immutability convention, oc-1-1 stays unchanged; A25's supplement report cites it.

### Estimated scope

- 7 cells × ~5 min/cell rubric application = ~35 min
- §2 calibration-case declaration + §5 verdict table + §6 cross-audit side-by-side aggregate (per AC9 P4 + Task 6 P8) = ~40 min (P10 patch — bumped from 30 min for cross-audit complexity)
- §7.1 A10 (Option A locked per PAD 2 P3) = ~30 min (P10 patch — bumped from 20 min for likely failure-cascade per A39 precedent)
- §8 COI disclosure + git log verification (already done at V-pass for both samples, so trimmed) = ~5 min
- §Implications drafting (P9 distribution edge-case framing) = ~20 min
- Save + doctor gate + backlog update = ~15 min
- **Total estimate: ~2.5–3 hours** (P10 patch — RICE E:1 was optimistic; recommend rescore to E:1.5 at completion if actual matches estimate; composite would drop 3.2 → 2.1 — more honest signal but lower priority)

## Review Findings

### V-Pass Round 1 (2026-04-25) — 10 patches applied

**Reviewers:** 2 Explore Agent subagents in parallel — Adversarial/Cynical Reviewer + Edge Case Hunter. Inputs: A25 spec + A39 spec (comparison baseline) + Compliance Checklist (§A41-Clarifications) + oc-1-1 audit report (cross-audit dependency).

**Verifications resolved before triage:**
- ✓ enhance-backlog authorship: ALL Amalik (commits Apr 15 + Apr 18) — proves AC12 "different author" claim was false
- ✓ oc-1-1 enhance-backlog cell count: 7 cells (8-skill matrix × 7 rights)
- ✓ §A41-12 single-skill exemption applies to A25 (header includes "calibration-case audits")
- ✓ §A41-6 A10 cell composition: matches spec's claim (expected-PASS must be reading-dependent or borderline)
- ✓ §A41-8 A28 v2 step selection: ≥2 steps default applies to Production-readiness archetypes only — portfolio-status is decision-support, AC4 step-01 scope is in-scope
- ✓ §A41-3 vacuous-PASS N_effective: forward-only v4+ rule — applies to A25
- ✓ taxonomy.yaml: qualifier is freeform, no registered list

**Patches applied (10):**
- **P1 — AC12 false-claim correction (CRITICAL).** Reframed "different author" to "both samples Amalik-authored; COI break is on archetype-diversity dimension only, not author-diversity"; disclosed Tier-0 per §A41-10.
- **P2 — Methodology-locked timestamp fix (CRITICAL).** Replaced "locked 2026-04-20" with "locked at A25 spec V-pass 2026-04-25, incorporating A41+A42 amendments which shipped concurrently". Removes retroactive methodology claim.
- **P3 — PAD 2 resolved at V-pass (CRITICAL).** Locked AC10 to Option A (execute A10) for methodology consistency with A39; removed "resolved at execution time" language.
- **P4 — AC9 cross-audit version-pinning explicit (CRITICAL).** Added §A41-13 + §A41-3 framing; cross-audit aggregate is informational side-by-side (NOT arithmetic-summed) to avoid v3/v4 incommensurability.
- **P5 — AC4 empirical-validation fallback (CRITICAL).** Added Decision-Needed mechanism if step-01 representativeness invalidated at execution; cites §A41-3 deferral-resolution rule.
- **P6 — AC3 Selection Intent reframe (HIGH).** "Targeted Gap-Fill" → "Calibration-Case Audit" matching §A41-12's explicit category.
- **P7 — AC11 §A41-9 specified (HIGH).** Replaced generic "pending A41" with specific "pending §A41-9 (portfolio audit definition)".
- **P8 — Task 6 compute mechanic explicit (HIGH).** Side-by-side per-right table; do not sum cells; vacuous-PASS handling for v4 cells.
- **P9 — AC8 distribution edge-case framing (MED).** Added 7/7-PASS and 7/7-FAIL §Implications phrasing.
- **P10 — RICE estimate adjusted (MED).** Total estimate bumped from ~2 hours to ~2.5–3 hours; recommend rescore E:1 → E:1.5 at completion.

**IN-13 acceptance acknowledgment added** to Context & Motivation: modules-ownership rule overrides IN-13's CIS framing; if oc-1-1 Acceptance Auditor objects post-ship, log as follow-up intake (not a blocker).

**Deferred (not patched, acknowledged for execution):**
- AC4 "primary inputs" verification — minor, can verify at execution time during Task 3
- AC6 §Notes coverage exhaustiveness — auditor judgment at execution
- AC7 filename length — kept as proposed; if convoke-doctor parses qualifier strictly, escape hatch is to shorten to `operator-covenant-audit-portfolio` matching A39's `gyre` pattern (operator-decision deferred — surface at execution if needed)

**Convergence:** R1 V-pass converged (no new HIGHs introduced by patches; all patches are content-only spec edits). No R2 triggered. Spec moves Draft → Ready-for-Dev.
