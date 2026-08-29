# Story 2.4: Assert the installed tree carries what was shipped

Status: ready-for-dev

<!-- baseline_commit deliberately ABSENT — it is `dev-story`'s field, stamped at implementation
     start. Pre-stamping it in dist-1-2 caused a rule deviation the operator had to ratify. -->

## Story

As a **Convoke operator**,
I want everything in the package to actually arrive when I install,
so that **a file cannot ship and be unreachable at the same time**.

### What this story is, in one line

Build the installed-tree assertion inside `scripts/audit/try-fresh-install.sh`, prove it red on
two real defects, and **do not let it affect the verdict** — Story 2.6 wires it in.

---

## Acceptance Criteria

**AC1 — Written against the existing harness, not a new grep**

**Given** `scripts/audit/try-fresh-install.sh` already packs, installs, and runs doctor and export
as the CI `fresh-install` job
**When** this story completes
**Then** the assertion is written against that harness rather than as a new grep over `scripts/**`
— grep is fragile against renames and dynamically built paths; an actual install is not
**And** it reuses the harness's already-installed project at `$TMP/proj` rather than packing or
installing a second time

**AC2 — NOT in the failure path (NFR10)**

**Given** `fresh-install` runs on push to `main` and on every pull request, and the `publish` job
`needs:` it
**When** this story completes
**Then** the new check is **not** placed in the harness's failure path
**And** line 354 of `try-fresh-install.sh` is left **byte-identical**, verified with
`git diff -- scripts/audit/try-fresh-install.sh | grep '^[-+].*INSTALL.*DOCTOR'` returning empty —
the new variable appears nowhere in that condition
**And** the story states in its Completion Notes that this is deliberate and names Story 2.6 as
the wiring story

**AC3 — Every shipped `_bmad/bme/*` module arrives**

**Given** an installed package
**When** the harness runs
**Then** the check fails if any `_bmad/bme/*` entry in `files[]` is absent from the installed
**project** tree
**And** both counts (entries shipped, entries arriving) are derived at implementation time from
`package.json` and from the installed tree — never carried forward as literals
(`derive-counts-from-source`)

**AC4 — Every file the shipped code reads at runtime arrives**

**Given** a file can be in `files[]`, reach `node_modules/convoke-agents/`, and still be absent
from the user's project, because `refresh-installation.js` copies `_bmad/_config/` **per named
file** (`:551`, `:585`), not as a directory
**When** the harness runs
**Then** the check fails if a file on a **declared manifest of project-scoped runtime data
files** is absent from the installed project tree
**And** every manifest entry cites the call site that reads it, and the manifest is asserted
non-empty by a test — an empty list is a check that cannot fail
**And** the manifest is **curated, not inferred**, and the story says so plainly: see "Why AC4 is
a declared list" below. `bmm-dependencies.csv` is a required entry, since AC6 depends on it

**AC5 — I153: the dependency check walks the full surface**

**Given** I153 — the harness's bin dependency check resolves only ONE hop, so most bins' real
dependency surface is unchecked
**When** this story completes
**Then** the check walks the full dependency surface, and I153 is closed against this story in the
same session the code ships (`project-context.md` — a fix is not a close)

**AC6 — Observed failing on both targets (NFR10)**

**Given** the tree as it stands
**When** the assertion is run against it
**Then** it is observed **failing** on both `_bmad/bme/_portability/` and
`_bmad/_config/bmm-dependencies.csv`, with the output pasted into this story's Completion Notes —
demonstrated, not merged red
**And** it is recorded that the second target is **conditional on Story 2.5's decision** that the
registry should ship and arrive. `convoke-doctor` treats its absence as a soft warning by design,
so "must arrive" is a choice 2.5 made, not a property of the code. If that choice is revisited,
this entry leaves AC4's manifest and this demonstration must be re-based

**AC7 — The check can fail, and that is proven**

**Given** `try-fresh-install.sh` has a documented history of **at least five** fail-open defects
(see Dev Notes), every one of which reported PASS while doing nothing
**When** the new check is accepted
**Then** it is shown to fail on a deliberately broken input **and** to pass on a good one, both
recorded — `verification-must-be-falsifiable`
**And** any command substitution feeding a pass/fail decision fails **closed**

---

## Tasks / Subtasks

- [ ] **Task 1 — Settle the detection design before writing shell** (AC3, AC4)
  - [ ] Re-read `try-fresh-install.sh` end to end; the file documents its own past defects in comments and they are the specification for what not to repeat
  - [ ] Derive, from `package.json`, the `_bmad/bme/*` entries in `files[]`
  - [ ] Derive, from `scripts/update/lib/refresh-installation.js` + `agent-registry.js`, which of them any install path copies
  - [ ] Build AC4's manifest by hand from read sites, NOT from a path grep — read "Why AC4 is a declared list" first; the obvious grep does not work and the reason is measured
  - [ ] For each entry record: the file, the call site that reads it, and why its absence is a defect rather than a normal pre-generation state
  - [ ] Write the manifest into Dev Notes before coding

- [ ] **Task 2 — Module-arrival check** (AC1, AC3)
  - [ ] Add a block after the bin loop summary (`:346`) and before the verdict banner (`:349`)
  - [ ] Compare `files[]` `_bmad/bme/*` entries against `$TMP/proj/_bmad/bme/*`
  - [ ] Accumulate into a NEW variable (e.g. `TREE`), never into `FAILED`

- [ ] **Task 3 — Runtime-read arrival check** (AC4)
  - [ ] For each manifest entry, assert presence under `$TMP/proj/`
  - [ ] Print one `FAILED:` line per missing file, naming the reading call site
  - [ ] Add a test asserting the manifest is non-empty and that every entry's cited call site still exists — the manifest rots silently otherwise

- [ ] **Task 4 — Transitive dependency walk** (AC5)
  - [ ] Replace the single-pass extractor (`:312-326`) with a worklist that follows resolved **relative** specifiers transitively
  - [ ] Guard against cycles with a visited set, and against runaway with a depth or node cap that **reports when it is hit** rather than passing silently
  - [ ] Keep the `2>"$TMP/dep-check.err"` fail-closed pattern exactly as it is

- [ ] **Task 5 — Prove it red** (AC6, AC7)
  - [ ] Run `bash scripts/audit/try-fresh-install.sh`; capture output showing both `_portability` and `bmm-dependencies.csv` flagged
  - [ ] Positive control: temporarily satisfy one finding, re-run, show that finding clears while the other persists
  - [ ] Negative control: confirm the harness still exits **0** — the checks report, they do not gate

- [ ] **Task 6 — Verdict untouched** (AC2)
  - [ ] `git diff` the verdict block and confirm zero changes to line 354 (`if [ "$INSTALL" -eq 0 ] …`)
  - [ ] `npm run lint`; run the harness twice to confirm determinism

- [ ] **Task 7 — Close I153** (AC5)
  - [ ] Flip I153 in `§2.3` of the lifecycle backlog, delete the lane row, append a `§2.5` receipt — one edit (`backlog-format-spec.md` §"Closing a Row")
  - [ ] Run `node scripts/audit/backlog-integrity.js`

---

## Dev Notes

### The file you are modifying — read it first

`scripts/audit/try-fresh-install.sh`, 366 lines. **Its comments are a defect log, not
decoration.** It records **at least five** review findings in one family: four checks that
reported success without doing their work, plus `| tail -2` (`:243`), which discarded the reason
for a real failure rather than passing falsely — the script groups it with the others at `:336`,
so it is named here, but it is not the same defect. The count is "at least" deliberately: the
file's own numbering does not reconcile — `:58` calls the `COMPLETED` guard "the fourth variant of
the fail-open pattern" while `:335` calls the dep-check stderr bug "the THIRD instance of this
exact pattern". **Derive the count at implementation time; do not carry this one forward.** The
four that reported false success:

| Where | The defect |
|---|---|
| `:29-32` | bin loop guarded on `[ $STATUS -gt 1 ]`; a **missing** bin exits 1, so the exact class the script exists to catch passed as "all bins launch" |
| `:54-59` | on bash 3.2 a `set -u` abort in a script with any exit trap exits **0** — hence the `COMPLETED` sentinel |
| `:272-274` | a failing command substitution in a `for` list does not trip `set -e`; the loop ran zero times and reported "all bins launch" |
| `:328-341` | dep-check stderr was captured into the result variable, so a Node warning read as "modules did not ship"; and `2>/dev/null` made any extractor crash report success |

**AC7 exists because of this table.** A fifth instance is the most likely way this story fails.

### Placement, and what it must not disturb

Insert between the bin loop's summary (`:346`) and the `========` verdict banner (`:349`).

- `COMPLETED=1` is set at `:353` **before** the verdict, so an explicit `exit 1`/`2` still counts
  as a completed run. Do not move it.
- Exit codes are meaningful: **2** = harness/environment problem, **1** = real product defect
  (`ENV_FAIL` at `:99`). A harness bug in your new code exits 2, not 1.
- The verdict at `:354` is the gate. **Adding your variable to that condition is Story 2.6's
  job and would violate NFR10 here.**

### Why the AC wording needed resolving — read this before designing

FR13 says the assertion covers *"every file in `files[]` that code reads at runtime"*, but the
NFR10 red target `bmm-dependencies.csv` **is not in `files[]` at all**. Taken literally the AC
cannot produce its own required demonstration. Verified 2026-08-29:

- `npm pack --dry-run` ships exactly one `_bmad/_config/` entry: `skill-manifest.csv`
- the repo holds **13 files** in `_bmad/_config/`, so "repo siblings that do not ship" would flag
  twelve — most legitimately. That mechanism is too noisy to use.
- `bmm-dependencies.csv` is read via `path.join(projectRoot, …)` (`convoke-doctor.js:763`,
  `audit-bmm-dependencies.js:34,642`) — **`fs`, not `require`** — so a dependency walk cannot see
  it either.

**The direction that works is code → file:** enumerate what shipped code reads from `projectRoot`
at runtime, then assert each arrives in the installed project. That is what makes both red targets
fall out of one rule, and it is what FR13 means by its class distinction from FR12.

### Why AC4 is a declared list

The obvious mechanisation is `grep -rn "path.join(projectRoot" scripts/`. **It was tried and it
does not work.** Measured 2026-08-29:

- it returns **135 sites**
- it cannot tell a **read** from a **write** — most `.claude/skills/**/SKILL.md` hits are the
  installer *writing*, and asserting those must pre-exist would fail on every clean install
- many paths are built from variables (`agent.submodule`, `wf.name`, `entry.moduleConfigPath`), so
  no static extractor resolves them to filenames
- several hits are **directories**, not files
- decisively: **AC6's own mandated target is invisible to it.** `convoke-doctor.js:763` reads
  `path.join(projectRoot, BMM_DEPS_CSV_REL)` — the filename lives in a constant, so the grep
  matches the line but yields no filename. A mechanical extractor following this route produces a
  check that **cannot satisfy AC6**.

This is the same objection the story raises against the repo-siblings approach, and it lands
harder here: 135 sites against 12.

**So AC4 is a curated manifest, and the story does not pretend otherwise.** Curation has a real
cost — it rots when someone adds a runtime read and forgets the list — which is why AC4 requires
each entry to cite its reading call site and requires a test that those call sites still exist.
That test is the rot alarm. It is weaker than derivation, and saying so is the point: a check
described as "mechanically derived" when it is hand-maintained is the kind of claim this
repository keeps finding false.

**Do not "improve" this into an inference engine.** If a future story wants derivation, the
tractable route is observing an installed product's actual file opens, not static analysis — and
that is a different story with a different cost.

### The finding that makes this story matter more than its AC suggests

`skill-manifest.csv` reaches the user's project through a **named per-file block**
(`refresh-installation.js:551`, `:585`) — not a directory copy. So a file can be in `files[]`,
arrive in `node_modules/convoke-agents/`, and still never reach the project where the code looks
for it.

**Consequence for Story 2.5 / BUG-19:** FR18 as written ("MUST be in `package.json` `files[]`") is
**necessary but not sufficient** to stop the doctor warning, because `checkBmmDependencies` reads
from `projectRoot`. FR18 needs a copy step too. Do not fix that here — record it, and it is raised
as an open question below.

### I153 — what "one hop" means concretely

The extractor at `:312-326` reads each bin **entry file**, regex-matches literal
`require("…")`, and resolves each specifier. It never opens what it resolved.

- `scripts/install-all-agents.js` (bin `convoke-install`) contains exactly **one** require —
  `./install-vortex-agents.js`. Its real surface (`fs-extra`, `refresh-installation`,
  `compat-preflight`, `agent-registry`) is one hop down and unchecked. That bin's gate is vacuous.
- The I139 canary passes **by coincidence**: `csv-utils` is required at two sites, one of which is
  a bin entry file. Hoist that require into a helper — an ordinary refactor — and the regression
  becomes undetectable with nothing going red.

⚠ **Interaction to handle:** the extractor is a regex over raw text with **no lexer**, so a
commented-out or string-literal `require` is reported as missing. That is latent today (no bin has
one) and is a *separate* I153 deferral, explicitly **out of scope**. But going transitive multiplies
its blast radius from 14 entry files to the whole graph. Bound it: follow **relative** specifiers
only (`./`, `../`); treat bare package specifiers as leaves.

### Testing standards

- `test-fixture-isolation`: any Node helper you add gets tests that run against a tmp fixture, never
  `PACKAGE_ROOT`. Every `runScript` call passes `{ cwd: tmpDir }`.
- `verification-pipefail`: this is bash. Under zsh `${PIPESTATUS[0]}` is silently empty — it is
  `${pipestatus[0]}`. The script is `bash`; keep it that way and do not test it under zsh.
- Prefer a small Node helper invoked from the shell over more shell — the file already does this
  (`:274`, `:312`), and Node is where the logic is testable.
- `no-hardcoded-versions`, `no-process-cwd-in-libs` apply to any new JS.
- **No new dependencies.** Runtime deps are `chalk`, `fs-extra`, `js-yaml`, `yaml` — derive the
  list at implementation time. A module-graph or AST library is the obvious temptation for Task 4
  and is refused: `backlog-integrity.js` set the precedent that a hand-rolled parser gets fenced
  in rather than extended, and this walk only needs `require.resolve` plus a worklist. If the
  regex extractor proves genuinely insufficient, stop and raise it — do not add a parser.

### Cross-story dependencies

| Story | Status | Relationship |
|---|---|---|
| `dist-2-2` / `dist-2-3` | backlog, unauthored | **2.3 rewrites `files[]`** — drops `scripts/migration/format-conversion/`, adds `_bmad/bme/covenant/` and `docs/migration/`, and wires the link checker into this same harness. Landing 2.4 first means the harness is edited twice and 2.3 must re-run against your check. Derive `files[]` at runtime, never snapshot it. |
| `dist-2-5` | backlog | Consumes this story's red output. **FR18 must not land here** (NFR10). |
| `dist-2-6` | backlog | Wires this check into the verdict and turns it green with FR14. |
| `I153` | Fast Lane, 4.8 | Closed by AC5. |
| `BUG-19` | Bug Lane, 5.7 | Its remaining FR18 half is blocked until this story's red observation is recorded. |

⚠ **You are authoring out of the epic's stated order** (`2.1 → 2.2 → 2.3 → 2.4`). 2.4 has no
logical dependency on 2.1–2.3, but it is not the epic's sequence — noted deliberately, not by
oversight.

### Disproved risks — do not re-raise

- *"Add the check to the verdict so it actually gates."* No — NFR10 forbids it and 2.6 does it.
  A check that prints FAIL and exits 0 is uncomfortable **by design** here.
- *"Detect `bmm-dependencies.csv` by diffing the repo against the tarball."* Measured: 12 false
  positives in `_bmad/_config/` alone.
- *"`node --check` already proves the bin works."* It never resolves `require()` — that is I139's
  exact class.

### References

- Epic: [convoke-epic-4-0-1-distribution-integrity.md](../planning-artifacts/convoke-epic-4-0-1-distribution-integrity.md) — Story 2.4 (`:689`), FR13 (`:162`), NFR10 (`:215`+), Epic 2 overview
- Harness: [try-fresh-install.sh](../../scripts/audit/try-fresh-install.sh)
- Install path: [refresh-installation.js](../../scripts/update/lib/refresh-installation.js) `:222`, `:551`, `:585`
- Doctor read site: [convoke-doctor.js:763](../../scripts/convoke-doctor.js)
- CI job: [.github/workflows/ci.yml:288](../../.github/workflows/ci.yml)
- Rules: [project-context.md](../../project-context.md) — `verification-must-be-falsifiable`, `derive-counts-from-source`, `mechanical-research-enumeration`, `test-fixture-isolation`, `commit-preparation`, `code-review-convergence`

---

## Commit Plan

Filled in at implementation time per `commit-preparation`. Expected shape — source and its tests in
one commit, the backlog close in another:

1. `feat(dist-2-4): assert the installed tree carries what was shipped` — `scripts/audit/try-fresh-install.sh` + any new helper + its tests
2. `governance(backlog): close I153 against dist-2-4` — the lifecycle backlog

⚠ Scope the first commit `dist-2-4`, **not** `I153` — `backlog-integrity.js`'s owed-close scan
matches scope tokens exactly against live row IDs, so `fix(I153)` warns until the close lands.

## Change Log

| Date | Change |
|---|---|
| 2026-08-29 | Story created. FR13 wording ambiguity resolved (code → file, not `files[]` → disk); per-file `_config` copy path documented; out-of-order authoring flagged. |

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
