---
stepsCompleted: [design-epics, create-stories]
inputDocuments:
  - scripts/update/migrations/registry.js
  - scripts/update/lib/migration-runner.js
  - tests/unit/registry.test.js
  - README.md
  - INSTALLATION.md
  - docs/BMAD-METHOD-COMPATIBILITY.md
origin: party-mode-audit-2026-03-15
---

# Convoke P5 — Migration Chaining Fix & Doc Accuracy

## Overview

The migration system's `getMigrationsFor()` function in `registry.js` only matches migrations whose `fromVersion` pattern matches the user's **current installed version**. It does not walk the migration chain forward. This means users jumping multiple versions silently skip intermediate migrations.

**Root cause:** `matchesVersionRange()` checks if the user's version matches a migration's `fromVersion` wildcard — but never considers that after applying migration A, the version should logically advance to trigger migration B.

**Discovered:** 2026-03-15 during CLI command audit. Reproduced in clean `/tmp` test repos.

**Evidence:**
- From `1.5.2` → finds only `1.5.x-to-1.6.0`, misses `1.6.x-to-1.7.0` and `1.7.x-to-2.0.0`
- From `1.0.5` → finds only `1.0.x-to-1.3.0`, misses all 7 subsequent migrations
- From `1.1.3` → finds only `1.1.x-to-1.3.0`, misses 5 subsequent migrations

**Impact today:** `1.5.x-to-1.6.0` has real delta logic (appends Wave 3 agents/workflows to config) that is skipped for anyone upgrading from `1.0.x–1.4.x`. The `1.6.x-to-1.7.0` and `1.7.x-to-2.0.0` migrations are no-ops, so `refreshInstallation()` papers over the missing deltas — but migration history is incomplete.

**Impact future:** Any new migration with real delta logic will be silently skipped for users jumping multiple versions. This is a ticking time bomb.

**Approach (from Winston — Architect review):** Match first hop exactly (existing `matchesVersionRange` logic), then collect all subsequent hops by ascending `fromVersion`. Handle parallel entry points (e.g., `1.0.x-to-1.3.0`, `1.1.x-to-1.3.0`, `1.2.x-to-1.3.0` all target 1.3.0 from different starting points) by only picking the one that matches the user's actual version, then chaining forward. The existing `hasMigrationBeenApplied()` filter provides idempotency.

### Key Decisions

- Fix is contained entirely in `registry.js` — no changes to `migration-runner.js`
- Existing `hasMigrationBeenApplied()` filter handles idempotency (no new mechanism needed)
- Parallel entry points (multiple migrations targeting same destination from different starting versions) must be handled — only the one matching the user's actual version is the entry point
- Doc fixes are bundled in the same epic (P2 but same release)
- Historical docs (PUBLISHING-GUIDE.md, TEST-PLAN-REAL-INSTALL.md) already archived — no further changes

## Requirements Inventory

### Functional Requirements

**Migration Chaining (3):**

- FR1 [I]: `getMigrationsFor()` returns the complete ordered chain of migrations from the user's current version through all intermediate versions to the current package version
- FR2 [I]: Parallel entry points (e.g., `1.0.x-to-1.3.0`, `1.1.x-to-1.3.0`) are resolved correctly — only the migration matching the user's actual version is selected as entry point, subsequent hops chain forward
- FR3 [I]: `hasMigrationBeenApplied()` filter continues to skip already-applied migrations in the chain, so partially-completed upgrades resume correctly

**Test Coverage (3):**

- FR4 [I]: Unit tests verify chain traversal for all starting versions (`1.0.x` through `2.3.0`)
- FR5 [I]: Unit tests verify parallel entry point resolution (user at `1.1.3` gets `1.1.x-to-1.3.0` but not `1.0.x-to-1.3.0` or `1.2.x-to-1.3.0`)
- FR6 [I]: Integration test verifies full `1.0.5 → 2.3.0` update path with all deltas executing and complete migration history

**Documentation Accuracy (3):**

- FR7 [U]: README version badge matches `package.json` version
- FR8 [U]: All `npx` commands in INSTALLATION.md and BMAD-METHOD-COMPATIBILITY.md include `-p convoke-agents`
- FR9 [U]: All package name references use `convoke-agents` (not `convoke`) in BMAD-METHOD-COMPATIBILITY.md

### Non-Functional Requirements

- NFR1: Fix introduces zero behavioral changes to `migration-runner.js` — only `registry.js` is modified
- NFR2: Existing tests must continue to pass — the fix corrects assertions that were masking the bug (e.g., `assert.ok(migrations.length >= 1)` becomes exact count assertions)
- NFR3: `getBreakingChanges()` must also return the complete chain (it delegates to `getMigrationsFor()`, so this is automatic)

## FR Coverage Map

- FR1-FR3: Epic 1 (Migration Chaining Fix)
- FR4-FR6: Epic 1 (Test Coverage — atomic with fix)
- FR7-FR9: Epic 2 (Documentation Accuracy)

---

## Epic List

### Epic 1: Migration Chaining Fix & Tests

Fix `getMigrationsFor()` to walk the complete migration chain and add comprehensive test coverage proving the fix works for all version combinations.

**FRs covered:** FR1, FR2, FR3, FR4, FR5, FR6
**NFRs addressed:** NFR1 (runner unchanged), NFR2 (existing tests updated), NFR3 (breaking changes chain)
**Dependencies:** None
**Atomicity rule:** Fix and tests MUST be committed together

### Epic 2: Documentation Accuracy

Fix version badge, missing `-p convoke-agents` flags, and wrong package names across user-facing docs.

**FRs covered:** FR7, FR8, FR9
**Dependencies:** None (independent of Epic 1)

---

## Epic 1: Migration Chaining Fix & Tests

Fix `getMigrationsFor()` to walk the complete migration chain and add comprehensive test coverage.

### Story 1.1: Fix Migration Chain Traversal in registry.js

As a user upgrading from any older version to the current version,
I want the migration system to find and execute ALL intermediate migrations in order,
So that no delta logic is silently skipped when jumping multiple versions.

**Acceptance Criteria:**

**Given** a user at version `1.5.2` upgrading to `2.3.0`
**When** `getMigrationsFor('1.5.2')` is called
**Then** it returns exactly 3 migrations in order: `1.5.x-to-1.6.0`, `1.6.x-to-1.7.0`, `1.7.x-to-2.0.0`

**Given** a user at version `1.0.5` upgrading to `2.3.0`
**When** `getMigrationsFor('1.0.5')` is called
**Then** it returns the full chain: `1.0.x-to-1.3.0`, `1.3.x-to-1.5.0`, `1.5.x-to-1.6.0`, `1.6.x-to-1.7.0`, `1.7.x-to-2.0.0`
**And** it does NOT include `1.1.x-to-1.3.0`, `1.2.x-to-1.3.0`, or `1.4.x-to-1.5.0` (parallel entry points for different starting versions)

**Given** a user at version `1.3.7`
**When** `getMigrationsFor('1.3.7')` is called
**Then** it returns: `1.3.x-to-1.5.0`, `1.5.x-to-1.6.0`, `1.6.x-to-1.7.0`, `1.7.x-to-2.0.0`

**Given** a user at version `1.6.0`
**When** `getMigrationsFor('1.6.0')` is called
**Then** it returns: `1.6.x-to-1.7.0`, `1.7.x-to-2.0.0`

**Given** a user already at `2.3.0`
**When** `getMigrationsFor('2.3.0')` is called
**Then** it returns an empty array

**Implementation approach:**
1. Sort all migrations by `fromVersion` ascending
2. Find the entry-point migration that matches the user's version via `matchesVersionRange()`
3. Determine the "target minor" of that entry-point migration (parse from migration name, e.g., `1.0.x-to-1.3.0` → target is `1.3`)
4. Continue collecting migrations whose `fromVersion` matches the target of the previous hop
5. This naturally excludes parallel entry points — only the chain-linked hops are collected

**Files:** `scripts/update/migrations/registry.js`

### Story 1.2: Update and Expand Unit Tests for Chain Traversal

As a maintainer,
I want comprehensive unit tests that verify the migration chain logic for all starting versions,
So that future changes to the registry don't silently re-break chaining.

**Acceptance Criteria:**

**Given** the existing `tests/unit/registry.test.js`
**When** chain traversal tests are added
**Then** a new `describe('getMigrationsFor - chain traversal')` block exists with these cases:

| From Version | Expected Chain | Expected Count |
|-------------|---------------|----------------|
| `1.0.5` | `1.0.x-to-1.3.0` → `1.3.x-to-1.5.0` → `1.5.x-to-1.6.0` → `1.6.x-to-1.7.0` → `1.7.x-to-2.0.0` | 5 |
| `1.1.3` | `1.1.x-to-1.3.0` → `1.3.x-to-1.5.0` → `1.5.x-to-1.6.0` → `1.6.x-to-1.7.0` → `1.7.x-to-2.0.0` | 5 |
| `1.3.7` | `1.3.x-to-1.5.0` → `1.5.x-to-1.6.0` → `1.6.x-to-1.7.0` → `1.7.x-to-2.0.0` | 4 |
| `1.5.2` | `1.5.x-to-1.6.0` → `1.6.x-to-1.7.0` → `1.7.x-to-2.0.0` | 3 |
| `1.6.0` | `1.6.x-to-1.7.0` → `1.7.x-to-2.0.0` | 2 |
| `1.7.1` | `1.7.x-to-2.0.0` | 1 |
| `2.3.0` | (empty) | 0 |
| `99.0.0` | (empty) | 0 |

**And** a test verifying parallel entry point exclusion:
- `getMigrationsFor('1.1.3')` does NOT contain `1.0.x-to-1.3.0` or `1.2.x-to-1.3.0`
- `getMigrationsFor('1.4.1')` does NOT contain `1.3.x-to-1.5.0`

**And** the existing `getMigrationsFor` tests are updated — `assert.ok(migrations.length >= 1)` is replaced with exact count assertions

**And** `getBreakingChanges` tests verify the chain:
- `getBreakingChanges('1.0.5')` includes both `1.0.x-to-1.3.0` (breaking) and `1.7.x-to-2.0.0` (breaking)
- `getBreakingChanges('1.5.2')` includes `1.7.x-to-2.0.0` (breaking, reached via chain)

**And** `npm test` passes with zero failures

**Files:** `tests/unit/registry.test.js`

### Story 1.3: Integration Test — Full Multi-Version Update Path

As a maintainer,
I want an integration test that simulates a full multi-version upgrade and verifies all deltas execute with complete migration history,
So that the end-to-end update path is validated beyond unit-level chain resolution.

**Acceptance Criteria:**

**Given** a simulated project at version `1.5.2` with a config.yaml containing only Wave 1/2 agents
**When** `runMigrations('1.5.2')` is executed (not dry-run)
**Then** the `1.5.x-to-1.6.0` delta executes (Wave 3 agents appended to config)
**And** `1.6.x-to-1.7.0` delta executes (no-op)
**And** `1.7.x-to-2.0.0` delta executes (no-op)
**And** `refreshInstallation()` runs after all deltas
**And** the migration history in config.yaml lists all 3 migration names
**And** the config version is updated to the current package version

**Given** the same project is updated again immediately after
**When** `runMigrations()` is called
**Then** it reports "Already up to date" with zero migrations applied (idempotent re-run)

**Given** a simulated project at version `1.5.2` where `1.5.x-to-1.6.0` is already in migration history (interrupted previous update)
**When** `runMigrations('1.5.2')` is executed
**Then** `1.5.x-to-1.6.0` is skipped (already applied)
**And** `1.6.x-to-1.7.0` and `1.7.x-to-2.0.0` execute
**And** migration history records only the newly applied migrations

**Implementation note:** Follow existing patterns in `migration-runner.test.js` and `migration-runner-orchestration.test.js` — mock file system, config, and `refreshInstallation`.

**Files:** New test in `tests/integration/` or extend `tests/unit/migration-runner-orchestration.test.js`

### Epic 1 Verification

```bash
npm test                         # All unit tests pass
npm run test:integration         # Integration tests pass
npm run test:p0:gate             # P0 gate passes
```

**Commit rule:** Stories 1.1–1.3 are committed atomically — the fix and all tests in a single commit.

---

## Epic 2: Documentation Accuracy

Fix version badge, missing `-p convoke-agents` flags, and wrong package names across user-facing docs.

### Story 2.1: Fix README Version Badge

As a user visiting the GitHub repo,
I want the version badge to reflect the actual package version,
So that I can tell at a glance what version is current.

**Acceptance Criteria:**

**Given** the README.md version badge on line 13 shows `2.0.1`
**When** the fix is applied
**Then** the badge shows `2.3.0` (matching `package.json`)

**Files:** `README.md`

### Story 2.2: Fix npx Commands in INSTALLATION.md

As a user following troubleshooting steps,
I want all `npx` commands to include `-p convoke-agents` so they actually work,
So that I don't get "command not found" errors when following the docs.

**Acceptance Criteria:**

**Given** INSTALLATION.md line 184 contains `npx convoke-install-vortex` (missing `-p convoke-agents`)
**When** the fix is applied
**Then** it reads `npx -p convoke-agents convoke-install-vortex`
**And** all other `npx` commands in INSTALLATION.md include `-p convoke-agents` (audit full file)

**Files:** `INSTALLATION.md`

### Story 2.3: Fix Package Name and npx Commands in BMAD-METHOD-COMPATIBILITY.md

As a user following BMAD compatibility instructions,
I want correct package names and working npx commands,
So that installation and diagnostics work as documented.

**Acceptance Criteria:**

**Given** BMAD-METHOD-COMPATIBILITY.md lines 52 and 60 contain `npm install convoke`
**When** the fix is applied
**Then** they read `npm install convoke-agents`

**Given** BMAD-METHOD-COMPATIBILITY.md lines 53, 61, 129, 241, 246, 315, 349 contain `npx convoke-*` without `-p convoke-agents`
**When** the fix is applied
**Then** all `npx` commands include `-p convoke-agents`

**And** zero instances of bare `npm install convoke` (without `-agents`) remain in the file
**And** zero instances of `npx convoke-*` without `-p convoke-agents` remain in the file

**Files:** `docs/BMAD-METHOD-COMPATIBILITY.md`

### Epic 2 Verification

```bash
npm run docs:audit               # Zero findings (if applicable)
grep -n "npx convoke-" INSTALLATION.md docs/BMAD-METHOD-COMPATIBILITY.md | grep -v "\-p convoke-agents"
# Should return 0 results

grep -n "npm install convoke[^-]" docs/BMAD-METHOD-COMPATIBILITY.md
# Should return 0 results
```

---

## Sequencing & Dependencies

```
Epic 1 (Fix + Tests)  ──── start immediately (atomic commit)
Epic 2 (Documentation) ──── independent, can run in parallel
```

Both epics are independent and can be developed in parallel. Epic 1 is P1 (must ship before next publish). Epic 2 is P2 (same release, but no code risk).

## Verification

After both epics:
- `npm run test:all` → all pass, 0 fail
- Fresh install test in `/tmp` repo
- Upgrade test: set config to `1.5.2`, run `convoke-update`, verify 3 migrations in history
- Upgrade test: set config to `1.0.5`, run `convoke-update`, verify 5 migrations in history
- `convoke-doctor` passes after each upgrade test
