# KORE — Knowledge-Oriented Reverse Elicitation

## A method for detecting, extracting, and codifying domain knowledge in brownfield projects

**Version:** 0.1.0-draft  
**Author:** Proposed by Claude (Anthropic) for review and adaptation  
**Designed for:** BMAD Method + Convoke Agents ecosystem  
**License:** To be determined by the adopter

---

## 1. The problem KORE solves

In brownfield projects at large organizations, the dominant risk is not technical — it is epistemic. The system you're modifying or replacing encodes decades of decisions: business rules that evolved through regulatory pressure, workarounds that became policy, tribal knowledge that exists only in the heads of people who may have already left. Traditional SDLC methods assume this knowledge is either already documented or can be gathered through a requirements phase. Neither assumption holds in practice.

**The gap in the current toolchain:**

- **Convoke/Vortex** answers: *"Should we build this?"* — product discovery, validation, evidence-based decisions.
- **BMAD Method** answers: *"How do we build it?"* — PM, architecture, dev, QA, deployment.
- **Neither answers:** *"What do we need to know — that nobody has written down — before we can safely touch this system?"*

KORE fills this gap. It provides a structured method to:

1. **Detect** what domain knowledge is needed (and what's missing)
2. **Extract** that knowledge from code, people, processes, and artifacts
3. **Codify** it into machine-readable, version-controlled knowledge assets
4. **Validate** the codified knowledge against reality
5. **Maintain** it as a living asset throughout the project lifecycle

---

## 2. Core principles

### 2.1 Knowledge is inventory, not documentation

Documentation is prose someone wrote. Knowledge inventory is a structured, queryable, testable map of what the system *knows* — explicitly or implicitly. KORE treats domain knowledge like code: it has a schema, it can be versioned, it can be validated, it can have tests.

### 2.2 Absence is signal

The most dangerous knowledge is the knowledge you don't know you're missing. KORE's detection phase is specifically designed to surface *gaps* — not just catalog what's known. A knowledge gap map is as valuable as a knowledge asset.

### 2.3 Two questions, not one

Borrowing from service design practice: for every piece of domain knowledge you extract, ask two questions — not just "what does the system do?" but also "should it keep doing this?" Knowledge extraction without this challenge produces a perfect replica of dysfunction.

### 2.4 Tacit before explicit

Most critical domain knowledge in brownfield contexts is tacit — held by individuals, embedded in practices, encoded in workarounds. KORE prioritizes tacit knowledge extraction techniques (shadowing, contextual inquiry, code archaeology) over document review.

### 2.5 Knowledge decays

Domain knowledge has a half-life. Regulatory contexts change. Business rules evolve. People leave. KORE builds decay-awareness into every knowledge asset with expiry signals and freshness indicators.

---

## 3. The KORE process — five phases

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   SURVEY     │───▶│   EXCAVATE   │───▶│   CODIFY     │───▶│   VALIDATE   │───▶│   STEWARD    │
│  Detect gaps │    │  Extract     │    │  Formalize   │    │  Verify      │    │  Maintain    │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
       │                  │                  │                  │                  │
       ▼                  ▼                  ▼                  ▼                  ▼
  Knowledge Gap      Raw Knowledge      Knowledge          Verified           Living
  Map (KGM)          Fragments (RKF)    Assets (KA)        Assets (VKA)       Knowledge Base
```

### Phase 1: SURVEY — Detect what knowledge is needed

**Goal:** Produce a Knowledge Gap Map (KGM) that tells you what you don't know.

**Inputs:**
- Project scope (from Vortex/BMAD product brief or PRD)
- Access to existing system artifacts (code, docs, tickets, configs)
- Stakeholder list

**Activities:**

1. **Domain boundary mapping** — Define the knowledge domains relevant to the project. Not just "the system" but the business context around it: regulatory environment, organizational processes, upstream/downstream dependencies, user workflows.

2. **Source inventory** — Catalog every potential knowledge source:
   - *Code sources:* application code, configuration files, database schemas, migration scripts, test suites, comments, commit history
   - *Document sources:* wikis, Confluence pages, runbooks, architecture decision records, incident reports, change requests
   - *Human sources:* current developers, former developers, business analysts, operations staff, end users, compliance officers
   - *Process sources:* CI/CD pipelines, deployment procedures, monitoring alerts, SLA definitions
   - *Artifact sources:* Jira/ticket history, email threads, Slack archives, meeting recordings

3. **Coverage scoring** — For each knowledge domain, assess coverage across the KORE Knowledge Taxonomy (see Section 4). Score each cell: 0 = no source identified, 1 = source exists but unverified, 2 = source exists and verified, 3 = codified and tested.

4. **Gap prioritization** — Rank gaps by risk: what could go wrong if we proceed without this knowledge? Use a simple impact × likelihood matrix. High-risk gaps become excavation targets.

**Output:** Knowledge Gap Map (KGM) — a structured document listing every identified knowledge domain, its coverage score, its sources, and its risk priority.

### Phase 2: EXCAVATE — Extract knowledge from sources

**Goal:** Produce Raw Knowledge Fragments (RKF) from each prioritized gap.

**Activities by source type:**

**From code (Code Archaeology):**
- Business rule extraction: identify conditionals, validations, calculations that encode domain logic. Look for magic numbers, hardcoded thresholds, special-case handling.
- Schema archaeology: trace database schema evolution through migrations. What was added, removed, renamed? What constraints were added or relaxed?
- Comment mining: extract TODO, HACK, FIXME, WORKAROUND comments. These are often the most honest documentation.
- Test archaeology: existing tests reveal expected behaviors and edge cases that may not be documented elsewhere.
- Dead code analysis: code that's commented out or unreachable often reveals abandoned business rules or deprecated features.

**From people (Contextual Elicitation):**
- Structured interviews with a specific format: "Tell me about a time when [the system] surprised you" — this surfaces edge cases and undocumented behaviors.
- "Walk me through your Tuesday" sessions: observe the actual workflow, not the documented one.
- "What would break if..." scenarios: hypothetical failure modes that force experts to articulate tacit knowledge.
- Departure interviews: when SMEs are leaving (or have left), reconstruct their knowledge through colleagues who worked with them.

**From processes (Process Tracing):**
- Shadow the deployment process end-to-end. Document every manual step, every check, every "we always do this because..."
- Trace an incident from detection to resolution. What knowledge was required at each step?
- Map the actual data flow (not the documented one) by following a transaction through the system.

**From documents (Document Reconciliation):**
- Compare documented behavior to actual behavior. Discrepancies are knowledge.
- Identify documents that contradict each other — the contradiction itself is valuable signal.
- Date-stamp everything: when was this last verified? By whom?

**Output:** Raw Knowledge Fragments — structured notes in a consistent format (see Section 5 for the RKF schema).

### Phase 3: CODIFY — Turn fragments into knowledge assets

**Goal:** Transform raw fragments into formal, machine-readable, version-controlled Knowledge Assets (KA).

This is the "knowledge as code" phase. Each knowledge asset follows a strict schema and lives in the project repository alongside the code it describes.

**Knowledge Asset types (see Section 6 for full schemas):**

1. **Business Rule Asset (BRA)** — A single, testable business rule with its rationale, source, conditions, exceptions, and expiry signal.

2. **Domain Glossary Asset (DGA)** — Definitions of terms as understood in this specific context. Not generic definitions — the meaning as used by this organization, this team, this system.

3. **Decision Record Asset (DRA)** — Why a particular choice was made. Extends Architecture Decision Records (ADRs) to cover business decisions, process decisions, and organizational constraints.

4. **Context Map Asset (CMA)** — Relationships between bounded contexts, teams, and systems. Who owns what? Where are the integration points? What are the translation layers?

5. **Regulatory Constraint Asset (RCA)** — Specific regulations, compliance requirements, and their interpretation as applied to this system.

6. **Tribal Knowledge Asset (TKA)** — Undocumented practices, workarounds, and institutional memory. Explicitly tagged as "previously tacit" with the source person and extraction date.

7. **Knowledge Dependency Asset (KDA)** — Maps which knowledge assets depend on which others. If a regulatory constraint changes, which business rules are affected?

**Codification rules:**
- Every asset has a unique ID, a human-readable title, and a machine-parseable body.
- Every asset declares its sources (who/what it came from) and its confidence level.
- Every asset has a freshness indicator: when was it last verified, and what event would trigger re-verification.
- Assets are stored as YAML or Markdown with YAML frontmatter in a `_knowledge/` directory within the project.
- Assets reference each other by ID, creating a knowledge graph.

**Output:** Knowledge Assets in the `_knowledge/` directory, organized by type.

### Phase 4: VALIDATE — Verify knowledge against reality

**Goal:** Promote Knowledge Assets from "codified" to "verified" status.

**Validation methods:**

1. **Expert review** — Present codified assets back to domain experts for confirmation. "We understood that the system does X because of Y — is this accurate?"

2. **Code-to-knowledge tracing** — For every Business Rule Asset, identify the code that implements it. Can you point to the specific lines? If not, either the rule or the code is wrong.

3. **Knowledge tests** — Write automated tests that verify business rules against the running system. These are not unit tests of code — they are tests of *domain truth*. "Given this input configuration, the system should calculate the tax rate as 7.5% because of Regulatory Constraint RCA-003."

4. **Contradiction detection** — Run the full knowledge base through consistency checks. Do any assets contradict each other? Contradictions are not errors to fix silently — they are discoveries to investigate.

5. **Stakeholder walkthrough** — Present the knowledge map to stakeholders who weren't part of the excavation. Fresh eyes catch assumptions.

**Output:** Verified Knowledge Assets (VKA) — each asset now carries a validation stamp with the method, date, and validator.

### Phase 5: STEWARD — Maintain knowledge as a living asset

**Goal:** Keep the knowledge base accurate and useful throughout the project and beyond.

**Stewardship activities:**

1. **Knowledge ownership** — Every asset has a designated steward (a person or role) responsible for its accuracy. Stewardship is an explicit responsibility, not an assumption.

2. **Decay monitoring** — Track freshness signals. When a regulatory change occurs, flag all dependent RCAs and BRAs. When a key SME leaves, flag all TKAs sourced from them.

3. **Change coupling** — Integrate knowledge asset updates into the development workflow. When code changes affect a business rule, the corresponding BRA must be reviewed. CI/CD pipelines can enforce this through pre-commit hooks or PR checks.

4. **Knowledge retrospectives** — At each sprint retrospective or iteration boundary, ask: "What did we learn this sprint that isn't in the knowledge base? What in the knowledge base turned out to be wrong?"

5. **Onboarding integration** — Use the knowledge base as the primary onboarding resource for new team members. Their questions and confusions become new gap detections, feeding back into the SURVEY phase.

---

## 4. KORE Knowledge Taxonomy

Knowledge is categorized along two axes:

### Axis 1: Knowledge domain

| Domain | Description | Examples |
|--------|-------------|----------|
| **Business logic** | Rules that govern how the system processes data | Pricing calculations, eligibility checks, approval workflows |
| **Regulatory** | External rules the system must comply with | GDPR data retention, financial reporting standards, accessibility |
| **Organizational** | How the company works around/with the system | Approval hierarchies, exception handling processes, escalation paths |
| **Technical context** | Technical decisions and constraints | Why this database? Why this architecture? What are the known limitations? |
| **User context** | How users actually interact with the system | Workarounds users have developed, features they rely on vs. ignore |
| **Operational** | How the system is run in production | Deployment procedures, monitoring practices, incident response |
| **Historical** | Why things are the way they are | Past incidents, previous architectures, abandoned features |

### Axis 2: Knowledge state

| State | Description | Coverage score |
|-------|-------------|---------------|
| **Unknown-unknown** | We don't know we don't know this | 0 (gap undetected) |
| **Known-unknown** | We know we need this but don't have it | 0 (gap detected) |
| **Sourced** | A source exists but content is unverified | 1 |
| **Extracted** | Raw knowledge fragment captured | 1.5 |
| **Codified** | Formal knowledge asset created | 2 |
| **Verified** | Asset validated against reality | 3 |
| **Stale** | Asset has exceeded its freshness window | -1 (decay) |

---

## 5. Raw Knowledge Fragment (RKF) schema

```yaml
rkf_id: RKF-001
title: "Late payment fee calculation includes a 3-day grace period"
domain: business_logic
source_type: code  # code | person | document | process
source_ref: "payments/fee_calculator.py:L142-L158"
source_person: null  # or name of the SME
extraction_date: 2026-03-21
extractor: "Agent: Silo"  # or human name
confidence: medium  # low | medium | high
raw_content: |
  The fee calculator checks if payment_date > due_date + 3 days before
  applying the late fee. The comment says "grace period per 2019 policy
  change" but no link to the policy document. The 3-day value is hardcoded
  as GRACE_PERIOD_DAYS = 3 in constants.py.
open_questions:
  - "Where is the 2019 policy document?"
  - "Does the grace period apply to all payment types or just recurring?"
  - "Is 3 calendar days or 3 business days?"
contradicts: null  # or reference to contradicting RKF
related_to:
  - RKF-003  # payment types classification
```

---

## 6. Knowledge Asset schemas

### 6.1 Business Rule Asset (BRA)

```yaml
asset_type: business_rule
asset_id: BRA-001
title: "Late payment grace period"
status: verified  # draft | codified | verified | stale
domain: business_logic

rule:
  when: "A payment is received after the due date"
  given: "The payment is for a recurring subscription"
  then: "Apply the late fee only if payment_date > due_date + 3 calendar days"
  exceptions:
    - "Enterprise accounts (tier >= 3) have a 7-day grace period per BRA-012"
    - "First payment after account creation has no grace period per BRA-015"

rationale: |
  Introduced in Q2 2019 to reduce customer complaints about fees triggered
  by bank processing delays. The 3-day window was calibrated to typical
  ACH clearing times.

source_chain:
  - type: code
    ref: "payments/fee_calculator.py:L142-L158"
    verified_date: 2026-03-21
  - type: person
    ref: "Marie Dupont, Billing Team Lead"
    verified_date: 2026-03-20
  - type: document
    ref: "Confluence: Billing Policy v3.2 (2019-06-15)"
    verified_date: 2026-03-20

confidence: high
freshness:
  last_verified: 2026-03-21
  next_review: 2026-09-21
  decay_triggers:
    - "Change to payment processing provider"
    - "Regulatory update to consumer payment protection"
    - "Departure of Marie Dupont"
steward: "Billing domain team"
dependencies:
  - BRA-012  # Enterprise grace period
  - RCA-002  # Consumer payment protection regulation
  - BRA-015  # First payment exception
tags: [payments, fees, grace-period, billing]
```

### 6.2 Tribal Knowledge Asset (TKA)

```yaml
asset_type: tribal_knowledge
asset_id: TKA-001
title: "Monthly batch job must complete before 6 AM CET"
status: codified
domain: operational

knowledge: |
  The nightly reconciliation batch job (cron: reconcile_daily) must finish
  before 6:00 AM CET because the downstream treasury system pulls a
  snapshot at 6:05 AM. If the reconciliation is still running, treasury
  gets stale data and the finance team spends 2-3 hours correcting it
  manually. There is no retry mechanism — the treasury pull is fire-and-forget.

origin: |
  Discovered during SME interview with Jean-Marc Lefèvre (Ops Lead).
  He said: "Everyone who's been here more than two years knows this,
  but it's not written anywhere. We lost it once when the new DevOps
  person changed the cron schedule."

source_chain:
  - type: person
    ref: "Jean-Marc Lefèvre, Operations Lead, 12 years tenure"
    extraction_date: 2026-03-18
  - type: process
    ref: "Observed during deployment shadow session 2026-03-19"

risk_if_lost: high
confidence: high
codification_notes: |
  Previously tacit. Now codified with recommendation to:
  1. Add a hard deadline assertion to the batch job
  2. Add monitoring alert if job not complete by 5:45 AM
  3. Document the treasury system dependency in the architecture docs

freshness:
  last_verified: 2026-03-19
  decay_triggers:
    - "Departure of Jean-Marc Lefèvre"
    - "Change to treasury system integration"
    - "Change to batch job scheduling"
steward: "Operations domain team"
dependencies:
  - CMA-003  # Treasury system context map
```

### 6.3 Decision Record Asset (DRA)

```yaml
asset_type: decision_record
asset_id: DRA-001
title: "Use synchronous API calls for payment validation"
status: verified
domain: technical_context

decision: "Payment validation calls are synchronous (blocking)"
context: |
  In 2017, the team considered both async (event-driven) and sync
  approaches for payment validation. Sync was chosen because the
  payment gateway at the time (BankConnect v2) had a 200ms SLA
  and the regulatory requirement demanded immediate user feedback
  on payment status.

consequences:
  positive:
    - "Simple error handling — failure is immediate and visible"
    - "Regulatory compliance for real-time payment confirmation"
  negative:
    - "Thread pool exhaustion under high load (see incident INC-2023-0847)"
    - "Cannot scale beyond ~500 concurrent payment validations"

still_valid: partial
validity_notes: |
  The regulatory requirement for immediate feedback is still valid.
  However, BankConnect was replaced by PayFlow in 2022, which has
  a different SLA profile (50ms p50, but 2s p99). The original
  rationale has shifted. Worth re-evaluating in the architecture phase.

source_chain:
  - type: document
    ref: "ADR-017 in legacy architecture docs (2017-03-12)"
  - type: person
    ref: "Sophie Martin, original architect (departed 2021)"
    note: "Reconstructed from colleague accounts"

freshness:
  last_verified: 2026-03-21
  decay_triggers:
    - "Payment gateway migration"
    - "Change to real-time feedback regulation"
steward: "Architecture team"
```

---

## 7. Agent team proposal (Convoke-style)

KORE is designed to be implementable as a Convoke agent team — following the same patterns as Vortex. Here is the proposed team:

### Team name: **Forge** (Knowledge Forging Team)

*"Forge raw knowledge into durable assets"*

| Agent | Stream | What they do |
|-------|--------|-------------|
| **Silo** 🗺️ | Survey | Map knowledge boundaries, inventory sources, score coverage, produce the Knowledge Gap Map |
| **Rune** ⛏️ | Excavate | Extract knowledge from code, people, processes, and documents. Produce Raw Knowledge Fragments |
| **Aria** 📐 | Codify | Transform raw fragments into formal Knowledge Assets following the KORE schemas |
| **Sage** ✓ | Validate | Verify assets against reality — expert review, code tracing, contradiction detection, knowledge tests |
| **Warden** 🛡️ | Steward | Assign ownership, monitor decay, enforce change coupling, run knowledge retrospectives |

### Agent flow

```
    ┌───────────┐        ┌───────────┐        ┌───────────┐
    │  Silo 🗺️   │──KGM──▶│  Rune ⛏️   │──RKF──▶│  Aria 📐   │
    │  Survey    │        │  Excavate  │        │  Codify    │
    └───────────┘        └───────────┘        └───────────┘
          ▲                                          │
          │                                         KA
          │                                          │
          │                                          ▼
    ┌───────────┐                             ┌───────────┐
    │ Warden 🛡️  │◀─────────VKA──────────────│  Sage ✓    │
    │  Steward   │                             │  Validate  │
    └───────────┘                             └───────────┘
          │
          │ decay signals / gaps detected
          ▼
     back to Silo
```

### Integration points

**With Vortex (upstream):**
- Vortex's Emma (Contextualize) produces the product vision and scope → Silo uses this to define knowledge domain boundaries
- Vortex's Isla (Empathize) produces user research → Rune uses this as a knowledge source for user context domain
- Vortex's Max (Systematize) produces pivot/persevere decisions → Warden updates knowledge freshness based on scope changes

**With BMAD (downstream):**
- Forge's verified knowledge assets feed directly into BMAD's PM agent (John) as structured requirements input
- Forge's Business Rule Assets become acceptance criteria for BMAD's stories
- Forge's Decision Record Assets feed BMAD's Architect agent (Winston) as architectural constraints
- Forge's knowledge tests integrate with BMAD's QA agent (Quinn) and TEA module

---

## 8. Knowledge-as-Code: the file structure

```
your-project/
├── _knowledge/                          # KORE knowledge base root
│   ├── kore.yaml                        # Configuration and metadata
│   ├── gap-map/                         # Knowledge Gap Maps (Phase 1)
│   │   ├── KGM-001-billing-domain.yaml
│   │   └── KGM-002-treasury-integration.yaml
│   ├── fragments/                       # Raw Knowledge Fragments (Phase 2)
│   │   ├── RKF-001-grace-period.yaml
│   │   └── RKF-002-batch-deadline.yaml
│   ├── assets/                          # Knowledge Assets (Phase 3-4)
│   │   ├── business-rules/
│   │   │   ├── BRA-001-grace-period.yaml
│   │   │   └── BRA-002-enterprise-pricing.yaml
│   │   ├── tribal/
│   │   │   └── TKA-001-batch-deadline.yaml
│   │   ├── decisions/
│   │   │   └── DRA-001-sync-payments.yaml
│   │   ├── glossary/
│   │   │   └── DGA-001-billing-terms.yaml
│   │   ├── context-maps/
│   │   │   └── CMA-001-payment-ecosystem.yaml
│   │   ├── regulatory/
│   │   │   └── RCA-001-gdpr-retention.yaml
│   │   └── dependencies/
│   │       └── KDA-001-billing-dependency-map.yaml
│   ├── tests/                           # Knowledge tests (Phase 4)
│   │   ├── test_business_rules.py
│   │   └── test_regulatory_constraints.py
│   └── stewardship/                     # Stewardship metadata (Phase 5)
│       ├── ownership-map.yaml
│       └── decay-log.yaml
├── _bmad/                               # BMAD configuration
├── _bmad-output/                        # BMAD artifacts
│   └── kore-artifacts/                  # KORE-specific outputs
└── ...
```

### The kore.yaml configuration

```yaml
kore:
  version: "0.1.0"
  project: "Project Name"
  
  domains:
    - id: business_logic
      label: "Business Logic"
      steward: "Product team"
    - id: regulatory
      label: "Regulatory & Compliance"
      steward: "Legal/Compliance team"
    - id: organizational
      label: "Organizational Context"
      steward: "Project lead"
    - id: technical_context
      label: "Technical Context"
      steward: "Architecture team"
    - id: user_context
      label: "User Context"
      steward: "UX/Research team"
    - id: operational
      label: "Operational Knowledge"
      steward: "Operations team"
    - id: historical
      label: "Historical Context"
      steward: "Project lead"

  freshness:
    default_review_interval_days: 180
    stale_threshold_days: 365

  integration:
    bmad_output_dir: "_bmad-output/kore-artifacts"
    knowledge_test_dir: "_knowledge/tests"
```

---

## 9. Getting started: the first 90 minutes

For teams wanting to pilot KORE on an existing brownfield project:

**Minutes 0-15: Activate Silo, define scope**
- Define the project boundary: what part of the system are you touching?
- List the 3-5 most critical knowledge domains for your scope

**Minutes 15-45: Quick source inventory**
- For each domain, list every source you can think of in 5 minutes
- Score each: do you have access? Has anyone reviewed it recently?
- Identify the top 3 gaps (highest risk, lowest coverage)

**Minutes 45-75: First excavation**
- Pick the single highest-risk gap
- Spend 30 minutes extracting knowledge from the most accessible source
- Write 2-3 Raw Knowledge Fragments using the RKF schema
- Note every open question — these become the next excavation targets

**Minutes 75-90: First codification**
- Take your strongest RKF and promote it to a Knowledge Asset
- Write it in the appropriate schema (BRA, TKA, DRA, etc.)
- Commit it to the repository
- You now have your first piece of "knowledge as code"

---

## 10. How KORE relates to existing practices

| Existing practice | KORE relationship |
|-------------------|-------------------|
| Architecture Decision Records (ADRs) | KORE's DRA extends ADRs to cover business and organizational decisions, not just technical ones |
| Domain-Driven Design (DDD) | KORE's Context Map Assets align with DDD bounded contexts; KORE's glossary aligns with the ubiquitous language |
| Knowledge Discovery Metamodel (KDM, OMG) | KORE is lighter-weight and human-focused where KDM is tool-focused and formal |
| Reverse engineering / code archaeology | KORE includes this as one extraction technique among many — it adds the human and process dimensions |
| TOGAF knowledge management | KORE is tactical and project-scoped where TOGAF is strategic and enterprise-scoped |
| Wardley Mapping | Complementary — Wardley Maps can inform KORE's domain boundary mapping in the Survey phase |

---

## 11. Open questions for development

This is a draft method. Key decisions for the adopter:

1. **Agent implementation:** Should the Forge agents be built as Convoke-style markdown persona files, or as a standalone BMAD module?
2. **Tooling:** Should KORE include scripts for automated code archaeology (AST parsing, comment extraction, schema diffing)?
3. **Scale:** How does KORE adapt for very large brownfield systems (millions of LOC, hundreds of stakeholders)?
4. **AI assistance:** Can LLMs assist in the Excavate phase by analyzing code and suggesting business rules? What are the confidence implications?
5. **Metrics:** How do you measure the ROI of knowledge management? Reduced incidents? Faster onboarding? Fewer "surprise" requirements?

---

## 12. Summary

KORE provides the missing link between "should we build this?" (Vortex) and "how do we build it?" (BMAD). It treats domain knowledge as a first-class engineering artifact — discoverable, extractable, codifiable, testable, and maintainable.

For brownfield projects at large organizations, this is not optional — it is the difference between a modernization that succeeds and one that faithfully reproduces the dysfunctions of the past.

*Forge raw knowledge into durable assets.*
