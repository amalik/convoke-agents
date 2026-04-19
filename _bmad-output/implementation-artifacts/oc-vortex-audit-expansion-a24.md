# A24: Vortex Audit Expansion (IN-12)

Status: done (2026-04-19) — report: [convoke-report-operator-covenant-audit-vortex-2026-04-19.md](../planning-artifacts/convoke-report-operator-covenant-audit-vortex-2026-04-19.md)

## Story

As a Convoke contributor preparing Epic 2 Story 2.1's T1 (team × Right) trigger evaluation,
I want a Vortex-scoped audit extension that scores ≥ 3 additional Vortex workflows beyond `lean-persona` against all 7 Operator Rights using the locked oc-1-1 methodology,
so that the Vortex team cell reaches N ≥ 4 and T1 trigger evaluation for Vortex becomes valid (currently blocked at N = 1 per [convoke-epic-operator-covenant.md:365](../planning-artifacts/convoke-epic-operator-covenant.md#L365)).

## Acceptance Criteria

1. **Methodology reuse, not revision.** The audit applies §2.3 scoring scheme + §2.4 per-right rubric + §2.6 novel-concept glossary from [convoke-report-operator-covenant-audit-2026-04-18.md](../planning-artifacts/convoke-report-operator-covenant-audit-2026-04-18.md) verbatim. If a rubric ambiguity surfaces, it is recorded as an intake for the initiatives backlog (not resolved in-story).

2. Audit findings reference rights by name (e.g., "Right to pacing"), not number — same rule as oc-1-1 AC #2.

3. **Scope — ≥ 3 additional Vortex workflows audited.** The set must include `assumption-mapping` (IN-12 origin spot-check target) and `empathy-map`; the third is selected from `hypothesis-engineering` or `lean-experiment`. Rationale for the third choice is documented in the report. Combined with lean-persona (carried over from oc-1-1 §7), the Vortex cell reaches N ≥ 4.

4. **Unit of analysis matches oc-1-1 §2.2.** One representative step per workflow is audited. If the workflow has > 3 steps, the report discloses which step was chosen and why (same disclosure pattern as oc-1-1 Loom add-team scoping).

5. Each workflow × right cell produces a binary PASS / FAIL verdict with a ≤ 2-sentence evidence note citing specific file references and behaviors (no partial-credit language — see Round 3 triage on partial credit).

6. **Right-to-pacing cells apply §2.6 glossary strictly.** The IN-12 spot-check estimate of "~10 novel concepts in assumption-mapping step-01" is a pre-audit *hypothesis*, not a finding — the actual concept count (via §2.6 glossary enumeration) is the AC #5 evidence. A mismatch between estimate and measured count does not invalidate the finding; it is logged in the report §notes.

7. **Output report saved** at `_bmad-output/planning-artifacts/convoke-report-operator-covenant-audit-vortex-YYYY-MM-DD.md` with governance frontmatter (`initiative: convoke`, `artifact_type: report`, `created: YYYY-MM-DD`, `schema_version: 1`). `convoke-doctor` must pass on the saved file.

8. **Vortex (team × Right) row computed** — for each of the 7 rights, the report emits `vortex_fail_rate = fails_in_vortex / N_vortex_audited` using the combined set (3 new workflows + lean-persona carried from oc-1-1 §7).

9. **T1 trigger verdict recorded** — for each right, the report states whether the Vortex cell fails the T1 threshold (< 70% compliance at N ≥ 3 per [convoke-epic-operator-covenant.md:360](../planning-artifacts/convoke-epic-operator-covenant.md#L360)). If any right trips T1, the affected (Vortex × Right) cell(s) are escalated as in-scope for Epic 2 Story 2.1 retrofit — logged in the report §Implications section.

10. **Initiatives-backlog log entry** — on completion, add a 2026-MM-DD row to the backlog §2.5 activity log summarizing: workflows audited, Vortex fail rates per right, T1 trigger verdict, and whether Epic 2 Story 2.1 scope is affected. Move A24 from Fast Lane → §2.5 Completed.

## Tasks / Subtasks

- [ ] Task 1: Confirm workflow selection (AC #3) — pick the third workflow from `hypothesis-engineering` or `lean-experiment`; document rationale (e.g., coverage of different Vortex stream archetypes, skill maturity, recent adoption).
- [ ] Task 2: Identify representative step per workflow (AC #4) — cite step path (e.g., `_bmad/bme/_vortex/workflows/assumption-mapping/step-01-<name>.md`) and rationale for step choice.
- [ ] Task 3: Score each workflow × 7 rights (AC #5, #6) — 3 workflows × 7 rights = 21 new cells; evidence notes cite specific file:line references where behavior is defined.
- [ ] Task 4: Compute Vortex team × Right row (AC #8) — 4 workflows (3 new + lean-persona from oc-1-1 §7) × 7 rights; report per-right fail count and fail rate.
- [ ] Task 5: Evaluate T1 trigger for Vortex (AC #9) — per-right: does `(fails / N) < 0.30` at `N ≥ 3`? Any `TRUE` escalates.
- [ ] Task 6: Draft §Implications section — for each T1-tripping right (if any), recommend retrofit pattern drawing from oc-1-1 §9.1's retrofit catalogue where applicable.
- [ ] Task 7: Save report (AC #7) + run `npx convoke-doctor` to verify governance acceptance.
- [ ] Task 8: Update initiatives backlog (AC #10) — activity-log row + move A24 to §2.5 Completed.

## Dev Notes

### Origin & Scoring

- **Intake:** IN-12 (deferred from oc-1-1 Round 3 Edge Case Hunter per `code-review-convergence` no-R4 rule)
- **Backlog ID:** A24 (renamed from A8 on 2026-04-19 — collision with v6.3 Adoption A8/WS3 Amelia consolidation)
- **RICE:** R=6, I=1, C=80%, E=2, Score=2.4 — Fast Lane qualification

### Pre-Audit Hypothesis (from IN-12)

oc-1-1 sampled only `lean-persona` from the Vortex team, which returned 1 Right-to-pacing FAIL out of 7 rights (one of the *least-violating* outcomes in the audit matrix — [convoke-report-operator-covenant-audit-2026-04-18.md:271](../planning-artifacts/convoke-report-operator-covenant-audit-2026-04-18.md#L271) row). IN-12 spot-check flagged `assumption-mapping` step-01 as introducing ~10 novel concepts in a single round, suggesting Vortex is systematically weaker on Right to pacing than lean-persona indicated. If confirmed under §2.6 glossary, Vortex may trip T1 on Right to pacing (N=4, ≥3 FAILs → 75% fail → trigger fires).

This is a hypothesis, not a prediction. The audit executes the methodology and reports the result — even if Vortex passes, the N ≥ 3 floor for T1 evaluation is the primary deliverable.

### Downstream Consumers

- **Epic 2 §Retrofit Trigger Rule ([line 365](../planning-artifacts/convoke-epic-operator-covenant.md#L365)):** baseline updates from "v1 oc-1-1 (N_vortex = 1, T1-invalid)" to "v2 post-A24 (N_vortex ≥ 4, T1-valid)". This is the *primary* consumer regardless of outcome.
- **Epic 2 Story 2.1:** if any Vortex × Right cell trips T1, that cell becomes in-scope retrofit. Escalation path: report §Implications → sprint-planning on Epic 2.
- **Operator Covenant external publication (Epic 2 Story 2.3):** Publication Gate evaluates against the refreshed matrix; a T1-valid Vortex row is required before publication.

### Anti-Patterns to AVOID

- ❌ Do NOT modify §2.4 rubric or §2.6 glossary — this is a re-run, not a methodology revision. Rubric ambiguities go to backlog as intakes.
- ❌ Do NOT audit only Right to pacing — all 7 rights must be scored to prevent cherry-pick bias and to keep the Vortex row commensurable with oc-1-1 §7.
- ❌ Do NOT re-score `lean-persona` — carry its oc-1-1 §7 verdicts forward unchanged. If carrying forward surfaces a drift concern, log as backlog intake.
- ❌ Do NOT use partial-credit language in evidence notes — rejected in oc-1-1 Round 3 ("residual partial-credit language in some evidence notes" was deferred).
- ❌ Do NOT conflate this audit with a full re-audit of the 6-skill oc-1-1 matrix — scope is Vortex-team-only expansion; Migration, Portfolio, export-skill, validate-exports, Loom add-team, enhance-backlog, Gyre stack-detection are **not** re-audited.

### Conflict-of-Interest Disclosure

If the auditor has materially authored or edited any of the three Vortex workflows selected, the report must disclose this in a §COI section (pattern: oc-1-1 §6 enhance-backlog disclosure). This does not invalidate the audit, but reviewers reading the T1 verdict should know.

### Output File

```
_bmad-output/
└── planning-artifacts/
    └── convoke-report-operator-covenant-audit-vortex-YYYY-MM-DD.md  # THIS STORY creates this file
```
