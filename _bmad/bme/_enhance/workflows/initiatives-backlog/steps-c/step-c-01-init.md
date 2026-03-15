---
name: 'step-c-01-init'
description: 'Check for existing backlog, warn on overwrite, initialize new backlog using format spec'
nextStepFile: '{project-root}/_bmad/bme/_enhance/workflows/initiatives-backlog/steps-c/step-c-02-gather.md'
outputFile: '{planning_artifacts}/initiatives-backlog.md'
templateFile: '{project-root}/_bmad/bme/_enhance/workflows/initiatives-backlog/templates/backlog-format-spec.md'
workflowFile: '{project-root}/_bmad/bme/_enhance/workflows/initiatives-backlog/workflow.md'
---

# Step 1: Initialization & Existing File Guard

## STEP GOAL:

Check whether a backlog file already exists at the output location, warn the user if so, and initialize a new backlog session using the backlog format specification.

## MANDATORY EXECUTION RULES (READ FIRST):

### Universal Rules:
- 🛑 NEVER generate content without user input at overwrite prompt
- 📖 CRITICAL: Read this complete step file before taking action
- 🔄 CRITICAL: When loading next step with 'C', read the entire file
- 📋 YOU ARE AN INITIALIZATION SPECIALIST setting up a new backlog

### Role Reinforcement:
- ✅ You are an **initialization specialist** — your job is to guard against accidental overwrites and prepare the session
- ✅ Do not gather initiatives, score items, or write the backlog file — those are later steps
- ✅ The user must explicitly confirm before any existing file is overwritten

### Step-Specific Rules:
- 🎯 Focus ONLY on existing file detection, overwrite confirmation, and session setup
- 🚫 FORBIDDEN to gather initiatives (that is step-c-02's job)
- 🚫 FORBIDDEN to score items (that is step-c-03's job)
- 🚫 FORBIDDEN to write the backlog file (that is step-c-04's job)
- 💬 Approach: check file, warn if needed, confirm readiness, move on

## EXECUTION PROTOCOLS:
- 🎯 Follow the MANDATORY SEQUENCE exactly
- 📖 Load `{templateFile}` (backlog-format-spec.md) for structural reference — the format spec defines the file structure that step-c-04 will generate

## CONTEXT BOUNDARIES:
- Available context: Enhance config (loaded by workflow.md), existing backlog file (if present), backlog format spec template
- Focus: File existence check and session initialization only
- Limits: Do NOT gather, score, or write anything
- Dependencies: workflow.md C dispatch (Create mode selected)

## MANDATORY SEQUENCE

**CRITICAL:** Follow this sequence exactly. Do not skip, reorder, or improvise.

### 0. Check for Existing Backlog File

Check if a backlog file exists at `{outputFile}`.

- **If found:** Display:

  > **⚠️ Existing backlog detected at `{outputFile}`.**
  >
  > Create mode will generate a **new** backlog file, replacing the existing one. All current backlog data will be lost.
  >
  > **[Y] Yes, overwrite and create new backlog**
  > **[X] Cancel and return to mode selection**

  **ALWAYS halt and wait for user input.**

  - IF Y: Continue to step 1.
  - IF X: Display "Cancelling Create mode." then load, read the entire file, and execute `{workflowFile}` to return to T/R/C menu. **Do NOT proceed further.**
  - IF any other input: Display "Please select **Y** or **X**." then redisplay the prompt.

- **If NOT found:** Continue to step 1 silently.

### 1. Load Backlog Format Specification

Load `{templateFile}` (backlog-format-spec.md) and internalize:
- **Section hierarchy** — All 7 required H2 sections and their order
- **Table formats** — Category table (10 columns), Prioritized View (6 columns), Exploration Candidates (4 columns)
- **Category names** — Existing convention (Documentation & Onboarding, Update & Migration System, etc.)
- **Item ID format** — Category prefix letter + sequential number
- **Provenance format** — "Added from Create mode, [date]"
- **Changelog format** — Table with Date and Change columns, newest first

### 2. Confirm Session Ready

Display:

> **Create Mode — New Backlog Initialized**
>
> A new RICE-scored backlog will be created at `{outputFile}`.
>
> **Next:** You'll describe your initiatives one at a time — title, description, and category. Then we'll score them using RICE methodology and generate your prioritized backlog.

### 3. Present MENU OPTIONS

Display: "**Select:** [C] Continue to initiative gathering"

#### Menu Handling Logic:
- IF C: Load, read the entire file, and execute `{project-root}/_bmad/bme/_enhance/workflows/initiatives-backlog/steps-c/step-c-02-gather.md`
- IF any other input: Display "Enter **C** to continue to initiative gathering." then redisplay menu

#### EXECUTION RULES:
- ALWAYS halt and wait for user input after presenting the menu
- ONLY proceed to next step when user selects 'C'

## 🚨 SYSTEM SUCCESS/FAILURE METRICS:
### ✅ SUCCESS: Existing file check performed, overwrite warning shown if needed, format spec loaded, session initialized, proceeding to step-c-02
### ❌ SYSTEM FAILURE: Existing file overwritten without warning, format spec not loaded, initiatives gathered prematurely, user not given overwrite choice
**Master Rule:** Skipping steps is FORBIDDEN.
