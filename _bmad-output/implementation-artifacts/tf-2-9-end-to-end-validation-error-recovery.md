# Story 2.9: End-to-End Validation & Error Recovery

Status: ready-for-dev

## Story

As a framework contributor,
I want the factory to validate the complete team output and recover cleanly if anything fails,
So that I can trust the team is correctly wired and immediately usable without manual fixes.

## Acceptance Criteria

1. **Given** artifact generation and wiring are complete
   **When** Step 5 (Validate) runs
   **Then** an end-to-end validation pass checks the full team against the Architecture Reference rules (TF-FR20)
   **And** the team passes the same validation rules and refresh pipeline as native teams (TF-NFR7)
   **And** a file manifest of all created and modified files is produced (TF-NFR16)
   **And** the contributor sees the manifest and validation results

2. **Given** validation fails at any point
   **When** an error occurs
   **Then** error messages include step name, decision ID, and expected-vs-actual values (TF-NFR11)
   **And** the factory rolls back to the last validated state — no partial writes persist (TF-FR24)
   **And** the contributor sees which step failed and why

3. **Given** the contributor wants to undo the entire creation
   **When** they request abort
   **Then** the creation manifest lists all files created with removal instructions (TF-FR15)

4. **Given** factory output passes validation
   **When** the contributor reviews the result
   **Then** zero manual fixes are required — the team is ready to use (TF-NFR3)
   **And** user-facing complexity felt Low — the contributor completed without consulting external documentation (TF-NFR1)

## Tasks / Subtasks

- [ ] Task 1: Create step-05-validate.md (AC: #1, #2, #3, #4)
  - [ ] 1.1 Create `.claude/skills/bmad-team-factory/step-05-validate.md` following micro-file step architecture (same structure as step-00 through step-04).
  - [ ] 1.2 **PART 1: CONTEXT LOADING** — Load context variables carried from Step 4: `module_root`, `generated_files`, `agent_files`, `workflow_dirs`, `contract_files`, `config_yaml_path`, `module_help_csv_path`, `activation_validation_results`, `registry_block_prefix`, `registry_wiring_result`, `team_name`, `team_name_kebab`, `spec_file_path`. Validate all paths exist on disk.
  - [ ] 1.3 **PART 2: FILE MANIFEST COMPILATION** — Build the file manifest from all files created/modified during Steps 2-4. Each entry: `{ path, operation: 'created' | 'modified', module }`. Include: agent .md files, workflow dirs, contract files, compass routing reference, SKILL.md, config.yaml, module-help.csv, agent-registry.js (modified), spec file (modified). Present the manifest to the contributor.
  - [ ] 1.4 **PART 3: STRUCTURAL VALIDATION** — Run validation checks on the new team:
    - Config.yaml: exists, parseable as YAML, has required fields (submodule_name, module, agents, workflows)
    - Module-help.csv: exists, header matches expected format, row count matches agent count
    - Agent files: all files from `agent_files` exist in `{module_root}/agents/`
    - Workflow directories: all from `workflow_dirs` exist in `{module_root}/workflows/`
    - Contract files: all from `contract_files` exist in `{module_root}/contracts/`
    - Registry block: `registry_wiring_result.success === true` and `written` array has 5 entries
    - Activation blocks: `activation_validation_results.valid === true`
  - [ ] 1.5 **PART 4: NATIVE TEAM PARITY CHECK** — Run the existing `scripts/update/lib/validator.js` validation approach against the new team module. The existing validator checks: config structure, agent files, workflow files, manifest consistency. Adapt these checks for the new team's module path (not hardcoded to Vortex). This validates TF-NFR7 (same rules as native teams).
  - [ ] 1.6 **PART 5: REGRESSION CHECK** — Verify existing teams still pass validation after registry modification. Run `node -e "require('scripts/update/lib/agent-registry.js')"` to confirm the registry loads without errors. Check that existing team exports (AGENTS, WORKFLOWS, GYRE_AGENTS, etc.) are still accessible.
  - [ ] 1.7 **PART 6: VALIDATION REPORT** — Present results to the contributor. Format: table of check name + status (pass/fail) + detail. If all pass: congratulation message, team is ready to use. If any fail: show which checks failed with expected vs actual values per TF-NFR11.
  - [ ] 1.8 **PART 7: ABORT PATH** — If the contributor requests abort after seeing results (or if validation fails and they choose not to fix): present the file manifest with removal instructions. Format: list each created file with `rm` command. For modified files (agent-registry.js): note that manual revert is needed (use `git checkout -- <path>`). Do NOT auto-delete — present instructions only.
  - [ ] 1.9 **STEP VALIDATION** table — checklist the step must satisfy before marking complete.
  - [ ] 1.10 **CHECKPOINT** — HALT and present validation summary + manifest to contributor. Wait for confirmation.

- [ ] Task 2: Create manifest-tracker.js (AC: #1, #3)
  - [ ] 2.1 Create `_bmad/bme/_team-factory/lib/manifest-tracker.js`. Exports: `buildManifest(specData, generationContext)` → returns `ManifestEntry[]`.
  - [ ] 2.2 `ManifestEntry` shape: `{ path: string, operation: 'created' | 'modified', module: string }`.
  - [ ] 2.3 Build manifest from generation context variables: iterate `generated_files`, `config_yaml_path`, `module_help_csv_path`, spec file path. Mark `agent-registry.js` as `modified`. All others as `created`.
  - [ ] 2.4 Export a `formatManifest(entries)` helper that returns a human-readable markdown table string.
  - [ ] 2.5 Export a `formatAbortInstructions(entries)` helper that returns removal commands: `rm <path>` for created files, `git checkout -- <path>` for modified files.

- [ ] Task 3: Create end-to-end-validator.js (AC: #1, #2, #4)
  - [ ] 3.1 Create `_bmad/bme/_team-factory/lib/validators/end-to-end-validator.js`. Exports: `validateTeam(specData, generationContext, projectRoot)` → returns `E2EValidationResult`.
  - [ ] 3.2 `E2EValidationResult` shape: `{ valid: boolean, checks: E2ECheck[], errors: string[] }`.
  - [ ] 3.3 `E2ECheck` shape: `{ name: string, passed: boolean, expected?: string, actual?: string, detail?: string }`.
  - [ ] 3.4 Implement structural checks: config.yaml exists + parseable + required fields, module-help.csv exists + correct header + correct row count, agent files exist, workflow dirs exist, contract files exist.
  - [ ] 3.5 Implement registry check: verify `registry_wiring_result.success` and `written` array length.
  - [ ] 3.6 Implement activation check: verify `activation_validation_results.valid`.
  - [ ] 3.7 Implement regression check: `node -e "require('{registryPath}')"` via `execSync` — same pattern as registry-writer's `verifyRequire`. Verify existing exports are still accessible by checking the returned module's keys.
  - [ ] 3.8 Each failed check must include `expected` and `actual` values per TF-NFR11.

- [ ] Task 4: Update factory-types.js (AC: #1, #3)
  - [ ] 4.1 Add `ManifestEntry` typedef: `{ path: string, operation: 'created' | 'modified', module: string }`.
  - [ ] 4.2 Add `E2EValidationResult` typedef: `{ valid: boolean, checks: E2ECheck[], errors: string[] }`.
  - [ ] 4.3 Add `E2ECheck` typedef: `{ name: string, passed: boolean, expected?: string, actual?: string, detail?: string }`.

- [ ] Task 5: Update workflow.md (AC: #1)
  - [ ] 5.1 Update status line: "Steps 0–5 available" (remove the "Step 5 under development" note).
  - [ ] 5.2 Update Step 5 row: Story column `2.9`, purpose `End-to-end validation + file manifest`.
  - [ ] 5.3 Add routing for Step 5: "If returning from step-04-generate.md (Step 4 confirmed), read fully and follow: `./step-05-validate.md` to proceed to Step 5 (Validate)."
  - [ ] 5.4 Remove the **Note** about Step 5 being under development and the Architecture Reference pointer.

- [ ] Task 6: Create Tests (AC: #1, #2, #3)
  - [ ] 6.1 Create `tests/team-factory/manifest-tracker.test.js`.
  - [ ] 6.2 Test: `buildManifest` returns correct entry count with correct operations.
  - [ ] 6.3 Test: `formatManifest` produces valid markdown table.
  - [ ] 6.4 Test: `formatAbortInstructions` produces `rm` for created, `git checkout --` for modified.
  - [ ] 6.5 Create `tests/team-factory/end-to-end-validator.test.js`.
  - [ ] 6.6 Test: happy path — all checks pass when all files exist and results are valid.
  - [ ] 6.7 Test: missing agent file — check fails with expected file path in `expected` field.
  - [ ] 6.8 Test: missing config.yaml — check fails with path detail.
  - [ ] 6.9 Test: registry regression — `verifyRequire` integration test (same pattern as registry-writer tests).
  - [ ] 6.10 Test: failed activation results — propagated correctly.

- [ ] Task 7: Verification
  - [ ] 7.1 Run all tests: `node --test tests/team-factory/*.test.js` — all pass (existing + new).
  - [ ] 7.2 Verify step-05-validate.md follows step-file architecture pattern.
  - [ ] 7.3 Verify workflow.md routing is complete (Steps 0-5 all wired).
  - [ ] 7.4 Verify manifest-tracker.js and end-to-end-validator.js use CommonJS patterns.
  - [ ] 7.5 Verify error messages include check name + expected + actual per TF-NFR11.

## Dev Notes

### Key Architecture Decisions

1. **Step 5 is JS Deterministic only — no LLM reasoning.** Per architecture mode parity table (line 768), the Validate step uses pure JS checks. Guaranteed identical behavior in Express and Guided modes. Note: the epic file refers to this as "Step 6" — that is stale numbering from an earlier plan. The architecture confirms this is Step 5 (`step-05-validate.md`). Follow the architecture.

2. **Validator is NOT an extension of `scripts/update/lib/validator.js`.** The existing validator is hardcoded to Vortex paths (`_bmad/bme/_vortex/`). Do NOT modify it. Create a new `end-to-end-validator.js` in the factory lib that runs the *same categories* of checks (config, agents, workflows, manifest) against the new team's module path.

3. **File manifest is built from generation context, not filesystem scanning.** The generation context from Step 4 already tracks all created/modified files. Build the manifest from those tracked variables — do NOT scan the filesystem. This ensures the manifest reflects exactly what the factory did.

4. **Abort does NOT auto-delete.** Per TF-FR15, the abort path *lists* files with removal instructions. The contributor decides what to remove. The factory never deletes files. For agent-registry.js (modified, not created), the instruction is `git checkout -- <path>` not `rm`.

5. **Regression check is lightweight.** Do NOT run the full `validateInstallation()` function from validator.js — it's hardcoded to Vortex. Instead, verify the registry loads via `node require()` (same pattern as registry-writer's `verifyRequire`), and spot-check that existing team exports are still present in the module.

6. **PART numbering continues from step-04.** Step-05 uses its own PART numbering starting at 1. There is no relationship to step-04's PART numbers.

7. **Error messages follow NFR11 format.** Every failed check must include: check name (what was checked), expected value (what should be), actual value (what was found). This is the `E2ECheck` shape: `{ name, passed, expected?, actual?, detail? }`.

8. **manifest-tracker.js is a utility, not a writer.** It does not write any files. It builds an in-memory manifest from generation context and formats it for display. No write safety protocol needed.

### What NOT to Do

- Do NOT create `naming-enforcer.js` or `collision-detector.js` — those are architecture-planned but not needed for this story
- Do NOT modify `scripts/update/lib/validator.js` — it's the existing system validator, hardcoded to Vortex
- Do NOT auto-delete files on abort — present instructions only
- Do NOT scan the filesystem to build the manifest — use generation context variables
- Do NOT use ES modules — use CommonJS (`require`/`module.exports`)
- Do NOT add npm dependencies — `fs-extra`, `child_process`, `path` are all already available
- Do NOT create golden files for the validator output — the checks return structured objects, not formatted strings

### Existing validator.js Structure (Reference — do NOT modify)

```javascript
// scripts/update/lib/validator.js — hardcoded to Vortex
// Checks: config structure, agent files, workflow files, manifest, user data, deprecated workflows, step structure, enhance module
// Uses: AGENT_FILES, AGENT_IDS, WORKFLOW_NAMES from agent-registry.js
// Paths: hardcoded to _bmad/bme/_vortex/
// Return: { valid: boolean, checks: [{ name, passed, error, warning?, info? }] }
```

The new `end-to-end-validator.js` follows the same check shape but parameterized by module path.

### Generation Context Variables (Input from Step 4)

```
module_root         — _bmad/bme/_{team_name_kebab}/
generated_files     — all file paths created during generation
agent_files         — agent .md file paths
workflow_dirs       — workflow directory paths
contract_files      — contract .md file paths
config_yaml_path    — path to created config.yaml
module_help_csv_path — path to created module-help.csv
activation_validation_results — { valid, results[] }
registry_block_prefix — SCREAMING_SNAKE_CASE prefix
registry_wiring_result — { success, written[], skipped[], errors[], rollbackApplied }
team_name           — display name
team_name_kebab     — kebab-case name
spec_file_path      — path to team spec file
```

### Testing Standards

- Node.js built-in `node:test` framework (NOT Jest). Imports: `const { describe, it, before, after } = require('node:test')` and `const assert = require('node:assert/strict')`.
- File system utilities: `fs-extra` for temp dir cleanup, `fs.mkdtemp(path.join(os.tmpdir(), 'bmad-tf-'))` for test isolation.
- Run tests: `node --test tests/team-factory/*.test.js`
- No golden files for validator output — test the structured result objects directly
- For registry regression tests: write test registry to tmpDir, same pattern as registry-writer tests

### Previous Story Intelligence (from tf-2-8)

- Story 2.8 created `registry-writer.js` with Full Write Safety Protocol (stage → validate → check → apply → verify → rollback)
- `RegistryResult` shape: `{ success, written[], skipped[], errors[], rollbackApplied, dirty?, diff? }`
- `verifyRequire()` pattern: `execSync(\`node -e "require('${absPath}')"\`, { timeout: 5000, stdio: 'pipe' })` — reuse this exact pattern for regression check
- Code review found 6 issues (all patched): uncaught throw in `applyInsertions`, brace-counting false positives, newline escaping, empty prefix validation, stale .bak detection, rollback test gap
- Story 2.7 created `config-creator.js`, `csv-creator.js`, `activation-validator.js` — their result shapes are `CreatorResult` and `ValidationResult` in factory-types.js
- Dirty-tree detection uses `cwd: path.dirname(registryPath)` — learned from 2.8 bug where missing CWD caused detection to run against wrong repo

### References

- [Epic file: Story 2.9](_bmad-output/planning-artifacts/epic-team-factory.md) — lines 442-470
- [Architecture: Validation Layering](_bmad-output/planning-artifacts/architecture-team-factory.md) — D-Q3, four validation layers
- [Architecture: File Manifest](_bmad-output/planning-artifacts/architecture-team-factory.md) — lines 580, 589
- [Architecture: Step-05 Location](_bmad-output/planning-artifacts/architecture-team-factory.md) — line 689
- [Architecture: Mode Parity](_bmad-output/planning-artifacts/architecture-team-factory.md) — line 768
- [Architecture: FR22-FR24 Components](_bmad-output/planning-artifacts/architecture-team-factory.md) — line 658
- [Architecture: Test Plan](_bmad-output/planning-artifacts/architecture-team-factory.md) — lines 724-737
- [validator.js](scripts/update/lib/validator.js) — existing Vortex validator (do NOT modify)
- [agent-registry.js](scripts/update/lib/agent-registry.js) — regression target
- [factory-types.js](_bmad/bme/_team-factory/lib/types/factory-types.js) — extend with new typedefs
- [workflow.md](.claude/skills/bmad-team-factory/workflow.md) — update routing
- [Previous story: tf-2-8](_bmad-output/implementation-artifacts/tf-2-8-registry-wiring-write-safety.md) — patterns, code review patches

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Completion Notes List

### Change Log

### File List
