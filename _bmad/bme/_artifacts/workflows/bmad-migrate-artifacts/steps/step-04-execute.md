# Step 4: Confirm & Execute

## STEP GOAL:

To present the final migration plan, get explicit operator confirmation, write the resolutions JSON file, invoke the migration CLI in non-interactive mode, and report the results (success or failure).

## MANDATORY EXECUTION RULES (READ FIRST):

### Universal Rules:

- 🛑 NEVER apply the migration without explicit `y` from the operator
- 📖 CRITICAL: Read the complete step file before taking any action
- 🔄 CRITICAL: If the CLI fails, present the raw error and offer retry — do NOT swallow it
- 📋 YOU ARE A FACILITATOR running the final step, not a content generator
- ✅ YOU MUST ALWAYS SPEAK OUTPUT In your Agent communication style with the config `{communication_language}`

### Role Reinforcement:

- ✅ This is the only step that mutates the repo
- ✅ Operator confirmation is the gate — never skip it
- ✅ Errors must be surfaced verbatim, not interpreted

### Step-Specific Rules:

- 🎯 Final summary → confirmation → write resolutions file → invoke CLI → report
- 🚫 FORBIDDEN to apply without `y`
- 🚫 FORBIDDEN to forget cleanup of the temp resolutions file (success path)
- 💬 Operator overrides MUST be passed to the CLI via `--resolution-file`

## EXECUTION PROTOCOLS:

- 🎯 Build the resolutions JSON in schema-versioned envelope
- 💾 Write to a recognizable temp path; clean up on success
- 🚫 FORBIDDEN to invoke `--apply` without `--force --resolution-file <path>`

## CONTEXT BOUNDARIES:

- Available context: `{{scope}}` from Step 1, `{{buckets}}` from Step 2, `{{resolutions}}` from Step 3
- Focus: confirmation + execution + reporting
- Limits: this is the final step; no further routing
- Dependencies: Steps 1-3 must have run

## Sequence of Instructions (Do not deviate, skip, or optimize)

### 1. Build the final plan summary

From `{{buckets}}` and `{{resolutions}}`, compute:

- **Clean renames:** count from `{{buckets}}.CLEAN_RENAME`
- **Operator-resolved renames:** count of `{{resolutions}}` entries with `action === 'rename'`
- **Operator-skipped:** count of `{{resolutions}}` entries with `action === 'skip'`
- **Collisions auto-suggested:** count from `{{buckets}}.COLLISION` where `suggestedNewPath` is not null
- **Conflicts (still blocking):** count from `{{buckets}}.CONFLICT`

Display:

> ### 🎯 Final Migration Plan
>
> - ✅ **{N} clean renames** (engine inferences, no operator action)
> - 👤 **{M} operator-resolved renames** (from your Step 3 decisions)
> - ⏭️ **{K} operator-skipped** files
> - ⚠️ **{C} collisions** with suggested differentiators
> - 🚨 **{X} conflicts** — these BLOCK the migration. Resolve manually before re-running.
>
> Total files that will be modified: **{N + M + C}**

If `{X}` (conflicts) > 0:
- Display: `🚨 Migration BLOCKED by {X} unresolved conflict(s). Aborting. Please resolve manually and re-run.`
- HALT permanently. Do NOT proceed to step 2.

### 2. Ask for confirmation

Display this menu and HALT for input:

```
Apply migration? [y/n]
```

### 3. Handle the operator's response

**IF the operator typed `n` (or 'no', 'abort', 'cancel'):**
- Reply: `"Migration aborted at confirmation. No changes made."`
- Do NOT write the temp resolutions file.
- HALT permanently.

**IF the operator typed `y` (or 'yes', 'apply', 'go'):**
- Proceed to step 4 below.

**IF the response is anything else:**
- Re-ask. Loop until valid.

### 4. Write the resolutions JSON file

Build the schema-versioned envelope:

```json
{
  "schemaVersion": 1,
  "resolutions": { ... contents of {{resolutions}} ... }
}
```

Write it to the **OS temp directory** (NOT under `_bmad-output/`, which would otherwise be picked up by the next migration scan as an artifact and could end up committed). On macOS/Linux this is typically `/tmp/`; portably you can use the result of `mktemp -t convoke-migration-resolutions.json`. The exact path doesn't matter — it just needs to be writable, outside the project tree, and unique enough to avoid collisions with concurrent runs.

Capture the chosen path as `{{resolutionFilePath}}`.

If the resolutions map is EMPTY (Step 3 was skipped because no entries needed resolving), do NOT write a resolutions file. Skip the `--resolution-file` flag in step 5.

### 5. Invoke the migration CLI

**In a Convoke development checkout** (the project root's `package.json` has `"name": "convoke-agents"`), run `scripts/migrate-artifacts.js` with `node` and the same arguments instead of the `npx` command below: inside the checkout, `npx -p convoke-agents` finds the checkout's own package name, installs nothing, and the command is not found or resolves to an old global copy.

Shell out to:

```
npx -p convoke-agents convoke-migrate-artifacts --apply --force --include "{{scope}}" --resolution-file "{{resolutionFilePath}}"
```

**Always quote `{{scope}}` and `{{resolutionFilePath}}`** — the resolution file lives in `os.tmpdir()` which on macOS may resolve to a path containing spaces, and unquoted shell expansion will split on whitespace and break the command. Quote both arguments unconditionally.

(Omit `--resolution-file` only if step 4 didn't write a resolutions file because the resolutions map was empty.)

Capture stdout and stderr. The CLI will produce three commits on success:
1. `chore: rename artifacts to governance convention` (rename phase)
2. `chore: inject frontmatter metadata and update links` (injection phase)
3. `chore: generate governance convention ADR` (ADR phase)

### 6. Handle the CLI result

**IF the CLI exited with code 0 (success):**

Parse stdout for the three commit SHAs. Look for lines like:
- `Rename phase complete. N files renamed. Commit: <sha>`
- `Injection phase complete. N files injected, M links updated, K conflicts skipped. Commit: <sha>`
- `ADR generated: adr-artifact-governance-convention-<date>.md`

Display:

> ### ✅ Migration Complete
>
> - **Renamed:** {N} files (commit `{rename_sha}`)
> - **Frontmatter injected:** {M} files (commit `{inject_sha}`)
> - **Links updated:** {K}
> - **ADR generated:** `{adr_filename}`
>
> The rename map has been written to `_bmad-output/planning-artifacts/artifact-rename-map.md` and is included in the rename commit.

Then clean up the temp resolutions file:

```
rm {{resolutionFilePath}}
```

(Only if it was written in step 4. Failures here are non-fatal — the file is recognizable by its `.migration-resolutions-` prefix and can be removed manually.)

End the workflow with:

> 🎉 Done. Run `bmad-portfolio-status` to see the updated portfolio view.

**IF the CLI exited with non-zero (failure):**

Display the raw stderr verbatim:

> ### 🚨 Migration Failed
>
> The CLI returned an error:
>
> ```
> {raw stderr}
> ```
>
> The temp resolutions file is preserved at `{{resolutionFilePath}}` for inspection.

Then offer the operator a choice:

```
[R] Retry from Step 1 (Scope Selection)
[X] Exit (manual recovery required)
```

HALT for input.

- **IF `[R]`:** Read fully and follow `./step-01-scope.md` to restart. Note: the existing temp file is left in place; the operator can delete it manually.
- **IF `[X]`:** Reply with recovery guidance:
  > "Recovery hint: check `git status` to see if any rename or commit completed partially. The CLI is designed to roll back on failure (`git reset --hard HEAD`), but if rollback failed the working tree may be dirty. Resolve manually before re-running."
  > HALT permanently.

## CRITICAL STEP COMPLETION NOTE

This is the final step. There is no `next step` to load. The workflow ends here in all paths (success, failure, abort). Do NOT auto-load any other file.

---

## 🚨 SYSTEM SUCCESS/FAILURE METRICS

### ✅ SUCCESS:

- Final plan summary presented
- Operator confirmed with `y`
- Temp resolutions file written (if needed)
- CLI invoked with `--apply --force` and (if applicable) `--resolution-file`
- Operator overrides honored end-to-end
- Three commit SHAs reported on success
- Temp file cleaned up on success

### ❌ SYSTEM FAILURE:

- Applying without operator `y`
- Forgetting `--resolution-file` when resolutions exist
- Swallowing CLI errors
- Hiding the raw stderr from the operator
- Auto-retrying without operator input
- Forgetting to handle the conflict-blocked case in step 1

**Master Rule:** Skipping steps, optimizing sequences, or not following exact instructions is FORBIDDEN and constitutes SYSTEM FAILURE.
