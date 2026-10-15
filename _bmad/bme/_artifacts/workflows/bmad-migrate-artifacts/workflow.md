---
main_config: '{project-root}/_bmad/bmm/config.yaml'
---

# Migrate Artifacts (Guided)

**Goal:** Run artifact governance migration through a guided 4-step conversation: scope selection → dry-run review → interactive resolution of ambiguous files → confirm and execute. The skill wraps the `convoke-migrate-artifacts` command so the operator gets a guided experience instead of a raw CLI dump.

**Your Role:** In addition to your name, communication_style, and persona, you are a guided-migration assistant for the Convoke artifact governance system. You orchestrate a conversation around an existing CLI tool — the CLI does the actual work, you frame the decisions and present the results in a structured way. You are NOT a content generator; you are NOT making engineering decisions; you are facilitating the operator's review and capturing their answers. When the operator overrides a suggestion, that override is authoritative — never silently dropped.

---

## WORKFLOW ARCHITECTURE

This uses **step-file architecture** for disciplined execution:

### Core Principles

- **Micro-file Design**: Each step of the overall goal is a self-contained instruction file that you will adhere to one file at a time as directed
- **Just-In-Time Loading**: Only one current step file will be loaded and followed to completion — never load future step files until told to do so
- **Sequential Enforcement**: Sequence within the step files must be completed in order, no skipping or optimization allowed
- **Working-Memory State**: Unlike most BMAD workflows, this skill produces NO output artifact (the migration mutates the repo directly via git commits). State (`{{scope}}`, `{{buckets}}`, `{{resolutions}}`) is held in the agent's working memory across step boundaries, NOT persisted to a file. See "No Output Artifact" below.
- **Operator Authority**: When the operator overrides an engine suggestion or specifies an initiative, that decision is authoritative. The skill writes the resolutions to a temp JSON file in Step 4 and passes it to the CLI via `--resolution-file` so overrides survive end-to-end.

### Step Processing Rules

1. **READ COMPLETELY**: Always read the entire step file before taking any action
2. **FOLLOW SEQUENCE**: Execute all numbered sections in order, never deviate
3. **WAIT FOR INPUT**: If a menu is presented, halt and wait for user selection
4. **CHECK CONTINUATION**: If the step has a menu with Continue as an option, only proceed to next step when user selects 'C' (Continue)
5. **HOLD STATE IN MEMORY**: Capture `{{scope}}`, `{{buckets}}`, `{{resolutions}}` in working memory across step boundaries
6. **LOAD NEXT**: When directed, read fully and follow the next step file

### Critical Rules (NO EXCEPTIONS)

- 🛑 **NEVER** load multiple step files simultaneously
- 📖 **ALWAYS** read entire step file before execution
- 🚫 **NEVER** skip steps or optimize the sequence
- 🎯 **ALWAYS** follow the exact instructions in the step file
- ⏸️ **ALWAYS** halt at menus and wait for user input
- 📋 **NEVER** create mental todo lists from future steps
- 🚫 **NEVER** invoke the CLI in `--apply` mode without operator confirmation in Step 4
- 👤 **NEVER** silently drop an operator override — overrides are authoritative

### No Output Artifact

This skill is structurally different from most BMAD workflow skills (e.g. `bmad-create-prd`, `bmad-create-epics-and-stories`) which produce a markdown document built up across step boundaries. Migration mutates the repo directly via git commits — there is nothing to "build up" in an output file. As a consequence:

- The workflow has NO `outputFile:` frontmatter field
- The workflow has NO `templates/` directory
- The workflow does NOT use the standard `stepsCompleted[]` frontmatter pattern for resumability
- State is held in the agent's working memory only

**Resumability limitation:** if the workflow is interrupted between Step 3 and Step 4, the operator loses their resolutions and must restart from Step 1. This is acceptable in v1 because the dry-run is fast (< 10 seconds) and the resolution loop is the only manual phase.

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
> The artifact governance taxonomy file is not yet bootstrapped. The migration CLI will create it on the first run, but you can also create it manually by running:
>
> ```
> npx -p convoke-agents convoke-migrate-artifacts
> ```
>
> (In a Convoke development checkout, run `scripts/migrate-artifacts.js` with `node` instead.)
>
> Once the taxonomy exists, run this skill again.

Then HALT permanently — do NOT proceed to Step 1.

### 3. First Step EXECUTION

Read fully and follow: `./steps/step-01-scope.md` to begin the workflow.
