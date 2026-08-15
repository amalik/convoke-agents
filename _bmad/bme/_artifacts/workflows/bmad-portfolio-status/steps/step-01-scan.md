# Step 1: Scan & Present

## STEP GOAL:

To run the portfolio engine, capture the markdown output, and present it to the operator with a brief explanation of what the table shows. Hold the raw output in working memory for Steps 2 and 3 to consume.

## MANDATORY EXECUTION RULES (READ FIRST):

### Universal Rules:

- 🛑 NEVER reformat or filter the engine output — present it verbatim
- 📖 CRITICAL: Read the complete step file before taking any action
- 🔄 CRITICAL: When loading next step with 'C', ensure entire file is read
- 📋 YOU ARE A FACILITATOR — the engine produces the data, you frame it
- ✅ YOU MUST ALWAYS SPEAK OUTPUT In your Agent communication style with the config `{communication_language}`

### Role Reinforcement:

- ✅ You are a portfolio status assistant — your job is to make a CLI tool feel like a guided exploration
- ✅ The engine does the work; you orchestrate the conversation around it
- ✅ Read-only: this skill never mutates the repo

### Step-Specific Rules:

- 🎯 Focus ONLY on running the engine and presenting its output
- 🚫 FORBIDDEN to filter, reformat, or "interpret" engine output in this step
- 💬 Hold the raw stdout in working memory as `{{scanOutput}}` for downstream steps

## EXECUTION PROTOCOLS:

- 🎯 Shell out to the portfolio engine in markdown mode
- 💾 Capture stdout in full and store as `{{scanOutput}}`
- 🚫 FORBIDDEN to load next step until presentation completes — auto-transition to Step 2 (no menu HALT here)

## CONTEXT BOUNDARIES:

- Available context: project root (the engine reads it from `findProjectRoot()`)
- Focus: engine invocation + verbatim presentation
- Limits: no filtering, no exploration menu, no recommendations
- Dependencies: none (this is the first step)

## Sequence of Instructions (Do not deviate, skip, or optimize)

### 1. Welcome and brief explanation

Greet `{user_name}` and explain what's about to happen in two sentences:

> "I'll generate a portfolio view of all your initiatives — phase, status, next action, and a context re-entry hint for each one. The data is inferred from the artifacts in your `_bmad-output/` directories, so the view reflects your real working state with zero manual upkeep."

### 2. Run the portfolio engine

Shell out to:

```
node scripts/lib/portfolio/portfolio-engine.js --markdown
```

Capture stdout in full as `{{scanOutput}}`. The engine returns immediately — there's no interactive prompt to handle.

### 3. Handle engine errors

**If the engine exited with a non-zero code:**

Display the raw stderr verbatim:

> ### 🚨 Portfolio Engine Failed
>
> The engine returned an error:
>
> ```
> {raw stderr}
> ```

The engine produces clear errors (e.g. "taxonomy.yaml not found — Run: npx -p convoke-agents convoke-migrate-artifacts (or npx -p convoke-agents convoke-update) to create it"). Do NOT swallow them or rephrase them.

Then HALT permanently — do NOT proceed to Step 2.

### 4. Present the engine output

Display:

> ### 📊 Portfolio
>
> The table below shows each initiative with:
>
> - **Phase** — discovery, planning, build, complete, or unknown (inferred from artifact chain)
> - **Status** — explicit (from frontmatter) or inferred (from git activity + chain analysis)
> - **Next Action / Context** — chain-gap analysis or last artifact touched
>
> ---
>
> {{scanOutput}}

The output already contains all the lines that matter:
- The markdown table with one row per initiative
- WIP radar line (if active initiatives exceed the threshold)
- `Total: N artifacts | Governed: G | Ungoverned: U | Unattributed: X`
- `Governance: G/T artifacts governed (P%)`
- `N files attributable to existing initiatives but ungoverned — run `npx -p convoke-agents convoke-migrate-artifacts` to govern them` (if N > 0)
- `N unattributed files (run with --show-unattributed to see details)` (if N > 0)

Forward all of them. Do NOT filter or reformat.

### 5. Auto-transition to Step 2

There is NO menu in this step. After presenting the output, immediately read fully and follow `./step-02-explore.md` to enter the exploration loop.

## CRITICAL STEP COMPLETION NOTE

Auto-transition is intentional: the operator needs to see the data BEFORE being asked what to explore. Steps 2 and 3 own the menu HALTs.

---

## 🚨 SYSTEM SUCCESS/FAILURE METRICS

### ✅ SUCCESS:

- Engine invoked with `--markdown`
- `{{scanOutput}}` captured in working memory
- All engine output forwarded verbatim to the operator
- Operator sees the table, WIP radar (if any), governance health, attributable-but-ungoverned line (if any), and unattributed summary (if any)
- Auto-transitioned to Step 2

### ❌ SYSTEM FAILURE:

- Filtering, reformatting, or "improving" the engine output
- Swallowing engine errors
- Stopping for a menu HALT in this step
- Forgetting to capture `{{scanOutput}}` for Step 3

**Master Rule:** Skipping steps, optimizing sequences, or not following exact instructions is FORBIDDEN and constitutes SYSTEM FAILURE.
