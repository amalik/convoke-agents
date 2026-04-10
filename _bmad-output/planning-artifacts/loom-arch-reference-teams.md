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
- Prose references check IDs inline (e.g., "**DISC-I-01** — agent-manifest.csv is the canonical...") for traceability
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

## Extension Deployment Mechanism

This section documents how a new team module moves from package source to a working project installation. This is the deployment pipeline — the "how" of getting files in place. The checklist sections below define the "what" (specific validation rules) for each quality property.

### Deployment Flow

When a contributor runs `convoke-install` or `convoke-update`, the following pipeline executes:

1. **Registry lookup** — `agent-registry.js` is the central source of truth. Each module has a const block declaring its AGENTS array (agent definitions with id, name, icon, persona), WORKFLOWS array (workflow-to-agent mappings), and derived lists (file paths, IDs, workflow names). The CLI tooling reads these arrays to know which files to copy and validate.

2. **File copying** — `refresh-installation.js` copies the module's directory tree from the npm package (`{packageRoot}/_bmad/bme/{submodule}/`) to the project (`{projectRoot}/_bmad/bme/{submodule}/`). This includes `agents/`, `workflows/`, `config.yaml`, and for Sequential teams, `contracts/` and `guides/`. The copy uses the registry's agent and workflow arrays to iterate files.

3. **Configuration seeding** — `config.yaml` is the per-module configuration file. On first install, the config-merger seeds it with defaults (submodule_name, module, agents, workflows, version, user_name, communication_language, output_folder). On subsequent updates, user overrides are preserved while new defaults are merged in.

4. **Manifest generation** — During refresh, `buildAgentRow610()` generates rows in `agent-manifest.csv` for each agent, populating the v6.1.0 schema columns (name, displayName, title, icon, capabilities, role, identity, communicationStyle, principles, module, path, canonicalId). This manifest powers cross-module discovery and overlap detection.

5. **Post-install validation** — `validator.js` runs structural integrity checks: config.yaml parses correctly, every agent file declared in config exists, every workflow has a workflow.md entry point, and manifest entries are present. Validation failures are surfaced to the user immediately.

6. **Discovery registration** — `module-help.csv` maps modules to their capabilities for CLI discovery. Note: existing bme submodules (Vortex, Gyre) do not yet have entries in this file; new teams should create them to complete the discovery surface.

For specific validation rules applied at each stage, see the checklist sections below organized by quality property and composition pattern.

---

## Discoverable — Independent

A team's agents must be findable through every standard framework surface. **DISC-I-01** — the agent-manifest.csv is the canonical registry that the BMad Master, overlap detection, and cross-module routing all consult; an agent missing from this manifest is invisible to the broader ecosystem. **DISC-I-02** — a README provides human-readable orientation for contributors browsing the module directory, explaining what the team does and when each agent is useful. Without it, a contributor must read individual agent files to understand the team's purpose.

Beyond passive discovery, agents must be actively reachable through interactive and programmatic surfaces. **DISC-I-03** — activation XML menus are the primary interactive surface; they expose workflows as menu items so contributors can invoke capabilities without knowing file paths. **DISC-I-04** — canonical skill IDs enable intent-based routing, allowing the BMad Master and other modules to dispatch requests to agents by capability rather than by file location. **DISC-I-05** — module-help.csv powers CLI module discovery; without an entry, contributors browsing available modules will not see the team listed (note: existing bme submodules lack this file, but new teams should create an entry).

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
    validation: "row exists with module name matching submodule_name from config.yaml — NOTE: existing bme submodules (Vortex, Gyre) lack this file; new teams SHOULD create an entry to enable CLI module discovery"
```

---

## Discoverable — Sequential

A Sequential team's agents must be findable through every standard framework surface, just as with Independent teams. **DISC-S-01** — the agent-manifest.csv is the canonical registry consulted by the BMad Master, overlap detection, and cross-module routing; agents missing from this manifest are invisible to the ecosystem. **DISC-S-02** — a README orients contributors to the team's purpose and pipeline structure without requiring them to read individual agent files. **DISC-S-03** — activation XML menus expose workflows as interactive menu items, letting contributors invoke pipeline stages without knowing file paths. **DISC-S-04** — canonical skill IDs enable intent-based routing so the BMad Master and other modules can dispatch requests by capability. **DISC-S-05** — module-help.csv powers CLI module discovery; without an entry, the team will not appear when contributors browse available modules (note: existing bme submodules lack this file, but new teams should create an entry).

Sequential teams have additional discovery requirements driven by their multi-agent pipeline structure. **DISC-S-06** — the compass routing reference is the central navigation map for a Sequential team; it documents every workflow and cross-module route so that contributors (and the factory) can trace the full pipeline and know where each workflow leads next. Without it, a contributor finishing one stage has no guidance on what comes after. **DISC-S-07** — each agent's menu must reference all workflows assigned to that agent in the registry; a missing menu item means a workflow exists but is unreachable through the agent's interactive interface, creating a silent discovery gap.

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
    validation: "row exists with module name matching submodule_name from config.yaml — NOTE: existing bme submodules (Vortex, Gyre) lack this file; new teams SHOULD create an entry to enable CLI module discovery"
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

The installation infrastructure relies on three coordinated files that must each know about the module. **INST-I-01** — the agent-registry.js is the central source of truth for CLI tooling; its AGENTS and WORKFLOWS arrays drive file copying, manifest generation, and validation. A module missing from the registry simply does not exist to the installation pipeline. **INST-I-02** — refresh-installation.js uses the registry arrays to copy module files from the npm package to the project; without a copy block for this module, `convoke-update` will skip it and users will have stale or missing files. **INST-I-04** — validator.js provides post-install structural integrity checks; without validation logic for the module, broken installations go undetected until runtime failures occur.

The module must also provide the files that the infrastructure expects to find. **INST-I-03** — config.yaml must exist and parse as valid YAML because the refresh and validation pipelines both read it; a missing or malformed config will cause installation to fail silently or produce incorrect manifest entries. **INST-I-05** — each agent file declared in config.yaml must actually exist in the agents/ directory; the registry derives file paths from agent IDs, and a missing file means the agent is registered but unresolvable. **INST-I-06** — each workflow must have a workflow.md entry point because this is the file the activation XML's menu items reference; a missing entry point means the workflow appears in menus but fails when invoked.

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

A Sequential team requires the same installation infrastructure as an Independent team, plus contract-specific handling. **INST-S-01** — the agent-registry.js is the central source of truth for CLI tooling; its AGENTS and WORKFLOWS arrays drive file copying, manifest generation, and validation. A module missing from the registry does not exist to the installation pipeline. **INST-S-02** — refresh-installation.js copies module files from the npm package to the project; for Sequential teams this must include the contracts/ directory alongside agents/, workflows/, and config.yaml. **INST-S-03** — config.yaml must exist and parse as valid YAML because the refresh and validation pipelines both read it. **INST-S-04** — validator.js provides post-install structural integrity checks; for Sequential teams this should include contract file existence validation alongside agent and workflow checks.

The module must provide all files the infrastructure expects. **INST-S-05** — each agent file declared in config.yaml must exist in agents/; the registry derives file paths from agent IDs and a missing file means the agent is registered but unresolvable. **INST-S-06** — each workflow must have a workflow.md entry point because activation XML menu items reference this file; a missing entry point makes the workflow unreachable. Sequential teams additionally require: **INST-S-07** — a contracts/ directory with handoff contract files, because contracts define the formal interfaces between pipeline stages and are consumed by both agents and the factory at runtime. **INST-S-08** — refresh-installation.js must copy the contracts/ directory so that project installations receive the same contract definitions as the package source; without this, installed teams lack their inter-agent interface definitions.

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

Configuration is what makes a team portable across projects and users. **CONF-I-01** — config.yaml must contain all required fields (submodule_name, module, agents, workflows, version, user_name, communication_language, output_folder) because these fields drive every other configurable behavior: the installation pipeline reads agent and workflow lists, the activation XML reads user-specific values, and the output folder determines where artifacts land. Missing fields cause silent failures downstream. **CONF-I-02** — each agent's activation XML must load config.yaml in step 2 of its activation sequence so that session variables (user name, output paths, language) are available before the agent begins work; an agent that skips this step operates with hardcoded or missing values, breaking portability.

Naming conventions are the glue that connects configuration to the file system. **CONF-I-03** — agent file names must follow kebab-case and match the registry ID because the installation pipeline derives file paths from IDs; a mismatch means the registry points to a non-existent file. **CONF-I-04** — the module directory must use the underscore-prefix convention (e.g., `_vortex`) and match config.yaml's submodule_name so that path templates resolve correctly across all infrastructure files. **CONF-I-05** — workflow directory names must be kebab-case and match config.yaml's workflows list for the same reason: the registry and activation XML construct paths from these names. **CONF-I-06** — config field names must use snake_case to maintain consistency with the config-merger and avoid case-sensitivity bugs when merging user overrides with package defaults.

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

Configuration makes a Sequential team portable across projects and users, just as with Independent teams. **CONF-S-01** — config.yaml must contain all required fields (submodule_name, module, agents, workflows, version, user_name, communication_language, output_folder) because these drive installation, activation, and artifact generation. **CONF-S-02** — each agent's activation XML must load config.yaml in step 2 so that session variables are available before work begins; without this, agents operate with hardcoded or missing values. **CONF-S-03** — agent file names must follow kebab-case and match the registry ID so that path templates resolve correctly. **CONF-S-04** — the module directory must use the underscore-prefix convention and match config.yaml's submodule_name. **CONF-S-05** — workflow directory names must be kebab-case and match config.yaml's workflows list. **CONF-S-06** — config field names must use snake_case for consistency with the config-merger and to avoid case-sensitivity bugs.

Sequential teams have additional configuration constraints for their contracts. **CONF-S-07** — contract frontmatter must reference agent names that are consistent with the module's agent-registry AGENTS array (using first-name short names like `isla`, `mila`); inconsistent names mean the factory cannot trace which agents are connected by which contracts, breaking pipeline validation. **CONF-S-08** — contract file names must follow the `{prefix}{N}-{kebab-case-title}.md` convention (e.g., `hc1-empathy-artifacts.md`) because the installation pipeline and factory use this pattern to discover and order contract files; non-conforming names are invisible to automated processing.

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

Composability for Independent teams means agents are individually addressable and their capabilities are visible to other modules, even without inter-agent contracts. **COMP-I-01** — each agent must appear in agent-manifest.csv with complete metadata (name, title, role, canonicalId) because this is the surface the factory uses for overlap detection; without manifest entries, a new team could unknowingly duplicate capabilities that already exist elsewhere. **COMP-I-02** — Independent teams must explicitly have no handoff contracts; this is a pattern assertion, not an oversight. Contracts imply sequential data flow, and their presence in an Independent module signals a misclassification that would confuse both contributors and the factory's composition pattern logic.

Cross-module reachability requires two additional surfaces. **COMP-I-03** — each agent must have a canonical skill ID following the `bmad-agent-bme-{agent_id}` pattern because this is the inter-module routing mechanism; other teams' compass routing tables reference these skill IDs to dispatch work across module boundaries. **COMP-I-04** — the README must document each agent's capabilities in enough detail for other teams to determine routing relevance; without this, cross-team collaboration requires reading agent source files, which is fragile and discourages integration.

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

Composability for Sequential teams means agents are individually addressable, the pipeline interfaces are formally defined, and cross-module routing is possible. **COMP-S-01** — each agent must appear in agent-manifest.csv with complete metadata because the factory uses this for overlap detection; without entries, a new team could duplicate capabilities that exist in another module. **COMP-S-02** — handoff contracts must exist because they are the formal interface definitions between pipeline stages; without them, the data flowing between agents is implicit and unvalidatable, making the pipeline fragile to changes. **COMP-S-03** — each contract must have required frontmatter fields (contract ID, type, source_agent, source_workflow, target_agents, created) because the factory and validator parse these fields to trace the pipeline topology; missing fields break automated pipeline analysis. Note: contract files that serve as schema definitions may use format placeholders (e.g., `YYYY-MM-DD`) for the `created` field — the check validates field presence and structure, not that instantiated dates exist in templates.

Cross-module integration requires routing and coverage guarantees. **COMP-S-04** — the compass routing reference must include at least one inter-module route because Sequential teams do not operate in isolation; Gyre findings route to Vortex agents, and Vortex insights route to Gyre — without inter-module entries, cross-team navigation is broken. **COMP-S-05** — each agent must have a canonical skill ID following the `bmad-agent-bme-{agent_id}` pattern so that other modules' compass tables can reference them for inter-module dispatch. **COMP-S-06** — the contract chain must cover the full agent pipeline, meaning every adjacent pair of agents has a contract defining their interface; a gap in the chain means there is a pipeline transition with no formal specification, creating an undocumented handoff that will break when either agent evolves independently.

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
