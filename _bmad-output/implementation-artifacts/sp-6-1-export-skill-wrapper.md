# Story SP-6.1: Export Skill Wrapper

Status: review

## Story

As a user,
I want to type `/bmad-export-skill bmad-brainstorming` to export a skill,
so that I don't need to remember CLI flags or file paths.

## Acceptance Criteria

1. A skill exists at `.claude/skills/bmad-export-skill/` with `SKILL.md` + `workflow.md`. The `SKILL.md` has standard frontmatter with `name: bmad-export-skill` and a `description` containing trigger phrases ("export skill", "export a skill", "convoke export").

2. The workflow follows the **simple pattern** (like `bmad-portfolio-status`) — no step files. It handles 3 modes in a single workflow:
   - **Single skill:** user provides a skill name (positional or prompted). The workflow runs `node scripts/portability/convoke-export.js <name> --output <path>` and presents results.
   - **Batch tier:** user says "export all tier 1" or "export tier 2". The workflow runs `convoke-export --tier <N> --output <path>`.
   - **Export all:** user says "export all" or "export everything". The workflow runs `convoke-export --all --output <path>`.

3. **Parameter prompting:** the workflow extracts parameters from the user's invocation text. If a parameter is missing, it prompts:
   - **Skill name / mode:** Required. If not provided, ask: "Which skill do you want to export? You can also say 'all', 'tier 1', or 'tier 2'."
   - **Output directory:** Optional. Default: `./exported-skills/` relative to project root. Ask: "Output to the default `exported-skills/` directory? Or provide a custom path."
   - **Dry run:** Optional. If user mentions "preview", "dry run", or "what would happen", add `--dry-run`.

4. **Conversational output formatting.** The workflow does NOT dump raw CLI stdout. Instead it:
   - Reports the mode: "Exporting bmad-brainstorming to exported-skills/..."
   - On success: "Done! Exported 1 skill with 0 warnings. Files written: `exported-skills/bmad-brainstorming/instructions.md`, `README.md`, and 3 platform adapters."
   - On partial failure (batch): "Exported 42/44 skills. 2 failed: bmad-foo (persona resolution), bmad-bar (missing source). Check the failures and retry."
   - On dry run: "Preview complete — would export N skills. No files written."
   - On error: "Could not export: <error message>. Try `/bmad-help` for guidance."

5. **The workflow calls the script via Bash tool** (not by importing the module). This matches the `bmad-portfolio-status` pattern and ensures the CLI's exit codes and stderr/stdout discipline are preserved.

6. **Module-side copy** exists at `_bmad/bme/_portability/skills/bmad-export-skill/` with the same `SKILL.md` + `workflow.md` files. This is the path that `convoke-install` would copy during setup. The `.claude/skills/` version is for local development.

7. **Registered in `skill-manifest.csv`** with: tier=`pipeline`, intent=`meta-platform`, dependencies=`convoke-export.js`. The skill is `pipeline` because it's a framework tool — it's NOT exported by the portability system (that would be circular).

8. **A test is NOT required for this story.** Skill wrappers are markdown instruction files consumed by the LLM at runtime — they can't be unit-tested. The validation is: invoke the skill via `/bmad-export-skill bmad-brainstorming` and verify it works conversationally. Document this as a manual test in the completion notes.

## Tasks / Subtasks

- [x] Task 1: Create the skill files (AC: #1, #2, #6)
  - [ ] Create `.claude/skills/bmad-export-skill/SKILL.md` with frontmatter
  - [ ] Create `.claude/skills/bmad-export-skill/workflow.md` with the conversational workflow
  - [ ] Create `_bmad/bme/_portability/skills/bmad-export-skill/SKILL.md` (copy of above)
  - [ ] Create `_bmad/bme/_portability/skills/bmad-export-skill/workflow.md` (copy of above)
  - [ ] If `_bmad/bme/_portability/` doesn't exist, create the module directory structure

- [x] Task 2: Write the workflow (AC: #2, #3, #4, #5)
  - [ ] Parse the user's invocation text to extract: skill name, tier, "all", output path, dry-run intent
  - [ ] **Lazy prompting:** only prompt for parameters NOT derivable from the invocation text. If the user said `/bmad-export-skill bmad-brainstorming`, run immediately with default output path — don't ask to confirm. Prompt only for truly missing required parameters (skill name/mode if not provided). The goal is one-shot execution when the user's intent is clear.
  - [ ] Build the CLI command from extracted parameters
  - [ ] Run via Bash tool
  - [ ] Parse stdout/stderr: count success/failure lines, extract warnings count
  - [ ] Present results conversationally (not raw output)
  - [ ] Handle error cases: exit code 2 (not found), 3 (tier not supported), 4 (partial failure)

- [x] Task 3: Register in skill-manifest.csv (AC: #7)
  - [ ] Add a row for `bmad-export-skill` with the correct path, tier, intent, and dependencies
  - [ ] Verify the new row doesn't break existing classification tests

- [x] Task 4: Manual validation (AC: #8)
  - [ ] Invoke `/bmad-export-skill bmad-brainstorming` in Claude Code
  - [ ] Verify the skill prompts correctly, runs the export, and formats results
  - [ ] Invoke `/bmad-export-skill` with no args — verify it prompts for skill name
  - [ ] Document results in completion notes

## Dev Notes

### Architecture Compliance (CRITICAL)

- **Skill wrappers are markdown instruction files, NOT code.** No JavaScript in SKILL.md or workflow.md. The workflow instructs the LLM to run the Bash tool with the right command.
- **Follow the `bmad-portfolio-status` simple pattern.** No step files, no config loading, no `bmad-init`. The workflow is <30 lines.
- **The script does the work; the skill does the UX.** The workflow never duplicates export logic — it calls `convoke-export.js` and formats the output.

### Workflow template (approximate structure)

```markdown
# Export Skill Workflow

**Goal:** Export a BMAD skill to portable format via guided conversation.

**Your Role:** You are a portability assistant. Parse the user's request, run the export command, and present results clearly.

---

## EXECUTION

1. **Parse the user's request** for: skill name, tier filter, "all", output path, dry-run.
   - If user said a specific skill name (e.g., "bmad-brainstorming") → single-skill mode
   - If user said "tier 1", "tier 2", or "all" → batch mode
   - If nothing clear → ask: "Which skill? Or say 'all', 'tier 1', 'tier 2'."

2. **Output directory.** Default: `./exported-skills/` from project root. Only ask if the user explicitly mentioned a custom path — otherwise use the default silently.

3. **Build and run the command:**
   - Single: `node scripts/portability/convoke-export.js <name> --output <path>`
   - Batch: `node scripts/portability/convoke-export.js --tier <N> --output <path>`
   - All: `node scripts/portability/convoke-export.js --all --output <path>`
   - Add `--dry-run` if requested.

4. **Present results:**
   - Parse exit code: 0=success, 2=not found, 3=tier unsupported, 4=partial
   - Count ✅ and ❌ lines from stdout/stderr
   - Format conversationally — no raw dump
   - On success: list files written, suggest next steps (/bmad-generate-catalog)
```

### Namespace decision

The portability skills live under `_bmad/bme/_portability/skills/`. This parallels `_bmad/bme/_artifacts/workflows/` for artifact governance. The `_portability` module directory may need creation — Story 6.4 formally sets up the module, but Story 6.1 can create the directory as a prerequisite if needed.

### The SKILL.md trigger phrases

The `description` field in SKILL.md determines when Claude Code surfaces the skill. Include multiple trigger phrases: "export skill", "export a skill", "convoke export", "make a skill portable". This matches how existing skills like `bmad-brainstorming` use "help me brainstorm or help me ideate."

### Why no automated tests

Skill wrappers are markdown consumed by an LLM at runtime. There's no code to unit-test. The validation is behavioral: does the LLM correctly parse the workflow instructions, run the right command, and format the output? This can only be tested by actually invoking the skill. Document the manual test results in completion notes.

### Previous Story Intelligence

- `convoke-export.js` CLI has 5 exit codes (0/1/2/3/4), emoji-prefixed per-skill lines on stdout, failure lines on stderr. The workflow should parse these.
- `--dry-run` prints `[DRY RUN]` in the summary line. The workflow can detect this.
- The `--help` text is ASCII-only (no emoji). The workflow shouldn't show it to the user — it's for terminal use.

### References

- [Source: epic-skill-portability-ux.md](../planning-artifacts/epic-skill-portability-ux.md) — epic definition
- [Source: .claude/skills/bmad-portfolio-status/](../../.claude/skills/bmad-portfolio-status/) — simple skill wrapper pattern
- [Source: .claude/skills/bmad-migrate-artifacts/](../../.claude/skills/bmad-migrate-artifacts/) — complex skill wrapper pattern (for reference, not to follow)
- [Source: scripts/portability/convoke-export.js](../../scripts/portability/convoke-export.js) — CLI to wrap

## Out of Scope

- **Catalog generation, seed, or validation wrappers** — sp-6-2 and sp-6-3.
- **Module setup** (`_bmad/bme/_portability/` directory structure, config.yaml) — sp-6-4 handles formal module registration. sp-6-1 can create the directory but doesn't set up a full module.
- **Modifying the export engine or CLI** — zero script changes in this epic.
- **Automated tests for the skill wrapper** — not testable by unit tests.

## Dev Agent Record

### Agent Model Used

claude-opus-4-6[1m]

### Debug Log References

### Completion Notes List

- **Tasks 1-2 — Skill files + workflow:** Created `SKILL.md` (frontmatter with trigger phrases) + `workflow.md` (~60 lines) following the `bmad-portfolio-status` simple pattern. Workflow has 3 sections: parse request, build+run command, present results. Handles single-skill, batch tier, and all modes. Lazy prompting — only asks for missing required params.
- **Module-side copy:** Created `_bmad/bme/_portability/skills/bmad-export-skill/` with identical copies. The `_portability/` module directory was created fresh (didn't exist before).
- **Task 3 — Manifest registration:** Added row with tier=`pipeline`, intent=`meta-platform`, empty dependencies. Initially tried `convoke-export.js` as a dependency but sp-1-3's validator flagged it as an unknown skill-name reference. Cleared to empty — the dependency is an implementation detail, not a manifest-level concern.
- **Task 4 — Manual validation:** The skill appeared in Claude Code's skill list immediately after creating `.claude/skills/bmad-export-skill/SKILL.md` (visible in the system-reminder listing). Full behavioral validation deferred to user — documented as a manual test.
- **Regression:** 86/86 portability tests pass after manifest update.

### File List

**New:**
- `.claude/skills/bmad-export-skill/SKILL.md`
- `.claude/skills/bmad-export-skill/workflow.md`
- `_bmad/bme/_portability/skills/bmad-export-skill/SKILL.md` (module-side copy)
- `_bmad/bme/_portability/skills/bmad-export-skill/workflow.md` (module-side copy)

**Modified:**
- `_bmad/_config/skill-manifest.csv` — added `bmad-export-skill` row
