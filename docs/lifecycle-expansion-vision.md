# Convoke Agents — Lifecycle Expansion Vision

> Theoretical foundations for extending Convoke to cover the full product/software lifecycle,
> including the organizational transformation that agentic AI adoption requires.
>
> **Author:** Amalik Amriou — Agentic Product Lead
> **Date:** March 2026
> **Status:** Exploratory / Pre-specification

---

## Table of Contents

1. [Current Coverage Map](#1-current-coverage-map)
2. [Lifecycle Model & Gap Analysis](#2-lifecycle-model--gap-analysis)
3. [New Perimeters: Theoretical Foundations](#3-new-perimeters-theoretical-foundations)
4. [Knowledge Engineering: From Documentation to Knowledge Assets](#4-knowledge-engineering-from-documentation-to-knowledge-assets)
5. [Domain Mesh: A Reference Pattern for Specialized Disciplines](#5-domain-mesh-a-reference-pattern-for-specialized-disciplines)
6. [Organizational Transformation Dimension](#6-organizational-transformation-dimension)
7. [Synthesis: Towards a Full-Lifecycle Agentic Platform](#7-synthesis-towards-a-full-lifecycle-agentic-platform)

---

## 1. Current Coverage Map

Convoke currently covers five major lifecycle phases through its module ecosystem. Below is a consolidated view of what exists, organized by lifecycle position.

### 1.1 Discovery & Validation — Vortex (7 agents, 22 workflows)

The Vortex team implements Jurgen Appelo's Innovation Vortex pattern as a continuous, non-linear discovery engine. Emma handles problem framing and strategic context (Contextualize), Isla drives user research and empathy mapping (Empathize), Mila synthesizes research into JTBD-framed problem definitions (Synthesize), Liam engineers testable hypotheses and assumption maps (Hypothesize), Wade designs and runs lean experiments including MVPs, PoCs, and PoVs (Externalize), Noah interprets production signals and behavioral patterns (Sensitize), and Max captures validated learning and drives pivot/patch/persevere decisions (Systematize). The compass routing system creates a non-linear flow between streams based on evidence.

**Theoretical foundations:** Innovation Vortex (Appelo, 2022), Lean Startup (Ries, 2011), Jobs-to-be-Done (Christensen et al., 2016), Empathy Mapping (Gray et al., 2010), Build-Measure-Learn, Signal Detection Theory.

### 1.2 Design & Planning — WDS + BMM Phases 1–3

WDS provides a 10-step design workflow from project alignment through UX specifications, asset generation, and design system creation (agents: Freya for UX, Saga for analysis). BMM's first three phases handle requirements analysis and PRD creation (Phase 1), UX and product planning (Phase 2), and architecture and epic/story breakdown (Phase 3).

**Theoretical foundations:** Design Thinking (Brown, 2009), Human-Centered Design (d.school), Architecture Decision Records (Nygard, 2011).

### 1.3 Implementation & Quality — BMM Phase 4 + TEA

BMM Phase 4 covers development, code review, sprint planning, retrospectives, and course correction through Dev, QA, and Scrum Master agents. TEA adds a dedicated Test Architect (Murat) with 8 workflows spanning test strategy, ATDD automation, traceability, CI/CD pipeline design, and non-functional requirements assessment.

**Theoretical foundations:** Agile/Scrum practices, ATDD (Acceptance Test-Driven Development), Continuous Integration.

### 1.4 Production Readiness — Gyre (4 agents, 7 workflows)

Gyre assesses deployment readiness through a sequential pipeline: Scout detects the technology stack, Atlas generates a capabilities manifest against industry standards, Lens identifies gaps and absence patterns, and Coach facilitates review with a feedback loop back to Atlas.

**Theoretical foundations:** DORA metrics (Forsgren et al., 2018), Google PRR (Beyer et al., 2016), OpenTelemetry, SLSA, Continuous Delivery (Humble & Farley, 2010).

### 1.5 Creative, Build & Extension — CIS + BMB + Enhance + Team Factory

CIS provides creative and innovation agents (brainstorming, design thinking, storytelling, presentations). BMB enables custom agent, module, and workflow creation. Enhance adds RICE-scored backlog management to the PM agent. Team Factory guides the creation of new BMAD-compliant teams.

---

## 2. Lifecycle Model & Gap Analysis

### 2.1 Why Not a Linear Pipeline

The diagram below maps Convoke's current coverage against lifecycle phases. It is tempting to read these phases left-to-right as a pipeline. But Vortex already proved that discovery is non-linear — its compass routing system moves between streams based on evidence, not sequence. If discovery isn't a pipeline, why would the macro lifecycle be one?

A production incident doesn't "flow forward" from operations to sunset — it pulls gravity back toward readiness, or even toward discovery if the incident reveals a fundamental misunderstanding of user needs. A market shift doesn't wait for the current build to finish — it pulls gravity toward strategy. The lifecycle is better understood as a **gravity model**: all perimeters exist simultaneously, and evidence determines which has the strongest pull at any given moment.

> **Gravity model principle:** Perimeters don't have a fixed sequence — they have gravitational pull based on the current state of evidence and risk. Early in a product's life, strategy and discovery have the strongest pull. As you approach production, readiness and delivery dominate. Post-launch, growth and operations take over. But at any point, new evidence can shift gravity back. This is conceptually what Vortex's compass routing already does within discovery. The adjustment is applying the same principle across the entire lifecycle.

**Theoretical grounding:** This mirrors the adaptive cycle in Holling's Panarchy model (Holling, C. S. (2001). "Understanding the Complexity of Economic, Ecological, and Social Systems." *Ecosystems*, 4(5), 390–405) — systems cycle through exploitation, conservation, release, and reorganization phases, and the current phase determines which forces dominate. It also draws on the non-linear dynamics in Snowden's Cynefin framework (already referenced in Section 6.4) — complex systems don't follow predetermined paths; they respond to probes and emerging patterns.

**Practical implication for sequencing:** Instead of "Wave 1 comes after Wave 0," the sequencing becomes: "build perimeters where gravity is strongest for your current adopters." The wave model (Section 7.6) is retained as a *default gradient* — the typical order in which gravity pulls for most organizations — not as a prescribed sequence.

### 2.2 Current Coverage Map

Mapping Convoke's current coverage against the full set of lifecycle perimeters reveals six major uncovered perimeters and three cross-cutting dimensions.

```
                        CURRENT COVERAGE (gravity model — not a pipeline)
                        ═══════════════════════════════════════════════════

                            ┌─────────────────────────────────────┐
                            │        EVIDENCE & RISK STATE        │
                            │    (determines gravitational pull)   │
                            └──────────────┬──────────────────────┘
                                           │
             ┌─────────┬──────────┬────────┼────────┬──────────┬─────────┐
             ▼         ▼          ▼        ▼        ▼          ▼         ▼
         Strategy   Discovery   Design   Build   Readiness  Delivery  Growth
         ┌──────┐  ┌────────┐  ┌─────┐  ┌─────┐  ┌───────┐  ┌──────┐  ┌──────┐
         │ GAP  │  │ VORTEX │  │ WDS │  │ BMM │  │ GYRE  │  │ GAP  │  │ GAP  │
         │      │  │ 7 agts │  │ BMM │  │ TEA │  │ 4 agts│  │      │  │      │
         └──────┘  └────────┘  └─────┘  └─────┘  └───────┘  └──────┘  └──────┘
             ┌─────────┬──────────┐
             ▼         ▼          ▼
         Operations  Sunset    Creative/Ext
         ┌────────┐  ┌──────┐  ┌─────────┐
         │  GAP   │  │ GAP  │  │CIS · BMB│
         │        │  │      │  │ Enhance  │
         └────────┘  └──────┘  └─────────┘

  CROSS-CUTTING:
  ┌─────────────────────────────────────────────────────────────────────────┐
  │ SECURITY & COMPLIANCE (assessed by Gyre, not remediated)               │
  ├─────────────────────────────────────────────────────────────────────────┤
  │ DOCUMENTATION & KNOWLEDGE MANAGEMENT (partial, no systematic approach) │
  ├─────────────────────────────────────────────────────────────────────────┤
  │ GOVERNANCE, CHANGE MANAGEMENT & ORGANIZATIONAL TRANSFORMATION          │
  ├─────────────────────────────────────────────────────────────────────────┤
  │ ENTROPY MANAGEMENT (not addressed — see Section 7.5)                   │
  └─────────────────────────────────────────────────────────────────────────┘
```

### 2.3 Summary of Gaps

| Gap | Current State | Impact |
|-----|--------------|--------|
| **Strategy & Vision** | Emma does problem framing, but no strategic positioning, competitive analysis, or business model design | Discovery starts without strategic grounding |
| **Delivery & Release** | TEA designs CI/CD pipelines, Gyre assesses readiness, but no release management, feature flagging, or progressive delivery | Gap between "ready" and "live" |
| **Growth & Adoption** | Noah interprets production signals, but no activation, retention, or growth workflows | Post-launch product evolution is blind |
| **Operations** | Gyre identifies operational gaps, but no incident management, runbooks, or operational workflows | Readiness without operational follow-through |
| **Sunset & Technical Debt** | Not addressed | No lifecycle end management |
| **Security & Compliance** | Gyre detects gaps, SLSA referenced, but no threat modeling or DevSecOps workflows | Assessment without remediation |
| **Documentation** | WDS covers design docs, but no systematic documentation strategy | Knowledge loss across lifecycle |
| **Governance & Change** | Not addressed | No framework for governing the transformation itself |

---

## 3. New Perimeters: Theoretical Foundations

For each identified gap, the following sections present the theoretical frameworks that would underpin new Convoke modules. These are organized as potential future teams or skills.

### 3.1 Strategy & Vision Perimeter

This perimeter sits upstream of Vortex. Where Emma frames problems, a Strategy module would frame the *space* in which problems are worth finding: market positioning, competitive dynamics, and business model coherence.

**Core theoretical foundations:**

- **Competitive Strategy** — Porter, M. E. (1980). *Competitive Strategy: Techniques for Analyzing Industries and Competitors*. Free Press. The Five Forces framework (supplier power, buyer power, threat of substitutes, threat of new entrants, competitive rivalry) remains the standard for industry structure analysis.

- **Value Innovation** — Kim, W. C. & Mauborgne, R. (2005). *Blue Ocean Strategy: How to Create Uncontested Market Space and Make the Competition Irrelevant*. Harvard Business School Press. Contrasts competition in existing markets (Red Ocean) with creation of uncontested market space through value innovation.

- **Strategy Choice Cascade** — Lafley, A. G. & Martin, R. L. (2013). *Playing to Win: How Strategy Really Works*. Harvard Business Review Press. Five interconnected choices: winning aspiration, where to play, how to win, capabilities required, management systems.

- **Strategic Coherence** — Rumelt, R. P. (2011). *Good Strategy/Bad Strategy: The Difference and Why It Matters*. Crown Business. Distinguishes coherent strategy (diagnosis + guiding policy + coherent actions) from motivational platitudes.

- **Wardley Mapping** — Wardley, S. (2018). *Wardley Maps*. Self-published/Creative Commons. Strategic landscape visualization through value chain positioning and component evolution. Enables situational awareness and movement anticipation.

- **Business Model Design** — Osterwalder, A. & Pigneur, Y. (2010). *Business Model Generation*. Wiley. Business Model Canvas as shared language for business model description, visualization, and iteration.

**Potential agents:** Strategic Analyst (competitive landscape), Business Model Architect (value proposition and model design), Wardley Mapper (situational awareness and evolution).

### 3.2 Delivery & Release Perimeter

This perimeter bridges Gyre's readiness assessment to actual production deployment. It covers release strategy, progressive delivery, and the mechanics of getting software safely to users.

**Core theoretical foundations:**

- **Continuous Delivery** — Humble, J. & Farley, D. (2010). *Continuous Delivery: Reliable Software Releases through Build, Test, and Deploy Automation*. Addison-Wesley. Deployment pipeline patterns, infrastructure as code, release management. (Already in references.md; deepened here for delivery-specific scope.)

- **Progressive Delivery & Feature Flags** — Hodgson, P. & Echagüe, P. (2020). *Feature Flag Best Practices*. O'Reilly. Eight best practices for feature flags enabling decoupling of deployment from release. Hodgson, P. (2012–present). "Feature Toggles (aka Feature Flags)." Martin Fowler's bliki. Comprehensive reference on toggle patterns and lifecycle management.

- **Trunk-Based Development** — Forsgren, N. et al. (2018). *Accelerate*. IT Revolution Press. Empirical evidence that trunk-based development correlates with elite delivery performance. Short-lived branches, continuous integration, small batch sizes.

- **Deployment Strategies** — Industry practices for canary deployments, blue-green deployments, rolling updates, and traffic shifting. Formalized in Kubernetes and cloud-native deployment patterns.

- **Release Engineering** — Beyer, B. et al. (2016). "Release Engineering" in *Site Reliability Engineering*. O'Reilly. Google's approach to release management as an engineering discipline.

**Potential agents:** Release Strategist (deployment patterns, risk assessment), Feature Flag Manager (progressive rollout, experimentation coupling), Rollback Analyst (failure detection, automated rollback criteria).

### 3.3 Growth & Adoption Perimeter

This perimeter covers the post-launch product lifecycle: how users discover, adopt, activate, and retain with the product. It connects back to Vortex's discovery insights and Noah's production signals.

**Core theoretical foundations:**

- **Product-Led Growth** — Bush, W. (2019). *Product-Led Growth: How to Build a Product That Sells Itself*. ProductLed Library. Shift from sales-driven to product-driven acquisition and expansion. The product itself is the primary growth engine.

- **Pirate Metrics (AARRR)** — McClure, D. (2007). "AARRR! Pirate Metrics for Startups." Lean Analytics framework. Five-stage growth funnel: Acquisition, Activation, Retention, Referral, Revenue. Provides a measurement framework for each growth stage.

- **North Star Metric** — Ellis, S. (2013). "Finding Your North Star Metric." Growth Hackers. Single metric capturing core value delivered, with input metrics driving it. Aligns teams around a shared outcome.

- **Activation & Onboarding** — Gupta, A. & Reforge (2020–ongoing). Activation frameworks spanning Setup → Aha Moment → Habit Loop. Operationalizes the AARRR funnel's most critical conversion point.

- **JTBD for Growth** — Traynor, D., Adams, P. & Keating, G. (2016). *Intercom on Jobs-to-be-Done*. Intercom Books. Applies JTBD to product marketing, onboarding design, and feature adoption — bridging discovery insights to growth execution.

- **Experimentation at Scale** — Kohavi, R. et al. (2020). *Trustworthy Online Controlled Experiments*. Cambridge University Press. Statistical rigor in A/B testing and online experimentation for growth optimization.

**Potential agents:** Growth Analyst (funnel metrics, cohort analysis, North Star tracking), Onboarding Architect (activation flows, time-to-value optimization), Retention Strategist (churn analysis, engagement patterns, re-engagement campaigns).

### 3.4 Operations & Resilience Perimeter

This perimeter extends Gyre's readiness assessment into actual operational practice: what happens when things go wrong, and how operational knowledge is captured and improved.

**Core theoretical foundations:**

- **Site Reliability Engineering** — Beyer, B. et al. (2016). *Site Reliability Engineering: How Google Runs Production Systems*. O'Reilly. SLOs, SLIs, error budgets, incident management, postmortems. Beyer, B. et al. (2018). *The Site Reliability Workbook*. O'Reilly. Practical implementation patterns.

- **Incident Management** — PagerDuty. (2015–ongoing). *Incident Response Documentation*. https://response.pagerduty.com/. Best practices for incident response, runbook automation, escalation patterns.

- **Chaos Engineering** — Rosenthal, C. et al. (2020). *Chaos Engineering: System Resiliency in Practice*. O'Reilly. Proactive resilience testing through controlled failure injection. Principles: build hypothesis, vary real-world events, run experiments in production, automate.

- **Learning from Incidents** — Woods, D. D. (2017). "STELLA: Report from the SNAFUcatchers Workshop on Coping With Complexity." Ohio State University. Complex systems thinking applied to incident analysis. Beyond root cause to systemic understanding.

- **SLO Implementation** — Hidalgo, A. (2020). *Implementing Service Level Objectives*. O'Reilly. Detailed SLO methodology linking reliability targets to business outcomes through error budgets.

**Potential agents:** Incident Commander (structured incident response, communication, escalation), Runbook Engineer (operational procedure design and automation), Resilience Analyst (chaos experiment design, failure mode analysis, postmortem facilitation).

### 3.5 Security & Compliance Perimeter

This perimeter elevates security from a Gyre assessment dimension to a proactive, lifecycle-spanning discipline with its own agents and workflows.

**Core theoretical foundations:**

- **Threat Modeling** — Shostack, A. (2014). *Threat Modeling: Designing for Security*. Wiley. STRIDE framework (Spoofing, Tampering, Repudiation, Information Disclosure, Denial of Service, Elevation of Privilege). Systematic approach to identifying security threats early in design.

- **DevSecOps** — OWASP Foundation. (2021–ongoing). *DevSecOps Guideline & Maturity Model*. OWASP.org. Open framework for embedding security throughout the development pipeline. NIST. (2022). *Secure Software Development Framework (SSDF)*. NIST SP 800-218. Federal standards for secure development practices.

- **Software Supply Chain Security** — NTIA. (2021). *Minimum Elements for a Software Bill of Materials (SBOM)*. U.S. Department of Commerce. Standardized SBOM requirements for supply chain transparency. Extends SLSA (already referenced in Gyre).

- **EU AI Act** — European Union. (2024). *Regulation (EU) 2024/1689 on Artificial Intelligence*. Risk-based regulatory framework with specific compliance requirements for high-risk AI systems. Relevant as Convoke's agents themselves may fall under AI governance requirements.

- **NIST AI Risk Management** — NIST. (2023). *AI Risk Management Framework*. Voluntary framework for responsible AI development across the system lifecycle.

- **ISO/IEC 42001** — ISO/IEC. (2023). *AI Management System Standard*. First international standard for organizational AI governance, enabling audit and certification.

**Potential agents:** Threat Modeler (STRIDE analysis, attack surface mapping), Compliance Analyst (regulatory mapping, EU AI Act / NIST alignment), Supply Chain Auditor (SBOM generation, dependency vulnerability analysis).

### 3.6 Documentation Perimeter

This perimeter addresses the systematic capture, organization, and evolution of knowledge across the entire lifecycle.

**Core theoretical foundations:**

- **Diátaxis Framework** — Procida, D. (2017–ongoing). *Diátaxis: A Systematic Framework for Technical Documentation*. https://diataxis.fr/. Four documentation types organized by user need: Tutorials (learning-oriented), How-to Guides (task-oriented), Reference (information-oriented), Explanation (understanding-oriented).

- **Docs-as-Code** — Gentle, A. (2017, 3rd ed. 2022). *Docs Like Code*. Just Write Click. Developer-writer collaboration workflows using version control, CI/CD, and automated publishing.

- **Architecture Decision Records** — Nygard, M. (2011). "Documenting Architecture Decisions." Cognitect Blog. Lightweight decision documentation pattern capturing context, decision, and consequences. Adopted by Thoughtworks Technology Radar (2018).

- **Knowledge Creation** — Nonaka, I. & Takeuchi, H. (1995). *The Knowledge-Creating Company*. Oxford University Press. SECI model (Socialization, Externalization, Combination, Internalization) for systematic knowledge conversion from tacit to explicit.

- **Organizational Learning** — Senge, P. M. (1990). *The Fifth Discipline*. Doubleday. Systems thinking as the integrating discipline for learning organizations. Mental models, shared vision, team learning.

**Potential agents:** Documentation Strategist (Diátaxis-based documentation planning), Knowledge Curator (cross-lifecycle knowledge synthesis, ADR management), Learning Librarian (organizational learning capture, pattern identification).

### 3.7 Sunset & Technical Debt Perimeter

This perimeter covers the end of the product lifecycle: managing technical debt, legacy modernization, and graceful sunset of features and products.

**Core theoretical foundations:**

- **Technical Debt** — Cunningham, W. (1992). "The WyCash Portfolio Management System." OOPSLA 1992. Origin of the technical debt metaphor as incomplete understanding of the problem domain, not merely sloppy code.

- **Behavioral Code Analysis** — Tornhill, A. (2018). *Software Design X-Rays: Fix Technical Debt with Behavioral Code Analysis*. Pragmatic Programmers. Identifies complexity hotspots through code churn patterns. Prioritizes debt based on behavioral data rather than static analysis alone.

- **Strangler Fig Pattern** — Fowler, M. (2004). "Strangler Fig Application." martinfowler.com. Architectural pattern for incremental legacy modernization by gradually routing functionality from old to new systems.

- **Refactoring** — Fowler, M. (2018). *Refactoring: Improving the Design of Existing Code* (2nd ed.). Addison-Wesley. Systematic techniques for improving code design under the constraint of preserving behavior.

**Potential agents:** Debt Analyst (hotspot detection, debt quantification, business impact), Migration Planner (strangler fig strategy, incremental modernization roadmap), Sunset Coordinator (deprecation communication, migration assistance, graceful shutdown).

---

## 4. Knowledge Engineering: From Documentation to Knowledge Assets

> The documentation perimeter (Section 3.6) handles systematic documentation — capturing what is *explicitly written*.
> This section addresses a fundamentally different problem: **actively extracting, refining, and exposing knowledge** that is tacit, dispersed, or buried in codebases, documentation, and team expertise. This is especially critical in brownfield contexts where knowledge is the most valuable and the least accessible asset.

### 4.1 The Knowledge Problem in Product/Software Organizations

Knowledge in organizations exists on a spectrum from fully explicit (API docs, ADRs) to deeply tacit (why a particular architectural decision was made, what edge cases a senior engineer knows intuitively, what the team learned from a failed experiment three years ago). The challenge is not documentation — it's **knowledge operationalization**: making organizational knowledge extractable, refinable, and consumable as assets by discovery teams, building teams, and agents alike.

This is the theoretical foundation for a **knowledge engineering perimeter** — complementary to the documentation perimeter, focused on active knowledge extraction and operationalization.

### 4.2 Theoretical Foundations

**Tacit and explicit knowledge:**

- **The Tacit Dimension** — Polanyi, M. (1966). *The Tacit Dimension*. University of Chicago Press. "We can know more than we can tell." Establishes that much organizational knowledge cannot be articulated through documentation alone — it requires elicitation.

- **SECI Model** — Nonaka, I. & Takeuchi, H. (1995). *The Knowledge-Creating Company*. Oxford University Press. Four modes of knowledge conversion: Socialization (tacit→tacit), Externalization (tacit→explicit), Combination (explicit→explicit), Internalization (explicit→tacit). **A knowledge engineering perimeter would operationalize the Externalization phase at scale** — converting tacit team knowledge into explicit, consumable assets.

- **Knowledge Elicitation** — Cooke, N. J. (1994). "Varieties of Knowledge Elicitation Techniques." *International Journal of Human-Computer Studies*, 41(6), 801–849. Taxonomy of techniques for extracting expert knowledge: interviews, protocol analysis, card sorting, repertory grids. Foundation for structured agent-guided knowledge extraction.

- **Knowledge Engineering Principles** — Studer, R., Benjamins, V. R. & Fensel, D. (1998). "Knowledge Engineering: Principles and Methods." *Data & Knowledge Engineering*, 25(1-2), 161–197. Formal methodology for building knowledge-based systems. The knowledge acquisition bottleneck and approaches to overcoming it.

**Knowledge in software engineering:**

- **Architecture as Design Decisions** — Jansen, A. & Bosch, J. (2005). "Software Architecture as a Set of Architectural Design Decisions." *Working IEEE/IFIP Conference on Software Architecture*. Architecture knowledge is not the diagrams — it's the *decisions* and their rationale. In brownfield projects, these decisions are often undocumented and live only in team memory.

- **Mining Software Repositories** — Kagdi, H., Collard, M. L. & Maletic, J. I. (2007). "A Survey and Taxonomy of Approaches for Mining Software Repositories in the Context of Software Evolution." *Journal of Software Maintenance and Evolution*, 19(2). Systematic extraction of knowledge from version control, bug trackers, and code artifacts. The codebase *is* a knowledge repository.

- **Developer Cognition** — Ko, A. J. et al. (2006). "An Exploratory Study of How Developers Seek, Relate, and Collect Relevant Information during Software Maintenance Tasks." *IEEE Transactions on Software Engineering*. How developers actually navigate and understand codebases — informing how agents should extract and present knowledge.

- **Cognitive Debt** — Storey, M. (2026). "How Generative and Agentic AI Shift Concern from Technical Debt to Cognitive Debt." Identifies an emerging organizational risk: as AI generates more code, human understanding of the codebase erodes. Knowledge extraction becomes not just useful but *essential* to maintain organizational capability.

**Knowledge assets as a product:**

- **Knowledge Assets** — Boisot, M. H. (1998). *Knowledge Assets: Securing Competitive Advantage in the Information Economy*. Oxford University Press. The I-Space model (Information-Space): knowledge moves through phases of codification and abstraction before diffusion. Provides the theoretical frame for treating knowledge as a managed, valuable asset.

- **Working Knowledge** — Davenport, T. H. & Prusak, L. (1998). *Working Knowledge: How Organizations Manage What They Know*. Harvard Business School Press. Knowledge market metaphors: knowledge has buyers, sellers, brokers, and a price. Applicable to how a knowledge engineering perimeter would expose knowledge assets for consumption by other perimeters.

**AI-augmented knowledge extraction (2024–2026):**

- **GraphRAG** — Microsoft Research. (2024–ongoing). *GraphRAG: Graph-based Retrieval-Augmented Generation*. https://microsoft.github.io/graphrag/. Hierarchical knowledge graph construction from unstructured text, enabling multi-hop reasoning over organizational knowledge. Goes beyond flat RAG by capturing relationships between concepts.

- **LLM-based Code Understanding** — Emerging discipline (2024–2026) using large language models for automated codebase summarization, architecture recovery, and documentation generation from code. Relevant papers from ACL, EMNLP, and ICSE conferences.

- **Semantic Code Search** — Vector-based code search enabling natural language queries against codebases. Tools like Sourcegraph Cody, GitHub Copilot Workspace, and Cursor demonstrate the pattern.

### 4.3 Knowledge Engineering Perimeter (Proposed)

**Purpose:** Actively extract, refine, and expose organizational knowledge as consumable assets — from codebases, existing documentation, and team expertise.

**Distinction from the documentation perimeter:** Documentation *captures what is produced*. Knowledge engineering *extracts what already exists but isn't accessible*.

```
  KNOWLEDGE SOURCES                  KNOWLEDGE ENG.                KNOWLEDGE CONSUMERS
  ┌──────────────────┐              ┌──────────┐               ┌──────────────────────┐
  │ Codebases        │──extract──▶  │          │──expose──▶    │ Discovery            │
  │ Existing docs    │──extract──▶  │ Extract  │──expose──▶    │ Build                │
  │ Team expertise   │──elicit───▶  │ Refine   │──expose──▶    │ Readiness            │
  │ Decision history │──mine─────▶  │ Expose   │──expose──▶    │ Any perimeter/agent  │
  │ Incident reports │──extract──▶  │          │──expose──▶    │ Human teams          │
  └──────────────────┘              └──────────┘               └──────────────────────┘
                                     ▲  refine
                                     │  validate
                                     │  structure
                                     └──────────
```

**Potential agents:**

- **A knowledge mining capability** — Extracting knowledge from codebases (architecture recovery, dependency mapping, implicit patterns), existing documentation (contradiction detection, staleness analysis), and repository history (decision archaeology, evolution patterns). Draws on Mining Software Repositories (Kagdi et al.) and GraphRAG.

- **A knowledge elicitation capability** — Structuring guided conversations with team members to externalize tacit knowledge: architectural rationale, edge case expertise, tribal knowledge, unwritten rules. Draws on Cooke's elicitation techniques and Nonaka's Externalization phase.

- **A knowledge curation capability** — Refining raw extracted knowledge into structured, versioned knowledge assets. Maintaining a knowledge graph with provenance. Detecting knowledge decay and contradiction. Exposing assets through a consumable interface for other Convoke perimeters. Draws on Boisot's I-Space and Davenport & Prusak's knowledge market.

**Brownfield specificity:** In brownfield projects, knowledge engineering is arguably the *first* perimeter that should activate — before discovery, before readiness assessment, before anything. The existing system's knowledge is the primary input to every other lifecycle activity.

---

## 5. Domain Mesh: A Reference Pattern for Specialized Disciplines

> **Scope clarification:** This section describes an **architectural reference pattern** — not a commitment to build mesh infrastructure within Convoke itself. The pattern is relevant to the *projects and organizations* that Convoke supports: when teams use Convoke to build products that involve data science, ML, agentic AI, or platform engineering, this pattern describes how those specialized disciplines could be organized. It also informs how future Convoke perimeters for these disciplines might be structured, but the pattern itself lives at the product/organization level, not at the Convoke tooling level.

### 5.1 The Problem: Monolithic vs. Decentralized Specialization

Products and organizations that span multiple technical disciplines face a recurring tension. On one hand, lifecycle activities need domain-specific expertise (discovery needs data analysis, readiness assessment needs ML model evaluation, delivery needs ML deployment patterns). On the other hand, centralizing all data science or ML expertise in one team or one tool creates a bottleneck and violates the principle of domain ownership.

This tension mirrors exactly the problem that Data Mesh, Service Mesh, and now Agentic Mesh patterns were designed to solve in their respective domains. The insight is: **specialized disciplines should be organized as decentralized, self-serve, federated capabilities** — not as centralized teams or monolithic modules.

### 5.2 Mesh Pattern Foundations

**Data Mesh:**

- **Data Mesh** — Dehghani, Z. (2022). *Data Mesh: Delivering Data-Driven Value at Scale*. O'Reilly. ISBN: 9781492092391. Four principles: domain-oriented data ownership, data as a product, self-serve data infrastructure, federated computational governance. **The foundational analogy for Convoke's domain mesh: treat specialized capabilities as products owned by domains, not centralized services.**

- **Domain Ownership** — In Data Mesh, the team that produces data owns its quality and discoverability. Applied to Convoke: the team that produces ML models owns the ML assessment capability, the team that produces data pipelines owns the data quality capability.

**Service Mesh:**

- **Service Mesh Pattern** — Istio Project / Linkerd. (2017–ongoing). Sidecar proxy pattern for service-to-service communication: observability, traffic management, security, without modifying application code. The architectural insight: **infrastructure concerns (how modules communicate) are separated from business concerns (what modules do).**

- **Event Mesh** — Solace. (2017–ongoing). Event-driven architecture patterns. Extends mesh thinking to asynchronous, event-based communication. Relevant to how Convoke modules could share signals asynchronously rather than through synchronous handoff contracts only.

**Agentic Mesh (emerging):**

- **Agentic Mesh** — Broda, B. (2025). "Agentic Mesh: The Future of Generative AI-Enabled Autonomous Agent Ecosystems." *Medium / Data Science*. https://medium.com/data-science/agentic-mesh-the-future-of-generative-ai-enabled-autonomous-agent-ecosystems-d6a11381c979. Proposes mesh topology for AI agent ecosystems: decentralized agent discovery, capability advertisement, dynamic routing, and federated governance. **The most directly relevant pattern for Convoke's expansion.**

**Hexagonal Architecture & Domain-Driven Design:**

- **Hexagonal Architecture (Ports & Adapters)** — Cockburn, A. (2005, updated 2024). *Hexagonal Architecture Explained*. The application core is isolated from external concerns through ports (interfaces) and adapters (implementations). **Applied to Convoke: each domain module exposes capabilities through standard ports, and adapters handle the specifics of connecting to other modules or external systems.**

- **Clean Architecture** — Martin, R. C. (2017). *Clean Architecture: A Craftsman's Guide to Software Structure and Design*. Prentice Hall. Dependency rule: dependencies always point inward toward higher-level policies. Informs how domain modules depend on the core platform, not on each other.

- **Domain-Driven Design** — Evans, E. (2003). *Domain-Driven Design: Tackling Complexity in the Heart of Software*. Addison-Wesley. Bounded Contexts and Context Mapping. **Each specialized discipline is a Bounded Context with explicit interfaces to other contexts.** Vernon, V. (2013). *Implementing Domain-Driven Design*. Addison-Wesley. Practical patterns for bounded context integration.

**Composable & Federated Architectures:**

- **Composable Architecture** — Gartner. (2024). "Composable Business and Technology." Modular, interchangeable components assembled to meet specific needs. Each component is independently deployable, manageable, and replaceable.

- **Federated Governance** — From Data Mesh: governance is not centralized but federated across domain owners, with shared standards and interoperability contracts. Applied to Convoke: each domain module governs its own quality standards while adhering to shared handoff contract formats.

- **Cell-Based Architecture** — WSO2. (2024). Self-contained, independently deployable units of business functionality. Each cell encapsulates compute, data, and governance. Relevant to how domain modules could be self-contained yet composable.

### 5.3 The Domain Mesh Pattern (Reference Architecture)

Drawing from these foundations, here is the reference pattern for how specialized disciplines could interconnect — applicable to the products and organizations Convoke supports, and a potential inspiration for future Convoke perimeters:

```
  DOMAIN MESH PATTERN
  ════════════════════

  ┌─────────────────────────────────────────────────────────────────────────┐
  │                    MESH INFRASTRUCTURE LAYER                           │
  │  Discovery · Routing · Capability Registry · Governance Contracts      │
  └─────────────────────────────────────────────────────────────────────────┘
       │              │              │              │              │
  ┌────▼────┐   ┌────▼────┐   ┌────▼────┐   ┌────▼────┐   ┌────▼────┐
  │ DataOps │   │  MLOps  │   │ AgentOps│   │ SecOps  │   │  ...    │
  │ Domain  │   │ Domain  │   │ Domain  │   │ Domain  │   │ Domain  │
  │         │   │         │   │         │   │         │   │         │
  │ Ports:  │   │ Ports:  │   │ Ports:  │   │ Ports:  │   │ Ports:  │
  │ ·assess │   │ ·assess │   │ ·assess │   │ ·assess │   │ ·assess │
  │ ·build  │   │ ·build  │   │ ·build  │   │ ·build  │   │ ·build  │
  │ ·monitor│   │ ·monitor│   │ ·monitor│   │ ·monitor│   │ ·monitor│
  │ ·advise │   │ ·advise │   │ ·advise │   │ ·advise │   │ ·advise │
  └─────────┘   └─────────┘   └─────────┘   └─────────┘   └─────────┘
       ▲              ▲              ▲              ▲              ▲
       │              │              │              │              │
  ┌────┴──────────────┴──────────────┴──────────────┴──────────────┴────┐
  │              LIFECYCLE PERIMETERS (consumers of domain capabilities)  │
  │  Strategy · Discovery · Design · Build · Readiness · Delivery · ... │
  └─────────────────────────────────────────────────────────────────────┘
```

**Four principles (inspired by Data Mesh):**

1. **Domain-oriented ownership** — Each specialized discipline (DataOps, MLOps, AgentOps, etc.) is owned by a domain module with its own agents, workflows, and quality standards. No centralized "data team" or "ML team" module.

2. **Capability as a product** — Each domain module exposes its capabilities through standardized ports (assess, build, monitor, advise). Lifecycle modules consume these capabilities without needing to understand domain internals.

3. **Self-serve mesh infrastructure** — A shared infrastructure layer provides discovery (which domain modules exist), routing (how to reach them), capability registry (what they offer), and governance contracts (how they interoperate). This is analogous to the service mesh's sidecar proxy layer.

4. **Federated governance** — Each domain module governs its own quality, but all adhere to shared standards: handoff contract format, capability port interface, quality metrics, and compliance baselines.

### 5.4 Proposed Domain Modules

**A DataOps domain:**

Specialized in data pipeline design, data quality, and data-as-a-product patterns.

- Dehghani, Z. (2022). *Data Mesh*. O'Reilly. Domain-oriented data ownership.
- Huyen, C. (2022). *Designing Machine Learning Systems*. O'Reilly. ISBN: 9781098107963. Data engineering foundations for ML systems.
- DataKitchen. (2020–ongoing). *DataOps Cookbook*. https://datakitchen.io/. Practical DataOps methodology.

**Ports:** Data quality assessment, pipeline design, data catalog curation, data lineage tracking.

**An MLOps domain:**

Specialized in ML model lifecycle: training, evaluation, deployment, monitoring, and governance.

- Google Cloud. (2021–ongoing). *MLOps: Continuous delivery and automation pipelines in machine learning*. https://cloud.google.com/architecture/mlops-continuous-delivery-and-automation-pipelines-in-machine-learning. MLOps maturity model (Levels 0–2).
- Huyen, C. (2025). *AI Engineering*. O'Reilly. ISBN: 9781098166298. Emerging discipline bridging ML research and production engineering.
- Sculley, D. et al. (2015). "Hidden Technical Debt in Machine Learning Systems." *NeurIPS 2015*. The foundational paper on ML-specific technical debt.

**Ports:** Model assessment, training pipeline design, model monitoring, bias/fairness audit.

**An AgentOps domain:**

Specialized in AI agent lifecycle: design, testing, deployment, observability, and governance of agentic systems.

- Anthropic. (2024). "Model Context Protocol (MCP)." https://modelcontextprotocol.io/. Standard for agent-to-tool connectivity.
- Google. (2024). "Agent-to-Agent Protocol (A2A)." Standard for inter-agent communication.
- Linux Foundation. (2025). *Agentic AI Foundation*. Open infrastructure for agentic AI in production. https://www.linuxfoundation.org/press/linux-foundation-announces-the-formation-of-the-agentic-ai-foundation.
- McKinsey / IBM. (2025). AgentOps emerging practices for operating AI agent systems in production.

**Ports:** Agent assessment, agent testing, agent monitoring, agent governance.

**A PlatformOps domain:**

Specialized in internal developer platform, infrastructure-as-code, and developer experience.

- Skelton, M. & Pais, M. (2019). *Team Topologies*. IT Revolution Press. Platform teams as enablers.
- Gartner. (2024). "Composable Business and Technology." Modular, interchangeable infrastructure components.

**Ports:** Infrastructure assessment, platform capability exposure, developer experience audit.

### 5.5 The Hexagonal Interface Contract — With Asymmetric Maturity

Inspired by Cockburn's Ports & Adapters, each domain module exposes capabilities through a standard set of **ports** — abstract interfaces that lifecycle perimeters can consume. The port *types* are uniform, but their availability and maturity are not.

```
  PORT INTERFACE (standard types across all domain modules):

  advise(question)  → Domain-specific guidance with references
  assess(context)   → Assessment artifact (gaps, risks, maturity level)
  build(spec)       → Implementation artifact (pipeline, model, agent, infra)
  monitor(target)   → Monitoring configuration + dashboard
```

**Asymmetric maturity:** Not every domain module implements all four ports, and not all ports are equally mature. A domain module registers which ports it supports and at what maturity level:

```
  PORT MATURITY MODEL:

  Level 0: Not available     — port not implemented
  Level 1: Advise            — expertise available, no automation
  Level 2: Assess            — can evaluate current state, produce gap analysis
  Level 3: Build             — can produce implementation artifacts
  Level 4: Monitor           — can observe outcomes and detect drift

  EXAMPLE — current maturity by domain:

  Domain        advise    assess    build     monitor
  ─────────────────────────────────────────────────────
  DataOps       Level 1   Level 0   Level 0   Level 0
  MLOps         Level 1   Level 1   Level 0   Level 0
  AgentOps      Level 1   Level 2   Level 1   Level 0
  PlatformOps   Level 1   Level 1   Level 0   Level 0
```

This mirrors how real consulting practices mature: you start by giving advice (Level 1), then you systematize assessment (Level 2), then you build tooling (Level 3), then you monitor outcomes (Level 4). Forcing all four ports from day one is architectural over-engineering — the asymmetric model provides a natural evolution path where a domain starts with `advise` and graduates to full capability as demand and expertise grow.

**Practical implications:**

- Lifecycle perimeters discover available ports through the mesh's capability registry — they don't assume all ports exist
- Port maturity is self-declared and can be queried: `MLOps.maturity("assess")` → `Level 1`
- The gap between current maturity and desired maturity becomes a visible signal for investment priority
- Some domains may be inherently stronger on certain ports (security is often better at `assess` than `build` — finding problems is easier than fixing them automatically)

This means Gyre can call `MLOps.assess(codebase)` to get an ML readiness assessment (if that port is mature enough), or Vortex can call `DataOps.advise("what data do we have on user behavior?")` to get data-informed discovery input — without either lifecycle perimeter needing to understand ML or DataOps internals. If a port isn't available at the required maturity level, the mesh routes the request to a human expert or flags it as a capability gap.

### 5.6 Relationship to Convoke

The Domain Mesh pattern is not something Convoke needs to *build* — it's something Convoke should *understand and support*. When Convoke's lifecycle perimeters (discovery, readiness, delivery, etc.) encounter projects that span multiple technical disciplines, this pattern informs how those disciplines relate. It also suggests that if Convoke eventually adds perimeters for data engineering, ML, or agentic engineering, those perimeters should be designed as composable, port-based capabilities rather than monolithic modules — enabling extensibility without tight coupling.

---

## 6. Organizational Transformation Dimension

### 6.1 Classical Change Management

Introducing new agentic capabilities across an organization follows patterns well-documented in change management literature.

**Macro-level change leadership:**

- **Kotter's 8-Step Model** — Kotter, J. (1996, updated 2014). *Leading Change* / *Accelerate*. Harvard Business School Press. Eight-step model: create urgency → build guiding coalition → form vision → enlist volunteers → enable action → generate short-term wins → sustain acceleration → institute change. Provides the sequence for rolling out Convoke modules organization-wide.

- **Lewin's Change Model** — Lewin, K. (1947). Unfreeze → Change → Refreeze. The classic three-stage model helps frame each new Convoke module adoption as requiring: unfreezing current practices, transitioning to agent-augmented workflows, and stabilizing new behaviors.

**Individual-level adoption:**

- **ADKAR Model** — Hiatt, J. (2000s–ongoing). Prosci. Awareness → Desire → Knowledge → Ability → Reinforcement. Individual-centered model emphasizing that organizational change only succeeds when individuals change. Practical for designing adoption programs per team.

- **Bridges' Transition Model** — Bridges, W. & Bridges, S. (1991). *Managing Transitions*. Hachette. Distinguishes external change from internal psychological transition: Ending → Neutral Zone → New Beginning. Addresses the emotional journey of team members whose roles evolve alongside agent capabilities.

**Organizational alignment:**

- **McKinsey 7-S Framework** — Peters, T. & Waterman, R. (1982). *In Search of Excellence*. Harper & Row. Seven interconnected elements: Structure, Strategy, Systems, Skills, Staff, Style, Shared Values. Ensures that adding new Convoke modules is accompanied by changes in all dimensions — not just technology.

### 6.2 Organizational Design for an Agentic Era

The introduction of AI agents fundamentally challenges existing organizational structures.

**Team topology:**

- **Team Topologies** — Skelton, M. & Pais, M. (2019, 2nd ed. 2024). *Team Topologies: Organizing Business and Technology Teams for Fast Flow*. IT Revolution Press. Four team types (Stream-aligned, Enabling, Complicated-subsystem, Platform) and three interaction modes (Collaboration, X-as-a-Service, Facilitating). As Convoke modules multiply, human teams need to be reorganized around value streams where agents participate — not around functions that agents partially absorb.

- **unFIX Model** — Appelo, J. (2021–ongoing). *The unFIX Model*. https://unfix.com/. Pattern library for organizational design emphasizing versatility over fixed frameworks. Appelo's 2023–2024 work specifically addresses organizational design in the age of AI, advocating for continuous organizational iteration alongside agent capability evolution.

- **Conway's Law & Inverse Conway Maneuver** — Conway, M. (1967); LeRoy, J. & Simons, M. (2010). System architecture mirrors organizational structure. The inverse maneuver deliberately restructures teams to produce desired architectures. As Convoke adds modules, team boundaries should be designed to *enable* autonomous agent ecosystems.

- **Sociotechnical Systems Theory** — Trist, E. & Bamforth, K. (1951). Tavistock Institute. Organizations as open systems with interdependent social and technical subsystems. The principle of *joint optimization* — best match between social and technical — is critical when agents (technical) must integrate with human teams (social).

**Dynamic adaptation:**

- **Dynamic Capabilities** — Teece, D., Pisano, G. & Shuen, A. (1997). "Dynamic Capabilities and Strategic Management." *Strategic Management Journal*. A firm's ability to adapt, integrate, and reconfigure resources for changing environments. Provides the strategic frame for how organizations develop capacity to continuously evolve their agent deployment.

### 6.3 Agentic Transformation: What Makes This Different

The transformation driven by AI agents is qualitatively different from previous technology adoptions. Recent research (2024–2026) identifies specific patterns.

**Role transformation:**

- **Cyborgs, Centaurs, and Self-Automators** — Randazzo, S., Lifshitz-Assaf, H., Kellogg, K., Dell'Acqua, F., Mollick, E. et al. (2024). Harvard Business School / SSRN. Three human-AI collaboration models: Centaurs (clear task division between human and AI), Cyborgs (fluid, integrated task blending), Self-Automators (delegation with minimal engagement). Each model produces different learning and career outcomes. Centaurs upskill domain expertise; Cyborgs develop AI-native skills. Organizations need to consciously design which model they encourage.

- **Anthropic Case Study** — Anthropic. (2025–2026). "How AI Is Transforming Work at Anthropic." Engineers self-describe as "managers of AI agents" spending 70%+ time on code review/revision rather than net-new code. Live organizational case study of role transformation in an agentic organization.

- **Generative AI at Work** — Brynjolfsson, E. & Li, D. (2023–2024). NBER Working Paper. Empirical study: 15% average productivity gain, with less experienced workers benefiting most (both speed and quality). Heterogeneous effects by skill level demand differentiated organizational responses.

**Organizational redesign for agents:**

- **The Agentic Organization** — McKinsey & Company. (2025–2026). "The Agentic Organization: Contours of the Next Paradigm for the AI Era." Framework for how organizations fundamentally restructure: flatter structures, higher context sharing, rapid decision-making, with AI agents as organizational participants rather than just tools.

- **Google Cloud AI Agent Trends 2026** — Google Cloud. (2026). Five shifts: Task-to-Role-Based AI, Multi-Agent Orchestration, Governance and Real-Time Controls, Team Empowerment (Managers of Agents), Measurable Results Focus. 1,445% surge in multi-agent system inquiries Q1–Q2 2025.

- **Co-Intelligence** — Mollick, E. (2024). *Co-Intelligence: Living and Working with AI*. Penguin Random House. Three structural pillars: AI in leadership, AI labs, democratize AI to the crowd. Practical framework for organizational leaders.

### 6.4 Governance Frameworks

As Convoke expands across the lifecycle, governance becomes essential — both for the agent system itself and for the decisions agents participate in.

**Decision governance:**

- **Cynefin Framework** — Snowden, D. (1999–ongoing). "A Leader's Framework for Decision Making." *Harvard Business Review* (2007). Five domains: Clear, Complicated, Complex, Chaotic, Disorder. Helps determine which decisions agents can handle autonomously (Clear/Complicated) versus which require human judgment (Complex/Chaotic).

- **DACI Framework** — Atlassian (2010s). Driver, Approver, Contributors, Informed. When agents participate in decisions, DACI needs extension to clarify agent roles: can an agent be a Driver? A Contributor? How is accountability maintained?

**Technology & AI governance:**

- **TOGAF** — The Open Group. *TOGAF Standard, Version 9.2*. Architecture Development Method with governance processes. 80% Fortune 500 adoption. Provides structured governance for technology decisions including AI agent architecture.

- **IEEE 7000 Series** — IEEE Global Initiative on Ethics of Autonomous and Intelligent Systems. (2019–present). Five core principles: Human Rights, Well-being, Accountability, Transparency, Minimizing Misuse. Framework for responsible AI governance.

- **EU AI Act** — European Union. (2024). *Regulation (EU) 2024/1689*. Risk-based framework with compliance requirements for AI systems. As Convoke agents participate in product decisions, they may themselves fall under regulatory scope.

- **ISO/IEC 42001** — ISO/IEC. (2023). First international standard for AI management systems. Enables formal governance, audit, and certification of AI practices.

### 6.5 Adoption & Diffusion

Rolling out new Convoke modules across an organization follows adoption dynamics documented in diffusion research.

- **Diffusion of Innovations** — Rogers, E. (1962, 5th ed. 2003). *Diffusion of Innovations*. Free Press. Innovators → Early Adopters → Early Majority → Late Majority → Laggards. Five factors: relative advantage, compatibility, complexity, trialability, observability. Each new Convoke module needs a diffusion strategy.

- **Crossing the Chasm** — Moore, G. (1991, 3rd ed. 2014). *Crossing the Chasm*. HarperCollins. The gap between early adopters (visionaries) and early majority (pragmatists) requires different messaging and whole-product strategies. Relevant to moving Convoke from pilot teams to organization-wide adoption.

- **Behavioral Design** — Fogg, B. J. (2019). *Tiny Habits*. Houghton Mifflin Harcourt. Behavior = Motivation + Ability + Prompt. Designing micro-behaviors that make agent adoption frictionless. Eyal, N. (2014). *Hooked*. Penguin. Trigger → Action → Variable Reward → Investment. Designing internal tools that teams naturally adopt.

- **Nudge Theory** — Thaler, R. & Sunstein, C. (2008). *Nudge: Improving Decisions About Health, Wealth, and Happiness*. Yale University Press. Choice architecture that alters behavior predictably without restricting options. Making agent-augmented workflows the default path of least resistance.

- **Psychological Safety** — Edmondson, A. (1999–ongoing). Harvard Business School. Shared belief that a team is safe for interpersonal risk-taking. Foundational for teams experimenting with AI agents, reporting issues, and learning from failures. Across all literature reviewed, psychological safety emerges as the strongest predictor of successful AI adoption.

---

## 7. Synthesis: Towards a Full-Lifecycle Agentic Platform

### 7.1 Infrastructure vs. Practice Perimeters

Before presenting the module map, a structural distinction must be made explicit. The proposed perimeters are not architecturally equivalent — they fall into two fundamentally different categories:

**Infrastructure perimeters** enable other perimeters to function. They don't prescribe what to do; they make it possible to do it better. They are supportive, foundational, and consumed by practice perimeters:

- **Knowledge engineering** — extracts and exposes knowledge that every other perimeter consumes
- **Systematic documentation** — captures and organizes artifacts across the lifecycle
- **Domain mesh infrastructure** — provides discovery, routing, and governance for specialized capabilities
- **Entropy management** — monitors the continued validity of artifacts across all perimeters (see Section 7.5)

**Practice perimeters** encode a discipline. They are opinionated — they prescribe workflows grounded in specific theoretical foundations:

- **Strategy** encodes strategic analysis (Porter, Wardley, Blue Ocean)
- **Delivery** encodes release engineering (Continuous Delivery, feature flags)
- **Growth** encodes product-led growth practices (AARRR, PLG, experimentation)
- **Operations** encodes SRE (SLOs, incident management, chaos engineering)
- **Security** encodes threat modeling, DevSecOps, and compliance workflows
- **Sunset** encodes technical debt management and legacy modernization
- **Governance & change** encodes organizational transformation practices

This distinction matters for dependencies, sequencing, and communication. "You need knowledge engineering before you need anything else" is easier to justify when it is visibly in a different category. Infrastructure perimeters are prerequisites; practice perimeters are choices driven by where gravitational pull is strongest (see Section 2.1).

### 7.2 Proposed Module Map

Combining the lifecycle gap analysis, knowledge engineering, and domain mesh pattern, here is the proposed expansion of Convoke organized along three axes. Per the gravity model (Section 2.1), the lifecycle axis is not a pipeline — perimeters activate based on evidence and risk, not sequence.

```
  ═══════════════════════════════════════════════════════════════════════════════
  AXIS 1: LIFECYCLE (gravity model — evidence determines pull, not sequence)
  ═══════════════════════════════════════════════════════════════════════════════

  PRACTICE PERIMETERS (encode a discipline — opinionated workflows):

         Strategy    Discovery    Design     Build      Readiness    Delivery
         ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐
         │Strategy│  │ VORTEX │  │  WDS   │  │  BMM   │  │  GYRE  │  │Delivery│
         │ perim. │  │ 7 agts │  │  BMM   │  │  TEA   │  │ 4 agts │  │ perim. │
         └────────┘  └────────┘  └────────┘  └────────┘  └────────┘  └────────┘

         Growth       Operations   Security    Sunset
         ┌────────┐  ┌──────────┐  ┌────────┐  ┌────────┐
         │ Growth │  │Operations│  │Security│  │ Sunset │
         │ perim. │  │ perimeter│  │ perim. │  │ perim. │
         └────────┘  └──────────┘  └────────┘  └────────┘

                     ◀── gravitational pull shifts with evidence ──▶

  ═══════════════════════════════════════════════════════════════════════════════
  AXIS 2: DOMAIN MESH (reference pattern — what expertise is needed)
  ═══════════════════════════════════════════════════════════════════════════════

  ┌─────────────────────────────────────────────────────────────────────────────┐
  │            MESH PATTERN (discovery · routing · governance)                  │
  ├───────────┬───────────┬───────────┬───────────┬─────────────────────────────┤
  │ DataOps   │  MLOps    │  AgentOps │ PlatformOps│  ... (extensible)         │
  │ domain    │  domain   │  domain   │  domain   │                            │
  └───────────┴───────────┴───────────┴───────────┴─────────────────────────────┘

  ═══════════════════════════════════════════════════════════════════════════════
  AXIS 3: CROSS-CUTTING CAPABILITIES
  ═══════════════════════════════════════════════════════════════════════════════

  INFRASTRUCTURE PERIMETERS (enable other perimeters — supportive, foundational):

  ┌─────────────────────────────────────────────────────────────────────────────┐
  │ Knowledge Engineering — active extraction, refinement, exposition          │
  ├─────────────────────────────────────────────────────────────────────────────┤
  │ Systematic Documentation — Diátaxis-based, docs-as-code                   │
  ├─────────────────────────────────────────────────────────────────────────────┤
  │ Entropy Management — artifact validity monitoring across all perimeters    │
  └─────────────────────────────────────────────────────────────────────────────┘

  CROSS-CUTTING PRACTICE PERIMETERS (encode a discipline that spans all phases):

  ┌─────────────────────────────────────────────────────────────────────────────┐
  │ Security & Compliance — proactive, lifecycle-spanning                      │
  ├─────────────────────────────────────────────────────────────────────────────┤
  │ Governance, Change Management & Adoption — meta-perimeter (lens from       │
  │ Wave 0, full perimeter from Wave 2)                                        │
  └─────────────────────────────────────────────────────────────────────────────┘

  EXISTING SUPPORT:
  CIS (Creative & Innovation) · BMB (Builder) · Enhance (Skills) · Team Factory
```

### 7.3 The Three-Axis Architecture

This expansion introduces a conceptual shift from a linear pipeline to a **gravity-driven, three-axis architecture**:

The **Lifecycle axis** describes the *practice perimeters* — the disciplines that activate based on gravitational pull from evidence and risk (Section 2.1). Early in a product's life, strategy and discovery have the strongest pull. As you approach production, readiness and delivery dominate. Post-launch, growth and operations take over. But at any point, new evidence can shift gravity back. Perimeters are connected by handoff contracts, but the flow between them is non-linear.

The **Domain Mesh axis** is a *reference pattern* describing *what expertise* is needed — data, ML, agents, platform. This pattern applies to the projects and organizations Convoke supports, and would inform the design of any future domain-specialized Convoke perimeters.

The **Cross-cutting axis** contains both *infrastructure perimeters* (knowledge engineering, documentation, entropy management) that enable everything else, and *cross-cutting practice perimeters* (security, governance & change) that encode disciplines spanning all lifecycle phases.

### 7.4 The Governance & Change Perimeter: A Unique Addition

Among all proposed perimeters, one stands apart: a **governance, change management, and adoption perimeter** specifically designed to facilitate the organizational transformation that Convoke's own expansion creates. This is a meta-perimeter: it helps organizations adopt the other perimeters.

**Potential capabilities:**

- **Change architecture** — Designing adoption strategies using Kotter, ADKAR, and diffusion theory. Mapping organizational readiness. Creating phased rollout plans for new Convoke perimeters.
- **Governance design** — Structuring decision rights using Cynefin and DACI. Defining where agents operate autonomously vs. where human oversight is required. Mapping compliance requirements (EU AI Act, ISO 42001).
- **Adoption facilitation** — Applying behavioral design (Fogg, Eyal, Thaler) to maximize perimeter adoption. Monitoring psychological safety indicators. Designing nudges and habit loops for agent-augmented workflows.

This perimeter would draw on:
- Change management (Kotter, Lewin, ADKAR, Bridges)
- Organizational design (Team Topologies, unFIX, Conway's Law, Sociotechnical Systems)
- Agentic transformation research (Mollick, McKinsey, Anthropic, Brynjolfsson)
- Governance (Cynefin, TOGAF, IEEE 7000, EU AI Act)
- Adoption & diffusion (Rogers, Moore, Fogg, Edmondson)

### 7.5 Entropy as a Cross-Cutting Force

The document's gap analysis (Section 2) and the sunset perimeter (Section 3.7) treat artifact degradation as a lifecycle endpoint — something that happens at the end. But real systems decay continuously. Knowledge goes stale. Security postures drift. Operational runbooks become outdated. Architecture decisions made during strategy become constraints that the sunset perimeter eventually has to unwind. This is not a phase — it is a force acting on every perimeter at all times.

> **Entropy principle:** Every artifact, decision, and knowledge asset produced by any perimeter has a half-life. The question is not *whether* it will degrade, but *when* — and whether the degradation will be detected before it causes harm.

**Theoretical grounding:**

- **Second Law of Thermodynamics (metaphorical)** — In information systems as in physics, order naturally tends toward disorder without active energy input. Software entropy was first described by Lehman, M. M. (1980). "Programs, Life Cycles, and Laws of Software Evolution." *Proceedings of the IEEE*, 68(9), 1060–1076. Lehman's laws of software evolution establish that systems must be continually adapted or they become progressively less satisfactory.

- **Cognitive Debt** — Storey, M. (2026). "How Generative and Agentic AI Shift Concern from Technical Debt to Cognitive Debt." As AI generates more code and artifacts, human understanding erodes. Entropy applies not just to the artifacts themselves but to the organization's *comprehension* of those artifacts — an accelerating risk in agentic contexts.

- **Knowledge Decay** — De Holan, P. M. & Phillips, N. (2004). "Remembrance of Things Past? The Dynamics of Organizational Forgetting." *Management Science*, 50(11), 1603–1613. Organizations don't just fail to learn — they actively forget. Knowledge assets degrade through staff turnover, context loss, and environmental change.

**Practical manifestation:** Rather than treating entropy management as a separate perimeter, it should manifest as a **lightweight validation protocol** that any perimeter can invoke on its own artifacts. Every perimeter would have a "sensitize" function — inspired by Noah's role in Vortex (Sensitize — interpreting signals and detecting changes) — that monitors the continued validity of its outputs.

This could take the form of:

- **Staleness detection** — automated checks for knowledge assets, documentation, security assessments, and operational procedures that haven't been validated against their current context within a defined period
- **Drift monitoring** — comparison of the assumptions underlying a perimeter's artifacts against the current state of evidence (has the market shifted since the strategy was defined? have dependencies changed since the security assessment?)
- **Decay scoring** — a quantitative signal indicating how much confidence remains in an artifact, analogous to error budgets in SRE but applied to knowledge and decision artifacts

This connects the entropy concern from open question 6 in Section 7.7 (knowledge asset lifecycle) to a structural principle: entropy is not a phase to be handled at lifecycle end, but a cross-cutting force that every perimeter must account for continuously.

### 7.6 Priorities and Sequencing

Not all perimeters need to be built simultaneously. The sequencing below represents a *default gradient* — the typical order in which gravitational pull is strongest for most organizations (see Section 2.1). It is not a prescribed sequence: organizations should build perimeters where gravity pulls hardest for their current adopters.

> **Key adjustment:** The governance and change management dimension is not deferred to the last wave. The *principles* — adoption lens, change readiness, smallest useful entry point, resistance anticipation — must be embedded from Wave 0. Every perimeter built from Wave 1 onward should be designed with adoption patterns already considered: What's the "tiny habit" version? What resistance patterns should it anticipate? A full governance perimeter with dedicated agents comes in Wave 2, but the *lens* is present from the start.

**Wave 0 — Foundations (infrastructure perimeters + governance lens):**
- **Knowledge engineering perimeter** — In brownfield contexts, this activates *first*. Extracts the knowledge that every other perimeter needs. In greenfield, it activates as soon as there's a codebase to mine.
- **Governance & change lens** — Not a full perimeter yet, but the principles are active: every Wave 1+ perimeter is designed with adoption patterns (Fogg's tiny habits, Rogers' diffusion factors, Edmondson's psychological safety). This means defining the smallest useful entry point, the expected resistance patterns, and the behavioral nudges for each perimeter before it ships.
- **Entropy monitoring baseline** — The staleness detection and drift monitoring protocols (Section 7.5) are established as a shared capability that all subsequent perimeters inherit.

**Wave 1 — Complete the core lifecycle loop (practice perimeters where gravity is typically strongest):**
- **Delivery perimeter** — Bridges the Gyre-to-production gap
- **Operations perimeter** — Operationalizes Gyre's readiness findings
- **Security perimeter** — Elevates Gyre's security assessment to a proactive discipline

**Wave 2 — Extend lifecycle coverage + full governance perimeter:**
- **Strategy perimeter** — Grounds discovery in strategic context
- **Growth perimeter** — Closes the post-launch feedback loop
- **Documentation perimeter** — Prevents knowledge loss as perimeters multiply
- **Governance & change perimeter (full)** — Graduates from lens to full meta-perimeter with dedicated agents for change architecture, governance design, and adoption facilitation. By this point, there are enough perimeters in production to require systematic transformation management.

**Wave 3 — Complete the picture:**
- **Sunset perimeter** — Full lifecycle closure
- **Domain-specialized perimeters** (AgentOps, MLOps, DataOps, PlatformOps, etc.) — as demand dictates, informed by the domain mesh reference pattern. These start at port maturity Level 1 (advise) and graduate to higher levels as the domain matures (see Section 5.5).

### 7.7 Open Questions for Further Exploration

Several theoretical and architectural questions merit deeper investigation:

1. **Agent-to-agent governance:** As modules multiply, how should inter-module handoff contracts be governed? The current HC/GC pattern works within teams — what about *across* teams? The domain mesh's federated governance principle (from Data Mesh) offers a starting point.

2. **Emergent behavior at scale:** With 40+ agents across 15+ modules, what emergent properties should we expect? What guardrails are needed? The AgentVerse (Chen et al., 2023) and Sociotechnical Systems literature offer starting points.

3. **Measuring transformation:** How do we measure the organizational impact of Convoke adoption? DORA metrics cover delivery, but what metrics capture discovery quality, knowledge asset health, adoption success, or governance maturity?

4. **Agent autonomy spectrum:** Cynefin suggests which decisions agents can handle autonomously. But what model governs the *progression* of autonomy over time? How does an organization safely increase agent delegation?

5. **Convoke's own governance:** As Convoke becomes a three-axis platform, how should the project itself be governed? TOGAF's Architecture Development Method, the Team Factory's composition patterns, and the mesh's federated governance offer structures, but the scale may require something new.

6. **Knowledge asset lifecycle:** How do knowledge assets age, decay, and get retired? What metrics indicate knowledge staleness vs. enduring value? Storey's (2026) cognitive debt concept suggests this is increasingly urgent as AI-generated code outpaces human comprehension. The entropy management framework (Section 7.5) addresses this structurally, but the specific metrics and thresholds remain open.

7. **Port interface evolution:** The asymmetric maturity model (Section 5.5) addresses how domains graduate from `advise` to full capability. But how do port interfaces themselves evolve without breaking lifecycle perimeter consumers? Versioning strategies from API design (semver, consumer-driven contracts) may apply.

8. **Mesh observability:** How do we observe the health of the mesh itself — which domain capabilities are most consumed, where are bottlenecks, where is expertise missing? Service mesh observability patterns (Istio, Linkerd) provide technical precedent.

---

*This document serves as the theoretical foundation for Convoke's lifecycle expansion. Five structural principles shape the architecture: (1) the lifecycle is a gravity model, not a pipeline — evidence shifts priority between perimeters; (2) infrastructure perimeters (knowledge engineering, documentation, entropy management) are categorically different from practice perimeters and must be built first; (3) entropy is a cross-cutting force, not a lifecycle endpoint — every perimeter monitors its own decay; (4) domain mesh ports mature asymmetrically — domains start with advice and graduate to full capability; (5) the governance and change management lens is active from Wave 0, not deferred to the end. Each proposed perimeter should be specified using the Team Factory workflow when it matures from exploration to commitment, with agent designs grounded in the references cited here.*
