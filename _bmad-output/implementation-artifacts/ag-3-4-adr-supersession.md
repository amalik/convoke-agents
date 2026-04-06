# Story 3.4: ADR Supersession

Status: done

## Story

As a Convoke operator,
I want the migration to produce a new ADR documenting the governance convention and mark the old ADR as superseded,
so that the naming standard is formally documented and the old convention is clearly replaced.

## Acceptance Criteria

1. **Given** the migration has completed successfully, **When** the ADR generation step runs, **Then** a new ADR is created at `_bmad-output/planning-artifacts/adr-artifact-governance-convention-{date}.md`
2. The new ADR documents: naming convention, taxonomy structure, frontmatter schema v1, migration scope, and relationship to previous ADR
3. The existing ADR (`adr-repo-organization-conventions-2026-03-22.md`) has its status field updated from `ACCEPTED` to `SUPERSEDED`
4. The existing ADR's header includes: `Superseded by: adr-artifact-governance-convention-{date}.md`

## Tasks / Subtasks

- [x] Task 1: Implement `generateGovernanceADR(date, migrationStats)` in artifact-utils.js (AC: #1, #2)
  - [x] `migrationStats` = `{ renamedCount, injectedCount, linksUpdated, scopeDirs }` — actual numbers from migration run
  - [x] Returns markdown string for the new ADR document
  - [x] Content sections: Context (why governance convention was adopted), Decision (naming convention `{initiative}-{type}[-qualifier][-date].md`), Taxonomy structure (8 platform initiatives, artifact types list), Frontmatter schema v1 (4 required fields), Migration scope (which directories, how many files — from `migrationStats`), Relationship to previous ADR (`Supersedes: adr-repo-organization-conventions-2026-03-22.md`)
  - [x] Status: `ACCEPTED`
  - [x] Header format: standard ADR with Status, Date, Decision Makers, Supersedes fields
  - [x] Export function

- [x] Task 2: Implement `supersedePreviousADR(projectRoot, newADRFilename)` in artifact-utils.js (AC: #3, #4)
  - [x] Read `_bmad-output/planning-artifacts/adr-repo-organization-conventions-2026-03-22.md`
  - [x] Replace `**Status:** ACCEPTED` with `**Status:** SUPERSEDED` (line 3 — markdown header, NOT frontmatter)
  - [x] Keep `**Supersedes:** N/A (first formal repo organization standard)` UNCHANGED
  - [x] INSERT new line after the Supersedes line: `**Superseded by:** {newADRFilename}`
  - [x] Write modified content back
  - [x] If old ADR not found, log warning but do NOT fail migration (non-blocking)
  - [x] Export function

- [x] Task 3: Wire ADR generation into --apply flow (AC: #1, #2, #3, #4)
  - [x] After `executeInjections` succeeds (after commit 2, line ~316): call `generateGovernanceADR` and `supersedePreviousADR`
  - [x] Pass manifest summary to `generateGovernanceADR` so the ADR includes actual migration stats (files renamed, directories in scope)
  - [x] Write new ADR to `_bmad-output/planning-artifacts/adr-artifact-governance-convention-{date}.md`
  - [x] Stage both files: `git add _bmad-output/planning-artifacts/`
  - [x] Create commit 3: `chore: generate governance convention ADR`
  - [x] Print: "ADR generated: adr-artifact-governance-convention-{date}.md"
  - [x] On failure: log warning but do NOT rollback commits 1-2 (ADR is documentation, not data)
  - [x] Update `detectMigrationState` to also recognize `chore: generate governance convention ADR` as a 'complete' signal (prevents fragility if >5 commits before re-run)

- [x] Task 4: Write tests (AC: #1-#4)
  - [x] Add to `tests/lib/migration-execution.test.js`
  - [x] Test `generateGovernanceADR`:
    - Returns markdown string with correct structure
    - Contains naming convention, taxonomy structure, frontmatter schema sections
    - Contains `Supersedes: adr-repo-organization-conventions-2026-03-22.md`
    - Status is `ACCEPTED`
  - [x] Test `supersedePreviousADR`:
    - Updates status from ACCEPTED to SUPERSEDED
    - Adds `Superseded by:` line with new ADR filename
    - Non-existent old ADR logs warning, does not throw
  - [x] Integration test in temp git repo: full pipeline produces 3 commits (rename, inject, ADR)

- [x] Task 5: Run convoke-check and regression suite
  - [x] Run `node scripts/convoke-check.js --skip-coverage` -- all steps pass
  - [x] Run `node scripts/migrate-artifacts.js` -- dry-run still works
  - [x] Run `node scripts/archive.js --rename` -- regression check

## Dev Notes

### Previous Story (ag-3-3) Intelligence

- The `--apply` flow now: detectMigrationState -> resolveAmbiguous -> confirm -> ensureCleanTree -> executeRenames (commit 1) -> verifyHistoryChain -> executeInjections (commit 2) -> summary.
- `executeInjections` generates `artifact-rename-map.md` and includes it in commit 2.
- `detectMigrationState` checks last 5 commits for migration markers.
- 213 tests pass across 6 test files.
- `convoke-check` catches lint errors before push.

### Architecture Compliance

**FR21**: Migration generates a new ADR AND updates the existing ADR's status. The new ADR documents the governance convention, not the migration itself.

**Commit strategy**: The ADR is a separate commit 3 (not part of commit 2). Rationale: commit 2 is frontmatter injection + link updates (data transformation). The ADR is documentation — it should be a clean, separate commit that can be independently reverted without affecting the data migration.

**Existing ADR format**: The old ADR at `adr-repo-organization-conventions-2026-03-22.md` uses markdown headers (NOT YAML frontmatter) for status. Line 3: `**Status:** ACCEPTED`. This is a string replacement, not a frontmatter parse.

**Non-blocking**: If ADR generation fails (file write, git commit), the migration is still successful. Log warning, don't rollback commits 1-2.

### ADR Content Template

The new ADR should follow standard ADR format:
```markdown
# Architecture Decision Record: Artifact Governance Convention

**Status:** ACCEPTED
**Date:** {date}
**Decision Makers:** Convoke migration tool
**Supersedes:** adr-repo-organization-conventions-2026-03-22.md

---

## Context
[Why the governance convention was adopted]

## Decision
[The naming convention: {initiative}-{type}[-qualifier][-date].md]

## Taxonomy
[8 platform initiatives, artifact types list, aliases]

## Frontmatter Schema v1
[4 required fields: initiative, artifact_type, created, schema_version]

## Migration Scope
[Which directories were migrated, how many files]

## Consequences
[What changes, what stays the same]
```

### Anti-Patterns to AVOID

- Do NOT modify `executeRenames` or `executeInjections` from ag-3-1/3-2
- Do NOT rollback commits 1-2 if ADR generation fails — ADR is documentation only
- Do NOT parse the old ADR's status via gray-matter — it uses markdown headers, not YAML frontmatter
- Do NOT forget to update `detectMigrationState` to recognize the ADR commit — otherwise >5 intervening commits would break idempotent recovery
- Do NOT use a purely static ADR template — pass migration stats so the ADR records actual file counts and scope

### File Structure

```
scripts/
├── migrate-artifacts.js     # MODIFIED -- add ADR step after executeInjections
└── lib/
    └── artifact-utils.js    # MODIFIED -- add generateGovernanceADR, supersedePreviousADR

tests/
└── lib/
    └── migration-execution.test.js  # MODIFIED -- add ADR tests
```

### Testing Standards

- Jest test framework
- Extend `tests/lib/migration-execution.test.js`
- Unit tests for `generateGovernanceADR` (pure function, no I/O)
- Unit tests for `supersedePreviousADR` with temp files
- Integration test: full 3-commit pipeline in temp git repo
- Run `convoke-check --skip-coverage` after all tests
- 213 existing + new must all pass

### References

- [Source: arch-artifact-governance-portfolio.md -- FR21: ADR generation + supersession]
- [Source: prd-artifact-governance-portfolio.md -- FR21]
- [Source: _bmad-output/planning-artifacts/adr-repo-organization-conventions-2026-03-22.md -- existing ADR to supersede]
- [Source: scripts/migrate-artifacts.js -- --apply flow, commit 2 completion point]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (1M context)

### Debug Log References

- 223/223 tests pass (213 existing + 10 new)
- convoke-check: all 5 steps pass (lint clean on first try)
- Dry-run still works (71 files)
- Zero test failures during development

### Completion Notes List

- Implemented `generateGovernanceADR(date, migrationStats)` — returns complete ADR markdown with Context, Decision, Taxonomy, Frontmatter Schema v1, Migration Scope (actual stats from run), Consequences sections. Status: ACCEPTED. Supersedes: adr-repo-organization-conventions-2026-03-22.md.
- Implemented `supersedePreviousADR(projectRoot, newADRFilename)` — reads old ADR, replaces `**Status:** ACCEPTED` with `SUPERSEDED`, inserts `**Superseded by:** {filename}` after Supersedes line. Non-blocking: returns false if old ADR not found.
- Wired commit 3 into --apply flow after executeInjections: generates ADR, supersedes old ADR, stages, commits `chore: generate governance convention ADR`. Non-blocking try/catch: failure warns but preserves commits 1-2.
- Updated `detectMigrationState` to recognize ADR commit message as 'complete' signal (alongside inject message).
- 10 new tests: detectMigrationState ADR commit (1), generateGovernanceADR structure (6), supersedePreviousADR status/superseded-by/missing (3)

### File List

- `scripts/lib/artifact-utils.js` — MODIFIED (added generateGovernanceADR, supersedePreviousADR, updated detectMigrationState + exports)
- `scripts/migrate-artifacts.js` — MODIFIED (added ADR commit 3 step after executeInjections, updated imports)
- `tests/lib/migration-execution.test.js` — MODIFIED (added 10 tests)
