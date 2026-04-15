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
| ID | Description | R | I | C | E | Score | Portfolio | Status | Dependencies | Linked Follow-up |
|----|-------------|---|---|---|---|-------|-----------|--------|--------------|------------------|
```

**Columns:**
- `ID`: Bug-prefixed sequential — `BUG-{n}`.
- `Description`: One-line summary of the broken behavior + intended fix scope.
- `R`, `I`, `C`, `E`: RICE component scores. Impact often hardcoded high (2–3) when user-facing.
- `Score`: Composite, one decimal place.
- `Portfolio`: Portfolio attachment (convoke, vortex, gyre, forge, bmm, enhance, loom, helm, or new).
- `Status`: `Open`, `In Fix`, `In Review`, `Shipped`.
- `Dependencies`: Comma-separated upstream item IDs (any lane). Use `—` when none. See Dependency Notation rules below.
- `Linked Follow-up`: Reference to a Fast Lane or Initiative item if the bug spawned deeper work.

**Sort:** Descending by composite Score. Dependencies do not affect sort — they are informational. The reader is responsible for noting when a high-RICE item is blocked.

### §2.3 Fast Lane Table

```markdown
| ID | Description | R | I | C | E | Score | Portfolio | Status | Dependencies |
|----|-------------|---|---|---|---|-------|-----------|--------|--------------|
```

**Columns:**
- `ID`: Original IDs preserved during migration (D2, U7, T6, I43, A7, P10, P11, etc.) or new prefix as needed.
- `Description`: Compact one-liner; full detail can live in Appendix if helpful.
- `R`, `I`, `C`, `E`, `Score`: RICE per scoring guide.
- `Portfolio`: Portfolio attachment.
- `Status`: `Backlog`, `In Story`, `In Sprint`, `Shipped`.
- `Dependencies`: Comma-separated upstream item IDs (any lane). Use `—` when none. See Dependency Notation rules below.

**Sort:** Descending by composite Score. Dependencies do not affect sort.

### §2.4 Initiative Lane Table

```markdown
| ID | Description | R | I | C | E | Score | Portfolio | Stage | Artifacts | Dependencies |
|----|-------------|---|---|---|---|-------|-----------|-------|-----------|--------------|
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

**Sort:** Descending by composite Score (same rule as Fast Lane). Dependencies do not affect sort.

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

**Rules:**
- Nothing disappears without a receipt.
- Absorbed items must reference the target (epic file, larger initiative).
- Completed items are append-only.

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

**Sort order (within each lane):** Descending by composite score. Ties broken by:
1. Confidence — higher first
2. Insertion order — newer first

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
3. Qualified intakes get a corresponding row appended to their lane's table (§2.2/2.3/2.4).
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
- **Any → §2.5 Completed (shipped):** Move row to Completed sub-table with shipping date.

Never delete a row outright — every removal becomes a §2.5 entry.

---

## Pre-Write Validation

Before writing, the workflow must validate:

1. **Frontmatter present** — Required YAML block at top of file.
2. **Part 1 unchanged** (Triage and Review modes only) — H2 `## Part 1: Lifecycle Process` content matches the loaded snapshot. If modified, warn before proceeding.
3. **Part 2 section anchors** — All five H3 sections (`### 2.1` through `### 2.5`) exist in correct order under `## Part 2: Backlog`.
4. **Table column counts:**
   - §2.1 Intakes: 5 columns
   - §2.2 Bug Lane: 11 columns (Dependencies column added 2026-04-15)
   - §2.3 Fast Lane: 10 columns (Dependencies column added 2026-04-15)
   - §2.4 Initiative Lane: 11 columns (Dependencies column added 2026-04-15)
   - §2.5 sub-tables: 5 columns each
5. **Change Log present** — `## Change Log` H2 exists.
6. **No data loss** — Existing rows preserved; only the touched rows changed, only the touched lanes reordered.

If validation detects a structural mismatch, the user can proceed (Y) or abort (X).

---

## Format Consistency

The backlog output must match the canonical structure of this spec. When in doubt, load the existing file and match its patterns precisely. This ensures:
- Round-trip parseability (the workflow can reload its own output)
- Manual editability (users can edit between sessions)
- `git diff` readability (consistent formatting minimizes noise)
