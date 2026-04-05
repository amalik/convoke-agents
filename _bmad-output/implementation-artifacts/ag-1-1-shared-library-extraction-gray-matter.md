# Story 1.1: Shared Library Extraction & gray-matter

Status: ready-for-dev

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

- [ ] Task 1: Create `scripts/lib/` directory and `types.js` (AC: #2)
  - [ ] Define `InitiativeState` JSDoc typedef with fields: initiative, phase ({value, source, confidence}), status ({value, source, confidence}), lastArtifact ({file, date}), nextAction ({value, source})
  - [ ] Define `RenameManifestEntry` typedef with fields: oldPath, newPath, initiative, artifactType, confidence, governanceState
  - [ ] Define `LinkUpdate` typedef with fields: filePath, oldLink, newLink, pattern
  - [ ] Define `TaxonomyConfig` typedef with fields: initiatives ({platform, user}), artifact_types, aliases
  - [ ] Define `FrontmatterSchema` typedef with fields: initiative, artifact_type, status, created, schema_version

- [ ] Task 2: Install gray-matter dependency (AC: #3)
  - [ ] Run `npm install gray-matter`
  - [ ] Verify it appears in `package.json` dependencies

- [ ] Task 3: Extract `parseFilename()` to `artifact-utils.js` (AC: #1, #4)
  - [ ] Copy `parseFilename()`, `isValidCategory()`, `VALID_CATEGORIES`, `NAMING_PATTERN`, `DATED_PATTERN`, `CATEGORIZED_PATTERN`, `toLowerKebab()` from archive.js
  - [ ] Extend `parseFilename(filename, taxonomy)` to accept optional taxonomy parameter (backward compatible — works without it for archive.js)
  - [ ] Export all functions via `module.exports = { ... }`
  - [ ] Update archive.js to `const { parseFilename, isValidCategory, VALID_CATEGORIES, ... } = require('./lib/artifact-utils')`
  - [ ] Verify archive.js dry-run output matches pre-refactor output

- [ ] Task 4: Create `scanArtifactDirs()` function (AC: #1)
  - [ ] Extract scanning logic from archive.js `run()` (lines 127-188) into `scanArtifactDirs(projectRoot, includeDirs, excludeDirs)`
  - [ ] Accept configurable directory list instead of hardcoded `SCAN_DIRS`
  - [ ] Default `excludeDirs` to `['_archive']`
  - [ ] Return array of `{ filename, dir, fullPath }` objects
  - [ ] Use `path.join()` for all paths (NFR13 — Windows compat)

- [ ] Task 5: Create `readTaxonomy()` function (AC: #1)
  - [ ] Load `_bmad/_config/taxonomy.yaml` using `js-yaml` (already a dependency)
  - [ ] Parse and validate structure: `initiatives.platform`, `initiatives.user`, `artifact_types`, `aliases`
  - [ ] Return `TaxonomyConfig` object
  - [ ] Throw clear error if file not found or malformed YAML (NFR22)
  - [ ] Use `findProjectRoot()` from `scripts/update/lib/utils.js` — never `process.cwd()`

- [ ] Task 6: Create frontmatter functions using gray-matter (AC: #1)
  - [ ] `parseFrontmatter(fileContent)` — wraps `matter(fileContent)`, returns `{ data, content }`
  - [ ] `injectFrontmatter(fileContent, newFields)` — adds new fields, **never overwrites** existing fields. Uses `gray-matter.stringify()`. Returns modified content with frontmatter.
  - [ ] Handle edge cases: no existing frontmatter, existing frontmatter, metadata-only files (empty content), `---` horizontal rules that aren't frontmatter
  - [ ] Field conflicts: if `newFields.initiative` differs from `parsed.data.initiative`, return a conflict indicator rather than silently overwriting

- [ ] Task 7: Create `ensureCleanTree()` function (AC: #1, #5)
  - [ ] Check tracked changes: `git diff --quiet && git diff --cached --quiet`
  - [ ] Check untracked files in scope dirs: `git ls-files --others --exclude-standard {scopeDirs}`
  - [ ] If dirty: throw error with clear message listing which files are dirty
  - [ ] Use `child_process.execSync` with `stdio: 'pipe'`

- [ ] Task 8: Wire `ensureCleanTree()` into archive.js (AC: #5)
  - [ ] Add `ensureCleanTree(SCAN_DIRS)` call at the start of archive.js `run()`, before `--apply` execution
  - [ ] Only enforce when `--apply` is passed (dry-run doesn't need clean tree)

- [ ] Task 9: Write unit tests (AC: #7)
  - [ ] Create `tests/lib/artifact-utils.test.js`
  - [ ] Test `parseFilename()` with at least these patterns:
    - `prd-gyre.md` → category: prd, hasValidCategory: true
    - `hc2-problem-definition-gyre-2026-03-21.md` → dated, category: hc2
    - `lean-persona-strategic-navigator-2026-04-04.md` → dated, category: lean (note: current archive.js won't recognize `lean` — this is expected; will be extended in Story 2.1)
    - `architecture.md` → exempt file
    - `sprint-change-proposal-2026-03-07.md` → dated, category: sprint
  - [ ] Test `injectFrontmatter()` edge cases:
    - No existing frontmatter
    - Existing frontmatter (preserve fields)
    - Metadata-only file (empty content below frontmatter)
    - Field conflict detection
  - [ ] Test `ensureCleanTree()` — mock `execSync` to simulate clean and dirty states
  - [ ] Test `scanArtifactDirs()` — mock filesystem

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

### Debug Log References

### Completion Notes List

### File List
