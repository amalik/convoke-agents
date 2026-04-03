# Story 2.11: Team Factory End-to-End Pilot Run

Status: ready-for-dev

## Story

As a framework contributor,
I want to validate the Team Factory by creating a real team through the full 6-step conversational flow,
so that we have confidence the factory works end-to-end before using it to scaffold Forge.

## Context

This story closes the AC 2.9.4 partial gap from the April 2nd AC confrontation. The M2 validation tested individual JS modules (spec write/parse, cascade logic, collision detection) but **nobody has ever invoked the factory agent and walked through the complete guided flow to create a team**.

This is the real validation — the factory agent activates, guides the contributor through scope → connect → review → generate → validate, and produces a working team module.

**Test candidate:** Create a small Independent pattern test team (simplest path — no contracts, no pipeline). This validates the factory without the complexity of Sequential. If Independent works, Sequential confidence is high (the JS modules already handle it).

**Important constraints:**
- BMB template externalization (P1/P6) is not done — Step 4 (Generate) will use BMB delegation via LLM prompting, not shared templates
- The pilot should produce a real team module at `_bmad/bme/_pilot-test/` that can be validated and then deleted
- This is a **manual test** — the contributor (Amalik) walks through the factory, not an automated test

## Acceptance Criteria

1. **Given** the Team Factory agent is invoked via `/bmad-agent-bme-team-factory`
   **When** the agent activates
   **Then** config loads from `_bmad/bme/_team-factory/config.yaml`, greeting displays, and menu is presented

2. **Given** the contributor selects "Create Team" from the menu
   **When** step-00-route executes
   **Then** intent is classified as "create team" and flow proceeds to step-01-scope

3. **Given** the contributor defines a 2-agent Independent team
   **When** step-01-scope executes
   **Then** naming is enforced, overlap detection runs (L1+L2), cascade eliminates 5 Sequential-only decisions, and a spec file is created

4. **Given** the contributor completes integration decisions (output directory, compass routing)
   **When** step-02-connect executes
   **Then** spec file is updated with integration section (no contracts for Independent)

5. **Given** all decisions are complete
   **When** step-03-review presents the decision summary
   **Then** all decisions are displayed in a structured table, validation passes, and contributor can approve

6. **Given** the contributor approves
   **When** step-04-generate executes
   **Then** agent files, workflow files, config.yaml, module-help.csv, README, and registry block are created. Registry write uses Full Write Safety Protocol

7. **Given** generation is complete
   **When** step-05-validate executes
   **Then** end-to-end validation passes, file manifest is displayed, and the team module at `_bmad/bme/_pilot-test/` is structurally valid

8. **Given** the pilot team passes validation
   **When** cleanup is requested
   **Then** the pilot team module and its registry block can be cleanly removed without affecting existing teams

## Tasks / Subtasks

- [ ] Task 1: Invoke factory and complete Step 0 — Route (AC: #1, #2)
  - [ ] Run `/bmad-agent-bme-team-factory`
  - [ ] Verify activation, config load, menu display
  - [ ] Select "Create Team"
  - [ ] Verify routing to step-01-scope

- [ ] Task 2: Complete Step 1 — Scope (AC: #3)
  - [ ] Define team: "Pilot Test" / `pilot-test` / Independent pattern
  - [ ] Define 2 agents: `alpha-tester` (role: "Test agent A") and `beta-tester` (role: "Test agent B")
  - [ ] Verify naming enforcement catches bad names
  - [ ] Verify collision detection finds no blocks for novel IDs
  - [ ] Verify cascade eliminates: pipeline-order, handoff-contracts, feedback-contracts, contract-prefix, orchestration-workflow
  - [ ] Verify spec file created at `_bmad-output/planning-artifacts/team-spec-pilot-test.yaml`

- [ ] Task 3: Complete Step 2 — Connect (AC: #4)
  - [ ] Set output directory: `_bmad-output/pilot-test-artifacts`
  - [ ] Set compass routing: `per-agent` (Independent default)
  - [ ] Verify no contract prompts appear (Independent pattern)
  - [ ] Verify spec file updated

- [ ] Task 4: Complete Step 3 — Review (AC: #5)
  - [ ] Verify decision summary displays all choices
  - [ ] Verify validation passes
  - [ ] Approve decisions

- [ ] Task 5: Complete Step 4 — Generate (AC: #6)
  - [ ] Verify agent .md files created with activation XML
  - [ ] Verify workflow files created
  - [ ] Verify config.yaml created with correct fields
  - [ ] Verify module-help.csv created with correct header
  - [ ] Verify registry block added to agent-registry.js
  - [ ] Verify Write Safety Protocol executed (dirty-tree check, backup, verify)

- [ ] Task 6: Complete Step 5 — Validate (AC: #7)
  - [ ] Verify end-to-end validation passes
  - [ ] Verify file manifest displayed
  - [ ] Verify metrics questions asked

- [ ] Task 7: Cleanup (AC: #8)
  - [ ] Remove `_bmad/bme/_pilot-test/` directory
  - [ ] Remove pilot team registry block from `agent-registry.js`
  - [ ] Remove spec file
  - [ ] Verify 156 existing tests still pass after cleanup
  - [ ] Document any issues discovered during the pilot

## Dev Notes

- This is a **manual walkthrough**, not an automated test
- The contributor (Amalik) drives the conversation; the factory agent guides
- BMB delegation in Step 4 will use LLM prompting since shared templates don't exist yet (P12 dependency)
- If the factory breaks at any step, document the failure, fix it, and continue
- After successful pilot, consider creating an automated smoke test for regression

### Key Files Involved

- Agent: `_bmad/bme/_team-factory/agents/team-factory.md`
- Steps: `_bmad/bme/_team-factory/workflows/step-00-route.md` through `step-05-validate.md`
- JS: cascade-logic, collision-detector, spec-parser, spec-writer, spec-differ
- Schemas: schema-independent.json
- Registry: `scripts/update/lib/agent-registry.js` (shared file — Full Write Safety Protocol)
- Validator: `_bmad/bme/_team-factory/lib/validators/end-to-end-validator.js`

### Previous Story Intelligence

From AC confrontation (`tf-2-workflow-layer-increment-2026-04-02.md`):
- 18/23 ACs met, 5 partial — this pilot validates the runtime behavior the confrontation couldn't check
- Code review fixed 11 issues including 2 critical — all fixes are in place
- M2 validation confirmed JS modules work in isolation — this tests them orchestrated

### Risk

- **BMB delegation without templates** — Step 4 relies on LLM to generate agent files. Quality depends on prompt quality in step-04-generate.md. If agent files are malformed, activation-validator.js should catch it.
- **Registry write on real agent-registry.js** — Full Write Safety Protocol protects, but ensure git working tree is clean before starting.

### References

- [Source: _bmad-output/planning-artifacts/epic-team-factory.md] — Epic 2 Stories 2.1-2.9
- [Source: _bmad-output/implementation-artifacts/tf-2-workflow-layer-increment-2026-04-02.md] — AC confrontation
- [Source: _bmad-output/planning-artifacts/architecture-team-factory.md] — Architecture decisions
- [Source: _bmad-output/implementation-artifacts/tf-epic-2-retro-supplement-2026-04-03.md] — Retro findings

## Dev Agent Record

### Agent Model Used

### Completion Notes List

### File List
