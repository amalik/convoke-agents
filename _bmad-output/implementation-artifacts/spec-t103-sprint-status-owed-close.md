---
title: 'T103 — Extend the owed-close scan to sprint-status.yaml'
type: 'feature'
created: '2026-08-30'
status: 'done'
review_loop_iteration: 1
baseline_commit: '51f6f21c17f1aa134dd7f5e5bb134d9c35e637ba'
context:
  - '{project-root}/_bmad-output/planning-artifacts/convoke-spec-t103-sprint-status-owed-close.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** T79's owed-close scan reads lane rows and nothing else. Story status lives in `sprint-status.yaml`, which no gate reads, so a story whose work has shipped sits at `backlog` unnoticed. Measured 2026-08-30: `dist-2-1` and `dist-2-5` both read `backlog` after their work landed, caught by a human readiness pass rather than a gate. `dist-2-5` is still live at line 924 against `21ae3105 fix(dist-2-5): …`.

**Approach:** Feed `checkOwedCloses` a **second population of live IDs** read from `sprint-status.yaml`'s `development_status:` block. The git read, verb filter and scope-token match already exist — a second source, not a second scanner. Report story findings as a **divergence between status and history**, not as an owed close; the resolution (close / re-scope / split) is the reader's.

## Boundaries & Constraints

**Always:**
- **No YAML parser.** The script requires only `fs`, `path`, `child_process`. Adding `js-yaml` to a CI-blocking audit re-enters the resolution failure `8c5de2f8` just fixed (T104). Line regex, bounded to the block.
- **Live is every status except `done` — an exclusion, never an allowlist.** `review` has 120 occurrences in this file's history and is absent today; an allowlist of the four currently-present statuses would make review-stage stories — precisely the ship-to-close window this gate watches — silently invisible.
- **The story pass matches `fix|feat` only** — a separate `STORY_VERBS`, not the lane's `WORK_VERBS`. An unactionable warning is this gate's failure mode, and `governance(<ID>)` filing commits manufacture exactly that: measured, the wide set adds one hit on story scopes and it is `5fae72ae governance(dist-2-8): retract ADR-005` — a retraction, not a ship.
- **A key that cannot be parsed is reported, not dropped.** Distinguish *epic, deliberately skipped* from *unparseable*, and print the unparseable count. Zero today; silence otherwise reads as coverage.
- **Pass 1 only** for stories. Stories postdate the commit convention, so pass 2 buys nothing; and the slug `dist-2-5-close-bug-19-…` contains `bug-19`, which a bare match would cross-contaminate with the `BUG-19` lane row.
- **WARN, exit 0.** A fix legitimately precedes its status flip inside a session, and this runs in the CI gating that very commit.
- **Lane-scan output byte-identical to today's** — same 4 warnings (`I113`, `I134`, `T103`, `T99`), same summary line.
- **Report inability to scan.** A missing `sprint-status.yaml` says so; it must never read as clean.
- Every AC shown **red before green** (`verification-must-be-falsifiable`); all tests fixture-isolated (`test-fixture-isolation`).

**Ask First:** changing `STORY_VERBS` or `WORK_VERBS`; admitting epic-level keys; altering any lane-scan output string.

**Never:**
- **Encode the live-tree hit set as a test assertion.** AC1 is a one-time acceptance observation, run by hand. As a regression test it turns CI red the day someone *correctly* reconciles `dist-2-5` — punishing the behaviour this gate exists to cause, and a `fixture-determinism` census violation. All regression coverage lives on fixtures.
- Reconciling `dist-2-5` — a scope decision owned by `dist-epic-2`. Ship the gate; let it report the row.
- Failing the build on a story divergence.
- Reading keys under `action_items:` or any sibling top-level block.
- Widening the lane `ID_SHAPE` — load-bearing against blank-cell rows building `new RegExp('\b\b')`.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| True positive | `dist-2-5-…: backlog` + `fix(dist-2-5)` in history | WARN naming the ID, its line, status and commit; exit 0 | N/A |
| Reconciled | same key flipped to `done` | no warning; denominators still printed | N/A |
| Review status | `foo-1-2-…: review` + `feat(foo-1-2)` | warns — live is everything but `done` | N/A |
| Epic-level key | `dist-epic-2: in-progress` + **`feat(dist-epic-2)`** | ignored — live by definition while its stories ship. The verb must be one that *would* match, or the case passes with epic-exclusion deleted | N/A |
| Non-ship verb | `docs(dist-2-5)` or `governance(dist-2-5)` | no warning — the story pass is `fix\|feat` only | N/A |
| Unparseable key | a non-epic key yielding no ID, e.g. `i97-bug-1-…` | counted and reported as unparseable, never silently skipped | reported, exit 0 |
| Comment in block | `  # Epic 1: …` at story indent | not a key — `#` is outside the key charset | N/A |
| Over-long comment | the 101,804-char line 44, above the block | never reached — out of bound | N/A |
| Sibling block | `key: value` under `action_items:` | ignored — bound stops at the next 0-indent key | N/A |
| CI annotation | `GITHUB_ACTIONS=true` + a divergence | additionally emits `::warning::` so it surfaces as a run annotation | N/A |
| Missing file | no `sprint-status.yaml` | WARN naming the file and why the scan did not run | reported, exit 0 |
| Shallow clone | no history | existing inert WARN covers both sources | reported, exit 0 |

</frozen-after-approval>

## Code Map

- `scripts/audit/backlog-integrity.js` — `checkOwedCloses` (479-569) builds `live` from lane rows and matches subjects; `reportOwedCloses` (595-623) prints; `gitSubjects` (452-477) already returns `{subjects, inert, reason}`; `WORK_VERBS` (441) stays lane-only.
- `_bmad-output/implementation-artifacts/sprint-status.yaml` — `development_status:` line 147, next 0-indent key `action_items:` line 936; story level is 2-space indent; ~22 comments sit inside the block; line 44 is the 101,804-char comment, above it. **Line 689 carries `descoped-by-ADR`** — a status outside the lowercase charset.
- `tests/unit/backlog-integrity.test.js` — `describe('T79 — owed-close detection')` at 463; `runIn(subjects, doc)` at 473 builds a hermetic one-commit repo per case.
- `.github/workflows/ci.yml:166` — where this runs; `::warning::` precedent at lines 148 and 437; `npm test` runs at `:65` (Node 18/20/22) and `:100`.

## Tasks & Acceptance

**Execution:**
- [ ] `scripts/audit/backlog-integrity.js` — add `SPRINT_STATUS` and a pure `parseStoryStatuses(text)` bounded to the `development_status:` block. Split on `/\r?\n/` so a CRLF checkout is not read as an empty block. Return **both** populations: `rows` for `/^ {2}([a-z0-9-]+): *([a-z-]+)$/` matches, and `unrecognized` for every other in-block line that is neither blank nor a comment. **An in-block line must land in exactly one of the two** — a line that matches neither is the silent-drop defect this spec exists to avoid. On a duplicate key, last wins, matching YAML.
- [ ] `scripts/audit/backlog-integrity.js` — add `storyId(key)` returning `{kind:'epic'}` (only when an `epic` segment is **followed by a number**, so `x-epic-flow-1-2` is not swallowed), `{kind:'story', id}` for the prefix through the first adjacent `\d+[a-z]*` pair, else `{kind:'unparseable'}`. Guard with `STORY_ID_SHAPE`, separate from the lane `ID_SHAPE`.
- [ ] `scripts/audit/backlog-integrity.js` — add `STORY_VERBS = new Set(['fix','feat'])` and extend `checkOwedCloses` with a second live map (status **≠ `done`**, exclusion not allowlist), matched in **pass 1 only**. Return `storyWarnings`, `storyLiveCount`, and a `storySkipped` record naming every key that did not enter the live set and why: `unrecognized`, `unparseable`, or `collapsed` (a second live key deriving an id already taken).
- [ ] `scripts/audit/backlog-integrity.js` — extend `reportOwedCloses` to print a **separate** story block after the lane block, phrased as divergence. Print the denominator with every skip bucket, and **name the keys**, not just a count — a number the reader must hand-scan a 950-line file to resolve is not actionable. When git is inert but stories were read, say so rather than printing nothing. Under `GITHUB_ACTIONS`, emit one `::warning::` per divergence with `%`, CR and LF percent-escaped per the Actions command spec.
- [ ] `tests/unit/backlog-integrity.test.js` — extend `runIn` with a sprint-status fixture (default minimal-valid). **`runIn` must neutralise `GITHUB_ACTIONS` for every case that does not explicitly test it** — the harness inherits the ambient value, and CI always sets it. Cover: unrecognized line, CRLF, duplicate key, collapsed id, `epic`-in-name, git-inert-with-live-stories, annotation escaping, plus a pin on the lane warning count.

**Acceptance Criteria:**
- **No line inside the block is dropped**, and any line the bound stranded is reported. `rows` and `unrecognized` partition the in-block lines; `outsideBlock` collects story-key-shaped lines the bound did not cover. *This is not an independently-derived cross-check* — the residue shares `inBlock` with the parse, so it detects a bound that closed too early and nothing else. An earlier draft of this AC claimed a different-predicate cross-check; no such computation was ever written, and stating it here made the mechanism sound stronger than it is.
- **One-time acceptance observation, never a test.** On the live tree the story block warns on `dist-2-5` (naming `21ae3105`) and reports **94** live stories with every skip bucket at zero — `v63-4-3-…` enters the population rather than being lost.
- **The arithmetic reconciles, and says so when it does not.** `keys read` equals `live + done + epic + superseded + unparseable + collapsed`; any key leaving by an uncounted path prints `RECONCILIATION FAILED` rather than a clean denominator.
- **Keys outside the block are reported.** A story-key-shaped line anywhere in the file that the block bound did not cover is named, so a truncated parse is loud rather than clean.
- Given the live tree, when the script runs, then the lane block still reports exactly 4 warnings (`I113`, `I134`, `T103`, `T99`) and the process exits 0.
- Given `GITHUB_ACTIONS=true`, when the suite runs, then it passes — no test may read that variable except the one asserting on it.
- Given any check cited as evidence, when it is reported, then it has been shown red on a broken input and green on restore.

## Spec Change Log

**2026-08-30 — Round 1, `bad_spec` loopback (`review_loop_iteration` 0 → 1).**

*Triggering finding.* Both reviewers independently found that an in-block line failing the row regex is dropped from all three counts — not scanned, not live, not `unparseable`. Live on this tree: `sprint-status.yaml:689` reads `descoped-by-ADR`, whose uppercase `ADR` fails the value charset. Measured: 451 in-block candidate lines, 450 parsed, 1 lost. The gate printed `93 live stories (0 key(s) unparseable)` when the true figure is 94.

*What was amended, and why it is spec-level rather than a patch.* The frozen Always clause was already correct — *"a key that cannot be parsed is reported, not dropped."* The defect came from the **task decomposition**, which placed the visibility guard only inside `storyId` and therefore covered one of two drop points. The Design Notes then asserted, falsely, that every non-matching in-block line is a comment — and instructed the reviewer not to re-derive it. Tasks now require an in-block line to land in exactly one of `rows` or `unrecognized`; the AC now cross-checks the denominator with an independent predicate; the false assumption and the "do not re-derive" directive are struck.

*Known-bad state avoided.* Shipping a gate that under-reports while printing a healthy denominator — the failure the code's own comments call this project's worst.

*The frozen block was NOT edited.* Its I/O matrix does not enumerate the unrecognized-line case, but the matrix is illustrative and the frozen Always clause governs. If it should be enumerated there, that is the operator's edit.

*Correction made during re-derivation.* The first fix reported line 689 as `unrecognized` — which named the loss but left the story unwatched, and contradicted this spec's own AC. Root cause went deeper: the value charset `[a-z-]+` **was an allowlist wearing a regex**, and the frozen rule says the live set is an exclusion. Widened to a structural bare-scalar token `[A-Za-z0-9_.-]+`, so unfamiliar status vocabulary enters the population while quoted values, nested maps and trailing comments still fall to `unrecognized`. Live set 93 → 94; `descoped-by-ADR` is now a status the scan watches.

*KEEP — must survive re-derivation.* The lane block stayed byte-identical (`diff` = pure append, `newOut.startsWith(oldOut)`), and both reviewers confirmed it. Zero third-party deps held. Exit code untouched by story findings. `STORY_VERBS` narrower than `WORK_VERBS`, pass-1 only, epics excluded, live-as-exclusion — all confirmed correct and all still wanted. The mutation harness with its negative control caught nothing wrong but proved the tests discriminate; rebuild it. The 60 pre-change tests must keep passing unmodified.

**2026-08-30 — Round 2, patches (no loopback; `review_loop_iteration` stays 1).**

*Triggering findings.* Two reviewers again converged. (a) My code comment asserted *"the caller cross-checks the two counts against an independently-derived total"* — **no such check existed**. I ran that cross-check in a shell, wrote it into the AC, and shipped a comment claiming the code did it. (b) Because it did not exist, a second drop path survived: one de-indented key closes the block permanently, and on this tree 302 of 451 keys vanished with every bucket at 0, exit 0, and the `dist-2-5` finding gone.

*Instrument changed, not patched again.* Per `code-review-convergence` — when a round's HIGHs are defects in the previous round's corrections, change the instrument. Round 1 fixed the line-level drop; Round 2 found the block-level one; enumerating drop paths one at a time was the wrong shape. Replaced with a **conservation law**: `parseStoryStatuses` counts every story-key-shaped line anywhere in the file by a predicate blind to the block bound, and anything outside is reported. The denominator now reconciles every exit (`live + done + epic + superseded + unparseable + collapsed`), with a `RECONCILIATION FAILED` line when it does not.

*Also fixed:* case-insensitive terminal status (`Done` was warned on as live); value must start with a letter (`2026-08-30`, `1.5`, `-` were being read as statuses); trailing whitespace tolerated; the `epic` guard no longer swallows `x-epic-1-2`; superseded duplicates named; skip listings capped at ten with a `(+N more)` tail; annotations extended to the silent states (unread file, unscanned keys) which need surfacing more than a divergence does; `GITHUB_ACTIONS` neutralised file-wide rather than only inside `runIn`.

*Deferred, with rationale.* Last-write-wins is computed across parsed rows only, so if a key's final occurrence is unrecognized an earlier `done` wins — named in a bucket, so not silent, and reachable only via invalid YAML. And a `done` key sharing a derived id with a live key is genuinely ambiguous semantics, not a defect. Both logged.

*Verification.* 90 unit tests pass with and without `GITHUB_ACTIONS`; the 60 pre-change tests still pass unmodified; mutation matrix **18/18 as intended** (16 killed, 2 controls survived) after two survivors exposed real test gaps and were closed.

**2026-08-30 — Round 3, final round (cap reached; no Round 4).**

*Two Priority-1 findings, both fixed.* (a) The conservation law had a blind spot at its own boundary: a story key de-indented to column zero is consumed by the block-closing branch, and since the residue predicate requires two-space indent it matched nothing — so de-indenting the LAST key lost it with every bucket empty and the arithmetic balancing. The closing line is now itself accounted for. (b) `RECONCILIATION FAILED` was unreachable on the clean path, because the tidy early return fired before the only place that prints it — exactly the state it exists to catch. `balanced` is now part of that condition.

*The finding that mattered most was about my own text, again.* Three code comments and one AC asserted properties the code does not have — the residue predicate described as *"blind to the block bound"* and *"counts every line anywhere in the file"* when it runs only inside `if (!inBlock)`; `balanced` described as catching a truncated parse when it is algebraically forced true for every input; and an AC claiming a different-predicate cross-check that was never written. All four are corrected to what is actually true, including what the mechanism does **not** guarantee. This is the third round in which the defect was a confident sentence rather than a line of code.

*Also corrected:* the published verb distribution did not reproduce — the figures were the story+epic population, not the story-only one the sentence claims (the conclusion survives, the evidence as written did not); `ci.yml:161` → `:166`; "950-line file" → 987.

*Deferred at the cap rather than fixed.* The residue predicate keys on the lowercase-slug shape, so a de-indented `Dist-2-5-x:` is still lost silently; a two-space scalar key under a sibling top-level block is now reported as stranded, which contradicts the frozen I/O matrix row saying such keys are ignored (latent — `action_items:` is a list-of-maps today, so it is protected by data shape rather than by design, and resolving it touches frozen intent); and `epic` is the one exit that is counted but never named.

*Process note, recorded because it is a real defect in how this round ran.* The working tree changed while the adversarial reviewer was reading, so two of its Priority-1 findings were already fixed in the tree but not in the artifact it was given. The commit plan's diff is re-derived from `git diff` at approval time, and the set-equality check is run against the staged set.

## Design Notes

**Operator decisions, 2026-08-30 (Amalik).** (1) `optional` counts as live. **Measured in Round 1: this is currently a dead letter** — all 23 `optional` keys on the live tree are epic-kind and are discarded by decision (2) before status is consulted. The ruling stands for the day a non-epic story is marked `optional`; it has no effect today, and no fixture exercises one. (2) **Epic-level keys excluded** — including them made `dist-epic-2` warn 3× purely for being `in-progress` while its stories ship: noise by construction, on every active epic forever. (3) **The story pass narrows to `fix|feat`**, reversing an earlier call to share `WORK_VERBS`. Three independent lines of evidence converged: `51f6f21c`'s own reasoning (scoped `backlog` rather than `T103` precisely because `governance(<ID>)` manufactures owed-close false positives, naming `fca40f62 governance(T99)` as one); the measured verb distribution across 4105 commits, classified by `storyId` so it covers the population actually scanned — `docs` 37, `fix` 10, `feat` 8, `governance` 1, `chore` 1, `revert` 0 — where the wide set's only additional hit is a retraction (the figures first published here, docs 41 / governance 4 / revert 1, were the story+epic population and did not reproduce); and an inversion pass finding that an unactionable warning is what turns a warn-level gate into wallpaper.

**Assumptions — audited 2026-08-30, one of them WRONG. Re-derive freely.** The earlier version of this section said *"do not re-derive in review"*, and that instruction was itself a defect: the assumption it protected was false, and both Round 1 reviewers found the blocker only because they ignored it. Never tell a reviewer not to check. Corrected record: the block bound holds (zero 0-indent keys in 148–935); zero duplicate keys; longest in-block line is 120 chars, so the 101,804-char scalar is out of bound entirely; 18 story-shaped scope tokens across 4105 commits, 0 matching no derived key; 385 lane IDs vs 309 story IDs, 0 collisions; 0 live keys collapse onto a taken id. **Falsified:** the claim that every non-matching in-block line is a comment — line 689 is a key with an out-of-charset value. `review` remains a real status (120 historical occurrences, absent today), and `i97-bug-1-fix-p0-activation-defects` remains a live counter-example to "every non-epic key yields an ID".

**On `descoped-by-ADR`.** The frozen rule is live-is-everything-but-`done`, so it counts as live and the denominator becomes 94. Verified: no `fix`/`feat` commit names `v63-4-3`, so recognizing it adds no warning today — it corrects a count, not a finding. Treating `descoped-*` as terminal would be a frozen-block change and therefore an operator decision.

**Why the annotation.** This scan writes to plain stdout inside a passing step, so its output is read only by someone who opens the log. The repo already annotates elsewhere (`ci.yml:148`, `ci.yml:437`). Env-guarded so local and fixture output are unchanged.

**The honest limit, stated in the output.** The scan detects divergence, not completion: `dist-2-5` merged FR17 and FR18 so one story would close BUG-19, and only FR17 shipped — the correct response there was *re-scope*. The wording must not assert a close is owed.

## Verification

**Commands:**
- `node scripts/audit/backlog-integrity.js; echo "EXIT: $?"` — no pipe, so `$?` is the script's own exit per `verification-pipefail`. Lane block unchanged (4 warnings); story block naming `dist-2-5` across `451 keys read = 94 live + 319 done + 38 epic + 0 superseded + 0 unparseable + 0 collapsed`; `EXIT: 0`.
- `node --test tests/unit/backlog-integrity.test.js` and `GITHUB_ACTIONS=true node --test tests/unit/backlog-integrity.test.js` — **both** must pass.
- `npm run lint` — exit 0, zero warnings in both touched files.
- `npm test` — full suite green.

**Falsification (required):**
- Flip `sprint-status.yaml:924` to `done` → the `dist-2-5` warning disappears; revert → it returns.
- Add an in-block line with an out-of-charset value → it is named as unrecognized, and the independent cross-check stays balanced. Restore.
- Feed a CRLF fixture → rows parse; a `split('\n')` implementation returns zero here.
- Break the block bound to include `action_items:` → a fixture key there is picked up.
- Set a fixture story to `review` → treated as live; an allowlist implementation goes silent.
- Fixture a `governance(<story>)` commit → no warning; the same fixture under `fix(...)` warns.
- Run with `GITHUB_ACTIONS=true` → the escaped `::warning::` appears; unset → it does not.
- Point the scan at a tree with no `sprint-status.yaml` → it says so rather than reporting clean.
- Mutation matrix over every new guard, **with a benign negative control that must survive** — a matrix whose rows all agree is testing the harness.
