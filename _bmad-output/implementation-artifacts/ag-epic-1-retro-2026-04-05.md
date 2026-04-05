# Epic 1 Retrospective: Artifact Governance Foundation

**Date:** 2026-04-05
**Epic:** ag-epic-1 — Artifact Governance Foundation
**Facilitator:** Bob (Scrum Master)
**Participants:** Amalik (Project Lead), John (PM), Winston (Architect), Amelia (Dev), Quinn (QA), Paige (Tech Writer)

## Epic Summary

| Metric | Value |
|--------|-------|
| Stories completed | 3/3 (100%) |
| Total tests | 62 (28 + 15 + 19) |
| Code reviews | 3 (1 with 7 findings resolved, 2 clean) |
| New files | 6 |
| Modified files | 4 |
| New dependency | gray-matter ^4.0.3 |
| Blockers | 0 |
| Technical debt deferred | 3 (pre-existing in archive.js) |

## What Went Well

1. **Story spec precision** — exact line numbers, file paths, and anti-patterns in story files prevented ambiguity for the dev agent. Stories 1.2 and 1.3 passed code review clean on first pass.

2. **Pre-mortem during PRD** — reduced MVP migration scope from ~160 to ~60 files by excluding `implementation-artifacts/` before any code was written. Single highest-value planning activity.

3. **Architecture-to-story traceability** — every story mapped to specific FRs, every FR mapped to a file in the architecture. The dev had a complete path from requirement to implementation location.

4. **TDD from day one** — 62 tests across 3 stories. 100% inference rule coverage mandated by NFRs and achieved. Tests caught the `matchesConvention` null/boolean inconsistency.

5. **Code review caught real issues** — story 1.1's 3-layer adversarial review found 7 actionable findings including `scanArtifactDirs` not wired into archive.js, unguarded recovery `execSync` calls, and repo-wide git diff scope instead of scoped.

6. **gray-matter decision** — NFR20 (byte-for-byte preservation) compliance achieved in ~5 lines of code. Custom parser risk eliminated entirely.

## What Didn't Go Well

1. **Story 1.1 skipped validation** — the largest and most complex story went straight from creation to dev without a spec review. Code review caught 7 findings, at least 3 of which were spec-level gaps (ambiguous ACs around scanArtifactDirs wiring, matchesConvention type contract). These could have been caught before implementation.

2. **Review depth not calibrated** — story 1.2 (a YAML file + tests) received the same review consideration as story 1.1 (shared lib extraction + refactoring). The inline review for 1.3 was the right calibration.

## Root Causes

- Story 1.1 findings were **spec ambiguity**, not implementation errors. The dev built exactly what was specified, but the spec was incomplete regarding what archive.js should *call* from the shared lib.
- No process gate existed between story creation and dev handoff for spec quality validation.

## Action Items

| # | Action Item | Owner | Apply From | Status |
|---|-------------|-------|------------|--------|
| 1 | **All stories get a review pass before dev** — run story review between create-story and dev-story. No exceptions regardless of story complexity. | Bob + Amalik | Epic 2 onwards | Committed |
| 2 | **Calibrate code review depth to change size** — full parallel agents (3 layers) for stories with 3+ new files or complex logic. Inline review for small/data-only stories. | Bob | Epic 2 onwards | Committed |

## Technical Debt Carried Forward

From story 1.1 code review (deferred — pre-existing in archive.js, not caused by this epic):

1. `parseFilename` unused `taxonomy` parameter — by design, extended in story 2.1
2. `DATED_PATTERN` accepts invalid calendar dates (e.g., `2026-99-99`) — pre-existing regex
3. `appendToIndex` failure after `fs.move` leaves INDEX incomplete — pre-existing, no rollback

## Epic 2 Preparation

**Prerequisites satisfied by Epic 1:**
- [x] Shared lib: `artifact-utils.js` with parseFilename, readTaxonomy, injectFrontmatter, ensureCleanTree, scanArtifactDirs, validateFrontmatterSchema, buildSchemaFields
- [x] Types: `types.js` with InitiativeState, RenameManifestEntry, LinkUpdate, TaxonomyConfig, FrontmatterSchema
- [x] Taxonomy: `taxonomy.yaml` with 8 platform IDs, 21 artifact types, 3 aliases
- [x] gray-matter integrated for frontmatter parsing

**Preparation needed for Epic 2:**
- [ ] Snapshot current `_bmad-output/` filenames as test fixtures in ag-2-1
- [ ] Story ag-2-1 must pass review before dev (Action Item #1)
- [ ] Focus: greedy type matching, alias resolution, 4 governance states — all testable units

## Key Learnings

1. **Story spec quality is the highest-leverage investment.** A 2-minute review catches gaps that would cost a full code review round-trip to discover.
2. **Planning artifacts serve multiple epics.** The PRD and architecture cover all 5 epics. Per-epic planning overhead is front-loaded and decreasing.
3. **Pre-mortems prevent scope bloat.** Imagining failure scenarios during scoping produced the implementation-artifacts exclusion — the single biggest scope reduction.
4. **Match process weight to change risk.** Full adversarial review for complex refactoring, inline review for config files. Don't apply the same ceremony to everything.
