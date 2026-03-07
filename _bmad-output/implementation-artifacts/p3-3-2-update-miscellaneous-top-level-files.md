# Story 3.2: Update Miscellaneous Top-Level Files

Status: review

## Story

As a maintainer,
I want all remaining top-level files updated to reference Convoke,
So that no stale product name references exist outside of `_bmad-output/`.

## Acceptance Criteria

1. **Given** `RELEASE-NOTES-v1.0.3-alpha.md`
   **When** the rename is applied
   **Then** all ~29 instances of `bmad-enhanced`/`BMAD-Enhanced`/`bmad-install-agents` are replaced with Convoke equivalents
   **And** zero stale product name or CLI command references remain

2. **Given** `CREATE-v1.0.3-RELEASE.md`
   **When** the rename is applied
   **Then** all ~26 instances of `BMAD-Enhanced`/`bmad-enhanced`/`bmad-install-agents` are replaced with Convoke equivalents
   **And** zero stale product name or CLI command references remain

3. **Given** `TEST-PLAN-REAL-INSTALL.md`
   **When** the rename is applied
   **Then** all ~23 instances of `bmad-enhanced`/`BMAD-Enhanced`/`bmad-install-agents` are replaced with Convoke equivalents
   **And** zero stale product name or CLI command references remain

4. **Given** `release-notes-v1.1.1.md` and `release-notes-v1.1.2.md`
   **When** the rename is applied
   **Then** all ~25 instances across both files are replaced with Convoke equivalents (11 + 14)
   **And** zero stale product name or CLI command references remain

5. **Given** `release-notes-v1.6.0.md`
   **When** the rename is applied
   **Then** all 3 instances of `BMAD-Enhanced`/`bmad-enhanced` are replaced with Convoke equivalents
   **And** zero stale product name or CLI command references remain

6. **Given** `CREATE-RELEASE-GUIDE.md`
   **When** the rename is applied
   **Then** all ~4 instances of `BMAD-Enhanced` are replaced with `Convoke`
   **And** zero stale product name references remain

7. **Given** `create-github-release.sh`
   **When** the rename is applied
   **Then** all ~3 instances of `BMAD-Enhanced` are replaced with `Convoke`
   **And** the repo URL uses lowercase `convoke` (not uppercase)
   **And** zero stale product name references remain

8. **Given** `CLEANUP-SUMMARY.md`
   **When** the rename is applied
   **Then** all ~4 instances of `bmad-enhanced`/`BMAD-Enhanced` are replaced with Convoke equivalents
   **And** zero stale product name references remain

9. **Given** `WARP.md`
   **When** the rename is applied
   **Then** all 3 instances of `BMAD-Enhanced` are replaced with `Convoke`
   **And** zero stale product name references remain

10. **Given** all changes
    **When** a comprehensive grep is run
    **Then** zero instances of `bmad-enhanced`/`BMAD-Enhanced`/`BMAD Enhanced` remain in any top-level `*.md` or `*.sh` file (excluding `CHANGELOG.md` migration table "was" column and `package.json` keywords — both intentional)
    **And** `npm test` passes with zero failures

## Tasks / Subtasks

- [x] Task 1: Update release notes files (AC: #1, #4, #5)
  - [x] 1.1: `RELEASE-NOTES-v1.0.3-alpha.md` — replace all stale refs (~29)
  - [x] 1.2: `release-notes-v1.1.1.md` — replace all stale refs (~11)
  - [x] 1.3: `release-notes-v1.1.2.md` — replace all stale refs (~14)
  - [x] 1.4: `release-notes-v1.6.0.md` — replace all stale refs (3)
  - [x] 1.5: Grep verify all 4 files — zero stale refs

- [x] Task 2: Update release/guide files (AC: #2, #6)
  - [x] 2.1: `CREATE-v1.0.3-RELEASE.md` — replace all stale refs (~26)
  - [x] 2.2: `CREATE-RELEASE-GUIDE.md` — replace all stale refs (~4)
  - [x] 2.3: Grep verify both files — zero stale refs

- [x] Task 3: Update remaining misc files (AC: #3, #7, #8, #9)
  - [x] 3.1: `TEST-PLAN-REAL-INSTALL.md` — replace all stale refs (~23)
  - [x] 3.2: `create-github-release.sh` — replace all stale refs (~3), verify URL is lowercase
  - [x] 3.3: `CLEANUP-SUMMARY.md` — replace all stale refs (~4)
  - [x] 3.4: `WARP.md` — replace all stale refs (3)
  - [x] 3.5: Grep verify all 4 files — zero stale refs

- [x] Task 4: Cross-file verification (AC: #10)
  - [x] 4.1: Grep all top-level `*.md` and `*.sh` for `bmad-enhanced`/`BMAD-Enhanced`/`BMAD Enhanced` — zero matches (excluding CHANGELOG.md "was" column and package.json keywords)
  - [x] 4.2: Grep for old CLI commands (`bmad-update`, `bmad-version`, `bmad-migrate`, `bmad-doctor`, `bmad-install`) in same scope — zero matches (excluding CHANGELOG.md "was" column)
  - [x] 4.3: Run `npm test` — all pass

## Dev Notes

### Critical Context

**This is a mechanical bulk-replacement story.** 10 files, ~120 total references. All files are historical documentation or helper scripts — not shipped in npm package, not user-facing during normal usage. Low semantic risk, high volume.

**Key exclusions (NOT in scope):**
- `CHANGELOG.md` lines 16-21: "was `bmad-*`" entries are **intentional** (migration reference table added in Story 2.2)
- `package.json` line 38: `bmad-enhanced` keyword is **intentional** (NFR6 discoverability)
- `_bmad-output/` files: That's Story 3.3
- `_bmad/` paths: Never modified
- "BMAD Method" / "BMad Core" references: Never modified

### Safe Replacement Patterns (NFR4)

**Product name replacements:**
- `BMAD-Enhanced` -> `Convoke`
- `bmad-enhanced` -> `convoke`
- `BMAD Enhanced` -> `Convoke` (check per-instance — may be verb usage in historical context)

**CLI command replacements:**
- `bmad-install-vortex-agents` -> `convoke-install-vortex`
- `bmad-install-agents` -> `convoke-install`
- `bmad-update` -> `convoke-update`
- `bmad-version` -> `convoke-version`
- `bmad-migrate` -> `convoke-migrate`
- `bmad-doctor` -> `convoke-doctor`

**DO NOT replace:**
- `_bmad` in any path
- `BMAD Method` or `BMad Core`
- Agent names or IDs
- `.claude/commands/bmad-*` skill refs
- Bare `bmad` (only hyphenated forms)

### Replacement Ordering (Standing Rule from Epic 2 Retro)

**CRITICAL:** Replace longer patterns FIRST to avoid partial matches:
1. `bmad-install-vortex-agents` -> `convoke-install-vortex` (longest CLI command)
2. `bmad-install-agents` -> `convoke-install`
3. `bmad-enhanced` -> `convoke` / `BMAD-Enhanced` -> `Convoke`
4. `bmad-update` -> `convoke-update`
5. `bmad-version` -> `convoke-version`
6. `bmad-migrate` -> `convoke-migrate`
7. `bmad-doctor` -> `convoke-doctor`

### Post-Replace Audit (from Epic 2 Retro Action Item #2)

After any `replace_all`, specifically audit:
- **URL contexts** — must be lowercase (`github.com/amalik/convoke`, NOT `github.com/amalik/Convoke`)
- **Filesystem path contexts** — case-sensitive, verify correctness
- **"was" / comparison contexts** — do NOT replace old names that are being referenced as historical values

### File-Specific Guidance

**High-volume files (>20 refs each):**
- `RELEASE-NOTES-v1.0.3-alpha.md` (29 refs): Historical release notes for v1.0.3-alpha. Contains npm package name, display name, and `bmad-install-agents` CLI refs.
- `CREATE-v1.0.3-RELEASE.md` (26 refs): Historical release procedure. Contains display name, package name, and CLI refs. Watch for GitHub URLs (must be lowercase).
- `TEST-PLAN-REAL-INSTALL.md` (23 refs): Test plan document. Contains package name, display name, and CLI refs.

**Medium-volume files (10-15 refs each):**
- `release-notes-v1.1.1.md` (11 refs), `release-notes-v1.1.2.md` (14 refs): Historical release notes.

**Low-volume files (3-4 refs each):**
- `release-notes-v1.6.0.md` (3 refs): Recent release notes.
- `CREATE-RELEASE-GUIDE.md` (4 refs): All `BMAD-Enhanced` display name refs.
- `create-github-release.sh` (3 refs): Shell script with `BMAD-Enhanced` refs. Verify repo URL uses lowercase.
- `CLEANUP-SUMMARY.md` (4 refs): Mix of lowercase and display name.
- `WARP.md` (3 refs): All `BMAD-Enhanced` display name refs.

### Previous Story Intelligence

**From Story 3.1:**
- Smallest story in Phase 3 — 1 file edit + 1 verify + tech debt fix. No issues. Clean PASS on code review.
- docs-audit quality gate is now strict (exit code 0, zero findings). Any regression will be caught.

**From Epic 2 Retrospective (Action Items):**
- Standing rule: replacement ordering (longer patterns first) — APPLY HERE
- Post-replace URL/path audit after any replace_all — APPLY HERE
- `BMAD Enhanced` (space-separated) requires per-instance context check — APPLY HERE

**From Epic 2 Story 2.2 Code Review (HIGH finding):**
- Bulk replace destroyed CHANGELOG "was" column entries. The CHANGELOG is NOT in scope for this story, but the same pattern applies: if any file has "was `bmad-*`" comparison contexts, DO NOT replace the old name in those contexts.

**From Epic 1 Retrospective:**
- Grep verification as quality gate — 100% success rate across 7 stories. Continue pattern.
- PSI compounding confirmed across 4 epics now.

### What NOT to Change in This Story

- Do NOT update `_bmad-output/` files — that's Story 3.3
- Do NOT update `CHANGELOG.md` — migration table "was" column is intentional
- Do NOT update `package.json` — `bmad-enhanced` keyword is intentional (NFR6)
- Do NOT update docs/ files — done in Epic 2
- Do NOT update source code files — done in Epic 1
- Do NOT update test files — done in Epic 1
- Do NOT modify `_bmad/` paths or agent definitions

### References

- [Source: _bmad-output/planning-artifacts/epics-phase3.md#Story 3.2, lines 404-419]
- [Source: _bmad-output/implementation-artifacts/p3-3-1-update-github-ci-configuration.md — Previous story, completed]
- [Source: _bmad-output/implementation-artifacts/p3-epic-2-retro-2026-03-07.md — Replacement ordering rule, URL audit rule]
- [Source: _bmad-output/implementation-artifacts/p3-epic-1-retro-2026-03-06.md — PSI pattern, grep verification]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

None — all tasks completed without errors.

### Completion Notes List

- All 10 files updated via single sed pipeline with 12 ordered replacement patterns (URLs first, then longest CLI commands first, then product names, then shorter CLI commands).
- `bmad-install-emma` and `bmad-install-wade` (deprecated v1.0.x individual agent installers, 14 refs across 4 files) were also replaced to `convoke-install-emma`/`convoke-install-wade` — not in original story mapping but required for Task 4.2 verification to pass (`bmad-install` pattern).
- No `BMAD Enhanced` (space-separated variant) found in any target file — no per-instance review needed.
- Post-replace URL audit: all GitHub URLs use lowercase `convoke` — zero case issues.
- No "was" / comparison contexts found in target files — CHANGELOG.md exclusion was the only concern and it's out of scope.
- Verification: all 10 files return zero stale refs. Cross-file grep of all top-level `*.md` and `*.sh` returns zero matches (excluding CHANGELOG.md). `npm test` — 315/315 pass.

### File List

- `RELEASE-NOTES-v1.0.3-alpha.md` (bulk replacement)
- `release-notes-v1.1.1.md` (bulk replacement)
- `release-notes-v1.1.2.md` (bulk replacement)
- `release-notes-v1.6.0.md` (bulk replacement)
- `CREATE-v1.0.3-RELEASE.md` (bulk replacement)
- `CREATE-RELEASE-GUIDE.md` (bulk replacement)
- `TEST-PLAN-REAL-INSTALL.md` (bulk replacement)
- `create-github-release.sh` (bulk replacement)
- `CLEANUP-SUMMARY.md` (bulk replacement)
- `WARP.md` (bulk replacement)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (status updated)
- `_bmad-output/implementation-artifacts/p3-3-2-update-miscellaneous-top-level-files.md` (story file updated)
