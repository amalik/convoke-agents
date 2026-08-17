---
initiative: convoke
artifact_type: note
qualifier: backlog-cleanup-proposal
created: '2026-08-17'
schema_version: 1
status: draft
origin: 'Amalik → John, 2026-08-17: backlog is messy; done items split across sections'
---

# Backlog Cleanup — Draft Proposition

**Status:** draft for Amalik's review. No edits made to the backlog.
**Date:** 2026-08-17 · **Author:** John (PM)
**Subject:** [convoke-note-initiative-lifecycle-backlog.md](../planning-artifacts/convoke-note-initiative-lifecycle-backlog.md)

---

## 1. Root cause — the spec contradicts itself

You are not looking at sloppiness. You are looking at two rules in the same file that
cannot both be obeyed:

| Where | Rule |
|-------|------|
| `backlog-format-spec.md` §Lane Ordering, clause 3 | Closed rows **"stay in the lane for provenance"**, sorted below the live block. |
| `backlog-format-spec.md` §Moving Items Between Sections | **"Any → §2.5 Completed (shipped): Move row to Completed sub-table with shipping date."** |

Both are followed — by different writers, on different days. That is the whole
phenomenon: 24 closed rows parked in lanes, 66 in §2.5.

It is already diagnosed in your own intake log, unqualified:

- **IN-185** — no workflow mode can perform the §2.5 transition at all. So lane-parking
  isn't a choice; it's what happens when the tooling can't do the move.
- **IN-186** — RED staleness items are routed to a mode that structurally can't re-qualify them.
- **IN-187** — Review mode's pre-write validation asserts column counts 10/9/10 against real
  tables of 11/10/11, so it fails on every run and is always bypassed.
- **IN-188** — nothing asserts table shape, so malformed rows survive.

Fixing the sort without fixing the contradiction re-creates the mess next month.

---

## 2. Measured state

```
File               1,116 lines · 543 KB · ~120k tokens  (exceeds a single agent read)
§2.1 Intakes       188 rows   (append-only — correct by design)
§2.2 Bug            13 rows   →   7 live,  6 closed-in-lane
§2.3 Fast          226 rows   → 208 live, 18 closed-in-lane
§2.4 Initiative     18 rows   →  18 live,  0 closed        ← wrong, see §3
§2.5 Archive        72 rows   (4 + 2 absorbed, 66 completed)
```

**Lane order:** 8 live violations right now (project-context check):

```
Bug:  BUG-19 (5.7) below BUG-17 (4.5)          Fast: T41 (5.4) below T38 (4.5)
Bug:  BUG-9 (live) below closed BUG-12         Fast: T40 (9.5) below T41 (5.4)
Init: I113 (1.5) below P2 (0.4)                Fast: T35 (live) below closed T39
                                               Fast: T37 (2.6) below T36 (2.4)
                                               Fast: T18 (2.7) below T37 (2.6)
```

**Malformed rows:** `BUG-14` sits in the 5-column §2.5 Completed table carrying 11 columns.
`D14` has a 2-column marker row inside the 10-column Fast Lane.

**Live-row score distribution** (232 live rows):

```
 ≥5.0    10      ← the actual working set
 3–5     30
 2–3     43
 1–2     57
 <1.0    85      ← 37% of the lane, effectively never reachable
 untriaged 7
```

**Good news, so you don't over-correct:** anchor rot is *not* the problem. Of 232 live rows,
only 15 cite a path that cannot be resolved, and most of those are legitimately "to be
created" (`cli-guidance-check.js` was deliberately withdrawn; `lint-touched.js` is the
deliverable). `scripts/audit/backlog-integrity.js` passes over 318 rows. The bones are sound;
the filing is not.

---

## 3. Stale statuses — confirmed by execution, not by reading

**The flagship row is stale.** §2.4 `U10+P23+A8+A9` reads **In Sprint**. But:

```
package.json          4.0.0
git tag               v4.0.0
npm dist-tags         { latest: 4.0.0, rc: 4.0.0-rc.6 }
```

v4.0 shipped. The row should be Done.

**Two story files never flipped either:**

- `v63-4-5` says `ready-for-dev` — yet its N=1 validation report exists and BUG-19 was raised
  *from* that session.
- `v63-5b-3` says `ready-for-dev` — yet the version is bumped, the tag is created, npm is
  published, the playbook reads `winston_signoff_status: signed-off`, and 0 `TODO-5B3` markers
  remain.

**And one deliverable that is genuinely still open, hiding behind that stale status:**

> **The v4.0.0 GitHub release does not exist.** `gh release list` tops out at `v3.3.0`
> (2026-04-19). The tag is pushed and npm has the package, but no release was published.
> This is Story 5B.3's last gate, and it is open.

**One dependency has fired:** I113 (v4.1) carries `depends: I97 close (v4.0 ship)`. The
trigger has now fired, so the `staleness-preflight-for-backlog-pickup` rule is due on it —
against the **full elapsed window** from original qualification, per the trigger-blocked
exemption.

---

## 4. Proposal

### Decision 1 — where do closed rows live? *(need your call)*

**Recommend: everything closed sweeps to §2.5.** It is what you asked for, it matches the
majority precedent already in the file (BUG-2/5/6/8 are in §2.5; BUG-7/10/11/12/15/16 are not),
and it shrinks the lanes to what is actionable: Fast 226 → 208, Bug 13 → 7.

The alternative — closed rows stay in-lane, §2.5 becomes absorbed-only — is cheaper (no
content moves) but means dragging 66 rows *back* into the lanes, and it is not what you asked
for.

Whichever wins, **`backlog-format-spec.md` gets amended in the same change** so the losing
clause is deleted, not left to fire again.

### Decision 2 — the prose problem *(need your call)*

The closed rows are not one-liners. `BUG-16` and `BUG-12` are multi-thousand-character
post-mortems, and they are the best institutional memory in the repo. Raw totals:

```
closed-in-lane prose   56 KB
§2.5 completed prose   67 KB
live-in-lane prose    119 KB
```

Sweeping as-is makes §2.5 a 120 KB wall. Three options:

- **(a) Sweep verbatim.** Zero information loss, §2.5 becomes most of the file. Cheapest.
- **(b) Sweep with a one-line summary; full post-mortem moves to a sibling archive file**
  (`convoke-note-backlog-completed-archive.md`), linked by ID. Best readability, one more
  governed artifact to name and register.
- **(c) Sweep verbatim now, split later** as its own item.

I lean **(b)**, because it also fixes the 120k-token problem in §5 — but it is a governed
artifact creation, so it is your call, not mine.

### Actions — mechanical, no judgment needed

1. **Fix the 8 sort violations** and the 2 malformed rows (`BUG-14`, `D14`).
2. **Amend `backlog-format-spec.md`** to remove the contradiction (follows Decision 1).
3. **Close `U10+P23+A8+A9`** → Done 2026-08-17 with the npm/tag evidence in the cell.
4. **Open a Bug/Fast row for the missing v4.0.0 GitHub release** — a real open deliverable,
   currently invisible.
5. **Flip `v63-4-5` and `v63-5b-3` story files** to `done`, citing the evidence above.
6. **Qualify IN-185/186/187/188** into the Fast Lane. They are the durable fix for this whole
   class, and they have been sitting unqualified while the symptom recurs.

### Actions — the item-by-item audit you asked for

232 live rows is too many for one pass, and the last time an audit sprawled it cost us. I
propose banding it, hardest evidence first:

| Pass | Scope | Rows | What it does |
|------|-------|------|--------------|
| **P1** | Score ≥ 3.0 | 40 | Full 4-check staleness pre-flight per `project-context.md`. These are the rows anyone would actually pick up. |
| **P2** | Anything citing v4.0 / rc / release work | ~20 | v4.0 shipped since most were written; expect several already-done. This is where the yield is. |
| **P3** | Score 1.0–3.0 | 100 | Existence check only — has it shipped? Not a full pre-flight. |
| **P4** | Score < 1.0 | 85 | **Do not audit. Age out** — see below. |
| **P5** | 7 untriaged rows + the 4 intakes above | 11 | RICE them or park them explicitly. |

P1+P2 is the session that pays for itself. P3 is a second session. I'd stop there.

### Decision 3 — the cold tail *(need your call)*

85 live rows score below 1.0. At your throughput they will never be reached, and they are 37%
of what a reader scrolls past to find the 10 rows that matter. Proposal: **age-out policy** —
a row below a score floor and untouched for N months moves to §2.5 with an
`Aged out YYYY-MM-DD` receipt. Nothing is deleted; the receipt rule holds. Reinstating one is
a single move if it ever matters again.

Suggested floor 0.5 (moves ~45 rows) or 1.0 (moves 85). This needs your number, not mine.

---

## 5. Making the doc usable — beyond the cleanup

The deepest usability problem is not sorting. It is that **no agent can read this file.** At
~120k tokens it exceeds a single read; I had to parse it with scripts to answer your question,
and any future agent will hit the same wall — which is precisely why hand-edits keep landing
malformed.

Three levers, in order of payoff:

1. **Split Part 1 out.** The lifecycle process (lines 20–201) is semi-static and already exists
   verbatim at `_bmad/bme/_enhance/workflows/initiatives-backlog/templates/lifecycle-process-spec.md`.
   It is duplicated into the operational file for no operational reason. Replace with a link.
2. **Split the archive out** (Decision 2b). §2.5 + closed prose is ~120 KB of receipts that are
   read approximately never, sitting in front of the 10 rows that are read weekly.
3. **Wire the shape check into CI.** `backlog-integrity.js` already exists and passes, but only
   covers `BUG-n`/`T-n` references. Extend it to (a) lane ordering — the check is already
   written, in `project-context.md`, and runs nowhere — (b) per-table column arity, and
   (c) `I-n`/`A-n`/`D-n`/`U-n`/`P-n` references. This is IN-188's actual fix and it closes the
   loop that lets hand-edits land broken. **This is the one that makes the cleanup stick.**

Without lever 3, we will be having this conversation again.

---

## 6. Deliberately not in scope

- Re-scoring RICE across the board. Ordering is broken because rows aren't sorted, not because
  the scores are wrong.
- Re-litigating lane assignments.
- Touching §2.1 intake rows other than the four qualifications above. Append-only is correct.
- Any change to `_bmad/` runtime code. This is an artifact + spec + CI-check change.

---

## 7. What I need from you

1. **Decision 1** — closed rows sweep to §2.5 (recommended), or stay in lane?
2. **Decision 2** — sweep verbatim (a), summary + archive file (b, recommended), or defer (c)?
3. **Decision 3** — age-out floor: 0.5, 1.0, or no age-out?
4. Do you want the mechanical actions (1–6) in **one commit** or split per concern? My commit
   plan follows your answer.
