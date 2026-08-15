# Convoke Agents — Lifecycle Expansion Vision

> Theoretical foundations for extending Convoke to cover the full product/software lifecycle,
> including the organizational transformation that agentic AI adoption requires.
>
> **Author:** Amalik Amriou — Agentic Product Lead
> **Date:** March 2026
> **Status:** Exploratory / Pre-specification

---

### What This Document Is — and Isn't

This is a map of the possible, not a commitment to build. It captures intellectual work grounded in two sources: established theory and direct consulting experience in large organizations. No perimeter names are final. No agent counts are targets. No sequencing is prescribed.

The document's purpose is to give Convoke a coherent perspective on what full-lifecycle agentic coverage *could* look like — so that when specific perimeters move from exploration to commitment, they do so within a shared architectural frame rather than in isolation.

For the full theoretical foundations behind each perimeter, see the companion [Theoretical Foundations](lifecycle-expansion-references.md) document. This vision document contains the ideas, principles, and architecture; the companion provides depth.

---

## Table of Contents

1. [Five Structural Principles](#1-five-structural-principles)
2. [The Gravity Model](#2-the-gravity-model)
3. [Lifecycle Perimeters: Gap Analysis](#3-lifecycle-perimeters-gap-analysis)
4. [Knowledge Engineering](#4-knowledge-engineering-from-documentation-to-knowledge-assets)
5. [Domain Mesh: A Reference Pattern](#5-domain-mesh-a-reference-pattern-for-projects)
6. [Entropy as a Cross-Cutting Force](#6-entropy-as-a-cross-cutting-force)
7. [Organizational Transformation](#7-organizational-transformation)
8. [Synthesis: The Three-Axis Architecture](#8-synthesis-the-three-axis-architecture)
9. [Open Questions](#9-open-questions)
10. [Appendix A: Current Coverage Detail](#appendix-a-current-coverage-detail)

---

## 1. Five Structural Principles

These principles are the thesis of this document. Each one emerged from the intersection of established theory and field experience — not as an architectural ideal, but as a lesson about what happens when the alternative is tried.

**1. The lifecycle is a gravity model, not a pipeline.** Not because pipelines are theoretically wrong, but because organizations that treat their lifecycle as sequential consistently fail to respond when evidence demands a phase shift. Perimeters activate based on the current state of evidence and risk, not a predetermined sequence.

**2. Infrastructure perimeters must be built before practice perimeters.** Not because infrastructure is more important, but because practice perimeters built without accessible knowledge, systematic documentation, or entropy monitoring operate on quicksand. The category distinction — infrastructure enables, practice prescribes — determines dependencies.

**3. Entropy is a cross-cutting force, not a lifecycle endpoint.** Not because sunset and technical debt don't deserve their own perimeter, but because artifact degradation doesn't wait for end-of-life. Every perimeter's outputs have a half-life. The question is whether degradation is detected before it causes harm.

**4. Domain mesh ports mature asymmetrically.** Not because symmetric interfaces are wrong in theory, but because forcing full capability from day one leads organizations to build premature automation they can't sustain. Domains start with advice, graduate to assessment, then build tooling, then monitor outcomes — matching how real consulting practices mature.

**5. The governance and change management lens is active from Wave 0.** Not because governance is the most urgent capability, but because every transformation failure is traceable to adoption being treated as an afterthought. The principles — smallest useful entry point, expected resistance patterns, behavioral nudges — must inform perimeter design from the start.

---

## 2. The Gravity Model

The diagram below maps Convoke's current coverage against lifecycle perimeters. It is tempting to read these left-to-right as a pipeline. But Vortex already proved that discovery is non-linear — its compass routing system moves between streams based on evidence, not sequence. If discovery isn't a pipeline, why would the macro lifecycle be one?

A production incident doesn't "flow forward" — it pulls gravity back toward readiness, or even toward discovery if it reveals a fundamental misunderstanding of user needs. A market shift doesn't wait for the current build to finish — it pulls gravity toward strategy.

> **Gravity model principle:** Perimeters don't have a fixed sequence — they have gravitational pull based on the current state of evidence and risk. Early in a product's life, strategy and discovery pull hardest. As you approach production, readiness and delivery dominate. Post-launch, growth and operations take over. But at any point, new evidence can shift gravity back.

**Theoretical grounding:** This mirrors Holling's Panarchy model (Holling, 2001) — systems cycle through exploitation, conservation, release, and reorganization, and the current phase determines which forces dominate. It also draws on Snowden's Cynefin framework — complex systems don't follow predetermined paths; they respond to probes and emerging patterns.

```
                        CURRENT COVERAGE (gravity model — not a pipeline)
                        ===================================================

                            +-------------------------------------+
                            |        EVIDENCE & RISK STATE        |
                            |    (determines gravitational pull)   |
                            +--------------+----------------------+
                                           |
             +---------+----------+--------+--------+----------+---------+
             v         v          v        v        v          v         v
         Strategy   Discovery   Design   Build   Readiness  Delivery  Growth
         +------+  +--------+  +-----+  +-----+  +-------+  +------+  +------+
         | GAP  |  | VORTEX |  | WDS |  | BMM |  | GYRE  |  | GAP  |  | GAP  |
         |      |  | 7 agts |  | BMM |  | TEA |  | 4 agts|  |      |  |      |
         +------+  +--------+  +-----+  +-----+  +-------+  +------+  +------+
             +---------+----------+
             v         v          v
         Operations  Sunset    Creative/Ext
         +--------+  +------+  +---------+
         |  GAP   |  | GAP  |  |CIS  BMB |
         |        |  |      |  | Enhance  |
         +--------+  +------+  +---------+

  CROSS-CUTTING:
  +-----------------------------------------------------------------------------+
  | SECURITY & COMPLIANCE (assessed by Gyre, not remediated)                    |
  +-----------------------------------------------------------------------------+
  | DOCUMENTATION & KNOWLEDGE MANAGEMENT (partial, no systematic approach)      |
  +-----------------------------------------------------------------------------+
  | GOVERNANCE, CHANGE MANAGEMENT & ORGANIZATIONAL TRANSFORMATION               |
  +-----------------------------------------------------------------------------+
  | ENTROPY MANAGEMENT (not addressed — see Section 6)                          |
  +-----------------------------------------------------------------------------+
```

### Gap Summary

| Gap | Current State | Impact |
|-----|--------------|--------|
| **Strategy & Vision** | Emma does problem framing, but no strategic positioning, competitive analysis, or business model design | Discovery starts without strategic grounding |
| **Delivery & Release** | TEA designs CI/CD pipelines, Gyre assesses readiness, but no release management or progressive delivery | Gap between "ready" and "live" |
| **Growth & Adoption** | Noah interprets production signals, but no activation, retention, or growth workflows | Post-launch evolution is blind |
| **Operations** | Gyre identifies operational gaps, but no incident management, runbooks, or operational workflows | Readiness without operational follow-through |
| **Sunset & Technical Debt** | Not addressed | No lifecycle end management |
| **Security & Compliance** | Gyre detects gaps, but no threat modeling or DevSecOps workflows | Assessment without remediation |
| **Documentation** | WDS covers design docs, but no systematic documentation strategy | Knowledge loss across lifecycle |
| **Governance & Change** | Not addressed | No framework for governing the transformation itself |

---

## 3. Lifecycle Perimeters: Gap Analysis

For each gap, the table below summarizes the core problem, key theoretical foundations, and potential capabilities. Full reference lists are in the [Theoretical Foundations companion](lifecycle-expansion-references.md), Sections 2-8.

| Perimeter | Core Problem | Key Foundations | Potential Capabilities |
|-----------|-------------|-----------------|----------------------|
| **Strategy & Vision** | Discovery starts without strategic grounding | Porter (Five Forces), Wardley Mapping, Osterwalder (BMC), Rumelt (Good Strategy) | Competitive analysis, business model design, situational awareness |
| **Delivery & Release** | Gap between "ready" and "live" | Continuous Delivery (Humble & Farley), Progressive Delivery (Hodgson), Trunk-Based Development | Release strategy, feature flag management, rollback analysis |
| **Growth & Adoption** | Post-launch evolution is blind | Product-Led Growth (Bush), Pirate Metrics (McClure), Experimentation at Scale (Kohavi) | Funnel analysis, onboarding architecture, retention strategy |
| **Operations & Resilience** | Readiness without operational follow-through | SRE (Beyer et al.), Chaos Engineering (Rosenthal), Learning from Incidents (Woods) | Incident command, runbook engineering, resilience analysis |
| **Security & Compliance** | Assessment without remediation | STRIDE (Shostack), DevSecOps (OWASP), EU AI Act, ISO 42001 | Threat modeling, compliance mapping, supply chain audit |
| **Documentation** | Knowledge loss across lifecycle | Diataxis (Procida), Docs-as-Code (Gentle), ADRs (Nygard), SECI (Nonaka) | Documentation strategy, knowledge curation, learning capture |
| **Sunset & Technical Debt** | No lifecycle end management | Technical Debt (Cunningham), Behavioral Code Analysis (Tornhill), Strangler Fig (Fowler) | Debt analysis, migration planning, sunset coordination |

---

## 4. Knowledge Engineering: From Documentation to Knowledge Assets

The documentation perimeter (Section 3, row 6) handles systematic documentation — capturing what is *explicitly written*. This section addresses a fundamentally different problem: **actively extracting, refining, and exposing knowledge** that is tacit, dispersed, or buried in codebases, documentation, and team expertise.

### The Knowledge Problem

Knowledge in organizations exists on a spectrum from fully explicit (API docs, ADRs) to deeply tacit (why a particular architectural decision was made, what edge cases a senior engineer knows intuitively, what the team learned from a failed experiment three years ago). The challenge is not documentation — it's **knowledge operationalization**: making organizational knowledge extractable, refinable, and consumable as assets.

This is especially critical in brownfield contexts where knowledge is the most valuable and the least accessible asset. Full theoretical foundations: [companion Section 9](lifecycle-expansion-references.md#9-knowledge-engineering).

### The Knowledge Engineering Perimeter (Proposed)

**Purpose:** Actively extract, refine, and expose organizational knowledge as consumable assets — from codebases, existing documentation, and team expertise.

**Distinction from documentation:** Documentation *captures what is produced*. Knowledge engineering *extracts what already exists but isn't accessible*.

```
  KNOWLEDGE SOURCES                  KNOWLEDGE ENG.                KNOWLEDGE CONSUMERS
  +------------------+              +----------+               +----------------------+
  | Codebases        |--extract-->  |          |--expose-->    | Discovery            |
  | Existing docs    |--extract-->  | Extract  |--expose-->    | Build                |
  | Team expertise   |--elicit--->  | Refine   |--expose-->    | Readiness            |
  | Decision history |--mine----->  | Expose   |--expose-->    | Any perimeter/agent  |
  | Incident reports |--extract-->  |          |--expose-->    | Human teams          |
  +------------------+              +----------+               +----------------------+
                                     ^  refine
                                     |  validate
                                     |  structure
                                     +----------
```

**Potential capabilities:**

- **Knowledge mining** — Extracting knowledge from codebases (architecture recovery, dependency mapping, implicit patterns), existing documentation (contradiction detection, staleness analysis), and repository history (decision archaeology, evolution patterns).

- **Knowledge elicitation** — Structuring guided conversations with team members to externalize tacit knowledge: architectural rationale, edge case expertise, tribal knowledge, unwritten rules.

- **Knowledge curation** — Refining raw extracted knowledge into structured, versioned knowledge assets. Maintaining a knowledge graph with provenance. Detecting knowledge decay and contradiction. Exposing assets for consumption by other perimeters.

- **Knowledge exposition** — The interface through which other perimeters and agents consume KE's output. Not raw data access, but a governed interpretive substrate: a shared ontology defining what entities and relationships mean across perimeters, structured as a living graph that agents evolve continuously, exposed as a semantic API — an interface of meaning that constrains what consumers are allowed to conclude. Encoded team standards and priming documents (versioned artifacts capturing "how we do things here") feed this layer, ensuring that tacit knowledge survives team turnover and is consumable by both humans and agents.

**Brownfield specificity:** In brownfield projects, knowledge engineering is arguably the *first* perimeter that should activate — before discovery, before readiness assessment, before anything. The existing system's knowledge is the primary input to every other lifecycle activity.

---

## 5. Domain Mesh: A Reference Pattern for Projects

> **Scope clarification:** This section describes an **architectural reference pattern** — not a commitment to build mesh infrastructure within Convoke itself. The pattern is relevant to the *projects and organizations* that Convoke supports. It also informs how future Convoke perimeters for specialized disciplines might be structured, but the pattern itself lives at the product/organization level.

### The Problem

Products and organizations that span multiple technical disciplines face a recurring tension. Lifecycle activities need domain-specific expertise (discovery needs data analysis, readiness needs ML model evaluation, delivery needs ML deployment patterns). But centralizing all expertise in one team creates a bottleneck and violates domain ownership.

This tension mirrors exactly the problem that Data Mesh, Service Mesh, and Agentic Mesh patterns were designed to solve. The insight: **specialized disciplines should be organized as decentralized, self-serve, federated capabilities** — not as centralized teams or monolithic modules. Full foundations: [companion Section 10](lifecycle-expansion-references.md#10-domain-mesh-pattern-foundations).

### The Pattern

```
  DOMAIN MESH PATTERN
  ====================

  +-----------------------------------------------------------------------------+
  |                    MESH INFRASTRUCTURE LAYER                                 |
  |  Discovery  -  Routing  -  Capability Registry  -  Governance Contracts     |
  +-----------------------------------------------------------------------------+
       |              |              |              |              |
  +----v----+   +----v----+   +----v----+   +----v----+   +----v----+
  | DataOps |   |  MLOps  |   | AgentOps|   | SecOps  |   |  ...    |
  | Domain  |   | Domain  |   | Domain  |   | Domain  |   | Domain  |
  |         |   |         |   |         |   |         |   |         |
  | Ports:  |   | Ports:  |   | Ports:  |   | Ports:  |   | Ports:  |
  | -assess |   | -assess |   | -assess |   | -assess |   | -assess |
  | -build  |   | -build  |   | -build  |   | -build  |   | -build  |
  | -monitor|   | -monitor|   | -monitor|   | -monitor|   | -monitor|
  | -advise |   | -advise |   | -advise |   | -advise |   | -advise |
  +---------+   +---------+   +---------+   +---------+   +---------+
       ^              ^              ^              ^              ^
       |              |              |              |              |
  +----+--------------+--------------+--------------+--------------+----+
  |              LIFECYCLE PERIMETERS (consumers of domain capabilities)  |
  |  Strategy - Discovery - Design - Build - Readiness - Delivery - ...  |
  +----------------------------------------------------------------------+
```

**Four principles** (inspired by Data Mesh): (1) domain-oriented ownership, (2) capability as a product, (3) self-serve mesh infrastructure, (4) federated governance.

### Asymmetric Port Maturity

Not every domain implements all four ports, and not all ports are equally mature. A domain registers which ports it supports and at what maturity level:

```
  PORT MATURITY MODEL:

  Level 0: Not available     — port not implemented
  Level 1: Advise            — expertise available, no automation
  Level 2: Assess            — can evaluate current state, produce gap analysis
  Level 3: Build             — can produce implementation artifacts
  Level 4: Monitor           — can observe outcomes and detect drift

  EXAMPLE — current maturity by domain:

  Domain        advise    assess    build     monitor
  -------------------------------------------------------
  DataOps       Level 1   Level 0   Level 0   Level 0
  MLOps         Level 1   Level 1   Level 0   Level 0
  AgentOps      Level 1   Level 2   Level 1   Level 0
  PlatformOps   Level 1   Level 1   Level 0   Level 0
```

This mirrors how real consulting practices mature: you start by giving advice, then systematize assessment, then build tooling, then monitor outcomes. The gap between current maturity and desired maturity becomes a visible signal for investment priority.

### Relationship to Convoke

The Domain Mesh pattern is not something Convoke needs to *build* — it's something Convoke should *understand and support*. When Convoke's lifecycle perimeters encounter projects spanning multiple technical disciplines, this pattern informs how those disciplines relate. If Convoke eventually adds perimeters for data engineering, ML, or agentic engineering, they should be designed as composable, port-based capabilities — enabling extensibility without tight coupling.

---

## 6. Entropy as a Cross-Cutting Force

The gap analysis (Section 2) and the sunset perimeter (Section 3) treat artifact degradation as a lifecycle endpoint. But real systems decay continuously. Knowledge goes stale. Security postures drift. Operational runbooks become outdated. Architecture decisions made during strategy become constraints that the sunset perimeter eventually has to unwind.

> **Entropy principle:** Every artifact, decision, and knowledge asset produced by any perimeter has a half-life. The question is not *whether* it will degrade, but *when* — and whether the degradation will be detected before it causes harm.

**Theoretical grounding:** Lehman's laws of software evolution (1980) establish that systems must be continually adapted or they become progressively less satisfactory. Storey's cognitive debt concept (2026) extends this: as AI generates more artifacts, organizational *comprehension* of those artifacts erodes — an accelerating risk in agentic contexts. De Holan & Phillips (2004) show that organizations don't just fail to learn — they actively forget. Full references: [companion Section 12](lifecycle-expansion-references.md#12-entropy--decay).

**Practical manifestation:** Rather than a separate perimeter, entropy management should manifest as a **lightweight validation protocol** that any perimeter can invoke on its own artifacts — inspired by Noah's role in Vortex (Sensitize):

- **Staleness detection** — automated checks for artifacts that haven't been validated against their current context within a defined period
- **Drift monitoring** — comparison of the assumptions underlying a perimeter's artifacts against the current state of evidence
- **Decay scoring** — a quantitative signal indicating remaining confidence in an artifact, analogous to error budgets in SRE but applied to knowledge and decision artifacts

---

## 7. Organizational Transformation

Introducing agentic capabilities across an organization is qualitatively different from previous technology adoptions. The full theoretical treatment spans classical change management, organizational design, agentic transformation research, governance frameworks, and adoption dynamics — detailed in the [companion, Section 11](lifecycle-expansion-references.md#11-organizational-transformation). This section distills the key insights.

**Agentic transformation is not just another tech adoption.** Research (2024-2026) identifies three distinct human-AI collaboration models — Centaurs (clear task division), Cyborgs (fluid blending), Self-Automators (delegation). Each produces different learning and career outcomes. Organizations need to consciously design which model they encourage (Randazzo, Mollick et al., 2024). Anthropic's own case study shows engineers self-describing as "managers of AI agents" — a fundamental role shift, not a productivity tweak.

**Cynefin governs agent autonomy.** The Cynefin framework (Snowden) provides the clearest lens for deciding which decisions agents can handle autonomously (Clear/Complicated domains) versus which require human judgment (Complex/Chaotic). This distinction is critical as perimeters multiply — not every capability should be delegated at the same rate.

**Psychological safety is the strongest predictor of success.** Across all adoption literature reviewed — Rogers, Moore, Fogg, Edmondson — psychological safety consistently emerges as the single most important factor. Teams that feel safe to experiment with agents, report failures, and surface concerns adopt faster and more sustainably than teams operating under pressure to show results.

**The governance perimeter is a meta-perimeter.** Unlike other perimeters, it exists to help organizations adopt the other perimeters. Its capabilities span change architecture (Kotter, ADKAR, diffusion theory), governance design (Cynefin, DACI, EU AI Act, ISO 42001), and adoption facilitation (Fogg's tiny habits, nudge theory, behavioral design).

---

## 8. Synthesis: The Three-Axis Architecture

### Infrastructure vs. Practice

The proposed perimeters fall into two fundamentally different categories:

**Infrastructure perimeters** enable other perimeters to function. They are supportive, foundational, and consumed by practice perimeters:

- **Knowledge engineering** — extracts and exposes knowledge that every other perimeter consumes
- **Systematic documentation** — captures and organizes artifacts across the lifecycle
- **Entropy management** — monitors the continued validity of artifacts across all perimeters

**Practice perimeters** encode a discipline — they prescribe workflows grounded in specific theoretical foundations:

- **Strategy** encodes strategic analysis (Porter, Wardley, Blue Ocean)
- **Delivery** encodes release engineering (Continuous Delivery, feature flags)
- **Growth** encodes product-led growth (AARRR, PLG, experimentation)
- **Operations** encodes SRE (SLOs, incident management, chaos engineering)
- **Security** encodes threat modeling, DevSecOps, and compliance
- **Sunset** encodes technical debt management and legacy modernization
- **Governance & change** encodes organizational transformation practices

### The Module Map

```
  ===========================================================================
  AXIS 1: LIFECYCLE (gravity model — evidence determines pull, not sequence)
  ===========================================================================

  PRACTICE PERIMETERS (encode a discipline — opinionated workflows):

         Strategy    Discovery    Design     Build      Readiness    Delivery
         +--------+  +--------+  +--------+  +--------+  +--------+  +--------+
         |Strategy|  | VORTEX |  |  WDS   |  |  BMM   |  |  GYRE  |  |Delivery|
         | perim. |  | 7 agts |  |  BMM   |  |  TEA   |  | 4 agts |  | perim. |
         +--------+  +--------+  +--------+  +--------+  +--------+  +--------+

         Growth       Operations   Security    Sunset
         +--------+  +----------+  +--------+  +--------+
         | Growth |  |Operations|  |Security|  | Sunset |
         | perim. |  | perimeter|  | perim. |  | perim. |
         +--------+  +----------+  +--------+  +--------+

                     <-- gravitational pull shifts with evidence -->

  ===========================================================================
  AXIS 2: DOMAIN MESH (reference pattern — what expertise is needed)
  ===========================================================================

  +-----------------------------------------------------------------------------+
  |            MESH PATTERN (discovery - routing - governance)                    |
  +-----------+-----------+-----------+-----------+-----------------------------+
  | DataOps   |  MLOps    |  AgentOps | PlatformOps|  ... (extensible)         |
  | domain    |  domain   |  domain   |  domain   |                            |
  +-----------+-----------+-----------+-----------+-----------------------------+

  ===========================================================================
  AXIS 3: CROSS-CUTTING CAPABILITIES
  ===========================================================================

  INFRASTRUCTURE PERIMETERS (enable other perimeters — supportive, foundational):

  +-----------------------------------------------------------------------------+
  | Knowledge Engineering — active extraction, refinement, exposition            |
  +-----------------------------------------------------------------------------+
  | Systematic Documentation — Diataxis-based, docs-as-code                     |
  +-----------------------------------------------------------------------------+
  | Entropy Management — artifact validity monitoring across all perimeters      |
  +-----------------------------------------------------------------------------+

  CROSS-CUTTING PRACTICE PERIMETERS (disciplines that span all phases):

  +-----------------------------------------------------------------------------+
  | Security & Compliance — proactive, lifecycle-spanning                        |
  +-----------------------------------------------------------------------------+
  | Governance, Change Management & Adoption — meta-perimeter (lens from        |
  | Wave 0, full perimeter from Wave 2)                                         |
  +-----------------------------------------------------------------------------+

  EXISTING SUPPORT:
  CIS (Creative & Innovation) - BMB (Builder) - Enhance (Skills) - Team Factory
```

### The Three Axes

The **Lifecycle axis** describes practice perimeters that activate based on gravitational pull from evidence and risk. Perimeters are connected by handoff contracts, but flow is non-linear.

The **Domain Mesh axis** is a reference pattern describing what expertise is needed. It applies to the projects Convoke supports and would inform future domain-specialized perimeters.

The **Cross-cutting axis** contains infrastructure perimeters that enable everything else, and cross-cutting practice perimeters that span all lifecycle phases.

### Sequencing

Not all perimeters need to be built simultaneously. The waves below represent a *default gradient* — the typical order in which gravity is strongest for most organizations. It is not a prescribed sequence.

**Wave 0 — Foundations (infrastructure + governance lens):**
- **Knowledge engineering perimeter** — In brownfield contexts, this activates *first*. Extracts the knowledge that every other perimeter needs.
- **Governance & change lens** — Not a full perimeter yet, but the principles are active: every Wave 1+ perimeter is designed with adoption patterns (Fogg's tiny habits, Rogers' diffusion factors, Edmondson's psychological safety).
- **Entropy monitoring baseline** — Staleness detection and drift monitoring protocols established as a shared capability.

**Wave 1 — Core lifecycle completion:**
- **Delivery perimeter** — Bridges the Gyre-to-production gap
- **Operations perimeter** — Operationalizes Gyre's readiness findings
- **Security perimeter** — Elevates Gyre's security assessment to a proactive discipline

**Wave 2 — Lifecycle extension + full governance:**
- **Strategy perimeter** — Grounds discovery in strategic context
- **Growth perimeter** — Closes the post-launch feedback loop
- **Documentation perimeter** — Prevents knowledge loss as perimeters multiply
- **Governance & change perimeter (full)** — Graduates from lens to full meta-perimeter with dedicated capabilities

**Wave 3 — Complete the picture:**
- **Sunset perimeter** — Full lifecycle closure
- **Domain-specialized perimeters** (AgentOps, MLOps, DataOps, PlatformOps, etc.) — as demand dictates, starting at port maturity Level 1 and graduating

### Lean Principles as Design Constraints

Several core lean thinking principles (Womack & Jones, 1996; Ohno, 1988) are already embedded in the architecture — though not labeled as such. Making them explicit creates design constraints that prevent waste as the platform scales.

**Pull over push — already embedded.** The gravity model is a pull system. Perimeters activate when evidence and risk demand it, not when a pipeline schedule says so. This is the same principle as Toyota's kanban: don't push work forward; let downstream demand pull it. The implication for design: every perimeter activation should be traceable to an evidence signal, never to a timer or a default sequence.

**Eliminate waste — partially embedded.** Lean identifies seven forms of waste. Four map directly to agentic lifecycle risks:

- *Overproduction* — agents generating artifacts nobody consumes. The KE exposition layer mitigates this by defining what consumers actually need, but each practice perimeter should also track whether its outputs are consumed by downstream perimeters or ignored.
- *Waiting* — handoff bottlenecks between perimeters. The gravity model allows parallel activation, but as perimeters multiply, handoff contracts could create invisible queues. Detecting "a perimeter is blocked waiting for another" should be an observable signal.
- *Overprocessing* — applying full rigor when a lighter touch suffices. The asymmetric port maturity model (L0→L4) prevents this at the domain level; a similar graduated-response principle should apply within perimeters — not every evidence signal warrants a full workflow execution.
- *Defects* — entropy management (staleness detection, drift monitoring, decay scoring) is lean's defect prevention applied to knowledge artifacts rather than physical products.

**Flow and WIP governance — not yet embedded.** The gravity model describes *what* activates but not *how much* can activate simultaneously. If every perimeter is pulling at once, nothing flows. Lean's answer is to limit work in progress. For Convoke, this means: the gravity model needs a flow-awareness mechanism — a way to detect when too many perimeters are active and the system is thrashing rather than progressing. This is especially critical post-Wave 2 when 10+ perimeters could theoretically compete for attention.

**Continuous improvement (kaizen) — partially embedded.** Entropy management handles degradation detection (is it broken?), but not improvement feedback loops (could it be better?). Lean's kaizen principle suggests each perimeter should emit improvement signals — not just "this artifact is stale" but "this workflow step consistently produces low-confidence outputs." These signals feed back into perimeter configuration, creating a self-improving system rather than one that merely resists decay.

**Value stream visibility — not yet embedded.** Mapping the path from an evidence signal through perimeter activations, handoff contracts, and knowledge transformations to a consumable outcome would reveal waste, bottlenecks, and unnecessary handoffs. As the platform scales beyond Wave 1, value stream mapping across perimeters becomes a governance capability — likely owned by the governance meta-perimeter.

---

## 9. Open Questions

1. **Agent-to-agent governance:** How should inter-module handoff contracts be governed as modules multiply? The current HC/GC pattern works within teams — what about across teams?

2. **Emergent behavior at scale:** With 40+ agents across 15+ modules, what emergent properties should we expect? What guardrails are needed?

3. **Measuring transformation:** DORA metrics cover delivery, but what metrics capture discovery quality, knowledge asset health, adoption success, or governance maturity?

4. **Agent autonomy spectrum:** Cynefin suggests which decisions agents can handle autonomously. But what model governs the *progression* of autonomy over time?

5. **Convoke's own governance:** As Convoke becomes a three-axis platform, how should the project itself be governed?

6. **Knowledge asset lifecycle:** How do knowledge assets age, decay, and get retired? The entropy framework (Section 6) addresses this structurally, but specific metrics and thresholds remain open.

7. **Port interface evolution:** The asymmetric maturity model (Section 5) addresses domain graduation. But how do port interfaces themselves evolve without breaking consumers?

8. **Mesh observability:** How do we observe the health of the mesh — which capabilities are most consumed, where are bottlenecks, where is expertise missing?

---

## Appendix A: Current Coverage Detail

For teams unfamiliar with Convoke's existing modules, this appendix provides full detail. See also [companion Section 1](lifecycle-expansion-references.md#1-current-coverage-module-detail) for theoretical foundations per module.

### Discovery & Validation — Vortex (7 agents, 22 workflows)

The Vortex team implements Jurgen Appelo's Innovation Vortex pattern as a continuous, non-linear discovery engine. Emma handles problem framing and strategic context (Contextualize), Isla drives user research and empathy mapping (Empathize), Mila synthesizes research into JTBD-framed problem definitions (Synthesize), Liam engineers testable hypotheses and assumption maps (Hypothesize), Wade designs and runs lean experiments including MVPs, PoCs, and PoVs (Externalize), Noah interprets production signals and behavioral patterns (Sensitize), and Max captures validated learning and drives pivot/patch/persevere decisions (Systematize). The compass routing system creates a non-linear flow between streams based on evidence.

### Design & Planning — WDS + BMM Phases 1-3

WDS provides a 10-step design workflow from project alignment through UX specifications, asset generation, and design system creation (agents: Freya for UX, Saga for analysis). BMM's first three phases handle requirements analysis and PRD creation (Phase 1), UX and product planning (Phase 2), and architecture and epic/story breakdown (Phase 3).

### Implementation & Quality — BMM Phase 4 + TEA

BMM Phase 4 covers development, code review, sprint planning, retrospectives, and course correction through Dev, QA, and Scrum Master agents. TEA adds a dedicated Test Architect (Murat) with 8 workflows spanning test strategy, ATDD automation, traceability, CI/CD pipeline design, and non-functional requirements assessment.

### Production Readiness — Gyre (4 agents, 7 workflows)

Gyre assesses deployment readiness through a sequential pipeline: Scout detects the technology stack, Atlas generates a capabilities manifest against industry standards, Lens identifies gaps and absence patterns, and Coach facilitates review with a feedback loop back to Atlas.

### Creative, Build & Extension — CIS + BMB + Enhance + Team Factory

CIS provides creative and innovation agents (brainstorming, design thinking, storytelling, presentations). BMB enables custom agent, module, and workflow creation. Enhance adds RICE-scored backlog management to the PM agent. Team Factory guides the creation of new BMAD-compliant teams.

---

*This document serves as the theoretical foundation for Convoke's lifecycle expansion. Five structural principles shape the architecture: (1) the lifecycle is a gravity model, not a pipeline; (2) infrastructure perimeters must be built before practice perimeters; (3) entropy is a cross-cutting force, not a lifecycle endpoint; (4) domain mesh ports mature asymmetrically; (5) the governance lens is active from Wave 0. Each proposed perimeter should be specified using the Team Factory workflow when it matures from exploration to commitment, with agent designs grounded in the references cited in the [companion document](lifecycle-expansion-references.md).*
