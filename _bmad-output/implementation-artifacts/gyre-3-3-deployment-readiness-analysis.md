# Story 3.3: Deployment Readiness Analysis

Status: done

## Story

As a user,
I want Lens to analyze my project for deployment gaps,
So that I know what CI/CD and deployment safety mechanisms are missing.

## Acceptance Criteria

1. **Given** the gap-analysis workflow step-03-deployment-analysis.md exists
   **When** Lens runs deployment analysis
   **Then** same analysis pattern as Story 3.2 but for deployment capabilities:
   - Uses Glob to search for relevant files (e.g., CI/CD configs, K8s manifests, Dockerfiles)
   - Uses Grep to search for implementation evidence (e.g., `deploy`, `rollback`, `SIGTERM`, `vault`)
   - Uses Read to examine config files for completeness
   **And** covers three GC2 categories: deployment, reliability, security
   **And** classifies each capability as: present (evidence found), absent (no evidence), partial (config exists but incomplete) (FR18)
   **And** tags each finding with source: static-analysis or contextual-model (FR19)
   **And** tags each finding with confidence: high/medium/low (FR20)
   **And** classifies each finding by severity: blocker/recommended/nice-to-have with rationale (FR21, FR50)
   **And** finding IDs use prefix DEP-NNN for all three categories
   **And** produces structured evidence report per FR23 (capability ID, evidence type, detection method, no file contents)

## Tasks / Subtasks

- [x] Task 1: Validate step-03-deployment-analysis.md structure (AC: #1)
  - [x] 1.1 Verify frontmatter: step=3, workflow=gap-analysis, title=Deployment Analysis — confirmed lines 2-4
  - [x] 1.2 Verify mandatory execution rules: same as observability (tools, existence search, cite methods, no file contents) — confirmed line 13
  - [x] 1.3 Verify three GC2 categories covered: deployment, reliability, security — confirmed line 14
  - [x] 1.4 Verify finding ID prefix: DEP-NNN for all three categories — confirmed line 15

- [x] Task 2: Validate deployment search patterns (AC: #1)
  - [x] 2.1 Verify deployment patterns table: CI/CD pipeline, container config, K8s manifests, rollback strategy, IaC, environment config, deployment strategy (7 rows) — confirmed lines 25-33
  - [x] 2.2 Verify reliability patterns table: graceful shutdown, circuit breakers, rate limiting, dependency health (4 rows) — confirmed lines 37-42
  - [x] 2.3 Verify security patterns table: secrets management, vulnerability scanning, network policies, auth patterns, image scanning (5 rows) — confirmed lines 46-52
  - [x] 2.4 Verify each row has Glob and Grep columns with specific patterns — confirmed all 16 rows across 3 tables

- [x] Task 3: Validate finding classification and tagging (AC: #1)
  - [x] 3.1 Verify classification: present/absent/partial (FR18) — confirmed line 57
  - [x] 3.2 Verify finding tagging: id (DEP-NNN), domain, severity, source, confidence, capability_ref, description, evidence_summary, severity_rationale — all 9 fields confirmed line 58
  - [x] 3.3 Verify source tagging: static-analysis vs contextual-model (FR19) — confirmed line 59
  - [x] 3.4 Verify severity guidelines: blocker/recommended/nice-to-have with deployment-specific rationale (FR21, FR50) — confirmed lines 63-65
  - [x] 3.5 Verify no file contents in findings — only categorical evidence descriptions (FR23) — confirmed line 13 via inherited rules

- [x] Task 4: Validate output format and step chain (AC: #1)
  - [x] 4.1 Verify output section: capabilities checked count, present/absent/partial breakdown, combined findings total — confirmed lines 71-81
  - [x] 4.2 Verify Load step directive to step-04-cross-domain-correlation.md — confirmed line 87

- [x] Task 5: Fix any discrepancies found in Tasks 1-4 — No discrepancies found

## Dev Notes

### Pre-existing File — Validation Approach

The file `_bmad/bme/_gyre/workflows/gap-analysis/steps/step-03-deployment-analysis.md` already exists from the 2026-03-21 architecture scaffolding (88 lines). This story validates it against the ACs. Same validation pattern as Story 3.2 (observability analysis).

### Architecture Reference — Deployment Analysis

From `architecture-gyre.md`:

**Gap-Analysis Step 3:**
- For each deployment capability: search filesystem for evidence
- Covers three GC2 categories: deployment, reliability, security
- Finding IDs: DEP-NNN (all three categories share this prefix)

**Deployment domain severity guidelines:**
- `blocker`: Missing capability that creates deployment risk (e.g., no rollback mechanism, no graceful shutdown on K8s)
- `recommended`: Missing capability that reduces deployment safety or velocity (e.g., no canary strategy, no IaC)
- `nice-to-have`: Missing capability that would improve deployment hygiene (e.g., no image scanning, no network policies for non-sensitive service)

### Key FR/NFR Requirements to Validate

| Requirement | What to Check |
|---|---|
| FR18 (capability classification) | present/absent/partial evidence states |
| FR19 (source tagging) | static-analysis vs contextual-model |
| FR20 (confidence levels) | high/medium/low with criteria |
| FR21 (severity classification) | blocker/recommended/nice-to-have with rationale |
| FR23 (structured evidence report) | capability ID, evidence type, detection method, no file contents |
| FR50 (severity rationale) | each finding includes severity_rationale |

### What NOT to Modify

- **Do NOT modify step-01 or step-02** — Already validated in Story 3.2
- **Do NOT modify step-04 or step-05** — Validated in Stories 3.4, 3.5
- **Do NOT modify workflow.md** — Already validated in Story 3.2
- **Do NOT modify Lens agent file** — Already validated in Story 3.1
- **Do NOT modify GC2 contract** — Already validated in Story 2.4

### Previous Story Intelligence

From Story 3.2 completion notes:
- All 22 validation subtasks passed — zero discrepancies across workflow.md, step-01, step-02
- Same validation pattern applies: frontmatter → execution rules → search patterns → classification → tagging → output → chain
- Step-02 has 6 observability patterns; step-03 should have deployment + reliability + security patterns (16 total per architecture)

From Story 3.1 completion notes:
- All 25 validation subtasks passed — zero discrepancies in Lens agent file
- Lens rules validated: absence detection, source-tagging, severity honesty

### Project Structure Notes

- Gap-analysis workflow: `_bmad/bme/_gyre/workflows/gap-analysis/`
- Target file: `_bmad/bme/_gyre/workflows/gap-analysis/steps/step-03-deployment-analysis.md`

### References

- [Source: _bmad-output/planning-artifacts/epic-gyre.md — Story 3.3 ACs]
- [Source: _bmad-output/planning-artifacts/architecture-gyre.md — deployment analysis patterns]
- [Source: _bmad/bme/_gyre/workflows/gap-analysis/steps/step-03-deployment-analysis.md — Pre-existing file]
- [Source: _bmad-output/implementation-artifacts/gyre-3-2-observability-readiness-analysis.md — Story 3.2 validation pattern]
- [Source: _bmad-output/implementation-artifacts/gyre-3-1-lens-agent-definition.md — Story 3.1 completion]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

None — no errors encountered.

### Completion Notes List

- All 17 validation subtasks passed across 5 tasks and 1 file — zero discrepancies found
- Task 1 (structure): Frontmatter, mandatory execution rules (inherited from step-02), three GC2 categories (deployment/reliability/security), DEP-NNN prefix — all correct
- Task 2 (search patterns): Deployment table (7 rows), reliability table (4 rows), security table (5 rows) — 16 total capability patterns, each with Glob and Grep columns — all correct
- Task 3 (classification/tagging): present/absent/partial (FR18), 9-field finding schema, source tagging (FR19), deployment-specific severity guidelines (FR21/FR50), no file contents rule (FR23) — all correct
- Task 4 (output/chain): Output format with combined findings total, Load directive to step-04 — all correct
- Task 5 (fix): No discrepancies found — third consecutive clean validation in Epic 3 (3.1 agent, 3.2 workflow+steps 1-2, 3.3 step-03)
- This is a validation-only story — no files were created or modified

### Change Log

- 2026-03-23: Full validation of step-03-deployment-analysis.md (88 lines) — all checks passed, no changes needed

### File List

- `_bmad/bme/_gyre/workflows/gap-analysis/steps/step-03-deployment-analysis.md` (validated, no changes)
