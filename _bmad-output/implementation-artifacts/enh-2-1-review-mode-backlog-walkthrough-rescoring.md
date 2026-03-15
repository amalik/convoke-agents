# Story 2.1: Review Mode — Backlog Walkthrough & Rescoring

Status: ready-for-dev

## Story

As a Product Owner,
I want to walk through my existing backlog items, see their current scores and provenance, and rescore items where priorities have shifted,
So that the backlog stays calibrated over time and doesn't drift from reality.

## Acceptance Criteria

1. **Given** the Product Owner selects Review mode from the T/R/C menu **When** the workflow loads **Then** it loads the existing backlog file and the RICE scoring guide template (FR30)

2. **Given** the backlog is loaded **When** the walkthrough begins **Then** items are presented one at a time with: title, current RICE component scores, composite score, category, and current provenance (FR48)

3. **Given** an item is presented during walkthrough **When** the Product Owner reviews it **Then** they can change individual RICE component scores with updated rationale (FR31) **Or** they can confirm the current score (FR31) **Or** they can skip the item without rescoring (FR47)

4. **Given** an item's score is changed **When** the new score is recorded **Then** rescore provenance is added: "Rescored [old]→[new], Review, [date]" (FR22)

5. **Given** an item is skipped or confirmed **When** the walkthrough continues **Then** no provenance change is recorded for that item

6. **Given** the walkthrough is in progress **When** the Product Owner indicates they want to stop early **Then** only items already rescored are written; unvisited items remain unchanged

7. **Given** all items have been walked through (or the Product Owner exits early) **When** the Review mode completes **Then** the prioritized view table is regenerated with updated scores sorted by composite score (reuses FR20) **And** a changelog entry is added in the correct format (reuses FR23) **And** existing backlog content is preserved — no deletions or reordering (reuses NFR1) **And** pre-write format validation runs before writing (reuses FR24) **And** a completion summary shows items changed/confirmed/skipped and new top 3 positions (reuses FR27) **And** the T/R/C menu re-presents (reuses FR28)

8. **Given** the mode management shell (Story 1.3) currently shows "Coming soon" for Review **When** this story is deployed **Then** the "Coming soon" placeholder is replaced with the Review step chain dispatch

## Tasks / Subtasks

- [ ] Task 1: Author `step-r-01-load.md` — Backlog Load & Walkthrough Setup (AC: 1, 2)
  - [ ] 1.1 Create step file with BMAD step frontmatter (name, description, nextStepFile to step-r-02-rescore.md, outputFile, templateFile for rice-scoring-guide.md)
  - [ ] 1.2 MANDATORY EXECUTION RULES section with review analyst role
  - [ ] 1.3 MANDATORY SEQUENCE: (1) Load existing backlog from `{outputFile}`, (2) Load RICE scoring guide from `{templateFile}`, (3) Parse all category tables to collect items with current scores and provenance, (4) Count total items for walkthrough progress tracking
  - [ ] 1.4 Menu: [C] Continue only (no A/P — this is data loading, not content refinement)
  - [ ] 1.5 On C: pass loaded items to step-r-02-rescore.md

- [ ] Task 2: Author `step-r-02-rescore.md` — Item Walkthrough & Rescoring (AC: 2, 3, 4, 5, 6)
  - [ ] 2.1 Create step file with BMAD step frontmatter (name, description, nextStepFile to step-r-03-update.md, outputFile, templateFile for rice-scoring-guide.md, advancedElicitationTask, partyModeWorkflow)
  - [ ] 2.2 MANDATORY EXECUTION RULES section with rescoring analyst role
  - [ ] 2.3 MANDATORY SEQUENCE part 1 — Present Item: Show current item with title, category, R/I/C/E scores, composite score, and current provenance. Show walkthrough progress (e.g., "Item 3 of 29").
  - [ ] 2.4 MANDATORY SEQUENCE part 2 — Per-Item Menu: command-based score adjustments (`R [value]`, `I [value]`, `CF [value]`, `E [value]` for current item), `K` to confirm/keep current score, `S` to skip without rescoring, `X` to exit walkthrough early, `A` for Advanced Elicitation, `P` for Party Mode, `C` to apply changes and advance to next item
  - [ ] 2.5 Per-item handling: On score adjustment — recalculate composite, redisplay updated scores. On K — mark as confirmed, advance. On S — mark as skipped, advance. On X — exit walkthrough, proceed to step-r-03 with only rescored items. On C — record rescore provenance if scores changed, advance to next item.
  - [ ] 2.6 After last item (or X exit): pass all rescored/confirmed/skipped results to step-r-03-update.md

- [ ] Task 3: Author `step-r-03-update.md` — Backlog Update & Completion (AC: 4, 6, 7)
  - [ ] 3.1 Create step file with BMAD step frontmatter (name, description, outputFile, templateFile for backlog-format-spec.md, workflowFile for return-to-menu). No nextStepFile (Type 10 final step).
  - [ ] 3.2 MANDATORY EXECUTION RULES section with backlog operations specialist role (reuse pattern from step-t-04-update.md)
  - [ ] 3.3 MANDATORY SEQUENCE part 1 — Pre-Write Validation: Same as step-t-04 (7 H2 section headings, 6-col prioritized view, 10-col category tables, changelog existence). Mismatch handling with [Y]/[X].
  - [ ] 3.4 MANDATORY SEQUENCE part 2 — Apply Rescores: For each rescored item, update R/I/C/E and composite score in category table. Add rescore provenance: "Rescored [old]→[new], Review, [date]" (FR22). Preserve all non-rescored items unchanged.
  - [ ] 3.5 MANDATORY SEQUENCE part 3 — Regenerate Prioritized View: Same as step-t-04 (all active items sorted by composite score descending, tiebreak by Confidence then insertion order).
  - [ ] 3.6 MANDATORY SEQUENCE part 4 — Add Changelog Entry: Prepend to changelog table. Format: "Review: Rescored [N] items, confirmed [N], skipped [N]."
  - [ ] 3.7 MANDATORY SEQUENCE part 5 — Update Last Updated Date.
  - [ ] 3.8 MANDATORY SEQUENCE part 6 — Completion Summary: Display items rescored/confirmed/skipped, new top 3 positions. Then return to T/R/C menu via `{workflowFile}`.

- [ ] Task 4: Update `workflow.md` — Enable Review Mode Dispatch (AC: 8)
  - [ ] 4.1 Replace "Coming soon" message for R option with: Load, read the entire file, and execute `{project-root}/_bmad/bme/_enhance/workflows/initiatives-backlog/steps-r/step-r-01-load.md`

## Dev Notes

### This Story Creates Three Step Files + One Workflow Edit

Story 2.1 creates **three markdown step files** in `steps-r/` and modifies `workflow.md`. No JavaScript, no tests, no installer changes.

### Files to Create

1. **`_bmad/bme/_enhance/workflows/initiatives-backlog/steps-r/step-r-01-load.md`** — Backlog load and walkthrough setup
2. **`_bmad/bme/_enhance/workflows/initiatives-backlog/steps-r/step-r-02-rescore.md`** — Per-item walkthrough with rescoring
3. **`_bmad/bme/_enhance/workflows/initiatives-backlog/steps-r/step-r-03-update.md`** — Backlog update, completion summary, return-to-menu

### File to Modify

4. **`_bmad/bme/_enhance/workflows/initiatives-backlog/workflow.md`** — Replace R "Coming soon" with step chain dispatch

### Step File Frontmatter Patterns

**step-r-01-load.md:**
```yaml
---
name: 'step-r-01-load'
description: 'Load existing backlog and RICE scoring guide for Review mode walkthrough'
nextStepFile: '{project-root}/_bmad/bme/_enhance/workflows/initiatives-backlog/steps-r/step-r-02-rescore.md'
outputFile: '{planning_artifacts}/initiatives-backlog.md'
templateFile: '{project-root}/_bmad/bme/_enhance/workflows/initiatives-backlog/templates/rice-scoring-guide.md'
---
```

**step-r-02-rescore.md:**
```yaml
---
name: 'step-r-02-rescore'
description: 'Walk through backlog items one at a time for rescoring with RICE adjustments'
nextStepFile: '{project-root}/_bmad/bme/_enhance/workflows/initiatives-backlog/steps-r/step-r-03-update.md'
outputFile: '{planning_artifacts}/initiatives-backlog.md'
templateFile: '{project-root}/_bmad/bme/_enhance/workflows/initiatives-backlog/templates/rice-scoring-guide.md'
advancedElicitationTask: '{project-root}/_bmad/core/workflows/advanced-elicitation/workflow.md'
partyModeWorkflow: '{project-root}/_bmad/core/workflows/bmad-party-mode/workflow.md'
---
```

**step-r-03-update.md:**
```yaml
---
name: 'step-r-03-update'
description: 'Apply rescores to backlog, regenerate prioritized view, present completion summary'
outputFile: '{planning_artifacts}/initiatives-backlog.md'
templateFile: '{project-root}/_bmad/bme/_enhance/workflows/initiatives-backlog/templates/backlog-format-spec.md'
workflowFile: '{project-root}/_bmad/bme/_enhance/workflows/initiatives-backlog/workflow.md'
---
```

### Step Type Classification

- **step-r-01-load.md** = Type 5 "Middle Step (Simple)" — data loading, C-only menu, no A/P
- **step-r-02-rescore.md** = Type 4 "Middle Step (Standard)" with A/P — collaborative rescoring with per-item commands
- **step-r-03-update.md** = Type 10 "Final Step" — no next step, completion summary, return to parent workflow

### Per-Item Walkthrough Interaction (step-r-02)

Items are presented **one at a time** (not batch like Triage). Each item shows:

> **Item 3 of 29 — Documentation & Onboarding**
>
> **D2: Problem-framing sentence per Vortex agent** — Score: 4.5
> R:6 I:3 C:50% E:2
> *Provenance: Added from retrospective findings, 2026-02-28*

**Per-item commands:**
- `R [value]` — Change Reach (1-10)
- `I [value]` — Change Impact (0.25, 0.5, 1, 2, or 3)
- `CF [value]` — Change Confidence (20-100%) — uses CF to avoid ambiguity with C
- `E [value]` — Change Effort (1-10)
- `K` — Keep/confirm current score (no provenance change)
- `S` — Skip item (no provenance change)
- `X` — Exit walkthrough early (proceed to update step with changes so far)
- `A` — Advanced Elicitation (deeper scoring analysis for this item)
- `P` — Party Mode (multi-perspective discussion for this item)
- `C` — Apply current changes and advance to next item

After each score adjustment: recalculate composite, redisplay scores, halt and wait.

**BMAD reserved letter management:**
- `A` = Advanced Elicitation (standard BMAD reserved)
- `P` = Party Mode (standard BMAD reserved)
- `C` = Continue/advance to next item (standard BMAD reserved)
- `CF` = Confidence factor (avoids C conflict — pattern from Story 1.5)
- `K` = Keep/confirm (avoids using C which means Continue)
- `S` = Skip (unique to Review walkthrough)
- `X` = Exit early (standard BMAD exit convention)

### Rescore Provenance (FR22)

Format: `"Rescored [old]→[new], Review, [date]"`
Example: `Rescored 1.8→2.4, Review, 2026-03-15`

**Rules (from backlog-format-spec.md and rice-scoring-guide.md):**
- Only recorded when the composite score actually changes
- Confirming an existing score (`K`) generates no provenance entry
- Skipping an item (`S`) generates no provenance entry
- The provenance is appended to the item's Initiative description in the category table

### Reuse Patterns from Epic 1

**step-r-03-update.md should follow step-t-04-update.md closely:**
- Same pre-write validation (7 H2 sections, column counts, changelog)
- Same mismatch handling ([Y]/[X])
- Same prioritized view regeneration (sort + tiebreak)
- Same changelog table format
- Same Last Updated date refresh
- Same return-to-menu pattern (load `{workflowFile}`)
- **Difference:** Rescore provenance (FR22) instead of new-item provenance (FR21)
- **Difference:** Completion summary shows rescored/confirmed/skipped instead of added/merged

**step-r-01-load.md should follow step-t-01-ingest.md pattern:**
- Same C-only menu approach (data loading, not content refinement)
- **Difference:** Loads and parses existing backlog instead of accepting user input

**step-r-02-rescore.md should follow step-t-03-score.md pattern:**
- Same A/P frontmatter references
- Same CF disambiguation for Confidence
- **Difference:** Per-item walkthrough instead of batch scoring
- **Difference:** K/S commands for confirm/skip (unique to Review)

### workflow.md Modification

Replace the R handler line:
```
- **IF R:** Display "**Coming soon** — Review mode will be available in a future update." then redisplay the Mode Selection menu above
```
With:
```
- **IF R:** Load, read the entire file, and execute `{project-root}/_bmad/bme/_enhance/workflows/initiatives-backlog/steps-r/step-r-01-load.md`
```

This matches the T handler pattern exactly.

### What NOT to Do

- Do NOT modify any Triage step files (step-t-01 through step-t-04) — they are complete
- Do NOT modify any JavaScript files — this is pure markdown content + one workflow edit
- Do NOT implement Create mode logic — that's Epic 3
- Do NOT delete or reorder existing backlog items during Review — only rescore in-place
- Do NOT generate rescore provenance for confirmed or skipped items
- Do NOT add new items during Review — that's Triage mode's job

### PRD Deviations — Intentional

**FR23 changelog format:** PRD originally said "### YYYY-MM-DD with bullet items" but was corrected to table format during Epic 1 retrospective review. Implementation follows `backlog-format-spec.md` canonical table format.

### Previous Story Intelligence (from Epic 1)

**Key learnings:**
- BMAD reserved letters: A (Advanced Elicitation), P (Party Mode), C (Continue). Use CF for Confidence, K for Keep/confirm, S for Skip.
- Step files follow BMAD convention: frontmatter → STEP GOAL → MANDATORY EXECUTION RULES (Universal + Role + Step-Specific) → EXECUTION PROTOCOLS → CONTEXT BOUNDARIES → MANDATORY SEQUENCE → SUCCESS/FAILURE METRICS
- Return-to-menu pattern: re-load `{project-root}/_bmad/bme/_enhance/workflows/initiatives-backlog/workflow.md`
- Pre-implementation story review catches design issues — review this story before implementing
- Existing backlog at `{planning_artifacts}/initiatives-backlog.md` has 29 items across 6 categories
- Changelog uses table format (Date | Change), not H3 + bullets
- Prioritized view has 6 columns, category tables have 10 columns
- Type 10 final steps use workflowFile instead of nextStepFile for return-to-menu
- [Y]/[X] for validation mismatch prompts (avoids BMAD reserved P)

### Step Size Guidelines (from step-type-patterns.md)

| Type | Recommended | Maximum |
|------|-------------|---------|
| Middle (simple) — step-r-01 | < 150 lines | 200 |
| Middle (complex) — step-r-02 | < 200 lines | 250 |
| Final step — step-r-03 | < 150 lines | 200 |

If any step exceeds its maximum, extract to a `data/` file.

### Project Structure Notes

- Step files: `_bmad/bme/_enhance/workflows/initiatives-backlog/steps-r/`
- Templates: `_bmad/bme/_enhance/workflows/initiatives-backlog/templates/`
- Output artifact: `{planning_artifacts}/initiatives-backlog.md`
- Workflow entry point: `_bmad/bme/_enhance/workflows/initiatives-backlog/workflow.md`
- Backlog format spec: `templates/backlog-format-spec.md`
- RICE scoring guide: `templates/rice-scoring-guide.md`
- Triage step-t-04-update.md: reference pattern for step-r-03-update.md

### References

- [Source: _bmad-output/planning-artifacts/prd-p4-enhance-module.md — FR22, FR30-FR31, FR47-FR48, FR20, FR23-FR24, FR27-FR28, NFR1]
- [Source: _bmad-output/planning-artifacts/epics-p4-enhance-module.md — Story 2.1 ACs]
- [Source: _bmad-output/planning-artifacts/P4-enhance-module-architecture.md — Review step chain (3 steps), directory structure]
- [Source: _bmad/bme/_enhance/workflows/initiatives-backlog/templates/backlog-format-spec.md — section hierarchy, table formats, provenance rules, pre-write validation]
- [Source: _bmad/bme/_enhance/workflows/initiatives-backlog/templates/rice-scoring-guide.md — RICE factor definitions, provenance rules (rescore format)]
- [Source: _bmad/bme/_enhance/workflows/initiatives-backlog/workflow.md — R dispatch target, return-to-menu convention]
- [Source: _bmad/bmb/workflows/workflow/data/step-type-patterns.md — Type 4, 5, 10 patterns]
- [Source: _bmad/bmb/workflows/workflow/data/menu-handling-standards.md — A/P inclusion criteria, reserved letters]
- [Source: _bmad/bme/_enhance/workflows/initiatives-backlog/steps-t/step-t-04-update.md — reuse pattern for step-r-03]
- [Source: _bmad/bme/_enhance/workflows/initiatives-backlog/steps-t/step-t-03-score.md — reuse pattern for step-r-02 (A/P, CF convention)]
- [Source: _bmad/bme/_enhance/workflows/initiatives-backlog/steps-t/step-t-01-ingest.md — reuse pattern for step-r-01 (C-only)]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List

### Change Log
