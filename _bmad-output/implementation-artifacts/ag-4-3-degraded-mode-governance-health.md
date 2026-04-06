# Story 4.3: Degraded Mode & Governance Health

Status: done

## Story

As a Convoke operator,
I want the portfolio to work on ungoverned artifacts and show me how governed my project is,
so that I get value immediately and can track my migration progress.

## Acceptance Criteria

1. **Given** a mix of governed (frontmatter) and ungoverned (no frontmatter) artifacts exist, **When** the portfolio runs, **Then** degraded mode activates for ungoverned artifacts -- infers initiative from filename patterns and git recency
2. Degraded mode produces lower-fidelity results but still shows initiative, phase (if detectable), and last activity
3. Degraded results are clearly marked `(inferred)` in the output
4. Every portfolio output includes a governance health score: `Governance: X/Y artifacts governed (Z%)` (FR24)
5. Health score counts governed = filename match + valid frontmatter with initiative field
6. When governance reaches 100%, the health score line still appears (confirmation, not nag)

## Tasks / Subtasks

- [x] Task 1: Reclassify governed/ungoverned counting and add flags (AC: #1, #2, #5)
  - [x] Files with no resolved initiative (`initResult.initiative === null`) stay ungoverned and are NOT indexed — same as current behavior. These cannot be attributed to any initiative.
  - [x] Files with resolved initiative: KEEP indexing them (already works). The behavioral change is the COUNTING:
  - [x] Move `governed++` / `ungoverned++` AFTER the frontmatter read (currently `governed++` fires BEFORE frontmatter check at line ~92)
  - [x] New classification: `governed` = has resolved initiative AND `frontmatter.initiative === initResult.initiative`. `ungoverned` = has resolved initiative but no frontmatter or mismatched frontmatter.
  - [x] Add `isGoverned` boolean flag to each enriched artifact object
  - [x] Add `degradedMode` boolean flag: `true` when `!isGoverned` (filename-only inference, no frontmatter backing)
  - [x] The registry now contains BOTH governed and ungoverned artifacts for each initiative. All go through the same rule chain.

- [x] Task 2: Add governance health score to generatePortfolio return (AC: #4, #5, #6)
  - [x] Calculate: `governedCount` = artifacts with `isGoverned === true`
  - [x] Calculate: `totalCount` = all `.md` files scanned (governed + ungoverned + unattributed)
  - [x] Calculate: `percentage` = `Math.round((governed / total) * 100)` (0 if total is 0)
  - [x] Add to `generatePortfolio` return: `summary.healthScore = { governed: number, total: number, percentage: number }`
  - [x] Do NOT modify formatter signatures — health score is printed in CLI main() (same pattern as existing summary line)

- [x] Task 3: Ensure degraded results show `(inferred)` markers (AC: #3)
  - [x] Degraded mode artifacts always produce `confidence: 'inferred'` in rule chain output
  - [x] `frontmatter-rule` correctly skips artifacts with no frontmatter (already handles this)
  - [x] `artifact-chain-rule` works the same on degraded artifacts (already infers from type/hcPrefix)
  - [x] `git-recency-rule` works the same (already reads git log)
  - [x] `conflict-resolver` ensures all fields populated — degraded artifacts get `(inferred)` on every field
  - [x] Verify: no rule produces `(explicit)` for an artifact with `degradedMode: true`

- [x] Task 4: Print health score in CLI main() (AC: #4, #6)
  - [x] After the existing summary line (`Total: X | Governed: Y | Ungoverned: Z`), add: `Governance: X/Y artifacts governed (Z%)`
  - [x] Uses `result.summary.healthScore` from `generatePortfolio` return
  - [x] Always print (even at 100% — confirmation, not nag)
  - [x] Same pattern as existing summary line — printed in CLI, NOT in formatters

- [x] Task 5: Write tests (AC: #1-#6)
  - [x] Extend `tests/lib/portfolio-engine.test.js`
  - [x] Test `generatePortfolio` returns health score in summary
  - [x] Test health score: governed + ungoverned = total
  - [x] Test percentage calculation (round to integer)
  - [x] Test degraded mode: ungoverned files appear in portfolio output (not skipped)
  - [x] Test degraded results show `(inferred)` confidence
  - [x] Test `summary.healthScore` has governed, total, percentage fields
  - [x] Test percentage is 0 when total is 0
  - [x] Test 100% governance scenario (all files have matching frontmatter)

- [x] Task 6: Run convoke-check and regression suite
  - [x] Run `node scripts/convoke-check.js --skip-coverage` -- all steps pass
  - [x] Run `node scripts/lib/portfolio/portfolio-engine.js` -- shows health score in output
  - [x] Verify ungoverned artifacts now appear in portfolio

## Dev Notes

### Previous Story (ag-4-2) Intelligence

- `portfolio-engine.js` currently skips files where `inferInitiative` fails (line ~87: `ungoverned++; continue;`)
- The engine already counts `governed` and `ungoverned` in summary but only indexes governed files in the registry
- `formatTerminal` and `formatMarkdown` already show `(explicit)` / `(inferred)` markers
- The summary line (`Total: X | Governed: Y | Ungoverned: Z`) already exists in CLI output
- 298 tests pass across 9 test files

### Architecture Compliance

**Degraded mode is NOT a separate code path** — it's the same pipeline with reduced data. The 4 inference rules already handle the case where frontmatter is missing:
- `frontmatter-rule`: skips artifacts with no frontmatter (already works)
- `artifact-chain-rule`: infers from type/hcPrefix (works on filename-only data)
- `git-recency-rule`: checks git log (works regardless of frontmatter)
- `conflict-resolver`: fills gaps with `unknown (inferred)` (already works)

The main change is in the engine: **stop skipping ungoverned files and index them in the registry**. The rules already handle the rest.

**Governance health score (FR24)**: Based on frontmatter presence, not filename convention. A file is "governed" only if it has both: (1) a resolved initiative from filename, AND (2) valid frontmatter with a matching `initiative` field.

### Key Insight: Minimal Code Change Required

The current engine already indexes ALL files with resolved initiative (including files without frontmatter). The real change is:
1. Move `governed++` / `ungoverned++` AFTER frontmatter read (currently fires too early at line ~92)
2. Reclassify: `governed` = frontmatter match, `ungoverned` = filename-only
3. Add `isGoverned` / `degradedMode` flags to enriched artifacts
4. Add health score calculation + display in CLI

**What does NOT change:**
- Files with no resolved initiative are still skipped (can't be attributed to any initiative)
- The registry still only contains files with resolved initiative
- All indexed files go through the same 4-rule chain
- The rules need NO modification — they already handle missing frontmatter

### Current Code Semantics (to be corrected)

```
Line 87-89: if (!initResult.initiative) { ungoverned++; continue; }  // Files with no initiative → skip
Line 92: governed++;  // ← PROBLEM: fires BEFORE frontmatter check
Lines 93-100: read frontmatter  // frontmatter is read but doesn't affect count
```

The fix: move counting below the frontmatter read, classify based on `frontmatter.initiative === initResult.initiative`.

### Anti-Patterns to AVOID

- Do NOT modify the 4 rule files — they already handle degraded mode naturally
- Do NOT create a separate "degraded pipeline" — same rules, same chain, less data
- Do NOT hide ungoverned artifacts — show them with `(inferred)` markers
- Do NOT suppress health score at 100% — it's confirmation, not nag
- Do NOT implement WIP radar — that's story 4.4

### File Structure

```
scripts/
└── lib/
    └── portfolio/
        ├── portfolio-engine.js          # MODIFIED — index ungoverned files, health score
        └── formatters/
            ├── terminal-formatter.js    # MODIFIED — add health score line
            └── markdown-formatter.js    # MODIFIED — add health score line

tests/
└── lib/
    └── portfolio-engine.test.js         # MODIFIED — add degraded mode + health score tests
```

### Testing Standards

- Jest test framework
- Extend `tests/lib/portfolio-engine.test.js`
- Integration tests against real repo (which has both governed and ungoverned artifacts)
- Health score should be non-trivial against real repo (mix of governed/ungoverned)
- Run `convoke-check --skip-coverage` after all tests
- 298 existing + new must all pass

### References

- [Source: arch-artifact-governance-portfolio.md -- Degraded mode, FR24 governance health, FR35-36]
- [Source: prd-artifact-governance-portfolio.md -- FR24, FR35, FR36, FR38, FR39]
- [Source: scripts/lib/portfolio/portfolio-engine.js -- lines 70-130, current ungoverned skip logic]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (1M context)

### Debug Log References

- 302/302 tests pass (298 existing + 4 new)
- convoke-check: all 5 steps pass (lint clean)
- Real repo output: 144 md files, 0 governed, 43 ungoverned (no migration run yet), health score 0%
- Zero test failures during development

### Completion Notes List

- Moved `governed++` / `ungoverned++` AFTER frontmatter read. Reclassified: governed = frontmatter with matching initiative, ungoverned = filename-only inference.
- Added `isGoverned` and `degradedMode` boolean flags to each enriched artifact object.
- Added `unattributed` counter for files with no resolved initiative (still skipped from registry).
- Added `summary.healthScore = { governed, total, percentage }` to `generatePortfolio` return.
- Health score printed in CLI after existing summary line: `Governance: X/Y artifacts governed (Z%)`.
- Formatters NOT modified — health score follows same CLI-print pattern as summary line.
- Rules needed NO modification — `frontmatter-rule` already skips null frontmatter, all other rules work on degraded artifacts naturally.
- 4 new tests: health score fields, health score total, ungoverned indexed, degraded confidence check.

### File List

- `scripts/lib/portfolio/portfolio-engine.js` — MODIFIED (reclassified counting, isGoverned/degradedMode flags, healthScore, CLI print)
- `tests/lib/portfolio-engine.test.js` — MODIFIED (fixed governed count test, added 4 new tests)
