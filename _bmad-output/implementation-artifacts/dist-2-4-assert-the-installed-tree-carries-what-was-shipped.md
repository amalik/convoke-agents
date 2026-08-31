---
baseline_commit: 4d87d4f6561373f1c20acb90d16de886b45b6f99
---

# Story 2.4: Assert the installed tree carries what was shipped

Status: done

<!-- baseline_commit was deliberately absent AT AUTHORING TIME — it is `dev-story`'s field,
     stamped at implementation start. Pre-stamping it in dist-1-2 caused a rule deviation the
     operator had to ratify. `dev-story` stamped it 2026-08-30; the frontmatter above is that
     stamp, not a pre-stamp. Wording corrected after Round 1 review, which read the original
     comment as contradicting the field it sits under. -->

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

**AC3 — Every shipped `_bmad/bme/*` module arrives *and is reachable***

> **Amended 2026-08-30 per [ADR-004](../planning-artifacts/adr/4-0-1/adr-004-bme-module-contract.md),
> accepted question 3.** This AC previously stopped at presence. Presence alone is **not** a
> sufficient assertion, and the gap is not hypothetical: it is the exact defect this story's own
> AC6 red demonstration fires on. See *Why presence is not enough* below.

**Given** an installed package
**When** the harness runs
**Then** the check fails if any `_bmad/bme/*` entry in `files[]` is absent from the installed
**project** tree
**And** it **also** fails if any operator-invocable unit declared by an arriving module does not
resolve to a generated `.claude/skills/<name>/SKILL.md` wrapper in the installed project. Per
ADR-004's contract C2, a unit is declared either as an agent in `agent-registry.js` or as a
`config.yaml` workflow carrying `standalone: true`; per C4, shipping is not installing and
installing is not invoking
**And** the declared set is **derived from the installed tree's module configs and the agent
registry at runtime**, never snapshotted — a hardcoded list of expected wrappers goes stale the
first time a module gains a workflow
**And** all counts (entries shipped, entries arriving, units declared, wrappers resolving) are
derived at implementation time from `package.json`, the module configs and the installed tree —
never carried forward as literals (`derive-counts-from-source`)

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

- [x] **Task 1 — Settle the detection design before writing shell** (AC3, AC4)
  - [x] Re-read `try-fresh-install.sh` end to end; the file documents its own past defects in comments and they are the specification for what not to repeat
  - [x] Derive, from `package.json`, the `_bmad/bme/*` entries in `files[]`
  - [x] Derive, from `scripts/update/lib/refresh-installation.js` + `agent-registry.js`, which of them any install path copies
  - [x] Build AC4's manifest by hand from read sites, NOT from a path grep — read "Why AC4 is a declared list" first; the obvious grep does not work and the reason is measured
  - [x] For each entry record: the file, the call site that reads it, and why its absence is a defect rather than a normal pre-generation state
  - [ ] Write the manifest into Dev Notes before coding — **NOT DONE AS WRITTEN.** Unticked after Round 1 review: `dev-story` may not edit Dev Notes, so the manifest went to the Dev Agent Record instead. It *was* derived before any code was written; only its location moved. The box previously read `[x]` while the record below stated it was recorded elsewhere, so the document contradicted itself.

- [x] **Task 2 — Module-arrival check** (AC1, AC3)
  - [x] Add a block after the bin loop summary (`:346`) and before the verdict banner (`:349`)
  - [x] Compare `files[]` `_bmad/bme/*` entries against `$TMP/proj/_bmad/bme/*`
  - [x] Accumulate into a NEW variable (e.g. `TREE`), never into `FAILED`

- [x] **Task 3 — Runtime-read arrival check** (AC4)
  - [x] For each manifest entry, assert presence under `$TMP/proj/`
  - [x] Print one `FAILED:` line per missing file, naming the reading call site
  - [x] Add a test asserting the manifest is non-empty and that every entry's cited call site still exists — the manifest rots silently otherwise

- [x] **Task 4 — Transitive dependency walk** (AC5)
  - [x] Replace the single-pass extractor (`:312-326`) with a worklist that follows resolved **relative** specifiers transitively
  - [x] Guard against cycles with a visited set, and against runaway with a depth or node cap that **reports when it is hit** rather than passing silently
  - [x] Keep the `2>"$TMP/dep-check.err"` fail-closed pattern exactly as it is

- [x] **Task 5 — Prove it red** (AC6, AC7)
  - [x] Run `bash scripts/audit/try-fresh-install.sh`; capture output showing both `_portability` and `bmm-dependencies.csv` flagged
  - [x] Positive control: temporarily satisfy one finding, re-run, show that finding clears while the other persists
  - [x] Negative control: confirm the harness still exits **0** — the checks report, they do not gate

- [x] **Task 6 — Verdict untouched** (AC2)
  - [x] `git diff` the verdict block and confirm zero changes to line 354 (`if [ "$INSTALL" -eq 0 ] …`)
  - [x] `npm run lint`; run the harness twice to confirm determinism

- [x] **Task 7 — Close I153** (AC5)
  - [x] Flip I153 in `§2.3` of the lifecycle backlog, delete the lane row, append a `§2.5` receipt — one edit (`backlog-format-spec.md` §"Closing a Row")
  - [x] Run `node scripts/audit/backlog-integrity.js`

### Review Findings

Round 1, 2026-08-30. Three layers run in parallel as independent subagents with no access to the implementing session's reasoning: Blind Hunter (17 raised), Edge Case Hunter (14), Acceptance Auditor (11). Deduplicated to 28. Severity below is the reviewer's own, assigned after reading each call site — the layers' severities are discarded by workflow rule. **Nothing was dismissed as noise.** The three highest-severity findings were each raised independently by two or three layers.

- [x] [Review][Patch] **[was Decision — resolved 2026-08-30: keep the escalation, fix the claim]** `try-fresh-install.sh:379-382` hard-exits on `TREE=2`, which AC2 forbids as a failure path. **Operator ruling: the escalation stays** — a check that cannot run must not let the harness report health, which is the fail-open class this story exists to close. Patch: correct the Completion Note (it says `$TREE` is "referenced nowhere in the condition" and omits the `exit` two lines above), and replace AC2's verification method, since `git diff | grep '^[-+].*INSTALL.*DOCTOR'` is structurally incapable of seeing a newly added `exit`. Raised by all three layers.
- [x] [Review][Patch] **[was Decision — resolved 2026-08-30: extend the check]** ADR-004 C1 closes only the *missing-file* form of the vacuity; a `config.yaml` holding just `version: 4.0.1` declares nothing and passes — reproduced at **exit 0** with four skills unreachable on disk. **Operator ruling: extend it** — fail when an arriving module declares no invocable unit at all. This is a second scope addition beyond AC3 and beyond ADR-004 C1 as written, and it constrains `dist-2-6`: `_portability`'s config must *declare* its four skills, not merely exist. The Completion Notes overstate what C1 closes and must be corrected regardless. Raised by Blind Hunter and Edge Case Hunter.
- [x] [Review][Patch] Zero-unit derivation exits 2 even when the real cause is total module-arrival failure — only harness-fail when `absentModules` is empty [`scripts/audit/assert-installed-tree.js:114`]
- [x] [Review][Patch] The `WRAPPER_RULES` rot alarm asserts only that the file has N lines — mutation-proven vacuous (`:909`→`:1` leaves 31/31 green); check line content as the manifest alarm does [`tests/audit/installed-tree.test.js:103`]
- [x] [Review][Patch] Three of five cited generator sites point at comments or guards, not generators: `:836`→`:837`, `:862`→`:863`, `:909`→`:914` [`scripts/audit/lib/installed-tree.js:101`]
- [x] [Review][Patch] The `standaloneWorkflow` rule is contract-derived (ADR-004 C2), not read off a generator — no generic standalone generator exists; the adjacent comment claims the opposite [`scripts/audit/lib/installed-tree.js:139`]
- [x] [Review][Patch] `alsoRead` cites `audit-bmm-dependencies.js:34`, the OUTPUT path constant of the script that *writes* the CSV; the read is at `:642` — the exact read/write confusion the story gives as its reason for rejecting the grep [`scripts/audit/lib/installed-tree.js:89`]
- [x] [Review][Patch] `arrivesVia: refresh-installation.js:1040` is a `changes.push` log line, not the write — `mergeTaxonomy` at `:1038` creates the file; the alarm passes because a string literal mentions the basename [`scripts/audit/lib/installed-tree.js:78`]
- [x] [Review][Patch] `process.exit()` immediately after `console.log` can truncate `FAILED:` lines on a piped stdout (CI, and the tests' `execFileSync`) — use `process.exitCode` and return [`scripts/audit/assert-installed-tree.js:133`]
- [x] [Review][Patch] The cap comment says exit 2 stops the caller reporting a product defect; the caller's `||` branch fires on any non-zero and sets `FAILED=1`, which does feed the verdict [`scripts/audit/assert-installed-tree.js:144`]
- [x] [Review][Patch] Only exit 2 is treated as "could not run" — 126/127/128+signal print `[installed-tree status N]` and the run proceeds to PASS [`scripts/audit/try-fresh-install.sh:379`]
- [x] [Review][Patch] `walkRequires` computes `{spec, from}` then discards `from`, so a relative specifier is attributed to the bin entry file across a walk of up to 20 files — the same information loss the harness's own `| tail -2` defect note records [`scripts/audit/lib/installed-tree.js:270`]
- [x] [Review][Patch] The assertion filters `excluded_agents` for the `EXTRA_BME_AGENTS` bucket; the generator's loop applies no exclusion at all — an exclusion there drops a wrapper from the check that the installer still emits [`scripts/audit/lib/installed-tree.js:176`]
- [x] [Review][Patch] An `EXTRA_BME_AGENTS` entry with no `submodule` yields `present.has(undefined)` → the agent is silently dropped from the expectation set [`scripts/audit/lib/installed-tree.js:171`]
- [x] [Review][Patch] A zero-byte or stale `SKILL.md` satisfies the invocability check — the test asserts an empty *directory* fails, not an empty *file* [`scripts/audit/lib/installed-tree.js` `missingWrappers`]
- [x] [Review][Patch] `units` is not deduplicated — two modules declaring the same workflow name double-print the finding and inflate the clean-run count [`scripts/audit/lib/installed-tree.js:186`]
- [x] [Review][Patch] A glob entry in `files[]` is read as a literal module name, producing `FAILED: _bmad/bme/*/ … did not arrive` [`scripts/audit/lib/installed-tree.js` `shippedBmeModules`]
- [x] [Review][Patch] The 500-file cap default is written in the library and again as a literal in the caller's message [`scripts/audit/assert-installed-tree.js:146`]
- [x] [Review][Patch] Space-joined stdout splits a specifier containing whitespace into two bogus missing modules [`scripts/audit/assert-installed-tree.js:148`]
- [x] [Review][Patch] The header's "the tree under test is data here, not code" is contradicted by `require()`-ing the installed `agent-registry.js` [`scripts/audit/assert-installed-tree.js:12`]
- [x] [Review][Patch] The comment calls the comment-embedded-require hazard "latent today (no bin has one)" — `_bmad/bme/_team-factory/lib/writers/registry-writer.js:323` already carries one, unreachable from a bin only by accident of the import graph [`scripts/audit/lib/installed-tree.js:220`]
- [x] [Review][Patch] The backlog Change Log claims `PASS — 758 rows`; the actual count is **759**. The figure was pasted from the run *before* the entry itself added a row — a `derive-counts-from-source` violation inside the commit that cites that rule [`convoke-note-initiative-lifecycle-backlog.md` Change Log]
- [x] [Review][Patch] `- [x] Write the manifest into Dev Notes before coding` is ticked while the Dev Agent Record immediately below states it was recorded elsewhere — the box asserts a subtask the same document denies [story, Task 1]
- [x] [Review][Patch] The Commit Plan was never filled in; it still reads "Filled in at implementation time… Expected shape", while the Completion Notes redirect the reader to it for the sprint-status commit [story, Commit Plan]
- [x] [Review][Patch] `a1211f2d`, subject "reconcile sprint status **before pickup**", also carries `dist-2-4: ready-for-dev → review` and a note quoting `npm test` 1890/1889 — gate results for files that land three commits later. Pushed, so the fix is a forward-pointing correction, not a rewrite [`sprint-status.yaml`]
- [x] [Review][Patch] The `baseline_commit` frontmatter contradicts the comment three lines below it, which still reads "deliberately ABSENT" [story, frontmatter]

- [x] [Review][Defer] ESM blindness — the extractor regexes only `require(...)`, so an `.mjs` bin or `"type": "module"` yields zero specifiers and empty is the PASS value, reported inside "all 14 bins … their requires resolve" [`scripts/audit/lib/installed-tree.js:355`] — deferred, tracked as **T101(a)**, which already sequences it first as the only survivor that can report a broken package as healthy
- [x] [Review][Defer] Fresh-install exclusion skew — `refresh-installation.js:48-54` reads `excluded_agents` from the target config *before* it is copied (so on a fresh install it reads `[]` and generates every wrapper), while the assertion reads the now-copied config and skips those agents [`scripts/audit/lib/installed-tree.js:438`] — deferred, latent today (every shipped module config carries an empty or absent `excluded_agents`), and closing it properly needs a generator change outside this story's scope

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

### Why presence is not enough — read before implementing AC3

A presence-only assertion would go **green** on a `_bmad/bme/_portability/` directory that was
copied into the project but whose four skills remain uninvocable. That is not a corner case: it
is precisely the state Story 2.6's *previous* draft would have produced, and it is the defect
I141 was filed for.

The failure reproduces in this repository right now, with no packaging involved. The source tree
is present at `_bmad/bme/_portability/`, and all four skills — `bmad-export-skill`,
`bmad-generate-catalog`, `bmad-seed-catalog`, `bmad-validate-exports` — are **absent** from this
repo's own `.claude/skills/`. A directory-presence check run here would report PASS.

The mechanism behind that, verified: `.claude/skills/` wrappers are *generated* from declarations
(`refresh-installation.js:749`, `:810`, `:836`, `:909`), never copied. So "the module arrived"
and "the operator can invoke it" are genuinely different assertions, and only the second is what
FR13's story promises — *"a file cannot ship and be unreachable at the same time."*

`project-context.md` records two 2026-08-15 instances of checks that reported success without
doing their work. A gate that passes on the very defect it was built to catch is the third, and
NFR10 exists to stop this story becoming it.

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
| `dist-2-2` / `dist-2-3a` / `dist-2-3b` / `dist-2-3c` | authored 2026-08-31, all `ready-for-dev` | **2.3 was SPLIT into three, one per ADR-002 class**, and all three rewrite `files[]`: 2.3a drops `scripts/migration/format-conversion/`, 2.3b adds `_bmad/bme/covenant/`, 2.3c adds `docs/migration/`. 2.3c also wires the link checker into **this same harness**. This story shipped first, so the harness is edited again by each of them and each must re-run against this check. **Derive `files[]` at runtime, never snapshot it** — that instruction is now load-bearing three times over. |
| `dist-2-5` | backlog | Consumes this story's red output. **FR18 must not land here** (NFR10). |
| `dist-2-6` | **re-authored 2026-08-30** | Wires this check into the verdict and turns it green with FR14. Its AC8 requires the assertion to test **invocability**, which is why AC3 above was amended. If AC3 ships as amended, 2.6 wires it unchanged; if it ships against presence only, 2.6 must amend the shipped assertion. **Exactly one of those must happen.** |
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

**Anticipated shape** (written at authoring time) — source and its tests in one commit, the backlog
close in another:

1. `feat(dist-2-4): assert the installed tree carries what was shipped`
2. `governance(backlog): close I153 against dist-2-4`

⚠ Scope the first commit `dist-2-4`, **not** `I153` — `backlog-integrity.js`'s owed-close scan
matches scope tokens exactly against live row IDs, so `fix(I153)` warns until the close lands.
*(Honoured: the backlog commit is scoped `governance(backlog)`, so the scan does not read it as owing a close for `I153`. **The scan is no longer globally clean** — it now WARNs on `I113` and `I134`, both from parallel governance commits unrelated to this story. The original parenthetical claimed a repo-wide zero, which was true when written and is not a claim this story is entitled to make.)*

### What actually landed — 2026-08-30

Filled in after the fact, which is itself the finding: Round 1 review caught this section still
reading "Filled in at implementation time" while the Completion Notes redirected the reader here for
the sprint-status commit. **Four commits, not two.**

| # | Commit | Subject | Files |
|---|---|---|---|
| 1 | `a1211f2d` | `governance(dist-epic-2): reconcile sprint status with the repository before pickup` | `sprint-status.yaml` |
| 2 | `357a4703` | `fix(dist-2-4): stop a JSDoc example being read as a dependency` | `scripts/portability/export-engine.js` |
| 3 | `8b5d5760` | `feat(dist-2-4): assert the installed tree carries what was shipped` | the two new scripts, the test file, `try-fresh-install.sh` |
| 4 | `2c8999ce` | `governance(backlog): close I153 against dist-2-4, file T101` | lifecycle backlog |
| 5 | `fca5fcf7` | `governance(I113): name I98 as Gyre's unlisted prerequisite at Epic 4 Story 4.1` | **`installed-tree.js` +154 and this story file +180** |

**Three deviations from the plan, all found by review rather than declared at the time:**

1. **Commit 2 was unplanned.** It exists because the transitive walk read a JSDoc example as a
   dependency and turned the bin gate red; the reword had to precede commit 3 or CI would have gone
   red between them. Legitimate, but it was never added to this section.
2. **Commit 1's subject says "before pickup" and its body is not confined to that.** It also carries
   `dist-2-4: ready-for-dev → review` and a note quoting `npm test` 1890/1889 — gate results for
   files that land in commit 3, three commits later. At `a1211f2d` the repository asserts a
   review-ready story and a test count for code that does not exist. Pushed, so the remedy is the
   forward-pointing correction now in `sprint-status.yaml`, not a rewrite.
3. **Commit 3 omitted the story file**, leaving `sprint-status.yaml` at `review` while this file
   still read `ready-for-dev` with 29 unchecked boxes — the same tracker-vs-artifact drift the
   pre-flight opened this session by fixing.
4. **Commit 5 is a strictly worse instance of deviation 2, and this table did not name it until
   Round 3.** `fca5fcf7`'s subject and body describe an I113 pointer edit — *"Pointer only — no
   rescore, no reinstatement, MVP scope unchanged"* — while carrying Round 1's entire code
   remediation and this story's whole record. `git log -- scripts/audit/lib/installed-tree.js`
   returns only `8b5d5760` and `fca5fcf7`, so that file's history is unreadable from its commit
   subjects. The next commit, `0503f9b7`, is titled *"the edit `fca5fcf7` was meant to carry"* —
   so it did not perform its stated change either. **Carry this forward:**
   `backlog-integrity.js`'s owed-close scan reads commit subjects, and across this story four
   commits' subjects did not describe their contents.

## Change Log

| Date | Change |
|---|---|
| 2026-08-29 | Story created. FR13 wording ambiguity resolved (code → file, not `files[]` → disk); per-file `_config` copy path documented; out-of-order authoring flagged. |
| 2026-08-30 | AC3 amended per ADR-004 (accepted question 3): the assertion now tests invocability — every declared unit resolves to a generated wrapper — not module-directory presence alone. Rationale added to Dev Notes; `dist-2-6` dependency row updated. |
| 2026-08-30 | Implemented. Assertion built at `scripts/audit/lib/installed-tree.js` + `scripts/audit/assert-installed-tree.js`, wired into `try-fresh-install.sh` as a REPORTING block — not the verdict; `dist-2-6` wires it. Observed red on both targets, harness still exits 0. Dependency walk made transitive, closing I153's titled gap; six of its deferrals filed as **T101**. Two operator decisions taken mid-story: reword the JSDoc rather than add a comment-stripper, and add the ADR-004 **C1** assertion AC3 as written does not cover. Status ready-for-dev → in-progress → review. |
| 2026-08-30 | Round 1 code review — three layers run as independent subagents (Blind Hunter 17 findings, Edge Case Hunter 14, Acceptance Auditor 11; 42 raised, 28 after dedup, **0 dismissed as noise**). 2 decision-needed resolved by the operator, **26 patches applied**, 2 deferred. The three most serious were each raised independently by two or three layers and all were things the author had looked directly at: the `WRAPPER_RULES` rot alarm asserted only that a file had N lines (mutation-proven — `:909`→`:1` left the suite green), so it was **a fifth instance of the fail-open pattern this story exists to close**; ADR-004 C1 closed only the missing-file form of the vacuity, measured at exit 0 with four skills unreachable; and a total module-arrival failure exited 2 (`ENV_FAIL`), filing the maximal product defect as an environment problem. Also corrected: three of five generator citations pointed at comments or guards, `alsoRead` cited a write-side constant, `arrivesVia` cited a log line, the backlog receipt quoted a row count that was wrong twice. Suite 1890 → 1904 tests (45 in this file, up from 31). Status review → done. |
| 2026-08-30 | **Round 2 — the instrument was restructured, not patched a third time.** Three layers again (44 findings, 10 HIGH). **Every Round 2 HIGH was a defect in Round 1's corrections**, which is the trigger condition for `code-review-convergence`'s *"restructure, do not patch"* clause; operator ruled restructure. Reproduced before acting: the zero-unit guard **shadowed the C1 extension entirely** (every module vacuous → exit 2, stdout empty, the check unreachable in the one case it was added for, with a regression test locking it in); a missing shipped registry printed correct findings then **discarded them** via exit 2; `process.exitCode` fixed truncation and introduced a **hung process** on a registry holding a live handle, on the job that gates `publish` with no timeout; dedup **orphaned** a module into a false "declares nothing"; and a supported `excluded_agents` opt-out turned a correct install red. Two test defects were worse than the code ones: **the rot alarm still passed on all three citations Round 1 disproved** (it was `basename OR token`, so the data was fixed and the guard was not), and **the guard written to prove the alarm works never invoked it** — deleting the alarm left 45/45 green, the Round 1 defect class reproduced one level up. Fixes: `assert-installed-tree.js` rebuilt into four phases where exit 2 is confined to preconditions and phases 2-4 never return early; one mutually exclusive verdict per module; `fs.writeSync` then `process.exit`; the alarm extracted so alarms and guards share one predicate. Verified by mutation — all five mutations Round 2 measured as `fail 0` now fail. Suite 1904 → **1907, green on 3 consecutive runs** (Round 2 saw it red on 2 of 3). Record corrected too: the AC4 manifest table still carried all four superseded citations, the Gates paragraph still quoted the pre-review run, AC2 cited a verdict line its own remediation had moved, and the owed-close claim had gone stale. **Round 3 is triggered and owed** — the rule fires it on structural change alone, and this altered control flow and two exported signatures. Status held at `review` pending it. |
| 2026-08-30 | **Round 3 — the last allowed round. Four more fail-open paths, all fixed and mutation-guarded; the remaining 20 findings filed as T102 because the rule forbids a Round 4.** Three layers again. The fixes: a crash in phases 2-4 called `precondition()` and **discarded every finding already gathered** — Round 2's first HIGH surviving in the exception path the restructure did not cover; a load-time failure of the auditor exited **1**, which the harness reads as *findings printed* and walks past to its PASS banner, the exact hazard the file's own header claims `main()` is wrapped to prevent; the zero-unit alarm **could never be a true positive** (every route to zero units already emitted a finding, so its `out.length === 0` guard suppressed it) and its one reachable state was a **false positive on the supported `excluded_agents` opt-out** — deleted rather than repaired, since removing code cannot introduce the class of defect every prior round's repair did; and a multi-segment glob such as `_bmad/bme/**/*` bypassed the `unresolvable` channel, silently shrinking the expectation set. Also deduplicated `files[]` entries, so one module yields one verdict. Record corrected: AC7's pasted positive control described a run predating the C1 extension and is **no longer reproducible** — with C1 in force there is no exit-0 configuration for this package until 2.6 extends the generator; the commit table omitted `fca5fcf7`, which carried Round 1's entire code remediation under an I113 subject; the backlog receipt still quoted a row total Round 2 had already retired elsewhere; and the Gates line read *1907 tests, 1907 pass, 1 skip*, which is arithmetically impossible. Suite **1914 / 1913 pass**, lint 0/0, docs:audit 0, harness exit 0 with both AC6 targets firing. **T102 blocks `dist-2-6`'s wiring** — safe to defer only because `$TREE` gates nothing today. |

## Dev Agent Record

### Agent Model Used

Claude Opus 5 (1M context) — `claude-opus-5[1m]`, via the `bmad-dev-story` workflow (Amelia).

### Debug Log References

`bash scripts/audit/try-fresh-install.sh` run 5× on 2026-08-30: two pre-wiring baselines, one red-with-regression (see AC5 note below), two final runs compared for determinism. Two installed trees kept with `KEEP=1` for the positive control. CI artifact path unchanged (`.fresh-install-logs/`).

### The AC4 manifest, and where it lives

Task 1's last subtask says *"write the manifest into Dev Notes before coding"*. **It is recorded here, not in Dev Notes** — `dev-story` permits this agent to modify only the frontmatter `baseline_commit`, the task checkboxes, this Dev Agent Record, File List, Change Log and Status. Editing Dev Notes would have been out of contract. It **was** derived before any code was written; only its location moved.

Four entries, each carrying the call site that reads it and the installer code that puts it there. Curated, not inferred.

| File | Read at | Arrives via | Why absence is a defect |
|---|---|---|---|
| `_bmad/_config/skill-manifest.csv` | `convoke-export.js:360` (also `export-engine.js:98`, `convoke-doctor.js:322`) | `refresh-installation.js:585` | `convoke-export` resolves every skill through it — absence is I139 exactly |
| `_bmad/_config/agent-manifest.csv` | `validator.js:286` (also `export-engine.js:168`) | `agent-manifest-generator.js:308` | the installer regenerates it during refresh, so a post-install absence means that step did not run |
| `_bmad/_config/taxonomy.yaml` | `convoke-doctor.js:980` (also `artifact-utils.js:125`) | `refresh-installation.js:1038` | a fresh install runs no migrations, so the installer seeds it directly; without it doctor fails its own Taxonomy checks |
| `_bmad/_config/bmm-dependencies.csv` | `convoke-doctor.js:763` — via the constant `BMM_DEPS_CSV_REL`, which is why no grep can find it (also `audit-bmm-dependencies.js:642`) | **nothing** | the FR13 red target; its "must arrive" status is Story 2.5's decision, not a property of the code |

Verified against a real install rather than reasoned: three arrive, one does not. The rot alarm in `tests/audit/installed-tree.test.js` asserts every citation still resolves — and **it fired twice during this story**: once on `BMM_DEPS_CSV_REL` (the line names a constant, not the file, so the entry now carries an explicit `token`), and once when this story's own edit to `export-engine.js` shifted `:84`→`:98` and `:154`→`:168`. Both were real; both were fixed by re-deriving from source.

### Completion Notes List

**AC2 — the check is deliberately NOT in the verdict, and Story 2.6 is the wiring story.**
`$TREE` is referenced nowhere in the verdict condition at `try-fresh-install.sh:406`, and the AC's stated command returns empty. *(Cited as `:391` until Round 2 — the AC2 note added by Round 1's own remediation pushed the verdict down 15 lines and its citation was not re-derived, in the story whose thesis is citation rot.)*

> **Corrected after Round 1 review (all three layers raised it).** The sentence above was previously "`$TREE` is set, printed, and referenced nowhere in the condition", which was *true and incomplete*: `$TREE` is also referenced in an `exit "$ENV_FAIL"` a few lines earlier, and that **is** a failure path — the thing AC2 words as forbidden. Worse, the AC's own verification is structurally incapable of detecting it: the grep watches the verdict condition and can never see an `exit` added above it, so the proof did not test the claim. **Operator ruling 2026-08-30: the escalation stays.** A check that cannot run must not let the harness report health — that is the fail-open class this story exists to close. It now fires on any exit code other than 0 or 1 (previously only 2, so 127/126/signal codes walked through to PASS), and it can no longer fire on a product defect, because the zero-unit branch distinguishes "modules missing" (exit 1) from "modules arrived, nothing derived" (exit 2). **AC2 is met in substance and deviated from in letter, deliberately and on the record.** A verification that would actually catch this is: assert no new `exit` appears between the assertion block and `COMPLETED=1`. The harness exits **0** on a tree where the assertion reports two findings — uncomfortable by design. `fresh-install` runs on every push and PR and `publish` `needs:` it, so a gate merged red blocks the repository; NFR10 requires a gate *demonstrated* failing, not *merged* failing. **Story `dist-2-6` adds `$TREE` to that condition in the same commit that turns it green.**

**AC6 — observed failing on both targets, in one run.** Verbatim, at this story's HEAD:

```
==> Every declared bin is present and loadable
    all 14 bins present, shipped, parseable, and their requires resolve

==> Everything shipped arrives in the project, and every declared unit is invocable
    FAILED: _bmad/bme/_portability/ is in files[] but did not arrive in the project
    FAILED: _bmad/_config/bmm-dependencies.csv is read at runtime by scripts/convoke-doctor.js:763 but did not arrive in the project
    [installed-tree status 1]

========================================
PASS — a new user gets a working, self-consistent install.
```

Byte-identical across two consecutive runs. The second target is **conditional on Story 2.5's decision** that the registry should ship and arrive: `convoke-doctor` treats its absence as a soft governance warning by design (live: `⚠ BMM dependencies: registry missing`, 1 warning, 27 checks passed, exit 0). If 2.5 revisits that, this entry leaves AC4's manifest and this demonstration must be re-based.

**AC7 — shown failing on a broken input AND passing on a good one, both directions.** Positive control against a kept installed tree, clearing findings one at a time: baseline → 2 findings; add `bmm-dependencies.csv` → 1 finding, the other persists; add `_portability/` with a conforming `config.yaml` → **4 findings**, one per declared skill, each citing `refresh-installation.js:914`. 55 tests cover the same in isolation.

> **Corrected after Round 3.** This previously read "add `_portability/` with a conforming `config.yaml` → exit 0, `6 shipped bme module(s) arrived, 15 declared unit(s) resolve`". That was a true observation of a run made *before* the ADR-004 C1 extension landed, and it is no longer reproducible: with C1 in force there is **no exit-0 configuration for this package** until `dist-2-6` extends the generator, because a module declaring four skills whose wrappers nothing emits is precisely what the check now reports. The sentence also cited `:909` — a comment — after the rule had been re-derived to `:914`. The green half of AC7 therefore rests on the unit tests, which construct a tree where declarations and wrappers agree. Said plainly rather than left as a narrative a reader cannot reproduce. Every decision path fails **closed**: the CLI distinguishes exit **2** (could not run) from **1** (findings) and never conflates either with 0; `main()` is wrapped so an unexpected throw lands on 2 rather than node's default 1, which the caller would read as "findings"; the harness escalates a 2 to `ENV_FAIL`. An empty `files[]` enumeration, an empty manifest and a zero-unit derivation are each treated as harness failures rather than as health.

**SCOPE ADDED TWICE, both with operator approval — ADR-004 C1, and then its depth.**

> **Corrected after Round 1 review.** The paragraph below originally claimed C1 closed the vacuity path. It closed only the **missing-file** form. Review measured the other: a `config.yaml` containing just `version: 4.0.1` passes the file check and the parse check, declares nothing, and the run reported `2 shipped bme module(s) arrived, 2 declared unit(s) resolve` — **exit 0** — on a `_portability` holding four skills on disk. The story's own AC7 green demonstration was built on exactly that config shape, so the demonstration was weaker than it read. **Operator ruling 2026-08-30: extend it.** `modulesDeclaringNothing` now fails when an arriving module carries a config and still declares no invocable unit, and the previously-green tree exits 1. **This constrains `dist-2-6`:** conforming `_portability` means its config must DECLARE the four skills, not merely exist.

 The positive control found a green-on-defect path AC3 as written does not close: a `_bmad/bme/_portability/` directory copied into a project **with no `config.yaml`** declares nothing, so AC3's invocability half has nothing to check and passes by vacuity. Measured, not reasoned — the run reported `6 shipped bme module(s) arrived, 15 declared unit(s) resolve`, exit 0, on a tree whose four skills are unreachable. That is a gate going green on the defect it was built to catch, the failure `project-context.md` records twice from 2026-08-15. Raised rather than decided; **approved by the operator 2026-08-30**. `modulesWithoutConfig` now asserts C1 and the previously-green case exits 1, guarded by two tests — one of which goes green again if the CLI call is removed.

**DISCREPANCY between ADR-004 C2 and the shipped generator — the check follows the code.** C2 states a workflow is declared by `standalone: true`. The Enhance path (`refresh-installation.js:863`) emits a wrapper for **every** object-shaped workflow entry, and `_enhance`'s sole entry carries no `standalone` flag — yet `bmad-enhance-initiatives-backlog` is generated and present in every install. Implementing C2 literally would have left a whole module's operator surface invisible to the gate. The derivation therefore mirrors the five generator code paths, each rule citing its call site, with a test that those citations still resolve. **Worth an ADR-004 amendment; not fixed here.**

**FR18 is necessary but NOT sufficient for BUG-19 — recorded, not fixed.** `skill-manifest.csv` reaches the project through a **named per-file** block (`refresh-installation.js:551`, `:585`), not a directory copy, and `checkBmmDependencies` reads from `projectRoot`. Story 2.5's `files[]` membership will not by itself silence the doctor warning; it needs a copy step too.

**AC5 / I153 — and the one thing that went wrong.** The walk is transitive: `convoke-install` went from **1** file examined to **11**, `convoke-update` to **20**, all 14 bins still clean. But going transitive reached `scripts/portability/export-engine.js`, whose JSDoc usage example contained a literal `require` call — the extractor is a regex with no lexer, so it read the comment as a dependency, failed to resolve it, and **turned the existing bin gate RED on a healthy package**. That is exactly the interaction this story's Dev Notes predicted, and the Dev Notes instruction was *"stop and raise it — do not add a parser"*, so the operator was asked rather than the extractor quietly extended. **Decision: reword the JSDoc** — also more correct, since the old relative path resolved only from the project root. A comment stripper was declined on a stated ground rather than on cost: a hand-rolled JS stripper that mishandles a string, regex literal or template literal would delete real code and silently hide a missing require, trading a loud safe failure for a quiet unsafe one. *The first attempt at that warning comment reintroduced the bug by quoting the shape it was warning about; it is now prose.* The class stays open as **T101**.

**I153 closed on its title, not its full text (AC5, Task 7, operator-approved).** The row bundled the one-hop gap with six further deferrals — ESM blindness (a genuine fail-open: no `require()` found is the PASS value), the no-lexer hazard (no longer latent, see above), template-literal/`import()` skips, optional-require-in-try/catch, the trap's output missing from `run.log`, and the tee/trap race. Closing wholesale would have removed them from the active backlog, so they are filed as **T101** (5.1) per `project-context.md`'s *"prefer filing instance and gate as separate rows"*. `node scripts/audit/backlog-integrity.js`: **PASS** — lanes ordered, no closed rows in a lane, references resolve. *(This quoted "759 rows … owed-close 0" until Round 3. The total moves whenever anyone appends — 758, then 759, then 760, now 762 — and the owed-close scan now WARNs on `I113` and `I134` from unrelated parallel commits. Round 2 corrected the same claim in the Commit Plan and the backlog receipt and missed it here.)*

**Counts derived at implementation time, never carried forward.** `files[]` declares **6** `_bmad/bme/*` modules; **5** arrive (`_portability` does not). **15** operator-invocable units are declared — **12** agents (7 Vortex + 4 Gyre + 1 standalone bme) and **3** workflows (1 Enhance + 2 Artifacts) — and all 15 resolve to a wrapper. The manifest holds **4** runtime data files, **3** of which arrive. **14** bins. None of these numbers is asserted by the code; a zero in any of them is treated as a broken derivation, not as health.

**Gates** *(re-derived after Round 2 — the figures here previously reported the pre-review run)*. `npm run lint` clean (0 errors, 0 warnings). `npm test` **1914 tests, 1913 pass, 0 fail, 1 pre-existing skip**, green on consecutive runs — Round 2 observed the suite red on two of three runs, and the flakiness went with the synchronous-flush fix. *(Round 3 caught this line reading "1907 tests, 1907 pass, 1 skip" — internally impossible, since pass plus skip must equal tests. Both halves re-derived.)* `npm run docs:audit` zero findings. `node scripts/audit/backlog-integrity.js` PASS. Harness run twice, byte-identical output, exit 0 both times.

**Also included, and out of this story's scope — flagged rather than buried.** `sprint-status.yaml` was reconciled against the repository before pickup, under `project-context.md`'s `staleness-preflight-for-backlog-pickup` (parallel-tracks arm, no age exemption). Three Epic 2 rows disagreed with the tree: `dist-2-1` → `done` (FR11 shipped 2026-08-24 in `4556f4f0`; verified at HEAD against `ci.yml:178`, `:122`, `:527` and `:3-8` — not from the commit message), `dist-2-6` → `ready-for-dev` (its story file says so, re-authored in `78a3d38c`), and `dist-epic-2` → `in-progress`. `dist-2-5` was deliberately left at `backlog`: FR17 shipped in `21ae3105` but FR18 did not, so `done` would be a false claim. Pre-flight verdict on the Epic 2 rows: **RED before, GREEN after.** This belongs in its own commit — see the Commit Plan.

### File List

**New**
- `scripts/audit/lib/installed-tree.js`
- `scripts/audit/assert-installed-tree.js`
- `tests/audit/installed-tree.test.js`

**Modified**
- `scripts/audit/try-fresh-install.sh`
- `scripts/portability/export-engine.js`
- `_bmad-output/planning-artifacts/convoke-note-initiative-lifecycle-backlog.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `_bmad-output/implementation-artifacts/dist-2-4-assert-the-installed-tree-carries-what-was-shipped.md`
