# Story 1.1: Shared Library Extraction & gray-matter

Status: done

## Story

As a platform developer,
I want shared artifact utilities extracted from archive.js into a reusable library,
so that migration, portfolio, and archive tools share consistent filename parsing and frontmatter handling.

## Acceptance Criteria

1. `scripts/lib/artifact-utils.js` exports: `parseFilename()`, `scanArtifactDirs()`, `readTaxonomy()`, `parseFrontmatter()`, `injectFrontmatter()`, `ensureCleanTree()`
2. `scripts/lib/types.js` exports JSDoc typedefs: `InitiativeState`, `RenameManifestEntry`, `LinkUpdate`, `TaxonomyConfig`, `FrontmatterSchema`
3. `gray-matter` added to `package.json` dependencies
4. `archive.js` refactored to import from `artifact-utils.js` — produces identical dry-run output before and after refactor
5. `archive.js` gains `ensureCleanTree()` check for tracked diffs + untracked files in scope directories
6. All existing archive.js functionality unchanged (regression test: run `node scripts/archive.js --rename` dry-run before and after, output must match)
7. New unit tests cover `parseFilename()` with at least 5 representative filename patterns from the current repository

## Tasks / Subtasks

- [x] Task 1: Create `scripts/lib/` directory and `types.js` (AC: #2)
  - [x] Define `InitiativeState` JSDoc typedef with fields: initiative, phase ({value, source, confidence}), status ({value, source, confidence}), lastArtifact ({file, date}), nextAction ({value, source})
  - [x] Define `RenameManifestEntry` typedef with fields: oldPath, newPath, initiative, artifactType, confidence, governanceState
  - [x] Define `LinkUpdate` typedef with fields: filePath, oldLink, newLink, pattern
  - [x] Define `TaxonomyConfig` typedef with fields: initiatives ({platform, user}), artifact_types, aliases
  - [x] Define `FrontmatterSchema` typedef with fields: initiative, artifact_type, status, created, schema_version

- [x] Task 2: Install gray-matter dependency (AC: #3)
  - [x] Run `npm install gray-matter`
  - [x] Verify it appears in `package.json` dependencies

- [x] Task 3: Extract `parseFilename()` to `artifact-utils.js` (AC: #1, #4)
  - [x] Copy `parseFilename()`, `isValidCategory()`, `VALID_CATEGORIES`, `NAMING_PATTERN`, `DATED_PATTERN`, `CATEGORIZED_PATTERN`, `toLowerKebab()` from archive.js
  - [x] Extend `parseFilename(filename, taxonomy)` to accept optional taxonomy parameter (backward compatible — works without it for archive.js)
  - [x] Export all functions via `module.exports = { ... }`
  - [x] Update archive.js to `const { parseFilename, NAMING_PATTERN, toLowerKebab, ensureCleanTree } = require('./lib/artifact-utils')`
  - [x] Verify archive.js dry-run output matches pre-refactor output

- [x] Task 4: Create `scanArtifactDirs()` function (AC: #1)
  - [x] Extract scanning logic into `scanArtifactDirs(projectRoot, includeDirs, excludeDirs)`
  - [x] Accept configurable directory list instead of hardcoded `SCAN_DIRS`
  - [x] Default `excludeDirs` to `['_archive']`
  - [x] Return array of `{ filename, dir, fullPath }` objects
  - [x] Use `path.join()` for all paths (NFR13 — Windows compat)

- [x] Task 5: Create `readTaxonomy()` function (AC: #1)
  - [x] Load `_bmad/_config/taxonomy.yaml` using `js-yaml` (already a dependency)
  - [x] Parse and validate structure: `initiatives.platform`, `initiatives.user`, `artifact_types`, `aliases`
  - [x] Return `TaxonomyConfig` object
  - [x] Throw clear error if file not found or malformed YAML (NFR22)
  - [x] Use `findProjectRoot()` from `scripts/update/lib/utils.js` — never `process.cwd()`

- [x] Task 6: Create frontmatter functions using gray-matter (AC: #1)
  - [x] `parseFrontmatter(fileContent)` — wraps `matter(fileContent)`, returns `{ data, content }`
  - [x] `injectFrontmatter(fileContent, newFields)` — adds new fields, **never overwrites** existing fields. Uses `gray-matter.stringify()`. Returns modified content with frontmatter.
  - [x] Handle edge cases: no existing frontmatter, existing frontmatter, metadata-only files (empty content), `---` horizontal rules that aren't frontmatter
  - [x] Field conflicts: if `newFields.initiative` differs from `parsed.data.initiative`, return a conflict indicator rather than silently overwriting

- [x] Task 7: Create `ensureCleanTree()` function (AC: #1, #5)
  - [x] Check tracked changes: `git diff --quiet && git diff --cached --quiet`
  - [x] Check untracked files in scope dirs: `git ls-files --others --exclude-standard {scopeDirs}`
  - [x] If dirty: throw error with clear message listing which files are dirty
  - [x] Use `child_process.execSync` with `stdio: 'pipe'`

- [x] Task 8: Wire `ensureCleanTree()` into archive.js (AC: #5)
  - [x] Add `ensureCleanTree(SCAN_DIRS, projectRoot)` call at the start of archive.js `run()`, before `--apply` execution
  - [x] Only enforce when `--apply` is passed (dry-run doesn't need clean tree)

- [x] Task 9: Write unit tests (AC: #7)
  - [x] Create `tests/lib/artifact-utils.test.js`
  - [x] Test `parseFilename()` with 7 representative filename patterns
  - [x] Test `injectFrontmatter()` 5 edge cases (no frontmatter, existing, metadata-only, conflict, content preservation)
  - [x] Test `ensureCleanTree()` — 4 test cases with mocked `execSync` (clean, dirty tracked, staged, untracked)
  - [x] Test `scanArtifactDirs()` — 3 test cases with real temp filesystem

## Dev Notes

### Architecture Compliance (CRITICAL)

- **ADR-1 (Shared lib extraction):** This story implements the core of ADR-1. The shared lib is the integration point between migration, portfolio, and archive.
- **CommonJS only** — use `require()`, not `import`. Follow existing codebase convention.
- **JSDoc type annotations mandated** on all function signatures and the inference contract data structures.
- **gray-matter** is the ONLY new dependency. No other packages.
- `findProjectRoot()` is in `scripts/update/lib/utils.js` — import it, don't recreate it.

### Source Code to Extract From

**`scripts/archive.js`** (305 lines) — extract these specific sections:

| Lines | Function/Const | Extract To |
|-------|---------------|-----------|
| 8-12 | `VALID_CATEGORIES` | `artifact-utils.js` |
| 14 | `NAMING_PATTERN` | `artifact-utils.js` |
| 30-33 | `isValidCategory()` | `artifact-utils.js` |
| 35-36 | `DATED_PATTERN`, `CATEGORIZED_PATTERN` | `artifact-utils.js` |
| 40-55 | `parseFilename()` | `artifact-utils.js` (extend with taxonomy param) |
| 57-59 | `toLowerKebab()` | `artifact-utils.js` |

**Leave in archive.js** (do NOT extract):
- `groupByKey()` — archive-specific grouping logic
- `appendToIndex()` — archive-specific index writing
- `run()` — archive-specific orchestration (refactor to import from shared lib)

### Existing Patterns to Follow

- **`scripts/update/lib/utils.js`** — the existing shared utility pattern. Same `module.exports = {}` style, same JSDoc annotations, same `findProjectRoot()` usage.
- **`scripts/update/lib/config-merger.js`** — example of a module that reads YAML config. Uses `js-yaml` for parsing.
- **Error pattern:** Use descriptive `Error` messages with file context. Example: `throw new Error(\`Invalid taxonomy: ${reason}. File: ${filePath}\`);`

### Dependencies Available

| Package | Version | Usage |
|---------|---------|-------|
| `fs-extra` | ^11.3.3 | File operations (already installed) |
| `js-yaml` | ^4.1.0 | YAML parsing for taxonomy (already installed) |
| `gray-matter` | **NEW — install** | Frontmatter parsing/writing |
| `chalk` | ^4.1.2 | Terminal colors (already installed, not needed for this story) |

### Anti-Patterns to AVOID

- ❌ Do NOT hardcode initiative IDs — `readTaxonomy()` reads them from config
- ❌ Do NOT parse `---` frontmatter manually — use `gray-matter`
- ❌ Do NOT use `process.cwd()` — use `findProjectRoot()`
- ❌ Do NOT use `fs.renameSync` anywhere — this story doesn't rename files
- ❌ Do NOT modify archive.js behavior — only refactor imports. Output must be identical.

### Project Structure Notes

```
scripts/
├── lib/                          # NEW directory
│   ├── artifact-utils.js         # NEW — shared functions
│   └── types.js                  # NEW — JSDoc typedefs
├── archive.js                    # MODIFIED — import from lib/
└── update/
    └── lib/
        └── utils.js              # EXISTING — consumed (findProjectRoot)

tests/
└── lib/
    └── artifact-utils.test.js    # NEW — unit tests
```

### Testing Standards

- Jest test framework (existing `tests/` directory)
- File: `tests/lib/artifact-utils.test.js`
- Minimum 5 `parseFilename()` test cases with real filenames from current repo
- Frontmatter edge case tests (4 cases minimum)
- `ensureCleanTree()` tests with mocked `execSync`
- Run full test suite after changes: `npm test` — all existing tests must pass

### Regression Verification

Before submitting: run `node scripts/archive.js --rename` dry-run and compare output to pre-refactor baseline. Output must be **identical**. This is the regression test for the refactoring — the archive script must not change behavior.

### References

- [Source: arch-artifact-governance-portfolio.md — Shared Library Architecture]
- [Source: arch-artifact-governance-portfolio.md — ADR-1: Shared lib extraction]
- [Source: arch-artifact-governance-portfolio.md — Starter Template / Technology Foundation]
- [Source: prd-artifact-governance-portfolio.md — FR1-FR6, NFR20, NFR22]
- [Source: scripts/archive.js — extraction source]
- [Source: scripts/update/lib/utils.js — existing shared utility pattern]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (1M context)

### Debug Log References

- Regression test: `node scripts/archive.js --rename` output identical before/after refactor (1 archive action, 67 warnings)
- All 28 unit tests pass. Pre-existing test failures in other suites unrelated to this story.

### Completion Notes List

- ✅ Created `scripts/lib/types.js` with 8 JSDoc typedefs (InitiativeState, RenameManifestEntry, LinkUpdate, TaxonomyConfig, FrontmatterSchema, ParsedFilename, FrontmatterConflict, InjectResult)
- ✅ Installed `gray-matter@^4.0.3` — sole new dependency
- ✅ Created `scripts/lib/artifact-utils.js` with 11 exported functions: parseFilename, isValidCategory, VALID_CATEGORIES, NAMING_PATTERN, DATED_PATTERN, CATEGORIZED_PATTERN, toLowerKebab, scanArtifactDirs, readTaxonomy, parseFrontmatter, injectFrontmatter, ensureCleanTree
- ✅ Refactored `scripts/archive.js` to import from shared lib — only imports what it actually uses (parseFilename, NAMING_PATTERN, toLowerKebab, ensureCleanTree)
- ✅ Added ensureCleanTree() check to archive.js (only on --apply, not dry-run)
- ✅ 28 unit tests: 7 parseFilename, 4 isValidCategory, 2 toLowerKebab, 3 parseFrontmatter, 5 injectFrontmatter, 4 ensureCleanTree, 3 scanArtifactDirs
- ✅ Regression verified: archive.js dry-run output identical pre/post refactor

### File List

- `scripts/lib/types.js` — NEW (JSDoc typedefs)
- `scripts/lib/artifact-utils.js` — NEW (shared utility functions)
- `scripts/archive.js` — MODIFIED (import from shared lib + ensureCleanTree)
- `tests/lib/artifact-utils.test.js` — NEW (28 unit tests)
- `package.json` — MODIFIED (gray-matter dependency added)
- `package-lock.json` — MODIFIED (gray-matter + transitive deps)
