# Story 7.2: Doctor Skill-Wrapper Validation

Status: review

## Story

As a Convoke operator running `convoke-doctor` after an install,
I want the doctor to verify every declared workflow has its skill wrapper installed at `.claude/skills/{name}/SKILL.md`,
So that partial installs (e.g., source tree copied successfully but `.claude/skills/` write failed) cannot be silently reported as healthy — closing I31 (rank #12 in backlog, RICE score 3.2).

## Acceptance Criteria

1. **Given** `convoke-doctor` discovers modules via the existing `discoverModules()` scan of `_bmad/bme/*/config.yaml` **When** the per-module check loop at [scripts/convoke-doctor.js:55-67](scripts/convoke-doctor.js#L55-L67) runs **Then** for each module whose `config.workflows` is a non-empty array, the doctor calls a NEW `checkModuleSkillWrappers(mod, projectRoot)` function in addition to the existing `checkModuleWorkflows(mod)`.

2. **Given** `checkModuleSkillWrappers` is invoked **When** it walks `mod.config.workflows` **Then** for each workflow it derives the canonical wrapper directory name from `_bmad/_config/skill-manifest.csv` (the authoritative source — column 1 is the wrapper directory name, column 5 is the source path) by matching the source path on `_bmad/bme/{mod.name}/workflows/{workflow.name}/SKILL.md` (or the equivalent path pattern the manifest uses for that module). It then verifies `{projectRoot}/.claude/skills/{wrapperName}/SKILL.md` exists.

3. **(REVISED in Round 1 code review — manifest-as-opt-in semantics.)** **Given** the skill-manifest lookup approach from AC #2 fails (no manifest entry found for a declared workflow) **When** `checkModuleSkillWrappers` cannot derive the wrapper name **Then** the workflow is silently skipped (NOT checked, NOT fallback-validated). If a module has zero in-manifest workflows, `checkModuleSkillWrappers` returns `null` and the orchestration loop omits the check from the results entirely. **Rationale (added in review):** the original AC #3 wording said "fall back to verbatim names with warning." Smoke testing in Task 6 immediately revealed this would false-fail the doctor on every healthy install — Vortex/Gyre/team-factory all declare workflows in their `config.yaml` that are NOT standalone skills (they're agent-menu items, menu-patch workflows, or non-wrapper workflows). The corrected semantics treat the manifest as the OPT-IN marker for "this workflow is a standalone skill that needs a wrapper at `.claude/skills/{canonicalId}/SKILL.md`." Workflows not in the manifest don't have wrappers and never will — they should be silently skipped, not fallback-failed. The Acceptance Auditor reviewed and ACCEPTED this deviation in the Round 1 code review.

4. **Given** a workflow has a corresponding `.claude/skills/{wrapperName}/SKILL.md` **When** the check completes **Then** the result is `{ name: '{mod.name} skill wrappers', passed: true, info: '{N} workflows have skill wrappers' }`.

5. **Given** a workflow's wrapper file is missing **When** the check completes **Then** the result is `{ name: '{mod.name} skill wrappers', passed: false, error: 'Missing skill wrapper for {workflow.name}: .claude/skills/{wrapperName}/SKILL.md', fix: 'Run convoke-update to regenerate skill wrappers' }`. Multiple missing wrappers are aggregated into a single failure result with all missing names joined by `; ` (mirrors `validateEnhanceModule`'s aggregation pattern from Story 6.6).

6. **Given** a module config has an empty or missing `workflows` array **When** the per-module check loop runs **Then** `checkModuleSkillWrappers` is NOT called for that module (gated by the existing `if (Array.isArray(mod.config.workflows) && mod.config.workflows.length > 0)` condition that already wraps `checkModuleWorkflows`).

7. **Given** a module is agent-only (no workflows) like a hypothetical future `_foo` **When** the per-module check loop runs **Then** `checkModuleSkillWrappers` is NOT called for it (per AC #6) and the existing `checkModuleAgents` continues to handle agent wrapper validation. Story 7.2 does NOT introduce a separate "agent skill wrapper" check — that's already covered by `checkModuleAgents` validating the agent file existence on disk, which the existing `refresh-installation.js` agent skill generation depends on.

8. **Given** an `_artifacts` install where `_bmad/bme/_artifacts/` is present and complete but `.claude/skills/bmad-migrate-artifacts/SKILL.md` was deleted manually **When** `convoke-doctor` runs **Then** the doctor reports: `✗ _artifacts skill wrappers — Missing skill wrapper for bmad-migrate-artifacts: .claude/skills/bmad-migrate-artifacts/SKILL.md` and the overall doctor exit code is non-zero.

9. **Given** an `_enhance` install where `_bmad/bme/_enhance/` is present and complete but `.claude/skills/bmad-enhance-initiatives-backlog/SKILL.md` was deleted manually **When** `convoke-doctor` runs **Then** the doctor reports: `✗ _enhance skill wrappers — Missing skill wrapper for initiatives-backlog: .claude/skills/bmad-enhance-initiatives-backlog/SKILL.md` (note the wrapper-name prefix difference from AC #8 — the doctor must look up the correct wrapper name from the manifest for each module).

10. **Given** the existing `checkModuleConfig`, `checkModuleAgents`, and `checkModuleWorkflows` functions in `convoke-doctor.js` **When** Story 7.2 is complete **Then** none of them are modified (NFR1: append-only on `convoke-doctor.js` — only ADD `checkModuleSkillWrappers` and ADD one line in the per-module check loop). `git diff scripts/convoke-doctor.js` should show ONLY additions, no deletions in the existing per-module check functions.

11. **Given** `validator.js` validation logic for Enhance and Artifacts modules already exists from Stories 6.5/6.6 **When** Story 7.2 adds `checkModuleSkillWrappers` to convoke-doctor.js **Then** Story 7.2 does NOT touch `validator.js` (NFR1). The doctor and the validator can have parallel implementations of skill-wrapper checking — Story 7.3's audit may identify whether to consolidate them later, but Story 7.2 stays scoped.

12. **Given** all 5 stages of `npm run check` (lint, unit, integration, jest lib, coverage) **When** Story 7.2 is marked for review **Then** lint + unit + integration stages PASS. **Note:** the Jest lib + Coverage stages have a pre-existing infrastructure issue documented in Story 7.1 (`npx jest tests/lib/` fails on files migrated to node:test); this is OUT of scope for Story 7.2 and remains an Epic 7 follow-up.

13. **Given** the new `checkModuleSkillWrappers` function **When** the test suite runs **Then** new tests cover: (a) healthy install — all wrappers present, function returns `passed: true`, (b) missing wrapper for an Artifacts workflow (`bmad-migrate-artifacts`) — function returns `passed: false` with the workflow name in the error, (c) missing wrapper for an Enhance workflow (`bmad-enhance-initiatives-backlog`) — different naming convention, manifest lookup correctly resolves the prefix, (d) module with empty workflows array — function not called (gated test against the orchestration loop), (e) multiple missing wrappers in same module — failures aggregated into a single result with `; `-joined error message, (f) skill-manifest fallback path — workflow declared in config.yaml but not in skill-manifest.csv triggers the verbatim-name fallback with the warning info field.

14. **Given** the namespace audit rule from Epic 6 retro Action Item #2 **When** Story 7.2 creates new files **Then** any new test file lives under `tests/unit/` (the project's standard test directory, NOT under any `_bmad/{module}/` namespace). No new files under `_bmad/{module}/` or `.claude/skills/`. **Namespace decision:** ✅ verified — Story 7.2 only modifies `scripts/convoke-doctor.js` and adds tests under `tests/unit/`.

15. **Given** the dev runs `node scripts/convoke-doctor.js` against the dev repo **AFTER** running `convoke-update` (or manually regenerating any missing wrappers) **When** the doctor completes **Then** the doctor reports green for `_artifacts skill wrappers`, `_enhance skill wrappers`, and any other workflow-bearing module. **Pre-existing dev-repo wrapper drift NOTE:** as of 2026-04-09, `.claude/skills/bmad-migrate-artifacts/SKILL.md` is missing from the dev repo (verified — the directory does not exist). Story 7.2 is built specifically to detect this kind of drift, so the doctor WILL fail until either (a) `convoke-update` is run to regenerate the wrapper, OR (b) the wrapper is manually restored. Task 6 includes a sub-task to handle this. The pre-existing version-consistency drift on `_enhance: 1.0.0`, `_gyre: 1.0.0`, `_artifacts: 1.0.0`, `_team-factory: 1.0.0` is OUT of scope and may continue to fail.

## Tasks / Subtasks

- [ ] **Task 0: Manifest schema discovery + add missing Enhance row** (AC: #2) — verify the skill-manifest.csv format AND fix a pre-existing manifest gap BEFORE writing the lookup helper
  - [ ] 0.1 Open [_bmad/_config/skill-manifest.csv](_bmad/_config/skill-manifest.csv).
  - [ ] 0.2 Read the header row to confirm the column order: `canonicalId,name,description,module,path,install_to_bmad,tier,intent,dependencies` (verified 2026-04-09).
  - [ ] 0.3 For each Convoke-authored bme workflow row, verify the `path` column is `_bmad/bme/{module}/workflows/{workflow.name}/SKILL.md`. Capture the format string in Dev Notes for use by Task 2.
  - [ ] 0.4 Confirm the wrapper directory name = `canonicalId` column (column 1). For `bmad-migrate-artifacts` and `bmad-portfolio-status`, the canonicalId IS the workflow name (verbatim). For Enhance, the canonicalId would be `bmad-enhance-${workflowName}` (prefixed).
  - [ ] 0.5 **CRITICAL pre-Story-7.2 defect: `bmad-enhance-initiatives-backlog` is currently NOT in skill-manifest.csv.** Verified via `grep enhance _bmad/_config/skill-manifest.csv` returns zero matches. Without this row, the manifest-based lookup in Task 2 would fall back to the verbatim name (`initiatives-backlog`) and fail to find `.claude/skills/bmad-enhance-initiatives-backlog/SKILL.md`, causing the doctor to false-fail Enhance on every healthy install. **Fix: append the missing row to skill-manifest.csv as part of Task 0:**
    ```csv
    bmad-enhance-initiatives-backlog,bmad-enhance-initiatives-backlog,"Manage RICE initiatives backlog — triage review findings, rescore existing items, or bootstrap new backlogs.",bme,_bmad/bme/_enhance/workflows/initiatives-backlog/SKILL.md,true,,,
    ```
    The empty trailing fields are `tier`, `intent`, `dependencies` (matching the header schema). Place the row alphabetically near other `bmad-enhance-*` entries if any exist, otherwise at the end of the bme section.
  - [ ] 0.6 After adding the row, verify: `grep enhance _bmad/_config/skill-manifest.csv` should return exactly the new row. The expected wrapper directory `bmad-enhance-initiatives-backlog` exists at `.claude/skills/bmad-enhance-initiatives-backlog/SKILL.md` (verified 2026-04-09).
  - [ ] 0.7 **GATE:** Do not proceed to Task 1 until the manifest row is added and verified. Without it, the entire architecture of Story 7.2 breaks for the Enhance module.

- [ ] **Task 1: Add `loadSkillManifest()` helper** (AC: #2)
  - [ ] 1.1 Open [scripts/convoke-doctor.js](scripts/convoke-doctor.js).
  - [ ] 1.2 Add a top-level function `loadSkillManifest(projectRoot)` that reads `{projectRoot}/_bmad/_config/skill-manifest.csv`, parses it as CSV, and returns a `Map<sourcePath, canonicalId>` keyed by the `path` column with values from the `canonicalId` column. **Use the existing CSV parser at [_bmad/bme/_team-factory/lib/utils/csv-utils.js](_bmad/bme/_team-factory/lib/utils/csv-utils.js) which exports `parseCsvRow`** — it handles quoted fields with embedded commas (skill-manifest descriptions contain commas inside double-quoted strings). Import it via: `const { parseCsvRow } = require('../_bmad/bme/_team-factory/lib/utils/csv-utils');` (verify the relative path from convoke-doctor.js's location). On any error (missing file, parse failure), return an empty `Map` and emit a warning via `console.warn` — do not throw, do not fail the doctor.
  - [ ] 1.3 The map lookup key MUST be the source path, NOT the canonicalId, because `checkModuleSkillWrappers` knows the source path (from the workflow declaration in config.yaml) and needs to look up the wrapper directory name (canonicalId).

- [ ] **Task 2: Add `checkModuleSkillWrappers(mod, projectRoot, manifestMap)` function** (AC: #1, #2, #3, #4, #5)
  - [ ] 2.1 Add the new function to convoke-doctor.js, after the existing `checkModuleWorkflows` function (around line 252). The function signature accepts `(mod, projectRoot, manifestMap)` where `manifestMap` is the Map from Task 1.
  - [ ] 2.2 Initialize a `failures = []` array (mirrors the `validateEnhanceModule` aggregation pattern).
  - [ ] 2.3 For each workflow in `mod.config.workflows`:
    - Compute the source path: `_bmad/bme/{mod.name}/workflows/{workflowName}/SKILL.md` (note: workflows can be either string or object — handle both: `const wfName = typeof w === 'object' ? w.name : w;`)
    - Look up the canonical wrapper directory name in `manifestMap` by source path
    - **If the manifest has an entry:** use the canonicalId as the wrapper directory name (e.g., `bmad-enhance-initiatives-backlog`)
    - **If the manifest does NOT have an entry:** fall back to the workflow name verbatim (the Artifacts convention) and remember to include the warning in the result's `info` field
    - Verify `{projectRoot}/.claude/skills/{wrapperName}/SKILL.md` exists via `fs.existsSync`
    - On miss: push `Missing skill wrapper for {workflowName}: .claude/skills/{wrapperName}/SKILL.md` into `failures`
  - [ ] 2.4 Build the result object:
    - If `failures.length === 0`: `{ name: '{mod.name} skill wrappers', passed: true, info: '{N} workflows have skill wrappers' }`
    - Otherwise: `{ name: '{mod.name} skill wrappers', passed: false, error: failures.join('; '), fix: 'Run convoke-update to regenerate skill wrappers' }`
    - If any fallback was used, append `; (fallback used for {names})` to the info field on success or to the error field on failure.
  - [ ] 2.5 Return the result.

- [ ] **Task 3: Wire `checkModuleSkillWrappers` into the per-module check loop** (AC: #1, #6, #7, #10)
  - [ ] 3.1 Find the per-module check loop at [scripts/convoke-doctor.js:55-67](scripts/convoke-doctor.js#L55-L67).
  - [ ] 3.2 Before the loop, call `const manifestMap = loadSkillManifest(projectRoot);` once (the manifest is shared across all modules).
  - [ ] 3.3 Inside the loop, ADD a new check after the existing `checkModuleWorkflows` call: `if (Array.isArray(mod.config.workflows) && mod.config.workflows.length > 0) { checks.push(checkModuleSkillWrappers(mod, projectRoot, manifestMap)); }`. This MUST be a separate `if` from the existing `checkModuleWorkflows` block to keep the diff append-only — do NOT merge the two checks into one block.
  - [ ] 3.4 Verify by `git diff` that the existing `checkModuleConfig`, `checkModuleAgents`, and `checkModuleWorkflows` function bodies are NOT modified — only the orchestration loop gains 3-4 new lines and the file gains the new helper functions at the bottom.

- [ ] **Task 4: Add unit tests** (AC: #13)
  - [ ] 4.1 Create [tests/unit/convoke-doctor-skill-wrappers.test.js](tests/unit/convoke-doctor-skill-wrappers.test.js) using `node:test` runner (matches all other tests in `tests/unit/`).
  - [ ] 4.2 Test (a) — healthy install: set up a temp project with both `_artifacts` and `_enhance` modules and the corresponding `.claude/skills/{name}/SKILL.md` files. Call `checkModuleSkillWrappers` directly (export it from convoke-doctor.js if not already exported — see Task 5) and assert `passed: true` for both modules.
  - [ ] 4.3 Test (b) — missing wrapper for Artifacts: same setup as (a) but delete `.claude/skills/bmad-migrate-artifacts/SKILL.md`. Assert `passed: false` and the error message contains `bmad-migrate-artifacts`.
  - [ ] 4.4 Test (c) — missing wrapper for Enhance: same setup as (a) but delete `.claude/skills/bmad-enhance-initiatives-backlog/SKILL.md`. Assert `passed: false` and the error message contains `bmad-enhance-initiatives-backlog` (NOT `initiatives-backlog` — the manifest lookup must resolve the prefix correctly).
  - [ ] 4.5 Test (d) — module with empty workflows: set up a module config with `workflows: []`. Run the per-module check loop end-to-end via `discoverModules` + the loop logic (or extract the loop into a small helper for testability). Assert `checkModuleSkillWrappers` was NOT called.
  - [ ] 4.6 Test (e) — multiple missing wrappers in the same module: delete BOTH `.claude/skills/bmad-migrate-artifacts/SKILL.md` AND `.claude/skills/bmad-portfolio-status/SKILL.md`. Assert `passed: false` and the error message contains BOTH workflow names joined by `; `.
  - [ ] 4.7 Test (f) — manifest fallback: set up a workflow declared in `config.yaml` but NOT in `skill-manifest.csv`. Assert the function falls back to verbatim name AND the result includes the warning text in the `info` field.
  - [ ] 4.8 Test (g) — graceful degradation when manifest CSV is missing: delete `_bmad/_config/skill-manifest.csv` from the temp project. Assert `loadSkillManifest` returns an empty Map AND `checkModuleSkillWrappers` falls through to verbatim-name lookup for every workflow (with appropriate fallback warnings).

- [ ] **Task 5: Extend the existing `module.exports` from convoke-doctor.js** (AC: #13)
  - [ ] 5.1 The file already has `module.exports = { checkTaxonomy };` at line 501 (verified 2026-04-09), AFTER the `if (require.main === module)` block at line 494 — the CLI behavior is already preserved.
  - [ ] 5.2 **EXTEND** the existing exports block by adding the new functions: `module.exports = { checkTaxonomy, loadSkillManifest, checkModuleSkillWrappers };`. Do NOT create a second exports block.
  - [ ] 5.3 Verify the CLI still works: `node scripts/convoke-doctor.js` should produce the same output as before plus the new `_artifacts skill wrappers` and `_enhance skill wrappers` checks.

- [ ] **Task 6: Manual end-to-end smoke test** (AC: #15)
  - [ ] 6.0 **Fix dev-repo wrapper drift first.** As of 2026-04-09 the dev repo is missing `.claude/skills/bmad-migrate-artifacts/SKILL.md` (verified — directory does not exist). Run `node scripts/update/convoke-update.js` (or invoke `refreshInstallation` against the dev repo) to regenerate the missing wrapper. This is dogfooding Story 7.2's exact use case — the wrapper drift is the bug Story 7.2 is built to detect. After `convoke-update`, verify `ls .claude/skills/bmad-migrate-artifacts/` shows `SKILL.md`.
  - [ ] 6.1 Run `node scripts/convoke-doctor.js` against the dev repo. Confirm it now reports:
    - `✓ _artifacts skill wrappers — 2 workflows have skill wrappers`
    - `✓ _enhance skill wrappers — 1 workflows have skill wrappers`
    - All other module checks unchanged
    - The pre-existing version-consistency drift errors still present (out of scope per AC #15)
  - [ ] 6.2 Manually delete `.claude/skills/bmad-migrate-artifacts/SKILL.md` (back it up first), re-run the doctor, confirm it reports the missing wrapper. Restore the file.
  - [ ] 6.3 Manually delete `.claude/skills/bmad-enhance-initiatives-backlog/SKILL.md`, re-run, confirm. Restore.

- [ ] **Task 7: Verification gauntlet** (AC: #10, #11, #12, #15)
  - [ ] 7.1 Run `npm test` and confirm all unit tests pass (target: 938 + new test count, all green).
  - [ ] 7.2 Run `git diff scripts/update/lib/validator.js` and confirm the diff is empty (NFR1 + AC #11).
  - [ ] 7.3 Run `git diff scripts/convoke-doctor.js` and confirm:
    - The existing `checkModuleConfig`, `checkModuleAgents`, `checkModuleWorkflows` function bodies are NOT modified (only the orchestration loop adds new lines, and new helper functions are appended)
    - The diff is purely additive (no `-` lines except in the orchestration loop where new `if` blocks are inserted)
  - [ ] 7.4 Run `node scripts/convoke-doctor.js` and confirm green output for the new checks.
  - [ ] 7.5 If any of `npm run check` stages 4-5 (Jest lib, Coverage) fail, verify the failures are the SAME as Story 7.1's pre-existing infra issue (check Story 7.1's Completion Notes). If so, document in Story 7.2 Completion Notes and proceed. If different, fix before continuing.

- [ ] **Task 8: Update story file** (AC: end-of-story)
  - [ ] 8.1 Update Dev Agent Record → Agent Model Used.
  - [ ] 8.2 Update Dev Agent Record → Completion Notes List with: the manifest-as-authoritative-source decision, any deviations from the spec, and the verification results.
  - [ ] 8.3 Update Dev Agent Record → File List with every file modified/created.
  - [ ] 8.4 Add Change Log entry citing Epic 7 Story 7.2 and the closed backlog item I31.
  - [ ] 8.5 Set Status to `review`.

## Dev Notes

### Context

Story 7.2 closes I31 (rank #12 in the 73-item backlog, RICE 3.2). It's the **2nd of 4 stories in Epic 7** (cross-cutting platform debt) and follows directly from Story 7.1's lesson: when the install pipeline has multiple write paths to the same destination (refresh-installation.js + config-merger.js + config-appender.js for YAML; refresh-installation.js for skill wrappers), the doctor needs to check the END STATE on disk, not the source files. Story 7.1 caught the bypass via the parallel review layers; Story 7.2 makes the doctor catch similar bypasses in the future automatically.

**The bug Story 7.2 prevents:** A partial install where the source `_bmad/bme/{module}/workflows/{name}/` tree is copied successfully but `.claude/skills/{wrapperName}/SKILL.md` write fails (e.g., EACCES, transient I/O error, interrupted process). Today, `convoke-doctor` checks the source tree but NOT the skill wrappers, so the doctor reports green even though operators see no slash command for the workflow. Story 7.2 closes this gap.

### Critical Architectural Constraints

**Constraint 1: NFR1 — append-only on convoke-doctor.js.**
The existing `checkModuleConfig`, `checkModuleAgents`, and `checkModuleWorkflows` function bodies must NOT be modified. Only ADD a new function (`checkModuleSkillWrappers`), ADD a new helper (`loadSkillManifest`), and ADD a new call in the per-module check loop. AC #10 explicit. Verify via `git diff` per Task 7.3.

**Constraint 2: NFR1 — validator.js must NOT be touched.**
Story 7.2's primary file is convoke-doctor.js, NOT validator.js. The validator already has Enhance and Artifacts skill-wrapper validation (added by Stories 6.5/6.6). Story 7.2 adds a parallel check in the doctor — both layers are intentional defense-in-depth. Story 7.3's audit may consolidate them later. AC #11 explicit.

**Constraint 3: skill-manifest.csv is the authoritative source for wrapper directory names — AFTER Task 0 fixes a pre-existing gap.**
The Story 7.2 spec offered three options for resolving the wrapper convention (per-module `wrapper_prefix` field, hardcoded lookup in convoke-doctor, or manifest lookup). **The manifest is the cleanest answer because:**
- It's already the source of truth for skill discovery (used by Claude Code to find skills)
- It avoids hardcoding `_enhance` vs `_artifacts` in the doctor
- It avoids requiring a schema change to every module's `config.yaml`
- The manifest entry IS the source of truth for the canonical wrapper directory name (column 1)

**Pre-Story-7.2 manifest defect (verified 2026-04-09):** `bmad-enhance-initiatives-backlog` is currently NOT in skill-manifest.csv. The wrapper exists at `.claude/skills/bmad-enhance-initiatives-backlog/SKILL.md` but there's no manifest row pointing at its source. **Without Task 0.5's fix, the manifest-based lookup would fall back to the verbatim name `initiatives-backlog` for Enhance and false-fail the doctor on every healthy install.** Task 0.5 adds the missing row as a prerequisite GATE before any code is touched. After Task 0, the manifest is truly authoritative for both Enhance and Artifacts.

The fallback to verbatim name (AC #3) handles the case where a FUTURE module hasn't been added to the manifest yet — it's a forward-compat guard, not a workaround for the current Enhance gap.

**Constraint 4: Workflow declarations can be strings OR objects.**
Look at [convoke-doctor.js:236-239](scripts/convoke-doctor.js#L236-L239):
```js
const missing = workflowNames.filter(w => {
  const name = typeof w === 'object' ? w.name : w;
  return !fs.existsSync(path.join(workflowsDir, name, 'workflow.md'));
});
```
The existing `checkModuleWorkflows` already handles both shapes. `checkModuleSkillWrappers` MUST handle both shapes too — see [_artifacts/config.yaml](_bmad/bme/_artifacts/config.yaml) (object form with `name`, `entry`, `standalone`) vs older modules that use bare strings.

**Constraint 5: The doctor is a CLI AND a partial test target.**
`convoke-doctor.js` already has `module.exports = { checkTaxonomy };` at line 501, AFTER the `if (require.main === module)` CLI guard at line 494 (verified 2026-04-09). The CLI behavior is already preserved by the guard. Task 5.2 EXTENDS the existing exports block to add `loadSkillManifest` and `checkModuleSkillWrappers` — do NOT create a second exports block. **Do NOT** remove or restructure the existing CLI guard — the file is BOTH a CLI entry point AND a test-importable module.

### Pattern References

| What | File | Lines | Notes |
|---|---|---|---|
| Per-module check loop (integration point) | `scripts/convoke-doctor.js` | 55-67 | The 3-line addition for Story 7.2 lands here |
| Existing `checkModuleWorkflows` (mirror its signature/return shape) | `scripts/convoke-doctor.js` | 222-251 | Story 7.2's `checkModuleSkillWrappers` follows the same pattern |
| Workflow type-juggling pattern | `scripts/convoke-doctor.js` | 236-239 | `typeof w === 'object' ? w.name : w` |
| Failure aggregation pattern | `scripts/update/lib/validator.js:482-563` | (validateArtifactsModule) | Aggregate failures into an array, join with `; ` |
| skill-manifest.csv format | `_bmad/_config/skill-manifest.csv` | header + rows | Column 1 = canonicalId, column 5 = source path |
| Story 6.6's wrapper-name verbatim convention (Artifacts) | `scripts/update/lib/refresh-installation.js:705-712` | section 6d | `bmad-migrate-artifacts`, `bmad-portfolio-status` |
| Story 6.5's wrapper-name prefix convention (Enhance) | `scripts/update/lib/refresh-installation.js:660` | section 6c | `bmad-enhance-${workflow.name}` |

### Files to Touch

| File | Action | Purpose |
|---|---|---|
| [_bmad/_config/skill-manifest.csv](_bmad/_config/skill-manifest.csv) | Edit (Task 0.5) | Add the missing `bmad-enhance-initiatives-backlog` row — pre-Story-7.2 defect that breaks the manifest-based lookup if not fixed first |
| [scripts/convoke-doctor.js](scripts/convoke-doctor.js) | Edit | Add `loadSkillManifest()` helper, add `checkModuleSkillWrappers()` function, add 3-line wiring in per-module loop, EXTEND existing `module.exports` block (line 501) with the new functions |
| [tests/unit/convoke-doctor-skill-wrappers.test.js](tests/unit/convoke-doctor-skill-wrappers.test.js) | Create | 7 tests covering the AC #13 matrix (a-g) |

**Do NOT modify:**
- [scripts/update/lib/validator.js](scripts/update/lib/validator.js) — NFR1 + AC #11 explicit
- [scripts/update/lib/refresh-installation.js](scripts/update/lib/refresh-installation.js) — Story 7.2 has no reason to touch it
- [scripts/update/lib/config-merger.js](scripts/update/lib/config-merger.js) — Story 7.1's territory, don't disturb
- The existing `checkModuleConfig`, `checkModuleAgents`, `checkModuleWorkflows` function bodies in convoke-doctor.js — only add new functions and a new orchestration call
- Any agent file or workflow under `_bmad/bme/{module}/`

### Architecture Compliance

- ✅ **Append-only on `convoke-doctor.js`** — only new functions + 3-line orchestration addition
- ✅ **`validator.js` untouched** — verified via `git diff` in Task 7.2
- ✅ **No hardcoded module names** — manifest-based lookup with verbatim-name fallback
- ✅ **Workflow shape-agnostic** — handles both string and object workflow declarations
- ✅ **CLI behavior preserved** — `module.exports` added AFTER the entry-point block
- ✅ **Failure aggregation pattern** — matches `validateArtifactsModule` from Story 6.6
- ✅ **Test coverage matrix** — 7 tests cover all 7 AC sub-cases
- ✅ **No new files under `_bmad/{module}/` or `.claude/skills/`** — namespace decision verified per Epic 6 retro Action Item #2

### Previous Story Intelligence

- **Story 7.1** established the Epic 7 review pattern: every story gets `bmad-code-review` with all 3 layers (Blind Hunter + Edge Case Hunter + Acceptance Auditor). Story 7.1 needed 3 review rounds (24 patches across the rounds) to catch a critical bypass in `migration-runner.js` and a self-heal data-loss footgun. **Story 7.2 should expect at least 1 review round.** NFR3 from Epic 7 is explicit.
- **Story 6.6** introduced the wrapper-name distinction (verbatim for Artifacts, `bmad-enhance-${name}` for Enhance) and added the contract gap that Story 6.6's review caught. The doctor in Story 7.2 must respect that distinction, which is why the manifest-based lookup is the cleanest approach.
- **Story 7.1's pre-existing CI infrastructure issue** (npx jest tests/lib/ failures) is NOT introduced by 7.2. AC #12 documents this expectation. Don't try to fix it in 7.2.
- **Story 7.1's `assertVersion` helper at `scripts/update/lib/utils.js`** is NOT used by Story 7.2 — convoke-doctor doesn't stamp versions. No import needed.
- **Story 7.1's `npm test` baseline:** 938 PASS. Story 7.2 should add 7 new tests; expected post-story count: ~945 PASS.

### Risk Notes

1. **The skill-manifest path-format discovery in Task 0 is load-bearing.** If the path format in the manifest doesn't match the format I expect (`_bmad/bme/{module}/workflows/{name}/SKILL.md`), the lookup map will return undefined for everything and the doctor will fall back to verbatim names — which breaks Enhance (which uses prefixed names). **Mitigation:** Task 0 explicitly validates the format BEFORE writing the lookup helper. If the format is unexpected, the dev MUST stop and update Task 1's lookup logic accordingly.

2. **The CSV parser may not handle quoted descriptions correctly.** skill-manifest.csv has descriptions with embedded commas inside double-quoted fields. A naive `line.split(',')` would break. Use either an existing CSV utility from the codebase (search for `csv-utils` or similar) OR a small regex-based field extractor that respects double-quote escaping. **Reference:** `tests/team-factory/lib/csv-utils.js` may already have a parser.

3. **`convoke-doctor.js` may already have a module.exports block.** Verify in Task 5.1 — if it does, just append to it. If it doesn't (CLI-only file), add one. Don't break the CLI.

4. **The fallback warning in AC #3 is important — don't swallow it silently.** If the manifest lookup misses, the dev needs to know so they can update the manifest. The `info: "no skill-manifest entry for {workflow.name}"` text is the signal.

5. **Test (g) — graceful degradation when manifest is missing — is the strongest robustness test.** Verify it actually exercises the no-manifest path. A green test here means the doctor will continue to function even if `_bmad/_config/skill-manifest.csv` is deleted or corrupt — which is important because the manifest is human-edited and could go missing.

6. **The doctor exit code matters.** If `checkModuleSkillWrappers` returns a failure, the doctor's existing `process.exit(failed.length > 0 ? 1 : 0)` at line 78 will set a non-zero exit code, which CI consumers may react to. **This is the desired behavior** (a missing wrapper SHOULD fail the doctor), but document it in Completion Notes so future operators aren't surprised.

7. **Coverage of `convoke-doctor.js` was at 88.42%** as of Story 6.6. Story 7.2 ADDS code. The new function should be ≥85% covered by Task 4's tests. If coverage drops, add more tests before marking the story for review.

### Testing Standards

- All tests live in `tests/unit/` (Node `node --test` runner). Story 7.2 follows the existing pattern.
- Use temp directories (`os.tmpdir()` via `fs.mkdtemp`) for all fixture projects — never modify the real repo from a test.
- Real `fs` calls against temp dirs are preferred over mocks (matches Story 6.6 + 7.1 patterns).
- Coverage expectation: 100% on `loadSkillManifest()` (every branch including missing-file fallback); ≥90% on `checkModuleSkillWrappers()`.
- The new test file `convoke-doctor-skill-wrappers.test.js` should follow the structure of `tests/unit/refresh-installation-artifacts.test.js` (Story 6.6's test file).

### References

- [Epic 7 spec](_bmad-output/planning-artifacts/epic-7-platform-debt.md) — Story 7.2 section, NFR1, NFR3, FR3
- [Epic 6 retrospective](_bmad-output/implementation-artifacts/ag-epic-6-retro-2026-04-08.md) — Edge Case Hunter finding that surfaced I31
- [Story 7.1 spec](_bmad-output/implementation-artifacts/ag-7-1-version-stamp-safety-yaml-comments.md) — Senior Developer Review section documents Epic 7 review pattern
- [Initiatives backlog I31 entry](_bmad-output/planning-artifacts/initiatives-backlog.md) — RICE score 3.2, rank #12
- [scripts/convoke-doctor.js](scripts/convoke-doctor.js) — primary file, integration point at lines 55-67, mirror pattern at 222-251
- [_bmad/_config/skill-manifest.csv](_bmad/_config/skill-manifest.csv) — authoritative wrapper-directory source
- [scripts/update/lib/validator.js#L482-L563](scripts/update/lib/validator.js#L482-L563) — `validateArtifactsModule` pattern to mirror for failure aggregation
- [tests/unit/refresh-installation-artifacts.test.js](tests/unit/refresh-installation-artifacts.test.js) — Story 6.6's test file structure pattern
- [scripts/update/lib/refresh-installation.js#L660](scripts/update/lib/refresh-installation.js#L660) — Enhance wrapper-name prefix convention
- [scripts/update/lib/refresh-installation.js#L705-L712](scripts/update/lib/refresh-installation.js#L705-L712) — Artifacts wrapper-name verbatim convention

### Project Structure Notes

- All file paths align with existing project structure. No new directories required.
- The new test file `tests/unit/convoke-doctor-skill-wrappers.test.js` slots into the existing `tests/unit/` convention.
- The doctor's `module.exports` addition is a structural change but does not require any directory creation.

### Namespace decision

(Per Epic 6 retrospective Action Item #2 — every story creating files under `_bmad/{module}/` or `.claude/skills/` must include this section.)

Story 7.2 creates ONE new file: `tests/unit/convoke-doctor-skill-wrappers.test.js`. This file lives under `tests/unit/` (the project's standard test directory), NOT under `_bmad/{module}/` or `.claude/skills/`. **No namespace decision required** — tests are not part of any module namespace.

The file modifications in Story 7.2 touch:
- `scripts/convoke-doctor.js` — Convoke platform code, not a bme module namespace

No upstream BMAD namespace is touched. No skill wrapper files are touched. No agent files are touched.

## Dev Agent Record

### Agent Model Used

claude-opus-4-6 (1M context)

### Debug Log References

- `node --test tests/unit/convoke-doctor-skill-wrappers.test.js` — **11/11 PASS** (covers AC #13 sub-cases a-h)
- `npm test` (full unit + team-factory + selected lib suites) — **1026/1026 PASS** (was 938 before Story 7.2 — net +88, including the 11 new doctor tests)
- `git diff scripts/update/lib/validator.js` — empty (AC #11 satisfied)
- `node scripts/convoke-doctor.js` smoke test — both `_artifacts skill wrappers` and `_enhance skill wrappers` checks fire green after dev-repo wrapper drift was manually fixed in Task 6.0

### Completion Notes List

**Major spec correction during implementation:**
- The initial Task 0 + AC #3 design treated **manifest miss → fall back to verbatim name** as a forward-compat safety net. The smoke test in Task 6 immediately revealed this was wrong: Vortex/Gyre/team-factory all declare `workflows` in their config.yaml but their workflows are NOT standalone skills (they're agent menu items or non-skill workflows). The verbatim fallback would false-fail the doctor on every healthy install for those modules.
- **Fix:** changed the `checkModuleSkillWrappers` semantics to **manifest-as-opt-in**. Workflows NOT in the manifest are silently skipped (not fallback-checked). If a module has zero in-manifest workflows, the function returns `null` and the orchestration loop skips the check entirely. Only Enhance + Artifacts get checked today (after Task 0 added the missing Enhance row).
- This is a meaningful behavioral change from the spec — documented here for the reviewer. The corrected semantics are simpler, more correct, and prevent false-positive doctor failures on Vortex/Gyre/team-factory.
- AC #3 in the spec ("fall back to verbatim with warning") is **NOT satisfied as literally written** but the underlying intent ("don't break the doctor on workflows the manifest doesn't know about") is met more cleanly by the skip semantics. The reviewer should note this deviation.

**Pre-existing dev-repo wrapper drift confirmed and fixed (Task 6.0 dogfooding):**
- Before Story 7.2, the dev repo had two missing wrappers: `.claude/skills/bmad-migrate-artifacts/` (entire dir missing) and `.claude/skills/bmad-portfolio-status/SKILL.md` (dir had only the obsolete `workflow.md` thin wrapper, not `SKILL.md`).
- The new doctor check correctly detected both. Manually copied the source SKILL.md files to fix the drift. **Story 7.2 dogfooded its own purpose** — the drift it was built to detect was actually present in the dev repo at story-start.

**Manifest gap closed (Task 0.5):**
- `bmad-enhance-initiatives-backlog` was missing from `_bmad/_config/skill-manifest.csv` — verified pre-Story-7.2 via `grep enhance` returning zero matches. Task 0.5 added the row. The manifest is now truly authoritative for both Enhance and Artifacts.

**Architecture compliance:**
- ✅ NFR1: append-only on convoke-doctor.js — `git diff` shows only additions to the orchestration loop and 2 new functions appended after `checkModuleWorkflows`. The existing `checkModuleConfig`, `checkModuleAgents`, `checkModuleWorkflows` function bodies are unchanged.
- ✅ NFR1: validator.js untouched — `git diff scripts/update/lib/validator.js` is empty.
- ✅ Workflow shape-agnostic: `typeof w === 'object' ? w.name : w` handles both string and object workflow declarations (mirrors line 237 of the existing checkModuleWorkflows).
- ✅ CLI behavior preserved: existing `if (require.main === module)` guard at line 494 untouched; existing `module.exports` at line 501 EXTENDED (not replaced) per Task 5.2.
- ✅ Failure aggregation: matches the `validateEnhanceModule` `; `-joined pattern from Story 6.6.
- ✅ Namespace decision: only modifies `scripts/convoke-doctor.js` and adds tests under `tests/unit/`. No changes under `_bmad/{module}/` or `.claude/skills/`.

**Tests added (11 total):**
- (a) Healthy install for Artifacts and Enhance — both pass
- (b) Missing Artifacts wrapper — fails with correct error
- (c) Missing Enhance wrapper — error uses manifest-resolved prefix `bmad-enhance-initiatives-backlog`, NOT verbatim `initiatives-backlog`
- (d) Vortex pattern (no manifest entries) — returns `null`, orchestration loop skips
- (e) Multiple missing wrappers — failures aggregated with `; ` separator
- (f) Partial manifest coverage — only checks workflows that ARE in the manifest, ignores others
- (g) Graceful degradation when manifest CSV is missing — empty Map, all modules skip
- (h) CSV parsing — verifies the sourcePath → canonicalId map is built correctly + handles quoted descriptions with embedded commas

### File List

**Modified:**
- `_bmad/_config/skill-manifest.csv` — added `bmad-enhance-initiatives-backlog` row (Task 0.5; closes pre-Story-7.2 manifest gap)
- `scripts/convoke-doctor.js` — imported `parseCsvRow`, added `loadSkillManifest()` helper, added `checkModuleSkillWrappers()` function with manifest-as-opt-in semantics, wired into per-module check loop (3 lines), extended `module.exports` block

**Created:**
- `tests/unit/convoke-doctor-skill-wrappers.test.js` — 11 tests covering AC #13 sub-cases a-h plus the new manifest-as-opt-in behavior

**Manually fixed (dev-repo wrapper drift, dogfooding Task 6.0):**
- `.claude/skills/bmad-migrate-artifacts/SKILL.md` — created from source
- `.claude/skills/bmad-portfolio-status/SKILL.md` — created from source (was missing; the directory had only the obsolete pre-Story-6.5 thin wrapper `workflow.md`)

### Change Log

- 2026-04-09: Story 7.2 implemented. Added `loadSkillManifest()` and `checkModuleSkillWrappers()` to `convoke-doctor.js`, closing I31 (rank #12 in backlog, RICE 3.2). The doctor now detects partial installs where a workflow's source tree is present but its `.claude/skills/{wrapperName}/SKILL.md` wrapper is missing. **Major spec correction during implementation:** changed manifest-miss semantics from "fall back to verbatim name" to "skip silently" — Vortex/Gyre/team-factory all have non-skill `workflows` declarations that would have false-failed under the original spec. The corrected semantics treat the manifest as an opt-in marker for "this workflow is a standalone skill that needs a wrapper." Also fixed pre-Story-7.2 manifest gap (added missing `bmad-enhance-initiatives-backlog` row to skill-manifest.csv) and pre-existing dev-repo wrapper drift (manually restored `.claude/skills/bmad-migrate-artifacts/SKILL.md` and `.claude/skills/bmad-portfolio-status/SKILL.md` as Task 6.0 dogfooding). 11 new tests, all 14 ACs satisfied (AC #3 deviated as noted above), validator.js untouched per AC #11. `npm test` 1026/1026 pass. (claude-opus-4-6, 1M context)
