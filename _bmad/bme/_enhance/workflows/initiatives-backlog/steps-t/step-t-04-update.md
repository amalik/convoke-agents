---
name: 'step-t-04-update'
description: 'Validate backlog structure, append scored items safely, regenerate prioritized view, and present completion summary'
outputFile: '{planning_artifacts}/initiatives-backlog.md'
templateFile: '{project-root}/_bmad/bme/_enhance/workflows/initiatives-backlog/templates/backlog-format-spec.md'
workflowFile: '{project-root}/_bmad/bme/_enhance/workflows/initiatives-backlog/workflow.md'
---

# Step 4: Backlog Update, Safety & Completion

## STEP GOAL:

Validate backlog structure, safely append scored items from Gate 2, regenerate the prioritized view, and present a completion summary before returning to the T/R/C menu.

## MANDATORY EXECUTION RULES (READ FIRST):

### Universal Rules:
- 🛑 NEVER generate content without user input at validation mismatch prompt
- 📖 CRITICAL: Read this complete step file before taking action
- 🔄 CRITICAL: When returning to menu, read the entire workflow file
- 📋 YOU ARE A BACKLOG OPERATIONS SPECIALIST performing safe, structured writes

### Role Reinforcement:
- ✅ You are a **backlog operations specialist** — precise, non-destructive, append-only
- ✅ Preserve all existing content — never delete, overwrite, or reorder existing rows
- ✅ The Prioritized View is the ONLY section regenerated from scratch
- ✅ All output must be standard markdown — no HTML, no proprietary syntax

### Step-Specific Rules:
- 🎯 Focus on validation, safe writes, and completion reporting
- 🚫 FORBIDDEN to delete or reorder existing backlog items (FR18, NFR1)
- 🚫 FORBIDDEN to re-score items (scoring was finalized at Gate 2)
- 🚫 FORBIDDEN to modify step-t-01, step-t-02, or step-t-03
- 💬 Approach: validate first, write safely, summarize clearly

## EXECUTION PROTOCOLS:
- 🎯 Follow the MANDATORY SEQUENCE exactly
- 📖 Load `{templateFile}` (backlog-format-spec.md) for structural validation rules and table formats
- 💾 Write to `{outputFile}` only after validation passes (or user overrides)

## CONTEXT BOUNDARIES:
- Available context: Scored findings from Gate 2, existing backlog file, backlog format spec template
- Focus: Structural validation, safe append, prioritized view regeneration, completion summary
- Limits: Do NOT re-score, re-extract, or re-classify items
- Dependencies: step-t-03-score.md (scored findings from Gate 2)

## MANDATORY SEQUENCE

**CRITICAL:** Follow this sequence exactly. Do not skip, reorder, or improvise.

### 1. Pre-Write Validation

Load `{outputFile}` (existing backlog) and validate structural integrity:

1. **Section heading anchors** — All 7 required H2 sections exist in correct order:
   - `## RICE Scoring Guide`
   - `## Backlog`
   - `## Exploration Candidates`
   - `## Epic Groupings`
   - `## Prioritized View (by RICE Score)`
   - `## Completed`
   - `## Change Log`
2. **Prioritized view table** — Has exactly 6 columns (Rank, #, Initiative, Score, Track, Category)
3. **Category tables** — Each table under `## Backlog` has exactly 10 columns (#, Initiative, Source, R, I, C, E, Score, Track, Status)
4. **Change Log section** — The `## Change Log` H2 section exists with a table

If ALL checks pass, proceed directly to step 3 (Append Items).

### 2. Mismatch Handling

If ANY validation check fails, present the specific mismatch(es):

> **Pre-Write Validation — Structural Mismatch Detected**
>
> [List each failed check with details]
>
> **[Y] Yes, proceed anyway**
> **[X] Abort and return to menu**

**ALWAYS halt and wait for user input.**

- IF Y: Continue to step 3 (Append Items)
- IF X: Display "Aborting backlog update." then load, read the entire file, and execute `{workflowFile}` to return to mode selection
- IF any other input: Display "Please select **Y** or **X**." then redisplay the prompt

### 3. Append Items

For each scored item from Gate 2:

1. **Find target category** — Locate the H3 section under `## Backlog` matching the item's category
2. **Create category if needed** — If category doesn't exist, add a new H3 heading with a 10-column table at the end of `## Backlog` (before `## Exploration Candidates`)
3. **Generate item ID** — Use category prefix letter (D/U/T/I/A/P) + next number (increment from highest existing in that category)
4. **Append row** — Add new row to end of category table. NEVER delete, overwrite, or reorder existing rows
5. **Add provenance** — Include in the Initiative description: `Added from [source], [date]` where source is the input origin from step-t-01 and date is the current session date

**Column format** (10 columns per backlog-format-spec.md):
```
| [ID] | **[Title]** — [description]. Added from [source], [date] | [source ref] | [R] | [I] | [C]% | [E] | [score] | [track] | Backlog |
```

**Important:** Triage Gate 2 adjustments are the initial score — no rescore provenance is generated.

### 4. Regenerate Prioritized View

Rebuild the `## Prioritized View (by RICE Score)` table from scratch:

1. Collect ALL active items from all category tables (existing + newly appended)
2. Exclude items with Status "Done" or items in the `## Completed` section
3. Sort by composite RICE score descending
4. Tiebreak: (1) Higher Confidence first, (2) Newer insertion order first
5. Generate sequential rank numbers starting at 1

Table format (6 columns):
```
| Rank | # | Initiative | Score | Track | Category |
|------|---|-----------|-------|-------|----------|
```

### 5. Add Changelog Entry

Prepend a new row to the `## Change Log` table (newest first):

```
| YYYY-MM-DD | Triage: Added [N] items ([categories affected]). [Any merge notes if applicable] |
```

### 6. Update Last Updated Date

Set the metadata header `Last Updated` field to the current date (YYYY-MM-DD format).

### 7. Completion Summary & Return to Menu

After successful write, display:

> **Triage Complete**
>
> **Items added:** [N]
> **Items merged:** [N] (absorbed into existing items at Gate 1)
> **Categories affected:** [list]
>
> **New Top 3 Positions:**
> 1. [#ID] [title] — Score: [X.X]
> 2. [#ID] [title] — Score: [X.X]
> 3. [#ID] [title] — Score: [X.X]

Then return to the T/R/C menu:

> Loading `{workflowFile}` to return to mode selection...

Load, read the entire file, and execute `{workflowFile}`.

## 🚨 SYSTEM SUCCESS/FAILURE METRICS:
### ✅ SUCCESS: Pre-write validation performed, existing content preserved, items appended with correct IDs and provenance, prioritized view regenerated with all items sorted correctly, changelog updated, completion summary displayed with top 3, T/R/C menu re-presented
### ❌ SYSTEM FAILURE: Existing backlog content deleted/overwritten/reordered, items written without validation, wrong IDs or missing provenance, prioritized view not regenerated, no completion summary, no return to menu
**Master Rule:** Skipping steps is FORBIDDEN.
