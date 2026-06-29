# Bug Story (BUG-8 / HIGH-2): Migration rollback cannot restore what the migration rewrites

**Status:** ready-for-dev (design-reviewed + hardened 2026-06-28) · **Severity:** HIGH (release-blocker for 4.0) · **Lane:** Bug (BUG-8)
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
