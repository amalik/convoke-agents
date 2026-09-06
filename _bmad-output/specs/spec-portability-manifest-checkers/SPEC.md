---
id: SPEC-portability-manifest-checkers
companions:
  - ../../../project-context.md
sources:
  - _bmad-output/implementation-artifacts/deferred-work.md
---

> **Canonical contract.** This SPEC and the files in `companions:` are the complete, preservation-validated contract for what to build, test, and validate. Source documents listed in frontmatter are for traceability only — consult them only if you need narrative rationale or prose color this contract intentionally omits.

# Portability manifest checkers — consolidation and isolation

## Why

A pain, discovered while fixing a smaller one. `_bmad/_config/skill-manifest.csv` is checked by **three** independent mechanisms in three different states of health, and the one carrying the only dependency-integrity checks **is not wired into anything and is failing right now**.

| Checker | Wired into CI | Isolation | Assertions unique to it |
|---|---|---|---|
| `scripts/portability/validate-classification.js` | **No** — not in CI, not in an npm script | live tree, legitimately (it is a script) | `[BROKEN-DEP]`, `[ORPHAN-DEP]`, `[BAD-CONFIG-DEP]` — dependency integrity |
| `tests/lib/portability-schema.test.js` | yes, via `npm test` | **violates `test-fixture-isolation`** — `findProjectRoot()` at `:51` and `:105` | exact header column order; exact 9-column row arity; `portability-schema.md` doc conformance |
| `scripts/audit/skill-manifest-integrity.js` | yes (added 2026-09-05) | correct — audit script + fixture-bound tests | roster-decay guard; policy spot-checks |

`validate-classification.js` exits **1** today with **4 `[BROKEN-DEP]`** findings, and the committed report recording that failure is dated **2026-08-10**. A checker that has been red for a month without anyone noticing is indistinguishable from no checker — the same reasoning `project-context.md` applies to the enforcement gap it documents in `commit-preparation`.

The four duplicate declarations of `['standalone','light-deps','pipeline']` are a **symptom** of this topology, not the disease. Deduplicating the constant without resolving which checker owns what would tidy the surface and leave the gap.

**The 4 `[BROKEN-DEP]` are false positives.** Investigated 2026-09-06: all four templates exist, under gitignored `.claude/skills/`. `resolveRelativeDep` (`:137`) resolves dependencies against the skill directory named by the `path` column — and for these three skills that directory does not exist, because `path` is a CANDIDATE list where 75 of 106 entries legitimately do not resolve. A missing skill directory is therefore indistinguishable from a broken dependency. The correlation is exact: of the 4 rows carrying relative-path deps, the only one whose `path` resolves (`bmad-create-prd`) is also the only one reporting clean. So there is nothing to fix in the manifest and nothing to exempt — **the checker is wrong**, and it must be corrected before it is wired, not after.

**The resolution is a declared boundary, not a merge.** The two scripts answer different questions, with different triggers:

- `validate-classification.js` — *is this CSV internally well-formed and self-consistent?* Fires on a bad edit.
- `skill-manifest-integrity.js` — *does this CSV still match the upstream world and our policy?* Fires on an upstream release.

Who is affected: the maintainer, whose CI reports green while a manifest defect stands; and the ~40% Vortex Standalone segment, for whom the portability manifest is the load-bearing artifact behind `convoke-export`.

## Capabilities

- **CAP-1**
  - **intent:** Dependency integrity of `skill-manifest.csv` is enforced on every pull request, so a broken or orphaned dependency cannot land unseen.
  - **success:** A CI step fails when a manifest dependency is genuinely broken, and passes on the current tree. Demonstrated by introducing a bogus `dependencies` entry into a fixture whose skill directory *does* resolve, observing red, then removing it and observing green. The gate must be green on `main` the day it lands.

- **CAP-2**
  - **intent:** `test-fixture-isolation` holds as a *class* across the portability layer, not just for the one file already fixed.
  - **success:** No file under `tests/` reads `_bmad/_config/skill-manifest.csv` or calls `findProjectRoot()` to reach it. A grep for both across `tests/` returns zero hits, and the live assertions still run — from an audit script.

- **CAP-3**
  - **intent:** The assertions currently unique to `portability-schema.test.js` keep running after they move to `validate-classification.js`, so consolidation does not quietly narrow coverage.
  - **success:** Exact header column order, exact 9-column row arity, and `portability-schema.md` doc conformance each have a check that has been shown to go red. Specifically includes the row-**longer**-than-header case, which `skill-manifest-integrity.js` currently misses.

- **CAP-4**
  - **intent:** A reader can tell, at each declaration site of the classification vocabulary, whether the duplication is deliberate independence or drift.
  - **success:** Each surviving declaration carries a comment naming its role and its counterpart. A test fails when two sites that are supposed to agree diverge — and passes while they agree, so the pin is visible without being automatic. Widening one site must never silently widen what another checker accepts.

- **CAP-5**
  - **intent:** `VALID_TIERS` names one vocabulary within `scripts/audit/`.
  - **success:** `grep -rn "VALID_TIERS" scripts/audit/` shows no two declarations holding different value sets.

- **CAP-6**
  - **intent:** The validator distinguishes *"this skill is not installed at its candidate path"* from *"this dependency is broken"*, so the CANDIDATE-LIST design cannot masquerade as a manifest defect.
  - **success:** On the current tree the validator reports **zero** hard dependency findings, while a genuinely broken dependency under a resolving skill directory still reports one. The non-resolving-path case is reported under a distinct, non-hard finding type so the gap stays visible without gating CI.

## Constraints

- **The row-vocabulary overlap between the two scripts is deliberate and stays.** Both check tier/intent against their own `VALID_TIERS`. This looks like the duplication the spec exists to remove; it is not. Two checkers with *independent* vocabularies mean a widened definition in one is caught by the other. Round 2 (2026-09-05) proved the alternative: importing the audit's vocabulary from `classify-skills.js` made it accept a bogus tier with **zero** test failures. Consolidating these two re-creates that single point of failure.
- **A checker must not take its vocabulary from the writer it polices.** The general form of the constraint above. Any design giving all four sites one shared module reintroduces the proven defect.
- **`validate-classification.js` is not retired or rewritten.** It already satisfies `no-process-cwd-in-libs` (`validate(projectRoot)` takes the root; `findProjectRoot()` is confined to `main()`), carries an `isInsideProjectRoot` containment guard per `path-safety-for-destructive-ops`, and has 21 fixture-isolated tests. Its only defect is that nothing runs it.
- **CI calls `validate(projectRoot)`, not `main()`.** The report write is `fs.writeFileSync` at `:491`, inside `main()` only — so the gate must not leave `portability-validation-report.md` dirty on every run.
- **Live reads belong in `scripts/audit/` or an existing script; fixture-bound tests in `tests/`.** The precedent is `skill-manifest-integrity.js` + `tests/audit/skill-manifest-integrity.test.js`: pure functions over injected data, I/O confined to `main()`.
- **The `path` column is a CANDIDATE list.** 31 of 106 entries resolve; the other 75 do not, and that is correct (`refresh-installation.js:529-540`). No change may repoint `path` at gitignored `.claude/skills/`, and no checker may treat a non-resolving `path` as a hard error. This trap has caught four previous attempts and cost one reverted ADR.
- **A newly wired gate may not land red.** CAP-1 wires a checker that currently fails, so the 4 `[BROKEN-DEP]` must be resolved or explicitly exempted in the same change.
- **Every check must be shown able to fail** (`verification-must-be-falsifiable`). A passing gate nobody has seen go red is not evidence.
- **No hardcoded counts** (`derive-counts-from-source`). Row, skill and column counts derive from the artifact at runtime.
- **Namespace decision.** Every touched path is Convoke-owned (`scripts/`, `tests/`, `.github/`). No `_bmad/bme/` skill, workflow or agent is authored, so the Operator Covenant compliance checklist does **not** apply. Recorded explicitly per `namespace-decision-for-new-skills` rather than omitted.

## Non-goals

- **Not merging the two scripts.** Ruled out: `validate-classification.js` owns CSV self-consistency, `skill-manifest-integrity.js` owns upstream-and-policy conformance. The boundary is the deliverable; a merge is the anti-deliverable.
- **Not collapsing the row-vocabulary overlap.** See the first constraint — the redundancy is load-bearing.
- **Not fixing the audit's one-directional blind spot.** A tracked product skill with no manifest row is invisible today (10 such directories exist). Real, filed, separately scoped — closing it changes what the audit's evidence base *is*.
- **Not replacing the `>= 3` testarch magic floor.** Separately deferred; choosing the replacement is a policy call.
- **Not renaming or restructuring `skill-manifest.csv` itself.** The CANDIDATE-LIST semantics of its `path` column are load-bearing and out of scope — 75 of 106 non-resolving paths are the design.
- **Not resolving the `.claude/skills/` gitignore gap.** The retirement guard can only see tracked directories; enumerating the installed tree instead is a design decision filed separately.
- **Not ruling on `classify-skills.js`'s per-persona intent policy.** `PERSONA_AGENT_INTENTS` assigns `bmad-agent-tech-writer` → `write-documentation` and `bmad-agent-dev` → `plan-your-work`, and no checker verifies that axis. Whether that table is normative policy or an implementation heuristic is a separate operator ruling.
- **Not the two cosmetic audit gaps filed at the Round 3 cap:** `tracked-skills/empty` being masked by the `header/missing-column` and `manifest/empty` early returns (diagnostic only — still exit 2), and `--project-root --help` returning usage without auditing. Fix opportunistically if the work lands nearby.
- **Not a fourth review round on the 2026-09-05 promotion.** This spec supersedes that residue rather than reopening it.

## Success signal

CI answers one question about `skill-manifest.csv` — *is it sound?* — covering vocabulary, arity, roster decay **and** dependency integrity, with no test under `tests/` reading the live file. Deleting any single unique assertion from the consolidated checkers turns CI red, demonstrated by doing it.

## Delivery sequence

1. **Fix the false-positive class first** (CAP-6). The 4 current `[BROKEN-DEP]` are validator defects, not manifest defects — see *Why*. Wiring before fixing would land a permanently-red gate and invite the CANDIDATE-LIST trap.
2. **Then wire `validate-classification.js` into CI**, calling `validate(projectRoot)` so the report write at `:491` never runs. Closes CAP-1, and closes a month-old invisible failure.
3. **Move header order, row arity and doc conformance** out of `portability-schema.test.js` into `validate-classification.js`; leave fixture-bound tests behind. Closes CAP-2 and CAP-3.
4. **Document the boundary and the deliberate overlap** at both declaration sites; add the pinning test. Closes CAP-4 and CAP-5.

## Assumptions

- The 29 warnings from `validate-classification.js` stay warnings; only its 4 hard errors gate CI.
