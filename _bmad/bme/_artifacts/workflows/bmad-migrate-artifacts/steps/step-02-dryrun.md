# Step 2: Dry-Run Review

## STEP GOAL:

To run the migration in dry-run mode, parse the manifest output into 5 categories, and present them to the operator in a structured format (instead of dumping the raw CLI wall of text).

## MANDATORY EXECUTION RULES (READ FIRST):

### Universal Rules:

- 🛑 NEVER skip the dry-run — every migration MUST go through this step
- 📖 CRITICAL: Read the complete step file before taking any action
- 🔄 CRITICAL: When loading next step with 'C', ensure entire file is read
- 📋 YOU ARE A FACILITATOR presenting categorized results, not a content generator
- ✅ YOU MUST ALWAYS SPEAK OUTPUT In your Agent communication style with the config `{communication_language}`

### Role Reinforcement:

- ✅ You parse the CLI's output into buckets and present them clearly
- ✅ The operator should never see a raw 70-line wall of text — group by category

### Step-Specific Rules:

- 🎯 Focus ONLY on dry-run + categorization in this step
- 🚫 FORBIDDEN to invoke `--apply` (Step 4 does that)
- 🚫 FORBIDDEN to ask for resolutions yet (Step 3 does that)
- 💬 Hold the parsed bucket data in working memory for Step 3 to consume

## EXECUTION PROTOCOLS:

- 🎯 Shell out to the CLI in dry-run mode
- 💾 Parse output into 7 buckets via simple substring matching (NOT regex)
- 🚫 FORBIDDEN to load next step until the operator selects 'C' or 'X'

## CONTEXT BOUNDARIES:

- Available context: `{{scope}}` from Step 1
- Focus: dry-run execution + output parsing + bucket presentation
- Limits: no resolution prompts, no apply
- Dependencies: Step 1 must have set `{{scope}}`

## Sequence of Instructions (Do not deviate, skip, or optimize)

### 1. Run the migration in dry-run mode

**In a Convoke development checkout** (the project root's `package.json` has `"name": "convoke-agents"`), run `scripts/migrate-artifacts.js` with `node` and the same arguments instead of the `npx` command below: inside the checkout, `npx -p convoke-agents` finds the checkout's own package name, installs nothing, and the command is not found or resolves to an old global copy.

Shell out to:

```
npx -p convoke-agents convoke-migrate-artifacts --include {{scope}}
```

Capture stdout in full. **Note:** the CLI returns immediately after printing the manifest in dry-run mode (no `--apply`) — it does NOT enter the interactive ambiguity prompt. That only fires in apply mode. So this shell-out cannot hang on operator input. The CLI will output a manifest in this format (defined in `scripts/lib/artifact-utils.js` `formatManifest()`):

```
[SKIP] dir/file.md -- already governed
[INJECT] dir/file.md -- frontmatter needed
dir/old.md -> dir/new.md
  Initiative: name (confidence: high, source: inferred)
  Type: name (confidence: high, source: prefix)
  [!] COLLISION: same target as dir/other.md
  Suggested rename: dir/new-with-suffix.md
[!] dir/file.md -> CONFLICT (filename says X, frontmatter says Y)
  ACTION REQUIRED: Resolve initiative conflict before migration
[!] dir/file.md -> ??? (ambiguous -- type: prd, initiative unknown)
  Line 1: "..."
  Line 2: "..."
  Line 3: "..."
  Git author: Name (date)
  Suggested: convoke (source: folder-default, confidence: low)
  REVIEW SUGGESTION: Accept 'convoke' or specify initiative
[!] dir/file.md -> ??? (ambiguous -- type: prd, initiative unknown)
  Line 1: "..."
  ACTION REQUIRED: Specify initiative for this file

--- Manifest Summary ---
Total: 73 | Rename: 42 | Skip: 0 | Inject: 0 | Conflict: 0 | Ambiguous: 31
[!] 1 filename collision(s) detected -- resolve before executing
```

### 2. Parse the output into 7 buckets

Use **simple substring matching**, not regex. Walk the output line by line and bucket each entry by its action label:

| Bucket | Detection rule |
|--------|---------------|
| **SKIP** | Line starts with `[SKIP] ` |
| **INJECT_ONLY** | Line starts with `[INJECT] ` |
| **CLEAN RENAME** | Line contains ` -> ` AND does NOT start with `[!] ` (i.e., the rename arrow appears, the line is not flagged ambiguous/conflict) AND no `[!] COLLISION` appears in the next 2–4 lines |
| **COLLISION** | A line matching the CLEAN RENAME shape but with `[!] COLLISION:` in one of its 2–4 follow-up lines (categorized as COLLISION instead of CLEAN RENAME) |
| **CONFLICT** | Line starts with `[!] ` and contains `-> CONFLICT (` |
| **REVIEW SUGGESTION** | Line starts with `[!] ` and contains `??? (ambiguous` AND a subsequent `Suggested:` line exists before the next entry |
| **PURE AMBIGUOUS** | Line starts with `[!] ` and contains `??? (ambiguous` AND NO `Suggested:` line follows before the next entry |

For each entry, store in working memory:
- `oldPath` (the full `dir/filename.md`)
- `category` (one of the 7 above)
- For RENAMEs: `newPath`, `initiative`, `type`
- For COLLISIONs: `suggestedNewPath`, `collisionWith`
- For REVIEW SUGGESTIONs: `suggestedInitiative`, `suggestedFrom`, `suggestedConfidence`, `firstLines` (the 3 context lines), `gitAuthor`
- For PURE AMBIGUOUS: `firstLines`, `gitAuthor`, `candidates`

This bucket data structure becomes `{{buckets}}` for Step 3.

### 3. Present the categorized results

Display in this order, with clear visual separation:

> ### 📊 Dry-Run Summary
>
> **Total entries:** {total}
>
> ---
>
> ✅ **{N} clean renames** (no operator action needed)
>
> First 5 examples:
> - `{old1}` → `{new1}`
> - `{old2}` → `{new2}`
> - ... (truncate after 5; show "_+ {N-5} more_" if there are more)
>
> ---
>
> 💡 **{N} review suggestions** (the engine has a default — you can accept or override)
>
> Each entry on its own line:
> - `{old}` → suggested `{initiative}` (`{source}`, confidence `{confidence}`)
> - ...
>
> ---
>
> ❗ **{N} pure ambiguous** (no suggestion — operator must specify)
>
> Each entry with first content line:
> - `{old}` — _line 1: "{first_line}"_
> - ...
>
> ---
>
> ⚠️ **{N} collisions** (auto-suggested differentiator if available)
>
> Each entry on its own line:
> - `{old}` → collides with `{other}`. Suggested: `{suggestedNewPath}`
>
> ---
>
> 🚨 **{N} conflicts** (filename ↔ frontmatter mismatch — must resolve manually before migration)
>
> Each entry with the conflict description.
>
> ---
>
> 📁 **{N} skip** / 💉 **{N} inject-only** (no action needed)

If a bucket is empty, omit its section entirely (don't show "0 collisions").

### 4. Present continuation menu

Display this menu and HALT for input:

```
[C] Continue to resolution (Step 3)
[X] Exit — abort the migration entirely
```

### 5. Handle the operator's response

**IF the operator chose `[C]`:**
- If both `REVIEW SUGGESTION` and `PURE AMBIGUOUS` buckets are EMPTY: skip Step 3 entirely and go directly to Step 4 (nothing to resolve).
- Otherwise: read fully and follow `./step-03-resolve.md`.

**IF the operator chose `[X]`:**
- Reply: `"Migration aborted at dry-run stage. No changes made."`
- HALT permanently.

## CRITICAL STEP COMPLETION NOTE

ONLY when the operator has typed `C` and the bucket data is captured will you read fully and follow the next step. Do NOT auto-proceed.

---

## 🚨 SYSTEM SUCCESS/FAILURE METRICS

### ✅ SUCCESS:

- Dry-run CLI invoked with `{{scope}}`
- All entries parsed into the correct bucket
- Categories presented in the correct visual order
- Bucket data held in working memory for Step 3
- Operator typed `C` or `X`

### ❌ SYSTEM FAILURE:

- Dumping the raw CLI output without parsing
- Skipping the bucket presentation
- Auto-proceeding without `C`
- Invoking `--apply` in this step
- Asking resolution questions in this step

**Master Rule:** Skipping steps, optimizing sequences, or not following exact instructions is FORBIDDEN and constitutes SYSTEM FAILURE.
