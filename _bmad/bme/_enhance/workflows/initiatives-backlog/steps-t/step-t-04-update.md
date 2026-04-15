---
name: 'step-t-04-update'
description: 'Validate backlog structure, log every finding as an Intake in §2.1, append qualified items to their lanes, update Change Log, and present completion summary'
outputFile: '{planning_artifacts}/convoke-note-initiative-lifecycle-backlog.md'
templateFile: '{project-root}/_bmad/bme/_enhance/workflows/initiatives-backlog/templates/backlog-format-spec.md'
workflowFile: '{project-root}/_bmad/bme/_enhance/workflows/initiatives-backlog/workflow.md'
---

# Step 4: Backlog Update — Log Intakes & Append Qualified Items

## STEP GOAL:

Validate backlog structure, log every finding (qualified or raw) as an **Intake** in §2.1 (the audit trail), append qualified items to their assigned lane's table (§2.2 Bug / §2.3 Fast / §2.4 Initiative), update the Change Log, and present a completion summary before returning to the T/R/C menu.

## MANDATORY EXECUTION RULES (READ FIRST):

### Universal Rules:
- 🛑 NEVER generate content without user input at validation mismatch prompt
- 📖 CRITICAL: Read this complete step file before taking action
- 🔄 CRITICAL: When returning to menu, read the entire workflow file
- 📋 YOU ARE A BACKLOG OPERATIONS SPECIALIST performing safe, structured writes

### Role Reinforcement:
- ✅ You are a **backlog operations specialist** — precise, non-destructive, append-only for lanes and intakes
- ✅ Preserve all existing content — never delete, overwrite, or reorder existing rows outside the touched lane's sort update
- ✅ **Part 1 (Lifecycle Process) must not be modified** — it's semi-static documentation
- ✅ Every qualified item generates **two** rows: one in §2.1 Intakes (audit trail) AND one in the assigned lane
- ✅ All output must be standard markdown — no HTML, no proprietary syntax

### Step-Specific Rules:
- 🎯 Focus on validation, safe writes, and completion reporting
- 🚫 FORBIDDEN to delete or reorder existing §2.1 Intakes (append-only per §1.1)
- 🚫 FORBIDDEN to re-qualify items (qualification was finalized at step-t-03)
- 🚫 FORBIDDEN to modify Part 1 (Lifecycle Process) — load it for context only
- 💬 Approach: validate first, write intakes + lane items safely, summarize clearly

## EXECUTION PROTOCOLS:
- 🎯 Follow the MANDATORY SEQUENCE exactly
- 📖 Load `{templateFile}` (backlog-format-spec.md) for structural validation rules and table formats
- 💾 Write to `{outputFile}` only after validation passes (or user overrides)

## CONTEXT BOUNDARIES:
- Available context: Qualified items + raw intakes + dropped items from step-t-03, qualifier identity, existing backlog file, format spec
- Focus: Structural validation, append to §2.1 and lanes, lane sort, Change Log, completion summary
- Limits: Do NOT re-qualify, re-extract, or re-classify items; do NOT modify Part 1
- Dependencies: step-t-03-qualify.md (qualified + raw items + qualifier identity)

## MANDATORY SEQUENCE

**CRITICAL:** Follow this sequence exactly. Do not skip, reorder, or improvise.

### 1. Pre-Write Validation

Load `{outputFile}` (existing backlog) and validate structural integrity per format spec:

1. **Frontmatter present** — YAML block at top of file.
2. **Part 1 section anchor** — `## Part 1: Lifecycle Process` exists. (Content is not inspected — only the anchor.)
3. **Part 2 section anchors** — All five H3 sections exist in correct order under `## Part 2: Backlog`:
   - `### 2.1 Intakes (Unqualified)`
   - `### 2.2 Bug Lane`
   - `### 2.3 Fast Lane (Quick Wins + Spikes)`
   - `### 2.4 Initiative Lane`
   - `### 2.5 Absorbed / Archived`
4. **Table column counts:**
   - §2.1 Intakes: 5 columns (ID, Description, Source, Date, Raiser)
   - §2.2 Bug Lane: 10 columns
   - §2.3 Fast Lane: 9 columns
   - §2.4 Initiative Lane: 10 columns
5. **Change Log section** — `## Change Log` H2 exists with a table.
6. **File missing guard** — If the backlog file does not exist, display: "No backlog file found at `{outputFile}`. Triage cannot create a new file — use Create mode [C] first." Then load workflow.md and return.

If ALL checks pass, proceed directly to step 3 (Append Intakes).

### 2. Mismatch Handling

If ANY validation check fails, present the specific mismatch(es):

> **Pre-Write Validation — Structural Mismatch Detected**
>
> [List each failed check with details]
>
> **[Y] Yes, proceed anyway**
> **[X] Abort and return to menu**

**ALWAYS halt and wait for user input.**

- IF Y: Continue to step 3.
- IF X: Display "Aborting backlog update." then load, read the entire file, and execute `{workflowFile}` to return to mode selection.
- IF any other input: Display "Please select **Y** or **X**." then redisplay the prompt.

### 3. Append Intakes to §2.1

For **every** finding that reached this step (qualified + raw intake + dropped), append a row to §2.1 Intakes:

1. **Generate Intake ID** — `IN-{n}` where `n` is the next sequential integer after the highest existing IN-ID in §2.1.
2. **Description** — concise one-line summary from the finding.
3. **Source** — session origin (e.g., "party mode 2026-04-15", "code review ag-7-5", "retrospective sp-epic-5").
4. **Date** — current session date (YYYY-MM-DD, absolute).
5. **Raiser** — the qualifier identity from step-t-03 (Vortex / John / Winston / raw-only).

**Do NOT delete or reorder existing Intake rows.** Append new rows at the end of the table.

**Dropped items are also logged to §2.1** — with a Description prefixed `[DROPPED]` and the reason in the Change Log. This preserves the audit trail even for findings the qualifier chose not to route.

### 4. Append Qualified Items to Their Lanes

For each item in `qualified_items` (i.e., findings routed to Bug / Fast / Initiative):

1. **Find target lane table** — §2.2 (Bug), §2.3 (Fast), or §2.4 (Initiative).
2. **Generate lane ID:**
   - Bug Lane: `BUG-{n}` sequential.
   - Fast Lane + Initiative Lane: single alpha prefix from a simple heuristic (U for Update, I for Infrastructure, T for Testing, A for Agent, D for Doc, P for Platform). If uncertain, use `Q-{n}` (for Qualified-uncategorized).
3. **Append row** with the columns defined in the format spec for the target lane. Include the RICE score rationale as a tail note only if it aids future review (keep rows compact).
4. **Cross-reference** — In the Intake row's Description cell (in §2.1), append ` → [laneID]` so intake→lane linkage is preserved.
5. **Re-sort the touched lane's table by composite RICE score descending.** Tiebreak: Confidence higher first, then insertion order newer first.

**Never delete, overwrite, or reorder rows in lanes that were not touched this session.**

### 5. Add Change Log Entry

Prepend a new row to the `## Change Log` table (newest first):

```
| YYYY-MM-DD | Triage by [Qualifier]: Logged [N] intakes. Qualified [X] ([Bug: a, Fast: b, Initiative: c]). Raw intakes: [Y]. Dropped: [Z]. [Any new portfolio proposals flagged.] |
```

### 6. Update Frontmatter

- Set `status: active` if this is the first write to the file (was `draft`).
- Do NOT modify the `created` date.

### 7. Completion Summary & Return to Menu

After successful write, display:

> **Triage Complete**
>
> **Intakes logged:** [N]
> **Qualified into lanes:** [X]
>   - Bug Lane: [n]
>   - Fast Lane: [n]
>   - Initiative Lane: [n]
> **Raw intakes (awaiting qualification):** [Y]
> **Dropped (logged with reason):** [Z]
>
> **Top 3 Fast Lane positions (post-sort):**
> 1. [#ID] [title] — Score: [X.X]
> 2. [#ID] [title] — Score: [X.X]
> 3. [#ID] [title] — Score: [X.X]

Then return to the T/R/C menu:

> Loading `{workflowFile}` to return to mode selection...

Load, read the entire file, and execute `{workflowFile}`.

## 🚨 SYSTEM SUCCESS/FAILURE METRICS:
### ✅ SUCCESS: Validation performed, every finding logged as an Intake (audit trail complete), qualified items appended to correct lanes with proper IDs, lanes re-sorted by RICE, Change Log updated with qualifier identity and counts, completion summary displayed, menu re-presented
### ❌ SYSTEM FAILURE: Findings not logged as Intakes, qualified items written without the cross-reference in Intakes, Part 1 modified, existing rows deleted/reordered, Change Log missing the qualifier identity, dropped items lost without audit trail
**Master Rule:** Skipping steps is FORBIDDEN.
