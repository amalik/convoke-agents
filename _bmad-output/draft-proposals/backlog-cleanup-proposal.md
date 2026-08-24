---
initiative: convoke
artifact_type: note
qualifier: backlog-cleanup-proposal
created: '2026-08-17'
schema_version: 1
status: draft
origin: 'Amalik → John, 2026-08-17: backlog is messy; done items split across sections'
revised: '2026-08-24'
---

# Backlog Cleanup — Draft Proposition

**Status:** draft for Amalik's review. No edits made to the backlog.
**Written:** 2026-08-17 · **Revised:** 2026-08-24 (re-verified at `493dd2da`) · **Author:** John (PM)
**Subject:** [convoke-note-initiative-lifecycle-backlog.md](../planning-artifacts/convoke-note-initiative-lifecycle-backlog.md)

> **Revision note (2026-08-24).** Re-verified against HEAD after the 4.0.1
> distribution-integrity epic. Two findings died, one was reframed, the core one got worse.
> Changes are logged in §8 so the original record stays auditable.

---

## 1. Root cause — the spec contradicts itself

You are not looking at sloppiness. You are looking at two rules in the same file that
cannot both be obeyed:

| Where | Rule |
|-------|------|
| `backlog-format-spec.md:229` §Lane Ordering, clause 3 | Closed rows **"stay in the lane for provenance"**, sorted below the live block. |
| `backlog-format-spec.md:318` §Moving Items Between Sections | **"Any → §2.5 Completed (shipped): Move row to Completed sub-table with shipping date."** |

Both are followed — by different writers, on different days. That is the whole
phenomenon: 32 closed rows parked in lanes, 66 in §2.5.

**Both lines are verbatim unchanged as of 2026-08-24.** In the intervening week the
`dist-*` epic closed eight more rows *in place* (§2), exactly as clause 3 instructs, while
§2.5 took none. The split is not drifting shut on its own; it widens every time work ships.

It is already diagnosed in your own intake log, still unqualified after nine days:

- **IN-185** — no workflow mode can perform the §2.5 transition at all. So lane-parking
  isn't a choice; it's what happens when the tooling can't do the move.
- **IN-186** — RED staleness items are routed to a mode that structurally can't re-qualify them.
- **IN-187** — Review mode's pre-write validation asserts column counts 10/9/10 against real
  tables of 11/10/11, so it fails on every run and is always bypassed.
- **IN-188** — nothing asserts table shape, so malformed rows survive.

Fixing the sort without fixing the contradiction re-creates the mess next month.

---

## 2. Measured state

Figures are as of 2026-08-24; the 2026-08-17 reading is shown where it moved.

```
File               1,146 lines · 591 KB · ~130k tokens   (was 1,116 / 543 KB)
§2.1 Intakes         188 rows   (append-only — correct by design)  unchanged
§2.2 Bug              13 rows   →   7 live,  6 closed-in-lane      unchanged
§2.3 Fast            239 rows   → 213 live, 26 closed-in-lane      (was 226 → 208 / 18)
§2.4 Initiative       18 rows   →  18 live,  0 closed              unchanged, and wrong — see §3
§2.5 Archive          72 rows   (4 + 2 absorbed, 66 completed)     unchanged
```

The Fast Lane grew by 13 rows — `T42` through `T54`, every one filed by the 4.0.1
distribution-integrity epic. Eight rows became closed **in the lane** in the same window: six
flipped there (`I96`, `T40`, `I108`, `T35`, `T32`, `T41`) and two arrived already closed
(`T46`, `T50`). No row was removed.

**Lane order:** 6 live violations, down from 8. Four cleared by the `dist-*` work
(T41 repositioned, T40 closed, T35 rescued); one is new.

```
Bug:  BUG-19 (5.7) below BUG-17 (4.5)          Fast: T37 (2.6) below T36 (2.4)
Bug:  BUG-9 (live) below closed BUG-12         Fast: T18 (2.7) below T37 (2.6)
Fast: I105 (live 3.2) below closed I96  ← new  Init: I113 (1.5) below P2 (0.4)
```

**Malformed rows — both still present:** `BUG-14` sits in the 5-column §2.5 Completed table
carrying 11 columns. `D14` has a 2-column marker row inside the 10-column Fast Lane.

**Live-row score distribution** (237 live rows; 2026-08-17 in brackets):

```
 ≥5.0    14  [10]   ← the actual working set
 3–5     32  [30]
 2–3     43  [43]
 1–2     56  [57]
 <1.0    85  [85]   ← 36% of the lane, effectively never reachable — unmoved in 9 days
 untriaged 7  [7]
```

**Good news, so you don't over-correct:** anchor rot is *not* the problem, and did not grow.
15 of 237 live rows cite a path that cannot be resolved, and most are legitimately "to be
created". `scripts/audit/backlog-integrity.js` passes over 331 rows in CI. The bones are
sound; the filing is not.

---

## 3. Stale statuses — confirmed by execution, not by reading

**The flagship row is stale, and now doubly so.** §2.4 `U10+P23+A8+A9` reads **In Sprint**.
But two releases have shipped since it was written:

```
package.json          4.0.1
git tags              v4.0.1, v4.0.1-rc.0, v4.0.0
npm dist-tags         { latest: 4.0.1, rc: 4.0.1-rc.0 }
GitHub releases       v4.0.1 (2026-08-23), v4.0.0 (2026-08-17)
```

**Two story files disagree with sprint-status.yaml.** `sprint-status.yaml` records both
`v63-4-5-n-1-external-user-validation-sprint-5` and
`v63-5b-3-complete-playbook-and-ship-release-artifacts` as `done`. Both **story files** still
read `Status: ready-for-dev`. Commit `6371f713`, titled *"close Story 5B.3, Epic 5B and I96"*,
touched only `.memlog.md` and the backlog — it closed the backlog row, not the story file.
Two sources of truth, disagreeing, with the authoritative one unclear.

**A dependency has fired.** I113 (v4.1) carries `depends: I97 close (v4.0 ship)`. v4.0 shipped
2026-08-17 and v4.0.1 on 2026-08-23, so the `staleness-preflight-for-backlog-pickup` rule is
now due on it — against the **full elapsed window** from original qualification, per the
trigger-blocked exemption.

---

## 4. Proposal

### Decision 1 — where do closed rows live? *(need your call)*

**Recommend: everything closed sweeps to §2.5.** It is what you asked for, it matches the
majority precedent already in the file (BUG-2/5/6/8 are in §2.5; BUG-7/10/11/12/15/16 are not),
and it shrinks the lanes to what is actionable: Fast 239 → 213, Bug 13 → 7.

The alternative — closed rows stay in-lane, §2.5 becomes absorbed-only — is cheaper (no
content moves) but means dragging 66 rows *back* into the lanes, and it is not what you asked
for.

**The last nine days are evidence for sweeping.** Clause 3 was followed faithfully by the
`dist-*` work and the in-lane closed count went 18 → 26. Left alone, this compounds.

Whichever wins, **`backlog-format-spec.md` gets amended in the same change** so the losing
clause is deleted, not left to fire again.

### Decision 2 — the prose problem *(need your call)*

The closed rows are not one-liners. `BUG-16` and `BUG-12` are multi-thousand-character
post-mortems, and they are the best institutional memory in the repo. Raw totals:

```
closed-in-lane prose    68 KB   (was 56 KB)
§2.5 completed prose    65 KB
live-in-lane prose     125 KB   (was 119 KB)
```

Sweeping as-is makes §2.5 a 130 KB wall. Three options:

- **(a) Sweep verbatim.** Zero information loss, §2.5 becomes most of the file. Cheapest.
- **(b) Sweep with a one-line summary; full post-mortem moves to a sibling archive file**
  (`convoke-note-backlog-completed-archive.md`), linked by ID. Best readability, one more
  governed artifact to name and register.
- **(c) Sweep verbatim now, split later** as its own item.

I lean **(b)**, because it also fixes the unreadable-file problem in §5 — but it is a governed
artifact creation, so it is your call, not mine.

### Actions — mechanical, no judgment needed

1. **Fix the 6 sort violations** and the 2 malformed rows (`BUG-14`, `D14`).
2. **Amend `backlog-format-spec.md`** to remove the contradiction (follows Decision 1).
3. **Close `U10+P23+A8+A9`** → Done, with the npm/tag/release evidence in the cell.
4. **Reconcile the two story files** with `sprint-status.yaml`, and decide which is
   authoritative when they disagree — the disagreement is the finding, not the flip.
5. **Qualify IN-185/186/187/188** into the Fast Lane. They are the durable fix for this whole
   class, and they have been sitting unqualified for nine days while the symptom recurred.

### Actions — the item-by-item audit you asked for

237 live rows is too many for one pass, and the last time an audit sprawled it cost us. I
propose banding it, hardest evidence first:

| Pass | Scope | Rows | What it does |
|------|-------|------|--------------|
| **P1** | Score ≥ 3.0 | 46 | Full 4-check staleness pre-flight per `project-context.md`. The rows anyone would actually pick up. |
| **P2** | Rows citing 4.0 / rc / dist-tag work | 20 | Two releases shipped since most were written; expect several already-done. Highest yield per minute. |
| **P3** | Score 1.0–3.0 | 99 | Existence check only — has it shipped? Not a full pre-flight. |
| **P4** | Score < 1.0 | 85 | **Do not audit. Age out** — see Decision 3. |
| **P5** | 7 untriaged rows + the 4 intakes above | 11 | RICE them or park them explicitly. |

P1+P2 is the session that pays for itself. P3 is a second session. I'd stop there.

The P2 set, named so it can be checked: `BUG-17`, `BUG-18`, `BUG-9`, `T30`, `T38`, `T43`,
`T44`, `T47`, `T49`, `U15`, `I76`, `I95`, `I156`, `D11`, `D13`, `T14`, `S3`, `I97`, `P58`,
`U10+P23+A8+A9`.

### Decision 3 — the cold tail *(need your call)*

85 live rows score below 1.0 — **the same 85 as nine days ago, none touched.** At your
throughput they will never be reached, and they are 36% of what a reader scrolls past to find
the 14 rows that matter. Proposal: **age-out policy** — a row below a score floor and untouched
for N months moves to §2.5 with an `Aged out YYYY-MM-DD` receipt. Nothing is deleted; the
receipt rule holds. Reinstating one is a single move if it ever matters again.

Suggested floor 0.5 (moves ~45 rows) or 1.0 (moves 85). This needs your number, not mine.

---

## 5. Making the doc usable — beyond the cleanup

The deepest usability problem is not sorting. It is that **no agent can read this file.** At
~130k tokens it exceeds a single read; I had to parse it with scripts to answer your question,
and any future agent will hit the same wall — which is precisely why hand-edits keep landing
malformed.

Three levers, in order of payoff:

1. **Split Part 1 out.** The lifecycle process (lines 20–201) is semi-static and already exists
   verbatim at `_bmad/bme/_enhance/workflows/initiatives-backlog/templates/lifecycle-process-spec.md`.
   It is duplicated into the operational file for no operational reason. Replace with a link.
2. **Split the archive out** (Decision 2b). §2.5 + closed prose is ~130 KB of receipts that are
   read approximately never, sitting in front of the 14 rows that are read weekly.
3. **Extend the CI gate.** `backlog-integrity.js` already runs in CI (`ci.yml:161`) and passes
   over 331 rows — but it asserts only that referenced `BUG-n`/`T-n` rows exist. **Nothing
   gates lane order or column arity.** The lane-order check is already written and lives in
   `project-context.md`, where it runs nowhere; the arity check was written alongside
   `backlog-integrity.js` and removed before shipping because §2.5's sub-tables have no single
   column contract. Both need a per-table contract to land. This is IN-188's actual fix.
   **It is the one that makes the cleanup stick.**

Without lever 3, we will be having this conversation again — and the last nine days are the
demonstration.

---

## 6. Deliberately not in scope

- Re-scoring RICE across the board. Ordering is broken because rows aren't sorted, not because
  the scores are wrong.
- Re-litigating lane assignments.
- Touching §2.1 intake rows other than the four qualifications above. Append-only is correct.
- Any change to `_bmad/` runtime code. This is an artifact + spec + CI-check change.

---

## 7. Decisions — RESOLVED 2026-08-24

Answered by Amalik, 2026-08-24.

| # | Decision | Ruling |
|---|----------|--------|
| 1 | Where closed rows live | **Sweep all to §2.5.** Lane Ordering clause 3 is deleted from `backlog-format-spec.md`; the §2.5 transition in "Moving Items Between Sections" becomes the single rule. |
| 2 | The prose problem | **Option (b) — summary + archive file.** §2.5 keeps a one-line summary per row; full post-mortems move to a sibling archive artifact, linked by ID. |
| 3 | The cold tail | **No age-out for now — explicitly temporary.** The 85 sub-1.0 rows stay live. Filed as a backlog row so the decision returns rather than lapsing by silence. |
| 4 | Commit granularity | Split per concern (default, unopposed). Each commit leaves the tree consistent. |

**On Decision 3.** "Temporary" is doing real work in that sentence. A deferral that lives only
in a chat transcript is indistinguishable from a decision never made — which is the exact
failure mode §1 documents for IN-185 through IN-188, unqualified for nine days while their
symptoms recurred. So the deferral gets a row of its own, and the 85 rows stay visible in the
meantime.

### Execution order — as run

The order below is **not** the one first drafted here. Extraction showed why: the mechanical
fixes had been listed before the sweep, but two of the six "sort violations" were live rows
sitting under *closed* ones, and both dissolve the moment the closed rows leave the lane.
Sorting first would have produced an arrangement the sweep immediately invalidated. Likewise
`D14`'s malformed 2-column row and the `U10+P23+A8+A9` close are not separate fixes at all —
under the amended spec they *are* closing moves, so they belong inside the sweep.

1. **Spec amendment** — clause 3 rewritten to evict rather than demote; new §"Closing a Row"
   binds status-edit + lane-delete + §2.5-append into one transition; both workflow step files
   aligned so the tooling no longer instructs the opposite of the spec.
2. **The sweep** — 34 closed rows out of the lanes, one-line receipts into §2.5, full closing
   text into the archive artifact. Absorbs the `U10+P23+A8+A9` close, the `D14` marker row and
   the `BUG-14` width defect, because each is a closing move rather than a repair.
3. **Sort** — the residual ordering violations, now well-defined against lanes that contain
   only live rows.
4. **Qualification** — IN-185→T55, IN-186→T56, IN-187→T57, IN-188→T58, plus **T59** for the
   Decision 3 deferral.
5. **Reconciliation** — the two story files against `sprint-status.yaml`.

Conservation was asserted after each stage: rows in equal rows out, and no description text
was lost — only relocated.

### Result

| Check | Before | After |
|---|---|---|
| Closed rows in lanes | 32 | **0** |
| Lane-order violations | 6 | **0** |
| Rows at wrong column width | 2 | **0** |
| §2.5 receipts | 72 | 104 |
| Fast Lane live rows | 213 | 217 *(+5 qualified)* |
| Backlog file size | 591 KB | **516 KB** |
| `backlog-integrity` | PASS (331 rows) | PASS (336 rows) |

`T57` — Review mode's pre-write validation, which has asserted the wrong column counts and
failed on every run — scored 9.5 and is now the top row in the Fast Lane.

---

## 8. Revision log

**2026-08-24 — re-verified against HEAD after the 4.0.1 distribution-integrity epic.**

*Removed (resolved):*

- **"The v4.0.0 GitHub release does not exist."** It was published 2026-08-17 21:51, hours
  after this proposal was written. v4.0.1 followed on 2026-08-23. The finding is dead.
- **Two of the eight sort violations** named in the original (`T41` below `T38`, `T40` below
  `T41`) plus `T35` below closed `T39`, all cleared by `dist-*` work.

*Corrected:*

- **Story status framing.** The original said `v63-4-5` and `v63-5b-3` were "never flipped".
  `sprint-status.yaml` in fact has both as `done`; it is the **story files** that lag. The
  finding is a two-sources disagreement, not an unnoticed omission.
- **CI gate claim.** §5 lever 3 originally implied `backlog-integrity.js` was not wired into
  CI. It was, at proposal time and now (`ci.yml:161`). The real gap — no lane-order and no
  column-arity assertion — stands unchanged.

*Unchanged, re-verified:*

- The spec contradiction (`backlog-format-spec.md:229` vs `:318`), verbatim.
- `U10+P23+A8+A9` still `In Sprint`, now across two shipped releases.
- IN-185/186/187/188 still unqualified.
- `BUG-14` and `D14` still malformed.
- 85 live rows below 1.0, none touched.

*Worse:*

- Closed-in-lane rows **18 → 26**; §2.5 unchanged at 66. The split widened by 8 in nine days.
- File **1,116 → 1,145 lines**, 543 → 588 KB. Fast Lane **226 → 239** rows.
