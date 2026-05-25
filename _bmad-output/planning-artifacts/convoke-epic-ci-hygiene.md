---
initiative: convoke
artifact_type: epic
created: 2026-05-25T00:00:00.000Z
schema_version: 1
status: active
inputDocuments:
  - _bmad-output/planning-artifacts/convoke-note-initiative-lifecycle-backlog.md
  - _bmad-output/implementation-artifacts/session-retro-2026-05-05-cov-and-i97-bug.md
  - .github/workflows/ci.yml
  - package.json
  - project-context.md
---

# Epic ci-hygiene-1 — CI Hygiene: Pipefail & Lint Gate Fidelity

## Overview

Single-story mini-epic bundling three convergent CI gate-fidelity fixes triaged together via the [2026-05-25 CI/CD review](../implementation-artifacts/sprint-status.yaml) (Winston Architect + Quinn QA, parallel dispatch). Mini-epic following the [`convoke-epic-i97-bug-fixes.md`](convoke-epic-i97-bug-fixes.md) + [`convoke-epic-restore-coverage-green-ci.md`](convoke-epic-restore-coverage-green-ci.md) + [`convoke-epic-lint-cleanup-dod-gate.md`](convoke-epic-lint-cleanup-dod-gate.md) precedent (cross-cutting, incident-driven, retrospective optional).

The three fixes are different layers of the same lesson — **gate text and gate behavior must agree** — surfaced by the same 2026-05-01 → 05 CI red incident:

1. **A47 (`verification-pipefail` rule into `project-context.md`)** — AC-RETRO-1 from the [2026-05-05 session retro](../implementation-artifacts/session-retro-2026-05-05-cov-and-i97-bug.md) that never shipped. Forbids `cmd | tail; echo $?` exit-code masking in story Task verification commands.
2. **I103 (`defaults.run.shell: bash -eo pipefail {0}` on `ci.yml`)** — codifies the same lesson at the GitHub Actions workflow level. GitHub Actions' default `bash` invocation has `-e` but not `-o pipefail`; any future piped step would silently lie.
3. **I104 (`--max-warnings 0` on `npm run lint`)** — closes the rule↔gate disagreement where `project-context.md` `lint-passes-before-review` mandates zero warnings on touched files but CI's gate currently accepts warnings (`no-unused-vars` configured as `warn`).

**Source documents:**
- [convoke-note-initiative-lifecycle-backlog.md](convoke-note-initiative-lifecycle-backlog.md) §2.3 Fast Lane rows A47 (12.0), I103 (10.8), I104 (10.8) — added 2026-05-25 by Winston (qualifier).
- [session-retro-2026-05-05-cov-and-i97-bug.md](../implementation-artifacts/session-retro-2026-05-05-cov-and-i97-bug.md) AC-RETRO-1 — the unshipped forward-prevention rule.
- [.github/workflows/ci.yml](../../.github/workflows/ci.yml) — currently no top-level `defaults:` block (verified 2026-05-25).
- [package.json](../../package.json) — `scripts.lint` currently `eslint scripts/ index.js tests/` without `--max-warnings 0`.
- [project-context.md](../../project-context.md) — `lint-passes-before-review` rule lives at §lint-passes-before-review; `verification-pipefail` rule does not yet exist.

**Why now:** AC-RETRO-1 + AC-RETRO-2 were called out in the 2026-05-05 retro as "AC-RETRO-1/AC-RETRO-2 picked up at next `bmad-create-story` invocation" — and this *is* the next invocation. Bundling A47+I103+I104 lets one R1 review cover all three (matching the `cov-1.1` / `i97-bug-1` shape of a single-story mini-epic with multiple ACs).

**Stakeholder:** every future dev agent authoring a story (will inherit the new pipefail rule); CI itself (no longer silently lies on piped steps); operator (Amalik) maintaining green CI as the sprint signal.

## Requirements Inventory

Epic ci-hygiene-1 has no formal PRD — it ships three convergent gate-fidelity fixes triaged via the lifecycle backlog. The FRs below restate the AC scope from the constituent story.

### Functional Requirements

FR1: A new rule titled `verification-pipefail` MUST be added to [project-context.md](../../project-context.md), placed adjacent to `lint-passes-before-review` (process conventions grouped). Rule MUST contain the standard 3-section structure (**Statement**, **Why**, **How to apply**) and MUST cite [session-retro-2026-05-05-cov-and-i97-bug.md](../implementation-artifacts/session-retro-2026-05-05-cov-and-i97-bug.md) as scar-story evidence. *(Source: story AC1 — A47)*

FR2: A top-level `defaults: run: shell: bash -eo pipefail {0}` block MUST be added to [.github/workflows/ci.yml](../../.github/workflows/ci.yml), positioned between `concurrency:` and `jobs:`. This makes every `run:` step's bash invocation include `-o pipefail`, propagating the upstream command's exit code through any pipe. *(Source: story AC2 — I103)*

FR3: The `lint` script in [package.json](../../package.json) MUST be amended to include `--max-warnings 0`, making any ESLint warning a non-zero-exit failure. *(Source: story AC3 — I104)*

FR4: Post-implementation, `npm run lint` MUST exit 0 with zero warnings (verified clean at story authoring time, 2026-05-25). If a regression introduces warnings between authoring and dev pickup, the story MUST fix them in scope (small surface, OK to absorb). *(Source: story AC3 + cross-AC4)*

FR5: Post-implementation, the GitHub Actions `ci.yml` workflow MUST run green on the next push to `main`. The full job set (`lint`, `test×3`, `coverage`, `security`, `package-check`, `python-test`) must exit 0. *(Source: story AC4)*

### Non-Functional Requirements

NFR1: Behavior-preserving for production code paths. No agent runtime behavior changes; no migration script changes; no `convoke-*.js` CLI changes. Pure CI/convention layer fix.

NFR2: Full CI matrix MUST exit 0 (`lint` + `test (18|20|22)` + `python-test` + `coverage` + `security` + `package-check`) before story is marked `review`. Note: `--max-warnings 0` activation may surface warnings introduced after authoring; these MUST be fixed in scope.

NFR3: Story MUST be code-reviewed adversarially using `bmad-code-review`. Round 1 mandatory; Rounds 2/3 follow `code-review-convergence` bounds + `feedback_avoid_overcomplicating_audits` (V-pass+R1 only by default).

NFR4: Scope discipline — any further CI hygiene fix not in the story's AC table at implementation time (e.g., the 12 other Fast Lane items triaged on 2026-05-25) MUST stay deferred to its own backlog row. **EXPLICITLY OUT OF SCOPE:** F1 (coverage job concern-split → I102), F5 (branch protection → I105), F6 (install-tarball smoke → T25), F7 (per-file coverage → T26), and the remaining 8 triaged items.

NFR5: AC-RETRO-2 application — Task 1 baseline-capture commands MUST be the SAME commands the corresponding ACs verify against. Specifically: AC3 verifies `npm run lint` exit 0; Task 1 baseline MUST also run `npm run lint`, not a sub-command. AC4 verifies CI green on next push; Task 1 baseline captures the current `gh run list --workflow=ci.yml --limit 1` status.

### Additional Requirements (from existing project-context.md)

- **`code-review-convergence`:** This epic does NOT reopen any shipped work. The three fixes are forward-going.
- **`namespace-decision-for-new-skills`:** N/A — no new skills, workflows, or agents under `_bmad/bme/`. Work touches: (1) `project-context.md` (new rule), (2) `.github/workflows/ci.yml` (one block addition), (3) `package.json` (one flag addition). No skill or agent surfaces touched.
- **`covenant-compliance-for-convoke-skills`:** N/A — no `_bmad/bme/` content modified.
- **`path-safety-for-destructive-ops`:** N/A — config edits only; no scripts that accept user paths or perform destructive operations are added or modified.
- **`derive-counts-from-source`:** AC1 references the rule structure from existing project-context.md rules — dev agent should mechanically inspect adjacent rules at implementation time rather than hardcode counts.
- **`spec-verify-referenced-files`:** Verified 2026-05-25 — `.github/workflows/ci.yml`, `package.json`, `project-context.md`, `session-retro-2026-05-05-cov-and-i97-bug.md` all exist in working tree.
- **`lint-passes-before-review`:** `npm run lint` must exit 0 with zero warnings in modified files before `review`. With AC3's `--max-warnings 0` shipping this story, the gate becomes self-enforcing for any future story.
- **`staleness-preflight-for-backlog-pickup`:** N/A by exemption — backlog rows A47/I103/I104 were qualified 2026-05-25 (today); fresh-work exemption applies (<3 days).

## Stories

| ID | Title | Status | Notes |
|---|---|---|---|
| ci-hygiene-1-1 | Add pipefail to CI workflow + verification-pipefail rule to project-context + lint --max-warnings 0 | ready-for-dev | Single story; covers FR1–FR5. See [story file](../implementation-artifacts/ci-hygiene-1-1-pipefail-and-lint-gate-fidelity.md) |

## Convergence & Sequencing

- **Pre-conditions:** None. All three fixes are independent and additive.
- **Parallel with:** [i97-2-3 Mila conversion](../implementation-artifacts/i97-2-3-convert-mila-research-convergence-specialist.md) (currently `in-progress`); no shared files. This epic ships first so Mila's R1 review (and any subsequent story) inherits the new pipefail rule.
- **Cross-reference:** [Fast Lane backlog rows](convoke-note-initiative-lifecycle-backlog.md#23-fast-lane-quick-wins--spikes) A47, I103, I104 — this epic ships those rows; remaining 12 CI/CD review triage items (I102, I105, T25, T26, T27, T28, I106, I107, I108, I109, I110, I111) stay deferred per NFR4.
- **Retrospective:** Optional (single-story mini-epic following `lint-epic-1` / `mig-test-epic-1` precedent — only mandatory if cross-story lessons surface).

## Out of Scope (for this epic, future-candidates for backlog)

- **Coverage job concern-split (I102).** Splitting `coverage` into `test:p0` + `coverage:report` + `coverage:gate` is the dual-cause-red diagnostic fix; tracked separately at score 1.2.
- **Required-status / branch-protection / notifications (I105).** Structural root cause of 4-day red invisibility; tracked separately at score 3.2.
- **Install-tarball smoke (T25).** Highest-reach item (R:10); deserves its own story focus; tracked separately at score 8.0.
- **Per-file coverage threshold (T26).** Surfaces known per-file gaps; tracked separately at score 2.1.
- **Burn-in re-shape, matrix consistency, version-sync gate, badges.yml safety, python-test discovery, failure-artifact narrowing, self-dep, shared install artifact** — all 8 triaged 2026-05-25; each retains its own Fast Lane row.
- **AC-RETRO-2 codification (baseline-capture binds to AC command).** Applied in NFR5 of *this* epic as a one-off, but the broader codification into `bmad-create-story` template is a separate `bmad-create-story` workflow amendment — not in this CI-hygiene epic's scope. Log as backlog candidate if recurrence becomes friction.
- **AC-RETRO-3 (I97 conversion ACs run full P0 surface).** Orthogonal; applies to I97 Epic 2 conversion stories, not CI hygiene.
