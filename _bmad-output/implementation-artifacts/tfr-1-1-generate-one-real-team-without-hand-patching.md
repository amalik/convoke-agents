---
baseline_commit: 3c2b011265368f1c4956b0b95317a787a349e331
---

# Story tfr-1.1: Generate one real team end to end without hand-patching

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

**Epic:** [tfr-epic-1 — Team Factory Repair](../planning-artifacts/convoke-epic-team-factory-repair.md) (incident-driven mini-epic, created 2026-09-14 by operator ruling; `lint-epic-1` / `cov-epic-1` / `i97-bug-epic-1` / `ci-hygiene-epic-1` precedent)
**Origin:** four backlog rows — `T136` (6.0), `T164` (5.0), `T163`(a) (5.0), `T128` (5.0), all `loom`, all Open.
**Namespace decision:** Convoke-owned `_bmad/bme/_team-factory/`. No new skill, no new agent, no upstream BMAD surface touched. `namespace-decision-for-new-skills` is satisfied by construction — every file edited already lives under `_bmad/bme/`.
**Covenant:** no new `_bmad/bme/` skill or workflow is authored; `step-04`/`step-05` are existing workflow steps being corrected, not added. `covenant-compliance-for-convoke-skills` applies as a no-regression check, not an authoring gate.
**Safety analysis (`path-safety-for-destructive-ops`):** in scope. Task 3 touches the output-directory containment predicate, whose value reaches `manifest-tracker.js::formatAbortInstructions` as an `rm` target. Task 1 introduces files written to a temp location and read back. See §Safety Analysis.

## Story

As a **contributor building a new Convoke team**,
I want **to follow `add-team` from start to finish, pasting each `run:` block verbatim and trusting the terminal gate**,
so that **the factory produces a team I keep, instead of one I hand-patch and then delete**.

## Context

The Team Factory has produced **zero surviving teams**. `_vortex`, `_gyre` and `_team-factory` all predate it, and `tf-2-11`'s pilot team was deleted by its own AC8. Three repair stories (`tf-2-11` validate, `tf-2-12` executable, `tf-2-13` correct-on-arrival) have each fixed seven things and left residue; the open `loom` count went 13 → 15 while three stories were closing.

This story is the epic's whole scope: the four rows that stand between a contributor and one real team. Everything else in the module — eight further confirmed rows — is deliberately parked until a generated team survives, because those rows guard paths nobody has walked.

**Scope boundary — do NOT fix these, even when you are standing in the file:**

| Row | What it is | Why not here |
|---|---|---|
| `T163`(b) | `registry-writer.js::agentIdFromPath` case-sensitive on `.MD` | Same file as Task 4, explicitly excluded by the epic's row split. A `SKILL.MD` is not on the generation path — BMB writes `SKILL.md`. |
| `T165`(a) | abort path emits `rm` against a directory | Recovery path, not generation path. |
| `T165`(b) | shipped `config-creator` CLI resolves `bmeRoot` one level too high, creating `_bmad/_<team>/` | **Load-bearing for Task 1's design choice** — see §Task 1. It stays out of scope *because* Task 1 declines the CLI transport. |
| `T166` | R2-5 persona extraction in `registry-appender` is unreachable and untested | add-agent path. |
| `T127` | factory emits v5 agents | **Ruled 2026-09-11: accept.** Do not "fix" it. |
| `T132`, `T134`, `T137`, `T138`, `T141`, `T151`, `T139`, `T147` | parked / not factory code | Epic states the gate: revisit when a generated team survives. |

If you find yourself needing one of these to finish a task, stop and say so — that is a scope finding, not a licence.

## Acceptance Criteria

**AC#1 — every `run:` block in `add-team` executes verbatim with real data.**
There are **12** `run: node -e` blocks across the four step files. None of them may build a JS object inside the shell string. A contributor copying any block, substituting only placeholders the step file defines, gets the block's stated `expect:` outcome. Demonstrated against a spec whose `description` contains **both** a double quote and an apostrophe. Derive the count from source before claiming completeness (`derive-counts-from-source`):

```bash
grep -rhc '^run: node -e' _bmad/bme/_team-factory/workflows/add-team/*.md
```

**AC#2 — `{generation_context}` survives between steps.**
The context Step 4 accumulates is readable by Step 5 in a separate shell invocation. `step-05-validate.md`'s current caveat — *"It is an in-memory Step-4 value with no persistence mechanism: if Step 4 and Step 5 are run in separate sessions it is gone"* — is no longer true, and that paragraph is corrected rather than left standing.

**AC#3 — one containment predicate, three callers, and a test that proves they agree.**
`spec-parser.js::isContainedOutputDirectory`, `config-creator.js::assertContainedOutputDirectory` and the inline check in `config-creator.js::ensureOutputDirectory` are replaced by a single exported predicate that all three sites call. `_bmad-output/..foo` is **accepted** by every site (it resolves genuinely inside the output root); `_bmad-output/../../escaped`, bare `_bmad-output`, `''`, absolute paths and non-strings are **rejected** by every site. The agreement is asserted by a test that iterates one shared case table across all call sites — not three separate tests that could drift apart again.

**AC#4 — a hollow team cannot report success.**
`writeRegistryBlock` reports persona coverage: given `specData.agents`, it states which agent ids received a non-empty persona. An unusable `options.agentFiles` (absent, a bare string, a non-array, paths that do not exist) no longer passes silently. `end-to-end-validator.js` gains a check that fails when a declared agent has an empty persona, so the terminal gate — not the writer's `success` flag — is what stops a hollow team.

**AC#5 — `step-04` §5d instructs the executor to record its result.**
§5d's `expect:` block names `registry_wiring_result` and says to record it, in the same shape §5a-ii and §5c already use. The key stops being documented only in the Placeholders table.

**AC#6 — the terminal gate can return true on a correctly generated team.**
`checkVortexRegression` asks a **differential** question: did the factory's changes break anything that was working before? It passes when the post-generation failing-check set is not larger than the pre-generation baseline. Proven by running the full `validateTeam` against a real generated team in this source tree and observing `valid === true`.

**AC#7 — every AC is proven RED before GREEN, and each fix is killed by a mutant that targets it alone.**
Per `verification-must-be-falsifiable`: record a **mutant → sole-executioner test** table, not a pass/fail tally. Name the assertion that dies, never the count. A test no mutant uniquely kills is deleted or rewritten.

**AC#8 — a real team is generated end to end, kept long enough to be verified, then removed to a zero git diff.**
Not a unit fixture. Walk `add-team` as a contributor would, pasting the blocks. Record what the run produced. Then restore the tree — `agent-registry.js` back to a zero `git diff`, `require()` re-verified — and say so.

## Tasks / Subtasks

- [ ] **Task 1 — Replace the `run:` block transport (AC: #1, #2) — `T136`**
  - [ ] Add a context-file mechanism: Step 4 writes `{spec_data}` and the accumulating `{generation_context}` to a JSON file under the run's own scratch location, and every `run:` block receives a **path**, never an object.
  - [ ] Rewrite the **8** blocks that interpolate a named object placeholder (`{spec_data}`, `{generation_context}`, `{agent_file_paths}`) so none is substituted into a `node -e "…"` string.
  - [ ] Update `step-04-generate.md` §Placeholders: `{spec_data}` and `{generation_context}` now resolve to file paths; state where the file lives and who writes it.
  - [ ] Correct `step-05-validate.md`'s persistence caveat paragraph (AC#2) — it currently tells the operator to re-run Step 4's §5 wiring.
  - [ ] Verify with a spec whose `description` is `He said "go" — it's fine`, containing both quote characters.

- [ ] **Task 2 — The other four `run:` blocks (AC: #1)**

  The 8 in Task 1 are not the whole surface. The remaining four break down as:

  - [ ] **`step-01-scope.md` collision check — hand-builds an object and cannot execute at all.** It reads `cd.detectCollisions({team_name_kebab: '{kebab}', agents: [{id: '{id1}'}, ...]}, …)`. The literal `...` is not valid JS, and `{kebab}` / `{id1}` are placeholders **`step-01` never defines** — the exact class `step-04`'s Placeholders table preamble exists to remove (*"a name that appears in exactly one command and is defined nowhere cannot be resolved by whoever drives the flow"*). Route it through the same context file as Task 1, and give `step-01-scope.md` a Placeholders table or delete the undefined names.
  - [ ] **`step-05-validate.md` §3 Regression Check — a no-op with a stray token.** It reads `run: node -e "require('{project-root}/scripts/update/lib/validator.js')" logic`: requires a module, calls nothing, asserts nothing, and trails a bare `logic`. `validateTeam` already runs the regression check via `checkVortexRegression`, so this is redundant as well as inert. **Prefer deletion** and say so in the record.
  - [ ] **The two scalar-only blocks** (`getCascadeForPattern('{pattern}')` and the `naming-utils` id check) are safe for kebab-shaped values. Confirm that by execution rather than by inspection, and leave them alone if they hold.

- [ ] **Task 3 — One containment predicate (AC: #3) — `T163`(a)**
  - [ ] Extract a single exported containment predicate. Decide its home: it is currently half in `spec-parser.js` and half in `config-creator.js`; a small shared module under `lib/utils/` is the obvious third option.
  - [ ] Delete the two duplicate implementations and the inline check in `ensureOutputDirectory`. This is **deletion, not a fourth rewrite** — see §Why this is a deletion.
  - [ ] Write the shared case table (`shared-test-constants`) and iterate it across all call sites.
  - [ ] Confirm `_bmad-output/../../escaped` is still rejected at `buildConfigData` — R3 put that guard there deliberately and it must survive the refactor.

- [ ] **Task 4 — Persona coverage is reported and gated (AC: #4) — `T164`(a)**
  - [ ] `writeRegistryBlock`: report coverage of `specData.agents` by extracted personas. Do **not** change what `success` means — see §Trap: the fourth predicate.
  - [ ] Reject or report an unusable `options.agentFiles` rather than coercing it to `[]` inside `writeRegistryBlock`.
  - [ ] Add the terminal check in `end-to-end-validator.js` that fails on an empty persona for a declared agent.
  - [ ] Do not fork `buildAgentEntry` — `registry-appender.js::appendAgentToBlock` calls the same helper, and that sharing is deliberate.

- [ ] **Task 5 — `step-04` §5d records its result (AC: #5) — `T164`(b)**
  - [ ] Add the `expect:` record instruction, phrased like §5a-ii and §5c.

- [ ] **Task 6 — The terminal gate asks a differential question (AC: #6) — `T128`**
  - [ ] Capture a pre-generation `validateInstallation` baseline and carry it in `{generation_context}` (Task 1's context file makes this persistable).
  - [ ] Rewrite `checkVortexRegression` to compare post against baseline.
  - [ ] Replace the VORTEX-REGRESSION assertions in `tests/team-factory/end-to-end-validator.test.js` — they currently check only `assert.ok(vortexCheck)` and `assert.equal(vortexCheck.stepName, 'regression')`, never `.passed`, under the comment *"Vortex regression runs but may fail due to pre-existing project state"*. A test that documents the defect instead of catching it.

- [ ] **Task 7 — Falsifiability battery (AC: #7)**
  - [ ] One mutant per property. Record mutant → the single test that dies.
  - [ ] Assert each mutant actually applied before reading the result (`tf-2-13` had a `sed` choke silently on `|` and report a meaningless pass).

- [ ] **Task 8 — End-to-end run and clean removal (AC: #8)**
  - [ ] Generate a throwaway team by walking the flow.
  - [ ] `createConfig` and `createCsv` are additive-only (each opens with `if (await fs.pathExists(outputPath))`) — the throwaway cannot be regenerated in place; delete first.
  - [ ] Restore `agent-registry.js` to a zero `git diff` and re-verify with `require()`.
  - [ ] Check for stray `_bmad/_<team>/` directories before finishing — `T165`(b) produced two during `tf-2-13`'s reviews.

## Dev Notes

### Staleness pre-flight — run 2026-09-14, verdict GREEN, all four reproduce at HEAD `3c2b0112`

Run because `T136` and `T128` were qualified 2026-09-10 (>3 days) and because `tf-2-13` landed in between — the parallel-tracks trigger, which has no age exemption.

| Check | Result |
|---|---|
| 1 Existence | 8 commits touched `_bmad/bme/_team-factory/` since 2026-09-09, all `tf-2-12`/`tf-2-13`. No commit claims to close any of the four. |
| 2 Dependency | `T130` (T136's predecessor), `T131` and `T133` (T163's) are all in §2.5 Absorbed — expected state. |
| 3 Code-anchor | Every cited path exists; each defect re-derived against source below. |
| 4 Semantic | `code-review-convergence`, `path-safety-for-destructive-ops` and `verification-must-be-falsifiable` unamended since qualification. |

**Reproductions, run rather than reasoned:**

- **`T136`** — `node -e "const s = {"team_name":"forge","agents":[{"id":"emma"}]}; …"` → `const s = {team_name:forge,agents:[{id:emma}]}` → parse error. The outer `"` strips every inner `"`, so **plain JSON with no embedded quote already fails**; the row's quote-in-description example is the sharper case, not the only one.
- **`T128`** — `validateInstallation({}, projectRoot)` at HEAD returns `valid:false`: 6 pass (Config structure, Agent files, Workflow files, Agent manifest, Deprecated workflows, Workflow step structure), 3 fail (Enhance, Artifacts, Portability modules). `validateTeam` closes over `checks.every(c => c.passed)`, so it can never return true here.
- **`T163`(a)** — `_bmad-output/..foo` resolves to `…/BMAD-Enhanced/_bmad-output/..foo`, genuinely inside the root. `buildConfigData` **accepts** it and writes `output_folder: '{project-root}/_bmad-output/..foo'`; `ensureOutputDirectory` **refuses** it. **Worse than the row states:** §5a writes `config.yaml` before §5a-ii runs, so the flow leaves a config on disk pointing at a directory the factory then declares illegal — an inconsistent half-written state, not merely a false rejection.
- **`T164`(a)** — `writeRegistryBlock` coerces any non-array `options.agentFiles` to `[]` (`Array.isArray(options.agentFiles) ? options.agentFiles : []`). Nothing compares the resulting `personas` keys against `specData.agents`.
- **`T164`(b)** — `step-04-generate.md` §5d's `expect:` block says `→ proceed`. §5a-ii and §5c both say to record. Confirmed by reading the file.

### The three containment predicates — why Task 3 is a deletion

There are not two guards, there are **three**:

| Site | Form | `_bmad-output/..foo` |
|---|---|---|
| `spec-parser.js::isContainedOutputDirectory` | normalise + segment scan | accepts |
| `config-creator.js::assertContainedOutputDirectory` | near-duplicate of the above, plus `{project-root}/` stripping | accepts |
| `config-creator.js::ensureOutputDirectory`, inline | `path.relative` + `startsWith('..')` | **refuses** |

Two of the three are copies of each other and the third disagrees. The predicate has now been written three times across two review rounds — `code-review-convergence`'s over-build clause: *"When a fix keeps leaking in the same place, suspect OVER-BUILD, and prefer deletion to a further rewrite."* Fixing `startsWith('..')` to `rel === '..' || rel.startsWith('..' + path.sep)` would be a **fourth** implementation and would leave the duplication that caused the drift. Collapsing to one predicate fixes the class.

Per that same clause, the narrowing must be **recorded, not silent**: name in the Dev Agent Record what was deleted and why.

### Task 1 — the transport decision, and the two options declined

The epic leaves the substitution contract open. The story chooses **a context file**, and the reasoning is recorded so it can be overturned deliberately rather than drifted past:

- **Declined — single-quote the `-e` payload.** `node -e 'const s = {"a":"b"}; …'` survives double quotes and dies on the first apostrophe. Team descriptions contain apostrophes routinely. A half-fix that fails on the next realistic input is the shape this module keeps producing.
- **Declined — a CLI per writer.** Four writers already carry `require.main === module` CLIs taking `--spec-file <path>`, so the pattern exists. But routing the flow through them puts `T165`(b) — `bmeRoot` resolved one level too high, creating `_bmad/_<team>/` — directly on the generation path, and `T165` is out of scope. It also duplicates argument parsing four more times.
- **Chosen — write the data to a file, pass the path.** No data is interpolated into a shell string at all, so the class is closed rather than narrowed. It costs one write per step. And it **fixes AC#2 for free**: `{generation_context}` currently has no persistence mechanism, which `step-05-validate.md` documents as a live hazard causing *"false failures on a correctly generated team"*.

The two fixes compose: Task 6's pre-generation baseline needs somewhere to live across steps, and Task 1's context file is that place.

**If you disagree with this contract, say so before starting — it is the one decision in this story worth overturning up front, and cheap to change now and expensive after 12 blocks are rewritten.**

### Platform scope for the shell form

POSIX/bash is the supported surface: every CI job is `ubuntu-latest`, and `.github/workflows/ci.yml:366` records *"Bash and ubuntu-only by design; Windows install behaviour is tracked separately as I128."* Do not widen the transport design for `cmd.exe`; do not claim it works there either.

### Trap: the fourth predicate

`registry-writer`'s success predicate has now been rewritten four times — unconditional → `success !== false` → `success === true` → `written.length > 0` — and the R3 record names the lesson: *"the fixture was the incomplete thing all along"*, corrected once per predicate. **Task 4 must not become a fifth.** Persona coverage is a *different fact* from write success; report it as its own field and gate it at the terminal validator. Changing what `success` means again is the failure this note exists to prevent.

### Trap: reasoning about the consumer without reading it

`tf-2-13`'s R3 named the module's recurring fault precisely: *"I reason about the CONSUMER without reading it."* Twice in one story — a claim that the abort path "asks the operator to check a file" when it emits `git checkout`, and a guard justified "because the CLI bypasses parseSpec" when the CLI never calls that function. Before asserting what any of these changes does for a caller, **open the caller**. Specifically:

- `manifest-tracker.js::formatAbortInstructions` consumes the output directory path as a removal target.
- `registry-appender.js::appendAgentToBlock` shares `buildAgentEntry` with `registry-writer`.
- `end-to-end-validator.js::checkRegistryWiring` reads `ctx.registry_wiring_result`.
- `end-to-end-validator.js::checkContractFiles` passes **vacuously** when `contract_files` is absent.

### Traps carried forward from `tf-2-13`

- **`buildAgentEntry` is shared** by `registry-writer` and `registry-appender` — fixes propagate to add-agent for free. Do not fork it.
- **Idempotency (NFR4) is within-version.** Deterministic for a given spec; never a counter over iteration order.
- **`createConfig` / `createCsv` are additive-only** and refuse to overwrite. Task 8's throwaway must be deleted before any regeneration.
- **Measuring the framework while your own artefact is on disk** produced two wrong counts during `tf-2-11`. Task 8's cleanup ordering is not pedantry.
- **A RED you do not read is indistinguishable from a test that cannot run.** Three of `tf-2-13`'s test files first failed on import errors, each read as success.

### Safety Analysis (`path-safety-for-destructive-ops`)

Two surfaces:

1. **The containment predicate (Task 3)** validates a contributor-supplied path that reaches `formatAbortInstructions` as a removal target. The rule requires resolve + normalise + contains-check; the unified predicate must do all three. **Do not relax the `..`-segment rejection while fixing the `..foo` false-reject** — `_bmad-output/../../escaped` was a real escape in `tf-2-13` R2, written into `config.yaml` and recorded as an `rm` target. The case table must pin both directions.
2. **The context file (Task 1)** is written and read back by the flow. It is factory-authored, not contributor-authored, and is never used as a removal target. It must live inside the repo's own scratch area and must not be placed under `_bmad-output/` where the abort manifest sweeps.

### Testing standards

`tests/team-factory/` uses `node:test`. All four target suites already exist:
`end-to-end-validator.test.js` (289 lines), `config-creator.test.js` (338), `registry-writer.test.js` (695), `spec-parser.test.js`.

Governing rules, each load-bearing here:

- **`verification-must-be-falsifiable`** — AC#7. Mutant → sole-executioner table. A suite tally is not evidence; name the assertion that dies. Choose the *plausible wrong alternative* as the mutant, not "delete the call".
- **`test-fixture-isolation`** — any test that shells out or scans the tree runs against a fixture with explicit `cwd`/`projectRoot`, never `PACKAGE_ROOT`. Task 6's baseline logic is exactly the shape that tempts a live-tree assertion.
- **`fixture-determinism`** — Task 6 compares two `validateInstallation` runs. Assert on the *relation* (the failing set did not grow), never on the absolute count of failures, which is live repo state and will rot.
- **`derive-counts-from-source`** — no hardcoded agent counts anywhere in Task 4's coverage check.
- **`shared-test-constants`** — AC#3's case table is shared across call sites by construction.
- **`verification-pipefail`** — any verification command that pipes must use `set -o pipefail` or `${PIPESTATUS[0]}`.

**Known blind spot to close, not inherit:** `end-to-end-validator.test.js` asserts the VORTEX-REGRESSION check *exists* and nothing about whether it passed, under a comment excusing the failure as "pre-existing project state". That is `verification-must-be-falsifiable`'s "check that only ever passes". Task 6 replaces it.

### Project Structure Notes

All work is inside `_bmad/bme/_team-factory/` plus `tests/team-factory/`. No `_bmad/` directory is renamed (BMAD Method compatibility). `no-process-cwd-in-libs` applies to every new function: take `projectRoot` explicitly, never fall back to `process.cwd()` — `config-creator.js::ensureOutputDirectory` already models this, rejecting a non-absolute `projectRoot` outright.

**No new dependencies.** `fs-extra` (`^11.3.3`) and `js-yaml` (`^4.3.1`) are already direct dependencies and are what the module's writers use; Task 1's context file needs nothing beyond them and Node core. No external library research was required for this story, and none is claimed.

`npm run lint` says **nothing** about this work: `_bmad/` is excluded (`I126`). Run with `--no-ignore` and report the changed-file count separately from the directory count — `tf-2-13`'s record got this wrong twice in the same document.

### References

**Anchored by symbol, not by line, deliberately.** `T136`'s own R1 finding is that a line citation into a file the citing work is itself editing will always rot — that row cited `step-04-generate.md:99,106,113,155` and was wrong within hours. Every file below except `ci.yml` and the backlog is edited by this story, so they are cited by function and section. Two citations inherited from `tf-2-13`'s record were already stale when checked at HEAD (`registry-appender.js:57` is now `:65`); they are not reproduced here.

- [convoke-epic-team-factory-repair.md](../planning-artifacts/convoke-epic-team-factory-repair.md) — epic scope, the 4-of-15 split, and the gate on the parked eight
- [convoke-note-initiative-lifecycle-backlog.md](../planning-artifacts/convoke-note-initiative-lifecycle-backlog.md) — rows `T136`:273, `T128`:289, `T163`:291, `T164`:292
- [tf-2-13-make-a-generated-team-correct-on-arrival.md](tf-2-13-make-a-generated-team-correct-on-arrival.md) — §Round 2 Review, §Round 3 Review (the full text of all four rows' findings)
- [project-context.md](../../project-context.md) — `code-review-convergence`, `verification-must-be-falsifiable`, `path-safety-for-destructive-ops`, `test-fixture-isolation`, `fixture-determinism`, `shared-test-constants`, `derive-counts-from-source`, `no-process-cwd-in-libs`, `verification-pipefail`, `commit-preparation`
- [step-04-generate.md](../../_bmad/bme/_team-factory/workflows/add-team/step-04-generate.md) — §Placeholders, §5a–§5d, §8
- [step-05-validate.md](../../_bmad/bme/_team-factory/workflows/add-team/step-05-validate.md) — §2 `validateTeam`, §3 regression block, the `{generation_context}` persistence caveat
- [end-to-end-validator.js](../../_bmad/bme/_team-factory/lib/validators/end-to-end-validator.js) — `validateTeam`, `checkContractFiles`, `checkRegistryWiring`, `checkVortexRegression`
- [config-creator.js](../../_bmad/bme/_team-factory/lib/writers/config-creator.js) — `createConfig`, `buildConfigData`, `ensureOutputDirectory` (+ its inline guard), `assertContainedOutputDirectory`, `prefixProjectRoot`, and the `require.main === module` CLI at the foot
- [registry-writer.js](../../_bmad/bme/_team-factory/lib/writers/registry-writer.js) — `writeRegistryBlock` (+ its `agentFiles` coercion), `agentIdFromPath`, `extractPersonaFromAgentFile`, `buildModuleBlock`
- [spec-parser.js](../../_bmad/bme/_team-factory/lib/spec-parser.js) — `isContainedOutputDirectory`, and its caller in the `integration.output_directory` validation branch

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List

## Change Log

| Date | Note |
|---|---|
| 2026-09-14 | Story authored via `bmad-create-story` from the `tfr-epic-1` scoping ruling (`T136`, `T164`, `T163`(a), `T128`). Staleness pre-flight run at HEAD `3c2b0112` — **GREEN**, all four reproduced by execution, one finding sharper than its row (`T163`(a) leaves a half-written config, not only a false reject) and one broader (`T136` fails on plain JSON, not only quote-bearing JSON). One open decision recorded and pre-answered: the `run:` block transport contract, chosen as a context file with the CLI and single-quote alternatives declined and the reasons given. Two scope corrections made during authoring, both by counting rather than assuming: the `run:`-block surface is 12 blocks, of which 8 carry object placeholders, 1 hand-builds an object with a literal `...` that is not valid JS *and* uses two placeholders its step file never defines, 1 is an inert no-op, and 2 are scalar-safe. Scope excludes `T163`(b), `T165`, `T166`, `T127`, `T132`, `T134`, `T137`, `T138`, `T139`, `T141`, `T147`, `T151`. |
