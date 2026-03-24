---
title: 'Skill Validator for Team Factory Pipeline'
slug: 'spec-skill-validator-team-factory'
created: '2026-03-24'
status: 'draft'
stepsCompleted: []
tech_stack: [node, javascript]
files_to_modify:
  - scripts/update/lib/validator.js
  - scripts/update/lib/validator.test.js (new test cases)
code_patterns: [validator pattern from existing validator.js]
test_patterns: [unit tests mirroring existing validator.test.js structure]
---

# Spec: Skill Validator for Team Factory Pipeline

**Created:** 2026-03-24
**Source:** BMAD Method v6.2.1 changelog analysis — deterministic skill validator introduced upstream
**Backlog refs:** I4 (convention alignment, stretch goal), P14 (Team Factory)

## Overview

### Problem Statement

The Team Factory (P14) can generate agent skills and SKILL.md files, but has no quality gate to catch malformed output before it lands in `.claude/skills/`. Our current `validator.js` validates *installation integrity* (agent files exist, workflows present, config valid) but performs zero *semantic skill validation* (SKILL.md schema, step-file cohesion, workflow entry-point consistency). BMAD Method v6.2.1 shipped a deterministic skill validator for CI — we need equivalent coverage for factory-generated skills.

### Solution

Extend `validator.js` with a new `validateSkill(skillDir)` function that validates individual skill packages. Integrate this as a mandatory quality gate in the Team Factory generation pipeline. Evaluate upstream's v6.2.1 validator for adoption or alignment.

### Scope

**In Scope:**
- `validateSkill(skillDir)` function in `validator.js`
- SKILL.md frontmatter schema validation (required fields: `name`, `description`)
- Step-file structural checks (numbered step files exist, `workflow.md` present if multi-step)
- Skill cohesion check (step files referenced in workflow actually exist)
- Integration point in Team Factory pipeline (call after generation, fail-fast on errors)
- Unit tests for all new validation functions

**Out of Scope:**
- `bmad-skill-manifest.yaml` adoption (separate I4 scope)
- LLM-based content quality assessment (deferred sophistication)
- Validating non-factory skills (existing installed skills are trusted)
- CI pipeline integration (future — I4 scope)

## Context for Development

### Codebase Patterns

The existing validator follows a consistent pattern:
- Each check is a standalone function returning `{ valid: boolean, errors: string[] }`
- Functions are exported individually and composed in higher-level validators
- Tests mirror function names 1:1 in `validator.test.js`

### Files to Reference

| File | Purpose |
| ---- | ------- |
| `scripts/update/lib/validator.js` | Existing validator — add `validateSkill()` here |
| `tests/unit/validator.test.js` | Existing tests — add new test cases here |
| `.claude/skills/bmad-agent-bme-*/SKILL.md` | Reference SKILL.md files (known-good examples) |
| `.claude/skills/bmad-team-factory/workflow.md` | Team Factory workflow — integration point |
| `scripts/update/lib/refresh-installation.js` | SKILL.md generation logic (lines ~425-500) — schema reference |

### Technical Decisions

1. **Extend existing validator, don't create new file** — follows codebase convention, reuses test infrastructure
2. **Function-level granularity** — `validateSkillMd(path)`, `validateStepFiles(dir)`, `validateSkillCohesion(dir)` composed into `validateSkill(dir)`
3. **Return format matches existing pattern** — `{ valid, errors }` for composability
4. **No upstream dependency** — build our own based on our SKILL.md schema; align with upstream conventions but don't import their validator

## Implementation Plan

### Tasks

- [ ] **Task 1: Analyze existing SKILL.md schema** — Read 5+ generated SKILL.md files, document required/optional fields and structural patterns
- [ ] **Task 2: Implement `validateSkillMd()`** — Validate frontmatter fields (`name`, `description` required), markdown structure, file existence
- [ ] **Task 3: Implement `validateStepFiles()`** — Check numbered step files (`step-01-*.md` through `step-0N-*.md`), verify sequential numbering, no gaps
- [ ] **Task 4: Implement `validateSkillCohesion()`** — Cross-reference `workflow.md` step references against actual step files present
- [ ] **Task 5: Compose `validateSkill()`** — Orchestrate all three sub-validators, aggregate errors
- [ ] **Task 6: Unit tests** — Full coverage for all new functions including edge cases (empty dir, missing workflow.md, bad frontmatter)
- [ ] **Task 7: Team Factory integration** — Add validation call after skill generation in factory workflow, document fail-fast behavior

### Acceptance Criteria

- [ ] `validateSkill()` returns `{ valid: false, errors: [...] }` for a SKILL.md missing `name` field
- [ ] `validateSkill()` returns `{ valid: false, errors: [...] }` for step-file numbering gaps (e.g., step-01, step-03 with no step-02)
- [ ] `validateSkill()` returns `{ valid: true, errors: [] }` for any existing `.claude/skills/bmad-agent-bme-*` directory
- [ ] `validateSkillCohesion()` catches orphaned step files not referenced in workflow.md
- [ ] Team Factory workflow calls `validateSkill()` after generation and halts on failure
- [ ] All new validator functions have unit tests with ≥90% branch coverage
- [ ] No changes to existing validator behavior (existing tests still pass)
