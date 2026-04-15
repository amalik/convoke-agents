---
name: 'step-c-03-qualify'
description: 'Qualifying gate for Create mode — walk gathered intakes, assign Lane + Portfolio + RICE per intake (or keep raw)'
nextStepFile: '{project-root}/_bmad/bme/_enhance/workflows/initiatives-backlog/steps-c/step-c-04-generate.md'
outputFile: '{planning_artifacts}/convoke-note-initiative-lifecycle-backlog.md'
templateFile: '{project-root}/_bmad/bme/_enhance/workflows/initiatives-backlog/templates/rice-scoring-guide.md'
processFile: '{project-root}/_bmad/bme/_enhance/workflows/initiatives-backlog/templates/lifecycle-process-spec.md'
advancedElicitationTask: '{project-root}/_bmad/core/workflows/advanced-elicitation/workflow.md'
partyModeWorkflow: '{project-root}/_bmad/core/workflows/bmad-party-mode/workflow.md'
---

# Step 3: Qualifying Gate (Create Mode)

## STEP GOAL:

Run the **qualifying gate** on each intake gathered in step-c-02. For each intake, the qualifier (Vortex, John, or Winston) assigns a **Lane** (Bug / Fast / Initiative), a **Portfolio** attachment, and an initial **RICE** score. Intakes the qualifier is not ready to route stay raw (§2.1 only).

This step mirrors step-t-03 (Triage's qualifying gate). The lifecycle rules are identical — only the invocation context differs (Create mode is bootstrapping a new file).

## MANDATORY EXECUTION RULES (READ FIRST):

### Universal Rules:
- 🛑 NEVER generate lane/portfolio/RICE without user input — the qualifying gate is user-driven
- 📖 CRITICAL: Read this complete step file before taking action
- 🔄 CRITICAL: When loading next step with 'C', read the entire file
- 📋 YOU ARE A QUALIFYING-GATE FACILITATOR supporting the qualifier (Vortex / John / Winston)

### Role Reinforcement:
- ✅ You are a **qualifying gate facilitator** — propose, don't decide; the qualifier decides
- ✅ Only Vortex team, John, or Winston can qualify. Confirm the user's qualifier role.
- ✅ Propose lane/portfolio/RICE based on intake description, but flag uncertainty plainly
- ✅ Every intake ends this step in one of two states: **qualified** (lane + portfolio + RICE) or **raw intake** (logged to §2.1 only)

### Step-Specific Rules:
- 🎯 Focus on lane assignment, portfolio attachment, and RICE scoring
- 🚫 FORBIDDEN to write to the backlog file (step-c-04's job)
- 🚫 FORBIDDEN to re-gather or add new intakes (step-c-02's job)
- 💬 Approach: walk intakes one at a time, propose + decide, track state

## EXECUTION PROTOCOLS:
- 🎯 Follow the MANDATORY SEQUENCE exactly
- 📖 Load {templateFile} for RICE factor definitions and calibration examples
- 📖 Load {processFile} for lane definitions and portfolio taxonomy
- 💾 Track each intake's qualification decision for step-c-04

## CONTEXT BOUNDARIES:
- Available context: `gathered_intakes` from step-c-02, RICE scoring guide, lifecycle process spec
- Focus: Qualifying gate per-intake
- Limits: Do NOT write to backlog
- Dependencies: step-c-02-gather.md (gathered intakes)

## MANDATORY SEQUENCE

**CRITICAL:** Follow this sequence exactly. Do not skip, reorder, or improvise.

### 1. Load References

Load `{templateFile}` (rice-scoring-guide.md):
- **Factor definitions:** Reach (1-10), Impact (0.25-3), Confidence (20-100%), Effort (1-10)
- **Guided questions** for each factor
- **Composite formula:** Score = (R × I × C) / E

Load `{processFile}` (lifecycle-process-spec.md):
- **§1.3 Three Lanes** — Bug / Fast / Initiative triggers
- **§1.4 Portfolio Attachment** — current taxonomy + growth rule
- **§1.6 RICE Scoring** — lane-specific notes

### 2. Confirm Qualifier Role

Display:

> **Qualifying Gate — Confirm Qualifier**
>
> Only three parties can qualify intakes:
> - **[V] Vortex** team (via discovery)
> - **[J] John** (PM shortcut)
> - **[W] Winston** (Architect shortcut)
>
> Who is qualifying in this session?

Record qualifier identity. If user declines, display: "Qualifying requires an authorized qualifier. Type `raw-only` to skip qualification — all intakes will stay in §2.1 without a lane." and accept role letter or `raw-only`.

### 3. Walk Intakes One at a Time

Initialize:
- `qualified_items = []` — intakes with lane + portfolio + RICE
- `raw_intakes = []` — intakes kept as §2.1-only
- `current_index = 1`

For each intake in `gathered_intakes`:

#### 3a. Present Intake & Proposed Qualification

Display:

> **Intake [current_index] of [total]**
>
> **Description:** [description]
> **Source:** [source]
> **Date:** [date]
> **Raiser:** [raiser]
>
> **Proposed qualification:**
> - **Lane:** [proposed with rationale]
> - **Portfolio:** [proposed]
> - **RICE:** R:[r] I:[i] C:[c]% E:[e] = [score]
>   *[one-line rationale]*

#### 3b. Present Per-Intake Menu

Display:

> **Review this qualification:**
>
> **Lane override:**
> - `L bug` / `L fast` / `L initiative` — Change lane
> - `L none` — Keep raw (§2.1 only)
>
> **Portfolio override:**
> - `P [item]` — Set portfolio
> - `P new [name] — [rationale]` — Propose new portfolio (logged for John+Winston review)
>
> **RICE adjustments:**
> - `R [value]` / `I [value]` / `CF [value]` / `E [value]` — Component changes
>
> **Decisions:**
> - `K` — Keep/accept
> - `RAW` — Log as raw intake only
> - `S` — Drop (won't reach backlog at all)
> - `X` — Exit qualification (remaining intakes stay raw)
>
> **[A] Advanced Elicitation** / **[P] Party Mode** / **[C] Continue**

#### Menu Handling Logic:
- Same semantics as step-t-03:
  - `L bug/fast/initiative/none`, `P [item|new ...]`, `R/I/CF/E [v]`, `K`, `RAW`, `S`, `X`, `A`, `P`, `C`.
- Record adjustments, recalculate composite on RICE changes, redisplay after each action.
- On K/C (with changes): add to `qualified_items`. On RAW/L none: add to `raw_intakes`. On S: drop (logged in Change Log by step-c-04).
- On X: remaining intakes auto-moved to `raw_intakes`, go to step 4.

#### 3c. Advance
Increment `current_index`. If `<= total`, go to 3a. Otherwise step 4.

### 4. Present Qualification Summary

Display:

> **Qualification Complete**
>
> **Qualified (will populate lanes):** [N]
> **Raw intakes (§2.1 only):** [N]
> **Dropped:** [N]
>
> **Qualified breakdown:**
> - Bug Lane: [n]
> - Fast Lane: [n]
> - Initiative Lane: [n]
>
> **Qualifier:** [Vortex / John / Winston / raw-only]
> **New portfolio proposals:** [list, or "none"]

### 5. Present MENU OPTIONS

> **[C] Continue** — Generate backlog file (step-c-04)
> **[R] Revisit** — Walk intakes again
> **[X] Abort** — Return to T/R/C menu without writing

#### Menu Handling Logic:
- IF C: Load, read, and execute `{project-root}/_bmad/bme/_enhance/workflows/initiatives-backlog/steps-c/step-c-04-generate.md`, passing `gathered_intakes` (for §2.1 rows), `qualified_items` (for lane rows), `raw_intakes`, `dropped_items`, and qualifier identity.
- IF R: Re-enter step 3.
- IF X: Discard qualifications. Load, read, and execute `{project-root}/_bmad/bme/_enhance/workflows/initiatives-backlog/workflow.md`.

## 🚨 SYSTEM SUCCESS/FAILURE METRICS:
### ✅ SUCCESS: Every intake qualified or routed to raw/dropped, qualifier recorded, user validated, results passed to step-c-04
### ❌ SYSTEM FAILURE: Qualification without authorized qualifier, lane assigned without RICE, intakes lost between steps, step-c-04 invoked with missing data
**Master Rule:** Skipping steps is FORBIDDEN.
