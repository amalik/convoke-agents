# Story 2.7: Integration Wiring — Config, CSV & Activation

Status: done

## Story

As a framework contributor,
I want the factory to create my team's config.yaml, module-help.csv, and validate activation blocks,
So that my team is properly configured, discoverable, and has correct activation paths — without manual file creation.

## Acceptance Criteria

1. **Given** artifact generation (Story 2.6) is complete
   **When** the factory creates integration files
   **Then** a per-module `config.yaml` is created at `_bmad/bme/_{team-name-kebab}/config.yaml` with all required fields (TF-FR11)
   **And** the schema matches the Gyre/Vortex pattern: `submodule_name`, `description`, `module`, `output_folder`, `agents[]`, `workflows[]`, `version`, `user_name`, `communication_language`, `party_mode_enabled`, `core_module`

2. **Given** artifact generation is complete
   **When** the factory creates integration files
   **Then** a per-module `module-help.csv` is created at `_bmad/bme/_{team-name-kebab}/module-help.csv` with the standard header row and one row per workflow (TF-FR11)
   **And** the CSV header matches: `module,phase,name,code,sequence,workflow-file,command,required,agent,options,description,output-location,outputs,`

3. **Given** agents were generated with activation XML blocks by BMB in Step 4
   **When** activation validation runs
   **Then** each agent's activation block is validated for correct config path and module path references
   **And** validation results are reported to the contributor (read-only — no file modifications)

4. **Given** a new team is being created
   **When** config.yaml creation begins
   **Then** collision detection runs first: agent IDs, workflow names, and submodule names are checked against all existing module config.yaml files (TF-NFR15)
   **And** if collisions are detected, the contributor is warned and asked to confirm or rename before proceeding

5. **Given** any integration file creation
   **When** the target file already exists
   **Then** the factory warns and asks for confirmation — never silently overwrites (TF-NFR17)
   **And** factory operations are additive — new files only, no modification of existing team files

## Tasks / Subtasks

- [x] Task 1: Create Directory Structure and Shared Types (AC: #1, #2, #3)
  - [x] 1.1 Create `_bmad/bme/_team-factory/lib/writers/` directory. Verify parent `_bmad/bme/_team-factory/lib/` exists (create `lib/` and `lib/types/` if needed).
  - [x] 1.2 Create `_bmad/bme/_team-factory/lib/types/factory-types.js` with JSDoc type definitions: `TeamSpec` (parsed spec file shape), `ConfigData` (config.yaml fields), `CsvRow` (module-help.csv row), `ActivationResult` (validation result per agent). Use JSDoc `@typedef` — no TypeScript, no runtime dependencies.

- [x] Task 2: Create config-creator.js (AC: #1, #4, #5)
  - [x] 2.1 Create `_bmad/bme/_team-factory/lib/writers/config-creator.js`. Module exports: `createConfig(specData, outputPath)` → returns `{ success, filePath, errors[] }`.
  - [x] 2.2 Implement config.yaml content builder: populate all fields from spec data — `submodule_name` from `team_name_kebab` (prefixed with `_`), `description` from team description, `module: bme`, `output_folder` from `integration.output_directory`, `agents[]` from spec agents (IDs only), `workflows[]` from spec agents' workflow names, `version: 1.0.0`, `user_name: '{user}'`, `communication_language: en`, `party_mode_enabled: true`, `core_module: bme`.
  - [x] 2.3 Implement collision detection (NFR15): before writing, scan all existing `_bmad/bme/*/config.yaml` files. Parse each. Check new team's `submodule_name`, each agent ID, and each workflow name against existing modules' values. Return collision list `[{ field, value, existingModule }]`. If collisions found, return error (do NOT write).
  - [x] 2.4 Implement additive-only check (NFR17): if `config.yaml` already exists at target path, return error with `{ exists: true, path }`. Never overwrite.
  - [x] 2.5 Write config.yaml using `fs.writeFileSync`. Immediately read back and parse with `js-yaml` (v4.1.0, already in package.json). Use project pattern: `yaml.dump(data, { indent: 2, lineWidth: -1, noRefs: true })` for writing, `yaml.load(content)` for reading.
  - [x] 2.6 CLI entry point: accept `--spec-file <path>` argument. Parse spec file, call `createConfig()`, print JSON result to stdout. Exit code 0 on success, 1 on error.

- [x] Task 3: Create csv-creator.js (AC: #2, #5)
  - [x] 3.1 Create `_bmad/bme/_team-factory/lib/writers/csv-creator.js`. Module exports: `createCsv(specData, outputPath)` → returns `{ success, filePath, rowCount, errors[] }`.
  - [x] 3.2 Implement header row: must match exactly `module,phase,name,code,sequence,workflow-file,command,required,agent,options,description,output-location,outputs,` (trailing comma included — matches existing BMB/BMM pattern).
  - [x] 3.3 Implement row generation: one row per workflow in the team. Map spec data to CSV columns:
     - `module`: `bme/_{team_name_kebab}` (module path within bme)
     - `phase`: `anytime` (default for team module workflows)
     - `name`: workflow display name (derived from workflow ID, title-case)
     - `code`: 2-letter uppercase code (derive from first letters of workflow name words)
     - `sequence`: ascending by 10 (10, 20, 30...)
     - `workflow-file`: path to workflow.md relative to `_bmad/` (e.g., `_bmad/bme/_{team}/workflows/{wf-name}/workflow.md`)
     - `command`: `bmad-{team_name_kebab}-{workflow-id}` (kebab-case command name)
     - `required`: `false`
     - `agent`: agent ID that owns the workflow
     - `options`: `Create Mode` (default)
     - `description`: from workflow description or agent role
     - `output-location`: `output_folder` from spec
     - `outputs`: artifact type from workflow
  - [x] 3.4 Implement additive-only check (NFR17): if `module-help.csv` already exists at target path, return error with `{ exists: true, path }`. Never overwrite.
  - [x] 3.5 Write module-help.csv using `fs.writeFileSync`. Immediately read back and verify first line matches expected header string.
  - [x] 3.6 CLI entry point: accept `--spec-file <path>` argument. Parse spec file, call `createCsv()`, print JSON result to stdout.

- [x] Task 4: Create activation-validator.js (AC: #3)
  - [x] 4.1 Create `_bmad/bme/_team-factory/lib/writers/activation-validator.js`. Module exports: `validateActivation(agentFiles, moduleConfig)` → returns `{ valid, results[] }` where each result is `{ agentFile, checks[], errors[] }`.
  - [x] 4.2 Implement activation XML parser: read each agent `.md` file. Extract `<activation>` block using regex (pattern: `<activation[^>]*>[\s\S]*?</activation>`). If no activation block found, report as error.
  - [x] 4.3 Implement config path validation: activation block should reference the team's config.yaml path (`_bmad/bme/_{team_name_kebab}/config.yaml`). Verify the referenced path exists (config.yaml must be created before validation runs).
  - [x] 4.4 Implement module path validation: activation block should reference correct module path (`bme/_{team_name_kebab}`). Verify the module directory exists.
  - [x] 4.5 Read-only enforcement: this module NEVER writes to any file. It only reads agent files and checks paths. Assert no `fs.writeFileSync` or `fs.mkdirSync` calls in this module.
  - [x] 4.6 CLI entry point: accept `--agent-files <glob>` and `--config-path <path>` arguments. Call `validateActivation()`, print JSON result to stdout.

- [x] Task 5: Update step-04-generate.md with Integration Wiring PARTs (AC: #1, #2, #3, #4)
  - [x] 5.1 Replace RULES line 17 (`Do NOT create config.yaml or module-help.csv...`) with: `After artifact generation (PARTs 3–5), invoke JS integration modules to create config.yaml and module-help.csv. These modules are at _bmad/bme/_team-factory/lib/writers/. The factory invokes them via node CLI and reads JSON results from stdout.` Also remove the forward reference annotation at line 162 in the BMB delegation prompt (`(forward reference — config.yaml will be created in Story 2.7 integration wiring)`) and replace with the actual config.yaml path after PART 7 creates it.
  - [x] 5.2 Add PART 7: CONFIG.YAML CREATION after PART 5. Content: (a) Run collision detection via `node _bmad/bme/_team-factory/lib/writers/config-creator.js --spec-file {spec_file_path} --dry-run` — present collisions to contributor if any, (b) If no collisions (or contributor confirms), run `node _bmad/bme/_team-factory/lib/writers/config-creator.js --spec-file {spec_file_path}`, (c) Present result to contributor: file path, field count, verification status.
  - [x] 5.3 Add PART 8: MODULE-HELP.CSV CREATION. Content: (a) Run `node _bmad/bme/_team-factory/lib/writers/csv-creator.js --spec-file {spec_file_path}`, (b) Present result: file path, row count, header verification status.
  - [x] 5.4 Add PART 9: ACTIVATION VALIDATION. Content: (a) Run `node _bmad/bme/_team-factory/lib/writers/activation-validator.js --agent-files '_bmad/bme/_{team_name_kebab}/agents/*.md' --config-path '_bmad/bme/_{team_name_kebab}/config.yaml'`, (b) Present validation results per agent: agent file, checks passed/failed, specific errors. (c) If any validation fails, warn contributor and ask whether to proceed or fix. Activation issues do NOT block generation (they're informational for manual correction).
  - [x] 5.5 Move current PART 6 (GENERATION SUMMARY) after the new PARTs — becomes PART 10. Update any internal cross-references to the summary PART number.
  - [x] 5.6 Update STEP VALIDATION table: add checks for `config.yaml created and parses`, `module-help.csv created and header matches`, `Activation validation ran`, `No unresolved collisions`.
  - [x] 5.7 Update CHECKPOINT: add integration wiring status section showing config.yaml path, module-help.csv path, activation validation summary.
  - [x] 5.8 Update context variables recorded at end: add `config_yaml_path`, `module_help_csv_path`, `activation_validation_results`.
  - [x] 5.9 Update NEXT section: remove the manual integration wiring guidance text (contributors no longer need to manually create config.yaml/module-help.csv — PARTs 7–9 now handle this). Keep the note that Step 5 (Story 2.9) is not yet available.

- [x] Task 6: Create Tests (AC: #1, #2, #3, #4, #5)
  - [x] 6.1 Create `tests/team-factory/` directory (if not exists) and `tests/team-factory/golden/` subdirectory.
  - [x] 6.2 Create `tests/team-factory/golden/golden-config.yaml` — ≤50 lines, a reference config.yaml for a minimal test team (2 agents, 2 workflows). Must match exact schema from Gyre/Vortex.
  - [x] 6.3 Create `tests/team-factory/golden/golden-help-csv.csv` — ≤50 lines, a reference module-help.csv with header + 2 workflow rows matching the standard column format.
  - [x] 6.4 Create `tests/team-factory/config-creator.test.js`: (a) happy path: spec → config.yaml matches golden, (b) collision detection: detects duplicate agent ID, (c) collision detection: detects duplicate workflow name, (d) additive-only: refuses to overwrite existing file, (e) verify parse: output is valid YAML.
  - [x] 6.5 Create `tests/team-factory/csv-creator.test.js`: (a) happy path: spec → CSV matches golden, (b) header verification: output first line matches expected header, (c) row count: matches workflow count, (d) additive-only: refuses to overwrite existing file.
  - [x] 6.6 Create `tests/team-factory/activation-validator.test.js`: (a) valid activation: passes all checks, (b) missing activation block: reports error, (c) wrong config path: reports error, (d) wrong module path: reports error, (e) read-only: no file system writes during validation.
  - [x] 6.7 Create `tests/team-factory/fixtures/` with test spec file and test agent files for test input data.

- [x] Task 7: Update workflow.md (AC: #1)
  - [x] 7.1 Update status line in workflow.md: change `"Steps 0–4 available"` to include integration wiring context (e.g., `"Steps 0–4 available (Step 4 now includes integration wiring)"`).
  - [x] 7.2 Update the Step 4 row in the steps table: change purpose from `"BMB delegation + artifact generation"` to `"BMB delegation + artifact generation + integration wiring"`.
  - [x] 7.3 Update the Story column for Step 4 from `2.6` to `2.6, 2.7`.

- [x] Task 8: Verification
  - [x] 8.1 Verify all 3 JS modules exist at `_bmad/bme/_team-factory/lib/writers/` and follow Node.js patterns (`require`, `module.exports`, no ES modules).
  - [x] 8.2 Verify generated config.yaml schema matches Gyre (`_bmad/bme/_gyre/config.yaml`) and Vortex (`_bmad/bme/_vortex/config.yaml`) — same top-level keys in same order.
  - [x] 8.3 Verify module-help.csv header matches BMB (`_bmad/bmb/module-help.csv`) and BMM (`_bmad/bmm/module-help.csv`) — identical column list.
  - [x] 8.4 Verify collision detection covers: `submodule_name` uniqueness, agent ID uniqueness across modules, workflow name uniqueness across modules.
  - [x] 8.5 Verify additive-only: no `fs.unlinkSync`, no overwrite logic — all three modules check for existing files and refuse to proceed.
  - [x] 8.6 Verify golden files are each ≤50 lines.
  - [x] 8.7 Verify step-04-generate.md still follows the step-file pattern: PURPOSE → RULES → PARTs → STEP VALIDATION → Visibility Checklist → CHECKPOINT → NEXT.
  - [x] 8.8 Run all tests: `node --test tests/team-factory/*.test.js` — all pass.
  - [x] 8.9 Verify activation-validator.js is read-only: no `writeFileSync`, `mkdirSync`, or any write operations.

## Dev Notes

### Key Architecture Decisions

1. **First JS modules in the factory** — Stories 2.1–2.6 created LLM instruction files (step-00 through step-04). Story 2.7 introduces the first JS modules in `_bmad/bme/_team-factory/lib/writers/`. These are invoked by the LLM via `node` CLI during step-04 execution. The pattern: step file tells the LLM WHEN to invoke → JS module handles the deterministic file creation.

2. **1 writer, 2 creators, 1 validator (D-Q2)** — Architecture specifies distinct types:
   - `config-creator.js` = Creator (new file, Simple safety: write → verify parse)
   - `csv-creator.js` = Creator (new file, Simple safety: write → verify header match)
   - `activation-validator.js` = Validator (read-only, no writes)
   - `registry-writer.js` = Writer (shared file, Full Write Safety Protocol) — that's Story 2.8, NOT this story

3. **Simple safety for creators vs Full for writers** — Creators write NEW files (no collision with existing content). Safety = write the file, read it back, verify it parses correctly. The Full Write Safety Protocol (stage → validate → check → apply → verify) is only required for `registry-writer.js` (Story 2.8) because it modifies a shared file (`agent-registry.js`).

4. **Collision detection is cross-module (NFR15)** — Before creating config.yaml, scan ALL existing `_bmad/bme/*/config.yaml` files. Extract agent IDs and workflow names from each. Check the new team's values don't collide with any existing module. This prevents two modules from registering the same agent ID or workflow name.

5. **Module-help.csv column format is fixed** — The header `module,phase,name,code,sequence,workflow-file,command,required,agent,options,description,output-location,outputs,` is identical across BMB and BMM. The trailing comma is intentional (existing pattern). New module-help.csv files MUST use this exact header.

6. **Step-04 gets new PARTs 7–9** — Integration wiring is added to step-04-generate.md as PARTs 7 (config.yaml), 8 (module-help.csv), 9 (activation validation). Current PART 6 (summary) becomes PART 10. This keeps all generation-related work in a single step.

7. **Activation validation is informational, not blocking** — Activation blocks are authored by BMB (Story 2.6), not by the factory. If validation finds issues, the contributor is warned but generation is NOT rolled back. The contributor can fix activation blocks manually or re-run BMB delegation for the affected agent.

### What NOT to Do

- Do NOT create `registry-writer.js` — that's Story 2.8
- Do NOT write to `agent-registry.js` — that's Story 2.8
- Do NOT create `step-05-validate.md` — that's Story 2.9
- Do NOT create `manifest-tracker.js`, `naming-enforcer.js`, `cascade-logic.js`, `collision-detector.js` as separate modules — collision detection is internal to config-creator.js for this story
- Do NOT modify existing team module files (Gyre, Vortex config.yaml/module-help.csv) — additive only
- Do NOT use ES modules (`import`/`export`) — use CommonJS (`require`/`module.exports`) to match project patterns
- `js-yaml` v4.1.0 is already in package.json — use it directly. Do NOT add new dependencies.
- Do NOT create step-00, step-01, step-02, step-03 — those already exist

### Context Variables Consumed from Step 4 (Story 2.6)

These are available in conversation context when integration wiring PARTs execute:

- `team_name`: display name
- `team_name_kebab`: kebab-case for file/directory naming
- `spec_file_path`: path to the YAML spec file
- `module_root`: `_bmad/bme/_{team_name_kebab}/`
- `generated_files[]`: list of all generated artifact files
- `agent_files[]`: list of generated agent .md files
- `workflow_dirs[]`: list of generated workflow directories
- `contract_files[]`: list of generated contract files (may be empty)
- `compass_routing_file`: path to compass-routing-reference.md (may be null)
- `workflow_names{}`: map of agent_id → workflow_name (recorded in PART 3C)
- `generation_complete`: boolean

### Existing Module Patterns (Reference)

**Config.yaml schema** (from `_bmad/bme/_gyre/config.yaml` and `_bmad/bme/_vortex/config.yaml`):
```yaml
submodule_name: _gyre
description: "Gyre Pattern - Production readiness discovery..."
module: bme
output_folder: '{project-root}/_bmad-output/gyre-artifacts'
agents:
  - stack-detective
  - model-curator
  - readiness-analyst
  - review-coach
workflows:
  - full-analysis
  - stack-detection
  - model-generation
  - model-review
  - gap-analysis
  - delta-report
  - accuracy-validation
version: 1.0.0
user_name: '{user}'
communication_language: en
party_mode_enabled: true
core_module: bme
```

**Module-help.csv header** (from `_bmad/bmb/module-help.csv` and `_bmad/bmm/module-help.csv`):
```
module,phase,name,code,sequence,workflow-file,command,required,agent,options,description,output-location,outputs,
```

**Agent registry pattern** (from `scripts/update/lib/agent-registry.js`):
Per-module const blocks: `AGENTS[]`, `WORKFLOWS[]`, derived lists, `module.exports`. Story 2.8 handles this — do NOT touch.

### Project Structure Notes

- JS modules go in `_bmad/bme/_team-factory/lib/writers/` — NOT in `scripts/` (factory modules are within the bme module, not CLI scripts)
- Type definitions go in `_bmad/bme/_team-factory/lib/types/factory-types.js`
- Tests go in `tests/team-factory/` — matches existing test directory pattern (`tests/` at project root)
- Golden files go in `tests/team-factory/golden/` — ≤50 lines each
- Test fixtures go in `tests/team-factory/fixtures/`

### Previous Story Intelligence (from tf-2-6)

- Step files follow pattern: PURPOSE → RULES → PARTs → STEP VALIDATION → Visibility Checklist → CHECKPOINT → NEXT
- Visibility checklist at exactly 3/3 concept budget — adding PARTs 7–9 should NOT add new visibility concepts (integration wiring is a sub-concept of the existing "generation" concept)
- Spec file uses 2-space YAML indentation (BMAD standard)
- `workflow_names[agent_id]` recorded in PART 3C provides the mapping needed for CSV row generation
- Code review found: config.yaml forward reference at line 162 annotated `"(forward reference — config.yaml will be created in Story 2.7 integration wiring)"` — this annotation should be removed and replaced with actual creation instructions
- PART 4 (contracts) is conditional on `contracts[]` non-empty (not Sequential-only) — similar conditional pattern applies to integration wiring PARTs

### Testing Standards

- Node.js built-in `node:test` framework (NOT Jest). Imports: `const { describe, it, before, after } = require('node:test')` and `const assert = require('node:assert/strict')`.
- File system utilities: `fs-extra` (already in package.json) for temp dir cleanup, `fs.mkdtemp(path.join(os.tmpdir(), 'bmad-tf-'))` for test isolation.
- YAML handling in tests: `const yaml = require('js-yaml')` with `yaml.load()` / `yaml.dump()`.
- Run tests: `node --test tests/team-factory/*.test.js`
- Golden file tests: exact match against `tests/team-factory/golden/` files, ≤50 lines per golden file
- Golden file update workflow: run with `updateGolden: true` → `git diff` → commit
- Test factory-authored wiring only (golden files) — template-generated content uses structural validation
- No external service calls in tests — all file system operations use temp directories

### References

- [Epic file: Story 2.7](/_bmad-output/planning-artifacts/epic-team-factory.md) — lines 404-418
- [Architecture: D-Q2 Format-Aware Writer Design](/_bmad-output/planning-artifacts/architecture-team-factory.md) — lines 340-366
- [Architecture: Write Safety Protocol](/_bmad-output/planning-artifacts/architecture-team-factory.md) — lines 102-110
- [Architecture: Write Boundaries](/_bmad-output/planning-artifacts/architecture-team-factory.md) — lines 781-788
- [Architecture: LLM/JS Boundary](/_bmad-output/planning-artifacts/architecture-team-factory.md) — lines 757-768
- [Architecture: Directory Structure](/_bmad-output/planning-artifacts/architecture-team-factory.md) — lines 539-551
- [Architecture: Golden File Testing](/_bmad-output/planning-artifacts/architecture-team-factory.md) — lines 614-619
- [Gyre config.yaml](/_bmad/bme/_gyre/config.yaml) — reference schema for config creation
- [Vortex config.yaml](/_bmad/bme/_vortex/config.yaml) — reference schema for config creation
- [BMB module-help.csv](/_bmad/bmb/module-help.csv) — reference header/row format for CSV creation
- [BMM module-help.csv](/_bmad/bmm/module-help.csv) — reference header/row format for CSV creation
- [agent-registry.js](scripts/update/lib/agent-registry.js) — DO NOT MODIFY (Story 2.8)
- [step-04-generate.md](/.claude/skills/bmad-team-factory/step-04-generate.md) — target for PART additions
- [Previous story: tf-2-6](/_bmad-output/implementation-artifacts/tf-2-6-bmb-delegation-artifact-generation.md) — step-file patterns, code review patches

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Completion Notes List

- All 3 JS modules created as Creators/Validator (NOT Writer — that's Story 2.8)
- Simple safety protocol implemented: write → verify parse (config-creator), write → verify header (csv-creator)
- Activation validator is strictly read-only (enforced by test scanning source for write operations)
- Collision detection scans all `_bmad/bme/*/config.yaml` for submodule_name, agent ID, workflow name collisions
- Fixed test isolation issue: shared tmpDir caused false collision detection in "valid YAML" test — resolved with isolated bmeRoot
- Fixed module path false positive: substring matching on activation content matched config path instead of module attribute — resolved with regex-based `module=` attribute extraction
- Pre-existing failure in docs-audit.test.js (23 findings) — not caused by this story
- 33 tests, all passing

### Change Log

- Created factory-types.js with JSDoc type definitions
- Created config-creator.js with collision detection + additive-only + simple safety
- Created csv-creator.js with standard header + row generation + additive-only
- Created activation-validator.js with 5-check read-only validation
- Updated step-04-generate.md: added PARTs 7-9 (config, CSV, activation), renumbered summary to PART 10, updated STEP VALIDATION/CHECKPOINT/NEXT
- Updated workflow.md: status line, Step 4 purpose and Story column
- Created test fixtures, golden files, and 3 test suites

### File List

- `_bmad/bme/_team-factory/lib/types/factory-types.js` (NEW)
- `_bmad/bme/_team-factory/lib/writers/config-creator.js` (NEW)
- `_bmad/bme/_team-factory/lib/writers/csv-creator.js` (NEW)
- `_bmad/bme/_team-factory/lib/writers/activation-validator.js` (NEW)
- `.claude/skills/bmad-team-factory/step-04-generate.md` (MODIFIED)
- `.claude/skills/bmad-team-factory/workflow.md` (MODIFIED)
- `tests/team-factory/fixtures/test-team-spec.yaml` (NEW)
- `tests/team-factory/golden/golden-config.yaml` (NEW)
- `tests/team-factory/golden/golden-help-csv.csv` (NEW)
- `tests/team-factory/config-creator.test.js` (NEW)
- `tests/team-factory/csv-creator.test.js` (NEW)
- `tests/team-factory/activation-validator.test.js` (NEW)
