# Story 2.6: Make `_portability` reachable, and wire the installed-tree assertion in

Status: ready-for-dev

<!-- baseline_commit deliberately ABSENT — it is `dev-story`'s field, stamped at implementation
     start. Pre-stamping it in dist-1-2 caused a rule deviation the operator had to ratify. -->

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

- [ ] **T1 — Conform the module (AC1, AC2)**
  - [ ] `git mv _bmad/bme/_portability/skills _bmad/bme/_portability/workflows`
  - [ ] Author `_bmad/bme/_portability/config.yaml` modelled on `_bmad/bme/_artifacts/config.yaml`, four `standalone: true` entries with `entry: workflows/<name>/workflow.md`
  - [ ] Rewrite the four `SKILL.md` load directives to the absolute `{project-root}` form
- [ ] **T2 — Move the manifest rows with the files (AC3)**
  - [ ] Update the `path` column on all four rows; re-derive the count
  - [ ] Run `validate-classification.js`; confirm findings unchanged at baseline
- [ ] **T3 — Add the install path (AC4)**
  - [ ] Mirror the Artifacts copy block; honour `isSameRoot`
  - [ ] Stamp `version` with `doc.set`, per I137
  - [ ] Mirror the Artifacts wrapper-generation block
- [ ] **T4 — Extend the orphan sweep (AC5)**
  - [ ] Add portability names to the union; verify wrappers survive two consecutive refreshes
- [ ] **T5 — Correct INSTALLATION.md (AC6)**
- [ ] **T6 — Prove it on a real install (AC7)**
  - [ ] Fresh install to a temp project; confirm four wrappers; invoke one end-to-end
- [ ] **T7 — Wire 2.4's assertion in, blocking, asserting invocability (AC8)**
  - [ ] Confirm the assertion has zero findings BEFORE wiring
  - [ ] Amend it to C2 (wrapper resolves) if 2.4 shipped it as C4 (directory present)
  - [ ] Re-run `fresh-install` locally end-to-end
- [ ] **T8 — Tests**
  - [ ] Mirror `tests/unit/refresh-installation-artifacts.test.js` for portability
  - [ ] Extend `tests/unit/refresh-installation-orphan-cleanup.test.js` for AC5
  - [ ] Add a validator block symmetric with `validator.js:638-694`, and cover it in `tests/unit/validator.test.js`
  - [ ] Every test uses an isolated fixture dir, never `PACKAGE_ROOT` (`test-fixture-isolation`)

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
| 2026-08-30 | Re-authored against ADR-004 (option (a) accepted). Previous AC1/AC2 were mutually unsatisfiable; replaced with AC1-AC9. Dangling NFR6 citation corrected to `derive-counts-from-source`. |

---

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
