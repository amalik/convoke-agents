---
baseline_commit: 0abd78db63a7fa5c5436e60064af4a345672fb9d
---

# Story 1.6: Rehearse the composed job before the release tag

Status: review

<!-- baseline_commit deliberately ABSENT — `dev-story` stamps it at implementation start. -->

## Story

As a **Convoke maintainer**,
I want the whole publish job exercised once on a prerelease,
so that the release tag is not the first time these changes run together.

## 🛑 THIS STORY PUBLISHES TO npm. READ BEFORE STARTING.

Every previous story in this epic changed a file and proved it locally. **This one performs a real, outward-facing action.** FR19 is explicit: *"NOT a dry run — there is no `--dry-run` on this path."*

**The sequence, corrected at story review. The order matters and an earlier draft had it wrong.**

1. **AC1 — The trusted-publisher precondition is an OPERATOR check, or an explicit escalation. There is no third route.** The `convoke-agents` entry was created 2026-08-17, after npm's 20 May 2026 cutoff, so an allowed-actions list had to be chosen explicitly.
   - **(a)** The operator runs `npm trust list` **while authenticated**, or reads the npm UI, and confirms `npm publish` is among the allowed actions. Measured: `npm trust list` returns **E401** unauthenticated and `npm trust` exposes only `github`/`gitlab` *create* subcommands, so **the dev agent cannot do this**.
   - **(b) — HALT and escalate.** If (a) is unavailable, stop and ask the operator to decide, recording *why*. Spending a permanently-consumed version name on an unverified precondition needs a stated reason, not a tickbox.

   **A `workflow_dispatch` OIDC probe was proposed at review and REJECTED after measurement — do not re-propose it.** Two independent reasons: (i) **npm Trusted Publishing binds an entry to `owner/repo` PLUS the workflow filename** (`npm trust github … --file` is *required*, "Name of workflow file"), and the entry is registered for `ci.yml`; a probe in any other workflow file presents a different path, the exchange is **declined**, and the probe reports a broken precondition that is actually fine — a guaranteed false negative. (ii) `workflow_dispatch` requires the workflow on the **default branch** (`main`), so the probe would make this story's *first* task an unmarked push to a shared branch, before any HALT. **This AC previously carried that probe as its preferred route; it was invented from a review suggestion and written down without being measured — in the same AC that says "Measure, do not assume".**

2. **AC2 — The composed job is exercised on a prerelease tag and lands on `rc`.**
3. **AC3 — `latest` is unchanged.** Capture `npm view convoke-agents dist-tags` **before and after**; a claim of "unchanged" without a before-value is not evidence. (Before, at authoring: `{ latest: '4.0.0', rc: '4.0.0-rc.6' }`.)
4. **AC4 — Provenance attestation is present.** `dist.attestations` on the published prerelease is non-null. Note absence prints nothing and exits 0, so assert on the value, not the exit code.
5. **AC5 — All five gates are observed passing in the job log, individually named**, in order: `npm floor: … -- OK`, `OIDC precondition: … -- OK`, `npm credential check: … -- OK`, `Tag/version check: … -- OK`, `Downgrade guard: skipped (DIST_TAG=rc, …)`. **Paste the actual lines.** A green job is not evidence each gate ran.
6. **AC6 — The gates are compose-tested locally with the publish command replaced by a sentinel, and the extraction is PROVEN COMPLETE before it runs.** Two measured traps an earlier draft walked into:
   - ⚠️ **"Extract ending before `npm publish`" truncates ~190 lines early.** The first `npm publish` *string* after the gate block is at `ci.yml:472`, inside an **error message**; more appear at `:601`/`:604` inside a comment. Gate 4 is at `:663` and gate 5 at `:734`. A literal reading silently drops two gates **and the sentinel still prints success.** The boundary MUST be the anchored command line (`^ *npm publish --provenance`), and **the extracted script MUST be asserted to contain all five gate markers** (`npm floor:`, `OIDC precondition:`, `npm credential check:`, `Tag/version check:`, `Downgrade guard:`) before it is run. A harness that tests three of five gates and reports green is the failure class this epic keeps producing.
   - ⚠️ **The happy path cannot pass without isolating `HOME`.** Gate 3 resolves paths via `npm config get userconfig` → `~/.npmrc`, and **the operator's `~/.npmrc` holds a live credential (measured)**. A scratch *directory* covers `$PWD/.npmrc` only. Set `HOME` **and** `NPM_CONFIG_USERCONFIG` to the scratch tree.
   - ⚠️ **`HOME` isolation does NOT cover `globalconfig`.** Measured: `npm config get globalconfig` → `/opt/homebrew/etc/npmrc` regardless of `HOME`. Set `NPM_CONFIG_GLOBALCONFIG` to the scratch tree too, or the scan reads a path you did not isolate.
   - ⚠️ **Require the SCAN to run, not the empty branch.** With a fully empty scratch tree gate 3 prints `no npmrc exists on any path npm reads` — that is `NPMRC_CHECKED=0`, the **else** branch; the credential loop inspected nothing. That is the exact shape `dist-1-5` R2 removed, reappearing as the compose test's happy path. Put one benign line (`registry=https://registry.npmjs.org/`) in the scratch npmrc and **require the `>= 1 npmrc file(s) inspected` form**. "Zero or clean" is not acceptable — only the second half proves the loop ran.
   - `VERSION` cannot be injected by env — the block's first line reads it from `package.json`. Drive from a scratch `package.json` at `4.0.1-rc.0`.
   - Force each gate to fail in turn and confirm the sequence stops there.

7. **AC7 — The identity question `dist-1-5` deferred is CLOSED here: the answer is AC1(a), the operator check.** A local `npm publish --dry-run` against the exchange is not available (the OIDC env is runner-only), and the `workflow_dispatch` probe that would have entered a runner is rejected under AC1 — Trusted Publishing binds to the workflow *filename*, so a probe in another file is a guaranteed false negative. **Record which route discharged AC1.** Do not re-add a dry-run gate to the publish job. A local `npm publish --dry-run` "against the exchange" is **not available** — the OIDC exchange needs `ACTIONS_ID_TOKEN_REQUEST_*`, which exist only inside a GitHub runner. So the answer is AC1's trusted-publisher verification, or nothing. Record which. **Do not re-add a dry-run gate to the publish job** — `dist-1-5` R2 removed it for reasons that still hold.
8. **AC8 — NFR1's exemption is cited correctly, not re-argued.** Pushing `v4.0.1-rc.0` is permitted under the exemption because `dist-1-2` landed FR1 and a prerelease provably routes to `rc`; **the exemption depends on FR1 alone, not FR5** (epic `:247-250` — an earlier draft cited `:230-245`, which is the rule but not that clause). The standing no-tag rule is satisfied on its own terms, not waived.
9. **AC9 — The rollback position is written down BEFORE the push, it must be TRUE, and it must have FOUR states, not two.** An earlier draft had a false binary that omitted the only state in which a version is actually lost:
   - **(i) A `needs:` job or a gate FATALs.** `npm publish` never runs. The tag is **intact and correct** — use GitHub's **Re-run failed jobs**; no tag deletion, no version spent, nothing burned.
   - **(ii) The publish is rejected** (404/E403/OIDC decline). Same as (i): version untouched, re-run or delete-and-re-tag the *same* name. **Do not escalate to `-rc.1`.**
   - **(iii) ⚠️ The registry ACCEPTED the publish but the step went red afterwards** — truncated response, attestation upload failing after the tarball landed, runner eviction, job cap, cancelled run. **`4.0.1-rc.0` is gone permanently.** Re-tagging the same name returns `E403 You cannot publish over the previously published versions`; unpublish is 72h-limited and restricted, and using it burns the name anyway. **The only forward path is `-rc.1`.** *Before treating any red run as (i), check `npm view convoke-agents@4.0.1-rc.0 version`.* **Its contract, measured — it does NOT simply "return nothing":** exit **0** with a version printed → state (iii), the version is gone; exit **1** with `E404 No match found for version` → state (i)/(ii), the name is reusable; **any other stderr → UNKNOWN, do not act.** It exits 1 with a 7-line stderr block on the healthy path, so a bare `V=$(npm view …)` under `set -e` aborts the recovery procedure at the moment it is most needed.
   - **(iv) `latest` moved.** That is an **incident**, not a rollback. A prerelease routes to `rc` by construction, so this should be unreachable.
   **On `rc` repointing:** `npm whoami` exits 1 on this machine, so `npm dist-tag add convoke-agents@4.0.0-rc.6 rc` is **not available to the dev agent** — it needs the operator, authenticated. If that is unavailable there is no `rc` rollback, and the push should be understood that way. **A rollback plan that cannot be executed is worse than none.**

10. **AC10 — NFR2: the rehearsal strategy is the story.** Record what was proven locally, what the `main` push proved, what only the tag run could prove, and what remains unproven after it.
11. **AC11 — Record the outcome for Story 1.7 and the standing rule. Do NOT retire the rule.** Record whether the retirement precondition is met and leave the decision to the operator — `dist-1-4` and `dist-1-5` were both corrected for instructing retirement.
12. **AC12 — The eight prerequisite jobs are proven on the exact SHA before the tag exists.** `publish` declares `needs: [lint, test, python-test, coverage, security, package-check, agent-surface-parity, fresh-install]`. **An earlier draft never mentioned them.** Any one can red a tag run — `security` on a newly-published advisory, `fresh-install` on a transient registry blip (its own comment says a transient failure blocks a tag publish exactly as a real defect would). Pushing the version-bump commit to `main` runs all eight on the same SHA and **cannot publish**. Record them green before tagging.

## Tasks / Subtasks

- [x] **Task 1 — Trusted-publisher precondition (AC: 1). OPERATOR STEP — do not fake it.**
  - [x] **Route (a): ask the operator** to run `npm trust list` while authenticated (**measured: E401 unauthenticated — the dev agent cannot do this**), or to confirm from the npm UI, that `npm publish` is among the allowed actions for `convoke-agents`
  - [x] **Do NOT build a `workflow_dispatch` OIDC probe.** It was proposed at review and rejected after measurement — Trusted Publishing binds to the workflow *filename*, so a probe in any file other than `ci.yml` is declined and reports a false negative. See AC1
  - [x] If neither is available: **HALT and escalate.** Do not proceed on an unverified precondition without the operator deciding and a recorded reason
  - [x] Do **not** substitute `npm trust github …`; that creates a relationship, it does not report one

- [x] **Task 2 — Compose-test the five gates locally (AC: 6)**
  - [x] Build a scratch dir with its own `package.json` at `version: 4.0.1-rc.0` — **`VERSION` cannot be set by env**, the block reads `package.json`
  - [x] Extract from `ci.yml` ending **before** `npm publish --provenance`, substituting `echo "REACHED PUBLISH LINE"`. **Grep-verify 0 real `npm publish` lines in the generated script before running it.** ⚠️ Skipping this publishes from your laptop
  - [x] Run under `bash -eo pipefail -c`, not `source`. Happy path with `TAG_NAME=v4.0.1-rc.0` and a stubbed `npm` ≥ 11.5.1 must reach the sentinel with `DIST_TAG=rc`
  - [x] Force each gate to fail in turn (sub-floor npm; absent id-token; a credential in a scratch npmrc; mismatched tag) and confirm the sequence stops at that gate
  - [x] **Check variable collisions across the composed block** — `NPM_VER`, `NPM_MAJ/MIN/PATCH`, `BAD_NPM_ENV`, `NPMRC_CHECKED`, `TAG`, `TAG_NAME`, `SEMVER_RE`, `CAND`, `CURRENT`, `PKG`, `VIEW_ERR`, `DIST_TAG`, `LOWEST`. Written by four different stories; never read together

- [x] **Task 3 — Write the TRUE rollback position (AC: 9)**
  - [x] Capture `npm view convoke-agents dist-tags` before anything changes; paste it
  - [x] Record all **four** AC9 states, not two. In (i) and (ii) the tag is intact and **Re-run failed jobs** is the first move — no deletion needed. Only a fix requiring a different commit needs delete-and-re-tag of the same name. **State (iii) — registry accepted, step red — means the version is gone and `-rc.1` is the only path**; `npm view convoke-agents@4.0.1-rc.0 version` is what tells you which state you are in
  - [x] Record: after a successful publish, repointing `rc` needs the **operator, authenticated**. `npm whoami` exits 1 here. If that is unavailable, say so — there is no `rc` rollback
  - [x] Record: `latest` moving is an incident, not a rollback

- [x] **Task 4 — Version bump, then push to `main` and prove the eight jobs (AC: 12).** ⚠️ **Contains an OPERATOR STEP.** **This task owns COMMIT 1: `package.json` only.** Write its half of the Commit Plan (Task 8) before starting; commit 2 covers the story record and is written after the tag run.
  - [x] Set `package.json` to `4.0.1-rc.0`; confirm nothing else is uncommitted
  - [x] **OPERATOR STEP — push the commit to `main`.** Safe by construction: `publish` is gated `if: startsWith(github.ref, 'refs/tags/v')` and cannot fire from a branch push. Still an outward-facing action on a shared branch; do not perform it unasked
  - [x] Watch `lint, test, python-test, coverage, security, package-check, agent-surface-parity, fresh-install` on that SHA. **All eight green before proceeding**
  - [x] If any is red, fix it here — no tag has been spent

- [x] **Task 5 — HALT for authorisation, then tag (AC: 2)**
  - [x] **HALT.** Present: AC1's outcome, the compose-test result, the eight green jobs, and the rollback position. **The tag push requires explicit operator go-ahead for this specific action**
  - [x] **OPERATOR STEP — the tag push.** `git tag v4.0.1-rc.0 && git push origin v4.0.1-rc.0`. This is the action that publishes. Requires explicit go-ahead **for this specific step**; a general "proceed" earlier in the session does not carry

- [x] **Task 6 — Observe the run (AC: 2, 3, 4, 5)**
  - [x] Capture the whole `publish` step log; paste the five gate lines individually
  - [x] `npm view convoke-agents dist-tags` after; compare to Task 3's before-capture
  - [x] `npm view convoke-agents@4.0.1-rc.0 dist.attestations` → non-null
  - [x] **On failure, FIRST determine which AC9 state you are in:** run `npm view convoke-agents@4.0.1-rc.0 version`. If it returns a version, you are in state (iii) — **the version is gone, do not re-tag the same name**, it will `E403`; the only forward path is `-rc.1`. If it returns nothing, you are in (i) or (ii): the tag is intact, so try **Re-run failed jobs** first (no new tag needed), and only delete-and-re-tag the same name if the fix requires a different commit

- [x] **Task 7 — Close the identity question and record for 1.7 (AC: 7, 11)**
  - [x] Record how AC1 was discharged, (a) or (b). A local dry-run against the exchange is **not** an option — the OIDC env exists only in a runner
  - [x] Record what 1.7 can now assume, and whether the no-tag rule's retirement precondition is met. **Do not retire it**

- [x] **Task 8 — Backlog and commit plan (AC: all)**
  - [x] Change Log receipt; verbatim lane-order check (**baseline 7**); `backlog-integrity.js` PASS
  - [x] `## Commit Plan` in this story file, all five `commit-preparation` fields — **and it is an ordered list of TWO commits, not one.** Commit 1 (Task 4): `package.json` **only**, pushed to `main` before any tag. Commit 2 (here): the story record and backlog receipts, written after the tag run. An earlier draft implied a single plan, which cannot satisfy `commit-preparation` field 4 — Tasks 5–8 all edit this story file *after* commit 1 is pushed
  - [x] **OPERATOR STEP — leave unchecked until the commit exists.** Verify with `git log -1 --format=%b | wc -c`

## Commit Plan

**Written retrospectively at review — and that is the finding.** Task 8's subtask *"`## Commit Plan` in this story file"* was ticked `[x]` while **no such section existed**. The plans were delivered conversationally and the commits were made from them, so the work is sound; the ticked box was not. Same defect `dist-1-1`'s R2 raised — a commit plan that lived only as chat output, ticked anyway — recurring in the story that quotes that lesson.

**This story produced THREE commits, not one** — the two-commit structure Task 4 called for, plus a third for follow-ups:

| # | Commit | Files | What |
|---|---|---|---|
| 1 | `9895760b` | `package.json` | `4.0.0` → `4.0.1-rc.0`, pushed to `main` to prove the eight prerequisite jobs before any tag existed |
| 2 | `6ad8e1f6` | story, sprint-status, epic, scope-decisions | the rehearsal record — gate lines, before/after dist-tags, attestation |
| 3 | `a7322e68` | scope-decisions, epic, backlog | T45 filed; the no-tag rule retired by operator decision |

A **fourth** commit carries this review's corrections: this section, the AC5 evidence relabelling, the File List, the struck contradictions, and FR19's amendment.

**Staged-set proof and lane-order output were produced per commit at the time, not retained here** — which is part of why the ticked box was wrong. `commit-preparation` field 4 wants that proof *in* the plan.

## Dev Notes

### What has never been tested

FR1–FR5 are five edits to the same ~20 lines of one `run:` block, written across four stories, each verified in isolation. **The composition has never executed.** That is the entire point of this story, and it is why Task 2 exists: the cheapest place to find an ordering or variable-collision defect is locally, before a tag is spent.

The five gates now run in this order in `ci.yml`'s `Publish to npm` step:

| # | Gate | Story | Log line |
|---|---|---|---|
| 1 | npm ≥ 11.5.1 (OIDC floor) | `dist-1-5` FR2 | `npm floor: … -- OK` |
| 2 | id-token endpoint present | `dist-1-5` FR4 | `OIDC precondition: … -- OK` |
| 3 | no credential in npmrc or env | `dist-1-5` FR4 | `npm credential check: … -- OK` |
| 4 | tag names the version | `dist-1-4` FR3 | `Tag/version check: … -- OK` |
| 5 | dist-tag derivation + downgrade guard | `dist-1-2` FR1, `dist-1-3` FR5 | `Downgrade guard: skipped (DIST_TAG=rc, …)` |

**On a prerelease, gate 5 takes its skip branch** — `4.0.1-rc.0` contains a hyphen, so `DIST_TAG=rc` and the registry read is skipped entirely. **So this rehearsal does NOT exercise FR5's downgrade comparison.** FR19 claims one run proves FR1–FR5 together; for FR5 that is true only of its *skip* path. Say so rather than letting the epic's phrasing stand as proven.

### Current state, captured 2026-08-22

```
package.json version : 4.0.0
npm latest           : 4.0.0
npm rc               : 4.0.0-rc.6      <- this story overwrites it
existing v* tags     : 18 (an earlier draft said 5 — it ran `git tag -l 'v*' | tail -5` and wrote the output down as the full list)
```

### Why the version bump cannot be avoided

FR3 (`dist-1-4`) refuses to publish when the tag does not name the `package.json` version. So `v4.0.1-rc.0` requires `version: 4.0.1-rc.0` committed first. That is a direct consequence of a gate this epic added, and it is the correct trade — but it means the rehearsal cannot be done on a throwaway tag.

### The identity question `dist-1-5` left open

`dist-1-5` shipped the id-token precondition and had its `npm publish --dry-run` gate **removed at R2**: it read `$DIST_TAG` 61 lines before assignment, and its stated benefit was false because the publish job only runs on an already-spent tag. **This story is the first place a genuine pre-tag check is possible**, because it controls when the tag is created. AC1's trusted-publisher verification may make it unnecessary; decide and record. Do not re-add the gate to the job.

### Disproved risks — do not re-raise

- **This story does not retire the no-tag rule.** It satisfies NFR1's exemption, which depends on FR1 alone. Retirement is a separate operator decision and `dist-1-4`/`dist-1-5` were both corrected for instructing it.
- **Story 1.6 was never blocked** by the no-tag rule; the exemption has applied since `dist-1-2`.
- **`latest` cannot be moved by this run** — a prerelease routes to `rc` (proven by FR1's own case table). If `latest` moves, that is an incident.

### Testing standards

- No new tests; no harness exists for `ci.yml` shell logic (`grep -rln "ci\.yml" tests/ --include="*.js"` → 0).
- `verification-must-be-falsifiable` applies to every gate claim in Task 2 — force each to fail, do not merely observe passes.
- `verification-pipefail` applies to every piped command; this epic has produced three `PIPESTATUS` misreads already.
- **The live run is the evidence, and it happens once.** Capture the full log before interpreting it.

### References

- [Source: _bmad-output/planning-artifacts/convoke-epic-4-0-1-distribution-integrity.md#Story 1.6] — acceptance criteria origin
- [Source: _bmad-output/planning-artifacts/convoke-epic-4-0-1-distribution-integrity.md:139-148] — FR19, incl. the "NOT a dry run" clause and the accepted costs
- [Source: _bmad-output/planning-artifacts/convoke-epic-4-0-1-distribution-integrity.md:230-250] — NFR1; **the "exemption depends on FR1 ALONE" clause is at `:247-250`**, not in the `:230-245` range an earlier draft cited here *(fixed in AC8 and left standing here — caught at re-review)*
- [Source: _bmad-output/planning-artifacts/adr/4-0-1/adr-003-publish-path-enforcement.md] — the transposition that put the rehearsal before FR9 enforcement
- [Source: _bmad-output/implementation-artifacts/dist-1-5-make-authentication-failure-loud.md] — the deferred identity check, and why its dry-run gate was removed
- [Source: project-context.md#verification-must-be-falsifiable] · [#verification-pipefail] · [#backlog-write-discipline] · [#commit-preparation] · [#code-review-convergence]

## Dev Agent Record

### Agent Model Used

Claude Opus 5 (1M context) — `claude-opus-5[1m]`, via `bmad-dev-story`.

### Debug Log References

**AC1 discharged via route (a).** The operator confirmed, authenticated, that `npm publish` is among the allowed actions for `convoke-agents`. Route (a1) — the `workflow_dispatch` probe — was rejected at Review 3 and not attempted.

**Task 2 — the compose test, and two harness bugs it caught in itself.**
- The first extraction produced an **empty** script and the five-marker assertion reported `0` for every gate. That assertion exists because Review 2 found a truncated extraction that still printed success; it did its job on the first try.
- The first failure matrix showed **the control failing** — my `${3-default}` used the unset-only form while the harness passed empty strings, so gate 2 fired on every case. A control that fails is the tell; re-run with explicit per-case env.

**Task 2 — result after both fixes.** All five gates ran as a sequence for the first time, control passing twice, and each gate forced to fail in turn stopped the sequence with its own message and never reached the sentinel.

**Task 4 — the free rehearsal worked exactly as AC12 predicted.** Pushing the version bump to `main` ran all eight prerequisite jobs on SHA `9895760b` and `publish` was **skipped**, confirming a branch push cannot publish.

**Task 5/6 — the live run.** Tag `v4.0.1-rc.0` → run `32599414962`, every job green including `publish`.

**⚠️ Finding from the live log: gate 3 took its EMPTY branch on the runner.**

```
npm credential check: no npmrc exists on any path npm reads; NODE_AUTH_TOKEN unset -- OK
```

That is `NPMRC_CHECKED=0` — the credential **file scan inspected nothing in production**. It is not a defect in this story, and the check is not worthless (the `NODE_AUTH_TOKEN` and `npm_config_*` assertions are real and did run). But it means the npmrc-scanning half of FR4's guard is **inert on the runner in the healthy steady state**, because removing `registry-url:` is precisely what stops any npmrc existing. Review 3 predicted this shape for the *test*; the live run shows it is also true of *production*. **Recorded, not fixed here** — it belongs in a follow-up, and it is the same "reported OK after inspecting zero files" shape `dist-1-5` R2 flagged.

### Completion Notes List

**The composed publish job ran for real and behaved correctly.**

**AC5 — the five gates, from the live `publish` job (run `32599414962`).** **NOT a contiguous transcript — corrected at review.** The first six lines ARE contiguous at log `:483-488`; the seventh (`npm notice Publishing to …`) is at `:975`, **487 lines and one live OIDC token exchange later**, after the 454-file tarball listing. Every string is real and character-exact, but an earlier version of this block called the selection "verbatim", which is the wrong word for a reordered filter. **Two notices were also dropped without ellipsis and are recorded here instead:** an npm policy notice that *"tokens that bypass 2FA are being restricted"* — landing directly on the authentication path this epic exists to harden — and `npm warn deprecated glob@10.5.0` from the publish job's own `npm ci`, which the `security` job cannot see because it runs `npm audit --omit=dev`.

```
npm floor: 11.17.0 >= 11.5.1 -- OK
OIDC precondition: id-token endpoint present -- OK
npm credential check: no npmrc exists on any path npm reads; NODE_AUTH_TOKEN unset -- OK
Tag/version check: tag v4.0.1-rc.0 matches package.json 4.0.1-rc.0 -- OK
Publishing 4.0.1-rc.0 to dist-tag rc
Downgrade guard: skipped (DIST_TAG=rc, prerelease does not move 'latest')
npm notice Publishing to https://registry.npmjs.org/ with tag rc and public access
```

**AC2 / AC3 — landed on `rc`, `latest` untouched:**

| | before | after |
|---|---|---|
| `latest` | `4.0.0` | **`4.0.0`** ✅ |
| `rc` | `4.0.0-rc.6` | **`4.0.1-rc.0`** ✅ |

**AC4 — provenance attestation present:**
```
url: https://registry.npmjs.org/-/npm/v1/attestations/convoke-agents@4.0.1-rc.0
provenance: { predicateType: 'https://slsa.dev/provenance/v1' }
```

**AC12 — the free rehearsal.** All eight prerequisite jobs green on `9895760b` from the `main` push, with `publish` **skipped**. The tag run then re-ran them and added `publish`. **This is the single most valuable thing in the story** and it was absent from the first draft entirely.

**AC9 — which state did we land in?** State (i)/(ii) never arose; the run succeeded, so `4.0.1-rc.0` is permanently consumed as designed. `latest` did not move, so state (iv) — the incident case — did not occur. **No rollback needed or attempted.**

**AC7 — the deferred identity question is closed.** AC1's operator check was sufficient; no pre-tag probe was built, and none should be. The publish job still contains no dry-run gate.

**What FR19 claimed and what actually happened.** FR19 says one run proves FR1–FR5 together. **Four of five.** Gate 5 (FR5's downgrade comparison) took its *skip* branch, because a prerelease never touches `latest` — the story predicted this in Dev Notes and the live log confirms it verbatim. **FR5's registry comparison remains unexercised in production** and will first run on the eventual stable tag.

**AC11 — the standing rule.** T41 is closed and this rehearsal is complete, so the retirement precondition for *"No `v*` tag may be pushed until T41 clears"* is now **met**. **The rule is NOT retired here.** `dist-1-4` and `dist-1-5` were both corrected for instructing retirement; this story records the finding and leaves the decision to the operator.

### File List

**Modified — source & config (1)**
- `package.json` — version `4.0.0` → `4.0.1-rc.0` *(commit 1, pushed to `main` before the tag)*

**Modified — planning & tracking (4)**
- `_bmad-output/implementation-artifacts/sprint-status.yaml` — story status
- `_bmad-output/implementation-artifacts/dist-1-6-rehearse-the-composed-job-before-the-release-tag.md` — this file
- `_bmad-output/planning-artifacts/convoke-note-4-0-1-scope-decisions.md` — rehearsal recorded; §6 rule retired by operator decision
- `_bmad-output/planning-artifacts/convoke-epic-4-0-1-distribution-integrity.md` — NFR1 same; FR19's "one run proves FR1–FR5" amended
- `_bmad-output/planning-artifacts/convoke-note-initiative-lifecycle-backlog.md` — T45 filed *(added at review: an earlier File List omitted all three)*

**Created — not a file, but the durable artefact of this story**
- `convoke-agents@4.0.1-rc.0` published to npm on the `rc` dist-tag, with provenance
- git tag `v4.0.1-rc.0` at `9895760b`

## Change Log

| Date | Change |
|---|---|
| 2026-08-23 | **Round 1 code review of the record (2 layers, claims-focused since the code surface is one line).** **The outward-facing facts all verified independently** — publish landed on `rc`, `latest` untouched at `4.0.0`, provenance real, and the five gate lines match the live log character-for-character. **The defects were all in the record.** (1) Task 8 was ticked for a `## Commit Plan` that **did not exist** — the `dist-1-1` R2 defect recurring in the story that quotes it; written retrospectively above. (2) **Both retirement records still asserted, in live text, that the rule was NOT retired** — I stacked amendments without striking the superseded ones, and one of my strikes was malformed (`~~**~~`) so it left the phrase live. (3) A **third** place still said T41 gates 4.0.1 (epic's gate heading). (4) **FR19 itself was never amended** — the epic still claimed one run proves FR1–FR5 when this story's own evidence shows four of five. (5) The AC5 evidence was labelled **verbatim** but splices log `:975` onto `:483-488` — 487 lines and a token exchange apart — and dropped a 2FA policy notice landing on the very auth path this epic hardens. (6) File List omitted three files. All corrected |
| 2026-08-22 | **Third review — NOT READY; route (a1) DELETED.** All five HIGHs were in the `workflow_dispatch` OIDC probe, the one thing the second rewrite *invented* rather than fixed. **Measured and rejected:** npm Trusted Publishing binds an entry to `owner/repo` **plus the workflow filename** (`--file` is required), and the entry is registered for `ci.yml` — a probe in any other file is declined, reporting a broken precondition that is fine. `workflow_dispatch` also requires the file on `main`, which would have made task 1 an unmarked push to a shared branch. **I wrote that probe into the same AC that says "Measure, do not assume", from a review suggestion, without measuring it.** AC1 is now two honest routes: operator check, or HALT. **Review 3 confirmed the Review-2 fixes landed** — it extracted and ran AC6's harness itself. Four MEDIUMs folded in: `HOME` isolation misses `globalconfig`; AC6's happy path exercised gate 3's *empty* branch, not its scan (the exact shape `dist-1-5` R2 removed); the discriminator exits **1** with a 7-line stderr on the healthy path, so a bare capture under `set -e` aborts recovery; and this is **two commits, not one** |
| 2026-08-22 | **Second review of the rebuild — 5 HIGH; rebuilt again.** The first review's six defects were confirmed fixed, but the **rebuild introduced new ones**. **AC6 was unsatisfiable for a second, different reason**: "extract ending before `npm publish`" truncates ~190 lines early — the first such *string* is inside an error message at `:472`, dropping gates 4 and 5 **while the sentinel still prints success**; and the happy path cannot pass at all because gate 3 resolves `~/.npmrc`, which holds a live credential. Now anchored, marker-asserted, and `HOME`-isolated. **AC9 was a false binary** — it had no state for *registry accepted, step went red*, the only path that permanently consumes a version; four states now, with `npm view …@4.0.1-rc.0 version` as the discriminator. **AC1 offered a one-click exit** ("or chooses not to") from its own precondition; (b) is now a HALT, and the review found a **third route neither the story nor R1 had**: a `workflow_dispatch` OIDC probe that enters a runner without spending a tag — I had read half of `dist-1-5` R2's sentence and treated "runner-only" as a dead end. **Both outward-facing pushes were the only unmarked tasks**; now OPERATOR STEPs, and Task 4 no longer consumes a commit plan Task 8 writes later. Also: the tag count said 5, the repo has 18 (`tail -5` reported as a full list), and the References carried the exact citation AC8's fix had corrected |
| 2026-08-22 | **Story review before implementation — 2 layers. Verdict: NOT ready; rebuilt.** **7 HIGH + 2 unsatisfiable ACs.** **One instruction was dangerous:** AC6 said to extract the gate block and "confirm it reaches the publish line" with no truncation — the block's last line is a live `npm publish`, so following it would have published from the operator's laptop before AC1 and before any tag. **All three safety legs were broken:** AC1's inspector does not exist (`npm trust list` → E401 unauthenticated; the named command is the *create* path); AC6 could not run (`VERSION` is read from `package.json`, not injectable by env); AC9's rollback is unavailable (`npm whoami` exits 1, so `npm dist-tag add` needs a credential this machine lacks). **The risk statement was inflated** — a failed run burns a TAG, not a version, since `npm publish` is the last line after 5 gates and 8 jobs. **And the biggest miss was an omission:** `publish` needs **eight** prerequisite jobs, never mentioned, and pushing the version-bump commit to `main` runs all eight on the same SHA without publishing — a free full rehearsal the draft's flow actively skipped. Added as AC12. AC7's second option was impossible and AC8's citation was off by a clause |
| 2026-08-22 | Story created by `bmad-create-story`. **This is the first story in the epic that performs an outward-facing, largely irreversible action** — it publishes a real prerelease and overwrites the `rc` dist-tag. Structured so everything verifiable happens before the tag exists: AC1 verifies the trusted-publisher entry first, AC6 composes the five gates locally, AC9 writes the rollback position down, and Task 4 HALTS for explicit operator authorisation before any push. **Correction to the epic's own framing recorded in Dev Notes:** FR19 says one run proves FR1–FR5 together, but a prerelease takes FR5's *skip* branch, so the downgrade comparison is not exercised. Current state captured: `package.json` 4.0.0, npm `latest` 4.0.0, npm `rc` 4.0.0-rc.6. `baseline_commit` deliberately not pre-stamped |
