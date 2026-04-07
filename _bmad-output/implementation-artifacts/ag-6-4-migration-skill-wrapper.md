# Story 6.4: Migration Skill Wrapper

Status: ready-for-dev

## Story

As a Convoke operator,
I want to run artifact migration through a guided skill conversation,
So that I get the same conversational experience as every other Convoke workflow instead of a raw CLI dump.

## Acceptance Criteria

1. **Given** a new skill exists at `.claude/skills/bmad-migrate-artifacts/` **When** the operator invokes it via slash command or fuzzy match (e.g. "migrate artifacts", "run migration") **Then** `SKILL.md` loads and the workflow runs `workflow.md`.

2. **Given** the skill is structured per the BMAD workflow skill anatomy **When** inspected **Then** it contains: `SKILL.md` (frontmatter only, single-line redirect), `workflow.md` (orchestration with frontmatter, goal, role, architecture, initialization), `steps/` directory with 4 step files (no continuation pattern needed), and a `templates/` directory IF the workflow produces an output artifact (see Task 2.4).

3. **Given** the workflow runs **When** Step 1 (Scope Selection) executes **Then** the agent presents the default scope (`planning-artifacts, vortex-artifacts, gyre-artifacts`), explains what will be scanned, asks the operator to confirm or adjust, and HALTs for input. The operator can accept the default or supply a comma-separated list.

4. **Given** Step 1 completes **When** Step 2 (Dry-Run Review) executes **Then** the agent shells out to `node scripts/migrate-artifacts.js --include {scope}`, captures the output, and presents results **grouped by category** (not as a flat wall): clean RENAMEs (count + first 5), suggested REVIEWs (count + each suggestion), CONFLICTs, AMBIGUOUS pure (count + each), and collisions with their `Suggested rename:` lines. The agent does NOT just dump the raw CLI output.

5. **Given** Step 2 produced suggestions and ambiguities **When** Step 3 (Resolve) executes **Then** the agent walks the operator through resolution conversationally: for each `REVIEW SUGGESTION` entry, the agent presents the suggested initiative and asks "Accept '{X}'? [y/n/specify]". For each pure AMBIGUOUS entry, the agent asks for an initiative. The agent supports a batch shortcut: "all remaining planning-artifacts → convoke" (or any initiative ID). At each prompt the agent HALTs for input.

6. **Given** Step 3 completes **When** Step 4 (Confirm & Execute) executes **Then** the agent summarizes the final plan (X clean renames, Y resolved suggestions, Z still ambiguous and will be skipped, W collisions resolved via differentiator), asks "Apply migration? [y/n]", and on `y` shells out to `node scripts/migrate-artifacts.js --apply --force --include {scope}` and reports the result. On `n` the agent exits gracefully without modifying anything.

7. **Given** the skill workflow completes successfully **When** the workflow ends **Then** the agent reports: number of files renamed, number of frontmatter injections, number of links updated, the SHA of the rename commit, and the path to `artifact-rename-map.md`.

8. **Given** any step encounters an error from the underlying CLI (non-zero exit, malformed output, git failure) **When** the error surfaces **Then** the agent presents the raw error to the operator, explains which step failed, and offers to either retry from the failed step or exit. The agent does NOT attempt to "interpret" the error or hide details.

9. **Given** each step completes **When** the step boundary is crossed **Then** the workflow updates frontmatter `stepsCompleted[]` (per the standard BMAD workflow pattern) so the workflow is resumable if interrupted.

10. **Given** the new skill needs to be discoverable **When** registration is complete **Then** the skill is registered in `_bmad/_config/skill-manifest.csv` with module `bmm`, path `_bmad/bmm/4-implementation/bmad-migrate-artifacts/SKILL.md`, and `install_to_bmad: "true"`.

11. **Given** the skill is installed via `convoke-update` or `convoke-install` **When** `refresh-installation.js` runs **Then** the new skill files are copied from the package source to the project's `.claude/skills/` directory. (Story 6.6 owns the wiring details — this AC just verifies the **source files exist in the right location** for that wiring to pick them up.)

12. **Given** the operator made overrides in Step 3 (e.g. "this AMBIGUOUS file is actually `forge`") **When** Step 4 invokes the CLI **Then** those overrides are honored — files marked `override` are renamed to the operator-specified initiative, files marked `skip` are left alone, files marked `accept` use the engine's suggestion. **Operator overrides MUST NOT be silently dropped.**

13. **Given** the CLI accepts a new `--resolution-file <path>` flag **When** the flag is supplied with a path to a JSON resolution map **Then** the migration loads that map and uses it as the source of truth for ambiguous entries (instead of prompting interactively or auto-skipping in `--force`). The JSON shape is defined in **Resolution Map Format** in Dev Notes.

14. **Given** `--resolution-file` is combined with `--force` **When** the migration runs **Then** the resolution map is consulted first; any AMBIGUOUS entries NOT in the map fall back to the existing `--force` behavior (auto-skip). This preserves backwards compatibility with the existing CLI behavior.

15. **Given** the implementation is complete **When** `npm run check` runs **Then** all 5 stages pass (Lint, Unit, Integration, Jest lib, Coverage). New CLI behavior (Tasks 4 + 5) requires unit tests covering: (a) `--resolution-file` flag parsing, (b) `resolveAmbiguous()` honoring a resolution map, (c) override files producing RENAME entries with `source: 'operator'`, (d) skip files producing SKIP entries, (e) `--resolution-file` + `--force` combination, (f) malformed resolution file produces a clear error.

## Tasks / Subtasks

- [ ] **Task 1: Extend `resolveAmbiguous()` to honor a resolution map** (AC: #12, #13, #14)
  - [ ] 1.1 Open [scripts/lib/artifact-utils.js](scripts/lib/artifact-utils.js) and locate `resolveAmbiguous()` (around line 1708).
  - [ ] 1.2 Extend the options destructuring: `const { force = false, promptFn = promptInitiative, resolutionMap = null } = options;`
  - [ ] 1.3 At the top of the AMBIGUOUS branch (before the no-candidates auto-skip and before the force auto-skip), add a resolution-map lookup:
    ```javascript
    if (resolutionMap && Object.prototype.hasOwnProperty.call(resolutionMap, entry.oldPath)) {
      const resolution = resolutionMap[entry.oldPath];
      if (resolution.action === 'skip') {
        entry.action = 'SKIP';
        skipped++;
        continue;
      }
      if (resolution.action === 'rename') {
        // initiative is pre-validated at load time
        entry.initiative = resolution.initiative;
        entry.artifactType = entry.artifactType || inferTypeFromFilename(entry.oldPath); // fallback if no type
        const filename = entry.oldPath.split('/').pop();
        const newFilename = generateNewFilename(filename, resolution.initiative, entry.artifactType, taxonomy);
        entry.newPath = `${entry.dir}/${newFilename}`;
        entry.action = 'RENAME';
        entry.confidence = 'high';
        entry.source = 'operator';
        resolved++;
        continue;
      }
    }
    ```
  - [ ] 1.4 The existing guards (no candidates, force) only fire if no resolution-map entry matched. This preserves backwards compatibility — `--force` alone still auto-skips ambiguous files.
  - [ ] 1.5 **Edge case:** an AMBIGUOUS entry with no `artifactType` (cannot infer type from filename) — the resolution map can still mark it `rename` with an explicit initiative, but `generateNewFilename()` needs a type. Since the entry passed `inferArtifactType()` and got null, we don't have one. **Decision:** if `entry.artifactType` is null AND the resolution map says `rename`, fall back to a synthetic `'note'` type. Document this limitation in the function's JSDoc.

- [ ] **Task 2: Add `--resolution-file` flag to migrate-artifacts CLI** (AC: #13, #14)
  - [ ] 2.1 Open [scripts/migrate-artifacts.js](scripts/migrate-artifacts.js) and locate `parseArgs()` (around line 44).
  - [ ] 2.2 Add `--resolution-file <path>` parsing: similar pattern to `--include`, but takes a single path argument. Validate the path exists at parse time; if not, return a parse error and let `main()` exit with a clear message.
  - [ ] 2.3 In `main()`, after the manifest is generated and before `resolveAmbiguous()` is called, load and validate the resolution file (if the flag was supplied). Use a new helper `loadResolutionMap(path, taxonomy)` exported from `artifact-utils.js`:
    ```javascript
    function loadResolutionMap(filePath, taxonomy) {
      // 1. Read file → JSON parse → throw clear error on either failure
      // 2. Validate schemaVersion === 1
      // 3. For each entry, validate action and (if rename) initiative
      // 4. Return the inner `resolutions` object (a flat map for O(1) lookup)
    }
    ```
  - [ ] 2.4 Pass the loaded map to `resolveAmbiguous()` via the new `resolutionMap` option.
  - [ ] 2.5 Update `printHelp()` to document the new flag.
  - [ ] 2.6 Export `loadResolutionMap` from `artifact-utils.js` module exports.

- [ ] **Task 3: CLI tests for `--resolution-file`** (AC: #15)
  - [ ] 3.1 Add tests to [tests/lib/manifest.test.js](tests/lib/manifest.test.js) (or wherever `resolveAmbiguous` tests live) covering:
    - `resolveAmbiguous` with a resolution map containing a `rename` entry → entry becomes RENAME with `source: 'operator'`
    - `resolveAmbiguous` with a resolution map containing a `skip` entry → entry becomes SKIP
    - `resolveAmbiguous` with a resolution map AND `force: true` → map takes precedence
    - `resolveAmbiguous` with a resolution map but the entry's oldPath isn't in the map → falls back to existing logic
    - Resolution map for an entry with no `artifactType` → falls back to synthetic `'note'` type
  - [ ] 3.2 Add tests for `loadResolutionMap` covering:
    - Valid file → returns the resolutions object
    - File not found → throws with `"Resolution file not found"`
    - Invalid JSON → throws with `"Invalid JSON in resolution file"`
    - Missing/wrong `schemaVersion` → throws with `"Unsupported schemaVersion"`
    - Invalid action → throws with `"Invalid action"`
    - Unknown initiative → throws with `"Unknown initiative"`
  - [ ] 3.3 Add a CLI parse test in [tests/lib/migrate-artifacts.test.js](tests/lib/migrate-artifacts.test.js) for `--resolution-file path/to/file.json` parsing.

- [ ] **Task 4: Create skill directory structure** (AC: #1, #2)
  - [ ] 4.1 Create `_bmad/bmm/4-implementation/bmad-migrate-artifacts/` (the source-of-truth location).
  - [ ] 4.2 Create `_bmad/bmm/4-implementation/bmad-migrate-artifacts/SKILL.md` with the standard 4-line frontmatter format (see **SKILL.md Template** in Dev Notes).
  - [ ] 4.3 Create `_bmad/bmm/4-implementation/bmad-migrate-artifacts/workflow.md` (see **workflow.md Template**).
  - [ ] 4.4 Create `_bmad/bmm/4-implementation/bmad-migrate-artifacts/steps/` directory.
  - [ ] 4.5 Create the four step files: `step-01-scope.md`, `step-02-dryrun.md`, `step-03-resolve.md`, `step-04-execute.md`.

- [ ] **Task 5: Author Step 1 — Scope Selection** (AC: #3)
  - [ ] 5.1 Step file structure: H1 title, Progress line, STEP GOAL, MANDATORY EXECUTION RULES (universal + role + step-specific), EXECUTION PROTOCOLS, CONTEXT BOUNDARIES, Sequence of Instructions.
  - [ ] 5.2 The instructions must: (a) explain to the operator what artifact migration does in 2 sentences, (b) list the three default scope directories with their counts (the agent should run `ls _bmad-output/planning-artifacts | wc -l` etc. to populate counts), (c) ask "Accept default scope or specify a custom comma-separated list?" and HALT.
  - [ ] 5.3 On operator response, capture the chosen scope as `{{scope}}` for downstream steps. If the operator types a custom list, validate it's comma-separated and contains only valid directory names; reject invalid input and re-ask.
  - [ ] 5.4 **Decision:** This skill produces **no output artifact** — the migration mutates the repo directly via git commits. So the workflow does NOT need a `templates/` directory or `outputFile:` frontmatter field. State (scope, resolutions) is held in the agent's working memory across step boundaries, not persisted to a file. Document this in workflow.md.

- [ ] **Task 6: Author Step 2 — Dry-Run Review** (AC: #4)
  - [ ] 6.1 Instructions: shell out to `node scripts/migrate-artifacts.js --include {{scope}}` (no `--apply`), capture stdout.
  - [ ] 6.2 Parse the output into 5 buckets by scanning for the action label patterns: `[SKIP]`, `RENAME` (lines without `[!]`), `REVIEW SUGGESTION` (REVIEW SUGGESTION label, populated by Story 6.2), pure `ACTION REQUIRED` (no suggestion), `[!] COLLISION`. Story 6.2 added `Suggested:` and `Suggested rename:` lines — the parser must recognize them.
  - [ ] 6.3 Present the buckets to the operator in this order: clean RENAMEs (just a count + first 5 examples), CONFLICTs (each with the conflict description), REVIEW SUGGESTIONs (count + each line so operator can review), pure AMBIGUOUS (count + each), collisions with their suggested differentiators.
  - [ ] 6.4 At the end of Step 2, ask "Proceed to resolution? [y/n]" and HALT. On `n`, exit the workflow gracefully (no migration attempted).
  - [ ] 6.5 The parsing logic should be **simple string matching**, not a regex parser. The CLI output format is documented in `scripts/lib/artifact-utils.js` `formatManifest()` and the patches from Story 6.2.

- [ ] **Task 7: Author Step 3 — Interactive Resolution** (AC: #5, #12)
  - [ ] 7.1 Instructions: iterate through REVIEW SUGGESTION entries from Step 2's parse. For each, present: the filename, the suggested initiative + source + confidence, and ask "Accept '{suggested}'? [y/n/specify <initiative>]". HALT for each.
  - [ ] 7.2 After REVIEW SUGGESTIONs, iterate through pure AMBIGUOUS entries. For each, present: filename, first 3 lines of content (already in the CLI output), and ask "Specify initiative for this file [<initiative>/skip]". HALT for each.
  - [ ] 7.3 **Batch shortcut**: At any point during the AMBIGUOUS loop, the operator can type `all <initiative>` (e.g. `all convoke`) to assign the same initiative to ALL remaining files in the SAME directory. Document this affordance in the step instructions and in the prompts shown to the operator ("...[<initiative>/skip/all <initiative>]").
  - [ ] 7.4 Track resolutions in working memory as a map: `{ "dir/filename.md" → { action: 'rename'|'skip', initiative: string|null } }`. The keys MUST match the `oldPath` format used by the manifest and the resolution-file format. This map becomes the `resolutions` object that Step 4 writes to the JSON file.
  - [ ] 7.5 At the end of Step 3, summarize: "Resolved: X accepted, Y overridden, Z skipped." and HALT before Step 4.

- [ ] **Task 8: Author Step 4 — Confirm & Execute** (AC: #6, #7, #8, #12)
  - [ ] 8.1 Instructions: present the final plan summary (renames, resolutions, collisions, skipped). Ask "Apply migration? [y/n]" and HALT.
  - [ ] 8.2 On `y`: write the resolutions map from Step 3 to a temporary JSON file at `_bmad-output/.migration-resolutions-{timestamp}.json` (or use Node's `os.tmpdir()` — either is fine, just must be writable). Wrap the resolutions in the schema-versioned envelope: `{ "schemaVersion": 1, "resolutions": { ... } }`.
  - [ ] 8.3 Then shell out: `node scripts/migrate-artifacts.js --apply --force --include {{scope}} --resolution-file <path>`. The combination of `--force` (skip confirmation prompt) + `--resolution-file` (operator overrides) gives a fully non-interactive run that honors every Step 3 decision.
  - [ ] 8.4 On `n`: exit gracefully with "Migration aborted. No changes made." Do NOT write the temp resolution file.
  - [ ] 8.5 Capture stdout/stderr from the CLI invocation. On success, parse for the three commit SHAs (rename / inject / ADR) and present them. On failure, present the raw error output and offer "Retry from Step 1? [y/n]".
  - [ ] 8.6 On success, present the path to `artifact-rename-map.md` and remind the operator to commit it (the CLI commits it automatically as part of the rename commit, so this is informational). Also clean up the temp resolution file (or note it for cleanup).

- [ ] **Task 9: Workflow.md orchestration** (AC: #9)
  - [ ] 9.1 Write `workflow.md` per the **workflow.md Template** in Dev Notes.
  - [ ] 9.2 The workflow.md must have: frontmatter (`main_config: '{project-root}/_bmad/bmm/config.yaml'` — no `outputFile` since this skill produces no artifact), goal/role section, WORKFLOW ARCHITECTURE section (copy from `bmad-create-prd/workflow.md` and adapt), INITIALIZATION SEQUENCE section with config loading, and a routing instruction "Read fully and follow `./steps/step-01-scope.md` to begin".
  - [ ] 9.3 Document the no-template decision (Task 5.4) explicitly in workflow.md so future maintainers understand why there's no `templates/` directory.

- [ ] **Task 10: Manifest registration** (AC: #10)
  - [ ] 10.1 Open `_bmad/_config/skill-manifest.csv` and inspect the existing rows for column order and quoting convention.
  - [ ] 10.2 Add the new row at the end of the file:
    ```csv
    "bmad-migrate-artifacts","bmad-migrate-artifacts","Migrate artifact governance metadata to conform to taxonomy. Use when the user says ""run artifact migration"" or ""migrate artifacts""","bmm","_bmad/bmm/4-implementation/bmad-migrate-artifacts/SKILL.md","true"
    ```
  - [ ] 10.3 Verify the row parses cleanly and has 6 columns.

- [ ] **Task 11: Verification** (AC: #11, #15)
  - [ ] 11.1 Verify the source files exist at `_bmad/bmm/4-implementation/bmad-migrate-artifacts/` (Story 6.6 will handle the actual install/refresh wiring).
  - [ ] 11.2 Run `npm run check` and confirm all 5 stages pass.
  - [ ] 11.3 Manually invoke the new skill in a fresh Claude Code session and walk through one full end-to-end flow on a test project (or at least the dry-run portion against the current repo). Confirm: (a) the conversational UX is materially better than running the CLI directly, (b) operator overrides made in Step 3 are honored at execute time (verify with a deliberate override on a test ambiguous file).

## Dev Notes

### Context

Story 6.4 builds the **conversational skill layer** on top of the migration engine. The engine itself (Stories 1.x–3.x and 6.2) is mature and works correctly, but it presents as a raw CLI that dumps a wall of text. Operators consistently get stuck during the ambiguous-file resolution phase. This story replaces the CLI experience with a guided BMAD skill conversation that mirrors how every other Convoke workflow feels.

**Story 6.2 already added the suggestion layer** (`Suggested:` lines, `REVIEW SUGGESTION:` labels, `Suggested rename:` for collisions). Story 6.4 consumes those signals from the CLI output to drive the conversation — without them, the resolution phase would be useless.

### Critical Architectural Decisions

**Decision 1: Skill wraps the CLI, not the engine.**
The skill shells out to `node scripts/migrate-artifacts.js` rather than calling `generateManifest()` / `executeRenames()` / etc. directly. Why:
- The CLI already handles taxonomy bootstrap, config loading, error rollback, ADR generation, and the three-commit sequence
- Re-invoking the engine functions from the skill would require duplicating all that orchestration
- The skill stays as pure markdown — no JS helpers needed
- If the engine API ever changes, the CLI absorbs the change and the skill stays stable

**Decision 2: No output artifact, no template.**
Unlike `bmad-create-prd` (which builds a PRD file across steps), this skill mutates the repo directly via git. There's nothing to "build up" across steps — the resolutions are held in working memory and consumed in Step 4. So no `templates/` directory and no `outputFile:` frontmatter field. Document this in workflow.md so future maintainers don't add a template "to match the pattern".

**Decision 3: Working memory for state, not frontmatter.**
The standard BMAD pattern persists `stepsCompleted` to an output file's frontmatter for resumability. This skill has no output file, so resumability isn't supported in v1. If the workflow is interrupted between Step 3 and Step 4, the operator loses their resolutions and must restart. This is acceptable for v1 because the dry-run is fast (< 10s) and the resolution loop is the only manual phase. Future enhancement (deferred): persist resolutions to a temporary file in `_bmad-output/.migration-state.json` so a partial run can be resumed.

**Decision 4: Add `--resolution-file` to the CLI (extended scope).**
The original v1 plan was to use `--force` and accept that operator overrides would be silently dropped. After review, this turns Step 3 into UX theatre: the agent asks the operator to make decisions and then ignores them. **This story's extended scope adds a `--resolution-file <path>` flag** to `scripts/migrate-artifacts.js` so the skill can pass operator decisions as a JSON file.

The integration is small because `resolveAmbiguous()` in `artifact-utils.js` already accepts `options.promptFn` for dependency injection. The new option `options.resolutionMap` overrides the prompt entirely. Two existing guards in `resolveAmbiguous()` (auto-skip when no candidates, auto-skip when `--force`) need to be loosened so a resolution-map entry takes precedence over both. See Tasks 4 + 5 for the implementation plan.

### Resolution Map Format

The new `--resolution-file` flag accepts a JSON file with this shape:

```json
{
  "schemaVersion": 1,
  "resolutions": {
    "planning-artifacts/some-file.md": {
      "action": "rename",
      "initiative": "convoke"
    },
    "vortex-artifacts/persona-foo.md": {
      "action": "rename",
      "initiative": "forge"
    },
    "planning-artifacts/skip-this.md": {
      "action": "skip"
    }
  }
}
```

**Field semantics:**
- `schemaVersion: 1` — required, lets us evolve the format later
- `resolutions` — object keyed by `oldPath` (matches `entry.oldPath` in the manifest, format `dir/filename.md`)
- Each value has:
  - `action: "rename" | "skip"` — required
  - `initiative: string` — required when `action === "rename"`, must be a valid initiative ID in the taxonomy (validate at load time)

**Lookup rule in `resolveAmbiguous()`:**
1. For each AMBIGUOUS entry, check if `resolutionMap[entry.oldPath]` exists
2. If yes and `action === "skip"`: mark entry as SKIP (regardless of `--force` or candidate availability)
3. If yes and `action === "rename"`: validate `initiative` is in taxonomy, set entry to RENAME with `source: 'operator'`, regenerate `newPath` via `generateNewFilename()`
4. If no entry in map: fall through to existing logic (interactive prompt OR auto-skip if `--force`)

**Validation at load time:**
- File must exist and be valid JSON → otherwise clear error: `"Resolution file not found: {path}"` or `"Invalid JSON in resolution file: {message}"`
- `schemaVersion` must equal `1` → otherwise: `"Unsupported schemaVersion {N} (expected 1)"`
- Each `action` must be `"rename"` or `"skip"` → otherwise: `"Invalid action '{X}' for {oldPath}"`
- Each `initiative` (when `action === "rename"`) must be in `taxonomy.initiatives.platform ∪ user` → otherwise: `"Unknown initiative '{X}' for {oldPath}"`

Validation errors should fail loud, not silently degrade. The skill in Step 4 builds this file before invoking the CLI, so any invalidity is the skill's bug, not the operator's typo.

### CLI Integration Details

The CLI's relevant flags:
- `node scripts/migrate-artifacts.js` — dry-run, default scope
- `node scripts/migrate-artifacts.js --include planning-artifacts,vortex-artifacts` — dry-run, custom scope
- `node scripts/migrate-artifacts.js --apply --force --include ...` — non-interactive apply
- `node scripts/migrate-artifacts.js --verbose` — adds cross-references to ambiguous entries

The CLI's relevant output patterns the skill must parse (from `scripts/lib/artifact-utils.js` `formatManifest()`):
- `[SKIP] {path} -- already governed`
- `[INJECT] {path} -- frontmatter needed`
- `{old} -> {new}` followed by `  Initiative: {init} (...)` and `  Type: {type} (...)`
- `[!] {old} -> ??? (ambiguous -- ...)` followed by context lines and either `Suggested:` + `REVIEW SUGGESTION:` or `ACTION REQUIRED:`
- `[!] COLLISION: same target as {other}` (under a RENAME entry)
- `Suggested rename: {path}` (under a COLLISION line)
- `--- Manifest Summary ---` with totals on the next line

### SKILL.md Template

Create `_bmad/bmm/4-implementation/bmad-migrate-artifacts/SKILL.md` with this exact content:

```markdown
---
name: bmad-migrate-artifacts
description: Migrate artifact governance metadata to conform to taxonomy. Use when the user says "run artifact migration" or "migrate artifacts".
---

Follow the instructions in ./workflow.md.
```

### workflow.md Template

Use `_bmad/bmm/3-solutioning/bmad-create-epics-and-stories/workflow.md` as the structural reference (4 linear steps, no continuation pattern). Copy the WORKFLOW ARCHITECTURE and INITIALIZATION SEQUENCE sections verbatim, then customize the goal/role and the routing instruction at the bottom.

The frontmatter should be minimal (no `outputFile:` since this skill produces no artifact):

```yaml
---
main_config: '{project-root}/_bmad/bmm/config.yaml'
---
```

### Step File Anatomy Reference

Each step file follows the structure documented in **anatomy report** (see Task 2.1). Reference any existing step file like `_bmad/bmm/3-solutioning/bmad-create-epics-and-stories/steps/step-01-validate-prerequisites.md` for the exact format.

Key elements every step file MUST have:
- H1 title: `# Step N: {Title}`
- Progress line: `**Progress: Step N of 4** - Next: {Next Title}`
- `## STEP GOAL:` section
- `## MANDATORY EXECUTION RULES (READ FIRST):` section with universal rules + step-specific rules
- `## EXECUTION PROTOCOLS:` section
- `## CONTEXT BOUNDARIES:` section
- `## Sequence of Instructions (Do not deviate, skip, or optimize)` section with numbered subsections
- HALT instructions at every operator decision point
- Routing instruction at the end: "When done, read fully and follow `./step-NN-next.md`"

### Files to Touch

| File | Action | Purpose |
|------|--------|---------|
| [scripts/lib/artifact-utils.js](scripts/lib/artifact-utils.js) | Edit | Extend `resolveAmbiguous()` with `resolutionMap` option; add `loadResolutionMap()` helper; export it |
| [scripts/migrate-artifacts.js](scripts/migrate-artifacts.js) | Edit | Add `--resolution-file` flag parsing; load and validate the file in `main()`; pass to `resolveAmbiguous()` |
| [tests/lib/manifest.test.js](tests/lib/manifest.test.js) | Edit | Add tests for `resolveAmbiguous` resolution-map behavior + `loadResolutionMap` validation |
| [tests/lib/migrate-artifacts.test.js](tests/lib/migrate-artifacts.test.js) | Edit | Add `--resolution-file` parse test |
| `_bmad/bmm/4-implementation/bmad-migrate-artifacts/SKILL.md` | Create | Skill entry point |
| `_bmad/bmm/4-implementation/bmad-migrate-artifacts/workflow.md` | Create | Workflow orchestration |
| `_bmad/bmm/4-implementation/bmad-migrate-artifacts/steps/step-01-scope.md` | Create | Scope selection |
| `_bmad/bmm/4-implementation/bmad-migrate-artifacts/steps/step-02-dryrun.md` | Create | Dry-run review |
| `_bmad/bmm/4-implementation/bmad-migrate-artifacts/steps/step-03-resolve.md` | Create | Interactive resolution |
| `_bmad/bmm/4-implementation/bmad-migrate-artifacts/steps/step-04-execute.md` | Create | Confirm & execute |
| [_bmad/_config/skill-manifest.csv](_bmad/_config/skill-manifest.csv) | Edit (append row) | Register the skill |

**Do NOT modify:**
- The 5-step inference cascade in `inferInitiative()` / `inferArtifactType()` — engine logic untouched
- The four governance states or their detection logic
- `executeRenames()`, `executeInjections()`, ADR generation — execution pipeline untouched
- `refresh-installation.js` or `validator.js` — Story 6.6 owns those changes

### Architecture Compliance

- ✅ No hardcoded version strings
- ✅ No `process.cwd()` — new helpers accept `projectRoot` (or read it via `findProjectRoot()`)
- ✅ Append-only on `resolveAmbiguous()` — new option, existing behavior preserved when option is absent
- ✅ `_bmad/` paths preserved
- ✅ Test debt covered: new CLI surface is fully unit-tested per Task 3
- ✅ Engine inference cascade unchanged — only the resolution layer is extended
- ✅ Follows the existing 4-step linear pattern from `bmad-create-epics-and-stories`

### Previous Story Intelligence

- **Story 6.1 (Wire Loom Master)** taught us: bme agent skills follow a different pattern (`<agent-activation>` block instead of workflow steps). This story uses the BMM workflow skill pattern (steps), not the bme agent pattern.
- **Story 6.2 (Migration Inference Improvements)** is the dependency this story consumes. The CLI now produces `Suggested:`, `REVIEW SUGGESTION:`, and `Suggested rename:` lines that this skill's Step 2 parser MUST recognize. If those lines don't appear, the skill falls back to treating everything as raw `ACTION REQUIRED`.
- **Story 6.3 (Portfolio Attribution Improvements)** is independent of this story — they touch zero overlapping files.

### Testing Standards

This story has TWO test surfaces:

1. **CLI / engine extensions** (Tasks 1–3) — fully unit-tested in Jest lib tests:
   - Resolution-map honoring in `resolveAmbiguous`
   - `loadResolutionMap` validation paths
   - `--resolution-file` flag parsing in `parseArgs`
   - All error cases produce clear messages, not stack traces

2. **Skill workflow** (Tasks 4–11) — markdown only, no unit tests:
   - Verification is via `npm run check` (no regression) and manual invocation
   - The skill's parser logic in Step 2 is markdown instructions, not executable code

`npm run check` MUST pass all 5 stages. New tests follow existing patterns in `tests/lib/manifest.test.js` and `tests/lib/migrate-artifacts.test.js`.

### Risk Notes

1. **CLI output format drift** — if Story 6.2's output format changes, the skill's Step 2 parser breaks silently. Mitigation: the parser uses simple substring matching, not regex, so the failure mode is "all entries treated as RENAME" not "crash". Document the expected format in the step file.

2. **Working memory volatility** — if the agent's context is cleared between Step 3 and Step 4 (rare but possible during long sessions), the resolutions are lost. Mitigation: Step 4 explicitly re-summarizes the resolutions from Step 3 before asking for confirmation, so the operator can spot if anything was dropped.

3. **Resolution-file format drift** — if a future story changes the JSON shape, old skill versions break. Mitigation: `schemaVersion: 1` is part of the format from day one; the loader rejects unknown versions with a clear error. Future versions can support multiple `schemaVersion` values during transition.

4. **Slow batch resolution** — for projects with 100+ ambiguous files, walking each one conversationally is tedious. Mitigation: the `all <initiative>` shortcut in Step 3 makes batch resolution one prompt instead of N. Document the affordance prominently.

5. **Temp resolution file leakage** — if Step 4 fails after writing the temp file but before cleanup, the file lingers in `_bmad-output/`. Mitigation: use a recognizable prefix `.migration-resolutions-` and add it to `.gitignore`. Or write to `os.tmpdir()` instead of the project tree.

### References

- [scripts/migrate-artifacts.js](scripts/migrate-artifacts.js) — The CLI this skill wraps
- [scripts/lib/artifact-utils.js](scripts/lib/artifact-utils.js) — `formatManifest()` defines the output the parser must recognize
- [_bmad/bmm/3-solutioning/bmad-create-epics-and-stories/](_bmad/bmm/3-solutioning/bmad-create-epics-and-stories/) — Reference 4-step linear workflow skill
- [_bmad/bmm/2-plan-workflows/bmad-create-prd/](_bmad/bmm/2-plan-workflows/bmad-create-prd/) — Reference workflow skill with continuation pattern (we don't need continuation, but the WORKFLOW ARCHITECTURE section is the canonical template)
- [.claude/skills/bmad-portfolio-status/workflow.md](.claude/skills/bmad-portfolio-status/workflow.md) — The thin wrapper Story 6.5 will replace
- [_bmad/_config/skill-manifest.csv](_bmad/_config/skill-manifest.csv) — Registration target
- [ag-6-2-migration-inference-improvements.md](_bmad-output/implementation-artifacts/ag-6-2-migration-inference-improvements.md) — The dependency that produces the suggestion lines this skill parses
- Story 6.6 (`ag-6-6-skill-registration-wiring`) will handle `refresh-installation.js` and `validator.js` updates — out of scope here

## Dev Agent Record

### Agent Model Used

(to be filled in by dev agent)

### Debug Log References

### Completion Notes List

### File List
