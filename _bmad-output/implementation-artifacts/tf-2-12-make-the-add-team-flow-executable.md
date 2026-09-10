# Story 2.12: Make the add-team flow executable

Status: ready-for-dev

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

- [ ] **Task 1: Correct the six call sites** (AC: #1)
  - [ ] `step-02-connect.md:83` — replace the bare `require` + comment stub with a real call to `config-creator.js::detectCollisions(specData, bmeRoot)`; the current line executes a comment and its `expect: no collisions` is satisfied by a command that checks nothing
  - [ ] `step-04-generate.md:91` (§5a) — `createConfig({spec_data})` → `createConfig(specData, outputPath, bmeRoot)` (`config-creator.js:22`)
  - [ ] `step-04-generate.md:97` (§5b) — `createCsv({spec_data})` → `createCsv(specData, outputPath)` (`csv-creator.js:26`)
  - [ ] `step-04-generate.md:72` (§3c) — `validateActivation('{agent_file_path}', '{config_path}')` → `validateActivation(agentFiles[], moduleConfig{})` (`activation-validator.js:30`). **A string argument iterates character-by-character** — the current form produces one result object per character
  - [ ] `step-04-generate.md:137` (§8) — `buildManifest({spec_data})` → `buildManifest(specData, generationContext)` (`manifest-tracker.js:21`)
  - [ ] `step-05-validate.md:21` — `validateTeam({spec_data}, '{project-root}')` → `validateTeam(specData, generationContext, projectRoot)` (`end-to-end-validator.js:23`). This one was already documented in `tf-2-11`'s Known Issues on 2026-04-22 and never generalised
  - [ ] Confirm `step-04-generate.md`'s §5c `writeRegistryBlock(specData, registryPath)` is left ALONE — it matches `registry-writer.js:25` and is the only correct call in the set

- [ ] **Task 2: Repair the activation validator's contract** (AC: #2, #3)
  - [ ] **Check 4** (`activation-validator.js:94`) — requires `module="..."` **inside** the `<activation>` block. Survey: all of `_bmad/` holds 12 `<activation critical="MANDATORY">` + 2 bare `<activation>` = 14 total, **zero** with `module=`. **OPERATOR RULING NEEDED — see Dev Notes §Decision 1.** Recommended: derive module identity from the config path check 2 already validates, rather than demanding a redundant attribute nothing emits
  - [ ] **Check 2** (`:71`) — `activationContent.includes(moduleConfig.configPath)` is a raw substring match with no normalisation, so it passes or fails on the caller's string form. Accept both the `{project-root}/`-prefixed convention form and a resolved absolute path
  - [ ] **Check 3** (`:82`) — requires `config.yaml` on disk, but §3c validates agents two sections before §5a creates it. **OPERATOR RULING NEEDED — see Dev Notes §Decision 2**
  - [ ] Do NOT touch checks 1 or 5 — both are correct and both pass today

- [ ] **Task 3: Fix the ordering the validator gate depends on** (AC: #4)
  - [ ] Apply whichever of Decision 2's options the operator rules; if the gate moves, update `step-04-generate.md`'s section numbering and its Visibility Checklist so the documented order matches the executed order

- [ ] **Task 4: Test against reality, not fixtures** (AC: #5, #6)
  - [ ] Add a test in `tests/team-factory/activation-validator.test.js` that runs `validateActivation` against `_bmad/bme/_team-factory/agents/team-factory.md` and asserts `valid === true`
  - [ ] Add the negative twin: a real-shaped agent with a deliberately wrong config path must still return `valid: false` (guards AC#3)
  - [ ] **Prove the new test can fail.** Temporarily break the shipped agent's activation block, confirm red, restore. Per `project-context.md` rule `verification-must-be-falsifiable` — a test that cannot fail is not coverage
  - [ ] Keep the existing synthetic-fixture tests; they are not wrong, they were just never joined to reality
  - [ ] `npm test` — 0 failures, skip count unchanged

- [ ] **Task 5: Close the loop on tf-2-11** (AC: #1, #2)
  - [ ] Re-run the pilot's Step 4 + Step 5 path against a throwaway team to confirm the flow completes without hand-patching. Delete the throwaway per `tf-2-11` AC8 (module dir + registry block + spec file), and verify the registry returns to a **zero git diff**
  - [ ] Note in `tf-2-11`'s record that its Tasks 5-6 were completed with hand-corrected calls, and that this story removes that need

## Dev Notes

### Decision 1 — Check 4 needs an operator ruling before you touch it

Three options, and the wrong two are both tempting:

- **(a) Delete check 4.** Fastest, and it makes the validator weaker for no gain. This is precisely the `T121` failure mode already filed against this project: a gate that passes what it exists to catch. **Do not do this.**
- **(b) Make the generator emit `module=`.** Keeps the check, but invents a framework-wide convention on the authority of one story, and every hand-written agent in `_bmad/` then fails a gate it never agreed to. Out of scope.
- **(c) RECOMMENDED — re-express check 4 against what agents actually contain.** The activation block already references its config as `{project-root}/_bmad/bme/_{team}/config.yaml`. The module path is derivable from that string. Check 4 becomes "the activation block's config reference resolves to the expected module", which is a real assertion, is satisfiable by every shipped agent, and does not require a new convention.

Under (c), checks 2 and 4 partly overlap. That is acceptable — or fold them into one check with two failure messages. Either is fine; state which you chose in the Dev Agent Record.

### Decision 2 — Check 3's ordering

- **(a) RECOMMENDED — move the per-agent validation gate** from §3c to after §5a creates `config.yaml`. The check is legitimate; only its placement is wrong. Cost: §3's "validate immediately after generating each agent" becomes "validate all agents after config exists", which slightly weakens per-agent feedback.
- **(b) Drop check 3 from per-agent validation** and rely on check 5 (module directory exists) plus end-to-end validation. Cheaper, loses a real assertion.

Prefer (a). If you take (b), say why in the Dev Agent Record.

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

### Completion Notes List

### File List

## Change Log

| Date | Change |
|------|--------|
| 2026-09-10 | Story authored via `bmad-create-story` from `T129` + `T130`. Scope deliberately excludes `T131` (persona collection), which is blocked on an NFR2 ruling. Two operator rulings are called out in Dev Notes and must be answered before Task 2 lands. |
