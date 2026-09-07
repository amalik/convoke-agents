---
baseline_commit: 4769587f24e8875e443e36c4795ae9daffff2cda
---

# Story 2.6: Make `_portability` reachable, and wire the installed-tree assertion in

Status: review

> **Re-authored 2026-08-30 against [ADR-004](../planning-artifacts/adr/4-0-1/adr-004-bme-module-contract.md).**
> The previous draft's AC1 ("copy the tree by the same mechanism as the other `_bmad/bme/*`
> modules") could not produce its AC2 ("the skills resolve when invoked"). There is no single
> such mechanism, and copying does not create wrappers under any of them. See *What changed and
> why* in Dev Notes before reading the ACs.

## Story

As a **Convoke operator**,
I want the portability skills to be usable after I install,
so that **a capability that ships is a capability I have**.

### What this story is, in one line

Make `_bmad/bme/_portability/` conform to the module contract ADR-004 states (C1-C4) so the
**existing** wrapper generator reaches it — then, in the same commit that turns it green, wire
Story 2.4's installed-tree assertion into the blocking path.

---

## Acceptance Criteria

**AC1 — The module conforms to C1 and C2**

**Given** `_bmad/bme/_portability/` today contains only `skills/` — no `config.yaml`, no
`workflows/` — while all five other `_bmad/bme/*` modules carry `config.yaml` plus workflows
and/or agents (ADR-004, enumerated)
**When** this story completes
**Then** `_bmad/bme/_portability/config.yaml` exists, carrying `name`, `version`, `description`
and a `workflows[]` entry for each of the four skills with `standalone: true`, mirroring
`_bmad/bme/_artifacts/config.yaml`
**And** `_bmad/bme/_portability/skills/` is renamed to `_bmad/bme/_portability/workflows/`, so
each skill sits at `_bmad/bme/_portability/workflows/<name>/` — the layout
`epic-skill-portability-ux.md:78-90` specified and Story 6.1 did not deliver
**And** the rename is performed with `git mv` so history follows the files
**And** no fifth module shape is introduced — the count of distinct declaration mechanisms is
**unchanged** at two (agent-registry entry; `config.yaml` workflow with `standalone: true`)

**AC2 — The four load directives become absolute, or the wrapper breaks**

**Given** each portability `SKILL.md` currently loads its workflow by a **relative** link —
`Follow the instructions in [workflow.md](workflow.md).` — while the generator copies
**`SKILL.md` alone** (`refresh-installation.js:935`), never `workflow.md`
**When** the wrapper is generated at `.claude/skills/<name>/SKILL.md`
**Then** a relative `workflow.md` would resolve inside `.claude/skills/<name>/`, where no such
file exists — so all four directives are rewritten to the absolute form the Artifacts skills
already use:
`LOAD the FULL {project-root}/_bmad/bme/_portability/workflows/<name>/workflow.md`
**And** this is verified by reading the generated wrapper in a real install, not by inspecting
the source `SKILL.md`

**AC3 — The manifest's four path rows move with the files**

**Given** `_bmad/_config/skill-manifest.csv` rows 91-94 name
`_bmad/bme/_portability/skills/<name>/SKILL.md` in the `path` column, and
`scripts/portability/validate-classification.js:249` derives its dependency-resolution root from
that column
**When** the rename in AC1 lands
**Then** all four rows are updated to `workflows/` **in the same commit** — a rename that leaves
them behind converts four working rows into four new `[BROKEN-DEP]` findings
**And** `node scripts/portability/validate-classification.js` reports **no new findings** against
the pre-story baseline of 4 (which belong to Story 2.8 and are untouched here)
**And** the row count is re-derived at implementation time rather than trusting the four cited
here (`derive-counts-from-source`)

**AC4 — An install path exists, and it stamps the config**

**Given** no install path reaches `_portability` today: the only generic module loop iterates
`EXTRA_BME_AGENTS` (`refresh-installation.js:227`, `agent-registry.js:228`) and is driven by an
**agent registry**, so a module with no agents is never visited
**When** this story completes
**Then** `refreshInstallation()` copies the module and generates a wrapper per declared
`standalone: true` workflow, mirroring the Artifacts blocks (copy at `:424`, wrapper generation
at `:909-947`), including the `isSameRoot` dev-environment skip both already honour
**And** the copied `config.yaml` has its `version` **stamped to the package version**, per the
I137 precedent — `_team-factory` was the one module copied without stamping, and a fresh,
successful install immediately failed Convoke's own version-consistency check and told a new
user to go and update
**And** the stamping uses `doc.set('version', …)` rather than `mergeConfig`, for the reason
recorded at `:255` — `mergeConfig`'s structural defaults are Vortex-specific and would seed
wrong values into any field a submodule config omits

**AC5 — The orphan sweep learns the new names**

**Given** `cleanupOrphanWorkflowWrappers` (`:949-976`) builds its union from the Enhance and
Artifacts configs only, and its Strategy 2 deletes a directory only when the name matches a
**known Artifacts workflow name**
**When** this story completes
**Then** portability workflow names are added to that union on the same footing, so a workflow
later removed from `config.yaml` has its wrapper cleaned rather than stranded
**And** it is verified by execution that the four new wrappers are **not** deleted by the sweep
on a second consecutive refresh — the failure this AC exists to prevent is a wrapper that
installs and then disappears on the next update

**AC6 — The documentation that certifies the bug as a design choice is corrected**

**Given** `INSTALLATION.md:116` states the module *"is **not** copied into your project —
`convoke-export` runs from the package itself, so there is nothing to install"* — true of the
**bin**, false of the four **skills**, and the exact shape
`project-context.md`'s `slash-command-ux-for-user-facing-tools` rule names
**When** this story completes
**Then** that sentence is rewritten: the bin continues to run from the package, and the skills
install like every other module's
**And** the module is added to the module table above it, which currently lists five

**AC7 — Invocability is proven on a real install, not inferred**

**Given** the defect reproduces in this repository today — all four skills are absent from its
own `.claude/skills/` with the source tree present
**When** this story completes
**Then** a fresh install into a clean temp project is performed, and all four wrappers are
confirmed present at `.claude/skills/<name>/SKILL.md`
**And** at least one skill is invoked end-to-end and observed to resolve its workflow — presence
of the wrapper file is necessary and not sufficient (C4)
**And** the transcript or command output is recorded in Completion Notes

**AC8 — Story 2.4's assertion is wired in blocking, asserting invocability (C2), not presence (C4)**

**Given** Stories 2.5 and 2.4 have both landed, so the assertion's two findings
(`bmm-dependencies.csv`, `_portability`) are resolved and it has none left
**When** this story completes
**Then** the assertion is placed in `try-fresh-install.sh`'s failure path, **blocking**, in the
same commit that turns it green — never merged red into a job that gates every PR and every
publish
**And** the assertion checks that **every unit declared under C2 resolves to a generated
`.claude/skills/` wrapper after install** — not merely that the module directory arrived. Per
ADR-004's accepted question 3: a presence-only assertion goes **green** on a `_portability` tree
that was copied but stays uninvocable, which is the precise defect this epic exists to catch and
the failure `project-context.md` records twice from 2026-08-15
**And** Story 2.4's AC3 was amended to invocability on 2026-08-30, so this story wires the
assertion **unchanged** — verify that at pickup rather than assuming it. If 2.4 nonetheless
shipped against presence, amend the shipped assertion here and say so in Completion Notes;
never layer a second check beside it

**AC9 — Every count is derived, not carried**

**Given** this story cites four skills, four manifest rows, five conforming modules and two
declaration mechanisms
**When** any of those numbers appears in the implementation, its tests or its commit message
**Then** it is re-derived at implementation time from `package.json`, the tree and the manifest
(`derive-counts-from-source`)

> *The previous draft cited **NFR6** here. NFR6 was subtracted from the epic on 2026-08-19 and is
> explicitly not reused; the binding rule is `derive-counts-from-source` in `project-context.md`.
> Corrected 2026-08-30 (readiness Finding 11).*

---

## Tasks / Subtasks

- [x] **T1 — Conform the module (AC1, AC2)**
  - [x] `git mv _bmad/bme/_portability/skills _bmad/bme/_portability/workflows`
  - [x] Author `_bmad/bme/_portability/config.yaml` modelled on `_bmad/bme/_artifacts/config.yaml`, four `standalone: true` entries with `entry: workflows/<name>/workflow.md`
  - [x] Rewrite the four `SKILL.md` load directives to the absolute `{project-root}` form
- [x] **T2 — Move the manifest rows with the files (AC3)**
  - [x] Update the `path` column on all four rows; re-derive the count
  - [x] Run `validate-classification.js`; confirm findings unchanged at baseline
- [x] **T3 — Add the install path (AC4)**
  - [x] Mirror the Artifacts copy block; honour `isSameRoot`
  - [x] Stamp `version` with `doc.set`, per I137
  - [x] Mirror the Artifacts wrapper-generation block
- [x] **T4 — Extend the orphan sweep (AC5)**
  - [x] Add portability names to the union; verify wrappers survive two consecutive refreshes
- [x] **T5 — Correct INSTALLATION.md (AC6)**
- [x] **T6 — Prove it on a real install (AC7)**
  - [x] Fresh install to a temp project; confirm four wrappers; invoke one end-to-end
- [ ] **T7 — Wire 2.4's assertion in, blocking, asserting invocability (AC8)** — **BLOCKED on T102, see Completion Notes**
  - [x] Confirm the assertion has zero findings BEFORE wiring — **done: `[installed-tree status 0]`**
  - [x] Verify 2.4 shipped C2 not C4 — **done: it ships `missingWrappers`, no amendment needed**
  - [ ] Wire `$TREE` into the verdict — **NOT DONE, blocked**

### Review Findings

Round 1 — Blind Hunter, Edge Case Hunter and Acceptance Auditor as independent `claude-sonnet-5`
subagents. 16 raw, 13 after dedup. **0 decision-needed, 8 patch, 5 defer, 3 dismissed.** No HIGH
after triage, so **Round 2 is not triggered**; see the severity note below, which explains the one
call that could have gone the other way.

- [x] **[Review][Patch] Three comments still promised that dist-2-6 would wire `$TREE`, one calling the deliberate deferral "the bug"** [scripts/audit/try-fresh-install.sh:371, scripts/audit/assert-installed-tree.js:61, scripts/audit/lib/installed-tree.js:27] — Acceptance Auditor. The harness read *"If you are reading this after 2.6 shipped and `$TREE` still appears nowhere in the verdict, that is the bug."* After the operator ruling that is false, and it is the most harmful of the three: a reader acting on it would wire a gate carrying T102's fail-opens into the path `publish` depends on — undoing the ruling. All three rewritten to state the deferral, name T102 as the owner, and record that the preconditions are already met.
- [x] **[Review][Patch] The docblock restated nine line numbers in prose that no alarm checks — and said they were checked** [scripts/audit/lib/installed-tree.js:8-12] — Blind Hunter. The header carried `:551`/`:585` and `:782`/`:811`/`:837`/`:863`/`:914` beside the assurance they were *"re-derived and anchor-checked in WRAPPER_RULES below"*. `auditCitations` walks the structured tables and never the header, so the +60 shift failed every structured citation loudly and left every prose copy stale in silence, pointing at a template string, an `fs.existsSync` guard and two closing tags. **Numbers deleted from the header rather than updated** — restating a number where nothing checks it is what rots, the same conclusion this epic reached about the "ten self-referential links" claim in dist-2-3c.
- [x] **[Review][Patch] "Seven line citations" — the sentence listed nine** [story record] — Blind Hunter and Acceptance Auditor, independently. All nine values were correct; the count of my own list was not. Fourth miscount in this session, in the paragraph celebrating rot-alarm discipline.
- [x] **[Review][Patch] The claim "the alarm caught every one" was false** [story record] — Blind Hunter. It caught the nine structured citations. The prose copies above went stale unnoticed, which is the finding immediately above this one.
- [x] **[Review][Patch] AC9's "the one number this story does NOT state anywhere is four" is false** [story record] — Acceptance Auditor. "four" appears in AC9's own Given clause, throughout the record, and in **eight comment lines this diff adds**. Replaced with the claim that is actually true and is all AC9 requires: no numeric literal `4` drives control flow in any new code.
- [x] **[Review][Patch] AC6 was half done — the directory-tree diagram still omitted `_portability`** [INSTALLATION.md:69-96] — Blind Hunter. The prose paragraph and the module table were corrected; the tree diagram a few lines above still listed five modules, so a reader following the diagram would not know the directory exists after install. Added, with the `└──` connector moved to the new last row.
- [x] **[Review][Patch] The doc-comment test would have passed with all but one comment dropped** [tests/unit/refresh-installation-portability.test.js] — Edge Case Hunter. It asserted `body.includes('#')`. Now counts the comment lines in the source config and requires the same count to survive the stamp, with a guard that the source carries some at all so the test cannot pass vacuously.
- [x] **[Review][Patch] File List omitted the backlog file** [story record] — Acceptance Auditor. The T102 amendment is the backlog-side record of this story's own deferral, and the accounting did not mention it. Added, along with two other files the first draft missed.

**Deferred — all five are patterns MIRRORED from the Artifacts block, not introduced here.** Verified: the Artifacts loop at `refresh-installation.js:974` and its `path.join(skillsDir, workflow.name)` at `:982` have the identical shape. Fixing only the portability copy would leave the two blocks inconsistent and close nothing as a class.

- [x] **[Review][Defer] No `Array.isArray` guard on the wrapper loop, and no try/catch around it** [scripts/update/lib/refresh-installation.js:1016] — deferred, pre-existing — Edge Case Hunter. `workflows:` written as a YAML mapping is truthy, bypasses `|| []`, and crashes `for...of` with an uncaught TypeError. `validator.js`'s equivalent DOES guard (`Array.isArray(config.workflows)`), so the two halves of the same contract disagree.
- [x] **[Review][Defer] `workflow.name` used verbatim in `path.join`** [scripts/update/lib/refresh-installation.js:1024] — deferred, pre-existing — Edge Case Hunter. A `name` containing `..` or `/` is honoured, and a non-string throws. **This is T102(a)'s defect class on the WRITE side** — T102(a) is the same hazard in the assertion that READS these wrappers. They should close together.
- [x] **[Review][Defer] A config parsing to an empty or non-object value is a silent no-op** [scripts/update/lib/refresh-installation.js] — deferred, pre-existing — Edge Case Hunter. The "not found" and "parse error" branches both `changes.push` a diagnostic; this third one does not, so the module silently does not install.
- [x] **[Review][Defer] Duplicate and cross-module wrapper-name collisions are silent last-write-wins** [scripts/update/lib/refresh-installation.js] — deferred, pre-existing — Edge Case Hunter. Two workflows declaring one name, in the same config or across Artifacts and Portability, produce one wrapper and no finding.
- [x] **[Review][Defer] A source `SKILL.md` that is a directory passes every existence check** [scripts/update/lib/refresh-installation.js] — deferred, pre-existing — Edge Case Hunter. `fs.existsSync` is true for a directory and `fs.copy` would copy the tree.

**Delta review of the Round 1 remediation — and it found that the remediation reproduced the defect
it was fixing.** Run because the set-equality check failed: Round 1 saw 22 files, the change set had
grown to 24, and two of the additions were SOURCE files no reviewer had seen
(`scripts/audit/assert-installed-tree.js`, `scripts/audit/try-fresh-install.sh`), both modified
during remediation. A new test had also been written, which `code-review-convergence` explicitly
excludes from a round's coverage. Not a Round 2 — no HIGH — this closes Round 1's coverage gap.

- [x] **[Review][Patch] The fix for stale prose citations left stale prose citations, in the same entries it corrected** [scripts/audit/lib/installed-tree.js] — the `arrivesVia` fields were corrected (`:585`->`:645`, `:1038`->`:1144`) while the inline comments directly ABOVE them still cited `:585`, `:551` and `:1038`. Review then found **four more** the first pass never noticed — `:863`, `:783`, `:812`, `:837` — now pointing at a closing tag, an exclusion check, a `readdir` and a `console.log`. Seven prose citations broken by the +60 shift; the first pass fixed zero of them properly while writing a paragraph about why prose citations rot.
- [x] **[Review][Patch] INSTALLATION.md's tree diagram was left MALFORMED by the AC6 fix** [INSTALLATION.md] — moving `_artifacts/` from `└──` to `├──` and appending `_portability/` orphaned the two child rows beneath: the diagram showed `_artifacts/` with no children and `_portability/` owning children described as *"Migrate artifacts, portfolio status"* — Artifacts' workflows, not portability's. Repaired, with portability's real workflows named.
- [x] **[Review][Patch] `try-fresh-install.sh`'s header still stated a claim this commit set makes false** [scripts/audit/try-fresh-install.sh] — its "three failures none of the checks above can see" list still read *"`_portability` is in `files[]` and no install path copies it"*. That was the defect; this story fixed it, in a file the remediation was actively editing. Rewritten to keep it as the worked example of the class while stating it is no longer a live finding.
- [x] **[Review][Patch] The "20 open defects" figure in T102 does not reconcile with T102's own enumeration** [three files] — the new comments quoted 20, faithfully, from dist-2-4's Round 3 log. Counting T102's lettered sub-findings gives **17** (a)-(q), derived. All three now state 17, name (a)-(f) as the fail-open subset, and record that the 20 is inherited and unreconciled rather than silently repeating it.
- [x] **[Review][Patch] Unbalanced quotation mark in the superseded-text block** [scripts/audit/assert-installed-tree.js] — an opening `"` with no close before `*/`.

**The instrument was changed, not patched again.** `code-review-convergence`: *"If a round's HIGH findings are predominantly defects in the previous round's corrections, the next action is to change the instrument, not to patch again. Two failed attempts at the same fix predict a third."* Round 1 patched a docblock's line numbers; the delta found seven more of the same thing. So the rule is now **no `refresh-installation.js` line numbers in prose in `installed-tree.js` at all** — every one replaced by the construct's NAME (`for (const agent of AGENTS)`, `the enhanceConfig.workflows loop in section 6c`), which cannot drift when the file moves. Numbers survive only in `RUNTIME_DATA_FILES` and `WRAPPER_RULES`, where `auditCitations` checks them, and in one history quote explicitly marked as not maintained.

**Deferred from the delta, not patched:**
- [x] **[Review][Defer] `WRAPPER_RULES.standaloneWorkflow` cites the Artifacts generator as representative, so a portability wrapper failure names the wrong code path** [scripts/audit/lib/installed-tree.js] — deferred — `assert-installed-tree.js` prints `site` verbatim, so an operator debugging a broken portability wrapper is pointed at the Artifacts block. The docblock is honest that the rule is deliberately generic; the cost to the failure message was not stated and is real. Fix needs a per-module site, which is a shape change to the rules table.
- [x] **[Review][Defer] `readSite` for `agent-manifest.csv` cites a declaration, not the read, and has no `token` to catch it** [scripts/audit/lib/installed-tree.js] — deferred, pre-existing — the citation lands on `const manifestPath = path.join(...)`; the actual `readFileSync` is nine lines later. The alarm falls back to bare-basename matching, which the path literal satisfies — the exact declaration-not-a-read defect sibling entries call out. Needs a `token`, same fix shape as the entries that have one.
- [x] **[Review][Defer] The strengthened comment test is count-based, not content-based** [tests/unit/refresh-installation-portability.test.js] — deferred — it would pass if the round-trip preserved nine comment lines while scrambling their text. Verified by execution that the current round-trip is content-faithful (9/9 identical), so this is a narrower guarantee than the test's name claims, not a live failure.

**Dismissed, with the verification each got:**
- *(Blind)* T8's subtask says tests never use `PACKAGE_ROOT`, but two do — **true, and the subtask wording was corrected rather than the tests.** Passing `PACKAGE_ROOT` is the only way to exercise the `isSameRoot` branch, and `refresh-installation-artifacts.test.js` does exactly the same. Not a defect; an inaccurate checklist line.
- *(Blind)* "Verified by execution that wrappers survive THREE consecutive refreshes" outruns its automated evidence — **true; the record now says so.** The committed test does two; the third was a manual run during AC7 and is not reproducible from the diff. Claim scoped to what the tests back.
- *(All three)* Faithful-mirror and behaviour-preservation checks came back clean: 2c/2c-bis and 6d/6d-bis diffed line by line with no behavioural divergence; the `validateStandaloneWorkflowModule` extraction verified against all 9 pre-existing Artifacts tests; every gate number in the record re-executed to an exact match; and AC8's deferral confirmed consistent across the story file, Change Log, Completion Notes, sprint-status and the T102 row.

**Severity note, stated because the call was close and the convenient answer was also the one I reached.** The three stale comments were rated **MEDIUM**, not HIGH. HIGH was arguable: acting on *"that is the bug"* means wiring known fail-opens into the publish gate. It is MEDIUM because T102's row — amended by this story — now explicitly carries the wiring and names the defects, so the authoritative pointer a reader reaches is correct; the comment misleads, it does not control. Recorded plainly because rating it MEDIUM is what avoids a mandatory Round 2, and that is exactly the kind of judgement that should be visible rather than assumed.

- [x] **T8 — Tests**
  - [x] Mirror `tests/unit/refresh-installation-artifacts.test.js` for portability
  - [x] Extend `tests/unit/refresh-installation-orphan-cleanup.test.js` for AC5
  - [x] Add a validator block symmetric with `validator.js:638-694`, and cover it in `tests/unit/validator.test.js`
  - [x] Every test uses an isolated fixture dir, never `PACKAGE_ROOT` — **except the two `isSameRoot` dev-environment tests, which must pass `PACKAGE_ROOT` to exercise that branch at all. Precedented: `refresh-installation-artifacts.test.js` does the same. The blanket wording was inaccurate; flagged by review**

---

## Dev Notes

### What changed in this story, and why — read before the ACs

The previous draft asked you to *copy the tree* and expected the skills to then resolve. They
would not have. Three facts, each verified:

1. **There is no "the same mechanism."** Module installation is five bespoke code paths — Vortex
   (`:40`), Enhance (`:314`), Artifacts (`:424`), Gyre, and the `EXTRA_BME_AGENTS` loop (`:227`).
   The last is the only general-looking one and it is keyed off an **agent registry**;
   `_portability` has no agents, so nothing reaches it.
2. **Copying never creates a wrapper.** `.claude/skills/` entries are *generated* from
   declarations — agents (`:749`, `:810`, `:836`) or `standalone: true` workflows (`:909`).
3. **The tree that ships is the wrong half.** `epic-skill-portability-ux.md:78-90` specified both
   a module-side copy **and** a `.claude/skills/` wrapper, and said *"Both must exist."* What
   shipped is the module half, under `skills/` instead of `workflows/` and with no `config.yaml`,
   and the interface half was never built.

So the missing artefact is a **generated wrapper**, not a copied directory — and the cheapest way
to get one is to make the module look like the five that already work. That is ADR-004 option (a),
accepted 2026-08-30.

### The mechanism you are mirroring — read it first

`refresh-installation.js:424` (Artifacts copy) and `:909-947` (Artifacts wrapper generation).
That path already emits `.claude/skills/{workflow.name}/SKILL.md` using the workflow name
**verbatim**, which is exactly right here: all four portability skills already carry the `bmad-`
prefix, unlike Enhance which synthesises `bmad-enhance-${name}`.

The four directories are **already** in the Artifacts shape — each holds `SKILL.md` +
`workflow.md`, the same as `_bmad/bme/_artifacts/workflows/bmad-migrate-artifacts/`. Only the
parent directory name and the missing `config.yaml` differ. This is a smaller change than it
looks.

### Four traps, each verified rather than assumed

- **The relative load directive (AC2).** Portability's `SKILL.md` says
  `[workflow.md](workflow.md)`; Artifacts' says `LOAD the FULL {project-root}/…/workflow.md`. The
  generator copies SKILL.md alone. Copy portability's as-is and every wrapper points at a file
  that is not there. This is FR12's class arriving inside FR14's story.
- **The manifest rows (AC3).** Four rows name the `skills/` path. Rename without them and you
  manufacture four new `[BROKEN-DEP]` findings — in the very check Story 2.8 is trying to clear.
- **Version stamping (AC4).** I137, recorded at `:245-258`: the one module copied without
  stamping made a fresh successful install fail its own health check.
- **The orphan sweep (AC5).** Strategy 2 deletes only names matching known *Artifacts* workflows,
  so the new wrappers are safe today by accident rather than by design. Register them.

### The disproved risk — do not re-raise

**"Renaming a directory inside `files[]` is dangerous in a patch release."** Measured, not
assumed: `grep -rn "_portability" --exclude-dir=node_modules --exclude-dir=.git .` returns hits
only from `package.json:13`, `CHANGELOG.md:191`, `INSTALLATION.md:116` and planning artefacts.
**No code resolves into that directory** — which is the defect, and is also what makes the rename
safe. `files[]` carries `_bmad/bme/_portability/` as a directory entry, so it needs no edit.

### Cross-story dependencies

- **Blocked on Story 2.4** — it builds the assertion this story wires in. 2.4 is `ready-for-dev`.
- **Blocked on Story 2.5** — `bmm-dependencies.csv` must be in `files[]` first, or the assertion
  still has a finding and AC8 cannot land green.
- **✅ Companion amendment to Story 2.4 — DONE 2026-08-30.** Its AC3 previously asserted
  **presence** (*"fails if any `_bmad/bme/*` entry in `files[]` is absent from the installed
  project tree"*); ADR-004's accepted question 3 rules the assertion must check **invocability**,
  and 2.4's AC3, Dev Notes and change log were amended accordingly before it was built. **So AC8
  wires the assertion unchanged.** Verify at pickup — if 2.4 shipped against presence anyway,
  AC8 amends it here instead. Exactly one of those, never both.
- **Independent of** 2.7 and 2.8, which may run at any point.

### References

- [ADR-004 — the module contract](../planning-artifacts/adr/4-0-1/adr-004-bme-module-contract.md) — C1-C4, options, accepted decision
- [Readiness report 2026-08-30](../planning-artifacts/implementation-readiness-report-2026-08-30.md) — Findings 6, 11, 12
- `epic-skill-portability-ux.md:78-96` — the layout originally specified, and Story 6.1's judgment call
- `refresh-installation.js:227` (agent-driven loop), `:424` (Artifacts copy), `:909-947` (wrapper generation), `:949-976` (orphan sweep), `:245-258` (I137)
- `scripts/portability/validate-classification.js:249` — why the manifest `path` column matters
- I141 (this defect), I137 (stamping precedent), I153 (absorbed by Story 2.4)

---

## Commit Plan

Single commit — AC8 requires the wiring to land with the fix that turns it green.

```
fix(dist-2-6): conform _portability to the module contract and wire the installed-tree gate
```

Files: `_bmad/bme/_portability/config.yaml` (new), `_bmad/bme/_portability/workflows/**` (renamed
from `skills/**`, four `SKILL.md` edited), `_bmad/_config/skill-manifest.csv`,
`scripts/update/lib/refresh-installation.js`, `scripts/audit/try-fresh-install.sh`,
`INSTALLATION.md`, `scripts/update/lib/validator.js`, `tests/unit/*`.

Body must record: the fresh-install transcript from AC7, whether Story 2.4's AC3 was amended here
or before, and every count re-derived per AC9.

---

## Change Log

| Date | Change |
|---|---|
| 2026-09-07 | **CI red on `agent-surface-parity` after `c4a3c18c` — the failure was its SECOND step, `install-scope-check.js`, which I never ran.** Parity itself passes; CI compares against the last release tag (`v4.0.1`), and my local runs used `main`. **Gate-list gap, mine:** the job runs two steps and my verification covered neither correctly. Root cause: the module-copy block writes into the operator's project, and the scope check is a snapshot control requiring conscious acknowledgement of any new write — 13 -> 14. Verified before updating the snapshot that every write in both new blocks targets `path.join(projectRoot, '_bmad', 'bme', '_portability')` or `<projectRoot>/.claude/skills/`, the same destinations and remove-then-copy shape as the Artifacts block; the checker independently reported **no scope violations**. **The snapshot moved by ONE for a change that added SIX writes** — `WRITE_OP_RE` matches literal `fs.*` only, and the new blocks use fs-extra's `copy`/`remove`/`ensureDir`. The one write it sees is the version stamp; the `fs.remove` that deletes a directory in the operator's project is invisible to it. That is **T111**, now sharpened with this instance and recorded beside the snapshot itself so a reader of "13 -> 14" meets the caveat. Not fixed here — widening the regex re-counts every entry in the TRACKED array at once. |
| 2026-09-07 | **Round 1 review — 3 independent subagent layers, 8 patches, 5 defers, 3 dismissed, 0 HIGH.** Round 2 not triggered. **Five of the eight patches were false claims in this story's own record**, which is the result worth keeping: "seven line citations" listed nine; "the alarm caught every one" was false (it caught the nine STRUCTURED citations and missed the same numbers restated in a docblock that nothing checks — and that docblock's own assurance they *were* checked is what let them rot); AC9's "the one number this story does NOT state anywhere is four" was disproved by eight comment lines this diff adds; the File List omitted the backlog file carrying the T102 amendment; and the three-consecutive-refreshes claim outran its automated evidence, which does two. **The two code patches were AC6 half-done** (the `INSTALLATION.md` tree diagram still omitted `_portability` even though the prose and the table were fixed) **and a vacuous test** (`body.includes('#')` would have passed with all but one doc comment dropped; now counts them). **Three stale comments promised this story would wire `$TREE`, one calling the deliberate deferral "the bug"** — corrected to name T102 as the owner, because a reader acting on it would wire T102's fail-opens into the publish gate. **All five defers are one class:** patterns MIRRORED from the Artifacts block, including `workflow.name` used verbatim in `path.join`, which is T102(a)'s defect on the write side and should close with it. Gates re-run: 2210 tests 0 fail, lint clean, docs:audit zero, harness PASS, backlog-integrity PASS. |
| 2026-09-07 | **Implemented AC1-AC7; AC8 deferred by operator ruling.** `_portability` is reachable: it conforms to ADR-004 (`config.yaml`, `skills/` -> `workflows/`), `refreshInstallation` copies it and generates a wrapper per declared workflow, version stamped per I137, orphan sweep extended, `INSTALLATION.md` corrected. Proven on a fresh temp install — four wrappers generated, all four resolving their workflow end-to-end, surviving three consecutive refreshes. The assertion went from one standing finding to **`[installed-tree status 0]`**. **AC8 (wire `$TREE` blocking) NOT met:** `T102` is a Qualified row tagged `blocks: dist-2-6 wiring` holding 20 defects in that assertion, several of them fail-opens, and wiring with those open would put them in the gate `publish` depends on. T102 appears in no AC, task or dependency of this story — it was filed after the story was re-authored, and was found at pickup from the sprint-status log. Nothing regresses by waiting: `$TREE` gated nothing before and gates nothing now. **Two AC2 traps confirmed real:** every source `SKILL.md` loaded its workflow relatively while the generator copies `SKILL.md` alone, and the orphan sweep knew portability's names only by accident. Gates: 2210 tests 0 fail, lint clean, docs:audit zero, harness PASS. |
| 2026-08-30 | Re-authored against ADR-004 (option (a) accepted). Previous AC1/AC2 were mutually unsatisfiable; replaced with AC1-AC9. Dangling NFR6 citation corrected to `derive-counts-from-source`. |

---

## Dev Agent Record

### Agent Model Used

claude-opus-5[1m] (implementation); review layers on claude-sonnet-5

### Completion Notes List

**SCOPE REDUCED BY OPERATOR RULING, 2026-09-07: AC1-AC7 shipped, AC8 deferred.** The story is
being closed on seven of its eight acceptance criteria. AC8 (wire `$TREE` into the blocking
verdict) is **not** met and is not attempted here.

**Why.** `T102` is a Qualified backlog row (RICE 5.1) tagged `blocks: dist-2-6 wiring`, holding 20
defects in the very assertion AC8 would wire, and it states the constraint directly: *"Nothing here
gates anything today - which is exactly why it can wait, and exactly why 2.6 must clear it before
adding `$TREE` to the condition. Sequence (a)-(f) first; they are the only ones that can make the
gate wrong rather than noisy."* Among (a)-(f) are fail-opens - a wrapper `name` used verbatim in
`path.join`, so a declared workflow named `../../../../tmp/x` is satisfied by a `SKILL.md` outside
the project (reproduced by dist-2-4's Round 3, exit 0); a registry load failure that blanks the
entire invocability half; and `walkRequires` returning the PASS value for an unreadable entry file.
Wiring with those open puts known fail-opens into a gate `publish` depends on, which is the defect
class this epic exists to close.

**T102 is not in this story's ACs, tasks or Cross-story dependencies.** It was filed 2026-08-30
after `dist-2-4`'s Round 3, the same day this story was re-authored against ADR-004, so the
dependency list never learned about it. Found at pickup by reading the sprint-status log rather
than the story - `staleness-preflight-for-backlog-pickup`.

**Nothing regresses by deferring.** `$TREE` gates nothing today and gates nothing after this story;
the assertion prints and the harness exits 0, exactly as before. What changes is that it now prints
**zero findings** instead of one.

---

**AC1 - the module conforms (C1, C2).** `skills/` -> `workflows/` via `git mv`, so history follows.
`_bmad/bme/_portability/config.yaml` authored on the `_artifacts` model, declaring every workflow
`standalone: true` with `entry: workflows/<name>/workflow.md`. Names and count derived from the
tree at implementation time, never typed (AC9). **No fifth module shape:** declaration is still an
agent-registry entry or a `config.yaml` workflow with `standalone: true` - two mechanisms, unchanged.

**AC2 - the load directives, and the trap that made them necessary.** Every source `SKILL.md`
loaded its workflow by a RELATIVE link (`[workflow.md](workflow.md)`), while the generator copies
`SKILL.md` **alone**. A relative link resolves inside `.claude/skills/<name>/`, where no
`workflow.md` exists - so all four wrappers would have pointed at files that are not there, and a
presence-only check would have called that a success. All rewritten to the absolute
`{project-root}` form. **Verified by reading the GENERATED wrapper in a real install**, as the AC
requires, not the source:

```
$ sed -n '6p' <tmp>/proj/.claude/skills/bmad-export-skill/SKILL.md
IT IS CRITICAL THAT YOU FOLLOW THIS COMMAND: LOAD the FULL
{project-root}/_bmad/bme/_portability/workflows/bmad-export-skill/workflow.md, ...
-> resolves to <tmp>/proj/_bmad/bme/_portability/workflows/bmad-export-skill/workflow.md  RESOLVES
```

**AC3 - manifest rows moved with the files.** Row count **derived**, not taken from the story: 4
rows named the old `skills/` path, 4 updated, and the diff is exactly 4 lines. `validate-classification.js`
findings unchanged at the pre-story baseline of **4 [BROKEN-DEP]** - all four in `bmm`/`wds` skills
(`bmad-check-implementation-readiness`, `bmad-create-epics-and-stories`, `wds-4-ux-design` x2),
none portability, all belonging to Story 2.8 and untouched here.

**AC4 - the install path, and the version stamp.** `refreshInstallation` now copies the module
(mirroring the Artifacts block at its `isSameRoot` skip) and generates a wrapper per declared
`standalone: true` workflow. Version stamped via `YAML.parseDocument` + `doc.set`, not
`mergeConfig`, per the reasoning recorded in the Vortex block - `mergeConfig`'s structural defaults
are Vortex-specific. Verified on a real install: `version: 4.0.1` matching `package.json`, and the
**9 doc comments survived the stamp**, which is what `doc.set` is chosen for.

**AC5 - the orphan sweep, by design rather than by accident.** *(Evidence note, corrected after
review: the automated test exercises TWO consecutive refreshes, not three. The three-refresh run
was manual, during the AC7 session, and is not reproducible from the diff — so the committed
evidence is the two-refresh test plus the sweep-a-removed-workflow test. Both Blind Hunter and the
Auditor flagged the gap between the claim and its automated backing.)* The sweep's Strategy 2 set held only
Artifacts names, so the four portability wrappers survived it **by accident** - their names matched
no known Artifacts workflow - and a workflow later removed from portability's config would have been
stranded. `knownArtifactsNames` renamed to `knownVerbatimNames` and fed from both configs. Verified
by execution that the wrappers survive **three** consecutive refreshes, and by test that a workflow
removed from the config now has its wrapper swept rather than stranded.

**AC6 - the documentation that certified the bug as a design choice.** `INSTALLATION.md` had said
the module *"is **not** copied into your project - `convoke-export` runs from the package itself, so
there is nothing to install"* - true of the bin, false of the four skills. Rewritten to separate the
two, and Portability added to the module table (6 rows -> 7). The replacement deliberately carries
**no workflow count**: `docs-audit` pattern-matches any "N workflows" against the Vortex count and
flagged the first draft, and a hardcoded count is `derive-counts-from-source` anyway.

**AC7 - invocability proven on a real install.** Fresh temp project, `npm pack` -> `npm install` ->
`convoke-install-vortex`. All four wrappers present at `.claude/skills/<name>/SKILL.md`, and each
resolved end-to-end by substituting `{project-root}` exactly as the runtime does and reading the
target:

```
bmad-export-skill:     resolved -> 3231 bytes, frontmatter=true
bmad-generate-catalog: resolved -> 1438 bytes, frontmatter=true
bmad-seed-catalog:     resolved -> 2230 bytes, frontmatter=true
bmad-validate-exports: resolved -> 1760 bytes, frontmatter=true
resolved 4, failed 0
```

**AC8 - NOT MET.** See the scope ruling above. Two of its three subtasks were completed and are
worth keeping, because they are the preconditions the next attempt would otherwise redo:
- **The assertion now has ZERO findings.** `[installed-tree status 0]` in the harness, where it
  previously reported `_portability` missing. That was AC8's stated precondition for wiring.
- **Story 2.4 shipped C2, not C4** - verified at pickup rather than assumed, as the AC instructs.
  `assert-installed-tree.js` calls `missingWrappers(units, projectRoot)`, i.e. it checks that each
  declared unit resolves to a generated wrapper. **No amendment is needed; AC8 wires it unchanged.**

**AC9 - counts derived.** Workflow names and count from the tree; manifest rows from a grep; module
table row count from the file; validator and test expectations read from `config.yaml` at test time
rather than hardcoded.

**A claim in the first draft of this section was false and review caught it.** It read: *"The one
number this story does NOT state anywhere is four."* The Acceptance Auditor disproved it — "four"
appears throughout this record, in AC9's own Given clause, and in eight comment lines this diff
ADDS (`config.yaml`, `validator.js`, `refresh-installation.js`, `installed-tree.js`). What is
actually true, and all AC9 requires, is narrower: **no numeric literal `4` drives control flow in
any of the new code** — every count that matters is read from `config.yaml` or the tree at run
time. Prose that says "its four skills" is description, not a derived count; it was the sweeping
claim that was wrong, not the work.

---

**Two things fixed that the story did not ask for, both disclosed rather than folded in silently.**

1. **NINE line citations in `installed-tree.js` went stale** because inserting the copy block
   shifted `refresh-installation.js` by 60 lines: the five `WRAPPER_RULES` sites (+60), plus
   `refresh-installation.js:585 -> :645`, `:1038 -> :1144`, `:1061 -> :1168` and
   `validator.js:286 -> :289`. All nine verified individually against the current files.

   **This sentence said "seven" and then listed nine, and review caught it.** Both Blind Hunter
   and the Acceptance Auditor flagged it independently. It is the fourth miscount in this session's
   record-keeping, in the paragraph that exists to celebrate rot-alarm discipline, which is the
   whole joke.

   **The alarm did NOT catch every one, and the earlier claim that it did was false.** It caught
   the nine STRUCTURED citations in `RUNTIME_DATA_FILES` and `WRAPPER_RULES` and failed the suite
   on each. It did not catch the file's top-of-file docblock, which restated `:551`/`:585` and
   `:782`/`:811`/`:837`/`:863`/`:914` in PROSE alongside the assurance that those numbers were
   "re-derived and anchor-checked in WRAPPER_RULES below" — and that assurance is precisely what
   let them rot, because `auditCitations` walks the structured tables and never the header. After
   the shift every prose copy pointed at unrelated code, silently. Found by review. Fixed by
   deleting the numbers from the header rather than updating them: a number restated where nothing
   checks it will rot again, which is the same conclusion this session reached about the "ten
   self-referential links" claim two stories ago.

   **One correction to my own process:** I guessed `:1121` for one replacement instead of deriving
   it; the test caught that too, and the derived value is `:1168`.

2. **The `standaloneWorkflow` rule's rationale was a prophecy that came true.** It read: the rule
   *"applies to every arriving module ON PURPOSE, so that `dist-2-6` giving `_portability` a config
   with `standalone: true` workflows goes RED until the generator is extended to emit them."* That
   is precisely what happened - the finding cleared when the generator was extended, with the rule
   untouched. Comment updated to record the outcome rather than leave a prediction about work now
   done.

**One deliberate deviation from T8 as written.** T8 says *"Add a validator block symmetric with
`validator.js:638-694`"*. Copying it would have duplicated ~90 lines. Extracted
`validateStandaloneWorkflowModule(projectRoot, {label, dirRel})` instead, with `validateArtifactsModule`
and the new `validatePortabilityModule` as thin callers. Safe because the 9 existing Artifacts
validator tests are the regression guard and stayed green (85 -> 92 total). Chosen over duplication
because this session had already spent a commit correcting one fact stated in two files that went
stale in both.

**Gates, each run against this change.**

```
npm test             2210 tests, 2209 pass, 0 fail, 1 pre-existing skip  (was 2190)
lint                 clean (eslint --max-warnings 0)
docs:audit           zero findings
backlog-integrity    PASS - 815 rows
try-fresh-install    PASS, exit 0 - [installed-tree status 0] [shipped-links status 0]
validate-classification  4 [BROKEN-DEP] - unchanged from the pre-story baseline
```

**Falsifiability.** The AC2 guard was shown able to fail: reverting one source `SKILL.md` to the
relative `[workflow.md](workflow.md)` turns two tests red (`every generated wrapper RESOLVES its
workflow`, `carries no RELATIVE workflow link`); restoring returns 11/11. The citation alarms proved
themselves by failing on this change without being prompted.

### File List

**Modified**
- `scripts/update/lib/refresh-installation.js` - portability copy block (2c-bis), wrapper generation (6d-bis), orphan sweep union renamed and extended
- `scripts/update/lib/validator.js` - `validateStandaloneWorkflowModule` extracted; `validatePortabilityModule` added and wired into the checks list
- `scripts/audit/lib/installed-tree.js` - seven stale line citations corrected; `standaloneWorkflow` rationale updated
- `_bmad/_config/skill-manifest.csv` - four `path` rows moved to `workflows/`
- `INSTALLATION.md` - the "nothing to install" claim corrected; Portability added to the module table
- `tests/unit/validator.test.js` - 7 tests for `validatePortabilityModule`
- `tests/unit/refresh-installation-orphan-cleanup.test.js` - 2 tests for AC5's design intent
- `_bmad-output/planning-artifacts/portability-validation-report.md` - regenerated (date line only)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` - status transitions
- `_bmad-output/planning-artifacts/convoke-note-initiative-lifecycle-backlog.md` - T102 amended to CARRY the deferred AC8 wiring (omitted from the first draft of this list; found by the Acceptance Auditor)
- `scripts/audit/assert-installed-tree.js` - stale "dist-2.6 wires it in" comment corrected (Round 1)
- `tests/audit/installed-tree.test.js` - unchanged; listed here only to note its citation alarm is what caught the nine stale numbers

**Renamed (git mv, history follows)**
- `_bmad/bme/_portability/skills/**` -> `_bmad/bme/_portability/workflows/**` (8 files; 4 `SKILL.md` also edited for AC2)

**New**
- `_bmad/bme/_portability/config.yaml` - the declaration that makes the module reachable
- `tests/unit/refresh-installation-portability.test.js` - 11 tests


### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
