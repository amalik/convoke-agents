---
title: 'Party roster cleanup and team bundle resolution'
slug: 'spec-party-roster-cleanup'
created: '2026-03-24'
status: 'draft'
stepsCompleted: []
tech_stack: [markdown, csv, yaml]
files_to_modify:
  - _bmad/bmm/teams/default-party.csv
  - _bmad/tea/teams/default-party.csv
  - _bmad/cis/teams/default-party.csv
  - _bmad/bmm/teams/team-fullstack.yaml
  - _bmad/cis/teams/creative-squad.yaml
  - _bmad/_config/files-manifest.csv
code_patterns: []
test_patterns: [grep verification — no dangling references to default-party.csv]
---

# Spec: Party Roster Cleanup & Team Bundle Resolution

**Created:** 2026-03-24
**Source:** BMAD Method v6.2.1 — "Removed dead party roster files"
**Backlog refs:** I4 (convention alignment)

## Overview

### Problem Statement

BMAD Method v6.2.1 removed party roster files because party-mode now loads agents exclusively from `agent-manifest.csv`. Our project has 3 `default-party.csv` files that party-mode does NOT read at runtime. However, these files are **not fully orphaned** — two team bundle YAML files reference them:

- `_bmad/bmm/teams/team-fullstack.yaml` → `party: "./default-party.csv"`
- `_bmad/cis/teams/creative-squad.yaml` → `party: "./default-party.csv"`

Additionally, `_bmad/_config/files-manifest.csv` tracks all 3 roster files with integrity hashes.

Before removal, we must determine whether team bundle YAML files are consumed at runtime by any workflow, or whether the entire `teams/` directory tree is dead upstream infrastructure.

### Solution

1. Verify team bundle YAML files have no runtime consumers
2. If unused: remove all roster CSVs, update or remove team bundle YAMLs, clean up `files-manifest.csv`
3. If used: update team bundle YAMLs to remove `party` references (the agent list is already inline or available via `agent-manifest.csv`)

### Scope

**In Scope:**
- Verify whether team bundle YAML files (`team-fullstack.yaml`, `creative-squad.yaml`) are referenced by any workflow, installer, or skill
- Remove 3 `default-party.csv` files
- Update or remove team bundle YAML files that reference roster CSVs
- Remove 3 `default-party` entries from `files-manifest.csv`
- Verify party-mode still works correctly (reads from `agent-manifest.csv`)

**Out of Scope:**
- Changing party-mode's agent loading mechanism
- Designing Team Factory team template format (future P14 scope)
- Modifying `agent-manifest.csv` structure

## Context for Development

### Codebase Patterns

Party-mode's `step-01-agent-loading.md` reads from `{project-root}/_bmad/_config/agent-manifest.csv`. The team bundle YAML files appear to be an upstream BMAD pattern for defining named team compositions — but their runtime usage in our project is unverified.

### Files to Reference

| File | Purpose |
| ---- | ------- |
| `_bmad/bmm/teams/default-party.csv` | BMM module roster (15 agents) — to be removed |
| `_bmad/tea/teams/default-party.csv` | TEA module roster (1 agent) — to be removed |
| `_bmad/cis/teams/default-party.csv` | CIS module roster (12 agents) — to be removed |
| `_bmad/bmm/teams/team-fullstack.yaml` | Team bundle referencing `party: "./default-party.csv"` — update or remove |
| `_bmad/cis/teams/creative-squad.yaml` | Team bundle referencing `party: "./default-party.csv"` — update or remove |
| `_bmad/_config/files-manifest.csv` | Tracks roster files with integrity hashes — remove entries |
| `.claude/skills/bmad-party-mode/steps/step-01-agent-loading.md` | Confirm party-mode reads `agent-manifest.csv` |

### Technical Decisions

1. **Verify before delete** — grep for `team-fullstack`, `creative-squad`, and `default-party` references across all code, workflows, and install scripts before removing anything
2. **Update team bundles, don't blindly delete** — if the YAML files have other uses (e.g., agent listing via `agents:` field), only remove the `party:` line; if entirely unused, remove the files
3. **Clean up `files-manifest.csv`** — remove the 3 `default-party` entries (lines 77, 326, 428) to keep manifest integrity
4. **`teams/` directories may NOT be empty after cleanup** — `team-fullstack.yaml` and `creative-squad.yaml` may remain if they serve other purposes

## Implementation Plan

### Tasks

- [ ] **Task 1: Verify team bundle consumers** — Search entire project for references to `team-fullstack`, `creative-squad`, and any code that reads `teams/*.yaml` files. Determine if any workflow, installer, or skill loads team bundles at runtime
- [ ] **Task 2: Confirm party-mode data source** — Read `step-01-agent-loading.md` and verify it references `agent-manifest.csv`, not roster files or team bundle YAMLs
- [ ] **Task 3: Update or remove team bundle YAMLs** — Based on Task 1 findings: if unused, remove entirely; if the `agents:` list is used elsewhere, remove only the `party:` reference line
- [ ] **Task 4: Remove roster files** — Delete all 3 `default-party.csv` files
- [ ] **Task 5: Update `files-manifest.csv`** — Remove the 3 `default-party` entries
- [ ] **Task 6: Verify zero dangling references** — `grep -r "default-party" .` returns only this spec file and the backlog entry
- [ ] **Task 7: Smoke test** — Invoke party-mode and verify agent loading works without roster files

### Acceptance Criteria

- [ ] Zero `default-party.csv` files exist in the project
- [ ] Team bundle YAML files either removed (if unused) or updated to remove `party:` reference
- [ ] `files-manifest.csv` contains zero `default-party` entries
- [ ] `grep -r "default-party"` returns only documentation references (backlog, this spec)
- [ ] Party-mode successfully loads agents from `agent-manifest.csv`
- [ ] No install/update/migration scripts reference roster files or team bundle YAMLs
