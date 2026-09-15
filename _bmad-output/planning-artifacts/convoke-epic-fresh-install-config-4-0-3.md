---
initiative: convoke
artifact_type: epic
qualifier: fresh-install-config-4-0-3
created: '2026-09-15'
status: active
schema_version: 1
qualifier_role: operator-authored
---

# Epic: Fresh-Install Config (`fic`), the 4.0.3 hotfix

**Created 2026-09-15 by operator ruling.** This is an incident-driven mini-epic, following the `tfr-epic-1` / `lint-epic-1` / `ci-hygiene-epic-1` precedent.

## Why

On a clean install of `convoke-agents@4.0.2` from npm, 7 of the 11 Convoke agents stop on first start with `Configuration Error: Missing required field(s)`. Isla and Scout were reproduced by execution; the other five are inferred from identical activation text. The operator ruled a patch release rather than a documented workaround, because the first thing a new operator does after installing is start an agent. `BUG-22` (16.2) is the row.

## Scope: one story

| Story | Row | What it changes |
|---|---|---|
| `fic-1-1` | `BUG-22` (a)–(c) | `mergeConfig` becomes module-aware. Fresh configs carry `user_name`/`communication_language`; Gyre stops receiving Vortex defaults and doubled lists; configs a 4.0.2 install damaged are repaired on update. |

## Not in scope, stated as decisions

- **`IN-193`**, the gate: the doctor should detect a config its agents cannot start with. It is filed separately per the instance-vs-gate lesson. A new doctor check is not a hotfix.
- **`IN-198`** (`bmad-init`): Emma recovers in a live start, so it is not blocking.
- **`IN-194`–`IN-208`**: unqualified intakes from the same verification pass.
- **The release itself** (branch, version bump, tag): an operator decision, recorded when made. `main` carries Team Factory commits after `v4.0.2` that are still in review.
