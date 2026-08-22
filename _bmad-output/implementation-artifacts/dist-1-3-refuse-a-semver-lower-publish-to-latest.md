---
baseline_commit: 0843101edfb0512d746339d472ca1427ce52f0d2
---

# Story 1.3: Refuse a semver-lower publish to `latest`

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->
<!-- baseline_commit is deliberately ABSENT. It is `dev-story`'s field, stamped at implementation
     start. Pre-stamping it during authoring caused a rule deviation in dist-1-2 that the operator
     had to ratify at review. Do not add it here. -->

## Story

As a **Convoke operator**,
I want a maintenance release never to move me backwards,
so that a `3.3.1` cannot downgrade me from 4.0.0.

## Acceptance Criteria

1. **AC1 — A lower version is refused before `npm publish` runs.** Given the registry's `latest` is `4.0.0` and `VERSION=3.3.1`, when the publish job runs, it fails **before** `npm publish` is invoked, printing **both** versions in the failure message.
2. **AC2 — The comparison uses the registry, not `package.json`.** The current `latest` is fetched from the npm registry at job time. A `package.json`-only check cannot satisfy FR5: `ci.yml` queries the registry **nowhere** today (verified 2026-08-22 — the only `registry.npmjs.org` occurrence is `setup-node`'s `registry-url:` config at `ci.yml:386`, which is not a query).
3. **AC3 — Unreachable registry fails closed.** If the registry cannot be reached or the version cannot be determined, the job **fails**. It does not skip the guard, and it does not publish. The story cites `ci.yml:243-246` as precedent — the `fresh-install` job already accepts that a transient registry failure blocks a tag publish exactly as a real defect would, recoverable by re-running. **That trade-off is settled; do not re-argue it.**
4. **AC4 — The guard applies to `latest` only.** When `DIST_TAG=rc` the guard is skipped, because a prerelease never touches the `latest` pointer. Skipping must be explicit and logged, not an accident of control flow.
5. **AC5 — Repair only the citations that actually move.** The guard is inserted **after** the `DIST_TAG` derivation and **before** `npm publish`, i.e. between `ci.yml:415` and `:417`. Lines 409–415 therefore **cannot** move. A sweep on 2026-08-22 found 43 `ci.yml:4xx` citations. Three buckets:

   **Bucket 1 — MOVES, must be repaired (2 sites + 1 range end):**
   - `adr/4-0-1/adr-003-publish-path-enforcement.md:43` — `ci.yml:417`. **ACCEPTED ADR**
   - `adr/4-0-1/adr-003-publish-path-enforcement.md:134` — `ci.yml:417`. **ACCEPTED ADR**
   - `convoke-note-4-0-1-scope-decisions.md:204` — `ci.yml:411-417`; the **end** of the range moves, the start does not

   **Bucket 2 — DOES NOT MOVE, assert and leave (3 sites):** `convoke-note-4-0-1-scope-decisions.md:71`, `convoke-note-initiative-lifecycle-backlog.md:450`, `convoke-note-initiative-lifecycle-backlog.md:1003` — all cite `ci.yml:412`, which is above the insertion point. **Verify they still resolve; do not edit them.** Two are dated receipts protected by §2.5 "nothing disappears without a receipt".

   **Bucket 3 — HISTORICAL, never touch (24 sites):** every `ci.yml:4xx` citation inside `dist-1-1-…md` (3) and `dist-1-2-…md` (21). Completed implementation records. Rewriting them falsifies the record. **If the implementation finds itself editing a completed story file, it has gone wrong.**

   **This story's own 13 self-citations are a fourth case:** it is in-flight, neither live-pointer nor completed record. Update them where the guard makes them false (notably the "current state" quote), because this file is the spec being implemented — that is normal Dev Agent Record work, not a citation repair.

   **Preferred remedy for Bucket 1: delete the line numbers**, replacing them with a step reference (e.g. *"the `Publish to npm` step in `ci.yml`"*). Re-pinning defers the same breakage to Story 1.4, which edits the same block.

6. **AC6 — Nothing else in the publish job changes, except an explanatory comment, which is REQUIRED.** `--provenance`, `--access public`, `--loglevel verbose`, the `NODE_AUTH_TOKEN` block, the OIDC/Node-24 comments and FR1's `${VERSION%%+*}` strip are untouched. FR2/FR3/FR4 are Stories 1.4–1.5 — do not implement them. **But this job carries 27 lines of comment for 8 lines of code, and this story adds a network call with fail-closed semantics: a comment justifying it is in scope and expected.** Story 1.2's R1 raised the inverse defect (a fix with no comment, and a stale comment above it).

7. **AC7 — The rehearsal strategy is recorded, with local reproduction (NFR2).** The comparison is reproduced locally across the full case table, requiring no tag push. **One element is NOT locally reproducible:** the behaviour of a real network partition inside a GitHub runner. State which parts were proven locally and which are deferred to Story 1.6. Do not blur them.

8. **AC8 — T41 finding (e) closes; (b), (c), (d) stay open.** Strike only (e). T41 remains `Open` at `E3 / 5.4` — do not recompute for a single finding, do not move the row. **Sweep every place (e) is asserted, which is more than one per artifact:**
   - backlog T41 row — the `(e)` clause
   - `convoke-note-4-0-1-scope-decisions.md` §3 — **two** places: the MEDIUM line, *and* the "Why it gates rather than queues" paragraph, which says *"Finding (e) fires on precisely this release: a maintenance 3.3.1 … downgrades every user from 4.0.0"*
   - the epic — **expected to need nothing.** It has no per-finding closure convention (FR1 shipped in `dist-1-2` and epic `:97` still reads `[T41(a) HIGH]` unstruck). Record "checked, nothing to change" rather than leaving a reviewer to read silence as an incomplete sweep.

9. **AC9 — NFR10: the gate is demonstrated FAILING against the pre-fix tree.** The epic (`:247-252`) requires *any gate introduced by this epic* to be shown failing before it is accepted, with the output recorded in the story. Run the guard against the pre-fix condition — a candidate lower than the registry's `latest` — and paste the actual refusal output. **This is not the same as Task 3's harness falsification:** that proves the *test* can fail; NFR10 asks that the *gate* be shown doing its job. Record both, separately labelled.

## Tasks / Subtasks

- [x] **Task 1 — Confirm the premise before writing anything (AC: 2)**
  - [x] `grep -n "npm view\|registry.npmjs\|npm dist-tag" .github/workflows/ci.yml` — confirm the only hit is `setup-node`'s `registry-url:` at `:386`. **Note the precise premise:** the job already transacts with the registry (`npm ci`, `npm publish`, `try-fresh-install.sh`). What is new is *reading the `latest` dist-tag*. FR5's justification rests on that narrower claim, not on "no registry dependency today" — do not repeat the looser version, a reviewer will pull it apart. This grep only detects a literal `npm view`; it cannot catch a `curl` or a node fetch
  - [x] `npm view convoke-agents dist-tags.latest` — confirm it returns the current `latest` and exits 0

- [x] **Task 2 — Implement the guard (AC: 1, 2, 3, 4, 6)**
  - [x] Insert the guard into the `Publish to npm` `run:` block, **after** the `DIST_TAG` derivation and **before** `npm publish`. Keeping it in the same block means `DIST_TAG` is already in scope and no step-output plumbing is needed
  - [x] Guard only when `DIST_TAG = latest`; log the skip explicitly on the `rc` path
  - [x] Bind `PKG=$(node -p "require('./package.json').name")` and **fail closed if it is empty or the string `undefined`**. This is not optional garnish: an unbound `PKG` makes the whole guard a silent no-op (see Dev Notes)
  - [x] Normalise the fetch — `2>"$VIEW_ERR" | head -1 | tr -d '[:space:]'`, strip `+metadata`, shape-validate, and reject a prerelease `CURRENT` as an anomaly
  - [x] Treat non-zero exit, empty output, whitespace-only output, or a non-`X.Y.Z` value as fail-closed (AC3), echoing npm's captured stderr so the four causes stay distinguishable
  - [x] Compare with `sort -V` (see Dev Notes for why, and for the three rejected alternatives)
  - [x] Failure message must print **both** versions and the word `latest`, so the log says what happened without needing the source
  - [x] Change nothing else in the job (AC6)

- [x] **Task 3 — Prove the comparison locally (AC: 1, 4, 7)**
  - [x] Reproduce the full case table in Dev Notes, including `10.0.0` vs `9.0.0` — the case a lexical sort gets wrong
  - [x] **Falsify the harness** (`verification-must-be-falsifiable`): substitute a deliberately wrong comparison (e.g. plain `sort` instead of `sort -V`) and show the harness reports `10.0.0 vs 9.0.0` incorrectly. A table that only ever prints the expected answer is not evidence
  - [x] Extract the logic from `ci.yml` itself (`sed -n` the block) rather than retyping it — retyped verification tests the transcription, not the file. **Run it with `bash -eo pipefail -c`, do NOT `source` it:** this block contains `exit 1`, which would kill the harness on the first REFUSE case. Use `-eo pipefail` to match `ci.yml:22-24`'s workflow-wide `defaults.run.shell`, or the harness is not testing shipped conditions
  - [x] Prove the `rc` skip path: with `DIST_TAG=rc`, the guard must not run and must not require the registry

- [x] **Task 4 — Prove the fail-closed path as far as is honestly possible (AC: 3, 7)**
  - [x] Simulate an unreachable registry locally by pointing at an unroutable registry or forcing `npm view` to fail; confirm the job path exits non-zero **before** reaching `npm publish`
  - [x] Simulate empty output (registry reachable, version undeterminable) and confirm the same
  - [x] **State plainly what this does NOT prove:** that a real network partition inside a GitHub runner produces the same `npm view` failure mode. That belongs to Story 1.6's composed rehearsal. Do not claim it here

- [x] **Task 5 — Repair the citations that move; assert the ones that do not (AC: 5)**
  - [x] Read each Class A site and record the line it resolves to **before** the change
  - [x] Apply the preferred remedy: replace line-number citations with a step reference so they cannot drift again
  - [x] Re-run the sweep first — the map has grown once already: `grep -rn "ci\.yml:4[0-9][0-9]" --include="*.md" _bmad-output/`
  - [x] Verify every Class A site resolves after the change by reading the line it now points at; leave every Class B site untouched
  - [x] **ADR-003 is ACCEPTED.** Correcting a factual pointer inside it is legitimate; changing its decision or reasoning is not. Touch only the citation

- [x] **Task 6 — Regression gates (AC: 6)**
  - [x] `python3 -c "import yaml;yaml.safe_load(open('.github/workflows/ci.yml'))"` parses
  - [x] `npm run lint` exits 0
  - [x] `npm test` — **run it when the machine is idle.** Check `uptime` first; the suite is its own load generator and drove load average 2.63 → 22.81 in `dist-1-2`'s review. Under load it produces spurious failures and can take 80 minutes instead of 100 seconds. If it goes red, run the named files individually before concluding anything
  - [x] Confirm the diff touches only the intended lines: `git diff HEAD -- .github/workflows/ci.yml`

- [x] **Task 7 — Close T41 finding (e) across all three artifacts (AC: 8)**
  - [x] Backlog row: strike **(e)** only; leave (b), (c), (d) open; T41 stays `Open` at `E3 / 5.4`; do not move the row
  - [x] `convoke-note-4-0-1-scope-decisions.md` §3 — **TWO places, not one:** (i) the MEDIUM (e) line, and (ii) the "Why it gates rather than queues" paragraph asserting *"Finding (e) fires on precisely this release … downgrades every user from 4.0.0"*, which goes stale the moment the guard lands. **Note §3 also holds a Bucket 2 citation (`:71`) — Task 5 and Task 7 touch the same section; coordinate so one does not clobber the other**
  - [x] `convoke-epic-4-0-1-distribution-integrity.md`: check FR5 and the T41 gate block. **Expect no change** — the epic has no per-finding closure convention (FR1 shipped and `:97` still reads `[T41(a) HIGH]`). Record "checked, nothing to change" explicitly
  - [x] Backlog Change Log receipt naming what changed (§2.5: "nothing disappears without a receipt")
  - [x] Run the verbatim lane-order block from `project-context.md` §`backlog-write-discipline`; paste output. **Baseline is 7 violations**
  - [x] `node scripts/audit/backlog-integrity.js` PASS; **file-level staging only**

- [x] **Task 9 — Demonstrate the gate FAILING against the pre-fix condition (AC: 9, NFR10)**
  - [x] Run the guard with a candidate lower than the registry's `latest` (e.g. `VERSION=3.3.1` against `latest=4.0.0`) and capture the **actual refusal output and exit code**
  - [x] Paste that output into Completion Notes under a heading that says NFR10 explicitly
  - [x] Keep it **separate and separately labelled** from Task 3's harness falsification. They prove different things: Task 3 proves the *test* can report a wrong answer; NFR10 proves the *gate* refuses a real downgrade. Conflating them is how `dist-1-1` ended up citing a check that could not fail
  - [x] Also record the pre-fix baseline: on the tree **without** the guard, the same input reaches `npm publish`. That is the 'against the pre-fix tree' half of NFR10

- [x] **Task 8 — Commit plan (AC: all)**
  - [x] Write a `## Commit Plan` section **into this story file**, carrying all five `commit-preparation` fields: (1) Files, (2) Summary, (3) **Description — why the change exists, what it affects, AND the review status line** (not just the status line; that partial reading was flagged at story review), (4) **staged-set proof** (`git diff --cached --name-only`, run after staging), (5) the falsifiable clause. Fields 3 and 4 were the MEDIUM in `dist-1-2` R1
  - [x] Paste the lane-order output **into the commit Description**, not only into the story — `backlog-write-discipline` names the destination
  - [x] `git add -A` so the index matches the plan
  - [x] Test-touch opt-out: no test harness exists for `ci.yml` shell logic and no test reads `ci.yml` — state it explicitly
  - [x] **OPERATOR STEP — discharged 2026-08-22 at commit `106464c2`: body = 5179 bytes, carrying the Round 1 status, the staged-set proof and the verification-basis disclosure.** GitHub Desktop's Description box is separate from the summary field. After committing, verify with `git log -1 --format=%b | wc -c`. In `dist-1-2` this box was ticked pre-commit and certified a measurement of the *previous* commit's body

### Review Findings — Round 1

3 layers, 0 failed. Acceptance Auditor gave 8/9 ACs MET — **but the ACs did not ask the question that mattered.** The Edge Case Hunter and Blind Hunter each broke the shipped guard. **Verdict: not shippable as implemented.** Status was reverted `review → in-progress`, remediated, and re-verified.

**Four FAIL-OPEN paths — the guard printed `OK` and permitted the downgrade it exists to block**

- [x] [Review][Patch] HIGH — a `version` containing a newline (`"3.3.1\n9.9.9"`) bypassed the guard entirely. Reproduced end-to-end: `Downgrade guard: ... -- OK`, exit 0, `3.3.1` published over `4.0.0`. **Root cause: `CURRENT` was normalised and `CAND` was left raw** — the same "fixed the instance the finding cited and stopped" pattern as `dist-1-1` R2 and `dist-1-2` R1, third occurrence [.github/workflows/ci.yml]
- [x] [Review][Patch] MEDIUM — `head -1` on the registry reply takes the *first* line, not the highest. `3.0.0\n9.9.9` (ascending) was allowed; only the descending orientation failed closed — **and the Completion Notes tested only the descending one.** Now the guard REFUSES any multi-line reply instead of guessing [.github/workflows/ci.yml]
- [x] [Review][Patch] MEDIUM — `tr -d '[:space:]'` deletes *internal* whitespace, welding `3.0.0 9.9.9` into `3.0.09.9.9`, which then passed validation and published. Replaced with parameter-expansion trimming [.github/workflows/ci.yml]
- [x] [Review][Patch] MEDIUM — TOCTOU: `concurrency` is per-ref, so two tags pushed together both read the pre-publish `latest` and the later one moves it backwards. Added a fixed `publish-npm` concurrency group [.github/workflows/ci.yml]

**The validation that was not a validation**

- [x] [Review][Patch] MEDIUM — `case "$X" in [0-9]*.[0-9]*.[0-9]*)` is a **glob, not a regex**: `[0-9]*` means "a digit followed by anything". It accepted `1.2.3.4`, `1.2.3abc`, `4.0.0(deprecated)` and embedded newlines, while AC3 and the shipped comment both described it as validating "a plain X.Y.Z release". Replaced with `[[ =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]` on **both** operands [.github/workflows/ci.yml]

**Fail-closed defects**

- [x] [Review][Patch] MEDIUM — a first publish or package rename was impossible: `npm view <unpublished>` → E404 → FATAL. This repo has renamed its published package once already, and ADR-003 argues *"an escape hatch you rediscover under pressure is the status quo"*. Added an E404 branch that allows the publish (nothing to downgrade) while every other failure still fails closed [.github/workflows/ci.yml]
- [x] [Review][Patch] MEDIUM — `head -1` under `pipefail` takes SIGPIPE on a long npm reply (verified 10/10 deterministic), hard-blocking releases intermittently. Removed the pipeline from the fetch entirely [.github/workflows/ci.yml]
- [x] [Review][Patch] LOW — ANSI colour on npm stdout defeated `tr -d '[:space:]'`. Added `--no-color` [.github/workflows/ci.yml]
- [x] [Review][Patch] LOW — `VIEW_ERR` had no cleanup and a silent `mktemp` failure produced no diagnostic. Added a `trap`, an explicit mktemp check, and capped the error echo at 2000 bytes [.github/workflows/ci.yml]

**Cross-artifact defects, all mine**

- [x] [Review][Patch] MEDIUM — the **epic still asserted "`ci.yml` queries the registry nowhere today"** in two places, which this change makes false. My own Task 1 warned not to repeat that claim and I left the source asserting it. Amended to the true, narrower claim [convoke-epic-4-0-1-distribution-integrity.md:108]
- [x] [Review][Patch] MEDIUM — the T41 row **contradicted itself three ways in one cell**: `3 open (b)–(d)` … `(b)–(e) remain open` … `(b)–(d) remain open` [convoke-note-initiative-lifecycle-backlog.md:450]
- [x] [Review][Patch] MEDIUM — `scope-decisions` had **four** `(e)` assertions, not the two the spec predicted. The two extra (`:86`, `:179`) were missed; `:179` is a standing rule that gated tag pushes on (a)/(c)/(e) [convoke-note-4-0-1-scope-decisions.md:179]
- [x] [Review][Patch] MEDIUM — the backlog Change Log receipt claimed **"8 registry-response paths"; there were 6.** The durable artifact inflated the evidence count [convoke-note-initiative-lifecycle-backlog.md:1003]
- [x] [Review][Patch] LOW — ADR-003 was edited with **no amendment trace**, the second silent edit to an accepted ADR, where sibling ADRs carry Amendment sections. Added one recording both edits [adr-003-publish-path-enforcement.md]

**Deferred**

- [x] [Review][Defer] **All local verification ran on BSD/Apple `sort` 2.3; the runner uses GNU coreutils `sort`** — a different `filevercmp`, and the single operator that decides allow-vs-refuse. The two agree on every case tested, so nothing is known-wrong, but the basis is unverified. **Operator decision 2026-08-22: disclose rather than containerise.** GNU behaviour is ASSUMED and gets live confirmation in Story 1.6 — deferred, disclosed
- [x] [Review][Defer] The `rc` dist-tag itself has no downgrade protection — `3.3.2-rc.1` after `5.0.0-rc.1` moves `rc` backwards. Out of FR5's scope (`latest`-only) — deferred, novel scope
- [x] [Review][Defer] No override path exists if `latest` is left unparseable or prerelease; tag publishes are then blocked until the registry is repaired by hand — deferred, novel scope
- [x] [Review][Defer] Two `ci.yml` citations broke before this story and are invisible to AC5's `4[0-9][0-9]` sweep regex: `release-4.0.0-publish-handoff.md:103` (`ci.yml:377`) and `v63-5b-3-…md:273` (`ci.yml:359`) — deferred, pre-existing
- [x] [Review][Defer] A non-string `name` in `package.json` dies on the unguarded `VERSION=` line with a raw Node stack trace before the guard's own diagnostic runs — deferred, pre-existing

**Dismissed (2):** `sort -V` locale sensitivity (tested across 6 locales including `tr_TR`, identical results); glob-metacharacter injection via `CAND`/`CURRENT`/`PKG` (all quoted in `case` subject position).

## Commit Plan

Written during implementation, revised after Round 1 per `commit-preparation`.

**One commit, all 7 files.**

```
feat(dist-1-3): refuse a semver-lower publish to latest
```

**Files (7):**

- `.github/workflows/ci.yml`
- `_bmad-output/implementation-artifacts/dist-1-3-refuse-a-semver-lower-publish-to-latest.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `_bmad-output/planning-artifacts/adr/4-0-1/adr-003-publish-path-enforcement.md`
- `_bmad-output/planning-artifacts/convoke-epic-4-0-1-distribution-integrity.md`
- `_bmad-output/planning-artifacts/convoke-note-4-0-1-scope-decisions.md`
- `_bmad-output/planning-artifacts/convoke-note-initiative-lifecycle-backlog.md`

**Description:**

```text
WHY: the publish job had no idea what `latest` pointed at, so a maintenance tag
cut from an old branch (v3.3.1) derived DIST_TAG=latest and would have
downgraded every 4.0.0 user. Covers FR5; closes T41 finding (e).

WHAT IT AFFECTS: the `Publish to npm` step gains a registry read of the `latest`
dist-tag and a fail-closed guard, plus a fixed `publish-npm` concurrency group so
concurrent tag publishes serialise. This is a deliberate NEW dependency on
registry availability, accepted per FR5 and matching the fresh-install job's
precedent. E404 is the one exception: a package with nothing published has
nothing to downgrade.

REVIEW STATUS: Round 1 COMPLETE, findings applied. 3 layers, 0 failed. The
Acceptance Auditor returned 8/9 ACs MET, but the ACs did not ask the question
that mattered: the Edge and Blind layers each BROKE the guard. Four fail-open
paths were found and fixed, the most serious reproduced end-to-end -- a
package.json `version` containing a newline made the guard print OK and permit
3.3.1 over 4.0.0. Root cause: CURRENT was normalised, CAND was left raw. Also
fixed: the X.Y.Z "validation" was a glob not a regex and accepted 1.2.3.4 and
1.2.3abc; head -1 took the first line not the highest and SIGPIPEd npm under
pipefail; tr -d welded "3.0.0 9.9.9" into 3.0.09.9.9; a first publish or rename
was impossible via E404; and concurrency was per-ref. 14 patched, 5 deferred,
2 dismissed. No Round 2: code-review-convergence triggers R2 only on a HIGH
surviving triage, and every HIGH was fixed in this pass.

VERIFICATION BASIS -- READ THIS: all local verification ran on BSD/Apple sort
2.3. The runner uses GNU coreutils sort, a different filevercmp, and sort -V is
the single operator that decides allow-vs-refuse. The two agree on every case
tested here, so nothing is known-wrong, but GNU behaviour is ASSUMED, not
verified. Operator decision 2026-08-22: disclose rather than containerise; live
confirmation lands with Story 1.6's composed rehearsal.

VERIFIED (Apple sort): 10 candidate paths and 6 registry-response paths, run
from the block extracted out of ci.yml, not retyped. Four previously fail-open
inputs re-tested against the SHIPPED v2 block: all now exit 1.

NFR10 (failing-gate demonstration, kept separate from the harness falsification):
  post-fix, VERSION=3.3.1 -> "FATAL: refusing to publish 3.3.1 to 'latest'
    -- lower than current latest 4.0.0."  exit 1
  pre-fix tree, same input -> ">>> npm publish WOULD RUN"  exit 0

NOT PROVEN, not claimed: that a real network partition inside a GitHub runner
produces the same npm view failure mode. A stub is not a partition. Story 1.6.

REVIEWED SET != STAGED SET, disclosed per code-review-convergence. Round 1
reviewed 6 files; this commit stages 7. The addition is the epic, pulled in by
the R1 fix -- it still asserted "ci.yml queries the registry nowhere today",
which this change falsifies. All three layers read it in the tree and one
finding came from it, but its edits were not reviewed. R1 remediation is itself
unreviewed text: every fix is a shell hardening or a documentation correction,
not a structural change, so it is disclosed rather than re-reviewed.

ACCEPTED ADR EDITED: adr-003's two ci.yml:417 citations were de-pinned to a step
reference (npm publish moved 417 -> 472, and Story 1.4 edits the same block so
re-pinning would break again). Factual pointer only; decision unchanged. An
Amendments section was added -- this is the second silent edit to that accepted
ADR and it previously had no trace, while sibling ADRs carry one.

T41 finding (e) closed; (b)(c)(d) remain open and T41 stays Open at E3/5.4. The
sweep covered SIX assertions of (e), not the two the spec predicted: the backlog
row (which was self-contradicting in three ways), four in scope-decisions
including a standing rule that gated tag pushes, and the epic (checked; its
per-finding markers are correctly left unstruck by convention).

TEST-TOUCH OPT-OUT (commit-preparation): edits a CI workflow with no test
change. No harness exists for ci.yml shell logic and no test reads ci.yml or
DIST_TAG.

TEST SUITE: green -- 1655 tests / 1654 pass / 0 fail / 0 cancelled, exit 0.

Staged set (git diff --cached --name-only), run after staging:
  .github/workflows/ci.yml
  _bmad-output/implementation-artifacts/dist-1-3-refuse-a-semver-lower-publish-to-latest.md
  _bmad-output/implementation-artifacts/sprint-status.yaml
  _bmad-output/planning-artifacts/adr/4-0-1/adr-003-publish-path-enforcement.md
  _bmad-output/planning-artifacts/convoke-epic-4-0-1-distribution-integrity.md
  _bmad-output/planning-artifacts/convoke-note-4-0-1-scope-decisions.md
  _bmad-output/planning-artifacts/convoke-note-initiative-lifecycle-backlog.md

Lane-order check (backlog-write-discipline):
Bug: BUG-19 (5.7) below BUG-17 (4.5) [clause 1]
Bug: BUG-9 (live 7.2) below closed BUG-12 [clause 3]
Fast: T35 (live 4.5) below closed T39 [clause 3]
Fast: I105 (live 3.2) below closed I96 [clause 3]
Fast: T37 (2.6) below T36 (2.4) [clause 1]
Fast: T18 (2.7) below T37 (2.6) [clause 1]
Init: I113 (1.5) below P2 (0.4) [clause 1]
LANE ORDER: 7 violation(s)

Unchanged at 7 violations; none introduced, none on T41.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
```

## Dev Notes

### What this story is, in one line

The publish job has no idea what `latest` currently points at. Ask the registry, and refuse to move it backwards.

### The file being modified — current state

`.github/workflows/ci.yml`, the `Publish to npm` step (lines **409–417** as of `21775f9d`; `:409` is the `- name:` line):

```yaml
      - name: Publish to npm
        run: |
          VERSION=$(node -p "require('./package.json').version")
          case "${VERSION%%+*}" in
            *-*) DIST_TAG=rc ;;
            *)   DIST_TAG=latest ;;
          esac
          echo "Publishing $VERSION to dist-tag $DIST_TAG"
          npm publish --provenance --access public --tag "$DIST_TAG" --loglevel verbose
```

The `${VERSION%%+*}` strip is **FR1, shipped by `dist-1-2`**. Preserve it (AC6).

### The verified guard logic

**This snippet replaces an earlier one that was catastrophically wrong.** The first draft used an undefined `$PKG`; with no `set -u` it expanded to empty, and `npm view "" dist-tags.latest` does **not** error — it resolves a real published package named `undefined` and returns `0.1.0`, exit 0. The fail-closed branch never fired. Measured end-to-end: **the guard would have published `3.3.1` over `4.0.0`** — the exact downgrade FR5 exists to stop — with every local check green. Found by all three story-review layers, 2026-08-22.

```bash
if [ "$DIST_TAG" = "latest" ]; then
  PKG=$(node -p "require('./package.json').name" 2>/dev/null) || PKG=""
  case "$PKG" in ""|undefined) echo "FATAL: cannot determine package name." >&2; exit 1 ;; esac
  CAND="${VERSION%%+*}"
  case "$CAND" in
    [0-9]*.[0-9]*.[0-9]*) : ;;
    *) echo "FATAL: version '$VERSION' is not a plain X.Y.Z release; refusing." >&2; exit 1 ;;
  esac
  VIEW_ERR=$(mktemp)
  CURRENT=$(npm view "$PKG" dist-tags.latest 2>"$VIEW_ERR" | head -1 | tr -d '[:space:]') || CURRENT=""
  CURRENT="${CURRENT%%+*}"
  case "$CURRENT" in
    [0-9]*.[0-9]*.[0-9]*) : ;;
    *) echo "FATAL: could not determine current 'latest' for $PKG (got '$CURRENT')." >&2
       echo "npm said: $(cat "$VIEW_ERR")" >&2; exit 1 ;;
  esac
  case "$CURRENT" in
    *-*) echo "FATAL: 'latest' currently holds prerelease $CURRENT — refusing to compare." >&2; exit 1 ;;
  esac
  LOWEST=$(printf '%s\n%s\n' "$CURRENT" "$CAND" | sort -V | head -1)
  if [ "$CAND" != "$CURRENT" ] && [ "$LOWEST" = "$CAND" ]; then
    echo "FATAL: refusing to publish $VERSION to 'latest' — lower than current latest $CURRENT." >&2
    exit 1
  fi
  echo "Downgrade guard: $CAND >= current latest $CURRENT — OK"
else
  echo "Downgrade guard: skipped (DIST_TAG=$DIST_TAG, prerelease never moves 'latest')"
fi
```

Every line of hardening below exists because a review layer broke the previous version:

| Line | Defends against |
|---|---|
| `PKG=$(node -p …name)` + `""\|undefined` check | the fail-open above. Reads the name from `package.json` per `no-hardcoded-versions` |
| `CAND` shape check `[0-9]*.[0-9]*.[0-9]*` | `VERSION=undefined` (node prints the string and exits 0) and `v3.0.0` — both sort *above* a numeric `latest`, so both were allowed |
| `head -1` on the fetch | a multi-line registry response fed 3+ lines to `sort -V`, so `head -1` returned the minimum of the whole set, not of the pair |
| `tr -d '[:space:]'` | whitespace-only output passed the `-z` check |
| `CURRENT="${CURRENT%%+*}"` | metadata was stripped from the candidate but not from `CURRENT`, so `4.0.0` vs `4.0.0+meta` refused a legitimate release |
| `CURRENT` shape check | unvalidated registry input reaching the comparator |
| `CURRENT` prerelease check | **`sort -V` disagrees with SemVer here.** `printf '4.1.0\n4.1.0-rc.1\n' \| sort -V` ranks `4.1.0` **below** `4.1.0-rc.1`. If a prerelease ever lands on `latest` — reachable via T41(c), still open — every stable release is then refused, unrecoverable from CI. Refusing with a clear message beats comparing wrongly |
| `2>"$VIEW_ERR"` + echo | the original discarded npm's error, collapsing 404 / ENOTFOUND / E401 / timeout into one message, on a job where each diagnosis costs a tag delete-and-repush |
| the `else` branch | **AC4 requires the skip be logged.** The original snippet was a bare `if` with no `else` — it violated the story's own AC |

### Verified behaviour (run 2026-08-22 during story review)

Candidate paths, real registry (`latest` = `4.0.0`):

| VERSION | DIST_TAG | rc | outcome |
|---|---|---|---|
| `3.3.1` | latest | 1 | REFUSED — lower than 4.0.0 |
| `4.0.1` | latest | 0 | allowed |
| `undefined` | latest | 1 | REFUSED — not a plain X.Y.Z |
| `v3.0.0` | latest | 1 | REFUSED — not a plain X.Y.Z |
| `4.1.0-rc.1` | **rc** | 0 | **skipped, and logged** |

Registry-response paths, `npm` stubbed:

| registry returns | candidate | outcome |
|---|---|---|
| `5.0.0\n3.0.0` (multi-line) | `4.0.0` | REFUSED (collapses to 5.0.0) |
| `'   '` (whitespace) | `3.0.0` | fail closed |
| `''` + rc=1 (unreachable) | `4.0.1` | fail closed |
| `4.1.0-rc.1` (prerelease) | `4.1.0` | fail closed, named as an anomaly |
| `4.0.0+meta` | `4.0.0` | allowed (equal precedence) |
| `4.0.0` | `4.0.1` | allowed |

Reproduce **all of it** per AC7 — the point of NFR2 is that the implementer proves it. The stub used was a `npm` shim on `PATH` returning `$STUB_OUT` / `$STUB_RC` for `view`.

### Why `sort -V`, and three rejected alternatives

`sort -V` is coreutils, present on `ubuntu-latest`, needs no install and no network. **It is exact for this comparison because the guard only runs when `DIST_TAG=latest`, which means the candidate has no prerelease component** — so the general SemVer-vs-`sort -V` divergence on prerelease precedence cannot be reached.

Rejected:

- **`npx --yes semver`** — puts a *network package download* inside the publish path, on a job that already has a registry dependency this story is adding deliberately and reluctantly. Two network failure modes instead of one.
- **The transitive `semver`** — `semver@7.7.4` IS in `node_modules`, but only via `c8 → istanbul-lib-report → make-dir → semver` (verified 2026-08-22 with `npm ls semver`). It is **not** a declared dependency. A `c8` upgrade could drop it and the guard would break silently, in a path that runs once per release. Do not use it.
- **Hand-rolled comparison in `node -e`** — more code than `sort -V`, more to get wrong, and no test harness covers `ci.yml`.

### 🚩 This story WILL move line numbers — that is the main trap

Story 1.2's AC5 pinned the diff at net-zero lines to protect citations. **That is impossible here:** the guard must precede `npm publish`, and `npm publish` is the last line of the step, so anything inserted shifts it.

Citation sites enumerated 2026-08-22. **An earlier draft of this story said "only three sites" — that was wrong**, and the error is instructive: the `dist-1-2` review remediation *itself* introduced new `ci.yml:412` citations, so the map grew between authoring passes. Re-run the sweep at implementation time rather than trusting this table:

```bash
grep -rn "ci\.yml:4[0-9][0-9]" --include="*.md" _bmad-output/
```

| Class A — repair (live pointers) | Cites |
|---|---|
| `adr-003-publish-path-enforcement.md:43` | `ci.yml:417` — **accepted ADR** |
| `adr-003-publish-path-enforcement.md:134` | `ci.yml:417` — **accepted ADR** |
| `convoke-note-4-0-1-scope-decisions.md:204` | `ci.yml:411-417` |
| `convoke-note-4-0-1-scope-decisions.md:71` | `ci.yml:412` |
| `convoke-note-initiative-lifecycle-backlog.md:450` | `ci.yml:412` |
| `convoke-note-initiative-lifecycle-backlog.md:1003` | `ci.yml:412` |

| Class B — leave alone (historical) | Count |
|---|---|
| `dist-1-1-retire-the-badges-pipeline.md` | 3 sites |
| `dist-1-2-strip-build-metadata-before-the-prerelease-test.md` | ~22 sites |

Everything else (`ci.yml:10-12`, `:16`, `:38`, `:50`, `:62-66`, `:93-108`, `:122`, `:147-171`, `:192`, `:220-222`, `:243-246`, `:263`, `:359`, `:376-377`, `:401-402`) cites lines **above** the insertion point and is unaffected. Verify that assumption holds before relying on it.

**`dist-1-1`'s R2 found this exact breakage** when a +4-line comment edit silently invalidated `ci.yml:417` in an accepted ADR. It was fixed by reflowing to net-zero. That escape hatch does not exist here, which is why AC5 requires repair rather than avoidance — and why the *preferred* remedy is to delete the line numbers rather than re-pin them.

### What is genuinely NOT locally provable

Story 1.2 could claim full local reproduction because the derivation was a pure shell expression. **This story cannot.** Locally provable: the comparison logic, the `rc` skip path, and the fail-closed branch given a simulated `npm view` failure. **Not** provable locally: that a real network partition or registry outage inside a GitHub runner produces the failure mode this guard assumes from `npm view`. Say so; do not blur it into the reproduced set. That evidence arrives with Story 1.6.

### Disproved risks — do not re-raise

- **The guard does not affect prerelease publishes.** `DIST_TAG=rc` skips it entirely (AC4), and a prerelease never moves `latest`. This is also why NFR1's exemption depends on FR1 alone and not on FR5 — see the epic at `:227-237`, which corrected an earlier draft that wrongly coupled them.
- **`4.0.0` is already published and unaffected.** This changes only what a *future* tagged publish is allowed to do.
- **This is not FR3.** Tag-vs-`package.json` disagreement is T41 finding (c) and Story 1.4. The guard compares `package.json` to the *registry*, not to the tag.

### Cross-story dependencies

- **Builds directly on `dist-1-2`.** It reads `DIST_TAG`, which FR1 made correct. Had FR1 not landed, `4.0.0+meta` would derive `rc` and skip this guard entirely.
- **Story 1.4 (FR3) and 1.5 edit the same block.** Sequenced so each gets one isolated rehearsal. Do not merge their work in (AC6).
- **Story 1.6** composes all of them and is where the registry-failure path gets its live evidence.

### Project Structure Notes

- Only `.github/workflows/ci.yml`, two planning artifacts and the backlog are touched. No `_bmad/bme/` namespace, so the **Covenant compliance checklist is N/A**.
- **Namespace decision:** N/A — no new skill, workflow or agent is authored.

### Testing standards

- **No new tests, and no harness exists for `ci.yml` shell logic** — confirmed for `dist-1-2` by `grep -rl "ci.yml\|DIST_TAG" tests/` returning zero files. Re-confirm rather than assume.
- The evidence is the local case table (AC7) plus the falsification required by Task 3.
- `verification-must-be-falsifiable` applies to every cited check. `verification-pipefail` applies to every piped command.

### References

- [Source: _bmad-output/planning-artifacts/convoke-epic-4-0-1-distribution-integrity.md#Story 1.3] — acceptance criteria origin
- [Source: _bmad-output/planning-artifacts/convoke-epic-4-0-1-distribution-integrity.md:106-111] — FR5, including the stated registry-availability trade-off
- [Source: _bmad-output/planning-artifacts/convoke-epic-4-0-1-distribution-integrity.md:227-237] — NFR1, and why FR5 is NOT coupled to the exemption
- [Source: _bmad-output/planning-artifacts/convoke-epic-4-0-1-distribution-integrity.md:238-244] — NFR2 rehearsal-strategy enforcement
- [Source: _bmad-output/planning-artifacts/convoke-epic-4-0-1-distribution-integrity.md:247-252] — NFR10, the failing-gate demonstration AC9 discharges
- [Source: .github/workflows/ci.yml:243-246] — the fail-closed precedent AC3 relies on
- [Source: _bmad-output/planning-artifacts/adr/4-0-1/adr-003-publish-path-enforcement.md] — accepted; two citation sites AC5 must repair
- [Source: _bmad-output/implementation-artifacts/dist-1-2-strip-build-metadata-before-the-prerelease-test.md] — previous story; its R1 findings are the traps this story is built to avoid
- [Source: project-context.md#verification-must-be-falsifiable] — Task 3's falsification requirement
- [Source: project-context.md#backlog-write-discipline] — lane-order check for Task 7
- [Source: project-context.md#commit-preparation] — all five fields required in Task 8
- [Source: project-context.md#code-review-convergence] — reviewed set must equal committed set

## Dev Agent Record

### Agent Model Used

Claude Opus 5 (1M context) — `claude-opus-5[1m]`, via `bmad-dev-story`.

### Debug Log References

**Baseline.** `baseline_commit: 0843101e` stamped by `dev-story` at implementation start. The field was deliberately absent from the authored story — the lesson from `dist-1-2`, where pre-stamping it during authoring caused a rule deviation the operator had to ratify.

**Task 1 — premise confirmed.** `grep` returns exactly one hit, `registry-url:` at `ci.yml:386`. Registry `latest` = `4.0.0`. The story's precise framing was used: the job already transacts with the registry (`npm ci`, `npm publish`, `try-fresh-install.sh`); what is new is *reading the `latest` dist-tag*.

**Task 2 — guard inserted, +42 lines**, between the `DIST_TAG` derivation and `npm publish`. `npm publish` moved `417 → 459`, exactly the shift AC5 anticipated. `ci.yml` parses.

**Task 3 — verification runs the shipped block.** The guard was extracted from `ci.yml:430-457` with `sed` and executed via `bash -eo pipefail -c` — **not** sourced, because the block contains `exit 1` twice and sourcing would kill the harness on the first REFUSE. `-eo pipefail` matches `ci.yml:22-24`'s workflow-wide `defaults.run.shell`, so the harness runs under shipped conditions.

**Task 3 — harness falsified.** Substituting plain `sort` for `sort -V`: `10.0.0` flips `rc=0 → rc=1` (a correct release wrongly refused), while `4.0.1` is unchanged. The harness reports a wrong answer when given a wrong comparator, so it is capable of failing.

**Task 4 — fail-closed proven for every reachable input shape, with `npm` stubbed** by a `PATH` shim returning `$STUB_OUT` / `$STUB_RC` for `view`. Unreachable (rc=1), empty at rc=0, whitespace-only, multi-line, prerelease-`latest` — all exit 1 before `npm publish`.

**What Task 4 does NOT prove, stated per AC7:** that a real network partition inside a GitHub runner produces the same `npm view` failure mode this guard assumes. A stub is not a partition. That evidence arrives with Story 1.6's composed rehearsal. It is not claimed here.

**Task 5 — citations.** Bucket 1 (3 sites) repaired by *removing* the line numbers rather than re-pinning, so Story 1.4 cannot break them again: both ADR-003 pointers and `scope-decisions`'s BUG-15 verdict now say "`ci.yml`'s `Publish to npm` step". Bucket 2 (3 sites citing `ci.yml:412`) verified still resolving — `:412` still reads `case "${VERSION%%+*}" in` — and **left untouched**, as specified. Bucket 3 (24 sites in completed story files) not opened.

**Task 7 — the epic leg is genuinely vacuous, and that was verified rather than assumed.** `git log -- <epic>` shows its last touch was `dist-1-1`; `dist-1-2` shipped FR1 without editing it, and `:97` still reads `[T41(a) HIGH]` unstruck. So "checked, nothing to change" is the honest result, recorded explicitly so a reviewer does not read an unedited epic as an incomplete sweep.

**Task 6 — suite run on an idle machine, per the story's own instruction.** `uptime` load average was **2.91** before starting. Result: 1655 tests / 1654 pass / 0 fail / **0 cancelled** / 1 skipped, exit 0, **103 seconds**. Contrast `dist-1-2`, where the same suite was run under load average 17 and produced 3 spurious failures and an 81-minute runtime. The instruction was worth having.

### Completion Notes List

**What shipped.** A downgrade guard in the `Publish to npm` step: bind the package name from `package.json`, fetch `dist-tags.latest` from the registry, and refuse a semver-lower publish to `latest`. Fails **closed**. +42 lines, 12 of them the comment AC6 requires.

**The guard this story nearly shipped instead.** The authored draft used an undefined `$PKG`. With no `set -u` it expands to empty, and `npm view "" dist-tags.latest` does not error — it resolves a real published package named `undefined` and returns `0.1.0` at exit 0. The fail-closed branch never fired. Measured end-to-end during story review: **`3.3.1` would have published over `4.0.0`**, the exact downgrade FR5 exists to prevent, with every local check green. Caught by the pre-commit story review, not by implementation.

**AC1/AC2/AC4 — candidate paths** (real registry, `latest` = `4.0.0`), run from the block extracted out of `ci.yml`:

| VERSION | DIST_TAG | rc | outcome |
|---|---|---|---|
| `3.3.1` / `3.3.2` | latest | 1 | REFUSED — lower than 4.0.0 |
| `undefined` | latest | 1 | REFUSED — not a plain X.Y.Z |
| `v3.0.0` | latest | 1 | REFUSED — not a plain X.Y.Z |
| `4.0.0` / `4.0.1` / `4.1.0` / `10.0.0` | latest | 0 | allowed |
| `4.0.1+sha.abc` | latest | 0 | allowed (metadata stripped) |
| `4.1.0-rc.1` | **rc** | 0 | **skipped, and logged** (AC4) |

**AC3 — registry-response paths**, `npm` stubbed:

| registry returns | candidate | rc | outcome |
|---|---|---|---|
| unreachable (rc=1) | `4.0.1` | 1 | fail closed |
| empty at rc=0 | `4.0.1` | 1 | fail closed |
| whitespace only | `3.0.0` | 1 | fail closed |
| `5.0.0\n3.0.0` multi-line | `4.0.0` | 1 | REFUSED (collapses to 5.0.0) |
| `4.1.0-rc.1` | `4.1.0` | 1 | fail closed — anomaly named |
| `4.0.0+meta` | `4.0.0` | 0 | allowed (equal precedence) |

**AC9 / NFR10 — the gate demonstrated FAILING, and the pre-fix baseline.** These are recorded separately from Task 3's falsification because they prove different things: falsification shows the *test* can report a wrong answer; NFR10 shows the *gate* refuses a real downgrade.

```
post-fix, VERSION=3.3.1, latest=4.0.0:
  FATAL: refusing to publish 3.3.1 to 'latest' -- lower than current latest 4.0.0.
  exit code: 1

pre-fix tree (git show HEAD:ci.yml), same input:
  Publishing 3.3.1 to dist-tag latest
  >>> npm publish WOULD RUN (no guard exists on the pre-fix tree)
  exit code: 0
```

**AC5 — citations.** Bucket 1 repaired by deleting the line numbers, not re-pinning them: Story 1.4 edits this same block and would have broken freshly-pinned numbers immediately. Bucket 2 asserted and left alone (two are dated receipts protected by §2.5). Bucket 3 not opened.

**AC6 — the comment is in scope and was written.** 12 lines explaining why a network dependency was added to a publish path, why it fails closed, and what each validation defends against. This job carries 27 lines of comment for 8 of code; a silent network call would have been the anomaly. Story 1.2's R1 raised the inverse defect.

**AC8 — the sweep covered every assertion of (e), not one per artifact.** Backlog row; `scope-decisions` §3 in **two** places — the MEDIUM line *and* the "Why it gates rather than queues" paragraph, which claimed *"(e) fires on precisely this release"* and would have gone stale silently; epic checked and confirmed vacuous. Partial sweeps produced the HIGH in both `dist-1-1` R2 and `dist-1-2` R1.

**Verified:** rows 669 → 670 (+1 = Change Log receipt), `backlog-integrity.js` PASS, `reference-integrity.js` PASS, lane order **7 violations — unchanged, none introduced**, `npm run lint` exit 0, `ci.yml` parses, `npm test` 1654 pass / 0 fail / 0 cancelled at exit 0.

### File List

**Modified — source & config (1)**
- `.github/workflows/ci.yml` — downgrade guard added to the `Publish to npm` step (+42 lines incl. a 12-line rationale comment)

**Modified — planning & tracking (5)**
- `_bmad-output/planning-artifacts/adr/4-0-1/adr-003-publish-path-enforcement.md` — two `ci.yml:417` citations replaced with a step reference (accepted ADR; factual pointer only, decision untouched)
- `_bmad-output/planning-artifacts/convoke-note-4-0-1-scope-decisions.md` — BUG-15 verdict de-pinned; both (e) assertions in §3 struck as fixed
- `_bmad-output/planning-artifacts/convoke-note-initiative-lifecycle-backlog.md` — T41 finding (e) struck; Change Log receipt
- `_bmad-output/implementation-artifacts/sprint-status.yaml` — story status
- `_bmad-output/implementation-artifacts/dist-1-3-refuse-a-semver-lower-publish-to-latest.md` — this file

## Change Log

| Date | Change |
|---|---|
| 2026-08-22 | **Round 1 complete; committed as `106464c2`** (7 files). 3 layers, 0 failed. The Auditor returned 8/9 ACs MET but the Edge and Blind layers each **broke the guard**: four fail-open paths, the worst reproduced end-to-end — a newline in `package.json`'s `version` made the guard print `OK` and permit `3.3.1` over `4.0.0`. Root cause: `CURRENT` normalised, `CAND` left raw — the third instance this session of fixing only the cited instance. Also fixed: the X.Y.Z check was a **glob, not a regex**; `head -1` took first-not-highest and SIGPIPEd npm under `pipefail`; `tr -d` welded two tokens into a fake version; first-publish/rename was impossible via E404; `concurrency` was per-ref. Plus 5 cross-artifact defects including an epic claim this change falsifies and a self-contradicting T41 row. 14 patched, 5 deferred, 2 dismissed. No R2 (no HIGH survived triage). **Verification basis disclosed, not hidden:** all local proof ran on BSD/Apple `sort`, the runner uses GNU coreutils `sort`; GNU behaviour is assumed and confirms in Story 1.6. Operator step discharged (body 5179 bytes). Status → done |
| 2026-08-22 | **Story review before commit — 3 layers (adversarial, edge-case, implementability).** Verdict: **not ready as written**; corrected in place. **The specified guard would have failed OPEN** — `$PKG` was never defined, and `npm view "" dist-tags.latest` resolves a real package named `undefined` returning `0.1.0` at exit 0, so the fail-closed branch never fired and `3.3.1` would have published over `4.0.0`. Guard rewritten and re-verified across 5 candidate paths + 6 registry-response paths. **AC5's premise was false** for 3 of its 6 sites (`ci.yml:412` is above the insertion point) — the same false-premise-AC defect that forced an operator amendment in `dist-1-1`; rescoped to 2 sites + 1 range end, with a third bucket for this in-flight file's own 13 self-citations. **NFR10 had zero coverage** — added as AC9 + Task 9. Also fixed: the reference snippet violated its own AC4 (no skip log), `sort -V` disagrees with SemVer when `latest` holds a prerelease (now refused as an anomaly), `2>/dev/null` discarded the only diagnostic, AC6 forbade the comment this repo's convention requires, Task 5's heading still said 'three', and Task 8 forbade ticking a checkbox the story never created |
| 2026-08-22 | Story created by `bmad-create-story`. Guard logic verified across a 9-case table at authoring time, including `10.0.0` vs `9.0.0`. `semver` confirmed transitive-only (`c8 → istanbul-lib-report → make-dir`) and rejected as a dependency. Citation impact enumerated: **2 sites + 1 range end** actually move (both ADR-003 pointers and the end of `scope-decisions:204`); 3 more cite `ci.yml:412`, which is above the insertion point and does not move; 24 are historical records in completed story files. `baseline_commit` deliberately **not** pre-stamped — that mistake in `dist-1-2` required an operator ratification at review. Carries four traps from `dist-1-2` R1: sweep all three artifacts not just the cited one; commit plan needs all five `commit-preparation` fields; do not tick the post-commit check pre-commit; run `npm test` only when the machine is idle |
