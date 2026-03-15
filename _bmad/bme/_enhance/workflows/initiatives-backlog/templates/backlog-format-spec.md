# Backlog Format Specification

Reference document for consistent backlog file formatting across all initiatives backlog operations. Loaded by the workflow during file write operations to ensure output matches the canonical format.

All output must be standard markdown — no proprietary extensions, HTML embeds, or tool-specific syntax (NFR6).

---

## Metadata Header

Every backlog file begins with:

```markdown
# Convoke Initiatives Backlog

**Created:** YYYY-MM-DD
**Method:** RICE (Reach, Impact, Confidence, Effort)
**Last Updated:** YYYY-MM-DD
```

The `Last Updated` date is refreshed on every write operation.

---

## Section Hierarchy

The backlog file uses this exact heading structure. Sections must appear in this order.

```
# Convoke Initiatives Backlog                    (H1 — title)

## RICE Scoring Guide                            (H2 — inline scoring reference)

## Backlog                                       (H2 — active items container)
### [Category Name]                              (H3 — one per category, repeating)

## Exploration Candidates                        (H2 — unscored items needing discovery)

## Epic Groupings                                (H2 — bundled delivery suggestions)
### Epic: "[Name]" ([item IDs])                  (H3 — one per grouping)

## Prioritized View (by RICE Score)              (H2 — auto-generated ranked table)

## Completed                                     (H2 — finished items, grouped by date)
### YYYY-MM-DD                                   (H3 — date grouping for milestones)

## Change Log                                    (H2 — operational history)
```

### Category Names

Categories are user-defined H3 headings under `## Backlog`. The existing backlog uses:

- Documentation & Onboarding
- Update & Migration System
- Testing & CI
- Infrastructure
- Agent Quality & Consistency
- Platform & Product Vision

New categories may be added. Category names must be unique within the backlog.

---

## Table Formats

### Category Table (under each H3 category)

```markdown
| # | Initiative | Source | R | I | C | E | Score | Track | Status |
|---|-----------|--------|---|---|---|---|-------|-------|--------|
```

**Column rules:**
- `#`: Short alphanumeric ID (e.g., D2, P4, T3). Unique within the backlog.
- `Initiative`: `**[Bold title]** — [description]`. May include markdown links.
- `Source`: Origin of the initiative (e.g., "Vortex review (Liam, Wade)", "Product owner")
- `R`: Reach score (integer 1-10)
- `I`: Impact score (0.25, 0.5, 1, 2, or 3)
- `C`: Confidence as percentage (e.g., 70%, 90%)
- `E`: Effort score (integer 1-10)
- `Score`: Composite RICE score, one decimal place (e.g., 2.8)
- `Track`: "Keep the lights on" or "Move the needle"
- `Status`: One of: Backlog, In Planning, In Progress, Done, Blocked

### Prioritized View Table (under `## Prioritized View`)

```markdown
| Rank | # | Initiative | Score | Track | Category |
|------|---|-----------|-------|-------|----------|
```

**Rules:**
- Sorted by composite RICE score, descending
- Tiebreak: Confidence (higher first), then insertion order (newer first)
- Only includes active items (not Done or in Completed section)
- Regenerated from scratch on every write operation — not manually maintained
- Rank is a sequential integer starting at 1

### Exploration Candidates Table (under `## Exploration Candidates`)

```markdown
| # | Initiative | Source | Next Step |
|---|-----------|--------|-----------|
```

These items are unscored and not included in the prioritized view.

### Completed Section Tables (under `## Completed`)

Grouped by date using H3 headers:

```markdown
### YYYY-MM-DD

| # | Initiative | Score | Category |
|---|-----------|-------|----------|
```

**Note:** Legacy completed entries (pre-backlog era) may use non-standard table formats (e.g., `| Item | Fix Applied |`). These should be preserved as-is during write operations — do not attempt to reformat them.

---

## Change Log Format

The Change Log section uses a table:

```markdown
## Change Log

| Date | Change |
|------|--------|
| YYYY-MM-DD | [Description of what changed] |
```

Entries are prepended (newest first). Each workflow session adds one entry summarizing items added, removed, rescored, or moved.

---

## RICE Composite Formula

**Formula:** Score = (Reach x Impact x Confidence) / Effort

Where Confidence is expressed as a decimal (e.g., 70% = 0.7).

**Example:** R:8, I:3, C:70%, E:6 = (8 x 3 x 0.7) / 6 = 2.8

**Sort order:** Descending by composite score. Ties broken by:
1. Confidence — higher first
2. Insertion order — newer first

---

## Insertion Rules

### Adding New Items (Triage mode, Create mode)

1. Identify the target category H3 section under `## Backlog`
2. Append the new row to the end of that category's table
3. If the category doesn't exist, create a new H3 heading at the end of the `## Backlog` section (before `## Exploration Candidates`)
4. Regenerate the `## Prioritized View` table with all active items sorted by composite score
5. Add a Change Log entry

### Moving Items to Completed

1. Remove the item row from its category table
2. Add it to the appropriate `### YYYY-MM-DD` group under `## Completed`
3. If no group exists for today's date, create one
4. Regenerate the `## Prioritized View` table
5. Add a Change Log entry

---

## Provenance Tags

Provenance is recorded in the Initiative cell description or as a separate annotation.

### Triage Mode — New Items

Format: `"Added from [source], [date]"`

Example: `Added from party-mode review transcript, 2026-03-15`

The score recorded is the **final** score after any Gate 2 user adjustments. The agent's initial proposal is not recorded separately. Triage Gate 2 adjustments are NOT rescores — they are the initial score. No rescore provenance is generated.

### Review Mode — Rescored Items

Format: `"Rescored [old]->[new], Review, [date]"`

Example: `Rescored 1.8->2.4, Review, 2026-03-15`

Only recorded when the composite score actually changes. Confirming an existing score or skipping an item generates no provenance entry.

### Create Mode — New Items

Format: `"Added from Create mode, [date]"`

---

## Pre-Write Validation

Before writing to the backlog file, the workflow must validate:

1. **Section heading anchors** — All required H2 sections exist in the correct order
2. **Prioritized view table column count** — Table has exactly 6 columns
3. **Category table column count** — Each category table has exactly 10 columns
4. **Change Log section existence** — The Change Log H2 section exists
5. **No data loss** — Existing category section content is preserved (no deletions, overwrites, or reordering of existing rows). The Prioritized View is excluded from this check since it is regenerated.

If validation detects a structural mismatch, the user can proceed or abort.

---

## Format Consistency

The backlog output must match the exact current format of `initiatives-backlog.md`. When in doubt, load the existing file and match its patterns precisely. This ensures:
- Round-trip parseability (the workflow can reload its own output)
- Manual editability (users can edit the file in any text editor between sessions)
- `git diff` readability (consistent formatting minimizes noise)
