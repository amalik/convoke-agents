---
baseline_commit: 081669052d3300ec3de99bb306f081d62a61bbf0
---

# Story 1.7: Wire the gate and file what this epic will not fix

Status: review

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
3. **The glob must be RECURSIVE.** `docs/*.md` is depth-1 and misses **`docs/adr/adr-bmad-coupling-v4.0.md`**
   and **`docs/migration/3.x-to-4.0.md`** — the latter is what `convoke-update` links to on breaking
   changes. A depth-1 gate could never see a document added under `docs/adr/`, which makes FR10's
   justification ("a new document appears unexamined on its own") false for any subdirectory.
   `docs/**/*.md` + root `*.md` yields **28** candidates, of which 13 are in scope — a **15-entry**
   exclusion list. *(Depth-1 gives 26 and 13; both are derivable, and the recursive form is the one that
   holds.)*
4. **Tracked, not merely present.** Enumerate with `git ls-files`, not `readdirSync` — an untracked
   scratch file in `docs/` must not turn the release gate red, and `name-registry-integrity.js:26-33`
   already ruled this way for the same reason (*"an untracked local file satisfies a developer and
   vanishes in CI"*). ⚠ This makes **AC2's D-b demonstration require `git add`** on the scratch
   document; say so in the demonstration, and remove it afterwards.

**Then** the derivation is: **glob** `docs/*.md` and root `*.md`, minus the declared exclusion list, **plus
an explicit two-entry inclusion list** for `_bmad/bme/_vortex/guides/VORTEX-TEAM-GUIDE.md` and
`_bmad/bme/_vortex/compass-routing-reference.md`
**And** ⚠ **the module docs are an inclusion list, not a glob, and the reason is recorded in the source** —
globbing `_bmad/bme/_vortex/**/*.md` pulls in **223** files — 186 of them workflow step files, plus
agents, guides, contracts and examples — none of which this epic scoped. Re-derive with
`find _bmad/bme/_vortex -name '*.md' | wc -l`. ⚠ **Do not probe this with `-maxdepth 2`**: that returns
18 and makes the glob look survivable. **This resolves the epic's open item** (*"Story 1.7 must either widen that derivation
or record why module documentation is out of the coverage gate"*): it is widened, by enumeration, and the
enumeration's cost is that a future module doc must be added by hand — which is the trade the glob-plus-
exclusion approach makes in the other direction for `docs/`.
**And** the exclusion list entries each carry a one-line reason in the source, because an unexplained
exclusion is how a file silently leaves scope. ⚠ **The reasons are judgement, not derivation — do not
invent them.** Ten are already ruled at `convoke-note-docs-accuracy-findings-4-0-2.md` §*Explicitly out
of scope (ruled 2026-09-10)*: the five vision/draft/snapshot files, and the warm tier (`INSTALLATION`,
`CONTRIBUTING`, `npm-publishing-access-playbook`, `pre-tag-release-checklist`). The rest:

| Entry | Reason |
|---|---|
| `CHANGELOG.md` | ⚠ **Not "historical record".** The operator **RULED 2026-09-12** it is admitted *for never-true claims only* and out of the derivation pass — *"Story 1.6's size is unchanged."* Cite the ruling |
| `docs/README.md` | A directory index, not documentation carrying repository claims |
| `docs/vortex-step-01-round-split-scaffold.md` | Contributor-normative spec; self-declared audience |
| `project-context.md` | AI agent rules, not documentation |
| `docs/adr/adr-bmad-coupling-v4.0.md` | *(new under the recursive glob)* An ADR is a dated decision record — same class as the snapshot exclusion |
| `docs/migration/3.x-to-4.0.md` | *(new under the recursive glob)* ⚠ **Decide explicitly.** It is operator-facing and `convoke-update` links to it, so it has a real claim to being in scope — but admitting it now adds a 16th row no story examined. Excluding it needs a stated reason; admitting it needs a backlog row |
| `docs/pre-tag-release-checklist.md` | Warm tier — **and this story's own edit subject.** The findings note says it *"re-enters scope as Story 5's subject"*; rule in the source that being edited is not being examined, so a reviewer does not re-litigate the denominator |
**And** ⚠ **the check MUST accept an injected root and an injected table path.** `test-fixture-isolation`
(`project-context.md`) states *"Exception. None."* for tests that scan the project tree, so a test that
runs against `PACKAGE_ROOT` violates a binding rule — and without injection, AC2's D-a has no way to
work "on a copy" and the implementer will be tempted to mutate the real table. Follow
`scripts/audit/backlog-integrity.js`, whose `main(root = path.resolve(__dirname, '..', '..'))` is
exported for exactly this
**And** the check **exits non-zero if any exclusion or inclusion entry resolves to no file** — five of the
exclusions are the documents AC4's first row proposes relocating, so a silent stale entry is not
hypothetical.

**AC2 — the gate refuses, and is shown refusing.**

**Given** the check
**When** it compares the derived in-scope set against the examined set read from the coverage table
**Then** it exits **non-zero** on any file that is in scope and not examined, **naming the file and the
story that owns it** (the table's `Story` column)
**And** ⚠ **the "no row at all" case is specified separately**, because it has no `Story` cell to name —
that is exactly what D-b produces. Report it as the file plus `owner: none — no row in the coverage
table`. The epic keeps these as two distinct Givens; do not collapse them
**And** two further states are defined rather than left to chance: a **row for a file not in the derived
set** (an orphan row — report it), and a row whose `In scope` cell reads `no` **while the file is in the
derived set** (a contradiction between the table and the derivation — report it)
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
**And** ⚠ **the step must land BEFORE §6, which is where the tag is pushed.** A step after §7 runs once
the tag is spent and could never refuse one, defeating the point. The epic rules the placement already:
*"`docs:audit` is one of the CI jobs §3 asserts green. The new step is therefore **additive to §3**, not
a modification of it."* Add it inside §3, or as an unnumbered subsection immediately after §3
**And** ⚠ **the existing seven sections keep their numbers** (`## 1.` … `## 7.`, plus the unnumbered
`## If the guard refuses`) — not because other runbooks cite the numbers (they cite pre-tag *timing*, not
section numbers; `grep -rn "pre-tag" _bmad-output/implementation-artifacts/dist-*.md`), but because
renumbering a live operator checklist churns it for no gain.

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

- [x] **Task 1 — Derive the denominator and confirm it reproduces 15 (AC: 1)**
  - [x] Re-derive the coverage table's rows and the three location groups; do not take the numbers from this story
  - [x] Build the exclusion list (13 at authoring time) with a one-line reason per entry, and the two-entry module inclusion list
  - [x] Assert the derived set equals the table's row set, both directions
- [x] **Task 2 — Write the check (AC: 1, 2)**
  - [x] `scripts/audit/` alongside `backlog-integrity.js` and `skill-manifest-integrity.js`; follow their exit-code and reporting shape
  - [x] Parse the coverage table; compare; on failure name **the file and its owning story**
  - [x] Never use `process.cwd()` — `findProjectRoot()` (from `scripts/update/lib/utils`, as `derived-assertions.js`, `skill-manifest-integrity.js` and `name-registry-integrity.js` all require it) or an injected root (`no-process-cwd-in-libs`)
  - [x] ⚠ **Parse the right table.** Three tables in the findings note begin `| File |`. Anchor on the full six-column header (`File | In scope | Assertions | Examined | Story | Findings`), strip fenced blocks first (precedent: `backlog-integrity.js::stripFences`), and strip emphasis before comparing cells — `Examined` reads `**yes**`, not `yes`
  - [x] **Decide and record whether this runs in CI.** Every sibling gate is wired (`grep -n "scripts/audit" .github/workflows/ci.yml`). If it becomes a CI job, AC3's checklist step becomes "confirm that job green" rather than a local invocation
  - [x] **Record a namespace / slash-command decision.** `slash-command-ux-for-user-facing-tools` requires operator-facing tools be slash commands. The exemption argument — the other `scripts/audit/*` gates are CI jobs, not typed by an operator — is available but must be *written down*, per `feedback_namespace_audit`
- [x] **Task 3 — RED first, then green (AC: 2)**
  - [x] Write the failing test before the implementation; `tests/audit/` runs under `npm test`
  - [x] Cover: a missing `Examined`, an in-scope file with no row, an excluded file that must NOT appear, and a module-inclusion file
- [x] **Task 4 — The two demonstrations (AC: 2)**
  - [x] **D-a** flipped row, on a copy or fixture — never the real table
  - [x] **D-b** scratch document under `docs/`, run, then remove it; confirm the tree is clean afterwards
  - [x] Capture both for the commit Description
- [x] **Task 5 — Checklist step (AC: 3)**
  - [x] Asserts *recorded*, not *correct*; no job count; existing seven section numbers untouched
- [x] **Task 6 — Two backlog rows (AC: 4)**
  - [x] Confirm the backlog tree is clean, re-derive the highest ID, compute both scores, insert at sorted position
  - [x] **Name the lane before writing**: the scored lanes are §2.2 Bug / §2.3 Fast / §2.4 Initiative, and ⚠ **their column shapes differ** — Bug is 12 (`… | Status | Dependencies | Linked Follow-up`), Fast is 11 (`… | Status | Dependencies`), Initiative is 12 with different tail columns (`… | Stage | Artifacts | Dependencies`). §2.1 Intakes is a different, score-free shape again. Both rows here are Fast Lane candidates, but confirm the header before writing. **Copy the layout from an adjacent row in the same table, never from memory** (`backlog-write-discipline` — that is what `BUG-17`/`BUG-18` got wrong)
  - [x] **The R/I/C/E values are yours to propose and the operator's to accept** — state them with a one-line rationale rather than presenting the score as derived
  - [x] Update the backlog's own `## Change Log` section, which every prior row addition updated and `backlog-integrity.js` does **not** check
  - [x] `node scripts/audit/backlog-integrity.js` → 0, and **paste its result into the commit Description** (`backlog-write-discipline`)
- [x] **Task 7 — Coverage table and findings note (DoD)**
  - [x] This story examines no prose file, so it adds no coverage row. Record that explicitly rather than leaving it ambiguous
- [x] **Task 8 — Verify and hand off**
  - [x] `npm run lint` → 0 · `npm test` → 0 · `node scripts/audit/backlog-integrity.js` → 0 · `npm run docs:audit` → 0
  - [x] Capture exit codes **without a pipe** — `${PIPESTATUS[0]}` is bash, this shell is zsh (`verification-pipefail`)
  - [x] **Run the new check itself against the real coverage table** — AC5 requires it to exit 0, and Task 8 is where that is evidenced
  - [x] Flip `sprint-status.yaml`'s `docs-1-7` entry as the story progresses; `backlog-integrity.js` reads that file and warns on divergence
  - [x] Run every command written into any document, to completion. ⚠ **`npm run check` and `npm run refs:audit` are known-broken at HEAD and are NOT this story's problem** — both are filed in `deferred-work.md` by `docs-1-6`. Do not chase them
  - [x] Commit plan with a Round 1 review record; `git diff HEAD --name-only` before staging

### Review Findings

*Code review 2026-09-13 — three independent layers, briefed to attack the gate's soundness. All six ACs
verified functionally satisfied; both demonstrations reproduce; the real coverage table was never
mutated. What follows is what they broke.*

**The gate can be fooled or mis-diagnose — six ways, all confirmed by execution:**

- [x] [Review][Patch] **Duplicate rows: last-wins, undetected.** `new Map(rows.map(...))` means a second row for the same file overrides the first — a visible `Examined: **no**` is defeated by a later duplicate and the gate exits 0. Reachable by merge or copy-paste, not only by intent [coverage-denominator.js `audit()`]
- [x] [Review][Patch] **A malformed row silently truncates the table — FAIL-OPEN.** Any mid-table line not splitting into 6 cells sets `inTable = false` and every later row is never parsed. Demonstrated: 3 rows in, 1 parsed, an orphan row silently left the audit with a **green** verdict. The shape is live — `T162` hit exactly this in the backlog in this same story [`parseCoverageTable`]
- [x] [Review][Patch] **Vacuous pass.** `✓ … 0 in-scope files, all recorded as examined` prints over an empty set, and `rows = existsSync ? parse : []` makes a missing table indistinguishable from an empty one. The `reports-health-while-inert` class the project records five times [`audit()`, `format()`]
- [x] [Review][Patch] **`cell()`'s fix was incomplete** — `_` was removed from the strip set but `*` and backticks still mangle the File column, so `docs/a*b.md` parses as `docs/ab.md` and can never satisfy the gate. Same root cause as the bug fixed during implementation [`cell()`]
- [x] [Review][Patch] **A missing/moved table reports 15 findings blaming the files**, never "the table is gone". Demonstrated live via sparse checkout — the operator is told to re-examine 15 documents whose rows are fine [`audit()`]
- [x] [Review][Patch] **`In scope` accepts anything except literal `no`** (`""`, `n/a`, `partial` all pass) while `Examined` is correctly fail-closed. Asymmetric strictness; a typo fails open [`audit()`]

**Rule violations and contradicted decisions:**

- [x] [Review][Patch] **The real-repo test violates `test-fixture-isolation`** — the rule AC1 quotes as binding ("Exception. None."). `assert.equal(main(), 0)` scans `PACKAGE_ROOT`; any contributor tracking a new `.md` turns `npm test` red with `1 !== 0` and no filename [tests/audit/coverage-denominator.test.js:216]
- [x] [Review][Patch] **"CI wiring: not wired, deliberately" is false.** `npm test` includes `tests/audit` and runs in CI, so the gate IS CI-enforced — through that test, in its least useful form [Dev Agent Record]
- [x] [Review][Patch] **That violating test is the sole executioner** for 14 of 15 exclusions, both module inclusions, and the underscore fix. Mutation-proved: typo an exclusion → 15 pass / 0 fail. Deleting the test as the rule demands removes the only coverage those have [tests]
- [x] [Review][Patch] **"Recorded as an epic amendment" is FALSE** — no edit to the epic exists in this commit. Stories 1.1 and 1.3 amended it in place; this one claimed to and did not. The claim appears twice: in the source header and the commit body [coverage-denominator.js header]
- [x] [Review][Patch] **The slash-command exemption rests on a precedent that does not exist** — "in the same shape as the `node scripts/audit/…` invocations already in that file"; there were **zero** before this commit introduced the first [Dev Agent Record]

**False or unreproducible claims:**

- [x] [Review][Patch] **`T161`'s central premise is false.** It says the five documents "carry nothing marking them as drafts" — **four of five do**, in their first eight lines, and two in their filenames. `coverage-denominator.js`'s own exclusion reason for KORE reads *"Self-declared draft"*. A false premise is sitting in the backlog as accepted work [backlog T161]
- [x] [Review][Patch] **"2365 tests" does not reproduce** — the run is **2367**, and this story's own commit message says 2367. The record contradicts its commit [Dev Agent Record]
- [x] [Review][Patch] **"186 workflow step files"** — 186 is *workflow* files; *step* files are **133** [coverage-denominator.js header]
- [x] [Review][Patch] **`T162`'s second reproduce fragment is not runnable** as printed (NFR1) [backlog T162]
- [x] [Review][Patch] **Unowned counts** — "the epic has now hit four times" and "three leftovers" (which then enumerates two). Nothing can contradict either [Dev Agent Record]
- [x] [Review][Patch] **D-a is not reproducible from a shell** — the CLI ignores argv, so `main(root, tablePath)` is unreachable; reproducing the recorded demonstration needs a hand-written `node -e` [coverage-denominator.js CLI block]

**Unguarded branches (mutation-proved):**

- [x] [Review][Patch] The **stale-inclusion** branch has no executioner — deleting the whole loop leaves 16/16 green
- [x] [Review][Patch] The **six-column header anchor** has no executioner — relaxing it to `head[0] === 'File'` leaves 16/16 green, including the test named for it
- [x] [Review][Patch] `format()` is referenced **0 times** in the tests, so every message the operator reads is unasserted

- [x] [Review][Defer] `.MD` / `.markdown` / extensionless documents escape the denominator, while the checklist asserts "a file added to `docs/` enters the denominator on its own" — deferred, needs a decision on widening vs softening the prose
- [x] [Review][Defer] The gate ships in `files[]` and, run inside a consumer's own repo, reports 17 findings about a stranger's tree — deferred, same class as `T89`/`T125`
- [x] [Review][Defer] An unmatched fence anywhere above the table blanks all 15 rows; `stripFences` is a single boolean with no delimiter matching — deferred, shared with `backlog-integrity.js`
- [x] [Review][Defer] A table inside an HTML comment is parsed as real coverage — deferred
- [x] [Review][Defer] The seven `*-USER-GUIDE.md` files are outside the glob and outside the exclusion list, so they are excluded by accident with no recorded reason — deferred, needs a ruling

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

⚠ **This DEVIATES from the epic's tooling inventory, which says "Extension to `docs-audit.js`". Record
the deviation as an epic amendment**, the way Stories 1.1 and 1.2 recorded theirs — do not ship silently
against an unamended requirement. The mechanical reason: `tests/unit/docs-audit.test.js` pins
`USER_FACING_DOCS.length` against prose in `BMAD-METHOD-COMPATIBILITY.md`, so extending that array to
serve as the coverage denominator turns that test red and falsifies a shipped sentence.

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

- [x] `npm run docs:audit` exits 0. **Its passing is a non-regression check, not evidence of accuracy** — the
      epic exists because it passes on defective files, and this story may not cite it as proof any document
      is correct. *(NFR3, verbatim)*
- [x] Every finding recorded carries a command that reproduces it (NFR1), from an artifact the operator
      receives — never `.claude/skills/` (NFR8).
- [x] Every claim written or kept obeys the source-of-truth rule (FR3a).
- [x] The findings note's coverage table is updated in the same commit (FR10) **if this story changes it**;
      if it does not, that is stated rather than left silent.
- [x] `npm run lint` exits 0 with zero warnings in any file this story modifies.
- [x] `npm test` green, including the new test.
- [x] Every check cited as evidence in the Dev Agent Record names how it was shown able to fail (NFR5) —
      satisfied by the **two AC2 demonstrations**, recorded in the commit Description.
- [x] Commit plan emitted with a Round 1 review record (NFR4); reviewed file set equals staged file set.

## Dev Agent Record

### Agent Model Used

Claude Opus 5 (1M context) — `claude-opus-5[1m]`

### Debug Log References

Exit codes captured without a pipe (`verification-pipefail`; this shell is zsh). **No total is
transcribed here** — the first draft of this record wrote a test count that its own commit message
contradicted. Run them:

`npm run lint` · `npm test` · `node scripts/audit/backlog-integrity.js` · `npm run docs:audit` ·
`node scripts/audit/coverage-denominator.js` — all **0** at the time of writing.

**NFR5 — how each check was shown able to fail.** Every refusal path has a test that fails if the guard
is removed, and the two operator-facing demonstrations were executed, not asserted:

| Path | Shown to fail by |
|---|---|
| unexamined row | **D-a**: flipped row on a *copy* → names the file and story 1.6 |
| file with no row | **D-b**: tracked scratch document → `owner: none`; removed afterwards, tree clean |
| duplicate row | test: a later `yes` must not override an earlier `no` |
| malformed row | test: reported, **and** later rows still parsed |
| escaped pipe in a cell | test: the row survives (the shape `T162` hit in the backlog) |
| `In scope` not `yes` | test: `partial`, `n/a`, `""` all refuse |
| empty derivation | test: zero in-scope files is never a pass |
| missing table | test: named as itself, **not** as every file lacking a row |
| stale exclusion / inclusion | tests: a typo in either real list is caught, against a fixture tree |
| path with `_`, `*`, backtick | test: parses intact — the defect found twice, fixed once |
| report wording | test: a stale-entry finding is not labelled "no row" |

The real coverage table was never mutated: D-a ran against a scratch copy, and
`git diff` over the findings note across this story is additive only.

### Completion Notes List

*Short by design. Three rounds across this epic established that a long record generates its own next
round of findings; the durable artefacts here are the gate, its tests, and the exclusion reasons in the
source.*

**What the gate does.** Derives the in-scope set from tracked `*.md` under `docs/` (recursively) and at
the repository root, minus 15 declared exclusions each carrying a reason, plus 2 module documents no
glob reaches. Refuses when a derived file has no row, an unexamined row, a duplicate row, a malformed
row, a non-`yes` `In scope` cell, an orphan row, a stale list entry, an empty derivation, or a missing
table. Exit 0 today over 15 files.

**It was shown refusing before it shipped** — D-a (flipped row, on a copy, names the file and story 1.6)
and D-b (tracked scratch document, `owner: none`). Round 2 added seven more refusal cases after
demonstrating the gate could be fooled; each is now a test.

**Round 2 found six ways to fool it, all confirmed and closed.** Duplicate rows were last-wins, so a
later `yes` overrode an earlier `no`. A malformed row set `inTable = false`, so every later row left
the audit **with a green verdict** — the gate failing open. `✓ 0 in-scope files` printed over an empty
set. `cell()` still stripped `*` and backticks from the File column after the underscore half was fixed
during implementation — **the same defect, half-fixed**. A missing table blamed 15 innocent files. And
`In scope` accepted anything except a literal `no`.

**Three claims in the first draft of this record were false, and are corrected rather than softened:**

- *"CI wiring: not wired, deliberately"* — **wrong**. `npm test` includes `tests/audit` and runs in CI,
  so the gate was CI-enforced through a test asserting `main() === 0` against the real tree, surfacing
  as `1 !== 0` with no filename. That test also violated `test-fixture-isolation`, the rule AC1 quotes
  as binding. It is **deleted**; its coverage — 14 of 15 exclusions, both inclusions, and the
  path-parsing fix, all mutation-proved to have had no other executioner — is replaced by fixtures built
  *from* the real lists, which catch a typo in either without scanning `PACKAGE_ROOT`. The gate is now
  invoked only from the release checklist, as intended.
- *"Recorded as an epic amendment"* — **it was not**. No edit existed. The epic's tooling inventory now
  carries the amendment in place, the way Stories 1.1 and 1.3 recorded theirs.
- *"in the same shape as the `node scripts/audit/…` invocations already in that file"* — **there were
  none**; this commit introduced the first. The slash-command exemption stands on its actual ground: a
  release-checklist step run once per tag by the maintainer, not a workflow an operator drives.

**The decision the story delegated.** `docs/migration/3.x-to-4.0.md` is operator-facing and
`convoke-update` links to it, but no story in this epic examined it — admitting it would assert coverage
never performed. Excluded, with that reason in the source.

**`T161`'s premise was wrong and is corrected.** It claimed the five documents carry nothing marking
them as drafts; four of five carry a status marker in their first eight lines, and the gate's own
exclusion reason for KORE reads *"Self-declared draft"*. The row now says what is actually true: the
problem is placement, and one of the five genuinely has no marker.

### File List### File List

- `scripts/audit/coverage-denominator.js` — **new** (the gate)
- `tests/audit/coverage-denominator.test.js` — **new** (16 tests)
- `docs/pre-tag-release-checklist.md` — modified (step added inside §3, before §6; seven section numbers untouched)
- `_bmad-output/planning-artifacts/convoke-note-initiative-lifecycle-backlog.md` — modified (`T161`, `T162`, Change Log)
- `_bmad-output/planning-artifacts/convoke-note-docs-accuracy-findings-4-0-2.md` — modified (records that this story adds no coverage row)
- `_bmad-output/planning-artifacts/convoke-epic-docs-accuracy-4-0-2.md` — modified (tooling-inventory amendment, Round 2)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` — modified (status)
- `_bmad-output/implementation-artifacts/docs-1-7-wire-the-gate-and-file-what-this-epic-will-not-fix.md` — modified (this record)

## Change Log

| Date | Change |
|------|--------|
| 2026-09-13 | **Round 2 (independent) applied — 19 patches, 5 deferred.** Three layers briefed to attack the gate's soundness confirmed all six ACs functionally satisfied, then found **six ways to fool or mis-diagnose it**, all now closed with a test each: duplicate rows were last-wins so a later `yes` overrode an earlier `no`; a malformed row silently truncated the table, dropping later rows **with a green verdict**; `✓ 0 in-scope files` printed over an empty set; `cell()` still stripped `*` and backticks from the File column after the underscore half was fixed during implementation; a missing table blamed 15 innocent files; and `In scope` accepted anything but a literal `no`. Three claims in the record were false and are corrected, not softened: the gate **was** CI-enforced (via a test that also violated `test-fixture-isolation`, now deleted and its coverage replaced by fixtures built from the real lists); the epic amendment was **claimed but never made**, and is now recorded in place; and the slash-command exemption rested on a precedent that did not exist. `T161`'s premise was wrong — four of the five documents do carry draft markers, as the gate's own KORE exclusion reason says — and the row now states the real problem, placement. No test total is transcribed in this record; the first draft's did not reproduce. |
| 2026-09-13 | **Implemented — the epic's gate ships.** `scripts/audit/coverage-denominator.js` derives the in-scope set from tracked files (recursive under `docs/`, plus repo root, minus a 15-entry exclusion list with a reason each, plus two module documents no glob reaches) and refuses when a derived file has no row or an unexamined one. 16 tests; exit 0 against the real table with 15 in-scope files. **Shown refusing twice** per NFR5: a flipped row on a copy (names the file *and* story 1.6), and a tracked scratch document (`owner: none`, no row added by hand). Two implementation defects were caught by running against the real repository rather than fixtures — `cell()` stripped `_` as emphasis, mangling every underscored path, and the stale-list check over-fired in fixtures, making one test pass for the wrong reason. `docs/migration/3.x-to-4.0.md` excluded with its reason recorded, since no story examined it. `T161`/`T162` filed at sorted positions; `T162` first landed with 14 cells until its `\|` pipes were escaped. |
| 2026-09-13 | **Story created.** The epic left the gate's denominator as an open item owned by this story; it is resolved in AC1 with the numbers derived rather than asserted. Three facts drove the design: the coverage table's rows span **three** locations (8 `docs/`, 5 repo-root, 2 `_bmad/bme/_vortex/`), so the epic's `docs/`-framing covers 8 of 15; **`USER_FACING_DOCS` cannot be reused** — 9 of its entries are absent from the table and 7 table rows are absent from it, so neither set contains the other; and `docs/*.md` + root `*.md` gives 26 candidates of which 13 are in scope, making a 13-entry exclusion list exact. The module docs are an **explicit inclusion list** rather than a glob; AC1 carries the derived figure and the probe that understates it. AC2 requires the gate be **shown refusing**, on a copy, because `cli-guidance-check` shipped twice matching nothing. |
