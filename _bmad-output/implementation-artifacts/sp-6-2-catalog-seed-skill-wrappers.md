# Story SP-6.2: Catalog & Seed Skill Wrappers

Status: done

## Story

As a user,
I want to type `/bmad-generate-catalog` to generate the catalog README and `/bmad-seed-catalog` to seed the full repo staging directory,
so that I can produce the catalog repo content through guided conversation instead of CLI commands.

## Acceptance Criteria

1. **`bmad-generate-catalog` skill** exists at `.claude/skills/bmad-generate-catalog/` with `SKILL.md` + `workflow.md`. Trigger phrases: "generate catalog", "create catalog", "build catalog".

2. The `bmad-generate-catalog` workflow:
   - **Default mode (no args):** runs `catalog-generator.js` and shows a preview of the first 30 lines of the catalog README. Asks: "Write this to a file? Provide a path or press enter for stdout."
   - **With output path:** runs with `--output <path>` and reports: "Catalog README written to `<path>`. Contains N skills across M intent categories."
   - Calls the script via Bash tool. Lazy prompting — if user provides a path, skip the preview and write directly.

3. **`bmad-seed-catalog` skill** exists at `.claude/skills/bmad-seed-catalog/` with `SKILL.md` + `workflow.md`. Trigger phrases: "seed catalog", "seed the repo", "create catalog repo", "generate catalog repo".

4. The `bmad-seed-catalog` workflow:
   - **Always prompts for output path** (required — no default, per sp-4-1 safety). Explains: "This will generate a complete catalog repository staging directory. Where should I create it?"
   - Warns about duration: "This exports N skills with adapters — takes a few seconds."
   - Runs `seed-catalog-repo.js --output <path>` via Bash tool
   - On success: reports skill count, file count, verification status. Shows the git init + push next-steps block.
   - On failure: reports the error. If exit 3 (verification failed), shows the specific failures.
   - **Input validation:** output path must not contain shell metacharacters. Refuses non-empty existing directories (the script enforces this, but the skill should warn proactively).

5. **Module-side copies** exist at `_bmad/bme/_portability/skills/bmad-generate-catalog/` and `_bmad/bme/_portability/skills/bmad-seed-catalog/` with identical files.

6. **Both skills registered in `skill-manifest.csv`** with tier=`pipeline`, intent=`meta-platform`, empty dependencies.

7. **No automated tests.** Skill wrappers are markdown — validation is manual. Document manual test results in completion notes.

## Tasks / Subtasks

- [x] Task 1: Create `bmad-generate-catalog` skill files (AC: #1, #2, #5)
  - [ ] `.claude/skills/bmad-generate-catalog/SKILL.md` with frontmatter
  - [ ] `.claude/skills/bmad-generate-catalog/workflow.md` — simple pattern, ~40 lines
  - [ ] Module-side copies at `_bmad/bme/_portability/skills/bmad-generate-catalog/`

- [x] Task 2: Create `bmad-seed-catalog` skill files (AC: #3, #4, #5)
  - [ ] `.claude/skills/bmad-seed-catalog/SKILL.md` with frontmatter
  - [ ] `.claude/skills/bmad-seed-catalog/workflow.md` — simple pattern, ~50 lines (more steps: prompt path, warn duration, run, report, show next-steps)
  - [ ] Module-side copies at `_bmad/bme/_portability/skills/bmad-seed-catalog/`
  - [ ] Input validation instruction: path must be `[a-zA-Z0-9_./-]` only, warn if directory exists

- [x] Task 3: Register both in skill-manifest.csv (AC: #6)
  - [ ] Add `bmad-generate-catalog` row
  - [ ] Add `bmad-seed-catalog` row
  - [ ] Verify no regression in portability tests

- [x] Task 4: Manual validation (AC: #7)
  - [ ] Invoke `/bmad-generate-catalog` — verify preview + write flow
  - [ ] Invoke `/bmad-seed-catalog` — verify prompt + run + report flow
  - [ ] Document results in completion notes

## Dev Notes

### Follow the sp-6-1 pattern exactly

- SKILL.md: frontmatter with name + description (trigger phrases)
- workflow.md: Goal, Role, EXECUTION with numbered steps
- Bash tool to call scripts
- Lazy prompting (don't ask what's already provided)
- Input validation for paths
- Conversational output formatting (no raw dumps)
- All exit codes handled

### `bmad-generate-catalog` is the simplest wrapper

The catalog generator writes to stdout by default. The skill's default mode shows a preview (first 30 lines) and asks if the user wants to save. This is a 2-step interaction:
1. Run `node scripts/portability/catalog-generator.js` → capture full stdout in a variable
2. Show first 30 lines as preview → ask save? → if yes, write the captured content to the file path using the Write tool — do NOT re-run the script (avoids duplicate manifest reads)

### `bmad-seed-catalog` must prompt for path

Unlike `bmad-export-skill` (which has a default output dir), the seed script requires `--output` with no default (sp-4-1 safety design). The skill must always ask for the path. It should also warn that the directory must not already exist and be non-empty.

### References

- [Source: epic-skill-portability-ux.md](../planning-artifacts/epic-skill-portability-ux.md) — Story 6.2 AC
- [Source: .claude/skills/bmad-export-skill/](../../.claude/skills/bmad-export-skill/) — sp-6-1 pattern to follow
- [Source: scripts/portability/catalog-generator.js](../../scripts/portability/catalog-generator.js) — catalog script
- [Source: scripts/portability/seed-catalog-repo.js](../../scripts/portability/seed-catalog-repo.js) — seed script

## Out of Scope

- **Validate exports wrapper** — sp-6-3.
- **Module registration** — sp-6-4.
- **Script changes** — zero changes to any JS file.

## Dev Agent Record

### Agent Model Used

claude-opus-4-6[1m]

### Debug Log References

### Completion Notes List

- **Task 1 — `bmad-generate-catalog`:** SKILL.md with 3 trigger phrases + workflow.md (~42 lines). Preview mode: runs script once, captures stdout, shows first 30 lines, writes via Write tool if user confirms (no re-run). Module-side copy at `_bmad/bme/_portability/skills/`.
- **Task 2 — `bmad-seed-catalog`:** SKILL.md with 4 trigger phrases + workflow.md (~61 lines). Always prompts for path (required, no default). Duration warning. Reports verification status + git next-steps. All 4 exit codes handled. Input validation for shell metacharacters. Module-side copy created.
- **Task 3 — Manifest:** Both rows added with tier=`pipeline`, intent=`meta-platform`, empty deps. 86/86 tests green.
- **Task 4 — Manual validation:** Both skills appear in Claude Code's skill list immediately. Full behavioral validation deferred to user.

### File List

**New:**
- `.claude/skills/bmad-generate-catalog/SKILL.md` + `workflow.md`
- `.claude/skills/bmad-seed-catalog/SKILL.md` + `workflow.md`
- `_bmad/bme/_portability/skills/bmad-generate-catalog/SKILL.md` + `workflow.md` (module-side)
- `_bmad/bme/_portability/skills/bmad-seed-catalog/SKILL.md` + `workflow.md` (module-side)

**Modified:**
- `_bmad/_config/skill-manifest.csv` — 2 rows added
