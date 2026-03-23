# Story 2.1: Model Accuracy Spike (NFR19 Gate)

Status: ready-for-dev

## Story

As the product team,
I want to validate that Atlas can achieve ≥70% model accuracy across ≥3 stack archetypes,
So that we have a go/no-go decision for the entire Gyre product.

## Acceptance Criteria

1. **Given** the accuracy-validation workflow exists at `_bmad/bme/_gyre/workflows/accuracy-validation/`
   **When** the spike is run against ≥3 synthetic ground truth repos (CNCF Go/K8s, Node.js web service, Python data pipeline)
   **Then** Atlas generates a capabilities manifest for each
   **And** each capability is scored: relevant (1.0), partially-relevant (0.5), irrelevant (0.0)
   **And** accuracy = sum of relevance / total capabilities
   **And** ≥70% accuracy across all 3 archetypes (NFR19)
   **And** methodology is documented and repeatable

2. **Given** the accuracy-validation workflow files exist
   **When** workflow and step files are examined
   **Then** workflow.md has correct frontmatter (name=accuracy-validation, agent=model-curator, steps=3)
   **And** each step file has correct frontmatter (step number, workflow, title)
   **And** the scoring methodology matches the architecture spec (relevant/partially-relevant/irrelevant)
   **And** the gate criteria are ≥70% across ALL archetypes (not averaged)

3. **Given** the model generation prompts are tested
   **When** Atlas generates capabilities for each archetype
   **Then** each capability includes: id, category, name, description (1-3 sentences), source, relevance
   **And** capabilities cover 4 categories: observability, deployment, reliability, security
   **And** ≥20 capabilities generated for each supported archetype (FR14)
   **And** industry standards are incorporated: DORA, OpenTelemetry, Google PRR (FR10)

4. **Given** validation results are documented
   **When** the spike completes
   **Then** results are written to `_bmad-output/gyre-artifacts/accuracy-validation-[date].md`
   **And** include: per-archetype scoring tables, accuracy percentages, pass/fail decision, methodology notes
   **And** if FAIL: iteration guidance with specific prompt improvement recommendations

## Tasks / Subtasks

- [ ] Task 1: Validate accuracy-validation workflow files (AC: #2)
  - [ ] 1.1 Verify workflow.md frontmatter: name=accuracy-validation, agent=model-curator, steps=3
  - [ ] 1.2 Verify scoring methodology table: relevant (1.0), partially-relevant (0.5), irrelevant (0.0)
  - [ ] 1.3 Verify gate criteria: ≥70% across ALL archetypes, not averaged
  - [ ] 1.4 Verify step-01-select-repos.md: ≥3 archetypes, recommended set, synthetic profile option
  - [ ] 1.5 Verify step-02-run-validation.md: independent processing, GC1 recording, GC2 recording
  - [ ] 1.6 Verify step-03-score-results.md: scoring criteria, guidelines, output artifact, compass table
  - [ ] 1.7 Verify Load step directives chain: workflow → step-01 → step-02 → step-03

- [ ] Task 2: Prepare synthetic Stack Profiles (AC: #1)
  - [ ] 2.1 Construct GC1-compliant profile for CNCF Go/K8s archetype (e.g., CoreDNS/Prometheus pattern)
  - [ ] 2.2 Construct GC1-compliant profile for Node.js web service archetype (Express/Docker/GitHub Actions)
  - [ ] 2.3 Construct GC1-compliant profile for Python data pipeline archetype (Airflow/FastAPI/Docker Compose)
  - [ ] 2.4 Verify each profile follows gc1-stack-profile.md schema (all required fields present)

- [ ] Task 3: Run model generation for each archetype (AC: #1, #3)
  - [ ] 3.1 Generate capabilities for Go/K8s archetype using Atlas prompts
  - [ ] 3.2 Generate capabilities for Node.js archetype using Atlas prompts
  - [ ] 3.3 Generate capabilities for Python pipeline archetype using Atlas prompts
  - [ ] 3.4 Verify each manifest has ≥20 capabilities (FR14) — note limited_coverage if <20
  - [ ] 3.5 Verify each capability has all required fields: id, category, name, description, source, relevance
  - [ ] 3.6 Verify 4 categories covered: observability, deployment, reliability, security
  - [ ] 3.7 Verify industry standards referenced: DORA, OpenTelemetry, Google PRR (FR10)
  - [ ] 3.8 Note web search status: performed or skipped (NFR21)

- [ ] Task 4: Score each archetype (AC: #1)
  - [ ] 4.1 Score every Go/K8s capability: 1.0 / 0.5 / 0.0 with reasoning
  - [ ] 4.2 Score every Node.js capability: 1.0 / 0.5 / 0.0 with reasoning
  - [ ] 4.3 Score every Python pipeline capability: 1.0 / 0.5 / 0.0 with reasoning
  - [ ] 4.4 Compute accuracy per archetype: sum_of_scores / total_capabilities
  - [ ] 4.5 Document reasoning for all 0.0-scored capabilities
  - [ ] 4.6 Apply gate: ALL archetypes must be ≥70% (not averaged)

- [ ] Task 5: Document results and gate decision (AC: #4)
  - [ ] 5.1 Create `_bmad-output/gyre-artifacts/` directory if not exists
  - [ ] 5.2 Write validation results to `_bmad-output/gyre-artifacts/accuracy-validation-[date].md`
  - [ ] 5.3 Include: summary (PASS/FAIL), archetypes tested, accuracy range, gate threshold
  - [ ] 5.4 Include: detailed scoring tables per archetype
  - [ ] 5.5 Include: methodology notes (synthetic profiles, web search status)
  - [ ] 5.6 If FAIL: include iteration guidance — prompt issues vs knowledge gaps, improvement recommendations

- [ ] Task 6: If FAIL — iterate Atlas prompts and re-validate
  - [ ] 6.1 Analyze 0.0-scored capabilities: prompt issue or knowledge gap?
  - [ ] 6.2 Analyze 0.5-scored capabilities: description quality improvable?
  - [ ] 6.3 Adjust model-generation step-02 prompts based on findings
  - [ ] 6.4 Re-run Tasks 3-5 until ≥70% across all archetypes

## Dev Notes

### Story Nature: Spike + Validation

This story has a dual nature unlike the Epic 1 validation-only stories:

**Part 1 — Workflow validation** (Tasks 1): The accuracy-validation workflow files already exist from the 2026-03-21 scaffolding. Validate them against the ACs, same pattern as Epic 1.

**Part 2 — Accuracy spike** (Tasks 2-6): This is the FIRST creative/iterative work in Gyre. Atlas must actually generate capabilities manifests and they must score ≥70% accuracy. This is prompt engineering — iterative, quality-dependent, and unpredictable.

### Pre-existing Files

All accuracy-validation workflow files exist from scaffolding:

- `_bmad/bme/_gyre/workflows/accuracy-validation/workflow.md` (42 lines) — complete
- `_bmad/bme/_gyre/workflows/accuracy-validation/steps/step-01-select-repos.md` (56 lines) — complete
- `_bmad/bme/_gyre/workflows/accuracy-validation/steps/step-02-run-validation.md` (79 lines) — complete
- `_bmad/bme/_gyre/workflows/accuracy-validation/steps/step-03-score-results.md` (144 lines) — complete

Additional pre-existing files relevant to this story:

- `_bmad/bme/_gyre/agents/model-curator.md` — Atlas agent definition (already scaffolded)
- `_bmad/bme/_gyre/contracts/gc2-capabilities-manifest.md` — GC2 contract schema (190 lines)
- `_bmad/bme/_gyre/contracts/gc1-stack-profile.md` — GC1 contract schema (153 lines, validated in Story 1.4)

### Iterative Nature — Stories 2.1, 2.2, 2.3 Are Coupled

The epic explicitly states: "Stories 2.1, 2.2, and 2.3 are iterative — the accuracy spike co-develops with Atlas's agent definition and generation workflow prompts. The spike validates what 2.2-2.3 produce; prompt iteration cycles across all three until the ≥70% gate passes."

**For this story:** Focus on the accuracy-validation workflow validation AND the actual spike execution. The model generation prompts will be developed as part of executing the spike (Tasks 2-5). If the prompts need iteration (Task 6), that iteration happens within this story.

### KILL SWITCH: If <70% After Iteration

If accuracy remains <70% after prompt iteration, this is a **BLOCKER** for the entire Gyre product. Document the failure, the iteration attempts, and the specific issues preventing accuracy. Do NOT proceed to Story 2.2.

### Synthetic Profile Approach

For this spike, use **synthetic profiles** (not live repo scans). Construct GC1-compliant Stack Profiles from archetype descriptions. This isolates model generation quality from stack detection quality.

The 3 mandatory archetypes:
1. **CNCF Go/K8s**: Go + gRPC/REST + Kubernetes + Prometheus
2. **Node.js web service**: Node.js + REST + Docker + GitHub Actions
3. **Python data pipeline**: Python + Celery/Airflow + Docker Compose

### GC2 Capability Schema (from contract)

Each capability must have:
```yaml
- id: string                # kebab-case, e.g., "health-check-liveness"
  category: string          # "observability" | "deployment" | "reliability" | "security"
  name: string              # human-readable name
  description: string       # 1-3 sentences: what + why for THIS stack
  source: string            # "standard" | "practice" | "reasoning"
  relevance: string         # why this matters for THIS stack specifically
  amended: boolean          # false (no amendments yet)
  removed: boolean          # false (no removals yet)
```

### Capability Category Targets

| Category | Description | Typical Count |
|----------|-------------|:------------:|
| `observability` | Logging, tracing, metrics, health checks, alerting | 6-10 |
| `deployment` | CI/CD, containers, orchestration, rollback, IaC | 5-8 |
| `reliability` | Graceful shutdown, circuit breakers, rate limiting, fault tolerance | 4-6 |
| `security` | Secrets management, vulnerability scanning, network policies, auth | 3-5 |

### Industry Standards to Incorporate (FR10)

- **DORA**: Deployment frequency, lead time for changes, change failure rate, time to restore service
- **OpenTelemetry**: Distributed tracing, metrics collection, log correlation, context propagation
- **Google PRR (Production Readiness Review)**: Service reliability, monitoring, capacity planning, incident response

### Scoring Rules

- Score 1.0: Capability references technology in the stack AND description explains why it matters for THIS stack
- Score 0.5: Capability is related but too generic, wrong deployment model, or poorly described
- Score 0.0: Wrong technology, wrong domain, or nonsensical — document reasoning
- Be honest about borderline cases — use 0.5, not 1.0, when uncertain
- Gate is ≥70% across ALL archetypes (not averaged) — one failure = overall FAIL

### Output Artifact Location

Results go to `_bmad-output/gyre-artifacts/accuracy-validation-[date].md` — create the `gyre-artifacts` directory if it doesn't exist.

### Architecture Compliance

| Requirement | Where Covered |
|---|---|
| NFR19 (model accuracy ≥70%) | Gate decision in Task 4-5 |
| FR9 (generate, not template) | Model generation uses LLM reasoning, not template selection |
| FR10 (industry standards) | DORA, OpenTelemetry, Google PRR incorporated |
| FR14 (≥20 capabilities) | Checked per archetype in Task 3.4 |
| FR15 (limited-coverage warning) | Noted if <20 capabilities |
| NFR21 (web search freshness) | Web search status recorded (performed/skipped) |

### What NOT to Modify

- **Do NOT modify stack-detection workflow files** — Already validated in Story 1.3
- **Do NOT modify the Scout agent file** — Already validated in Story 1.2
- **Do NOT modify config.yaml** — Already validated in Story 1.1
- **Do NOT modify GC1 contract** — Already validated in Story 1.4
- **Do NOT modify agent-registry.js** — Already fixed in Story 1.6
- **Do NOT modify compass-routing-reference.md** — Already validated in Story 1.7
- **Do NOT modify full-analysis step files** — Already validated in Story 1.7

### Previous Story Intelligence

From Epic 1 Retrospective (2026-03-23):
- Heavy upfront scaffolding produced 99% accurate pre-built files
- Validation caught the one real bug (delta-report assignment in agent-registry.js)
- **Key insight for this story:** Epic 2 requires iterative creation, not just validation. Reset velocity expectations — prompt engineering is unpredictable.
- Team agreement: Story 2.1 is a hard gate — no parallel work on Stories 2.2-2.5 until accuracy passes.

From Story 1.7 completion notes:
- Full-analysis step-03-generate-model.md stubs reference model-generation workflow steps that don't exist yet — by design
- All pre-existing workflow files validated successfully

### Project Structure Notes

- Accuracy validation workflow: `_bmad/bme/_gyre/workflows/accuracy-validation/`
- Model generation workflow: `_bmad/bme/_gyre/workflows/model-generation/` (steps to be created in Story 2.3)
- GC2 contract: `_bmad/bme/_gyre/contracts/gc2-capabilities-manifest.md`
- GC1 contract: `_bmad/bme/_gyre/contracts/gc1-stack-profile.md`
- Atlas agent: `_bmad/bme/_gyre/agents/model-curator.md`
- Output artifact: `_bmad-output/gyre-artifacts/accuracy-validation-[date].md`

### References

- [Source: _bmad-output/planning-artifacts/epic-gyre.md — Story 2.1 ACs]
- [Source: _bmad-output/planning-artifacts/architecture-gyre.md — Workflow 7: accuracy-validation, lines 662-672]
- [Source: _bmad-output/planning-artifacts/architecture-gyre.md — Atlas agent, lines 285-308]
- [Source: _bmad-output/planning-artifacts/prd-gyre.md — NFR19, lines 738-742]
- [Source: _bmad-output/planning-artifacts/prd-gyre.md — Synthetic ground truth methodology, lines 355-404]
- [Source: _bmad-output/planning-artifacts/prd-gyre.md — FR9-FR15, lines 624-632]
- [Source: _bmad/bme/_gyre/workflows/accuracy-validation/ — Pre-existing workflow + 3 step files]
- [Source: _bmad/bme/_gyre/contracts/gc2-capabilities-manifest.md — GC2 schema (190 lines)]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### Change Log

### File List
