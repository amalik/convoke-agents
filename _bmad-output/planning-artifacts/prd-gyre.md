---
stepsCompleted: [step-01-init, step-02-discovery, step-02b-vision, step-02c-executive-summary, step-03-success, step-04-journeys, step-05-domain, step-06-innovation, step-07-project-type, step-08-scoping, step-09-functional, step-10-nonfunctional, step-11-polish, step-12-complete]
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

## How to Read This Document

**By audience:**
- **VP / Stakeholder (5 min):** Executive Summary + Success Criteria
- **Engineer / Sana-type (15 min):** Executive Summary + User Journeys + CLI Requirements
- **Architect (20 min):** Executive Summary + Functional Requirements + Non-Functional Requirements + Innovation Architecture
- **PM / Epic Creator (full):** All sections. Start with Traceability Matrix (end of Functional Requirements) to see the full feature → FR → journey → metric mapping.

**Section dependency chain:**
```
Executive Summary (standalone)
├── Success Criteria (what we measure)
├── Product Scope (what we build, in what order)
├── User Journeys (how users experience it)
├── Domain Requirements (constraints and quality gates)
├── Innovation Architecture (why this is novel, what protects differentiation)
├── CLI Requirements (project-type specifics)
├── Scoping (MVP strategy, resources, risks)
├── Functional Requirements (THE capability contract — synthesizes all above)
└── Non-Functional Requirements (how well the system performs)
```

**Traceability:** Vision → Success Criteria → User Journeys → Functional Requirements. Every FR traces back to a journey, which traces to a success metric, which traces to the vision. If you disagree with an FR, trace it back through the chain.

### Terminology

| Term | Meaning |
|------|---------|
| Contextual model | The concept: a generated description of what capabilities a stack should have |
| Capabilities manifest | The artifact: `.gyre/capabilities.yaml`, the file that embodies the contextual model |
| Model accuracy | How relevant the capabilities manifest is to the actual stack — not LLM model performance |
| Agent | A domain-specific analyzer (Observability agent, Deployment agent) — not the LLM itself |
| Finding | A specific gap identified by an agent — either an absence or a misconfiguration |
| Compound finding | A finding that spans two domains, revealing an interaction effect |

## Executive Summary

**Gyre tells you what's missing from your production stack that you didn't know to look for.**

Gyre is the second Convoke team module — an AI discovery agent that detects what's *absent but should exist* in your production stack. Where Vortex covers product discovery and BMM handles implementation, Gyre closes the final gap: the transition from "built" to "runs reliably at scale."

The core problem is not a lack of expertise — SRE books, DORA research, and compliance frameworks exist. Teams cannot map existing knowledge to their specific product context, leaving critical gaps invisible until they cause incidents. 98% of engineering leaders report major fallout from launching inadequately prepared services. Existing tools (Cortex, Backstage) measure *how ready* you are against predefined criteria. Gyre discovers *what ready means* for your specific stack — the criteria themselves. No current product offers agent-guided discovery of context-specific readiness.

Gyre's primary innovation is the **generated contextual model**: the agent detects the team's stack, generates a capabilities manifest (`.gyre/capabilities.yaml`) of what *should* exist — using agent knowledge of industry standards (DORA, OpenTelemetry, Google PRR), web search for current best practices, and a guard question to confirm architecture intent — then compares it against what *does* exist. Absence detection — finding what's missing, not just what's misconfigured — is the core value. The model is team-owned: reviewed, amended, version-controlled, and respected on re-run. Gyre detects any stack; model richness varies by community knowledge density (a Node.js/Kubernetes model will be richer than a Rust/bare-metal model out of the box — team amendments close the gap).

Two MVP agents (Observability Readiness + Deployment Readiness) with cross-domain correlation produce a RICE-scored readiness backlog — blockers, recommended, nice-to-have — that integrates into sprint planning. Findings are source-tagged (static analysis vs contextual model) and confidence-rated. Two operating modes: crisis (one-shot assessment for teams already in production with debt — the most common entry point) and anticipation (continuous from first commit — teams shift to this once stabilized). First findings surface in under two minutes — fast enough to run before a sprint planning meeting.

Target users: Sana (engineering lead, primary — pulls readiness items into sprints), Ravi (SRE/platform engineer — deploys org-wide, tracks portfolio risk trends), Priya (compliance officer — validates regulatory findings from v2).

Validated by domain research ($4.5B SRE platform market, 14.2% CAGR, zero competitors in agent-guided discovery). MVP pilot: 5 teams, same cohort for user interviews and product testing.

### What Makes This Special

**Generated contextual model.** No pre-built models. Gyre generates for any detected architecture, producing the "aha!" findings — gaps teams didn't know to check. The `.gyre/capabilities.yaml` manifest persists as a team-owned artifact that improves with each amendment.

**Accurate by design.** Adapts to your stack, prevents category errors with an architecture intent guard question ("container-based or serverless?"), learns from your corrections via review-and-amend, and tags every finding with confidence level and source. Gyre never sends source code to an AI provider — static analysis runs locally, and only structured metadata reaches the LLM. Gyre asks what it missed — after each analysis, a feedback prompt captures gaps Gyre didn't catch, the only way to improve absence detection over time.

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

Features are classified into three tiers based on their role in validating the product hypothesis. For full phased roadmap, resource requirements, and risk mitigation, see **Project Scoping & Phased Development**.

**M — Measurement Infrastructure** (5 features, ship first — required to measure whether H features work)

| # | Feature | Purpose |
|---|---------|---------|
| M1 | Architecture intent guard question | Prevents category errors contaminating all downstream metrics |
| M2 | Source tagging (static vs contextual) | Required to measure novel findings ratio |
| M3 | Confidence tagging | Required to measure model accuracy |
| M4 | Review-and-amend workflow | Provides ground truth for accuracy measurement — team amendments define what "correct" means |
| M5 | Findings-history persistence | Infrastructure for delta analysis (H7) and accuracy improvement tracking |

**H — Hypothesis-Testing** (7 features, build after M — directly tests "can Gyre discover unknown unknowns?")

| # | Feature | Hypothesis Tested | Build Order |
|---|---------|-------------------|-------------|
| H1 | Stack detection & analysis | Can Gyre accurately detect what a team has? | First |
| H2 | Contextual model generation (`.gyre/capabilities.yaml`) | Can Gyre generate what a team *should* have? | Second |
| H3 | Observability Readiness agent | Can Gyre discover observability gaps? | Third |
| H4 | Deployment Readiness agent | Can Gyre discover deployment gaps? | Fourth |
| H5 | Cross-domain correlator | Do compound findings deliver "aha!" moments? | Fifth |
| H6 | False negative feedback prompt (`.gyre/feedback.yaml`) | Can Gyre learn what it missed? | Sixth |
| H7 | Delta analysis (anticipation mode) | Does Gyre have ongoing value, not just one-shot? | Last (depends on M5) |

**Q — Product Quality** (3 features, can ship v1.1 — improves experience but doesn't test hypothesis)

| # | Feature | Cut Impact |
|---|---------|-----------|
| Q1 | RICE scoring & severity classification | Findings unordered — usable but less actionable |
| Q2 | Severity-first leadership summary | Users must read full output |
| Q3 | Crisis/anticipation mode labels | Cosmetic — mode indicator string only |

**Build sequence:** M → H (H1-H6 in order, H7 last) → Q. Cut order if constrained: Q3 → Q1 → Q2.

## User Journeys

Journeys 1, 4, and 5 demonstrate Gyre's core discovery value — finding what teams didn't know was missing. Journeys 2 and 3 demonstrate the operational workflows that sustain and scale that value.

### Journey 1: Sana — Crisis Mode (First Run)

**Opening Scene.** Third production incident in a month. Sana's team shipped their payment processing service three months ago, and tonight Datadog is screaming again — a 500-error spike on the checkout endpoint. She fixes the immediate issue with a hotfix, but this time the accumulated frustration tips over. Three incidents. Three nights of guessing which deploy caused what. She actively searches for something — anything — that can show her what she can't see.

**Rising Action.** Sana finds Gyre through a colleague's Slack mention from weeks ago that she'd bookmarked. She runs `gyre analyze .` in her repo. Gyre asks one question: *"Container-based or serverless?"* — she answers, and the analysis begins. Within 90 seconds, findings start streaming:

```
Mode: crisis (one-shot analysis)

Finding 1 [BLOCKER] No health check liveness probes detected
  Source: static analysis | Confidence: high

Finding 2 [RECOMMENDED] No deployment event markers in observability stack
  Source: contextual model | Confidence: medium
  → Cross-domain: Without deployment markers, rollback decisions are blind (see Deployment #4)

Finding 3 [RECOMMENDED] No structured error context on retry paths
  Source: contextual model | Confidence: medium
```

Finding 2 stops her cold. That's exactly what happened last night — she couldn't correlate the error spike with the deploy because there were no markers. Gyre didn't just find the gap, it connected it across domains.

**Climax.** Gyre generates `.gyre/capabilities.yaml` — a manifest of 34 capabilities her stack *should* have. She opens it, scans the list, and realizes she can *see* her stack's readiness for the first time. She amends two items (removes a Kafka capability — they use SQS), confirms the rest, and saves. The final summary reads: *"0 blockers after amendment, 7 recommended, 19 nice-to-have."* She sorts by RICE score — the liveness probe blocker is obvious, but Gyre ranked the deployment markers above the retry path logging. She checks the rationale: higher reach (affects all deploys) and higher impact (blocks rollback decisions). She agrees, and pulls the blocker and top 3 recommended items into Jira for next sprint.

**Sharing.** Before sprint planning, Sana pastes the severity-first summary into her team's Slack channel: "Ran a new tool on our repo. Found 7 things we should fix, including the deployment marker gap that bit us last Tuesday. I've pulled the top 4 into the sprint." Two teammates click through to the findings.

**Resolution.** The feedback prompt asks: *"Did Gyre miss anything you know about?"* She types: "We have a manual runbook for database failover that isn't codified anywhere — Gyre didn't catch that." This goes into `.gyre/feedback.yaml`. Two weeks later, Sana re-runs Gyre. The amended model is respected, the fixed gaps are gone, and one new finding appears from a dependency update. Gyre is now part of her sprint planning prep.

**Capabilities revealed:** stack detection, model generation, cross-domain correlation, CLI output streaming, review-and-amend, feedback prompt, re-run with amendment persistence, RICE scoring, severity-first summary, shareable output format.

---

### Journey 2: Sana — Re-run After Amendments (Anticipation Mode)

**Opening Scene.** Three sprints after her first run. Sana's team has closed 8 of the original 10 recommended findings. A new team member added a Redis cache layer last week. Sana runs `gyre analyze .` before sprint planning.

```
Mode: anticipation (continuous — comparing against previous run)
```

**Rising Action.** Gyre detects the amended `.gyre/capabilities.yaml`, respects all prior amendments, and runs a delta analysis. It finds 2 new findings related to the Redis addition — no cache eviction monitoring and no connection pool health checks — both sourced from the contextual model. The 8 resolved findings are gone. The 2 remaining original findings persist with a note: *"Still open from previous run."*

**Climax.** The leadership summary reads: *"0 blockers, 2 new recommended (Redis cache), 2 carried forward, 11 nice-to-have."* Sana pulls the 2 Redis findings into the sprint, assigns them to the engineer who added the cache. The carried-forward items go to the backlog with a "tech debt" label.

**Incident Prevention Coda.** Six weeks later, Sana's team deploys a breaking change to the checkout endpoint. But the rollback is clean — Gyre had flagged missing rollback telemetry in run 1, and they'd fixed it in sprint 2. The incident happened, but recovery took 4 minutes instead of 4 hours. Sana notes in retro: "We fixed that because Gyre found it."

**Resolution.** Sana realizes Gyre is now tracking her stack's evolution. Each re-run is faster — the model is mostly confirmed, only new capabilities need review. She mentions this in standup: "Gyre caught the Redis gaps before we had an incident." Her colleague asks for the install link.

**Capabilities revealed:** amendment persistence, delta analysis, carried-forward tracking, re-run speed, anticipation mode, organic referral trigger, incident prevention evidence.

---

### Journey 3: Ravi — Portfolio Assessment (Delegation)

**Opening Scene.** Ravi is a platform engineer at a mid-size company. He supports 12 teams, each running their own services. Leadership just asked him: *"How production-ready are we across the board?"* He has no answer. He's been doing ad-hoc assessments — hopping into each team's repo, checking dashboards, asking questions. It takes a full day per team and the results are inconsistent.

**Rising Action.** Ravi installs Gyre and sends each team's lead the install link with a note: "Run `gyre analyze . --format json` and send me the output." Five teams respond within the week. Each produces its own `.gyre/capabilities.yaml` and JSON findings report across diverse stacks:

```
payments-api (Go):        1 blocker, 4 recommended, 12 nice-to-have
auth-service (Node):      0 blockers, 7 recommended, 9 nice-to-have
user-dashboard (Python):  3 blockers, 2 recommended, 15 nice-to-have
notifications (Python):   0 blockers, 1 recommended, 8 nice-to-have
search-indexer (Java):    2 blockers, 5 recommended, 11 nice-to-have
```

**Climax.** For the first time, Ravi can see readiness *comparatively* — and he can answer leadership's question the same day instead of "give me two weeks." User-dashboard and search-indexer have blockers — those teams get his attention this quarter. He sends each team their findings report with a note: "Amend the model if anything's off — I'll check back in 2 weeks." He replaces his ad-hoc assessment spreadsheet with Gyre summaries.

**Resolution.** At the quarterly architecture review, Ravi presents readiness trends: "We went from 6 blockers to 1 across the portfolio." Leadership gets a clear, evidence-based picture without Ravi having to manually audit each team. His next ad-hoc assessment request gets redirected: "Run Gyre first, then let's talk about what's left."

**Capabilities revealed:** multi-repo usage, `--format json --unstable` output, comparative summary, portfolio-level visibility, delegation workflow (Ravi → team leads), stack diversity (Go, Node, Python, Java), trend tracking over time.

---

### Journey 4: Sana — Trust Failure and Recovery

**Opening Scene.** Sana runs `gyre analyze .` on her Go microservice that uses gRPC, not REST. Gyre's guard question correctly identifies "container-based," but the contextual model generates capabilities assuming HTTP health endpoints. Three findings reference HTTP-based monitoring that doesn't apply to gRPC.

**Rising Action.** Sana sees the irrelevant findings. Her confidence drops. She considers closing the terminal. But the findings are tagged prominently:

```
Finding 7 [RECOMMENDED] No HTTP health endpoint on /healthz
  Source: contextual model
  [CONFIDENCE: medium]
```

The confidence tag — displayed on its own line, impossible to miss — signals this isn't a definitive claim. It's a model suggestion. She opens `.gyre/capabilities.yaml` and sees the HTTP assumptions listed as capabilities.

**Climax.** She amends the manifest: removes the 3 HTTP-specific capabilities, adds "gRPC health checking service" and "gRPC reflection for service discovery." She re-runs. The irrelevant findings disappear. Two new findings appear that are specific to her amended model — no gRPC deadline propagation monitoring and no connection drain on shutdown. These are real. The model learned from her correction.

**Resolution.** The feedback prompt asks what Gyre missed. She notes: "gRPC stacks need different health check patterns than HTTP — the default model assumed REST." This feedback improves future gRPC detection. Sana's trust recovers — not because Gyre was perfect, but because she could see *why* it was wrong, fix it, and get better results. The review-and-amend workflow did exactly what it promised.

**Guard Failure Variant.** In a related scenario, a junior dev on Sana's team answers the guard question incorrectly (says "serverless" for their containerized stack). Gyre's findings are off-target. The dev re-runs with the correct answer after a colleague corrects them. The guard question's simplicity — one question, not ten — makes recovery fast. *(Implies functional requirement: guard correction should not require full re-analysis.)*

**Capabilities revealed:** confidence tagging as trust signal, review-and-amend as recovery mechanism, model learning from corrections, feedback prompt for ecosystem improvement, graceful degradation for edge-case stacks, guard re-answerability.

---

### Journey 5: Reluctant Dev — Delegated Onboarding

**Opening Scene.** Dev on the notifications team. Ravi sent the install link two days ago. The dev hasn't installed it — another tool, another dashboard, another thing to maintain. Ravi pings again: "Just run it once, send me the JSON." The dev installs it to get Ravi off their back.

**Rising Action.** They run `gyre analyze .` expecting noise — the kind of 200-warning dump that linters produce. Gyre asks one question: *"Container-based or serverless?"* They answer. Findings stream in 80 seconds:

```
Mode: crisis (one-shot analysis)

Finding 1 [RECOMMENDED] No graceful shutdown handler for SIGTERM
  Source: contextual model | Confidence: high
  → Cross-domain: Without graceful shutdown, in-flight messages are lost during deploys (see Observability #3)

Finding 2 [RECOMMENDED] No dead letter queue monitoring
  Source: contextual model
  [CONFIDENCE: medium]
```

Finding 1 catches them off guard. They've been debugging mysterious message loss for two weeks. Every deploy drops a handful of messages and they couldn't figure out why. Gyre connected it to the missing SIGTERM handler — during rolling deploys, the container gets killed mid-processing.

**Climax.** The dev opens `.gyre/capabilities.yaml`. It's shorter than expected — 22 capabilities for their relatively simple Python service. They remove 2 irrelevant items (no Kafka, no gRPC), confirm the rest, and run `gyre analyze . --format json` to send to Ravi.

**Resolution.** The feedback prompt appears. They type: "Actually... can it check our message retry logic too?" Then they send Ravi a Slack message: "That SIGTERM thing — Gyre caught it. We've been chasing that for two weeks." Ravi adds it to his portfolio summary. Value flows back up the delegation chain. The dev doesn't become a Gyre champion, but they don't resist the next time Ravi asks them to run it.

**Capabilities revealed:** minimal onboarding friction (one question), non-champion time-to-value (<2 min), skeptic-to-curious conversion, JSON output from producer side, low-effort amendment, delegation loop completion (value flows Ravi → dev → Ravi).

---

### Journey Coverage Summary

| Capability Area | J1 | J2 | J3 | J4 | J5 |
|----------------|----|----|----|----|-----|
| Stack detection & analysis | ✅ | | ✅ | ✅ | ✅ |
| Contextual model generation | ✅ | ✅ | ✅ | ✅ | ✅ |
| Architecture intent guard | ✅ | | | ✅ | ✅ |
| Cross-domain correlation | ✅ | ✅ | | | ✅ |
| Review-and-amend workflow | ✅ | ✅ | | ✅ | ✅ |
| Feedback prompt | ✅ | | | ✅ | ✅ |
| Amendment persistence | | ✅ | | ✅ | |
| Delta analysis | | ✅ | | | |
| CLI output streaming | ✅ | ✅ | ✅ | | ✅ |
| Severity-first summary | ✅ | ✅ | ✅ | | |
| RICE scoring | ✅ | ✅ | ✅ | | |
| Confidence tagging | ✅ | | | ✅ | ✅ |
| Source tagging | ✅ | | | ✅ | ✅ |
| `--format json --unstable` | | | ✅ | | ✅ |
| Shareable output format | ✅ | | | | |
| Findings-history persistence | | ✅ | | | |
| Model subtraction logic | | | | ✅ | |
| Crisis mode | ✅ | | | ✅ | ✅ |
| Anticipation mode | | ✅ | | | |

All MVP features (M + H + Q) appear in at least one journey. Journey 4 validates the accuracy ecosystem end-to-end. Journey 5 validates the delegation workflow's weakest link.

### Journey-to-Hypothesis Mapping

Each journey implicitly tests a behavioral hypothesis for pilot validation:

| Journey | Behavioral Hypothesis | Pilot-Testable? |
|---------|----------------------|-----------------|
| J1 | Accumulated frustration triggers search; first cross-domain finding creates trust | Yes — observe first-run behavior |
| J2 | Amendment persistence + delta analysis creates re-run habit | Needs 4+ weeks observation |
| J3 | Delegation + JSON output enables portfolio visibility | Needs platform engineer in pilot |
| J4 | Confidence tags + review-and-amend recovers trust after model errors | Yes — observe error recovery |
| J5 | Non-champions find value despite zero buy-in when findings hit real pain | Yes — observe delegated runs |

**Pilot recruitment note:** The "aha!" metric (≥4/5 pilot teams) requires 5+ distinct teams. Recruit a mix of Sana-types (team leads running directly) and Journey-5-types (delegated devs) to test both adoption paths.

## Domain Requirements & Constraints

### Accuracy Taxonomy

Three types of accuracy with a causal chain — model accuracy → finding accuracy → absence accuracy:

| Accuracy Type | What It Measures | Tested By | When | Failure Mode |
|--------------|-----------------|-----------|------|-------------|
| Model accuracy | Are generated capabilities relevant to this stack? | Synthetic ground truth rubric (pre-pilot) + review-and-amend data (pilot) | **Pre-pilot gate** | Knowledge quality issue — agent knowledge or web search gaps |
| Finding accuracy | Do findings point to real gaps (not false positives)? | Team confirmation during pilot | Pilot metric | Engineering quality issue — static analysis bug, not model bug |
| Absence accuracy | Were real gaps caught (not false negatives)? | `.gyre/feedback.yaml` data during pilot | Pilot metric | Detection coverage issue — requires feedback.yaml as measurement infrastructure |

Model accuracy and finding accuracy represent different failure modes requiring different teams to fix. Model accuracy is a knowledge quality issue. Finding accuracy is an engineering quality issue. Separating them prevents misdiagnosis.

### Constraint 1: Trust & Accuracy — Pre-Pilot Quality Gate

**Gate:** Pre-pilot model accuracy ≥70% across ≥3 stack archetypes, measured via synthetic ground truth rubric.

**Synthetic ground truth methodology:**
- One repo per distinct stack archetype:
  - CNCF Go/Kubernetes project (e.g., Prometheus)
  - Node.js web service with observability (e.g., Ghost or Strapi)
  - Python data pipeline (e.g., Airflow or Dagster)
- Per generated capability, classify as: *relevant* (1.0), *partially relevant* (0.5), or *irrelevant* (0.0)
- Score = sum of relevance / total capabilities generated
- Methodology is documented and repeatable for regression testing

**Finding and absence accuracy are explicitly excluded from the pre-pilot gate** — they require real teams to validate and are pilot-phase measurements only.

Model richness is subordinate to accuracy: contextual model must generate ≥20 capabilities per stack. If fewer than 20 are generated, surface a limited-coverage warning: *"Limited coverage for this stack — your amendments are especially important."* Regardless of count, the accuracy gate is the release condition — a 15-capability model with 80% accuracy ships; a 30-capability model with 50% accuracy does not.

### Constraint 2: Stack Diversity & Detection

Contextual model must generate successfully for ≥3 distinct stack archetypes before pilot launch. Model richness varies by community knowledge density — a Node.js/Kubernetes model will be richer than a Rust/bare-metal model. This variance is expected and acceptable, provided:
- The limited-coverage warning surfaces for thin models
- Review-and-amend adoption compensates for lower starting accuracy
- Stack detection correctly identifies the primary technology stack

### Constraint 3: Integration & Workflow — `.gyre/` Lifecycle

| Artifact | VCS Treatment | Rationale |
|----------|--------------|-----------|
| `.gyre/capabilities.yaml` | **Commit** | Team-owned knowledge artifact; amendments must persist across clones |
| `.gyre/feedback.yaml` | **Commit** | Measurement infrastructure — the only mechanism for measuring absence accuracy. Without it, false negative detection is impossible. CLI explains after feedback prompt: *"Your feedback has been saved to .gyre/feedback.yaml — commit this file to share improvements with your team."* |
| `.gyre/cache/` | **Gitignore** | Analysis cache; ephemeral, machine-specific |

**Monorepo handling:** One `.gyre/` directory per service root, not per repo root. Each service has its own contextual model and findings.

### Constraint 4: Knowledge Currency (Risk — Deferred Mitigation)

Agent knowledge and web search provide baseline currency for current best practices. However, web search may return outdated or conflicting advice. Source tagging provides transparency — users can see "Source: web search" — but there is no freshness indicator in MVP.

**Mitigation:** Web search provides baseline currency. Source tagging provides transparency. Team amendments close gaps for specific stacks.

**Deferred to v2:** Freshness indicator on web-search-sourced capabilities (e.g., "Last verified: 2026-Q1").

## Innovation Architecture & Differentiation

*This section defines the innovation dependency chain and requirements that protect competitive positioning. Cutting features listed here as "differentiation-critical" destroys the product's market position. For innovation-specific risks and fallbacks, see the Risk Mitigation table below. For project-level risks (market, resource), see Project Scoping & Phased Development.*

### Innovation Dependency Chain

Gyre's four innovations form a **strictly linear dependency chain**:

```
Generated Contextual Model (foundation)
    → Absence Detection (depends on model)
        → Cross-Domain Compound Findings (depends on absence detection)

Accuracy Ecosystem (sustainability layer — improves all above, not required for first-run)
```

**Consequence:** Model quality is the single point of failure for all three innovation layers. Investment in model quality has **3x the downstream impact** of investment in any other layer. A bad model doesn't produce "fewer good findings" — it produces misleading findings that compound across domains.

### Innovation 1: Generated Contextual Model (Primary — Foundation)

Instead of shipping pre-built readiness checklists, Gyre *generates* a capabilities manifest at runtime for any detected stack. This is a paradigm shift from "measure against our criteria" to "discover what your criteria should be."

The model generation combines three knowledge sources:
- **Agent knowledge** of industry standards (DORA, OpenTelemetry, Google PRR)
- **Web search** for current best practices
- **Architecture intent guard question** to confirm stack classification

The `.gyre/capabilities.yaml` file is a new artifact type — not a config file, not a report, but a generated-then-owned knowledge artifact. Each capability includes a human-readable description, not just machine keys.

**Risk:** Model quality depends entirely on agent knowledge breadth and web search quality. If the generated model is too generic ("have monitoring, have logging"), the innovation collapses into the checklist it replaces.

### Innovation 2: Absence Detection (Category Innovation)

Existing tools detect *misconfiguration* — your health check is wrong. Gyre detects *absence* — you don't have a health check at all. This is a different category of analysis requiring the contextual model to define the expected state first.

Absence is harder to detect than presence. You can grep for a misconfigured value; you can't grep for something that doesn't exist. The contextual model makes absence detection possible by defining what *should* exist, then comparing against what *does* exist.

**Risk:** False absences (saying something is missing when it exists but is implemented differently than expected) erode trust faster than false presences. Review-and-amend is the mitigation.

### Innovation 3: Cross-Domain Compound Findings (Interaction Innovation)

Findings across domains that no single-domain tool can see: *"No rollback telemetry + no deployment markers = blind rollbacks."* The correlation engine operates on *absences*, not on data — finding patterns in what doesn't exist.

**Risk:** Compound findings require both component findings to be accurate. One false positive in either domain produces a misleading compound finding. Compound findings may need their own confidence score derived from both components.

### Innovation 4: Accuracy Ecosystem (Sustainability Innovation)

Not a single feature but an interconnected system: stack detection → guard question → model generation → confidence tagging → source tagging → review-and-amend → feedback prompt → model improvement.

**Classification:** This is a **sustainability innovation** — not needed for first-run value, but essential for re-run value and trust recovery. Without it, Innovations 1-3 work once and degrade. With it, each run improves the next.

Most tools treat accuracy as a quality metric. Gyre treats accuracy as a product feature — the review-and-amend workflow is part of the user experience, not a bug report mechanism. Users improve the product by using it normally.

**Risk:** System innovations are hard to explain and debug. If accuracy is low, which component failed? Need clear instrumentation at each stage.

### Differentiation-Critical Requirements

These requirements prevent Gyre from being perceived as "just a fancy linter." They are formatting and visibility features, but cutting them destroys competitive positioning:

| # | Requirement | Why It Matters |
|---|------------|----------------|
| DC1 | CLI shows model summary *before* findings: "Generated 34 capabilities for your Node.js/Kubernetes stack. Review: `.gyre/capabilities.yaml`" | The model is the product; findings are consequences. If users only see findings, Gyre looks like a linter. |
| DC2 | Compound findings have distinct visual treatment (indented reasoning chain, not inline arrow) | Compound findings are *reasoning*, not rule matches. Visual distinction signals "this required cross-domain analysis." |
| DC3 | Novelty ratio shown to user: "X of Y findings are contextual — gaps a static linter would miss" | Users see the differentiation in real-time. Without this, the distinction is invisible. |
| DC4 | capabilities.yaml includes human-readable descriptions per capability | Amendment must feel like editing a knowledge document, not configuring a tool. |
| DC5 | Static analysis runs locally; source code never sent to LLM provider | Enterprise trust signal; competitive differentiator vs AI tools that require code access. |

### Market Context & Competitive Landscape

| Dimension | Cortex/Backstage | Gyre |
|-----------|-----------------|------|
| Model source | Pre-defined by platform team | Generated per stack |
| Detection type | Compliance (what's wrong) | Discovery (what's missing) |
| Assessment method | Scorecard/checklist | Agent-guided analysis |
| Cross-domain | Per-domain only | Compound findings |
| Accuracy method | Binary (pass/fail) | Ecosystem (confidence, source, amendment) |
| Artifact output | Score/dashboard | Owned manifest + backlog |

Market gap confirmed: no existing product combines generated models + absence detection + cross-domain correlation.

### Validation Approach

| Innovation | How to Validate | Accuracy Type | When |
|-----------|----------------|---------------|------|
| Generated model quality | Synthetic ground truth rubric, ≥70% model accuracy across 3 archetypes | Model accuracy | Pre-pilot |
| Absence detection value | Novel findings ≥30% + feedback.yaml captures ≥1 missed gap per team | Absence accuracy | Pilot |
| Cross-domain compound findings | ≥1 compound finding per run + "aha!" ≥4/5 teams | Finding accuracy (compound) | Pilot |
| Accuracy ecosystem | Post-amendment model accuracy ≥85% + review-and-amend adoption ≥60% | Model accuracy (post-amendment) | Pilot |

### Risk Mitigation

| Risk | Severity | Mitigation | Fallback |
|------|----------|-----------|----------|
| Generated model too generic | High | Guard question + stack-specific knowledge; model richness minimum ≥20 capabilities | Ship curated models for top 3 stacks, generate for others |
| False absences erode trust | High | Confidence tagging + review-and-amend + source tagging | Reduce model scope to high-confidence capabilities only |
| Compound findings inaccurate | Medium | Derive compound confidence from component confidences | Ship compound findings as "experimental" with flag |
| Accuracy ecosystem too complex to debug | Medium | Instrumentation at each stage; split first-run vs post-amendment accuracy | Simplify to model accuracy + finding accuracy only |
| Review-and-amend adoption <30% | High | CLI prompts amendment; show accuracy improvement from amendments | Make amendment optional; rely on feedback prompt instead |
| Linter perception | High | DC1-DC4 differentiation-critical requirements; model before findings; novelty ratio visible | Reposition as "readiness architect" not "readiness scanner" |

## AI Discovery Agent / CLI Tool Requirements

### Project-Type Overview

Gyre is an **npm-distributed CLI tool** that ships AI discovery agents. The primary interaction is `gyre analyze .` — a single command that runs the full analysis pipeline. The CLI must support both human-readable output (default) and machine-readable output (`--format json --unstable`) for platform engineers scripting across repos.

### Command Structure

| Command | Purpose | MVP? |
|---------|---------|------|
| `gyre analyze .` | Run full analysis pipeline (stack detection → model generation → agent analysis → findings) | Yes |
| `gyre analyze . --format json` | Machine-readable output for scripting (unstable in v1) | Yes |
| `gyre analyze . --guard containerized` | Non-interactive guard override for CI/CD or correction | Yes |
| `gyre reanalyze --reclassify` | Re-run model generation with new guard answer without re-running static analysis | Consider |
| `gyre init` | Generate `.gyre/capabilities.yaml` without running analysis (model-only mode) | Consider |
| `gyre diff` | Show delta from previous run (anticipation mode explicit trigger) | Consider |

### Output Formats

**Human-readable output sequence (default):**

1. Mode indicator: `Mode: crisis (one-shot analysis)` or `Mode: anticipation (comparing against previous run)`
2. Model summary: "Generated 34 capabilities for your Node.js/Kubernetes stack. Review: `.gyre/capabilities.yaml`"
3. Findings stream (as discovered, not batched — supports time-to-first-finding <2min)
4. Compound findings use indented reasoning chain:
   ```
   Finding 2 [RECOMMENDED] No deployment event markers in observability stack
     Source: contextual model | Confidence: medium
     ┌─ Cross-domain correlation:
     │  Deployment #4: No rollback trigger mechanism
     │  Combined impact: Rollback decisions are blind
     └─ Without deployment markers, you cannot correlate errors with deploys
   ```
5. Novelty ratio: "8 of 12 findings are contextual — gaps a static linter would miss"
6. Severity-first summary: "0 blockers, 3 recommended, 12 nice-to-have"
7. Amendment prompt: "Review your capabilities manifest? (y/n/later)" — `y` opens in `$EDITOR`, `later` reminds on next run
8. Feedback prompt: interactive readline, user types free-text, appended to `.gyre/feedback.yaml` with timestamp. Skipped in `--format json` mode.

**Anticipation mode output additions:**
- Delta summary: "2 new findings, 2 carried forward, 3 resolved since last run"
- New findings marked with `[NEW]`
- Carried-forward findings marked with `[CARRIED]`
- Resolved findings listed briefly: "3 findings from previous run no longer apply"

**JSON output (`--format json --unstable`):** Structured findings, model data, metadata for scripting. Unstable flag signals schema may change before v1.1 stabilization.

### Installation & Distribution

| Aspect | Decision |
|--------|----------|
| Package manager | npm (consistent with Convoke ecosystem) |
| Install command | `npm install -g gyre` or `npx gyre analyze .` |
| Runtime dependency | Node.js ≥18 |
| AI provider | Deferred to architecture doc — must satisfy one-step onboarding constraint |
| Config location | `.gyre/config.yaml` or environment variables for API keys |

**Onboarding constraint:** First-run setup must not require more than one configuration step. Whether that's one env var (`export GYRE_API_KEY=...`) or a `gyre setup` wizard, the constraint is clear without prescribing the mechanism. API provider strategy (cloud API, local model, hybrid) is an architecture decision that must satisfy this constraint.

### Config Schema

```yaml
# .gyre/config.yaml
provider:
  type: anthropic | openai | local
  api_key: ${GYRE_API_KEY}  # or env var
  model: auto  # selects best available; pin specific version for reproducibility

analysis:
  domains: [observability, deployment]  # MVP: only these two
  mode: auto  # auto-detect crisis vs anticipation based on .gyre/ existence

output:
  format: human | json
  verbosity: normal | verbose | quiet
```

### Stack Detection

Gyre is **language-agnostic by design** — it analyzes infrastructure patterns, not code syntax:

| Detection Target | Method |
|-----------------|--------|
| Container orchestration (K8s, ECS, Docker Compose) | File presence: Dockerfile, k8s manifests, docker-compose.yaml |
| CI/CD platform (GitHub Actions, GitLab CI, Jenkins) | File presence: .github/workflows/, .gitlab-ci.yml, Jenkinsfile |
| Observability stack (Datadog, Prometheus, OTel) | Config files, dependency manifests |
| Primary language/framework | package.json, go.mod, requirements.txt, Cargo.toml |
| Cloud provider (AWS, GCP, Azure) | Config files, IaC templates (Terraform, CDK) |

### Scripting Support

For platform engineers (Ravi persona):

```bash
# Analyze multiple repos, collect JSON, compare
for repo in payments auth notifications; do
  cd ~/repos/$repo && gyre analyze . --format json > /tmp/gyre-$repo.json
done
jq '.summary' /tmp/gyre-*.json
```

**Exit codes:**

| Code | Meaning |
|------|---------|
| 0 | Analysis complete, no blockers |
| 1 | Analysis complete, blockers found |
| 2 | Stack detection failure |
| 3 | API/provider failure |
| 4 | Analysis error |

### Implementation Considerations

- **Streaming output:** Findings stream as discovered, not batch after full analysis
- **Offline mode:** Fail fast with clear error if API unreachable — don't fall back to degraded analysis
- **`.gyre/` auto-creation:** Auto-create on first run. Existing `.gyre/capabilities.yaml` triggers anticipation mode
- **Model subtraction:** When user removes capabilities during amendment, those capabilities and their findings are excluded on re-run
- **Findings-history persistence:** Track findings across runs for delta analysis and carried-forward display
- **Discovery interview addition:** Add API key tolerance question to experiment card: "Would you configure an API key for a CLI readiness tool, or would that be a dealbreaker?"

## Project Scoping & Phased Development

### MVP Strategy & Philosophy

**MVP Approach: Learning MVP** — The primary goal is validated learning, not revenue or experience polish. The M/H/Q classification embeds this: M features measure, H features test hypotheses, Q features improve experience. The pilot (5 teams) is the validation event.

Core question the MVP must answer: *"Can Gyre discover unknown unknowns accurately enough that teams act on the findings?"*

### MVP Feature Set (Phase 1)

**Updated M/H/Q Classification:**

**M — Measurement Infrastructure (5 features, ship first):**

| # | Feature | Purpose |
|---|---------|---------|
| M1 | Architecture intent guard question | Prevents category errors contaminating all downstream metrics |
| M2 | Source tagging (static vs contextual) | Required to measure novel findings ratio |
| M3 | Confidence tagging | Required to measure model accuracy |
| M4 | Review-and-amend workflow | Provides ground truth for accuracy measurement |
| M5 | Findings-history persistence | Infrastructure for delta analysis (H7) and accuracy improvement tracking |

**H — Hypothesis-Testing (7 features, build after M):**

| # | Feature | Hypothesis Tested | Build Order |
|---|---------|-------------------|-------------|
| H1 | Stack detection & analysis | Can Gyre accurately detect what a team has? | First |
| H2 | Contextual model generation | Can Gyre generate what a team *should* have? | Second |
| H3 | Observability Readiness agent | Can Gyre discover observability gaps? | Third |
| H4 | Deployment Readiness agent | Can Gyre discover deployment gaps? | Fourth |
| H5 | Cross-domain correlator | Do compound findings deliver "aha!" moments? | Fifth |
| H6 | False negative feedback prompt | Can Gyre learn what it missed? | Sixth |
| H7 | Delta analysis (anticipation mode) | Does Gyre have ongoing value, not just one-shot? | Last (depends on M5) |

**Q — Product Quality (3 features, can ship v1.1):**

| # | Feature | Cut Impact |
|---|---------|-----------|
| Q1 | RICE scoring & severity classification | Findings unordered — usable but less actionable |
| Q2 | Severity-first leadership summary | Users must read full output |
| Q3 | Crisis/anticipation mode labels | Cosmetic — mode indicator string only |

**Build sequence:** M → H (H1-H6 in order, H7 last) → Q. Cut order if constrained: Q3 → Q1 → Q2.

**Core journeys supported by MVP:** J1 (Sana crisis), J4 (trust recovery), J5 (reluctant dev) validate core hypothesis. J2 (re-run) requires H7. J3 (Ravi portfolio) requires longer observation.

### Emergency Cut (Minimum Viable Scope)

**6 features: M2 + M4 + H1 + H2 + H3 + H6**

Drops: guard question (accept category error risk), confidence tagging (accept trust erosion), deployment agent (single-domain only), cross-domain correlator (no compound findings), findings-history persistence + delta analysis.

**Advisory:** This scope validates model quality only, not product differentiation. If H5 (compound findings) cannot ship on schedule:
1. Run micro-pilot (2 teams, single-domain only)
2. If single-domain findings produce ≥2/2 "aha!" reactions, ship without H5
3. If not, invest in H5 before full pilot — a delayed MVP with compound findings is better than an on-time MVP without its core differentiator

### Resource Requirements

| Role | Count | Focus | Risk Profile |
|------|-------|-------|-------------|
| CLI/infrastructure engineer | 1 | CLI framework, streaming, file system, YAML, persistence | Low uncertainty — predictable patterns |
| AI/prompt engineer | 1 | LLM integration, model generation quality, agent prompting, accuracy iteration | **High uncertainty — critical path** |
| SRE domain expert | 0.5 | Validate model quality, define capability taxonomies, synthetic ground truth scoring | Pre-pilot phase |

**Build strategy:** CLI/infrastructure first (provides test harness), then AI/prompt iteration inside working CLI. The AI/prompt engineer is the critical path — model accuracy targets may require many prompt iterations.

**Minimum team:** 2 engineers. A solo engineer could build the CLI but prompt engineering iteration for ≥70% accuracy across diverse stacks is research-heavy work that stretches the timeline significantly.

### Post-MVP Roadmap

**Phase 2 (Growth — v2):**
- Compliance & Security Readiness agent
- Capacity & FinOps Readiness agent
- Priya persona support
- JSON output schema stabilization (drop `--unstable`)
- CI/CD integration (`--guard` as non-interactive default)
- Team-shared model library
- Freshness indicator on web-search-sourced capabilities

**Phase 3 (Expansion — v3+):**
- Community model marketplace
- Historical trend analysis
- Predictive gap detection
- Multi-repo organizational portfolio view
- `gyre reanalyze --reclassify` for guard correction without full re-analysis

### Risk Mitigation Strategy

*For innovation-specific risks with fallback strategies, see Innovation Architecture & Differentiation. Below covers project-level technical, market, and resource risks.*

**Technical risks:**

| Risk | Severity | Mitigation |
|------|----------|-----------|
| Model generation quality too low | Critical | Synthetic ground truth pre-pilot; model richness minimum; guard question |
| LLM reasoning inconsistency | High | Temperature=0; cache generated model; deterministic static analysis |
| Static analysis misses existing capabilities | High | Source tagging; review-and-amend catches false absences |
| Cross-domain correlation misleading | Medium | Compound confidence from components; degrade to single-domain if low confidence |

**Market risks:**

| Risk | Mitigation |
|------|-----------|
| Teams don't care until after incident | Crisis mode as primary entry; Journey 1 validates |
| "We already have Cortex/Backstage" | Discovery vs compliance positioning; compound findings differentiate |
| API key kills adoption | Discovery interview tests tolerance; one-step onboarding constraint |

**Resource risks:**

| Risk | Mitigation |
|------|-----------|
| Solo engineer scope too large | Emergency cut to 6 features; sequential M → H build |
| SRE expertise unavailable | Open-source repos as synthetic ground truth |
| Pilot recruitment fails (5 → 3 teams) | Recalibrate thresholds: "aha!" ≥2/3, re-run ≥2/3, backlog ≥2/3. Statistical confidence drops — results directional, not conclusive |

## Functional Requirements

**This section defines the capability contract for the entire product.** UX designers design only what's listed here. Architects support only what's listed here. Epic breakdown implements only what's listed here. If a capability is missing, it will not exist in the final product.

### Capability Area 1: Stack Detection & Classification

- **FR1:** System can detect the primary technology stack of a project by analyzing file system artifacts (package manifests, config files, IaC templates)
- **FR2:** System can detect container orchestration platform (Kubernetes, ECS, Docker Compose) from project files
- **FR3:** System can detect CI/CD platform (GitHub Actions, GitLab CI, Jenkins) from project files
- **FR4:** System can detect observability tooling (Datadog, Prometheus, OpenTelemetry) from config and dependency files
- **FR5:** System can detect cloud provider (AWS, GCP, Azure) from IaC templates and config files
- **FR6:** System can present an architecture intent guard question to the user to confirm stack classification
- **FR7:** User can override the guard question answer via CLI flag (`--guard`) without interactive prompt
- **FR8:** System can re-classify the stack based on a corrected guard answer without re-running the full analysis pipeline

### Capability Area 2: Contextual Model Generation

- **FR9:** System can generate — not select from templates — a capabilities manifest (`.gyre/capabilities.yaml`) unique to the detected stack, using LLM reasoning and web search to determine what capabilities should exist
- **FR10:** System can incorporate industry standards (DORA, OpenTelemetry, Google PRR) into the generated model
- **FR11:** System can incorporate current best practices via web search into the generated model
- **FR12:** System can adjust the generated model based on the guard question classification
- **FR13:** Each generated capability includes a human-readable description explaining what it is and why it matters
- **FR14:** System can generate ≥20 capabilities for supported stack archetypes
- **FR15:** System can surface a limited-coverage warning when fewer than 20 capabilities are generated

### Capability Area 3: Absence Detection & Analysis

- **FR16:** Observability Readiness agent can analyze the project for observability gaps by comparing existing capabilities against the contextual model
- **FR17:** Deployment Readiness agent can analyze the project for deployment gaps by comparing existing capabilities against the contextual model
- **FR18:** System can identify capabilities listed in the contextual model for which no evidence of implementation was found in the project's files, dependencies, or configuration
- **FR19:** System can tag each finding with its source (static analysis vs contextual model)
- **FR20:** System can tag each finding with a confidence level (high/medium/low)
- **FR21:** System can classify each finding by severity (blocker/recommended/nice-to-have)
- **FR22a:** System can reason about relationships between findings across different domains to identify compound gaps
- **FR22b:** System can express compound finding relationships as a text-based reasoning chain in CLI output

### Capability Area 4: Review, Amendment & Feedback

- **FR24:** User can review the generated capabilities manifest in their preferred editor
- **FR25:** User can amend the capabilities manifest by adding, removing, or modifying capabilities
- **FR26:** System respects user amendments on subsequent runs (amendment persistence). *Scope: per-repo learning only in MVP. Cross-repo learning (amendments improving model for other users) deferred to v2.*
- **FR27:** When user removes capabilities, system excludes those capabilities and their associated findings on re-run (model subtraction)
- **FR28:** System prompts user for feedback after each analysis with the question "Did Gyre miss anything you know about?" — this is measurement infrastructure for absence accuracy, not a satisfaction survey
- **FR29:** User feedback is persisted to `.gyre/feedback.yaml` with timestamp
- **FR30:** System explains that feedback.yaml should be committed for team-wide model improvement

### Capability Area 5: Output & Presentation

- **FR31:** System can display a model summary before findings, showing capability count and detected stack
- **FR32:** System can display each finding to the CLI as soon as it is produced by the analysis pipeline, rather than waiting for all agents to complete before displaying any output
- **FR33:** System can display a severity-first leadership summary (blockers, recommended, nice-to-have counts)
- **FR34:** System can display the novelty ratio ("X of Y findings are contextual — gaps a static linter would miss")
- **FR35:** System can display compound findings with a visually distinct indented reasoning chain
- **FR36:** System can output analysis results in machine-readable JSON format
- **FR37:** System can display mode indicator (crisis or anticipation) at start of output
- **FR49:** User can copy and paste the severity-first summary and individual findings into external tools (Slack, Jira, docs) without formatting artifacts or escape codes
- **FR50:** System can provide a brief rationale for each finding's severity classification, explaining the reach and impact factors

### Capability Area 6: Run Lifecycle & Delta Analysis

- **FR38:** System can detect whether a previous analysis exists and auto-select crisis (first run) or anticipation (re-run) mode
- **FR39:** System can persist findings history across runs
- **FR40:** System can compute delta between current and previous run (new, carried-forward, resolved findings)
- **FR41:** System can display delta-tagged findings ([NEW], [CARRIED]) and resolved finding summary
- **FR42:** System can create `.gyre/` directory structure on first run
- **FR43:** System can prompt user to review capabilities manifest with options (y/n/later), with "later" reminding on next run
- **FR51:** System can detect service boundaries in monorepos and create `.gyre/` at the service root, or prompt the user to specify the service directory when run from a repo root containing multiple services
- **FR52:** When a limited-coverage warning is triggered, system presents the warning with the option to continue analysis (with higher emphasis on review-and-amend) or abort
- **FR53:** System can display existing entries from `.gyre/feedback.yaml` at the start of analysis, showing what gaps were previously reported by team members
- **FR55:** System can persist a "review deferred" flag in `.gyre/` and display a reminder to review the capabilities manifest at the start of the next analysis run

### Capability Area 7: Installation, Configuration & Resilience

- **FR44:** User can install Gyre via npm (`npm install -g gyre` or `npx gyre analyze .`)
- **FR45:** User can configure AI provider via environment variable or config file
- **FR46:** User can complete first-run setup by performing exactly one action: either setting a single environment variable (`GYRE_API_KEY`) or running an interactive setup command (`gyre setup`) that configures the provider in one session
- **FR47:** System can fail fast with clear error message when AI provider is unreachable
- **FR48:** System can select the best available model automatically (`provider.model: auto`)
- **FR54:** In JSON output mode, the output includes a `status` field indicating analysis result (clean, blockers_found, detection_failure, provider_failure, analysis_error) matching CLI exit code semantics
- **FR56:** If analysis fails after model generation completes, system saves the generated manifest and informs user that analysis can be retried without regenerating the model
- **FR57:** System treats analysis as complete-or-nothing — partial agent results are not displayed or persisted. On failure, user receives clear error with retry guidance.

### Traceability Matrix

| Feature | FRs | Journeys | Success Metric | Size | Test Method |
|---------|-----|----------|---------------|------|-------------|
| M1: Guard question | FR6, FR7, FR8 | J1, J4, J5 | Architecture intent accuracy ≥90% | M | Integration |
| M2: Source tagging | FR19 | J1, J4, J5 | Novel findings ≥30% | S | Unit |
| M3: Confidence tagging | FR20 | J4, J5 | Model accuracy measurement | S | Unit |
| M4: Review-and-amend | FR24, FR25, FR26, FR27 | J1, J2, J4, J5 | Adoption ≥60% | L | Integration + Pilot |
| M5: Findings history | FR39 | J2 | Re-run rate ≥3/5 | M | Integration |
| H1: Stack detection | FR1, FR2, FR3, FR4, FR5 | J1, J3, J4, J5 | Stack diversity ≥3 | L | Integration |
| H2: Model generation | FR9, FR10, FR11, FR12, FR13, FR14, FR15 | J1, J2, J3, J4, J5 | First-run accuracy ≥70% | L | Human + Synthetic |
| H3: Observability agent | FR16, FR18 | J1 | Cross-domain hit rate ≥1 | L | Human + Pilot |
| H4: Deployment agent | FR17, FR18 | J1 | Cross-domain hit rate ≥1 | L | Human + Pilot |
| H5: Cross-domain correlator | FR22a, FR22b | J1, J5 | "Aha!" ≥4/5 teams | L | Pilot |
| H6: Feedback prompt | FR28, FR29, FR30 | J1, J4, J5 | False neg detection ≥1/team | M | Integration + Pilot |
| H7: Delta analysis | FR38, FR40, FR41 | J2 | Re-run rate ≥3/5 | M | Integration |
| Q1: RICE scoring | FR21, FR50 | J1, J2, J3 | Severity agreement ≥4/5 | M | Pilot |
| Q2: Severity summary | FR33 | J1, J2, J3 | — | S | Unit |
| Q3: Mode labels | FR37, FR38 | J1, J2 | Mode selection distribution | S | Unit |
| DC1: Model before findings | FR31 | J1 | — | S | Unit |
| DC2: Compound visual | FR35 | J1, J5 | — | S | Unit |
| DC3: Novelty ratio | FR34 | J1 | — | S | Unit |
| DC4: Readable descriptions | FR13 | J1, J4 | — | M | Human |
| DC5: Privacy architecture | — | All | — | L | Integration + Audit |
| Cross-cutting: CLI | FR32, FR36, FR42, FR43, FR44, FR45, FR46, FR47, FR48, FR49, FR51, FR52, FR53, FR54, FR55, FR56, FR57 | All | Time-to-first-finding <2min | M-L | Integration |

**Size key:** S = hours, M = days, L = sprints. **Test key:** Unit = automated, Integration = end-to-end CLI test, Human = manual evaluation, Pilot = requires real users, Synthetic = synthetic ground truth repos, Audit = security review.

## Non-Functional Requirements

### Performance

| NFR | Target | Rationale |
|-----|--------|-----------|
| NFR1: Time-to-first-finding | <2 minutes from `gyre analyze .` to first finding displayed | Success metric; drives "wow, fast" perception that predicts re-run behavior |
| NFR2: Total analysis time | <10 minutes for a typical project (≤500 files, ≤2 domains) | Operational constraint; must complete within a coffee break |
| NFR3: Guard question response time | <1 second after user answers | Interactive prompt must feel instant |
| NFR4: Re-run with existing model | ≤50% of first-run time | Model generation skipped; anticipation mode should be noticeably faster |
| NFR5: CLI startup time | <3 seconds from command to first output (mode indicator) | Prevents "is it working?" anxiety; Node.js cold start must be managed |

### Security & Privacy

| NFR | Target | Rationale |
|-----|--------|-----------|
| NFR6: API key storage | API keys stored in environment variables or local config file with file permissions (600); never logged, never in `.gyre/` artifacts | Prevents credential leakage |
| NFR7: Privacy architecture | Static analysis runs entirely locally. Only structured findings (not file contents) and stack metadata are sent to the LLM provider. **Gyre never sends source code to an AI provider.** | Core trust signal for enterprise adoption; differentiator vs competitors |
| NFR8: LLM input boundary | LLM receives: (a) stack classification, (b) guard question answer, (c) list of detected capabilities with evidence type, (d) web search results. LLM does NOT receive: file contents, file paths, directory structures, or secrets | Reduces exposure surface; makes privacy promise concrete and auditable |
| NFR9: Artifact safety | Generated artifacts (capabilities.yaml, feedback.yaml) must not contain source code snippets, file contents, or secrets found during analysis | Artifacts are committed to VCS — must be safe to share |

**Pre-pilot privacy validation:** Measure model accuracy under metadata-only constraint vs metadata+code. If accuracy delta is <5%, privacy architecture is validated. If >15%, architecture must be reconsidered before shipping.

### Reliability

| NFR | Target | Rationale |
|-----|--------|-----------|
| NFR10: Deterministic model generation | Same project + same guard answer + same provider + same model version = same capabilities manifest (temperature=0) | Users expect consistency; model caching supports this |
| NFR11: Graceful API failure | If LLM provider unreachable, fail within 10 seconds with actionable error message | FR47 specifies fail-fast; this adds the timeout |
| NFR12: File system safety | Gyre never modifies, deletes, or writes outside the `.gyre/` directory | Users grant read access; Gyre must not touch source code |
| NFR13: Run exclusivity | If `.gyre/.lock` exists, abort with "Another analysis is running" message. Full concurrent safety deferred to v2/CI | Simple lock file for MVP; prevents `.gyre/` corruption |

### Integration

| NFR | Target | Rationale |
|-----|--------|-----------|
| NFR14: LLM provider compatibility | Supports ≥2 LLM providers (e.g., Anthropic + OpenAI) with provider abstraction | Prevents vendor lock-in |
| NFR15: Node.js version support | Node.js ≥18 (current LTS and above) | Consistent with Convoke ecosystem |
| NFR16: OS compatibility | macOS, Linux, and Windows (via WSL or native) | Developer tool must support all major platforms |
| NFR17: JSON schema stability | JSON output schema versioned; breaking changes require version bump and `--unstable` flag until stabilized | Ravi's scripting depends on predictable schema |

### Quality Gates

| NFR | Target | Rationale |
|-----|--------|-----------|
| NFR18: Pipeline phase independence | Analysis phases (stack detection, guard, model generation, agent analysis, cross-domain) are independently re-runnable where feasible | Enables FR8 (guard correction) and FR56 (retry after partial failure) |
| NFR19: Model accuracy release gate | First-run model accuracy ≥70% across ≥3 stack archetypes via synthetic ground truth rubric | Pre-pilot release condition; domain constraint formalized as NFR |
| NFR20: Guard question coverage | Guard options cover ≥95% of common architectures without requiring expert knowledge | Guard must not become an onboarding barrier |
| NFR21: Web search freshness | Web search results from current calendar year; no cross-run caching of web results | Prevents recommending deprecated practices |
| NFR22: Compound finding confidence | Compound findings suppressed when either component finding has confidence "low"; displayed with the lower component's confidence level when both are "medium" or higher | Prevents misleading cross-domain findings |
