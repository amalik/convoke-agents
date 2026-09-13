# Story 1.7: Wire the gate and file what this epic will not fix

Status: ready-for-dev

## Story

As the operator tagging 4.0.2,
I want the release to stop if the derivation pass did not cover what it claimed to cover,
so that a dropped story cannot pass as a completed pass.

## Acceptance Criteria

> ### Start here — this story is unlike 1.1-1.6
>
> **It ships code.** The first six stories edited prose. This one adds a check script, a test, a
> checklist step and two backlog rows. `lint-passes-before-review` is real here, and NFR5 means the gate
> must be **shown refusing something** before it ships.
>
> **AC1 carries a design the epic left open**, with the numbers already derived. Read it before writing
> any code — a `docs/`-only derivation cannot produce the set this gate must cover, and reusing
> `USER_FACING_DOCS` is wrong in both directions.
>
> **The gate asserts coverage, never correctness.** It reads whether a derivation pass was *recorded*
> over the in-scope set. It cannot and must not claim the documentation is accurate.

**AC1 — the denominator is derived, and the derivation is NOT `docs/` alone.**

**Given** the findings note's coverage table, which carries **15** rows
**When** the in-scope set is derived
**Then** it is derived from the filesystem minus a **declared exclusion list**, and it must reproduce exactly those 15 rows

⚠ **Three facts settle the design. All are derived; re-derive before coding.**

1. **The 15 rows span three locations**, not one: **8** under `docs/`, **5** at the repository root
   (`README.md`, `UPDATE-GUIDE.md`, `SECURITY.md`, `CREDITS.md`, `CODE_OF_CONDUCT.md`), and **2** under
   `_bmad/bme/_vortex/`. The epic's framing ("documents under `docs/`") covers 8 of 15.
2. **`USER_FACING_DOCS` cannot be the denominator.** It holds 17 entries; **9 are not in the coverage
   table** (`INSTALLATION.md`, `CHANGELOG.md`, the 7 Vortex user guides) and **7 coverage rows are not
   in it**. Neither set contains the other. Reuse is wrong in both directions.
3. **`docs/*.md` + root `*.md` yields 26 candidates, of which 13 are in scope** — so a **13-entry
   exclusion list** produces the `docs/` and root portions exactly.

**Then** the derivation is: **glob** `docs/*.md` and root `*.md`, minus the declared exclusion list, **plus
an explicit two-entry inclusion list** for `_bmad/bme/_vortex/guides/VORTEX-TEAM-GUIDE.md` and
`_bmad/bme/_vortex/compass-routing-reference.md`
**And** ⚠ **the module docs are an inclusion list, not a glob, and the reason is recorded in the source** —
globbing `_bmad/bme/_vortex/**/*.md` pulls in ~20 contract and per-agent guide files that were never in
this epic's scope. **This resolves the epic's open item** (*"Story 1.7 must either widen that derivation
or record why module documentation is out of the coverage gate"*): it is widened, by enumeration, and the
enumeration's cost is that a future module doc must be added by hand — which is the trade the glob-plus-
exclusion approach makes in the other direction for `docs/`.
**And** the exclusion list entries each carry a one-line reason in the source, because an unexplained
exclusion is how a file silently leaves scope.

**AC2 — the gate refuses, and is shown refusing.**

**Given** the check
**When** it compares the derived in-scope set against the examined set read from the coverage table
**Then** it exits **non-zero** on any file that is in scope and not examined, **naming the file and the
story that owns it** (the table's `Story` column)
**And** it exits **0** against the real table today, since all 15 rows read `Examined: yes`

**And** ⚠ **two demonstrations are required, and both are executions, not assertions:**

| # | Demonstration | What it proves |
|---|---|---|
| **D-a** | Flip one in-scope row to `Examined: no` **on a copy**, run the check | It refuses, and names that file |
| **D-b** | Add a scratch document under `docs/`, not in the exclusion list, run the check | It reports the new file unexamined **without anyone adding a row by hand** — the denominator is derived, not maintained |

**And** both are recorded in the commit Description per NFR5. ⚠ **A gate that has never refused anything
is not evidence** — `cli-guidance-check` shipped twice matching nothing because this step was skipped.
**And** ⚠ **never mutate the real coverage table to demonstrate D-a.** Work on a copy, or point the check
at a fixture path. A review round in this epic lost a fix to a mutation harness that restored the wrong
state.

**AC3 — the checklist step says what it asserts, and what it does not.**

**Given** the step is added to `docs/pre-tag-release-checklist.md`
**When** its text is written
**Then** it states that it asserts **a derivation pass was recorded over the full in-scope set**, and
states **explicitly that it does not assert the documentation is correct**
**And** ⚠ **it introduces no job count** — that file's §3 already carries its own note on counts rotting
into false halts, and names an earlier draft that said "expect 11 successes"
**And** ⚠ **the existing seven sections keep their numbers** (`## 1.` … `## 7.`, plus the unnumbered
`## If the guard refuses`), because `dist-epic-2` runbooks reference them. Add the step **inside** an
existing section or after §7 without renumbering.

**AC4 — two backlog rows, filed not fixed.**

**Given** the five vision, draft and dated-snapshot documents sitting unlabelled in `docs/`, and the
bibliography question `docs/references.md` raises
**When** the epic closes
**Then** **two** rows are filed:

| Row | Subject |
|---|---|
| **1** | Relocating or labelling the five unlabelled documents — `Convoke-Ecosystem-v0.2-Updated-With-Gyre.md`, `KORE-Method-v0.1-Draft.md`, `codebase-audit-2026-06-27.md`, `lifecycle-expansion-vision.md`, `lifecycle-expansion-references.md`. They sit beside governed documents with nothing marking them as drafts or snapshots |
| **2** | Resolving `docs/references.md`'s external URLs and confirming its "underpins component X" mappings still name components that exist |

**And** row 2 records **why it is not release-gate work**: a derivation-against-source pass is the wrong
instrument for a document whose claims are about academic literature, and executing ~64 external checks
under `external-claims-must-be-executed-or-hedged` is a different cadence
**And** ⚠ **derive the URL count rather than copying the epic's "64"** — `grep -oE 'https?://[^ )"]+' docs/references.md | wc -l` gives occurrences and `| sort -u | wc -l` gives unique, and they differ. State which you mean in the same sentence as the number
**And** each row is inserted **at its sorted position** with the composite score computed first —
**`Score = (R × I × C) / E`**, `C` as a percentage (verify against existing rows: `R=6, I=3, C=85%, E=2` → `7.65`)
**And** `node scripts/audit/backlog-integrity.js` exits **0** before the commit plan is emitted
**And** ⚠ **the backlog working tree is confirmed clean BEFORE the IDs are allocated**, and the highest
existing ID is read from the **working tree**, not from memory or a commit — `feedback_backlog_id_allocation`.
The highest at authoring time was **`T160`**; re-derive it, do not assume the next two.

**AC5 — the gate is the last thing to land.**

**Given** every in-scope file is examined
**When** the gate runs against the real coverage table
**Then** it exits 0, and this is the last story in the epic.

**AC6 — no claim introduced that nothing can contradict.**

**Given** every line this story writes
**When** the diff is reviewed
**Then** each retained claim names the object that could contradict it; no count is introduced that no
object owns
**And** ⚠ **every command written into a document is RUN, to completion, from the directory its reader
will be standing in.** Story 1.5 shipped a command that throws; Story 1.6 documented `npm run check`,
which can never pass, and a `cut -d,` that returns noise. All three were caught only by execution.

## Tasks / Subtasks

- [ ] **Task 1 — Derive the denominator and confirm it reproduces 15 (AC: 1)**
  - [ ] Re-derive the coverage table's rows and the three location groups; do not take the numbers from this story
  - [ ] Build the exclusion list (13 at authoring time) with a one-line reason per entry, and the two-entry module inclusion list
  - [ ] Assert the derived set equals the table's row set, both directions
- [ ] **Task 2 — Write the check (AC: 1, 2)**
  - [ ] `scripts/audit/` alongside `backlog-integrity.js` and `skill-manifest-integrity.js`; follow their exit-code and reporting shape
  - [ ] Parse the coverage table; compare; on failure name **the file and its owning story**
  - [ ] Never use `process.cwd()` — `findProjectRoot()` or an injected root (`no-process-cwd-in-libs`)
- [ ] **Task 3 — RED first, then green (AC: 2)**
  - [ ] Write the failing test before the implementation; `tests/audit/` runs under `npm test`
  - [ ] Cover: a missing `Examined`, an in-scope file with no row, an excluded file that must NOT appear, and a module-inclusion file
- [ ] **Task 4 — The two demonstrations (AC: 2)**
  - [ ] **D-a** flipped row, on a copy or fixture — never the real table
  - [ ] **D-b** scratch document under `docs/`, run, then remove it; confirm the tree is clean afterwards
  - [ ] Capture both for the commit Description
- [ ] **Task 5 — Checklist step (AC: 3)**
  - [ ] Asserts *recorded*, not *correct*; no job count; existing seven section numbers untouched
- [ ] **Task 6 — Two backlog rows (AC: 4)**
  - [ ] Confirm the backlog tree is clean, re-derive the highest ID, compute both scores, insert at sorted position
  - [ ] `node scripts/audit/backlog-integrity.js` → 0
- [ ] **Task 7 — Coverage table and findings note (DoD)**
  - [ ] This story examines no prose file, so it adds no coverage row. Record that explicitly rather than leaving it ambiguous
- [ ] **Task 8 — Verify and hand off**
  - [ ] `npm run lint` → 0 · `npm test` → 0 · `node scripts/audit/backlog-integrity.js` → 0 · `npm run docs:audit` → 0
  - [ ] Capture exit codes **without a pipe** — `${PIPESTATUS[0]}` is bash, this shell is zsh (`verification-pipefail`)
  - [ ] Run every command written into any document, to completion
  - [ ] Commit plan with a Round 1 review record; `git diff HEAD --name-only` before staging

## Dev Notes

### What six stories of this epic established

- **Independent review beats more rounds, by roughly 10:1.** Self-review found ~2 findings per story;
  three blind layers found 27 and 22. Budget for independence.
- **Every high-severity finding in Rounds 2 and 3 of `docs-1-6` was introduced by the previous round's
  remediation.** Fixes are where defects come from. Re-run the command after fixing.
- **Stop when the record's share of findings approaches the document's.** `docs-1-6` ended by *deleting*
  its round history, tallies and post-pass figures rather than rewriting them a third time. **Do not
  write a findings tally, a round history or a post-pass figure into this story.**
- **A derivation pass changes what it measures.** State the basis with any figure, or omit the figure.
- **Never pre-compute a derived value into an artifact whose reader re-derives it.**
- **A retraction is a first-class outcome** — strike the row, never delete it.

### Files this story creates or modifies

- **NEW** — the check script under `scripts/audit/`, and its test under `tests/audit/`
- **UPDATE** — `docs/pre-tag-release-checklist.md` (one step, no renumbering)
- **UPDATE** — `_bmad-output/planning-artifacts/convoke-note-initiative-lifecycle-backlog.md` (two rows)
- **UPDATE** — `_bmad-output/planning-artifacts/convoke-note-docs-accuracy-findings-4-0-2.md` only if the
  gate's existence needs recording there; this story examines no prose file and adds no coverage row

**Do not touch** `scripts/docs-audit.js`. This gate is a different instrument with a different
denominator — `docs-1-6` ruled that `USER_FACING_DOCS` means *audited for staleness*, never *in the
coverage gate*, and the two sets genuinely differ.

### Testing standards

This story **ships code**, so the story's own gates are real: `lint-passes-before-review`, and a test that
would fail if the check regressed. `tests/audit/` is already in `npm test`'s directory list
(`node -e "console.log(require('./package.json').scripts.test)"`). Follow the existing
`tests/audit/*.test.js` shape — `node:test`, `assert/strict`, fixtures under `tests/audit/fixtures/`.
**NFR5 is satisfied by the two AC2 demonstrations, not by the unit tests** — a passing test proves the
code runs, not that the gate refuses.

### References

- [Source: convoke-epic-docs-accuracy-4-0-2.md#Story-1.7] — ACs and DoD; also the ⚠ note naming the
  denominator as this story's open item
- [Source: convoke-note-docs-accuracy-findings-4-0-2.md] — the coverage table this gate reads
- [Source: `docs/pre-tag-release-checklist.md` §3] — the note on counts rotting into false halts
- [Source: `scripts/audit/backlog-integrity.js`] — lane ordering enforcement; the shape to follow
- [Source: project-context.md] — `no-process-cwd-in-libs`, `verification-pipefail`,
  `verification-must-be-falsifiable`, `commit-preparation`, `code-review-convergence`
- [Source: `feedback_backlog_id_allocation`] — clean tree before allocating; read IDs from the working tree

## Definition of Done

- [ ] `npm run docs:audit` exits 0. **Its passing is a non-regression check, not evidence of accuracy** — the
      epic exists because it passes on defective files, and this story may not cite it as proof any document
      is correct. *(NFR3, verbatim)*
- [ ] Every finding recorded carries a command that reproduces it (NFR1), from an artifact the operator
      receives — never `.claude/skills/` (NFR8).
- [ ] Every claim written or kept obeys the source-of-truth rule (FR3a).
- [ ] The findings note's coverage table is updated in the same commit (FR10) **if this story changes it**;
      if it does not, that is stated rather than left silent.
- [ ] `npm run lint` exits 0 with zero warnings in any file this story modifies.
- [ ] `npm test` green, including the new test.
- [ ] Every check cited as evidence in the Dev Agent Record names how it was shown able to fail (NFR5) —
      satisfied by the **two AC2 demonstrations**, recorded in the commit Description.
- [ ] Commit plan emitted with a Round 1 review record (NFR4); reviewed file set equals staged file set.

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List

## Change Log

| Date | Change |
|------|--------|
| 2026-09-13 | **Story created.** The epic left the gate's denominator as an open item owned by this story; it is resolved in AC1 with the numbers derived rather than asserted. Three facts drove the design: the coverage table's rows span **three** locations (8 `docs/`, 5 repo-root, 2 `_bmad/bme/_vortex/`), so the epic's `docs/`-framing covers 8 of 15; **`USER_FACING_DOCS` cannot be reused** — 9 of its entries are absent from the table and 7 table rows are absent from it, so neither set contains the other; and `docs/*.md` + root `*.md` gives 26 candidates of which 13 are in scope, making a 13-entry exclusion list exact. The module docs are an **explicit two-entry inclusion list** rather than a glob, because `_bmad/bme/_vortex/**/*.md` would pull ~20 never-scoped contract and guide files — the trade is recorded in AC1 rather than left implicit. AC2 requires the gate be **shown refusing**, on a copy, because `cli-guidance-check` shipped twice matching nothing. The RICE formula for AC4 was derived from existing rows (`(R × I × C) / E`, `C` as a percentage) rather than assumed. |
