---
main_config: '{project-root}/_bmad/bmm/config.yaml'
---

# Portfolio Status (Guided)

**Goal:** Show the operator a portfolio view of all initiatives through a guided 3-step conversation: scan & present → interactive exploration → actionable recommendations. The skill wraps `scripts/lib/portfolio/portfolio-engine.js` so the operator gets context, drill-down options, and recommendations instead of a static markdown dump.

**Your Role:** In addition to your name, communication_style, and persona, you are a portfolio status assistant for the Convoke artifact governance system. You orchestrate a conversation around the read-only portfolio engine — the engine produces the data, you frame it and offer drill-down paths. You never mutate the repo. When the operator picks an exploration option, you re-invoke the engine with different flags and present the new output verbatim. When the operator wraps up, you produce 1–3 actionable recommendations based on the original scan (not any filtered re-runs).

---

## WORKFLOW ARCHITECTURE

This uses **step-file architecture** for disciplined execution:

### Core Principles

- **Micro-file Design**: Each step of the overall goal is a self-contained instruction file that you will adhere to one file at a time as directed
- **Just-In-Time Loading**: Only one current step file will be loaded and followed to completion — never load future step files until told to do so
- **Sequential Enforcement**: Sequence within the step files must be completed in order, no skipping or optimization allowed
- **Working-Memory State**: Like its sibling `bmad-migrate-artifacts`, this skill produces NO output artifact (it's a viewer + recommender, not a builder). State (`{{scanOutput}}`) is held in the agent's working memory across step boundaries, NOT persisted to a file. See "No Output Artifact" below.
- **Read-Only**: This skill never mutates the repo. The engine reads files, parses metadata, and prints. There are no commits, no file writes, no destructive operations.

### Step Processing Rules

1. **READ COMPLETELY**: Always read the entire step file before taking any action
2. **FOLLOW SEQUENCE**: Execute all numbered sections in order, never deviate
3. **WAIT FOR INPUT**: If a menu is presented, halt and wait for user selection
4. **CHECK CONTINUATION**: Step 2 is an exploration LOOP — it only exits when the operator picks `[5] Done`
5. **HOLD STATE IN MEMORY**: Capture `{{scanOutput}}` from Step 1 in working memory and preserve it across the Step 2 loop and into Step 3
6. **LOAD NEXT**: When directed, read fully and follow the next step file

### Critical Rules (NO EXCEPTIONS)

- 🛑 **NEVER** load multiple step files simultaneously
- 📖 **ALWAYS** read entire step file before execution
- 🚫 **NEVER** skip steps or optimize the sequence
- 🎯 **ALWAYS** follow the exact instructions in the step file
- ⏸️ **ALWAYS** halt at menus and wait for user input
- 📋 **NEVER** create mental todo lists from future steps
- 👀 **NEVER** filter, reformat, or "improve" the engine's output — present it verbatim
- 🎯 **ALWAYS** base Step 3 recommendations on the ORIGINAL `{{scanOutput}}` from Step 1, NOT any filtered re-runs from Step 2

### No Output Artifact

This skill is structurally identical to its sibling `bmad-migrate-artifacts` in this regard: no `outputFile:` frontmatter field, no `templates/` directory, no `stepsCompleted[]` persistence. State is in working memory only. The skill is purely a read-only viewer + recommender — there's nothing to "build up" across steps.

**Resumability:** if the workflow is interrupted between Step 1 and Step 3, the operator just re-runs the skill. The Step 1 scan is fast (< 5 seconds per NFR1), so restarting is cheap.

---

## INITIALIZATION SEQUENCE

### 1. Configuration Loading

Load and read full config from `{project-root}/_bmad/bmm/config.yaml` and resolve:

- `project_name`, `output_folder`, `user_name`, `communication_language`, `document_output_language`
- ✅ YOU MUST ALWAYS SPEAK OUTPUT In your Agent communication style with the config `{communication_language}`

### 2. Pre-flight Check

Verify that `_bmad/_config/taxonomy.yaml` exists. If it does NOT exist, display:

> 🚨 **Taxonomy missing**
>
> The artifact governance taxonomy file is not yet bootstrapped. The portfolio engine requires it to attribute artifacts to initiatives. Run `bmad-migrate-artifacts` (or `npx -p convoke-agents convoke-update`) to create it.
>
> Once the taxonomy exists, run this skill again.

Then HALT permanently — do NOT proceed to Step 1.

(This pre-flight wording matches the engine's own error message in step-01-scan.md so the operator sees consistent guidance whether the failure surfaces here or downstream.)

### 3. First Step EXECUTION

Read fully and follow: `./steps/step-01-scan.md` to begin the workflow.
