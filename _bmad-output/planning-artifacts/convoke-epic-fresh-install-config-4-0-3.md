---
initiative: convoke
artifact_type: epic
qualifier: fresh-install-config-4-0-3
created: '2026-09-15'
status: done
schema_version: 1
qualifier_role: operator-authored
---

# Epic: Fresh-Install Config (`fic`), the 4.0.3 hotfix

**Created 2026-09-15 by operator ruling.** This is an incident-driven mini-epic, following the `tfr-epic-1` / `lint-epic-1` / `ci-hygiene-epic-1` precedent.

## Why

On a clean install of `convoke-agents@4.0.2` from npm, 8 of the 12 Convoke agents stop on first start (recorded as "7 of 11" when filed; corrected 2026-09-17 by the `fic-2-1` consumer audit) with `Configuration Error: Missing required field(s)`. Isla and Scout were reproduced by execution; the other five are inferred from identical activation text. The operator ruled a patch release rather than a documented workaround, because the first thing a new operator does after installing is start an agent. `BUG-22` (16.2) is the row.

## Scope: one story

| Story | Row | What it changes |
|---|---|---|
| `fic-1-1` | `BUG-22` (a)–(d) | `mergeConfig` becomes module-aware. Fresh configs carry `user_name`/`communication_language`; Gyre stops receiving Vortex defaults and doubled lists; configs a 4.0.2 install damaged are repaired on update. **(d), found in review:** an existing config that cannot be parsed is never overwritten — `convoke-update` and `convoke-install` now refuse and exit non-zero, leaving the file byte-identical, where before a single duplicate key replaced it with defaults. |

## Not in scope, stated as decisions

- **`IN-193`**, the gate: the doctor should detect a config its agents cannot start with. It is filed separately per the instance-vs-gate lesson. A new doctor check is not a hotfix.
- **`IN-198`** (`bmad-init`): Emma recovers in a live start, so it is not blocking.
- **`IN-194`–`IN-208`**: unqualified intakes from the same verification pass.
- **The release itself** (branch, version bump, tag): an operator decision, recorded when made. `main` carries Team Factory commits after `v4.0.2` that are still in review.

## Close (2026-09-16)

`fic-1-1` is `done`; `BUG-22` has moved to §2.5. The story-close consumer audit required by
`code-review-convergence` found five consumers the diff-scoped rounds could not see — a diff does
not show a caller nobody edited. Four were corrected (the docs-program draft twice, `UPDATE-GUIDE`,
I138's stated reason, and this file's own scope row); the doctor/`convoke-update` remediation
strings were deferred to `IN-211` by operator ruling, docs-only for the hotfix.

**The release did not happen and was not meant to.** npm `latest` is 4.0.2, `package.json` is 4.0.2,
and there is no `v4.0.3` tag — so every defect this epic fixed is still live for anyone installing
today. The operator ruled on 2026-09-16 to hold the release. Cutting 4.0.3 is what converts this
epic from fixed-in-`main` to fixed-for-operators, and it remains an open operator decision.

`IN-193`, the gate that would have caught BUG-22 (nothing detects a config its own agents cannot
start with), is still open and still out of scope.
