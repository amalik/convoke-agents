# Story 3.1: Update GitHub & CI Configuration

Status: done

## Story

As a maintainer,
I want GitHub issue templates and CI configuration to reference Convoke, and stale-brand test assertions restored to strict,
So that the platform infrastructure matches the new product identity and the test suite enforces zero stale brand references.

## Acceptance Criteria

1. **Given** `.github/ISSUE_TEMPLATE/feedback.yml`
   **When** the rename is applied
   **Then** the description field references "Convoke agent or workflow" instead of "BMAD-Enhanced agent or workflow"
   **And** zero instances of `bmad-enhanced`/`BMAD-Enhanced` remain

2. **Given** `.github/workflows/ci.yml`
   **When** scanned
   **Then** zero instances of `bmad-enhanced`/`BMAD-Enhanced` exist (confirmed — uses generic npm commands)

3. **Given** `tests/unit/docs-audit.test.js` CLI exit code test (L508-513)
   **When** strict assertions are restored
   **Then** the test asserts `result.exitCode === 0` (not `0 || 1`)
   **And** the TODO comment about Phase 3 Epics 2-3 is removed

4. **Given** `tests/unit/docs-audit.test.js` JSON output test (L519-522)
   **When** strict assertions are restored
   **Then** the test asserts `parsed.length === 0` directly
   **And** the TODO comment and `nonBrandFindings` workaround are removed

5. **Given** all changes
   **When** tests are run
   **Then** `npm test` passes with zero failures
   **And** `node scripts/docs-audit.js` returns zero findings (prerequisite for strict assertions)

## Tasks / Subtasks

- [x] Task 1: Update `.github/ISSUE_TEMPLATE/feedback.yml` (AC: #1)
  - [x] 1.1: Replace L2 `description` field: `"Share feedback about a BMAD-Enhanced agent or workflow"` → `"Share feedback about a Convoke agent or workflow"`
  - [x] 1.2: Grep verify zero stale refs in file

- [x] Task 2: Verify `.github/workflows/ci.yml` (AC: #2)
  - [x] 2.1: Confirm zero `bmad-enhanced`/`BMAD-Enhanced` instances (already verified — file uses generic npm commands, reads package name from package.json at publish time)

- [x] Task 3: Restore `docs-audit.test.js` strict assertions (AC: #3, #4)
  - [x] 3.1: L508-513 — Remove TODO comment, change `assert.ok(result.exitCode === 0 || result.exitCode === 1, 'should exit 0 or 1')` to `assert.equal(result.exitCode, 0, 'should exit 0 (no findings)')`
  - [x] 3.2: L519-522 — Remove TODO comment, remove `nonBrandFindings` workaround, change to `assert.equal(parsed.length, 0, 'should have zero findings')`
  - [x] 3.3: Run `npm test` to verify assertions pass

- [x] Task 4: Cross-file verification (AC: #5)
  - [x] 4.1: Run `node scripts/docs-audit.js` — confirm zero findings
  - [x] 4.2: Grep `.github/` for `bmad-enhanced` (case-insensitive) — zero matches
  - [x] 4.3: Run `npm test` — all pass

## Dev Notes

### Critical Context

**This is the smallest story in Phase 3.** Only 1 file edit (feedback.yml), 1 file verify-only (ci.yml), and 1 tech debt fix (docs-audit.test.js). The tech debt fix is the most important part — it restores the quality gate that enforces zero stale brand references.

**Tech debt origin:** Story 1.4 (Epic 1) relaxed the docs-audit.test.js assertions because `checkStaleBrandReferences` was finding stale refs in docs not yet renamed. Epic 2 completed all doc renames. docs-audit now returns zero findings. The TODO comments at L508 and L519 explicitly say "Restore after Phase 3 Epics 2-3 rename all docs." Epic 2 is done — time to restore.

### Safe Replacement Patterns (NFR4)

**DO replace:**
- `BMAD-Enhanced` → `Convoke` (display name in feedback.yml description)

**DO NOT replace:**
- `_bmad` in any path
- `BMAD Method` or `BMad Core`
- Agent names or IDs
- `.claude/commands/bmad-*` skill refs

### File-Specific Guidance

**`.github/ISSUE_TEMPLATE/feedback.yml` (1 ref):**
- Line 2 only: `description` field contains `BMAD-Enhanced`
- All other content (agent names, dropdown options) are correct — no product name refs
- Straightforward single-line replacement

**`.github/workflows/ci.yml` (0 refs — verify only):**
- Confirmed zero product name refs — uses `npm ci`, `npm test`, `npm publish` (generic)
- Publish job reads package name from package.json at runtime — no hardcoded `bmad-enhanced`
- No changes needed

**`tests/unit/docs-audit.test.js` (2 assertion fixes):**
- L508-513: CLI exit code test — currently accepts 0 or 1, restore to require 0
- L519-522: JSON output test — currently filters out `stale-brand-reference` findings, restore to require `parsed.length === 0`
- Both have TODO comments explaining the relaxation reason and when to restore

### Previous Story Intelligence

**From Epic 2 Retrospective:**
- This tech debt item was flagged in Epic 1's retro, carried through Epic 2 without resolution
- Team agreement: "Carry-forward debt must be resolved within one epic — no more two-epic deferrals"
- docs-audit returns zero findings now (confirmed in Story 2.3), so strict assertions will pass

**From Story 2.3 Code Review:**
- docs-audit returns zero `stale-brand-reference` findings after Epic 2
- All shipped content updated — the prerequisite for restoring strict assertions is met

### What NOT to Change in This Story

- Do NOT update docs files — done in Epic 2
- Do NOT update source code files — done in Epic 1
- Do NOT update test files other than the specific docs-audit.test.js assertion fixes
- Do NOT modify `_bmad/` paths or agent definitions
- Do NOT update miscellaneous top-level files — that's Story 3.2
- Do NOT update `_bmad-output/` historical docs — that's Story 3.3

### References

- [Source: _bmad-output/planning-artifacts/epics-phase3.md#Story 3.1, lines 388-402]
- [Source: .github/ISSUE_TEMPLATE/feedback.yml — 1 product name ref at L2]
- [Source: .github/workflows/ci.yml — 0 refs, verify only]
- [Source: tests/unit/docs-audit.test.js — L508-513 and L519-522, TODO comments mark exact locations]
- [Source: _bmad-output/implementation-artifacts/p3-epic-2-retro-2026-03-07.md — Tech debt item #1]
- [Source: _bmad-output/implementation-artifacts/p3-epic-1-retro-2026-03-06.md — Original tech debt flag]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

None — all tasks completed without errors.

### Completion Notes List

- `.github/ISSUE_TEMPLATE/feedback.yml`: L2 description updated from "BMAD-Enhanced agent or workflow" to "Convoke agent or workflow". Single replacement, zero stale refs confirmed.
- `.github/workflows/ci.yml`: Verified zero product name refs. Uses generic npm commands; publish job reads package name from package.json at runtime. No changes needed.
- `tests/unit/docs-audit.test.js`: Restored strict assertions. L508-512: Removed TODO comment, changed relaxed `assert.ok(exitCode === 0 || exitCode === 1)` to strict `assert.equal(exitCode, 0)`. L519-522: Removed TODO comment and `nonBrandFindings` filter workaround, restored to `assert.equal(parsed.length, 0)`. Tech debt resolved — carried since Epic 1 retro (Story 1.4).
- Verification: `npm test` — 315/315 pass. `docs-audit` — zero findings. Grep `.github/` — zero stale refs.

### File List

- `.github/ISSUE_TEMPLATE/feedback.yml` (1 replacement)
- `tests/unit/docs-audit.test.js` (2 assertion fixes, 2 TODO comment removals)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (status updated)
- `_bmad-output/implementation-artifacts/p3-3-1-update-github-ci-configuration.md` (story file updated)
