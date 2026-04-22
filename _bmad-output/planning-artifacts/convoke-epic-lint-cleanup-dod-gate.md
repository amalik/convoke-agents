---
initiative: convoke
artifact_type: epic
created: 2026-04-22T00:00:00.000Z
schema_version: 1
status: active
inputDocuments:
  - _bmad-output/implementation-artifacts/sprint-status.yaml
  - _bmad-output/implementation-artifacts/v63-1a-2-create-config-loader-js-with-direct-yaml-loading.md
---

# Epic lint-1 — Lint Cleanup & DoD Gate

## Overview

This epic closes the lint gap surfaced by CI run #714 (2026-04-21): `npm run lint` reported 8 `preserve-caught-error` errors in [scripts/update/lib/config-loader.js](../../scripts/update/lib/config-loader.js) (shipped via Story 1A.2) plus 15 pre-existing `no-unused-vars` warnings that had accreted across the portability scripts and test files since sp-epic-1. Story 1A.2's code review converged at Round 2 and the story was correctly marked `done` — but the review gated on `npm test` only, not `npm run lint`, so the regression slipped past both review rounds. The Epic closes the gap in one focused pass by (a) clearing all errors + listed warnings, and (b) making `npm run lint` a mandatory Definition-of-Done gate in two layers so the same pattern cannot recur.

**Source documents:**
- [sprint-status.yaml commentary 2026-04-21 + 2026-04-22](../implementation-artifacts/sprint-status.yaml) — CI #714 scar-story, decision log for option (b) + placement (i)
- [v63-1a-2 story file](../implementation-artifacts/v63-1a-2-create-config-loader-js-with-direct-yaml-loading.md) — origin of the 8 errors; not reopened per convergence rule

**Why now:** The 8 errors fail CI today; unrelated PRs cannot merge until lint is green. The 15 warnings do not fail CI but are the symptom of the same missing gate — clearing them in the same story makes the gate start from zero rather than grandfathering existing debt.

**Stakeholder:** Platform maintainers (operators of `convoke-update`, CI gatekeepers) + every future dev agent picking up a Convoke story (the DoD gate becomes part of their contract).

## Requirements Inventory

Epic lint-1 has no formal PRD — it closes one CI incident plus the process gap that allowed it. The FRs below restate the AC scope from the story for traceability.

### Functional Requirements

FR1: `scripts/update/lib/config-loader.js` MUST have zero `preserve-caught-error` ESLint errors. Each `throw new Error(...)` inside a `catch (err)` block attaches the caught error as `{ cause: err }` per the ES2022 Error cause contract. *(Source: CI #714, 8 errors)*

FR2: Four portability scripts (`classify-skills.js`, `export-engine.js`, `validate-classification.js`) plus four test files under `tests/lib/portability-*.test.js` MUST have zero `no-unused-vars` warnings for the 13 sites listed in the story's AC2 table. Fixes use `_`-prefix rename for swallow-continue and arg-preservation cases. *(Source: CI #714, 13 of 15 warnings)*

FR3: Two dead-assertion captures (`lightDepsCount` in portability-tier2-export.test.js:72, `pmBefore` in refresh-installation-artifacts.test.js:156) MUST be addressed by either strengthening the surrounding assertion to use the captured state, OR deleting the dead read. `_`-prefix rename is explicitly forbidden for this class — it masks a latent assertion gap. *(Source: CI #714, 2 of 15 warnings)*

FR4: A new rule `lint-passes-before-review` MUST be added to [project-context.md](../../project-context.md), adjacent to the `code-review-convergence` rule, citing Story 1A.2 + CI #714 as scar-story evidence. The rule states that `npm run lint` must exit 0 with zero warnings in files touched by the story before the story moves to `review`. *(Source: process gap identified 2026-04-22)*

FR5: The [bmad-dev-story DoD checklist](../../.claude/skills/bmad-dev-story/checklist.md) MUST be amended: (a) line 47's weasel wording "when configured in project" is removed; (b) "Linting reports" is promoted from `optional-inputs` to `required-inputs` frontmatter. *(Source: process gap identified 2026-04-22)*

FR6: A post-review note MUST be appended to the v63-1a-2 story file cross-referencing this epic and explicitly upholding the `code-review-convergence` rule — lint-1.1 is the forward-going remediation artifact, NOT a Round 3 reopening of Story 1A.2. *(Source: convergence-rule preservation)*

### Non-Functional Requirements

NFR1: All Epic lint-1 changes MUST be behavior-preserving in `scripts/` — `{ cause: err }` additions do not change `.message` strings; `_`-prefix renames do not change function signatures. All 1237+ existing tests (baseline at implementation time) continue to pass.

NFR2: Epic lint-1 MUST run the full CI matrix (`npm run lint` + `npm test` + `npm run test:integration`) before story is marked `review`. Zero regressions.

NFR3: Epic lint-1 stories MUST be code-reviewed adversarially using `bmad-code-review`. Given this epic's origin (a review process gap), skipping review would be a reflexive violation. Round 1 is mandatory; Rounds 2/3 follow `code-review-convergence` bounds.

NFR4: Scope discipline — any lint violation not in the story's AC2 table at implementation time MUST be logged as a deferred backlog item, not silently bundled in. The 2 pre-existing warnings in `tests/unit/migration-3.3.x-to-4.0.0.test.js` are scope-excluded and will be caught by FR4's new gate when Story 1A.4 moves to `review`.

### Additional Requirements (from existing architecture + project-context.md)

- **`code-review-convergence` preservation:** FR6 is explicit — Story 1A.2 converged at Round 2, and this epic does NOT reopen it. Future reviews of lint-1.1 itself follow the same convergence rule.
- **`namespace-decision-for-new-skills`:** N/A for this epic — no new skills, workflows, or agents under `_bmad/bme/` are created. The story header documents this with rationale.
- **`covenant-compliance-for-convoke-skills`:** N/A — none of the touched files live under `_bmad/bme/`.
- **`path-safety-for-destructive-ops`:** N/A — no scripts accepting user paths or performing destructive operations are added or modified.
- **`test-fixture-isolation`:** Applies if FR3 adds new assertions — the existing `refresh-installation-artifacts.test.js` uses a `tmpDir` fixture and must continue to. No new fixture setup needed.
- **`derive-counts-from-source`:** AC2 table is mechanically derived from `npm run lint` output 2026-04-21. Post-fix verification counts are derived at runtime, not hardcoded.
- **`mechanical-research-enumeration`:** The subject space is `npm run lint` output — itself a mechanical enumeration. Story Task 1.1 captures the raw baseline as evidence.
- **`spec-verify-referenced-files`:** Verified 2026-04-22 — all 12 files cited in the story exist at authoring time.

## Stories

| ID | Title | Status | Notes |
|---|---|---|---|
| lint-1.1 | Fix CI lint failures and add `npm run lint` as DoD gate | ready-for-dev | Single story; covers FR1–FR6. See [lint-1-1 story file](../implementation-artifacts/lint-1-1-fix-ci-lint-and-add-dod-gate.md) |

## Convergence & Sequencing

- **Pre-conditions:** None. Work is self-contained and unblocks the merge pipeline on the next CI run.
- **Parallel with:** Story 1A.4 (v63-1a-4-create-migration-script-3-x-to-4-0-js) — actively in-flight at epic-creation time. The 2 warnings currently in 1A.4's test file are scope-excluded per NFR4 and will be caught by this epic's new DoD gate when 1A.4 moves to `review`.
- **Retrospective:** Optional (single-story epic). If the new DoD gate fails to prevent a second lint regression within 2 subsequent stories, run a retrospective and evaluate the `pre-commit hook / lefthook` candidate noted in the story's Scope Exclusions.

## Out of Scope (for this epic, future-candidates for backlog)

- **Pre-commit / husky / lefthook hooks.** Local-hook friction deliberately deferred. If CI + DoD prove insufficient (measured: 2+ additional lint regressions post-gate), reopen as a backlog item.
- **Deeper portability-suite dead-assertion audit.** FR3 addresses the 2 known sites. If the dev agent finds ≥2 additional dead-assertion patterns during implementation, log as a follow-up backlog item — do not scope-creep.
- **Migrating off `no-unused-vars` warn → error.** The `eslint.config.mjs` rule is set to `"warn"`. Promoting to `"error"` would force every existing warning to become a CI blocker and is out of scope for this cleanup pass.
