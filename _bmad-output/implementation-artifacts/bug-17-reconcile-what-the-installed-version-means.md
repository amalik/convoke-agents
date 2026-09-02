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

**AC1 — The two sides enumerate modules from ONE definition AND compare them the same way**

**Given** `discoverModules` is private to `convoke-doctor.js:117-148` and nothing else can see it, while
`getCurrentVersion()` at `version-detector.js:27` hardcodes a single path —
`const configPath = path.join(projectRoot, '_bmad/bme/_vortex/config.yaml');` (verified at HEAD 2026-09-02)
**When** this story completes
**Then** module discovery lives in one shared module — `scripts/lib/bme-modules.js` — imported by both
`convoke-doctor.js` and `scripts/update/lib/version-detector.js`
**And** the story states plainly **why Rule of Three is overridden here at instance two**: the defect
*is* two sides enumerating different module sets, so a second copy would reproduce BUG-17 the next time
one copy learns about a directory the other does not. This is a correctness invariant, not DRY.
**And** the two sides also share the **comparison**, not only the module set. This is the finding that nearly
rebuilt BUG-17 inside its own fix, and it is confirmed by execution rather than argued:
`compareVersions('4.0.1+abc', '4.0.1')` returns **0** (build metadata dropped, SemVer §10) while doctor's
`installedVersion !== packageVersion` (`convoke-doctor.js:607`) returns **true**. A module stamped
`4.0.1+abc` against package `4.0.1` would therefore make doctor report skew while `assessUpdate` finds none
and returns `up-to-date` — **BUG-17 verbatim, rebuilt inside the fix for BUG-17**. Sharing the module set
closes one half of the disagreement; the comparator is the other half
**And** the resolution keeps doctor's sensitivity rather than weakening it: `detectModuleSkew` returns a
**third bucket**, `divergent` — same precedence under `compareVersions` but a different version string.
Divergent modules are re-stampable by `refreshInstallation` exactly like behind ones, so they route WITH
`behind`. Narrowing doctor to `compareVersions(...) !== 0` instead would silently stop reporting a real drift
class, which is the opposite of this story
**And** doctor's module-set behaviour is unchanged by the extraction — the function moves, it does not change

**AC2 — Skew is detected WITHOUT widening `getCurrentVersion()`**

**Given** `getCurrentVersion()` returns a scalar consumed by `getMigrationPath`, `registry.getMigrationsFor`,
`registry.getBreakingChanges`, `convoke-version` and `convoke-migrate` — all of which key off **Vortex's**
migration history, so a min-across-modules value would feed the migration registry a version it was never
built to receive
**When** this story completes
**Then** `getCurrentVersion()` still returns Vortex's version, unchanged, and no caller is touched
**And** a **new** `detectModuleSkew(projectRoot)` returns
`{ behind: [{name, version}], ahead: [{name, version}], divergent: [{name, version}] }` against
`getPackageVersion()`, classified with the existing `compareVersions()` plus the string check that defines
`divergent` (AC1)
**And** it reads the version with the **same fallback doctor uses** — `mod.config.version ||
mod.config.installed_version` (`convoke-doctor.js:606`). Reading only `.version` would leave a module that
declares `installed_version` visible to doctor and invisible to update: the same disagreement, a third time
**And** `_vortex` is **excluded** from all three buckets. `getCurrentVersion()` already owns it and
`assessUpdate` has already branched on it before skew is consulted, so including it would double-route the
same module through two independent paths
**And** a module whose `config.yaml` is **unparseable** (`mod.config === null`) or carries a non-string /
non-semver `version` is **not** silently coerced into any bucket — it is omitted, never counted as "behind"
(this is BUG-18's territory; do not fix BUG-18 here, but do not create it either)
**And** a module directory with **no `config.yaml` at all** — `_portability`'s exact shape today — is
invisible to `discoverModules` by construction (`convoke-doctor.js:127`) and stays that way. An earlier
draft of this AC offered "reported separately", which AC1 makes unreachable: reporting it would require
changing `discoverModules`, which AC1 forbids. Detecting that class is **ADR-004 C1's** job — a module in
`files[]` MUST carry a stamped `config.yaml` — not this story's

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
**And** the operator-facing banner is corrected for this path. `refresh-only` prints an Update Plan at
`convoke-update.js:326-328` reading `From: <red current>` / `To: <green target>`, written for a version
*change*. On the skew path `currentVersion === targetVersion`, so it renders `From: 4.0.1 / To: 4.0.1` in
red-to-green, which reads as a bug in the tool. The skew path must say what it is actually doing — naming
the skewed modules — rather than reusing the upgrade banner.
**And** `--dry-run` on the skew path exits at `convoke-update.js:338`, **before** the refresh and therefore
before AC5's re-check. The dry-run output must name the skewed modules it would re-stamp, and must not imply
a repair that AC5 shows a same-root tree will not perform
**And** the defect is presentational ONLY, verified 2026-09-02 rather than assumed: `printChangelog`
early-returns on zero entries (`:477`) so it prints nothing; `runRefreshOnly(currentVersion)` (`:357`) and
`_runPostUpgradeGate` (`:375`) are both safe when the versions are equal. Do not widen this AC into a
refactor of the refresh path

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
**And** the ahead finding declares whether it sets `softWarning: true`. Doctor's exit gate
(`convoke-doctor.js:109`) counts any `passed: false` without `softWarning` as a hard failure, so an
ahead-only install would exit 1 **permanently on a state with no available fix**, T38 being blocked. Ruling:
soft-warn it — NFR9's fail-soft contract exists for exactly this shape
**And** the both-buckets case is routed explicitly: when behind and ahead are BOTH non-empty, refresh repairs
behind and ahead survives. The behind finding must not claim a full repair, or the operator runs the advised
fix, sees doctor still red, and concludes the fix did nothing — the BUG-17 experience, one layer up
**And** ahead-skew is explicitly **out of scope** for repair and stays with **T38**, which is
`blocked-until: issue #7 session lands`. Bundling its *fix* would import that block into this row; splitting
its *reporting* here does not

**AC5 — A dev tree does not become a NEW dead loop**

**Given** every write in `refreshInstallation` is guarded on `!isSameRoot` (`:46`) — Vortex config `:668-681`,
Enhance `:307-312`, Artifacts `:414-422`, Gyre `:504-512`, standalone submodules `:241-269` — so when
`packageRoot === projectRoot` a refresh stamps **nothing**
**When** a checkout has `_vortex` at the package version and the other modules at template `1.0.0`
**Then** routing it to `refresh-only` must **not** print success: after the refresh, skew is re-checked, and
surviving skew is reported as a distinct finding naming the surviving modules and the reason
(`source tree is the installation`)
**And** the banner to gate is named, not left to judgement: `✓ Update completed successfully!` at
`convoke-update.js:360`. A re-check added *after* that line prints success and then contradicts it
**And** the re-check sits **after `result` inside the `try`**, never in the `catch` at `:369-371` — a refresh
that threw leaves a half-stamped tree, and skew measured there is noise, not a finding
**And** the exit code is specified: `convoke-update.js:377` exits 0 unconditionally today. On surviving skew
it must exit non-zero, or CI and scripts read success while the install stays unrepaired
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
- [ ] **T2** — Add `detectModuleSkew(projectRoot)` returning behind/ahead/**divergent**, sharing doctor's version-key
  fallback and excluding `_vortex`; leave `getCurrentVersion()` untouched (AC1, AC2)
- [ ] **T2b** — Prove the comparator divergence closes: `4.0.1+abc` against package `4.0.1` must route to refresh,
  not to `up-to-date`. This is the case that would have rebuilt BUG-17 inside its own fix (AC1)
- [ ] **T3** — Record the RED: fixture reproduces `up-to-date` on behind-skew, BEFORE any fix (AC3, NFR10)
- [ ] **T4** — Branch `assessUpdate` on skew after the up-to-date verdict (AC3)
- [ ] **T5** — Split `checkVersionConsistency` into behind/ahead findings; preserve the `:617-621` comment (AC4)
- [ ] **T6** — Post-refresh skew re-check in `convoke-update`, placed after `result` inside the `try`, gating the
  `:360` success banner and the `:377` exit code; same-root fixture proves it reports rather than succeeds (AC5)
- [ ] **T6b** — Route the ahead-only case to `softWarning: true`, and the both-buckets case to a behind finding that
  does not claim a full repair (AC4)
- [ ] **T7** — Tests, isolated fixtures, both directions (AC6)
- [ ] **T8** — Close BUG-17 as a move; run `backlog-integrity.js` (AC7)

---

## Dev Notes

### What the pre-flight found, and why it changed the story

The row's own **Fix direction** said a fix must make *"`convoke-update` refresh them all."* That work
**already shipped** under `ag-7-1`. `refreshInstallation` stamps Enhance (`:307-312`), Artifacts
(`:414-422`), Gyre (`:504-512`) and standalone submodules (`:241-269`), and says so in a comment at
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
- `scripts/update/lib/refresh-installation.js:46`, `:241-269`, `:307-312`, `:414-422`, `:504-512`, `:664-666`, `:668-681`
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
| 2026-09-02 | **Edge-case pass (`bmad-review-edge-case-hunter`) — 10 unhandled paths, all folded into the ACs.** Run on the committed story at `249c04f9`, after Round 1, because every defect found in this design so far had been a missed branch rather than a wrong opinion. **The first finding nearly rebuilt BUG-17 inside its own fix and is confirmed by execution, not argument:** AC2 specified classifying with `compareVersions()`, doctor compares with `!==` on strings, and `compareVersions('4.0.1+abc','4.0.1')` returns **0** while the string compare returns **true** — so a module stamped with build metadata would make doctor report skew while `assessUpdate` found none and returned `up-to-date`. AC1 shared the module *set* between the two sides and said nothing about the *comparator*; sharing one without the other closes half the disagreement. Resolved by adding a third bucket, `divergent` (equal precedence, different string), routed with `behind` — which keeps doctor's sensitivity instead of narrowing doctor to match the weaker comparison. Two further findings were the same class: the `installed_version` fallback key doctor reads at `:606`, and an AC1/AC2 contradiction where AC2 promised to report a module with no `config.yaml` — `_portability`'s shape today — that AC1's no-change constraint makes unreachable (resolved to ADR-004 C1's territory, not this story's). The remaining seven were branch gaps now specified: `_vortex`'s exclusion from the skew set, the `:360` success banner, the `:377` exit code, re-check placement relative to the `:369-371` catch, `--dry-run` exiting at `:338` before the re-check, ahead-only needing `softWarning` or doctor exits 1 forever on an unfixable state, and the both-buckets case where a behind repair must not claim to have fixed everything. Tasks T2b and T6b added. No Round 2 — this was a method pass, not a severity pass. |
| 2026-09-02 | **Round 1 review — 0 HIGH, 2 MEDIUM, 1 LOW, all applied. No Round 2.** Fired late: the rule makes commit-preparation the landing point for out-of-story work and Round 1 did not run before `c1cacde9`, so this covers text already pushed. **M1** AC5 cited the Vortex config write as `:667`, which is a comment line — the `!isSameRoot` guard is `:668` and the block runs to `:681`; corrected. **M2** the `refresh-only` banner at `convoke-update.js:326-328` is written for a version change and this path has none, so a skewed install would render `From: 4.0.1 / To: 4.0.1` red-to-green; a clause was added to AC3 requiring the skew path to name the skewed modules instead. **M2 was itself overstated on first writing and corrected in the same pass** — it claimed an empty changelog section would render, but `printChangelog` early-returns at `:477`; the rest of the refresh path (`runRefreshOnly`, `_runPostUpgradeGate`) was then walked and is safe on equal versions, so the AC is scoped to presentation and explicitly forbids widening. Third missed branch of the session, which is the argument for an edge-case pass over a cynical one. **A fourth citation error was made and caught inside this very correction** — `_runPostUpgradeGate` was first cited as `:374`, a comment line, with the call at `:375`: the identical off-by-one as M1, committed while documenting M1. Every citation in this story has now been resolved by script rather than by reading, because reading is measurably where this fails. **L1** the Artifacts stamp range stopped one line short of its own `writeFileSync` (`:414-421` → `:414-422`). All 23 line citations were re-resolved against HEAD by script; 3 were wrong, the same first-pass citation-error rate `dist-2-4` recorded. |

---

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
