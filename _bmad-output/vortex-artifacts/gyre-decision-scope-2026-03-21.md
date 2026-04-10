---
title: "Scope Decision: Gyre — Operational Readiness"
date: 2026-03-21
created-by: Amalik with Emma (contextualization-expert)
type: scope-decision
status: DECIDED
version: 1.0
---

# Scope Decision: Gyre — Operational Readiness

## Decision Summary

**Selected Problem Space:** Production readiness discovery — helping software teams discover what's missing from their production stack before incidents reveal it.

**Rationale:** Gyre completes the Convoke lifecycle (discover → build → operate), addresses a validated $4.5B market with zero competitors in agent-guided discovery, and serves as the platform-proving second team module (ADR-001 Phase 1). Domain research, product brief, full PRD, architecture, and epics all complete. Weighted score: 4.52/5.

**De-scoped (Not Now):** FinOps agent (v3), Compliance & Security agent (v2), policy-as-code generation (v2), org-wide aggregation (v3), CI-integrated anticipation mode (v2), runtime/APM analysis, autonomous remediation.

---

## Problem Opportunities Considered

Unlike Forge (which was selected from 7 competing opportunities), Gyre's problem space was identified as the critical lifecycle gap during Convoke's strategic planning. The evaluation below validates this selection against the same criteria used for Forge.

| # | Opportunity | Description | Disposition |
|---|-----------|-------------|-------------|
| 1 | **Operational readiness discovery** | Teams don't know what "production ready" means for their specific stack. Discovery of unknown-unknowns across observability, deployment, compliance, security, and cost | **SELECTED** — 4.52/5 |
| 2 | Incident response automation | AI-powered triage, root cause analysis, and remediation during incidents | De-scoped — reactive (Gyre is proactive). Crowded market (Resolve AI, PagerDuty AIOps). |
| 3 | IDP scorecard management | Manage and enforce readiness scorecards across teams | De-scoped — IDPs (Cortex, Backstage) already do this. Gyre discovers *what* to score; IDPs *score* it. Complementary, not competitive. |
| 4 | SRE automation (toil reduction) | Automate repetitive SRE tasks: log rotation, certificate renewal, scaling | De-scoped — commodity tooling. No discovery value. |
| 5 | Cost optimization / FinOps | Cloud cost analysis, right-sizing, waste detection | De-scoped for MVP — valid domain but narrower reach. Planned as v3 agent. |
| 6 | Compliance-as-code generation | Generate OPA/Kyverno policies from regulatory requirements | De-scoped for MVP — generation follows discovery. Planned as v2 feature. |

---

## Evaluation Criteria

| # | Criterion | Weight | Description |
|---|----------|--------|-------------|
| 1 | Problem severity | 5 | How painful and widespread is the problem? |
| 2 | User reach | 4 | How many teams/organizations face this? |
| 3 | Strategic fit | 5 | Does this align with Convoke's mission and platform architecture? |
| 4 | Feasibility | 4 | Can we build this with proven patterns and reasonable effort? |
| 5 | Evidence quality | 3 | How confident are we in the problem and solution? |

---

## Scoring Matrix

| Opportunity | Severity (×5) | Reach (×4) | Strategic Fit (×5) | Feasibility (×4) | Evidence (×3) | Weighted Avg |
|------------|---------------|------------|--------------------|--------------------|---------------|-------------|
| **Operational readiness discovery** | **5** | **4** | **5** | **4** | **4** | **4.52** |
| Incident response automation | 4 | 4 | 2 | 3 | 3 | 3.19 |
| IDP scorecard management | 3 | 3 | 3 | 4 | 3 | 3.19 |
| SRE automation (toil reduction) | 3 | 4 | 2 | 4 | 3 | 3.10 |
| Cost optimization / FinOps | 3 | 3 | 3 | 4 | 3 | 3.19 |
| Compliance-as-code generation | 3 | 3 | 4 | 3 | 2 | 3.10 |

---

## Selected Scope

### Problem Space

Software teams don't know what they don't know about production readiness. The failure isn't a lack of expertise — SRE books, DORA research, and compliance frameworks exist. The failure is that teams cannot map existing knowledge to their specific product context, leaving critical readiness gaps invisible until incidents reveal them.

**Key evidence:**
- Domain research (2026-03-19): $4.5B SRE platform market, 14.2% CAGR
- 66% of engineering leaders cite inconsistent standards across teams as top blocker
- Zero competitors in agent-guided discovery of context-specific readiness criteria
- Existing tools (Cortex, Backstage) measure readiness; none discover what "ready" means for a specific stack

### Boundaries (What's In)

| Dimension | In Scope |
|-----------|----------|
| **Domains** | Observability readiness + Deployment readiness (MVP). Cross-domain correlation between these two |
| **Analysis** | Static analysis (codebase, IaC, CI/CD configs, dependency manifests) + generated contextual model (absence detection) |
| **Users** | Sana (engineering lead — primary), Ravi (SRE/platform engineer — force multiplier), Priya (compliance officer — from v2) |
| **Output** | RICE-scored readiness backlog (3 severity tiers, source-tagged, confidence-rated) + markdown leadership summary |
| **Operating mode** | Crisis mode (one-shot assessment — MVP). Most common entry point |
| **Delivery** | Convoke team module — 4 conversational persona agents (Scout, Atlas, Lens, Coach) in Claude Code |
| **Agents** | Scout 🔎 (stack detective), Atlas 📐 (model curator), Lens 🔬 (readiness analyst), Coach 🏋️ (review coach) |
| **Contracts** | GC1 (Scout→Atlas: stack profile), GC2 (Atlas→Lens: capabilities manifest), GC3 (Lens→Coach: readiness backlog), GC4 (Coach→user: review session) |

### Boundaries (What's Out)

| Dimension | Out of Scope | Rationale |
|-----------|-------------|-----------|
| **Domains** | Compliance & Security, FinOps | v2/v3 — MVP proves pattern with 2 domains first |
| **Analysis** | Runtime analysis, APM integration, live traffic | Requires production access; static + contextual sufficient for discovery |
| **Generation** | Policy-as-code, observability-as-code, IaC generation | v2 — discovery before generation |
| **Scale** | Org-wide aggregation, portfolio view | v3 — requires multi-team adoption first |
| **Mode** | Anticipation mode (CI integration, continuous) | v2 — crisis mode is the entry point |
| **Remediation** | Autonomous fixes, automated PRs | Out of philosophy — Gyre discovers and recommends, humans decide |
| **Users** | Solo developers, pre-MVP teams | No operational complexity to warrant readiness discovery |

---

## Strategic Fit

### Convoke Lifecycle Completion
Gyre is the "last mile" of the Convoke platform:
- **Vortex** discovers what to build (product discovery)
- **BMM** builds it (implementation)
- **Gyre** ensures it runs reliably at scale (operational readiness)

Without Gyre, validated and built products fail to reach users reliably. This lifecycle integration is the competitive moat — no standalone SRE tool can replicate the journey from idea to production.

### ADR-001 Build Sequence
Gyre is P1 (Active — Phase 1 E1), first in the ADR-001 sequence:
1. **Gyre E1** ← current phase (proves second team module pattern)
2. Enhance MVP (extracts templates from Vortex + Gyre)
3. Vortex redesign (align to Enhance patterns)
4. Forge (scaffolded by Enhance as third team)

Gyre's success validates the multi-module architecture that Enhance will codify.

### Forge↔Gyre Integration
Handoff contracts designed for ecosystem compounding:
- **FG-HC1:** Forge TKAs → Gyre contextual model enrichment
- **FG-HC2:** Forge regulatory context assessments → Gyre compliance domain
- **GF-HC1:** Gyre gap findings → Forge extraction queue (knowledge gaps discovered in production feed back to domain knowledge capture)

These activate post-Forge Gate 4 — designed but not blocking either team's development.

### Market Position
- **Blue ocean:** Zero competitors in agent-guided discovery of context-specific readiness
- **Complementary to IDPs:** Gyre discovers → exports as IDP scorecard rules → AI SRE tools operate
- **Framework-first:** Recommendations reference standards (DORA, OpenTelemetry, SLSA, FinOps), not vendor tools

---

## Next Steps

1. **Stream 2 (Empathize)** — Develop lean personas for Gyre's users (Sana, Ravi, Priya) with full JTBD, forces, and success criteria
2. **Stream 3 (Synthesize)** — Converge evidence from domain research, product brief, and PRD into HC2 problem definition
3. **Streams 4-7** — Complete hypothesis contracts, experiment design, signal framework, and decision framework
4. **Continue E1 development** — Vortex discovery runs in parallel with Gyre E1 implementation (discovery validates the "why" while E1 builds the "what")

---

**Created with:** Convoke v2.3.1 - Vortex Pattern (Contextualize Stream)
**Agent:** Emma (Contextualization Expert)
**Workflow:** contextualize-scope
