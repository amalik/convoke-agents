# Story 2.2: Atlas Agent Definition

Status: review

## Story

As a user,
I want to activate Atlas and have it offer to generate or review my capabilities model,
So that I can get a contextual readiness model for my stack.

## Acceptance Criteria

1. **Given** the Atlas agent file is created at `_bmad/bme/_gyre/agents/model-curator.md`
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

2. **And** Atlas's menu includes: [1] Generate Model, [2] Regenerate Model, [3] Full Analysis
   **And** menu items use `exec` handler type pointing to workflow.md files (Gyre uses exec, matching Vortex pattern)

3. **And** Atlas's persona is "knowledgeable curator" — balances standards with practical relevance, transparent about confidence

## Tasks / Subtasks

- [x] Task 1: Validate existing Atlas agent file structure against ACs (AC: #1)
  - [x] 1.1 Verify frontmatter has `name: "model curator"` and `description` — confirmed line 2-3
  - [x] 1.2 Verify XML agent attributes: id=`model-curator.agent.yaml`, name=`Atlas`, title=`Model Curator`, icon=`📐` — confirmed line 9
  - [x] 1.3 Verify XML activation protocol has all 7 steps plus HELP_STEP (between Step 4 and Step 5) in correct order — confirmed lines 11-43
  - [x] 1.4 Verify Step 2 loads `_bmad/bme/_gyre/config.yaml` with error handling for missing file AND missing fields (two distinct error cases) — confirmed lines 12-36
  - [x] 1.5 Verify Step 4 greets user by `{user_name}`, communicates in `{communication_language}`, displays numbered menu — confirmed line 39
  - [x] 1.6 Verify Step 5 waits for user input (number, text, or fuzzy match) — confirmed line 41
  - [x] 1.7 Verify menu handlers section includes exec, data, and workflow handler types (all three must be present) — confirmed lines 46-86

- [x] Task 2: Validate menu items (AC: #2)
  - [x] 2.1 Verify menu includes [GM] Generate Model pointing to `workflows/model-generation/workflow.md` via exec handler — confirmed line 121
  - [x] 2.2 Verify menu includes [FA] Full Analysis pointing to `workflows/full-analysis/workflow.md` via exec handler — confirmed line 123
  - [x] 2.3 Verify menu includes [AV] Accuracy Validation pointing to `workflows/accuracy-validation/workflow.md` via exec handler — confirmed line 122
  - [x] 2.4 Verify standard menu items present: [MH] Menu Help, [CH] Chat, [PM] Party Mode (pointing to `_bmad/core/workflows/party-mode/workflow.md`), [DA] Dismiss Agent — confirmed lines 119-126
  - [x] 2.5 Evaluate AC #2 "Regenerate Model" requirement — architecture confirms regeneration uses same model-generation workflow with forced-fresh; handled within workflow logic, not separate menu item; [AV] Accuracy Validation added as Atlas-owned workflow — design improvement, no fix needed

- [x] Task 3: Validate persona definition (AC: #3)
  - [x] 3.1 Verify persona role is "Contextual Model Generation + Capabilities Curation Specialist" — confirmed line 103
  - [x] 3.2 Verify identity describes "knowledgeable curator" who balances industry standards with practical relevance — confirmed lines 104-114
  - [x] 3.3 Verify communication_style is transparent — explains reasoning, transparent about confidence levels — confirmed line 115
  - [x] 3.4 Verify principles include: standards inform not dictate, web search freshness, model team-owned, GC4 amendment respect, ≥20 capabilities — confirmed line 116

- [x] Task 4: Validate Atlas-specific rules (AC: #1, #3)
  - [x] 4.1 Verify rules include: GC1 must be loaded before generation, capabilities must be stack-relevant — confirmed lines 95-96
  - [x] 4.2 Verify rules include: GC2 must not contain source code/file contents/secrets (NFR9) — confirmed line 97
  - [x] 4.3 Verify rules include: respect GC4 amendments on regeneration — confirmed line 98
  - [x] 4.4 Verify rules include: ≥20 capabilities, limited_coverage warning — confirmed line 100
  - [x] 4.5 Verify rules include: communication language enforcement — confirmed line 90
  - [x] 4.6 Verify rules include: confidence transparency — distinguish well-known from emerging practices — confirmed line 99

- [x] Task 5: Cross-reference with Story 1.2 (Scout) validation pattern
  - [x] 5.1 Verify Atlas follows same XML activation protocol structure as Scout (stack-detective.md) — identical 7-step + HELP_STEP structure
  - [x] 5.2 Verify error handling messages reference "Atlas" (not Scout or generic agent names) — confirmed: "Atlas to operate" (line 15), "Atlas to run model generation activities" (line 57)
  - [x] 5.3 Verify workflow error message references "Atlas to run model generation activities" (agent-specific error context) — confirmed line 57

- [x] Task 6: Fix any discrepancies found in Tasks 1-5 — No discrepancies found

## Dev Notes

### Pre-existing File — Validation Approach

The file `_bmad/bme/_gyre/agents/model-curator.md` already exists (128 lines) from the 2026-03-21 architecture scaffolding. This story validates the existing file against the ACs and architecture spec. Fix any discrepancies found.

### Known AC vs Implementation Discrepancy: "Regenerate Model" Menu Item

**AC #2 states:** Atlas's menu includes [1] Generate Model, [2] Regenerate Model, [3] Full Analysis

**Scaffolded file has:** [GM] Generate Model, [AV] Accuracy Validation, [FA] Full Analysis (plus standard MH/CH/PM/DA)

**Architecture spec says:** "Regenerate Model — workflow: model-generation (forces fresh generation)" — same workflow as Generate, just with forced-fresh behavior.

**Analysis:** The "Regenerate Model" is likely handled within the model-generation workflow itself (detecting existing capabilities.yaml and offering regenerate). The scaffolded file added [AV] Accuracy Validation instead, which Atlas legitimately owns. This may be an intentional design improvement over the epic's simplified AC. **Task 2.5 evaluates this.**

### Architecture Reference — Atlas Agent

From `architecture-gyre.md`:

- **Agent ID:** `model-curator`
- **Name:** Atlas
- **Icon:** 📐
- **Role:** Generates capabilities manifest — contextual model of production capabilities for the detected stack
- **Persona:** Knowledgeable curator. Balances industry standards (DORA, OpenTelemetry, Google PRR) with practical relevance. Transparent about confidence.
- **Tools used:** Read (load GC1), Write (write capabilities.yaml), WebSearch (current best practices)

**Generation process:**
1. Load GC1 (Stack Profile)
2. Generate capabilities using: agent knowledge + stack-specific reasoning + web search
3. Each capability: id, category, name, description, source, relevance
4. Adjust based on guard answers
5. Surface limited_coverage warning if <20

**Model ownership:** Team-owned. GC4 amendments respected on regeneration.

**Menu items (architecture spec):**
1. Generate Model — workflow: model-generation
2. Regenerate Model — workflow: model-generation (forced fresh)
3. Full Analysis — workflow: full-analysis

**Workflows owned by Atlas:**
- model-generation (4 steps — generate capabilities)
- accuracy-validation (3 steps — validate model quality)

### XML Activation Protocol Pattern

Must follow exact Vortex agent pattern (validated in Story 1.2 for Scout):

1. Step 1: Load persona
2. Step 2: MANDATORY config loading with error handling (file missing, fields missing)
3. Step 3: Store user_name
4. Step 4: Greet + display menu
5. HELP_STEP: `/bmad-help` tip
6. Step 5: STOP and wait
7. Step 6: Input routing (number, text, fuzzy, no match)
8. Step 7: Extract handler attributes and execute

**Menu handler types:** exec, data, workflow — all three in `<menu-handlers>`.

### Agent-Specific Rules (from architecture)

Atlas rules must include:
- GC1 must be loaded before model generation
- Industry standards inform but don't dictate — stack relevance required
- GC2 must not contain source code, file contents, or secrets (NFR9)
- Respect GC4 amendments on regeneration
- ≥20 capabilities or limited_coverage=true
- Confidence transparency

### What NOT to Modify

- **Do NOT modify stack-detective.md** — Already validated in Story 1.2
- **Do NOT modify workflow files** — Already validated in Story 1.3 / Story 2.1
- **Do NOT modify config.yaml** — Already validated in Story 1.1
- **Do NOT modify contracts** — GC1 validated in Story 1.4, GC2 validated separately
- **Do NOT modify agent-registry.js** — Already fixed in Story 1.6
- **Do NOT modify compass-routing-reference.md** — Already validated in Story 1.7

### Previous Story Intelligence

From Story 2.1 completion notes:
- NFR19 gate PASSED — 97.9%-100% accuracy across all 3 archetypes
- 72 capabilities generated and scored — model generation quality validated
- Atlas's core capability (LLM-based model generation) works at production quality
- KILL SWITCH not triggered — Stories 2.2-2.5 are unblocked

From Story 1.2 completion notes (Scout agent validation — same pattern):
- All 19 validation subtasks passed — zero discrepancies in scaffolded Scout agent file
- Exact XML activation protocol structure validated (7 steps + HELP_STEP)
- Menu items validated: exec handler type, correct workflow paths, standard items (MH/CH/PM/DA)
- Persona validated: role, identity, communication_style, principles
- Agent-specific rules validated

### Architecture Compliance

| Requirement | Where Covered |
|---|---|
| FR9 (generate, not template) | Persona: LLM reasoning + standards knowledge |
| FR10 (industry standards) | Rules + persona: DORA, OpenTelemetry, Google PRR |
| FR14 (≥20 capabilities) | Rules: generate ≥20 or limited_coverage warning |
| FR15 (limited-coverage) | Rules: limited_coverage=true + user warning |
| NFR9 (no source code in GC2) | Rules: GC2 must not contain source code/secrets |
| NFR10 (model caching) | Rules: capabilities.yaml IS the cache |
| NFR21 (web search freshness) | Persona: web search for current best practices |

### Project Structure Notes

- Atlas agent file: `_bmad/bme/_gyre/agents/model-curator.md` (128 lines, pre-existing)
- Scout agent file (reference pattern): `_bmad/bme/_gyre/agents/stack-detective.md` (126 lines)
- Gyre config: `_bmad/bme/_gyre/config.yaml`

### References

- [Source: _bmad-output/planning-artifacts/epic-gyre.md — Story 2.2 ACs]
- [Source: _bmad-output/planning-artifacts/architecture-gyre.md — Atlas agent definition, lines 285-308]
- [Source: _bmad-output/planning-artifacts/architecture-gyre.md — model-generation workflow, lines 598-614]
- [Source: _bmad/bme/_gyre/agents/model-curator.md — Pre-existing Atlas agent file (128 lines)]
- [Source: _bmad/bme/_gyre/agents/stack-detective.md — Scout reference pattern (126 lines)]
- [Source: _bmad-output/implementation-artifacts/gyre-1-2-scout-agent-definition.md — Story 1.2 validation pattern]
- [Source: _bmad-output/implementation-artifacts/gyre-2-1-model-accuracy-spike-nfr19-gate.md — Story 2.1 NFR19 gate PASS]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### Change Log

### File List
