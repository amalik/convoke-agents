---
step: 1
workflow: experiment-design
title: Setup & Input Validation
---

# Step 1: Setup & Input Validation

Before we design any experiment, we need to know exactly what hypothesis we're testing and verify the foundation is strong enough to build an experiment on.

## Why This Matters

A poorly designed experiment wastes more than time — it produces false confidence. If the hypothesis contract is vague, the experiment will test nothing meaningful. If the riskiest assumption isn't clearly identified, you'll test the wrong thing. This step ensures we start with a well-formed hypothesis contract so every experiment decision that follows is grounded in a real, testable bet.

## Your Task

### 1. What Hypothesis Contract Do You Have?

Liam expects a hypothesis contract — ideally produced by the hypothesis-engineering workflow as an HC3-compliant artifact:
- **HC3 Hypothesis Contract** (from Liam's `hypothesis-engineering` workflow)
- **Enriched HC3** (from Liam's `assumption-mapping` workflow, with deepened risk analysis)

You can also bring **any well-formed hypothesis** — Liam accepts input from outside the Vortex pattern. It doesn't have to be HC3-compliant, but having a structured hypothesis with a clear riskiest assumption makes experiment design dramatically sharper.

### 2. Provide Your Input

Please provide the file path or describe the hypothesis contract you want to design an experiment for. For example:
- `_bmad-output/vortex-artifacts/hc3-hypothesis-contract-2026-02-25.md`
- `_bmad-output/vortex-artifacts/hc3-experiment-design-2026-02-25.md` (if re-designing)
- Or: "I have a hypothesis about user onboarding that I want to test"

**If your input is non-conforming:** That's okay — we don't reject hypotheses. I'll guide you to identify which elements are present and which gaps we need to work around during experiment design. But the sharper your hypothesis contract, the better your experiment will be. If you can't prove it wrong, it's not a hypothesis — and if you can't describe what you're testing, you're not ready to design an experiment.

Concept count: 2/3 (hypothesis-engineering and assumption-mapping as sources, non-Vortex input accepted)

**Your turn — I'll wait here.** Give me the path, or just describe the hypothesis — if the riskiest assumption is not clearly identified, we will design a rigorous experiment that tests the wrong thing.

Wait for user input.

### 3. Input Validation

*Once you've given me that, I'll check your artifact against the HC3 schema and tell you what's present and what's missing.*

> The full HC3 schema lives at `{project-root}/_bmad/bme/_vortex/contracts/hc3-hypothesis-contract.md`.
> You don't need to read it — I will.

Concept count: 2/3 (schema validation, readiness assessment)

---

## Your Turn

I'll tell you what the check found — which elements are present, which are missing, and what we can work around. Fill any gap you want to fix now, or say go and we'll identify your experiment targets.

Wait for user input.

## Next Step

When your hypothesis contract is provided and validated, I'll load:

{project-root}/_bmad/bme/_vortex/workflows/experiment-design/steps/step-02-context.md
