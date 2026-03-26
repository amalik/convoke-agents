# Convoke Agents — Theoretical Foundations & References

> Comprehensive bibliography mapping the theoretical foundations of the Convoke Agents project.
> Each reference is linked to the specific project component(s) it underpins.
>
> **Last updated:** March 2026

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
11. [Prospective Research Directions](#11-prospective-research-directions)

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

---

## 10. Prioritization & Backlog Management

**Project relevance:** Enhance module — RICE-scored initiatives backlog for PM agent.

- McBride, S. (2016). "RICE: Simple prioritization for product managers." *Intercom Blog*. https://www.intercom.com/blog/rice-simple-prioritization-for-product-managers/
  — RICE scoring (Reach × Impact × Confidence / Effort). **Direct source for Enhance's prioritization methodology.**

- Osterwalder, A., Pigneur, Y., Bernarda, G., & Smith, A. (2014). *Value Proposition Design*. Wiley. ISBN: 9781118968055
  — Value Proposition Canvas. Complementary to JTBD for prioritization decisions.

---

## 11. Prospective Research Directions

The following areas represent theoretical domains where Convoke could be further enriched. These are flagged for future exploration.

### Agent Architecture Evolution

- **Agentic memory systems** — Long-term memory, retrieval-augmented generation for persistent agent context across sessions. Relevant to Vortex agents maintaining discovery state.
- **Agent evaluation & benchmarking** — Standardized benchmarks for multi-agent system performance (AgentBench, GAIA). Relevant to measuring Convoke team effectiveness.
- **Emergent behavior in agent teams** — How agent collaboration produces outcomes beyond individual capabilities. Theoretical grounding for Vortex's compass routing emergent properties.

### Discovery Theory

- **Opportunity Solution Trees (OST)** — Teresa Torres's framework for connecting outcomes to opportunities to solutions. Not yet integrated; high synergy with Mila → Liam handoff.
- **Wardley Mapping** — Simon Wardley's value chain mapping for strategic context. Complementary to Emma's contextualization stream.
- **Cynefin Framework** — Dave Snowden's sense-making framework for complexity domains. Could inform compass routing decisions (which stream fits the current problem domain).

### Production Readiness

- **Platform Engineering** — Emerging discipline bridging SRE and developer experience. Relevant to Gyre's evolving scope.
- **Chaos Engineering** — Rosenthal et al. (2020) *Chaos Engineering: System Resiliency in Practice*. Gap in Gyre's current assessment framework.
- **FinOps** — Cloud cost optimization as a readiness dimension. Potential expansion for Atlas's capabilities model.

### Cross-Cutting

- **Sociotechnical Systems Theory** — Trist & Bamforth (1951), organizational design as interplay of social and technical systems. Theoretical frame for why agent teams mirror human team structures.
- **Conway's Law & Inverse Conway Maneuver** — How communication structures shape system architecture. Relevant to Team Factory's composition patterns.

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
| **BMAD Core Architecture** | Hong et al. — "MetaGPT" (2023), Wang et al. — "ChatDev" (2023), Wu et al. — "AutoGen" (2023) |
