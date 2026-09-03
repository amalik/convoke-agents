---
step: 1
workflow: research-convergence
title: Setup & Input Validation
---

# Step 1: Setup & Input Validation

Before we synthesize anything, we need to know exactly what research we're working with and verify it's ready for convergence.

## Why This Matters

Three patterns converge on this insight: the quality of your problem definition is directly tied to the quality and completeness of the research feeding it. Garbage in, garbage out. This step ensures we start with solid foundations by validating your input artifacts against the HC1 schema — or guiding you to provide what's needed if your research comes from outside the Vortex pattern.

## Your Task

### 1. What Artifacts Do You Have?

Mila expects research artifacts — ideally produced by Isla's workflows as HC1-compliant empathy artifacts:
- **Empathy maps** (from Isla's `empathy-map` workflow)
- **Interview syntheses** (from Isla's `user-interview` workflow)
- **Observation reports** (from Isla's `user-discovery` workflow)

You can also bring **any well-formed research input** — Mila accepts artifacts from outside the Vortex pattern. They don't have to be HC1-compliant, but having structured research makes convergence stronger.

### 2. List Your Input Artifacts

Please provide the file paths or describe the artifacts you want to synthesize. For example:
- `_bmad-output/vortex-artifacts/hc1-empathy-map-busy-parents-2026-02-20.md`
- `_bmad-output/vortex-artifacts/hc1-interview-synthesis-2026-02-21.md`
- Or: "I have interview notes in a Google Doc and survey results in a spreadsheet"

**If artifacts are non-conforming:** That's okay — we don't reject research. I'll guide you to identify which sections are present and which gaps we need to work around during synthesis. The data shows that even partial research can produce useful convergence when we're explicit about what evidence we have and what we're missing.

Concept count: 2/3 (Isla's research workflows as sources, non-Vortex input accepted)

**Your turn — I'll wait here.** List the paths, or just describe the research — the quality of the problem definition is bounded by what you bring here, so it is worth naming the thin sources too.

Wait for user input.

### 3. Input Validation

*Once you've given me that, I'll check each artifact against the HC1 schema and tell you what's present and what's missing.*

> The full HC1 schema lives at `{project-root}/_bmad/bme/_vortex/contracts/hc1-empathy-artifacts.md`.
> You don't need to read it — I will.

Concept count: 2/3 (schema validation, readiness assessment)

---

## Your Turn

I'll tell you what the check found — which sections are present, which are missing, and what we can work around. Fill any gap you want to fix now, or say go and we'll move to analysis.

Wait for user input.

## Next Step

When your artifacts are listed and validated, I'll load:

{project-root}/_bmad/bme/_vortex/workflows/research-convergence/steps/step-02-context.md
