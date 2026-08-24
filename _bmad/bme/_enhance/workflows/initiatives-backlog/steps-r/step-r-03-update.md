---
name: 'step-r-03-update'
description: 'Apply rescores in-place to lane tables, re-sort every lane per Lane Ordering, update Change Log, present completion summary'
outputFile: '{planning_artifacts}/convoke-note-initiative-lifecycle-backlog.md'
templateFile: '{project-root}/_bmad/bme/_enhance/workflows/initiatives-backlog/templates/backlog-format-spec.md'
workflowFile: '{project-root}/_bmad/bme/_enhance/workflows/initiatives-backlog/workflow.md'
---

# Step 3: Backlog Update — Apply Rescores Lane-Aware

## STEP GOAL:

Validate backlog structure, apply rescored items in-place in their lane tables (§2.2 Bug / §2.3 Fast / §2.4 Initiative), re-sort **all three lanes** per §"Lane Ordering" in the format spec, update the Change Log, and present a completion summary before returning to the T/R/C menu.

## MANDATORY EXECUTION RULES (READ FIRST):

### Universal Rules:
- 🛑 NEVER generate content without user input at validation mismatch prompt
- 📖 CRITICAL: Read this complete step file before taking action
- 🔄 CRITICAL: When returning to menu, read the entire workflow file
- 📋 YOU ARE A BACKLOG OPERATIONS SPECIALIST performing safe, structured writes

### Role Reinforcement:
- ✅ You are a **backlog operations specialist** — precise, non-destructive, in-place updates only
- ✅ Preserve all existing content outside of the rescored rows and the sort order of their lanes
- ✅ **Part 1 (Lifecycle Process) must not be modified** — it's semi-static documentation
- ✅ **§2.1 Intakes and §2.5 Absorbed must not be modified** — Review does not touch them
- ✅ Re-sort **all three lanes** per §"Lane Ordering" — the invariant is that lanes are sorted at all times, not only after the session that touched them

### Step-Specific Rules:
- 🎯 Focus on validation, safe in-place updates, whole-backlog re-sort, and completion reporting
- 🚫 FORBIDDEN to delete or add rows (add = Triage, remove = Absorb via separate flow)
- 🚫 FORBIDDEN to modify items that were confirmed or skipped
- 🚫 FORBIDDEN to change items' lane / portfolio / stage / status (Review only rescores RICE)
- 🚫 FORBIDDEN to modify Part 1, §2.1, or §2.5
- 💬 Approach: validate first, update rescored rows in-place, re-sort every lane, summarize what moved

## EXECUTION PROTOCOLS:
- 🎯 Follow the MANDATORY SEQUENCE exactly
- 📖 Load `{templateFile}` (backlog-format-spec.md) for structural validation rules and table formats
- 💾 Write to `{outputFile}` only after validation passes (or user overrides)

## CONTEXT BOUNDARIES:
- Available context: `rescored_items` from step-r-02 (with lane, ID, old+new scores), existing backlog, format spec
- Focus: Structural validation, in-place update, per-lane re-sort, Change Log, completion summary
- Limits: Do NOT rescore, re-extract, add items, or change lane metadata
- Dependencies: step-r-02-rescore.md (rescored + confirmed + skipped results)

## MANDATORY SEQUENCE

**CRITICAL:** Follow this sequence exactly. Do not skip, reorder, or improvise.

### 1. Pre-Write Validation

Load `{outputFile}` and validate per format spec:

1. **Frontmatter present**
2. **Part 1 anchor exists** (not inspected for content)
3. **Part 2 H3 anchors** — `### 2.1` through `### 2.5` in correct order
4. **Lane table column counts** — read each expected count from `{templateFile}` (§"Pre-Write Validation" item 4) rather than from numbers written here. The counts previously hardcoded in this step were stale for months, so this check failed on every run and was waved through with `[Y] proceed anyway` — a validation that can only fail teaches the operator to bypass it. Split on unescaped delimiters only (`\|` is cell content, not a boundary)
5. **Lane ordering** — §2.2, §2.3 and §2.4 each satisfy §"Lane Ordering" in `{templateFile}`
6. **Change Log section** — `## Change Log` H2 exists

If ALL checks pass, proceed to step 3.

### 2. Mismatch Handling

If ANY validation check fails:

> **Pre-Write Validation — Structural Mismatch Detected**
>
> [List each failed check]
>
> **[Y] Yes, proceed anyway**
> **[X] Abort and return to menu**

**ALWAYS halt and wait.**

- IF Y: Continue to step 3.
- IF X: Display "Aborting backlog update." then load, read, and execute `{workflowFile}`.
- IF any other input: Display "Please select **Y** or **X**." then redisplay.

### 3. Apply Rescores In-Place

For each item in `rescored_items`:

1. **Find the item** — Locate the row in the correct lane table (§2.2 / 2.3 / 2.4) by matching the item ID.
2. **Update RICE columns** — Replace R, I, C, E, and composite Score values in the row.
3. **Preserve everything else** — Do not modify Description, Portfolio, Status, Stage, Artifacts, Linked Follow-up, or any non-RICE column.
4. **Optional rescore provenance** — If the Description cell has capacity, append a subtle note: ` [rescored YYYY-MM-DD: X.X→Y.Y]`. Skip if the cell would exceed readable length.

**Important:**
- Only update items whose composite score actually changed.
- Confirmed and skipped items remain completely unchanged — no modification, no note.
- Do NOT modify rows not in `rescored_items`.

### 4. Re-Sort Every Lane

For **all three lanes** (§2.2, §2.3, §2.4) — not only the ones this session rescored:

1. Collect all rows in that lane's table.
2. Order them per §"Lane Ordering" in `{templateFile}`: live rows by score descending, then untriaged rows; supersession pairs move as one unit. **A lane holds no closed rows** — clause 3 evicts them to §2.5 rather than demoting them.
3. Tiebreak within clause 1: (1) Confidence higher first, (2) insertion order newer first.
4. Rewrite the lane's table body with the ordered rows.
5. **Report what moved** — name each relocated row by ID, score, and old→new position in the completion summary.
6. **Report any closed row found in a lane — do not sort it and do not sweep it.** It is an incomplete §"Closing a Row" move, not an ordering violation. Name the ID and leave it in place: its §2.5 counterpart may already exist, and a blind sweep duplicates the receipt. Completing the move is the operator's call.

**This step previously re-sorted only the touched lanes**, to keep `git diff` minimal. That was the wrong trade. The lanes this session did not touch are the *likelier* place to find drift, because the dominant write path is hand-edits made outside this workflow during unrelated work — so a lane nobody reviewed is a lane nobody sorted. A quiet diff on an unsorted lane preserves a false priority order, and the position is what readers act on. Accept the diff.

### 5. Add Change Log Entry

Prepend a new row to `## Change Log`:

```
| YYYY-MM-DD | Review: Rescored [N] items — Bug: [n], Fast: [n], Initiative: [n]. Confirmed: [N], skipped: [N][, unvisited: N]. Lanes re-sorted: [list]. |
```

### 6. Update Frontmatter

- Do NOT modify the `created` date.
- Frontmatter `status` stays as-is (typically `active`).

### 7. Completion Summary & Return to Menu

After successful write, display:

> **Review Complete**
>
> **Items rescored:** [N]
>   - §2.2 Bug Lane: [n]
>   - §2.3 Fast Lane: [n]
>   - §2.4 Initiative Lane: [n]
> **Confirmed:** [N]
> **Skipped:** [N]
> [If early exit: **Unvisited:** [N]]
>
> **Lanes re-sorted:** [list, e.g., "Fast Lane, Initiative Lane"]
>
> **Rows relocated by the re-sort:** [ID, score, old→new position — or "none"; flag any that moved because they are closed]
>
> **Top 3 across all lanes (post-sort):**
> 1. [#ID] [title] — Score: [X.X] — Lane: [lane]
> 2. [#ID] [title] — Score: [X.X] — Lane: [lane]
> 3. [#ID] [title] — Score: [X.X] — Lane: [lane]

Then return to the T/R/C menu:

> Loading `{workflowFile}` to return to mode selection...

Load, read the entire file, and execute `{workflowFile}`.

## 🚨 SYSTEM SUCCESS/FAILURE METRICS:
### ✅ SUCCESS: Validation performed, only rescored items updated in-place with RICE changes, confirmed/skipped items untouched, **all three lanes re-sorted per Lane Ordering with relocated rows reported**, Part 1 / §2.1 / §2.5 untouched, Change Log updated with per-lane counts, completion summary displayed, menu re-presented
### ❌ SYSTEM FAILURE: Rows added or removed, items' lane/stage/status modified, Part 1 or §2.1 or §2.5 altered, **a lane left unsorted because this session did not rescore it**, rows relocated without being reported, Change Log missing lane breakdown, provenance added to confirmed/skipped items
**Master Rule:** Skipping steps is FORBIDDEN.
