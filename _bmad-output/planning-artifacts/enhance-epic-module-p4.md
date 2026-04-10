---
stepsCompleted: [step-01-validate-prerequisites, step-02-design-epics, step-03-create-stories, step-04-final-validation]
inputDocuments:
  - _bmad-output/planning-artifacts/prd-p4-enhance-module.md
  - _bmad-output/planning-artifacts/P4-enhance-module-architecture.md
  - _bmad-output/planning-artifacts/implementation-readiness-report-2026-03-15.md
---

# P4: Enhance Module — Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for the P4 Enhance Module initiative, decomposing the requirements from the PRD and Architecture into implementable stories. The Enhance module (`_bmad/bme/_enhance/`) adds capability upgrades to existing BMAD agents. First enhancement: RICE Initiatives Backlog workflow for John PM.

**Pre-implementation spike: DONE** — `<item exec="...">` is fully supported in BMAD core. No fallback needed.

## Requirements Inventory

### Functional Requirements

#### Finding Extraction & Classification (FR1–FR10)
- FR1: Product Owner can submit any text input (review transcript, meeting notes, markdown) to Triage mode for finding extraction
- FR2: The workflow can extract actionable findings from unstructured text input, where actionable = proposes a change, identifies a gap, or flags a risk
- FR3: The workflow can classify each extracted finding into a backlog category
- FR4: The workflow can identify the source reference for each finding (which part of the input it came from)
- FR5: The workflow can detect potential overlaps between extracted findings and existing backlog items, presenting them with the matching item's title and ID
- FR6: Product Owner can resolve overlap flags by choosing merge, skip, or add-as-new for each flagged finding
- FR7: Product Owner can escalate observations to actionable status during Gate 1 validation
- FR8: Product Owner can add findings the workflow missed during Gate 1 validation
- FR9: Product Owner can remove findings from the extraction batch during Gate 1 validation
- FR10: The workflow can report zero actionable findings gracefully, with an escape hatch for user-directed re-examination of specific passages

#### RICE Scoring & Prioritization (FR11–FR17)
- FR11: The workflow can propose RICE scores (Reach, Impact, Confidence, Effort) for each confirmed finding in batch
- FR12: The workflow can present each score with a one-line rationale explaining the scoring basis
- FR13: Product Owner can adjust individual RICE component scores by item number without re-reviewing the full batch
- FR14: Product Owner can drop items from the scoring batch during Gate 2 without returning to Gate 1
- FR15: The workflow can calculate composite RICE scores per the formula in Template Requirements and sort by descending score with tiebreaking (Confidence first, then insertion order)
- FR16: The workflow can load and reference the RICE scoring guide template during scoring for consistent calibration
- FR17: The workflow can produce scores conforming to the range derived from the scoring guide's defined RICE component scales and composite formula (R × I × C ÷ E)

#### Backlog Management (FR18–FR25)
- FR18: Product Owner's existing backlog content is preserved when the workflow appends new items, including items added manually between sessions
- FR19: The workflow can append new items to the correct category section of the backlog, identified by section heading
- FR20: The workflow can regenerate the prioritized view table with all items (existing + new) sorted by composite score
- FR21: The workflow can add provenance tags to new items ("Added from [source], [date]")
- FR22: The workflow can add rescore provenance to changed items in Review mode ("Rescored [old]→[new], Review, [date]")
- FR23: The workflow can add changelog entries in the correct format (table with Date and Change columns, newest first)
- FR24: The workflow can validate structural format of the backlog file before writing (section headings, table columns, changelog section)
- FR25: Product Owner can proceed or abort when pre-write validation detects a structural mismatch

#### Mode Management (FR26–FR33)
- FR26: Product Owner can select between Triage, Review, and Create modes from a single entry point with mode descriptions
- FR27: The workflow can present a completion summary after each mode showing items added/merged/changed and new top 3 positions
- FR28: Product Owner can return to the T/R/C menu after any mode completes
- FR29: Product Owner can exit the workflow from the T/R/C menu
- FR30: The workflow can load the existing backlog for Review mode and walk through items for rescoring
- FR31: Product Owner can change or confirm the score for each item during Review mode walkthrough
- FR32: The workflow can initialize a new backlog file in Create mode
- FR33: Product Owner can provide initiatives interactively during Create mode gathering phase

#### Installation & Activation (FR34–FR42)
- FR34: The installer can copy the `_enhance/` directory tree to a target project
- FR35: The installer can add an `<item>` tag to the target agent file at the correct anchor point
- FR36: The installer can detect an existing `<item>` tag by name attribute and skip if present
- FR37a: The installer can fail-fast with a clear error if the target agent file is missing
- FR37b: The installer can fail-fast with a clear error if the target agent file's menu structure is unrecognized
- FR38: The installer can read `config.yaml` to discover registered workflows and their target agents
- FR39: The installer can perform the 5-point verification defined in Installer Integration Requirements
- FR40: The installer can report all verification failures in a single run (not fail-on-first)
- FR41: The installer can produce identical results when run twice (idempotency)
- FR42: Product Owner can disable an enhancement by removing the `<item>` tag (temporary) or removing the workflow from config.yaml (permanent)

#### Pattern Documentation (FR43–FR44)
- FR43: A module author can read ENHANCE-GUIDE.md to understand: directory structure, workflow creation, agent menu patching, config registration, and validation
- FR44: The installer can discover and deploy enhancement workflows based on config.yaml entries

#### Cross-Cutting Capabilities (FR45–FR49)
- FR45: The workflow can load and reference the backlog format spec template during file operations for consistent output formatting
- FR46: The workflow processes the complete input text regardless of length without truncation
- FR47: Product Owner can skip items during Review mode walkthrough without rescoring them
- FR48: Product Owner can view an item's current provenance before deciding to rescore in Review mode
- FR49: The installer fails fast with a clear error if config.yaml is missing or unparseable

#### v6.1.0 Skill Registration (FR50–FR52)
- FR50: The installer can generate a `.claude/skills/` wrapper directory for each Enhance workflow (BMAD v6.1.0 skill pattern)
- FR51: The installer can add an entry to `workflow-manifest.csv` for each Enhance workflow
- FR52: The installer can add an entry to `skill-manifest.csv` for each Enhance workflow skill

**Total FRs: 52** (FR37 split into FR37a/FR37b)

### NonFunctional Requirements

#### Data Integrity (NFR1–NFR3)
- NFR1: Never delete, overwrite, or reorder existing backlog category section content during any write operation (prioritized view excluded — regenerated per FR20)
- NFR2: Pre-write format validation must detect mismatches in: section heading anchors, prioritized view table column count, changelog section existence
- NFR3: Backlog file must remain parseable by the workflow on next load and manually editable in any text editor after every operation

#### Installer Reliability (NFR4–NFR5)
- NFR4: Installer operations must be idempotent — running twice produces no changes detectable by `git diff` (scoped to installer-managed files)
- NFR5: All installer failures displayed via stdout with: what failed, why, what to do next

#### Content Portability (NFR6)
- NFR6: All workflow output must be standard markdown — no proprietary extensions, HTML embeds, or tool-specific syntax

#### Backward Compatibility (NFR7a–NFR7b)
- NFR7a: Installing Enhance must not alter behavior of existing BMAD agents when enhancement is not invoked
- NFR7b: Removing the `<item>` tag must fully disable the enhancement with no residual effects

#### Workflow Integrity (NFR8)
- NFR8: All step file frontmatter references must resolve to existing files at install time — `verifyInstallation()` walks the step chain confirming every referenced file exists

#### v6.1.0 Registration Compliance (NFR9)
- NFR9: Skill wrapper, workflow-manifest entry, and skill-manifest entry must be idempotent — no duplicates on repeated runs

**Total NFRs: 10** (NFR7 split into NFR7a/NFR7b)

### Additional Requirements

From Architecture document:

- **Directory structure:** `_bmad/bme/_enhance/` with config.yaml, extensions/, workflows/initiatives-backlog/ (steps-t/, steps-r/, steps-c/, templates/), guides/
- **Agent attachment:** Add `<item cmd="IB or fuzzy match on initiatives-backlog" exec="...">` to `_bmad/bmm/agents/pm.md` with 📦 prefix and "(Convoke Enhance)" suffix
- **Config schema:** `name`, `version`, `description`, `workflows[]` with `name/entry/target_agent/menu_patch_name`
- **RICE scoring engine:** 4-factor guided questions (Reach 1-10, Impact 0.25-3, Confidence 20-100%, Effort 1-10), Score = (R×I×C)/E
- **Step file architecture:** Triage 4 steps (ingest→extract→score→update), Review 3 steps (load→rescore→update), Create 4 steps (init→gather→score→prioritize)
- **Template files:** `rice-scoring-guide.md` (RICE methodology reference) + `backlog-format-spec.md` (heading structure, table columns, changelog format)
- **Extension documentation:** `bmm-pm.yaml` in extensions/ documents the menu patch for future dynamic extension
- **Constraint:** Max 2-3 Enhance menu items per agent to prevent menu bloat
- **Constraint:** Enhance workflows must work if target agent is updated upstream (no tight coupling)
- **Brownfield context:** Integrates with existing `refreshInstallation()` pipeline, `verifyInstallation()`, and `pm.md` agent file
- **5 ADRs:** Single install, verify workflow entry point, explicit T/R/C menu, no mode switching, shared RICE guide

### UX Design Requirements

Not applicable — P4 is a CLI workflow with no visual UI component. The step files serve as the UX specification.

### FR Coverage Map

| FR | Epic | Story (implied) | Description |
|----|------|-----------------|-------------|
| FR1 | 1 | 1.4 | Submit text input to Triage |
| FR2 | 1 | 1.4 | Extract actionable findings |
| FR3 | 1 | 1.4 | Classify findings into categories |
| FR4 | 1 | 1.4 | Identify source references |
| FR5 | 1 | 1.4 | Detect overlaps with existing items |
| FR6 | 1 | 1.4 | Resolve overlap flags (merge/skip/add) |
| FR7 | 1 | 1.4 | Escalate observations at Gate 1 |
| FR8 | 1 | 1.4 | Add missed findings at Gate 1 |
| FR9 | 1 | 1.4 | Remove findings at Gate 1 |
| FR10 | 1 | 1.4 | Zero findings graceful handling |
| FR11 | 1 | 1.5 | Propose RICE scores in batch |
| FR12 | 1 | 1.5 | One-line scoring rationale |
| FR13 | 1 | 1.5 | Adjust scores by item number |
| FR14 | 1 | 1.5 | Drop items at Gate 2 |
| FR15 | 1 | 1.5 | Calculate composite RICE + sort |
| FR16 | 1 | 1.1 | Load RICE scoring guide template |
| FR17 | 1 | 1.5 | Score range conformance |
| FR18 | 1 | 1.6 | Preserve existing backlog content |
| FR19 | 1 | 1.6 | Append to correct category section |
| FR20 | 1 | 1.6 | Regenerate prioritized view |
| FR21 | 1 | 1.6 | Provenance tags for new items |
| FR22 | 2 | 2.1 | Rescore provenance for Review mode |
| FR23 | 1 | 1.6 | Changelog entries |
| FR24 | 1 | 1.6 | Pre-write format validation |
| FR25 | 1 | 1.6 | Proceed/abort on validation mismatch |
| FR26 | 1 | 1.3 | T/R/C mode selection menu |
| FR27 | 1 | 1.6 | Completion summary (shared — reused by Epics 2 & 3) |
| FR28 | 1 | 1.3 | Return to T/R/C menu |
| FR29 | 1 | 1.3 | Exit workflow |
| FR30 | 2 | 2.1 | Load backlog for Review walkthrough |
| FR31 | 2 | 2.1 | Change/confirm score per item |
| FR32 | 3 | 3.1 | Initialize new backlog (Create mode) |
| FR33 | 3 | 3.1 | Interactive initiative gathering |
| FR34 | 1 | 1.2 | Copy _enhance/ directory tree |
| FR35 | 1 | 1.2 | Add `<item>` tag to target agent |
| FR36 | 1 | 1.2 | Detect existing tag, skip if present |
| FR37a | 1 | 1.2 | Fail-fast: target agent missing |
| FR37b | 1 | 1.2 | Fail-fast: menu structure unrecognized |
| FR38 | 1 | 1.2 | Read config.yaml for discovery |
| FR39 | 1 | 1.2 | 5-point verification |
| FR40 | 1 | 1.2 | Report all failures (not fail-on-first) |
| FR41 | 1 | 1.2 | Idempotency |
| FR42 | 1 | 1.2 | Disable enhancement |
| FR43 | 3 | 3.2 | ENHANCE-GUIDE.md |
| FR44 | 1 | 1.2 | Config-driven workflow discovery |
| FR45 | 1 | 1.1 | Load backlog format spec template |
| FR46 | 1 | 1.4 | Process full input without truncation |
| FR47 | 2 | 2.1 | Skip items in Review walkthrough |
| FR48 | 2 | 2.1 | View provenance before rescoring |
| FR49 | 1 | 1.2 | Fail-fast: config.yaml missing/unparseable |
| FR50 | 1 | 1.2a | Generate `.claude/skills/` wrapper for Enhance workflows |
| FR51 | 1 | 1.2a | Add workflow-manifest.csv entry |
| FR52 | 1 | 1.2a | Add skill-manifest.csv entry |

**Coverage: 52/52 FRs mapped (100%)**

### NFR Coverage Map

| NFR | Epic | Story (implied) | Description |
|-----|------|-----------------|-------------|
| NFR1 | 1 | 1.6 | No deletion/reorder of existing content |
| NFR2 | 1 | 1.6 | Pre-write format validation checks |
| NFR3 | 1 | 1.6 | Round-trip parseable + manually editable |
| NFR4 | 1 | 1.2 | Installer idempotency |
| NFR5 | 1 | 1.2 | Clear installer failure messages |
| NFR6 | 1 | 1.6 | Standard markdown output |
| NFR7a | 1 | 1.2 | No behavior change when not invoked |
| NFR7b | 1 | 1.2 | Clean disable on tag removal |
| NFR8 | 1 | 1.2 | Step chain file resolution at install |
| NFR9 | 1 | 1.2a | Skill/manifest registration idempotency |

**Coverage: 10/10 NFRs mapped (100%)**

## Epic List

### Epic 1: Install & Triage Review Findings into Scored Backlog
Product Owner can install the Enhance module, activate it in John PM's menu, and immediately triage review findings into RICE-scored backlog items with two-gate validation. This is the critical path — from `npm install` to a scored backlog entry.
**FRs covered:** FR1–FR21, FR23–FR29, FR34–FR42, FR44–FR46, FR49–FR52 (45 FRs)
**NFRs covered:** NFR1–NFR9 (all 10)
**Stories:** 7 (dependency chain: 1.1 → 1.2 → 1.2a → 1.3 → 1.4 → 1.5 → 1.6)

### Epic 2: Review Mode — Rescore Existing Backlog Items
Product Owner can walk through existing backlog items, view their current provenance, and rescore them with updated RICE assessments to prevent score drift. Reuses mode shell, templates, and backlog management from Epic 1.
**FRs covered:** FR22, FR30–FR31, FR47–FR48 (5 FRs)
**Stories:** 1 (plugs into mode shell from Epic 1)

### Epic 3: Create Mode & Pattern Documentation
Product Owner can bootstrap a new RICE-scored backlog from scratch. Module authors can create new enhancements using ENHANCE-GUIDE.md. Reuses mode shell and templates from Epic 1.
**FRs covered:** FR32–FR33, FR43 (3 FRs)
**Stories:** 2 (3.1: Create mode workflow, 3.2: ENHANCE-GUIDE.md)

**Design notes from party mode review:**
- FR27 (completion summary) is a shared capability — first implemented in Epic 1 Story 1.6, reused by Epics 2 & 3
- Mode management shell (Story 1.3) shows all 3 modes from day one — Review and Create display "coming soon" until their epics ship
- Implementation order within Epic 1: templates → installer → v6.1.0 registration → mode shell → extraction → scoring → backlog update

## Epic 1: Install & Triage Review Findings into Scored Backlog

Product Owner can install the Enhance module, activate it in John PM's menu, and immediately triage review findings into RICE-scored backlog items with two-gate validation. This is the critical path — from `npm install` to a scored backlog entry.

### Story 1.1: Create Enhance Module Directory Structure & Templates

As a developer implementing the Enhance module,
I want the directory structure, config.yaml, and template files created,
So that the installer and workflow have the foundation they need to operate.

**Acceptance Criteria:**

**Given** the Convoke source repository
**When** the Enhance module files are created
**Then** the following structure exists:
- `_bmad/bme/_enhance/config.yaml` with fields: name, version, description, workflows[]
- `_bmad/bme/_enhance/extensions/bmm-pm.yaml` documenting the menu patch
- `_bmad/bme/_enhance/workflows/initiatives-backlog/workflow.md` (entry point)
- `_bmad/bme/_enhance/workflows/initiatives-backlog/templates/rice-scoring-guide.md`
- `_bmad/bme/_enhance/workflows/initiatives-backlog/templates/backlog-format-spec.md`
- `_bmad/bme/_enhance/workflows/initiatives-backlog/steps-t/` (empty — content authored in subsequent stories)
- `_bmad/bme/_enhance/workflows/initiatives-backlog/steps-r/` (empty — content authored in subsequent stories)
- `_bmad/bme/_enhance/workflows/initiatives-backlog/steps-c/` (empty — content authored in subsequent stories)
**And** `config.yaml` contains one workflow entry: name=initiatives-backlog, entry=workflows/initiatives-backlog/workflow.md, target_agent=bmm/agents/pm.md, menu_patch_name=initiatives-backlog
**And** `rice-scoring-guide.md` contains RICE factor definitions, scale ranges (R:1-10, I:0.25-3, C:20-100%, E:1-10), composite formula (R×I×C÷E), calibration examples, and scoring guidance consistent with the existing backlog's scoring convention (FR16, FR17)
**And** `backlog-format-spec.md` contains exact heading structure, table columns for prioritized view, changelog entry format, insertion rules, provenance tag format, and RICE composite formula with sort order (FR45)

### Story 1.2: Installer Integration — File Copy, Menu Patch & Verification

As a Product Owner,
I want to install the Enhance module via the standard `convoke-install-vortex` command,
So that the initiatives-backlog workflow is activated in John PM's menu without manual setup.

**Acceptance Criteria:**

**Given** a target project with BMM module installed (pm.md exists)
**When** the installer runs `refreshInstallation()`
**Then** the `_bmad/bme/_enhance/` directory tree is copied to the target project (FR34)
**And** an `<item cmd="IB or fuzzy match on initiatives-backlog" exec="...">` tag is added before `</menu>` in pm.md (FR35)
**And** the tag uses 📦 prefix and "(Convoke Enhance)" suffix per architecture convention

**Given** the `<item>` tag already exists in pm.md (matching name attribute)
**When** the installer runs again
**Then** the tag is not duplicated — skip silently (FR36, FR41, NFR4)

**Given** pm.md does not exist in the target project
**When** the installer runs
**Then** it fails fast with: "pm.md not found — BMM module must be installed first" (FR37a, NFR5)

**Given** pm.md has no `</menu>` tag but has existing `<item>` tags
**When** the installer runs
**Then** it inserts the new `<item>` tag after the last existing `<item>` tag (fallback anchor)

**Given** pm.md exists but has no `</menu>` tag and no `<item>` tags
**When** the installer runs
**Then** it fails fast with: "pm.md menu structure not recognized — manual patch required" (FR37b, NFR5)

**Given** `config.yaml` is missing or unparseable
**When** the installer runs
**Then** it fails fast with a clear error stating what failed and what to do next (FR49, NFR5)

**Given** the installer reads `config.yaml`
**When** it discovers registered workflows
**Then** it uses the `workflows[]` entries to determine what to install and where (FR38, FR44)

**Given** installation completes
**When** `verifyInstallation()` runs
**Then** it confirms all 5 points: (1) enhance directory exists, (2) workflow entry point resolves, (3) menu patch present in pm.md, (4) config.yaml valid, (5) config-to-filesystem consistency (FR39)
**And** all failures are reported in a single run, not fail-on-first (FR40)

**Given** a Product Owner manually removes the `<item>` tag from pm.md
**When** they invoke John PM
**Then** the agent works identically to pre-Enhance John PM — no errors, no residual effects (FR42, NFR7a, NFR7b)

**Given** verification runs
**When** it walks the step chain from workflow.md entry point
**Then** every frontmatter file reference (nextStepFile, outputFile, template paths) resolves to an existing file (NFR8)

**Given** the installer has already run once
**When** it runs a second time with no changes
**Then** `git diff` shows no changes to installer-managed files (NFR4)

### Story 1.2a: v6.1.0 Skill Registration — Skill Wrapper & Manifest Entries

As a developer maintaining BMAD v6.1.0 compliance,
I want the Enhance module's workflows registered in the skill system,
So that they are discoverable via `.claude/skills/` and listed in `workflow-manifest.csv` and `skill-manifest.csv`.

**Context:** BMAD v6.1.0 introduced `.claude/skills/` directory-per-skill registration, `skill-manifest.csv`, and `workflow-manifest.csv`. The P4 PRD originally deferred skill/manifest registration, but this infrastructure now exists as a core framework feature. This story brings the Enhance module into full compliance.

**Acceptance Criteria:**

**Given** the installer runs `refreshInstallation()` on a target project
**When** Enhance config.yaml is present with registered workflows
**Then** for each workflow, a `.claude/skills/bmad-enhance-{workflow-name}/SKILL.md` directory and file is generated (FR50)
**And** the SKILL.md follows the standard v6.1.0 pattern: YAML frontmatter (`name`, `description`) with a body instruction to load the workflow entry point file

**Given** the installer generates an Enhance skill wrapper
**When** the SKILL.md content is written
**Then** the `name` field matches the canonicalId pattern `bmad-enhance-{workflow-name}`
**And** the `description` field includes a user-facing trigger phrase (e.g., "Manage RICE initiatives backlog...")
**And** the body references the workflow entry point via `{project-root}` path, consistent with the `bmad-code-review` SKILL.md pattern

**Given** the installer runs `refreshInstallation()` on a target project
**When** Enhance config.yaml is present with registered workflows
**Then** an entry is appended to `workflow-manifest.csv` with: name=`{workflow-name}`, description, module=`bme`, path to workflow entry point, canonicalId=`bmad-enhance-{workflow-name}` (FR51)

**Given** the installer runs `refreshInstallation()` on a target project
**When** Enhance config.yaml is present with registered workflows
**Then** an entry is appended to `skill-manifest.csv` with: canonicalId=`bmad-enhance-{workflow-name}`, name matching canonicalId, description, module=`bme`, path to SKILL.md, install_to_bmad=`true` (FR52)

**Given** `workflow-manifest.csv` or `skill-manifest.csv` already contains an entry with matching canonicalId
**When** the installer runs again
**Then** the existing entry is not duplicated — skip silently (NFR9)

**Given** the installer generates the skill wrapper
**When** it runs in the dev environment (packageRoot === projectRoot)
**Then** it skips skill wrapper generation with a logged message (consistent with isSameRoot guard pattern from Story 1.2)

**Given** the installer has already run once (all artifacts generated)
**When** it runs a second time with no changes
**Then** `git diff` shows no changes to skill wrapper, workflow-manifest.csv, or skill-manifest.csv (NFR9)

**Given** `validateInstallation()` runs after installation
**When** Enhance module is installed
**Then** the existing 5-point verification from Story 1.2 continues to pass
**And** a 6th verification point confirms the skill wrapper exists at the expected path

**Dev Notes:**
- **Naming convention:** `bmad-enhance-{workflow-name}` (e.g., `bmad-enhance-initiatives-backlog`) — decided in cross-module party mode review (2026-03-15)
- **Activation pattern:** Dual-path — menu patch (primary, through John PM) + standalone skill (direct workflow loader). Matches BMM/CIS convention, NOT the WDS menu-only or TEA standalone-only patterns.
- **SKILL.md pattern:** Direct workflow reference (like `bmad-code-review`), NOT a dispatcher through John PM. The workflow step files are self-contained.
- **CSV idempotency (Murat):** Manifest duplicate detection MUST use exact-match on `canonicalId` column, NOT substring. `bmad-enhance` must not accidentally match `bmad-enhance-initiatives-backlog`.
- **isSameRoot guard:** Skill wrapper generation and manifest entry must be skipped in dev environment, consistent with Story 1.2 pattern.

### Story 1.3: Mode Management Shell — T/R/C Menu & Dispatch

As a Product Owner,
I want to select between Triage, Review, and Create modes from a single entry point,
So that I can choose the right workflow for my current task.

**Acceptance Criteria:**

**Given** the Product Owner selects the initiatives-backlog menu item in John PM
**When** workflow.md loads
**Then** a tri-modal menu is displayed with descriptions: [T] Triage — ingest review findings, [R] Review — rescore existing items, [C] Create — build new backlog (FR26)

**Given** Triage mode is implemented (this epic)
**When** the Product Owner selects T
**Then** the Triage step chain loads (steps-t/step-t-01-ingest.md)

**Given** Review and Create modes are not yet implemented
**When** the Product Owner selects R or C
**Then** a "Coming soon — this mode will be available in a future update" message is displayed and the menu re-presents

**Given** any mode completes its step chain
**When** the final step executes
**Then** the T/R/C menu re-presents, allowing the Product Owner to run another mode or exit (FR28)

**Given** the T/R/C menu is displayed
**When** the Product Owner selects Exit
**Then** the workflow ends gracefully and returns to the John PM agent menu (FR29)

### Story 1.4: Triage Mode — Finding Extraction & Gate 1 Validation

As a Product Owner,
I want to paste a review transcript and have the workflow extract, classify, and validate actionable findings,
So that I can convert review outputs into structured backlog candidates without manual parsing.

**Acceptance Criteria:**

**Given** the Product Owner selects Triage mode
**When** they submit text input (review transcript, meeting notes, markdown)
**Then** the workflow accepts and processes the complete input regardless of length (FR1, FR46)

**Given** text input is submitted
**When** the workflow processes it
**Then** it extracts actionable findings where actionable = proposes a change, identifies a gap, or flags a risk (FR2)
**And** each finding is classified into a backlog category (FR3)
**And** each finding includes a source reference identifying which part of the input it came from (FR4)

**Given** an existing backlog file is present
**When** findings are extracted
**Then** the workflow detects potential overlaps with existing backlog items, presenting them with the matching item's title and ID (FR5)

**Given** the extraction batch is presented (Gate 1)
**When** the Product Owner reviews it
**Then** they can resolve overlap flags by choosing merge, skip, or add-as-new for each flagged finding (FR6)
**And** they can escalate observations to actionable status (FR7)
**And** they can add findings the workflow missed (FR8)
**And** they can remove findings from the batch (FR9)

**Given** the input text contains no actionable findings
**When** extraction completes
**Then** the workflow reports zero findings gracefully with an escape hatch for re-examination of specific passages (FR10)

### Story 1.5: Triage Mode — RICE Scoring & Gate 2 Validation

As a Product Owner,
I want the workflow to propose RICE scores for confirmed findings and let me adjust them,
So that every new backlog item has a calibrated priority score before being added.

**Acceptance Criteria:**

**Given** Gate 1 validation is complete with confirmed findings
**When** the workflow enters the scoring phase
**Then** it loads the RICE scoring guide template for calibration reference (FR16)
**And** proposes RICE scores (Reach, Impact, Confidence, Effort) for each confirmed finding in batch (FR11)
**And** presents each score with a one-line rationale explaining the scoring basis (FR12)

**Given** the scoring batch is presented (Gate 2)
**When** the Product Owner reviews it
**Then** they can adjust individual RICE component scores by item number (e.g., "change #4's Confidence from 3 to 2") without re-reviewing the full batch (FR13)
**And** they can drop items from the scoring batch without returning to Gate 1 (FR14)

**Given** scores are finalized
**When** composite scores are calculated
**Then** they use the formula R × I × C ÷ E, sorted descending, ties broken by Confidence (higher first) then insertion order (newer first) (FR15)
**And** scores conform to the range derived from the scoring guide's defined scales (FR17)

### Story 1.6: Triage Mode — Backlog Update, Safety & Completion Summary

As a Product Owner,
I want scored items written safely to the backlog with provenance tracking and a completion summary,
So that the backlog is updated correctly without corrupting existing content.

**Acceptance Criteria:**

**Given** scored items are ready to write
**When** the workflow prepares to update the backlog
**Then** it validates the structural format of the backlog file: section heading anchors, prioritized view table column count, changelog section existence (FR24, NFR2)

**Given** pre-write validation detects a structural mismatch
**When** the mismatch is reported
**Then** the Product Owner can proceed or abort (FR25)

**Given** the backlog file has existing content (including items added manually between sessions)
**When** new items are appended
**Then** existing backlog category section content is preserved — no deletions, overwrites, or reordering (FR18, NFR1)
**And** new items are appended to the correct category section identified by section heading (FR19)
**And** the prioritized view table is regenerated with all items (existing + new) sorted by composite score (FR20)
**And** provenance tags are added: "Added from [source], [date]" (FR21)
**And** changelog entries are added in the correct format: table with Date and Change columns, newest first (FR23)
**And** all output is standard markdown — no proprietary extensions, HTML embeds, or tool-specific syntax (NFR6)

**Given** the backlog file is updated
**When** the next session loads it
**Then** the file remains parseable by the workflow and manually editable in any text editor (NFR3)

**Given** the backlog update completes
**When** the completion summary is presented
**Then** it shows items added/merged/changed and the new top 3 positions (FR27)
**And** the T/R/C menu re-presents (FR28)

## Epic 2: Review Mode — Rescore Existing Backlog Items

Product Owner can walk through existing backlog items, view their current provenance, and rescore them with updated RICE assessments to prevent score drift. Reuses mode shell, templates, and backlog management from Epic 1.

### Story 2.1: Review Mode — Backlog Walkthrough & Rescoring

As a Product Owner,
I want to walk through my existing backlog items, see their current scores and provenance, and rescore items where priorities have shifted,
So that the backlog stays calibrated over time and doesn't drift from reality.

**Acceptance Criteria:**

**Given** the Product Owner selects Review mode from the T/R/C menu
**When** the workflow loads
**Then** it loads the existing backlog file and the RICE scoring guide template (FR30)

**Given** the backlog is loaded
**When** the walkthrough begins
**Then** items are presented one at a time with: title, current RICE component scores, composite score, category, and current provenance (FR48)

**Given** an item is presented during walkthrough
**When** the Product Owner reviews it
**Then** they can change individual RICE component scores with updated rationale (FR31)
**Or** they can confirm the current score (FR31)
**Or** they can skip the item without rescoring (FR47)

**Given** an item's score is changed
**When** the new score is recorded
**Then** rescore provenance is added: "Rescored [old]→[new], Review, [date]" (FR22)

**Given** an item is skipped or confirmed
**When** the walkthrough continues
**Then** no provenance change is recorded for that item

**Given** the walkthrough is in progress
**When** the Product Owner indicates they want to stop early
**Then** only items already rescored are written; unvisited items remain unchanged

**Given** all items have been walked through (or the Product Owner exits early)
**When** the Review mode completes
**Then** the prioritized view table is regenerated with updated scores sorted by composite score (reuses FR20)
**And** a changelog entry is added in the correct format (reuses FR23)
**And** existing backlog content is preserved — no deletions or reordering (reuses NFR1)
**And** pre-write format validation runs before writing (reuses FR24)
**And** a completion summary shows items changed/confirmed/skipped and new top 3 positions (reuses FR27)
**And** the T/R/C menu re-presents (reuses FR28)

**Given** the mode management shell (Story 1.3) currently shows "Coming soon" for Review
**When** this story is deployed
**Then** the "Coming soon" placeholder is replaced with the Review step chain dispatch

## Epic 3: Create Mode & Pattern Documentation

Product Owner can bootstrap a new RICE-scored backlog from scratch. Module authors can create new enhancements using ENHANCE-GUIDE.md. Reuses mode shell and templates from Epic 1.

### Story 3.1: Create Mode — Bootstrap New RICE Backlog

As a Product Owner starting a new project,
I want to build a RICE-scored initiatives backlog from scratch through guided interaction,
So that I have a prioritized backlog without needing to manually create the file structure.

**Acceptance Criteria:**

**Given** the Product Owner selects Create mode from the T/R/C menu
**When** the workflow loads
**Then** it initializes a new backlog file using the backlog format spec template (FR32)
**And** loads the RICE scoring guide template for calibration reference

**Given** a backlog file already exists at the output location
**When** the Product Owner selects Create mode
**Then** the workflow warns that a file exists and asks whether to overwrite or cancel

**Given** a new backlog is initialized
**When** the gathering phase begins
**Then** the Product Owner can provide initiatives interactively — describing each initiative with title, description, and category (FR33)
**And** the workflow prompts for additional initiatives until the Product Owner indicates they are done

**Given** initiatives have been gathered
**When** the scoring phase begins
**Then** the workflow proposes RICE scores for each initiative in batch with one-line rationales (reuses FR11, FR12)
**And** the Product Owner can adjust scores by item number (reuses FR13)

**Given** scoring is finalized
**When** the backlog is written
**Then** items are placed in the correct category sections (reuses FR19)
**And** the prioritized view table is generated sorted by composite score (reuses FR20)
**And** provenance tags are added: "Added from Create mode, [date]" (reuses FR21)
**And** a changelog entry marks the initial creation (reuses FR23)
**And** all output is standard markdown (reuses NFR6)

**Given** the backlog creation completes
**When** the completion summary is presented
**Then** it shows total items created and the top 3 positions (reuses FR27)
**And** the T/R/C menu re-presents (reuses FR28)

**Given** the mode management shell (Story 1.3) currently shows "Coming soon" for Create
**When** this story is deployed
**Then** the placeholder is replaced with the Create step chain dispatch

### Story 3.2: ENHANCE-GUIDE.md — Pattern Documentation for Module Authors

As a module author,
I want comprehensive documentation on how to create new enhancements for existing BMAD agents,
So that I can extend the Enhance module with new workflows without reverse-engineering the implementation.

**Acceptance Criteria:**

**Given** ENHANCE-GUIDE.md is created at `_bmad/bme/_enhance/guides/ENHANCE-GUIDE.md`
**When** a module author reads it
**Then** it documents: (FR43)
- Directory structure conventions (`_enhance/workflows/[name]/` with steps-*/templates/)
- Workflow creation process (entry point, step file architecture, template authoring)
- Agent menu patching mechanism (`<item>` tag format, `cmd` and `exec` attributes, 📦 prefix convention)
- Config registration (adding workflow entries to `config.yaml` with name/entry/target_agent/menu_patch_name)
- Verification integration (how `verifyInstallation()` validates new workflows)

**Given** the guide references the existing initiatives-backlog workflow
**When** a module author follows it
**Then** they can create a new enhancement workflow by following the documented pattern without additional assistance

**Given** the guide covers the constraint on menu item limits
**When** a module author plans their enhancement
**Then** they understand the max 2-3 items per agent limit and the rationale (prevent menu bloat)

**Given** a developer follows the guide to register a hypothetical second workflow in config.yaml
**When** they run `verifyInstallation()`
**Then** the verification checks detect the new workflow entry and validate its filesystem paths
