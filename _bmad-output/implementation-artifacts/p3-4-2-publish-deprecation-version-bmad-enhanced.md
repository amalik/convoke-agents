# Story 4.2: Publish Deprecation Version of bmad-enhanced

Status: done

## Story

As a user on bmad-enhanced@1.7.x,
I want to receive a clear deprecation notice pointing me to the new `convoke-agents` package,
So that I know how to migrate without losing my data.

## Acceptance Criteria

1. **Given** `convoke-agents@2.0.0` exists on npm (confirmed — Story 4.1 done)
   **When** `bmad-enhanced@1.8.0` is published
   **Then** the package.json includes a `"deprecated"` field pointing to `convoke-agents`

2. **Given** a user installs `bmad-enhanced@1.8.0`
   **When** the postinstall script runs
   **Then** a prominent deprecation banner is displayed with:
   - Clear message that `bmad-enhanced` has been renamed to `convoke-agents`
   - Migration command: `npm install convoke-agents`
   - Assurance that `_bmad/` and `_bmad-output/` data is preserved
   - The banner uses ANSI bold/yellow for visibility

3. **Given** `bmad-enhanced@1.8.0` is published
   **When** `npm deprecate` is executed
   **Then** `npm deprecate bmad-enhanced "Renamed to convoke-agents. Run: npm install convoke-agents"` succeeds
   **And** `npm info bmad-enhanced` shows the deprecation message

4. **Given** the deprecation is complete
   **When** the developer returns to main branch
   **Then** no files on `main` are modified (all changes are on the `deprecation` branch only)

## Tasks / Subtasks

- [x] Task 1: Create deprecation branch from pre-rename tag (AC: #4)
  - [x] 1.1: Run `git checkout -b deprecation v1.7.0`
  - [x] 1.2: Verify branch is at pre-rename state: `package.json` name is `bmad-enhanced`

- [x] Task 2: Modify package.json on deprecation branch (AC: #1)
  - [x] 2.1: Bump version to `1.8.0` (latest published is `1.7.1` on npm; branching from `v1.7.0` tag which has `1.7.0`)
  - [x] 2.2: Add `"deprecated": "This package has been renamed to convoke-agents. Run: npm install convoke-agents"` field
  - [x] 2.3: Verify: `cat package.json | grep -e '"version"' -e '"deprecated"'`

- [x] Task 3: Add deprecation banner to postinstall.js (AC: #2)
  - [x] 3.1: Add a deprecation banner block at the TOP of the `main()` function in `scripts/postinstall.js`
  - [x] 3.2: Banner content:
    ```
    ╔══════════════════════════════════════════════════════════════╗
    ║                                                              ║
    ║   ⚠️  PACKAGE RENAMED                                        ║
    ║                                                              ║
    ║   bmad-enhanced has been renamed to convoke-agents           ║
    ║                                                              ║
    ║   To migrate, run:                                           ║
    ║     npm install convoke-agents                               ║
    ║                                                              ║
    ║   Your _bmad/ and _bmad-output/ data is fully preserved.    ║
    ║   No data loss occurs during migration.                      ║
    ║                                                              ║
    ╚══════════════════════════════════════════════════════════════╝
    ```
  - [x] 3.3: Banner should use ANSI yellow/bold for visibility
  - [x] 3.4: Test locally: `node scripts/postinstall.js` displays the banner

- [x] Task 4: Commit and publish from deprecation branch (AC: #1, #2)
  - [x] 4.1: `git add package.json scripts/postinstall.js`
  - [x] 4.2: `git commit -m "Deprecation notice: bmad-enhanced renamed to convoke-agents"`
  - [x] 4.3: Run `npm publish` from the deprecation branch (requires npm auth/OTP)
  - [x] 4.4: Verify: `npm view bmad-enhanced@1.8.0 version` returns `1.8.0`

- [x] Task 5: Execute npm deprecate command (AC: #3)
  - [x] 5.1: Run `npm deprecate bmad-enhanced "Renamed to convoke-agents. Run: npm install convoke-agents"`
  - [x] 5.2: Verify: `npm info bmad-enhanced` shows deprecation message
  - [x] 5.3: Verify: `npm view bmad-enhanced deprecated` returns the deprecation string

- [x] Task 6: Return to main branch (AC: #4)
  - [x] 6.1: `git checkout main`
  - [x] 6.2: Verify: `package.json` name is `convoke-agents` (main branch state unchanged)
  - [x] 6.3: The deprecation branch can be kept for reference or deleted later

## Dev Notes

### Critical Context

**Branch workflow is essential.** The deprecation version MUST be published from a branch based on the pre-rename codebase (`v1.7.0` tag), NOT from `main`. The `main` branch has the Convoke rename — publishing `bmad-enhanced` from `main` would ship incorrect content.

**Sequencing:** `convoke-agents@2.0.0` is already live on npm (Story 4.1 done). This story can proceed immediately.

**The `v1.7.0` tag is the latest pre-rename tag.** The epics reference `v1.7.1` but only `v1.7.0` exists. Use `v1.7.0` as the branch point.

### Pre-rename State at v1.7.0

- `package.json` name: `bmad-enhanced`
- `package.json` version: `1.7.0`
- `scripts/postinstall.js`: Exists, prints `BMAD-Enhanced installed!`, has update detection logic
- CLI commands: `bmad-install-vortex-agents`, `bmad-install-agents`, `bmad-update`, `bmad-version`, `bmad-migrate`, `bmad-doctor`

### What Does NOT Change

- No files on `main` branch are modified
- No version bump on `main`
- The deprecation branch is ephemeral — only used for the `bmad-enhanced@1.8.0` publish
- Existing `bmad-enhanced@1.7.0` users are not affected until they upgrade

### npm deprecate Command

The `npm deprecate` command marks ALL versions of the package (not just 1.8.0) with the deprecation message. This is intentional — we want users on ANY version of `bmad-enhanced` to see the deprecation when they run `npm info` or `npm outdated`.

### Previous Story Intelligence

**From Story 4.1:**
- `convoke-agents@2.0.0` is live on npm (full release, not placeholder)
- NFR5 sequencing satisfied — package exists before deprecation notice
- Published by `amalik` — same npm account needed for `bmad-enhanced` deprecation

**From Story 4.0:**
- All codebase references updated to `convoke-agents` on `main`
- Migration preview in `1.7.x-to-2.0.0.js` already says `bmad-enhanced -> convoke-agents`

### User Authentication Note

Publishing `bmad-enhanced@1.8.0` and running `npm deprecate` both require npm authentication. The user handled npm auth manually in Story 4.1 — expect the same for this story. HALT if `npm whoami` fails and let the user authenticate.

### References

- [Source: _bmad-output/planning-artifacts/epics-phase3.md#Story 4.2, lines 516-538]
- [Source: _bmad-output/planning-artifacts/epics-phase3.md#NFR5, line 89]
- [Source: _bmad-output/implementation-artifacts/p3-4-1-reserve-npm-package-name.md — Story 4.1 confirms convoke-agents@2.0.0 is live]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

### Completion Notes List

- Created `deprecation` branch from `v1.7.0` tag
- Bumped version to `1.8.0`, added `deprecated` field in package.json
- Added ANSI yellow/bold deprecation banner to postinstall.js
- Committed as `a990f8a` on deprecation branch
- Published `bmad-enhanced@1.8.0` to npm — verified live
- Ran `npm deprecate bmad-enhanced` — verified deprecation message on all versions
- Returned to `main` — confirmed `convoke-agents@2.0.0` identity preserved

### File List

- `package.json` (on deprecation branch) — version 1.8.0, deprecated field added
- `scripts/postinstall.js` (on deprecation branch) — deprecation banner added
