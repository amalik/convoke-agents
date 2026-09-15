---
baseline_commit: a2944e7dfadc351332618e04bb76020098472d9e
---

# Story tfr-2.1: Delete the regression check that cannot fail

Status: ready-for-dev

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

- [ ] **Task 1 — Re-derive the premise (AC: #1)**
  - [ ] Read set: every `path.join(projectRoot, …)` in `validator.js` and the registry exports it destructures.
  - [ ] Write set: `config-creator.js::createConfig`/`ensureOutputDirectory`, `csv-creator.js::createCsv`, `registry-writer.js::writeRegistryBlock`, and the BMB-authored paths step-04 §3 records.
  - [ ] Confirm the three known near-overlaps are still guarded (Dev Notes §Premise). Any unguarded overlap → STOP.

- [ ] **Task 2 — Delete the check (AC: #2)**
  - [ ] `end-to-end-validator.js`: delete `runVortexValidation`, `captureVortexBaseline`, `checkVortexRegression`; remove the `VORTEX-REGRESSION` push from `validateTeam`, `validateExtension`, `validateSkillExtension`; remove the three exports and the export comment that justifies them; correct `validateTeam`'s JSDoc ("regression (registry require, Vortex validation)").
  - [ ] Keep `projectRoot`: `checkRegistryRegression` and `checkPersonaCoverage`'s fallback still use it.

- [ ] **Task 3 — Tests (AC: #4, #5)**
  - [ ] `end-to-end-validator.test.js`: delete the `VORTEX-REGRESSION — differential, not absolute` describe; remove the happy path's `VORTEX-REGRESSION` assertions and `vortex_baseline` from `buildHappyContext`; drop the now-unused `captureVortexBaseline`/`checkVortexRegression` imports; drop the stub `validator.js` from `buildStubProjectRoot` but keep its `agent-registry.js`. Make the happy path assert `result.valid === true`.
  - [ ] `extension-validator.test.js`: both happy paths assert `result.valid === true`.
  - [ ] **Add** a test that turns `REGISTRY-REGRESSION` red on a registry that does not `require()` — none exists at `a2944e7d` (every assertion on that check expects `passed: true`). Point `projectRoot` at a stub root whose `agent-registry.js` is syntactically broken.

- [ ] **Task 4 — Workflow prose (AC: #3)**
  - [ ] `step-04-generate.md` §1: delete the "Capture the Vortex baseline" paragraph and block; delete the `vortex_baseline` context-keys row.
  - [ ] `step-05-validate.md` §3: replace the `VORTEX-REGRESSION` paragraphs with the remaining regression check and a short pointer to `T171`; update the VT prerequisite note.
  - [ ] Run every remaining step-04/step-05 `run:` block verbatim, extracted from the files, in the documented order on a throwaway team — or record why a subset suffices. Restore the tree to a `git status --porcelain` snapshot.

- [ ] **Task 5 — Falsifiability (AC: #8)** — mutant table, harness that proves the suite ran, control edit.

- [ ] **Task 6 — Consumer audit (AC: #6)** — `git grep` over the whole repo; disposition per consumer in the record.

- [ ] **Task 7 — Backlog and archive (AC: #7)** — §2.5 moves, `T128` addendum, Change Log entry, integrity passes.

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

### Debug Log References

### Completion Notes List

### File List

## Change Log

| Date | Note |
|---|---|
| 2026-09-15 | Story authored via `bmad-create-story` from the operator's decision to delete `VORTEX-REGRESSION` (`T171`) rather than widen it. Staleness pre-flight **GREEN**: the only commits since qualification are the three that built the check; no dependencies; anchors exist; `validator.js` unchanged. `T171`'s premise re-derived at `a2944e7d`, including three near-overlaps its row did not name, each found guarded — one by a different mechanism than first written (`extra-bme` is intercepted by `writeRegistryBlock`'s idempotency check, not `validateStaged`), corrected after execution. One finding sharper than the rows: the extension validators' happy-path tests never assert `result.valid`, which is why `T174` shipped green — and a probe confirmed `VORTEX-REGRESSION` is the only check failing in both, so AC#4 is reachable. |
