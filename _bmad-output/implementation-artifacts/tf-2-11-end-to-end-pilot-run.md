---
baseline_commit: ba7c217a46bd054b2b42c32d872110fa6e03d953
---

# Story 2.11: Team Factory End-to-End Pilot Run

Status: in-progress

> **Deferred 2026-04-22:** operator not ready to drive the interactive 6-step pilot walkthrough. Story file + all preconditions remain ready. Promote back to `ready-for-dev` when operator has time for the manual walkthrough.

## Story

As a framework contributor,
I want to validate the Team Factory by creating a real team through the full 6-step conversational flow,
so that we have confidence the factory works end-to-end before using it to scaffold Forge.

## Context

This story closes the AC 2.9.4 partial gap from the April 2nd AC confrontation. The M2 validation tested individual JS modules (spec write/parse, cascade logic, collision detection) but **nobody has ever invoked the factory agent and walked through the complete guided flow to create a team**.

This is the real validation — the factory agent activates, guides the contributor through scope → connect → review → generate → validate, and produces a working team module.

**Test candidate:** Create a small Independent pattern test team (simplest path — no contracts, no pipeline). This validates the factory without the complexity of Sequential. If Independent works, Sequential confidence is high (the JS modules already handle it).

**Important constraints:**
- BMB template externalization (P1/P6) is not done — Step 4 (Generate) will use BMB delegation via LLM prompting, not shared templates
- The pilot should produce a real team module at `_bmad/bme/_pilot-test/` that can be validated and then deleted
- This is a **manual test** — the contributor (Amalik) walks through the factory, not an automated test

## Acceptance Criteria

1. **Given** the Team Factory agent is invoked via `/bmad-agent-bme-team-factory`
   **When** the agent activates
   **Then** config loads from `_bmad/bme/_team-factory/config.yaml`, greeting displays, and menu is presented

2. **Given** the contributor selects "Create Team" from the menu
   **When** step-00-route executes
   **Then** intent is classified as "create team" and flow proceeds to step-01-scope

3. **Given** the contributor defines a 2-agent Independent team
   **When** step-01-scope executes
   **Then** naming is enforced, overlap detection runs (L1+L2), cascade eliminates 5 Sequential-only decisions, and a spec file is created

4. **Given** the contributor completes integration decisions (output directory, compass routing)
   **When** step-02-connect executes
   **Then** spec file is updated with integration section (no contracts for Independent)

5. **Given** all decisions are complete
   **When** step-03-review presents the decision summary
   **Then** all decisions are displayed in a structured table, validation passes, and contributor can approve

6. **Given** the contributor approves
   **When** step-04-generate executes
   **Then** agent files, workflow files, user guides, config.yaml, module-help.csv, README, and registry block are created. Registry write uses Full Write Safety Protocol

7. **Given** generation is complete
   **When** step-05-validate executes
   **Then** end-to-end validation passes, file manifest is displayed, and the team module at `_bmad/bme/_pilot-test/` is structurally valid

8. **Given** the pilot team passes validation
   **When** cleanup is requested
   **Then** the pilot team module and its registry block can be cleanly removed without affecting existing teams

## Tasks / Subtasks

- [x] Task 1: Invoke factory and complete Step 0 — Route (AC: #1, #2)
  - [x] Run `/bmad-agent-bme-team-factory`
  - [x] Verify activation, config load, menu display
  - [x] Select "Create Team"
  - [x] Verify routing to step-01-scope

- [x] Task 2: Complete Step 1 — Scope (AC: #3)
  - [x] Define team: "Pilot Test" / `pilot-test` / Independent pattern
  - [x] Define 2 agents: `alpha-tester` (role: "Test agent A") and `beta-tester` (role: "Test agent B")
  - [x] Verify naming enforcement catches bad names
  - [x] Verify collision detection finds no blocks for novel IDs
  - [x] Verify cascade eliminates: pipeline-order, handoff-contracts, feedback-contracts, contract-prefix, orchestration-workflow
  - [x] Verify spec file created at `_bmad-output/planning-artifacts/team-spec-pilot-test.yaml`

- [x] Task 3: Complete Step 2 — Connect (AC: #4)
  - [x] Set output directory: `_bmad-output/pilot-test-artifacts`
  - [x] Set compass routing: `per-agent` (Independent default)
  - [x] Verify no contract prompts appear (Independent pattern)
  - [x] Verify spec file updated

- [ ] Task 4: Complete Step 3 — Review (AC: #5)
  - [x] Verify decision summary displays all choices
  - [x] Verify validation passes
  - [ ] Approve decisions

- [ ] Task 5: Complete Step 4 — Generate (AC: #6)
  - [ ] Verify agent .md files created with activation XML
  - [ ] Verify workflow files created
  - [ ] Verify user guides created at `_bmad/bme/_pilot-test/guides/`
  - [ ] Verify README.md created
  - [ ] Verify config.yaml created with correct fields
  - [ ] Verify module-help.csv created with correct header (hyphenated, trailing comma)
  - [ ] Verify registry block added to agent-registry.js
  - [ ] Verify Write Safety Protocol executed (dirty-tree check, backup, verify)

- [ ] Task 6: Complete Step 5 — Validate (AC: #7)
  - [ ] Verify end-to-end validation passes
  - [ ] Verify file manifest displayed
  - [ ] Verify metrics questions asked

- [ ] Task 7: Cleanup (AC: #8)
  - [ ] Remove `_bmad/bme/_pilot-test/` directory
  - [ ] Remove pilot team registry block from `agent-registry.js`: delete the PILOT_TEST_AGENTS entries, PILOT_TEST_WORKFLOWS entries, derived lists, and module.exports additions. Run `node -e "require('./scripts/update/lib/agent-registry.js')"` to verify file still parses
  - [ ] Remove spec file at `_bmad-output/planning-artifacts/team-spec-pilot-test.yaml`
  - [ ] Remove output directory `_bmad-output/pilot-test-artifacts/` if created
  - [ ] Verify all existing tests still pass after cleanup
  - [ ] Document any issues discovered during the pilot

## Dev Notes

- This is a **manual walkthrough**, not an automated test
- The contributor (Amalik) drives the conversation; the factory agent guides
- BMB delegation in Step 4 will use LLM prompting since shared templates don't exist yet (P12 dependency)
- If the factory breaks at any step, document the failure, fix it, and continue
- After successful pilot, consider creating an automated smoke test for regression

### Key Files Involved

- Agent: `_bmad/bme/_team-factory/agents/team-factory.md`
- Steps: `_bmad/bme/_team-factory/workflows/step-00-route.md` through `step-05-validate.md`
- JS: cascade-logic, collision-detector, spec-parser, spec-writer, spec-differ
- Schemas: schema-independent.json
- Registry: `scripts/update/lib/agent-registry.js` (shared file — Full Write Safety Protocol)
- Validator: `_bmad/bme/_team-factory/lib/validators/end-to-end-validator.js`

### Previous Story Intelligence

From AC confrontation (`tf-2-workflow-layer-increment-2026-04-02.md`):
- 18/23 ACs met, 5 partial — this pilot validates the runtime behavior the confrontation couldn't check
- Code review fixed 11 issues including 2 critical — all fixes are in place
- M2 validation confirmed JS modules work in isolation — this tests them orchestrated

### Known Issues

- **Validator arity mismatch** — `step-05-validate.md` calls `validateTeam(specData, projectRoot)` with 2 args, but the actual function signature is `validateTeam(specData, generationContext, projectRoot)` requiring 3 args. The `generationContext` object is constructed during Step 4 generation and includes: `module_root`, `generated_files`, `agent_files`, `config_yaml_path`, `module_help_csv_path`, `activation_validation_results`, `registry_wiring_result`. The pilot will expose this — either fix the workflow step or construct the context manually.
- **Spec file validation** — After each step, the spec file should validate against `schemas/schema-independent.json`. Use `spec-parser.js` to verify.

### Risk

- **BMB delegation without templates** — Step 4 relies on LLM to generate agent files. Quality depends on prompt quality in step-04-generate.md. If agent files are malformed, activation-validator.js should catch it.
- **Registry write on real agent-registry.js** — Full Write Safety Protocol protects, but ensure git working tree is clean before starting.
- **Output directory creation** — The factory should create `_bmad-output/pilot-test-artifacts/` automatically. If it doesn't, downstream workflows referencing it will fail. Verify during Task 3.

### References

- [Source: _bmad-output/planning-artifacts/epic-team-factory.md] — Epic 2 Stories 2.1-2.9
- [Source: _bmad-output/implementation-artifacts/tf-2-workflow-layer-increment-2026-04-02.md] — AC confrontation
- [Source: _bmad-output/planning-artifacts/architecture-team-factory.md] — Architecture decisions
- [Source: _bmad-output/implementation-artifacts/tf-epic-2-retro-supplement-2026-04-03.md] — Retro findings

## Dev Agent Record

### Agent Model Used

Claude Opus 5 (1M context), driving `bmad-agent-bme-team-factory` (Loom Master) through `bmad-dev-story`.

### Completion Notes List

**Run of 2026-09-10. Steps 0-3 executed against the live factory. HALTED AT THE GENERATE BOUNDARY by operator choice (option 3, Save & Exit) at step-03-review §4 — not by a failure.** Nothing was written outside the spec file: `_bmad/bme/_pilot-test/` was never created and `scripts/update/lib/agent-registry.js` was never touched.

**Tasks 1-3 complete (AC#1-#4 met). Task 4 partial** — summary displayed and validation gate passed, approval deliberately withheld. Tasks 5-7 and AC#5-#8 not reached.

**What was proven to work, by demonstration rather than assumption:**

- **`collision-detector.js` is genuinely falsifiable.** Clean results on novel IDs were not trusted; negative controls were run. `analyst` -> blocked (`module "bmm"`), `bmad-master` -> blocked (`module "core"`), team name `vortex` -> blocked (`_bmad/bme/_vortex/ already exists`). It catches what it exists to catch.
- **The cascade is load-bearing.** `getCascadeForPattern('Independent')` eliminates exactly the five the story names — `pipeline-order`, `handoff-contracts`, `feedback-contracts`, `contract-prefix`, `orchestration-workflow` — and step-02's entire contract-design section was skipped in consequence.
- **Naming enforcement rejects bad IDs** — `Alpha_Tester`, `alpha tester`, `alpha-` all rejected; `alpha-tester`, `beta-tester` accepted.
- **Spec write/parse/update round-trips cleanly.** `writeSpec` -> `{success:true}`; mid-flight `parseSpec` correctly reported `valid:false, errors:["integration.output_directory is required"]` at end of Step 1 and `valid:true` after Step 2 supplied it.
- **Save & Exit honours its contract.** `progress.review` left `pending`; `findResumePoint()` returns `{resumable:true, resumeStep:"review"}`.

**Six findings. None blocked the run.**

1. **LOW — `_team-factory/config.yaml:10` holds `user_name: '{user}'`, so the greeting renders the placeholder.** Resolution is deliberately the operator's job (`config-loader.js:35` — "NO `{user}` placeholder resolution"), prompted at install. `install-vortex-agents.js:153` and `install-gyre-agents.js:109` both issue that prompt; there is no `install-team-factory-agents.js` and nothing prompts for `_team-factory/config.yaml`. It is the only agent-bearing module whose placeholder is never surfaced.

2. **MEDIUM — the cascade fails silently on a case mismatch and step-01's expectation cannot see it.** `getCascadeForPattern('independent')` returns `{decisions:[], eliminated:[], error:"Unknown pattern..."}`; `KNOWN_PATTERNS = ['Independent','Sequential']` (`cascade-logic.js:10`), no normalisation. The step's expect block reads only `result.decisions` and `result.eliminated`, **never `result.error`** — both keys exist, so the check passes and the whole cascade is disabled. A driver following the step literally would ask five Sequential-only questions on an Independent team.

3. **LOW — naming enforcement exists only inside a markdown instruction.** step-01's run block `require`s `naming-utils.js` and never uses it, validating with an inline regex instead; `naming-utils.js` exports only `toKebab` and `deriveWorkflowName` and contains no validator at all. The rule is therefore un-unit-testable, and has already drifted from its sibling: `agent2` is rejected as an agent ID while `pilot2` is accepted as a team name, because the two regexes disagree on digits.

4. **MEDIUM — `collision-detector.js` is blind to all 12 of Convoke's own agents.** It compares the proposed `agent_id` against the manifest's `name` column. For upstream BMAD, `name` holds kebab IDs (`analyst`) and matching works. For every bme agent, `name` holds a display first name (`Emma`, `Scout`, `Coach`, `Loom Master`) and the kebab identity lives in `canonicalId`. Proposing `stack-detective` or `model-curator` therefore sails through unblocked — verified. The factory's job is creating agents and it cannot see Convoke's own.

5. **LOW — step-02's config collision check is a stub that executes a comment.** `run: node -e "const cc = require('...config-creator.js'); // collision check logic"` loads the module, runs a comment, prints nothing, exits 0 — and `expect: no collisions` is trivially satisfied. The real check exists and *is* wired inside `createConfig`, so nothing unsafe ships; the cost is that a collision surfaces at Generate rather than at Connect where renaming is still free.

6. **MEDIUM — `config-creator.detectCollisions` can never report a `submodule_name` collision, because it skips the only directory that could match.** `newSubmodule = '_' + team_name_kebab`, then `if (entry === newSubmodule) continue;` — the re-run self-skip and the collision check are the same line, and the skip wins, leaving `if (existing.submodule_name === newSubmodule)` unreachable for its primary case. Proposing `vortex` returns `[]`; proposing agent `contextualization-expert` against the same directory returns a correct collision, which proves the function works and only its headline case is self-blinded. `createConfig`'s `fs.pathExists` guard still blocks the write, so this is a diagnostics defect rather than a data-loss one — the operator gets "config.yaml already exists at target path" instead of a named module. Note the contrast with step-01's `collision-detector.js`, which catches `vortex` correctly: **two collision detectors, different behaviour, and the one wired into the write path is the blind one.**

**Cost signal (the measurement this story exists to produce): NOT YET AVAILABLE.** Steps 0-3 are the conversational half and were cheap. The expensive half — Step 4 BMB delegation without templates, Step 5 validation (with the known `validateTeam` arity mismatch still unexercised), and Step 7 cleanup of a shared registry — was not run. No claim about what a factory-built team costs can be made from this run.

**Resume:** `[RS] Resume` -> `_bmad-output/planning-artifacts/team-spec-pilot-test.yaml` -> returns to step-03-review.

### File List

- `_bmad-output/planning-artifacts/team-spec-pilot-test.yaml` (new, untracked) — pilot spec, `progress.review: pending`. Required to resume; Task 7 deletes it.
- `_bmad-output/implementation-artifacts/tf-2-11-end-to-end-pilot-run.md` (modified) — frontmatter, Status, task checkboxes, this record.
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (modified) — row -> `in-progress`.

## Change Log

| Date | Change |
|------|--------|
| 2026-09-10 | Story promoted `backlog` -> `in-progress` (`baseline_commit: ba7c217a`). Story-file `Status` corrected from `backlog`, which had disagreed with `sprint-status.yaml` since the 2026-09-09 promotion in `23b13166`. Steps 0-3 run against the live factory; operator chose Save & Exit at the approval gate, so Tasks 5-7 and AC#5-#8 are unreached and the story stays `in-progress`. Six findings recorded above. **Line 9's "Deferred 2026-04-22 ... promote back when operator has time" note is now stale but was left in place** — it sits outside the sections dev-story may edit, and rewriting it would erase the record rather than correct it. |
