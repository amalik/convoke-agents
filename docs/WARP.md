# AGENTS.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

Convoke is a composable toolbox for product development lifecycle management that preserves reasoning and maintains traceability from hypothesis through implementation. It's built as a federated module architecture where each module (BMAD, DesignOS, AgentOS, Quint, TEA, CIS) provides specialized agents and workflows for different lifecycle phases.

**Core Philosophy**: Eliminates the "context reconstruction tax" by capturing decision rationale at decision-time and maintaining bidirectional traceability across all artifacts.

## Architecture

### Module Structure

The system uses a federated architecture with modules that implement shared contracts:

```
_bmad/
├── _config/          # Central configuration and manifests
│   ├── manifest.yaml           # Module installation metadata
│   ├── agent-manifest.csv      # Unified agent registry
│   ├── workflow-manifest.csv   # Unified workflow catalog
│   └── task-manifest.csv       # Task definitions
├── _memory/          # Persistent state and preferences
├── core/             # Core platform (v6.0.0-Beta.4)
├── bmm/              # BMAD Method Module - Development workflows
├── bmb/              # BMAD Builder - Module/agent/workflow creation
├── tea/              # Test Architecture Enterprise (v0.1.1-beta.3)
├── cis/              # Creative Intelligence Suite (v0.1.4)
└── (future modules)

_bmad-output/         # All generated artifacts
├── planning-artifacts/
└── implementation-artifacts/
```

### Key Architectural Patterns

**BaseArtifact Contract**: All artifacts extend a common interface with:
- `id`, `type`, `created_date`, `updated_date`
- `traces`: Cross-domain traceability links (parent, children, related)
- `metadata`: Module, version, contract_version

**Three-State Artifact Lifecycle**:
1. **Domain-Native (80%)**: Minimal frontmatter, no cross-domain overhead
2. **Cross-Domain Candidate (15%)**: Auto-promoted when external references detected
3. **Multi-Domain Hub (5%)**: Full traceability with comprehensive metadata

**Module Loading**: Registry-based lazy loading defined in `_bmad/_config/modules.yaml`

## Working with the Codebase

### Configuration Files

Project configuration lives in multiple locations:
- `_bmad/core/config.yaml` - Core settings (user_name, communication_language, output_folder)
- `_bmad/bmm/config.yaml` - BMM module settings (planning_artifacts, implementation_artifacts)
- `_bmad/_config/manifest.yaml` - Module installation status and versions

**Key Variables**:
- `project-root`: Repository root directory
- `user_name`: Amalik
- `communication_language`: English
- `output_folder`: `_bmad-output/`

### Agent System

22 specialized agents are defined in `_bmad/_config/agent-manifest.csv`:

**Core Agents**:
- `bmad-master`: Master orchestrator and knowledge custodian
- `quick-flow-solo-dev` (Barry): Rapid development with minimal ceremony

**Development Team** (bmm module):
- `analyst` (Mary): Business analysis and requirements
- `architect` (Winston): System architecture and technical design
- `dev` (Amelia): Software development with strict adherence to stories
- `pm` (John): Product management and PRDs
- `sm` (Bob): Scrum master and story preparation
- `tech-writer` (Paige): Technical documentation
- `ux-designer` (Sally): UX design and user experience
- `quinn`: Pragmatic QA automation

**Test Architecture** (tea module):
- `tea` (Murat): Master test architect for risk-based testing

**Creative Intelligence** (cis module):
- `brainstorming-coach` (Carson): Brainstorming facilitation
- `creative-problem-solver` (Dr. Quinn): Systematic problem-solving
- `design-thinking-coach` (Maya): Design thinking expertise
- `innovation-strategist` (Victor): Business model innovation
- `presentation-master` (Caravaggio): Visual communication
- `storyteller` (Sophia): Narrative development

**Builder Tools** (bmb module):
- `agent-builder` (Bond): Create BMAD-compliant agents
- `module-builder` (Morgan): Full-stack module development
- `workflow-builder` (Wendy): Workflow architecture

### Workflow System

42 workflows organized by lifecycle phase:

**Discovery & Validation** (bmm + quint):
- `create-product-brief`: Collaborative product brief creation
- `research`: Multi-domain research (market, technical, domain)

**Planning** (bmm):
- `create-prd`: Tri-modal PRD workflow (create/validate/edit)
- `create-ux-design`: UX pattern planning
- `create-architecture`: Adaptive architectural conversation
- `create-epics-and-stories`: Transform PRD into implementation stories
- `check-implementation-readiness`: Validate completeness before dev

**Implementation** (bmm):
- `quick-spec`: Conversational spec engineering
- `quick-dev`: Execute tech-specs or direct instructions
- `create-story`: Generate next user story from epics
- `dev-story`: Execute story implementation
- `code-review`: Adversarial senior developer review
- `correct-course`: Navigate significant sprint changes
- `sprint-planning`: Generate sprint tracking
- `sprint-status`: Summarize sprint and surface risks
- `retrospective`: Post-epic review and lessons learned

**Quality & Testing** (tea):
- `testarch-atdd`: Acceptance test-driven development
- `testarch-automate`: Expand test coverage
- `testarch-framework`: Initialize test framework (Playwright/Cypress)
- `testarch-ci`: Scaffold CI/CD pipeline
- `testarch-test-design`: Testability review and planning
- `testarch-test-review`: Test quality validation
- `testarch-trace`: Requirements-to-tests traceability
- `testarch-nfr`: Non-functional requirements assessment
- `qa-automate`: Quick test generation (simpler than TEA)

**Documentation** (bmm):
- `document-project`: Analyze and document brownfield projects
- `create-excalidraw-*`: Generate diagrams (dataflow, architecture, flowchart, wireframe)

**Creative Tools** (cis):
- `brainstorming`: Interactive ideation sessions
- `design-thinking`: Human-centered design process
- `innovation-strategy`: Business model innovation
- `problem-solving`: Systematic challenge resolution
- `storytelling`: Narrative framework application

**Meta Tools** (bmb + core):
- `agent`: Create/edit/validate BMAD agents
- `module`: Create BMAD modules
- `workflow`: Create standalone workflows
- `party-mode`: Multi-agent group discussions

### Workflow Invocation Pattern

Workflows use **step-file architecture**:
1. Workflow entry point loads configuration
2. Sequential step files execute focused tasks
3. State persists via variables between steps
4. Each step file loads fresh to combat context loss

**Example**: `quick-dev` workflow
- Entry: `_bmad/bmm/workflows/bmad-quick-flow/quick-dev/workflow.md`
- Steps: `steps/step-01-mode-detection.md` → subsequent steps
- Config: Loads `_bmad/bmm/config.yaml` for variables

### Claude Code Integration

Commands in `.claude/commands/` directory:
- Naming: `bmad-{module}-{workflow}.md`
- Pattern: Load full workflow from `_bmad/{module}/workflows/{workflow}/workflow.md`
- Critical: Must read entire workflow contents and follow directions exactly

## Development Patterns

### Artifact Creation

All artifacts should include frontmatter with:
```yaml
---
id: unique-identifier
type: story | design | test | hypothesis
created_date: ISO8601
updated_date: ISO8601
traces:
  parent: parent-artifact-id
  children: [child-ids]
  related: [related-ids]
metadata:
  module: bmm | designos | agentos | quint | tea
  version: 1.0.0
  contract_version: 2.0.0
---
```

### Traceability and Alignment

**Traceability**: Links between artifacts (hypothesis → design → story → test)
**Alignment**: Content validation that artifacts address parent requirements

Validate alignment with natural language:
- "Check alignment for story-042"
- "Does design-101 align with its hypothesis?"

### Module Namespace Resolution

Commands use module-first pattern:
```bash
# Explicit (zero collision)
bmad bmm create-story
bmad designos create-design

# Alias (common usage)
bmad story        # → bmm:create-story
bmad design       # → designos:create-design

# Interactive fallback for ambiguous
bmad create-story # → prompts if multiple matches
```

### Version Management

- **Contract Versioning**: Semantic versioning with adapter pattern
- **Module Compatibility**: Defined in `_bmad/_config/compatibility-matrix.yaml`
- **Migration Tooling**: `bmad contract migrate --from X --to Y`

## Important Context

### No Traditional Build System

This is a **framework/toolset repository**, not a compiled application:
- No package.json, Makefile, or traditional build scripts
- Configuration-driven via YAML files
- Workflows are markdown/XML documents, not code
- Agents are declarative personas, not executables

### Git-Centric Workflow

All artifacts are version-controlled in `_bmad-output/`:
- Planning artifacts track product decisions
- Implementation artifacts track development
- Frontmatter provides Git-friendly traceability

### AI-First Interface

System designed for conversational interaction:
- Natural language queries over CLI memorization
- Agents guide workflow execution
- Context-aware suggestions based on project state
- Zero ceremony for artifact creation

## Key Principles

1. **Load resources at runtime, never pre-load** - Lazy loading prevents context bloat
2. **Capture WHY at decision-time** - Reasoning preservation over documentation
3. **Traceability through frontmatter** - Git-native, self-documenting artifacts
4. **Composable over monolithic** - Use only what you need
5. **Interoperability first** - Import from anywhere, export everywhere
6. **Adaptive AI guidance** - Learns user expertise level over time
7. **Adjacent pair validation** - Default to minimal context checks, full chain optional
8. **Module federation** - Independent evolution with shared contracts

## Project-Specific Notes

- **Phase**: Currently Phase 0 (Framework Integration) - Beta 4
- **Status**: Convoke building Convoke (dogfooding from Day 1)
- **Target Users**: Technical teams (engineers, PMs, designers, QA)
- **Distribution**: Private GitHub → Open Source pathway
- **Interface**: CLI + VSCode (Claude Code MCP server) for v1.0

## Working with Warp

When using Warp in this repository:

1. **Understand the module system** - Most functionality is in `_bmad/{module}/` directories
2. **Check manifests** - `_bmad/_config/` has authoritative lists of agents, workflows, tasks
3. **Follow workflow patterns** - Read the full workflow.md before suggesting changes
4. **Respect frontmatter** - Artifacts use structured YAML headers for traceability
5. **Use natural language** - The system is designed for conversational interaction
6. **Check configuration** - User preferences in `_bmad/core/config.yaml` and module configs
7. **Reference product brief** - `_bmad-output/planning-artifacts/product-brief-Convoke-2026-02-01.md` has comprehensive context

## Common Tasks

**List available resources**:
- Agents: See `_bmad/_config/agent-manifest.csv`
- Workflows: See `_bmad/_config/workflow-manifest.csv`
- Tasks: See `_bmad/_config/task-manifest.csv`

**Add new functionality**:
- New agent: Use `bmb` module's `agent-builder`
- New workflow: Use `bmb` module's `workflow-builder`
- New module: Use `bmb` module's `module-builder`

**Find implementations**:
- Agent definitions: `_bmad/{module}/agents/{agent}.md`
- Workflow definitions: `_bmad/{module}/workflows/{workflow}/workflow.md`
- Workflow steps: `_bmad/{module}/workflows/{workflow}/steps/`
