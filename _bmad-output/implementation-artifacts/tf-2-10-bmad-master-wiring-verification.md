# Story 2.10: BMad Master Wiring Verification

Status: review

## Story

As a framework contributor,
I want the Team Factory to be discoverable through BMad Master's "what's available?" response,
so that I can find the factory through conversational routing without knowing it exists in advance.

## Context

This story closes the AC 2.1.1 partial gap identified during the April 2nd AC confrontation (`tf-2-workflow-layer-increment-2026-04-02.md`). The confrontation found that BMad Master wiring "could not be verified from the 28 shipped files alone."

**Discovery during analysis:** BMad Master has a TF menu item at line 54 of `_bmad/core/agents/bmad-master.md`:
```
<item cmd="TF or fuzzy match on team-factory or create-team" exec="skill:bmad-team-factory">[TF] Team Factory</item>
```

**Bug found during story review:** The exec handler references `skill:bmad-team-factory` but the actual skill directory is `bmad-agent-bme-team-factory`. This is a naming mismatch — the wiring is **broken**, not just unverified. This story fixes the mismatch and verifies the complete chain.

## Acceptance Criteria

1. **Given** BMad Master is activated
   **When** a contributor asks "what's available?" or browses the menu
   **Then** Team Factory appears as a menu item with a clear description

2. **Given** BMad Master shows Team Factory in its menu
   **When** the contributor selects TF or types "create team" or "team factory"
   **Then** the factory agent activates correctly via the `exec="skill:bmad-team-factory"` handler

3. **Given** the Team Factory skill at `.claude/skills/bmad-agent-bme-team-factory/SKILL.md`
   **When** invoked by BMad Master
   **Then** it loads the agent file at `_bmad/bme/_team-factory/agents/team-factory.md` and activates

4. **Given** all 4 discovery surfaces are checked
   **When** verified against TF-FR14 and TF-NFR10
   **Then** the factory is reachable via: agent menu (team-factory.md), module-help.csv, BMad Master menu, and skill entry point

## Tasks / Subtasks

- [x] Task 1: Fix and verify BMad Master menu item (AC: #1, #2)
  - [x] Read `_bmad/core/agents/bmad-master.md` and confirm TF item exists
  - [x] Fix exec handler: change `exec="skill:bmad-team-factory"` to `exec="skill:bmad-agent-bme-team-factory"` to match the actual skill directory name
  - [x] Confirm cmd triggers include "team-factory", "create-team", "TF"

- [x] Task 2: Verify skill activation chain (AC: #2, #3)
  - [x] Confirm `.claude/skills/bmad-agent-bme-team-factory/SKILL.md` exists and points to correct agent file
  - [x] Confirm `_bmad/bme/_team-factory/agents/team-factory.md` loads config from correct path
  - [x] Confirm agent activation step 2 references `_bmad/bme/_team-factory/config.yaml`

- [ ] Task 3: Document all 4 surfaces (AC: #4)
  - [x] Agent menu: `team-factory.md` — CT, RS, EX, VT, AR, PM, DA items
  - [x] module-help.csv: 2 rows (Create Team, Validate Team)
  - [x] BMad Master: TF menu item with skill exec
  - [x] Skill entry: `.claude/skills/bmad-agent-bme-team-factory/SKILL.md`
  - [x] Update AC confrontation document to mark 2.1.1 as ✅ Met

## Dev Notes

- This is a **verification + fix story** — the exec handler has a naming mismatch
- BMad Master menu item exists but references wrong skill name (`bmad-team-factory` vs `bmad-agent-bme-team-factory`)
- The `.claude/skills/` directory is gitignored — skill entry is local only
- If any wiring is broken, fix it; if all wiring works, document and close

### References

- [Source: _bmad/core/agents/bmad-master.md:54] — TF menu item
- [Source: .claude/skills/bmad-agent-bme-team-factory/SKILL.md] — Skill entry
- [Source: _bmad/bme/_team-factory/agents/team-factory.md] — Agent definition
- [Source: _bmad-output/implementation-artifacts/tf-2-workflow-layer-increment-2026-04-02.md] — AC confrontation

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (1M context)

### Completion Notes List

- Fixed BMad Master exec handler: `skill:bmad-team-factory` → `skill:bmad-agent-bme-team-factory` at `_bmad/core/agents/bmad-master.md:54`
- Verified complete activation chain: BMad Master → SKILL.md → team-factory.md → config.yaml
- All 4 discovery surfaces confirmed: agent menu, module-help.csv, BMad Master, skill entry
- Updated AC confrontation document: AC 2.1.1 upgraded from ⚠️ Partially met to ✅ Met
- 156 tests pass, zero regressions

### Change Log

- 2026-04-03: Fixed exec handler naming mismatch, verified all 4 discovery surfaces, updated AC confrontation

### File List

- `_bmad/core/agents/bmad-master.md` — Fixed exec handler (line 54)
- `_bmad-output/implementation-artifacts/tf-2-workflow-layer-increment-2026-04-02.md` — Updated AC 2.1.1 verdict
