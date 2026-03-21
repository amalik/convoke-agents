---
step: 3
workflow: full-analysis
title: Generate Model
status: stub
implements: Epic 2 (Story 2.2)
---

# Step 3: Generate Model (Stub)

> **This step will be implemented in Epic 2 — Contextual Model Generation.**
>
> Atlas loads GC1 (Stack Profile), generates a capabilities manifest contextual to the detected stack, and writes GC2 (Capabilities Manifest) to `.gyre/capabilities.yaml`.

## STUB BEHAVIOR

When this step is reached during full-analysis:

```
## Model Generation — Not Yet Implemented

This step requires the Atlas agent (model-curator) workflows from Epic 2.

**What will happen here:**
1. Atlas loads GC1 (Stack Profile) from .gyre/stack-profile.yaml
2. Generates ≥20 capabilities relevant to your detected stack
3. Uses web search for current best practices
4. Writes GC2 (Capabilities Manifest) to .gyre/capabilities.yaml

**For now:** Stack detection is complete. Your GC1 Stack Profile has been written.

Run `/bmad-agent-bme-stack-detective` to use Scout's other workflows,
or activate any Gyre agent from the menu.
```

---

## NEXT STEP (when implemented)

Load step: {project-root}/_bmad/bme/_gyre/workflows/full-analysis/steps/step-04-analyze-gaps.md
