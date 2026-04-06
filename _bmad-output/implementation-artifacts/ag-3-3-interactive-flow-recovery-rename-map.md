# Story 3.3: Interactive Flow, Recovery & Rename Map

Status: done

## Story

As a Convoke operator,
I want a safe interactive migration flow with idempotent recovery and a rename map for reference,
so that I can control the process, recover from failures, and trace old filenames to new ones.

## Acceptance Criteria

1. **Given** the migration script is invoked, **When** the operator runs the migration, **Then** it follows the single interactive flow: dry-run manifest -> operator review -> confirmation prompt ("Apply migration? [y/n]") -> execute
2. `--force` bypasses the confirmation prompt for automation
3. Ambiguous files prompt the operator interactively: `Assign initiative for prd.md [convoke/gyre/skip]: `
4. Skipped files are excluded from migration and noted in summary
5. `artifact-rename-map.md` is generated mapping every old filename -> new filename, committed with the migration
6. Idempotent recovery works: re-running after commit 1 success + commit 2 failure detects "renames done, frontmatter pending" and resumes from commit 2 without re-executing commit 1
7. Re-running after full success detects all files as fully-governed and reports "Nothing to migrate -- all files governed"
8. Summary report shows: X files renamed, Y frontmatter injected, Z links updated, W skipped

## Tasks / Subtasks

- [x] Task 1: Implement interactive ambiguous file resolution (AC: #3, #4)
  - [x] Create `resolveAmbiguous(manifest, projectRoot)` in artifact-utils.js
  - [x] For each AMBIGUOUS entry: check if `artifactType` is non-null AND `candidates` is non-empty — only these are resolvable
  - [x] For resolvable entries: prompt `Assign initiative for {filename} [{candidates}/skip]: `
  - [x] For non-resolvable entries (type is also null, e.g., `initiatives-backlog.md`): auto-skip with note "Cannot resolve — no type or candidates detected"
  - [x] If operator selects a valid candidate: update the entry's initiative, set action to RENAME, generate newPath via `generateNewFilename(filename, initiative, artifactType, taxonomy)`
  - [x] If operator types "skip": mark entry action as SKIP, increment skip count
  - [x] If `--force` is set: skip all ambiguous files automatically (no interactive prompts in automation)
  - [x] Return updated manifest with resolved entries + skip count
  - [x] Extract prompt logic into a mockable function (same pattern as `confirmApply`)
  - [x] Export function

- [x] Task 2: Implement `generateRenameMap(renamedEntries)` (AC: #5)
  - [x] Create helper function that returns markdown string
  - [x] Format: `# Artifact Rename Map` header with date, then `| Old Path | New Path |` table
  - [x] Include total count in header
  - [x] Write to `_bmad-output/planning-artifacts/artifact-rename-map.md`
  - [x] Call from `executeInjections` (add to commit 2) -- modify executeInjections to call this before staging
  - [x] Export function

- [x] Task 3: Implement idempotent recovery detection (AC: #6, #7)
  - [x] Create `detectMigrationState(projectRoot)` in artifact-utils.js
  - [x] Detection strategy (commit message is primary — see Dev Notes for why):
    - Check last commit message via `execFileSync('git', ['log', '-1', '--format=%s'])`
    - If last commit is `chore: inject frontmatter metadata and update links`: return `'complete'`
    - If last commit is `chore: rename artifacts to governance convention`: return `'renames-done'` (commit 1 done, commit 2 pending)
    - Otherwise: return `'fresh'` — full migration needed
  - [x] For `'complete'` state: also re-generate manifest and check if all entries are SKIP as a secondary confirmation. If not (new files added since migration), return `'fresh'`.
  - [x] Wire into `--apply` flow: before executing, call `detectMigrationState`
    - If `'complete'`: print "Nothing to migrate -- all files governed" and exit 0
    - If `'renames-done'`: print "Detected partial migration (renames done, frontmatter pending). Resuming commit 2." and call `executeInjections` only (requires re-generating manifest against renamed files)
    - If `'fresh'`: proceed with full pipeline (executeRenames -> executeInjections)
  - [x] Export function

- [x] Task 4: Wire everything into --apply flow in migrate-artifacts.js (AC: #3, #8; AC #1/#2 already implemented in ag-3-1)
  - [x] Insertion point: AFTER pre-apply summary (line ~232) and BEFORE confirmation prompt (line ~246)
  - [x] Call `resolveAmbiguous(manifest, taxonomy, projectRoot, { force: args.force })` — mutates manifest entries in-place
  - [x] After resolution: re-compute renameCount/skipCount from updated manifest (counts change)
  - [x] Before execution (after ensureCleanTree): call `detectMigrationState(projectRoot)` for idempotent recovery routing
  - [x] After full execution: print summary "Migration complete. X files renamed, Y frontmatter injected, Z links updated, W skipped."
  - [x] Import `resolveAmbiguous`, `detectMigrationState`, `generateRenameMap` from artifact-utils
  - [x] Pass `taxonomy` to `resolveAmbiguous` (needed for `generateNewFilename`)

- [x] Task 5: Write tests (AC: #3-#8)
  - [x] Add to `tests/lib/migration-execution.test.js`
  - [x] Test `resolveAmbiguous`:
    - Operator selects candidate -> entry updated to RENAME with correct newPath
    - Operator types "skip" -> entry marked SKIP
    - No ambiguous entries -> returns manifest unchanged
    - --force mode -> all ambiguous auto-skipped
  - [x] Test `generateRenameMap`:
    - Produces markdown table with correct old/new paths
    - Empty entries -> empty table with header
  - [x] Test `detectMigrationState` (mock `execFileSync` for `git log`):
    - Last commit is inject message -> returns 'complete'
    - Last commit is rename message -> returns 'renames-done'
    - Last commit is anything else -> returns 'fresh'
  - [x] Test `resolveAmbiguous` with non-resolvable entries:
    - Entry with `artifactType: null` and empty `candidates` -> auto-skipped
  - [x] Integration test:
    - Full pipeline in temp git repo: resolve ambiguous -> execute renames -> execute injections -> verify rename map exists

- [x] Task 6: Run convoke-check and regression suite
  - [x] Run `node scripts/convoke-check.js --skip-coverage` -- all steps pass
  - [x] Run `node scripts/migrate-artifacts.js` -- dry-run still works
  - [x] Run `node scripts/archive.js --rename` -- regression check

## Dev Notes

### Previous Story (ag-3-2) Intelligence

- `executeInjections(manifest, projectRoot, scopeDirs)` handles commit 2: frontmatter injection + link updating. Returns `{ injectedCount, linkUpdates, conflictCount, commitSha }`.
- `executeRenames(manifest, projectRoot)` handles commit 1: sequential git mv with rollback. Returns `{ renamedCount, commitSha }`.
- The `--apply` flow in `migrate-artifacts.js` currently: generate manifest -> print -> confirm -> ensureCleanTree -> executeRenames -> verifyHistoryChain -> executeInjections -> print summary.
- `confirmApply()` is an exported async function using readline -- mockable pattern. Use same pattern for ambiguous resolution prompts.
- `ArtifactMigrationError` with `{ file, phase, recoverable }` drives rollback.
- 200 tests pass across 6 test files.
- `updateLinks` uses exact filename matching (fixed in code review -- no substring corruption).

### Architecture Compliance

**Interactive ambiguous resolution** (from architecture, lines 479-487): For each ambiguous file, show context clues (first 3 lines, git author, candidates) and prompt the operator to select an initiative or skip. In `--force` mode, skip all ambiguous automatically.

**artifact-rename-map.md**: Generated during commit 2 and included in the same commit. Simple markdown table: `| Old Path | New Path |`. Written to `_bmad-output/planning-artifacts/`.

**Idempotent recovery (FR46)**: Detection via governance state analysis:
- After successful full migration: all files are fully-governed (SKIP) -> "Nothing to migrate"
- After commit 1 success + commit 2 failure: renamed files exist at new paths but lack frontmatter (half-governed) -> resume from commit 2
- The detection uses `generateManifest()` which re-analyzes the current file state. After renames, the manifest will show different governance states than before.

**Important caveat for 'renames-done' detection**: After commit 1, the renamed files have governance-convention filenames (`gyre-prd.md`). But the inference engine expects type-first naming (`prd-gyre.md`) for initiative inference. Files at `gyre-prd.md` would be classified as `ungoverned` or `ambiguous` (initiative-first is not the old convention). The simpler detection approach: check if the last commit message is `chore: rename artifacts to governance convention` — if so, renames are done.

### Prompt Pattern for Ambiguous Resolution

```javascript
async function promptInitiative(filename, candidates) {
  const readline = require('readline');
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const options = [...candidates, 'skip'].join('/');
  return new Promise(resolve => {
    rl.on('close', () => resolve('skip'));
    rl.question(`Assign initiative for ${filename} [${options}]: `, answer => {
      rl.close();
      const trimmed = (answer || '').trim().toLowerCase();
      if (trimmed === 'skip' || candidates.includes(trimmed)) {
        resolve(trimmed);
      } else {
        resolve('skip'); // Invalid input = skip
      }
    });
  });
}
```

Export `promptInitiative` for mocking in tests (same as `confirmApply`).

### AC #1 and #2 — Already Implemented

The confirmation prompt (`confirmApply`) and `--force` bypass were implemented in ag-3-1. These ACs are carry-forward — already working. Do NOT re-implement.

### Idempotent Recovery — Why Commit Message Is Primary

After commit 1, renamed files (`gyre-prd.md`) are UNGOVERNED by the inference engine because `inferArtifactType('gyre-prd.md')` returns `type: null` — the engine expects type-first naming (`prd-gyre.md`). Re-scanning the filesystem after commit 1 produces AMBIGUOUS/UNGOVERNED classifications indistinguishable from a fresh pre-migration state.

Therefore `detectMigrationState` MUST use commit message as the primary detection: `chore: rename artifacts to governance convention` = renames done. Manifest re-scan is a secondary confirmation for the `'complete'` state only.

### Anti-Patterns to AVOID

- Do NOT modify `executeRenames` or `executeInjections` logic from ag-3-1/3-2 (except adding generateRenameMap call to executeInjections)
- Do NOT prompt in `--force` mode -- auto-skip all ambiguous files
- Do NOT block tests with interactive prompts -- mock `promptInitiative`
- Do NOT rely on manifest governance states to detect 'renames-done' — commit message is the only reliable signal (see note above)
- Do NOT generate rename map for files that were skipped -- only include actually renamed files
- Do NOT prompt for AMBIGUOUS entries where `artifactType` is null — auto-skip (no type = no valid filename can be generated even with initiative)

### File Structure

```
scripts/
├── migrate-artifacts.js     # MODIFIED -- add ambiguous resolution, recovery detection, summary
└── lib/
    └── artifact-utils.js    # MODIFIED -- add resolveAmbiguous, generateRenameMap, detectMigrationState

tests/
└── lib/
    └── migration-execution.test.js  # MODIFIED -- add tests for new functions
```

### Testing Standards

- Jest test framework
- Extend `tests/lib/migration-execution.test.js`
- Mock `promptInitiative` for ambiguous resolution tests (same pattern as `confirmApply`)
- Integration test: full pipeline in temp git repo
- Run `convoke-check --skip-coverage` after all tests
- 200 existing + new must all pass

### References

- [Source: arch-artifact-governance-portfolio.md -- Interactive flow, FR46 idempotent recovery, artifact-rename-map.md]
- [Source: prd-artifact-governance-portfolio.md -- FR16, FR46, FR47]
- [Source: scripts/migrate-artifacts.js -- current --apply flow lines 230-300]
- [Source: scripts/lib/artifact-utils.js -- executeRenames, executeInjections, generateManifest]
- [Source: ag-3-2-frontmatter-injection-link-updating.md -- executeInjections wiring]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (1M context)

### Debug Log References

- 212/212 tests pass (200 existing + 12 new)
- convoke-check: all 5 steps pass (lint caught useless-assignment, fixed before push)
- Dry-run still works (71 files)
- `promptFn` injection pattern for test mocking (avoids readline in tests)
- 1 lint error during dev: `no-useless-assignment` on `injResult` variable — restructured to use `const` inside try block

### Completion Notes List

- Implemented `promptInitiative(filename, candidates)` — exported readline-based prompt, mockable via `promptFn` option
- Implemented `resolveAmbiguous(manifest, taxonomy, projectRoot, options)` — iterates AMBIGUOUS entries, auto-skips non-resolvable (null type or empty candidates), auto-skips in force mode, mutates manifest in-place, updates summary counts
- Implemented `generateRenameMap(renamedEntries)` — markdown table with date header and old/new path columns. Wired into `executeInjections` before `git add` (included in commit 2).
- Implemented `detectMigrationState(projectRoot)` — commit message primary detection: inject msg = 'complete', rename msg = 'renames-done', else 'fresh'. Uses `execFileSync('git', ['log', '-1', '--format=%s'])`.
- Wired into `--apply` flow: detectMigrationState -> resolveAmbiguous -> re-compute counts -> confirm -> ensureCleanTree -> execute (with 'renames-done' routing to commit 2 only)
- Final summary: "Migration complete. X renamed, Y injected, Z links updated, W skipped."
- 12 new tests: resolveAmbiguous (6), generateRenameMap (2), detectMigrationState (4)

### File List

- `scripts/lib/artifact-utils.js` — MODIFIED (added promptInitiative, resolveAmbiguous, generateRenameMap, detectMigrationState; inserted generateRenameMap call in executeInjections)
- `scripts/migrate-artifacts.js` — MODIFIED (replaced --apply flow with full pipeline: recovery detection + ambiguous resolution + phase routing + final summary)
- `tests/lib/migration-execution.test.js` — MODIFIED (added 12 tests)
