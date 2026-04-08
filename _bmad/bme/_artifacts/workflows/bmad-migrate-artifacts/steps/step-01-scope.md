# Step 1: Scope Selection

## STEP GOAL:

To explain to the operator what artifact migration does, present the default scan scope, and confirm or adjust which directories the migration should cover.

## MANDATORY EXECUTION RULES (READ FIRST):

### Universal Rules:

- 🛑 NEVER execute the migration without explicit user confirmation
- 📖 CRITICAL: Read the complete step file before taking any action
- 🔄 CRITICAL: When loading next step with 'C', ensure entire file is read
- 📋 YOU ARE A FACILITATOR, not a script runner
- ✅ YOU MUST ALWAYS SPEAK OUTPUT In your Agent communication style with the config `{communication_language}`

### Role Reinforcement:

- ✅ You are a guided-migration assistant — your job is to make a CLI tool feel like a conversation
- ✅ You explain what is about to happen in plain language, then defer to the operator's decisions
- ✅ The CLI does the work; you orchestrate the conversation around it

### Step-Specific Rules:

- 🎯 Focus ONLY on scope selection in this step
- 🚫 FORBIDDEN to invoke the migration CLI in this step (Step 2 does that)
- 🚫 FORBIDDEN to ask about ambiguous file resolutions yet (Step 3 does that)
- 💬 Capture the operator's chosen scope as `{{scope}}` for downstream steps

## EXECUTION PROTOCOLS:

- 🎯 Start with a 2-sentence explanation of what artifact migration does
- 💾 Hold scope selection in working memory (no file persisted in this step)
- 🚫 FORBIDDEN to load next step until the operator selects 'C' AND scope is confirmed

## CONTEXT BOUNDARIES:

- Available context: project root, default scan directories
- Focus: presenting scope, capturing operator confirmation
- Limits: no CLI invocation, no manifest generation
- Dependencies: none (this is the first step)

## Sequence of Instructions (Do not deviate, skip, or optimize)

### 1. Welcome and brief explanation

Greet `{user_name}` and explain in two sentences:

> "Artifact migration scans your `_bmad-output/` directories, infers the right initiative + type for each file, and renames everything to follow the governance convention `{initiative}-{type}-{qualifier}-{date}.md`. It runs in dry-run mode first so you can review every proposed change before anything is touched."

### 2. Count files in default scope directories

Run these shell commands and capture the counts:

```
ls _bmad-output/planning-artifacts | wc -l
ls _bmad-output/vortex-artifacts | wc -l
ls _bmad-output/gyre-artifacts | wc -l
```

If any directory does not exist, report `0` for it (do not error out).

### 3. Present the default scope

Present:

> **Default scan scope:**
>
> - `planning-artifacts` ({N1} files)
> - `vortex-artifacts` ({N2} files)
> - `gyre-artifacts` ({N3} files)
>
> **Total: {N1+N2+N3} files**

### 4. Ask for confirmation or override

Display this menu and HALT for input:

```
[C] Continue with default scope
[O] Override — specify a custom comma-separated list of directory names
[X] Exit — abort the migration entirely
```

### 5. Handle the operator's response

**IF the operator chose `[C]`:**
- Set `{{scope}}` = `planning-artifacts,vortex-artifacts,gyre-artifacts`
- Proceed to step 6 below.

**IF the operator chose `[O]`:**
- Ask: `"Specify a comma-separated list of directory names (relative to _bmad-output/):"`
- HALT for input.
- When the operator responds, validate the input:
  - Must be comma-separated
  - Each name must match `^[a-zA-Z0-9_-]+$` (no path traversal, no spaces, no special chars)
  - At least one name must exist as a directory under `_bmad-output/`
- If validation fails, explain WHY (which name is invalid or missing) and re-ask. Loop until valid or until the operator chooses to abort.
- Set `{{scope}}` = the validated comma-separated list.
- Proceed to step 6 below.

**IF the operator chose `[X]`:**
- Reply: `"Migration aborted. No changes made."`
- HALT permanently. Do NOT load step 2.

### 6. Confirm and transition

Show:

> ✅ **Scope confirmed:** `{{scope}}`
>
> Ready to generate the dry-run manifest. Type `C` to continue.

HALT for input. When the operator types `C`, read fully and follow `./step-02-dryrun.md`.

## CRITICAL STEP COMPLETION NOTE

ONLY when the operator has confirmed scope and typed `C` will you read fully and follow `./step-02-dryrun.md`. Do NOT auto-proceed.

---

## 🚨 SYSTEM SUCCESS/FAILURE METRICS

### ✅ SUCCESS:

- Operator understands what migration does
- File counts shown for default scope
- `{{scope}}` captured (default or custom) and validated
- Operator typed `C` to proceed

### ❌ SYSTEM FAILURE:

- Invoking the migration CLI in this step
- Auto-proceeding without `C`
- Accepting an unvalidated custom scope
- Skipping the file count display

**Master Rule:** Skipping steps, optimizing sequences, or not following exact instructions is FORBIDDEN and constitutes SYSTEM FAILURE.
