<div align="center">

```
 ██████╗ ██████╗ ███╗   ██╗██╗   ██╗ ██████╗ ██╗  ██╗███████╗
 ██╔════╝██╔═══██╗████╗  ██║██║   ██║██╔═══██╗██║ ██╔╝██╔════╝
 ██║     ██║   ██║██╔██╗ ██║██║   ██║██║   ██║█████╔╝ █████╗
 ██║     ██║   ██║██║╚██╗██║╚██╗ ██╔╝██║   ██║██╔═██╗ ██╔══╝
 ╚██████╗╚██████╔╝██║ ╚████║ ╚████╔╝ ╚██████╔╝██║  ██╗███████╗
 ╚═════╝ ╚═════╝ ╚═╝  ╚═══╝  ╚═══╝   ╚═════╝ ╚═╝  ╚═╝╚══════╝
                Agent teams for complex systems
```

[![Version](https://img.shields.io/badge/version-3.2.0-blue)](https://github.com/amalik/convoke-agents)
[![License](https://img.shields.io/badge/license-MIT-blue)](LICENSE)

</div>

Convoke extends AI agents with two types of installable modules: **Teams** bring new agents for a domain, **Skills** add new capabilities to existing agents. Install them independently or combine them.

| Team | Agents | Domain |
|------|--------|--------|
| **Vortex** | 7 agents, 22 workflows | Product discovery — from user insight to evidence-based decisions |
| **Gyre** | 4 agents, 7 workflows | Production readiness — from stack detection to gap analysis |

### What's New in 3.2

- **Portable skills** — export any BMAD skill to a standalone format with platform adapters for Claude, Copilot, and Cursor (`npx convoke-export <skill>`)
- **Team Factory ships** — the module for creating new BMAD-compliant teams is now included in the npm package
- **1,123 tests** — test infrastructure recovery resolved a phantom-test bug class; test gate tripled from 320+ to 1,123 verified-passing tests
- See the [CHANGELOG](CHANGELOG.md) for the full release details

---

## Vortex — Product Discovery Team

**7 agents guide you from insight to evidence and back again — a continuous discovery loop, not a one-shot checklist**

[![Agents](https://img.shields.io/badge/agents-7-brightgreen)](docs/agents.md)
[![Workflows](https://img.shields.io/badge/workflows-22-success)](docs/agents.md)

Vortex guides you through seven discovery streams — from understanding your users to interpreting production signals — so you can make evidence-based decisions before, during, and after you build. Each stream builds on the previous one's findings, and when gaps appear, the system routes you back to fill them.

```
                         7 Streams · 7 Agents

  ┌─────────────┐   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐
  │     Isla    │──▶│     Mila    │──▶│     Liam    │──▶│     Wade    │
  │  Empathize  │   │ Synthesize  │   │ Hypothesize │   │ Externalize │
  └─────────────┘   └─────────────┘   └─────────────┘   └─────────────┘
         ▲                                                       │
         │                                                       │
         │                                                       ▼
  ┌─────────────┐   ┌─────────────┐   ┌─────────────┐            │
  │     Emma    │◀──│     Max     │◀──│     Noah    │◀───────────┘
  │Contextualize│   │ Systematize │   │  Sensitize  │
  └─────────────┘   └─────────────┘   └─────────────┘
         │                 │                 │
         └─────────────────┴─────────────────┘
          ▶ Start at Emma · back to any stream
```

*Each workflow ends with a Compass routing to whichever stream needs attention — you can start or return to any agent.*

| Agent | Stream | What they do |
|-------|--------|-------------|
| **Emma** 🎯 | Contextualize | Frame the right problem — personas, product vision, scope |
| **Isla** 🔍 | Empathize | Understand users — empathy maps, interviews, discovery research |
| **Mila** 🔬 | Synthesize | Converge research into clear problem definitions |
| **Liam** 💡 | Hypothesize | Turn problems into testable hypotheses and experiments |
| **Wade** 🧪 | Externalize | Test assumptions with MVPs, experiments, and prototypes |
| **Noah** 📡 | Sensitize | Interpret production signals, user behavior, and engagement patterns |
| **Max** 🧭 | Systematize | Capture learnings and decide: pivot, patch, or persevere |

<details>
<summary>22 Vortex Workflows</summary>

- Assumption Mapping
- Behavior Analysis
- Contextualize Scope
- Empathy Map
- Experiment Design
- Hypothesis Engineering
- Lean Experiment
- Lean Persona
- Learning Card
- MVP
- Pattern Mapping
- Pivot Patch Persevere
- Pivot Resynthesis
- Product Vision
- Production Monitoring
- Proof of Concept
- Proof of Value
- Research Convergence
- Signal Interpretation
- User Discovery
- User Interview
- Vortex Navigation

</details>

### What Agents Produce

Here's a sample of real output from a busy parents meal planning project — each excerpt is from the [full 7-agent journey example](_bmad-output/journey-examples/busy-parents-7-agent-journey.md).

#### Emma 🎯 Contextualize

Emma frames the right problem. Here's the Job-to-be-Done she produced:

> **Job-to-be-Done:** Eliminate the daily 5:30 PM dinner decision so I can feed my family well without the mental load of planning, shopping, and deciding under time pressure.
>
> **Riskiest Assumptions:**
> 1. Decision fatigue — not cooking skill or ingredient access — is the primary barrier to weeknight dinner success
> 2. Parents would trust and act on an externally-provided dinner suggestion rather than needing to choose themselves
> 3. "Good enough" nutrition is an acceptable standard — parents aren't seeking perfection, they're seeking relief from guilt

#### Liam 💡 Hypothesize

Liam turns problems into testable ideas. Here's one of three hypotheses he produced:

> **Hypothesis 1: The Pre-Commute Decision Eliminator**
>
> We believe that busy parents will act on a single dinner suggestion delivered at 4:00 PM within 3 minutes because the decision burden — not cooking — is their primary barrier, and an earlier intervention catches them before the anxiety spiral begins.
>
> **Riskiest Assumption:** Parents will trust and act on an automated suggestion without second-guessing. Research shows they want "someone to tell me what to make" — but "someone" may need to be a trusted person, not an algorithm.

#### Max 🧭 Systematize

Max captures what you learned and decides what to do next:

> **Recommendation: PATCH** (iterate on timing, don't pivot direction)
>
> The core hypothesis is validated. The product direction (decision elimination via single suggestion) is correct. The timing mechanism needs refinement — shift from fixed 4:00 PM delivery to adaptive delivery based on each user's observed engagement pattern.
>
> **Three Actions:**
> 1. **Implement adaptive timing** — shift the push notification to match each user's observed engagement window.
> 2. **Route to Isla for timing investigation** — qualitative research on why users engage at 3:15 PM. Is it anxiety relief, logistical planning, or habit?
> 3. **Test willingness to pay immediately** — the mechanism works, but we have no commercial validation. Run a landing page test with pricing before further product investment.

**[See the full 7-agent journey example →](_bmad-output/journey-examples/busy-parents-7-agent-journey.md)**

For detailed workflow descriptions, see the [Agent Guide](docs/agents.md) and individual user guides: [Emma](_bmad/bme/_vortex/guides/EMMA-USER-GUIDE.md) | [Isla](_bmad/bme/_vortex/guides/ISLA-USER-GUIDE.md) | [Mila](_bmad/bme/_vortex/guides/MILA-USER-GUIDE.md) | [Liam](_bmad/bme/_vortex/guides/LIAM-USER-GUIDE.md) | [Wade](_bmad/bme/_vortex/guides/WADE-USER-GUIDE.md) | [Noah](_bmad/bme/_vortex/guides/NOAH-USER-GUIDE.md) | [Max](_bmad/bme/_vortex/guides/MAX-USER-GUIDE.md)

---

## Gyre — Production Readiness Team

**4 agents assess whether your project is ready to ship — detect your stack, model what "ready" means, find what's missing, and refine together**

[![Agents](https://img.shields.io/badge/agents-4-brightgreen)](docs/agents.md)
[![Workflows](https://img.shields.io/badge/workflows-7-success)](docs/agents.md)

Most teams ship to production without knowing if they're actually ready — missing SLOs, incomplete observability, unreviewed deployment strategies. Gyre analyzes your project's filesystem, builds a capabilities model tailored to your specific tech stack, and surfaces what's absent. No generic checklists — every finding is contextual to your project.

```
                    4 Agents · 4 Contracts

  ┌─────────────┐   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐
  │    Scout    │──▶│    Atlas    │──▶│    Lens     │──▶│    Coach    │
  │   Detect    │   │   Model     │   │   Analyze   │   │   Review    │
  │   Stack     │   │   Capabil.  │   │   Gaps      │   │   Refine    │
  └─────────────┘   └──────▲──────┘   └─────────────┘   └──────┬──────┘
                           │                                   │
                           └────────────── GC4 ────────────────┘
                                       feedback
```

*Linear pipeline with a feedback loop. Coach amendments feed back to Atlas — the model improves with every review.*

| Agent | Role | What they do |
|-------|------|-------------|
| **Scout** 🔎 | Detect | Scan filesystem artifacts to classify your tech stack — language, containers, CI/CD, observability, cloud provider |
| **Atlas** 📐 | Model | Generate a capabilities manifest using industry standards (DORA, OpenTelemetry, Google PRR) and web search |
| **Lens** 🔬 | Analyze | Compare capabilities against what actually exists — surface absences, compound risks, severity-prioritized findings |
| **Coach** 🏋️ | Review | Walk through findings conversationally — amend the model, capture feedback, track progress over time |

<details>
<summary>7 Gyre Workflows</summary>

- Full Analysis (end-to-end pipeline)
- Stack Detection
- Model Generation
- Gap Analysis
- Model Review
- Delta Report
- Accuracy Validation

</details>

### What Gyre Produces

Gyre writes structured artifacts to `.gyre/` in your project root — safe to commit, containing technology categories only (no file contents, paths, or secrets):

- **Stack Profile** (`.gyre/stack-profile.yaml`) — classified tech stack with detection confidence
- **Capabilities Manifest** (`.gyre/capabilities.yaml`) — 20+ capabilities across observability, deployment, reliability, and security
- **Findings Report** (`.gyre/findings.yaml`) — absence-based findings tagged by severity, confidence, and source
- **Feedback Log** (`.gyre/feedback.yaml`) — team amendments that persist and improve the model over time

**Three modes:** *Crisis* (first run, full pipeline), *Anticipation* (re-analysis with cached model), *Regeneration* (fresh model rebuild).

**Delta tracking:** Run Gyre after making improvements to see what you've resolved — findings are tagged [NEW], [CARRIED], or resolved.

User guides: [Scout](_bmad/bme/_gyre/guides/SCOUT-USER-GUIDE.md) | [Atlas](_bmad/bme/_gyre/guides/ATLAS-USER-GUIDE.md) | [Lens](_bmad/bme/_gyre/guides/LENS-USER-GUIDE.md) | [Coach](_bmad/bme/_gyre/guides/COACH-USER-GUIDE.md)

---

## Extending Convoke

### Team Factory

Create fully-wired, BMAD-compliant teams through a guided workflow — zero post-creation fixes.

```
/bmad-team-factory
```

The factory guides you through composition pattern selection (Independent or Sequential), agent scope definition with overlap detection, contract design, and integration wiring. Decision state is persisted as a spec file for resume and express mode. Output passes the same validation as native teams.

Three capabilities:
- **Create Team** — build a new team from scratch with full integration
- **Add Agent** — extend an existing team with a new agent
- **Add Skill** — give an existing agent a new workflow

### Portability — Export Skills Anywhere

Take any BMAD skill and export it to a standalone, LLM-agnostic format that works outside Claude Code:

```bash
npx convoke-export bmad-brainstorming --output ./exported
```

The export engine transforms skill workflows into self-contained instruction documents, then generates platform-specific adapter files:

| Platform | Adapter output (written inside the export target) |
|----------|---------------|
| Claude | `{target}/CLAUDE.md` commands |
| GitHub Copilot | `{target}/.github/copilot-instructions.md` |
| Cursor | `{target}/.cursor/rules/` |

Skills are classified by tier: **standalone** skills export cleanly, **light-deps** skills include dependency notes, and **pipeline** skills (multi-step orchestration) are flagged as non-portable.

Four skills support the workflow: `bmad-export-skill` (export), `bmad-validate-exports` (validate), `bmad-generate-catalog` (catalog README), `bmad-seed-catalog` (full catalog repo).

### Enhance — Agent Skills

Skills give existing agents new workflows — installed via menu patching, not agent modification. The first skill adds RICE-scored backlog management to the PM agent:

```
                    Initiatives Backlog

  ┌─────────────┐   ┌─────────────┐   ┌─────────────┐
  │  [T] Triage │   │  [R] Review │   │  [C] Create │
  │  Ingest new │   │   Rescore   │   │  Bootstrap  │
  │  findings   │   │  existing   │   │ from scratch│
  └──────┬──────┘   └──────┬──────┘   └──────┬──────┘
         │                 │                 │
         ▼                 ▼                 ▼
  ┌──────────────────────────────────────────────────┐
  │          initiatives-backlog.md                  │
  │   RICE-scored · Categorized · Change-tracked     │
  └──────────────────────────────────────────────────┘
```

Activate from the PM agent menu or directly: `/bmad-enhance-initiatives-backlog`

The [Enhance Guide](_bmad/bme/_enhance/guides/ENHANCE-GUIDE.md) documents the complete pattern for building your own skills.

---

## Quick Start

### Prerequisites

- Node.js 18+ or Bun
- Git
- Claude Code or Claude.ai

### Install

**Everything (Vortex + Gyre):**

```bash
npm install convoke-agents@latest
npx convoke-install
```

**Vortex only:**

```bash
npm install convoke-agents@latest
npx convoke-install-vortex
```

**Gyre only:**

```bash
npm install convoke-agents@latest
npx convoke-install-gyre
```

Something not working? Run `npx convoke-doctor` or check the [FAQ](docs/faq.md).

### Personalize

Open `_bmad/bme/_vortex/config.yaml` (or `_bmad/bme/_gyre/config.yaml`) and replace `{user}` with your name. Agents use this to personalize their interactions.

### Activate an Agent

**Claude Code (skills)**

```
# Vortex
/bmad-agent-bme-contextualization-expert          # Emma  🎯
/bmad-agent-bme-discovery-empathy-expert          # Isla  🔍
/bmad-agent-bme-research-convergence-specialist   # Mila  🔬
/bmad-agent-bme-hypothesis-engineer               # Liam  💡
/bmad-agent-bme-lean-experiments-specialist        # Wade  🧪
/bmad-agent-bme-production-intelligence-specialist # Noah  📡
/bmad-agent-bme-learning-decision-expert           # Max   🧭

# Gyre
/bmad-agent-bme-stack-detective                    # Scout 🔎
/bmad-agent-bme-model-curator                      # Atlas 📐
/bmad-agent-bme-readiness-analyst                  # Lens  🔬
/bmad-agent-bme-review-coach                       # Coach 🏋️
```

**Claude Code (terminal) / Other AI assistants**

```bash
# Vortex
cat _bmad/bme/_vortex/agents/contextualization-expert.md    # Emma  🎯
# ... (see user guides for full list)

# Gyre
cat _bmad/bme/_gyre/agents/stack-detective.md               # Scout 🔎
cat _bmad/bme/_gyre/agents/model-curator.md                 # Atlas 📐
cat _bmad/bme/_gyre/agents/readiness-analyst.md             # Lens  🔬
cat _bmad/bme/_gyre/agents/review-coach.md                  # Coach 🏋️
```

**Claude.ai** — Open any agent file and paste its contents into your conversation.

**How activation works:** Each agent is a markdown file containing a full persona, menu system, and workflow instructions. When Claude reads the file, it adopts that agent's expertise and presents you with an interactive menu. Pick a workflow from the menu and follow the guided steps.

### Your First 15 Minutes

1. **Personalize** — edit the config.yaml for your chosen team and replace `{user}` with your name
2. **Pick a starting point:**
   - **Vortex:** Activate Emma → select **Lean Persona** from the menu → follow the guided steps
   - **Gyre:** Activate Scout → select **Full Analysis** from the menu → walk through the pipeline
3. **Find your artifact** — outputs are saved in `_bmad-output/vortex-artifacts/` or `.gyre/`
4. **Follow the Compass** — each workflow ends with a routing suggestion for which agent to use next

### What Gets Installed

```
your-project/
├── _bmad/bme/
│   ├── _vortex/              # Team: Product Discovery
│   │   ├── agents/           # 7 agent definition files
│   │   ├── workflows/        # 22 workflows
│   │   ├── contracts/        # Handoff contracts (HC1-HC5 artifact, HC6-HC10 routing)
│   │   ├── guides/           # User guides (all 7 agents)
│   │   └── config.yaml       # Configuration
│   ├── _gyre/                # Team: Production Readiness
│   │   ├── agents/           # 4 agent definition files
│   │   ├── workflows/        # 7 workflows
│   │   ├── contracts/        # Artifact contract schemas (GC1-GC4)
│   │   ├── guides/           # User guides (all 4 agents)
│   │   └── config.yaml       # Configuration
│   ├── _enhance/             # Skill: Agent Capability Upgrades
│   │   ├── workflows/        # Skill workflows (initiatives-backlog)
│   │   ├── extensions/       # Agent menu patch descriptors
│   │   ├── guides/           # Module author guide
│   │   └── config.yaml       # Configuration
│   ├── _portability/         # Skill: Export skills to other platforms
│   │   └── skills/           # Export, validate, catalog, seed workflows
│   ├── _team-factory/        # Skill: Create new BMAD-compliant teams
│   │   └── lib/              # Factory generators and validators
│   └── _artifacts/           # Skill: Artifact governance & portfolio
│       └── workflows/        # Migrate artifacts, portfolio status
└── _bmad-output/
    ├── vortex-artifacts/     # Vortex generated artifacts
    └── gyre-artifacts/       # Gyre generated artifacts
```

---

## How It Fits with BMAD Core

Convoke handles **discovery, validation, and readiness**. BMAD Core handles **implementation**.

```
Convoke Modules                            BMAD Core
┌──────────────────────────────┐          ┌──────────────────────┐
│ Teams                        │          │                      │
│   Vortex (Product Discovery) │ ──────>  │ PM → Architect → Dev │
│   Gyre (Prod. Readiness)     │ <──────  │ "Let's build it"     │
│                              │          │                      │
│ Skills                       │  signals │                      │
│   Enhance (Agent Upgrades)   │ ──────>  │                      │
│                              │          │                      │
└──────────────────────────────┘          └──────────────────────┘
```

Teams and Skills are peer module types — both installable, both independent. Convoke works standalone or as an extension — no BMAD Method installation required.

---

## Updating

```bash
npm install convoke-agents@latest         # Get the latest package
npx convoke-version                       # Check current version
npx convoke-update --dry-run              # Preview changes
npx convoke-update                        # Apply update (auto-backup)
npx convoke-doctor                        # Diagnose issues
```

Your data in `_bmad-output/` and `.gyre/` is never touched. Automatic backups are created before every update.

> **Important:** `npm install convoke-agents` (without `@latest`) won't cross major version boundaries. If you're on v2.x, you must use `npm install convoke-agents@latest` to get v3.x.

See [UPDATE-GUIDE.md](UPDATE-GUIDE.md) for migration paths and troubleshooting.

---

## Documentation

| Document | Description |
|----------|-------------|
| [Agent Guide](docs/agents.md) | Detailed agent descriptions, workflows, and positioning |
| [BMAD Compatibility](docs/BMAD-METHOD-COMPATIBILITY.md) | Compatibility matrix with BMAD Method versions |
| [Testing](docs/testing.md) | Automated test suite, CI pipeline, and agent test results |
| [Development Guide](docs/development.md) | Architecture, building agents, and contributing |
| [FAQ](docs/faq.md) | Common questions about the framework |
| [CHANGELOG](CHANGELOG.md) | Complete version history |
| [UPDATE-GUIDE](UPDATE-GUIDE.md) | Migration paths and update troubleshooting |

---

## Roadmap

- **v1.x** — Vortex foundation: 7 agents, 22 workflows, update system, CI/CD
- **v2.0** — Product renamed to Convoke. CLI commands: `convoke-*`. Package: `convoke-agents`
- **v2.x** — Enhance module (Skills architecture, RICE initiatives-backlog), Gyre team (production readiness, 4 agents), Team Factory
- **v3.x** — Artifact governance, portfolio intelligence, portability system (export to Claude/Copilot/Cursor), 1,123 tests
- **Next** — Forge (domain knowledge extraction for enterprise brownfield engagements)
- **Future** — Additional teams, Forge-Gyre integration, cross-team workflows

---

## Contributing

We welcome contributions in these areas:

- **Agents** — New domain-specialized agents, workflow improvements
- **Teams** — New team modules via the Team Factory
- **Testing** — Edge cases, performance testing
- **Documentation** — Tutorials, translations, video walkthroughs

**Have feedback?** Found a quality issue, want a missing capability, or have a general comment about an agent? Open an issue and select the **Agent/Workflow Feedback** template.

See the [Development Guide](docs/development.md) for architecture details and agent development patterns.

---

## License

MIT License — see [LICENSE](LICENSE)

## Acknowledgments

- [BMAD Method v6.0.0](https://github.com/bmad-code-org) — Foundation for agent architecture
- [Innovation Vortex](https://unfix.com/innovation-vortex) — Pattern from the [unFIX model](https://unfix.com/) by [Jurgen Appelo](https://jurgenappelo.com/)
- Claude (Anthropic) — AI reasoning and agent development

### Agents

Every agent below contributed to the design, implementation, testing, or documentation of this release.

**Core**
- BMad Master 🧙 — Orchestration and agent coordination

**BMM — BMAD Method Module**
- Mary 📊 Analyst — Requirements analysis and product briefs
- Winston 🏗️ Architect — Architecture decisions and technical design
- Amelia 💻 Dev — Implementation and code delivery
- John 📋 PM — Product management and PRD creation
- Barry 🚀 Quick Flow — Rapid solo development
- Quinn 🧪 QA — Quality assurance and test validation
- Bob 🏃 SM — Sprint management and retrospectives
- Paige 📚 Tech Writer — Documentation and editorial review
- Sally 🎨 UX Designer — User experience design

**BME — Vortex Pattern Agents**
- Emma 🎯 Contextualize — Problem framing and product vision
- Isla 🔍 Empathize — User research and empathy mapping
- Mila 🔬 Synthesize — Research convergence and problem definition
- Liam 💡 Hypothesize — Hypothesis engineering and assumption mapping
- Wade 🧪 Externalize — Lean experiments and MVP testing
- Noah 📡 Sensitize — Production intelligence and signal interpretation
- Max 🧭 Systematize — Learning capture and pivot/persevere decisions

**BME — Gyre Pattern Agents**
- Scout 🔎 Stack Detective — Technology stack detection and classification
- Atlas 📐 Model Curator — Contextual capabilities manifest generation
- Lens 🔬 Readiness Analyst — Absence detection and cross-domain correlation
- Coach 🏋️ Review Coach — Guided review, amendment, and feedback capture

**CIS — Creative & Innovation Strategies**
- Carson 🧠 Brainstorming Coach — Creative ideation facilitation
- Dr. Quinn 🔬 Problem Solver — Systematic problem-solving
- Maya 🎨 Design Thinking Coach — Human-centered design
- Victor ⚡ Innovation Strategist — Business model innovation
- Caravaggio 🎨 Presentation Master — Visual communication
- Sophia 📖 Storyteller — Narrative and storytelling

**BMB — BMAD Builder Module**
- Bond 🤖 Agent Builder — Agent creation and configuration
- Morgan 🏗️ Module Builder — Module architecture
- Wendy 🔄 Workflow Builder — Workflow design and validation

**TEA — Test Engineering & Architecture**
- Murat 🧪 Test Architect — Test framework, CI pipeline, and quality gates

---

<div align="center">

**Discover what has to be discovered. Ship what's ready to ship.**

[Get Started](#quick-start) | [Agents](docs/agents.md) | [Docs](#documentation) | [Roadmap](#roadmap)

</div>
