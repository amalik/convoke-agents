# Story 4.6: Delta Report Workflow

Status: done

## Story

As a user who has run Gyre before,
I want to see what changed since my last analysis,
So that I can track my team's progress on production readiness.

## Acceptance Criteria

1. **Given** the delta-report workflow exists at `_bmad/bme/_gyre/workflows/delta-report/`
   **When** Lens runs the delta workflow

   **step-01-load-history.md:**
   **Then** it loads `.gyre/history.yaml` (previous findings) and `.gyre/findings.yaml` (current findings) (FR39)

   **step-02-compute-delta.md:**
   **Then** it computes: new findings, carried-forward findings, resolved findings (FR40)
   **And** new = in current but not in previous
   **And** carried-forward = in both current and previous
   **And** resolved = in previous but not in current

   **step-03-present-delta.md:**
   **Then** it presents: delta summary, new findings tagged [NEW], carried-forward tagged [CARRIED], resolved listed briefly (FR41)
   **And** after presenting, saves current findings as history for next run
   **And** ends with compass routing table

## Tasks / Subtasks

- [x] Task 1: Validate delta-report workflow.md (AC: #1)
  - [x] 1.1 Verify frontmatter: name=delta-report, agent=readiness-analyst, steps=3, implements=Epic 4 (Story 4.6) — confirmed lines 2-7
  - [x] 1.2 Verify prerequisites: GC3 findings.yaml required (line 16), history.yaml optional (line 17) — confirmed
  - [x] 1.3 Verify pipeline table: 3 steps (load-history line 23, compute-delta line 24, present-delta line 25) — confirmed
  - [x] 1.4 Verify first-run behavior: no history → all findings [NEW], save as history — confirmed lines 27-29
  - [x] 1.5 Verify error recovery: findings.yaml missing → run gap-analysis (line 33), history.yaml missing → first run (line 34) — confirmed

- [x] Task 2: Validate step-01-load-history.md (AC: #1 — FR39)
  - [x] 2.1 Verify frontmatter: step=1 (line 2), workflow=delta-report (line 3), title=Load History (line 4), implements=Story 4.6 (FR39) (line 5) — confirmed
  - [x] 2.2 Verify mandatory execution rules: current findings MUST exist (line 14), previous findings optional (line 15) — confirmed
  - [x] 2.3 Verify current findings load: read findings.yaml (line 21), STOP if missing with gap-analysis recommendation (lines 23-30) — confirmed
  - [x] 2.4 Verify previous findings load: read history.yaml (line 36), first run message if missing (lines 38-43), set first_run=true (line 45) — confirmed
  - [x] 2.5 Verify schema version compatibility check with mismatch warning (lines 49-57) — confirmed
  - [x] 2.6 Verify Load step directive to step-02-compute-delta.md (line 63) — confirmed

- [x] Task 3: Validate step-02-compute-delta.md (AC: #1 — FR40)
  - [x] 3.1 Verify frontmatter: step=2 (line 2), workflow=delta-report (line 3), title=Compute Delta (line 4), implements=Story 4.6 (FR40) (line 5) — confirmed
  - [x] 3.2 Verify mandatory execution rules: match by capability_ref (primary) + domain (secondary) (line 14), new/carried/resolved definitions (lines 15-17), compound delta (line 18) — confirmed
  - [x] 3.3 Verify finding maps: current map and previous map by capability_ref (lines 25-26) — confirmed
  - [x] 3.4 Verify classification: CARRIED (in both, note severity/confidence changes, lines 31-33), NEW (current only, line 34), RESOLVED (previous only, line 37) — confirmed
  - [x] 3.5 Verify compound classification: CARRIED (both related findings carried, line 42), NEW (otherwise, line 43), RESOLVED (either related finding resolved, line 46) — confirmed
  - [x] 3.6 Verify summary statistics: new_findings, carried_forward, resolved, severity_changes, new_compounds, resolved_compounds, net_change (lines 50-58) — confirmed all 7 fields
  - [x] 3.7 Verify first run handling: all NEW, no carried/resolved (lines 63-66) — confirmed
  - [x] 3.8 Verify Load step directive to step-03-present-delta.md (line 72) — confirmed

- [x] Task 4: Validate step-03-present-delta.md (AC: #1 — FR41)
  - [x] 4.1 Verify frontmatter: step=3 (line 2), workflow=delta-report (line 3), title=Present Delta (line 4), implements=Story 4.6 (FR41) (line 5) — confirmed
  - [x] 4.2 Verify mandatory execution rules: [NEW]/[CARRIED] tags FR41 (line 14), resolved list (line 15), severity changes (line 16), save history (line 17), copy-pasteable FR49 (line 18) — confirmed all 5
  - [x] 4.3 Verify delta header: mode indicator (line 25), date comparison (line 27), first-run baseline (lines 31-35) — confirmed
  - [x] 4.4 Verify delta summary table: New/Carried/Resolved counts + net change (lines 41-47) — confirmed
  - [x] 4.5 Verify new findings section: [NEW] tag (line 49), table with ID/description/severity/confidence (lines 54-56), empty-state handler (lines 59-63) — confirmed
  - [x] 4.6 Verify carried-forward section: [CARRIED] tag (line 66), table with severity change column (lines 71-73), empty-state handler (lines 76-80) — confirmed
  - [x] 4.7 Verify resolved section: brief table with ID/description/was-severity (lines 90-92), empty-state handler (lines 95-99) — confirmed
  - [x] 4.8 Verify compound finding changes: new compounds + resolved compounds sections (lines 102-113) — confirmed
  - [x] 4.9 Verify history save: copy findings.yaml to history.yaml (line 119), confirmation message (lines 122-127) — confirmed
  - [x] 4.10 Verify Gyre Compass routing table at end (lines 129-143) — confirmed 5-row table

- [x] Task 5: Validate step chain continuity
  - [x] 5.1 Verify step-01 → step-02 handoff (Load directive) — confirmed step-01 line 63
  - [x] 5.2 Verify step-02 → step-03 handoff (Load directive) — confirmed step-02 line 72
  - [x] 5.3 Verify workflow.md pipeline table lists all 3 steps with correct actions — confirmed lines 23-25
  - [x] 5.4 Verify all 3 step files reference workflow: delta-report in frontmatter — confirmed step-01 line 3, step-02 line 3, step-03 line 3

- [x] Task 6: Fix any discrepancies found in Tasks 1-5 — No discrepancies found

## Dev Notes

### Pre-existing Files — Validation Approach

All files already exist from the 2026-03-21 architecture scaffolding:
- `_bmad/bme/_gyre/workflows/delta-report/workflow.md` (35 lines)
- `_bmad/bme/_gyre/workflows/delta-report/steps/step-01-load-history.md` (64 lines)
- `_bmad/bme/_gyre/workflows/delta-report/steps/step-02-compute-delta.md` (73 lines)
- `_bmad/bme/_gyre/workflows/delta-report/steps/step-03-present-delta.md` (144 lines)

### Architecture Reference — Delta Report

From `architecture-gyre.md`:

**Workflow 5: delta-report (Lens)**
- Owner: Lens 🔬 (readiness-analyst)
- Steps: 3
- Purpose: Compare current findings against previous — track progress

**FR39:** Load history.yaml (previous) and findings.yaml (current)
**FR40:** Compute: new (current only), carried-forward (both), resolved (previous only)
**FR41:** Present: [NEW] tags, [CARRIED] tags, resolved list
**FR49:** Copy-pasteable output

### What NOT to Modify

- **Do NOT modify gap-analysis workflow** — Already validated in Epic 3
- **Do NOT modify full-analysis workflow** — Already validated in Stories 3.6, 4.5
- **Do NOT modify Lens agent file** — Already validated in Story 3.1
- **Do NOT modify GC3 contract** — Already validated in Story 3.5

### Previous Story Intelligence

From Story 4.5 (mode detection) completion notes:
- All 22 validation subtasks passed — zero discrepancies
- Lens agent menu includes [DR] Delta Report pointing to delta-report/workflow.md (validated in Story 3.1)

From Story 3.5 (GC3 contract) completion notes:
- GC3 schema: findings array with 9 fields, compound_findings with 8 fields
- capability_ref is the primary matching key for delta comparison

### Project Structure Notes

- Delta-report workflow: `_bmad/bme/_gyre/workflows/delta-report/`
- History file: `.gyre/history.yaml` (copy of previous findings.yaml)
- Current findings: `.gyre/findings.yaml` (GC3)

### References

- [Source: _bmad-output/planning-artifacts/epic-gyre.md — Story 4.6 ACs]
- [Source: _bmad-output/planning-artifacts/architecture-gyre.md — delta-report workflow]
- [Source: _bmad/bme/_gyre/workflows/delta-report/ — Pre-existing files]
- [Source: _bmad-output/implementation-artifacts/gyre-4-5-mode-detection-review-prompt-integration.md — Story 4.5 completion]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

None — no errors encountered.

### Completion Notes List

- All 29 validation subtasks passed across 6 tasks and 4 files — zero discrepancies found
- Task 1 (workflow.md, 35 lines): Frontmatter (name/agent/steps/implements), prerequisites (GC3 required, history optional), 3-step pipeline table, first-run behavior, error recovery (2 cases) — all correct
- Task 2 (step-01-load-history.md, 64 lines): Frontmatter with FR39, 2 mandatory rules, current findings load with STOP, previous findings load with first_run=true, schema version compatibility check, Load directive to step-02 — all correct
- Task 3 (step-02-compute-delta.md, 73 lines): Frontmatter with FR40, 4 mandatory rules (capability_ref match, new/carried/resolved, compound delta), finding maps, 3-way classification with severity/confidence change tracking, compound classification (3 categories), 7 summary statistics, first run handling, Load directive to step-03 — all correct
- Task 4 (step-03-present-delta.md, 144 lines): Frontmatter with FR41, 5 mandatory rules (tags/resolved/severity/history/FR49), delta header (mode + first-run), summary table (4 rows), new findings [NEW] with empty-state, carried-forward [CARRIED] with severity change column + empty-state, resolved with empty-state, compound changes, history save with confirmation, 5-row Gyre Compass — all correct
- Task 5 (step chain): step-01 → step-02 → step-03 handoffs confirmed, pipeline table matches all 3 steps, all 3 files reference workflow: delta-report — all correct
- Task 6 (fix): No discrepancies found — sixth consecutive clean validation in Epic 4
- This is a validation-only story — no files were created or modified

### Change Log

- 2026-03-23: Full validation of 4 delta-report workflow files (workflow.md 35 lines, step-01 64 lines, step-02 73 lines, step-03 144 lines) — all checks passed, no changes needed

### File List

- `_bmad/bme/_gyre/workflows/delta-report/workflow.md` (validated, no changes)
- `_bmad/bme/_gyre/workflows/delta-report/steps/step-01-load-history.md` (validated, no changes)
- `_bmad/bme/_gyre/workflows/delta-report/steps/step-02-compute-delta.md` (validated, no changes)
- `_bmad/bme/_gyre/workflows/delta-report/steps/step-03-present-delta.md` (validated, no changes)
