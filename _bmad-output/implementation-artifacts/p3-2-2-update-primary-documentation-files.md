# Story 2.2: Update Primary Documentation Files

Status: done

## Story

As a user following install, update, or compatibility guides,
I want all primary documentation to reference Convoke with correct CLI commands,
So that I can follow instructions without encountering stale product name references.

## Acceptance Criteria

1. **Given** `INSTALLATION.md`
   **When** the rename is applied
   **Then** it uses `npm install convoke`, `npx convoke-install-vortex`, and all `convoke-*` commands
   **And** zero instances of `bmad-enhanced`/`BMAD-Enhanced` remain

2. **Given** `UPDATE-GUIDE.md`
   **When** the rename is applied
   **Then** all 22 CLI refs and package name references are updated
   **And** zero instances of `bmad-enhanced`/`BMAD-Enhanced` remain

3. **Given** `CHANGELOG.md`
   **When** the rename is applied
   **Then** a v2.0.0 entry explains the rename with migration instructions
   **And** all historical entries are updated
   **And** zero instances of `bmad-enhanced`/`BMAD-Enhanced` remain

4. **Given** `BMAD-METHOD-COMPATIBILITY.md`
   **When** the rename is applied
   **Then** all 36 product name refs are updated
   **And** "BMAD Method" / "BMad Core" references are preserved intact
   **And** zero instances of `bmad-enhanced`/`BMAD-Enhanced` remain

5. **Given** `PUBLISHING-GUIDE.md`
   **When** the rename is applied
   **Then** all 40 refs and publishing instructions are updated
   **And** zero instances of `bmad-enhanced`/`BMAD-Enhanced` remain

6. **Given** `scripts/README.md`
   **When** the rename is applied
   **Then** it references Convoke (3 refs)
   **And** zero instances of `bmad-enhanced`/`BMAD-Enhanced` remain

7. **Given** all 6 files
   **When** scanned
   **Then** zero instances of `bmad-enhanced` or `BMAD-Enhanced` remain in any file

## Tasks / Subtasks

- [x] Task 1: Update `INSTALLATION.md` (AC: #1)
  - [x] 1.1: Replace all `bmad-enhanced` / `BMAD-Enhanced` product name refs (7 instances) with `convoke` / `Convoke`
  - [x] 1.2: Replace all CLI command refs (8 instances): `bmad-install-vortex-agents` -> `convoke-install-vortex`, `bmad-doctor` -> `convoke-doctor`, `bmad-version` -> `convoke-version`
  - [x] 1.3: Verify `_bmad/` path refs and `BMAD Method` refs are preserved
  - [x] 1.4: Grep verify zero stale refs

- [x] Task 2: Update `UPDATE-GUIDE.md` (AC: #2)
  - [x] 2.1: Replace all `bmad-enhanced` / `BMAD-Enhanced` product name refs (6 instances)
  - [x] 2.2: Replace all CLI command refs (22 instances): `bmad-update` -> `convoke-update`, `bmad-version` -> `convoke-version`, `bmad-doctor` -> `convoke-doctor`, `bmad-install-vortex-agents` -> `convoke-install-vortex`, `bmad-install-agents` -> `convoke-install`
  - [x] 2.3: Verify `_bmad/` path refs preserved
  - [x] 2.4: Grep verify zero stale refs

- [x] Task 3: Update `CHANGELOG.md` (AC: #3)
  - [x] 3.1: Add v2.0.0 entry at the top explaining the rename with migration instructions (install `convoke`, CLI commands renamed, `_bmad/` preserved)
  - [x] 3.2: Replace all `bmad-enhanced` / `BMAD-Enhanced` product name refs in historical entries (13 instances)
  - [x] 3.3: Replace all CLI command refs in historical entries (36 instances)
  - [x] 3.4: Verify `_bmad/` path refs and `BMAD Method` refs preserved
  - [x] 3.5: Grep verify zero stale refs
  - [x] 3.6: Ensure no permanent docs-audit false positives (lesson from Story 2.1 — avoid exact `BMAD-Enhanced` string in new v2.0.0 entry)

- [x] Task 4: Update `BMAD-METHOD-COMPATIBILITY.md` (AC: #4)
  - [x] 4.1: Replace all `BMAD-Enhanced` / `bmad-enhanced` product name refs (36 instances) with `Convoke` / `convoke`. This file describes how Convoke (formerly BMAD-Enhanced) works with the BMAD Method — update all product name refs while preserving framework refs
  - [x] 4.2: Replace all CLI command refs (8 instances)
  - [x] 4.3: Verify all `BMAD Method`, `BMad Core`, `_bmad/` refs preserved — these are framework/directory refs, NOT product refs
  - [x] 4.4: Grep verify zero stale product name refs

- [x] Task 5: Update `PUBLISHING-GUIDE.md` (AC: #5)
  - [x] 5.1: Replace all `bmad-enhanced` / `BMAD-Enhanced` product name refs (40 instances)
  - [x] 5.2: Replace all CLI command refs (5 instances)
  - [x] 5.3: Update GitHub repo URL refs: `github.com/amalik/BMAD-Enhanced` -> `github.com/amalik/convoke`
  - [x] 5.4: Verify `BMAD Method` refs preserved
  - [x] 5.5: Grep verify zero stale refs

- [x] Task 6: Update `scripts/README.md` (AC: #6)
  - [x] 6.1: Replace all `BMAD-Enhanced` / `bmad-enhanced` refs (3 instances)
  - [x] 6.2: Verify `_bmad/` path refs preserved
  - [x] 6.3: Grep verify zero stale refs

- [x] Task 7: Cross-file verification (AC: #7)
  - [x] 7.1: Grep all 6 files for `bmad-enhanced` (case-insensitive) — zero matches confirmed
  - [x] 7.2: Grep all 6 files for `bmad-update|bmad-version|bmad-doctor|bmad-install|bmad-migrate` — zero matches confirmed
  - [x] 7.3: Run `node scripts/docs-audit.js` — these 6 files have zero `stale-brand-reference` findings (21 remaining findings are all in Story 2.3 scope: docs/ and user guides)

## Dev Notes

### Critical Context

**Scale:** ~184 total stale refs across 6 files (105 product name + 79 CLI). This is the largest story in Epic 2 by ref count.

**Atomic commit rule:** Same as Story 2.1 — docs changes don't break tests, so individual commits are acceptable. Alternatively, commit with Story 2.3 for full Epic 2 atomicity.

### Safe Replacement Patterns (NFR4)

**DO replace:**
- `bmad-enhanced` -> `convoke` (hyphenated package name)
- `BMAD-Enhanced` -> `Convoke` (display name)
- `BMAD Enhanced` -> `Convoke` (prose variant)
- `bmad-update` -> `convoke-update`
- `bmad-version` -> `convoke-version`
- `bmad-doctor` -> `convoke-doctor`
- `bmad-install-vortex-agents` -> `convoke-install-vortex`
- `bmad-install-agents` -> `convoke-install`
- `bmad-migrate` -> `convoke-migrate`
- `github.com/amalik/BMAD-Enhanced` -> `github.com/amalik/convoke`

**DO NOT replace:**
- `_bmad` in any path reference
- `BMAD Method` or `BMad Core` (framework names)
- `BMAD directory` or `BMAD dir` (refers to `_bmad/` directory)
- Bare `bmad` alone (could be BMAD Method reference)
- `.claude/commands/bmad-*` (BMAD framework, not product)

### File-Specific Guidance

**INSTALLATION.md (15 total refs):**
- 7 product name + 8 CLI refs
- Preserved: `_bmad/` paths (lines 59-113), `BMAD Method` link (line 13)

**UPDATE-GUIDE.md (28 total refs):**
- 6 product name + 22 CLI refs (highest CLI density)
- Preserved: `_bmad/bme/_vortex/` paths, `_bmad-output/` backup paths
- Watch for `npx -p bmad-enhanced@latest bmad-update` cache tip pattern (2-part replacement)

**CHANGELOG.md (49 total refs):**
- 13 product name + 36 CLI refs
- Needs NEW v2.0.0 entry at top — follow pattern of existing entries
- Historical entries: update product name and CLI refs in all version entries
- Preserved: `_bmad/` paths throughout, `BMAD Method` refs
- Lesson from Story 2.1: avoid exact `BMAD-Enhanced` string in new v2.0.0 entry to prevent permanent docs-audit false positive. Use "Product renamed to Convoke" instead.

**BMAD-METHOD-COMPATIBILITY.md (44 total refs):**
- 36 product name + 8 CLI refs
- This file explains how Convoke relates to BMAD Method — every `BMAD-Enhanced` becomes `Convoke` but `BMAD Method`/`BMad Core` stay
- Contains architecture diagrams with both product and framework names — update product, keep framework
- High semantic density: many refs appear in sentences mixing product and framework names. Read each instance carefully.

**PUBLISHING-GUIDE.md (45 total refs):**
- 40 product name + 5 CLI refs
- Contains npm publishing instructions, GitHub URLs, package metadata
- Alpha-era guide — may have outdated `_designos` paths (secondary issue, not in scope for this story)

**scripts/README.md (3 total refs):**
- 3 product name + 0 CLI refs
- Ships in npm package (included via `files` field)
- Simplest file — quick update

### Previous Story Intelligence (from Story 2.1)

**From Story 2.1 Code Review:**
- Roadmap wording caused permanent docs-audit false positive — fixed by avoiding exact `BMAD-Enhanced` string. Apply same lesson to CHANGELOG v2.0.0 entry.
- Grep verification after each file is essential quality gate

**From Epic 1 Retrospective:**
- NFR4 safe replacement patterns work reliably
- `checkStaleBrandReferences` in docs-audit.js validates these files — use as final verification
- "BMAD Enhanced" (space-separated) variant needs per-instance review

### Recommended Execution Order

1. `scripts/README.md` (3 refs — warm up)
2. `INSTALLATION.md` (15 refs)
3. `UPDATE-GUIDE.md` (28 refs)
4. `BMAD-METHOD-COMPATIBILITY.md` (44 refs — requires careful semantic review)
5. `PUBLISHING-GUIDE.md` (45 refs)
6. `CHANGELOG.md` (49 refs — most complex, needs new v2.0.0 entry)
7. Cross-file verification

### What NOT to change in this story

- Do NOT update README.md — done in Story 2.1
- Do NOT update docs/ directory files, user guides, or workflow templates — that's Story 2.3
- Do NOT change source code files — done in Epic 1
- Do NOT change test files
- Do NOT modify `_bmad/` paths or agent definitions
- Do NOT rename "BMAD Method", "BMAD Core", or agent IDs

### References

- [Source: _bmad-output/planning-artifacts/epics-phase3.md#Story 2.2, lines 336-354]
- [Source: INSTALLATION.md — 7 product name + 8 CLI refs]
- [Source: UPDATE-GUIDE.md — 6 product name + 22 CLI refs]
- [Source: CHANGELOG.md — 13 product name + 36 CLI refs]
- [Source: BMAD-METHOD-COMPATIBILITY.md — 36 product name + 8 CLI refs]
- [Source: PUBLISHING-GUIDE.md — 40 product name + 5 CLI refs]
- [Source: scripts/README.md — 3 product name + 0 CLI refs]
- [Source: _bmad-output/implementation-artifacts/p3-2-1-overhaul-readme.md — Story 2.1 learnings]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

None — all tasks completed without errors.

### Completion Notes List

- scripts/README.md: 3 product name refs updated (title, description, install command). `_bmad/` paths preserved throughout.
- INSTALLATION.md: 7 product name + 8 CLI refs updated. GitHub clone URL updated. `_bmad/` paths (15+) and `BMAD Method` link preserved.
- UPDATE-GUIDE.md: 6 product name + 22 CLI refs updated via replace_all for each CLI pattern. GitHub issue URL updated. `_bmad/` paths preserved.
- BMAD-METHOD-COMPATIBILITY.md: 36 product name + 8 CLI refs updated with careful per-instance review. Architecture diagram label updated. Version ref updated to v2.0.0. All `BMAD Method` refs (46 instances) preserved intact.
- PUBLISHING-GUIDE.md: 40 product name + 5 CLI refs updated via bulk replace. GitHub URLs updated from `bmadhub` to `amalik/convoke`. Alpha-era content preserved as historical reference.
- CHANGELOG.md: New v2.0.0 entry added at top with rename explanation, CLI mapping, and migration instructions. Worded to avoid docs-audit false positive (no exact `BMAD-Enhanced` string in new entry). 13 product name + 36 CLI refs updated in historical entries. `_bmad/` paths (26 instances) and `BMAD Method` refs preserved.
- Cross-file verification: Zero `bmad-enhanced` (case-insensitive) matches. Zero stale CLI refs. docs-audit shows zero findings for these 6 files; 21 remaining findings are all in Story 2.3 scope.

### File List

- `scripts/README.md` (3 replacements)
- `INSTALLATION.md` (15 replacements)
- `UPDATE-GUIDE.md` (28 replacements)
- `BMAD-METHOD-COMPATIBILITY.md` (44 replacements)
- `PUBLISHING-GUIDE.md` (45 replacements)
- `CHANGELOG.md` (49 replacements + new v2.0.0 entry)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (status updated)
- `_bmad-output/implementation-artifacts/p3-2-2-update-primary-documentation-files.md` (story file updated)

## Code Review Record

### Review Date
2026-03-07

### Reviewer
Claude Opus 4.6 (adversarial code review)

### Verdict
PASS (after fixes)

### Findings Summary

**Initial findings: 1 HIGH, 2 MEDIUM, 2 LOW**

| # | Severity | Description | Status |
|---|----------|-------------|--------|
| H1 | HIGH | CHANGELOG v2.0.0 "was" column destroyed by bulk `replace_all` — old `bmad-*` names replaced with `convoke-*`, producing nonsensical `convoke-install-vortex (was convoke-install-vortex)` | FIXED |
| M1 | MEDIUM | CHANGELOG GitHub URLs capitalized — `github.com/amalik/Convoke` instead of lowercase `convoke` (lines 910, 912) | FIXED |
| M2 | MEDIUM | PUBLISHING-GUIDE local filesystem paths capitalized — `/Users/amalikamriou/Convoke` instead of lowercase (3 instances) | FIXED |
| L1 | LOW | PUBLISHING-GUIDE contains alpha-era content (`_designos` paths, old agent names) — pre-existing, not in scope | NOTED |
| L2 | LOW | CHANGELOG historical entries reference features no longer current — pre-existing, not in scope | NOTED |

**After fixes: 0 HIGH, 0 MEDIUM, 2 LOW (out of scope)**

### AC Verification

| AC | Status | Evidence |
|----|--------|----------|
| #1 INSTALLATION.md | PASS | Zero stale refs confirmed via grep |
| #2 UPDATE-GUIDE.md | PASS | Zero stale refs confirmed via grep |
| #3 CHANGELOG.md | PASS | v2.0.0 entry present, historical refs updated, zero stale refs |
| #4 BMAD-METHOD-COMPATIBILITY.md | PASS | 36 product refs updated, BMAD Method/BMad Core preserved, zero stale refs |
| #5 PUBLISHING-GUIDE.md | PASS | 40 refs updated, URLs corrected, zero stale refs |
| #6 scripts/README.md | PASS | 3 refs updated, zero stale refs |
| #7 Cross-file verification | PASS | `docs-audit.js` shows zero findings for these 6 files |

### Lessons Learned

- **Bulk replace ordering matters**: When adding new content that references old names (e.g., "was `bmad-install`"), add it AFTER bulk replacements or use a format that won't match replace patterns.
- **Case sensitivity in URLs**: `BMAD-Enhanced`→`Convoke` replace_all produces uppercase in URL/path contexts. Always review URL and filesystem path contexts after bulk replace.
