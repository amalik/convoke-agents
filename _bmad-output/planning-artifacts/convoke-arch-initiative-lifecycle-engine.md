---
stepsCompleted:
  - step-01-init
  - step-02-context
  - step-03-starter
  - step-04-decisions
  - step-05-patterns
  - step-06-structure
  - step-07-validation
  - step-08-complete
lastStep: 8
inputDocuments:
  - _bmad-output/planning-artifacts/convoke-brief-initiative-lifecycle-engine.md
  - _bmad-output/planning-artifacts/convoke-brief-initiative-lifecycle-engine-distillate.md
  - _bmad-output/planning-artifacts/convoke-prd-initiative-lifecycle-engine.md
  - _bmad-output/planning-artifacts/convoke-report-implementation-readiness-initiative-lifecycle-engine.md
  - project-context.md
  - _bmad-output/planning-artifacts/convoke-note-initiative-lifecycle-backlog.md
  - _bmad-output/planning-artifacts/convoke-note-capability-evaluation-framework.md
workflowType: 'architecture'
initiative: convoke
artifact_type: arch
qualifier: initiative-lifecycle-engine
project_name: 'Convoke — Initiative Lifecycle Engine (ILE-1)'
user_name: 'Amalik'
date: '2026-04-18'
completedAt: '2026-04-19'
status: complete
schema_version: 1
---

# Architecture Decision Document — Initiative Lifecycle Engine (ILE-1)

**Author:** Winston (Architect)
**Date:** 2026-04-18
**Status:** Draft

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## Project Context Analysis

### Requirements Overview

**Functional Requirements:** 63 FRs across 9 capability areas (from PRD):

1. Intake, Qualification & Lane Management (13 FRs) — data-layer writes with append-only semantics, role-based authorization
2. Portfolio Visibility & Navigation (9 FRs) — rendering layer, navigation continuity, consulting-scale performance
3. Reactive Behaviors & Trust Contract (7 FRs) — event detection, validity contracts, propose-before-commit (never silent commits)
4. Observability Signals (3 FRs) — S1–S4 computation from Change Log + backlog parsing
5. Shared Data Model, Integration & Governance (8 FRs) — the architectural spine; every other area depends on it
6. Onboarding, Help & Error Communication (8 FRs) — progressive disclosure, contextual help, error-category communication with seed registry
7. Interaction Safety & Recovery (4 FRs) — destructive-op confirmation, session undo, progress indication, error recovery
8. Schema Evolution, Migration & Lifecycle Completeness (7 FRs) — versioned frontmatter, breaking-change policy, migration on-invocation, uninstall
9. Developer Tooling & Debugging (4 FRs) — verbosity, daily-rotated decision logs, local-only transmission

**Non-Functional Requirements:** 36 NFRs. Load-bearing for architecture:

- NFR1/NFR2 — Performance SLO (end-to-end 5s/15s; ILE-1 code alone 2s/5s) with instrumented-fixture measurement
- NFR9 — Trust contract enforced against 4 TAC1 fixtures; zero silent state changes
- NFR13 — Atomic writes via write-to-tmp → verify → rename; static-analysis-enforceable
- NFR14 — `[INTERNAL]` error rate < 1% per 100-invocation window
- NFR19 — v6.2/v6.3 compatibility (conditional: build compat OR gate release)
- NFR21 — Portability via `bmad-validate-exports` with golden-file comparison
- NFR23 — Schema-version cross-skill match via `convoke-doctor` at install time
- NFR35 — Fixture-shipping CI check (orphan-reference detection)

### Scale & Complexity

- **Complexity:** High (per PRD classification)
- **Primary technical domain:** developer_tool + capability-layer; CLI + agent skills + markdown + Node.js
- **Architectural topology:** 8 first-class components + 4 extension/convention patterns + 1 shared utility module
- **Estimated execution:** 5–7 Convoke sprints baseline (3–10 range); sprint-level decomposition documented in PRD Scoping

### First-Class Components (8)

Each is independently buildable, testable, and replaceable:

1. **Shared data model library** — schema spec + validator + frontmatter I/O (3 internal modules, 1 library). Architectural spine; every other component depends on it.
2. **Event detection** *(reactive sub-1)* — detects lifecycle-state-change signals from the environment. Model choice (file-watch / git-hook / explicit / scheduled) is a cascading decision — see "Event model cascades" below.
3. **Validity contract evaluator** *(reactive sub-2)* — pure function: given an artifact + a validity contract from config, decide complete / uncertain / invalid. Deterministic, configurable, highly testable.
4. **Propose-before-commit orchestrator** *(reactive sub-3)* — given a should-advance signal + a validity result, produce a proposal (for `UNCERTAIN`) or commit (for `complete`). Never silent commits. Enforces the trust contract.
5. **Portfolio read surface** — kanban rendering + filtering + summary-first (>20 items) + drill-down. Renamed from "renderer" to reflect full read-layer scope.
6. **Observability library** — S1–S4 signal computation from Change Log + backlog parsing. Consumed by Portfolio read surface (explicit runtime coupling; see "Observability invocation contract" below).
7. **Migration engine** — schema-version detection + migration runner. Composes with Convoke's existing migration registry pattern; same discipline, distinct subject matter (data migrations vs. install migrations).
8. **Debug/log infrastructure** — rotation + verbosity + local-only. **Sprint 0 prerequisite, not parallel.** All other components depend on having a logger to emit into.

### Extension/Convention Patterns (4, not first-class components)

Architectural presence but not separate component surface:

- **Qualifying-gate workflow** — lives inside the initiatives-backlog skill's workflow steps (not a separate engine)
- **Contextual help convention** — per-skill help content + routing pattern (e.g., `explain <concept>` → registering skill's help registry)
- **Cross-skill integration contracts** — tests (TAC3 round-trip) + doctor checks (NFR23 version match). Quality gate, not new surface.
- **Extended `convoke-doctor` checks** — addition to existing infrastructure for ILE-1-specific schema validation, wrapper verification, version match

### Shared Utility Module

- **Error registry** (`scripts/lifecycle/lib/error-registry.js` or similar) — exports the 20 seed error codes as constants, category mappings (USER/CONFIG/INTERNAL/UNCERTAIN), `What to try:` remediation strings, `registerCode(category, code, message, remediation)` helper for FR48 registration rule. Precedent: `test-constants.js` + project-context.md `shared-test-constants` rule. Consumed by all ILE-1 skills via import. Not a first-class component (no behavior, just shape); not inside data model library (error contract is cross-cutting, not data-model-scoped).

### Technical Constraints & Dependencies

**Hard constraints (inherited):**

- Runs inside BMAD framework as Convoke skills — must pass BMAD's skill contract (SKILL.md activation, workflow.md orchestration, step-file architecture)
- Hosted by LLM coding agent (Claude Code primary; Copilot/Cursor via export pipeline)
- Filesystem-based state in a git repo; no database (data model decision pending — markdown-as-source vs. structured backing)
- Single-user-per-repo model; multi-user out of scope
- No external network dependencies beyond LLM provider

**Project-context.md rules that bind (13 rules):** test-fixture-isolation, no-hardcoded-versions, no-process-cwd-in-libs, path-safety-for-destructive-ops, namespace-decision-for-new-skills, slash-command-ux-for-user-facing-tools, no-code-in-party-mode, code-review-convergence, capability-form-factor-evaluation, derive-counts-from-source, shared-test-constants, catch-all-phase-review, spec-verify-referenced-files.

**Upstream BMAD (v6.3 direction):**

- BMAD v6.3 introduces direct-YAML loading, retires `bmad-init`, adds `marketplace.json`, introduces `bmm-dependencies.csv` for extensions
- ILE-1 is an "extension of BMM" — per v6.3 Adoption's WS4 (A9 extensions governance), ILE-1 should register entries in `bmm-dependencies.csv` for post-upgrade validation
- NFR19 decision pending: ILE-1 v1 supports v6.2 + v6.3, OR release gated behind v6.3 shipping

### Cross-Cutting Concerns (12 concerns in 3 layers)

Concerns are layered for pedagogical clarity — substrate concerns shape *what exists*, verification concerns shape *how we prove it works*, boundary concerns shape *who we talk to*.

**Layer 1 — Substrate (8 concerns):**

1. Shared data model schema (underlies all 9 capability areas)
2. Event model for reactive layer (file-watch / git-hook / explicit / scheduled; cascading decision)
3. Concurrency & locking (single-invocation-per-backlog via `.ile.lock`)
4. Error contract enforcement (4 categories × 20 seed codes × registration rule × `What to try:` format)
5. Logging/observability infrastructure (daily-rotated logs, local-only, verbosity flags)
6. Schema versioning & migration (versioned frontmatter, cross-version read, automatic migration)
7. Progressive-disclosure UX (bootstrap minimal, full on demand; contextual help; persona-matched calibration)
8. **Configuration layer** — team-level defaults + per-initiative overrides + artifact validity contracts + observability thresholds + help content; multi-level resolution + precedence rules

**Layer 2 — Verification (3 concerns):**

9. `convoke-doctor` integration (verification of schemas, wrapper presence, version match)
10. **Test infrastructure & fixture ownership** — TAC1 (4 uncertain-case fixtures), TAC3 (round-trip), TAC4 (consulting-scale + performance), error-code fixtures, uninstall partial states, git-workflow states, portability golden files per platform
11. Portability & export validation (`bmad-validate-exports` extensions; golden-file comparison)

**Layer 3 — Boundaries (1 concern):**

12. BMAD version compatibility (v6.2 + v6.3 conditional decision)

### Event Model Cascades

The event model choice (Architecture-phase open question) is not a localized decision. It touches components 1 (shared data model — detects what signals mean), 2 (event detection — how signals are captured), 3 (validity contract evaluator — what to do with a signal), 4 (propose-before-commit orchestrator — timing of proposal), 5 (portfolio read surface — when to render proposals), 6 (observability library — S1 acceptance-rate measurement window), 7 (migration engine — whether migrations trigger reactively or only on explicit invocation).

Options under consideration (to be decided in ADRs):

- **File-watch**: near-real-time, requires background daemon, OS-specific APIs, big posture shift (daemon vs. skill-only lifecycle)
- **Git-hook**: fires on commit, per-repo installation, bypassable (`--no-verify`), delayed detection
- **Explicit invocation only**: simplest, no daemon, no proactive surfacing — events only fire when user invokes a skill
- **Scheduled scan**: cron-like, assumes cron availability, polling interval trade-off

### Observability Invocation Contract

The Observability library is invoked by the Portfolio read surface on every render. At consulting scale (60+ initiatives × Change Log scanning for S1 + full-backlog scanning for S3 entropy), compute cost is non-trivial.

Architecture-phase decisions to make:

- What gets computed on every render vs. cached?
- Is caching in-scope for v1, or deferred to Growth?
- If deferred, does worst-case per-render compute fit within NFR1/NFR2 SLO (ILE-1 code < 2s median)?

NFR3 summary-first rendering (observability signals summary at top before listing items) is a partial mitigation; explicit computation strategy is pending.

### Architectural Posture (narrative summary)

ILE-1 is not a greenfield architecture. It's a **rework-plus-layering** architecture:

- **Rework**: three existing Convoke skills (initiatives-backlog v2.0.0, portfolio-status, migrate-artifacts) consolidated onto a shared data model (Components 1, 5, 6)
- **Layer**: new reactive-behaviors triad (Components 2–4) + observability library (Component 6 — partially new) + migration engine (Component 7) + debug/log infrastructure (Component 8)
- **Integrate**: cross-skill contracts, portability validation, doctor extension (verification layer concerns)
- **Constraint**: every architectural choice must preserve the propose-before-commit trust contract and comply with BMAD's skill contracts

## Starter Template Evaluation

### Decision: No starter template applies

ILE-1 does not match any starter, scaffold, or seed template we could clone wholesale. The initiative is a **rework-plus-layering** of existing Convoke skills on an in-house framework (BMAD), grounded in conventions already established in this repository. The most reusable artifacts are **internal reference implementations** (below), not external starters.

### Technology decisions inherited from Convoke stack

Decided at the framework level; carried into ILE-1 without re-litigation:

- **Language / runtime**: Node.js ≥ 18, no compile step (CommonJS); Python ≥ 3.9 for tooling scripts subject to T6 CI gate
- **Package**: `convoke-agents` (npm); ILE-1 ships as skills + libraries inside the same package
- **Test framework**: `node:test` (the C1 phantom-test resolution standardized this; Jest is forbidden)
- **Lint**: `ruff` for Python (`ruff.toml` governs), `eslint` for JavaScript
- **Markdown substrate**: all artifacts are `.md` files with YAML frontmatter; file paths are the primary identifiers
- **Skill contract**: BMAD `SKILL.md` + `workflow.md` + `steps/` architecture; activation is the only entry point
- **CLI pattern**: `convoke-*` scripts in `scripts/` with `bin` entries in `package.json`; slash-command wrappers mandatory for user-facing tools (feedback_slash_command_ux rule)
- **Filesystem state**: git repo, no database; atomic writes via write-to-tmp → verify → rename (NFR13)

No library or framework adoption decisions are open at this layer. Component-internal choices (e.g., watcher library if the event-model ADR picks file-watch) are deferred to ADRs.

### Reference implementations — named patterns to mirror

Six in-repo reference implementations. For each, the specific transferable pattern is named — the rest of the file's shape should not be assumed to transfer.

1. **`_bmad/bme/_enhance/workflows/initiatives-backlog/` (v2.0.0)** — mirror the **step-file orchestration pattern**: `workflow.md` as declarative orchestrator + numbered `steps/NN-*.md` files with checklist-style instructions + `templates/` for output shapes. Transferable to Components 3 (validity contract evaluator skill surface) and 4 (propose-before-commit orchestrator skill surface). Do NOT transfer the lane-specific domain logic.
2. **`scripts/convoke-doctor.js`** — mirror the **check-registration + summary-reporting pattern**: each check is a function returning `{ ok, messages[] }`; a top-level runner collects results and emits a unified report. Transferable to Component 7 (migration engine's per-version check loop) and to the "Extended `convoke-doctor` checks" extension pattern (NFR23 schema-version cross-skill match).
3. **`tests/lib/test-constants.js`** — mirror the **shared-constants module pattern**: one file exporting named constants consumed by all tests, enforced by the `shared-test-constants` project-context rule. Transferable to the Error registry shared utility (Component-adjacent); same discipline (import constants, never duplicate strings).
4. **`scripts/update/lib/registry.js`** — mirror the **append-only migration registry pattern**: array of `{ fromVersion, toVersion, apply }` entries, registered in order, never mutated. Transferable to Component 7 (migration engine data-migration registry). Note: data migrations are a distinct registry from install migrations; same shape, separate instance.
5. **`scripts/update/lib/utils.js`** — mirror the **no-process.cwd pattern**: helpers like `findProjectRoot()`, `getPackageVersion()`, `compareVersions()` accept paths/versions as arguments; never read `process.cwd()` internally (no-process-cwd-in-libs rule). Transferable to every library component (1–8); bake the discipline in from day one.
6. **`scripts/update/lib/refresh-installation.js`** — mirror the **thin-delta-over-bulk-copy pattern**: migration files contain only the logic specific to that migration; shared file-copying work lives in a refresh helper. Transferable to Component 7 (migration engine): per-version migrations stay small; shared I/O and atomic-rename machinery live in a shared helper.

### Scaffolding tools available during implementation

Four scaffolding categories. Each has a concrete trigger — do not invoke speculatively.

1. **`bmad-workflow-builder`** — *applicable only for user-invokable sub-skill wrappers ILE-1 may add*. The 8 first-class components are libraries and are NOT scaffolded via workflow-builder. **Trigger**: an ILE-1 story requires creating a new user-invokable skill wrapper (a command surface the user types, e.g., slash command or `convoke-*` CLI). **Example**: if we add a `convoke-ile-logs` query sub-command or an `explain <concept>` contextual-help skill, scaffold via workflow-builder. **Do not use** for Components 1–8 internal libraries, validator functions, or the event-detection engine.
2. **Clone-and-fork seed** — for components with close structural analogs in-repo. **Trigger**: a new component's shape closely matches an existing skill/module. **Examples**: (a) clone `_bmad/bme/_enhance/workflows/initiatives-backlog/v2.0.0/{workflow.md, steps/}` as the seed for any new user-invokable skill surface under Components 3 or 4; (b) clone `scripts/update/lib/registry.js` as the seed for Component 7's data-migration registry. Seeds are starting points, not scaffolds — expect to delete and rename extensively.
3. **Reference implementations** — in-place patterns to read and translate, not clone (six named above). **Trigger**: a component needs a shape but not a skeleton. Consult the reference, carry the *pattern*, rewrite from scratch.
4. **Technology decisions inherited** — the baked-in substrate (above). **Trigger**: any component. No decision required; reuse the stack.

### Considered and rejected

Explicitly evaluated and ruled out:

- **Team Factory** (Convoke's own factory workflow) — wrong shape. Team Factory scaffolds multi-agent teams + workflows for discovery domains. ILE-1 adds no new agents and is governance infrastructure, not a discovery stream.
- **`bmad-agent-builder`** — ILE-1 creates no new agents. Existing agents (John PM, Winston Architect, Vortex personas) are consumers of ILE-1, not products of it.
- **`oclif` / `commander` / other CLI frameworks** — containment violation. Convoke CLIs use hand-rolled argv parsing in `scripts/convoke-*.js`; adopting a framework here would be a framework-wide decision outside ILE-1's scope.
- **Code generators** (e.g., Yeoman, plop) — tooling overhead exceeds benefit at ILE-1's scale. Eight components do not justify a generator; the clone-and-fork seed pattern is lighter-weight.

### Deferred to ADRs (Step 4+)

These decisions were surfaced during context analysis and require first-class ADRs, not starter-template evaluation:

1. **Event model** — file-watch / git-hook / explicit-invocation-only / scheduled-scan (cascades through Components 1, 2, 3, 4, 5, 6, 7)
2. **Shared data model substrate** — markdown-as-source vs. structured backing (SQLite, JSON index, etc.)
3. **Observability caching strategy** — v1 in-scope or deferred to Growth; fit-to-SLO analysis
4. **BMAD version compatibility** — NFR19: v6.2 + v6.3 dual-support vs. release gated behind v6.3
5. **Concurrency model** — `.ile.lock` shape, scope (per-backlog vs. per-repo), failure semantics
6. **Schema-migration trigger model** — reactive-on-event vs. explicit-on-invocation-only (coupled to event-model decision)

---

### Step 3 menu

**[A] Advanced Elicitation** — further refine the Starter Template Evaluation section
**[P] Party Mode** — additional multi-perspective review
**[C] Continue** — save and proceed to Step 4 (architectural decisions — ADRs for the 6 deferred decisions)

## Core Architectural Decisions

Eight ADRs resolved collaboratively. Decision set was framed in Step 3 context analysis, then reviewed via Party Mode (Winston/Amelia/John) which surfaced two additional ADRs (ADR-7, ADR-8) and corrected the sequence. Red Team elicitation and a second Party Mode coherence pass added implementation hardening (heartbeats, crash breadcrumbs, invocation-start barriers, batch UX) and extracted two cross-cutting concepts (ISWC, Crash Recovery Model) that are specified after the individual ADRs.

### Decision Priority Analysis

**Critical (block sprint 0):**

- ADR-1 (data substrate) — Components 1, 5, 6 cannot be built without it
- ADR-4 (concurrency) — all write-path components need the lock contract
- ADR-8 (error-registration enforcement) — error registry is a sprint-0 shared utility

**Important (posture-defining, shape subsequent components):**

- ADR-2 (event model) — cascades into Components 2–7
- ADR-7 (proposal representation) — Component 4's core
- ADR-5 (migration trigger) — Component 7's invocation contract
- ADR-3 (observability compute) — Component 6's compute discipline

**Policy (release/market):**

- ADR-6 (BMAD version compatibility)

### ADR-1 — Data Model Substrate

**Decision**: md + in-memory index regenerated per invocation (Option C).

**Rationale**: The actual access pattern is multi-read per invocation (kanban render + observability + validity + proposals all touch the data). Amortizes load cost once; no invalidation surface; preserves "files are the record" thesis. Option A (md-only, no index) risked SLO under consulting-scale observability compute. Option B (persistent index) introduced drift + portability concerns without justifying evidence.

**Affects**: Components 1 (data model library), 5 (portfolio read surface), 6 (observability library).

**Specifics:**

- **Scale-measurement requirement**: NFR fixture (see ADR-3) measures cold-start at 60 / 150 / 300 artifact counts. **If 300-artifact scale breaks NFR1/2 SLO, ship cross-invocation persistent cache as part of v1** (promote the Growth-phase escape hatch into v1 scope).
- **Invocation-start barrier — scope narrowed to read-only index builds**: applies only to read-only index builds (observability, portfolio render, validity evaluation). Write paths (migrations, mutations) go through ADR-4 lock acquisition directly — no barrier, no chicken-and-egg with `ensureSchemaCurrent`. The barrier addresses the concurrent-read-staleness race for readers; writers are already serialized by the lock.
- **Explicit heap-release**: skill exit nulls the index reference; documented in Step 5 implementation patterns.

**Growth-phase escape hatch**: if cold-start cost becomes unacceptable at scales below 300 artifacts, persist the in-memory index on exit; invalidate on startup via mtime/hash — Option B as additive evolution, not a rewrite.

### ADR-4 — Concurrency Model

**Decision**: Per-backlog file-based advisory lock (`.ile.lock`, Option B).

**Rationale**: Atomic rename alone (Option A) silently loses Change Log append entries under concurrent invocation — unacceptable for audit trail. OS-level `flock` (Option D) is opaque and has Windows portability edge cases. Per-file lock (Option C) is over-granular for our file count. Option B is inspectable (operator-covenant aligned), cross-platform, crash-recoverable via stale detection.

**Affects**: all write-path components; all ILE-1 skills must acquire the lock before any mutation.

**Specifics:**

- **Lock shape**: `{pid, bootTime, startedAt, lastHeartbeat, invocationId, skillName}`. `bootTime` defeats PID reuse across reboots; same-boot PID reuse disambiguated by `invocationId`.
- **Heartbeat is explicit, not timer-based**: skill code calls `heartbeat.tick(label)` at checkpoints (per file processed, per workflow step completed, per batch item). `heartbeat.tick()` updates `lastHeartbeat` on the lock file via atomic rename. Rationale: `setInterval` fires only between synchronous blocks; a long blocking pass (e.g., YAML-parse 300 artifacts) would starve a timer-based heartbeat. Explicit ticks bind heartbeat to real progress.
- **Tiered staleness** (initial values; calibrate with fixture data):
  - `now − lastHeartbeat < 5min` → `UNCERTAIN-001` (retry in 30s)
  - `5min ≤ now − lastHeartbeat < 15min` → `UNCERTAIN-002` (force-unlock available)
  - `now − lastHeartbeat ≥ 15min` → auto-override with warning logged to Change Log
- **Error-message shape is part of the spec** (not implementation detail). Every lock-related error message MUST include:
  1. Lock contents: `{pid, startedAt, lastHeartbeat, skillName}` + computed age
  2. Recovery command (when applicable): `/ile-force-unlock`
  3. Auto-clear ETA (when within tiered window)

  Example for `UNCERTAIN-002`:

  ```
  UNCERTAIN-002: another invocation in progress (last heartbeat 9 min ago).
    Lock held by: PID 4823, skill bmad-create-prd, started 14:22:10.
    If that invocation crashed: /ile-force-unlock
    Auto-clears at 14:37 (5 min from now) if no further heartbeat.
  ```

- `--force-unlock` prints lock contents before explicit-word confirmation (path-safety rule applies).
- Atomic lock acquisition via write-to-tmp → rename (same NFR13 discipline as artifact writes).
- Failure codes: `UNCERTAIN-001` (active), `UNCERTAIN-002` (possibly stale), auto-override logged to Change Log.

### ADR-8 — Error-Registration Enforcement

**Decision**: Runtime registry (`ILEError` class) + test enumeration backstop (A + D).

**Rationale**: FR48 requires new error codes be registered before use. Runtime registry gates all emitted errors (`ILEError` constructor throws `INTERNAL-001` for unregistered codes) — impossible for an executed path to emit unregistered code. Test backstop catches dead-code-path literals and orphan registry entries via bidirectional source ⟷ registry audit. Custom ESLint rule (Option B) rejected — maintenance cost exceeds marginal coverage gain. `convoke-doctor` check (Option C) deferred to when third-party extensions ship their own codes.

**Affects**: every ILE-1 module that throws errors.

**Specifics:**

- `ILEError` class in `scripts/lifecycle/lib/errors.js`; signature `(code, details = {})`.
- Registry at `scripts/lifecycle/lib/error-registry.js`; `registerCode(category, code, message, remediation)` helper.
- `tests/lib/error-contract.test.js` — bidirectional check (source ⟶ registry, registry ⟶ source); precedent in `shared-test-constants` pattern.
- **New rule** in project-context.md: `ile-error-contract` — all ILE-1 error paths must use `ILEError`; string-literal codes must be registered before use.

### ADR-2 — Event Model

**Decision**: Explicit invocation + intra-skill triggers (Option C+).

**Rationale**: File-watch (A) and git-hook (B) introduce daemon / hook-installer machinery with cross-platform matrix; scheduled scan (D) is platform-specific and breaks portability (NFR21). All three force a proposal-queue UX (no synchronous user moment). C+ preserves no-daemon posture, preserves portability, and keeps proposal UX synchronous — aligned with operator-covenant and trivially preserving the trust contract.

**Affects**: Components 2 (event detection), 3 (validity contract evaluator), 4 (propose-before-commit orchestrator), 5 (portfolio read surface), 6 (observability library), 7 (migration engine).

**Specifics:**

- Every ILE-1-governed state-mutating skill wraps its body via `withISWC()` (see ILE-1 Skill Workflow Contract cross-cutting section below).
- **`/ile-sync` is positioned as the operator-recovery entry point** (reconcile), not merely "a sync command." User-facing documentation frames it as: "Run `/ile-sync` when: (a) you've edited ILE-1 artifacts outside of Convoke skills, (b) you missed a proposal due to a crashed session, (c) you want a consolidated review of pending transitions after a catch-up gap." Functionally: runs crash-recovery (W3 breadcrumb replay + W2 inconsistency surfacing) and batch-reviews all pending transitions via ADR-7 batch UX.
- Drift-detection heuristic in `convoke-doctor`: artifact-mtime > Change-Log-mtime → output suggests `/ile-sync`.
- **Growth-phase defer**: reactive-check coalescing across chained invocations.

### ADR-7 — Proposal Representation & Lifecycle

**Decision**: Inline text + y/n prompt (Option A), ephemeral per-invocation; Option B (scratch-file diff review) documented as Growth-phase escape hatch.

**Rationale**: ADR-2's C+ guarantees the user is present when a proposal is created — no async queue needed. A is the minimum primitive: render as text, respond y/n, apply or log rejection. B introduces filesystem state-machine surface that overlaps with ADR-4's lock hygiene; pay its cost only when v1 evidence shows multi-artifact diff-review is necessary. C (inline diff markers) violates the "file is the record" thesis. D (structured in agent context) breaks for direct CLI use.

**Affects**: Component 4 (propose-before-commit orchestrator); Change Log schema (adds `proposalId` and `batchId` fields).

**Specifics:**

- **Proposal object**: `{ id, triggeredBy, targetArtifact, proposedMutation, reason, createdAt }`.
- **Library**: `scripts/lifecycle/lib/proposal.js` — `createProposal`, `renderProposal`, `applyProposal`, `recordDecision`.
- **Single-proposal UX**: inline text + `y` (accept) / `n` (reject); no `edit` primitive.
- **Batch UX (v1 scope)**: when an invocation produces >3 proposals (typically `/ile-sync` after a catch-up gap), pre-prompt summary is rendered:

  ```
  Found 12 pending transitions:
    9 × Intake → Qualifying Gate
    2 × Qualifying → Initiative
    1 × Initiative → Fast

  (i) Review individually   (b) Accept homogeneous batches   (q) Quit
  ```

- **`reject all` is deliberately absent** — individual review preserves S1 (reactive-misfire rate) signal integrity. `q` leaves proposals pending; they re-fire on next `/ile-sync` or next reactive trigger. No bulk-rejection pathway.
- `b` offers per-category accept-all with expandable detail: `"Accept 9 × Intake → Qualifying Gate? (y/n/expand)"`. Expand shows the list; y accepts the batch.
- Destructive proposals (archive, delete, demote-lane) are never batch-acceptable; each requires its own explicit-word confirmation (path-safety rule).
- **Change Log schema**: `decision: 'accepted' | 'accepted-in-batch' | 'rejected'`. Batch-acceptances grouped by shared `batchId`; individual accepts have no `batchId`.
- Defer is implicit — proposals are deterministic from artifact state; re-fire next invocation if conditions still hold.

### ADR-5 — Migration Trigger Model

**Decision**: Preamble in every ILE-1 skill workflow (Option A).

**Rationale**: PRD committed to "migration on-invocation." Cascades naturally from ADR-2's C+ idiom — a migration preamble is just another workflow step. Self-healing by construction (a skill can't run against stale schema because step 0 would migrate it). Cheap when no migration needed. Options C (marker-file-gated) and D (lazy per-artifact) either risk drift or scatter migration state. B (explicit-only) adds operator friction for a scenario that doesn't need it.

**Affects**: Component 7 (migration engine); every ILE-1 skill workflow (via ISWC).

**Specifics:**

- **Library**: `scripts/lifecycle/lib/schema-migrator.js` — `ensureSchemaCurrent(backlogPath)`, `applyMigrations(fromVersion, toVersion)`.
- **Registry**: `scripts/lifecycle/migrations/registry.js` — append-only `{ fromVersion, toVersion, apply }` entries (precedent: `scripts/update/lib/registry.js`).
- **Invocation point**: `ensureSchemaCurrent()` is called by `withISWC()` in the preamble of every ILE-1 skill. See ISWC cross-cutting section.
- Breaking-change migrations: explicit-word confirmation + summary of what will change.
- Non-breaking migrations: auto-apply silently + debug-log entry.
- Atomic via write-to-tmp → verify → rename (NFR13); failure → `INTERNAL-002` + rollback.
- Change Log entry on success: `{ type: 'schema-migration', from, to, artifactsMigrated, at, migrationIds }`.

### ADR-3 — Observability Compute Model

**Decision**: Full scan at index build + intra-invocation memoization (Option A). Growth-phase exit to bounded-window aggregation (Option C) when NFR1/2 fixture reports SLO miss.

**Rationale**: ADR-1's index build already loads all artifacts; extending the same pass to load the Change Log is marginal. S1–S4 compute once per invocation; subsequent renders read memoized aggregates. Option B (lazy on-render) is strictly worse. Option D (rolling aggregates in Change Log) reintroduces cross-invocation state ADR-1 rejected. Option C (bounded-window) is premature without evidence; retrofit-ready.

**Affects**: Component 6 (observability library); Component 5 (portfolio read surface consumer).

**Specifics:**

- **Library**: `scripts/lifecycle/lib/observability.js` — `computeSignals(indexState)` returning `{ s1, s2, s3, s4, computedAt, sourceCounts }`.
- **Integration**: index builder calls `computeSignals()` at end of build; result on `index.observability`.
- Consumers read from `index.observability.*` — no independent compute.
- **NFR1/2 CI fixture**: `tests/fixtures/consulting-scale-observability/` — parameterized at:
  - 60 initiatives × {2K, 10K, 50K} Change Log entries
  - 150 initiatives × 10K Change Log entries
  - 300 initiatives × 10K Change Log entries
  - Each combination asserts ILE-1 code < 2s median / < 5s p95.
- **Escape-hatch trigger**: if 300-artifact × 10K Change Log crosses SLO → cross-invocation persistent index (ADR-1 Option B) becomes v1 scope; otherwise bounded-window aggregation (Option C) is the first response (90-day default window).
- **S1 computation**: `S1 = rejected / (accepted + accepted-in-batch + rejected)` over trailing 90 days of Change Log entries. `accepted-in-batch` counts same as `accepted` (user approved, signal is positive). Batch-rejection pathway doesn't exist by design (ADR-7), so false-negative pollution from overwhelmed-user rejects is structurally prevented.
- **S4 (cross-skill inconsistency)**: composed with Extended `convoke-doctor` checks at install time (NFR23); observability reports a rolling "seen in last N invocations" flag rather than re-running full doctor checks per invocation.

### ADR-6 — BMAD Version Compatibility

**Decision**: v6.3-gated (Option B) — ILE-1 v1 ships in Convoke 4.0+.

**Rationale**: The initial framing (v6.2 + v6.3 dual vs. v6.3-only) was sharpened in Party Mode: ILE-1 is Convoke-bundled, not a standalone BMAD extension. The market-reach argument applies to extensions adoptable independently, not to bundled features. Consulting teams on Convoke 3.x are already behind on Convoke itself; ILE-1 not backporting to 3.x doesn't uniquely lock them out. Dual-support is a 15–25% lifetime tax (per-extension-point branching, doubled test matrix) for insurance against a scenario that doesn't apply.

**Affects**: all components (single BMAD target); release packaging; install-time doctor checks.

**Specifics:**

- **Minimum BMAD**: `>=6.3.0` declared in ILE-1 skill manifests.
- **Convoke co-release**: ILE-1 v1 ships in Convoke 4.0 (or later); not backported to 3.x.
- `convoke-doctor` pre-install check: BMAD version < 6.3 → `CONFIG-002` ("ILE-1 requires BMAD v6.3+; upgrade BMAD before installing").
- `bmm-dependencies.csv` registration per v6.3 A9 extensions governance (WS4 of v6.3 Adoption).
- **Revisit trigger**: if field feedback in first 6 months shows meaningful demand from users stuck on Convoke 3.x for non-upgrade-able reasons, re-open as Growth-phase story.

### ILE-1 Skill Workflow Contract (ISWC)

Emergent invariant extracted from ADR-2, ADR-4, ADR-5 and Red Team refinements. Named as a first-class concept to avoid three parallel disciplines.

**Every ILE-1-governed skill workflow conforms to the ISWC:**

1. **Preamble (always):**
   - Acquire `.ile.lock` (ADR-4) if the skill writes; skip if read-only
   - `ensureSchemaCurrent()` (ADR-5)
   - `heartbeat.tick('preamble')` if lock held

2. **Body (skill-specific):**
   - Emit `heartbeat.tick(name)` at checkpoints (per file processed, per step completed, per batch item)
   - Before first mutation: write crash breadcrumb `.ile/pending-reactive-check-{invocationId}`

3. **Postamble (always, on success paths):**
   - Clear crash breadcrumb (atomic rename delete)
   - Invoke reactive detector if state-mutating (ADR-2)
   - Release `.ile.lock` (ADR-4) if acquired

4. **Postamble (error/crash paths):** release lock; leave breadcrumb for `/ile-sync` recovery

**Implementation**: `scripts/lifecycle/lib/skill-frame.js` exports `withISWC(skillBody, options)` — wraps a skill body function with the preamble/postamble bracket. Skill authors wrap, rather than hand-roll.

**Conformance**: `tests/lib/iswc-conformance.test.js` — single test replacing the separate reactive-trigger-audit and migration-preamble-audit proposals. Scans all ILE-1 skill `workflow.md` files + `skill-frame.js` usage; asserts every state-mutating workflow is wrapped via `withISWC()` and every read-only skill either uses `withISWC({readOnly: true})` or explicitly opts out with documented rationale.

**Project-context.md rule**: replaces the previously-proposed `ile-reactive-trigger-discipline` and `ile-migration-preamble-discipline` with a single rule `ile-skill-workflow-contract` — "All ILE-1 skills wrap their workflow body via `withISWC()`; non-conforming skills must document the exemption rationale inline."

### Crash Recovery Model

Three crash windows, distinct handling:

| Window | Detection | Recovery mechanism |
|---|---|---|
| **W1 — Pre-mutation** (crashed after lock acquire, before any write) | Stale `.ile.lock` with no mutation traces | ADR-4 tiered-staleness → auto-override at 15 min |
| **W2 — Mid-mutation** (crashed between writes; some artifacts mutated, some not) | Stale `.ile.lock` + mutation-partial artifacts | Individual artifact writes are atomic (NFR13); worst case = last intended mutation didn't land. Lock released via ADR-4 auto-override. `/ile-sync` re-evaluates and re-proposes anything now inconsistent. |
| **W3 — Post-mutation, pre-reactive-check** (all writes landed; reactive check never ran) | Orphan `.ile/pending-reactive-check-{invocationId}` breadcrumb | `/ile-sync` preamble scans breadcrumb directory; each orphan triggers reactive-check replay against current state |

**`/ile-sync` runs both recoveries in order**: (1) acquire lock (blocks on stale via ADR-4 path), (2) `ensureSchemaCurrent`, (3) scan breadcrumbs → replay missed reactive checks (W3), (4) full artifact re-evaluation → surface W2 inconsistencies, (5) emit consolidated proposal set via ADR-7 batch UX.

**Implementation**: `scripts/lifecycle/lib/crash-recovery.js` exports `scanOrphanBreadcrumbs()` and `replayMissedReactiveChecks()`. Called from `/ile-sync`'s workflow body (inside the ISWC frame).

### Decision Impact Analysis

**Implementation sequence (derived from cascades):**

1. **Sprint 0**: Component 8 (debug/log infra) → Shared utility (error registry, `ILEError`, per ADR-8) → Component 1 core (data model library with in-memory index, per ADR-1) → `.ile.lock` + heartbeat discipline (per ADR-4) → `skill-frame.js` exporting `withISWC()` (per ISWC).

2. **Sprint 1–2**: Component 3 (validity contract evaluator, pure function) → Component 7 (migration engine with preamble pattern, per ADR-5) → Component 2 (event detection as workflow-step composition, per ADR-2) → Component 4 (propose-before-commit orchestrator with in-session proposals + batch UX, per ADR-7) → `crash-recovery.js` + `/ile-sync` skill.

3. **Sprint 3–4**: Component 6 (observability library computing at index build, per ADR-3) → Component 5 (portfolio read surface consuming memoized observability).

4. **Sprint 5+**: Cross-skill integration (TAC3 round-trip fixtures) → Extended `convoke-doctor` checks (drift heuristic + BMAD version gate + schema-version match) → Portability golden files.

**Cross-component dependencies derived from ADRs:**

- ADR-1 (in-memory index) ⟶ Components 1, 5, 6 all use the same index object; observability sits *on* the index, not beside it.
- ISWC ⟶ every ILE-1 skill workflow is `withISWC(body, { readOnly?, mutating? })`. Components 2, 5, 7 are primarily consumers; Component 4 (propose-before-commit) coordinates the mutation + reactive-check boundary.
- ADR-4 (.ile.lock + heartbeat) + ADR-8 (ILEError) ⟶ the write-path discipline: `withISWC` acquires lock, body ticks heartbeat, all error paths throw `ILEError` with registered codes.
- ADR-6 (v6.3-gated) ⟶ removes a version-branching axis from every component's implementation; co-release discipline is a project-management concern, not architectural.

**Rules to introduce in project-context.md:**

1. `ile-skill-workflow-contract` (ISWC) — all ILE-1 skills wrap via `withISWC()`; exemptions documented inline.
2. `ile-error-contract` (ADR-8) — all ILE-1 error paths use `ILEError`; codes registered before use.

### Deferred / Growth-Phase Items

- **Cross-invocation index persistence** (ADR-1 escape hatch) — promoted to v1 scope if 300-artifact NFR fixture breaks SLO; otherwise Growth.
- **Scratch-file diff-review proposals** (ADR-7 Option B) — add if multi-artifact proposals become common.
- **Bounded-window observability aggregation** (ADR-3 Option C) — adopt when NFR1/2 fixture SLO miss at target Change Log scale.
- **v6.2 backport** (ADR-6) — re-open if first-6-months field feedback shows meaningful demand.
- **File-watch or git-hook reactive triggers** (ADR-2 additive layer) — add if out-of-band edit frequency justifies proposal-queue UX.
- **Custom ESLint rule for error codes** (ADR-8 Option B) — add only if test-based enforcement proves inadequate in practice.
- **Reactive-check coalescing across chained invocations** (ADR-2) — collapse 3 back-to-back state-mutating skills into one end-of-chain proposal session.

## Implementation Patterns & Consistency Rules

24 decisions across 4 clusters, resolved in sequence **3 → 1 → 2 → 4** (interface contracts first to unblock component parallelization, per Party Mode Finding 3). Each pattern is marked **N (normative, binds all agents)** or **L (local, binds one module's internals)**. The Agent Compliance Table at the end is the audit reference for code reviewers.

Three elicitation/party-mode passes refined the patterns: Path-1 reverse-engineering hardened soft enforcement rows into concrete test names; Path-2 surfaced three missing patterns (logger, paths API, invocationId propagation); a third Party Mode pass added AsyncLocalStorage fallback spec, disambiguated write-durability vs. write-exclusivity, added a test helper, refined grep-discipline scoping, and introduced the concept-docs location alongside spec docs.

### Cluster 3 — Interface Contracts

#### 21. Validity Contract Representation (N)

Pure functions registered via `registerContract(name, evaluatorFn, metadata)`.

- **Location**: `scripts/lifecycle/lib/validity-contracts/` — one `.js` file per contract
- **Registry**: `scripts/lifecycle/lib/validity-contracts/registry.js` — append-only (mirrors error-registry, migration-registry idioms)
- **Signature**: `evaluatorFn: (artifact, index) => { status: 'complete' | 'uncertain' | 'invalid', reasons: string[], missing?: string[] }`
- **Metadata**: `{ description, appliesTo, category }`
- **Growth-phase defer**: YAML-declarative shortcuts compiled to pure functions at registry-load

#### 22. Reactive Detector Output Shape (N)

`detectReactiveProposals(index, triggerContext) => Proposal[]`.

- Single direct consumer: Component 4 (orchestrator). Observability and portfolio render consume Change Log / artifact state, not detector output.
- `triggerContext`: `{ invokingSkill, invocationId, mutatedArtifacts? }`
- Empty array = "checked, nothing to propose" (distinct from undefined/null, which is an ISWC violation)
- Deterministic ordering: sort by `targetArtifact` then `proposedMutation.type`
- Library: `scripts/lifecycle/lib/reactive-detector.js`

#### 23. Migration Function Signature (N)

Adopt install-migration signature from `scripts/update/migrations/*.js` verbatim.

- Module shape: `{ name, fromVersion, breaking, description, async preview(), async apply(projectRoot) }`
- Location: `scripts/lifecycle/migrations/` (parallel structure, distinct instance from install migrations)
- Name format: `ile-data/{fromDataSchema}-to-{toDataSchema}` (data-schema semver)
- Tracking: applied migrations logged to backlog's Change Log (adapted from install migrations' config.yaml tracking)
- Registry API mirrors install-migration registry: `getMigrationsFor`, `hasMigrationBeenApplied`, `getBreakingChanges`, `getAllMigrations`

#### 25. `ILEError` `details` Shape (N)

Minimum common base + documented per-code extensions.

- Base shape: `details: { context: string, ...codeSpecific }` — `context` is a one-line description of what was being attempted
- Auto-injection: `ILEError` constructor merges current `invocationId` from ISWC frame context into `details._invocationId`
- Per-code extensions documented in registry entry (`detailsShape` field)
- Log serialization: full `details` JSON-serialized in debug log per Decision 14

#### 26. Async/Sync Contract Convention (N)

Sync-when-pure, async-when-I/O. ESLint enforces; naming signals at read time.

- Sync: `registerContract`, `registerCode`, `evaluate`, `createProposal`, `renderProposal`, `ILEError` construction, pure helpers
- Async: `readArtifact`, `writeArtifactAtomic`, `buildIndex`, `ensureSchemaCurrent`, `applyProposal`, `heartbeat.tick`, `acquireLock`, all skill-level entry points
- Ambiguous → default async
- ESLint rules: `no-floating-promises`, `require-await`, `no-return-await`
- Naming: I/O uses verb+object; pure is short; no `Async` suffix
- Integration tests exercise async paths with real I/O (not mocked) per feedback memory

### Cluster 1 — Layout & Namespace

#### 2. Skill Directory Layout (N)

`_bmad/bme/_ile/workflows/{skill-name}/` — dedicated ILE namespace.

**Namespace-decision rationale**: Convoke-native (`_bmad/bme/_ile/`), not upstream BMAD. ILE-1 is Convoke's governance-capability extension layer.

Existing `_bmad/bme/_enhance/workflows/initiatives-backlog/v2.0.0/` wrapped by ILE-1 skills; physical relocation deferred.

#### 3. Test Layout (N)

Extends existing `tests/lib/` pattern:

- `tests/lib/ile/*.test.js` — unit tests
- `tests/integration/ile/*.test.js` — integration tests
- `tests/lib/ile/test-helpers.js` — shared test helpers, including `runInISWC(overrides, testFn)` to wrap tests in AsyncLocalStorage context without boilerplate
- `tests/fixtures/ile/{category}/` — categorized fixtures:
  - `uncertain-case-fixtures/` (TAC1)
  - `round-trip-fixtures/` (TAC3)
  - `consulting-scale-observability/` (ADR-3 NFR1/2 fixture)
  - `uninstall-partial-states/`
  - `git-workflow-states/`
  - `portability-golden/{platform}/` (NFR21)

**Test helper pattern**:

```javascript
const { runInISWC } = require('./test-helpers');
test('evaluator handles missing field', async () => {
  await runInISWC({}, async () => {
    const result = evaluate(fixture, index);
    assert.equal(result.status, 'uncertain');
  });
});
```

#### 28. Lane Taxonomy Registry (N)

Const enum in `scripts/lifecycle/lib/lanes.js`:

```javascript
const LANES = Object.freeze({
  INTAKE: 'Intake',
  QUALIFYING_GATE: 'Qualifying Gate',
  BUG: 'Bug',
  FAST: 'Fast',
  INITIATIVE: 'Initiative',
});
module.exports = { LANES };
```

- Canonical source for all lane references
- `convoke-doctor` flags backlogs with lane values outside the enum as `CONFIG-003`
- Operator customization deferred to Growth

#### 30. BMAD Step-File Naming (N)

`step-NN-description.md` — matches upstream BMAD convention.

- `NN`: 2-digit zero-padded; `description`: kebab-case
- Variants allowed for branching steps (e.g., `step-01b-continue.md`)
- Each skill's `workflow.md` loads steps via `load step: ./steps/step-NN-description.md`

### Cluster 2 — Artifact Conventions

#### 4. Frontmatter Schema Shape (N)

JSON Schema via Ajv, runtime-validated.

- Schemas: `scripts/lifecycle/lib/schemas/{artifact-type}.schema.json`
- Validator: Ajv with `strict: true`, `useDefaults: false`
- Component 1 validates at artifact-load time; failure → `CONFIG-004` with failing field in `details`

#### 5. Change Log Format (N)

JSONL at `.ile/change-log.jsonl` (one JSON object per line, append-only).

- Common fields: `{at, invocationId, skill, actor, type}` + type-specific fields
- Entry types: `proposal-decision`, `schema-migration`, `lane-move`, `force-unlock`, `doctor-check-run`, others as needed
- Atomic append: write-to-tmp → append → rename (NFR13)
- Human access via `/ile-log` query skill or observability summary

#### 20. Markdown Table Formatting (L)

Hand-aligned via `scripts/lifecycle/lib/markdown.js` `renderTable(rows, options)`. Generator functions produce aligned output; not CI-enforced.

#### 24. Schema-Version Missing-Field Semantics (N)

Treat as implicit v0; migrate gracefully via `ile-data/implicit-v0-to-1.0.0` migration. One Change Log entry per migrated artifact.

#### 27. Cross-Skill Artifact Reference Format (N)

Both — markdown link for humans, frontmatter `refs` for machines; frontmatter canonical.

- Frontmatter shape: `refs: [{to, type, relationship}]`
- TAC3 tests + S4 observability read `refs` only
- Markdown body links are presentational
- Doctor flags orphan refs as `CONFIG-005`

#### 29. ISO Date Format (N)

`new Date().toISOString()` uniformly. UTC only. Format: `2026-04-19T10:15:32.445Z`.

#### 31. Canonical Artifact-Spec Document (N)

Structured at `docs/ile/`:

- `docs/ile/spec/` — **artifact types only** (backlog, change-log, proposal, brief, prd, ir, architecture, etc.); each `{type}.md` pairs with a JSON Schema in `scripts/lifecycle/lib/schemas/`
- `docs/ile/concepts/` — **architectural concepts** (iswc, crash-recovery-model, lane-taxonomy, observability-model, etc.); prose-only, no schema pairing
- `docs/ile/spec/index.md` — overview; links into both `spec/` and `concepts/`
- `spec-conformance.test.js` scope: set-equality between `spec/*.md` and `schemas/*.schema.json` only; `concepts/` is outside the test's scope

### Cluster 4 — Configuration & Runtime Conventions

#### 9. Heartbeat `tick()` Label Convention (L)

Free-form strings with `phase:detail` colon-separated namespacing.

- Examples: `index-build:parsing`, `migration:applying:ile-data-1.0.x-to-1.1.0`, `writes:change-log-append`, `proposal-render:batch:3-of-12`
- Labels for diagnosis, not interface contracts

#### 12. Configuration Precedence (N)

Highest-precedence-wins layered merge via `deepMerge(defaults, team, backlog, initiative, invocation)`:

1. ILE-1 defaults (`scripts/lifecycle/lib/config-defaults.js`)
2. Team-level (`_bmad/_config/ile.yaml`)
3. Backlog-level (backlog frontmatter, `ile:` namespace)
4. Per-initiative (initiative frontmatter, `ile:` namespace; scope: that initiative only)
5. Per-invocation flags (CLI args / skill parameters)

API: `resolveConfig(invocationContext)` in `scripts/lifecycle/lib/config.js`.

#### 14. Debug Log Format + Rotation (N)

JSONL lines at `.ile/logs/{YYYY-MM-DD}.jsonl`; daily rotation; local-only.

- Entry shape: `{ts, level, invocationId, skill, phase, msg, context}`
- Verbosity: default `info`; `--verbose` lifts to `debug`; per-skill override via `logLevel.{skill-name}` config key
- Rotation: daily file per UTC date; 30-day retention (`logRetentionDays` configurable)
- Cleanup: `/ile-logs-purge` skill
- Local-only: `.ile/` git-ignored via seeded `.gitignore`

**AsyncLocalStorage fallback**: when `ileContext.getStore()` returns undefined (module-load-time diagnostics, tests not wrapping in `ileContext.run`), logger emits with `invocationId: 'bootstrap'` and `skill: null`. Logger NEVER throws; failure to write falls back to console.error with intended payload.

#### 15. Progressive-Disclosure Help UX (N)

Rule-based by `user_skill_level` + `--verbose` override.

- Help items tagged with minimum skill level (`beginner | intermediate | advanced`)
- Default hides advanced unless `user_skill_level: advanced` OR `--verbose`
- Location: `_bmad/bme/_ile/workflows/{skill-name}/help.md` per skill
- Registry: per-skill help loaders register with central dispatcher; `explain <concept>` routes to appropriate loader

#### 19. Invocation ID Format (N)

ULID (Crockford-base32, 26 chars, time-sortable).

- Dependency: `ulid` npm package
- Format: `01HQXK3F7Y...` (26 chars)
- Usage: `invocationId` in every Change Log entry, debug log line, proposal object, lock file, crash breadcrumb
- Generation: `withISWC()` creates at skill entry; propagated via AsyncLocalStorage (see Missing 3)

### Missing Patterns (Cluster 2 augmentation)

#### M1. Logger Instantiation (N)

Single shared logger at `scripts/lifecycle/lib/logger.js`; imported directly; auto-includes current invocationId from AsyncLocalStorage (see M3).

- API: `logger.info(msg, context?)`, `logger.debug(...)`, `logger.warn(...)`, `logger.error(...)`
- Each call reads `invocationId` + `skill` from `ileContext.getStore()` transparently
- Writes to `.ile/logs/{YYYY-MM-DD}.jsonl` per Decision 14
- No per-module instances (overhead without benefit at our scale)
- Fallback behavior per Decision 14 AsyncLocalStorage fallback clause

#### M2. Paths API (N)

`scripts/lifecycle/lib/paths.js` is the canonical source for all path construction:

```javascript
getProjectRoot()                              // wraps existing findProjectRoot
getBacklogPath(projectRoot)                   // finds backlog in planning-artifacts
getChangeLogPath(projectRoot)                 // .ile/change-log.jsonl
getLockPath(projectRoot, backlogName)         // .ile/{backlogName}.lock
getLogPath(projectRoot, date)                 // .ile/logs/{YYYY-MM-DD}.jsonl
getBreadcrumbPath(projectRoot, invocationId)  // .ile/pending-reactive-check-{invocationId}
getSpecDir(projectRoot)                       // docs/ile/spec/
getConceptsDir(projectRoot)                   // docs/ile/concepts/
getSchemaDir(projectRoot)                     // scripts/lifecycle/lib/schemas/
getPendingBreadcrumbGlob(projectRoot)         // for /ile-sync breadcrumb scanning
```

- No `process.cwd()` reads (per `no-process-cwd-in-libs` rule)
- All ILE-1 code MUST use helpers; direct path construction forbidden
- Enforcement: `paths-discipline.test.js` — literals `.ile/`, `docs/ile/`, `change-log.jsonl`, `pending-reactive-check-`, `logs/`, etc. appear only in allow-listed locations (`paths.js` + `tests/fixtures/ile/**` + `docs/**`)

#### M3. invocationId Propagation (N)

AsyncLocalStorage (Node.js stdlib, 16+).

- `withISWC()` wraps skill body in `ileContext.run({invocationId, skillName, backlogPath, config}, skillBody)`
- Downstream code (`ILEError`, `logger`, `heartbeat.tick`, proposal creation) reads `ileContext.getStore().invocationId` transparently
- No explicit context threading through function signatures
- Context store also carries `skillName`, `backlogPath`, resolved config
- Test helper `runInISWC(overrides, testFn)` (Cluster 1 Decision 3) provides ISWC-wrapped context for unit tests

### Project-Context Rules Introduced

Two consolidated rules (replacing earlier proposed separate rules):

1. **`ile-skill-workflow-contract`** (ISWC, from Step 4) — all ILE-1 skills wrap via `withISWC()`; exemptions documented inline.
2. **`ile-error-contract`** (ADR-8, from Step 4) — all ILE-1 error paths use `ILEError`; codes registered with `detailsShape` before use.

### Agent Compliance Table

Normative patterns (N), their specific test files + assertions, and affected components. Reviewers use this table to audit contributions.

| Pattern | N/L | Test file | Specific assertion | Affected |
|---|---|---|---|---|
| `withISWC` wrapper for all skills | N | `iswc-conformance.test.js` | every ILE-1 `workflow.md` calls `withISWC()`; exemptions documented | all skills |
| ULID invocation IDs | N | `iswc-conformance.test.js` | 100 generated IDs match `/^[0-9A-HJKMNP-TV-Z]{26}$/` and are time-sortable | ISWC preamble |
| AsyncLocalStorage propagation | N | `iswc-conformance.test.js` | `ileContext.getStore()` returns valid `{invocationId, skillName, backlogPath}` inside wrapped body | all libs |
| `ILEError` emission via registered codes | N | `error-contract.test.js` | bidirectional: all string-literal `CATEGORY-NNN` codes in source are registered; all registered codes are referenced | all libs |
| `detailsShape` documented per code | N | `error-contract.test.js` (extension) | every registered code has a `detailsShape` field | error registry |
| **Write durability** (atomic write-to-tmp → rename) | N | `atomic-write-conformance.test.js` | grep for direct `fs.writeFile*`/`fs.appendFile*` outside `atomic-write.js` helper — zero matches | all write paths |
| **Write exclusivity** (lock via ISWC) | N | `iswc-conformance.test.js` | state-mutating workflows wrapped in `withISWC({mutating: true})`; lock acquired before first mutation | all write paths |
| Heartbeat coverage in long ops | N (partial) | `heartbeat-coverage.test.js` (integration) | long-running skills (migration, observability compute, `/ile-sync`) under consulting-scale fixture update lock `lastHeartbeat` ≥ N times | long-running skills |
| Lane references use `LANES` enum | N | `lane-enum-conformance.test.js` | string literals matching lane names appear only in `lanes.js` + tests + fixtures | Components 1, 3, 5 |
| Validity contracts via `registerContract` | N | `validity-contract-registry.test.js` | every `.js` in `validity-contracts/` registers itself; registry enumeration matches directory listing | Component 3 |
| Detector returns `Proposal[]` | N | `reactive-detector.test.js` | `detectReactiveProposals()` returns array (possibly empty); empty-array semantics preserved; deterministic ordering | Component 2 |
| Migration modules match install-migration shape | N | `migration-registry-conformance.test.js` | every module in `scripts/lifecycle/migrations/` exports `{name, fromVersion, breaking, description, preview, apply}` | Component 7 |
| Async/sync discipline | N | ESLint via CI lint job | `no-floating-promises`, `require-await`, `no-return-await` rules enabled; build fails on error | all libs |
| JSON Schema validation at load | N | `schema-enforcement.test.js` | loading invalid fixture → `CONFIG-004` raised with failing field in `details` | Component 1 |
| Change Log JSONL format | N | `change-log-schema.test.js` | (a) path grep: `change-log.jsonl` literal only in allow-list. (b) per-line schema validation of fixture Change Logs | all write paths |
| `refs` orphan check | N | `doctor-refs.test.js` | orphan-ref fixtures cause doctor to report `CONFIG-005`; fully-resolved fixtures pass | all artifacts |
| `toISOString()` for timestamps | N | `date-format-conformance.test.js` | forbidden-pattern regex flags `Date.now()`, `.toString()` / `.toLocaleString()` on Date, bare `new Date()` without `.toISOString()` | all components |
| Spec doc ↔ JSON Schema correspondence | N | `spec-conformance.test.js` | set-equality of files in `docs/ile/spec/` and `scripts/lifecycle/lib/schemas/` | docs + schemas |
| Config precedence via `resolveConfig` | N | `config-read-discipline.test.js` + `config-precedence.test.js` | (a) grep: `yaml.load`/`JSON.parse` of config-like paths outside `config.js` — zero matches. (b) layered-fixture integration test verifies Decision 12 order | all consumers |
| JSONL debug log format | N | `debug-log-schema.test.js` | fixture skill under instrumentation; each log line parses as JSON + matches `debug-log-entry.schema.json` | all libs |
| Progressive-disclosure help by skill level | N | `help-registry.test.js` | every skill's `help.md` items tagged with `beginner`/`intermediate`/`advanced`; no untagged items | user-facing skills |
| Workflow-step naming | N | `skill-structure.test.js` | filenames match `/^step-\d{2}[a-z]?-[a-z0-9-]+\.md$/` | all skill dirs |
| Test-layout convention | N | `skill-structure.test.js` (extension) | `tests/lib/ile/`, `tests/integration/ile/`, `tests/fixtures/ile/` present; no `tests/lib/ile-*.test.js` flat-pattern files | all test files |
| Logger via shared `logger.js` | N | `logger-discipline.test.js` | grep for direct `fs.appendFile*` to `.ile/logs/` outside `logger.js` — zero matches | all libs |
| Paths via `paths.js` helpers | N | `paths-discipline.test.js` | literals `.ile/`, `docs/ile/`, `change-log.jsonl`, `pending-reactive-check-`, `logs/` appear only in allow-listed locations (`paths.js`, `tests/fixtures/ile/**`, `docs/**`) | all libs |
| Test helper `runInISWC` available | L | (documented pattern; not asserted) | tests use `runInISWC` to set up AsyncLocalStorage context without boilerplate | all ile tests |
| Markdown table hand-alignment via `renderTable()` | L | (convention; generator functions only) | — | markdown generators |
| Heartbeat label format `phase:detail` | L | (convention; diagnosis aid) | — | long-running bodies |
| Heartbeat tick-per-loop-iteration | L | (convention; unenforceable without AST) | — | long-running loops |

**Summary**: 26 N-rows with concrete test files + assertions; 4 L-rows with documented unenforceability.

### To Incorporate in Step 6 (Project Structure)

- **CI pipeline additions**: `.github/workflows/ci.yml` gains `lint` job running `npm run lint` — required before `publish-gate` job. ESLint config `.eslintrc.js` enables the three rules from Decision 26.
- **Package dependencies**: `ulid` npm package added to `dependencies` (M3 runtime); `ajv` already present or added to `dependencies` (Decision 4).
- **Git-ignore seeding**: `.ile/` and any `.ile.lock` pattern added to the installation's seeded `.gitignore` entries.
- **Conformance test suite**: 16 new test files listed in the Compliance Table; scaffolded in sprint 0 / early sprint 1.

## Project Structure & Boundaries

ILE-1 ships inside Convoke's existing monorepo (brownfield). Structure composes decisions from Steps 4–5 into a complete implementation tree and names integration points with existing Convoke systems. Refined via three elicitation/party-mode passes: CST on uninstall (4 real UX gaps), missing-link scan (12 named-but-not-placed items), What-If on LLM-host invocation model (8 findings, including the Hybrid Model reframe), plus a final coherence pass (6 naming/testability/envelope-TTL refinements).

### LLM-Host Invocation Model (Hybrid)

ILE-1 runs inside Claude Code (primary host; Copilot/Cursor via export pipeline). The host **interprets `workflow.md`** and executes its step instructions via tools (Read, Edit, Bash). Each Bash invocation of a Node script = a **fresh Node.js process**. This has a direct consequence for state propagation.

**The Hybrid Model:**

- **`workflow.md` is the orchestrator** — BMAD-conformant, operator-visible. Each step is instructions Claude follows.
- **Critical per-phase work bundled into fat-script entry points** at `scripts/lifecycle/entries/{skill-name}-entry.js`. One Node process per fat-script call; within it, lock acquisition + heartbeat + mutation + reactive check + log correlation all happen atomically.
- **Context propagates across fat-script calls via env var envelope** (invocationId, skillName, backlogPath, configHash, envelopeCreatedAt). Within a single fat-script call, AsyncLocalStorage is the within-process mechanism.

**Envelope shape (env var names):**

```
ILE_INVOCATION_ID         — ULID
ILE_SKILL_NAME            — orchestrator skill name
ILE_BACKLOG_PATH          — resolved backlog file path
ILE_CONFIG_HASH           — SHA-256 of resolved config (drift detection)
ILE_ENVELOPE_CREATED_AT   — ISO 8601 timestamp (TTL support)
```

**Envelope TTL**: 30 minutes default (configurable via `envelopeTTLMinutes`). `readEnvelope()` treats envelopes older than TTL as expired; generates fresh envelope. Prevents stale-envelope contamination from prior workflows.

**Config drift detection**: each fat-script's `withISWC` preamble computes current config hash and compares to `ILE_CONFIG_HASH` envelope value. On drift: log WARN, continue with currently-resolved config (operator likely edited intentionally). Doctor check surfaces cumulative drift as `CONFIG-009` after N occurrences in trailing window. No fatal path — operator-covenant.

**Inter-fat-script interleave acknowledgment**: between fat-script calls within a single workflow.md, `.ile.lock` is released. Another invocation could acquire during this window; when the original's next phase acquires, it re-reads current state. v1 stance: accept interleave; rely on deterministic re-evaluation (each fat-script reads current backlog → evaluates → acts). Workflow authors structure `workflow.md` so critical atomic transitions live within a single fat-script, never across Bash calls. Growth-phase escape hatch: `_ile.session.lock` (held across workflow.md) as additive feature if field data demands.

### `workflow.md` Step-00 Template (new convention)

Every ILE-1 skill's `workflow.md` begins with:

```markdown
## Step 00 — Initialize ISWC envelope

Check if `ILE_INVOCATION_ID` env var is set:

- **If set** (chained-invocation case — parent skill is orchestrating):
  Reuse the envelope; do NOT generate a new ID.

- **If not set** (root invocation):
  - Generate a ULID: `ULID=$(node -e "console.log(require('ulid').ulid())")`
  - Export envelope:
    export ILE_INVOCATION_ID="$ULID"
    export ILE_SKILL_NAME="ile-sync"
    export ILE_BACKLOG_PATH="$(node scripts/lifecycle/lib/runtime/paths.js --get-backlog-path)"
    export ILE_CONFIG_HASH="$(node scripts/lifecycle/lib/config/config.js --hash)"
    export ILE_ENVELOPE_CREATED_AT="$(date -u +%Y-%m-%dT%H:%M:%S.000Z)"

Subsequent steps invoking Bash inherit these env vars automatically.
```

Enforcement: `iswc-workflow-header.test.js` — every ILE-1 `workflow.md` must contain step-00 matching this pattern.

### Requirements-to-Structure Mapping

Mapping the 9 PRD capability areas to directories:

| PRD capability area | Lives in |
|---|---|
| 1. Intake, Qualification & Lane Management (13 FRs) | `_bmad/bme/_ile/workflows/intake/`, `_bmad/bme/_ile/workflows/qualify/`, `scripts/lifecycle/lib/data/validity-contracts/` |
| 2. Portfolio Visibility & Navigation (9 FRs) | `_bmad/bme/_ile/workflows/portfolio-status/`, `scripts/lifecycle/lib/observability/portfolio-render.js` |
| 3. Reactive Behaviors & Trust Contract (7 FRs) | `scripts/lifecycle/lib/reactive/`, `scripts/lifecycle/lib/frame/skill-frame.js` (ISWC) |
| 4. Observability Signals (3 FRs) | `scripts/lifecycle/lib/observability/` |
| 5. Shared Data Model, Integration & Governance (8 FRs) | `scripts/lifecycle/lib/data/`, `scripts/lifecycle/lib/data/schemas/` |
| 6. Onboarding, Help & Error Communication (8 FRs) | `_bmad/bme/_ile/workflows/*/help.md`, `scripts/lifecycle/lib/errors/` |
| 7. Interaction Safety & Recovery (4 FRs) | `scripts/lifecycle/lib/reactive/crash-recovery.js`, `scripts/lifecycle/lib/frame/lock.js`, `_bmad/bme/_ile/workflows/ile-sync/`, `_bmad/bme/_ile/workflows/ile-force-unlock/` |
| 8. Schema Evolution, Migration & Lifecycle Completeness (7 FRs) | `scripts/lifecycle/lib/migrations/`, `_bmad/bme/_ile/workflows/uninstall/` |
| 9. Developer Tooling & Debugging (4 FRs) | `scripts/lifecycle/lib/runtime/logger.js`, `_bmad/bme/_ile/workflows/ile-logs-purge/`, `_bmad/bme/_ile/workflows/ile-log/` |

### Complete Project Tree (ILE-1 additions)

```
BMAD-Enhanced/
├── _bmad/
│   ├── _config/
│   │   ├── ile.yaml                                ← NEW: team-level config (seeded)
│   │   └── bmm-dependencies.csv                    ← EXTENDED: 3 ILE-1 rows
│   └── bme/
│       └── _ile/                                   ← NEW: dedicated ILE namespace
│           ├── SKILL.md                            ← namespace-level metadata only
│           └── workflows/
│               ├── intake/
│               │   ├── SKILL.md
│               │   ├── workflow.md                 ← starts with step-00 envelope init
│               │   ├── help.md                     ← progressive-disclosure tagged
│               │   └── steps/
│               │       ├── step-01-capture.md
│               │       ├── step-02-classify-lane.md
│               │       └── step-03-record.md
│               ├── qualify/
│               │   ├── SKILL.md
│               │   ├── workflow.md
│               │   ├── help.md
│               │   └── steps/
│               │       ├── step-01-load-artifact.md
│               │       ├── step-02-evaluate-contracts.md
│               │       ├── step-03-propose-lane.md
│               │       └── step-04-log-decision.md
│               ├── portfolio-status/
│               │   ├── SKILL.md
│               │   ├── workflow.md
│               │   ├── help.md
│               │   └── steps/
│               │       ├── step-01-build-index.md
│               │       ├── step-02-compute-observability.md
│               │       ├── step-03-render-kanban.md
│               │       └── step-04-drill-down.md
│               ├── ile-sync/
│               │   ├── SKILL.md
│               │   ├── workflow.md
│               │   ├── help.md
│               │   └── steps/
│               │       ├── step-01-acquire-lock.md
│               │       ├── step-02-migrate.md
│               │       ├── step-03-replay-breadcrumbs.md
│               │       ├── step-04-scan-drift.md
│               │       └── step-05-batch-review.md
│               ├── ile-force-unlock/
│               │   ├── SKILL.md
│               │   ├── workflow.md
│               │   ├── help.md
│               │   └── steps/
│               │       ├── step-01-display-lock.md
│               │       ├── step-02-confirm.md
│               │       └── step-03-release.md
│               ├── ile-log/
│               │   ├── SKILL.md
│               │   ├── workflow.md
│               │   ├── help.md
│               │   └── steps/
│               │       ├── step-01-parse-filter.md
│               │       └── step-02-render-results.md
│               ├── ile-logs-purge/
│               │   ├── SKILL.md
│               │   ├── workflow.md
│               │   ├── help.md
│               │   └── steps/
│               │       ├── step-01-scan-old-logs.md
│               │       ├── step-02-confirm.md
│               │       └── step-03-remove.md
│               └── uninstall/
│                   ├── SKILL.md
│                   ├── workflow.md
│                   ├── help.md
│                   └── steps/
│                       ├── step-01-summarize-removals.md
│                       ├── step-02-confirm.md
│                       ├── step-03-archive-change-log.md
│                       ├── step-04-remove-files.md
│                       ├── step-05-surgical-config-edits.md
│                       └── step-06-final-change-log-entry.md
│
├── scripts/
│   └── lifecycle/                                  ← NEW: ILE-1 library + entries root
│       ├── lib/
│       │   ├── frame/                              ← BMAD-aware (only subtree)
│       │   │   ├── skill-frame.js                  ← withISWC() + ileContext AsyncLocalStorage
│       │   │   ├── lock.js                         ← acquire/release; tiered staleness
│       │   │   ├── heartbeat.js                    ← tick() with atomic lock-file update
│       │   │   └── context-envelope.js             ← readEnvelope() + writeEnvelope() (cross-process)
│       │   ├── writes/
│       │   │   ├── atomic-write.js                 ← write-to-tmp → rename primitive
│       │   │   └── change-log.js                   ← append-only JSONL writer/reader
│       │   ├── data/
│       │   │   ├── index-builder.js                ← in-memory index per invocation
│       │   │   ├── validity-contracts/
│       │   │   │   ├── registry.js                 ← registerContract()
│       │   │   │   ├── prd-ready-for-architecture.js
│       │   │   │   ├── brief-complete.js
│       │   │   │   ├── ir-ready.js
│       │   │   │   └── ... (one file per contract)
│       │   │   └── schemas/                        ← JSON Schemas
│       │   │       ├── backlog.schema.json
│       │   │       ├── change-log-entry.schema.json
│       │   │       ├── proposal.schema.json
│       │   │       ├── brief.schema.json
│       │   │       ├── prd.schema.json
│       │   │       ├── ir.schema.json
│       │   │       ├── architecture.schema.json
│       │   │       └── debug-log-entry.schema.json
│       │   ├── errors/
│       │   │   ├── errors.js                       ← ILEError class
│       │   │   └── error-registry.js               ← seed codes + detailsShape
│       │   ├── migrations/
│       │   │   ├── registry.js                     ← append-only; mirrors install-migration shape
│       │   │   ├── schema-migrator.js              ← ensureSchemaCurrent()
│       │   │   └── ile-data-implicit-v0-to-1.0.0.js
│       │   ├── reactive/
│       │   │   ├── reactive-detector.js            ← detectReactiveProposals()
│       │   │   ├── proposal.js                     ← createProposal/render/apply + batch UX
│       │   │   └── crash-recovery.js               ← breadcrumb scan + replay (W1/W2/W3)
│       │   ├── observability/
│       │   │   ├── observability.js                ← computeSignals() (S1–S4, unified active+archived)
│       │   │   └── portfolio-render.js             ← kanban + filtering + drill-down
│       │   ├── config/
│       │   │   ├── config.js                       ← resolveConfig() + drift hash
│       │   │   └── config-defaults.js              ← ILE-1 shipped defaults
│       │   ├── runtime/
│       │   │   ├── logger.js                       ← shared logger; AsyncLocalStorage + bootstrap fallback
│       │   │   ├── paths.js                        ← canonical path helpers
│       │   │   └── lanes.js                        ← LANES const enum
│       │   ├── format/
│       │   │   └── markdown.js                     ← renderTable() helper
│       │   └── doctor/                             ← 4th registry
│       │       ├── registry.js                     ← append-only doctor-check registry
│       │       ├── bmad-version-gate.js            ← CONFIG-002
│       │       ├── lane-enum-conformance.js        ← CONFIG-003
│       │       ├── schema-validation.js            ← CONFIG-004
│       │       ├── orphan-refs.js                  ← CONFIG-005
│       │       ├── unknown-config-keys.js          ← CONFIG-007
│       │       ├── single-config-file.js           ← CONFIG-008
│       │       ├── config-drift-cumulative.js      ← CONFIG-009
│       │       └── artifact-mtime-drift.js         ← suggests /ile-sync
│       └── entries/                                ← fat-script entry points (Hybrid Model)
│           ├── intake-entry.js                     ← one atomic fat-script per workflow phase
│           ├── qualify-entry.js
│           ├── portfolio-status-entry.js
│           ├── ile-sync-entry.js
│           ├── ile-force-unlock-entry.js
│           ├── ile-log-entry.js
│           ├── ile-logs-purge-entry.js
│           └── uninstall-entry.js
│
├── docs/
│   └── ile/                                        ← NEW: canonical spec + concepts
│       ├── spec/                                   ← artifact-type specs (pair with schemas)
│       │   ├── index.md
│       │   ├── backlog.md
│       │   ├── change-log.md
│       │   ├── proposal.md
│       │   ├── brief.md
│       │   ├── prd.md
│       │   ├── ir.md
│       │   └── architecture.md
│       └── concepts/                               ← architectural concepts (prose-only)
│           ├── iswc.md
│           ├── crash-recovery-model.md
│           ├── lane-taxonomy.md
│           ├── observability-model.md
│           ├── trust-contract.md
│           └── llm-host-invocation-model.md
│
├── tests/
│   ├── lib/
│   │   └── ile/                                    ← unit tests (Cluster 1 D3)
│   │       ├── test-helpers.js                     ← runInISWC() (process.env round-trip)
│   │       ├── iswc-conformance.test.js
│   │       ├── iswc-workflow-header.test.js        ← NEW: workflow.md step-00 pattern
│   │       ├── entry-structure.test.js             ← NEW: fat-script main() + require.main guard
│   │       ├── error-contract.test.js
│   │       ├── atomic-write-conformance.test.js
│   │       ├── lane-enum-conformance.test.js
│   │       ├── validity-contract-registry.test.js
│   │       ├── reactive-detector.test.js
│   │       ├── migration-registry-conformance.test.js
│   │       ├── schema-enforcement.test.js
│   │       ├── change-log-schema.test.js
│   │       ├── doctor-refs.test.js
│   │       ├── doctor-registry-conformance.test.js
│   │       ├── date-format-conformance.test.js
│   │       ├── spec-conformance.test.js
│   │       ├── config-read-discipline.test.js
│   │       ├── ile-config-single-source.test.js
│   │       ├── unknown-config-keys.test.js
│   │       ├── debug-log-schema.test.js
│   │       ├── help-registry.test.js
│   │       ├── help-presence.test.js
│   │       ├── test-layout.test.js
│   │       ├── workflow-structure.test.js
│   │       ├── frame-boundary.test.js
│   │       ├── logger-discipline.test.js
│   │       └── paths-discipline.test.js
│   ├── integration/
│   │   └── ile/
│   │       ├── heartbeat-coverage.test.js
│   │       ├── config-precedence.test.js
│   │       ├── trust-contract-tac1.test.js
│   │       ├── round-trip-tac3.test.js
│   │       ├── consulting-scale-nfr.test.js
│   │       ├── uninstall-tac.test.js
│   │       └── portability-golden.test.js
│   ├── fixtures/
│   │   └── ile/
│   │       ├── uncertain-case-fixtures/
│   │       ├── round-trip-fixtures/
│   │       ├── consulting-scale-observability/    ← 60/150/300 × 2K/10K/50K
│   │       ├── uninstall-partial-states/
│   │       ├── git-workflow-states/
│   │       └── portability-golden/
│   │           ├── macos/
│   │           ├── linux/
│   │           └── windows/
│   └── tmp/                                        ← NEW: test-run-only; gitignored
│       └── ile/
│           └── exports/
│               ├── macos/
│               ├── linux/
│               └── windows/
│
├── .github/
│   └── workflows/
│       └── ci.yml                                  ← EXTENDED: lint, ile-unit, ile-integration, ile-portability-matrix
│
├── .gitignore                                      ← EXTENDED: .ile/, tests/tmp/
├── .eslintrc.js                                    ← EXTENDED: 3 ILE rules
├── package.json                                    ← EXTENDED: ulid, ajv (verify) dependencies
├── project-context.md                              ← EXTENDED: ile-skill-workflow-contract + ile-error-contract rules
└── ruff.toml                                       ← EXISTING: unchanged
```

**Runtime-created (not in repo; gitignored):**

```
.ile/                                               ← local runtime state
├── change-log.jsonl                                ← active append-only
├── change-log-archived-{YYYY-MM-DD}.jsonl          ← created on uninstall (preserved audit)
├── {backlog-name}.lock                             ← concurrency guard
├── pending-reactive-check-{invocationId}           ← crash breadcrumbs
├── breadcrumbs-archived-{YYYY-MM-DD}/              ← created on reinstall for orphan breadcrumbs
└── logs/
    └── {YYYY-MM-DD}.jsonl                          ← daily-rotated debug log
```

Observability reads `change-log.jsonl` + all `change-log-archived-*.jsonl` as unified read-only history for signal computation. Writes go only to active log.

### Architectural Boundaries

**Library boundary** (`scripts/lifecycle/lib/`):

- **`frame/` is BMAD-aware** — `withISWC()` is the BMAD skill-contract wrapper in code form. It depends on BMAD's workflow-step architecture conceptually, though it doesn't import BMAD modules.
- **All other subtrees** (`writes/`, `data/`, `errors/`, `migrations/`, `reactive/`, `observability/`, `config/`, `runtime/`, `format/`, `doctor/`) are framework-neutral. Could be extracted into a standalone npm package.
- One-way dependency: `frame/` may import from any other subtree. Other subtrees MUST NOT import from `frame/` (enforced by `frame-boundary.test.js`).

**Entries boundary** (`scripts/lifecycle/entries/`):

- Fat-script entry points, one per atomic workflow phase
- Each file:
  - Imports `readEnvelope` + `withISWC` from `lib/frame/`
  - Exports `main(testOverrides = null)` function
  - `main()` reads envelope (or uses overrides) + wraps work in `withISWC`
  - Standard bottom block: `if (require.main === module) main().catch(err => { ... process.exit(1); });`
- Enforced by `entry-structure.test.js`

**Skill boundary** (`_bmad/bme/_ile/workflows/`):

- BMAD SKILL.md + workflow.md + steps/ contract (per-skill SKILL.md)
- `workflow.md` starts with step-00 envelope initialization
- Steps invoke fat-scripts in `scripts/lifecycle/entries/` via Bash
- Consumes `scripts/lifecycle/` one-way

**Test boundary**:

- Unit tests (`tests/lib/ile/`): import library functions directly; wrap in `runInISWC` test helper when AsyncLocalStorage context needed
- Integration tests (`tests/integration/ile/`): use real I/O (per feedback memory); may spawn fat-scripts as subprocesses
- Fixtures in `tests/fixtures/ile/{category}/`; tmp runtime output in `tests/tmp/ile/`

**Documentation boundary** (`docs/ile/`):

- `spec/` pairs 1:1 with `scripts/lifecycle/lib/data/schemas/`
- `concepts/` has no schema pairing (prose-only architectural concepts)
- `spec-conformance.test.js` asserts spec ↔ schema set-equality; `concepts/` out of scope

### Integration Points with Existing Convoke Systems

**Existing → ILE-1 touches:**

| Existing system | ILE-1 integration |
|---|---|
| `scripts/convoke-doctor.js` | One-line edit: load `scripts/lifecycle/lib/doctor/registry.js` and run its checks after existing checks |
| `scripts/update/migrations/registry.js` (install migrations) | Untouched. ILE-1's data-migration registry is a parallel instance with the same shape |
| `scripts/update/lib/refresh-installation.js` | Extended seed list: `docs/ile/`, `scripts/lifecycle/`, `_bmad/bme/_ile/`, `_bmad/_config/ile.yaml`, `.eslintrc.js` ILE rules, `.gitignore` additions |
| `scripts/update/lib/validator.js` | Extended to validate the new ILE skill namespace; existing validation paths unchanged |
| `scripts/update/lib/config-merger.js` | Extended to seed `_bmad/_config/ile.yaml` stub via existing `mergeConfig()` pattern |
| `_bmad/bme/_enhance/workflows/initiatives-backlog/v2.0.0/` | Wrapped, not replaced. ILE-1 intake/qualify skills delegate into existing backlog-mutation steps; physical relocation deferred |
| `tests/lib/` (existing 475-test suite) | Untouched; ILE-1 adds `tests/lib/ile/` subtree |
| `_bmad/_config/taxonomy.yaml` (I14 artifact governance) | ILE-1 artifact types register with taxonomy; no schema conflicts |
| `package.json` | Extended: adds `ulid@^2.3.0`; verifies/adds `ajv@^8.12.0` |
| `.eslintrc.js` | Extended: 3 rules — `no-floating-promises`, `require-await`, `no-return-await` |

**File modifications beyond additions:**

| File | Modification | Source |
|---|---|---|
| `project-context.md` | Append rules: `ile-skill-workflow-contract`, `ile-error-contract` | ISWC + ADR-8 |
| `scripts/convoke-doctor.js` | Load ILE-1 doctor registry; run its checks | M-2 |
| `scripts/update/lib/refresh-installation.js` | Extend seed list for ILE-1 trees + config + gitignore + eslintrc entries | Install integration |
| `scripts/update/lib/config-merger.js` | Seed `_bmad/_config/ile.yaml` stub | M-9 |
| `.eslintrc.js` | Add 3 ILE rules | D26 |
| `.github/workflows/ci.yml` | Add `lint`, `ile-unit`, `ile-integration`, `ile-portability-matrix` jobs; extend `publish-gate.needs` | Step 5 CI |
| `.gitignore` | Append `.ile/` and `tests/tmp/` | Runtime + fixture hygiene |
| `package.json` | Add `ulid`; verify `ajv` | M-6 |
| `_bmad/_config/bmm-dependencies.csv` | Append 3 ILE-1 rows | v6.3 A9 (M-4) |

**`bmm-dependencies.csv` entries (ILE-1 stub):**

```csv
extension-name,path,version,scope
convoke-ile,_bmad/bme/_ile/,1.0.0,skill-namespace
convoke-lifecycle-lib,scripts/lifecycle/,1.0.0,runtime-library
convoke-ile-spec,docs/ile/,1.0.0,documentation
```

### Uninstall Workflow Specification

**Removed (default)**:

- `_bmad/bme/_ile/` (all ILE-1 skills)
- `scripts/lifecycle/` (all ILE-1 library + entries)
- `docs/ile/` (spec + concepts)
- ILE-1-specific ESLint rule entries from `.eslintrc.js` (surgical edit, not file replacement)
- `ulid` from `package.json` dependencies (if added exclusively by ILE-1 — doctor verifies)
- `_bmad/_config/ile.yaml` (operator config — uninstall prompts "Remove your ILE-1 config? (y/n)")

**Preserved (audit record)**:

- `.ile/change-log.jsonl` → renamed to `.ile/change-log-archived-{YYYY-MM-DD}.jsonl`
- Archived logs remain readable by a future re-install's observability layer; S1–S4 unify active + archived logs as read-only history
- Historical logs in `.ile/logs/` → retained (operator may purge manually)

**Preserved on artifacts (non-destructive to non-ILE tooling)**:

- Frontmatter `schemaVersion` field
- Frontmatter `refs: [...]` arrays

**Optional flag `--purge-runtime-state`**: fully removes `.ile/` (operator loses audit record). Prompts with path-safety explicit-word confirmation.

**Warnings (non-fatal)**:

- Orphan `refs:` frontmatter — warns; operator may want to keep for re-install
- `bmm-dependencies.csv` ILE-1 entries — warns; operator removes manually per v6.3 A9 governance

**Change Log entry at uninstall**: final entry with `{type: 'uninstall', at, archivedChangeLogPath}`. Written before archival.

**Re-install behavior**:

- Fresh `.ile/change-log.jsonl` created on first mutation after re-install
- `/ile-sync` preamble scans `.ile/pending-reactive-check-*` breadcrumbs:
  - Breadcrumb mtime > active Change Log creation → replay (normal flow)
  - Breadcrumb mtime < active Change Log creation → archive to `.ile/breadcrumbs-archived-{YYYY-MM-DD}/` + WARN; NOT replayed (stale invocationIds from prior cycle)
- `resolveConfig` logs WARN entries for unknown keys in `_bmad/_config/ile.yaml`; doctor reports `CONFIG-007`
- Observability layer gracefully handles archived-log read failures (malformed lines logged WARN, skipped)

### Schema-Field Enum Evolution Invariant

Any change to the accepted values of a schema-bound enum field (e.g., `refs[].type`, `refs[].relationship`, `proposedMutation.type`) requires a data migration. The migration must either (a) transform historical values to new forms, or (b) explicitly tolerate historical values as valid aliases. Merely editing the JSON Schema to accept new values is insufficient — historical artifacts fail validation post-upgrade. Applies to all schemas in `scripts/lifecycle/lib/data/schemas/`.

### Help.md Reference Shape

Each ILE-1 skill's `help.md` follows this tagged-heading convention:

```markdown
# /ile-sync — help

## What it does [beginner]
One-paragraph description.

## When to run it [beginner]
Typical triggers and use cases.

## Common options [intermediate]
Flags and modifiers with short examples.

## Recovery modes [intermediate]
Crash-recovery behavior; breadcrumb semantics.

## Advanced: internal flow [advanced]
Preamble → migrate → replay → scan → batch review → postamble.
```

`help-registry.test.js` asserts every heading has exactly one of `[beginner] | [intermediate] | [advanced]` tag.

### Seeded `_bmad/_config/ile.yaml`

```yaml
# _bmad/_config/ile.yaml
# ILE-1 team-level configuration.
# All keys are optional; uncomment + edit to override ILE-1 defaults.
# Full default values: scripts/lifecycle/lib/config/config-defaults.js
# Precedence (low → high):
#   defaults < team (this file) < backlog frontmatter < initiative frontmatter < invocation flags

# logLevel:
#   default: info
#   bmad-create-prd: debug
# logRetentionDays: 30

# validityContractTimeoutMs: 5000

# lockStaleThresholds:
#   activeMax: 300          # seconds; below → UNCERTAIN-001
#   possiblyStaleMax: 900   # seconds; above → auto-override

# observability:
#   changeLogWindowDays: 90

# proposalBatchThreshold: 3

# envelopeTTLMinutes: 30    # cross-process context TTL
```

Seeded by `scripts/update/lib/config-merger.js`.

### Data Flow (Skill Invocation — Hybrid Model)

```
User types /ile-sync
    │
    ▼
Claude Code reads _bmad/bme/_ile/workflows/ile-sync/SKILL.md + workflow.md
    │
    ▼
Step 00 — Envelope init (one-shot):
    ULID=$(node -e "...") ; export ILE_INVOCATION_ID + ILE_SKILL_NAME + ...
    │
    ▼
Step 01+ (per phase) — Claude invokes fat-script via Bash:
    $ node scripts/lifecycle/entries/ile-sync-entry.js [phase-arg]
        │
        ▼
    Fresh Node process spawned
        │
        ▼
    readEnvelope() reads env vars + TTL check
        │
        ▼
    withISWC(envelope, async () => {
        │
        ├─▶ Preamble:
        │       • acquireLock() (if mutating)            [frame/lock.js]
        │       • ensureSchemaCurrent()                  [migrations/schema-migrator.js]
        │       • Check config hash drift → WARN + continue
        │       • heartbeat.tick('preamble')
        │       • buildIndex() if reads                  [data/index-builder.js]
        │           └─▶ computeSignals() on index        [observability/observability.js]
        │
        ├─▶ Body:
        │       • Mutation: write breadcrumb + atomic-write via atomic-write.js
        │       • Periodic heartbeat.tick(label)
        │       • Errors: throw ILEError(code, {context, ...})
        │
        ├─▶ Postamble (success):
        │       • detectReactiveProposals() if mutating
        │       • Orchestrator loop: render + y/n + applyProposal + append Change Log
        │       • Batch UX for >3 proposals
        │       • clearBreadcrumb() + releaseLock()
        │
        └─▶ Postamble (error):
            • Lock release (always)
            • Leave breadcrumb for /ile-sync recovery
            • ILEError serialized to stderr (JSON); process.exit(1)
    })
        │
        ▼
    Process exits → env vars persist for next Bash call
    │
    ▼
Claude proceeds to next workflow.md step (or end)
```

### Compliance Table Updates from Step 6

New N-rows from Step 6 passes:

| Pattern | N/L | Test file | Specific assertion | Affected |
|---|---|---|---|---|
| Frame-boundary direction | N | `frame-boundary.test.js` | grep for `frame/*` imports outside `frame/` itself or `_bmad/bme/_ile/workflows/` — zero matches | all lib subtrees |
| Doctor checks via registry | N | `doctor-registry-conformance.test.js` | every `.js` in `doctor/` (except `registry.js`) self-registers; registry enumeration matches directory | Doctor integration |
| Single team-config file | N | `ile-config-single-source.test.js` | exactly one file matches `_bmad/_config/ile*.yaml`; doctor reports multiple as `CONFIG-008` | `_bmad/_config/` |
| Unknown config keys warned | N | `unknown-config-keys.test.js` | `resolveConfig` fixture with unknown keys emits WARN matching expected key names | `resolveConfig` + logger |
| Workflow.md envelope initialization | N | `iswc-workflow-header.test.js` | every `workflow.md` starts with step-00 matching envelope-init pattern | all skill workflows |
| Fat-script entry structure | N | `entry-structure.test.js` | every `entries/*.js` exports `main`, has `require.main === module` guard, `main` accepts optional test overrides | fat-script entries |
| Split: workflow-step naming | N | `workflow-structure.test.js` | filenames match `/^step-\d{2}[a-z]?-[a-z0-9-]+\.md$/` | all skill step dirs |
| Split: test-layout directory presence | N | `test-layout.test.js` | `tests/lib/ile/`, `tests/integration/ile/`, `tests/fixtures/ile/` present; no flat-pattern files | test tree |
| Split: help.md presence per skill | N | `help-presence.test.js` | every skill dir has `help.md` | all skills |

### New/Updated Error Codes Surfaced in Step 6

Beyond the 20 seed codes (PRD FR48), architecture-phase discovery added:

- `CONFIG-006` (INFO) — archived logs detected at re-install
- `CONFIG-007` (WARN) — unknown config keys
- `CONFIG-008` (WARN) — multiple `_bmad/_config/ile*.yaml` files
- `CONFIG-009` (WARN) — cumulative config drift within workflows

Total CONFIG codes: 002–009 (7 codes). `registerCode` discipline (ADR-8) governs. Per PRD FR48, any addition goes through the error-registry at code time.

### To Incorporate in Step 7 (Validation)

- Coherence check: all 26+ N-row conformance tests exist as planned test files
- Coverage check: every Step 4 ADR has at least one enforcement mechanism (test or runtime gate)
- Coverage check: every Step 5 decision has at least one compliance-table row
- Coverage check: every PRD FR maps to at least one component/directory in the tree
- Coverage check: TAC1–TAC4 fixtures are scoped at appropriate levels
- Discovery tasks flagged for sprint 0:
  - Verify `scripts/bmad-validate-exports.js` existence (M-5)
  - Verify `ajv` presence in `package.json` (M-6)
  - Confirm BMAD v6.3 skill-namespace `SKILL.md` semantics vs. per-skill `SKILL.md` (M-3)

## Architecture Validation Results

Comprehensive validation run against the complete Steps 2–6 content. Four elicitation/party-mode passes and one focused gap analysis preceded this step; validation here is final coherence + coverage + readiness check before handoff to implementation.

### Coherence Validation — PASS

**Decision compatibility**: 8 ADRs + ISWC + Crash Recovery Model + 21 Cluster decisions + 3 Missing decisions + Hybrid Model addendum all compose without conflict. Cross-cutting traces:

- Lock discipline (ADR-4) + Heartbeat (Red Team) + Crash windows (ISWC) → all flow into ISWC preamble/postamble + tiered staleness
- In-memory index (ADR-1) + Observability compute (ADR-3) + NFR1/2 fixture → fit-to-SLO path clear
- ISWC + AsyncLocalStorage + Env Envelope (Hybrid) → context propagates cleanly within and across fat-scripts
- Registry pattern (error-registry, migration, validity-contracts, doctor-checks) → four registries with consistent idiom
- Atomic write + Change Log JSONL + Auditability → trust contract foundation holds

**Pattern consistency**: 26 N-rows in the Compliance Table, each with named test file and specific assertion. No identified contradiction between patterns. Cluster sequence 3 → 1 → 2 → 4 correctly places interface contracts before layout-derived decisions.

**Structure alignment**: Tree composes decisions 1:1 (ADR-1 → `data/index-builder.js`; ADR-4 → `frame/lock.js`; ISWC → `frame/skill-frame.js`; ADR-8 → `errors/`). No orphan decisions lacking tree placement. No orphan tree nodes lacking a decision.

### Requirements Coverage Validation — PASS (with sprint-0 verification note)

**9 FR capability areas, 63 FRs — all architecturally supported:**

| PRD area | FRs | Architectural home |
|---|---|---|
| 1. Intake/Qualifying/Lanes | 13 | `intake/`, `qualify/` workflows + `validity-contracts/` + `lanes.js` |
| 2. Portfolio Visibility | 9 | `portfolio-status/` workflow + `observability/portfolio-render.js` |
| 3. Reactive + Trust Contract | 7 | `reactive/` subtree + ISWC + `proposal.js` |
| 4. Observability Signals | 3 | `observability/observability.js` + unified active+archived log read |
| 5. Shared Data Model | 8 | `data/` + `data/schemas/` + `index-builder.js` |
| 6. Onboarding/Help/Error | 8 | `help.md` convention + `errors/` + `doctor/` |
| 7. Safety/Recovery | 4 | `crash-recovery.js` + `lock.js` + `/ile-sync` + `/ile-force-unlock` |
| 8. Schema/Migration | 7 | `migrations/` + `ensureSchemaCurrent()` + uninstall workflow |
| 9. Dev Tooling | 4 | `logger.js` + `/ile-log` + `/ile-logs-purge` |

**36 NFRs — all architecturally supported:**

Load-bearing NFRs explicitly verified:

- **NFR1/NFR2** (Performance SLO): ADR-3 CI fixture at 60/150/300 artifact scales
- **NFR9** (Trust contract 4 fixtures): `tests/fixtures/ile/uncertain-case-fixtures/` + `trust-contract-tac1.test.js`
- **NFR13** (Atomic writes): `atomic-write.js` + Compliance Table enforcement
- **NFR14** (INTERNAL error rate < 1%): ADR-8 runtime registry; observability counts via Change Log
- **NFR19** (v6.2/v6.3 compat): ADR-6 decided v6.3-gated
- **NFR21** (Portability via `bmad-validate-exports`): fixtures + CI matrix jobs; **sprint-0 discovery task M-5** to verify existing infrastructure
- **NFR23** (Schema-version cross-skill match): `convoke-doctor` + ILE doctor registry + install-time check
- **NFR35** (Fixture-shipping CI check): orphan-reference detection via `doctor-refs.test.js` + portability-matrix

Remaining 28 NFRs map to specific architectural decisions documented throughout Steps 4–6.

**Note**: NFR21 coverage is architecturally complete but depends on sprint-0 discovery confirming existing `bmad-validate-exports` infrastructure. Not architecture-blocking.

### Implementation Readiness Validation — PASS

**Decision completeness**: every ADR has decision + rationale + specifics + affects. Every Cluster decision has decision + rationale + specifics + N/L marking. Every Missing decision complete.

**Structure completeness**: tree is specific (files named, not placeholders). Every test file named in Compliance Table has a directory home. Every architectural concept has a code location or doc location.

**Pattern completeness**: all identified conflict-points addressed. Unenforceable patterns explicitly marked L (e.g., heartbeat tick-per-loop-iteration; unenforceable without AST analysis).

**Sprint-0 build order (tightened from Step 4 sequencing):**

1. `runtime/logger.js` (with AsyncLocalStorage + bootstrap fallback)
2. `runtime/paths.js`
3. `runtime/lanes.js`
4. `errors/error-registry.js` (registers 20+ seed codes + detailsShape)
5. `errors/errors.js` (`ILEError` class reads registry)
6. `frame/context-envelope.js`
7. `writes/atomic-write.js`
8. `frame/lock.js` + `frame/heartbeat.js`
9. `frame/skill-frame.js` (`withISWC` wraps it all)
10. `config/config.js` + `config/config-defaults.js`
11. `data/schemas/` (JSON Schemas authored)
12. `data/index-builder.js`
13. First conformance tests shipped: `error-contract`, `iswc-conformance`, `atomic-write-conformance`, `frame-boundary`, `paths-discipline`

### Gap Analysis

**Four items identified; all have resolutions proposed. None architecture-blocking.**

**Medium priority (address during sprint 0):**

1. **`/ile-force-unlock` skill surface vs. `--force-unlock` flag.** ADR-4 mentioned a flag; Step 6 introduced the slash-command skill. **Resolution**: `/ile-force-unlock` is the operator-facing slash-command skill (per slash-command-ux feedback rule); internally it invokes `entries/ile-force-unlock-entry.js` which calls `lock.js#releaseForced()` after explicit-word confirmation. The `--force-unlock` flag is the internal CLI fallback (fat-script invoked directly without skill wrapper). Both paths documented; skill is the canonical operator-facing surface.

2. **Schema migration rollback mechanism.** ADR-5 said "INTERNAL-002 + rollback" but multi-artifact migration halt-mid-way behavior was underspecified. **Resolution**: migrations are **resumable, not rollbackable**. Individual artifact writes are atomic (NFR13); per-file consistency guaranteed. Partial-state after halt is a mix of migrated + un-migrated artifacts. Next `ensureSchemaCurrent()` detects mixed state, resumes migration from un-migrated artifacts (migrations are idempotent per schema-semver discipline). Document in `docs/ile/concepts/crash-recovery-model.md`.

3. **LLM-host chained-invocation integration test.** Hybrid Model specifies envelope inheritance across parent → child skill invocation; no named integration test. **Resolution**: add `tests/integration/ile/chained-invocation.test.js` — parent script sets env vars, spawns child via `child_process.spawn`, child's `readEnvelope()` returns inherited envelope (with `envelopeSource: 'inherited'`). Added to Compliance Table as N.

**Minor (flag for implementation, not blocking):**

4. **`/ile-log` query UX underspecified.** Skill exists in tree + step files listed; query grammar undefined. **Resolution**: deferred to sprint-2 implementation-time decision. v1 minimum: filter by date range, invocationId, skillName, batchId, entry type. Logged as implementation story, not architecture gap.

### Sprint-0 Discovery Tasks (consolidated)

**From Step 6 / Step 7 validation:**

- Verify `scripts/bmad-validate-exports.js` (or equivalent) existence; extend if present, scope new utility if absent (M-5).
- Verify `ajv` in `package.json` dependencies; add if absent (M-6).
- Confirm BMAD v6.3 `SKILL.md` semantics at namespace level vs. per-skill (M-3).
- Document Gap 1 resolution (force-unlock slash-skill ↔ flag relationship) in concepts docs.
- Add `chained-invocation.test.js` + subprocess-spawn test helper.
- Document Gap 2 resolution (resumable-not-rollbackable migrations) in `crash-recovery-model.md`.

### Architecture Completeness Checklist

**Requirements Analysis** ✅
- [x] Project context thoroughly analyzed (Step 2: 8 first-class components + 4 extension patterns + 1 shared utility + 12 cross-cutting concerns in 3 layers)
- [x] Scale + complexity assessed (consulting-scale 60/150/300 fixture parametrization)
- [x] Technical constraints identified (BMAD v6.3, markdown+YAML, no-DB, single-user-per-repo)
- [x] Cross-cutting concerns mapped (ISWC, Crash Recovery Model, Error Contract, Registry pattern, Hybrid Model)

**Architectural Decisions** ✅
- [x] 8 ADRs documented with rationale + specifics (ADR-1 through ADR-8)
- [x] Technology stack specified (Node ≥18, Python ≥3.9, node:test, ulid, ajv)
- [x] Integration patterns defined (four registries, ISWC wrapper, Hybrid Model env envelope)
- [x] Performance considerations addressed (ADR-3 CI fixture, in-memory index, intra-invocation memoization)

**Implementation Patterns** ✅
- [x] 24 decisions + 3 missing patterns + 6 final-coherence refinements with N/L markings
- [x] Structure patterns defined (layout, naming, test placement)
- [x] Communication patterns specified (AsyncLocalStorage + env var envelope)
- [x] Process patterns documented (error emission, atomic writes, heartbeat, crash recovery, envelope TTL, config drift)

**Project Structure** ✅
- [x] Complete directory structure (every file named; no placeholders)
- [x] Component boundaries established (`frame/` BMAD-aware + other subtrees framework-neutral)
- [x] Integration points mapped (file-modification table + `bmm-dependencies.csv` stub + uninstall spec)
- [x] Requirements-to-structure mapping table

**Validation** ✅
- [x] Coherence verified (decisions + patterns + structure compose)
- [x] Requirements coverage verified (9 PRD areas + 36 NFRs)
- [x] Gap analysis completed (4 items; resolution proposed for each)
- [x] Sprint-0 discovery tasks named

### Architecture Readiness Assessment

**Overall Status: READY FOR IMPLEMENTATION**

**Confidence Level: HIGH**, with the following caveats:

- Sprint-0 discovery tasks must complete before implementation can proceed past the first week of sprint 0. None are architecture-blocking; they are infrastructure verifications.
- Gap 1 (force-unlock resolution) and Gap 3 (chained-invocation test) should be incorporated into the first implementation story as documented resolution + test additions.
- Gap 2 (migration resumable-not-rollbackable framing) should be documented in `docs/ile/concepts/crash-recovery-model.md` as part of sprint-0.

**Key Strengths**:

- Propose-before-commit trust contract enforced structurally (ISWC + reactive-detector + `proposal.js`), not just by convention
- Operator-covenant preserved ("operator is the resolver") through tiered lock staleness, batch UX forcing individual rejection, config-drift warn-and-continue
- Hybrid Model recognizes LLM-host process boundary reality rather than pretending single-process context
- 26 enforceable N-row compliance tests prevent most agent drift at CI time
- Four consistent registries (errors, migrations, validity-contracts, doctor-checks) simplify mental model

**Areas for Future Enhancement** (not v1; documented as Growth-phase options):

- Scratch-file diff-review proposals (ADR-7 Option B)
- Bounded-window observability aggregation (ADR-3 Option C)
- Cross-invocation persistent index (ADR-1 escape hatch)
- File-watch or git-hook reactive triggers (ADR-2 additive layer)
- `_ile.session.lock` for cross-fat-script exclusivity (ADR-4 growth)
- Reactive-check coalescing across chained invocations
- YAML-declarative validity-contract shortcuts (Cluster 3 D21)
- Custom ESLint rule for error codes (ADR-8 Option B)
- `scripts/lifecycle/scaffold-skill.js` (sprint-3 story)
- v6.2 backport (ADR-6 revisit trigger)

### Implementation Handoff

**AI Agent Guidelines**:

- Follow all ADRs (8) and Cluster decisions (21 + 3 missing + 6 coherence refinements) exactly as documented; deviation requires documented rationale
- Use ISWC (`withISWC` wrapper) for every skill — no exceptions without documented exemption
- All errors via `ILEError(code, details)`; codes registered in `error-registry.js` with `detailsShape`
- All paths via `scripts/lifecycle/lib/runtime/paths.js` helpers — no literal `.ile/`, `docs/ile/`, `change-log.jsonl` outside `paths.js` + fixtures
- All writes via `scripts/lifecycle/lib/writes/atomic-write.js`
- Heartbeat ticks at checkpoints in long operations (per file, per step, per batch item)
- Tests import via `tests/lib/ile/test-helpers.js` `runInISWC()` helper; avoid env var manipulation directly
- Four registries have same idiom: append-only, lazy-load, enumeration test

**First Implementation Priorities (sprint 0)**:

1. Build `runtime/`, `errors/`, `frame/context-envelope.js`, `writes/atomic-write.js`
2. Build `frame/lock.js` + `frame/heartbeat.js` + `frame/skill-frame.js`
3. Complete sprint-0 discovery tasks
4. Ship first conformance tests: `error-contract`, `iswc-conformance`, `atomic-write-conformance`, `frame-boundary`, `paths-discipline`
5. Scaffold `entries/` with one fat-script (`portfolio-status-entry.js` recommended — read-only, simplest to bootstrap)


