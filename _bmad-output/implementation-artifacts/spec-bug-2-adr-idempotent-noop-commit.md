---
title: 'BUG-2: ADR generation idempotent no-op commit'
type: 'bugfix'
created: '2026-04-20'
status: 'done'
baseline_commit: '248e72380b463ca51384d3a86cd4d660b02cfeeb'
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** On a second migration run whose ADR content is byte-identical to the prior run, `git commit` in [scripts/migrate-artifacts.js:400](scripts/migrate-artifacts.js#L400) fails with "nothing to commit, working tree clean"; the try/catch at [lines 402-404](scripts/migrate-artifacts.js#L402-L404) downgrades this to a misleading `"ADR generation failed"` warning while the process still exits 0. T4's `ALLOWED_WARNING_PATTERNS` allow-lists the warning, masking the semantic confusion.

**Approach:** After `git add`, check `git diff --cached --quiet`. If nothing is staged, log `"ADR already current"` and exit the ADR phase cleanly. If changes are staged, commit as before. Preserve the outer try/catch so real ADR failures (permission, taxonomy, etc.) continue to degrade gracefully via the existing warning path. Update T4 to assert the no-op success path and remove the allow-list entry for the eliminated warning.

## Boundaries & Constraints

**Always:**
- Keep the outer try/catch around the ADR phase intact — real ADR errors (fs, taxonomy, non-empty-tree git errors) must still hit the `"ADR generation failed"` warning path with exit 0, per existing "non-blocking" contract at [scripts/migrate-artifacts.js:380](scripts/migrate-artifacts.js#L380).
- Staged-change detection must use `git diff --cached --quiet` (exit 0 = no diff, exit 1 = diff). Do not parse git output strings.
- Align with existing idempotency pattern in `supersedePreviousADR` ([scripts/lib/artifact-utils.js:2104](scripts/lib/artifact-utils.js#L2104)) — check-then-act, silent on no-op.
- Namespace: Convoke only. Do not touch any `_bmad/bmm/`, `_bmad/bmb/`, or upstream BMAD files.

**Ask First:**
- None. Architectural path (b) was pre-decided by Winston 2026-04-20; deviations require re-consultation.

**Never:**
- No `git commit --allow-empty` (rejected path a — pollutes history).
- No monotonic counter / timestamp in ADR content (rejected path c — defeats idempotency).
- Do not collapse or remove the outer try/catch.
- Do not "fix" the filename-collision edge case (different date, identical stats) — flag as IN-## follow-up.
- Do not refactor `generateGovernanceADR` or `supersedePreviousADR` signatures.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| First run (fresh) | No prior ADR; new ungoverned files renamed | ADR written + committed with `"chore: generate governance convention ADR"`; stdout `"ADR generated: <filename>"` | N/A |
| Re-run, byte-identical ADR | Same date + same stats as prior run → ADR file rewritten with identical bytes | No commit; stdout `"ADR already current: <filename> (no changes to commit)"`; exit 0; no stderr warning | N/A |
| Re-run, different stats | Same date but new ungoverned files → ADR content differs (new renameCount) | New commit; same `"ADR generated"` stdout | N/A |
| Real ADR failure | e.g. taxonomy missing, fs permission error | Existing warning path: `"Warning: ADR generation failed: <msg>"` + `"Migration data is intact"` on stderr; exit 0 | Caught by outer try/catch |
| Staged unrelated changes in scope dir | User has unstaged edits under `_bmad-output/planning-artifacts/` | Pre-existing behavior preserved: `git add` stages them; `diff --cached` sees them as staged; commit fires with ADR message. **Not in scope.** | N/A |

</frozen-after-approval>

## Code Map

- `scripts/migrate-artifacts.js` -- ADR phase at lines 380-405; contains the `try { … git add; git commit; … } catch { warn }` block to modify.
- `scripts/lib/artifact-utils.js:2089-2113` (`supersedePreviousADR`) -- reference pattern for check-then-act idempotency; no changes.
- `tests/integration/migrate-artifacts-idempotency.test.js` -- T4 CLI integration test; update `ALLOWED_WARNING_PATTERNS` and comments at lines 86-105, 194-199.
- `tests/lib/migration-execution.test.js` -- unit tests for `detectMigrationState` and `generateGovernanceADR`; no changes (pure-function tests are unaffected).
- `_bmad-output/implementation-artifacts/deferred-work.md` -- existing BUG-2 entry under "scope of T4 — 2026-04-19"; no edit needed (tracked via backlog).
- `_bmad-output/planning-artifacts/convoke-note-initiative-lifecycle-backlog.md:290` -- BUG-2 row; status → Done after ship.

## Tasks & Acceptance

**Execution:**
- [x] `scripts/migrate-artifacts.js` -- Replace the unconditional `git commit` at line 400 with a staged-diff check. Use `execFileSync('git', ['diff', '--cached', '--quiet'], { cwd, stdio: 'pipe' })` in a try/catch: no-throw = no staged changes → log `"ADR already current: <filename> (no changes to commit)"`; throw = staged changes present → run existing commit + log `"ADR generated: <filename>"`. The outer try/catch at lines 402-404 stays intact. -- Rationale: detect-and-skip eliminates the byte-identical-ADR warning without polluting history or breaking idempotency.
- [x] `tests/integration/migrate-artifacts-idempotency.test.js` -- Remove `/ADR generation failed: Command failed: git commit/` AND `/Migration data is intact/` from `ALLOWED_WARNING_PATTERNS` (lines 101-105). Update the preceding comment block (lines 86-105) to document the eliminated warning class. Update the comment in the third test at lines 194-199 to reflect that the ADR-commit skip is now intentional behavior, not a deferred bug. Assertions (`commitsAfter === commitsBefore` for test 2; `delta >= 2 && delta <= 3` for test 3) stay as-is — they already permit the no-op outcome. -- Rationale: post-fix, the warning must no longer fire; the allow-list becomes a real guard.
- [x] `_bmad-output/planning-artifacts/convoke-note-initiative-lifecycle-backlog.md` -- Appended **IN-63** entry for the filename-collision follow-up (different date, identical stats → two governance ADRs for what's logically one decision). -- Rationale: scope-deferred per Winston's architectural note; preserves traceability without expanding this fix.

**Acceptance Criteria:**
- Given a Convoke project with a completed prior migration whose ADR is byte-identical to what a re-run would produce, when `convoke-migrate --apply --force` runs, then exit code is 0, stdout contains `"ADR already current"`, stderr contains no `Warning:` / `failed` lines, and `git rev-list --count HEAD` is unchanged.
- Given a first-ever migration against a fresh project, when the ADR phase runs, then the ADR file is written, committed with `"chore: generate governance convention ADR"`, and stdout contains `"ADR generated: <filename>"`.
- Given a real ADR failure (e.g., taxonomy misconfigured such that `generateGovernanceADR` throws), when the ADR phase runs, then stderr contains `"Warning: ADR generation failed: <msg>"` AND `"Migration data is intact"`, and exit code remains 0.
- Given the full test suite runs, when `npm test` completes, then all tests pass (including T4's three scenarios with the tightened allow-list).

## Design Notes

`git diff --cached --quiet` is the canonical no-op detector for "is anything staged?" — exit 0 means no diff. Node's `execFileSync` throws on non-zero exit, so the idiomatic shape is:

```js
let hasStagedChanges = false;
try {
  execGit('git', ['diff', '--cached', '--quiet'], { cwd: projectRoot, stdio: 'pipe' });
} catch {
  hasStagedChanges = true;
}
if (hasStagedChanges) {
  execGit('git', ['commit', '-m', 'chore: generate governance convention ADR'], { cwd: projectRoot, stdio: 'pipe' });
  console.log(`\nADR generated: ${newADRFilename}`);
} else {
  console.log(`\nADR already current: ${newADRFilename} (no changes to commit)`);
}
```

The inverted try/catch (throw = positive condition) is slightly awkward but matches `execFileSync`'s contract without parsing stdout — alternative shapes (`--exit-code`, parsing `status --porcelain --cached`) add complexity without benefit.

## Verification

**Commands:**
- `npm test` -- expected: all suites green, including the 3 scenarios in T4.
- `npm test -- tests/integration/migrate-artifacts-idempotency.test.js` -- expected: 3/3 pass; the tightened `ALLOWED_WARNING_PATTERNS` still allows the legitimate first-run "Previous ADR not found" warning.
- `node scripts/migrate-artifacts.js --apply --force` (in a repo that already migrated, re-run) -- expected: stdout ends with `"ADR already current: <filename>"`, zero new commits via `git log --oneline -5`.

## Review Findings (Round 1 — 2026-04-20)

**Triage summary:** 0 decision-needed · 2 patch · 2 defer · 3 dismissed · Acceptance Auditor VERDICT: compliant.

- [x] [Review][Patch] Distinguish exit code 1 from other git errors in the idempotency check [scripts/migrate-artifacts.js:404-408] — `git diff --cached --quiet` exit semantics: 0 = no diff, 1 = diff present, >1 = genuine error (lock contention, corrupt index, etc.). Current bare `catch {}` treats every non-zero as "has staged changes" and then runs `git commit`, which also fails and gets masked as an ADR warning. Fix: check `err.status === 1` specifically; rethrow otherwise so genuine errors surface via the outer catch with the real reason. Also strengthen inline comment to document the exit-code semantics.
- [x] [Review][Patch] Add positive stdout assertion for the no-op branch [tests/integration/migrate-artifacts-idempotency.test.js:200-204] — test 3 currently asserts only the commit-count delta `>= 2 && <= 3`. A regression that silently skipped both ADR branches (no commit, no stdout) would pass. Fix: `assert.match(result.stdout, /ADR already current/)` after the delta check, locking in the expected no-op path for the byte-identical stats scenario.
- [x] [Review][Defer→Resolved] Broad `git add _bmad-output/planning-artifacts/` stages any modified sibling files [scripts/migrate-artifacts.js:399] — **Resolved by I71 (2026-04-21)**. `git add` now narrowed to `adrPath` + (when applicable) supersede target via `supersedePreviousADR` return-path contract; `--` end-of-options separator added. Spec I/O Matrix item closed.
- [x] [Review][Defer] Concurrent `convoke-migrate` invocations create TOCTOU window between `git add` and `git commit` [scripts/migrate-artifacts.js:399-418] — deferred, pre-existing race. Not a documented use case; would require a migration lock file or path-scoped commit to close.

**Dismissed (noise / already-tracked):** (1) allow-list tightening elevates flaky ADR failures to T4 red — acknowledged trade-off per spec; (2) midnight-UTC date rollover during migration — already tracked as IN-63; (3) IN-63 observes the cross-day case stays unfixed — scope-deferred per Winston's architectural note, not a finding.

## Review Findings (Round 2 — 2026-04-20)

**Triage summary:** 0 decision-needed · 2 patch (comment corrections only) · 1 defer · 6 dismissed · Acceptance Auditor VERDICT: compliant. Round 1 patch consistency: both patches consistent with frozen constraints, no rule re-introduced. No HIGH findings → convergence reached.

- [x] [Review][Patch] Correct exit-code comment: `>1 = genuine error` overstates git's contract [scripts/migrate-artifacts.js:404-407] — git documents `--quiet` as exit 0 (no diff) / exit 1 (diff present), with "non-0 and non-1" = error. The comment's specificity on `>1` is a simplification that happens to hold for `execFileSync` (status 128 for usage errors), but the stable contract is "non-0, non-1 → error". Fix: replace ">1 = genuine git error" with "non-0, non-1 = genuine git error" in the comment block. Code itself is correct.
- [x] [Review][Patch] Soften comment that overpromises error-message fidelity [scripts/migrate-artifacts.js:406-407] — the comment claims rethrown errors "propagate to the outer catch with their actual message instead of being misreported". Accurate that `diffErr.message` is preserved, but the outer catch still prepends `"Warning: ADR generation failed:"` to the message. A reader could misread the comment as promising no prefix. Fix: reword to "…so real errors surface the underlying git error message via the outer catch, rather than being indistinguishable from a 'nothing to commit' false alarm."
- [x] [Review][Defer] T4 positive stdout assertion is fragile across UTC midnight rollover [tests/integration/migrate-artifacts-idempotency.test.js:205-209] — deferred, very-low-probability flake. If test 1 stamps day N and test 3 lands on day N+1, the ADR file content differs (new `**Date:**`), `hasStagedChanges=true`, stdout shows `"ADR generated"` not `"ADR already current"`, assertion fails. Full T4 run takes ~1.1s so the window is ~1/86400 per run. Proper fix: freeze the clock in the fixture (env `TZ=UTC` + mock `Date`) or narrow the scope of the match.

**Dismissed (noise / already-tracked):** (1) Signal-killed git (`err.status === null`) — current rethrow path handles it correctly; (2) broad `git add` failure-mode shift from loud-error to silent-sweep — same root issue already deferred in R1, noted in deferred-work.md update; (3) allow-list now catches rethrown diffErr — intentional per Round 1 spec; (4) cross-day ADR duplication — already tracked as IN-63; (5) IN-63 row appears truncated in reviewer's view — artifact of the redacted diff passed to the reviewer, actual file is complete; (6) minor style note about `result.stdout` vs `gitLogCount` data sources — no behavior concern.
