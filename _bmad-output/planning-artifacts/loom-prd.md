---
stepsCompleted: [step-01-init, step-02-discovery, step-03-functional-requirements, step-04-nfr, step-05-interaction-design, step-06-architecture, step-07-risks, step-08-metrics, step-09-dependencies, step-10-timeline, step-11-stakeholders, step-12-acceptance, step-13-assembly]
inputDocuments:
  - _bmad-output/vortex-artifacts/vision-team-factory-2026-03-21.md
  - _bmad-output/vortex-artifacts/decision-scope-team-factory-2026-03-21.md
  - _bmad-output/vortex-artifacts/adr-assumption-map-team-factory-2026-03-22.md
  - _bmad-output/planning-artifacts/brief-gyre-2026-03-19.md
workflowType: 'prd'
documentCounts:
  briefs: 1
  research: 0
  vortexArtifacts: 3
  projectDocs: 0
classification:
  projectType: "Internal Tooling — Guided Factory"
  domain: "AI Agent Framework Extensibility"
  implementationComplexity: medium
  userFacingComplexity: must-feel-low
  userMentalModel: "Team Builder / Create a new team"
  projectContext: brownfield
status: DRAFT
version: 1.1
lastEdited: '2026-03-22'
editHistory:
  - date: '2026-03-22'
    changes: 'Post-validation fixes: 3 frontmatter path corrections, 4 measurability improvements (FR18, NFR6, NFR9, NFR11), terminology mapping note'
---

# Product Requirements Document — Team Factory

**Author:** Amalik
**Date:** 2026-03-22
**Status:** Draft v1.0

### Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Product Vision](#2-product-vision)
3. [Problem Statement](#3-problem-statement)
4. [Target Users](#4-target-users)
5. [User Journeys](#5-user-journeys)
6. [Success Criteria](#6-success-criteria)
7. [Functional Requirements](#7-functional-requirements)
8. [Non-Functional Requirements](#8-non-functional-requirements)
9. [User Interaction & Design](#9-user-interaction--design)
10. [Technical Architecture Overview](#10-technical-architecture-overview)
11. [Risks & Mitigations](#11-risks--mitigations)
12. [Success Metrics](#12-success-metrics)
13. [Dependencies & Constraints](#13-dependencies--constraints)
14. [Timeline & Milestones](#14-timeline--milestones)
15. [Stakeholders](#15-stakeholders)
16. [Acceptance Criteria](#16-acceptance-criteria)
17. [Appendix](#17-appendix)

---

## 1. Executive Summary

The Team Factory is an internal tool that enables BMAD framework contributors to create fully wired, BMAD-compliant teams without deep framework knowledge. It solves the scaling bottleneck where 7 incoming teams all depend on one person (the framework creator) for integration wiring across agent-registry.js, config.yaml, contracts, and 5 other touchpoints.

**Approach:** A guided conversation workflow that forces architectural decisions (composition pattern, agent scope, contracts) before generating files, then delegates artifact creation to shared BMB templates and automates all integration wiring. The factory doesn't teach — it makes decisions unavoidable.

**Phasing:** (1) Architecture Reference — codify what a valid team looks like. (2) Add Team workflow — guided factory tested on Gyre. (3) Add Agent + Add Skill workflows + colleague self-serve validation.

**Success criterion:** A framework contributor creates a valid, fully-wired team without assistance — zero post-creation fixes, validator passes on first run.

**"Zero-assistance" defined:** No human help is needed to complete. The colleague still makes decisions, but the factory provides all context required to make them. Zero-assistance does not mean zero-judgment — it means zero-dependency on another person.

**Key risks:** BMB template extraction (spike required), discoverability (systemic gap), shared file safety (modular registration in Phase 2).

**Document scope:** This PRD is detailed because the factory touches 8 integration surfaces and requires zero post-creation fixes — the Architecture will be substantially simpler. 6 elicitation rounds and 8 party mode sessions surfaced root cause analysis that shaped the requirements.

---

## 2. Product Vision

> For framework contributors who need to extend BMAD with new teams, agents, and skills, the Team Factory is a guided orchestration layer that enforces architectural decision-making and produces fully wired, BMAD-compliant modules. Unlike directly editing files or using BMB alone, the Team Factory makes architectural decisions visible and unavoidable, while automating integration wiring — producing output indistinguishable from native BMAD teams.

**Classification:**

| Field | Value |
|-------|-------|
| Project Type | Internal Tooling — Guided Factory |
| Domain | AI Agent Framework Extensibility |
| Implementation Complexity | Medium |
| User-Facing Complexity | Must feel Low |
| User Mental Model | "Team Builder" / "Create a new team" |
| Project Context | Brownfield |

The factory doesn't extend the framework — it's a tool that helps people build things *for* the framework.

---

## 3. Problem Statement

Extending the BMAD framework with new teams, agents, or skills requires both architectural understanding and manual integration wiring across multiple files. This makes it impossible for colleagues to self-serve — demand is active (requested implementations), not projected.

**Impact:**
- **Scale blocker:** 7 teams incoming, all additions flow through one person (the framework creator)
- **Quality gap:** Colleagues who attempt extensions independently skip thinking steps, produce structurally valid but architecturally broken teams (no contracts, no scope boundaries, orphaned files)
- **No entry point:** Colleagues don't know where to start — they don't resist the process, they can't find it
- **No feedback loop:** Colleagues don't know when wiring is wrong — errors surface at runtime, not at creation time

**Current Alternatives:**

| Alternative | Coverage | Gap |
|-------------|----------|-----|
| Manual creation | Full control | Error-prone, no quality gates, no integration wiring, no validation feedback |
| BMB alone | ~55% (agent files, workflows, scaffolds) | No registry, config, contracts, submodule awareness, or discovery process |
| Copy-paste from Vortex | Structural patterns | Cannot handle context-specific decisions: composition pattern, contract design, scope boundaries, overlap detection |

**The factory addresses two gaps:**
- **Decision forcing:** The guided steps make architectural decisions visible and unavoidable — you can't skip the thinking because the factory won't proceed without the decision
- **Integration automation:** The factory handles wiring that templates can't — registry, config, contracts, validation, manifest entries

**What templates handle (deterministic):** Directory structure, boilerplate files, naming conventions, registration entry format.

**What the factory handles (context-specific reasoning):** Composition pattern selection, agent scope boundaries, contract design, config field patterns, overlap detection, orchestration mode.

**Maintenance:** Team update/migration workflows are explicitly out of scope for v1.

---

## 4. Target Users

### Segmentation (by framework relationship, not role)

| Segment | Relationship | Version |
|---------|-------------|---------|
| **Framework contributors** | Use BMAD daily, want to extend it | v1 |
| Framework adopters | Installed BMAD, learning it | v2 |
| Framework evaluators | Considering BMAD, browsing GitHub | v3 |

### v1 Target Persona

**Framework contributor:** Understands BMAD concepts and can use agents, but cannot wire new components into the framework. The knowledge gap is mechanical, not conceptual — they understand the *what*, they don't know the *how* of wiring.

**Population:** Currently 2-3 colleagues matching this profile, expected 5-7 within 6 months as BMAD adoption scales.

**They know:** What teams and agents are, how to invoke agents, what config.yaml does, what output looks like.

**They don't know:** How agent-registry.js connects agents to the system, how refresh-installation.js copies files, what validator.js checks, how contracts enforce handoffs, how config fields map to behavior, how module-help.csv drives discoverability, how activation XML structures initialization.

| Assumes User Knows | Assumes User Does NOT Know |
|---------------------|---------------------------|
| Teams, agents, invocation | Registry wiring, refresh pipeline, validator rules |
| config.yaml purpose | Config field → behavior mapping |
| Agent output format | Contract enforcement, activation XML |
| What modules are | module-help.csv, discoverability mechanism |

### Design Principles for Target Users

- **Zero-assistance completion:** Framework contributor completes without asking anyone
- **No verbal fallback dependency:** No decisions that require messaging the framework creator
- **Don't actively exclude community users:** No decisions that require rewrite for v2 community support

---

## 5. User Journeys

### Journey 1: First-Time Team Creator (Guided Mode)

**Persona:** Colleague A — uses BMAD agents daily, asked to build a new team for client onboarding workflows.

**Trigger:** Colleague needs a team but doesn't know how to build one. Discovers the factory via agent menu or `module-help.csv`.

| Step | What Happens | Colleague Feels | Factory Does |
|------|-------------|----------------|-------------|
| Discovery | "I want to build something for client onboarding" | Curious but uncertain — "is this even a team?" | Routes to Create Team. Confirms this is a multi-agent problem. |
| Orient | Describes the onboarding flow. Factory suggests Sequential. | Relieved — "it understood what I need" | Explains composition patterns with examples. Suggests default with reasoning. |
| Scope | Defines 3 agents one by one. Factory flags overlap with existing analyst agent. | Engaged — making real decisions. Slightly nervous at overlap warning. | Iterates per agent. Shows manifest comparison. Accepts override when colleague explains the distinction. |
| Connect | Defines handoffs between agents. Factory suggests contract structure. | "This is the part I'd never have thought about" | Presents contract template based on Sequential pattern. Asks what each agent passes to the next. |
| Review | Sees full decision summary. | Confident — "this looks right, and I can see exactly what will happen" | Presents spec file. Dry-run preview of files to be created and shared file diffs. |
| Generate | Watches agents generated one at a time. Reviews each. | Impressed — "it's doing the tedious parts for me" | Sequential per-agent loop. Shows each generated file for intent review. Wires integration. |
| Validate | Validator passes. File manifest shown. | Proud — "I built a team" | Runs validator, produces manifest, asks two feedback questions. |

**Outcome:** Colleague created a 3-agent Sequential team in ~75 minutes. Zero manual file edits. Validator passed first run. Colleague can explain what composition pattern they used and why.

### Journey 2: Experienced Creator (Express Mode)

**Persona:** Amalik — building the 4th factory team, knows exactly what's needed.

**Trigger:** Has a team spec file prepared from prior experience.

| Step | What Happens |
|------|-------------|
| Entry | Provides spec file directly to factory |
| Validate spec | Factory parses YAML, validates all required fields, checks naming conventions |
| Review | Decision summary presented from spec. Approves. |
| Generate | Per-agent generation loop. Skips intent review (trusted spec). |
| Validate | Validator passes. Manifest produced. Done in ~20 minutes. |

**Outcome:** Same quality gates, fraction of the time. Spec file reusable as template for similar teams.

### Journey 3: Wrong Entry Point

**Persona:** Colleague B — wants to add a brainstorming skill to an existing CIS agent.

**Trigger:** Invokes factory looking for "add a skill."

| Step | What Happens |
|------|-------------|
| Discovery | Factory recognizes this is Add Skill, not Create Team |
| Fallback (v1) | "The Add Skill workflow is coming in a future version. For now, here's the relevant section of the Architecture Reference that covers adding skills manually." Links to checklist. |

**Outcome:** Not stranded. Has a clear path forward even though the workflow isn't built yet.

### Journey → FR Coverage

| Journey | FRs Exercised |
|---------|--------------|
| Journey 1 (Guided) | FR8 (forced decisions), FR12 (overlap detection), FR13 (contextual examples), FR17 (cascade), FR10 (BMB delegation), FR11 (integration wiring), FR20 (end-to-end validation) |
| Journey 2 (Express) | FR21 (spec file input), FR19 (decision summary), FR10 (BMB delegation), FR20 (validation) |
| Journey 3 (Wrong Entry) | FR14 (discoverable entry point), Step 0 routing |

---

## 6. Success Criteria

| # | Criterion | Target | Measurement | Timeframe |
|---|-----------|--------|-------------|-----------|
| SC1 | **Zero-assistance team creation** | First colleague creates a team without asking anyone | Observation during M3.3 test — friction points documented | Phase 3 |
| SC2 | **Validator pass rate** | 100% of factory-created teams pass validator.js on first run | Automated: validator results in spec file | Ongoing from Phase 2 |
| SC3 | **No post-creation fixes** | Zero manual edits to factory output within 48 hours of creation | git blame on factory-generated files | Ongoing from Phase 2 |
| SC4 | **Factory adoption** | All standard teams (Independent, Sequential) created via factory | Teams with vs. without spec files | After M3.3 |
| SC5 | **Regression safety** | Zero existing team breakage from factory operations | validator.js run against all teams after each factory run | Ongoing from Phase 2 |
| SC6 | **Pattern coverage** | Every factory-created team fits cleanly into Independent or Sequential | `pattern_fit` field in spec file | Ongoing |
| SC7 | **Learning curve** | Measurable reduction in conversation turns between first and second factory use | Turn count per step comparison | After 2+ factory runs |

**Traceability:**
- SC1 ← Vision ("self-serve"), North Star metric
- SC2, SC3 ← Problem Statement (quality gap, no feedback loop)
- SC4 ← Problem Statement (scale blocker)
- SC5 ← NFR-regression, AC27
- SC6 ← Assumption A6' (composition patterns cover all cases)
- SC7 ← NFR1 (must feel Low)

---

## 7. Functional Requirements

### Phase 1: Architecture Reference

| # | Requirement | Priority |
|---|------------|----------|
| FR1 | Machine-consumable checklist of what constitutes a valid BMAD team (directory structure, required files, naming conventions, registration entries) — per composition pattern | Must |
| FR2 | Human-readable context explaining *why* each checklist item matters | Must |
| FR3 | Organized around four quality properties: Discoverable, Installable, Configurable, Composable | Must |
| FR4 | Composition pattern definitions (Independent, Sequential) with examples from existing teams | Must |
| FR5 | Extension deployment mechanism documented separately from composition patterns | Must |
| FR6 | Validated bidirectionally against Gyre — predicts structure AND can guide building from scratch | Must |
| FR7 | Integration surface enumerated: agent-registry.js, refresh-installation.js, validator.js, contracts, config.yaml, module-help.csv, activation XML, naming conventions | Must |

### Phase 2: Add Team Factory Workflow

| # | Requirement | Priority |
|---|------------|----------|
| FR8 | Forced architectural decision points before any file generation (composition pattern, agent scope, contracts, orchestration mode) | Must |
| FR9 | Step-by-step validation — each step confirms output before next begins | Must |
| FR10 | Factory delegates artifact generation to BMB with full context (composition pattern, existing agents, scope boundaries). Factory owns all integration wiring. | Must |
| FR11 | Factory produces complete integration: registry entries, config fields, contracts, validation rules, manifest entries, activation, naming (includes both factory-authored wiring and delegated artifacts) | Must |
| FR12 | Overlap detection — surface potential overlaps against existing agent manifest for human review. User can override with acknowledgment. | Must |
| FR13 | Contextual examples surfaced at each decision point (drawn from Vortex, native teams) | Must |
| FR14 | Discoverable entry point in surfaces enumerated in NFR10 (agent menu, module-help.csv, BMad Master, README) | Must |
| FR15 | Abort path: creation manifest lists all files created, with removal instructions | Must |
| FR16 | Validation rules vary by composition pattern — per-pattern requirements (e.g., contracts required for Sequential, optional for Independent) | Must |
| FR17 | Decision tree — composition pattern selection cascades to eliminate irrelevant decisions | Must |
| FR18 | Defaults selected by most-common pattern in existing teams, with reasoning shown. User confirms or overrides at each decision point. | Should |
| FR19 | Decision summary checkpoint — all decisions presented for approval before generation begins | Must |
| FR20 | End-to-end validation pass as final step | Must |
| FR21 | Decision state persisted as team spec file — serves as audit trail, resume point, and express mode input | Must |
| FR22 | Active naming convention enforcement during factory flow | Must |
| FR23 | Idempotent output — same decisions produce same output | Must |
| FR24 | Error recovery — when generation or wiring fails mid-flow, rollback to last validated state. No partial writes persist. User sees which step failed and why. | Must |

### Phase 3: Extension Workflows

| # | Requirement | Priority |
|---|------------|----------|
| FR25 | Add Agent to existing team — scope check, registration, contract wiring | Should |
| FR26 | Add Skill/Workflow to existing agent — manifest update, template, menu wiring | Should |

### Cross-Cutting Design Principles

Zero-assistance (SC1, NFR1), must-feel-Low (NFR1, Classification), and no verbal fallback (C8 mitigations) are quality attributes enforced across all FRs — not features to build independently.

---

## 8. Non-Functional Requirements

| # | Category | Requirement | Priority |
|---|----------|------------|----------|
| NFR1 | Usability | User-facing complexity must feel Low — contributor completes team creation without consulting external documentation. Target: under 60 minutes for Independent, under 90 minutes for Sequential. Use plain language at decision points, not framework internals. | Must |
| NFR2 | Usability | Progressive disclosure — each step introduces ≤3 new concepts. Early steps are simple, later steps introduce detail only as needed. | Must |
| NFR3 | Reliability | Factory output passes validation on first run — zero manual fixes required | Must |
| NFR4 | Reliability | FR23 idempotency verified by automated regression — same spec file produces identical output across factory versions | Must |
| NFR5 | Maintainability | Architecture Reference is single source of truth — factory reads rules at runtime, zero hardcoded values in workflow step files. Reference sections cite source files for staleness detection. | Must |
| NFR6 | Maintainability | Factory delegates artifact generation to shared templates. Factory-authored code limited to integration wiring (registry entries, config fields, refresh file paths, activation XML). Factory never authors agent files, workflow steps, or skill templates. | Must |
| NFR7 | Compatibility | Output passes same validation rules and refresh pipeline as native teams | Must |
| NFR8 | Compatibility | Works within existing Claude Code interaction model. Fully local — no external tooling or network dependencies. | Must |
| NFR9 | Resumability | If interrupted, user resumes by loading team spec file. Resume presents decision summary and continues from last step whose output is absent from the spec file. | Should |
| NFR10 | Discoverability | Factory entry point exists in: agent menu, module-help.csv, BMad Master "what's available?" response, README. Every discovery surface enumerated and wired. | Must |
| NFR11 | Recoverability | When validation fails, error messages include step name, decision ID, and expected-vs-actual values — traceable to the specific factory decision that caused them | Must |
| NFR12 | Safety | Factory detects dirty working tree and warns before shared file writes. Safe to run with uncommitted changes — detect and warn about conflicts. | Should |
| NFR13 | Safety | Factory modifications to shared files validated in isolation before being applied — no partial writes | Must |
| NFR14 | Security | Factory-generated code uses safe templating — no raw string interpolation of user input into executable files | Must |
| NFR15 | Safety | Factory validates new config fields don't collide with existing fields before writing | Must |
| NFR16 | Auditability | File manifest of created + modified files produced at end of every factory run | Must |
| NFR17 | Safety | Factory operations are additive to shared files — append new entries, never modify or remove existing | Must |
| NFR18 | Performance | Sequential per-agent processing. Just-in-time resource loading. File-based state persistence. Micro-file workflow architecture. | Must |

---

## 9. User Interaction & Design

### Entry Points

| Entry | Route |
|-------|-------|
| "build/create a team" or multi-agent problem | → Create Team (Step 1) |
| "add an agent to [team]" | → Add Agent (Phase 3, v1 fallback: reference checklist) |
| "add a skill to [agent]" | → Add Skill (Phase 3, v1 fallback: reference checklist) |
| Vague / unclear | → Discovery questions to determine route |

### User Flow

```
Step 0: DISCOVER (optional)
  "What problem are you trying to solve?"
  Routes to correct workflow. v1: Create Team only.
  Others get graceful fallback with reference checklist.
        │
Step 1: ORIENT
  "What kind of team are you building?"
  Plain language → factory suggests composition pattern
  with explanation + examples. User confirms or overrides.
  Scope check: if description implies many agents, surface
  how similar problems were solved with fewer. Challenge
  over-scoping before it cascades into Step 2.
        │ Decision: Composition pattern
Step 2: SCOPE (iterative, per agent)
  For each agent: name, role, inputs, outputs, capabilities.
  Overlap check against manifest. Naming enforcement.
        │ Decision: Agents, scope, names
Step 3: CONNECT (Sequential only — skipped for Independent)
  Contract definition, orchestration mode, config fields.
        │ Decision: Contracts, config
Step 4: REVIEW (FR26 — decision checkpoint)
  Full decision summary. Spec file persisted (FR28).
  User approves, edits, or aborts.
        │ Approval gate
Step 4b: DRY-RUN PREVIEW (optional)
  What will be generated. Proposed diffs to shared files.
  User approves before execution.
        │
Step 5: GENERATE (per-agent sequential loop)
  For each agent:
    Generate from template → user reviews intent →
    wire integration → validate wiring → next agent.
  Shared file diffs shown for explicit approval.
        │
Step 6: VALIDATE
  End-to-end validator.js pass. File manifest output.
  Regression check on existing teams.
  Pinpointed errors: specific file + line + originating decision.
  Metrics captured in spec file.
  Two post-completion questions: hardest step + would use again.
```

### Alternative Paths

**Express Mode:** User provides a complete team spec file (YAML). Factory validates the declaration, skips to Step 4 (Review), then generates. Same quality gates, fewer conversation turns. The spec file doubles as guided mode output and express mode input.

**Abort:** At any point, creation manifest shows what was created. User can cleanly remove partial output.

### Team Spec File Schema

The spec file is the factory's central artifact — audit trail, resume state, express mode input, and metrics store. Required fields:

| Section | Field | Type | Set At |
|---------|-------|------|--------|
| **header** | schema_version | string | Auto |
| | team_name | string | Step 1 |
| | composition_pattern | Independent / Sequential | Step 1 |
| | created_by | string | Auto |
| | created_date | date | Auto |
| | factory_version | string | Auto |
| | status | in_progress / complete / aborted | Auto |
| **agents[]** | name | string | Step 2 |
| | role | string | Step 2 |
| | inputs | string[] | Step 2 |
| | outputs | string[] | Step 2 |
| | capabilities | string[] | Step 2 |
| | overlap_check | clear / overridden (reason) | Step 2 |
| **contracts[]** | from_agent | string | Step 3 |
| *(Sequential only)* | to_agent | string | Step 3 |
| | artifact | string | Step 3 |
| **config** | module_path | string | Step 1 |
| | shared_fields | key-value[] | Step 3 |
| | module_fields | key-value[] | Step 3 |
| **orchestration** | mode | standalone / master-routed | Step 3 |
| **decisions[]** | step | string | Each step |
| | decision | string | Each step |
| | default_accepted | boolean | Each step |
| **metrics** | pattern_fit | yes / partial / no | Step 6 |
| | hardest_step | string | Step 6 |
| | would_use_again | yes / no / with_changes | Step 6 |

**Example (minimal Independent team):**

```yaml
# Team Spec File — generated by Team Factory
schema_version: "1.0"
team_name: "example-tooling"
composition_pattern: Independent
created_by: "colleague-a"
created_date: 2026-04-01
factory_version: "1.0"
status: complete

agents:
  - name: "task-runner"
    role: "Executes predefined task sequences"
    inputs: ["task-spec.md"]
    outputs: ["task-result.md"]
    capabilities: ["task execution", "progress tracking"]
    overlap_check: clear

config:
  module_path: "_bmad/bme/_example-tooling"
  shared_fields: []
  module_fields:
    - key: default_task_format
      value: markdown

decisions:
  - step: orient
    decision: "Independent — single agent, no contracts"
    default_accepted: true

metrics:
  pattern_fit: yes
  hardest_step: "scope — defining capability boundaries"
  would_use_again: yes
```

### Interaction Principles

| Principle | Implementation |
|-----------|---------------|
| Progressive disclosure | Each step shows only what's relevant |
| Decision forcing with guidance | Suggested default + "here's how to tell" + examples |
| Cascade elimination | Pattern selection removes irrelevant steps |
| Resumable | Spec file persisted, re-read at each step |
| Context-efficient | One step file at a time, JIT resource loading, file-based state |

---

## 10. Technical Architecture Overview

> *This section provides technical constraints for the architect. It describes integration surface formats, not implementation choices.*

### Runtime Model

The factory is a **standard BMAD workflow** — step files loaded one at a time, LLM reasoning for analysis, JavaScript utility functions for deterministic operations. Not two separate "engines" to build — a design principle:

- **Deterministic operations (codify as JS utilities):** Directory validation, naming enforcement, cascade logic, config collision check, registration format, file manifest tracking
- **Reasoning operations (LLM in conversation):** Overlap detection, BMB input curation, output review, contract design assistance, Step 0 routing

### Component Overview

```
┌─────────────────────────────────────────────┐
│  TEAM FACTORY (BMAD workflow)                │
│                                              │
│  Conversation flow (Steps 0-4)               │
│    + JS validation utilities                 │
│    + Team spec file (YAML state)             │
│                                              │
│  Generation loop (Step 5)                    │
│    + Shared templates (from BMB)             │
│    + Integration wiring (4 file formats)     │
│    + Per-agent sequential processing         │
│                                              │
│  Validation (Step 6)                         │
│    + Pattern-aware validator.js              │
│    + Regression check                        │
│    + File manifest + metrics                 │
└──────────────┬──────────────┬───────────────┘
               │              │
               ▼              ▼
┌──────────────────┐  ┌──────────────────────┐
│ Architecture      │  │ Shared Templates     │
│ Reference         │  │ (externalized from   │
│ - Machine-readable│  │  BMB)                │
│   checklist       │  │ - Agent template     │
│ - Pattern rules   │  │ - Workflow template  │
│ - Examples        │  │ - Skill template     │
└──────────────────┘  └──────────────────────┘
               │              │
               ▼              ▼
┌─────────────────────────────────────────────┐
│ BMAD Framework (target files)                │
│ agent-registry.js  │  config.yaml           │
│ refresh-install.js │  module-help.csv       │
│ validator.js       │  activation XML        │
│ contracts/         │  agents/               │
└─────────────────────────────────────────────┘
```

### Key Architecture Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Factory runtime | BMAD workflow (step files + frontmatter) | Follows existing patterns, no new infrastructure |
| BMB integration | Template embedding (Option C) — factory loads shared templates directly | No BMB refactor needed, no agent invocation, cleanest integration. Fallback: Option B (guided handoff). |
| Validation | Per-step + end-to-end + regression | Trust BMB output structurally. User reviews intent. Validate only factory-written wiring. Final full pass. |
| Shared file writes | Additive, preview-first, validated in isolation | Prevents corruption of existing teams |
| State persistence | Team spec file (YAML with comments) | Triple duty: audit trail, resume point, express mode input |
| Context management | Micro-file architecture, JIT loading, sequential per-agent | Required for Claude Code context window constraints |
| Integration wiring | 4 format-specific write operations | JS (registry), YAML (config), CSV (help), XML (activation) — each with own validation |

---

## 11. Risks & Mitigations

### High Priority — Address Before Phase 2

| # | Risk | L | I | Mitigation |
|---|------|---|---|------------|
| R1 | **BMB template extraction fails** — generation knowledge locked inside agent persona, not externalized as reusable templates | M | H | Root cause fix: externalize generation templates as shared resources — BMB becomes wrapper around shared templates. Spike: extract one template, test standalone. Fallback: Option B (guided handoff). |
| R2 | **Overlap detection false positives** — users lose trust, override everything | M | H | Surface with confidence + evidence. User can override. Tune after first 2-3 teams. |
| R3 | **Factory not discoverable** — instance of systemic gap: BMAD has no capability discovery mechanism for multi-user | M | H | Entry point in all discovery surfaces. BMad Master "what's available?" enhancement as parallel workstream. |
| R4 | **Shared file corruption** — centralized registration assumes manual edits, not automation | L | Crit | v1: additive writes, isolated validation, diff preview, creation manifest. Root cause: modular registration (per-team fragments + merge) in Phase 2. |

### Medium Priority — Address During Phase 2

| # | Risk | L | I | Mitigation |
|---|------|---|---|------------|
| R5 | **Reference format wrong** for factory consumption | M | M | Bidirectional Gyre validation. If factory can't parse reference to produce Gyre decisions, format needs revision. |
| R6 | **Decision fatigue** despite cascade elimination | M | M | Progressive disclosure. Defaults by most-common pattern with reasoning (FR18). Monitor completion time. |
| R7 | **BMB output doesn't match user intent** | M | M | User review gate between generation and wiring (guided mode). Express mode trusts spec. |
| R8 | **Spec file format conflicts** across three purposes | L | M | YAML with comments. Optimize for parsing, add readable comments. Test early. |
| R-context | **Context window limits** — factory loads too much content | M | M | Micro-file architecture, JIT loading, sequential per-agent, spec file as ground truth at every step. |
| R-drift | **Template drift** — BMB and factory consume different templates | M | M | Both must consume same shared templates. Externalization must be complete before Phase 2. |

### Low Priority — Monitor

| # | Risk | L | I | Mitigation |
|---|------|---|---|------------|
| R9 | Composition patterns don't cover edge cases | L | M | Gather descriptions of undefined teams. Extend model if third pattern emerges. |
| R10 | Reference becomes stale | L | L | Reference sections cite source files. Changes to framework files flag reference for update. |
| R11 | Colleague can't complete without help | M | H | This IS the validation — and the North Star. First test reveals what's missing. Severity is High because zero-assistance is the product's reason for existing, not a nice-to-have. |

### Prerequisites (Gates)

| # | Prerequisite | Validates | Definition of Done |
|---|-------------|-----------|-------------------|
| P1/P6 | BMB template externalization + validation (merged workstream) | A12, R1 | One agent template generates output that passes validator.js AND matches provided spec (name, role, capabilities). Both BMB and factory consume same shared template. |
| P2 | Architecture Reference validated against Gyre (bidirectional) | A4, R5 | Reference predicts Gyre's structure. Person holding only the reference produces written team spec matching Gyre's actual structure. |
| P3 | Colleague reads reference without mentoring | A19 | Colleague presented with novel team scenario identifies correct composition pattern with reasoning. 4/4 rubric: pattern, files, registration, contracts. |
| P4 | Factory entry point wired into surfaces | A22 | Colleague finds factory without being told where it is. |
| P5 | Minimal factory prototype | Runtime model | One-agent Independent team: registered, manifest-visible, validator-passing, config added, help CSV added — zero manual edits, all via conversation workflow. |

---

## 12. Success Metrics

### North Star

**Can a framework contributor create a valid, fully-wired team without assistance?**

### Primary Metrics

| # | Metric | How Measured |
|---|--------|-------------|
| M1 | **First colleague completes without assistance** — track friction points (where they paused, struggled, felt uncertain) | Observation during colleague tests (AC19, AC20) |
| M2 | **Validator pass on first run** — 100% of factory output | validator.js results in spec file |
| M3 | **Learning curve slope** — measurable improvement between first guided run, second guided run, first express run | Conversation turn count per step across runs |
| M4 | **Validator coverage gaps** — does validator catch every integration issue, or are there gaps the factory exposes? | Track manual fixes needed despite validator pass |

### Secondary Metrics (Artifact-Based Collection)

| Metric | Collection | Stored In |
|--------|-----------|-----------|
| Pattern fit | `pattern_fit: yes/partial/no` per team | Spec file metrics section |
| Decision overrides | `default_accepted: true/false` per decision | Spec file metrics section |
| Hardest step | Post-completion question (1 of 2) | Spec file metrics section |
| Satisfaction | "Would you use this again?" (2 of 2) | Spec file metrics section |
| Adoption | Teams with vs. without corresponding spec files | Project-level audit |

### Failure Modes

| Mode | Signal | Detection | Response |
|------|--------|-----------|----------|
| **Nobody uses it** | Teams built manually despite factory available | Teams without spec files | Discoverability problem — fix entry points |
| **Bad output** | Validator failures, manual edits within 48h | validator.js + git blame | Technical problem — fix generation or validation |
| **Painful process** | Completes but won't return, high override rate | Satisfaction question + override tracking | UX problem — simplify steps, improve defaults |
| **Breaks at scale** | Simple teams succeed, complex teams fail | Success rate by pattern + agent count | Architecture problem — model or implementation gap |

### Pivot Trigger

Two consecutive colleague failures on the same step = step flagged for redesign. Two fix iterations on output quality without improvement = written decision document on whether to continue factory approach or rely on Architecture Reference alone.

### Anti-Metrics

| Anti-Metric | Why |
|-------------|-----|
| Speed at expense of quality | A bad team is worse than no team |
| Number of teams created | Volume without quality is meaningless |
| Factory feature count | Simplicity over capability |

---

## 13. Dependencies & Constraints

### Dependencies

| # | Dependency | Blocks | Status |
|---|-----------|--------|--------|
| D1 | Architecture Reference (Phase 1) | Phase 2 — factory reads rules from reference | Not started |
| D2 | BMB template externalization | Phase 2 generation — shared templates | Not started |
| D3 | validator.js | Phase 2 validation — may need pattern-aware extension | Exists |
| D4 | agent-registry.js | Phase 2 wiring — JS format, function-level insertion | Exists |
| D5 | refresh-installation.js | Phase 2 wiring — file copy paths per module | Exists |
| D6 | config.yaml | Phase 2 wiring — YAML field insertion, collision detection | Exists |
| D7 | BMad Master capability discovery | Discoverability (parallel workstream) | Not started |
| D8 | Gyre product brief | P2 validation target | Exists |
| D9 | **Colleague availability** | M1.3, M2.1 observation, M3.3 tests | Not scheduled |

### Constraints

| # | Constraint | Impact |
|---|-----------|--------|
| C1 | Claude Code context window constraints | Micro-file architecture, JIT loading, sequential per-agent processing, file-based state |
| C2 | Fully local operation | No network dependencies during execution |
| C3 | BMAD directory conventions | `_bmad/` paths unchanged |
| C4 | Additive-only shared files | Append, never modify existing entries |
| C5 | Architecture Reference integrity | See NFR5 — factory reads at runtime, reference cites sources for staleness |
| C6 | No BMB duplication | Delegate via shared templates |
| C7 | Existing tool compatibility | convoke-doctor, convoke-update, convoke-install |
| C8 | Single framework creator | All knowledge extraction depends on Amalik |
| C9 | Reference maintenance | Not sole-creator dependent — sections cite source files for staleness |

### C8 Mitigations

| Mitigation | When |
|-----------|------|
| Phase 1 is knowledge extraction — nothing starts until it's complete | Phase 1 |
| Reference separates automatable rules from judgment calls | Phase 1 |
| Pair work with colleague during Phase 1 grows second reviewer | Phase 1 |
| Reference doubles as review rubric for non-creator review | Phase 1 design |

### Phase 2 Two-Track Structure

**Track A (conversation, no infra deps):** Steps 0-4 workflow. Can start immediately after Phase 1. Use idle time for Gyre decision flow testing with mock generation.

**Track B (infrastructure):** Modular registration → pattern-aware validator → template integration → Step 5 → Step 6.

Tracks converge at Step 5 (Generate).

---

## 14. Timeline & Milestones

### Phase 1: Architecture Reference (Knowledge Extraction)

**"Done enough" = M1.2 + M1.3 pass, not perfection.**

| Milestone | Done When |
|-----------|-----------|
| M1.1 | Checklist covers every file type in integration surface (8 items). Per item: required/optional per pattern, naming rule, content template, validation rule. Verified against Vortex's actual file set — zero uncovered. |
| M1.2 | Person holding only the reference produces written Gyre spec matching actual structure: pattern, agent count, contract count, directory layout, file set. |
| M1.3 | Colleague presented with novel scenario identifies composition pattern with reasoning. 4/4 rubric. |
| M1.4 | Colleague finds factory entry point without being told. |

### Prerequisites (Gate Between Phase 1 and Phase 2)

Prerequisites are a formal phase gate — Phase 2 tracks cannot begin until these pass. They are sequenced: P6/P1 must pass before P5 can be attempted.

| Gate | Done When |
|------|-----------|
| P6/P1 | One agent template generates output passing validator.js + matching spec. BMB and factory share the template. |
| P5 | One-agent Independent team: registered, manifest-visible, validator-passing, config + help CSV added. Zero manual edits. |

### Phase 2: Add Team Factory (Two Tracks → Convergence)

| Milestone | Track | Done When |
|-----------|-------|-----------|
| M2.1 | A | Steps 0-4 complete. User completes decision flow, spec file produced. |
| M2.2 | A | Express mode: spec file accepted, validated, skips to Review. |
| M2.3 | B | Modular registration: factory writes to team fragment, merge produces valid shared files. |
| M2.4 | B | Pattern-aware validator.js: different rules per composition pattern. |
| M2.5 | B | Template integration: factory loads shared templates, generates sequentially. |
| M2.6 | Conv. | Step 5: per-agent loop (generate → review → wire → validate). |
| M2.7 | Conv. | Step 6: end-to-end validation, file manifest, metrics. |
| M2.7a | Gate | Smoke test: 2-agent Independent team, full flow. Validates plumbing only. |
| M2.8 | Gate | **Gyre test:** 4 agents, 3 contracts, all wiring. Passes validator. Deployable without edits. Colleague A observes. |

**Hard gate: M2.8 passes before Phase 3 or colleague self-serve test.**

### Phase 3: Extension + Validation

| Milestone | Done When |
|-----------|-----------|
| M3.3 | **Colleague A self-serve:** creates team end-to-end, zero assistance. (Moved up — before extension workflows.) |
| M3.3b | **Colleague B cold start:** finds factory, creates team with no prior exposure. |
| M3.1 | Add Agent workflow operational. |
| M3.2 | Add Skill workflow operational. |
| M3.4 | Seven teams milestone — all factory-built, structurally consistent. |

### Parallel Workstream

| Milestone | Done When |
|-----------|-----------|
| MW.1 | BMad Master "what's available?" responds with dynamic capability list from manifests. |

### Safeguards

| # | Safeguard | Prevents |
|---|-----------|----------|
| T1 | Phase 1 "done enough" = M1.2 + M1.3, not perfection | Scope creep |
| T2 | Track A starts immediately after Phase 1 | Unnecessary serialization |
| T3 | Gyre decision flow tested on Track A with mock generation | Big-bang validation |
| T4 | Colleague availability scheduled during Phase 1 | Late-stage blocker |
| T5 | M2.8 is hard gate before Phase 3 | Building on broken foundation |
| T6 | Template externalization incremental — one type first | Front-loading risk |

---

## 15. Stakeholders

### Real Stakeholders

| Stakeholder | Role | Status |
|-------------|------|--------|
| **Amalik** | Product owner, builder, sole framework expert | Fully aligned |
| **Colleague A** (TBD) | Learning partner: pair review → flow test → self-serve | Not yet identified |
| **Colleague B** (TBD) | Reality check: cold-start self-serve test only | Not yet identified |

**Persona requirement:** Both colleagues must match target persona — uses BMAD agents, cannot wire new components. Too junior (never used BMAD) or too senior (knows the wiring) invalidates the test.

### Three-Stage Colleague Engagement

| Stage | When | What | Rule |
|-------|------|------|------|
| 1. Pair review | M1.3 | Colleague A reads reference, writes summary, identifies patterns in novel scenario | No coaching after — fix the reference, don't explain it |
| 2. Flow observation | M2.8 | Colleague A observes Gyre test, asks questions | Exposure, not formal test |
| 3. Self-serve | M3.3 / M3.3b | Colleague A creates team (prepared). Colleague B creates team (cold start). | Zero assistance. Your confusion is the most valuable data. |

### Decision Authority

All decisions: Amalik. Colleagues validate user experience. Pivot decision (AC25) requires written decision document.

### Action Items

| Item | Owner | When |
|------|-------|------|
| Identify and name Colleague A + B | Amalik | Before Phase 1 starts |
| Verify colleagues match target persona | Amalik | Before scheduling |
| Schedule 45-minute blocks for M1.3, M2.8 observation, M3.3 | Amalik | During Phase 1 |

### Fallbacks (No Valid Colleague Available)

1. Self-test with amnesia protocol (reference only, no codebase access)
2. LLM proxy test (fresh conversation with reference only — gaps surface as clarifying questions)
3. Defer colleague test, accept higher risk, fix when available

---

## 16. Acceptance Criteria

### Validation Layers (Progressive Gates)

Each layer is a gate — if it fails, don't proceed to the next.

#### Layer 1: Foundation (Phase 1)

| # | Criterion | Pass When |
|---|-----------|-----------|
| AC1 | Structural completeness | Zero uncovered files when compared against Vortex's actual file set across all 8 integration surface items |
| AC2 | Pattern coverage | Every existing team (BMM, CIS, TEA, WDS, Vortex, Gyre, Enhance) maps cleanly to Independent, Sequential, or Extension |
| AC3 | Bidirectional Gyre validation | Reference-only spec matches Gyre's actual structure |
| AC4 | Machine-readability | Factory prototype parses reference — deterministic rules extracted without LLM interpretation |
| AC5 | Colleague comprehension | Novel scenario: colleague identifies composition pattern with reasoning (comprehension, not recall) |
| AC6 | Discoverability | Colleague locates entry point without being told |

#### Layer 2: Core Mechanism (Prerequisites)

| # | Criterion | Pass When |
|---|-----------|-----------|
| AC7 | Template externalization | Output passes validator.js AND matches provided spec |
| AC8 | Factory prototype | One-agent Independent team, all wiring, zero manual edits |

#### Layer 3: Decision Flow (Track A)

| # | Criterion | Pass When |
|---|-----------|-----------|
| AC9 | Decision flow with Gyre profile | Spec file matches Gyre's actual composition, agents, contracts, config |
| AC10 | Express mode | Spec file accepted as input, validated, skips to Review |
| AC11 | Cascade elimination | Independent team skips contract and orchestration steps automatically |
| AC12 | Overlap detection | Potential overlap surfaced with evidence. Override accepted. |

#### Layer 4: Generation Pipeline (Convergence)

| # | Criterion | Pass When | Notes |
|---|-----------|-----------|-------|
| AC13 | Smoke test (2-agent Independent) | End-to-end, all files, registered, validated | Validates plumbing only — not cascading, contracts, or pattern logic |
| AC14 | **Gyre test** (4-agent Sequential) | Passes validator. Deployable without edits. | Proves tool correctness, not user outcome. AC19/AC20 are outcome tests. |
| AC15 | Shared file safety | All entries additive. Diffs previewed. No existing entries modified. |
| AC16 | Sequential per-agent processing | Each agent: generate → review → wire → validate. Context within limits. |
| AC17 | Abort/recovery | Creation manifest lists files. Cleanly removable. No orphaned shared entries. |
| AC18 | Metrics capture | Spec file contains metrics section |
| AC18b | Metrics review | Metrics reviewed after each run, logged in central tracker |
| AC26 | **Functional test** | Invoke factory-built agent, run one workflow, output matches contract spec |
| AC27 | **Regression check** | validator.js against all existing teams after factory run — zero new failures |

#### Layer 5: User Validation (Phase 3)

| # | Criterion | Pass When |
|---|-----------|-----------|
| AC19 | Colleague A self-serve | End-to-end completion, zero assistance. Friction points documented. |
| AC29 | Colleague output comprehension | Colleague explains: composition pattern, where agents registered, what contracts enforce — without spec file |
| AC20 | Colleague B cold start | Finds factory, completes or identifies clear blocking point |
| AC21 | Add Agent | Agent added to existing team with scope check, registration, contracts |
| AC22 | Add Skill | Skill added with manifest, template, menu wiring |

#### Layer 6: Ongoing

| # | Criterion | Pass When |
|---|-----------|-----------|
| AC23 | Adoption detection | Any team without spec file triggers investigation |
| AC24 | Monthly validator | 100% pass rate on all factory-built teams |
| AC25 | Pivot trigger | Two consecutive failures on same step → written decision document |
| AC28 | Scale monitoring | After 3+ factory teams: refresh-installation and convoke-doctor complete without errors |

### Test Ownership

| Layer | Owner | Trigger |
|-------|-------|---------|
| 1 (Foundation) | Amalik | Phase 1 complete |
| 2 (Core Mechanism) | Amalik | Prerequisites complete |
| 3 (Decision Flow) | Amalik | Track A built |
| 4 (Generation) | Amalik + Colleague A observes | Tracks converge |
| 5 (User Validation) | Colleague A + Colleague B | Scheduled after M2.8 |
| 6 (Ongoing) | Amalik | Monthly / after each factory run |

---

## 17. Appendix

### Upstream Artifacts

| Document | Type | Location |
|----------|------|----------|
| Product Vision: Team Factory | Vortex artifact | `_bmad-output/vortex-artifacts/vision-team-factory-2026-03-21.md` |
| Scope Decision: Team Factory | Vortex artifact | `_bmad-output/vortex-artifacts/decision-scope-team-factory-2026-03-21.md` |
| Assumption Risk Map: Team Factory | Vortex artifact | `_bmad-output/vortex-artifacts/adr-assumption-map-team-factory-2026-03-22.md` |
| Product Brief: Gyre | Planning artifact | `_bmad-output/planning-artifacts/brief-gyre-2026-03-19.md` |

### Terminology Mapping

The Product Vision used "Classic Module / Orchestrated Submodule / Extension" for composition archetypes. Through elicitation, the PRD adopted "Independent / Sequential / Extension" — clearer labels for the same three patterns.

### Assumption Traceability

Assumptions (A4, A5', etc.) are defined in the upstream Assumption Risk Map (`adr-assumption-map-team-factory-2026-03-22.md`). This table maps them to their validation mechanisms within this PRD.

| Assumption | Validated By | PRD Section |
|-----------|-------------|-------------|
| A4 (Gyre follows same model) | P2, AC3 | Prerequisites, Acceptance |
| A5' (Four quality properties) | FR3, M1.1 | Functional Requirements, Timeline |
| A6' (Composition patterns) | FR4, AC2 | Functional Requirements, Acceptance |
| A12/A13 (BMB delegation) | P6/P1, AC7 | Prerequisites, Acceptance |
| A19 (Surface user follows reference) | P3, AC5 | Prerequisites, Acceptance |
| A22 (Discoverability) | P4, AC6 | Prerequisites, Acceptance |

### Elicitation Record

This PRD was developed through 13 steps of structured discovery including:
- 6 Advanced Elicitation rounds (First Principles Analysis ×2, Thesis Defense ×2, Stakeholder Round Table ×2, Reverse Brainstorming ×2, Five Whys ×2)
- 8 Party Mode sessions (classification, problem statement, functional requirements, NFRs, interaction design, architecture, risks/metrics, dependencies/timeline, stakeholders, acceptance criteria)
- Agents consulted: Emma, Liam, Bond, Morgan, Winston, Isla, John, Wendy, Barry, Murat, Noah, Wade, Max, Bob, Amelia, BMad Master

### Quick Reference Card

**Functional Requirements (FR1-FR26):**
FR1 Machine-consumable team checklist per pattern | FR2 Human-readable context (why) | FR3 Four quality properties | FR4 Composition patterns with examples | FR5 Extension mechanism documented | FR6 Bidirectional Gyre validation | FR7 Integration surface enumerated | FR8 Forced decision points before generation | FR9 Step-by-step validation | FR10 Delegate to BMB, own integration | FR11 Complete integration wiring | FR12 Overlap detection for human review | FR13 Contextual examples at decisions | FR14 Discoverable entry point | FR15 Abort path with creation manifest | FR16 Per-pattern validation rules | FR17 Decision cascade elimination | FR18 Defaults by most-common pattern, reasoning shown | FR19 Decision summary checkpoint | FR20 End-to-end validation pass | FR21 Spec file persistence (audit + resume + express) | FR22 Naming convention enforcement | FR23 Idempotent output | FR24 Error recovery with rollback | FR25 Add Agent workflow | FR26 Add Skill workflow

**Cross-Cutting Design Principles:** Zero-assistance completion | Must feel Low complexity | No verbal fallback dependency

**Non-Functional Requirements (NFR1-NFR18):**
NFR1 Under 60/90 min, plain language | NFR2 Progressive disclosure (≤3 concepts/step) | NFR3 Validator pass first run | NFR4 FR23 idempotency regression across versions | NFR5 Reference as single source of truth (runtime read, zero hardcode) | NFR6 Delegate generation, own wiring only (registry, config, refresh, activation XML) | NFR7 Same validation as native teams | NFR8 Local only, no external deps | NFR9 Resumable via spec file (from last absent output) | NFR10 Discoverable in 4 surfaces (agent menu, help CSV, BMad Master, README) | NFR11 Traceable errors (step name + decision ID + expected-vs-actual) | NFR12 Dirty tree detection before shared writes | NFR13 Isolated validation before shared writes | NFR14 Safe templating, no injection | NFR15 Config field collision check | NFR16 File manifest every run | NFR17 Additive-only shared files | NFR18 Sequential per-agent, JIT loading

### Key Decisions Made During PRD

| Decision | Rationale | Source |
|----------|-----------|--------|
| "Internal Tooling" not "Framework Extension" | Factory doesn't extend the framework, it produces things for it | Party Mode 1 |
| "Decision forcing" not "teaching" | Factory makes decisions unavoidable, reference provides understanding | Party Mode 2 |
| Template embedding (Option C) over BMB API | No BMB refactor needed, factory loads templates directly | Party Mode 4 |
| Two-track Phase 2 | Conversation flow has no infra deps, can start immediately | Party Mode 5 |
| Colleague test before extension workflows | Highest-value validation should happen earliest | Party Mode 6 |
| Spec file as triple-duty artifact | Audit trail + resume + express input — one format, three uses | Multiple sessions |
| Modular registration in Phase 2 | Defensive measures on shared files become debt after multiple teams | Party Mode 4 |

---

**Created with:** Convoke v2.3.1 — Vortex Pattern + BMM PRD Workflow
**PM Agent:** John (Product Manager)
**Workflow:** create-prd (13 steps)
**Elicitation:** Advanced Elicitation (6 rounds) + Party Mode (8 sessions)
