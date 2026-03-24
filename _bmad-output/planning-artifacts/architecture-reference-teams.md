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

<!-- Story 1.3 will add per-check "why" prose with inline check ID references -->

```yaml
quality_property: discoverable
composition_pattern: independent
checks:
  - id: DISC-I-01
    rule: "Each agent appears in agent-manifest.csv"
    target_file: "_bmad/_config/agent-manifest.csv"
    validation: "row exists with module=bme, path=_bmad/bme/{submodule}/agents/{agent_id}.md for each agent in config.yaml agents list"
  - id: DISC-I-02
    rule: "Module has a README describing team purpose and agent capabilities"
    target_file: "_bmad/bme/{submodule}/README.md"
    validation: "file exists and is non-empty"
  - id: DISC-I-03
    rule: "Each agent has activation XML with menu items exposing workflows"
    target_file: "_bmad/bme/{submodule}/agents/{agent_id}.md"
    validation: "file contains <menu> element with at least one <item> element"
  - id: DISC-I-04
    rule: "Each agent has a canonical skill ID registered for intent-based routing"
    target_file: ".claude/skills/bmad-agent-bme-{agent_id}/SKILL.md"
    validation: "skill directory and SKILL.md file exist for each agent"
  - id: DISC-I-05
    rule: "Module has an entry in module-help.csv for CLI discovery"
    target_file: "_bmad/_config/module-help.csv"
    validation: "row exists with module name matching submodule_name from config.yaml — NOTE: existing bme submodules (Vortex, Gyre) lack this file; new teams SHOULD create an entry to enable convoke-help discovery"
```

---

## Discoverable — Sequential

<!-- Story 1.3 will add per-check "why" prose with inline check ID references -->

```yaml
quality_property: discoverable
composition_pattern: sequential
checks:
  - id: DISC-S-01
    rule: "Each agent appears in agent-manifest.csv"
    target_file: "_bmad/_config/agent-manifest.csv"
    validation: "row exists with module=bme, path=_bmad/bme/{submodule}/agents/{agent_id}.md for each agent in config.yaml agents list"
  - id: DISC-S-02
    rule: "Module has a README describing team purpose and agent capabilities"
    target_file: "_bmad/bme/{submodule}/README.md"
    validation: "file exists and is non-empty"
  - id: DISC-S-03
    rule: "Each agent has activation XML with menu items exposing workflows"
    target_file: "_bmad/bme/{submodule}/agents/{agent_id}.md"
    validation: "file contains <menu> element with at least one <item> element"
  - id: DISC-S-04
    rule: "Each agent has a canonical skill ID registered for intent-based routing"
    target_file: ".claude/skills/bmad-agent-bme-{agent_id}/SKILL.md"
    validation: "skill directory and SKILL.md file exist for each agent"
  - id: DISC-S-05
    rule: "Module has an entry in module-help.csv for CLI discovery"
    target_file: "_bmad/_config/module-help.csv"
    validation: "row exists with module name matching submodule_name from config.yaml — NOTE: existing bme submodules (Vortex, Gyre) lack this file; new teams SHOULD create an entry to enable convoke-help discovery"
  - id: DISC-S-06
    rule: "Compass routing reference documents all workflows and inter-module routes"
    target_file: "_bmad/bme/{submodule}/compass-routing-reference.md"
    validation: "file exists and contains a routing table with one row per workflow in config.yaml workflows list"
  - id: DISC-S-07
    rule: "Each agent menu references all workflows assigned to that agent"
    target_file: "_bmad/bme/{submodule}/agents/{agent_id}.md"
    validation: "for each workflow where agent={agent_id} in agent-registry, a corresponding <item> with exec path exists in the agent's <menu>"
```

---

## Installable — Independent

<!-- Story 1.3 will add per-check "why" prose with inline check ID references -->

```yaml
quality_property: installable
composition_pattern: independent
checks:
  - id: INST-I-01
    rule: "Module block exists in agent-registry.js with AGENTS and WORKFLOWS arrays"
    target_file: "scripts/update/lib/agent-registry.js"
    validation: "const block exists with {PREFIX}_AGENTS array (each entry has id, name, icon, title, stream, persona) and {PREFIX}_WORKFLOWS array (each entry has name, agent), plus derived lists ({PREFIX}_AGENT_FILES, {PREFIX}_AGENT_IDS, {PREFIX}_WORKFLOW_NAMES) and module.exports entries"
  - id: INST-I-02
    rule: "refresh-installation.js copies module agents, workflows, and config"
    target_file: "scripts/update/lib/refresh-installation.js"
    validation: "code block exists that copies from {packageRoot}/_bmad/bme/{submodule}/ to {projectRoot}/_bmad/bme/{submodule}/ for agents/, workflows/, and config.yaml"
  - id: INST-I-03
    rule: "config.yaml exists and parses as valid YAML"
    target_file: "_bmad/bme/{submodule}/config.yaml"
    validation: "file exists and yaml.load() succeeds without error"
  - id: INST-I-04
    rule: "validator.js includes validation checks for the module"
    target_file: "scripts/update/lib/validator.js"
    validation: "validation function checks agent files exist, workflow.md files exist, and config.yaml is valid for this module"
  - id: INST-I-05
    rule: "Each agent file exists in the agents directory"
    target_file: "_bmad/bme/{submodule}/agents/{agent_id}.md"
    validation: "for each agent ID in config.yaml agents list, file {agent_id}.md exists in agents/"
  - id: INST-I-06
    rule: "Each workflow has a workflow.md entry point"
    target_file: "_bmad/bme/{submodule}/workflows/{workflow_name}/workflow.md"
    validation: "for each workflow in config.yaml workflows list, directory {workflow_name}/ exists with workflow.md inside"
```

---

## Installable — Sequential

<!-- Story 1.3 will add per-check "why" prose with inline check ID references -->

```yaml
quality_property: installable
composition_pattern: sequential
checks:
  - id: INST-S-01
    rule: "Module block exists in agent-registry.js with AGENTS and WORKFLOWS arrays"
    target_file: "scripts/update/lib/agent-registry.js"
    validation: "const block exists with {PREFIX}_AGENTS array (each entry has id, name, icon, title, stream, persona) and {PREFIX}_WORKFLOWS array (each entry has name, agent), plus derived lists ({PREFIX}_AGENT_FILES, {PREFIX}_AGENT_IDS, {PREFIX}_WORKFLOW_NAMES) and module.exports entries"
  - id: INST-S-02
    rule: "refresh-installation.js copies module agents, workflows, contracts, and config"
    target_file: "scripts/update/lib/refresh-installation.js"
    validation: "code block exists that copies from {packageRoot}/_bmad/bme/{submodule}/ to {projectRoot}/_bmad/bme/{submodule}/ for agents/, workflows/, contracts/, and config.yaml"
  - id: INST-S-03
    rule: "config.yaml exists and parses as valid YAML"
    target_file: "_bmad/bme/{submodule}/config.yaml"
    validation: "file exists and yaml.load() succeeds without error"
  - id: INST-S-04
    rule: "validator.js includes validation checks for the module"
    target_file: "scripts/update/lib/validator.js"
    validation: "validation function checks agent files exist, workflow.md files exist, config.yaml is valid, and contract files exist for this module"
  - id: INST-S-05
    rule: "Each agent file exists in the agents directory"
    target_file: "_bmad/bme/{submodule}/agents/{agent_id}.md"
    validation: "for each agent ID in config.yaml agents list, file {agent_id}.md exists in agents/"
  - id: INST-S-06
    rule: "Each workflow has a workflow.md entry point"
    target_file: "_bmad/bme/{submodule}/workflows/{workflow_name}/workflow.md"
    validation: "for each workflow in config.yaml workflows list, directory {workflow_name}/ exists with workflow.md inside"
  - id: INST-S-07
    rule: "Contracts directory exists and contains handoff contract files"
    target_file: "_bmad/bme/{submodule}/contracts/"
    validation: "contracts/ directory exists with at least one .md file matching pattern {prefix}{N}-{kebab-case-title}.md"
  - id: INST-S-08
    rule: "refresh-installation.js copies contracts directory"
    target_file: "scripts/update/lib/refresh-installation.js"
    validation: "code copies contracts/ from package source to project target for this module"
```

---

## Configurable — Independent

<!-- Story 1.3 will add per-check "why" prose with inline check ID references -->

```yaml
quality_property: configurable
composition_pattern: independent
checks:
  - id: CONF-I-01
    rule: "config.yaml contains all required fields"
    target_file: "_bmad/bme/{submodule}/config.yaml"
    validation: "file contains: submodule_name (string, underscore-prefixed), module (string), agents (array of kebab-case IDs), workflows (array of kebab-case names), version (semver), user_name (string), communication_language (string), output_folder (string with {project-root} prefix)"
  - id: CONF-I-02
    rule: "Each agent activation XML loads module config.yaml in step 2"
    target_file: "_bmad/bme/{submodule}/agents/{agent_id}.md"
    validation: "activation <step n=\"2\"> contains instruction to load {project-root}/_bmad/bme/{submodule}/config.yaml and store session variables"
  - id: CONF-I-03
    rule: "Agent file names follow kebab-case naming convention matching registry ID"
    target_file: "_bmad/bme/{submodule}/agents/"
    validation: "each file in agents/ is named {agent_id}.md where agent_id matches the id field in agent-registry.js and the agents list in config.yaml"
  - id: CONF-I-04
    rule: "Module directory follows underscore-prefix naming convention"
    target_file: "_bmad/bme/{submodule}/"
    validation: "submodule directory name starts with underscore (e.g., _vortex, _gyre) and matches submodule_name in config.yaml"
  - id: CONF-I-05
    rule: "Workflow directories follow kebab-case naming convention"
    target_file: "_bmad/bme/{submodule}/workflows/"
    validation: "each workflow directory name is kebab-case and matches an entry in config.yaml workflows list"
  - id: CONF-I-06
    rule: "Config field names follow snake_case convention"
    target_file: "_bmad/bme/{submodule}/config.yaml"
    validation: "all top-level field names use snake_case (e.g., submodule_name, output_folder, user_name, communication_language, party_mode_enabled)"
```

---

## Configurable — Sequential

<!-- Story 1.3 will add per-check "why" prose with inline check ID references -->

```yaml
quality_property: configurable
composition_pattern: sequential
checks:
  - id: CONF-S-01
    rule: "config.yaml contains all required fields"
    target_file: "_bmad/bme/{submodule}/config.yaml"
    validation: "file contains: submodule_name (string, underscore-prefixed), module (string), agents (array of kebab-case IDs), workflows (array of kebab-case names), version (semver), user_name (string), communication_language (string), output_folder (string with {project-root} prefix)"
  - id: CONF-S-02
    rule: "Each agent activation XML loads module config.yaml in step 2"
    target_file: "_bmad/bme/{submodule}/agents/{agent_id}.md"
    validation: "activation <step n=\"2\"> contains instruction to load {project-root}/_bmad/bme/{submodule}/config.yaml and store session variables"
  - id: CONF-S-03
    rule: "Agent file names follow kebab-case naming convention matching registry ID"
    target_file: "_bmad/bme/{submodule}/agents/"
    validation: "each file in agents/ is named {agent_id}.md where agent_id matches the id field in agent-registry.js and the agents list in config.yaml"
  - id: CONF-S-04
    rule: "Module directory follows underscore-prefix naming convention"
    target_file: "_bmad/bme/{submodule}/"
    validation: "submodule directory name starts with underscore (e.g., _vortex, _gyre) and matches submodule_name in config.yaml"
  - id: CONF-S-05
    rule: "Workflow directories follow kebab-case naming convention"
    target_file: "_bmad/bme/{submodule}/workflows/"
    validation: "each workflow directory name is kebab-case and matches an entry in config.yaml workflows list"
  - id: CONF-S-06
    rule: "Config field names follow snake_case convention"
    target_file: "_bmad/bme/{submodule}/config.yaml"
    validation: "all top-level field names use snake_case (e.g., submodule_name, output_folder, user_name, communication_language, party_mode_enabled)"
  - id: CONF-S-07
    rule: "Contract frontmatter references agent names consistent with agent-registry"
    target_file: "_bmad/bme/{submodule}/contracts/{contract_file}.md"
    validation: "source_agent and target_agents fields in contract frontmatter reference agent name values (first-name short names, e.g., isla, mila) from the module's agent-registry.js AGENTS array"
  - id: CONF-S-08
    rule: "Contract file names follow {prefix}{N}-{kebab-case-title}.md convention"
    target_file: "_bmad/bme/{submodule}/contracts/"
    validation: "each contract file matches pattern {prefix}{N}-{kebab-case-title}.md where prefix is a short lowercase string and N is a sequential number"
```

---

## Composable — Independent

<!-- Story 1.3 will add per-check "why" prose with inline check ID references -->

```yaml
quality_property: composable
composition_pattern: independent
checks:
  - id: COMP-I-01
    rule: "Each agent has an entry in agent-manifest.csv for cross-module visibility"
    target_file: "_bmad/_config/agent-manifest.csv"
    validation: "for each agent, a row exists with correct name, title, role, module=bme, path, and canonicalId=bmad-agent-bme-{agent_id}"
  - id: COMP-I-02
    rule: "No handoff contracts exist — Independent agents do not require inter-agent contracts"
    target_file: "_bmad/bme/{submodule}/"
    validation: "no contracts/ directory exists, or if it exists it contains no handoff contract files"
  - id: COMP-I-03
    rule: "Each agent has a canonical skill ID following the inter-module routing pattern"
    target_file: ".claude/skills/bmad-agent-bme-{agent_id}/SKILL.md"
    validation: "skill registration exists with canonical ID bmad-agent-bme-{agent_id} enabling other modules to route to this agent"
  - id: COMP-I-04
    rule: "README documents agent capabilities for cross-team awareness"
    target_file: "_bmad/bme/{submodule}/README.md"
    validation: "README contains a description of each agent's capabilities sufficient for other teams to determine routing relevance"
```

---

## Composable — Sequential

<!-- Story 1.3 will add per-check "why" prose with inline check ID references -->

```yaml
quality_property: composable
composition_pattern: sequential
checks:
  - id: COMP-S-01
    rule: "Each agent has an entry in agent-manifest.csv for cross-module visibility"
    target_file: "_bmad/_config/agent-manifest.csv"
    validation: "for each agent, a row exists with correct name, title, role, module=bme, path, and canonicalId=bmad-agent-bme-{agent_id}"
  - id: COMP-S-02
    rule: "Handoff contracts exist defining inter-agent artifact schemas"
    target_file: "_bmad/bme/{submodule}/contracts/"
    validation: "contracts/ directory contains at least one handoff contract .md file"
  - id: COMP-S-03
    rule: "Each contract has required frontmatter fields"
    target_file: "_bmad/bme/{submodule}/contracts/{contract_file}.md"
    validation: "frontmatter contains: contract (ID string), type, source_agent (agent short name from registry), source_workflow (valid workflow name), target_agents (array of agent short names from registry), created (ISO date)"
  - id: COMP-S-04
    rule: "Compass routing reference includes inter-module routing"
    target_file: "_bmad/bme/{submodule}/compass-routing-reference.md"
    validation: "routing table includes at least one row referencing an agent from another module (e.g., Vortex agents from Gyre compass)"
  - id: COMP-S-05
    rule: "Each agent has a canonical skill ID following the inter-module routing pattern"
    target_file: ".claude/skills/bmad-agent-bme-{agent_id}/SKILL.md"
    validation: "skill registration exists with canonical ID bmad-agent-bme-{agent_id} enabling other modules to route to this agent"
  - id: COMP-S-06
    rule: "Contract chain covers the full agent pipeline"
    target_file: "_bmad/bme/{submodule}/contracts/"
    validation: "for each adjacent pair of agents in the pipeline, a contract exists where source_agent is the upstream agent and target_agents includes the downstream agent"
```
