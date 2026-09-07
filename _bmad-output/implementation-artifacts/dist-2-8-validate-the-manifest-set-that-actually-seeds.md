---
baseline_commit: 82a14e67424c1600c62ab0146771c9dfa9ef102d
---

# Story 2.8: Validate the manifest set that actually seeds

Status: review

> **Re-authored 2026-08-31. The previous story — "Repair the broken dependencies in the shipped
> manifest" — rested on a premise that is refuted, and its acceptance criteria asked for work that
> cannot be done.** Renamed rather than edited in place, because the old filename asserted the
> withdrawn premise (the defect T72 records). See *What changed and why*.

## Story

As a **Convoke maintainer**,
I want the classification ratchet to check the manifest rows an operator actually receives,
so that **a green check means something and a red one is repairable**.

### What this story is, in one line

Point Test 1b at the **filtered** manifest — the rows whose `path` resolves, which is what
`refreshInstallation` actually seeds — so the four permanent unrepairable findings fall out
legitimately and the ratchet starts meaning what it says.

---

## Acceptance Criteria

**AC1 — Test 1b validates the seeding set, not the candidate list**

**Given** `refresh-installation.js:529-540` documents the shipped manifest as a **CANDIDATE list**
(I139) and seeds a manifest **filtered by path existence**, printing `Created skill-manifest.csv
(N/106 skills present)`
**When** this story completes
**Then** `tests/lib/portability-validation.test.js` Test 1b validates that filtered set rather than
the raw 106-row file
**And** the filter is applied by the **same predicate the installer uses**, imported or derived from
it — never reimplemented, or the test and the installer drift into disagreeing about what ships
**And** Test 1a is left unchanged: it exercises the validator against the dependency-closed fixture
and answers a different question (*is the validator correct?*), which this story does not touch

**AC2 — The baseline empties, and the ratchet survives**

**Given** the four `[BROKEN-DEP]` findings all sit on rows whose `path` does not resolve, so none of
them ever seeds into an operator's project
**When** Test 1b validates the filtered set
**Then** those four findings are no longer reported, and their lines are deleted from
`.github/expected-classification-findings.txt`
**And** the file itself is **kept, not deleted** — it becomes empty, and the ratchet still fails on
any NEW hard finding against a seeding row. An empty baseline is the goal state; a missing baseline
is a removed gate
**And** the count of removed lines is derived at implementation time, not carried from this story

**AC3 — The check cannot pass vacuously**

**Given** filtering is exactly the operation that could reduce the validated set to nothing, and
`project-context.md` records two 2026-08-15 checks that reported success without doing their work
**When** Test 1b runs
**Then** it asserts the filtered set is non-empty before evaluating findings, in the shape Test 1a
already uses (`assert.ok(totalSkills > 0, …)`)
**And** it asserts a **floor** on the filtered count rather than merely non-zero — measured at
**31** rows in this tree today (`core` 11, `bmm` 1, `bme` 19), re-derived at implementation time —
so a filter that silently collapses to two rows fails rather than passes

**AC4 — The coverage trade is recorded, not discovered**

**Given** this story **reduces** what Test 1b examines in a clean checkout, from 106 candidate rows
to the ~31 that resolve
**When** this story completes
**Then** the loss is stated plainly in the test's own comment: a genuinely broken dependency on a
**non-seeding** upstream row will no longer be caught in CI
**And** the reason it is acceptable is stated with it — those 75 rows' content lives only in
gitignored `.claude/skills/` (`.gitignore:62`), so CI could never validate them; the coverage being
given up was already unreachable, and the four findings it produced were unrepairable
**And** the mitigation is named: Test 1a's fixture is where upstream-shaped rows get real coverage,
and extending the fixture is the way to add it back

**AC5 — The trap is documented at the code, not just in the archive**

**Given** repointing `path` at `.claude/skills/` was attempted 2026-08-10 (`4ed770a0`) and reverted
within the hour (`8f2fbda0`) because those paths are gitignored and it "produces a false green" —
and the archive records that this trap **"has now caught three attempts"**
**When** this story completes
**Then** a comment at Test 1b names the trap, the two commits and
`convoke-note-backlog-completed-archive.md:355`, so the next reader meets the warning where the
temptation is rather than only in an archive they have no reason to open
**And** no manifest `path` cell is edited by this story

---

## Tasks / Subtasks

- [x] **T1 — Locate and reuse the installer's filter predicate** (`refresh-installation.js:529-540`); export it if it is inline, so test and installer share one definition
- [x] **T2 — Repoint Test 1b at the filtered set** (`tests/lib/portability-validation.test.js:117-146`); leave Test 1a alone
- [x] **T3 — Non-vacuity floor** (AC3), derived at implementation time
- [x] **T4 — Empty the baseline**, keep the file, confirm the ratchet still fires by planting a synthetic broken dep on a *seeding* row and observing red, then removing it
- [x] **T5 — Comments** recording the coverage trade (AC4) and the trap (AC5)
- [x] **T6 — Close I134** against this story in the same session the code ships, with the row reflecting *premise refuted / check rescoped*, not *dependencies repaired*

### Review Findings

Round 1 — Blind Hunter, Edge Case Hunter and Acceptance Auditor as independent `claude-sonnet-5`
subagents. 16 raw, 11 after dedup: **0 decision-needed, 7 patch, 4 defer.** No HIGH.

- [x] **[Review][Patch] My "correction" of the story's module split was wrong, and had reached four places** [4 files] — **the headline.** I recorded `core` 12 / `bme` 19 and asserted the story's `core 11, bmm 1, bme 19` was mistaken. The story was right. I grouped by the second **path segment**; it grouped by the manifest's **`module` column**, and they differ on exactly one row (`bmad-create-prd`: path under `_bmad/core/`, module `bmm`). Same 31 rows, different basis. `verification-basis` failing in the direction that looks like diligence — I did re-derive, against the wrong basis. Corrected in the shipped test comment, this record, the Change Log and the I134 receipt, each keeping the wrong figure visible as history.
- [x] **[Review][Patch] `manifestRowSeeds` does not disclose that containment is lexical, so a symlink escapes it** [scripts/update/lib/refresh-installation.js] — Blind Hunter reproduced it against `/etc/passwd`: `path.resolve` collapses `..` textually and `statSync` follows symlinks. Pre-existing behaviour, but the docblock advertised two guards and named no limits, and the function is now **exported and read by a test** — an undisclosed limit in a shared predicate is worse than one in a private block. Limits documented; the fix belongs with the symlink-containment class already filed from `dist-2-2` Round 3.
- [x] **[Review][Patch] A truthy non-string `rel` threw out of the predicate** [same] — `if (!rel)` catches empty and undefined but not a number or object, and `path.resolve` then throws a TypeError outside the caller's try/catch. Now `typeof`-guarded; verified against `42`, `{}`, `null`, `undefined`, `''`.
- [x] **[Review][Patch] The baseline file's own "a missing baseline is a removed gate" claim was enforced by nothing** [tests/lib/portability-validation.test.js] — deleting it produced a raw ENOENT stack, not the diagnostic the header promises. Now asserted explicitly.
- [x] **[Review][Patch] Baseline parsing was whitespace-fragile** [same] — a leading space before `#` made a comment into a phantom expected finding; trailing whitespace made a real line read as both appeared AND resolved. Lines are trimmed before use. Matters more now the file is comment-only.
- [x] **[Review][Patch] AC4's coverage-trade comment implied a second gap without naming it** [same] — nothing checks whether a SEEDING row's bare-name dependency points at a row that also seeds. Named explicitly, with both live examples and why neither existing finding type can cover it.
- [x] **[Review][Patch] "35 installer tests green" was unreproducible as written** [this record] — both Blind Hunter and the Auditor tried and failed to reconstruct which files it meant. Now names them.

**Deferred (4), in `deferred-work.md`:** Test 1b's flakiness under the parallel suite (a false red in 1 of 4 runs — the only test validating against live `REPO_ROOT`); the missing finding type for seeding-row-depends-on-non-seeding-row; the floor's arbitrariness; and `rowFilter` aborting the run where the loop beneath it degrades gracefully.

**What Round 1 verified clean, having been told to doubt it:** the trap was not walked into (`skill-manifest.csv` appears nowhere in the diff); the extraction is behaviour-preserving, verified against the pre-extraction block on adversarial inputs; `validate()`'s default path is byte-identical for all ten other callers; the vocabulary asymmetry is correctly reasoned, with the `.claude/skills/` claim independently checked rather than taken on faith; all seven re-derived citations are exact; the ratchet fires on a live plant; and every gate figure reproduced. **Blind Hunter independently hit the same vacuous-plant trap I did** — its first plant silently failed on CRLF line endings — and caught it the same way, by grepping for the planted string before trusting the run.

---

## Dev Notes

### What changed in this story, and why

The previous story asked for each of four `[BROKEN-DEP]` findings to be *"individually confirmed and
resolved — path corrected, or dependency dropped if the template is genuinely gone."* Neither
resolution exists:

- **The templates are not gone.** `readiness-report-template.md` and `epics-template.md` are both on
  disk right now — but only under **gitignored** `.claude/skills/`, so pointing at them produces a
  green that evaporates in a clean checkout.
- **The paths are not correctable.** Upstream `a16fa340` (2026-06-27) deleted Convoke's vendored
  copy of upstream skill content — 1,227 files changed, tracked `SKILL.md` from 122 to 44. The
  content is deliberately not returning.

**The premise was refuted before this story was written.**
`convoke-note-backlog-completed-archive.md:355` was closed 2026-08-15 as NOT A DEFECT and kept
explicitly as a warning: the 75/106 non-resolution *"looks like rot — it is not"*, because the
shipped manifest is a **candidate list by design**. The 2026-08-30 readiness assessment reproduced
the same wrong reasoning and proposed a possible 75-row repair; `55506ea8` doubted the premise and
`075651e5` reverted ADR-005, which had been written to answer a question the archive already
answered.

So the open question was never *how to repair the dependencies*. It is **what tree Test 1b
validates** — and this story answers it: the tree an operator gets.

### The two tests, and why only one moves

| | Root | Question it answers | This story |
|---|---|---|---|
| Test 1a | `FIXTURE_ROOT` | Is the validator correct? | untouched |
| Test 1b | `REPO_ROOT` (raw 106 rows) | Has a shipped dependency broken? | **→ filtered set** |

The split was deliberate and good — the existing comment says it *"keeps both signals instead of
trading one for the other."* This story does not undo it; it corrects the second signal's subject.

### Measured, so the story does not carry an estimate

```
manifest rows: 106; paths resolving in this tree: 31
  surviving: core 11, bmm 1, bme 19
  dropped:   bmm 32, wds 15, tea 10, cis 10, bmb 5, core 3
```

Re-derive at implementation time (`derive-counts-from-source`).

### Disproved — do not re-raise

- *"Repoint `path` at `.claude/skills/`."* Made and reverted 2026-08-10. `tests/lib/portability-preconditions.js` stated it outright: *"Do NOT 'fix' a failing portability suite by pointing manifest paths at `.claude/skills/...`. Those paths are gitignored; it produces a false green."*
- *"The manifest is stale and needs a 75-row repair."* It is a candidate list; the drop is deliberate, filtered at install and printed to the operator.
- *"The four findings are inaccurate."* They are accurate. They are simply not repairable, and not about rows anyone receives.

### Cross-story dependencies

- **Independent of 2.1-2.7.** May run at any point.
- **I134** closes against this story — as *premise refuted, check rescoped*.
- **T36** is the adjacent residual (a BMAD upgrade after install leaves a seeded manifest stale with nothing to re-seed). Out of scope; do not absorb it.

### References

- `convoke-note-backlog-completed-archive.md:355` — the closed row, kept as a warning. **Read first.**
- `refresh-installation.js:529-540` (I139 candidate-list contract), `:588` (the operator-visible count)
- `tests/lib/portability-validation.test.js:100-146`; `tests/fixtures/portability-project/README.md`
- `4ed770a0` → `8f2fbda0` (the repoint and its revert); `55506ea8`, `075651e5`

---

## Commit Plan

```
fix(dist-2-8): validate the manifest set that seeds, not the candidate list
```

Body must record: the derived filtered count, the removed baseline lines, the planted-finding
demonstration from T4, and I134's close as *premise refuted* rather than *repaired*.

---

## Change Log

| Date | Change |
|---|---|
| 2026-09-07 | **Implemented. All 5 ACs met; I134 closed as premise refuted.** Test 1b now validates the **31 of 106** rows that seed (`core` 11, `bmm` 1, `bme` 19 — the story's figure, which was correct; my first "correction" of it was wrong and Round 1 disproved it), using the installer's **exported** predicate rather than a copy. Baseline emptied 4 → 0, file kept, ratchet re-proven live by planting a broken dep on a seeding row. **No `path` cell edited** — the trap that has caught four attempts is now documented at the test with both commit SHAs. **Two things caught by measuring rather than reasoning:** filtering the row set also filtered `[ORPHAN-DEP]`'s vocabulary, silently changing a typo check into a seeding check and producing two spurious findings — reverted once the finding type's own definition was read; and my first ratchet falsification passed vacuously because the planting script had thrown, caught only by verifying the fixture landed. |
| 2026-08-31 | Re-authored and renamed from `dist-2-8-repair-the-broken-dependencies-in-the-shipped-manifest`. Old ACs asked for a repair that cannot be performed; premise refuted by archive:355. Rescoped to what Test 1b validates, per operator ruling (option 2, filtered/seeding set). |

---

## Dev Agent Record

### Agent Model Used

claude-opus-5[1m]

### Completion Notes List

**AC1 — the seeding set, via the installer's own predicate.** *(Installer regression check: the 35
figure below is `node --test` over `refresh-installation-bmm-deps`, `-artifacts` and `-portability`
— named because two Round 1 reviewers independently could not reconstruct which files it meant.)* The filter was inline in
`refreshInstallation`; it is now `manifestRowSeeds(rel, projectRootResolved)`, exported, and the
installer calls it. `validate()` gained an optional `rowFilter`, so dependency paths still resolve
against the real tree and only the examined ROWS narrow. Test 1b passes the exported predicate —
never a reimplementation, which is what AC1 forbids and what would let the test and installer drift
into disagreeing about what ships. The extraction is behaviour-preserving: 35 installer tests green,
and the predicate still yields the same 31 rows.

**AC1 — Test 1a untouched**, as required. It answers a different question against the fixture.

**AC2 — the baseline emptied, and the file was kept.** **4** lines removed, derived. All four sat on
rows whose `path` does not resolve, so none ever seeds. The file now carries only its header
comment, which states that an empty baseline is the goal state and a missing one is a removed gate.

**AC3 — non-vacuity floor.** `totalSkills >= 25` against a measured **31**, plus the `> 0` guard.
Set below the measurement so ordinary churn does not trip it, high enough that a filter collapsing
to a handful fails loudly.

**COUNTS RE-DERIVED — AND MY FIRST "CORRECTION" WAS ITSELF WRONG, WHICH IS THE MORE USEFUL RESULT.**
Measured 2026-09-07: **31 of 106 rows seed — `core` 11, `bmm` 1, `bme` 19**, which is exactly what
the story's Dev Notes said. It was right.

I had recorded `core` 12 / `bme` 19 and stated the story was wrong. It was not: I grouped by the
**second path segment** while the story grouped by the manifest's own **`module` column**, and the
two disagree on exactly one row — `bmad-create-prd`, whose `path` is under `_bmad/core/` but whose
`module` is `bmm`. Same 31 rows, different basis, and I asserted a correct figure was mistaken.

That is `verification-basis` failing in the direction that looks like diligence: I re-derived, as
the story told me to, but against a basis the claim was not about. **The false correction reached
four places** — a shipped code comment in `tests/lib/portability-validation.test.js`, this record,
the story Change Log, and the I134 receipt in the backlog — before Round 1's Acceptance Auditor
reproduced the real split and disproved it. All four are corrected.

**A DESIGN DECISION I GOT WRONG AND CAUGHT BY MEASURING.** My first implementation derived
`validSkillNames` from the FILTERED rows, reasoning that a dependency on a non-seeding row is
genuinely absent from the operator's project. That produced **two new `[ORPHAN-DEP]` findings** —
`bmad-help` → `bmad-quick-dev`, and `bmad-migrate-artifacts` → `bmad-create-epics-and-stories` —
which would have contradicted AC2's "the baseline empties". Rather than add them to the baseline or
argue, I checked what the finding type is defined to mean. This file's own header says
`[ORPHAN-DEP] bare skill-name dep **not in manifest**`, and the report calls it *"Skill-name
dependencies that don't exist in the manifest"*: a **typo check against the manifest's vocabulary**.
Both targets ARE real manifest rows; they merely fail to resolve *in this repo*, because upstream
content was deleted here by `a16fa340` — in an operator's project with BMAD installed they resolve
and seed normally. Filtering the vocabulary silently redefined the check. **The filter narrows which
rows are examined; it must not narrow what counts as a known skill name.** Reverted, with the
reasoning recorded at the code. Findings then went to zero, as AC2 predicted.

**AC4 — the coverage trade is stated at the test**, not left to be discovered: a genuinely broken
dependency on a NON-seeding upstream row is no longer caught here; that coverage was already
unreachable because CI cannot see gitignored content; Test 1a's fixture is the place to add it back.

**AC5 — the trap is documented at the code.** Test 1b's comment names `4ed770a0`, `8f2fbda0`,
`.gitignore:62` and `convoke-note-backlog-completed-archive.md:355`, and says plainly that
repointing `path` at `.claude/skills/` produces a false green. **No manifest `path` cell was edited
by this story** — verified: the only manifest change in the diff is none.

**T4 — the ratchet was re-proven live, and my first attempt at proving it was itself broken.**
A broken dependency was planted on a row that DOES seed:

```
PLANTED on seeding row: bmad-advanced-elicitation
  occurrences in file: 1          <- fixture VERIFIED before running
  15 pass, 1 fail — "NEW hard classification finding(s) — a skill dependency broke"
restored: 16 pass, 0 fail; manifest byte-identical
```

**The first attempt reported a clean pass and meant nothing** — the planting script threw on a
header parse, so nothing was planted, and the green was vacuous. It was caught only by checking that
the plant had landed. This is `dist-2-7`'s lesson arriving one story later: *a falsification that
does not verify its own fixture is itself a check that cannot fail.* The verification step above is
now part of the demonstration, not an afterthought.

**Citation alarm fired again, and correctly.** Extracting the predicate shifted
`refresh-installation.js`, so seven line citations in `scripts/audit/lib/installed-tree.js` went
stale and the alarm failed the suite. All seven re-derived mechanically — no offsets computed, each
looked up by anchor.

**The CLI is unchanged and is not a gate.** `node scripts/portability/validate-classification.js`
still reports the full 106 rows and 4 errors, because `main()` calls `validate(projectRoot)` with no
options and the new parameter defaults to the previous behaviour. Verified it appears in neither
`.github/workflows/ci.yml` nor any npm script. Noting the resulting asymmetry deliberately: the CLI
now says FAIL while CI says green, and a developer running it by hand could reasonably be confused.

**Gates, each run against this change.**

```
npm test                 2216 tests, 2215 pass, 0 fail, 1 pre-existing skip
lint                     clean (eslint --max-warnings 0)
docs:audit               zero findings
backlog-integrity        PASS — 816 rows (815 + I134's receipt)
agent-surface-parity     PASS (vs v4.0.1, the tag CI uses)
install-scope-check      PASS
skill-manifest-integrity PASS
```

### File List

**Modified**
- `scripts/update/lib/refresh-installation.js` — seeding predicate extracted to `manifestRowSeeds` and exported; installer calls it
- `scripts/portability/validate-classification.js` — optional `rowFilter`; vocabulary explicitly kept at the full manifest
- `scripts/audit/lib/installed-tree.js` — seven line citations re-derived after the extraction shifted the file
- `tests/lib/portability-validation.test.js` — Test 1b repointed at the seeding set, floor, coverage-trade and trap comments
- `.github/expected-classification-findings.txt` — emptied to zero findings, file kept, header rewritten
- `_bmad-output/planning-artifacts/convoke-note-initiative-lifecycle-backlog.md` — I134 closed as premise refuted; Change Log entry
- `_bmad-output/implementation-artifacts/sprint-status.yaml` — status transitions
- `_bmad-output/implementation-artifacts/dist-2-8-validate-the-manifest-set-that-actually-seeds.md` — this record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
