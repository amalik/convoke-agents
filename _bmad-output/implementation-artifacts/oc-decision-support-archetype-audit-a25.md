# A25: Decision-Support Archetype Audit Supplement (IN-13)

Status: **Draft 2026-04-25** — pending V-pass + execution

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
- Methodology is locked as of 2026-04-20 (A28 Step Selection + A29 Skill Selection + A10 reproducibility gate per Compliance Checklist §A41-Clarifications §A41-1..§A41-13). A25 is locked-methodology application — not methodology revision.
- **Code-collision avoidance:** v6.3 Epic 3 (Marketplace) is touching `scripts/update/migrations/`, `scripts/portability/`, and `.claude-plugin/` — A25 touches none of these. Pure content work.

**Why `bmad-portfolio-status` (operator-confirmed pick 2026-04-25):**
The original IN-13 framing suggested CIS skills (`creative-problem-solver` / `innovation-strategy`), but those live at `_bmad/cis/` (upstream BMAD), not `_bmad/bme/` (Convoke-owned). Per the modules-ownership rule, Covenant audits should target Convoke-owned content; cross-module-scope expansion is a separate methodology question. `bmad-portfolio-status` is the cleanest Convoke-owned decision-support archetype:

- Located at [`_bmad/bme/_artifacts/workflows/bmad-portfolio-status/`](../../_bmad/bme/_artifacts/workflows/bmad-portfolio-status/) — explicitly Convoke-owned
- Decision-support function: 3-step guided conversation (scan → explore → recommend) that helps the operator decide what to work on next across the initiative portfolio
- Distinct from `enhance-backlog` (which is decision-support for *backlog management* itself); `portfolio-status` is decision-support for *initiative prioritization*
- COI risk: Claude (auditor) has not authored the `bmad-portfolio-status` workflow files; sole author per `git log` is Amalik (operator) on 2026-04-08 — same operator-author shape as A39 Gyre, manageable via §8 disclosure

**Why the audit is small (7 cells, not 28):**
A25's purpose is to *break the single-sample-with-COI dependency* in oc-1-1's decision-support archetype, not to re-audit a team. One additional skill audited × 7 rights = 7 cells is sufficient evidence to support or refute the claim "decision-support archetype findings in v2 baseline rest on >1 sample". RICE 3.2 (R:4 I:1 CF:80% E:1) reflects this scoped scope.

## Acceptance Criteria

**AC1 — Methodology reuse, not revision.** The audit applies §2.3 scoring scheme (strict binary PASS/FAIL, no partial credit) + §2.4 per-right rubric + §2.6 novel-concept glossary from [convoke-report-operator-covenant-audit-2026-04-18.md](../planning-artifacts/convoke-report-operator-covenant-audit-2026-04-18.md) verbatim, **plus** the A41-Clarifications (§A41-1..§A41-13) from [convoke-spec-covenant-compliance-checklist.md](../planning-artifacts/convoke-spec-covenant-compliance-checklist.md). If a rubric ambiguity surfaces, it is recorded as a backlog intake (not resolved in-story). Same constraint A24 + A39 carried.

**AC2 — Audit findings reference rights by name** (e.g., "Right to pacing"), not number — same rule as oc-1-1 AC #2 and A24/A39 AC #2.

**AC3 — Scope: 1 Convoke-owned decision-support skill audited.** The audit covers:
- `bmad-portfolio-status` ([_bmad/bme/_artifacts/workflows/bmad-portfolio-status/](../../_bmad/bme/_artifacts/workflows/bmad-portfolio-status/) — decision-support archetype; locked 2026-04-25 — see Pre-Author Decision 1 in Dev Notes for the CIS-vs-Convoke-owned scope analysis and the resolved trade-off)

The pick is the **second decision-support sample** for the v2 baseline (first sample: `bmad-enhance-initiatives-backlog` per oc-1-1). Per A29 §single-skill exemption (Compliance Checklist §A41-12), a single-skill audit does NOT need to declare structural-dimension variation since variation requires ≥2 picks. The report's §2 must instead declare:
1. The justification for single-skill scope (breaking the single-sample-with-COI dependency in oc-1-1 baseline; specific archetype gap, not breadth claim).
2. The classification of the pick (decision-support archetype).
3. The disclosure that single-skill scope means **no archetype-cluster claim** is made — A25 is a *targeted gap-fill* sample, not a representative-pattern audit.

**AC4 — Unit of analysis matches oc-1-1 §2.2 + A28 Step Selection rule.** Per A28 ("each picked skill's audit MUST cover ≥2 steps OR explicitly scope to single step with documented rationale"): A25 scopes to **step-01** (`step-01-scan.md`) for `bmad-portfolio-status` with the documented rationale "cross-audit comparability with oc-1-1 + A24 + A39 baselines (which all scoped to step-01); step-01 is also where `portfolio-status` receives its primary inputs (scope dir traversal + decision-tree probing) and where workflow-level concept load concentrates per the A39 pattern." This rationale is **not** the explicitly-forbidden circular reasoning ("step-01 is the highest-concept-density step"); it is cross-audit comparability + receipt-point reasoning.

**AC5 — Each workflow × right cell produces a binary PASS / FAIL verdict** with a ≤ 2-sentence evidence note citing specific file references and behaviors (no partial-credit language, no "reading-dependent" partial-credit-shaped constructs per §A41-4). 7 cells total. 0 N/A unless explicitly justified per cell with one of the §A41 N/A variants (`out-of-scope`, `external-declared`, `vacuous-no-error-surface`, `conditional-<branch>`).

**AC6 — §Notes section captures methodology-application observations** that don't belong in evidence notes (e.g., compound-concept counting, vacuous-PASS pattern instances, decision-support-specific concept-load patterns). §A41-1 (compound-mechanism evidence-note convention) applies if any cell scoring requires multi-mechanism reasoning.

**AC7 — Output report saved** at `_bmad-output/planning-artifacts/convoke-report-operator-covenant-audit-decision-support-supplement-YYYY-MM-DD.md` with governance frontmatter `initiative: convoke`, `artifact_type: report`, `created: 'YYYY-MM-DD'`, `schema_version: 1` — **matching A24/A39 report frontmatter exactly** (no `qualifier` field; the qualifier `operator-covenant-audit-decision-support-supplement` is filename-encoded only per the convention `{initiative}-{artifact_type}[-{qualifier}]-{date}.md` from [taxonomy.yaml:25](../../_bmad/_config/taxonomy.yaml#L25)). `npx convoke-doctor` must pass on the saved file.

**AC8 — Per-right verdict recorded** — for each of the 7 rights, the report emits the cell verdict (PASS / FAIL) with evidence note. Single-skill scope means there is **no `portfolio_status_fail_rate` aggregate** computed (would be 0/1 or 1/1 per right, statistically vacuous); the value of A25 is per-cell binary evidence on a Convoke-owned decision-support skill, not a rate.

**AC9 — T1 trigger applicability** — A25 is a single-skill audit (N=1 per right), so per [Epic 2 retrofit trigger rule](../planning-artifacts/convoke-epic-operator-covenant.md) "T1 fires at <70% compliance for cells with N≥3", T1 does not fire on A25 alone. Instead, A25 results **feed into the cross-audit aggregate** for the decision-support archetype: combine A25's 7 cells with oc-1-1's `enhance-backlog` 7 cells (same archetype) → 14 cells total per right (N=2 per right). Compute per-right archetype compliance rate at N=2 for informational purposes; do NOT trigger T1 on N=2 (below threshold). Report §Implications must explicitly state: "decision-support archetype baseline now rests on 2 samples (was 1); T1 trigger threshold (N≥3) still not met for the archetype, but single-sample-with-COI dependency is broken."

**AC10 — A10 Reproducibility Pass scope decision recorded.** A10 baseline rule: "≥3 cells with independent reviewer agreement at 100%". A25 has 7 cells total — sufficient population for A10 sampling (3 of 7 cells). Per A41-Clarifications §A41-6 (A10 cell-composition rule), select 3 cells covering one expected-PASS, one expected-FAIL, one borderline. **Operator decision-needed:** given A39's A10 1/3 outcome (gate did not clear), should A25 (a) execute A10 with same Explore-subagent pattern and accept whatever outcome surfaces, or (b) skip A10 entirely as out-of-scope for a single-skill targeted gap-fill (justified by AC9: A25 is not a rate-claim audit)? Default proposal: execute A10 (Option A) for methodology consistency; mark verdict provisional if A10 fails (same shape as A39 §1 headline).

**AC11 — Initiatives-backlog log entry** — on completion, add a 2026-MM-DD row to the backlog §2.5 Completed lane summarizing: skill audited, per-right verdicts, archetype baseline aggregate (oc-1-1 enhance-backlog + A25 portfolio-status combined), A10 outcome (if executed), and gate-counting status pending A41 (same caveat as A39: A25's "output-counting-toward-gate depends on A41 defining 'portfolio audit' at the right granularity"). Move A25 from §2.3 Fast Lane → §2.5 Completed.

**AC12 — Conflict-of-Interest disclosure.** §8 disclosure required:
- **Operator-author COI:** `git log --follow` per file (verified 2026-04-25): step-01-scan.md authored single-commit by Amalik (operator) 2026-04-08; SKILL.md authored by Amalik 2026-04-08. Single-author single-day operator-facing surface, same shape as A39 Gyre disclosure.
- **Auditor COI:** Claude (auditor) has NOT authored or edited `bmad-portfolio-status/step-01-scan.md` or `SKILL.md` (verified via git log). Auditor authored A25 spec + report same session — methodology-frame COI disclosed.
- **Cross-audit COI:** A25 supplements oc-1-1's decision-support archetype findings, where the only prior sample (`enhance-backlog`) carried Acceptance Auditor's COI disclosure (skill author). A25's pick (`portfolio-status`) is by a different author (Amalik vs whoever authored enhance-backlog — verify in §8). Disclosed as cross-audit context.

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
- [ ] **Task 4: Score 1 workflow × 7 rights** (AC5, AC6) — produce 7-cell matrix scoring `bmad-portfolio-status` step-01 against:
  - Right to a default
  - Right to pause
  - Right to next-action clarity
  - Right to pacing (novel concepts ≤ 5 per layer per §A41-2 hybrid count)
  - Right to revoke (cancel/back-out path)
  - Right to a sound mental model (concept introduction ordering, no orphan terms)
  - Right to non-blocking failure (errors actionable, no terminal silent states)

  Each cell PASS/FAIL with ≤2-sentence evidence citing `step-01-scan.md:line` references. Document any compound-mechanism cells per §A41-1 evidence-note convention.

- [ ] **Task 5: Per-right verdict table** (AC8) — report §5 emits per-right cell verdict (PASS/FAIL) + evidence note. NO rate column (N=1; single-cell aggregates are vacuous).
- [ ] **Task 6: Cross-audit archetype aggregate** (AC9) — combine A25's 7 cells with oc-1-1's `enhance-backlog` 7 cells → 14 cells total (N=2 per right). Compute per-right archetype compliance rate informational. State explicitly: "decision-support archetype baseline now N=2 (was N=1); T1 trigger threshold (N≥3) still not met for archetype-level fail rates, but single-sample-with-COI dependency is broken — per IN-13 origin objective."
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

### Pre-Author Decision 2: A10 execute vs skip (PENDING — surfaced as AC10 operator-decision)

**Question:** Should A25 execute the A10 Reproducibility Pass, or skip it as out-of-scope for a single-skill targeted gap-fill?

**Trade-off:**
- **Execute (Option A):** methodology consistency with A39; honest signal of LLM-rubric-application reliability for portfolio-status; risk: A39's A10 1/3 outcome suggests the gate is hard to clear, A25 may inherit that result and produce a "provisional" verdict (same shape as A39 §1).
- **Skip (Option B):** justified by AC9 (A25 is not a rate-claim audit — single-skill, no T1 trigger); avoids A10 fail noise; clean gate-counting framing as "supplement, not standalone audit"; risk: weakens A25's defensibility against external reviewers asking "did you re-verify reproducibility on the supplement?"

**Default proposal:** Execute (Option A). Resolved at execution time, not at spec-V-pass time, per the AC10 phrasing.

### Cross-audit dependency on oc-1-1 baseline

A25 reads but does NOT modify [convoke-report-operator-covenant-audit-2026-04-18.md](../planning-artifacts/convoke-report-operator-covenant-audit-2026-04-18.md). The oc-1-1 baseline's `enhance-backlog` cells are inputs to A25's cross-audit aggregate (Task 6). Per doc-immutability convention, oc-1-1 stays unchanged; A25's supplement report cites it.

### Estimated scope

- 7 cells × ~5 min/cell rubric application = ~35 min
- §2 declaration + §5 verdict table + §6 cross-audit aggregate = ~30 min
- §7.1 A10 (if Option A) = ~20 min
- §8 COI disclosure + git log verification = ~10 min
- §Implications drafting = ~15 min
- Save + doctor gate + backlog update = ~10 min
- **Total estimate: ~2 hours** (matches RICE E:1)

## Review Findings

*(To be populated post-execution. Mirror A39 structure: Round-by-Round patches, decisions, deferrals.)*
