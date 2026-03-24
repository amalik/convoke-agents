# Installation Guide

Complete guide to installing Convoke agent teams into your project.

- **Package:** `convoke-agents`
- **Version:** 2.4.0
- **Last Updated:** 2026-03-24

---

## Prerequisites

- Node.js 18+ or Bun
- Git
- Claude Code or Claude.ai

Convoke works **standalone** or as an extension to [BMAD Method](https://github.com/bmadhub/bmad). No prior BMAD installation required.

---

## Quick Install

**Everything (Vortex + Gyre + Enhance):**

```bash
npm install convoke-agents && npx -p convoke-agents convoke-install
```

All 11 agents (7 Vortex + 4 Gyre), the Enhance module, and all supporting files are installed and ready to use.

**Vortex only** (product discovery):

```bash
npm install convoke-agents && npx -p convoke-agents convoke-install-vortex
```

**Gyre only** (production readiness):

```bash
npm install convoke-agents && npx -p convoke-agents convoke-install-gyre
```

---

## Installation Options

### Option 1: Install from npm (Recommended)

```bash
# Install into your project
npm install convoke-agents

# Install everything
npx -p convoke-agents convoke-install

# Or install individual teams
npx -p convoke-agents convoke-install-vortex   # Product Discovery (7 agents)
npx -p convoke-agents convoke-install-gyre     # Production Readiness (4 agents)
```

### Option 2: Clone from Source (Contributors Only)

For contributors or developers who want to modify agents or contribute to the project. This sets up a development environment — not an end-user installation.

```bash
git clone https://github.com/amalik/convoke-agents.git
cd convoke-agents
npm install
```

Agents are pre-installed in the repository for development. Note that this does not create the same output directory structure as the npm install path — use Option 1 for project installations.

---

## What Gets Installed

### Directory Structure

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
│   └── _enhance/             # Skill: Agent Capability Upgrades
│       ├── workflows/        # Skill workflows (initiatives-backlog)
│       ├── extensions/       # Agent menu patch descriptors
│       ├── guides/           # Module author guide
│       └── config.yaml       # Configuration
├── .claude/skills/           # Claude Code skill wrappers (auto-generated)
├── _bmad/_config/
│   └── agent-manifest.csv    # Agent registry
└── _bmad-output/
    ├── vortex-artifacts/     # Vortex generated artifacts
    └── gyre-artifacts/       # Gyre generated artifacts
```

### Summary

| Module | Contents |
|--------|----------|
| **Vortex** | 7 agents, 22 workflows, 10 handoff contracts (HC1-HC5 artifact, HC6-HC10 routing), 7 user guides |
| **Gyre** | 4 agents, 7 workflows, 4 contract schemas (GC1-GC4), 4 user guides |
| **Enhance** | Skill workflows, menu patch descriptors, module author guide |
| **Skills** | Claude Code skill wrappers in `.claude/skills/` for all 11 agents |

---

## Configuration

Each team installer creates a `config.yaml` in its module directory. The key fields you'll want to customize:

```yaml
# _bmad/bme/_vortex/config.yaml (or _gyre/config.yaml)
user_name: "{user}"                # Your name (used in agent greetings)
communication_language: "en"       # Language for agent communication
```

The config also includes auto-generated fields (`submodule_name`, `module`, `version`, `agents`, `workflows`) that you typically don't need to edit — the installer and update system manage those.

---

## Verification

After installation, run diagnostics to confirm everything is in place:

```bash
npx -p convoke-agents convoke-doctor
```

Doctor validates all installed modules: agent files, skill wrappers, config files, and manifest entries — with actionable fix suggestions for each issue.

Then activate an agent to confirm it works:

```bash
# Vortex
cat _bmad/bme/_vortex/agents/contextualization-expert.md    # Emma

# Gyre
cat _bmad/bme/_gyre/agents/stack-detective.md               # Scout
```

**Expected result:** The agent greets you by name and displays a numbered menu. If you see raw markdown instead, re-run `convoke-doctor` to diagnose.

---

## Troubleshooting

Start with diagnostics — it catches most issues:

```bash
npx -p convoke-agents convoke-doctor
```

### Permission denied errors

```bash
chmod +x scripts/*.js
npx -p convoke-agents convoke-install-vortex
```

### Config file already exists

The installer preserves your custom settings and only adds missing entries. To force a clean installation:

```bash
rm -rf _bmad/bme/_vortex/    # or _gyre/ for Gyre
npx -p convoke-agents convoke-install-vortex   # or convoke-install-gyre
```

### Installation succeeds but agents don't activate

Check that files are in place:

```bash
npx -p convoke-agents convoke-doctor
ls -la _bmad/bme/_vortex/agents/
ls -la _bmad/bme/_gyre/agents/
```

### Agent skill not appearing in Claude Code

Skills are installed to `.claude/skills/bmad-agent-bme-{id}/SKILL.md`. Verify they exist:

```bash
ls .claude/skills/bmad-agent-bme-*/SKILL.md
```

If missing, re-run the installer — it regenerates skill wrappers on every run.

---

## BMAD Method Compatibility

Convoke works standalone — no BMAD Method installation is required.

If the BMAD Method is already installed in your project, the installer detects it automatically and logs confirmation. Both packages coexist in the `_bmad/` directory without conflict.

See [BMAD-METHOD-COMPATIBILITY.md](docs/BMAD-METHOD-COMPATIBILITY.md) for the full compatibility matrix.

---

## Next Steps

1. **Personalize** — edit the config.yaml for your chosen team and replace `{user}` with your name
2. **Pick a starting point:**
   - **Vortex:** Activate Emma → select **Lean Persona** from the menu → follow the guided steps
   - **Gyre:** Activate Scout → select **Full Analysis** from the menu → walk through the pipeline
3. **Find your artifacts** — outputs are saved in `_bmad-output/vortex-artifacts/` or `.gyre/`
4. **Check updates** — run `npx -p convoke-agents convoke-version` periodically

See the [Agent Guide](docs/agents.md) for detailed workflow descriptions. User guides are available for all 11 agents in their respective `guides/` directories.

---

## Uninstallation

Convoke doesn't provide an uninstall command. To remove:

```bash
# 1. Back up your generated artifacts first
cp -r _bmad-output/vortex-artifacts/ ~/my-backup/
cp -r .gyre/ ~/my-backup/

# 2. Remove agent files, workflows, and skills
rm -rf _bmad/bme/_vortex/
rm -rf _bmad/bme/_gyre/
rm -rf _bmad/bme/_enhance/
rm -rf .claude/skills/bmad-agent-bme-*/
rm -rf .claude/skills/bmad-enhance-*/

# 3. Remove generated artifacts
rm -rf _bmad-output/vortex-artifacts/
rm -rf _bmad-output/gyre-artifacts/

# 4. Uninstall npm package
npm uninstall convoke-agents
```

Your BMAD Method files (if any) remain untouched.

---

[Back to README](README.md) | [Update Guide](UPDATE-GUIDE.md) | [Agent Guide](docs/agents.md)
