# Story S4: Migrate to BMAD v6.1.0 Skills Format & External Module Compliance

Status: ready-for-dev

## Story

As a Convoke user with BMAD Method v6.1.0,
I want Vortex agent activation to use the `.claude/skills/` format and the module structure to align with the external module spec,
so that Convoke agents are discoverable and activatable alongside native BMAD agents, and the module is ready for future registration in `external-official-modules.yaml`.

## Acceptance Criteria

### Track 1 — Skills Migration (urgent: activation is currently broken)

1. **AC1: Skills files generated** — Running `convoke-install-vortex` creates 7 `.claude/skills/bmad-agent-bme-{id}/SKILL.md` files (not `.claude/commands/`)
2. **AC2: SKILL.md content matches BMAD pattern** — Each SKILL.md follows the exact BMAD v6.1.0 pattern: frontmatter (name, description) + agent-activation block pointing to `{project-root}/_bmad/bme/_vortex/agents/{agent-id}.md`
3. **AC3: Legacy commands cleaned up** — If `.claude/commands/bmad-agent-bme-*` files exist from a prior install, they are removed during refresh
4. **AC4: Stale skills cleaned up** — Skills directories matching `bmad-agent-bme-*` that are no longer in the AGENTS registry are removed
5. **AC5: Idempotent** — Running the installer twice produces identical results
6. **AC6: Verification updated** — `verifyInstallation()` checks `.claude/skills/bmad-agent-bme-{id}/SKILL.md` paths
7. **AC7: Success output updated** — `printSuccess()` shows `/bmad-agent-bme-{id}` as skill activation (not slash commands)
8. **AC8: Tests pass** — All existing tests updated + new tests cover skills generation, legacy cleanup, idempotency

### Track 2 — External Module Spec Compliance

9. **AC9: `src/module.yaml` created** — File follows the BMAD external module spec schema (fields: `code`, `name`, `header`, `subheader`, `description`, `default_selected`)
10. **AC10: Agent manifest canonicalIds populated** — All 7 BME agents in `_bmad/_config/agent-manifest.csv` have `canonicalId` field set (pattern: `bmad-agent-bme-{id}`)
11. **AC11: Legacy `_bmad/bme/_config/module.yaml` cleaned up** — Stale file either deleted or replaced with a pointer to `src/module.yaml`
12. **AC12: `package.json` files field updated** — `src/module.yaml` included in npm distribution
13. **AC13: Agent customize files generated** — Running `convoke-install-vortex` creates 7 `_bmad/_config/agents/bme-{agent-name}.customize.yaml` files (e.g., `bme-emma.customize.yaml`) matching the BMAD pattern, with persona/memories/menu/prompts sections

## Tasks / Subtasks

### Track 1: Skills Migration

- [ ] Task 1: Update `refreshInstallation()` section 6 to generate skills (AC: 1, 2, 4, 5)
  - [ ] 1.1 Change target from `.claude/commands/` to `.claude/skills/bmad-agent-bme-{id}/SKILL.md` — create parent directory per agent with `fs.ensureDir()`
  - [ ] 1.2 SKILL.md content: same frontmatter + activation block pattern as S3, but `name` field uses `bmad-agent-bme-{id}` (matches BMAD native pattern like `bmad-agent-cis-brainstorming-coach`)
  - [ ] 1.3 Update stale cleanup: scan `.claude/skills/` for directories matching `bmad-agent-bme-*` not in current AGENTS, remove them
  - [ ] 1.4 Update changes array entries: `Refreshed skill: bmad-agent-bme-{id}/SKILL.md`

- [ ] Task 2: Add legacy `.claude/commands/` cleanup (AC: 3)
  - [ ] 2.1 In section 6, before generating skills, scan `.claude/commands/` for files matching `bmad-agent-bme-*.md` and remove them
  - [ ] 2.2 Log each removal: `Removed legacy command: bmad-agent-bme-{id}.md`
  - [ ] 2.3 Only remove `bmad-agent-bme-*` files — never touch other modules' command files (though BMAD 6.1.0 removed them all, future-proof)

- [ ] Task 3: Update installer verification and output (AC: 6, 7)
  - [ ] 3.1 Update `verifyInstallation()` in `install-vortex-agents.js`: check `.claude/skills/bmad-agent-bme-${a.id}/SKILL.md` instead of `.claude/commands/bmad-agent-bme-${a.id}.md`
  - [ ] 3.2 Update `printSuccess()`: change step 2 text from "Activate an agent with a slash command" to reflect skills format; the activation command is still `/bmad-agent-bme-{id}` — skills are invoked the same way

- [ ] Task 4: Update tests (AC: 8)
  - [ ] 4.1 Update "creates all 7 command files" → "creates all 7 skill files" — check `.claude/skills/bmad-agent-bme-{id}/SKILL.md` paths
  - [ ] 4.2 Update "command files have correct frontmatter" → check `name: 'bmad-agent-bme-{id}'` in SKILL.md
  - [ ] 4.3 Update "command files reference correct agent path" → same check, new path
  - [ ] 4.4 Update "is idempotent" → same logic, new paths
  - [ ] 4.5 Add test: "removes legacy command files during migration" — create `.claude/commands/bmad-agent-bme-contextualization-expert.md`, run refresh, verify it's gone and skill exists
  - [ ] 4.6 Update "returns a list of changes" test to check for `Refreshed skill:` instead of `Refreshed command:`

### Track 2: External Module Spec Compliance

- [ ] Task 5: Create `src/module.yaml` (AC: 9, 12)
  - [ ] 5.1 Create `src/module.yaml` following the external module spec:
    ```yaml
    code: bme
    name: "Convoke: Vortex Discovery Framework"
    header: "Convoke — Vortex Discovery Framework"
    subheader: "7 AI agents for product discovery based on the Shiftup Innovation Vortex"
    description: "Domain-specialized agent teams for structured product discovery: Contextualize, Empathize, Synthesize, Hypothesize, Externalize, Sensitize, Systematize"
    default_selected: false
    ```
  - [ ] 5.2 No config variables needed initially — Convoke's config is simple (user_name, communication_language, output_folder) and already seeded by BMAD installer
  - [ ] 5.3 Add `"src/"` to `package.json` `files` array

- [ ] Task 6: Populate agent manifest `canonicalId` (AC: 10)
  - [ ] 6.1 Update the manifest generation in `refreshInstallation()` section 4 — add `canonicalId` column with value `bmad-agent-bme-{id}` for each agent
  - [ ] 6.2 Read existing agent-manifest.csv header to detect schema version — if it already has `canonicalId` column (BMAD 6.1.0 format), use it; if old format, this is the fresh install path which uses the old header anyway
  - [ ] 6.3 Important: `refreshInstallation()` only replaces BME rows, preserving other modules' rows — so canonicalId must be added only to BME rows without breaking the CSV structure

- [ ] Task 7: Clean up legacy module definition (AC: 11)
  - [ ] 7.1 Delete `_bmad/bme/_config/module.yaml` — it references deprecated agents (empathy-mapper, wireframe-designer, quality-gatekeeper, standards-auditor) and old package names (@bmad/bme-*), and uses a non-standard schema
  - [ ] 7.2 Verify nothing imports or reads this file (search codebase for references)

- [ ] Task 8: Generate agent customize files (AC: 13)
  - [ ] 8.1 Add section 7 in `refreshInstallation()`: generate `_bmad/_config/agents/bme-{agent-name}.customize.yaml` for each agent in AGENTS array, where `{agent-name}` is the lowercase first name (e.g., `bme-emma`, `bme-isla`)
  - [ ] 8.2 Template content must match the BMAD pattern exactly — see `_bmad/_config/agents/bmm-pm.customize.yaml` for reference: `agent.metadata.name`, `persona` (role, identity, communication_style, principles), `critical_actions`, `memories`, `menu`, `prompts` sections all empty/defaults
  - [ ] 8.3 Only create if file does NOT exist — unlike skills/agents, customize files are user-editable and must NOT be overwritten on re-install (user may have added memories, menu items, etc.)
  - [ ] 8.4 Push to changes array: `Created customize file: bme-{name}.customize.yaml` (only when newly created)
  - [ ] 8.5 Add test: verify 7 customize files created on fresh install, verify they are NOT overwritten on second run if content differs

## Dev Notes

### Architecture Compliance

- **Single source of truth**: Continue using `AGENTS` array from `agent-registry.js` — do NOT hardcode agent IDs
- **Pattern**: Follow the existing refresh-installation section 6 pattern, just change the target paths
- **`isSameRoot` guard**: Skills generation always runs regardless of `isSameRoot` (`.claude/` is gitignored)
- **No `process.cwd()`**: Use the `projectRoot` parameter

### SKILL.md Template (BMAD v6.1.0 format)

Each generated file must match this exact pattern (identical to native BMAD agent skills):

```markdown
---
name: bmad-agent-bme-{agent-id}
description: {agent-id} agent
---

You must fully embody this agent's persona and follow all activation instructions exactly as specified. NEVER break character until given an exit command.

<agent-activation CRITICAL="TRUE">
1. LOAD the FULL agent file from {project-root}/_bmad/bme/_vortex/agents/{agent-id}.md
2. READ its entire contents - this contains the complete agent persona, menu, and instructions
3. FOLLOW every step in the <activation> section precisely
4. DISPLAY the welcome/greeting as instructed
5. PRESENT the numbered menu
6. WAIT for user input before proceeding
</agent-activation>
```

Note the `name` field change from S3: was `'{agent-id}'` (e.g., `contextualization-expert`), now `bmad-agent-bme-{agent-id}` (e.g., `bmad-agent-bme-contextualization-expert`) — matches BMAD native pattern.

### Directory Structure Change

**S3 (old):**
```
.claude/commands/bmad-agent-bme-contextualization-expert.md
```

**S4 (new):**
```
.claude/skills/bmad-agent-bme-contextualization-expert/SKILL.md
```

Each agent gets its own directory under `.claude/skills/`.

### Agent Manifest CSV Schema (v6.1.0)

The BMAD 6.1.0 update changed `agent-manifest.csv` schema. Current header:
```
name,displayName,title,icon,capabilities,role,identity,communicationStyle,principles,module,path,canonicalId
```

Old header used by `install-vortex-agents.js`:
```
"agent_id","name","title","icon","role","identity","communication_style","expertise","submodule","path"
```

**Important**: `refreshInstallation()` section 4 regenerates only BME rows while preserving other modules' rows. The section must now:
- Read the existing header to determine the schema
- Write BME rows matching that schema
- The `createAgentManifest()` in `install-vortex-agents.js` uses the old schema — this function only runs during fresh install (not update). Consider whether it needs updating or if `refreshInstallation()` section 4 handles it.

### External Module Spec Reference

From TEA and CIS `src/module.yaml` files, the required top-level fields are:

| Field | Type | Purpose |
|-------|------|---------|
| `code` | string | Short module identifier (e.g., `bme`) |
| `name` | string | Display name |
| `header` | string | Banner header |
| `subheader` | string | Banner subtitle |
| `description` | string | One-line description |
| `default_selected` | boolean | Auto-select during install |

Config variables (prompts with single-select/multi-select options) are optional — Convoke doesn't need them initially.

### Agent Customize File Template

Each generated file must match the BMAD pattern (see `_bmad/_config/agents/bmm-pm.customize.yaml`):

```yaml
# Agent Customization
# Customize any section below - all are optional

# Override agent name
agent:
  metadata:
    name: ""

# Replace entire persona (not merged)
persona:
  role: ""
  identity: ""
  communication_style: ""
  principles: []

# Add custom critical actions (appended after standard config loading)
critical_actions: []

# Add persistent memories for the agent
memories: []

# Add custom menu items (appended to base menu)
menu: []

# Add custom prompts (for action="#id" handlers)
prompts: []
```

Filename pattern: `bme-{lowercase-first-name}.customize.yaml` (e.g., `bme-emma.customize.yaml`, `bme-isla.customize.yaml`). This matches the BMAD convention of `{module}-{agent-name}.customize.yaml`.

**Critical**: These files must NOT be overwritten on re-install — they are user-editable. Use `fs.existsSync()` check before writing.

### What NOT to Touch

- **Workflow manifests**: Do NOT register Vortex workflows in `workflow-manifest.csv` in this story — that manifest is managed by the BMAD installer, not Convoke. Adding entries would be overwritten on next BMAD update.
- **Skill manifests**: Do NOT add `bmad-skill-manifest.yaml` to Vortex workflows — same reason; these are managed by the BMAD installer.
- **`manifest.yaml`**: Do NOT add BME to `_bmad/_config/manifest.yaml` — that file tracks BMAD-installed modules. Convoke installs via npm, not the BMAD installer.

### File Paths

- **Skills target**: `{projectRoot}/.claude/skills/bmad-agent-bme-{agent-id}/SKILL.md`
- **Legacy cleanup target**: `{projectRoot}/.claude/commands/bmad-agent-bme-*.md`
- **Agent registry**: `scripts/update/lib/agent-registry.js`
- **Refresh installation**: `scripts/update/lib/refresh-installation.js`
- **Installer**: `scripts/install-vortex-agents.js`
- **Tests**: `tests/integration/fresh-install.test.js`
- **New file**: `src/module.yaml`
- **Delete**: `_bmad/bme/_config/module.yaml`
- **Customize files target**: `{projectRoot}/_bmad/_config/agents/bme-{agent-name}.customize.yaml`
- **Customize file reference**: `_bmad/_config/agents/bmm-pm.customize.yaml`

### Key Constraints

- Do NOT add skill files to `package.json` `files` field — they are generated locally, not shipped
- Do NOT modify `.gitignore` — `.claude/` is already ignored
- The 7 agents and 21 workflows are defined in `agent-registry.js` — iterate over AGENTS, don't hardcode
- The agent manifest section 4 must handle both old-format (fresh Convoke install without BMAD) and new-format (BMAD 6.1.0 present) CSV schemas gracefully

### References

- [Source: scripts/update/lib/refresh-installation.js] — section 6 to modify (lines 174-210)
- [Source: scripts/update/lib/agent-registry.js] — AGENTS, WORKFLOWS constants
- [Source: scripts/install-vortex-agents.js] — verifyInstallation (line 130), printSuccess (line 159), createAgentManifest (line 101)
- [Source: tests/integration/fresh-install.test.js] — 4 command tests to update (lines 81-136)
- [Source: .claude/skills/bmad-agent-cis-brainstorming-coach/SKILL.md] — reference BMAD native skill pattern
- [Source: .claude/skills/bmad-master/SKILL.md] — reference BMAD native skill pattern
- [Source: _bmad/_config/agent-manifest.csv] — current v6.1.0 schema with canonicalId column
- [Source: _bmad/_config/skill-manifest.csv] — 24 registered skills (0 from bme)
- [Source: _bmad-output/implementation-artifacts/s3-install-bme-slash-commands.md] — predecessor story
- [Source: _bmad-output/planning-artifacts/initiatives-backlog.md#S4] — initiative definition

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### Code Review Fixes Applied

### File List
