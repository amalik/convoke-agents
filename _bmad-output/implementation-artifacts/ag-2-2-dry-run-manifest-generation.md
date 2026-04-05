# Story 2.2: Dry-Run Manifest Generation

Status: ready-for-dev

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
7. Already fully-governed files are listed as "SKIP -- already governed"
8. Half-governed files (filename matches convention, no frontmatter) are listed as "INJECT ONLY -- frontmatter needed"
9. The manifest is 100% accurate -- what it shows must match what execution would do (NFR7)
10. Dry-run manifest generation completes in under 10 seconds for up to 200 artifacts (NFR2)

## Tasks / Subtasks

- [ ] Task 1: Implement `getContextClues(filePath, projectRoot)` (AC: #3)
  - [ ] Read first 3 lines of file content (trimmed, handle files with < 3 lines)
  - [ ] Run `git log -1 --format="%an (%ai)"` on the file to get last author + date
  - [ ] Return `{ firstLines: string[], gitAuthor: string, gitDate: string }`
  - [ ] Handle non-git files gracefully (return null for git fields)
  - [ ] Add to `scripts/lib/artifact-utils.js`, export

- [ ] Task 2: Implement `getCrossReferences(targetFilename, scopeFiles, projectRoot)` (AC: #4)
  - [ ] For each `.md` file in `scopeFiles`, read content and search for references to `targetFilename`
  - [ ] Match patterns: `[...](targetFilename)`, `[...](../dir/targetFilename)`, bare `targetFilename` in text
  - [ ] Return `string[]` of filenames that reference the target
  - [ ] This is the `--verbose` only feature -- called conditionally
  - [ ] Add to `scripts/lib/artifact-utils.js`, export

- [ ] Task 3: Implement `buildManifestEntry(fileInfo, taxonomy, projectRoot)` (AC: #1, #2, #6, #7, #8)
  - [ ] `fileInfo` = `{ filename, dir, fullPath }` from `scanArtifactDirs()`
  - [ ] Read file content via `fs.readFile(fullPath, 'utf8')`
  - [ ] Call `getGovernanceState(filename, fileContent, taxonomy)` to classify
  - [ ] Map governance state to manifest action:
    - `fully-governed` -> action: `SKIP`, no new filename
    - `half-governed` -> action: `INJECT_ONLY`, no rename, build frontmatter fields
    - `ungoverned` -> action: `RENAME`, generate new filename via `generateNewFilename()`
    - `invalid-governed` -> action: `CONFLICT`, no new filename
    - `ambiguous` -> action: `AMBIGUOUS`, no new filename, include candidates
  - [ ] Return `RenameManifestEntry` (extend typedef in types.js -- see Dev Notes)
  - [ ] Add to `scripts/lib/artifact-utils.js`, export

- [ ] Task 4: Implement `detectCollisions(entries)` (AC: #5)
  - [ ] Input: array of manifest entries with `newPath` fields
  - [ ] Group entries by `newPath` (only entries with action `RENAME`)
  - [ ] Any `newPath` with > 1 entry is a collision
  - [ ] Also check if any `newPath` matches an existing filename in the entries (SKIP/INJECT entries)
  - [ ] Return `Map<string, string[]>` of colliding newPath -> list of oldPaths
  - [ ] Add to `scripts/lib/artifact-utils.js`, export

- [ ] Task 5: Implement `generateManifest(projectRoot, options)` -- main orchestrator (AC: #1-#10)
  - [ ] `options` = `{ includeDirs, verbose, excludeDirs }`
  - [ ] Default `includeDirs`: `['planning-artifacts', 'vortex-artifacts', 'gyre-artifacts']`
  - [ ] Default `excludeDirs`: `['_archive']`
  - [ ] Steps:
    1. `readTaxonomy(projectRoot)`
    2. `scanArtifactDirs(projectRoot, includeDirs, excludeDirs)`
    3. For each file: `buildManifestEntry(fileInfo, taxonomy, projectRoot)`
    4. `detectCollisions(entries)` -- annotate colliding entries
    5. If `verbose`: for each ambiguous entry, call `getCrossReferences()`
    6. For each ambiguous entry: call `getContextClues()`
  - [ ] Return `{ entries: ManifestEntry[], collisions: Map, summary: { total, skip, rename, inject, conflict, ambiguous } }`
  - [ ] This function IS async (file I/O + git ops)
  - [ ] Add to `scripts/lib/artifact-utils.js`, export

- [ ] Task 6: Implement `formatManifest(manifest, options)` -- text formatter (AC: #1-#8)
  - [ ] Input: manifest object from `generateManifest()`
  - [ ] Output: formatted string matching architecture spec:
    ```
    old-filename.md -> new-filename.md
      Initiative: helm (confidence: high, source: filename suffix)
      Type: prd (confidence: high, source: prefix match)
    ```
  - [ ] Ambiguous entries format:
    ```
    [!] prd.md -> ??? (ambiguous -- cannot infer initiative)
      First line: "# Product Requirements Document - Convoke"
      Git author: Amalik (2026-02-22)
      Referenced by: epic-phase3.md, architecture.md  [--verbose only]
      Candidates: convoke, gyre
      ACTION REQUIRED: Specify initiative for this file
    ```
  - [ ] Conflict entries: `[!] helm-prd.md -> CONFLICT (filename says helm, frontmatter says gyre)`
  - [ ] SKIP entries: `[SKIP] gyre-prd.md -- already governed`
  - [ ] INJECT entries: `[INJECT] gyre-prd.md -- frontmatter needed`
  - [ ] Collision entries: append `[!] COLLISION: same target as other-file.md`
  - [ ] Summary footer: counts per action type
  - [ ] Add to `scripts/lib/artifact-utils.js`, export

- [ ] Task 7: Update types.js with extended manifest types (AC: #1-#8)
  - [ ] Extend `RenameManifestEntry` or create `ManifestEntry` typedef with:
    - `action: 'RENAME'|'SKIP'|'INJECT_ONLY'|'CONFLICT'|'AMBIGUOUS'`
    - `contextClues: { firstLines: string[], gitAuthor: string, gitDate: string } | null`
    - `crossReferences: string[] | null`
    - `candidates: string[]`
    - `collisionWith: string[] | null`
  - [ ] Add `ManifestResult` typedef: `{ entries, collisions, summary }`

- [ ] Task 8: Write manifest generation tests (AC: #1-#10)
  - [ ] Create `tests/lib/manifest.test.js`
  - [ ] Test `getContextClues()`:
    - Returns first 3 lines for a file with > 3 lines
    - Returns all lines for a file with < 3 lines
    - Returns git author info (use a fixture file that's tracked in git)
    - Handles non-existent file gracefully
  - [ ] Test `getCrossReferences()`:
    - Finds markdown link references `[text](target.md)`
    - Finds relative path references `[text](../dir/target.md)`
    - Returns empty array for unreferenced files
  - [ ] Test `buildManifestEntry()`:
    - Ungoverned file -> action RENAME with new filename
    - Fully-governed file -> action SKIP
    - Half-governed file -> action INJECT_ONLY
    - Invalid-governed file -> action CONFLICT
    - Ambiguous file -> action AMBIGUOUS with candidates
  - [ ] Test `detectCollisions()`:
    - No collisions -> empty map
    - Two files with same target -> collision detected
    - Target matches existing SKIP file -> collision detected
  - [ ] Test `generateManifest()`:
    - Processes real `_bmad-output/` directories
    - Returns correct summary counts
    - Entries match expected governance states for known files
    - Performance: under 10s for all current artifacts
  - [ ] Test `formatManifest()`:
    - RENAME entries show arrow format
    - SKIP entries show `[SKIP]` prefix
    - INJECT entries show `[INJECT]` prefix
    - CONFLICT entries show `[!]` prefix
    - Ambiguous entries show context clues
    - Summary footer includes all counts
  - [ ] All tests use real taxonomy via `readTaxonomy(findProjectRoot())`
  - [ ] Run full `tests/lib/` suite: 103 existing + new must all pass

- [ ] Task 9: Export new functions and run regression checks
  - [ ] Export: `getContextClues`, `getCrossReferences`, `buildManifestEntry`, `detectCollisions`, `generateManifest`, `formatManifest`
  - [ ] Run `npx jest tests/lib/` -- all tests pass
  - [ ] Run `node scripts/archive.js --rename` -- regression check

## Dev Notes

### Previous Story (ag-2-1) Intelligence

- All inference functions are synchronous and take pre-loaded data (filename strings + taxonomy object). The NEW manifest functions in this story are ASYNC because they do file I/O and git operations.
- `inferArtifactType` returns `{ type, hcPrefix, remainder, date }` -- the `remainder` feeds into `inferInitiative`
- `inferInitiative` returns `{ initiative, confidence, source, candidates }` -- the `confidence` and `source` fields are what gets displayed in the manifest
- `getGovernanceState` returns `{ state, fileInitiative, frontmatterInitiative, candidates }` -- this is the primary classifier for manifest entries
- `generateNewFilename` returns a string -- only call this for ungoverned files where initiative was resolved (confidence: high)
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

| Governance State | Manifest Action | New Filename? | Context Clues? |
|-----------------|----------------|---------------|----------------|
| `fully-governed` | SKIP | No | No |
| `half-governed` | INJECT_ONLY | No (keep current name) | No |
| `ungoverned` (high confidence) | RENAME | Yes (via `generateNewFilename`) | No |
| `ungoverned` (low confidence) | AMBIGUOUS | No | Yes |
| `ambiguous` | AMBIGUOUS | No | Yes |
| `invalid-governed` | CONFLICT | No | Yes (show both values) |

Note: `getGovernanceState` returns `ambiguous` when the artifact type matches but initiative has low confidence. `ungoverned` is when no artifact type matches at all. Both surface as AMBIGUOUS in the manifest since neither can be auto-migrated.

### Type Extensions Needed

Extend `types.js` with:

```javascript
/**
 * Extended manifest entry for dry-run display.
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

### Debug Log References

### Completion Notes List

### File List
