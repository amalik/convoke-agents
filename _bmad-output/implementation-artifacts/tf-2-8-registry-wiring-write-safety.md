# Story 2.8: Registry Wiring & Write Safety

Status: ready-for-dev

## Story

As a framework contributor,
I want the factory to register my team in agent-registry.js with full write safety,
So that my team's agents and workflows are available system-wide without risking corruption of existing registrations.

## Acceptance Criteria

1. **Given** artifacts and integration files are created
   **When** the factory writes to agent-registry.js (the only shared file)
   **Then** a new module block is added with agents, workflows, derived lists, and exports (TF-FR11)
   **And** the Write Safety Protocol is followed: stage (prepare in isolation) → validate (check format-correct, additive) → check (dirty-tree detection immediately before write) → apply (write to target) → verify (re-read + re-parse + `node require()` post-write validation) (TF-NFR12, TF-NFR13)
   **And** the operation is additive — existing module blocks are never modified or removed (TF-NFR17)

2. **Given** dirty-tree detection finds uncommitted changes to agent-registry.js
   **When** the check stage runs
   **Then** the factory warns the contributor about the conflict and asks for confirmation before proceeding (TF-NFR12)

3. **Given** post-write validation fails (`node require()` throws)
   **When** structural integrity check detects corruption
   **Then** the write is rolled back to the pre-write state and the contributor sees the error

## Tasks / Subtasks

- [ ] Task 1: Analyze agent-registry.js Structure (AC: #1)
  - [ ] 1.1 Read `scripts/update/lib/agent-registry.js` and verify the structure matches the Dev Notes reference. The Gyre module block (lines 136-199) is the reference pattern. `module.exports` (lines 201-214) is a separate shared section — not part of any module block. Note any discrepancies.
  - [ ] 1.2 Identify the insertion point: new module blocks go BEFORE `module.exports`. Derived lists go after the module's WORKFLOWS array. Exports are added to the existing `module.exports` object.

- [ ] Task 2: Create registry-writer.js with Full Write Safety Protocol (AC: #1, #2, #3)
  - [ ] 2.1 Create `_bmad/bme/_team-factory/lib/writers/registry-writer.js`. Module exports: `writeRegistryBlock(specData, registryPath, options)` → returns `{ success, written[], skipped[], errors[], rollbackApplied }`.
  - [ ] 2.2 **Stage** — Build the module block as a JS string in isolation. The block must contain:
    - Section comment: `// ── {Team Name} Module ──` (matching Gyre's style)
    - `const {PREFIX}_AGENTS = [...]` array with full agent objects (id, name, icon, title, stream, persona with role/identity/communication_style/expertise)
    - `const {PREFIX}_WORKFLOWS = [...]` array with `{ name, agent }` entries
    - Derived lists: `{PREFIX}_AGENT_FILES`, `{PREFIX}_AGENT_IDS`, `{PREFIX}_WORKFLOW_NAMES`
    - The `{PREFIX}` is the team name in SCREAMING_SNAKE_CASE (e.g., `GYRE` for `_gyre`)
  - [ ] 2.3 **Stage** — Build the exports additions: the new const names that must be appended to the `module.exports` object.
  - [ ] 2.4 **Validate** — Validate the staged block using regex checks: verify balanced braces, verify const declarations use the correct prefix, verify no reassignment to existing variables. For full syntax validation, write the staged block to a temp file and run `node -e "require('{tempFile}')"` to confirm parseability. Verify the prefix doesn't collide with existing module prefixes (scan for `const {PREFIX}_AGENTS` in the file).
  - [ ] 2.5 **Check** — Dirty-tree detection: run `git diff --name-only -- <registryPath>` immediately before write. If the file has uncommitted changes, return a warning result `{ dirty: true, diff }` — do NOT write automatically. The step-04 PART will present this to the contributor for confirmation.
  - [ ] 2.6 **Apply** — Read current `agent-registry.js` content. Save a copy as `{registryPath}.bak`. Insert the new module block before `module.exports = {`. Insert the new export entries into the `module.exports` object (before the closing `};`). Write the modified content back.
  - [ ] 2.7 **Verify** — Re-read the written file. Run `node -e "require('${registryPath}')"` via `child_process.execSync`. If require() throws, the file is structurally broken → trigger rollback.
  - [ ] 2.8 **Rollback** — If verify fails: restore from `.bak` file. Delete `.bak`. Return `{ success: false, rollbackApplied: true, errors: [...] }`.
  - [ ] 2.9 **Cleanup** — If verify succeeds: delete `.bak` file. Return success result.
  - [ ] 2.10 **Idempotency** — Before staging, check if a block with the same prefix already exists. If it does and matches expected content, return `{ success: true, skipped: ['block already exists'] }`. If it exists but differs, return error (never silently overwrite).

- [ ] Task 3: Build Agent Object from Spec Data (AC: #1)
  - [ ] 3.1 Create a `buildAgentEntry(agentSpec)` helper that transforms spec agent data into the registry agent object format. Map: `id` → `id`, derive `name` from agent spec (first name or id-based), `icon` from spec or default `'\u{2699}'` (gear), `title` from role, `stream` from team context, `persona` object with role/identity/communication_style/expertise from agent spec fields.
  - [ ] 3.2 Create a `buildWorkflowEntries(agentSpec, workflowNames)` helper that creates the `{ name, agent }` entries matching the WORKFLOWS array format.
  - [ ] 3.3 Create a `derivePrefix(teamNameKebab)` helper: strip leading `_`, convert to SCREAMING_SNAKE_CASE (e.g., `test-team` → `TEST_TEAM`).

- [ ] Task 4: Update step-04-generate.md with Registry Wiring PART (AC: #1, #2)
  - [ ] 4.1 Add PART 10: REGISTRY WIRING between current PART 9 (activation validation) and current PART 10 (generation summary). Renumber current PART 10 to PART 11. Update all internal cross-references. CLI entry point must accept `--spec-file <path>` and `--registry-path <path>` arguments (default registry path: `scripts/update/lib/agent-registry.js` relative to project root). Content: (a) Run dirty-tree check first — if dirty, present diff and ask contributor, (b) If clean (or confirmed), run `node _bmad/bme/_team-factory/lib/writers/registry-writer.js --spec-file {spec_file_path} --registry-path scripts/update/lib/agent-registry.js`, (c) Present result: block added, exports updated, require() verification status.
  - [ ] 4.2 Update STEP VALIDATION table: add check for `agent-registry.js block added and require() passes`.
  - [ ] 4.3 Update CHECKPOINT: add registry wiring status showing block prefix, export count, verification status.
  - [ ] 4.4 Update context variables: add `registry_block_prefix`, `registry_wiring_result`.

- [ ] Task 5: Create Tests (AC: #1, #2, #3)
  - [ ] 5.1 Create `tests/team-factory/registry-writer.test.js`.
  - [ ] 5.2 Create `tests/team-factory/golden/golden-registry-block.js` — ≤50 lines, a reference module block for a minimal test team (2 agents, 2 workflows). Must match the Gyre block structure exactly. Use minimal persona text (1-2 words per field) to fit within 50 lines — the golden file tests structure, not content length.
  - [ ] 5.3 Test: happy path — spec → module block inserted, require() passes, exports updated.
  - [ ] 5.4 Test: idempotency — running twice returns `skipped` on second run.
  - [ ] 5.5 Test: dirty-tree detection — simulated dirty file triggers warning.
  - [ ] 5.6 Test: rollback on structural failure — corrupted write triggers rollback, .bak restored.
  - [ ] 5.7 Test: prefix collision — existing module prefix is detected and blocked.
  - [ ] 5.8 Test: additive-only — existing module blocks are preserved exactly.
  - [ ] 5.9 Test: require() post-write validation — modified file is loadable by Node.
  - [ ] 5.10 Test: special characters in persona fields — agent with single quotes and backslashes in persona text produces valid JS string literals.

- [ ] Task 6: Update factory-types.js (AC: #1)
  - [ ] 6.1 Add `RegistryResult` typedef: `{ success, written[], skipped[], errors[], rollbackApplied }`.
  - [ ] 6.2 Add `RegistryAgentEntry` typedef matching the agent-registry.js agent object shape.

- [ ] Task 7: Update workflow.md (AC: #1)
  - [ ] 7.1 Update Step 4 Story column from `2.6, 2.7` to `2.6, 2.7, 2.8`.
  - [ ] 7.2 Update Step 4 purpose to include registry wiring.

- [ ] Task 8: Verification
  - [ ] 8.1 Verify registry-writer.js follows Node.js CommonJS patterns.
  - [ ] 8.2 Verify generated module block matches Gyre block structure (same field order, same derived list pattern).
  - [ ] 8.3 Verify full Write Safety Protocol: stage → validate → check → apply → verify → rollback path.
  - [ ] 8.4 Verify additive-only: no modification or removal of existing blocks.
  - [ ] 8.5 Verify golden file is ≤50 lines.
  - [ ] 8.6 Run all tests: `node --test tests/team-factory/*.test.js` — all pass.
  - [ ] 8.7 Verify step-04 still follows step-file pattern.

## Dev Notes

### Key Architecture Decisions

1. **Full Write Safety Protocol — the only module that needs it.** `agent-registry.js` is a shared file consumed by refresh-installation, validator, convoke-doctor, installer, index.js, and migration-runner. Corruption here breaks the entire framework. The 5-stage protocol (stage → validate → check → apply → verify) with rollback is mandatory per architecture D-Q2.

2. **Dirty-tree detection runs per-write, not per-workflow.** The time gap between Step 0 and Step 4 (~40+ minutes) makes a startup-only check insufficient. The working tree can change between factory start and file write. Run `git diff --name-only` immediately before write.

3. **Post-write validation uses `node require()`.** The registry exports structured objects consumed by `require()`. If the modified file can be `require()`d without throwing, its structural integrity is confirmed. This is the strongest possible validation for a JS module.

4. **Rollback via .bak file.** Before applying the write, save the original file as `.bak`. If post-write verification fails, restore from `.bak`. Simple, reliable, and avoids git operations during write.

5. **Module block structure follows the Gyre pattern exactly.** The Gyre module block (lines 136-199 in agent-registry.js) is the reference implementation. `module.exports` (lines 201-214) is a separate shared section, not part of any module block. New module blocks must follow the same structure: section comment → AGENTS array → WORKFLOWS array → derived lists. The Vortex block is the first module and uses slightly different conventions (no section comment, inline arrays) — follow Gyre, not Vortex.

6. **D-Q6 deferred — direct write, not fragments.** The architecture notes D-Q6 (fragment-based registration) as an open question. For this story, implement direct write to agent-registry.js as specified. If D-Q6 is resolved later, registry-writer.js is replaced by a simpler fragment-creator.

7. **RegistryResult differs from CreatorResult intentionally.** Writers return `{ success, written[], skipped[], errors[], rollbackApplied }` per architecture enforcement rule 2. Creators (config-creator, csv-creator) return `{ success, filePath, errors[], collisions[] }`. This is the Writer vs Creator distinction from D-Q2 — do not unify the return shapes.

8. **PART 6 gap is intentional.** Step-04-generate.md has no PART 6 (removed during Story 2.7 renumbering). The gap is intentional. Do NOT fill it.

9. **String escaping for JS output.** All persona field values must have single quotes escaped (`\'`) when emitted into the JS module block. The existing Gyre and Vortex blocks use single-quoted strings consistently. See Gyre agents in agent-registry.js (lines 137-178) for real content length and escaping patterns. Persona fields are typically 1-3 sentences each.

10. **Persona fields come from generated agent .md files, not from AgentSpec.** The `AgentSpec` typedef in factory-types.js has `id`, `role`, `capabilities`, `pipeline_position`, `overlap_acknowledgments` — it does NOT have `name`, `icon`, `identity`, `communication_style`, or `expertise`. These persona/display fields must be extracted from the BMB-generated agent .md files during Step 4, or derived/defaulted by the registry-writer. The `buildAgentEntry` helper must accept enriched agent data beyond what AgentSpec provides.

11. **Path calculation from registry-writer.js.** The file lives at `_bmad/bme/_team-factory/lib/writers/registry-writer.js`. To reach `scripts/update/lib/agent-registry.js`, the path is `path.resolve(__dirname, '../../../../../scripts/update/lib/agent-registry.js')` (5 levels up to project root, then into scripts). Story 2.7 had a bug with wrong directory depth — verify this calculation.

### What NOT to Do

- Do NOT create `step-05-validate.md` — that's Story 2.9
- Do NOT create `manifest-tracker.js`, `naming-enforcer.js`, `cascade-logic.js`, `collision-detector.js` as separate modules
- Do NOT modify the Vortex or Gyre blocks in agent-registry.js — additive only
- Do NOT use ES modules (`import`/`export`) — use CommonJS (`require`/`module.exports`)
- Do NOT add new npm dependencies — `fs-extra`, `js-yaml`, `child_process` are all already available
- Do NOT use `eval()` or `new Function()` for JS validation — use `child_process.execSync` with `node -e "require(...)"` instead
- Do NOT modify config-creator.js, csv-creator.js, or activation-validator.js — those are Story 2.7 (done)

### Existing agent-registry.js Structure (Reference)

```javascript
// Top of file: 'use strict', AGENTS array (Vortex agents), WORKFLOWS array (Vortex workflows)
// Derived lists: AGENT_FILES, AGENT_IDS, WORKFLOW_NAMES, USER_GUIDES, WAVE3_WORKFLOW_NAMES

// ── Gyre Module ──────────────────────────────────────────────────────
const GYRE_AGENTS = [
  { id: 'stack-detective', name: 'Scout', icon: '\u{1F50E}',
    title: 'Stack Detective', stream: 'Detect',
    persona: { role: '...', identity: '...', communication_style: '...', expertise: '...' } },
  // ... more agents
];

const GYRE_WORKFLOWS = [
  { name: 'stack-detection', agent: 'stack-detective' },
  // ... more workflows
];

// Derived lists for Gyre
const GYRE_AGENT_FILES = GYRE_AGENTS.map(a => `${a.id}.md`);
const GYRE_AGENT_IDS = GYRE_AGENTS.map(a => a.id);
const GYRE_WORKFLOW_NAMES = GYRE_WORKFLOWS.map(w => w.name);

module.exports = {
  AGENTS,
  WORKFLOWS,
  AGENT_FILES,
  AGENT_IDS,
  WORKFLOW_NAMES,
  USER_GUIDES,
  WAVE3_WORKFLOW_NAMES,
  GYRE_AGENTS,
  GYRE_WORKFLOWS,
  GYRE_AGENT_FILES,
  GYRE_AGENT_IDS,
  GYRE_WORKFLOW_NAMES,
};
```

**Key observations:**
- Gyre section comment uses `// ── {Name} Module ──` with box-drawing characters and padding to ~72 chars
- Agent objects have: `id`, `name`, `icon` (unicode escape), `title`, `stream`, `persona` (with 4 fields)
- Workflow objects have: `name`, `agent`
- Derived lists use `.map()` on the module's own AGENTS/WORKFLOWS arrays
- `module.exports` is a single object at file end — new exports are appended before `};`
- Vortex has special `WAVE3_WORKFLOW_NAMES` — this is Vortex-specific, do NOT replicate for new teams

### Write Safety Protocol — Full Sequence

```
1. STAGE:   Build module block + export additions as strings (in memory, not on disk)
2. VALIDATE: Parse staged JS for syntax, check prefix uniqueness, verify additive-only
3. CHECK:   git diff --name-only on registry file → warn if dirty
4. APPLY:   Read file → save .bak → insert block + exports → write file
5. VERIFY:  Re-read → node require() → if fail: rollback from .bak
```

### Insertion Points

- **Module block:** Insert AFTER the last existing module block (currently Gyre, ending at line 199) and BEFORE `module.exports = {` (line 201). Do NOT insert between Vortex derived lists (lines 125-134) and the Gyre block.
- **Export entries:** Insert BEFORE the closing `};` of `module.exports`. Append one export name per line with a trailing comma, matching the existing one-per-line format.
- **Pattern:** Use string manipulation (find `module.exports = {` marker), NOT AST parsing. The file structure is simple and predictable.

### Context Variables Consumed from Step 4 (Stories 2.6-2.7)

- `team_name`: display name
- `team_name_kebab`: kebab-case for naming
- `spec_file_path`: path to the YAML spec file
- `module_root`: `_bmad/bme/_{team_name_kebab}/`
- `agent_files[]`: list of generated agent .md files
- `workflow_names{}`: map of agent_id → workflow_name
- `config_yaml_path`: path to created config.yaml (Story 2.7)
- `module_help_csv_path`: path to created module-help.csv (Story 2.7)

### Testing Standards

- Node.js built-in `node:test` framework (NOT Jest). Imports: `const { describe, it, before, after } = require('node:test')` and `const assert = require('node:assert/strict')`.
- File system utilities: `fs-extra` for temp dir cleanup, `fs.mkdtemp(path.join(os.tmpdir(), 'bmad-tf-'))` for test isolation.
- Run tests: `node --test tests/team-factory/*.test.js`
- Golden file tests: exact match against `tests/team-factory/golden/` files, ≤50 lines per golden file
- For require() tests: write the test registry file to tmpDir, use `require()` with absolute path, then `delete require.cache[absolutePath]` to avoid caching issues between tests.
- For dirty-tree tests: mock git by creating a wrapper or use `child_process.execSync` in tests with a test git repo.
- No external service calls — all file system operations use temp directories

### Previous Story Intelligence (from tf-2-7)

- Story 2.7 created config-creator.js, csv-creator.js, activation-validator.js in `_bmad/bme/_team-factory/lib/writers/`
- Simple safety protocol: write → verify parse. registry-writer.js uses Full protocol (different — stage/validate/check/apply/verify)
- Test isolation matters: Story 2.7 had a false collision from shared tmpDir. Use isolated tmpDir per test.
- Module path calculation: Story 2.7 code review found CLI `__dirname` path was 3 levels up instead of 4. Verify path calculations carefully.
- `factory-types.js` already has type definitions — extend it, don't duplicate
- Code review found 9 issues, all fixed. Key lessons: test self-collision exclusion, csvQuote falsy guard, dead imports

### References

- [Epic file: Story 2.8](/_bmad-output/planning-artifacts/epic-team-factory.md) — lines 419-433
- [Architecture: D-Q2 Format-Aware Writer Design](/_bmad-output/planning-artifacts/architecture-team-factory.md) — lines 340-366
- [Architecture: Write Safety Protocol](/_bmad-output/planning-artifacts/architecture-team-factory.md) — lines 102-110
- [Architecture: Write Boundaries](/_bmad-output/planning-artifacts/architecture-team-factory.md) — lines 781-788
- [Architecture: Enforcement Rules](/_bmad-output/planning-artifacts/architecture-team-factory.md) — lines 621-629
- [Architecture: Golden File Testing](/_bmad-output/planning-artifacts/architecture-team-factory.md) — lines 614-619
- [Architecture: D-Q6 Registry Fragment](/_bmad-output/planning-artifacts/architecture-team-factory.md) — lines 454-460
- [agent-registry.js](scripts/update/lib/agent-registry.js) — target file, Gyre block is reference pattern
- [step-04-generate.md](/.claude/skills/bmad-team-factory/step-04-generate.md) — target for PART addition
- [Previous story: tf-2-7](/_bmad-output/implementation-artifacts/tf-2-7-integration-wiring-config-csv-activation.md) — patterns, code review patches
- [factory-types.js](/_bmad/bme/_team-factory/lib/types/factory-types.js) — extend with RegistryResult typedef

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Completion Notes List

### Change Log

### File List
