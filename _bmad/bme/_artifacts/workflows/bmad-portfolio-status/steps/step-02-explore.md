# Step 2: Explore Loop

## STEP GOAL:

To present a numbered exploration menu and let the operator drill into specific aspects of the portfolio (initiative trace, filter, sort, unattributed details). The loop is open-ended — operators can chain as many explorations as they want until they pick `[5] Done`.

## MANDATORY EXECUTION RULES (READ FIRST):

### Universal Rules:

- 🛑 NEVER exit the loop without operator input (`[5]` or an exit phrase)
- 📖 CRITICAL: Read the complete step file before taking any action
- 🔄 CRITICAL: When loading next step with `5`, ensure entire file is read
- 📋 YOU ARE A FACILITATOR running an exploration loop, not a content generator
- ✅ YOU MUST ALWAYS SPEAK OUTPUT In your Agent communication style with the config `{communication_language}`

### Role Reinforcement:

- ✅ Each menu pick re-invokes the engine with different flags and presents the new output
- ✅ The original `{{scanOutput}}` from Step 1 is preserved across the loop — Step 3 uses it for recommendations, NOT any filtered re-runs
- ✅ The loop is bounded only by the operator's choice — never auto-exit

### Step-Specific Rules:

- 🎯 Focus ONLY on the exploration loop in this step
- 🚫 FORBIDDEN to mutate `{{scanOutput}}` (it's the source of truth for Step 3)
- 🚫 FORBIDDEN to "improve" or summarize engine re-run output
- 💬 Re-display the menu after every iteration

## EXECUTION PROTOCOLS:

- 🎯 Present menu → HALT for input → re-invoke engine with the picked flag → present → loop
- 💾 Hold `{{scanOutput}}` from Step 1 unchanged across the loop
- 🚫 FORBIDDEN to load next step until the operator picks `[5] Done`

## CONTEXT BOUNDARIES:

- Available context: `{{scanOutput}}` from Step 1
- Focus: interactive exploration of the portfolio
- Limits: no recommendations (Step 3 owns those), no mutations
- Dependencies: Step 1 must have set `{{scanOutput}}`

## Sequence of Instructions (Do not deviate, skip, or optimize)

**In a Convoke development checkout** (the project root's `package.json` has `"name": "convoke-agents"`), run `scripts/lib/portfolio/portfolio-engine.js` with `node` and the same arguments instead of each `npx` command below: inside the checkout, `npx -p convoke-agents` finds the checkout's own package name, installs nothing, and the command is not found or resolves to an old global copy.

### 1. Present the menu

Display:

> ### 🔍 Explore the Portfolio
>
> Pick an option to drill in. You can chain as many explorations as you want — the loop only ends when you pick `[5] Done`.
>
> ```
> [1] Explain a specific initiative's status (verbose inference trace)
> [2] Filter to a single initiative prefix
> [3] Sort by last activity instead of alpha
> [4] Show details for each unattributed file
> [5] Done — proceed to recommendations
> ```

HALT for input.

### 2. Handle the operator's choice

**`[1]` — Explain initiative**

1. Ask: `"Which initiative? (e.g. gyre, forge, helm, convoke)"` and HALT.
2. On response, validate the initiative is one shown in `{{scanOutput}}`'s table. If not, reply `"Initiative '{name}' not in current portfolio. Try one of: {list}."` and re-ask.
3. Shell out to: `npx -p convoke-agents convoke-portfolio --markdown --verbose`
4. The verbose flag adds an `--- Inference Trace ---` block at the bottom showing per-initiative `phase: ... (source, confidence) | status: ...`
5. Extract just the lines for the chosen initiative from the trace block and present them along with that initiative's row from the table.
6. Loop back to step 1 (re-display the menu).

**`[2]` — Filter by prefix**

1. Ask: `"Initiative prefix to filter by? (e.g. 'gyre' to show just gyre)"` and HALT.
2. On response, shell out to: `npx -p convoke-agents convoke-portfolio --markdown --filter "{prefix}"`
3. Present the filtered output verbatim.
4. Loop back to step 1.

**`[3]` — Sort by last activity**

1. Shell out to: `npx -p convoke-agents convoke-portfolio --markdown --sort last-activity`
2. Present the re-sorted output verbatim.
3. Loop back to step 1.

**`[4]` — Show unattributed details**

1. Shell out to: `npx -p convoke-agents convoke-portfolio --markdown --show-unattributed`
2. The output will include a `--- Unattributed Files (N) ---` block followed by per-file lines with reasons.
3. Present the output verbatim.
4. Loop back to step 1.

**`[5]` — Done (or any exit phrase: `done`, `exit`, `quit`)**

1. Reply: `"Generating recommendations..."`
2. Read fully and follow `./step-03-recommend.md`.

**Invalid input** (anything else)

1. Reply: `"Pick [1]–[5] or type 'done'."`
2. Re-display the menu and HALT.

### 3. The loop is explicit, not bounded

After each iteration of options [1]–[4], ALWAYS return to step 1 of this file (re-display the menu). The operator may want to chain explorations (e.g. filter to gyre, then explain gyre, then sort by activity, then show unattributed). There is NO maximum iteration count — the loop only exits on `[5]`.

## CRITICAL STEP COMPLETION NOTE

ONLY when the operator picks `[5]` (or types an exit phrase) will you read fully and follow `./step-03-recommend.md`. Do NOT auto-exit after some number of iterations.

---

## 🚨 SYSTEM SUCCESS/FAILURE METRICS

### ✅ SUCCESS:

- Menu presented with all 5 options
- Each option correctly maps to its CLI flag
- Engine output forwarded verbatim each iteration
- Loop continues until operator picks `[5]`
- `{{scanOutput}}` from Step 1 is unchanged

### ❌ SYSTEM FAILURE:

- Auto-exiting after a fixed number of iterations
- Mutating `{{scanOutput}}`
- Filtering or reformatting engine re-run output
- Skipping the menu re-display between iterations

**Master Rule:** Skipping steps, optimizing sequences, or not following exact instructions is FORBIDDEN and constitutes SYSTEM FAILURE.
