---
step: 4
workflow: full-analysis
title: Analyze Gaps
status: stub
implements: Epic 3 (Story 3.1)
---

# Step 4: Analyze Gaps (Stub)

> **This step will be implemented in Epic 3 — Absence Detection & Correlation.**
>
> Lens loads GC2 (Capabilities Manifest), runs observability and deployment domain analyses with cross-domain correlation, and writes GC3 (Findings Report) to `.gyre/findings.yaml`.

## STUB BEHAVIOR

When this step is reached during full-analysis:

```
## Gap Analysis — Not Yet Implemented

This step requires the Lens agent (readiness-analyst) workflows from Epic 3.

**What will happen here:**
1. Lens loads GC2 (Capabilities Manifest) from .gyre/capabilities.yaml
2. Runs observability domain analysis — structured logging, tracing, metrics
3. Runs deployment domain analysis — container config, CI/CD, rollback
4. Cross-domain correlation identifies compound findings
5. Writes GC3 (Findings Report) to .gyre/findings.yaml
```

---

## NEXT STEP (when implemented)

Load step: {project-root}/_bmad/bme/_gyre/workflows/full-analysis/steps/step-05-review-findings.md
