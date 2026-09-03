---
step: 1
workflow: production-monitoring
title: Setup & Multi-Experiment Input Validation
---

# Step 1: Setup & Multi-Experiment Input Validation

Production monitoring operates at portfolio scale — multiple graduated experiments running in production simultaneously. Before we can monitor anything, we need the experiment contexts that established the baselines. Production data is the most honest user feedback — it can't lie — but monitoring multiple experiments without their baselines is watching dashboards without understanding what you're looking at.

## Why This Matters

A single production signal viewed in isolation is just a number. Multiple production signals viewed without experiment context is just a bigger dashboard. The signal indicates something very different for each experiment depending on what was tested, what was confirmed, and what behavior was expected. Portfolio monitoring requires all the experiment contexts loaded and validated so that every signal can be measured against the right baseline.

## Your Task

### 1. How Many Experiments Are You Monitoring?

Production monitoring works with **multiple experiments simultaneously**. Provide the experiment contexts for all active experiments you want to monitor:

| # | Experiment | Input |
|---|-----------|-------|
| 1 | *name or description* | HC4 file path or description |
| 2 | *name or description* | HC4 file path or description |
| 3 | *(if applicable)* | |

Noah expects experiment context — ideally produced by Wade's experimentation workflow as HC4-compliant artifacts:
- **HC4 Experiment Context** (from Wade's `lean-experiment` workflow)
- **HC4 Experiment Context** (from Wade's `proof-of-concept`, `proof-of-value`, or `mvp` workflows)

You can also bring **any well-formed experiment summaries** — Noah accepts input from outside the Vortex pattern. It doesn't have to be HC4-compliant, but having structured experiment results with explicit success criteria makes portfolio monitoring dramatically more precise.

### 2. Provide Your Inputs

Please provide file paths or describe each experiment context. For example:
- `_bmad-output/vortex-artifacts/hc4-experiment-alpha-2026-02-20.md`
- `_bmad-output/vortex-artifacts/hc4-experiment-beta-2026-02-22.md`
- Or: "I have three experiments running — onboarding flow, pricing page, and search redesign"

**If any input is non-conforming:** That's fine — we don't reject experiment context. I'll guide you to identify which elements are present and which gaps we need to work around for each experiment. The more complete the experiment contexts, the sharper the portfolio monitoring. But even partial context is better than none — here's what we're seeing in context with whatever you can provide.

Concept count: 3/3 (Wade's experimentation workflows as sources, non-Vortex input accepted, multi-experiment input)

**Your turn — I'll wait here.** Give me the paths, or just name the experiments — each one needs its own baseline, because a signal that is alarming for one experiment is exactly what another one predicted.

Wait for user input.

### 3. Per-Experiment Input Validation

*I'll check each experiment context against the HC4 schema, one at a time, and tell you what's present and what's missing.*

> The full HC4 schema lives at `{project-root}/_bmad/bme/_vortex/contracts/hc4-experiment-context.md`.
> You don't need to read it — I will.

Concept count: 1/3 (per-experiment schema validation)

**Your turn — I'll wait here.** Fill any per-experiment gap you want to close now — an experiment that stays thin here is one whose signals we cannot classify later.

Wait for user input.

### 4. Portfolio Readiness

*Then I'll roll the per-experiment results up so you can see the portfolio in one view.*

**Portfolio Validation Summary:**

| # | Experiment | HC4 Compliant | Missing Fields | Readiness |
|---|-----------|---------------|----------------|-----------|
| 1 | *name* | Yes / Partial / No | *list* | Ready / Needs Attention |
| 2 | *name* | Yes / Partial / No | *list* | Ready / Needs Attention |

Concept count: 1/3 (portfolio readiness summary)

---

## Your Turn

I'll show you the portfolio table — which experiments are ready, which need attention, and what's missing from each. Say go when you're ready to assemble the portfolio and map baselines.

Wait for user input.

## Next Step

When all experiment contexts are provided and validated, I'll load:

{project-root}/_bmad/bme/_vortex/workflows/production-monitoring/steps/step-02-context.md
