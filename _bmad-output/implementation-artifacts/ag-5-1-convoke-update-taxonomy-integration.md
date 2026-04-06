# Story 5.1: convoke-update Taxonomy Integration

Status: done

## Story

As a Convoke operator upgrading from a pre-I14 installation,
I want the update pipeline to automatically create and maintain my taxonomy config,
so that governance tools work without manual setup after updating.

## Acceptance Criteria

1. **Given** a project installed before I14 (no taxonomy.yaml exists), **When** the operator runs `convoke-update`, **Then** a new migration creates `_bmad/_config/taxonomy.yaml` with platform defaults
2. The migration is idempotent -- if taxonomy.yaml already exists, it merges platform entries without overwriting user extensions (FR41)
3. Merge follows the same pattern as existing `config-merger.js` (seed defaults, preserve user additions)
4. If a user initiative ID matches a new platform ID (e.g., user added `helm` before it became official), the ID is promoted from user to platform section (FR42)
5. Promotion leaves a YAML comment: `# promoted from user section on {date}`
6. The migration integrates with the existing migration registry (append-only, same pattern as other migrations)
7. Existing `convoke-update` tests continue to pass

## Tasks / Subtasks

- [x] Task 1: Implement `mergeTaxonomy(projectRoot)` in a new lib file (AC: #1, #2, #3, #4, #5)
  - [x] Create `scripts/update/lib/taxonomy-merger.js`
  - [x] Implement `mergeTaxonomy(projectRoot)` function:
    - If `_bmad/_config/taxonomy.yaml` does NOT exist: create with platform defaults (same as `bootstrapTaxonomy` in migrate-artifacts.js but with the full alias set)
    - If EXISTS: read current, merge platform initiatives (add missing, don't remove user-added), merge artifact_types (add missing), merge aliases (add missing)
  - [x] Implement user-to-platform promotion (FR42): if a user initiative matches a platform initiative, move it to platform section and add YAML comment
  - [x] Use `js-yaml` for read/write (already a dependency)
  - [x] Return `{ created: boolean, merged: boolean, promoted: string[] }` for internal reporting
  - [x] The migration's `apply()` converts this to `string[]` for the migration runner (e.g., `['Created taxonomy.yaml with platform defaults']` or `['Merged 2 new platform initiatives', 'Promoted helm from user to platform']`)
  - [x] Export function

- [x] Task 2: Create migration entry in registry (AC: #6)
  - [x] Create `scripts/update/migrations/2.0.x-to-3.1.0.js` with `fromVersion: '2.0.x'` (chains from last entry `1.7.x-to-2.0.0`)
  - [x] Migration exports: `{ name: '2.0.x-to-3.1.0', fromVersion: '2.0.x', breaking: false, description, module: null }`
  - [x] `apply(projectRoot)` calls `mergeTaxonomy(projectRoot)` and converts result object to `string[]` (migration runner expects array of change descriptions)
  - [x] `preview()` returns `{ actions: [...] }` describing what would happen
  - [x] Append entry to `scripts/update/migrations/registry.js` (bottom of MIGRATIONS array)

- [x] Task 3: Verify integration approach (AC: #1, #2)
  - [x] Taxonomy merge belongs in the migration delta (version-specific logic for I14), NOT in refreshInstallation
  - [x] For NEW installs: `bootstrapTaxonomy` in `migrate-artifacts.js` creates taxonomy on first `convoke-migrate-artifacts` run — this is sufficient. No change to install scripts needed in this story.
  - [x] Do NOT modify `refreshInstallation.js` — taxonomy is not a static file to copy

- [x] Task 4: Write tests (AC: #1-#7)
  - [x] Create `tests/unit/taxonomy-merger.test.js` (Node built-in test runner, matching existing update test pattern)
  - [x] Test `mergeTaxonomy`:
    - No existing taxonomy -> creates with platform defaults
    - Existing taxonomy with user additions -> merges without overwriting
    - User initiative matching platform -> promoted with comment
    - Idempotent: running twice produces same result
  - [x] Run existing convoke-update tests: `npm test` must pass (AC #7)

- [x] Task 5: Run convoke-check and regression suite
  - [x] Run `node scripts/convoke-check.js --skip-coverage` -- all steps pass
  - [x] Run existing update tests: `npm test`
  - [x] Verify: `convoke-update` still works for non-taxonomy scenarios

## Dev Notes

### Previous Story (ag-4-5) Intelligence

- `bootstrapTaxonomy(projectRoot)` in `scripts/migrate-artifacts.js` already creates taxonomy.yaml with platform defaults + empty aliases. This story's merge logic is more sophisticated: it MERGES with existing, handles promotion, and integrates into the update pipeline.
- `readTaxonomy(projectRoot)` in `scripts/lib/artifact-utils.js` validates taxonomy structure. Can be reused for post-merge validation.
- 308 tests pass across 10+ test files.

### Architecture Compliance

**Migration pattern**: Append new entry to `scripts/update/migrations/registry.js`. Follow the same structure as existing entries (`name`, `fromVersion`, `breaking`, `description`, `module`). The migration module has `preview()` and `apply(projectRoot)` methods.

**Config merge pattern (FR41)**: Mirror `config-merger.js`:
- Platform entries are canonical (from hardcoded defaults)
- User entries are preserved (never deleted)
- New platform entries are added if missing
- Promotion: user -> platform when IDs match

**Taxonomy defaults**: Use the same constants as `migrate-artifacts.js`:
- `PLATFORM_INITIATIVES`: vortex, gyre, bmm, forge, helm, enhance, loom, convoke
- `DEFAULT_ARTIFACT_TYPES`: 21 types
- `aliases`: strategy-perimeter->helm, strategy->helm, strategic->helm, strategic-navigator->helm, strategic-practitioner->helm, team-factory->loom (migration-specific, included in merge for completeness)

**Version range**: `fromVersion: '2.0.x'`, name: `2.0.x-to-3.1.0`. Chains from last registry entry (`1.7.x-to-2.0.0`). Applies to any 2.0.x+ installation without taxonomy. Idempotency via file-exists check.

**apply() return type**: Migration runner expects `string[]` (array of change descriptions). `mergeTaxonomy` returns a result object internally; `apply()` converts to descriptions.

**New installs**: Out of scope. `bootstrapTaxonomy` in `migrate-artifacts.js` handles new installs on first `convoke-migrate-artifacts` run. Install scripts not modified.

### Testing Pattern

Existing update tests use Node's built-in test runner (`node --test`), NOT Jest. New tests should follow this pattern. Files go in `tests/unit/` not `tests/lib/`.

### Anti-Patterns to AVOID

- Do NOT modify `config-merger.js` — create a separate `taxonomy-merger.js` for taxonomy-specific logic
- Do NOT modify `refreshInstallation.js` unless taxonomy seeding is needed for new installs
- Do NOT modify existing migration entries — append-only registry
- Do NOT use Jest for update tests — use Node's built-in test runner (`node:test`)
- Do NOT import from `migrate-artifacts.js` — duplicate the constants if needed (different module boundary)

### File Structure

```
scripts/
└── update/
    ├── lib/
    │   └── taxonomy-merger.js           # NEW — taxonomy merge logic
    ├── migrations/
    │   ├── registry.js                  # MODIFIED — append new entry
    │   └── 2.0.x-to-3.1.0.js          # NEW — migration delta (fromVersion: 2.0.x)
    └── convoke-update.js               # EXISTING — not modified

tests/
└── unit/
    └── taxonomy-merger.test.js          # NEW — Node built-in test runner
```

### References

- [Source: arch-artifact-governance-portfolio.md -- FR40, FR41, FR42]
- [Source: prd-artifact-governance-portfolio.md -- FR40, FR41, FR42]
- [Source: scripts/update/migrations/registry.js -- migration pattern]
- [Source: scripts/update/lib/config-merger.js -- merge pattern reference]
- [Source: scripts/migrate-artifacts.js -- bootstrapTaxonomy, PLATFORM_INITIATIVES, DEFAULT_ARTIFACT_TYPES]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (1M context)

### Debug Log References

- convoke-check: all 5 steps pass (lint, unit, integration, jest lib)
- 7/7 new taxonomy-merger tests pass (Node built-in test runner)
- 3 existing test files required chain updates: registry.test.js, migration-runner-orchestration.test.js, upgrade.test.js
- convoke-check caught the regression immediately — hardcoded migration chain expectations needed the new entry
- Zero lint errors

### Completion Notes List

- Implemented `scripts/update/lib/taxonomy-merger.js` with `mergeTaxonomy(projectRoot)`: creates taxonomy if absent (platform defaults + aliases), merges platform entries preserving user additions, promotes user IDs matching platform with YAML comment.
- Created `scripts/update/migrations/2.0.x-to-3.1.0.js`: migration with `preview()` and `apply(projectRoot)` following existing module pattern. `apply()` calls `mergeTaxonomy` and converts result to `string[]`.
- Appended new entry to `scripts/update/migrations/registry.js` (append-only).
- Updated 3 existing test files with hardcoded chain expectations to include new migration: `registry.test.js` (6 chain assertions + 1 new entry point test), `migration-runner-orchestration.test.js` (2 chain assertions), `upgrade.test.js` (1 chain assertion).
- Created `tests/unit/taxonomy-merger.test.js` with 7 tests: create from scratch, merge preserving user, promote user->platform, idempotency, migration module shape, preview, apply.

### File List

- `scripts/update/lib/taxonomy-merger.js` — NEW (merge logic)
- `scripts/update/migrations/2.0.x-to-3.1.0.js` — NEW (migration delta)
- `scripts/update/migrations/registry.js` — MODIFIED (appended new entry)
- `tests/unit/taxonomy-merger.test.js` — NEW (7 tests)
- `tests/unit/registry.test.js` — MODIFIED (chain assertions updated)
- `tests/unit/migration-runner-orchestration.test.js` — MODIFIED (chain assertions updated)
- `tests/integration/upgrade.test.js` — MODIFIED (chain assertion updated)
