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
  - _bmad-output/planning-artifacts/implementation-readiness-report-2026-03-20.md
workflowType: 'architecture'
project_name: 'Gyre'
user_name: 'Amalik'
date: '2026-03-20'
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## Project Context Analysis

### Requirements Overview

**Functional Requirements (57)** across 7 capability areas:
- Stack Detection & Classification (8 FRs) — file system analysis, guard question, CLI override
- Contextual Model Generation (7 FRs) — LLM-generated capabilities manifest with web search, standards, descriptions
- Absence Detection & Analysis (7 FRs) — two domain agents, source/confidence tagging, cross-domain compounds
- Review, Amendment & Feedback (7 FRs) — editor-based review, model subtraction, feedback persistence
- Output & Presentation (9 FRs) — streaming, severity summary, novelty ratio, paste-friendly, JSON
- Run Lifecycle & Delta Analysis (10 FRs) — mode detection, history, delta, monorepo, deferred review
- Installation, Configuration & Resilience (7 FRs) — npm, provider config, fail-fast, partial recovery

**Non-Functional Requirements (22)** across 5 categories:
- Performance (5): time-to-first-finding <2min, total <10min, guard <1s, re-run ≤50%, startup <3s
- Security & Privacy (4): API key storage, privacy architecture (code never sent to LLM), LLM input boundary, artifact safety
- Reliability (4): deterministic generation, graceful API failure, file system safety, run exclusivity
- Integration (4): ≥2 LLM providers, Node.js ≥20, OS compatibility, JSON schema stability
- Quality Gates (5): phase independence, model accuracy ≥70% gate, guard coverage ≥95%, web search freshness, compound confidence threshold

### Architectural Drivers

The following requirements most significantly shape the architecture:

1. **Tiered privacy boundary via StackProfile IR (NFR7, NFR8, DC5)** — Static analysis produces a `StackProfile` intermediate representation with two tiers. **Tier 1** (coarse classification: "Go/Kubernetes/AWS", guard answer) crosses the LLM boundary for model generation. **Tier 2** (detailed detection: specific versions, config patterns, dependency lists) stays local for static analysis only. LLM-facing modules receive Tier 1 only — the shape of the data is the enforcement mechanism. A contract test validates the tier boundary: "Tier 1 must not contain file contents, file paths, version numbers, dependency counts, or secrets."

   **Privacy-accuracy decision tree:** The pre-pilot privacy validation measures model accuracy under Tier 1 only vs Tier 1+2. If delta <5%, ship with Tier 1 (privacy validated). If 5-15%, evaluate **Tier 1.5** — include technology *categories* (e.g., "message queue present," "cache layer detected") without specific versions or counts. If >15%, escalate to product decision (privacy vs accuracy trade-off requires stakeholder input). This decision tree must be documented and agreed before the experiment runs.

2. **Hybrid orchestrator with streaming and provisional status (NFR18, FR32, NFR1)** — Analysis phases run sequentially under an orchestrator: detect → guard → generate → analyze → correlate. Each phase emits events as it works (enabling streaming output). Each phase produces a checkpoint, enabling phase re-entry for guard correction (FR8) and retry after partial failure (FR56).

   **Streaming with provisional/confirmed status:** Findings stream as produced with `status: provisional`. On agent completion, status upgrades to `confirmed`. On agent failure, findings are marked `status: unverified` with a warning: "Agent failed — findings above may be incomplete, re-run recommended." This replaces per-agent atomicity, which contradicts streaming. In JSON output, status is explicit. In CLI, it's invisible unless failure occurs.

   **Four failure modes:**
   - (1) Model generation fails → save nothing, retry from scratch
   - (2) One agent fails → display other agent's confirmed findings, skip correlation, warn about failed agent
   - (3) Correlation fails → display all agent findings without compounds
   - (4) LLM returns garbage (sanity check fails) → display findings with `analysis_suspect` warning banner

3. **Sequential agent execution with parallel as opt-in (NFR14, FR16, FR17)** — Each domain agent (Observability, Deployment) is a self-contained module with its own LLM prompt. **Default: sequential execution** — avoids rate limit conflicts, simplifies output ordering, simplifies testing. Parallel execution is architecturally supported (agents are independent) but opt-in. The provider abstraction layer manages concurrency control and sits beneath all agent modules. Adding new agents in v2 requires adding a module, not modifying the pipeline.

4. **Cached model with explicit regeneration (NFR10, FR11, NFR21)** — LLM temperature=0 provides semantic stability but not bitwise determinism. The architecture guarantees reproducibility via **artifact caching**: the generated `capabilities.yaml` is the stable artifact. Re-runs load the cached model — no LLM call, no web search. Regeneration (triggered explicitly or when StackProfile Tier 1 hash changes) gets fresh web search results. Web search results are captured at generation time and embedded in the model's provenance metadata. This separates currency (generation-time concern) from reproducibility (run-time guarantee). Re-run time ≤50% of first-run (NFR4) because model generation is skipped entirely.

5. **Two-tier persistence with clear VCS boundary and monorepo scan scope** — `.gyre/` contains two categories:
   - **Committed artifacts** (team knowledge): `capabilities.yaml`, `feedback.yaml` — persist across clones, team-owned
   - **Ephemeral state** (machine-local): `findings.yaml` (current run), `history.yaml` (delta computation), `cache/`, `.lock` — gitignored, regenerated each run

   No database, no server. YAML files for all persistence.

   **Monorepo scan scope (FR51):** One `.gyre/` per service root. When the user specifies a service directory, static analysis scans that directory for service code *plus* walks up to find shared infrastructure directories (`terraform/`, `k8s/`, `.github/workflows/` at repo root). The StackProfile includes both service-local and shared-infra signals, tagged by source. Findings from shared infra are tagged `[SHARED]` so the user understands they affect multiple services.

6. **Cross-domain correlation: LLM-proposed, rule-validated (FR22a, FR22b)** — The correlator uses LLM reasoning to discover compound patterns across domains ("no rollback telemetry + no deployment markers = blind rollbacks"). A structural validator enforces: every compound finding must reference exactly 2 existing findings from different domains. Compound confidence derives from component confidences. Correlation only runs when all agents succeed — it degrades gracefully (omitted, not partial) on agent failure.

### Technical Constraints & Dependencies

- **Runtime:** Node.js ≥20, npm distribution
- **External dependency:** LLM API (Anthropic + OpenAI minimum); web search API (generation-time only)
- **File system:** Read project files (read-only), write only to `.gyre/`
- **No server/daemon:** CLI tool, runs on invocation, exits when complete
- **No database:** YAML files for all persistence
- **Convoke ecosystem:** npm package, consistent with existing distribution
- **Rate limits:** Provider abstraction manages concurrency; sequential agent execution by default

### Cross-Cutting Concerns

1. **Privacy enforcement via tiered StackProfile** — Tier 1 (coarse) → LLM, Tier 2 (detailed) → local only. Contract-testable at the boundary. Pre-pilot accuracy test validates the tier split with explicit decision tree for results.
2. **Error handling with four failure modes** — Model failure (retry from scratch), agent failure (graceful degradation with provisional/unverified status), correlation failure (omit compounds), LLM garbage (sanity validator triggers `analysis_suspect` warning). Each maps to exit code + user guidance.
3. **Finding sanity validator** — Pipeline middleware between agent output and renderer. Heuristic checks: >80% capabilities flagged missing is suspicious, uniform confidence is suspicious, findings referencing capabilities not in manifest is a bug. Pure function: `findings[] + manifest → validated_findings[] | SanityWarning`. No LLM dependency.
4. **Streaming & progressive output** — Pipeline phases emit events; CLI renderer subscribes. Sequential agent execution means clean output ordering. Findings stream with provisional status, upgraded on agent success.
5. **`.gyre/` state management** — Lock file, directory creation, monorepo detection with ancestor infrastructure scanning, VCS guidance, two-tier committed/ephemeral split
6. **LLM provider abstraction** — Shared interface with concurrency control, auto model selection, temperature management
7. **Agent extensibility** — Independent agent modules with self-contained prompts; new domains added without pipeline modification
8. **Model caching & regeneration** — Cached manifest is the reproducibility guarantee. StackProfile Tier 1 hash triggers regeneration. Web search freshness is generation-time only.

## Starter Template & Technical Foundations

### Primary Technology Domain

CLI tool with AI agent orchestration — npm-distributed Node.js package within the Convoke ecosystem.

### Technical Preferences

**Consistency decision:** Gyre follows Convoke's existing technical choices. JavaScript (CommonJS), not TypeScript — JSDoc type annotations where type clarity aids the privacy boundary and pipeline data flow. TypeScript reconsidered only if team grows beyond 3-4 developers or if privacy boundary violations become a recurring issue.

### Starter Template Decision: No Starter — Scaffold From Existing Patterns

**Rationale:** Gyre is a new team module within an established codebase, not a greenfield project. The existing Convoke patterns (hand-rolled CLI, `node:test`, Chalk, js-yaml, fs-extra) are proven and understood. A starter template would impose patterns that conflict with the established codebase.

### Packaging & Distribution Strategy

**Dual install path:**
- **Primary (Convoke users):** `convoke-install-gyre` — same pattern as `convoke-install-vortex`. Checks if `gyre` is installed, installs if not, registers in Convoke module manifest.
- **Secondary (standalone users):** `npm install -g gyre` or `npx gyre analyze .` — works without Convoke. CLI outputs "Gyre — a Convoke team module" branding.

**Monorepo structure:** `packages/gyre/` with its own `package.json` for development. Published as standalone `gyre` npm package. Root `convoke-agents` package does not bundle LLM SDKs — Vortex-only users are unaffected.

**npm workspaces:** Root `package.json` adds `"workspaces": ["packages/*"]` for local development. Workspace topology is a development concern; published packages have independent dependency trees.

### Technology Stack (Aligned with Convoke)

**Language & Runtime:**
- JavaScript (CommonJS) — consistent with all existing Convoke scripts
- Node.js ≥20 (NFR15, updated per Core Decisions — Node 18 EOL + Commander v14 requirement)
- JSDoc type annotations for pipeline data structures (StackProfile tiers, Finding, Manifest, context objects)
- Privacy boundary enforcement via contract test, not type system

**CLI Framework: Commander** (ADR-6, Comparative Analysis: 8.35/10)
- Subcommand pattern (`gyre analyze`, `gyre init`, `gyre diff`, `gyre setup`) justifies a library over hand-rolled `process.argv`
- Scored highest against hand-rolled (6.20), yargs (7.70), and oclif (7.05) on weighted criteria
- Scope: argument parsing and subcommand routing only. Isolated to `gyre.js` entry point. Replaceable.
- Testable via `program.parseAsync(['node', 'gyre', 'analyze', '.', '--format', 'json'])`
- **readline** (Node.js built-in) for interactive prompts (guard question, amendment, feedback)
- **Chalk v4** for styled CLI output — **restricted to `output/` directory via ESLint rule**. Pipeline modules return data objects, never styled strings. `--format json` sets `chalk.level = 0` as safety net.

**Testing:**
- `node:test` — Node.js built-in test runner (consistent with existing tests)
- **C8** for coverage
- **Dependency injection mandate:** All LLM-touching modules accept injected dependencies. `node:test` on Node 18 lacks `mock.module()` — DI via tiered context objects solves this.
- Test structure: `__tests__/` co-located per module within `packages/gyre/`; package-root `__tests__/contracts/` and `__tests__/integration/` for cross-module tests. Convoke-level tests (`tests/integration/gyre/`) may be added for `convoke-install-gyre` integration.

**Configuration & Data:**
- **js-yaml** for `.gyre/capabilities.yaml`, `feedback.yaml`, `config.yaml`
- **File size guard:** Check file size before YAML parsing (1MB cap) — prevents expansion attacks on manually edited files
- **fs-extra** for file system operations within `.gyre/`

**LLM Integration (ADR-9):**
- **@anthropic-ai/sdk** + **openai** — both as direct dependencies of `packages/gyre/package.json`
- Isolated from root Convoke package — Vortex-only users don't download LLM SDKs
- Provider abstraction layer wrapping both SDKs behind a common interface
- Consistent with FR46 one-action onboarding (no separate SDK install step)

**Linting:**
- Existing ESLint v10 flat config extended to cover `packages/gyre/`
- **New rule:** Restricted import of `chalk` outside `packages/gyre/lib/output/` directory
- **Existing rule:** `process.cwd()` restricted — use `findProjectRoot()` or accept parameter

### Dependency Injection: Tiered Context Objects

Pipeline modules receive context objects whose *shape* enforces both testability and the privacy boundary:

```javascript
// Phases 1-2: Stack detection & guard (no LLM access)
const detectionCtx = {
  fs,           // file system access for scanning
  gyreDir,      // .gyre/ directory path
  options,      // parsed CLI arguments
  events        // event emitter for streaming
}

// Phases 3-5: Model generation, agents, correlation (no raw file access)
const analysisCtx = {
  provider,           // LLM provider (injected, mockable)
  stackProfileTier1,  // coarse classification only
  manifest,           // generated/cached capabilities
  events,             // event emitter for streaming
  options             // parsed CLI arguments
}
```

The orchestrator is the only module that sees both contexts. Detection phases cannot access the LLM provider. Analysis phases cannot access the raw file system. Tests create whichever context tier they need with stubs.

### Project Structure (Early Sketch)

> **Note:** This is the initial sketch from step 3. **The canonical, complete project tree is in the "Project Structure & Boundaries" section below.** Refer to that section for the authoritative file inventory.

```
packages/gyre/
├── package.json                 # Standalone deps (commander, LLM SDKs, chalk, js-yaml, fs-extra)
├── gyre.js                      # CLI entry point (bin entry) — commander setup
├── lib/
│   ├── pipeline/
│   │   ├── orchestrator.js      # Phase sequencing, checkpoints, context creation
│   │   ├── stack-detector.js    # FR1-FR5: file system analysis → StackProfile
│   │   ├── guard.js             # FR6-FR8: architecture intent question
│   │   ├── model-generator.js   # FR9-FR15: LLM model generation
│   │   ├── correlator.js        # FR22a-b: cross-domain compound findings
│   │   └── sanity-validator.js  # Finding sanity checks (garbage detection)
│   ├── agents/
│   │   ├── observability.js     # FR16: observability readiness agent
│   │   └── deployment.js        # FR17: deployment readiness agent
│   ├── providers/
│   │   ├── provider.js          # Abstract provider interface
│   │   ├── anthropic.js         # Anthropic SDK wrapper
│   │   └── openai.js            # OpenAI SDK wrapper
│   ├── state/
│   │   ├── gyre-dir.js          # .gyre/ directory management, lock file, monorepo detection
│   │   ├── manifest.js          # capabilities.yaml read/write/amend
│   │   ├── findings.js          # findings persistence, delta computation, history
│   │   └── feedback.js          # feedback.yaml management
│   ├── output/
│   │   ├── renderer.js          # CLI streaming renderer (ONLY module that imports Chalk)
│   │   ├── json-formatter.js    # --format json output
│   │   └── summary.js           # Severity-first summary, novelty ratio
│   └── types.js                 # JSDoc @typedef for StackProfile tiers, Finding, Manifest, context objects
├── data/
│   └── guard-options.yaml       # Guard question options & mappings
```

This structure maps directly to the pipeline phases and architectural drivers. Each directory corresponds to a cross-cutting concern or pipeline phase. Adding a new agent (v2: Compliance) means adding a file in `agents/`.

## Core Architectural Decisions

### Decision Priority Analysis

**Critical Decisions (Block Implementation):**
- Node.js minimum version & Commander compatibility
- LLM provider abstraction interface
- Error handling & exit code strategy
- Configuration resolution order

**Important Decisions (Shape Architecture):**
- Prompt architecture & iteration strategy
- Event/streaming system design
- Web search integration strategy

**Deferred Decisions (Post-MVP):**
- Specific web search API vendor (Tavily, Brave, Serper — chosen at implementation time)
- Parallel agent execution optimization
- CI/CD integration mode configuration

### Runtime & CLI Framework

| Decision | Choice | Version | Rationale |
|----------|--------|---------|-----------|
| Node.js minimum | ≥20, target 22 | 20 LTS / 22 LTS | Node 18 EOL April 2025. Node 22 is active LTS until April 2027. CI tests on both 20 and 22. |
| CLI framework | Commander | 14.0.3 | Subcommand pattern (`gyre analyze`, `gyre init`, `gyre diff`, `gyre setup`) justifies a library. Scored 8.35/10 in comparative analysis vs hand-rolled (6.20), yargs (7.70), oclif (7.05). Requires Node ≥20. |

**Note:** PRD NFR15 specifies Node ≥18. This decision updates the minimum to ≥20 based on Node 18 EOL status and Commander v14 compatibility. The PRD should be updated to reflect this.

### LLM Provider Abstraction

**Two-method interface:** `generate()` for complete responses, `stream()` for chunked responses. Both accept `PromptPayload` — the provider translates to its own message format internally.

```javascript
/**
 * @typedef {Object} PromptPayload
 * @property {string} system - System prompt (role, instructions, constraints)
 * @property {string} user - User message (dynamic data: StackProfile, manifest, findings)
 */

/**
 * @typedef {Object} LLMProvider
 * @property {(payload: PromptPayload, opts: GenerateOpts) => Promise<string>} generate
 * @property {(payload: PromptPayload, opts: StreamOpts) => AsyncIterable<string>} stream
 */

/**
 * @typedef {Object} GenerateOpts
 * @property {number} temperature - Always 0 for Gyre (deterministic)
 * @property {number} maxTokens
 */
```

**Usage mapping:**

| Operation | Method | Why |
|-----------|--------|-----|
| Model generation (FR9) | `generate()` | Needs complete output to write `capabilities.yaml` |
| Agent analysis (FR16, FR17) | `stream()` | Findings stream as produced — agent parses chunks, yields structured findings |
| Cross-domain correlation (FR22a) | `generate()` | Needs all input findings first, produces complete compound findings |

**Provider implementations:**
- `providers/anthropic.js` — wraps `@anthropic-ai/sdk` v0.80.x. Maps `PromptPayload.system` to Anthropic's top-level `system` parameter.
- `providers/openai.js` — wraps `openai` SDK. Maps `PromptPayload.system` to `{ role: 'system', content }` in messages array.
- Both implement the same `LLMProvider` interface
- Provider selected via config: `provider.type: anthropic | openai`
- Auto model selection (`provider.model: auto`) picks best available model per provider

**Stream timeout protection:** Provider layer wraps all `stream()` responses in a per-chunk timeout (30s default). If no chunk arrives within the timeout, throws `StreamTimeoutError`. Agents are unaware of timeout logic — they iterate the stream normally. A stalled stream triggers FM2 graceful degradation (agent failure, partial results).

### Prompt Architecture

**Prompt builder functions** — testable pure functions that construct `PromptPayload` objects from structured inputs. No template engine.

```
lib/prompts/
├── model-generation.js    # buildModelGenerationPrompt(tier1, guard, webResults?)
├── observability-agent.js # buildObservabilityPrompt(tier1, manifest)
├── deployment-agent.js    # buildDeploymentPrompt(tier1, manifest)
└── correlation.js         # buildCorrelationPrompt(allFindings)
```

**Design principles:**
- Each builder returns `PromptPayload { system, user }` — system sets role/instructions, user provides dynamic data
- Conditionals are native JS (guard answer changes prompt structure, web search results included when available)
- Testable: assert prompt contains expected sections for given inputs
- The AI/prompt engineer iterates these functions directly — no template indirection
- Prompt builder functions accept Tier 1 StackProfile only — privacy boundary enforced by function signature

### Web Search Integration

**Optional enhancement** — model generation works from agent knowledge + guard answer alone. Web search improves model richness when configured.

```yaml
# .gyre/config.yaml — optional section
search:
  type: tavily  # or brave, serper — vendor chosen at implementation time
  api_key: ${GYRE_SEARCH_KEY}
```

**Integration flow:**
1. If `search` configured: query search API with stack classification + domain terms
2. Search results passed to `buildModelGenerationPrompt()` as optional parameter
3. Results embedded in cached model's provenance metadata (NFR21: fresh per generation)
4. If `search` not configured: model generation proceeds without web results — no error, no warning

**Rationale:** FR46 requires one-action first-run setup. A second API key (search) would violate this. Agent knowledge + guard answer provide a baseline model. Web search is additive.

**Search provider interface:**

```javascript
/**
 * @typedef {Object} SearchProvider
 * @property {(query: string) => Promise<SearchResult[]>} search
 */

/**
 * @typedef {Object} SearchResult
 * @property {string} title
 * @property {string} summary
 * @property {string} url
 * @property {string} date
 */
```

### Event System: Async Generators

**Agents as async generators** — each agent `yield`s findings as discovered. Orchestrator iterates and pipes to renderer.

```javascript
// Agent signature
async function* runObservabilityAgent(analysisCtx) {
  const payload = buildObservabilityPrompt(analysisCtx.stackProfileTier1, analysisCtx.manifest)
  const promptStream = analysisCtx.provider.stream(payload, { temperature: 0 })
  for await (const chunk of promptStream) {
    const finding = parseFinding(chunk)
    if (finding) {
      yield { type: 'finding', status: 'provisional', domain: 'observability', ...finding }
    }
  }
  yield { type: 'agent_complete', domain: 'observability' }
}

// Orchestrator consumption
async function runAnalysis(analysisCtx, renderer) {
  try {
    for await (const event of runObservabilityAgent(analysisCtx)) {
      renderer.display(event)
    }
    renderer.confirmDomain('observability')
  } catch (err) {
    // FM2: agent failure — graceful degradation
    renderer.agentFailed('observability', err)
  }

  try {
    for await (const event of runDeploymentAgent(analysisCtx)) {
      renderer.display(event)
    }
    renderer.confirmDomain('deployment')
  } catch (err) {
    renderer.agentFailed('deployment', err)
  }
}
```

**Why async generators over EventEmitter:**
- One producer, one consumer — no pub/sub complexity
- Natural backpressure — renderer processes at its own pace
- Testable — iterate generator in tests, collect results into array
- Composable — orchestrator chains generators sequentially
- Error propagation via standard try/catch, not `'error'` events

### Error Handling & Exit Codes

**Two-layer error reporting:** simple exit codes for CLI (Sana), granular JSON status for scripting (Ravi).

**CLI Exit Codes (PRD-compatible):**

| Code | Meaning | When |
|------|---------|------|
| 0 | Analysis complete, no blockers | Clean run or partial results with no blockers |
| 1 | Analysis complete, blockers found | Blockers found (even with partial results or sanity warning) |
| 2 | Stack detection failure | Cannot determine project stack |
| 3 | API/provider failure | LLM unreachable, auth failure, timeout (10s per NFR11) |
| 4 | Analysis error | Unrecoverable: model generation failed, both agents failed |

**JSON Status Field (FR54 — granular):**

| Status | Meaning | Exit Code |
|--------|---------|-----------|
| `clean` | Full analysis, no blockers | 0 |
| `blockers_found` | Full analysis, blockers present | 1 |
| `detection_failure` | Stack detection failed | 2 |
| `provider_failure` | LLM API unreachable or auth failure | 3 |
| `partial_results` | One agent succeeded, one failed | 0 or 1 |
| `correlation_skipped` | Both agents OK, correlation failed | 0 or 1 |
| `analysis_suspect` | Sanity validator flagged results | 0 or 1 |
| `analysis_error` | Unrecoverable failure | 4 |

**Failure mode → user experience mapping:**

| Failure Mode | CLI Behavior | Exit Code | JSON Status |
|-------------|-------------|-----------|-------------|
| FM1: Model generation fails | "Model generation failed. Re-run to retry." No findings. | 4 | `analysis_error` |
| FM2: One agent fails | Other agent's findings shown. Warning. Correlation skipped. | 0/1 | `partial_results` |
| FM3: Correlation fails | All agent findings shown. No compound findings. | 0/1 | `correlation_skipped` |
| FM4: Sanity check fails | Findings shown with warning banner. | 0/1 | `analysis_suspect` |

### Configuration Resolution

**Precedence:** CLI flags > environment variables > `.gyre/config.yaml` > built-in defaults

| Setting | CLI Flag | Env Var | Config File | Default |
|---------|----------|---------|-------------|---------|
| LLM provider type | — | `GYRE_PROVIDER` | `provider.type` | — (no default, triggers setup) |
| API key | — | `GYRE_API_KEY` | `provider.api_key` (env ref only) | — (required) |
| Model selection | — | — | `provider.model` | `auto` |
| Guard override | `--guard <type>` | — | — | interactive prompt |
| Output format | `--format <type>` | — | `output.format` | `human` |
| Verbosity | `--verbose` / `--quiet` | — | `output.verbosity` | `normal` |
| Search API key | — | `GYRE_SEARCH_KEY` | `search.api_key` | — (optional) |
| Analysis domains | — | — | `analysis.domains` | `[observability, deployment]` |

**No default provider.** If no config exists and no env var is set, `gyre analyze .` automatically triggers the inline setup wizard — the user picks their provider and sets the API key. First run always works. Both Anthropic and OpenAI users get equal treatment.

**Security rules (NFR6):**
- API keys never written as raw values in `.gyre/config.yaml` — only env var references (`${GYRE_API_KEY}`)
- Config file created by `gyre setup` wizard with file permissions 600
- Keys never logged, never in `.gyre/` committed artifacts

**`gyre setup` / inline setup flow:**
1. "Which AI provider? (anthropic/openai)" → writes `provider.type`
2. "Set your API key: `export GYRE_API_KEY=your-key-here`" → does NOT store key
3. Creates `.gyre/config.yaml` with provider type and default settings
4. One action for the user: set the env var

### Implementation Sequence & Checkpoints

**Checkpoint 1: Model Generation Demo (Steps 1-6)**
Validates model accuracy against synthetic ground truth rubric (pre-pilot gate ≥70%). Unblocks prompt engineer iteration. Demoable: `gyre analyze .` → detects stack → asks guard → generates `capabilities.yaml`.

1. Provider abstraction (`providers/`) — foundation for all LLM operations
2. Configuration resolution (`state/config.js`, `state/gyre-dir.js`) + inline setup wizard (`setup/wizard.js`)
3. Prompt builders (`prompts/`) — model generation prompt first
4. Stack detector + guard (`pipeline/stack-detector.js`, `pipeline/guard.js`)
5. Model generator (`pipeline/model-generator.js`)
6. Orchestrator wiring for checkpoint 1 (`pipeline/orchestrator.js`)

**Checkpoint 2: Full Analysis Pipeline (Steps 7-11)**
Validates agent analysis, cross-domain correlation, output rendering, and review workflow. Demoable: complete `gyre analyze .` with findings.

7. Finding parser (`agents/finding-parser.js`) + agents (`agents/observability.js`, `agents/deployment.js`) + sanity validator
8. Correlator (`pipeline/correlator.js`)
9. Renderer + output (`output/renderer.js`, `output/json-formatter.js`, `output/summary.js`)
10. Review workflow (`pipeline/review.js`) + feedback persistence (`state/feedback.js`)
11. Delta analysis (`state/findings.js`) + mode indicator (FR37)

**Cross-Component Dependencies:**
- Provider abstraction → used by model generator, both agents, correlator
- Tiered context objects → created by orchestrator, consumed by all pipeline phases
- PromptPayload → produced by prompt builders, consumed by provider
- Async generator pattern → implemented by agents, consumed by orchestrator
- Error/exit code strategy → implemented by orchestrator, consumed by CLI entry point
- Config resolution → consumed by CLI entry point to create provider and context

## Implementation Patterns & Consistency Rules

### Naming Patterns

**File Naming:**
- All source files: `kebab-case.js` (e.g., `stack-detector.js`, `model-generator.js`, `json-formatter.js`)
- Test files: `kebab-case.test.js` co-located in `__tests__/` directory per module folder
- Data files: `kebab-case.yaml` (e.g., `guard-options.yaml`)

**Code Naming:**
- Functions: `camelCase` — `buildModelGenerationPrompt()`, `parseFinding()`, `runObservabilityAgent()`
- Constants: `UPPER_SNAKE_CASE` — `EXIT_CODES`, `DEFAULT_TIMEOUT`, `FINDING_DELIMITER`
- Classes: `PascalCase` — `GyreError`, `ProviderError`, `DetectionError`
- JSDoc typedefs: `PascalCase` — `StackProfile`, `PromptPayload`, `Finding`, `LLMProvider`

**YAML Field Naming:**
- All YAML artifacts (`.gyre/capabilities.yaml`, `.gyre/config.yaml`, `.gyre/feedback.yaml`): `snake_case` keys
- Consistent with npm/Node.js ecosystem YAML conventions

### Structure Patterns

**Test Location:**
- Tests live in `__tests__/` directories within each module folder
- Example: `lib/pipeline/__tests__/orchestrator.test.js`, `lib/providers/__tests__/anthropic.test.js`
- Test fixtures in `__tests__/fixtures/` when needed

**Module Exports:**
- Each file exports a single primary function or a small cohesive set of related functions
- No barrel files (`index.js` re-exports) — import directly from the source file
- Example: `const { buildModelGenerationPrompt } = require('./prompts/model-generation')`

### Data Format Patterns

**Finding Shape (Minimum Viable — 8 Required Fields):**

```javascript
/**
 * @typedef {Object} Finding
 * @property {'finding'} type - Event type discriminator
 * @property {'provisional' | 'confirmed' | 'unverified'} status - Lifecycle status
 * @property {string} domain - 'observability' | 'deployment' | 'cross-domain'
 * @property {string} capability - Which capability from the manifest this finding relates to
 * @property {'critical' | 'high' | 'medium' | 'low'} severity - FR21
 * @property {'high' | 'medium' | 'low'} confidence - FR20
 * @property {'static' | 'contextual' | 'cross-domain'} source - FR19
 * @property {string} description - Human-readable explanation (FR13)
 */
```

A finding is **yieldable** only when all 8 fields are present. The parser accumulates LLM output until it can construct this complete shape. No partial yields — ever.

**Agent Event Types:**

```javascript
// Discriminated union on `type` field
{ type: 'finding', status: 'provisional', domain, capability, severity, confidence, source, description }
{ type: 'agent_complete', domain }
```

**YAML Artifact Schemas:**
- `capabilities.yaml`: `{ version, generated_at, stack_profile_hash, capabilities: [{ id, domain, name, description }] }`
- `findings.yaml`: `{ version, runs: [{ timestamp, mode, findings: [Finding] }] }`
- `feedback.yaml`: `{ entries: [{ timestamp, finding_id?, comment }] }`
- `config.yaml`: `{ provider: { type, model, api_key }, search?: { type, api_key }, output?: { format, verbosity } }`

### Communication Patterns: Async Generator Protocol

**Finding Parsing Contract:**

LLM prompts instruct the model to emit findings as `---FINDING---` delimited blocks. Each block contains a complete JSON finding object. The parser accumulates chunks until a delimiter is detected, then parses the accumulated buffer as a single finding.

```javascript
// Parser pattern — all agents use this
async function* parseFindings(stream, domain) {
  let buffer = ''
  for await (const chunk of stream) {
    buffer += chunk
    while (buffer.includes('---FINDING---')) {
      const [block, rest] = buffer.split('---FINDING---', 2)
      const finding = tryParseFinding(block.trim(), domain)
      if (finding) {
        yield { type: 'finding', status: 'provisional', ...finding }
      }
      buffer = rest || ''
    }
  }
  // Handle final block after stream ends
  const finding = tryParseFinding(buffer.trim(), domain)
  if (finding) {
    yield { type: 'finding', status: 'provisional', ...finding }
  }
  yield { type: 'agent_complete', domain }
}
```

**Status Lifecycle:**
1. Agent yields `status: 'provisional'` — finding is structurally complete but agent is still running
2. Orchestrator upgrades to `status: 'confirmed'` after `agent_complete` event
3. On agent failure (catch block), all provisional findings from that agent become `status: 'unverified'`

**Backpressure:** Async generators provide natural backpressure — the renderer processes at its own pace. No buffering, no queue overflow.

### Process Patterns

**Error Classes:**

```javascript
class GyreError extends Error {
  constructor(message, code, { recoverable = false, retryGuidance = '' } = {}) {
    super(message)
    this.name = this.constructor.name
    this.code = code
    this.recoverable = recoverable
    this.retryGuidance = retryGuidance
  }
}

class DetectionError extends GyreError { constructor(msg, opts) { super(msg, 2, opts) } }
class ProviderError extends GyreError { constructor(msg, opts) { super(msg, 3, opts) } }
class AnalysisError extends GyreError { constructor(msg, opts) { super(msg, 4, opts) } }
class StreamTimeoutError extends ProviderError {
  constructor(elapsed) { super(`No chunk received in ${elapsed}ms`, { recoverable: true, retryGuidance: 'Re-run to retry' }) }
}
```

**File System Safety:**
- All writes go to `.gyre/` directory only — never write outside it
- Use `path.resolve()` + assert prefix match before any write
- Atomic writes via write-to-temp + rename pattern for YAML artifacts (prevents corruption on crash)

**Lock File Pattern (NFR13 — Run Exclusivity):**

```javascript
// Orchestrator start
const lockPath = path.join(gyreDir, '.lock')
// Check for stale lock: read PID, check if process alive via process.kill(pid, 0)
// If stale: remove and proceed with warning
// If active: exit with "Another gyre process is running (PID: X)"
// Create lock with current PID
// In finally block: always remove lock
```

**Config Parsing:**
- `config.yaml` parsed once at CLI entry point
- Environment variable references (`${GYRE_API_KEY}`) resolved during parsing
- Merged with CLI flags and env vars per precedence order
- Result is a frozen config object passed to orchestrator — no re-reading config mid-run

**Context Object Immutability:**
- Orchestrator creates `detectionCtx` and `analysisCtx` as frozen objects: `Object.freeze(detectionCtx)`
- Shallow freeze is sufficient — context objects are flat by design (no nested mutable objects)
- Mutation attempts fail loudly in strict mode

### Enforcement Rules

Each rule is tagged with its verification method:

| # | Rule | Verification | Anti-Pattern |
|---|------|-------------|--------------|
| 1 | **Privacy boundary**: Prompt builders accept Tier 1 StackProfile only | `contract-test` | Passing file paths, version strings, or dependency lists to prompt builders |
| 2 | **Context immutability**: Context objects frozen at creation | `contract-test` | Agent mutating `analysisCtx.options` or adding properties |
| 3 | **No cross-layer imports**: Agents never import from `providers/`, providers never import from `pipeline/` | `lint` | `require('../providers/anthropic')` inside an agent file |
| 4 | **PromptPayload shape**: Every prompt builder returns `{ system: string, user: string }` | `contract-test` | Returning raw strings, adding `messages` array, including `model` in payload |
| 5 | **Exit code mapping**: Each failure mode maps to exactly one exit code | `unit-test` | Returning exit 0 when both agents failed, or exit 4 for a single agent failure |
| 6 | **Finding shape**: Agents yield only structurally complete findings (8 required fields) | `unit-test` | Yielding a finding without `confidence` or `source` field |
| 7 | **File system boundary**: State modules write only inside `.gyre/` | `contract-test` | Writing temp files to project root, creating files in `node_modules/` |
| 8 | **Config precedence**: CLI flags > env vars > config file > defaults | `integration-test` | Config file value overriding an explicit CLI flag |

**Pattern Violation Process:**
- Rules 1, 2, 4, 7 enforced by contract tests — violations break CI
- Rule 3 enforced by eslint import boundary rule — violations break lint
- Rules 5, 6 enforced by unit tests — violations break test suite
- Rule 8 enforced by integration test — violations break integration suite

## Project Structure & Boundaries

### Complete Project Directory Structure

```
packages/gyre/
├── package.json                        # Standalone npm package, bin: { gyre: './gyre.js' }
├── gyre.js                             # CLI entry point — Commander setup, config resolution, orchestrator invocation
├── LICENSE
├── .eslintrc.js                        # Import boundary rules (enforcement rule #3)
├── lib/
│   ├── types.js                        # Cross-module JSDoc @typedefs ONLY (Finding, StackProfile, PromptPayload, LLMProvider, contexts)
│   │                                   # Rule: if >1 module references a type → types.js. If only 1 → stays local.
│   ├── pipeline/
│   │   ├── orchestrator.js             # Phase sequencing, context creation, freeze, lock file, exit code mapping
│   │   ├── stack-detector.js           # File system analysis → StackProfile (Tier 1 + Tier 2)
│   │   ├── guard.js                    # Interactive guard question, --guard flag override, reclassification
│   │   ├── model-generator.js          # LLM call → capabilities.yaml, cache check via Tier 1 hash
│   │   ├── review.js                   # Interactive review workflow: editor launch, diff computation, subtraction
│   │   ├── correlator.js              # Cross-domain compound finding generation
│   │   └── sanity-validator.js         # Heuristic checks on findings (>80% missing, uniform confidence, orphans)
│   │   └── __tests__/
│   │       ├── orchestrator.test.js
│   │       ├── stack-detector.test.js
│   │       ├── guard.test.js
│   │       ├── model-generator.test.js
│   │       ├── review.test.js
│   │       ├── correlator.test.js
│   │       └── sanity-validator.test.js
│   ├── agents/
│   │   ├── observability.js            # Async generator — yields findings for observability domain
│   │   ├── deployment.js               # Async generator — yields findings for deployment domain
│   │   ├── finding-parser.js           # Shared delimiter-based chunk accumulator (parseFindings)
│   │   └── __tests__/
│   │       ├── observability.test.js
│   │       ├── deployment.test.js
│   │       └── finding-parser.test.js
│   ├── providers/
│   │   ├── provider.js                 # Provider factory: createProvider(config) → LLMProvider
│   │   ├── anthropic.js                # Anthropic SDK wrapper, stream timeout
│   │   ├── openai.js                   # OpenAI SDK wrapper, stream timeout
│   │   └── __tests__/
│   │       ├── provider.test.js
│   │       ├── anthropic.test.js
│   │       └── openai.test.js
│   ├── prompts/
│   │   ├── model-generation.js         # buildModelGenerationPrompt(tier1, guard, webResults?)
│   │   ├── observability-agent.js      # buildObservabilityPrompt(tier1, manifest)
│   │   ├── deployment-agent.js         # buildDeploymentPrompt(tier1, manifest)
│   │   ├── correlation.js              # buildCorrelationPrompt(allFindings)
│   │   └── __tests__/
│   │       ├── model-generation.test.js
│   │       ├── observability-agent.test.js
│   │       ├── deployment-agent.test.js
│   │       └── correlation.test.js
│   ├── state/
│   │   ├── gyre-dir.js                 # .gyre/ creation, lock file (PID-based), path safety assertions
│   │   ├── manifest.js                 # capabilities.yaml CRUD, Tier 1 hash comparison, amend persistence
│   │   ├── findings.js                 # findings.yaml persistence, delta computation, history
│   │   ├── feedback.js                 # feedback.yaml management
│   │   ├── config.js                   # Config parsing, env var resolution, precedence merge, freeze
│   │   └── __tests__/
│   │       ├── gyre-dir.test.js
│   │       ├── manifest.test.js
│   │       ├── findings.test.js
│   │       ├── feedback.test.js
│   │       └── config.test.js
│   ├── output/
│   │   ├── renderer.js                 # CLI streaming renderer (ONLY module that imports chalk)
│   │   ├── json-formatter.js           # --format json output
│   │   ├── summary.js                  # Severity-first summary, novelty ratio, RICE rationale
│   │   └── __tests__/
│   │       ├── renderer.test.js
│   │       ├── json-formatter.test.js
│   │       └── summary.test.js
│   └── setup/
│       ├── wizard.js                   # Inline setup wizard (provider selection, env var guidance)
│       └── __tests__/
│           └── wizard.test.js
├── data/
│   └── guard-options.yaml              # Guard question options & stack archetype mappings
└── __tests__/
    ├── integration/
    │   ├── config-precedence.test.js   # Enforcement rule #8
    │   └── full-pipeline.test.js       # End-to-end with mock provider
    ├── contracts/
    │   ├── privacy-boundary.test.js    # Enforcement rule #1: no Tier 2 in prompts
    │   ├── context-immutability.test.js # Enforcement rule #2: frozen contexts
    │   ├── prompt-shape.test.js        # Enforcement rule #4: PromptPayload shape
    │   └── fs-boundary.test.js         # Enforcement rule #7: writes only in .gyre/
    └── fixtures/
        ├── stacks/                     # Minimal synthetic stubs — only files needed to trigger detection paths
        │   ├── node-express-aws/       # Each fixture has a comment header explaining what it tests
        │   ├── go-kubernetes-gcp/
        │   └── python-django-azure/
        └── manifests/                  # Sample capabilities.yaml for agent tests
```

### Architectural Boundaries

**Privacy Boundary (Tier 1 / Tier 2):**

| Layer | Receives Tier 1 | Receives Tier 2 | Rationale |
|-------|-----------------|-----------------|-----------|
| `pipeline/stack-detector.js` | Produces both | Produces both | Detection creates both tiers from fs |
| `pipeline/guard.js` | Yes | No | Guard modifies Tier 1 classification only |
| `pipeline/model-generator.js` | Yes | No | LLM-facing — privacy boundary |
| `pipeline/review.js` | Display only | No | Shows manifest content for user review |
| `prompts/*` | Yes | No | All prompt builders accept Tier 1 only |
| `providers/*` | Receives PromptPayload | No | Never sees StackProfile directly |
| `agents/*` | Yes (via analysisCtx) | No | LLM-facing — privacy boundary |
| `pipeline/correlator.js` | Yes (via analysisCtx) | No | LLM-facing — privacy boundary |
| `pipeline/sanity-validator.js` | No | No | Operates on findings only |
| `output/*` | Display only | No | Renderer shows Tier 1 in summary |

**Module Import Boundary:**

```
gyre.js ──→ lib/state/config.js ──→ lib/providers/provider.js
         ──→ lib/pipeline/orchestrator.js
         ──→ lib/setup/wizard.js (conditional: no config)

orchestrator.js ──→ lib/pipeline/* (all pipeline modules)
                ──→ lib/agents/* (all agents)
                ──→ lib/output/* (renderer)

agents/* ──→ lib/prompts/* (own domain prompt builder)
         ──→ lib/agents/finding-parser.js (shared parser)
         ✗ NEVER → lib/providers/* (receives provider via context)
         ✗ NEVER → lib/state/* (no direct file system access)

prompts/* ──→ lib/types.js (JSDoc only)
           ✗ NEVER → anything else (pure functions)

providers/* ──→ external SDKs only (@anthropic-ai/sdk, openai)
             ✗ NEVER → lib/* (isolated layer)

output/* ──→ chalk (renderer only)
          ✗ NEVER → lib/providers/* or lib/agents/*

pipeline/review.js ──→ lib/state/manifest.js (persistence)
                    ──→ lib/state/feedback.js (persistence)
                    ✗ NEVER → lib/providers/* (no LLM in review)
```

### FR-to-File Mapping

**Capability Area 1: Stack Detection & Classification (FR1-FR8)**

| FR | File | Notes |
|----|------|-------|
| FR1-FR5 | `pipeline/stack-detector.js` | File system analysis → StackProfile |
| FR6 | `pipeline/guard.js` | Interactive guard question |
| FR7 | `gyre.js` + `pipeline/guard.js` | `--guard` CLI flag passed through |
| FR8 | `pipeline/guard.js` + `pipeline/model-generator.js` | Reclassification triggers Tier 1 hash change → regeneration |

**Capability Area 2: Contextual Model Generation (FR9-FR15)**

| FR | File | Notes |
|----|------|-------|
| FR9 | `pipeline/model-generator.js` + `prompts/model-generation.js` | LLM generation, not template |
| FR10-FR11 | `prompts/model-generation.js` | Standards/search embedded in prompt |
| FR12 | `prompts/model-generation.js` | Guard answer modifies prompt structure |
| FR13-FR15 | `pipeline/model-generator.js` | Validation of generated model |

**Capability Area 3: Absence Detection & Analysis (FR16-FR22)**

| FR | File | Notes |
|----|------|-------|
| FR16 | `agents/observability.js` | Async generator agent |
| FR17 | `agents/deployment.js` | Async generator agent |
| FR18-FR21 | `agents/finding-parser.js` | Finding shape enforces source, confidence, severity |
| FR22a-b | `pipeline/correlator.js` + `prompts/correlation.js` | Cross-domain reasoning |

**Capability Area 4: Review, Amendment & Feedback (FR24-FR30)**

| FR | File | Notes |
|----|------|-------|
| FR24-FR26 | `pipeline/review.js` | Editor launch, diff computation, subtraction workflow |
| FR27 | `state/manifest.js` | YAML persistence for amendments |
| FR28-FR30 | `pipeline/review.js` + `state/feedback.js` | Feedback prompt in review flow, persistence in state |

**Capability Area 5: Output & Presentation (FR31-FR36, FR49-FR50)**

| FR | File | Notes |
|----|------|-------|
| FR31-FR35 | `output/renderer.js` + `output/summary.js` | CLI streaming output |
| FR36 | `output/json-formatter.js` | JSON output mode |
| FR37 | `output/renderer.js` | Mode indicator display (crisis/anticipation) at start of output |
| FR49-FR50 | `output/renderer.js` | Paste-friendly, RICE rationale |

**Capability Area 6: Run Lifecycle & Delta Analysis (FR38-FR43, FR52-FR55)**

| FR | File | Notes |
|----|------|-------|
| FR38-FR41 | `state/findings.js` + `pipeline/orchestrator.js` | Mode, history, delta |
| FR42 | `state/gyre-dir.js` | `.gyre/` creation |
| FR43, FR52-FR53, FR55 | `pipeline/orchestrator.js` | Manifest review, warnings, reminders |
| FR51 | `pipeline/stack-detector.js` | Monorepo service boundary |

**Capability Area 7: Installation, Configuration & Resilience (FR44-FR48, FR54, FR56-FR57)**

| FR | File | Notes |
|----|------|-------|
| FR44 | `package.json` | npm bin entry |
| FR45-FR46 | `state/config.js` + `setup/wizard.js` | Config + inline setup |
| FR47-FR48 | `providers/provider.js` | Fail fast, auto model |
| FR54 | `output/json-formatter.js` | Status field |
| FR56-FR57 | `pipeline/orchestrator.js` | Partial save, complete-or-nothing |

### Data Flow

```
User runs: gyre analyze .
         │
         ▼
    ┌─────────┐     config.yaml
    │ gyre.js │────→ env vars    ──→ frozen config object
    └────┬────┘     CLI flags
         │         (no config? → setup/wizard.js)
         ▼
    ┌──────────────┐
    │ orchestrator  │──→ creates detectionCtx (fs, gyreDir, options) ← frozen
    └──────┬───────┘
           │
     ┌─────▼──────┐
     │ stack-      │──→ StackProfile { tier1: coarse, tier2: detailed }
     │ detector    │
     └─────┬──────┘
           │
     ┌─────▼──────┐
     │ guard       │──→ modified tier1 (if user corrects classification)
     └─────┬──────┘
           │
     ┌─────▼──────┐                    ┌──────────────┐
     │ model-      │──→ generate() ──→ │ LLM provider │
     │ generator   │←── capabilities ←─┘              │
     └─────┬──────┘
           │  writes capabilities.yaml via state/manifest.js
           │
           │  creates analysisCtx (provider, tier1, manifest, options) ← frozen
           ▼
     ┌────────────┐     ┌────────────┐
     │ observ.    │     │ deploy.    │     Sequential, each streams findings
     │ agent      │     │ agent      │
     └─────┬──────┘     └─────┬──────┘
           │                   │
           └───────┬───────────┘
                   ▼
           ┌──────────────┐
           │ correlator   │──→ compound findings (generate(), not stream)
           └──────┬───────┘
                  │
           ┌──────▼───────┐
           │ sanity       │──→ warnings if results look suspicious
           │ validator    │
           └──────┬───────┘
                  │
           ┌──────▼───────┐
           │ renderer /   │──→ CLI output or JSON
           │ formatter    │
           └──────┬───────┘
                  │
           ┌──────▼───────┐
           │ review.js    │──→ optional: editor launch, amendments, feedback
           └──────────────┘     (writes via state/manifest.js, state/feedback.js)
```

## Architecture Validation Results

### Coherence Validation

**Decision Compatibility:** All technology choices are compatible. Commander 14.0.3 requires Node ≥20 (confirmed). LLM SDKs (@anthropic-ai/sdk, openai), Chalk v4, js-yaml, and fs-extra all support Node ≥20. No version conflicts.

**Pattern Consistency:** All naming conventions (kebab-case files, camelCase functions, PascalCase types, snake_case YAML) are internally consistent and align with Node.js ecosystem conventions. Test structure (`__tests__/` co-located) is consistent across all modules.

**Structure Alignment:** Project structure directly maps to pipeline phases. Each enforcement rule has a corresponding test location. Import boundaries are enforceable via ESLint.

**Issues Resolved During Validation:**

| # | Issue | Resolution |
|---|-------|------------|
| 1 | Node.js ≥18 in 3 locations vs ≥20 in Core Decisions | Updated all 3 references (NFR listing, Technical Constraints, Starter Template) to ≥20 |
| 2 | `pipeline/review.js` missing from checkpoint sequence | Added as Checkpoint 2 step 10 with `state/feedback.js` |
| 3 | `state/config.js` missing from Checkpoint 1 step 2 | Added explicitly to step 2 |
| 4 | `agents/finding-parser.js` missing from Checkpoint 2 step 7 | Added explicitly to step 7 |
| 5 | FR23 gap in FR mapping | Confirmed PRD numbering skip (FR22b → FR24). FR23 does not exist. |
| 6 | FR37 missing from FR mapping | Mapped to `output/renderer.js` — mode indicator display (crisis/anticipation) |
| 7 | Test structure dual-location ambiguity | Clarified: `__tests__/` co-located in `packages/gyre/` for Gyre-internal tests; Convoke-level `tests/integration/gyre/` for `convoke-install-gyre` integration |
| 8 | Starter template tree vs canonical tree confusion | Added "Early Sketch" label and superseded callout pointing to Project Structure & Boundaries |

**Product Decision Flagged:** Bumping Node minimum from ≥18 to ≥20 drops support for Node 18-19 users. Architecture recommends this based on Node 18 EOL (April 2025) and Commander v14 requirement. This is a **product decision** that should be confirmed by PM before PRD NFR15 is updated.

### Requirements Coverage

**Functional Requirements:** All 57 FRs across 7 capability areas have explicit file mappings. FR23 confirmed as PRD numbering skip (does not exist). FR37 now mapped.

**Non-Functional Requirements:** All 22 NFRs are architecturally addressed:
- 6 as core architectural drivers (NFR1, NFR7, NFR8, NFR10, NFR13, NFR14, NFR18)
- 8 via explicit implementation patterns (NFR6, NFR11, NFR12, NFR19-NFR22)
- 8 via technology decisions (NFR2-NFR5, NFR9, NFR15-NFR17)

### Architecture Completeness Checklist

**Requirements Analysis**
- [x] Project context analyzed (57 FRs, 22 NFRs, 5 user journeys)
- [x] Scale and complexity assessed (CLI tool, 2 LLM providers, 2 domain agents)
- [x] Technical constraints identified (Node ≥20, npm, no server, YAML persistence)
- [x] Cross-cutting concerns mapped (8 concerns documented)

**Architectural Decisions**
- [x] Runtime & CLI framework decided with versions (Node ≥20, Commander 14.0.3)
- [x] LLM provider abstraction interface defined with code (generate + stream)
- [x] Prompt architecture specified with builder pattern (PromptPayload)
- [x] Error handling with 4 failure modes and exit code mapping (0-4)
- [x] Configuration resolution with precedence order (CLI > env > file > defaults)
- [x] Event system via async generators (yield findings, natural backpressure)
- [x] Web search as optional enhancement (no default, additive only)
- [x] Implementation checkpoints (2) with 11-step sequence

**Implementation Patterns**
- [x] Naming conventions (file, code, YAML — all consistent)
- [x] Structure patterns (test location, module exports, no barrel files)
- [x] Data formats (Finding 8-field shape, YAML schemas, event types)
- [x] Communication patterns (async generator protocol, finding parser, delimiter contract)
- [x] Process patterns (error classes, fs safety, lock file, config, context freeze)
- [x] Enforcement rules (8 rules with verification methods and anti-patterns)

**Project Structure**
- [x] Complete directory tree with every file annotated
- [x] Privacy boundary table (Tier 1/Tier 2 per module)
- [x] Module import boundary graph with NEVER rules
- [x] FR-to-file mapping for all 7 capability areas (57 FRs, 0 gaps)
- [x] Data flow diagram (full pipeline including review)

### Architecture Readiness Assessment

**Overall Status:** READY FOR IMPLEMENTATION

**Confidence Level:** High — all decisions versioned, all patterns have code examples, all enforcement rules have test strategies, all FRs traced to files, all validation issues resolved.

**Key Strengths:**
- Privacy boundary enforced by data shape + contract tests (not just documentation)
- Async generators provide natural streaming, backpressure, and error propagation
- Tiered context objects enforce both testability and privacy in a single mechanism
- 8 enforcement rules with explicit verification methods prevent agent drift
- Dual install path preserves ecosystem cohesion without forcing Convoke dependency
- Complete FR-to-file traceability with zero coverage gaps

**PRD Update Needed (Product Decision):**
- NFR15: Update Node.js minimum from ≥18 to ≥20 (Commander v14 + Node 18 EOL). Requires PM confirmation.

**First Implementation Priority:**
Checkpoint 1 (Model Generation Demo) — `providers/` → `state/config.js` + `state/gyre-dir.js` + `setup/wizard.js` → `prompts/model-generation.js` → `pipeline/stack-detector.js` + `pipeline/guard.js` → `pipeline/model-generator.js` → `pipeline/orchestrator.js`
