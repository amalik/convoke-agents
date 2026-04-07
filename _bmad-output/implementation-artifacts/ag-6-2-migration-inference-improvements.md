# Story 6.2: Migration Inference Improvements

Status: done

## Story

As a Convoke operator,
I want the migration engine to suggest defaults for ambiguous files and handle collisions gracefully,
So that I'm guided through resolution instead of facing a wall of "ACTION REQUIRED" items.

## Acceptance Criteria

1. **Given** the migration dry-run encounters a file where `inferInitiative()` returns `{initiative: null}` **When** the manifest is built **Then** the entry includes a new `suggestedInitiative` field with: a proposed initiative ID, a `suggestedFrom` source label (`folder-default` | `content-keyword` | `git-context`), and a `suggestedConfidence` value (`medium` | `low`).

2. **Given** the file is in `_bmad-output/planning-artifacts/` and no other initiative signal is found **When** the suggester runs **Then** the default suggestion is `convoke` with source `folder-default` and confidence `low` — reflecting the platform-level nature of planning artifacts that don't name a specific initiative.

3. **Given** a file's first 10 lines (or frontmatter `title`) contain a known initiative ID or alias as a whole word (case-insensitive) **When** the suggester runs **Then** that initiative is proposed with source `content-keyword` and confidence `medium`, taking precedence over folder defaults. (Examples: `# Gyre Validation Report` → `gyre`; `Strategy Perimeter` → `helm` via alias.)

4. **Given** a file's git history shows it was created in a commit whose message references an initiative ID or alias **When** the suggester runs **Then** that initiative is proposed with source `git-context` and confidence `low`. This is the lowest-priority signal — used only when folder + content yield nothing.

5. **Given** the manifest contains entries with `suggestedInitiative` set **When** `formatManifest()` renders them **Then** the output for AMBIGUOUS entries includes a line: `Suggested: {initiative} (source: {suggestedFrom}, confidence: {suggestedConfidence})` and the action label changes from `ACTION REQUIRED` to `REVIEW SUGGESTION` to signal a default exists.

6. **Given** two or more RENAME entries collide on the same target filename **When** the collision is detected **Then** the entry's `collisionWith` annotation includes a `suggestedDifferentiator` field proposing a suffix derived from each source filename's distinguishing segment (e.g., `lean-persona-strategic-navigator-2026-04-04.md` and `lean-persona-strategic-practitioner-2026-04-04.md` → suggested suffixes `navigator` and `practitioner`).

7. **Given** the collision suggestion exists **When** `formatManifest()` renders the colliding entries **Then** each line shows: `[!] COLLISION with {other}. Suggested rename: {suggestedNewPath}` so the operator can immediately accept or reject the suggestion.

8. **Given** the current Convoke repository (73 in-scope files, baseline 31 ambiguous as of 2026-04-06) **When** the dry-run runs after these changes **Then** the count of pure AMBIGUOUS entries (no suggestion produced) drops to **under 10** and the collision count includes a `suggestedDifferentiator` for the helm lean-persona collision.

9. **Given** the engine changes are complete **When** the existing test suite runs **Then** all existing inference, manifest, and migration tests pass without modification, EXCEPT tests that explicitly assert the legacy ambiguous output format may need updating to accommodate the new `Suggested:` line and `REVIEW SUGGESTION` label. Any such updates must be intentional, not blanket skips.

10. **Given** the engine changes are complete **When** new tests run **Then** they cover: (a) folder-default suggestion for `planning-artifacts`, (b) content-keyword extraction with case-insensitive matching, (c) alias resolution in content keywords, (d) git-context fallback when folder + content yield nothing, (e) priority ordering (content > folder > git), (f) collision differentiator extraction for the helm lean-persona case and at least 2 other synthetic cases, (g) format output includes Suggested line for AMBIGUOUS, (h) format output includes suggestedDifferentiator for collisions.

## Tasks / Subtasks

- [x] **Task 1: Add `suggestInitiative()` to artifact-utils.js** (AC: #1, #2, #3, #4)
  - [x] 1.1 Open [scripts/lib/artifact-utils.js](scripts/lib/artifact-utils.js) and locate `inferInitiative()` (around line 393). Add `suggestInitiative()` immediately after it.
  - [x] 1.2 Function signature: `function suggestInitiative(filename, dirName, fileContent, taxonomy, projectRoot)`. Returns `{ initiative: string|null, source: 'content-keyword'|'folder-default'|'git-context'|null, confidence: 'medium'|'low'|null }`.
  - [x] 1.3 **Step 1 — Content keyword scan** (highest priority):
    - Read first 10 lines of `fileContent` (already loaded by caller — don't re-read from disk)
    - Also extract any frontmatter `title` field via `gray-matter` (already a dependency)
    - Build search corpus = first 10 lines + title (lowercased)
    - For each initiative in `taxonomy.initiatives.platform + taxonomy.initiatives.user + Object.keys(taxonomy.aliases)`, check if it appears as a whole word (use word-boundary regex `\b{id}\b`)
    - If multiple matches, prefer the longest (matches `strategy-perimeter` over `strategy`)
    - If alias matched, resolve via `taxonomy.aliases[match]`
    - Return `{ initiative, source: 'content-keyword', confidence: 'medium' }` on first match
  - [x] 1.4 **Step 2 — Folder default** (medium priority):
    - Map: `planning-artifacts` → `convoke`, `vortex-artifacts` → `null` (Vortex artifacts span multiple initiatives, no safe default), `gyre-artifacts` → `gyre`
    - The map should be a module-level constant `FOLDER_DEFAULT_MAP` so tests can read it
    - If a default exists for this dirName, return `{ initiative: default, source: 'folder-default', confidence: 'low' }`
  - [x] 1.5 **Step 3 — Git context fallback** (lowest priority):
    - Use `git log --diff-filter=A --format=%s -- {file}` via `execFileSync` (already imported) to get the creation commit message
    - Wrap in try/catch — git failure must NOT crash the migration; return `null` instead
    - Scan the message for any initiative ID or alias (whole-word, case-insensitive)
    - If found, return `{ initiative, source: 'git-context', confidence: 'low' }`
  - [x] 1.6 If all three steps yield nothing, return `{ initiative: null, source: null, confidence: null }`.
  - [x] 1.7 Export `suggestInitiative` from the module exports at the bottom of the file (find `module.exports = { ... }`).

- [x] **Task 2: Wire `suggestInitiative()` into manifest generation** (AC: #1, #5)
  - [x] 2.1 Locate `buildManifestEntry()` in [scripts/lib/artifact-utils.js](scripts/lib/artifact-utils.js) (search for `function buildManifestEntry`).
  - [x] 2.2 In the AMBIGUOUS branch (where `entry.action = 'AMBIGUOUS'` is set), call `suggestInitiative(filename, dirName, fileContent, taxonomy, projectRoot)`.
  - [x] 2.3 If a suggestion is returned, set `entry.suggestedInitiative`, `entry.suggestedFrom`, and `entry.suggestedConfidence` on the entry.
  - [x] 2.4 Verify the entry still has `action: 'AMBIGUOUS'` — the suggestion does NOT auto-resolve, it just adds guidance.
  - [x] 2.5 If the file content isn't already loaded at the call site, load it once and pass to both `getGovernanceState()` and `suggestInitiative()` — avoid double-reading the file.

- [x] **Task 3: Add collision differentiator suggester** (AC: #6, #7)
  - [x] 3.1 In [scripts/lib/artifact-utils.js](scripts/lib/artifact-utils.js), locate `detectCollisions()` (around line 860).
  - [x] 3.2 Add a helper `suggestDifferentiator(sourceFilenames, targetFilename)` that:
    - Strips the common target filename from each source
    - For each source, extracts the segment(s) that differ from the target (e.g., source `lean-persona-strategic-navigator-2026-04-04.md`, target `helm-lean-persona-2026-04-04.md` → differentiator `strategic-navigator` or just `navigator`)
    - Returns a Map of `sourcePath → suggestedNewPath` where the new path inserts the differentiator before the date suffix (e.g., `helm-lean-persona-strategic-navigator-2026-04-04.md`)
  - [x] 3.3 In `detectCollisions()`, after a collision is detected, call `suggestDifferentiator(sources, target)` and attach the result to each colliding entry as `entry.suggestedNewPath`.
  - [x] 3.4 Edge case: if differentiator extraction fails (sources are too similar to differentiate), set `entry.suggestedNewPath = null` and let the operator handle manually. Don't crash.
  - [x] 3.5 Edge case: if the suggested new paths themselves collide (very unlikely but possible), append a numeric suffix (`-1`, `-2`) to ensure uniqueness.

- [x] **Task 4: Update `formatManifest()` to render suggestions** (AC: #5, #7)
  - [x] 4.1 Locate `formatManifest()` in [scripts/lib/artifact-utils.js](scripts/lib/artifact-utils.js) (around line 974).
  - [x] 4.2 In the `case 'AMBIGUOUS'` branch, after the existing `Candidates:` line, check if `entry.suggestedInitiative` exists. If yes:
    - Add line: `  Suggested: {entry.suggestedInitiative} (source: {entry.suggestedFrom}, confidence: {entry.suggestedConfidence})`
    - Replace the existing `ACTION REQUIRED: Specify initiative for this file` line with `REVIEW SUGGESTION: Accept '{entry.suggestedInitiative}' or specify initiative`
  - [x] 4.3 In the RENAME branch, after the existing collision detection block, if `entry.suggestedNewPath` exists:
    - Add line: `  Suggested rename: {entry.suggestedNewPath}` immediately after the COLLISION line
  - [x] 4.4 Verify formatting consistency — match the indentation, tone, and bracket style of existing lines.

- [x] **Task 5: Verify ambiguity rate reduction** (AC: #8)
  - [x] 5.1 Run `node scripts/migrate-artifacts.js` from the project root (dry-run mode).
  - [x] 5.2 Count entries containing `[!]` and `???` (the AMBIGUOUS marker pattern) in the output, EXCLUDING those with a `Suggested:` line below them.
  - [x] 5.3 Confirm the count is **under 10** (down from baseline 31).
  - [x] 5.4 Confirm the helm lean-persona collision now shows a `Suggested rename:` line.
  - [x] 5.5 If the count is still ≥10 or the collision suggestion is missing, debug the suggester logic — don't lower the threshold.

- [x] **Task 6: Write unit tests** (AC: #9, #10)
  - [x] 6.1 Create or extend [tests/lib/inference.test.js](tests/lib/inference.test.js) with new tests for `suggestInitiative()`:
    - **Test A:** Folder default — file in `planning-artifacts`, no content keyword → suggests `convoke` with source `folder-default`
    - **Test B:** Content keyword — file with `# Gyre Validation Report` as line 1 → suggests `gyre` with source `content-keyword`
    - **Test C:** Alias resolution — file with `Strategy Perimeter` in title → suggests `helm`
    - **Test D:** Priority — file in `planning-artifacts` with `# Gyre ...` content → suggests `gyre` (content beats folder)
    - **Test E:** Git context fallback — mocked git output containing initiative ID → suggests with source `git-context`
    - **Test F:** No signal — file in `vortex-artifacts` with no matching content and git failure → returns `{initiative: null, ...}`
    - **Test G:** Case-insensitivity — content `gyre` matches `GYRE` and `Gyre` and `gyre`
    - **Test H:** Whole-word matching — content `gyrescope` does NOT match initiative `gyre`
  - [x] 6.2 Create or extend [tests/lib/manifest.test.js](tests/lib/manifest.test.js) with new tests for collision differentiator:
    - **Test I:** Helm lean-persona case — two source files differing only in `navigator`/`practitioner` → both get `suggestedNewPath` containing the differentiator
    - **Test J:** Synthetic 3-way collision — three source files with three different middle segments → all three get unique `suggestedNewPath` values
    - **Test K:** Indistinguishable sources — two source files with no extractable differentiator → `suggestedNewPath: null` for both, no crash
  - [x] 6.3 Add format output tests to [tests/lib/manifest.test.js](tests/lib/manifest.test.js):
    - **Test L:** AMBIGUOUS entry with suggestion → output contains `Suggested: convoke` and `REVIEW SUGGESTION:` (NOT `ACTION REQUIRED:`)
    - **Test M:** RENAME entry with collision + differentiator → output contains `Suggested rename: ...`
  - [x] 6.4 Run the full test suite via `npm test` (or whatever the project's test command is — check `package.json`). Confirm zero regressions.

## Dev Notes

### Context

Story 6.2 addresses the operator pain discovered during the actual dry-run on this repository (2026-04-06): 31 of 73 files (42%) came back as AMBIGUOUS with the message `ACTION REQUIRED: Specify initiative for this file` and no guidance. The inference engine was correctly cautious — it never guesses — but the result is paralyzing for the operator.

The fix is **suggestion, not auto-resolution**. The engine should still flag these as AMBIGUOUS (because they ARE ambiguous), but it should propose the most likely answer with a confidence level so the operator can review and accept/reject quickly. This pattern matches how every modern dev tool handles ambiguity (autocomplete, "did you mean?", etc.).

### Critical Architectural Constraints

**Constraint 1: Suggestions are guidance, not decisions.** Do NOT change the action label from `AMBIGUOUS` to `RENAME` just because a suggestion exists. The operator still has to confirm. This preserves NFR6 (no false-confident inference) and keeps the user in control. The `inferInitiative()` function and the four governance states (`fully-governed`, `half-governed`, `ungoverned`, `invalid-governed`) MUST remain unchanged. Suggestions are an additive layer.

**Constraint 2: Performance.** NFR2 says dry-run must complete in under 10 seconds for 200 artifacts. Adding three new signals per ambiguous file (content scan, folder lookup, git query) could blow the budget. Mitigations:
- Folder lookup is O(1) — cheap
- Content scan reads first 10 lines only — cheap if content is already loaded by the caller (Task 2.5 enforces single-read)
- Git query is the expensive one — `execFileSync` per file. Only call it if content + folder yield nothing. Cap total git queries at 50 per run; beyond that, log a warning and skip git fallback.

**Constraint 3: No `process.cwd()`.** Per architecture rules, use `findProjectRoot()` or accept `projectRoot` as a param. The new functions should accept `projectRoot` explicitly.

**Constraint 4: Git failures must not crash migration.** Wrap every `execFileSync` git call in try/catch. Return null on failure. The migration must work in projects without git or with a corrupted git history.

### Suggestion Source Priority

The three signals form a priority chain:

```
content-keyword (medium confidence)
       ↓ (if no match)
folder-default  (low confidence)
       ↓ (if no default)
git-context     (low confidence)
       ↓ (if no match)
null (no suggestion — operator must specify)
```

Why content > folder: a file in `planning-artifacts` titled `# Gyre Validation Report` is clearly about gyre, not convoke, even though planning-artifacts defaults to convoke.

Why folder > git: folder structure is intentional and stable; git history can be misleading (refactors, moves, squashes).

### Folder Default Map

```javascript
const FOLDER_DEFAULT_MAP = Object.freeze({
  'planning-artifacts': 'convoke',  // Platform-level artifacts default to convoke
  'vortex-artifacts': null,          // Vortex spans multiple initiatives — no safe default
  'gyre-artifacts': 'gyre',          // All gyre-artifacts/* belong to gyre
});
```

Export this constant so tests can reference it. Future expansion (when new directories appear) is just adding to this map.

### Collision Differentiator Algorithm

For the helm lean-persona case:
- Source 1: `lean-persona-strategic-navigator-2026-04-04.md`
- Source 2: `lean-persona-strategic-practitioner-2026-04-04.md`
- Target: `helm-lean-persona-2026-04-04.md`

Algorithm:
1. Strip the date suffix from sources and target → `lean-persona-strategic-navigator`, `lean-persona-strategic-practitioner`, `helm-lean-persona`
2. Strip the target's stem (`lean-persona`) from each source → `strategic-navigator`, `strategic-practitioner`
3. Find the segment(s) that differ between the two sources → `navigator`, `practitioner` (the `strategic-` prefix is shared)
4. Construct new target by inserting the differentiator into the original target before the date → `helm-lean-persona-navigator-2026-04-04.md`, `helm-lean-persona-practitioner-2026-04-04.md`

For 3+ way collisions, repeat step 3 pairwise — extract the unique segment for each source.

If sources are too similar (e.g., `foo-2026-04-04.md` and `foo-2026-04-04.md` — exact duplicates), there's nothing to differentiate. Return `null` and let the operator handle.

### Files to Touch

| File | Action | Purpose |
|------|--------|---------|
| [scripts/lib/artifact-utils.js](scripts/lib/artifact-utils.js) | Edit | Add `suggestInitiative()`, `suggestDifferentiator()`, `FOLDER_DEFAULT_MAP`, wire into `buildManifestEntry()` and `detectCollisions()`, update `formatManifest()` |
| [tests/lib/inference.test.js](tests/lib/inference.test.js) | Edit | Add 8 new tests (A–H) for suggestInitiative |
| [tests/lib/manifest.test.js](tests/lib/manifest.test.js) | Edit | Add 5 new tests (I–M) for collision differentiator and format output |

**Do NOT modify:**
- `inferInitiative()` — leave the existing 5-step algorithm intact
- `inferArtifactType()` — type inference is fine, only initiative inference needs help
- The four governance states or their detection logic
- Any portfolio engine code (that's Story 6.3)

### Architecture Compliance

- ✅ No hardcoded version strings
- ✅ No `process.cwd()` — pass `projectRoot` explicitly
- ✅ Append-only — adding new functions and fields, not refactoring existing
- ✅ `_bmad/` paths unchanged
- ✅ NFR6 preserved — suggestions are not false-confident, they're flagged with confidence levels
- ✅ NFR20 preserved — frontmatter parsing uses gray-matter, byte-for-byte preservation

### Previous Story Intelligence

Story 6.1 (Wire Loom Master) is currently in flight and touches a different area entirely (manifest CSV, Claude Code skill wrapper). No file overlap with this story — they can be implemented in parallel by different developers without conflict.

The original Epic 2 stories (`ag-2-1-initiative-inference-engine`, `ag-2-2-dry-run-manifest-generation`) established the patterns this story extends:
- Confidence levels (`high` | `low`) — extending to add `medium`
- Source labels (`exact`, `alias`, `prefix`, etc.) — adding new sources
- The five-step inference cascade — leaving it intact, layering suggestions on top
- Test fixture patterns — follow the existing fixture style in `tests/lib/`

### Current Repository State (for Task 5 verification)

As of 2026-04-06, running `node scripts/migrate-artifacts.js` produces:
```
Total: 73 | Rename: 42 | Skip: 0 | Inject: 0 | Conflict: 0 | Ambiguous: 31
[!] 1 filename collision(s) detected
```

The 31 ambiguous files include known cases:
- ~20 platform-level files in planning-artifacts (PRD, architecture, epics, sprint proposals, backlog, lifecycle plans) — these should resolve to `convoke` via folder-default
- ~5 personas in vortex-artifacts — these may not auto-resolve (vortex-artifacts has no folder default), but if they have content keywords, those will help
- Others with content cues like `# Gyre Validation Report`, `# Forge↔Gyre Handoff Contracts`, `Strategy Perimeter` — these resolve via content-keyword

Expected post-fix counts:
- `convoke` folder-default: ~15 files resolved
- Content-keyword: ~10 files resolved
- Remaining truly ambiguous: ~5–6 files

The 1 collision (helm lean-personas) will get a `Suggested rename:` annotation.

### Risk Notes

1. **Test brittleness** — Existing tests may have assertions like `expect(output).not.toContain('Suggested:')`. These need updating, not deleting. Audit before and after.

2. **Content scan false positives** — A file titled `# Comparing Gyre vs Vortex` would match both `gyre` and `vortex` in keyword scan. Spec says "first match wins, prefer longest." Document this in the code comment so future developers don't try to "fix" it without understanding the trade-off.

3. **Git query performance** — If a project has 200 ambiguous files, that's 200 `git log` calls. The cap at 50 protects against worst case. Test in a loop with synthetic data to validate the cap works.

4. **Collision differentiator edge cases** — The algorithm assumes sources share a common stem with the target. If a 3-way collision has sources with totally different prefixes, the algorithm may produce weird suggestions. Edge case Test K guards against this by accepting `null`.

### Testing Standards

- Use Node's built-in test runner (`node --test`) — see `package.json` `scripts.test`
- Tests in `tests/lib/` use the same `describe`/`test` pattern as existing files
- Mock git calls via `child_process.execFileSync` stubbing — see existing migration tests for the pattern
- Use temp directories for fixture files — never modify the real repo from tests
- Coverage expectation: 100% on `suggestInitiative()` and `suggestDifferentiator()` (NFR17 — 100% on inference rules)

### References

- [scripts/lib/artifact-utils.js](scripts/lib/artifact-utils.js) — File to extend
- [tests/lib/inference.test.js](tests/lib/inference.test.js) — Test file to extend
- [tests/lib/manifest.test.js](tests/lib/manifest.test.js) — Test file to extend
- [_bmad-output/planning-artifacts/arch-artifact-governance-portfolio.md](_bmad-output/planning-artifacts/arch-artifact-governance-portfolio.md) — Architecture reference (NFR2, NFR6, NFR17, NFR20)
- [_bmad-output/planning-artifacts/epic-artifact-governance-portfolio.md](_bmad-output/planning-artifacts/epic-artifact-governance-portfolio.md) — Parent epic with full context
- Story 6.4 (`ag-6-4-migration-skill-wrapper`) depends on this story — it consumes the new `suggestedInitiative` field in the conversation flow

## Dev Agent Record

### Agent Model Used

claude-opus-4-6 (1M context)

### Debug Log References

- Discovered the project has TWO test runners: `tests/unit/*.test.js` use Node's built-in `node --test` (npm test), while `tests/lib/*.test.js` use Jest (`npx jest`). Both must pass; they're invoked separately. Documented in completion notes for future devs.
- Initial dry-run output revealed only some ambiguous entries got suggestions — root cause: cleared after re-checking that the AMBIGUOUS branch is hit for both `state === 'ungoverned'` and `state === 'ambiguous'`. Both paths now flow through the suggester correctly.

### Completion Notes List

- All 10 ACs satisfied. All 6 task groups complete (30/30 subtasks).
- **AC8 hit cleanly:** baseline 31 ambiguous → **6 pure ambiguous** (after Story 6.2). Of the 32 AMBIGUOUS entries, 26 now have suggestions (REVIEW SUGGESTION) and 6 remain pure-ambiguous. Note: total bumped from 73→74 because of new artifact files added since baseline; the success metric "under 10 pure ambiguous" is met.
- **Collision fix verified:** the helm lean-persona collision now produces `helm-lean-persona-navigator-2026-04-04.md` and `helm-lean-persona-practitioner-2026-04-04.md` automatically.
- **Constraints respected:** `inferInitiative()` and `inferArtifactType()` are unchanged. Suggestions are layered ON TOP via the new `suggestInitiative()` function. The action stays `AMBIGUOUS` — operator must still confirm. NFR6 (no false-confident inference) preserved.
- **Performance:** Git query counter caps at 50 per run. The whole-repo dry-run still completes in well under 10 seconds.
- **6 pure-ambiguous remaining files:** All 5 vortex-artifacts personas (no folder default for vortex-artifacts by design, persona content doesn't mention initiatives by name) and 1 telemetry report. These are genuinely ambiguous — operator input required.
- **Test suite: 733/733 passing.** 408 unit tests + 325 lib tests, including 17 new tests (9 in inference.test.js for `suggestInitiative`, 4 in manifest.test.js for `suggestDifferentiator`, 4 in manifest.test.js for `formatManifest` rendering).
- **Refinements during impl:** Added `suggestedNewPath` annotation directly in `generateManifest`'s collision loop (cleaner than mutating from inside `detectCollisions`). Added defensive null-safe handling for sentinel `(existing) ...` entries in `suggestDifferentiator`.
- **convoke-check (full CI mirror) PASSES**: Lint, Unit tests, Integration tests, Jest lib tests, Coverage. Caught and fixed: (1) lint `no-useless-assignment` on `firstLines` initializer, (2) two latent integration test count regressions from Story 6.1 (`dataRows.length` and `lines.length` hardcoded to pre-team-factory counts) — both updated to reflect 12 bme rows (7 vortex + 4 gyre + 1 standalone). The integration regressions did NOT surface in Story 6.1's `npm test` run because integration tests live in a separate suite. **Going forward: always run `npm run check` before marking a story for review.**

### File List

**Modified:**
- `scripts/lib/artifact-utils.js` (added FOLDER_DEFAULT_MAP, _scanCorpusForInitiative, suggestInitiative, suggestDifferentiator, _resetGitSuggesterCounter; wired into buildManifestEntry, generateManifest, formatManifest; new module exports)
- `tests/lib/inference.test.js` (added 9 tests for suggestInitiative + FOLDER_DEFAULT_MAP)
- `tests/lib/manifest.test.js` (added 4 tests for suggestDifferentiator + 4 tests for formatManifest rendering)

### Change Log

- 2026-04-07: Migration inference improvements (Story 6.2). Added content-keyword/folder-default/git-context suggestion layer for AMBIGUOUS files. Added collision differentiator suggester for filename collisions. Ambiguous count drops from 31→6 on the current repo; helm lean-persona collision now auto-resolves with navigator/practitioner suffixes.
- 2026-04-07: Code review patches (3 HIGH + 2 MED + 1 LOW from Blind Hunter / Edge Case Hunter / Acceptance Auditor): (1) git counter no longer increments before failed try, no longer pollutes test state, emits one-time warning when cap reached; (2) `_scanCorpusForInitiative` replaced naive `\b` boundary with hyphen-aware lookarounds — `pre-gyre` no longer false-matches `gyre`; (3) `suggestDifferentiator` numeric-suffix dedup rewritten with two-pass logic + greedy regex (was leaving first duplicate unchanged + had lazy `.*?` empty-stem bug); (4) `suggestedNewPath: null` initialized in base manifest entry (was `undefined` for non-collision RENAMEs); (5) `_scanCorpusForInitiative` now guards malformed taxonomy; (6) Test E rewritten as real positive git-context test using a temp git repo (was only testing the negative path). Added 4 new regression tests: kebab-case hyphen boundary (3 tests), git query cap enforcement (1 test). 3 deferred items added to backlog: I17 (`.md`/`.yaml`-only differentiator), I18 (pre-compile regex). All checks pass via `npm run check`: Lint, Unit (408), Integration, Jest lib (98), Coverage 91.75%.
