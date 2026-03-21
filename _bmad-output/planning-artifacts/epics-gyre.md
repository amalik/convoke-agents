---
stepsCompleted: [1, 2, 3, 4]
status: 'complete'
completedAt: '2026-03-21'
editHistory:
  - date: '2026-03-21'
    changes: "Full rewrite: Epics regenerated from Convoke team architecture. Replaces CLI-tool epics (32 stories across 5 epics) with Convoke team module epics (4 epics, ~24 stories). No application code — only markdown agent definitions, workflow step-files, contracts, and integration scripts."
inputDocuments:
  - _bmad-output/planning-artifacts/prd-gyre.md
  - _bmad-output/planning-artifacts/architecture-gyre.md
  - _bmad-output/planning-artifacts/product-brief-gyre-2026-03-19.md
---

# Gyre - Epic Breakdown (Convoke Team Module)

## Overview

This document provides the complete epic and story breakdown for Gyre as a Convoke team module — conversational persona agents running inside Claude Code. All "implementation" is markdown (agent definitions, workflow step-files, contracts) plus integration scripts following existing Convoke patterns.

## Requirements Inventory

### Functional Requirements

FR1: System can detect the primary technology stack of a project by analyzing file system artifacts (package manifests, config files, IaC templates)
FR1b: System can detect multiple technology stacks within a project, select the primary stack for model generation, and surface secondary stacks as a warning
FR2: System can detect container orchestration platform (Kubernetes, ECS, Docker Compose) from project files
FR3: System can detect CI/CD platform (GitHub Actions, GitLab CI, Jenkins) from project files
FR4: System can detect observability tooling (Datadog, Prometheus, OpenTelemetry) from config and dependency files
FR5: System can detect cloud provider (AWS, GCP, Azure) from IaC templates and config files
FR6: System can present architecture intent guard questions to the user to confirm stack classification (≤3 questions, derived from detection)
FR7: User can provide guard question answers conversationally, including correcting previous answers without re-running the full analysis
FR8: System can re-classify the stack based on corrected guard answers without re-running the full analysis pipeline
FR9: System can generate a capabilities manifest (`.gyre/capabilities.yaml`) unique to the detected stack, using LLM reasoning and web search
FR10: System can incorporate industry standards (DORA, OpenTelemetry, Google PRR) into the generated model
FR11: System can incorporate current best practices via web search into the generated model
FR12: System can adjust the generated model based on the guard question classification
FR13: Each generated capability includes a plain-language description (1-3 sentences)
FR14: System can generate ≥20 capabilities for supported stack archetypes
FR15: System can surface a limited-coverage warning when fewer than 20 capabilities are generated
FR16: Observability Readiness workflow can analyze the project for observability gaps
FR17: Deployment Readiness workflow can analyze the project for deployment gaps
FR18: System can identify capabilities listed in the contextual model for which no evidence was found
FR19: System can tag each finding with its source (static analysis vs contextual model)
FR20: System can tag each finding with a confidence level (high/medium/low)
FR21: System can classify each finding by severity (blocker/recommended/nice-to-have)
FR22a: System can identify cross-domain compound gaps (causal or amplifying relationships between domains)
FR22b: System can express compound finding relationships as a reasoning chain in conversational output and YAML
FR23: Analysis produces a structured capability evidence report (capability ID, evidence type, detection method, no file contents)
FR24: User can review the generated capabilities manifest through conversational walkthrough with Coach
FR25: User can amend the capabilities manifest through conversational interaction with Coach
FR26: System respects user amendments on subsequent runs (amendment persistence, per-repo MVP)
FR27: When user removes capabilities, system excludes those and associated findings on re-run (model subtraction)
FR28: System prompts user for feedback after each analysis ("Did Gyre miss anything you know about?")
FR29: User feedback is persisted to `.gyre/feedback.yaml` with timestamp
FR30: System explains that feedback.yaml should be committed for team-wide model improvement
FR31: System can display a model summary before findings (capability count, detected stack)
FR33: System can display a severity-first leadership summary (blockers, recommended, nice-to-have counts)
FR34: System can display the novelty ratio ("X of Y findings are contextual")
FR35: System can display compound findings with reasoning chain
FR37: System can display mode indicator (crisis or anticipation) at start of output
FR38: System can detect whether a previous analysis exists and auto-select crisis/anticipation mode
FR39: System can persist findings history across runs
FR40: System can compute delta between current and previous run (new, carried-forward, resolved)
FR41: System can display delta-tagged findings ([NEW], [CARRIED]) and resolved finding summary
FR42: System can create `.gyre/` directory structure on first run
FR43: System can prompt user to review capabilities manifest
FR44: User can install Gyre via `convoke-install-gyre`
FR49: User can copy/paste severity summary and findings into external tools without formatting artifacts
FR50: System can provide a brief rationale for each finding's severity classification
FR51: System can detect service boundaries in monorepos and ask user to select
FR52: When limited-coverage warning triggered, system presents option to continue or abort
FR53: System can display existing `.gyre/feedback.yaml` entries at start of analysis
FR55: System can persist "review deferred" flag and display reminder on next run
FR56: If analysis fails after model generation, manifest is saved; agent informs user of retry without regeneration

**Removed FRs (CLI-specific):** FR32 (CLI streaming), FR36 (JSON output), FR45 (provider config), FR46 (setup command), FR47 (fail-fast provider), FR48 (auto model selection), FR54 (JSON status field), FR57 (complete-or-nothing persistence)

### Non-Functional Requirements

NFR1: Time-to-first-finding <2 minutes from workflow start (intermediate: detection <10s, guard <15s, model gen <90s)
NFR2: Total analysis time <10 minutes for typical project (≤500 files, ≤2 domains)
NFR3: Guard question response time <1 second
NFR4: Re-run with existing model ≤50% of first-run time
NFR5: Agent activation time <3 seconds from activation to first output
NFR7: Committed artifacts contain only structured metadata — never source code, file contents, paths, or secrets
NFR8: Artifact content boundary — what enters `.gyre/` artifacts is constrained by contract schemas
NFR9: Generated artifacts must not contain source code snippets, file contents, or secrets
NFR10: Same project + same guard → substantially similar manifest. Cache after first run (capabilities.yaml IS the cache).
NFR11: Graceful analysis failure — agent reports what it found and offers retry
NFR12: Gyre agents never modify, delete, or write outside `.gyre/` directory
NFR13: Run exclusivity via `.gyre/.lock` — abort if another analysis running
NFR15: Node.js ≥20 for installer scripts; agents are markdown, no Node.js dependency
NFR16: OS compatibility — wherever Claude Code runs
NFR17: YAML artifact schemas versioned; breaking changes require version bump
NFR18: Each Gyre workflow independently runnable
NFR19: Model accuracy ≥70% across ≥3 stack archetypes (pre-pilot release gate)
NFR20: Guard options cover ≥95% of common architectures without expert knowledge
NFR21: Web search results from current calendar year; no cross-run caching
NFR22: Compound findings suppressed when either component has confidence "low"

**Removed NFRs:** NFR6 (API key storage), NFR14 (multi-provider)

### Architecture Requirements

AR1: Module at `_bmad/bme/_gyre/` — config.yaml, README, compass-routing-reference, agents/, workflows/, contracts/
AR2: 4 persona agents: Scout (stack-detective), Atlas (model-curator), Lens (readiness-analyst), Coach (review-coach)
AR3: XML activation protocol following Vortex pattern — 7 steps, mandatory config loading at step 2
AR4: 4 handoff contracts: GC1 (Stack Profile), GC2 (Capabilities Manifest), GC3 (Findings Report), GC4 (Feedback Loop)
AR5: 7 workflows: full-analysis, stack-detection, model-generation, model-review, gap-analysis, delta-report, accuracy-validation
AR6: Step-file architecture following Vortex pattern — each workflow has 3-5 step files
AR7: Compass routing tables in final step of each workflow
AR8: Contract schemas enforce privacy boundary (GC1 must not contain file contents, paths, or secrets)
AR9: `convoke-install-gyre` installer following `install-vortex-agents.js` pattern
AR10: Agent registry extension — GYRE_AGENTS and GYRE_WORKFLOWS arrays in agent-registry.js
AR11: `convoke-doctor` validation — 4 agents, 7 workflows, config.yaml, contracts
AR12: `refreshInstallation` gains Gyre module section
AR13: Agent manifest (`agent-manifest.csv`) updated with 4 Gyre agents

### UX Design Requirements

N/A — Gyre is a conversational agent team with no UI design document.

### FR Coverage Map

| FR | Epic | Brief Description |
|----|------|-------------------|
| FR44 | E1 | Install via convoke-install-gyre |
| FR42 | E1 | Create `.gyre/` directory structure on first run |
| FR1 | E1 | Detect primary tech stack from file system artifacts |
| FR1b | E1 | Detect multiple stacks, surface secondary as warning |
| FR2 | E1 | Detect container orchestration platform |
| FR3 | E1 | Detect CI/CD platform |
| FR4 | E1 | Detect observability tooling |
| FR5 | E1 | Detect cloud provider |
| FR6 | E1 | Present guard questions to confirm classification |
| FR7 | E1 | Conversational guard answer correction |
| FR8 | E1 | Re-classify stack from corrected guard answers |
| FR51 | E1 | Detect monorepo service boundaries |
| FR9 | E2 | Generate capabilities manifest via LLM reasoning |
| FR10 | E2 | Incorporate industry standards into model |
| FR11 | E2 | Incorporate web search results into model |
| FR12 | E2 | Adjust model based on guard classification |
| FR13 | E2 | Capability plain-language descriptions |
| FR14 | E2 | Generate ≥20 capabilities for supported archetypes |
| FR15 | E2 | Surface limited-coverage warning (<20 capabilities) |
| FR31 | E2 | Display model summary (capability count, detected stack) |
| FR52 | E2 | Limited-coverage continuation/abort option |
| FR16 | E3 | Observability Readiness analysis |
| FR17 | E3 | Deployment Readiness analysis |
| FR18 | E3 | Identify capabilities with no evidence of implementation |
| FR19 | E3 | Tag finding source (static vs contextual) |
| FR20 | E3 | Tag finding confidence (high/medium/low) |
| FR21 | E3 | Classify finding severity (blocker/recommended/nice-to-have) |
| FR22a | E3 | Identify cross-domain compound gaps |
| FR22b | E3 | Express compounds as reasoning chain |
| FR23 | E3 | Structured capability evidence report |
| FR33 | E3 | Severity-first leadership summary |
| FR34 | E3 | Novelty ratio display |
| FR35 | E3 | Compound findings with reasoning chain |
| FR37 | E3 | Mode indicator (crisis or anticipation) |
| FR49 | E3 | Copy-pasteable output |
| FR50 | E3 | Severity rationale per finding |
| FR56 | E3 | Save manifest on partial failure, inform of retry |
| FR24 | E4 | Review manifest via conversational walkthrough |
| FR25 | E4 | Amend manifest through conversation |
| FR26 | E4 | Amendment persistence on subsequent runs |
| FR27 | E4 | Model subtraction (exclude removed capabilities) |
| FR28 | E4 | Feedback prompt after analysis |
| FR29 | E4 | Persist feedback to `.gyre/feedback.yaml` |
| FR30 | E4 | Explain feedback.yaml commit for team improvement |
| FR43 | E4 | Prompt user to review manifest |
| FR53 | E4 | Display existing feedback entries at analysis start |
| FR55 | E4 | Persist "review deferred" flag and reminder |
| FR38 | E4 | Auto-detect crisis/anticipation mode |
| FR39 | E4 | Persist findings history across runs |
| FR40 | E4 | Compute delta (new, carried-forward, resolved) |
| FR41 | E4 | Display delta-tagged findings |

### NFR Coverage Map

| NFR | Epic | Enforcement |
|-----|------|-------------|
| NFR1 | E2 (intermediate), E3 (full) | Performance acceptance criteria in workflow step timing |
| NFR2 | E3 | Total time AC |
| NFR3 | E1 | Guard response time AC |
| NFR5 | E1 | Agent activation time AC |
| NFR7 | E2 | Privacy boundary: contract schema validation |
| NFR8 | E2 | Artifact content: GC1-GC3 schema rules |
| NFR9 | E2, E4 | Artifact safety AC |
| NFR10 | E2 | Model caching AC (capabilities.yaml IS the cache) |
| NFR11 | E3 | Graceful failure AC (agent reports + retry offer) |
| NFR12 | E1 | File system safety: write only to `.gyre/` |
| NFR13 | E1 | Lock file AC |
| NFR15 | E1 | Node ≥20 in package.json engines (installer only) |
| NFR16 | E1 | Claude Code platform support (inherited) |
| NFR17 | E2 | YAML schema versioning AC |
| NFR18 | E3, E4 | Workflow independence AC |
| NFR19 | E2 | Model accuracy gate (≥70%, spike story) |
| NFR20 | E1 | Guard coverage AC |
| NFR21 | E2 | Web search freshness AC |
| NFR22 | E3 | Compound confidence suppression AC |

### AR Coverage Map

| AR | Epic | Description |
|----|------|-------------|
| AR1 | E1 | Module structure at `_bmad/bme/_gyre/` |
| AR2 | E1 | 4 persona agents (Scout, Atlas, Lens, Coach) |
| AR3 | E1 | XML activation protocol |
| AR4 | E1, E3, E4 | 4 handoff contracts (GC1-GC4) |
| AR5 | E1, E2, E3, E4 | 7 workflows with step-files |
| AR6 | E1, E2, E3, E4 | Step-file architecture |
| AR7 | E1, E2, E3, E4 | Compass routing tables |
| AR8 | E2 | Privacy boundary via contract schema |
| AR9 | E1 | `convoke-install-gyre` installer |
| AR10 | E1 | Agent registry extension |
| AR11 | E1 | `convoke-doctor` validation |
| AR12 | E1 | `refreshInstallation` Gyre section |
| AR13 | E1 | Agent manifest update |

## Epic List

### Epic 1: Module Foundation & Stack Detection

User can install the Gyre module, activate Scout agent, and get their technology stack correctly identified with guard question confirmation. Includes module scaffolding (config.yaml, agents, workflows, contracts directories), Convoke ecosystem integration (installer, registry, doctor, manifest), and the complete stack-detection workflow.

**FRs covered:** FR1, FR1b, FR2, FR3, FR4, FR5, FR6, FR7, FR8, FR42, FR44, FR51 (12 FRs)
**ARs:** AR1-AR3, AR4 (GC1), AR5 (stack-detection, full-analysis skeleton), AR6, AR7, AR9-AR13
**NFRs enforced:** NFR3, NFR5, NFR12, NFR13, NFR15, NFR16, NFR20
**Risk:** Low — mostly markdown scaffolding + existing Convoke patterns

### Epic 2: Contextual Model Generation

User can have Atlas generate a capabilities manifest unique to their detected stack — incorporating industry standards, web search, and guard answers — and see a summary of what was generated. **Includes accuracy validation spike (NFR19 ≥70%) as the first story — this is the go/no-go gate for the entire product.**

**FRs covered:** FR9, FR10, FR11, FR12, FR13, FR14, FR15, FR31, FR52 (9 FRs)
**ARs:** AR4 (GC2), AR5 (model-generation), AR6, AR7, AR8
**NFRs enforced:** NFR1 (intermediate), NFR7, NFR8, NFR9, NFR10, NFR17, NFR19, NFR21
**Risk:** High — model generation quality is the critical path. Prompt iteration for Atlas is the main effort.

### Epic 3: Absence Detection & Findings

Lens can analyze the project for gaps across two domains (observability + deployment), tag findings with source/confidence/severity, identify cross-domain compounds, and present a severity-first summary with novelty ratio. Includes the gap-analysis workflow and full-analysis orchestration.

**FRs covered:** FR16, FR17, FR18, FR19, FR20, FR21, FR22a, FR22b, FR23, FR33, FR34, FR35, FR37, FR49, FR50, FR56 (16 FRs)
**ARs:** AR4 (GC3), AR5 (gap-analysis, full-analysis complete), AR6, AR7
**NFRs enforced:** NFR1 (full), NFR2, NFR4, NFR11, NFR18, NFR22
**Risk:** Medium — prompt engineering for Lens analysis accuracy + compound correlation quality

### Epic 4: Review, Feedback & Delta

Coach guides user through reviewing findings and amending the capabilities manifest. Captures feedback on missed gaps. Delta-report workflow compares current vs previous runs. Completes the full Gyre analysis cycle.

**FRs covered:** FR24, FR25, FR26, FR27, FR28, FR29, FR30, FR38, FR39, FR40, FR41, FR43, FR53, FR55 (14 FRs)
**ARs:** AR4 (GC4), AR5 (model-review, delta-report), AR6, AR7
**NFRs enforced:** NFR4, NFR9, NFR18
**Risk:** Low — conversational walkthrough is straightforward; delta computation uses YAML diffing

---

## Epic 1: Module Foundation & Stack Detection

**Goal:** User can install Gyre, activate Scout, and see their technology stack correctly identified.

### Story 1.1: Module Scaffolding & Config

As a Convoke developer,
I want the Gyre module directory structure created at `_bmad/bme/_gyre/`,
So that all Gyre agents, workflows, and contracts have a home.

**Acceptance Criteria:**

**Given** the Gyre module is being created
**When** the module structure is scaffolded
**Then** the following exists:
- `_bmad/bme/_gyre/config.yaml` with submodule_name, description, module, output_folder, agents list, workflows list, version, user_name, communication_language, party_mode_enabled, core_module fields
- `_bmad/bme/_gyre/README.md` with module overview, agent table, workflow list (following Vortex README pattern)
- `_bmad/bme/_gyre/agents/` directory (empty, populated by subsequent stories)
- `_bmad/bme/_gyre/workflows/` directory (empty, populated by subsequent stories)
- `_bmad/bme/_gyre/contracts/` directory (empty, populated by subsequent stories)
**And** config.yaml lists 4 agents: stack-detective, model-curator, readiness-analyst, review-coach
**And** config.yaml lists 7 workflows: full-analysis, stack-detection, model-generation, model-review, gap-analysis, delta-report, accuracy-validation

### Story 1.2: Scout Agent Definition

As a user,
I want to activate Scout and have it greet me and show its menu,
So that I can start a stack analysis conversation.

**Acceptance Criteria:**

**Given** the Scout agent file is created at `_bmad/bme/_gyre/agents/stack-detective.md`
**When** the agent is activated
**Then** it follows the XML activation protocol:
- Step 1: Load persona from agent file
- Step 2: Load `_bmad/bme/_gyre/config.yaml` — error handling if missing or invalid
- Step 3: Store user_name from config
- Step 4: Greet user by name, communicate in configured language, display numbered menu
- Step 5: Wait for user input (number, text, or fuzzy match)
- Step 6: Process input via menu handlers
- Step 7: Execute selected menu item
**And** Scout's menu includes: [1] Detect Stack, [2] Full Analysis
**And** menu items use `workflow` handler type pointing to workflow.md files
**And** Scout's persona is "methodical investigator" — reports evidence, never guesses

### Story 1.3: Stack Detection Workflow

As a user,
I want Scout to scan my project and tell me what technology stack it detected,
So that I can confirm or correct the classification before analysis.

**Acceptance Criteria:**

**Given** the stack-detection workflow exists at `_bmad/bme/_gyre/workflows/stack-detection/`
**When** Scout runs the workflow
**Then** it has 3 step files:

**step-01-scan-filesystem.md:**
**Given** Scout has access to Claude Code tools
**When** it scans the project
**Then** it uses Glob to find: package manifests (package.json, go.mod, requirements.txt, Cargo.toml, pom.xml), Dockerfiles, docker-compose.yaml, k8s manifests, CI configs (.github/workflows/, .gitlab-ci.yml, Jenkinsfile), IaC templates (terraform/, cloudformation/), cloud provider configs
**And** it uses Grep to search for: framework imports, observability tool references (opentelemetry, prometheus, datadog), cloud provider SDKs
**And** it uses Read to examine: detected config files for specific settings
**And** covers FR1, FR1b, FR2, FR3, FR4, FR5

**step-02-classify-stack.md:**
**Given** Scout has scan results
**When** it classifies the stack
**Then** it identifies: primary language/framework, container orchestration, CI/CD platform, observability tooling, cloud provider, communication protocol
**And** it identifies ambiguities requiring guard questions
**And** if multiple stacks detected (FR1b), it selects primary and surfaces secondary as warning

**step-03-guard-questions.md:**
**Given** Scout has classification with potential ambiguities
**When** it needs to confirm architecture intent
**Then** it asks ≤3 guard questions derived from what was detected (not a fixed list) (FR6)
**And** questions cover: deployment model, communication protocol, ambiguous detections
**And** user answers conversationally (FR7)
**And** if user corrects a previous answer, Scout re-classifies without re-scanning (FR8)
**And** guard response processing takes <1 second (NFR3)
**And** guard options cover ≥95% of common architectures (NFR20)
**And** if detection is unambiguous, guard questions are skipped entirely

### Story 1.4: GC1 Stack Profile Contract

As an Atlas agent,
I want Scout's detection results in a structured format,
So that I can generate a contextually relevant capabilities manifest.

**Acceptance Criteria:**

**Given** the GC1 contract is created at `_bmad/bme/_gyre/contracts/gc1-stack-profile.md`
**When** Scout completes stack detection
**Then** it writes the Stack Profile to `.gyre/stack-profile.yaml` following the GC1 schema:
- stack_profile.primary_language, primary_framework, secondary_stacks, container_orchestration, ci_cd_platform, observability_tooling, cloud_provider, communication_protocol, guard_answers, detection_confidence, detection_summary
**And** GC1 contract frontmatter declares: source_agent: scout, target_agents: [atlas, lens]
**And** **PRIVACY RULE:** GC1 contains technology categories only — NOT file contents, file paths, version numbers, dependency counts, dependency names, or secrets (AR8)
**And** `.gyre/` directory is created on first run if it doesn't exist (FR42)
**And** `.gyre/.lock` prevents concurrent analysis (NFR13)
**And** write is atomic (write to temp, rename)

### Story 1.5: Monorepo Service Boundary Detection

As a user with a monorepo,
I want Scout to detect multiple services and ask me which one to analyze,
So that each service gets its own contextual model.

**Acceptance Criteria:**

**Given** Scout detects multiple directories with their own package manifest AND deployment config
**When** ≥2 service roots are detected
**Then** Scout lists them conversationally and asks user to select one (FR51)
**And** system does NOT attempt implicit boundary detection (directory naming conventions)
**And** each selected service gets its own `.gyre/` directory at its service root

### Story 1.6: Ecosystem Integration — Installer, Registry, Config-Driven Doctor

As a Convoke user,
I want to install Gyre with `convoke-install-gyre` and have it validated by `convoke-doctor`,
So that Gyre integrates cleanly with my existing Convoke setup.

**Acceptance Criteria:**

**Given** `convoke-install-gyre` script is created following `install-vortex-agents.js` pattern (AR9)
**When** user runs `convoke-install-gyre`
**Then** it copies `_bmad/bme/_gyre/` contents to the project
**And** registers Gyre agents in `agent-manifest.csv` (AR13)
**And** bin entry `convoke-install-gyre` added to `package.json`

**Given** `agent-registry.js` is extended (AR10)
**When** registry is loaded
**Then** it exports GYRE_AGENTS (4 agents) and GYRE_WORKFLOWS (7 workflows) arrays
**And** derived lists (GYRE_AGENT_FILES, GYRE_WORKFLOW_DIRS) follow existing derivation pattern

**Given** `convoke-doctor` is refactored to be config-driven (AR11, ADR-001)
**When** doctor runs with any module installed
**Then** it discovers all modules by scanning `_bmad/bme/*/config.yaml`
**And** for each module, reads `agents[]` and `workflows[]` from config.yaml
**And** validates each declared agent file exists
**And** validates each declared workflow directory exists
**And** validates config.yaml conforms to the shared module schema
**And** validates module-specific files (contracts, compass-routing-reference.md) declared in config
**And** existing Vortex validation continues to pass unchanged

**Given** `refreshInstallation` is extended (AR12)
**When** refresh runs
**Then** it copies all Gyre markdown files from source to project

**Note (ADR-001):** The config-driven doctor refactor is a critical integration enabler. By deriving validation expectations from each module's `config.yaml` rather than hardcoded arrays, future modules (including Enhance-generated modules) can be validated without modifying doctor code. This is the shared integration gate for the staggered parallel build — see `adr-enhance-gyre-build-sequencing.md`.

**Scope clarification (ADR-001 Red Team H3):** Config-driven doctor validates **file existence only** — declared agents, workflows, and config files are present in the correct paths. Module-specific **content validation** (contract YAML schema correctness, workflow step completeness, agent protocol compliance) is explicitly NOT in scope for this story. Content quality is each module's own workflow responsibility, not doctor's.

### Story 1.7: Compass Routing Reference & Full-Analysis Skeleton

As a user completing any Gyre workflow,
I want to see routing options for what to do next,
So that I can navigate between Gyre agents and workflows.

**Acceptance Criteria:**

**Given** `compass-routing-reference.md` is created at `_bmad/bme/_gyre/` (AR7)
**When** a user finishes any Gyre workflow step
**Then** the compass table shows: agent, workflow, and rationale for each option
**And** includes inter-module routing (Gyre → Vortex) for findings that impact product discovery

**Given** `full-analysis/workflow.md` skeleton is created (AR5)
**When** full-analysis is invoked
**Then** it orchestrates: step-01-initialize (check `.gyre/`, detect mode) → step-02-detect-stack (invoke Scout) → remaining steps stubbed for E2-E4

---

## Epic 2: Contextual Model Generation

**Goal:** Atlas generates a capabilities manifest unique to the user's detected stack.

### Story 2.1: Model Accuracy Spike (NFR19 Gate)

As the product team,
I want to validate that Atlas can achieve ≥70% model accuracy across ≥3 stack archetypes,
So that we have a go/no-go decision for the entire product.

**Acceptance Criteria:**

**Given** the accuracy-validation workflow exists at `_bmad/bme/_gyre/workflows/accuracy-validation/`
**When** the spike is run against ≥3 synthetic ground truth repos (CNCF Go/K8s, Node.js web service, Python data pipeline)
**Then** Atlas generates a capabilities manifest for each
**And** each capability is scored: relevant (1.0), partially-relevant (0.5), irrelevant (0.0)
**And** accuracy = sum of relevance / total capabilities
**And** ≥70% accuracy across all 3 archetypes (NFR19)
**And** methodology is documented and repeatable

**BLOCKER:** If <70% accuracy, iterate Atlas prompts before proceeding to E3.

### Story 2.2: Atlas Agent Definition

As a user,
I want to activate Atlas and have it offer to generate or review my capabilities model,
So that I can get a contextual readiness model for my stack.

**Acceptance Criteria:**

**Given** the Atlas agent file is created at `_bmad/bme/_gyre/agents/model-curator.md`
**When** the agent is activated
**Then** it follows the XML activation protocol (same as Scout — 7 steps, config load, greeting, menu)
**And** Atlas's menu includes: [1] Generate Model, [2] Regenerate Model, [3] Full Analysis
**And** Atlas's persona is "knowledgeable curator" — balances standards with practical relevance, transparent about confidence

### Story 2.3: Model Generation Workflow

As a user,
I want Atlas to generate a capabilities manifest using my stack profile, industry standards, and web search,
So that I have a contextual model of what should exist in my production stack.

**Acceptance Criteria:**

**Given** the model-generation workflow exists at `_bmad/bme/_gyre/workflows/model-generation/`
**When** Atlas runs the workflow
**Then** it has 4 step files:

**step-01-load-profile.md:**
**Given** GC1 (stack-profile.yaml) exists
**When** Atlas loads it
**Then** it reads the stack classification and guard answers
**And** checks for existing amendments (GC4 feedback loop) to respect on regeneration

**step-02-generate-capabilities.md:**
**Given** Atlas has the stack profile
**When** it generates capabilities
**Then** each capability has: id, category, name, description (1-3 sentences), source (standard/practice/reasoning), relevance (why it matters for this stack) (FR9, FR13)
**And** it incorporates DORA, OpenTelemetry, Google PRR standards (FR10)
**And** it adjusts based on guard answers (FR12) — e.g., gRPC health checks vs HTTP health endpoints

**step-03-web-enrichment.md:**
**Given** Atlas has generated initial capabilities
**When** it uses WebSearch for current best practices (FR11)
**Then** web results are from current calendar year (NFR21)
**And** when conflicting advice is found, Atlas selects the most authoritative source and notes the conflict
**And** each capability's source field indicates if web-search-derived

**step-04-write-manifest.md:**
**Given** Atlas has the complete capabilities list
**When** it writes to `.gyre/capabilities.yaml` (GC2 schema)
**Then** manifest includes: version, generated_at, stack_summary, capability_count, limited_coverage flag, capabilities array, provenance metadata
**And** if <20 capabilities generated, limited_coverage=true and Atlas warns user (FR15)
**And** if limited_coverage, Atlas offers: continue (with emphasis on review-and-amend) or abort (FR52)
**And** Atlas presents model summary: "Generated N capabilities for your X/Y stack" (FR31)
**And** model caching: capabilities.yaml IS the cache; re-runs load it, no regeneration unless explicit (NFR10)

### Story 2.4: GC2 Capabilities Manifest Contract

As a Lens agent,
I want the capabilities manifest in a structured format,
So that I can compare each capability against filesystem evidence.

**Acceptance Criteria:**

**Given** the GC2 contract is created at `_bmad/bme/_gyre/contracts/gc2-capabilities-manifest.md`
**When** Atlas completes model generation
**Then** GC2 contract frontmatter declares: source_agent: atlas, target_agents: [lens, coach]
**And** schema matches the architecture specification (gyre_manifest with version, capabilities array, provenance)
**And** **ARTIFACT SAFETY:** capabilities.yaml must not contain source code, file contents, or secrets (NFR9)
**And** YAML schema version field enables future breaking changes (NFR17)

### Story 2.5: Full-Analysis Steps 2-3 Integration

As a user running full-analysis,
I want the pipeline to flow from stack detection to model generation seamlessly,
So that I don't have to manually invoke each workflow.

**Acceptance Criteria:**

**Given** full-analysis workflow has step-02-detect-stack and step-03-generate-model
**When** Scout completes detection (step 2)
**Then** control passes to Atlas for model generation (step 3)
**And** if cached model exists (anticipation mode), Atlas loads it and skips generation
**And** if user requests regeneration, Atlas generates fresh model even with existing cache

---

## Epic 3: Absence Detection & Findings

**Goal:** Lens analyzes the project for production readiness gaps and presents findings.

### Story 3.1: Lens Agent Definition

As a user,
I want to activate Lens and have it offer gap analysis options,
So that I can find what's missing from my production stack.

**Acceptance Criteria:**

**Given** the Lens agent file is created at `_bmad/bme/_gyre/agents/readiness-analyst.md`
**When** the agent is activated
**Then** it follows the XML activation protocol
**And** Lens's menu includes: [1] Analyze Gaps, [2] Full Analysis, [3] Delta Report
**And** Lens's persona is "thorough analyst" — finds gaps methodically, source-tags everything, never inflates severity

### Story 3.2: Observability Readiness Analysis

As a user,
I want Lens to analyze my project for observability gaps,
So that I know what monitoring and instrumentation is missing.

**Acceptance Criteria:**

**Given** the gap-analysis workflow step-02-observability-analysis.md exists
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

### Story 3.3: Deployment Readiness Analysis

As a user,
I want Lens to analyze my project for deployment gaps,
So that I know what CI/CD and deployment safety mechanisms are missing.

**Acceptance Criteria:**

**Given** the gap-analysis workflow step-03-deployment-analysis.md exists
**When** Lens runs deployment analysis
**Then** same analysis pattern as Story 3.2 but for deployment capabilities
**And** covers: CI/CD pipelines, deployment manifests, rollback mechanisms, graceful shutdown, blue-green/canary configs, health checks, deployment event markers
**And** all finding tagging rules apply (FR17, FR19, FR20, FR21)

### Story 3.4: Cross-Domain Correlation

As a user,
I want Lens to identify compound findings that span observability and deployment,
So that I can see interaction effects between domains.

**Acceptance Criteria:**

**Given** the gap-analysis workflow step-04-cross-domain-correlation.md exists
**When** both domain analyses are complete
**Then** Lens identifies causal or amplifying relationships between domains (FR22a)
**And** each compound finding references exactly 2 existing findings from different domains
**And** compound confidence = lower of the two component confidences
**And** compounds suppressed when either component has confidence "low" (NFR22)
**And** each compound includes: related_findings[], combined_impact reasoning chain (FR22b)
**And** correlation only runs when both domains succeed — omitted (not partial) on domain failure

### Story 3.5: GC3 Findings Report Contract & Presentation

As a Coach agent and user,
I want findings in a structured format with a clear conversational presentation,
So that I can understand what's missing and decide what to act on.

**Acceptance Criteria:**

**Given** the GC3 contract is created at `_bmad/bme/_gyre/contracts/gc3-findings-report.md`
**When** Lens completes analysis
**Then** it writes findings to `.gyre/findings.yaml` following the GC3 schema:
- version, analyzed_at, mode, stack_summary, summary (counts), findings array, compound_findings array, sanity_check
**And** contract frontmatter declares: source_agent: lens, target_agents: [coach]
**And** every finding references a valid capability_ref from GC2

**When** Lens presents findings conversationally (step-05-present-findings.md)
**Then** it shows:
- Mode indicator: crisis or anticipation (FR37)
- Severity-first summary: "X blockers, Y recommended, Z nice-to-have" (FR33)
- Novelty ratio: "X of Y findings are contextual — gaps a static linter would miss" (FR34)
- Detailed findings by severity (blockers first)
- Compound findings with reasoning chains (FR35)
- Output is copy-pasteable into Slack/Jira/docs (FR49)

**Given** analysis fails after model generation
**When** Lens encounters a failure
**Then** `.gyre/capabilities.yaml` is already saved (FR56)
**And** Lens reports what it found and offers to retry the failed domain (NFR11)

### Story 3.6: Full-Analysis Steps 4-5 Integration

As a user running full-analysis,
I want the pipeline to flow from model generation through gap analysis,
So that the complete pipeline works end-to-end.

**Acceptance Criteria:**

**Given** full-analysis workflow has step-04-analyze-gaps
**When** Atlas completes model generation (step 3)
**Then** control passes to Lens for gap analysis (step 4)
**And** Lens runs both domain analyses + cross-domain correlation
**And** step-05-review-findings hands off to Coach (E4 integration point)

**Given** time-to-first-finding target (NFR1)
**When** full pipeline runs
**Then** first finding is presented <2 minutes from workflow start
**And** total analysis completes <10 minutes for ≤500 files (NFR2)

---

## Epic 4: Review, Feedback & Delta

**Goal:** Coach guides review and amendment; delta-report tracks progress over time.

### Story 4.1: Coach Agent Definition

As a user,
I want to activate Coach and have it offer review and feedback options,
So that I can customize the capabilities model and report missed gaps.

**Acceptance Criteria:**

**Given** the Coach agent file is created at `_bmad/bme/_gyre/agents/review-coach.md`
**When** the agent is activated
**Then** it follows the XML activation protocol
**And** Coach's menu includes: [1] Review Findings, [2] Review Model, [3] Full Analysis
**And** Coach's persona is "patient guide" — respects user expertise, presents clearly, never pushes

### Story 4.2: Conversational Model Review & Amendment

As a user,
I want Coach to walk me through my capabilities manifest one capability at a time,
So that I can customize it to my stack without editing YAML.

**Acceptance Criteria:**

**Given** the model-review workflow exists at `_bmad/bme/_gyre/workflows/model-review/`
**When** Coach runs the walkthrough (step-02-walkthrough.md)
**Then** it presents each capability with: name, description, category, source
**And** for each capability asks: keep / remove / edit / skip remaining (FR24)
**And** user responds conversationally — "remove this", "keep", "change the description to..." (FR25)
**And** removed capabilities get `removed: true` flag (FR27 — model subtraction)
**And** edited capabilities get `amended: true` flag
**And** user can add new capabilities by describing them conversationally

**When** Coach applies amendments (step-03-apply-amendments.md)
**Then** amendments are written directly to `.gyre/capabilities.yaml` (GC4)
**And** amendments persist on subsequent runs — Atlas respects them on regeneration (FR26)
**And** amended artifacts must not contain source code or secrets (NFR9)

### Story 4.3: GC4 Feedback Loop Contract

As an Atlas agent,
I want amendment and feedback data in a structured format,
So that I can respect user changes when regenerating the model.

**Acceptance Criteria:**

**Given** the GC4 contract is created at `_bmad/bme/_gyre/contracts/gc4-feedback-loop.md`
**When** Coach completes a review
**Then** GC4 contract frontmatter declares: source_agent: coach, target_agents: [atlas]
**And** amendments are tracked in capabilities.yaml (removed/amended flags)
**And** feedback is written to `.gyre/feedback.yaml` with entries: timestamp, reporter, type, description, domain (FR29)

### Story 4.4: Feedback Capture & Display

As a user,
I want Coach to ask if Gyre missed anything and show me what my team previously reported,
So that the model improves over time and my team's knowledge is preserved.

**Acceptance Criteria:**

**Given** Coach reaches the feedback step
**When** it prompts "Did Gyre miss anything you know about?" (FR28)
**Then** user response is persisted to `.gyre/feedback.yaml` with timestamp (FR29)
**And** Coach explains: "Commit feedback.yaml to share improvements with your team" (FR30)

**Given** `.gyre/feedback.yaml` has existing entries
**When** a new analysis starts
**Then** existing feedback entries are displayed at the start (FR53)

**Given** user deferred model review (FR55)
**When** next analysis starts
**Then** Coach displays reminder: "You deferred reviewing your capabilities manifest last time — would you like to review now?"

### Story 4.5: Mode Detection & Review Prompt Integration

As a user running full-analysis,
I want the system to detect whether this is my first run or a re-run,
So that anticipation mode can skip model generation and show delta.

**Acceptance Criteria:**

**Given** full-analysis step-01-initialize.md
**When** `.gyre/` does not exist
**Then** mode = crisis (first run), creates `.gyre/` directory (FR38, FR42)

**When** `.gyre/capabilities.yaml` exists
**Then** mode = anticipation (re-run), loads cached model (FR38)
**And** re-run time ≤50% of first-run (NFR4 — model generation skipped)

**Given** full-analysis step-05-review-findings.md reaches Coach
**When** Coach presents findings
**Then** it prompts user to review manifest (FR43)
**And** offers: "Walk through now" / "Later" (deferred flag) / "Skip"

### Story 4.6: Delta Report Workflow

As a user who has run Gyre before,
I want to see what changed since my last analysis,
So that I can track my team's progress on production readiness.

**Acceptance Criteria:**

**Given** the delta-report workflow exists at `_bmad/bme/_gyre/workflows/delta-report/`
**When** Lens runs the delta workflow

**step-01-load-history.md:**
**Then** it loads `.gyre/history.yaml` (previous findings) and `.gyre/findings.yaml` (current findings) (FR39)

**step-02-compute-delta.md:**
**Then** it computes: new findings, carried-forward findings, resolved findings (FR40)
**And** new = in current but not in previous
**And** carried-forward = in both current and previous
**And** resolved = in previous but not in current

**step-03-present-delta.md:**
**Then** it presents: delta summary, new findings tagged [NEW], carried-forward tagged [CARRIED], resolved listed briefly (FR41)
**And** after presenting, saves current findings as history for next run
**And** ends with compass routing table

### Story 4.7: Full-Analysis Completion & Compass

As a user finishing a full analysis,
I want to see my options for what to do next,
So that I can continue with review, re-run, or move to Vortex.

**Acceptance Criteria:**

**Given** full-analysis step-05-review-findings.md is the final step
**When** Coach finishes review and feedback
**Then** it displays the Gyre compass routing table with all options
**And** includes inter-module routing to Vortex for findings that impact product discovery
**And** all 7 Gyre workflows are independently runnable from this point (NFR18)
