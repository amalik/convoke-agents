---
stepsCompleted: [step-01-init, step-02-discovery, step-02b-vision, step-02c-executive-summary, step-03-success, step-04-journeys]
inputDocuments:
  - _bmad-output/planning-artifacts/product-brief-gyre-2026-03-19.md
  - _bmad-output/planning-artifacts/research/domain-operational-readiness-research-2026-03-19.md
  - docs/agents.md
  - docs/development.md
  - docs/BMAD-METHOD-COMPATIBILITY.md
workflowType: 'prd'
documentCounts:
  briefs: 1
  research: 1
  projectDocs: 3
classification:
  projectType: "AI Discovery Agent (primary) — npm/CLI delivery"
  domain: "Production Readiness Discovery"
  complexity: "high — product novelty & trust, not regulatory"
  projectContext: "brownfield infrastructure, greenfield product"
---

# Product Requirements Document - Gyre

**Author:** Amalik
**Date:** 2026-03-20

## Executive Summary

**Gyre tells you what's missing from your production stack that you didn't know to look for.**

Gyre is the second Convoke team module — an AI discovery agent that detects what's *absent but should exist* in your production stack. Where Vortex covers product discovery and BMM handles implementation, Gyre closes the final gap: the transition from "built" to "runs reliably at scale."

The core problem is not a lack of expertise — SRE books, DORA research, and compliance frameworks exist. The failure is that teams cannot map existing knowledge to their specific product context, leaving critical gaps invisible until they cause incidents. 98% of engineering leaders report major fallout from launching inadequately prepared services. Existing tools (Cortex, Backstage) measure *how ready* you are against predefined criteria. Gyre discovers *what ready means* for your specific stack — the criteria themselves. No current product offers agent-guided discovery of context-specific readiness.

Gyre's primary innovation is the **generated contextual model**: the agent detects the team's stack, generates a capabilities manifest (`.gyre/capabilities.yaml`) of what *should* exist — using agent knowledge of industry standards (DORA, OpenTelemetry, Google PRR), web search for current best practices, and a guard question to confirm architecture intent — then compares it against what *does* exist. Absence detection — finding what's missing, not just what's misconfigured — is the core value. The model is team-owned: reviewed, amended, version-controlled, and respected on re-run. Gyre detects any stack; model richness varies by community knowledge density (a Node.js/Kubernetes model will be richer than a Rust/bare-metal model out of the box — team amendments close the gap).

Two MVP agents (Observability Readiness + Deployment Readiness) with cross-domain correlation produce a RICE-scored readiness backlog — blockers, recommended, nice-to-have — that integrates into sprint planning. Findings are source-tagged (static analysis vs contextual model) and confidence-rated. Two operating modes: crisis (one-shot assessment for teams already in production with debt — the most common entry point) and anticipation (continuous from first commit — teams shift to this once stabilized). First findings surface in under two minutes — fast enough to run before a sprint planning meeting.

Target users: Sana (engineering lead, primary — pulls readiness items into sprints), Ravi (SRE/platform engineer — deploys org-wide, tracks portfolio risk trends), Priya (compliance officer — validates regulatory findings from v2).

Validated by domain research ($4.5B SRE platform market, 14.2% CAGR, zero competitors in agent-guided discovery). MVP pilot: 5 teams, same cohort for user interviews and product testing.

### What Makes This Special

**Generated contextual model.** No pre-built models. Gyre generates for any detected architecture, producing the "aha!" findings — gaps teams didn't know to check. The `.gyre/capabilities.yaml` manifest persists as a team-owned artifact that improves with each amendment.

**Accurate by design.** Adapts to your stack, prevents category errors with an architecture intent guard question ("container-based or serverless?"), learns from your corrections via review-and-amend, and tags every finding with confidence level and source. Gyre asks what it missed — after each analysis, a feedback prompt captures gaps Gyre didn't catch, the only way to improve absence detection over time.

**Cross-domain compound findings.** Findings across domains that no single-domain tool can see. "No rollback telemetry + no deployment markers = blind rollbacks." This is the moment teams realize Gyre sees what they couldn't.

## Project Classification

| Dimension | Value |
|-----------|-------|
| **Project Type** | AI Discovery Agent (primary) — npm/CLI delivery |
| **Domain** | Production Readiness Discovery |
| **Complexity** | High — product novelty & trust requirements, not regulatory |
| **Project Context** | Brownfield infrastructure (Convoke module system), greenfield product (new domain, new agents, new knowledge base) |
| **Lifecycle Position** | Completes Vortex → BMM → Gyre pipeline (long-term moat, not MVP narrative) |

## Success Criteria

### User Success

| Metric | Target | Persona | Measurement |
|--------|--------|---------|-------------|
| Sprint pull rate | Sana pulls ≥1 Gyre finding into her next sprint | Sana | Post-pilot interview + sprint board review |
| Ad-hoc assessment reduction | Ravi uses portfolio view to replace ≥1 ad-hoc readiness assessment per quarter with trend-based tracking | Ravi | Quarterly survey |
| Organic referral | ≥1 pilot team recommends Gyre to another team unprompted | Sana/Ravi | Exit interview |

### Business Success

| Metric | Target | Measurement |
|--------|--------|-------------|
| Incident reduction | Pilot teams report fewer readiness-related incidents within 2 sprints of adoption | Post-pilot interview |
| Word-of-mouth | ≥2 inbound inquiries from non-pilot teams during pilot period | Inbound tracking |

### Technical Success

| Metric | Target | Measurement |
|--------|--------|-------------|
| First-run model accuracy | ≥70% of generated capabilities confirmed relevant by team (before amendments) | Review-and-amend data |
| Post-amendment model accuracy | ≥85% of capabilities confirmed relevant (after team review) | Amended manifest diff |
| Stack diversity | Contextual model generated successfully for ≥3 distinct stacks | Pilot stack coverage |
| Time-to-first-finding | <2 minutes from `gyre analyze .` to first finding displayed | CLI instrumentation |
| False negative detection | Feedback prompt captures ≥1 missed gap per pilot team | `.gyre/feedback.yaml` data |
| Review-and-amend adoption | ≥60% of pilot teams modify the generated manifest | Manifest amendment tracking |
| Cross-domain hit rate | ≥1 cross-domain compound finding per analysis run | Finding source tags |
| Novel findings | ≥30% of findings sourced from contextual model (not static analysis alone) | Source tag ratio |

### Qualitative Validation

| Metric | Target | Measurement |
|--------|--------|-------------|
| "Aha!" discovery | ≥4/5 pilot teams report at least one finding they would not have discovered without Gyre | Post-pilot interview |

**Divergence note:** Novel findings (quantitative) and "aha!" discovery (qualitative) measure the same promise differently. If they diverge — high novel % but low "aha!" — Gyre's value is breadth (many small discoveries). If low novel % but high "aha!" — value is depth (few shocking ones). Both are valid but inform different positioning.

### Measurable MVP Outcomes

| Outcome | Threshold | Validates |
|---------|-----------|-----------|
| Pilot completion | 5/5 teams complete full analysis cycle | Product is usable end-to-end |
| Re-run rate | ≥3/5 teams run Gyre again within 30 days | Product has ongoing value, not one-shot |
| Backlog integration | ≥3/5 teams create tickets from Gyre findings | Findings are actionable, not academic |
| Severity agreement | ≥4/5 teams agree with RICE severity ordering without manual override | Prioritization is trustworthy |
| Architecture intent accuracy | ≥90% of teams confirm guard question correctly detected architecture | Guard prevents category errors |

### Anti-Metrics (What We Refuse to Optimize)

| Anti-Metric | Why |
|-------------|-----|
| Readiness "score" as KPI | Scores create gaming behavior. Gyre produces a backlog, not a grade. |
| Finding count | More findings ≠ better. One correct blocker > twenty nice-to-haves. |
| Time spent in Gyre | Gyre should be fast and forgettable. Sprint planning is the destination, not Gyre's UI. |
| Breadth over accuracy | Covering 10 domains poorly is worse than covering 2 domains well. MVP depth > breadth. |

## Product Scope

### MVP Feature Classification

Features are classified into three tiers based on their role in validating the product hypothesis:

**M — Measurement Infrastructure** (must ship first — required to measure whether H features work)

| # | Feature | Purpose |
|---|---------|---------|
| M1 | Architecture intent guard question | Prevents category errors that contaminate all downstream metrics |
| M2 | Source tagging (static vs contextual) | Required to measure novel findings ratio |
| M3 | Confidence tagging | Required to measure model accuracy |
| M4 | Review-and-amend workflow | Provides ground truth for accuracy measurement — team amendments define what "correct" means |

**H — Hypothesis-Testing** (must ship — directly tests "can Gyre discover unknown unknowns?")

| # | Feature | Hypothesis Tested |
|---|---------|-------------------|
| H1 | Stack detection & analysis | Can Gyre accurately detect what a team has? |
| H2 | Contextual model generation (`.gyre/capabilities.yaml`) | Can Gyre generate what a team *should* have? |
| H3 | Observability Readiness agent | Can Gyre discover observability gaps? |
| H4 | Deployment Readiness agent | Can Gyre discover deployment gaps? |
| H5 | Cross-domain correlator | Do compound findings deliver "aha!" moments? |
| H6 | False negative feedback prompt (`.gyre/feedback.yaml`) | Can Gyre learn what it missed? |

**Q — Product Quality** (can ship v1.1 — improves experience but doesn't test hypothesis)

| # | Feature | Value |
|---|---------|-------|
| Q1 | RICE scoring & severity classification | Prioritizes findings for sprint planning |
| Q2 | Severity-first leadership summary | Leads with "0 blockers, 3 recommended, 12 nice-to-have" |
| Q3 | Crisis mode (one-shot) | Entry point for teams with existing production debt |
| Q4 | Anticipation mode (continuous) | Ongoing readiness for teams from first commit |

**Build sequence:** M → H → Q. Measurement infrastructure ships first so every hypothesis feature can be evaluated from day one.

### Growth (v2)

- Compliance & Security Readiness agent
- Capacity & FinOps Readiness agent
- Priya persona support (compliance officer — accuracy satisfaction metric activates here)
- Team-shared model library (`.gyre/` manifests shared across org)
- CI/CD integration (Gyre as pipeline gate)

### Vision (v3+)

- Community model marketplace (teams publish amendments for common stacks)
- Historical trend analysis (readiness improvement over time)
- Predictive gap detection (anticipate gaps before they manifest)
- Multi-repo organizational portfolio view (Ravi's full vision)
