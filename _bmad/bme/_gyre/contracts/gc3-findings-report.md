# GC3: Findings Report — Schema Definition

> **Contract:** GC3 | **Type:** Artifact | **Flow:** Lens → Coach
>
> This schema defines the structure for the Findings Report produced by the gap-analysis workflow. Contains absence-based findings with severity, confidence, evidence summaries, and cross-domain compounds.

## Frontmatter Schema

```yaml
---
contract: GC3
type: artifact
source_agent: lens
source_workflow: gap-analysis
target_agents: [coach]
input_artifacts: [GC2]
created: YYYY-MM-DD
---
```

### Frontmatter Field Reference

| Field | Required | Type | Description |
|-------|----------|------|-------------|
| `contract` | Yes | string | Always `GC3` |
| `type` | Yes | string | Always `artifact` |
| `source_agent` | Yes | string | Always `lens` |
| `source_workflow` | Yes | string | Always `gap-analysis` |
| `target_agents` | Yes | array | Agent IDs that consume this artifact: `[coach]` |
| `input_artifacts` | Yes | array | `[GC2]` — requires Capabilities Manifest |
| `created` | Yes | date | ISO date when artifact was created |

---

## Body Schema

The Findings Report is written to `.gyre/findings.yaml` with the following structure:

```yaml
gyre_findings:
  version: string                 # schema version, e.g., "1.0"
  analyzed_at: ISO-8601           # analysis timestamp
  mode: string                    # "crisis" | "anticipation"
  stack_summary: string           # from GC2
  summary:
    blockers: integer
    recommended: integer
    nice_to_have: integer
    total: integer
    novelty_ratio: string         # e.g., "8 of 12 contextual"
  findings:
    - id: string                  # e.g., "OBS-001" or "DEP-003"
      domain: string              # "observability" | "deployment"
      severity: string            # "blocker" | "recommended" | "nice-to-have"
      source: string              # "static-analysis" | "contextual-model"
      confidence: string          # "high" | "medium" | "low"
      capability_ref: string      # references GC2 capability ID
      description: string         # what's missing and why it matters
      evidence_summary: string    # what was searched and what was/wasn't found
      severity_rationale: string  # why this severity level
  compound_findings:
    - id: string                  # e.g., "COMPOUND-001"
      domain: "cross-domain"
      severity: string            # "blocker" | "recommended" | "nice-to-have"
      source: "contextual-model"
      confidence: string          # lower of the two component confidences
      capability_ref: string[]    # references 2 GC2 capability IDs
      description: string
      evidence_summary: string
      related_findings: string[]  # references 2 finding IDs from different domains
      combined_impact: string     # reasoning chain: why these together are worse
  sanity_check:
    passed: boolean
    warnings: string[]            # e.g., ">80% capabilities flagged missing"
```

### Field Reference — Findings

| Field | Required | Type | Description |
|-------|----------|------|-------------|
| `id` | Yes | string | Unique finding ID: OBS-NNN or DEP-NNN |
| `domain` | Yes | string | "observability" or "deployment" |
| `severity` | Yes | string | "blocker", "recommended", or "nice-to-have" |
| `source` | Yes | string | "static-analysis" (file evidence) or "contextual-model" (inferred) |
| `confidence` | Yes | string | "high", "medium", or "low" |
| `capability_ref` | Yes | string | Must reference a valid GC2 capability ID |
| `description` | Yes | string | What's missing and why it matters |
| `evidence_summary` | Yes | string | What was searched and what was/wasn't found |
| `severity_rationale` | Yes | string | Why this severity level was assigned |

### Field Reference — Compound Findings

| Field | Required | Type | Description |
|-------|----------|------|-------------|
| `id` | Yes | string | Unique compound ID: COMPOUND-NNN |
| `domain` | Yes | string | Always "cross-domain" |
| `severity` | Yes | string | May be higher than either component |
| `source` | Yes | string | Always "contextual-model" |
| `confidence` | Yes | string | Lower of the two component confidences |
| `capability_ref` | Yes | array | Exactly 2 GC2 capability IDs |
| `related_findings` | Yes | array | Exactly 2 finding IDs from different domains |
| `combined_impact` | Yes | string | Reasoning chain explaining amplification |

---

## Artifact Location

- **Path:** `.gyre/findings.yaml` (relative to project root, or service root in monorepo)
- **Overwritten:** Each analysis run produces a fresh findings report
- **Previous report:** Backed up to `.gyre/findings.previous.yaml` for delta-report comparison

---

## Downstream Consumption

| Consumer | Purpose |
|----------|---------|
| **Coach** (review-coach) | Presents findings for user review, captures feedback on accuracy, guides severity adjustments |

---

## Example

```yaml
---
contract: GC3
type: artifact
source_agent: lens
source_workflow: gap-analysis
target_agents: [coach]
input_artifacts: [GC2]
created: 2026-03-22
---

gyre_findings:
  version: "1.0"
  analyzed_at: "2026-03-22T15:00:00Z"
  mode: "crisis"
  stack_summary: "Node.js Express web service on AWS EKS via GitHub Actions"
  summary:
    blockers: 2
    recommended: 5
    nice_to_have: 3
    total: 10
    novelty_ratio: "7 of 10 contextual"
  findings:
    - id: "OBS-001"
      domain: "observability"
      severity: "blocker"
      source: "static-analysis"
      confidence: "high"
      capability_ref: "health-check-liveness"
      description: "No Kubernetes liveness probe detected. EKS pods will not be auto-healed when unresponsive."
      evidence_summary: "Glob for **/health*, **/liveness*: no files found. Grep for 'healthz', 'liveness': no matches in source files. No HEALTHCHECK in Dockerfile."
      severity_rationale: "EKS requires liveness probes for auto-healing. Without them, stuck pods persist until manual intervention."
    - id: "DEP-003"
      domain: "deployment"
      severity: "recommended"
      source: "static-analysis"
      confidence: "medium"
      capability_ref: "rollback-strategy"
      description: "No rollback mechanism detected in deployment configuration."
      evidence_summary: "Grep for 'rollback', 'revision', 'undo' in k8s/ and .github/workflows/: no matches. K8s deployments use default rolling update without explicit rollback steps."
      severity_rationale: "Rolling updates without explicit rollback increase recovery time from failed deployments."
  compound_findings:
    - id: "COMPOUND-001"
      domain: "cross-domain"
      severity: "blocker"
      source: "contextual-model"
      confidence: "high"
      capability_ref: ["health-check-liveness", "rollback-strategy"]
      description: "No health checks combined with no rollback creates unrecoverable deployment failure risk."
      evidence_summary: "Combines OBS-001 (no liveness probe) with DEP-003 (no rollback). Failed deployments cannot be detected by K8s and cannot be reversed."
      related_findings: ["OBS-001", "DEP-003"]
      combined_impact: "Without liveness probes, K8s cannot detect that a new deployment is unhealthy. Without rollback, the failed deployment persists. Together: a bad deploy goes undetected and unrecoverable until manual SSH intervention."
  sanity_check:
    passed: true
    warnings: []
```

---

## Validation Rules

A valid GC3 artifact must:

1. Have all required frontmatter fields present and correctly typed
2. Have all required body fields present and non-empty
3. Have every finding reference a valid `capability_ref` from GC2
4. Have every compound reference exactly 2 findings from different domains
5. Have compound `confidence` equal to the lower of component confidences
6. Have no compounds where either component has confidence "low"
7. Have finding IDs unique within the report
8. Have `severity` as one of: "blocker", "recommended", "nice-to-have"
9. Have `source` as one of: "static-analysis", "contextual-model"
10. Have `confidence` as one of: "high", "medium", "low"
11. Have summary counts matching actual finding counts
