# Forge↔Gyre Handoff Contracts — Design Specification

**Version:** 1.0.0-draft
**Date:** 2026-03-21
**Status:** Design — pending Forge implementation
**Pattern:** Follows Vortex HC (Handoff Contract) conventions

---

## Overview

Forge and Gyre are the two validated scopes adjacent to each other in the Convoke lifecycle. Their integration is the highest-value cross-team connection in the ecosystem.

```
Forge (UNDERSTAND)                    Gyre (READY)
┌───────────────────┐                ┌───────────────────┐
│ Silo → Rune →     │   FG-HC1      │ Detection →       │
│ Aria → Sage →     │──────────────▶│ Model Gen →       │
│ Warden            │   FG-HC2      │ Domain Analysis → │
│                   │──────────────▶│ Cross-domain      │
│                   │               │                   │
│                   │   GF-HC1      │                   │
│                   │◀──────────────│                   │
└───────────────────┘                └───────────────────┘
```

**Three contracts:**
- **FG-HC1:** Tribal Knowledge Assets → Gyre Contextual Model (Forge produces, Gyre consumes)
- **FG-HC2:** Regulatory Constraint Assets → Gyre Compliance Agent (Forge produces, Gyre consumes)
- **GF-HC1:** Knowledge Gap Findings → Forge Excavation Queue (Gyre produces, Forge consumes)

---

## FG-HC1: Tribal Knowledge Assets → Gyre Contextual Model

> **Contract:** FG-HC1 | **Type:** Artifact | **Flow:** Forge (Rune/Aria) → Gyre (Detection + Model Generation)
>
> Tribal Knowledge Assets (TKAs) contain undocumented operational knowledge that Gyre's automated detection cannot discover from code alone. These assets enrich Gyre's contextual model with human knowledge that affects readiness assessment.

### Why this contract matters

Gyre detects technology stacks from file artifacts (package.json, Dockerfiles, IaC templates). But operational readiness depends on knowledge that isn't in code:

- "The batch job must complete by 6 AM or the trading desk can't open" → becomes an SLO input
- "We never deploy on Fridays because the overnight settlement process runs" → becomes a deployment constraint
- "The legacy API has an undocumented rate limit of 100 req/s" → becomes a capacity input
- "The DBA manually runs VACUUM every Sunday at 3 AM" → becomes an operational dependency

Without Forge's TKAs, Gyre's model is limited to what's statically analyzable. With them, Gyre can assess readiness against what the system *actually needs*, not just what the code *visibly does*.

### Frontmatter Schema

```yaml
---
contract: FG-HC1
type: artifact
source_agent: rune | aria           # Rune excavates, Aria codifies
source_workflow: knowledge-excavation | knowledge-codification
target_agents: [gyre-detection, gyre-model-gen]
input_artifacts:
  - path: "_knowledge/tka/[tka-id].md"
    contract: null                  # KORE-internal artifact
created: YYYY-MM-DD
gyre_relevance:                     # routing metadata for Gyre consumption
  domain: observability | deployment | compliance | capacity
  impacts: [slo, constraint, dependency, capacity]
---
```

### Gyre-Relevant TKA Categories

| Category | Examples | Gyre domain | How Gyre uses it |
|----------|---------|-------------|-----------------|
| **Operational constraints** | "No deploys during trading hours" | Deployment | Deployment window constraints |
| **SLO-informing knowledge** | "Batch must finish by 6 AM" | Observability | SLO threshold inputs |
| **Undocumented dependencies** | "Service X calls Service Y via internal DNS" | Detection | Dependency graph enrichment |
| **Capacity tribal knowledge** | "Legacy API rate-limited at 100 req/s" | Capacity | Capacity ceiling inputs |
| **Compliance context** | "PII in table X, retention mandated by GDPR" | Compliance | Regulation-to-asset mapping |
| **Operational rituals** | "DBA runs VACUUM manually on Sundays" | Deployment | Automation gap detection |

### Body Structure (TKA sections relevant to Gyre)

Forge TKAs follow the KORE schema. For Gyre consumption, the following sections are required:

```markdown
## Operational Impact *(required for FG-HC1)*

| Field | Required | Description |
|-------|----------|-------------|
| System affected | Yes | Which system/service this knowledge applies to |
| Impact type | Yes | slo | constraint | dependency | capacity | compliance |
| Criticality | Yes | blocking | important | informational |
| Verification | Yes | How Gyre can verify this knowledge (e.g., "check crontab", "query API") |

## Context *(required)*

Plain-language description of the knowledge, who holds it, and how it was excavated.
Include: source person/team, excavation date, confidence level.

## Gyre Routing *(auto-generated)*

Which Gyre domain agent should consume this TKA and what action it implies.
```

### Delivery mechanism

**MVP:** Forge writes TKAs to `_knowledge/tka/` with the `gyre_relevance` frontmatter field. When Gyre runs, it scans `_knowledge/tka/*.md` for artifacts with `contract: FG-HC1` and ingests them into the contextual model before generating capabilities.

**Future:** Forge produces a `_knowledge/tka/gyre-feed.yaml` index file listing all Gyre-relevant TKAs with routing metadata, so Gyre doesn't need to scan all files.

---

## FG-HC2: Regulatory Constraint Assets → Gyre Compliance Agent

> **Contract:** FG-HC2 | **Type:** Artifact | **Flow:** Forge (Aria/Sage) → Gyre (Compliance & Security Agent)
>
> Regulatory Constraint Assets (RCAs) contain compliance obligations that Forge discovered through domain knowledge extraction — regulations, internal policies, and contractual obligations that Gyre's Compliance & Security agent must evaluate against.

### Why this contract matters

Gyre's Compliance & Security agent can discover common regulatory frameworks (GDPR, SOC 2, PCI-DSS) through web search and project context. But organization-specific compliance obligations — internal policies, client contractual requirements, industry-specific regulations — exist only in people's heads or in scattered policy documents.

Forge's RCAs provide these organization-specific obligations so Gyre can assess compliance against what's *actually required*, not just industry defaults.

### Frontmatter Schema

```yaml
---
contract: FG-HC2
type: artifact
source_agent: aria | sage           # Aria codifies, Sage validates
source_workflow: knowledge-codification | knowledge-validation
target_agents: [gyre-compliance]
input_artifacts:
  - path: "_knowledge/rca/[rca-id].md"
    contract: null                  # KORE-internal artifact
created: YYYY-MM-DD
regulation:
  framework: GDPR | SOC2 | PCI-DSS | HIPAA | internal | contractual | other
  jurisdiction: EU | US | UK | global | client-specific
  enforcement: mandatory | recommended | contractual
---
```

### Body Structure (RCA sections relevant to Gyre)

```markdown
## Obligation Summary *(required for FG-HC2)*

| Field | Required | Description |
|-------|----------|-------------|
| Regulation/Policy | Yes | Name and reference of the regulation or policy |
| Obligation | Yes | Specific obligation in plain language |
| Systems in scope | Yes | Which systems/services this obligation applies to |
| Evidence required | Yes | What evidence auditors/assessors expect |
| Current status | Yes | known-compliant | unknown | known-gap |

## Technical Controls *(if known)*

Any known technical controls already in place or explicitly required.
Gyre's Compliance agent compares these against what it discovers in the codebase.
```

### Delivery mechanism

Same as FG-HC1: Forge writes RCAs to `_knowledge/rca/` with `contract: FG-HC2` frontmatter. Gyre's Compliance agent scans on run.

---

## GF-HC1: Knowledge Gap Findings → Forge Excavation Queue

> **Contract:** GF-HC1 | **Type:** Finding | **Flow:** Gyre (any domain agent) → Forge (Silo/Rune)
>
> When Gyre discovers something it can't assess due to missing knowledge, it produces a Knowledge Gap Finding that routes back to Forge for targeted excavation.

### Why this contract matters

Gyre's analysis regularly hits walls: "I found a cron job but I don't know its SLA." "I see a database connection but I don't know the retention policy." "I detect PII processing but I don't know which regulation applies."

These are **targeted excavation requests** — Forge doesn't need to boil the ocean. Gyre tells Forge exactly what it needs to know, and Forge's Silo and Rune agents can pursue those specific questions with the client's knowledge holders.

This is the feedback loop that makes the Forge→Gyre integration compound over time.

### Frontmatter Schema

```yaml
---
contract: GF-HC1
type: finding
source_agent: gyre-observability | gyre-deployment | gyre-compliance
source_workflow: domain-analysis
target_agents: [silo, rune]
created: YYYY-MM-DD
gap:
  domain: observability | deployment | compliance | capacity
  severity: blocking | recommended | informational
  question: "Plain-language question Gyre needs answered"
  context: "What Gyre already knows and what's missing"
---
```

### Body Structure

```markdown
## Knowledge Gap

### What Gyre found
[Description of the artifact/pattern Gyre detected]

### What Gyre needs to know
[Specific question that, if answered, would allow Gyre to complete its assessment]

### Suggested excavation approach
[Who to ask, what to look for, where the answer might live]

### Impact on readiness assessment
[What Gyre can't assess without this knowledge — which findings are blocked]
```

### Delivery mechanism

**MVP:** Gyre writes gap findings to `.gyre/knowledge-gaps/` with `contract: GF-HC1` frontmatter. The Gyre CLI summary includes a "Knowledge gaps for Forge" section listing open questions.

**Future:** Gyre produces a prioritized excavation queue in `.gyre/forge-queue.yaml` that Forge's Silo agent can directly consume.

---

## Integration lifecycle

```
Engagement start
│
├─ Forge Phase A runs (Silo + Rune)
│   └─ Produces TKAs and RCAs → FG-HC1, FG-HC2
│
├─ Gyre first run
│   ├─ Detects stack from code artifacts
│   ├─ Ingests Forge TKAs → enriches contextual model
│   ├─ Ingests Forge RCAs → enriches compliance scope
│   ├─ Generates capabilities manifest (richer due to Forge input)
│   ├─ Runs domain analysis
│   └─ Produces knowledge gap findings → GF-HC1
│
├─ Forge targeted excavation (Rune responds to GF-HC1 gaps)
│   └─ Produces new/updated TKAs → FG-HC1
│
├─ Gyre re-run (anticipation mode)
│   ├─ Ingests updated TKAs
│   ├─ Resolves previously blocked findings
│   └─ Produces fewer/no knowledge gaps
│
└─ Cycle continues until readiness gate is satisfied
```

**The compounding effect:** Each Forge→Gyre→Forge cycle narrows the knowledge gap. By the third cycle, Gyre has a contextual model that reflects both what the code says and what the organization knows.

---

## Compatibility notes

- Contract IDs use `FG-` (Forge→Gyre) and `GF-` (Gyre→Forge) prefix to distinguish from Vortex `HC-` contracts
- Frontmatter follows the same pattern as Vortex HC contracts (contract, type, source_agent, target_agents, input_artifacts, created)
- Artifacts are markdown files with YAML frontmatter — same format as all Convoke artifacts
- These contracts are designed for Forge Phase A (Silo + Rune). Phase B (Aria) and Phase C (Sage, Warden) will add validation and stewardship layers but won't change the contract schema
