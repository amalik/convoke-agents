---
step: 1
workflow: proof-of-value
title: Define Value Hypothesis
---

# Step 1: Define Value Hypothesis

You have proven you CAN build this. Now the question is: SHOULD you? This step forces you to articulate exactly what business value you are claiming before you test whether anyone agrees.

## Why This Matters

Most products fail not because they cannot be built, but because nobody will pay for them. A value hypothesis makes the business case explicit and testable: who gets value, what kind of value, and how much that value is worth. Without a crisp value hypothesis, teams drift into building features that are technically impressive but commercially irrelevant. The proof-of-value workflow starts here because you cannot validate demand for something you have not clearly defined.

## Your Task

### 1. What Input Are You Working From?

Wade expects a validated technical feasibility signal — typically from a proof-of-concept workflow or equivalent:

- An **HC4 Experiment Context** from Wade's `proof-of-concept` workflow, or an **HC3 Hypothesis Contract** from Liam's `hypothesis-engineering` workflow
- **Any validated technical artifact** — Wade accepts input from outside the Vortex pattern

You can also bring a product idea that has been validated as technically feasible through other means. The key requirement is confidence that the thing CAN be built — this workflow tests whether it SHOULD be built.

### 2. Provide Your Input

Please provide the file path or describe the technical validation context you want to build a business case around. For example:
- `_bmad-output/vortex-artifacts/hc4-experiment-context-2026-02-25.md`
- Or: "We have confirmed technical feasibility for X and now need to validate market demand"

Concept count: 3/3 (technical feasibility as the prerequisite, upstream contracts as sources, non-Vortex input accepted)

**Your turn — I'll wait here.** Give me the path, or just describe what you've already proven you can build.

Wait for user input.

### 3. Define the Value Hypothesis

Complete the Value Hypothesis Canvas:

| Dimension | Your Answer |
|-----------|-------------|
| **Target Customer Segment** | Who specifically will pay for this? Not "users" — which segment, role, company size, or persona? |
| **Problem Being Solved** | What pain or job-to-be-done does this address? Reference evidence from upstream artifacts. |
| **Proposed Value** | What specific value does the customer receive? Be concrete: time saved, revenue gained, cost reduced, risk eliminated. |
| **Value Magnitude** | How much value? Quantify where possible: "saves 4 hours/week" not "saves time." |
| **Current Alternatives** | What do customers do today? What are they paying for existing solutions? |
| **Switching Cost** | What would it take for a customer to switch from their current solution to yours? |
| **Willingness-to-Pay Signal** | What early evidence (if any) suggests customers would pay? Stated interest does not count — look for behavioral signals. |

Concept count: 1/3 (value hypothesis canvas)

**Your turn — I'll wait here.** Fill in the canvas — rough answers are fine, we sharpen them together.

Wait for user input.

### 4. Articulate the Value Hypothesis Statement

Using the canvas above, draft the value hypothesis in this format:

> **We believe that** [target customer segment] **will** [pay $X / change behavior Y] **for** [proposed value] **because** [rationale grounded in evidence] **instead of** [current alternative].

Concept count: 1/3 (value hypothesis statement)

**Your turn — I'll wait here.** Draft the sentence and hand it back — if it can't be said in one line, the value claim is still too vague to test, and the validation design in Step 2 will inherit that vagueness.

Wait for user input.

### 5. Identify the Riskiest Value Assumption

Every value hypothesis embeds assumptions about the market. Identify the single most dangerous one:

- [ ] **Demand assumption** — Do enough customers have this problem to sustain a business?
- [ ] **Willingness-to-pay assumption** — Will they pay what we need to charge?
- [ ] **Switching cost assumption** — Is the switching cost low enough that customers will actually move?
- [ ] **Value magnitude assumption** — Is the value large enough relative to price to justify purchase?
- [ ] **Competitive assumption** — Will incumbents or alternatives erode our value proposition?

**Which one, if wrong, kills the entire business case?** That is your riskiest value assumption.

Concept count: 1/3 (riskiest value assumption)

---

## Your Turn

Name the one assumption that, if wrong, kills the business case. I'll tell you whether the canvas, the statement and that assumption hang together — and where the case is still resting on stated interest rather than behaviour. Say go when you're ready to design the validation.

Wait for user input.

## Next Step

When your value hypothesis is defined and the riskiest assumption is identified, I will load:

{project-root}/_bmad/bme/_vortex/workflows/proof-of-value/steps/step-02-validation-design.md
