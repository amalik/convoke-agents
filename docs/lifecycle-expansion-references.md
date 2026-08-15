# Lifecycle Expansion — Theoretical Foundations

> Companion reference to the [Lifecycle Expansion Vision](lifecycle-expansion-vision.md).
> This document houses the full theoretical foundations organized by perimeter.
> The vision document contains the ideas, principles, and architecture; this document provides depth.
>
> **Organization:** Follows the Diataxis framework — this is *reference* material (information-oriented),
> while the vision document is *explanation* material (understanding-oriented).

---

## Table of Contents

1. [Current Coverage: Module Detail](#1-current-coverage-module-detail)
2. [Strategy & Vision](#2-strategy--vision)
3. [Delivery & Release](#3-delivery--release)
4. [Growth & Adoption](#4-growth--adoption)
5. [Operations & Resilience](#5-operations--resilience)
6. [Security & Compliance](#6-security--compliance)
7. [Documentation](#7-documentation)
8. [Sunset & Technical Debt](#8-sunset--technical-debt)
9. [Knowledge Engineering](#9-knowledge-engineering)
10. [Domain Mesh Pattern Foundations](#10-domain-mesh-pattern-foundations)
11. [Organizational Transformation](#11-organizational-transformation)
12. [Entropy & Decay](#12-entropy--decay)

---

## 1. Current Coverage: Module Detail

Convoke currently covers five major lifecycle phases through its module ecosystem.

### 1.1 Discovery & Validation — Vortex (7 agents, 22 workflows)

The Vortex team implements Jurgen Appelo's Innovation Vortex pattern as a continuous, non-linear discovery engine. Emma handles problem framing and strategic context (Contextualize), Isla drives user research and empathy mapping (Empathize), Mila synthesizes research into JTBD-framed problem definitions (Synthesize), Liam engineers testable hypotheses and assumption maps (Hypothesize), Wade designs and runs lean experiments including MVPs, PoCs, and PoVs (Externalize), Noah interprets production signals and behavioral patterns (Sensitize), and Max captures validated learning and drives pivot/patch/persevere decisions (Systematize). The compass routing system creates a non-linear flow between streams based on evidence.

**Theoretical foundations:** Innovation Vortex (Appelo, 2022), Lean Startup (Ries, 2011), Jobs-to-be-Done (Christensen et al., 2016), Empathy Mapping (Gray et al., 2010), Build-Measure-Learn, Signal Detection Theory.

### 1.2 Design & Planning — WDS + BMM Phases 1-3

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

## 2. Strategy & Vision

This perimeter sits upstream of Vortex. Where Emma frames problems, a Strategy perimeter would frame the *space* in which problems are worth finding: market positioning, competitive dynamics, and business model coherence.

- **Competitive Strategy** — Porter, M. E. (1980). *Competitive Strategy: Techniques for Analyzing Industries and Competitors*. Free Press. The Five Forces framework (supplier power, buyer power, threat of substitutes, threat of new entrants, competitive rivalry) remains the standard for industry structure analysis.

- **Value Innovation** — Kim, W. C. & Mauborgne, R. (2005). *Blue Ocean Strategy: How to Create Uncontested Market Space and Make the Competition Irrelevant*. Harvard Business School Press. Contrasts competition in existing markets (Red Ocean) with creation of uncontested market space through value innovation.

- **Strategy Choice Cascade** — Lafley, A. G. & Martin, R. L. (2013). *Playing to Win: How Strategy Really Works*. Harvard Business Review Press. Five interconnected choices: winning aspiration, where to play, how to win, capabilities required, management systems.

- **Strategic Coherence** — Rumelt, R. P. (2011). *Good Strategy/Bad Strategy: The Difference and Why It Matters*. Crown Business. Distinguishes coherent strategy (diagnosis + guiding policy + coherent actions) from motivational platitudes.

- **Wardley Mapping** — Wardley, S. (2018). *Wardley Maps*. Self-published/Creative Commons. Strategic landscape visualization through value chain positioning and component evolution. Enables situational awareness and movement anticipation.

- **Business Model Design** — Osterwalder, A. & Pigneur, Y. (2010). *Business Model Generation*. Wiley. Business Model Canvas as shared language for business model description, visualization, and iteration.

**Potential agents:** Strategic Analyst (competitive landscape), Business Model Architect (value proposition and model design), Wardley Mapper (situational awareness and evolution).

---

## 3. Delivery & Release

This perimeter bridges Gyre's readiness assessment to actual production deployment. It covers release strategy, progressive delivery, and the mechanics of getting software safely to users.

- **Continuous Delivery** — Humble, J. & Farley, D. (2010). *Continuous Delivery: Reliable Software Releases through Build, Test, and Deploy Automation*. Addison-Wesley. Deployment pipeline patterns, infrastructure as code, release management.

- **Progressive Delivery & Feature Flags** — Hodgson, P. & Echague, P. (2020). *Feature Flag Best Practices*. O'Reilly. Eight best practices for feature flags enabling decoupling of deployment from release. Hodgson, P. (2012-present). "Feature Toggles (aka Feature Flags)." Martin Fowler's bliki. Comprehensive reference on toggle patterns and lifecycle management.

- **Trunk-Based Development** — Forsgren, N. et al. (2018). *Accelerate*. IT Revolution Press. Empirical evidence that trunk-based development correlates with elite delivery performance. Short-lived branches, continuous integration, small batch sizes.

- **Deployment Strategies** — Industry practices for canary deployments, blue-green deployments, rolling updates, and traffic shifting. Formalized in Kubernetes and cloud-native deployment patterns.

- **Release Engineering** — Beyer, B. et al. (2016). "Release Engineering" in *Site Reliability Engineering*. O'Reilly. Google's approach to release management as an engineering discipline.

**Potential agents:** Release Strategist (deployment patterns, risk assessment), Feature Flag Manager (progressive rollout, experimentation coupling), Rollback Analyst (failure detection, automated rollback criteria).

---

## 4. Growth & Adoption

This perimeter covers the post-launch product lifecycle: how users discover, adopt, activate, and retain with the product. It connects back to Vortex's discovery insights and Noah's production signals.

- **Product-Led Growth** — Bush, W. (2019). *Product-Led Growth: How to Build a Product That Sells Itself*. ProductLed Library. Shift from sales-driven to product-driven acquisition and expansion.

- **Pirate Metrics (AARRR)** — McClure, D. (2007). "AARRR! Pirate Metrics for Startups." Lean Analytics framework. Five-stage growth funnel: Acquisition, Activation, Retention, Referral, Revenue.

- **North Star Metric** — Ellis, S. (2013). "Finding Your North Star Metric." Growth Hackers. Single metric capturing core value delivered, with input metrics driving it. Aligns teams around a shared outcome.

- **Activation & Onboarding** — Gupta, A. & Reforge (2020-ongoing). Activation frameworks spanning Setup -> Aha Moment -> Habit Loop. Operationalizes the AARRR funnel's most critical conversion point.

- **JTBD for Growth** — Traynor, D., Adams, P. & Keating, G. (2016). *Intercom on Jobs-to-be-Done*. Intercom Books. Applies JTBD to product marketing, onboarding design, and feature adoption — bridging discovery insights to growth execution.

- **Experimentation at Scale** — Kohavi, R. et al. (2020). *Trustworthy Online Controlled Experiments*. Cambridge University Press. Statistical rigor in A/B testing and online experimentation for growth optimization.

**Potential agents:** Growth Analyst (funnel metrics, cohort analysis, North Star tracking), Onboarding Architect (activation flows, time-to-value optimization), Retention Strategist (churn analysis, engagement patterns, re-engagement campaigns).

---

## 5. Operations & Resilience

This perimeter extends Gyre's readiness assessment into actual operational practice: what happens when things go wrong, and how operational knowledge is captured and improved.

- **Site Reliability Engineering** — Beyer, B. et al. (2016). *Site Reliability Engineering: How Google Runs Production Systems*. O'Reilly. SLOs, SLIs, error budgets, incident management, postmortems. Beyer, B. et al. (2018). *The Site Reliability Workbook*. O'Reilly. Practical implementation patterns.

- **Incident Management** — PagerDuty. (2015-ongoing). *Incident Response Documentation*. https://response.pagerduty.com/. Best practices for incident response, runbook automation, escalation patterns.

- **Chaos Engineering** — Rosenthal, C. et al. (2020). *Chaos Engineering: System Resiliency in Practice*. O'Reilly. Proactive resilience testing through controlled failure injection. Principles: build hypothesis, vary real-world events, run experiments in production, automate.

- **Learning from Incidents** — Woods, D. D. (2017). "STELLA: Report from the SNAFUcatchers Workshop on Coping With Complexity." Ohio State University. Complex systems thinking applied to incident analysis. Beyond root cause to systemic understanding.

- **SLO Implementation** — Hidalgo, A. (2020). *Implementing Service Level Objectives*. O'Reilly. Detailed SLO methodology linking reliability targets to business outcomes through error budgets.

**Potential agents:** Incident Commander (structured incident response, communication, escalation), Runbook Engineer (operational procedure design and automation), Resilience Analyst (chaos experiment design, failure mode analysis, postmortem facilitation).

---

## 6. Security & Compliance

This perimeter elevates security from a Gyre assessment dimension to a proactive, lifecycle-spanning discipline with its own agents and workflows.

- **Threat Modeling** — Shostack, A. (2014). *Threat Modeling: Designing for Security*. Wiley. STRIDE framework (Spoofing, Tampering, Repudiation, Information Disclosure, Denial of Service, Elevation of Privilege). Systematic approach to identifying security threats early in design.

- **DevSecOps** — OWASP Foundation. (2021-ongoing). *DevSecOps Guideline & Maturity Model*. OWASP.org. Open framework for embedding security throughout the development pipeline. NIST. (2022). *Secure Software Development Framework (SSDF)*. NIST SP 800-218. Federal standards for secure development practices.

- **Software Supply Chain Security** — NTIA. (2021). *Minimum Elements for a Software Bill of Materials (SBOM)*. U.S. Department of Commerce. Standardized SBOM requirements for supply chain transparency. Extends SLSA (already referenced in Gyre).

- **EU AI Act** — European Union. (2024). *Regulation (EU) 2024/1689 on Artificial Intelligence*. Risk-based regulatory framework with specific compliance requirements for high-risk AI systems. Relevant as Convoke's agents themselves may fall under AI governance requirements.

- **NIST AI Risk Management** — NIST. (2023). *AI Risk Management Framework*. Voluntary framework for responsible AI development across the system lifecycle.

- **ISO/IEC 42001** — ISO/IEC. (2023). *AI Management System Standard*. First international standard for organizational AI governance, enabling audit and certification.

**Potential agents:** Threat Modeler (STRIDE analysis, attack surface mapping), Compliance Analyst (regulatory mapping, EU AI Act / NIST alignment), Supply Chain Auditor (SBOM generation, dependency vulnerability analysis).

---

## 7. Documentation

This perimeter addresses the systematic capture, organization, and evolution of knowledge across the entire lifecycle.

- **Diataxis Framework** — Procida, D. (2017-ongoing). *Diataxis: A Systematic Framework for Technical Documentation*. https://diataxis.fr/. Four documentation types organized by user need: Tutorials (learning-oriented), How-to Guides (task-oriented), Reference (information-oriented), Explanation (understanding-oriented).

- **Docs-as-Code** — Gentle, A. (2017, 3rd ed. 2022). *Docs Like Code*. Just Write Click. Developer-writer collaboration workflows using version control, CI/CD, and automated publishing.

- **Architecture Decision Records** — Nygard, M. (2011). "Documenting Architecture Decisions." Cognitect Blog. Lightweight decision documentation pattern capturing context, decision, and consequences. Adopted by Thoughtworks Technology Radar (2018).

- **Knowledge Creation** — Nonaka, I. & Takeuchi, H. (1995). *The Knowledge-Creating Company*. Oxford University Press. SECI model (Socialization, Externalization, Combination, Internalization) for systematic knowledge conversion from tacit to explicit.

- **Organizational Learning** — Senge, P. M. (1990). *The Fifth Discipline*. Doubleday. Systems thinking as the integrating discipline for learning organizations. Mental models, shared vision, team learning.

**Potential agents:** Documentation Strategist (Diataxis-based documentation planning), Knowledge Curator (cross-lifecycle knowledge synthesis, ADR management), Learning Librarian (organizational learning capture, pattern identification).

---

## 8. Sunset & Technical Debt

This perimeter covers the end of the product lifecycle: managing technical debt, legacy modernization, and graceful sunset of features and products.

- **Technical Debt** — Cunningham, W. (1992). "The WyCash Portfolio Management System." OOPSLA 1992. Origin of the technical debt metaphor as incomplete understanding of the problem domain, not merely sloppy code.

- **Behavioral Code Analysis** — Tornhill, A. (2018). *Software Design X-Rays: Fix Technical Debt with Behavioral Code Analysis*. Pragmatic Programmers. Identifies complexity hotspots through code churn patterns. Prioritizes debt based on behavioral data rather than static analysis alone.

- **Strangler Fig Pattern** — Fowler, M. (2004). "Strangler Fig Application." martinfowler.com. Architectural pattern for incremental legacy modernization by gradually routing functionality from old to new systems.

- **Refactoring** — Fowler, M. (2018). *Refactoring: Improving the Design of Existing Code* (2nd ed.). Addison-Wesley. Systematic techniques for improving code design under the constraint of preserving behavior.

**Potential agents:** Debt Analyst (hotspot detection, debt quantification, business impact), Migration Planner (strangler fig strategy, incremental modernization roadmap), Sunset Coordinator (deprecation communication, migration assistance, graceful shutdown).

---

## 9. Knowledge Engineering

These foundations underpin the knowledge engineering perimeter proposed in the vision document (Section 4).

### Tacit and Explicit Knowledge

- **The Tacit Dimension** — Polanyi, M. (1966). *The Tacit Dimension*. University of Chicago Press. "We can know more than we can tell." Establishes that much organizational knowledge cannot be articulated through documentation alone — it requires elicitation.

- **SECI Model** — Nonaka, I. & Takeuchi, H. (1995). *The Knowledge-Creating Company*. Oxford University Press. Four modes of knowledge conversion: Socialization (tacit->tacit), Externalization (tacit->explicit), Combination (explicit->explicit), Internalization (explicit->tacit). A knowledge engineering perimeter would operationalize the Externalization phase at scale.

- **Knowledge Elicitation** — Cooke, N. J. (1994). "Varieties of Knowledge Elicitation Techniques." *International Journal of Human-Computer Studies*, 41(6), 801-849. Taxonomy of techniques for extracting expert knowledge: interviews, protocol analysis, card sorting, repertory grids.

- **Knowledge Engineering Principles** — Studer, R., Benjamins, V. R. & Fensel, D. (1998). "Knowledge Engineering: Principles and Methods." *Data & Knowledge Engineering*, 25(1-2), 161-197. Formal methodology for building knowledge-based systems. The knowledge acquisition bottleneck and approaches to overcoming it.

### Knowledge in Software Engineering

- **Architecture as Design Decisions** — Jansen, A. & Bosch, J. (2005). "Software Architecture as a Set of Architectural Design Decisions." *Working IEEE/IFIP Conference on Software Architecture*. Architecture knowledge is not the diagrams — it's the *decisions* and their rationale.

- **Mining Software Repositories** — Kagdi, H., Collard, M. L. & Maletic, J. I. (2007). "A Survey and Taxonomy of Approaches for Mining Software Repositories in the Context of Software Evolution." *Journal of Software Maintenance and Evolution*, 19(2). Systematic extraction of knowledge from version control, bug trackers, and code artifacts.

- **Developer Cognition** — Ko, A. J. et al. (2006). "An Exploratory Study of How Developers Seek, Relate, and Collect Relevant Information during Software Maintenance Tasks." *IEEE Transactions on Software Engineering*. How developers actually navigate and understand codebases.

- **Cognitive Debt** — Storey, M. (2026). "How Generative and Agentic AI Shift Concern from Technical Debt to Cognitive Debt." As AI generates more code, human understanding of the codebase erodes. Knowledge extraction becomes essential to maintain organizational capability.

### Knowledge Assets as a Product

- **Knowledge Assets** — Boisot, M. H. (1998). *Knowledge Assets: Securing Competitive Advantage in the Information Economy*. Oxford University Press. The I-Space model: knowledge moves through phases of codification and abstraction before diffusion.

- **Working Knowledge** — Davenport, T. H. & Prusak, L. (1998). *Working Knowledge: How Organizations Manage What They Know*. Harvard Business School Press. Knowledge market metaphors: knowledge has buyers, sellers, brokers, and a price.

### AI-Augmented Knowledge Extraction (2024-2026)

- **GraphRAG** — Microsoft Research. (2024-ongoing). *GraphRAG: Graph-based Retrieval-Augmented Generation*. https://microsoft.github.io/graphrag/. Hierarchical knowledge graph construction from unstructured text, enabling multi-hop reasoning over organizational knowledge.

- **LLM-based Code Understanding** — Emerging discipline (2024-2026) using large language models for automated codebase summarization, architecture recovery, and documentation generation from code.

- **Semantic Code Search** — Vector-based code search enabling natural language queries against codebases. Tools like Sourcegraph Cody, GitHub Copilot Workspace, and Cursor demonstrate the pattern.

---

## 10. Domain Mesh Pattern Foundations

These foundations underpin the domain mesh reference pattern described in the vision document (Section 5).

### Data Mesh

- **Data Mesh** — Dehghani, Z. (2022). *Data Mesh: Delivering Data-Driven Value at Scale*. O'Reilly. ISBN: 9781492092391. Four principles: domain-oriented data ownership, data as a product, self-serve data infrastructure, federated computational governance.

- **Domain Ownership** — In Data Mesh, the team that produces data owns its quality and discoverability. Applied to projects: the team that produces ML models owns the ML assessment capability.

### Service Mesh

- **Service Mesh Pattern** — Istio Project / Linkerd. (2017-ongoing). Sidecar proxy pattern for service-to-service communication: observability, traffic management, security, without modifying application code. The architectural insight: infrastructure concerns are separated from business concerns.

- **Event Mesh** — Solace. (2017-ongoing). Event-driven architecture patterns. Extends mesh thinking to asynchronous, event-based communication.

### Agentic Mesh (Emerging)

- **Agentic Mesh** — Broda, B. (2025). "Agentic Mesh: The Future of Generative AI-Enabled Autonomous Agent Ecosystems." *Medium / Data Science*. Proposes mesh topology for AI agent ecosystems: decentralized agent discovery, capability advertisement, dynamic routing, and federated governance.

### Hexagonal Architecture & Domain-Driven Design

- **Hexagonal Architecture (Ports & Adapters)** — Cockburn, A. (2005, updated 2024). *Hexagonal Architecture Explained*. The application core is isolated from external concerns through ports (interfaces) and adapters (implementations).

- **Clean Architecture** — Martin, R. C. (2017). *Clean Architecture: A Craftsman's Guide to Software Structure and Design*. Prentice Hall. Dependency rule: dependencies always point inward toward higher-level policies.

- **Domain-Driven Design** — Evans, E. (2003). *Domain-Driven Design: Tackling Complexity in the Heart of Software*. Addison-Wesley. Bounded Contexts and Context Mapping. Vernon, V. (2013). *Implementing Domain-Driven Design*. Addison-Wesley. Practical patterns for bounded context integration.

### Composable & Federated Architectures

- **Composable Architecture** — Gartner. (2024). "Composable Business and Technology." Modular, interchangeable components assembled to meet specific needs.

- **Federated Governance** — From Data Mesh: governance is not centralized but federated across domain owners, with shared standards and interoperability contracts.

- **Cell-Based Architecture** — WSO2. (2024). Self-contained, independently deployable units of business functionality. Each cell encapsulates compute, data, and governance.

### Proposed Domain Modules

**A DataOps domain** — Specialized in data pipeline design, data quality, and data-as-a-product patterns. (Dehghani 2022, Huyen 2022, DataKitchen 2020-ongoing.) Ports: data quality assessment, pipeline design, data catalog curation, data lineage tracking.

**An MLOps domain** — Specialized in ML model lifecycle: training, evaluation, deployment, monitoring, and governance. (Google Cloud MLOps maturity model, Huyen 2025, Sculley et al. 2015.) Ports: model assessment, training pipeline design, model monitoring, bias/fairness audit.

**An AgentOps domain** — Specialized in AI agent lifecycle: design, testing, deployment, observability, and governance. (Anthropic MCP, Google A2A, Linux Foundation Agentic AI, McKinsey/IBM AgentOps.) Ports: agent assessment, agent testing, agent monitoring, agent governance.

**A PlatformOps domain** — Specialized in internal developer platform, infrastructure-as-code, and developer experience. (Skelton & Pais 2019, Gartner 2024.) Ports: infrastructure assessment, platform capability exposure, developer experience audit.

---

## 11. Organizational Transformation

### 11.1 Classical Change Management

**Macro-level change leadership:**

- **Kotter's 8-Step Model** — Kotter, J. (1996, updated 2014). *Leading Change* / *Accelerate*. Harvard Business School Press. Eight-step model: create urgency -> build guiding coalition -> form vision -> enlist volunteers -> enable action -> generate short-term wins -> sustain acceleration -> institute change.

- **Lewin's Change Model** — Lewin, K. (1947). Unfreeze -> Change -> Refreeze. The classic three-stage model helps frame each new perimeter adoption as requiring: unfreezing current practices, transitioning to agent-augmented workflows, and stabilizing new behaviors.

**Individual-level adoption:**

- **ADKAR Model** — Hiatt, J. (2000s-ongoing). Prosci. Awareness -> Desire -> Knowledge -> Ability -> Reinforcement. Individual-centered model emphasizing that organizational change only succeeds when individuals change.

- **Bridges' Transition Model** — Bridges, W. & Bridges, S. (1991). *Managing Transitions*. Hachette. Distinguishes external change from internal psychological transition: Ending -> Neutral Zone -> New Beginning.

**Organizational alignment:**

- **McKinsey 7-S Framework** — Peters, T. & Waterman, R. (1982). *In Search of Excellence*. Harper & Row. Seven interconnected elements: Structure, Strategy, Systems, Skills, Staff, Style, Shared Values.

### 11.2 Organizational Design for an Agentic Era

**Team topology:**

- **Team Topologies** — Skelton, M. & Pais, M. (2019, 2nd ed. 2024). *Team Topologies*. IT Revolution Press. Four team types (Stream-aligned, Enabling, Complicated-subsystem, Platform) and three interaction modes (Collaboration, X-as-a-Service, Facilitating).

- **unFIX Model** — Appelo, J. (2021-ongoing). *The unFIX Model*. https://unfix.com/. Pattern library for organizational design emphasizing versatility over fixed frameworks. Appelo's 2023-2024 work specifically addresses organizational design in the age of AI.

- **Conway's Law & Inverse Conway Maneuver** — Conway, M. (1967); LeRoy, J. & Simons, M. (2010). System architecture mirrors organizational structure. The inverse maneuver deliberately restructures teams to produce desired architectures.

- **Sociotechnical Systems Theory** — Trist, E. & Bamforth, K. (1951). Tavistock Institute. Organizations as open systems with interdependent social and technical subsystems. The principle of *joint optimization* is critical when agents (technical) must integrate with human teams (social).

**Dynamic adaptation:**

- **Dynamic Capabilities** — Teece, D., Pisano, G. & Shuen, A. (1997). "Dynamic Capabilities and Strategic Management." *Strategic Management Journal*. A firm's ability to adapt, integrate, and reconfigure resources for changing environments.

### 11.3 Agentic Transformation: What Makes This Different

**Role transformation:**

- **Cyborgs, Centaurs, and Self-Automators** — Randazzo, S., Lifshitz-Assaf, H., Kellogg, K., Dell'Acqua, F., Mollick, E. et al. (2024). Harvard Business School / SSRN. Three human-AI collaboration models: Centaurs (clear task division), Cyborgs (fluid blending), Self-Automators (delegation). Each produces different learning and career outcomes.

- **Anthropic Case Study** — Anthropic. (2025-2026). "How AI Is Transforming Work at Anthropic." Engineers self-describe as "managers of AI agents" spending 70%+ time on code review/revision rather than net-new code.

- **Generative AI at Work** — Brynjolfsson, E. & Li, D. (2023-2024). NBER Working Paper. Empirical study: 15% average productivity gain, with less experienced workers benefiting most.

**Organizational redesign for agents:**

- **The Agentic Organization** — McKinsey & Company. (2025-2026). "The Agentic Organization: Contours of the Next Paradigm for the AI Era." Framework for fundamental organizational restructuring with AI agents as participants.

- **Google Cloud AI Agent Trends 2026** — Google Cloud. (2026). Five shifts: Task-to-Role-Based AI, Multi-Agent Orchestration, Governance and Real-Time Controls, Team Empowerment (Managers of Agents), Measurable Results Focus. 1,445% surge in multi-agent system inquiries Q1-Q2 2025.

- **Co-Intelligence** — Mollick, E. (2024). *Co-Intelligence: Living and Working with AI*. Penguin Random House. Three structural pillars: AI in leadership, AI labs, democratize AI to the crowd.

### 11.4 Governance Frameworks

**Decision governance:**

- **Cynefin Framework** — Snowden, D. (1999-ongoing). "A Leader's Framework for Decision Making." *Harvard Business Review* (2007). Five domains: Clear, Complicated, Complex, Chaotic, Disorder. Helps determine which decisions agents can handle autonomously versus which require human judgment.

- **DACI Framework** — Atlassian (2010s). Driver, Approver, Contributors, Informed. When agents participate in decisions, DACI needs extension to clarify agent roles.

**Technology & AI governance:**

- **TOGAF** — The Open Group. *TOGAF Standard, Version 9.2*. Architecture Development Method with governance processes. 80% Fortune 500 adoption.

- **IEEE 7000 Series** — IEEE Global Initiative on Ethics of Autonomous and Intelligent Systems. (2019-present). Five core principles: Human Rights, Well-being, Accountability, Transparency, Minimizing Misuse.

- **EU AI Act** — European Union. (2024). *Regulation (EU) 2024/1689*. Risk-based framework with compliance requirements for AI systems.

- **ISO/IEC 42001** — ISO/IEC. (2023). First international standard for AI management systems. Enables formal governance, audit, and certification.

### 11.5 Adoption & Diffusion

- **Diffusion of Innovations** — Rogers, E. (1962, 5th ed. 2003). *Diffusion of Innovations*. Free Press. Innovators -> Early Adopters -> Early Majority -> Late Majority -> Laggards. Five factors: relative advantage, compatibility, complexity, trialability, observability.

- **Crossing the Chasm** — Moore, G. (1991, 3rd ed. 2014). *Crossing the Chasm*. HarperCollins. The gap between early adopters (visionaries) and early majority (pragmatists) requires different strategies.

- **Behavioral Design** — Fogg, B. J. (2019). *Tiny Habits*. Houghton Mifflin Harcourt. Behavior = Motivation + Ability + Prompt. Eyal, N. (2014). *Hooked*. Penguin. Trigger -> Action -> Variable Reward -> Investment.

- **Nudge Theory** — Thaler, R. & Sunstein, C. (2008). *Nudge*. Yale University Press. Choice architecture that alters behavior predictably without restricting options.

- **Psychological Safety** — Edmondson, A. (1999-ongoing). Harvard Business School. Shared belief that a team is safe for interpersonal risk-taking. Across all literature reviewed, psychological safety emerges as the strongest predictor of successful AI adoption.

---

## 12. Entropy & Decay

These foundations underpin the entropy management framework described in the vision document (Section 6).

- **Laws of Software Evolution** — Lehman, M. M. (1980). "Programs, Life Cycles, and Laws of Software Evolution." *Proceedings of the IEEE*, 68(9), 1060-1076. Establishes that systems must be continually adapted or they become progressively less satisfactory.

- **Cognitive Debt** — Storey, M. (2026). "How Generative and Agentic AI Shift Concern from Technical Debt to Cognitive Debt." As AI generates more code and artifacts, human understanding erodes. Entropy applies not just to artifacts but to organizational *comprehension*.

- **Organizational Forgetting** — De Holan, P. M. & Phillips, N. (2004). "Remembrance of Things Past? The Dynamics of Organizational Forgetting." *Management Science*, 50(11), 1603-1613. Organizations don't just fail to learn — they actively forget. Knowledge assets degrade through staff turnover, context loss, and environmental change.

---

*This reference companion is maintained alongside the [Lifecycle Expansion Vision](lifecycle-expansion-vision.md). Each section corresponds to a perimeter or cross-cutting dimension described in the vision document.*
