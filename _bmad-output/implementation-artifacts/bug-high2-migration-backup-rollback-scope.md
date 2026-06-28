# Bug Story (HIGH-2): Migration rollback cannot restore the files the migration rewrites

**Status:** ready-for-dev · **Severity:** HIGH (release-blocker for 4.0) · **Source:** [`docs/codebase-audit-2026-06-27.md`](../../docs/codebase-audit-2026-06-27.md) #2 · **Lane:** Bug (pending triage RICE)
**Reproduced:** 2026-06-28 (by construction — see Evidence).

## Problem

The 3.3→4.0 migration's automatic rollback safety net is **fake** for the files most likely to break activation.

- `backup-manager.getFilesToBackup()` ([scripts/update/lib/backup-manager.js:212](../../scripts/update/lib/backup-manager.js#L212)) returns a **fixed 4-item list**, all under `_bmad/bme/_vortex/*` + `_bmad/_config/agent-manifest.csv`.
- The 3.3.x-to-4.0.0 migration's `_phase3_sweepSkillMd` rewrites the **19 `SKILL.md` files** enumerated in `_bmad/_config/v6.3-migration-inventory.csv` (under `_bmad/bmm/`, `_bmad/cis/`, `_bmad/tea/`, `_bmad/wds/`), plus `_phase4_deprecateBmadInit` rewrites `_bmad/core/bmad-init/SKILL.md`.
- **Zero overlap.** On failure, `migration-runner` calls `restoreBackup` and prints *"Installation restored from backup,"* but [`restoreBackup`](../../scripts/update/lib/backup-manager.js#L85) iterates the same static `getFilesToBackup()` — so none of the 19+ rewritten skills are restored. The operator is told they are clean when they are half-migrated, with the upstream activation blocks left mangled.

**Evidence (reproduced by construction, 2026-06-28):** backup write-set = 4 `_vortex/*` paths; migration write-set = 19 inventory targets + `bmad-init/SKILL.md`; intersection = ∅. `restoreBackup` restores only what `getFilesToBackup()` lists, so the rewritten skills are unrecoverable.

## Root-cause design gap

Two coupled flaws:
1. **Backup scope is a fixed list**, blind to what any given migration actually writes.
2. **`restoreBackup` restores from the static list, not from what was actually backed up** — it ignores `manifest.files_backed_up`. So even widening the backup wouldn't help restore until restore becomes manifest-driven.

## Fix design — per-migration backup manifest (the audit's recommended approach)

1. **Make restore manifest-driven.** Persist the full entry definitions (`{name, path, type}`) that were backed up into `backup-manifest.json` (e.g. `backup_entries`), and have `restoreBackup` iterate **those**, not `getFilesToBackup()`. This is the load-bearing correctness change — restore must cover exactly what backup covered.
2. **Let a migration declare its write-set.** Add an optional `getBackupManifest(projectRoot)` export to migration modules. `3.3.x-to-4.0.0.js` returns the union of (a) the inventory targets — **derived at runtime by reading `_bmad/_config/v6.3-migration-inventory.csv`, not hardcoded** (rule `derive-counts-from-source`) — and (b) `_bmad/core/bmad-init/SKILL.md`.
3. **Union at backup time.** `createBackup(version, projectRoot, extraEntries = [])` backs up `getFilesToBackup().concat(extraEntries)`; `migration-runner` passes `migration.module.getBackupManifest?.(projectRoot) ?? []`. Backward-compatible: migrations without the hook back up exactly today's set.

## Safety analysis (rule: `path-safety-for-destructive-ops`)

`restoreBackup` performs `fs.remove(destPath)` then copy — a destructive op against migration-declared paths. The migration's `getBackupManifest` produces those paths, so it MUST: resolve + normalize each target and assert it is **inside `projectRoot`** (reject `..` escapes and absolute paths); read targets only from the trusted in-repo inventory CSV (never operator input); and skip (not fail) entries that don't exist at backup time. Restore must refuse any `backup_entries` path that resolves outside `projectRoot`.

## Acceptance criteria

1. `restoreBackup` restores every entry recorded in the backup manifest (`backup_entries`), and nothing outside `projectRoot`.
2. `createBackup` accepts and backs up migration-declared extra entries; manifest records full definitions for each.
3. `3.3.x-to-4.0.0.js` exposes `getBackupManifest(projectRoot)` returning the inventory targets (derived from the CSV at runtime) + `bmad-init/SKILL.md`, each contains-checked against `projectRoot`.
4. Migrations without the hook behave exactly as today (backward compat).
5. **Reproduction test (rule `test-fixture-isolation`):** in an isolated fixture with a stub `SKILL.md` the migration would rewrite, run the migration, force a failure after Phase 3, call rollback, and assert the stub `SKILL.md` is byte-identical to its pre-migration content. This test must FAIL against current `main` and PASS after the fix.
6. `npm test` + `npm run lint` clean (rule `lint-passes-before-review`); verification commands honor `verification-pipefail`.

## Namespace decision

All edits are in Convoke-owned `scripts/update/` infrastructure — no `_bmad/bme/` skill surface, no upstream BMAD namespace. N/A for new-skill namespace rules; Covenant compliance N/A (no operator-facing skill surface added).

## Out of scope

Generalizing the backup-manifest hook to *all* historical migrations (only `3.3.x-to-4.0.0` has an extended write surface today). The mechanism is generic; only the one migration implements the hook now.
