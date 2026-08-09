# Bug Story (BUG-8 / HIGH-2): Migration rollback cannot restore what the migration rewrites

**Status:** review — **CONVERGED** after 3 review rounds (2026-08-09). R1: 8 patches · R2: 6 patches · R3: 0 new defects (1 test-hardening applied, 2 pre-existing findings deferred). HIGH closed + re-verified across all rounds. 713 unit + 120 integration pass, lint clean. **Ready to commit** (working tree uncommitted — commit as one atomic unit). · **Severity:** HIGH (release-blocker for 4.0) · **Lane:** Bug (BUG-8)
**Source:** [`docs/codebase-audit-2026-06-27.md`](../../docs/codebase-audit-2026-06-27.md) #2 — **absorbs #3** (state-file survives rollback) · **Reproduced:** 2026-06-28 (by construction)

## Problem

The 3.x→4.0 migration's automatic rollback is a **fake safety net** for the files most likely to break activation, and it leaves stale completion state behind.

- `backup-manager.getFilesToBackup()` ([backup-manager.js:212](../../scripts/update/lib/backup-manager.js#L212)) returns a **fixed 4-item list** under `_bmad/bme/_vortex/*` + `_bmad/_config/agent-manifest.csv`.
- `_phase3_sweepSkillMd` rewrites the **19 `SKILL.md` files** in `_bmad/_config/v6.3-migration-inventory.csv`; `_phase4_deprecateBmadInit` rewrites `_bmad/core/bmad-init/SKILL.md`. **Zero overlap** with the backup set.
- [restoreBackup](../../scripts/update/lib/backup-manager.js#L95) iterates the **static** `getFilesToBackup()` (NOT `manifest.files_backed_up`), so even a widened backup wouldn't restore. On failure the runner prints *"Installation restored from backup"* ([migration-runner.js:194](../../scripts/update/lib/migration-runner.js#L194)) while the rewritten skills stay mangled.
- **(Absorbed #3)** `_phase5_doctorDiff` writes `phase5_complete=true` to `_bmad/_memory/migration-state-4.0.yaml`, which is **not** in the backup set and **not** removed on rollback — so after a "restore" the migration believes it already completed and won't re-run.

**Evidence (reproduced by construction):** backup write-set = 4 `_vortex/*` paths; migration write-set = 19 inventory targets + `bmad-init/SKILL.md` (+ the state file); intersection = ∅.

## Fix design (design-reviewed — 4 hardening points baked in)

### A. Make restore manifest-driven
`restoreBackup` must iterate the **entries recorded in the manifest**, not the static `getFilesToBackup()`. Persist full entry definitions into `backup-manifest.json` (`backup_entries: [{ relPath, type, storedAt }]`) and restore from those.

### B. Per-migration backup-manifest hook
Add an optional `getBackupManifest(projectRoot)` export to migration modules. The runner collects it for **every** migration in the chain *before* backup:
```
// migration-runner.js, before createBackup (line ~86 — unappliedMigrations known at line 61)
const extraEntries = (await Promise.all(
  unappliedMigrations.map(m => loadModule(m).getBackupManifest?.(projectRoot) ?? [])
)).flat();
backupMetadata = await backupManager.createBackup(fromVersion, projectRoot, extraEntries);
```
`createBackup(version, projectRoot, extraEntries = [])` backs up `getFilesToBackup().concat(extraEntries)`. Migrations without the hook behave exactly as today (backward-compatible).

### C. HARDENING #1 — path-mirrored storage (correctness, not optional)
**The flat `backupDir/{name}` scheme collides:** 19 files named `SKILL.md` would clobber each other. Dynamic entries MUST be stored under a path that mirrors their relative location — `storedAt = backupDir/tree/<relPath>` — and backup/restore both use `storedAt`. The fixed 4 entries keep their current flat names for back-compat; new dynamic entries use the mirrored tree. `fs.copy` creates parent dirs on both copy and restore.

### D. HARDENING #2 — single-source enumeration
`getBackupManifest` MUST derive its target list from the **same** `v6.3-migration-inventory.csv` read that `_phase3_sweepSkillMd` uses — extract a shared `readInventoryTargets(projectRoot)` helper used by **both**. Two independent parsers would drift and silently re-open the gap (`derive-counts-from-source`). The manifest = phase3 targets + `bmad-init/SKILL.md` + the state file path (for #3).

### E. HARDENING #3 — best-effort restore (no abort-on-first)
`restoreBackup` currently `throw`s on the first failed entry ([line 118](../../scripts/update/lib/backup-manager.js#L118)), stranding the rest half-restored. Change to: attempt **all** entries, collect failures, and if any failed throw an aggregated error carrying the precise unrestored `relPath` list — which migration-runner surfaces in its manual-restore message ([line 200](../../scripts/update/lib/migration-runner.js#L200)).

### F. HARDENING #4 — modify-only assertion + state-file delete (#3)
Backup/restore only undoes **modifies**. The design asserts the write-set is all pre-existing files (inventory targets + `bmad-init/SKILL.md` both exist pre-migration; `createBackup` skips non-existent sources at [line 41](../../scripts/update/lib/backup-manager.js#L41)). For the **created** artifact — `migration-state-4.0.yaml` — restore cannot "restore" a prior version (none exists), so rollback must **delete** it. Record it in the manifest with a `onRollback: 'delete'` class; `restoreBackup` removes `delete`-class entries instead of copying.

## Safety analysis (rule: `path-safety-for-destructive-ops`)

`restoreBackup` does `fs.remove` + copy (and now `fs.remove` for delete-class). Every manifest entry path MUST resolve + normalize and assert containment inside `projectRoot` (reject `..` and absolute escapes); the delete-class removal MUST refuse any path outside `_bmad/_memory/`. Targets come only from the trusted in-repo inventory CSV — never operator input.

## Acceptance criteria

1. `restoreBackup` restores from `manifest.backup_entries` (not the static list); restores nothing outside `projectRoot`.
2. Dynamic entries are path-mirrored (`storedAt`); a backup of ≥2 files sharing a basename (e.g. two `SKILL.md`) round-trips both without collision. **(regression test for hardening #1)**
3. `getBackupManifest` and `_phase3` both call one shared `readInventoryTargets` — verified by test that adding a CSV row changes both the sweep set and the backup set. **(hardening #2)**
4. `restoreBackup` attempts all entries on partial failure and reports the precise unrestored list; one bad entry does not strand the rest. **(hardening #3)**
5. Rollback **deletes** `migration-state-4.0.yaml` (delete-class), so post-rollback `_phase1_detect` returns `isPreV4:true`. **(absorbs #3)**
6. **Reproduction test (`test-fixture-isolation`):** isolated fixture with a stub inventory `SKILL.md`; run migration, force failure after Phase 3, roll back, assert (a) the stub `SKILL.md` is byte-identical to pre-migration, and (b) the state file is gone. Must FAIL on current `main`, PASS after fix.
7. Migrations without `getBackupManifest` behave exactly as today (back-compat).
8. `npm test` + `npm run lint` clean (`lint-passes-before-review`); verification honors `verification-pipefail`.

## Namespace decision

All edits in Convoke-owned `scripts/update/` infrastructure. No `_bmad/bme/` skill surface, no upstream namespace; new-skill / Covenant rules N/A.

## Out of scope

Generalizing the hook to historical migrations (only `3.3.x-to-4.0.0` has an extended write surface). The mechanism is generic; only this migration implements `getBackupManifest` now.

---

## Review Findings — Round 1 (2026-08-09)

Adversarial code review, 3 layers (Blind Hunter · Edge Case Hunter · Acceptance Auditor) on the BUG-8 diff (`6c208782..HEAD`). Triage: **0 decision-needed · 8 patch · 3 defer · 2 dismissed.** Round 1 produced a HIGH → per `code-review-convergence`, a **Round 2 is triggered** once patches land.

**Theme:** the fix mechanism is sound (best-effort restore, path-mirroring, back-compat, delete-class all verified by passing tests), but the **path-safety guards on the destructive paths are incomplete** and **hardening #2 (single-source enumeration) was not fully implemented** — `getBackupManifest` reuses the CSV *parser* but not `_phase3`'s *selection predicate*.

### Patch

- [ ] [Review][Patch] 🔴 HIGH — Empty/`.` relPath deletes the **project root** on rollback: containment guard allows `destPath === rootResolved`, and an empty inventory `file` cell yields `relPath: ''` → `fs.remove(projectRoot)` [scripts/update/lib/backup-manager.js:162]
- [ ] [Review][Patch] 🟠 MED — delete-class `_bmad/_memory/` guard checks the **raw** relPath string, not the resolved path → `_bmad/_memory/../…` bypasses it (not reachable today; guard is broken) [scripts/update/lib/backup-manager.js:172]
- [ ] [Review][Patch] 🟠 MED — No path containment at **backup** time: `getBackupManifest` lacks the `..` filter `_phase3` has, so `..`/absolute relPath reads/writes outside the project during backup [scripts/update/lib/backup-manager.js:57]
- [ ] [Review][Patch] 🟠 MED — `getBackupManifest` enumerates **all** inventory rows (no `candidate_status === 'canonical'` filter) → superset of `_phase3`'s sweep; hardening #2 single-source not structurally enforced (Design D) [scripts/update/migrations/3.3.x-to-4.0.0.js:72]
- [ ] [Review][Patch] 🟠 MED — `getBackupManifest` throws on a malformed inventory CSV, aborting the update at the backup step with no graceful degrade [scripts/update/migrations/3.3.x-to-4.0.0.js:71 via migration-runner.js:88]
- [ ] [Review][Patch] 🟡 LOW — AC3 test asserts only on `getBackupManifest`, never exercises the `_phase3` side; a divergence between the two sets would pass undetected [tests/unit/backup-manager-rollback-scope.test.js:389]
- [ ] [Review][Patch] 🟡 LOW — AC5's stated observable (post-rollback `_phase1_detect().isPreV4 === true`) is not directly asserted [tests/unit/migration-runner-rollback-bug8.test.js]
- [ ] [Review][Patch] 🟡 LOW — No test drives `..`/empty/absolute relPath through `createBackup`/`getBackupManifest`, a `type:'directory'` dynamic entry, or a multi-migration chain [tests/unit/backup-manager-rollback-scope.test.js]

### Deferred (pre-existing / latent)

- [x] [Review][Defer] 🟡 LOW — restore `fs.remove(destPath)` before `fs.copy` (data-loss window); pre-existing pattern, best-effort widens it [scripts/update/lib/backup-manager.js:190] — deferred, pre-existing
- [x] [Review][Defer] 🟡 LOW — containment/delete guards are lexical, not `realpath` (symlinked `_bmad/_memory` escapes) [scripts/update/lib/backup-manager.js:159] — deferred, low-value hardening
- [x] [Review][Defer] 🟡 LOW — same relPath as restore-class + delete-class across a migration chain is order-dependent (no dedup); not reachable today (one migration) [scripts/update/lib/migration-runner.js:88] — deferred, latent

### Dismissed (2)

- delete-class removing a pre-existing `migration-state-4.0.yaml` on rollback is **intended** — AC5 requires it gone so `_phase1_detect` returns `isPreV4:true`; keeping stale state would contradict the restored files.
- `backup_entries: []` restoring nothing is **correct** — an empty array means nothing existed to back up (static files that exist are always recorded).

### Round 1 patches applied (2026-08-09)

All 8 patch findings resolved — 709 unit + 120 integration pass (0 fail), lint clean. Four clustered fixes:

- **A — path-safety gate.** New `_resolveContained(projectRoot, relPath)` in `backup-manager.js` rejects empty / absolute / `..`-escaping / **project-root-equal** relPaths, applied at **both** backup and restore. The `_bmad/_memory/` delete guard now checks the **resolved** path (kills the `..` bypass). → fixes the HIGH + 2 MED path-safety.
- **B — single-source enumeration.** New shared `_canonicalRows(rows)` used by both `_phase3` and `getBackupManifest`; the latter now filters `candidate_status === 'canonical'` and skips empty file cells. → fixes Design D drift.
- **C — graceful degrade.** `migration-runner` wraps each `getBackupManifest` call in try/catch → warns + falls back to the static set instead of aborting the update pre-backup.
- **D — tests.** Added: empty-relPath HIGH regression (project root survives), `..`-escape refused at backup + restore, `_memory/..` delete-bypass refused, non-canonical/empty rows excluded, and the AC5 `isPreV4:true` observable via the public `preview()`.

**Next:** Round 2 re-review of the patched diff (mandatory per `code-review-convergence` — Round 1 produced a HIGH). Round 2 scope note: the patches added new functions (`_resolveContained`, `_canonicalRows`) and altered control flow, so Round 2 could itself trigger a Round 3 if it surfaces further structural change.

---

## Review Findings — Round 2 (2026-08-09)

3 layers on the **patched** diff. Result: **HIGH confirmed closed, no new HIGH, no new data-loss regression** (restore set is a safe *superset* of the write set). Two real MEDIUMs surfaced — **both were Round-1 patches**, both latent (not reachable via the shipped migration), each flagged by 2 layers — plus LOWs. All 6 patch findings applied; 3 deferred. 713 unit + 120 integration pass, lint clean.

### Patched

- [x] [Review][Patch] 🟠 MED — **Fix C was unsafe.** Degrading `getBackupManifest` failures to an empty backup and continuing could let `apply()` mutate un-backed files (transient error / cached-resume). → now **aborts** before backup+mutate [scripts/update/lib/migration-runner.js]
- [x] [Review][Patch] 🟠 MED — `_bmad/_memory/` delete guard repeated the equality bug (`destPath === memRoot` slipped through → could wipe the whole memory dir). → reject equality [scripts/update/lib/backup-manager.js]
- [x] [Review][Patch] 🟡 LOW — `storedAt` used as an unvalidated copy **source** → `_resolveContained(backupDir, storedAt)` before copy
- [x] [Review][Patch] 🟡 LOW — missing `relPath` coerced to `"undefined"` → skipped in `_normalizeBackupEntries`
- [x] [Review][Patch] 🟡 LOW — `_phase3` did not skip empty file cells (EISDIR on project root) → empty-cell guard moved into the shared `_canonicalRows` (protects both call sites)
- [x] [Review][Patch] 🟡 LOW — `C:\`-drive / UNC paths not rejected on POSIX → `_resolveContained` rejects them
- [x] [Review][Patch] 🟡 LOW — AC5 asserted via `preview()` proxy → now asserts `_phase1_detect().isPreV4` directly; AC3 now has a `_phase3`-side "both sets grow" test; abort behavior has a deterministic test

### Deferred (Round 2 → backlog)

- [x] [Review][Defer] 🟡 LOW — containment/delete guards are lexical, not `realpath` (symlinked `_bmad` ancestor escapes) — abnormal precondition; realpath adds I/O per entry
- [x] [Review][Defer] 🟡 LOW — AC6 integration test depends on `npx convoke-doctor` availability (`_runDoctor` throws on ENOENT/timeout); the non-vacuity guard test makes offline failure *visible* (red), but a doctor-runner seam would make it deterministic
- [x] [Review][Defer] 🟡 LOW — no test for a `type:'directory'` dynamic entry or a multi-migration chain (both latent — one migration implements the hook today)

### Convergence

Round 1 HIGH is closed and re-verified; Round 2 found **no HIGH**. The two MEDIUMs are fixed + regression-tested. Acceptance Auditor's R2 verdict was "converged on the mechanism; log LOW gaps to backlog." Open question per `code-review-convergence`: the R2 Fix-C change **altered control flow** (return → throw), which the rule lists as a Round-3 trigger — so a focused Round 3 is *technically* in scope. Recommendation: **converge** (the residual items are LOW/deferred; a third full pass over a return→throw + guard additions is the diminishing-returns the rule exists to prevent) — pending operator ratification.

---

## Review Findings — Round 3 (2026-08-09, final)

Operator elected a focused final round on the R2 delta (the abort + the new guards). 2 layers (Blind Hunter + Edge Case Hunter — Acceptance Auditor skipped, R2 didn't change the AC surface).

**Result: zero new defects introduced by the Round-2 fixes.** All six R2 code changes and the tests independently re-verified correct by both layers.

- **Blind Hunter** — 6/6 code changes + tests clean. One flagged item (abort strands the migration lock) was a **false positive**: verified `migration-runner.js:225` calls `releaseMigrationLock` unconditionally in the catch (outside the `backupMetadata` rollback guard) before rethrow. **Applied its nicety:** the abort test now asserts the lock is released (`.migration-lock` gone) — turning the smell into a proof.
- **Edge Case Hunter** — 6/6 R2 changes clean, no new regression; independently confirmed lock-release, no drive-letter false-reject, `storedAt` both layouts, `_memory` equality, `_canonicalRows` no-op-for-callers. Two findings, both **pre-existing / not R2 regressions**, deferred:
  - [x] [Review][Defer] 🟠 MED (pre-existing) — resume-after-hard-kill rollback restores already-rewritten content as "original" → **Story 1A.5 idempotency**, out of BUG-8 scope (CR-bug8-D07)
  - [x] [Review][Defer] 🟡 LOW (latent) — delete-class root hardcoded to `_bmad/_memory/`; a future non-`_memory` delete-class entry couldn't roll back (CR-bug8-D08)

### Convergence — DONE

Per `code-review-convergence`: Round 3 found no new in-scope defect; its issues are pre-existing/latent and deferred to the backlog ("defer remaining findings to the backlog. No Round 4."). **BUG-8 is converged.** The HIGH is closed and re-verified across three rounds; the two MEDIUM patch-introduced issues from R2 are fixed + regression-tested; all residual items are LOW/pre-existing and logged in [deferred-work.md](deferred-work.md). Ready to commit and move to `review`/`done`.
