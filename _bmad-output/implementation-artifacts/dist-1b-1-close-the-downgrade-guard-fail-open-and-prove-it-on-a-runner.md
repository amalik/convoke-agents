---
baseline_commit: 02cb6d72794a300ca5af7495c5bb998f1327d134
---

# Story 1b.1: Close the downgrade guard's fail-open and prove it on a runner

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a Convoke operator,
I want the downgrade guard to refuse a lower version for the *right* reasons and to have been observed doing so on a real runner,
so that the only protection between a mistake and the `latest` dist-tag is one I have actually seen work.

## ⚠️ Two things that make this story different

**1. It closes T46 and T49(a) together, deliberately.** T46 fixes a fail-open; T49(a) is the
non-publishing rehearsal that proves the fix *on a GitHub runner*. Splitting them would ship a guard
whose correctness is asserted rather than executed — the exact pattern `dist-epic-1`'s retrospective
was written about. The version bump (T49's other half) is release prep and is **out of scope**.

**2. Every external claim here was executed, not read.** Under the new rule
`external-claims-must-be-executed-or-hedged`, the discriminator below was derived from observed
`npm view` output on 2026-08-23, not from expectations about what npm prints. The raw probes are in
Dev Notes §1 and the dev agent should re-run them rather than trust this file.

## Acceptance Criteria

**AC1 — The E404 skip branch discriminates on the error CODE line, not on any 404 in the stream.**
**Given** `ci.yml`'s guard currently runs `grep -qE 'E404|404 Not Found' "$VIEW_ERR"` over npm's
entire stderr, and npm emits unrelated 404 noise on that same stream
**When** the guard is corrected
**Then** the skip fires only on an anchored match of npm's error-code line — `^npm error code E404$`
**And** the fix is demonstrated against **both** directions, with output recorded:
- a genuine missing package still skips (otherwise a first-ever publish is blocked), and
- an `E500` payload containing `npm warn 404 Not Found - GET .../notifications` **aborts**, where the
  current guard skips.

*Measured 2026-08-23 — see Dev Notes §1. The current guard fails open on that second case; the
anchored form aborts. Both were executed.*

**AC2 — The skip message states what was actually established.**
**Given** the current message reads *"$PKG has no published version yet — nothing to downgrade"*
**When** the branch is entered
**Then** the message names the evidence (an anchored `E404` from the registry for this package), so a
log reader can tell a real absence from a swallowed error.

**AC3 — The empty-reply case is handled as itself, not misdiagnosed as multi-line.**
**Given** `npm view <pkg> <field>` **exits 0 with empty stdout and empty stderr** when the package
exists but the field does not — **executed and confirmed**, Dev Notes §1 Probe 3
**When** `CURRENT` is empty
**Then** the guard aborts with a message naming the empty reply
**And** it no longer reports *"registry returned a multi-line 'latest'"*, which is the current
behaviour (`printf '%s' "" | grep -c ''` yields `0`, and `[ 0 -ne 1 ]` is true).

*This is not hypothetical. It is reachable via `npm dist-tag rm`, mid-replication, or a field typo.*

**AC4 — NFR10: every REGRESSION is demonstrated failing; every branch is exercised.**
**Given** the epic's standing rule that a gate wired in green has never been shown to work
**When** these branches are accepted
**Then** the **two regressions** are demonstrated FAILING against the pre-fix guard, with output
recorded: (a) the fail-open on a non-E404 error carrying 404 noise, and (b) the empty reply
misdiagnosed as "multi-line"
**And** **all three** branches — anchored E404, non-E404 error, empty reply — are exercised against
the post-fix guard with output recorded.

*Deliberately asymmetric. The anchored-E404 branch has **no pre-fix failure to demonstrate** — the
current guard already skips correctly on a genuine 404; the fix narrows its *condition*, it does not
repair its behaviour. An AC demanding three failing demonstrations could only be signed off
dishonestly.*

**AC5 — ONE copy of the comparison, exercised on a GNU runner, driven by a case matrix.**
**Given** the comparison has **never run in CI** — `dist-1-6`'s rehearsal published a prerelease and
took the `DIST_TAG != latest` skip branch
**And** `package.json` is `4.0.1-rc.0`, so a dry run against it either takes that same skip branch
(proving nothing) or fails the `CAND` shape check and reddens `main` permanently — **both outcomes
fail this AC**, and bumping the version is out of scope
**When** this story completes
**Then** the comparison logic is **extracted into one shared file**, `scripts/ci/downgrade-guard.sh`,
invoked by BOTH the `publish` job and a new non-publishing job
**And** the shared script reads **`GUARD_CAND` and `GUARD_CURRENT` from the environment** — named,
not positional. A swapped positional pair inverts every verdict (`LOWEST = CAND` becomes true
exactly when CAND is *higher*) while the dry matrix stays green; a swapped **named** binding is
visible in review. This is the cheap fix for the fact that the extraction **relocates** the
unexecuted code rather than removing it: the dry job calls the script with its own fixture inputs,
so the *publish job's call site* is new, runs only on a real stable tag, and is exercised by nothing
**And** the `CAND` shape check **stays in the workflow, ahead of the registry read** — it currently
runs before the read and regardless of `GUARD_SKIP`, and moving it into the script would leave
`CAND` unvalidated on the E404 skip path, where the script is never called. The script re-asserts it
as a contract check on its own input, which is duplication with a purpose, not drift
**And** the non-publishing job runs it over a **case matrix** covering, at minimum: equal versions;
a clear upgrade; a clear downgrade (must FATAL); a multi-digit component where lexical and version
ordering disagree (e.g. `4.9.0` vs `4.10.0`); and a zero-padded component
**And** it logs one `Downgrade guard (dry): <CAND> vs <CURRENT> -- <verdict>` line per case
**And** it **cannot publish**: it is a separate job, carries no `id-token: write`, and is **not** in
the `publish` job's `needs:`.

**AC5b — the call site is proven falsifiable.** A deliberate transposition of `GUARD_CAND` and
`GUARD_CURRENT` at the publish call site MUST be shown to change the verdict, with output recorded,
and then reverted. Without this the story ships a call site that has never been demonstrated to be
wired the right way round — asserted, not executed.

**A copy would not satisfy this AC.** If the logic is duplicated rather than shared, a passing dry
run proves the copy passes while the publish path's code stays exactly as unexecuted as it is today
— and the two silently drift. One file, two callers.

**AC6 — The BSD-vs-GNU `sort -V` disclosure is closed by observation or restated honestly.**
**Given** `ci.yml` has carried an explicit note since `dist-1-3` that GNU `sort -V` behaviour is
**assumed**, verified only on BSD/Apple sort locally
**When** this story completes
**Then** the note is **closed by an argument from the shape checks, not by a runner case** — because
executed analysis shows no runner case can close it:

- **Multi-digit (`4.9.0` vs `4.10.0`) is not a could-disagree case.** Executed both input orders on
  BSD sort: lowest is `4.9.0` either way. Every version-sort compares digit runs numerically; none
  gets this wrong. It discriminates `sort -V` from plain `sort`, not GNU from BSD.
- **Zero-padding is the only genuinely free case, and it is unreachable.** `4.01.0` vs `4.1.0` is a
  numeric tie whose ordering falls to each implementation's tie-break. But gate 4's `SEMVER_RE`
  (`^(0\|[1-9][0-9]*)\.…`) rejects leading zeros *before* `CAND` is assigned, and the registry
  cannot hold a non-semver `latest`. Executed: `semver.valid('4.01.0') === null`.

**So on the input space the guard admits — canonical, non-zero-padded `X.Y.Z` triples — BSD and GNU
agree by construction.** The comment must say that the **shape checks**, not the sort, are what
close the gap — which Dev Notes §2 has said all along.
**And** the note is NOT quietly deleted, and NOT closed by citing a trivially-ordered pair. Doing
the latter would reproduce `dist-1-6`'s pattern one level down: watching a case pass that could
never have failed.

**AC7 — No behaviour change to the four gates this story does not touch.**
**Given** the publish step carries five inline gates and eight prerequisite jobs
**When** this story completes
**Then** gates 1–4 (npm floor, OIDC precondition, credential scan, tag/version) are **unmodified**,
and the `publish` job's `needs:` list is unchanged
**And** the `ci.yml` diff is confined to the FR5 block (now a call to the shared script) plus the new
non-publishing job.

**AC7b — toolchain parity, and an honest statement of what the runner does NOT prove.** The new job
MUST pin the same Node as `publish` — **for parity, so the two jobs are not on divergent
toolchains**, not because the run exercises the discriminator. It does not: the shared script
contains no network call and the E404 discrimination stays in the publish job, so **the new job
never invokes npm, never sees npm's stderr, and cannot exercise the anchor at any npm version.**

**The anchored discriminator is proven by FIXTURE ONLY and by nothing on a runner.** Say that
plainly in AC8. Separately, `ci.yml` MUST carry a one-line comment recording that the anchor depends
on npm ≥ 10's `npm error` prefix — verified: npm 11.11.0 and 10.8.2 emit `npm error code E404`, npm
9.8.1 emits `npm ERR! code E404`. Publish pins Node 24 with gate 1 enforcing ≥ 11.5.1; the test
matrix is [18, 20, 22].

**AC8 — Rehearsal strategy recorded (NFR2).**
**Given** NFR2 requires every publish-path change to state how it was rehearsed
**Then** the story records that the guard logic was exercised locally against fixtures (AC4) **and**
on a runner via AC5's dry run — and states plainly that the *publish-time* path still only executes
on a real tag.

## Tasks / Subtasks

- [x] **Task 1 — Re-execute the probes; do not trust this file (AC: 1, 3)**
  - [x] Re-run Dev Notes §1's four probes against the live registry. Record raw output.
  - [x] Confirm: genuine 404 → `^npm error code E404$` present, exit 1; missing field → **exit 0,
        empty stdout, empty stderr**; healthy read → exit 0, stderr empty.
  - [x] **If any probe disagrees with §1, STOP** and reconcile before writing code. npm's output
        format is an external dependency and may have changed.

- [x] **Task 2 — Build the three fixtures and demonstrate the CURRENT guard failing (AC: 4)**
  - [x] Extract the guard block into a local harness driven by a fixture stderr file and a fixture
        `CURRENT`, so branches can be exercised without the registry.
  - [x] Fixture A: genuine E404. Fixture B: `E500` + `npm warn 404 Not Found - GET .../notifications`.
        Fixture C: empty `CURRENT` with exit 0.
  - [x] **Record the current guard's behaviour on each** — B must be shown SKIPPING (the fail-open)
        and C must be shown reporting "multi-line". A gate not observed failing is not a gate.

- [x] **Task 3 — Fix the three branches (AC: 1, 2, 3)**
  - [x] Replace the stream-wide grep with an anchored match on npm's error-code line.
  - [x] Reword the skip message to name the evidence (AC2).
  - [x] Add an explicit empty-`CURRENT` branch **before** the line-count check, with its own message.
  - [x] Re-run all three fixtures; A skips, B aborts, C aborts naming the empty reply.
  - [x] Consider corroborating the 404 with the package name — the URL in npm's 404 line contains it
        (§1 Probe 6). **Optional**; if skipped, say why. Do not add unexercised complexity.

- [x] **Task 4 — Extract the comparison, then drive it from a matrix (AC: 5, 7b)**
  - [x] Create `scripts/ci/downgrade-guard.sh` reading **`GUARD_CAND` / `GUARD_CURRENT` from the
        environment** (named, not positional — see AC5), containing the `CURRENT` shape check, the
        `sort -V` comparison and the OK/FATAL branches, plus a contract re-assertion on `GUARD_CAND`.
        **No registry read and no network call inside it** — the caller supplies `CURRENT`.
  - [x] **Leave the `CAND` shape check in the workflow, ahead of the registry read.** It currently
        runs regardless of `GUARD_SKIP`; moving it would leave `CAND` unvalidated on the E404 skip
        path, where the script is never called.
  - [x] Rewrite the publish job's FR5 block to read the registry and then **call that script**.
        Behaviour must be identical; diff the before/after logic line by line.
  - [x] New job, `push: main` + `pull_request`, **not** in `publish`'s `needs:`, **no**
        `id-token: write`, **same Node pin as `publish`** (AC7b).
  - [x] **Prove the publish call site (AC5b):** transpose `GUARD_CAND`/`GUARD_CURRENT` there, show
        the verdict inverts, record it, revert. The dry matrix cannot catch a mis-wired call site.
  - [x] Run the matrix from AC5. One `Downgrade guard (dry): <CAND> vs <CURRENT> -- <verdict>` line
        per case. Downgrade cases must FATAL *within the case runner* without failing the job — the
        job asserts each case's **expected** verdict.
  - [x] **Placement decisions to make and record:** does it run on tag pushes too? A dry-run failure
        on a tag whose publish succeeded would redden a green release (worsens T47). Prefer
        restricting to `push: main` + `pull_request`. Does a registry outage redden every PR? The
        matrix needs no network — keep the network read out of the required path.
  - [x] **Assert it cannot publish by construction, not by keyword count.** Grepping for
        `npm publish` is the check the retro warns about. Assert instead: the job is absent from
        `publish.needs`, declares no `id-token` permission, and the shared script contains no
        network call at all.

- [x] **Task 5 — Observe it on a runner and close or restate the `sort -V` note (AC: 5, 6)**
  - [x] Push to `main`; find the dry-run output in the run log. Record the run ID and the verbatim
        `Downgrade guard (dry):` line.
  - [x] **This is the first execution of this comparison on GNU coreutils.** If it behaves
        differently from local BSD `sort -V`, that is the finding, not a nuisance.
  - [x] Update `ci.yml`'s BSD/GNU note: close it citing the run, or restate what remains uncovered.

- [x] **Task 6 — Confine the diff and verify (AC: 7)**
  - [x] `git diff` on `ci.yml` must touch only the FR5 block and the new job.
  - [x] **Prove the extraction is behaviour-preserving**: run the pre-fix guard logic and
        `scripts/ci/downgrade-guard.sh` over the same case matrix and require identical verdicts.
        An extraction that changes behaviour silently is worse than no extraction.
  - [x] Assert `publish` still `needs:` exactly 8 jobs and gates 1–4 are byte-identical.
  - [x] Run `npm run lint`, `docs:audit`, `backlog-integrity.js`, `reference-integrity.js`.

- [x] **Task 7 — Close the backlog rows and write the commit plan (AC: all)**
  - [x] Close **T46**; close **T49** partially — its dry-run half ships here, its
        `package.json` bump does not. Record the split precisely rather than closing T49 whole.
  - [x] `backlog-write-discipline`: lane-order check before and after, restore order in the same
        edit, Change Log receipt.
  - [x] Write **## Commit Plan** per `commit-preparation`, with a falsifiable clause that asserts
        *observed* facts (fixture outcomes, the runner log line), not counts of keywords.

## Dev Notes

### §1 — Executed probes, 2026-08-23 (npm 11.11.0, registry.npmjs.org)

**These are observations, not expectations. Re-run them (Task 1).**

**Probe 1 — genuine E404** (`npm view convoke-agents-definitely-not-real-xyz dist-tags.latest`):

    exit=1, stdout empty, stderr:
      npm error code E404
      npm error 404 Not Found - GET https://registry.npmjs.org/convoke-agents-definitely-not-real-xyz - Not found
      npm error 404  The requested resource '...@*' could not be found ...

The error code is on **its own line**: `npm error code E404`.

**Probe 2 — healthy read** (`npm view convoke-agents dist-tags.latest`): `exit=0`, stdout `4.0.0`,
**stderr 0 lines**.

**Probe 3 — package exists, field does not** (`dist-tags.nonexistentfield`):
**`exit=0`, stdout EMPTY, stderr EMPTY.** This is AC3's case and it takes the *success* path, so
`CURRENT=""` reaches the line-count check.

**Probe 4 — the fail-open, executed.** Fixture stderr containing `npm error code E500` plus
`npm warn 404 Not Found - GET https://registry.npmjs.org/-/npm/v1/notifications`:

| guard form | result |
|---|---|
| current, `grep -qE 'E404\|404 Not Found'` over the stream | **SKIPS — fail open** |
| proposed, `grep -qE '^npm error code E404$'` | **aborts — correct** |

**Probe 5 — the proposed form against Probe 1's real 404:** skips, correctly. So the anchored
discriminator is right in **both** directions.

**Probe 6 — corroboration available:** npm's 404 line embeds the package name
(`404 Not Found - GET https://registry.npmjs.org/<pkg>`), so a name check is possible if wanted.

### §2 — The code under change (`ci.yml`, FR5 block)

Current shape, in order: package-name guard → `CAND` shape check → `npm view` into `CURRENT` with
stderr captured → **E404 skip branch (AC1)** → line-count check (**AC3 lands before this**) → trim →
`CURRENT` shape check → `sort -V` compare → OK.

**What must be preserved:** the `CAND` and `CURRENT` shape checks are what actually close the
BSD/GNU gap for canonical `X.Y.Z` triples — the sort is not doing that work alone. The prerelease
refusal on `CURRENT` is deliberate (`sort -V` ranks `4.1.0` below `4.1.0-rc.1`, the reverse of
SemVer). **Do not relax either.** The `mktemp` + `trap` cleanup stays.

**Interaction with T44:** the guard has no override path, and after `dist-1-7` the `npm dist-tag`
repair needs an interactive 2FA session. Adding branches that abort makes T44 more pressing, not
less. **Do not build an override here** — that is T44's scope.

### §3 — Files

| Path | Action |
|---|---|
| `scripts/ci/downgrade-guard.sh` | **NEW** — the single copy of the comparison, called by both jobs |
| `.github/workflows/ci.yml` | UPDATE — FR5 block becomes a call to the script; new non-publishing job |
| `_bmad-output/planning-artifacts/convoke-note-initiative-lifecycle-backlog.md` | UPDATE — T46 closed, T49 partially closed, Change Log |
| `_bmad-output/implementation-artifacts/sprint-status.yaml` | UPDATE — status |

All verified present 2026-08-23. Re-verify at implementation time (`spec-verify-referenced-files`).

### §4 — Out of scope

- **Bumping `package.json` off `4.0.1-rc.0`** — release prep; T49's other half stays open. **This
  is why AC5 uses a case matrix rather than the tree's own version:** at `4.0.1-rc.0` a dry run
  against `package.json` either takes the `DIST_TAG != latest` skip branch (proving nothing) or
  FATALs on the `CAND` shape check (reddening `main`). The matrix sidesteps the coupling entirely
  and tests more cases than the real version would.
- **T47** (post-publish verification), **T48** (concurrency), **T43** (`rc` monotonicity),
  **T44** (override path), **T45** (npmrc scan). Real, none is this story.
- **Removing `--provenance` or `--loglevel verbose`** — both gated on a second green publish.

### §5 — Rules that bind this story

- **`external-claims-must-be-executed-or-hedged`** (new, from `dist-epic-1`'s retro). This story
  exists because a guard was written from an expectation about npm output. Every claim about npm
  here carries a probe. **Any new claim needs a new probe.**
- **`verification-must-be-falsifiable` / NFR10** — AC4 requires each branch observed failing first.
- **`verification-pipefail`** — the harness runs under `bash -eo pipefail`, matching `ci.yml`.
  Beware `PIPESTATUS` under zsh; capture exit codes directly.
- **`backlog-write-discipline`** — lane order before/after, Change Log receipt.

**A tradeoff to state, not hide.** The current guard's grep is *format-independent* (any 404
anywhere) and therefore fails open. The anchored form is *format-dependent* — it relies on npm
emitting `npm error code E404` on its own line. That is a deliberate exchange of a false-negative
risk for a false-positive one: if npm changes its stderr format, the guard stops skipping on a
genuine first-ever publish and **aborts** instead. Aborting is the safe direction, and AC7b pins the
npm major so the dependency is explicit rather than assumed. Record this in the code comment.

### §6 — Learnings carried from `dist-epic-1`

- **A gate that reports OK after inspecting nothing is not a gate** (T45). AC4 exists so no branch is
  trusted un-exercised.
- **Verify against the basis the claim is about.** `dist-1-7` shipped a git gate verified in a
  fixture that returned 161 lines in the real repo. Fixtures prove branch logic (Task 2); only the
  runner proves runner behaviour (Task 5). **Both are required.**
- **Do not claim a disclosure is closed unless it was observed closing.** `dist-1-6` claimed to
  confirm the `sort -V` assumption and did not; AC6 forbids repeating that.
- **Checks fail the way claims do.** Several verifications in `dist-1-7` confirmed the wrong thing —
  an awk field read outside the table, a grep scoped to indented lines. Task 7's falsifiable clause
  must assert observed outcomes, not keyword counts.

### Project Structure Notes

- **Namespace decision: N/A with reason** — no skill, workflow or agent surface; the change is
  `.github/workflows/ci.yml` plus governed artifacts under `_bmad-output/`. No `_bmad/bme/` path is
  touched, so there is no Convoke-vs-upstream-BMAD question.
- **Covenant: N/A** — no skill surface.
- `ci.yml` is not in `files[]`; nothing here changes what installers receive.

### References

- [Source: _bmad-output/planning-artifacts/convoke-note-initiative-lifecycle-backlog.md#T46] — the fail-open, filed 2026-08-23
- [Source: _bmad-output/planning-artifacts/convoke-note-initiative-lifecycle-backlog.md#T49] — dry run + pre-tag checklist
- [Source: _bmad-output/planning-artifacts/convoke-epic-4-0-1-distribution-integrity.md#FR5] — the guard's origin
- [Source: _bmad-output/implementation-artifacts/dist-epic-1-retro-2026-08-23.md] — why external claims must be executed
- [Source: .github/workflows/ci.yml] — the FR5 block and the BSD/GNU note
- [Source: npm 11.11.0 live probes, 2026-08-23] — §1; re-run per Task 1

## Dev Agent Record

### Agent Model Used

### Debug Log References

**Task 1 — probes re-executed 2026-08-23, all reproduce.** Probe 1: exit 1, stderr **8 lines**,
line 1 exactly `npm error code E404`, anchored match YES. Probe 2: exit 0, stdout `4.0.0`, stderr
**0 bytes**. Probe 3: exit 0, stdout **0 bytes**, stderr **0 bytes** — the empty-reply shape, on the
success path. *Correction to Dev Notes §1: it showed Probe 1's stderr elided to 3 lines; the real
form is 8. Fixture A was built from the real output, not the excerpt.*

**Task 2 — both regressions demonstrated FAILING against the pre-fix guard.**
```
Fixture A (genuine E404, rc=1)      pre-fix: exit 0, SKIPS      <- correct today, no pre-fix defect
Fixture B (E500 + 404 noise, rc=1)  pre-fix: exit 0, SKIPS      <- REGRESSION (a): fail open
Fixture C (empty CURRENT, rc=0)     pre-fix: exit 1, "multi-line" <- REGRESSION (b): misdiagnosis
```

**Task 3 — the same fixtures, post-fix.**
```
A: exit 0  "skipped -- registry returned E404 ... no published version yet"
B: exit 1  "FATAL: could not reach the registry."          <- fail-open closed
C: exit 1  "FATAL: registry returned an EMPTY 'latest'"    <- named as itself
```

**AC5b — call-site transposition test.** `CAND=4.0.1 CURRENT=4.0.0` → OK.
Transposed `CAND=4.0.0 CURRENT=4.0.1` → `FATAL: refusing to publish 4.0.0 ... lower than current
latest 4.0.1`, exit 1. **The verdict inverts**, so the orientation is load-bearing and proven.

**AC5 — case matrix, 7/7 as expected** (equal, upgrade, downgrade, multi-digit both directions,
major rollover, patch multi-digit): all PASS against expected verdicts.

**Task 6 — behaviour preservation, 7/7 `same`** between the pre-fix inline logic and
`downgrade-guard.sh`. Gates 1-4: **0 diff lines each**. `publish.needs` still **8**. `ci.yml` parses.

**Regression suite — 1655 tests, 1653 pass, 1 FAIL. The failure is PRE-EXISTING, established by
execution, not assumed:** the identical `1655/1653/1` was produced with this story's `ci.yml`
stashed away. No test in `tests/` references `ci.yml` or `scripts/ci/`.

**Test-fixture-isolation violation observed (NOT caused by this story).** Every run of `npm test`
rewrites the real `_bmad/bme/_vortex/config.yaml`, syncing `version: 4.0.0` → `4.0.1-rc.0` from
`package.json`. Reproduced on the clean tree with this story's changes stashed. It dirties a
**shipped** config file on every test run while `package.json` sits at a prerelease. Reverted both
times; filed for the backlog in Task 7.

### Completion Notes List

**AC5 SATISFIED — the FR5 comparison executed on a GNU-coreutils runner for the first time.**
Run `32659041872`, job `97242302031`, commit `fc59c190`. Environment: `ubuntu-24.04`,
node `v24.19.0`, npm `11.17.0`, shell `/usr/bin/bash -eo pipefail`. Verbatim:

```
Downgrade guard (dry): 4.0.0     vs 4.0.0     -- OK    (want OK   )
Downgrade guard (dry): 4.0.1     vs 4.0.0     -- OK    (want OK   )
Downgrade guard (dry): 3.3.1     vs 4.0.0     -- FATAL (want FATAL)
Downgrade guard (dry): 4.10.0    vs 4.9.0     -- OK    (want OK   )
Downgrade guard (dry): 4.9.0     vs 4.10.0    -- FATAL (want FATAL)
Downgrade guard (dry): 10.0.0    vs 9.9.9     -- OK    (want OK   )
Downgrade guard (dry): 4.0.2     vs 4.0.10    -- FATAL (want FATAL)
--- contract checks ---
empty CURRENT -- aborts, OK
non-X.Y.Z CAND -- aborts, OK
```

7/7 matrix + 2/2 contract checks, **identical to the local BSD results**. The job carried
`Contents: read` only — no `id-token` — and is absent from `publish.needs`, so it could not publish.

**AC6 — the BSD/GNU disclosure closes, with a caveat stated rather than buried.** GNU agreed with
BSD on every case run. That **corroborates** the argument in `ci.yml`'s comment; it does not by
itself prove it, because — as the comment records — none of these cases *could* have diverged: the
pairs are canonical `X.Y.Z` triples, and the only genuinely free case (a zero-padded numeric tie)
is unreachable because gate 4's `SEMVER_RE` rejects leading zeros. The closure rests on the shape
checks; the runner run is confirmation that nothing unexpected happens on GNU.

**T48 observed live, unprompted.** The push of `40461002` started run `32658994321`, which was
**cancelled** when `fc59c190` arrived moments later — the workflow-level
`concurrency: ci-${{ github.ref }}, cancel-in-progress: true` doing exactly what T48 describes.
Harmless on `main` (the later run supersedes and contains both commits); on a **tag** the same
mechanism can cancel a run already inside `npm publish`, which is one of the two paths into T47's
moved-tag-on-a-red-run state. T48 is no longer theoretical -- evidence added to the row.

**What is still NOT proven, stated plainly:** the *publish-path* call site executes only on a real
stable tag. The dry job proves the shared script and the two callers' contract; it does not execute
the registry read, the E404 anchor (no network in the script, by design), or `GUARD_SKIP`. Those
remain fixture-proven. AC7b records this.

### File List

- `scripts/ci/downgrade-guard.sh` — **NEW** (Task 4): the single copy of the comparison
- `.github/workflows/ci.yml` — FR5 block rewired to call it; `downgrade-guard-dry` job added; BSD/GNU note closed (AC6)
- `_bmad-output/implementation-artifacts/dist-1b-1-...-on-a-runner.md` — frontmatter, status, tasks, Dev Agent Record
- `_bmad-output/implementation-artifacts/sprint-status.yaml` — status
- `_bmad-output/planning-artifacts/convoke-note-initiative-lifecycle-backlog.md` — T46 closed + relocated, T49 half-closed, T48 evidenced, Change Log receipt

## Change Log

| Date | Change |
|---|---|
| 2026-08-23 | **Round 2 on the rewrite — 4 NEW HIGH, all introduced by Round 1's redesign.** **The BSD/GNU `sort -V` disclosure cannot be closed by a runner case at all, and the AC demanding one was wrong.** Executed: `4.9.0` vs `4.10.0` gives `4.9.0` in both input orders — it discriminates `sort -V` from plain `sort`, not GNU from BSD, so "closing" the note on it would reproduce `dist-1-6`'s pattern one level down, watching a case pass that could never fail. The one genuinely free case, a zero-padded numeric tie, is **unreachable**: gate 4's `SEMVER_RE` rejects leading zeros before `CAND` is assigned (`semver.valid('4.01.0') === null`). On the guard's admissible input space the implementations agree **by construction**, so AC6 now closes the note by argument from the shape checks — which Dev Notes §2 had said all along while the AC demanded the opposite. **The extraction relocates the unexecuted code rather than removing it:** the dry job supplies its own fixtures, so the *publish call site* is new and exercised by nothing, and transposing two positionals would invert every verdict while the matrix stayed green. Contract changed to **named env vars** plus **AC5b**, which requires a deliberate transposition to be shown changing the verdict. **The split fell in the wrong place:** moving the `CAND` shape check into the script would leave `CAND` unvalidated on the E404 skip path, where the script is never called — a fail-open of T46's own family; it stays in the workflow. **AC7b's rationale was false** — the shared script makes no network call, so the new job never invokes npm and cannot exercise the anchor at any version; the pin is parity only, and the discriminator is now stated as **fixture-proven and unproven on any runner** |
| 2026-08-23 | **Story review before implementation — 2 layers. Verdict: NOT ready as drafted; design rewritten.** **3 HIGH, and the two that mattered interlocked.** **AC5 was unsatisfiable on the current tree:** `package.json` is `4.0.1-rc.0`, so a dry run "against `package.json`" either takes the `DIST_TAG != latest` skip branch — reproducing `dist-1-6`'s gap byte for byte, the very gap the story exists to close — or FATALs on the `CAND` shape check and reddens `main` and every PR permanently; and the only fix, bumping the version, was explicitly out of scope. Task 4 had spotted the hazard and delegated it to the dev agent while AC5 offered no option. **And §3 forbade the one construction that would have made AC5 true:** it permitted `ci.yml` and "nothing else", so the only legal implementation was a *copy* — a copy that passes proves the copy passes, while the publish path's code stays as unexecuted as before and the two silently drift. That is this story's own §6 learning turned on itself. **Rewritten around a shared `scripts/ci/downgrade-guard.sh` called by both jobs, driven by a case matrix** rather than the tree's version — which also sidesteps the prerelease coupling and tests more cases than the real version would. **AC6 tightened**: closure of the BSD/GNU `sort -V` disclosure now requires cases where the two implementations *could* disagree (multi-digit, zero-padded); `4.0.1` vs `4.0.0` is trivially ordered and closes nothing. **AC4 was unsatisfiable in one of three branches** — the anchored-E404 branch has no pre-fix failure to demonstrate, and Task 2 already quietly asked for only two; restated as two regressions failing, three branches exercised. **New AC7b**: the discriminator depends on npm ≥ 10's `npm error` prefix (npm 9 emits `npm ERR!`), the publish job pins Node 24 and the test matrix includes Node 18, so the new job must pin the same Node and the dependency must be commented. Also recorded the honest tradeoff — the anchored form swaps a fail-open for a fail-closed — and replaced Task 4's `grep npm publish` assertion with structural ones, since keyword-count checks are exactly what the retro warns about. **All six probes in Dev Notes §1 were independently re-run and reproduce**, including Probe 3 |
| 2026-08-23 | Story created by `bmad-create-story`. **First story authored under `external-claims-must-be-executed-or-hedged`**, and the rule changed the output: rather than describing the intended fix, the discriminator was derived from six executed probes against the live registry, recorded verbatim in Dev Notes §1, with Task 1 instructing the dev agent to re-run rather than trust them. **The probes found something the review had only hypothesised:** `npm view <pkg> <missing-field>` exits **0 with empty stdout AND empty stderr** (Probe 3), so the empty-reply case reaches the success path and is currently misdiagnosed as "multi-line" — AC3 now handles it as itself. The anchored discriminator `^npm error code E404$` was verified correct in **both** directions (Probes 4 and 5), not just against the fail-open. **Scope: T46 + T49(a) as one story, deliberately** — splitting them would ship a guard whose fix is asserted rather than observed on a runner, which is the pattern `dist-epic-1`'s retrospective was written about; T49's `package.json` bump stays open as release prep. AC6 forbids quietly deleting the BSD/GNU `sort -V` note, because `dist-1-6` claimed to close that assumption and did not |
