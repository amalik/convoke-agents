---
baseline_commit: 22903751
---

# Story 1.4: Calibrate the derivation pass on the user-path documents

Status: ready-for-dev

## Story

As the operator deciding whether this epic fits before the tag,
I want a yield rate measured against something that actually predicts it,
so that the scope call on the remaining files is mine and is informed.

## Acceptance Criteria

> ## This story is different from 1.1–1.3, in two ways that change how it must be done
>
> **1. It builds an instrument, and the instrument outlives it.** The counting script is run
> *identically* by Stories 1.5 and 1.6. A pattern that quietly matches nothing here makes every
> downstream story look cheaper. That is why AC1 demands a fixture demonstration before the count is
> trusted — a measurement that cannot be shown to fire is not a measurement.
>
> **2. The epic's numbers are inputs, not truth.** `37` and `20` were measured **2026-09-10, before
> these stories were cut**, by the method FR4a replaced. The findings note says so itself: *"Story 1.4
> re-derives with the pinned script and reports divergence."* **Do not tune patterns until they
> reproduce the estimate — that inverts the test.**
>
> **No counts are stated in this story on purpose.** Three prior stories in this epic each failed by
> pre-computing derived values into prose. If a number appears below that you did not derive,
> distrust it.

**AC1 — one committed script, a pattern set that is pinned *and defined*, demonstrated able to fire.**

**Given** no assertion counter exists in the repository today
**When** one is written
**Then** it is a **single committed script** with a pinned pattern set, runnable identically by Stories 1.4, 1.5 and 1.6 — never a per-story grep and never a judgement call
**And** it counts the four kinds the findings note's breakdown table uses, **each with an operational definition, because naming a kind is not specifying one**:

| Kind | Counts | Does not count |
|---|---|---|
| **Command** | An invocation the reader is told to run: `npm …`, `npx …`, `node …`, `git …`, a `convoke-*` binary, or a `/bmad-*` slash command | Prose mentioning a tool by name without an invocation |
| **Path** | A repository path the reader is pointed at, in backticks or in a link target | A bare word that happens to contain a slash; a URL |
| **Count** | A number asserted about this repository — agents, workflows, files, steps | Version numbers (their own kind); numbers in example output |
| **Version claim** | A version asserted about this package, a module, or a dependency | A semver range inside an illustrative snippet the reader is not asked to believe |

**And** — **RULED, because the epic leaves it open and the answer changes the number:** **fenced code blocks ARE counted.** A command inside a ```` ```bash ```` block is a command the reader runs; excluding it would count the prose *about* the instruction and not the instruction. Measured at `22903751`, `UPDATE-GUIDE.md`'s commands sit overwhelmingly **inside** fences while `docs/faq.md` has **no fences at all** — so this ruling is invisible on one file and decisive on the other, and would silently propagate to 1.5 and 1.6 if left unmade. `FENCE_RE` is reused only to avoid counting fence **delimiters**, never to exclude fence **bodies**.
**And** it is **demonstrated on a fixture containing a known assertion of each kind** — a kind firing zero times on the fixture is a broken pattern and must fail loudly, not report a count
**And** the fixture lives in `tests/audit/` and the script's logic is tested there (`test-fixture-isolation`); the script itself reads the live tree.

**AC2 — the count is the script's, and it is checked by hand-derivation, not by re-running.**

**Given** that an undercount makes this story smaller and every downstream story look cheaper
**When** the count is recorded
**Then** it is the script's output, pasted verbatim with its command — **not the implementer's reading**
**And** the check on it is **hand-derivation of a named sample window**: the reviewer picks one ~20-line window in each file, enumerates its assertions by hand, and compares to the script's output for that window. **A script undercount inside the window is a HIGH finding.**

> **Why not "re-run the script":** it is deterministic. Re-running reproduces the same wrong number, so it tests nothing. The failure mode here is a pattern that fires *incompletely* — AC1's fixture proves a pattern fires at all; only hand-derivation proves it fires completely.

**And** divergence from the epic's pre-story estimate is reported as a finding about the estimate, with both figures. **The first-pass pattern set was never recorded** (the note and epic both say only "a first-pass pattern set"), so *"reason unknown — the prior method is not reproducible"* is an expected and acceptable divergence report, not a gap to fill.

**AC3 — the script's output is the worklist, and every assertion is dispositioned.**

**Given** the per-file counts
**When** the pass runs
**Then** each assertion is checked against the artifact that determines it — conventions from `git log`, gates from `.github/workflows/`, thresholds from their config, rules from `project-context.md`
**And** every finding enters the note with ID, line, claim, reality and a **reproducing command**
**And** every assertion that **holds** is marked checked rather than left silent — a silent assertion is indistinguishable from an unexamined one.

**AC4 — findings per derived assertion is an explicit output.**

**Given** the pass is complete
**When** the story closes
**Then** it records **findings per derived assertion** as a named output — not per line, not per week of file age.

**AC5 — the figures are presented; the scope call is the operator's.**

**Given** that "before the tag" is **named as the threshold in the epic but defined nowhere in it** — no date, no session budget, no rate — so the implementer has a numerator and a denominator and nothing to compare them against
**When** the projection is computed
**Then** the story **presents the figures and asks**: the measured rate, the remaining assertion load per story, and the projected finding count. **It does not decide "fits."** A story that declares it fits, having no threshold, is guessing in the operator's name
**And** the projection **names which figures it used**, so a reader can recompute it
**And** it states this gap explicitly: **`README.md` is in scope for Story 1.6 and carries no breakdown-table figure.** The projection either counts it with the same script — counting is not examining, and it is not this story's file to edit — or declares itself a **floor** that excludes it. Silently omitting it would understate the remaining work, which is the failure AC2 exists to prevent, one AC later.

**AC6 — the inherited work, enumerated as a class rather than as instances.**

**Given** items earlier stories explicitly routed here
**When** this story runs
**Then** each is closed or re-routed with a reason:

| Inherited | From | Note |
|---|---|---|
| `/bmad-bmb-*` resolving to nothing | `docs-1-1` R1 | `docs/faq.md`, four sites, three distinct ids. Real ids from `_bmad/_config/skill-manifest.csv` — **never** `.claude/skills/` (NFR8) |
| Count claims evading the checker's adjacency rule | `docs-1-3` | `docs/faq.md:40` carries **two** on one line — `seven Vortex agents` **and** `four Gyre agents`. Close both |
| D1/D2 closures in `UPDATE-GUIDE.md` made without a derivation pass | `docs-1-1` | See Task 5 — the prohibition is on re-filing, not on checking |

**And** the adjacency class is **enumerated across the whole file by command**, not fixed instance by instance — this is the fourth time in this epic an instance list has been short, and `faq.md:40` is itself an example of a line whose second claim was missed
**And** coverage is proven by mutation — **with the caveat recorded** that `docs-audit.js` holds one valid-count set for all teams, so a mutation proof shows the form is **matched**, not that the number is **right for its team** (`all four Vortex agents` passes).

**AC7 — the file set, and a discrepancy in the epic to resolve first.**

**Given** the epic's AC says *"the three files are examined"* while the coverage table assigns **two** files to this story
**When** the file set is settled before work begins
**Then** the discrepancy is resolved and recorded — either a third file is identified and admitted, or the epic's wording is corrected. **The epic is editable for this**, and is not under the findings note's freeze
**And** the coverage table carries `Examined: yes` and a findings count for every file this story examines, `0` written as `0`, blank meaning *not examined*.

**AC8 — no correction introduces a claim nothing can contradict.**

**Given** every edit this story makes
**When** the diff is reviewed
**Then** each retained claim names the object that could contradict it; no new count, version marker or inventory is introduced that no object owns; and no **owned** claim is deleted while removing unowned ones.

## Tasks / Subtasks

> **Build and prove the instrument before measuring anything with it.** Task 2 produces a number that
> sizes three stories; if its patterns are wrong, every downstream estimate inherits the error and
> nothing later in this epic will catch it.

- [ ] **Task 1 — Resolve the file set (AC: 7)**
  - [ ] Reconcile the epic's "three files" against the coverage table's two. Record which is right; correct the other
- [ ] **Task 2 — Build the counting script (AC: 1)**
  - [ ] Home is `scripts/audit/` — match `name-registry-integrity.js`'s live-read-script + fixture-test split. **Namespace decision:** not a skill; nothing here is operator-facing, so `slash-command-ux-for-user-facing-tools` does not bind
  - [ ] Express the pattern set as **a single exported `PATTERNS` array of `{kind, re, note}` inside the script** — one file, so `git diff` shows any change 1.5 or 1.6 would inherit. No separate data file
  - [ ] Implement the four kinds to AC1's definitions, **counting fence bodies**
  - [ ] Build the fixture: one known assertion of each kind. **A kind firing zero times fails the run**
  - [ ] Unit-test in `tests/audit/` against fixtures only. **Prove each pattern can fail** (NFR5)
- [ ] **Task 3 — Measure, and report divergence (AC: 2)**
  - [ ] Run over this story's files; paste output verbatim with its command
  - [ ] Compare to the epic's estimate. **Do not tune toward it.** "Prior method not reproducible" is an acceptable reason
- [ ] **Task 4 — Work the assertion list (AC: 3)**
- [ ] **Task 5 — The inherited items (AC: 6)**
  - [ ] `/bmad-bmb-*` — derive real ids from the shipped manifest; close all four sites
  - [ ] `docs/faq.md:40` — **both** claims; then enumerate the class across the file by command
  - [ ] `UPDATE-GUIDE.md` D1/D2: **re-derive, do not assume.** `docs-1-1`'s Round 1 found a live D2 at `:70` in this file *after* the note declared the class closed everywhere, and its pass ultimately closed far more locations than first recorded — including `:75`, an intra-file contradiction that pass created itself. The prohibition is on **re-filing a closed finding**, never on checking one
- [ ] **Task 6 — Rate and projection (AC: 4, 5)**
  - [ ] Record findings per derived assertion as a named output
  - [ ] Present the projection with its inputs named, and the `README.md` gap stated. **Ask the operator; do not declare "fits"**
- [ ] **Task 7 — Findings note (AC: 7, DoD)**
  - [ ] Per-file counts from the script, `Examined: yes`, findings counts. **Your own rows only** — the freeze banner's carve-out permits exactly that
- [ ] **Task 8 — Verify and hand off**
  - [ ] `npm run docs:audit` → 0 (non-regression only) · `npm run lint` → 0 (**real here** — this story ships `.js`) · `npm test` → 0 · `node scripts/audit/backlog-integrity.js` → 0
  - [ ] Capture each exit code **without a pipe** — `${PIPESTATUS[0]}` is bash, this shell is zsh (`verification-pipefail`)
  - [ ] Commit plan with a Round 1 review record; `git diff --name-only` before staging

## Dev Notes

### What makes this story's instrument different from the last two

This epic has now deleted **two** purpose-built checkers (`T142`) after each shipped defects worse than the ones it caught — the second regenerated the original defect into shipped files with a green gate. Read `T142` before writing a line of this script. Its lesson is not "don't build tools"; it is:

- **Don't build a writer.** This script counts and reports. It must never edit a document.
- **Prefer a narrow instrument you can falsify** over a broad one you can only run.
- **A check that cannot be shown to fail is worse than no check** — which is exactly why AC1 demands the fixture.

The difference here is that this script's output is a **number that sizes other people's work**, so the failure mode is silent undercounting rather than a bad edit. That is what AC2's independence clause guards.

### Files being modified

- **`UPDATE-GUIDE.md`** and **`docs/faq.md`** — this story's derivation pass. Both examined by nothing so far; `docs-1-1` edited them for two specific defects **without** performing their passes, and said so.
- **NEW** `scripts/audit/<counter>.js` and its fixture-based tests in `tests/audit/`.
- **`convoke-epic-docs-accuracy-4-0-2.md`** — AC7 only, the "three files" wording. The epic is **not** under the findings note's freeze.
- **`convoke-note-docs-accuracy-findings-4-0-2.md`** — Task 7, under the freeze banner's carve-out.

**Do not touch** `README.md` (1.6), the `_bmad/bme/_vortex/` documents (examined by 1.2), or `docs/BMAD-METHOD-COMPATIBILITY.md` and `docs/host-framework-sync-playbook.md` (1.5).

### Previous story intelligence — this epic has now cost eight review rounds, and the lessons are specific

- **Never pre-compute a derived value into prose.** Every defect that survived to review across 1.1–1.3 was a claim *about* the work — a count, a citation, an instance list, a provenance attribution — not the work itself. State the disposition, cite the command.
- **An empty search licenses only "not in the scope I searched."** `find _bmad -name …` → 0 became "never existed" for files that lived in gitignored `.claude/skills/`.
- **`\|` inside `grep -E` matched nothing, three separate times**, in three stories, one of which cited the lesson by name. If a pattern is central, plant a string and show it fires.
- **Enumerate the class, don't fix the instance.** Four successive "here are all the instances" lists were each short; the fourth was written in the commit correcting the third.
- **Applying a lesson in one place does not apply it next door.** `docs-1-3` fixed pre-computation in its story file and then failed the same way twice in the artifacts it edited.
- **`docs:audit` caught the author's own prose three times** while writing these stories. It checks counts against the registry and it works — run it early, and read its rejections as information rather than obstacles.

### Latest technical information

No dependency is added and none is available for this work. **Do not reach for a markdown parser**: the repo has none in `dependencies` (`chalk`, `fs-extra`, `js-yaml`, `yaml`), and packages present in `node_modules` are transitive **dev** dependencies of `c8` — requiring one passes locally and breaks for every operator, because `scripts/` ships. `docs-1-2` lost a round to exactly that trap.

Reusable in-repo parsing, verified present: `splitRow`, `isTableLine`, `isSeparator` from `scripts/audit/backlog-integrity.js`, and `FENCE_RE`, `stripInlineCode` from `scripts/audit/lib/shipped-links.js` — the **former** deliberately permits leading whitespace rather than anchoring at column 0, and `stripInlineCode` **preserves line length**, so match indices still map to columns — which is what makes it the right helper for a counter that reports line and column. **Copy a pattern from where it lives; do not retype it.**

### Testing standards

Fixtures only, in `tests/audit/`. Every pattern needs a fixture that makes it **fire** and the script needs a case that makes it **fail** (`verification-must-be-falsifiable`). The fixture demonstration AC1 requires is not a formality: it is the only thing standing between a silently-broken pattern and three stories sized on its output.

### References

- [Source: convoke-epic-docs-accuracy-4-0-2.md#Story-1.4] — ACs, DoD, and the "three files" discrepancy AC7 resolves
- [Source: convoke-note-docs-accuracy-findings-4-0-2.md] — the **breakdown table** (assertion kinds and pre-story estimates — it is in the findings note, **not** the epic), the coverage table, and the freeze banner
- [Source: `_bmad/_config/skill-manifest.csv`] — shipped source for slash-command ids (NFR8)
- [Source: `scripts/docs-audit.js`] — the checker AC6's rewording must satisfy
- [Source: backlog `T142`] — two deleted checkers; read before building this one
- [Source: project-context.md] — `test-fixture-isolation`, `verification-must-be-falsifiable`, `verification-pipefail`, `derive-counts-from-source`, `code-review-convergence`, `commit-preparation`

## Definition of Done

- [ ] `npm run docs:audit` exits 0. **Non-regression only, not evidence of accuracy** *(NFR3, verbatim)*.
- [ ] Every finding carries a reproducing command (NFR1) from an artifact the operator receives — never `.claude/skills/` (NFR8).
- [ ] The count is the script's output, and the Round 1 reviewer re-ran it independently (AC2).
- [ ] Each pattern in the set was demonstrated firing on the fixture, and the script was shown able to fail.
- [ ] **Every check cited as evidence in the Dev Agent Record names how it was shown able to fail (NFR5)** — not only the script; the AC3 verifications and AC6's mutation proof are covered by this too.
- [ ] Every claim written or kept obeys the source-of-truth rule (FR3a).
- [ ] Findings per derived assertion recorded as a named output; the projection records which figures it used.
- [ ] Coverage table updated for this story's own rows, `0` written as `0`.
- [ ] `npm run lint` exits 0 — **real here**, this story ships `.js` under `scripts/`.
- [ ] `npm test` green, including the new fixture tests.
- [ ] Commit plan emitted with a Round 1 review record (NFR4); reviewed file set equals staged file set.

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List

## Change Log

| Date | Change |
|------|--------|
| 2026-09-12 | **Reworked after independent validation returned NOT READY (5 HIGH).** The defects clustered in one place: **AC1 required a "pinned pattern set" without specifying what it pins.** Fixed by (a) **ruling that fenced code blocks ARE counted** — the decision is invisible on `docs/faq.md`, which has no fences, and decisive on `UPDATE-GUIDE.md`, whose commands sit overwhelmingly inside them, so leaving it unmade would have silently propagated to 1.5 and 1.6; and (b) giving each of the four kinds an **operational definition** with what it excludes. **AC2's independence mechanism was unworkable** — Round 1 fires on the same change by the same agent, and re-running a deterministic script reproduces the same wrong number. Replaced with **hand-derivation of a named sample window**, which tests completeness rather than repeatability. **AC5 asked the implementer to decide "fits" against a threshold the epic names but never defines**; reframed to present the figures and ask, and to state that `README.md` is in 1.6's scope with no breakdown figure, so the projection is a floor unless it counts it. **AC6 named one instance where the same line carries two** (`seven Vortex agents` and `four Gyre agents`) — the fourth short instance-list in this epic — so it now requires enumerating the class by command. Task 5 restored the intelligence behind "do not re-report": `docs-1-1`'s R1 found a live D2 in this very file after the note declared the class closed. |
| 2026-09-12 | Story created. Builds the epic's first measurement instrument, run identically by 1.4–1.6. States **no counts** — the epic's `37`/`20` are pre-story estimates the script re-derives, and reproducing them would invert the test. AC7 added for a discrepancy in the epic: its AC says "three files", the coverage table assigns two. AC6 carries three items earlier stories routed here. |
