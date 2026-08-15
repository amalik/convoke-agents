# Convoke Extended Ecosystem — Updated with Gyre

## A framework of domain-specialized AI agent teams covering every gap from discovery to sustained operation

**Version:** 0.2.0-draft
**Author:** Proposed by Claude (Anthropic) for review and adaptation by Amalik
**Designed for:** BMAD Method + Convoke Agents ecosystem
**License:** To be determined by the adopter

---

## What changed in v0.2

This revision incorporates **Gyre** — the operational readiness team already in development. Gyre's scope significantly overlaps with two teams proposed in v0.1 (Vigil and Ledger). This revision:

1. Eliminates Vigil as a standalone team — Gyre's Observability and Deployment agents absorb most of Vigil's scope
2. Eliminates Ledger as a standalone team — Gyre's Compliance & Security agent absorbs the technical enforcement side
3. Retains the pieces Gyre doesn't cover as extensions or new scoped teams
4. Repositions the remaining teams to complement Gyre cleanly

---

## Gyre overlap analysis

Before presenting the updated roster, here's exactly what Gyre covers and what it doesn't, mapped against the v0.1 teams:

### What Gyre absorbs from Vigil (Production Intelligence)

| Vigil scope | Gyre coverage | Status |
|-------------|---------------|--------|
| SLO definition | Gyre Observability agent — SLO/error budget definition | **Covered** |
| Observability architecture | Gyre Observability agent — telemetry strategy, golden signals, observability-as-code | **Covered** |
| Alert engineering | Gyre Observability agent — alert design, dashboard-as-code | **Covered** |
| Deployment pipeline verification | Gyre Deployment agent — CI/CD, IaC review, rollback strategy | **Covered** |
| Failure mode analysis | Gyre cross-domain correlation — compound risk findings | **Covered** |
| Dependency mapping | Gyre contextual model — detects architecture and dependencies | **Covered** |
| Runbook generation | Gyre output — runbook templates | **Covered** |
| Capacity planning | Gyre Capacity & FinOps agent (v3) | **Covered (future)** |
| **Incident command & response** | Not in Gyre — Gyre is pre-launch readiness, not runtime response | **Gap remains** |
| **On-call design & rotation** | Not in Gyre — operational rhythm, not readiness discovery | **Gap remains** |
| **Post-incident learning** | Not in Gyre — Gyre doesn't operate in production | **Gap remains** |
| **Chaos engineering** | Gyre's Externalize stream covers drills, but not ongoing chaos practice | **Partial** |

### What Gyre absorbs from Ledger (Compliance & Governance)

| Ledger scope | Gyre coverage | Status |
|-------------|---------------|--------|
| Regulatory landscape scan | Gyre Compliance & Security agent — regulation discovery | **Covered** |
| Control framework mapping | Gyre Compliance & Security agent — control mapping | **Covered** |
| Policy-as-code generation | Gyre output — OPA/Kyverno policies from discovered requirements | **Covered** |
| DevSecOps baseline | Gyre Compliance & Security agent — supply chain security, SLSA/SBOM | **Covered** |
| Threat modeling | Gyre Compliance & Security agent — security-by-design review | **Covered** |
| Compliance drift monitoring | Gyre anticipation mode — continuous re-assessment | **Covered** |
| **Full lifecycle traceability** | Not in Gyre — Gyre doesn't trace requirement→code→test→deploy chains | **Gap remains** |
| **Audit evidence generation** | Not in Gyre — Gyre produces readiness artifacts, not audit packages | **Gap remains** |
| **Exception management workflow** | Not in Gyre — Gyre flags, doesn't manage ongoing exceptions | **Gap remains** |
| **Cross-lifecycle enforcement gates** | Gyre gates pre-launch; doesn't enforce during dev (pre-commit hooks, PR gates) | **Gap remains** |

### What Gyre doesn't touch at all (other teams remain as-is)

| Team | Gyre overlap | Status |
|------|-------------|--------|
| Forge (domain knowledge) | None — Gyre is technical readiness, Forge is business domain knowledge | **No change** |
| Pulse (adoption & change) | None — Gyre is for engineers, Pulse is for all affected humans | **No change** |
| Loom (human-agent orchestration) | None — Gyre doesn't address human-AI collaboration rules | **No change** |
| Conduit (data lifecycle) | None — Gyre doesn't address data migration | **No change** |
| Compass (stakeholder alignment) | Minor — Gyre's leadership dashboard is a small overlap with Compass narrative | **No change** |

---

## The updated team roster

| # | Team | Code | Scope | Question it answers | Status |
|---|------|------|-------|-------------------|--------|
| 0 | **Vortex** | VTX | Product discovery | *Should we build this?* | Exists |
| 1 | **Gyre** | GYR | Operational readiness | *Are we ready for production?* | In development |
| 2 | **Forge** | FRG | Domain knowledge | *What must we understand first?* | Proposed (KORE spec) |
| 3 | **Pulse** | PLS | Adoption & change | *Will anyone actually use it?* | Proposed |
| 4 | **Loom** | LOM | Human-agent orchestration | *Who decides what, when?* | Proposed |
| 5 | **Conduit** | CDT | Data lifecycle | *Can we move the data safely?* | Proposed |
| 6 | **Compass** | CMP | Stakeholder alignment | *Are the right people behind us?* | Proposed |
| 7 | **Sentinel** | SNT | Incident lifecycle | *What do we do when things break?* | Proposed (new — the Vigil residual) |
| 8 | **Ledger** | LDG | Audit & traceability | *Can we prove it to auditors?* | Proposed (reduced — the Ledger residual) |

**Key changes from v0.1:**
- Vigil is replaced by **Sentinel** — scoped only to the pieces Gyre doesn't cover (incident response, on-call operations, post-incident learning)
- Ledger is **reduced** — scoped only to full-lifecycle traceability and audit evidence generation (Gyre handles the policy-as-code and compliance discovery side)
- Total: 9 teams (2 existing + 7 proposed), down from 9 in v0.1 but with cleaner boundaries

```
                          The updated ecosystem

  DISCOVER          UNDERSTAND          BUILD            READY           RUN
 ┌─────────┐      ┌─────────┐      ┌──────────┐    ┌──────────┐   ┌──────────┐
 │ Vortex  │─────▶│  Forge  │─────▶│   BMAD   │───▶│  Gyre    │──▶│ Sentinel │
 │ (VTX)   │      │  (FRG)  │      │  + TEA   │    │  (GYR)   │   │  (SNT)   │
 └─────────┘      └─────────┘      └──────────┘    └──────────┘   └──────────┘
                                         │               │              │
                                         ▼               │              │
                                    ┌──────────┐         │              │
                                    │  Pulse   │◀────────┴──────────────┘
                                    │  (PLS)   │  readiness + operational signals
                                    └──────────┘

 ────────────────────── spans entire lifecycle ─────────────────────
 │  Loom (LOM) — human-agent orchestration                        │
 │  Conduit (CDT) — data lifecycle                                │
 │  Compass (CMP) — stakeholder alignment                        │
 │  Ledger (LDG) — audit traceability (reduced scope)            │
 └────────────────────────────────────────────────────────────────┘
```

**The Gyre–Sentinel handoff:** Gyre answers "are we ready for production?" and produces the artifacts (SLOs, alerts, runbooks, policies) that define what healthy looks like. Sentinel picks up from there: when production incidents occur, Sentinel manages the response, the learning, and the feedback loop back to Forge and Gyre. Gyre is the architect of operational readiness; Sentinel is the operator of operational reality.

---
---

# TEAM 1: FORGE — Domain Knowledge (KORE)

*What must we understand first?*

**Unchanged from v0.1.** Full specification in KORE-Method-v0.1-Draft.md.

**5 agents:** Silo (Survey), Rune (Excavate), Aria (Codify), Sage (Validate), Warden (Steward)

**Integration with Gyre:** Forge's Regulatory Constraint Assets (RCAs) feed Gyre's Compliance & Security agent. Forge's Tribal Knowledge Assets inform Gyre's contextual model (e.g., "the batch job must complete by 6 AM" becomes an SLO input). Gyre's discovery may reveal domain knowledge gaps that route back to Forge.

---
---

# TEAM 2: PULSE — Adoption & Change Management

*Will anyone actually use it?*

**Unchanged from v0.1.** This is the gap Gyre explicitly doesn't address — Gyre is for engineering teams, Pulse is for all humans affected by the change.

**5 agents:** Ava (Sense), Kai (Shape), Tara (Equip), Reed (Embed), Zara (Sustain)

**5 phases:** Sense → Shape → Equip → Embed → Sustain

**Integration with Gyre:** Gyre's readiness dashboard (leadership rendering) partially overlaps with Pulse's communication artifacts. The handoff: Gyre tells leadership "the system is technically ready"; Pulse tells them "the organization is humanly ready." Both signals are needed for a go-live decision.

**Full specification:** See v0.1 document, Team 2 section. No changes required.

---
---

# TEAM 3: LOOM — Human-Agent Orchestration

*Who decides what, when?*

**Unchanged from v0.1.** Gyre doesn't address human-agent collaboration rules at all.

**4 agents:** Pact (Charter), Sentry (Boundary), Weave (Orchestrate), Flux (Evolve)

**4 phases:** Charter → Boundary → Orchestrate → Evolve

**Integration with Gyre:** Loom's orchestration charter should include rules for Gyre's agents — particularly the Compliance & Security agent, where regulatory findings must flag for human review (Gyre already states this principle; Loom formalizes the escalation protocol).

**Full specification:** See v0.1 document, Team 5 section. No changes required.

---
---

# TEAM 4: CONDUIT — Data Lifecycle & Migration

*Can we move the data safely?*

**Unchanged from v0.1.** Gyre doesn't address data migration at all.

**5 agents:** Prism (Profile), Atlas (Map), Flux (Transform), Proof (Verify), Helm (Cutover)

*Note: renamed "Forge" agent from v0.1 to "Flux" to avoid name collision with the Forge team.*

**5 phases:** Profile → Map → Transform → Verify → Cutover

**Integration with Gyre:** Gyre's Deployment agent may flag data migration as a deployment risk (e.g., "migration has no rollback strategy"). Conduit's data lineage artifacts feed Ledger's traceability matrix. Post-migration, Gyre's observability setup should include monitoring for data integrity metrics.

**Full specification:** See v0.1 document, Team 6 section (with the agent rename applied).

---
---

# TEAM 5: COMPASS — Stakeholder Alignment

*Are the right people behind us?*

**Unchanged from v0.1.** Gyre's leadership dashboard is a minor overlap (providing technical readiness visibility to PM/leadership), but Compass covers the much broader scope of political navigation, coalition building, and organizational change.

**4 agents:** Scout (Survey), Bond (Align), Story (Narrate), Anchor (Sustain)

**4 phases:** Survey → Align → Narrate → Sustain

**Integration with Gyre:** Gyre's readiness report and leadership summary are inputs to Story's progress narrative — concrete evidence that the technical track is on course. Scout's stakeholder mapping should include Gyre's personas (Sana, Ravi, Priya) as archetypes for stakeholder analysis.

**Full specification:** See v0.1 document, Team 7 section. No changes required.

---
---

# TEAM 6: SENTINEL — Incident Lifecycle (NEW — replaces Vigil)

*What do we do when things break?*

## 1. The problem Sentinel solves

Gyre ensures you're ready for production. But production is not a steady state — it's a continuous stream of surprises. Services degrade. Upstream dependencies fail. Traffic spikes arrive. Configuration drifts. Human error happens. When these things occur, the question is not "were we ready?" (Gyre answered that) but "can we respond effectively, learn from it, and improve?"

Sentinel is the operational counterpart to Gyre. Gyre builds the scaffolding (SLOs, alerts, runbooks, observability); Sentinel operates within that scaffolding when incidents occur and evolves it based on what production teaches.

## 2. Why Sentinel exists alongside Gyre

The boundary is crisp:

| Concern | Gyre | Sentinel |
|---------|------|----------|
| "What should our SLOs be?" | Defines them | Monitors burn rate |
| "What alerts do we need?" | Designs them | Responds to them |
| "What's in the runbook?" | Generates templates | Executes and evolves them |
| "Are we ready to launch?" | Yes — readiness gate | N/A |
| "The service is down" | N/A | Yes — incident command |
| "What went wrong?" | N/A | Post-incident review |
| "How do we prevent this?" | Gyre re-runs, updates readiness | Sentinel feeds learnings |

Gyre is design-time. Sentinel is runtime.

## 3. Core principles

### 3.1 Incidents are knowledge events

Every incident reveals something the team didn't know — about the system, the domain, the dependencies, or the operational processes. Post-incident reviews are not bureaucratic overhead; they're the single highest-value knowledge extraction activity in production.

### 3.2 Response is rehearsed, not improvised

Incident response under pressure is no time to make up process. Sentinel pre-establishes roles, communication channels, escalation paths, and playbooks so the team executes rather than invents.

### 3.3 On-call is a design problem

Sustainable on-call requires deliberate design: rotation schedules that prevent fatigue, handoff protocols that preserve context, escalation chains that route to the right person, and toil budgets that prevent the on-call engineer from drowning in alert noise.

### 3.4 Blamelessness is non-negotiable

Post-incident reviews that assign blame produce silence. Reviews that explore system failures produce learning. This principle is enforced structurally, not just culturally.

### 3.5 Resilience is tested, not assumed

Chaos engineering, game days, and failover drills are not optional luxuries — they're how you discover the gap between "we designed for this failure" and "the system actually handles it."

## 4. The Sentinel process — four phases

```
READY ──▶ RESPOND ──▶ LEARN ──▶ HARDEN
Set up     Handle       Extract    Improve
the ops    incidents    knowledge  resilience
rhythm
```

### Phase 1: READY — Set up the operational rhythm

**Goal:** Establish the operational infrastructure for running the service.

**Activities:**

1. **On-call design** — Rotation schedules, handoff protocols, escalation chains, fatigue management. Define: who is primary? Who is secondary? What's the escalation path? What's the compensation model?

2. **Operational cadence** — Weekly SLO/error budget review. Monthly operational review. Quarterly resilience assessment. Define who attends each, what the inputs are, what decisions they produce.

3. **Toil budget** — Define what percentage of on-call time should be spent on toil (manual, repetitive operational work). Track it. When it exceeds budget, prioritize automation.

4. **Gyre artifact operationalization** — Take Gyre's outputs (SLOs, alerts, runbooks, dashboards) and activate them: deploy the alert configurations, test that alerts fire correctly, verify runbooks are actionable, confirm dashboards are monitored.

**Output:** Operational Rhythm Document (ORD) — on-call rotations, review cadences, toil budget, activated Gyre artifacts.

### Phase 2: RESPOND — Handle incidents

**Goal:** Manage incidents from detection to resolution with clear roles and minimal chaos.

**Activities:**

1. **Incident command framework** — Define roles for every incident: Incident Commander (owns the response), Communications Lead (updates stakeholders), Technical Lead (directs the investigation). No role duplication. No freelancing.

2. **Severity classification** — Clear, agreed criteria for SEV1/2/3/4. Tied to business impact, not technical symptoms. "5% of users can't check out" is a severity, not "database CPU at 90%."

3. **Communication protocol** — Internal: status updates to engineering leadership at defined intervals. External: customer-facing status page updates. Pre-written templates for common scenarios to reduce cognitive load during crisis.

4. **Mitigation playbooks** — For each known failure mode (identified by Gyre), a step-by-step playbook: what to check, what to try, when to rollback, when to escalate. Playbooks reference Gyre's runbook templates but add the runtime context: "if this doesn't resolve within 15 minutes, escalate to the database team."

5. **War room protocols** — How to mobilize (who joins, which channel, what tools). How to coordinate (single thread of communication, no parallel investigations). How to stand down (explicit all-clear, immediate brief).

**Output:** Incident Response Framework (IRF) — roles, severity matrix, communication templates, playbooks, war room protocol.

### Phase 3: LEARN — Extract knowledge from failure

**Goal:** Turn every incident into durable organizational knowledge.

**Activities:**

1. **Blameless post-incident review** — Structured format: timeline, contributing factors, what went well, what could improve, action items. Facilitated within 72 hours of resolution. The facilitator's job is to ask "what made this possible?" not "who did this?"

2. **Knowledge asset creation** — Feed findings back to Forge: new Tribal Knowledge Assets (TKAs) for undocumented behaviors discovered during the incident. Updated Decision Record Assets (DRAs) for architectural decisions that proved inadequate. New or revised Business Rule Assets (BRAs) for domain rules that were wrong or incomplete.

3. **Gyre feedback loop** — Feed findings back to Gyre: if the incident revealed an observability gap, Gyre's contextual model should be updated. If the incident exposed a compliance risk, Gyre's Compliance & Security agent should be re-run. Gyre's readiness backlog gets new items from real-world failure.

4. **Action item tracking** — Every post-incident review produces action items. Track them with the same rigor as feature stories. Measure: how many action items from incidents are completed within one sprint? Two sprints? Never?

**Output:** Post-Incident Knowledge Package (PIKP) — review document, Forge knowledge assets, Gyre feedback items, tracked action items.

### Phase 4: HARDEN — Improve resilience

**Goal:** Proactively strengthen the system based on what production taught us.

**Activities:**

1. **Chaos engineering** — Proactively inject failures in controlled conditions: kill a pod, partition the network, slow a dependency, exhaust a connection pool. Verify that the system degrades gracefully and alerts fire correctly.

2. **Game days** — Full incident simulation with the actual on-call team. Practice the response process, not just the technical recovery. Debrief like a real incident.

3. **Runbook evolution** — After every incident, review and update the relevant runbook. If the runbook was wrong, fix it. If there was no runbook, write one. If the runbook was correct but the responder didn't follow it, investigate why (too complex? Not findable? Wrong context?).

4. **Resilience pattern implementation** — Based on incident patterns, implement systemic improvements: circuit breakers, retry with backoff, bulkheads, load shedding, feature flags for graceful degradation.

5. **SLO recalibration** — Based on real production data, recalibrate SLOs. If you're burning error budget too fast, either the SLO is too tight or the system needs investment. If you never touch the error budget, the SLO might be too loose — or the service is overprovisioned.

**Output:** Resilience Improvement Plan (RIP) — chaos test results, game day reports, pattern implementations, SLO recalibrations.

## 5. Sentinel agent team

| Agent | Stream | What they do |
|-------|--------|-------------|
| **Watch** ⏰ | Ready | Designs on-call rotations, establishes operational cadence, operationalizes Gyre artifacts |
| **Flint** 🔥 | Respond | Structures incident command, builds playbooks, manages communication protocols |
| **Echo** 🔍 | Learn | Facilitates post-incident reviews, creates knowledge assets, feeds Forge and Gyre |
| **Forge** 🛡️ | Harden | Runs chaos engineering, plans game days, evolves runbooks, implements resilience patterns |

*Note: Sentinel's "Forge" agent name collides with the Forge team. Rename to **Temper** in implementation.*

### Integration points

| From/To | What flows | Why |
|---------|-----------|-----|
| Gyre → Sentinel | SLOs, alerts, runbooks, dashboards, readiness backlog | Sentinel operationalizes what Gyre designed |
| Sentinel → Gyre | Incident findings, observability gaps, compliance gaps | Gyre updates its contextual model and readiness backlog |
| Sentinel → Forge | Post-incident TKAs, DRAs, BRAs | Every incident is a knowledge event |
| Sentinel → Pulse | Production health signals | Adoption analytics need real operational data |
| Sentinel → Compass | Incident narratives, resilience improvements | Stakeholder confidence requires operational transparency |
| Loom → Sentinel | Orchestration rules for automated response | Which response actions can agents take autonomously? |

### Artifact schemas

**Post-Incident Knowledge Package (PIKP)**

```yaml
asset_type: post_incident_review
asset_id: PIR-001
title: "Payment processing timeout during peak — 2026-03-15"

incident:
  severity: SEV2
  duration_minutes: 47
  impact: "12% of payment attempts failed for 47 minutes. Estimated revenue impact: €34K"
  detection: "SLO burn rate alert (Gyre-generated) fired at 14:23 CET"
  resolution: "Connection pool exhaustion in payment gateway adapter. Restarted pods + increased pool size."

timeline:
  - time: "14:23"
    event: "SLO burn rate alert fires"
  - time: "14:26"
    event: "On-call engineer acknowledges, opens war room"
  - time: "14:31"
    event: "Correlated with deployment at 14:15 — new retry logic increased connection count"
  - time: "14:38"
    event: "Pods restarted with emergency pool size increase"
  - time: "14:47"
    event: "Error rate returns to baseline"
  - time: "15:10"
    event: "All-clear declared"

contributing_factors:
  - factor: "New retry logic (deployed 14:15) multiplied connection usage by 3x"
    type: change_related
  - factor: "Connection pool size was set in 2022 for 1/10th current traffic"
    type: capacity_drift
  - factor: "No load test included the retry behavior"
    type: test_gap

what_went_well:
  - "Gyre-generated SLO alert detected the problem within 2 minutes"
  - "War room mobilization followed protocol — 3 minutes to full team"
  - "Runbook for payment gateway issues was accurate and followed"

what_could_improve:
  - "Deploy gate should have flagged connection-multiplying changes"
  - "Connection pool sizing should be part of capacity review"
  - "Load tests should exercise retry paths"

action_items:
  - id: AI-001
    description: "Add connection pool utilization to Gyre observability manifest"
    owner: "Platform team"
    target_sprint: "Sprint 14"
    feeds: gyre_contextual_model
  - id: AI-002
    description: "Create Forge TKA for connection pool sizing history"
    owner: "Echo agent"
    target_sprint: "Sprint 14"
    feeds: forge_tka
  - id: AI-003
    description: "Add retry-path load test scenario"
    owner: "QA team"
    target_sprint: "Sprint 15"
    feeds: tea_test_suite

forge_knowledge_created:
  - asset_id: TKA-027
    title: "Payment gateway connection pool was sized in 2022 for 50 concurrent users"
  - asset_id: DRA-014
    title: "Retry logic should be connection-budget-aware"

gyre_feedback:
  - type: observability_gap
    description: "Connection pool utilization not in capabilities manifest"
  - type: deployment_risk
    description: "Changes that multiply connection usage should be flagged as deployment risk"
```

---
---

# TEAM 7: LEDGER — Audit & Traceability (REDUCED SCOPE)

*Can we prove it to auditors?*

## 1. What changed from v0.1

Gyre's Compliance & Security agent now handles:
- Regulation discovery and control mapping
- Policy-as-code generation (OPA/Kyverno)
- DevSecOps baseline and supply chain security
- Compliance drift monitoring (anticipation mode)
- Security-by-design review and threat modeling

Ledger is **reduced** to the pieces Gyre doesn't cover: full-lifecycle traceability, audit evidence generation, exception management, and cross-lifecycle enforcement gates during the development phase (not just readiness gates).

## 2. The reduced Ledger problem

Gyre tells you *what compliance looks like* for your system and generates the policies. But in heavily regulated environments (banking, healthcare, public sector), there's a harder problem: proving to auditors that you followed those policies throughout the entire lifecycle — not just at the readiness gate, but at every commit, every PR, every deployment, every data access. This is the traceability and attestation challenge.

## 3. Reduced Ledger process — three phases

```
GATE ──▶ TRACE ──▶ ATTEST
Enforce   Track      Generate
during    end-to-end audit
dev       lineage    evidence
```

*Phases 1 (Map) and 2 (Encode) from v0.1 are now handled by Gyre.*

### Phase 1: GATE — Enforce during development

**Activities:**
1. **Dev-time enforcement** — Pre-commit hooks, PR review checklists, and pipeline gates that enforce Gyre's policies during the development cycle (Gyre generates policies; Ledger deploys them into the dev workflow).
2. **Exception management** — Formal process for requesting, approving, documenting, and time-bounding policy exceptions. Auditors want to see that exceptions were deliberate and governed, not accidental.
3. **Change authorization** — Ensure every production change has documented authorization, testing evidence, and rollback capability. This goes beyond Gyre's deployment readiness to include the approval chain.

### Phase 2: TRACE — Track end-to-end lineage

**Activities:**
1. **Requirement-to-code traceability** — Every story traces to requirements (from BMAD PM), every commit traces to stories, every test traces to acceptance criteria (from BMAD QA/TEA).
2. **Data lineage** — For every regulated data field, trace its origin, transformations, access controls, and retention policy. Integrates with Conduit's data mapping artifacts.
3. **Decision traceability** — Every architecture and design decision links to Forge's Decision Record Assets and Gyre's compliance findings.
4. **Deployment traceability** — Every production deployment links to its test evidence, approval chain, and Gyre readiness assessment.

### Phase 3: ATTEST — Generate audit evidence

**Activities:**
1. **Automated evidence assembly** — Compile audit-ready packages from pipeline logs, test results, deployment records, Gyre readiness reports, and Sentinel incident records.
2. **Regulation-organized packaging** — Pre-assemble evidence by regulatory framework (GDPR package, SOC 2 package, PCI-DSS package). Each package contains the specific evidence each framework requires.
3. **Compliance dashboard** — Real-time view of which policies are enforced, which have active exceptions, and which have gaps. Feeds Compass's stakeholder reporting.
4. **Continuous self-assessment** — Automated checks against Gyre's obligation findings. Flag drift between what Gyre says is required and what is actually in place.

## 4. Reduced Ledger agent team

| Agent | Stream | What they do |
|-------|--------|-------------|
| **Gate** 🚧 | Gate | Deploys Gyre policies into dev workflow, manages exceptions, ensures change authorization |
| **Trace** 🔗 | Trace | Builds end-to-end traceability from requirement to production |
| **Vera** ✓ | Attest | Assembles audit evidence, generates compliance dashboards, runs continuous self-assessment |

*3 agents instead of 5 in v0.1. Nora (Map) and Cyrus (Encode) are absorbed by Gyre.*

### Integration points

| From/To | What flows | Why |
|---------|-----------|-----|
| Gyre → Ledger | Policies-as-code, compliance findings, obligation register | Ledger enforces and traces what Gyre discovers |
| BMAD → Ledger | Code, tests, deployments, PR evidence | Ledger traces the build process |
| Conduit → Ledger | Data lineage, migration audit trails | Regulated data needs end-to-end traceability |
| Sentinel → Ledger | Incident records, response evidence | Auditors want to see incident handling was governed |
| Forge → Ledger | Decision Record Assets | Traceability requires linking decisions to their rationale |
| Ledger → Compass | Compliance posture dashboards | Stakeholders need confidence in compliance |

---
---

# Cross-Team Integration (Updated)

## The complete handoff map

```
Vortex ──scope──▶ Forge ──knowledge──▶ BMAD ──architecture──▶ Gyre
  │                 │                    │                      │
  │                 │                    │                      ├──policies──▶ Ledger
  │                 │                    │                      │
  │                 │                    │                      └──artifacts─▶ Sentinel
  │                 │                    │
  │                 ├──RCAs─────────────▶ Gyre (compliance input)
  │                 ├──TKAs─────────────▶ Gyre (operational context)
  │                 ├──glossary─────────▶ Conduit (semantic annotation)
  │                 └──BRAs────────────▶ Conduit (migration rules)
  │                                      │
  ├──personas──▶ Pulse (stakeholder groups)
  │
  └──vision───▶ Compass (business case)

Sentinel ──incident findings──▶ Forge (knowledge creation)
Sentinel ──incident findings──▶ Gyre (readiness updates)
Sentinel ──ops signals────────▶ Pulse (adoption analytics)
Pulse ────adoption metrics────▶ Compass (benefit realization)
Compass ──coalition status────▶ Pulse (resistance mapping)
Loom ─────orchestration rules─▶ All teams (meta-layer)
Conduit ──data lineage────────▶ Ledger (traceability)
```

## Updated lifecycle sequencing

```
Sprint -4 to -2:  Vortex (discovery) + Compass (coalition building)
Sprint -2 to 0:   Forge (knowledge) + Loom (orchestration) + Conduit.Profile
Sprint 0 to N:    BMAD/TEA (build) + Conduit (migration) + Ledger (gates/trace)
                   + Pulse (adoption prep, starts mid-build)
                   + Gyre anticipation mode (from first commit)
Sprint N-1:       Gyre crisis/full assessment (pre-launch readiness gate)
Sprint N:         Pulse (activation) + Sentinel.Ready (ops rhythm)
Sprint N to ∞:    Sentinel (operate/respond/learn/harden)
                   + Pulse (sustain)
                   + Compass (sustain)
                   + Forge.Warden (knowledge maintenance)
                   + Gyre anticipation mode (continuous)
                   + Ledger (continuous attestation)
```

Loom runs continuously as the meta-layer.

---

## Summary: the complete ecosystem

| Team | Agents | Phase | Key output |
|------|--------|-------|-----------|
| **Vortex** (existing) | 7 | Discover | Validated product direction |
| **Forge** (proposed) | 5 | Understand | Knowledge Assets |
| **BMAD + TEA** (existing) | 12+ | Build | Working software |
| **Gyre** (in dev) | 4 domains | Ready | Readiness artifacts, policies |
| **Pulse** (proposed) | 5 | Ship → Run | Adoption metrics & enablement |
| **Sentinel** (proposed) | 4 | Run | Incident response & learning |
| **Loom** (proposed) | 4 | Always | Orchestration rules |
| **Conduit** (proposed) | 5 | Understand → Build | Migrated data |
| **Compass** (proposed) | 4 | Always | Aligned stakeholders |
| **Ledger** (proposed) | 3 | Build → Run | Audit evidence |

**Total new agents proposed:** 30 (across 7 teams)
**Combined with existing:** Vortex (7) + Gyre (~4 domain agents) + BMAD/TEA (12+) + proposed (30) = **53+ agents**

## File structure — updated

```
your-project/
├── _knowledge/                    # Forge (KORE)
├── _adoption/                     # Pulse
├── _operations/                   # Sentinel
│   ├── sentinel.yaml
│   ├── operational-rhythm/
│   ├── incident-response/
│   │   ├── framework/
│   │   ├── playbooks/
│   │   └── post-incident-reviews/
│   ├── resilience/
│   │   ├── chaos-tests/
│   │   ├── game-days/
│   │   └── patterns/
│   └── slo-calibration/
├── _governance/                   # Ledger (reduced)
│   ├── ledger.yaml
│   ├── gate-configs/
│   ├── traceability/
│   └── audit-evidence/
├── _orchestration/                # Loom
├── _data/                         # Conduit
├── _stakeholders/                 # Compass
├── .gyre/                         # Gyre (its own convention)
│   ├── capabilities.yaml
│   ├── readiness-backlog.md
│   └── readiness-summary.md
├── _bmad/                         # BMAD
├── _bmad-output/                  # BMAD + Convoke artifacts
└── ...
```

---

## Build priority (updated recommendation)

1. **Forge** — Already specified. The knowledge foundation everything else builds on.
2. **Gyre** — Already in development. Covers operational readiness, compliance discovery, observability.
3. **Loom** — Build next. It governs how all agents (including Gyre's) interact with humans. Essential meta-layer.
4. **Pulse** — Build after Loom. Highest failure point for brownfield at big corps. Adoption is where projects die.
5. **Sentinel** — Build when Gyre is production-ready. Sentinel operationalizes Gyre's outputs.
6. **Compass** — Build when working with new corporate clients. The political navigation layer.
7. **Conduit** — Build when a brownfield project involves significant data migration.
8. **Ledger** — Build for regulated industries. Depends on Gyre being in place (Ledger enforces what Gyre discovers).

---

## Open questions

1. **Gyre ↔ Sentinel boundary:** Is the handoff clean enough? Should Sentinel's "Ready" phase (operationalizing Gyre artifacts) be a Gyre phase instead?

2. **Ledger scope viability:** Is 3-agent Ledger enough to justify a standalone team, or should Gate/Trace/Vera be absorbed as a BMAD module?

3. **Cross-team Compass routing:** Should all teams adopt Vortex's pattern of ending each workflow with a routing suggestion to the next-best agent?

4. **Agent naming:** Several collision risks remain: Sentinel's "Forge" (→ Temper), Conduit's "Flux" (→ check Loom doesn't also use it). Final names need a deconfliction pass.

5. **Gyre's future agents vs. separate teams:** Gyre plans Capacity & FinOps as a v3 agent. Should that remain in Gyre, or does capacity planning belong in Sentinel (operational concern) or a separate team?

6. **Convoke installer integration:** How do users install individual teams? `npm install convoke-agents` + `npx convoke-install-forge`? Or a single installer with team selection?
