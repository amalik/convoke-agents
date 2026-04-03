# Story 2.10: BMad Master Wiring Verification

Status: ready-for-dev

## Story

As a framework contributor,
I want the Team Factory to be discoverable through BMad Master's "what's available?" response,
so that I can find the factory through conversational routing without knowing it exists in advance.

## Context

This story closes the AC 2.1.1 partial gap identified during the April 2nd AC confrontation (`tf-2-workflow-layer-increment-2026-04-02.md`). The confrontation found that BMad Master wiring "could not be verified from the 28 shipped files alone."

**Discovery during analysis:** BMad Master already has a TF menu item at line 54 of `_bmad/core/agents/bmad-master.md`:
```
<item cmd="TF or fuzzy match on team-factory or create-team" exec="skill:bmad-team-factory">[TF] Team Factory</item>
```

This story verifies the wiring is complete and functional, and documents the verification.

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

- [ ] Task 1: Verify BMad Master menu item (AC: #1)
  - [ ] Read `_bmad/core/agents/bmad-master.md` and confirm TF item exists
  - [ ] Confirm the `exec="skill:bmad-team-factory"` handler syntax is correct
  - [ ] Confirm cmd triggers include "team-factory", "create-team", "TF"

- [ ] Task 2: Verify skill activation chain (AC: #2, #3)
  - [ ] Confirm `.claude/skills/bmad-agent-bme-team-factory/SKILL.md` exists and points to correct agent file
  - [ ] Confirm `_bmad/bme/_team-factory/agents/team-factory.md` loads config from correct path
  - [ ] Confirm agent activation step 2 references `_bmad/bme/_team-factory/config.yaml`

- [ ] Task 3: Document all 4 surfaces (AC: #4)
  - [ ] Agent menu: `team-factory.md` — CT, RS, EX, VT, AR, PM, DA items
  - [ ] module-help.csv: 2 rows (Create Team, Validate Team)
  - [ ] BMad Master: TF menu item with skill exec
  - [ ] Skill entry: `.claude/skills/bmad-agent-bme-team-factory/SKILL.md`
  - [ ] Update AC confrontation document to mark 2.1.1 as ✅ Met

## Dev Notes

- This is primarily a **verification story**, not an implementation story
- BMad Master wiring already exists — discovered during story analysis
- The gap was a verification gap, not a code gap
- The `.claude/skills/` directory is gitignored — skill entry is local only
- If any wiring is broken, fix it; if all wiring works, document and close

### References

- [Source: _bmad/core/agents/bmad-master.md:54] — TF menu item
- [Source: .claude/skills/bmad-agent-bme-team-factory/SKILL.md] — Skill entry
- [Source: _bmad/bme/_team-factory/agents/team-factory.md] — Agent definition
- [Source: _bmad-output/implementation-artifacts/tf-2-workflow-layer-increment-2026-04-02.md] — AC confrontation

## Dev Agent Record

### Agent Model Used

### Completion Notes List

### File List
