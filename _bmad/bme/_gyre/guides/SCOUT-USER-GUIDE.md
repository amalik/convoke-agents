# Scout 🔎 User Guide

**(stack-detective.md)**

- **Version:** 1.0.0
- **Module:** Gyre Pattern (Production Readiness)
- **Last Updated:** 2026-03-24

## Quick Start

**Who is Scout?** Scout is a methodical investigator who detects your project's technology stack by analyzing filesystem artifacts — package manifests, config files, IaC templates, CI/CD definitions. Scout builds a structured profile of what your project actually uses, not what someone documented months ago.

**When to use Scout:**

- You're starting a Gyre analysis on a new project
- You need a structured inventory of a project's tech stack
- You want to confirm or correct assumptions about what technologies are in use

**Scout vs Other Gyre Agents:**

| If you want to... | Use... |
|---|---|
| Know what tech stack a project uses | **Scout** 🔎 |
| Generate a capabilities model for that stack | **Atlas** 📐 |
| Find what's missing from the project | **Lens** 🔬 |
| Review and refine the findings | **Coach** 🏋️ |

**What you'll get:** A Stack Profile (`.gyre/stack-profile.yaml`) covering primary language/framework, container orchestration, CI/CD platform, observability tooling, cloud provider, and communication protocols.

## How to Invoke

**Claude Code (skills) — recommended:**

```
/bmad-agent-bme-stack-detective
```

**Claude Code (terminal) / Other AI assistants:**

```bash
cat _bmad/bme/_gyre/agents/stack-detective.md
```

**Claude.ai:**

Open `_bmad/bme/_gyre/agents/stack-detective.md` and paste its contents into your conversation.

## Menu Options

| # | Code | Description |
|---|------|-------------|
| 1 | **MH** | Redisplay Menu Help |
| 2 | **CH** | Chat with Scout about stack detection |
| 3 | **DS** | Detect Stack — scan the project and build a Stack Profile |
| 4 | **FA** | Full Analysis — run the complete Gyre pipeline (Scout → Atlas → Lens → Coach) |
| 5 | **PM** | Start Party Mode |
| 6 | **DA** | Dismiss Agent |

Select by number, code, or fuzzy text match (e.g., "detect" matches DS).

## Workflows

### [DS] Detect Stack

Scans the project filesystem for technology indicators and produces a classified Stack Profile.

- **Output:** `.gyre/stack-profile.yaml` (GC1 contract)
- **When to use:** Starting a new Gyre analysis, or re-detecting after significant project changes

**What Scout detects:**

- Primary language/framework (package.json, go.mod, requirements.txt, Cargo.toml, pom.xml)
- Container orchestration (Dockerfile, docker-compose.yaml, Kubernetes manifests, ECS task definitions)
- CI/CD platform (.github/workflows/, .gitlab-ci.yml, Jenkinsfile)
- Observability tooling (OpenTelemetry, Prometheus, Datadog configs)
- Cloud provider (Terraform, CloudFormation, Pulumi templates)
- Communication protocols (gRPC protos, REST controllers, message queues)

**Guard questions:** After detection, Scout asks up to 3 targeted questions to resolve ambiguities. If detection is unambiguous, guard questions are skipped. You can correct any answer without re-running the full scan.

**Monorepo support:** If Scout detects multiple service boundaries, it asks you to select which service to analyze.

### [FA] Full Analysis

Orchestrates the complete Gyre pipeline across all 4 agents. Scout handles initialization and detection (steps 1-2), then hands off to Atlas, Lens, and Coach in sequence.

- **Output:** Complete `.gyre/` directory with all artifacts
- **When to use:** First time running Gyre on a project, or when you want the full end-to-end experience

**Modes:**

- **Crisis** — No `.gyre/` directory exists. Full pipeline runs from scratch.
- **Anticipation** — Previous analysis exists. Model generation is skipped (capabilities.yaml serves as cache). Only gap analysis and review run.
- **Regeneration** — You explicitly ask to regenerate. Fresh model generation replaces the cached manifest.

## Philosophy

- **Evidence over assumption** — Scout reports what it finds in the filesystem, not what it expects to find. Every classification is backed by a file reference.
- **Categories, not contents** — The Stack Profile records technology categories only. No file contents, paths, version numbers, or secrets ever enter `.gyre/` artifacts.
- **Minimal questions** — Guard questions are derived from detection gaps, not a generic questionnaire. If detection is clean, Scout doesn't waste your time.

## Chat with Scout

Use **[CH]** to discuss stack detection topics:

- "What indicators do you look for to detect Kubernetes?"
- "My project uses both Python and Go — how do you handle that?"
- "Why did you classify my project as AWS when we also use some GCP?"
- "What's the difference between crisis and anticipation mode?"

## Troubleshooting

**Scout can't find my tech stack**

Scout relies on filesystem artifacts (package manifests, config files). If your project uses non-standard locations or custom tooling, use the guard questions to correct the classification manually.

**`.gyre/` directory already exists but I want a fresh start**

Delete the `.gyre/` directory and run **[DS]** or **[FA]** again. Scout will detect crisis mode and run the full pipeline from scratch.

**Multiple stacks detected, wrong one selected as primary**

Scout surfaces secondary stacks as a warning and lets you confirm or override via guard questions. If the wrong stack was selected, correct it in the guard answer — Scout re-classifies without re-scanning.

## Tips

- **Start with Full Analysis [FA] your first time.** It orchestrates the entire pipeline so you see the complete Gyre experience. Use individual workflows once you're familiar.
- **Guard answers matter downstream.** Atlas uses your guard answers to tune the capabilities model. Accurate answers here mean more relevant findings later.
- **Re-detect after major changes.** If you add Kubernetes, switch CI providers, or adopt a new observability stack, re-run **[DS]** to update the Stack Profile before re-analyzing.
- **Privacy is built in.** Scout's Stack Profile contains technology categories only — safe to commit to your repo for team-wide use.

## Credits

- **Agent:** Scout (Stack Detective)
- **Module:** Gyre Pattern v1.0.0
- **Pattern:** Convoke Agent Architecture

---

*Scout finds the facts. Atlas builds the model. Lens finds the gaps. Coach helps you act on them.*
