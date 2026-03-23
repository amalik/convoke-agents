# Story 1.7: Compass Routing Reference & Full-Analysis Skeleton

Status: done

## Story

As a user completing any Gyre workflow,
I want to see routing options for what to do next,
So that I can navigate between Gyre agents and workflows.

## Acceptance Criteria

1. **Given** `compass-routing-reference.md` exists at `_bmad/bme/_gyre/`
   **When** a user finishes any Gyre workflow step
   **Then** the compass table shows: agent, workflow, and rationale for each option
   **And** includes inter-module routing (Gyre → Vortex) for findings that impact product discovery
   **And** follows the Vortex compass-routing-reference.md structural pattern

2. **Given** `full-analysis/workflow.md` skeleton exists
   **When** full-analysis is invoked
   **Then** it orchestrates: step-01-initialize (check `.gyre/`, detect mode) → step-02-detect-stack (invoke Scout) → remaining steps stubbed for E2-E4
   **And** workflow.md has correct frontmatter (name, agent, title, description, steps)
   **And** each step file has correct frontmatter (step number, workflow, title)

3. **Given** the compass routing reference covers all Gyre workflows
   **When** the routing decision matrix is examined
   **Then** all 7 workflows appear with correct agent assignments
   **And** routing recommendations match the architecture spec
   **And** the delta-report workflow is assigned to Lens (readiness-analyst), not Coach

4. **Given** the full-analysis step files exist
   **When** step files are examined
   **Then** step-01-initialize handles mode detection (crisis/anticipation/regeneration), `.gyre/` creation, lock file check
   **And** step-02-detect-stack delegates to stack-detection workflow steps
   **And** steps 3-5 reference correct workflow step paths for their respective agents
   **And** step-05-review-findings ends with the full compass routing table

## Tasks / Subtasks

- [x] Task 1: Validate `compass-routing-reference.md` structure (AC: #1, #3)
  - [x] 1.1 Verify header: title, status (Authoritative), version, created date
  - [x] 1.2 Verify Gyre Overview: 4 agents, 4 streams, 4 contracts, ASCII pipeline diagram
  - [x] 1.3 Verify Routing Mechanisms section: schema-driven, feedback-driven, action-driven
  - [x] 1.4 Verify Handoff Contract Reference: GC1-GC3 (artifact) with schema files, GC4 (feedback)
  - [x] 1.5 Verify Complete Routing Decision Matrix: all 4 agents with their workflows and routes
  - [x] 1.6 Verify delta-report is under Lens (Stream 3), not Coach
  - [x] 1.7 Verify Inter-Module Routing section: Gyre → Vortex advisory routes (Emma, Liam, Isla)
  - [x] 1.8 Verify Compass Table Format section: uniform format, rules (2-3 rows, agent display), inter-module routing rule
  - [x] 1.9 Verify Full Compass Table: all 7 workflows listed with correct agents
  - [x] 1.10 Verify Agent Display Reference table: Scout 🔎, Atlas 📐, Lens 🔬, Coach 🏋️

- [x] Task 2: Validate `full-analysis/workflow.md` (AC: #2)
  - [x] 2.1 Verify frontmatter: name=full-analysis, agent=stack-detective, title, description, steps=5
  - [x] 2.2 Verify Pipeline table: 5 steps with correct files, agents, and actions
  - [x] 2.3 Verify Mode Detection section: crisis (no .gyre/), anticipation (capabilities.yaml exists), regeneration (user says "regenerate")
  - [x] 2.4 Verify Privacy Boundary statement referencing GC1
  - [x] 2.5 Verify Load step directive points to step-01-initialize.md

- [x] Task 3: Validate `full-analysis/steps/step-01-initialize.md` (AC: #4)
  - [x] 3.1 Verify frontmatter: step=1, workflow=full-analysis, title=Initialize Analysis
  - [x] 3.2 Verify .gyre/ check: Glob for stack-profile.yaml, capabilities.yaml, findings.yaml, .lock
  - [x] 3.3 Verify mode detection table: Crisis/Anticipation/Regeneration with correct conditions
  - [x] 3.4 Verify lock file check (NFR13): stale detection (>5min), concurrent analysis warning
  - [x] 3.5 Verify .gyre/ directory creation if not exists
  - [x] 3.6 Verify initialization status report format
  - [x] 3.7 Verify Load step directive to step-02-detect-stack.md

- [x] Task 4: Validate `full-analysis/steps/step-02-detect-stack.md` (AC: #4)
  - [x] 4.1 Verify frontmatter: step=2, workflow=full-analysis, title=Detect Stack
  - [x] 4.2 Verify Crisis/Regeneration mode: delegates to stack-detection steps (scan → classify → guard)
  - [x] 4.3 Verify Anticipation mode: presents existing profile, asks re-detect or keep
  - [x] 4.4 Verify GC1 write to .gyre/stack-profile.yaml
  - [x] 4.5 Verify Load step directive to step-03-generate-model.md

- [x] Task 5: Validate `full-analysis/steps/step-03-generate-model.md` (AC: #4)
  - [x] 5.1 Verify frontmatter: step=3, workflow=full-analysis, title=Generate Model
  - [x] 5.2 Verify GC1 prerequisite check (must exist from step 2)
  - [x] 5.3 Verify Anticipation mode: load cached model, offer keep/regenerate
  - [x] 5.4 Verify Crisis/Regeneration mode: delegates to model-generation steps (4 steps)
  - [x] 5.5 Verify GC2 write to .gyre/capabilities.yaml
  - [x] 5.6 Verify Load step directive to step-04-analyze-gaps.md

- [x] Task 6: Validate `full-analysis/steps/step-04-analyze-gaps.md` (AC: #4)
  - [x] 6.1 Verify frontmatter: step=4, workflow=full-analysis, title=Analyze Gaps
  - [x] 6.2 Verify GC2 prerequisite check (must exist from step 3)
  - [x] 6.3 Verify delegation to gap-analysis steps (5 steps)
  - [x] 6.4 Verify GC3 write to .gyre/findings.yaml
  - [x] 6.5 Verify error recovery section (partial results if domain analysis fails)
  - [x] 6.6 Verify Load step directive to step-05-review-findings.md

- [x] Task 7: Validate `full-analysis/steps/step-05-review-findings.md` (AC: #4)
  - [x] 7.1 Verify frontmatter: step=5, workflow=full-analysis, title=Review Findings
  - [x] 7.2 Verify GC3 prerequisite check with error recovery prompt
  - [x] 7.3 Verify findings summary display (severity counts from GC3)
  - [x] 7.4 Verify existing feedback check (FR53: .gyre/feedback.yaml)
  - [x] 7.5 Verify review prompt: Walk through now / Later / Skip (FR43, FR55)
  - [x] 7.6 Verify model-review delegation paths for each option
  - [x] 7.7 Verify full compass routing table at end: all 7 workflows + inter-module Vortex routing
  - [x] 7.8 Verify delta-report assigned to Lens 🔬 in compass table (not Coach)
  - [x] 7.9 Verify .gyre/ artifact summary listing (GC1-GC4)

- [x] Task 8: Fix any discrepancies found in Tasks 1-7 — No discrepancies found

## Dev Notes

### Pre-existing Files — Validation Approach

All files already exist from the 2026-03-21 architecture scaffolding:

- `_bmad/bme/_gyre/compass-routing-reference.md` (169 lines) — complete routing reference
- `_bmad/bme/_gyre/workflows/full-analysis/workflow.md` (40 lines) — workflow entry point
- `_bmad/bme/_gyre/workflows/full-analysis/steps/step-01-initialize.md` (69 lines)
- `_bmad/bme/_gyre/workflows/full-analysis/steps/step-02-detect-stack.md` (50 lines)
- `_bmad/bme/_gyre/workflows/full-analysis/steps/step-03-generate-model.md` (53 lines)
- `_bmad/bme/_gyre/workflows/full-analysis/steps/step-04-analyze-gaps.md` (43 lines)
- `_bmad/bme/_gyre/workflows/full-analysis/steps/step-05-review-findings.md` (129 lines)

This story validates all files against the ACs and architecture spec. Fix any discrepancies found.

### Architecture Compliance

| Requirement | Where Covered |
|---|---|
| AR7 (compass routing reference) | compass-routing-reference.md — complete routing tables, inter-module routing, format spec |
| AR5 (full-analysis skeleton) | workflow.md + 5 step files — orchestrates detect → model → analyze → review |
| FR42 (.gyre/ creation) | step-01-initialize.md — creates directory on first run |
| FR43 (review prompt) | step-05-review-findings.md — walk through / later / skip |
| FR55 (skip option) | step-05-review-findings.md — skip goes to feedback capture |
| NFR13 (.lock concurrency) | step-01-initialize.md — lock file check with stale detection |
| NFR18 (all workflows runnable) | step-05-review-findings.md — full compass table with all 7 workflows |

### Key Validation Points

1. **delta-report assignment**: compass-routing-reference.md line 156 assigns delta-report to Lens 🔬 — must match the fix applied in Story 1.6
2. **Step-file chain**: workflow.md → step-01 → step-02 → step-03 → step-04 → step-05 with correct Load step directives
3. **Mode detection**: 3 modes (crisis/anticipation/regeneration) consistently defined across workflow.md and step-01
4. **Inter-module routing**: Gyre → Vortex advisory routes (Emma, Liam, Isla) present in compass reference and step-05 final compass
5. **Steps 3-5 are stubs**: They reference workflow steps from Epics 2-4 that don't exist yet — this is by design (skeleton)

### What NOT to Modify

- **Do NOT modify stack-detection workflow files** — Already validated in Story 1.3
- **Do NOT modify the Scout agent file** — Already validated in Story 1.2
- **Do NOT modify config.yaml** — Already validated in Story 1.1
- **Do NOT modify contracts** — Already validated in Story 1.4
- **Do NOT modify agent-registry.js** — Already fixed in Story 1.6

### Previous Story Intelligence

From Story 1.6 completion notes:
- delta-report reassigned from review-coach to readiness-analyst — compass reference should already be correct (it was the registry that was wrong)
- First actual code change in Gyre initiative
- Full test suite: 359 tests pass

From Story 1.3 completion notes:
- Stack-detection workflow validated with all step-file chain directives correct
- step-03-guard-questions.md ends with compass routing table

### Project Structure Notes

- Compass routing: `_bmad/bme/_gyre/compass-routing-reference.md`
- Full-analysis workflow: `_bmad/bme/_gyre/workflows/full-analysis/workflow.md`
- Full-analysis steps: `_bmad/bme/_gyre/workflows/full-analysis/steps/step-0[1-5]-*.md`
- Pattern reference: `_bmad/bme/_vortex/compass-routing-reference.md`

### References

- [Source: _bmad-output/planning-artifacts/epic-gyre.md — Story 1.7 ACs, lines 422-438]
- [Source: _bmad-output/planning-artifacts/architecture-gyre.md — full-analysis workflow, lines 578-597]
- [Source: _bmad-output/planning-artifacts/architecture-gyre.md — compass routing, line 746]
- [Source: _bmad/bme/_gyre/compass-routing-reference.md — Pre-existing routing reference (169 lines)]
- [Source: _bmad/bme/_gyre/workflows/full-analysis/ — Pre-existing workflow + 5 step files]
- [Source: _bmad/bme/_vortex/compass-routing-reference.md — Vortex pattern reference]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

None — no errors encountered.

### Completion Notes List

- All 42 validation subtasks passed across 8 tasks and 7 files — zero discrepancies found
- Task 1 (compass routing reference): All 10 structural checks passed — overview, routing mechanisms, contract reference, decision matrix, inter-module routing, format spec, full compass table, agent display reference
- Task 2 (workflow.md): Frontmatter, pipeline table, mode detection, privacy boundary, load directive — all correct
- Task 3 (step-01-initialize): Mode detection table, lock file check (NFR13), .gyre/ creation, initialization report — all correct
- Task 4 (step-02-detect-stack): Crisis/regeneration delegation, anticipation mode, GC1 write — all correct
- Task 5 (step-03-generate-model): GC1 prerequisite, anticipation cache, model-generation delegation, GC2 write — all correct
- Task 6 (step-04-analyze-gaps): GC2 prerequisite, gap-analysis delegation (5 steps), GC3 write, error recovery — all correct
- Task 7 (step-05-review-findings): GC3 prerequisite, findings summary, review prompt (FR43/FR55), model-review delegation, full compass table with inter-module routing, artifact summary — all correct
- Task 8 (fix discrepancies): No discrepancies found — seventh consecutive clean validation from scaffolding
- delta-report correctly assigned to Lens 🔬 in both compass-routing-reference.md and step-05-review-findings.md compass table (consistent with Story 1.6 fix)
- Step-file chain validated: workflow.md → step-01 → step-02 → step-03 → step-04 → step-05 with correct Load step directives
- Inter-module Gyre → Vortex advisory routes present in both compass reference and step-05 final compass
- This is a validation-only story — no files were created or modified

### Change Log

- 2026-03-23: Full validation of compass-routing-reference.md + full-analysis workflow (7 files) — all checks passed, no changes needed

### File List

- `_bmad/bme/_gyre/compass-routing-reference.md` (validated, no changes)
- `_bmad/bme/_gyre/workflows/full-analysis/workflow.md` (validated, no changes)
- `_bmad/bme/_gyre/workflows/full-analysis/steps/step-01-initialize.md` (validated, no changes)
- `_bmad/bme/_gyre/workflows/full-analysis/steps/step-02-detect-stack.md` (validated, no changes)
- `_bmad/bme/_gyre/workflows/full-analysis/steps/step-03-generate-model.md` (validated, no changes)
- `_bmad/bme/_gyre/workflows/full-analysis/steps/step-04-analyze-gaps.md` (validated, no changes)
- `_bmad/bme/_gyre/workflows/full-analysis/steps/step-05-review-findings.md` (validated, no changes)
