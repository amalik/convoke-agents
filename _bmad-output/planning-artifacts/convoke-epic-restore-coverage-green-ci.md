---
initiative: convoke
artifact_type: epic
created: 2026-05-03T00:00:00.000Z
schema_version: 1
status: active
inputDocuments:
  - _bmad-output/implementation-artifacts/sprint-status.yaml
  - .c8rc.json
  - .github/workflows/ci.yml
---

# Epic cov-1 — Restore Green CI: Close Functions Coverage Gap

## Overview

GitHub Actions `coverage` job has been red on every push since 2026-05-01T23:15:46Z, blocking the merge pipeline. The test matrix (Node 18/20/22) is fully green; only the c8 functions-threshold gate trips. Root cause: I97 Story 2.1 (Emma POC, shipped 2026-05-02) added six test-infrastructure scripts under [scripts/migration/format-conversion/](../../scripts/migration/format-conversion/) plus [scripts/audit/reference-integrity.js](../../scripts/audit/reference-integrity.js) which were caught by [.c8rc.json](../../.c8rc.json)'s `scripts/**/*.js` include glob. Their low per-file functions coverage (the harnesses themselves are test infrastructure, not production code) dragged global functions coverage from above-88% to **86.34%** against an unchanged 88% threshold.

A partial fix is already in the working tree (uncommitted at epic-creation time): [.c8rc.json](../../.c8rc.json) `exclude` array gained `"scripts/migration/format-conversion/**"`. This recovered ~15 functions (denominator 432→417) and moved global functions coverage to **87.52%** — correctly removing the harness infrastructure from coverage measurement, but still ~2 functions short of the 88% threshold. The residual gap lives in legacy `scripts/audit/*.js` operational tooling and pre-1.7 migration files in `scripts/update/migrations/` — files where the tooling-vs-production-path classification is not yet decided. That classification is logged as a separate backlog item to avoid scope-creep on this hotfix.

**Source documents:**
- [.c8rc.json](../../.c8rc.json) — uncommitted partial fix (format-conversion exclude)
- [.github/workflows/ci.yml](../../.github/workflows/ci.yml) — CI job definition; `coverage` job at line 93–108
- [GitHub Actions run #25277123569](https://github.com/amalik/convoke-agents/actions/runs/25277123569) — most recent failure, 2026-05-03T10:50:13Z (representative; pattern is identical across 7 prior failed runs back to 2026-05-01T23:15)
- Party-mode diagnosis session 2026-05-03 (Winston + Murat) — not a persisted artifact; key facts carried forward into this epic and the story

**Why now:** CI has been red on every push for ~36 hours. Every push to main re-triggers the failure. The merge pipeline is blocked for unrelated work, including in-flight I97 Stories 2.3-2.7 (Vortex agent conversions). Cost compounds with every additional push.

**Stakeholder:** Platform maintainer (Amalik); every dev agent picking up an I97 conversion story (their CI is red regardless of their own correctness); future operators of the c8 quality gate (this epic establishes the harness-vs-production exclude pattern).

## Requirements Inventory

Epic cov-1 has no formal PRD — it closes one CI incident plus the c8 include-glob hygiene gap that allowed it. The FRs below restate the AC scope from the story for traceability.

### Functional Requirements

FR1: The [.c8rc.json](../../.c8rc.json) `exclude` array MUST include `"scripts/migration/format-conversion/**"`. This entry is the working-tree partial fix at epic-creation time and is correct (those files are I97 migration test infrastructure, not production code paths). It MUST be preserved and committed. *(Source: Murat/Winston diagnosis 2026-05-03; confirmed locally — denominator 432→417, +1.18% functions coverage)*

FR2: After all changes in this epic, `npm run test:coverage` MUST exit 0 — i.e., c8 functions coverage MUST meet or exceed the 88% global threshold currently configured in [.c8rc.json:4](../../.c8rc.json#L4). *(Source: AC of CI green; binary criterion)*

FR3: The 88% functions threshold MUST be preserved as the default outcome. The dev agent may CHOOSE Path 3 (lower threshold to 87%) only if Paths 1 and 2 are both demonstrated infeasible within the time budget; in that case, a dedicated debt-ticket MUST be added to the initiatives backlog (Fast Lane) referencing this epic. *(Source: ratchet-preservation principle; aligns with I97 quality-gate posture)*

FR4: If Path 1 (classify-and-exclude operational tooling) is chosen, the dev agent MUST classify each touched file as **operational tooling** (excluded) vs **production code path** (kept) with a one-line rationale per file recorded in the story's File List. *(Source: prevents accidental masking of real production gaps)*

FR5: If Path 2 (add targeted unit tests) is chosen, the new tests MUST follow `node:test` conventions per the C1 phantom-test retro (no Jest globals; uses `node:assert/strict`); MUST live under [tests/](../../tests/) following the existing directory taxonomy; and MUST exercise real function entry points, not import-only shims (per `mechanical-research-enumeration` rule). *(Source: project-context.md test conventions)*

FR6: The story MUST log a separate backlog candidate to [`convoke-note-initiative-lifecycle-backlog.md`](../planning-artifacts/convoke-note-initiative-lifecycle-backlog.md) §2.3 Fast Lane: **"Classify `scripts/audit/*.js` and legacy `scripts/update/migrations/{1.0,1.1,1.2,2.0,3.0}.x-to-*.js` as operational tooling vs production code path"** — this is the longer-running c8 glob hygiene question whose answer informs future excludes. It is explicitly out of scope for this epic. *(Source: `feedback_avoid_overcomplicating_audits` — log ambiguities to backlog instead of spawning new specs in-flight)*

### Non-Functional Requirements

NFR1: All Epic cov-1 changes MUST be behavior-preserving for production code. Coverage configuration changes do not alter runtime behavior; new tests (if Path 2) are additive only. Existing passing tests on Node 18/20/22 (the `test (18|20|22)` matrix jobs) MUST continue to pass.

NFR2: Epic cov-1 MUST run the full CI matrix (`lint` + `test (18|20|22)` + `python-test` + `coverage` + `security` + `package-check`) before story is marked `review`. The `coverage` job MUST exit 0 — that's the whole point.

NFR3: Epic cov-1 stories MUST be code-reviewed adversarially using `bmad-code-review`. Round 1 mandatory; Rounds 2/3 follow `code-review-convergence` bounds. Acceptance Auditor pays particular attention to the chosen path's rationale (FR3/FR4/FR5).

NFR4: Scope discipline — the audit-scripts/legacy-migrations classification question MUST be backlog-logged per FR6 and MUST NOT be answered in this story's diff. If during implementation the dev agent finds additional files that need exclusion or testing beyond closing the 0.48% gap, those files MUST also be backlog-logged, not silently bundled.

### Additional Requirements (from existing project-context.md)

- **`code-review-convergence` preservation:** This epic does NOT reopen any prior story. I97 Story 2.1 (Emma POC) shipped correctly per its ACs; the coverage regression is a glob-hygiene gap, not a Story 2.1 defect. This epic is the forward-going remediation.
- **`namespace-decision-for-new-skills`:** N/A — no new skills, workflows, or agents under `_bmad/bme/` are created. This is repo-root infrastructure ([.c8rc.json](../../.c8rc.json), [scripts/](../../scripts/), possibly [tests/](../../tests/)).
- **`covenant-compliance-for-convoke-skills`:** N/A — no `_bmad/bme/` content touched.
- **`path-safety-for-destructive-ops`:** N/A — no scripts accept user paths or perform destructive operations.
- **`test-fixture-isolation`:** Applies if Path 2 (new tests) is chosen — any new test that touches the filesystem must use the existing `tmpDir` fixture pattern.
- **`derive-counts-from-source`:** All coverage counts cited in the story (87.52%, 86.34%, 432, 417) MUST be re-derived at implementation time via `npm run test:coverage` rather than treated as immutable. The 88% threshold value is config-immutable per FR3.
- **`mechanical-research-enumeration`:** The list of low-functions-coverage files in the story Context section is mechanically derived from the c8 text-summary report. Dev agent re-runs `npm run test:coverage` at Task 1 to capture the post-FR1 baseline before choosing a path.
- **`spec-verify-referenced-files`:** Verified 2026-05-03 — all referenced files exist in working tree at epic-authoring time ([.c8rc.json](../../.c8rc.json), [.github/workflows/ci.yml](../../.github/workflows/ci.yml), [scripts/migration/format-conversion/](../../scripts/migration/format-conversion/), [scripts/audit/](../../scripts/audit/)).
- **`lint-passes-before-review`:** Applies — `npm run lint` must exit 0 with zero new warnings in files modified by the story before `review`.

## Stories

| ID | Title | Status | Notes |
|---|---|---|---|
| cov-1.1 | Close 0.48% functions coverage gap to restore green CI | ready-for-dev | Single story; covers FR1–FR6. See [cov-1-1 story file](../implementation-artifacts/cov-1-1-close-functions-coverage-gap.md) |

## Convergence & Sequencing

- **Pre-conditions:** None. Working tree has the partial fix uncommitted; story Task 1 is to commit FR1 in isolation (or as part of the same commit as the chosen path's diff — dev agent's call).
- **Parallel with:** I97 Stories 2.3-2.7 (active Vortex agent conversions). cov-1.1's diff is small and orthogonal; conflict risk is essentially zero (touches `.c8rc.json` plus possibly new test files; I97 conversions touch `_bmad/bme/_vortex/agents/`).
- **Retrospective:** Optional (single-story epic, like lint-epic-1). If a *second* coverage regression caused by harness/tooling globs occurs within the next 3 stories under I97 Epic 2, run a retrospective and reopen FR6's backlog candidate as priority.

## Out of Scope (for this epic, future-candidates for backlog)

- **Broad classification of `scripts/audit/*.js` and legacy `scripts/update/migrations/*.js` as tooling vs production-path.** Per FR6, this is the bigger c8 glob hygiene question. It informs future excludes but should not block a 36-hour-old CI red. Logged as Fast Lane backlog candidate.
- **Promoting `node 24` runner support in CI.** GitHub deprecation warning fires on every run (Node.js 20 actions deprecated, will be forced to Node.js 24 by 2026-06-02). Real, but a different epic. Logged as Fast Lane backlog candidate by the dev agent if not already present.
- **Coverage thresholds for `lines`/`branches`/`statements` review.** Currently 83/80/(implicit-from-lines). Lines is at 86.35% — comfortably above. Branches is at 80.98% — barely above the 80 floor. Tightening these is a separate health initiative.
- **Migrating coverage to a CodeCov / Coveralls / equivalent reporter.** External reporting is out of scope; the gate is c8's `check-coverage` flag.
- **Pre-commit / lefthook hooks for coverage.** Per `lint-epic-1` precedent: friction-adding local hooks deferred unless CI proves insufficient.
