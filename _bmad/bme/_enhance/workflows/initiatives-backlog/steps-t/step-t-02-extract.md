---
name: 'step-t-02-extract'
description: 'Extract actionable findings from input, detect overlaps with existing Intakes and lane items, and validate the extraction batch'
nextStepFile: '{project-root}/_bmad/bme/_enhance/workflows/initiatives-backlog/steps-t/step-t-03-qualify.md'
outputFile: '{planning_artifacts}/convoke-note-initiative-lifecycle-backlog.md'
templateFile: '{project-root}/_bmad/bme/_enhance/workflows/initiatives-backlog/templates/backlog-format-spec.md'
---

# Step 2: Extract Findings & Gate 1 Validation

## STEP GOAL:

Extract actionable findings from the ingested text, detect overlaps with existing Intakes and lane items, and present the batch for user validation at Gate 1. Each validated finding will become an **Intake** (§2.1) in the backlog — not directly a lane item.

## MANDATORY EXECUTION RULES (READ FIRST):

### Universal Rules:
- 🛑 NEVER generate content without user input at Gate 1
- 📖 CRITICAL: Read this complete step file before taking action
- 🔄 CRITICAL: When loading next step with 'C', read the entire file
- 📋 YOU ARE AN ANALYST extracting structured findings from unstructured input

### Role Reinforcement:
- ✅ You are a **findings extraction analyst** — thorough, systematic, evidence-based
- ✅ Extract what the input actually says — do not invent findings or impose interpretations
- ✅ The user validates your extraction at Gate 1 — you propose, they decide
- ✅ Every finding becomes an Intake — lane assignment is a separate step (step-t-03 Qualify)

### Step-Specific Rules:
- 🎯 Focus on extraction, overlap detection against Intakes and lane items, and Gate 1 validation
- 🚫 FORBIDDEN to assign a lane (Bug/Fast/Initiative) — that is step-t-03's job (the qualifying gate)
- 🚫 FORBIDDEN to score RICE — that is step-t-03's job for qualified items
- 🚫 FORBIDDEN to write to the backlog file (that is step-t-04's job)
- 🚫 FORBIDDEN to truncate or skip any part of the input text
- 💬 Approach: systematic extraction, then collaborative validation at Gate 1

## EXECUTION PROTOCOLS:
- 🎯 Follow the MANDATORY SEQUENCE exactly
- 📖 Load {templateFile} for file structure reference
- 💾 Track extraction state — redisplay updated batch after every Gate 1 edit

## CONTEXT BOUNDARIES:
- Available context: User's input text (from step-t-01), existing backlog (if loaded), backlog format spec
- Focus: Extraction and Gate 1 validation only
- Limits: Do NOT qualify findings into lanes or write to backlog
- Dependencies: step-t-01-ingest.md (input text accepted)

## MANDATORY SEQUENCE

**CRITICAL:** Follow this sequence exactly. Do not skip, reorder, or improvise.

### 1. Load Format Reference

Load `{templateFile}` (backlog-format-spec.md) and note the structure:
- §2.1 Intakes is the append target for this step's output
- §2.2 Bug Lane, §2.3 Fast Lane, §2.4 Initiative Lane contain already-qualified items
- §2.5 Absorbed / Archived contains removed items

### 2. Extract Actionable Findings

Process the **complete** input text from step-t-01. Do NOT truncate, summarize, or skip sections.

For each passage in the input, determine if it is **actionable**. A finding is actionable if it:
- **Proposes a change** (something should be different)
- **Identifies a gap** (something is missing)
- **Flags a risk** (something could go wrong)
- **Reports a break** (something is observably broken)

Non-actionable content (general comments, praise, questions without implied action, status updates) should be set aside as **observations** — they are NOT included in the extraction batch but may be escalated at Gate 1.

For each actionable finding, record:
1. **Finding number** — sequential (1, 2, 3...)
2. **Title** — concise summary (matches lane table style)
3. **Source reference** — which part of the input it came from (e.g., "paragraph 3", "under 'Performance Issues' heading", "line about caching")
4. **Type** — Change / Gap / Risk / Break

### 3. Detect Overlaps with Existing Backlog

**Skip this step if no existing backlog was loaded in step-t-01.**

For each extracted finding, compare against **all existing items**:
- §2.1 Intakes (unqualified items)
- §2.2 Bug Lane items
- §2.3 Fast Lane items
- §2.4 Initiative Lane items
- §2.5 Absorbed/Archived items (flag if finding restates something already absorbed)

Compare by semantic similarity (title + description). Flag potential overlaps when a finding appears to address the same concern as an existing item.

For each overlap flag, record:
- The existing item's **location** (Intakes, Fast Lane, Initiative Lane, Absorbed, etc.)
- The existing item's **ID** and **title**
- Brief explanation of why it might overlap

### 4. Handle Zero Findings

**If zero actionable findings were extracted:**

Display:

> **No actionable findings extracted from the input.**
>
> The input contained no content that proposes a change, identifies a gap, flags a risk, or reports a break.
>
> **Options:**
> - Paste a specific passage you'd like me to re-examine
> - Type **X** to return to the mode selection menu

- If user pastes text → re-examine that specific passage for findings, then return to this decision point
- If user types X → re-load `{project-root}/_bmad/bme/_enhance/workflows/initiatives-backlog/workflow.md` to return to T/R/C menu

**If observations (non-actionable) were found**, list them and note they can be escalated at Gate 1.

**Do NOT proceed to Gate 1 if there are zero findings.**

### 5. Present Extraction Batch (Gate 1)

Display the extraction results in a numbered list:

> **Gate 1 — Review Extracted Findings**
>
> **Actionable findings extracted: [N]**
>
> | # | Finding | Source | Type | Overlap |
> |---|---------|--------|------|---------|
> | 1 | [title] | [source ref] | Change | — |
> | 2 | [title] | [source ref] | Gap | ⚠️ Overlaps §2.3 Fast Lane I15: "[existing title]" |
> | 3 | [title] | [source ref] | Break | — |
>
> **Observations (not included — escalate with `E` if actionable):**
> - [observation 1]
> - [observation 2]
>
> *Each validated finding will be logged as an Intake (§2.1). Qualification into a lane happens in the next step.*

### 6. Present GATE 1 MENU OPTIONS

Display:

> **Gate 1 — Edit the extraction batch:**
>
> **Overlap resolution** (for flagged items only):
> - `merge #N` — Absorb finding into the existing overlapping item (no new intake created)
> - `skip #N` — Drop finding (existing item is sufficient)
> - `new #N` — Override overlap flag, keep as separate new intake
>
> **Batch editing:**
> - `E #N` — Escalate observation #N to actionable finding
> - `+ [title — description]` — Add a finding the workflow missed
> - `R #N` — Remove finding #N from the batch
>
> **[C] Continue** — Finalize batch and proceed to qualifying gate

#### Menu Handling Logic:
- IF `merge #N`: Mark finding #N as merged with existing item. Remove from batch. Redisplay updated batch and menu.
- IF `skip #N`: Remove finding #N from batch. Redisplay updated batch and menu.
- IF `new #N`: Clear overlap flag on finding #N (will be added as new intake). Redisplay updated batch and menu.
- IF `E #N`: Move observation #N into the findings batch as actionable. Assign a source ref. Redisplay updated batch and menu.
- IF `+ [text]`: Add a new finding to the batch. Assign a source ref (likely "user-added"). Redisplay updated batch and menu.
- IF `R #N`: Remove finding #N from the batch. Redisplay updated batch and menu.
- IF C: Finalize the batch. Load, read the entire file, and execute `{project-root}/_bmad/bme/_enhance/workflows/initiatives-backlog/steps-t/step-t-03-qualify.md`
- IF any other input: Display "Unknown command. Use `merge/skip/new #N`, `E #N`, `+ [text]`, `R #N`, or **C** to continue." then redisplay menu.

#### EXECUTION RULES:
- ALWAYS halt and wait for user input after presenting the menu
- After EVERY edit action, redisplay the updated extraction batch table AND the menu
- The user may perform multiple edits before pressing C
- ONLY proceed to step-t-03 when user selects 'C'
- Do NOT auto-continue — the user must explicitly approve the batch

## 🚨 SYSTEM SUCCESS/FAILURE METRICS:
### ✅ SUCCESS: All actionable findings extracted with source refs, overlaps detected across all backlog sections, user validated batch at Gate 1, confirmed findings passed to step-t-03 for qualification
### ❌ SYSTEM FAILURE: Input truncated, findings invented (not from input), overlaps missed, user not given Gate 1 validation opportunity, findings qualified or scored prematurely
**Master Rule:** Skipping steps is FORBIDDEN.
