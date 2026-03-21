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
| 6 | **Loom** | LOM | Who decides what, when? | Hypothesis | TBD |
| 7 | **Conduit** | CDT | Can we move the data safely? | Hypothesis | TBD |
| 8 | **Compass** | CMP | Are the right people behind us? | Hypothesis | TBD |

**Form factor is determined per-scope using the Capability Evaluation Framework** (see companion document). Scopes may be realized as skills on existing agents, new agents in existing teams, or full teams — depending on validated demand and complexity.

---

## Lifecycle positioning

```
  DISCOVER          UNDERSTAND          BUILD            READY           RUN
 ┌─────────┐      ┌─────────┐      ┌──────────┐    ┌──────────┐   ┌──────────┐
 │ Vortex  │─────▶│  Forge  │─────▶│   BMAD   │───▶│  Gyre    │──▶│ Sentinel │
 │  (VTX)  │      │  (FRG)  │      │  + TEA   │    │  (GYR)   │   │  (SNT)   │
 └─────────┘      └─────────┘      └──────────┘    └──────────┘   └──────────┘
   Shipping         Validated        Existing        In dev         Hypothesis
```

**Lifecycle spans (when active):**
- **Loom** — human-agent orchestration rules, continuous meta-layer
- **Conduit** — data lifecycle, active during Understand → Build
- **Compass** — stakeholder alignment, continuous
- **Ledger** — audit traceability, active during Build → Run
- **Pulse** — adoption & change, active from mid-Build through Run

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

### Loom — Human-agent orchestration

**Question:** Who decides what, when?
**Gap it fills:** As agent count grows, rules are needed for which agents can act autonomously vs. which escalate to humans.
**Key capabilities:** Orchestration chartering, boundary definition, escalation protocols, rule evolution.
**When needed:** When multiple teams are active on the same engagement.

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

See companion documents:
- **Capability Evaluation Framework** — decision tree for form factor selection
- **Forge Phase A Epic** — Silo + Rune build plan
- **Forge↔Gyre Handoff Contract** — integration specification
- **Friction Log Template** — demand capture tool for consulting teams

---

## Open questions

1. **Gyre→Sentinel boundary:** Should post-incident learning be a Gyre agent or a standalone agent? (Evaluation framework suggests: Gyre agent first, promote if demand warrants.)
2. **Ledger viability:** Is audit traceability a standalone scope or a BMAD module? (Depends on regulated-industry engagement frequency.)
3. **Installer UX:** How do users install individual scopes? Start small, grow into the ecosystem.
4. **Agent naming:** Deconfliction pass needed before any new scope ships (Sentinel's "Forge" agent → "Temper", Conduit's "Flux" → check collisions).
5. **Gyre's future agents vs. separate scopes:** Capacity & FinOps — Gyre v3 agent or Sentinel/separate scope?
