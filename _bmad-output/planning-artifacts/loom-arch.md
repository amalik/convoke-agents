---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
lastStep: 8
status: 'complete'
completedAt: '2026-03-22'
inputDocuments:
  - _bmad-output/planning-artifacts/prd-team-factory.md
  - _bmad-output/vortex-artifacts/vision-team-factory-2026-03-21.md
  - _bmad-output/vortex-artifacts/decision-scope-team-factory-2026-03-21.md
  - _bmad-output/vortex-artifacts/adr-assumption-map-team-factory-2026-03-22.md
  - _bmad-output/planning-artifacts/brief-gyre-2026-03-19.md
  - _bmad-output/planning-artifacts/report-prd-validation-team-factory.md
workflowType: 'architecture'
project_name: 'Team Factory'
user_name: 'Amalik'
date: '2026-03-22'
---

# Architecture Decision Document — Team Factory

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

---

## Project Context Analysis

_Enhanced through 4 elicitation rounds (Architecture Decision Records, Pre-mortem Analysis, Self-Consistency Validation, Graph of Thoughts) and 3 party mode sessions._

### Requirements Overview

**Functional Requirements:** 26 FRs across three progressive phases:
- **Phase 1 (7 FRs):** Architecture Reference — machine-consumable checklist organized around four quality properties, validated bidirectionally against Gyre
- **Phase 2 (17 FRs):** Add Team workflow — forced decision points, BMB delegation, integration wiring, overlap detection, spec file persistence, end-to-end validation
- **Phase 3 (2 FRs):** Extension workflows — Add Agent, Add Skill to existing teams

**Non-Functional Requirements:** 18 NFRs with architectural impact:

| NFR Cluster | Impact on Architecture |
|-------------|----------------------|
| Usability (NFR1-2) | Progressive disclosure drives step decomposition and concept budget per step (≤3) |
| Reliability (NFR3-4) | First-run validation and idempotency require deterministic generation paths. NFR3 scope bounded by validator coverage — structural pass ≠ semantic correctness (see Q3). NFR4 idempotency scoped to within-version — cross-version behavior is Q5. |
| Maintainability (NFR5-6) | Reference as runtime dependency; factory-authored code limited to 4 wiring formats |
| Compatibility (NFR7-8) | Output indistinguishable from native teams; fully local, Claude Code interaction model |
| Write Safety (NFR12-13, 15, 17) | Unified protocol: stage → validate → check (dirty-tree) → apply → verify. Per-write, not per-workflow. Additive only. No partial writes. |
| Discoverability (NFR10) | Entry point wired into 4 enumerated surfaces + intent-based routing via LLM reasoning |
| Recoverability (NFR9, 11) | Spec file resume; pinpointed error messages with step name + decision ID |
| Auditability (NFR16) | File manifest of created + modified files per factory run |
| Performance (NFR18) | Sequential per-agent, JIT loading, micro-file architecture |
| Security (NFR14) | Safe templating — no raw interpolation of user input into executable files |

### Scale & Complexity

Complexity varies by phase — separating prevents over-engineering early work:

| Dimension | Phase 1 | Phase 2 |
|-----------|---------|---------|
| Complexity Level | **Low** — single reference document | **Medium** — workflow + JS utilities + file writers |
| Primary Domain | Technical writing + structural analysis | BMAD workflow + JS utilities |
| Components | 1 (Architecture Reference) | ~6 (workflow steps, spec file, JS validators, format-aware writers, BMB templates, validation pipeline) |
| JS Utilities Needed | None | Directory validation, naming enforcement, cascade logic, config collision check, registration format, file manifest |
| Integration Surfaces | 0 (document only) | 8 (registry, config, refresh, validator, contracts, help CSV, activation XML, naming) |

### Technical Constraints & Dependencies

**Closed Constraints (settled in PRD — not open for debate):**

| # | Constraint | Source |
|---|-----------|--------|
| C1 | Factory runtime = BMAD workflow (step files + frontmatter) | PRD §10 |
| C2 | BMB integration = Template embedding (Option C) — factory loads shared templates directly | PRD §10 |
| C4 | Claude Code interaction model — fully local, no external tooling | NFR8 |
| C6 | Micro-file architecture, JIT loading, sequential per-agent processing | NFR18 |
| C7 | Additive-only shared file operations | NFR17 |
| C8 | BMB template externalization is a prerequisite gate (P1/P6), not an architecture choice | PRD §11 |

**Note:** C1-C8 are genuinely closed. However, FR3 (four quality properties) and FR17 (cascade by composition pattern) are **hypothesis-dependent** — they derive from A5' and A6' respectively, both "Test First / High lethality" in the assumption map. They will ship in v1 but the architecture should allow revision without rebuilding. See cross-cutting concern #8.

**Open Architectural Questions (to resolve in subsequent steps):**

| # | Question | Drives |
|---|---------|--------|
| Q1 | Architecture Reference format — how to make it consumable by three audiences: humans (reading), factory (parsing at runtime), and validator (checking compliance)? Minimum machine-extractable fields: required files per pattern, naming rules per entity type, registration entry format per wiring target, validation criteria per quality property. These fields become P2b acceptance criteria. | Phase 2 feasibility |
| Q2 | Format-aware writer design — four specialized writers (JS/YAML/CSV/XML), each ~30 lines with own validation. Generic abstraction adds indirection without shared logic. | Component architecture |
| Q3 | Validation layering — how do per-step, per-agent, and end-to-end validation compose? Must distinguish **structural validation** (files exist, names match, entries registered) from **semantic validation** (contracts are compatible, agent inputs match predecessor outputs, handoff artifact types align). NFR3's "first-run pass" is only as strong as what the validator checks. Semantic contract compatibility may exceed validator.js's current capability — architecture must decide where that validation lives. | Reliability architecture |
| Q4 | Spec file schema evolution — how does the schema handle future phase additions without breaking express mode? | Extensibility |
| Q5 | Factory evolution — how do reference changes affect teams created by prior factory versions? NFR4 idempotency is scoped within-version. When the reference changes (inevitable — A5' may fail, new patterns may emerge), do old spec files still produce valid output? Shapes whether versioned validation rules are built in from the start or retrofitted. | Long-term maintainability |

**Dependencies:**

| # | Dependency | Risk | Mitigation |
|---|-----------|------|------------|
| D1 | **Architecture Reference (HIGHEST RISK)** — Phase 2 is blocked if reference format fails machine consumption. Three consumers: human, factory workflow, validator. Format must be validated for triple consumption before Phase 2 begins. | High | P2 (human consumability test) + **P2b: factory-consumability spike** — write one reference section, then write a mock factory step that parses it. Acceptance criteria: factory can extract required files, naming rules, registration format, and validation criteria from the section without prose parsing. |
| D2 | BMB template externalization (P1/P6) — generation knowledge must be extracted as shared templates | Medium | Technical spike per PRD prerequisites |
| D4 | Existing validator.js — factory extends, does not replace | Low | — |
| D5 | agent-manifest.csv — overlap detection reads this at runtime | Low | — |
| D6 | config.yaml — field collision detection reads existing fields | Low | — |

### Cross-Cutting Concerns

**1. LLM/JS Boundary + Visibility** — The central design principle. Every factory operation must be classified: LLM reasoning (overlap detection, contract design, BMB curation, **Step 0 intent classification**) vs. JS deterministic (naming enforcement, cascade logic, config collision, file manifest). Step 0 is explicitly LLM-heavy — a colleague saying "I want to automate onboarding" requires reasoning about whether that's a team, an agent, or a skill. This cannot be keyword-routed. Misclassification in either direction degrades quality or reliability. Additionally, every operation carries a **visibility classification**: visible (shown to colleague for decision or approval) vs. silent (executed transparently). The concept budget (NFR2: ≤3 new concepts per step) constrains what crosses the visibility boundary. Example: Write Safety Protocol has 5 internal stages — the colleague sees only "Here's what will be added to agent-registry.js — approve?" The architecture must define the visibility boundary per step, not just the LLM/JS boundary.

**2. Write Safety Protocol** — NFR12, NFR13, NFR15, NFR17 together define a single pattern for all shared file operations:
```
Stage (prepare write in isolation)
  → Validate (check no collisions, format-correct, additive)
  → Check (dirty-tree detection IMMEDIATELY before write — not once at workflow start)
  → Apply (write to target)
  → Verify (re-read + re-parse full target file to confirm structural integrity post-write)
```
Dirty-tree check must run per-write, not per-workflow. The time gap between Step 0 and Step 5 (~40+ minutes) makes a startup-only check insufficient — the working tree can change between factory start and file write.

**3. Format Heterogeneity** — The 4 wiring formats have different atomicity and validation characteristics:

| Format | Target File | Atomicity | Validation Approach |
|--------|-------------|-----------|-------------------|
| JS | agent-registry.js | Structural — AST-parseable | Parse, validate export, append entry |
| YAML | config.yaml | Indentation-sensitive | Parse full file, validate no collision, serialize |
| CSV | module-help.csv | Positional — row-based | Validate header match, append row |
| XML | activation blocks (embedded in agent .md files) | Structured — but lives inside markdown, not standalone | Locate agent file, find activation section, parse XML fragment, validate schema, insert node |

**4. Context Window Pressure** — Micro-file architecture (NFR18) means each step loads only what it needs. Spec file is ground truth re-read at every step. Sequential per-agent processing avoids loading multiple agent contexts simultaneously. Architecture Reference sections must be individually addressable, not monolithic.

**5. Triple-Audience Reference** — The Architecture Reference must serve three consumers: humans (framework contributors reading it), the factory (parsing it at runtime for decision rules and validation criteria), and the validator (checking compliance against the same rules). This is D1's core tension — format choices that optimize for one consumer may degrade another. The factory-consumability spike (P2b) tests this before full commitment. Reference section granularity is constrained from both sides: small enough for JIT loading (concern #4) but large enough for meaningful machine extraction. This defines a **section size budget** — an explicit design parameter to resolve during Phase 1, not an emergent property.

**6. Mode Parity** — Any validation that runs in Guided Mode must also run in Express Mode, triggered differently but functionally equivalent. Key risk: Express Mode skips to Step 4 (Review), bypassing discovery-phase conversation — but FR12 (overlap detection), FR22 (naming enforcement), and FR16 (pattern-aware validation) must still execute against the spec file input. The architecture must ensure no validation is conversation-dependent — all checks must be runnable from spec file data alone.

**7. Intent-Based Discoverability** — NFR10 wires the factory into 4 surfaces (agent menu, module-help.csv, BMad Master, README). But discoverability is a natural language routing problem, not just a wiring problem. Step 0 is a **micro-discovery session** — colleagues don't know the word "team" in the BMAD sense. They describe problems ("I want to automate onboarding"), not solutions ("create a Sequential team"). Step 0 must classify intent through LLM reasoning, determine whether the need is a team, agent addition, or skill addition, and route accordingly. Colleagues who don't know what category their need falls into represent the majority case, not the edge case.

**8. Hypothesis Sensitivity** — Two core architectural choices are hypothesis-dependent, not PRD-settled:

| Component | Hypothesis | If Falsified |
|-----------|-----------|-------------|
| FR3 — Reference organized by four quality properties (Discoverable, Installable, Configurable, Composable) | A5' (High lethality, Medium uncertainty) | Reference structure, factory validation categories, and quality gate definitions need revision |
| FR17 — Cascade logic eliminates decisions by composition pattern (Independent, Sequential) | A6' (High lethality, Medium uncertainty) | Cascade tree, pattern-aware validation rules, and spec file schema need a third branch |
| Gyre bidirectional validation (FR6, P2) | A5', A6' | If reference organized by four properties can't predict Gyre's structure, the properties or patterns are wrong |

The Architecture Reference IS the test for A5'. Gyre validation IS the test for A6'. Both are "Test First" priority. The architecture should **isolate hypothesis-coupled components** so that revising four properties → three properties or adding a third composition pattern doesn't require rebuilding the factory's core workflow. Design for replaceability of these specific elements.

**Phase 1 instrumentation:** Self-instrumentation (#9) only produces data in Phase 2+. During Phase 1, Gyre validation is the hypothesis signal — it's the Phase 1 equivalent of the learning loop. Architecture should treat FR6/P2 results as formal A5'/A6' evidence, not just a prerequisite checkbox.

**9. Self-Instrumentation** — The spec file is not just state persistence — it's the factory's learning loop. Per-decision `default_accepted` flags reveal bad defaults. `pattern_fit` flags reveal model gaps (A6' validation). `hardest_step` and `would_use_again` reveal UX bottlenecks. Architecture must ensure: (a) metrics collection is non-intrusive — 2 post-completion questions + automatic fields captured throughout, (b) metrics don't disrupt the concept budget, (c) spec files are queryable across runs for trend analysis (decision override rates, pattern-fit distribution, step difficulty patterns). This is also the post-launch mechanism that validates A5' and A6' — if `pattern_fit: partial` accumulates, the composition model needs revision.

**Discovery tracking:** Add "How did you find the factory?" as a first-interaction question (before the 2 post-completion questions). This closes the observability gap on concern #7 — spec file metrics only exist for colleagues who found the factory. Discovery path data reveals whether intent-based routing works or whether colleagues arrive through other channels.

### Concern Activation by Phase

| Concern | Phase 1 (Reference) | Phase 2 (Factory) | Rationale |
|---------|:---:|:---:|-----------|
| #1 LLM/JS Boundary + Visibility | ◐ | ● | Phase 1: reference format decisions only. Phase 2: full boundary active. |
| #2 Write Safety Protocol | — | ● | No file writes in Phase 1. |
| #3 Format Heterogeneity | — | ● | No wiring in Phase 1. |
| #4 Context Window Pressure | ● | ● | Phase 1: section size budget. Phase 2: step loading. |
| #5 Triple-Audience Reference | ● | ◐ | Phase 1: format design. Phase 2: consumption only. |
| #6 Mode Parity | — | ● | No modes in Phase 1. |
| #7 Intent-Based Discoverability | ◐ | ● | Phase 1: reference organization for findability. Phase 2: Step 0 routing. |
| #8 Hypothesis Sensitivity | ● | ◐ | Phase 1: reference IS the A5'/A6' test. Phase 2: monitor only. |
| #9 Self-Instrumentation | — | ● | Phase 1: Gyre validation is the proxy signal (see #8). Phase 2: spec file metrics. |

● = primary · ◐ = secondary · — = not active

### Decision Routing: Q → Concerns

| Question | Primary Concerns | Secondary |
|----------|-----------------|-----------|
| Q1 — Reference format (triple-audience) | #5, #4, #8 | #1 |
| Q2 — Format-aware writer design | #3, #2 | #6 |
| Q3 — Validation layering (structural vs. semantic) | #6, #9 | #8 |
| Q4 — Spec file schema evolution | #9, #6 | #8 |
| Q5 — Factory evolution (cross-version) | #8, #9 | #5 |

_The architect loads only the primary concerns per decision. Secondary concerns are consulted if the primary analysis surfaces ambiguity._

### Structural Dependencies Between Concerns

**Reference Chain (#8 → #5 → #3 → #2):** Longest dependency chain — 4 nodes. If A5' fails, all 4 components cascade. Mitigate by decoupling: format-aware writers (#3) should consume a **format contract** (structured objects), not parse the reference directly. A reference parser translates reference format into the contract. If the reference restructures, only the parser changes.

**Visibility Funnel (#2 → #1 → #6):** The architectural seam between factory engine and factory UX. The visibility boundary (what the colleague sees vs. what runs silently) should be defined per step as a Phase 2 design artifact — not retrofitted after the engine is built. The ≤3 concept budget (NFR2) is enforced at this seam.

---

## Starter Template Evaluation

_Enhanced through 2 elicitation rounds (Critical Perspective Challenge, Self-Consistency Validation) and 2 party mode sessions._

### Primary Technology Domain

**BMAD Workflow + JS Utilities** — not a traditional software project requiring a starter template.

### Starter Assessment: Not Applicable (Framework Selection)

The Team Factory's runtime model is fully constrained by closed architectural decisions:

| Traditional Starter Decision | Team Factory Equivalent | Status |
|------------------------------|------------------------|--------|
| Language/Framework | BMAD workflow (markdown step files) + JS utilities | Settled (C1) |
| Build tooling | None — workflow files loaded at runtime by Claude Code | Settled (C4) |
| State management | Team spec file (YAML) | Settled (PRD §9) |
| Deployment | Local-only, installed via existing BMAD infrastructure | Settled (C4, NFR8) |
| Project structure | `_bmad/bme/` module structure with workflow steps | Settled (BMAD conventions) |

### Technical Foundation Decisions

#### 1. Factory JS Module Organization — RESOLVED

**Decision:** Option A — Module-internal at `_bmad/bme/_team-factory/lib/`

Every BMAD module keeps its code inside its module directory. The factory is a module, not framework infrastructure.

```
_bmad/bme/_team-factory/
  agents/
  workflows/
  schemas/
  lib/
    naming-enforcer.js
    cascade-logic.js
    collision-detector.js
    manifest-tracker.js
    writers/
      registry-writer.js
      config-writer.js
      csv-writer.js
      activation-writer.js
```

**Template location:** Not resolved here. Shared BMB templates cannot live inside the factory module (NFR6 requires shared templates; R-drift risk if duplicated). Template location depends on the shared-vs-factory-owned decision — resolve in Step 4 alongside BMB integration (C2).

**Hypothesis coupling note:** `lib/cascade-logic.js` and `schemas/team-spec-v1.schema.json` are a coupled pair — both A6'-dependent (composition patterns). If a third pattern emerges, both must be revised together. Track as a single revision unit.

#### 2. Spec File Architecture — FLAGGED FOR STEP 4

The spec file is the factory's central stateful component — read, written, validated, resumed from, consumed by Express Mode. It has four access patterns (audit trail, resume state, express mode input, metrics store) and is more complex than a simple config file.

**Key decisions deferred to Step 4** (where Q3 validation layering and Q4 schema evolution provide full context):
- Schema definition approach (JSON Schema file vs. inline validation)
- Parser/writer/differ module design
- Write safety for resume integrity
- Version evolution strategy for forward compatibility

#### 3. Factory-Specific Testing Strategy — RESOLVED

**Decision:** Split golden file testing by authorship. Explicit test boundary.

**Test boundary:** JS utilities and Express Mode pipeline are automated. Conversation flow (Guided Mode) is manual — tested via P2, P3 prerequisites and first real factory run.

| Test Layer | What It Tests | Approach |
|-----------|--------------|---------|
| Golden file — wiring | Factory-authored integration wiring (registry entries, config fields, CSV rows, activation blocks) | Exact match against golden files. Factory owns this output — stable across template changes. |
| Structural validation — generated content | Template-generated artifacts (agent files, workflow files) | Validator.js structural correctness. NOT golden file exact match — avoids breakage when shared templates change upstream. |
| Unit tests | Individual JS utilities (naming, cascade, collision, manifest) | Jest, reuse existing BMAD config |
| Regression | Factory operations don't break existing teams | Existing validator.js run against all teams post-factory-run |
| Conversation quality | Guided Mode UX | Manual: P2 (reference consumability), P3 (colleague test) |

**Fixture spec files (minimum 4):**

| Fixture | Tests |
|---------|-------|
| `fixtures/independent-single-agent.yaml` | Simplest path — 1 agent, no contracts, minimal config |
| `fixtures/sequential-three-agents.yaml` | Full path — 3 agents, 2 contracts, config fields, orchestration |
| `fixtures/malformed-missing-fields.yaml` | Error handling — missing required fields, invalid pattern, naming violations |
| `fixtures/collision-existing-agent.yaml` | Safety path — agent name collides with existing manifest entry. Tests collision detection, error messaging (NFR11), and graceful handling. |

#### 4. Template Substitution — RESOLVED

**Decision:** Hand-rolled safe replacer. No library dependency.

~20 lines of code. Whitelist-only variable names. Pattern: `template.replace(/\{\{(\w+)\}\}/g, (_, key) => safeVars[key] ?? throwUnknown(key))`. Variables validated against allowed set before substitution. No eval, no dynamic require, no template-generated code execution. NFR14 satisfied.

#### 5. File Types the Factory Produces/Consumes

| Type | Role |
|------|------|
| `.md` | Workflow step files, agent files, Architecture Reference |
| `.yaml` | Team spec file, config.yaml modifications |
| `.js` | Utility functions, agent-registry.js modifications, validator.js extensions |
| `.csv` | module-help.csv modifications |
| `.xml` | Activation blocks (embedded in agent .md files) |
| `.json` | Spec file schema definitions |

#### 6. Existing Infrastructure the Factory Extends

| File | How Factory Uses It |
|------|-------------------|
| `scripts/update/lib/validator.js` | Extends with pattern-aware rules |
| `scripts/update/lib/refresh-installation.js` | Extends with new module paths |
| `_bmad/_config/agent-manifest.csv` | Read for overlap detection |
| `_bmad/bmb/` | Shared templates consumed via Option C embedding |

---

## Core Architectural Decisions

_Enhanced through multiple elicitation rounds (Tree of Thoughts, Self-Consistency Validation, Debate Club Showdown, First Principles Analysis) and party mode sessions._

### Decision Priority Analysis

**Critical Decisions (resolved):**
- D-Q1: Architecture Reference format
- D-Q2: Format-aware writer design
- D-Q3: Validation layering
- D-S2: Spec file architecture
- D-TL: Template location

**Open Decision (deferred to Phase 1):**
- D-Q6: Registry fragment architecture

**Important Decisions (principles established, design deferred):**
- D-Q5: Factory evolution
- D-VB: Visibility boundary

### D-Q1: Architecture Reference Format — RESOLVED

**Decision:** Option B — Markdown with embedded YAML data blocks

**Format:**
- Single `.md` file — Architecture Reference
- Human-readable prose sections explain "why" (FR2)
- Fenced YAML blocks contain machine-extractable checklists with structured check IDs
- Factory and validator extract YAML blocks only — decoupled from heading structure

**Section granularity:** One section per quality property × composition pattern (~8 sections). Example: `## Discoverable — Independent`, `## Discoverable — Sequential`. Factory loads only the section matching the team's declared pattern. Optimized for JIT loading (concern #4).

**YAML block detection:** Structure-based, not convention-based. Factory identifies extractable blocks by presence of `quality_property`, `composition_pattern`, and `checks` top-level keys. Non-checklist YAML blocks (code examples, spec file samples) lack these keys and are ignored. Self-describing — no special syntax to remember when authoring.

**Check ID structure:**
```yaml
checks:
  - id: DISC-01
    rule: "Agent appears in module-help.csv"
    target_file: "_bmad/_config/module-help.csv"
    validation: "row exists with module={module_path}, agent={agent_name}"
```

**Drift prevention:** Prose references check IDs inline (e.g., "**DISC-01** — module-help.csv is the primary discovery surface because..."). Orphan detection: grep for check IDs in prose that no longer appear in YAML blocks.

**Hypothesis resilience (#8):** If A5' fails and the four quality properties change, YAML blocks update `quality_property` values and prose headings restructure. Factory parser extracts by fenced-block detection + key presence — survives restructuring without parser changes.

**Validation:** P2b spike — write one complete section (e.g., Discoverable — Independent) in this format, then write a mock extraction script. Acceptance criteria: script extracts all checks with IDs, rules, target files, and validation criteria without parsing prose.

### D-Q2: Format-Aware Writer Design — PARTIALLY RESOLVED

**Decision:** Not four writers — **1 writer, 2 creators, 1 validator.** Shared write-safety protocol applies only to the registry-writer.

**Module reclassification:**

| Module | Type | Operation | Safety Protocol |
|--------|------|-----------|----------------|
| `registry-writer.js` | **Writer** (shared file) | Add module block to agent-registry.js — agents, workflows, derived lists, exports. Full Write Safety Protocol + `node require()` post-write validation. | Full: stage → validate → check → apply → verify → require() |
| `config-creator.js` | **Creator** (new file) | Create per-module config.yaml at `_bmad/bme/_team-name/config.yaml`. | Simple: write → verify parse |
| `csv-creator.js` | **Creator** (new file) | Create per-module module-help.csv at `_bmad/bme/_team-name/module-help.csv` with header + rows. | Simple: write → verify header match |
| `activation-validator.js` | **Validator** (read-only) | Validate that BMB-generated activation blocks reference correct config paths and module paths. No file writes. | N/A — read-only |

**Shared-file risk surface:** Only `agent-registry.js`. The registry-writer must preserve exact JS export structure, derived lists, and module pattern. Post-write validation: `node -e "require('./agent-registry')"` confirms structural integrity.

**Note:** Registry-writer may be replaced entirely by D-Q6 (fragment-based registration). Decision pending.

**Real file structures (discovered during elicitation):**

| Target | Actual Structure | Operation |
|--------|-----------------|-----------|
| `agent-registry.js` | Per-module const blocks (AGENTS, WORKFLOWS, derived lists, module.exports). ~40-80 lines per module. | `add_module_block` |
| `config.yaml` | Per-module config files. New team = new file. | `create_module_config` |
| `module-help.csv` | Per-module CSV files. New team = new file with header + rows. | `create_module_csv` |
| Activation XML | Embedded in agent `.md` files. BMB templates generate these. | `validate_activation_paths` |

**Deferred to Phase 1 Architecture Reference:** Exact format contract schema per module — the reference defines integration surfaces (FR7), then the contract codifies them for the writers.

### D-Q3: Validation Layering — RESOLVED

**Decision:** Four validation layers with semantic validation via B-lite approach.

| Layer | When | What It Checks | Implementation | Mode |
|-------|------|----------------|---------------|------|
| **Per-step** | During factory flow (Steps 1-4) | Decision validity — naming, pattern consistency, collision, overlap | JS utilities + LLM reasoning | Both |
| **Per-agent** | During generation (Step 5) | Single agent structural completeness — files, naming, activation paths | JS validation + activation-validator | Both |
| **Semantic** | After contracts defined (Step 3) + spec validation (Express) | Contract compatibility — artifact type match between connected agents | JS type-match validator (~10 lines) + LLM content-level in Guided | Both (format-level) |
| **End-to-end** | After generation (Step 6) | Full team structural compliance + regression on existing teams | Extended validator.js + regression | Both |

**Semantic Validation — B-lite:**
Artifact types as constrained enum: `markdown | yaml | json | text | binary`. Validator checks `from_agent.outputs[artifact].type === to_agent.inputs[artifact].type`. Catches format mismatches (the 80% case). Content-level compatibility handled by LLM in Guided Mode; accepted gap in Express Mode for v1.

**Step 4 Dual Profile:**

| Mode | Step 4 Behavior |
|------|----------------|
| **Guided** | Display decision summary. Light re-confirmation. User approves. |
| **Express** | **Full validation gate.** All per-step + semantic checks run in batch against spec file before generation begins. |

**Validation Function Design Principle:** Every validation function is stateless — takes spec object as input, returns structured result. No conversation context dependency. Mode Parity guaranteed by construction.

**Regression optimization:** Default = all teams. `--changed-only` = new team + teams sharing wiring targets. Full regression on demand.

### D-S2: Spec File Architecture — RESOLVED

**Schema approach:** Per-pattern JSON Schema files — `team-spec-v1-independent.schema.json`, `team-spec-v1-sequential.schema.json`. Parser reads `composition_pattern`, selects matching schema. Flat schemas, no conditional logic. Third pattern = add third file. Hypothesis-resilient.

**Module design:**

| Module | Responsibility |
|--------|---------------|
| `spec-parser.js` | Load YAML → select schema by `schema_version` + `composition_pattern` → validate → return structured object |
| `spec-writer.js` | Serialize spec to YAML. Atomic write: `.tmp` → validate → rename. |
| `spec-differ.js` | Read `progress` section, confirm filesystem matches claimed state, return resume point |

**Rationale as structured data:**
```yaml
decisions:
  - step: orient
    decision: "Sequential — 3 agents with handoffs"
    default_accepted: true
    rationale: "User described sequential onboarding flow matching Sequential pattern"
```

**Progress tracking — atomic per-agent:**
```yaml
progress:
  orient: complete
  scope: complete
  connect: complete
  review: complete
  generate:
    task-runner: complete
    data-processor: pending
  validate: pending
```
Only write `complete` after full per-agent cycle (generate → wire → verify). Interrupted mid-cycle = `pending`, resume re-runs full cycle. Safe via FR23 idempotency.

**Write safety:** Atomic — `.tmp` → validate parse + schema → rename. No dirty-tree check (factory-owned).

**Version evolution (Q4):** Additive schema files. Migration function bridges versions. Factory detects old version at parse time, offers upgrade.

**Express Mode template:** `templates/team-spec-template.yaml` — commented skeleton for colleagues. Schema for machines, template for humans.

**Cross-spec reporting:** Separate utility, not spec-parser responsibility. Deferred to post-Phase 2.

### D-TL: Template Location — RESOLVED

**Decision:** `_bmad/core/resources/templates/`

```
_bmad/core/resources/
  excalidraw/              ← existing shared resources
  templates/               ← new — shared artifact templates
    agent-template.md
    workflow-template.md
    skill-template.md
    contract-template.md
```

**Rationale (First Principles):** Templates are extracted framework knowledge with multiple consumers (BMB, factory, future tools). `core/resources/` is the established home for shared non-code resources. Neither BMB nor factory owns what multiple modules need.

**P1/P6 externalization target:** BMB template spike writes here. Both BMB and factory consume from the same source — zero drift risk.

### D-Q6: Registry Fragment Architecture — OPEN (Deferred to Phase 1)

**Question:** Direct write to agent-registry.js (ship with registry-writer) vs. fragment-based registration (each team owns a registry fragment, agent-registry.js aggregates)?

**Strategic note:** If fragments win, the registry-writer (the most complex factory component — only shared-file writer with full Write Safety Protocol) is eliminated entirely. Replaced by a simple fragment-creator. Significant architectural simplification. Weight this decision accordingly during Phase 1.

Deferred — resolve during Phase 1 when P1/P6 spike reveals real template extraction mechanics and the Architecture Reference codifies integration surfaces.

### D-Q5: Factory Evolution — PRINCIPLE ESTABLISHED, DESIGN DEFERRED

**Principle:** Spec files are versioned (`schema_version`). Schemas are additive. Migration functions bridge versions. The factory never breaks a valid old spec file — it offers upgrade, not rejection.

**Deferred:** Cross-version behavior design deferred to post-v1. No version transitions exist yet.

### D-VB: Visibility Boundary — PRINCIPLE ESTABLISHED, MAPPING DEFERRED

**Principle:** Every factory operation classified visible or silent. Concept budget (≤3 per step) constrains what crosses the visibility boundary. Write Safety Protocol's 5 stages are silent — colleague sees only the approval prompt and result.

**Deferred:** Per-step visibility mapping deferred to Phase 2 workflow step authoring.

### Phase 1 Scope Expansion

Phase 1 is an **architecture validation phase**, not just "write a reference document":

| Phase 1 Deliverable | What It Validates |
|---------------------|------------------|
| Architecture Reference (Option B format) | A5' (four properties), A6' (two patterns), FR1-FR7 |
| P2b spike — factory-consumability test | D1 (reference format works for machine consumption) |
| Template externalization (P1/P6) | R1 (BMB templates extractable), D2 |
| D-Q6 investigation — registry fragments | Whether registry-writer exists or is replaced |
| P2 — human consumability test | A19 (colleague reads reference without mentoring) |
| P3 — colleague test | A22 (factory discoverable) |

**Phase 1 exit criteria:** All 6 deliverables complete. Phase 2 begins only after Phase 1 validates foundational assumptions.

### Decision Impact Analysis

**Implementation sequence:**
1. Phase 1: Architecture Reference + P2b + P1/P6 + D-Q6 + P2 + P3
2. Phase 2: Spec file modules → validation utilities → creators → registry-writer (or fragment-creator) → workflow steps → integration testing

**Cross-decision dependencies:**
- D-Q1 (reference format) feeds D-Q2 (format contract derived from reference)
- D-Q3 (validation layering) feeds D-S2 (spec file carries semantic type fields)
- D-TL (template location) feeds D-Q2 (writers know where templates live)
- D-Q6 (fragments) could eliminate registry-writer from D-Q2 entirely

---

## Implementation Patterns & Consistency Rules

_Enhanced through Code Review Gauntlet (3 senior reviewers) and party mode session (Bond/Amelia/Murat)._

### Governing Principle

> **Every factory output must be validated before write.**

All naming, structure, format, and process rules flow from this single enforcement principle. The five rules below are concrete applications.

### Naming Patterns

AI agents and humans use these conventions. **Authoritative enforcement is in JSON Schema files** — the regexes below are documented for human readability; schemas are the single enforcement point.

| Entity | Convention | Regex | Example |
|--------|-----------|-------|---------|
| Team module directory | `_bmad/bme/_` + kebab-case team name | `/^[a-z][a-z0-9]*(-[a-z0-9]+)*$/` | `_bmad/bme/_onboarding/` |
| Agent file | Role-based kebab-case `.md` | `/^[a-z]+(-[a-z]+)*\.md$/` | `task-runner.md` |
| Agent ID | Matches filename stem | `/^[a-z]+(-[a-z]+)*$/` | `task-runner` |
| Workflow file | Kebab-case `.md` | `/^[a-z]+(-[a-z]+)*\.md$/` | `process-data.md` |
| Spec file | `team-spec-{team-name}.yaml` | — | `team-spec-onboarding.yaml` |
| Schema file | `schema-{pattern}.json` | `/^schema-[a-z]+(-[a-z]+)*\.json$/` | `schema-independent.json` |
| JS utility | Kebab-case `.js` or `.mjs` | `/^[a-z]+(-[a-z]+)*\.(js\|mjs)$/` | `naming-enforcer.js` |
| Check ID | Semantic per property-pattern section | `{PROP}-{NOUN}(-{NOUN})*` | `DISC-MANIFEST-ENTRY`, `INST-REGISTRY-BLOCK` |

**Check ID namespace:** Controlled via `enum` arrays in per-pattern JSON Schema files. Each property section (`discoverability`, `installability`, `configurability`, `composability`) defines its valid check IDs. Validation rejects unknown IDs. The Architecture Reference lists IDs for human reference; schemas are authoritative.

### Structure Patterns

```
_bmad/bme/_team-factory/
  agents/
  workflows/
  schemas/
    schema-independent.json         ← per-pattern, naming regexes embedded
    schema-sequential.json
  lib/
    types/
      factory-types.js              ← canonical source for all shapes (JSDoc-typed)
    naming-enforcer.js
    cascade-logic.js
    collision-detector.js
    manifest-tracker.js
    writers/
      registry-writer.js            ← may be replaced by D-Q6
      config-creator.js
      csv-creator.js
      activation-validator.js
  templates/
    team-spec-template.yaml         ← Express Mode skeleton (commented)

_bmad/core/resources/templates/     ← shared BMB templates (P1/P6 target)
  agent-template.md
  workflow-template.md
  skill-template.md
  contract-template.md

tests/
  team-factory/
    unit/
    fixtures/
      independent-single-agent.yaml
      sequential-three-agents.yaml
      malformed-missing-fields.yaml
      collision-existing-agent.yaml
    golden/                          ← ≤50 lines per file, split by concern
      golden-registry-block.js
      golden-config.yaml
      golden-help-csv.csv
```

**Types definition file (`types/factory-types.js`):** Single entry point for all factory conventions. AI agents and IDE autocomplete consume this file.

Contains:
- `ValidationError` — `{ file: string, line?: number, message: string, rule: string, severity: 'error' | 'warning' | 'info', expected?: string, actual?: string }`
- Writer/creator result — `{ written: string[], skipped: string[], errors: ValidationError[] }`
- Progress entry — `'complete' | 'failed' | 'pending'`
- File manifest entry — `{ path: string, operation: 'created' | 'modified', module: string }`

### Format Patterns

| Format | Specification |
|--------|--------------|
| YAML indent | 2 spaces (BMAD standard) |
| JSON Schema | Draft-07 (existing BMAD usage) |
| Error output | `ValidationError` from `types/factory-types.js` — includes severity + expected/actual per NFR11 |
| File manifest | Array of `{ path, operation, module }` — generated per factory run (NFR16) |
| Check ID format | `{PROP}-{SEMANTIC-NAME}` — no sequential counters, no renumbering debt |

### Process Patterns

**Validation function signature:**
```javascript
// Every validator: stateless, spec-in → result-out
function validateNaming(spec) → { valid: boolean, errors: ValidationError[] }
```

**Writer/creator signature:**
```javascript
// Every writer/creator returns a composable result
function writeRegistryBlock(spec, options) → { written: string[], skipped: string[], errors: ValidationError[] }
```

**Idempotency rule:** Writers must be safe to re-run. If target exists and matches expected content, skip. If different, warn and require explicit overwrite flag. Never silently overwrite divergent content.

**Progress tracking with partial failure:** Spec file records per-step status: `complete | failed | pending`. On failure, the step's entry includes the error context. Resume (NFR9) skips `complete` steps, retries from first non-complete.

**Shared file writes (registry-writer only):** Read → parse full structure → modify in-memory → validate complete result → dirty-tree check → write → verify via re-parse + `require()`. Never append blindly. The writer receives and returns structured objects — parsing is the writer's responsibility.

**New file creation (creators):** Write to `.tmp` → validate parse → rename to target. Atomic. No dirty-tree check needed (factory-owned files).

### Golden File Testing

- Golden files must be **≤50 lines** — split by concern if larger (e.g., separate `golden-registry-block.js` and `golden-config.yaml`)
- Keeps `git diff` reviewable as the sole change explanation — no companion notes needed
- **Update workflow:** Run tests with `updateGolden: true` → `git diff` to review changes → commit. Test utilities must support this mode.
- Golden files test **factory-authored wiring only** — template-generated content uses structural validation (not exact match)

### Enforcement Rules

Applications of the governing principle — **every factory output must be validated before write:**

1. **Schema-first naming:** All naming rules are enforced via JSON Schema `pattern` properties. The architecture document lists conventions for human consumption; schemas are authoritative.
2. **Typed returns:** Every writer/creator returns `{ written, skipped, errors }`. Pipeline composition depends on this contract.
3. **Idempotent operations:** All writers safe to re-run. Skip matching content, warn on divergence, never silently overwrite.
4. **Atomic writes:** New files via `.tmp` → validate → rename. Shared files via full read-modify-write cycle with post-write verification.
5. **Regression by default:** End-to-end validation runs existing `validator.js` against all teams. `--changed-only` available for development speed.

---

## Project Structure & Boundaries

_Enhanced through Red Team vs Blue Team analysis (6 attacks, 4.5/6 Red score) and party mode session (Morgan/Amelia/Bond)._

### Requirements → Structure Mapping

**Phase 1 (FR1-FR7) — Architecture Reference:**

| FR | Component | Location |
|----|-----------|----------|
| FR1-FR5 (Reference content) | Architecture Reference document | `_bmad-output/planning-artifacts/architecture-reference-teams.md` |
| FR6 (Gyre bidirectional validation) | Validation notes appended to reference | Same file + Gyre team audit |
| FR7 (Integration surface documentation) | Reference YAML blocks with check IDs | Embedded in reference sections |

**Phase 2 (FR8-FR24) — Factory Workflow:**

| FR Cluster | Component | Location |
|------------|-----------|----------|
| FR8 (Orient — intent classification) | Module-level routing step | `workflows/step-00-route.md` |
| FR9 (Scope — agent inventory + contracts) | Workflow step | `workflows/add-team/step-01-scope.md` |
| FR10 (Connect — integration wiring) | Workflow step | `workflows/add-team/step-02-connect.md` |
| FR11-FR13 (Wiring + overlap + validation) | JS utilities | `lib/` (collision-detector, naming-enforcer, writers/) |
| FR14-FR16 (Express Mode + generation) | Spec parser + Express pipeline | `lib/spec-parser.js` + `schemas/` |
| FR17-FR18 (Cascade + defaults) | Cascade logic | `lib/cascade-logic.js` |
| FR19-FR21 (BMB delegation + preview + approval) | Workflow steps | `workflows/add-team/step-04-generate.md` |
| FR22-FR24 (Naming + idempotency + manifest) | Enforcement utilities | `lib/naming-enforcer.js`, `lib/manifest-tracker.js` |

**Phase 3 (FR25-FR26) — Extension Workflows (future):**

| FR | Component | Planned Location |
|----|-----------|-----------------|
| FR25 (Add Agent) | Separate workflow | `workflows/add-agent/` (created when Phase 3 begins) |
| FR26 (Add Skill) | Separate workflow | `workflows/add-skill/` (created when Phase 3 begins) |

No placeholder directories — locations documented here only.

### Complete Project Directory Structure

```
_bmad/
  bme/
    _team-factory/                              ← Factory module root
      config.yaml                               ← Module config + module metadata block
      module-help.csv                            ← Module discovery (NFR10)
      agents/
        team-factory.md                         ← Factory agent — BMAD Core compliant
                                                   (activation XML, persona, menu)
                                                   Registered via convoke-install, NOT self-bootstrapped
      workflows/
        step-00-route.md                        ← Module-level intent routing (FR8)
                                                   Routes to: add-team | add-agent | add-skill
        add-team/
          step-01-scope.md                      ← Agent inventory + contract decisions (FR9)
          step-02-connect.md                    ← Integration wiring decisions (FR10)
          step-03-review.md                     ← Decision summary + Express Mode gate (FR14)
          step-04-generate.md                   ← BMB delegation + file generation (FR19-FR21)
          step-05-validate.md                   ← End-to-end validation + manifest (FR16, FR24)
      schemas/
        schema-independent.json                 ← Spec schema: Independent pattern
        schema-sequential.json                  ← Spec schema: Sequential pattern
      lib/
        types/
          factory-types.js                      ← All type definitions (JSDoc-typed)
        spec-parser.js                          ← Load YAML → select schema → validate → return
        spec-writer.js                          ← Serialize → atomic .tmp → validate → rename
        spec-differ.js                          ← Resume point detection (NFR9)
        naming-enforcer.js                      ← Naming validation against schemas (FR22)
        cascade-logic.js                        ← Pattern-aware decision elimination (FR17) [A6'-coupled]
        collision-detector.js                   ← Agent/workflow overlap detection (FR12)
        manifest-tracker.js                     ← File manifest generation (FR24, NFR16)
        writers/
          registry-writer.js                    ← agent-registry.js block insertion [D-Q6 may replace]
          config-creator.js                     ← Per-team config.yaml creation
          csv-creator.js                        ← Per-team module-help.csv creation
          activation-validator.js               ← Activation block path validation (read-only)
      templates/
        team-spec-template.yaml                 ← Express Mode skeleton (commented)

  core/
    resources/
      templates/                                ← Shared BMB templates (D-TL)
        agent-template.md                          Created by P1/P6 spike — prerequisite for
        workflow-template.md                        any factory template consumption.
        skill-template.md                          Factory workflows that consume templates
        contract-template.md                        MUST run after P1/P6 completes.

tests/
  team-factory/
    spec-lifecycle/                             ← Parser, writer, differ, schema validation
      schema-regexes.test.js                       Regex known-good/known-bad validation
    naming-collision/                           ← Naming enforcer, collision detector
    wiring/                                     ← Registry-writer, config-creator, csv-creator,
                                                   activation-validator
    end-to-end/                                 ← Full pipeline, regression, manifest
    fixtures/
      independent-single-agent.yaml             ← Simplest path
      sequential-three-agents.yaml              ← Full path with contracts
      malformed-missing-fields.yaml             ← Error handling
      collision-existing-agent.yaml             ← Safety path
    golden/                                     ← ≤50 lines per file, split by concern
      golden-registry-block.js
      golden-config.yaml
      golden-help-csv.csv
      golden-manifest.json
    spikes/                                     ← Transient spike artifacts (P2b, etc.)
                                                   Deleted after spike validates/invalidates
```

### Module Config Schema

```yaml
# _bmad/bme/_team-factory/config.yaml
module:
  name: team-factory
  description: "Create BMAD-compliant teams"
  version: 1
  phase: 2
project_name: "BMAD-Enhanced"
user_skill_level: expert
planning_artifacts: "{project-root}/_bmad-output/planning-artifacts"
user_name: Amalik
communication_language: English
```

### Architectural Boundaries

**LLM/JS Boundary (Concern #1):**

| Step | LLM Reasoning | JS Deterministic |
|------|--------------|-----------------|
| Route (step-00) | Intent classification, workflow selection | — |
| Scope (step-01) | Agent inventory curation, contract decisions | Overlap detection (`collision-detector.js`) |
| Connect (step-02) | Integration decision guidance | Config collision detection |
| Review (step-03) | Summary presentation (Guided) | Full validation batch (Express) |
| Generate (step-04) | BMB delegation prompting, content curation | Template substitution, file writing |
| Validate (step-05) | — | End-to-end validation, regression, manifest |

**Module Boundary:**
- Factory module (`_bmad/bme/_team-factory/`) owns all factory-specific code
- Shared templates (`_bmad/core/resources/templates/`) consumed **read-only** — prerequisite: P1/P6 complete
- External write target: `scripts/update/lib/agent-registry.js` (via registry-writer)
- External read targets: `_bmad/_config/agent-manifest.csv`, existing team modules

**Bootstrap Boundary:**
- The factory agent (`team-factory.md`) is registered via `convoke-install` — the standard BMAD module installation process
- The factory creates OTHER teams' agents — it cannot create itself
- Agent file conforms to existing agent schema (activation XML, persona fields, menu) for `agent-registry.js` compatibility

**Write Boundaries:**

| Target | Writer | Safety Level |
|--------|--------|-------------|
| Spec file (factory-owned) | `spec-writer.js` | Atomic (`.tmp` → validate → rename) |
| Team module files (new) | BMB delegation + creators | Simple (write → verify) |
| `agent-registry.js` (shared) | `registry-writer.js` | Full Write Safety Protocol |
| Existing team files | **Never** — additive only (NFR17) | — |

**Data Flow:**
```
User intent → [LLM: step-00-route] → workflow selection
  → [LLM: step-01] → spec file created (YAML)
  → [LLM: step-02] → spec file updated with integration decisions
  → [JS: step-03 Express / LLM: step-03 Guided] → validated spec
  → [JS+LLM: step-04] → generated files + wiring
  → [JS: step-05] → validation report + file manifest
```

### Cross-Cutting Concern Locations

| Concern | Primary Location(s) |
|---------|-------------------|
| #1 LLM/JS Boundary | Workflow step files (LLM) vs. `lib/` (JS) |
| #2 Write Safety | `writers/registry-writer.js` + `lib/spec-writer.js` |
| #3 Format Heterogeneity | `lib/writers/` — one module per format |
| #4 Context Window | Steps load only their deps; spec file is JIT ground truth |
| #5 Triple-Audience Reference | `architecture-reference-teams.md` (Phase 1 output) |
| #6 Mode Parity | `schemas/` + `lib/` — all validation spec-driven, not conversation-dependent |
| #7 Intent Discoverability | `module-help.csv` + `step-00-route.md` |
| #8 Hypothesis Sensitivity | `cascade-logic.js` + `schemas/` — isolated, replaceable pair [A6'-coupled] |
| #9 Self-Instrumentation | Spec file `metrics` section + post-completion questions in step-05 |

### Hypothesis-Coupled Components (Isolation Map)

Components that must be revised together if A5' or A6' are falsified:

| Hypothesis | Coupled Components | Revision Unit |
|------------|-------------------|---------------|
| A6' (composition patterns) | `cascade-logic.js` + `schema-*.json` | Add third schema file + third cascade branch |
| A5' (four quality properties) | Architecture Reference sections + check ID enums in schemas | Restructure reference + update enums |
| Both | `spec-parser.js` (selects schema by pattern) | Update pattern enum |

All coupled components are isolated in the factory module — no framework-level changes needed for hypothesis revision.

---

## Architecture Validation Results

_Enhanced through Red Team vs Blue Team analysis (5 attacks, 4.5/5 Red score) and party mode session (Max/Mary/Murat)._

### Coherence Validation ✅

**Decision Compatibility:** All decision pairs verified — no contradictions. D-Q1→D-Q2→D-Q3→D-S2→D-TL form a coherent chain. D-Q6 (open) accommodated by either outcome.

**Pattern Consistency:** Naming (single enforcement in schemas), error shapes (single type definition), return types (composable results), atomic writes (two-tier safety), stateless validation (Mode Parity by construction) — all consistent across sections.

**Structure Alignment:** Every decision has a home in the project tree. Cross-cutting concerns mapped to specific locations. Hypothesis-coupled components isolated.

### Requirements Coverage Validation

**Functional Requirements: 24/26 covered + 2 deferred (Phase 3)**

| Status | FRs | Notes |
|--------|-----|-------|
| Covered | FR1-FR24 | All have architectural support with specific component locations |
| Deferred | FR25-FR26 | Phase 3 — Add Agent, Add Skill. Locations documented, step-00-route extensible. |

**FR6 (Gyre bidirectional validation) — output defined:** Gyre Validation Report (`gyre-validation-report.md`) in `_bmad-output/planning-artifacts/`. Three sections: (1) check results — pass/fail per check ID, (2) **surprising findings** — edge cases, near-misses, model limitation signals, (3) A5'/A6' evidence conclusions. Manual analysis, structured output.

**Non-Functional Requirements: 18/18 covered.** All NFR clusters have architectural support — usability, reliability, maintainability, compatibility, write safety, discoverability, recoverability, auditability, performance, security.

### Collision Detection — Three Levels

| Level | Detection | Implementation | Response |
|-------|-----------|---------------|----------|
| Level 1: Exact ID | Agent ID exists in `agent-manifest.csv` | JS — exact string match | **Block** |
| Level 2: Name similarity | Similar names (e.g., `data-processor` vs `data-handler`) | JS — edit distance / prefix match | **Warning** |
| Level 3: Capability overlap | Different names, overlapping responsibilities | LLM reasoning in Step 1 | **Advisory** |

Clarifies LLM/JS boundary: Step 1 uses both JS (Level 1-2) and LLM (Level 3) for overlap detection.

### Step-File-to-JS Invocation Pattern

When a workflow step requires JS validation, it includes a fenced code block with the exact invocation command and expected result handling:
```
run: node lib/collision-detector.js --spec {spec_path}
expect: result.errors.length === 0 → proceed
        result.errors.some(e => e.severity === 'error') → block and display
        result.errors.some(e => e.severity === 'warning') → display and ask
```
Step files are the bridge between LLM reasoning and JS execution — they must be explicit about which utilities to call, with what arguments, and how to interpret results.

### Template Consumption — Two Paths

| Path | Condition | Location | Risk |
|------|-----------|----------|------|
| **A (preferred)** | P1/P6 extraction succeeds | `_bmad/core/resources/templates/` | Zero drift |
| **B (fallback)** | P1/P6 extraction infeasible | `_bmad/bme/_team-factory/templates/internal/` | Known drift — periodic sync required |

Path B triggers a follow-up task to revisit extraction.

### Visibility Checklist Template

Every workflow step file must include this checklist:

```
## Visibility Checklist — Step {N}
Colleague sees:
  - [ ] (list visible decisions/prompts/previews — max 3 concepts)
Runs silently:
  - [ ] (list JS validations, file reads, collision checks)
Concept count: {N}/3
Approval prompt: "{what the colleague approves}"
```

Enforces ≤3 concept budget (NFR2) per step. Ensures consistency across step authors.

### Phase 1 Exit Criteria — Minimum Viable Thresholds

| Deliverable | Minimum Viable Threshold |
|-------------|-------------------------|
| Architecture Reference | All 8 property×pattern sections complete with ≥3 checks each |
| P2b factory-consumability spike | Extraction succeeds for ≥6 of 8 sections without prose parsing |
| P1/P6 template externalization | ≥3 of 4 template types successfully extracted |
| D-Q6 investigation | Clear recommendation with evidence — no "inconclusive" |
| P2 human consumability | Colleague articulates process for ≥2 of 3 scenarios without help |
| P3 colleague test | Colleague finds factory entry point without being told where it is |

Below threshold → iterate before Phase 2. Above threshold → proceed, document remaining gaps.

### Phase 1 Evidence → Assumption Map

All Phase 1 learnings route back to `adr-assumption-map-team-factory-2026-03-22.md`. Each "Test First" assumption gains an **Evidence** field:

| Assumption | Phase 1 Evidence Source |
|------------|----------------------|
| A5' (four quality properties) | Architecture Reference + Gyre Validation Report |
| A6' (composition patterns) | Architecture Reference + Gyre structural diff |
| A4 (Gyre follows Vortex model) | Gyre Validation Report — check-by-check |
| A12/A13 (BMB scaffolding/sub-workflow) | P1/P6 template externalization spike |
| A19 (colleague reads reference without mentoring) | P2 human consumability test |
| A22 (factory discoverable) | P3 colleague test |

Status transitions: "Test First" → "Tested — [Validated | Partially Validated | Falsified]" with evidence citations.

### Implementation Readiness Validation ✅

| Criterion | Status |
|-----------|:------:|
| All critical decisions documented | ✅ |
| Implementation patterns comprehensive | ✅ |
| Consistency rules enforceable | ✅ |
| Examples provided for major patterns | ✅ |
| Project structure complete with FR mapping | ✅ |
| Integration points specified | ✅ |
| Component boundaries clear | ✅ |
| Hypothesis isolation documented | ✅ |
| Test organization by behavior cluster | ✅ |
| Express Mode pipeline test defined | ✅ |

### Gap Analysis

**Critical Gaps: 0**

**Important Gaps: 1 (down from 2)**
- IG2: D-Q6 (fragment architecture) — resolved during Phase 1. Doesn't block Phase 1 work.
- ~~IG1: Visibility mapping~~ — resolved via visibility checklist template.

**Nice-to-Have Gaps: 3**
- NG1: No CI/CD pipeline (internal tool — manual for v1)
- NG2: No cross-spec reporting utility (post-Phase 2)
- NG3: No performance benchmarks (architectural constraints sufficient for v1)

### Architecture Completeness Checklist

**✅ Requirements Analysis (Step 2)**
- [x] Project context — 4 elicitation rounds, 3 party modes
- [x] Scale/complexity — Phase 1 Low / Phase 2 Medium
- [x] Constraints — C1-C8 closed
- [x] Cross-cutting concerns — 9 concerns with activation phases + routing table

**✅ Starter Evaluation (Step 3)**
- [x] Technology domain — BMAD Workflow + JS (no starter template needed)
- [x] Foundation decisions — module org, spec file flagged, testing, substitution

**✅ Core Decisions (Step 4)**
- [x] D-Q1 Reference format (Option B — markdown + YAML)
- [x] D-Q2 Writer design (1 writer, 2 creators, 1 validator)
- [x] D-Q3 Validation layering (4 layers + B-lite semantic)
- [x] D-S2 Spec file architecture (per-pattern schemas, 3 modules)
- [x] D-TL Template location (`core/resources/templates/`)
- [x] D-Q6 Registry fragments (open — Phase 1 investigation)

**✅ Implementation Patterns (Step 5)**
- [x] Naming with machine-checkable regexes in schemas
- [x] Structure with complete directory tree
- [x] Format with type definitions
- [x] Process with function signatures + idempotency
- [x] Enforcement with governing principle + 5 rules
- [x] Golden file testing with ≤50 line constraint

**✅ Project Structure (Step 6)**
- [x] Complete directory structure with FR mapping per file
- [x] Module/bootstrap/write boundaries defined
- [x] Module-level routing (step-00) for Phase 3 extensibility
- [x] Test clusters by behavior + Express Mode scenario
- [x] Hypothesis isolation map

**✅ Validation (Step 7)**
- [x] Coherence — all decisions compatible
- [x] Coverage — 24/26 FRs + 18/18 NFRs
- [x] Readiness — all criteria met
- [x] Gaps — 0 critical, 1 important (non-blocking), 3 nice-to-have
- [x] Collision detection levels defined
- [x] Phase 1 exit thresholds defined
- [x] Evidence routing to assumption map defined

### Architecture Readiness Assessment

**Overall Status:** READY FOR IMPLEMENTATION

**Confidence Level:** High — contingent on P1/P6 prerequisite validation. If Path B fallback is needed, confidence drops to Medium due to maintenance burden.

**Key Strengths:**
1. **Hypothesis-resilient** — A5'/A6' falsification requires isolated component changes, not rebuilds
2. **Phase-gated** — Phase 1 validates before Phase 2 builds; minimum viable thresholds prevent subjective "good enough"
3. **Mode Parity by construction** — stateless validators guarantee Express/Guided equivalence
4. **Single enforcement points** — schemas for naming, `factory-types.js` for shapes, governing principle for process
5. **Learning loop closed** — Phase 1 evidence routes back to assumption map

**Open Items (explicitly deferred, not gaps):**
- D-Q6: Registry fragment architecture (Phase 1 investigation)
- D-VB: Per-step visibility mapping (Phase 2 — template provided)
- D-Q5: Cross-version behavior (post-v1)

### Implementation Handoff

**First Priority:** Phase 1 — Architecture Reference

Sequence:
1. Write Architecture Reference (Option B format) — 8 property×pattern sections
2. Run Gyre bidirectional validation → Gyre Validation Report
3. Execute P2b spike — factory-consumability test
4. Execute P1/P6 — template externalization
5. Investigate D-Q6 — registry fragments
6. Run P2 — human consumability test with colleague
7. Run P3 — colleague discovery test

**AI Agent Guidelines:**
- Follow all architectural decisions exactly as documented
- Use implementation patterns consistently — schemas enforce, types define, governing principle governs
- Respect boundaries — module, bootstrap, write, LLM/JS
- Include visibility checklist in every workflow step file
- Route Phase 1 evidence back to assumption map
- Refer to this document for all architectural questions
