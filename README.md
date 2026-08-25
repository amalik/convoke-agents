<div align="center">

```
 ██████╗ ██████╗ ███╗   ██╗██╗   ██╗ ██████╗ ██╗  ██╗███████╗
 ██╔════╝██╔═══██╗████╗  ██║██║   ██║██╔═══██╗██║ ██╔╝██╔════╝
 ██║     ██║   ██║██╔██╗ ██║██║   ██║██║   ██║█████╔╝ █████╗
 ██║     ██║   ██║██║╚██╗██║╚██╗ ██╔╝██║   ██║██╔═██╗ ██╔══╝
 ╚██████╗╚██████╔╝██║ ╚████║ ╚████╔╝ ╚██████╔╝██║  ██╗███████╗
 ╚═════╝ ╚═════╝ ╚═╝  ╚═══╝  ╚═══╝   ╚═════╝ ╚═╝  ╚═╝╚══════╝
      Extends BMAD Method across the product lifecycle
```

[![Version](https://img.shields.io/npm/v/convoke-agents?color=blue&label=version)](https://www.npmjs.com/package/convoke-agents)
[![License](https://img.shields.io/badge/license-MIT-blue)](LICENSE)

</div>

**Convoke is built in [BMAD Method](https://github.com/bmad-code-org/BMAD-METHOD)'s format. Where BMAD Method is installed, it extends it. Where it isn't, it runs on its own.**

BMAD builds. Convoke covers the lifecycle either side of the build — deciding what deserves building before you start, and finding out whether what you shipped is actually fit to run. It installs as teams of specialist agents, plus skills that add capabilities to agents you already have.

Portability is a direction, not yet a destination. The export tooling takes a standalone BMAD skill anywhere; Convoke's own team agents are not there yet — see [Extending Convoke](#extending-convoke) for exactly where the line falls today.

---

## The lifecycle

Convoke's teams sit either side of the build. Where a team exists, it's named. Where one doesn't, the scope is mapped and not built.

```
    Discovery       Design        Build       Readiness
   ╔══════════╗  ┌──────────┐  ┌──────────┐  ╔══════════╗
   ║  Vortex  ║  │   WDS    │  │   BMM    │  ║   Gyre   ║
   ║ 7 agents ║  │          │  │   TEA    │  ║ 4 agents ║
   ╚══════════╝  └──────────┘  └──────────┘  ╚══════════╝

   ╚═╝ Convoke ships it      └─┘ BMAD Method ecosystem — not ours
```

Strategy · Growth · Delivery · Security · Ops/Run · Sunset are mapped in the [lifecycle vision](https://github.com/amalik/convoke-agents/blob/main/docs/lifecycle-expansion-vision.md), not built.

Convoke works standalone or as an extension — no BMAD Method installation is required either way.

---

## Your first 15 minutes

1. **Install** — `npm install convoke-agents && npx -p convoke-agents convoke-install` (details in [INSTALLATION.md](INSTALLATION.md))
2. **Personalize** — open `_bmad/bme/_vortex/config.yaml` (or `_bmad/bme/_gyre/config.yaml`) and replace `{user}` with your name, so agents know who they're talking to
3. **Pick a starting point**
   - **Vortex:** activate Emma → choose **Lean Persona** → follow the guided steps
   - **Gyre:** activate Scout → choose **Full Analysis** → walk the pipeline
4. **Find your artifact** — outputs land in `_bmad-output/vortex-artifacts/` or `.gyre/`
5. **Follow the Compass** — every workflow ends by routing you to whichever agent should pick up next. You never have to guess what comes after.

**How activation works.** Each agent is a markdown file containing a persona, a menu, and its workflow instructions. When Claude reads it, it adopts that expertise and shows you a numbered menu. In Claude Code, agents are slash commands (`/bmad-agent-bme-contextualization-expert` is Emma); in the terminal or on Claude.ai, paste the agent file into the conversation. Full list in the [Agent Guide](https://github.com/amalik/convoke-agents/blob/main/docs/agents.md).

Something not working? Run `npx -p convoke-agents convoke-doctor`, or check the [FAQ](https://github.com/amalik/convoke-agents/blob/main/docs/faq.md).

---

## Teams

### Vortex — discovery

Vortex takes you from "who are these users and what is actually wrong" to "here is what the evidence says we should do next" — a continuous loop, not a one-shot checklist. Each stream builds on the last, and when a gap appears the Compass routes you back to fill it.

Emma 🎯 · Isla 🔍 · Mila 🔬 · Liam 💡 · Wade 🧪 · Noah 📡 · Max 🧭

> **Job-to-be-Done:** Eliminate the daily 5:30 PM dinner decision so I can feed my family well without the mental load of planning, shopping, and deciding under time pressure.
>
> — Emma, framing the problem for a meal-planning product

[Emma's user guide](_bmad/bme/_vortex/guides/EMMA-USER-GUIDE.md) · [The full journey, every stream →](https://github.com/amalik/convoke-agents/blob/main/_bmad-output/journey-examples/busy-parents-7-agent-journey.md)

### Gyre — production readiness

Gyre detects your stack, builds a capabilities model specific to it, and tells you what is missing. No generic checklists — it reads your filesystem and reports absences, then keeps the model current as you close them. Findings land in `.gyre/` as classifications and evidence summaries — never file contents or secrets, though evidence does name the files and modules a finding rests on. Committing the directory is the intended workflow.

Scout 🔎 · Atlas 📐 · Lens 🔬 · Coach 🏋️

> **DL-001 · reliability · blocker** — 46 Python files with local tests (pytest/unittest) exist across BMB and Core modules, but CI pipeline (ci.yml) only runs Node.js tests (npm test, npm run test:integration). Python test failures are completely invisible to CI […]
>
> — Lens, from Gyre's run against this repository. Since fixed: `ci.yml` now has a `python-test` job.

[The Gyre team guide](_bmad/bme/_gyre/guides/GYRE-TEAM-GUIDE.md) · [The findings file that quote came from →](https://github.com/amalik/convoke-agents/blob/main/.gyre/findings.yaml)

---

## Extending Convoke

Teams do lifecycle jobs. These three do something different — they change what your agents can do, and how far they travel.

**Enhance — skills for existing agents.** A skill adds a workflow without editing the agent that offers it. The first one is RICE-scored backlog management: run `/bmad-enhance-initiatives-backlog` directly. It also declares a menu patch for the PM agent, which lands only where that agent exists as a file — on BMAD v6.3+ layouts, where agents are skills rather than `.md` files, the slash command is the working path. The [Enhance Guide](_bmad/bme/_enhance/guides/ENHANCE-GUIDE.md) documents the pattern for writing your own.

**Portability — take skills elsewhere.** `npx -p convoke-agents convoke-export <skill>` turns a BMAD skill into a self-contained, LLM-agnostic instruction document, then writes adapters into the export target for Claude (`{target}/CLAUDE.md`), GitHub Copilot (`{target}/.github/copilot-instructions.md`) and Cursor (`{target}/.cursor/rules/`). Four skills drive it end to end: `bmad-export-skill`, `bmad-validate-exports`, `bmad-generate-catalog` and `bmad-seed-catalog`.

Skills are classified by tier: **standalone** exports cleanly, **light-deps** carries dependency notes, **pipeline** is flagged non-portable. Where that leaves Convoke today, precisely: **all 12 Convoke agents are `pipeline`** — every Vortex and Gyre agent, and Team Factory. Exporting one emits *"Framework-only skill. This skill depends on the full Convoke installation and cannot run standalone. […]"* The exception is the Enhance backlog skill, classified `light-deps`, which does export. So what travels cleanly today is the upstream BMAD skill set plus that one — not the teams. Making the teams portable is roadmap, not a shipped feature.

**Team Factory — build your own team.** `/bmad-agent-bme-team-factory` walks you through composition pattern, agent scope with overlap detection, contract design and integration wiring, and persists the decisions as a resumable spec. Output passes the same validation as the native teams. It can also add an agent to an existing team, or a skill to an existing agent.

---

## Install

```bash
npm install convoke-agents@latest
npx -p convoke-agents convoke-install
```

That installs everything — both teams and the skill modules. `convoke-install-vortex` and `convoke-install-gyre` exist and currently do the same thing; per-team installation is not yet a real distinction.

[INSTALLATION.md](INSTALLATION.md) covers prerequisites, what lands where, configuration, verification and troubleshooting.

## Update

```bash
npm install convoke-agents@latest                  # fetch the new package first
npx -p convoke-agents convoke-version              # what you have
npx -p convoke-agents convoke-update --dry-run     # what would change
npx -p convoke-agents convoke-update               # apply, with automatic backup
```

The `@latest` is not decoration: where `convoke-agents` is already a recorded dependency, a bare `npm install convoke-agents` respects the range in your `package.json` and will not cross a major version boundary — it appears to succeed while keeping you on your current major. And skipping the install step means `convoke-update` refreshes your project from the package version you already have, so it reconciles your files rather than upgrading them.

Your artifacts in `_bmad-output/` and `.gyre/` are never touched. [UPDATE-GUIDE.md](UPDATE-GUIDE.md) covers migration paths and troubleshooting.

---

## Documentation

| Document | What's in it |
|----------|--------------|
| [Installation](INSTALLATION.md) | Prerequisites, install options, configuration, troubleshooting |
| [Update Guide](UPDATE-GUIDE.md) | Migration paths between versions |
| [Changelog](CHANGELOG.md) | Complete release history |
| [Agent Guide](https://github.com/amalik/convoke-agents/blob/main/docs/agents.md) | Every agent, workflow and handoff contract in detail |
| [BMAD Compatibility](https://github.com/amalik/convoke-agents/blob/main/docs/BMAD-METHOD-COMPATIBILITY.md) | Which BMAD Method versions Convoke runs against |
| [Testing](https://github.com/amalik/convoke-agents/blob/main/docs/testing.md) | Test suite, CI pipeline, agent test results |
| [Development Guide](https://github.com/amalik/convoke-agents/blob/main/docs/development.md) | Architecture, building agents, contributing |
| [FAQ](https://github.com/amalik/convoke-agents/blob/main/docs/faq.md) | Common questions |

> **Writing a Convoke skill?** Read [The Convoke Operator Covenant](https://github.com/amalik/convoke-agents/blob/main/_bmad-output/planning-artifacts/convoke-covenant-operator.md) first — one axiom and seven Operator Rights every Convoke skill honours. Operator-facing behaviour is an architectural concern in agent systems, not a styling one: a skill that violates the Covenant erodes trust across the whole ecosystem, not just its own surface.

---

## Contributing

Contributions are welcome — agents and workflows, new teams, tests, and documentation.

Start with [CONTRIBUTING.md](https://github.com/amalik/convoke-agents/blob/main/CONTRIBUTING.md): what to work on, the CI gates a change has to clear, and how changes land. Found a bug or want a capability that is not there? [Open an issue](https://github.com/amalik/convoke-agents/issues/new/choose). Security vulnerabilities go through [private reporting](https://github.com/amalik/convoke-agents/security/advisories/new), not the issue tracker.

## License

MIT — see [LICENSE](LICENSE).

## Acknowledgments

Built on [BMAD Method](https://github.com/bmad-code-org/BMAD-METHOD) and the [Innovation Vortex](https://unfix.com/innovation-vortex) from Jurgen Appelo's [unFIX model](https://unfix.com/). The agents that built this — and there were a lot of them — are named in [CREDITS.md](CREDITS.md).

<div align="center">

*Discover what has to be discovered. Ship what's ready to ship.*

[Get started](#your-first-15-minutes) · [The lifecycle](#the-lifecycle) · [Teams](#teams) · [Install](INSTALLATION.md) · [Update](UPDATE-GUIDE.md) · [Changelog](CHANGELOG.md)

</div>
