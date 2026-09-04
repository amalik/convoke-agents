---
step: 1
workflow: lean-experiment
title: State Hypothesis & Input Validation
---

# Step 1: State Hypothesis & Input Validation

Before we run any experiment, we need a clear hypothesis to test. Not a hunch. Not a wish. A falsifiable bet with explicit assumptions you can prove wrong.

## Why This Matters

Experiments without hypotheses produce data without direction. You'll measure things, but you won't know what the results mean. A clear hypothesis tells you exactly what result would change your mind — and that's what makes it an experiment instead of a demo.

## Your Task

### 1. What Hypothesis Are You Testing?

Wade expects a hypothesis — ideally from Liam's hypothesis-engineering workflow as an HC3-compliant artifact:
- **HC3 Hypothesis Contract** (from Liam's `hypothesis-engineering` workflow)
- **Enriched HC3** (from Liam's `assumption-mapping` workflow)

You can also bring **any well-formed hypothesis** — Wade accepts input from outside the Vortex pattern. It doesn't have to be HC3-compliant, but a structured, falsifiable hypothesis makes experiment design dramatically stronger.

### 2. Provide Your Input

Please provide the file path or describe the hypothesis you want to test. For example:
- `_bmad-output/vortex-artifacts/hc3-hypothesis-contract-2026-03-01.md`
- Or: "I believe that [users] will [behavior] because [rationale]"

**If your input is incomplete:** That's okay — we'll work through the gaps. But let's be honest about what we know vs. what we're assuming. The experiment will only be as strong as the hypothesis driving it.

Concept count: 3/3 (falsifiability, HC3 hypothesis contract, non-Vortex input accepted)

**Your turn — I'll wait here.** Give me the path, or just state the hypothesis — if you cannot describe a result that would prove it wrong, the experiment we design will produce data without direction.

Wait for user input.

### 3. Input Validation

*Once you've given me that, I'll check your hypothesis for experiment-readiness and tell you what's present and what's missing.*

> The fields a well-formed hypothesis carries are set out in `{project-root}/_bmad/bme/_vortex/contracts/hc3-hypothesis-contract.md`.
> You don't need to read it — I will.

I also need one thing the contract cannot infer for you: **your riskiest assumption** — the single belief that, if it turned out to be wrong, would kill this hypothesis outright. Every later step depends on it, and it is a required field of the experiment context this workflow produces.

**Falsifiability Check:**
- [ ] Can you describe a result that would prove this hypothesis wrong?
- [ ] Are the expected outcomes specific enough that two people would agree on success vs. failure?
- [ ] Is the riskiest assumption something you can actually observe or measure?

Concept count: 2/3 (experiment-readiness check, riskiest assumption)

---

## Your Turn

Name your riskiest assumption, and I'll tell you what the check found — whether the hypothesis is falsifiable as written and which parts need sharpening. Without that assumption named, the experiment we design in Step 2 has nothing to target.

Wait for user input.

## Next Step

When your hypothesis is validated and experiment-ready, I'll load:

{project-root}/_bmad/bme/_vortex/workflows/lean-experiment/steps/step-02-design.md
