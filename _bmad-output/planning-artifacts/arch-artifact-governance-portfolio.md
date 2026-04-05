---
stepsCompleted: [1, 2, 3]
inputDocuments:
  - _bmad-output/planning-artifacts/prd-artifact-governance-portfolio.md
  - _bmad-output/planning-artifacts/adr-repo-organization-conventions-2026-03-22.md
  - docs/lifecycle-expansion-vision.md
  - _bmad-output/planning-artifacts/report-implementation-readiness-artifact-governance-2026-04-05.md
  - scripts/archive.js
workflowType: 'architecture'
project_name: 'Artifact Governance & Portfolio'
user_name: 'Amalik'
date: '2026-04-05'
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## Project Context Analysis

### Requirements Overview

**Functional Requirements: 50 FRs across 8 capability areas**

Architecturally, these decompose into two distinct systems with a shared data layer:

1. **Migration Script (FR7-FR21, FR46-FR50)** — 20 FRs. A batch CLI tool that transforms the existing artifact corpus. Architecturally, this is a **pipeline**: scan → infer → plan → review → execute → verify. The critical path is the inference engine (FR9-FR10) which must map ~3 predictable filename patterns (after excluding implementation-artifacts) to initiative+type pairs. The second critical path is link updating (FR15) — a cross-file transformation pass.

2. **Portfolio Skill (FR22-FR38, FR48)** — 18 FRs. A read-only query tool that scans artifacts and produces a portfolio view. Architecturally, this is a **reader with heuristic inference**: scan → parse → infer → format → output. The critical path is the inference engine (FR28-FR34) which must derive phase and status from heterogeneous signals (frontmatter, artifact chains, git history).

3. **Shared Data Layer (FR1-FR6, FR39-FR45, FR49)** — 12 FRs. Taxonomy config, frontmatter schema, update pipeline integration, doctor validation, workflow adoption. This is the **contract layer** that both tools consume and that future workflows must honor.

**Non-Functional Requirements: 22 NFRs — architecturally significant:**
- **NFR5** (rollback via `git reset --hard`) — migration pipeline must be transactional with rollback points
- **NFR7** (dry-run 100% accurate) — planning phase must produce an exact execution plan
- **NFR10** (modular inference) — portfolio inference must use a pluggable pattern
- **NFR17-18** (100% inference coverage) — inference rules must be individually testable units
- **NFR20** (byte-for-byte preservation) — frontmatter injection must use a precise parser

### Scale & Complexity

- **Primary domain:** Node.js CLI tooling + BMAD skill (markdown-based conversational)
- **Complexity level:** Medium-High (concentrated in inference engines)
- **Estimated architectural components:** 8-10 modules
- **Data volume:** ~60 files MVP, ~200 files at scale
- **Concurrency:** Single operator, sequential operations. No concurrency concerns.

### Technical Constraints & Dependencies

| Constraint | Source | Impact |
|-----------|--------|--------|
| Node.js ≥18.x | NFR12, existing platform | Runtime target |
| `findProjectRoot()` from `scripts/update/lib/utils.js` | Existing pattern | Must reuse, not reinvent |
| `archive.js` shares filename parsing logic | Existing code | Extract shared lib |
| `git mv` for renames | FR12, Domain Requirements | Git must be available |
| YAML parsing (js-yaml) | NFR16, existing deps | Already in project dependencies |
| Two-commit atomic sequence | Domain Requirements (hard constraint) | Migration pipeline must be transactional |
| `_bmad/` paths untouched | Domain Requirements | Migration scope is `_bmad-output/` only |
| `config-merger.js` pattern for taxonomy updates | FR41, existing pattern | Reuse merge strategy |

### Cross-Cutting Concerns

1. **Inference logic** — shared concern between migration (initiative/type inference from filenames) and portfolio (phase/status inference from artifacts). Different inference problems but same architectural pattern: rules → confidence → output.
2. **Taxonomy reading** — both tools read `taxonomy.yaml`. Shared parser needed.
3. **Git operations** — migration writes (`git mv`, `git commit`), portfolio reads (`git log`). Shared git utility.
4. **Frontmatter handling** — migration writes frontmatter, portfolio reads it. Shared YAML frontmatter parser/writer.
5. **Error handling** — NFR22 requires graceful error messages for malformed config. Shared error formatting.
6. **Clean-tree safeguard** — migration requires clean working tree before executing. Also beneficial for archive.js.

### Shared Library Architecture

`archive.js` already contains reusable logic: `parseFilename()`, `VALID_CATEGORIES`, `NAMING_PATTERN`, `SCAN_DIRS`. Extraction to shared lib brings untested archive.js logic under test coverage for the first time — a net improvement to platform quality.

**Architectural decision (ADR-1):** Extract into `scripts/lib/artifact-utils.js`:
- `parseFilename(filename, taxonomy)` — extended to accept taxonomy for initiative inference
- `scanArtifactDirs(projectRoot, includeDirs)` — configurable directory scanner
- `readTaxonomy(projectRoot)` — taxonomy.yaml loader with validation
- `parseFrontmatter(content)` / `injectFrontmatter(content, fields)` — frontmatter read/write
- `ensureCleanTree(scopeDirs)` — checks tracked diffs AND untracked files within scope directories

Both `archive.js` (refactored) and `migrate-artifacts.js` consume this shared lib. Portfolio skill consumes the read-only subset. Archive.js gains clean-tree check as a "while we're here" improvement.

### Migration Pipeline Architecture (ADR-2)

**Decision: Full transactional pipeline with rollback.**

Pipeline phases: scan → infer → plan (dry-run) → review → execute → verify

- **Clean-tree safeguard:** Before execution, verify no uncommitted changes (`git diff --quiet && git diff --cached --quiet`) AND no untracked files within scope directories. Abort with clear message if dirty.
- **Commit 1 (renames):** All `git mv` operations. If any fails, `git reset --hard HEAD` to undo all renames. Nothing is committed in partial state.
- **Commit 2 (frontmatter injection):** All frontmatter injections. If any fails, `git reset --hard` back to commit 1 state (renames preserved, failed injections discarded).
- **Idempotent recovery (FR46):** Each commit phase is independently resumable. Re-run detects: "renames done, frontmatter pending" → skips to commit 2.

### Portfolio Inference Architecture (ADR-3)

**Decision: Rule chain pattern.**

Ordered list of rules, each enriching an initiative data object:

```javascript
// Inference contract — data structure flowing through rule chain
{
  initiative: 'helm',
  phase: { value: 'discovery', source: 'artifact-chain', confidence: 'inferred' },
  status: { value: 'ongoing', source: 'git-recency', confidence: 'inferred' },
  lastArtifact: { file: 'helm-hypothesis-hc3-2026-04-05.md', date: '2026-04-05' },
  nextAction: { value: 'HC4 experiment design', source: 'chain-gap' }
}
```

**Rule chain execution order:**
1. Read frontmatter (explicit status — highest priority)
2. Analyze artifact chain (inferred phase — Vortex HC sequence, epic presence)
3. Check git log (recency, stale detection)
4. Resolve conflicts (explicit wins over inferred)

Each rule is an independent module. New heuristics = new rule file appended to chain. NFR10 (modular inference) satisfied.

**Verbose output mode:** `--verbose` flag exposes the inference trace — showing source and confidence for each field. Default output is clean and compact. Verbose is for debugging and trust-building.

### Test Architecture Notes

- Integration tests for migration transactional rollback require **real git repos** as test fixtures — cannot be mocked
- Shared lib extraction brings `archive.js` filename parsing under test coverage for the first time
- Each inference rule in the portfolio chain is independently unit-testable
- Test fixtures must represent all known filename patterns in the current repository (NFR19)
