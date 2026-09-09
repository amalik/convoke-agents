# Story sp-7.1: Fold the schema lint into the audit and close the arity gap

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As the maintainer,
I want `tests/lib/portability-schema.test.js`'s live-tree assertions folded into `scripts/audit/skill-manifest-integrity.js` and the file deleted,
so that the manifest lint lives in one place, `test-fixture-isolation` holds across the portability suites, and a row with too many columns stops passing unnoticed.

## Acceptance Criteria

**AC1 — The file is gone.** `tests/lib/portability-schema.test.js` no longer exists. No file under `tests/` calls `findProjectRoot()` to read `_bmad/_config/skill-manifest.csv` as data. Verified: `grep -rn "findProjectRoot" tests/lib/portability-schema.test.js` returns nothing (no file), and a repo-wide `grep -rn "findProjectRoot" tests/` shows no remaining hit that reads the manifest.

**AC2 — Header column ORDER is asserted, not just presence.** The audit reports a finding when the manifest header is not exactly `canonicalId,name,description,module,path,install_to_bmad,tier,intent,dependencies` in that order. Today `header/missing-column` only checks presence, so a reordered header passes.

**AC3 — Exact row arity, both directions.** The audit reports a finding when a data row has **more** fields than the header, not only fewer. This closes the gap filed at the Round 3 cap of the 2026-09-05 promotion: `row/malformed` tests `row.length < header.length` only, so an unescaped comma splitting a description currently audits clean. `portability-schema.test.js` Test 2 caught it; deleting that file without this AC would narrow coverage.

**AC4 — Schema-doc conformance survives.** The audit reports a finding when `_bmad/_config/portability-schema.md` is missing, lacks any of the sections `## Tier`, `## Intent`, `## Dependencies`, `## Examples`, or fails to mention every canonical tier and intent. Vocabulary is derived from the audit's own constants, never a second literal list (`derive-counts-from-source`).

**AC5 — Nothing is duplicated.** Tests 3 and 4 of the deleted file (tier and intent vocabulary) are NOT re-added: `row/invalid-tier` and `row/invalid-intent` already assert exactly that. Confirm by reading `scripts/audit/skill-manifest-integrity.js` before writing anything.

**AC6 — One fewer vocabulary copy.** `VALID_TIERS` / `VALID_INTENTS` at `tests/lib/portability-schema.test.js:18-29` disappear with the file. No replacement copy is introduced anywhere. After this story `grep -rn "VALID_TIERS *=" scripts/ tests/` shows exactly four sites: `classify-skills.js`, `validate-classification.js`, `skill-manifest-integrity.js`, and the unrelated `name-registry-integrity.js`.

**AC7 — Every new finding is demonstrated able to fail.** Each new finding id added in AC2–AC4 has a fixture-bound test in `tests/audit/skill-manifest-integrity.test.js` that corrupts exactly one property and asserts that specific id fires (`verification-must-be-falsifiable`). A passing gate nobody has seen go red is not evidence.

**AC8 — Green on the real tree.** `node scripts/audit/skill-manifest-integrity.js` exits 0 against the live repository. If any new check fires on the real manifest, that is a genuine finding to report to the operator, not a reason to weaken the check — HALT and ask.

**AC9 — No regressions.** `npm test` passes. `npm run lint` reports zero warnings. `tests/lib/portability-validation.test.js` (16 tests) still passes untouched.

## Tasks / Subtasks

- [ ] **Task 1 — Read before writing** (AC5)
  - [ ] Read `scripts/audit/skill-manifest-integrity.js` end to end, listing every finding id it already emits
  - [ ] Read `tests/lib/portability-schema.test.js` end to end and classify each of its 5 assertions as ALREADY-COVERED or UNIQUE
  - [ ] Confirm the expected split: Tests 3 and 4 already covered; Test 1 (header order), Test 2 (arity), and the schema-doc test unique

- [ ] **Task 2 — Header column order** (AC2, AC7)
  - [ ] RED: add a fixture test asserting a `header/column-order` finding fires when the header is reordered
  - [ ] GREEN: add the check to `audit()`, comparing against a single ordered constant that `header/missing-column` also derives from
  - [ ] REFACTOR: ensure a missing column still reports `header/missing-column` and still returns early — the existing early return exists because nothing below can be trusted without the columns

- [ ] **Task 3 — Exact row arity** (AC3, AC7)
  - [ ] RED: add a fixture test asserting a finding fires on a row with MORE fields than the header
  - [ ] GREEN: widen the `row/malformed` check from `row.length < header.length` to an inequality, with a message naming both counts
  - [ ] Confirm the existing short-row test still passes and still skips the malformed row rather than dereferencing it

- [ ] **Task 4 — Schema-doc conformance** (AC4, AC7)
  - [ ] RED: add fixture tests for each failure mode — doc missing, a section absent, a vocabulary term absent
  - [ ] GREEN: implement, deriving the required terms from the audit's own `VALID_TIERS` / `VALID_INTENTS`
  - [ ] Decide and state where the doc path is resolved: it is I/O, so it belongs in `main()` alongside the manifest read, with the pure `audit()` receiving the doc content as data

- [ ] **Task 5 — Delete and verify** (AC1, AC6, AC8, AC9)
  - [ ] Delete `tests/lib/portability-schema.test.js`
  - [ ] Run `node scripts/audit/skill-manifest-integrity.js` — must exit 0
  - [ ] Run `npm test` and `npm run lint`
  - [ ] Run the AC6 grep and confirm exactly four `VALID_TIERS` sites

- [ ] **Task 6 — Commit plan** (AC9)
  - [ ] Produce a commit plan per `project-context.md` `commit-preparation`: files, `<type>(<scope>): <intent>` summary, description with review status, the `git diff --cached --name-only` proof, and a falsifiable clause naming how each cited check was shown able to fail

## Dev Notes

### What this file actually is

`tests/lib/portability-schema.test.js` (123 lines, story sp-1-1) contains **zero behavioural tests**. There is no code under test. All five assertions read two tracked artifacts and assert their shape — it is a **lint wearing a test's clothes**, which is why it violates `test-fixture-isolation` while looking reasonable.

That matters for the fix. Pointing it at `FIXTURE_ROOT` would make it assert that *our own fixture* is well-formed, which tests nothing. The right destination is the audit script that already lints this exact artifact.

### The five assertions, classified (verified 2026-09-09)

| Test | What it asserts | Status |
|---|---|---|
| Test 1 | header equals the 9 columns **in order** | **UNIQUE** — audit's `header/missing-column` checks presence only |
| Test 2 | every data row has **exactly** 9 columns | **UNIQUE** — audit's `row/malformed` checks `<` only |
| Test 3 | non-empty tier ∈ canonical tiers | already `row/invalid-tier` |
| Test 4 | non-empty intent ∈ canonical intents | already `row/invalid-intent` |
| doc test | `portability-schema.md` exists + sections + vocabulary | **UNIQUE** — nothing covers it |

`parseCsvRow` and `countCsvColumns` are imported from `scripts/portability/manifest-csv.js` and are independently tested in `tests/team-factory/csv-utils.test.js`. **This file carries no unique helper coverage**, so it can be deleted outright rather than reduced to a stub.

### Why the audit, and not a fixture

Precedent set 2026-09-05: the sp-1-2 classification lint was promoted out of this same `tests/lib/` directory into `scripts/audit/skill-manifest-integrity.js`, with fixture-bound tests in `tests/audit/`. The live read lives in the audit script; the tests drive its pure `audit({header, rows, trackedSkillDirs})` over synthetic data. Follow that shape exactly — `audit()` stays pure, all I/O in `main()`.

Contrast with `tests/lib/portability-fixture.js` (backlog I123), which serves a different need: `FIXTURE_ROOT` is the DATA that *code under test* reads. That pattern applies to the exporter suites, not here, because here there is no code under test.

### Do not touch

- **`tests/lib/portability-validation.test.js`** — 16 tests, passing, built by story dist-2-8. Its Test 1b deliberately reads `REPO_ROOT` with a ratchet baseline at `.github/expected-classification-findings.txt`. That is a considered design, not a violation to clean up. Leave it alone.
- **The `path` column of `skill-manifest.csv`.** 31 of 106 entries resolve; the other 75 do not, and that is the design — 75 rows point at upstream BMAD content this repo deleted in `a16fa340`. ⚠ **Never repoint a `path` cell at `.claude/skills/`**: done 2026-08-10 in `4ed770a0`, reverted within the hour in `8f2fbda0`, because those paths are gitignored — it passes on a developer machine and hollows out in a clean checkout. The trap has caught five attempts.
- **The row-vocabulary overlap** between `validate-classification.js` and `skill-manifest-integrity.js`. Deliberate. Round 2 (2026-09-05) proved that importing the audit's vocabulary from the writer it polices made it accept a bogus tier with zero test failures. AC6 removes a *test's* third copy, not either checker's.

### Traps specific to this story

1. **Do not "simplify" by deleting the file and trusting the audit.** Three assertions are unique; two of them (AC2, AC3) are currently *weaker* in the audit. Deleting first and folding second is how coverage disappears.
2. **AC3 is a real live gap, not a hypothetical.** An unescaped comma inside a `description` splits the row and currently audits clean.
3. **The early return in `audit()` after `header/missing-column` is load-bearing.** Nothing below can be trusted without the columns. Adding the order check must not bypass it.
4. **If a new check fires on the real manifest, stop.** That is a genuine defect in a tracked artifact and the operator decides. Do not soften the check to get green (AC8).

### Project Structure Notes

- `scripts/audit/skill-manifest-integrity.js` — the destination. Pure `audit()`, I/O in `main()`, `findProjectRoot()` only at the CLI entry (`no-process-cwd-in-libs`).
- `tests/audit/skill-manifest-integrity.test.js` — where the new falsifiability tests go, alongside the existing 41.
- `tests/lib/portability-schema.test.js` — deleted.
- **Namespace decision:** every touched path is Convoke-owned (`scripts/`, `tests/`). No `_bmad/bme/` skill, workflow or agent is authored, so the Operator Covenant compliance checklist does **not** apply. Recorded explicitly per `namespace-decision-for-new-skills` rather than omitted.
- No new dependencies. No CI wiring needed — the audit already runs as a step in the `agent-surface-parity` job.

### References

- [Source: _bmad-output/specs/spec-portability-manifest-checkers/SPEC.md#Capabilities] — CAP-2, CAP-3; and CAP-5 partially, via AC6
- [Source: _bmad-output/specs/spec-portability-manifest-checkers/.memlog.md] — the decision record, including three premises refuted on 2026-09-09
- [Source: project-context.md#Rule: test-fixture-isolation] — the violation being closed
- [Source: project-context.md#Rule: verification-must-be-falsifiable] — AC7
- [Source: project-context.md#Rule: derive-counts-from-source] — AC4, AC6
- [Source: project-context.md#Rule: commit-preparation] — Task 6

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
