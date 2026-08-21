---
baseline_commit: 8245645671fe77bc0075d5ac58ce53df56a3055e
---

# Story 1.2: Strip build metadata before the prerelease test

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **Convoke operator**,
I want a stable release to reach `latest` even when its version carries build metadata,
so that a release I am meant to receive is not parked on `rc` where I never see it.

## Acceptance Criteria

1. **AC1 — Build metadata no longer routes a stable release to `rc`.** Given `VERSION=4.0.0+sha.5114f85-dirty`, when the publish job derives `DIST_TAG`, it resolves `latest` — the `+` suffix is stripped before the hyphen test.
2. **AC2 — A genuine prerelease still routes to `rc`.** Given `VERSION=4.1.0-rc.1`, when the job derives `DIST_TAG`, it resolves `rc`.
3. **AC3 — The rehearsal strategy is recorded, with local reproduction (NFR2).** The story records the local reproduction of the derivation across **all four cases** — stable, stable+metadata, prerelease, prerelease+metadata — requiring no tag push. Per NFR2, local reproduction of the expression is required *before the change lands*, because the job runs only on a `refs/tags/v*` push and a wrong edit costs a tag delete-and-repush.
4. **AC4 — Scope is one line.** The only change to `.github/workflows/ci.yml` is the `case` subject on line 412. Do **not** touch the `npm publish` line, the `--loglevel verbose` flag, the `NODE_AUTH_TOKEN` comment block, or any other FR's territory (FR2 npm-version floor, FR3 tag/version agreement, FR4 auth loudness, FR5 downgrade guard). Those are Stories 1.3–1.5 and each gets its own rehearsal.
5. **AC5 — Line count must not change.** The edit is a substitution on one existing line. `git diff HEAD --numstat -- .github/workflows/ci.yml` MUST report `1 1`. **This is not cosmetic:** `ADR-003` cites `--provenance at ci.yml:417` (twice, at `:43` and `:134`) and is **ACCEPTED** — it is the spec source for Story 1.7. Story 1.1's code review found that a +4-line comment edit silently invalidated that citation and five others. Verify with the numstat check, not by eye.
6. **AC6 — NFR1's exemption unlocks on this story alone.** The story records that, with FR1 landed, a prerelease tag provably routes to `rc`, so prerelease tags become permitted from this point (NFR1 EXEMPTION). Do **not** state or imply that FR5 is also required — an earlier epic draft said so and was corrected: FR5 guards a *downgrade of `latest`*, and a prerelease never touches `latest`.

## Tasks / Subtasks

- [ ] **Task 1 — Reproduce the defect locally BEFORE editing (AC: 3)**
  - [ ] Run the derivation as it exists today against all four cases and capture the output. The bug must be *seen*, not assumed:
    ```bash
    bash -c 'for V in "4.0.0" "4.0.0+sha.5114f85-dirty" "4.1.0-rc.1" "4.1.0-rc.1+build.5"; do
      case "$V" in *-*) T=rc ;; *) T=latest ;; esac; printf "%-28s -> %s\n" "$V" "$T"; done'
    ```
  - [ ] Confirm `4.0.0+sha.5114f85-dirty -> rc` (the defect) and `4.0.0 -> latest` (the control). If the defect does not reproduce, **stop** — the premise is wrong and the story needs re-scoping

- [ ] **Task 2 — Apply the one-line fix (AC: 1, 2, 4, 5)**
  - [ ] `.github/workflows/ci.yml:412` — change the `case` subject from `"$VERSION"` to `"${VERSION%%+*}"`. The line becomes:
    ```
              case "${VERSION%%+*}" in
    ```
  - [ ] Change **nothing else** on lines 410–417
  - [ ] Verify: `git diff HEAD --numstat -- .github/workflows/ci.yml` reports exactly `1	1`
  - [ ] Verify: `sed -n '417p' .github/workflows/ci.yml` still prints the `npm publish --provenance …` line (ADR-003's citation target)

- [ ] **Task 3 — Prove the fix across all four cases (AC: 1, 2, 3)**
  - [ ] Re-run the harness with the fixed expression and capture before/after side by side:
    ```bash
    bash -c 'for V in "4.0.0" "4.0.0+sha.5114f85-dirty" "4.0.0+2026-08-17" "4.1.0-rc.1" "4.1.0-rc.1+build.5"; do
      case "$V" in *-*) C=rc ;; *) C=latest ;; esac
      case "${V%%+*}" in *-*) F=rc ;; *) F=latest ;; esac
      printf "%-28s current=%-7s fixed=%s\n" "$V" "$C" "$F"; done'
    ```
  - [ ] Paste the table into Completion Notes. Expected: the two `+metadata` stable cases flip `rc → latest`; the two prerelease cases stay `rc`; plain `4.0.0` stays `latest`
  - [ ] **Falsify the harness itself** (`verification-must-be-falsifiable`): confirm it can report a failure by running it against a deliberately wrong expression (e.g. `${V%%-*}`, which should mis-route `4.1.0-rc.1` to `latest`). A harness that only ever prints the expected answer is not evidence
  - [ ] Use `bash -c`, not the interactive shell — the job runs under bash. `${V%%+*}` behaves identically in zsh, but the gate is bash

- [ ] **Task 4 — Regression gates (AC: 4, 5)**
  - [ ] `python3 -c "import yaml;yaml.safe_load(open('.github/workflows/ci.yml'));print('OK')"` — the file still parses
  - [ ] `set -o pipefail; npm test 2>&1 | tail -5; echo "EXIT: ${PIPESTATUS[0]}"` (zsh: `${pipestatus[0]}`) — no test reads this workflow, so this is a no-regression check, not a gate this change can move. Say so rather than citing it as proof
  - [ ] `npm run lint` exits 0
  - [ ] Confirm no other job, `needs:`, or `if:` was touched: `git diff HEAD -- .github/workflows/ci.yml` shows exactly one changed line

- [ ] **Task 5 — Record the rehearsal strategy and the NFR1 unlock (AC: 3, 6)**
  - [ ] State explicitly: this change is **locally reproducible in full** — the derivation is a pure shell expression with no network, no registry and no tag. Unlike Story 1.1, there is nothing deferred to a live run
  - [ ] Record that FR1 landing activates NFR1's EXEMPTION: prerelease tags are permitted from this point, because a prerelease now provably routes to `rc`
  - [ ] Do **not** claim this unblocks a *stable* tag. It does not — FR2, FR3, FR4, FR5 and FR9 are still open, and NFR1's bar for a tag that could reach `latest` is unchanged
  - [ ] Do **not** cite a live publish as evidence. No tag is pushed by this story

- [ ] **Task 6 — Close the backlog reference (AC: 1)**
  - [ ] **T41 finding (a)** is what this story fixes. Do **not** close T41 — findings (b), (c), (d), (e) remain open and are Stories 1.3–1.5. Strike **only** (a), marking it shipped by `dist-1-2`
  - [ ] T41 sits at `convoke-note-initiative-lifecycle-backlog.md`, directly after T33 in §2.3 (repositioned 2026-08-21). Its score is `E3 / 5.4`, re-affirmed 2026-08-21 — **do not recompute it** for a single finding; the four-HIGH rehearsal cost that priced E3 still applies to (b)(c)(d)
  - [ ] Add a Change Log receipt to the backlog naming what changed (§2.5: "nothing disappears without a receipt")
  - [ ] Run the lane-order check from `project-context.md` §`backlog-write-discipline` verbatim; paste output. Baseline is **7 violations** — none on T41
  - [ ] `node scripts/audit/backlog-integrity.js` must PASS. **No line-level staging on the backlog** — file-level or nothing

- [ ] **Task 7 — Prepare the commit plan (AC: all)**
  - [ ] Write a `## Commit Plan` section **into this story file** before requesting review. Story 1.1's R2 HIGH was a commit plan that existed only as chat output and was ticked `[x]` anyway — an artifact that is not in the tree does not exist
  - [ ] Name every file in one commit; `git add -A` so the index matches the plan
  - [ ] Include the lane-order output, and a **test-touch opt-out**: this change edits a CI workflow with no test change. There is no test harness for `ci.yml` shell expressions; the four-case reproduction is the evidence. State this explicitly per `commit-preparation`
  - [ ] **GitHub Desktop's Description box is separate from the summary field.** Story 1.1's AC6 was left undischarged because it was submitted empty. Verify with `git log -1 --format=%b | wc -c` after committing

## Dev Notes

### What this story is, in one line

`case "$VERSION"` tests the raw version string for a hyphen. SemVer build metadata (`+sha.5114f85-dirty`) can contain a hyphen. Strip it first.

### The file being modified — current state, change, what must be preserved

`.github/workflows/ci.yml`, the `Publish to npm` step, lines **410–417** (verified 2026-08-21 at `82456456`):

```yaml
      - name: Publish to npm
        run: |
          VERSION=$(node -p "require('./package.json').version")
          case "$VERSION" in
            *-*) DIST_TAG=rc ;;
            *)   DIST_TAG=latest ;;
          esac
          echo "Publishing $VERSION to dist-tag $DIST_TAG"
          npm publish --provenance --access public --tag "$DIST_TAG" --loglevel verbose
```

| Line | Current | Change |
|---|---|---|
| 411 | `VERSION=$(node -p …)` | **preserve** |
| 412 | `case "$VERSION" in` | → `case "${VERSION%%+*}" in` |
| 413-414 | `*-*) DIST_TAG=rc` / `*) DIST_TAG=latest` | **preserve** |
| 416 | `echo "Publishing $VERSION …"` | **preserve** — it must echo the FULL version, not the stripped one. The operator needs to see what is actually being published |
| 417 | `npm publish --provenance …` | **preserve** — ADR-003 cites this exact line number |

**`$VERSION` stays intact.** Only the `case` *subject* is stripped. Do not reassign `VERSION`; do not add a second variable unless you keep the line count at 1-for-1 (you cannot — so don't).

### Why `${VERSION%%+*}` and not something else

`${VAR%%pattern}` removes the **longest** matching suffix. Pattern `+*` matches a literal `+` followed by anything, so everything from the *first* `+` onward is removed. SemVer permits exactly one `+`, so longest and shortest are equivalent here — `%%` is chosen because it is unambiguous if a malformed version ever carries two.

Rejected alternatives:
- `${VERSION%+*}` — shortest match; identical for valid SemVer, wrong for malformed input
- `${VERSION//+*/}` — bash-only, and no clearer
- A `node -p` semver parse — adds a process and a dependency to the publish path for a string operation. The epic prices this story as "one line, locally testable"; a parser is a different story

**Portability:** `${VAR%%pattern}` is POSIX parameter expansion — works in `sh`, `bash`, `zsh`. The job has no `shell:` key, so it uses the runner default (`bash -e`). Safe.

### Verified reproduction (run 2026-08-21 during story creation, at `82456456`)

```
case                                | current | fixed
4.0.0                               | latest  | latest
4.0.0+sha.5114f85-dirty             | rc      | latest   <- the defect
4.0.0+2026-08-17                    | rc      | latest   <- the defect
4.1.0-rc.1                          | rc      | rc
4.1.0-rc.1+build.5                  | rc      | rc
```

**The fix is confirmed working before this story was written.** Re-run it anyway per AC3 and Task 1 — the point of NFR2 is that the *implementer* reproduces it, not that someone once did. Note `4.0.0+2026-08-17` is the real case from T41: the epic itself recorded that 4.0.0 as published carries no provenance attestation, and dated build metadata is how that gets fixed.

### 🚩 The false lead

`grep -rn "DIST_TAG" .` returns hits in `_bmad-output/` planning artifacts, ADR-003 and the epic. **None is code.** There is exactly one executable occurrence — `ci.yml:412-417`. Do not "fix" the prose in the ADRs; they are dated decision records and rewriting them falsifies the record (same reasoning Story 1.1 applied to the scar table).

### Line-number fragility — read this before editing

`ci.yml` line numbers are cited by **eight** artifacts, including the **accepted** ADR-003. Story 1.1's code review (R2) found that a +4-line comment edit shifted every citation below `:221` and broke `--provenance at ci.yml:417` in ADR-003, the spec source for Story 1.7. It was fixed by reflowing to net-zero rather than editing an accepted ADR.

**This story's edit is at line 412 — below `:221` and above `:417`.** A net line change here breaks the same citation. AC5 exists for this. `numstat` must read `1	1`.

### Cross-story dependencies

- **Unblocks Story 1.7 (FR19 rehearsal)** via NFR1's EXEMPTION — but only for *prerelease* tags. This is the story the exemption depends on, alone.
- **Does not depend on anything.** Story 1.1 is `done` and committed (`a9c94a15`). Nothing in 1.1's change touches the derivation.
- **Stories 1.3, 1.4, 1.5 edit the same ~20 lines.** They are sequenced deliberately so each gets one isolated rehearsal. Do not merge their work in — AC4.
- **Story 1.6** composes all of them and is the only story that exercises the composition.

### Disproved risks — do not re-raise

- **This does not affect the `4.0.0` already on npm.** That is published and immutable; `npm view convoke-agents version` → `4.0.0`, on `latest`. This story changes only how a *future* tagged publish derives its dist-tag.
- **This does not weaken the prerelease guard.** `4.1.0-rc.1` and `4.1.0-rc.1+build.5` both still resolve `rc` — verified above. The change makes the test *more* precise, not more permissive.
- **`echo "Publishing $VERSION …"` is intentionally unstripped.** It reports what is published. Stripping it would hide build metadata from the operator reading the job log.

### Project Structure Notes

- Only `.github/workflows/ci.yml` and the backlog are touched. No `_bmad/bme/` namespace, so the **Covenant compliance checklist is N/A** (`project-context.md` §`covenant-compliance-for-convoke-skills`).
- **Namespace decision:** N/A — no new skill, workflow or agent is authored.

### Testing standards

- **No new tests, and no test harness exists for `ci.yml` shell expressions.** The evidence is the four-case local reproduction (AC3), which is stronger than a unit test here because it runs the actual expression under the actual shell.
- `verification-must-be-falsifiable` applies: Task 3 requires showing the harness can report a wrong answer. This story is one `case` statement — a harness that always prints the expected result would be indistinguishable from a correct fix.
- `verification-pipefail` applies to every piped command in Task 4.

### References

- [Source: _bmad-output/planning-artifacts/convoke-epic-4-0-1-distribution-integrity.md#Story 1.2] — acceptance criteria origin
- [Source: _bmad-output/planning-artifacts/convoke-epic-4-0-1-distribution-integrity.md:96-97] — FR1
- [Source: _bmad-output/planning-artifacts/convoke-epic-4-0-1-distribution-integrity.md:227-237] — NFR1 and its EXEMPTION (depends on FR1 alone)
- [Source: _bmad-output/planning-artifacts/convoke-epic-4-0-1-distribution-integrity.md:238-245] — NFR2 rehearsal-strategy enforcement
- [Source: _bmad-output/planning-artifacts/adr/4-0-1/adr-003-publish-path-enforcement.md:43] — the `ci.yml:417` citation AC5 protects
- [Source: _bmad-output/planning-artifacts/convoke-note-initiative-lifecycle-backlog.md] — T41 finding (a), the origin of FR1
- [Source: _bmad-output/implementation-artifacts/dist-1-1-retire-the-badges-pipeline.md] — previous story; see its R2 findings for the commit-plan and line-drift traps
- [Source: project-context.md#verification-must-be-falsifiable] — Task 3's harness-falsification requirement
- [Source: project-context.md#backlog-write-discipline] — lane-order check for Task 6
- [Source: project-context.md#commit-preparation] — commit plan required; Round 1 review fires when it is prepared
- [Source: project-context.md#code-review-convergence] — reviewed set must equal committed set

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List

## Change Log

| Date | Change |
|---|---|
| 2026-08-21 | Story created by `bmad-create-story`. Fix verified working across all five derivation cases at story-creation time; `baseline_commit` recorded at `82456456`. Carries three traps surfaced by Story 1.1's R1+R2 code review: the commit plan must be a real artifact (R2 HIGH), the `ci.yml` edit must be net-zero lines or it breaks ADR-003's citation (R2 MEDIUM), and GitHub Desktop's Description box must be non-empty or the AC requiring it goes undischarged (R2 DISPUTED-accepted) |
