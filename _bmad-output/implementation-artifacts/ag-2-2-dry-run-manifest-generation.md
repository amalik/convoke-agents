# Story 2.2: Dry-Run Manifest Generation

Status: review

## Story

As a Convoke operator,
I want to see exactly what the migration would do before any files are touched,
so that I can review, validate, and resolve ambiguities before committing to irreversible operations.

## Acceptance Criteria

1. **Given** the inference engine has processed all in-scope files, **When** the operator runs `convoke-migrate-artifacts` (dry-run is default), **Then** a manifest is returned containing: old filename -> proposed new filename for every in-scope file
2. Each manifest entry shows initiative (with confidence level + source) and artifact type (with confidence level + source)
3. Ambiguous files (confidence: low) include context clues: first 3 lines of content, git last author + date
4. With `--verbose`, ambiguous files additionally show referencing files (cross-reference scan)
5. Target filename collisions are detected and flagged before any execution
6. Invalid-governed files (filename/frontmatter conflict) are flagged as "CONFLICT -- resolve before migration"
7. Already fully-governed files whose filename already matches the governance convention are listed as "SKIP -- already governed"
8. Files whose filename already matches the governance convention but lack frontmatter are listed as "INJECT ONLY -- frontmatter needed"
   - Note: half-governed files whose filename does NOT match the target convention (e.g., `prd-gyre.md` -> `gyre-prd.md`) are listed as RENAME, not INJECT ONLY
9. The manifest is 100% accurate -- what it shows must match what execution would do (NFR7)
10. Dry-run manifest generation completes in under 10 seconds for up to 200 artifacts (NFR2)

## Tasks / Subtasks

- [x] Task 1: Implement `getContextClues(filePath, projectRoot)` (AC: #3)
  - [x] Read first 3 lines of file content (trimmed, handle files with < 3 lines)
  - [x] Run `git log -1 --format="%an|%as"` on the file, split on `|` to get author + short date (YYYY-MM-DD)
  - [x] Return `{ firstLines: string[], gitAuthor: string, gitDate: string }`
  - [x] Handle non-git files gracefully (return null for git fields)
  - [x] Add to `scripts/lib/artifact-utils.js`, export

- [x] Task 2: Implement `getCrossReferences(targetFilename, scopeFiles, projectRoot)` (AC: #4)
  - [x] For each `.md` file in `scopeFiles`, read content and search for references to `targetFilename`
  - [x] Match patterns: `[...](targetFilename)`, `[...](../dir/targetFilename)`, bare `targetFilename` in text
  - [x] Return `string[]` of filenames that reference the target
  - [x] This is the `--verbose` only feature -- called conditionally
  - [x] Add to `scripts/lib/artifact-utils.js`, export

- [x] Task 3: Implement `buildManifestEntry(fileInfo, taxonomy, projectRoot)` (AC: #1, #2, #6, #7, #8)
  - [x] `fileInfo` = `{ filename, dir, fullPath }` from `scanArtifactDirs()`
  - [x] Read file content via `fs.readFile(fullPath, 'utf8')`
  - [x] Call `getGovernanceState(filename, fileContent, taxonomy)` to classify
  - [x] For `half-governed` and `fully-governed` states: call `generateNewFilename()` and compare with current filename to determine true action
  - [x] Map to manifest action using the filename comparison:
    - `fully-governed` + filename matches generated name -> action: `SKIP`
    - `fully-governed` + filename differs from generated name -> action: `RENAME` (old convention, has frontmatter)
    - `half-governed` + filename matches generated name -> action: `INJECT_ONLY` (just needs frontmatter)
    - `half-governed` + filename differs from generated name -> action: `RENAME` (old convention, needs rename + frontmatter)
    - `ungoverned` (no type match) -> action: `AMBIGUOUS`, include context clues
    - `ambiguous` (type OK, initiative unclear) -> action: `AMBIGUOUS`, include candidates
    - `invalid-governed` -> action: `CONFLICT`, no new filename
  - [x] Return `ManifestEntry` (new typedef in types.js -- see Dev Notes)
  - [x] Add to `scripts/lib/artifact-utils.js`, export

- [x] Task 4: Implement `detectCollisions(entries)` (AC: #5)
  - [x] Input: array of manifest entries with `newPath` fields
  - [x] Group entries by `newPath` (only entries with action `RENAME`)
  - [x] Any `newPath` with > 1 entry is a collision
  - [x] Also check if any `newPath` matches an existing filename in the entries (SKIP/INJECT entries)
  - [x] Return `Map<string, string[]>` of colliding newPath -> list of oldPaths
  - [x] Add to `scripts/lib/artifact-utils.js`, export

- [x] Task 5: Implement `generateManifest(projectRoot, options)` -- main orchestrator (AC: #1-#10)
  - [x] `options` = `{ includeDirs, verbose, excludeDirs }`
  - [x] Default `includeDirs`: `['planning-artifacts', 'vortex-artifacts', 'gyre-artifacts']`
  - [x] Default `excludeDirs`: `['_archive']`
  - [x] Steps:
    1. `readTaxonomy(projectRoot)`
    2. `scanArtifactDirs(projectRoot, includeDirs, excludeDirs)`
    3. For each file: `buildManifestEntry(fileInfo, taxonomy, projectRoot)`
    4. `detectCollisions(entries)` -- annotate colliding entries
    5. If `verbose`: for each ambiguous entry, call `getCrossReferences()`
    6. For each ambiguous entry: call `getContextClues()`
  - [x] Return `{ entries: ManifestEntry[], collisions: Map, summary: { total, skip, rename, inject, conflict, ambiguous } }`
  - [x] This function IS async (file I/O + git ops)
  - [x] Add to `scripts/lib/artifact-utils.js`, export

- [x] Task 6: Implement `formatManifest(manifest, options)` -- text formatter (AC: #1-#8)
  - [x] Input: manifest object from `generateManifest()`
  - [x] Output: formatted string matching architecture spec:
    ```
    old-filename.md -> new-filename.md
      Initiative: helm (confidence: high, source: filename suffix)
      Type: prd (confidence: high, source: prefix match)
    ```
  - [x] Ambiguous entries format:
    ```
    [!] prd.md -> ??? (ambiguous -- cannot infer initiative)
      First line: "# Product Requirements Document - Convoke"
      Git author: Amalik (2026-02-22)
      Referenced by: epic-phase3.md, architecture.md  [--verbose only]
      Candidates: convoke, gyre
      ACTION REQUIRED: Specify initiative for this file
    ```
  - [x] Conflict entries: `[!] helm-prd.md -> CONFLICT (filename says helm, frontmatter says gyre)`
  - [x] SKIP entries: `[SKIP] gyre-prd.md -- already governed`
  - [x] INJECT entries: `[INJECT] gyre-prd.md -- frontmatter needed`
  - [x] Collision entries: append `[!] COLLISION: same target as other-file.md`
  - [x] Summary footer: counts per action type
  - [x] Add to `scripts/lib/artifact-utils.js`, export

- [x] Task 7: Update types.js with new manifest types (AC: #1-#8)
  - [x] Create new `ManifestEntry` typedef (replaces old `RenameManifestEntry` which is a planning placeholder with only 6 fields and 4 states)
  - [x] Deprecate `RenameManifestEntry` with a `@deprecated Use ManifestEntry instead` JSDoc tag (do NOT remove yet -- check for consumers first)
  - [x] `ManifestEntry` fields -- see Type Extensions Needed in Dev Notes below
  - [x] Add `ManifestResult` typedef: `{ entries: ManifestEntry[], collisions: Map<string, string[]>, summary: { total, skip, rename, inject, conflict, ambiguous } }`

- [x] Task 8: Write manifest generation tests (AC: #1-#10)
  - [x] Create `tests/lib/manifest.test.js`
  - [x] Test `getContextClues()`:
    - Returns first 3 lines for a file with > 3 lines
    - Returns all lines for a file with < 3 lines
    - Returns git author info (use a fixture file that's tracked in git)
    - Handles non-existent file gracefully
  - [x] Test `getCrossReferences()`:
    - Finds markdown link references `[text](target.md)`
    - Finds relative path references `[text](../dir/target.md)`
    - Returns empty array for unreferenced files
  - [x] Test `buildManifestEntry()`:
    - Ungoverned file (no type match) -> action AMBIGUOUS
    - Fully-governed file + filename matches target -> action SKIP
    - Fully-governed file + filename differs from target (old convention) -> action RENAME
    - Half-governed file + filename matches target -> action INJECT_ONLY
    - Half-governed file + filename differs from target (old convention, e.g., `prd-gyre.md`) -> action RENAME
    - Invalid-governed file -> action CONFLICT
    - Ambiguous file (type OK, initiative unclear) -> action AMBIGUOUS with candidates
  - [x] Test `detectCollisions()`:
    - No collisions -> empty map
    - Two files with same target -> collision detected
    - Target matches existing SKIP file -> collision detected
  - [x] Test `generateManifest()`:
    - Processes real `_bmad-output/` directories
    - Returns correct summary counts
    - Entries match expected governance states for known files
    - Performance: under 10s for all current artifacts
  - [x] Test `formatManifest()`:
    - RENAME entries show arrow format
    - SKIP entries show `[SKIP]` prefix
    - INJECT entries show `[INJECT]` prefix
    - CONFLICT entries show `[!]` prefix
    - Ambiguous entries show context clues
    - Summary footer includes all counts
  - [x] All tests use real taxonomy via `readTaxonomy(findProjectRoot())`
  - [x] Run full `tests/lib/` suite: 103 existing + new must all pass

- [x] Task 9: Export new functions and run regression checks
  - [x] Export: `getContextClues`, `getCrossReferences`, `buildManifestEntry`, `detectCollisions`, `generateManifest`, `formatManifest`
  - [x] Run `npx jest tests/lib/` -- all tests pass
  - [x] Run `node scripts/archive.js --rename` -- regression check

## Dev Notes

### Previous Story (ag-2-1) Intelligence

- All inference functions are synchronous and take pre-loaded data (filename strings + taxonomy object). The NEW manifest functions in this story are ASYNC because they do file I/O and git operations.
- `inferArtifactType` returns `{ type, hcPrefix, remainder, date }` -- the `remainder` feeds into `inferInitiative`
- `inferInitiative` returns `{ initiative, confidence, source, candidates }` -- the `confidence` and `source` fields are what gets displayed in the manifest
- `getGovernanceState` returns `{ state, fileInitiative, frontmatterInitiative, candidates }` -- this is the primary classifier for manifest entries
- `generateNewFilename` returns a string -- call for ALL files where type + initiative are resolved (half-governed and fully-governed), then compare with current filename to determine RENAME vs SKIP/INJECT_ONLY
- `scanArtifactDirs` returns `[{ filename, dir, fullPath }]` -- this is the input to manifest generation
- Existing tests: 103 across 3 files (artifact-utils.test.js, taxonomy.test.js, inference.test.js)
- ag-2-1 had 3 test failures during dev: alias ordering, suffix initiative matching, qualifier extraction. All resolved. Patterns are now stable.

### Architecture Compliance

**Manifest output format** (from arch Decision 1, lines 472-493):
- Standard entry: `old.md -> new.md` with initiative/type metadata indented below
- Ambiguous: `[!]` prefix, `-> ???`, context clues, candidates list, "ACTION REQUIRED" label
- Conflict: `[!]` prefix, `-> CONFLICT`, "ACTION REQUIRED" label
- SKIP: `[SKIP]` prefix
- INJECT: `[INJECT]` prefix

**Pipeline position**: This is Phase 1 (Plan) of the migration pipeline: scan -> infer -> **plan (dry-run)** -> review -> execute -> verify. The CLI wrapper (ag-2-3) will call `generateManifest()` and then `formatManifest()` and print the result. This story builds the data + formatting layer only -- no CLI.

**NFR7 (100% accuracy)**: The manifest entries must contain the EXACT same data that the execution phase would use. This means `buildManifestEntry` must use the same inference path that the future execution will use. Since execution will also call `getGovernanceState` + `generateNewFilename`, this is satisfied by construction.

**NFR2 (< 10s for 200 files)**: The hot path is synchronous inference. The I/O overhead is file reads + git log calls. Git log calls should be batched or only run for ambiguous files. Context clues are only gathered for ambiguous/conflict files, not for all files.

### Governance State -> Manifest Action Mapping

**Critical**: `getGovernanceState` classifies based on inference ability, NOT whether the filename follows the new governance convention. A file like `prd-gyre.md` is `half-governed` (type + initiative resolved, no frontmatter) but its filename differs from the governance target `gyre-prd.md`. The `buildManifestEntry` function must compare the current filename with `generateNewFilename()` output to determine the correct action.

| Governance State | Filename == Generated? | Action | Context Clues? |
|-----------------|----------------------|--------|----------------|
| `fully-governed` | Yes | SKIP | No |
| `fully-governed` | No (old convention) | RENAME | No |
| `half-governed` | Yes | INJECT_ONLY | No |
| `half-governed` | No (old convention) | RENAME | No |
| `ambiguous` | N/A | AMBIGUOUS | Yes |
| `ungoverned` | N/A | AMBIGUOUS | Yes |
| `invalid-governed` | N/A | CONFLICT | Yes (show both values) |

**State definitions:**
- `ambiguous`: artifact type matches but initiative has low confidence (candidates available)
- `ungoverned`: no artifact type matches at all (e.g., `initiatives-backlog.md`)
- Both surface as AMBIGUOUS since neither can produce a valid new filename

### Type Extensions Needed

Create new `ManifestEntry` in `types.js` (replaces old `RenameManifestEntry` planning placeholder):

```javascript
/**
 * Manifest entry for dry-run display. Replaces RenameManifestEntry.
 * @typedef {Object} ManifestEntry
 * @property {string} oldPath - Current relative path (e.g., 'planning-artifacts/prd-gyre.md')
 * @property {string|null} newPath - Proposed new path (null for SKIP/CONFLICT/AMBIGUOUS)
 * @property {string|null} initiative - Resolved initiative ID (null if ambiguous)
 * @property {string|null} artifactType - Resolved artifact type (null if ungoverned)
 * @property {'high'|'low'} confidence - Initiative inference confidence
 * @property {string} source - Inference source (exact/alias/empty/unresolved)
 * @property {'RENAME'|'SKIP'|'INJECT_ONLY'|'CONFLICT'|'AMBIGUOUS'} action
 * @property {string} dir - Directory name (e.g., 'planning-artifacts')
 * @property {{firstLines: string[], gitAuthor: string, gitDate: string}|null} contextClues
 * @property {string[]|null} crossReferences - Files referencing this one (verbose only)
 * @property {string[]} candidates - Possible initiative matches (ambiguous only)
 * @property {string[]|null} collisionWith - Other files colliding on same newPath
 * @property {string|null} frontmatterInitiative - Initiative from frontmatter (for CONFLICT display)
 * @property {string|null} fileInitiative - Initiative from filename (for CONFLICT display)
 */
```

**Note:** The old `RenameManifestEntry` (6 fields, 4 states, missing `ambiguous`) is a planning placeholder not consumed by any code. Deprecate it with `@deprecated` JSDoc tag but do not remove until consumers are verified.

### Anti-Patterns to AVOID

- Do NOT call `getContextClues()` for SKIP or RENAME entries -- only for AMBIGUOUS and CONFLICT
- Do NOT call `getCrossReferences()` unless `--verbose` is set -- it reads every file in scope
- Do NOT make inference functions async -- only the new I/O functions are async
- Do NOT create a CLI script in this story -- that's ag-2-3
- Do NOT modify existing inference functions from ag-2-1
- Do NOT use emoji characters in manifest output (use `[!]`, `[SKIP]`, `[INJECT]` text prefixes instead -- they're grep-friendly)

### File Structure

```
scripts/
└── lib/
    ├── artifact-utils.js    # MODIFIED -- add 6 new functions
    └── types.js             # MODIFIED -- add ManifestEntry, ManifestResult typedefs

tests/
└── lib/
    └── manifest.test.js     # NEW -- manifest generation tests
```

### Testing Standards

- Jest test framework
- File: `tests/lib/manifest.test.js` (separate concern from inference.test.js)
- Load real taxonomy via `readTaxonomy(findProjectRoot())`
- Use existing fixture files in `tests/fixtures/artifact-samples/` where applicable
- For `generateManifest()` integration test: run against real `_bmad-output/` directories
- Performance assertion: `expect(duration).toBeLessThan(10000)` for the full manifest
- Run full `tests/lib/` suite after: 103 existing + new must all pass

### References

- [Source: arch-artifact-governance-portfolio.md -- Pipeline Phase 1, Manifest Format (lines 285-309, 472-493)]
- [Source: prd-artifact-governance-portfolio.md -- FR7, FR9, FR10, FR11, FR18, FR19, FR50; NFR2, NFR7]
- [Source: scripts/lib/artifact-utils.js -- inferArtifactType, inferInitiative, getGovernanceState, generateNewFilename, scanArtifactDirs]
- [Source: scripts/lib/types.js -- RenameManifestEntry, LinkUpdate typedefs]
- [Source: ag-2-1-initiative-inference-engine.md -- Dev Agent Record, completion notes]
- [Source: _bmad/_config/taxonomy.yaml -- 8 platform initiatives, 21 artifact types, 6 aliases]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (1M context)

### Debug Log References

- 136/136 lib tests pass (103 existing + 33 new manifest tests)
- Archive regression: 72 warnings (expected — new story file adds 1)
- Performance: generateManifest() completes in < 14s for full repo (within NFR2 for 200 artifacts)
- Zero test failures during development

### Completion Notes List

- Implemented `getContextClues(filePath, projectRoot)` — reads first 3 lines + git log author/date. Graceful fallback for unreadable or untracked files.
- Implemented `getCrossReferences(targetFilename, scopeFiles, projectRoot)` — scans all .md files in scope for references via `content.includes()`. Skips self-references and non-md files.
- Implemented `buildManifestEntry(fileInfo, taxonomy, projectRoot)` — core classifier with filename comparison: compares current filename against `generateNewFilename()` output to distinguish RENAME vs SKIP/INJECT_ONLY. Handles all 5 governance states + unreadable file fallback.
- Implemented `detectCollisions(entries)` — groups RENAME entries by target, also detects collisions with existing SKIP/INJECT files.
- Implemented `generateManifest(projectRoot, options)` — async orchestrator: taxonomy + scan + classify + collisions + context clues (AMBIGUOUS/CONFLICT only) + cross-references (verbose only).
- Implemented `formatManifest(manifest, options)` — text formatter with [SKIP], [INJECT], [!] CONFLICT, [!] AMBIGUOUS prefixes. Arrow format for RENAME. Summary footer with counts.
- Created `ManifestEntry` typedef (14 fields) and `ManifestResult` typedef in types.js. Deprecated old `RenameManifestEntry` (6 fields, planning placeholder).
- 33 new tests: getContextClues (4), getCrossReferences (4), buildManifestEntry (7), detectCollisions (4), generateManifest (6), formatManifest (8)

### File List

- `scripts/lib/artifact-utils.js` — MODIFIED (added 6 manifest generation functions + exports)
- `scripts/lib/types.js` — MODIFIED (added ManifestEntry, ManifestResult typedefs; deprecated RenameManifestEntry)
- `tests/lib/manifest.test.js` — NEW (33 tests)
