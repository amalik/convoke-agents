# Story 1.6: Triage Mode — Backlog Update, Safety & Completion Summary

Status: done

## Story

As a Product Owner,
I want scored items written safely to the backlog with provenance tracking and a completion summary,
So that the backlog is updated correctly without corrupting existing content.

## Acceptance Criteria

1. **Given** scored items are ready to write **When** the workflow prepares to update the backlog **Then** it validates the structural format of the backlog file: section heading anchors, prioritized view table column count, changelog section existence (FR24, NFR2)

2. **Given** pre-write validation detects a structural mismatch **When** the mismatch is reported **Then** the Product Owner can proceed or abort (FR25)

3. **Given** the backlog file has existing content (including items added manually between sessions) **When** new items are appended **Then** existing backlog category section content is preserved — no deletions, overwrites, or reordering (FR18, NFR1) **And** new items are appended to the correct category section identified by section heading (FR19) **And** the prioritized view table is regenerated with all items (existing + new) sorted by composite score (FR20) **And** provenance tags are added: "Added from [source], [date]" (FR21) **And** changelog entries are added in the correct format: `### YYYY-MM-DD` with bullet items (FR23) **And** all output is standard markdown — no proprietary extensions, HTML embeds, or tool-specific syntax (NFR6)

4. **Given** the backlog file is updated **When** the next session loads it **Then** the file remains parseable by the workflow and manually editable in any text editor (NFR3)

5. **Given** the backlog update completes **When** the completion summary is presented **Then** it shows items added/merged/changed and the new top 3 positions (FR27) **And** the T/R/C menu re-presents (FR28)

## Tasks / Subtasks

- [x] Task 1: Author `step-t-04-update.md` — Backlog Update, Safety & Completion (AC: 1, 2, 3, 4, 5)
  - [x] 1.1 Create step file with BMAD step frontmatter (name, description, outputFile, templateFile for backlog-format-spec.md, workflowFile for return-to-menu)
  - [x] 1.2 MANDATORY EXECUTION RULES section with backlog operations specialist role
  - [x] 1.3 MANDATORY SEQUENCE part 1 — Pre-Write Validation: Load existing backlog, validate section headings, prioritized view table columns (6), category table columns (10), changelog section existence. Report mismatches.
  - [x] 1.4 MANDATORY SEQUENCE part 2 — Mismatch Handling: If validation detects mismatch, present details and offer proceed/abort. If abort, return to T/R/C menu.
  - [x] 1.5 MANDATORY SEQUENCE part 3 — Append Items: For each scored item, append to correct category section. Preserve all existing content. Add provenance tags. Generate new IDs.
  - [x] 1.6 MANDATORY SEQUENCE part 4 — Regenerate Prioritized View: Rebuild the prioritized view table with ALL items (existing + new) sorted by composite score descending with tiebreaking.
  - [x] 1.7 MANDATORY SEQUENCE part 5 — Add Changelog Entry: Prepend a new changelog entry with current date and summary of items added.
  - [x] 1.8 MANDATORY SEQUENCE part 6 — Update Last Updated Date: Set metadata header `Last Updated` to current date.
  - [x] 1.9 MANDATORY SEQUENCE part 7 — Completion Summary: Display items added/merged/changed, new top 3 positions from prioritized view. Then return to T/R/C menu by re-loading workflow.md.

## Dev Notes

### This Story is Content-Only — No JavaScript

Story 1.6 creates **one markdown step file** in `steps-t/`. No JavaScript, no tests, no installer changes.

### File to Create

**`_bmad/bme/_enhance/workflows/initiatives-backlog/steps-t/step-t-04-update.md`** — Backlog update, pre-write validation, provenance, completion summary, and return-to-menu.

### Step File Frontmatter Pattern

```yaml
---
name: 'step-t-04-update'
description: 'Validate backlog structure, append scored items safely, regenerate prioritized view, and present completion summary'
outputFile: '{planning_artifacts}/initiatives-backlog.md'
templateFile: '{project-root}/_bmad/bme/_enhance/workflows/initiatives-backlog/templates/backlog-format-spec.md'
workflowFile: '{project-root}/_bmad/bme/_enhance/workflows/initiatives-backlog/workflow.md'
---
```

Notes:
- **No `nextStepFile`** — this is the final step in the Triage chain (Type 10 "Final Step")
- `templateFile` points to `backlog-format-spec.md` (needed for structural validation and insertion rules)
- `workflowFile` is the return-to-menu target — re-loading workflow.md re-presents the T/R/C menu (FR28)

### Step Type Classification

- **step-t-04-update.md** = Type 10 "Final Step" — no next step, completion summary, return to parent workflow

No A/P options — this is an operational write step, not collaborative refinement. The user's choices are limited to proceed/abort on validation mismatch.

### Pre-Write Validation (FR24, NFR2)

Before writing to the backlog file, validate these structural checks (from `backlog-format-spec.md` "Pre-Write Validation" section):

1. **Section heading anchors** — All required H2 sections exist in correct order:
   - `## RICE Scoring Guide`
   - `## Backlog`
   - `## Exploration Candidates`
   - `## Epic Groupings`
   - `## Prioritized View (by RICE Score)`
   - `## Completed`
   - `## Change Log`
2. **Prioritized view table column count** — Table has exactly 6 columns (Rank, #, Initiative, Score, Track, Category)
3. **Category table column count** — Each category table has exactly 10 columns (#, Initiative, Source, R, I, C, E, Score, Track, Status)
4. **Change Log section existence** — The `## Change Log` H2 section exists

If validation fails, present the specific mismatch(es) and offer: **[Y] Yes, proceed anyway** or **[X] Abort and return to menu**.

### Backlog Write Operations (FR18-FR21, FR23, NFR1, NFR6)

**Append to category sections (FR19):**
- For each scored item, find the target category H3 section under `## Backlog`
- Append a new row to that category's table
- If the category doesn't exist, create a new H3 heading at the end of `## Backlog` (before `## Exploration Candidates`)

**Preserve existing content (FR18, NFR1):**
- NEVER delete, overwrite, or reorder existing category section content
- Only append new rows to existing tables
- The Prioritized View is excluded from this preservation rule — it is regenerated from scratch (FR20)

**Generate item IDs:**
- Follow the existing ID pattern: single letter prefix + number (e.g., D7, P5, T6)
- Use the category's existing prefix letter (D for Documentation, U for Update, T for Testing, I for Infrastructure, A for Agent, P for Platform)
- Increment from the highest existing number in that category

**Provenance tags (FR21):**
- Format: `"Added from [source], [date]"`
- Example: `Added from party-mode review transcript, 2026-03-15`
- The source is the description the user provided in step-t-01 (the input's origin)
- The date is the current session date

**Important:** Triage Gate 2 adjustments are NOT rescores — they are the initial score. No rescore provenance is generated (per rice-scoring-guide.md provenance rules).

**Standard markdown output (NFR6):**
- No proprietary extensions, HTML embeds, or tool-specific syntax
- All output must be parseable by any markdown viewer

### Prioritized View Regeneration (FR20)

Rebuild the `## Prioritized View (by RICE Score)` table from scratch:

1. Collect ALL active items from all category tables (existing + new)
2. Exclude items with status "Done" or items in the `## Completed` section
3. Sort by composite RICE score descending
4. Tiebreak: (1) Higher Confidence first, (2) Newer insertion order first
5. Generate sequential rank numbers starting at 1

Table format (6 columns):
```markdown
| Rank | # | Initiative | Score | Track | Category |
|------|---|-----------|-------|-------|----------|
```

### Changelog Entry (FR23)

The changelog uses a table format (from backlog-format-spec.md):
```markdown
| Date | Change |
|------|--------|
| YYYY-MM-DD | [Description of what changed] |
```

Entries are prepended (newest first). The entry should summarize: number of items added, categories affected, and any items merged with existing.

### Completion Summary (FR27)

After successful write, display:

> **Triage Complete**
>
> **Items added:** [N]
> **Items merged:** [N] (absorbed into existing items)
> **Categories affected:** [list]
>
> **New Top 3 Positions:**
> 1. [#ID] [title] — Score: [X.X]
> 2. [#ID] [title] — Score: [X.X]
> 3. [#ID] [title] — Score: [X.X]

### Return-to-Menu (FR28)

After displaying the completion summary, re-load the workflow entry point:

> Loading `{workflowFile}` to return to mode selection...

This re-loads the full `workflow.md`, which re-presents the INITIALIZATION section and T/R/C Mode Selection menu. This is the standard return-to-menu convention documented in workflow.md's HTML comment (Story 1.3).

### Round-Trip Parseability (NFR3)

After every write operation, the backlog file must:
- Be parseable by the workflow on next load (section headings intact, tables well-formed)
- Be manually editable in any text editor between sessions
- Produce minimal noise in `git diff` (consistent formatting)

### What NOT to Do

- Do NOT modify any earlier step files (step-t-01, step-t-02, step-t-03) — they are complete
- Do NOT modify `workflow.md` — the return-to-menu works by re-loading the existing file
- Do NOT modify any JavaScript files — this is pure markdown content
- Do NOT implement Review mode or Create mode logic — those are Epics 2 and 3
- Do NOT delete or reorder existing backlog items — only append
- Do NOT add A/P options — this is an operational step, not collaborative refinement

### PRD Deviations — Intentional

None. Story 1.6 follows the PRD and architecture exactly.

### Previous Story Intelligence (from Stories 1.4 and 1.5)

**Key learnings:**
- step-t-03-score.md chains to step-t-04-update.md via `nextStepFile` — the file must exist at exactly `{project-root}/_bmad/bme/_enhance/workflows/initiatives-backlog/steps-t/step-t-04-update.md`
- Scored findings from Gate 2 include: number, title, category, source ref, type, R, I, C, E, composite score, rationale
- Items merged at Gate 1 (via `merge #N`) were removed from the batch — step-t-04 only receives items to add as new
- Items dropped at Gate 2 (via `D #N`) were removed from the batch — step-t-04 only receives surviving items
- Gate 1 command-based editing used `+` instead of `A` to avoid BMAD reserved letter conflict
- Gate 2 used `CF` for Confidence adjustments to avoid ambiguity with `C` Continue
- Step files follow BMAD convention: frontmatter → STEP GOAL → MANDATORY EXECUTION RULES → EXECUTION PROTOCOLS → CONTEXT BOUNDARIES → MANDATORY SEQUENCE → SUCCESS/FAILURE METRICS
- Return-to-menu pattern: re-load `{project-root}/_bmad/bme/_enhance/workflows/initiatives-backlog/workflow.md` (documented in workflow.md HTML comment from Story 1.3)
- Existing backlog at `{planning_artifacts}/initiatives-backlog.md` has 29 items across 6 categories, changelog uses table format, prioritized view has 6 columns

### Step Size Guidelines (from step-type-patterns.md)

| Type | Recommended | Maximum |
|------|-------------|---------|
| Final step — step-t-04 | < 150 lines | 200 |

If step-t-04-update exceeds 200 lines, extract validation rules or write operations to a `data/` file.

### Project Structure Notes

- Step files: `_bmad/bme/_enhance/workflows/initiatives-backlog/steps-t/`
- Templates: `_bmad/bme/_enhance/workflows/initiatives-backlog/templates/`
- Output artifact: `{planning_artifacts}/initiatives-backlog.md`
- Workflow entry point (return-to-menu): `_bmad/bme/_enhance/workflows/initiatives-backlog/workflow.md`
- Backlog format spec: `templates/backlog-format-spec.md`
- RICE scoring guide: `templates/rice-scoring-guide.md`

### References

- [Source: _bmad-output/planning-artifacts/prd-p4-enhance-module.md — FR18-FR25, FR27, NFR1-NFR3, NFR6]
- [Source: _bmad-output/planning-artifacts/epics-p4-enhance-module.md — Story 1.6 ACs]
- [Source: _bmad-output/planning-artifacts/P4-enhance-module-architecture.md — Triage step chain, backlog management]
- [Source: _bmad/bme/_enhance/workflows/initiatives-backlog/templates/backlog-format-spec.md — section hierarchy, table formats, insertion rules, pre-write validation, provenance tags, changelog format]
- [Source: _bmad/bme/_enhance/workflows/initiatives-backlog/templates/rice-scoring-guide.md — provenance rules (Triage adjustments are NOT rescores)]
- [Source: _bmad/bme/_enhance/workflows/initiatives-backlog/workflow.md — return-to-menu convention (HTML comment)]
- [Source: _bmad/bmb/workflows/workflow/data/step-type-patterns.md — Type 10 final step pattern]
- [Source: _bmad/bme/_enhance/workflows/initiatives-backlog/steps-t/step-t-03-score.md — Gate 2 output format, nextStepFile chain]

## Dev Agent Record

### Agent Model Used
Claude Opus 4.6

### Debug Log References
N/A — content-only story, no debugging required

### Completion Notes List
- One step file created in `steps-t/` directory
- step-t-04-update.md (155 lines): Type 10 final step — pre-write validation, safe append, prioritized view regeneration, provenance tags, changelog entry, completion summary, return-to-menu
- Frontmatter includes workflowFile for return-to-menu and templateFile for backlog-format-spec.md validation
- No nextStepFile (final step in Triage chain)
- No A/P options (operational write step, not collaborative refinement)
- Mismatch handling uses [Y] Yes proceed / [X] Abort — avoids BMAD reserved letter P
- Pre-write validation checks all 7 H2 section headings, prioritized view 6 columns, category table 10 columns, changelog existence
- Append operations preserve all existing content, generate correct IDs with category prefix, add provenance tags
- Prioritized view regenerated from scratch with proper sort order and tiebreaking
- Changelog uses table format matching backlog-format-spec.md
- Completion summary shows items added/merged, categories affected, new top 3 positions
- Return-to-menu re-loads entire workflow.md per convention from Story 1.3
- No JavaScript, no tests — content-only as specified

### File List
- `_bmad/bme/_enhance/workflows/initiatives-backlog/steps-t/step-t-04-update.md` — Backlog update, safety, and completion step (new)

### Change Log
- Created step-t-04-update.md: BMAD Type 10 final step for backlog pre-write validation, safe append with provenance, prioritized view regeneration, changelog entry, completion summary, and return-to-menu

### Senior Developer Review (AI)
- **Reviewer:** Claude Opus 4.6 (adversarial code review)
- **Date:** 2026-03-15
- **Outcome:** Clean review — no issues found
- **All 5 ACs verified against actual file content**
- **All 9 subtasks confirmed complete**
- **BMAD Type 10 conventions verified (frontmatter without nextStepFile, workflowFile for return-to-menu, MANDATORY EXECUTION RULES, MANDATORY SEQUENCE, no A/P)**
- **[Y]/[X] mismatch handling avoids BMAD reserved letter P confirmed**
- **Step chain integrity verified: step-t-03 → step-t-04 → workflow.md (return-to-menu)**
