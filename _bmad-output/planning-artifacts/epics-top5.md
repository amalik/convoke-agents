---
stepsCompleted: [1, 2, 3, 4]
inputDocuments:
  - _bmad-output/planning-artifacts/initiatives-backlog.md
---

# Convoke - Epic Breakdown: Top 5 Initiatives

## Overview

This document breaks down the top 5 RICE-scored initiatives from the Convoke initiatives backlog into implementation-ready stories. Source: initiatives-backlog.md (2026-03-08).

## Requirements Inventory

### Functional Requirements

- FR1: Fix the CONVOKE ASCII art banner alignment — leading spaces are inconsistent across lines, and character widths don't align properly in monospace rendering (D7)
- FR2: Fix the 7-stream Vortex diagram layout — box widths, arrow alignment, and spacing between the two rows need to render correctly in both GitHub and terminal views (D7)
- FR3: Add a problem-framing sentence above the Vortex diagram: "Most teams skip validation and build on assumptions. Vortex fixes that." or equivalent approved copy (D5)
- FR4: Surface the 22 Vortex workflow names in an accessible location — either a collapsed `<details>` block in README or a dedicated docs page (D1)
- FR5: Update all `npx convoke-*` console output messages across all JS script files to use the `npx -p convoke-agents convoke-*` pattern so users don't get "package not found" errors (U5) — 37 occurrences across 7 files: `postinstall.js`, `index.js`, `convoke-doctor.js`, `convoke-update.js`, `convoke-version.js`, `convoke-migrate.js`, `migration-runner.js`

### NonFunctional Requirements

- NFR1: Migration history must be checked before delta execution — if `convoke-update` runs twice, previously-applied migrations must not be re-executed (U1)
- NFR2: ASCII art and diagram must render correctly in GitHub markdown preview, npm page, and terminal output — monospace alignment (D7)

### Additional Requirements

- 37 `npx convoke-*` occurrences across 7 JS files need the `-p convoke-agents` prefix — all are display strings (console.log, JSDoc, fix-suggestion objects), not executable calls. Markdown files (~150 occurrences) are out of scope.
- `migration-runner.js` currently has no history check before `executeMigration()` — the check needs to happen between steps [1] (get migrations) and [4] (execute deltas)
- The 22 workflows (excluding `_deprecated`): assumption-mapping, behavior-analysis, contextualize-scope, empathy-map, experiment-design, hypothesis-engineering, lean-experiment, lean-persona, learning-card, mvp, pattern-mapping, pivot-patch-persevere, pivot-resynthesis, product-vision, production-monitoring, proof-of-concept, proof-of-value, research-convergence, signal-interpretation, user-discovery, user-interview, vortex-navigation

### FR Coverage Map

| FR/NFR | Epic | Story | Description |
|--------|------|-------|-------------|
| FR3 | Epic 1 | 1.1 | Problem-framing sentence |
| FR5 | Epic 1 | 1.2 | npx command pattern fix |
| FR1 | Epic 2 | 2.1 | ASCII banner alignment |
| FR2 | Epic 2 | 2.2 | Vortex diagram layout |
| FR4 | Epic 2 | 2.3 | Workflow list |
| NFR2 | Epic 2 | 2.1, 2.2 | Cross-platform rendering |
| NFR1 | Epic 3 | 3.1 | Migration history check |

## Epic List

### Epic 1: Quick Wins
Ship in minutes — no design decisions needed, pure execution. Two tiny changes that can be merged immediately.
**Stories:** 1.1 (D5 problem-framing sentence), 1.2 (U5 npx command fix — all 37 occurrences across 7 JS files)
**FRs covered:** FR3, FR5

### Epic 2: README Visual Polish
Visual and structural improvements to the README — requires testing across GitHub, npm, and terminal rendering. D7 split into two stories (banner + diagram) for independent shipping. D1 defaults to `<details>` block (simpler, extract to separate page later if needed).
**Stories:** 2.1 (D7a banner fix), 2.2 (D7b diagram fix), 2.3 (D1 workflow list)
**FRs covered:** FR1, FR2, FR4
**NFRs covered:** NFR2

### Epic 3: Migration Safety
Logic change in the update system — needs design, implementation, and test coverage. Acceptance criteria must include a test proving double-run safety.
**Stories:** 3.1 (U1 migration history check)
**NFRs covered:** NFR1

**Design decisions applied from elicitation:**
- Epic 1 kept as a batch despite small size — label communicates "merge immediately" priority
- D7 split into 2 stories — banner and diagram are different visual problems, can ship independently
- D1 defaults to `<details>` block in README — simpler, no new file, extract later if too long
- U1 must include test for double-run safety — safety-critical change needs coverage
- D7 stories require visual verification on GitHub rendered markdown + terminal output

## Epic 1: Quick Wins

Ship in minutes — no design decisions needed, pure execution. Two tiny changes that can be merged immediately.

### Story 1.1: Add Problem-Framing Sentence Above Vortex Diagram

As a **developer evaluating Convoke**,
I want a clear problem-framing sentence immediately above the Vortex diagram,
So that I understand the pain Vortex solves before seeing the agent map.

**Acceptance Criteria:**

**Given** the README.md Vortex section
**When** I view the rendered page on GitHub or npm
**Then** a problem-framing sentence appears directly above the 7-stream diagram code block
**And** the sentence communicates the core problem (teams skipping validation / building on assumptions)
**And** the existing problem-framing sentence is extracted from the paragraph and presented as a standalone bold line immediately before the diagram code block

### Story 1.2: Fix npx Command Pattern in All Script Files

As a **Convoke user copying CLI commands from terminal output**,
I want all `npx convoke-*` commands displayed by scripts to use the correct `npx -p convoke-agents convoke-*` pattern,
So that I can copy-paste them without getting "package not found" errors.

**Acceptance Criteria:**

**Given** 37 occurrences of `npx convoke-*` exist across 7 JS files (`postinstall.js`, `index.js`, `convoke-doctor.js`, `convoke-update.js`, `convoke-version.js`, `convoke-migrate.js`, `migration-runner.js`)
**When** any of these scripts run and display npx commands to the user
**Then** all occurrences use the `npx -p convoke-agents convoke-*` pattern
**And** `grep -r "npx convoke-" --include="*.js" . | grep -v "npx -p convoke-agents"` returns zero results (excluding node_modules)
**And** existing test suites still pass

## Epic 2: README Visual Polish

Visual and structural improvements to the README — requires testing across GitHub, npm, and terminal rendering. D7 split into two stories (banner + diagram) for independent shipping. D1 defaults to `<details>` block.

### Story 2.1: Fix CONVOKE ASCII Art Banner Alignment

As a **visitor to the Convoke GitHub page or npm listing**,
I want the CONVOKE ASCII art banner to render with consistent alignment,
So that the project looks polished and professional at first glance.

**Acceptance Criteria:**

**Given** the ASCII art banner in README.md (lines 4-9)
**When** I view it in GitHub markdown preview, npm package page, or terminal (`cat README.md`)
**Then** all 6 lines of the banner have consistent leading spaces
**And** the block characters align vertically in monospace rendering (each column lines up across all rows)
**And** the tagline "Agent teams for complex systems" is centered beneath the banner
**Verification:** Visual inspection on GitHub rendered preview and `cat README.md` in an 80-column terminal

### Story 2.2: Fix Vortex 7-Stream Diagram Layout

As a **developer reading the README**,
I want the Vortex 7-stream diagram to render with clean box alignment and arrow flow,
So that I can understand the agent loop at a glance.

**Acceptance Criteria:**

**Given** the Vortex diagram code block in README.md (lines 31-48)
**When** I view it in GitHub markdown preview, npm package page, or terminal
**Then** all 7 agent boxes have equal width
**And** horizontal arrows (`──▶`, `◀──`) align with box midpoints
**And** vertical arrows and the feedback loop path render without visual breaks
**And** the two rows (4 top, 3 bottom) are visually balanced with consistent spacing
**And** the "Start at Emma · back to any stream" label is centered beneath
**Verification:** Visual inspection on GitHub rendered preview and `cat README.md` in an 80-column terminal

### Story 2.3: Add Workflow List to README

As a **developer exploring Convoke's capabilities**,
I want to see the full list of 22 Vortex workflows in the README,
So that I can quickly assess whether Convoke covers my discovery needs.

**Acceptance Criteria:**

**Given** the README.md Vortex section
**When** I view the rendered page
**Then** a `<details>` block titled "22 Vortex Workflows" (or similar) appears below the diagram
**And** it lists all 22 workflow names (excluding `_deprecated`)
**And** the block is collapsed by default so it doesn't dominate the page
**And** each workflow name is human-readable — title-case the directory name with hyphens replaced by spaces (e.g., "assumption-mapping" → "Assumption Mapping")

## Epic 3: Migration Safety

Logic change in the update system — needs design, implementation, and test coverage.

### Story 3.1: Check Migration History Before Delta Execution

As a **Convoke maintainer running `convoke-update`**,
I want previously-applied migrations to be skipped automatically,
So that running the update command twice doesn't corrupt my installation by re-applying deltas.

**Acceptance Criteria:**

**Given** `migration-runner.js` function `runMigrations()` receives a list of migrations from `registry.getMigrationsFor(fromVersion)`
**When** the runner is about to execute migration deltas (between current steps [1] and [4])
**Then** it reads the migration history from the existing `config.yaml` *before* the refresh step (`migration_history` entries)
**And** it filters out any migration whose name already appears in the history
**And** if all migrations are already applied, it logs "No new migrations to apply" and skips to refresh

**Given** a project where `convoke-update` has already run successfully
**When** `convoke-update` is run a second time with the same version
**Then** no migration deltas are re-executed
**And** the refresh step still runs (to pick up any file changes)
**And** the command completes successfully without errors

**Given** a project with partial migration history (some deltas applied, some new)
**When** `convoke-update` runs
**Then** only the unapplied deltas execute
**And** previously-applied deltas are skipped with a log message

**Test requirement:**
**Given** a test suite for `migration-runner.js`
**When** tests are run
**Then** there is at least one test that proves double-run safety: run migrations, then run again, assert no delta `apply()` functions are called the second time
