---
baseline_commit: 567367700cc4743ca40b8fbecc013edb4de84ce1
---

# Story 1.1: Retire the badges pipeline

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **Convoke maintainer**,
I want the badges pipeline removed from the repository and from the publish path,
so that no release is ever blocked by a generated file that no document consumes.

## Acceptance Criteria

1. **AC1 — The publish hook is gone.** `package.json` no longer declares `prepublishOnly`, `badges:check` or `badges`. The `prepublishOnly` key is *removed*, not left empty.
2. **AC2 — The pipeline is deleted.** `scripts/generate-badges-json.js`, `.github/workflows/badges.yml` and `docs/badges.json` are removed in one commit.
3. **AC3 — `knip` gains no new finding, and the entry goes in the same commit as the deletion.** The `scripts/generate-badges-json.js` entry is removed from `knip.json` in the same commit as the file deletion, and `knip` reports no missing-entry/unresolved error. *Amended 2026-08-21 by operator decision during code review.* The original clause read "`knip` stays green". That premise was **never true**: `knip` is neither a `devDependency` nor a CI job, and it exits **1 on the pre-change tree as well** on pre-existing unused-export findings unrelated to this story. Reproduced against a baseline clone of `56736770` — 14 unused files / 79 unused exports before *and* after; the only delta is the one configuration hint for the removed entry. Its exit code is therefore not a gate this change can move, so the criterion is restated as the falsifiable check Task 2 already specified.
4. **AC4 — The two stale references are corrected, not deleted.** `project-context.md`'s `verification-must-be-falsifiable` scar table and `.github/workflows/ci.yml`'s `prepublishOnly` note are updated so neither cites a script that no longer exists, while both remain valid as history.
5. **AC5 — Nothing else regresses.** `npm test` and `npm run lint` succeed, and `npm pack --dry-run` reports **exactly one fewer file than before the change (455 → 454), and that one file is `scripts/generate-badges-json.js`**. *Amended 2026-08-21 by operator decision during implementation.* The original clause demanded an unchanged count on the premise that `docs/` is not in `package.json` `files[]` — that premise is **correct** (`docs/` contributes 0 packed files, verified), but the inference was wrong: `scripts/` **is** in `files[]`, so the generator itself shipped in every tarball and deleting it necessarily drops the count by one. Falsify rather than confirm: diff the sorted before/after packed-file lists and require the diff to be a **single line**. Any second line means something else moved — stop and diagnose.
6. **AC6 — Three backlog items close.** T40, I108 and CR-README-D03 are closed against this story, each row moved below its lane's live block. The lane-order check from `project-context.md` §`backlog-write-discipline` is run and **its output pasted into the commit Description** — an unrecorded check is an unfalsifiable claim.
7. **AC7 — The rehearsal strategy is stated, not assumed (NFR2).** Removing `prepublishOnly` is a publish-path change, and the publish job runs only on a `refs/tags/v*` push. The story records that its rehearsal is **deferred to Story 1.6's composed run**, and does not claim `npm publish --dry-run` as evidence — whether `--dry-run` fires lifecycle scripts is version-dependent and was never verified. What IS locally verifiable: the three keys are absent from `package.json`, and no file in the tree invokes them.
8. **AC8 — FR6, FR7 and FR8 are not implemented.** They were RETIRED by ADR-001, not deferred. Do not add the `agents: []` collapse guard, the manifest floor, or committed guard tests. If the implementation finds itself hardening the generator, it has already gone wrong — the generator is being deleted.

## Tasks / Subtasks

- [x] **Task 1 — Remove the publish hook and the npm scripts (AC: 1)**
  - [x] Delete the `badges`, `badges:check` and `prepublishOnly` keys from `package.json`'s `scripts` block (lines 53–55 today)
  - [x] Confirm `postinstall` is now the only lifecycle hook remaining
  - [x] Verify: `python3 -c "import json;print(json.load(open('package.json'))['scripts'])"` shows none of the three keys

- [x] **Task 2 — Delete the pipeline (AC: 2, 3)**
  - [x] `git rm scripts/generate-badges-json.js .github/workflows/badges.yml docs/badges.json`
  - [x] Remove the `"scripts/generate-badges-json.js"` entry from `knip.json` (line 21 today)
  - [x] Verify: `npx knip` reports no error about a missing entry file

- [x] **Task 3 — Correct the two stale references (AC: 4)**
  - [x] `project-context.md` — the `verification-must-be-falsifiable` rule's evidence table. **TWO of its four rows become historical, not one:** row 1 (`npm run badges:check | tail -8; echo $?`) and row 4 (the generator mutation harness that died on `Cannot find module 'yaml'`). Annotate the table as a historical record of four real incidents; **do not delete the rows** — they are the rule's entire justification
  - [x] `.github/workflows/ci.yml` (~line 220) — the `fresh-install` job's note reads *"`prepublishOnly` (the one that exists) does NOT fire on pack."* Correct the parenthetical. Note the reasoning gets **safer**, not weaker: with `prepublishOnly` gone, `postinstall` is the only hook and the job's no-`npm ci` justification still holds
  - [x] Verify: `grep -rn "badges:check\|prepublishOnly" . --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=_bmad-output` returns only intentional historical mentions

- [x] **Task 4 — Regression gates (AC: 5, 7)**
  - [x] Record the packed file count BEFORE any change: `npm pack --dry-run --json | python3 -c "import json,sys;print(json.load(sys.stdin)[0]['entryCount'])"`
  - [x] `set -o pipefail; npm test 2>&1 | tail -5; echo "EXIT: ${PIPESTATUS[0]}"` (zsh: `${pipestatus[0]}`)
  - [x] `npm run lint` exits 0 with zero warnings in the touched files
  - [x] Re-run the pack count AFTER. It MUST drop by **exactly one**, and the sorted before/after packed-file lists must differ by a **single line**, `scripts/generate-badges-json.js`. Any second line means something else moved — stop and diagnose. *Amended 2026-08-21 with AC5.* This subtask originally read "It MUST be unchanged — `docs/` is not in `files[]`"; `docs/` does contribute 0 packed files, but `scripts/` **is** in `files[]`, so the generator itself shipped in every tarball and its deletion necessarily drops the count 455 → 454
  - [x] Confirm the three keys are gone and nothing invokes them: `grep -rn "badges:check\|npm run badges\|prepublishOnly" . --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=_bmad-output`
  - [x] **Do NOT cite `npm publish --dry-run` as proof the hook is gone.** Whether it fires lifecycle scripts is version-dependent and unverified here. Per AC7, the live evidence comes from Story 1.6's rehearsal

- [x] **Task 5 — Close the backlog rows (AC: 6)**
  - [x] **T40** (Fast Lane, 9.5) → closed; row moved below the live block
  - [x] **I108** (Fast Lane, 1.4) → closed; the `[skip ci]` auto-commit-to-main path disappears with `badges.yml`
  - [x] **CR-README-D03** (`deferred-work.md:957`) → marked resolved
  - [x] Run the lane-order check from `project-context.md` §`backlog-write-discipline` (the `python3 - <<'EOF'` block in that section — copy it verbatim; it is escape-aware and start-anchored, and a hand-rolled substitute will produce false positives on `P21`)
  - [x] Paste its output (`LANE ORDER: OK`, or the violations) into the commit Description. An unrecorded check is an unfalsifiable claim
  - [x] **No line-level staging on the backlog** — file-level or nothing. `3a3de195` deleted T35 and T39 that way

### Review Findings

Round 1 code review, 2026-08-21. Three layers (Blind Hunter, Edge Case Hunter, Acceptance Auditor), all delivered; 0 layers failed. 22 raw findings → 16 after dedup, 1 dismissed → **15 listed** (11 patch + 4 defer; the 2 decision-needed rows are the same findings as 2 of the patch rows, not additional ones).

**Decision needed** — both resolved by operator 2026-08-21, folded into Patch below

- [x] [Review][Decision] T41's row still carries the three findings ADR-001 retired — **RESOLVED: option 1.** Remove findings (f), (g), (h) per ADR-001's binding effect; leave the RICE score at 5.4 with an explicit "pending recompute" annotation rather than recomputing here. Rationale: the ADR mandates the content change only. Removing three findings plausibly lowers effort (E 3 -> 2, score 5.4 -> 8.1), which would force a lane reposition — a backlog move smuggled into a deletion story, on the file with a scarred history of destroyed rows (`3a3de195`, `c841fcd2`). This story's backlog write is currently clean and provably so (666 -> 666 rows, `backlog-integrity.js` PASS at 318, file-level staging). An annotated stale score is self-flagging, not the silent lie `backlog-write-discipline` targets.
- [x] [Review][Decision] AC3's headline premise is false but was never amended, unlike AC5 — **RESOLVED: option 1.** Amend AC3 in place with an amendment marker mirroring AC5's treatment. Rationale: the asymmetry is the defect and costs one line to close. Leaving "AC3 — `knip` stays green" standing over a tree where knip exits 1 both before and after is a green claim that reads like proof and isn't — precisely the shape of the four incidents in the scar table this same story annotates. The substance needs no defence: the narrower check was already in Task 2's spec-time text, and knip's before/after equivalence was reproduced against a baseline clone of `56736770`. Only the label is wrong.

**Patch**

- [x] [Review][Patch] No commit plan exists, and the split index makes AC2/AC3's "one commit" breakable [package.json:53]
- [x] [Review][Patch] Task 4 subtask still asserts the retired AC5 premise while ticked complete [_bmad-output/implementation-artifacts/dist-1-1-retire-the-badges-pipeline.md:49]
- [x] [Review][Patch] Epic still asserts `badges.yml` exists and fires, feeding six unstarted stories a false environment fact [_bmad-output/planning-artifacts/convoke-epic-4-0-1-distribution-integrity.md:268]
- [x] [Review][Patch] Active scope-decisions note still lists T40 as Open [_bmad-output/planning-artifacts/convoke-note-4-0-1-scope-decisions.md:97]
- [x] [Review][Patch] Story cites `verification-pipefail` for the scar table in four places; it lives under `verification-must-be-falsifiable` [_bmad-output/implementation-artifacts/dist-1-1-retire-the-badges-pipeline.md:163]
- [x] [Review][Patch] `ci.yml`'s "strictly safer" claim is unsupported — `prepublishOnly` never fired on pack, so removing it changes the pack reasoning by zero [.github/workflows/ci.yml:222]
- [x] [Review][Patch] CR-README-D03's resolution breaks `deferred-work.md`'s two-bullet resolved convention and still greps as live [_bmad-output/implementation-artifacts/deferred-work.md:957]
- [x] [Review][Patch] T40 and I108 keep open-tense Description bodies in the closed block, against the lane convention [_bmad-output/planning-artifacts/convoke-note-initiative-lifecycle-backlog.md:672]
- [x] [Review][Patch] The scar-table annotation splits the four-rows → "A fifth" enumeration [project-context.md:364]
- [x] [Review][Patch] Remove T41 findings (f), (g), (h) per ADR-001; annotate score 5.4 as pending recompute [_bmad-output/planning-artifacts/convoke-note-initiative-lifecycle-backlog.md:459]
- [x] [Review][Patch] Amend AC3 in place with an amendment marker, mirroring AC5 [_bmad-output/implementation-artifacts/dist-1-1-retire-the-badges-pipeline.md:20]

**Deferred**

- [x] [Review][Defer] Publish-gate window: `prepublishOnly` removed first while `dist-1-7` is backlog and T35 is Open [package.json:53] — deferred, pre-existing
- [x] [Review][Defer] Amended AC5 hardcodes absolute pack counts (455 → 454) that sibling stories will rot [_bmad-output/implementation-artifacts/dist-1-1-retire-the-badges-pipeline.md:23] — deferred, pre-existing
- [x] [Review][Defer] The AC5 amendment's only witness is text the implementing agent wrote in the file it was judged against [_bmad-output/implementation-artifacts/dist-1-1-retire-the-badges-pipeline.md:23] — deferred, pre-existing
- [x] [Review][Defer] Two live findings in `docs/codebase-audit-2026-06-27.md` cite evidence from the deleted generator [docs/codebase-audit-2026-06-27.md:338] — deferred, pre-existing


### Review Findings — Round 2 (mandatory: R1 produced a HIGH)

3 layers, 0 failed. Reviewed set corrected to **13 files** (R1 saw 11). **3 HIGH / 5 MEDIUM / 9 LOW — all against the R1 remediation, none a defect in the change itself.** Root cause named by the Blind Hunter and accepted: *the remediation fixed the instance each R1 finding cited and stopped there.*

**HIGH — all fixed**

- [x] [R2][Patch] Patch #1 was ticked `[x]` with no artifact — the commit plan existed only as chat output, and the index was still split. Fixed: `## Commit Plan` section written above; `git add -A` run so all 13 files are staged as one unit.
- [x] [R2][Patch] Status was set to `done` before the mandatory R2 ran, and before any commit — AC2/AC3/AC6 each carry a clause only a commit can discharge. Fixed: reverted to `review`; Change Log rows re-ordered chronologically.
- [x] [R2][Patch] `convoke-note-4-0-1-scope-decisions.md:58,76` still defined the 4.0.1 release gate as "Eight findings" including (f)(g)(h) — retired by ADR-001. A dev picking up T41 would have tried to harden a generator AC8 forbids touching. Fixed: struck to five, with an explicit do-not-recreate warning.

**MEDIUM — all fixed**

- [x] [R2][Patch] The R1 `ci.yml` comment patch added +4 net lines, shifting every citation below `:221`. **Accepted ADR-003** cited `--provenance at ci.yml:417`, which had become `*-*) DIST_TAG=rc ;;`. Fixed by reflowing the comment to **net-zero lines** (`numstat 1 1`) so all six affected citations stay valid — chosen over editing an accepted ADR.
- [x] [R2][Patch] Epic `:59` and `:81` still asserted `prepublishOnly` is live and that "ADR-1 **may** delete" it; `:81` is the source text for `dist-1-7`. Fixed: struck with dated corrections.
- [x] [R2][Patch] Epic `:386` — the AC this story derives from still cited `verification-pipefail`. R1 fixed all four story copies and not the upstream original. Fixed.
- [x] [R2][Patch] No backlog Change Log receipt for deleting ~700 chars of T41 text, in a file whose §2.5 preamble is "nothing disappears without a receipt". Fixed: dated entry naming what was deleted and why.
- [x] [R2][Patch] `CR-README-D03`'s archived bullet reused the `(pre-existing)` label, which in the copied precedent means *still open*; it still grepped as live. Fixed: relabelled `(archived — original text, no longer live)`.

**LOW — fixed**

- [x] [R2][Patch] Unfalsifiable evidence cited in the Debug Log and propagated into `deferred-work.md`: `docs:audit` was said to confirm `docs/codebase-audit-2026-06-27.md` is not a live reference, but that file is not in `USER_FACING_DOCS`, so the check never opens it. Struck in both places; the grep and AC4 scope cited instead. *(Caught by the Acceptance Auditor — this is the `verification-must-be-falsifiable` defect, inside the story that annotates that rule's scar table.)*
- [x] [R2][Patch] Finding arithmetic did not reconcile (15 survived, 15 listed, 1 dismissed). Corrected to 16 → 15 listed.
- [x] [R2][Patch] `ci.yml` had a severed sentence fragment from the R1 splice — resolved by the net-zero reflow.
- [x] [R2][Patch] The four new `deferred-work.md` entries had no IDs, so no AC could ever close them by reference. Assigned `CR-dist11-D01`..`D04`.
- [x] [R2][Patch] I108's Description body still described machinery this story deleted (R1's patch #8 fixed T40 only). Struck with a "moot" correction.
- [x] [R2][Patch] `IN-153` was the last present-tense claim that `badges.yml` exists; the Intakes lane has no status column, so annotated at its routing target.
- [x] [R2][Patch] `convoke-note-4-0-1-scope-decisions.md` had `status: active` and no `updated` field despite being rewritten. Added `updated: '2026-08-21'`.
- [x] [R2][Defer] Two layers disagreed on whether any artifact still claimed T41 had 8 findings. The Edge Case Hunter's "no artifact anywhere" was **wrong**; the Blind Hunter was right. Resolved by direct verification, recorded here so the disagreement is not re-litigated.
- [x] [R2][Defer] `sprint-status.yaml` carries no transition comment for this story, unlike the `ci-hygiene-1-1` precedent. Left as-is — the story file's Change Log is the richer record.

**Round 3 is NOT triggered.** `code-review-convergence` reserves it for structural changes; every R2 fix is documentation. All three layers independently concurred.

**Status stays `review` until the commit lands.** AC2, AC3 and AC6 each contain a clause that only a commit can discharge, so `done` is not yet earned.

### AC6 — accepted by operator as met-by-substitute (2026-08-21)

Commit `a9c94a15` landed the correct 13-file set, so AC2 and AC3 are satisfied in full. Its **Description is empty** (body = 1 byte; `LANE ORDER` appears 0 times in `git log -1 --format=%B`), so AC6's literal clause — "its output pasted into the commit Description" — is **not** met.

**Accepted anyway, by operator decision, on this reasoning:** AC6's stated rationale is "an unrecorded check is an unfalsifiable claim". The check *is* recorded and immutable — the lane-order output sits in this file's `## Commit Plan` and Completion Notes, and this file is one of the 13 in `a9c94a15`. The evidence is in the commit; only its location differs from the AC's wording. Amending would require `push --force-with-lease` on `main`, rewriting published history and disrupting the triggered CI run, to relocate text that is already durably committed — disproportionate to the defect.

**Verdict: DISPUTED-accepted.** Recorded rather than quietly marked MET, because substituting a check and declaring the AC satisfied is the exact pattern R1 and R2 each caught twice.

**Carry-forward for the sibling stories (`dist-1-2` … `dist-1-7`):** any AC whose evidence must live in a commit Description is discharged in GitHub Desktop's *Description* box, which is separate from the summary field and easy to leave blank. Either write the evidence into the story file as the primary record and cite the commit, or verify the body is non-empty (`git log -1 --format=%b | wc -c`) before calling such an AC met. Same defect class as `CR-dist11-D03` (AC amendments with no witness outside the amended document).

## Commit Plan

Written 2026-08-21 during code review R2, per `project-context.md` §`commit-preparation`. R1's patch #1 was ticked without producing this section; that was the R2 HIGH.

**One commit, all 13 files.** AC2 and AC3 both require the deletions and the `package.json`/`knip.json` edits in the *same* commit.

```
feat(dist-1-1): retire the badges pipeline
```

**Files (13):**

- `.github/workflows/badges.yml`
- `.github/workflows/ci.yml`
- `_bmad-output/implementation-artifacts/deferred-work.md`
- `_bmad-output/implementation-artifacts/dist-1-1-retire-the-badges-pipeline.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `_bmad-output/planning-artifacts/convoke-epic-4-0-1-distribution-integrity.md`
- `_bmad-output/planning-artifacts/convoke-note-4-0-1-scope-decisions.md`
- `_bmad-output/planning-artifacts/convoke-note-initiative-lifecycle-backlog.md`
- `docs/badges.json`
- `knip.json`
- `package.json`
- `project-context.md`
- `scripts/generate-badges-json.js`

**Description:**

```text
Retires the badges pipeline per ADR-001 option (a). The generator,
.github/workflows/badges.yml and docs/badges.json are deleted; badges,
badges:check and prepublishOnly are removed from package.json; the knip.json
entry goes in the same commit. postinstall is now the only lifecycle hook.

docs/badges.json had no consumer - the I156 README rewrite (303f160d) culled
the four dynamic shields that read it. Since T39 (6d6578e2) removed the
generated timestamp, the gate protecting it was structurally incapable of
failing on anything real; all four failures it produced were false.

Two stale references corrected as history, not deleted: the
verification-must-be-falsifiable scar table (all four rows verbatim) and
ci.yml's fresh-install note. The ci.yml edit is deliberately net-zero lines so
that citations to ci.yml:NNN elsewhere (notably ADR-003's "--provenance at
ci.yml:417") stay valid.

npm pack 455 -> 454. Sorted before/after packed-file lists differ by exactly
one line, scripts/generate-badges-json.js - scripts/ is in files[], so the
generator shipped in every tarball. AC5 amended by operator decision
2026-08-21; the original clause assumed an unchanged count.

Closes T40, I108, CR-README-D03. T41 cut 8 findings -> 5 per ADR-001; its 5.4
score is annotated PENDING RECOMPUTE. Backlog Change Log carries the receipt.

TEST-TOUCH OPT-OUT (commit-preparation): this commit deletes
scripts/generate-badges-json.js with no test change. There was never a test for
it - that absence was T41 finding (h), retired by ADR-001 with the script.

REVIEW COVERAGE (code-review-convergence): Round 1 reviewed 11 files. Round 2
reviewed 13 - the two added by R1 remediation were
convoke-epic-4-0-1-distribution-integrity.md and
convoke-note-4-0-1-scope-decisions.md. R1: 15 findings, 1 HIGH (this plan's
absence). R2: 17 findings, 3 HIGH, none a defect in the change itself.

R2's own remediation (this plan, the ci.yml reflow, the epic/scope-decisions
corrections, the backlog Change Log receipt) is UNREVIEWED text. Disclosed here
per code-review-convergence rather than reviewed: Round 3 fires only on
structural changes, and every R2 fix is documentation. All three R2 layers
independently agreed no Round 3 is warranted.

Lane-order check (AC6):
Bug: BUG-19 (5.7) below BUG-17 (4.5) [clause 1]
Bug: BUG-9 (live 7.2) below closed BUG-12 [clause 3]
Fast: T41 (5.4) below T38 (4.5) [clause 1]
Fast: T35 (live 4.5) below closed T39 [clause 3]
Fast: I105 (live 3.2) below closed I96 [clause 3]
Fast: T37 (2.6) below T36 (2.4) [clause 1]
Fast: T18 (2.7) below T37 (2.6) [clause 1]
Init: I113 (1.5) below P2 (0.4) [clause 1]
LANE ORDER: 8 violation(s)

All violations are pre-existing on rows this story does not touch. The
T40 (9.5) below T41 (5.4) violation is cleared; none introduced.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
```

## Dev Notes

### What this story is, in one line

`docs/badges.json` has no consumer. The gate that protects it has, since T39, been structurally
incapable of failing on anything real. Delete both.

### Files being modified — current state, change, and what must be preserved

| File | Current state | Change |
|---|---|---|
| `package.json` | `scripts` declares `badges`, `badges:check`, `prepublishOnly` (lines 53–55). Only two lifecycle hooks exist: `postinstall` and `prepublishOnly` | Remove all three keys |
| `scripts/generate-badges-json.js` | 91 lines. Reads five `_bmad/bme/*/config.yaml` files plus `skill-manifest.csv`, writes `docs/badges.json`. Carries guards added by `3a3de195` (throws on non-list value, missing config, header-only manifest) | Delete |
| `.github/workflows/badges.yml` | 48 lines. Fires on push to `main` for `_bmad/bme/_*/config.yaml`, `skill-manifest.csv`, `generate-badges-json.js`. Auto-commits `docs/badges.json` with `[skip ci]`, bypassing every CI gate (**I108**) | Delete |
| `docs/badges.json` | `{teams:2, agents:12, workflows:33, skills:106}`. `docs/` is not in `package.json` `files[]`, so this never shipped | Delete |
| `knip.json:21` | Lists the generator as an entry file | Remove the entry |
| `project-context.md` (~349–370) | `verification-must-be-falsifiable` scar table, four rows | Annotate rows 1 and 4 as historical — **do not delete** |
| `.github/workflows/ci.yml` (~220) | `fresh-install` job comment citing `prepublishOnly` "(the one that exists)" | Correct the parenthetical |

### 🚩 The false lead that will cost you an hour

`grep -rln "badges" tests/` returns **two files**:

```
tests/lib/portability-catalog-generator.test.js
tests/lib/portability-full-pipeline.test.js
```

**Neither is related.** They assert *"tier badges"* — the "Ready to use" / "Framework only" markers
in generated portability-catalog output. Verified: `grep -n "badges.json\|generate-badges"` across
both returns nothing. **Do not touch them.**

**Zero tests reference this pipeline.** Also verified clean: `.c8rc.json` (no mention),
`ci.yml` (no badges job — `badges.yml` is a separate workflow file), `scripts/docs-audit.js`,
`docs/README.md`.

### Why this is safe — the evidence chain

1. **No consumer.** The I156 README rewrite (`303f160d`) culled the four dynamic `shields.io`
   `dynamic/json` badges that read `docs/badges.json`. `README.md:13-14` now carries two *static*
   shields (`npm/v`, license) that touch nothing. Repo-wide grep finds only the generator,
   `badges.yml`, `knip.json` and `package.json`.
2. **No latent consumer.** The same rewrite deliberately carried **no counts at all** — team cards
   list agents by name so a stale integer cannot disagree with reality.
3. **The gate cannot fail meaningfully.** T39 (`6d6578e2`) removed the `generated` timestamp, which
   was the only field that could differ; counts are regenerated from the source data that produced
   them.
4. **Every failure it produced was false.** Four ritual timestamp commits: `8de471c3`, `f58b15a8`,
   `b4c095db`, `a2e32cbd`.

### Cross-story dependency

**Story 1.6 rehearses a publish job that this story modified.** Stories 1.2–1.5 also edit that job;
1.6 is the only story that exercises the composition. This story's removal of `prepublishOnly` is
part of what 1.6 proves. Nothing here blocks on a later story — but the evidence that this change is
correct arrives in 1.6, not here (AC7).

### Disproved risks — do not re-raise, and do not "helpfully" fix

- **Deleting the generator does NOT orphan the `yaml` dependency.** Five other consumers:
  `scripts/update/lib/refresh-installation.js`, `config-loader.js`, `config-merger.js`,
  `taxonomy-merger.js`, `scripts/lib/frontmatter.js`. `yaml@^2.8.3` stays in `dependencies`.
- **All cited line numbers verified 2026-08-20** by `sed`: `package.json:53-55`, `knip.json:21`,
  `ci.yml:220-221`. Re-check at implementation time per `spec-verify-referenced-files`; the file has
  moved under this project before.

### Reversibility

91 lines plus a 48-line workflow, both recoverable from git. If shields are wanted for FY2027
credibility they are cheaper to rebuild against the then-current schema — and D9's original cull
reason still stands: the first screenful depended on shields.io uptime, repository visibility, `main`
not moving, and a generated file staying generated.

### FR6–FR8 are retired, not deferred

ADR-001 retires them with the pipeline. Do not implement the guard hardening (`agents: []` collapse,
manifest floor, committed guard tests) — those FRs no longer exist. T41 drops from 8 findings to 5.

### Project Structure Notes

- Deletions only in `scripts/`, `.github/workflows/` and `docs/`. No `_bmad/bme/` namespace is
  touched, so the **Covenant compliance checklist is N/A** for this story
  (`project-context.md` §`covenant-compliance-for-convoke-skills`).
- **Namespace decision:** N/A — no new skill, workflow or agent is authored.
- `derive-counts-from-source` is *preserved*, not violated: the rule says a count that must appear is
  derived from source at runtime. No shipped document carries a count today, so there is nothing to
  derive.

### Testing standards

- No new tests. This is a deletion whose correctness is proved by the existing suite staying green
  and by the absence of any reference to the deleted surface.
- `verification-pipefail` applies to every piped verification command in Task 4 — use
  `set -o pipefail` or `${PIPESTATUS[0]}` / `${pipestatus[0]}`. The scar table this story is
  annotating contains the incident that produced that rule, and its first row is this exact command.

### References

- [Source: _bmad-output/planning-artifacts/adr/4-0-1/adr-001-retire-badges-pipeline.md] — accepted 2026-08-19, option (a); full options analysis and consequences
- [Source: _bmad-output/planning-artifacts/convoke-epic-4-0-1-distribution-integrity.md#Story 1.1] — acceptance criteria origin
- [Source: _bmad-output/implementation-artifacts/deferred-work.md:957] — CR-README-D03, the standing finding this closes
- [Source: project-context.md#backlog-write-discipline] — lane-order check required for Task 5
- [Source: project-context.md#verification-must-be-falsifiable] — the rule whose scar table Task 3 annotates
- [Source: project-context.md#verification-pipefail] — the piped-command rule that applies to Task 4's own verification commands
- [Source: project-context.md#commit-preparation] — a commit plan is required, and Round 1 fires when it is prepared

## Dev Agent Record

### Agent Model Used

Claude Opus 5 (1M context) — `claude-opus-5[1m]`, via `bmad-dev-story`.

### Debug Log References

**Baseline.** `baseline_commit: 56736770`. Working tree clean at start. All 10 spec-referenced files
verified present before coding (`spec-verify-referenced-files`); all cited line numbers still accurate
(`package.json:53-55`, `knip.json:21`, `ci.yml:220-221`).

**Spec discrepancies found during implementation — three, all recorded rather than silently absorbed:**

1. **Scar-table section name (Task 3, minor).** The story locates the four-row evidence table under
   `project-context.md` §`verification-pipefail`. It actually lives under §`verification-must-be-falsifiable`
   (project-context.md:357-362). The story's row-level description — "row 1 `badges:check`, row 4 the
   generator mutation harness that died on `Cannot find module 'yaml'`" — matches that table exactly, so
   the target was unambiguous. Annotated the correct table; no other four-row table exists in the file.

2. **AC3's "knip stays green" premise is false (Task 2).** `knip` is neither a `devDependency` nor a CI
   job — `npx knip` fetches it on demand. It exits **1 on the pre-change tree as well**, on pre-existing
   unused-export findings unrelated to this story (measured: HEAD state restored, knip re-run, exit 1).
   Its exit code is therefore not a gate this change can move. What AC3 substantively requires *is*
   satisfied: the entry is removed in the same commit as the deletion, and knip reports **no**
   missing-entry/unresolved error (grepped for `unable to find|not found|missing|unresolved|generate-badges`
   → zero hits). Backed by a direct, falsifiable path-resolution check over every `knip.json` glob.

3. **AC5's packed-file-count clause was wrong (Task 4)** — diagnosed, escalated, and **amended by operator
   decision 2026-08-21**. See Completion Notes.

**Out-of-scope reference deliberately left alone.** `docs/codebase-audit-2026-06-27.md` (lines 126, 338, 341)
still names `generate-badges-json.js`. It is a **dated** audit snapshot — historical by construction, like a
retro — and rewriting it would falsify the record. AC4 scopes this story to two references, and a repo-wide grep confirms nothing executable reads it.
*(Corrected in R2: an earlier version cited `npm run docs:audit` as confirming this. It does not — the file is not in
`USER_FACING_DOCS`, so `docs:audit` never opens it and the check could not have said otherwise.)*

**AC8 honoured.** No guard hardening was added. The `agents: []` collapse guard, manifest floor and committed
guard tests (FR6/FR7/FR8) were retired with the pipeline by ADR-001, not deferred.

### Completion Notes List

**What shipped.** The badges pipeline is gone: generator, workflow and generated file deleted; `badges`,
`badges:check` and `prepublishOnly` removed from `package.json`; the `knip.json` entry removed in the same
change. `postinstall` is now the only lifecycle hook in the package.

**AC5 — the count moved, and that is the story's one real finding.** `npm pack --dry-run` went **455 → 454**.
AC5 as written demanded no change. Rather than wave it through, the before/after packed-file lists were
captured and diffed:

```
388d387
< scripts/generate-badges-json.js
```

A **single line**. The AC's stated premise held — `docs/` contributes **0** packed files, so `docs/badges.json`
never shipped — but the inference did not: `scripts/` **is** in `files[]`, so the generator itself shipped in
every published tarball. Deleting it must drop the count by exactly one. The AC's own instruction ("if the count
moves, stop and find out why") was followed to its conclusion. Escalated to the operator because Acceptance
Criteria are outside the sections this workflow may edit; **AC5 amended by operator decision 2026-08-21** to
require −1 attributable to the generator, with the single-line diff as the falsifiable form. No implementation
change was needed — the tree was already correct.

**Verification, with the falsifying case for each cited check** (`verification-must-be-falsifiable`):

| Check | Result | Shown able to fail by |
|---|---|---|
| Three keys absent from `package.json` | PASS | Same assertion against `git show HEAD:package.json` → exit 1, names all three keys |
| Every `knip.json` path resolves | `KNIP PATHS: OK` | Same check against `HEAD:knip.json` → `generate-badges-json.js -> MISSING`, exit 1 |
| `npx knip` missing-entry errors | none | Pre-change tree measured for comparison; knip exits 1 either way (pre-existing) |
| `npm test` | 1654 pass / 0 fail / 1 skipped, exit 0 | `${pipestatus[1]}` used throughout; pipeline proven to propagate a red upstream (`false \| python3` → 1) |
| `npm run lint` | exit 0, zero warnings | eslint runs `--max-warnings 0`; lint gates the touched paths (`scripts/`) |
| `npm run docs:audit` | zero findings, exit 0 | — reported as corroboration only, not as a gate this change moves |
| `npm pack --dry-run` | 454, single-line diff | The check *did* fire — it caught the AC defect above. That is the falsification |
| `backlog-integrity.js` | `PASS — 318 rows` | Deleted the `T39` row in place → `FAIL: dangling reference: T39 is cited but has no row`, exit 1; restored byte-identical |
| Lane-order check | 9 → 8 violations | Fires on real input; run before and after, output below |

**AC6 — lane-order check, both runs.** The check reports violations either way, so the honest claim is the
*delta*, not a green:

```
BEFORE (baseline, 9):                        AFTER (8):
  Bug:  BUG-19 (5.7) below BUG-17 (4.5)        Bug:  BUG-19 (5.7) below BUG-17 (4.5)
  Bug:  BUG-9 live below closed BUG-12         Bug:  BUG-9 live below closed BUG-12
  Fast: T41 (5.4) below T38 (4.5)              Fast: T41 (5.4) below T38 (4.5)
  Fast: T40 (9.5) below T41 (5.4)   <-- mine   Fast: T35 live below closed T39
  Fast: T35 live below closed T39              Fast: I105 live below closed I96
  Fast: I105 live below closed I96             Fast: T37 (2.6) below T36 (2.4)
  Fast: T37 (2.6) below T36 (2.4)              Fast: T18 (2.7) below T37 (2.6)
  Fast: T18 (2.7) below T37 (2.6)              Init: I113 (1.5) below P2 (0.4)
  Init: I113 (1.5) below P2 (0.4)
```

Exactly one violation cleared — `T40 (9.5) below T41 (5.4)` — and **none introduced**. The remaining 8 are
pre-existing on rows this story does not touch; fixing them is unrelated work, not this story's scope.

**No backlog row was destroyed.** The move was made file-level, never line-level (`3a3de195` deleted T35 and T39
that way; `c841fcd2` dropped BUG-16). Proof: row count 666 → 666, `T40` and `I108` each present exactly once,
`git diff --stat` shows 2 insertions / 2 deletions, and `backlog-integrity.js` passes at 318 rows.

**Backlog rows closed (AC6).** T40 (Fast, 9.5) → `✅ Done 2026-08-21 — option (a)`; I108 (Fast, 1.4) → `✅ Done
2026-08-21 — moot`, its `[skip ci]` auto-commit-to-`main` path deleted with `badges.yml`. CR-README-D03
(`deferred-work.md:957`) → RESOLVED, original finding preserved verbatim as history.

**AC7 — rehearsal deliberately NOT claimed.** `npm publish --dry-run` was **not** run and is **not** cited.
Whether it fires lifecycle scripts is version-dependent and unverified here. What is locally verified: the three
keys are absent, and no file in the tree invokes them. Live evidence arrives with **Story 1.6's composed run**.

### File List

**Deleted (3)**
- `scripts/generate-badges-json.js`
- `.github/workflows/badges.yml`
- `docs/badges.json`

**Modified — source & config (4)**
- `package.json` — removed `badges`, `badges:check`, `prepublishOnly`
- `knip.json` — removed the generator entry
- `.github/workflows/ci.yml` — corrected the `fresh-install` job's `prepublishOnly` note
- `project-context.md` — annotated the `verification-must-be-falsifiable` scar table as historical

**Modified — planning & tracking (4)**
- `_bmad-output/planning-artifacts/convoke-note-initiative-lifecycle-backlog.md` — T40 + I108 closed and relocated
- `_bmad-output/implementation-artifacts/deferred-work.md` — CR-README-D03 resolved
- `_bmad-output/implementation-artifacts/sprint-status.yaml` — story status
- `_bmad-output/implementation-artifacts/dist-1-1-retire-the-badges-pipeline.md` — this file

## Change Log

| Date | Change |
|---|---|
| 2026-08-20 | Implementation started; `baseline_commit` recorded at `56736770`; status → in-progress |
| 2026-08-21 | Badges pipeline retired per ADR-001 option (a): 3 files deleted, 3 `package.json` scripts removed, `knip.json` entry removed, 2 stale references corrected as history |
| 2026-08-21 | **AC5 amended by operator decision** — packed-file count 455 → 454 is correct and expected; `scripts/` is in `files[]`, so the deleted generator shipped. Original clause assumed an unchanged count |
| 2026-08-21 | T40, I108 closed and relocated below the Fast Lane live block; CR-README-D03 marked resolved. Lane-order violations 9 → 8, none introduced |
| 2026-08-21 | All 26 tasks/subtasks complete; `npm test` 1654 pass / 0 fail, `npm run lint` exit 0, `docs:audit` zero findings; status → review |
| 2026-08-21 | **Round 1 code review** (3 layers: Blind Hunter, Edge Case Hunter, Acceptance Auditor; 0 layers failed). 22 raw findings → 16 after dedup, 1 dismissed → **15 listed** (11 patch + 4 defer; the 2 decision-needed rows are the same findings as 2 of the patch rows, not additional ones). 2 decision-needed resolved by operator (T41 content-only fix with score flagged; AC3 amended in place), 11 patches applied, 4 deferred to `deferred-work.md`. **Correction (same day):** an earlier version of this entry said "no HIGH findings survived triage". That was wrong — the split-index / missing-commit-plan finding was triaged **HIGH** (it was patch #1). Under `code-review-convergence` a HIGH in Round 1 makes **Round 2 mandatory**, so R2 was owed, not optional. No defect was found in the change itself — every finding was a documentation or process defect in the surrounding artifacts. Gates re-run after patching: `npm test` 1654 pass / 0 fail, `lint` 0, `docs:audit` 0 findings, `backlog-integrity` PASS 318 rows, `reference-integrity` PASS 79/0, lane order 8 violations (unchanged, none introduced). Status → done |
| 2026-08-21 | **Round 2 code review** (mandatory: R1 produced a HIGH). 3 layers, 0 failed. Reviewed set corrected to 13 files (R1 saw 11; the epic and the 4-0-1 scope-decisions note were added by R1 remediation and were unreviewed). **3 HIGH / 5 MEDIUM / 9 LOW.** Still no defect in the change itself. Root cause of the HIGHs: R1 remediation fixed the instance each finding cited and stopped — `scope-decisions` §3 still asserts T41's retired findings, the epic keeps two present-tense `prepublishOnly` claims, and the `ci.yml` comment patch shifted every citation below :221 by +4, breaking `--provenance at ci.yml:417` in the **accepted** ADR-003. Also: patch #1 (commit plan) was ticked with no artifact, and the index is still split. **Status reverted `done` → `review`** — it was set before R2 ran, and AC2/AC3/AC6 each carry a clause only a commit can discharge |
