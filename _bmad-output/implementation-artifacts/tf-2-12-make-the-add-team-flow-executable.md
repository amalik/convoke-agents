---
baseline_commit: 33e0280f037974b6c59d3d8b5914cc330459cb33
---

# Story 2.12: Make the add-team flow executable

Status: review

**Epic:** tf-epic-2 — Team Factory Guided Workflow (in-progress) · **Origin:** `T129` (7.0) + `T130` (6.0), both filed 2026-09-10 from the first end-to-end factory run (`tf-2-11`).

**Scope boundary:** this story makes the flow *executable*. It does NOT make the factory collect agent persona — that is `T131`, and it is blocked on an operator ruling because `step-01-scope.md` already sits at `Concept count: 3/3` against `loom-prd.md:313` NFR2 ("each step introduces ≤3 new concepts", Must). Do not add persona collection here.

## Story

As a framework contributor,
I want the add-team workflow's `run:` blocks to call the factory's own libraries correctly and its activation validator to accept agents in the format the framework actually uses,
so that a contributor can complete a team build without hand-patching the workflow, and `tf-2-11`'s Task 5 and 6 can pass on their own terms.

## Context

`tf-2-11` drove the factory end to end for the first time on 2026-09-10, 140 days after the story was filed. **The JS libraries work — every one was exercised successfully at the correct arity. The markdown that orchestrates them has never been executed.** Six `run:` blocks call their libraries with the wrong signature, and the per-agent activation gate rejects every agent that has ever shipped, including the Team Factory's own.

Nothing corrupted anything, because all six failures are loud: called as written, `createConfig` returns `{success:false, errors:["Write failed: The \"path\" argument must be of type string. Received undefined"]}` and the step's `expect: result.success === true` catches it. That is also why the defect survived 140 days undetected.

**Root cause of the validator half, and it is the single most useful fact in this story:** `tests/team-factory/activation-validator.test.js` builds synthetic fixtures shaped `<activation config="..." module="bme/_test-team">` (`:37`, `:70`, `:85`). **No shipped BMAD agent carries either attribute**, and no test in that file ever points the validator at a real agent. 184 tests in `tests/team-factory/` pass while validating an invented convention perfectly.

## Acceptance Criteria

1. **Given** the six `run:` blocks in the add-team workflow
   **When** each is executed verbatim as written in the markdown
   **Then** each invokes its library with the signature that library actually declares, and none fails on argument arity or type.

2. **Given** `activation-validator.js` and the agent files the framework actually ships
   **When** `validateActivation` is run against `_bmad/bme/_team-factory/agents/team-factory.md`
   **Then** it returns `valid: true` — the Team Factory's own agent passes the Team Factory's own validator.

3. **Given** the same validator
   **When** it is run against a deliberately malformed agent (no `<activation>` block, or an activation block pointing at a different team's config)
   **Then** it returns `valid: false` with a specific error — the repair must not be achieved by weakening the validator into a pass-everything gate (the `T121` failure mode).

4. **Given** `step-04-generate.md`'s per-agent validation gate
   **When** the flow runs in its documented order
   **Then** the gate does not fail on a precondition the flow has not yet created.

5. **Given** the test suite
   **When** `npm test` runs
   **Then** at least one test exercises `validateActivation` against a **real shipped agent file** rather than a synthetic fixture, and that test fails if the validator's contract drifts from the framework's convention again.

6. **Given** the whole repair
   **When** `npm test` runs
   **Then** 0 failures, and the pre-existing skip count is unchanged.

## Tasks / Subtasks

- [x] **Task 1: Correct the six call sites** (AC: #1)
  - [x] `step-02-connect.md:83` — replace the bare `require` + comment stub with a real call to `config-creator.js::detectCollisions(specData, bmeRoot)`; the current line executes a comment and its `expect: no collisions` is satisfied by a command that checks nothing
  - [x] `step-04-generate.md:91` (§5a) — `createConfig({spec_data})` → `createConfig(specData, outputPath, bmeRoot)` (`config-creator.js:22`)
  - [x] `step-04-generate.md:97` (§5b) — `createCsv({spec_data})` → `createCsv(specData, outputPath)` (`csv-creator.js:26`)
  - [x] `step-04-generate.md:72` (§3c) — `validateActivation('{agent_file_path}', '{config_path}')` → `validateActivation(agentFiles[], moduleConfig{})` (`activation-validator.js:30`). **A string argument iterates character-by-character** — the current form produces one result object per character
  - [x] `step-04-generate.md:137` (§8) — `buildManifest({spec_data})` → `buildManifest(specData, generationContext)` (`manifest-tracker.js:21`)
  - [x] `step-05-validate.md:21` — `validateTeam({spec_data}, '{project-root}')` → `validateTeam(specData, generationContext, projectRoot)` (`end-to-end-validator.js:23`). This one was already documented in `tf-2-11`'s Known Issues on 2026-04-22 and never generalised
  - [x] Confirm `step-04-generate.md`'s §5c `writeRegistryBlock(specData, registryPath)` is left ALONE — it matches `registry-writer.js:25` and is the only correct call in the set

- [x] **Task 2: Repair the activation validator's contract** (AC: #2, #3)
  - [x] **Check 4** (`activation-validator.js:94`) — requires `module="..."` **inside** the `<activation>` block. Survey: all of `_bmad/` holds 12 `<activation critical="MANDATORY">` + 2 bare `<activation>` = 14 total, **zero** with `module=`. **RULED (c) — see Dev Notes §Decision 1.** Derive module identity from the config path check 2 already validates, rather than demanding a redundant attribute nothing emits
  - [x] **Check 2** (`:71`) — `activationContent.includes(moduleConfig.configPath)` is a raw substring match with no normalisation, so it passes or fails on the caller's string form. Accept both the `{project-root}/`-prefixed convention form and a resolved absolute path
  - [x] **Check 3** (`:82`) — requires `config.yaml` on disk, but §3c validates agents two sections before §5a creates it. **RULED (a) — move the gate; see Dev Notes §Decision 2**
  - [x] Do NOT touch checks 1 or 5 — both are correct and both pass today

- [x] **Task 3: Fix the ordering the validator gate depends on** (AC: #4)
  - [x] Move the per-agent `validateActivation` gate from §3c to after §5a/§5b per the ruling, then update `step-04-generate.md`'s section numbering and its Visibility Checklist so the documented order matches the executed order

- [x] **Task 4: Test against reality, not fixtures** (AC: #5, #6)
  - [x] Add a test in `tests/team-factory/activation-validator.test.js` that runs `validateActivation` against `_bmad/bme/_team-factory/agents/team-factory.md` and asserts `valid === true`
  - [x] Add the negative twin: a real-shaped agent with a deliberately wrong config path must still return `valid: false` (guards AC#3)
  - [x] **Prove the new test can fail.** Temporarily break the shipped agent's activation block, confirm red, restore. Per `project-context.md` rule `verification-must-be-falsifiable` — a test that cannot fail is not coverage
  - [x] Keep the existing synthetic-fixture tests; they are not wrong, they were just never joined to reality
  - [x] `npm test` — 0 failures, skip count unchanged

- [x] **Task 5: Close the loop on tf-2-11** (AC: #1, #2)
  - [x] Re-run the pilot's Step 4 + Step 5 path against a throwaway team to confirm the flow completes without hand-patching. Delete the throwaway per `tf-2-11` AC8 (module dir + registry block + spec file), and verify the registry returns to a **zero git diff**
  - [x] Note in `tf-2-11`'s record that its Tasks 5-6 were completed with hand-corrected calls, and that this story removes that need

## Dev Notes

### Decision 1 — RULED 2026-09-10 by Amalik: option (c), re-express check 4 against the config path

**This is settled. Implement (c). Do not re-open it, and do not substitute (a) because it is quicker.**

Three options, and the wrong two are both tempting:

- **(a) REJECTED — Delete check 4.** Fastest, and it makes the validator weaker for no gain. This is precisely the `T121` failure mode already filed against this project: a gate that passes what it exists to catch. **Do not do this.**
- **(b) REJECTED — Make the generator emit `module=`.** Keeps the check, but invents a framework-wide convention on the authority of one story, and every hand-written agent in `_bmad/` then fails a gate it never agreed to. Out of scope.
- **(c) ✅ RULED — re-express check 4 against what agents actually contain.** The activation block already references its config as `{project-root}/_bmad/bme/_{team}/config.yaml`. The module path is derivable from that string. Check 4 becomes "the activation block's config reference resolves to the expected module", which is a real assertion, is satisfiable by every shipped agent, and does not require a new convention.

Under (c), checks 2 and 4 partly overlap. That is acceptable — or fold them into one check with two failure messages. Either is fine; state which you chose in the Dev Agent Record.

### Decision 2 — RULED 2026-09-10 by Amalik: option (a), move the per-agent gate after config creation

**Settled. The check is kept; only its placement moves.**

- **(a) ✅ RULED — move the per-agent validation gate** from §3c to after §5a creates `config.yaml`. The check is legitimate; only its placement is wrong. Cost: §3's "validate immediately after generating each agent" becomes "validate all agents after config exists", which slightly weakens per-agent feedback.
- **(b) REJECTED — Drop check 3 from per-agent validation** and rely on check 5 (module directory exists) plus end-to-end validation. Cheaper, loses a real assertion.

Ruled (a). Consequences the dev must carry: `step-04-generate.md`'s section numbering changes, its **Visibility Checklist** must be updated to match the executed order, and its `Concept count:` footer re-checked against `loom-prd.md:313` NFR2. Per-agent feedback becomes all-agents feedback — that is an accepted cost, not a defect to work around.

### What is already proven — do not re-derive it

Measured live on 2026-09-10 during `tf-2-11`. Trust these; re-verify only if you change the file.

- **The validator IS satisfiable.** 5/5 checks green after adding `module=` to the activation tag and passing the config path in `{project-root}/` form. The contract is coherent — it is simply undocumented and met by nothing.
- **`Loom Master valid: false`** today, on two errors: config-path reference and module-path reference.
- **All six wrong signatures fail loudly**, never open. No silent corruption is possible from this defect.
- **`collision-detector.js` and the Full Write Safety Protocol both work** and were falsified with negative controls. Do not "fix" them.

### Things in this area that are NOT this story

Filed separately from the same run; leave them alone so the diff stays reviewable:

- `T131` — persona fields never collected (blocked on the NFR2 ruling above)
- `T132` — three checks that pass without checking (cascade case-sensitivity, the §5 stub, `config-creator`'s self-skip). **Note the overlap:** Task 1's first subtask repairs the §5 stub's *call*; `T132` owns the wider class. Repair the call here, do not chase the class.
- `T133` — five ways a generated team is subtly wrong (config `{project-root}` prefix, duplicate CSV codes, `title`/`role`, manifest wrong both directions, output dir never created)
- `T128` — the terminal gate delegating to `validateInstallation` against a source tree

### Architecture constraints

- `loom-arch.md` **Q3 is an unresolved open question** — "validation layering: how do per-step, per-agent, and end-to-end validation compose? ... NFR3's 'first-run pass' is only as strong as what the validator checks." This story works *inside* Q3 and must not attempt to resolve it. If your fix seems to require resolving Q3, stop and raise it.
- `loom-arch.md` D4: "Existing `validator.js` — factory extends, does not replace." Do not modify `scripts/update/lib/validator.js`.
- `loom-prd.md:313` NFR2 (Must): each step introduces ≤3 new concepts. `step-01-scope.md` is at 3/3. If Decision 2 moves a gate between steps, re-check the affected step's `Concept count:` footer and update it.

### Key files

| File | Change |
|---|---|
| `_bmad/bme/_team-factory/workflows/add-team/step-02-connect.md` | UPDATE — `:83` |
| `_bmad/bme/_team-factory/workflows/add-team/step-04-generate.md` | UPDATE — `:72`, `:91`, `:97`, `:137`, section order |
| `_bmad/bme/_team-factory/workflows/add-team/step-05-validate.md` | UPDATE — `:21` |
| `_bmad/bme/_team-factory/lib/writers/activation-validator.js` | UPDATE — checks at `:71`, `:82`, `:94`; leave `:12`, `:60`, `:113` |
| `tests/team-factory/activation-validator.test.js` | UPDATE — add real-agent tests, keep synthetic ones |

### Previous story intelligence — `tf-2-11`

- Its Task 5 and Task 6 were completed only because the calls were hand-corrected during the run. Its record says so; this story is what removes the need.
- `tf-2-11` AC8 proved the registry block is cleanly hand-removable to a **zero git diff**. Reuse that as Task 5's cleanup check — `git checkout` would test git, not removability.
- The pilot's own `_pilot-test` files contaminated a framework-wide grep taken before cleanup, which published a wrong denominator (corrected at R1). **If you grep the framework while a throwaway team exists on disk, you are measuring your own artifact.**

### Testing standards

- `tests/team-factory/` uses `node:test`; 184 tests currently.
- `project-context.md` rule `test-fixture-isolation`: any test shelling out to a CLI passes `{ cwd: tmpDir }`. Not expected here — these are direct library calls.
- `project-context.md` rule `verification-must-be-falsifiable`: Task 4's red-then-green demonstration is mandatory, not optional. The whole defect exists because 184 tests passed against a contract nothing met.

## Dev Agent Record

### Agent Model Used

Claude Opus 5 (1M context), via `bmad-dev-story`.

### Completion Notes List

**All 5 tasks complete; AC#1-#6 satisfied. `npm test` 2256 tests / 2255 pass / 0 fail / 1 pre-existing skip (up 3 — the new real-agent tests). `npm run lint` clean at `--max-warnings 0`.**

**Task 1 — six call sites corrected, plus a seventh defect found while doing it.** `buildManifest` is **synchronous** (`manifest-tracker.js:21`, no `async`) and `step-04` §8 called `.then()` on it — a defect neither `T130` nor the story listed, found by checking declared arity rather than trusting the row. All seven now verified against `Function.length`: `detectCollisions` 2, `createConfig` 3, `createCsv` 2, `validateActivation` 2, `buildManifest` 2 (sync), `validateTeam` 3. `writeRegistryBlock` was left untouched as instructed — it was already correct. §5's `expect: no collisions with existing config fields` was prose a real call could not fail; it now asserts on `result.length`.

**Task 2 — Decision 1 implemented as (c) with one deliberate refinement, per the story's instruction to state the choice here.** A pure config-derivation would have broken the existing test `'reports error for wrong module path'`, whose fixture carries a *correct* config path and a *wrong* `module=` attribute — under pure derivation it would have started passing, silently deleting real coverage. **Implemented instead: derive module identity from the config reference, but honour an explicit `module=` when one is present.** The attribute becomes an additional signal rather than a required convention. This satisfies the ruling's intent (satisfiable by every shipped agent, no invented convention), passes Loom Master, and keeps the pre-existing assertion alive. Check 2 was also changed from a bare `includes()` to a normalised-tail comparison so it accepts either the `{project-root}/` convention form or a resolved absolute path.

**Task 3 — Decision 2 implemented as (a).** The gate moved `§3c → §5c`, deliberately placed **before** the registry write (§5d, renumbered from 5c) so a malformed agent is never wired into the shared production registry. §3c now carries an explicit tombstone explaining why validation is absent there, and §5c carries the accepted-cost note so a later reviewer does not file per-team feedback as a regression. Visibility Checklist updated; `Concept count: 2/3` re-checked and unchanged — activation validation runs silently and was never a surfaced concept, so NFR2's ceiling is not approached.

**Task 4 — falsifiability proven, not asserted.** Two mutations against the real shipped agent: repointing its activation config at `_vortex` turned the Loom Master test red *and* flipped the negative twin; removing the activation block entirely turned it red. Restored byte-identical (`git diff` empty) and back to 12/12. The existing synthetic-fixture tests were kept — they were never wrong, only never joined to reality.

**Task 5 — the corrected flow ran end to end.** A throwaway `_tf212-check` team was generated with an agent carrying **no `module=` attribute** — precisely the shape the pre-fix validator rejected — and §5c returned `valid: true`. §5a/§5b/§5d/§8 all succeeded at the corrected arities; the registry write added 5 exports and was hand-removed to a **zero git diff**, with `require()` re-verified. Throwaway deleted.

**One expected non-pass, recorded so it is not mistaken for a regression:** `step-05`'s `validateTeam` now executes correctly with its 3-argument signature and returns a real verdict — `valid: false`, on exactly one error, `VORTEX-REGRESSION`. That is **`T128`** (the terminal gate delegates to `validateInstallation` against a source tree and cannot pass there), which is filed, out of scope, and explicitly listed in this story's "NOT this story" section. AC#1 asks that the calls not fail on arity or type; it does not claim `validateTeam` returns true.

**Deliberately NOT done, to keep the diff reviewable:** `step-04` §8's manifest block still has **no `expect:` line at all**. Fixing the signature was in scope; adding a missing assertion was not, and it belongs with `T133`, which already owns manifest defects. Also not done: a test that parses the step files and asserts each `run:` block's arity against the library it names. That would prevent this entire defect class from recurring and is the natural successor to this story — but it is not in any task here, so it is recorded rather than built.

### Round 1 Review — 2026-09-10 (self-review at the landing point)

**Two defects found in this story's own implementation, both fixed. `npm test` 2256/2255/0 fail after; lint clean.**

**R1-1 — the fix reproduced its own defect class one level up.** Correcting the six `run:` blocks introduced three placeholders that appear in exactly one command each and are **defined nowhere**: `{agent_file_paths}` (1 occurrence, mine), `{module_root}` (3, all mine), `{generation_context}` (2, both mine). Compare `{team_name_kebab}` at 10 occurrences across 5 files. A driver reading the workflow could not resolve them — which is precisely the "instructions that cannot be executed as written" defect this story exists to remove. Fixed by adding a **Placeholders used in this step** table to `step-04-generate.md` and a `{generation_context}` note to `step-05-validate.md`; `{config_path}` and `{registry_path}` were pre-existing and equally undefined, and are now defined too.

**R1-2 — check 4 read only the first config reference.** `.match()` returns one result, so an activation block that legitimately mentions another module's config alongside its own would be rejected whenever its own reference came second. Caught by adversarial probe, not by the test suite. Now uses `matchAll` and asks whether the block references its own module at all, rather than whether the first reference happens to be its own. Three probes verify: own-only PASS, own-plus-other PASS, other-only FAIL.

**Probed and found sound, recorded so the next reviewer need not repeat it:** a degenerate `configPath` (e.g. bare `config.yaml`) does **not** turn check 2 into a pass-everything gate — probe returns `valid: false`. An agent referencing the wrong module still fails.

### File List

- `_bmad/bme/_team-factory/lib/writers/activation-validator.js` (modified) — checks 2 and 4
- `_bmad/bme/_team-factory/workflows/add-team/step-02-connect.md` (modified) — §5 call + expect
- `_bmad/bme/_team-factory/workflows/add-team/step-04-generate.md` (modified) — §3c tombstone, §5a/§5b calls, §5c gate moved in, §5c/§5d renumbered, §8 call, Visibility Checklist, Concept count
- `_bmad/bme/_team-factory/workflows/add-team/step-05-validate.md` (modified) — `validateTeam` call
- `tests/team-factory/activation-validator.test.js` (modified) — 3 real-agent tests added
- `_bmad-output/implementation-artifacts/tf-2-11-end-to-end-pilot-run.md` (modified) — superseding note
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (modified) — row → review

## Change Log

| Date | Change |
|------|--------|
| 2026-09-10 | Story authored via `bmad-create-story` from `T129` + `T130`. Scope deliberately excludes `T131` (persona collection), which is blocked on an NFR2 ruling. Two operator rulings are called out in Dev Notes and must be answered before Task 2 lands. |
| 2026-09-10 | Decisions 1 and 2 ruled by Amalik: check 4 re-expressed against the config path (not deleted, not backed by a new `module=` convention); check 3 kept with the per-agent gate moved after config creation. Both recorded inline at their decision points and in the tasks that depend on them. |
| 2026-09-10 | Implemented. All 5 tasks, AC#1-#6. Seven signatures corrected (a synchronous `buildManifest` called with `.then()` was found beyond the six the rows listed). Check 4 derives module identity from the config reference and honours an explicit `module=` when present — chosen over pure derivation because pure derivation would have silently deleted the existing wrong-module test's coverage. Gate moved §3c → §5c, ahead of the registry write. Falsifiability demonstrated by two mutations against the real shipped agent, restored byte-identical. End-to-end re-run passed with an agent carrying no `module=`. `npm test` 2256/2255/0 fail; lint clean. |
| 2026-09-10 | **R1 at the landing point — two defects in this story's own work, both fixed.** (1) Three placeholders introduced by the Task 1 corrections were defined nowhere, reproducing the story's own defect class one level up; a Placeholders table now defines all six the workflow uses. (2) Check 4 used `.match()` and so read only the first config reference, falsely rejecting an activation block whose own reference came second; now `matchAll` + membership test, verified by three probes. Check 2 separately probed against a degenerate `configPath` and does not weaken. |
