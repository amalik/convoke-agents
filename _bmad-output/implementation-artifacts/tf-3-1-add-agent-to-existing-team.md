# Story 3.1: Add Agent to Existing Team

Status: review

## Story

As a framework contributor,
I want to add a new agent to an existing team with automated scope checking, registration, and contract wiring,
So that I can extend a team's capabilities without manually editing registry files, contracts, and configuration.

## Acceptance Criteria

1. **Given** a contributor wants to add an agent to an existing team
   **When** they invoke the Add Agent workflow
   **Then** the factory loads the existing team's spec file and composition pattern (TF-FR25)
   **And** the factory performs scope checking — verifying the new agent doesn't overlap with existing agents in the team
   **And** overlap detection runs against both the team's agents AND the full agent manifest

2. **Given** scope check passes (or overlap is acknowledged)
   **When** the new agent is defined
   **Then** the factory generates the agent artifact via BMB delegation
   **And** registration entries are added to agent-registry.js (appended to existing team's module block)
   **And** contract wiring is updated — new contracts created for agent handoffs if the team uses Sequential pattern
   **And** config.yaml is updated with the new agent entry
   **And** module-help.csv is updated with the new agent's help entry
   **And** all modifications follow the Write Safety Protocol and additive-only rules (TF-NFR17)
   **And** end-to-end validation confirms the extended team still passes all checks

3. **Given** all modifications complete
   **When** end-to-end validation runs
   **Then** the new agent appears in registry, config, and CSV
   **And** existing team agents are unchanged in all three files
   **And** new contracts (if Sequential) are syntactically valid
   **And** registry `require()` succeeds
   **And** Vortex regression passes

## Tasks / Subtasks

- [x] Task 1: Create Add Agent step file (AC: #1)
  - [x] 1.1 Create `step-add-agent.md` micro-file in `.claude/skills/bmad-team-factory/`
  - [x] 1.2 PART 1: Team discovery — list available teams from `_bmad/bme/` module directories, load selected team's spec file
  - [x] 1.3 PART 2: Agent definition — collect new agent ID, role, capabilities, persona, pipeline position (Sequential only)
  - [x] 1.4 PART 3: Scope check — overlap detection against team agents AND full agent-manifest.csv (reuse step-01-scope.md overlap logic)
  - [x] 1.5 PART 4: Contract design (Sequential only) — identify which handoffs the new agent participates in
  - [x] 1.6 PART 5: BMB delegation — generate agent .md, workflow dir, contracts (same pattern as step-04-generate.md PART 3)
  - [x] 1.7 PART 6: Integration wiring — call JS modules for registry append, config append, CSV append
  - [x] 1.8 PART 7: Validation — call end-to-end validator, present results
  - [x] 1.9 PART 8: Manifest and abort path
  - [x] 1.10 Add STEP VALIDATION table, Visibility Checklist, CHECKPOINT, NEXT pointer

- [x] Task 2: Create `registry-appender.js` — append agent to existing registry block (AC: #2)
  - [x] 2.1 Create `_bmad/bme/_team-factory/lib/writers/registry-appender.js`
  - [x] 2.2 Implement `appendAgentToBlock(specData, newAgentData, registryPath, options)` with Full Write Safety Protocol
  - [x] 2.3 Stage: locate existing module block by prefix, parse AGENTS array, build new agent entry, rebuild derived lists
  - [x] 2.4 Validate: brace balance, no duplicate agent ID in module, syntax check via temp-file `require()`
  - [x] 2.5 Check: dirty-tree detection per-write (not per-workflow)
  - [x] 2.6 Apply: save .bak, insert new agent entry into existing AGENTS array, regenerate AGENT_FILES/AGENT_IDS/WORKFLOW_NAMES
  - [x] 2.7 Verify: re-read file, `require()` succeeds, existing exports still accessible
  - [x] 2.8 Rollback: restore from .bak on verify failure
  - [x] 2.9 Add JSDoc types to factory-types.js (reuse RegistryResult shape)

- [x] Task 3: Create `config-appender.js` — append agent to existing config.yaml (AC: #2)
  - [x] 3.1 Create `_bmad/bme/_team-factory/lib/writers/config-appender.js`
  - [x] 3.2 Implement `appendConfigAgent(newAgentId, configPath)` → CreatorResult
  - [x] 3.3 Read existing config.yaml, parse YAML, validate structure
  - [x] 3.4 Append new agent ID to `agents` array, verify no duplicates
  - [x] 3.5 Write atomically (.tmp → validate YAML parse → rename)
  - [x] 3.6 Verify: re-read, confirm new agent present, existing agents unchanged

- [x] Task 4: Create `csv-appender.js` — append row to existing module-help.csv (AC: #2)
  - [x] 4.1 Create `_bmad/bme/_team-factory/lib/writers/csv-appender.js`
  - [x] 4.2 Implement `appendCsvRow(newRowData, csvPath)` → CreatorResult
  - [x] 4.3 Read existing CSV, validate header matches `CSV_HEADER` constant
  - [x] 4.4 Append new row (new agent's workflow entry), verify no duplicate workflow names
  - [x] 4.5 Write atomically (.tmp → validate header post-write → rename)

- [x] Task 5: Enhance end-to-end validator for extension operations (AC: #3)
  - [x] 5.1 Add `validateExtension(specData, extensionContext, projectRoot)` to `end-to-end-validator.js` (or create separate `extension-validator.js`)
  - [x] 5.2 New checks: AGENT-REGISTRY-APPEND, CONFIG-APPEND, CSV-APPEND
  - [x] 5.3 Regression checks: EXISTING-AGENTS-UNCHANGED (registry, config, CSV)
  - [x] 5.4 Include standard regression: REGISTRY-REGRESSION, VORTEX-REGRESSION
  - [x] 5.5 Maintain `{PROP}-{SEMANTIC-NAME}` check format and E2ECheck shape

- [x] Task 6: Update manifest-tracker for extension operations (AC: #3)
  - [x] 6.1 Ensure `buildManifest` handles extension context (3 modified files + new created files)
  - [x] 6.2 Verify `formatAbortInstructions` correctly generates `git checkout --` for modified team files and `rm` for new agent files

- [x] Task 7: Update workflow.md routing and write tests (AC: #1, #2, #3)
  - [x] 7.1 Add "Add Agent" route to workflow.md routing table
  - [x] 7.2 Write tests for registry-appender.js (happy path, duplicate detection, rollback, existing agents unchanged)
  - [x] 7.3 Write tests for config-appender.js (happy path, duplicate detection, atomic write, existing agents unchanged)
  - [x] 7.4 Write tests for csv-appender.js (happy path, duplicate workflow detection, header preservation)
  - [x] 7.5 Write/extend tests for extension validation checks
  - [x] 7.6 Update golden files if needed

## Dev Notes

### Critical Architecture Constraint: Modify vs. Create

This story marks the transition from **write-only** to **read-modify-write** operations. All Epic 2 JS modules were creators — they refused to write if files existed. This story must create NEW modules (appenders) that read, validate, modify, and write back existing files.

**DO NOT modify the existing creator modules** (config-creator.js, csv-creator.js). Create separate appender modules. The creators are still used for new team creation in Epic 2's flow.

**DO NOT modify registry-writer.js's `writeRegistryBlock` function**. It creates new module blocks. Create a separate `registry-appender.js` module with `appendAgentToBlock` that locates and modifies existing blocks.

### Registry Modification Pattern

The existing registry-writer.js creates new module blocks (Story 2.8). Story 3.1 needs to MODIFY existing blocks. Key differences:

- **Locate existing block**: Find the team's section comment (`// ── {Team Name} Module ──`) and its AGENTS array
- **Parse AGENTS array**: Extract existing agent entries as structured data
- **Append new entry**: Add new agent object to the AGENTS array
- **Regenerate derived lists**: Rebuild AGENT_FILES, AGENT_IDS arrays for that module only (not WORKFLOW_NAMES — those are separate)
- **Update module.exports**: Add new export names if any (unlikely — existing exports cover the team)

**Reuse from registry-writer.js:**
- `derivePrefix(teamName)` — derive SCREAMING_SNAKE_CASE prefix
- `buildAgentEntry(agentData)` — create agent object with persona
- `escapeSingleQuotes(str)` — handle JS string escaping
- `verifyRequire(registryPath)` — post-write validation via subprocess
- `checkDirtyTree(filePath)` — git diff check before write

**Reference implementation:** See existing Gyre/Vortex blocks in `scripts/update/lib/agent-registry.js` for the exact format of AGENTS arrays.

### Write Safety Protocol — Three Tiers

Per tf-epic-2 retro team agreement: "Stories that modify existing files (read-modify-write) get Full Write Safety Protocol treatment."

| Module | Protocol | Stages |
|--------|----------|--------|
| registry-appender.js | Full | Stage → Validate → Check → Apply → Verify → Rollback |
| config-appender.js | Enhanced Simple | Read → Validate → Write (.tmp) → Verify parse → Rename |
| csv-appender.js | Enhanced Simple | Read → Validate → Write (.tmp) → Verify header → Rename |

**Dirty-tree detection runs per-write** (not per-workflow). The time gap between registry write and config write means each file gets its own dirty-tree check.

### Existing Module APIs to Reuse (NOT modify)

| Module | Function | Reuse How |
|--------|----------|-----------|
| registry-writer.js | `derivePrefix()`, `buildAgentEntry()`, `escapeSingleQuotes()`, `verifyRequire()`, `checkDirtyTree()` | Import and call from registry-appender.js |
| config-creator.js | Config YAML schema knowledge | Reference for field validation, DO NOT import |
| csv-creator.js | `CSV_HEADER` constant, `csvQuote()` | Import for header validation and value quoting |
| activation-validator.js | `validateActivation()` | Call unchanged for new agent's activation block |
| end-to-end-validator.js | `validateTeam()` | Enhance or create parallel `validateExtension()` |
| manifest-tracker.js | `buildManifest()`, `formatManifest()`, `formatAbortInstructions()` | Reuse — manifest shape works for extensions |

### NFRs That Apply

- **NFR3:** Output passes validation on first run — zero manual fixes
- **NFR7:** Same validation rules as native teams
- **NFR11:** Error messages include step name, expected-vs-actual values, `{PROP}-{SEMANTIC-NAME}` check format
- **NFR12:** Dirty working tree warning before shared file writes
- **NFR13:** Modifications validated in isolation before applying
- **NFR15:** Config field entries don't collide with existing fields
- **NFR17:** Additive only — append, never modify or remove existing entries
- **NFR18:** Sequential per-agent processing, micro-file architecture

### Step File Architecture

The Add Agent step file follows the same structure as Steps 0-5:
```
PURPOSE → RULES → PARTs → STEP VALIDATION → Visibility Checklist (3/3 concept budget) → CHECKPOINT → NEXT
```

It's a single step file (not split across multiple stories like Step 1 was). The step file is gitignored (`.claude/` directory).

### Testing Pattern

Follow the established pattern from Stories 2.7-2.9:
- `tests/team-factory/` directory
- Node.js built-in `node:test` framework
- `fs-extra` for temp directories
- Golden files in `tests/team-factory/golden/` (if needed)
- `buildHappyContext(tmpDir)` helper pattern for creating real files on disk
- Fixture files in `tests/team-factory/fixtures/`

### Coordinated Error Recovery

If registry write succeeds but config write fails:
- Config rolls back (atomic write didn't complete)
- Registry does NOT auto-rollback (that would be destructive)
- Present error with manual recovery instructions: "Registry was modified. Config write failed. To revert registry: `git checkout -- scripts/update/lib/agent-registry.js`"
- Per TF-FR15: abort path LISTS files with removal instructions, does NOT auto-delete

### Project Structure Notes

- New modules go in `_bmad/bme/_team-factory/lib/writers/` (alongside existing creators)
- Tests go in `tests/team-factory/` (alongside existing test files)
- Step file goes in `.claude/skills/bmad-team-factory/` (gitignored)
- No new directories needed — all paths exist

### References

- [Source: _bmad-output/planning-artifacts/epic-team-factory.md#Epic 3] — Story 3.1 ACs, TF-FR25
- [Source: _bmad-output/planning-artifacts/architecture-team-factory.md#D-Q2] — Write Safety Protocol
- [Source: _bmad-output/planning-artifacts/architecture-team-factory.md#NFR17] — Additive-only enforcement
- [Source: _bmad/bme/_team-factory/lib/writers/registry-writer.js] — Full Write Safety reference implementation
- [Source: _bmad/bme/_team-factory/lib/writers/config-creator.js] — Config schema reference
- [Source: _bmad/bme/_team-factory/lib/writers/csv-creator.js] — CSV format reference
- [Source: _bmad/bme/_team-factory/lib/validators/end-to-end-validator.js] — Validation check patterns
- [Source: _bmad-output/implementation-artifacts/tf-2-8-registry-wiring-write-safety.md] — Write Safety dev notes
- [Source: _bmad-output/implementation-artifacts/tf-2-9-end-to-end-validation-error-recovery.md] — Validation dev notes
- [Source: _bmad-output/implementation-artifacts/tf-epic-2-retro-2026-03-25.md] — Team agreements for Epic 3

## Previous Story Intelligence

### From Story 2.9 (End-to-End Validation)

- End-to-end validator is NOT an extension of validator.js (hardcoded to Vortex). Created separate `end-to-end-validator.js` in factory lib.
- File manifest built from generation context variables, not filesystem scanning.
- Abort does NOT auto-delete — lists files with `rm` / `git checkout --` instructions.
- VORTEX-REGRESSION correctly surfaces pre-existing Enhance module validation issue — test accommodates this.
- Code review patches: replaced magic number "5" with `buildExportNames('X').length`, quoted paths in abort instructions.

### From Story 2.8 (Registry Wiring)

- Full Write Safety Protocol is mandatory for registry — shared file consumed by 6+ modules.
- Dirty-tree detection runs per-write. Working tree changes between factory start and write.
- Post-write validation uses `node require()` via subprocess — if file loads without throwing, structural integrity confirmed.
- Rollback via .bak file — save original before apply, restore on verify failure.
- Module block structure follows Gyre block pattern (lines 136-199 in agent-registry.js).
- String escaping: persona field values must have single quotes escaped when emitted into JS.
- Code review findings: uncaught throws, brace-counting false positives, newline escaping, stale .bak detection.

### From Story 2.7 (Integration Wiring)

- Config-creator and csv-creator use "Simple" safety protocol (write → verify parse).
- `CSV_HEADER` constant defined in csv-creator.js — reuse for header validation in csv-appender.
- `csvQuote()` function handles value quoting safely.
- Template substitution uses hand-rolled safe replacer (whitelist-only variables).
- Code review findings: test isolation matters (shared tmpDir causes false collisions), module path calculation depth issues.

## Dev Agent Record

### Agent Model Used
Claude Opus 4.6

### Debug Log References
N/A — all tests passed on first run

### Completion Notes List
- All 3 appender modules follow the safety protocol tiers from the retro team agreement
- `findArrayClose()` bracket-depth parser handles nested objects, strings with brackets, escaped characters
- Extension validator reuses regression checks from team validator (REGISTRY-REGRESSION, VORTEX-REGRESSION)
- `buildExtensionManifest` correctly marks config/csv/registry as "modified" (not "created")
- Route 2 in step-00-route.md updated from "not yet available" to "available"
- No golden files needed updating — extension tests use their own fixtures

### Change Log
- Created `_bmad/bme/_team-factory/lib/writers/registry-appender.js` (219 lines)
- Created `_bmad/bme/_team-factory/lib/writers/config-appender.js` (78 lines)
- Created `_bmad/bme/_team-factory/lib/writers/csv-appender.js` (108 lines)
- Created `tests/team-factory/registry-appender.test.js` (8 tests)
- Created `tests/team-factory/config-appender.test.js` (7 tests)
- Created `tests/team-factory/csv-appender.test.js` (7 tests)
- Created `tests/team-factory/extension-validator.test.js` (8 tests)
- Modified `_bmad/bme/_team-factory/lib/validators/end-to-end-validator.js` — added `validateExtension()`
- Modified `_bmad/bme/_team-factory/lib/manifest-tracker.js` — added `buildExtensionManifest()`
- Modified `tests/team-factory/manifest-tracker.test.js` — added 4 extension manifest tests
- Created `.claude/skills/bmad-team-factory/step-add-agent.md` (gitignored)
- Modified `.claude/skills/bmad-team-factory/workflow.md` — added Step A route
- Modified `.claude/skills/bmad-team-factory/step-00-route.md` — Route 2 now available

### File List
- `_bmad/bme/_team-factory/lib/writers/registry-appender.js`
- `_bmad/bme/_team-factory/lib/writers/config-appender.js`
- `_bmad/bme/_team-factory/lib/writers/csv-appender.js`
- `_bmad/bme/_team-factory/lib/validators/end-to-end-validator.js`
- `_bmad/bme/_team-factory/lib/manifest-tracker.js`
- `tests/team-factory/registry-appender.test.js`
- `tests/team-factory/config-appender.test.js`
- `tests/team-factory/csv-appender.test.js`
- `tests/team-factory/extension-validator.test.js`
- `tests/team-factory/manifest-tracker.test.js`
- `.claude/skills/bmad-team-factory/step-add-agent.md`
- `.claude/skills/bmad-team-factory/workflow.md`
- `.claude/skills/bmad-team-factory/step-00-route.md`
