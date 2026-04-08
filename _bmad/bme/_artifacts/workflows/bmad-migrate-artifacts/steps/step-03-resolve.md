# Step 3: Interactive Resolution

## STEP GOAL:

To walk the operator through the REVIEW SUGGESTION and PURE AMBIGUOUS entries from Step 2 conversationally, capturing each decision into the `{{resolutions}}` map that Step 4 will write to the resolution-file JSON.

## MANDATORY EXECUTION RULES (READ FIRST):

### Universal Rules:

- 🛑 NEVER skip an entry without explicit operator input (or batch shortcut)
- 📖 CRITICAL: Read the complete step file before taking any action
- 🔄 CRITICAL: When loading next step with 'C', ensure entire file is read
- 📋 YOU ARE A FACILITATOR — present each decision, capture the answer, move on
- ✅ YOU MUST ALWAYS SPEAK OUTPUT In your Agent communication style with the config `{communication_language}`

### Role Reinforcement:

- ✅ You are walking the operator through one decision at a time
- ✅ Operator decisions are AUTHORITATIVE — never override or "fix" them
- ✅ Use the batch shortcut (`all <initiative>`) to keep the loop manageable

### Step-Specific Rules:

- 🎯 Focus ONLY on resolution capture in this step
- 🚫 FORBIDDEN to invoke the migration CLI in this step (Step 4 does that)
- 🚫 FORBIDDEN to skip an entry without operator input
- 💬 Operator overrides MUST be honored — never silently dropped

## EXECUTION PROTOCOLS:

- 🎯 Iterate REVIEW SUGGESTION first, then PURE AMBIGUOUS
- 💾 Build `{{resolutions}}` map keyed by `oldPath` with `{ action, initiative? }` values
- 🚫 FORBIDDEN to load next step until the operator selects 'C' or all entries are resolved/skipped

## CONTEXT BOUNDARIES:

- Available context: `{{scope}}` from Step 1, `{{buckets}}` from Step 2
- Focus: capturing operator decisions for ambiguous entries
- Limits: no CLI invocation, no apply
- Dependencies: Step 2 must have parsed entries into `REVIEW SUGGESTION` and `PURE AMBIGUOUS` buckets

## Sequence of Instructions (Do not deviate, skip, or optimize)

### 1. Initialize the resolutions map

In working memory, create:

```
{{resolutions}} = {}    // keyed by oldPath, values: { action: 'rename'|'skip', initiative?: string }
```

Counters (separate per loop so REVIEW SUGGESTION skips don't bleed into PURE AMBIGUOUS counts):

- For the REVIEW SUGGESTION loop: `accepted = 0`, `overriddenSuggestions = 0`, `skippedSuggestions = 0`
- For the PURE AMBIGUOUS loop: `resolvedAmbiguous = 0`, `skippedAmbiguous = 0`

The final summary aggregates these as: `accepted` + `overriddenSuggestions` + `resolvedAmbiguous` = total renames; `skippedSuggestions` + `skippedAmbiguous` = total skipped.

### 2. Walk REVIEW SUGGESTION entries

For EACH entry in `{{buckets}}.REVIEW_SUGGESTION` (in order), do:

1. Display:
   ```
   📄 {oldPath}
      First lines: "{firstLines[0]}"
                   "{firstLines[1]}"
                   "{firstLines[2]}"
      Git author: {gitAuthor}
      Suggested: {suggestedInitiative} (source: {suggestedFrom}, confidence: {suggestedConfidence})

   Accept '{suggestedInitiative}'? [y/n/specify <initiative>/skip]
   ```

2. HALT for input.

3. Parse the response:
   - **`y` (or yes, accept)** → `{{resolutions}}[oldPath] = { action: 'rename', initiative: '{suggestedInitiative}' }`. Increment `accepted`.
   - **`n` (or no)** → ask `"Specify initiative or 'skip':"` and HALT. Then:
     - If `skip` → `{{resolutions}}[oldPath] = { action: 'skip' }`. Increment `skippedSuggestions`.
     - If a valid initiative ID (in taxonomy) → `{{resolutions}}[oldPath] = { action: 'rename', initiative: '{specified}' }`. Increment `overriddenSuggestions`.
     - If invalid → re-ask, looping until valid.
   - **`specify <initiative>`** → if the initiative is valid, treat as override. Increment `overriddenSuggestions`.
   - **`skip`** → `{{resolutions}}[oldPath] = { action: 'skip' }`. Increment `skippedSuggestions`.

4. Move to the next entry.

After all REVIEW SUGGESTION entries are processed, summarize:

> ✅ Review suggestions: {accepted} accepted, {overriddenSuggestions} overridden, {skippedSuggestions} skipped.

### 3. Walk PURE AMBIGUOUS entries

For EACH entry in `{{buckets}}.PURE_AMBIGUOUS` (in order), do:

1. Display:
   ```
   📄 {oldPath}
      First lines: "{firstLines[0]}"
                   "{firstLines[1]}"
                   "{firstLines[2]}"
      Git author: {gitAuthor}
      Candidates: {candidates joined or 'none'}

   Specify initiative for this file [<initiative>/skip/all <initiative>]
   ```

2. HALT for input.

3. Parse the response:
   - **`<initiative>`** → if valid (in taxonomy), `{{resolutions}}[oldPath] = { action: 'rename', initiative: '{specified}' }`. Increment `resolvedAmbiguous`.
   - **`skip`** → `{{resolutions}}[oldPath] = { action: 'skip' }`. Increment `skippedAmbiguous`.
   - **`all <initiative>`** → BATCH SHORTCUT. Apply `{ action: 'rename', initiative: '{specified}' }` to THIS entry AND every remaining PURE AMBIGUOUS entry in the SAME directory as this one. Increment `resolvedAmbiguous` for each. Tell the operator: `"Applied '{initiative}' to N files in {dir}/."`. Then continue iterating from where the batch ended.
   - **invalid** → re-ask, looping until valid.

4. Move to the next entry (unless batch-applied).

After all PURE AMBIGUOUS entries are processed, summarize:

> ❗ Pure ambiguous: {resolvedAmbiguous} resolved, {skippedAmbiguous} skipped.

### 4. Final summary and continuation menu

Display:

> ### 🎯 Resolution Summary
>
> - **Accepted suggestions:** {accepted}
> - **Operator overrides:** {overriddenSuggestions + resolvedAmbiguous}
> - **Skipped:** {skippedSuggestions + skippedAmbiguous}
> - **Total entries in resolution map:** {Object.keys(resolutions).length}
>
> ---
>
> [C] Continue to confirm & execute (Step 4)
> [X] Exit — abort the migration entirely

HALT for input.

### 5. Handle the operator's response

**IF the operator chose `[C]`:**
- Read fully and follow `./step-04-execute.md`.

**IF the operator chose `[X]`:**
- Reply: `"Migration aborted at resolution stage. No changes made. Resolutions discarded."`
- HALT permanently.

## CRITICAL STEP COMPLETION NOTE

ONLY when every REVIEW SUGGESTION and PURE AMBIGUOUS entry has been processed AND the operator has typed `C` will you read fully and follow `./step-04-execute.md`. Do NOT auto-proceed.

---

## 🚨 SYSTEM SUCCESS/FAILURE METRICS

### ✅ SUCCESS:

- Every REVIEW SUGGESTION entry processed (accept/override/skip)
- Every PURE AMBIGUOUS entry processed (specify/skip/batch)
- `{{resolutions}}` map populated with `{ action, initiative? }` per entry
- Counters accurate
- Operator typed `C` to proceed

### ❌ SYSTEM FAILURE:

- Skipping an entry without operator input
- Silently changing the operator's specified initiative
- Auto-proceeding without `C`
- Forgetting to capture the resolution into the map
- Invoking the CLI in this step

**Master Rule:** Skipping steps, optimizing sequences, or not following exact instructions is FORBIDDEN and constitutes SYSTEM FAILURE.
