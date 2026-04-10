---
stepsCompleted: [step-01-validate-prerequisites, step-02-design-epics, step-03-create-stories, step-04-final-validation]
status: 'complete'
completedAt: '2026-04-05'
inputDocuments:
  - _bmad-output/planning-artifacts/prd-artifact-governance-portfolio.md
  - _bmad-output/planning-artifacts/arch-artifact-governance-portfolio.md
---

# Artifact Governance & Portfolio - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for Artifact Governance (I14) and Portfolio (P15), decomposing 50 FRs and 22 NFRs from the PRD and architecture decisions into implementable stories.

## Requirements Inventory

### Functional Requirements

FR1: Operator can define initiative IDs in taxonomy config file with platform defaults and user extensions
FR2: Operator can define artifact type IDs in the taxonomy config file
FR3: System validates taxonomy entries (lowercase alphanumeric with optional dashes, no duplicates, no collisions)
FR4: System provides frontmatter metadata schema (initiative, artifact_type, status, created, schema_version)
FR5: Operator can add new initiative IDs by appending to user section
FR6: System ships platform taxonomy defaults (vortex, gyre, bmm, forge, helm, enhance, loom, convoke)
FR7: Operator can run dry-run migration showing manifest of proposed renames and link updates
FR8: Operator can execute migration to rename all in-scope artifacts
FR9: Migration infers initiative from existing filename patterns, folder location, and content
FR10: Migration infers artifact type from existing filename patterns
FR11: Migration surfaces ambiguous files for manual resolution
FR12: Migration renames files using git mv
FR13: Migration preserves full git history, verifiable via git log --follow
FR14: Migration injects frontmatter metadata, preserving existing frontmatter
FR15: Migration scans and updates internal markdown links in .md files within _bmad-output/ only
FR16: Migration generates artifact-rename-map.md
FR17: Migration verifies git log --follow on sample of renamed files
FR18: Migration is idempotent — detects governed/half-governed/ungoverned/invalid-governed states
FR19: Operator can specify migration scope via --include CLI flag (comma-separated, replaces defaults)
FR20: Migration provides --help usage output
FR21: Migration produces new ADR superseding existing repo organization ADR
FR22: Operator can generate portfolio view (initiative, phase, status, next action, context re-entry hint)
FR23: Portfolio marks status as (explicit) or (inferred)
FR24: Portfolio displays governance health score (governed/total count)
FR25: Operator can filter portfolio by initiative prefix (glob pattern)
FR26: Portfolio supports two output formats (markdown + terminal)
FR27: Portfolio defaults to terminal from CLI, markdown from chat
FR28: Portfolio infers initiative phase from artifact presence, type, and chain analysis
FR29: Portfolio infers initiative status using two-tier model (explicit frontmatter + inferred git/activity)
FR30: Portfolio uses initiative-level status vocabulary (ongoing, blocked, paused, complete, stale, unknown)
FR31: Portfolio marks stale when no git activity within configurable threshold (default 30 days)
FR32: Portfolio produces unknown under specific conditions (no artifacts, no phase-determining artifacts)
FR33: Portfolio infers context re-entry hint from git log + artifact chain
FR34: Portfolio infers discovery completeness from Vortex HC chain (HC2→HC6)
FR35: Portfolio flags WIP overload when active count exceeds threshold (default 4)
FR36: WIP radar lists active initiatives by last-activity date
FR37: Operator can configure WIP threshold and stale-days in BMM config
FR38: Portfolio operates in degraded mode on artifacts without frontmatter
FR39: Portfolio checks for taxonomy prerequisite — error if absent, warning if no governed artifacts
FR40: convoke-update creates taxonomy config for pre-I14 installations
FR41: convoke-update merges new platform taxonomy without overwriting user extensions
FR42: convoke-update promotes user IDs to platform when they become official
FR43: convoke-doctor validates taxonomy structure, format, duplicates/collisions
FR44: bmad-create-prd emits frontmatter when creating new PRD artifacts
FR45: bmad-create-epics-and-stories emits frontmatter when creating new epic artifacts
FR46: Migration supports idempotent recovery — each commit phase independently resumable
FR47: Migration follows single interactive flow (dry-run → prompt → apply), --force for automation
FR48: Portfolio sorts alphabetically by default, --sort last-activity override
FR49: Migration creates taxonomy.yaml if not present (idempotent)
FR50: Migration excludes _bmad-output/_archive/ — archived files never modified

### NonFunctional Requirements

NFR1: Portfolio scan < 5 seconds for 200 artifacts
NFR2: Migration dry-run < 10 seconds for 200 artifacts
NFR3: Migration execution < 60 seconds for 100 files
NFR4: Migration never corrupts — skip with warning, never partial modify
NFR5: Failed commit phase → git reset --hard to last successful commit
NFR6: No false-confident inference — unknown when confidence low
NFR7: Dry-run 100% accurate — manifest matches execution
NFR8: Schema evolution via schema_version — no re-migration needed
NFR9: Taxonomy extensible without code changes
NFR10: Portfolio inference modular — new heuristic = new file
NFR11: Inference rules documented and unit-testable
NFR12: Node.js ≥18.x
NFR13: macOS, Linux, Windows. path.join() always.
NFR14: Migration must not break existing convoke-update/doctor/install
NFR15: Portfolio coexists with all existing BMAD skills
NFR16: Taxonomy parseable by standard YAML libraries
NFR17: Migration ≥80% overall coverage, 100% on inference rules
NFR18: Portfolio ≥80% overall coverage, 100% on inference heuristics
NFR19: Test fixtures for all known filename patterns
NFR20: Frontmatter injection byte-for-byte preserves content. Add fields, never overwrite. Conflicts in dry-run.
NFR21: Taxonomy changes effective immediately — no restart
NFR22: Graceful error on malformed taxonomy.yaml — clear message, no crash

### Additional Requirements (from Architecture)

- Shared lib extraction from archive.js into scripts/lib/artifact-utils.js (ADR-1)
- gray-matter dependency for frontmatter parsing (NFR20 compliance)
- JSDoc type annotations on inference contract and rule chain interfaces
- scripts/lib/types.js for shared typedefs
- Transactional two-commit migration: commit 1 = renames, commit 2 = frontmatter injection (ADR-2)
- Clean-tree safeguard: check tracked diffs + untracked files in scope before execution
- Rule chain pattern for portfolio inference with 4 rules (ADR-3)
- Portfolio engine in scripts/lib/portfolio/, not .claude/skills/ (skills can't require JS)
- Thin skill wrapper: workflow.md invokes convoke-portfolio --markdown
- Four governance states: fully-governed, half-governed, ungoverned, invalid-governed
- Greedy type matching with dash boundary (longest prefix first)
- Alias map in taxonomy.yaml for historical name resolution (migration-only)
- Ambiguity resolution via interactive prompt per file
- archive.js gains clean-tree check during shared lib extraction

### UX Design Requirements

Not applicable — CLI/chat tooling with no visual UI.

### FR Coverage Map

| FR | Epic | Description |
|----|------|-------------|
| FR1-FR6 | Epic 1 | Taxonomy & schema management |
| FR7 | Epic 2 | Dry-run migration manifest |
| FR9-FR11 | Epic 2 | Initiative + type inference, ambiguity surfacing |
| FR18 | Epic 2 | Idempotency (governance state detection) |
| FR19-FR20 | Epic 2 | CLI scope flags + --help |
| FR49-FR50 | Epic 2 | Taxonomy bootstrap + archive exclusion |
| FR8 | Epic 3 | Migration execution |
| FR12-FR17 | Epic 3 | git mv, history preservation, frontmatter injection, link updating, rename map, verification |
| FR21 | Epic 3 | ADR supersession (new ADR + existing ADR update) |
| FR46-FR47 | Epic 3 | Idempotent recovery + interactive flow |
| FR22-FR27 | Epic 4 | Portfolio view (output, formats, filtering, sorting, defaults) |
| FR28-FR34 | Epic 4 | Portfolio inference (phase, status, chain, stale, unknown, context hint) |
| FR35-FR37 | Epic 4 | WIP management |
| FR38 | Epic 4 | Degraded mode |
| FR39 | Epic 4 | Portfolio prerequisite check |
| FR48 | Epic 4 | Portfolio sort option |
| FR40-FR42 | Epic 5 | convoke-update taxonomy integration (create, merge, promote) |
| FR43 | Epic 5 | convoke-doctor taxonomy validation |
| FR44-FR45 | Epic 5 | Workflow frontmatter adoption (PRD + epics) |

**Coverage: 50/50 FRs mapped. Zero gaps.**

## Epic List

### Epic 1: Artifact Governance Foundation
Operators can name new artifacts consistently and define initiative taxonomies — the naming convention, taxonomy config, frontmatter schema, and shared library that all downstream work builds on.

**FRs covered:** FR1, FR2, FR3, FR4, FR5, FR6
**Additional:** Shared lib extraction (ADR-1), types.js, gray-matter dependency, archive.js refactor + clean-tree check
**Standalone value:** Forward-only convention. Every new artifact follows the standard from this point on.

### Epic 2: Migration Inference & Planning
Operators can preview exactly what the migration would do — see every proposed rename, link update, and ambiguous file — without modifying anything. Validates inference quality before any irreversible operations.

**FRs covered:** FR7, FR9, FR10, FR11, FR18, FR19, FR20, FR49, FR50
**Additional:** Greedy type matching, alias map, ambiguity detection with context clues, collision detection, four governance states, --include CLI flag
**Standalone value:** Dry-run manifest is reviewable and actionable. Operator sees problems before they happen.
**Depends on:** Epic 1 (shared lib + taxonomy)

### Epic 3: Migration Execution & Safety
Operators can execute the migration with full safety guarantees — transactional two-commit strategy, rollback on failure, idempotent recovery, internal link updating, git history preservation, and rename mapping.

**FRs covered:** FR8, FR12, FR13, FR14, FR15, FR16, FR17, FR21, FR46, FR47
**Additional:** Transactional pipeline (ADR-2), clean-tree safeguard, gray-matter frontmatter injection, interactive flow (dry-run → prompt → apply), --force flag, ADR generation
**Standalone value:** All in-scope artifacts migrated. Full git history preserved. Rename map generated.
**Depends on:** Epic 2 (inference engine + planning)

### Epic 4: Portfolio Intelligence
Operators can see all initiatives at a glance — phase, status, next action, context re-entry hint — with WIP overload detection, governance health tracking, and explicit/inferred transparency. Zero manual upkeep.

**FRs covered:** FR22, FR23, FR24, FR25, FR26, FR27, FR28, FR29, FR30, FR31, FR32, FR33, FR34, FR35, FR36, FR37, FR38, FR39, FR48
**Additional:** Rule chain (ADR-3), 4 inference rules, 2 formatters, degraded mode, verbose trace, portfolio engine in scripts/lib/portfolio/, thin skill wrapper
**Standalone value:** Portfolio view works immediately — degraded mode on ungoverned artifacts, full mode on governed artifacts.
**Depends on:** Epic 1 (taxonomy). Works better after Epic 3 (governed artifacts), but not required.

### Epic 5: Platform Integration & Adoption
The governance system integrates with the Convoke ecosystem — update pipeline creates taxonomy for new installs, doctor validates taxonomy health, and two workflows emit frontmatter on artifact creation.

**FRs covered:** FR40, FR41, FR42, FR43, FR44, FR45
**Additional:** convoke-update migration (create + merge + promote), convoke-doctor check, bmad-create-prd + bmad-create-epics frontmatter emission
**Standalone value:** Ecosystem stays governed over time. New installs get taxonomy. Drift is detectable.
**Depends on:** Epic 1 (taxonomy exists to validate/merge)

### Epic 6: Operator Experience & Skill Wiring
Operators interact with migration and portfolio through guided skill conversations — not raw CLI — with smarter inference that suggests defaults, batches ambiguity resolution, and explains what it can't resolve. Loom Master becomes accessible as a platform agent.

**FRs covered:** UX improvements on FR7, FR11, FR22, FR26, FR27, FR38 (no new FRs — experience layer on existing functionality)
**Additional:** Loom Master wiring (manifest + Claude Code skill), migration skill wrapper, portfolio skill wrapper, inference improvements (suggested defaults, batch resolution, collision handling, unattributed file reduction)
**Standalone value:** Operators can run migration and portfolio from conversation with guided assistance. 71% unattributed rate in portfolio eliminated. Loom Master invocable for future team/skill creation.
**Depends on:** Epics 1–5 (all shipped)

---

**Delivery order:** Epic 1 → Epic 2 → Epic 3 → Epic 4 → Epic 5 → Epic 6

---

## Epic 1: Artifact Governance Foundation

Operators can name new artifacts consistently and define initiative taxonomies — the naming convention, taxonomy config, frontmatter schema, and shared library that all downstream work builds on.

### Story 1.1: Shared Library Extraction & gray-matter

As a platform developer,
I want shared artifact utilities extracted from archive.js into a reusable library,
So that migration, portfolio, and archive tools share consistent filename parsing and frontmatter handling.

**Acceptance Criteria:**

**Given** archive.js contains parseFilename(), VALID_CATEGORIES, NAMING_PATTERN, and scanning logic
**When** the shared lib extraction is complete
**Then** scripts/lib/artifact-utils.js exports: parseFilename(), scanArtifactDirs(), parseFrontmatter(), injectFrontmatter(), ensureCleanTree()
**And** scripts/lib/types.js exports JSDoc typedefs: InitiativeState, RenameManifestEntry, LinkUpdate, TaxonomyConfig, FrontmatterSchema
**And** gray-matter is added to package.json dependencies
**And** archive.js is refactored to import from artifact-utils.js and produces identical dry-run output before and after
**And** archive.js gains ensureCleanTree() check for tracked diffs + untracked files in scope
**And** all existing archive.js tests (if any) continue to pass
**And** new unit tests cover parseFilename() with at least 5 representative filename patterns

### Story 1.2: Taxonomy Configuration

As a Convoke operator,
I want a taxonomy config file that defines initiative IDs and artifact types,
So that all governance tools share a single source of truth for naming.

**Acceptance Criteria:**

**Given** no taxonomy.yaml exists
**When** the operator creates _bmad/_config/taxonomy.yaml
**Then** the file contains initiatives.platform with 8 IDs (vortex, gyre, bmm, forge, helm, enhance, loom, convoke)
**And** the file contains initiatives.user as an empty array
**And** the file contains an aliases section for historical name resolution (strategy-perimeter → helm, strategy → helm, team-factory → loom)
**And** the file contains artifact_types with ~20 type IDs
**And** readTaxonomy() in artifact-utils.js successfully loads and parses the file
**And** taxonomy validation rejects entries with spaces, uppercase, or special characters
**And** taxonomy validation detects duplicates between platform and user sections

### Story 1.3: Frontmatter Metadata Schema

As a Convoke operator,
I want a defined frontmatter schema for artifact metadata,
So that governance tools can read and write consistent structured data in every artifact.

**Acceptance Criteria:**

**Given** the frontmatter schema v1 is defined
**When** injectFrontmatter() is called with a file and new fields
**Then** the file receives frontmatter with fields: initiative, artifact_type, created, schema_version (all required) and status (optional)
**And** schema_version is set to 1
**And** status accepts only: draft, validated, superseded, active
**And** existing frontmatter fields are preserved — new fields added, never overwritten (NFR20)
**And** content below frontmatter is preserved byte-for-byte
**And** field conflicts (e.g., existing initiative differs from new) are detected and reported, not silently resolved
**And** files with no existing frontmatter receive a new frontmatter block
**And** metadata-only files (frontmatter with empty content) are handled safely
**And** unit tests validate all edge cases including existing frontmatter, no frontmatter, metadata-only, and field conflicts

---

## Epic 2: Migration Inference & Planning

Operators can preview exactly what the migration would do — see every proposed rename, link update, and ambiguous file — without modifying anything. Validates inference quality before any irreversible operations.

### Story 2.1: Initiative Inference Engine

As a Convoke operator,
I want the migration to correctly infer which initiative owns each artifact,
So that the dry-run manifest proposes accurate renames.

**Acceptance Criteria:**

**Given** artifacts exist in planning-artifacts/, vortex-artifacts/, and gyre-artifacts/ with heterogeneous naming patterns
**When** the inference engine processes each file
**Then** it applies greedy type matching (longest artifact type prefix first, dash boundary: `type + '-'` or exact `type + '.md'`)
**And** it resolves initiatives via three-step lookup: exact taxonomy match → alias match → ambiguous
**And** `strategy-perimeter` resolves to `helm` via alias map
**And** `team-factory` resolves to `loom` via alias map
**And** files where initiative cannot be confidently inferred are marked `confidence: 'low'` with candidate list
**And** the four governance states are detected: fully-governed (name + frontmatter match), half-governed (name matches, no frontmatter), ungoverned (no match), invalid-governed (name/frontmatter conflict)
**And** unit tests cover all known filename patterns from current repository with 100% inference rule coverage (NFR17)

### Story 2.2: Dry-Run Manifest Generation

As a Convoke operator,
I want to see exactly what the migration would do before any files are touched,
So that I can review, validate, and resolve ambiguities before committing to irreversible operations.

**Acceptance Criteria:**

**Given** the inference engine has processed all in-scope files
**When** the operator runs `convoke-migrate-artifacts` (dry-run is default)
**Then** a manifest is displayed showing: old filename → proposed new filename for every file
**And** each entry shows initiative (with confidence + source) and artifact type (with confidence + source)
**And** ambiguous files show context clues: first 3 lines of content, git last author + date
**And** with `--verbose`, ambiguous files additionally show referencing files (cross-reference scan)
**And** target filename collisions are detected and flagged before any execution
**And** invalid-governed files (filename/frontmatter conflict) are flagged as "CONFLICT — resolve before migration"
**And** already-governed files are listed as "SKIP — already governed"
**And** half-governed files are listed as "INJECT ONLY — frontmatter needed"
**And** the manifest is 100% accurate — what it shows must match what execution would do (NFR7)
**And** dry-run manifest generation completes in under 10 seconds for up to 200 artifacts (NFR2)

### Story 2.3: Migration CLI & Scope Configuration

As a Convoke operator,
I want to control migration scope and get help on usage,
So that I can migrate specific directories and understand all available options.

**Acceptance Criteria:**

**Given** the migration script exists at `scripts/migrate-artifacts.js` with CLI entry at `bin/convoke-migrate-artifacts`
**When** the operator runs `convoke-migrate-artifacts --help`
**Then** usage documentation is displayed covering: dry-run (default), --force, --include, and all flags
**And** `--include planning-artifacts,vortex-artifacts,gyre-artifacts` is the default scope
**And** `--include` accepts comma-separated directory names and replaces defaults
**And** `_bmad-output/_archive/` is always excluded regardless of --include (FR50)
**And** the script creates `taxonomy.yaml` with platform defaults if not present before processing (FR49, idempotent — never overwrites existing)
**And** the script uses `findProjectRoot()` to locate the project root (never `process.cwd()`)
**And** `parseArgs()` is extracted as a function at the top of the CLI entry point (enforcement guideline)

---

## Epic 3: Migration Execution & Safety

Operators can execute the migration with full safety guarantees — transactional two-commit strategy, rollback on failure, idempotent recovery, internal link updating, git history preservation, and rename mapping.

### Story 3.1: Transactional Rename Execution (Commit 1)

As a Convoke operator,
I want all artifact renames to execute as a single atomic git commit,
So that my repository is never left in a partial rename state and git history is fully preserved.

**Acceptance Criteria:**

**Given** the operator has reviewed the dry-run manifest and confirmed via interactive prompt (or --force)
**When** the migration executes the rename phase
**Then** ensureCleanTree() verifies no tracked diffs AND no untracked files in scope directories before proceeding
**And** all renames execute via `git mv` (never `fs.renameSync`)
**And** if any `git mv` fails, all renames are rolled back via `git reset --hard HEAD` — repository returns to pre-migration state
**And** on success, a single commit is created: `chore: rename artifacts to governance convention`
**And** the commit contains only renames — zero content changes (100% git similarity for rename detection)
**And** `git log --follow` works on a sample of 5 renamed files, verifying history chain (FR17)
**And** migration execution (rename phase) completes in under 60 seconds for up to 100 files, excluding git commit time (NFR3)
**And** integration tests validate the full rename → rollback → re-run cycle using a real temp git repo

### Story 3.2: Frontmatter Injection & Link Updating (Commit 2)

As a Convoke operator,
I want frontmatter metadata injected into all renamed artifacts and internal links updated,
So that governance tools can read structured metadata and cross-references aren't broken.

**Acceptance Criteria:**

**Given** commit 1 (renames) has completed successfully
**When** the migration executes the injection phase
**Then** frontmatter is injected into every renamed file using gray-matter (initiative, artifact_type, created, schema_version: 1)
**And** existing frontmatter fields are preserved — migration adds, never overwrites (NFR20)
**And** field conflicts detected in dry-run are skipped with warning (not silently resolved)
**And** content below frontmatter is preserved byte-for-byte
**And** internal markdown links are updated for 4 patterns: `[text](filename.md)`, `[text](./filename.md)`, `[text](../dir/filename.md)`, and frontmatter `inputDocuments` arrays
**And** only `.md` files within `_bmad-output/` are scanned for links (FR15 boundary)
**And** if any write fails, the phase rolls back via `git reset --hard` to commit 1 state (renames preserved, injections discarded)
**And** on success, a single commit is created: `chore: inject frontmatter metadata and update links`
**And** unit tests validate frontmatter injection for: no existing frontmatter, existing frontmatter, metadata-only files, field conflicts
**And** unit tests validate link updating for all 4 link patterns plus edge case (link with anchor `#section`)

### Story 3.3: Interactive Flow, Recovery & Rename Map

As a Convoke operator,
I want a safe interactive migration flow with idempotent recovery and a rename map for reference,
So that I can control the process, recover from failures, and trace old filenames to new ones.

**Acceptance Criteria:**

**Given** the migration script is invoked
**When** the operator runs the migration
**Then** it follows the single interactive flow: dry-run manifest → operator review → confirmation prompt ("Apply migration? [y/n]") → execute
**And** `--force` bypasses the confirmation prompt for automation
**And** ambiguous files prompt the operator interactively: `Assign initiative for prd.md [convoke/gyre/skip]: `
**And** skipped files are excluded from migration and noted in summary
**And** `artifact-rename-map.md` is generated mapping every old filename → new filename, committed with the migration
**And** idempotent recovery works: re-running after commit 1 success + commit 2 failure detects "renames done, frontmatter pending" and resumes from commit 2 without re-executing commit 1
**And** re-running after full success detects all files as fully-governed and reports "Nothing to migrate — all files governed"
**And** summary report shows: X files renamed, Y frontmatter injected, Z links updated, W skipped

### Story 3.4: ADR Supersession

As a Convoke operator,
I want the migration to produce a new ADR documenting the governance convention and mark the old ADR as superseded,
So that the naming standard is formally documented and the old convention is clearly replaced.

**Acceptance Criteria:**

**Given** the migration has completed successfully
**When** the ADR generation step runs
**Then** a new ADR is created at `_bmad-output/planning-artifacts/adr-artifact-governance-convention-{date}.md`
**And** the new ADR documents: naming convention, taxonomy structure, frontmatter schema v1, migration scope, and relationship to previous ADR
**And** the existing ADR (`adr-repo-organization-conventions-2026-03-22.md`) has its status field updated from `ACCEPTED` to `SUPERSEDED`
**And** the existing ADR's frontmatter or header includes: `Superseded by: adr-artifact-governance-convention-{date}.md`

---

## Epic 4: Portfolio Intelligence

Operators can see all initiatives at a glance — phase, status, next action, context re-entry hint — with WIP overload detection, governance health tracking, and explicit/inferred transparency. Zero manual upkeep.

### Story 4.1: Portfolio Inference Rules

As a Convoke operator,
I want the portfolio skill to accurately infer each initiative's phase and status from existing artifacts,
So that I get trustworthy visibility without manually tracking anything.

**Acceptance Criteria:**

**Given** artifacts exist across `_bmad-output/` directories for multiple initiatives
**When** the inference rule chain executes
**Then** `frontmatter-rule.js` reads explicit status from frontmatter when present (highest priority)
**And** `artifact-chain-rule.js` infers phase using priority order: explicit frontmatter phase (overrides all) → epic with stories done = `complete` → epic + sprint = `build` → architecture doc = `planning` → HC artifacts = `discovery` → PRD/brief only = `planning` → no match = `unknown`
**And** `artifact-chain-rule.js` detects Vortex discovery completeness from HC chain (HC2→HC3→HC4→HC5→HC6) (FR34)
**And** `git-recency-rule.js` infers `ongoing` when git activity within stale_days, `stale` when beyond threshold (default 30 days, configurable via FR37)
**And** `conflict-resolver.js` resolves conflicts: explicit wins over inferred, later phases override earlier
**And** flexible epic status markers are recognized: `done`, `complete`, `✅`, `[x]`, strikethrough
**And** multiple epics for same initiative → latest modified used
**And** each rule produces the InitiativeState data structure with `value`, `source`, `confidence` fields
**And** stale detection checks current branch only (documented known limitation)
**And** unit tests achieve 100% coverage on all 4 inference rules (NFR18)
**And** test fixtures in `tests/fixtures/artifact-samples/` cover all known patterns (NFR19)

### Story 4.2: Portfolio Engine & Artifact Registry

As a Convoke operator,
I want to generate a portfolio view of all my initiatives from a single command,
So that I can see where everything stands in under 30 seconds.

**Acceptance Criteria:**

**Given** taxonomy.yaml exists and artifacts are present in `_bmad-output/`
**When** the operator runs `convoke-portfolio`
**Then** the engine scans all output directories and builds an artifact registry indexed by initiative/type/date/status
**And** for each initiative in taxonomy (platform + user), the inference rule chain executes and produces an InitiativeState
**And** the portfolio view displays: initiative name, phase, status, next action, and context re-entry hint (last artifact touched + date)
**And** each status is marked `(explicit)` or `(inferred)` for transparency (FR23)
**And** initiatives with `unknown` phase or status show `unknown (inferred)` — never a false-confident guess (NFR6)
**And** initiatives are sorted alphabetically by initiative ID by default (FR48)
**And** `--sort last-activity` overrides to sort by most recently modified
**And** the portfolio checks for taxonomy.yaml prerequisite — clear error if absent, warning if no governed artifacts found (FR39)
**And** scan completes in under 5 seconds for up to 200 artifacts (NFR1)

### Story 4.3: Degraded Mode & Governance Health

As a Convoke operator,
I want the portfolio to work on ungoverned artifacts and show me how governed my project is,
So that I get value immediately and can track my migration progress.

**Acceptance Criteria:**

**Given** a mix of governed (frontmatter) and ungoverned (no frontmatter) artifacts exist
**When** the portfolio runs
**Then** degraded mode activates for ungoverned artifacts — infers initiative from filename patterns and git recency
**And** degraded mode produces lower-fidelity results but still shows initiative, phase (if detectable), and last activity
**And** degraded results are clearly marked `(inferred)` in the output
**And** every portfolio output includes a governance health score: `Governance: X/Y artifacts governed (Z%)` (FR24)
**And** health score counts governed = filename match + valid frontmatter with initiative field
**And** when governance reaches 100%, the health score line still appears (confirmation, not nag)

### Story 4.4: WIP Radar & Filtering

As a Convoke operator,
I want to be warned when I have too many active initiatives and filter by initiative prefix,
So that I can manage overload and focus on specific workstreams.

**Acceptance Criteria:**

**Given** the portfolio view is generated
**When** the number of active initiatives (status: ongoing, blocked, or stale) exceeds the WIP threshold (default 4, configurable via `_bmad/bmm/config.yaml` portfolio.wip_threshold)
**Then** a WIP radar line appears below the portfolio table: `WIP: X active (threshold: Y) — sorted by last activity`
**And** the radar lists all active initiatives sorted by last-activity date (FR36)
**And** when threshold is not exceeded, no WIP line appears
**And** `--filter clientb-*` filters the portfolio view to show only initiatives matching the glob pattern (FR25)
**And** filtering applies before WIP count — filtered view shows WIP only for the filtered set
**And** operator can configure stale_days in `_bmad/bmm/config.yaml` portfolio.stale_days (FR37)

### Story 4.5: Output Formats & CLI Wrapper

As a Convoke operator,
I want portfolio output in both terminal and markdown formats with a verbose mode for debugging,
So that I can use it from CLI daily and embed it in documents from chat.

**Acceptance Criteria:**

**Given** the portfolio engine has produced InitiativeState data for all initiatives
**When** the operator runs `convoke-portfolio` from CLI
**Then** terminal format is default — box-drawing table with alignment and colors
**And** `--markdown` produces a standard markdown table with the same columns
**And** both formats include the WIP radar (if triggered) and governance health score below the table
**And** `--verbose` appends an inference trace per initiative showing source and confidence for every field
**And** the CLI entry point is `bin/convoke-portfolio` requiring `scripts/lib/portfolio/portfolio-engine.js`
**And** the BMAD skill wrapper at `.claude/skills/bmad-portfolio-status/workflow.md` invokes `convoke-portfolio --markdown` and presents the output
**And** default is `--terminal` from CLI, `--markdown` from chat (FR27)

---

## Epic 5: Platform Integration & Adoption

The governance system integrates with the Convoke ecosystem — update pipeline creates taxonomy for new installs, doctor validates taxonomy health, and two workflows emit frontmatter on artifact creation.

### Story 5.1: convoke-update Taxonomy Integration

As a Convoke operator upgrading from a pre-I14 installation,
I want the update pipeline to automatically create and maintain my taxonomy config,
So that governance tools work without manual setup after updating.

**Acceptance Criteria:**

**Given** a project installed before I14 (no taxonomy.yaml exists)
**When** the operator runs `convoke-update`
**Then** a new migration in `scripts/update/migrations/` creates `_bmad/_config/taxonomy.yaml` with platform defaults
**And** the migration is idempotent — if taxonomy.yaml already exists, it merges platform entries without overwriting user extensions (FR41)
**And** merge follows the same pattern as existing `config-merger.js` (seed defaults, preserve user additions)
**And** if a user initiative ID matches a new platform ID (e.g., user added `helm` before it became official), the ID is promoted from user to platform section (FR42)
**And** promotion leaves a YAML comment: `# promoted from user section on {date}`
**And** the migration integrates with the existing migration registry (append-only, same pattern as other migrations)
**And** existing `convoke-update` tests continue to pass

### Story 5.2: convoke-doctor Taxonomy Validation

As a Convoke operator,
I want `convoke-doctor` to validate my taxonomy configuration,
So that I catch malformed config, invalid IDs, and collisions before they cause problems.

**Acceptance Criteria:**

**Given** taxonomy.yaml exists at `_bmad/_config/taxonomy.yaml`
**When** the operator runs `convoke-doctor`
**Then** a new validation check verifies taxonomy file structure (initiatives.platform, initiatives.user, artifact_types, aliases sections)
**And** each initiative ID is validated: lowercase alphanumeric with optional dashes, no spaces, no special characters
**And** each artifact type is validated with the same rules
**And** duplicates between platform and user sections are detected and reported
**And** collisions between initiative IDs and artifact type IDs are detected (if any — unlikely but safeguarded)
**And** malformed YAML produces a clear, actionable error message identifying the syntax issue (NFR22)
**And** if taxonomy.yaml is missing, doctor reports: `⚠️ taxonomy.yaml not found — run convoke-migrate-artifacts or convoke-update to create`
**And** the check integrates as a new validation in the existing doctor check sequence
**And** existing `convoke-doctor` tests continue to pass

### Story 5.3: Workflow Frontmatter Adoption

As a Convoke operator creating new PRDs or epics,
I want the creation workflows to automatically include governance frontmatter,
So that new artifacts are governed from birth without manual metadata entry.

**Acceptance Criteria:**

**Given** taxonomy.yaml exists and the operator runs `bmad-create-prd` or `bmad-create-epics-and-stories`
**When** the workflow creates a new output artifact
**Then** `bmad-create-prd` emits frontmatter with: initiative (prompted or inferred from context), artifact_type: `prd`, status: `draft`, created: current date, schema_version: 1 (FR44)
**And** `bmad-create-epics-and-stories` emits frontmatter with: initiative (prompted or inferred), artifact_type: `epic`, status: `draft`, created: current date, schema_version: 1 (FR45)
**And** if taxonomy.yaml is not found, the workflow proceeds normally without frontmatter emission (graceful degradation — don't break existing workflows)
**And** if the initiative cannot be inferred from context, the workflow prompts the operator: `Which initiative is this for? [{list from taxonomy}]: `
**And** emitted frontmatter follows the schema v1 exactly as defined in Epic 1 Story 1.3
**And** existing workflow functionality is unaffected — frontmatter is additive, not disruptive

---

## Epic 6: Operator Experience & Skill Wiring

Operators interact with migration and portfolio through guided skill conversations — not raw CLI — with smarter inference that suggests defaults, batches ambiguity resolution, and explains what it can't resolve. Loom Master becomes accessible as a platform agent.

### Story 6.1: Wire Loom Master Agent

As a Convoke contributor,
I want the Loom Master agent to be accessible from conversation,
So that I can invoke the team factory for creating teams, agents, and skills.

**Acceptance Criteria:**

**Given** the Loom Master agent file exists at `_bmad/bme/_team-factory/agents/team-factory.md`
**When** the wiring is complete
**Then** `_bmad/_config/agent-manifest.csv` contains a complete entry for team-factory with all required fields (name, displayName, title, icon, role, identity, communicationStyle, principles, module, path, canonicalId)
**And** a Claude Code skill exists at `.claude/skills/bmad-agent-loom/` following the standard agent skill pattern (matching `bmad-agent-architect`, `bmad-agent-analyst`, etc.)
**And** the skill loads the Loom Master persona and presents the agent menu on activation
**And** party mode can load the Loom Master personality from the manifest
**And** existing agent skills continue to work unchanged

### Story 6.2: Migration Inference Improvements

As a Convoke operator,
I want the migration engine to suggest defaults for ambiguous files and handle collisions gracefully,
So that I'm guided through resolution instead of facing a wall of "ACTION REQUIRED" items.

**Acceptance Criteria:**

**Given** the migration dry-run encounters ambiguous files (initiative cannot be confidently inferred)
**When** the manifest is displayed
**Then** each ambiguous file shows a suggested default initiative based on: folder location heuristic (planning-artifacts → `convoke` when no other signal), content-based inference (title/header keywords matching initiative names), and git context
**And** suggestions are marked `(suggested)` with confidence level to distinguish from high-confidence inferences
**And** filename collisions include guidance: show both source files and suggest a differentiator suffix
**And** files previously classified as "cannot infer type or initiative" attempt content-based fallback before giving up
**And** the ambiguity rate on the current repository drops from 31/73 (42%) to under 10/73 (14%)
**And** all existing inference tests continue to pass
**And** new tests cover suggested defaults, collision guidance, and content-based fallback

### Story 6.3: Portfolio Attribution Improvements

As a Convoke operator,
I want the portfolio to attribute more files and explain what it can't resolve,
So that I get complete visibility instead of 71% of files being silently dropped.

**Acceptance Criteria:**

**Given** the portfolio engine scans `_bmad-output/` directories
**When** a file cannot be attributed to an initiative
**Then** the engine attempts content-based fallback: reads first 5 lines for initiative keywords, checks frontmatter for any initiative-like fields, checks parent directory name
**And** the unattributed rate on the current repository drops from 108/151 (71%) to under 20/151 (13%)
**And** the portfolio summary includes an `Unattributed` section listing files that couldn't be placed, with a one-line reason per file (e.g., "no initiative signal in filename or content")
**And** next action suggestions are context-aware: if artifacts exist but are unattributed, suggest "Run migration to govern artifacts" instead of generic "Create PRD or brief"
**And** initiatives with `unknown` phase show what artifacts were found but couldn't determine phase from (e.g., "3 artifacts found, none match phase heuristics")
**And** all existing portfolio tests continue to pass
**And** new tests cover content-based fallback, unattributed reporting, and context-aware next actions

### Story 6.4: Migration Skill Wrapper

As a Convoke operator,
I want to run artifact migration through a guided skill conversation,
So that I get the same conversational experience as every other Convoke workflow.

**Acceptance Criteria:**

**Given** the operator invokes the migration skill
**When** the skill activates
**Then** a proper skill exists at `.claude/skills/bmad-migrate-artifacts/` with SKILL.md, workflow.md, and step files following the standard skill anatomy
**And** Step 1 (Scope): presents default directories, lets operator adjust scope, explains what will be scanned
**And** Step 2 (Dry-run Review): runs the engine, presents results grouped by category (clean renames, suggested resolutions, ambiguous, collisions) — not a flat wall
**And** Step 3 (Resolve): walks through ambiguous files conversationally, offers batch resolution ("assign all remaining planning-artifacts to `convoke`"), shows suggestions from Story 6.2
**And** Step 4 (Confirm & Execute): summarizes final plan, confirms, executes migration, reports results
**And** each step updates frontmatter `stepsCompleted[]` for resumability
**And** the skill invokes the Node engine (`scripts/migrate-artifacts.js`) for all computation — skill handles conversation only

### Story 6.5: Portfolio Skill Wrapper

As a Convoke operator,
I want to view the portfolio through a guided skill conversation,
So that I get contextual explanations and can interactively explore my initiatives.

**Acceptance Criteria:**

**Given** the operator invokes the portfolio skill
**When** the skill activates
**Then** the existing skill at `.claude/skills/bmad-portfolio-status/` is upgraded from 5-line wrapper to proper skill with SKILL.md, workflow.md, and step files
**And** Step 1 (Scan & Present): runs the engine, presents the portfolio table with governance health score
**And** Step 2 (Explain & Explore): offers to explain any initiative's status, filter by prefix, sort by activity, or show verbose inference trace
**And** Step 3 (Recommend): if WIP radar triggers, highlights overload; if governance is low, suggests running migration; if stale initiatives exist, suggests review
**And** the skill invokes the Node engine (`scripts/lib/portfolio/portfolio-engine.js`) for all computation — skill handles presentation and interaction only
**And** markdown format is default when invoked from skill (chat context), terminal format when invoked from CLI

### Story 6.6: Skill Registration & Wiring

As a Convoke platform developer,
I want the new and updated skills properly registered in all integration surfaces,
So that they are discoverable, installable, and validated by the platform.

**Acceptance Criteria:**

**Given** Stories 6.1, 6.4, and 6.5 have produced new/updated skill files
**When** the wiring is complete
**Then** `refresh-installation.js` registers the new skill files for installation
**And** `validator.js` includes validation rules for the new skills (file existence, required structure)
**And** `module-help.csv` entries exist for migration and portfolio skills so they appear in help/discovery
**And** `convoke-doctor` passes with the new skills installed
**And** `convoke-install` correctly copies the new skill files to target projects
**And** all existing installation, validation, and doctor tests continue to pass
