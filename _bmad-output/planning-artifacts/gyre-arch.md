---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
lastStep: 8
status: 'complete'
completedAt: '2026-03-21'
inputDocuments:
  - _bmad-output/planning-artifacts/prd-gyre.md
  - _bmad-output/planning-artifacts/product-brief-gyre-2026-03-19.md
  - _bmad-output/planning-artifacts/research/domain-operational-readiness-research-2026-03-19.md
  - _bmad-output/vortex-artifacts/lean-experiment-gyre-discovery-interviews-2026-03-20.md
workflowType: 'architecture'
project_name: 'Gyre'
user_name: 'Amalik'
date: '2026-03-21'
editHistory:
  - date: '2026-03-21'
    changes: "Full rewrite: Gyre redesigned as Convoke team module following Vortex patterns. Replaces CLI-tool architecture (Commander, provider abstraction, exit codes, streaming renderer) with conversational persona agents, handoff contracts, step-file workflows, and compass routing. 4 agents, 4 contracts, 7 workflows."
---

# Architecture Decision Document — Gyre (Convoke Team)

_Gyre is a Convoke team module — conversational persona agents running inside Claude Code, following the same patterns as Vortex. This document replaces the prior CLI-tool architecture._

## Project Context Analysis

### Requirements Overview

**Functional Requirements (57)** across 7 capability areas — domain logic survives from the PRD; delivery mechanism changes from CLI to conversational agents:

- Stack Detection & Classification (8 FRs) — agents use Claude Code tools (Glob, Grep, Read) to analyze filesystem
- Contextual Model Generation (7 FRs) — agent generates `.gyre/capabilities.yaml` using LLM reasoning + web search
- Absence Detection & Analysis (7 FRs) — two domain workflows (observability, deployment), source/confidence tagging, cross-domain compounds
- Review, Amendment & Feedback (7 FRs) — conversational walkthrough replaces `$EDITOR`; agent guides review
- Output & Presentation (9 FRs) — conversational output replaces CLI streaming; severity summary, novelty ratio presented in dialogue
- Run Lifecycle & Delta Analysis (10 FRs) — mode detection, history, delta; conversational prompts replace CLI flags
- Installation, Configuration & Resilience (7 FRs) — `convoke-install-gyre` replaces `npm install -g gyre`; no provider config needed (agent IS the LLM)

**Non-Functional Requirements (22)** across 5 categories — most survive with delivery-mechanism adaptations:

- Performance (5): time-to-first-finding <2min, total <10min, guard <1s — measured in conversation flow, not CLI
- Security & Privacy (4): privacy boundary enforced by contract schemas (what data crosses agent boundaries), not code tiers
- Reliability (4): model caching via `.gyre/` artifacts, graceful degradation in conversation
- Integration (4): Convoke ecosystem (not standalone npm), Node.js ≥20 for installer scripts only
- Quality Gates (5): model accuracy ≥70% gate, guard coverage, compound confidence threshold — unchanged

**What dies from CLI architecture:**

| Removed | Reason |
|---------|--------|
| Commander CLI framework | No CLI — agents are conversational |
| Provider abstraction (NFR14) | Agent IS the LLM; no multi-provider config |
| Exit codes (0-5) | No process exit — conversation continues |
| `--format json` output (FR36, FR54) | Findings are conversational; artifacts are YAML files |
| Streaming CLI renderer (FR32) | Claude Code handles output natively |
| `--guard` CLI flags (FR7) | Guard questions are conversational |
| `$EDITOR` review mode (FR24) | Review is conversational walkthrough |
| `npm install -g gyre` (FR44) | Installed via `convoke-install-gyre` |
| `gyre setup` (FR46) | No provider config needed |
| `packages/gyre/` npm package | Module lives at `_bmad/bme/_gyre/` |
| npm workspaces | Single package, markdown modules |
| Tiered StackProfile as code (AR5) | Privacy boundary is a contract schema rule |
| `lib/providers/`, `lib/output/`, `lib/setup/` | No JavaScript application code |
| Concurrency control / rate limits | Single conversation, sequential agent handoffs |

**What survives (domain logic):**

| Preserved | How it maps |
|-----------|-------------|
| Stack detection from filesystem (FR1-FR8) | Scout agent uses Glob/Grep/Read tools |
| Contextual model generation (FR9-FR15) | Atlas agent generates capabilities.yaml |
| Absence detection (FR16-FR23) | Lens agent compares manifest vs filesystem |
| Cross-domain correlation (FR22a/b) | Lens workflow step for compound findings |
| Review & amendment (FR24-FR30) | Coach agent conversational walkthrough |
| Guard questions (FR6-FR8) | Scout asks conversationally |
| `.gyre/` artifact structure | Unchanged — capabilities.yaml, feedback.yaml, findings.yaml |
| Finding shape (8 fields) | Unchanged — severity, source, confidence, domain, etc. |
| Delta analysis (FR38-FR41) | Delta-report workflow |
| NFR19 accuracy gate | Accuracy-validation workflow |
| Privacy boundary concept | Contract schema rule: "GC1 must not contain file contents, paths, or secrets" |
| Mode detection (crisis/anticipation) | Workflow checks for existing `.gyre/` directory |

### Architectural Drivers

The following decisions most significantly shape the Convoke team architecture:

**AD1: Conversational agents replace CLI pipeline**

The CLI architecture had a linear pipeline: `detect → guard → generate → analyze → correlate → render`. As a Convoke team, this becomes a sequence of agent handoffs connected by contracts. Each agent is a markdown persona file with an XML activation protocol. The "pipeline" is a workflow that routes between agents via compass tables.

**Why this works:** Claude Code already provides the runtime (LLM reasoning), the tools (filesystem access via Glob/Grep/Read), and the output (conversational rendering). There is no application code to write — only agent definitions, workflow step-files, and contracts.

**AD2: Privacy boundary via contract schema, not code tiers**

The CLI architecture enforced privacy through a tiered StackProfile intermediate representation (Tier 1 = coarse metadata → LLM, Tier 2 = detailed → local only). As a Convoke team, the agent IS the LLM — there is no "local only" code path.

**New approach:** The privacy boundary is a contract validation rule on GC1 (Stack Profile). The contract schema declares: "GC1 must contain stack classification, guard answers, and detected technology categories. It must NOT contain file contents, file paths, version numbers, dependency counts, or secrets." The agent instructions in Scout's persona explicitly state what to extract and what to exclude. Since the agent reads files using Claude Code tools, it has full filesystem access — but the contract constrains what it passes downstream and what it writes to artifacts.

**Practical privacy guarantee:** `.gyre/capabilities.yaml` and `.gyre/findings.yaml` are committed to VCS. The contract rule ensures these artifacts contain only structured metadata (technology categories, capability descriptions, finding descriptions) — never source code, file contents, or secrets.

**AD3: No provider abstraction needed**

The CLI architecture required supporting ≥2 LLM providers (Anthropic + OpenAI) with a provider abstraction layer. As a Convoke team, the agent runs inside Claude Code — the LLM is Claude. There is no provider selection, no API key configuration, no concurrency control. This eliminates an entire architectural layer.

**AD4: Filesystem analysis via Claude Code tools**

The CLI architecture had custom Node.js code for static analysis (file detection, pattern matching, dependency parsing). As a Convoke team, agents use Claude Code's built-in tools:

| Tool | Purpose |
|------|---------|
| Glob | Find files by pattern (e.g., `**/Dockerfile`, `**/package.json`) |
| Grep | Search file contents (e.g., `opentelemetry`, `prometheus`) |
| Read | Read config files, manifests, IaC templates |
| Bash | Run commands (e.g., `npm ls`, `go list`) when file analysis is insufficient |

This eliminates all custom detection code. The agent's prompt defines what to look for; the tools provide access.

**AD5: Workflow step-files as the orchestration mechanism**

The CLI architecture used a JavaScript orchestrator with phase checkpoints. As a Convoke team, orchestration happens through workflow step-files — the same pattern Vortex uses. Each workflow has 4-6 steps. Each step file contains instructions the agent follows. The final step of each workflow includes a compass routing table.

**AD6: Handoff contracts as the integration mechanism**

The CLI architecture passed data between phases via in-memory objects (StackProfile, CapabilitiesManifest, FindingsReport). As a Convoke team, data passes between agents via handoff contracts — YAML-frontmatter markdown files written to `.gyre/`. Each contract declares its schema, source agent, target agent, and validation rules.

### Technical Constraints & Dependencies

- **Runtime:** Claude Code (the agents run as Claude conversations)
- **Module location:** `_bmad/bme/_gyre/`
- **Installation:** `convoke-install-gyre` script (copies markdown files, same pattern as Vortex)
- **File system:** Agents use Claude Code tools (Glob, Grep, Read, Bash) — read project files, write only to `.gyre/`
- **No server/daemon:** Conversational — runs when user activates an agent
- **No database:** YAML files for all persistence (`.gyre/` directory)
- **No application code:** Agents, workflows, and contracts are all markdown
- **Convoke ecosystem:** Registered in `agent-registry.js`, validated by `convoke-doctor`

### Cross-Cutting Concerns

1. **Privacy enforcement via contract schema** — GC1 (Stack Profile) declares what metadata is permitted. Agent instructions reinforce boundaries. Committed artifacts (capabilities.yaml, findings.yaml) must not contain source code or secrets. Validation: grep committed artifacts for path-like strings, code snippets, or known secret patterns.

2. **Error handling in conversation** — Agent failures are conversational, not exit codes. If Scout cannot detect a stack, it tells the user and offers manual classification. If Lens encounters an unexpected file structure, it reports what it found and asks for guidance. Graceful degradation is natural in conversation.

3. **Finding consistency** — Finding shape is standardized across all Gyre agents via the GC3 contract schema. Every finding has: id, domain, severity, source, confidence, description, capability_ref, evidence_summary. Cross-domain compounds add: related_findings[], combined_impact.

4. **`.gyre/` state management** — Created by full-analysis workflow on first run. Contains:
   - `capabilities.yaml` (committed — team-owned model)
   - `feedback.yaml` (committed — measurement infrastructure)
   - `findings.yaml` (gitignored — current run output)
   - `history.yaml` (gitignored — delta computation)

5. **Model caching & regeneration** — The generated `capabilities.yaml` IS the cache. Re-runs load it directly. Regeneration is triggered conversationally ("regenerate the model" or when Scout detects stack changes).

6. **Agent extensibility** — New domain agents (e.g., Security Readiness) are added by creating a new agent markdown file, a new workflow, and updating the compass routing tables. No code changes.

## Module Structure

### Directory Layout

```
_bmad/bme/_gyre/
├── config.yaml                          # Module configuration
├── README.md                            # Module documentation
├── compass-routing-reference.md         # Complete routing tables
├── agents/
│   ├── stack-detective.md               # Scout 🔎
│   ├── model-curator.md                 # Atlas 📐
│   ├── readiness-analyst.md             # Lens 🔬
│   └── review-coach.md                  # Coach 🏋️
├── workflows/
│   ├── full-analysis/
│   │   ├── workflow.md                  # Orchestrator workflow
│   │   ├── steps/
│   │   │   ├── step-01-initialize.md
│   │   │   ├── step-02-detect-stack.md
│   │   │   ├── step-03-generate-model.md
│   │   │   ├── step-04-analyze-gaps.md
│   │   │   └── step-05-review-findings.md
│   │   └── templates/
│   │       ├── capabilities.template.yaml
│   │       ├── findings.template.yaml
│   │       └── feedback.template.yaml
│   ├── stack-detection/
│   │   ├── workflow.md
│   │   └── steps/
│   │       ├── step-01-scan-filesystem.md
│   │       ├── step-02-classify-stack.md
│   │       └── step-03-guard-questions.md
│   ├── model-generation/
│   │   ├── workflow.md
│   │   └── steps/
│   │       ├── step-01-load-profile.md
│   │       ├── step-02-generate-capabilities.md
│   │       ├── step-03-web-enrichment.md
│   │       └── step-04-write-manifest.md
│   ├── model-review/
│   │   ├── workflow.md
│   │   └── steps/
│   │       ├── step-01-present-model.md
│   │       ├── step-02-walkthrough.md
│   │       └── step-03-apply-amendments.md
│   ├── gap-analysis/
│   │   ├── workflow.md
│   │   └── steps/
│   │       ├── step-01-load-manifest.md
│   │       ├── step-02-observability-analysis.md
│   │       ├── step-03-deployment-analysis.md
│   │       ├── step-04-cross-domain-correlation.md
│   │       └── step-05-present-findings.md
│   ├── delta-report/
│   │   ├── workflow.md
│   │   └── steps/
│   │       ├── step-01-load-history.md
│   │       ├── step-02-compute-delta.md
│   │       └── step-03-present-delta.md
│   └── accuracy-validation/
│       ├── workflow.md
│       └── steps/
│           ├── step-01-select-repos.md
│           ├── step-02-run-validation.md
│           └── step-03-score-results.md
└── contracts/
    ├── gc1-stack-profile.md
    ├── gc2-capabilities-manifest.md
    ├── gc3-findings-report.md
    └── gc4-feedback-loop.md
```

### config.yaml

```yaml
submodule_name: _gyre
description: Gyre Pattern - Production readiness discovery through stack analysis, contextual model generation, and absence detection
module: bme
output_folder: '{project-root}/_bmad-output/gyre-artifacts'
agents:
  - stack-detective
  - model-curator
  - readiness-analyst
  - review-coach
workflows:
  - full-analysis
  - stack-detection
  - model-generation
  - model-review
  - gap-analysis
  - delta-report
  - accuracy-validation
version: 1.0.0
user_name: '{user}'
communication_language: en
party_mode_enabled: true
core_module: bme
```

## Agent Definitions

### Agent 1: Scout 🔎 (stack-detective)

**Role:** Detects the project's technology stack by analyzing filesystem artifacts. Asks guard questions to confirm architecture intent. Produces the Stack Profile (GC1).

**Persona:** Methodical investigator. Reads manifests, configs, and IaC files. Never guesses — reports what it finds with evidence. Asks targeted guard questions derived from what it detected.

**Tools used:** Glob (find files), Grep (search contents), Read (read configs), Bash (run package managers)

**Detection targets:**
- Primary language/framework (package.json, go.mod, requirements.txt, Cargo.toml, pom.xml)
- Container orchestration (Dockerfile, docker-compose.yaml, k8s manifests, ECS task defs)
- CI/CD platform (.github/workflows/, .gitlab-ci.yml, Jenkinsfile)
- Observability tooling (OpenTelemetry, Prometheus, Datadog configs in deps + configs)
- Cloud provider (terraform/, cloudformation/, pulumi/, provider configs)
- Communication protocol (gRPC protos, REST controllers, message queue configs)

**Guard questions:** Derived from detection (not a fixed list), covering:
- Deployment model (container-based / serverless / bare-metal) — if ambiguous from detection
- Communication protocol (HTTP/REST / gRPC / message queue) — if multiple detected
- Architecture intent for ambiguous signals

Limit: ≤3 questions. If detection is unambiguous, skip guard entirely.

**Output:** GC1 (Stack Profile) written to `.gyre/stack-profile.yaml`

**Menu items:**
1. Detect Stack — `workflow: stack-detection`
2. Full Analysis — `workflow: full-analysis`

### Agent 2: Atlas 📐 (model-curator)

**Role:** Generates the capabilities manifest — a contextual model of what production capabilities *should* exist for this specific stack. Uses LLM reasoning, industry standards (DORA, OpenTelemetry, Google PRR), and web search for current best practices.

**Persona:** Knowledgeable curator who balances industry standards with practical relevance. Explains why each capability matters. Transparent about confidence levels — distinguishes well-known patterns from emerging practices.

**Tools used:** Read (load GC1 stack profile), Write (write capabilities.yaml), WebSearch (current best practices)

**Generation process:**
1. Load GC1 (Stack Profile) — stack classification + guard answers
2. Generate capabilities using: agent knowledge of standards + stack-specific reasoning + web search
3. Each capability includes: id, category, name, description (1-3 sentences), source (standard/practice/reasoning), relevance (why this matters for this stack)
4. Adjust model based on guard question answers (e.g., gRPC vs HTTP health checks)
5. Surface limited-coverage warning if <20 capabilities generated

**Model ownership:** The generated manifest is team-owned. Amendments from Coach (GC4) are respected on regeneration. Removed capabilities stay removed. Added capabilities persist.

**Output:** GC2 (Capabilities Manifest) written to `.gyre/capabilities.yaml`

**Menu items:**
1. Generate Model — `workflow: model-generation`
2. Regenerate Model — `workflow: model-generation` (forces fresh generation)
3. Full Analysis — `workflow: full-analysis`

### Agent 3: Lens 🔬 (readiness-analyst)

**Role:** Compares the capabilities manifest against what actually exists in the project. Identifies absences — what's missing, not just what's misconfigured. Runs two domain analyses (Observability Readiness, Deployment Readiness) and cross-domain correlation.

**Persona:** Thorough analyst who finds gaps methodically. Source-tags every finding (static analysis vs contextual model). Assigns confidence levels honestly. Connects dots across domains for compound findings. Never inflates severity — a nice-to-have stays a nice-to-have.

**Tools used:** Glob (find evidence files), Grep (search for implementation evidence), Read (read configs for capability evidence), Bash (check installed packages)

**Analysis process:**
1. Load GC2 (Capabilities Manifest)
2. For each capability: search filesystem for evidence of implementation
3. Evidence types: present (found), absent (no evidence), partial (config exists but incomplete)
4. Tag findings: source (static-analysis / contextual-model), confidence (high/medium/low), severity (blocker/recommended/nice-to-have)
5. Run cross-domain correlation: identify compound patterns where absences in different domains amplify each other
6. Validate compounds: each must reference exactly 2 findings from different domains

**Finding shape (standardized via GC3):**

```yaml
- id: OBS-001
  domain: observability
  severity: blocker
  source: static-analysis
  confidence: high
  capability_ref: health-check-liveness
  description: "No health check liveness probes detected"
  evidence_summary: "No /healthz or /livez endpoints found; no Kubernetes livenessProbe in deployment manifests"
```

**Compound finding shape:**

```yaml
- id: COMPOUND-001
  domain: cross-domain
  severity: recommended
  source: contextual-model
  confidence: medium
  capability_ref: [deploy-event-markers, rollback-telemetry]
  description: "Missing deployment markers + missing rollback telemetry = blind rollbacks"
  evidence_summary: "No deployment event emission in observability stack; no rollback trigger mechanism in deployment pipeline"
  related_findings: [OBS-003, DEP-004]
  combined_impact: "Rollback decisions are blind — cannot correlate errors with specific deployments"
```

**Output:** GC3 (Findings Report) written to `.gyre/findings.yaml`

**Menu items:**
1. Analyze Gaps — `workflow: gap-analysis`
2. Full Analysis — `workflow: full-analysis`
3. Delta Report — `workflow: delta-report`

### Agent 4: Coach 🏋️ (review-coach)

**Role:** Guides the user through reviewing findings and amending the capabilities manifest. Captures feedback on missed gaps. Ensures the model becomes team-owned through review.

**Persona:** Patient guide who respects the user's expertise. Presents findings clearly — severity-first summary, then walkthrough. For model review, presents each capability one at a time with keep/remove/edit options. Explains why feedback matters for model improvement. Never pushes — lets the user decide what's relevant.

**Tools used:** Read (load findings, load manifest), Write (write amended manifest, write feedback), Edit (modify capabilities.yaml)

**Review process:**
1. Load GC3 (Findings Report)
2. Present severity-first summary: "X blockers, Y recommended, Z nice-to-have"
3. Present novelty ratio: "X of Y findings are contextual — gaps a static linter would miss"
4. Walk through findings by severity (blockers first)
5. For each compound finding: show reasoning chain
6. Ask: "Would you like to review your capabilities manifest?"
   - If yes: walkthrough mode — present each capability with keep/remove/edit
   - If later: set deferred flag, remind on next run
7. Feedback prompt: "Did Gyre miss anything you know about?"
   - Persist to `.gyre/feedback.yaml` with timestamp
   - Explain: "Commit feedback.yaml to share improvements with your team"

**Amendment persistence:** Amendments are written directly to `.gyre/capabilities.yaml`. On regeneration, Atlas respects amendments via GC4 (Feedback Loop).

**Output:** GC4 (Feedback Loop) — amendments + feedback written to `.gyre/`

**Menu items:**
1. Review Findings — `workflow: model-review` (loads most recent findings)
2. Review Model — `workflow: model-review` (capabilities walkthrough only)
3. Full Analysis — `workflow: full-analysis`

### Agent Display Reference

| Agent | Icon | ID | Stream |
|-------|------|----|--------|
| Scout | 🔎 | stack-detective | Detect |
| Atlas | 📐 | model-curator | Model |
| Lens | 🔬 | readiness-analyst | Analyze |
| Coach | 🏋️ | review-coach | Review |

## Contract Definitions

### GC1: Stack Profile (Scout → Atlas)

```yaml
---
contract: GC1
type: artifact
source_agent: scout
source_workflow: stack-detection
target_agents: [atlas, lens]
created: YYYY-MM-DD
---
```

**Schema:**

```yaml
stack_profile:
  primary_language: string        # e.g., "Go", "Node.js", "Python"
  primary_framework: string       # e.g., "Express", "Gin", "FastAPI"
  secondary_stacks: string[]      # e.g., ["Python sidecar"]
  container_orchestration: string  # e.g., "Kubernetes", "ECS", "none"
  ci_cd_platform: string          # e.g., "GitHub Actions", "GitLab CI"
  observability_tooling: string[] # e.g., ["OpenTelemetry", "Prometheus"]
  cloud_provider: string          # e.g., "AWS", "GCP", "Azure"
  communication_protocol: string  # e.g., "HTTP/REST", "gRPC", "message-queue"
  guard_answers:                  # only populated if guard questions were asked
    deployment_model: string      # "container-based" | "serverless" | "bare-metal"
    protocol: string              # confirmed protocol
    custom: object                # any additional guard answers
  detection_confidence: string    # "high" | "medium" | "low"
  detection_summary: string       # human-readable summary of what was found
```

**Privacy rule:** GC1 must contain technology categories and classifications only. It must NOT contain: file contents, file paths, version numbers, dependency counts, dependency names, or secrets. This is the privacy boundary — everything downstream of GC1 works with category-level metadata.

**Downstream consumption:**
- Atlas uses GC1 to generate contextually relevant capabilities
- Lens uses GC1 for domain-specific analysis targeting (which directories to search, what patterns to match)

### GC2: Capabilities Manifest (Atlas → Lens)

```yaml
---
contract: GC2
type: artifact
source_agent: atlas
source_workflow: model-generation
target_agents: [lens, coach]
created: YYYY-MM-DD
---
```

**Schema:** (written to `.gyre/capabilities.yaml`)

```yaml
gyre_manifest:
  version: string                 # manifest schema version
  generated_at: ISO-8601          # generation timestamp
  stack_summary: string           # one-line stack description
  capability_count: integer
  limited_coverage: boolean       # true if <20 capabilities
  capabilities:
    - id: string                  # e.g., "health-check-liveness"
      category: string            # e.g., "observability", "deployment"
      name: string                # human-readable name
      description: string         # 1-3 sentences: what it is + why it matters
      source: string              # "standard" | "practice" | "reasoning"
      relevance: string           # why this matters for THIS stack
      amended: boolean            # true if user-modified
      removed: boolean            # true if user removed (excluded from analysis)
  provenance:
    standards_referenced: string[]  # e.g., ["DORA", "OpenTelemetry", "Google PRR"]
    web_search_performed: boolean
    web_search_date: ISO-8601
```

**Downstream consumption:**
- Lens loads the manifest and compares each capability against filesystem evidence
- Coach presents capabilities for review and amendment

### GC3: Findings Report (Lens → Coach)

```yaml
---
contract: GC3
type: artifact
source_agent: lens
source_workflow: gap-analysis
target_agents: [coach]
created: YYYY-MM-DD
---
```

**Schema:** (written to `.gyre/findings.yaml`)

```yaml
gyre_findings:
  version: string
  analyzed_at: ISO-8601
  mode: string                    # "crisis" | "anticipation"
  stack_summary: string
  summary:
    blockers: integer
    recommended: integer
    nice_to_have: integer
    total: integer
    novelty_ratio: string         # e.g., "8 of 12 contextual"
  findings:
    - id: string                  # e.g., "OBS-001"
      domain: string              # "observability" | "deployment"
      severity: string            # "blocker" | "recommended" | "nice-to-have"
      source: string              # "static-analysis" | "contextual-model"
      confidence: string          # "high" | "medium" | "low"
      capability_ref: string      # references GC2 capability ID
      description: string
      evidence_summary: string
      severity_rationale: string  # why this severity level
  compound_findings:
    - id: string                  # e.g., "COMPOUND-001"
      domain: "cross-domain"
      severity: string
      source: "contextual-model"
      confidence: string          # lower of the two component confidences
      capability_ref: string[]    # references 2 GC2 capability IDs
      description: string
      evidence_summary: string
      related_findings: string[]  # references 2 finding IDs from different domains
      combined_impact: string     # reasoning chain
  sanity_check:
    passed: boolean
    warnings: string[]            # e.g., ">80% capabilities flagged missing"
```

**Validation rules:**
- Every finding must reference a valid capability_ref from GC2
- Every compound must reference exactly 2 findings from different domains
- Compound confidence = lower of component confidences
- Compounds suppressed when either component has confidence "low"

### GC4: Feedback Loop (Coach → Atlas)

```yaml
---
contract: GC4
type: feedback
source_agent: coach
source_workflow: model-review
target_agents: [atlas]
created: YYYY-MM-DD
---
```

**Schema:** (persisted across `.gyre/capabilities.yaml` amendments + `.gyre/feedback.yaml`)

**Amendments** are written directly to `capabilities.yaml`:
- Removed capabilities: `removed: true` flag
- Modified capabilities: updated description/category
- Added capabilities: new entries with `amended: true`

**Feedback** written to `.gyre/feedback.yaml`:

```yaml
gyre_feedback:
  entries:
    - timestamp: ISO-8601
      reporter: string            # from config user_name
      type: string                # "missed-gap" | "false-positive" | "suggestion"
      description: string         # free-text from user
      domain: string              # if applicable
```

**Downstream consumption:**
- Atlas reads amendments when regenerating — respects removed/added capabilities
- Atlas reads feedback when regenerating — incorporates missed gaps into model

## Workflow Architecture

### Workflow 1: full-analysis (Orchestrator)

**Owner:** Any Gyre agent (typically Scout initiates)
**Steps:** 5
**Purpose:** Orchestrates the complete analysis pipeline: detect → generate → analyze → review

| Step | File | Agent | Action |
|------|------|-------|--------|
| 1 | step-01-initialize.md | Scout | Check for existing `.gyre/`, detect mode (crisis/anticipation), create `.gyre/` if needed |
| 2 | step-02-detect-stack.md | Scout | Run stack detection, ask guard questions, write GC1 |
| 3 | step-03-generate-model.md | Atlas | Load GC1, generate capabilities, write GC2 (skip if cached model exists in anticipation mode) |
| 4 | step-04-analyze-gaps.md | Lens | Load GC2, run observability + deployment analysis, cross-domain correlation, write GC3 |
| 5 | step-05-review-findings.md | Coach | Load GC3, present findings, guide review, capture feedback, write GC4 |

**Mode detection logic:**
- `.gyre/` does not exist → crisis mode (first run)
- `.gyre/capabilities.yaml` exists → anticipation mode (re-run); load cached model, skip generation
- User says "regenerate" → regeneration mode; fresh model generation even with existing cache

**Step 5 ends with compass routing table.**

### Workflow 2: stack-detection (Scout)

**Owner:** Scout 🔎
**Steps:** 3
**Purpose:** Standalone stack detection — can be run independently for stack classification only

| Step | File | Action |
|------|------|--------|
| 1 | step-01-scan-filesystem.md | Glob for manifests, Dockerfiles, CI configs, IaC templates; Grep for framework imports, provider configs |
| 2 | step-02-classify-stack.md | Synthesize detections into stack classification; identify ambiguities |
| 3 | step-03-guard-questions.md | Ask guard questions for ambiguous detections (≤3); write GC1 |

### Workflow 3: model-generation (Atlas)

**Owner:** Atlas 📐
**Steps:** 4
**Purpose:** Generate the capabilities manifest from the stack profile

| Step | File | Action |
|------|------|--------|
| 1 | step-01-load-profile.md | Load GC1, check for existing amendments (GC4) |
| 2 | step-02-generate-capabilities.md | Generate capabilities using LLM reasoning + standards knowledge |
| 3 | step-03-web-enrichment.md | WebSearch for current best practices; incorporate into model |
| 4 | step-04-write-manifest.md | Write capabilities.yaml (GC2), surface limited-coverage warning if <20 |

### Workflow 4: model-review (Coach)

**Owner:** Coach 🏋️
**Steps:** 3
**Purpose:** Guide user through reviewing and amending the capabilities manifest

| Step | File | Action |
|------|------|--------|
| 1 | step-01-present-model.md | Display capability count, stack summary, categories |
| 2 | step-02-walkthrough.md | Present each capability one at a time: keep/remove/edit |
| 3 | step-03-apply-amendments.md | Write amendments to capabilities.yaml, write GC4 |

### Workflow 5: gap-analysis (Lens)

**Owner:** Lens 🔬
**Steps:** 5
**Purpose:** Run absence detection across two domains + cross-domain correlation

| Step | File | Action |
|------|------|--------|
| 1 | step-01-load-manifest.md | Load GC2 (capabilities.yaml) |
| 2 | step-02-observability-analysis.md | For each observability capability: search filesystem for evidence |
| 3 | step-03-deployment-analysis.md | For each deployment capability: search filesystem for evidence |
| 4 | step-04-cross-domain-correlation.md | Identify compound patterns across domains |
| 5 | step-05-present-findings.md | Present severity-first summary, write GC3 |

### Workflow 6: delta-report (Lens)

**Owner:** Lens 🔬
**Steps:** 3
**Purpose:** Compare current findings against previous run

| Step | File | Action |
|------|------|--------|
| 1 | step-01-load-history.md | Load `.gyre/history.yaml` and current `.gyre/findings.yaml` |
| 2 | step-02-compute-delta.md | Compute: new findings, carried-forward, resolved |
| 3 | step-03-present-delta.md | Present delta summary with [NEW], [CARRIED], resolved list |

### Workflow 7: accuracy-validation (Atlas + Lens)

**Owner:** Atlas 📐
**Steps:** 3
**Purpose:** Pre-pilot validation of model accuracy against synthetic ground truth

| Step | File | Action |
|------|------|--------|
| 1 | step-01-select-repos.md | Select ≥3 synthetic ground truth repos (different stack archetypes) |
| 2 | step-02-run-validation.md | Run stack-detection + model-generation on each repo |
| 3 | step-03-score-results.md | Score each capability as relevant/partially-relevant/irrelevant; compute accuracy |

## Compass Routing

### Gyre Compass Table (used in final steps of each workflow)

```markdown
## Gyre Compass

Based on what you just completed, here are your options:

| If you want to... | Consider next... | Agent | Why |
|---|---|---|---|
| Detect or re-detect your stack | stack-detection | Scout 🔎 | New project or stack has changed |
| Generate or regenerate the model | model-generation | Atlas 📐 | First run or want fresh model |
| Review your capabilities manifest | model-review | Coach 🏋️ | Customize the model to your stack |
| Run gap analysis | gap-analysis | Lens 🔬 | Find what's missing |
| See what changed since last run | delta-report | Lens 🔬 | Track progress over time |
| Run the full pipeline | full-analysis | Scout 🔎 | Complete end-to-end analysis |
| Validate model accuracy | accuracy-validation | Atlas 📐 | Pre-pilot quality gate |

> **Note:** These are recommendations. You can run any Gyre workflow at any time.
```

### Inter-Module Routing (Gyre ↔ Vortex)

Gyre findings can feed into Vortex product discovery:

| If Gyre finds... | Consider in Vortex... | Agent | Why |
|---|---|---|---|
| Critical readiness gaps blocking launch | product-vision or contextualize-scope | Emma 🎯 | Readiness gaps may redefine product scope |
| Findings that challenge assumptions | hypothesis-engineering | Liam 💡 | Readiness findings are testable hypotheses |
| Feedback suggesting missing capabilities | user-interview | Isla 🔍 | Validate missed gaps with users |

## Convoke Ecosystem Integration

### Module Registry Extension

`agent-registry.js` gains a `GYRE_AGENTS` array and `GYRE_WORKFLOWS` array following the exact pattern of `AGENTS` and `WORKFLOWS`:

```javascript
const GYRE_AGENTS = [
  'stack-detective',
  'model-curator',
  'readiness-analyst',
  'review-coach',
];

const GYRE_WORKFLOWS = [
  'full-analysis',
  'stack-detection',
  'model-generation',
  'model-review',
  'gap-analysis',
  'delta-report',
  'accuracy-validation',
];
```

Derived lists (`GYRE_AGENT_FILES`, `GYRE_WORKFLOW_DIRS`) follow the same derivation pattern as Vortex.

### Installer

`scripts/install-gyre-agents.js` follows the same pattern as `scripts/install-vortex-agents.js`:
- Copies `_bmad/bme/_gyre/` contents to the project
- Registers agents in `agent-manifest.csv`
- Creates `convoke-install-gyre` bin entry in `package.json`

### Validator Extension

`convoke-doctor` gains Gyre-specific checks:
- 4 agent files present in `_bmad/bme/_gyre/agents/`
- 7 workflow directories present in `_bmad/bme/_gyre/workflows/`
- `config.yaml` valid with required fields
- `compass-routing-reference.md` present
- 4 contract files present in `_bmad/bme/_gyre/contracts/`

### Version Management

Gyre module version is declared in `_bmad/bme/_gyre/config.yaml` (not a separate package.json). The Convoke package version (`package.json`) covers all modules.

### refreshInstallation

`refresh-installation.js` gains a Gyre module section that copies all markdown files from the `_gyre/` source to the project, following the exact pattern used for Vortex.

## Architecture Validation

### Requirement Coverage

| Requirement Area | Coverage | Mechanism |
|-----------------|----------|-----------|
| Stack Detection (FR1-FR8) | Full | Scout agent + Claude Code tools |
| Model Generation (FR9-FR15) | Full | Atlas agent + WebSearch |
| Absence Detection (FR16-FR23) | Full | Lens agent + Claude Code tools |
| Review & Amendment (FR24-FR30) | Full | Coach agent conversational walkthrough |
| Output & Presentation (FR31-FR37, FR49-FR50) | Adapted | Conversational output replaces CLI |
| Run Lifecycle (FR38-FR43, FR51-FR53, FR55-FR57) | Adapted | Workflow step-files handle lifecycle |
| Installation (FR44-FR48) | Replaced | `convoke-install-gyre` + no provider config |
| Privacy (NFR7-NFR9) | Adapted | Contract schema rules replace code tiers |
| Performance (NFR1-NFR5) | Adapted | Measured in conversation flow |
| Reliability (NFR10-NFR13) | Adapted | Conversation-native error handling |
| Quality Gates (NFR18-NFR22) | Full | Accuracy-validation workflow |

### FRs Removed (CLI-specific, no longer applicable)

| FR | Description | Why removed |
|----|-------------|-------------|
| FR7 | `--guard` CLI flags | Guard questions are conversational |
| FR32 | Streaming findings display | Claude Code handles output |
| FR36 | JSON output format | Findings are conversational + YAML artifacts |
| FR44 | `npm install -g gyre` | Installed via `convoke-install-gyre` |
| FR45 | AI provider config via env var | Agent IS the LLM |
| FR46 | `gyre setup` command | No provider config needed |
| FR47 | Fail-fast provider error | No external provider |
| FR48 | Auto model selection | Agent IS the LLM |
| FR54 | JSON status field | No JSON output |
| FR57 | Complete-or-nothing persistence | Conversation handles partial results naturally |

### NFRs Adapted

| NFR | Original | Adapted |
|-----|----------|---------|
| NFR1 | CLI time-to-first-finding <2min | Conversation time-to-first-finding <2min (Scout + Atlas + Lens first finding) |
| NFR5 | CLI startup <3s | Agent activation <3s (config load + greeting) |
| NFR14 | ≥2 LLM providers | Removed — agent IS Claude |
| NFR17 | JSON schema stability | Removed — no JSON output |

### Decisions Log

| Decision | Choice | Alternatives Considered | Rationale |
|----------|--------|------------------------|-----------|
| Module type | Convoke team (conversational agents) | CLI tool with code agents | User decision — Gyre works like Vortex, not like a standalone tool |
| Number of agents | 4 (Scout, Atlas, Lens, Coach) | 2 (detect+generate, analyze+review), 6 (split by domain) | 4 maps cleanly to the pipeline phases; each agent has a clear persona and responsibility |
| Contract count | 4 (GC1-GC4) | 10 (matching Vortex) | Gyre's pipeline is linear with one feedback loop; 4 contracts cover all handoffs |
| Privacy mechanism | Contract schema rules | Code-enforced tiers | No "local code" path exists — agent IS the LLM; contract rules constrain what enters artifacts |
| Workflow count | 7 | 4 (only major phases) | 7 allows standalone execution of each phase + orchestrator + delta + validation |
| Guard question delivery | Conversational | CLI flags | Natural in conversation; no flags needed |
| Review mechanism | Conversational walkthrough | $EDITOR, CLI interactive | Consistent with Convoke team pattern; more accessible than YAML editing |
| Artifact format | YAML in `.gyre/` | JSON, database | Consistent with Vortex; VCS-friendly; no server needed |
| Web search | Atlas uses WebSearch tool | Custom API integration | Claude Code provides WebSearch natively |
| Model caching | capabilities.yaml IS the cache | Separate cache layer | Simple; the artifact is the cache; regeneration is explicit |
