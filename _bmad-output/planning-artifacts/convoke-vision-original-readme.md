---
initiative: convoke
artifact_type: vision
created: '2026-04-10'
updated: '2026-04-18'
schema_version: 1
---
# Convoke Strategic Vision

**Version:** 2.0.0
**Date:** 2026-04-18
**Status:** Vision — not a build commitment
**Context:** IT consultancy for large enterprise brownfield transformations
**Supersedes:** Original Convoke README vision (4-framework integration model, 2026-02)

---

## The problem

Linear lifecycle models fail in three ways that compound each other:

1. **Building in the wrong direction.** Teams optimize for delivery speed without structured discovery. The result: beautifully engineered products that nobody needs. Industry data puts feature failure rates at 37% or higher — not because teams can't build, but because they build before validating what to build.

2. **Silent decay.** Lehman's laws of software evolution tell us that every system increases in complexity unless active work is done to reduce it. Cognitive debt accumulates in teams. Architectural entropy creeps into codebases. Most frameworks pretend this isn't happening. By the time decay surfaces, it's a crisis.

3. **Adoption resistance.** Good frameworks die not because they're wrong, but because teams can't adopt them without disruption. Governance is deferred to "later." Later never comes. The framework sits unused while the problems it solves persist.

These three failures feed each other: teams build the wrong thing, the wrong thing decays, and the framework that could have prevented both never gets adopted.

---

## The paradigm shift: Evidence Gravity

Traditional product lifecycle models are linear — discover, design, build, ship, maintain. Reality doesn't move in lines. Markets shift mid-build. Assumptions decay silently. Teams loop back but the model doesn't.

Convoke replaces the linear model with the **Gravity Model**: a radial constellation where every practice and infrastructure capability orbits a central force — **evidence**.

```
                        EVIDENCE
                        GRAVITY
                           ●
                      ╱    │    ╲
                 ╱         │         ╲
            ╱              │              ╲
    ┌──────────┐    ┌──────────┐    ┌──────────┐
    │ Discovery│    │ Readiness│    │ Delivery │
    │ (Vortex) │    │  (Gyre)  │    │          │
    └──────────┘    └──────────┘    └──────────┘
            ╲              │              ╱
                 ╲         │         ╱
                      ╲    │    ╱
                    ┌──────────┐
                    │Operations│
                    └──────────┘

    ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─
    Infrastructure perimeters (the stage):
    Knowledge Eng. · Documentation ·
    Entropy Mgmt. · Mesh Infrastructure
```

Nothing moves in a fixed sequence. Everything pulls toward evidence. A production signal can route directly back to discovery. A knowledge gap can trigger readiness reassessment. The gravity model governs priority — evidence shifts what matters, not a predetermined plan.

### Theoretical basis: Holling Panarchy

The Gravity Model is grounded in the **Holling Panarchy** — an adaptive cycle observed in every complex system, from ecosystems to economies:

- **r (Growth)** — rapid expansion, discovery, experimentation
- **K (Conservation)** — stabilization, optimization, increasing efficiency but also increasing rigidity
- **Ω (Release)** — disruption, breakdown of rigid structures, creative destruction
- **α (Reorganization)** — recombination, learning, renewal

Most frameworks design for the growth phase only. Convoke supports all four — because every product, every team, and every organization will pass through every one of them. The gravity model ensures that evidence from any phase can pull resources and attention to where they're needed, regardless of where the plan says you "should" be.

---

## Infrastructure vs practice

The Gravity Model distinguishes two types of perimeters that orbit the evidence center:

### Practice perimeters (the performance)

These are the domain-specific capabilities that do the work:

- **Discovery** (Vortex) — structured product discovery through 7 streams
- **Readiness** (Gyre) — production readiness assessment across 4 domains
- **Knowledge Engineering** (Forge) — domain knowledge extraction for brownfield contexts
- **Delivery, Operations, Security, Growth** — future practice perimeters, activated by demand

Practice perimeters produce and consume evidence. They are the reason the system exists.

### Infrastructure perimeters (the stage)

These are the cross-cutting capabilities that make practice perimeters reliable:

- **Knowledge Engineering** — extraction, codification, and validation of domain knowledge (Forge serves both roles)
- **Documentation** — systematic documentation strategy across the lifecycle
- **Entropy Management** — staleness detection, drift monitoring, decay scoring across all artifacts
- **Mesh Infrastructure** — contracts, routing, and integration between perimeters

Infrastructure perimeters don't produce user-visible value directly. They ensure that practice perimeters don't operate on quicksand. Without them, every practice perimeter's outputs silently decay.

The distinction matters for presentation, for governance, and for build priority: infrastructure ships first (Wave 0), because practice perimeters depend on it.

---

## Three strategic pillars

### 1. Coverage — full lifecycle, expanding constellation

Every gap in the product lifecycle is a place where assumptions hide unchallenged. Convoke doesn't patch gaps — it eliminates them through an expanding constellation of specialized teams:

| Team | Domain | Status |
|------|--------|--------|
| **Vortex** | Product discovery (7 agents, 22 workflows) | Shipping |
| **Gyre** | Production readiness (4 agents, 7 workflows) | Shipping |
| **Forge** | Domain knowledge extraction (KORE method) | Validated demand |
| **Strategy** | Strategic analysis and positioning | Wave 0 discovery |
| **Delivery** | Release engineering and progressive delivery | Wave 1 |
| **Operations** | Incident lifecycle and SRE workflows | Wave 1 |
| **Security** | Threat modeling and DevSecOps | Wave 1 |

Each team answers one question. Only teams with validated demand get built. Everything else remains a hypothesis tracked via friction logs until real consulting engagement pull justifies investment. This is the **demand-pull pattern** — the constellation grows because evidence demands it, not because a roadmap says so.

### 2. Industrialization — engineered process, not artisanal craft

Every other framework says "be agile, figure it out." Convoke says: we've engineered the process.

**Team Factory (Loom):** A guided workflow for creating new agent teams that enforces architectural thinking before file generation. Every addition goes through structured discovery, produces complete integration (registry, config, contracts), and matches native team quality. The factory is how the constellation scales without losing coherence.

**Asymmetric Port Maturity (L0→L4):** Not every team or ops module in an organization is at the same maturity. Forcing a single operating model creates friction, resistance, and shadow processes. The maturity graduation model meets each module where it is:

- **L0** — Ad hoc
- **L1** — Aware (advisory)
- **L2** — Practicing
- **L3** — Measured
- **L4** — Optimized

Teams graduate at their own pace. No team is left behind. No team is held back.

**Formal Contracts:** Agent teams don't just run in parallel — they hand off work through formal contracts. Vortex has 10 handoff contracts (5 forward flows, 5 feedback routes). When production intelligence reveals a market shift, it routes back to the right discovery stream automatically. This is not coordination by convention — it's coordination by contract.

### 3. Anti-entropy — fighting decay as a design principle

Lehman's laws of software evolution are empirical, not theoretical. Every system increases in complexity unless active work is done to reduce it. Convoke treats entropy as a **cross-cutting force** — detected across every perimeter, measured, and actively fought.

**Three forms of entropy Convoke addresses:**

- **Artifact entropy** — discovery outputs, readiness assessments, knowledge assets all have a half-life. Staleness detection protocols assign confidence decay per artifact type.
- **Cognitive entropy** — teams accumulate implicit knowledge that isn't codified. The Knowledge Engineering perimeter (Forge) extracts and validates tribal knowledge before it's lost.
- **Architectural entropy** — systems rigidify (Panarchy K-phase). Complexity creeps in. Drift monitoring compares current state against baseline assumptions.

Entropy management isn't a feature — it's a design principle. It appears in the Knowledge Engineering flow, in the Gravity Check protocol that reassesses priorities after each wave, and in the structural principles that govern how perimeters interact.

---

## Governance from Wave 0

Most frameworks defer governance to "when we're ready." By then, adoption patterns are calcified and resistance is entrenched.

Convoke embeds governance principles from Wave 0 — before the first practice perimeter ships:

- **Fogg's Tiny Habits** — behavioral change must be small enough to stick. New capabilities are introduced as minimal additions to existing workflows, not wholesale replacements.
- **Rogers' Diffusion** — adoption sequences through innovators and early adopters first. The framework doesn't demand organization-wide change on day one.
- **Edmondson's Psychological Safety** — it must be safe to try and fail with new capabilities. Agent autonomy follows the Cynefin framework: clear contexts get autonomous agents, complex contexts require human-in-the-loop.

These principles are active from the start as a design lens — a checklist that every new perimeter must satisfy. The full Governance & Change perimeter, with dedicated agents for change architecture, adoption facilitation, and transformation assessment, graduates in Wave 2. But the principles don't wait.

---

## BMAD + Convoke

BMAD Method provides world-class software delivery — from requirements through architecture to working code. It is an engine of exceptional build capability.

Convoke provides everything that surrounds that engine:

- **Before build:** Structured discovery so you know what to build (Vortex)
- **Alongside build:** Production readiness so you know you can ship it (Gyre), domain knowledge so you understand the context (Forge)
- **After build:** Entropy management so what you shipped doesn't silently decay
- **Across the lifecycle:** Governance so adoption actually happens, industrialization so the process scales

The relationship is complementary by design:

> BMAD builds the thing right. Convoke makes sure you're building the right thing — and that it stays right.

Convoke works standalone or as an extension. No BMAD Method installation required. But together, they provide complete lifecycle coverage from first hypothesis to sustained operation.

---

## Growth mechanisms

Four mechanisms drive the constellation's expansion:

1. **Demand-pull activation** — friction logs from consulting engagements capture demand signals. Only validated demand triggers perimeter build. The Gravity Check protocol reassesses priorities after each wave ships.

2. **Team Factory (Loom)** — industrialized team creation. New teams are scaffolded through a guided workflow that enforces architectural thinking, produces complete integration, and matches native quality. The factory shipped in v3.2 and has been validated on two teams (Vortex, Gyre).

3. **Marketplace distribution** — Convoke is listed in the BMAD marketplace (`.claude-plugin/marketplace.json`), enabling discovery and installation through the community module browser. New users find Convoke alongside other BMAD extensions.

4. **Skill portability** — any BMAD skill can be exported to a standalone, LLM-agnostic format with platform adapters for Claude Code, GitHub Copilot, and Cursor. This lowers the barrier from "install the whole framework" to "copy one skill."

---

## Current state

| Layer | What | Status |
|-------|------|--------|
| **Shipping** | Vortex (discovery), Gyre (readiness), Team Factory, Skill Portability, Enhance (agent skills) | v3.2.0 |
| **In progress** | v6.3 adoption (Convoke 4.0) — config-loader migration, marketplace distribution, BMM governance, behavioral equivalence validation | 5 sprints, 28 stories |
| **Validated demand** | Forge (knowledge engineering) — 9 discovery artifacts complete, awaiting Gate 1 shadow engagement | Wave 0 |
| **Wave 0 discovery** | Strategy perimeter (self-discovery protocol), entropy monitoring baseline, governance lens | Parallel tracks |
| **Wave 1 (default)** | Delivery, Operations, Security perimeters | After Wave 0 ships |
| **Wave 2+** | Growth, Documentation, full Governance perimeter | Evidence-driven |

The ecosystem vision document maps all scopes. The lifecycle expansion plan governs sequencing. This document provides the strategic rationale — the *why* behind the *what*.

---

## See also

- **[Ecosystem Vision](convoke-vision-ecosystem.md)** — scope map of all teams and their relationships
- **[Lifecycle Expansion Plan](convoke-note-lifecycle-expansion-plan.md)** — wave structure, gravity checks, resource model
- **[Skill Portability Vision](convoke-vision-skill-portability.md)** — cross-platform distribution strategy
- **[Team Factory Vision](../../_bmad-output/vortex-artifacts/loom-vision-2026-03-21.md)** — scaling team creation

---

*This document captures the strategic direction of Convoke as of 2026-04-18. It is governed by the Gravity Model: evidence shifts priority, not the plan. The lifecycle expansion plan operationalizes this vision into waves and gates.*
