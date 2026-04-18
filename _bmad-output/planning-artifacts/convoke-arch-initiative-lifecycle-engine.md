---
stepsCompleted:
  - step-01-init
  - step-02-context
  - step-03-starter
  - step-04-decisions
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
status: draft
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

