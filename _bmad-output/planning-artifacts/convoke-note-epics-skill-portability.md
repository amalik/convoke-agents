---
stepsCompleted: [1, 2]
inputDocuments:
  - _bmad-output/planning-artifacts/vision-skill-portability.md
initiative: convoke
---

# Skill Portability & Distribution - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for the Skill Portability & Distribution initiative, decomposing the vision into implementable stories. The goal is to let consultants new to agentic tools discover and use individual Convoke/BMAD skills in any AI coding tool (Claude Code, GitHub Copilot, Cursor, Windsurf, Aider) via simple copy-paste — without installing the full framework.

## Requirements Inventory

### Functional Requirements

- FR1: The system shall classify every installed skill with a portability tier (standalone / light-deps / pipeline)
- FR2: The system shall assign each skill an intent category for discovery grouping ("I need to...")
- FR3: The system shall map each skill's dependencies (templates, configs, other skills, sidecars)
- FR4: The system shall export a Tier 1 skill into a self-contained LLM-agnostic `instructions.md` file
- FR5: The export shall strip all Claude Code-specific tool names and replace with generic verbs
- FR6: The export shall remove all framework references (`bmad-init`, manifest lookups, `Load step:` conventions)
- FR7: The export shall inline workflow steps into a single instruction flow
- FR8: The system shall provide a CLI command `convoke export <skill-name>` with options for platform and tier filtering
- FR9: The system shall generate a decision-tree catalog README from manifest + classification data
- FR10: The system shall generate a per-skill README with description, persona, tier, artifact produced, and platform install instructions
- FR11: The export output shall follow a consistent directory structure per skill (README.md, instructions.md, adapters/)
- FR12: The system shall generate platform-specific adapter wrappers for Claude Code, GitHub Copilot, and Cursor
- FR13: The system shall support Tier 2 export by inlining referenced templates and providing config defaults
- FR14: The system shall support batch export via `convoke export --all --tier 1` or `--tier 1,2`

### Non-Functional Requirements

- NFR1: A consultant new to agentic tools shall find a relevant skill in < 60 seconds via the catalog
- NFR2: A Tier 1 skill shall be installable in any supported platform in < 2 minutes (copy-paste)
- NFR3: Skill extraction time for Amalik shall drop from hours to < 5 minutes per request
- NFR4: At least 15 skills shall be available as standalone exports in the first release
- NFR5: Exported skills shall work without any BMAD runtime, config files, or npm packages
- NFR6: The canonical format shall be valid markdown readable by any LLM without special parsing
- NFR7: Platform adapters shall be thin (< 20 lines of wrapper) — all substance lives in canonical format

### Additional Requirements

- AR1: The exporter shall read skill metadata from existing `_bmad/_config/skill-manifest.csv` and `agent-manifest.csv`
- AR2: New classification metadata shall extend existing manifests (not create parallel data stores)
- AR3: The CLI command shall follow existing Convoke CLI patterns (see `scripts/` infrastructure)
- AR4: The standalone skills repository shall be a separate GitHub repo (`convoke-skills-catalog`)
- AR5: Tier 3 skills shall NOT be force-exported standalone — document prerequisites instead

### FR Coverage Map

| FR | Epic 1 | Epic 2 | Epic 3 | Epic 4 | Epic 5 |
|----|--------|--------|--------|--------|--------|
| FR1 | 1.1, 1.2 | | | | |
| FR2 | 1.1, 1.2 | | | | |
| FR3 | 1.1, 1.2 | | | | |
| FR4 | | 2.1, 2.2 | | | |
| FR5 | | 2.2 | | | |
| FR6 | | 2.2 | | | |
| FR7 | | 2.2 | | | |
| FR8 | | 2.3 | | | |
| FR9 | | | 3.1 | | |
| FR10 | | | 3.2 | | |
| FR11 | | 2.1 | | 4.1 | |
| FR12 | | | | | 5.2 |
| FR13 | | | | | 5.1 |
| FR14 | | 2.3 | | | |

## Epic List

| Epic | Title | Goal | Stories |
|------|-------|------|---------|
| 1 | Skill Classification & Metadata | Add portability metadata to all skills | 3 |
| 2 | Tier 1 Exporter (Core Engine) | Build CLI tool that exports standalone skills to LLM-agnostic format | 4 |
| 3 | Skill Catalog Generation | Auto-generate browsable intent-based catalog | 2 |
| 4 | Standalone Skills Repository | Seed public repo with exported skills — first user value | 2 |
| 5 | Tier 2 Export & Platform Adapters | Extend exporter for template-dependent skills + multi-platform | 3 |

---

## Epic 1: Skill Classification & Metadata

**Goal:** Extend existing manifest infrastructure with portability tier, intent category, and dependency data for every installed skill. This metadata is the foundation for the exporter and catalog.

### Story 1.1: Define Portability Schema

As a platform maintainer,
I want a documented schema for skill portability metadata,
So that classification is consistent and the exporter can consume it programmatically.

**Acceptance Criteria:**

**Given** the existing `skill-manifest.csv` structure
**When** the schema is defined
**Then** it includes three new fields: `tier` (enum: standalone|light-deps|pipeline), `intent` (string category), `dependencies` (semicolon-delimited list of template paths, config keys, and skill names)
**And** a schema reference document exists at `_bmad/_config/portability-schema.md` explaining each field, valid values, and examples
**And** the schema document includes the intent category taxonomy (think-through-problem, define-what-to-build, review-something, write-documentation, plan-your-work, test-your-code, discover-product-fit, assess-readiness)

### Story 1.2: Classify All Skills

As a platform maintainer,
I want every skill in the manifest classified with tier, intent, and dependencies,
So that the exporter and catalog can operate on the full skill set.

**Acceptance Criteria:**

**Given** the portability schema from Story 1.1
**When** classification is applied to `skill-manifest.csv`
**Then** every row in the manifest has non-empty values for `tier`, `intent`, and `dependencies` (dependencies may be empty string for Tier 1)
**And** all CIS agent skills, editorial reviews, adversarial review, and advanced elicitation are classified as `standalone`
**And** PRD creation, product brief, code review, TEA skills, and documentation skills are classified as `light-deps`
**And** dev story, sprint planning, WDS phases, Vortex agents, and Gyre agents are classified as `pipeline`
**And** dependencies list actual file paths relative to project root (e.g., `_bmad/bmm/templates/prd-template.md`)

### Story 1.3: Validate Classification Completeness

As a platform maintainer,
I want automated validation that every skill is classified,
So that new skills added in future releases are flagged if unclassified.

**Acceptance Criteria:**

**Given** a classified `skill-manifest.csv`
**When** a validation script (`scripts/export/validate-classification.js`) is run
**Then** it reports any skills with missing tier, intent, or dependencies fields
**And** it verifies all dependency paths resolve to existing files
**And** it exits with non-zero code if any skill is unclassified
**And** it can be invoked via `node scripts/export/validate-classification.js`

---

## Epic 2: Tier 1 Exporter (Core Engine)

**Goal:** Build the export engine that transforms standalone skills into self-contained, LLM-agnostic markdown files. Includes the CLI entry point and batch export of all Tier 1 skills.

### Story 2.1: Canonical Format Specification

As a platform maintainer,
I want a documented canonical format for exported skills,
So that all exports are consistent and any LLM can consume them.

**Acceptance Criteria:**

**Given** the vision's canonical format requirements
**When** the specification is written
**Then** a template file exists at `scripts/export/templates/canonical-template.md` with sections for: skill title, persona (name, icon, role, communication style), purpose, when to use, workflow/instructions, and output description
**And** the template contains NO Claude-specific tool names, framework references, or micro-file conventions
**And** an example exported skill (`scripts/export/templates/canonical-example.md`) demonstrates a complete Tier 1 export
**And** the per-skill output directory structure is documented: `<skill-name>/README.md`, `<skill-name>/instructions.md`

### Story 2.2: Export Engine

As a platform maintainer,
I want an export engine that reads a skill's source files and produces a canonical `instructions.md`,
So that skills can be programmatically transformed into portable format.

**Acceptance Criteria:**

**Given** a skill name that exists in the classified `skill-manifest.csv` with tier `standalone`
**When** the export engine (`scripts/export/lib/exporter.js`) processes that skill
**Then** it reads the skill's agent file from `agent-manifest.csv` to extract persona data (displayName, icon, role, identity, communicationStyle, principles)
**And** it reads the skill's workflow file and all referenced step files
**And** it inlines all step content into a single sequential instruction flow
**And** it replaces Claude-specific tool references (`Read`, `Edit`, `Write`, `Bash`, `Glob`, `Grep`) with generic verbs ("read the file at", "edit the file", "create a file", "run the command", "find files matching", "search for")
**And** it strips all `bmad-init` calls, config loading blocks, and `{var-name}` template references (replacing with inline defaults where sensible)
**And** it strips all `Load step:` / `read fully and follow:` directives (content already inlined)
**And** the output `instructions.md` is valid markdown that a human can read end-to-end without BMAD knowledge
**And** a `README.md` is generated from manifest metadata (description, persona, when-to-use, what-it-produces)

### Story 2.3: CLI Entry Point

As a platform maintainer,
I want a `convoke export` CLI command,
So that I can export skills from the command line with options for filtering and output location.

**Acceptance Criteria:**

**Given** the export engine from Story 2.2
**When** `convoke export brainstorming` is run
**Then** it produces the exported skill directory at `./exported-skills/brainstorming/` (default output path)
**And** it supports `--output <path>` to override the output directory
**And** it supports `--tier 1` to batch-export all skills of a given tier
**And** it supports `--all` to export all classified skills
**And** it supports `--dry-run` to list what would be exported without writing files
**And** it reports success/failure per skill with a summary count
**And** the command is registered in `package.json` bin as `convoke-export`
**And** running `convoke export --help` shows usage documentation

### Story 2.4: Export All Tier 1 Skills

As a platform maintainer,
I want all Tier 1 skills exported and quality-reviewed,
So that the first batch of portable skills is ready for the catalog repository.

**Acceptance Criteria:**

**Given** the CLI from Story 2.3 and all Tier 1 skills classified in the manifest
**When** `convoke export --tier 1` is run
**Then** all Tier 1 skills are exported successfully (zero failures)
**And** each exported `instructions.md` contains no Claude-specific tool names (verified by grep for `Read tool`, `Edit tool`, `Write tool`, `Bash tool`, `Glob`, `Grep tool`, `bmad-init`, `Load step:`)
**And** each exported `instructions.md` contains the full persona section (name, icon, role, style)
**And** each exported `README.md` contains skill description, persona name, and "How to use" section
**And** at least 12 skills are exported (6 CIS agents + 4 reviews + elicitation + distillator)

---

## Epic 3: Skill Catalog Generation

**Goal:** Auto-generate a browsable, intent-based catalog from manifest data so newcomers can discover skills without knowing BMAD internals.

### Story 3.1: Decision-Tree Catalog Generator

As a consultant new to agentic tools,
I want a browsable catalog organized by what I'm trying to do,
So that I can find the right skill in under 60 seconds.

**Acceptance Criteria:**

**Given** the classified `skill-manifest.csv` with tier and intent data
**When** the catalog generator (`scripts/export/lib/catalog-generator.js`) is run
**Then** it produces a `README.md` with a decision-tree structure grouped by intent category
**And** each intent category heading is phrased as "I need to..." (e.g., "I need to think through a problem")
**And** each skill entry shows: icon, persona name, one-line description, tier badge (standalone/light-deps/pipeline), and link to skill folder
**And** standalone skills are visually distinguished (e.g., marked as "Ready to use")
**And** pipeline skills show a note: "Requires full Convoke installation"
**And** the generator can be invoked via `node scripts/export/lib/catalog-generator.js --output <path>`

### Story 3.2: Per-Skill README Generation

As a consultant browsing the catalog,
I want each skill folder to have a clear README explaining what it does and how to install it,
So that I can evaluate and adopt a skill without reading the full instructions file.

**Acceptance Criteria:**

**Given** an exported skill directory with `instructions.md`
**When** the README generator runs (integrated into the export engine from 2.2)
**Then** the `README.md` contains: skill name + icon, one-paragraph description, "Who is [persona name]?" section with communication style summary, "What it produces" section, "How to use" section with per-platform install instructions (Claude Code: copy to `.claude/skills/`, Copilot: copy to `.github/`, Cursor: copy to `.cursor/rules/`), and tier badge
**And** the README is under 80 lines (concise, not exhaustive)

---

## Epic 4: Standalone Skills Repository (First Release)

**Goal:** Create and seed the public catalog repository with Tier 1 exports. This is where teammates get value — a GitHub repo they can browse and copy from. No npm, no CLI, no framework.

### Story 4.1: Create and Seed Repository

As a consultant,
I want a GitHub repository I can browse to find and copy skills,
So that I don't need to install BMAD or ask Amalik for help.

**Acceptance Criteria:**

**Given** all Tier 1 skills exported from Epic 2 and catalog README from Epic 3
**When** the repository `convoke-skills-catalog` is created
**Then** the root contains the decision-tree `README.md` catalog
**And** each skill has its own directory with `README.md` and `instructions.md`
**And** the repo contains a `LICENSE` file
**And** the repo contains a `CONTRIBUTING.md` explaining that skills are auto-generated from the main Convoke repo
**And** at least 12 skill directories are present
**And** no file in the repo references BMAD internals, `_bmad/` paths, or Claude-specific tools

### Story 4.2: End-to-End Validation

As a platform maintainer,
I want to verify that exported skills actually work when copy-pasted into a clean project,
So that I'm confident teammates will have a good first experience.

**Acceptance Criteria:**

**Given** an exported Tier 1 skill (e.g., brainstorming)
**When** the `instructions.md` is copied into a clean project's `.claude/skills/brainstorming/` directory
**Then** invoking the skill in Claude Code produces the expected persona behavior (Carson, brainstorming facilitator)
**And** the skill does not error or reference missing files/configs

**Given** the same exported skill
**When** the `instructions.md` content is added to a `.github/copilot-instructions.md` file in a clean project
**Then** the instructions are valid markdown that Copilot can interpret (no broken references, no tool-specific syntax)

**Given** the catalog repository README
**When** a user unfamiliar with BMAD reads it
**Then** they can identify a relevant skill and understand how to install it within 60 seconds (validated by walkthrough with a real teammate)

---

## Epic 5: Tier 2 Export & Platform Adapters

**Goal:** Extend the exporter to handle skills with template dependencies and generate platform-specific adapter wrappers for Claude Code, Copilot, and Cursor.

### Story 5.1: Template Inlining for Tier 2 Export

As a platform maintainer,
I want the exporter to inline referenced templates into the canonical format,
So that Tier 2 skills (PRD creation, code review, etc.) can be exported as self-contained files.

**Acceptance Criteria:**

**Given** a Tier 2 skill with dependencies listed in the manifest (e.g., `bmad-create-prd` depends on `_bmad/bmm/templates/prd-template.md`)
**When** the export engine processes that skill
**Then** it reads each dependency file and inlines its content into the `instructions.md` under a clearly marked "Template" section
**And** template references in the workflow (e.g., "load ../templates/prd-template.md") are replaced with "see the Template section below"
**And** config variable references (e.g., `{output_folder}`, `{project_name}`) are replaced with placeholder instructions ("replace PROJECT_NAME with your project's name")
**And** the resulting `instructions.md` is self-contained — no external file references remain

### Story 5.2: Platform Adapter Generation

As a consultant using GitHub Copilot or Cursor,
I want platform-specific wrappers for each exported skill,
So that I can use the skill in my preferred AI tool with the correct file format and location.

**Acceptance Criteria:**

**Given** an exported skill with canonical `instructions.md`
**When** the adapter generator runs with `--platform all`
**Then** it produces an `adapters/claude-code/` directory containing a `SKILL.md` with proper frontmatter wrapping the canonical content
**And** it produces an `adapters/copilot/` directory containing a single markdown file formatted for GitHub Copilot custom instructions
**And** it produces an `adapters/cursor/` directory containing a `.cursorrules`-compatible markdown file
**And** each adapter is under 20 lines of wrapper around the canonical content (thin adapter principle)
**And** the per-skill README "How to use" section links to the correct adapter directory per platform

### Story 5.3: Export Tier 2 Skills and Update Catalog

As a platform maintainer,
I want all Tier 2 skills exported with templates inlined and the catalog updated,
So that the skills repository covers ~70% of useful skills.

**Acceptance Criteria:**

**Given** the Tier 2 export engine from Story 5.1 and adapter generator from Story 5.2
**When** `convoke export --tier 2` is run
**Then** all Tier 2 skills are exported successfully with inlined templates
**And** each exported skill has adapters for Claude Code, Copilot, and Cursor
**And** the catalog README is regenerated to include Tier 2 skills
**And** the `convoke-skills-catalog` repo is updated with the new exports
**And** at least 25 total skills are now available in the catalog (Tier 1 + Tier 2)

---

## Future Work (Not in scope)

- **CI/CD automation** — Auto-regenerate catalog repo on Convoke release (Vision Phase 7)
- **Tier 3 documentation** — Comprehensive prerequisite guides for pipeline skills
- **Additional platform adapters** — Windsurf, Aider, and future tools
- **Skill versioning** — Track which Convoke version an export was generated from
- **Feedback loop** — Mechanism for catalog users to report issues or request skills
