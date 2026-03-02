<div align="center">

<pre>
 ██████╗ ███╗   ███╗ █████╗ ██████╗
 ██╔══██╗████╗ ████║██╔══██╗██╔══██╗
 ██████╔╝██╔████╔██║███████║██║  ██║
 ██╔══██╗██║╚██╔╝██║██╔══██║██║  ██║
 ██████╔╝██║ ╚═╝ ██║██║  ██║██████╔╝
 ╚═════╝ ╚═╝     ╚═╝╚═╝  ╚═╝╚═════╝
       E N H A N C E D
</pre>

**Validate your product ideas before writing a single line of code**

[![Version](https://img.shields.io/badge/version-1.6.4-blue)](https://github.com/amalik/BMAD-Enhanced)
[![Agents](https://img.shields.io/badge/agents-7-brightgreen)](docs/agents.md)
[![Workflows](https://img.shields.io/badge/workflows-22-success)](docs/agents.md)
[![License](https://img.shields.io/badge/license-MIT-blue)](LICENSE)

</div>

Most teams skip validation and build on assumptions. BMAD-Enhanced guides you through seven discovery streams — from understanding your users to testing your riskiest assumptions — so you can make evidence-based decisions before committing to code. Each stream builds on the previous one's findings, and when gaps appear, the system routes you back to fill them.

```
                         7 Streams · 7 Agents

  ┌─────────────┐   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐
  │   Isla 🔍    │──▶│   Mila 🔬    │──▶│   Liam 💡    │──▶│   Wade 🧪    │
  │  Empathize  │   │ Synthesize  │   │ Hypothesize │   │ Externalize │
  └─────────────┘   └─────────────┘   └─────────────┘   └─────────────┘
         ▲                                                       │
         │                                                       │
         │                                                       ▼
  ┌─────────────┐   ┌─────────────┐   ┌─────────────┐           │
  │   Emma 🎯    │◀──│   Max  🧭    │◀──│   Noah 📡    │◀──────────┘
  │Contextualize│   │ Systematize │   │  Sensitize  │
  └─────────────┘   └─────────────┘   └─────────────┘
         │                 │                 │
         └─────────────────┴─────────────────┘
          ▶ Start at Emma · back to any stream
```

Each agent above runs one of these streams. You don't follow a fixed path — the system guides you to whichever stream needs attention based on what you've learned so far.

| Agent | Stream | What they do |
|-------|--------|-------------|
| **Emma** 🎯 | Contextualize | Frame the right problem — personas, product vision, scope |
| **Isla** 🔍 | Empathize | Understand users — empathy maps, interviews, discovery research |
| **Mila** 🔬 | Synthesize | Converge research into clear problem definitions |
| **Liam** 💡 | Hypothesize | Turn problems into testable hypotheses and experiments |
| **Wade** 🧪 | Externalize | Test assumptions with MVPs, experiments, and prototypes |
| **Noah** 📡 | Sensitize | Interpret production signals and user behavior |
| **Max** 🧭 | Systematize | Capture learnings and decide: pivot, patch, or persevere |

---

## Quick Start

### Prerequisites

- Node.js 18+ or Bun
- Git
- Claude Code or Claude.ai

### Install

```bash
npm install bmad-enhanced && npx bmad-install-vortex-agents
```

All 7 agents with 22 workflows are installed and ready to use.

### Activate an Agent

```bash
# Read an agent file to activate it
cat _bmad/bme/_vortex/agents/contextualization-expert.md          # Emma  🎯
cat _bmad/bme/_vortex/agents/discovery-empathy-expert.md          # Isla  🔍
cat _bmad/bme/_vortex/agents/research-convergence-specialist.md   # Mila  🔬
cat _bmad/bme/_vortex/agents/hypothesis-engineer.md               # Liam  💡
cat _bmad/bme/_vortex/agents/lean-experiments-specialist.md       # Wade  🧪
cat _bmad/bme/_vortex/agents/production-intelligence-specialist.md # Noah  📡
cat _bmad/bme/_vortex/agents/learning-decision-expert.md          # Max   🧭
```

Each agent presents a menu-driven interface. Pick a workflow and follow the guided steps.

### What Gets Installed

```
your-project/
├── _bmad/bme/_vortex/
│   ├── agents/           # 7 agent definition files
│   ├── workflows/        # 22 workflows
│   ├── contracts/        # Artifact contract schemas
│   ├── guides/           # User guides (all 7 agents)
│   └── config.yaml       # Configuration
└── _bmad-output/
    └── vortex-artifacts/  # Generated artifacts
```

---

## Updating

```bash
npx bmad-version              # Check current version
npx bmad-update --dry-run     # Preview changes
npx bmad-update               # Apply update (auto-backup)
npx bmad-doctor               # Diagnose issues
```

Your data in `_bmad-output/` is never touched. Automatic backups are created before every update.

> **Tip:** If `npx bmad-update` reports "Already up to date" but you know a newer version exists, npx may be serving a cached copy. Force the latest with:
> ```bash
> npx -p bmad-enhanced@latest bmad-update
> ```

See [UPDATE-GUIDE.md](UPDATE-GUIDE.md) for migration paths and troubleshooting.

## What Agents Produce

Here's a sample of real output from a busy parents meal planning project — each excerpt is from the [full 7-agent journey example](_bmad-output/journey-examples/busy-parents-7-agent-journey.md).

### Emma 🎯 Contextualize

Emma frames the right problem. Here's the Job-to-be-Done she produced:

> **Job-to-be-Done:** Eliminate the daily 5:30 PM dinner decision so I can feed my family well without the mental load of planning, shopping, and deciding under time pressure.
>
> **Riskiest Assumptions:**
> 1. Decision fatigue — not cooking skill or ingredient access — is the primary barrier to weeknight dinner success
> 2. Parents would trust and act on an externally-provided dinner suggestion rather than needing to choose themselves
> 3. "Good enough" nutrition is an acceptable standard — parents aren't seeking perfection, they're seeking relief from guilt

### Liam 💡 Hypothesize

Liam turns problems into testable ideas. Here's one of three hypotheses he produced:

> **Hypothesis 1: The Pre-Commute Decision Eliminator**
>
> We believe that busy parents will act on a single dinner suggestion delivered at 4:00 PM within 3 minutes because the decision burden — not cooking — is their primary barrier, and an earlier intervention catches them before the anxiety spiral begins.
>
> **Riskiest Assumption:** Parents will trust and act on an automated suggestion without second-guessing. Research shows they want "someone to tell me what to make" — but "someone" may need to be a trusted person, not an algorithm.

### Max 🧭 Systematize

Max captures what you learned and decides what to do next:

> **Recommendation: PATCH** (iterate on timing, don't pivot direction)
>
> The core hypothesis is validated. The product direction (decision elimination via single suggestion) is correct. The timing mechanism needs refinement — shift from fixed 4:00 PM delivery to adaptive delivery based on each user's observed engagement pattern.
>
> **Three Actions:**
> 1. **Implement adaptive timing** — shift the push notification to match each user's observed engagement window. Engineering effort: 1-2 sprints.
> 2. **Route to Isla for timing investigation** — qualitative research on why users engage at 3:15 PM. Is it anxiety relief, logistical planning, or habit?
> 3. **Test willingness to pay immediately** — the mechanism works, but we have no commercial validation. Run a landing page test with pricing before further product investment.

Want to see the complete walkthrough of all 7 agents applied to the example above?

**📖 [See the full 7-agent journey example →](_bmad-output/journey-examples/busy-parents-7-agent-journey.md)**

---

## Using the Agents

Each agent can be used independently or as part of the full Vortex flow:

1. **Emma (Contextualize)** — Start here when defining a new product or problem space
2. **Isla (Empathize)** — Start here when you need to understand users better
3. **Mila (Synthesize)** — Start here when you have research to converge into a problem definition
4. **Liam (Hypothesize)** — Start here when you have a problem definition and need testable hypotheses
5. **Wade (Externalize)** — Start here when you have hypotheses ready to test
6. **Noah (Sensitize)** — Start here when experiments have graduated to production
7. **Max (Systematize)** — Start here when you have results and need to decide next steps

Max's **Vortex Navigation** workflow helps identify which stream needs attention based on evidence gaps — you don't have to follow a linear path. Every workflow ends with a **Vortex Compass** that routes you to the right next agent based on what you learned. Ten handoff contracts (HC1-HC10) ensure structured information flows between agents, so each agent gets exactly the data it needs from the previous one.

For detailed workflow descriptions and usage examples, see the [Agent Guide](docs/agents.md) and the individual user guides:

- [Emma User Guide](_bmad/bme/_vortex/guides/EMMA-USER-GUIDE.md)
- [Isla User Guide](_bmad/bme/_vortex/guides/ISLA-USER-GUIDE.md)
- [Mila User Guide](_bmad/bme/_vortex/guides/MILA-USER-GUIDE.md)
- [Liam User Guide](_bmad/bme/_vortex/guides/LIAM-USER-GUIDE.md)
- [Wade User Guide](_bmad/bme/_vortex/guides/WADE-USER-GUIDE.md)
- [Noah User Guide](_bmad/bme/_vortex/guides/NOAH-USER-GUIDE.md)
- [Max User Guide](_bmad/bme/_vortex/guides/MAX-USER-GUIDE.md)

---

## How It Fits with BMAD Core

BMAD-Enhanced handles **pre-implementation validation**. BMAD Core handles **implementation**.

```
BMAD-Enhanced (Vortex)                          BMAD Core
┌──────────────────────────────────────┐       ┌──────────────────────┐
│ Isla → Mila → Liam → Wade → Noah    │ ───>  │ PM → Architect → Dev │
│   ↑                          ↓       │       │ "Let's build it"     │
│   └──── Max ◀── Noah    Max ↻        │       └──────────────────────┘
│ Emma provides context at any point   │
│ "Should we build this?"             │
└──────────────────────────────────────┘
```

BMAD-Enhanced works standalone or as an extension — no BMAD Method installation required.

---

## Documentation

| Document | Description |
|----------|-------------|
| [Agent Guide](docs/agents.md) | Detailed agent descriptions, workflows, and positioning |
| [Testing](docs/testing.md) | Automated test suite, CI pipeline, and agent test results |
| [Development Guide](docs/development.md) | Architecture, building agents, and contributing |
| [FAQ](docs/faq.md) | Common questions about the framework |
| [CHANGELOG](CHANGELOG.md) | Complete version history |
| [UPDATE-GUIDE](UPDATE-GUIDE.md) | Migration paths and update troubleshooting |

---

## Roadmap

- **v1.1.0–v1.5.x** — Waves 1-2: Foundation (Emma, Isla, Wade, Max — agent definitions, workflows, update system, CI/CD)
- **v1.6.x** — Wave 3: Complete 7-stream Vortex (added Mila, Liam, Noah — 7 agents, 22 workflows, handoff contracts, Compass routing)
- **v2.0.0+** — Multi-agent collaboration, cross-agent workflows, analytics

---

## Contributing

We welcome contributions in these areas:

- **Agents** — New domain-specialized agents, workflow improvements
- **Testing** — Edge cases, performance testing
- **Documentation** — Tutorials, translations, video walkthroughs
- **Integration** — IDE plugins, third-party tools

**Have feedback?** Found a quality issue, want a missing capability, or have a general comment about an agent? Open an issue and select the **Agent/Workflow Feedback** template — takes under 30 seconds.

See the [Development Guide](docs/development.md) for architecture details and agent development patterns.

---

## License

MIT License — see [LICENSE](LICENSE)

## Acknowledgments

- [BMAD Method v6.0.0](https://github.com/bmadhub/bmad) — Foundation for agent architecture
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

**Innovation Vortex Pattern** — *Discover what has to be discovered, deliver what has to be delivered*

[Get Started](#quick-start) | [Agents](docs/agents.md) | [Docs](#documentation) | [Roadmap](#roadmap)

</div>
