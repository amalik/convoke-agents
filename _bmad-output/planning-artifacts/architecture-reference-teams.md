# Architecture Reference — Team Validity & Composition

## Introduction

This document defines what makes a valid BMAD team. It serves three audiences:

1. **Human contributors** — framework contributors reading this to understand team design requirements and rationale
2. **Factory workflow** — the Team Factory (Phase 2) parses embedded YAML data blocks at runtime to drive validation and decision logic
3. **Validator** — compliance checking against the same structured rules

### Format Conventions

- **Prose sections** explain "why" — the reasoning behind each quality property and composition pattern
- **YAML data blocks** (fenced) contain machine-extractable checklists with structured check IDs
- YAML blocks are identified by the presence of `quality_property`, `composition_pattern`, and `checks` top-level keys — non-checklist YAML blocks (code examples, etc.) lack these keys and are ignored
- Prose references check IDs inline (e.g., "**DISC-01** — module-help.csv is the primary...") for traceability
- Each section is independently addressable for JIT loading — no shared content between sections

### Document Layout

- **Composition Patterns** — definitions of the two patterns and when to use each
- **Quality Properties** — definitions of the four properties that define team validity
- **Checklist Sections** — 8 sections (one per quality property × composition pattern) with YAML data blocks containing machine-consumable validation rules

### Hypothesis Notes

The four quality properties derive from assumption **A5'** (High lethality, Medium uncertainty). The two composition patterns derive from assumption **A6'** (High lethality, Medium uncertainty). Story 1.4 (Gyre Validation) is the formal test for both. This document is designed so that revising properties or adding a third composition pattern does not require restructuring the factory's core workflow.

---

## Composition Patterns

Two composition patterns describe how teams are structured and how their agents interact. The choice of pattern affects which checklist items apply (detailed in the 8 checklist sections below).

### Independent Pattern

**Description:** Agents operate standalone within a shared module boundary. Each agent has its own workflows and produces artifacts independently. There are no handoff contracts between agents — each agent's work is self-contained.

**When to use:**
- Agents address separate concerns that don't require sequential data flow
- Each agent can run without depending on another agent's output
- The team is a collection of related capabilities, not a pipeline

**How agents interact:**
- No handoff contracts — agents do not pass structured artifacts to each other
- No orchestration workflow — each agent is invoked directly
- Shared module infrastructure (config.yaml, module-help.csv, agent-registry entries) but independent execution

**Existing example:** The `_enhance` module (`_bmad/bme/_enhance/`) is the closest existing example of the Independent structure. It demonstrates standalone operation with no inter-agent contracts. **Caveat:** _enhance is a skill/workflow module with modes (triage, review, create) — it has no `agents/` directory. It demonstrates the Independent module *structure* (standalone, no contracts) but lacks the agent file structure a true multi-agent Independent team would have. No pure Independent multi-agent team currently exists in the codebase.

### Sequential Pattern

**Description:** Agents form a pipeline where each agent's output becomes the next agent's input. Structured handoff contracts define the artifact format passed between agents. A shared workflow orchestrates the sequence.

**When to use:**
- Work flows through defined stages in a logical order
- Each agent transforms or enriches artifacts from the previous stage
- End-to-end traceability across the pipeline is required

**How agents interact:**
- Handoff contracts define the schema of artifacts passed between agents
- Orchestration workflows sequence agent execution (e.g., full-analysis pipeline)
- Shared artifacts accumulate through the pipeline
- Compass routing tables provide navigation across all workflows

**Existing examples:**
- **Vortex** (`_bmad/bme/_vortex/`) — 7 agents (Emma, Isla, Mila, Liam, Wade, Noah, Max) with 10 handoff contracts (HC1-HC10), 22 workflows, compass routing reference
- **Gyre** (`_bmad/bme/_gyre/`) — 4 agents (Scout, Atlas, Lens, Coach) with 4 handoff contracts (GC1-GC4), 7 workflows, compass routing table

### Pattern Comparison

| Dimension | Independent | Sequential |
|-----------|-------------|------------|
| Contracts | None | Handoff contracts define inter-agent artifact schemas |
| Orchestration | None — each agent invoked directly | Workflow pipelines sequence agent execution |
| Agent Independence | Fully independent — can run in any order or isolation | Ordered — each agent depends on predecessor's output |
| Shared Artifacts | None between agents | Accumulate through pipeline |
| Typical Use Cases | Related but separate capabilities, skill augmentation | Multi-stage discovery, analysis pipelines, progressive refinement |
| Compass Routing | Optional — per-agent entry points | Required — navigation across pipeline stages |
| Example Scale | _enhance: 1 module with modes, no agents directory | Vortex: 7 agents, 10 contracts; Gyre: 4 agents, 4 contracts |

---

## Quality Properties

Four quality properties define what it means for a team to be valid within the BMAD framework. A team must satisfy all four to be considered complete and correctly integrated.

### Discoverable

**What it means:** The team can be found through standard surfaces. A contributor searching for capabilities — whether browsing menus, reading documentation, or asking the BMad Master — encounters the team through normal discovery channels.

**Why it matters:** A team that can't be found can't be used. Discovery is the first gate — if a contributor doesn't know the team exists, all other quality properties are irrelevant. The framework supports multiple discovery paths (menu browsing, documentation reading, conversational routing), and a valid team must be present on all of them.

**Key surfaces:**
- `module-help.csv` — primary machine-readable discovery surface, maps agents to their capabilities and entry points
- Agent menu — activation XML in agent definitions makes the team's workflows accessible through the standard agent interface
- BMad Master — conversational routing enables intent-based discovery ("I want to analyze production readiness" → Gyre)
- README / documentation — human-readable descriptions of what the team does and when to use it

### Installable

**What it means:** The team installs cleanly through standard infrastructure. Running `convoke-install` or `convoke-update` produces a working team installation without manual file copying, path fixups, or post-install configuration.

**Why it matters:** Manual installation is error-prone and creates divergent environments. The installation infrastructure ensures every user gets the same files in the same locations. A team that requires manual steps to install is fragile and will break as the framework evolves.

**Key mechanisms:**
- `convoke-install` / `convoke-update` — CLI commands that handle file copying and updates
- `agent-registry.js` — central registry mapping module names to their agents, workflows, and paths
- `refresh-installation.js` — shared refresh logic that copies module files to the correct locations
- Module directory structure — standard layout (`agents/`, `workflows/`, `contracts/`, `config.yaml`) that the infrastructure expects

### Configurable

**What it means:** The team adapts to project context via configuration. User-specific settings (name, language, output paths) are injected through config.yaml rather than hardcoded into agent or workflow files.

**Why it matters:** A team hardcoded to one project's paths or conventions can't be reused. Configuration makes teams portable — the same team definition works across different projects, users, and environments. The framework's config-merger ensures sensible defaults while allowing project-specific overrides.

**Key mechanisms:**
- `config.yaml` — per-module configuration file with user-settable fields (output paths, user name, language, party mode)
- Activation XML — agent activation blocks reference config paths for dynamic values
- Naming conventions — predictable naming (submodule_name, agent file names, workflow names) enables config-driven wiring
- Template variables — `{user}`, `{project-root}` and similar placeholders resolved from config at runtime

### Composable

**What it means:** The team's agents work together internally and can connect with agents from other teams. Cross-team routing is possible — a Gyre finding can route to a Vortex agent, and vice versa.

**Why it matters:** Teams don't exist in isolation. Product discovery (Vortex) informs production readiness analysis (Gyre), and readiness gaps may trigger new discovery cycles. A composable team participates in the broader framework ecosystem rather than being a standalone silo.

**Key mechanisms:**
- Handoff contracts — structured schemas that define how artifacts flow between agents (within Sequential teams)
- Compass routing — navigation tables that map "what do I do next?" to specific workflows and agents, including cross-module routes
- Inter-module references — contracts and routing that connect agents across team boundaries (e.g., Gyre Coach → Vortex Emma)
- Agent manifest — `agent-manifest.csv` enables overlap detection, ensuring new teams don't duplicate existing capabilities

---

## Discoverable — Independent

<!-- Story 1.2 will populate this section with YAML checklist data blocks -->
<!-- Story 1.3 will add per-check "why" prose with inline check ID references -->

_Checklist pending — see Stories 1.2 and 1.3._

---

## Discoverable — Sequential

<!-- Story 1.2 will populate this section with YAML checklist data blocks -->
<!-- Story 1.3 will add per-check "why" prose with inline check ID references -->

_Checklist pending — see Stories 1.2 and 1.3._

---

## Installable — Independent

<!-- Story 1.2 will populate this section with YAML checklist data blocks -->
<!-- Story 1.3 will add per-check "why" prose with inline check ID references -->

_Checklist pending — see Stories 1.2 and 1.3._

---

## Installable — Sequential

<!-- Story 1.2 will populate this section with YAML checklist data blocks -->
<!-- Story 1.3 will add per-check "why" prose with inline check ID references -->

_Checklist pending — see Stories 1.2 and 1.3._

---

## Configurable — Independent

<!-- Story 1.2 will populate this section with YAML checklist data blocks -->
<!-- Story 1.3 will add per-check "why" prose with inline check ID references -->

_Checklist pending — see Stories 1.2 and 1.3._

---

## Configurable — Sequential

<!-- Story 1.2 will populate this section with YAML checklist data blocks -->
<!-- Story 1.3 will add per-check "why" prose with inline check ID references -->

_Checklist pending — see Stories 1.2 and 1.3._

---

## Composable — Independent

<!-- Story 1.2 will populate this section with YAML checklist data blocks -->
<!-- Story 1.3 will add per-check "why" prose with inline check ID references -->

_Checklist pending — see Stories 1.2 and 1.3._

---

## Composable — Sequential

<!-- Story 1.2 will populate this section with YAML checklist data blocks -->
<!-- Story 1.3 will add per-check "why" prose with inline check ID references -->

_Checklist pending — see Stories 1.2 and 1.3._
