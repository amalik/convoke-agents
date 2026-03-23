# Story 3.2: Observability Readiness Analysis

Status: done

## Story

As a user,
I want Lens to analyze my project for observability gaps,
So that I know what monitoring and instrumentation is missing.

## Acceptance Criteria

1. **Given** the gap-analysis workflow step-02-observability-analysis.md exists
   **When** Lens runs observability analysis
   **Then** for each observability capability in GC2:
   - Uses Glob to search for relevant files (e.g., health check endpoints, metrics configs, logging setups)
   - Uses Grep to search for implementation evidence (e.g., `opentelemetry`, `prometheus`, `healthz`)
   - Uses Read to examine config files for completeness
   **And** classifies each capability as: present (evidence found), absent (no evidence), partial (config exists but incomplete) (FR18)
   **And** tags each finding with source: static-analysis (file evidence) or contextual-model (inferred from manifest) (FR19)
   **And** tags each finding with confidence: high/medium/low (FR20)
   **And** classifies each finding by severity: blocker/recommended/nice-to-have with rationale (FR21, FR50)
   **And** produces structured evidence report per FR23 (capability ID, evidence type, detection method, no file contents)

## Tasks / Subtasks

- [x] Task 1: Validate gap-analysis workflow.md (AC: #1)
  - [x] 1.1 Verify frontmatter: name=gap-analysis, agent=readiness-analyst, steps=5 — confirmed lines 2-6
  - [x] 1.2 Verify pipeline table lists all 5 steps with correct files and actions — confirmed lines 20-26
  - [x] 1.3 Verify prerequisites: GC2 must exist at `.gyre/capabilities.yaml` — confirmed lines 15-16
  - [x] 1.4 Verify privacy boundary: findings reference capability IDs, NOT file contents — confirmed lines 28-30
  - [x] 1.5 Verify Load step directive points to step-01-load-manifest.md — confirmed lines 36-38

- [x] Task 2: Validate step-01-load-manifest.md (AC: #1)
  - [x] 2.1 Verify frontmatter: step=1, workflow=gap-analysis, title=Load Capabilities Manifest — confirmed lines 2-4
  - [x] 2.2 Verify GC2 loading from `.gyre/capabilities.yaml` with Read tool — confirmed lines 13, 22
  - [x] 2.3 Verify error handling: if GC2 not found, directs user to Atlas model-generation — confirmed lines 28-39, STOP directive
  - [x] 2.4 Verify filter: removed capabilities (removed: true) excluded from analysis — confirmed line 43
  - [x] 2.5 Verify grouping by category: observability, deployment (includes reliability + security) — confirmed lines 44-48
  - [x] 2.6 Verify analysis plan presentation: stack summary, counts, domain breakdown — confirmed lines 50-64
  - [x] 2.7 Verify Load step directive to step-02 — confirmed line 70

- [x] Task 3: Validate step-02-observability-analysis.md (AC: #1)
  - [x] 3.1 Verify frontmatter: step=2, workflow=gap-analysis, title=Observability Analysis — confirmed lines 2-4
  - [x] 3.2 Verify tool usage: Glob (find files), Grep (search patterns), Read (examine configs) — confirmed lines 27-39
  - [x] 3.3 Verify search patterns table: structured logging, distributed tracing, metrics, health checks, alerting, error tracking — confirmed lines 43-50 (6 rows)
  - [x] 3.4 Verify classification: present/absent/partial (FR18) — confirmed lines 54-61
  - [x] 3.5 Verify finding tagging: id (OBS-NNN), domain, severity, source, confidence, capability_ref, description, evidence_summary, severity_rationale — all 9 fields confirmed lines 67-76
  - [x] 3.6 Verify source tagging: static-analysis vs contextual-model (FR19) — confirmed lines 78-80
  - [x] 3.7 Verify confidence levels: high/medium/low with criteria (FR20) — confirmed lines 87-90
  - [x] 3.8 Verify severity guidelines: blocker/recommended/nice-to-have with rationale (FR21, FR50) — confirmed lines 82-85
  - [x] 3.9 Verify no file contents in findings — only categorical evidence descriptions (FR23) — confirmed line 16
  - [x] 3.10 Verify Load step directive to step-03 — confirmed line 110

- [x] Task 4: Validate step-file chain for gap-analysis workflow
  - [x] 4.1 Verify chain: workflow → step-01 → step-02 → step-03 → step-04 → step-05 — confirmed via Load directives (workflow line 37, step-01 line 70, step-02 line 110, step-03 line 87, step-04 line 105)
  - [x] 4.2 Verify all step files reference `workflow: gap-analysis` in frontmatter — confirmed all 5 step files line 3

- [x] Task 5: Fix any discrepancies found in Tasks 1-4 — No discrepancies found

## Dev Notes

### Pre-existing Files — Validation Approach

All gap-analysis workflow files already exist from the 2026-03-21 architecture scaffolding:

- `_bmad/bme/_gyre/workflows/gap-analysis/workflow.md` — workflow entry point
- `_bmad/bme/_gyre/workflows/gap-analysis/steps/step-01-load-manifest.md` — load GC2
- `_bmad/bme/_gyre/workflows/gap-analysis/steps/step-02-observability-analysis.md` — observability domain
- `_bmad/bme/_gyre/workflows/gap-analysis/steps/step-03-deployment-analysis.md` — deployment domain (Story 3.3)
- `_bmad/bme/_gyre/workflows/gap-analysis/steps/step-04-cross-domain-correlation.md` — compounds (Story 3.4)
- `_bmad/bme/_gyre/workflows/gap-analysis/steps/step-05-present-findings.md` — GC3 write (Story 3.5)

This story validates workflow.md, step-01, and step-02 against the ACs. Steps 03-05 are validated in subsequent stories.

### Architecture Reference — Gap-Analysis Workflow

From `architecture-gyre.md`:

**Workflow 4: gap-analysis (Lens)**
- Owner: Lens 🔬
- Steps: 5
- Purpose: Absence detection across observability and deployment domains with cross-domain correlation

| Step | File | Action |
|------|------|--------|
| 1 | step-01-load-manifest.md | Load GC2, filter removed, group by category |
| 2 | step-02-observability-analysis.md | For each observability capability: search filesystem for evidence |
| 3 | step-03-deployment-analysis.md | For each deployment capability: search filesystem for evidence |
| 4 | step-04-cross-domain-correlation.md | Identify compound patterns across domains |
| 5 | step-05-present-findings.md | Present severity-first summary, write GC3 |

### Key FR/NFR Requirements to Validate

| Requirement | What to Check |
|---|---|
| FR18 (capability classification) | present/absent/partial evidence states |
| FR19 (source tagging) | static-analysis vs contextual-model |
| FR20 (confidence levels) | high/medium/low with criteria |
| FR21 (severity classification) | blocker/recommended/nice-to-have with rationale |
| FR23 (structured evidence report) | capability ID, evidence type, detection method, no file contents |
| FR50 (severity rationale) | each finding includes severity_rationale |

### Finding Schema (from architecture)

```yaml
- id: "OBS-NNN"
  domain: "observability"
  severity: "blocker|recommended|nice-to-have"
  source: "static-analysis|contextual-model"
  confidence: "high|medium|low"
  capability_ref: "[GC2 capability ID]"
  description: "[what's missing]"
  evidence_summary: "[what was searched]"
  severity_rationale: "[why this severity]"
```

### What NOT to Modify

- **Do NOT modify Lens agent file** — Already validated in Story 3.1
- **Do NOT modify step-03 through step-05** — Validated in Stories 3.3, 3.4, 3.5
- **Do NOT modify GC2 contract** — Already validated in Story 2.4
- **Do NOT modify GC3 contract** — Validated in Story 3.5

### Previous Story Intelligence

From Story 3.1 completion notes:
- All 25 validation subtasks passed — zero discrepancies in Lens agent file
- Lens rules validated: GC2 prerequisite, absence detection, source-tagging, severity honesty, cross-domain correlation, confidence accuracy

From Story 2.3 completion notes (model-generation workflow — same validation pattern):
- All 30 subtasks passed across workflow.md + 4 step files
- Same step-file chain validation approach applies

### Project Structure Notes

- Gap-analysis workflow: `_bmad/bme/_gyre/workflows/gap-analysis/`
- GC2 contract: `_bmad/bme/_gyre/contracts/gc2-capabilities-manifest.md`
- GC3 contract: `_bmad/bme/_gyre/contracts/gc3-findings-report.md`

### References

- [Source: _bmad-output/planning-artifacts/epic-gyre.md — Story 3.2 ACs]
- [Source: _bmad-output/planning-artifacts/architecture-gyre.md — gap-analysis workflow]
- [Source: _bmad/bme/_gyre/workflows/gap-analysis/ — Pre-existing workflow + 5 step files]
- [Source: _bmad/bme/_gyre/contracts/gc3-findings-report.md — GC3 schema]
- [Source: _bmad-output/implementation-artifacts/gyre-3-1-lens-agent-definition.md — Story 3.1 completion]
- [Source: _bmad-output/implementation-artifacts/gyre-2-3-model-generation-workflow.md — Story 2.3 validation pattern]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

None — no errors encountered.

### Completion Notes List

- All 22 validation subtasks passed across 5 tasks and 3 files — zero discrepancies found
- Task 1 (workflow.md): Frontmatter (name, agent, steps), pipeline table (5 steps), prerequisites (GC2), privacy boundary (capability IDs not file contents), Load directive — all correct
- Task 2 (step-01-load-manifest): Frontmatter, GC2 loading with Read tool, error handling (Atlas redirect + STOP), removed filter, 4-category grouping (observability, deployment, reliability, security), analysis plan presentation, Load directive — all correct
- Task 3 (step-02-observability-analysis): Frontmatter, tool usage (Glob/Grep/Read), search patterns table (6 capabilities), present/absent/partial classification (FR18), 9-field finding schema (FR23), source tagging static-analysis/contextual-model (FR19), confidence levels with criteria (FR20), severity guidelines with rationale (FR21/FR50), no file contents rule, Load directive — all correct
- Task 4 (step-file chain): Complete chain workflow → step-01 → step-02 → step-03 → step-04 → step-05 verified via Load directives, all 5 step files reference `workflow: gap-analysis`
- Task 5 (fix): No discrepancies found — fourth consecutive clean validation in Epic 3 sequence (3.1 Lens agent, now 3.2 gap-analysis workflow + steps 1-2)
- This is a validation-only story — no files were created or modified

### Change Log

- 2026-03-23: Full validation of workflow.md (39 lines), step-01-load-manifest.md (71 lines), step-02-observability-analysis.md (111 lines) — all checks passed, no changes needed

### File List

- `_bmad/bme/_gyre/workflows/gap-analysis/workflow.md` (validated, no changes)
- `_bmad/bme/_gyre/workflows/gap-analysis/steps/step-01-load-manifest.md` (validated, no changes)
- `_bmad/bme/_gyre/workflows/gap-analysis/steps/step-02-observability-analysis.md` (validated, no changes)
- `_bmad/bme/_gyre/workflows/gap-analysis/steps/step-03-deployment-analysis.md` (chain validation only, no changes)
- `_bmad/bme/_gyre/workflows/gap-analysis/steps/step-04-cross-domain-correlation.md` (chain validation only, no changes)
- `_bmad/bme/_gyre/workflows/gap-analysis/steps/step-05-present-findings.md` (chain validation only, no changes)
