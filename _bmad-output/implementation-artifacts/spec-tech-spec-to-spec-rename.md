---
title: 'Rename tech-spec prefix to spec (v6.2.1 alignment)'
slug: 'spec-tech-spec-to-spec-rename'
created: '2026-03-24'
status: 'draft'
stepsCompleted: []
tech_stack: [markdown]
files_to_modify:
  - _bmad/bmm/workflows/bmad-quick-flow/bmad-quick-spec/ (7 files incl. SKILL.md)
  - _bmad/bmm/workflows/bmad-quick-flow/bmad-quick-dev/ (9 files incl. SKILL.md)
  - _bmad/bmm/workflows/bmad-quick-flow/bmad-quick-dev-new-preview/ (4 files)
  - _bmad/bmm/workflows/4-implementation/bmad-correct-course/workflow.md
  - _bmad/bmm/agents/quick-flow-solo-dev.md
  - _bmad/tea/workflows/testarch/ (8 files across 5 workflows)
  - _bmad/_config/files-manifest.csv
  - _bmad/_config/skill-manifest.csv
  - _bmad/_config/agent-manifest.csv
  - _bmad/_config/bmad-help.csv
  - _bmad/bmm/module-help.csv
  - docs/WARP.md
code_patterns: [search-and-replace across markdown]
test_patterns: [grep verification — zero remaining tech-spec references post-rename]
---

# Spec: Rename tech-spec Prefix to spec (v6.2.1 Alignment)

**Created:** 2026-03-24
**Source:** BMAD Method v6.2.1 — "Renamed tech-spec prefix to 'spec'"
**Backlog refs:** I4 (convention alignment)

## Overview

### Problem Statement

BMAD Method v6.2.1 renamed the `tech-spec` prefix to `spec` across Quick Dev workflows. Our project still uses `tech-spec` in 35 files (87 occurrences) across BMM and TEA modules, plus config CSVs. This creates naming divergence: upstream-generated specs will use `spec-*` while our workflows produce `tech-spec-*` files. Users working with both upstream and Convoke-specific workflows will encounter inconsistent naming.

### Solution

Mechanical rename of `tech-spec` → `spec` across all affected files. No functional changes — pure naming alignment.

### Scope

**In Scope:**
- Template file renames: `tech-spec-template.md` → `spec-template.md` (2 files)
- WIP file path references: `tech-spec-wip.md` → `spec-wip.md`
- Archive naming pattern: `tech-spec-{slug}-*` → `spec-{slug}-*`
- Discovery globs: `*tech-spec*.md` → `spec-*.md` (use prefix glob, not infix — avoids false positives on unrelated spec files)
- Variable names: `{tech_spec_path}` → `{spec_path}`
- User-facing text: "tech-spec" → "spec" in prompts and messages
- TEA workflow references to loading `tech-spec.md`
- `files-manifest.csv` entries
- `skill-manifest.csv`, `agent-manifest.csv`, `bmad-help.csv`, `module-help.csv` entries
- SKILL.md descriptions for quick-dev and quick-spec
- `quick-flow-solo-dev.md` agent file references
- WARP.md documentation

**Out of Scope:**
- Renaming existing user-generated `tech-spec-*.md` files in `_bmad-output/` (user artifacts — don't touch)
- Migration logic for existing installations (handled by refresh-installation on next update)
- Quick Dev step-file refactoring (separate upstream change, not just a rename)

## Context for Development

### Codebase Patterns

This is a cross-module rename touching two modules:
- **BMM** (Business Management Module): Quick-spec workflow, Quick-dev workflow, Correct-course workflow
- **TEA** (Test Architecture): 5 testarch workflows reference tech-spec for context loading

The rename is mechanical but must be thorough — a partial rename would break glob discovery patterns.

### Files to Reference

| File | Purpose |
| ---- | ------- |
| `_bmad/bmm/workflows/bmad-quick-flow/bmad-quick-spec/steps/step-01-understand.md` | Heaviest concentration — WIP path, archive pattern, template reference |
| `_bmad/bmm/workflows/bmad-quick-flow/bmad-quick-spec/tech-spec-template.md` | Template file to rename |
| `_bmad/bmm/workflows/bmad-quick-flow/bmad-quick-dev-new-preview/tech-spec-template.md` | Second template file to rename |
| `_bmad/bmm/workflows/bmad-quick-flow/bmad-quick-dev/workflow.md` | State variable `{tech_spec_path}` |
| `_bmad/tea/workflows/testarch/bmad-testarch-trace/checklist.md` | TEA reference to `tech-spec.md` |
| `docs/WARP.md` | Documentation glob pattern `*tech-spec*.md` |

### Technical Decisions

1. **Rename template files on disk** — not just references, the actual `tech-spec-template.md` files become `spec-template.md`
2. **Variable rename `{tech_spec_path}` → `{spec_path}`** — consistency between file names and variable names
3. **Discovery globs use prefix form** — `spec-*.md` not `*spec*.md`. The infix form would false-positive on unrelated files (e.g., `spec-skill-validator-team-factory.md` in `_bmad-output/`). Prefix form is tighter and sufficient
4. **No backward-compatibility shims** — clean rename, no aliases

## Implementation Plan

### Tasks

- [ ] **Task 1: Rename template files** — `tech-spec-template.md` → `spec-template.md` in quick-spec and quick-dev-new-preview
- [ ] **Task 2: Update quick-spec workflow** — SKILL.md + workflow.md + all 4 step files: WIP path, archive pattern, template reference, user-facing text (7 occurrences in step-01 alone)
- [ ] **Task 3: Update quick-dev workflow** — SKILL.md + workflow.md + all 6 step files: mode detection (12 hits), context-gathering, execution, self-check, review, resolve
- [ ] **Task 4: Update quick-dev-new-preview** — workflow.md + step-01-clarify-and-route.md + step-02-plan.md
- [ ] **Task 5: Update quick-flow-solo-dev agent** — `_bmad/bmm/agents/quick-flow-solo-dev.md` (2 references)
- [ ] **Task 6: Update correct-course** — Discovery glob pattern (`*tech-spec*.md` → `spec-*.md`)
- [ ] **Task 7: Update TEA workflows** — 8 files across testarch-trace, test-design, NFR, framework, automate
- [ ] **Task 8: Update config CSVs** — `files-manifest.csv`, `skill-manifest.csv`, `agent-manifest.csv`, `bmad-help.csv`, `module-help.csv`
- [ ] **Task 9: Update WARP.md** — Documentation glob pattern and references
- [ ] **Task 10: Verify zero remaining references** — `grep -ri "tech.spec" _bmad/ docs/` returns zero results (excluding `_bmad-output/`)

### Acceptance Criteria

- [ ] Zero files named `tech-spec-template.md` remain in `_bmad/`
- [ ] Zero references to `tech-spec-wip.md` or `{tech_spec_path}` remain
- [ ] `grep -ri "tech.spec" _bmad/ docs/` returns zero results (excluding this spec file itself)
- [ ] Quick-spec workflow generates `spec-wip.md` (not `tech-spec-wip.md`)
- [ ] TEA workflows discover `spec*.md` artifacts correctly
- [ ] No existing user artifacts in `_bmad-output/` are modified or renamed
