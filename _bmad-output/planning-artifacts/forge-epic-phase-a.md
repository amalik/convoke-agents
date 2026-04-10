# Forge Phase A — Epic Breakdown (Silo + Rune)

**Version:** 1.0.0-draft
**Date:** 2026-03-21
**Status:** Draft — pending PRD and architecture review
**Scope:** Phase A delivers the two highest-value Forge agents: Silo (Survey) and Rune (Excavate)
**Depends on:** KORE Method specification (referenced but not yet implemented)

---

## Why Phase A first

Phase A targets **engagement weeks 1-4** — the period where consultants burn the most time on knowledge discovery. Every enterprise brownfield engagement follows the same pattern:

1. Week 1: "What systems exist? Who knows what? Where are the docs?" → **Silo**
2. Week 2-4: "Why does this work this way? What's the history? What's undocumented?" → **Rune**
3. Week 4+: Codification, validation, stewardship → **Phase B and C** (Aria, Sage, Warden)

Shipping Silo and Rune first delivers value on the next engagement. Phases B and C compound that value over time.

---

## Phase A goals

1. A consultant can run a structured knowledge survey of a client environment using Silo
2. A consultant can conduct targeted knowledge excavation sessions using Rune
3. Both agents produce artifacts compatible with the FG-HC1 handoff contract (Forge→Gyre)
4. The Forge module installs cleanly into an existing Convoke project

---

## Epic 1: Forge Module Foundation

**Goal:** Establish the Forge module structure, configuration, and installer integration so Silo and Rune have a home.

### Story 1.1: Module directory structure

**As a** Convoke maintainer
**I want** the Forge module to follow the established module pattern
**So that** it integrates cleanly with the existing installer and update system

**Acceptance criteria:**
- [ ] `_bmad/bme/_forge/` directory structure created following BME module conventions
- [ ] `agents/` subdirectory for agent definitions
- [ ] `workflows/` subdirectory for agent workflows
- [ ] `contracts/` subdirectory for handoff contracts (FG-HC1, FG-HC2, GF-HC1)
- [ ] `_bmad-output/forge-artifacts/` output directory convention established

### Story 1.2: Forge configuration and manifest

**As a** Convoke user
**I want** Forge agents to appear in my agent manifest after installation
**So that** I can invoke them like any other BMAD agent

**Acceptance criteria:**
- [ ] Silo and Rune entries added to agent manifest CSV format
- [ ] Configuration entries in module config (following `_bmad/bme/_vortex/` pattern)
- [ ] Forge agents discoverable via bmad-master agent roster

### Story 1.3: Installer integration

**As a** Convoke user
**I want** to install Forge via `npx convoke-install-forge` (or similar)
**So that** I can add Forge to an existing project without reinstalling everything

**Acceptance criteria:**
- [ ] Installer command creates Forge directory structure
- [ ] Installer adds Forge agents to manifest
- [ ] Installer creates output directory
- [ ] Installer is idempotent (safe to re-run)
- [ ] `convoke-doctor` validates Forge installation

---

## Epic 2: Silo Agent — Knowledge Survey

**Goal:** Silo helps consultants systematically map the knowledge landscape of a client environment — what systems exist, who knows what, where documentation lives, and what's undocumented.

### Story 2.1: Silo agent definition

**As a** consultant starting a new engagement
**I want** a specialized agent that guides me through knowledge landscape mapping
**So that** I don't miss critical knowledge sources in the first week

**Acceptance criteria:**
- [ ] Agent definition file: `_bmad/bme/_forge/agents/knowledge-surveyor.md`
- [ ] Persona: Silo — systematic, thorough, methodical. "Let's map everything before we dig."
- [ ] Communication style: checklist-driven, organized, surfaces gaps proactively
- [ ] Principles: breadth before depth, map before excavate, document sources not just knowledge
- [ ] Menu system following BMAD agent conventions

### Story 2.2: System landscape survey workflow

**As a** consultant in engagement week 1
**I want** a guided workflow for mapping the client's system landscape
**So that** I have a structured inventory of systems, services, and their relationships

**Acceptance criteria:**
- [ ] Workflow guides consultant through: system inventory, service dependencies, data flows, integration points
- [ ] Produces a System Landscape Map artifact
- [ ] Identifies systems with no documentation (documentation gap list)
- [ ] Identifies systems with no clear owner (ownership gap list)
- [ ] Workflow is conversational — Silo asks questions, consultant provides answers

### Story 2.3: Knowledge holder mapping workflow

**As a** consultant in engagement week 1
**I want** to map which people hold knowledge about which systems
**So that** Rune knows who to target for excavation sessions

**Acceptance criteria:**
- [ ] Workflow guides consultant through: identifying key personnel, mapping expertise areas, noting availability and willingness
- [ ] Produces a Knowledge Holder Map artifact
- [ ] Maps person → system/domain expertise
- [ ] Flags single points of failure (one person holds all knowledge for a critical system)
- [ ] Flags upcoming departures or role changes (knowledge flight risk)

### Story 2.4: Documentation audit workflow

**As a** consultant in engagement week 1
**I want** to assess the state of existing documentation
**So that** I know what's current, what's stale, and what doesn't exist

**Acceptance criteria:**
- [ ] Workflow guides consultant through: locating docs, assessing currency, identifying gaps
- [ ] Produces a Documentation Audit artifact
- [ ] For each system: documentation exists (yes/no), last updated, assessed accuracy (current/stale/unknown)
- [ ] Generates prioritized list of documentation gaps sorted by system criticality

### Story 2.5: Survey synthesis and excavation queue

**As a** consultant completing the survey phase
**I want** Silo to synthesize survey findings into a prioritized excavation queue
**So that** Rune's excavation sessions target the highest-value knowledge gaps first

**Acceptance criteria:**
- [ ] Silo produces an Excavation Queue artifact from survey outputs
- [ ] Queue is prioritized by: system criticality × knowledge gap severity × knowledge holder availability
- [ ] Each queue item includes: what to excavate, who to talk to, what's already known
- [ ] Queue format is consumable by Rune's workflows

---

## Epic 3: Rune Agent — Knowledge Excavation

**Goal:** Rune helps consultants conduct structured knowledge excavation sessions — extracting tribal knowledge from people, code, and systems through guided investigation.

### Story 3.1: Rune agent definition

**As a** consultant with an excavation queue from Silo
**I want** a specialized agent that guides me through deep knowledge extraction
**So that** I capture critical tribal knowledge before it's lost or forgotten

**Acceptance criteria:**
- [ ] Agent definition file: `_bmad/bme/_forge/agents/knowledge-excavator.md`
- [ ] Persona: Rune — curious, persistent, respectful. "Every system has a story. Let's find it."
- [ ] Communication style: probing but empathetic, follows threads, asks "why" without interrogating
- [ ] Principles: depth over breadth (complement to Silo), respect the knowledge holder's time, verify before recording
- [ ] Menu system following BMAD agent conventions

### Story 3.2: Interview preparation workflow

**As a** consultant preparing for a knowledge extraction session
**I want** Rune to help me prepare targeted questions based on the excavation queue
**So that** I use the knowledge holder's time efficiently

**Acceptance criteria:**
- [ ] Workflow consumes an Excavation Queue item
- [ ] Generates a tailored interview guide: context (what we already know), key questions, follow-up probes
- [ ] Interview guide respects the knowledge holder's expertise level and role
- [ ] Estimated session duration and recommended format (1:1, walkthrough, pair investigation)

### Story 3.3: Guided excavation session workflow

**As a** consultant during a knowledge extraction session
**I want** Rune to help me capture knowledge in real-time
**So that** I don't lose insights while trying to listen and write simultaneously

**Acceptance criteria:**
- [ ] Workflow provides a structured capture template for live sessions
- [ ] Prompts for: facts, decisions, rationale, constraints, dependencies, risks
- [ ] Captures verbatim quotes for critical knowledge (knowledge holder's own words)
- [ ] Flags when an answer reveals a new knowledge gap (feeds back to excavation queue)
- [ ] Produces a raw Excavation Session artifact

### Story 3.4: Code archaeology workflow

**As a** consultant investigating undocumented system behavior
**I want** Rune to guide me through systematic code investigation
**So that** I extract knowledge from code when no human source is available

**Acceptance criteria:**
- [ ] Workflow guides: identifying key files, reading git history, tracing decision points
- [ ] Helps consultant form hypotheses about "why" from "what" (code → intent)
- [ ] Produces a Code Archaeology artifact: discovered behaviors, inferred decisions, remaining unknowns
- [ ] Flags items that need human verification ("I think this is because X — confirm with [person]")

### Story 3.5: Tribal Knowledge Asset production

**As a** consultant completing excavation sessions
**I want** Rune to produce structured TKAs from raw excavation outputs
**So that** the knowledge is in a format other agents (including Gyre) can consume

**Acceptance criteria:**
- [ ] Rune produces TKA artifacts from session notes and code archaeology findings
- [ ] TKAs follow the FG-HC1 contract schema (Gyre-compatible frontmatter)
- [ ] Each TKA includes: operational impact, context, source, confidence level
- [ ] TKAs are tagged with `gyre_relevance` metadata for Gyre routing
- [ ] TKAs stored in `_knowledge/tka/` (KORE convention)

---

## Epic 4: Forge↔Gyre Integration

**Goal:** Forge Phase A artifacts flow into Gyre's contextual model, and Gyre's knowledge gaps flow back to Forge.

### Story 4.1: FG-HC1 contract implementation

**As a** Gyre user with Forge installed
**I want** Gyre to automatically discover and ingest Forge TKAs
**So that** my readiness assessment is enriched with tribal knowledge

**Acceptance criteria:**
- [ ] Gyre detection phase scans `_knowledge/tka/*.md` for `contract: FG-HC1` artifacts
- [ ] TKAs with `gyre_relevance.domain: observability` route to Observability agent
- [ ] TKAs with `gyre_relevance.domain: deployment` route to Deployment agent
- [ ] TKAs with `gyre_relevance.domain: compliance` route to Compliance agent
- [ ] Gyre CLI output shows "Ingested X Forge TKAs" when TKAs are present
- [ ] Gyre capabilities manifest reflects TKA-derived inputs (e.g., "SLO: batch completion by 6 AM — source: TKA-003")

### Story 4.2: GF-HC1 contract implementation

**As a** Forge user reviewing Gyre output
**I want** Gyre to surface knowledge gaps as structured excavation requests
**So that** I can run targeted Rune sessions to fill those gaps

**Acceptance criteria:**
- [ ] Gyre domain agents produce `contract: GF-HC1` findings when knowledge is missing
- [ ] Findings written to `.gyre/knowledge-gaps/` directory
- [ ] Each finding includes: what Gyre found, what it needs to know, suggested excavation approach
- [ ] Gyre CLI summary includes "Knowledge gaps for Forge: X items" section
- [ ] Silo can ingest GF-HC1 findings to update the excavation queue

---

## Epic 5: Quality and validation

### Story 5.1: Agent testing

**As a** Convoke maintainer
**I want** automated tests for Silo and Rune agent definitions
**So that** agent quality is maintained as the module evolves

**Acceptance criteria:**
- [ ] Agent definition files pass BMAD agent validation (frontmatter, structure, required sections)
- [ ] Workflow files pass workflow validation
- [ ] Contract schema files are syntactically valid
- [ ] Tests run as part of existing `npm test` suite

### Story 5.2: Artifact schema validation

**As a** Forge user
**I want** produced artifacts to be validated against contract schemas
**So that** downstream consumers (especially Gyre) can rely on artifact structure

**Acceptance criteria:**
- [ ] FG-HC1 artifacts validated against schema before writing
- [ ] Validation errors surfaced to user with actionable fix suggestions
- [ ] GF-HC1 artifacts validated on Gyre side before ingestion

---

## Build sequence recommendation

```
Sprint 1:  Epic 1 (Foundation) — module structure, config, installer
Sprint 2:  Epic 2 (Silo) — agent + 4 workflows + synthesis
Sprint 3:  Epic 3 (Rune) — agent + 4 workflows + TKA production
Sprint 4:  Epic 4 (Integration) — FG-HC1 + GF-HC1 implementation
Sprint 5:  Epic 5 (Quality) — tests + validation
```

**Phase B planning** (Aria — codification) begins during Sprint 4 based on Phase A learnings.

---

## Dependencies and risks

| Risk | Mitigation |
|------|-----------|
| KORE spec not yet finalized | Phase A agents designed to the current KORE draft; Aria/Sage/Warden depend more heavily on KORE formalization |
| Gyre not yet shipping | Epic 4 (integration) can be deferred; Silo and Rune deliver standalone value |
| TKA format may evolve | FG-HC1 contract defines a stable interface; internal TKA structure can change without breaking the contract |
| Consultant adoption | Friction log template captures Phase A feedback; iterate workflows based on real engagement use |
