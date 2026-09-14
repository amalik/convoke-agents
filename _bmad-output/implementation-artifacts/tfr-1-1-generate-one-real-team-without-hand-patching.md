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
grep -rh '^run: node -e' _bmad/bme/_team-factory/workflows/add-team/*.md | wc -l
```

(`grep -rhc` prints a count *per file* — six numbers, not a total. Run what is written here.)

**AC#2 — `{generation_context}` survives between steps.**
The context Step 4 accumulates is readable by Step 5 in a separate shell invocation. `step-05-validate.md`'s current caveat — *"It is an in-memory Step-4 value with no persistence mechanism: if Step 4 and Step 5 are run in separate sessions it is gone"* — is no longer true, and that paragraph is corrected rather than left standing.

**AC#3 — one containment predicate, three callers, and a test that proves they agree.**
`spec-parser.js::isContainedOutputDirectory`, `config-creator.js::assertContainedOutputDirectory` and the inline check in `config-creator.js::ensureOutputDirectory` are replaced by a single exported predicate that all three sites call. `_bmad-output/..foo` is **accepted** by every site (it resolves genuinely inside the output root); `_bmad-output/../../escaped`, bare `_bmad-output`, `''`, absolute paths and non-strings are **rejected** by every site. **An already-`{project-root}/`-prefixed value stays accepted** — `assertContainedOutputDirectory` strips that prefix before validating precisely because `buildConfigData` is reached with a prefixed value on the bypass path, and a unified predicate that drops the stripping regresses what R3 fixed. The agreement is asserted by a test that iterates one shared case table across all call sites — not three separate tests that could drift apart again.

**AC#4 — a hollow team cannot report success.**
`writeRegistryBlock` reports persona coverage: given `specData.agents`, it states which agent ids received a non-empty persona. An unusable `options.agentFiles` (absent, a bare string, a non-array, paths that do not exist) no longer passes silently. `end-to-end-validator.js` gains a check that fails when a declared agent has an empty persona, so the terminal gate — not the writer's `success` flag — is what stops a hollow team.

**AC#5 — `step-04` §5d instructs the executor to record its result.**
§5d's `expect:` block names `registry_wiring_result` and says to record it, in the same shape §5a-ii and §5c already use. The key stops being documented only in the Placeholders table.

**AC#6 — the terminal gate can return true on a correctly generated team.**
`checkVortexRegression` asks a **differential** question: did the factory's changes break anything that was working before? It passes when the post-generation failing-check set is not larger than the pre-generation baseline. Proven by running the full `validateTeam` against a real generated team in this source tree and observing `valid === true`.

> **Reachability is reasoned, not executed — check it early.** A structural read of `validateTeam`'s nine checks found no second blocker of `T128`'s kind: seven read paths out of `{generation_context}` that a real run populates, and `checkRegistryRegression` needs only `require()` to succeed. But no full generation was run during authoring, so this is a reading, not a demonstration. `tf-2-11`'s AC#7 was unachievable for exactly this reason. **If a check other than VORTEX-REGRESSION blocks `valid === true`, that is a scope finding — report it, do not widen the story to fix it.**

**AC#7 — every AC is proven RED before GREEN, and each fix is killed by a mutant that targets it alone.**
Per `verification-must-be-falsifiable`: record a **mutant → sole-executioner test** table, not a pass/fail tally. Name the assertion that dies, never the count. A test no mutant uniquely kills is deleted or rewritten.

**AC#8 — a real team is generated end to end, kept long enough to be verified, then removed to a zero git diff.**
Not a unit fixture. Walk `add-team` as a contributor would, pasting the blocks. Record what the run produced. Then restore the tree — `agent-registry.js` back to a zero `git diff`, `require()` re-verified, **and `git status --porcelain` clean of untracked leftovers**, since the generated module directory is untracked and a zero diff says nothing about it. Say so.

## Tasks / Subtasks

- [x] **Task 1 — Replace the `run:` block transport (AC: #1, #2) — `T136`**
  - [x] **`{spec_data}` needs no new mechanism — the file already exists.** `step-01-scope.md` §5 *Save Progress* creates `team-spec-{team_name_kebab}.yaml` in `_bmad-output/planning-artifacts/`, and `spec-parser.js::parseSpec(specPath)` already takes a path. Pass the path and parse inside the block (`parseSpec(path).then(r => …r.spec…)`). `step-04`'s Placeholders table already defines `{spec_data}` as *"the parsed spec object from `team-spec-{team_name_kebab}.yaml` (see `spec-parser.js::parseSpec` → `.spec`)"* — the transport just has to match what the table already says. **Do not write the spec to a second JSON file**: duplicating state that is already on disk is the drift class Task 3 exists to delete.
  - [x] **`{generation_context}` is the one thing that needs a new file.** It is accumulated in memory across §3–§5 and persisted nowhere. Step 4 writes it to a JSON file as it accumulates; every block receives that **path**.
  - [x] Rewrite the **8** blocks that interpolate a named object placeholder (`{spec_data}`, `{generation_context}`, `{agent_file_paths}`) so none is substituted into a `node -e "…"` string.
  - [x] Update `step-04-generate.md` §Placeholders: `{spec_data}` and `{generation_context}` now resolve to file paths; say which file each is and who writes it.
  - [x] Correct `step-05-validate.md`'s persistence caveat paragraph (AC#2) — it currently tells the operator to re-run Step 4's §5 wiring.
  - [x] Verify with a spec whose `description` is `He said "go" — it's fine`, containing both quote characters.

- [x] **Task 2 — The other four `run:` blocks (AC: #1)**

  The 8 in Task 1 are not the whole surface. The remaining four break down as:

  - [x] **`step-01-scope.md` collision check — hand-builds an object and cannot execute at all.** It reads `cd.detectCollisions({team_name_kebab: '{kebab}', agents: [{id: '{id1}'}, ...]}, …)`. The literal `...` is not valid JS, and `{kebab}` / `{id1}` are placeholders **`step-01` never defines** — the exact class `step-04`'s Placeholders table preamble exists to remove (*"a name that appears in exactly one command and is defined nowhere cannot be resolved by whoever drives the flow"*). **It cannot use Task 1's context file** — that is a Step-4 artifact, and §4 runs *before* `step-01` §5 *Save Progress* creates the spec file, so at §4 there is nothing on disk to read. **And the order cannot simply be inverted:** §5 populates the spec with *"team identity, composition pattern, agents, overlap acknowledgments"* — and the acknowledgments are what §4 produces, so §4 must stay ahead of §5. The shape that works is for §4 to write its own scoping scratch file (the agent inventory it has just collected) and pass that path. Also give `step-01-scope.md` a Placeholders table or delete the undefined names.
  - [x] **`step-05-validate.md` §3 Regression Check — a no-op with a stray token.** It reads `run: node -e "require('{project-root}/scripts/update/lib/validator.js')" logic`: requires a module, calls nothing, asserts nothing, and trails a bare `logic`. `validateTeam` already runs the regression check via `checkVortexRegression`, so this is redundant as well as inert. **Prefer deletion** and say so in the record.
  - [x] **The two scalar-only blocks** (`getCascadeForPattern('{pattern}')` and the `naming-utils` id check) are safe for kebab-shaped values. Confirm that by execution rather than by inspection, and leave them alone if they hold.

- [x] **Task 3 — One containment predicate (AC: #3) — `T163`(a)**
  - [x] Extract a single exported containment predicate. Decide its home: it is currently half in `spec-parser.js` and half in `config-creator.js`; a small shared module under `lib/utils/` is the obvious third option.
  - [x] Delete the two duplicate implementations and the inline check in `ensureOutputDirectory`. This is **deletion, not a fourth rewrite** — see §The three containment predicates.
  - [x] Write the shared case table (`shared-test-constants`) and iterate it across all call sites.
  - [x] Pin **both** directions at `buildConfigData`: `_bmad-output/../../escaped` still **rejected** (R3 put that guard there deliberately), and `{project-root}/_bmad-output/team-artifacts` still **accepted**. Only the first half is obvious, and only the second half catches a predicate that forgot to strip the prefix.

- [ ] **Task 4 — Persona coverage is reported and gated (AC: #4) — `T164`(a)**
  - [ ] `writeRegistryBlock`: report coverage of `specData.agents` by extracted personas. Do **not** change what `success` means — see §Trap: the fourth predicate.
  - [ ] Reject or report an unusable `options.agentFiles` rather than coercing it to `[]` inside `writeRegistryBlock`.
  - [ ] Add the terminal check in `end-to-end-validator.js` that fails on an empty persona for a declared agent.
  - [ ] Do not fork `buildAgentEntry` — `registry-appender.js::appendAgentToBlock` calls the same helper, and that sharing is deliberate.

- [ ] **Task 5 — `step-04` §5d records its result (AC: #5) — `T164`(b)**
  - [ ] Add the `expect:` record instruction, phrased like §5a-ii and §5c.

- [ ] **Task 6 — The terminal gate asks a differential question (AC: #6) — `T128`**
  - [ ] Capture a pre-generation `validateInstallation` baseline and carry it in `{generation_context}` (Task 1's context file makes this persistable). **Ordering is the whole correctness of a differential:** it must be taken before §5d writes to `agent-registry.js` — `step-04` §1 is the natural home. A "baseline" captured after the write measures nothing.
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

`tests/team-factory/` uses `node:test`. All four target suites already exist — `end-to-end-validator.test.js`, `config-creator.test.js`, `registry-writer.test.js`, `spec-parser.test.js`. (Line counts deliberately omitted: they are live state, they rot, and nothing here depends on them.)

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

**Anchored by symbol, not by line, deliberately.** `T136`'s own R1 finding is that a line citation into a file the citing work is itself editing will always rot — that row cited `step-04-generate.md:99,106,113,155` and was wrong within hours. Every file below is edited by this story — the backlog included, since closing these four rows moves them — so all are cited by symbol, section or a grep that survives renumbering. The single line citation anywhere in this story is `ci.yml:366`, in a file nothing here touches. Two citations inherited from `tf-2-13`'s record were already stale when checked at HEAD (`registry-appender.js:57` is now `:65`); they are not reproduced here.

- [convoke-epic-team-factory-repair.md](../planning-artifacts/convoke-epic-team-factory-repair.md) — epic scope, the 4-of-15 split, and the gate on the parked eight
- [convoke-note-initiative-lifecycle-backlog.md](../planning-artifacts/convoke-note-initiative-lifecycle-backlog.md) — rows `T136`, `T128`, `T163`, `T164` in §2.3 Fast Lane. Find them with `grep -n '^| T136 |' <file>` rather than by line: closing a row is a **move** to §2.5 (`backlog-write-discipline`), so this story's own close renumbers every row below it.
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

Claude Opus 5 (1M context), via `bmad-dev-story`.

### Debug Log References

**Task 1 — RED, and a defect in my own first detector.** The gate `scripts/audit/run-block-transport.js` went red on the current tree at **15 findings**, but two of them were **false positives on correct code**: it flagged any `{identifier:` inside a payload, which fires on `step-01` §3's `JSON.stringify({ valid: …, id })` and on `step-04` §5c's authored options object — both authored literals whose values are quoted strings, both of which paste fine. A check that fires on correct input has no discriminating power, the same defect as one that never fires. Narrowed to two rules that discriminate: an interpolated **object-valued placeholder**, and a literal `...` ellipsis. Re-run: **12 findings across 9 blocks**, and `tests/audit/run-block-transport.test.js` now pins the non-firing case explicitly.

**Two test-fixture failures read rather than treated as RED.** `run-context.test.js` first failed on `composition_pattern: 'independent'` (the validator wants `Independent`) and then on a missing `schema_version` — my fixture, not the code, which is `tf-2-13`'s recorded trap. Rebuilt the fixture from `tests/team-factory/fixtures/test-team-spec.yaml`, the module's canonical example, instead of assembling it field by field.

### Debug Log References

### Completion Notes List

**Task 2 (AC#1) — the other four blocks.**

`step-01` §4 could never run: a literal `...` is not valid JavaScript, and `{kebab}`/`{id1}` were defined nowhere. It **cannot** use Task 1's context file — that is a Step-4 artifact and §4 runs before §5 creates the spec — and the order **cannot be inverted**, because §5 populates the spec with the overlap acknowledgments §4 produces. §4 now writes its own scoping scratch file one agent at a time, and `step-01-scope.md` gained the Placeholders table it never had. Capabilities are pipe-separated so a comma inside one cannot split the list.

`step-05` §3's block was **deleted**. `run: node -e "require('…/validator.js')" logic` required a module, called nothing, asserted nothing, and trailed a bare `logic` token. It could not fail, which made it worse than absent: it read as a regression check while performing none.

The two scalar blocks were confirmed **by execution**: the cascade block returns a decision set for `Independent`, and the naming block returns `{"valid":true}` for `knowledge-surveyor` and `{"valid":false}` for `Bad_Id9` — it can say no, so it is a check.

**Task 3 (AC#3) — `T163`(a). Three predicates became one, by deletion.**

`spec-parser.js::isContainedOutputDirectory` and `config-creator.js::assertContainedOutputDirectory` were near-copies; `ensureOutputDirectory` carried a third, inline, that disagreed with both. All three are gone; `lib/utils/output-directory.js` is the only implementation. Patching `startsWith('..')` would have been a fourth.

**The agreement suite found a live bug the unification itself created, before it could ship.** The shared predicate accepts a `{project-root}/`-prefixed value — it must, because `buildConfigData`'s bypass path produces one — and `ensureOutputDirectory` then resolved it literally, creating a directory **named `{project-root}`** inside the repo. The old inline guard hid this by rejecting every prefixed value outright, which is not agreement but a second opinion. It now strips before resolving.

**A correction to the case table, made before it drove the code.** `_bmad-output/a/../b` was listed as rejected, reasoned as *"the abort manifest records the value it was GIVEN"*. False — `ensureOutputDirectory` returns the RESOLVED path and that is what the manifest records. Moved to the accepted block with the wrong reasoning kept, because it is tempting.

23 cases × 4 call sites, one table (`shared-test-constants`). Three separate suites is what let the predicates drift apart in the first place.

**Task 1 (AC#1, AC#2) — `T136`. The transport is a file path; no block builds an object in a shell string.**

`{spec_data}` needed **no new mechanism**: `step-01` §5 already writes `team-spec-<kebab>.yaml` and `parseSpec` already takes a path, so blocks now call `run-context.js::loadSpec('{spec_path}')`. Writing the spec to a second JSON file — which the story's first draft proposed — would have duplicated on-disk state, the drift class Task 3 exists to delete. `{generation_context}` is the one genuinely new file.

`{agent_file_paths}` was **deleted rather than converted**. It was a second name for `{generation_context}.agent_files` and the two could disagree; blocks now read the context key. That is one placeholder fewer, not one more.

**The `expect:` lines no longer ask the executor to remember.** §5a-ii, §5c and §5d record their own results into the context file as part of the block. `T164`(b) — "§5d never instructs the executor to record `registry_wiring_result`" — is closed structurally rather than by adding an instruction a driver can skip.

`readContext` **throws on absence** rather than returning `{}`. `step-05`'s own caveat documented what `{}` produces: `checkConfig`/`checkActivation`/`checkRegistryWiring` reporting false failures on a correctly generated team. That caveat is now corrected rather than left standing (AC#2).

Verified with `description: He said "go" — it's fine` — both quote characters, the case `T136` is filed on — round-tripping through `loadSpec`.

### Round 1 Review — 2026-09-14 (Tasks 1–3 only, at the landing point)

Self-review, and **that is the limit worth stating**: per `feedback_independent_review_beats_more_rounds`, a self-review of one's own work finds mechanical errors and misses judgement errors. Three of the four findings below are mechanical. Independent layers have not seen this code.

**R1-1 — two lint errors in new code.** `preserve-caught-error` at both `readContext` throws. `npm run lint` says nothing here (`_bmad/` is excluded, `I126`); found by running `eslint --no-ignore` over the changed set. `cause` attached to both. **Re-run clean, exit 0.**

**R1-2 — I had rewritten 8 `run:` blocks without executing one.** The module's named recurring fault, in the story that exists to fix it. Executed §5a and §5a-ii verbatim against a spec whose `description` is `He said "go" — it's fine`: `createConfig` returns `success:true`, the generated `config.yaml` carries the description with **both quote characters intact**, and §5a-ii wrote `output_directory_path` into the context file **with no executor instruction** — `T164`(b) closed structurally, demonstrated rather than argued.

**R1-3 — the gate was not wired, so it was documentation.** Added to `ci.yml`'s `agent-surface-parity` job, which is in `publish.needs`; a block a contributor cannot paste now blocks a release.

**R1-4 — falsifiability, both rules, on a COPY.** `verification-must-be-falsifiable` requires a new gate to fail on purpose before shipping. Two mutants on a copied workflow tree — an interpolated `{spec_data}` restored, and a literal `...` restored — each killed by its own rule and by no other; restoring gave 0 findings. **Deliberately on a copy**: `project_review_rounds_correct_their_own_corrections` records a mutation harness silently reverting a real fix in the working tree. `git status` confirmed only the four intended workflow files changed.

**R1-5 — HIGH, and found only by executing the remaining nine blocks. A defect Task 1 itself introduced.**

R1-2 closed the "never executed" gap for two blocks. Running the other nine found that **§5a and §5b never recorded the paths their consumers read.** `end-to-end-validator.js::checkConfig` reads `ctx.config_yaml_path` and `checkCsv` reads `ctx.module_help_csv_path`; under the old design the executor populated the whole context by hand, but once blocks self-record, a key no block records simply never arrives. Measured on a real generated team: **CONFIG-EXISTS and CSV-EXISTS both FAIL** on a team whose config and CSV are present and correct on disk.

That is precisely the false-failure class this story exists to remove — `step-05`'s own caveat describes it — reintroduced by the fix for it. Both blocks now record; five of the eleven self-record in total.

**Re-run after the fix, on a real generated team:**

```
PASS CONFIG-EXISTS · CONFIG-PARSEABLE · CONFIG-REQUIRED-FIELDS
PASS CSV-EXISTS · CSV-HEADER · CSV-ROW-COUNT
PASS AGENT-FILE-EXISTS · REGISTRY-WIRING · ACTIVATION-VALID · REGISTRY-REGRESSION
FAIL VORTEX-REGRESSION          <- T128, Task 6, still open
```

**This also settles AC#6's open question.** The story recorded that `valid === true` being reachable was *"a reading, not a demonstration"*, and warned that `tf-2-11`'s AC#7 was unachievable for exactly that reason. Ten of eleven checks now pass on a real generated team and the only failure is `T128` itself, so no second blocker of that kind exists. Reasoned → executed.

**Not a defect, recorded because the probe was wrong and the code was right:** my §8 check read `m.created.length`. `manifest-tracker.js::buildManifest` returns an **array** of `{path, operation, module}` entries, not a `{created, modified}` object. Corrected the probe, not the code — 5 entries, 4 created, 1 modified.

**Not found by this review, and stated so it is not mistaken for coverage:** whether the transport choice is right, whether the context file belongs where it is, and whether Tasks 4–8 will fit the shape Tasks 1–3 set. Those are judgement calls a self-review cannot reach.

### File List

- `_bmad/bme/_team-factory/lib/utils/run-context.js` — **new.** `loadSpec`, `initContext`, `readContext`, `recordContext`, `writeAtomic`
- `scripts/audit/run-block-transport.js` — **new.** The gate for AC#1
- `tests/team-factory/run-context.test.js` — **new.** 20 tests
- `tests/audit/run-block-transport.test.js` — **new.** 15 tests
- `_bmad/bme/_team-factory/workflows/add-team/step-02-connect.md` — §5 block
- `_bmad/bme/_team-factory/workflows/add-team/step-04-generate.md` — §Placeholders, §5a, §5a-ii, §5b, §5c, §5d, §8
- `_bmad/bme/_team-factory/workflows/add-team/step-05-validate.md` — §2 block, persistence caveat
- `_bmad/bme/_team-factory/lib/utils/output-directory.js` — **new.** The one containment predicate
- `tests/team-factory/output-directory-cases.js` — **new.** The shared case table, 23 cases
- `tests/team-factory/output-directory.test.js` — **new.** 118 tests across 4 call sites
- `_bmad/bme/_team-factory/lib/spec-parser.js` — copy deleted, imports the shared predicate
- `_bmad/bme/_team-factory/lib/writers/config-creator.js` — copy + inline guard deleted; strips before resolving
- `_bmad/bme/_team-factory/workflows/add-team/step-01-scope.md` — new Placeholders table, §4 rewritten
- `.github/workflows/ci.yml` — wires the run-block gate into `agent-surface-parity` (in `publish.needs`)

## Change Log

| Date | Note |
|---|---|
| 2026-09-14 | **Self-review, 9 findings, all applied.** Three HIGH, and two of them were defects in the story's *design* rather than its prose: (1) AC#1 documented `grep -rhc … *.md` as the way to derive the block count — it prints six per-file numbers, not 12, the `docs-1-5` "command that does not run" class, now `grep -rh … | wc -l` and executed; (2) Task 2 told the executor to route `step-01` §4 through Task 1's context file, which is a **Step-4** artifact that does not exist at §4 — the "reasoning about the consumer without reading it" fault the story itself warns against, committed in the story; (3) Task 1 had Step 4 write `{spec_data}` to a new JSON file when `step-01` §5 already writes the spec to disk and `parseSpec` already takes a path — the duplication Task 3 exists to delete, in the same document. **The first correction to (2) was also wrong** and is recorded rather than tidied away: it proposed moving Overlap Detection after §5, but §5 populates the overlap acknowledgments §4 produces, so the order cannot invert; the fix is a scoping scratch file. MEDIUM: AC#3 could regress R3's `{project-root}/` stripping (positive case now pinned); Task 6 never said when the baseline is captured (now: before §5d writes the registry); backlog line citations would rot on this story's own close (now grep-anchored). LOW: a dangling `§` pointer, rotting test line-counts, and `git diff` not covering untracked output. AC#6's reachability is now marked reasoned-not-executed, with an instruction to report a second blocker rather than absorb it. |
| 2026-09-14 | Story authored via `bmad-create-story` from the `tfr-epic-1` scoping ruling (`T136`, `T164`, `T163`(a), `T128`). Staleness pre-flight run at HEAD `3c2b0112` — **GREEN**, all four reproduced by execution, one finding sharper than its row (`T163`(a) leaves a half-written config, not only a false reject) and one broader (`T136` fails on plain JSON, not only quote-bearing JSON). One open decision recorded and pre-answered: the `run:` block transport contract, chosen as a context file with the CLI and single-quote alternatives declined and the reasons given. Two scope corrections made during authoring, both by counting rather than assuming: the `run:`-block surface is 12 blocks, of which 8 carry object placeholders, 1 hand-builds an object with a literal `...` that is not valid JS *and* uses two placeholders its step file never defines, 1 is an inert no-op, and 2 are scalar-safe. Scope excludes `T163`(b), `T165`, `T166`, `T127`, `T132`, `T134`, `T137`, `T138`, `T139`, `T141`, `T147`, `T151`. |
