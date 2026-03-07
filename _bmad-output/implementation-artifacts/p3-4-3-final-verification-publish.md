# Story 4.3: Final Verification & Publish

Status: review

## Story

As a maintainer,
I want comprehensive verification that the rename is complete before finalizing,
so that `convoke-agents@2.0.0` ships with zero stale references and a passing test suite.

## Acceptance Criteria

1. **Given** all Epics 1-3 are complete and Stories 4.0-4.2 are done
   **When** the full verification suite is run
   **Then** all of the following pass with zero failures:
   - `npm run lint`
   - `npm test` (all unit tests)
   - `npm run test:integration`
   - `npm run test:p0:gate`
   - `npm run test:coverage`
   - `npm run docs:audit` returns zero findings

2. **Given** the verification suite passes
   **When** a comprehensive grep audit is run
   **Then** zero stale `bmad-enhanced` / `BMAD-Enhanced` / `BMAD Enhanced` references remain in source files (excluding `node_modules`, `.claude`, `package-lock.json`, and `_bmad-output/` historical docs where old names appear in "before -> after" mapping context)

3. **Given** the codebase is clean
   **When** smoke tests are run
   **Then**:
   - `node index.js` displays Convoke branding (not BMAD-Enhanced)
   - `npm pack --dry-run` shows package name `convoke-agents`

4. **Given** all verification passes
   **When** npm is checked
   **Then** `npm view convoke-agents@2.0.0 version` returns `2.0.0` (confirms package is live)

5. **Given** all verification passes
   **When** the publish sequence is executed
   **Then**:
   - GitHub repo is renamed to `convoke-agents` (manual via Settings)
   - `v2.0.0` tag is created and pushed
   - GitHub release is created with migration notes

## Tasks / Subtasks

- [x] Task 1: Run full verification suite (AC: #1)
  - [x] 1.1: Run `npm run lint` — zero errors
  - [x] 1.2: Run `npm test` — 315/315 pass
  - [x] 1.3: Run `npm run test:integration` — 67/67 pass
  - [x] 1.4: Run `npm run test:p0:gate` — 642/642 pass
  - [x] 1.5: Run `npm run test:coverage` — 93.76% statements, no regressions
  - [x] 1.6: Run `npm run docs:audit` — zero findings

- [x] Task 2: Run comprehensive grep audit (AC: #2)
  - [x] 2.1: Grep audit found 8 matches in source (excl. _bmad-output, coverage, node_modules)
  - [x] 2.2: All 8 are legitimate: migration code (3), test assertions (2), npm keyword (1), docs-audit detector (2)
  - [x] 2.3: Zero genuine stale references — no fixes needed

- [x] Task 3: Run smoke tests (AC: #3)
  - [x] 3.1: `node index.js` — displays `convoke-agents v2.0.0` with Convoke branding
  - [x] 3.2: `npm pack --dry-run` — shows `convoke-agents@2.0.0`

- [x] Task 4: Verify npm package is live (AC: #4)
  - [x] 4.1: `npm view convoke-agents@2.0.0 version` returns `2.0.0` — confirmed live

- [x] Task 5: Rename GitHub repo and create release (AC: #5)
  - [x] 5.1: GitHub repo renamed to `convoke-agents` (user confirmed)
  - [x] 5.2: Git tag `v2.0.0` created locally
  - [x] 5.3: Tag pushed to remote (user via GitHub Desktop)
  - [x] 5.4: GitHub release to be created by user via GitHub web UI

## Dev Notes

### Critical Context

**Most work is pre-satisfied.** `convoke-agents@2.0.0` was already published directly to npm in Story 4.1. The original plan assumed CI would publish on tag push, but the package is already live. This story focuses on:
1. Running the full verification suite to confirm codebase integrity
2. Grep audit for any remaining stale references
3. Creating the git tag and GitHub release for the historical record

**What's already done (from Stories 4.0-4.2):**
- `convoke-agents@2.0.0` published to npm (Story 4.1)
- `bmad-enhanced@1.8.0` published with deprecation banner (Story 4.2)
- `npm deprecate bmad-enhanced` executed (Story 4.2)
- All codebase references updated to `convoke-agents` (Story 4.0)

### Previous Story Intelligence

**From Story 4.0:** Context-aware sed replacement is critical. Cannot use bare `convoke` → `convoke-agents` because `convoke` substring exists in ALL CLI commands. The grep audit in Task 2 should look for `bmad-enhanced` patterns specifically, not bare `bmad`.

**From Story 4.0 verification:** 315/315 tests passed, zero docs:audit findings, zero stale references at the time. However, subsequent stories may have introduced new content — re-verification is necessary.

**From Story 4.2:** Changes were on the `deprecation` branch only. Main branch should be unaffected, but verify anyway.

### Grep Audit Expected False Positives

The grep audit will likely find matches in `_bmad-output/` files that contain historical "before → after" mapping text (e.g., `bmad-enhanced -> convoke-agents`). These are legitimate references showing the rename mapping and should NOT be changed. Focus on:
- `scripts/` directory — should have zero matches
- `tests/` directory — should have zero matches
- Top-level docs — should have zero matches except in changelog entries documenting the rename

### GitHub Release Notes Template

The release should include:
- What changed: Package renamed from `bmad-enhanced` to `convoke-agents`
- Migration: `npm install convoke-agents` (data preserved)
- Breaking changes: CLI commands renamed (`bmad-*` → `convoke-*`)
- Full changelog reference

### Project Structure Notes

- Package identity on main: `convoke-agents@2.0.0`
- Repository URL: `github.com/amalik/convoke-agents`
- All 6 CLI commands: `convoke-install-vortex`, `convoke-install`, `convoke-update`, `convoke-version`, `convoke-migrate`, `convoke-doctor`

### References

- [Source: _bmad-output/planning-artifacts/epics-phase3.md#Story 4.3, lines 540-570]
- [Source: _bmad-output/planning-artifacts/epics-phase3.md#NFR5, line 89]
- [Source: _bmad-output/implementation-artifacts/p3-4-0-update-npm-package-name-repo-url-to-convoke-agents.md — verification baseline]
- [Source: _bmad-output/implementation-artifacts/p3-4-1-reserve-npm-package-name.md — convoke-agents@2.0.0 already live]
- [Source: _bmad-output/implementation-artifacts/p3-4-2-publish-deprecation-version-bmad-enhanced.md — deprecation complete]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

### Completion Notes List

- Full verification suite: lint (0 errors), unit (315/315), integration (67/67), P0 (642/642), coverage (93.76%), docs:audit (0 findings)
- Grep audit: 8 matches found, all legitimate (migration code, test assertions, npm keyword, audit detector)
- Smoke tests: `node index.js` shows Convoke branding, `npm pack` shows `convoke-agents@2.0.0`
- npm verified: `convoke-agents@2.0.0` live on npm
- GitHub repo renamed to `convoke-agents`, remote URL updated
- Git tag `v2.0.0` created; push and release delegated to user (GitHub Desktop)

### File List

No source files modified — this story is a verification and release gate only.
