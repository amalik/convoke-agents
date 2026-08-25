# Backlog Format Specification

Reference document for the **Convoke Initiative Lifecycle & Backlog** format. Loaded by the workflow during file write operations to ensure output matches the canonical structure defined by the lifecycle process.

All output must be standard markdown — no proprietary extensions, HTML embeds, or tool-specific syntax.

---

## File Identity

**Canonical filename:** `convoke-note-initiative-lifecycle-backlog.md`
**Canonical location:** `{planning_artifacts}/convoke-note-initiative-lifecycle-backlog.md`
**Supersedes:** `convoke-note-initiatives-backlog.md` (archived 2026-04-15 to `_archive/superseded/`)

---

## Frontmatter

Every backlog file begins with YAML frontmatter:

```yaml
---
initiative: convoke
artifact_type: note
qualifier: initiative-lifecycle-backlog
created: 'YYYY-MM-DD'
schema_version: 1
status: draft | active
origin: '<short origin description>'
supersedes: convoke-note-initiatives-backlog.md
---
```

The `created` date is set on first write and never changed thereafter.

---

## Document Structure

The file uses this exact structure. Sections must appear in this order.

```
# Convoke Initiative Lifecycle & Backlog              (H1 — title)

## Part 1: Lifecycle Process                           (H2 — process definition, semi-static)
### 1.1 Intake                                         (H3)
### 1.2 Qualifying Gate                                (H3)
### 1.3 Three Lanes                                    (H3)
####   Bug Lane / Fast Lane / Initiative Lane          (H4)
### 1.4 Portfolio Attachment                           (H3)
### 1.5 Pipeline Stages (Evolvable)                    (H3)
### 1.6 RICE Scoring                                   (H3)

## Part 2: Backlog                                     (H2 — operational data, mutates frequently)
### 2.1 Intakes (Unqualified)                          (H3)
### 2.2 Bug Lane                                       (H3)
### 2.3 Fast Lane (Quick Wins + Spikes)                (H3)
### 2.4 Initiative Lane                                (H3)
### 2.5 Absorbed / Archived                            (H3)
####   Absorbed into [name] / Completed (shipped)      (H4 — optional sub-grouping)

## Appendix: Initiative Details                        (H2 — full descriptions for §2.4 items)
### [Item ID] — [Title]                                (H3 — one per initiative when detail is needed)

## Change Log                                          (H2 — operational history)
```

**Part 1** is semi-static (the lifecycle process definition). The skill **must NOT regenerate or modify Part 1 contents** unless explicitly running Create mode. In Triage and Review modes, Part 1 is loaded for context but never written.

**Part 2** is the operational surface — Triage adds rows, Review updates rows.

**Appendix** holds detailed descriptions for Initiative Lane items whose table row is a one-liner.

---

## Table Formats

### §2.1 Intakes Table

```markdown
| ID | Description | Source | Date | Raiser |
|----|-------------|--------|------|--------|
```

**Columns:**
- `ID`: `IN-{n}` sequential integer. Optionally `IN-{n} (was {oldId})` for migrated entries.
- `Description`: One-line summary. Detail goes in Appendix if needed.
- `Source`: Where it came from (party mode, code review, retrospective, user report, etc.).
- `Date`: Absolute date `YYYY-MM-DD`. Never relative.
- `Raiser`: Person or agent name.

**Rules:**
- Append-only — intakes never disappear, even after qualification (audit trail).
- After qualification, the intake stays here; a corresponding row is added to the assigned lane.

### §2.2 Bug Lane Table

```markdown
| ID | Filed | Description | R | I | C | E | Score | Portfolio | Status | Dependencies | Linked Follow-up |
|----|-------|-------------|---|---|---|---|-------|-----------|--------|--------------|------------------|
```

**Columns:**
- `ID`: Bug-prefixed sequential — `BUG-{n}`.
- `Filed`: `YYYY-MM-DD`, the date the row entered its lane, or `—` where it cannot be established from git. **Immutable** — it is not touched by a rescore, a status change or a re-sort. A `Touched` column was considered and rejected: it would churn on every edit and answer a question nobody asks. Note the semantics for the 2026-04-15 cohort: that is when Pass 2 reclassified those items into the three-lane model, not when the underlying item was first raised — earlier history lives in the superseded `convoke-note-initiatives-backlog.md`. Added by T69 (2026-08-25) because `staleness-preflight-for-backlog-pickup` keys its trigger on "qualified more than 3 calendar days ago", a date the file had never recorded, leaving the rule enforceable only by human memory.
- `Description`: One-line summary of the broken behavior + intended fix scope.
- `R`, `I`, `C`, `E`: RICE component scores. Impact often hardcoded high (2–3) when user-facing.
- `Score`: Composite, one decimal place.
- `Portfolio`: Portfolio attachment (convoke, vortex, gyre, forge, bmm, enhance, loom, helm, or new).
- `Status`: `Open`, `In Fix`, `In Review`, `Shipped`.
- `Dependencies`: Comma-separated upstream item IDs (any lane). Use `—` when none. See Dependency Notation rules below.
- `Linked Follow-up`: Reference to a Fast Lane or Initiative item if the bug spawned deeper work.

**Sort:** Per **Lane Ordering** below — the canonical contract, identical for all three lanes. Dependencies do not affect sort — they are informational. The reader is responsible for noting when a high-RICE item is blocked.

### §2.3 Fast Lane Table

```markdown
| ID | Filed | Description | R | I | C | E | Score | Portfolio | Status | Dependencies |
|----|-------|-------------|---|---|---|---|-------|-----------|--------|--------------|
```

**Columns:**
- `ID`: Original IDs preserved during migration (D2, U7, T6, I43, A7, P10, P11, etc.) or new prefix as needed.
- `Description`: Compact one-liner; full detail can live in Appendix if helpful.
- `R`, `I`, `C`, `E`, `Score`: RICE per scoring guide.
- `Portfolio`: Portfolio attachment.
- `Status`: `Backlog`, `In Story`, `In Sprint`, `Shipped`.
- `Dependencies`: Comma-separated upstream item IDs (any lane). Use `—` when none. See Dependency Notation rules below.

**Sort:** Per **Lane Ordering** below. Dependencies do not affect sort.

### §2.4 Initiative Lane Table

```markdown
| ID | Filed | Description | R | I | C | E | Score | Portfolio | Stage | Artifacts | Dependencies |
|----|-------|-------------|---|---|---|---|-------|-----------|-------|-----------|--------------|
```

**Columns:**
- `ID`: Original IDs preserved (P9, P12, S3, P21, etc.). Bundles allowed using `+` (e.g., `U10+P23+A8+A9` for v6.3 Adoption).
- `Description`: Bold title. Full detail in Appendix.
- `R`, `I`, `C`, `E`, `Score`: RICE per scoring guide.
- `Portfolio`: Portfolio attachment (or `*(pending)*` if undecided).
- `Stage`: One of: `Qualified`, `In Pipeline`, `Ready`, `In Sprint`, `Done`. May include parenthetical (e.g., `Qualified (Blocked on P12)`).
- `Artifacts`: Compact indicator of which planning artifacts exist:
  - `B` = Brief
  - `P` = PRD
  - `P✓` = PRD validated
  - `A` = Architecture
  - `IR` = Implementation Readiness report
  - `E` = Epic breakdown
  - `D` = Discovery (Vortex)
  - Combine with commas. Example: `D, P✓, A, IR, E`.
- `Dependencies`: Comma-separated upstream item IDs (any lane). Use `—` when none. See Dependency Notation rules below.

**Sort:** Per **Lane Ordering** below (same rule as every lane). Dependencies do not affect sort.

### §2.5 Absorbed / Archived Tables

Use H4 sub-headings to group:

**Absorbed into [target]:**
```markdown
| ID | Original Description | Absorbed Into | Reference | Date |
|----|---------------------|---------------|-----------|------|
```

**Completed (shipped):**
```markdown
| ID | Description | Shipped | Score | Portfolio |
|----|-------------|---------|-------|-----------|
```

**Aged out (below the score floor):**
```markdown
| ID | Filed | Description | Score | Portfolio |
|----|-------|-------------|-------|-----------|
```

A fifth sub-table, added by **T59** (2026-08-25). Rows here are **parked, not closed** — they were never
worked, and the distinction matters when reading §2.5, which is otherwise a record of finished things.

- **Floor: composite score below 1.0.** Score-only, deliberately. An age condition was considered and
  rejected on measurement, not taste: at the 2026-08-25 age-out, 81 of the 85 candidates were already
  90+ days old, so `score < 1.0 AND 90d+` would have moved four fewer rows for a two-condition rule.
- **The full row text is preserved verbatim in the archive**, not summarised. An aged-out row's
  description is the *specification* needed to reinstate it, unlike a completed row's closing note,
  which is a narrative read once. Reinstating is a copy-back into the lane, not a rewrite.
- **Reinstate freely.** A row aged out is a statement about its score at one moment, not a judgement
  that it was wrong. If it becomes relevant, move it back and rescore.
- Age-out is a periodic operator decision, not an automatic sweep. Nothing should age a row out without
  someone choosing the floor.

**After ANY bulk move — age-out, sweep, migration — run all three checks.** Not just the first.

1. **Did exactly the intended rows leave?** Diff the lane row-ID sets before and after, and assert every
   departure matches the criterion. A row leaving for an unrelated reason is invisible otherwise.
2. **Do surviving rows reference the departed?** Scan every remaining `Dependencies` cell for IDs that
   just left. Mark each hit — `I39 *(parked 2026-08-25)*` — or the row silently reads as blocked by work
   that was actually deprioritised.
3. **Are receipts 1:1 with archive entries?** Every §2.5 row that promises preserved text must have it.

**Why all three, and why this is written down.** The 2026-08-25 age-out verified that all 85 departing
descriptions survived byte-for-byte, and declared the move safe on that basis. Check 1 alone is
structurally blind to what happens in the rows that *stay*: six surviving rows ended up depending on
newly-parked work, and `backlog-integrity` stayed green throughout — correctly, because a parked row is
still *defined* in §2.5, so the references resolved. Nothing was broken; six rows simply asserted
something false about their own state, which is the failure this file exists to prevent. It was found
only because the operator asked whether the change had been reviewed.

The general form is worth carrying past this file: **a conservation check knows only about the things
that moved.** Whatever the moved things were connected to needs its own check.

**Rules:**
- Nothing disappears without a receipt.
- Absorbed items must reference the target (epic file, larger initiative).
- Completed items are append-only.
- **`Description` is one line.** §2.5 is an index of receipts, read to answer "did this ship, and when?" — it is not where write-ups are read. Where the closing row carried substantive post-mortem prose, that text moves to the completed-work archive and the §2.5 cell links it by ID:

  ```markdown
  | BUG-16 | Floating `npx` tag served `latest`, not the running build — [post-mortem](convoke-note-backlog-completed-archive.md#bug-16) | 2026-08-15 | 17.1 | convoke |
  ```

- **The archive is append-only and never rewritten.** A post-mortem is evidence of what was understood at closing time. Correcting it later falsifies the record; append a dated addendum under the same anchor instead.

### Appendix Detail Format

For each Initiative Lane item warranting detail:

```markdown
### [ID] — [Title]

**Stage:** [stage] | **Portfolio:** [portfolio] | **RICE:** [score]

**Planning artifacts:** [list with file paths]

**Missing (to reach Ready):** [list]

**Blocker:** [if any]

**Scope hint:** [paragraph or bullets]
```

### Change Log Table

```markdown
| Date | Change |
|------|--------|
| YYYY-MM-DD | [Description of what changed] |
```

Entries are prepended (newest first). Each workflow session adds one entry.

---

## RICE Composite Formula

**Formula:** Score = (Reach × Impact × Confidence) / Effort

Where Confidence is expressed as a decimal (e.g., 70% = 0.7).

**Example:** R:8, I:3, C:70%, E:6 = (8 × 3 × 0.7) / 6 = 2.8

**Sort order (within each lane):** see **Lane Ordering** below.

---

## Lane Ordering

**Invariant: every lane is sorted at all times — not only immediately after a workflow run.** A row's position is the first thing a reader uses to decide what to pick up next. When position and score disagree, position wins in practice, and the wrong work gets done.

Applies identically to **§2.2 Bug Lane**, **§2.3 Fast Lane** and **§2.4 Initiative Lane**. §2.1 Intakes are append-only and unordered (they carry no score). §2.5 sub-tables are append-only receipts and are never sorted.

1. **Live rows first**, composite Score descending. Ties keep their prior relative order. *Live* = any row whose `Status` / `Stage` is not one of the closed values in clause 3.
2. **Untriaged rows next** — rows carrying `?` for R/I/C/E and `—` for Score. They have no sort key, so they cannot participate in clause 1. They belong in §2.1 and are parked in the lane until triaged.
3. **Closed rows do not remain in a lane at all.** A row whose `Status` / `Stage` is `Done`, `Closed`, `Shipped`, `Superseded`, `Rescoped`, `Absorbed` or `Invalid`, or whose cell is marked ✅, **moves to §2.5 in the same edit that closes it**. Closing a row and leaving it in the lane is an incomplete edit, not a deferred chore — see **Closing a Row** below.
4. **Supersession pairs move as one unit.** Where a marker row is immediately followed by the original text under the same ID, the pair travels together — sorting on the original's score while live, and moving to §2.5 together when closed.

**Why clause 3 evicts rather than demotes.** Two readings of the earlier rule ran side by side for months and the file obeyed both, which is how the same work ended up filed two different ways: 32 closed rows parked in lanes against 66 in §2.5, as measured 2026-08-24. Demotion also failed on its own terms — on 2026-08-16 the Bug Lane held a **closed** row scoring 17.1 at position 4, directly above the highest-scoring *open* bug in the project, because a demotion rule only works if someone remembers to demote. Eviction has a property demotion lacks: a closed row in a lane is now a *detectable* error rather than a judgement call about position.

**Ties under clause 1.** Where prior relative order is unknown — a fresh mechanical re-sort, or a newly inserted row — break by (1) Confidence, higher first, then (2) insertion order, newer first.

**Reading the lane.** Status is authoritative, position is derived. A row's rank is only as honest as its status cell, so a row whose status was never flipped will sit in a priority position until someone notices. That failure has recurred often enough to be expected rather than surprising, and clause 3 does not cure it — a row that is *actually* done but still says `Open` looks identical to live work under any rule. What clause 3 removes is the second, compounding failure: the row that is correctly marked closed and still occupies a priority position.

## Closing a Row

Closing is a **move**, not a status edit. One transition, performed in a single edit:

1. Set the `Status` / `Stage` cell to its closed value with the date.
2. **Delete the row from its lane.**
3. Append a row to the §2.5 sub-table — `Completed (shipped)` for finished work, `Absorbed into [target]` where another item took it over.
4. Where the lane row carried substantive post-mortem prose, the §2.5 row carries a **one-line summary** and links the full text by ID into the completed-work archive. §2.5 is an index of receipts; it is not where write-ups are read.

A row that satisfies (1) without (2) and (3) is the defect this section exists to prevent. If the tooling cannot perform the move, perform it by hand — do not leave the row behind as a marker of intent.

**Who this binds.** Every writer, not only this workflow. Rows added by hand during unrelated work are — measurably — the dominant write path and therefore the dominant source of drift: of the four lane rows added on 2026-08-15, **zero** arrived through Triage; they were written into the tables inside `fix(...)` and `docs(...)` commits, and two of them arrived malformed because no validation ran. The corresponding obligation on hand-editors is the `backlog-write-discipline` rule in `project-context.md`.

---

## Dependency Notation

The `Dependencies` column captures upstream relationships. Notation rules:

- **Format:** comma-separated item IDs from any lane. Cross-lane references are explicitly allowed (a Fast Lane item can depend on an Initiative Lane item, and vice versa).
- **Empty state:** use `—` (em-dash) when an item has no dependencies.
- **Done dependencies:** if a dependency has shipped, prefix with `✓` (e.g., `✓P1` means "depended on P1, which is now done"). This preserves history without making the item look blocked.
- **Bundle relationships:** for items that travel together (ship as one PR or one epic), use `bundles-with: ID, ID`. Example: `bundles-with: I48`.
- **Absorbed-into shorthand:** items absorbed into another initiative live in §2.5. Their original lane row is removed. The Dependencies column does not need to track absorption.
- **External dependencies:** for blockers outside the backlog (e.g., upstream BMAD release, external user availability), use `external: short-description` (e.g., `external: BMAD v6.3 release`). Keep the description under 30 chars.
- **Multiple types:** when an item has both internal and external dependencies, separate with semicolons. Example: `P12; external: marketplace-PR-merge`.

**Dependencies do not change RICE sort order.** Two items with the same RICE score do not get re-ordered by dependency direction. The reader is expected to scan the Dependencies column when planning sequencing.

**Stage parenthetical vs. Dependencies column:** if an Initiative is currently blocked, both should reflect it: the Stage cell shows `Qualified (Blocked on X)` for visibility, and the Dependencies cell lists `X` for parseability. Stage parenthetical is human signal; Dependencies cell is the canonical reference.

---

## Lane Assignment Rules

The qualifying gate (Vortex, John, or Winston) assigns each intake to one lane:

**Bug Lane** if:
- Observed broken behavior, regression, or data loss risk
- Fix is the scope (deeper rework spawns separate Fast Lane / Initiative item)

**Fast Lane** if:
- Single-module, contained scope
- Point fix from code review, retrospective, audit
- Process rule to encode
- Test debt, doc improvement, small enhancement
- Spike (time-boxed learning with uncertain outcome)

**Initiative Lane** if:
- Multi-module or architectural impact
- User-facing behavior change
- Requires full pipeline (Brief → PRD → Arch → PRD Validation → IR → Epics)
- Bundle of related work that needs coordinated planning

**When uncertain:** default to Fast Lane unless a clear architectural or multi-module signal exists. The qualifier can promote later if scope grows.

---

## Insertion Rules

### Triage Mode (steps-t)

1. Every extracted finding is logged to **§2.1 Intakes** first, with sequential `IN-{n}` ID.
2. Optional in-session qualification: for each intake, the qualifier assigns lane + portfolio + RICE.
3. Qualified intakes get a corresponding row appended to their lane's table (§2.2/2.3/2.4), after which **the lane is re-sorted per Lane Ordering**. Append is the write mechanism, never the final state.
4. The intake row in §2.1 stays — it's the audit trail.
5. A Change Log entry is added.

### Review Mode (steps-r)

1. User chooses which lane(s) to walk: Bug, Fast, Initiative, or All.
2. Walk through items in the chosen lane(s); rescore RICE per the scoring guide.
3. Update only items whose composite score changed; provenance line appended in Description cell.
4. Confirmed and skipped items remain unchanged.
5. A Change Log entry is added.

### Create Mode (steps-c)

1. Detect existing file; warn before overwriting.
2. Generate **Part 1** verbatim from `templates/lifecycle-process-spec.md` (canonical process definition).
3. Initialize empty Part 2 tables.
4. Optionally gather initial intakes (loop).
5. Optionally qualify each intake into a lane.
6. Write the complete file.

### Moving Items Between Sections

- **Intake → Lane:** Append to lane table. Intake row in §2.1 stays.
- **Bug → Fast Lane / Initiative (deeper rework):** Add row to target lane referencing the bug ID in `Linked Follow-up`.
- **Fast Lane → Initiative (scope grew):** Move row, update ID prefix or keep original. Note in Change Log.
- **Any → §2.5 Absorbed:** Move row to §2.5 with reference to absorbing target.
- **Any → §2.5 Completed (shipped):** Move row to Completed sub-table with shipping date. This is the **only** destination for a closed row — see **Closing a Row** above. Removing it from the lane is part of the move, not a follow-up.

Never delete a row outright — every removal becomes a §2.5 entry.

---

## Pre-Write Validation

Before writing, the workflow must validate:

1. **Frontmatter present** — Required YAML block at top of file.
2. **Part 1 unchanged** (Triage and Review modes only) — H2 `## Part 1: Lifecycle Process` content matches the loaded snapshot. If modified, warn before proceeding.
3. **Part 2 section anchors** — All five H3 sections (`### 2.1` through `### 2.5`) exist in correct order under `## Part 2: Backlog`.
4. **Table column counts:**
   - §2.1 Intakes: 5 columns
   - §2.2 Bug Lane: 12 columns (Dependencies 2026-04-15; Filed 2026-08-25)
   - §2.3 Fast Lane: 11 columns (Dependencies 2026-04-15; Filed 2026-08-25)
   - §2.4 Initiative Lane: 12 columns (Dependencies 2026-04-15; Filed 2026-08-25)
   - §2.5 sub-tables: 5 columns each
5. **Change Log present** — `## Change Log` H2 exists.
6. **No data loss** — Existing rows preserved; only the touched rows changed, only the touched lanes reordered.
7. **Lane ordering** — §2.2, §2.3 and §2.4 each satisfy **Lane Ordering** above, **and contain no closed row at all** (clause 3). Check every lane, not only the touched ones: drift arrives from writers outside this workflow, so an untouched lane is the *likelier* place to find it. A closed row found in a lane is a failed **Closing a Row** move — report the ID rather than silently sweeping it, since the §2.5 counterpart may or may not already exist and a blind sweep can duplicate it.

If validation detects a structural mismatch, the user can proceed (Y) or abort (X).

**Ordering violations are handled differently from the other six checks.** They are mechanically correctable, so the workflow re-sorts rather than prompting — but it must **report what moved**, naming each relocated row by ID, score, and old→new position. A verdict of "ordering violation" with no row named is not actionable, and silently re-sorting is worse: the operator loses the signal that something outside the workflow is writing to the file. A closed row found in a lane is **not** an ordering violation and must not be re-sorted — it is an incomplete **Closing a Row** move, and the workflow reports it for the operator to complete rather than shuffling it downward.

---

## Format Consistency

The backlog output must match the canonical structure of this spec. When in doubt, load the existing file and match its patterns precisely. This ensures:
- Round-trip parseability (the workflow can reload its own output)
- Manual editability (users can edit between sessions)
- `git diff` readability (consistent formatting minimizes noise)
