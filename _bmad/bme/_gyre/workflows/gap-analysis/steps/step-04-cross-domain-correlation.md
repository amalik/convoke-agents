---
step: 4
workflow: gap-analysis
title: Cross-Domain Correlation
---

# Step 4: Cross-Domain Correlation

Identify compound findings that span observability and deployment domains.

## MANDATORY EXECUTION RULES

- Only run if BOTH domain analyses (steps 2 and 3) completed successfully
- If either domain failed, skip correlation and note in the report
- Each compound must reference exactly 2 existing findings from DIFFERENT domains
- Compound confidence = lower of the two component confidences
- Suppress compounds when either component has confidence "low" (NFR22)

## CORRELATION PATTERNS

Look for these known amplification patterns between observability and deployment findings:

### High-Priority Compounds

| Observability Finding | + Deployment Finding | = Compound Impact |
|----------------------|---------------------|-------------------|
| No health checks | No rollback mechanism | **Deployment risk amplifier:** Failed deployments cannot be detected or reversed automatically |
| No structured logging | No deployment event markers | **Incident blindness:** Cannot correlate deployment events with application behavior changes |
| No distributed tracing | No circuit breakers | **Cascade risk:** Service failures propagate without detection or isolation |
| No metrics collection | No alerting/monitoring | **Silent failure:** System degradation invisible until users report issues |
| No error tracking | No graceful shutdown | **Data loss risk:** Errors during shutdown go untracked, requests lost silently |

### Medium-Priority Compounds

| Observability Finding | + Deployment Finding | = Compound Impact |
|----------------------|---------------------|-------------------|
| No tracing | No canary strategy | **Regression detection gap:** Cannot detect performance regressions during gradual rollout |
| No metrics | No autoscaling config | **Capacity blindness:** Cannot scale based on load if load isn't measured |
| No log correlation IDs | Multiple services detected | **Debug difficulty:** Cross-service issues untraceable without correlation |

## COMPOUND FINDING SCHEMA

```yaml
- id: "COMPOUND-NNN"
  domain: "cross-domain"
  severity: "[blocker|recommended|nice-to-have]"
  source: "contextual-model"
  confidence: "[lower of two components]"
  capability_ref: ["[GC2 cap ID 1]", "[GC2 cap ID 2]"]
  description: "[what the compound gap means]"
  evidence_summary: "[references to component findings]"
  related_findings: ["[OBS-NNN]", "[DEP-NNN]"]
  combined_impact: "[reasoning chain: why these two gaps together are worse than either alone]"
```

## CORRELATION PROCESS

1. For each observability finding, check if any deployment finding creates an amplification pattern
2. For each match, verify:
   - Both component findings are from different domains
   - Neither component has confidence "low" (suppress if so)
   - The combination genuinely amplifies risk (not just coincidental co-occurrence)
3. Assign compound severity based on combined impact (may be higher than either component)
4. Write reasoning chain explaining WHY these two gaps together are worse

## SANITY CHECK

After correlation, run a sanity check:

```yaml
sanity_check:
  passed: boolean
  warnings: []
```

Flag warnings for:
- **>80% of capabilities flagged missing** — may indicate wrong archetype or insufficient detection
- **>5 compounds generated** — may indicate over-correlation (review each for genuine amplification)
- **All findings from one domain only** — correlation was skipped or one domain had no findings

## OUTPUT

Store compound findings alongside domain findings. Present brief progress:

```
Cross-domain correlation complete:
- [N] amplification patterns checked
- [M] compound findings identified

[If compounds found]:
Notable compounds:
- [COMPOUND-001]: [brief description]
- [COMPOUND-002]: [brief description]

[If no compounds]:
No cross-domain amplification patterns detected — your gaps are independent.

Preparing findings report...
```

---

## NEXT STEP

Load step: {project-root}/_bmad/bme/_gyre/workflows/gap-analysis/steps/step-05-present-findings.md
