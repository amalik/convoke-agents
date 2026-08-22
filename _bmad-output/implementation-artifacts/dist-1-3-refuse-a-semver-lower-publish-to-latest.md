# Story 1.3: Refuse a semver-lower publish to `latest`

Status: ready-for-dev

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

- [ ] **Task 1 — Confirm the premise before writing anything (AC: 2)**
  - [ ] `grep -n "npm view\|registry.npmjs\|npm dist-tag" .github/workflows/ci.yml` — confirm the only hit is `setup-node`'s `registry-url:` at `:386`. **Note the precise premise:** the job already transacts with the registry (`npm ci`, `npm publish`, `try-fresh-install.sh`). What is new is *reading the `latest` dist-tag*. FR5's justification rests on that narrower claim, not on "no registry dependency today" — do not repeat the looser version, a reviewer will pull it apart. This grep only detects a literal `npm view`; it cannot catch a `curl` or a node fetch
  - [ ] `npm view convoke-agents dist-tags.latest` — confirm it returns the current `latest` and exits 0

- [ ] **Task 2 — Implement the guard (AC: 1, 2, 3, 4, 6)**
  - [ ] Insert the guard into the `Publish to npm` `run:` block, **after** the `DIST_TAG` derivation and **before** `npm publish`. Keeping it in the same block means `DIST_TAG` is already in scope and no step-output plumbing is needed
  - [ ] Guard only when `DIST_TAG = latest`; log the skip explicitly on the `rc` path
  - [ ] Bind `PKG=$(node -p "require('./package.json').name")` and **fail closed if it is empty or the string `undefined`**. This is not optional garnish: an unbound `PKG` makes the whole guard a silent no-op (see Dev Notes)
  - [ ] Normalise the fetch — `2>"$VIEW_ERR" | head -1 | tr -d '[:space:]'`, strip `+metadata`, shape-validate, and reject a prerelease `CURRENT` as an anomaly
  - [ ] Treat non-zero exit, empty output, whitespace-only output, or a non-`X.Y.Z` value as fail-closed (AC3), echoing npm's captured stderr so the four causes stay distinguishable
  - [ ] Compare with `sort -V` (see Dev Notes for why, and for the three rejected alternatives)
  - [ ] Failure message must print **both** versions and the word `latest`, so the log says what happened without needing the source
  - [ ] Change nothing else in the job (AC6)

- [ ] **Task 3 — Prove the comparison locally (AC: 1, 4, 7)**
  - [ ] Reproduce the full case table in Dev Notes, including `10.0.0` vs `9.0.0` — the case a lexical sort gets wrong
  - [ ] **Falsify the harness** (`verification-must-be-falsifiable`): substitute a deliberately wrong comparison (e.g. plain `sort` instead of `sort -V`) and show the harness reports `10.0.0 vs 9.0.0` incorrectly. A table that only ever prints the expected answer is not evidence
  - [ ] Extract the logic from `ci.yml` itself (`sed -n` the block) rather than retyping it — retyped verification tests the transcription, not the file. **Run it with `bash -eo pipefail -c`, do NOT `source` it:** this block contains `exit 1`, which would kill the harness on the first REFUSE case. Use `-eo pipefail` to match `ci.yml:22-24`'s workflow-wide `defaults.run.shell`, or the harness is not testing shipped conditions
  - [ ] Prove the `rc` skip path: with `DIST_TAG=rc`, the guard must not run and must not require the registry

- [ ] **Task 4 — Prove the fail-closed path as far as is honestly possible (AC: 3, 7)**
  - [ ] Simulate an unreachable registry locally by pointing at an unroutable registry or forcing `npm view` to fail; confirm the job path exits non-zero **before** reaching `npm publish`
  - [ ] Simulate empty output (registry reachable, version undeterminable) and confirm the same
  - [ ] **State plainly what this does NOT prove:** that a real network partition inside a GitHub runner produces the same `npm view` failure mode. That belongs to Story 1.6's composed rehearsal. Do not claim it here

- [ ] **Task 5 — Repair the citations that move; assert the ones that do not (AC: 5)**
  - [ ] Read each Class A site and record the line it resolves to **before** the change
  - [ ] Apply the preferred remedy: replace line-number citations with a step reference so they cannot drift again
  - [ ] Re-run the sweep first — the map has grown once already: `grep -rn "ci\.yml:4[0-9][0-9]" --include="*.md" _bmad-output/`
  - [ ] Verify every Class A site resolves after the change by reading the line it now points at; leave every Class B site untouched
  - [ ] **ADR-003 is ACCEPTED.** Correcting a factual pointer inside it is legitimate; changing its decision or reasoning is not. Touch only the citation

- [ ] **Task 6 — Regression gates (AC: 6)**
  - [ ] `python3 -c "import yaml;yaml.safe_load(open('.github/workflows/ci.yml'))"` parses
  - [ ] `npm run lint` exits 0
  - [ ] `npm test` — **run it when the machine is idle.** Check `uptime` first; the suite is its own load generator and drove load average 2.63 → 22.81 in `dist-1-2`'s review. Under load it produces spurious failures and can take 80 minutes instead of 100 seconds. If it goes red, run the named files individually before concluding anything
  - [ ] Confirm the diff touches only the intended lines: `git diff HEAD -- .github/workflows/ci.yml`

- [ ] **Task 7 — Close T41 finding (e) across all three artifacts (AC: 8)**
  - [ ] Backlog row: strike **(e)** only; leave (b), (c), (d) open; T41 stays `Open` at `E3 / 5.4`; do not move the row
  - [ ] `convoke-note-4-0-1-scope-decisions.md` §3 — **TWO places, not one:** (i) the MEDIUM (e) line, and (ii) the "Why it gates rather than queues" paragraph asserting *"Finding (e) fires on precisely this release … downgrades every user from 4.0.0"*, which goes stale the moment the guard lands. **Note §3 also holds a Bucket 2 citation (`:71`) — Task 5 and Task 7 touch the same section; coordinate so one does not clobber the other**
  - [ ] `convoke-epic-4-0-1-distribution-integrity.md`: check FR5 and the T41 gate block. **Expect no change** — the epic has no per-finding closure convention (FR1 shipped and `:97` still reads `[T41(a) HIGH]`). Record "checked, nothing to change" explicitly
  - [ ] Backlog Change Log receipt naming what changed (§2.5: "nothing disappears without a receipt")
  - [ ] Run the verbatim lane-order block from `project-context.md` §`backlog-write-discipline`; paste output. **Baseline is 7 violations**
  - [ ] `node scripts/audit/backlog-integrity.js` PASS; **file-level staging only**

- [ ] **Task 9 — Demonstrate the gate FAILING against the pre-fix condition (AC: 9, NFR10)**
  - [ ] Run the guard with a candidate lower than the registry's `latest` (e.g. `VERSION=3.3.1` against `latest=4.0.0`) and capture the **actual refusal output and exit code**
  - [ ] Paste that output into Completion Notes under a heading that says NFR10 explicitly
  - [ ] Keep it **separate and separately labelled** from Task 3's harness falsification. They prove different things: Task 3 proves the *test* can report a wrong answer; NFR10 proves the *gate* refuses a real downgrade. Conflating them is how `dist-1-1` ended up citing a check that could not fail
  - [ ] Also record the pre-fix baseline: on the tree **without** the guard, the same input reaches `npm publish`. That is the 'against the pre-fix tree' half of NFR10

- [ ] **Task 8 — Commit plan (AC: all)**
  - [ ] Write a `## Commit Plan` section **into this story file**, carrying all five `commit-preparation` fields: (1) Files, (2) Summary, (3) **Description — why the change exists, what it affects, AND the review status line** (not just the status line; that partial reading was flagged at story review), (4) **staged-set proof** (`git diff --cached --name-only`, run after staging), (5) the falsifiable clause. Fields 3 and 4 were the MEDIUM in `dist-1-2` R1
  - [ ] Paste the lane-order output **into the commit Description**, not only into the story — `backlog-write-discipline` names the destination
  - [ ] `git add -A` so the index matches the plan
  - [ ] Test-touch opt-out: no test harness exists for `ci.yml` shell logic and no test reads `ci.yml` — state it explicitly
  - [ ] **OPERATOR STEP — leave this box unchecked until after the commit exists.** GitHub Desktop's Description box is separate from the summary field. After committing, verify with `git log -1 --format=%b | wc -c`. In `dist-1-2` this box was ticked pre-commit and certified a measurement of the *previous* commit's body

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

### Debug Log References

### Completion Notes List

### File List

## Change Log

| Date | Change |
|---|---|
| 2026-08-22 | **Story review before commit — 3 layers (adversarial, edge-case, implementability).** Verdict: **not ready as written**; corrected in place. **The specified guard would have failed OPEN** — `$PKG` was never defined, and `npm view "" dist-tags.latest` resolves a real package named `undefined` returning `0.1.0` at exit 0, so the fail-closed branch never fired and `3.3.1` would have published over `4.0.0`. Guard rewritten and re-verified across 5 candidate paths + 6 registry-response paths. **AC5's premise was false** for 3 of its 6 sites (`ci.yml:412` is above the insertion point) — the same false-premise-AC defect that forced an operator amendment in `dist-1-1`; rescoped to 2 sites + 1 range end, with a third bucket for this in-flight file's own 13 self-citations. **NFR10 had zero coverage** — added as AC9 + Task 9. Also fixed: the reference snippet violated its own AC4 (no skip log), `sort -V` disagrees with SemVer when `latest` holds a prerelease (now refused as an anomaly), `2>/dev/null` discarded the only diagnostic, AC6 forbade the comment this repo's convention requires, Task 5's heading still said 'three', and Task 8 forbade ticking a checkbox the story never created |
| 2026-08-22 | Story created by `bmad-create-story`. Guard logic verified across a 9-case table at authoring time, including `10.0.0` vs `9.0.0`. `semver` confirmed transitive-only (`c8 → istanbul-lib-report → make-dir`) and rejected as a dependency. Citation impact enumerated: **2 sites + 1 range end** actually move (both ADR-003 pointers and the end of `scope-decisions:204`); 3 more cite `ci.yml:412`, which is above the insertion point and does not move; 24 are historical records in completed story files. `baseline_commit` deliberately **not** pre-stamped — that mistake in `dist-1-2` required an operator ratification at review. Carries four traps from `dist-1-2` R1: sweep all three artifacts not just the cited one; commit plan needs all five `commit-preparation` fields; do not tick the post-commit check pre-commit; run `npm test` only when the machine is idle |
