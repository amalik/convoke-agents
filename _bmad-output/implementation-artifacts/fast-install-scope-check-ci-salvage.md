# Fast Story: Salvage install-scope-check.js into CI

**Status:** ready-for-dev · **Lane:** Fast (pending triage RICE) · **Source:** [`docs/codebase-audit-2026-06-27.md`](../../docs/codebase-audit-2026-06-27.md) #21 + #31

## Context

[`scripts/audit/install-scope-check.js`](../../scripts/audit/install-scope-check.js) is a mechanical, $0, no-operator-input guard that asserts Convoke's migration/install write-ops stay inside Convoke-owned paths (never touch BMAD-core dirs). It is currently **orphaned** — no `bin`, no `npm` script, no CI step, no test — only because it was filed under the stalled PF1 battery. It is **independent of PF1's fate** (audit reconciliation, 2026-06-28). Leaving it unwired gives false assurance: a migration could leak write-scope into BMAD-owned dirs and nothing would catch it.

## Scope

1. **Wire it into CI.** Add an `npm` script (e.g. `audit:install-scope`) and a step in [.github/workflows/ci.yml](../../.github/workflows/ci.yml) running `node scripts/audit/install-scope-check.js`. The snapshot's TRACKED counts are inlined in-source (no fixture file needed). Honor the workflow-level `bash -eo pipefail` default (rule `verification-pipefail`).
2. **Fix finding #31 (write-op matcher counts comments/strings).** [install-scope-check.js:60](../../scripts/audit/install-scope-check.js#L60) `WRITE_OP_RE` over `countWriteOps()` matches inside comments/strings; the snapshot bakes in a known false positive (`AC1 5 matches (4 real + 1 comment FP at line 394)`). Strip comments/strings (or tokenize) before counting, then re-baseline the expected count `5 → 4`. This closes the masking hole where deleting that JSDoc + adding one real write keeps the total at 5 and the check passes silently.
3. **Remove the PROVENANCE "salvageable" note** added 2026-06-28 once it is actually wired (it will no longer be orphaned).

## Acceptance criteria

1. `install-scope-check.js` runs on every PR via CI and fails (non-zero) when a migration writes outside Convoke-owned scope.
2. The write-op matcher ignores comments/strings; expected count re-baselined and documented in-source.
3. A test (rule `test-fixture-isolation`) feeds a fixture file containing a commented write-op + a real write-op and asserts the matcher counts only the real one (rule `catch-all-phase-review` — the matcher is a catch-all that needs false-positive coverage).
4. `npm test` + `npm run lint` clean (rule `lint-passes-before-review`).

## Namespace decision

Internal Convoke CI tooling under `scripts/audit/` + `.github/`. Not a user-facing tool (it is a CI guard, not an operator command), so the `slash-command-ux-for-user-facing-tools` rule does **not** apply. No `_bmad/bme/` skill surface; namespace rules N/A.

## Dependency note

Independent of the PF1 battery decision (this story can ship regardless of whether PF1 is finished or waived).
