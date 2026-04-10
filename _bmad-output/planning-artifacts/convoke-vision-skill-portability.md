# Skill Portability & Distribution Vision

**Version:** 1.0.0
**Date:** 2026-04-06
**Status:** Vision — not a build commitment
**Initiative Level:** Convoke (platform)
**Origin:** Party mode session — Winston (Architect) + Paige (Tech Writer)

---

## The problem this solves

> Consultants new to agentic software steering find the full BMAD/Convoke ecosystem too complex. They need individual skills they can drop into their own projects — regardless of which AI coding tool they use (Claude Code, GitHub Copilot, Cursor, Windsurf, Aider).

### Pain points observed

1. **Discovery** — 90+ skills, no way to find "the one I need" without knowing the framework
2. **Complexity barrier** — Full `convoke-install` is intimidating when you just want a code review skill
3. **Platform lock-in** — Skills are Claude Code-specific; teammates on Copilot/Cursor can't use them
4. **Manual extraction cost** — Amalik spends hours hand-extracting skills for each colleague request

---

## Solution shape

Three deliverables that build on each other:

### 1. Skill Catalog (discovery)

An intent-based, browsable menu that answers "what can I use?" in under 60 seconds.

**Organized by user intent, not module:**

> **What are you trying to do?**
> - Think through a problem --> Brainstorming, Design Thinking, Problem Solving
> - Define what to build --> Product Brief, PRD, UX Design
> - Review something --> Code Review, Adversarial Review, Editorial Review
> - Write documentation --> Tech Writer, Project Docs
> - Plan your work --> Sprint Planning, Story Creation, Epics
> - Test your code --> Test Design, Test Automation, ATDD
> - Discover product-market fit --> Vortex agents (7-stream pipeline)
> - Assess production readiness --> Gyre agents (4-domain assessment)

Each entry includes: one-line description, agent persona name, tier (standalone / light-deps / pipeline), what it produces.

### 2. Skill Exporter (packaging)

CLI command that transforms any installed skill into a portable, LLM-agnostic format.

**Command:** `convoke export <skill-name> [--platform <platform>] [--all] [--tier 1,2]`

**Export logic by tier:**

| Tier | Description | Export complexity | Example skills |
|------|-------------|-------------------|----------------|
| **1 — Standalone** | Agent persona + instructions, no external deps | Copy + strip framework refs | All CIS agents, editorial reviews, adversarial review, elicitation |
| **2 — Light deps** | Needs templates or config defaults | Copy + inline templates + minimal config | Code review, PRD creation, product brief, TEA skills |
| **3 — Pipeline** | Depends on prior artifacts or chained skills | Export chain together or document prerequisites | Dev story, sprint planning, WDS phases, Vortex stream agents |

**Export process:**
1. Parse the skill's dependency graph (agent file, workflow steps, templates, sidecars)
2. Merge steps into single instruction flow (for platforms without micro-file support)
3. Decouple — replace `bmad-init` config reads with inline defaults, replace Claude-specific tool names with generic verbs
4. Generate platform-specific adapter wrappers

### 3. Standalone Skills Repository (distribution)

A separate GitHub repo (`convoke-skills-catalog`) containing ready-to-use exported skills. Zero barrier to entry — no npm install, no CLI, just browse and copy.

**Structure:**

```
convoke-skills-catalog/
  README.md                    <-- decision-tree catalog
  brainstorming/
    README.md                  <-- what, why, who (Carson), how to install per platform
    instructions.md            <-- LLM-agnostic canonical format
    adapters/
      claude-code/             <-- .claude/skills/ wrapper
      copilot/                 <-- .github/copilot-instructions.md snippet
      cursor/                  <-- .cursor/rules/ wrapper
  code-review/
    ...
  prd-creation/
    ...
```

---

## Canonical format: LLM-agnostic markdown

The core insight: existing BMAD skills are already ~90% LLM-agnostic. The persona, instructions, workflow logic, and templates are plain markdown prose. Only thin platform wrappers differ.

**`instructions.md` — the single source of truth per skill:**
- No Claude-specific tool names (use generic verbs: "read the file at..." not "use Read tool on...")
- No framework references (`bmad-init`, manifest lookups)
- No micro-file `Load step:` conventions (steps inlined)
- Self-contained: persona + context + workflow + templates in one file

**Platform adapters are thin transformations:**

| Platform | Format | Location |
|----------|--------|----------|
| Claude Code | SKILL.md + workflow.md + steps/ | `.claude/skills/<name>/` |
| GitHub Copilot | Single instructions block | `.github/copilot-instructions.md` or custom |
| Cursor | Rule file | `.cursor/rules/<name>.md` |
| Windsurf | Rule file | `.windsurfrules` |
| Aider | Conventions file | `.aider/conventions.md` |

---

## Portability tier classification

**Tier 1 — Standalone (ready today with minimal work):**
- CIS agents: Carson (brainstorming), Dr. Quinn (problem solving), Maya (design thinking), Victor (innovation), Sophia (storytelling), Caravaggio (presentations)
- Reviews: adversarial review, edge case hunter, editorial prose, editorial structure
- Utility: advanced elicitation, distillator

**Tier 2 — Light dependencies (need template inlining):**
- BMM workflows: product brief, create PRD, create UX design, create architecture
- Code review (needs review structure)
- TEA skills: test design, test review, ATDD, NFR assessment
- Documentation: document project, generate project context

**Tier 3 — Pipeline skills (require chain or prerequisite artifacts):**
- Dev story (needs story file from SM)
- Sprint planning / sprint status (needs epics)
- WDS phases (sequential pipeline, phases 0-8)
- Vortex agents (handoff contracts between 7 streams)
- Gyre agents (4-step sequential assessment)

---

## What already exists that we leverage

| Asset | Location | Use |
|-------|----------|-----|
| Skill manifest | `_bmad/_config/skill-manifest.csv` | Skill metadata, paths |
| Agent manifest | `_bmad/_config/agent-manifest.csv` | Persona data, communication style |
| Workflow manifest | `_bmad/_config/workflow-manifest.csv` | Workflow paths |
| Taxonomy | `_bmad/_config/taxonomy.yaml` | Initiative/team classification |
| Existing CLI infrastructure | `scripts/` | Pattern for new CLI commands |

**New metadata needed:**
- Tier classification per skill (standalone / light-deps / pipeline)
- Intent category per skill ("I need to..." grouping)
- Dependency list per skill (templates, configs, other skills)
- Platform compatibility notes (features requiring tool-specific behavior)

---

## Implementation sequence

| Phase | What | Value delivered |
|-------|------|----------------|
| 1 | Classify all skills: add tier + intent + dependency metadata to manifests | Foundation for everything else |
| 2 | Build Tier 1 exporter: copy + strip framework refs | First batch of portable skills |
| 3 | Generate catalog README from manifest data | Teammates can browse and discover |
| 4 | Seed `convoke-skills-catalog` repo with Tier 1 exports | Teammates get skills by copy-paste |
| 5 | Add Tier 2 export: template inlining, config defaults | Broader skill coverage |
| 6 | Add platform adapters (Copilot, Cursor, Windsurf) | Multi-platform support |
| 7 | Automate: CI/CD pipeline regenerates catalog repo on Convoke release | Stays in sync automatically |

**Teammates get value at Phase 4.** Everything after is refinement.

---

## Risks and open questions

1. **Skill quality without BMAD runtime** — Some skills rely on `bmad-init` to load project context. Standalone versions lose that intelligence. Mitigation: inline sensible defaults, add a "for best results, also set up..." section.
2. **Drift between source and exports** — Catalog repo could fall behind main Convoke repo. Mitigation: Phase 7 automation.
3. **Tier 3 portability** — Pipeline skills may not make sense standalone. Decision: document prerequisites clearly rather than force standalone packaging.
4. **Platform adapter maintenance** — Each new AI tool adds an adapter to maintain. Mitigation: canonical format means adapters are thin and mechanical.
5. **Naming** — "Shelf"? "Catalog"? "Skills Market"? To be decided.

---

## Success criteria

- A consultant new to agentic tools can find a relevant skill in < 60 seconds via the catalog
- A Tier 1 skill can be installed in any supported platform in < 2 minutes (copy-paste)
- Amalik spends < 5 minutes per skill extraction request (vs hours today)
- At least 15 skills available as standalone exports in first release
- Works with Claude Code, GitHub Copilot, and Cursor at minimum
