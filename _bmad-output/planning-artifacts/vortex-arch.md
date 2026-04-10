---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
lastStep: 8
status: 'complete'
completedAt: '2026-02-23'
inputDocuments:
  - _bmad-output/planning-artifacts/prd.md
  - _bmad-output/planning-artifacts/product-brief-Convoke-2026-02-22.md
  - _bmad-output/planning-artifacts/implementation-readiness-report-2026-02-23.md
  - docs/agents.md
  - docs/development.md
  - docs/testing.md
workflowType: 'architecture'
project_name: 'Convoke'
user_name: 'Amalik'
date: '2026-02-23'
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## Project Context Analysis

### Requirements Overview

**Functional Requirements (52)** across 12 capability areas:
- 3 new agents: Mila (Synthesize), Liam (Hypothesize), Noah (Sensitize)
- 10 handoff contracts (HC1-HC10) with schemas
- Compass routing in all 7 agents
- Agent registry as single source of truth
- Migration system updates (1.5.x → 1.6.0)
- Backward compatibility with 4 existing agents

**Non-Functional Requirements (26)** across 6 categories:
- Content quality, developer experience, infrastructure resilience, testing coverage, performance, maintainability

### Scale & Complexity

- **Primary domain:** Content platform + CLI tooling (Node.js)
- **Complexity level:** Medium-High
- **Estimated components:** 3 agents, 9 workflows, 10 contract schemas, registry expansion, migration entries, validator updates

### Architectural Findings (17 items)

| # | Source | Finding | Implication |
|---|--------|---------|-------------|
| A1 | ADR | Contract taxonomy: artifact (HC1-5) vs routing (HC6-10) | Different schema complexity per type |
| A2 | ADR | Three routing mechanisms: schema/decision/flag-driven | Each needs distinct Compass UX |
| A3 | ADR | Modification surface: registry, validator, migration, postinstall | 4 infrastructure files change |
| A4 | ADR | Emma is read-only in Wave 3 | Three-way routing lives in other agents' Compass |
| R1 | Red Team | Infrastructure change surface understated in PRD | FR48 CI + registry + validator + migration = significant |
| R2 | Red Team | All 13 existing Compass instances verified in final steps | Consistent pattern to follow for new agents |
| R3 | Red Team | Mid-workflow routing (HC9, HC10) has no codebase precedent | New pattern needed — but can be phased (see P2) |
| R4 | Red Team | Workflow naming blocks migration entry design | Must resolve names before architecture Step 3 |
| G1 | Graph | Isla is gravity well: 3 inbound from 3 agents, 3 mechanisms | Needs re-entry mode and multi-shape intake |
| G2 | Graph | Max is pure decision hub: artifacts in, decisions out | Richest Compass decision criteria of any agent |
| G3 | Graph | Two feedback loops at different timescales | Strategic (end-of-workflow) vs tactical (mid-workflow) |
| G4 | Graph | Registry has 5 downstream dependents | Keep routing topology separate (see P1) |
| G5 | Graph | Wade is least integrated (linear pipeline) | Noah's HC10 provides indirect quality check |
| G6 | Graph | Contract types align with Diamond boundaries | Organize contracts by diamond, not by number |
| P1 | Party | Keep routing topology separate from agent registry | Different concerns, different change frequencies |
| P2 | Party | Phase mid-workflow routing for Wave 3.0 | Ship HC9/HC10 as Compass guidance; add interrupt pattern in 3.1 if needed |
| P3 | Party | Workflow naming is the only true blocker | Resolve before architecture Step 3 |

### Technical Constraints & Dependencies

- Must preserve all 4 existing agents without regression
- Node.js ecosystem, npm package distribution
- Migration system must handle 1.5.x → 1.6.0 upgrade path
- Registry schema expansion cascades to 5 dependents
- Workflow naming decision blocks migration entry design

### Cross-Cutting Concerns

- Mid-workflow routing pattern — phased: Compass guidance in 3.0, interrupt pattern in 3.1
- Separate routing manifest for contract topology (not in agent registry)
- Isla re-entry mode for flag-triggered re-investigation
- Workflow naming convention resolution (blocker)

## Starter Template Evaluation

### Primary Technology Domain

**Brownfield Extension** — Convoke is an existing Node.js CLI/content platform (npm package). Wave 3 extends the current codebase rather than scaffolding a new project.

### Existing Stack (Continuation)

| Layer | Technology | Status |
|-------|-----------|--------|
| Language | JavaScript (ES2020+, no TypeScript) | Unchanged |
| Runtime | Node.js | Unchanged |
| Package manager | npm | Unchanged |
| Testing | `node:test` + c8 coverage | Unchanged |
| Linting | ESLint | Unchanged |
| Build tooling | None (raw JS, no transpilation) | Unchanged |
| Distribution | npm (`convoke`) | Unchanged |
| Content format | Markdown (.md) with YAML frontmatter | Unchanged |

### Starter Decision: No New Scaffolding Required

**Rationale:** Wave 3 is primarily a content release (3 agents, 9 workflows) with infrastructure updates to existing JS modules (registry, validator, migration, manifest). All new code extends established patterns. No new frameworks, dependencies, or tooling changes are warranted.

**What Wave 3 adds to the existing stack:**
- 3 new agent `.md` files following established naming conventions
- 40-54 new workflow step `.md` files (9 workflows × 4-6 steps each)
- Registry entries for 3 new agents (extend `AGENTS` array)
- Validator expectations for 7 agents (up from 4)
- Migration entry for 1.5.x → 1.6.0 upgrade path
- Manifest CSV generation for 7 agent personas

**Note:** First implementation story should be registry expansion + validator update, not project initialization.

## Core Architectural Decisions

### Decision Summary

| # | Decision | Resolution | Validated |
|---|----------|-----------|-----------|
| D1 | Workflow naming (9 workflows) | 3 per agent — names finalized | Self-consistency ✅ |
| D2 | Contract schema format | Option A: YAML frontmatter + markdown, optional `input_artifacts` | Self-consistency ✅, Party amended |
| D3 | Registry schema expansion | No schema change; extend AGENTS (4→7) and WORKFLOWS (13→22) | Self-consistency ✅, Party clarified |
| D4 | Compass table variants | Uniform format across all routing types | Self-consistency ✅ |
| D5 | Isla re-entry mode | Deferred to 3.1; existing workflows handle context naturally | Self-consistency ✅ |
| D6 | Migration strategy | Single 1.5.x→1.6.0 entry; delta updates config, refresh handles files | Self-consistency ✅ |
| D7 | Build order & epic structure | Contracts → Mila → Liam → Noah; 5 epics total | Self-consistency ✅, Party expanded, Razor amended |
| D8 | Workflow template directories | FR49 relaxed — no `template/` dirs; artifacts via step-file guidance | Codebase verified ✅ (P23) |

### D1: Workflow Naming (9 Workflows)

| Agent | Workflow 1 | Workflow 2 | Workflow 3 |
|-------|-----------|-----------|-----------|
| Mila | `research-convergence` | `pivot-resynthesis` | `pattern-mapping` |
| Liam | `hypothesis-engineering` | `assumption-mapping` | `experiment-design` |
| Noah | `signal-interpretation` | `behavior-analysis` | `production-monitoring` |

9 workflows × 4-6 steps each = 40-54 new step files + 9 workflow directories. *(Amended: step count relaxed from fixed 6 to 4-6 per Occam's Razor R3)*

### D2: Contract Schema Format

**Artifact contracts (HC1-HC5):** YAML frontmatter + markdown body.

```yaml
---
contract: HC2
type: artifact
source_agent: mila
source_workflow: research-convergence
target_agents: [liam]
input_artifacts: []  # optional — populated when multiple inputs consumed
created: {{date}}
---
```

**Routing contracts (HC6-HC10):** No artifact file. Compass table entries carry decision context within conversation.

### D3: Registry Schema Expansion

No schema change. Extend existing arrays:
- AGENTS: 4→7 entries (add Mila, Liam, Noah with same `{ id, name, icon, title, stream, persona }` shape)
- WORKFLOWS: 13→22 entries (add 9 with same `{ name, agent }` shape)

**Validator scope:** Checks workflow directory existence only, not individual step file completeness. Content quality is validated by agents during workflow execution, not by infrastructure tooling.

### D4: Compass Table Format

Uniform across all routing types: `| If you learned... | Consider next... | Agent | Why |`

Routing type distinction (schema-driven, decision-driven, flag-driven) lives in row content, not table structure.

### D5: Isla Re-entry Mode

Deferred to Wave 3.1. Existing Isla workflows handle context naturally — users arrive with context from Liam/Noah Compass guidance. HC9/HC10 ship as Compass table rows in source agents (phased approach per P2).

### D6: Migration Strategy

Single `1.5.x-to-1.6.0.js` migration entry. Delta logic updates config (agents 4→7, workflows 13→22). `refreshInstallation()` handles all file copying recursively via `fs.copy`.

### D7: Build Order & Epic Structure

**Development sequence:** Contracts → Mila → Liam → Noah (per PRD). Single npm release as v1.6.0.

**Epic structure (5 epics):** *(Amended: Epic 0 merged into Epic 1 per Occam's Razor R5)*

| Epic | Scope | Dependencies |
|------|-------|-------------|
| Epic 1: Infrastructure + Contracts | HC1-HC5 schemas, compass-routing-reference.md, registry (D3), validator, migration (D6), manifest | None |
| Epic 2: Mila | Agent + 3 workflows + user guide + Compass | Epic 1 |
| Epic 3: Liam | Agent + 3 workflows + user guide + Compass | Epic 1 |
| Epic 4: Noah | Agent + 3 workflows + user guide + Compass | Epic 1 |
| Epic 5: Integration | Update Isla/Wade/Max Compass tables (FR30-32), docs | Epics 2-4 |

### Integration Work (FR30-32)

Existing agents require Compass table updates to route to new agents:
- **Isla** (FR30): Add Compass routes to Mila for convergence after discovery
- **Wade** (FR31): Add Compass routes to Noah for production signal interpretation
- **Max** (FR32): Add Compass route to Mila (not only Emma) for pivot scenarios

## Implementation Patterns & Consistency Rules

### Content File Patterns

**Agent Definition Files:**
- **Canonical template:** Use Isla (`discovery-empathy-expert.md`) as reference — newest agent, confirmed identical structure to Emma
- **Structure:** Frontmatter → Activation block (XML) → Persona block → Menu block
- **Persona consistency:** Agent `.md` persona section must match registry persona fields (`role`, `identity`, `communication_style`, `expertise`)
- **Frontmatter:** `name` (lowercase with spaces), `description` (title case)

**Workflow Step Files:**

| Step | Purpose | Filename Pattern |
|------|---------|-----------------|
| 1 | Setup & input validation | `step-01-setup.md` (standardized) |
| 2 | Context loading & analysis | `step-02-context.md` (standardized) |
| 3 | Core activity | `step-03-{activity}.md` (workflow-specific) |
| 4 | Deepening/iteration | `step-04-{activity}.md` (workflow-specific) |
| 5 | Synthesis & output preparation | `step-05-synthesize.md` (standardized) |
| 6 | Compass routing | `step-06-synthesize.md` (standardized) |

Steps 1, 2, 5, 6 use fixed descriptors. Steps 3-4 are workflow-specific.

**Step Count Rule (RF1):** Minimum 4 steps, maximum 6. Every workflow must include: `step-01-setup.md` (standardized), `step-02-context.md` (standardized), at least 1 core activity step (workflow-specific), and a final Compass step (standardized). Middle steps (3-4, optionally 5) are workflow-specific and determined by the workflow's complexity.

**Contract Artifact Files:**
- Filename convention: `{contract-id}-{descriptor}.md` (e.g., `hc2-problem-definition.md`)
- Located in `_bmad-output/vortex-artifacts/`
- YAML frontmatter per D2 schema

### Code Patterns (JS Modules)

**Registry entries:**
- AGENTS array ordered by Vortex stream number (1-7): Emma, Isla, Mila, Liam, Wade, Noah, Max
- Field ordering: `id, name, icon, title, stream, persona`
- WORKFLOWS grouped by agent with comments, ordered by agent stream number

**Naming conventions (carry forward):**
- Agent files: `role-name-with-dashes.md`
- Workflow dirs: `action-noun-with-dashes/`
- Step files: `step-0N-descriptor.md`
- User guides: `AGENTNAME-USER-GUIDE.md`
- JS variables: camelCase
- JS filenames: kebab-case

### Compass Routing Reference

**Required routes per agent (checklist for Step 6 implementers):**

| Agent | Must route to | Contract | Condition |
|-------|-------------|----------|-----------|
| Emma | Isla | HC1 | After contextualization |
| Isla | Mila | — | After discovery (FR30) |
| Mila | Liam | HC2 | After convergence |
| Liam | Wade, Isla* | HC3, HC9* | After hypothesis; *flag if unvalidated assumption |
| Wade | Noah | HC4 | After experiment graduation |
| Noah | Max, Isla* | HC5, HC10* | After signal interpretation; *flag if anomaly |
| Max | Emma, Mila, Liam | HC6, HC7, HC8 | Pivot/reframe/continue decisions |

*HC9/HC10 ship as Compass guidance rows in Wave 3.0 (phased per P2).*

**Deliverable:** Create `_bmad/bme/_vortex/compass-routing-reference.md` as a living repo file (Epic 1). This file is the **authoritative** routing reference; the table above is an architecture snapshot (P22).

### D8: Workflow Template Directories (FR49 Resolution)

**Decision:** FR49 ("every workflow directory has a template subdirectory") is relaxed for Vortex workflows. No existing Vortex workflow has a `template/` directory (verified via codebase check, P23). Wave 3 workflows produce artifacts via step-file guidance embedded in the final step, not via separate output templates. This is consistent with the established codebase pattern.

### Failure Mode Mitigations

| # | Risk | Prevention |
|---|------|------------|
| FM1 | Template drift | Use Isla as canonical template |
| FM2 | Step 6 name inconsistency | Standardized as `step-06-synthesize.md` |
| FM3 | Artifact filename collision | Use `{contract-id}-{descriptor}.md` |
| FM4 | Registry insertion ambiguity | Order by Vortex stream number (1-7) |
| FM5 | Persona bleed between similar agents | Distinctiveness review per agent pair |
| FM6 | Incomplete Compass tables | Routing reference table as checklist |

### Enforcement Guidelines

**All AI Agents implementing Wave 3 MUST:**
1. Use Isla as the canonical agent definition template
2. Follow the 6-step workflow pattern with standardized step names (1,2,5,6)
3. Place Compass in Step 6 with uniform table format (D4)
4. Verify Compass completeness against routing reference table
5. Use contract frontmatter schema from D2 for all artifact outputs
6. Match agent `.md` persona to registry persona fields
7. Extend registry arrays without changing existing entry shapes (D3)
8. Run full test suite (`npm test` + `npm run test:integration`) after infrastructure changes
9. Run `npm run lint` before committing

**Anti-Patterns:**
- Creating new utility modules when existing ones suffice
- Adding unexpected fields to registry entries
- Changing Compass table format for "special" routing types
- Hardcoding version strings (use `getPackageVersion()`)
- Using `process.cwd()` (use `findProjectRoot()`)
- Running only unit tests after registry/validator/migration changes

## Project Structure & Boundaries

### Complete Project Directory Structure

Items marked with ⭐ are new in Wave 3. All other items exist today.

```
Convoke/
├── package.json                                    # MODIFY: version 1.5.x → 1.6.0
├── CHANGELOG.md                                    # MODIFY: add v1.6.0 entry
├── README.md                                       # MODIFY: update agent count, add new agents
├── docs/
│   ├── agents.md                                   # MODIFY: add Mila, Liam, Noah sections
│   ├── development.md
│   └── testing.md
│
├── _bmad/bme/_vortex/
│   ├── compass-routing-reference.md                ⭐ NEW: living routing checklist (Epic 1)
│   ├── agents/
│   │   ├── contextualization-expert.md             # Emma (unchanged)
│   │   ├── discovery-empathy-expert.md             # Isla (unchanged)
│   │   ├── lean-experiments-specialist.md          # Wade (unchanged)
│   │   ├── learning-decision-expert.md             # Max (unchanged)
│   │   ├── research-convergence-specialist.md      ⭐ NEW: Mila (Epic 2)
│   │   ├── hypothesis-engineer.md                  ⭐ NEW: Liam (Epic 3)
│   │   └── production-intelligence-specialist.md   ⭐ NEW: Noah (Epic 4)
│   │
│   ├── guides/
│   │   ├── EMMA-USER-GUIDE.md                      # (unchanged)
│   │   ├── WADE-USER-GUIDE.md                      # (unchanged)
│   │   ├── ISLA-USER-GUIDE.md                      # (unchanged)
│   │   ├── MAX-USER-GUIDE.md                       # (unchanged)
│   │   ├── MILA-USER-GUIDE.md                      ⭐ NEW (Epic 2)
│   │   ├── LIAM-USER-GUIDE.md                      ⭐ NEW (Epic 3)
│   │   └── NOAH-USER-GUIDE.md                      ⭐ NEW (Epic 4)
│   │
│   └── workflows/
│       ├── (13 existing workflow dirs — unchanged)
│       │
│       ├── research-convergence/                    ⭐ Mila workflow 1 (Epic 2)
│       │   └── steps/
│       │       ├── step-01-setup.md
│       │       ├── step-02-context.md
│       │       ├── step-03-*.md ... step-0N-*.md   # 4-6 steps per workflow
│       │       └── step-0N-synthesize.md            # final step = Compass
│       ├── pivot-resynthesis/                       ⭐ Mila workflow 2 (Epic 2)
│       │   └── steps/ ...
│       ├── pattern-mapping/                         ⭐ Mila workflow 3 (Epic 2)
│       │   └── steps/ ...
│       ├── hypothesis-engineering/                   ⭐ Liam workflow 1 (Epic 3)
│       │   └── steps/ ...
│       ├── assumption-mapping/                       ⭐ Liam workflow 2 (Epic 3)
│       │   └── steps/ ...
│       ├── experiment-design/                        ⭐ Liam workflow 3 (Epic 3)
│       │   └── steps/ ...
│       ├── signal-interpretation/                    ⭐ Noah workflow 1 (Epic 4)
│       │   └── steps/ ...
│       ├── behavior-analysis/                        ⭐ Noah workflow 2 (Epic 4)
│       │   └── steps/ ...
│       └── production-monitoring/                    ⭐ Noah workflow 3 (Epic 4)
│           └── steps/ ...
│
├── scripts/
│   ├── postinstall.js                              # MODIFY: dynamic agent list from registry
│   ├── install-vortex-agents.js                    # MODIFY: manifest generation for 7 agents
│   └── update/
│       ├── lib/
│       │   ├── agent-registry.js                   # MODIFY: AGENTS 4→7, WORKFLOWS 13→22, reorder by stream
│       │   ├── validator.js                        # MODIFY: expect 7 agents, 22 workflows
│       │   ├── config-merger.js                    # MODIFY: default agents/workflows arrays
│       │   ├── refresh-installation.js             # (unchanged — recursive fs.copy handles new dirs)
│       │   ├── migration-runner.js                 # (unchanged — orchestration)
│       │   └── utils.js                            # (unchanged)
│       └── migrations/
│           ├── registry.js                         # MODIFY: add 1.5.x→1.6.0 entry
│           └── 1.5.x-to-1.6.0.js                  ⭐ NEW: migration delta
│
├── tests/
│   ├── helpers.js
│   ├── unit/
│   │   ├── agent-registry.test.js                  # MODIFY: expect 7 agents, 22 workflows
│   │   ├── validator.test.js                       # MODIFY: expect 7 agents, step-count smoke test
│   │   ├── config-merger-negative.test.js
│   │   ├── migration-runner-orchestration.test.js
│   │   └── 1.5.x-to-1.6.0.test.js                 ⭐ NEW: migration delta tests
│   └── integration/
│       ├── convoke-doctor.test.js
│       ├── cli-entry-points.test.js
│       └── installer-e2e.test.js
│
└── _bmad-output/
    └── vortex-artifacts/                           # Runtime output (user-generated, not shipped)
        └── (HC1-HC5 artifacts created during workflow execution)
```

### Architectural Boundaries

**Content Boundary:**
- Agent `.md` files, workflow step `.md` files, and user guides are *content* — authored by humans/AI, shipped via npm
- Contract artifact files (`_bmad-output/vortex-artifacts/`) are *runtime output* — generated by agents during workflow execution, never shipped in the package
- `compass-routing-reference.md` is a *living reference* — shipped in package, updated as routing evolves

**Infrastructure Boundary:**
- `scripts/update/lib/` modules are the infrastructure layer — registry, validator, migration, config
- These modules are the highest-risk change surface; all changes require full test suite (`npm test` + `npm run test:integration`)
- Registry reordering (Wade 3→5, Max 4→7) is **logical** (array order in `agent-registry.js`), not physical — no files or directories are renamed or moved for existing agents (P14)

**Output Boundary:**
- `_bmad-output/` is entirely user-generated at runtime
- The directory structure is created by `install-vortex-agents.js` but ships empty
- Contract artifacts follow the `{contract-id}-{descriptor}.md` naming convention (D2)

### Requirements to Structure Mapping

**Epic-to-Structure Mapping:**

| Epic | New Files | Modified Files | Key Directories |
|------|-----------|---------------|-----------------|
| Epic 1 | `1.5.x-to-1.6.0.js`, `compass-routing-reference.md` | `agent-registry.js`, `validator.js`, `config-merger.js`, `registry.js`, `postinstall.js`, `install-vortex-agents.js` | `scripts/update/` |
| Epic 2 | `research-convergence-specialist.md`, `MILA-USER-GUIDE.md`, 3 workflow dirs (12-18 step files) | — | `agents/`, `guides/`, `workflows/` |
| Epic 3 | `hypothesis-engineer.md`, `LIAM-USER-GUIDE.md`, 3 workflow dirs (12-18 step files) | — | `agents/`, `guides/`, `workflows/` |
| Epic 4 | `production-intelligence-specialist.md`, `NOAH-USER-GUIDE.md`, 3 workflow dirs (12-18 step files) | — | `agents/`, `guides/`, `workflows/` |
| Epic 5 | — | `discovery-empathy-expert.md` (Isla), `lean-experiments-specialist.md` (Wade), `learning-decision-expert.md` (Max), `agents.md`, `README.md`, `CHANGELOG.md` | `agents/`, `docs/` |

**Cross-Cutting Concerns:**
- `agent-registry.js` — Single source of truth, 5 downstream dependents (validator, migration, postinstall, manifest, tests)
- `agent-manifest.csv` — Generated from registry at install time, consumed by Party Mode and Advanced Elicitation
- Registry reordering affects array positions only, not filesystem layout (P14)

### Test Organization

**Existing structure (unchanged):**
```
tests/
├── unit/          # Fast, isolated module tests
├── integration/   # CLI and cross-module tests
└── helpers.js     # Shared test utilities
```

**Wave 3 test changes:**
- `agent-registry.test.js` — Update expectations: 7 agents, 22 workflows, verify stream ordering
- `validator.test.js` — Update expectations: 7 agents, 22 workflows; **add step-file-count smoke test** asserting 4-6 `.md` files per workflow `steps/` directory (P17); **verify standardized step filenames** — `step-01-setup.md`, `step-02-context.md`, and final `*-synthesize.md` must exist in each workflow (P20)
- `1.5.x-to-1.6.0.test.js` — New: test migration delta logic (config update, agents/workflows arrays)

**No new test directories needed.** Wave 3 test changes fit within existing unit/integration structure.

### Development Workflow Integration

**Epic 1 Quality Gate (P18):**
Epic 1 (Infrastructure + Contracts) modifies the highest-risk files. Before starting any content epic (2-4):
1. All existing tests must pass: `npm test` + `npm run test:integration`
2. New migration tests must pass
3. Registry/validator changes must be verified with updated test expectations
4. `npm run lint` must pass clean

**Content Epics (2-4) — Parallelizable:**
Epics 2, 3, and 4 create new files only (no modifications to shared infrastructure). They can be developed in parallel after Epic 1 gate passes. Each epic delivers:
- 1 agent `.md` file
- 1 user guide
- 3 workflow directories with 4-6 steps each

**Content Epic Prerequisite (RF3):** Agent persona design (name, identity, communication style, principles, expertise) must be finalized before step file authoring begins for each agent. This is the primary content bottleneck identified in the PRD (line 132). Persona design feeds both the agent `.md` definition and the registry persona fields — these must match (enforcement guideline #6).

**Handoff Contract Validation Gate (P19):** After each content epic completes, manually verify that the agent's output artifact matches its declared HC schema. Specifically: run the agent's primary workflow, produce an artifact, and confirm the downstream agent can consume it without reshaping. This is the PRD's P0 validation priority. Must pass before Epic 5 begins.

**Epic 5 — Integration:**
Depends on all content epics. Modifies 3 existing agent files (Compass table updates) and documentation. Lower risk than Epic 1 but requires careful review of existing agent content.

### Wave 3 Change Summary

| Category | Count | Details |
|----------|-------|---------|
| New agent files | 3 | Mila, Liam, Noah |
| New user guides | 3 | MILA, LIAM, NOAH |
| New workflow directories | 9 | 3 per agent |
| New step files | 40-54 | 4-6 per workflow (SC6) |
| New infrastructure files | 2 | migration delta, routing reference |
| Modified infrastructure files | 6 | registry, validator, config-merger, migration registry, postinstall, manifest generator |
| Modified content files | 3 | Isla, Wade, Max (Compass updates) |
| Modified docs/config | 3 | agents.md, README.md, CHANGELOG.md |
| Modified test files | 3 | agent-registry.test.js, validator.test.js + 1 new migration test |
| Total new files | ~50-65 | Primarily content (.md) |
| Total modified files | ~15 | Mix of infrastructure + content |

## Architecture Validation Results

### Coherence Validation

**Decision Compatibility:** All 8 decisions (D1-D8) work together without contradiction. D1 (9 workflows) aligns with D3 (WORKFLOWS 13→22). D2 (contract schema) aligns with D4 (uniform Compass format). D6 (migration) handles D3 (registry expansion). D7 (5 epics) dependency chain is valid. D8 (no templates) is consistent with existing codebase.

**Pattern Consistency:** Naming conventions, canonical template (Isla), registry ordering, step file patterns — all consistent across Decisions, Patterns, and Structure sections.

**Structure Alignment:** Directory tree supports all decisions. Boundaries (content, infrastructure, output) are clearly defined. Registry reordering is logical, not physical (P14).

### Requirements Coverage Validation

**FR Coverage: 52/52**

| FR Range | Coverage | Notes |
|----------|----------|-------|
| FR1-16 | Epics 2-4 | Agent content + workflows |
| FR17-18 | D4, step patterns | Input validation + Compass |
| FR19-24 | D4, routing reference | Compass routing |
| FR25-29 | D2, Epic 1 | Contract schemas |
| FR30-33 | Epic 5 | Existing agent updates |
| FR34-38 | D3, Epic 1 | Infrastructure |
| FR39-42 | D6, Epic 1 | Migration |
| FR43-45 | Epics 2-4, Epic 5 | Docs + guides |
| FR46-48 | Patterns, enforcement | Content quality |
| FR49 | **D8 (relaxed)** | No template dirs — codebase verified |
| FR50-52 | Patterns, enforcement | BMAD Core compliance |

**NFR Coverage: 26/26** — All non-functional requirements mapped. No gaps.

### Implementation Readiness Validation

**Decision Completeness:** 8 decisions documented with rationale, validation status, and amendment trails.

**Structure Completeness:** Complete directory tree with ⭐ annotations, epic mapping, and change summary.

**Pattern Completeness:** Content file patterns, code patterns, naming conventions, step count rule (RF1), Compass routing reference, failure mode mitigations (FM1-FM6), enforcement guidelines (9 rules + anti-patterns).

### Comparative Analysis Matrix Score

| Criterion | Weight | Score |
|-----------|--------|-------|
| Decision Coherence | 20% | 5/5 |
| FR Coverage | 20% | 5/5 *(upgraded: FR49 resolved via D8)* |
| NFR Coverage | 10% | 5/5 |
| Implementation Clarity | 15% | 4/5 *(persona design is content, not architecture)* |
| Gap Severity | 10% | 5/5 |
| Risk Mitigation | 10% | 5/5 |
| Validation Depth | 10% | 5/5 |
| Handoff Quality | 5% | 4/5 |
| **Weighted Total** | **100%** | **4.70 / 5.00 (94%)** |

### Validation Findings Register

**Elicitation Methods Applied (Step 7):**
- Comparative Analysis Matrix — scored 8 criteria
- Critique and Refine — 5 strengths, 5 weaknesses, 3 refinements

**Party Mode Panel (Step 7):** John (PM), Quinn (QA), Paige (Tech Writer), Wendy (Workflow Builder)

| # | Source | Finding | Resolution |
|---|--------|---------|------------|
| RF1 | Critique | Step count needs minimum guidance | Added to Workflow Step Files pattern |
| RF2 | Critique | FR49 template dirs unresolved | Resolved as D8 — codebase has no templates |
| RF3 | Critique | Persona design prerequisite missing | Added to Content Epic prerequisites |
| P19 | John | Handoff contract validation gate missing | Added to Development Workflow Integration |
| P20 | Quinn | Smoke test should verify standardized filenames | Added to test organization spec |
| P21 | Quinn | Manifest CSV 7-row verification | Verify existing E2E coverage during Epic 1 |
| P22 | Paige | Compass routing reference authority unclear | Clarified: repo file is authoritative |
| P23 | Wendy | Check existing workflows for template dirs | Verified: none exist — confirmed D8 |

### Architecture Completeness Checklist

**Requirements Analysis**
- [x] Project context analyzed (17 findings from 4 methods)
- [x] Scale and complexity assessed
- [x] Technical constraints identified
- [x] Cross-cutting concerns mapped

**Architectural Decisions**
- [x] 8 decisions documented with rationale (D1-D8)
- [x] Technology stack confirmed (brownfield continuation)
- [x] Integration patterns defined (Compass routing reference)
- [x] Build order and epic structure specified (5 epics)

**Implementation Patterns**
- [x] Naming conventions established
- [x] Content file patterns defined (canonical template, step structure, step count rule)
- [x] Code patterns defined (registry entries, ordering)
- [x] Failure mode mitigations documented (FM1-FM6)
- [x] Enforcement guidelines with anti-patterns

**Project Structure**
- [x] Complete directory tree with new/modified annotations
- [x] Architectural boundaries defined (content, infrastructure, output)
- [x] Epic-to-structure mapping complete
- [x] Test organization defined with smoke tests (P17, P20)

**Quality Gates**
- [x] Epic 1 quality gate defined (P18)
- [x] Handoff contract validation gate defined (P19)
- [x] Content epic prerequisite defined (RF3 — persona design)

### Architecture Readiness Assessment

**Overall Status:** READY FOR IMPLEMENTATION

**Confidence Level:** HIGH (94%)

**Validation Depth:** 7 elicitation rounds + 5 Party Mode sessions across Steps 2-7. 23 tracked findings (P1-P23), 6 self-consistency checks (SC1-SC6), 5 simplifications (R1-R5), 3 refinements (RF1-RF3), 6 failure modes (FM1-FM6).

**Key Strengths:**
- Exhaustive cross-validation with traceable amendment trails
- Clean epic dependency structure (1 → 2/3/4 → 5)
- Brownfield extension — no technology risk
- Phased mid-workflow routing (D5) reduces scope
- Multiple quality gates prevent cascading failures

**Deferred to Wave 3.1:**
- Isla re-entry mode (D5)
- Mid-workflow interrupt pattern for HC9/HC10
- CI dead-end detection automation (FR48)

**Implementation First Priority:**
Epic 1: Infrastructure + Contracts — registry expansion, validator update, migration entry, HC1-HC5 schemas, compass-routing-reference.md. Must pass quality gate before content epics begin.
