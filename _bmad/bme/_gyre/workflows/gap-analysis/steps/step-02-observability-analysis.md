---
step: 2
workflow: gap-analysis
title: Observability Analysis
---

# Step 2: Observability Analysis

For each observability capability, search the filesystem for implementation evidence.

## MANDATORY EXECUTION RULES

- Use Claude Code tools (Glob, Grep, Read) — do NOT ask the user for this information
- Search for EVIDENCE OF EXISTENCE, not quality — absence detection, not code review
- Every finding must cite a detection method (what tool was used and what was searched)
- Do NOT include file contents in findings — only categorical evidence descriptions
- Tag every finding with source, confidence, and severity

## ANALYSIS PATTERN

For each observability capability in the manifest:

### 1. Evidence Search

Use a progressive search strategy:

**Glob** — find relevant files:
- Config files (e.g., `**/otel*.yaml`, `**/prometheus*.yml`, `**/*logging*.*`)
- Source patterns (e.g., `**/*health*.*`, `**/*metrics*.*`, `**/*trace*.*`)
- Package configs that declare observability dependencies

**Grep** — search for implementation patterns:
- Import statements (e.g., `opentelemetry`, `prom-client`, `winston`, `pino`)
- Configuration patterns (e.g., `healthz`, `readiness`, `liveness`)
- Metric registration (e.g., `histogram`, `counter`, `gauge`)

**Read** — examine found files for completeness:
- If a config file exists, is it configured or just a skeleton?
- If an import exists, is it used or just declared?

### 2. Capability-Specific Search Patterns

| Capability Pattern | Glob For | Grep For |
|-------------------|----------|----------|
| Structured logging | `**/*log*config*`, `**/*logger*.*` | `winston`, `pino`, `bunyan`, `structured`, `json.*log` |
| Distributed tracing | `**/*trace*.*`, `**/*otel*.*` | `opentelemetry`, `@opentelemetry`, `trace`, `span` |
| Metrics collection | `**/*metric*.*`, `**/*prom*.*` | `prometheus`, `prom-client`, `histogram`, `counter` |
| Health checks | `**/*health*.*`, `**/readiness*`, `**/liveness*` | `healthz`, `readiness`, `liveness`, `/health` |
| Alerting | `**/*alert*.*`, `**/*alarm*.*` | `alertmanager`, `cloudwatch.*alarm`, `pagerduty` |
| Error tracking | `**/*sentry*.*`, `**/*error*track*` | `sentry`, `@sentry`, `errorHandler`, `Bugsnag` |

### 3. Finding Classification

For each capability, classify the result:

| Status | Criteria | Finding Generated? |
|--------|----------|:-----------------:|
| **Present** | Multiple evidence sources confirm implementation | No (not a gap) |
| **Absent** | No evidence found across all search patterns | Yes — finding |
| **Partial** | Config or dependency exists but implementation incomplete | Yes — finding |

### 4. Finding Tagging

Each finding must include:

```yaml
- id: "OBS-NNN"              # sequential within observability domain
  domain: "observability"
  severity: "[blocker|recommended|nice-to-have]"
  source: "[static-analysis|contextual-model]"
  confidence: "[high|medium|low]"
  capability_ref: "[GC2 capability ID]"
  description: "[what's missing and why it matters]"
  evidence_summary: "[what was searched and what was/wasn't found]"
  severity_rationale: "[why this severity level]"
```

**Source tagging:**
- `static-analysis`: Finding based on actual filesystem evidence (file found/not found, pattern matched/not matched)
- `contextual-model`: Finding inferred from the capabilities manifest — the capability is relevant but no specific search pattern exists

**Severity guidelines:**
- `blocker`: Missing capability that prevents safe production deployment (e.g., no health checks on K8s)
- `recommended`: Missing capability that significantly reduces operational visibility or safety
- `nice-to-have`: Missing capability that would improve operations but isn't critical

**Confidence levels:**
- `high`: Multiple search patterns confirm absence — confident the capability doesn't exist
- `medium`: Some patterns checked, some missed — moderately confident
- `low`: Limited search coverage or ambiguous results — low confidence

## OUTPUT

Store observability findings in working memory. Present brief progress:

```
Observability analysis complete:
- [N] capabilities checked
- [P] present (no gaps)
- [A] absent (gaps found)
- [R] partial (incomplete implementation)

Proceeding to deployment analysis...
```

---

## NEXT STEP

Load step: {project-root}/_bmad/bme/_gyre/workflows/gap-analysis/steps/step-03-deployment-analysis.md
