# Story 1.3: Stack Detection Workflow

Status: review

## Story

As a user,
I want Scout to scan my project and tell me what technology stack it detected,
So that I can confirm or correct the classification before analysis.

## Acceptance Criteria

1. **Given** the stack-detection workflow exists at `_bmad/bme/_gyre/workflows/stack-detection/`
   **When** Scout runs the workflow
   **Then** it has 3 step files following step-file architecture (JIT loading, sequential enforcement, frontmatter state tracking)

2. **Given** `workflow.md` is the entry point
   **When** Scout activates the workflow via `exec` handler
   **Then** it has correct frontmatter (`workflow: stack-detection`, `type: step-file`, `author: Scout (stack-detective)`, `version: 1.0.0`)
   **And** it loads config from `{project-root}/_bmad/bme/_gyre/config.yaml`
   **And** it ends with `Load step:` directive pointing to `step-01-scan-filesystem.md`

3. **Given** step-01-scan-filesystem.md executes
   **When** Scout scans the project
   **Then** it uses Glob to find: package manifests (package.json, go.mod, requirements.txt, Cargo.toml, pom.xml, and others), Dockerfiles, docker-compose.yaml, k8s manifests, CI configs (.github/workflows/, .gitlab-ci.yml, Jenkinsfile), IaC templates (terraform/, cloudformation/), cloud provider configs
   **And** it uses Grep to search for: framework imports, observability tool references (opentelemetry, prometheus, datadog), cloud provider SDKs
   **And** it uses Read to examine: detected config files for specific settings
   **And** it covers FR1, FR1b, FR2, FR3, FR4, FR5
   **And** it includes monorepo/multi-service detection (FR1b, FR51) with service root = manifest + deployment config
   **And** it ends with `Load step:` directive pointing to `step-02-classify-stack.md`

4. **Given** step-02-classify-stack.md executes
   **When** Scout classifies the stack
   **Then** it identifies: primary language/framework, container orchestration, CI/CD platform, observability tooling, cloud provider, communication protocol
   **And** it provides 10 common archetype templates for classification
   **And** it assigns confidence levels (high/medium/low/none) per category
   **And** it identifies ambiguities requiring guard questions
   **And** if multiple stacks detected (FR1b), it selects primary and surfaces secondary as warning
   **And** if classification is fully unambiguous (all high confidence), it skips guard questions entirely
   **And** it ends with `Load step:` directive pointing to `step-03-guard-questions.md` (conditional on ambiguities)

5. **Given** step-03-guard-questions.md executes
   **When** Scout needs to confirm architecture intent
   **Then** it asks ≤3 guard questions derived from what was detected (not a fixed list) (FR6)
   **And** questions cover: deployment model, communication protocol, ambiguous detections
   **And** user answers conversationally (FR7)
   **And** if user corrects a previous answer, Scout re-classifies without re-scanning (FR8)
   **And** guard response processing takes <1 second (NFR3) — no additional file scanning on correction
   **And** guard options cover ≥95% of common architectures (NFR20)
   **And** if detection is unambiguous, guard questions are skipped entirely
   **And** final step includes compass routing table (Write Stack Profile / Chat / Menu)

## Tasks / Subtasks

- [x] Task 1: Validate workflow.md entry point (AC: #2)
  - [x] 1.1 Verify frontmatter: `workflow: stack-detection`, `type: step-file`, `author: Scout (stack-detective)`, `version: 1.0.0`
  - [x] 1.2 Verify description matches purpose: detecting and classifying project technology stack
  - [x] 1.3 Verify step-file architecture explanation: JIT loading, sequential enforcement, state tracking
  - [x] 1.4 Verify Steps Overview lists all 3 steps with correct titles
  - [x] 1.5 Verify Output section references `.gyre/stack-profile.yaml` (GC1) with privacy boundary statement
  - [x] 1.6 Verify INITIALIZATION loads config from `{project-root}/_bmad/bme/_gyre/config.yaml`
  - [x] 1.7 Verify final line is `Load step: {project-root}/_bmad/bme/_gyre/workflows/stack-detection/steps/step-01-scan-filesystem.md`

- [x] Task 2: Validate step-01-scan-filesystem.md (AC: #3)
  - [x] 2.1 Verify frontmatter: `step: 1`, `workflow: stack-detection`, `title: Scan Filesystem`
  - [x] 2.2 Verify mandatory execution rules: use Claude Code tools (not ask user), report with evidence, no file contents in profile, breadth-first
  - [x] 2.3 Verify scan category 1 — Package Manifests: Glob for 10+ manifest types, Read for framework identification
  - [x] 2.4 Verify scan category 2 — Container & Orchestration: Glob for Dockerfile, compose, k8s, ECS, fly.toml, render.yaml, Procfile
  - [x] 2.5 Verify scan category 3 — CI/CD Platform: Glob for GitHub Actions, GitLab CI, Jenkins, CircleCI, Azure, Bitbucket, Travis
  - [x] 2.6 Verify scan category 4 — Observability Tooling: Grep for otel/prometheus/datadog/newrelic/sentry/grafana/elk/structured-logging + Glob for config files
  - [x] 2.7 Verify scan category 5 — Cloud Provider: Glob for terraform/cloudformation/pulumi/serverless/cdk/firebase + Grep for SDK imports
  - [x] 2.8 Verify scan category 6 — Communication Protocol: Grep for gRPC/GraphQL/REST/AMQP/Kafka/Redis/WebSocket
  - [x] 2.9 Verify scan category 7 — Monorepo/Multi-Service Detection (FR1b, FR51): manifest + deployment config criteria, service root selection prompt, `.gyre/` at service root
  - [x] 2.10 Verify Findings Compilation section presents results table with Category/Detected/Evidence columns
  - [x] 2.11 Verify NEXT STEP has `Load step:` directive to `step-02-classify-stack.md`

- [x] Task 3: Validate step-02-classify-stack.md (AC: #4)
  - [x] 3.1 Verify frontmatter: `step: 2`, `workflow: stack-detection`, `title: Classify Stack`
  - [x] 3.2 Verify mandatory execution rules: derived from Step 1 evidence, no new scans, honest ambiguity identification
  - [x] 3.3 Verify 10 archetype templates in table (Node.js Web Service, Node.js Frontend App, Go Microservice, Python Data Pipeline, Python Web Service, JVM Enterprise, Rust System Service, Ruby Web App, .NET Service, Multi-language)
  - [x] 3.4 Verify multi-stack detection section (FR1b): list service roots, do NOT use implicit boundary detection
  - [x] 3.5 Verify confidence assessment table: high/medium/low/none with criteria
  - [x] 3.6 Verify ambiguity identification section: deployment model, communication protocol, cloud provider, architecture intent examples
  - [x] 3.7 Verify classification output template with archetype + 7-category table + confidence + ambiguity count
  - [x] 3.8 Verify secondary stack warning format with path and description
  - [x] 3.9 Verify NEXT STEP has conditional logic: ambiguities → Load step-03, no ambiguities → skip guard questions

- [x] Task 4: Validate step-03-guard-questions.md (AC: #5)
  - [x] 4.1 Verify frontmatter: `step: 3`, `workflow: stack-detection`, `title: Guard Questions`
  - [x] 4.2 Verify mandatory execution rules: max 3 questions, skip if unambiguous, derived from detection, conversational answers (FR7), re-classify without re-scan (FR8), <1s processing (NFR3), ≥95% coverage (NFR20)
  - [x] 4.3 Verify question generation pattern: evidence + interpretation A + conflicting evidence + interpretation B + options (a/b/c)
  - [x] 4.4 Verify 3 common guard question templates: deployment model, communication protocol, cloud provider
  - [x] 4.5 Verify conversation flow: present all at once, accept any format, acknowledge and update, handle corrections
  - [x] 4.6 Verify correction handling section (FR8): accept, update, check cascade, re-present, NO re-scan
  - [x] 4.7 Verify final classification output template with Source column (detection / guard)
  - [x] 4.8 Verify completion section: compass routing table (Write Stack Profile / Chat / Menu)

- [x] Task 5: Validate Load step directive chain (AC: #1, #2, #3, #4, #5)
  - [x] 5.1 Verify workflow.md → step-01 → step-02 → step-03 chain is correct and paths use `{project-root}` prefix
  - [x] 5.2 Verify step-02 has conditional skip logic (no ambiguities → skip step-03)

- [x] Task 6: Fix any discrepancies found in Tasks 1-5 — No discrepancies found

## Dev Notes

### Pre-existing Files

All 4 workflow files already exist from the 2026-03-21 architecture scaffolding session:
- `_bmad/bme/_gyre/workflows/stack-detection/workflow.md` (43 lines)
- `_bmad/bme/_gyre/workflows/stack-detection/steps/step-01-scan-filesystem.md` (177 lines)
- `_bmad/bme/_gyre/workflows/stack-detection/steps/step-02-classify-stack.md` (112 lines)
- `_bmad/bme/_gyre/workflows/stack-detection/steps/step-03-guard-questions.md` (118 lines)

This story validates the existing files against the ACs rather than creating from scratch. Fix any discrepancies found.

### Step-File Architecture Pattern

Gyre workflows follow the same step-file architecture as Vortex:
- **Frontmatter:** `workflow`, `type: step-file`, `description`, `author`, `version` in workflow.md; `step`, `workflow`, `title` in step files
- **JIT loading:** Each step loads only when the previous step completes
- **Sequential enforcement:** Must complete step N before step N+1
- **Load step directives:** `Load step: {project-root}/_bmad/bme/_gyre/workflows/<name>/steps/step-NN-<title>.md`
- **Final step:** Includes compass routing table pointing to next actions

Pattern reference: `_bmad/bme/_vortex/workflows/signal-interpretation/workflow.md`

### FR/NFR Coverage Map

| Requirement | Where Covered |
|-------------|---------------|
| FR1 (stack detection from filesystem) | step-01: all 7 scan categories |
| FR1b (multi-stack/monorepo) | step-01 §7, step-02 §2 |
| FR2 (container detection) | step-01 §2 |
| FR3 (CI/CD detection) | step-01 §3 |
| FR4 (observability detection) | step-01 §4 |
| FR5 (cloud provider detection) | step-01 §5 |
| FR6 (≤3 guard questions) | step-03 mandatory rules |
| FR7 (conversational answers) | step-03 mandatory rules |
| FR8 (correction re-classify) | step-03 §Correction Handling |
| FR51 (monorepo service boundary) | step-01 §7 |
| NFR3 (guard <1s processing) | step-03 mandatory rules — no re-scan on correction |
| NFR20 (≥95% architecture coverage) | step-03 mandatory rules, 3 template questions |

### Privacy Boundary

The privacy boundary is enforced at the workflow level (workflow.md Output section) and at the step level (step-01 mandatory rules): Stack Profile contains technology categories only — NOT file contents, file paths, version numbers, dependency counts, dependency names, or secrets.

### What NOT to Modify

- **Do NOT modify config.yaml** — Already validated in Story 1.1
- **Do NOT modify the agent file** — Already validated in Story 1.2
- **Do NOT create contract files** — Story 1.4 creates GC1 contract
- **Do NOT create full-analysis workflow** — Separate story (deferred to later epic)

### Previous Story Intelligence

From Story 1.2 completion notes:
- Pre-existing files from 2026-03-21 scaffolding matched spec exactly — zero discrepancies in Scout agent
- Validation-only approach confirmed as correct pattern for pre-existing files
- Gyre `exec` handler includes file-existence error handling (intentional improvement over Vortex)

From Story 1.1 completion notes:
- README.md required 4 factual corrections — pre-existing files CAN have minor inconsistencies
- `.gitkeep` files were added to empty directories

**Key learning:** Pre-existing files may have minor inconsistencies with the final spec. Validate every section against the ACs and architecture doc.

### Project Structure Notes

- Workflow entry: `_bmad/bme/_gyre/workflows/stack-detection/workflow.md`
- Step files: `_bmad/bme/_gyre/workflows/stack-detection/steps/step-01-scan-filesystem.md`, `step-02-classify-stack.md`, `step-03-guard-questions.md`
- Config path loaded by workflow: `{project-root}/_bmad/bme/_gyre/config.yaml`
- Output artifact: `.gyre/stack-profile.yaml` (GC1 contract — created by Story 1.4)

### References

- [Source: _bmad-output/planning-artifacts/epic-gyre.md — Story 1.3 ACs, lines 315-351]
- [Source: _bmad-output/planning-artifacts/architecture-gyre.md — Stack Detection FR1-FR8, workflow architecture]
- [Source: _bmad-output/planning-artifacts/prd-gyre.md — NFR3 (guard <1s), NFR20 (≥95% coverage)]
- [Source: _bmad/bme/_vortex/workflows/signal-interpretation/workflow.md — Step-file workflow pattern reference]
- [Source: _bmad/bme/_gyre/workflows/stack-detection/ — Pre-existing files to validate]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

None — no errors encountered.

### Completion Notes List

- All 37 validation subtasks passed — zero discrepancies found
- Pre-existing workflow files from 2026-03-21 scaffolding match all ACs exactly
- No modifications to any workflow or step files were required (Task 6 confirmed clean)
- workflow.md: correct frontmatter, step-file architecture, config loading, privacy boundary, Load step directive
- step-01: all 7 scan categories present with correct tools (Glob/Grep/Read), monorepo detection with FR1b/FR51, findings compilation table
- step-02: 10 archetypes, confidence levels, ambiguity identification, conditional skip logic for unambiguous cases
- step-03: ≤3 guard questions, FR7/FR8/NFR3/NFR20 compliance, 3 templates, correction handling, compass routing
- Load step chain validated: workflow.md → step-01 → step-02 → step-03 (conditional)
- This is a validation-only story — no files were created or modified

### Change Log

- 2026-03-23: Validated existing workflow files — all checks passed, no changes needed

### File List

- `_bmad/bme/_gyre/workflows/stack-detection/workflow.md` (validated, no changes)
- `_bmad/bme/_gyre/workflows/stack-detection/steps/step-01-scan-filesystem.md` (validated, no changes)
- `_bmad/bme/_gyre/workflows/stack-detection/steps/step-02-classify-stack.md` (validated, no changes)
- `_bmad/bme/_gyre/workflows/stack-detection/steps/step-03-guard-questions.md` (validated, no changes)
