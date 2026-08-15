# Step 3: Recommend

## STEP GOAL:

To analyze the original `{{scanOutput}}` from Step 1 and produce 1–3 actionable recommendations based on what the engine found. End with a one-line reminder that the operator can re-run the skill anytime.

## MANDATORY EXECUTION RULES (READ FIRST):

### Universal Rules:

- 🛑 NEVER recommend more than 3 items in one round
- 📖 CRITICAL: Read the complete step file before taking any action
- 📋 YOU ARE A FACILITATOR producing actionable guidance, not a content generator
- ✅ YOU MUST ALWAYS SPEAK OUTPUT In your Agent communication style with the config `{communication_language}`

### Role Reinforcement:

- ✅ Recommendations are based on the ORIGINAL `{{scanOutput}}` from Step 1, NOT any filtered re-runs from Step 2
- ✅ Each recommendation must be concrete and actionable (a command to run, a decision to make)
- ✅ If the portfolio is healthy, say so honestly — don't manufacture recommendations

### Step-Specific Rules:

- 🎯 Focus ONLY on producing recommendations and the closing reminder
- 🚫 FORBIDDEN to use Step 2's filtered re-runs as the recommendation source
- 🚫 FORBIDDEN to recommend more than 3 items
- 💬 Rank by impact: empty-repo short-circuit (Rule 0) → WIP radar (Rule 1) → governance under 50% (Rule 2) → attributable-but-ungoverned (Rule 3) → unknown phase (Rule 4) → all-clear (Rule 5)

## EXECUTION PROTOCOLS:

- 🎯 Apply the 5 recommendation rules in priority order, capping at 3
- 💾 Use simple substring matching against `{{scanOutput}}`, not regex parsing
- 🚫 FORBIDDEN to load any other step — this is the final step

## CONTEXT BOUNDARIES:

- Available context: `{{scanOutput}}` from Step 1 (the original markdown output, NOT any filtered re-runs)
- Focus: produce 1–3 recommendations + reminder
- Limits: this is the final step; the workflow ends after this
- Dependencies: Steps 1 and 2 must have run

## Sequence of Instructions (Do not deviate, skip, or optimize)

### 1. Apply the recommendation rules

Walk `{{scanOutput}}` and apply these rules in priority order. Stop after 3 recommendations are collected.

**Rule 0 — Empty repo short-circuit (highest priority, ALWAYS check first)**

Look for a line matching: `Total: N artifacts | Governed: G | Ungoverned: U | Unattributed: X` and extract `N`.

If `N === 0` (the project has zero artifacts):
- Skip ALL other rules. Recommend ONLY: `"Your portfolio is empty — no artifacts found in scope. Run a discovery workflow (e.g. lets create a product requirements document) or scaffold your first artifact to populate it."`
- Return immediately. Do NOT evaluate Rules 1–5.

This guard prevents the false positive where Rule 2 ("governance < 50%") would otherwise trigger on an empty repo (0/0 = 0%) and recommend running migration on a project with nothing to migrate.

**Rule 1 — WIP radar (highest priority for non-empty repos)**

Look for a line matching: `WIP: N active (threshold: M) -- sorted by last activity`.

If found:
- The presence of this line means `N > M` already (the engine only emits the line when the cap is exceeded).
- Extract the active count `N`, threshold `M`, and the next line listing the active initiatives. The list is comma-separated.
- **The engine sorts this list newest activity FIRST**, so the LAST initiative in the comma-separated list is the STALEST (oldest activity).
- Recommend: `"Consider retiring or pausing the stalest initiative ({last_in_list}). You have {N} active (WIP threshold: {M})."`

**Rule 2 — Governance health < 50%**

Look for a line matching: `Governance: G/T artifacts governed (P%)`.

If found AND `P < 50`:
- Recommend: `"Run 'bmad-migrate-artifacts' to govern your artifacts. Current governance is {P}% — running migration would bring it close to 100%."`

**Rule 3 — Attributable but ungoverned**

Look for a line matching: `N files attributable to existing initiatives but ungoverned — run `npx -p convoke-agents convoke-migrate-artifacts` to govern them`.

If found AND Rule 2 was NOT triggered:
- Recommend: `"{N} files are attributable to existing initiatives but not yet governed. Run 'bmad-migrate-artifacts' to give them proper frontmatter."`

**Dedup rule:** Both Rule 2 and Rule 3 ultimately recommend running `bmad-migrate-artifacts`. To avoid telling the operator the same thing twice, **Rule 3 is suppressed entirely if Rule 2 already fired in this round**, regardless of whether you're at the recommendation cap. If Rule 2 was NOT triggered (e.g., governance is at 80% but there are still some attributable-but-ungoverned files), Rule 3 stands on its own.

**Rule 4 — Unknown phase initiatives**

Find every line in `{{scanOutput}}` containing the substring `| Unknown phase:` (note the leading pipe-and-space — that ensures we match the column boundary in the markdown table, not an inline mention elsewhere).

For each matching line, extract the initiative name from column 1 of that table row (the first `|`-delimited cell, trimmed). Collect all matches into a list.

If the list is non-empty:
- Recommend: `"These initiatives have unknown phase: {comma-separated list}. Review them to either set explicit phase in frontmatter or close them out."`

(Substring-anchor reasoning: `Unknown phase:` is generated by `conflict-resolver.js` as the `nextAction.value` for initiatives that have artifacts but no detectable phase. The markdown formatter places it in column 4 of the table, so the leading `| ` is unique to that column position and acts as a structural marker without requiring a regex.)

**Rule 5 — All clear**

If NO recommendations were collected by the previous rules:
- Recommend: `"Portfolio looks healthy. No action needed right now."`

### 2. Display the recommendations

Display:

> ### 🎯 Recommendations
>
> Based on the portfolio scan, here's what I'd suggest:
>
> 1. {first recommendation}
> 2. {second recommendation}  ← only if applicable
> 3. {third recommendation}   ← only if applicable

Cap at 3 recommendations. If only 1 or 2 are applicable, show only those.

### 3. Closing reminder

Display:

> 💡 Run `bmad-portfolio-status` anytime to refresh this view.

### 4. End the workflow

This is the final step. There is no next step to load. The workflow ends here in all paths.

## CRITICAL STEP COMPLETION NOTE

This is the final step. Do NOT auto-load any other file. Do NOT prompt for further input.

---

## 🚨 SYSTEM SUCCESS/FAILURE METRICS

### ✅ SUCCESS:

- Recommendations generated from `{{scanOutput}}` (the ORIGINAL Step 1 output, not Step 2 filtered re-runs)
- Capped at 3
- Ranked by priority (Rule 0 empty-repo short-circuit → WIP → governance% → attributable → unknown phase → all-clear)
- Each recommendation is concrete and actionable
- Closing reminder shown
- Workflow ends here

### ❌ SYSTEM FAILURE:

- Using Step 2's filtered re-runs as the recommendation source
- Showing more than 3 recommendations
- Manufacturing recommendations when the portfolio is healthy (use Rule 5 instead)
- Auto-loading another step file
- Recommending vague things like "review your portfolio" without a concrete action

**Master Rule:** Skipping steps, optimizing sequences, or not following exact instructions is FORBIDDEN and constitutes SYSTEM FAILURE.
