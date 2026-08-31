# Story 2.8: Validate the manifest set that actually seeds

Status: ready-for-dev

<!-- baseline_commit deliberately ABSENT — it is `dev-story`'s field, stamped at implementation start. -->

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

- [ ] **T1 — Locate and reuse the installer's filter predicate** (`refresh-installation.js:529-540`); export it if it is inline, so test and installer share one definition
- [ ] **T2 — Repoint Test 1b at the filtered set** (`tests/lib/portability-validation.test.js:117-146`); leave Test 1a alone
- [ ] **T3 — Non-vacuity floor** (AC3), derived at implementation time
- [ ] **T4 — Empty the baseline**, keep the file, confirm the ratchet still fires by planting a synthetic broken dep on a *seeding* row and observing red, then removing it
- [ ] **T5 — Comments** recording the coverage trade (AC4) and the trap (AC5)
- [ ] **T6 — Close I134** against this story in the same session the code ships, with the row reflecting *premise refuted / check rescoped*, not *dependencies repaired*

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
| 2026-08-31 | Re-authored and renamed from `dist-2-8-repair-the-broken-dependencies-in-the-shipped-manifest`. Old ACs asked for a repair that cannot be performed; premise refuted by archive:355. Rescoped to what Test 1b validates, per operator ruling (option 2, filtered/seeding set). |

---

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
