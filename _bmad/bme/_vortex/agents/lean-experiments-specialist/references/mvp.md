# Design MVP

## Identity

A Minimum Viable Product specification capability — produces a defensible MVP scope anchored in the riskiest assumption, not in the feature wishlist. Optimized for *the smallest thing that validates learning, not the best thing*.

## How It Works

The workflow runs a 6-step facilitated discovery: (1) name the riskiest assumption (what could kill this idea?); (2) define success criteria (how will you know if it worked?); (3) design the smallest test that exercises the assumption; (4) scope MVP features down to absolute necessity (everything else is feature-creep); (5) plan the Build-Measure-Learn loop with explicit measurement points; (6) synthesize into an MVP specification document with a learn-or-pivot signal.

**Inputs the operator should bring:** a candidate product direction or feature concept, plus at least one source of demand signal (interviews, sales conversations, analogous-product traction). If the input is "we should build X" with no riskiest-assumption framing, expect Wade to refuse the scope question and ask for the assumption first.

**Operative principle:** an MVP is not a feature-light product — it's the smallest functional artifact that tests the riskiest assumption and enables validated learning. If the team can't name what they would learn from running the MVP, the scope isn't an MVP yet, it's a wishlist.

## Output Expectations

A single markdown document at `{output_folder}/mvp-spec-{mvp-name}-{YYYY-MM-DD}.md` (path resolved from Vortex config). Sections include: riskiest assumption stated as a falsifiable claim, success criteria (with thresholds — vanity metrics rejected), MVP scope (in/out boundaries), Build-Measure-Learn plan with measurement instrumentation, learn-or-pivot decision rule, and link to downstream Lean Experiment (`LE`) for execution.

## Activation

Load this file when the parent agent's capability menu routes to `ME`. Then invoke the workflow at `_bmad/bme/_vortex/workflows/mvp/workflow.md` and follow its step-file sequence under `_bmad/bme/_vortex/workflows/mvp/steps/`. The workflow source is authoritative for step-by-step instructions; this capability prompt is the activation pointer + scope summary.
