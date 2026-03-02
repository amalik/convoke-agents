---
step: 3
workflow: lean-experiment
title: Define Success Metrics
---

# Step 3: Define Success Metrics

Before you run the experiment, define what success and failure look like. Not after. Before. This is the most important discipline in lean experimentation — pre-defined success criteria prevent you from moving the goalposts after you see the data.

## Why This Matters

Without pre-defined metrics, every experiment "succeeds" — you'll always find something positive in the data if you look hard enough. That's not learning, it's confirmation bias. Pre-defined success criteria force an honest conversation: "If the number is below X, we were wrong." That's the conversation most teams avoid. That's the conversation that saves you from building the wrong thing.

## Your Task

### 1. Define Primary Success Metric

Your primary metric directly tests the riskiest assumption. One metric. Not three. Not five. One metric that, if it fails, tells you the hypothesis is wrong.

| Field | Your Answer |
|-------|-------------|
| **Metric Name** | What are you measuring? (e.g., "Action rate on dinner suggestions") |
| **Target Threshold** | What number means success? Be specific. (e.g., ">=60% of participants act on the suggestion") |
| **Failure Threshold** | What number means failure? (e.g., "<40% action rate") |
| **Measurement Method** | How will you collect this data? (e.g., "Track text replies vs. no-reply within 30 min") |
| **Why This Metric** | How does it connect to the riskiest assumption? |

### 2. Define Secondary Metrics (1-3)

Secondary metrics provide context but don't determine pass/fail. They help you understand *why* the primary metric succeeded or failed.

For each secondary metric:

| Field | Your Answer |
|-------|-------------|
| **Metric Name** | What are you measuring? |
| **Expected Range** | What range would you expect if the hypothesis is correct? |
| **What It Tells You** | What insight does this metric provide beyond the primary? |

### 3. Define Guardrail Metrics (Optional)

Guardrail metrics detect unintended negative consequences — the "surgery was successful but the patient died" scenarios.

| Field | Your Answer |
|-------|-------------|
| **Guardrail Metric** | What negative effect could this experiment cause? |
| **Red Line** | At what threshold would you stop the experiment? |

### 4. Validate Your Metrics

- [ ] **Actionable?** Does each metric drive a specific decision? (If action rate < 40%, pivot. If > 60%, proceed.) If a metric doesn't drive a decision, remove it.
- [ ] **Measurable?** Can you actually collect this data with your experiment design? If not, simplify the metric or change the design.
- [ ] **Pre-defined?** Are thresholds set BEFORE seeing data? Write them down now. You can't move goalposts you've published.
- [ ] **Connected?** Does the primary metric directly test the riskiest assumption, not a proxy?

---

## Your Turn

Define your primary success metric, 1-3 secondary metrics, and any guardrail metrics. Share them and I'll help you sharpen the thresholds.

---

**[a]** Advanced Elicitation — Deep dive into metric selection and statistical significance
**[p]** Party Mode — Bring in other Vortex agents for metric critique
**[c]** Continue — Proceed to running the experiment

## Next Step

When your success metrics are defined and locked, I'll load:

{project-root}/_bmad/bme/_vortex/workflows/lean-experiment/steps/step-04-run.md
