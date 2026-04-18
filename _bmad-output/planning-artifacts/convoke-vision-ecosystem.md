---
initiative: convoke
artifact_type: vision
created: '2026-04-10'
updated: '2026-04-18'
schema_version: 1
---
# Convoke Ecosystem Vision

**Version:** 1.0.0
**Date:** 2026-03-21
**Status:** Vision — not a build commitment
**Context:** IT consultancy for large enterprise brownfield transformations

---

## The question this ecosystem answers

> What do consultants navigating complex enterprise transformations need — from first discovery through sustained operation?

Each scope in the ecosystem answers one question. Only scopes with **validated demand** get full specification. Everything else is a hypothesis tracked via friction logs until real project pull justifies investment.

---

## Ecosystem at a glance

| # | Scope | Code | Question it answers | Status | Form factor |
|---|-------|------|---------------------|--------|-------------|
| 0 | **Vortex** | VTX | Should we build this? | **Shipping** | Team (7 agents) |
| 1 | **Gyre** | GYR | Are we ready for production? | **In development** | Team (4 domains) |
| 2 | **Forge** | FRG | What must we understand first? | **Validated demand** | Team (5 agents, KORE spec) |
| 3 | **Sentinel** | SNT | What do we do when things break? | Hypothesis | TBD — evaluated as agent-in-Gyre |
| 4 | **Ledger** | LDG | Can we prove it to auditors? | Hypothesis | TBD — likely module, not team |
| 5 | **Pulse** | PLS | Will anyone actually use it? | Hypothesis | TBD |
| 6 | **Loom** | LOM | How do we scale team creation? | **Shipping** (v3.2) | Team Factory |
| 7 | **Conduit** | CDT | Can we move the data safely? | Hypothesis | TBD |
| 8 | **Compass** | CMP | Are the right people behind us? | Hypothesis | TBD |

**Form factor is determined per-scope using the Capability Evaluation Framework** (see companion document). Scopes may be realized as skills on existing agents, new agents in existing teams, or full teams — depending on validated demand and complexity.

---

## Lifecycle positioning

> **Note:** This ecosystem previously used a linear lifecycle diagram (Discover → Understand → Build → Ready → Run). That model has been superseded by the **Gravity Model** — a radial constellation where all perimeters orbit a central Evidence Gravity node. See the [Strategic Vision](convoke-vision-original-readme.md) for the full Gravity Model description and its Holling Panarchy theoretical basis.

### Perimeter types

The ecosystem distinguishes **practice perimeters** (domain-specific capabilities that produce and consume evidence) from **infrastructure perimeters** (cross-cutting capabilities that make practice perimeters reliable). Infrastructure ships first — practice perimeters depend on it.

**Practice perimeters:** Vortex (Discovery), Gyre (Readiness), Forge (Knowledge Eng.), Strategy, Delivery, Operations, Security, Growth
**Infrastructure perimeters:** Knowledge Engineering (Forge dual role), Documentation, Entropy Management, Mesh Infrastructure

### Continuous spans

- **Loom** — Team Factory: industrialized creation of new teams, agents, and skills (shipped v3.2)
- **Conduit** — data lifecycle, active during knowledge extraction and build
- **Compass** — stakeholder alignment, continuous
- **Ledger** — audit traceability, active during build and operations
- **Pulse** — adoption & change, active from mid-build through operations

---

## Validated scopes — build queue

### Priority 1: Vortex (Shipping)

**7 agents** | Emma → Isla → Mila → Liam → Wade → Noah → Max

Product discovery through the Innovation Vortex (7 streams). Complete with handoff contracts and feedback routing. The foundation everything else builds on.

### Priority 2: Gyre (In development)

**4 domain agents** | Detection → Observability → Deployment → Compliance & Security

Operational readiness assessment. Answers "are we ready for production?" by analyzing project artifacts and generating capabilities manifests, readiness backlogs, and policy recommendations.

**Gyre absorbs significant scope** from two originally-proposed teams:
- From **Vigil** (eliminated): SLO definition, observability architecture, alert engineering, deployment verification, failure mode analysis, dependency mapping, runbook generation
- From **Ledger** (reduced): regulation discovery, control mapping, policy-as-code, DevSecOps baseline, threat modeling, compliance drift monitoring

### Priority 3: Forge (Validated demand — next to build)

**5 agents** | Silo → Rune → Aria → Sage → Warden (KORE Method)

Domain knowledge extraction. Answers "what must we understand first?" Directly addresses the knowledge asymmetry problem in enterprise consultancy — consultants land in a client environment and need to rapidly extract, codify, and validate tribal knowledge.

**Build priority within Forge:** Phase A (Silo + Rune) first — these address the acute pain of knowledge discovery in engagement weeks 1-4.

**Key integration:** Forge's knowledge assets feed directly into Gyre's contextual model (tribal knowledge → SLO inputs, regulatory constraints → compliance agent).

---

## Hypothesis scopes — one-page briefs

Each scope below is a hypothesis. It remains a brief until real project friction validates demand. When demand is validated, the scope is evaluated through the Capability Evaluation Framework to determine form factor (skill, agent, or team).

### Sentinel — Incident lifecycle

**Question:** What do we do when things break?
**Gap it fills:** Gyre designs operational readiness; Sentinel operates within it when incidents occur.
**Key capabilities:** Incident command, post-incident learning, chaos engineering, on-call design, SLO recalibration.
**Gyre boundary:** Gyre is design-time, Sentinel is runtime. Gyre generates artifacts (SLOs, alerts, runbooks); Sentinel operationalizes and evolves them.
**Evaluation result:** See companion framework document — evaluated as likely 1 agent in Gyre (post-incident learning), not a standalone team.

### Ledger — Audit & traceability

**Question:** Can we prove it to auditors?
**Gap it fills:** Gyre discovers compliance requirements and generates policies; Ledger enforces during dev and generates audit evidence.
**Key capabilities:** Dev-time policy enforcement, requirement-to-code traceability, audit evidence assembly, exception management.
**When needed:** Regulated industries (banking, healthcare, public sector).
**Evaluation status:** Pending — likely a module or 1-2 agents, not a full team.

### Pulse — Adoption & change management

**Question:** Will anyone actually use it?
**Gap it fills:** Technical readiness ≠ organizational readiness. Pulse covers the human adoption side.
**Key capabilities:** Stakeholder sentiment sensing, change narrative shaping, training & enablement, adoption embedding, sustainability.
**When needed:** Large brownfield transformations where end-user adoption is the primary risk.

### Loom — Team Factory (SHIPPED)

> **Status update (2026-04-18):** Loom shipped in v3.2.0 as the Team Factory — a guided orchestration layer for creating new BMAD-compliant teams. Validated on Vortex and Gyre. Awaiting Forge Gate 1 for next validation. See [Team Factory Vision](../../_bmad-output/vortex-artifacts/loom-vision-2026-03-21.md).

**Original question:** Who decides what, when?
**What it became:** How do we scale team creation?
**Capabilities delivered:** Guided team composition, agent scope definition with overlap detection, contract design, integration wiring, spec persistence for resume/express mode.
**Note:** The original "human-agent orchestration" question (agent autonomy rules, escalation protocols) remains an open design question for when multiple teams are active on the same engagement. This may resurface as a governance concern in Wave 2.

### Conduit — Data lifecycle & migration

**Question:** Can we move the data safely?
**Gap it fills:** Data migration is a distinct discipline from application development.
**Key capabilities:** Data profiling, schema mapping, transformation rules, verification, cutover planning.
**When needed:** Brownfield projects involving significant data migration.

### Compass — Stakeholder alignment

**Question:** Are the right people behind us?
**Gap it fills:** Political navigation, coalition building, and organizational change in large enterprises.
**Key capabilities:** Stakeholder mapping, coalition building, progress narrative, sustained alignment.
**When needed:** New corporate client engagements where organizational politics are a delivery risk.

---

## Cross-scope integration model

Integration follows a **demand-pull** pattern, not a mesh. Connections are activated only when both scopes are active on the same project.

**Validated integrations (design now):**
- Vortex → Forge: discovery scope feeds knowledge extraction priorities
- Forge → Gyre: knowledge assets feed contextual model (TKAs → SLO inputs, RCAs → compliance input)
- Forge → BMAD: domain knowledge informs architecture and development
- Gyre → BMAD: readiness findings inform development priorities

**Hypothetical integrations (design when activated):**
- Gyre → Sentinel: readiness artifacts operationalized in production
- Sentinel → Forge: incident findings create new knowledge assets
- Forge → Conduit: glossary and business rules inform data migration
- Ledger → Gyre: enforcement of Gyre-generated policies during dev
- All → Compass: progress signals for stakeholder narrative

---

## How this ecosystem grows

1. **Friction logs** from real consulting engagements capture demand signals
2. **Capability Evaluation Framework** determines form factor (skill → agent → team)
3. **Overlap analysis** (Gyre pattern) ensures clean boundaries before building
4. **Promotion/demotion** keeps form factors right-sized as usage data accumulates
5. **Team Factory (Loom)** — industrialized scaffolding of new teams through a guided workflow that enforces architectural thinking and produces complete integration (shipped v3.2)
6. **Marketplace distribution** — Convoke is listed in the BMAD marketplace, enabling discovery and installation through the community module browser (formalized in Convoke 4.0, Epic 3)
7. **Skill portability** — individual skills exportable to standalone LLM-agnostic format with platform adapters (Claude Code, Copilot, Cursor), lowering the barrier from "install the framework" to "copy one skill"
8. **Gravity Check protocol** — structured reassessment after each wave ships: evidence review, plan validation, assumption check, WIP check, entropy check, resource check (see [Lifecycle Expansion Plan](convoke-note-lifecycle-expansion-plan.md))

See companion documents:
- **[Strategic Vision](convoke-vision-original-readme.md)** — Gravity Model, Panarchy basis, three strategic pillars
- **[Lifecycle Expansion Plan](convoke-note-lifecycle-expansion-plan.md)** — wave structure, gravity checks, resource model
- **[Skill Portability Vision](convoke-vision-skill-portability.md)** — cross-platform distribution strategy
- **[Team Factory Vision](../../_bmad-output/vortex-artifacts/loom-vision-2026-03-21.md)** — scaling team creation
- **Capability Evaluation Framework** — decision tree for form factor selection
- **Forge Phase A Epic** — Silo + Rune build plan
- **Forge↔Gyre Handoff Contract** — integration specification
- **Friction Log Template** — demand capture tool for consulting teams

---

## Current initiative: v6.3 Adoption (Convoke 4.0)

Convoke 4.0 aligns the platform with BMAD Method v6.3.0. This is infrastructure work that benefits all current and future perimeters:

- **Config-loader migration** — replaces deprecated `bmad-init` with direct YAML loading (FR1-FR11)
- **Marketplace distribution** — `.claude-plugin/marketplace.json` for community discovery (FR19-FR25)
- **BMM dependency governance** — scan tool and registry for custom skill compatibility (FR12-FR18)
- **Agent consolidation** — Bob/Quinn/Barry consolidated into upstream Amelia (FR26-FR30)
- **Behavioral equivalence validation** — PF1 LLM-as-judge battery proving upgrade safety (FR36-FR40)

5 sprints, 28 stories, 50 functional requirements. See [Epic Breakdown](convoke-epic-bmad-v6.3-adoption.md).

---

## Open questions

1. **Gyre→Sentinel boundary:** Should post-incident learning be a Gyre agent or a standalone agent? (Evaluation framework suggests: Gyre agent first, promote if demand warrants.)
2. **Ledger viability:** Is audit traceability a standalone scope or a BMAD module? (Depends on regulated-industry engagement frequency.)
3. **Installer UX:** How do users install individual scopes? Start small, grow into the ecosystem.
4. **Agent naming:** Deconfliction pass needed before any new scope ships (Sentinel's "Forge" agent → "Temper", Conduit's "Flux" → check collisions).
5. **Gyre's future agents vs. separate scopes:** Capacity & FinOps — Gyre v3 agent or Sentinel/separate scope?
