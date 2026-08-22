# Story 1.4: Fail when the tag and the version disagree

Status: ready-for-dev

<!-- baseline_commit deliberately ABSENT — it is `dev-story`'s field, stamped at implementation
     start. Pre-stamping it in dist-1-2 caused a rule deviation the operator had to ratify. -->

## Story

As a **Convoke operator**,
I want the tag I see on GitHub to name the version I get from npm,
so that a release is identifiable from either side.

## Acceptance Criteria

1. **AC1 — Disagreement fails before `npm publish`.** Given tag `v4.0.1` and `package.json` version `4.1.0-rc.1`, the job fails before `npm publish`, printing **both** values.
2. **AC2 — Agreement passes.** Given tag `v4.0.1` and version `4.0.1`, the check passes and publication proceeds.
3. **AC3 — `github.ref_name` is actually referenced.** It appears **nowhere** in `ci.yml` today (verified 2026-08-22) — that absence *is* T41 finding (c), and it is why BUG-15 shipped half its own acceptance text.
4. **AC4 — The tag value reaches the shell via `env:`, never via `${{ }}` interpolation inside `run:`.** Interpolating a context value directly into a `run:` body is the GitHub Actions script-injection antipattern, and **CodeQL runs on this repo on every push** (`32567406417`, green). `ci.yml` today has **zero** `${{ }}` inside any `run:` and **zero** `env:` blocks, so this story establishes the pattern for Stories 1.5–1.7. Getting it wrong here propagates.
5. **AC5 — EVERY input is validated to the same standard, and the story enumerates them.** This is the defect class that has survived every process gate in this epic: `dist-1-3` shipped a guard that validated `CURRENT` and left `CAND` raw, and a newline in `package.json`'s `version` made it fail open. The inputs here are **`TAG_NAME`** and **`VERSION`**. Both MUST be shape-validated with `[[ =~ ]]` (a `case` glob is **not** a shape check — `[0-9]*` means "a digit followed by anything", which is how `1.2.3.4` and embedded newlines got through in `dist-1-3`). Neither may be compared before it is validated.
6. **AC6 — Placement: before the downgrade guard.** The tag/version check needs no network. Running it first means an identity mismatch fails immediately instead of after a registry round-trip, and it cannot be confused with a registry failure.
7. **AC7 — Nothing else in the publish job changes, except the `env:` key AC4 requires.** Stated explicitly because the two ACs otherwise contradict: AC4 mandates adding `env:` to the `Publish to npm` step, which is literally "something else in the publish job". The enumerated list below is the operative constraint. FR1's `${VERSION%%+*}` strip, FR5's downgrade guard and its `publish-npm` concurrency group, `--provenance`, `--access public`, `--loglevel verbose`, and the OIDC/Node-24 comments are untouched. FR4 (auth loudness) is Story 1.5 — do not implement it.
8. **AC8 — Citation repair, with the buckets re-derived not inherited.** This story inserts before `npm publish` (currently `ci.yml:495`), so lines below the insertion point move. **Re-run the sweep** — do not trust this list, which was accurate at authoring time:
   - `adr-003:43` and `:134` — already de-pinned to a step reference by `dist-1-3`; **verify they stayed de-pinned**, no action expected
   - **Validate every citation against the CURRENT file before bucketing it.** An earlier draft filed `ci.yml:412` under "above the insertion point, assert do not edit" — but `:412` was **already broken**: `dist-1-3`'s 7-line `concurrency:` block pushed `case "${VERSION%%+*}"` from 412 to 419. That bucket criterion tested *future stability* and silently substituted it for *current accuracy*. Both `:412` sites were de-pinned at story review; **re-run the check anyway**
   - **Four `ci.yml:` pins were known stale entering this story**, two now fixed. The other two are deferred from `dist-1-3` R1 and remain broken: `release-4.0.0-publish-handoff.md:103` (`ci.yml:377`) and `v63-5b-3-…md:273` (`ci.yml:359`). Out of scope, but do not report the sweep as clean without naming them
   - `adr-003`'s **Amendments** section cites `ci.yml:417 → 495` historically — **do not rewrite**, it is a dated record
   - Completed story files (`dist-1-1`, `dist-1-2`, `dist-1-3`) — **never touch**
   If a citation *does* move, prefer deleting the line number over re-pinning it.
9. **AC9 — NFR10: the gate is demonstrated FAILING against the pre-fix tree**, with the output recorded, and kept **separately labelled** from any harness falsification. The epic (`:250-254`) requires this of any gate this epic introduces. **Note:** an earlier draft of this story cited `:247-252`; that was already stale, because `dist-1-3`'s R1 amended FR5 in the epic and shifted every NFR down. Re-verify the line before citing it — this file moves.
10. **AC10 — The rehearsal strategy is recorded (NFR2), and the verification basis is stated HONESTLY.** An earlier draft asserted there was no platform-dependent operator here. **That was false and the review caught it:** the deciding operator is `[[ =~ ]]`, whose engine is the host's `regcomp`, and POSIX bracket ranges are collation-dependent. Local basis is **bash 3.2.57 / BSD regex**; the runner is **bash 5.2 / glibc regex**. Testing across `C`, `C.UTF-8`, `en_US.UTF-8` and `tr_TR.UTF-8` found no divergence locally, which is evidence the *local* engine is stable — not that glibc agrees. The gap is smaller than `dist-1-3`'s `sort -V` gap but it is the same shape. **Disclose it; do not deny it.**
11. **AC11 — T41 finding (c) closes; (b) and (d) stay open.** Strike only (c). T41 remains `Open` at `E3 / 5.4`. **Sweep every assertion of (c).** An earlier draft predicted three locations; the review found **six**, in the story that quotes `dist-1-3`'s "six where the spec predicted two" lesson. Enumerated 2026-08-22 — **re-derive, do not trust**:
   - backlog T41 row — the `(c)` clause
   - `scope-decisions:69` — "The gate still holds on (b), (c) and (d)"
   - `scope-decisions:75-78` — the (c) narrative, incl. "`github.ref_name` appears nowhere"
   - `scope-decisions:179-182` — the standing rule, which **rests on (c) alone** after this ships and becomes vacuous; this is the one with operational consequence
   - `scope-decisions:220` — the staleness record
   - **`scope-decisions:228-230` — §8 Verification commands.** `grep -n "github.ref_name" .github/workflows/ci.yml   # expect: no match — finding (c)`. **This is executable documentation whose stated expectation this story inverts.** After the commit, an operator running the repo's own documented staleness check gets a false alarm. A grep for `T41(c)` will not find it; grep for `(c)` and for `ref_name`
   - **epic NFR1 (`:229-230`)** — *"No `v*` tag may be pushed until FR1–FR8 clear. (a), (c) and (e) each mis-route a tagged publish."* This is the **twin** of `scope-decisions` §6, and **both prior sweeps missed it** — (a) closed in `dist-1-2`, (e) in `dist-1-3`, and neither amended it. Cleared at story review; **this story retires the rule entirely**, since (c) is its last surviving basis. Record that
   - **epic `:102-103` (FR3) and `:462` (Story 1.4 AC)** — both assert `github.ref_name` is "referenced nowhere today". See Task 7; the epic is NOT expected to be clean

## Tasks / Subtasks

- [ ] **Task 1 — Confirm the premise (AC: 3)**
  - [ ] `grep -n "ref_name\|GITHUB_REF" .github/workflows/ci.yml` — expect **zero** hits. If any exist, stop: T41(c)'s premise has changed
  - [ ] Confirm AC4's premise properly. `grep -c '\${{' .github/workflows/ci.yml` returns **5** (verified: lines 11, 55, 58, 74, 261 — all in `concurrency.group`, `name:`, `with:` and `if:`, **none in a `run:` body**). An earlier draft of this task said "expect zero" and omitted the file operand, so it hung on stdin and then raised a false alarm. Discriminate properly:
    ```bash
    python3 -c "import yaml,sys;d=yaml.safe_load(open('.github/workflows/ci.yml'));print(sum('\${{' in (s.get('run') or '') for j in d['jobs'].values() for s in j.get('steps',[])))"
    ```
    Expect **0**. That is the number AC4 is about

- [ ] **Task 2 — Implement the check (AC: 1, 2, 3, 4, 5, 6, 7)**
  - [ ] Add `env:` to the **`Publish to npm` step** binding `TAG_NAME: ${{ github.ref_name }}`. The `${{ }}` lives in the `env:` mapping, **never** inside the `run:` body
  - [ ] Insert the check at the **top of the `run:` block**, after `VERSION=` and **before** the `DIST_TAG` derivation and the downgrade guard (AC6)
  - [ ] Strip exactly one leading `v`: `TAG="${TAG_NAME#v}"`. Reject `vvv4.0.1` via the shape check rather than looping the strip
  - [ ] Shape-validate **both** `TAG` and `VERSION` with `[[ =~ ]]` before comparing (AC5)
  - [ ] Fail with a message naming **both** the raw tag and the version (AC1)
  - [ ] Log the success path too, so the step log distinguishes "checked and passed" from "not reached"

- [ ] **Task 3 — Prove it locally (AC: 1, 2, 5, 10)**
  - [ ] Extract the block from `ci.yml` with `sed` and run it via `bash -eo pipefail -c` (matching `ci.yml:22-24`). **Do not `source` it** — it contains `exit 1`
  - [ ] Run the table in Dev Notes, including the hostile inputs: empty tag, injection-shaped tag, multi-line tag, multi-line version, `vvv` prefix, two-segment version
  - [ ] **Falsify the harness**: mutate the comparison (e.g. drop the `!` from `[ "$TAG" != "$VERSION" ]`) and show the table reports the wrong answers
  - [ ] Paste both, separately labelled

- [ ] **Task 4 — NFR10 (AC: 9)**
  - [ ] Run the gate against the pre-fix condition — tag/version disagreement — and capture the actual refusal and exit code
  - [ ] Show the same input on the pre-fix tree reaching the publish line. **Use a stub — NEVER execute the pre-fix block intact.** It ends in `npm publish --provenance --access public`, and the epic is explicit that this path has no dry run (FR19). Replace that final line with `echo ">>> REACHED npm publish (no tag check exists on the pre-fix tree)"` before running. An earlier draft said only "show it reaching `npm publish`", which taken literally attempts a real publish from a developer machine
  - [ ] Label this distinctly from Task 3's falsification; they prove different things

- [ ] **Task 5 — Citations (AC: 8)**
  - [ ] Re-run `grep -rn "ci\.yml:[0-9]" --include="*.md" _bmad-output/` and re-derive the buckets. **The band is no longer `4[0-9][0-9]` alone** — `dist-1-3`'s review found two citations that had drifted out of the 400s and were structurally invisible to that regex
  - [ ] Repair only what moved; assert what did not; never open a completed story file

- [ ] **Task 6 — Regression gates (AC: 7)**
  - [ ] `ci.yml` parses; `npm run lint` exits 0
  - [ ] `npm test` — **check `uptime` first.** The suite is its own load generator; under load it produces spurious failures and can run 45× longer
  - [ ] `git diff HEAD -- .github/workflows/ci.yml` touches only the intended lines
  - [ ] **Confirm CodeQL stays green after the push** — AC4 is precisely what it scans for

- [ ] **Task 7 — Close T41 (c) across every assertion (AC: 11)**
  - [ ] Backlog row: strike (c) only; (b) and (d) stay open; T41 stays `Open` at `E3/5.4`; do not move the row
  - [ ] Sweep `scope-decisions` for **every** (c) assertion — grep, do not rely on the list in AC11
  - [ ] The standing rule *"No `v*` tag may be pushed until T41 clears"* rests on **(c) alone** after this ships. Update it, and record what the rule now rests on — this is the one with operational consequence
  - [ ] **The epic is NOT clean — do not record "nothing to change" before looking.** It asserts, as present-tense fact, the thing this story falsifies: `convoke-epic-…:102-103` (FR3, "`github.ref_name` is referenced nowhere today") and `:462` (Story 1.4 AC, "it appears nowhere today"). `dist-1-3` R1 logged the identical construction in the identical file as a MEDIUM. Decide per site: amend to past tense, or record why a dated planning artifact is exempt. **A pre-recorded negative result is not a check**
  - [ ] Backlog Change Log receipt. **State the evidence counts that were actually measured** — `dist-1-3`'s receipt claimed 8 registry paths when 6 were run
  - [ ] Verbatim lane-order check; **baseline is 7 violations**. `backlog-integrity.js` PASS. File-level staging only

- [ ] **Task 8 — Commit plan (AC: all)**
  - [ ] Write a `## Commit Plan` **into this story file**, with all five `commit-preparation` fields: Files, Summary, **Description (why + what it affects + review status)**, **staged-set proof** run after staging, and the falsifiable clause
  - [ ] Paste the lane-order output **into the commit Description**
  - [ ] Test-touch opt-out: no harness exists for `ci.yml` shell logic and no test reads `ci.yml`
  - [ ] Disclose any reviewed-set vs staged-set delta
  - [ ] **OPERATOR STEP — leave unchecked until the commit exists.** Verify the Description landed: `git log -1 --format=%b | wc -c`

## Dev Notes

### What this story is, in one line

`github.ref_name` appears nowhere in `ci.yml`, so tag `v4.0.1` can publish `4.1.0-rc.1`. Compare them.

### Build metadata does NOT count — decided at story review, not left open

An earlier draft left this to the implementer. **The review closed it, because the pipeline had already decided.** `semver.valid("4.0.1+sha.abc")` returns **`4.0.1`** — npm canonicalises build metadata away — and three lines further down the same step, FR1 computes `CAND="${VERSION%%+*}"` and FR5 compares *that* to the registry. An exact-match tag check would have made one step assert "tag == version, metadata included" while the next asserts "version == 4.0.1, metadata stripped".

So the comparison strips `+meta` from **both** sides. `v4.0.1` and `4.0.1+sha.abc` **agree**; so do `v4.0.1+sha.abc` and `4.0.1`.

Recording the alternative for the record: exact match is defensible on identity grounds ("the tag names the version npm shows"), but it is inconsistent with the rest of this job and with npm's own semantics. Do not re-open it without changing FR1 and FR5 too.

### The check (corrected at story review — reproduce it per AC10)

**Three review layers broke the first draft.** Every line below closes something they drove through it:

```bash
SEMVER_RE='^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)(-(0|[1-9][0-9]*|[0-9]*[A-Za-z-][0-9A-Za-z-]*)(\.(0|[1-9][0-9]*|[0-9]*[A-Za-z-][0-9A-Za-z-]*))*)?(\+[0-9A-Za-z-]+(\.[0-9A-Za-z-]+)*)?$'
if [ -z "${TAG_NAME:-}" ]; then echo "FATAL: TAG_NAME is empty; cannot verify tag vs version." >&2; exit 1; fi
if [ -z "${VERSION:-}" ]; then echo "FATAL: VERSION is empty; cannot verify tag vs version." >&2; exit 1; fi
case "$TAG_NAME" in v*) ;; *) echo "FATAL: tag '$TAG_NAME' is not v-prefixed; refusing." >&2; exit 1 ;; esac
TAG="${TAG_NAME#v}"
if ! [[ "$TAG" =~ $SEMVER_RE ]]; then echo "FATAL: tag '$TAG_NAME' does not name a valid semver release." >&2; exit 1; fi
if ! [[ "$VERSION" =~ $SEMVER_RE ]]; then echo "FATAL: package.json version '$VERSION' is not valid semver." >&2; exit 1; fi
# Build metadata is NOT part of a release's identity: FR1 strips it for dist-tag routing and
# npm/semver canonicalises it away (semver.valid("4.0.1+sha")==="4.0.1"). Compare on the same basis.
if [ "${TAG%%+*}" != "${VERSION%%+*}" ]; then
  echo "FATAL: tag and version disagree -- tag '$TAG_NAME' names '${TAG%%+*}', package.json says '${VERSION%%+*}'." >&2
  exit 1
fi
echo "Tag/version check: tag $TAG_NAME matches package.json $VERSION -- OK"
```

| Line | Closes |
|---|---|
| `SEMVER_RE` (official semver.org grammar) | the first draft's `^[0-9]+\.[0-9]+\.[0-9]+([-+][0-9A-Za-z.+-]+)?$` accepted **9 invalid-semver shapes** — `01.2.3`, `1.2.3-01`, `1.2.3-+`, `1.2.3+a+b`, `1.2.3-.` — while its error text claimed "is not a semver release", an assertion it did not make |
| symmetric `-z` on **both** operands | the draft guarded `${TAG_NAME:-}` and read `"$VERSION"` bare — **the exact asymmetry AC5 exists to forbid, in the story that introduced AC5.** Harmless today (no `-u`), latent the moment anyone adds it |
| explicit `v*` prefix assert | `TAG_NAME=4.0.1` (no `v`) passed. `${TAG_NAME#v}` is a silent no-op, and Actions' `startsWith()` is **case-insensitive**, so the job `if:` is a weaker guarantee than the story assumed — the real protection is the `on.push.tags: ['v*']` glob |
| `%%+*` on both sides | see above |

**Verified behaviour, 2026-08-22 (corrected check):**

| TAG_NAME | VERSION | exit | note |
|---|---|---|---|
| `v4.0.1` | `4.0.1` | 0 | AC2 |
| `v4.0.1` | `4.1.0-rc.1` | 1 | **AC1 — the T41(c) scenario verbatim** |
| `v4.0.1+sha.abc` | `4.0.1` | 0 | metadata ignored, both directions |
| `v4.0.1` | `4.0.1+sha.abc` | 0 | " |
| `4.0.1` | `4.0.1` | 1 | not v-prefixed |
| `v01.2.3` | `01.2.3` | 1 | leading zeros are invalid semver |
| `v1.2.3+a+b` | `1.2.3+a+b` | 1 | second `+` |
| `v1.2.3-+` / `v1.2.3-.` | same | 1 | empty prerelease identifiers |
| `"   "` | `4.0.1` | 1 | not v-prefixed |
| `v4.0.1` | *(empty)* | 1 | symmetric emptiness check |

**Known accepted limit:** `v99999999999999999999.0.0` passes. The official semver.org grammar permits unbounded digits; `semver.js` rejects it for exceeding `MAX_SAFE_INTEGER`. Diverging from the published grammar to catch a 20-digit major is not worth it — `npm publish` rejects it downstream. **Record this rather than rediscovering it.**

### Why `env:` and not `${{ github.ref_name }}` in the `run:` body

Direct interpolation splices the context value into the shell **before** the shell sees it, so a crafted tag becomes code. Via `env:` it arrives as data in a variable that can be quoted. **CodeQL scans this repo on every push and flags the direct form.** `ci.yml` currently has zero `${{ }}` inside any `run:` and zero `env:` blocks — Stories 1.5–1.7 will copy whatever this story does.

Practical note: a tag push here requires repo write access, so the *exploit* path is narrow. The reason to get it right is that it is the pattern three more stories inherit, and it is one CodeQL will keep flagging.

### Placement, and what it must not disturb

The `Publish to npm` `run:` block is now (as of `e9ef475b`): `VERSION=` → `DIST_TAG` derivation (FR1) → downgrade guard (FR5, ~45 lines) → `npm publish` at `:495`. **Insert immediately after `VERSION=`.** That is before the FR1 `case` and before the network call, so an identity mismatch costs nothing and cannot be mistaken for a registry failure.

FR5's guard is long and heavily commented because every validation in it closes a hole a review layer drove through. **Do not refactor it, do not "tidy" it, do not merge the two checks.**

### Cross-story dependencies

- **Independent of FR5's outcome.** This check needs no registry.
- **Story 1.5 (FR4) edits the same step.** Sequenced so each gets one isolated rehearsal.
- **Story 1.6** composes all of them; it is where the live tag rehearsal happens.
- **This story makes the `scope-decisions` standing rule vacuous** — it currently rests on (c) alone. That is an operational unblock and should be recorded as one.

### Disproved risks — do not re-raise

- **This is not FR5.** FR5 compares `package.json` to the **registry**; this compares it to the **git tag**. Different inputs, different failure modes.
- **This does not affect prerelease routing.** It is an equality check, not a dist-tag derivation.
- **`github.ref_name` is safe to read on a tag push** — the job's `if: startsWith(github.ref, 'refs/tags/v')` guarantees a tag ref, so `ref_name` is the tag name with `refs/tags/` stripped.

### Testing standards

- **No new tests, and no harness exists for `ci.yml` shell logic** — confirmed 2026-08-22: `grep -rln "ci\.yml\|ref_name" tests/ --include="*.js"` returns **zero**. Scope the grep to `*.js`: an unscoped grep hits `tests/fixtures/portability-project/**` pact documentation and reads as a false positive.
- `verification-must-be-falsifiable` applies to every cited check; `verification-pipefail` to every piped command.
- **There IS a platform-dependent operator here, contrary to an earlier draft of this story.** `[[ =~ ]]` uses the host's `regcomp`; local is BSD/bash-3.2, the runner is glibc/bash-5.2. No divergence was found locally across four locales, but that is not evidence glibc agrees. Smaller than `dist-1-3`'s `sort -V` gap, same shape — disclose per AC10.
- **There is no registry dependency and no network**, unlike FR5. That part of the earlier claim holds.

### References

- [Source: _bmad-output/planning-artifacts/convoke-epic-4-0-1-distribution-integrity.md#Story 1.4] — acceptance criteria origin
- [Source: _bmad-output/planning-artifacts/convoke-epic-4-0-1-distribution-integrity.md:101-103] — FR3
- [Source: _bmad-output/planning-artifacts/convoke-epic-4-0-1-distribution-integrity.md:241-247] — NFR2
- [Source: _bmad-output/planning-artifacts/convoke-epic-4-0-1-distribution-integrity.md:250-255] — NFR10, discharged by AC9
- [Source: _bmad-output/planning-artifacts/convoke-note-initiative-lifecycle-backlog.md] — T41 finding (c)
- [Source: _bmad-output/implementation-artifacts/dist-1-3-refuse-a-semver-lower-publish-to-latest.md] — previous story; **read its Review Findings before coding**, AC5 exists because of them
- [Source: project-context.md#verification-must-be-falsifiable] — Task 3
- [Source: project-context.md#backlog-write-discipline] — Task 7
- [Source: project-context.md#commit-preparation] — Task 8
- [Source: project-context.md#code-review-convergence] — reviewed set must equal committed set

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List

## Change Log

| Date | Change |
|---|---|
| 2026-08-22 | **Story review before commit — 3 layers.** Verdict: shell check sound but scaffolding defective; corrected in place. **The drafted check committed the very defect AC5 forbids** — `${TAG_NAME:-}` guarded, `"$VERSION"` bare — and its regex admitted **9 invalid-semver shapes** while claiming to validate semver. Replaced with the official semver.org grammar, symmetric emptiness checks and an explicit `v*` assert (a no-`v` tag previously passed). **The metadata judgment call was CLOSED, not left open:** `semver.valid("4.0.1+sha")` is `4.0.1` and FR1/FR5 already strip it, so exact-match would have made one step contradict the next. **AC8's bucket criterion tested future stability instead of current accuracy** — it would have preserved `ci.yml:412`, already broken by `dist-1-3`'s concurrency block (case moved 412→419); both sites de-pinned. **AC11 predicted 3 (c) sites; there are 6**, including `scope-decisions:230`, an executable `# expect: no match` command this story inverts. **Task 7 pre-recorded "epic: nothing to change" while the epic asserts "ref_name is referenced nowhere today" twice** — the identical construction `dist-1-3` R1 logged in the same file. **Task 4 as written would have attempted a real `npm publish`.** Task 1's premise command was unrunnable and its expectation false (5 hits, 0 in `run:`). AC10's "no platform-dependent operator" claim was false — `[[ =~ ]]` is host `regcomp` |
| 2026-08-22 | Story created by `bmad-create-story`. Check drafted and verified across 11 cases at authoring time, including the two input classes that made `dist-1-3` fail open (multi-line tag, multi-line version) and an injection-shaped tag. **AC5 added as a direct response to `dist-1-3`'s R1**: every input enumerated and validated to the same standard, since "validated one operand, left the sibling raw" is the defect that has survived every process gate in this epic. **AC4 covers script injection** — `${{ }}` must not enter a `run:` body; CodeQL scans this repo and `ci.yml` has no existing `env:` pattern, so this story sets it for Stories 1.5–1.7. One judgment call left explicitly open for the implementer: whether build metadata counts for tag/version identity. `baseline_commit` deliberately not pre-stamped |
