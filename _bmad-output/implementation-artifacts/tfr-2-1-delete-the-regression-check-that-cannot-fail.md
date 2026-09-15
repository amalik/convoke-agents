---
baseline_commit: a2944e7dfadc351332618e04bb76020098472d9e
---

# Story tfr-2.1: Delete the regression check that cannot fail

Status: done

**Epic:** [tfr-epic-2 — delete the regression check that cannot fail](../planning-artifacts/convoke-epic-team-factory-regression-check-deletion.md) (one-story mini-epic, operator decision 2026-09-15; `tfr-epic-1` precedent)
**Origin:** Fast Lane rows `T171`, `T172`, `T173`, `T174` — all `loom`, all Open, all traced to one check.
**Namespace decision:** Convoke-owned `_bmad/bme/_team-factory/` and `tests/team-factory/`. No skill, agent or workflow is added; code and prose are deleted. `namespace-decision-for-new-skills` is satisfied because nothing is added.
**Covenant:** no `_bmad/bme/` skill or workflow is authored; `step-04`/`step-05` lose a block and a paragraph. `covenant-compliance-for-convoke-skills` applies as a no-regression check only.
**Safety analysis (`path-safety-for-destructive-ops`):** not in scope. No path this story touches reaches a removal target, and nothing it deletes accepts a user-supplied path.

## Story

As a **contributor running `add-team`**,
I want **the terminal gate to contain only checks that can fail on what the factory does**,
so that **a green gate means something, and the validators for extending a team can pass at all**.

## Context

`tfr-1-1` turned `VORTEX-REGRESSION` into a differential so it could pass in a source tree (`T128`). Its own reviews then established that **nothing `add-team` writes can make it fail** (`T171`):

- `validateInstallation` reads the Vortex, Enhance, Artifacts and Portability module paths, `_bmad/_config/agent-manifest.csv`, and six named registry exports (`WORKFLOW_NAMES`, `WAVE3_WORKFLOW_NAMES`, `AGENTS`, `GYRE_AGENTS`, `EXTRA_BME_AGENTS`, `VORTEX_SKILL_PATHS`).
- `add-team` writes `_bmad/bme/_{team}/`, a new `_bmad-output/{team}-artifacts/`, and new `<PREFIX>_*` exports. It never writes the manifest.
- The one regression it could cause — a syntactically broken `agent-registry.js` — is caught by `REGISTRY-REGRESSION` and by `writeRegistryBlock`'s own verify-and-rollback.

It then cost three more rows: it compares names only (`T172`), it can read a stale cached registry in one process (`T173`), and the two extension validators call it without a baseline, so since `0db3aac8` **they can never pass** (`T174`). Operator decision 2026-09-15: delete it, don't widen it.

**This reverses the differential half of `T128`'s fix, on purpose.** `T128`'s closing note gets a dated addendum; the archive is append-only.

**Scope boundary — do NOT change these, even when you are standing in the file:**

| Thing | Why not |
|---|---|
| `scripts/update/lib/validator.js` | Vortex's installer validator; other consumers. This story stops *calling* it from the factory, nothing more |
| `REGISTRY-REGRESSION`, `PERSONA-COVERAGE`, every structural/wiring check | They can fail on what the factory writes. Out of scope and not residue |
| `T170`, `T175`, `T176`, `T163`(b), every other `loom` row | Parked by operator agreement until the factory's first real use (epic §"Not a repair programme") |
| `buildStubProjectRoot`'s `agent-registry.js` stub | `REGISTRY-REGRESSION` still requires a loadable registry at `projectRoot`; only the stub `validator.js` becomes unused |

If you find yourself needing one of these, stop and say so — that is a scope finding, not a licence.

## Acceptance Criteria

**AC#1 — the premise is re-derived before anything is deleted.** Enumerate `validateInstallation`'s read set from source (`grep -n "path.join(projectRoot" scripts/update/lib/validator.js` and its `require('./agent-registry')` destructures) and `add-team`'s write set (step-04's writers and context keys). Record both. **If any path or export overlaps, STOP** — the check would be removing real protection, and this story's premise is wrong. Three near-overlaps are already known and guarded; confirm each still holds rather than assuming it (Dev Notes §Premise).

**AC#2 — the check is gone.** `checkVortexRegression`, `runVortexValidation` and `captureVortexBaseline` are deleted and no longer exported; `validateTeam`, `validateExtension` and `validateSkillExtension` no longer emit `VORTEX-REGRESSION`. Proven by this command returning no output (exit 1) — derive, do not describe:

```bash
git grep -n -e 'VORTEX-REGRESSION' -e 'checkVortexRegression' -e 'runVortexValidation' -e 'captureVortexBaseline' -e 'vortex_baseline' -- _bmad scripts tests docs
```

Records under `_bmad-output/` keep their history and are excluded on purpose.

**AC#3 — the flow no longer takes a baseline.** `step-04-generate.md` §1's baseline block and the `vortex_baseline` row of its context-keys table are deleted. `step-05-validate.md` §3 describes the regression check that remains — `REGISTRY-REGRESSION` — and says in one or two sentences why the Vortex check was removed, pointing at `T171`. The VT note in step-05's Prerequisites no longer mentions a baseline. Every `run:` block that remains still executes verbatim; state no block count — derive it with `grep -rh '^run: node -e' _bmad/bme/_team-factory/workflows/add-team/*.md | wc -l`.

**AC#4 — the extension validators can pass.** Both happy-path tests in `tests/team-factory/extension-validator.test.js` — *"all checks pass when extension is valid"* and *"all checks pass when skill extension is valid"* — assert `result.valid === true`. Today they filter to extension-specific checks and never assert validity, so they stay green while `VORTEX-REGRESSION` fails on every run: a test whose title claims "all checks pass" that does not check all. **If a check other than the deleted one blocks `valid === true`, that is a scope finding — report it, do not widen the story.**

> **Reachability was executed at authoring, not reasoned.** A scratchpad copy of `extension-validator.test.js` logged every failing check in both happy paths at `a2944e7d`: the only one, in each, is `VORTEX-REGRESSION: no baseline recorded …` — and both tests still passed. So `valid === true` is one deletion away. Re-check it at implementation; the tree may have moved.

**AC#5 — what remains can fail.** `validateTeam`'s happy path asserts `result.valid === true` against its stub root, and a test makes `REGISTRY-REGRESSION` go red on a registry that does not `require()`. No such test exists today; add it and name it in the record.

**AC#6 — a consumer audit closes the story.** Enumerate by `git grep` over the whole repository — not the changed files — every consumer of each deleted symbol, the `vortex_baseline` context key, step-04 §1's baseline block and step-05's `VORTEX-REGRESSION` prose. Record each consumer with a disposition (updated, deleted, historical record left as-is). This is the check `tfr-1-1`'s diff-scoped reviews missed three times.

**AC#7 — the backlog is closed by the deletion.** `T171` moves to §2.5 *Completed (shipped)*; `T172`, `T173` and `T174` move to §2.5 *Absorbed into `T171`*. `T128`'s closing note in `convoke-note-backlog-completed-archive.md` gets a dated addendum under its existing anchor — the note is not rewritten. Lanes stay ordered (`backlog-write-discipline`); `node scripts/audit/backlog-integrity.js` passes.

**AC#8 — mutant → sole-executioner, cited by test.** Per `verification-must-be-falsifiable`: record *(edit to make → test that goes red)*, never a mutant identifier. The harness must refuse to report unless the suite actually ran (a bare directory passed to `node --test` runs nothing and makes every mutant "survive"), and must open with a known-lethal control edit.

## Tasks / Subtasks

- [x] **Task 1 — Re-derive the premise (AC: #1)**
  - [x] Read set: every `path.join(projectRoot, …)` in `validator.js` and the registry exports it destructures.
  - [x] Write set: `config-creator.js::createConfig`/`ensureOutputDirectory`, `csv-creator.js::createCsv`, `registry-writer.js::writeRegistryBlock`, and the BMB-authored paths step-04 §3 records.
  - [x] Confirm the three known near-overlaps are still guarded (Dev Notes §Premise). Any unguarded overlap → STOP.

- [x] **Task 2 — Delete the check (AC: #2)**
  - [x] `end-to-end-validator.js`: delete `runVortexValidation`, `captureVortexBaseline`, `checkVortexRegression`; remove the `VORTEX-REGRESSION` push from `validateTeam`, `validateExtension`, `validateSkillExtension`; remove the three exports and the export comment that justifies them; correct `validateTeam`'s JSDoc ("regression (registry require, Vortex validation)").
  - [x] Keep `projectRoot`: `checkRegistryRegression` and `checkPersonaCoverage`'s fallback still use it.

- [x] **Task 3 — Tests (AC: #4, #5)**
  - [x] `end-to-end-validator.test.js`: delete the `VORTEX-REGRESSION — differential, not absolute` describe; remove the happy path's `VORTEX-REGRESSION` assertions and `vortex_baseline` from `buildHappyContext`; drop the now-unused `captureVortexBaseline`/`checkVortexRegression` imports; drop the stub `validator.js` from `buildStubProjectRoot` but keep its `agent-registry.js`. Make the happy path assert `result.valid === true`.
  - [x] `extension-validator.test.js`: both happy paths assert `result.valid === true`.
  - [x] **Add** a test that turns `REGISTRY-REGRESSION` red on a registry that does not `require()` — none exists at `a2944e7d` (every assertion on that check expects `passed: true`). Point `projectRoot` at a stub root whose `agent-registry.js` is syntactically broken.

- [x] **Task 4 — Workflow prose (AC: #3)**
  - [x] `step-04-generate.md` §1: delete the "Capture the Vortex baseline" paragraph and block; delete the `vortex_baseline` context-keys row.
  - [x] `step-05-validate.md` §3: replace the `VORTEX-REGRESSION` paragraphs with the remaining regression check and a short pointer to `T171`; update the VT prerequisite note.
  - [x] Run every remaining step-04/step-05 `run:` block verbatim, extracted from the files, in the documented order on a throwaway team — or record why a subset suffices. Restore the tree to a `git status --porcelain` snapshot.

- [x] **Task 5 — Falsifiability (AC: #8)** — mutant table, harness that proves the suite ran, control edit.

- [x] **Task 6 — Consumer audit (AC: #6)** — `git grep` over the whole repo; disposition per consumer in the record.

- [x] **Task 7 — Backlog and archive (AC: #7)** — §2.5 moves, `T128` addendum, Change Log entry, integrity passes.

### Review Findings — Round 1, 2026-09-15 (three independent layers)

Every HIGH reproduced before triage. HIGH present, so `code-review-convergence` triggers Round 2 after remediation.

- [x] [Review][Decision] **The "cannot fail" premise was proven for `add-team` only, but the check was also deleted from the two extension validators — where it can fail.** Blind Hunter and Edge Case Hunter, independently. Reproduced: `registry-appender.js::appendAgentToBlock('gyre', …)` succeeds, `REGISTRY-REGRESSION` still passes, and a fresh `validateInstallation` gains `Agent manifest missing: probe-sentinel`; `validateExtension` returns `valid: true`. AC#1 said STOP on an overlap; the overlap is on a path with no caller today (`T139`). Deleting the check also unmasked two defects in the same validators that its permanent red had hidden: `checkExistingAgentsRegistry` passes when **every** existing agent is removed, and both extension validators pass with zero file checks on an empty context (and `checkActivationMenuUpdated` accepts a comment). Options: keep the deletion and record the extension-path gap as a row owned by the future add-agent work, reopening `T174` rather than absorbing it; restore a baseline-taking check in the extension validators only; or restore the old always-failing call. **Ruled 2026-09-15: keep the deletion everywhere; `T174` stays open, rescoped to the add-agent work with (a) the manifest-drift gap and (b)/(c) the two unmasked defects.**
- [x] [Review][Patch] The new broken-registry test's `result.valid === false` cannot fail — six checks already fail in its fixture, so a verdict that ignores `REGISTRY-REGRESSION` survives, and removing that check from `validateSkillExtension` survives [`end-to-end-validator.test.js`, `extension-validator.test.js`]
- [x] [Review][Patch] Both extension happy paths now assert validity against the live `PROJECT_ROOT` registry (`test-fixture-isolation`) [`extension-validator.test.js`]
- [x] [Review][Patch] step-05 §3 overstates `REGISTRY-REGRESSION` ("the one way generation could break … every other consumer") — a registry that loads can still change what consumers report (`T151`) [`step-05-validate.md` §3]
- [x] [Review][Patch] AC#6's consumer audit missed `docs/development.md`, which still says VT's "regression check needs a reading taken before the team existed" — prose with no deleted symbol in it [`docs/development.md`]
- [x] [Review][Patch] The module-name guard is stated unconditionally in step-05 prose, the `T171` archive note and the backlog Change Log, but Express Mode skips step-01's collision detector; step-03's re-check has no block and `config-creator.js::detectCollisions` skips the team's own name (`T132`(c)). The deleted check could not see that damage either, so the premise stands; the claim needs its condition and the gap needs a row [step-05, archive, backlog]
- [x] [Review][Patch] step-05 §3's history misstates: "it could not fail" (it always failed in the extension validators), and the tfr-1-1 deleted block's "real check is `REGISTRY-REGRESSION`" misattributes; the Visibility Checklist still promises a "Regression check on existing teams"; the VT note's "cannot validate a hand-built team" lost its justification [`step-05-validate.md`]
- [x] [Review][Patch] Record accuracy: the `T171` note's re-derive command cannot fail (a `--test-name-pattern` matching nothing exits 0); it says "`validateTeam` passes `{}`" (it was `runVortexValidation`); the AC#1 read set omits two files and a fourth near-overlap (`wave3` → `WAVE3_WORKFLOW_NAMES`, guarded by `validateStaged`); `T128`'s addendum does not say its re-derive command now throws; Completion Notes state a block count AC#3 forbids [archive, this file]
- [x] [Review][Patch] The broken-registry test uses a syntax error only; a syntax-only `node --check` replacement survives — add a load-time throw [`end-to-end-validator.test.js`]
- [x] [Review][Defer] `checkRegistryRegression` reads `projectRoot` rather than `ctx.registry_path`, and throws on an undefined root — out of scope per the Scope boundary (`REGISTRY-REGRESSION` code unchanged) — deferred, pre-existing

### Review Findings — Round 2, 2026-09-15 (one scoped layer, operator-agreed)

Scoped to the Round 1 remediation's executable and contributor-facing parts: the rewritten tests, step-05, `docs/development.md`. Records excluded by design. **No HIGH, so no Round 3.** Round 1's three named fixes held — each mutant still dies. The fixes below are small in-place edits and unreviewed by construction.

- [x] [Review][Patch] step-05 §3 said the Vortex check "could only pass, whatever generation did". False where step-01's collision check is skipped: a step file added to a Vortex workflow fails `Workflow step structure`, which the deleted check would have caught (reproduced: `lean-persona: 7 step files (expected 4-6)`). Narrowed to its condition in step-05, the `T171` note and the `T177` row, which also said the check "could not see it either" [`step-05-validate.md` §3, archive, backlog]
- [x] [Review][Patch] "Holds on the interactive path" was too strong — a name edited at step-03 or between sessions also reaches step-04 unchecked; stated in step-05 and added to `T177` [`step-05-validate.md` §3, backlog]
- [x] [Review][Patch] The tfr-1-1 deleted block "could not fail" — it exited non-zero on an unloadable registry; nothing read the exit [`step-05-validate.md` §3]
- [x] [Review][Patch] The VT note and `docs/development.md` gave the wrong mechanism: `REGISTRY-WIRING` and `ACTIVATION-VALID` trust results step-04 recorded, and `readContext` throws by design [`step-05-validate.md`, `docs/development.md`]
- [x] [Review][Patch] The skill happy-path comment called `REGISTRY-REGRESSION` "the only" regression check; three `skill-extension-regression` checks remain [`extension-validator.test.js`]
- [x] [Review][Defer] Neither extension validator has a test where `REGISTRY-REGRESSION` fails, so verdict-ignoring mutants survive there — added to `T174` as (d) (no caller, `T139`) — deferred
- [x] [Review][Defer] step-05 §2 lists checks `validateTeam` does not run — filed `T178`, pre-existing — deferred
- [x] [Review][Defer] *passes REGISTRY-REGRESSION against real project root* still reads the live registry — `deferred-work.md`, pre-existing — deferred

## Dev Notes

### Premise — the evidence behind "cannot fail", and the three near-overlaps

Derived 2026-09-15 at `a2944e7d`; `validator.js` and `agent-registry.js` unchanged since `T171` was filed (`git log --since=2026-09-14 -- scripts/update/lib/validator.js scripts/update/lib/agent-registry.js` is empty). Re-derive in Task 1 — do not trust this paragraph.

- **`_bmad-output/`** is read by `validateUserDataIntegrity`, which `validateTeam` skips: it passes `{}` as pre-migration data. `add-team`'s output directory therefore cannot affect it.
- **Enhance / Artifacts / Portability module directories** are read from a fixed list (`validateStandaloneWorkflowModule`). A team named `enhance`, `artifacts` or `portability` would target an existing `_bmad/bme/_<name>/`, where `config-creator.js::createConfig` refuses to overwrite `config.yaml` (additive-only).
- **`EXTRA_BME_AGENTS`** is read at `validator.js` top level. A team named `extra-bme` derives prefix `EXTRA_BME` (`registry-writer.js::derivePrefix`). **`writeRegistryBlock`'s idempotency check intercepts it before `validateStaged` ever runs:** it sees `const EXTRA_BME_AGENTS` already present and returns `{success: true, written: [], skipped: ['block already exists']}` without writing. Verified on a copy of the registry (byte-identical afterwards). Nothing reaches the export Vortex reads — though the run then fails `REGISTRY-WIRING` (`written` is empty), which is a separate, parked concern (`T151`'s family), not this story's.

### Current state of what changes

- **`end-to-end-validator.js`** — `validateTeam(specData, generationContext, projectRoot)` pushes `checkVortexRegression(projectRoot, generationContext.vortex_baseline)`; `validateExtension`/`validateSkillExtension` push `checkVortexRegression(projectRoot)` with no baseline, which fails closed. `runVortexValidation` throws on a missing `validator.js`, a result with no `checks` array, or a failing check with no usable name; `checkVortexRegression` catches that and returns a failed check.
- **`step-04-generate.md` §1** — after the `initContext` block, a paragraph and block capture the baseline into `{context_path}`; the context-keys table has a `vortex_baseline` row whose reader is `checkVortexRegression`.
- **`step-05-validate.md`** — §3 explains the differential and "No baseline means red"; the Prerequisites VT note says `VORTEX-REGRESSION` fails closed without step-04's baseline.
- **`end-to-end-validator.test.js`** — `buildHappyContext` states a `vortex_baseline`; `buildStubProjectRoot` writes a stub `validator.js` and `agent-registry.js`; a whole describe tests the differential.
- **`extension-validator.test.js`** — two happy paths that never assert `result.valid` (AC#4).

### Traps carried forward from `tfr-1-1`

- **Walk the documented order, and extract blocks from the files rather than retyping them.** `tfr-1-1`'s first end-to-end walk passed a block only because the executor had written a later section's fields first.
- **A mutation harness must prove it ran.** Pass the quoted glob `'tests/team-factory/*.test.js'`; a bare directory runs no tests. In zsh an unquoted `$VAR` does not word-split.
- **Another session commits to this tree.** Never `git stash`. Run mutants on a copy (symlink `node_modules`; copy `_bmad/bme/_vortex/` and `tests/helpers.js`, which the suites read).
- **`readContext` throws when the context file is absent** — deleting the baseline does not change that; VT still needs step-04's context file.
- **Deleting a symbol is where consumers break** (`T174` was one). AC#6 is not optional.

### Testing standards

`node:test`. Governing rules: `verification-must-be-falsifiable` (AC#8), `test-fixture-isolation` (stub roots, never assertions on live repo state), `fixture-determinism`, `derive-counts-from-source`, `verification-pipefail`, `lint-passes-before-review` (`npx eslint --no-ignore` on every changed JS file — `npm run lint` excludes `_bmad/`).

### References

Cited by symbol and section, not line — `tfr-1-1` rotted its own line citations twice.

- [convoke-epic-team-factory-regression-check-deletion.md](../planning-artifacts/convoke-epic-team-factory-regression-check-deletion.md) — scope and "Not a repair programme"
- [tfr-1-1-generate-one-real-team-without-hand-patching.md](tfr-1-1-generate-one-real-team-without-hand-patching.md) — Task 6 (the differential), Review Findings Round 1 on Tasks 4–7 and the additional review (where `T171`–`T174` were found)
- [convoke-note-backlog-completed-archive.md](../planning-artifacts/convoke-note-backlog-completed-archive.md) — `## T128`, which gets the addendum
- [convoke-note-initiative-lifecycle-backlog.md](../planning-artifacts/convoke-note-initiative-lifecycle-backlog.md) — rows `T171`–`T174` (find with `grep -n '^| T171 |'`)
- [end-to-end-validator.js](../../_bmad/bme/_team-factory/lib/validators/end-to-end-validator.js) — `validateTeam`, `validateExtension`, `validateSkillExtension`, `runVortexValidation`, `captureVortexBaseline`, `checkVortexRegression`, `checkRegistryRegression`
- [validator.js](../../scripts/update/lib/validator.js) — `validateInstallation` (read only, never modified)
- [step-04-generate.md](../../_bmad/bme/_team-factory/workflows/add-team/step-04-generate.md) — §1, §Context keys
- [step-05-validate.md](../../_bmad/bme/_team-factory/workflows/add-team/step-05-validate.md) — §Prerequisites, §3
- [project-context.md](../../project-context.md) — `verification-must-be-falsifiable`, `code-review-convergence`, `test-fixture-isolation`, `backlog-write-discipline`, `commit-preparation`

## Dev Agent Record

### Agent Model Used

Claude Opus 5 (1M context), via `bmad-dev-story`.

### Debug Log References

### Completion Notes List

**Task 1 (AC#1) — premise re-derived; it holds, and one guard in Dev Notes names the wrong mechanism.** `validator.js` and `agent-registry.js` are unchanged since `a2944e7d`. The read set, re-enumerated at implementation, also covers `_bmad/<wf.target_agent>` and the `.claude/skills/` wrappers — `add-team` writes neither. **Correction to Dev Notes §Premise:** a team named after an existing module (`vortex`, `enhance`, `artifacts`, `portability`, `gyre`, `team-factory`) is not guarded by `createConfig`'s additive-only check, because step-04 §3's agent and workflow files land in `_bmad/bme/_{team}/` *before* §5a runs. It is guarded earlier: step-01 §4's `collision-detector.js::detectCollisions` returns `hasBlocking: true` (exact `submodule_name` match) for all six, before anything is written. `extra-bme` is not blocked there; its registry write is intercepted by `writeRegistryBlock`'s idempotency check and its module directory is outside the read set. No unguarded overlap.

**Tasks 2–3 (AC#2, #4, #5) — red, then green, by deletion.** Three assertions were written first and read red, each naming `VORTEX-REGRESSION: no baseline recorded …` as the only failing check: *all checks pass when extension is valid*, *all checks pass when skill extension is valid* (both now assert `result.valid === true`), and *structural and wiring checks pass when all files exist and results are valid* (now asserts `result.valid === true`). Deleting `runVortexValidation`, `captureVortexBaseline` and `checkVortexRegression`, their three call sites and two exports turned all three green. The differential describe, `vortex_baseline` in `buildHappyContext`, and the stub `validator.js` in `buildStubProjectRoot` went with them; the stub keeps its `agent-registry.js` and gained a `registryBody` parameter. **Added:** *fails REGISTRY-REGRESSION on a registry that does not load* — the first assertion on that check expecting `passed: false`.

AC#2's command exits 1 (no matches) over `_bmad scripts tests docs`; the same form finds `REGISTRY-REGRESSION` (exit 0), so the empty result is not a broken grep. Test comments were worded "the Vortex regression check" so the command can stay strict.

**Task 4 (AC#3) — prose, then a walk.** step-04 §1's baseline block and the `vortex_baseline` context-keys row are deleted; step-05 §3 now describes `REGISTRY-REGRESSION` and says in two sentences why the Vortex check went; the VT note no longer mentions a baseline, and the "deleted block" paragraph points at `REGISTRY-REGRESSION`. Every remaining block — counted with `grep -rh '^run: node -e' … | wc -l`, not stated here — was extracted from the step files and run in the documented order on a throwaway Sequential team: `validateTeam` → `valid: true`, 15 checks, no `vortex_baseline` in the context. Removal as before: registry diff block-only (+39 −0) and restored, SHA identical, `HEAD` unchanged, `git status --porcelain` identical to the pre-walk snapshot.

**Task 5 (AC#8) — edit → test that goes red.** Harness on a copy, suite floor enforced (497 ran each time), known-lethal control first.

| Edit to make | Test that goes red |
|---|---|
| `validateTeam` emits a check that always fails | *structural and wiring checks pass when all files exist and results are valid* |
| `validateExtension` emits a check that always fails | *all checks pass when extension is valid* |
| `validateSkillExtension` emits a check that always fails | *all checks pass when skill extension is valid* |
| `REGISTRY-REGRESSION` always passes | *fails REGISTRY-REGRESSION on a registry that does not load* |
| `REGISTRY-REGRESSION` dropped from `validateTeam` | three: the happy path, *passes REGISTRY-REGRESSION against real project root*, and the broken-registry test — one property asserted in three shapes |

The first three rows are the point of AC#4: before this story, an always-failing check in either extension validator killed nothing.

**Task 6 (AC#6) — consumer audit, whole repository.** `git grep -l -F` for each deleted symbol, `vortex_baseline`, the §1 block's text (`BASELINE CAPTURE FAILED`, `Capture the Vortex baseline`) and step-05's prose (`No baseline means red`, `no baseline recorded`), over `.` including records; plus `.claude/`, and any importer of `end-to-end-validator` outside the Team Factory.

| Consumer | Disposition |
|---|---|
| `_bmad/`, `scripts/`, `tests/`, `docs/`, `.claude/` | none remain |
| importers of `end-to-end-validator` outside `_team-factory` and `tests/team-factory` | none |
| `tf-2-9`, `tf-2-11`, `tf-2-12`, `tf-3-1`, `tf-3-2`, `tf-epic-2` retro, `tfr-1-1` story records | historical records — left as-is |
| this story and its epic | describe the deletion — left as-is |
| backlog rows `T171`–`T174` | moved to §2.5 (Task 7) |
| backlog Change Log and §2.5 history mentions | history — left as-is |
| archive `## T128` | dated addendum appended, note unchanged (Task 7) |

**Task 7 (AC#7).** `T171` → §2.5 *Completed (shipped)* with a closing note; `T172`, `T173` → §2.5 *Absorbed into larger initiatives*, target `T171`. **`T174` was first absorbed too, then reopened after Round 1** (see below). `## T128` gains *Addendum — 2026-09-15, `tfr-2-1`*. Change Log entry prepended. `node scripts/audit/backlog-integrity.js` → PASS. Both re-derive commands in the `T171` closing note were run as written.

**Round 1 remediation (2026-09-15).** All three layers ran; the decision and eight patches were applied as one batch.

- **The premise was proven for `add-team` only.** Blind Hunter and Edge Case Hunter independently reproduced that the extension write path (`appendAgentToBlock` into Gyre's block) changes what `validateInstallation` reads, and that the check's permanent red had hidden two defects in the extension validators. By operator decision the deletion stands; `T174` is reopened and rescoped rather than absorbed, owned by the unbuilt add-agent work. AC#7's literal "T174 absorbed" is therefore not what shipped, deliberately.
- **Tests that could not fail are fixed.** The broken-registry test now runs on an otherwise valid team, with two unloadable registries (a syntax error and a load-time throw); the extension happy paths run on stub roots, and the skill happy path pins `REGISTRY-REGRESSION`. The three mutants Round 1 found surviving now die:

| Edit to make | Test that goes red |
|---|---|
| `validateTeam`'s verdict ignores `REGISTRY-REGRESSION` | *fails REGISTRY-REGRESSION on a registry that does not load, and that alone makes the team invalid* |
| `REGISTRY-REGRESSION` becomes syntax-only (`node --check`) | the same test (its load-time-throw case) |
| `REGISTRY-REGRESSION` removed from `validateSkillExtension` | *all checks pass when skill extension is valid* |

- **Prose narrowed to what the code supports.** step-05 §3 says what `REGISTRY-REGRESSION` does not prove (`T151`) and states the module-name guard's condition; the history sentences, the stale Visibility Checklist line and the VT note are corrected; `docs/development.md` no longer cites the deleted baseline — the consumer AC#6's symbol grep could not see.
- **A scope finding filed, not fixed: `T177`.** Express Mode skips step-01's collision gate; `config-creator.js::detectCollisions` returns `[]` for `vortex`, `enhance` and `gyre` (verified). The deleted check could not see that damage either.
- **Records corrected:** the `T171` note (premise limits, the full read set, `wave3` guarded by `validateStaged`, a re-derive command that can fail — `grep -c` prints `2` here and `0` on HEAD's file); `T128`'s addendum says its re-derive command now throws; the archive stays append-only against HEAD (+43 −0).

Round 2 (one scoped layer) then ran on this remediation and found no HIGH — see §Review Findings — Round 2; its five small fixes are unreviewed by construction, and the review stops per `code-review-convergence`.

### File List

- `_bmad/bme/_team-factory/lib/validators/end-to-end-validator.js` — deleted `runVortexValidation`, `captureVortexBaseline`, `checkVortexRegression`, their call sites and exports
- `_bmad/bme/_team-factory/workflows/add-team/step-04-generate.md` — §1 baseline block and `vortex_baseline` context-keys row deleted
- `_bmad/bme/_team-factory/workflows/add-team/step-05-validate.md` — §3 regression prose, VT prerequisite note
- `tests/team-factory/end-to-end-validator.test.js` — differential describe deleted; happy path asserts validity; broken-registry test added; stub root reduced to the registry
- `tests/team-factory/extension-validator.test.js` — both happy paths assert `result.valid === true`, on stub roots; skill happy path pins `REGISTRY-REGRESSION`
- `docs/development.md` — VT sentence no longer cites the deleted baseline
- `_bmad-output/planning-artifacts/convoke-epic-team-factory-regression-check-deletion.md` — `T174` scope row
- `_bmad-output/planning-artifacts/convoke-note-initiative-lifecycle-backlog.md` — `T171` closed, `T172`/`T173` absorbed, `T174` rescoped, `T177` and `T178` filed, Change Log
- `_bmad-output/implementation-artifacts/deferred-work.md` — one Round 2 deferral
- `_bmad-output/planning-artifacts/convoke-note-backlog-completed-archive.md` — `## T171` closing note, `## T128` addendum
- `_bmad-output/implementation-artifacts/sprint-status.yaml` — story status

## Change Log

| Date | Note |
|---|---|
| 2026-09-15 | **Done, by operator decision.** The epic's definition of done was amended to match the `T174` ruling, and `tfr-epic-2` closes with this story. |
| 2026-09-15 | **Round 2 (one scoped layer) applied; review complete.** No HIGH. Its MEDIUM corrected a claim the Round 1 remediation had narrowed but kept: where step-01's collision check is skipped, the deleted check could have caught generation writing into an existing module — reproduced, and the condition now stated in step-05, the `T171` note and `T177`. Four LOW fixed in place; three deferred (`T174`(d), `T178`, deferred-work). Status stays `review` pending commit. |
| 2026-09-15 | **Round 1 (three independent layers) applied.** 1 decision, 8 patches, 1 deferred. The premise held for `add-team` but not for the extension validators the check was also removed from; the deletion stands by operator decision, `T174` reopened rescoped. Weak tests fixed and proven by the three mutants that had survived. Prose narrowed, one missed consumer (`docs/development.md`) fixed, `T177` filed. Round 2 triggered. |
| 2026-09-15 | **Implemented; to `review`.** `VORTEX-REGRESSION` deleted from all three validators, the baseline block and context key removed from the flow, and `T171` closed with `T172`–`T174` absorbed. Red read first on three validity assertions; green by deletion. The extension validators can pass for the first time, and a test proves `REGISTRY-REGRESSION` can fail. Premise re-derived; one Dev Notes guard was misattributed and is corrected in Completion Notes. Remaining blocks walked in the documented order; tree restored to its snapshot. |
| 2026-09-15 | Story authored via `bmad-create-story` from the operator's decision to delete `VORTEX-REGRESSION` (`T171`) rather than widen it. Staleness pre-flight **GREEN**: the only commits since qualification are the three that built the check; no dependencies; anchors exist; `validator.js` unchanged. `T171`'s premise re-derived at `a2944e7d`, including three near-overlaps its row did not name, each found guarded — one by a different mechanism than first written (`extra-bme` is intercepted by `writeRegistryBlock`'s idempotency check, not `validateStaged`), corrected after execution. One finding sharper than the rows: the extension validators' happy-path tests never assert `result.valid`, which is why `T174` shipped green — and a probe confirmed `VORTEX-REGRESSION` is the only check failing in both, so AC#4 is reachable. |
