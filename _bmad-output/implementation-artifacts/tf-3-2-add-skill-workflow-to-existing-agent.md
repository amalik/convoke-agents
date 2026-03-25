# Story 3.2: Add Skill/Workflow to Existing Agent

Status: review

## Story

As a framework contributor,
I want to add a new skill or workflow to an existing agent with automated manifest and menu wiring,
So that I can extend an agent's capabilities without manually editing multiple files.

## Acceptance Criteria

1. **Given** a contributor wants to add a skill or workflow to an existing agent
   **When** they invoke the Add Skill workflow
   **Then** the factory identifies the target agent and its team context (TF-FR26)
   **And** the factory generates the skill/workflow template via BMB delegation

2. **Given** the skill/workflow artifact is generated
   **When** integration wiring runs
   **Then** the agent's config.yaml `workflows` array is updated with the new workflow name
   **And** a new row is appended to the team's module-help.csv for the workflow
   **And** a new entry is appended to the team's WORKFLOWS array in agent-registry.js
   **And** the agent's activation `<menu>` section is updated with a new `<item>` for the workflow
   **And** if the skill has dependencies on other agents, contract wiring is validated
   **And** all modifications follow the Write Safety Protocol and additive-only rules (TF-NFR17)
   **And** end-to-end validation confirms the agent and its team still pass all checks

## Tasks / Subtasks

- [ ] Task 1: Create Add Skill step file (AC: #1)
  - [ ] 1.1 Create `step-add-skill.md` micro-file in `.claude/skills/bmad-team-factory/`
  - [ ] 1.2 PART 1: Team & Agent Discovery — list available teams, load team config, list agents in team, select target agent
  - [ ] 1.3 PART 2: Skill/Workflow Definition — collect workflow name (kebab-case), description, output location, template needs
  - [ ] 1.4 PART 3: BMB Delegation — generate workflow directory structure (workflow.md, template, optional steps/)
  - [ ] 1.5 PART 4: Integration Wiring — call JS modules for config workflow append, CSV row append, registry workflow append
  - [ ] 1.6 PART 5: Activation Menu Patching — read agent .md file, locate `<menu>` section, insert new `<item>` before `</menu>` with workflow exec path and display name
  - [ ] 1.7 PART 6: Validation — call end-to-end validator, present results
  - [ ] 1.8 PART 7: Manifest and abort path
  - [ ] 1.9 Add STEP VALIDATION table, Visibility Checklist, CHECKPOINT, NEXT pointer

- [ ] Task 2: Create `config-workflow-appender.js` — append workflow to existing config.yaml (AC: #2)
  - [ ] 2.1 Add `appendConfigWorkflow(newWorkflowName, configPath, options)` to `config-appender.js` (extend existing module)
  - [ ] 2.2 Read existing config.yaml, parse YAML, validate `workflows` array exists
  - [ ] 2.3 Duplicate check: skip if workflow name already in array
  - [ ] 2.4 Append new workflow name to `workflows` array
  - [ ] 2.5 Write atomically (.tmp → validate YAML parse → rename)
  - [ ] 2.6 Enhanced Simple safety protocol (same as `appendConfigAgent`)
  - [ ] 2.7 Dirty-tree detection per-write with `skipDirtyCheck` option

- [ ] Task 3: Create `registry-workflow-appender.js` — append workflow entry to existing WORKFLOWS array (AC: #2)
  - [ ] 3.1 Add `appendWorkflowToBlock(teamNameKebab, workflowName, agentId, registryPath, options)` to `registry-appender.js` (extend existing module)
  - [ ] 3.2 Locate existing `const {PREFIX}_WORKFLOWS = [` array using `derivePrefix`
  - [ ] 3.3 Duplicate check: skip if `{ name: 'workflowName', agent: 'agentId' }` already exists
  - [ ] 3.4 Append new entry before closing `];` using `findArrayClose` (already exported)
  - [ ] 3.5 Full Write Safety Protocol: backup → insert → `verifyRequire()` → rollback on failure
  - [ ] 3.6 Dirty-tree detection per-write

- [ ] Task 4: Extend end-to-end validator for skill extension (AC: #2)
  - [ ] 4.1 Add `validateSkillExtension(specData, skillContext, projectRoot)` to `end-to-end-validator.js`
  - [ ] 4.2 New checks: WORKFLOW-REGISTRY-APPEND, CONFIG-WORKFLOW-APPEND, CSV-WORKFLOW-APPEND, WORKFLOW-FILE-EXISTS
  - [ ] 4.3 WORKFLOW-FILE-EXISTS check: verify generated workflow directory and workflow.md exist on disk after BMB delegation
  - [ ] 4.4 Regression checks: EXISTING-WORKFLOWS-UNCHANGED (registry, config, CSV)
  - [ ] 4.5 Maintain `{PROP}-{SEMANTIC-NAME}` check format and E2ECheck shape

- [ ] Task 5: Update manifest-tracker for skill extension (AC: #2)
  - [ ] 5.1 Add `buildSkillExtensionManifest(skillContext)` to `manifest-tracker.js`
  - [ ] 5.2 Mark new workflow directory/files as "created", config/csv/registry as "modified"
  - [ ] 5.3 Verify `formatAbortInstructions` correctly generates cleanup for workflow files

- [ ] Task 6: Update routing and write tests (AC: #1, #2)
  - [ ] 6.1 Update Route 3 in `step-00-route.md` from "not yet available" to "available"
  - [ ] 6.2 Add Step S route to `workflow.md` routing table
  - [ ] 6.3 Write tests for `appendConfigWorkflow` (happy path, duplicate detection, atomic write, existing workflows unchanged)
  - [ ] 6.4 Write tests for `appendWorkflowToBlock` (happy path, duplicate detection, rollback, existing workflows unchanged)
  - [ ] 6.5 Write/extend tests for skill extension validation checks
  - [ ] 6.6 Write/extend tests for skill extension manifest

## Dev Notes

### Core Pattern: Reuse + Extend from Story 3.1

Story 3.1 established the read-modify-write pattern with three appender modules. Story 3.2 **extends the same modules** rather than creating new files. The operation is structurally identical — append to existing arrays — but targets different arrays:

| Story 3.1 (Add Agent) | Story 3.2 (Add Skill) |
|------------------------|----------------------|
| Append to `agents` array in config.yaml | Append to `workflows` array in config.yaml |
| Append agent object to `{PREFIX}_AGENTS` array | Append workflow object to `{PREFIX}_WORKFLOWS` array |
| Append row for new agent in CSV | Append row for new workflow in CSV |

### Module Extension Strategy

**DO NOT create new files.** Extend existing appender modules with new functions:

| Module | Existing Function | New Function to Add |
|--------|-------------------|-------------------|
| `config-appender.js` | `appendConfigAgent(newAgentId, configPath, options)` | `appendConfigWorkflow(newWorkflowName, configPath, options)` |
| `registry-appender.js` | `appendAgentToBlock(teamNameKebab, newAgentData, registryPath, options)` | `appendWorkflowToBlock(teamNameKebab, workflowName, agentId, registryPath, options)` |
| `csv-appender.js` | `appendCsvRow(rowData, csvPath, options)` | **No change needed** — `appendCsvRow` already accepts workflow-level `rowData` (see below) |
| `end-to-end-validator.js` | `validateExtension(specData, extensionContext, projectRoot)` | Add `validateSkillExtension(specData, skillContext, projectRoot)` |
| `manifest-tracker.js` | `buildExtensionManifest(extensionContext)` | Add `buildSkillExtensionManifest(skillContext)` |

### csv-appender.js Already Handles Workflow Rows

The existing `appendCsvRow` function (from Story 3.1) was designed for workflow-level rows, not agent-level rows. It accepts `rowData` with fields: `module`, `workflowName`, `agentId`, `agentRole`, `teamNameKebab`, `outputLocation`. This is exactly what Add Skill needs — no CSV appender changes required.

### Config Workflow Append — Near-Identical to Config Agent Append

`appendConfigWorkflow(newWorkflowName, configPath, options)`:
- Read config.yaml, parse YAML
- Validate `config.workflows` array exists (same pattern as `config.agents` check)
- Duplicate check: `config.workflows.includes(newWorkflowName)`
- Append, atomic write, verify
- Same Enhanced Simple safety protocol

**Key difference from agent append:** Target array is `workflows` not `agents`.

### Registry Workflow Append — Reuses findArrayClose

`appendWorkflowToBlock(teamNameKebab, workflowName, agentId, registryPath, options)`:
- Uses `derivePrefix(teamNameKebab)` to get prefix
- Locates `const {PREFIX}_WORKFLOWS = [` (not `_AGENTS`)
- Uses existing `findArrayClose()` to find closing `];`
- Inserts `  { name: '${workflowName}', agent: '${agentId}' },` before closing bracket
- Full Write Safety Protocol: backup → insert → `verifyRequire()` → rollback

**Entry format** (from existing registry blocks):
```javascript
  { name: 'stack-detection', agent: 'stack-detective' },
```

Simple `{ name, agent }` objects — no nested persona like AGENTS entries.

### Workflow Directory Structure to Generate

BMB delegation creates the workflow directory under the team's `workflows/` folder:
```
_bmad/bme/_{team}/workflows/{workflow-name}/
  ├── workflow.md           # Entry point with frontmatter
  ├── {workflow-name}.template.md  # Output template
  └── (optional) steps/     # Step files if multi-step
```

The step file (step-add-skill.md) instructs BMB to generate these files using the same delegation pattern as step-04-generate.md PART 3.

### Activation Menu Patching — LLM Task (Not JS Module)

Agent `.md` files contain `<activation>` XML blocks with a `<menu>` section listing available workflows:
```xml
<item cmd="LP or fuzzy match on lean-persona" exec="{project-root}/_bmad/bme/_vortex/workflows/lean-persona/workflow.md">
  [LP] Create Lean Persona: Rapid user persona in 6 steps
</item>
```

Adding a workflow requires inserting a new `<item>` before the `</menu>` closing tag. This is an **LLM task in the step file** (not a JS module) because:
- The XML is embedded in markdown (not standalone XML)
- Parsing requires markdown-aware context (find activation block first)
- The `cmd` value uses `deriveCode()` convention (2-letter code from workflow name)
- The `exec` path follows pattern: `{project-root}/_bmad/bme/_{team}/workflows/{workflow-name}/workflow.md`

The step file (PART 5) instructs the LLM to:
1. Read the agent's `.md` file
2. Locate the `<menu>` section within `<activation>`
3. Generate the new `<item>` tag with correct `cmd`, `exec`, and display text
4. Insert before `</menu>`
5. Write back the modified file

**This file is also tracked in the manifest** as "modified" (alongside config, CSV, registry).

### Write Safety Protocol — Same Tiers as Story 3.1

| Module | Protocol | Stages |
|--------|----------|--------|
| registry-appender.js (new function) | Full | Stage → Validate → Check → Apply → Verify → Rollback |
| config-appender.js (new function) | Enhanced Simple | Read → Validate → Write (.tmp) → Verify parse → Rename |
| csv-appender.js (reused as-is) | Enhanced Simple | Read → Validate → Write (.tmp) → Verify header → Rename |

### Existing Module APIs to Reuse (NOT modify)

| Module | Function | Reuse How |
|--------|----------|-----------|
| registry-appender.js | `findArrayClose()`, `fail()` | Internal reuse within same module |
| registry-writer.js | `derivePrefix()`, `escapeSingleQuotes()`, `verifyRequire()`, `checkDirtyTree()` | Import (already imported by registry-appender) |
| csv-appender.js | `appendCsvRow()` | Call directly — no modifications needed |
| csv-creator.js | `CSV_HEADER`, `formatCsvRow()`, `csvQuote()`, `deriveCode()`, `toTitleCase()` | Already imported by csv-appender |
| config-appender.js | Internal patterns (YAML read/parse/validate/write) | Copy pattern for new function in same module |

### NFRs That Apply

- **NFR3:** Output passes validation on first run — zero manual fixes
- **NFR7:** Same validation rules as native teams
- **NFR11:** Error messages include step name, expected-vs-actual, `{PROP}-{SEMANTIC-NAME}` format
- **NFR12:** Dirty working tree warning before shared file writes
- **NFR13:** Modifications validated in isolation before applying
- **NFR15:** Config field entries don't collide with existing fields
- **NFR17:** Additive only — append, never modify or remove existing entries
- **NFR18:** Sequential per-agent processing, micro-file architecture

### Step File Architecture

The Add Skill step file follows the same structure as step-add-agent.md:
```
PURPOSE → RULES → PARTs → STEP VALIDATION → Visibility Checklist (3/3 concept budget) → CHECKPOINT → NEXT
```

Simpler than Add Agent — no scope/overlap detection needed, no contract design. PARTs:
1. Team & Agent Discovery (pick team → pick agent)
2. Skill/Workflow Definition (name, description, output)
3. BMB Delegation (generate workflow dir + files)
4. Integration Wiring (config + CSV + registry appends)
5. Activation Menu Patching (insert `<item>` into agent .md `<menu>`)
6. Validation (end-to-end validator)
7. Manifest and abort path

### Validation Checks for Skill Extension

New checks in `validateSkillExtension`:

| Check Name | What It Validates |
|-----------|-------------------|
| WORKFLOW-REGISTRY-APPEND | New workflow entry exists in `{PREFIX}_WORKFLOWS` array |
| CONFIG-WORKFLOW-APPEND | New workflow name exists in config.yaml `workflows` array |
| CSV-WORKFLOW-APPEND | New row exists in module-help.csv with correct workflow name |
| WORKFLOW-FILE-EXISTS | Generated workflow directory and `workflow.md` exist on disk |
| ACTIVATION-MENU-UPDATED | Agent .md file `<menu>` section contains new `<item>` with correct `exec` path |
| EXISTING-WORKFLOWS-REGISTRY | Pre-existing workflow entries unchanged in registry |
| EXISTING-WORKFLOWS-CONFIG | Pre-existing workflows unchanged in config.yaml |
| EXISTING-WORKFLOWS-CSV | Pre-existing CSV rows unchanged (row count >= original + 1) |

Plus standard regression: REGISTRY-REGRESSION, VORTEX-REGRESSION (reuse from existing validator).

### Skill Extension Manifest

`buildSkillExtensionManifest(skillContext)` shape:

```javascript
{
  teamName: 'gyre',
  agentId: 'stack-detective',
  workflowName: 'new-workflow',
  files: [
    { path: '_bmad/bme/_gyre/workflows/new-workflow/workflow.md', operation: 'created' },
    { path: '_bmad/bme/_gyre/workflows/new-workflow/new-workflow.template.md', operation: 'created' },
    { path: '_bmad/bme/_gyre/agents/stack-detective.md', operation: 'modified' },
    { path: '_bmad/bme/_gyre/config.yaml', operation: 'modified' },
    { path: '_bmad/bme/_gyre/module-help.csv', operation: 'modified' },
    { path: 'scripts/update/lib/agent-registry.js', operation: 'modified' },
  ]
}
```

### Testing Pattern

Follow established pattern from Story 3.1:
- `tests/team-factory/` directory
- Node.js built-in `node:test` framework
- `fs-extra` for temp directories
- Extend existing test files where the new function is added to an existing module

**Test file mapping:**
| New Function | Test File |
|-------------|-----------|
| `appendConfigWorkflow` | Extend `tests/team-factory/config-appender.test.js` |
| `appendWorkflowToBlock` | Extend `tests/team-factory/registry-appender.test.js` |
| `validateSkillExtension` | Extend `tests/team-factory/extension-validator.test.js` |
| `buildSkillExtensionManifest` | Extend `tests/team-factory/manifest-tracker.test.js` |

Per Epic 2 retro team agreement: "Test suites extend existing fixtures rather than duplicating."

### Coordinated Error Recovery

Same pattern as Story 3.1:
- If registry write succeeds but config write fails: present error with manual recovery instructions
- Per TF-FR15: abort path LISTS files with removal instructions, does NOT auto-delete
- `formatAbortInstructions` handles `git checkout --` for modified files and `rm` for created files

### Project Structure Notes

- New functions added to existing modules in `_bmad/bme/_team-factory/lib/writers/` and `_bmad/bme/_team-factory/lib/validators/`
- Tests extend existing files in `tests/team-factory/`
- Step file goes in `.claude/skills/bmad-team-factory/` (gitignored)
- No new directories needed — all paths exist

### References

- [Source: _bmad-output/planning-artifacts/epic-team-factory.md#Story 3.2] — Story ACs, TF-FR26
- [Source: _bmad-output/planning-artifacts/architecture-team-factory.md#D-Q2] — Write Safety Protocol
- [Source: _bmad-output/planning-artifacts/architecture-team-factory.md#FR26] — Add Skill planned location
- [Source: _bmad-output/planning-artifacts/architecture-team-factory.md#NFR17] — Additive-only enforcement
- [Source: _bmad/bme/_team-factory/lib/writers/registry-appender.js] — Registry append reference (AGENTS pattern to replicate for WORKFLOWS)
- [Source: _bmad/bme/_team-factory/lib/writers/config-appender.js] — Config append reference (agents pattern to replicate for workflows)
- [Source: _bmad/bme/_team-factory/lib/writers/csv-appender.js] — CSV append (reuse as-is)
- [Source: _bmad/bme/_team-factory/lib/validators/end-to-end-validator.js] — Extension validation pattern
- [Source: _bmad/bme/_team-factory/lib/manifest-tracker.js] — Extension manifest pattern
- [Source: _bmad-output/implementation-artifacts/tf-3-1-add-agent-to-existing-team.md] — Previous story patterns
- [Source: _bmad-output/implementation-artifacts/tf-epic-2-retro-2026-03-25.md] — Team agreements for Epic 3
- [Source: scripts/update/lib/agent-registry.js] — WORKFLOWS array format reference

## Previous Story Intelligence

### From Story 3.1 (Add Agent to Existing Team)

- Three appender modules created: `registry-appender.js` (Full Write Safety), `config-appender.js` (Enhanced Simple), `csv-appender.js` (Enhanced Simple)
- `findArrayClose()` bracket-depth parser handles nested objects, strings, escaped characters, line comments, block comments — reuse for WORKFLOWS array
- Extension validator added `validateExtension()` with 6 check types — replicate pattern for skill extension
- `buildExtensionManifest()` correctly marks new files as "created" and config/csv/registry as "modified"
- Route 2 in step-00-route.md updated from "not yet available" to "available" — do same for Route 3
- Code review patches: comment-skipping in findArrayClose (F1), dirty-tree detection in all appenders (F12), CSV column parsing for duplicate check (F6), registry scope graceful skip (F13)
- `checkExistingAgentsRegistry()` skips gracefully when agents are team-local only — apply same pattern for workflows
- No golden files needed updating for extension tests — extension tests use their own fixtures
- All tests use `skipDirtyCheck: true` option in test calls

### From Story 2.8 (Registry Wiring)

- Full Write Safety Protocol is mandatory for registry modifications
- Post-write validation uses `node require()` via subprocess
- Rollback via .bak file pattern
- String escaping: single quotes must be escaped in JS string values
- WORKFLOWS array entries are simpler than AGENTS: `{ name: 'x', agent: 'y' }` — no persona nesting

### From Story 2.7 (Integration Wiring)

- `CSV_HEADER` constant and `formatCsvRow()` already handle workflow row format
- `deriveCode()` generates 2-letter codes from kebab-case names
- `toTitleCase()` converts kebab-case to Title Case for display names

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
