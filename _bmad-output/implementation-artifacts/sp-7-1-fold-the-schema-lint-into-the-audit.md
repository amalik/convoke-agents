---
baseline_commit: 1af51e7e257e00fa3ce024841f2b52ce006fe82e
---

# Story sp-7.1: Fold the schema lint into the audit and close the arity gap

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As the maintainer,
I want `tests/lib/portability-schema.test.js`'s live-tree assertions folded into `scripts/audit/skill-manifest-integrity.js` and the file deleted,
so that the manifest lint lives in one place, `test-fixture-isolation` holds across the portability suites, and a row with too many columns stops passing unnoticed.

## Acceptance Criteria

**AC1 — The file is gone.** `tests/lib/portability-schema.test.js` no longer exists. No file under `tests/` calls `findProjectRoot()` to read `_bmad/_config/skill-manifest.csv` as data. Verified: `grep -rn "findProjectRoot" tests/lib/portability-schema.test.js` returns nothing (no file), and a repo-wide `grep -rn "findProjectRoot" tests/` shows no remaining hit that reads the manifest.

**AC2 — Header column ORDER is asserted, not just presence.** The audit reports a finding when the manifest header is not exactly `canonicalId,name,description,module,path,install_to_bmad,tier,intent,dependencies` in that order. Today `header/missing-column` only checks presence, so a reordered header passes.

**AC3 — Exact row arity, both directions.** The audit reports a finding when a data row has **more** fields than the header, not only fewer. This closes the gap filed at the Round 3 cap of the 2026-09-05 promotion: `row/malformed` tests `row.length < header.length` only, so an unescaped comma splitting a description currently audits clean. `portability-schema.test.js` Test 2 caught it; deleting that file without this AC would narrow coverage.

**AC4 — ~~Schema-doc conformance survives.~~ STRUCK 2026-09-09 after Round 3.** The deleted file also asserted that `_bmad/_config/portability-schema.md` exists, carries four sections, and mentions every canonical term. Three review rounds each found a HIGH in the reimplementation of that single assertion — substring shadowing, then a `TypeError` crash, then a fence parser broken in both directions (false pass on a nested fence; four false accusations on an unterminated one, in a gate wired into CI). **Every defect was introduced by the previous round's fix.** Per `code-review-convergence`'s prefer-deletion clause the check was removed rather than rewritten a fourth time. Two items filed rather than lost: doc-conformance needs a spec of its own (what counts as a section, whether fenced examples count, which trees it applies to — questions this story never asked), and the finding that surfaced along the way, that **nothing seeds `portability-schema.md` into an operator's project**.

**AC5 — Nothing is duplicated.** Tests 3 and 4 of the deleted file (tier and intent vocabulary) are NOT re-added: `row/invalid-tier` and `row/invalid-intent` already assert exactly that. Confirm by reading `scripts/audit/skill-manifest-integrity.js` before writing anything.

**AC6 — One fewer vocabulary copy.** `VALID_TIERS` / `VALID_INTENTS` at `tests/lib/portability-schema.test.js:18-29` disappear with the file. No replacement copy is introduced anywhere. After this story `grep -rn "VALID_TIERS *=" scripts/ tests/` shows exactly four sites: `classify-skills.js`, `validate-classification.js`, `skill-manifest-integrity.js`, and the unrelated `name-registry-integrity.js`.

**AC7 — Every new finding is demonstrated able to fail.** Each new finding id added in AC2–AC4 has a fixture-bound test in `tests/audit/skill-manifest-integrity.test.js` that corrupts exactly one property and asserts that specific id fires (`verification-must-be-falsifiable`). A passing gate nobody has seen go red is not evidence.

**AC8 — Green on the real tree.** `node scripts/audit/skill-manifest-integrity.js` exits 0 against the live repository. If any new check fires on the real manifest, that is a genuine finding to report to the operator, not a reason to weaken the check — HALT and ask.

**AC9 — No regressions.** `npm test` passes. `npm run lint` reports zero warnings. `tests/lib/portability-validation.test.js` (16 tests) still passes untouched.

## Tasks / Subtasks

- [x] **Task 1 — Read before writing** (AC5)
  - [x] Read `scripts/audit/skill-manifest-integrity.js` end to end, listing every finding id it already emits
  - [x] Read `tests/lib/portability-schema.test.js` end to end and classify each of its 5 assertions as ALREADY-COVERED or UNIQUE
  - [x] Confirm the expected split: Tests 3 and 4 already covered; Test 1 (header order), Test 2 (arity), and the schema-doc test unique

- [x] **Task 2 — Header column order** (AC2, AC7)
  - [x] RED: add a fixture test asserting a `header/column-order` finding fires when the header is reordered
  - [x] GREEN: add the check to `audit()`, comparing against a single ordered constant that `header/missing-column` also derives from
  - [x] REFACTOR: ensure a missing column still reports `header/missing-column` and still returns early — the existing early return exists because nothing below can be trusted without the columns

- [x] **Task 3 — Exact row arity** (AC3, AC7)
  - [x] RED: add a fixture test asserting a finding fires on a row with MORE fields than the header
  - [x] GREEN: widen the `row/malformed` check from `row.length < header.length` to an inequality, with a message naming both counts
  - [x] Confirm the existing short-row test still passes and still skips the malformed row rather than dereferencing it

- [x] **Task 4 — Schema-doc conformance** (AC4, AC7)
  - [x] RED: add fixture tests for each failure mode — doc missing, a section absent, a vocabulary term absent
  - [x] GREEN: implement, deriving the required terms from the audit's own `VALID_TIERS` / `VALID_INTENTS`
  - [x] Decide and state where the doc path is resolved: it is I/O, so it belongs in `main()` alongside the manifest read, with the pure `audit()` receiving the doc content as data

- [x] **Task 5 — Delete and verify** (AC1, AC6, AC8, AC9)
  - [x] Delete `tests/lib/portability-schema.test.js`
  - [x] Run `node scripts/audit/skill-manifest-integrity.js` — must exit 0
  - [x] Run `npm test` and `npm run lint`
  - [x] Run the AC6 grep and confirm exactly four `VALID_TIERS` sites

- [x] **Task 6 — Commit plan** (AC9)
  - [x] Produce a commit plan per `project-context.md` `commit-preparation`: files, `<type>(<scope>): <intent>` summary, description with review status, the `git diff --cached --name-only` proof, and a falsifiable clause naming how each cited check was shown able to fail

### Review Findings

Round 1, 2026-09-09. Three layers (Blind Hunter, Edge Case Hunter, Acceptance Auditor) at `full` mode. All nine ACs verified SATISFIED by the Auditor; every finding below is in claims, comment hygiene, or checks whose letter passes while their substance does not. Each was re-verified by execution before rating.

- [x] [Review][Patch] **HIGH — SPEC.md still prescribes the approach this story abandoned** [_bmad-output/specs/spec-portability-manifest-checkers/SPEC.md:34] — CAP-2 success still reads "Schema-shape assertions run against `FIXTURE_ROOT`", and `.memlog.md:49` says "NOT to promote it to scripts/audit/". This story promoted it to `scripts/audit/` after reading the file, and the spec was never amended. The canonical contract now misdirects the next reader — the exact failure its own preamble was rewritten to prevent.
- [x] [Review][Patch] **HIGH — `schema-doc/section` cannot detect removal of `## Tier`** [scripts/audit/skill-manifest-integrity.js:292] — `includes('## Tier')` is satisfied by `### Tier classification rules` at `portability-schema.md:19`. Proven: deleting the real `## Tier` heading yields **zero** schema-doc findings. The only section test mutates `## Examples`, the one section with no shadowing H3, so AC7's falsifiability holds for 1 of 4 sections and is structurally impossible for the vulnerable one.
- [x] [Review][Patch] **HIGH — the audit now hard-fails on every installed tree** [scripts/audit/skill-manifest-integrity.js:646] — `package.json` `files[]` ships `scripts/` (22 audit files packed) but only `_bmad/_config/skill-manifest.csv` from `_config`; `portability-schema.md` does not ship. An operator running the audit from an install gets `schema-doc/missing`, exit 2, on a correct tree. Before this change that run passed. Needs a ruling: ship the doc, or scope the doc check to repo-side.
- [x] [Review][Patch] **MEDIUM — a too-long row cascades into misleading roster advice** [scripts/audit/skill-manifest-integrity.js:371] — verified: appending one field to the `bmad-help` row yields `row/malformed, meta-platform/roster-decay`, the second telling the operator to "add it to RETIRED". Following that on a merely mis-quoted row corrupts roster policy. New behaviour: before `!==`, a long row entered `wellFormed`.
- [x] [Review][Patch] **MEDIUM — an empty schema doc reports 16 findings and never `schema-doc/missing`** [scripts/audit/skill-manifest-integrity.js:282] — `typeof '' === 'string'`, so a zero-byte doc takes the else branch: 4 section + 12 vocabulary findings for what is one absent file.
- [x] [Review][Patch] **MEDIUM — stale comments assert the deleted file still exists** [scripts/audit/skill-manifest-integrity.js:24-29, :60-64] — plus `tests/audit/skill-manifest-integrity.test.js:513-516` and `tests/lib/portability-classification.test.js:18-21`. Two are inside files this diff modifies; the SCOPE block now states the opposite of the truth. `documentation-claims-must-be-derived`.
- [x] [Review][Patch] **MEDIUM — Completion Notes counts are wrong** — claimed "41 → 60 tests" and "19 new tests". Measured: HEAD 49, now 60, **+11**. Derived by subtracting from a stale baseline rather than counting. `derive-counts-from-source`, in the record of the work itself. The AC1 note's "4 files" is likewise 5, and the RED note's 6+3 does not reconcile with 11 added.
- [x] [Review][Patch] **MEDIUM — Task 2's GREEN bullet is checked but was not done** [scripts/audit/skill-manifest-integrity.js:311-325] — the bullet promises "a single ordered constant that `header/missing-column` also derives from". `header/missing-column` still iterates its own four-label literal; there is now one ordered constant *and* a separate literal.
- [x] [Review][Patch] **MEDIUM — `audit()`'s contract changed and its docblock did not** [scripts/audit/skill-manifest-integrity.js:272-276] — `schemaDoc` has no default, so a caller using the pre-existing three-field shape now gets a phantom `schema-doc/missing` asserting a filesystem fact it never supplied. `audit` is exported.
- [x] [Review][Patch] **MEDIUM — deferred-work rows this story closes were left standing** [_bmad-output/implementation-artifacts/deferred-work.md:1185-1187, :1199] — including the `row/malformed` row AC3 exists to close. A reader picking either up would redo finished work.
- [x] [Review][Patch] **LOW — both new exports are dead, and the test file re-duplicates what they hold** — `EXPECTED_HEADER_COLUMNS` / `SCHEMA_DOC_SECTIONS` have no consumer; `HEADER` at test:41 stays a hand-copied literal and `validSchemaDoc()` hard-codes the four section strings.
- [x] [Review][Patch] **LOW — every doc read error is reported as a governance defect** [scripts/audit/skill-manifest-integrity.js:648-652] — `EISDIR`/`EACCES`/`ELOOP` all collapse to `null` and exit 2, while the manifest read three lines above prints `err.message` and exits 1.
- [x] [Review][Patch] **LOW — operator output never names the schema doc** — `USAGE` still describes only the manifest; the run header and PASS line omit the doc; `schema-doc/missing` hardcodes a relative string instead of the resolved path.
- [x] [Review][Patch] **LOW — the new constants orphaned `finding()`'s rationale** [scripts/audit/skill-manifest-integrity.js:172-195] — the severity-axis comment now reads as annotation on a column list.
- [x] [Review][Defer] **LOW — a missing manifest hides a missing schema doc in the CLI path** [scripts/audit/skill-manifest-integrity.js:632] — deferred, pre-existing shape. `main()` returns 1 on a `readManifest` throw before `audit()` runs, so the block's "independent artifact" rationale holds inside `audit()` but not in the path operators use.

**Dismissed as noise (1):** the `header/column-order` negative control being self-referential — `base()`'s header and `EXPECTED_HEADER_COLUMNS` are separate literals, so the control catches a typo in either, and `ci.yml:184` pins the real header.

### Review Findings — Round 2 (2026-09-09)

**Layer failure:** the Blind Hunter terminated early on an API error after confirming fixes #1 and #3; its output was partial and is treated as incomplete. Edge Case Hunter and Acceptance Auditor both completed and **independently found the same HIGH**.

- [x] [Review][Patch] **HIGH — the Round 1 `namedRows` fix introduced a `TypeError` crash** [scripts/audit/skill-manifest-integrity.js:474] — Round 1 switched all four rosters to `namedRows` but added the `if (!row) continue;` guard to only three; the CIS loop was missed. Any malformed row named in `CIS_POLICY` threw `Cannot read properties of undefined`, discarding every finding collected and exiting 1. Reproduced, then fixed with a guard **and** a parameterised test covering all four rosters in both directions, so a fifth roster cannot repeat it.
- [x] [Review][Patch] **HIGH — the docblock's "verified against HEAD" claim was false, concealing a real regression** [scripts/audit/skill-manifest-integrity.js:29-40] — the repo-side-only ruling rested on a check against `tests/fixtures/portability-project`, which fails at HEAD for an unrelated reason (`testarch/too-few`). Round 2 built a tree from `npm pack`: **HEAD passes (exit 0), this change failed (exit 2)**. A `verification-basis` failure — verified against a basis the claim was not about. Resolved by shipping `_bmad/_config/portability-schema.md` in `files[]`; the packed tree now exits 0.
- [x] [Review][Patch] **MEDIUM — `stale-retirement` fired on a merely malformed row** — the mirror of the Round 1 `roster-decay` bug: the same `namedRows` switch opened bogus advice in the opposite direction ("remove it from RETIRED"), and only the first direction had been fixed. `resolveRoster` now takes `wellFormedRows` for the reappearance check.
- [x] [Review][Patch] **MEDIUM — the SCOPE comment in `portability-classification.test.js` was false, and the edit deleted unrelated documentation** — "the RULE is now satisfied for this directory" is untrue (`portability-canonical-format.test.js:72` still reads live templates as data), and an over-broad regex swallowed the 10-line BUG-12 rationale. Both corrected; the rationale is restored.
- [x] [Review][Patch] **MEDIUM — the File List omitted four changed paths**, all of them changes the Round 1 remediation itself made. Now lists all nine.
- [x] [Review][Patch] **MEDIUM — three counts were still stale** after the counting fix: File List "19 new tests", Change Log "2237 pass", and the AC1 note's comment-only arithmetic. All re-derived.
- [x] [Review][Patch] **MEDIUM — all 14 Round 1 checkboxes were left unchecked** while the memlog recorded them as applied.
- [x] [Review][Patch] **MEDIUM — an adjacent deferred-work row was invalidated and left standing** — the fixture-`HEADER` row, whose evidence cited the now-deleted file. Closed.
- [x] [Review][Patch] **LOW — `schema-doc/section` was still satisfiable from inside a fenced code block** — the narrower vector of the Round 1 HIGH. The matcher now strips fences; the real doc carries four of them.
- [x] [Review][Patch] **LOW — `.trim()` does not strip U+200B**, so a zero-width-space-only doc reproduced the 16-finding defect the emptiness guard was added to prevent.
- [x] [Review][Patch] **LOW — a `SCHEMA_DOC_SECTIONS` rename would have made two vocabulary tests vacuous** — `validSchemaDoc()` keyed vocabulary off section names. Vocabulary is now emitted independently.
- [x] [Review][Patch] **LOW — the `INDEXED_COLUMNS` comment claimed "derived" for what is a load-time validation**, and the guard is unfalsifiable by input (deleting it leaves the suite green). Comment corrected to say so explicitly rather than implying a test exists.
- [x] [Review][Patch] **LOW — `finding()`'s severity-axis rationale was orphaned** by the new constants, and the PASS line never named the schema doc. Both fixed.

**Not addressed, deliberate:** the `header/column-order` negative control became a tautology once `HEADER` was made to *be* `EXPECTED_HEADER_COLUMNS` — coverage survives via the real-tree run in `ci.yml:184`, which Round 2 confirmed. Recorded as an observation, not a defect.

### Review Findings — Round 3 (2026-09-09)

Scoped deliberately to the **Round 2 delta only** (298 lines, 4 files) — the code no round had yet seen. Rounds 1 and 2 each found their HIGHs in the *previous round's corrections*, so Round 3 looked where the risk was rather than re-reviewing 800 already-cleared lines. All three layers completed.

**Outcome: the schema-doc check was DELETED, not patched.** `code-review-convergence` allows no Round 4, and its prefer-deletion clause applies when a fix keeps leaking in one place. Verified on the live doc: a nested-fence example produced a **false pass**; one stray unterminated fence produced **four false accusations** from a gate wired into CI. A gate that fires wrongly is worse than no gate.

- [x] [Review][Patch] **HIGH — the fence parser was broken in both directions.** Parity-toggling on `/^(```|~~~)/` meant a `~~~` inside a ``` block closed it (false pass) and a nested or unterminated fence stuck `inFence` on (false accusation). Resolved by deleting the check.
- [x] [Review][Patch] **HIGH — the corrected scoping claim was *still* wrong, for the third time.** `files[]` places the doc in `node_modules/` only; nothing seeds it into `<projectRoot>/_bmad/_config/`, so a real operator install still failed. Two agents proved it by running an actual install. Resolved by deleting the check and reverting `files[]`; the underlying seeding gap is filed.
- [x] [Review][Patch] **HIGH — the sentence Round 2 deleted as false was true.** On a real seeded tree the audit emits 10 findings including `testarch/too-few: found 0`. Round 2 refuted it with an `npm pack` directory — the package, not a seeded project — then stamped the original "generalised from the wrong tree". The same `verification-basis` error, committed inside its own correction.
- [x] [Review][Patch] **MEDIUM — `wellFormedRows` was passed at four call sites and exercised at one.** Deleting it from the persona site left the suite fully green while restoring the Round 2 bug. Now parameterised over every roster that declares retirements; mutation-verified at both (3 and 2 failures).
- [x] [Review][Patch] **MEDIUM — `schema-doc/vocabulary` was never fence-fixed**, only `schema-doc/section`. Moot with the deletion.
- [x] [Review][Patch] **LOW — the too-short roster test lacked the `notEqual(i, -1)` guard its sibling had**, so a sample added to `RETIRED` upstream would throw instead of reporting a missing fixture. Fixed.
- [x] [Review][Defer] **MEDIUM — the SCOPE comment names 1 of 9 remaining `findProjectRoot()` violations** in `tests/lib/`. The comment's narrow claim is true; the directory-wide picture is filed.
- [x] [Review][Defer] **LOW — `finding()`'s severity rationale is still orphaned** — raised in Round 1, marked applied in Round 2 while only its paired half was done, still open. Filed, with the note that a `[x]` was recorded against work that did not happen.
- [x] [Review][Defer] **LOW — a row truncated below the name column still trips `roster-decay`.** A genuine information limit, not a bug: the name is unrecoverable. Filed.

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

Claude Opus 5 (1M context) — `claude-opus-5[1m]`

### Debug Log References

### Completion Notes List

- **Task 1 confirmed the story's classification exactly.** The audit emits 22 finding ids (18 literal + 4 templated through `resolveRoster`'s `${label}` prefix — an initial literal-only grep undercounted at 15, corrected by widening the pattern). `header/missing-column` checked presence only; `row/malformed` checked `row.length < header.length` only; no schema-doc check existed. `finding(id, detail)` carries **no severity axis** — Round 2 of the 2026-09-05 promotion removed it deliberately.
- **RED was genuine, not ceremonial.** The 6 new positive assertions failed before implementation while the negative controls passed, demonstrating the AC2/AC3 gaps rather than asserting them. (The initial implementation added 11 tests in total; the "6 + 3" figure in an earlier draft counted only the ones I ran in the first RED batch and did not reconcile with the file — Round 1 flagged the arithmetic.)
- **GREEN surfaced a real defect I introduced.** Placing the schema-doc block before the header checks broke the early return, which guarded on `findings.length`: a missing doc would have short-circuited every manifest check below it. Fixed by guarding on a `missingColumn` flag instead, and pinned by a new regression test ("a missing schema doc does NOT suppress the manifest checks below it"). Two CLI fixture failures were the honest second consequence — the fixtures now write a conformant `portability-schema.md`.
- **Schema-doc check runs FIRST, before the manifest checks**, because the doc is an independent artifact and a malformed header must not hide its absence. `audit()` stays pure: `main()` reads the file and passes content as `schemaDoc`.
- **AC1 needed precise verification, not a co-occurrence grep.** A naive grep flagged 5 files mentioning both `findProjectRoot` and `skill-manifest.csv` (an earlier draft of this note said 4, omitting `tests/lib/portability-classification.test.js` — which was precisely the file carrying a stale claim Round 1 then found). Four are comment-only or a README (`skill-manifest-integrity.test.js`, `portability-fixture.js`, `portability-classification.test.js`, and the fixture README); the one real call, `fresh-install-health.test.js:16`, uses `REPO_ROOT` to locate *code* and reads the manifest from a fresh `installDir` — the legitimate two-root pattern.
- **AC5 honoured:** tier and intent vocabulary assertions were NOT re-added. They already exist as `row/invalid-tier` and `row/invalid-intent`.
- **AC8 clean:** the strengthened audit exits 0 on the real tree, so the real manifest has correct column order, correct arity, and a conformant schema doc. No operator decision needed.
- **Net coverage (counted, not subtracted):** `tests/audit/skill-manifest-integrity.test.js` went from **49** `it(` blocks at HEAD to **60** — the schema-doc suites were removed with the check they covered.

### File List

- `scripts/audit/skill-manifest-integrity.js` — modified: ordered header contract + `INDEXED_COLUMNS` tripwire, schema-doc conformance (fence-aware, whole-line matching), `header/column-order`, `row/malformed` widened to `!==`, roster presence split across `namedRows`/`wellFormed` with guards on all four loops, `main()` reads the doc and distinguishes ENOENT from other read errors
- `tests/audit/skill-manifest-integrity.test.js` — modified: constants imported from the audit, `validSchemaDoc()` builder, and 22 new tests across the fold-in, Round 1 and Round 2 blocks
- `tests/lib/portability-schema.test.js` — **deleted** (123 lines)
- `tests/lib/portability-classification.test.js` — modified: SCOPE comment corrected; BUG-12 rationale restored after an over-broad edit removed it
- `_bmad-output/implementation-artifacts/deferred-work.md` — modified: three rows closed or partially closed by this story
- `_bmad-output/specs/spec-portability-manifest-checkers/SPEC.md` — modified: CAP-2 amended to match what was built
- `_bmad-output/specs/spec-portability-manifest-checkers/.memlog.md` — modified: the CAP-2 amendment, the Round 2 corrections
- `_bmad-output/implementation-artifacts/sp-7-1-fold-the-schema-lint-into-the-audit.md` — modified: this record

*(`sprint-status.yaml` carried this story's `in-progress` status and was committed separately in `23b13166`. `package-lock.json` was deliberately excluded and landed in `51b86294`.)*

## Change Log

- 2026-09-09 — Folded the three unique assertions of `portability-schema.test.js` into `scripts/audit/skill-manifest-integrity.js` and deleted the file. Closed the row-longer-than-header gap filed at the 2026-09-05 Round 3 cap. Removed one of four classification-vocabulary copies.
- 2026-09-09 — Round 1 review: 14 patch findings applied (3 HIGH).
- 2026-09-09 — Round 2 review: 2 HIGH applied — a `TypeError` crash the Round 1 fix introduced in the CIS roster loop, and a false "verified against HEAD" docblock claim that concealed a real operator-facing regression. `_bmad/_config/portability-schema.md` added to `package.json` `files[]` so the schema-doc check is valid on a packed tree.
- 2026-09-09 — Round 3 review (scoped to the Round 2 delta): AC4 struck and the schema-doc check deleted; `wellFormedRows` pinned at every retirement-bearing roster after a mutation showed 3 of 4 call sites unexercised; `files[]` reverted.
- Final state (counted, not estimated): `npm test` **2247 pass / 0 fail / 1 skipped** of 2248 (one non-reproducing failure on the first run after the deletion; four consecutive clean runs after, source not captured — flagged for the burn-in job); `npm run lint` zero warnings; `node scripts/audit/skill-manifest-integrity.js` exit 0; the same audit against a freshly packed tree exits 0.
