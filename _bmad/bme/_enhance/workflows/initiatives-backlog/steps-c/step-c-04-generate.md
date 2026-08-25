---
name: 'step-c-04-generate'
description: 'Generate the complete lifecycle backlog file — frontmatter, Part 1 as a pointer to the process spec, Part 2 lanes populated from qualified + raw intakes, Appendix, Change Log'
outputFile: '{planning_artifacts}/convoke-note-initiative-lifecycle-backlog.md'
templateFile: '{project-root}/_bmad/bme/_enhance/workflows/initiatives-backlog/templates/backlog-format-spec.md'
processFile: '{project-root}/_bmad/bme/_enhance/workflows/initiatives-backlog/templates/lifecycle-process-spec.md'
workflowFile: '{project-root}/_bmad/bme/_enhance/workflows/initiatives-backlog/workflow.md'
---

# Step 4: Backlog Generation & Completion

## STEP GOAL:

Generate the complete lifecycle backlog file from scratch:
- **Frontmatter** with correct artifact governance metadata
- **Part 1: Lifecycle Process** emitted as a POINTER to `lifecycle-process-spec.md`
- **Part 2: Backlog** with §2.1 Intakes populated from all gathered intakes, and §2.2/2.3/2.4 populated from qualified items (if any). §2.5 Absorbed/Archived starts empty.
- **Appendix: Initiative Details** (empty placeholder or populated for Initiative Lane items with detail)
- **Change Log** with the creation entry

Present a completion summary and return to the T/R/C menu.

## MANDATORY EXECUTION RULES (READ FIRST):

### Universal Rules:
- 🛑 NEVER generate content without completing all mandatory sequence steps
- 📖 CRITICAL: Read this complete step file before taking action
- 🔄 CRITICAL: When returning to menu, read the entire workflow file
- 📋 YOU ARE A BACKLOG OPERATIONS SPECIALIST generating a new file

### Role Reinforcement:
- ✅ You are a **backlog operations specialist** — precise, structured, format-compliant
- ✅ Part 1 is a **one-line pointer** to `{processFile}` — never the process text itself (T71). Do not paraphrase, summarize, or edit
- ✅ All output must be standard markdown — no HTML, no proprietary syntax
- ✅ Every intake logged, every qualified item in its lane, every decision traceable in the Change Log

### Step-Specific Rules:
- 🎯 Focus on file generation, Part 1 pointer emission, correct lane population, completion reporting
- 🚫 FORBIDDEN to re-qualify items (step-c-03's job)
- 🚫 FORBIDDEN to copy process text into Part 1 — emit a link to `lifecycle-process-spec.md` and nothing else
- 🚫 FORBIDDEN to add items not in the gathered_intakes / qualified_items lists
- 💬 Approach: assemble the complete file, verify structure, write, summarize, return to menu

## EXECUTION PROTOCOLS:
- 🎯 Follow the MANDATORY SEQUENCE exactly
- 📖 Load `{templateFile}` (backlog-format-spec.md) for exact structural requirements and table formats
- 📖 `{processFile}` (lifecycle-process-spec.md) is the canonical process — link to it, do not inline it
- 💾 Write to `{outputFile}` as a complete new file

## CONTEXT BOUNDARIES:
- Available context: `gathered_intakes`, `qualified_items`, `raw_intakes`, `dropped_items`, qualifier identity, templates (format spec + process spec)
- Focus: File generation, completion summary
- Limits: Do NOT re-qualify or re-gather items
- Dependencies: step-c-02 (gathered intakes) and step-c-03 (qualified items). Empty-create path from step-c-01 is valid — both lists may be empty.

## MANDATORY SEQUENCE

**CRITICAL:** Follow this sequence exactly. Do not skip, reorder, or improvise.

### 1. Load Templates (If Not Already Loaded)

Ensure `{templateFile}` (backlog-format-spec.md) and `{processFile}` (lifecycle-process-spec.md) are loaded.

`{processFile}` holds the canonical process. Read it for context if you need it, but do NOT extract its text for emission — Part 1 in the output is a link to it (T71).

### 2. Generate Frontmatter

```yaml
---
initiative: convoke
artifact_type: note
qualifier: initiative-lifecycle-backlog
created: 'YYYY-MM-DD'
schema_version: 1
status: draft
origin: 'Create mode ([qualifier identity or raw-only], [date])'
supersedes: convoke-note-initiatives-backlog.md
---
```

`created` = current session date.

### 3. Generate Title

```markdown
# Convoke Initiative Lifecycle & Backlog

**Created:** [current session date]
**Origin:** Create mode ([qualifier identity])
**Status:** Draft (initial creation)
```

### 4. Emit the Part 1 Pointer

Emit the `## Part 1: Lifecycle Process` heading followed by a link to `{processFile}` — nothing more.

```markdown
## Part 1: Lifecycle Process

The lifecycle process — intake, the qualifying gate, the three lanes, portfolio attachment, pipeline
stages and RICE scoring — is defined in
[`lifecycle-process-spec.md`](../../_bmad/bme/_enhance/workflows/initiatives-backlog/templates/lifecycle-process-spec.md).

It is deliberately **not** duplicated here. This file is the operational surface; the process it operates
under is defined once, in one place. (T71, 2026-08-25 — the copy that used to sit here was 182 lines and
nothing read it.)
```

Adjust the relative path to the output location if it differs.

### 5. Generate Part 2 Structure

Emit `## Part 2: Backlog` with all five H3 sections:

#### §2.1 Intakes (Unqualified)

Emit the 5-column table header:

```markdown
| ID | Description | Source | Date | Raiser |
|----|-------------|--------|------|--------|
```

For each intake in `gathered_intakes` (whether qualified, raw, or dropped):
- `ID`: `IN-{n}` sequential starting at 1.
- `Description`: the intake description. For qualified items, append ` → [laneID]` to cross-reference the lane row. For dropped items, prefix `[DROPPED]`.
- `Source`: from gathered data.
- `Date`: from gathered data.
- `Raiser`: from gathered data.

**Empty-create path:** If no intakes were gathered, emit the table header only (no rows).

#### §2.2 Bug Lane

Emit the 10-column table header:

```markdown
| ID | Description | R | I | C | E | Score | Portfolio | Status | Linked Follow-up |
|----|-------------|---|---|---|---|-------|-----------|--------|------------------|
```

For each qualified item with Lane = Bug:
- `ID`: `BUG-{n}` sequential.
- All columns per format spec.
- `Status`: `Open`.
- Sort table by composite Score descending.

If zero Bug items: emit header only with a line `*(none)*` below.

#### §2.3 Fast Lane (Quick Wins + Spikes)

Emit the 9-column table header:

```markdown
| ID | Description | R | I | C | E | Score | Portfolio | Status |
|----|-------------|---|---|---|---|-------|-----------|--------|
```

For each qualified item with Lane = Fast:
- `ID`: alpha-prefix sequential. Propose `Q-{n}` if uncertain about a domain prefix; user can rename later.
- `Status`: `Backlog`.
- Sort by composite Score descending.

If zero: `*(none)*`.

#### §2.4 Initiative Lane

Emit the 10-column table header:

```markdown
| ID | Description | R | I | C | E | Score | Portfolio | Stage | Artifacts |
|----|-------------|---|---|---|---|-------|-----------|-------|-----------|
```

For each qualified item with Lane = Initiative:
- `ID`: alpha-prefix sequential.
- `Stage`: `Qualified`.
- `Artifacts`: `—` (no planning artifacts yet).
- Sort by composite Score descending.

If zero: `*(none)*`.

#### §2.5 Absorbed / Archived

Emit the section heading and an empty state:

```markdown
### 2.5 Absorbed / Archived

*No absorbed or archived items yet.*
```

### 6. Generate Appendix

```markdown
## Appendix: Initiative Details

*Full descriptions for §2.4 items whose table row is a one-liner. Populated as initiatives enter the pipeline and require detail.*
```

If any Initiative Lane item warrants detail (has substantial scope notes from gathering), emit an H3 subsection per format spec.

### 7. Generate Change Log

```markdown
## Change Log

| Date | Change |
|------|--------|
| [YYYY-MM-DD] | Create: Bootstrapped new lifecycle backlog. Intakes: [N] logged. Qualified: [X] (Bug: a, Fast: b, Initiative: c). Raw intakes: [Y]. Dropped: [Z]. Qualifier: [identity]. [Portfolio proposals: list, if any.] |
```

### 8. Write Complete File

Write the assembled backlog to `{outputFile}`. The file must contain, in order:
1. Frontmatter
2. H1 title + metadata paragraph
3. `## Part 1: Lifecycle Process` (pointer to the process spec — never the text)
4. `## Part 2: Backlog` with §2.1 through §2.5
5. `## Appendix: Initiative Details`
6. `## Change Log`

### 9. Post-Write Validation

Re-load the written file and validate:
- All H2 anchors present in correct order
- All H3 Part 2 anchors present (§2.1 through §2.5)
- Table column counts match spec
- Frontmatter parses

If validation fails, display the failure and prompt to retry or abort.

### 10. Completion Summary & Return to Menu

After successful write + validation, display:

> **Create Complete — Lifecycle Backlog Bootstrapped**
>
> **File:** `{outputFile}`
> **Intakes logged:** [N]
> **Qualified into lanes:** [X]
>   - Bug Lane: [n]
>   - Fast Lane: [n]
>   - Initiative Lane: [n]
> **Raw intakes (awaiting later qualification):** [Y]
> **Dropped (logged in §2.1 with [DROPPED] prefix):** [Z]
> **Qualifier:** [identity]
>
> **Next steps:**
> - Use **Triage (T)** to add new intakes from future findings.
> - Use **Review (R)** to rescore lane items as context evolves.
> - Unqualified intakes in §2.1 can be qualified later via a fresh Triage run or manual edit.

Then return to the T/R/C menu:

> Loading `{workflowFile}` to return to mode selection...

Load, read the entire file, and execute `{workflowFile}`.

## 🚨 SYSTEM SUCCESS/FAILURE METRICS:
### ✅ SUCCESS: Complete file generated with correct frontmatter, Part 1 as a pointer to the process spec, all five §2.x H3 sections present with correct column counts, intakes logged with cross-references to lanes, qualified items placed in correct lanes and sorted by RICE, Appendix and Change Log present, post-write validation passes, completion summary displayed, menu re-presented
### ❌ SYSTEM FAILURE: process text written into Part 1 instead of a pointer, missing H3 sections, wrong column counts, intakes not cross-referenced to qualified lane items, items placed in wrong lane, file not validated after write, no completion summary, no return to menu
**Master Rule:** Skipping steps is FORBIDDEN.
