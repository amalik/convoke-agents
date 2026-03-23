# Story 4.2: Conversational Model Review & Amendment

Status: review

## Story

As a user,
I want Coach to walk me through my capabilities manifest one capability at a time,
So that I can customize it to my stack without editing YAML.

## Acceptance Criteria

1. **Given** the model-review workflow exists at `_bmad/bme/_gyre/workflows/model-review/`
   **When** Coach runs the walkthrough (step-02-walkthrough.md)
   **Then** it presents each capability with: name, description, category, source
   **And** for each capability asks: keep / remove / edit / skip remaining (FR24)
   **And** user responds conversationally — "remove this", "keep", "change the description to..." (FR25)
   **And** removed capabilities get `removed: true` flag (FR27 — model subtraction)
   **And** edited capabilities get `amended: true` flag
   **And** user can add new capabilities by describing them conversationally

2. **When** Coach applies amendments (step-03-apply-amendments.md)
   **Then** amendments are written directly to `.gyre/capabilities.yaml` (GC4)
   **And** amendments persist on subsequent runs — Atlas respects them on regeneration (FR26)
   **And** amended artifacts must not contain source code or secrets (NFR9)

## Tasks / Subtasks

- [x] Task 1: Validate model-review workflow.md (AC: #1, #2)
  - [x] 1.1 Verify frontmatter: name=model-review, agent=review-coach, steps=5, implements=Epic 4 (Stories 4.2, 4.4, 4.5) — confirmed lines 2-8
  - [x] 1.2 Verify prerequisites: GC2 required (line 16), GC3 optional for findings review only (line 17) — confirmed
  - [x] 1.3 Verify pipeline table: 5 steps (load-context, walkthrough, apply-amendments, capture-feedback, summary) — confirmed lines 21-27
  - [x] 1.4 Verify mode selection: Review Model (steps 1-5), Review Findings (steps 1,4,5), Both (full) — confirmed lines 31-35
  - [x] 1.5 Verify error recovery: GC2 missing → offer Atlas (line 39), GC3 missing → offer Lens (line 40), amendment write fail → retry (line 41) — confirmed

- [x] Task 2: Validate step-02-walkthrough.md structure (AC: #1)
  - [x] 2.1 Verify frontmatter: step=2, workflow=model-review, title=Capabilities Walkthrough, implements=Story 4.2 (FR24, FR25, FR27) — confirmed lines 2-6
  - [x] 2.2 Verify mandatory execution rules: category grouping (line 14), per-capability presentation with name/description/category/source/relevance (line 15), conversational responses keep/remove/edit/skip remaining (line 16), never push FR24 (line 18), user can add FR25 (line 19) — all 6 confirmed
  - [x] 2.3 Verify category overview: table with Observability/Deployment/Reliability/Security counts plus Total — confirmed lines 27-46

- [x] Task 3: Validate step-02 walkthrough interaction patterns (AC: #1)
  - [x] 3.1 Verify per-capability presentation format: "[N of total] [capability-name] ([category])", description, source/relevance, prompt — confirmed lines 52-58
  - [x] 3.2 Verify response handlers: Keep (unchanged, line 62), Remove (`removed: true` + confirmation, lines 64-67), Edit (conversational description/category/name changes, `amended: true`, lines 69-77), Add (user-described, `source: user-added`, confirmation, lines 79-88) — all 4 confirmed
  - [x] 3.3 Verify "skip remaining" handler: confirm count remaining, mark all as kept — confirmed lines 90-93
  - [x] 3.4 Verify walkthrough summary: kept/removed/edited/added counts, "Ready to apply these changes?" confirmation prompt — confirmed lines 95-110
  - [x] 3.5 Verify Load step directive to step-03-apply-amendments.md — confirmed line 116

- [x] Task 4: Validate step-03-apply-amendments.md (AC: #2)
  - [x] 4.1 Verify frontmatter: step=3, workflow=model-review, title=Apply Amendments, implements=Story 4.2 (FR25, FR26, FR27) + Story 4.3 — confirmed lines 2-6
  - [x] 4.2 Verify mandatory execution rules: read before write (line 14), apply to capabilities array (line 15), `removed: true` FR27 (line 16), `amended: true` with `original_*` (line 17), new with `source: user-added` (line 18), frontmatter update (line 19), NFR9 (line 20), atomic write (line 21) — all 8 confirmed
  - [x] 4.3 Verify removal process: `removed: true` + `removed_at` date, do NOT delete entry (FR26 persistence) — confirmed lines 31-34
  - [x] 4.4 Verify edit process: `amended: true` + `amended_at`, `original_*` fields for changed values — confirmed lines 38-42
  - [x] 4.5 Verify add process: unique ID pattern `[category-prefix]-[NNN]`, `source: user-added`, `amended: true` + `amended_at` — confirmed lines 46-51
  - [x] 4.6 Verify frontmatter update: `last_reviewed`, `review_deferred: false`, `amendment_count` — confirmed lines 54-57
  - [x] 4.7 Verify confirmation output: removed/edited/added counts, amendment count, persistence message — confirmed lines 63-74
  - [x] 4.8 Verify error recovery: write fail → retry/display YAML/exit options — confirmed lines 78-86
  - [x] 4.9 Verify Load step directive to step-04-capture-feedback.md — confirmed line 92

- [x] Task 5: Validate step chain continuity
  - [x] 5.1 Verify step-02 Load directive points to step-03 (step 2 → step 3 handoff) — confirmed line 116
  - [x] 5.2 Verify step-03 Load directive points to step-04 (step 3 → step 4 handoff) — confirmed line 92
  - [x] 5.3 Verify workflow.md pipeline table lists step-02 (walkthrough, line 24) and step-03 (apply amendments, line 25) with correct actions — confirmed
  - [x] 5.4 Verify both step files reference `workflow: model-review` in frontmatter — step-02 line 3, step-03 line 3 — confirmed

- [x] Task 6: Fix any discrepancies found in Tasks 1-5 — No discrepancies found

## Dev Notes

### Pre-existing Files — Validation Approach

All files already exist from the 2026-03-21 architecture scaffolding:
- `_bmad/bme/_gyre/workflows/model-review/workflow.md` (42 lines)
- `_bmad/bme/_gyre/workflows/model-review/steps/step-02-walkthrough.md` (117 lines)
- `_bmad/bme/_gyre/workflows/model-review/steps/step-03-apply-amendments.md` (93 lines)

This story validates these against the Epic 4 ACs for the walkthrough → apply-amendments flow.

### Architecture Reference — Model Review Workflow

From `architecture-gyre.md`:

**Workflow 4: model-review (Coach)**
- Owner: Coach 🏋️
- Steps: 3 (architecture) → expanded to 5 in implementation (load-context, walkthrough, apply-amendments, capture-feedback, summary)

| Step | File | Action |
|------|------|--------|
| 1 | step-01-load-context.md | Load artifacts, display existing feedback, detect deferred review |
| 2 | step-02-walkthrough.md | Present each capability one at a time: keep/remove/edit |
| 3 | step-03-apply-amendments.md | Write amendments to capabilities.yaml, write GC4 |
| 4 | step-04-capture-feedback.md | Prompt for missed gaps, persist to feedback.yaml |
| 5 | step-05-summary.md | Present review summary and compass routing |

**Key FR/NFR Requirements:**

| Requirement | What to Check |
|---|---|
| FR24 (review walkthrough) | Each capability: keep/remove/edit/skip remaining |
| FR25 (conversational responses) | User responds naturally — "remove this", "change description to..." |
| FR26 (amendment persistence) | Amendments persist across Atlas regeneration |
| FR27 (model subtraction) | `removed: true` flag, entry NOT deleted |
| NFR9 (no secrets) | Amended artifacts must not contain source code or secrets |

### What NOT to Modify

- **Do NOT modify step-01-load-context.md** — Validated in Story 4.5
- **Do NOT modify step-04-capture-feedback.md** — Validated in Story 4.4
- **Do NOT modify step-05-summary.md** — Validated in Story 4.7
- **Do NOT modify Coach agent file** — Already validated in Story 4.1
- **Do NOT modify any gap-analysis files** — Validated in Epic 3
- **Do NOT modify any contracts** — GC4 validated in Story 4.3

### Previous Story Intelligence

From Story 4.1 (Coach agent definition) completion notes:
- All 26 validation subtasks passed across 6 tasks — zero discrepancies
- Coach rules validated: GC3 before findings, GC2 before model, severity-first, never push, amendments to capabilities.yaml, feedback to feedback.yaml, NFR9
- Coach menu items [RF] and [RM] both point to model-review/workflow.md

### Project Structure Notes

- Model-review workflow: `_bmad/bme/_gyre/workflows/model-review/`
- Target files: `workflow.md`, `steps/step-02-walkthrough.md`, `steps/step-03-apply-amendments.md`

### References

- [Source: _bmad-output/planning-artifacts/epic-gyre.md — Story 4.2 ACs]
- [Source: _bmad-output/planning-artifacts/architecture-gyre.md — model-review workflow]
- [Source: _bmad/bme/_gyre/workflows/model-review/workflow.md — Pre-existing file (42 lines)]
- [Source: _bmad/bme/_gyre/workflows/model-review/steps/step-02-walkthrough.md — Pre-existing file (117 lines)]
- [Source: _bmad/bme/_gyre/workflows/model-review/steps/step-03-apply-amendments.md — Pre-existing file (93 lines)]
- [Source: _bmad-output/implementation-artifacts/gyre-4-1-coach-agent-definition.md — Story 4.1 completion]

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### Change Log

### File List
