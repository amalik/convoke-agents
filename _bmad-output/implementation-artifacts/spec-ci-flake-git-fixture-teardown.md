---
title: 'Make git-fixture teardown deterministic (CI flake, run 32115225495)'
type: 'bugfix'
created: '2026-08-19'
status: 'done'
baseline_commit: '03271c2c80daa0361d73b035f424ae68f0b52b75'
review_loop_iteration: 0
context: ['{project-root}/project-context.md']
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** `git commit` forks a detached `git maintenance run --auto --no-quiet --detach` child that
outlives the parent `execFileSync` and keeps working inside `.git/objects`. Teardown then calls
`fs.remove(tmpDir)` — in fs-extra 11 that is `fs.rm({recursive, force})` with `maxRetries` **defaulted to
0** — so the first `ENOTEMPTY` is fatal. On CI run 32115225495 one test failed, `executeInjections ›
preserves existing frontmatter fields (NFR20)`, turning three jobs red (test(20), test(22), coverage)
while Node 18 passed. Coverage thresholds were never involved; they printed green before the exit 1.

**Approach:** Survive the writer, remove the writer we can prove exists, and make the next occurrence name
itself. Two helpers in the existing `tests/helpers.js` — a retrying temp-dir remover that reports what
survived when it gives up, and a git-fixture initialiser setting `maintenance.auto=false` — adopted across
the five temp-dir suites in `tests/lib/migration-execution.test.js`.

## Boundaries & Constraints

**Always:** Suppression goes in as **repo-local git config inside the fixture**, not around the test's own
`git` calls — the code under test (`executeRenames`, `executeInjections`) runs its own `git commit` in that
tmpDir, and repo-local config is the only lever covering both. The *rationale* (the trace line, the
fs-extra-zero-retries fact) lives as a comment at each helper's definition, not only here — specs get
archived, code does not. Obey `test-fixture-isolation`: new tests use their own tmpDir, never `PACKAGE_ROOT`.

**Ask First:** Any change outside `tests/helpers.js`, `tests/lib/migration-execution.test.js` and
`tests/unit/helpers.test.js`. Any change to `package.json` scripts or `.github/workflows/ci.yml`.

**Never:** Do **not** set `gc.auto=0` — proven a no-op (the child still spawns; it merely declines to gc once
already running in `.git/objects`). No `sleep`/timing waits, and no timing-dependent tests. Do not touch
`tests/audit/` or wire it into a runner, and do not sweep the other ~250 `mkdtemp` sites — both split out,
see `deferred-work.md` § "Deferred from: spec-ci-flake-git-fixture-teardown". Do not raise a timeout or retry
the test itself. Do not delete the `GIT_TRACE` regression test as a tautology — see Design Notes.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Fixture repo commits | `initGitFixture(dir)` then `git commit` | No `maintenance run --auto` child spawned | N/A |
| Bare repo commits (control) | `git init` without the helper | Child **is** spawned — proves the assertion is live | Control shows 0 spawns ⇒ git too old: skip, do not assert |
| Teardown of populated tree | tmpDir with nested dirs and files | Removed completely | Retries `ENOTEMPTY`/`EBUSY` within the cap |
| Teardown retries exhausted | parent `chmod 0500` so the unlink cannot succeed | Throws | Message **lists surviving entries** (recursive, capped). Skip when `process.getuid() === 0`, and make the skip loud (`t.skip('running as root')`) so lost coverage is visible |
| Teardown of absent path | already gone, or `undefined` | Resolves, no throw | `force: true`; guard falsy input |

</frozen-after-approval>

## Code Map

- `tests/helpers.js` -- has `createTempDir` (:21) and exports (:207). Imports `fs-extra` as `fs` and async
  `execFile`; `execFileSync` must be added.
- `tests/lib/migration-execution.test.js` -- five temp-dir suites. `git init` at **:248** (`executeRenames
  integration`) and **:509** (`executeInjections`) — the only two that spawn the writer. Teardowns at
  **:255**, **:360**, **:514**, **:1013** (`removeSync`), **:1354**.
- `tests/unit/helpers.test.js` -- existing suite for the helpers (5 tests, green); new tests belong here.
- `scripts/lib/artifact-utils.js` -- code under test; `git mv` / `git commit` at `:1402` / `:1420`. Read-only.

## Tasks & Acceptance

**Execution (red before green — this order is load-bearing):**
- [x] `tests/unit/helpers.test.js` -- write the I/O Matrix cases first and **observe the trace case failing**
      against today's fixtures -- the failing test is what justifies the helpers.
- [x] `tests/helpers.js` -- add `removeTempDir(dir)` / `removeTempDirSync(dir)`: recursive+force,
      `maxRetries: 10, retryDelay: 50`, no-op on falsy input, and on final failure re-throw with a recursive
      listing of surviving entries -- the retry is the hedge; the listing makes the next occurrence
      diagnosable rather than another investigation.
- [x] `tests/helpers.js` -- add `initGitFixture(dir)` (`git init -q`, `user.email`, `user.name`,
      `maintenance.auto false`); export all three, each carrying its rationale comment.
- [x] `tests/lib/migration-execution.test.js` -- swap the inline `git init` blocks at :248 and :509 for
      `initGitFixture`, and all five teardowns for `removeTempDir`/`removeTempDirSync`.

**Acceptance Criteria:**
- Given a repo from `initGitFixture`, when `git commit` runs under `GIT_TRACE=1`, then the trace shows no
  `maintenance run --auto`, while a plain-`git init` control repo does.
- Given a tmpDir whose parent is `chmod 0500`, when `removeTempDir` exhausts its retries, then the thrown
  error names the entries that survived.
- Given `npm test`, when it runs, then 0 failures and the total is >= 1647 (measured local baseline
  2026-08-19: 1647 tests / 1646 pass / 1 skip — identical to CI).
- Given `npm run lint`, when it runs, then exit 0 at `--max-warnings 0`.
- **Post-merge observation, not a review-time check:** the first CI run on `main` after this lands must show
  test(18), test(20), test(22) and coverage green. Reviewer records it; it cannot be satisfied locally.

## Spec Change Log

- **Implementation, 2026-08-19 — the I/O Matrix's `chmod 0500` row names the wrong directory.**
  The matrix says "parent `chmod 0500`". Measured, both variants: chmod on the **parent** throws `EACCES`
  with an **empty** survivor listing, proving nothing; chmod on the **target** throws `ENOTEMPTY` — the exact
  error class of the CI failure — listing `[stuck.txt]`. Implemented against the target directory. The row is
  inside `<frozen-after-approval>` and was left untouched; it needs a one-word human edit (`parent` ->
  `target`) to match what shipped. Known-bad state avoided: a test that passes on an error class the fix was
  never about. KEEP: the loud skip when permissions cannot be enforced, and the comment explaining why the
  parent variant is useless.

- **Round 1, 2026-08-19 — the spec never invoked `path-safety-for-destructive-ops`, and two HIGH findings
  followed.** `initGitFixture` inherited `process.cwd()` on a falsy path, so a mistyped call would have run
  `git config maintenance.auto false` against the developer's own repository; `removeTempDir` ran
  `{recursive, force}` on any path handed to it. Both are guard-clause additions changing no design decision,
  so they were triaged `patch` rather than `bad_spec` — a full revert would have discarded verified red->green
  work to add two `if` statements. Recording the omission instead: a spec whose deliverable is a destructive
  helper must cite that rule in **Boundaries**. KEEP: the guards are tested, not merely asserted.

- **Round 1, 2026-08-19 — half the review did not run.** Blind Hunter
  (`bmad-review-adversarial-general`) was launched twice as a subagent and died both times with no findings:
  an API error after ~88 min, then a watchdog stall after 10 min. Only Edge Case Hunter's pass is real
  reviewer output. Covered by (a) an inline adversarial pass by the implementing agent — weaker, the author
  reviewing their own work — and (b) a mutation test: stripping `maintenance.auto=false` turns both trace
  tests red, proving they detect the fix's removal on this git version. An independent prompt is at
  `review-prompt-blind-hunter-ci-flake.md`. **Do not describe this change as having had a two-reviewer
  Round 1.**

- **Round 2, 2026-08-20 — 12 findings; 3 applied, 1 refuted by measurement, 8 deferred.**
  Triggered by Round 1's two HIGH findings, per `code-review-convergence`. Applied: the containment guard
  compared paths case-sensitively, so on Windows a legitimate `mkdtemp` path could be *rejected* — a safety
  guard turned into a teardown failure in every suite; the `chmod` test's `finally` still had an unguarded
  `rmSync` able to mask the AssertionError it was unwinding from (the same masking bug Round 1 fixed one line
  above); and `_listSurvivors` claimed "capped at 40" when the cap lands on an empty or unreadable directory,
  which is unknowable — reworded to "listing stopped at 40 entries", which is merely true.
  **Refuted:** the claim that mutating `err.message` leaves `err.stack` stale and so the survivor listing
  never reaches CI. Measured instead of accepted — V8's `err.stack` is a lazy accessor that re-renders with
  the updated message, and `node:test` prints the listing in full. Had this been taken on trust it would have
  forced a needless rewrite of the error path.
  **Round 3 is NOT triggered:** none of the three fixes is structural — a comparison helper, a `try/catch`,
  and a string. No new files, no renamed functions, no altered control flow.
  KEEP: refute-by-measurement before acting on a reviewer's claim about runtime behaviour.

- **2026-08-24 — post-merge observation recorded; the last AC is closed.** The final acceptance criterion
  could not be satisfied locally and was left for a reviewer to record. Evidence now spans four days and
  21 CI runs since `f77cc584` landed on 2026-08-20: **19 success, 1 cancelled, 1 failure.** No run has
  produced `ENOTEMPTY`, and `tests/helpers.js`, `tests/unit/helpers.test.js` and
  `tests/lib/migration-execution.test.js` have not been touched since, so every one of those runs exercised
  this fix unmodified. The single failure (`02cb6d72`, run 32651559683) is an unrelated defect —
  `not ok 3 - unattributed count is well under 20 on the current repo (AC2)`, a test asserting against live
  repo state, i.e. a `test-fixture-isolation` violation — fixed separately by `fc59c190`. The cancelled run
  (`40461002`) was superseded, not failed.
  **What this does and does not prove.** It is absence of recurrence, not proof of causation: the flake was
  always intermittent, and Node 18 passed on the original failing run. What it does establish is that the
  fix has not introduced a regression across 21 runs and four Node legs. If the flake ever returns, the
  survivor listing in `removeTempDir` is what will name the writer.

- **Process, 2026-08-19 — this section did not exist until now.** The spec was authored without the
  template's `## Spec Change Log` heading, so the first attempt to append the `chmod` entry above matched
  nothing and was silently lost; the run reported success from an unrelated statement in the same script.
  Every subsequent edit to this file asserts its anchor before writing.

## Design Notes

**Proven.** `GIT_TRACE=1 git commit` prints `run_command: git maintenance run --auto --no-quiet --detach`.
Knob isolation, one commit each:

```
[]                        -> detached maintenance spawn: yes
[gc.auto=0]               -> yes   (no-op — hence the Never list)
[maintenance.auto=false]  -> no
```

A commit issued by *separate code* in a repo configured this way also spawns nothing (2 commits, 0 spawns) —
that is the evidence for the repo-local-config boundary.

**Not proven:** that this child is what collided — the trace shows it exists, not that it wrote the byte that
failed `rmdir`. Hence the ordering: **the retry is load-bearing; the suppression removes the one writer we can
demonstrate.** Any other culprit is still covered by the retry, and the listing names it.

**Not locally constructible.** 300 iterations of init + 2 commits + zero-retry `rmSync` (macOS, git 2.50.1):
0 failures; deliberate attempts to force it, in-process and cross-process, produced none. So the regression
test asserts the *spawn* — deterministic and observable — not the `ENOTEMPTY`.

**Retry sizing.** Node backs off linearly (`retryDelay` longer each attempt), so 10 × 50 ms ≈ a 2.75 s window,
not 500 ms. Doc-derived, not measured; the failure listing is what will tell us if it is wrong.

**Do not delete the `GIT_TRACE` test.** It looks tautological. It is the only check that
`maintenance.auto=false` still suppresses the spawn on **CI's git (2.54.0)**, unverifiable from a 2.50.1
laptop, and it fails loudly if a future git changes the mechanism.

**fs-extra.** `remove()` hardcodes `{recursive, force}` with no retry options — that is the defect. Its
re-exported `rm`/`rmSync` do forward options, as does `node:fs`; pick one and pass them explicitly.

## Verification

- `node --test tests/unit/helpers.test.js` -- all pass; the trace case must FAIL before `initGitFixture` is adopted.
- `npm test` -- 0 failures, count >= 1647.
- `npm run lint` -- exit 0.
- `for i in 1 2 3 4 5; do node --test tests/lib/migration-execution.test.js || break; done` -- 5 clean runs.
  Necessary, not sufficient: the defect only manifests on CI, so the last AC is what closes this.

## Suggested Review Order

**The writer — why the flake happened**

- Start here: the knob table is the whole diagnosis, including why `gc.auto=0` is a decoy.
  [`helpers.js:182`](../../tests/helpers.js#L182)

- One line, repo-local so the code under test's own commits inherit it.
  [`helpers.js:224`](../../tests/helpers.js#L224)

- Guards the falsy path that would write that config into the developer's real repository.
  [`helpers.js:195`](../../tests/helpers.js#L195)

**Surviving the writer — the load-bearing half**

- The retry window: linear backoff makes 10 x 50ms about 2.75s, not 500ms.
  [`helpers.js:40`](../../tests/helpers.js#L40)

- Containment before any recursive force-delete; `path-safety-for-destructive-ops`.
  [`helpers.js:107`](../../tests/helpers.js#L107)

- Rethrows naming what survived — the race is unreproducible, so it must self-diagnose.
  [`helpers.js:55`](../../tests/helpers.js#L55)

- The two removers themselves; everything above is why they look like this.
  [`helpers.js:144`](../../tests/helpers.js#L144)

**Adoption — the suite that went red**

- `executeInjections`, the suite that failed CI run 32115225495.
  [`migration-execution.test.js:510`](../../tests/lib/migration-execution.test.js#L510)

- `executeRenames`, the other suite whose commits spawn the writer.
  [`migration-execution.test.js:251`](../../tests/lib/migration-execution.test.js#L251)

- The five teardowns; only two suites spawn the writer, all five had zero-retry removal.
  [`migration-execution.test.js:257`](../../tests/lib/migration-execution.test.js#L257)

**Tests**

- The regression test. Its control arm is what stops it passing vacuously.
  [`helpers.test.js:184`](../../tests/unit/helpers.test.js#L184)

- Asserts the commit succeeded first: a failed commit also yields zero spawns.
  [`helpers.test.js:146`](../../tests/unit/helpers.test.js#L146)

- Both HIGH Round 1 findings, tested rather than merely guarded.
  [`helpers.test.js:231`](../../tests/unit/helpers.test.js#L231)

- chmod on the target, not the parent — the parent variant gives EACCES and an empty listing.
  [`helpers.test.js:269`](../../tests/unit/helpers.test.js#L269)
