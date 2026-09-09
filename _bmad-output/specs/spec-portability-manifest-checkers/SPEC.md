---
id: SPEC-portability-manifest-checkers
companions:
  - ../../../project-context.md
sources:
  - _bmad-output/implementation-artifacts/deferred-work.md
---

> **Canonical contract.** This SPEC and the files in `companions:` are the complete, preservation-validated contract for what to build, test, and validate. Source documents listed in frontmatter are for traceability only — consult them only if you need narrative rationale or prose color this contract intentionally omits.

# Portability manifest checkers — isolation and the seeding-closure gap

## Why

> **This spec was rewritten on 2026-09-09 after its original premise was refuted.** The first version claimed `scripts/portability/validate-classification.js` was wired into nothing and had been failing unwatched since 2026-08-10. That is false, and the correction is recorded here rather than quietly dropped, because a spec resting on a refuted claim sends the next reader down the same path.

**What was actually true.** `validate-classification.js` is exercised in CI through `tests/lib/portability-validation.test.js`, which `npm test` runs — 16 tests, all passing. Test 1a runs the validator against a dependency-closed `FIXTURE_ROOT`; Test 1b validates the **seeding set** against a ratchet baseline at `.github/expected-classification-findings.txt`. Story **dist-2-8** (2026-09-07) built that, closing backlog **I134** as *PREMISE REFUTED / CHECK RESCOPED*.

**The four `[BROKEN-DEP]` findings were already known and already resolved.** They sat in that baseline file until `dist-2-8` emptied it, because all three affected skills have non-resolving `path` cells and therefore never seed into an operator's project. Verified 2026-09-09: `bmad-check-implementation-readiness`, `bmad-create-epics-and-stories` and `wds-4-ux-design` are all filtered out; `bmad-create-prd` is the only relative-dep row that seeds, and it is clean.

**How the error happened, stated so it is not repeated.** The validator's `main()` was run against the full **106-row CANDIDATE list** and its `exit 1` read as a broken gate. The validated scope is deliberately the **31 rows that actually seed**. This is the near neighbour of the documented CANDIDATE-LIST trap: not repointing `path` at gitignored `.claude/skills/` — that failure mode was correctly avoided — but treating the candidate list as the thing under test.

**What remains.** Two genuinely open items, both smaller than the original scope:

1. **`tests/lib/portability-schema.test.js` calls `findProjectRoot()` at `:51` and `:105` to read the live manifest as data.** `tests/lib/portability-fixture.js` (backlog I123) already established the idiomatic pattern for this directory — `FIXTURE_ROOT` is the data under test and is *never* `findProjectRoot()`; `REPO_ROOT` only locates code. This file predates that pattern and never adopted it.
2. **A seeding row whose bare-name dependency points at a row that does not seed is reported by nothing.** `dist-2-8` named this gap and filed it rather than improvising. Two live instances: `bmad-help` → `bmad-quick-dev`, and `bmad-migrate-artifacts` → `bmad-create-epics-and-stories`.

Who is affected: the ~40% Vortex Standalone segment, for whom the seeding manifest is the load-bearing artifact behind `convoke-export` — a dependency that does not ship is a broken skill in their tree.

## Capabilities

- **CAP-2**
  - **intent:** The portability suites read their data from a fixture, so upstream churn in the live tree cannot turn a passing suite red or hollow.
  - **success:** `tests/lib/portability-schema.test.js` no longer calls `findProjectRoot()`. Schema-shape assertions run against `FIXTURE_ROOT`. Any assertion that genuinely needs the shipped manifest uses `REPO_ROOT` explicitly with a ratchet, following Test 1b's pattern, and says why at the call site.

- **CAP-3**
  - **intent:** The assertions currently unique to `portability-schema.test.js` keep running after the change, so isolation does not quietly narrow coverage.
  - **success:** Exact header column order, exact 9-column row arity, and `portability-schema.md` doc conformance each still have a check, and each has been shown to go red.

- **CAP-4**
  - **intent:** A reader can tell, at each declaration site of the classification vocabulary, whether the duplication is deliberate independence or drift.
  - **success:** Each surviving declaration carries a comment naming its role and its counterpart. A test fails when two sites that are supposed to agree diverge. Widening one site must never silently widen what another checker accepts.

- **CAP-5**
  - **intent:** `VALID_TIERS` names one vocabulary within `scripts/audit/`.
  - **success:** `grep -rn "VALID_TIERS" scripts/audit/` shows no two declarations holding different value sets.

- **CAP-7**
  - **intent:** A seeding manifest row whose bare-name dependency points at a row that does not seed is reported, so a shipped skill cannot depend on something the installer never delivers.
  - **success:** A new finding type reports both live instances. `[ORPHAN-DEP]` and `[BROKEN-DEP]` are left untouched — the first is a typo check against the manifest's vocabulary, the second checks path-shaped deps, and neither can be redefined to cover this without losing its own meaning. The new type's severity (hard vs warning) is chosen deliberately and stated, since making it hard fails CI on two rows that exist today.

### Retired capabilities

IDs are never reused (Spec Law 6).

- **CAP-1** *(retired 2026-09-09 — already satisfied)*. Dependency integrity of the seeding manifest is enforced by `dist-2-8`'s Test 1b ratchet.
- **CAP-6** *(retired 2026-09-09 — solved differently)*. `dist-2-8` resolved the dependency-resolution false-positive class by filtering the input to the seeding set, and named the remedy for non-seeding coverage explicitly: **extend `tests/fixtures/portability-project/`**, not teach the validator to distinguish. Teaching it would duplicate a solved problem.

## Constraints

- **The `path` column is a CANDIDATE list.** 31 of 106 entries resolve; the other 75 do not, and that is correct. No change may repoint `path` at gitignored `.claude/skills/` — done 2026-08-10 in `4ed770a0`, reverted within the hour in `8f2fbda0`, because it passes on a developer machine and hollows out in a clean checkout. **And no check may treat the 106-row candidate list as its validated scope**; the seeding set is the subject. This trap has now caught five attempts.
- **Reuse the installer's own seeding predicate**, imported, never reimplemented. A second copy lets the test and the installer drift into disagreeing about what ships — a ratchet confident about the wrong tree.
- **The row-vocabulary overlap between `validate-classification.js` and `scripts/audit/skill-manifest-integrity.js` is deliberate and stays.** Two checkers with *independent* vocabularies mean a widened definition in one is caught by the other. Round 2 (2026-09-05) proved the alternative: importing the audit's vocabulary from `classify-skills.js` made it accept a bogus tier with zero test failures.
- **`validate-classification.js` is not rewritten or retired.** It satisfies `no-process-cwd-in-libs`, carries an `isInsideProjectRoot` containment guard, and its 21 fixture-isolated tests must keep passing.
- **Any filtered check needs a non-vacuity floor.** Filtering is the operation that can silently reduce a validated set to nothing, and this repository has shipped checks that reported success while doing no work.
- **Every check must be shown able to fail** (`verification-must-be-falsifiable`).
- **No hardcoded counts** (`derive-counts-from-source`).
- **Namespace decision.** Every touched path is Convoke-owned (`scripts/`, `tests/`, `.github/`). No `_bmad/bme/` skill, workflow or agent is authored, so the Operator Covenant compliance checklist does **not** apply. Recorded explicitly per `namespace-decision-for-new-skills`.

## Non-goals

- **Not re-solving dependency integrity.** `dist-2-8` did it. Re-deriving that work is how this spec went wrong the first time.
- **Not merging the two checkers, and not collapsing their vocabulary overlap.** `validate-classification.js` owns CSV self-consistency; `skill-manifest-integrity.js` owns upstream-and-policy conformance.
- **Not extending the fixture to cover non-seeding upstream rows.** Named by `dist-2-8` as the remedy for that coverage, and real — but it is fixture-authoring work with its own scope.
- **Not fixing the two live CAP-7 instances.** Reporting them is this spec's job; deciding whether `bmad-help` should ship without `bmad-quick-dev` is an operator call.
- **Not fixing the audit's one-directional blind spot** (a tracked product skill with no manifest row — 10 exist today).
- **Not replacing the `>= 3` testarch magic floor.**
- **Not ruling on `classify-skills.js`'s per-persona intent policy.**

## Success signal

The portability suites pass on a clean checkout with no test reading the live tree for data, and a seeding skill that depends on something the installer never delivers is named by a check — including the two that exist today.

## Delivery sequence

1. **CAP-7 — the seeding-closure gap.** A new finding type, the two known instances reported, severity chosen deliberately. Independently shippable and the only item delivering new operator-visible coverage.
2. **CAP-2 + CAP-3 — adopt the two-root pattern** in `portability-schema.test.js`, preserving header/arity/doc coverage.
3. **CAP-4 + CAP-5 — vocabulary ownership and the `VALID_TIERS` collision.**

## Assumptions

- The `module`-column grouping of the seeding set (`core` 11, `bmm` 1, `bme` 19 as measured 2026-09-07) remains the right basis for a non-vacuity floor; path-segment grouping is a different basis and gives different numbers.
