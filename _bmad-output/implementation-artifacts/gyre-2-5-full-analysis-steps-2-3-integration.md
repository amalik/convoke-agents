# Story 2.5: Full-Analysis Steps 2-3 Integration

Status: review

## Story

As a user running full-analysis,
I want the pipeline to flow from stack detection to model generation seamlessly,
So that I don't have to manually invoke each workflow.

## Acceptance Criteria

1. **Given** full-analysis workflow has step-02-detect-stack and step-03-generate-model
   **When** Scout completes detection (step 2)
   **Then** control passes to Atlas for model generation (step 3)
   **And** if cached model exists (anticipation mode), Atlas loads it and skips generation
   **And** if user requests regeneration, Atlas generates fresh model even with existing cache

## Tasks / Subtasks

- [x] Task 1: Validate step-02-detect-stack.md (AC: #1)
  - [x] 1.1 Verify frontmatter: step=2, workflow=full-analysis, title=Detect Stack — confirmed lines 1-5
  - [x] 1.2 Verify stack-detection workflow delegation: references all 3 stack-detection steps (scan → classify → guard questions) — confirmed lines 23-25
  - [x] 1.3 Verify GC1 write: `.gyre/stack-profile.yaml` on completion — confirmed lines 14, 27
  - [x] 1.4 Verify crisis/regeneration mode: executes all 3 stack-detection steps — confirmed lines 19-27
  - [x] 1.5 Verify anticipation mode: presents existing GC1 summary, asks re-detect or keep — confirmed lines 29-41
  - [x] 1.6 Verify Load step directive to step-03-generate-model.md — confirmed line 49

- [x] Task 2: Validate step-03-generate-model.md (AC: #1)
  - [x] 2.1 Verify frontmatter: step=3, workflow=full-analysis, title=Generate Model — confirmed lines 1-5
  - [x] 2.2 Verify GC1 prerequisite: must have been written in step 2, STOP if missing — confirmed line 13
  - [x] 2.3 Verify model-generation workflow delegation: references all 4 model-generation steps (load-profile → generate-capabilities → web-enrichment → write-manifest) — confirmed lines 39-42
  - [x] 2.4 Verify anticipation mode: cached capabilities.yaml loads and skips generation, presents model summary, offers keep or regenerate — confirmed lines 20-33
  - [x] 2.5 Verify crisis/regeneration mode: executes all 4 model-generation steps — confirmed lines 35-42
  - [x] 2.6 Verify GC2 write: `.gyre/capabilities.yaml` on completion — confirmed line 44
  - [x] 2.7 Verify Load step directive to step-04-analyze-gaps.md — confirmed line 52

- [x] Task 3: Validate step chain continuity
  - [x] 3.1 Verify step-02 Load directive points to step-03 (step 2 → step 3 handoff) — confirmed step-02 line 49
  - [x] 3.2 Verify step-03 Load directive points to step-04 (step 3 → step 4 handoff) — confirmed step-03 line 52
  - [x] 3.3 Verify workflow.md pipeline table lists step-02 (Scout) and step-03 (Atlas) with correct agents — confirmed workflow.md lines 18-19

- [x] Task 4: Validate mode detection consistency
  - [x] 4.1 Verify 3 modes (crisis/anticipation/regeneration) are consistent between workflow.md and step files — confirmed workflow.md lines 25-27, step-02 lines 19/29, step-03 lines 14-15/20/35
  - [x] 4.2 Verify anticipation mode cache check: step-02 checks GC1 (line 15), step-03 checks capabilities.yaml (lines 14, 20) — confirmed
  - [x] 4.3 Verify regeneration mode: both steps execute fresh (step-02 re-detects line 19, step-03 regenerates line 35) — confirmed

- [x] Task 5: Fix any discrepancies found in Tasks 1-4 — No discrepancies found

## Dev Notes

### Pre-existing Files — Validation Approach

Both step files already exist from the 2026-03-21 architecture scaffolding and were previously validated as part of the full-analysis skeleton in Story 1.7:

- `_bmad/bme/_gyre/workflows/full-analysis/steps/step-02-detect-stack.md` (50 lines)
- `_bmad/bme/_gyre/workflows/full-analysis/steps/step-03-generate-model.md` (53 lines)
- `_bmad/bme/_gyre/workflows/full-analysis/workflow.md` (40 lines) — already validated in Story 1.7

This story validates these step files against the Epic 2 ACs specifically for the stack-detection → model-generation handoff.

### Architecture Reference — Full-Analysis Steps 2-3

From `architecture-gyre.md`:

**Workflow 1: full-analysis (Orchestrator)**

| Step | File | Agent | Action |
|------|------|-------|--------|
| 2 | step-02-detect-stack.md | Scout | Run stack detection, ask guard questions, write GC1 |
| 3 | step-03-generate-model.md | Atlas | Load GC1, generate capabilities, write GC2 (skip if cached in anticipation mode) |

**Mode detection logic:**
- `.gyre/` does not exist → crisis mode (first run)
- `.gyre/capabilities.yaml` exists → anticipation mode (re-run); load cached model, skip generation
- User says "regenerate" → regeneration mode; fresh model generation even with existing cache

### Workflow Delegation Pattern

Step-02 delegates to **stack-detection** workflow (3 steps — validated in Story 1.3):
1. step-01-scan-filesystem.md
2. step-02-classify-stack.md
3. step-03-guard-questions.md

Step-03 delegates to **model-generation** workflow (4 steps — validated in Story 2.3):
1. step-01-load-profile.md
2. step-02-generate-capabilities.md
3. step-03-web-enrichment.md
4. step-04-write-manifest.md

### What NOT to Modify

- **Do NOT modify workflow.md** — Already validated in Story 1.7
- **Do NOT modify stack-detection workflow files** — Already validated in Story 1.3
- **Do NOT modify model-generation workflow files** — Already validated in Story 2.3
- **Do NOT modify Atlas agent file** — Already validated in Story 2.2
- **Do NOT modify GC1 or GC2 contracts** — Validated in Stories 1.4 and 2.4
- **Do NOT modify config.yaml** — Already validated in Story 1.1

### Previous Story Intelligence

From Story 2.4 completion notes:
- All 20 validation subtasks passed — zero discrepancies in GC2 contract
- Fourth consecutive clean validation in Epic 2

From Story 1.7 completion notes:
- Full-analysis skeleton validated: step-file chain workflow → step-01 → step-02 → step-03 → step-04 → step-05
- Steps 3-5 noted as "stubs referencing workflow steps from Epics 2-4" — by design at skeleton stage
- step-03-generate-model: GC1 prerequisite, anticipation cache, model-generation delegation, GC2 write — all validated as correct structure

From Story 2.3 completion notes:
- Model-generation workflow fully validated (4 steps, 441 lines)
- Step-04-write-manifest references GC2 schema — confirmed matching

### Project Structure Notes

- Full-analysis workflow: `_bmad/bme/_gyre/workflows/full-analysis/`
- Stack-detection workflow: `_bmad/bme/_gyre/workflows/stack-detection/`
- Model-generation workflow: `_bmad/bme/_gyre/workflows/model-generation/`

### References

- [Source: _bmad-output/planning-artifacts/epic-gyre.md — Story 2.5 ACs, lines 535-548]
- [Source: _bmad-output/planning-artifacts/architecture-gyre.md — full-analysis workflow, lines 578-622]
- [Source: _bmad/bme/_gyre/workflows/full-analysis/workflow.md — Pipeline table (40 lines)]
- [Source: _bmad/bme/_gyre/workflows/full-analysis/steps/step-02-detect-stack.md — Pre-existing (50 lines)]
- [Source: _bmad/bme/_gyre/workflows/full-analysis/steps/step-03-generate-model.md — Pre-existing (53 lines)]
- [Source: _bmad-output/implementation-artifacts/gyre-1-7-compass-routing-reference-full-analysis-skeleton.md — Story 1.7 validation]
- [Source: _bmad-output/implementation-artifacts/gyre-2-3-model-generation-workflow.md — Story 2.3 completion]
- [Source: _bmad-output/implementation-artifacts/gyre-2-4-gc2-capabilities-manifest-contract.md — Story 2.4 completion]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

None — no errors encountered.

### Completion Notes List

- All 16 validation subtasks passed across 5 tasks and 3 files — zero discrepancies found
- Task 1 (step-02-detect-stack): Frontmatter, stack-detection delegation (3 steps), GC1 write, crisis/regeneration execution, anticipation mode with re-detect option, Load directive — all correct
- Task 2 (step-03-generate-model): Frontmatter, GC1 prerequisite with STOP, model-generation delegation (4 steps), anticipation mode cache skip with keep/regenerate option, crisis/regeneration execution, GC2 write, Load directive — all correct
- Task 3 (step chain): step-02 → step-03 → step-04 chain verified, workflow.md pipeline table lists correct agents (Scout for step-02, Atlas for step-03)
- Task 4 (mode detection): 3 modes consistent across workflow.md and both step files, anticipation cache checks correct (GC1 in step-02, capabilities.yaml in step-03), regeneration forces fresh in both steps
- Task 5 (fix): No discrepancies found — fifth consecutive clean validation in Epic 2
- This is a validation-only story — no files were created or modified
- Epic 2 complete: all 5 stories done (2.1 NFR19 PASS, 2.2 Atlas agent, 2.3 model-generation workflow, 2.4 GC2 contract, 2.5 full-analysis integration)

### Change Log

- 2026-03-23: Full validation of step-02-detect-stack.md (50 lines) and step-03-generate-model.md (53 lines) — all checks passed, no changes needed

### File List

- `_bmad/bme/_gyre/workflows/full-analysis/steps/step-02-detect-stack.md` (validated, no changes)
- `_bmad/bme/_gyre/workflows/full-analysis/steps/step-03-generate-model.md` (validated, no changes)
- `_bmad/bme/_gyre/workflows/full-analysis/workflow.md` (validated, no changes)
