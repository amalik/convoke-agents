# Story p2-3.4: CI Content Correctness & Vortex Compass Validation

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a maintainer,
I want CI-level validation that catches stale cross-references, mismatched fields, and structural inconsistencies across agent definitions, workflow references, and handoff schemas -- plus validation that the Vortex Compass provides prerequisite guidance,
So that content correctness drift is caught automatically and users get helpful guidance when invoking agents without required inputs.

## Acceptance Criteria

1. **Given** agent definitions, workflow manifests, and handoff schemas exist in the project, **When** CI runs the content correctness validation suite, **Then** it detects stale cross-references between agents and workflows (FR20)
2. **And** it detects mismatched fields between handoff schemas and agent definitions (FR20)
3. **And** it detects structural inconsistencies in agent definitions and workflow references (FR20)
4. **And** cosmetic changes (whitespace, formatting) do not trigger false failures (NFR4)
5. **And** adding a new agent to the registry automatically includes it in content correctness validation without modifying test code (NFR5)
6. **Given** a user attempts to invoke an agent without required input artifacts, **When** the Vortex Compass intercepts the invocation, **Then** the user receives prerequisite guidance identifying which artifacts are missing and which agent/workflow produces them (FR31)
7. **And** validation confirms this existing Compass behavior works correctly (scope: behavior validation, not new feature development)

## Tasks / Subtasks

- [x] Task 1: Create `tests/p0/p0-content-correctness.test.js` — file setup and parsing utilities (AC: 1, 3, 4, 5)
  - [x] 1.1: Create file with `'use strict'` + `node:test` + `node:assert/strict` + `fs` + `path` imports
  - [x] 1.2: Import from `./helpers`: `discoverAgents`, `VORTEX_DIR`, `STEP_PATTERN` — no other helpers needed (WORKFLOWS_DIR is NOT needed — workflow dirs come from `agent.workflowDirs` via discoverAgents)
  - [x] 1.3: Define `COMPASS_REF = path.join(VORTEX_DIR, 'compass-routing-reference.md')`
  - [x] 1.4: Create `findFinalStepFile(workflowDir)` utility — reads `steps/` subdirectory, filters by STEP_PATTERN, sorts, returns the last (highest-numbered) step file path; returns `null` if no steps found
  - [x] 1.5: Create `extractCompassSection(content)` utility — extracts the `## Vortex Compass` section from step file content; returns the section content as string or `null` if no compass section exists
  - [x] 1.6: Create `parseCompassTable(compassContent)` utility — parses the markdown table into `{ headers: string[], rows: Array<{ condition, workflow, agent, why }>, hasFooter: boolean }`; returns `null` if no valid table found
  - [x] 1.7: Create `extractAgentName(agentCell)` utility — extracts the lowercase agent name from a compass table Agent cell (e.g., `"Mila 🔬"` → `"mila"`)
  - [x] 1.8: Call `discoverAgents()` at module level, build `allWorkflows` array (flatMap workflowNames/workflowDirs), build `agentNameMap` (NFR5)

- [x] Task 2: Define constants and expected data (AC: 1, 5, 6)
  - [x] 2.1: Define `COMPASS_EXEMPT = ['vortex-navigation']` — workflows that intentionally have NO compass table (vortex-navigation IS the terminal navigation tool)
  - [x] 2.2: Build `allWorkflows` from `agents.flatMap()` — each entry: `{ name, dir, agentName, agentId }` — dynamically derived from discoverAgents (NFR5)
  - [x] 2.3: Build `agentNameMap` from `discoverAgents()` — same pattern as p0-handoff-contracts.test.js: `agent.name.toLowerCase()` → `agent`
  - [x] 2.4: Build `registeredWorkflowNames` set from `allWorkflows.map(w => w.name)` — for cross-reference lookups

- [x] Task 3: Test Suite — Compass Table Presence (AC: 3, 6, 7)
  - [x] 3.1: Vacuous pass guard — assert at least 20 workflows have compass tables (22 total - 1 exempt = 21 expected, assert ≥20 for tolerance)
  - [x] 3.2: Per non-exempt workflow: final step file has `## Vortex Compass` heading — diagnostic: `"${workflowName} (${agentName}): final step ${stepFile} missing ## Vortex Compass section"`
  - [x] 3.3: Per exempt workflow (vortex-navigation): confirm NO `## Vortex Compass` heading in final step — validates the exemption is correct, not just skipped

- [x] Task 4: Test Suite — Compass Table Format & Routing Validity (AC: 1, 2, 3, 4, 6, 7)
  - [x] 4.1: Per non-exempt workflow: compass table has 4-column headers matching `['If you learned...', 'Consider next...', 'Agent', 'Why']` — case-insensitive comparison (NFR4)
  - [x] 4.2: Per non-exempt workflow: compass table has 2-3 data rows — per D4 format specification
  - [x] 4.3: Per non-exempt workflow: compass section includes footer note containing `"evidence-based recommendations"` — per D4 format specification
  - [x] 4.4: Per non-exempt workflow: ALL agent references in compass table rows match registered agents — extract agent name from each row's Agent cell, verify it exists in `agentNameMap`; diagnostic: `"${workflowName}: compass row ${i} references unknown agent '${agentRef}' — registered: [${registeredNames}]"`
  - [x] 4.5: Per non-exempt workflow: ALL workflow references in compass table rows match registered workflows — extract workflow name from each row's workflow cell, verify it exists in `registeredWorkflowNames`; diagnostic: `"${workflowName}: compass row ${i} references unknown workflow '${wfRef}' — registered: [${registeredNames}]"`

- [x] Task 5: Test Suite — Cross-Reference Integrity (AC: 1, 2, 3, 5)
  - [x] 5.1: Vacuous pass guard — compass-routing-reference.md exists and is non-empty
  - [x] 5.2: Compass routing reference mentions all 7 registered agent short names (dynamically discovered from agentNameMap)
  - [x] 5.3: Compass routing reference mentions all 22 registered workflow names (dynamically discovered from registeredWorkflowNames)
  - [x] 5.4: Per agent: all `workflowDirs` from `discoverAgents()` exist as actual filesystem directories — validates agent-registry → filesystem consistency (note: p0-workflow-structure.test.js also validates directory existence, but from the workflow-structure angle; this validates from the registry-accuracy angle)
  - [x] 5.5: Per workflow with compass: compass table routing targets reference at least one workflow owned by a DIFFERENT agent — validates cross-agent routing (not self-referential loops)

- [x] Task 6: Validation — run full test suite and verify (AC: all)
  - [x] 6.1: Run `npm run test:p0` — all P0 tests pass (468 existing + 174 new = 642 total)
  - [x] 6.2: Run `npm run test:p0:gate` — verify gate passes
  - [x] 6.3: Run `npm test` — existing unit tests pass (248 pass, zero regressions)
  - [x] 6.4: Run `npm run lint` — zero errors, zero warnings
  - [x] 6.5: Verify all assertion messages include workflow name, agent name, and specific field/section for diagnostics (NFR2, FR15)
  - [x] 6.6: Verify new test file is auto-discovered by `npm run test:p0` glob pattern `tests/p0/*.test.js`

## Dev Notes

### Scope & Split Assessment

This story has one deliverable: a single P0 test file validating content correctness across the Vortex system. Analysis: **NO SPLIT NEEDED.** The test file validates compass table presence/format, routing reference validity, and cross-reference integrity. All tests operate on the same set of workflow step files and reference documents. Expected: ~45-55 tests in 1 new file.

**Expected test counts:**
- Vacuous pass guards: 2
- Compass presence: ~22 (21 non-exempt + 1 exempt validation)
- Compass format & routing: ~21 (per non-exempt workflow)
- Cross-reference integrity: ~12 (reference file + 7 agents + workflow dirs)
- **Total: ~55-60 new tests. P0 suite total: 468 + ~55 = ~525.**

### Architecture Compliance

- **Language:** JavaScript ES2020+ — NO TypeScript
- **Test framework:** `node:test` + `node:assert/strict` — NOT Jest
- **Coverage:** c8 (`npm run test:coverage` includes P0 tests)
- **No new dependencies:** Use only existing deps — NO YAML parsing library, parse with regex
- **Linting:** Must pass `npm run lint` (ESLint)
- **File naming:** kebab-case for JS files, camelCase for variables

### Critical: Compass Table Format (D4 Specification)

All workflow step files use this uniform compass format (from `compass-routing-reference.md` D4):

```markdown
## Vortex Compass

Based on what you just completed, here are your evidence-driven options:

| If you learned... | Consider next... | Agent | Why |
|---|---|---|---|
| [evidence/condition] | [workflow-name] | [Agent Icon] | [rationale] |
| [evidence/condition] | [workflow-name] | [Agent Icon] | [rationale] |
| [evidence/condition] | [workflow-name] | [Agent Icon] | [rationale] |

> **Note:** These are evidence-based recommendations. You can navigate to any Vortex agent
> at any time based on your judgment.

**Or run Max's [VN] Vortex Navigation** for a full gap analysis across all streams.
```

**D4 Rules:**
- **2-3 rows** per compass table (3 is convention; 2 is acceptable when only two natural routes exist)
- Agent display format: `AgentName Icon` (e.g., `Emma 🎯`, `Mila 🔬`)
- Footer always references Max's Vortex Navigation
- `vortex-navigation` has NO compass table — it IS the terminal navigation tool

### Critical: Finding the Final Step File

The compass section always appears in the **final (highest-numbered) step file** of each workflow. To find it:

```javascript
function findFinalStepFile(workflowDir) {
  const stepsDir = path.join(workflowDir, 'steps');
  if (!fs.existsSync(stepsDir)) return null;
  const stepFiles = fs.readdirSync(stepsDir)
    .filter(f => STEP_PATTERN.test(f))
    .sort();
  return stepFiles.length > 0
    ? path.join(stepsDir, stepFiles[stepFiles.length - 1])
    : null;
}
```

STEP_PATTERN from helpers.js: `/^step-\d{2}(-[^.]+)?\.md$/`

### Critical: Compass Table Parsing

The compass table has 4 columns. The Agent column contains `"AgentName Icon"` format (e.g., `"Mila 🔬"`). The workflow column contains the kebab-case workflow name (e.g., `"research-convergence"`).

**Agent name extraction:** The first word of the Agent cell is the agent name. Use `/^(\w+)/` and lowercase for comparison against `agentNameMap`.

**Agent icon reference (for validation context):**

| Agent | Display Format |
|---|---|
| Emma | `Emma 🎯` |
| Isla | `Isla 🔍` |
| Mila | `Mila 🔬` |
| Liam | `Liam 💡` |
| Wade | `Wade 🧪` |
| Noah | `Noah 📡` |
| Max | `Max 🧭` |

### Critical: Compass-Exempt Workflows

Only ONE workflow is exempt from having a compass table:

| Workflow | Agent | Why Exempt |
|---|---|---|
| `vortex-navigation` | Max (learning-decision-expert) | It IS the terminal navigation tool — routes to any agent based on 7-stream gap analysis |

The routing decision matrix explicitly states: `"vortex-navigation has NO Compass table — this IS the terminal navigation tool."` The test should VERIFY this exemption (confirm no compass section) rather than just skip it.

### Critical: Workflow Discovery Pattern (NFR5)

Build the complete workflow list dynamically from `discoverAgents()`:

```javascript
const agents = discoverAgents();
const allWorkflows = agents.flatMap(agent =>
  agent.workflowNames.map((name, i) => ({
    name,
    dir: agent.workflowDirs[i],
    agentName: agent.name,
    agentId: agent.id,
  }))
);
```

This ensures new agents and workflows are automatically included. Do NOT hardcode any workflow list.

### Critical: Compass Routing Reference File

The `compass-routing-reference.md` at `_bmad/bme/_vortex/compass-routing-reference.md` is the **authoritative** routing reference. It contains:
- Complete routing decision matrix for all 22 workflows
- All 10 handoff contract definitions (HC1-HC10)
- D4 compass table format specification
- Agent display reference

**Cross-reference validation:** Verify the routing reference mentions all registered agents and workflows. This catches drift if a new agent/workflow is added to the registry but not to the routing reference.

### Critical: Existing Test Coverage Map

What's already tested (do NOT duplicate):

| Test File | What It Validates |
|---|---|
| `p0-activation.test.js` | Agent definition files: frontmatter, `<agent>` tag, persona, menu, activation steps, error handling |
| `p0-workflow-structure.test.js` | Workflow directories: workflow.md exists, steps/ exists, step count 4-6, step naming |
| `p0-voice-consistency.test.js` | Voice markers, persona cross-validation, workflow vocabulary |
| `p0-handoff-contracts.test.js` | HC1-HC5 schemas: frontmatter fields, body sections, agent cross-validation, chain integrity |

**What's NOT tested (this story's scope):**
- Compass table presence in workflow final steps
- Compass table format validation (D4 compliance)
- Compass routing references validity (agents + workflows exist in registry)
- Cross-reference integrity between compass-routing-reference.md and the registry
- Agent→workflow directory filesystem consistency (registry says workflow exists, filesystem agrees)

### Previous Story Learnings (p2-3-2, p2-3-3)

- **Import from helpers.js** — Use `VORTEX_DIR`, `STEP_PATTERN` from helpers (do not redefine paths locally); do NOT import unused exports
- **No dead imports** — Only import what's actually used (DRY)
- **Vacuous pass guards (M2)** — Assert minimum counts before iterating (e.g., assert ≥20 compass tables before loop)
- **Diagnostic assertion messages (NFR2)** — Every assertion includes workflow name + agent name + specific field
- **No hardcoded agent lists (NFR5)** — Use `discoverAgents()` for all agent/workflow lookups
- **Cosmetic tolerance (NFR4)** — Case-insensitive, whitespace-tolerant matching for headers and names
- **Bidirectional assertions** — Check both directions (expected ⊆ actual AND count matches) to catch drift
- **Scoped searches** — When checking substring matches, narrow the search scope to the relevant section (not the entire file)
- **Code review pattern: case-insensitive field checks** — Use `.toLowerCase()` for all string comparisons in table parsing

### Edge Cases and Gotchas

1. **Compass section boundary:** The regex `## Vortex Compass\n([\s\S]*?)(?=\n## [^#]|$)` captures until the next `## ` heading or end of file. In most step files, the compass is the LAST section, so it captures to EOF. Verify the regex handles both cases.
2. **Markdown table parsing — separator rows:** Filter out rows matching `/^\|[\s-|]+$/` (all dashes/pipes/spaces). The compass tables use `|---|---|---|---|` separators.
3. **Agent name extraction from emoji cells:** The Agent column is `"AgentName Icon"`. The regex `/^(\w+)/` extracts the first word (the name). Emoji characters are not `\w` so they won't be captured. This is correct.
4. **Workflow names in compass tables may include descriptive text:** In some compass tables, the "Consider next..." column might include additional context beyond the workflow name. Verify by reading actual compass tables. From inspection, the column contains ONLY the workflow name (e.g., `research-convergence`).
5. **vortex-navigation exempt validation:** Don't just skip this workflow — actively VERIFY it has NO compass section. If someone accidentally adds a compass table to it, the test should catch that.
6. **Compass table row count edge case:** The D4 spec says 2-3 rows. Most workflows have exactly 3 rows. Three workflows have exactly 2 rows: `hypothesis-engineering`, `signal-interpretation`, and `pivot-resynthesis`. The parser must handle both 2-row and 3-row tables correctly — do NOT assert exactly 3 rows.
7. **Empty compass table cells:** Some rows might have empty cells (especially in 2-route workflows where Route 3 is blank). The parser should tolerate empty cells in optional positions.
8. **Compass routing reference mentions HC contracts:** The routing reference mentions HC1-HC10 in parentheticals like `"(HC1)"`, `"(HC4)"`. This is informational, not a required validation target for this story.

### Files to Create

- `tests/p0/p0-content-correctness.test.js` (NEW — content correctness and compass routing validation tests)

### Files to Modify

- `_bmad-output/implementation-artifacts/sprint-status.yaml` (MODIFY — story status transitions)

### Project Structure Notes

- 1 new test file in existing `tests/p0/` directory — no new directories needed
- New test file auto-discovered by existing `npm run test:p0` glob: `node --test tests/p0/*.test.js`
- Parsing utilities defined within the test file — they parse compass/routing format, not general-purpose infrastructure
- No changes to helpers.js or package.json needed
- COMPASS_EXEMPT is a tiny constant (1 entry) — acceptable hardcoding since it's an architectural decision, not agent discovery

### References

- [Source: _bmad-output/planning-artifacts/epics-phase2.md — Epic 3, Story 3.4]
- [Source: _bmad-output/planning-artifacts/prd-phase2.md — FR13, FR14, FR15, FR20, FR31, NFR1-NFR5]
- [Source: _bmad/bme/_vortex/compass-routing-reference.md — Authoritative routing reference, D4 format, 22-workflow routing matrix]
- [Source: tests/p0/helpers.js — discoverAgents(), VORTEX_DIR, WORKFLOWS_DIR, STEP_PATTERN exports]
- [Source: scripts/update/lib/agent-registry.js — 7 agents, 22 workflows]
- [Source: _bmad-output/implementation-artifacts/p2-3-3-handoff-contract-validation-tests.md — Previous story learnings, code review fixes]
- [Source: _bmad-output/implementation-artifacts/p2-3-2-voice-consistency-validation-full-p0-confidence-gate.md — Previous story learnings]
- [Source: _bmad/bme/_vortex/workflows/empathy-map/steps/step-06-synthesize.md — Example compass table (Isla)]
- [Source: _bmad/bme/_vortex/workflows/lean-experiment/steps/step-06.md — Example compass table (Wade)]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- D4 footer compliance: 3 Emma workflows (lean-persona, product-vision, contextualize-scope) were missing the standard `> **Note:** These are evidence-based recommendations...` blockquote. Added the missing footer to all 3 to bring them into D4 compliance.

### Completion Notes List

- Created `tests/p0/p0-content-correctness.test.js` with 174 new tests across 3 test suites: Compass Table Presence (23 tests), Compass Table Format & Routing Validity (105 tests), Cross-Reference Integrity (46 tests)
- 4 parsing utilities: `findFinalStepFile`, `extractCompassSection`, `parseCompassTable`, `extractAgentName`
- All discovery is dynamic via `discoverAgents()` — zero hardcoded agent/workflow lists (NFR5)
- Case-insensitive header comparison (NFR4), diagnostic assertion messages with workflow+agent context (NFR2)
- Vacuous pass guards: assert >=20 compass tables, assert routing reference exists and is non-empty
- Cross-agent routing validation: every compass table routes to at least one different agent's workflow
- Fixed D4 footer compliance in 3 Emma step files (missing "evidence-based recommendations" blockquote)
- All validation passed: P0 642/642, Unit 248/248, Lint clean, Gate pass
- **Code Review Fixes (3M fixed):** M1: `registeredWorkflowNames` Set now lowercased for NFR4 consistency. M2: Describe-level file reads wrapped in try-catch for graceful test failures. M3: `hasFooter` search scoped to content before `###` subheadings to prevent false positives.

### Change Log

- 2026-03-01: Created p0-content-correctness.test.js (174 tests). Fixed D4 footer compliance in 3 Emma workflow step files.
- 2026-03-01: Code review — fixed 3 MEDIUM issues (Set case consistency, try-catch robustness, footer scope).

### File List

- `tests/p0/p0-content-correctness.test.js` (NEW)
- `_bmad/bme/_vortex/workflows/lean-persona/steps/step-06-synthesize.md` (MODIFIED — added D4 footer blockquote)
- `_bmad/bme/_vortex/workflows/product-vision/steps/step-06-synthesize.md` (MODIFIED — added D4 footer blockquote)
- `_bmad/bme/_vortex/workflows/contextualize-scope/steps/step-06-synthesize.md` (MODIFIED — added D4 footer blockquote)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (MODIFIED — status transitions)
