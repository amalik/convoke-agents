# Epic 3 Retrospective: Migration Execution & Safety

**Date:** 2026-04-06
**Epic:** ag-epic-3 — Migration Execution & Safety
**Facilitator:** Bob (Scrum Master)
**Participants:** Amalik (Project Lead), Winston (Architect), Amelia (Dev), Quinn (QA)

## Epic Summary

| Metric | Value |
|--------|-------|
| Stories completed | 4/4 (100%) |
| Tests added | ~56 |
| Total tests passing | 223 |
| Code reviews | 4 full adversarial |
| Review findings resolved | 17 patches total |
| Lint errors caught by convoke-check | 2 |
| Test failures caught by convoke-check | 1 (mock leak) |
| CI failures (GitHub Actions) | 2 (lint — caused by premature push) |
| Blockers | 0 |
| New technical debt | 0 |

## Previous Retro Action Item Follow-Through

| # | Action Item (from Epic 2) | Status | Impact |
|---|---------------------------|--------|--------|
| 1 | Create `convoke-check` script | ✅ Completed | Caught 2 lint errors + 1 mock leak before they would have been CI failures |
| 2 | Add `convoke-check` to dev workflow | ✅ Completed | Run as final step in every story |
| 3 | Continue story review gate | ✅ Completed | 4/4 stories reviewed before dev, all had meaningful findings |
| 4 | Full 3-layer code review for Epic 3 | ✅ Completed | 17 patches across 4 reviews |

**Critical path items from Epic 2:**

| # | Item | Status |
|---|------|--------|
| 1 | Build `convoke-check` | ✅ Done before Epic 3 |
| 2 | Fix `ensureCleanTree` shell injection | ✅ Done — all `execSync` removed, `execFileSync` only |
| 3 | Verify CI suites pass locally | ✅ Done |

**All 4 action items completed. All 3 critical path items completed.**

## What Went Well

1. **`convoke-check` proved its value immediately** — caught 2 lint errors and 1 mock leak during Epic 3. The retro action item from Epic 2 delivered exactly as designed.

2. **Story review gate continued catching critical design flaws** — MigrationError name collision (3-1), scope creep of rename-map into 3-2, contradictory idempotent recovery strategy (3-3), supersession double-insertion risk (3-4). 4/4 stories had meaningful review findings.

3. **All Epic 2 retro commitments completed** — 4/4 action items, 3/3 critical path items. The retro process is delivering compounding value across epics.

4. **Zero blockers, zero test failures in production code** — 1 mock leak during dev (ag-3-1) resolved immediately. ag-3-2 and ag-3-4 had zero test failures during dev.

5. **Code review quality high** — 17 patches across 4 reviews, including commit-failure rollback gap (3-1), inputDocuments substring corruption (3-2), stale collision detection after ambiguous resolution (3-3), double-insertion guard (3-4).

6. **Transactional 3-commit pipeline architecture sound** — rename -> inject -> ADR with phase-specific rollback worked as designed. Non-blocking commit 3 preserves data integrity on ADR failure.

## What Didn't Go Well

1. **2 CI lint failures reached GitHub Actions** — caused by pushing intermediate work to main before `convoke-check` completed. Not a tooling gap — a workflow timing issue.

## Root Causes

- `convoke-check` runs at story completion, but intermediate file saves were pushed to main during development, triggering CI on unfinished code.
- Fix is behavioral: push only after story completion + `convoke-check` pass.

## Action Items

| # | Action Item | Owner | Apply From | Status |
|---|-------------|-------|------------|--------|
| 1 | **Push only after story completion + convoke-check pass** — no intermediate pushes to main. Every push = verified complete story. | Amalik | Immediate | Committed |
| 2 | **Continue story review gate** — review before dev, no exceptions. | Bob + Amalik | Ongoing | Continuing |
| 3 | **Continue full 3-layer code review** — every story gets adversarial review. | Bob | Ongoing | Continuing |
| 4 | **Continue convoke-check as final gate** — run before marking review. | Amelia (Dev) | Ongoing | Continuing |

## Technical Debt

| # | Item | Priority | Status |
|---|------|----------|--------|
| 1 | Sequential I/O in `getCrossReferences` | Low | Carried from Epic 2 (--verbose only) |
| 2 | `execSync` blocks event loop in `getContextClues` | Low | Carried from Epic 2 (AMBIGUOUS/CONFLICT only) |
| 3 | `ensureCleanTree` shell injection | ~~Med~~ | ✅ RESOLVED before Epic 3 |

No new technical debt added in Epic 3.

## Epic 4 Preview: Portfolio Intelligence

5 stories: inference rules, portfolio engine + registry, degraded mode + governance health, WIP radar filtering, output formats + CLI wrapper.

Dependencies on Epic 3: portfolio reads governed artifacts (frontmatter metadata from commit 2), uses taxonomy for initiative IDs, consumes `artifact-rename-map.md` for historical reference.

No significant discoveries invalidating Epic 4 plan. Architecture is sound.

**Note:** New initiative (Skill Portability & Distribution) added to sprint-status but team confirmed: Epic 4 (Portfolio Intelligence) is next.

## Readiness Assessment

| Area | Status |
|------|--------|
| Testing & Quality | 223 tests, 4 code reviews, zero regressions |
| Deployment | N/A — internal tooling |
| Technical Health | Stable, clean architecture |
| Unresolved Blockers | None |
| Critical Path | 0 items before Epic 4 |
