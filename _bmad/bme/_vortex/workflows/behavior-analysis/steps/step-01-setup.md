---
step: 1
workflow: behavior-analysis
title: Setup & Input Validation
---

# Step 1: Setup & Input Validation

Before we analyze any production behavior, we need the experiment that established the baseline. Behavioral patterns reveal intent that surveys miss — but only when measured against what was predicted and validated. Without that baseline, observed behavior is just noise.

## Why This Matters

Production behavior viewed in isolation tells you what users are doing. Production behavior viewed against experiment baselines tells you what it means. A segment abandoning a feature could be alarming — or it could be exactly the variance the experiment predicted. The classification depends entirely on the experiment context: what was tested, what was confirmed, and what behavior was expected in production. Without those baselines, you cannot distinguish variance from regression from discovery.

## Your Task

### 1. What Experiment Context Do You Have?

Noah expects experiment context — ideally produced by Wade's experimentation workflow as an HC4-compliant artifact:
- **HC4 Experiment Context** (from Wade's `lean-experiment` workflow)
- **HC4 Experiment Context** (from Wade's `proof-of-concept`, `proof-of-value`, or `mvp` workflows)

You can also bring **any well-formed experiment summary** — Noah accepts input from outside the Vortex pattern. It doesn't have to be HC4-compliant, but having structured experiment results with explicit success criteria and confirmed/rejected hypotheses makes behavior analysis dramatically more precise.

### 2. Provide Your Input

Please provide the file path or describe the experiment context. For example:
- `_bmad-output/vortex-artifacts/hc4-experiment-context-2026-02-25.md`
- Or: "I have experiment results and I'm seeing unexpected user behavior in production"

**If your input is non-conforming:** That's fine — we don't reject experiment context. I'll guide you to identify which elements are present and which gaps we need to work around during behavior analysis. The more complete the experiment context, the sharper the baseline comparison. But even partial context is better than none — here's what we're seeing in context with whatever you can provide.

Concept count: 2/3 (Wade's experimentation workflows as sources, non-Vortex input accepted)

**Your turn — I'll wait here.** Give me the path, or just describe the experiment you ran — without that baseline, the behaviour you are seeing is indistinguishable from noise.

Wait for user input.

### 3. Input Validation

*Once you've given me that, I'll check your artifact against the HC4 schema and tell you what's present and what's missing.*

> The full HC4 schema lives at `{project-root}/_bmad/bme/_vortex/contracts/hc4-experiment-context.md`.
> You don't need to read it — I will.

### 4. Describe the Behavior You're Observing

While I validate your experiment context, describe the production behavior that prompted this analysis:

| Field | Your Observation |
|-------|-----------------|
| **What behavior are you seeing?** | Describe the specific user behavior or pattern you've noticed |
| **How does it differ from what you expected?** | What did you expect users to do vs. what they're actually doing? |
| **When did you first notice it?** | Approximate time frame |
| **Which users or segments?** | Who is exhibiting this behavior? |

This gives us the raw observation that we'll compare against experiment baselines in Step 2.

Concept count: 2/3 (HC4 schema validation, behavior observation form)

---

## Your Turn

I'll tell you what the check found. Then describe the behaviour you're observing, using the table above — Step 2 formalizes that observation, so it is not optional; without it there is nothing to compare against the baseline.

Wait for user input.

## Next Step

When your experiment context is provided and validated, I'll load:

{project-root}/_bmad/bme/_vortex/workflows/behavior-analysis/steps/step-02-context.md
