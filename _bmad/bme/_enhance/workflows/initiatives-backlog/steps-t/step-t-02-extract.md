---
name: 'step-t-02-extract'
description: 'Extract actionable findings from input, classify, detect overlaps, and validate at Gate 1'
nextStepFile: '{project-root}/_bmad/bme/_enhance/workflows/initiatives-backlog/steps-t/step-t-03-score.md'
outputFile: '{planning_artifacts}/initiatives-backlog.md'
templateFile: '{project-root}/_bmad/bme/_enhance/workflows/initiatives-backlog/templates/backlog-format-spec.md'
---

# Step 2: Extract Findings & Gate 1 Validation

## STEP GOAL:

Extract actionable findings from the ingested text, classify each into a backlog category, detect overlaps with existing backlog items, and present the batch for user validation at Gate 1.

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

### Step-Specific Rules:
- 🎯 Focus on extraction, classification, and overlap detection
- 🚫 FORBIDDEN to score findings (RICE scoring is step-t-03's job)
- 🚫 FORBIDDEN to write to the backlog file (that is step-t-04's job)
- 🚫 FORBIDDEN to truncate or skip any part of the input text (FR46)
- 💬 Approach: systematic extraction, then collaborative validation at Gate 1

## EXECUTION PROTOCOLS:
- 🎯 Follow the MANDATORY SEQUENCE exactly
- 📖 Load {templateFile} for category reference
- 💾 Track extraction state — redisplay updated batch after every Gate 1 edit

## CONTEXT BOUNDARIES:
- Available context: User's input text (from step-t-01), existing backlog (if loaded), backlog format spec template
- Focus: Extraction and Gate 1 validation only
- Limits: Do NOT score or write to backlog
- Dependencies: step-t-01-ingest.md (input text accepted)

## MANDATORY SEQUENCE

**CRITICAL:** Follow this sequence exactly. Do not skip, reorder, or improvise.

### 1. Load Category Reference

Load `{templateFile}` (backlog-format-spec.md) and extract the category names from the "Category Names" section. Current categories:

- Documentation & Onboarding
- Update & Migration System
- Testing & CI
- Infrastructure
- Agent Quality & Consistency
- Platform & Product Vision

New categories may be proposed if a finding doesn't fit any existing category.

### 2. Extract Actionable Findings

Process the **complete** input text from step-t-01. Do NOT truncate, summarize, or skip sections (FR46).

For each passage in the input, determine if it is **actionable**. A finding is actionable if it:
- **Proposes a change** (something should be different)
- **Identifies a gap** (something is missing)
- **Flags a risk** (something could go wrong)

Non-actionable content (general comments, praise, questions without implied action, status updates) should be set aside as **observations** — they are NOT included in the extraction batch but may be escalated at Gate 1.

For each actionable finding, record:
1. **Finding number** — sequential (1, 2, 3...)
2. **Title** — concise summary (matches backlog Initiative column style)
3. **Category** — one of the categories from step 1 (or propose a new one)
4. **Source reference** — which part of the input it came from (e.g., "paragraph 3", "under 'Performance Issues' heading", "line about caching") (FR4)
5. **Type** — Change / Gap / Risk

### 3. Detect Overlaps with Existing Backlog

**Skip this step if no existing backlog was loaded in step-t-01.**

For each extracted finding, compare against existing backlog items by semantic similarity (title + description). Flag potential overlaps when a finding appears to address the same concern as an existing item.

For each overlap flag, record:
- The existing item's **ID** (e.g., D2, P4)
- The existing item's **title**
- Brief explanation of why it might overlap

### 4. Handle Zero Findings

**If zero actionable findings were extracted:**

Display:

> **No actionable findings extracted from the input.**
>
> The input contained no content that proposes a change, identifies a gap, or flags a risk.
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
> | # | Finding | Category | Source | Type | Overlap |
> |---|---------|----------|--------|------|---------|
> | 1 | [title] | [category] | [source ref] | Change | — |
> | 2 | [title] | [category] | [source ref] | Gap | ⚠️ Overlaps D2: "[existing title]" |
> | 3 | [title] | [category] | [source ref] | Risk | — |
>
> **Observations (not included — escalate with `E` if actionable):**
> - [observation 1]
> - [observation 2]

### 6. Present GATE 1 MENU OPTIONS

Display:

> **Gate 1 — Edit the extraction batch:**
>
> **Overlap resolution** (for flagged items only):
> - `merge #N` — Absorb finding into the existing overlapping item
> - `skip #N` — Drop finding (existing item is sufficient)
> - `new #N` — Override overlap flag, keep as separate new item
>
> **Batch editing:**
> - `E #N` — Escalate observation #N to actionable finding
> - `+ [title — description]` — Add a finding the workflow missed
> - `R #N` — Remove finding #N from the batch
>
> **[C] Continue** — Finalize batch and proceed to RICE scoring

#### Menu Handling Logic:
- IF `merge #N`: Mark finding #N as merged with existing item. Remove from batch. Redisplay updated batch and menu.
- IF `skip #N`: Remove finding #N from batch. Redisplay updated batch and menu.
- IF `new #N`: Clear overlap flag on finding #N (will be added as new item). Redisplay updated batch and menu.
- IF `E #N`: Move observation #N into the findings batch as actionable. Assign a category and source ref. Redisplay updated batch and menu.
- IF `+ [text]`: Add a new finding to the batch. Ask user for category if not obvious. Redisplay updated batch and menu.
- IF `R #N`: Remove finding #N from the batch. Redisplay updated batch and menu.
- IF C: Finalize the batch. Load, read the entire file, and execute `{project-root}/_bmad/bme/_enhance/workflows/initiatives-backlog/steps-t/step-t-03-score.md`
- IF any other input: Display "Unknown command. Use `merge/skip/new #N`, `E #N`, `+ [text]`, `R #N`, or **C** to continue." then redisplay menu.

#### EXECUTION RULES:
- ALWAYS halt and wait for user input after presenting the menu
- After EVERY edit action, redisplay the updated extraction batch table AND the menu
- The user may perform multiple edits before pressing C
- ONLY proceed to step-t-03 when user selects 'C'
- Do NOT auto-continue — the user must explicitly approve the batch

## 🚨 SYSTEM SUCCESS/FAILURE METRICS:
### ✅ SUCCESS: All actionable findings extracted with categories and source refs, overlaps detected, user validated batch at Gate 1, confirmed findings passed to step-t-03
### ❌ SYSTEM FAILURE: Input truncated, findings invented (not from input), overlaps missed, user not given Gate 1 validation opportunity, findings scored prematurely
**Master Rule:** Skipping steps is FORBIDDEN.
