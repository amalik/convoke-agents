# Story 4.5: Mode Detection & Review Prompt Integration

Status: done

## Story

As a user running full-analysis,
I want the system to detect whether this is my first run or a re-run,
So that anticipation mode can skip model generation and show delta.

## Acceptance Criteria

1. **Given** full-analysis step-01-initialize.md
   **When** `.gyre/` does not exist
   **Then** mode = crisis (first run), creates `.gyre/` directory (FR38, FR42)

   **When** `.gyre/capabilities.yaml` exists
   **Then** mode = anticipation (re-run), loads cached model (FR38)
   **And** re-run time ≤50% of first-run (NFR4 — model generation skipped)

2. **Given** full-analysis step-05-review-findings.md reaches Coach
   **When** Coach presents findings
   **Then** it prompts user to review manifest (FR43)
   **And** offers: "Walk through now" / "Later" (deferred flag) / "Skip"

## Tasks / Subtasks

- [x] Task 1: Validate step-01-initialize.md mode detection (AC: #1)
  - [x] 1.1 Verify frontmatter: step=1, workflow=full-analysis, title=Initialize Analysis — confirmed lines 2-4
  - [x] 1.2 Verify mandatory execution rules: use Claude Code tools Glob/Read (line 13), create .gyre/ if needed (line 14), detect mode automatically (line 15) — confirmed
  - [x] 1.3 Verify .gyre/ directory check: Glob for stack-profile.yaml GC1 (line 22), capabilities.yaml GC2 (line 23), findings.yaml GC3 (line 24), .lock NFR13 (line 25) — confirmed
  - [x] 1.4 Verify mode detection table: Crisis (no .gyre/ → first run, line 33), Anticipation (capabilities.yaml exists → skip model gen, line 34), Regeneration (user says "regenerate"/"fresh", line 35) — confirmed
  - [x] 1.5 Verify lock file check (NFR13): read timestamp/process info (line 40), warn if >5 min (line 41), ask if recent (line 42) — confirmed
  - [x] 1.6 Verify .gyre/ directory creation if doesn't exist — confirmed lines 44-46
  - [x] 1.7 Verify initialization report: mode, directory status, existing artifacts — confirmed lines 48-60
  - [x] 1.8 Verify Load step directive to step-02-detect-stack.md — confirmed line 68

- [x] Task 2: Validate step-05-review-findings.md review prompt (AC: #2)
  - [x] 2.1 Verify frontmatter: step=5, workflow=full-analysis, title=Review Findings, implements=Epic 4 (Stories 4.5, 4.7) — confirmed lines 2-5
  - [x] 2.2 Verify GC3 prerequisite: must have been written in step 4, STOP if missing — confirmed lines 14, 23-33
  - [x] 2.3 Verify findings summary display: severity table (Blockers/Recommended/Nice-to-have counts) — confirmed lines 35-50
  - [x] 2.4 Verify existing feedback check (.gyre/feedback.yaml) per FR53 — confirmed lines 52-58
  - [x] 2.5 Verify review prompt (FR43, FR55): three options — "Walk through now" / "Later" / "Skip" — confirmed lines 60-73
  - [x] 2.6 Verify "walk through" handler: executes model-review steps inline (step-02, step-03, step-04) — confirmed lines 77-81
  - [x] 2.7 Verify "later" handler: sets review_deferred=true in capabilities.yaml frontmatter, proceeds to step-04 capture-feedback — confirmed lines 83-89
  - [x] 2.8 Verify "skip" handler: proceeds directly to step-04 capture-feedback — confirmed lines 91-93

- [x] Task 3: Validate mode detection integration with full-analysis pipeline
  - [x] 3.1 Verify step-01 Load directive points to step-02 (step 1 → step 2 handoff) — confirmed line 68
  - [x] 3.2 Verify workflow.md pipeline table lists step-01 (Scout: initialize) and step-05 (Coach: review findings) — confirmed from Story 3.6 validation
  - [x] 3.3 Verify step-01 references workflow: full-analysis in frontmatter — confirmed line 3
  - [x] 3.4 Verify anticipation mode skips step-03 (model generation) per mode detection table — confirmed line 34 "skip model generation"

- [x] Task 4: Cross-reference with step-01-load-context.md (model-review, Story 4.4)
  - [x] 4.1 Verify step-01-load-context.md implements Stories 4.4 AND 4.5 — confirmed from Story 4.4 validation (frontmatter line 5)
  - [x] 4.2 Verify deferred review reminder (FR55) in step-01-load-context.md aligns with "later" handler: step-05 sets review_deferred=true (line 84), step-01-load-context checks it and displays reminder (lines 55-61) — confirmed alignment

- [x] Task 5: Fix any discrepancies found in Tasks 1-4 — No discrepancies found

## Dev Notes

### Pre-existing Files — Validation Approach

Both files already exist from the 2026-03-21 architecture scaffolding:
- `_bmad/bme/_gyre/workflows/full-analysis/steps/step-01-initialize.md` (69 lines)
- `_bmad/bme/_gyre/workflows/full-analysis/steps/step-05-review-findings.md` (129 lines)

step-05-review-findings.md was already validated in Story 3.6 for the gap-analysis integration. This story validates the Coach-specific aspects (FR43 review prompt, FR55 deferred flag) and the mode detection in step-01.

### Architecture Reference — Mode Detection

From `architecture-gyre.md`:

**FR38 (mode detection):** Crisis (first run, no .gyre/) vs Anticipation (re-run, .gyre/capabilities.yaml exists)
**FR42 (directory creation):** Create .gyre/ on first run
**FR43 (review prompt):** Prompt user to review manifest after findings
**FR55 (deferred review):** "Walk through now" / "Later" / "Skip" — later sets deferred flag
**NFR4 (performance):** Re-run time ≤50% of first-run (model generation skipped)
**NFR13 (concurrency):** Lock file check for concurrent analysis

### What NOT to Modify

- **Do NOT modify step-02 through step-04 of full-analysis** — Already validated in Stories 2.5, 3.6
- **Do NOT modify workflow.md** — Already validated in Story 1.7
- **Do NOT modify model-review step-01-load-context.md** — Already validated in Story 4.4
- **Do NOT modify Coach agent file** — Already validated in Story 4.1

### Previous Story Intelligence

From Story 4.4 (feedback capture) completion notes:
- All 27 validation subtasks passed — zero discrepancies
- step-01-load-context.md implements Stories 4.4 AND 4.5
- Deferred review reminder (FR55) validated in step-01-load-context.md
- review_deferred: true check in capabilities.yaml frontmatter confirmed

From Story 3.6 (full-analysis steps 4-5) completion notes:
- step-05-review-findings.md (129 lines) fully validated for gap-analysis integration
- Review prompt (FR43/FR55) with 3 options confirmed
- Walk-through/later/skip handlers confirmed
- Findings summary, feedback check (FR53) confirmed

### Project Structure Notes

- step-01-initialize: `_bmad/bme/_gyre/workflows/full-analysis/steps/step-01-initialize.md`
- step-05-review-findings: `_bmad/bme/_gyre/workflows/full-analysis/steps/step-05-review-findings.md`

### References

- [Source: _bmad-output/planning-artifacts/epic-gyre.md — Story 4.5 ACs]
- [Source: _bmad-output/planning-artifacts/architecture-gyre.md — mode detection, review prompt]
- [Source: _bmad/bme/_gyre/workflows/full-analysis/steps/step-01-initialize.md — Pre-existing file (69 lines)]
- [Source: _bmad/bme/_gyre/workflows/full-analysis/steps/step-05-review-findings.md — Pre-existing file (129 lines)]
- [Source: _bmad-output/implementation-artifacts/gyre-4-4-feedback-capture-display.md — Story 4.4 completion]
- [Source: _bmad-output/implementation-artifacts/gyre-3-6-full-analysis-steps-4-5-integration.md — Story 3.6 completion]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

None — no errors encountered.

### Completion Notes List

- All 22 validation subtasks passed across 5 tasks and 2 files — zero discrepancies found
- Task 1 (step-01-initialize, 69 lines): Frontmatter, 3 mandatory rules, .gyre/ check (4 artifacts), mode detection table (crisis/anticipation/regeneration), lock file check NFR13, directory creation, initialization report, Load directive to step-02 — all correct
- Task 2 (step-05-review-findings, 129 lines): Frontmatter with Stories 4.5/4.7, GC3 prerequisite with STOP, findings summary table, feedback check FR53, review prompt FR43/FR55 (3 options), walk-through handler (3 model-review steps inline), later handler (review_deferred=true + step-04), skip handler (step-04 directly) — all correct
- Task 3 (pipeline integration): step-01 → step-02 handoff confirmed, workflow.md pipeline table correct, workflow: full-analysis reference, anticipation mode skip model generation — all correct
- Task 4 (cross-reference): step-01-load-context implements Stories 4.4+4.5, deferred review reminder aligns with later handler (sets review_deferred=true → checked on next run) — all correct
- Task 5 (fix): No discrepancies found — fifth consecutive clean validation in Epic 4
- This is a validation-only story — no files were created or modified

### Change Log

- 2026-03-23: Full validation of step-01-initialize.md (69 lines) and step-05-review-findings.md (129 lines) — all checks passed, no changes needed

### File List

- `_bmad/bme/_gyre/workflows/full-analysis/steps/step-01-initialize.md` (validated, no changes)
- `_bmad/bme/_gyre/workflows/full-analysis/steps/step-05-review-findings.md` (validated, no changes)
