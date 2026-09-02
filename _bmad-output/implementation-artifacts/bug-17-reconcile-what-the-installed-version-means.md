<!-- baseline_commit deliberately ABSENT — stamped by dev-story at implementation start. -->
# Bug Story (BUG-17): Reconcile what "the installed version" means

Status: ready-for-dev

**Lane:** Bug (BUG-17, RICE 4.5) · **Standalone** — deliberately NOT filed into `dist-epic-2`, whose
spine is link/manifest integrity; this is update-path integrity.
**Authority:** [ADR-004 C1](../planning-artifacts/adr/4-0-1/adr-004-bme-module-contract.md) — no new ADR.
**Pre-flight:** run 2026-09-02, **YELLOW**, row refreshed. See the backlog Change Log entry of that date.

## Story

As a **Convoke operator whose install has drifted**,
I want `convoke-update` to actually repair the module skew `convoke-doctor` reports,
so that **a health check I am told to act on stops being a command that changes nothing**.

### What this story is, in one line

`convoke-doctor` and `convoke-update` disagree about what "the installed version" is — doctor reads
every module, update reads only `_vortex` — so any non-`_vortex` skew reports forever and no command
fixes it. **Only the gate is wrong; the repair already exists.**

---

## Acceptance Criteria

**AC1 — The two sides enumerate modules from ONE definition**

**Given** `discoverModules` is private to `convoke-doctor.js:117-148` and nothing else can see it, while
`getCurrentVersion()` at `version-detector.js:27` hardcodes a single path —
`const configPath = path.join(projectRoot, '_bmad/bme/_vortex/config.yaml');` (verified at HEAD 2026-09-02)
**When** this story completes
**Then** module discovery lives in one shared module — `scripts/lib/bme-modules.js` — imported by both
`convoke-doctor.js` and `scripts/update/lib/version-detector.js`
**And** the story states plainly **why Rule of Three is overridden here at instance two**: the defect
*is* two sides enumerating different module sets, so a second copy would reproduce BUG-17 the next time
one copy learns about a directory the other does not. This is a correctness invariant, not DRY.
**And** doctor's behaviour is unchanged by the extraction — the function moves, it does not change

**AC2 — Skew is detected WITHOUT widening `getCurrentVersion()`**

**Given** `getCurrentVersion()` returns a scalar consumed by `getMigrationPath`, `registry.getMigrationsFor`,
`registry.getBreakingChanges`, `convoke-version` and `convoke-migrate` — all of which key off **Vortex's**
migration history, so a min-across-modules value would feed the migration registry a version it was never
built to receive
**When** this story completes
**Then** `getCurrentVersion()` still returns Vortex's version, unchanged, and no caller is touched
**And** a **new** `detectModuleSkew(projectRoot)` returns `{ behind: [{name, version}], ahead: [{name, version}] }`
against `getPackageVersion()`, classified with the existing `compareVersions()`
**And** a module whose `config.yaml` is absent, unparseable, or carries a non-string / non-semver `version`
is **not** silently coerced into either bucket — it is reported separately or omitted, never counted as
"behind" (this is BUG-18's territory; do not fix BUG-18 here, but do not create it either)

**AC3 — A behind-skewed install stops reporting "up to date" — the close**

**Given** `assessUpdate` returns `{ action: 'up-to-date' }` at `convoke-update.js:52-54` off the `_vortex`
read alone, and `convoke-update.js:277` then prints `✓ Already up to date!` and exits 0 **before**
`refreshInstallation` is ever reached
**When** an install has `_vortex` at the package version and any other module behind it
**Then** `assessUpdate` returns `refresh-only`, the existing `refresh-only` path runs, and
`refreshInstallation` re-stamps every module
**And** the red demonstration is performed and recorded: an isolated fixture with `_vortex` at the package
version and `_gyre` behind **reproduces `up-to-date` before the change** and yields `refresh-only` after —
NFR10. A test that only asserts the post-state proves nothing about the bug

**AC4 — Doctor's finding splits, and only the actionable half keeps the advice**

**Given** `checkVersionConsistency` (`convoke-doctor.js:600-631`) emits ONE finding for every skewed module
and attaches `fix: npx -p convoke-agents@${packageVersion} convoke-update` (`:622`) to all of them — advice
that is a confirmed no-op for behind-skew today and an E404 for ahead-skew
**When** this story completes
**Then** behind-skew keeps that `fix:` line, which AC3 has made **true**
**And** ahead-skew becomes a **distinct, differently-worded finding carrying NO `convoke-update` advice**,
because a module ahead of the package names a version that may never have been published
**And** the existing comment at `:617-621` — recording that pinning to the higher version was tried and
reverted on ETARGET — is **preserved**, not deleted as stale; it is the reason ahead-skew is excluded
**And** ahead-skew is explicitly **out of scope** and stays with **T38**, which is
`blocked-until: issue #7 session lands`. Bundling it would import that block into this row

**AC5 — A dev tree does not become a NEW dead loop**

**Given** every write in `refreshInstallation` is guarded on `!isSameRoot` (`:46`) — Vortex config `:667`,
Enhance `:307-312`, Artifacts `:414-421`, Gyre `:504-512`, standalone submodules `:241-269` — so when
`packageRoot === projectRoot` a refresh stamps **nothing**
**When** a checkout has `_vortex` at the package version and the other modules at template `1.0.0`
**Then** routing it to `refresh-only` must **not** print success: after the refresh, skew is re-checked, and
surviving skew is reported as a distinct finding naming the surviving modules and the reason
(`source tree is the installation`)
**And** the story states plainly that **AC3 without AC5 reproduces BUG-17 through a different door** —
skew detected → refresh → nothing stamped → skew detected → forever
**And** the test asserts skew is **GONE** after refresh in a real fixture, and **reported** after refresh in a
same-root fixture. "Refresh ran" is not the assertion; `verification-must-be-falsifiable`
**And** it is recorded that this does not fire in *this* repository today only by accident: `_vortex` is
`4.0.0` against package `4.0.1`, which lands in the upgrade branch, not `up-to-date` (verified 2026-09-02)

**AC6 — Tests run against fixtures, never the package root**

**Given** `test-fixture-isolation`, and that `assessUpdate` (`convoke-update.js:512`) and
`checkVersionConsistency` (`convoke-doctor.js:1108`) are both already exported and directly drivable
**When** the tests are written
**Then** every case builds its module tree in a `before()` tmpdir and cleans up in `after()`; no case reads
`PACKAGE_ROOT`, whose module versions are `_vortex 4.0.0` / four modules at `1.0.0` / package `4.0.1` and
will drift again
**And** `npm test` and `npm run lint` both pass, counts pasted into the commit Description

**AC7 — BUG-17 closes, as a move**

**Given** `backlog-write-discipline` — closing a row is a MOVE, not a status edit
**When** this story completes
**Then** the BUG-17 row is deleted from §2.2, a receipt is appended to §2.5, and a Change Log entry is added,
all in the same edit
**And** `node scripts/audit/backlog-integrity.js` is run and its result pasted into the commit Description
**And** the ahead-skew half is **not** claimed as closed — T38 still owns it

---

## Tasks / Subtasks

- [ ] **T1** — Extract `discoverModules` verbatim to `scripts/lib/bme-modules.js`; import in doctor and version-detector (AC1)
- [ ] **T2** — Add `detectModuleSkew(projectRoot)`; leave `getCurrentVersion()` untouched (AC2)
- [ ] **T3** — Record the RED: fixture reproduces `up-to-date` on behind-skew, BEFORE any fix (AC3, NFR10)
- [ ] **T4** — Branch `assessUpdate` on skew after the up-to-date verdict (AC3)
- [ ] **T5** — Split `checkVersionConsistency` into behind/ahead findings; preserve the `:617-621` comment (AC4)
- [ ] **T6** — Post-refresh skew re-check in `convoke-update`; same-root fixture proves it reports rather than succeeds (AC5)
- [ ] **T7** — Tests, isolated fixtures, both directions (AC6)
- [ ] **T8** — Close BUG-17 as a move; run `backlog-integrity.js` (AC7)

---

## Dev Notes

### What the pre-flight found, and why it changed the story

The row's own **Fix direction** said a fix must make *"`convoke-update` refresh them all."* That work
**already shipped** under `ag-7-1`. `refreshInstallation` stamps Enhance (`:307-312`), Artifacts
(`:414-421`), Gyre (`:504-512`) and standalone submodules (`:241-269`), and says so in a comment at
`:664-666`.

A dev agent handed the unrefreshed row would have built the repair path a **second time** and left the
actual defect — the gate at `convoke-update.js:52` — untouched. Instance and gate decayed at different
rates inside one row, which is the `I133`/`I157` pattern the staleness rule's qualification-time arm names.
The row was refreshed 2026-09-02 before this story was authored.

### Why there is no ADR

BUG-17's row ended *"Needs a decision, not a patch."* Half that decision was made 15 days later by
**ADR-004 C1**, which states that every `_bmad/bme/*` module in `files[]` carries a stamped `config.yaml`
and that an unstamped module fails Convoke's own version-consistency check. That is "one versioned product,
modules lock-step." Doctor believes it; `refreshInstallation` enforces it; only `getCurrentVersion()`
dissents, and it predates the multi-module tree.

Writing ADR-005 would spend the meta-model baseline's hard budget restating an accepted contract — the
growth ADR-004 warns against in its own trade-off section. **Cite C1; do not author a new ADR.**

### The trap this story exists to avoid

**Widening `getCurrentVersion()` is the obvious fix and it is the expensive one.** It reads as a one-line
change — return the lowest module version instead of Vortex's. But that scalar feeds the migration
registry, which was built assuming the value is Vortex's own history. A `_gyre` at `1.0.0` would route an
operator through Vortex migrations for `1.0.x`. The containment is to leave the scalar alone and add a
second, separate question (`detectModuleSkew`) that only `assessUpdate` asks.

### Cross-story dependencies

| Item | Relationship |
|---|---|
| **ADR-004 C1** | Authority for AC2's lock-step premise. Accepted 2026-08-30 |
| **T38** | Owns ahead-skew. `blocked-until: issue #7`. Must NOT be bundled (AC4) |
| **BUG-18** | Sibling from the same review. Malformed-version handling. AC2 must not *create* it; do not *fix* it here |
| **BUG-16** | Closed, in §2.5. Its guidance-pinning produced the `:622` fix line this story makes true |
| **BUG-17** | Closes here (AC7) |

### References

- `scripts/update/lib/version-detector.js:27` — the single-path read; the defect
- `scripts/update/convoke-update.js:52-54`, `:277`, `:512` — the gate, the message, the export
- `scripts/convoke-doctor.js:117-148`, `:600-631`, `:617-621`, `:622`, `:1108`
- `scripts/update/lib/refresh-installation.js:46`, `:241-269`, `:307-312`, `:414-421`, `:504-512`, `:664-667`
- ADR-004 C1 — modules are lock-step with the package by contract
- `project-context.md` — `test-fixture-isolation`, `verification-must-be-falsifiable`, `backlog-write-discipline`

---

## Commit Plan

```
fix(BUG-17): make the version-skew doctor reports repairable
```

Body: the RED reproduction (fixture reporting `up-to-date` on behind-skew before the change), the same-root
fixture output showing skew reported rather than success, `npm test` and `npm run lint` counts, and the
`backlog-integrity.js` result for the BUG-17 move.

---

## Change Log

| Date | Change |
|---|---|
| 2026-09-02 | Authored standalone after a YELLOW staleness pre-flight refreshed the BUG-17 row. Design ruled option (c) by the operator; no ADR (ADR-004 C1 is the authority). AC5 added from a hazard found during design, not present in the backlog row. |

---

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
