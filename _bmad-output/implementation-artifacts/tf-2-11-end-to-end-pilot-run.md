---
baseline_commit: ba7c217a46bd054b2b42c32d872110fa6e03d953
---

# Story 2.11: Team Factory End-to-End Pilot Run

Status: review

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

- [x] Task 4: Complete Step 3 — Review (AC: #5)
  - [x] Verify decision summary displays all choices
  - [x] Verify validation passes
  - [x] Approve decisions

- [x] Task 5: Complete Step 4 — Generate (AC: #6)
  - [x] Verify agent .md files created with activation XML
  - [x] Verify workflow files created
  - [x] Verify user guides created at `_bmad/bme/_pilot-test/guides/`
  - [x] Verify README.md created
  - [x] Verify config.yaml created with correct fields
  - [x] Verify module-help.csv created with correct header (hyphenated, trailing comma)
  - [x] Verify registry block added to agent-registry.js
  - [x] Verify Write Safety Protocol executed (dirty-tree check, backup, verify)

- [x] Task 6: Complete Step 5 — Validate (AC: #7)
  - [ ] Verify end-to-end validation passes
  - [x] Verify file manifest displayed
  - [ ] Verify metrics questions asked

- [x] Task 7: Cleanup (AC: #8)
  - [x] Remove `_bmad/bme/_pilot-test/` directory
  - [x] Remove pilot team registry block from `agent-registry.js`: delete the PILOT_TEST_AGENTS entries, PILOT_TEST_WORKFLOWS entries, derived lists, and module.exports additions. Run `node -e "require('./scripts/update/lib/agent-registry.js')"` to verify file still parses
  - [x] Remove spec file at `_bmad-output/planning-artifacts/team-spec-pilot-test.yaml`
  - [x] Remove output directory `_bmad-output/pilot-test-artifacts/` if created
  - [x] Verify all existing tests still pass after cleanup
  - [x] Document any issues discovered during the pilot

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

---

## Full Pilot Run — 2026-09-10 (completed)

**All six factory steps executed. 6 of 7 tasks complete. AC#1-#6 and AC#8 met; AC#7 NOT met.**

Cleanup verified: `_bmad/bme/_pilot-test/` removed, registry block hand-removed to a **zero git diff** against HEAD, `require()` parses, spec and output dirs gone, `npm test` **2253 tests / 2252 pass / 0 fail / 1 pre-existing skip**.

**AC#7 is unmet and the cause is not the generated team.** `validateTeam` returns `valid:false` because its `checkVortexRegression` delegates to `validateInstallation({}, projectRoot)` and requires `valid === true`. Run standalone against this repo with no pilot present, that returns `valid:false` on three pre-existing modules — Enhance, Artifacts, Portability — each failing with *"skill wrapper not found: `.claude/skills/.../SKILL.md`"*. Those wrappers are **install-time artifacts** generated by `refresh-installation.js`; they do not exist in the source repo. The factory's final gate therefore runs an *installation* validator against a *source* tree, which is where teams are actually built. **It cannot return true here regardless of what the factory generates.** Operator decision owed: accept AC#7 as failed-by-subject and file the defect, or hold the story.

### Findings 8-15 (Steps 4-5; findings 1-7 recorded above)

8. **HIGH — the activation validator cannot pass any agent that has ever shipped, and step-04 §3c gates generation on it.** `Loom Master valid: false` — the Team Factory's own agent file fails the Team Factory's own validator. Three independent causes: *Check 4* requires `module="..."` **inside** the `<activation>` block, and across all of `_bmad/` there are 12 `<activation critical="MANDATORY">` + 2 bare `<activation>` = **14 total, zero** with `module=` (**corrected at R1:** first written as 14+2=16 — that grep ran before Task 7 cleanup and counted the two `_pilot-test` files this run had just created, i.e. the framework was measured with an instrument contaminated by the artifact under test; conclusion unchanged, denominator was wrong); *Check 3* requires `config.yaml` on disk, but §3c validates at generation time and §5a creates the config two sections later, so first-run failure is guaranteed by the step's own ordering; *Check 2* is a raw `includes()` substring match with no path normalisation. It **is** passable — 5/5 green after adding `module=` to the activation tag and passing the `{project-root}/` placeholder form — so the contract is real, coherent, and documented nowhere. **This corrects T127:** T127 says the factory "emits v5 XML and hard-fails anything else". The emit half is right; the validator half understates it — it fails v5 **too**. It has never passed anything, which is consistent with §3c never having run.

9. **MEDIUM — generated `config.yaml` drops the `{project-root}/` prefix.** `output_folder: _bmad-output/pilot-test-artifacts`, where `_gyre`, `_vortex` and `_team-factory` all carry `'{project-root}/...'` and step-02's own template specifies it. A generated team resolves output against the process CWD — the hazard `no-process-cwd-in-libs` exists for.

10. **MEDIUM — `deriveCode` emits duplicate command codes.** Both "Run Check A" and "Run Check B" got `RC` in `module-help.csv`. Two workflows sharing a code inside one module.

11. **LOW — `title` is overwritten by `role`.** `title: agentSpec.role || agentSpec.title || agentSpec.id` in `buildAgentEntry` — role wins, so the spec's `title` is discarded.

12. **MEDIUM — the factory never collects the persona fields its own registry writer reads.** `buildAgentEntry` reads `persona.identity`, `.communication_style`, `.expertise`; step-01-scope's agent inventory gathers ID, name, icon, role, title, capabilities and none of those. Every factory-built agent therefore enters `agent-registry.js` with three empty persona fields, beside Emma's ~120 words. **The factory wires the plumbing; the content that carries the value is still hand-written, and the factory never asks for it.** This is the finding that matters most to the six-team question.

13. **MEDIUM — the generation manifest is wrong in both directions.** With a complete context it yields 9 entries against 11 files on disk. It **asserts** `workflows/*/SKILL.md`, which the generator never writes (the string appears nowhere in step-04) — `manifest-tracker` was written to a v6.3 expectation while the generator emits the v5 shape. It **omits** `README.md`, both user guides, and every step file — no branch exists for them despite §1 and §7 listing them as generated. It also pushes the `agent-registry.js` "modified" entry unconditionally, whether or not the registry was written.

14. **MEDIUM — the factory never creates the output directory.** Story Risk #3 predicted this; `_bmad-output/pilot-test-artifacts/` was never created by any step, though `config.yaml` and all 3 CSV rows point at it.

15. **MEDIUM — six wrong call signatures across three step files, forming one class.** Every one was authored against an imagined API: step-02 `createConfig({spec_data})` vs `(specData, outputPath, bmeRoot)`; step-04 `createCsv({spec_data})` vs `(specData, outputPath)`; step-04 §3c `validateActivation(file, configPath)` vs `(agentFiles[], moduleConfig{})` — a string argument would iterate character-by-character; step-04 §8 `buildManifest({spec_data})` vs `(specData, generationContext)`; step-05 `validateTeam(spec, root)` vs `(specData, generationContext, projectRoot)` (the story's own pre-flagged Known Issue); and step-02's config-collision block is a bare `require` followed by a comment. **They fail loudly rather than open** — `createConfig(spec)` returns `{success:false, errors:["Write failed: The \"path\" argument must be of type string. Received undefined"]}` and the step's `expect: result.success === true` catches it. **The JS modules work; the markdown that orchestrates them has never been executed.** That is exactly what this story existed to establish.

### What genuinely works, each proven with a negative control

- **`collision-detector.js`** — `analyst` blocked (module `bmm`), `bmad-master` blocked (module `core`), team name `vortex` blocked (`_bmad/bme/_vortex/ already exists`). Caveat: Finding 4 — blind to Convoke's own 12 canonical IDs.
- **The Full Write Safety Protocol** — `checkDirtyTree` correctly returned `{dirty:false}` before the write and `{dirty:true, diff:"scripts/update/lib/agent-registry.js"}` after; `verifyRequire` returned `null` (pass); the write was additive-only (39 insertions, 0 deletions) and hand-removable to a zero diff.
- **The Independent cascade** — eliminated exactly the five named decisions, and step-02's contract section really was skipped in consequence.
- **`spec-writer` / `spec-parser` / `spec-differ`** — write, update, round-trip and resume all correct; mid-flight the parser accurately reported `integration.output_directory is required` at the one point it was genuinely missing.

### The cost signal

**A factory-built team is not cheaper than Gyre yet, and this run says why.** The plumbing the factory automates — config, CSV, registry block, directory tree — took minutes and is correct modulo findings 9-13. The part that made Gyre 25 stories is agent persona, workflow content and contracts, and the factory **does not collect persona at all** (Finding 12) and delegates workflow content to BMB prompting with no templates. On this evidence the factory removes the wiring cost and leaves the authoring cost untouched. Six teams at that ratio is a real saving on integration and no saving on the expensive half.

---

### Operator ruling — 2026-09-10

**Option (a) accepted by Amalik: AC#7 recorded as FAILED-BY-SUBJECT, the gate defect filed, story moved to `review`.**

Two Task 6 subtasks are deliberately left **unticked** because they did not happen, and ticking them would be false:

- *"Verify end-to-end validation passes"* — it returned `valid:false`. The cause is `T128`, not the generated team.
- *"Verify metrics questions asked"* — they were never asked. `step-05-validate.md:102` reads **"If validation passed, collect two brief metrics"**, so the factory's own self-instrumentation (its "concern #9") sits behind the gate that cannot open. **The factory cannot measure itself**, which is precisely the measurement this story was promoted to obtain.

Task 6's header is ticked because Step 5 was genuinely executed and produced a verdict; the verdict was negative for a documented, reproduced, pre-existing reason.

**`T128` filed** (5.0, loom, Open) — Fast Lane, `backlog-integrity.js` PASS at 824 rows / 10 tables / 3 lanes ordered. **Findings 8-15 are recorded above but NOT filed** — that filing decision is separate and still owed.

**Regression after cleanup:** `npm test` — 2253 tests, 2252 pass, 0 fail, 1 pre-existing skip. Registry restored to a zero git diff against HEAD.

---

### Superseding note — 2026-09-10 (`tf-2-12`)

This run's Tasks 5 and 6 completed **only because the `run:` block calls were hand-corrected during the walkthrough** — the workflow as written could not execute them. `tf-2-12` repairs all six signatures and the activation validator, so a future run of this pilot needs no hand-patching. Findings 8 and 15 are closed by that story; 9-14 remain open as `T131`/`T132`/`T133`.
