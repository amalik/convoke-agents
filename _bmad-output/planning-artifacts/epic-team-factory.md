---
stepsCompleted: [step-01-validate-prerequisites, step-02-design-epics, step-03-create-stories, step-04-final-validation]
status: 'complete'
completedAt: '2026-03-23'
editHistory:
  - date: '2026-03-23'
    changes: "Extracted from combined epics.md into dedicated per-initiative file. Epics 6-8 cover Team Factory across three phases: Architecture Reference, Guided Workflow, Extensions. 15 stories total. Pre-mortem fixes applied (Story 7.6/7.7/7.8 split from original oversized story)."
  - date: '2026-04-02'
    changes: "Epic 2 implementation completed. 28 new files: agent definition, 6 workflow steps, 6 JS modules, 2 JSON schemas, spec template, config, module-help.csv, skill entry. Code review (Blind Hunter + Edge Case Hunter) applied 11 fixes. Stories 2.1-2.9 assessed: 6 complete, 2 partial (BMB templates deferred to P12, B-lite semantic validation deferred to I13), 1 minor gap (README entry). Epic 3 not started."
inputDocuments:
  - _bmad-output/planning-artifacts/prd-team-factory.md
  - _bmad-output/planning-artifacts/architecture-team-factory.md
implementationStatus:
  epic1: done
  epic2: done-with-deferred
  epic3: not-started
---

# Team Factory - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for the Team Factory initiative — a guided factory workflow enabling framework contributors to create BMAD-compliant teams. Organized in three phases: Architecture Reference (codifying what a valid team is), Guided Workflow (conversational factory for creating teams), and Extensions (adding agents/skills to existing teams).

> **Authoring vs Runtime Acceptance Criteria:** Team Factory produces both markdown reference documents and JS module code. Acceptance criteria should be read in two layers:
>
> - **Authoring ACs** (what a dev agent delivers): Files exist, follow templates, contain required sections, pass structural validation, tests pass. These are verifiable at PR time.
> - **Runtime ACs** (validated during pilot/QA): Factory conversation flow, decision cascade correctness, generated team validity, resume/express mode behavior. These require running the factory against real team creation scenarios.
>
> Stories use authoring-verifiable language ("file contains", "checklist includes", "test passes") for deliverable ACs and runtime-verifiable language ("factory presents", "contributor sees", "validation confirms") for behavioral ACs.

## Requirements Inventory

### Functional Requirements

**Phase 1: Architecture Reference**

TF-FR1: Machine-consumable checklist of what constitutes a valid BMAD team (directory structure, required files, naming conventions, registration entries) — per composition pattern
TF-FR2: Human-readable context explaining why each checklist item matters
TF-FR3: Organized around four quality properties: Discoverable, Installable, Configurable, Composable
TF-FR4: Composition pattern definitions (Independent, Sequential) with examples from existing teams
TF-FR5: Extension deployment mechanism documented separately from composition patterns
TF-FR6: Validated bidirectionally against Gyre — predicts structure AND can guide building from scratch
TF-FR7: Integration surface enumerated: agent-registry.js, refresh-installation.js, validator.js, contracts, config.yaml, module-help.csv, activation XML, naming conventions

**Phase 2: Add Team Factory Workflow**

TF-FR8: Forced architectural decision points before any file generation (composition pattern, agent scope, contracts, orchestration mode)
TF-FR9: Step-by-step validation — each step confirms output before next begins
TF-FR10: Factory delegates artifact generation to BMB with full context. Factory owns all integration wiring.
TF-FR11: Factory produces complete integration: registry entries, config fields, contracts, validation rules, manifest entries, activation, naming
TF-FR12: Overlap detection — surface potential overlaps against existing agent manifest for human review
TF-FR13: Contextual examples surfaced at each decision point (drawn from Vortex, native teams)
TF-FR14: Discoverable entry point in agent menu, module-help.csv, BMad Master, README
TF-FR15: Abort path: creation manifest lists all files created, with removal instructions
TF-FR16: Validation rules vary by composition pattern
TF-FR17: Decision tree — composition pattern selection cascades to eliminate irrelevant decisions
TF-FR18: Defaults selected by most-common pattern with reasoning shown. User confirms or overrides.
TF-FR19: Decision summary checkpoint — all decisions presented for approval before generation begins
TF-FR20: End-to-end validation pass as final step
TF-FR21: Decision state persisted as team spec file — audit trail, resume point, express mode input
TF-FR22: Active naming convention enforcement during factory flow
TF-FR23: Idempotent output — same decisions produce same output
TF-FR24: Error recovery — rollback to last validated state on failure. No partial writes persist.

**Phase 3: Extension Workflows**

TF-FR25: Add Agent to existing team — scope check, registration, contract wiring
TF-FR26: Add Skill/Workflow to existing agent — manifest update, template, menu wiring

### Non-Functional Requirements

**Usability**

TF-NFR1: User-facing complexity must feel Low — complete without external docs. Under 60 min Independent, under 90 min Sequential
TF-NFR2: Progressive disclosure — each step introduces ≤3 new concepts

**Reliability**

TF-NFR3: Factory output passes validation on first run — zero manual fixes required
TF-NFR4: Idempotency verified by automated regression — same spec produces identical output

**Maintainability**

TF-NFR5: Architecture Reference is single source of truth — factory reads rules at runtime, zero hardcoded values
TF-NFR6: Factory delegates artifact generation to shared templates. Factory-authored code limited to integration wiring.

**Compatibility**

TF-NFR7: Output passes same validation rules and refresh pipeline as native teams
TF-NFR8: Works within existing Claude Code interaction model. Fully local, no external tooling.

**Resumability, Recoverability, Safety**

TF-NFR9: If interrupted, user resumes by loading team spec file from last completed step
TF-NFR10: Factory entry point exists in: agent menu, module-help.csv, BMad Master, README
TF-NFR11: Error messages include step name, decision ID, and expected-vs-actual values
TF-NFR12: Factory detects dirty working tree and warns before shared file writes
TF-NFR13: Factory modifications to shared files validated in isolation before being applied
TF-NFR14: Safe templating — no raw string interpolation of user input into executable files
TF-NFR15: Factory validates new config fields don't collide with existing fields before writing
TF-NFR16: File manifest of created + modified files produced at end of every factory run
TF-NFR17: Factory operations are additive to shared files — append only, never modify or remove existing
TF-NFR18: Sequential per-agent processing, JIT loading, micro-file architecture

### Architecture Requirements

- Factory JS module organization: `_bmad/bme/_team-factory/lib/` with naming-enforcer.js, cascade-logic.js, collision-detector.js, manifest-tracker.js, writers/
- Architecture Reference format: Markdown with embedded YAML data blocks (D-Q1, Option B)
- Format-aware writer design: 1 writer (registry-writer.js), 2 creators (config-creator.js, csv-creator.js), 1 validator (activation-validator.js) (D-Q2)
- Validation layering: 4 layers — per-step, per-agent, semantic (B-lite), end-to-end (D-Q3)
- Spec file architecture: per-pattern JSON Schema files, spec-parser.js, spec-writer.js, spec-differ.js (D-S2)
- Template location: `_bmad/core/resources/templates/` for shared BMB templates (D-TL)
- Registry fragment architecture: OPEN — deferred to Phase 1 (D-Q6, could eliminate registry-writer entirely)
- Factory-specific testing: golden file tests for wiring, structural validation for generated content, Jest unit tests, regression via validator.js
- Test fixtures: 4 minimum (independent-single-agent, sequential-three-agents, malformed-missing-fields, collision-existing-agent)
- Phase 1 is an architecture validation phase: Reference + P2b spike + template externalization + D-Q6 investigation + P2 human consumability test + P3 colleague test
- Write Safety Protocol: stage → validate → check (dirty-tree) → apply → verify — per-write, not per-workflow
- Safe templating: whitelist-only variable names, no eval, no dynamic require (NFR14)
- Hand-rolled safe replacer (~20 lines) for template substitution

### UX Design Requirements

No UX Design document was provided for Team Factory.

### FR Coverage Map

TF-FR1: Epic 1 - Machine-consumable team validity checklist per pattern
TF-FR2: Epic 1 - Human-readable context explaining why
TF-FR3: Epic 1 - Organized by four quality properties
TF-FR4: Epic 1 - Composition pattern definitions with examples
TF-FR5: Epic 1 - Extension deployment mechanism documented
TF-FR6: Epic 1 - Bidirectional Gyre validation
TF-FR7: Epic 1 - Integration surface enumeration
TF-FR8: Epic 2 - Forced decision points before generation
TF-FR9: Epic 2 - Step-by-step validation
TF-FR10: Epic 2 - BMB delegation with full context
TF-FR11: Epic 2 - Complete integration wiring
TF-FR12: Epic 2 - Overlap detection against agent manifest
TF-FR13: Epic 2 - Contextual examples at decision points
TF-FR14: Epic 2 - Discoverable entry points
TF-FR15: Epic 2 - Abort path with creation manifest
TF-FR16: Epic 2 - Pattern-aware validation rules
TF-FR17: Epic 2 - Cascade decision tree
TF-FR18: Epic 2 - Pattern-based defaults with reasoning
TF-FR19: Epic 2 - Decision summary checkpoint
TF-FR20: Epic 2 - End-to-end validation pass
TF-FR21: Epic 2 - Spec file persistence
TF-FR22: Epic 2 - Naming convention enforcement
TF-FR23: Epic 2 - Idempotent output
TF-FR24: Epic 2 - Error recovery with rollback
TF-FR25: Epic 3 - Add Agent to existing team
TF-FR26: Epic 3 - Add Skill/Workflow to existing agent

## Epic List

### Epic 1: Team Factory Architecture Reference
Framework contributors can consult a comprehensive, machine+human-readable reference of what constitutes a valid BMAD team. Organized by quality properties and composition patterns, validated bidirectionally against Gyre.
**FRs covered:** TF-FR1, TF-FR2, TF-FR3, TF-FR4, TF-FR5, TF-FR6, TF-FR7

### Epic 2: Team Factory Guided Workflow
Framework contributors can create fully-wired, BMAD-compliant teams through a guided factory conversation — zero post-creation fixes. Decision state persisted as spec file for resume and express mode.
**FRs covered:** TF-FR8, TF-FR9, TF-FR10, TF-FR11, TF-FR12, TF-FR13, TF-FR14, TF-FR15, TF-FR16, TF-FR17, TF-FR18, TF-FR19, TF-FR20, TF-FR21, TF-FR22, TF-FR23, TF-FR24

### Epic 3: Team Factory Extensions
Framework contributors can add agents to existing teams or skills to existing agents without manual wiring.
**FRs covered:** TF-FR25, TF-FR26

## Cross-Epic Dependencies

Story 1.4 (Bidirectional Gyre Validation) requires the Gyre module structure from Gyre Epics 1-2 to exist. Recommended implementation order: Gyre Epics 1-2 → Team Factory Epic 1 → Gyre Epics 3-5 (can parallel with Epic 2) → Team Factory Epic 2 → Team Factory Epic 3.

Epic 3 (Extensions) depends on Epic 2 (Guided Workflow) being complete — extension workflows reuse the factory's validation, wiring, and BMB delegation infrastructure.

---

## Epic 1: Team Factory Architecture Reference

Framework contributors can consult a comprehensive, machine+human-readable reference of what constitutes a valid BMAD team. Organized by quality properties and composition patterns, validated bidirectionally against Gyre.

**Cross-epic dependency:** Story 1.4 (Bidirectional Gyre Validation) requires the Gyre module structure from Gyre Epics 1-2 to exist. Recommended implementation order: Gyre Epics 1-2 → Team Factory Epic 1 → Gyre Epics 3-5 (can parallel with Epic 2) → Team Factory Epic 2 → Team Factory Epic 3.

### Story 1.1: Quality Properties & Composition Patterns

As a framework contributor,
I want to understand the four quality properties that define a valid BMAD team and the composition patterns available,
So that I can make informed architectural decisions before building a new team.

**Acceptance Criteria:**

**Given** a framework contributor opens the Architecture Reference
**When** they read the composition pattern section
**Then** two composition patterns are defined — Independent and Sequential — with examples from existing teams (Vortex, native teams) (TF-FR4)
**And** each pattern includes a clear description of when to use it, how agents interact, and how contracts differ

**Given** a framework contributor reads the quality property sections
**When** they review the organizational structure
**Then** the reference is organized around four quality properties: Discoverable, Installable, Configurable, Composable (TF-FR3)
**And** each quality property is defined with a clear explanation of what it means for a team to satisfy it

### Story 1.2: Machine-Consumable Team Validity Checklists

As a framework contributor (and as the factory at runtime),
I want machine-extractable checklists of what constitutes a valid team for each composition pattern,
So that both humans and automated tools can verify team compliance against the same source of truth.

**Acceptance Criteria:**

**Given** the Architecture Reference document
**When** checklist sections are authored
**Then** each section contains fenced YAML data blocks with structured checks — each check has id, rule, target_file, and validation fields (TF-FR1)
**And** checklists are per quality property × composition pattern (~8 sections, e.g., "Discoverable — Independent", "Discoverable — Sequential")
**And** YAML blocks are self-describing — identified by presence of `quality_property`, `composition_pattern`, and `checks` top-level keys (D-Q1)

**Given** the checklists cover integration surfaces
**When** all 8 surfaces are enumerated
**Then** the reference covers: agent-registry.js, refresh-installation.js, validator.js, contracts, config.yaml, module-help.csv, activation XML, and naming conventions (TF-FR7)
**And** each integration surface has at least one check with a target_file and validation criteria

**Given** the reference is the single source of truth (TF-NFR5)
**When** the factory or validator needs team rules
**Then** rules are extracted from the YAML data blocks at runtime — zero hardcoded values in workflow step files or validator code

### Story 1.3: Human-Readable Context & Extension Mechanism

As a framework contributor,
I want to understand *why* each checklist item matters and how extension deployment works,
So that I can make informed decisions and understand the reasoning behind the rules, not just follow them blindly.

**Acceptance Criteria:**

**Given** the Architecture Reference document
**When** a contributor reads a quality property section
**Then** each YAML checklist is accompanied by human-readable prose explaining why each check matters (TF-FR2)
**And** prose references check IDs inline (e.g., "**DISC-01** — module-help.csv is the primary discovery surface because...") for traceability
**And** the reference is readable and useful without needing to parse YAML blocks — prose stands alone

**Given** a contributor wants to understand deployment
**When** they look for extension deployment documentation
**Then** the extension deployment mechanism is documented separately from composition patterns (TF-FR5)
**And** the documentation covers how new modules are copied, registered, and validated through the existing Convoke infrastructure

### Story 1.4: Bidirectional Gyre Validation

As a framework contributor,
I want the Architecture Reference validated against Gyre — both predicting Gyre's actual structure and guiding someone to build it from scratch,
So that I can trust the reference is accurate and complete, not just theoretical.

**Acceptance Criteria:**

**Given** the completed Architecture Reference
**When** validated against the Gyre module at `_bmad/bme/_gyre/`
**Then** every check in the reference can be evaluated against Gyre's actual file structure, registration, and configuration (TF-FR6 — predicts structure)
**And** Gyre passes all applicable checks for its composition pattern

**Given** a hypothetical "build Gyre from scratch" scenario
**When** a contributor follows only the Architecture Reference
**Then** the reference provides sufficient information to recreate Gyre's directory structure, agent files, workflow layout, contract definitions, registration entries, and config (TF-FR6 — guides building)
**And** any gaps discovered during validation are addressed in the reference before Phase 1 exit

**Given** the reference serves as hypothesis test for A5' (four quality properties) and A6' (two composition patterns)
**When** Gyre validation reveals structural patterns that don't fit the four properties or two patterns
**Then** the finding is documented as evidence for or against the hypotheses — the reference is the formal test, not just a prerequisite

### Story 1.5: Vortex Cross-Validation (Stretch)

As a framework contributor,
I want the Architecture Reference validated against Vortex — the more complex Sequential team,
So that I can confirm the reference handles advanced Sequential patterns (multi-target contracts, feedback routing, 7-agent pipelines) and didn't lose Vortex-specific details during generalization.

**Acceptance Criteria:**

**Given** the completed Architecture Reference and Gyre validation report
**When** the 29 Sequential checks are evaluated against the Vortex module at `_bmad/bme/_vortex/`
**Then** a Vortex validation report documents pass/fail for each check with evidence
**And** findings specific to complex Sequential patterns (HC6-HC10 feedback contracts, multi-target routing) are documented

**Note:** This is a stretch/backlog story — not required for Phase 1 exit. The reference was derived from Vortex patterns, so this is a regression check, not an independent hypothesis test. Gyre validation (Story 1.4) is the formal A5'/A6' gate.

---

## Epic 2: Team Factory Guided Workflow

Framework contributors can create fully-wired, BMAD-compliant teams through a guided factory conversation — zero post-creation fixes. Decision state persisted as spec file for resume and express mode.

### Story 2.1: Factory Discoverability & Entry Points

As a framework contributor,
I want to find the Team Factory through the surfaces I already use (agent menu, help, BMad Master),
So that I don't need to know the factory exists in advance — I discover it when I need to extend BMAD.

**Acceptance Criteria:**

**Given** a framework contributor wants to extend BMAD
**When** they look for guidance
**Then** the factory entry point exists in all 4 enumerated surfaces: agent menu, module-help.csv, BMad Master "what's available?" response, and README (TF-FR14, TF-NFR10)

**Given** a contributor describes a problem like "I want to automate onboarding" (not using BMAD terminology)
**When** intent-based routing evaluates the request
**Then** the factory determines whether the need is a team, agent addition, or skill addition and routes accordingly
**And** if the need doesn't match a factory capability (Phase 2: teams only), the contributor gets a graceful fallback with the Architecture Reference checklist

### Story 2.2: Composition Pattern Selection & Decision Cascade

As a framework contributor,
I want the factory to help me choose between Independent and Sequential composition patterns and automatically eliminate irrelevant decisions based on my choice,
So that I make the right architectural decision upfront and only deal with decisions that apply to my pattern.

**Acceptance Criteria:**

**Given** a contributor enters the factory's Create Team workflow
**When** Step 1 (Orient) begins
**Then** the factory presents composition patterns in plain language with examples from existing teams (Vortex = Sequential, native teams = Independent) (TF-FR8)
**And** each step introduces ≤3 new concepts (TF-NFR2)

**Given** the factory presents pattern options
**When** suggesting a default
**Then** the default is selected based on the most common pattern in existing teams, with reasoning shown (TF-FR18)
**And** the contributor confirms or overrides the suggestion

**Given** the contributor selects a composition pattern
**When** the cascade logic evaluates downstream decisions
**Then** irrelevant decisions are eliminated — e.g., contracts are required for Sequential but optional for Independent (TF-FR17)
**And** the contributor only sees decisions relevant to their selected pattern

### Story 2.3: Agent Scope Definition & Overlap Detection

As a framework contributor,
I want to define my team's agents one by one with naming enforcement and overlap detection,
So that my agents are properly scoped, correctly named, and don't silently duplicate existing capabilities.

**Acceptance Criteria:**

**Given** the contributor is in Step 2 (Scope)
**When** defining agents for their team
**Then** the factory forces explicit scope decisions for each agent before proceeding (TF-FR8)
**And** contextual examples from Vortex and native teams are surfaced at each decision point (TF-FR13)

**Given** a new agent name is proposed
**When** the factory validates the name
**Then** naming conventions are actively enforced — kebab-case, role-based, matching agent ID regex (TF-FR22)
**And** violations are flagged immediately with the correct format shown

**Given** agent definitions are provided
**When** the factory checks for overlaps
**Then** the factory surfaces potential overlaps against the existing agent manifest for human review (TF-FR12)
**And** the contributor can override with acknowledgment — overlap detection informs, it does not block
**And** the factory shows the manifest comparison so the contributor can see exactly where overlap exists

### Story 2.4: Contract Design & Step Validation

As a framework contributor,
I want the factory to guide me through designing handoff contracts between agents with per-step validation,
So that my agents have well-defined interfaces and each step is confirmed correct before moving on.

**Acceptance Criteria:**

**Given** the contributor is in Step 3 (Connect)
**When** defining contracts for a Sequential team
**Then** the factory presents a contract template based on the Sequential pattern and asks what each agent passes to the next (TF-FR8)
**And** validation rules are applied per the composition pattern — contracts required for Sequential, optional for Independent (TF-FR16)

**Given** each step produces output
**When** moving to the next step
**Then** step output is validated and confirmed before proceeding (TF-FR9)
**And** validation is stateless — takes the spec object as input, returns structured results (Mode Parity guarantee)

### Story 2.5: Decision Summary & Spec File Persistence

As a framework contributor,
I want to see all my decisions summarized for approval and have them persisted as a spec file,
So that I can review everything before generation begins and resume later if interrupted.

**Acceptance Criteria:**

**Given** all decision steps (Orient, Scope, Connect) are complete
**When** Step 4 (Review) is reached
**Then** a decision summary checkpoint presents all decisions for approval before generation begins (TF-FR19)
**And** the contributor explicitly approves or requests changes

**Given** the contributor approves the decision summary
**When** decisions are persisted
**Then** all decisions are saved as a team spec file (YAML) that serves as audit trail, resume point, and express mode input (TF-FR21)
**And** the spec file includes per-decision rationale with `default_accepted` flags
**And** the spec file is written atomically — `.tmp` → validate → rename

**Given** the factory is interrupted mid-flow
**When** the contributor returns later
**Then** they can resume by loading the team spec file — resume presents the decision summary and continues from the last step whose output is absent (TF-NFR9)

### Story 2.6: BMB Delegation & Artifact Generation

As a framework contributor,
I want the factory to delegate artifact generation to BMB with full context about my team decisions,
So that agent files, workflow files, and contract files are generated from shared templates — not hand-authored by the factory.

**Acceptance Criteria:**

**Given** the contributor has approved the decision summary
**When** Step 5 (Generate) begins
**Then** the factory delegates artifact generation to BMB with full context — composition pattern, existing agents, scope boundaries (TF-FR10)
**And** the factory never authors agent files, workflow steps, or skill templates — only integration wiring (TF-NFR6)
**And** generated artifacts are produced sequentially per agent — each agent's files are generated and reviewed before proceeding to the next
**And** template substitution uses safe templating — whitelist-only variable names, no raw string interpolation (TF-NFR14)

**Given** the same spec file is used twice
**When** generation runs both times
**Then** identical artifacts are produced — idempotent (TF-FR23, TF-NFR4)

### Story 2.7: Integration Wiring — Config, CSV & Activation

As a framework contributor,
I want the factory to create my team's config.yaml, module-help.csv, and validate activation blocks,
So that my team is properly configured, discoverable, and has correct activation paths — without manual file creation.

**Acceptance Criteria:**

**Given** artifact generation (Story 2.6) is complete
**When** the factory creates integration files
**Then** a per-module config.yaml is created at `_bmad/bme/_team-name/config.yaml` with all required fields (TF-FR11)
**And** a per-module module-help.csv is created with header and agent/workflow rows (TF-FR11)
**And** activation blocks in generated agent .md files are validated for correct config and module path references
**And** config field collision detection runs before writing — new fields don't collide with existing fields (TF-NFR15)
**And** factory operations are additive — new files only, no modification of existing team files (TF-NFR17)

### Story 2.8: Registry Wiring & Write Safety

As a framework contributor,
I want the factory to register my team in agent-registry.js with full write safety,
So that my team's agents and workflows are available system-wide without risking corruption of existing registrations.

**Acceptance Criteria:**

**Given** artifacts and integration files are created
**When** the factory writes to agent-registry.js (the only shared file)
**Then** a new module block is added with agents, workflows, derived lists, and exports (TF-FR11)
**And** the Write Safety Protocol is followed: stage (prepare in isolation) → validate (check format-correct, additive) → check (dirty-tree detection immediately before write) → apply (write to target) → verify (re-read + re-parse + `node require()` post-write validation) (TF-NFR12, TF-NFR13)
**And** the operation is additive — existing module blocks are never modified or removed (TF-NFR17)

**Given** dirty-tree detection finds uncommitted changes to agent-registry.js
**When** the check stage runs
**Then** the factory warns the contributor about the conflict and asks for confirmation before proceeding (TF-NFR12)

**Given** post-write validation fails (`node require()` throws)
**When** structural integrity check detects corruption
**Then** the write is rolled back to the pre-write state and the contributor sees the error

### Story 2.9: End-to-End Validation & Error Recovery

As a framework contributor,
I want the factory to validate the complete team output and recover cleanly if anything fails,
So that I'm confident my team is correct on first run and I don't get stuck with a half-built team.

**Acceptance Criteria:**

**Given** artifact generation and wiring are complete
**When** Step 6 (Validate) runs
**Then** an end-to-end validation pass checks the full team against the Architecture Reference rules (TF-FR20)
**And** the team passes the same validation rules and refresh pipeline as native teams (TF-NFR7)
**And** a file manifest of all created and modified files is produced (TF-NFR16)
**And** the contributor sees the manifest and validation results

**Given** validation fails at any point
**When** an error occurs
**Then** error messages include step name, decision ID, and expected-vs-actual values (TF-NFR11)
**And** the factory rolls back to the last validated state — no partial writes persist (TF-FR24)
**And** the contributor sees which step failed and why

**Given** the contributor wants to undo the entire creation
**When** they request abort
**Then** the creation manifest lists all files created with removal instructions (TF-FR15)

**Given** factory output passes validation
**When** the contributor reviews the result
**Then** zero manual fixes are required — the team is ready to use (TF-NFR3)
**And** user-facing complexity felt Low — the contributor completed without consulting external documentation (TF-NFR1)

---

## Epic 2: Implementation Status (2026-04-02)

### Files Delivered

**JS Modules (6):**
- `lib/cascade-logic.js` — Pattern-aware decision elimination (10 decisions, 2 patterns)
- `lib/collision-detector.js` — L1 exact ID + L2 Levenshtein similarity detection
- `lib/spec-parser.js` — YAML load + schema-driven validation
- `lib/spec-writer.js` — Atomic write with round-trip verification
- `lib/spec-differ.js` — Resume point detection + spec diffing

**JSON Schemas (2):**
- `schemas/schema-independent.json` — Independent pattern spec validation
- `schemas/schema-sequential.json` — Sequential pattern spec validation

**Workflow Steps (6):**
- `workflows/step-00-route.md` — Intent routing (create/resume/express)
- `workflows/add-team/step-01-scope.md` — Team identity, pattern, agents, overlap
- `workflows/add-team/step-02-connect.md` — Contracts, output dir, routing, config
- `workflows/add-team/step-03-review.md` — Decision summary, validation gate
- `workflows/add-team/step-04-generate.md` — BMB delegation, wiring, safety protocol
- `workflows/add-team/step-05-validate.md` — E2E validation, manifest, metrics

**Agent & Config (4):**
- `agents/team-factory.md` — Forge Master persona, activation XML, menu
- `config.yaml` — Module configuration
- `module-help.csv` — CLI discovery entries
- `templates/team-spec-template.yaml` — Express Mode skeleton

**Skill Entry:**
- `.claude/skills/bmad-agent-bme-team-factory/SKILL.md`

### Story Completion

| Story | Status | Notes |
|-------|--------|-------|
| 2.1 Discoverability | Done (minor gap) | Agent menu, help CSV, skill entry shipped. README entry missing |
| 2.2 Pattern & Cascade | Done | `cascade-logic.js` — full elimination logic |
| 2.3 Scope & Overlap | Done | `collision-detector.js` — L1+L2, naming in spec-parser |
| 2.4 Contracts & Validation | Done (partial) | step-02-connect.md ships. B-lite semantic validation deferred to I13 |
| 2.5 Summary & Persistence | Done | spec-parser/writer/differ + schemas + template |
| 2.6 BMB Delegation | Done (partial) | step-04-generate.md ships. Shared BMB templates (P1/P6) not externalized — depends on P12 (Enhance) |
| 2.7 Config/CSV/Activation | Done | Pre-existing lib: config-creator, csv-creator, activation-validator |
| 2.8 Registry Wiring | Done | Pre-existing lib: registry-writer with full Write Safety Protocol |
| 2.9 E2E Validation | Done | Pre-existing lib: end-to-end-validator, manifest-tracker |

### Code Review (2026-04-02)

Review layers: Blind Hunter (adversarial, diff-only) + Edge Case Hunter (full project + architecture doc).
11 patches applied, 6 deferred, 11 dismissed. Story: `story-team-factory-review-fixes.md` (done).

Critical fixes: CSV header alignment, schema persona fields.
High fixes: spec-parser validation strengthening, collision-detector error surfacing.
Medium fixes: dead params removed, JSDoc gaps, round-trip expansion, object comparison, compass_routing standardization.

### Deferred Items

| Item | Deferred To | Reason |
|------|-------------|--------|
| BMB shared templates (`_bmad/core/resources/templates/`) | P12 (Enhance) | Templates are Enhance's deliverable, not factory's |
| B-lite semantic validation (artifact type matching) | I13 (Express Mode) | Guided mode uses LLM reasoning; standalone check deferred |
| README discoverability entry | Next touch | Minor — factory is discoverable via skill and agent menu |
| Express Mode (skip-to-review from spec file) | I13 | Guided mode sufficient for current usage |

### Validation

- 156 existing tests pass (zero regressions)
- M2 validation: Gyre spec round-trips through write→parse→resume→collision pipeline
- Cascade correctly eliminates 5/10 decisions for Independent, keeps all 10 for Sequential
- Collision detector catches existing Gyre module and agent IDs

---

## Epic 3: Team Factory Extensions

Framework contributors can add agents to existing teams or skills to existing agents without manual wiring.

**Dependency:** Requires Epic 2 (Guided Workflow) — extension workflows reuse the factory's validation, wiring, and BMB delegation infrastructure.

### Story 3.1: Add Agent to Existing Team

As a framework contributor,
I want to add a new agent to an existing team with automated scope checking, registration, and contract wiring,
So that I can extend a team's capabilities without manually editing registry files, contracts, and configuration.

**Acceptance Criteria:**

**Given** a contributor wants to add an agent to an existing team
**When** they invoke the Add Agent workflow
**Then** the factory loads the existing team's spec file and composition pattern
**And** the factory performs scope checking — verifying the new agent doesn't overlap with existing agents in the team (TF-FR25)
**And** overlap detection runs against both the team's agents and the full agent manifest

**Given** scope check passes (or overlap is acknowledged)
**When** the new agent is defined
**Then** the factory generates the agent artifact via BMB delegation
**And** registration entries are added to agent-registry.js
**And** contract wiring is updated — new contracts created for agent handoffs if the team uses Sequential pattern
**And** config.yaml is updated with the new agent entry
**And** module-help.csv is updated with the new agent's help entry
**And** all modifications follow the Write Safety Protocol and additive-only rules
**And** end-to-end validation confirms the extended team still passes all checks

### Story 3.2: Add Skill/Workflow to Existing Agent

As a framework contributor,
I want to add a new skill or workflow to an existing agent with automated manifest and menu wiring,
So that I can extend an agent's capabilities without manually editing multiple files.

**Acceptance Criteria:**

**Given** a contributor wants to add a skill or workflow to an existing agent
**When** they invoke the Add Skill workflow
**Then** the factory identifies the target agent and its team context
**And** the factory generates the skill/workflow template via BMB delegation (TF-FR26)

**Given** the skill/workflow artifact is generated
**When** integration wiring runs
**Then** the agent's manifest is updated with the new skill/workflow entry
**And** the agent's menu is updated to include the new capability
**And** if the skill has dependencies on other agents, contract wiring is validated
**And** all modifications follow the Write Safety Protocol and additive-only rules
**And** end-to-end validation confirms the agent and its team still pass all checks
