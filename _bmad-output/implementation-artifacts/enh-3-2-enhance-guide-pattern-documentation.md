# Story 3.2: ENHANCE-GUIDE.md — Pattern Documentation for Module Authors

Status: done

## Story

As a module author,
I want comprehensive documentation on how to create new enhancements for existing BMAD agents,
So that I can extend the Enhance module with new workflows without reverse-engineering the implementation.

## Acceptance Criteria

1. **Given** ENHANCE-GUIDE.md is created at `_bmad/bme/_enhance/guides/ENHANCE-GUIDE.md` **When** a module author reads it **Then** it documents (FR43): directory structure conventions, workflow creation process, agent menu patching mechanism, config registration, and verification integration
2. **Given** the guide references the existing initiatives-backlog workflow **When** a module author follows it **Then** they can create a new enhancement workflow by following the documented pattern without additional assistance
3. **Given** the guide covers the constraint on menu item limits **When** a module author plans their enhancement **Then** they understand the max 2-3 items per agent limit and the rationale (prevent menu bloat)
4. **Given** a developer follows the guide to register a hypothetical second workflow in config.yaml **When** they run `verifyInstallation()` **Then** the verification checks detect the new workflow entry and validate its filesystem paths

## Tasks / Subtasks

- [x] Task 1: Create `ENHANCE-GUIDE.md` — Directory Structure & Workflow Creation (AC: 1, 2)
  - [x] 1.1 Create the file at `_bmad/bme/_enhance/guides/ENHANCE-GUIDE.md`
  - [x] 1.2 Document directory structure conventions: `_enhance/workflows/[name]/` with `workflow.md`, `steps-*/`, `templates/`, naming conventions
  - [x] 1.3 Document workflow creation process: entry point (`workflow.md`), step file architecture (frontmatter, MANDATORY SEQUENCE, SUCCESS/FAILURE METRICS), template authoring, step chaining conventions
  - [x] 1.4 Reference the initiatives-backlog workflow as the canonical example throughout — specific file paths and patterns, not abstract descriptions
  - [x] 1.5 Document the step file type taxonomy: Type 4 (Standard with A/P), Type 5 (Simple, C-only), Type 10 (Final Step — return-to-menu)
- [x] Task 2: Document Agent Menu Patching & Config Registration (AC: 1, 3, 4)
  - [x] 2.1 Document `<item>` tag format with `cmd` and `exec` attributes, 📦 prefix convention, "(Convoke Enhance)" suffix
  - [x] 2.2 Document `exec` path resolution: full `{project-root}/_bmad/...` form, e.g., `exec="{project-root}/_bmad/bme/_enhance/workflows/[name]/workflow.md"` (matches actual pm.md and extension descriptor convention)
  - [x] 2.3 Document config.yaml registration: workflow entries with `name`, `entry`, `target_agent`, `menu_patch_name` fields
  - [x] 2.4 Show a hypothetical second workflow registration example in config.yaml (e.g., sprint-health for SM agent)
  - [x] 2.5 Document max 2-3 items per agent limit and the rationale (prevent menu bloat, maintain agent focus)
- [x] Task 3: Document Verification Integration & Discoverability (AC: 1, 4)
  - [x] 3.1 Document how `verifyInstallation()` validates new workflows: 6-point check (directory exists, entry point resolves, menu patch present, config valid, config-to-filesystem consistency, skill wrapper exists)
  - [x] 3.2 Document skill wrapper creation: `.claude/skills/bmad-enhance-{workflow-name}/SKILL.md` with YAML frontmatter and body instruction
  - [x] 3.3 Document manifest registration: `workflow-manifest.csv` and `skill-manifest.csv` entries, canonicalId dedup
  - [x] 3.4 Document the extension descriptor file: `extensions/bmm-[agent].yaml` format (v1 docs-only, v3 dynamic)
  - [x] 3.5 Include a "Quick Verification Checklist" — the minimum files a module author must create/update for a valid workflow

## Dev Notes

### Content-Only Story — Different Deliverable Type

This is a **documentation story**, not a step file story. Single deliverable: one markdown guide file. No JavaScript, no tests. Test suite unchanged (359 tests, 0 regressions expected).

**Key difference from Stories 1.1-3.1:** Previous stories created step files following the BMAD step-file architecture. This story creates a **pattern documentation guide** — a reference document for module authors. Different review approach: validate completeness, accuracy, and usability rather than step chain integrity.

### Tone & Audience

The PRD describes this as a "half-page lean guide" (30-minute writing budget). Target audience: developers who have seen the initiatives-backlog workflow and want to create a similar one for a different agent.

**Style:** Concise, pattern-focused, example-driven. NOT a tutorial or walkthrough. A module author should be able to scan it and know exactly what files to create, what fields to fill in, and how to register their workflow.

### What to Document (FR43 Coverage)

1. **Directory structure conventions** — The `_enhance/workflows/[name]/` pattern with `workflow.md`, `steps-[mode]/`, `templates/`
2. **Workflow creation process** — Entry point structure, step file architecture, template authoring, step chaining
3. **Agent menu patching mechanism** — `<item>` tag format, `cmd` and `exec` attributes, 📦 prefix convention
4. **Config registration** — Adding workflow entries to `config.yaml` with the 4 required fields
5. **Verification integration** — How `verifyInstallation()` validates new workflows (6-point check)

### Reference Material for Guide Content

**Directory structure** (from architecture doc):
```
_bmad/bme/_enhance/
├── config.yaml
├── extensions/
│   └── bmm-pm.yaml
├── workflows/
│   └── initiatives-backlog/
│       ├── workflow.md
│       ├── steps-t/ (4 files)
│       ├── steps-r/ (3 files)
│       ├── steps-c/ (4 files)
│       └── templates/ (2 files)
└── guides/
    └── ENHANCE-GUIDE.md
```

**Config schema** (from config.yaml):
```yaml
name: enhance
version: 1.0.0
description: "Enhance module — capability upgrades for existing BMAD agents"
workflows:
  - name: initiatives-backlog
    entry: workflows/initiatives-backlog/workflow.md
    target_agent: bmm/agents/pm.md
    menu_patch_name: "initiatives-backlog"
```

**Menu patch format** (from pm.md pattern):
```xml
<item cmd="IB or fuzzy match on initiatives-backlog"
      exec="{project-root}/_bmad/bme/_enhance/workflows/initiatives-backlog/workflow.md">
  [IB] 📦 Initiatives Backlog (Convoke Enhance)
</item>
```

**Skill wrapper format** (from SKILL.md):
```yaml
---
name: bmad-enhance-initiatives-backlog
description: 'Manage RICE initiatives backlog...'
---

IT IS CRITICAL THAT YOU FOLLOW THIS COMMAND: LOAD the FULL {project-root}/_bmad/bme/_enhance/workflows/initiatives-backlog/workflow.md...
```

**Extension descriptor** (from extensions/bmm-pm.yaml):
```yaml
target_agent: bmm/pm
menu_items:
  - cmd: "IB or fuzzy match on initiatives-backlog"
    exec: "{project-root}/_bmad/bme/_enhance/workflows/initiatives-backlog/workflow.md"
    label: "[IB] 📦 Initiatives Backlog (Convoke Enhance)"
```

**Verification 6-point check** (from validator.js `validateEnhanceModule()`):
1. Directory `_bmad/bme/_enhance/` exists
2. Workflow entry point resolves (e.g., `workflows/initiatives-backlog/workflow.md`)
3. Menu patch present in target agent (name attribute match in `<item>`)
4. `config.yaml` valid (has required fields: name, version, workflows[])
5. Config-to-filesystem consistency (workflow directory exists for each registered workflow)
6. Skill wrapper exists (`.claude/skills/bmad-enhance-{name}/SKILL.md`)

### Hypothetical Second Workflow Example

The PRD scenario (section "A developer wants to add a Sprint Health Check enhancement for the SM agent"):
- Workflow: `_bmad/bme/_enhance/workflows/sprint-health/`
- Target agent: `bmm/agents/sm.md`
- Config entry: `{ name: sprint-health, entry: workflows/sprint-health/workflow.md, target_agent: bmm/agents/sm.md, menu_patch_name: "sprint-health" }`
- Menu item: `[SH] 📦 Sprint Health Check (Convoke Enhance)`

### Previous Story Intelligence (Story 3.1)

- Content-only delivery pattern: 4 step files created in single session
- Pattern reuse map documented explicitly in Dev Notes — apply same approach to guide (reference existing files, don't recreate)
- "Check all references" retro action item — verify guide content matches actual implementation

### Project Structure Notes

- Guide file: `_bmad/bme/_enhance/guides/ENHANCE-GUIDE.md` (1 new file)
- No other files modified
- The `guides/` directory already exists (created in Epic 1, Story 1.1)

### References

- [Source: epics-p4-enhance-module.md#Story 3.2] — ACs, FR43 requirement
- [Source: prd-p4-enhance-module.md#FR43] — Pattern documentation scope
- [Source: prd-p4-enhance-module.md#Installer Integration] — Menu patch format, verification, skill registration
- [Source: P4-enhance-module-architecture.md#Directory Structure] — Canonical directory layout
- [Source: P4-enhance-module-architecture.md#Agent Attachment] — Menu item format, 📦 convention
- [Source: P4-enhance-module-architecture.md#Config] — Config schema
- [Source: validator.js#validateEnhanceModule] — 6-point verification implementation
- [Source: _bmad/bme/_enhance/config.yaml] — Live config example
- [Source: _bmad/bme/_enhance/extensions/bmm-pm.yaml] — Extension descriptor example
- [Source: _bmad/bme/_enhance/workflows/initiatives-backlog/SKILL.md] — Skill wrapper example

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

None — clean implementation.

### Completion Notes List

- Task 1: Created ENHANCE-GUIDE.md with directory structure conventions, workflow entry point documentation, step file architecture (frontmatter fields table, step types table, step chaining diagram), and template authoring guidance. Referenced initiatives-backlog as canonical example throughout.
- Task 2: Documented agent menu patching (`<item>` tag format with `cmd`/`exec`, 📦 prefix, "(Convoke Enhance)" suffix, full `{project-root}/_bmad/...` exec path), config.yaml registration (4 required fields table), hypothetical sprint-health example for SM agent, max 2-3 items per agent limit with rationale.
- Task 3: Documented verification integration (6-point check table from `validateEnhanceModule()`), skill wrapper creation format, manifest registration (`workflow-manifest.csv` + `skill-manifest.csv`), extension descriptor format (`extensions/bmm-[agent].yaml`), Quick Verification Checklist with minimum files.
- Tests: 359 pass, 0 fail, 0 regressions (content-only story, no new tests)

### Change Log

- 2026-03-15: Implemented Story 3.2 — ENHANCE-GUIDE.md pattern documentation (3 tasks, 15 subtasks)

### File List

- _bmad/bme/_enhance/guides/ENHANCE-GUIDE.md (created)
