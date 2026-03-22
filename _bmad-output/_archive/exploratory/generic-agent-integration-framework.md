---
title: "BMAD Agent Architecture Framework: Building Domain-Specialized Agents"
date: 2026-02-08
version: 1.1.0
status: FRAMEWORK SPECIFICATION
purpose: Define standard pattern for creating domain-specialized agents within BMAD Method
related_docs:
  - phase-0-implementation-guide.md (v1.2.0)
  - distribution-strategy.md (v2.0.0)
reference_implementation: Emma (empathy-mapper) - see _bmad/bme/_designos/agents/empathy-mapper.md
---

# BMAD Agent Architecture Framework

**Purpose:** This framework defines a **standard pattern** for creating domain-specialized agents within BMAD Method.

**Key Principle:** BMAD Method provides the **execution environment** and **agent infrastructure**. Domain specialists provide the **agent expertise** and **workflow logic**. This framework defines the standard interface.

---

## Overview: BMAD Agent Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                 Domain-Specialized Agent                    │
│  (Empathy Mapping, Wireframing, Quality Gates, etc.)       │
│                                                             │
│  - Agent expertise/persona                                  │
│  - Workflow logic                                           │
│  - Domain knowledge                                         │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   │ BMAD AGENT ARCHITECTURE FRAMEWORK
                   │ (This Document)
                   │
                   ↓
┌─────────────────────────────────────────────────────────────┐
│                    BMAD Method                              │
│                                                             │
│  - Agent execution environment                              │
│  - Workflow orchestration                                   │
│  - Party mode integration                                   │
│  - Agent registry (agent-manifest.csv)                      │
└─────────────────────────────────────────────────────────────┘
```

**What This Framework Provides:**

1. **Standard BMAD Agent Interface** - Required fields and structure for all agents
2. **Workflow Architecture Patterns** - Different workflow styles for different use cases
3. **npm Package Templates** - Reusable structure for agent distribution
4. **Creation Checklist** - Step-by-step process for building new agents

---

## Part 1: Standard BMAD Agent Interface

**Principle:** Every BMAD agent must implement this standard interface for consistent execution and orchestration.

### Required Agent Structure

**File:** `{module}/{submodule}/agents/{agent-name}.md`

**Example:** `_bmad/bme/_designos/agents/empathy-mapper.md`

### Agent Frontmatter (Required Fields)

```yaml
---
name: {agent-name}           # Lowercase, hyphenated (e.g., empathy-mapper)
displayName: {short-name}    # Human-friendly name (e.g., Emma)
title: {full-title}          # Professional title (e.g., Empathy Mapping Specialist)
icon: {emoji}                # Single emoji (e.g., 🎨)
role: {role-description}     # High-level role (e.g., User Empathy Expert + Design Thinking Specialist)
identity: {identity-text}    # 1-2 sentences describing agent's expertise and purpose
communicationStyle: {style}  # How the agent communicates (e.g., Empathetic, curious, asks probing questions)
principles: {principles}     # Core beliefs and guidelines the agent follows
module: {module-name}        # Module this agent belongs to (e.g., bme)
---
```

**Example (Emma):**
```yaml
---
name: empathy-mapper
displayName: Emma
title: Empathy Mapping Specialist
icon: 🎨
role: User Empathy Expert + Design Thinking Specialist
identity: Design thinking expert specializing in empathy maps and user research. Helps teams understand user needs, emotions, and pain points through structured empathy mapping.
communicationStyle: Empathetic, curious, asks probing questions. Focuses on emotional understanding and user perspective.
principles: Design is about THEM not us. Every empathy map must be grounded in real user insights. Challenge assumptions - validate through research. Emotions drive behavior - understand the WHY.
module: bme
---
```

### Agent Menu (Required Structure)

**Format:** XML-based menu with standard items

**Required Menu Items:**
- `MH` - Redisplay Menu (always first)
- `CH` - Chat with Agent (always second)
- `PM` - Start Party Mode (always second-to-last)
- `DA` - Dismiss Agent (always last)

**Custom Menu Items:** Insert between `CH` and `PM` (workflow invocations, tools, etc.)

**Template:**
```xml
<menu>
  <item cmd="MH">[MH] Redisplay Menu</item>
  <item cmd="CH">[CH] Chat with {DisplayName}</item>

  <!-- CUSTOM ITEMS START -->
  <item cmd="XX" exec="{project-root}/{module-path}/workflows/{workflow-name}/workflow.md">[XX] {Workflow Description}</item>
  <item cmd="YY" workflow="{project-root}/{module-path}/workflows/{workflow-name}/workflow.yaml">[YY] {Workflow Description}</item>
  <!-- CUSTOM ITEMS END -->

  <item cmd="PM" exec="{project-root}/_bmad/core/workflows/party-mode/workflow.md">[PM] Start Party Mode</item>
  <item cmd="DA">[DA] Dismiss Agent</item>
</menu>
```

**Example (Emma):**
```xml
<menu>
  <item cmd="MH">[MH] Redisplay Menu</item>
  <item cmd="CH">[CH] Chat with Emma</item>
  <item cmd="EM" exec="{project-root}/_bmad/bme/_designos/workflows/empathy-map/workflow.md">[EM] Create Empathy Map</item>
  <item cmd="VM" exec="{project-root}/_bmad/bme/_designos/workflows/empathy-map/validate.md">[VM] Validate Existing Empathy Map</item>
  <item cmd="PM" exec="{project-root}/_bmad/core/workflows/party-mode/workflow.md">[PM] Start Party Mode</item>
  <item cmd="DA">[DA] Dismiss Agent</item>
</menu>
```

### Workflow Invocation Patterns

**Pattern 1: Step-file Workflow (exec handler)**
```xml
<item cmd="EM" exec="{project-root}/_bmad/bme/_designos/workflows/empathy-map/workflow.md">[EM] Create Empathy Map</item>
```

**Pattern 2: YAML Workflow (workflow handler)**
```xml
<item cmd="CW" workflow="{project-root}/_bmad/bme/_designos/workflows/wireframe/workflow.yaml">[CW] Create Wireframe</item>
```

**Pattern 3: Custom Handler (exec + custom logic)**
```xml
<item cmd="DS" exec="{project-root}/_bmad/bme/_agentos/workflows/audit-standards/discover-standards.md">[DS] Discover Standards from Codebase</item>
```

---

## Part 2: Workflow Architecture Patterns

**Principle:** Different workflows benefit from different architectural styles. This section shows the available patterns.

### Pattern 1: Step-File Architecture

**Use Case:** Sequential workflows with distinct phases (like empathy mapping, design thinking processes)

**BMAD Structure:**
```
{module}/{submodule}/workflows/{workflow-name}/
├── workflow.md                  # Main orchestrator
├── {output-template}.md         # Output template
└── steps/
    ├── step-01-{name}.md        # First step
    ├── step-02-{name}.md        # Second step
    ├── step-03-{name}.md        # Third step
    └── ...
```

**Orchestrator Pattern (workflow.md):**
```markdown
---
workflow: {workflow-name}
type: step-file
---

# {Workflow Title}

{Description of workflow}

Step-file architecture:
- Just-in-time loading
- Sequential enforcement
- State tracking in frontmatter

## INITIALIZATION

Load config from {project-root}/{module-path}/config.yaml
Load step: {project-root}/{module-path}/workflows/{workflow-name}/steps/step-01-{name}.md
```

**Step File Pattern:**
```markdown
---
step: {step-number}
workflow: {workflow-name}
---

# Step {step-number}: {Step Title}

{Step instructions and guidance}

## {Section Header}
{Section content}

## Next Step

When user confirms {completion condition}, load:
{project-root}/{module-path}/workflows/{workflow-name}/steps/step-{next-number}-{name}.md
```

**Example:** See [_bmad/bme/_designos/workflows/empathy-map/](_bmad/bme/_designos/workflows/empathy-map/)

### Pattern 2: YAML + Instructions Architecture

**Use Case:** Configuration-driven workflows with monolithic logic (like standards auditing, compliance checking)

**BMAD Structure:**
```
{module}/{submodule}/workflows/{workflow-name}/
├── workflow.yaml           # Configuration
├── instructions.md         # Complete workflow logic
├── template.md            # Output template
└── {supporting-files}/    # Optional: standards, criteria, etc.
```

**Configuration Pattern (workflow.yaml):**
```yaml
name: {workflow-name}
description: {workflow-description}
author: {author}

config_source: "{project-root}/{module-path}/config.yaml"
output_folder: "{config_source}:output_folder"
user_name: "{config_source}:user_name"
communication_language: "{config_source}:communication_language"
date: system-generated

installed_path: "{project-root}/{module-path}/workflows/{workflow-name}"
template: "{installed_path}/template.md"
instructions: "{installed_path}/instructions.md"

default_output_file: "{output_folder}/{workflow-name}-{{date}}.md"
standalone: true
```

**Instructions Pattern (instructions.md):**
```markdown
---
workflow: {workflow-name}
type: yaml-instructions
---

# {Workflow Title}

{Workflow description}

## Workflow Structure

<workflow>
  <step n="1" goal="{step-goal}">
    {Step instructions}
    <template-output>{template-section}</template-output>
  </step>

  <step n="2" goal="{step-goal}">
    {Step instructions}
    <template-output>{template-section}</template-output>
  </step>

  <!-- More steps -->
</workflow>
```

**Example:** See [_bmad/bme/_designos/workflows/wireframe/](_bmad/bme/_designos/workflows/wireframe/)

### Pattern 3: Hybrid Architecture

**Use Case:** Complex workflows requiring both configuration and sequential steps (like evidence-based reasoning, multi-phase analysis)

**Design Strategy:**

1. **Identify Core Workflow Primitives:**
   - Sequential phases → Use step-file pattern
   - Configuration-driven logic → Use YAML+instructions pattern
   - Combined needs → Create hybrid pattern

2. **Design Hybrid Workflow:**
   - Process "phases" → BMAD steps
   - Output "artifacts" → BMAD template sections
   - Interactive "tools" → BMAD menu items

3. **Implement Hybrid Pattern:**
   - Combine step-file + YAML patterns
   - Add custom handlers in instructions
   - Extend template with domain-specific sections

**Example: Evidence-Based Reasoning Workflow**
```
{module}/{submodule}/workflows/evidence-reasoning/
├── workflow.yaml           # Configuration
├── instructions.md         # Reasoning logic
├── template.md            # Evidence report template
└── evidence/
    ├── step-01-hypothesis.md     # Hypothesis generation
    ├── step-02-gather-evidence.md # Evidence collection
    ├── step-03-validate.md        # Validation
    └── step-04-decide.md          # Decision
```

**Hybrid Pattern:** YAML config + step-files for evidence collection + instructions for reasoning logic

---

## Part 3: npm Package Template (Reusable for All Agents)

**Principle:** All BMAD agents use the same npm package structure for distribution.

### Package Structure Template

```
@bmad/{module}-{agent-name}/
├── package.json            # npm package metadata
├── README.md              # Agent documentation
├── install.js             # Post-install script
├── uninstall.js           # Post-uninstall script (optional)
└── agent/
    ├── {agent-name}.md    # Agent file
    └── workflows/
        └── {workflow-name}/
            └── [workflow files]
```

### package.json Template

```json
{
  "name": "@bmad/{module}-{agent-name}",
  "version": "1.0.0",
  "description": "{DisplayName} - {Title} for BMAD Method",
  "keywords": ["bmad", "agent", "{domain}"],
  "author": "{author}",
  "license": "MIT",
  "peerDependencies": {
    "@bmad/{module}-core": "^1.0.0"
  },
  "scripts": {
    "postinstall": "node install.js",
    "preuninstall": "node uninstall.js"
  },
  "files": [
    "agent/",
    "install.js",
    "uninstall.js",
    "README.md"
  ]
}
```

**Example (Emma):**
```json
{
  "name": "@bmad/bme-empathy-mapper",
  "version": "1.0.0",
  "description": "Emma - Empathy Mapping Specialist for BMAD Method",
  "keywords": ["bmad", "agent", "empathy-mapping", "ux-research", "design-thinking"],
  "author": "Convoke Team",
  "license": "MIT",
  "peerDependencies": {
    "@bmad/bme-core": "^1.0.0"
  },
  "scripts": {
    "postinstall": "node install.js"
  },
  "files": [
    "agent/",
    "install.js",
    "README.md"
  ]
}
```

### install.js Template

```javascript
#!/usr/bin/env node
const { installAgent } = require('@bmad/{module}-core/install-helper');

const AGENT_CONFIG = {
  name: '{agent-name}',
  displayName: '{DisplayName}',
  title: '{Title}',
  icon: '{emoji}',
  module: '{module}',
  submodule: '{submodule}',
  agentFile: 'agent/{agent-name}.md',
  workflows: ['agent/workflows/{workflow-name}']
};

installAgent(AGENT_CONFIG)
  .then(() => {
    console.log('✅ {DisplayName} ({agent-name}) installed successfully!');
    console.log('Invoke with: /bmad-agent-{module}-{agent-name}');
  })
  .catch(err => {
    console.error('❌ Installation failed:', err.message);
    process.exit(1);
  });
```

**Example (Emma):**
```javascript
#!/usr/bin/env node
const { installAgent } = require('@bmad/bme-core/install-helper');

const AGENT_CONFIG = {
  name: 'empathy-mapper',
  displayName: 'Emma',
  title: 'Empathy Mapping Specialist',
  icon: '🎨',
  module: 'bme',
  submodule: '_designos',
  agentFile: 'agent/empathy-mapper.md',
  workflows: ['agent/workflows/empathy-map']
};

installAgent(AGENT_CONFIG)
  .then(() => {
    console.log('✅ Emma (empathy-mapper) installed successfully!');
    console.log('Invoke with: /bmad-agent-bme-empathy-mapper');
  })
  .catch(err => {
    console.error('❌ Installation failed:', err.message);
    process.exit(1);
  });
```

---

## Part 4: Agent Creation Checklist (Step-by-Step)

**Use this checklist to create new domain-specialized agents in BMAD Method.**

### Step 1: Define Agent Domain

- [ ] Domain expertise identified (empathy mapping, wireframing, quality gates, etc.)
- [ ] Agent expertise/persona documented
- [ ] Agent workflows identified
- [ ] Agent domain knowledge captured

### Step 2: Map Agent to BMAD Interface

- [ ] Agent name chosen (lowercase, hyphenated)
- [ ] Display name chosen (short, friendly)
- [ ] Icon selected (emoji)
- [ ] Role defined (high-level description)
- [ ] Identity written (1-2 sentences)
- [ ] Communication style documented
- [ ] Principles articulated

### Step 3: Design Workflows

- [ ] Workflow architecture selected (step-file, YAML+instructions, hybrid)
- [ ] Workflow pattern chosen (Pattern 1, 2, or 3)
- [ ] Workflow files created following pattern
- [ ] Output templates created
- [ ] Supporting files added (criteria, standards, etc.)

### Step 4: Create Agent File

- [ ] Agent file created: `{module}/{submodule}/agents/{agent-name}.md`
- [ ] Frontmatter completed (all required fields)
- [ ] Menu structure created (MH, CH, custom items, PM, DA)
- [ ] Workflow invocations added (exec/workflow handlers)

### Step 5: Create npm Package

- [ ] Package directory created: `@bmad/{module}-{agent-name}/`
- [ ] package.json created (using template)
- [ ] install.js created (using template)
- [ ] README.md written (agent documentation)
- [ ] Agent file copied to `agent/{agent-name}.md`
- [ ] Workflow files copied to `agent/workflows/{workflow-name}/`

### Step 6: Test Agent

- [ ] Install package: `npm install -g @bmad/{module}-{agent-name}`
- [ ] Verify agent registered in `agent-manifest.csv`
- [ ] Invoke agent: `/bmad-agent-{module}-{agent-name}`
- [ ] Test menu displays correctly
- [ ] Test workflow executes successfully
- [ ] Test output artifact created
- [ ] Test party mode integration

### Step 7: Publish Package

- [ ] Version tagged: `git tag v1.0.0`
- [ ] Package published: `npm publish`
- [ ] Installation verified from npm: `npm install -g @bmad/{module}-{agent-name}`

---

## Part 5: Domain-Specific Implementation Examples

### Example 1: Empathy Mapping Agent (Emma)

**Domain:** Design thinking and user research

**Implementation:**
- **Agent Interface:** Emma (empathy-mapper) with design-thinking persona
- **Workflow Pattern:** Step-file architecture (6 sequential steps)
- **Menu Items:** Create Empathy Map, Validate Empathy Map
- **npm Package:** `@bmad/bme-empathy-mapper`

**See:** [Emma Reference Implementation](_bmad/bme/_designos/agents/empathy-mapper.md)

### Example 2: Quality Gatekeeper Agent (Quinn)

**Domain:** Quality assurance and standards enforcement

**Implementation:**
- **Agent Interface:** Quinn (quality-gatekeeper) with QA-focused persona
- **Workflow Pattern:** Step-file architecture (6 sequential steps)
- **Menu Items:** Run Quality Gate, Define Gate Criteria
- **npm Package:** `@bmad/bme-quality-gatekeeper`

**See:** [phase-0-implementation-guide.md](phase-0-implementation-guide.md) (Day 6-7)

### Example 3: Wireframe Design Agent (Wade)

**Domain:** UI/UX wireframing and prototyping

**Implementation:**
- **Agent Interface:** Wade (wireframe-designer) with UX design persona
- **Workflow Pattern:** YAML + instructions architecture
- **Menu Items:** Create Wireframe, Validate Wireframe, Export to Figma
- **npm Package:** `@bmad/bme-wireframe-designer`

**Workflow Structure:**
```
_bmad/bme/_designos/workflows/wireframe/
├── workflow.yaml           # Configuration
├── instructions.md         # Wireframe logic
├── template.md            # Wireframe template
└── components/
    ├── layout-patterns.md
    ├── component-library.md
    └── export-specs.md
```

### Example 4: Custom Domain Agent

**Domain:** Your specialized domain

**Creation Strategy:**
1. **Analyze workflow needs** (sequential? configuration-driven? hybrid?)
2. **Select architecture pattern** (step-file, YAML+instructions, or hybrid)
3. **Design domain workflows** (phases → steps, artifacts → template sections)
4. **Follow standard interface** (frontmatter, menu, invocation patterns)
5. **Package using template** (package.json, install.js, README.md)

---

## Part 6: Core Package Pattern (Shared Infrastructure)

**Principle:** All agents in a module share a single core package for installation utilities.

### Core Package Structure

```
@bmad/{module}-core/
├── package.json
├── install-helper.js       # Shared installation utilities
├── _config/
│   └── module.yaml        # Module configuration
└── README.md
```

### package.json (Core)

```json
{
  "name": "@bmad/{module}-core",
  "version": "1.0.0",
  "description": "{Module Name} module core infrastructure",
  "main": "install-helper.js",
  "files": [
    "install-helper.js",
    "_config/module.yaml",
    "README.md"
  ]
}
```

### install-helper.js (Core)

**See:** [distribution-strategy.md](distribution-strategy.md) lines 972-1045 for full implementation

**Key Functions:**
- `findBmadRoot()` - Locates BMAD Method installation
- `installAgent(config)` - Installs individual agent
- `copyRecursive(src, dest)` - Recursively copies directories

**Used By:** All individual agent packages' `install.js` scripts

---

## Part 7: Bundle Package Pattern (Meta-Package)

**Principle:** Create a bundle package that installs all agents in a module at once.

### Bundle Package Structure

```
@bmad/{module}/
├── package.json         # Dependencies on all agents + core
├── install.js          # Bundle post-install script
└── README.md           # Bundle documentation
```

### package.json (Bundle)

```json
{
  "name": "@bmad/{module}",
  "version": "1.0.0",
  "description": "{Module Name} - All agents bundle",
  "dependencies": {
    "@bmad/{module}-core": "^1.0.0",
    "@bmad/{module}-{agent-1}": "^1.0.0",
    "@bmad/{module}-{agent-2}": "^1.0.0",
    "@bmad/{module}-{agent-3}": "^1.0.0",
    "@bmad/{module}-{agent-4}": "^1.0.0"
  },
  "scripts": {
    "postinstall": "node install.js"
  }
}
```

### install.js (Bundle)

```javascript
#!/usr/bin/env node
// Bundle package just displays success message
// (All agents already installed via dependencies)

console.log('✅ {Module Name} installed successfully!');
console.log('{N} agents available:');
console.log('  /bmad-agent-{module}-{agent-1}      ({DisplayName1} - {Description1})');
console.log('  /bmad-agent-{module}-{agent-2}      ({DisplayName2} - {Description2})');
console.log('  /bmad-agent-{module}-{agent-3}      ({DisplayName3} - {Description3})');
console.log('  /bmad-agent-{module}-{agent-4}      ({DisplayName4} - {Description4})');
console.log('');
console.log("Run '/bmad-party-mode' to see all {total} agents!");
```

---

## Part 8: Benefits of BMAD Agent Architecture

### For Agent Creators

**Standardized Development:**
- Clear architectural patterns to follow
- Standard agent interface for consistency
- Reusable workflow patterns (step-file, YAML, hybrid)

**Reusable Templates:**
- Standard package.json structure
- Standard install.js pattern
- Standard agent interface

**Clear Documentation:**
- Agent creation checklist (step-by-step)
- Workflow patterns (choose the right one)
- Reference implementations (Emma, Wade, Quinn, Stan)

### For BMAD Method Users

**Consistency:**
- All agents use same interface (slash commands, menu structure)
- All agents integrate with party mode
- All agents register in agent-manifest.csv

**Flexibility:**
- Install individual agents OR bundles
- Mix agents from different domains
- Gradual adoption path

**Quality:**
- Domain-specific expertise preserved
- No "lowest common denominator" compromise
- Each agent optimized for its specialty

---

## Part 9: Future Agent Examples

**Potential Future Agents Using This Architecture:**

1. **Evidence-Based Reasoning Agent**
   - Domain: Epistemic reasoning and hypothesis validation
   - Workflow: Hybrid (YAML + evidence step-files)
   - Package: `@bmad/reasoning-evidence-validator`

2. **API Design Standards Agent**
   - Domain: API design and standards compliance
   - Workflow: YAML + instructions (standards-driven)
   - Package: `@bmad/api-design-standards-checker`

3. **Security Threat Modeling Agent**
   - Domain: Security analysis and threat assessment
   - Workflow: Step-file (threat modeling steps)
   - Package: `@bmad/security-threat-modeler`

4. **Performance Testing Agent**
   - Domain: Performance testing and optimization
   - Workflow: YAML + instructions (test scenarios)
   - Package: `@bmad/bme-performance-tester`

**All Use Same Architecture:** Standard interface + workflow pattern + npm template

---

## Part 10: Summary

### What This Framework Provides

**1. Standard BMAD Agent Interface**
- Required frontmatter fields (name, displayName, title, icon, role, identity, communicationStyle, principles, module)
- Required menu structure (MH, CH, custom items, PM, DA)
- Workflow invocation patterns (exec, workflow handlers)

**2. Workflow Architecture Patterns**
- Pattern 1: Step-file architecture (sequential micro-files)
- Pattern 2: YAML + instructions (configuration-driven)
- Pattern 3: Hybrid architecture (combine patterns)

**3. npm Package Templates**
- Individual agent package structure
- Core package structure (shared utilities)
- Bundle package structure (meta-package)
- Installation scripts (install.js, uninstall.js)

**4. Agent Creation Checklist**
- 7-step process for creating new domain-specialized agents
- Validation checkpoints
- Testing guidelines

### Key Benefits

**Domain-Specialized:** Supports any domain expertise (design, QA, security, etc.)

**Reusable:** Standard templates reduce implementation effort

**Consistent:** All agents use same interface regardless of domain

**Flexible:** Supports different workflow architectures via pattern selection

**Proven:** Emma (empathy-mapper) serves as reference implementation

---

## Reference Implementation

**Agent:** Emma (empathy-mapper)
**Domain:** Empathy mapping and user research
**Workflow Pattern:** Step-file architecture
**Files:**
- Agent: [_bmad/bme/_designos/agents/empathy-mapper.md](_bmad/bme/_designos/agents/empathy-mapper.md)
- Workflow: [_bmad/bme/_designos/workflows/empathy-map/](_bmad/bme/_designos/workflows/empathy-map/)
- Package: `@bmad/bme-empathy-mapper`

**What Emma Demonstrates:**
- Standard BMAD agent interface implementation
- Step-file workflow architecture pattern
- npm package template usage
- BMAD Method integration
- Party mode compatibility

**Use Emma as Template:** When creating new domain-specialized agents, follow Emma's structure and select the appropriate workflow pattern for your use case.

---

**End of BMAD Agent Architecture Framework**

**Status:** Framework specification complete - reference implementation (Emma) operational
