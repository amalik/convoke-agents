---
baseline_commit: d13e77529d3ba889a4a1e2aafa30b3c07075b595
---
# Bug Story (BUG-17): Make the update gate see what the doctor sees

Status: review

**Lane:** Bug (BUG-17, RICE 4.5) · **Standalone** — not part of `dist-epic-2`, whose spine is
link/manifest integrity; this is update-path integrity.
**Authority:** [ADR-004 C1](../planning-artifacts/adr/4-0-1/adr-004-bme-module-contract.md) — modules
are lock-step with the package by contract. No new ADR.

> **This story was rewritten on 2026-09-02 after three review rounds.** Earlier revisions specified a
> much wider change — classifying every version shape and deciding what `convoke-doctor` should advise
> for each. That was attempted three times and failed three times, each round's remedies producing the
> next round's defects. The widened design was reverted rather than patched a fourth time. This
> document describes what shipped; the residue is filed as T114, T115 and T116 with reproductions.
>
> **No line numbers.** Four attempts to keep line citations current during this work rotted within the
> hour, twice inside the comment written to warn about it. Symbols only. The sole exception is
> `scripts/audit/lib/installed-tree.js`, where a gate checks them on every run.

## Story

As a **Convoke operator whose install has drifted**,
I want `convoke-update` to repair the module skew `convoke-doctor` reports,
so that **a health check I am told to act on stops being a command that changes nothing**.

### What this story is, in one line

`convoke-doctor` checks every `_bmad/bme/*/config.yaml`; `getCurrentVersion()` read only `_vortex`.
**Only the gate was wrong — the repair already existed.**

---

## Acceptance Criteria

**AC1 — The two sides enumerate the same modules and compare them the same way**

**Given** `convoke-doctor`'s version check iterates every `_bmad/bme/*/config.yaml`, while
`getCurrentVersion()` in `version-detector.js` reads a single hardcoded path
**When** this story completes
**Then** module discovery lives in `scripts/lib/bme-modules.js` and the gate reads it
**And** the two sides share the **comparison** as well as the set: `compareVersions('4.0.1+abc','4.0.1')`
is 0 under SemVer §10 while the strings differ, so a design sharing only the set would leave doctor
reporting a mismatch the gate cannot see — BUG-17 rebuilt inside its own fix

**AC2 — `getCurrentVersion()` is not widened**

**Given** its scalar return feeds `getMigrationPath`, `registry.getMigrationsFor`,
`registry.getBreakingChanges`, `convoke-version` and `convoke-migrate`, all keyed to **Vortex's**
migration history
**When** this story completes
**Then** it is unchanged and no caller is touched
**And** skew is a separate question, asked only by `assessUpdate`

**AC3 — A behind sibling routes to a refresh — the close**

**Given** `assessUpdate` returned `up-to-date` off the `_vortex` read alone and exited before
`refreshInstallation` was reached
**When** an install has `_vortex` current and a managed sibling behind
**Then** it returns `refresh-only` and the existing path re-stamps every module
**And** the demonstration is falsifiable: disabling the branch turns the tests red
**And** the plan says what it is doing. On this path `currentVersion === targetVersion`, so the upgrade
banner would render `From: 4.0.1 / To: 4.0.1` in red-to-green and read as a bug in the tool

**AC4 — Only modules a refresh can actually stamp are routed**

**Given** `refreshInstallation` stamps a fixed set, and `repairable` is a claim about that function
**When** a module outside it is behind — vendored, left by an older install, or operator-authored
**Then** it is not routed. Routing it made `convoke-update` take the lock, cut a backup, change nothing
and report a problem it could not solve — BUG-17's own shape, rebuilt in its fix
**And** the set is declared beside the stamp sites and imported, never retyped

**AC5 — `convoke-doctor` is unchanged**

**Given** doctor already reported this skew correctly; the defect was that no command acted on it
**When** this story completes
**Then** `scripts/convoke-doctor.js` is byte-identical, verified by diffing its **output** against the
previous version on this repository
**And** the classes doctor reports that an update still cannot repair are **not** claimed as fixed —
they are T114, T115, T116, BUG-18 and T38

**AC6 — Tests run against fixtures, never the package root**

**Given** `test-fixture-isolation`
**When** the tests are written
**Then** each case builds its module tree in a tmpdir and cleans up in `finally`; no case depends on
this repository's own module versions
**And** `npm test`, `npm run test:integration` and `npm run lint` pass

**AC7 — BUG-17 closes, as a move**

**Given** `backlog-write-discipline` — closing a row is a MOVE, not a status edit
**When** this story completes
**Then** the row leaves §2.2 for §2.5 with a receipt and a Change Log entry, in one edit
**And** `backlog-integrity.js` is run and its result pasted into the commit Description
**And** the residual classes are filed as rows, with reproductions, rather than implied closed

---

## Tasks / Subtasks

- [x] **T1** — Shared `discoverModules` + `detectRepairableSkew` in `scripts/lib/bme-modules.js` (AC1)
- [x] **T2** — Export `STAMPABLE_MODULES` from `refresh-installation.js`; require a present package source too (AC4)
- [x] **T3** — Branch `assessUpdate` after the up-to-date verdict; skew-aware Update Plan (AC3)
- [x] **T4** — Tests, isolated fixtures, mutation-checked (AC6)
- [x] **T5** — Verify `convoke-doctor` output is byte-identical (AC5)
- [x] **T6** — Close BUG-17 as a move; file T114/T115/T116 (AC7)

---

## Dev Notes

### What the defect was, and was not

Not a missing repair. `refreshInstallation` has stamped every module since `ag-7-1`. The gate returned
`up-to-date` from a `_vortex`-only read and exited before the refresh. This widens **detection** only.

### The scope decision, and why it is in the code

Three rounds of adversarial review established that "make every version finding advise only what a
command can change" is a substantially larger problem than BUG-17 reports — and that I could not land
it. Round 2 measured ~20 of 33 findings as defects in Round 1's own corrections; Round 3 falsified the
replacement design's central claim by running `convoke-doctor` in this repository, and showed the claim
was wrong in principle, because routing is decided by `detectInstallationScenario` and
`getCurrentVersion` before any skew predicate is consulted.

The SCOPE note at the top of `scripts/lib/bme-modules.js` records what is deliberately not handled and
points at the rows. It is in the source rather than only here, because that is where the next person
will be standing when they consider widening it.

### References

- `scripts/lib/bme-modules.js` — the shared enumeration, and the SCOPE note
- `scripts/update/lib/refresh-installation.js` — `STAMPABLE_MODULES`, declared beside the stamp sites
- `scripts/update/convoke-update.js` — `assessUpdate`'s skew branch
- ADR-004 C1 — modules are lock-step with the package by contract
- T114, T115, T116, BUG-18, T38 — what this story does not close

---

## Commit Plan

```
fix(BUG-17): make the update gate see the module skew the doctor reports
```

Body: the reproduction and its mutation check, the byte-identical doctor output, the three gate results,
`backlog-integrity.js`, and the scope decision with the rows it produced.

---

## Change Log

| Date | Change |
|---|---|
| 2026-09-02 | **Narrow review pass over `scripts/lib/bme-modules.js` — four findings, all fixed in `a0539c83`.** The file was rewritten after Round 3, so no round had reviewed its shipped form. It had dropped `convoke-doctor`'s `version \|\| installed_version` fallback, recreating BUG-17's symptom inside its own fix — a hazard an earlier revision of this story had named verbatim in AC1 before the rewrite discarded both the AC and the code. Restored to exact parity with a regression test. Also: a swallowed `require` failure that turned a skewed tree into `✓ Already up to date!`, a header comment overclaiming single-sourcing, and a `Behind:` label on a `divergent` module. Gates after: `npm test` 1981/1980/1 skip, `npm run test:integration` 124/124, lint clean. |
| 2026-09-02 | Authored, implemented, reviewed in three adversarial rounds, then **reduced**. The widened design from Rounds 1-2 was reverted rather than patched a fourth time, per `code-review-convergence`'s restructure-do-not-patch clause. This document was rewritten from scratch: earlier revisions had accumulated false statements across amendments, and an automated citation edit had mangled several sentences. Residue filed as T114/T115/T116. |

---

## Dev Agent Record

### Agent Model Used

Claude Opus 5 (1M context), via `bmad-dev-story` and `bmad-code-review`.

### Debug Log References

- **RED first:** a fixture with `_vortex` at the package version and `_gyre` behind returned
  `action: 'up-to-date'` before the change.
- **Falsifiable:** forcing the new branch off turns 2 unit tests red; restoring turns them green.
- **AC5 verified by output, not by inspection:** `convoke-doctor` run against this repository before
  and after the change produces byte-identical output.
- **Gates:** `npm test` 1980 / 1979 pass / 1 pre-existing skip · `npm run test:integration` 124 / 124 ·
  `npm run lint` clean · `backlog-integrity.js` PASS, exit 0.

### Completion Notes List

**Shipped:** shared module enumeration and comparison; `STAMPABLE_MODULES` declared beside the stamp
sites and required to have a present package source; one `assessUpdate` branch; a skew-aware Update
Plan. `convoke-doctor` untouched. `getCurrentVersion()` untouched.

**Not shipped, and not claimed:** anything that changes what doctor advises. T114 (a source checkout
repairs nothing, so doctor's advice is still wrong there — reproducible with `node
scripts/convoke-doctor.js` in this repo), T115 (four gate branches refuse before skew is consulted),
T116 (a numeric `_vortex` version crashes `convoke-update`), BUG-18, T38.

**The transferable finding.** Across three rounds every defect came from the same move: widening the
change to close one more class, then discovering the new machinery interacted wrongly with the old.
The rule that would have prevented all of it is worth more than the fix — *no finding may advise a
command that cannot change the thing it is about* — but it belongs to T114, where it can be designed
against the branches that actually decide routing, rather than asserted from a predicate that models
only one of them.

### File List

**Source**
- `scripts/lib/bme-modules.js` — NEW. Shared `discoverModules`, `detectRepairableSkew`,
  `isManagedByInstaller`, and the SCOPE note.
- `scripts/update/convoke-update.js` — `assessUpdate` skew branch; skew-aware Update Plan.
- `scripts/update/lib/refresh-installation.js` — exports `STAMPABLE_MODULES`.

**Tests**
- `tests/unit/module-skew.test.js` — NEW.
- `tests/integration/module-skew-refresh.test.js` — NEW.

**Governance**
- `_bmad-output/planning-artifacts/convoke-note-initiative-lifecycle-backlog.md` — BUG-17 closed as a
  move; T114, T115, T116 filed.
- `_bmad-output/implementation-artifacts/sprint-status.yaml` — status transitions.
- `_bmad-output/implementation-artifacts/bug-17-reconcile-what-the-installed-version-means.md` — this file.
