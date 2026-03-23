# Story 4.1: Coach Agent Definition

Status: done

## Story

As a user,
I want to activate Coach and have it offer review and feedback options,
So that I can customize the capabilities model and report missed gaps.

## Acceptance Criteria

1. **Given** the Coach agent file is created at `_bmad/bme/_gyre/agents/review-coach.md`
   **When** the agent is activated
   **Then** it follows the XML activation protocol:
   - Step 1: Load persona from agent file
   - Step 2: Load `_bmad/bme/_gyre/config.yaml` — error handling if missing or invalid
   - Step 3: Store user_name from config
   - Step 4: Greet user by name, communicate in configured language, display numbered menu
   - HELP_STEP: Show `/bmad-help` tip
   - Step 5: Wait for user input (number, text, or fuzzy match)
   - Step 6: Process input via menu handlers
   - Step 7: Execute selected menu item

2. **And** Coach's menu includes: [RF] Review Findings, [RM] Review Model, [FA] Full Analysis
   **And** menu items use `exec` handler type pointing to workflow.md files

3. **And** Coach's persona is "patient guide" — respects user expertise, presents clearly, never pushes

## Tasks / Subtasks

- [x] Task 1: Validate existing Coach agent file structure (AC: #1)
  - [x] 1.1 Verify frontmatter has `name: "review coach"` and `description` — confirmed lines 2-3
  - [x] 1.2 Verify XML agent attributes: id=`review-coach.agent.yaml`, name=`Coach`, title=`Review Coach`, icon=`🏋️` — confirmed line 9
  - [x] 1.3 Verify XML activation protocol has all 7 steps plus HELP_STEP (between Step 4 and Step 5) in correct order — confirmed lines 11-43
  - [x] 1.4 Verify Step 2 loads `_bmad/bme/_gyre/config.yaml` with error handling for missing file (lines 14-24) AND missing fields (lines 26-34) — two separate error blocks confirmed
  - [x] 1.5 Verify Step 4 greets user by `{user_name}`, communicates in `{communication_language}`, displays numbered menu — confirmed line 39
  - [x] 1.6 Verify Step 5 waits for user input (number, text, or fuzzy match) — confirmed line 41
  - [x] 1.7 Verify menu handlers section includes exec (lines 47-69), data (lines 70-74), and workflow (lines 76-85) handler types — all three present

- [x] Task 2: Validate menu items (AC: #2)
  - [x] 2.1 Verify menu includes [RF] Review Findings pointing to `workflows/model-review/workflow.md` via exec handler — confirmed line 123
  - [x] 2.2 Verify menu includes [RM] Review Model pointing to `workflows/model-review/workflow.md` via exec handler — confirmed line 124
  - [x] 2.3 Verify menu includes [FA] Full Analysis pointing to `workflows/full-analysis/workflow.md` via exec handler — confirmed line 125
  - [x] 2.4 Verify standard menu items present: [MH] Menu Help (line 121), [CH] Chat (line 122), [PM] Party Mode → `_bmad/core/workflows/party-mode/workflow.md` (line 126), [DA] Dismiss Agent (line 127) — confirmed

- [x] Task 3: Validate persona definition (AC: #3)
  - [x] 3.1 Verify persona role is "Guided Review + Amendment + Feedback Capture Specialist" — confirmed line 104
  - [x] 3.2 Verify identity describes "patient guide" who walks users through capabilities model and findings report — confirmed lines 105-116
  - [x] 3.3 Verify communication_style is patient and respectful — presents clearly, never pushes, celebrates progress — confirmed line 117
  - [x] 3.4 Verify principles include: user knows best, amendments persist, feedback improves model, never push severity, review is optional/deferrable — all 5 confirmed line 118

- [x] Task 4: Validate Coach-specific rules (AC: #1, #3)
  - [x] 4.1 Verify rules include: GC3 (Findings Report) must be loaded before reviewing findings — confirmed line 94
  - [x] 4.2 Verify rules include: GC2 (Capabilities Manifest) must be loaded before model review — confirmed line 95
  - [x] 4.3 Verify rules include: Present findings severity-first (blockers → recommended → nice-to-have) — confirmed line 96
  - [x] 4.4 Verify rules include: Never push — present options and let the user decide — confirmed line 97
  - [x] 4.5 Verify rules include: Amendments written directly to capabilities.yaml with amended/removed flags — confirmed line 98
  - [x] 4.6 Verify rules include: Feedback persisted to .gyre/feedback.yaml with timestamp — confirmed line 99
  - [x] 4.7 Verify rules include: Amended artifacts must not contain source code or secrets (NFR9) — confirmed line 100
  - [x] 4.8 Verify rules include: Communication language enforcement — confirmed line 90

- [x] Task 5: Cross-reference with Story 3.1 (Lens) and Story 2.2 (Atlas) validation pattern
  - [x] 5.1 Verify Coach follows same XML activation protocol structure as Atlas/Scout/Lens — identical 7-step + HELP_STEP structure confirmed
  - [x] 5.2 Verify error handling messages reference "Coach" — config: "Coach to operate" (line 17), workflow: "Coach to run review activities" (line 56) — confirmed
  - [x] 5.3 Verify workflow error message references "Coach to run review activities" — confirmed line 56

- [x] Task 6: Fix any discrepancies found in Tasks 1-5 — No discrepancies found

## Dev Notes

### Pre-existing File — Validation Approach

The file `_bmad/bme/_gyre/agents/review-coach.md` already exists from the 2026-03-21 architecture scaffolding (131 lines). This story validates the existing file against the ACs and architecture spec. Fix any discrepancies found.

### Architecture Reference — Coach Agent

From `architecture-gyre.md`:

- **Agent ID:** `review-coach`
- **Name:** Coach
- **Icon:** 🏋️
- **Role:** Guides user through reviewing findings and amending capabilities manifest. Captures feedback on missed gaps.
- **Persona:** Patient guide who respects user expertise. Presents clearly, never pushes.
- **Tools used:** Read (load findings, load manifest), Write (write amended manifest, write feedback), Edit (modify capabilities.yaml)

**Review process:**
1. Load GC3 (Findings Report)
2. Present severity-first summary: "X blockers, Y recommended, Z nice-to-have"
3. Present novelty ratio: "X of Y findings are contextual"
4. Walk through findings by severity (blockers first)
5. For each compound finding: show reasoning chain
6. Ask: "Would you like to review your capabilities manifest?"
   - If yes: walkthrough mode — present each capability with keep/remove/edit
   - If later: set deferred flag, remind on next run
7. Feedback prompt: "Did Gyre miss anything you know about?"
   - Persist to `.gyre/feedback.yaml` with timestamp
   - Explain: "Commit feedback.yaml to share improvements with your team"

**Amendment persistence:** Amendments written directly to `.gyre/capabilities.yaml`. On regeneration, Atlas respects amendments via GC4 (Feedback Loop).

**Output:** GC4 (Feedback Loop) — amendments + feedback written to `.gyre/`

**Menu items (architecture spec):**
1. Review Findings — `workflow: model-review` (loads most recent findings)
2. Review Model — `workflow: model-review` (capabilities walkthrough only)
3. Full Analysis — `workflow: full-analysis`

### XML Activation Protocol Pattern

All Gyre agents follow identical structure:
- Steps 1-7 + HELP_STEP between 4 and 5
- Step 2: config.yaml load with dual error handling (file missing + fields missing)
- Step 4: Greet by name, display menu
- Step 5: Wait for input
- Step 6: Process via handlers (exec, data, workflow)
- Step 7: Execute menu item

### What NOT to Modify

- **Do NOT modify Lens agent file** — Already validated in Story 3.1
- **Do NOT modify Atlas agent file** — Already validated in Story 2.2
- **Do NOT modify Scout agent file** — Already validated in Story 1.2
- **Do NOT modify any workflow files** — Validated in earlier stories
- **Do NOT modify config.yaml** — Shared configuration

### Previous Story Intelligence

From Story 3.1 (Lens agent definition) completion notes:
- All 25 validation subtasks passed across 6 tasks — zero discrepancies
- Same validation pattern applies: frontmatter → XML structure → activation steps → menu items → persona → rules → cross-reference
- Error handling messages must reference the specific agent name ("Coach to operate", "Coach to run review activities")
- Workflow error messages in exec handler must reference agent-specific context

From Story 3.6 (full-analysis steps 4-5) completion notes:
- step-05-review-findings.md (129 lines) validated — this is Coach's integration point in full-analysis
- Review prompt with 3 options (walk through now / later / skip) confirmed (FR43/FR55)
- Model-review workflow delegation from step-05 confirmed

### Project Structure Notes

- Coach agent file: `_bmad/bme/_gyre/agents/review-coach.md`
- Model-review workflow: `_bmad/bme/_gyre/workflows/model-review/`
- Full-analysis workflow: `_bmad/bme/_gyre/workflows/full-analysis/`
- GC3 contract (Coach input): `_bmad/bme/_gyre/contracts/gc3-findings-report.md`
- GC4 contract (Coach output): `_bmad/bme/_gyre/contracts/gc4-feedback-loop.md`

### References

- [Source: _bmad-output/planning-artifacts/epic-gyre.md — Story 4.1 ACs]
- [Source: _bmad-output/planning-artifacts/architecture-gyre.md — Coach agent definition]
- [Source: _bmad/bme/_gyre/agents/review-coach.md — Pre-existing file (131 lines)]
- [Source: _bmad-output/implementation-artifacts/gyre-3-1-lens-agent-definition.md — Story 3.1 validation pattern]
- [Source: _bmad-output/implementation-artifacts/gyre-3-6-full-analysis-steps-4-5-integration.md — Coach integration point]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

None — no errors encountered.

### Completion Notes List

- All 26 validation subtasks passed across 6 tasks and 1 file — zero discrepancies found
- Task 1 (file structure, 131 lines): Frontmatter (name/description), XML agent attributes (id/name/title/icon), activation protocol (7 steps + HELP_STEP), Step 2 dual error handling (missing file + missing fields), Step 4 greeting, Step 5 wait, menu handlers (exec/data/workflow) — all correct
- Task 2 (menu items): [RF] Review Findings → model-review/workflow.md, [RM] Review Model → model-review/workflow.md, [FA] Full Analysis → full-analysis/workflow.md, standard items [MH]/[CH]/[PM]/[DA] — all correct
- Task 3 (persona): Role (Guided Review + Amendment + Feedback Capture Specialist), identity (patient guide), communication_style (patient/respectful/celebrates progress), 5 principles (user knows best, amendments persist, feedback improves model, never push severity, review optional) — all correct
- Task 4 (Coach-specific rules): GC3 before findings review, GC2 before model review, severity-first presentation, never push, amendments to capabilities.yaml with flags, feedback to feedback.yaml with timestamp, NFR9 no source code/secrets, communication language — all 8 rules confirmed
- Task 5 (cross-reference): Identical XML structure to Atlas/Scout/Lens, error messages reference "Coach" specifically ("Coach to operate", "Coach to run review activities") — all correct
- Task 6 (fix): No discrepancies found — first clean validation in Epic 4
- This is a validation-only story — no files were created or modified

### Change Log

- 2026-03-23: Full validation of review-coach.md (131 lines) — all checks passed, no changes needed

### File List

- `_bmad/bme/_gyre/agents/review-coach.md` (validated, no changes)
