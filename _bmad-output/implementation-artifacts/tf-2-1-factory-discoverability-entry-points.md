# Story 2.1: Factory Discoverability & Entry Points

Status: done

## Story

As a framework contributor,
I want to find the Team Factory through the surfaces I already use (agent menu, help, BMad Master),
So that I don't need to know the factory exists in advance — I discover it when I need to extend BMAD.

## Acceptance Criteria

1. **Given** a framework contributor wants to extend BMAD
   **When** they look for guidance
   **Then** the factory entry point exists in all 4 enumerated surfaces: agent menu, module-help.csv, BMad Master "what's available?" response, and README (TF-FR14, TF-NFR10)

2. **Given** a contributor describes a problem like "I want to automate onboarding" (not using BMAD terminology)
   **When** intent-based routing evaluates the request
   **Then** the factory determines whether the need is a team, agent addition, or skill addition and routes accordingly
   **And** if the need doesn't match a factory capability (Phase 2: teams only), the contributor gets a graceful fallback with the Architecture Reference checklist

## Tasks / Subtasks

- [x] Task 1: Create Team Factory Skill Entry Point (AC: #1)
  - [x] 1.1 Create `.claude/skills/bmad-team-factory/SKILL.md` with frontmatter (`name`, `description`) and instructions that load the factory workflow. Follow the pattern from `.claude/skills/bmad-agent-builder/SKILL.md` — thin launcher with intent routing table.
  - [x] 1.2 Add the Team Factory skill to `_bmad/_config/skill-manifest.csv` — new row with canonicalId, name, description, module=bmb, path, install_to_bmad fields. Follow existing row patterns (62 entries currently).
  - [x] 1.3 Create `.claude/skills/bmad-team-factory/workflow.md` as a placeholder step-file architecture stub. Content: frontmatter + title + "This workflow will be implemented in Stories 2.2–2.9" + step-00-route.md reference. This gives the SKILL.md a valid target to load.

- [x] Task 2: Wire Agent Menu Entry Point (AC: #1)
  - [x] 2.1 Add a Team Factory menu item to `_bmad/core/agents/bmad-master.md` inside the existing `<menu>` block. Pattern: `<item cmd="TF or fuzzy match on team-factory or create-team" exec="skill:bmad-team-factory">[TF] Team Factory</item>`. Insert before the [DA] dismiss item.
  - [x] 2.2 Verify BMad Master menu still renders correctly — confirm XML is well-formed after insertion.

- [x] Task 3: Wire module-help.csv Entry Point (AC: #1)
  - [x] 3.1 Add a Team Factory row to `_bmad/bmb/module-help.csv`. Columns: module=bmb, phase=build, name=Team Factory, code=TF, sequence after existing builder entries, workflow-file pointing to the skill, command=team-factory, required=no, agent=bmad-master, description="Create a fully-wired BMAD-compliant team through guided factory workflow". Follow existing row format (13 columns).
  - [x] 3.2 Add corresponding row to `_bmad/_config/bmad-help.csv` (the consolidated help catalog loaded by `bmad-help` skill). Same column structure, ensures the factory appears in help queries.

- [x] Task 4: Wire README Entry Point (AC: #1)
  - [x] 4.1 Add a "Creating Your Own Team" section or bullet in `README.md`. Location: Contributing section (around line 376) or after "Building Your Own Skills" (line 322). Content: brief description + pointer to Team Factory skill. Keep it concise — 2-3 lines.

- [x] Task 5: Implement Intent-Based Routing (AC: #2)
  - [x] 5.1 Create `step-00-route.md` inside `.claude/skills/bmad-team-factory/`. This is the module-level intent routing step (FR8, architecture concern #7). Content: LLM routing instructions that classify user intent into one of three routes: `add-team` (proceed to Step 1), `add-agent` (graceful fallback — "Phase 3, not yet available"), `add-skill` (graceful fallback — "Phase 3, not yet available").
  - [x] 5.2 Include a Quick Reference intent table in `step-00-route.md` (pattern from `bmad-agent-builder/SKILL.md`): map trigger phrases to routes. E.g., "create/build/design a team" → add-team, "add an agent to existing team" → add-agent (fallback), "add a skill/workflow" → add-skill (fallback).
  - [x] 5.3 For non-factory intents (user describes a need that doesn't match team/agent/skill creation), provide graceful redirect to Architecture Reference checklist at `_bmad-output/planning-artifacts/architecture-reference-teams.md`.
  - [x] 5.4 Add discovery instrumentation: include "How did you find the factory?" as a first-interaction question before routing (architecture concern #9, self-instrumentation). Store response in conversation context for future spec file inclusion.

- [x] Task 6: Verification (AC: #1, #2)
  - [x] 6.1 Verify all 4 surfaces are wired: (1) BMad Master menu has [TF] item, (2) module-help.csv has factory row, (3) bmad-help.csv has factory row, (4) README has factory reference
  - [x] 6.2 Verify SKILL.md loads correctly — frontmatter parses, workflow.md reference is valid
  - [x] 6.3 Verify step-00-route.md has all 3 intent routes (add-team, add-agent, add-skill) plus fallback
  - [x] 6.4 Verify skill-manifest.csv row follows existing format (62 → 63 entries)

## Dev Notes

### This is the FIRST Epic 2 story — complexity shift from Epic 1

Epic 1 was pure markdown (Architecture Reference). Epic 2 introduces file creation, CSV editing, XML menu modifications, and skill registration. However, Story 2.1 is still primarily content creation — the heavy JS/file-I/O stories are 2.6–2.9. This story creates the scaffold that all subsequent factory stories build on.

### Architecture Decisions

1. **Step 0 is 100% LLM reasoning** — intent classification cannot be keyword-routed because contributors describe problems ("I want to automate onboarding"), not BMAD concepts ("create a Sequential team"). Architecture doc line 100, concern #1.
2. **Factory agent registered via standard `convoke-install`** — the factory creates OTHER teams, it cannot create itself. Architecture doc line 777.
3. **module-help.csv is per-module** — each module has its own CSV at module root level (e.g., `_bmad/bmb/module-help.csv`). These consolidate into `_bmad/_config/bmad-help.csv`. The factory row goes in `bmb/module-help.csv`.
4. **Discovery tracking** — "How did you find the factory?" closes observability gap on concern #7 (architecture doc line 143).

### File Locations and Patterns

**Files to CREATE:**
- `.claude/skills/bmad-team-factory/SKILL.md` — skill entry point
- `.claude/skills/bmad-team-factory/workflow.md` — placeholder workflow stub
- `.claude/skills/bmad-team-factory/step-00-route.md` — intent routing

**Files to MODIFY (additive only):**
- `_bmad/core/agents/bmad-master.md` — add `<item>` to `<menu>` block
- `_bmad/bmb/module-help.csv` — append row
- `_bmad/_config/bmad-help.csv` — append row
- `_bmad/_config/skill-manifest.csv` — append row
- `README.md` — add section/bullet

### Existing Patterns to Follow

**SKILL.md pattern** (from `bmad-agent-builder/SKILL.md`):
```
---
name: bmad-team-factory
description: Create fully-wired BMAD-compliant teams through guided factory workflow
---
[instructions that load workflow.md and route intent]
```

**Menu item pattern** (from `bmad-master.md`):
```xml
<item cmd="TF or fuzzy match on team-factory or create-team" exec="skill:bmad-team-factory">[TF] Team Factory</item>
```

**module-help.csv columns** (13 total):
```
module,phase,name,code,sequence,workflow-file,command,required,agent,options,description,output-location,outputs
```

**skill-manifest.csv pattern** (from existing 62 rows):
```
bmad-team-factory,Team Factory,Create fully-wired BMAD-compliant teams,bmb,.claude/skills/bmad-team-factory/SKILL.md,no
```

### What NOT to Do

- **Do NOT implement the full factory workflow** — Stories 2.2–2.9 handle that. This story only creates entry points and routing.
- **Do NOT modify existing team files** (Vortex, Gyre) — this is additive only (TF-NFR17).
- **Do NOT create JS modules** — no JavaScript in this story. All content is markdown + CSV.
- **Do NOT create the actual step-01 through step-05 workflow files** — only step-00-route.md and a workflow.md placeholder.

### Previous Story Intelligence

From Epic 1 retrospective (2026-03-24):
- Layered story design works: scaffold → populate → enrich → validate
- Code review has 75% hit rate — keep for all Epic 2 stories
- Previous Story Intelligence sections eliminate context loss
- Epic 2 complexity shift: markdown → JS modules (but Story 2.1 is still markdown/CSV)

From Story 1.5 (Vortex Cross-Validation):
- DISC-S-05 (module-help.csv) FAIL in both Gyre and Vortex — Story 2.7 will create module-help.csv for new teams, resolving this gap
- All 17 subtasks methodology: evaluate, document, verify
- Code review patches: count accuracy, phrasing clarity, full paths in file references

### Known Considerations

- **module-help.csv gap**: `_bmad/_config/module-help.csv` does not exist (DISC-S-05 FAIL). Individual module-help.csv files exist per module. Story 2.1 adds to `_bmad/bmb/module-help.csv`, not the non-existent central file.
- **Phase 2 scope**: Team creation only. Agent addition and skill addition are Phase 3 (tf-epic-3, Stories 3.1–3.2). The routing step must provide graceful fallback for Phase 3 intents.
- **D-Q6 (registry fragment architecture)**: Still OPEN from Epic 1 retro. May affect Story 2.8. Not relevant to Story 2.1.

### Project Structure Notes

- Team Factory skill: `.claude/skills/bmad-team-factory/`
- BMad Master agent: `_bmad/core/agents/bmad-master.md`
- BMB module help: `_bmad/bmb/module-help.csv`
- Consolidated help: `_bmad/_config/bmad-help.csv`
- Skill manifest: `_bmad/_config/skill-manifest.csv`
- Architecture Reference: `_bmad-output/planning-artifacts/architecture-reference-teams.md`
- Architecture doc: `_bmad-output/planning-artifacts/architecture-team-factory.md`

### References

- [Source: _bmad-output/planning-artifacts/epic-team-factory.md — Story 2.1 ACs, FR14, NFR10]
- [Source: _bmad-output/planning-artifacts/architecture-team-factory.md — Concern #7 (Intent Discoverability), Concern #9 (Self-Instrumentation), FR8, NFR10, LLM/JS boundary, directory structure]
- [Source: _bmad-output/implementation-artifacts/tf-epic-1-retro-2026-03-24.md — Action items for Epic 2]
- [Source: _bmad-output/implementation-artifacts/tf-1-5-vortex-cross-validation.md — Previous story intelligence]
- [Source: .claude/skills/bmad-agent-builder/SKILL.md — SKILL.md pattern with intent routing table]
- [Source: _bmad/core/agents/bmad-master.md — Menu item pattern, current 6 items]
- [Source: _bmad/bmb/module-help.csv — CSV column structure, existing entries]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

N/A

### Completion Notes List

All 16 subtasks across 6 tasks completed. Story implements the 4 enumerated discoverability surfaces (TF-FR14, TF-NFR10) plus intent-based routing with discovery instrumentation. Step-00-route.md expands the 3-route spec to 5 routes: Create Team (available), Add Agent (Phase 3 fallback), Add Skill (Phase 3 fallback), Learn/Explore (informational), and Non-Factory Intent (redirect). Discovery instrumentation ("How did you find the factory?") included per architecture concern #9. All files are additive — no existing files were destructively modified.

### Change Log

| Change | File | Description |
|--------|------|-------------|
| CREATE | `.claude/skills/bmad-team-factory/SKILL.md` | Thin launcher with frontmatter and Quick Reference intent routing table |
| CREATE | `.claude/skills/bmad-team-factory/workflow.md` | Placeholder step-file architecture stub referencing step-00-route.md |
| CREATE | `.claude/skills/bmad-team-factory/step-00-route.md` | Module-level intent routing with 5 routes + discovery instrumentation |
| MODIFY | `_bmad/core/agents/bmad-master.md` | Added [TF] Team Factory menu item before [DA] dismiss |
| MODIFY | `_bmad/bmb/module-help.csv` | Appended Team Factory row (sequence=75) |
| MODIFY | `_bmad/_config/bmad-help.csv` | Appended Team Factory row in bmb section |
| MODIFY | `_bmad/_config/skill-manifest.csv` | Appended bmad-team-factory row |
| MODIFY | `README.md` | Added "Creating Your Own Team" subsection after "Building Your Own Skills" |

### File List

- `.claude/skills/bmad-team-factory/SKILL.md` (created)
- `.claude/skills/bmad-team-factory/workflow.md` (created)
- `.claude/skills/bmad-team-factory/step-00-route.md` (created)
- `_bmad/core/agents/bmad-master.md` (modified)
- `_bmad/bmb/module-help.csv` (modified)
- `_bmad/_config/bmad-help.csv` (modified)
- `_bmad/_config/skill-manifest.csv` (modified)
- `README.md` (modified)
