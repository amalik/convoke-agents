---
stepsCompleted: [step-01-validate-prerequisites, step-02-design-epics]
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

{{requirements_coverage_map}}

## Epic List

{{epics_list}}
