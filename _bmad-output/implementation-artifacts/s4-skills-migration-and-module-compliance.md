# Story S4: Migrate to BMAD v6.1.0 Skills Format & External Module Compliance

Status: done

> **Phase 1 of Native Module Convergence** — This story makes Vortex artifacts indistinguishable from a native BMAD module while keeping Convoke's own installer. Future stories: S5 (multi-team architecture when Team 2 arrives), S6 (BMAD external module registration via `external-official-modules.yaml`).

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
10. **AC10: Agent manifest uses full v6.1.0 schema** — All 7 BME agents in `_bmad/_config/agent-manifest.csv` use the 12-column v6.1.0 format with ALL fields populated: `name`, `displayName`, `title`, `icon`, `capabilities`, `role`, `identity`, `communicationStyle`, `principles`, `module`, `path`, `canonicalId`
11. **AC11: Legacy `_bmad/bme/_config/module.yaml` cleaned up** — Stale file deleted
12. **AC12: `package.json` files field updated** — `src/module.yaml` included in npm distribution
13. **AC13: Agent customize files generated** — Running `convoke-install-vortex` creates 7 `_bmad/_config/agents/bme-{agent-name}.customize.yaml` files (e.g., `bme-emma.customize.yaml`) matching the BMAD pattern, with persona/memories/menu/prompts sections
14. **AC14: Version bumped to v2.2.0** — `package.json` version updated to reflect the breaking activation change (commands → skills)
15. **AC15: Redundant `createAgentManifest()` removed** — The duplicate manifest creation function in `install-vortex-agents.js` is deleted; `refreshInstallation()` section 4 is the single code path for manifest generation
16. **AC16: Documentation updated** — README.md and `docs/WARP.md` reference `.claude/skills/` instead of `.claude/commands/`

## Tasks / Subtasks

### Track 1: Skills Migration

- [x] Task 1: Update `refreshInstallation()` section 6 to generate skills (AC: 1, 2, 4, 5)
  - [x]1.1 Change target from `.claude/commands/` to `.claude/skills/bmad-agent-bme-{id}/SKILL.md` — create parent directory per agent with `fs.ensureDir()`
  - [x]1.2 SKILL.md content: same activation block pattern as S3, but `name` field uses `bmad-agent-bme-{id}` with no quotes (matches BMAD native pattern like `bmad-agent-cis-brainstorming-coach`)
  - [x]1.3 Update stale cleanup: guard with `fs.existsSync()` before scanning `.claude/skills/`, then scan for directories matching `bmad-agent-bme-*` not in current AGENTS, remove them
  - [x]1.4 Update changes array entries: `Refreshed skill: bmad-agent-bme-{id}/SKILL.md`

- [x] Task 2: Add legacy `.claude/commands/` cleanup (AC: 3)
  - [x]2.1 In section 6, before generating skills, guard with `fs.existsSync()` before scanning `.claude/commands/`, then scan for files matching `bmad-agent-bme-*.md` and remove them
  - [x]2.2 Log each removal: `Removed legacy command: bmad-agent-bme-{id}.md`
  - [x]2.3 Only remove `bmad-agent-bme-*` files — never touch other modules' files

- [x] Task 3: Update installer verification and output (AC: 6, 7)
  - [x]3.1 Update `verifyInstallation()` in `install-vortex-agents.js`: check `.claude/skills/bmad-agent-bme-${a.id}/SKILL.md` instead of `.claude/commands/bmad-agent-bme-${a.id}.md`
  - [x]3.2 Update `printSuccess()`: change step 2 text from "Activate an agent with a slash command" to "Activate an agent (skill)"; the activation command is still `/bmad-agent-bme-{id}` — skills are invoked the same way

- [x] Task 4: Update tests (AC: 8)
  - [x]4.1 Update "creates all 7 command files" → "creates all 7 skill files" — check `.claude/skills/bmad-agent-bme-{id}/SKILL.md` paths
  - [x]4.2 Update "command files have correct frontmatter" → check `name: bmad-agent-bme-{id}` (no quotes) in SKILL.md
  - [x]4.3 Update "command files reference correct agent path" → same check, new path
  - [x]4.4 Update "is idempotent" → same logic, new paths
  - [x]4.5 Add test: "removes legacy command files during migration" — create `.claude/commands/bmad-agent-bme-contextualization-expert.md`, run refresh, verify it's gone and skill exists
  - [x]4.6 Update "returns a list of changes" test to check for `Refreshed skill:` instead of `Refreshed command:`

### Track 2: External Module Spec Compliance

- [x] Task 5: Create `src/module.yaml` (AC: 9, 12)
  - [x]5.1 Create `src/module.yaml` following the external module spec:
    ```yaml
    code: bme
    name: "Convoke: Vortex Discovery Framework"
    header: "Convoke — Vortex Discovery Framework"
    subheader: "7 AI agents for product discovery based on the Shiftup Innovation Vortex"
    description: "Domain-specialized agent teams for structured product discovery: Contextualize, Empathize, Synthesize, Hypothesize, Externalize, Sensitize, Systematize"
    default_selected: false
    ```
  - [x]5.2 No config variables needed initially — Convoke's config is simple (user_name, communication_language, output_folder) and already seeded by BMAD installer
  - [x]5.3 Add `"src/"` to `package.json` `files` array

- [x] Task 6: Refactor agent manifest to full v6.1.0 schema (AC: 10, 15)
  - [x]6.1 Delete `createAgentManifest()` from `install-vortex-agents.js` — it's redundant with `refreshInstallation()` section 4 and writes the old 10-column schema that would clobber BMAD 6.1.0's 12-column manifest. Renumber installer steps accordingly.
  - [x]6.2 Refactor `refreshInstallation()` section 4: detect existing CSV header by reading first line. If manifest exists, use the on-disk header. If no manifest exists (fresh install), default to the v6.1.0 header: `name,displayName,title,icon,capabilities,role,identity,communicationStyle,principles,module,path,canonicalId`
  - [x]6.3 Write BME rows matching the detected/default schema. Column mapping from `agent-registry.js`:

    | v6.1.0 Column | Source |
    |---------------|--------|
    | `name` | `agent.name` (e.g., `Emma`) |
    | `displayName` | `""` (leave empty, title is separate) |
    | `title` | `agent.title` |
    | `icon` | `agent.icon` |
    | `capabilities` | `""` (not tracked yet) |
    | `role` | `agent.persona.role` |
    | `identity` | `agent.persona.identity` |
    | `communicationStyle` | `agent.persona.communication_style` |
    | `principles` | `agent.persona.expertise` |
    | `module` | `"bme"` |
    | `path` | `_bmad/bme/_vortex/agents/${agent.id}.md` |
    | `canonicalId` | `bmad-agent-bme-${agent.id}` |

  - [x]6.4 Preserved non-BME rows: filter by `module` column (not `submodule`) when v6.1.0 header detected. Fall back to `submodule` field (index 8) for old-format manifests for backward compatibility.
  - [x]6.5 Update tests: verify manifest rows have 12 columns, verify `canonicalId` and `module` fields are populated

- [x] Task 7: Clean up legacy module definition (AC: 11)
  - [x]7.1 Delete `_bmad/bme/_config/module.yaml` — it references deprecated agents (empathy-mapper, wireframe-designer, quality-gatekeeper, standards-auditor) and old package names (@bmad/bme-*), and uses a non-standard schema
  - [x]7.2 Verify nothing imports or reads this file (search codebase for references)

- [x] Task 8: Generate agent customize files (AC: 13)
  - [x]8.1 Add section 7 in `refreshInstallation()`: generate `_bmad/_config/agents/bme-{agent-name}.customize.yaml` for each agent in AGENTS array, where `{agent-name}` is the lowercase first name (e.g., `bme-emma`, `bme-isla`)
  - [x]8.2 Template content must match the BMAD pattern exactly — see `_bmad/_config/agents/bmm-pm.customize.yaml` for reference: `agent.metadata.name`, `persona` (role, identity, communication_style, principles), `critical_actions`, `memories`, `menu`, `prompts` sections all empty/defaults
  - [x]8.3 Only create if file does NOT exist — unlike skills/agents, customize files are user-editable and must NOT be overwritten on re-install (user may have added memories, menu items, etc.)
  - [x]8.4 Push to changes array: `Created customize file: bme-{name}.customize.yaml` (only when newly created)
  - [x]8.5 `isSameRoot` guard: always run (customize files go to `_bmad/_config/agents/` which is project-scoped, same as skills going to `.claude/`)
  - [x]8.6 Add tests: verify 7 customize files created on fresh install; verify existing customize files with modified content are NOT overwritten on second run (separate test case)

- [x] Task 9: Bump version (AC: 14)
  - [x]9.1 Update `package.json` version from `2.1.0` to `2.2.0`
  - [x]9.2 No formal migration delta needed in `scripts/update/migrations/registry.js` — `refreshInstallation()` handles the commands→skills transition and legacy cleanup. The version bump ensures `convoke-update` detects the new version.
  - [x]9.3 Add `## [2.2.0]` entry to `CHANGELOG.md` documenting: commands→skills migration, `src/module.yaml` creation, agent customize files, legacy cleanup, `createAgentManifest()` removal

- [x] Task 10: Update documentation (AC: 16)
  - [x]10.1 Update `README.md`: change "Claude Code (slash commands)" heading and references from `.claude/commands/` to `.claude/skills/`; keep the `/bmad-agent-bme-{id}` activation commands (they still work, just backed by skills now)
  - [x]10.2 Update `docs/WARP.md`: change "Commands in `.claude/commands/` directory" to reference `.claude/skills/` pattern
  - [x]10.3 Update `INSTALLATION.md` if it references command files (check first)
  - [x]10.4 Update all 7 user guides in `_bmad/bme/_vortex/guides/`: change "BMAD slash commands" to "BMAD skills" in the Method 2 section heading and description text. Keep the `/bmad-agent-bme-{id}` activation command unchanged (skills are invoked the same way). These are shipped files (`package.json` `files` array includes `_bmad/bme/_vortex/`).

## Dev Notes

### Architecture Compliance

- **Native module convergence**: Vortex artifacts must be indistinguishable from a native BMAD module. Same manifest schema, same skill format, same customize files.
- **Single source of truth**: Continue using `AGENTS` array from `agent-registry.js` — do NOT hardcode agent IDs
- **Single code path for manifest**: `refreshInstallation()` section 4 is the ONLY place that writes agent-manifest.csv. `createAgentManifest()` in the installer is deleted.
- **`isSameRoot` guard**: Skills (section 6) and customize files (section 7) always run regardless of `isSameRoot` — both target directories that are project-scoped, not dev-environment-specific
- **No `process.cwd()`**: Use the `projectRoot` parameter
- **No migration delta**: `refreshInstallation()` already handles the transition (legacy cleanup + new skills generation). The v2.2.0 version bump ensures `convoke-update` detects the change.

### SKILL.md Template (BMAD v6.1.0 format)

Each generated file must match this exact pattern (identical to native BMAD agent skills — **no quotes** on frontmatter values):

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

Note the `name` field change from S3: was `'{agent-id}'` (with quotes, e.g., `'contextualization-expert'`), now `bmad-agent-bme-{agent-id}` (no quotes, e.g., `bmad-agent-bme-contextualization-expert`) — matches BMAD native pattern.

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

### Agent Manifest CSV — Schema Detection Logic

The BMAD 6.1.0 update changed `agent-manifest.csv` to a 12-column schema. Section 4 must handle both:

**v6.1.0 header (default for fresh installs):**
```
name,displayName,title,icon,capabilities,role,identity,communicationStyle,principles,module,path,canonicalId
```

**Pre-6.1.0 header (legacy Convoke-only installs):**
```
"agent_id","name","title","icon","role","identity","communication_style","expertise","submodule","path"
```

**Detection logic:**
1. If `agent-manifest.csv` exists → read first line as header, use it
2. If no manifest exists → use v6.1.0 header as default
3. Filter preserved rows by `module` column (v6.1.0) or `submodule` column (legacy), value `bme`
4. Write BME rows matching the detected header's column count and order

### Agent Registry → v6.1.0 Manifest Column Mapping

| v6.1.0 Column | agent-registry.js Source | Notes |
|---------------|--------------------------|-------|
| `name` | `agent.name` | First name: Emma, Isla, etc. |
| `displayName` | `""` | Empty — BMAD uses this for overrides |
| `title` | `agent.title` | e.g., "Contextualization Expert" |
| `icon` | `agent.icon` | Emoji |
| `capabilities` | `""` | Not tracked in registry yet |
| `role` | `agent.persona.role` | |
| `identity` | `agent.persona.identity` | |
| `communicationStyle` | `agent.persona.communication_style` | Note: camelCase in CSV, snake_case in registry |
| `principles` | `agent.persona.expertise` | Closest semantic match |
| `module` | `"bme"` | Hardcoded |
| `path` | `_bmad/bme/_vortex/agents/${agent.id}.md` | |
| `canonicalId` | `bmad-agent-bme-${agent.id}` | |

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

### Deferred to Future Stories

These items are architecturally correct but not needed until Convoke has multiple teams or seeks BMAD org registration:

- **Workflow manifests** (`workflow-manifest.csv`): Vortex workflows not registered — deferred to S5/S6 when Convoke becomes a registered external module
- **Skill manifests** (`bmad-skill-manifest.yaml` per workflow): Not generated — deferred to S5/S6, these are BMAD-installer-managed for registered modules
- **Installation manifest** (`manifest.yaml`): BME not listed — deferred to S6, this tracks BMAD-installer-managed modules
- **Multi-team architecture**: Convoke as module collection with per-team install commands — deferred to S5 when Team 2 arrives
- **BMAD external module registration**: Entry in `external-official-modules.yaml` — deferred to S6

### File Paths

- **Skills target**: `{projectRoot}/.claude/skills/bmad-agent-bme-{agent-id}/SKILL.md`
- **Legacy cleanup target**: `{projectRoot}/.claude/commands/bmad-agent-bme-*.md`
- **Agent registry**: `scripts/update/lib/agent-registry.js`
- **Refresh installation**: `scripts/update/lib/refresh-installation.js`
- **Installer**: `scripts/install-vortex-agents.js`
- **Tests**: `tests/integration/fresh-install.test.js`
- **New file**: `src/module.yaml`
- **Delete**: `_bmad/bme/_config/module.yaml`
- **Delete function**: `createAgentManifest()` in `scripts/install-vortex-agents.js`
- **Customize files target**: `{projectRoot}/_bmad/_config/agents/bme-{agent-name}.customize.yaml`
- **Customize file reference**: `_bmad/_config/agents/bmm-pm.customize.yaml`
- **Docs to update**: `README.md`, `docs/WARP.md`, `INSTALLATION.md` (check), 7 user guides in `_bmad/bme/_vortex/guides/`

### Key Constraints

- Do NOT add skill files to `package.json` `files` field — they are generated locally, not shipped
- Do NOT modify `.gitignore` — `.claude/` is already ignored
- The 7 agents and 21 workflows are defined in `agent-registry.js` — iterate over AGENTS, don't hardcode
- Frontmatter values in SKILL.md use NO quotes (match BMAD native: `name: bmad-analyst`, not `name: 'bmad-analyst'`)

### References

- [Source: scripts/update/lib/refresh-installation.js] — section 4 (manifest, lines 107-144) and section 6 (commands→skills, lines 174-210) to modify
- [Source: scripts/update/lib/agent-registry.js] — AGENTS, WORKFLOWS constants
- [Source: scripts/install-vortex-agents.js] — `createAgentManifest()` to delete (line 101), `verifyInstallation()` (line 130), `printSuccess()` (line 159)
- [Source: tests/integration/fresh-install.test.js] — 4 command tests to update (lines 81-136)
- [Source: .claude/skills/bmad-agent-cis-brainstorming-coach/SKILL.md] — reference BMAD native skill pattern
- [Source: .claude/skills/bmad-master/SKILL.md] — reference BMAD native skill pattern
- [Source: _bmad/_config/agent-manifest.csv] — current v6.1.0 12-column schema
- [Source: _bmad/_config/agents/bmm-pm.customize.yaml] — reference customize file pattern
- [Source: _bmad/_config/skill-manifest.csv] — 24 registered skills (0 from bme)
- [Source: README.md] — line 158: "Claude Code (slash commands)" to update
- [Source: docs/WARP.md] — line 169: ".claude/commands/" reference to update
- [Source: _bmad-output/implementation-artifacts/s3-install-bme-slash-commands.md] — predecessor story
- [Source: _bmad-output/planning-artifacts/initiatives-backlog.md#S4] — initiative definition

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

### Completion Notes List

- Track 1 (Tasks 1-4): Rewrote section 6 of `refreshInstallation()` — commands→skills migration with legacy cleanup, stale skill removal, and `fs.existsSync()` guards. All 6 test cases updated + 1 new legacy migration test.
- Task 5: Created `src/module.yaml` with external module spec fields. Added `src/` to `package.json` files array.
- Task 6: Deleted redundant `createAgentManifest()` from installer (was clobbering BMAD 6.1.0 12-column manifest). Refactored section 4 with schema detection (`parseCSVRow` helper), v6.1.0 default header, and column mapping. 3 new manifest schema tests. Renumbered installer steps from 6 to 5.
- Task 7: Deleted stale `_bmad/bme/_config/module.yaml`. Verified no code references.
- Task 8: Added section 7 to `refreshInstallation()` for customize file generation. 7 files created on install, never overwritten. 3 new test cases.
- Task 9: Bumped version to 2.2.0. Added CHANGELOG entry. No migration delta needed.
- Task 10: Updated README.md, WARP.md, all 7 user guides. INSTALLATION.md had no references to update.
- Bonus fix: Updated `docs-audit.js` to skip broken-path checks on CHANGELOG.md (historical entries reference deleted files).

### Code Review Fixes Applied

### File List

**Modified:**
- scripts/update/lib/refresh-installation.js — sections 4 (manifest schema), 6 (commands→skills), 7 (customize files)
- scripts/install-vortex-agents.js — deleted `createAgentManifest()`, updated verification/output, renumbered steps
- tests/integration/fresh-install.test.js — updated 5 existing tests, added 7 new tests (20 total)
- package.json — version 2.2.0, added `src/` to files
- CHANGELOG.md — added v2.2.0 entry
- README.md — "slash commands" → "skills"
- docs/WARP.md — `.claude/commands/` → `.claude/skills/`
- scripts/docs-audit.js — skip broken-path checks on CHANGELOG
- _bmad/bme/_vortex/guides/EMMA-USER-GUIDE.md — "Slash Command" → "Skill Activation"
- _bmad/bme/_vortex/guides/ISLA-USER-GUIDE.md — same
- _bmad/bme/_vortex/guides/MILA-USER-GUIDE.md — same
- _bmad/bme/_vortex/guides/LIAM-USER-GUIDE.md — same
- _bmad/bme/_vortex/guides/WADE-USER-GUIDE.md — same
- _bmad/bme/_vortex/guides/NOAH-USER-GUIDE.md — same
- _bmad/bme/_vortex/guides/MAX-USER-GUIDE.md — same

**Created:**
- src/module.yaml — external module spec definition

**Deleted:**
- _bmad/bme/_config/module.yaml — stale legacy file
