# Convoke Planning & Brainstorming Outputs

**Last Updated:** 2026-02-14

---

## Overview

This directory contains all planning artifacts, analysis documents, and brainstorming outputs for the Convoke project.

**Project Goal:** Enhance BMAD Method with domain-specialized agents covering design, quality, and standards domains.

**Architectural Decision:** BMAD-First Architecture with Agent Enhancement (v1.4.0)

---

## 🚨 Major Update (2026-02-14): Domain-Specialized Agents

**Current Approach:** Enhancing BMAD with domain-specialized agents using standard BMAD agent architecture.

**Implementation:**
- Week 1: Design agents (empathy-mapper, wireframe-designer)
- Week 2: Quality & standards agents (quality-gatekeeper, standards-auditor)
- Week 3: Integration testing & decision gate

**Architecture:** All agents built using BMAD Agent Architecture Framework (v1.1.0) - standardized interface supporting any domain expertise.

**See:**
- [Project README](../README.md) for user-facing documentation
- [GENERIC-AGENT-INTEGRATION-FRAMEWORK.md](GENERIC-AGENT-INTEGRATION-FRAMEWORK.md) for architecture details

---

## Document Index

### 📋 Planning Artifacts

**Core Decision Documents:**
- [architectural-decision-record.md](./planning-artifacts/architectural-decision-record.md) ⭐ **START HERE** - BMAD-First Architecture decision (v1.4.0 - Agent Enhancement)
- [phase-0-implementation-guide.md](./planning-artifacts/phase-0-implementation-guide.md) ⭐ **IMPLEMENTATION READY** - Detailed guide for 4 new agents
- [ORIGINAL-VISION-README.md](./planning-artifacts/ORIGINAL-VISION-README.md) - Earlier multi-framework vision (archived)
- [integration-roadmap.md](./planning-artifacts/integration-roadmap.md) - 27-week implementation plan (Phases 0-5) - **SUPERSEDED**
- [baseartifact-contract-spec.md](./planning-artifacts/baseartifact-contract-spec.md) - Technical foundation v2.0.0 - **DEFERRED**

**Analysis Documents:**
- [framework-deep-dive-analysis.md](./planning-artifacts/framework-deep-dive-analysis.md) ⭐ **NEW (2026-02-07)** - How BMAD/DesignOS/AgentOS actually work
- [phase-0-alternative-agent-integration.md](./planning-artifacts/phase-0-alternative-agent-integration.md) - Alternative approach analysis
- [phase-0-workflow-map.md](./planning-artifacts/phase-0-workflow-map.md) - Original orchestration plan (superseded)
- [technical-deep-dive-analysis.md](./planning-artifacts/technical-deep-dive-analysis.md) - 50K+ word analysis of all 4 frameworks
- [architectural-comparison-quint-vs-bmad-first.md](./planning-artifacts/architectural-comparison-quint-vs-bmad-first.md) - Options 1 & 2 comparison
- [greenfield-architecture-analysis.md](./planning-artifacts/greenfield-architecture-analysis.md) - Option 3 evaluation

**Supporting Documents:**
- [product-brief-Convoke-2026-02-01.md](./planning-artifacts/product-brief-Convoke-2026-02-01.md) - Product vision and strategy
- [4-framework-comparison-matrix.md](./planning-artifacts/4-framework-comparison-matrix.md) - Framework capabilities matrix
- [executive-summary-presentation.md](./planning-artifacts/executive-summary-presentation.md) - Stakeholder presentation
- [align-command-prototype.md](./planning-artifacts/align-command-prototype.md) - `/align` command specification

---

### 🧠 Brainstorming Outputs (2026-02-05)

**Session Topic:** Phase 0 POC Implementation - Orchestration Capabilities Across All 4 Frameworks

**Core Documents:**
- [brainstorming-session-2026-02-05.md](./brainstorming/brainstorming-session-2026-02-05.md) ⭐ **Phase 0 Focus** - Complete brainstorming session results
- [alignment-summary.md](./brainstorming/alignment-summary.md) ⭐ **Critical** - How brainstorming refines ADR decisions

**Reference Materials:**
- [orchestration-patterns-catalog.md](./brainstorming/orchestration-patterns-catalog.md) - Complete 100-pattern catalog across 15 families
- [architectural-decision-framework.md](./brainstorming/architectural-decision-framework.md) - 7 foundational dimensions for decisions
- [llm-agnostic-architecture.md](./brainstorming/llm-agnostic-architecture.md) ⭐ **Critical** - LLM-agnostic design (capabilities vs skills)

---

## Key Decisions Summary

### Architectural Approach: BMAD-First (v1.3.0)

**Foundation:** BMAD Method's proven markdown-based workflow engine

**LLM-Agnostic Design:** Core architecture uses "capabilities" (portable to any LLM). Claude integration exposes as "skills" (slash commands).

**Phase 0 Scope Refinement (2026-02-06):** Defer Quint SQLite integration to Phase 2, focus Phase 0 on pure markdown orchestration.

**Agent Architecture:**
1. **Standard Interface:** All agents use BMAD Agent Architecture Framework
   - XML-based agent structure inside markdown code blocks
   - Standard menu structure (MH, CH, custom workflows, PM, DA)
   - Fuzzy command matching support
   - Slash command invocation: `/bmad-agent-{module}-{agent-name}`

2. **Workflow Patterns:** Three architectural patterns available
   - Pattern 1: Step-file architecture (sequential workflows)
   - Pattern 2: YAML + instructions (configuration-driven workflows)
   - Pattern 3: Hybrid (combined approach)

3. **State Management:** BMAD Markdown artifacts
   - Markdown files are source of truth (Git version control)
   - Config-driven variables (user_name, communication_language, output_folder)
   - Output artifacts in `_bmad-output/` directories

4. **Implementation Size (Phased - REVISED 2026-02-07):**
   - **Phase 0 (Weeks 1-3):** 500 LOC - Agent Enhancement
     - Emma (empathy-mapper): 235 LOC
     - Wade (wireframe-designer): 280 LOC
     - Quinn (quality-gatekeeper): 295 LOC
     - Stan (standards-auditor): 380 LOC
     - Cross-agent orchestration: 50 LOC
     - Total: ~1,240 LOC actual (500 LOC estimate for agents only)
   - **Phase 2 (Weeks 8-9):** +500 LOC - Quint sync adapter (UNCHANGED)
     - MD→SQLite Writer (200) + SQLite→MD Reader (150) + Conflict Resolution (50) + Retry Logic (100)
   - **Total:** 1,000 LOC (vs original 2,300 LOC estimate) - **57% reduction**

---

## Timeline

### Phase 0: POC - Domain-Specialized Agents (Weeks 1-3) ← **CURRENT FOCUS**
**Goal:** Enhance BMAD with 4 domain-specialized agents for design and quality workflows

**Scope:** Design agents + Quality/standards agents using BMAD agent architecture

**Deliverables:**
- **Week 1:** Design agents
  - Emma (empathy-mapper) - User empathy mapping workflows
  - Wade (wireframe-designer) - Rapid wireframe generation
- **Week 2:** Quality & standards agents
  - Quinn (quality-gatekeeper) - Quality gate decision workflows
  - Stan (standards-auditor) - Code standards compliance checking
- **Week 3:** Integration & Testing
  - Cross-agent workflow orchestration
  - Party mode integration
  - Documentation & decision gate

**LOC:** ~500 LOC per agent (~1,240 LOC total for 4 agents)

**Decision Gate (Week 3):** Evaluate agent approach success, proceed to Phase 1 or iterate on agent design

---

### Phase 1: Contract Foundation (Weeks 4-7)
**Goal:** Establish BaseArtifact v2.0.0 foundation

---

### Phase 1: Contract Foundation (Weeks 4-7)
**Goal:** Establish BaseArtifact foundation and expand agent capabilities

---

### Future Phases: TBD
**Scope:** Based on Phase 0 decision gate results and user feedback

---

## Pattern Analysis Insights

From [brainstorming-session-2026-02-05.md](./brainstorming/brainstorming-session-2026-02-05.md):

**100 Patterns Explored Across 15 Families:**
- Integration Interface (Skills, Tools, Steps, Hybrid)
- State Management (Centralized, Distributed, Event-Sourced, Ephemeral)
- Reliability (Resilience, Performance, Security, Testing, Debugging)
- Evolution (Versioning, Experimental Rollout, Living Docs)
- Multi-Tenancy (Isolation, Collaboration)
- Intelligence (AI-Augmented Routing, Detection, Healing)
- Experimental (Edge Computing, Advanced Patterns)

**7 Foundational Dimensions Identified:**
1. Interface Model (How frameworks expose capabilities)
2. Control Flow (How execution flows across frameworks)
3. State Management (Where state lives and how it syncs)
4. Reliability Strategy (How system handles failures)
5. Evolution Model (How system changes over time)
6. Multi-Tenancy Approach (How users/projects coexist)
7. Intelligence Level (How much AI augmentation)

**Key Insight:** Brainstorming VALIDATED BMAD-First decision and provided implementation clarity (HOW to build orchestration + Quint adapter). Phase 0 scope refinement reduces risk by validating orchestration before database sync complexity.

---

## Quick Navigation

**Starting Phase 0 POC Implementation? (UPDATED 2026-02-14)**
1. Read: [GENERIC-AGENT-INTEGRATION-FRAMEWORK.md](GENERIC-AGENT-INTEGRATION-FRAMEWORK.md) ⭐ (BMAD Agent Architecture Framework v1.1.0)
2. Reference: [EMMA-REFERENCE-IMPLEMENTATION-COMPLETE.md](EMMA-REFERENCE-IMPLEMENTATION-COMPLETE.md) ⭐ (Emma reference implementation)
3. Follow: [phase-0-implementation-guide.md](./planning-artifacts/phase-0-implementation-guide.md) (Complete implementation guide for 4 agents)
4. Test: [EMMA-TESTING-GUIDE.md](EMMA-TESTING-GUIDE.md) (Testing procedures for agents)

**Need Architecture Details?**
- Interface contracts: [baseartifact-contract-spec.md](./planning-artifacts/baseartifact-contract-spec.md)
- Technical deep-dive: [technical-deep-dive-analysis.md](./planning-artifacts/technical-deep-dive-analysis.md)
- Framework comparison: [4-framework-comparison-matrix.md](./planning-artifacts/4-framework-comparison-matrix.md)

**Workflow Patterns Reference:**
- Step-file architecture: [_bmad/bme/_designos/workflows/empathy-map/](../_bmad/bme/_designos/workflows/empathy-map/)
- YAML + instructions: See framework documentation Part 2
- Hybrid patterns: See framework documentation Part 2

---

## Status

**Decision Status:** ✅ ACCEPTED (BMAD Agent Architecture - Domain Specialization)
**Implementation Status:** 🚧 Phase 0 POC (Week 1) - Emma created, testing in progress
**Latest Update:** BMAD Agent Architecture Framework v1.1.0 complete. Emma (empathy-mapper) reference implementation created. Documentation cleaned of external framework references.
**Next Milestone:** Emma testing completion, then Wade creation (Week 1)

---

## Contributing

All planning documents follow markdown standards with YAML frontmatter for metadata tracking.

**Document Types:**
- **ADRs** (Architecture Decision Records): Capture key architectural decisions with rationale
- **Analysis**: Deep-dive technical analysis and comparisons
- **Planning**: Roadmaps, specifications, timelines
- **Brainstorming**: Pattern exploration and creative ideation

---

## Contact

**Convoke Core Team**
**Project Start:** 2026-02-01
**Latest Update:** 2026-02-14 (Documentation cleanup: removed external framework references, clarified domain-specialized agent approach)
