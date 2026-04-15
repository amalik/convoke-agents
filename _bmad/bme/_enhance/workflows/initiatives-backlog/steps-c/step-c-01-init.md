---
name: 'step-c-01-init'
description: 'Check for existing lifecycle backlog, warn on overwrite, initialize new session using format spec + lifecycle process spec'
nextStepFile: '{project-root}/_bmad/bme/_enhance/workflows/initiatives-backlog/steps-c/step-c-02-gather.md'
outputFile: '{planning_artifacts}/convoke-note-initiative-lifecycle-backlog.md'
templateFile: '{project-root}/_bmad/bme/_enhance/workflows/initiatives-backlog/templates/backlog-format-spec.md'
processFile: '{project-root}/_bmad/bme/_enhance/workflows/initiatives-backlog/templates/lifecycle-process-spec.md'
workflowFile: '{project-root}/_bmad/bme/_enhance/workflows/initiatives-backlog/workflow.md'
---

# Step 1: Initialization & Existing File Guard

## STEP GOAL:

Check whether a lifecycle backlog file already exists at the output location, warn the user if so, and initialize a new session by loading the backlog format specification and the canonical lifecycle process spec (Part 1 source).

## MANDATORY EXECUTION RULES (READ FIRST):

### Universal Rules:
- 🛑 NEVER generate content without user input at overwrite prompt
- 📖 CRITICAL: Read this complete step file before taking action
- 🔄 CRITICAL: When loading next step with 'C', read the entire file
- 📋 YOU ARE AN INITIALIZATION SPECIALIST setting up a new lifecycle backlog

### Role Reinforcement:
- ✅ You are an **initialization specialist** — your job is to guard against accidental overwrites and prepare the session
- ✅ Do not gather intakes, qualify items, or write the backlog file — those are later steps
- ✅ The user must explicitly confirm before any existing file is overwritten
- ✅ Load both the **format spec** (structure) and the **lifecycle process spec** (Part 1 verbatim content)

### Step-Specific Rules:
- 🎯 Focus ONLY on existing file detection, overwrite confirmation, and template loading
- 🚫 FORBIDDEN to gather intakes (that is step-c-02's job)
- 🚫 FORBIDDEN to qualify items (that is step-c-03's job)
- 🚫 FORBIDDEN to write the backlog file (that is step-c-04's job)
- 💬 Approach: check file, warn if needed, confirm readiness, move on

## EXECUTION PROTOCOLS:
- 🎯 Follow the MANDATORY SEQUENCE exactly
- 📖 Load `{templateFile}` (backlog-format-spec.md) — file structure and table formats
- 📖 Load `{processFile}` (lifecycle-process-spec.md) — canonical Part 1 verbatim text for emission in step-c-04

## CONTEXT BOUNDARIES:
- Available context: Enhance config (loaded by workflow.md), existing backlog file (if present), both template files
- Focus: File existence check and session initialization only
- Limits: Do NOT gather, qualify, or write anything
- Dependencies: workflow.md C dispatch (Create mode selected)

## MANDATORY SEQUENCE

**CRITICAL:** Follow this sequence exactly. Do not skip, reorder, or improvise.

### 0. Check for Existing Backlog File

Check if a backlog file exists at `{outputFile}`.

- **If found:** Display:

  > **⚠️ Existing lifecycle backlog detected at `{outputFile}`.**
  >
  > Create mode will generate a **new** backlog file, replacing the existing one. All current data — including Part 2 lanes, Intakes, Absorbed records, and Change Log — will be **lost**.
  >
  > Consider using **Triage (T)** or **Review (R)** mode instead if you want to preserve existing data.
  >
  > **[Y] Yes, overwrite and create new lifecycle backlog**
  > **[X] Cancel and return to mode selection**

  **ALWAYS halt and wait for user input.**

  - IF Y: Continue to step 1.
  - IF X: Display "Cancelling Create mode." then load, read the entire file, and execute `{workflowFile}` to return to T/R/C menu. **Do NOT proceed further.**
  - IF any other input: Display "Please select **Y** or **X**." then redisplay the prompt.

- **If NOT found:** Continue to step 1 silently.

### 1. Load Format Specification

Load `{templateFile}` (backlog-format-spec.md) and internalize:
- **Frontmatter schema**
- **Section hierarchy** — Part 1 (semi-static), Part 2 (lanes), Appendix, Change Log
- **Table formats** per lane
- **Insertion rules** and **Pre-Write Validation** requirements

### 2. Load Lifecycle Process Spec

Load `{processFile}` (lifecycle-process-spec.md) and internalize:
- The **verbatim Part 1 content** (§1.1 through §1.6) — this is the canonical process definition that step-c-04 will emit exactly
- Step-c-04 will copy this text verbatim into `## Part 1: Lifecycle Process` of the new backlog file

### 3. Confirm Session Ready

Display:

> **Create Mode — New Lifecycle Backlog Initialized**
>
> A new lifecycle backlog will be generated at `{outputFile}`.
>
> **What will be created:**
> - Frontmatter (initiative: convoke, artifact_type: note, ...)
> - Part 1: Lifecycle Process (semi-static, from lifecycle-process-spec.md)
> - Part 2: Backlog (empty lane tables — §2.1 Intakes, §2.2 Bug, §2.3 Fast, §2.4 Initiative, §2.5 Absorbed/Archived)
> - Appendix: Initiative Details (empty)
> - Change Log (initial creation entry)
>
> **Next:** Optionally gather initial intakes and run them through the qualifying gate. You can also create an empty backlog and populate later via Triage mode.

### 4. Present MENU OPTIONS

Display:

> **Select:**
> - **[C] Continue** — gather initial intakes now
> - **[E] Empty create** — generate empty backlog and skip intake gathering / qualification (go directly to step-c-04)
> - **[X] Cancel** — return to T/R/C menu

#### Menu Handling Logic:
- IF C: Load, read the entire file, and execute `{project-root}/_bmad/bme/_enhance/workflows/initiatives-backlog/steps-c/step-c-02-gather.md`.
- IF E: Skip gathering and qualification. Load, read the entire file, and execute `{project-root}/_bmad/bme/_enhance/workflows/initiatives-backlog/steps-c/step-c-04-generate.md` with empty `gathered_items` and empty `qualified_items`.
- IF X: Display "Cancelling Create mode." then load, read, and execute `{workflowFile}`.
- IF any other input: Display "Unknown option. Use **C**, **E**, or **X**." then redisplay menu.

#### EXECUTION RULES:
- ALWAYS halt and wait for user input after presenting the menu
- ONLY proceed to next step when user selects C, E, or X

## 🚨 SYSTEM SUCCESS/FAILURE METRICS:
### ✅ SUCCESS: Existing file check performed, overwrite warning shown if needed, both templates loaded (format spec + process spec), session initialized, user chose gather/empty/cancel, proceeding appropriately
### ❌ SYSTEM FAILURE: Existing file overwritten without warning, templates not loaded, intakes gathered prematurely, user not given overwrite choice, empty-create path missing
**Master Rule:** Skipping steps is FORBIDDEN.
