---
name: 'step-t-03-qualify'
description: 'Qualifying gate — assign Lane, Portfolio, and RICE score for each validated finding. Optional skip keeps the finding as a raw intake.'
nextStepFile: '{project-root}/_bmad/bme/_enhance/workflows/initiatives-backlog/steps-t/step-t-04-update.md'
outputFile: '{planning_artifacts}/convoke-note-initiative-lifecycle-backlog.md'
templateFile: '{project-root}/_bmad/bme/_enhance/workflows/initiatives-backlog/templates/rice-scoring-guide.md'
processFile: '{project-root}/_bmad/bme/_enhance/workflows/initiatives-backlog/templates/lifecycle-process-spec.md'
advancedElicitationTask: '{project-root}/_bmad/core/workflows/advanced-elicitation/workflow.md'
partyModeWorkflow: '{project-root}/_bmad/core/workflows/bmad-party-mode/workflow.md'
---

# Step 3: Qualifying Gate (Lane + Portfolio + RICE)

## STEP GOAL:

Run the **qualifying gate** on each validated finding from Gate 1. For each finding, the qualifier (Vortex, John, or Winston) assigns a **Lane** (Bug / Fast / Initiative), a **Portfolio** attachment, and an initial **RICE** score. Findings the qualifier is not ready to route stay logged as raw intakes in §2.1 with no lane.

## MANDATORY EXECUTION RULES (READ FIRST):

### Universal Rules:
- 🛑 NEVER generate lane/portfolio/RICE without user input — the qualifying gate is user-driven
- 📖 CRITICAL: Read this complete step file before taking action
- 🔄 CRITICAL: When loading next step with 'C', read the entire file
- 📋 YOU ARE A QUALIFYING-GATE FACILITATOR supporting the qualifier (Vortex / John / Winston)

### Role Reinforcement:
- ✅ You are a **qualifying gate facilitator** — propose, don't decide; the qualifier decides
- ✅ Only Vortex team, John, or Winston can qualify. Confirm the user is acting in one of those roles.
- ✅ Propose lane/portfolio/RICE based on finding description, but flag uncertainty plainly
- ✅ Every finding ends this step in one of two states: **qualified** (lane + portfolio + RICE) or **raw intake** (logged to §2.1 only)

### Step-Specific Rules:
- 🎯 Focus on lane assignment, portfolio attachment, and RICE scoring
- 🚫 FORBIDDEN to write to the backlog file (that is step-t-04's job)
- 🚫 FORBIDDEN to re-extract or re-classify findings (that was step-t-02's job)
- 🚫 FORBIDDEN to add new findings here (new findings require a fresh Triage run)
- 💬 Approach: walk findings one at a time, propose + decide, track state

## EXECUTION PROTOCOLS:
- 🎯 Follow the MANDATORY SEQUENCE exactly
- 📖 Load {templateFile} for RICE factor definitions and calibration examples
- 📖 Load {processFile} for lane definitions and portfolio taxonomy
- 💾 Track each finding's qualification decision for step-t-04

## CONTEXT BOUNDARIES:
- Available context: Validated findings from Gate 1 (step-t-02), RICE scoring guide, lifecycle process spec, existing backlog
- Focus: Qualifying gate per-finding
- Limits: Do NOT write to backlog or modify extraction results
- Dependencies: step-t-02-extract.md (Gate 1 validated findings)

## MANDATORY SEQUENCE

**CRITICAL:** Follow this sequence exactly. Do not skip, reorder, or improvise.

### 1. Load References

Load `{templateFile}` (rice-scoring-guide.md) and internalize:
- **Factor definitions:** Reach (1-10), Impact (0.25-3), Confidence (20-100%), Effort (1-10)
- **Guided questions** for each factor
- **Calibration examples** (study the reasoning, not just the numbers)
- **Composite formula:** Score = (R × I × C) / E, where C is decimal (e.g., 70% = 0.7)

Load `{processFile}` (lifecycle-process-spec.md) and internalize:
- **§1.3 Three Lanes** — Bug / Fast / Initiative triggers and rules
- **§1.4 Portfolio Attachment** — current taxonomy (convoke, vortex, gyre, forge, bmm, enhance, loom, helm) and growth rule
- **§1.6 RICE Scoring** — lane-specific scoring notes

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

Record the qualifier identity. If the user declines to pick one, display: "Qualifying requires an authorized qualifier (Vortex, John, or Winston). You can still log findings as raw intakes — type `raw-only` to skip qualification for this session." and accept either a role letter or `raw-only`.

### 3. Walk Findings One at a Time

Initialize:
- `qualified_items = []` — findings with lane + portfolio + RICE assigned
- `raw_intakes = []` — findings kept as intakes only (no lane)
- `current_index = 1`

For each finding from Gate 1:

#### 3a. Present Finding & Proposed Qualification

Display:

> **Finding [current_index] of [total]**
>
> **Title:** [title]
> **Source:** [source ref]
> **Type:** [Change/Gap/Risk/Break]
>
> **Proposed qualification:**
> - **Lane:** [proposed lane with brief rationale, e.g., "Fast Lane — single-module point fix"]
> - **Portfolio:** [proposed portfolio, e.g., "convoke"]
> - **RICE:** R:[r] I:[i] C:[c]% E:[e] = [score]
>   *[one-line RICE rationale]*
>
> *If Type is `Break`, default lane is Bug and RICE impact defaults to 2+ unless narrow scope.*

#### 3b. Present Per-Finding Menu

Display:

> **Review this qualification:**
>
> **Lane override:**
> - `L bug` / `L fast` / `L initiative` — Change lane
> - `L none` — Keep as raw intake (no lane, stays in §2.1 only)
>
> **Portfolio override:**
> - `P [item]` — Set portfolio (convoke, vortex, gyre, forge, bmm, enhance, loom, helm, or a new portfolio)
> - `P new [name] — [rationale]` — Propose a new portfolio item (John+Winston decision per §1.4)
>
> **RICE adjustments:**
> - `R [value]` — Reach (1-10)
> - `I [value]` — Impact (0.25, 0.5, 1, 2, or 3)
> - `CF [value]` — Confidence (20-100%)
> - `E [value]` — Effort (1-10)
>
> **Decisions:**
> - `K` — Keep/accept proposed qualification
> - `RAW` — Log as raw intake only (§2.1); no lane assigned
> - `S` — Skip this finding (not logged, dropped)
> - `X` — Exit qualification early (remaining findings become raw intakes)
>
> **[A] Advanced Elicitation** — Deeper analysis
> **[P] Party Mode** — Multi-perspective discussion
> **[C] Continue** — Apply current qualification and advance to next finding

#### Menu Handling Logic:
- IF `L bug/fast/initiative`: Update lane. If lane is `bug`, note RICE impact may be hardcoded. Redisplay.
- IF `L none`: Mark finding for raw-intake-only routing. Redisplay.
- IF `P [item]`: Update portfolio. If `new`, record the proposal for John+Winston review in Change Log. Redisplay.
- IF `R/I/CF/E [value]`: Validate range. Update, recalculate composite, redisplay.
- IF K: Accept current state. Add to `qualified_items` (or `raw_intakes` if lane is `none`). Advance to next finding.
- IF RAW: Add to `raw_intakes`. Advance to next finding.
- IF S: Drop finding entirely (note in Change Log). Advance to next finding.
- IF X: Remaining findings become raw intakes. Go to step 4.
- IF A: Execute `{advancedElicitationTask}`. When finished, redisplay.
- IF P: Execute `{partyModeWorkflow}`. When finished, redisplay.
- IF C: Same as K if no change was made; otherwise record adjustments, advance.
- IF any other input: Display error, redisplay menu.

#### 3c. Advance
Increment `current_index`. If `<= total`, go to 3a. Otherwise go to step 4.

### 4. Present Qualification Summary

Display:

> **Qualification Complete**
>
> **Qualified items (will be added to lanes):** [N]
> **Raw intakes (logged to §2.1 only):** [N]
> **Dropped:** [N]
> [If early exit: **Auto-converted to raw intakes:** [N]]
>
> **Qualified breakdown:**
> - Bug Lane: [N]
> - Fast Lane: [N]
> - Initiative Lane: [N]
>
> **Qualifier:** [Vortex / John / Winston / raw-only]

### 5. Present MENU OPTIONS

Display:

> **[C] Continue** — Write qualifications to backlog (step-t-04)
> **[R] Revisit** — Walk findings again (re-enter step 3)
> **[X] Abort** — Return to mode selection without writing

#### Menu Handling Logic:
- IF C: Load, read the entire file, and execute `{project-root}/_bmad/bme/_enhance/workflows/initiatives-backlog/steps-t/step-t-04-update.md`, passing `qualified_items`, `raw_intakes`, `dropped_items`, and the qualifier identity.
- IF R: Re-enter step 3 from `current_index = 1`. Preserve existing decisions but allow edits.
- IF X: Discard all qualifications. Load, read, and execute `{project-root}/_bmad/bme/_enhance/workflows/initiatives-backlog/workflow.md`.
- IF any other input: Display error, redisplay menu.

## 🚨 SYSTEM SUCCESS/FAILURE METRICS:
### ✅ SUCCESS: Every finding either qualified (lane + portfolio + RICE) or routed to raw intakes, qualifier identity recorded, user validated decisions, results passed to step-t-04
### ❌ SYSTEM FAILURE: Qualification performed without authorized qualifier, findings assigned to lane without RICE, findings lost between steps, step-t-04 invoked with missing data
**Master Rule:** Skipping steps is FORBIDDEN.
