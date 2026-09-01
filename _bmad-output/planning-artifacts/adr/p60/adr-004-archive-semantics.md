---
initiative: convoke
artifact_type: adr
qualifier: knowledge-governance-archive-semantics
created: '2026-09-01'
status: active
decision_status: accepted
accepted: '2026-09-01'
schema_version: 1
related_initiative: 'P60 — Knowledge & Documentation Governance'
related_decision: 'ADR-001 (OQ-4); ADR-002; ADR-003'
related_epic: none
supersedes: none
qualifier_role: winston-architect
signoff_by: amalik
---

# ADR-004: Archive Semantics — Archived Is a Place, and There Must Be One of Them

**Status:** **ACCEPTED** (2026-09-01) — signed off by Amalik
**Proposed:** 2026-09-01
**Initiative:** Knowledge & Documentation Governance (**P60**)
**Decision owner:** Amalik
**Resolves:** ADR-001 open question **OQ-4**

---

## Context

ADR-001 deferred OQ-4 as:

> *"**What "archived" means.** A state or a place, and whether `_archive/` survives as a directory. Its
> index currently reports 195 rows against 179 files."* — `adr-001-cleanup-scope.md:115`

Two things have changed since that was written on 2026-08-27, and one of them invalidates the question's
own evidence.

### 1. The stated evidence does not reproduce

`_archive/INDEX.md` carries **180 rows naming a `.md` file**, against **179 files on disk** (178 archived
documents plus `INDEX.md` itself). Not 195.

This is not a matter of the file having changed in the interim. `INDEX.md`'s most recent commit is
`704ffa42`, **2026-04-18**. The version as of 2026-08-27 was checked out and counted: **180 rows**, the
same as today. The figure 195 is not a count of anything in that file at any point in the last four
months.

```
grep -oE '^\| [^|]+\.md' _bmad-output/_archive/INDEX.md | wc -l    # 180
find _bmad-output/_archive -name '*.md' | wc -l                     # 179
git log -1 --format='%h %ad' -- _bmad-output/_archive/INDEX.md      # 704ffa42 2026-04-18
```

**The real gap is 2**, and both were traced: `capability-evaluation-framework.md` (`c7c13dbc`) and
`friction-log-template.md` (`cb0471c8`), both **deleted** after being archived. The index is append-only
by its own header — *"Append-only — new entries go at the bottom of each section"* — so it never records
a deletion.

**That is the documented contract working, not drift.** The index is 98.9% faithful and has been stable
for four months. OQ-4's premise, that the archive's bookkeeping is unreliable, is the one claim here that
does not survive measurement.

*Method note: this correction is only possible because the figure was checkable at source. It is the third
non-reproducing measurement this initiative has found in its own documents — after ADR-002's `parseFrontmatter`
`.data` error and ADR-003's 140-versus-111 table (T109). The pattern, not the arithmetic, is what is worth
recording.*

### 2. "Archived as a state" is measurably a fiction

| | |
|---|---|
| `archived` in the shipped enum (`artifact-utils.js:802`) | **no** — `['draft', 'validated', 'superseded', 'active']` |
| `archived` in the portfolio engine's running vocabulary | **no** — `ongoing`/`stale`/`blocked`/`complete`/`unknown` |
| Files declaring `status: archived` or `status: superseded` | **1**, corpus-wide |
| Files declaring `decision_status: superseded` | **0** |

Neither vocabulary has the value, and essentially nothing declares it. ADR-002 D1 ruled `status` optional
with **no backfill of the ~893 status-less files**. So "archived is a state" resolves to one of two
things: backfill 178 files with a value neither consumer reads — the option ADR-002 rejected on principle
— or adopt a state that nothing declares and nothing enforces.

### 3. "Archived as a place" is load-bearing and functioning

178 files are held out of the governance denominator by a single directory name appearing in four
exclusion sites:

| Site | Mechanism |
|---|---|
| `portfolio-engine.js:29` | `EXCLUDE_DIRS` |
| `archive.js:24` | `SKIP_ROOT` |
| `artifact-utils.js:104`, `:143` | `excludeDirs` default and its membership test |
| `artifact-utils.js:1251` | migrate scope default |

And the place is *produced* by a tool, not by convention: `archive.js:104-105` resolves `_archive/` and
`INDEX.md`, `:146` and `:205` move files into `superseded/` and `exploratory/`, and `:269` appends an
index row carrying a **reason** column. The move is the transition; the row is its receipt.

### 4. What BUG-21's fix newly revealed

The scanner did not recurse until 2026-09-01, so nothing could see that **there are two archives**:

```
_bmad-output/_archive                    ← excluded by name, 178 files
_bmad-output/planning-artifacts/archive  ← NOT excluded, 1 file
```

`excludeDirs` matches top-level include-dir names only (`artifact-utils.js:143`), so a nested `archive/`
is not skipped. Since the recursion fix it sits **inside** the governance denominator. Its single occupant
is `convoke-prd-bmad-v6.3-adoption.md` — 1,369 lines, of which lines 1–572 are an unparseable frontmatter
block (**T110**).

**This, not state-versus-place, is the defect OQ-4 was circling.** The place works. The problem is that it
is not one place, and nothing could tell.

---

## Decision

**Decided: `archived` is a place. `_archive/` survives as a directory and becomes the only one. `status`
gains no `archived` value and no file is backfilled. The archive index remains the state record.**

**D1 — Archived is a place, not a status value.** No `archived` is added to either vocabulary. The
physical location of a file, plus its `INDEX.md` row, is the complete record that it was archived and why.

**D2 — Exclusion matches any path segment, not only a top-level name.** The membership test at
`artifact-utils.js:143` and the equivalent at `portfolio-engine.js:29` are changed so that a directory
named `archive` or `_archive` at **any** depth is skipped. This is what makes D1 enforceable rather than
aspirational.

**D3 — There is exactly one archive.** `planning-artifacts/archive/` is emptied into `_archive/` with an
index row, and the directory removed. Any future nested archive is prevented by D2 rather than by
vigilance.

**D4 — The index is the state record, and stays append-only.** No tombstones, no reconciliation pass. Its
2 dangling entries are historically accurate: those documents *were* archived, and were deleted later.

**D5 — No backfill, no migration.** 178 files are already correctly archived. This ADR moves one file and
changes one predicate.

---

## Why this does not contradict ADR-003

ADR-003 D1 ruled that artifact class *"is a property of the artifact, not of its directory,"* and rejected
Alternative C for *"ratifying directory location as ontology."* Read carelessly, D1 above is the same move
one axis over.

It is not, and the distinction is load-bearing:

- **Class is intrinsic.** A document *is* a product or a receipt for its whole life; the property never
  changes. A directory is the wrong carrier because moving a file for any unrelated reason silently
  changes a property that should not have changed.
- **Archival is a one-way transition, performed as a physical event.** It happens once, in one direction,
  executed by a tool that writes a dated row with a reason. The move **is** the transition rather than a
  description of one, so there is nothing for a directory to misrepresent.

ADR-003 objects to directories carrying facts that are true independent of location. Archival is not such
a fact. This ADR is that ruling applied, not overturned.

---

## Consequences

**Positive**

- OQ-4 closes on a bounded change: one predicate, one file move. Materially cheaper than the migration the
  question implied.
- The second archive cannot recur — D2 makes it structurally impossible rather than a thing to remember.
- T110 is discharged by relocation rather than by repairing 571 lines of workflow exhaust nobody reads.
- The coverage denominator stops silently including an archived document.

**Negative**

- D2 changes what four instruments scan. Per the precedent set by story `scan-1-1`, it requires a recorded
  before/after of every figure, not a silent flip. The expected delta is exactly 1 file.
- A directory named `archive` anywhere in `_bmad-output/` becomes unscannable by fiat. If a legitimate
  *subject-matter* directory ever needs that name, it cannot have it.
- `archived` remains unexpressible in frontmatter. A reader with only a file's text, and not its path,
  cannot tell it is archived.

**Neutral**

- ADR-002's `status` ruling is untouched — this adds nothing to either vocabulary.
- `EXCLUDE_DIRS`' survival as a separate concept (ADR-003's third open question) is still open; D2
  changes how it matches, not whether it exists.

---

## Alternatives considered

**A. Archived is a state (`status: archived`), and `_archive/` is dissolved.** Rejected on measurement.
The value is in neither vocabulary and is declared by 1 file corpus-wide; adopting it means backfilling
178 files with a value no consumer reads, which is precisely what ADR-002 D1 refused. It also discards a
working index with a reason column in favour of a field that records only that something happened, not why.

**B. Both — a state that mirrors the place.** Rejected. Two representations of one fact is the shape that
produced ADR-003's three-way scoping disagreement and ADR-002's two unreconciled status vocabularies. This
initiative has now found that pattern three times; it should not author a fourth instance deliberately.

**C. Status quo — one archive excluded, nested archives tolerated.** Rejected. It is only defensible while
nothing can see the nested one, which stopped being true on 2026-09-01.

**D. Reconcile the index (tombstones for deleted files).** Rejected, narrowly. It would take the index from
98.9% to 100% faithful, but "faithful" is the wrong axis: the rows are historical events, and an event does
not stop having happened because its artifact was later deleted. Recorded as an open question rather than a
rejection, since it is genuinely arguable.

---

## Open questions

- **OQ-4a — Whether the append-only index should ever record a deletion.** Two rows name files that no
  longer exist. Either the row is a historical fact that stands, or the index needs a tombstone
  convention. The figures do not settle this; it is an operator preference about what the index is *for*.
- **OQ-4b — Whether `_archive/`'s own contents should ever be governed.** They are excluded from the
  denominator today and this ADR keeps that. If archived documents are later wanted in a coverage figure,
  that is a change to D3's exclusion, not to D1.

---

## Verification

Every figure in §Context was produced by executing against the tracked repository, not by reading a prior
document — the discipline `verification-basis` and this initiative's own three non-reproducing measurements
both require. The commands are inline in §Context.1 and the exclusion sites in §Context.3 are cited by
`file:line` at the working-tree state of commit `d5c5315d`.
