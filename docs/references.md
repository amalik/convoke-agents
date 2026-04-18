# Convoke Agents — Theoretical Foundations & References

> Comprehensive bibliography mapping the theoretical foundations of the Convoke Agents project.
> Each reference is linked to the specific project component(s) it underpins.
>
> **Last updated:** April 2026

---

## Table of Contents

1. [Multi-Agent Systems & AI Agent Architectures](#1-multi-agent-systems--ai-agent-architectures)
2. [Agent Reasoning & Communication Patterns](#2-agent-reasoning--communication-patterns)
3. [Product Discovery & Innovation Frameworks](#3-product-discovery--innovation-frameworks)
4. [Lean Startup & Validated Learning](#4-lean-startup--validated-learning)
5. [Design Thinking & Human-Centered Design](#5-design-thinking--human-centered-design)
6. [Hypothesis-Driven Development & Experimentation](#6-hypothesis-driven-development--experimentation)
7. [Production Readiness, SRE & DevOps](#7-production-readiness-sre--devops)
8. [Observability & Monitoring](#8-observability--monitoring)
9. [Organizational Learning & Decision Frameworks](#9-organizational-learning--decision-frameworks)
10. [Prioritization & Backlog Management](#10-prioritization--backlog-management)
11. [Strategy & Competitive Analysis](#11-strategy--competitive-analysis)
12. [Delivery & Release Management](#12-delivery--release-management)
13. [Growth, Adoption & Product Analytics](#13-growth-adoption--product-analytics)
14. [Operations & Resilience](#14-operations--resilience)
15. [Security & Compliance](#15-security--compliance)
16. [Active Knowledge Engineering](#16-active-knowledge-engineering)
17. [Adaptive Systems, Entropy & Software Evolution](#17-adaptive-systems-entropy--software-evolution)
18. [Domain Mesh Architecture & Composable Patterns](#18-domain-mesh-architecture--composable-patterns)
19. [Systematic Documentation](#19-systematic-documentation)
20. [Sunset & Technical Debt](#20-sunset--technical-debt)
21. [Change Management & Organizational Transformation](#21-change-management--organizational-transformation)
22. [Prospective Research Directions](#22-prospective-research-directions)

---

## 1. Multi-Agent Systems & AI Agent Architectures

**Project relevance:** Core architecture of Convoke — Vortex (7 agents), Gyre (4 agents), Team Factory, handoff contracts, compass routing.

### Foundational Theory

- Wooldridge, M. J. (2002). *An Introduction to Multiagent Systems*. Wiley. ISBN: 9780470519460
  — Defines agent autonomy, sociality, reactivity, and proactivity as core agent properties. Foundation for Convoke's agent design.

- Ferber, J. (1999). *Multi-Agent Systems: An Introduction to Distributed Artificial Intelligence*. Addison-Wesley. ISBN: 9780201360486
  — First comprehensive unified overview of MAS with organizational frameworks. Informs team composition patterns.

- Weiss, G. (Ed.). (2013). *Multiagent Systems: A Modern Approach to Distributed Artificial Intelligence* (2nd ed.). MIT Press. ISBN: 9780262731317
  — Contemporary reference covering learning, coordination, and communication in MAS.

- Rao, A. S., & Georgeff, M. P. (1995). "BDI Agents: From Theory to Practice." *Proceedings of ICMAS-95*. AAAI.
  — Belief-Desire-Intention architecture. Relevant to how Convoke agents maintain context (beliefs), goals (desires), and workflow execution (intentions).

- FIPA — Foundation for Intelligent Physical Agents. (2003–2007). *FIPA Specifications*. http://www.fipa.org/
  — Standardized Agent Communication Language (ACL), interaction protocols including Contract Net Protocol. Precursor to Convoke's handoff contract system.

### LLM-Based Multi-Agent Frameworks (2023–2025)

- Wu, Q., Bansal, G., Zhang, J., et al. (2023). "AutoGen: Enabling Next-Gen LLM Applications via Multi-Agent Conversation." *arXiv:2308.08155*. Accepted at ICLR 2024.
  — Multi-agent conversation framework. Relevant to Convoke's conversable agent paradigm and handoff patterns.

- Hong, S., Zheng, M., Chen, J., et al. (2023). "MetaGPT: Meta Programming for A Multi-Agent Collaborative Framework." *arXiv:2308.00352*. Accepted at ICLR 2024.
  — Encodes human SOPs into agent interactions with role-based assembly line paradigm. Directly relevant to Vortex's stream-based specialization.

- Wang, Y., Wu, Y., Singh, A., et al. (2023). "ChatDev: Communicative Agents for Software Development." *arXiv:2307.07924*. Accepted at ACL 2024.
  — Software development lifecycle through specialized LLM agents. Comparable to BMAD Core's role-based development agents (Mary, Winston, Amelia, John).

- Li, G., Hammoud, H. A. H., et al. (2023). "CAMEL: Communicative Agents for 'Mind' Exploration of Large Language Model Society." *arXiv:2303.17760*. Accepted at ICLR 2024.
  — Role-playing and inception prompting for autonomous cooperation. Informs Convoke's agent persona design.

- Chen, W., Su, Y., Zhou, X., et al. (2023). "AgentVerse: Facilitating Multi-Agent Collaboration and Exploring Emergent Behaviors." *arXiv:2308.10848*. Accepted at ICLR 2024.
  — Four-stage framework: Expert Recruitment, Collaborative Decision-Making, Action Execution, Evaluation. Parallels Vortex's compass-driven routing.

### Practitioner Frameworks

- CrewAI. (2024). "Framework for orchestrating role-playing, autonomous AI agents." https://github.com/crewAIInc/crewAI
  — Role-based orchestration with agent specialization by role/goal/backstory. Comparable design to Convoke's team composition.

- Chase, H. (2023–2025). "LangChain and LangGraph." https://blog.langchain.com/
  — Component abstraction (LangChain) and runtime orchestration (LangGraph). Reference architecture for agentic systems.

- Yang, J., Jimenez, C. E., Wettig, A., et al. (2024). "SWE-agent: Agent-Computer Interfaces Enable Automated Software Engineering." *NeurIPS 2024*. arXiv:2405.15793.
  — Demonstrates that agent-computer interface design dramatically affects LLM agent performance on software engineering tasks. Relevant to how Convoke shapes agent interaction surfaces.

- Qian, C., et al. (2025). "ChatDev 2.0: Evolving Multi-Agent Collaboration for Software Development." *NeurIPS 2025*.
  — Extends ChatDev with evolving orchestration patterns, agent memory, and cross-session learning. Supports non-linear agent coordination beyond fixed pipelines.

- Multi-institutional. (2026). "The Orchestration of Multi-Agent Systems: A Systematic Survey." *arXiv* (January 2026).
  — Comprehensive taxonomy of MAS orchestration patterns: centralized, decentralized, hybrid, and adaptive. Directly relevant to Convoke's gravity-driven routing as an alternative to pipeline orchestration.

- Multi-institutional. (2026). "Agentic AI: Architectures, Taxonomies, and Emerging Frameworks." *arXiv* (January 2026).
  — Proposes unified taxonomy for agentic AI system design: perception, reasoning, action, memory, and multi-agent coordination layers. Reference for Convoke's architectural classification.

---

## 2. Agent Reasoning & Communication Patterns

**Project relevance:** Workflow step execution, compass routing logic, inter-agent handoffs (HC1–HC10, GC1–GC4).

### Reasoning Architectures

- Yao, S., Yu, D., Zhao, J., et al. (2022). "ReAct: Synergizing Reasoning and Acting in Language Models." *arXiv:2210.03629*. Published at ICLR 2023.
  — Thought-Action-Observation cycles. Foundation for how Convoke agents reason through workflow steps.

- Wei, J., Wang, X., Schuurmans, D., et al. (2022). "Chain-of-Thought Prompting Elicits Reasoning in Large Language Models." *arXiv:2201.11903*. Published at NeurIPS 2022.
  — Intermediate reasoning step generation. Underpins structured reasoning in all Convoke agent prompts.

- Yao, S., et al. (2023). "Tree of Thoughts: Deliberate Problem Solving with Large Language Models." *NeurIPS 2023*. arXiv:2305.10601.
  — Exploration of reasoning paths with self-evaluation and backtracking. Relevant to Liam's hypothesis engineering branching.

- Pan, S., et al. (2023). "ReWOO: Decoupling Reasoning from Observations for Efficient Augmented Language Models." *arXiv:2305.18323*.
  — Separates planning, execution, and synthesis. Mirrors Gyre's sequential pipeline architecture (Scout → Atlas → Lens → Coach).

### Communication & Handoff Protocols

- Anthropic. (2024). "Building Effective AI Agents." https://www.anthropic.com/research/building-effective-agents
  — Five foundational patterns: Prompt Chaining, Routing, Parallelization, Orchestrator-Workers, Evaluator-Optimizer. Direct influence on Convoke's architecture.

- Anthropic. (2024). "Effective Context Engineering for AI Agents." https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents
  — Context management for multi-agent collaboration. Relevant to handoff contract design.

- Google Developers. (2024). "Agent-to-Agent Protocol (A2A)." https://developers.googleblog.com/en/a2a-a-new-era-of-agent-interoperability/
  — Task-centric inter-agent protocol with Agent Cards. Comparable to Convoke's handoff contracts as typed inter-agent interfaces.

- Anthropic. (2024). "Model Context Protocol (MCP)." https://modelcontextprotocol.io/
  — Standardized model-to-tool connectivity. Infrastructure layer for Convoke agent tool use.

- Microsoft AutoGen Team. (2023). "AutoGen Handoff Pattern." https://microsoft.github.io/autogen/stable/user-guide/core-user-guide/design-patterns/handoffs.html
  — Explicit, versioned handoff mechanisms with structured JSON schemas. Closest existing parallel to Convoke's HC/GC contract system.

- Anthropic. (2024). "How we built our multi-agent research system." https://www.anthropic.com/engineering/multi-agent-research-system
  — Production case study on role definition, information flow, and feedback mechanisms in multi-agent systems.

### Industry Perspectives

- Ng, A. (2024). "Agentic AI: Building AI Agents." *DeepLearning.AI*. https://learn.deeplearning.ai/courses/agentic-ai/
  — Four agentic design patterns: Reflection, Tool Use, Planning, Multi-agent Collaboration.

- Anonymous/Multi-Institutional. (2025). "A Survey of Agent Interoperability Protocols: MCP, ACP, A2A, and ANP." *arXiv:2505.02279*.
  — Comparative analysis of emerging agent interoperability standards.

- Cloud Security Alliance (CSA). (2024). *AI Agent Capability Framework*. https://cloudsecurityalliance.org/
  — Structured maturity model for AI agent capabilities: perception, reasoning, planning, execution, collaboration. **Relevant to Convoke's asymmetric port maturity model (Levels 0–4) for domain perimeters.**

- Multi-institutional. (2025). "TRiSM for Agentic AI: Trust, Risk, and Security Management in Agentic Systems." *arXiv* (2025).
  — Applies Gartner's AI TRiSM framework specifically to agentic AI: model-level trust, agent-level risk, system-level security. Relevant to governance as a cross-cutting concern in Convoke.

---

## 3. Product Discovery & Innovation Frameworks

**Project relevance:** Vortex module — 7-stream continuous discovery pattern based on Innovation Vortex.

### Innovation Vortex & unFIX

- Appelo, J. (2011). *Management 3.0: Leading Agile Developers, Developing Agile Leaders*. Addison-Wesley. ISBN: 9780321712479
  — Foundation for Appelo's thinking on innovation, complexity, and organizational design.

- Appelo, J. (2016). *Managing for Happiness: Games, Tools, and Practices to Motivate Any Team*. Wiley. ISBN: 9781119268680
  — Innovation and experimentation practices that evolved into the unFIX model.

- Appelo, J. (2022–present). *unFIX Model*. https://unfix.com/
  — Organizational model including the Innovation Vortex pattern with 7 streams: Contextualize, Empathize, Synthesize, Hypothesize, Externalize, Sensitize, Systematize. **Direct source for Vortex team architecture.**

- Appelo, J. (2022–present). "Innovation Vortex." https://unfix.com/innovation-vortex
  — Detailed description of the continuous, non-linear discovery pattern. **Primary reference for Vortex's compass routing and stream-based agent design.**

### Continuous Discovery

- Torres, T. (2021). *Continuous Discovery Habits: Discover Products that Create Customer Value and Business Value*. Product Talk LLC. ISBN: 9781736633304
  — Opportunity Solution Trees, weekly customer touchpoints, assumption testing. **Gap identified: not yet integrated into Vortex but highly relevant to Mila and Liam's workflows.**

- Cagan, M. (2018). *Inspired: How to Create Tech Products Customers Love* (2nd ed.). Wiley. ISBN: 9781119387503
  — Empowered product teams, dual-track agile, continuous discovery. Reference for PM agent role design.

- Cagan, M. (2020). *Empowered: Ordinary People, Extraordinary Products*. Wiley. ISBN: 9781119691297
  — Team topology for product organizations. Relevant to Team Factory's composition patterns.

- Patton, J. (2014). *User Story Mapping: Discover the Whole Story, Build the Right Product*. O'Reilly. ISBN: 9781491904909
  — Story mapping and dual-track development. Foundation for structured discovery-to-delivery flow.

### Jobs-to-be-Done

- Christensen, C. M. (2003). *The Innovator's Solution: Creating and Sustaining Successful Growth*. Harvard Business Review Press. ISBN: 9781422196571
  — Early articulation of the JTBD concept within disruptive innovation theory.

- Christensen, C. M., Hall, T., Dillon, K., & Duncan, D. S. (2016). *Competing Against Luck: The Story of Innovation and Customer Choice*. Harper Business. ISBN: 9780062435613
  — Definitive JTBD framework. **Underpins Mila's research convergence workflow and HC2 contract (JTBD + Pains & Gains).**

- Ulwick, A. W. (2016). *Jobs to Be Done: Theory to Practice*. IDEA BITE PRESS. ISBN: 9780990576747
  — Outcome-Driven Innovation (ODI) methodology. Quantitative approach to JTBD.

- Klement, A. (2016). *When Coffee and Kale Compete*. Self-published. ISBN: 9781534755468
  — Demand-side JTBD perspective focusing on struggling moments and progress-making forces.

### Empathy Mapping

- Gray, D., Brown, S., & Macanufo, J. (2010). *Gamestorming: A Playbook for Innovators, Rulebreakers, and Changemakers*. O'Reilly. ISBN: 9780596804176
  — Origin of the empathy map canvas (says/thinks/does/feels quadrants). **Direct source for Isla's empathy map workflow.**

---

## 4. Lean Startup & Validated Learning

**Project relevance:** Emma (Contextualize), Wade (Externalize), Max (Systematize) — validated assumptions, Build-Measure-Learn, pivot-or-persevere.

### Core Texts

- Ries, E. (2011). *The Lean Startup: How Today's Entrepreneurs Use Continuous Innovation to Create Radically Successful Businesses*. Crown Business. ISBN: 9780307887894
  — Build-Measure-Learn cycle, validated learning, MVP, pivot-or-persevere. **Foundation for Wade's lean experiment workflow and Max's decision framework.**

- Blank, S. (2005). *The Four Steps to the Epiphany: Successful Strategies for Products that Win* (2nd ed.). K&S Ranch. ISBN: 9780989200509
  — Customer Development methodology. Precursor to Lean Startup; customer discovery → customer validation → customer creation → company building.

- Blank, S., & Dorf, B. (2012). *The Startup Owner's Manual: The Step-By-Step Guide for Building a Great Company*. K&S Ranch. ISBN: 9780984999309
  — Operational guide for Customer Development. Structured hypothesis testing and pivot criteria.

- Maurya, A. (2012). *Running Lean: Iterate from Plan A to a Plan That Works* (2nd ed.). O'Reilly. ISBN: 9781449305178
  — Lean Canvas and systematic experimentation. Practical methodology for assumption prioritization.

### MVP Origins

- Robinson, F. (2001). "Minimum Viable Product." *SyncDev*. https://www.syncdev.com/minimum-viable-product/
  — Coined the term MVP as the smallest product that validates a business hypothesis. **Conceptual origin for Wade's MVP workflow.**

### Academic Validation

- Shepherd, D. A., & Gruber, M. (2021). "The Lean Startup Framework: Closing the Academic–Practitioner Divide." *Entrepreneurship Theory and Practice*, 45(5), 967–998.
  — Academic analysis validating Lean Startup methodology with empirical evidence.

- York, J. L., Fredrickson, J. S., & Seyb, S. K. (2024). "Testing the Lean Startup: An Experiment." *Journal of Business Venturing Insights*, 22, e00466.
  — Controlled experiment demonstrating Lean Startup practitioners achieve significantly better market validation outcomes.

---

## 5. Design Thinking & Human-Centered Design

**Project relevance:** CIS module (Maya agent), Isla's empathy-driven discovery, human-centered design principles across Vortex.

- Brown, T. (2009). *Change by Design: How Design Thinking Transforms Organizations and Inspires Innovation*. Harper Business. ISBN: 9780061766084
  — IDEO's design thinking framework: empathize, define, ideate, prototype, test.

- Brown, T. (2008). "Design Thinking." *Harvard Business Review*, 86(6), 84–92.
  — Seminal HBR article introducing design thinking to business audience.

- Hasso Plattner Institute of Design at Stanford (d.school). (2010). "An Introduction to Design Thinking: Process Guide." Stanford University. https://dschool.stanford.edu/
  — The 5-stage design thinking process. Educational framework.

- Cross, N. (2011). *Design Thinking: Understanding How Designers Think and Work*. Berg Publishers. ISBN: 9781847886361
  — Academic analysis of design cognition and problem-solving strategies.

- Dorst, K. (2011). "The Core of 'Design Thinking' and Its Application." *Design Studies*, 32(6), 521–532.
  — Theoretical analysis of abductive reasoning in design. Frames design thinking as frame creation.

- Buchanan, R. (1992). "Wicked Problems in Design Thinking." *Design Issues*, 8(2), 5–21.
  — Foundational paper connecting design thinking to wicked problems. Relevant to why discovery is non-linear (like Vortex's compass routing).

---

## 6. Hypothesis-Driven Development & Experimentation

**Project relevance:** Liam (Hypothesize), Wade (Externalize), Noah (Sensitize), Max (Systematize) — hypothesis engineering, experiment design, signal interpretation, learning cards.

### Methodology

- Gothelf, J., & Seiden, J. (2013). *Lean UX: Applying Lean Principles to Improve User Experience*. O'Reilly. ISBN: 9781449311650
  — Hypothesis-driven design: "We believe [outcome] will happen if [action] for [persona]." **Template pattern used in Liam's hypothesis engineering workflow.**

- O'Reilly, B. (2016). "Hypothesis-Driven Development." *Barry O'Reilly Blog*. https://barryoreilly.com/explore/blog/how-to-implement-hypothesis-driven-development/
  — Hypothesis-driven development as an alternative to requirements-driven development.

### Assumption Testing

- Bland, D. J., & Osterwalder, A. (2019). *Testing Business Ideas: A Field Guide for Rapid Experimentation*. Wiley. ISBN: 9781119551447
  — 44 experiment cards for testing business assumptions, organized by desirability/viability/feasibility. **Foundation for Vortex's assumption mapping workflow (risk = lethality × uncertainty).**

### Experimentation at Scale

- Kohavi, R., Tang, D., & Xu, Y. (2020). *Trustworthy Online Controlled Experiments: A Practical Guide to A/B Testing*. Cambridge University Press. ISBN: 9781108724265
  — Statistical rigor in experimentation. Relevant to Noah's signal interpretation and behavioral analysis.

---

## 7. Production Readiness, SRE & DevOps

**Project relevance:** Gyre module — Scout (stack detection), Atlas (capabilities modeling), Lens (gap analysis), Coach (readiness review).

### DORA & DevOps Performance

- Forsgren, N., Humble, J., & Kim, G. (2018). *Accelerate: The Science of Lean Software and DevOps*. IT Revolution Press. ISBN: 9781942788331
  — Four Key Metrics: deployment frequency, lead time, change failure rate, time to restore. **Primary standard referenced in Atlas's capabilities manifest generation.**

- DORA Team, Google Cloud. (2014–present). *State of DevOps Reports*. https://dora.dev/
  — Annual empirical research on software delivery performance. Ongoing validation of DORA metrics.

### Google SRE

- Beyer, B., Jones, C., Petoff, J., & Murphy, N. R. (2016). *Site Reliability Engineering: How Google Runs Production Systems*. O'Reilly. ISBN: 9781491929124
  — SLOs, SLIs, error budgets, production readiness reviews (PRR). **Direct source for Gyre's PRR-based assessment model.**

- Beyer, B., Murphy, N. R., Rensin, D. K., Kawahara, K., & Thorne, S. (2018). *The Site Reliability Workbook: Practical Ways to Implement SRE*. O'Reilly. ISBN: 9781492029502
  — Practical implementation guide for SRE practices including PRR checklists.

- Hidalgo, A. (2020). *Implementing Service Level Objectives: A Practical Guide to SLIs, SLOs, and Error Budgets*. O'Reilly. ISBN: 9781492076810
  — Detailed SLO implementation methodology. Relevant to Gyre's capability assessment for SLO coverage.

### DevOps Culture & Practices

- Kim, G., Behr, K., & Spafford, G. (2013). *The Phoenix Project: A Novel about IT, DevOps, and Helping Your Business Win*. IT Revolution Press. ISBN: 9780988262591
  — Narrative introduction to DevOps principles: flow, feedback, continuous learning.

- Kim, G., Humble, J., Debois, P., & Willis, J. (2016). *The DevOps Handbook: How to Create World-Class Agility, Reliability, and Security in Technology Organizations*. IT Revolution Press. ISBN: 9781942788003
  — Comprehensive DevOps practices. Foundation for Gyre's holistic readiness assessment.

### Continuous Delivery

- Humble, J., & Farley, D. (2010). *Continuous Delivery: Reliable Software Releases through Build, Test, and Deploy Automation*. Addison-Wesley. ISBN: 9780321601919
  — Deployment pipeline patterns, infrastructure as code, release management. Relevant to Gyre's deployment strategy assessment.

### Supply Chain Security

- OpenSSF / Google. (2021–present). *SLSA: Supply-chain Levels for Software Artifacts*. https://slsa.dev/
  — Framework for supply chain integrity. **Referenced in Gyre's capabilities.yaml as a standard for Atlas.**

---

## 8. Observability & Monitoring

**Project relevance:** Noah (Sensitize) — production monitoring, signal interpretation, behavioral analysis. Gyre — observability gap detection.

- Majors, C., Fong-Jones, L., & Miranda, G. (2022). *Observability Engineering: Achieving Production Excellence*. O'Reilly. ISBN: 9781492076445
  — Modern observability beyond traditional monitoring: traces, metrics, logs, high-cardinality data. Relevant to Noah's signal interpretation methodology.

- CNCF — Cloud Native Computing Foundation. (2019–present). *OpenTelemetry*. https://opentelemetry.io/
  — Vendor-neutral observability standard for traces, metrics, and logs. **Referenced in Atlas's capabilities manifest as a standard.**

- Green, D. M., & Swets, J. A. (1966). *Signal Detection Theory and Psychophysics*. Wiley.
  — Foundational theory of signal detection (sensitivity vs. bias, ROC curves). **Theoretical basis for Noah's signal-to-noise discrimination in production data.** Gap: not yet explicitly referenced in project.

---

## 9. Organizational Learning & Decision Frameworks

**Project relevance:** Max (Systematize) — learning cards, pivot/patch/persevere decisions, validated learning synthesis.

### Organizational Learning Theory

- Argyris, C. (1977). "Double Loop Learning in Organizations." *Harvard Business Review*, 55(5), 115–125.
  — Single-loop (corrective) vs. double-loop (transformative) learning. **Theoretical foundation for Max's learning card framework — capturing not just results but implications for strategy.** Gap: not yet explicitly referenced.

- Senge, P. M. (1990). *The Fifth Discipline: The Art and Practice of the Learning Organization*. Doubleday. ISBN: 9780385260954
  — Systems thinking, mental models, shared vision, team learning. **Relevant to Vortex's non-linear, systems-aware discovery pattern.** Gap: not yet explicitly referenced.

- Nonaka, I., & Takeuchi, H. (1995). *The Knowledge-Creating Company: How Japanese Companies Create the Dynamics of Innovation*. Oxford University Press. ISBN: 9780195092691
  — SECI model of knowledge creation (socialization, externalization, combination, internalization). Relevant to how discovery learning becomes organizational knowledge.

### Decision Frameworks

- Ries, E. (2011). "Pivot or Persevere" in *The Lean Startup*. Crown Business.
  — Original pivot-or-persevere framework. **Extended by Convoke to "Pivot, Patch, or Persevere" adding a middle-ground option.**

- Klein, G. (2007). "Performing a Project Premortem." *Harvard Business Review*, 85(9), 18–19.
  — Premortem technique for prospective hindsight. Relevant to assumption mapping's risk assessment.

### Lean Thinking & Flow Principles

- Womack, J. P. & Jones, D. T. (1996). *Lean Thinking: Banish Waste and Create Wealth in Your Corporation*. Simon & Schuster. ISBN: 9780743249270
  — Five lean principles: define value, map value streams, create flow, establish pull, pursue perfection. **Convoke's gravity model is a pull system; lean's waste taxonomy (overproduction, waiting, overprocessing, defects) provides design constraints for preventing platform-level waste as perimeters multiply.**

- Ohno, T. (1988). *Toyota Production System: Beyond Large-Scale Production*. Productivity Press. ISBN: 9780915299140
  — Original formulation of pull-based production, kanban, and the seven wastes. **Foundation for Convoke's flow-awareness principle: limiting how many perimeters activate simultaneously to prevent thrashing.**

- Reinertsen, D. G. (2009). *The Principles of Product Development Flow: Second Generation Lean Product Development*. Celeritas Publishing. ISBN: 9781935401001
  — Applies queueing theory and economic principles to product development. WIP limits, batch size reduction, cost of delay. **Most directly applicable lean text for Convoke: treats product development as a flow system with quantifiable economics, not a manufacturing process with physical constraints. Informs WIP governance and value stream visibility across perimeters.**

---

## 10. Prioritization & Backlog Management

**Project relevance:** Enhance module — RICE-scored initiatives backlog for PM agent.

- McBride, S. (2016). "RICE: Simple prioritization for product managers." *Intercom Blog*. https://www.intercom.com/blog/rice-simple-prioritization-for-product-managers/
  — RICE scoring (Reach × Impact × Confidence / Effort). **Direct source for Enhance's prioritization methodology.**

- Osterwalder, A., Pigneur, Y., Bernarda, G., & Smith, A. (2014). *Value Proposition Design*. Wiley. ISBN: 9781118968055
  — Value Proposition Canvas. Complementary to JTBD for prioritization decisions.

---

## 11. Strategy & Competitive Analysis

**Project relevance:** Proposed Compass module — strategic positioning upstream of Vortex discovery.

- Porter, M. E. (1980). *Competitive Strategy: Techniques for Analyzing Industries and Competitors*. Free Press. ISBN: 9780029253305
  — Five Forces framework for industry structure analysis. Foundation for competitive landscape assessment.

- Kim, W. C. & Mauborgne, R. (2005). *Blue Ocean Strategy: How to Create Uncontested Market Space and Make the Competition Irrelevant*. Harvard Business School Press. ISBN: 1591396190
  — Value innovation framework contrasting competition in existing markets with creation of uncontested market space.

- Lafley, A. G. & Martin, R. L. (2013). *Playing to Win: How Strategy Really Works*. Harvard Business Review Press. ISBN: 9781422187395
  — Strategy Choice Cascade: winning aspiration, where to play, how to win, capabilities, management systems.

- Rumelt, R. P. (2011). *Good Strategy/Bad Strategy: The Difference and Why It Matters*. Crown Business. ISBN: 9780307886231
  — Coherent strategy framework: diagnosis + guiding policy + coherent actions.

- Wardley, S. (2018). *Wardley Maps*. Self-published/Creative Commons. https://wardleymaps.com/
  — Strategic landscape visualization through value chain positioning and component evolution.

- Osterwalder, A. & Pigneur, Y. (2010). *Business Model Generation*. Wiley. ISBN: 9780470876411
  — Business Model Canvas as shared language for business model description and iteration.

---

## 12. Delivery & Release Management

**Project relevance:** Proposed Launch module — bridging Gyre readiness to production deployment.

- Hodgson, P. & Echagüe, P. (2020). *Feature Flag Best Practices*. O'Reilly. ISBN: 9781492050452
  — Eight best practices for feature flags enabling decoupling of deployment from release.

- Hodgson, P. (2012–present). "Feature Toggles (aka Feature Flags)." *Martin Fowler's bliki*. https://martinfowler.com/articles/feature-toggles.html
  — Comprehensive reference on feature toggle patterns and lifecycle management.

---

## 13. Growth, Adoption & Product Analytics

**Project relevance:** Proposed Amplify module — post-launch product growth and user adoption.

- Bush, W. (2019). *Product-Led Growth: How to Build a Product That Sells Itself*. ProductLed Library. ISBN: 9781798434529
  — Product-driven acquisition and expansion framework.

- McClure, D. (2007). "AARRR! Pirate Metrics for Startups." Lean Analytics.
  — Five-stage growth funnel: Acquisition, Activation, Retention, Referral, Revenue.

- Ellis, S. (2013). "Finding Your North Star Metric." *Growth Hackers*. https://medium.com/growthhackers/finding-your-north-star-metric-fc1c1f71cbcb
  — Single metric framework capturing core value delivered.

- Traynor, D., Adams, P. & Keating, G. (2016). *Intercom on Jobs-to-be-Done*. Intercom Books.
  — JTBD applied to product marketing, onboarding, and feature adoption.

---

## 14. Operations & Resilience

**Project relevance:** Proposed Sentinel module — operational follow-through from Gyre readiness.

- Rosenthal, C. et al. (2020). *Chaos Engineering: System Resiliency in Practice*. O'Reilly.
  — Proactive resilience testing through controlled failure injection.

- PagerDuty. (2015–ongoing). *Incident Response Documentation*. https://response.pagerduty.com/
  — Best practices for incident response, runbook automation, escalation patterns.

- Woods, D. D. (2017). "STELLA: Report from the SNAFUcatchers Workshop on Coping With Complexity." Ohio State University.
  — Complex systems thinking applied to incident analysis. Beyond root cause to systemic understanding.

- Mehta, N., Steinman, D. & Murphy, L. (2016). *Customer Success: How Innovative Companies Are Reducing Churn and Growing Recurring Revenue*. Wiley. ISBN: 9781119167969
  — Customer Success as post-sale function maximizing lifetime value and retention.

---

## 15. Security & Compliance

**Project relevance:** Proposed Shield module — proactive security across the lifecycle.

- Shostack, A. (2014). *Threat Modeling: Designing for Security*. Wiley. ISBN: 9781118809990
  — STRIDE framework for systematic threat identification.

- OWASP Foundation. (2021–ongoing). *DevSecOps Guideline & Maturity Model*. https://owasp.org/www-project-devsecops-guideline/
  — Open framework for embedding security throughout the development pipeline.

- NIST. (2022). *Secure Software Development Framework (SSDF)*. NIST SP 800-218.
  — Federal standards for secure development practices.

- NTIA. (2021). *Minimum Elements for a Software Bill of Materials (SBOM)*. U.S. Department of Commerce.
  — Standardized SBOM requirements for supply chain transparency.

---

## 16. Active Knowledge Engineering

**Project relevance:** Proposed Forge module — extract, refine, and expose organizational knowledge as consumable assets.

### Knowledge Foundations

- Polanyi, M. (1966). *The Tacit Dimension*. University of Chicago Press.
  — "We can know more than we can tell." Foundational concept for tacit knowledge that requires active elicitation.

- Nonaka, I. & Takeuchi, H. (1995). *The Knowledge-Creating Company*. Oxford University Press. ISBN: 9780195092691
  — SECI model of knowledge conversion: Socialization, Externalization, Combination, Internalization. Forge operationalizes the Externalization phase at scale.

- Cooke, N. J. (1994). "Varieties of Knowledge Elicitation Techniques." *International Journal of Human-Computer Studies*, 41(6), 801–849.
  — Taxonomy of expert knowledge extraction techniques: interviews, protocol analysis, card sorting, repertory grids.

- Studer, R., Benjamins, V. R. & Fensel, D. (1998). "Knowledge Engineering: Principles and Methods." *Data & Knowledge Engineering*, 25(1-2), 161–197.
  — Formal methodology for building knowledge-based systems. The knowledge acquisition bottleneck.

### Knowledge in Software Engineering

- Jansen, A. & Bosch, J. (2005). "Software Architecture as a Set of Architectural Design Decisions." *Working IEEE/IFIP Conference on Software Architecture*.
  — Architecture knowledge is the decisions and their rationale, not diagrams.

- Kagdi, H., Collard, M. L. & Maletic, J. I. (2007). "A Survey and Taxonomy of Approaches for Mining Software Repositories." *Journal of Software Maintenance and Evolution*, 19(2).
  — Systematic knowledge extraction from version control, bug trackers, and code artifacts.

- Ko, A. J. et al. (2006). "An Exploratory Study of How Developers Seek, Relate, and Collect Relevant Information during Software Maintenance Tasks." *IEEE Transactions on Software Engineering*.
  — Developer cognition during codebase navigation. Informs agent-based knowledge extraction design.

- Storey, M. (2026). "How Generative and Agentic AI Shift Concern from Technical Debt to Cognitive Debt." https://margaretstorey.com/blog/2026/02/09/cognitive-debt/
  — As AI generates more code, human understanding erodes. Knowledge extraction becomes essential to maintain organizational capability.

### Knowledge Assets

- Boisot, M. H. (1998). *Knowledge Assets: Securing Competitive Advantage in the Information Economy*. Oxford University Press.
  — I-Space model: knowledge moves through codification and abstraction before diffusion. Knowledge as managed asset.

- Davenport, T. H. & Prusak, L. (1998). *Working Knowledge: How Organizations Manage What They Know*. Harvard Business School Press.
  — Knowledge market metaphors: buyers, sellers, brokers, and a price for organizational knowledge.

### AI-Augmented Knowledge Extraction

- Microsoft Research. (2024–ongoing). *GraphRAG: Graph-based Retrieval-Augmented Generation*. https://microsoft.github.io/graphrag/
  — Hierarchical knowledge graph construction from unstructured text, enabling multi-hop reasoning over organizational knowledge.

- Graph Praxis. (2025). "From Domain Expertise to Autonomous Agents: Introducing the Agentic Graph Framework." *Medium / Graph Praxis*. https://medium.com/graph-praxis/from-domain-expertise-to-autonomous-agents-introducing-the-agentic-graph-framework-0d97725c58b6
  — Proposes knowledge graphs as the structural backbone for autonomous agent coordination — agents construct, traverse, and evolve graph structures rather than passing flat context. Extends GraphRAG from retrieval to continuous graph evolution. **Strengthens Convoke KE's ambition of maintaining organizational knowledge as a living graph.**

- Paul, N. J. (2025). "Ontology-Driven Agents: The Missing Layer for Enterprise AI." *Medium*. https://medium.com/@nayan.j.paul/ontology-driven-agents-the-missing-layer-for-enterprise-ai-6d4b9182ee2b
  — Argues that enterprise AI agents fail without a shared ontology — a formal representation of business entities, relationships, and rules. Without it, each agent carries its own interpretation of domain concepts. **Informs Convoke KE's role as ontology producer: a structured, versioned, governed knowledge layer that all other perimeters consume.**

- Gromov, S. (2026). "The Semantic Layer Is Dead. Now It's an API for AI Agents." *Medium*. https://medium.com/@grom_65116/the-semantic-layer-is-dead-now-its-an-api-for-ai-agents-f91d48a0c74a
  — The semantic layer evolves from a BI convenience into an "interface of meaning" — a context-of-trust layer that constrains what agents are allowed to conclude from data. Agents don't need data access; they need access to *interpretation*. **Completes the KE output triad: ontology (what to define — Paul), graph (how to structure it — Graph Praxis), semantic API (how agents consume it — Gromov). Gives KE a clearer product vision: its output is an interpretive substrate, not just knowledge assets.**

### Knowledge Classification & Persistence

- Oliver, D. R. (2026). "The Seven-Pillar Ontology: A Framework for Architecture Knowledge Management." *Medium*. https://medium.com/@davidroliver/the-seven-pillar-ontology-a-framework-for-architecture-knowledge-management-9cac4405272a
  — Organizes architecture knowledge not by project or topic but by fundamental nature: entities (things that exist), nodes (durable knowledge), events (things that happen), views (aggregations), artefacts (collected outputs), governance (constraints), and navigation (guides). Eliminates placement ambiguity, enables semantic queries across project boundaries, and survives tool changes through portable plain-text formats. **Provides a practitioner taxonomy for the knowledge assets KE manages — the classification layer between extraction and graph structuring. Encoded team standards (Fowler) map to "nodes" and "governance" pillars; architecture decisions map to "events" linked to "entities."**

- Zakutnii, I. (2025). "Quint Code — Systems Thinking for Programmers." *Neural Stack (Substack)*. (Also listed in Section 17.)
  — Decision Rationale Records (DRRs) as a specific knowledge asset type: live artifacts with evidence decay, trust scores, and auto-expiry. **In Oliver's taxonomy, DRRs are "events" (decisions that happened) linked to "governance" (constraints they impose), with built-in staleness detection that directly addresses KE's knowledge decay problem.**

### Encoding Tacit Knowledge for AI Consumption

- Fowler, M. et al. (2026). "Encoding Team Standards." In *Patterns for Reducing Friction in AI-Assisted Development*. martinfowler.com. https://martinfowler.com/articles/reduce-friction-ai/encoding-team-standards.html
  — Team standards governing AI coding assistants should be versioned infrastructure artifacts, not tribal knowledge. Tacit knowledge — what to generate, what to flag, what to reject — is the team's most valuable and most fragile asset; it transfers slowly and walks out the door when someone leaves. The act of creating machine-consumable instructions *is* the act of organizing tacit knowledge into explicit, prioritized checks. **Practitioner validation from Thoughtworks of Convoke KE's foundational premise: extraction and encoding are the same activity. Closes the KE loop: extract (Fowler) → structure (Graph Praxis) → define shared meaning (Paul) → expose as API (Gromov).**

- Fowler, M. et al. (2026). "Knowledge Priming." In *Patterns for Reducing Friction in AI-Assisted Development*. martinfowler.com. https://martinfowler.com/articles/reduce-friction-ai/knowledge-priming.html
  — Priming documents are first-class artifacts — the minimum context AI needs to generate aligned output. Treated with the same rigor as onboarding materials for new hires. **Maps to KE's knowledge curation capability: producing structured, maintained context packages that any consumer (human or agent) can use to act within organizational norms.**

---

## 17. Adaptive Systems, Entropy & Software Evolution

**Project relevance:** Gravity model (non-linear lifecycle), entropy as cross-cutting force, asymmetric port maturity — the structural principles underlying Convoke's architecture.

### Adaptive Cycles & Panarchy

- Holling, C. S. (2001). "Understanding the Complexity of Economic, Ecological, and Social Systems." *Ecosystems*, 4(5), 390–405.
  — Panarchy framework: systems cycle through exploitation → conservation → release → reorganization (r → K → Ω → α). **Primary theoretical grounding for Convoke's gravity model — perimeters gain and release priority through adaptive cycles rather than following a linear pipeline.**

- Gunderson, L. H. & Holling, C. S. (Eds.). (2002). *Panarchy: Understanding Transformations in Human and Natural Systems*. Island Press. ISBN: 9781559638579
  — Comprehensive treatment of adaptive cycles across scales, showing how systems at different levels influence each other. Informs how Convoke perimeters at different maturity levels interact.

### Entropy in Multi-Agent & Software Systems

- Lehman, M. M. (1980). "Programs, Life Cycles, and Laws of Software Evolution." *Proceedings of the IEEE*, 68(9), 1060–1076.
  — Eight laws of software evolution, especially: continuing change (systems must adapt or become progressively less satisfactory) and increasing complexity (entropy grows unless actively managed). **Foundation for Convoke's entropy as cross-cutting force.**

- Parunak, H. V. D. & Brueckner, S. (2001). "Entropy and Self-Organization in Multi-Agent Systems." *Proceedings of the Fifth International Conference on Autonomous Agents (AGENTS '01)*. ACM.
  — Applies thermodynamic entropy measures to multi-agent coordination. Shows how agent interactions can increase or decrease system entropy depending on organizational structure.

- De Holan, P. M. & Phillips, N. (2004). "Remembrance of Things Past? The Dynamics of Organizational Forgetting." *Management Science*, 50(11), 1603–1613.
  — Organizations can lose knowledge through accidental forgetting (failure to retain) or intentional unlearning. **Informs Convoke's entropy detection — knowledge decay is not just code rot but organizational memory loss.**

- Dumitru, A. (2025). "The Second Law of AI: How Entropy Shapes Agentic Systems." *arXiv* (2025).
  — Argues that multi-agent AI systems inherently tend toward disorder without active entropy management: coordination decay, context drift, capability degradation. **Directly validates Convoke's entropy dimension — every perimeter needs a "sensitize" function.**

- Storey, M. (2026). "How Generative and Agentic AI Shift Concern from Technical Debt to Cognitive Debt." https://margaretstorey.com/blog/2026/02/09/cognitive-debt/
  — As AI generates more code, human understanding erodes. (Also listed in Section 16.) **Cognitive debt as a specific manifestation of entropy in AI-augmented development.**

### Operationalized Entropy Management

- Zakutnii, I. (2025). "Quint Code — Systems Thinking for Programmers." *Neural Stack (Substack)*. https://ivanzakutnii.substack.com/p/quint-code-systems-thinking-for-programmers / https://github.com/m0n0x41d/quint-code
  — Decision engineering framework for AI coding agents, built on Levenchuk's First Principles Framework. Produces Decision Rationale Records (DRRs) — live artifacts with computed trust scores that degrade as evidence ages, expiry dates that trigger reviews, and rollback conditions. Evidence decay is explicit: every piece of evidence has a `valid_until` date; decisions auto-expire, becoming "questionable, not necessarily wrong, just unverified." Reasoning follows the ADI cycle (Abduction → Deduction → Induction). **The most concrete practitioner implementation of anti-entropy in an agentic context — operationalizes Lehman's continuing change law, Dumitru's second law, and De Holan's organizational forgetting into a working system. Directly informs how Convoke's "sensitize" function could work: artifacts with decay scores, automated staleness detection, and evidence-triggered review cycles.**

### Non-Pipeline Orchestration

- Thelosen, T. & Gillson, G. (2024–ongoing). *Gravity AI: Event-Driven Intelligence Platform*. https://www.gravity.ai/
  — Event-driven platform that routes work based on evidence signals rather than fixed pipeline stages. **Practitioner precedent for Convoke's gravity model — priority shifts based on what the system knows, not where it sits in a sequence.**

---

## 18. Domain Mesh Architecture & Composable Patterns

**Project relevance:** Domain Mesh infrastructure — how specialized disciplines (DataOps, MLOps, AgentOps) interconnect as decentralized, composable modules.

### Mesh Patterns

- Dehghani, Z. (2022). *Data Mesh: Delivering Data-Driven Value at Scale*. O'Reilly. ISBN: 9781492092391
  — Four principles: domain-oriented ownership, data as a product, self-serve infrastructure, federated governance. **Primary analogy for Convoke's domain mesh.**

- Istio Project / Linkerd. (2017–ongoing). *Service Mesh Architecture*. https://istio.io/ / https://linkerd.io/
  — Sidecar proxy pattern separating infrastructure concerns from business logic. Observability, traffic management, security.

- Broda, B. (2025). "Agentic Mesh: The Future of Generative AI-Enabled Autonomous Agent Ecosystems." *Medium / Data Science*. https://medium.com/data-science/agentic-mesh-the-future-of-generative-ai-enabled-autonomous-agent-ecosystems-d6a11381c979
  — Mesh topology for AI agent ecosystems: decentralized discovery, capability advertisement, dynamic routing, federated governance.

- Solace. (2017–ongoing). *Event Mesh Architecture*. https://solace.com/
  — Event-driven asynchronous communication patterns extending mesh thinking.

### Hexagonal & Clean Architecture

- Cockburn, A. (2005, updated 2024). *Hexagonal Architecture Explained*. https://alistair.cockburn.us/hexagonal-architecture/
  — Ports & Adapters pattern: application core isolated from external concerns. Standard interface contracts.

- Martin, R. C. (2017). *Clean Architecture: A Craftsman's Guide to Software Structure and Design*. Prentice Hall.
  — Dependency rule: dependencies always point inward. Informs domain module dependency structure.

- Evans, E. (2003). *Domain-Driven Design: Tackling Complexity in the Heart of Software*. Addison-Wesley. ISBN: 9780321125217
  — Bounded Contexts and Context Mapping. Each specialized discipline as a Bounded Context with explicit interfaces.

- Vernon, V. (2013). *Implementing Domain-Driven Design*. Addison-Wesley. ISBN: 9780321834577
  — Practical patterns for bounded context integration: shared kernel, customer-supplier, conformist, anticorruption layer.

### Ontological Grounding for Agent Interoperability

- Paul, N. J. (2025). "Ontology-Driven Agents: The Missing Layer for Enterprise AI." *Medium*. (Also listed in Section 16.)
  — The shared ontology layer ensures domain modules speak the same language. **Defines what each port *means* at each maturity level in Convoke's asymmetric port maturity model — when DataOps talks to AgentOps, they share entity definitions.**

- Graph Praxis. (2025). "From Domain Expertise to Autonomous Agents: Introducing the Agentic Graph Framework." *Medium / Graph Praxis*. (Also listed in Section 16.)
  — Graph-based agent communication: agents exchange structured subgraphs representing context, assumptions, and intent. **Complements Broda's Agentic Mesh with an explicit graph-based communication substrate for the domain mesh.**

- Gromov, S. (2026). "The Semantic Layer Is Dead. Now It's an API for AI Agents." *Medium*. (Also listed in Section 16.)
  — Domain modules should expose capabilities not as raw data access but as semantic APIs defining *what the data means*. **Maps to port maturity levels: L1 (advise) exposes a read-only semantic layer; L3 (build) generates new semantic definitions; L4 (monitor) continuously validates interpretation consistency.**

### Domain-Specific Engineering

- Huyen, C. (2022). *Designing Machine Learning Systems*. O'Reilly. ISBN: 9781098107963
  — End-to-end ML system design: data engineering, feature engineering, model development, deployment, monitoring.

- Huyen, C. (2025). *AI Engineering*. O'Reilly. ISBN: 9781098166298
  — Emerging discipline bridging ML research and production engineering.

- Google Cloud. (2021–ongoing). *MLOps: Continuous delivery and automation pipelines in machine learning*. https://cloud.google.com/architecture/mlops-continuous-delivery-and-automation-pipelines-in-machine-learning
  — MLOps maturity model (Levels 0–2).

- Sculley, D. et al. (2015). "Hidden Technical Debt in Machine Learning Systems." *NeurIPS 2015*.
  — ML-specific technical debt: data dependencies, configuration, feature extraction, monitoring.

- Linux Foundation. (2025). *Agentic AI Foundation*. https://www.linuxfoundation.org/press/linux-foundation-announces-the-formation-of-the-agentic-ai-foundation
  — Open infrastructure for agentic AI in production: governance, interoperability, standards.

### Agentic Data & Domain-Level Autonomy

- Multi-institutional. (2026). "Data Agents: A Survey on Levels of Agentic Autonomy in Data Engineering." *arXiv* (2026).
  — Proposes autonomy levels for AI agents in data domains (from tool-assisted to fully autonomous). **Relevant to Convoke's asymmetric port maturity model — domain modules graduate from advisory (Level 1) to autonomous (Level 3–4).**

### Composable & Federated Architectures

- Gartner. (2024). "Composable Business and Technology."
  — Modular, interchangeable components assembled to meet specific needs.

- WSO2. (2024). "Cell-Based Architecture."
  — Self-contained, independently deployable units of business functionality encapsulating compute, data, and governance.

---

## 19. Systematic Documentation

**Project relevance:** Proposed Archive module — systematic knowledge capture across the lifecycle.

- Procida, D. (2017–ongoing). *Diátaxis: A Systematic Framework for Technical Documentation*. https://diataxis.fr/
  — Four documentation types: Tutorials, How-to Guides, Reference, Explanation.

- Gentle, A. (2017, 3rd ed. 2022). *Docs Like Code*. Just Write Click. ISBN: 9781387531493
  — Docs-as-code workflows using version control, CI/CD, and automated publishing.

- Nygard, M. (2011). "Documenting Architecture Decisions." *Cognitect Blog*. https://www.cognitect.com/blog/2011/11/15/documenting-architecture-decisions
  — ADR template for lightweight architecture decision documentation.

- Fowler, M. et al. (2026). "Encoding Team Standards" and "Knowledge Priming." In *Patterns for Reducing Friction in AI-Assisted Development*. martinfowler.com. (Also listed in Section 16.)
  — Priming documents and encoded team standards as a new artifact type between traditional documentation and executable configuration. **Extends the documentation perimeter's scope: beyond capturing what is produced, to encoding how things should be done in a form both humans and AI agents can consume.**

---

## 20. Sunset & Technical Debt

**Project relevance:** Proposed Horizon module — lifecycle end management.

- Cunningham, W. (1992). "The WyCash Portfolio Management System." *OOPSLA 1992*.
  — Origin of the technical debt metaphor.

- Tornhill, A. (2018). *Software Design X-Rays: Fix Technical Debt with Behavioral Code Analysis*. Pragmatic Programmers. ISBN: 9781680502725
  — Behavioral code analysis for complexity hotspot identification and debt prioritization.

- Fowler, M. (2004). "Strangler Fig Application." *martinfowler.com*. https://martinfowler.com/bliki/StranglerFigApplication.html
  — Architectural pattern for incremental legacy modernization.

- Fowler, M. (2018). *Refactoring: Improving the Design of Existing Code* (2nd ed.). Addison-Wesley. ISBN: 9780134757599
  — Systematic techniques for improving code design while preserving behavior.

---

## 21. Change Management & Organizational Transformation

**Project relevance:** Proposed Catalyst module — governing and facilitating the transformation that Convoke's expansion creates.

### Classical Change Management

- Kotter, J. (1996, updated 2014). *Leading Change* / *Accelerate: The Power of Transformational Leadership*. Harvard Business School Press. https://www.kotterinc.com/methodology/8-steps/
  — Eight-step change model: create urgency → build coalition → form vision → enlist → enable → short-term wins → sustain → institute.

- Hiatt, J. (2000s–ongoing). *ADKAR: A Model for Change in Business, Government and Our Community*. Prosci. https://www.prosci.com/methodology/adkar
  — Individual-centered adoption: Awareness → Desire → Knowledge → Ability → Reinforcement.

- Lewin, K. (1947). Three-stage change model: Unfreeze → Change → Refreeze.
  — Classic framework for understanding resistance and designing interventions.

- Bridges, W. & Bridges, S. (1991). *Managing Transitions: Making Sense of Life's Changes*. Hachette.
  — Distinguishes external change from internal psychological transition: Ending → Neutral Zone → New Beginning.

- Peters, T. & Waterman, R. (1982). *In Search of Excellence*. Harper & Row.
  — McKinsey 7-S Framework: Structure, Strategy, Systems, Skills, Staff, Style, Shared Values.

### Organizational Design

- Skelton, M. & Pais, M. (2019, 2nd ed. 2024). *Team Topologies: Organizing Business and Technology Teams for Fast Flow*. IT Revolution Press. https://teamtopologies.com/
  — Four team types (Stream-aligned, Enabling, Complicated-subsystem, Platform) and three interaction modes.

- Kniberg, H. & Ivarsson, A. (2012). *Scaling Agile @ Spotify with Tribes, Squads, Chapters, and Guilds*. Crisp. https://www.atlassian.com/agile/agile-at-scale/spotify
  — Autonomous squad model with tribal alignment.

- Conway, M. (1967). Communication structures in systems design. LeRoy, J. & Simons, M. (2010). Inverse Conway Maneuver. https://martinfowler.com/bliki/ConwaysLaw.html
  — System architecture mirrors organizational structure; deliberately restructure teams to produce desired architecture.

- Trist, E. & Bamforth, K. (1951). Sociotechnical Systems Theory. Tavistock Institute.
  — Organizations as open systems with interdependent social and technical subsystems. Principle of joint optimization.

- Teece, D., Pisano, G. & Shuen, A. (1997). "Dynamic Capabilities and Strategic Management." *Strategic Management Journal*.
  — A firm's ability to adapt, integrate, and reconfigure resources for changing environments.

### Agentic Transformation (2024–2026)

- Randazzo, S., Lifshitz-Assaf, H., Kellogg, K., Dell'Acqua, F., Mollick, E. et al. (2024). "Cyborgs, Centaurs and Self-Automators." Harvard Business School / SSRN. https://papers.ssrn.com/sol3/papers.cfm?abstract_id=4921696
  — Three human-AI collaboration models with different learning and career outcomes.

- Anthropic. (2025–2026). "How AI Is Transforming Work at Anthropic." https://www.anthropic.com/research/how-ai-is-transforming-work-at-anthropic
  — Organizational case study: engineers as "managers of AI agents," 70%+ code review vs. net-new code.

- Brynjolfsson, E. & Li, D. (2023–2024). "Generative AI at Work." *NBER Working Paper*. https://www.nber.org/papers/w31161
  — 15% average productivity gain; less experienced workers benefit most.

- McKinsey & Company. (2025–2026). "The Agentic Organization." https://www.mckinsey.com/capabilities/people-and-organizational-performance/our-insights/the-agentic-organization-contours-of-the-next-paradigm-for-the-ai-era
  — Organizational redesign for AI: flatter structures, higher context sharing, rapid decision-making.

- Google Cloud. (2026). *AI Agent Trends 2026: Five Shifts That Will Redefine Roles, Workflows, and Organizations*. https://services.google.com/fh/files/misc/google_cloud_ai_agent_trends_2026_report.pdf
  — Five shifts: Task-to-Role-Based AI, Multi-Agent Orchestration, Governance, Team Empowerment, Measurable Results.

- Mollick, E. (2024). *Co-Intelligence: Living and Working with AI*. Penguin Random House. ISBN: 9780593716717
  — Three structural pillars: AI in leadership, AI labs, democratize AI to the crowd.

### Governance & Decision-Making

- The Open Group. *TOGAF Standard, Version 9.2*. https://pubs.opengroup.org/architecture/togaf9-doc/arch/chap44.html
  — Architecture Development Method with governance processes. 80% Fortune 500 adoption.

- Snowden, D. (1999–ongoing). "A Leader's Framework for Decision Making." *Harvard Business Review* (2007). https://thecynefin.co/about-us/about-cynefin-framework/
  — Cynefin Framework: Clear, Complicated, Complex, Chaotic, Disorder. Matches decision approach to context.

- IEEE Global Initiative. (2019–present). *IEEE 7000 Series: Design of Autonomous and Intelligent Systems*. https://standards.ieee.org/industry-connections/activities/ieee-global-initiative/
  — Five core principles: Human Rights, Well-being, Accountability, Transparency, Minimizing Misuse.

- European Union. (2024). *Regulation (EU) 2024/1689 on Artificial Intelligence (EU AI Act)*. https://digital-strategy.ec.europa.eu/en/policies/regulatory-framework-ai
  — Risk-based regulatory framework for AI systems.

- NIST. (2023). *AI Risk Management Framework*. https://www.nist.gov/documents/2023/01/30/artificial-intelligence-risk-management-framework-1
  — Voluntary framework for responsible AI development across the system lifecycle.

- ISO/IEC. (2023). *ISO/IEC 42001:2023 — AI Management System Standard*. https://www.iso.org/standard/81399.html
  — First international standard for organizational AI governance.

### Adoption & Diffusion

- Rogers, E. (1962, 5th ed. 2003). *Diffusion of Innovations*. Free Press.
  — Adoption curve: Innovators → Early Adopters → Early Majority → Late Majority → Laggards.

- Moore, G. (1991, 3rd ed. 2014). *Crossing the Chasm*. HarperCollins.
  — The gap between early adopters and early majority; whole-product strategies.

- Fogg, B. J. (2019). *Tiny Habits: The Small Changes That Change Everything*. Houghton Mifflin Harcourt.
  — Behavior = Motivation + Ability + Prompt. Designing micro-behaviors for frictionless adoption.

- Eyal, N. (2014). *Hooked: How to Build Habit-Forming Products*. Penguin.
  — Trigger → Action → Variable Reward → Investment. Engagement loop design.

- Thaler, R. & Sunstein, C. (2008). *Nudge: Improving Decisions About Health, Wealth, and Happiness*. Yale University Press.
  — Choice architecture that alters behavior predictably without restricting options.

- Edmondson, A. (1999–ongoing). "Psychological Safety and Learning Behavior in Work Teams." *Administrative Science Quarterly*. https://psychsafety.com/about-psychological-safety/
  — Psychological safety as foundational enabler of team experimentation and learning. Strongest predictor of successful AI adoption across reviewed literature.

- Agrawal, A., Gans, J. & Goldfarb, A. (2018 / 2023). *Prediction Machines* / *Power and Prediction*. Basic Books.
  — AI as a drop in prediction cost; economic framework for understanding organizational AI adoption.

---

## 22. Prospective Research Directions

The following areas represent theoretical domains where Convoke could be further enriched. These are flagged for future exploration.

### Agent Architecture Evolution

- **Agentic memory systems** — Long-term memory, retrieval-augmented generation for persistent agent context across sessions. Relevant to Vortex agents maintaining discovery state.
- **Agent evaluation & benchmarking** — Standardized benchmarks for multi-agent system performance (AgentBench, GAIA). Relevant to measuring Convoke team effectiveness.
- **Emergent behavior in agent teams** — How agent collaboration produces outcomes beyond individual capabilities. Theoretical grounding for Vortex's compass routing emergent properties.

### Discovery Theory

- **Opportunity Solution Trees (OST)** — Teresa Torres's framework for connecting outcomes to opportunities to solutions. Not yet integrated; high synergy with Mila → Liam handoff.

### Extended Lifecycle

- **Platform Engineering** — Emerging discipline bridging SRE and developer experience. Relevant to Gyre's evolving scope.
- **FinOps** — Cloud cost optimization as a readiness dimension. Potential expansion for Atlas's capabilities model.
- **Customer Support & Success** — Dedicated workflows for support-driven development, customer health scoring, and satisfaction monitoring.
- **Accessibility & Inclusive Design** — WCAG compliance and universal design principles as a cross-cutting concern.
- **Localization & Internationalization** — i18n/L10n as a growth enabler for global markets.

---

## Cross-Reference: Project Components → Key References

| Project Component | Primary References |
|---|---|
| **Vortex Architecture** | Appelo — *unFIX Model / Innovation Vortex* (2022), Wooldridge — *An Introduction to Multiagent Systems* (2002), Anthropic — "Building Effective AI Agents" (2024) |
| **Emma (Contextualize)** | Ries — *The Lean Startup* (2011), Blank — *The Four Steps to the Epiphany* (2005), Maurya — *Running Lean* (2012) |
| **Isla (Empathize)** | Gray et al. — *Gamestorming* (2010), Brown — *Change by Design* (2009), Torres — *Continuous Discovery Habits* (2021) |
| **Mila (Synthesize)** | Christensen et al. — *Competing Against Luck* (2016), Ulwick — *Jobs to Be Done: Theory to Practice* (2016), Bland & Osterwalder — *Testing Business Ideas* (2019) |
| **Liam (Hypothesize)** | Gothelf & Seiden — *Lean UX* (2013), Bland & Osterwalder — *Testing Business Ideas* (2019), Yao et al. — "Tree of Thoughts" (2023) |
| **Wade (Externalize)** | Ries — *The Lean Startup* (2011), Robinson — "Minimum Viable Product" (2001), Kohavi et al. — *Trustworthy Online Controlled Experiments* (2020) |
| **Noah (Sensitize)** | Majors et al. — *Observability Engineering* (2022), Green & Swets — *Signal Detection Theory and Psychophysics* (1966), CNCF — *OpenTelemetry* |
| **Max (Systematize)** | Argyris — "Double Loop Learning in Organizations" (1977), Senge — *The Fifth Discipline* (1990), Ries — "Pivot or Persevere" in *The Lean Startup* (2011) |
| **Compass Routing** | Buchanan — "Wicked Problems in Design Thinking" (1992), Chen et al. — "AgentVerse" (2023), Anthropic — "Building Effective AI Agents" (2024) |
| **Handoff Contracts (HC/GC)** | FIPA — *Agent Communication Language Specifications* (2003), Microsoft — "AutoGen Handoff Pattern" (2023), Google — "Agent-to-Agent Protocol (A2A)" (2024) |
| **Gyre (Production Readiness)** | Forsgren et al. — *Accelerate* (2018), Beyer et al. — *Site Reliability Engineering* (2016), Humble & Farley — *Continuous Delivery* (2010) |
| **Enhance (RICE Backlog)** | McBride — "RICE: Simple prioritization for product managers" (2016), Osterwalder et al. — *Value Proposition Design* (2014) |
| **Team Factory** | Cagan — *Empowered* (2020), Weiss — *Multiagent Systems* (2013), CrewAI — "Framework for orchestrating role-playing AI agents" (2024) |
| **BMAD Core Architecture** | Hong et al. — "MetaGPT" (2023), Wang et al. — "ChatDev" (2023), Wu et al. — "AutoGen" (2023), Qian et al. — "ChatDev 2.0" (2025) |
| | |
| **— STRUCTURAL PRINCIPLES —** | |
| **Gravity Model (Non-Linear Lifecycle)** | Holling — "Panarchy / Adaptive Cycles" (2001), Gunderson & Holling — *Panarchy* (2002), Gravity AI — "Event-Driven Intelligence" (2024+), "Orchestration of MAS" (2026), Womack & Jones — *Lean Thinking* (1996), Ohno — *Toyota Production System* (1988) |
| **Entropy (Cross-Cutting Force)** | Lehman — "Laws of Software Evolution" (1980), Parunak & Brueckner — "Entropy and Self-Organization in MAS" (2001), De Holan & Phillips — "Organizational Forgetting" (2004), Dumitru — "Second Law of AI" (2025), Storey — "Cognitive Debt" (2026), Zakutnii — "Quint Code: Evidence Decay & DRRs" (2025) |
| **Lean Flow & WIP Governance** | Womack & Jones — *Lean Thinking* (1996), Ohno — *Toyota Production System* (1988), Reinertsen — *Principles of Product Development Flow* (2009) |
| **Asymmetric Port Maturity** | CSA — *AI Agent Capability Framework* (2024), Cockburn — *Hexagonal Architecture* (2005), "Data Agents: Levels of Autonomy" (2026) |
| **Infrastructure vs. Practice Perimeters** | Skelton & Pais — *Team Topologies* (2019), Dehghani — *Data Mesh* (2022), Evans — *Domain-Driven Design* (2003) |
| | |
| **— PROPOSED PERIMETERS (PRACTICE) —** | |
| **Strategy Perimeter** | Porter — *Competitive Strategy* (1980), Lafley & Martin — *Playing to Win* (2013), Wardley — *Wardley Maps* (2018), Osterwalder — *Business Model Generation* (2010) |
| **Delivery Perimeter** | Humble & Farley — *Continuous Delivery* (2010), Hodgson — *Feature Flag Best Practices* (2020), Forsgren et al. — *Accelerate* (2018) |
| **Growth Perimeter** | Bush — *Product-Led Growth* (2019), McClure — "Pirate Metrics AARRR" (2007), Ellis — "North Star Metric" (2013), Kohavi et al. — *Trustworthy Online Controlled Experiments* (2020) |
| **Operations Perimeter** | Beyer et al. — *Site Reliability Engineering* (2016), Rosenthal et al. — *Chaos Engineering* (2020), PagerDuty — *Incident Response* (2015+) |
| **Security Perimeter** | Shostack — *Threat Modeling* (2014), OWASP — *DevSecOps Guideline* (2021+), NIST — *SSDF SP 800-218* (2022), EU — *AI Act* (2024), "TRiSM for Agentic AI" (2025) |
| **Sunset Perimeter** | Cunningham — "Technical Debt" (1992), Tornhill — *Software Design X-Rays* (2018), Fowler — "Strangler Fig Pattern" (2004) |
| **Governance Perimeter** | Kotter — *Leading Change* (1996), Skelton & Pais — *Team Topologies* (2019), Mollick — *Co-Intelligence* (2024), Snowden — "Cynefin Framework" (2007), Edmondson — "Psychological Safety" (1999+) |
| | |
| **— PROPOSED PERIMETERS (INFRASTRUCTURE) —** | |
| **Knowledge Engineering** | Polanyi — *The Tacit Dimension* (1966), Nonaka & Takeuchi — *The Knowledge-Creating Company* (1995), Kagdi et al. — "Mining Software Repositories" (2007), Microsoft — *GraphRAG* (2024+), Storey — "Cognitive Debt" (2026), Graph Praxis — "Agentic Graph Framework" (2025), Paul — "Ontology-Driven Agents" (2025), Gromov — "Semantic Layer as API for Agents" (2026), Oliver — "Seven-Pillar Ontology" (2026), Fowler — "Encoding Team Standards" & "Knowledge Priming" (2026) |
| **Documentation** | Procida — *Diátaxis* (2017+), Gentle — *Docs Like Code* (2017), Nygard — "Architecture Decision Records" (2011), Fowler — "Encoding Team Standards" & "Knowledge Priming" (2026) |
| **Entropy Management** | Lehman — "Laws of Software Evolution" (1980), Dumitru — "Second Law of AI" (2025), Parunak & Brueckner — "Entropy in MAS" (2001), Zakutnii — "Quint Code: Evidence Decay & DRRs" (2025) |
| **Mesh Infrastructure** | Dehghani — *Data Mesh* (2022), Cockburn — *Hexagonal Architecture* (2005), Evans — *Domain-Driven Design* (2003), Broda — "Agentic Mesh" (2025), Graph Praxis — "Agentic Graph Framework" (2025), Paul — "Ontology-Driven Agents" (2025), Gromov — "Semantic Layer as API for Agents" (2026) |
| | |
| **— DOMAIN MESH MODULES —** | |
| **DataOps Domain** | Dehghani — *Data Mesh* (2022), Huyen — *Designing Machine Learning Systems* (2022), "Data Agents: Levels of Autonomy" (2026) |
| **MLOps Domain** | Google Cloud — *MLOps Maturity Model* (2021+), Huyen — *AI Engineering* (2025), Sculley et al. — "Hidden Technical Debt in ML Systems" (2015) |
| **AgentOps Domain** | Anthropic — *MCP* (2024), Google — *A2A Protocol* (2024), Linux Foundation — *Agentic AI Foundation* (2025), Yang et al. — "SWE-agent" (2024) |
| **PlatformOps Domain** | Skelton & Pais — *Team Topologies* (2019), Gartner — "Composable Architecture" (2024) |
