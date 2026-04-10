---
stepsCompleted: [1, 2, 3, 4, 5]
inputDocuments:
  - _bmad-output/planning-artifacts/research/domain-operational-readiness-research-2026-03-19.md
  - _bmad-output/planning-artifacts/initiatives-backlog.md
date: 2026-03-19
author: Amalik
---

# Product Brief: Gyre — Operational Readiness Team

## Executive Summary

Gyre is the second Convoke team — an operational readiness module that discovers the production readiness gaps your team doesn't know exist, then produces the artifacts to close them. Where Vortex covers product discovery and BMM handles implementation, Gyre closes the final gap: the transition from "built" to "runs reliably at scale" across observability, deployment, compliance, security, cost, and infrastructure.

AI agents across four readiness domains (Observability, Deployment, Compliance & Security, Capacity & FinOps) lead teams through a context-aware, architecture-specific discovery cycle. Gyre asks before it advises — understanding your stack, traffic patterns, regulatory context, and failure modes before recommending what "ready" means for your product. The discovery protocol itself is the IP.

Gyre's output is code, not counsel: SLO definitions, observability-as-code configs, policy-as-code definitions, runbook templates, IaC verification results, and a stakeholder-facing launch readiness dashboard — all version-controllable artifacts that live in your repo. No current product offers this combination of unknown-unknowns discovery, context-awareness, and artifact-first output.

---

## Core Vision

### Problem Statement

Software teams don't know what they don't know about production readiness. The core failure isn't a lack of expertise — SRE books, DORA research, and compliance frameworks exist. The failure is that teams cannot map existing knowledge to their specific product context, leaving critical readiness gaps invisible until they cause incidents.

98% of engineering leaders report major fallout from launching services that aren't adequately prepared. The problem spans the full industrialization landscape — and teams consistently underestimate its scope:

- **Observability gaps** — Teams don't know what to monitor or how to structure alerts (OpenTelemetry, golden signals)
- **Deployment fragility** — CI/CD pipelines, IaC (Terraform, Kubernetes), and rollback strategies are untested or ad-hoc
- **Compliance blind spots** — Regulations (GDPR, EU AI Act, SOC 2) apply but teams don't know which or how to operationalize them
- **Security debt** — DevSecOps, supply chain security (SLSA/SBOM), and security-by-design are skipped under delivery pressure
- **Cost surprises** — No FinOps strategy, no cloud cost guardrails, no capacity planning
- **No structured process** — 66% of leaders cite inconsistent standards across teams as their top blocker

### Problem Impact

- **Revenue loss:** Outages, scale failures, and security breaches directly impact the bottom line
- **Wasted effort:** Teams either over-comply (burning resources on irrelevant controls) or under-comply (risking penalties and incidents)
- **Broken lifecycle:** Product discovery (Vortex) and build (BMM) deliver validated, implemented products — but without production readiness, the value never reaches users at scale
- **Team burnout:** Ad-hoc operational work creates firefighting culture, on-call fatigue, and attrition
- **Leadership blind spot:** PMs and executives have no structured way to assess "when can we go live?" — they rely on engineering estimates with no visibility into actual readiness

### Why Existing Solutions Fall Short

| Solution Type | What It Does | What It Misses |
|--------------|-------------|----------------|
| **Checklists** (Google PRR, AWS ORR) | Static verification gates | Not adaptive — same checklist regardless of product. Requires SRE expertise to conduct. |
| **IDPs** (Cortex, Backstage, OpsLevel) | Measure readiness via scorecards | Measure "how ready are we?" but not "what does ready look like for us?" |
| **AI SRE tools** (Resolve AI, Ciroos) | Autonomous incident response | Reactive — handle incidents after they happen, not readiness before launch |
| **Consulting** | Human-guided assessments | Doesn't scale. Expensive. Knowledge walks out the door. |
| **Frameworks** (DORA, SPACE, SRE books) | Define what to measure | Don't guide teams through achieving it. Assume expertise the team may not have. |

### Proposed Solution

Gyre is a Convoke team module (installed alongside Vortex) that **discovers readiness gaps your team doesn't know exist, then produces the artifacts to close them**. Code, not counsel. Gyre asks before it advises — understanding your architecture, stack, traffic patterns, regulatory context, and failure modes before recommending what readiness means for *your* product. The discovery protocol itself is the product: the questions Gyre asks are as valuable as the answers it generates.

**Gyre Readiness Agents**

| Agent | Scope | Key Standards |
|-------|-------|---------------|
| **Observability Readiness** | Telemetry strategy, golden signals, alert design, SLO/error budget definition, monitoring architecture, observability-as-code (declarative alert configs, dashboard-as-code templates) | OpenTelemetry, DORA metrics, SRE golden signals |
| **Deployment Readiness** | CI/CD pipeline verification, IaC review (Terraform/Kubernetes), GitOps practices, rollback testing, canary/blue-green, golden path compliance | DORA deployment frequency, CNCF standards |
| **Compliance & Security Readiness** | Regulation discovery, control mapping, supply chain security (SLSA/SBOM), DevSecOps baseline, policy-as-code generation (OPA/Kyverno), security-by-design review, threat modeling, hardening, vulnerability management | GDPR, SOC 2, EU AI Act, PCI-DSS, SLSA, OWASP, CIS benchmarks |
| **Capacity & FinOps Readiness** | Load testing, scaling strategy, cloud cost engineering, cost guardrails, capacity planning | FinOps Foundation, AWS Well-Architected Cost pillar |

**The 7-Stream Cycle adapted for Gyre:**

1. **Contextualize** — Understand the product's operational landscape: architecture, dependencies, traffic patterns, regulatory context, infrastructure choices
2. **Empathize** — Understand operator/SRE needs, on-call pain, end-user reliability expectations, PM/leadership visibility needs
3. **Synthesize** — Map readiness gaps across observability, deployment, compliance, security, and cost. Cross-reference against applicable standards.
4. **Hypothesize** — Define readiness criteria: SLOs, error budgets, deployment frequency targets, compliance gates, cost thresholds
5. **Externalize** — Test readiness: chaos engineering, load testing, failover drills, rollback verification, security scans, cost projections
6. **Sensitize** — Monitor readiness in production: DORA metrics, SLO burn rate, incident frequency, compliance drift, cost anomalies
7. **Systematize** — Encode learnings: update runbooks, refine alerts, adjust SLOs, feed criteria into IDP scorecards, generate stakeholder reports

**Discovery Method — Dual-Mode Analysis:**

Gyre's discovery is observation-based, not declaration-based. Observations are sounder than declarations — code doesn't lie, self-assessments do. Two complementary analysis modes:

- **Static analysis** — Analyzes what's *present*: codebase, IaC definitions, CI/CD configs, observability setup, dependency manifests. Detects misconfigurations, drift, and gaps in existing infrastructure.
- **Contextual model (generated, not pre-built)** — Detects what's *absent but should exist*. Gyre detects the stack from the codebase, then generates a capabilities manifest (`.gyre/capabilities.yaml`) tailored to that architecture — using agent knowledge, web search for current best practices, and clarifying questions if the context is ambiguous. The manifest persists in the repo as a version-controlled, team-owned artifact. Teams review and amend it ("we intentionally don't use liveness probes — we use a service mesh"), and Gyre respects amendments on re-run. No pre-built models to maintain. No stack limitation. No unsupported architectures — the agent generates for any stack it detects.
- **Architecture intent** — Gyre discovers readiness gaps, it does not prescribe architecture. If a team chose Lambda, Gyre assesses Lambda-specific readiness (cold starts, concurrency, CloudWatch observability), not suggest switching to Kubernetes. The contextual model includes an architecture intent layer — understanding *why* the team made their choices before flagging what's missing.

**Readiness Backlog — RICE-Scored, Not Flat Checklists:**

Gyre's output is a prioritized readiness backlog, not a flat list of action items. Each gap is scored using RICE (Reach, Impact, Confidence, Effort) and classified into three severity tiers: **blockers** (launch-blocking), **recommended** (should fix), **nice-to-have** (aspirational). Technical findings carry confidence indicators. Regulatory/legal findings always flag for expert review — Gyre surfaces potential applicability ("EU user data detected in schema — GDPR likely applies, recommend compliance review") but never claims certainty on legal matters. The backlog format integrates naturally into existing sprint planning workflows — teams pull readiness items alongside feature work.

**Two Operating Modes:**

- **Anticipation mode** — Runs early and continuously from first commit. Surfaces structural gaps (missing observability instrumentation, IaC drift, compliance requirements) when they're cheap to fix. Continuous re-assessment tracks readiness evolution alongside product development.
- **Crisis mode** — One-shot assessment for teams already in production with debt. "We just got our first enterprise client, they want SOC 2, we have 6 weeks." Produces a prioritized readiness backlog immediately — the 5 things blocking your audit, in order. Crisis mode is the more common *entry point*; teams adopt Gyre when something goes wrong, then shift to anticipation mode once stabilized.

**Gyre Output Artifacts:**

| Artifact | Audience | Purpose |
|----------|----------|---------|
| **Readiness Report & Dashboard** | Engineering + PM/Leadership | RICE-scored readiness backlog with three severity tiers and confidence levels (engineering view) and readiness evidence with business-translated blockers, role-based sign-off status, and timeline (leadership view). Gyre provides evidence for human launch decisions, not automated verdicts. Single artifact, dual rendering. |
| **SLO Definitions** | SRE / Engineering | Service-level objectives with error budgets, calibrated to product context |
| **Compliance Checklist** | Engineering + Legal | Applicable regulations mapped to required operational controls |
| **Policy-as-Code Definitions** | Platform / DevOps | OPA/Kyverno policies generated from discovered compliance & security requirements |
| **Observability-as-Code Configs** | Platform / DevOps | Declarative alert definitions, dashboard templates, SLO burn rate monitors |
| **IaC Verification Results** | Platform / DevOps | Infrastructure-as-code review against golden path standards |

### Key Differentiators

1. **Context-aware discovery** — Gyre asks about your architecture, stack, and context before advising. No generic checklists — readiness criteria tailored to *your* product.
2. **Cross-domain gap correlation** — Gyre connects findings across domains: "Your CI/CD has no rollback telemetry + your observability has no deployment markers = blind rollbacks." Single-domain tools can't see these compound risks.
3. **Observation over declaration** — Gyre analyzes code, IaC, CI/CD configs, and dependency manifests directly. No self-assessment surveys — objective findings from your actual codebase.
4. **Completes the lifecycle (competitive moat)** — Post-it → validated idea (Vortex) → built product (BMM) → production at scale (Gyre). One platform, full journey. This lifecycle integration is the moat no standalone SRE tool can replicate — Gyre's competitive advantage deepens when used with Vortex and BMM.
5. **Expertise made addressable** — Doesn't replace SRE knowledge — makes Google PRR, AWS ORR, and DORA expertise addressable to your specific context. A compiler for operational standards, not a library.
6. **Code, not counsel** — Policy-as-code, observability-as-code, IaC verification. Every Gyre output is a declarative, version-controllable artifact that lives in your repo — not advice that lives in someone's memory.
7. **Dual audience** — Technical guidance for engineers AND a launch readiness view for PMs and leadership. Single artifact, dual rendering.
8. **Dual-mode: anticipation and crisis** — Anticipation mode runs from first commit; crisis mode provides one-shot assessment for teams already in production with debt. Most teams enter through crisis and shift to anticipation once stabilized.
9. **Complementary to IDPs** — Gyre discovers what "ready" means → exports as IDP scorecard rules → AI SRE tools operate on it. Direct integration, not just partnership.
10. **Framework-first, tool-agnostic** — Recommendations reference standards (DORA, OpenTelemetry, SLSA, FinOps), not specific vendor tools.

### Beyond Launch Readiness

Gyre's discovery protocol extends beyond its primary use case:

- **Team onboarding** — New engineers get the Readiness Report as service context: "Here's what our service needs to stay healthy."
- **M&A due diligence** — Assess operational maturity of acquisition targets before closing.
- **Vendor evaluation** — Run discovery against SaaS dependency architectures to evaluate production-grade readiness.

## Target Users

### Primary Persona

**Sana — Engineering Lead / Tech Lead**

- **Role:** Leads a team of 5-12 engineers shipping a product or service. At a startup, she wears all hats (SRE, compliance, platform). At an enterprise, she has Ravi and Priya as support.
- **Problem:** Knows the service "should" have better monitoring and rollback strategies but doesn't know where to start or what "good" looks like for her specific stack. Ad-hoc checklists copied from blog posts, inconsistent across teams.
- **Core need:** A prioritized answer to "what are the 3 things that will hurt me most?" Gyre's RICE-scored readiness backlog lets her pull the highest-impact blockers into sprint planning alongside feature work. Must work out of the box with sensible defaults — no configuration required, whether she's the only technical leader (startup) or part of a larger org.
- **Critical constraint:** First-run credibility. If the first analysis produces false positives, engineers write it off by week two.
- **Success vision:** "Gyre analyzed our codebase and told me exactly what was missing — things I didn't even think to check. The backlog is prioritized so we fix what matters first."

### Supporting Personas

**Ravi — SRE / Platform Engineer (Force Multiplier)**

- **Role:** Maintains platform infrastructure, defines golden paths, supports multiple product teams. Operates in two modes: (1) reviewing a single team's output, (2) deploying Gyre org-wide as a platform capability.
- **Problem:** Teams come to him too late — "we're launching Monday, can you review?" Stretched thin across too many services.
- **Core need:** Cross-team consistency, normalized outputs, aggregate views. Portfolio risk trends (improving/declining) with context normalization — risk trends and improvement trajectories, not team leaderboards. Gyre is a team tool, not a management ranking tool.
- **Success vision:** "Teams come to me with readiness reports based on actual code analysis. I see risk trends across all my services and know which need attention. I review artifacts, not hand-hold."

**Priya — Compliance & Security Officer (Validator)**

- **Role:** Ensures services meet regulatory (GDPR, EU AI Act, SOC 2, PCI-DSS) and security requirements. Configures compliance requirements early via Gyre, monitors drift continuously, reviews at milestones.
- **Problem:** Asks engineering teams "are you GDPR compliant?" and gets blank stares. Reviews happen too late.
- **Core need:** Artifacts immediately deployable to the team's actual stack — not generic templates. Regulatory findings always flag for expert review — Gyre surfaces potential applicability, never claims certainty on legal matters. Compliance sign-off is a launch gate in the role-based sign-off workflow.
- **Success vision:** "Gyre flagged GDPR and EU AI Act as potentially applicable and told me why. I validated. The policy-as-code definitions match our infrastructure. I review at milestones with evidence, not in panic before launch."

*PMs and engineering managers consume the dashboard's leadership view for launch readiness evidence — business-translated blockers and role-based sign-off status. CTO/Head of Engineering is a buyer persona for go-to-market, not a product user.*

### Anti-Personas

- **Solo developers / side projects** — No operational complexity to warrant readiness discovery
- **Pre-MVP teams** — Nothing in production yet; Vortex and BMM are the right tools at this stage

### User Journey

1. **Trigger** — Incident or compliance pressure. Sana or Ravi runs Gyre on one service in crisis mode. Dual-mode analysis surfaces gaps: static analysis finds misconfigurations, contextual model flags what's absent (missing health checks, no structured logging). Surfaces things the team didn't know were missing.
2. **Discovery & trust** — RICE-scored backlog prioritizes action. Cross-domain correlation reveals compound risks ("no rollback telemetry + no deployment markers = blind rollbacks"). Team disputes a finding — investigation confirms Gyre was right. Trust earned through challenge. *(From v2: Priya validates compliance findings when the Compliance & Security agent ships.)*
3. **Spread** — Engineer-to-engineer. Ravi tells Sana, Sana's PM notices the dashboard data. Ravi deploys org-wide in platform mode. Leadership gets visibility through the dashboard's leadership rendering.
4. **Continuous** — Anticipation mode. Priya monitors compliance drift at milestones. Ravi tracks portfolio risk trends. Readiness becomes a continuous signal, not a gate.

*Enterprise adoption (top-down) is a separate go-to-market path — CTO evaluates, pilots, mandates — but the same product.*

## Success Metrics

### User Success (one per persona)

| Metric | Persona | Target |
|--------|---------|--------|
| **Readiness items pulled into sprint planning** within 2 sprints of discovery | Sana | >70% of blocker-tier items actioned |
| **Reduction in ad-hoc readiness review requests** to SRE/platform team | Ravi | 50% reduction at 6 months |
| **Regulatory finding accuracy** — % of flags validated as correct by compliance officer *(measurable from v2 when Compliance & Security agent ships)* | Priya | >85% accuracy |

### Business Metrics

| Metric | Timeframe | Target |
|--------|-----------|--------|
| **Organic adoption** — engineer-to-engineer referral | 3 months | Each adopting team refers ≥1 other team |
| **Incident reduction** — fewer readiness-gap-related production incidents | 6 months | Measurable reduction in adopting teams |

### Anti-Metrics (What NOT to Optimize)

- **Readiness score as a KPI** — scores track improvement, not team ranking
- **Number of findings** — signal-to-noise ratio matters more than volume
- **Time spent in Gyre** — shorter is better. Gyre should be fast, not engaging

## MVP Scope

### Core Features (MVP)

**Two agents + Cross-domain Correlation + Dual-Mode Analysis**

Thickened MVP — the generated contextual model removed the biggest implementation cost (no pre-built stack models to research and validate), freeing effort for scope that validates more hypotheses.

**What Sana experiences:**

| Feature | Description | Validates |
|---------|-------------|-----------|
| **Observability Readiness agent** | Golden signals, alert design, SLO gaps, telemetry coverage, structured logging assessment | Single-domain discovery creates value |
| **Deployment Readiness agent** | CI/CD pipeline verification, IaC review, rollback strategy, golden path compliance | Pattern transfers across domains |
| **Cross-domain correlation** | Compound risk findings across domains: "no rollback telemetry + no deployment markers = blind rollbacks" | Key differentiator proven in MVP |
| **Generated contextual model** | Gyre generates a capabilities manifest (`.gyre/capabilities.yaml`) tailored to the detected stack — using agent knowledge, web search, and a guard question ("container-based or serverless?"). Team reviews, amends, and owns it. No stack limitation. | Absence detection — the "aha!" moment |
| **RICE-scored readiness backlog** | Prioritized findings: blockers / recommended / nice-to-have. Confidence levels. Source-tagged (static vs. contextual). | Sana pulls items into sprints |
| **Markdown leadership summary** | Second output — readiness summary with blockers for copy-paste into Confluence, Slack, or email. LLM-consumable. | Dual-audience validated |

**What `gyre analyze .` outputs:**

```
$ gyre analyze .

Detected: Node.js/Express on Kubernetes (EKS)
Generated capabilities manifest: .gyre/capabilities.yaml (review and amend)

📋 READINESS BACKLOG (12 findings — 2 blockers, 5 recommended, 5 nice-to-have)

🔴 BLOCKER | Observability | No request duration histogram
   Source: contextual-model | Confidence: high
   Impact: Cannot define latency SLOs without this metric
   RICE: 8.4 | Effort: 2h

🔴 BLOCKER | Deployment × Observability | Blind rollbacks
   Source: cross-domain | Confidence: high
   No rollback telemetry + no deployment event markers = cannot detect failed deploys
   RICE: 9.1 | Effort: 4h

🟡 RECOMMENDED | Deployment | No canary deployment strategy
   ...

📄 Leadership summary written to: .gyre/readiness-summary.md
```

**Fallback:** If generated contextual models prove unreliable (>20% false positive rate), Gyre still delivers full static analysis value. The contextual model is additive — it produces the "aha!" findings, but static analysis alone surfaces misconfigurations and drift that teams can act on immediately.

### Out of Scope for MVP

| Deferred Feature | Why It Waits | When It Comes |
|-----------------|-------------|---------------|
| **Multi-component composite models** | MVP generates a single model per repo. Composite models for hybrid architectures (e.g., Node.js API + Python ML service) come later. | v2 — composite generation for multi-stack repos |
| **Compliance & Security, FinOps agents** | Each agent is a full domain. Two MVP agents validate the pattern first. | v2-v3 — one agent per release, based on demand |
| **Policy-as-code / observability-as-code generation** | Discovery is core value; generation is an accelerator | v2 — after discovery validated |
| **Org-wide aggregation / portfolio view** | Ravi's scale need. Requires multi-team usage first | v3 |
| **Anticipation mode (CI integration)** | MVP is inherently crisis mode (one-shot). Continuous mode requires CI hooks | v2 |
| **Role-based sign-off workflow** | Multi-user collaboration feature | v3 |

### MVP Success Criteria

| Criteria | Threshold | Decision |
|----------|-----------|----------|
| **Sana pulls items into sprints** | >70% of blocker-tier items actioned within 2 sprints | Proceed to v2 |
| **Generated model accuracy** | <20% false positive rate on generated capabilities manifests across pilot stacks (the kill switch — if generated models aren't accurate enough, rethink before v2) | Proceed to v2 |
| **Novel findings** | ≥2 contextual-model-sourced findings per analysis the team didn't previously track | Discovery protocol validated |
| **Cross-domain correlation value** | ≥1 compound risk finding per analysis that teams confirm as valid | Key differentiator validated |
| **Organic referral** | ≥3 of 5 pilot teams refer another team within 3 months | Product-market fit signal |

If any threshold fails, investigate before building v2.

**Pilot strategy:** 5 teams, one cohort for both user interviews (Wade's experiment — validate personas and assumptions) and MVP testing. Interview first, build for their stacks, measure success criteria against their usage.

### Future Vision

**v2 — Anticipation + Code Generation:**
- CI integration for continuous anticipation mode
- Composite model generation for multi-stack repos
- Observability-as-code and policy-as-code generation
- Compliance & Security agent (third domain)

**v3 — Platform Scale:**
- FinOps agent (fourth domain)
- Org-wide aggregation for Ravi's platform operator mode
- Role-based sign-off workflow

**Long-term:**
- IDP scorecard export (Cortex, Backstage integration)
- Secondary use cases: team onboarding, M&A due diligence, vendor evaluation

<!-- Content will be appended sequentially through collaborative workflow steps -->
