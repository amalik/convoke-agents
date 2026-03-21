---
step: 1
workflow: delta-report
title: Load History
implements: Story 4.6 (FR39)
---

# Step 1: Load History

Load current findings and previous findings for comparison.

## MANDATORY EXECUTION RULES

- Current findings (`.gyre/findings.yaml`) MUST exist — if missing, STOP
- Previous findings (`.gyre/history.yaml`) are optional — first run has no history

## EXECUTION

### 1. Load Current Findings

Read `.gyre/findings.yaml`. If missing:

```
❌ No current findings found at .gyre/findings.yaml

Delta report requires a current analysis to compare against.
Run gap-analysis first to generate findings, then run delta-report.
```

Then STOP — do not proceed.

Parse the findings array and compound_findings array from GC3.

### 2. Load Previous Findings

Read `.gyre/history.yaml`. If missing:

```
💡 No previous findings found — this is your first delta-capable run.

All current findings will be tagged [NEW]. After this report,
your current findings will be saved as history for future comparison.
```

Set `first_run = true` and proceed with empty previous findings.

If present, parse the findings array and compound_findings array.

### 3. Validate Compatibility

Check that both files have the same schema version. If versions differ:

```
⚠️ Schema version mismatch: current is v[X], history is v[Y].

Proceeding with best-effort comparison — some findings may not correlate perfectly.
```

---

## NEXT STEP

Load step: {project-root}/_bmad/bme/_gyre/workflows/delta-report/steps/step-02-compute-delta.md
