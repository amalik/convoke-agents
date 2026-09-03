---
step: 1
workflow: signal-interpretation
title: Setup & Input Validation
---

# Step 1: Setup & Input Validation

Before we interpret any production signals, we need to understand the experiment that produced the current state. Production data is the most honest user feedback — it can't lie — but it means nothing without the experiment context that gives it meaning.

## Why This Matters

A production metric viewed in isolation is just a number. A 20% drop in feature adoption could be alarming or exactly what the experiment predicted. The signal indicates something very different depending on which experiment graduated to production, what hypothesis was tested, and what behavior was expected. Without that experiment context, you're reading tea leaves instead of intelligence.

## Your Task

### 1. What Experiment Context Do You Have?

Noah expects experiment context — ideally produced by Wade's experimentation workflow as an HC4-compliant artifact:
- **HC4 Experiment Context** (from Wade's `lean-experiment` workflow)
- **HC4 Experiment Context** (from Wade's `proof-of-concept`, `proof-of-value`, or `mvp` workflows)

You can also bring **any well-formed experiment summary** — Noah accepts input from outside the Vortex pattern. It doesn't have to be HC4-compliant, but having structured experiment results with explicit success criteria and confirmed/rejected hypotheses makes signal interpretation dramatically more precise.

### 2. Provide Your Input

Please provide the file path or describe the experiment context you want to interpret signals for. For example:
- `_bmad-output/vortex-artifacts/hc4-experiment-context-2026-02-25.md`
- Or: "I have experiment results and production metrics I'd like to analyze"

**If your input is non-conforming:** That's fine — we don't reject experiment context. I'll guide you to identify which elements are present and which gaps we need to work around during signal interpretation. The more complete the experiment context, the more precise the signal analysis. But even partial context is better than none — here's what we're seeing in context with whatever you can provide.

Concept count: 3/3 (graduated experiments, Wade's experimentation workflows as sources, non-Vortex input accepted)

**Your turn — I'll wait here.** Give me the path, or just describe the experiment behind the signal — without that context a production metric is only a number, and we would be reading tea leaves.

Wait for user input.

### 3. Input Validation

*Once you've given me that, I'll check your artifact against the HC4 schema and tell you what's present and what's missing.*

> The full HC4 schema lives at `{project-root}/_bmad/bme/_vortex/contracts/hc4-experiment-context.md`.
> You don't need to read it — I will.

Concept count: 2/3 (schema validation, readiness assessment)

---

## Your Turn

I'll tell you what the check found — which elements are present, which are missing, and what we can work around. Fill any gap you want to fix now, or say go and we'll connect it to your production signal.

Wait for user input.

## Next Step

When your experiment context is provided and validated, I'll load:

{project-root}/_bmad/bme/_vortex/workflows/signal-interpretation/steps/step-02-context.md
