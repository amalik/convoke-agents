---
name: 'step-c-02-gather'
description: 'Interactively gather initiatives from the Product Owner with title, description, and category'
nextStepFile: '{project-root}/_bmad/bme/_enhance/workflows/initiatives-backlog/steps-c/step-c-03-score.md'
outputFile: '{planning_artifacts}/initiatives-backlog.md'
templateFile: '{project-root}/_bmad/bme/_enhance/workflows/initiatives-backlog/templates/backlog-format-spec.md'
advancedElicitationTask: '{project-root}/_bmad/core/workflows/advanced-elicitation/workflow.md'
partyModeWorkflow: '{project-root}/_bmad/core/workflows/bmad-party-mode/workflow.md'
---

# Step 2: Interactive Initiative Gathering

## STEP GOAL:

Interactively gather initiatives from the Product Owner — each with a title, description, and category — building a list for RICE scoring in the next step.

## MANDATORY EXECUTION RULES (READ FIRST):

### Universal Rules:
- 🛑 NEVER generate content without user input
- 📖 CRITICAL: Read this complete step file before taking action
- 🔄 CRITICAL: When loading next step with 'C', read the entire file
- 📋 YOU ARE A GATHERING FACILITATOR collecting initiative descriptions

### Role Reinforcement:
- ✅ You are a **gathering facilitator** — your job is to collect and organize, not to score or write
- ✅ Accept the user's descriptions faithfully — do not rewrite, editorialize, or merge initiatives
- ✅ Suggest existing category names from the format spec but allow new categories
- ✅ The user decides how many initiatives to add — you prompt until they say done

### Step-Specific Rules:
- 🎯 Focus ONLY on gathering initiative details (title, description, category)
- 🚫 FORBIDDEN to propose RICE scores (that is step-c-03's job)
- 🚫 FORBIDDEN to write the backlog file (that is step-c-04's job)
- 🚫 FORBIDDEN to reorder, merge, or drop initiatives without user instruction
- 💬 Approach: prompt for one initiative at a time, confirm capture, ask for next or done

## EXECUTION PROTOCOLS:
- 🎯 Follow the MANDATORY SEQUENCE exactly
- 📖 Reference `{templateFile}` (backlog-format-spec.md) for category name suggestions
- 💾 Track all gathered initiatives in a running list

## CONTEXT BOUNDARIES:
- Available context: Backlog format spec (for category names), session state from step-c-01
- Focus: Initiative gathering only
- Limits: Do NOT score, write to file, or analyze initiatives
- Dependencies: step-c-01-init.md (session initialized)

## MANDATORY SEQUENCE

**CRITICAL:** Follow this sequence exactly. Do not skip, reorder, or improvise.

### 1. Initialize Gathering State

Set up tracking:
- `gathered_items` = []
- `item_count` = 0

### 2. Prompt for Initiative

Display:

> **Initiative #[item_count + 1]**
>
> Describe your initiative:
> - **Title:** A short name for this initiative
> - **Description:** What it does and why it matters
> - **Category:** Suggested categories: Documentation & Onboarding, Update & Migration System, Testing & CI, Infrastructure, Agent Quality & Consistency, Platform & Product Vision — or name a new one
>
> *You can provide all three in one message, or just describe the initiative and I'll help structure it.*

**ALWAYS halt and wait for user input.**

### 3. Capture and Confirm

Parse the user's input to extract:
- **Title** — short, bold-formatted name
- **Description** — one-line explanation
- **Category** — one of the suggested categories or a new one

If any field is unclear, ask the user to clarify before confirming.

Display the captured initiative:

> **Captured:**
> - **Title:** [title]
> - **Description:** [description]
> - **Category:** [category]

Add to `gathered_items` with: title, description, category, source = "Create mode".
Increment `item_count`.

### 4. Present Per-Initiative Menu

Display:

> **Initiatives gathered so far: [item_count]**
>
> **[N] Next** — Add another initiative
> **[D] Done** — Finish gathering and proceed to scoring
> **[A] Advanced Elicitation** — Deeper analysis to surface more initiatives
> **[P] Party Mode** — Multi-perspective brainstorming for initiatives

#### Menu Handling Logic:
- IF N: Go to step 2 (prompt for next initiative).
- IF D:
  - **If `item_count` >= 1:** Display gathered items summary table, then go to step 5.
  - **If `item_count` == 0:** Display "You must add at least one initiative before proceeding." then redisplay this menu.
- IF A: Execute `{advancedElicitationTask}` for deeper initiative discovery. When finished, redisplay this menu.
- IF P: Execute `{partyModeWorkflow}` for multi-perspective brainstorming. When finished, redisplay this menu.
- IF any other input: Display "Unknown command. Use **N**, **D**, **A**, or **P**." then redisplay menu.

#### EXECUTION RULES:
- ALWAYS halt and wait for user input after presenting the menu
- After A or P execution, return to this menu (not to the prompt)
- The user may add as many initiatives as they want — no upper limit
- Do NOT auto-continue — the user must explicitly select D to finish gathering

### 5. Gathering Complete — Summary and Advance

Display the complete gathered list:

> **Gathering Complete — [item_count] initiatives collected**
>
> | # | Title | Category |
> |---|-------|----------|
> | 1 | [title] | [category] |
> | 2 | [title] | [category] |
> | ... | ... | ... |

Then load, read the entire file, and execute `{project-root}/_bmad/bme/_enhance/workflows/initiatives-backlog/steps-c/step-c-03-score.md`, passing the `gathered_items` list.

## 🚨 SYSTEM SUCCESS/FAILURE METRICS:
### ✅ SUCCESS: Each initiative captured with title, description, and category, user prompted for next or done, at least 1 initiative gathered, complete list passed to step-c-03
### ❌ SYSTEM FAILURE: Initiatives scored prematurely, descriptions rewritten without user approval, zero initiatives accepted, user forced to use specific format, gathered items not passed to next step
**Master Rule:** Skipping steps is FORBIDDEN.
