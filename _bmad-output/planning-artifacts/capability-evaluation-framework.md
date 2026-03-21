# Capability Evaluation Framework

**Version:** 1.0.0
**Date:** 2026-03-21
**Purpose:** Decision tool for determining how new capabilities enter the Convoke ecosystem
**Audience:** Convoke maintainers and consulting team leads evaluating demand signals

---

## Core principle

Every new capability starts at the **lowest viable form factor**. Promote only when evidence demands it. Demote when usage data shows over-engineering.

---

## The three tiers

### Tier 1 — Skill (lowest cost)

A **skill** is a workflow or prompt template added to an existing agent.

**Choose Skill when:**
- The capability can be expressed as a single workflow with clear inputs and outputs
- An existing agent can credibly perform it without diluting their identity
- It doesn't produce artifacts that other agents need to consume through handoff contracts
- It doesn't require its own persistent domain expertise or judgment model

**Cost:** ~1 workflow + step files + menu patch. No new persona, no new handoff contracts.

**Implementation mechanism: Enhance module** (`_bmad/bme/_enhance/`). The Enhance module is the established Convoke pattern for adding capability upgrades to existing agents. Each Tier 1 skill is implemented as an Enhance workflow:
- Workflow entry point (`workflow.md`) + step files (`steps-*/`) + templates
- Menu item patched onto the target agent (`<item exec="...">`)
- Registered in `_enhance/config.yaml`
- Validated by `convoke-doctor` (6-point check)
- See `_bmad/bme/_enhance/guides/ENHANCE-GUIDE.md` for the full pattern

**Examples:**
- Stakeholder communication templates → Enhance workflow on Emma (Contextualization Expert)
- Risk register generation → Enhance workflow on Winston (Architect)
- Sprint retrospective facilitation → Enhance workflow on Max (Learning & Decision Expert)
- Initiatives backlog management → *Already exists* as Enhance workflow on John (PM)

---

### Tier 2 — Agent (medium cost)

An **agent** is a new persona with its own expertise, communication style, and judgment model, added to an existing team.

**Choose Agent when:**
- The capability requires persistent domain expertise that would dilute an existing agent's identity
- It has its own judgment calls — situations where the "right answer" depends on deep specialization
- It produces artifacts, but they feed into an existing team's workflow (no new handoff contract ecosystem)
- A single agent can credibly cover the scope without needing a partner agent

**Cost:** Agent definition file + manifest entry + integration into existing team workflow. No new process model or artifact ecosystem.

**Examples:**
- Post-incident learning facilitator → new agent in Gyre's team
- Data migration profiler → new agent in BMAD's team
- Adoption readiness assessor → new agent in Vortex or BMAD

---

### Tier 3 — Team (highest cost)

A **team** is a group of agents with their own multi-phase process model, handoff contracts, and artifact ecosystem.

**Choose Team when:**
- The capability requires multiple agents with different specializations that hand off to each other
- It has its own multi-phase process — collapsing phases would lose fidelity
- It produces a distinct artifact ecosystem consumed by other teams at defined integration points
- The problem space is deep enough that a single agent would be incoherent trying to cover it
- At least 3 agents are needed, each with genuinely different expertise

**Cost:** Multiple agent definitions + process model + handoff contracts + artifact schemas + integration points with existing teams. Significant design and maintenance investment.

**Implementation mechanism: Enhance framework** (`_bmad/bme/_enhance/` — BMB module, in development). The Enhance framework is a meta-tool that generates new Convoke team modules from templates. It extracts patterns from existing teams (Vortex, Gyre) and scaffolds new teams with: `config.yaml`, agent skeletons, workflow step-files, contract skeletons, registry entries, and installer integration. See `adr-enhance-gyre-build-sequencing.md` for the build sequence and guard rails.

**Build sequence for new teams (per ADR-001):**
1. Complete Vortex discovery (streams 1-7) to validate the problem space
2. Use Enhance to scaffold the module structure
3. Fill in agent personas, workflow content, and contract schemas
4. Validate via `convoke-doctor`

**Examples:**
- Vortex (7 agents, 7-stream discovery process) — hand-crafted, reference module
- Gyre (4 agents, multi-phase readiness assessment) — hand-crafted, reference module
- Forge (5 agents, 5-phase knowledge extraction) — *will be scaffolded by Enhance* (Task 4, ADR-001)

---

## Decision tree

```
A gap is reported from a real project (friction log entry)
│
├─ Can an existing agent handle it with a new skill/workflow?
│   ├─ YES → Ship as SKILL
│   │         Review after 3 engagements for adequacy
│   └─ NO ↓
│
├─ Does it need its own expertise, judgment, and persona?
│   ├─ NO → Revisit framing. Is this really a gap, or a process issue?
│   └─ YES ↓
│
├─ Can ONE agent credibly cover the full scope?
│   ├─ YES → Ship as AGENT in the nearest existing team
│   │         Review after 3 engagements for scope pressure
│   └─ NO ↓
│
├─ Does it need 3+ agents with a multi-phase process model?
│   ├─ YES → Ship as TEAM
│   │         Requires: overlap analysis, handoff contracts, artifact schemas
│   └─ NO → Ship as 2 AGENTS in an existing team
│             with a lightweight internal handoff
│
└─ In ALL cases: run overlap analysis (Gyre pattern) before building
    to ensure clean boundaries with existing scopes
```

---

## Promotion and demotion triggers

The framework is **bidirectional**. Capabilities move up and down based on evidence.

### Promotion triggers (move up a tier)

| From → To | Trigger | Evidence needed |
|-----------|---------|----------------|
| Skill → Agent | Skill feels shallow across 3+ engagements | Friction logs show consultants working around skill limitations |
| Skill → Agent | Skill requires judgment calls the host agent can't credibly make | Consultants report "the agent doesn't understand this domain" |
| Agent → Team | Agent consistently needs a "partner" to complete its work | Artifacts from the agent are incomplete without another agent's input |
| Agent → Team | Agent's scope has grown to cover 3+ distinct sub-domains | The agent's persona is becoming incoherent ("it does everything") |

### Demotion triggers (move down a tier)

| From → To | Trigger | Evidence needed |
|-----------|---------|----------------|
| Team → Agent(s) | 2+ agents in the team have <20% usage across engagements | Usage tracking shows most work concentrates in 1-2 agents |
| Team → Agent(s) | The team's process model is rarely followed end-to-end | Consultants skip phases or use agents out of order |
| Agent → Skill | The agent is invoked <1x per engagement on average | Friction logs show the capability is needed but not at agent depth |
| Agent → Skill | The agent's judgment calls are predictable/templatable | An experienced consultant could get the same result from a checklist |

---

## Overlap analysis template

Before building any Tier 2 or Tier 3 capability, run this analysis against all existing scopes:

```markdown
## Overlap Analysis: [New Scope] vs [Existing Scope]

| [New scope] capability | [Existing scope] coverage | Status |
|------------------------|--------------------------|--------|
| [Capability 1]        | [How existing scope handles it] | Covered / Gap / Partial |
| [Capability 2]        | ...                      | ... |
| ...                    | ...                      | ... |

### Verdict
- Capabilities fully covered by existing scope: [count]
- Genuine gaps that justify the new capability: [count]
- Partial overlaps requiring boundary definition: [count]

### Boundary definition (for partial overlaps)
- [Existing scope] owns: [what]
- [New scope] owns: [what]
- Handoff point: [where one ends and the other begins]
```

**Rule:** If >50% of the new scope's capabilities are already covered, it should be absorbed as skills or agents into the existing scope, not built as a separate scope.

---

## Proof of concept: Sentinel through the framework

### Input: Sentinel scope (from vision document)

**Claimed capabilities:**
1. On-call rotation design and operational cadence
2. Incident command framework and response protocols
3. Post-incident blameless reviews and knowledge extraction
4. Chaos engineering and game days
5. Runbook evolution
6. SLO recalibration from production data

### Step 1: Overlap analysis vs Gyre

| Sentinel capability | Gyre coverage | Status |
|-------------------|---------------|--------|
| On-call rotation design | Not covered — Gyre is pre-launch | **Gap** |
| Incident command framework | Not covered — Gyre doesn't operate in production | **Gap** |
| Post-incident reviews | Not covered — Gyre doesn't learn from runtime | **Gap** |
| Chaos engineering | Gyre Externalize covers pre-launch drills | **Partial** |
| Runbook evolution | Gyre generates initial runbooks | **Partial** |
| SLO recalibration | Gyre sets initial SLOs | **Partial** |

**Verdict:** 3 genuine gaps, 3 partial overlaps. Sentinel has real scope that Gyre doesn't cover.

### Step 2: Decision tree

- Can an existing agent handle it? → No. Production operations require different expertise than readiness assessment.
- Does it need its own persona? → Yes. An "operations-minded" agent thinks differently than a "readiness assessment" agent.
- Can ONE agent cover it? → Let's check the sub-capabilities:
  - On-call design + operational cadence → operational rhythm (1 domain)
  - Incident command + response → crisis management (1 domain)
  - Post-incident reviews + knowledge extraction → learning facilitation (1 domain)
  - Chaos engineering + game days + resilience patterns → hardening (1 domain)

Four distinct domains. But **current demand level is hypothesis** — no friction log entries yet.

### Step 3: Recommendation

**Start as: 1 Agent in Gyre's team** — a "Production Operations" agent that covers post-incident learning (the highest-value capability) and basic operational rhythm setup.

**Promotion path:**
- If 3+ engagements show demand for incident command → promote to 2 agents (learning + response)
- If chaos engineering demand emerges → consider standalone team
- If the single agent's scope becomes incoherent → promote to team

**What NOT to build yet:**
- Full 4-agent team with its own process model (READY→RESPOND→LEARN→HARDEN)
- Dedicated artifact schemas (PIKP, ORD, IRF, RIP)
- Handoff contracts with Forge, Pulse, Compass

**Revisit when:** Real friction log entries from production-stage consulting engagements validate demand for deeper operational support.

---

## How to use this framework

1. **Collect:** Friction logs from consulting engagements (see companion template)
2. **Cluster:** Group friction entries by scope (map to vision document scopes or identify new ones)
3. **Evaluate:** Run each cluster through the decision tree
4. **Analyze:** Run overlap analysis for Tier 2+ capabilities
5. **Build:** Ship at the determined tier
6. **Review:** After 3 engagements, check promotion/demotion triggers
7. **Evolve:** Promote or demote as evidence dictates
