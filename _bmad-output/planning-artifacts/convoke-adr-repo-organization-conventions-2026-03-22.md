# Architecture Decision Record: Repository Organization Conventions

**Status:** ACCEPTED
**Date:** 2026-03-22
**Decision Makers:** Amalik (project lead), Winston (architect)
**Supersedes:** N/A (first formal repo organization standard)

---

## Context

The BMAD-Enhanced / Convoke repository has grown organically through multiple phases (Phase 1-3), initiatives (Gyre, Forge, Team Factory), and Vortex agent development. The `_bmad-output/` directory now contains 200+ files across 8+ subdirectories with no formal naming convention, no archive system, and no separation between active and historical artifacts.

**Pain points:**
- `implementation-artifacts/` has 104 files with mixed prefix schemes (`1-1-`, `enh-`, `p2-`, `p4-`, `s3-`)
- `planning-artifacts/` mixes dated and undated files (`prd.md` vs `product-brief-BMAD-Enhanced-2026-02-01.md`)
- Capitalization varies (UPPERCASE vs kebab-case) without pattern
- Superseded files sit alongside active ones (5 readiness reports, 3 product briefs, multiple phase epics)
- One-time event records (release notes, publication success) clutter active directories
- No traceability for why or when artifacts were retired

---

## Decision

We adopt three complementary rules: a **Naming Convention**, an **Archive Structure**, and a **Cleanup Script**.

---

### Rule 1: Naming Convention

**Pattern:**
```
{category}-{descriptor}[-{context}][-{date}].md
```

**Components:**

| Component | Required | Description | Examples |
|-----------|----------|-------------|----------|
| `category` | Yes | Short artifact type prefix | `prd`, `epic`, `arch`, `adr`, `brief`, `report`, `spec`, `vision`, `hc` |
| `descriptor` | Yes | What it is, kebab-case, always lowercase | `enhance-module`, `problem-definition`, `implementation-readiness` |
| `context` | No | Product/initiative scope. Omit if repo-wide | `gyre`, `forge`, `team-factory`, `busy-parents` |
| `date` | Conditional | ISO 8601 `YYYY-MM-DD`. Required for versionable artifacts. Omit for living documents | `2026-03-22` |

**When date is required:**
- Reports, readiness checks, briefs, sprint proposals — anything that gets superseded
- Handoff contracts and experiment artifacts (already dated)

**When date is omitted:**
- Living documents: the current PRD, active architecture doc, active epics
- ADRs (they have status + date in frontmatter instead)

**Category registry:**

| Category | Meaning | Example filename |
|----------|---------|-----------------|
| `prd` | Product Requirements Document | `prd-team-factory.md` |
| `epic` | Epic definition | `epic-phase3.md` |
| `arch` | Architecture document | `arch-enhance-module-p4.md` |
| `adr` | Architecture Decision Record | `adr-repo-organization-conventions-2026-03-22.md` |
| `brief` | Product brief | `brief-gyre-2026-03-19.md` |
| `report` | Any assessment/readiness/validation report | `report-implementation-readiness-2026-03-21.md` |
| `spec` | Technical specification | `spec-baseartifact-contract.md` |
| `vision` | Strategic vision document | `vision-convoke-ecosystem.md` |
| `hc` | Handoff contract (Vortex) | `hc2-problem-definition-gyre-2026-03-21.md` |
| `persona` | Lean persona | `persona-engineering-lead-2026-03-21.md` |
| `experiment` | Lean experiment | `experiment-gyre-discovery-interviews-2026-03-20.md` |
| `learning` | Learning card | `learning-busy-parents-2026-03-01.md` |
| `sprint` | Sprint planning/status/proposal | `sprint-change-proposal-2026-03-07.md` |

**Capitalization rule:** Always lowercase kebab-case. No UPPERCASE filenames. The only exceptions are root-level project files (`README.md`, `CHANGELOG.md`, `LICENSE`).

**Renaming examples:**

| Current | Proposed |
|---------|----------|
| `ORIGINAL-VISION-README.md` | `vision-original-readme.md` |
| `P4-enhance-module-architecture.md` | `arch-enhance-module-p4.md` |
| `product-brief-BMAD-Enhanced-2026-02-01.md` | `brief-convoke-2026-02-01.md` |
| `implementation-readiness-report-2026-03-21.md` | `report-implementation-readiness-2026-03-21.md` |
| `prd-gyre-validation-report.md` | `report-prd-validation-gyre.md` |
| `architectural-comparison-quint-vs-bmad-first.md` | `adr-quint-vs-bmad-first-comparison.md` |
| `lean-persona-busy-parents-2026-03-01.md` | `persona-busy-parents-2026-03-01.md` |
| `lean-experiment-gyre-discovery-interviews-2026-03-20.md` | `experiment-gyre-discovery-interviews-2026-03-20.md` |

---

### Rule 2: Archive Structure

**New directory:**
```
_bmad-output/
├── planning-artifacts/        # ACTIVE artifacts only
├── implementation-artifacts/  # ACTIVE artifacts only
├── vortex-artifacts/          # ACTIVE artifacts only
├── _archive/                  # Completed/superseded work
│   ├── INDEX.md               # Traceability log (append-only)
│   ├── phase-2/               # Grouped by initiative/phase
│   ├── phase-3/
│   ├── gyre/
│   ├── forge/
│   ├── releases/              # Old release notes, publication records
│   └── exploratory/           # One-off analyses, comparisons, brainstorms
├── .backups/                  # Stays as-is (system-managed)
└── .logs/                     # Stays as-is (system-managed)
```

**Archive criteria — MOVE when:**
1. **Superseded:** A newer version of the same artifact exists (e.g., older readiness reports, older product briefs)
2. **Phase complete:** The initiative/phase the artifact belongs to is done and merged
3. **One-time record:** Release notes, publication confirmations, test result snapshots
4. **Exploratory:** Brainstorming outputs, comparison matrices, framework analyses that informed a decision but aren't living references

**NEVER archive:**
- ADRs (decisions are permanent records — they get `SUPERSEDED` status, not moved)
- The current/active PRD, architecture doc, or epic list
- Handoff contracts and Vortex artifacts from active discovery cycles
- Any document actively referenced by an in-progress initiative

**INDEX.md format:**
```markdown
# Archive Index

| File | Original Location | Archive Date | Reason |
|------|-------------------|--------------|--------|
| phase-2/epic-phase2.md | planning-artifacts/epics-phase2.md | 2026-03-22 | Phase 2 complete |
| releases/report-publication-v1.0.3.md | project-documentation/PUBLICATION-SUCCESS-v1.0.3-alpha.md | 2026-03-22 | One-time release record |
```

---

### Rule 3: Cleanup Script

**Command:** `npm run archive` (or future `convoke-archive`)

**Behavior:**
1. **Dry-run by default** — prints what would be moved, renamed, or flagged
2. `--apply` flag to execute changes
3. `--rename` flag to apply naming convention renames (separate from archive moves)

**Script responsibilities:**
- Scan dated files in `planning-artifacts/` and `vortex-artifacts/` — identify superseded versions (same category+descriptor+context, older date)
- Flag files that don't match the naming convention
- Move archived files to `_archive/{group}/`
- Append entries to `_archive/INDEX.md`
- Print summary of actions taken

**What the script does NOT do:**
- Delete anything — archive only
- Make judgment calls on "active vs done" — it handles date-based supersession; phase completion is a manual decision
- Touch `_bmad/` directory contents (BMAD Method compatibility)
- Touch `.backups/` or `.logs/` (system-managed)

---

## Consequences

**Positive:**
- Active directories stay lean and navigable
- Full traceability via `INDEX.md` — nothing lost, everything findable
- Naming convention makes artifact type immediately obvious from filename
- Category prefixes enable easy glob patterns (`prd-*.md`, `report-*.md`)
- Script prevents drift without requiring constant manual discipline

**Negative:**
- One-time migration effort to rename existing files and move historical artifacts
- Git history shows renames (mitigated by `git log --follow`)
- Team members need to learn the convention (mitigated by this ADR as reference)

**Risks:**
- Breaking internal markdown links during rename — mitigate by grepping for old filenames before renaming
- Over-archiving active work — mitigate by dry-run default and "never archive" rules

---

## Implementation Plan

### Phase A: Initial Cleanup (immediate)
1. **Create `_archive/` structure** with empty `INDEX.md`
2. **Run initial archive pass** — move completed phase artifacts and one-time records
3. **Rename active files** to match naming convention (batch, with link-check)

### Phase B: Cleanup Script (immediate)
4. **Build cleanup script** as `scripts/archive.js` with dry-run/apply modes
5. **Add npm script** `"archive": "node scripts/archive.js"` to `package.json`

### Phase C: Workflow Enforcement (backlog — PM to schedule)
Update BMAD workflows that produce output artifacts to follow the naming convention at creation time, eliminating the need for after-the-fact correction.

**Scope:** Any workflow step file that writes to `{output_folder}`, `{planning_artifacts}`, or `{implementation_artifacts}`.

**What to update per workflow:**
- The output filename must follow the `{category}-{descriptor}[-{context}][-{date}].md` pattern
- The category must come from the registry defined in this ADR
- Dated artifacts must include the date at creation time (not added later)

**Known workflows that produce artifacts:**
- PRD creation (`bmad-create-prd`) → should output `prd-{context}.md`
- Architecture (`bmad-create-architecture`) → should output `arch-{context}.md`
- Epic/story creation (`bmad-create-epics-and-stories`) → should output `epic-{context}.md`
- UX design (`bmad-create-ux-design`) → should output `ux-{context}.md`
- Implementation readiness (`bmad-check-implementation-readiness`) → should output `report-implementation-readiness[-{context}]-{date}.md`
- Vortex agent workflows (handoff contracts, personas, experiments) → already mostly compliant, prefix `lean-` to be dropped in favor of category prefix (`persona-`, `experiment-`, `learning-`)
- Quick spec (`bmad-quick-spec`) → should output `spec-{descriptor}.md`
- Sprint planning/status (`bmad-sprint-planning`, `bmad-sprint-status`) → should output `sprint-{descriptor}[-{date}].md`

**Approach:** Update incrementally — when a workflow is touched for any reason, apply the convention at the same time. No big-bang migration needed.

---

## Scope Boundary

This ADR covers `_bmad-output/` artifact organization only. It does NOT cover:
- `_bmad/` directory structure (governed by BMAD Method compatibility)
- `.claude/commands/` skill files (governed by BMAD framework conventions)
- `src/`, `scripts/`, `tests/` directories (governed by standard Node.js conventions)
- `docs/` directory (separate concern — may warrant its own ADR if it grows)
