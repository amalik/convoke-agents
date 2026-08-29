---
initiative: convoke
artifact_type: implementation-readiness-report
created: 2026-08-30T00:00:00.000Z
schema_version: 1
status: complete
scope: "Epic 2 — The package contains what it promises (dist-2-1 .. dist-2-8)"
stepsCompleted: ['step-01-document-discovery', 'step-02-prd-analysis', 'step-03-epic-coverage-validation', 'step-04-ux-alignment', 'step-05-epic-quality-review', 'step-06-final-assessment']
inputDocuments:
  - _bmad-output/planning-artifacts/convoke-epic-4-0-1-distribution-integrity.md
  - _bmad-output/planning-artifacts/convoke-note-4-0-1-scope-decisions.md
  - _bmad-output/planning-artifacts/adr/4-0-1/adr-001-retire-badges-pipeline.md
  - _bmad-output/planning-artifacts/adr/4-0-1/adr-002-shipped-link-policy.md
  - _bmad-output/planning-artifacts/adr/4-0-1/adr-003-publish-path-enforcement.md
  - _bmad-output/implementation-artifacts/dist-2-4-assert-the-installed-tree-carries-what-was-shipped.md
  - _bmad-output/implementation-artifacts/dist-epic-1-retro-2026-08-23.md
  - _bmad-output/implementation-artifacts/sprint-status.yaml
  - project-context.md
---

# Implementation Readiness Assessment Report

**Date:** 2026-08-30
**Project:** BMAD-Enhanced (Convoke)
**Scope of this assessment:** Epic 2 of the 4.0.1 Distribution Integrity initiative —
"The package contains what it promises", stories 2.1 through 2.8.

## Step 1 — Document Discovery

### Assessment scope note

This initiative declares itself, in its own Overview, to have **no PRD and no Architecture
document**. That is a ratified property of the mini-epic precedent
(`convoke-epic-ci-hygiene.md` / `convoke-epic-lint-cleanup-dod-gate.md` /
`convoke-epic-restore-coverage-green-ci.md`), not an omission. Requirements live inside the
epic file as a Requirements Inventory (FR / NFR / Additional / UX Design Requirements plus an
FR Coverage Map), traced to a ratified scope-decisions note and to backlog rows with
source-verified anchors. The readiness assessment is therefore run against the
**epic-internal requirements inventory + the three ADRs** as the requirements baseline,
in place of a PRD and Architecture document.

### Documents in scope

**Requirements baseline (in place of a PRD):**
- `convoke-epic-4-0-1-distribution-integrity.md` (56,339 bytes, modified 2026-08-23) —
  Requirements Inventory at lines 88-336; FR Coverage Map at line 309.
- `convoke-note-4-0-1-scope-decisions.md` — ratified scope decisions the FRs derive from.

**Architecture / decision baseline (in place of an Architecture document):**
- `adr/4-0-1/adr-001-retire-badges-pipeline.md` (ACCEPTED 2026-08-19)
- `adr/4-0-1/adr-002-shipped-link-policy.md` (ACCEPTED 2026-08-20) — **gates Epic 2**; FR12's
  checker cannot be wired into CI until this ruling is applied (Story 2.3).
- `adr/4-0-1/adr-003-publish-path-enforcement.md` (ACCEPTED 2026-08-20) — Epic 1 scope.

**Epics and Stories:**
- Epic 2 definition: epic file line 356 (Epic List entry) and lines 589-810 (story bodies
  2.1-2.8).
- Authored story file: `dist-2-4-assert-the-installed-tree-carries-what-was-shipped.md`
  (the only Epic 2 story with a story file; status `ready-for-dev`).
- Stories 2.1, 2.2, 2.3, 2.5, 2.6, 2.7, 2.8: defined in the epic, **no story file authored**,
  status `backlog`.

**UX:**
- No standalone UX document for this initiative. UX Design Requirements are carried inside the
  epic at line 302. `epic-skill-portability-ux.md` exists in the planning folder but belongs to
  a different initiative and is out of scope here.

**Execution state (`sprint-status.yaml`):**
- `dist-epic-1`: done · `dist-epic-1b`: done · `dist-epic-1-retrospective`: done
- `dist-epic-2`: **backlog**
- `dist-2-4`: ready-for-dev — all other Epic 2 stories: backlog
- `dist-epic-2-retrospective`: optional

### Duplicates

None within the assessment scope. The planning folder holds many `*prd*.md` and `*epic*.md`
files, but they belong to other initiatives (artifact governance, v6.3 adoption, lifecycle
engine, Gyre, Loom, Enhance). Exactly one epic file covers 4.0.1 distribution integrity, and it
exists only as a whole document — no sharded twin.

### Missing documents

- **PRD — absent by design.** Declared in the epic Overview; the mini-epic precedent is cited.
  Not treated as a gap.
- **Architecture document — absent by design.** Same declaration. The three ADRs carry the
  architectural rulings this epic depends on.
- **Story files for 7 of 8 Epic 2 stories — a real gap for dev handoff**, though consistent
  with `dist-epic-2` still being at `backlog`. Recorded here; assessed in later steps.

---

## Step 2 — Requirements Analysis

Source: `convoke-epic-4-0-1-distribution-integrity.md` lines 88-336 (Requirements Inventory),
read in full. The initiative has no PRD; this inventory is the requirements baseline.

### Functional Requirements — Epic 2 scope (8 of 18)

```
FR11: `npm run docs:audit` MUST run in CI. It exists, it was failing, and it is wired
      into no workflow.                                                        [T32]

FR12: CI MUST pack the tarball and resolve every relative link in every shipped `.md`,
      failing on any target absent from the package. Scope is DOCUMENTED REFERENCES
      only — it cannot see a file the code reads at runtime, which is FR13's class.
                                                              [spine; absorbs I157]

FR13: The installed tree MUST be asserted to carry every shipped `_bmad/bme/*` module
      and every file in `files[]` that code reads at runtime. Implemented by extending
      `scripts/audit/try-fresh-install.sh` (already the CI `fresh-install` job), NOT by
      a new grep over `scripts/**` — grep is fragile against renames and dynamically
      built paths; an actual install is not. Absorbs I153 (4.8), whose finding is that
      the harness's bin dependency check verifies only ONE hop.
                                    [spine; detection for I141 AND FR18; absorbs I153]

FR14: `_bmad/bme/_portability/` MUST be reachable after install — it ships in `files[]`
      but no install path copies it, leaving 4 skills unreachable everywhere.  [I141]

FR15: The broken skill dependencies in the shipped `skill-manifest.csv` MUST be
      repaired, with the count derived at implementation time rather than carried
      forward as a literal.                                                    [I134]

FR16: EVERY interpolated `RegExp` construction in `export-engine.js` MUST escape its
      interpolated value — not only the `u`-flag one. `:311` ('u'), `:390` ('mi'),
      `:499` ('g') and `:503` ('g') are unescaped; `:1070` already uses the
      `escapeRegExp` helper imported into the same file. Derive the count at
      implementation time.                                                     [T33]

FR17: A `convoke-doctor` check's label MUST agree with its own finding —
      `'BMM dependencies: registry present'` currently labels a check reporting the
      registry absent.                                                    [BUG-19(a)]

FR18: `_bmad/_config/bmm-dependencies.csv` MUST be in `package.json` `files[]`. It is
      git-tracked, so the warning stopped firing in this repo while nothing changed for
      any npm-installed operator — the population BUG-19 came from.  [BUG-19 files[]]
```

**Epic 2 FR count: 8.** Out of scope for this assessment (Epic 1, all shipped): FR1, FR2,
FR3, FR4, FR5, FR9, FR19. Retired: FR6, FR7, FR8 (ADR-001), FR10 (→ ADR-1), FR20 (→ ADR-2).

### Non-Functional Requirements — Epic 2 scope

```
NFR8:  `preflight-soft-warn` MUST remain intact. BUG-19(b) is out of scope; FR17 fixes
       the label only and must not change the warn-and-exit-0 contract.

NFR10: Any gate introduced by this epic MUST be demonstrated FAILING against the pre-fix
       tree, with the failure output recorded in the story, before it is accepted.
       Instance repairs that would turn a gate green (FR14, FR18) are separate, later
       stories — a gate and its first fix must never land in the same story.
       `project-context.md` records two 2026-08-15 instances of checks that reported
       success without doing their work.                          [pre-mortem F2]
```

NFR1 (tag freeze) is **RETIRED** (operator decision, 2026-08-22) and does not constrain
Epic 2. NFR2 (rehearsal strategy for publish-path changes) binds Epic 1 stories only —
no Epic 2 story edits the publish job. NFR3-NFR7 and NFR9 were **subtracted 2026-08-19
and are explicitly not reused.**

**Standing rules apply but are deliberately not restated as NFRs.** The epic states that
all `project-context.md` rules bind this work: `test-fixture-isolation`,
`no-hardcoded-versions`, `no-process-cwd-in-libs`, `derive-counts-from-source`,
`shared-test-constants`, `spec-verify-referenced-files`, `mechanical-research-enumeration`,
`verification-pipefail`, `lint-passes-before-review`, `code-review-convergence`,
`backlog-write-discipline`, `commit-preparation`. One addition that is not yet a standing
rule: **no line-level staging on the backlog** (commit `3a3de195` deleted the T35 and T39
rows while claiming to repair them).

### Additional Requirements

Derived from source in the absence of an Architecture document:

- The `publish` job is gated on eight jobs (`lint`, `test`, `python-test`, `coverage`,
  `security`, `package-check`, `agent-surface-parity`, `fresh-install`) and fires only on
  `refs/tags/v*`. **This is the structural constraint that shapes Epic 2's entire story
  order:** `fresh-install` runs on push to `main` and on every PR, and `publish` `needs:`
  it — so a gate merged red blocks every PR and every release.
- `package.json` `files[]` is an explicit allowlist, not a glob. `_bmad/_config/` is
  represented by a single entry (`skill-manifest.csv`); adding a file to that directory
  does not ship it. **This is the direct mechanical cause of FR18.**
- `.github/workflows/` now contains only `ci.yml`; `badges.yml`, the generator and
  `docs/badges.json` were deleted by Story 1.1 under ADR-001.
- Packed tarball is 455 files as of the epic's authoring.

### UX Design Requirements

**N/A — no user interface**, declared explicitly at epic line 302. Convoke 4.0.1 changes CI
configuration, packaging metadata, CLI diagnostics and an export code path. The
operator-facing surface is terminal output, governed by the Operator Covenant and
`preflight-soft-warn` (NFR8), not by a UX design contract. **Assessed and accepted** — this
is a correctly-reasoned N/A, not an unfilled section.

### Requirements Completeness Assessment

**Strong.** Unusually so for a document with no PRD behind it.

- Every FR carries a **source anchor** to a backlog row or pre-mortem finding
  (T32, T33, T35, T41, I134, I141, I153, I157, BUG-19), so no requirement is free-floating.
- Retirements are **recorded rather than deleted**, with the deciding ADR and date named,
  and numbers are explicitly not reused. The FR10/FR20 gaps are deliberate and documented.
- Several FRs carry **negative scope** — FR12 states what it cannot detect, FR13 states why
  grep was rejected. This is the single most useful property in the inventory: it is what
  prevents a reviewer from assuming coverage the gate does not have.
- Two FRs (FR15, FR16) explicitly **forbid carrying a count forward as a literal**,
  binding `derive-counts-from-source` at the requirement level rather than trusting the rule.

**One defect found in this step** — see Step 3 for the finding detail: Story 2.6's fourth
acceptance criterion cites **NFR6**, which the inventory states was subtracted on 2026-08-19
and is not reused. The intent is recoverable (it is the `derive-counts-from-source` rule),
but the citation is dead.

---

## Step 3 — Epic Coverage Validation

### Epic FR coverage extracted

```
FR11: Epic 2, Story 2.1
FR12: Epic 2, Story 2.2 (checker + red demo) + Story 2.3 (policy + wiring)
FR13: Epic 2, Story 2.4 (assertion + red demo) + Story 2.6 (wiring)
FR14: Epic 2, Story 2.6
FR15: Epic 2, Story 2.8
FR16: Epic 2, Story 2.7
FR17: Epic 2, Story 2.5
FR18: Epic 2, Story 2.5
Total Epic 2 FRs claimed: 8
```

Story 2.3 carries **no FR of its own** — it is declared as "what makes FR12 enforceable".
That is a deliberate, documented choice, not an orphan story.

### Coverage matrix

| FR | Requirement | Epic coverage | Coverage status | **Premise still true?** |
|----|-------------|---------------|-----------------|--------------------------|
| FR11 | `docs:audit` runs in CI | Story 2.1 | ✓ Covered | ❌ **STALE — already shipped** |
| FR12 | Every documented reference resolves inside the package | Stories 2.2 + 2.3 | ✓ Covered | ✓ Holds |
| FR13 | Installed tree carries every shipped module + runtime-read file | Stories 2.4 + 2.6 | ✓ Covered | ✓ Holds |
| FR14 | `_portability` reachable after install | Story 2.6 | ✓ Covered | ✓ Holds (verified: no reference in any install path) |
| FR15 | Repair broken skill-manifest dependencies | Story 2.8 | ✓ Covered | ⚠️ **Holds, but the stated cause is refuted** |
| FR16 | Escape every interpolated RegExp in the exporter | Story 2.7 | ✓ Covered | ❌ **STALE — 2 of 4 sites already fixed** |
| FR17 | Doctor label agrees with its finding | Story 2.5 | ✓ Covered | ❌ **STALE — already shipped** |
| FR18 | `bmm-dependencies.csv` in `files[]` | Story 2.5 | ✓ Covered | ✓ Holds (verified absent from `files[]`) |

### Missing requirements

**None.** Every FR assigned to Epic 2 in the FR Coverage Map has a story. No FR appears in a
story without appearing in the inventory. No orphan stories. The epic's own claim — "All 18
FRs mapped… No orphans" — is accurate.

### Coverage statistics

- Total FRs in the initiative: **18** (FR1-FR9, FR11-FR19; FR10 and FR20 retired to ADRs;
  FR6-FR8 retired by ADR-001)
- FRs in Epic 2 scope: **8**
- FRs covered by an Epic 2 story: **8**
- **Coverage: 100%**
- Stories with no FR of their own: 1 (Story 2.3 — deliberate)

### ⚠️ Coverage is complete. Currency is not.

Coverage validation passes cleanly. The problem this step surfaced is a different one: **three
of the eight FRs no longer describe the tree.** Verified against the working tree on
2026-08-30, per `spec-verify-referenced-files` and `staleness-preflight-for-backlog-pickup`.

**FINDING 1 — FR11 / Story 2.1 is already done. Sprint status says `backlog`.**

`npm run docs:audit` runs in CI today at `.github/workflows/ci.yml:178`, inside the
`agent-surface-parity` job, with a comment at `:169` citing T32 by name. Shipped by commit
`4556f4f0` ("fix(T50,T32): guard the dev-tree config write, enforce the docs audit") on
**2026-08-24** — six days after the epic was authored, through the Fast Lane as backlog row
T32 rather than as story `dist-2-1`.

The commit message records the NFR10 red demonstration explicitly: *"Demonstrated failing
first per NFR10: a planted broken link gave exit 1 naming file and line, exit 0 on restore."*
Both of Story 2.1's acceptance criteria are therefore satisfied, including the one NFR10
exists to enforce.

One deviation from the story text, and it is benign: the story says "it runs as a CI job on
push and pull request"; the implementation added it as a *step* in the existing
`agent-surface-parity` job rather than as a new job. The commit argues the placement (that
job is the audit aggregator and is in `publish.needs`). Substance satisfied, wording not.

*Impact:* Story 2.1 is a **phantom story**. Handing it to a dev agent produces either a
no-op or a duplicated CI step. Also note `docs:audit` is declared at `package.json:53`, not
`:52` as the story states — a one-line drift from the same period.

**FINDING 2 — FR17 is already shipped; Story 2.5 is now half-done.**

`scripts/convoke-doctor.js` now emits `name: 'BMM dependencies: registry missing'` on the
absent branch, with a comment citing "BUG-19(a) / dist-2-5 FR17". Shipped by commit
`21ae3105` ("fix(dist-2-5): make the registry label agree with its own finding"). NFR8 is
respected — `softWarning: true` and the exit-0 pass-through are intact, and the BUG-16
version pinning on the `fix:` line is preserved.

FR18 has **not** shipped: `_bmad/_config/bmm-dependencies.csv` is still absent from
`package.json` `files[]`, whose only `_bmad/_config/` entry remains `skill-manifest.csv`.

*Impact:* this is the sharper of the two staleness findings, because **it defeats the design
rationale of Story 2.5.** The epic subtracted the FR17/FR18 split on 2026-08-19 precisely so
that one story would close backlog row BUG-19 "by it alone". Half of it has now shipped
separately anyway — which is the outcome the subtraction was meant to prevent. Story 2.5 must
be re-scoped to FR18 plus the BUG-19 row-closure bookkeeping, and its first, third and fourth
acceptance criteria rewritten.

**FINDING 3 — FR16 / Story 2.7's enumeration is stale, and the residue may be a non-issue.**

The story enumerates four unescaped sites — `:311` (`u`), `:390` (`mi`), `:499` (`g`),
`:503` (`g`) — and one already-escaped site at `:1070`. Current tree:

| Story's site | Actual line | State today |
|---|---|---|
| `:311` (`u`) | `322` | ✓ **escaped** — `escapeRegExp(name)` |
| `:390` (`mi`) | `409-410` | ✓ **escaped** — `escapeRegExp(headingName)` |
| `:499` (`g`) | `521` | ✗ unescaped — `` `\\{\\{${varName}\\}\\}` `` |
| `:503` (`g`) | `525` | ✗ unescaped — `` `\\{${varName}\\}` `` |
| `:1070` | `1092` | ✓ escaped (as stated) |

Two of the four were fixed by commit `3a6e4c9b` ("fix(portability): escape RegExp
interpolation at both export-engine sites"). Every line number has drifted by 11-22.

The two survivors are materially different from the two that were fixed. They interpolate
`varName` — a key iterated from `configVarMap`, a **hardcoded local object literal** whose
keys are fixed identifiers (`communication_language`, `output_folder`, …). No persona name,
and no user input, reaches them. So Story 2.7's second acceptance criterion — *"a persona
name containing `{`, `}`, `(`, `[` or `\` … completes without throwing"* — **is already
satisfied by the two fixes that landed**, and the committed test it demands would pass
against the current code, which NFR10's spirit forbids accepting as a demonstration.

*Impact:* Story 2.7 needs a ruling that is not in the epic: does FR16's *"EVERY interpolated
`RegExp` construction MUST escape its interpolated value"* bind sites whose interpolated
value is provably a fixed literal? Defensible either way — uniform-rule (escape them, cheap,
no judgement call at review time) or risk-based (leave them, and record why). This is a
one-line call, but it is a call, and the story cannot be estimated until it is made.

**FINDING 4 — FR15 / Story 2.8: the finding count holds, the stated cause does not.**

Ran `node scripts/portability/validate-classification.js` against the current tree:
`FAIL: 106 skills checked, 4 errors (4 [BROKEN-DEP])`. The count and the four skills match
the story exactly. That much is current.

The story's *"consistent with upstream `a16fa340` deleting vendored content"* hypothesis —
which the story itself flags as unconfirmed ("consistent is not confirmed") — **is refuted for
at least two of the four.** Both templates exist on disk right now:
`.claude/skills/bmad-check-implementation-readiness/templates/readiness-report-template.md`
and `.claude/skills/bmad-create-epics-and-stories/templates/epics-template.md`. Nothing was
deleted. The dependency does not resolve because the row's **`path` column** points at
`_bmad/bmm/3-solutioning/…`, a directory that does not exist in this tree — and
`validate-classification.js:249` derives its search root from that column
(`skillDir = dirname(projectRoot/path)`).

That reframes the fix. Story 2.8's acceptance criterion offers exactly two resolutions —
*"path corrected, or dependency dropped if the template is genuinely gone"* — and the real
defect is neither. It is the row's skill-root path.

**And the scale is larger than four rows.** Auditing every row: **75 of 106 manifest rows
name a `path` that does not exist in the tree** — every non-`bme` (upstream) row across
`bmm`, `tea`, `cis`, `bmb`, `wds` and `core`. The four `[BROKEN-DEP]` findings are only the
subset that *also* declares a relative file dependency; the other 71 stale paths are invisible
to the classifier because it has nothing to resolve against them.

This may be correct by design — the manifest could be describing an installed BMAD project's
layout rather than this development tree — and I have not established which. But the story
cannot be scoped until someone does, because the two readings give very different work:

- *If the manifest should describe this tree:* the defect is 75 rows, not 4, in a file that
  ships (`_bmad/_config/skill-manifest.csv` is in `files[]`). Story 2.8 is badly undersized.
- *If the manifest should describe an installed project:* the four findings are false
  positives and the correct fix is to the classifier's resolution basis, not to the manifest.
  Story 2.8 as written would then be editing correct data to silence a broken check.

*Impact:* **Story 2.8 carries a trap.** Its second acceptance criterion permits only deletions
from `.github/expected-classification-findings.txt` and forbids additions outright ("no line
is ever ADDED to that file to make a test pass"). If the resolution basis is corrected so the
71 currently-unchecked rows begin resolving their dependencies, new findings may surface — and
the AC as written leaves no legitimate way to record them. The rule is a good one; it just was
not written against this failure mode.

### Coverage verdict

**Traceability: PASS — 8/8, no gaps, no orphans.**
**Currency: FAIL — 3 of 8 FRs are stale and 1 more rests on a refuted premise.**

---

## Step 4 — UX Alignment Assessment

### UX document status

**Not found — and correctly so.** No UX document exists for this initiative. The epic declares
**N/A** at line 302 with a reasoned justification: 4.0.1 changes CI configuration, packaging
metadata, CLI diagnostics and an export code path; there is no user interface.

I assessed whether UX is nonetheless *implied* — the check this step exists to make — rather
than accepting the declaration on its face. There is no web or mobile component, no rendered
surface, and no user journey. **The N/A holds.** `epic-skill-portability-ux.md` exists in the
planning folder but belongs to the skill-portability initiative and has no bearing here.

But "no UI" is not the same as "no operator-facing surface", and the epic says so itself:

> The operator-facing surface is terminal output, governed by the Operator Covenant and
> `preflight-soft-warn` (NFR8), not by a UX design contract.

That sentence names the governing standard. The alignment question for this step is therefore
not *"where is the UX doc"* but *"does the epic honour the standard it named"*. Two gaps.

### Alignment issues

**FINDING 5 — The epic names the Operator Covenant as its governing standard, then never asks
any story to check against it.**

Grepping all of Epic 2 (lines 589-812) for `covenant` or `OC-R`: the Covenant appears **seven
times, every one of them as a file being moved** by Story 2.3 (`_bmad/bme/covenant/`, `files[]`
entry, 47 referencing files, `taxonomy.yaml:56`). It appears **zero times as a standard being
complied with.** No Epic 2 story carries a Covenant acceptance criterion, and no OC-Rn right
is cited anywhere.

This matters most for **Story 2.5**, whose entire remaining substance after Finding 2 is
operator-facing text. `project-context.md`'s `covenant-compliance-for-convoke-skills` rule
states: *"If the diff introduces new operator-facing behavior (prompts, errors, output formats,
decision points), verify the relevant Right's compliance — cite the specific OC-Rn rule."*
Story 2.5 changes a warning label an operator reads on every `convoke-doctor` run. That is an
output-format change by the rule's own definition.

The epic is not wrong to leave the Covenant out of stories that touch only CI YAML. It is
inconsistent to name the Covenant as the governing standard for the operator surface and then
ship the one story that edits that surface without a single OC-Rn citation. NFR8 covers the
*contract* (`softWarning`, exit-0) but says nothing about whether the new text serves the
operator — which is exactly the gap OC-R3 (rationale) exists to close.

*Recommendation:* add a Covenant self-check acceptance criterion to Story 2.5, and declare an
explicit N/A with rationale on the CI-only stories (2.1, 2.2, 2.3, 2.4) rather than leaving
the question unasked. A declared N/A is compliant; silence is not.

**FINDING 6 — Story 2.6's two acceptance criteria contradict each other, and the story is not
buildable as written. This is the most serious finding in the assessment.**

Story 2.6's first two acceptance criteria are:

> **AC1 — Then** the tree is copied into the project by **the same mechanism as the other
> `_bmad/bme/*` modules**
> **AC2 — Given** a fresh install **When** the portability skills are invoked **Then** they
> resolve

Verified against the tree, AC1 does not produce AC2. Two independent reasons:

**(a) `_portability` has none of the structure that mechanism keys off.** Every other
`_bmad/bme/*` module carries a module descriptor plus agents and/or workflows:

| Module | Contents |
|---|---|
| `_vortex` | `config.yaml`, `module.yaml`, `agents/`, `workflows/`, `contracts/`, `module-help.csv`, … |
| `_team-factory` | `config.yaml`, `agents/`, `workflows/`, `lib/`, `schemas/`, `templates/`, `module-help.csv` |
| **`_portability`** | **`skills/` — and nothing else.** No `config.yaml`. No `module.yaml`. No `agents/`. No `workflows/`. |

**(b) Invocability does not come from copying.** `.claude/skills/` wrappers are *generated*, not
copied: `scripts/update/lib/refresh-installation.js:749` ("generate `.claude/skills/` for each
agent"), `:810` (Gyre agents), `:836` (standalone bme agents), `:909` ("each `standalone: true`
workflow gets a skill wrapper at `.claude/skills/{workflow.name}/SKILL.md`"). The generators key
off **agents** and **`standalone: true` workflows**. `_portability` ships four `SKILL.md` files
under `skills/` — a third shape neither generator recognises.

Confirming the consequence: the four skills — `bmad-export-skill`, `bmad-generate-catalog`,
`bmad-seed-catalog`, `bmad-validate-exports` — are **absent from this repository's own
`.claude/skills/`** (100 skills present, none of them these), even though the source tree is
right there. The failure reproduces in the development tree, where no packaging step is
involved at all. Copying the directory into an installed project would reproduce exactly that
state: files present, skills uninvocable.

*Impact, and why it is the worst one:* **FR14 is under-specified, and it blocks the epic's
terminal story.** Story 2.6 is not only FR14 — it is also where Story 2.4's installed-tree
assertion gets wired into the blocking path. So the epic's closing move depends on a story
whose central mechanism is unresolved. A dev agent handed Story 2.6 today would satisfy AC1,
watch AC2 fail, and have no specified path forward.

There is a second-order trap. If Story 2.4's assertion checks only *presence on disk* — which
is what FR13's text says ("fails if any shipped `_bmad/bme/*` module is absent from the
installed tree") — then it would **pass** on a `_portability` tree that was copied but remains
uninvocable. The gate would go green on the precise defect I141 was filed for. FR13 and FR14
are stated in different currencies: FR13 measures files present, FR14 promises "a capability
that ships is a capability I have". Only the second is what an operator experiences.

*Recommendation:* Story 2.6 needs a mechanism decision before it can be estimated — give
`_portability` a `config.yaml` and convert its four skills to the recognised shape, or extend
the wrapper generator to handle a bare `skills/` directory, or move the four skills into an
existing module. Whichever is chosen, Story 2.4's assertion must be specified to check
**invocability**, not just presence, or it will certify the bug as fixed.

Note also `project-context.md`'s `slash-command-ux-for-user-facing-tools`: *"Any user-facing
tool must be exposed as a BMAD slash-command skill, not as a bare CLI script."* These four are
authored as skills already, so the rule is satisfied in intent — but not in delivery, since no
operator can currently invoke them. FR14 is the story that owes that.

### Warnings

- ⚠️ **No architectural home for the `_bmad/bme/*` module contract.** Findings 5 and 6 both trace
  to the same absence: nothing states what a `_bmad/bme/*` module must contain to be installable
  and invocable. `_portability` violates an unwritten contract, which is why it shipped in
  `files[]` for a full release without anyone noticing. The epic accepts having no Architecture
  document — reasonable for a mini-epic — but this specific contract is what FR13 and FR14 are
  both circling, and neither can be specified precisely without it. It need not be a document;
  one paragraph in Story 2.6 would do.
- ⚠️ **Making four skills reachable exposes whatever Covenant state they are in.** The 2026-04-18
  baseline audit found 10 violations across 56 cells (~82% compliance) in existing skills. These
  four have been unreachable since they shipped, so it is unlikely anyone has audited them
  against OC-R0-R7. Story 2.6 turns them on for every operator. Worth one check before that
  happens — the epic's whole thesis is that shipping something an operator cannot use is a
  defect, and shipping something they *can* use that violates the Covenant is the adjacent one.

---

## Step 5 — Epic Quality Review

Validated against `create-epics-and-stories` standards: user value, epic independence, story
sizing, forward dependencies, and acceptance-criteria quality.

### Epic structure validation

**User value focus — ✓ PASS, and notably well done.**

"The package contains what it promises" is user-centric. So is every story title's framing —
*"As a Convoke operator, I want everything in the package to actually arrive when I install"*,
not *"add an assertion to try-fresh-install.sh"*. This epic is CI configuration, packaging
metadata and a regex fix; the standard's classic failure mode is exactly this kind of work
being written up as "Infrastructure Setup". It was not. Each story states the operator
consequence, and the epic's spine sentence — *"Nothing binds what is in the repository to what
an operator actually gets"* — is a user statement, not a technical one.

**Epic independence — ✓ PASS.** Epic 2 declares "Blocked on: nothing", which verification
supports: ADR-2 is accepted, and Epic 1 is `done` in `sprint-status.yaml`. No Epic 2 story
references a later epic; there is no Epic 3 (subtracted). No circular dependencies.

**Brownfield handling — ✓ PASS.** Correctly treated as brownfield. FR13 explicitly *rejects*
building a parallel mechanism ("NOT by a new grep over `scripts/**`") in favour of extending
`scripts/audit/try-fresh-install.sh`, the existing `fresh-install` job. Story 2.2 applies the
same reasoning to the tarball ("run against that harness's packed tarball rather than packing
its own — a second pack is a parallel mechanism"). Integration points are named, not assumed.

Starter-template and database-timing checks are **N/A** — no starter template in play, no
database in the product.

### 🔴 Critical violations

**FINDING 7 — Story 2.3 is epic-sized, not story-sized.**

Seven acceptance criteria bundling six independently-riskly workstreams:

1. **Package boundary change** — exclude `scripts/migration/format-conversion/` from `files[]`,
   after verifying no bin, no `scripts/update/**`, and no test resolves into it at runtime
2. **File move + mass rewrite** — relocate the Covenant and Checklist to `_bmad/bme/covenant/`,
   update **47 referencing files** (now 53 — see Finding 10), add a new `files[]` entry
3. **A known-corrupting rename path** — BUG-13 in `updateLinks`, which ADR-002 proved destroys a
   link on a colliding two-entry map, applied here across the whole file set
4. **Four named non-prose references** — `taxonomy.yaml:56`, `reference-integrity.js`,
   `covenant-survival-harness.js`, `artifact-utils.test.js`, each failing differently if missed
5. **CHANGELOG policy** — add `docs/migration/` to `files[]`, rule on two other links
6. **README asymmetry** — resolve `_bmad/bme/config.yaml` ship-or-drop, and `project-context.md`
   absolute-or-drop
7. **Wiring the FR12 gate in blocking**, in the same commit that turns it green

Any one of 1-6 can fail on its own and block 7 — and 7 is the story's entire reason for
existing, since Story 2.2 delivers nothing enforceable without it. The BUG-13 exposure alone
(item 3, over 53 files, using a path with a proven corruption mode) is a story's worth of care.

*Recommendation:* split. The natural seam is **decisions vs. execution**, which is the same
seam the epic already used successfully for ADR-1/2/3: one story that applies ADR-2's three
classes and resolves the open rulings, a second that performs the Covenant move with the BUG-13
assertion, a third that wires the gate. Alternatively split by class (1 / 2 / 3+wiring). Note
that Story 2.3 is the *only* story in this epic with this problem — 2.1, 2.4, 2.5, 2.6, 2.7 and
2.8 are all correctly sized.

**FINDING 8 — Story 2.3 settles four undecided policy questions inside its acceptance criteria,
which is the exact practice this epic created three ADRs to avoid.**

The epic states the principle plainly, in ADR-3's rationale: *"the epic must not choose inside
an acceptance criterion."* Story 2.3 does so four times:

| # | AC text | Undecided |
|---|---|---|
| 1 | "the ADR link plus `docs/BMAD-METHOD-COMPATIBILITY.md` are **dropped** from the shipped CHANGELOG **or** rendered as absolute URLs" | drop vs. absolute |
| 2 | "the asymmetry is resolved deliberately — **ship the config or drop the link**" | ship vs. drop |
| 3 | "`covenant-survival-harness.js` (**or let it go** with the Class 1 exclusion — decide, do not drift)" | update vs. abandon |
| 4 | "**either** FR12's checker validates absolute URLs too, **or** the policy forbids them in shipped docs" | **scope change to FR12's checker** |

I checked whether ADR-002 already settles these, since that is the ADR's job. **It does not.**
ADR-002's operator decision (2026-08-20) settles the big question — option (d), three classes,
Covenant to `_bmad/bme/covenant/` — but leaves these same three open in its own body: *"either
ships or the README stops linking it. Declare"* (`:110`), *"drop them from the shipped CHANGELOG
or render them as absolute URLs"* (`:116`), *"Either FR12's checker validates absolute URLs too,
or the policy forbids them"* (`:133`). The story inherits them verbatim.

Item 4 is the serious one: it is **not a policy choice, it is a scope change to FR12's
deliverable**, arriving inside a different story's AC. If the answer is "validate absolute URLs
too", Story 2.2's checker — already built by then under this story order — must grow network or
allowlist handling that neither FR12 nor Story 2.2 mentions. That is rework discovered at
wiring time.

And the epic itself names the failure mode: *"A detector with no paired decision gets
allowlisted the first time it goes red under release pressure — how the `pathContains` filter
and the badges gate were each neutralised."* Four undecided either/ors sitting in the ACs of the
story that wires the detector in is that risk, in the same shape.

*Recommendation:* resolve all four before Story 2.3 is picked up. Three are one-line operator
calls. Item 4 needs a real ruling because it changes FR12's scope — and it should be made
**before Story 2.2 is built**, not after, since 2.2 is the story that writes the checker.

### 🟠 Major issues

**FINDING 9 — Two deliberate forward dependencies, justified in principle, and one of them is
now live.**

Story 2.2 explicitly defers completion: *"it is NOT wired into CI by this story… Story 2.3
wires it in."* Story 2.4 does the same: *"Story 2.6 wires it in."* By the letter of the
standard, both are forward dependencies and both stories fail "independently completable" —
neither delivers anything an operator experiences.

**The rationale is sound and I am not asking for it to be reversed.** It follows from NFR10
(gates demonstrated failing) colliding with a hard structural constraint the epic documents
accurately: `fresh-install` runs on push to `main` and every PR, and `publish` `needs:` it, so
a gate merged red blocks every PR and every release. The epic's resolution — *"NFR10 requires
each gate demonstrated failing; it does not require it merged failing"* — is the right call, and
`continue-on-error` is correctly rejected.

**The residual risk is real, and Finding 6 has just realised it.** The pattern only holds if
the closing story lands. Story 2.4 is `ready-for-dev` today and Story 2.6 — its closer — is not
buildable as written. So the epic can reach a state where FR13's assertion exists, is proven to
work, and enforces nothing, with no scheduled path to wiring it in. An unwired gate rots: it
drifts against the code it checks and becomes the thing someone deletes as dead weight.

*Recommendation:* treat 2.2+2.3 and 2.4+2.6 as **atomic pairs for scheduling** — neither half
of a pair starts until its closer is unblocked and scheduled. Concretely: do not begin Story
2.4's successor work until Finding 6's mechanism decision is made.

### 🟡 Minor concerns

**FINDING 10 — ADR-002's 47-file count has drifted to 53 in ten days.**

Re-ran the ADR's own command today: `grep -rl 'convoke-covenant-operator\|convoke-spec-covenant-compliance-checklist'`
returns **53 files**, against the 47 recorded on 2026-08-20 — **+13%**.

This is *handled by design*: Story 2.3's AC already requires the grep be "re-run at
implementation time rather than trusting this count", and ADR-002 says the move is "enumerated,
not estimated". The mechanism worked exactly as intended, which is worth saying plainly.

The scheduling implication is the point. The count grows because ordinary work keeps writing
about the Covenant — each planning session, retro and story adds references. **Story 2.3 gets
monotonically more expensive the longer it waits**, and it is already the epic's largest story.
That is an argument for sequencing it early, or for Finding 7's split.

The four named non-prose references all still exist and `updateLinks` is still at
`scripts/lib/artifact-utils.js:1497` — those anchors have not drifted.

**FINDING 11 — Line-number anchors across the epic have drifted; the story text says to re-derive,
which mostly protects it.**

Confirmed drift: `docs:audit` is at `package.json:53`, not `:52`; the export-engine regex sites
have moved 11-22 lines (Finding 3). Stories 2.7 and 2.8 both carry explicit
"re-run mechanically at implementation time" clauses, and `derive-counts-from-source` binds the
rest, so this is a documentation-currency issue rather than a correctness one. Recorded because
a dev agent reading `:311` and finding an already-escaped call at `:322` may reasonably conclude
the story is done — which for two of the four sites, it is.

### Best-practices compliance checklist

| Check | Result |
|---|---|
| Epic delivers user value | ✅ Pass — strongly |
| Epic functions independently | ✅ Pass |
| Stories appropriately sized | ❌ **Fail — Story 2.3 (Finding 7)** |
| No forward dependencies | ⚠️ Two, deliberate and justified; one now live (Finding 9) |
| Clear, testable acceptance criteria | ⚠️ Excellent in form; four unresolved either/ors in 2.3 (Finding 8) |
| Traceability to FRs maintained | ✅ Pass — 8/8, no orphans |
| Database tables created when needed | N/A |
| Starter template story | N/A |

---

## Summary and Recommendations

### Overall Readiness Status

# ⚠️ NEEDS WORK

**Not because the epic is poorly built — it is one of the better-specified epics in this
repository — but because it has drifted out of date with its own codebase, and one story is not
implementable as written.**

The distinction matters for what you do next. This is not a re-planning job. Six of eight
stories need edits measured in minutes; one needs a decision; one needs splitting.

**What passes:**

- FR traceability: **8/8, no gaps, no orphans.** The FR Coverage Map's claim is accurate.
- Epic user-value framing: strong. Not a technical milestone dressed as an epic.
- Epic independence: clean. Nothing depends on a later epic.
- Brownfield integration: correctly extends existing harnesses rather than building parallel ones.
- UX N/A: correctly reasoned and correctly declared.
- Source-anchoring discipline: every FR traces to a backlog row or pre-mortem finding.

**What does not:**

- **Three of eight FRs no longer describe the tree** (FR11, FR17 shipped; FR16 half-shipped).
- **Story 2.6 is not buildable as specified** — its two central ACs contradict each other.
- **Story 2.3 is epic-sized** and carries four unresolved policy either/ors in its ACs.
- **Story 2.8's stated cause is refuted**, and the true scope is unestablished — possibly 75 rows, not 4.
- `sprint-status.yaml` disagrees with the repository on two stories.

### Critical issues requiring immediate action

**1. Story 2.6 cannot be built as written — and it is the epic's closing story. (Finding 6)**

AC1 says copy `_portability` "by the same mechanism as the other `_bmad/bme/*` modules"; AC2
says the skills then resolve when invoked. AC1 does not produce AC2. `_bmad/bme/_portability/`
contains only a `skills/` directory — no `config.yaml`, no `module.yaml`, no `agents/`, no
`workflows/` — while every other bme module has them, and `.claude/skills/` wrappers are
*generated* from agents and `standalone: true` workflows (`refresh-installation.js:749`, `:810`,
`:836`, `:909`), never copied. Proof that copying is insufficient: the four skills are absent
from this repository's own `.claude/skills/` right now, with the source tree present and no
packaging involved.

This blocks FR14 **and** the wiring of FR13's assertion, which Story 2.6 also carries.

**2. The `sprint-status.yaml` disagrees with the repository. (Findings 1, 2)**

`dist-2-1: backlog` — but FR11 shipped 2026-08-24 in `4556f4f0`, with the NFR10 red
demonstration recorded in the commit message. `dist-2-5: backlog` — but FR17 shipped in
`21ae3105`, a commit that names `dist-2-5` in its own subject line.

Handing either story to a dev agent today produces a no-op or a duplicate. And the T79
owed-close scan cannot catch this: it reads the backlog, not `sprint-status.yaml`.

**3. Story 2.5's design rationale has already been defeated. (Finding 2)**

The epic deliberately merged FR17 and FR18 on 2026-08-19 so one story would close BUG-19 "by
it alone". FR17 then shipped separately anyway. The story must be re-scoped to FR18 plus the
row-closure bookkeeping, and three of its four ACs rewritten.

**4. Story 2.8 is scoped to a symptom whose cause is refuted. (Finding 4)**

The four `[BROKEN-DEP]` findings reproduce exactly (`FAIL: 106 skills checked, 4 errors`), but
not for the reason recorded. The templates were not deleted — `readiness-report-template.md` and
`epics-template.md` both exist on disk. The rows' **`path` column** points at directories that
do not exist, and the classifier derives its search root from that column
(`validate-classification.js:249`). **75 of 106 manifest rows have this defect** — every
upstream row. Story 2.8's two permitted resolutions ("path corrected, or dependency dropped")
do not include the actual one.

Before it can be estimated, someone must rule: should `skill-manifest.csv` describe *this tree*
or *an installed project*? The two answers give completely different stories — a 75-row repair
in a shipped file, or four false positives and a classifier fix.

**5. Four policy either/ors sit unresolved inside Story 2.3's ACs, one of which changes FR12's
scope. (Finding 8)**

ADR-002 settled the big question but left three of these open in its own text; the story
inherited them. The fourth — *"either FR12's checker validates absolute URLs too, or the policy
forbids them"* — is a scope change to Story 2.2's deliverable, arriving inside Story 2.3's ACs.
It must be decided **before Story 2.2 is built**, or the checker gets reworked at wiring time.

The epic itself names this failure mode: *"A detector with no paired decision gets allowlisted
the first time it goes red under release pressure."*

### Recommended next steps

**Do first — cheap, and they unblock estimation (about an hour):**

1. **Reconcile `sprint-status.yaml`.** Mark `dist-2-1` done, citing `4556f4f0`. Re-scope
   `dist-2-5` to FR18 only, citing `21ae3105` for the FR17 half. *(Findings 1, 2)*
2. **Re-derive the stale anchors in Stories 2.7 and 2.8.** Story 2.7 is now two sites
   (`:521`, `:525`), not four. Both stories already mandate re-enumeration — this is executing
   their own instruction, not amending them. *(Findings 3, 11)*
3. **Rule on FR16's residue.** The two surviving sites interpolate `varName` from a hardcoded
   `configVarMap` of fixed identifiers; no persona name reaches them. Does FR16's "EVERY
   interpolated RegExp" bind provably-safe literals? Defensible either way — but note that
   Story 2.7's persona-name AC is **already satisfied by the two fixes that landed**, so its
   committed test would pass against current code, which NFR10's spirit forbids accepting as a
   demonstration. *(Finding 3)*

**Do before any Epic 2 story is picked up — these are decisions, not work:**

4. **Resolve Story 2.6's mechanism.** Give `_portability` a `config.yaml` and convert its four
   skills to the recognised shape; or extend the wrapper generator to handle a bare `skills/`
   directory; or fold the four skills into an existing module. **My recommendation: the first.**
   It makes `_portability` consistent with every other bme module rather than adding a third
   shape to the generator, and it is the option that writes down the module contract the repo is
   currently missing. *(Finding 6)*
5. **In the same pass, specify Story 2.4's assertion to check invocability, not just presence.**
   As FR13 is worded today ("fails if any shipped `_bmad/bme/*` module is absent from the
   installed tree"), the gate would go **green** on a `_portability` tree that was copied but
   remains uninvocable — certifying I141 as fixed while the operator still cannot run the skills.
   *(Finding 6)*
6. **Rule on `skill-manifest.csv`'s subject** — this tree, or an installed project — then
   re-scope Story 2.8 to whichever answer you give. *(Finding 4)*
7. **Resolve Story 2.3's four either/ors**, ideally as a short ADR-002 amendment rather than
   inside the story. Do the absolute-URL one first: it constrains Story 2.2, which is scheduled
   earlier. *(Finding 8)*

**Do when re-authoring:**

8. **Split Story 2.3.** Suggested seam — decisions / Covenant move with BUG-13 assertion / gate
   wiring. Sequence it early regardless: its file count grew from 47 to 53 in ten days and will
   keep growing, since ordinary planning work keeps adding Covenant references. *(Findings 7, 10)*
9. **Schedule 2.2+2.3 and 2.4+2.6 as atomic pairs.** Neither half starts until its closer is
   unblocked. Story 2.4 is `ready-for-dev` today while its closer is blocked — that is how a
   proven-working gate ends up wired into nothing and eventually deleted as dead weight.
   *(Finding 9)*
10. **Add a Covenant self-check AC to Story 2.5**, and declare an explicit N/A with rationale on
    the CI-only stories. Story 2.5's remaining substance is operator-facing warning text, which
    `covenant-compliance-for-convoke-skills` covers by its own definition. Also worth one
    Covenant pass over the four `_portability` skills before Story 2.6 turns them on for every
    operator. *(Finding 5)*

### A note on why this drifted

Nothing here is a planning failure. The epic was authored 2026-08-18 and last touched
2026-08-23; the drift arrived through the **Fast Lane**, which shipped T32 (FR11) on 2026-08-24
and the FR17 label fix while Epic 2 sat in `backlog`. Both were correct pieces of work,
correctly executed — `4556f4f0` even records its NFR10 red demonstration properly. They simply
were not reflected back into the epic.

`staleness-preflight-for-backlog-pickup` exists for exactly this, and it fired here as designed
— this assessment is that preflight. The structural gap worth noting is that **T79's owed-close
scan reads the backlog but not `sprint-status.yaml`**, so a story whose work ships through
another lane stays `backlog` with nothing watching. That is a candidate backlog row in its own
right, and it is the same class of defect as this epic's spine: *nothing binds the plan to what
was actually done.*

### Final note

This assessment identified **11 findings across 5 categories** — 2 critical, 3 major, and 6
minor or currency-related — plus one systemic observation about status tracking.

**Traceability passes. Currency fails.** Address items 1-7 before Epic 2 is picked up; items
8-10 when the stories are re-authored. None of this requires re-planning the epic.

---

**Assessed by:** Winston (System Architect) · **Date:** 2026-08-30
**Method:** `bmad-check-implementation-readiness`, 6 steps, all findings verified against the
working tree at `main` per `spec-verify-referenced-files` and `verification-must-be-falsifiable`.
Commands and file:line anchors are recorded inline so every claim is independently re-runnable.
