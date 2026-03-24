# Story 4.7: Full-Analysis Completion & Compass

Status: ready-for-dev

## Story

As a user finishing a full analysis,
I want to see my options for what to do next,
So that I can continue with review, re-run, or move to Vortex.

## Acceptance Criteria

1. **Given** full-analysis step-05-review-findings.md is the final step
   **When** Coach finishes review and feedback
   **Then** it displays the Gyre compass routing table with all options
   **And** includes inter-module routing to Vortex for findings that impact product discovery
   **And** all 7 Gyre workflows are independently runnable from this point (NFR18)

## Tasks / Subtasks

- [ ] Task 1: Validate step-05-review-findings.md compass section (AC: #1)
  - [ ] 1.1 Verify frontmatter implements: Epic 4 (Stories 4.5, 4.7) — must reference Story 4.7
  - [ ] 1.2 Verify section 6 "Full-Analysis Complete — Gyre Compass" exists after review/feedback
  - [ ] 1.3 Verify completion banner: "Full Analysis Complete" with all 5 steps finished
  - [ ] 1.4 Verify artifact list: GC1 (stack-profile.yaml), GC2 (capabilities.yaml), GC3 (findings.yaml), GC4 (feedback.yaml conditional)
  - [ ] 1.5 Verify commit tip: "Commit the .gyre/ directory to share with your team"

- [ ] Task 2: Validate Gyre Compass routing table (AC: #1 — NFR18)
  - [ ] 2.1 Verify compass table has 8 rows covering all navigation options
  - [ ] 2.2 Verify row: stack-detection → Scout 🔎
  - [ ] 2.3 Verify row: model-generation → Atlas 📐
  - [ ] 2.4 Verify row: model-review → Coach 🏋️
  - [ ] 2.5 Verify row: gap-analysis → Lens 🔬
  - [ ] 2.6 Verify row: delta-report → Lens 🔬
  - [ ] 2.7 Verify row: full-analysis → Scout 🔎
  - [ ] 2.8 Verify row: accuracy-validation → Atlas 📐
  - [ ] 2.9 Verify all 7 Gyre workflows represented (NFR18 — independently runnable)
  - [ ] 2.10 Verify "Note" footer: recommendations, any workflow at any time

- [ ] Task 3: Validate inter-module routing to Vortex (AC: #1)
  - [ ] 3.1 Verify Vortex routing row exists in compass table
  - [ ] 3.2 Verify Vortex row references appropriate Vortex agents (Emma 🎯 / Isla 🔍)
  - [ ] 3.3 Verify Vortex row describes: findings impact product discovery / production readiness gaps inform discovery

- [ ] Task 4: Cross-reference compass with architecture-gyre.md
  - [ ] 4.1 Verify compass table rows match architecture Gyre Compass Table (7 workflows + Vortex)
  - [ ] 4.2 Verify agent assignments match architecture: Scout, Atlas, Coach, Lens
  - [ ] 4.3 Verify workflow names match GYRE_WORKFLOWS array: full-analysis, stack-detection, model-generation, model-review, gap-analysis, delta-report, accuracy-validation

- [ ] Task 5: Validate full-analysis pipeline completeness
  - [ ] 5.1 Verify workflow.md pipeline table lists step-05 as final step (step 5 of 5)
  - [ ] 5.2 Verify step-05 agent is Coach 🏋️ in pipeline table
  - [ ] 5.3 Verify step-05 is the terminal step — no Load directive to another step after compass

- [ ] Task 6: Fix any discrepancies found in Tasks 1-5

## Dev Notes

### Pre-existing Files — Validation Approach

The primary file was already validated in Story 4.5 for mode detection and review prompt. This story validates the compass/completion aspects (section 6) of the same file:
- `_bmad/bme/_gyre/workflows/full-analysis/steps/step-05-review-findings.md` (129 lines)
- `_bmad/bme/_gyre/workflows/full-analysis/workflow.md` (40 lines) — for pipeline verification

### Architecture Reference — Compass & Completion

From `architecture-gyre.md`:

**Gyre Compass Table** (section: Compass Routing):
- 7 workflow rows: stack-detection, model-generation, model-review, gap-analysis, delta-report, full-analysis, accuracy-validation
- 4 agents: Scout 🔎, Atlas 📐, Coach 🏋️, Lens 🔬

**Inter-Module Routing (Gyre ↔ Vortex):**
- Critical readiness gaps → Emma 🎯 (product-vision/contextualize-scope)
- Findings challenge assumptions → Liam 💡 (hypothesis-engineering)
- Feedback suggests missing capabilities → Isla 🔍 (user-interview)

**NFR18:** Each Gyre workflow independently runnable
**GYRE_WORKFLOWS:** full-analysis, stack-detection, model-generation, model-review, gap-analysis, delta-report, accuracy-validation (7 total)

### What NOT to Modify

- **Do NOT modify steps 1-4 of full-analysis** — Already validated in Stories 1.7, 2.5, 3.6, 4.5
- **Do NOT modify workflow.md** — Already validated in Story 1.7
- **Do NOT modify Coach agent file** — Already validated in Story 4.1
- **Do NOT modify any other workflow compasses** — Only validating step-05's compass

### Previous Story Intelligence

From Story 4.6 (delta report) completion notes:
- All 29 validation subtasks passed — zero discrepancies
- Delta-report workflow validated: 3 steps, Lens agent, FR39/FR40/FR41
- Delta-report compass has 5 rows (subset of full compass)

From Story 4.5 (mode detection) completion notes:
- step-05-review-findings.md (129 lines) validated for mode detection and review prompt
- Frontmatter: implements: Epic 4 (Stories 4.5, 4.7) — BOTH stories referenced
- Gyre Compass in section 6 has 8 rows (7 workflows + Vortex)
- Inter-module routing row references Emma 🎯 / Isla 🔍

### Project Structure Notes

- step-05-review-findings: `_bmad/bme/_gyre/workflows/full-analysis/steps/step-05-review-findings.md`
- full-analysis workflow: `_bmad/bme/_gyre/workflows/full-analysis/workflow.md`

### References

- [Source: _bmad-output/planning-artifacts/epic-gyre.md — Story 4.7 ACs]
- [Source: _bmad-output/planning-artifacts/architecture-gyre.md — Compass Routing, Inter-Module Routing, GYRE_WORKFLOWS]
- [Source: _bmad/bme/_gyre/workflows/full-analysis/steps/step-05-review-findings.md — Pre-existing file (129 lines)]
- [Source: _bmad/bme/_gyre/workflows/full-analysis/workflow.md — Pipeline reference (40 lines)]
- [Source: _bmad-output/implementation-artifacts/gyre-4-6-delta-report-workflow.md — Story 4.6 completion]
- [Source: _bmad-output/implementation-artifacts/gyre-4-5-mode-detection-review-prompt-integration.md — Story 4.5 completion]

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### Change Log

### File List
