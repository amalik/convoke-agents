# Story 3.6: Full-Analysis Steps 4-5 Integration

Status: done

## Story

As a user running full-analysis,
I want the pipeline to flow from model generation through gap analysis,
So that the complete pipeline works end-to-end.

## Acceptance Criteria

1. **Given** full-analysis workflow has step-04-analyze-gaps and step-05-review-findings
   **When** Atlas completes model generation (step 3)
   **Then** control passes to Lens for gap analysis (step 4)
   **And** Lens runs all 5 gap-analysis workflow steps sequentially
   **And** GC3 is written to `.gyre/findings.yaml`
   **And** step-05-review-findings hands off to Coach (Epic 4 integration point)
   **And** error recovery preserves GC2 and offers retry on domain failure

2. **Given** step-05-review-findings.md exists
   **When** gap analysis completes
   **Then** presents findings summary (severity counts from GC3)
   **And** prompts user to review capabilities (FR43): walk through now / later / skip (FR55)
   **And** ends with full Gyre Compass routing table (NFR18)

## Tasks / Subtasks

- [x] Task 1: Validate step-04-analyze-gaps.md (AC: #1)
  - [x] 1.1 Verify frontmatter: step=4, workflow=full-analysis, title=Analyze Gaps — confirmed lines 2-4
  - [x] 1.2 Verify GC2 prerequisite: must have been written in step 3, STOP if missing — confirmed line 13
  - [x] 1.3 Verify gap-analysis workflow delegation: all 5 steps referenced in sequence (step-01 through step-05) — confirmed lines 21-25
  - [x] 1.4 Verify time target: first finding <2 minutes from workflow start (NFR1) — confirmed line 15
  - [x] 1.5 Verify GC3 write: `.gyre/findings.yaml` on completion — confirmed line 27
  - [x] 1.6 Verify error recovery: GC2 safe (line 32), report partial (line 33), offer retry (line 34) — confirmed
  - [x] 1.7 Verify Load step directive to step-05-review-findings.md — confirmed line 42

- [x] Task 2: Validate step-05-review-findings.md (AC: #2)
  - [x] 2.1 Verify frontmatter: step=5, workflow=full-analysis, title=Review Findings, implements=Epic 4 (Stories 4.5, 4.7) — confirmed lines 2-5
  - [x] 2.2 Verify GC3 prerequisite: must have been written in step 4, STOP if missing — confirmed line 14
  - [x] 2.3 Verify findings summary display: severity table (blockers/recommended/nice-to-have counts) — confirmed lines 39-50
  - [x] 2.4 Verify existing feedback check: `.gyre/feedback.yaml` (FR53) — confirmed lines 52-58
  - [x] 2.5 Verify review prompt (FR43, FR55): walk through now / later / skip — confirmed lines 60-73
  - [x] 2.6 Verify "walk through" handler: executes model-review workflow steps inline (step-02, step-03, step-04) — confirmed lines 77-81
  - [x] 2.7 Verify "later" handler: sets review_deferred=true, proceeds to feedback capture — confirmed lines 83-89
  - [x] 2.8 Verify "skip" handler: proceeds directly to feedback capture — confirmed lines 91-93

- [x] Task 3: Validate Gyre Compass and completion (AC: #2)
  - [x] 3.1 Verify full-analysis complete section: lists all 4 GC artifacts (GC1 stack-profile, GC2 capabilities, GC3 findings, GC4 feedback) — confirmed lines 104-108
  - [x] 3.2 Verify Gyre Compass routing table: 8 rows covering all workflows and agents — confirmed lines 116-125
  - [x] 3.3 Verify cross-module recommendation: Vortex agents (Emma/Isla) for production readiness impact on discovery — confirmed line 125

- [x] Task 4: Validate step chain continuity
  - [x] 4.1 Verify step-04 Load directive points to step-05 (step 4 → step 5 handoff) — confirmed line 42
  - [x] 4.2 Verify workflow.md pipeline table lists step-04 (Lens 🔬) and step-05 (Coach 🏋️) with correct agents — confirmed workflow.md lines 20-21
  - [x] 4.3 Verify both step files reference `workflow: full-analysis` in frontmatter — step-04 line 3, step-05 line 3 — confirmed

- [x] Task 5: Fix any discrepancies found in Tasks 1-4 — No discrepancies found

## Dev Notes

### Pre-existing Files — Validation Approach

Both step files already exist from the 2026-03-21 architecture scaffolding:
- `_bmad/bme/_gyre/workflows/full-analysis/steps/step-04-analyze-gaps.md` (43 lines)
- `_bmad/bme/_gyre/workflows/full-analysis/steps/step-05-review-findings.md` (129 lines)

This story validates these against the Epic 3 ACs for the gap-analysis → review-findings handoff. Same pattern as Story 2.5 (steps 2-3 integration).

### Architecture Reference — Full-Analysis Steps 4-5

From `architecture-gyre.md`:

**Workflow 1: full-analysis (Orchestrator)**

| Step | File | Agent | Action |
|------|------|-------|--------|
| 4 | step-04-analyze-gaps.md | Lens | Run gap-analysis inline, write GC3 |
| 5 | step-05-review-findings.md | Coach | Present findings, offer review, Gyre Compass |

**Step 4:** Delegates to gap-analysis workflow (5 steps, validated in Stories 3.2-3.5)
**Step 5:** Integration point for Epic 4 (Coach agent) — presents findings summary, offers model review, captures feedback

### What NOT to Modify

- **Do NOT modify step-02 or step-03** — Already validated in Story 2.5
- **Do NOT modify workflow.md** — Already validated in Story 1.7
- **Do NOT modify gap-analysis workflow files** — Already validated in Stories 3.2-3.5
- **Do NOT modify Lens agent file** — Already validated in Story 3.1

### Previous Story Intelligence

From Story 3.5 completion notes:
- All 24 validation subtasks passed — zero discrepancies in GC3 contract + step-05-present-findings
- GC3 schema fully validated: findings (9 fields), compounds (8 fields), 11 validation rules

From Story 2.5 completion notes (same integration pattern):
- All 16 subtasks passed across step-02/step-03 integration
- Same approach: frontmatter, prerequisite, workflow delegation, mode detection, step chain

### Project Structure Notes

- Full-analysis workflow: `_bmad/bme/_gyre/workflows/full-analysis/`
- Gap-analysis workflow: `_bmad/bme/_gyre/workflows/gap-analysis/`
- Model-review workflow: `_bmad/bme/_gyre/workflows/model-review/`

### References

- [Source: _bmad-output/planning-artifacts/epic-gyre.md — Story 3.6 ACs]
- [Source: _bmad-output/planning-artifacts/architecture-gyre.md — full-analysis steps 4-5]
- [Source: _bmad/bme/_gyre/workflows/full-analysis/steps/step-04-analyze-gaps.md — Pre-existing file]
- [Source: _bmad/bme/_gyre/workflows/full-analysis/steps/step-05-review-findings.md — Pre-existing file]
- [Source: _bmad-output/implementation-artifacts/gyre-3-5-gc3-findings-report-contract-presentation.md — Story 3.5 completion]
- [Source: _bmad-output/implementation-artifacts/gyre-2-5-full-analysis-steps-2-3-integration.md — Story 2.5 pattern]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

None — no errors encountered.

### Completion Notes List

- All 19 validation subtasks passed across 5 tasks and 3 files — zero discrepancies found
- Task 1 (step-04-analyze-gaps, 43 lines): Frontmatter, GC2 prerequisite with STOP, gap-analysis delegation (5 steps in sequence), NFR1 time target (<2 min), GC3 write, error recovery (GC2 safe + retry), Load directive — all correct
- Task 2 (step-05-review-findings, 129 lines): Frontmatter with Epic 4 implements tag, GC3 prerequisite with STOP, findings summary table, feedback check (FR53), review prompt with 3 options (FR43/FR55), walk-through/later/skip handlers with correct model-review workflow delegation — all correct
- Task 3 (compass/completion): Full-analysis complete section lists all 4 GC artifacts, Gyre Compass routing table (8 rows, all workflows + agents), cross-module Vortex recommendation — all correct
- Task 4 (step chain): step-04 → step-05 handoff confirmed, workflow.md pipeline table lists Lens and Coach correctly, both files reference workflow: full-analysis — all correct
- Task 5 (fix): No discrepancies found — sixth consecutive clean validation in Epic 3, completing the epic
- This is a validation-only story — no files were created or modified
- Epic 3 complete: all 6 stories done (3.1 Lens agent, 3.2 gap-analysis workflow+steps 1-2, 3.3 step-03, 3.4 step-04, 3.5 GC3+step-05, 3.6 full-analysis integration)

### Change Log

- 2026-03-23: Full validation of step-04-analyze-gaps.md (43 lines) and step-05-review-findings.md (129 lines) — all checks passed, no changes needed

### File List

- `_bmad/bme/_gyre/workflows/full-analysis/steps/step-04-analyze-gaps.md` (validated, no changes)
- `_bmad/bme/_gyre/workflows/full-analysis/steps/step-05-review-findings.md` (validated, no changes)
- `_bmad/bme/_gyre/workflows/full-analysis/workflow.md` (validated for pipeline table, no changes)
