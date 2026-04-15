---
name: 'step-r-01-load'
description: 'Load existing lifecycle backlog, let user choose which lane(s) to walk, and prepare item list for rescoring'
nextStepFile: '{project-root}/_bmad/bme/_enhance/workflows/initiatives-backlog/steps-r/step-r-02-rescore.md'
outputFile: '{planning_artifacts}/convoke-note-initiative-lifecycle-backlog.md'
templateFile: '{project-root}/_bmad/bme/_enhance/workflows/initiatives-backlog/templates/rice-scoring-guide.md'
workflowFile: '{project-root}/_bmad/bme/_enhance/workflows/initiatives-backlog/workflow.md'
---

# Step 1: Load Backlog & Choose Lanes

## STEP GOAL:

Load the existing lifecycle backlog file and RICE scoring guide, parse items from all three lanes (Bug / Fast / Initiative), and let the user choose which lane(s) to walk for rescoring in step-r-02.

## MANDATORY EXECUTION RULES (READ FIRST):

### Universal Rules:
- 🛑 NEVER generate content without user input
- 📖 CRITICAL: Read this complete step file before taking action
- 🔄 CRITICAL: When loading next step with 'C', read the entire file
- 📋 YOU ARE A REVIEW ANALYST loading context for rescoring

### Role Reinforcement:
- ✅ You are a **review analyst** — your job is to load and prepare data, not to modify it
- ✅ Parse the backlog faithfully — do not reinterpret, reorder, or filter items
- ✅ The walkthrough starts in step-r-02 — this step only loads, counts, and lets the user choose scope

### Step-Specific Rules:
- 🎯 Focus ONLY on loading, parsing, counting, and lane scope selection
- 🚫 FORBIDDEN to rescore, modify, or delete any backlog items (that is step-r-02's job)
- 🚫 FORBIDDEN to write to the backlog file (that is step-r-03's job)
- 🚫 FORBIDDEN to add new items (that is Triage mode's job)
- 🚫 FORBIDDEN to read or parse items from §2.1 Intakes or §2.5 Absorbed — Review only walks lane items (§2.2/2.3/2.4)
- 💬 Approach: load efficiently, summarize lanes, let user choose scope, move on

## EXECUTION PROTOCOLS:
- 🎯 Follow the MANDATORY SEQUENCE exactly
- 📖 Load `{templateFile}` for RICE factor definitions and scoring consistency reference
- 📖 Load `{outputFile}` for existing backlog content

## CONTEXT BOUNDARIES:
- Available context: Existing backlog file, RICE scoring guide template
- Focus: Data loading, lane summary, scope selection
- Limits: Do NOT modify, score, or write anything
- Dependencies: workflow.md R dispatch (Review mode selected)

## MANDATORY SEQUENCE

**CRITICAL:** Follow this sequence exactly. Do not skip, reorder, or improvise.

### 0. Check Backlog File Exists

Check if a backlog file exists at `{outputFile}`.

- **If NOT found:** Display:

  > **No lifecycle backlog found at `{outputFile}`.**
  >
  > Review mode requires an existing backlog to walk through. Use **Create (C)** mode first to bootstrap one, or **Triage (T)** if a backlog exists at a different path.
  >
  > Returning to mode selection...

  Then load, read the entire file, and execute `{workflowFile}` to return to T/R/C menu. **Do NOT proceed further.**

- **If found:** Continue to step 1.

### 1. Load Existing Backlog

Load the complete file at `{outputFile}`. Preserve it in context — it will be needed for item presentation in step-r-02 and for safe update in step-r-03.

### 2. Load RICE Scoring Guide

Load `{templateFile}` (rice-scoring-guide.md) and internalize:
- **Factor definitions:** Reach (1-10), Impact (0.25-3), Confidence (20-100%), Effort (1-10)
- **Guided questions** for each factor
- **Calibration examples** from the existing backlog
- **Composite formula:** Score = (R × I × C) / E, where C is decimal (e.g., 70% = 0.7)
- **Score rounding:** One decimal place for display
- **Lane-specific scoring notes:** Bug impact often hardcoded high; Fast Lane effort typically 1-3; Initiative effort reflects pipeline + execution

### 3. Parse Lane Items

Parse tables from lane sections:

- **§2.2 Bug Lane** — 10 columns: ID, Description, R, I, C, E, Score, Portfolio, Status, Linked Follow-up.
- **§2.3 Fast Lane** — 9 columns: ID, Description, R, I, C, E, Score, Portfolio, Status.
- **§2.4 Initiative Lane** — 10 columns: ID, Description, R, I, C, E, Score, Portfolio, Stage, Artifacts.

**Do NOT include** items from:
- §2.1 Intakes (unqualified — no RICE)
- §2.5 Absorbed / Archived (removed from active)
- Any section outside `## Part 2: Backlog`

### 4. Count and Summarize

Display a lane summary:

> **Review Mode — Backlog Loaded**
>
> | Lane | Items | Score range |
> |------|-------|-------------|
> | §2.2 Bug Lane | [n] | [low]–[high] |
> | §2.3 Fast Lane | [n] | [low]–[high] |
> | §2.4 Initiative Lane | [n] | [low]–[high] |
> | **Total** | **[N]** | |
>
> *Rescoring applies to these lane items only. Intakes (§2.1) have no RICE and are not included in Review.*

### 5. Present Lane Selection Menu

Display:

> **Select lane(s) to walk:**
>
> - **[B] Bug Lane only** — [n] items
> - **[F] Fast Lane only** — [n] items
> - **[I] Initiative Lane only** — [n] items
> - **[A] All lanes** — [N] items (walk in order Bug → Fast → Initiative)
> - **[T] Top N by score** — walk top N items across all lanes (prompt for N)
> - **[X] Exit** — return to mode selection

#### Menu Handling Logic:

- IF B: Set walk scope to Bug Lane items only.
- IF F: Set walk scope to Fast Lane items only.
- IF I: Set walk scope to Initiative Lane items only.
- IF A: Set walk scope to all lane items in order Bug → Fast → Initiative.
- IF T: Prompt "How many top-ranked items?". Accept integer N ≥ 1. Set walk scope to top N items ranked by composite score descending (tiebreak: Confidence, then lane priority Bug > Initiative > Fast).
- IF X: Display "Exiting Review mode." then load, read, and execute `{workflowFile}`.
- IF any other input: Display "Unknown option. Use B / F / I / A / T / X." then redisplay menu.

### 6. Confirm Scope & Advance

After scope selection, display:

> **Walkthrough scope:** [description, e.g., "Fast Lane — 65 items"]
>
> **[C] Continue to walkthrough**
> **[R] Re-select scope**
> **[X] Exit**

- IF C: Pass `walk_scope` (ordered list of items with full data) to step-r-02. Load, read the entire file, and execute `{project-root}/_bmad/bme/_enhance/workflows/initiatives-backlog/steps-r/step-r-02-rescore.md`.
- IF R: Go back to step 5.
- IF X: Load, read, and execute `{workflowFile}`.

## 🚨 SYSTEM SUCCESS/FAILURE METRICS:
### ✅ SUCCESS: Backlog file loaded, RICE guide internalized, lane items parsed from §2.2/2.3/2.4 only, lane summary displayed, user chose scope, scope list passed to step-r-02
### ❌ SYSTEM FAILURE: Backlog not loaded, items from wrong sections included (Intakes / Absorbed), lanes not distinguished, scope selection skipped, missing backlog not handled gracefully
**Master Rule:** Skipping steps is FORBIDDEN.
