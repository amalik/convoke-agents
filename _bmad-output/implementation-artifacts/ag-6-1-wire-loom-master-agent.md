# Story 6.1: Wire Loom Master Agent

Status: ready-for-dev

## Story

As a Convoke contributor,
I want the Loom Master agent to be accessible from conversation,
So that I can invoke the team factory for creating teams, agents, and skills.

## Acceptance Criteria

1. **Given** the Loom Master agent file exists at `_bmad/bme/_team-factory/agents/team-factory.md` **When** the wiring is complete **Then** `_bmad/_config/agent-manifest.csv` contains a complete entry for the team-factory agent with all 12 required fields (name, displayName, title, icon, capabilities, role, identity, communicationStyle, principles, module, path, canonicalId).

2. **Given** the manifest entry is added **When** the user invokes party mode or queries the agent roster **Then** the Loom Master appears with displayName `Loom Master`, title `Team Factory`, icon `🏭`, module `bme`, and canonicalId `bmad-agent-bme-team-factory`.

3. **Given** the manifest entry exists **When** a Claude Code skill is created at `.claude/skills/bmad-agent-bme-team-factory/SKILL.md` **Then** the skill follows the existing bme agent skill pattern (single SKILL.md file, frontmatter with `name` and `description`, delegation block that loads the agent file from `_bmad/bme/_team-factory/agents/team-factory.md`).

4. **Given** the skill exists **When** the user invokes the skill (via slash command or fuzzy match) **Then** the Loom Master persona activates per its existing activation block (loads `_bmad/bme/_team-factory/config.yaml`, greets the user, displays the menu with items MH, CH, CT, RS, EX, VT, AR, PM, DA).

5. **Given** the skill is registered **When** `convoke-doctor` runs **Then** it does not report any errors related to the team-factory agent or skill.

6. **Given** the integration is complete **When** existing agent skills are invoked (architect, analyst, sm, dev, all bme vortex agents, all bme gyre agents) **Then** they continue to work unchanged — no regression.

7. **Given** the wiring affects shared registry surfaces **When** the test suite runs **Then** all existing tests pass and new tests cover (a) the manifest entry presence, (b) the SKILL.md file existence and frontmatter validity, (c) the skill name follows the `bmad-agent-bme-{id}` convention.

## Tasks / Subtasks

- [ ] **Task 1: Add Loom Master to agent manifest** (AC: #1, #2)
  - [ ] 1.1 Open [_bmad/_config/agent-manifest.csv](_bmad/_config/agent-manifest.csv) and inspect the existing bme entries (e.g., `bmad-agent-bme-contextualization-expert`) to confirm the exact column order and CSV escaping convention.
  - [ ] 1.2 Append a new row for team-factory at the end of the bme block, using the field values from the **Manifest Entry** section in Dev Notes below.
  - [ ] 1.3 Verify the row parses cleanly (CSV-valid, all 12 columns present, double-quoted strings escape internal quotes correctly).
  - [ ] 1.4 **Critical decision point** — see "Registry Architecture Decision" in Dev Notes. Determine whether the row should be added directly to the CSV OR whether `agent-registry.js` should be extended to include team-factory. Default recommendation: **direct CSV edit + protect from refresh-installation.js regeneration** (see Dev Notes).

- [ ] **Task 2: Create Claude Code skill wrapper** (AC: #3, #4)
  - [ ] 2.1 Create directory `.claude/skills/bmad-agent-bme-team-factory/`.
  - [ ] 2.2 Create `SKILL.md` inside that directory following the bme agent skill pattern (see **SKILL.md Template** in Dev Notes for exact content).
  - [ ] 2.3 Verify the file frontmatter has `name: bmad-agent-bme-team-factory` and a `description` field.
  - [ ] 2.4 Verify the delegation block correctly references `{project-root}/_bmad/bme/_team-factory/agents/team-factory.md`.

- [ ] **Task 3: Protect new wiring from refresh-installation regeneration** (AC: #6)
  - [ ] 3.1 Read [scripts/update/lib/refresh-installation.js](scripts/update/lib/refresh-installation.js) to find where the bme block of `agent-manifest.csv` is regenerated (search for `buildAgentRow610` or `bmeRows`).
  - [ ] 3.2 Read [scripts/update/lib/refresh-installation.js](scripts/update/lib/refresh-installation.js) to find where `.claude/skills/bmad-agent-bme-*/` directories are scanned for cleanup (search for `currentSkillDirs` and the deletion loop).
  - [ ] 3.3 If the current logic would either (a) overwrite the manifest row for team-factory or (b) delete the new skill directory as "stale", extend the protected list to include `team-factory` so refresh-installation preserves it. The cleanest approach: add a constant `EXTRA_BME_SKILLS = ['team-factory']` and merge it into both the row generation and the cleanup whitelist.
  - [ ] 3.4 Verify by simulating: re-run refresh-installation logic mentally against the file changes — confirm the new manifest row and skill dir survive.

- [ ] **Task 4: Update validator** (AC: #5, #6)
  - [ ] 4.1 Read [scripts/update/lib/validator.js](scripts/update/lib/validator.js) to find where bme agent skills are validated (search for `bmad-agent-bme` or `AGENT_IDS`).
  - [ ] 4.2 Add the team-factory agent to the validator's checks: confirm the manifest row exists, confirm the SKILL.md file exists, confirm the agent file exists at `_bmad/bme/_team-factory/agents/team-factory.md`.
  - [ ] 4.3 Use the same `EXTRA_BME_SKILLS` constant if extracted in Task 3 to keep registration sources aligned.

- [ ] **Task 5: Write tests** (AC: #7)
  - [ ] 5.1 Add a test in [tests/lib/](tests/lib/) (or wherever agent registration tests live — check `tests/unit/` for existing manifest tests) verifying the team-factory row exists in `agent-manifest.csv` with the correct canonicalId, module, and path.
  - [ ] 5.2 Add a test verifying `.claude/skills/bmad-agent-bme-team-factory/SKILL.md` exists and has valid frontmatter (name + description).
  - [ ] 5.3 Add a test verifying the skill name follows the `bmad-agent-bme-{id}` convention.
  - [ ] 5.4 Run the full test suite — ensure no regression.

- [ ] **Task 6: Manual verification** (AC: #4, #5, #6)
  - [ ] 6.1 Run `convoke-doctor` from the project root and confirm no new errors.
  - [ ] 6.2 In a fresh Claude Code session, attempt to invoke the Loom Master via slash command or natural request ("I want to talk to Loom Master"). Confirm the persona activates and presents its menu.
  - [ ] 6.3 Verify party mode can include Loom Master in the agent roster (run `bmad-party-mode` and confirm it appears).

## Dev Notes

### Context

Loom Master (Team Factory) is a fully-built BMAD agent at [_bmad/bme/_team-factory/agents/team-factory.md](_bmad/bme/_team-factory/agents/team-factory.md) with persona, menu, activation logic, and 6 workflows. However, it has **no Claude Code skill wrapper** and **no entry in `agent-manifest.csv`**, meaning operators cannot invoke it from conversation. This was discovered during a party mode session on 2026-04-06 when trying to include Loom Master in a discussion — only Winston (Architect) was invocable.

This is the same class of UX problem the rest of Epic 6 addresses for migration and portfolio: features that exist but are not properly wired into the operator-facing layer.

### Registry Architecture Decision

**This is the most important decision in this story.**

The codebase has two patterns for bme agent registration:

| Pattern | Used by | How it works |
|---------|---------|--------------|
| **Registry-driven** | Vortex (7 agents) + Gyre (4 agents) | `scripts/update/lib/agent-registry.js` declares the canonical AGENTS array. `refresh-installation.js` reads it and regenerates manifest rows + skill directories. |
| **Direct entry** | None currently | Team-factory would be the first manually-wired bme agent. |

The Vortex/Gyre pattern is elegant because adding an agent to the registry array auto-generates everything. But team-factory is **structurally different**:

- It lives in `_bmad/bme/_team-factory/`, not `_bmad/bme/_vortex/agents/` or `_bmad/bme/_gyre/agents/`
- It's a **single agent**, not a team of agents
- Its agent file uses an `<agent>` XML structure with `<persona>` fields, not the registry's flat persona object
- Forcing it into the registry means inventing a new "submodule" branch in the registry code

**Recommended approach: Hybrid.**
1. Add the manifest row directly to `agent-manifest.csv` (not via registry)
2. Add an `EXTRA_BME_SKILLS = ['team-factory']` constant that `refresh-installation.js` and `validator.js` both consume
3. Use this constant to: (a) preserve the manually-added row during regeneration, (b) prevent skill directory cleanup, (c) include team-factory in validation

This avoids polluting the registry pattern (which is optimized for Vortex/Gyre teams) while keeping the platform aware of the wiring.

**Alternative if you disagree:** Refactor `agent-registry.js` to support a third array (e.g., `STANDALONE_BME_AGENTS`). This is cleaner long-term but expands the scope of this story significantly. **Default recommendation: hybrid approach.** If you find the hybrid messy in practice, escalate to Winston for an architectural call.

### Manifest Entry

Add this row to [_bmad/_config/agent-manifest.csv](_bmad/_config/agent-manifest.csv) at the end of the bme block (after the gyre agents):

```csv
"bmad-agent-bme-team-factory","Loom Master","Team Factory","🏭","team architecture, BMAD compliance, composition patterns, agent wiring, integration validation","Team Architecture Specialist + BMAD Compliance Expert","Master team architect who guides framework contributors through creating fully-wired, BMAD-compliant teams. Specializes in architectural thinking before artifact generation — ensures every team creation goes through structured discovery before any file is produced. Core expertise: composition pattern selection, agent scope definition, contract design, integration wiring, naming convention enforcement, end-to-end validation. Philosophy: 'The quality of a BMAD team isn't in the files — it's in the thinking that precedes them.'","Methodical yet encouraging — like a senior architect pair-programming with a colleague. Asks focused questions, explains trade-offs clearly, and celebrates good decisions. Uses concrete examples from Vortex and Gyre to illustrate patterns. Never dumps all decisions at once — progressive disclosure, one step at a time.","- Thinking before files: every team creation goes through discovery before generation - BMAD compliance is non-negotiable: output must be indistinguishable from native teams - No orphaned artifacts: if a file is created, it must be registered, wired, and discoverable - Delegate to BMB for artifact generation: factory owns integration wiring only - Validate continuously: don't wait until the end to check","bme","_bmad/bme/_team-factory/agents/team-factory.md","bmad-agent-bme-team-factory"
```

**Field validation checklist:**
- 12 columns separated by 11 commas (outside quoted strings)
- All string values double-quoted
- Internal apostrophes (e.g., `isn't`) are fine inside double quotes — no escaping needed
- No trailing comma
- `canonicalId` matches the `name` field exactly: `bmad-agent-bme-team-factory`

### SKILL.md Template

Create `.claude/skills/bmad-agent-bme-team-factory/SKILL.md` with this exact content:

```markdown
---
name: bmad-agent-bme-team-factory
description: team-factory agent
---

You must fully embody this agent's persona and follow all activation instructions exactly as specified. NEVER break character until given an exit command.

<agent-activation CRITICAL="TRUE">
1. LOAD the FULL agent file from {project-root}/_bmad/bme/_team-factory/agents/team-factory.md
2. READ its entire contents - this contains the complete agent persona, menu, and instructions
3. FOLLOW every step in the <activation> section precisely
4. DISPLAY the welcome/greeting as instructed
5. PRESENT the numbered menu
6. WAIT for user input before proceeding
</agent-activation>
```

This pattern matches every other bme agent skill (Vortex + Gyre). The only difference is the path on line 1 of the activation block, which points to `_team-factory/agents/team-factory.md` instead of `_vortex/agents/{agent}.md`.

### Files to Touch

| File | Action | Purpose |
|------|--------|---------|
| [_bmad/_config/agent-manifest.csv](_bmad/_config/agent-manifest.csv) | Edit (append row) | Register the agent for discovery |
| `.claude/skills/bmad-agent-bme-team-factory/SKILL.md` | Create | Skill wrapper that loads the agent |
| [scripts/update/lib/refresh-installation.js](scripts/update/lib/refresh-installation.js) | Edit | Protect new wiring from regeneration |
| [scripts/update/lib/validator.js](scripts/update/lib/validator.js) | Edit | Validate the new agent in doctor checks |
| `tests/unit/team-factory-wiring.test.js` (new) | Create | Test manifest, skill, and naming convention |

### Testing Standards

- Tests live in `tests/unit/` for unit tests and `tests/lib/` for library-level tests. Check both directories to find where existing manifest/agent tests live and follow that convention.
- Use Node's built-in test runner (`node --test`) — see `package.json` `scripts.test` for the command.
- New tests should be **deterministic** — no network, no real file modifications outside test fixtures, no time-dependent assertions.
- Coverage expectation: any new code touching `refresh-installation.js` or `validator.js` should have unit tests covering the protection logic.

### Architecture Compliance

Per [arch-artifact-governance-portfolio.md](_bmad-output/planning-artifacts/arch-artifact-governance-portfolio.md) and the broader Convoke architecture:

- **Never hardcode version strings** — not relevant to this story (no version logic)
- **Never use `process.cwd()` directly** — use `findProjectRoot()`. Relevant if any new validator code reads files.
- **Append-only migrations** — not relevant (no migration file in this story)
- **`_bmad/` directory paths are NOT renamed** — relevant: keep the path field exactly as specified

### Previous Story Intelligence

The Artifact Governance epic (Epics 1–5) shipped recently. Key patterns from that work:
- All five Epic 5 stories (`ag-5-1`, `ag-5-2`, `ag-5-3`) integrated with existing platform surfaces (`convoke-update`, `convoke-doctor`, `bmad-create-prd`) by **adding** to existing files, not refactoring them. This story should follow the same additive principle.
- The recent commits show focused, surgical edits to specific files — no sweeping refactors. Match that style.

### Risk Notes

1. **Refresh-installation regeneration risk** — If Task 3 is skipped, the next time `convoke-update` runs against this project, it could wipe the manually-added manifest row. Task 3 is **not optional**.
2. **Skill directory cleanup risk** — Same issue — `refresh-installation.js` has logic that deletes "stale" skill dirs not in its known list. Confirm the cleanup logic respects the `EXTRA_BME_SKILLS` whitelist.
3. **Test suite scope** — The new tests should not cause existing tests to fail. If existing tests assert "exactly N bme agents," they will need updating to N+1.

### References

- [_bmad/bme/_team-factory/agents/team-factory.md](_bmad/bme/_team-factory/agents/team-factory.md) — Loom Master agent definition
- [_bmad/_config/agent-manifest.csv](_bmad/_config/agent-manifest.csv) — Manifest to extend
- [scripts/update/lib/refresh-installation.js](scripts/update/lib/refresh-installation.js) — Regeneration logic to protect against
- [scripts/update/lib/validator.js](scripts/update/lib/validator.js) — Validator to extend
- [scripts/update/lib/agent-registry.js](scripts/update/lib/agent-registry.js) — Reference for the registry pattern (don't modify unless taking the alternative approach)
- [.claude/skills/bmad-agent-bme-contextualization-expert/SKILL.md](.claude/skills/bmad-agent-bme-contextualization-expert/SKILL.md) — Reference SKILL.md to mirror
- [_bmad-output/planning-artifacts/epic-artifact-governance-portfolio.md#Epic 6](_bmad-output/planning-artifacts/epic-artifact-governance-portfolio.md) — Parent epic with full context

## Dev Agent Record

### Agent Model Used

(to be filled in by dev agent)

### Debug Log References

### Completion Notes List

### File List
