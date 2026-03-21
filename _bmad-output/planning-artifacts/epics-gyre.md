---
stepsCompleted: [1, 2, 3, 4]
status: 'complete'
completedAt: '2026-03-21'
inputDocuments:
  - _bmad-output/planning-artifacts/prd-gyre.md
  - _bmad-output/planning-artifacts/architecture-gyre.md
  - _bmad-output/planning-artifacts/product-brief-gyre-2026-03-19.md
  - _bmad-output/planning-artifacts/prd-gyre-validation-report.md
  - _bmad-output/planning-artifacts/implementation-readiness-report-2026-03-20.md
  - _bmad-output/planning-artifacts/research/domain-operational-readiness-research-2026-03-19.md
  - _bmad-output/vortex-artifacts/lean-experiment-gyre-discovery-interviews-2026-03-20.md
---

# Gyre - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for Gyre, decomposing the requirements from the PRD and Architecture into implementable stories.

## Requirements Inventory

### Functional Requirements

FR1: System can detect the primary technology stack of a project by analyzing file system artifacts (package manifests, config files, IaC templates)
FR1b: System can detect multiple technology stacks within a project, select the primary stack for model generation, and surface secondary stacks as a warning
FR2: System can detect container orchestration platform (Kubernetes, ECS, Docker Compose) from project files
FR3: System can detect CI/CD platform (GitHub Actions, GitLab CI, Jenkins) from project files
FR4: System can detect observability tooling (Datadog, Prometheus, OpenTelemetry) from config and dependency files
FR5: System can detect cloud provider (AWS, GCP, Azure) from IaC templates and config files
FR6: System can present architecture intent guard questions to the user to confirm stack classification (≤3 questions, derived from detection)
FR7: User can override guard question answers via CLI flags (`--guard deployment=containerized,protocol=grpc`)
FR8: System can re-classify the stack based on corrected guard answers without re-running the full analysis pipeline
FR9: System can generate a capabilities manifest (`.gyre/capabilities.yaml`) unique to the detected stack, using LLM reasoning and web search
FR10: System can incorporate industry standards (DORA, OpenTelemetry, Google PRR) into the generated model
FR11: System can incorporate current best practices via web search into the generated model
FR12: System can adjust the generated model based on the guard question classification
FR13: Each generated capability includes a plain-language description (1-3 sentences)
FR14: System can generate ≥20 capabilities for supported stack archetypes
FR15: System can surface a limited-coverage warning when fewer than 20 capabilities are generated
FR16: Observability Readiness agent can analyze the project for observability gaps
FR17: Deployment Readiness agent can analyze the project for deployment gaps
FR18: System can identify capabilities listed in the contextual model for which no evidence was found
FR19: System can tag each finding with its source (static analysis vs contextual model)
FR20: System can tag each finding with a confidence level (high/medium/low)
FR21: System can classify each finding by severity (blocker/recommended/nice-to-have)
FR22a: System can identify cross-domain compound gaps (causal or amplifying relationships between domains)
FR22b: System can express compound finding relationships as a text-based reasoning chain in CLI output
FR23: Static analysis produces a structured capability evidence report (capability ID, evidence type, detection method, no file contents)
FR24: User can review the generated capabilities manifest via $EDITOR or interactive CLI walkthrough (default for first-time)
FR25: User can amend the capabilities manifest by adding, removing, or modifying capabilities
FR26: System respects user amendments on subsequent runs (amendment persistence, per-repo MVP)
FR27: When user removes capabilities, system excludes those and associated findings on re-run (model subtraction)
FR28: System prompts user for feedback after each analysis ("Did Gyre miss anything you know about?")
FR29: User feedback is persisted to `.gyre/feedback.yaml` with timestamp
FR30: System explains that feedback.yaml should be committed for team-wide model improvement
FR31: System can display a model summary before findings (capability count, detected stack)
FR32: System can display each finding to CLI as soon as produced (streaming, not batch)
FR33: System can display a severity-first leadership summary (blockers, recommended, nice-to-have counts)
FR34: System can display the novelty ratio ("X of Y findings are contextual")
FR35: System can display compound findings with visually distinct indented reasoning chain
FR36: System can output analysis results in machine-readable JSON format
FR37: System can display mode indicator (crisis or anticipation) at start of output
FR38: System can detect whether a previous analysis exists and auto-select crisis/anticipation mode
FR39: System can persist findings history across runs
FR40: System can compute delta between current and previous run (new, carried-forward, resolved)
FR41: System can display delta-tagged findings ([NEW], [CARRIED]) and resolved finding summary
FR42: System can create `.gyre/` directory structure on first run
FR43: System can prompt user to review capabilities manifest with options (y/n/later)
FR44: User can install Gyre via npm (`npm install -g gyre` or `npx gyre analyze .`)
FR45: User can configure AI provider via environment variable or config file
FR46: User can complete first-run setup with exactly one action (env var or `gyre setup`)
FR47: System can fail fast with actionable error message when AI provider is unreachable
FR48: System can select the most capable model for the configured provider (`provider.model: auto`)
FR49: User can copy/paste severity summary and findings into external tools without formatting artifacts
FR50: System can provide a brief rationale for each finding's severity classification
FR51: System can detect service boundaries in monorepos using explicit signals (package manifests + deployment config)
FR52: When limited-coverage warning triggered, system presents option to continue or abort
FR53: System can display existing `.gyre/feedback.yaml` entries at start of analysis
FR54: JSON output includes `status` field matching CLI exit code semantics
FR55: System can persist "review deferred" flag and display reminder on next run
FR56: If analysis fails after model generation, system saves manifest and informs user of retry without regeneration
FR57: System treats analysis as complete-or-nothing for persistence; streamed CLI output may show partial, with clear error on failure

### NonFunctional Requirements

NFR1: Time-to-first-finding <2 minutes (intermediate: detection <10s, guard <15s, model gen <90s)
NFR2: Total analysis time <10 minutes for typical project (≤500 files, ≤2 domains)
NFR3: Guard question response time <1 second
NFR4: Re-run with existing model ≤50% of first-run time
NFR5: CLI startup time <3 seconds from command to first output
NFR6: API keys stored in env vars or local config (permissions 600); never logged, never in artifacts
NFR7: Static analysis runs locally; only structured findings and stack metadata sent to LLM. No source code to AI provider.
NFR8: LLM receives stack classification, guard answer, capability evidence, web search results. NOT file contents, paths, directory structures, or secrets.
NFR9: Generated artifacts must not contain source code snippets, file contents, or secrets
NFR10: Same project + same guard + same provider + same model version → substantially similar manifest (temperature=0, seed). Cache after first run.
NFR11: If LLM provider unreachable, fail within 10 seconds with actionable error
NFR12: Gyre never modifies, deletes, or writes outside `.gyre/` directory
NFR13: Run exclusivity via `.gyre/.lock` — abort if another analysis running
NFR14: Supports ≥2 LLM providers (Anthropic + OpenAI) with provider abstraction
NFR15: Node.js ≥20 (updated from ≥18 per architecture decision — Node 18 EOL + Commander v14)
NFR16: OS compatibility — macOS, Linux, Windows (via WSL or native)
NFR17: JSON schema versioned; breaking changes require version bump + `--unstable` flag
NFR18: Pipeline phases independently re-runnable where feasible
NFR19: Model accuracy ≥70% across ≥3 stack archetypes (pre-pilot release gate)
NFR20: Guard options cover ≥95% of common architectures without expert knowledge
NFR21: Web search results from current calendar year; no cross-run caching
NFR22: Compound findings suppressed when either component has confidence "low"

### Additional Requirements

Architecture-derived requirements that impact implementation:

- AR1: Package scaffolding — `packages/gyre/` with own `package.json`, npm workspaces in root, `bin: { gyre: './gyre.js' }`
- AR2: Dual install path — `convoke-install-gyre` (Convoke users) + `npm install -g gyre` (standalone)
- AR3: No starter template — scaffold from existing Convoke patterns (hand-rolled CLI, node:test, Chalk, js-yaml, fs-extra)
- AR4: Commander v14.0.3 for CLI framework — subcommand routing (`gyre analyze`, `gyre init`, `gyre diff`, `gyre setup`)
- AR5: Tiered context objects (detectionCtx / analysisCtx) — shape enforces privacy boundary and testability
- AR6: PromptPayload `{ system, user }` interface — all prompt builders return this shape
- AR7: Async generator agent pattern — agents yield findings, orchestrator iterates
- AR8: Two-method LLM provider interface (`generate()` + `stream()`) with stream timeout (30s per-chunk)
- AR9: Error class hierarchy (GyreError → DetectionError/ProviderError/AnalysisError/StreamTimeoutError)
- AR10: Exit codes 0-4 mapping to failure modes; JSON status field for granular reporting
- AR11: Finding shape — 8 required fields, `---FINDING---` delimiter parsing contract
- AR12: 8 enforcement rules with contract tests, ESLint, unit tests, integration tests
- AR13: Checkpoint 1 (Model Generation Demo) → Checkpoint 2 (Full Analysis Pipeline) implementation sequence
- AR14: Privacy-accuracy decision tree — pre-pilot validation after model gen, before agents (Tier 1 only vs Tier 1+2 delta)
- AR15: ESLint import boundary rules — agents never import providers, providers never import pipeline
- AR16: Chalk restricted to `output/` directory via ESLint rule
- AR17: File size guard (1MB cap) before YAML parsing
- AR18: Atomic writes (write-to-temp + rename) for YAML artifacts
- AR19: `types.js` for cross-module JSDoc typedefs only; module-private types stay local

### UX Design Requirements

N/A — Gyre is a CLI tool with no UI design document.

### FR Coverage Map

| FR | Epic | Brief Description |
|----|------|-------------------|
| FR1 | E1 | Detect primary tech stack from file system artifacts |
| FR1b | E1 | Detect multiple stacks, surface secondary as warning |
| FR2 | E1 | Detect container orchestration platform |
| FR3 | E1 | Detect CI/CD platform |
| FR4 | E1 | Detect observability tooling |
| FR5 | E1 | Detect cloud provider |
| FR6 | E1 | Present guard questions to confirm classification |
| FR7 | E1 | CLI flag override for guard answers |
| FR8 | E1 | Re-classify stack from corrected guard answers |
| FR42 | E1 | Create `.gyre/` directory structure on first run |
| FR44 | E1 | Install via npm |
| FR45 | E1 | Configure AI provider via env var or config |
| FR46 | E1 | First-run setup with one action |
| FR47 | E1 | Fail fast with actionable error on provider failure |
| FR48 | E1 | Auto-select most capable model |
| FR51 | E1 | Detect monorepo service boundaries |
| FR52 | E2 | Limited-coverage continuation/abort option |
| FR9 | E2 | Generate capabilities manifest via LLM |
| FR10 | E2 | Incorporate industry standards into model |
| FR11 | E2 | Incorporate web search results into model |
| FR12 | E2 | Adjust model based on guard classification |
| FR13 | E2 | Capability plain-language descriptions |
| FR14 | E2 | Generate ≥20 capabilities for supported archetypes |
| FR15 | E2 | Surface limited-coverage warning (<20 capabilities) |
| FR31 | E2 | Display model summary (capability count, detected stack) |
| FR43-stub | E2 | Prompt user to review manifest (stub: "later" only) |
| FR16 | E3 | Observability Readiness agent |
| FR17 | E3 | Deployment Readiness agent |
| FR18 | E3 | Identify capabilities with no evidence of implementation |
| FR19 | E3 | Tag finding source (static vs contextual) |
| FR20 | E3 | Tag finding confidence (high/medium/low) |
| FR21 | E3 | Classify finding severity (blocker/recommended/nice-to-have) |
| FR22a | E3 | Identify cross-domain compound gaps |
| FR22b | E3 | Express compounds as text reasoning chain |
| FR23 | E3 | Structured capability evidence report |
| FR32 | E3 | Stream findings as produced |
| FR33 | E3 | Severity-first leadership summary |
| FR34 | E3 | Novelty ratio display |
| FR35 | E3 | Compound findings with indented reasoning |
| FR36 | E3 | JSON output format |
| FR37 | E3 | Mode indicator (stub: "crisis" until E5) |
| FR49 | E3 | Paste-friendly output |
| FR50 | E3 | Severity rationale per finding |
| FR54 | E3 | JSON status field |
| FR56 | E3 | Save manifest on partial failure, inform of retry (BLOCKING) |
| FR57 | E3 | Complete-or-nothing persistence with streaming caveat (BLOCKING) |
| FR24 | E4 | Review manifest via $EDITOR or interactive walkthrough |
| FR25 | E4 | Amend manifest (add/remove/modify) |
| FR26 | E4 | Amendment persistence on subsequent runs |
| FR27 | E4 | Model subtraction (exclude removed capabilities) |
| FR28 | E4 | Feedback prompt after analysis |
| FR29 | E4 | Persist feedback to `.gyre/feedback.yaml` |
| FR30 | E4 | Explain feedback.yaml commit for team improvement |
| FR43-full | E4 | Full manifest review handler (y/n/later) |
| FR53 | E4 | Display existing feedback entries at analysis start |
| FR55 | E4 | Persist "review deferred" flag and reminder |
| FR38 | E5 | Auto-detect crisis/anticipation mode |
| FR39 | E5 | Persist findings history across runs |
| FR40 | E5 | Compute delta (new, carried-forward, resolved) |
| FR41 | E5 | Display delta-tagged findings |

### NFR Coverage Map

| NFR | Epic | Enforcement |
|-----|------|-------------|
| NFR1 | E2 (intermediate), E3 (full) | Performance acceptance criteria |
| NFR2 | E3 | Total time AC |
| NFR3 | E1 | Guard response time AC |
| NFR4 | E5 | Re-run time AC |
| NFR5 | E1 | Startup time AC |
| NFR6 | E1 | API key storage AC |
| NFR7 | E2 | Privacy boundary contract test |
| NFR8 | E2 | LLM input boundary contract test |
| NFR9 | E2, E4 | Artifact safety AC |
| NFR10 | E2 | Model caching AC |
| NFR11 | E1 | Fail-fast timeout AC |
| NFR12 | E1 | File system safety contract test |
| NFR13 | E1 | Lock file AC |
| NFR14 | E3 | Provider abstraction AC |
| NFR15 | E1 | Node ≥20 in package.json engines |
| NFR16 | E1 | OS compatibility CI matrix |
| NFR17 | E3 | JSON schema versioning AC |
| NFR18 | E5 | Phase independence AC |
| NFR19 | E2 | Model accuracy gate (≥70%, spike story) |
| NFR20 | E1 | Guard coverage AC |
| NFR21 | E2 | Web search freshness AC |
| NFR22 | E3 | Compound confidence suppression AC |

### AR Coverage Map

| AR | Epic | Description |
|----|------|-------------|
| AR1 | E1 | Package scaffolding (packages/gyre/, package.json, bin entry) |
| AR2 | E1 | Dual install path (convoke-install-gyre + npm global) |
| AR3 | E1 | No starter template — scaffold from Convoke patterns |
| AR4 | E1 | Commander v14.0.3 CLI framework |
| AR5 | E1 | Tiered context objects (detectionCtx) |
| AR6 | E2 | PromptPayload { system, user } interface |
| AR7 | E3 | Async generator agent pattern |
| AR8 | E2 (generate), E3 (stream) | Two-method LLM provider interface |
| AR9 | E1 | Error class hierarchy |
| AR10 | E1 | Exit codes 0-4 mapping |
| AR11 | E3 | Finding shape (8 fields, delimiter parsing) |
| AR12 | E1 (rules 7,8), E2 (rules 1,4), E3 (rules 2,3,5,6) | Enforcement rules via contract/lint/unit tests |
| AR13 | E1+E2 (CP1), E3 (CP2) | Checkpoint implementation sequence |
| AR14 | E2 | Privacy-accuracy decision tree |
| AR15 | E3 | ESLint import boundary rules |
| AR16 | E3 | Chalk restricted to output/ |
| AR17 | E2 | File size guard (1MB) before YAML parsing |
| AR18 | E2 | Atomic writes for YAML artifacts |
| AR19 | E3 | types.js cross-module typedefs only |

### Enforcement Rule Distribution

| Rule | Epic | Test Type |
|------|------|-----------|
| Rule 1: Privacy boundary | E2 | Contract test |
| Rule 2: Context immutability | E3 | Contract test |
| Rule 3: No cross-layer imports | E3 | ESLint |
| Rule 4: PromptPayload shape | E2 | Contract test |
| Rule 5: Exit code mapping | E3 | Unit test |
| Rule 6: Finding shape | E3 | Unit test |
| Rule 7: File system boundary | E1 | Contract test |
| Rule 8: Config precedence | E1 | Integration test |

## Epic List

### Epic 1: Install, Configure & Stack Discovery
User can install Gyre, configure their AI provider, point it at their project (including monorepos), and see their technology stack correctly identified with guard question confirmation. Includes package scaffolding, CLI framework, error handling foundation, and `.gyre/` directory creation.

**FRs covered:** FR1, FR1b, FR2, FR3, FR4, FR5, FR6, FR7, FR8, FR42, FR44, FR45, FR46, FR47, FR48, FR51 (16 FRs)
**ARs:** AR1-AR5, AR9-AR10, AR12 (rules 7, 8)
**NFRs enforced:** NFR3, NFR5, NFR6, NFR11, NFR12, NFR13, NFR15, NFR16, NFR20
**Dedicated enforcement stories:** Contract test for fs-boundary (rule 7), integration test for config precedence (rule 8)
**Risk:** Medium — mostly deterministic file system and CLI code

### Epic 2: Contextual Model Generation
User can generate a capabilities model unique to their detected stack — incorporating industry standards, web search, and guard answers — see a summary of what was generated, and be prompted to review later. **Includes accuracy validation spike (NFR19 ≥70%) as the first story — this is the go/no-go gate for the entire product.**

**FRs covered:** FR9, FR10, FR11, FR12, FR13, FR14, FR15, FR31, FR43-stub, FR52 (10 FRs)
**ARs:** AR6, AR8 (generate), AR12 (rules 1, 4), AR13 (CP1), AR14, AR17, AR18
**NFRs enforced:** NFR1 (intermediate), NFR7, NFR8, NFR9, NFR10, NFR19, NFR20, NFR21
**Dedicated enforcement stories:** Contract test for privacy boundary (rule 1), contract test for PromptPayload shape (rule 4)
**Risk:** HIGH — prompt engineering iteration, accuracy gate, privacy-accuracy validation

### Epic 3: Absence Detection & Streaming Output
Two domain agents analyze the project against the model, streaming findings with severity, confidence, and source tagging. Cross-domain correlation surfaces compound gaps. Output available in CLI (streaming, paste-friendly) and JSON formats. Graceful degradation on partial failure. **FR56-FR57 are blocking stories — epic not complete until resilience passes.** Three parallelizable workstreams: agents, output/renderer, resilience/orchestrator.

**FRs covered:** FR16, FR17, FR18, FR19, FR20, FR21, FR22a, FR22b, FR23, FR32, FR33, FR34, FR35, FR36, FR37, FR49, FR50, FR54, FR56, FR57 (20 FRs)
**ARs:** AR7, AR8 (stream), AR11, AR12 (rules 2, 3, 5, 6), AR15, AR16, AR19
**NFRs enforced:** NFR1 (full), NFR2, NFR4, NFR14, NFR17, NFR22
**Dedicated enforcement stories:** Contract test for context immutability (rule 2), ESLint import boundaries (rule 3), unit test for exit codes (rule 5), unit test for finding shape (rule 6)
**Risk:** Medium-high — LLM-dependent agents, streaming complexity

### Epic 4: Review, Amendment & Feedback
User can review and customize the capabilities model via editor or interactive walkthrough, provide feedback on analysis accuracy, and Gyre respects amendments on future runs. Builds team knowledge through committable artifacts.

**FRs covered:** FR24, FR25, FR26, FR27, FR28, FR29, FR30, FR43-full, FR53, FR55 (10 FRs)
**NFRs enforced:** NFR9 (artifact safety on amended files)
**Risk:** Low — well-understood YAML editing and persistence patterns

### Epic 5: Run Lifecycle & Delta Analysis
User can re-run Gyre and see what changed — new findings, carried forward, and resolved gaps — tracking progress over time. Mode auto-detection (crisis/anticipation) replaces the stub from Epic 3.

**FRs covered:** FR38, FR39, FR40, FR41 (4 FRs)
**NFRs enforced:** NFR4 (re-run ≤50% time), NFR18 (phase independence)
**Risk:** Low — deterministic computation on YAML data

---

## Epic 1: Install, Configure & Stack Discovery

**Goal:** A user can install Gyre, configure their LLM provider, run stack detection on their project, confirm intent via guard questions, and have a validated StackProfile ready for model generation — including monorepo boundaries.

### Story 1.1: Package Scaffolding & CLI Entry Point

As a developer,
I want to install Gyre globally via `npm install -g gyre` and run `gyre` from my terminal,
So that I can begin using the tool with no additional setup beyond installation.

**Requirements:** FR44, AR1, AR2, AR3, AR4

**Acceptance Criteria:**

**Given** the package is published to npm
**When** a user runs `npm install -g gyre`
**Then** a `gyre` binary is available on their PATH
**And** running `gyre --version` prints the current version from package.json
**And** running `gyre --help` prints usage information with all top-level commands
**And** running `gyre` with no arguments prints help text and exits with code 0
**And** the CLI uses Commander v14 with Node.js ≥20 as the minimum engine
**And** the entry point follows the `src/cli/index.js` structure from the architecture

### Story 1.2: Configuration Resolution & Setup Wizard

As a developer using Gyre for the first time,
I want to run `gyre init` and be guided through provider configuration,
So that my API key and provider preferences are saved and I don't have to configure them again.

**Requirements:** FR45, FR46, AR5, AR9, AR10

**Acceptance Criteria:**

**Given** no `.gyre/config.yaml` exists in the project
**When** the user runs `gyre init`
**Then** an interactive wizard prompts for provider selection (OpenAI, Anthropic, or Ollama)
**And** the wizard prompts for the API key (masked input)
**And** a `.gyre/config.yaml` is created with the selected provider and key reference
**And** the wizard validates the API key by making a lightweight test call to the provider
**And** if validation fails, the user is prompted to re-enter or skip validation

**Given** a `.gyre/config.yaml` already exists
**When** the user runs `gyre init`
**Then** the wizard shows current settings and asks whether to overwrite

**Given** environment variable `GYRE_PROVIDER` or `GYRE_API_KEY` is set
**When** configuration is resolved
**Then** env vars take precedence over config file values (env > config > defaults)

### Story 1.3: Provider Abstraction & Fail-Fast Error Handling

As a developer running Gyre,
I want the system to validate my provider configuration before starting any analysis,
So that I get a clear error message immediately if my API key is invalid or the provider is unreachable.

**Requirements:** FR47, FR48, AR8, AR9, AR10

**Acceptance Criteria:**

**Given** a configured provider in `.gyre/config.yaml`
**When** the pipeline starts
**Then** the provider adapter is resolved via `createProvider(config)` factory
**And** a fail-fast validation call is made before any pipeline work begins
**And** if the provider is unreachable, the process exits with a descriptive error and exit code 2
**And** if the API key is invalid, the process exits with a specific "invalid credentials" message

**Given** the provider abstraction
**When** any module needs LLM access
**Then** it receives the provider via the `analysisCtx` context object (phases 3-5 only)
**And** the provider exposes exactly two methods: `generate()` and `stream()`
**And** the provider implements a 30-second per-chunk timeout on streaming responses

### Story 1.4: `.gyre/` Directory & Lock File Management

As a developer running Gyre,
I want all Gyre artifacts stored in a `.gyre/` directory with a lock file preventing concurrent runs,
So that my project stays organized and parallel runs cannot corrupt state.

**Requirements:** FR42, NFR12, NFR13

**Acceptance Criteria:**

**Given** the user runs any Gyre command that writes artifacts
**When** the command starts
**Then** it creates `.gyre/` if it doesn't exist
**And** it acquires a lock file at `.gyre/.lock` before proceeding
**And** if a lock file already exists and the owning process is still running, the command exits with a clear "another Gyre process is running" message
**And** if the lock file is stale (owning process no longer exists), it is reclaimed

**Given** a Gyre command completes (success or failure)
**When** the process exits
**Then** the lock file is released
**And** `.gyre/` is added to `.gitignore` suggestions on first run (if not already present)

### Story 1.5: Stack Detection Engine

As a developer running `gyre analyze`,
I want Gyre to automatically detect my project's technology stack from file system artifacts,
So that I don't have to manually specify my stack and the detection is accurate.

**Requirements:** FR1, FR1b, FR2, FR3, FR4, FR5

**Acceptance Criteria:**

**Given** a project directory with standard file system artifacts
**When** the detection phase runs
**Then** the system identifies the primary language/framework from package manifests and config files
**And** detects container orchestration platform (Kubernetes, ECS, Docker Compose) from project files
**And** detects CI/CD platform (GitHub Actions, GitLab CI, Jenkins) from pipeline config files
**And** detects observability tooling (Datadog, Prometheus, OpenTelemetry) from config and dependency files
**And** detects cloud provider (AWS, GCP, Azure) from IaC templates and config files

**Given** a project with multiple technology stacks
**When** detection completes
**Then** the primary stack is selected for model generation
**And** secondary stacks are surfaced as warnings to the user

**Given** detection runs
**When** it accesses the filesystem
**Then** it operates within a `detectionCtx` (no LLM provider access)
**And** it produces a Tier 1 (coarse) StackProfile containing only category-level classifications
**And** no project file contents are included in the Tier 1 output — only labels and counts

### Story 1.6: Guard Questions & CLI Override

As a developer,
I want Gyre to ask me ≤3 confirmation questions about my stack before proceeding,
So that I can correct any misdetection and the model is built on accurate assumptions.

**Requirements:** FR6, FR7, FR8, NFR3, NFR20

**Acceptance Criteria:**

**Given** stack detection has completed and produced a Tier 1 StackProfile
**When** the guard question phase begins
**Then** the system presents ≤3 architecture intent questions derived from the detection results
**And** questions are displayed interactively in the terminal

**Given** guard questions are presented
**When** the user answers them
**Then** answers are merged into the StackProfile, correcting any misdetection
**And** the total interaction takes ≤30 seconds of user time (NFR3)

**Given** the user wants to skip interactive questions
**When** they provide `--guard deployment=containerized,protocol=grpc` flags
**Then** the CLI flags override the interactive flow and answers are applied directly
**And** no interactive prompts are shown for the overridden questions

**Given** guard questions complete
**When** answers have been applied
**Then** the Tier 2 (detailed) StackProfile is generated locally (no LLM call)
**And** Tier 2 stays local and is never sent to the LLM provider

### Story 1.7: Monorepo Service Boundary Detection

As a developer working in a monorepo,
I want Gyre to detect service boundaries and analyze each service's stack independently,
So that the analysis covers my entire project accurately rather than treating it as a single stack.

**Requirements:** FR51

**Acceptance Criteria:**

**Given** a monorepo project with multiple service directories
**When** stack detection runs
**Then** the system identifies service boundaries (e.g., separate `package.json`, `go.mod`, or `Dockerfile` per directory)
**And** each detected service gets its own StackProfile entry
**And** service boundaries are surfaced in the detection output for user confirmation

**Given** a single-service project
**When** detection runs
**Then** monorepo detection completes with a single boundary (no user disruption)

### Story 1.8: Enforcement Rules — FS Boundary & Config Precedence

As a maintainer of the Gyre codebase,
I want contract tests enforcing that detection-phase code never imports the LLM provider and that config resolution follows the precedence chain,
So that the privacy boundary and configuration correctness are verified on every CI run.

**Requirements:** AR12 (rules 7, 8)

**Acceptance Criteria:**

**Given** the detection phase modules (`src/detection/`)
**When** CI runs
**Then** a contract test verifies that no file in `src/detection/` imports from `src/providers/` or `analysisCtx`
**And** the test fails if any such import is introduced

**Given** the configuration resolution module
**When** CI runs
**Then** a unit test verifies precedence: env var > CLI flag > config file > default
**And** the test covers all four levels with explicit assertions for each override scenario

**Given** any new module added to `src/detection/`
**When** the contract test suite runs
**Then** the new module is automatically included in the boundary check (glob-based, not hardcoded file list)

---

## Epic 2: Contextual Model Generation

**Goal:** Generate a capabilities manifest unique to the detected stack — incorporating industry standards, web search, and guard answers — with a validated accuracy gate and privacy boundary enforcement.

### Story 2.1a: Prompt Builder & LLM Generate Call

As a developer running `gyre analyze`,
I want Gyre to construct a prompt from my stack profile and generate capabilities via LLM,
So that I get a structured model of what capabilities my production stack should have.

**Requirements:** FR9, FR12, FR13, FR14, AR6, AR8 (generate), NFR10

**Acceptance Criteria:**

**Given** a validated Tier 1 StackProfile and guard answers from Epic 1
**When** model generation runs
**Then** a prompt builder constructs a `PromptPayload { system, user }` from the StackProfile and guard answers
**And** the prompt is sent to `provider.generate()` with `temperature=0` and `seed` for deterministic output
**And** the LLM response is parsed into a structured capabilities manifest

**Given** the parsed manifest
**When** capabilities are extracted
**Then** each capability includes a plain-language description (1-3 sentences) (FR13)
**And** supported stack archetypes produce ≥20 capabilities (FR14)

**Given** guard answers corrected a misdetection (FR12)
**When** model generation runs
**Then** the corrected classification is reflected in the prompt — not the original detection

### Story 2.1b: Manifest Serialization & Artifact Safety

As a developer running `gyre analyze`,
I want the generated capabilities manifest written safely to disk with integrity guarantees,
So that partial writes cannot corrupt my manifest and re-reads are validated.

**Requirements:** AR17, AR18

**Acceptance Criteria:**

**Given** a parsed capabilities object from Story 2.1a
**When** serialization runs
**Then** the object is serialized to valid YAML conforming to the manifest schema
**And** the serialized YAML is written to `.gyre/capabilities.yaml` via a reusable `writeAtomicYaml(filePath, data)` utility
**And** `writeAtomicYaml` writes to `{filePath}.tmp` then renames to `{filePath}` (AR18)
**And** this utility is the single atomic write implementation for all `.gyre/` YAML operations (reused by Stories 4.2, 4.4)
**And** a 1MB file size guard is enforced before any YAML re-parse (AR17)

**Given** the atomic write fails (e.g., disk full)
**When** the error is caught
**Then** the `.tmp` file is cleaned up and the previous manifest (if any) is not corrupted
**And** a clear error message is displayed with the failure reason

### Story 2.2: Privacy Boundary & PromptPayload Contract Tests

As a maintainer of the Gyre codebase,
I want contract tests enforcing that LLM-bound data contains only Tier 1 classifications and that all prompt builders return the correct shape,
So that the privacy boundary is machine-verified on every CI run before any prompt iteration begins.

**Requirements:** AR12 (rules 1, 4), NFR7, NFR8, NFR9

**Acceptance Criteria:**

**Given** the Tier 1 StackProfile shape
**When** the privacy boundary contract test runs
**Then** it verifies that Tier 1 contains ONLY category-level classifications (e.g., "Go/Kubernetes/AWS")
**And** it fails if any Tier 1 field contains: file contents, file paths, version numbers, dependency counts, or secrets

**Given** any prompt builder module in `src/model/`
**When** the PromptPayload shape contract test runs
**Then** it verifies each builder returns exactly `{ system, user }` — no additional fields
**And** it verifies the `system` and `user` fields are non-empty strings

**Given** the LLM input boundary (NFR8)
**When** the contract test inspects what the provider receives
**Then** it confirms the payload contains: stack classification, guard answers, capability evidence, web search results
**And** it confirms the payload does NOT contain: file contents, file paths, directory structures, or secrets

**Given** the generated capabilities manifest artifact (NFR9)
**When** the artifact safety contract test runs
**Then** it verifies the output YAML contains no source code snippets, file contents, or secrets

### Story 2.3: Model Accuracy Validation Spike

As the product owner,
I want a pre-pilot validation confirming ≥70% model accuracy across ≥3 stack archetypes,
So that we have a documented go/no-go gate before investing in analysis agents.

**Requirements:** NFR19, AR14, AR13 (CP1)

**Acceptance Criteria:**

**Given** the model generation pipeline is functional (Story 2.1)
**When** the accuracy spike runs
**Then** it tests against ≥3 distinct stack archetypes (e.g., Node.js/K8s/AWS, Go/ECS/GCP, Python/Docker Compose/Azure)
**And** for each archetype, a human reviewer scores which generated capabilities are relevant to the stack
**And** the accuracy metric is: (relevant capabilities / total generated) ≥ 70%

**Given** the privacy-accuracy decision tree (AR14)
**When** the spike runs
**Then** it measures accuracy under Tier 1 only
**And** if Tier 1 accuracy ≥70%, the privacy boundary is validated — ship with Tier 1
**And** if accuracy is 55-70%, evaluate Tier 1.5 (add technology categories without versions/counts)
**And** if accuracy <55%, escalate to product decision (privacy vs accuracy trade-off)
**And** the decision and evidence are documented as a checkpoint artifact

**Given** this is Checkpoint 1 (AR13)
**When** the spike completes
**Then** the team has a go/no-go decision before proceeding to Epic 3

**Given** the spike deliverables
**When** the spike is complete
**Then** it produces: (a) a test fixture directory with ≥3 archetype project snapshots, each including a `.gyre-test-config` with pre-set guard answers and provider mock configuration for non-interactive automation, (b) a scoring script that runs the pipeline against each fixture and collects capability lists, (c) a decision document recording accuracy results, tier assessment, and go/no-go recommendation

### Story 2.4: Industry Standards Integration

As a developer,
I want Gyre's model to incorporate established standards like DORA, OpenTelemetry, and Google PRR,
So that the generated capabilities reflect industry consensus — not just the LLM's training data.

**Requirements:** FR10

**Acceptance Criteria:**

**Given** model generation runs for any stack archetype
**When** the prompt builder constructs the PromptPayload
**Then** the system prompt references applicable industry standards (DORA metrics, OpenTelemetry signals, Google PRR checklist)
**And** the standards referenced are appropriate to the detected stack (e.g., DORA for CI/CD, OTel for observability)

**Given** the generated capabilities manifest
**When** reviewed
**Then** capabilities derived from standards are distinguishable in the model (tagged or grouped)
**And** the model does not simply reproduce a standards checklist — it is contextualized to the specific stack

### Story 2.5: Web Search Integration

As a developer,
I want Gyre to incorporate current best practices via web search into my model,
So that the capabilities reflect the latest ecosystem recommendations — not just static knowledge.

**Requirements:** FR11, NFR21

**Acceptance Criteria:**

**Given** model generation runs
**When** the prompt builder constructs the PromptPayload
**Then** web search results for the detected stack's best practices are included in the user prompt
**And** search results are from the current calendar year (NFR21)

**Given** web search results are obtained
**When** they are incorporated into the prompt
**Then** they are passed as structured context within the PromptPayload `user` field
**And** no cross-run caching of web search results occurs (NFR21 — each run gets fresh results)

**Given** web search as an integration point
**When** the web search adapter is invoked
**Then** it is a separate adapter in the provider layer — not LLM tool-use
**And** it has its own configuration (API key, endpoint) independent of the LLM provider
**And** the adapter returns structured results that the prompt builder incorporates into the PromptPayload

**Given** the web search provider is unavailable
**When** model generation runs
**Then** generation proceeds without web search results (graceful degradation)
**And** a warning is logged indicating web search was skipped

### Story 2.6: Limited Coverage Warning & Abort Option

As a developer,
I want to be warned if Gyre generated fewer than 20 capabilities and given the option to continue or abort,
So that I'm aware of potential model quality issues before the analysis phase begins.

**Requirements:** FR15, FR52

**Acceptance Criteria:**

**Given** model generation completes
**When** fewer than 20 capabilities are in the manifest
**Then** a warning is displayed: "Only N capabilities generated (expected ≥20). This may indicate limited coverage for your stack archetype."
**And** the user is prompted: "Continue with analysis? (y/n)"

**Given** the limited-coverage warning is shown
**When** the user selects "y" (continue)
**Then** analysis proceeds normally with the generated manifest

**Given** the limited-coverage warning is shown
**When** the user selects "n" (abort)
**Then** the manifest is still saved to `.gyre/capabilities.yaml` (work is not lost)
**And** the process exits with code 0 and a message explaining how to retry or review

**Given** ≥20 capabilities are generated
**When** model generation completes
**Then** no warning is shown and the pipeline continues automatically

### Story 2.7: Model Summary & Deferred Review Stub

As a developer,
I want to see a summary of what Gyre generated and be prompted about reviewing later,
So that I have visibility into the model before analysis begins without being forced to review immediately.

**Requirements:** FR31, FR43-stub

**Acceptance Criteria:**

**Given** model generation completes successfully
**When** the summary is displayed
**Then** it shows: capability count, detected stack classification, and guard answers applied (FR31)
**And** the summary is shown before any analysis output begins

**Given** the model summary is displayed
**When** the review prompt appears
**Then** it asks: "Review capabilities manifest? (y/n/later)"
**And** only the "later" option is functional in this epic (stub implementation)
**And** selecting "y" or "n" also proceeds to analysis (with a note that full review is available via `gyre review`)
**And** the "later" selection is persisted as a deferred review flag for Epic 4 to consume

---

## Epic 3: Absence Detection & Streaming Output

**Goal:** Two domain agents analyze the project against the capabilities model, streaming findings with severity/confidence/source tagging. Cross-domain correlation surfaces compound gaps. Output in CLI (streaming, paste-friendly) and JSON formats. Graceful degradation on partial failure.

### Story 3.1: Finding Shape & Async Generator Agent Pattern

As a developer building Gyre's analysis pipeline,
I want a well-defined finding data shape and async generator agent pattern,
So that all agents produce uniform output and the orchestrator can iterate findings as they stream.

**Requirements:** AR11, AR7, AR8 (stream)

**Acceptance Criteria:**

**Given** an agent producing findings
**When** the agent runs
**Then** each finding contains exactly 8 required fields: capability ID, domain, severity (blocker/recommended/nice-to-have), confidence (high/medium/low), source (static/contextual), description, rationale, and evidence summary
**And** findings are delimited by `---FINDING---` markers in the LLM response

**Given** the finding delimiter parser (`agents/finding-parser.js`)
**When** it processes an LLM streaming response
**Then** it extracts individual findings as they arrive, yielding each as a parsed object
**And** malformed findings (missing required fields) are logged and skipped with a warning — not fatal

**Given** the async generator agent pattern
**When** an agent runs
**Then** it yields findings as `AsyncIterable<Finding>` — the orchestrator iterates without waiting for completion
**And** the provider's `stream()` method enforces a 30-second per-chunk timeout (AR8)
**And** if timeout fires, a `StreamTimeoutError` is thrown

### Story 3.1b: Capability Evidence Report from Static Analysis

As a developer running `gyre analyze`,
I want static analysis to produce a structured evidence report mapping capabilities to project artifacts,
So that agents have a factual baseline of what exists before identifying gaps.

**Requirements:** FR23

**Acceptance Criteria:**

**Given** a capabilities manifest and the project's Tier 2 StackProfile
**When** the static analysis evidence phase runs
**Then** it produces a capability evidence report: an array of `{ capabilityId, evidenceFound: boolean, evidenceType: 'file_match' | 'config_entry' | 'dependency' | null, detectionMethod: string, summary: string }` — no file contents
**And** the report covers all capabilities in the manifest — marking each as "evidence found" or "no evidence"
**And** the evidence report shape is defined as a JSDoc typedef in `types.js`

**Given** the evidence phase's execution context
**When** it runs
**Then** it is implemented in `src/detection/evidence.js` — part of the detection layer, covered by Story 1.8's FS boundary contract test
**And** it operates within a `detectionCtx` (filesystem access, no LLM provider)
**And** the evidence report is passed to agents via `analysisCtx` — agents do not read the filesystem directly

**Given** the evidence report
**When** consumed by agents
**Then** agents use it to distinguish static findings (evidence-based) from contextual findings (LLM-inferred)

### Story 3.2: Observability Readiness Agent

As a developer running `gyre analyze`,
I want an Observability Readiness agent that identifies gaps in my monitoring, logging, and alerting setup,
So that I know what observability capabilities are missing from my production stack.

**Requirements:** FR16, FR18, FR19, FR20, FR21, FR50

**Acceptance Criteria:**

**Given** a capabilities manifest and the capability evidence report from Story 3.1b
**When** the Observability agent runs
**Then** it identifies capabilities from the manifest for which no evidence was found (FR18)
**And** each finding is tagged with its source: static analysis vs contextual model (FR19)
**And** each finding is tagged with confidence: high/medium/low (FR20)
**And** each finding is classified by severity: blocker/recommended/nice-to-have (FR21)
**And** each finding includes a brief rationale for its severity classification (FR50)

**Given** the agent's execution context
**When** it runs
**Then** it receives an `analysisCtx` (has LLM provider, no filesystem access)
**And** the evidence report is available in the context — the agent does not read the filesystem directly

**Given** the agent yields findings
**When** the orchestrator iterates
**Then** findings stream as `AsyncIterable<Finding>` following the pattern from Story 3.1

### Story 3.3: Deployment Readiness Agent

As a developer running `gyre analyze`,
I want a Deployment Readiness agent that identifies gaps in my CI/CD, containerization, and infrastructure setup,
So that I know what deployment capabilities are missing from my production stack.

**Requirements:** FR17

**Acceptance Criteria:**

**Given** a capabilities manifest and the project's Tier 2 StackProfile
**When** the Deployment agent runs
**Then** it analyzes deployment-related capabilities (CI/CD, container orchestration, IaC, rollback)
**And** it produces findings using the same shape and tagging as the Observability agent (same 8 fields)
**And** it is a self-contained module with its own LLM prompt — independent of the Observability agent

**Given** both agents have run
**When** findings from both are collected
**Then** they are distinguishable by the `domain` field (observability vs deployment)
**And** the system supports adding new domain agents in v2 by adding a module — no pipeline modification required

### Story 3.4: Cross-Domain Correlation

As a developer,
I want Gyre to surface compound gaps that span both observability and deployment domains,
So that I can see interaction effects like "no rollback telemetry + no deployment markers = blind rollbacks."

**Requirements:** FR22a, FR22b, NFR22

**Acceptance Criteria:**

**Given** both agents have completed successfully with confirmed findings
**When** the correlator runs
**Then** it uses LLM reasoning to discover compound patterns across domains (FR22a)
**And** each compound finding references exactly 2 existing findings from different domains
**And** compound findings express relationships as a text-based reasoning chain (FR22b)

**Given** the confidence threshold (NFR22)
**When** compound findings are evaluated
**Then** compounds are suppressed when either component finding has confidence "low"

**Given** one or both agents failed
**When** the correlation phase would run
**Then** correlation is skipped entirely (graceful degradation — omitted, not partial)
**And** a warning is displayed: "Cross-domain correlation skipped due to agent failure"

### Story 3.5: Streaming CLI Renderer

As a developer running `gyre analyze`,
I want to see findings stream to my terminal as they're produced, with a severity-first summary at the end,
So that I get immediate feedback and a leadership-ready summary without waiting for the full analysis.

**Requirements:** FR32, FR33, FR34, FR35, FR37, FR49, AR16

**Acceptance Criteria:**

**Given** the analysis pipeline is running
**When** agents yield findings
**Then** each finding is displayed to CLI as soon as produced — not batched (FR32)
**And** findings stream with `provisional` status; status upgrades to `confirmed` on agent completion

**Given** analysis completes
**When** the summary is rendered
**Then** a severity-first leadership summary shows: blocker count, recommended count, nice-to-have count (FR33)
**And** the novelty ratio is displayed: "X of Y findings are contextual" (FR34)
**And** compound findings are displayed with visually distinct indented reasoning chains (FR35)
**And** a mode indicator is displayed at the start of output — hardcoded to "crisis" until Epic 5 implements auto-detection (FR37)

**Given** any CLI output
**When** the user copies text
**Then** output is paste-friendly — no ANSI escape sequences in copied text (FR49)
**And** Chalk usage is restricted to `src/output/` directory only (AR16)

### Story 3.6: JSON Output & Schema Versioning

As a developer integrating Gyre with other tools,
I want to get analysis results in machine-readable JSON format with a versioned schema,
So that I can programmatically consume findings and build automation.

**Requirements:** FR36, FR54, NFR17

**Acceptance Criteria:**

**Given** the user runs `gyre analyze --json`
**When** analysis completes
**Then** results are output as valid JSON to stdout
**And** the JSON includes a `status` field matching CLI exit code semantics (FR54)
**And** the JSON schema includes a `schemaVersion` field

**Given** a breaking change to the JSON schema
**When** the change is introduced
**Then** the schema version is bumped
**And** the previous schema version requires `--unstable` flag to access (NFR17)

**Given** analysis fails partway through
**When** JSON output is produced
**Then** the `status` field reflects the failure mode
**And** partial findings (if any) are included with their status (provisional/unverified)

### Story 3.7: Pipeline Resilience & Graceful Degradation

As a developer running `gyre analyze`,
I want the pipeline to handle partial failures gracefully — saving what it can and telling me exactly what went wrong,
So that I don't lose work and can retry efficiently.

**Requirements:** FR56, FR57, NFR1, NFR2

**Acceptance Criteria:**

**Given** model generation succeeds but analysis fails (failure mode 2)
**When** the pipeline handles the failure
**Then** the capabilities manifest is saved to `.gyre/capabilities.yaml` (FR56)
**And** the user is informed they can retry analysis without regenerating the model
**And** on retry, the cached manifest is loaded — no LLM call for model generation

**Given** one agent fails but the other succeeds (failure mode 2)
**When** the pipeline handles the failure
**Then** the successful agent's findings are displayed with `confirmed` status
**And** the failed agent's partial findings (if any) are marked `unverified`
**And** correlation is skipped with a warning
**And** the exit code reflects partial failure

**Given** the LLM returns garbage (failure mode 4)
**When** the sanity validator detects anomalies (>80% capabilities flagged, uniform confidence, phantom capabilities)
**Then** an `analysis_suspect` warning banner is displayed
**And** findings are still shown but flagged as suspect

**Given** findings persistence (FR57)
**When** analysis completes or fails
**Then** findings are written atomically — complete-or-nothing for `.gyre/findings.yaml`
**And** streamed CLI output may show partial findings, but the persisted file is never partial
**And** if write fails, a clear error explains what happened

**Given** performance targets
**When** the full pipeline runs on a typical project (≤500 files, ≤2 domains)
**Then** time-to-first-finding is <2 minutes (NFR1)
**And** total analysis time is <10 minutes (NFR2)

### Story 3.8: Enforcement Rules — Context Immutability, Import Boundaries, Exit Codes, Finding Shape

As a maintainer of the Gyre codebase,
I want automated enforcement of context immutability, module import boundaries, exit code correctness, and finding shape compliance,
So that architectural invariants are verified on every CI run.

**Requirements:** AR12 (rules 2, 3, 5, 6), AR15, AR19

**Acceptance Criteria:**

**Given** the `analysisCtx` object passed to agents (rule 2)
**When** the contract test runs
**Then** it verifies that agents cannot mutate the context — context is frozen or defensively copied
**And** the test fails if any agent writes to the context object

**Given** the module import graph (rule 3, AR15)
**When** ESLint runs
**Then** agents (`src/agents/`) never import from providers (`src/providers/`)
**And** providers never import from pipeline (`src/pipeline/`)
**And** violations are reported as ESLint errors, not warnings

**Given** the exit code mapping (rule 5)
**When** the unit test runs
**Then** it verifies exit codes 0-4 each map to the documented failure mode
**And** no two failure modes share an exit code

**Given** the finding shape (rule 6)
**When** the unit test runs
**Then** it verifies all 8 required fields are present on every Finding object
**And** it fails if a finding is missing any required field
**And** `types.js` contains the cross-module JSDoc typedef for Finding (AR19)

---

## Epic 4: Review, Amendment & Feedback

**Goal:** User can review and customize the capabilities model via editor or interactive walkthrough, provide feedback on analysis accuracy, and Gyre respects amendments on future runs. Builds team knowledge through committable artifacts.

### Story 4.1: Manifest Review via Editor & Interactive Walkthrough

As a developer,
I want to review the generated capabilities manifest through my preferred editor or an interactive CLI walkthrough,
So that I can understand what Gyre thinks my stack should have before or after analysis.

**Requirements:** FR24, FR43-full

**Acceptance Criteria:**

**Given** the user runs `gyre review` or selects "y" from the review prompt
**When** the review starts
**Then** first-time users (`.gyre/capabilities.yaml` has no `reviewed: true` flag) get an interactive CLI walkthrough (default) showing capabilities one at a time with descriptions
**And** returning users (`reviewed: true` present) open `$EDITOR` on `.gyre/capabilities.yaml` directly

**Given** the deferred review flag was set in Epic 2 (FR43-stub)
**When** the user runs `gyre analyze` on a subsequent run
**Then** a reminder is displayed: "You deferred review of the capabilities manifest. Run `gyre review` to review."

**Given** the full review prompt (FR43-full)
**When** the user is asked "Review capabilities manifest? (y/n/later)"
**Then** "y" opens the review flow (walkthrough or editor)
**And** "n" skips review and proceeds
**And** "later" sets the deferred review flag (FR55)

### Story 4.2: Manifest Amendment — Add, Remove, Modify

As a developer reviewing the capabilities manifest,
I want to add, remove, or modify capabilities,
So that the model reflects my actual priorities and domain knowledge.

**Requirements:** FR25, NFR9, AR18

**Acceptance Criteria:**

**Given** the user is in the interactive walkthrough
**When** they review a capability
**Then** they can mark it for removal, modify its description, or skip (keep as-is)
**And** at the end, they can add new capabilities with a description

**Given** the user edits via `$EDITOR`
**When** they save and close the editor
**Then** the modified YAML is validated for structural correctness
**And** if invalid YAML, the user is prompted to re-edit or discard changes

**Given** amendments are made
**When** saved
**Then** the manifest is written atomically (temp + rename) (AR18)
**And** amended capabilities are marked with `amended: true` and a timestamp
**And** the amended manifest is validated via format-based pattern matching (NFR9): rejects values containing multi-line code blocks, file path patterns (e.g., `/src/`, `C:\`), or secret-like strings (e.g., `AKIA*`, `sk-*`) — not content-level semantic analysis

### Story 4.3: Amendment Persistence & Model Subtraction

As a developer who has customized the manifest,
I want my amendments to be respected on subsequent runs,
So that Gyre doesn't regenerate capabilities I removed or revert my modifications.

**Requirements:** FR26, FR27

**Acceptance Criteria:**

**Given** the user has removed capabilities from the manifest
**When** a subsequent analysis run occurs
**Then** removed capabilities are excluded from the analysis
**And** findings associated with removed capabilities are not generated (FR27)

**Given** the user has modified or added capabilities
**When** a subsequent analysis run occurs
**Then** modifications are preserved — the cached manifest includes user amendments
**And** if model regeneration is triggered (StackProfile hash change), user amendments are merged into the new model with conflict warnings

**Given** amendment persistence scope
**When** amendments are saved
**Then** they are stored per-repo in `.gyre/capabilities.yaml` (MVP scope)

### Story 4.4: Post-Analysis Feedback Collection

As a developer who has reviewed analysis results,
I want to provide feedback on what Gyre missed or got wrong,
So that the model can improve over time for my team.

**Requirements:** FR28, FR29, FR30, AR18

**Acceptance Criteria:**

**Given** analysis completes
**When** the feedback prompt appears
**Then** the system asks: "Did Gyre miss anything you know about?" (FR28)
**And** the user can provide free-text feedback

**Given** the user provides feedback
**When** it is saved
**Then** feedback is persisted to `.gyre/feedback.yaml` with a timestamp (FR29)
**And** multiple feedback entries accumulate — new entries append, not overwrite

**Given** feedback is saved
**When** the save completes
**Then** the system explains: "Consider committing feedback.yaml so your team benefits from this input" (FR30)
**And** the explanation is shown once per session, not on every feedback entry
**And** feedback.yaml is written via read-modify-write atomic pattern: read existing entries → append new entry → write full file to temp → rename (AR18) — uses the `writeAtomicYaml()` utility from Story 2.1b

### Story 4.5: Display Existing Feedback & Deferred Review Flag

As a developer running a subsequent analysis,
I want to see any existing feedback entries and be reminded about deferred reviews,
So that team knowledge is visible and nothing falls through the cracks.

**Requirements:** FR53, FR55

**Acceptance Criteria:**

**Given** `.gyre/feedback.yaml` exists with entries
**When** a new analysis starts
**Then** existing feedback entries are displayed at the start of output (FR53)
**And** display is concise — summary count + most recent entry, not the full history

**Given** the "review deferred" flag was set (FR55)
**When** the user runs any Gyre command
**Then** a reminder is displayed: "Capabilities review deferred from previous run. Run `gyre review` to review."
**And** the reminder is non-blocking — the command proceeds after displaying it

---

## Epic 5: Run Lifecycle & Delta Analysis

**Goal:** User can re-run Gyre and see what changed — new findings, carried forward, and resolved gaps — tracking progress over time. Mode auto-detection replaces the stub from Epic 3.

### Story 5.1: Findings History Persistence & Mode Auto-Detection

As a developer re-running Gyre,
I want the system to remember previous findings and automatically detect whether I'm in crisis or anticipation mode,
So that re-runs are contextualized and I see the right framing for my situation.

**Requirements:** FR38, FR39

**Acceptance Criteria:**

**Given** analysis completes
**When** findings are persisted
**Then** they are saved to `.gyre/findings.yaml` (current run) and appended to `.gyre/history.yaml` (all runs)
**And** each history entry includes a timestamp and the StackProfile Tier 1 hash

**Given** a previous analysis exists in `.gyre/history.yaml`
**When** a new analysis starts
**Then** the system auto-detects mode: "crisis" (first run or significant new blockers) vs "anticipation" (re-run with improvements)
**And** the mode indicator replaces the hardcoded "crisis" stub from Epic 3 (FR37)

**Given** no previous analysis exists
**When** the first run completes
**Then** mode defaults to "crisis" and history is initialized

### Story 5.2: Delta Computation & Display

As a developer who has addressed some findings,
I want to see what's new, what carried forward, and what's resolved since my last run,
So that I can track my progress and focus on what changed.

**Requirements:** FR40, FR41, NFR4

**Acceptance Criteria:**

**Given** a previous run exists in `.gyre/history.yaml`
**When** a new analysis completes
**Then** the system computes the delta: new findings, carried-forward findings, and resolved findings (FR40)
**And** delta is computed by capability ID + domain matching — not by text similarity

**Given** delta has been computed
**When** findings are displayed
**Then** new findings are tagged `[NEW]`
**And** carried-forward findings are tagged `[CARRIED]`
**And** resolved findings are shown in a separate summary: "N findings resolved since last run" (FR41)

**Given** re-run performance (NFR4)
**When** a re-run uses the cached manifest (no regeneration)
**Then** total time is ≤50% of first-run time
**And** model generation phase is skipped entirely — only analysis + delta computation
