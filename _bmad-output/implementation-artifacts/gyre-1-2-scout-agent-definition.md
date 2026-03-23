# Story 1.2: Scout Agent Definition

Status: done

## Story

As a user,
I want to activate Scout and have it greet me and show its menu,
So that I can start a stack analysis conversation.

## Acceptance Criteria

1. **Given** the Scout agent file is created at `_bmad/bme/_gyre/agents/stack-detective.md`
   **When** the agent is activated
   **Then** it follows the XML activation protocol:
   - Step 1: Load persona from agent file
   - Step 2: Load `_bmad/bme/_gyre/config.yaml` — error handling if missing or invalid
   - Step 3: Store user_name from config
   - Step 4: Greet user by name, communicate in configured language, display numbered menu
   - Step 5: Wait for user input (number, text, or fuzzy match)
   - Step 6: Process input via menu handlers
   - Step 7: Execute selected menu item
   **And** Scout's menu includes: [1] Detect Stack, [2] Full Analysis
   **And** menu items use `exec` handler type pointing to workflow.md files (epic says "workflow handler" but Gyre step-file workflows use exec, matching Vortex pattern)
   **And** Scout's persona is "methodical investigator" — reports evidence, never guesses

## Tasks / Subtasks

- [x] Task 1: Validate existing Scout agent file against ACs (AC: #1)
  - [x] 1.1 Verify frontmatter has `name: "stack detective"` and `description`
  - [x] 1.1b Verify XML agent attributes: id=`stack-detective.agent.yaml`, name=`Scout`, title=`Stack Detective`, icon=`🔎`
  - [x] 1.2 Verify XML activation protocol has all 7 steps plus HELP_STEP (between Step 4 and Step 5) in correct order
  - [x] 1.3 Verify Step 2 loads `_bmad/bme/_gyre/config.yaml` with error handling for missing file and missing fields
  - [x] 1.4 Verify Step 4 greets user by `{user_name}`, communicates in `{communication_language}`, displays numbered menu
  - [x] 1.5 Verify Step 5 waits for user input (number, text, or fuzzy match)
  - [x] 1.6 Verify menu handlers section includes exec, data, and workflow handler types

- [x] Task 2: Validate menu items (AC: #1)
  - [x] 2.1 Verify menu includes [DS] Detect Stack pointing to `workflows/stack-detection/workflow.md`
  - [x] 2.2 Verify menu includes [FA] Full Analysis pointing to `workflows/full-analysis/workflow.md`
  - [x] 2.3 Verify menu items use `exec` handler with correct paths (not `workflow` handler — Gyre uses exec for step-file workflows)
  - [x] 2.4 Verify standard menu items present: [MH] Menu Help, [CH] Chat, [PM] Party Mode (pointing to `_bmad/core/workflows/party-mode/workflow.md`), [DA] Dismiss Agent

- [x] Task 3: Validate persona definition (AC: #1)
  - [x] 3.1 Verify persona role is "Technology Stack Detective + Architecture Classification Specialist"
  - [x] 3.2 Verify identity describes "methodical investigator" who reports evidence, never guesses
  - [x] 3.3 Verify communication_style is evidence-driven with source references
  - [x] 3.4 Verify principles include: evidence over inference, guard question rules, privacy boundary, secondary stack warnings

- [x] Task 4: Validate Scout-specific rules (AC: #1)
  - [x] 4.1 Verify rules include: never guess, guard ≤3 questions, GC1 privacy boundary, secondary stack handling
  - [x] 4.2 Verify rules include communication language enforcement

- [x] Task 5: Fix any discrepancies found in Tasks 1-4 — No discrepancies found

## Dev Notes

### Pre-existing File

The file `_bmad/bme/_gyre/agents/stack-detective.md` already exists from the 2026-03-21 architecture scaffolding session. This story validates the existing file against the ACs rather than creating from scratch. Fix any discrepancies found.

### Architecture Reference — Scout Agent

From `architecture-gyre.md`, Scout's definition:

- **Agent ID:** `stack-detective`
- **Name:** Scout
- **Icon:** 🔎
- **Role:** Detects project's technology stack by analyzing filesystem artifacts. Asks guard questions. Produces Stack Profile (GC1).
- **Persona:** Methodical investigator. Reads manifests, configs, IaC files. Never guesses — reports what it finds with evidence. Asks targeted guard questions.
- **Tools used:** Glob (find files), Grep (search contents), Read (read configs), Bash (run package managers)

**Detection targets:**
- Primary language/framework (package.json, go.mod, requirements.txt, Cargo.toml, pom.xml)
- Container orchestration (Dockerfile, docker-compose.yaml, k8s manifests, ECS task defs)
- CI/CD platform (.github/workflows/, .gitlab-ci.yml, Jenkinsfile)
- Observability tooling (OpenTelemetry, Prometheus, Datadog configs)
- Cloud provider (terraform/, cloudformation/, pulumi/)
- Communication protocol (gRPC protos, REST controllers, message queue configs)

**Guard questions:** Derived from detection (not fixed list), ≤3, cover deployment model + communication protocol + ambiguous detections. Skip if unambiguous.

**Menu items:**
1. Detect Stack — `workflow: stack-detection`
2. Full Analysis — `workflow: full-analysis`

### XML Activation Protocol Pattern

Must follow the exact Vortex agent pattern (see `_bmad/bme/_vortex/agents/contextualization-expert.md`):

1. Step 1: Load persona from agent file
2. Step 2: MANDATORY config loading with error handling (two error cases: file missing, fields missing)
3. Step 3: Store user_name
4. Step 4: Greet + display menu
5. HELP_STEP: Show `/bmad-help` tip
6. Step 5: STOP and wait for input
7. Step 6: Input routing (number, text, fuzzy match, no match)
8. Step 7: Extract handler attributes and execute

**Menu handler types:** exec, data, workflow — all three must be present in `<menu-handlers>`.

**Gyre enhancement:** Scout's `exec` handler includes file-existence error handling (check if file exists, display error message if not found) that the Vortex pattern does not have. This is an intentional improvement — do NOT strip it to match Vortex.

### Menu Handler Type Clarification

The AC says "menu items use `workflow` handler type." However, Gyre step-file workflows use `exec` handler (load and follow the workflow.md file directly), not the `workflow` handler (which loads workflow.xml core OS for BMAD YAML workflows). This matches the existing Vortex pattern where step-file workflows use `exec`.

Validate that the existing file uses `exec` handler for DS and FA menu items.

### Rules Section Checklist

Scout-specific rules that must appear in `<rules>`:
- Communicate in `{communication_language}`
- Stay in character until exit
- Load files ONLY when executing user-chosen workflow (exception: config.yaml)
- Never guess — report only what evidence supports
- Guard questions ≤3, skip if unambiguous
- GC1 privacy boundary: technology categories only, NOT file contents/paths/versions/secrets
- Secondary stacks: surface as warning, select primary for model

### What NOT to Modify

- **Do NOT modify config.yaml** — Already validated in Story 1.1
- **Do NOT modify README.md** — Already validated in Story 1.1
- **Do NOT create workflow files** — Story 1.3 creates stack-detection workflow
- **Do NOT create contract files** — Story 1.4 creates GC1 contract

### Previous Story Intelligence

From Story 1.1 completion notes:
- Module structure pre-existed from architecture scaffolding (2026-03-21)
- Config.yaml matched spec exactly
- README.md required 4 factual corrections (Lens role, contract flows, delta-report ownership)
- Code review found that pre-existing files need validation rather than creation
- .gitkeep files added to directories that already had content (redundant but harmless)

**Key learning:** Pre-existing files may have minor inconsistencies with the final spec. Validate thoroughly against ACs and architecture doc.

### Project Structure Notes

- Agent file location: `_bmad/bme/_gyre/agents/stack-detective.md`
- Config path referenced in Step 2: `{project-root}/_bmad/bme/_gyre/config.yaml`
- Workflow paths in menu: `{project-root}/_bmad/bme/_gyre/workflows/stack-detection/workflow.md` and `{project-root}/_bmad/bme/_gyre/workflows/full-analysis/workflow.md`

### References

- [Source: _bmad-output/planning-artifacts/epic-gyre.md — Story 1.2 ACs, lines 293-313]
- [Source: _bmad-output/planning-artifacts/architecture-gyre.md — Scout agent definition, Agent 1 section]
- [Source: _bmad/bme/_vortex/agents/contextualization-expert.md — XML activation protocol pattern reference]
- [Source: _bmad/bme/_gyre/agents/stack-detective.md — Pre-existing file to validate]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

None — no errors encountered.

### Completion Notes List

- All 19 validation subtasks passed — zero discrepancies found
- Pre-existing `stack-detective.md` matches all ACs exactly as specified
- No modifications to the agent file were required (Task 5 confirmed clean)
- XML activation protocol follows Vortex pattern with Gyre-specific enhancements (exec error handling)
- All 6 menu items present with correct handlers and paths
- Persona, communication style, principles, and rules all match architecture spec
- This is a validation-only story — no files were created or modified

### Change Log

- 2026-03-23: Validated existing agent file — all checks passed, no changes needed

### File List

- `_bmad/bme/_gyre/agents/stack-detective.md` (validated, no changes)
