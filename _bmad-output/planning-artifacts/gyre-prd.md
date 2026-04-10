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
  projectType: "Convoke Team Module — conversational agent delivery"
  domain: "Production Readiness Discovery"
  complexity: "high — product novelty & trust, not regulatory"
  projectContext: "brownfield infrastructure, greenfield product"
lastEdited: '2026-03-21'
editHistory:
  - date: '2026-03-21'
    changes: "Delivery mechanism pivot: Gyre redesigned as Convoke team module (like Vortex) — conversational persona agents inside Claude Code. Replaced all CLI references (Commander, exit codes, JSON output, streaming renderer, provider abstraction, npm install -g) with Convoke team patterns (agents, workflows, contracts, compass routing). Updated FRs, NFRs, journeys, success criteria, and scoping accordingly. Domain logic preserved."
  - date: '2026-03-21'
    changes: "Structural edit for LLM readability: cut How to Read, Project Classification (redundant with frontmatter), What Makes This Special (merged privacy into exec summary), Market Context, Monetization, Divergence note. Condensed journeys to structured format, Innovation Architecture to table, Resource Requirements, Post-MVP Roadmap. Moved Traceability Matrix to after Product Scope. Added status marker to Emergency Cut."
  - date: '2026-03-21'
    changes: "Post-validation edits: scope pivot acknowledgment, scoping section consolidation, J6 traceability, FR13/FR22a/FR47/FR48 measurability refinements"
  - date: '2026-03-21'
    changes: "Adversarial review fixes (14 items): removed unsourced 98% stat, qualified pilot as qualitative n=5, anchored novel findings metric to team confirmation, added privacy test timing after H2, acknowledged cross-domain 2-agent limitation, resolved FR32/FR57 streaming contradiction, expanded guard question to ≤3 detection-derived questions, softened NFR10 determinism to behavioral consistency + caching, added interactive walkthrough UX for review-and-amend, added capability-level source tagging and web search conflict resolution, specified monorepo detection heuristics with explicit signals, retained M1 in Emergency Cut, added exit code 5 for config errors, added intermediate phase performance targets for NFR1."
---

# Product Requirements Document - Gyre

**Author:** Amalik
**Date:** 2026-03-20

### Terminology

| Term | Meaning |
|------|---------|
| Contextual model | The concept: a generated description of what capabilities a stack should have |
| Capabilities manifest | The artifact: `.gyre/capabilities.yaml`, the file that embodies the contextual model |
| Model accuracy | How relevant the capabilities manifest is to the actual stack — not LLM model performance |
| Agent | In Gyre context: a domain-specific analysis workflow (Observability Readiness, Deployment Readiness). In Convoke context: a conversational persona (Scout, Atlas, Lens, Coach) |
| Finding | A specific gap identified by an agent — either an absence or a misconfiguration |
| Compound finding | A finding that spans two domains, revealing an interaction effect |

## Executive Summary

**Gyre tells you what's missing from your production stack that you didn't know to look for.**

Gyre is the second Convoke team module — a team of conversational persona agents (like Vortex) that discover what's *absent but should exist* in your production stack. Where Vortex covers product discovery and BMM handles implementation, Gyre closes the final gap: the transition from "built" to "runs reliably at scale." Gyre agents run inside Claude Code, using its built-in tools (Glob, Grep, Read) for filesystem analysis and conversational interaction for all user-facing flows.

The core problem is not a lack of expertise — SRE books, DORA research, and compliance frameworks exist. Teams cannot map existing knowledge to their specific product context, leaving critical gaps invisible until they cause incidents. Existing tools (Cortex, Backstage) measure *how ready* you are against predefined criteria. Gyre discovers *what ready means* for your specific stack — the criteria themselves. No current product offers agent-guided discovery of context-specific readiness.

Gyre's primary innovation is the **generated contextual model**: the agent detects the team's stack, generates a capabilities manifest (`.gyre/capabilities.yaml`) of what *should* exist — using agent knowledge of industry standards (DORA, OpenTelemetry, Google PRR), web search for current best practices, and a guard question to confirm architecture intent — then compares it against what *does* exist. Absence detection — finding what's missing, not just what's misconfigured — is the core value. The model is team-owned: reviewed, amended, version-controlled, and respected on re-run. Gyre detects any stack; model richness varies by community knowledge density (a Node.js/Kubernetes model will be richer than a Rust/bare-metal model out of the box — team amendments close the gap).

Two MVP domain workflows (Observability Readiness + Deployment Readiness) with cross-domain correlation produce a RICE-scored readiness backlog — blockers, recommended, nice-to-have — that integrates into sprint planning. Findings are source-tagged (static analysis vs contextual model) and confidence-rated. Two operating modes: crisis (one-shot assessment for teams already in production with debt — the most common entry point) and anticipation (continuous from first commit — teams shift to this once stabilized). First findings surface in under two minutes — fast enough to run before a sprint planning meeting.

Target users: Sana (engineering lead, primary — pulls readiness items into sprints), Ravi (SRE/platform engineer — deploys org-wide, tracks portfolio risk trends), Priya (compliance officer — validates regulatory findings from v2).

Validated by domain research ($4.5B SRE platform market, 14.2% CAGR, zero competitors in agent-guided discovery). MVP pilot: 5 teams, same cohort for user interviews and product testing. Gyre never sends source code to an AI provider — static analysis runs locally, and only structured metadata reaches the LLM.

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
| Time-to-first-finding | <2 minutes from analysis start to first finding presented | Workflow step timing |
| False negative detection | Feedback prompt captures ≥1 missed gap per pilot team | `.gyre/feedback.yaml` data |
| Review-and-amend adoption | ≥60% of pilot teams modify the generated manifest | Manifest amendment tracking |
| Cross-domain hit rate | ≥1 cross-domain compound finding per analysis run | Finding source tags |
| Novel findings | ≥30% of findings sourced from contextual model (not static analysis alone), validated by team confirmation that the finding was previously unknown to them | Source tag ratio cross-referenced with post-pilot interview |

### Qualitative Validation

**Note on sample size:** All pilot metrics use n=5. Thresholds are directional signals for go/no-go decisions, not statistically significant benchmarks. Interpret results qualitatively — a single team's experience can swing any metric by 20%.

| Metric | Target | Measurement |
|--------|--------|-------------|
| "Aha!" discovery | ≥4/5 pilot teams report at least one finding they would not have discovered without Gyre | Post-pilot interview |

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

**Scope note:** The Product Brief's artifact-generation vision — SLO definitions, observability-as-code, policy-as-code ("code, not counsel") — is deferred to v2. MVP validates the discovery hypothesis first; if teams act on findings, v2 adds generated remediation artifacts.

### Traceability Matrix

| Feature | FRs | Journeys | Success Metric | Size | Test Method |
|---------|-----|----------|---------------|------|-------------|
| M1: Guard question | FR6, FR7, FR8 | J1, J4, J5 | Architecture intent accuracy ≥90% | M | Integration |
| M2: Source tagging | FR19 | J1, J4, J5 | Novel findings ≥30% | S | Unit |
| M3: Confidence tagging | FR20 | J4, J5 | Model accuracy measurement | S | Unit |
| M4: Review-and-amend | FR24, FR25, FR26, FR27 | J1, J2, J4, J5, J6 | Adoption ≥60% | L | Integration + Pilot |
| M5: Findings history | FR39 | J2 | Re-run rate ≥3/5 | M | Integration |
| H1: Stack detection | FR1, FR1b, FR2, FR3, FR4, FR5 | J1, J3, J4, J5, J6 | Stack diversity ≥3 | L | Integration |
| H2: Model generation | FR9, FR10, FR11, FR12, FR13, FR14, FR15 | J1, J2, J3, J4, J5, J6 | First-run accuracy ≥70% | L | Human + Synthetic |
| H3: Observability agent | FR16, FR18 | J1 | Cross-domain hit rate ≥1 | L | Human + Pilot |
| H4: Deployment agent | FR17, FR18 | J1 | Cross-domain hit rate ≥1 | L | Human + Pilot |
| H5: Cross-domain correlator | FR22a, FR22b | J1, J5 | "Aha!" ≥4/5 teams | L | Pilot |
| H6: Feedback prompt | FR28, FR29, FR30 | J1, J4, J5, J6 | False neg detection ≥1/team | M | Integration + Pilot |
| H7: Delta analysis | FR38, FR40, FR41 | J2 | Re-run rate ≥3/5 | M | Integration |
| Q1: RICE scoring | FR21, FR50 | J1, J2, J3 | Severity agreement ≥4/5 | M | Pilot |
| Q2: Severity summary | FR33 | J1, J2, J3 | — | S | Unit |
| Q3: Mode labels | FR37, FR38 | J1, J2 | Mode selection distribution | S | Unit |
| DC1: Model before findings | FR31 | J1 | — | S | Unit |
| DC2: Compound visual | FR35 | J1, J5 | — | S | Unit |
| DC3: Novelty ratio | FR34 | J1 | — | S | Unit |
| DC4: Readable descriptions | FR13 | J1, J4 | — | M | Human |
| DC5: Privacy architecture | FR23 | All | — | L | Integration + Audit |
| Cross-cutting: Module | FR42, FR43, FR44, FR49, FR51, FR52, FR53, FR55, FR56, FR57 | All | Time-to-first-finding <2min | M | Integration |

**Size key:** S = hours, M = days, L = sprints. **Test key:** Unit = automated, Integration = end-to-end CLI test, Human = manual evaluation, Pilot = requires real users, Synthetic = synthetic ground truth repos, Audit = security review.

## User Journeys

Journeys 1, 4, and 5 validate core discovery value. Journeys 2 and 3 validate operational workflows that sustain and scale that value. Journey 6 validates graceful degradation.

### Journey 1: Sana — Crisis Mode (First Run)

**Trigger:** Repeated production incidents; team cannot correlate errors with deploys due to missing observability.
**Action:** Activates Scout agent, runs full-analysis workflow. Scout detects the stack and asks conversationally: "I see a containerized Node.js service — is this container-based or serverless?"
**Key finding:** Cross-domain compound finding — missing deployment markers + missing rollback telemetry = blind rollbacks. This directly explains last night's incident.

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

**Outcome:** Generates 34-capability manifest, amends 2 items (removes Kafka — uses SQS), pulls blocker + top 3 recommended into sprint. Shares severity-first summary in Slack. Feedback prompt captures a missed gap (uncodified database failover runbook). Re-runs 2 weeks later — amended model respected, fixed gaps gone, new finding from dependency update.

**Capabilities revealed:** stack detection, model generation, cross-domain correlation, conversational findings presentation, review-and-amend, feedback prompt, re-run with amendment persistence, RICE scoring, severity-first summary, copy-pasteable output format.

---

### Journey 2: Sana — Re-run After Amendments (Anticipation Mode)

**Trigger:** Three sprints after first run; team closed 8/10 findings; new Redis cache layer added.
**Action:** Activates Scout, runs full-analysis — auto-detects anticipation mode from existing `.gyre/`.
**Key finding:** 2 new Redis-related gaps (cache eviction monitoring, connection pool health checks) sourced from contextual model. 8 resolved findings removed. 2 original findings carried forward.

**Outcome:** Delta summary: "0 blockers, 2 new recommended, 2 carried forward, 11 nice-to-have." Pulls Redis findings into sprint. Six weeks later, a rollback is clean because Gyre had flagged missing rollback telemetry in run 1 — incident recovery takes 4 minutes instead of 4 hours. Colleague asks for install link (organic referral).

**Capabilities revealed:** amendment persistence, delta analysis, carried-forward tracking, re-run speed, anticipation mode, organic referral trigger, incident prevention evidence.

---

### Journey 3: Ravi — Portfolio Assessment (Delegation)

**Trigger:** Leadership asks "How production-ready are we across the board?" — no consistent answer exists.
**Action:** Sends 12 team leads the install link: "Install Gyre (`convoke-install-gyre`) and run a full analysis — send me the findings." Five respond within a week.

```
payments-api (Go):        1 blocker, 4 recommended, 12 nice-to-have
auth-service (Node):      0 blockers, 7 recommended, 9 nice-to-have
user-dashboard (Python):  3 blockers, 2 recommended, 15 nice-to-have
notifications (Python):   0 blockers, 1 recommended, 8 nice-to-have
search-indexer (Java):    2 blockers, 5 recommended, 11 nice-to-have
```

**Outcome:** Answers leadership's question same-day instead of "give me two weeks." Replaces ad-hoc assessment spreadsheet. Presents readiness trends at quarterly review: "6 blockers → 1 across portfolio."

**Capabilities revealed:** multi-repo usage, findings artifacts as structured YAML, comparative summary, portfolio-level visibility, delegation workflow (Ravi → team leads), stack diversity (Go, Node, Python, Java), trend tracking over time.

---

### Journey 4: Sana — Trust Failure and Recovery

**Trigger:** Go/gRPC microservice — guard question correctly identifies "container-based" but contextual model generates HTTP-specific capabilities (e.g., `/healthz` endpoint). Three irrelevant findings.
**Key mechanism:** Confidence tag (`[CONFIDENCE: medium]`) signals model suggestion, not definitive claim.

```
Finding 7 [RECOMMENDED] No HTTP health endpoint on /healthz
  Source: contextual model
  [CONFIDENCE: medium]
```

**Outcome:** Amends manifest — removes 3 HTTP capabilities, adds gRPC health checking and reflection. Re-run produces 2 real gRPC-specific findings (deadline propagation monitoring, connection drain on shutdown). Feedback captures: "gRPC stacks need different health check patterns than HTTP." Trust recovers because user could see why the model was wrong, fix it, and get better results.

**Guard failure variant:** Junior dev answers guard incorrectly ("serverless" for containerized stack). Re-runs with correct answer — one question, fast recovery. Implies FR: guard correction should not require full re-analysis.

**Capabilities revealed:** confidence tagging as trust signal, review-and-amend as recovery mechanism, model learning from corrections, feedback prompt for ecosystem improvement, graceful degradation for edge-case stacks, guard re-answerability.

---

### Journey 5: Reluctant Dev — Delegated Onboarding

**Trigger:** Dev on notifications team installs Gyre only because Ravi asked twice. Expects linter-style noise.
**Key finding:** Missing SIGTERM handler — explains mysterious message loss during deploys that the team had been debugging for two weeks. Cross-domain compound finding connects it to in-flight message loss.

```
Mode: crisis (one-shot analysis)

Finding 1 [RECOMMENDED] No graceful shutdown handler for SIGTERM
  Source: contextual model | Confidence: high
  → Cross-domain: Without graceful shutdown, in-flight messages are lost during deploys (see Observability #3)

Finding 2 [RECOMMENDED] No dead letter queue monitoring
  Source: contextual model
  [CONFIDENCE: medium]
```

**Outcome:** 22-capability manifest (simple Python service). Amends 2 items, sends JSON to Ravi. Feedback: "Can it check message retry logic too?" Reports SIGTERM finding to Ravi — value flows back up delegation chain. Dev does not resist future runs.

**Capabilities revealed:** minimal onboarding friction (one question), non-champion time-to-value (<2 min), skeptic-to-curious conversion, JSON output from producer side, low-effort amendment, delegation loop completion (value flows Ravi → dev → Ravi).

---

### Journey 6: The Unsupported Stack — Graceful Degradation

**Trigger:** Rust/bare-metal service — no Kubernetes, no standard cloud provider, no off-the-shelf observability.
**Key mechanism:** Limited-coverage warning when model generates only 12 capabilities (below 20-capability threshold).

```
⚠️  Limited coverage for this stack (12 capabilities generated).
    Gyre's knowledge of Rust/bare-metal stacks is thin.
    Your amendments are especially important — continue analysis? (y/abort)
```

**Outcome:** Sparse findings (1 recommended, 2 nice-to-have) — all from static analysis, 0 contextual. Team adds 9 capabilities manually (IPMI monitoring, failover runbook triggers). Re-run finds 4 new gaps from amendments. Model shifts from Gyre-generated to team-authored with Gyre as scaffold. Experience is "useful but thin" — honest product boundaries.

**Capabilities revealed:** limited-coverage warning, graceful degradation, amendment-as-primary-value, feedback for ecosystem improvement, honest product boundaries.

---

### Journey Coverage Summary

| Capability Area | J1 | J2 | J3 | J4 | J5 | J6 |
|----------------|----|----|----|----|-----|-----|
| Stack detection & analysis | ✅ | | ✅ | ✅ | ✅ | ✅ |
| Contextual model generation | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Architecture intent guard | ✅ | | | ✅ | ✅ | |
| Cross-domain correlation | ✅ | ✅ | | | ✅ | |
| Review-and-amend workflow | ✅ | ✅ | | ✅ | ✅ | ✅ |
| Feedback prompt | ✅ | | | ✅ | ✅ | ✅ |
| Amendment persistence | | ✅ | | ✅ | | ✅ |
| Delta analysis | | ✅ | | | | |
| Conversational findings | ✅ | ✅ | ✅ | | ✅ | ✅ |
| Severity-first summary | ✅ | ✅ | ✅ | | | |
| RICE scoring | ✅ | ✅ | ✅ | | | |
| Confidence tagging | ✅ | | | ✅ | ✅ | |
| Source tagging | ✅ | | | ✅ | ✅ | ✅ |
| YAML artifact output | | | ✅ | | ✅ | |
| Copy-pasteable output | ✅ | | | | | |
| Findings-history persistence | | ✅ | | | | |
| Model subtraction logic | | | | ✅ | | |
| Limited-coverage warning | | | | | | ✅ |
| Crisis mode | ✅ | | | ✅ | ✅ | ✅ |
| Anticipation mode | | ✅ | | | | |

All MVP features (M + H + Q) appear in at least one journey. Journey 4 validates the accuracy ecosystem end-to-end. Journey 5 validates the delegation workflow's weakest link. Journey 6 validates the graceful degradation path for thin-model stacks.

### Journey-to-Hypothesis Mapping

Each journey implicitly tests a behavioral hypothesis for pilot validation:

| Journey | Behavioral Hypothesis | Pilot-Testable? |
|---------|----------------------|-----------------|
| J1 | Accumulated frustration triggers search; first cross-domain finding creates trust | Yes — observe first-run behavior |
| J2 | Amendment persistence + delta analysis creates re-run habit | Needs 4+ weeks observation |
| J3 | Delegation + JSON output enables portfolio visibility | Needs platform engineer in pilot |
| J4 | Confidence tags + review-and-amend recovers trust after model errors | Yes — observe error recovery |
| J5 | Non-champions find value despite zero buy-in when findings hit real pain | Yes — observe delegated runs |
| J6 | Teams with unsupported stacks still find value through amendment-first workflow | Yes — include ≥1 niche stack in pilot |

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

Agent knowledge and web search provide baseline currency for current best practices. However, web search may return outdated or conflicting advice. Source tagging provides transparency — users can see "Source: web search" — but there is no freshness indicator in MVP. Team amendments close gaps for specific stacks.

**MVP mitigation:** Each capability in `.gyre/capabilities.yaml` includes a `source` field (`agent_knowledge` | `web_search` | `standard:<name>`) so users can see which capabilities were web-search-derived and apply appropriate skepticism during review-and-amend. When web search returns conflicting advice for the same capability, the model generation prompt must select the recommendation backed by the most authoritative source (official docs > vendor blog > community post) and note the conflict in the capability description.

**Deferred to v2:** Freshness indicator on web-search-sourced capabilities (e.g., "Last verified: 2026-Q1").

## Innovation Architecture & Differentiation

Cutting features listed here as "differentiation-critical" destroys the product's market position.

### Innovation Dependency Chain

```
Generated Contextual Model (foundation)
    → Absence Detection (depends on model)
        → Cross-Domain Compound Findings (depends on absence detection)

Accuracy Ecosystem (sustainability layer — improves all above, not required for first-run)
```

**Consequence:** Model quality is the single point of failure for all three innovation layers. A bad model produces misleading findings that compound across domains.

| Innovation | Type | Core Mechanism | Key Risk |
|-----------|------|---------------|----------|
| 1. Generated Contextual Model | Foundation | Runtime generation of `.gyre/capabilities.yaml` from agent knowledge + web search + guard question — generates criteria, not measures against them | Model too generic → collapses into checklist |
| 2. Absence Detection | Category | Detects what's missing (not misconfigured) by comparing project state against contextual model | False absences erode trust faster than false presences |
| 3. Cross-Domain Compound Findings | Interaction | Correlates absences across domains — patterns in what doesn't exist. **MVP limitation:** with only 2 agents, "cross-domain" is a single pairwise comparison (observability × deployment). The "aha!" metric depends entirely on this one pair producing surprising interactions. If it doesn't, the core differentiator is unvalidated until v2 adds more agents. | One false positive in either domain → misleading compound finding; single pair may not produce compelling compounds for all stacks |
| 4. Accuracy Ecosystem | Sustainability | Interconnected system: detection → guard → model → confidence/source tagging → review-and-amend → feedback → improvement. Not needed for first-run; essential for re-run value and trust recovery. | Hard to debug — need instrumentation at each stage |

### Differentiation-Critical Requirements

These prevent Gyre from being perceived as "just a fancy linter." Cutting them destroys competitive positioning:

| # | Requirement | Why It Matters |
|---|------------|----------------|
| DC1 | Atlas presents model summary *before* Lens shows findings: "Generated 34 capabilities for your Node.js/Kubernetes stack. I've saved the manifest to `.gyre/capabilities.yaml`" | The model is the product; findings are consequences. If users only see findings, Gyre looks like a linter. |
| DC2 | Compound findings have distinct visual treatment (indented reasoning chain, not inline arrow) | Compound findings are *reasoning*, not rule matches. Visual distinction signals "this required cross-domain analysis." |
| DC3 | Novelty ratio shown to user: "X of Y findings are contextual — gaps a static linter would miss" | Users see the differentiation in real-time. Without this, the distinction is invisible. |
| DC4 | capabilities.yaml includes human-readable descriptions per capability | Amendment must feel like editing a knowledge document, not configuring a tool. |
| DC5 | Committed `.gyre/` artifacts contain only structured metadata — never source code, file paths, or secrets. Privacy boundary enforced by contract schemas. | Enterprise trust signal; artifacts are safe to commit to VCS and share across teams. |

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

## Convoke Team Module Requirements

### Module Overview

Gyre is a **Convoke team module** — conversational persona agents running inside Claude Code, following the same patterns as Vortex. Users interact with Gyre agents through natural conversation, not CLI commands. Agents use Claude Code's built-in tools (Glob, Grep, Read, Bash, WebSearch) for filesystem analysis and web research.

### Agent Team

| Agent | Icon | ID | Role |
|-------|------|----|------|
| Scout | 🔎 | stack-detective | Detects stack, classifies, asks guard questions |
| Atlas | 📐 | model-curator | Generates capabilities manifest from stack profile |
| Lens | 🔬 | readiness-analyst | Runs absence detection and cross-domain correlation |
| Coach | 🏋️ | review-coach | Guides review, captures feedback, manages amendments |

### Workflow Structure

| Workflow | Owner | Purpose | Steps |
|----------|-------|---------|-------|
| full-analysis | Scout (initiates) | End-to-end pipeline: detect → generate → analyze → review | 5 |
| stack-detection | Scout | Standalone stack classification | 3 |
| model-generation | Atlas | Generate capabilities manifest | 4 |
| model-review | Coach | Guide review and amendment | 3 |
| gap-analysis | Lens | Absence detection + cross-domain correlation | 5 |
| delta-report | Lens | Compare findings against previous run | 3 |
| accuracy-validation | Atlas | Pre-pilot synthetic ground truth scoring | 3 |

### Conversational Output Sequence

When running full-analysis, the conversation flows:

1. **Scout:** Mode indicator — "This is your first analysis (crisis mode)" or "I see a previous run — comparing against it (anticipation mode)"
2. **Scout:** Stack detection results + guard questions (if ambiguous)
3. **Atlas:** Model summary — "Generated 34 capabilities for your Node.js/Kubernetes stack. I've saved the manifest to `.gyre/capabilities.yaml`"
4. **Lens:** Findings presentation — severity-first summary, then detailed findings with source/confidence tags
5. **Lens:** Compound findings with reasoning chains
6. **Lens:** Novelty ratio — "8 of 12 findings are contextual — gaps a static linter would miss"
7. **Coach:** Review prompt — "Would you like to walk through your capabilities manifest? I can present each one for you to keep, remove, or edit."
8. **Coach:** Feedback prompt — "Did Gyre miss anything you know about?" — persists to `.gyre/feedback.yaml`

**Anticipation mode additions:**
- Delta summary: "2 new findings, 2 carried forward, 3 resolved since last run"
- New findings tagged [NEW], carried-forward tagged [CARRIED]
- Resolved findings listed briefly

### Installation & Distribution

| Aspect | Decision |
|--------|----------|
| Module location | `_bmad/bme/_gyre/` |
| Install command | `convoke-install-gyre` (npm bin script) |
| Runtime | Claude Code (agents are markdown personas) |
| AI provider | None needed — agent IS the LLM (Claude) |
| Config location | `_bmad/bme/_gyre/config.yaml` |

**Onboarding:** Zero configuration. If Claude Code is running, Gyre works. No API keys, no provider setup, no environment variables.

### Stack Detection

Gyre is **language-agnostic by design** — it analyzes infrastructure patterns, not code syntax. Scout uses Claude Code tools:

| Detection Target | Tool | Pattern |
|-----------------|------|---------|
| Container orchestration | Glob | `**/Dockerfile`, `**/k8s/**`, `**/docker-compose.yaml` |
| CI/CD platform | Glob | `.github/workflows/**`, `.gitlab-ci.yml`, `Jenkinsfile` |
| Observability stack | Grep | `opentelemetry`, `prometheus`, `datadog` in deps + configs |
| Primary language/framework | Glob | `package.json`, `go.mod`, `requirements.txt`, `Cargo.toml` |
| Cloud provider | Glob + Read | `terraform/`, `cloudformation/`, provider configs |

### Portfolio Support (Ravi Persona)

For platform engineers running Gyre across multiple repos: each repo produces `.gyre/findings.yaml` as a structured YAML artifact. Ravi can compare findings across repos by reading these artifacts. Portfolio-level comparison is a v2 workflow — MVP validates single-repo value first.

### Implementation Considerations

- **`.gyre/` auto-creation:** Auto-create on first run. Existing `.gyre/capabilities.yaml` triggers anticipation mode
- **Model subtraction:** When user removes capabilities during amendment, those capabilities and their findings are excluded on re-run
- **Findings-history persistence:** Track findings across runs for delta analysis and carried-forward display
- **Monorepo handling:** One `.gyre/` per service root — Scout detects service boundaries and asks user to select
- **Graceful degradation:** If detection is uncertain, agent asks for guidance; if analysis is incomplete, agent reports what it found and offers to retry

## Project Scoping & Phased Development

### MVP Strategy & Philosophy

**MVP Approach: Learning MVP** — The primary goal is validated learning, not revenue or experience polish. The M/H/Q classification embeds this: M features measure, H features test hypotheses, Q features improve experience. The pilot (5 teams) is the validation event.

Core question the MVP must answer: *"Can Gyre discover unknown unknowns accurately enough that teams act on the findings?"*

### MVP Feature Set (Phase 1)

See **Product Scope > MVP Feature Classification** for the full M/H/Q tables (15 features), build sequence, and cut order.

**Core journeys supported by MVP:** J1 (Sana crisis), J4 (trust recovery), J5 (reluctant dev) validate core hypothesis. J2 (re-run) requires H7. J3 (Ravi portfolio) requires longer observation.

### Emergency Cut (Minimum Viable Scope)

**Status:** Contingency plan — not the current scope. Activates only if schedule forces a scope reduction.

**7 features: M1 + M2 + M4 + H1 + H2 + H3 + H6**

Drops: confidence tagging (accept trust erosion), deployment agent (single-domain only), cross-domain correlator (no compound findings), findings-history persistence + delta analysis.

**M1 (guard question) is retained even in emergency cut.** Dropping it while keeping H2 (model generation) is architecturally incoherent — the guard question prevents category errors that contaminate the contextual model. Without it, the ≥70% model accuracy gate becomes much harder to pass because the model has no architecture intent signal. The guard question is low-cost (≤3 questions, ≤1 day of implementation) relative to the accuracy risk it mitigates.

**Advisory:** This scope validates model quality only, not product differentiation. If H5 (compound findings) cannot ship on schedule:
1. Run micro-pilot (2 teams, single-domain only)
2. If single-domain findings produce ≥2/2 "aha!" reactions, ship without H5
3. If not, invest in H5 before full pilot — a delayed MVP with compound findings is better than an on-time MVP without its core differentiator

### Resource Requirements

Build strategy: Agent personas and workflow step-files first (provides conversational test harness), then prompt iteration for model generation accuracy. The prompt engineering for Atlas (model generation) is the critical path — model accuracy targets may require many iterations. As a Convoke team, there is no application code to write — only markdown agent definitions, workflow step-files, and contract schemas.

### Post-MVP Roadmap

**Phase 2 (v2):** Compliance/Security + FinOps domain workflows (new Lens analysis steps), Priya persona, portfolio comparison workflow (Ravi), team-shared model library, web search freshness indicator. **Phase 3 (v3+):** Community model marketplace, historical trends, predictive gap detection, multi-repo portfolio workflow.

### Risk Mitigation Strategy

*For innovation-specific risks with fallback strategies, see Innovation Architecture & Differentiation. Below covers project-level technical, market, and resource risks.*

**Technical risks:**

| Risk | Severity | Mitigation |
|------|----------|-----------|
| Model generation quality too low | Critical | Synthetic ground truth pre-pilot; model richness minimum; guard question |
| LLM reasoning inconsistency | High | Cache generated model in `.gyre/capabilities.yaml`; re-runs load cached model, no regeneration unless explicit |
| Static analysis misses existing capabilities | High | Source tagging; review-and-amend catches false absences |
| Cross-domain correlation misleading | Medium | Compound confidence from components; degrade to single-domain if low confidence |

**Market risks:**

| Risk | Mitigation |
|------|-----------|
| Teams don't care until after incident | Crisis mode as primary entry; Journey 1 validates |
| "We already have Cortex/Backstage" | Discovery vs compliance positioning; compound findings differentiate |
| Requires Claude Code | Gyre only works inside Claude Code; positioned as value-add for existing Convoke users, not standalone tool |

**Resource risks:**

| Risk | Mitigation |
|------|-----------|
| Solo engineer scope too large | Emergency cut to 7 features; sequential M → H build. Reduced scope vs CLI — no application code, only markdown agent definitions |
| SRE expertise unavailable | Open-source repos as synthetic ground truth |
| Pilot recruitment fails (5 → 3 teams) | Recalibrate thresholds: "aha!" ≥2/3, re-run ≥2/3, backlog ≥2/3. Statistical confidence drops — results directional, not conclusive |

## Functional Requirements

**This section defines the capability contract for the entire product.** UX designers design only what's listed here. Architects support only what's listed here. Epic breakdown implements only what's listed here. If a capability is missing, it will not exist in the final product.

### Capability Area 1: Stack Detection & Classification

- **FR1:** System can detect the primary technology stack of a project by analyzing file system artifacts (package manifests, config files, IaC templates)
- **FR1b:** System can detect multiple technology stacks within a project, select the primary stack for model generation, and surface secondary stacks as a warning to the user (e.g., "Detected Go primary + Python sidecar — model generated for Go; Python components may have uncovered gaps")
- **FR2:** System can detect container orchestration platform (Kubernetes, ECS, Docker Compose) from project files
- **FR3:** System can detect CI/CD platform (GitHub Actions, GitLab CI, Jenkins) from project files
- **FR4:** System can detect observability tooling (Datadog, Prometheus, OpenTelemetry) from config and dependency files
- **FR5:** System can detect cloud provider (AWS, GCP, Azure) from IaC templates and config files
- **FR6:** System can present architecture intent guard questions to the user to confirm stack classification. Guard questions are derived from what was detected (not a fixed list) and cover deployment model (container-based, serverless, bare-metal), communication protocol (HTTP/REST, gRPC, message queue), and any ambiguous detection results. Limit to ≤3 questions to preserve onboarding speed.
- **FR7:** User can provide guard question answers conversationally, including correcting previous answers ("Actually, it's container-based, not serverless") without re-running the full analysis pipeline
- **FR8:** System can re-classify the stack based on corrected guard answers without re-running the full analysis pipeline

### Capability Area 2: Contextual Model Generation

- **FR9:** System can generate — not select from templates — a capabilities manifest (`.gyre/capabilities.yaml`) unique to the detected stack, using LLM reasoning and web search to determine what capabilities should exist
- **FR10:** System can incorporate industry standards (DORA, OpenTelemetry, Google PRR) into the generated model
- **FR11:** System can incorporate current best practices via web search into the generated model
- **FR12:** System can adjust the generated model based on the guard question classification
- **FR13:** Each generated capability includes a plain-language description (1-3 sentences explaining what the capability is and why it matters)
- **FR14:** System can generate ≥20 capabilities for supported stack archetypes
- **FR15:** System can surface a limited-coverage warning when fewer than 20 capabilities are generated

### Capability Area 3: Absence Detection & Analysis

- **FR16:** Observability Readiness agent can analyze the project for observability gaps by comparing existing capabilities against the contextual model
- **FR17:** Deployment Readiness agent can analyze the project for deployment gaps by comparing existing capabilities against the contextual model
- **FR18:** System can identify capabilities listed in the contextual model for which no evidence of implementation was found in the project's files, dependencies, or configuration
- **FR19:** System can tag each finding with its source (static analysis vs contextual model)
- **FR20:** System can tag each finding with a confidence level (high/medium/low)
- **FR21:** System can classify each finding by severity (blocker/recommended/nice-to-have)
- **FR22a:** System can identify when findings in different domains share a causal or amplifying relationship (e.g., an absence in one domain increases the risk of an absence in another) to surface compound gaps
- **FR22b:** System can express compound finding relationships as a reasoning chain in conversational output and in `.gyre/findings.yaml`
- **FR23:** Static analysis produces a structured capability evidence report (capability ID, evidence type: present/absent/partial, detection method, no file contents) that serves as the sole input from local analysis to LLM reasoning

### Capability Area 4: Review, Amendment & Feedback

- **FR24:** User can review the generated capabilities manifest through a conversational walkthrough. Coach presents each capability one at a time with its description and asks the user to keep, remove, or edit it. User can also skip remaining capabilities. The walkthrough is conversational — no editor or YAML knowledge required.
- **FR25:** User can amend the capabilities manifest by adding, removing, or modifying capabilities through conversational interaction with Coach. Coach writes the amendments to `.gyre/capabilities.yaml`.
- **FR26:** System respects user amendments on subsequent runs (amendment persistence). *Scope: per-repo learning only in MVP. Cross-repo learning (amendments improving model for other users) deferred to v2.*
- **FR27:** When user removes capabilities, system excludes those capabilities and their associated findings on re-run (model subtraction)
- **FR28:** System prompts user for feedback after each analysis with the question "Did Gyre miss anything you know about?" — this is measurement infrastructure for absence accuracy, not a satisfaction survey
- **FR29:** User feedback is persisted to `.gyre/feedback.yaml` with timestamp
- **FR30:** System explains that feedback.yaml should be committed for team-wide model improvement

### Capability Area 5: Output & Presentation

- **FR31:** System can display a model summary before findings, showing capability count and detected stack
- **FR32:** ~~CLI streaming~~ **REMOVED** — Conversational output is inherently progressive; Lens presents findings as it discovers them during the gap-analysis workflow
- **FR33:** System can display a severity-first leadership summary (blockers, recommended, nice-to-have counts)
- **FR34:** System can display the novelty ratio ("X of Y findings are contextual — gaps a static linter would miss")
- **FR35:** System can display compound findings with a visually distinct indented reasoning chain
- **FR36:** ~~JSON output~~ **REPLACED** — Findings are persisted to `.gyre/findings.yaml` as structured YAML; conversational output is the primary presentation
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
- **FR51:** System can detect service boundaries in monorepos using explicit signals: directories containing their own package manifest (package.json, go.mod, requirements.txt, Cargo.toml) AND their own Dockerfile or deployment config. If ≥2 service roots are detected, Scout lists them conversationally and asks the user to select one. System does NOT attempt implicit boundary detection (e.g., directory naming conventions).
- **FR52:** When a limited-coverage warning is triggered, system presents the warning with the option to continue analysis (with higher emphasis on review-and-amend) or abort
- **FR53:** System can display existing entries from `.gyre/feedback.yaml` at the start of analysis, showing what gaps were previously reported by team members
- **FR55:** System can persist a "review deferred" flag in `.gyre/` and display a reminder to review the capabilities manifest at the start of the next analysis run

### Capability Area 7: Installation, Configuration & Resilience

- **FR44:** ~~npm install~~ **REPLACED** — User can install Gyre via `convoke-install-gyre` (npm bin script), which copies the Gyre module markdown files to `_bmad/bme/_gyre/`
- **FR45:** ~~Provider config~~ **REMOVED** — No AI provider configuration needed; agent IS the LLM (Claude via Claude Code)
- **FR46:** ~~First-run setup~~ **REMOVED** — Zero configuration. If Claude Code is running, Gyre works.
- **FR47:** ~~Fail-fast provider error~~ **REMOVED** — No external provider to fail
- **FR48:** ~~Auto model selection~~ **REMOVED** — Agent IS Claude; no model selection
- **FR54:** ~~JSON status field~~ **REMOVED** — No JSON output mode; findings status is conversational + YAML artifacts
- **FR56:** If analysis fails after model generation completes, the generated manifest (`.gyre/capabilities.yaml`) is already saved. Agent informs user conversationally that analysis can be retried without regenerating the model.
- **FR57:** ~~Complete-or-nothing persistence~~ **ADAPTED** — If Lens encounters a failure during analysis, it reports what it found conversationally, saves successfully analyzed findings to `.gyre/findings.yaml`, and offers to retry the failed domain. Partial results are explicitly labeled as incomplete in the YAML.

## Non-Functional Requirements

### Performance

| NFR | Target | Rationale |
|-----|--------|-----------|
| NFR1: Time-to-first-finding | <2 minutes from full-analysis workflow start to first finding presented in conversation. **Intermediate targets:** stack detection <10s, guard question <15s after detection, model generation <90s. These phase targets guide workflow design and sum to the <2min envelope. | Success metric; drives "wow, fast" perception that predicts re-run behavior |
| NFR2: Total analysis time | <10 minutes for a typical project (≤500 files, ≤2 domains) | Operational constraint; must complete within a coffee break |
| NFR3: Guard question response time | <1 second after user answers | Interactive prompt must feel instant |
| NFR4: Re-run with existing model | ≤50% of first-run time | Model generation skipped; anticipation mode should be noticeably faster |
| NFR5: Agent activation time | <3 seconds from agent activation to first output (greeting + mode indicator) | Prevents "is it working?" anxiety; config load must be fast |

### Security & Privacy

| NFR | Target | Rationale |
|-----|--------|-----------|
| NFR6: API key storage | ~~External API key storage~~ **REMOVED** — No external API keys needed; Claude Code manages its own authentication | N/A |
| NFR7: Privacy architecture | Agents read project files using Claude Code tools but committed artifacts (`.gyre/capabilities.yaml`, `.gyre/findings.yaml`, `.gyre/feedback.yaml`) must contain only structured metadata — never source code, file contents, file paths, or secrets. **Privacy boundary = artifact content rules, enforced by contract schemas (GC1-GC3).** | Artifacts are committed to VCS — must be safe to share; enterprise trust signal |
| NFR8: Artifact content boundary | Committed `.gyre/` artifacts contain: (a) stack classification categories, (b) capability descriptions, (c) finding descriptions with evidence summaries, (d) feedback entries. They do NOT contain: file contents, file paths, directory structures, version numbers, dependency lists, or secrets. | Makes privacy promise concrete and auditable at the artifact level |
| NFR9: Artifact safety | Generated artifacts (capabilities.yaml, feedback.yaml) must not contain source code snippets, file contents, or secrets found during analysis | Artifacts are committed to VCS — must be safe to share |

**Privacy note for Convoke team architecture:** Since agents run inside Claude Code, they have full filesystem access during analysis. The privacy boundary is at the *artifact* level — what gets written to `.gyre/` and committed to VCS. Contract schemas (GC1-GC3) enforce that only structured metadata enters artifacts. The agent reads source files to detect capabilities but never copies file contents into artifacts.

### Reliability

| NFR | Target | Rationale |
|-----|--------|-----------|
| NFR10: Model generation consistency | Same project + same guard answers + same provider + same model version should produce a substantially similar capabilities manifest (temperature=0, seed parameter where supported). LLM providers do not guarantee bitwise determinism even at temperature=0 — the requirement is behavioral consistency (same capabilities identified), not output identity. Cache the generated model after first run to ensure re-run consistency. | Users expect consistency; model caching is the primary mechanism, not LLM determinism |
| NFR11: Graceful analysis failure | If an analysis step fails (e.g., ambiguous detection, incomplete evidence), agent reports what it found and offers to retry or proceed with partial results | Conversational error handling replaces exit codes |
| NFR12: File system safety | Gyre never modifies, deletes, or writes outside the `.gyre/` directory | Users grant read access; Gyre must not touch source code |
| NFR13: Run exclusivity | If `.gyre/.lock` exists, abort with "Another analysis is running" message. Full concurrent safety deferred to v2/CI | Simple lock file for MVP; prevents `.gyre/` corruption |

### Integration

| NFR | Target | Rationale |
|-----|--------|-----------|
| NFR14: LLM provider | ~~Multi-provider~~ **REMOVED** — Agent IS Claude via Claude Code; no provider abstraction | N/A |
| NFR15: Node.js version support | Node.js ≥20 for installer scripts (`convoke-install-gyre`); agents are markdown, no Node.js dependency | Consistent with Convoke ecosystem |
| NFR16: OS compatibility | macOS, Linux, and Windows — wherever Claude Code runs | Convoke team inherits Claude Code's platform support |
| NFR17: YAML artifact schema stability | `.gyre/` YAML artifact schemas versioned in `gyre_manifest.version` and `gyre_findings.version`; breaking changes require version bump | Teams depend on stable artifact structure for re-runs and delta analysis |

### Quality Gates

| NFR | Target | Rationale |
|-----|--------|-----------|
| NFR18: Workflow phase independence | Each Gyre workflow (stack-detection, model-generation, gap-analysis, model-review, delta-report) is independently runnable — users can invoke any workflow directly without running the full pipeline | Enables guard correction (re-run stack-detection), retry after partial failure (re-run gap-analysis), and standalone model review |
| NFR19: Model accuracy release gate | First-run model accuracy ≥70% across ≥3 stack archetypes via synthetic ground truth rubric | Pre-pilot release condition; domain constraint formalized as NFR |
| NFR20: Guard question coverage | Guard options cover ≥95% of common architectures without requiring expert knowledge | Guard must not become an onboarding barrier |
| NFR21: Web search freshness | Web search results from current calendar year; no cross-run caching of web results | Prevents recommending deprecated practices |
| NFR22: Compound finding confidence | Compound findings suppressed when either component finding has confidence "low"; displayed with the lower component's confidence level when both are "medium" or higher | Prevents misleading cross-domain findings |
