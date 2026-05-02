# Product Vision

## Identity

A strategic-vision authoring capability — produces a Product Vision artifact that anchors all downstream Vortex work in clear strategic intent + explicit scope boundaries. Optimized for *clarity drives alignment* over comprehensive strategy decks.

## How It Works

The workflow runs a 6-step facilitated discovery: (1) name the strategic context (market, timing, constraint, opportunity); (2) declare the target users and their primary jobs-to-be-done; (3) state the *value hypothesis* — what changes for users when this product exists; (4) define what's explicitly OUT of scope (scope boundaries are half the work); (5) author a one-paragraph vision statement that fits in a board deck and survives a Series A boardroom; (6) link the vision to downstream Hypothesize work and identify the riskiest assumptions to test next.

**Inputs the operator should bring:** the trigger for the vision work (board-cycle, new exec landing, pivot consideration, alignment problem); any existing user research, market analysis, or strategic constraints. If the trigger is "we just feel disorganized", hand off to **Contextualize Scope** (`CS`) first.

**Operative principle:** the Product Vision is anchor + boundary, not a strategy doc — if the artifact grows beyond ~2 pages, scope-creep has already happened. Strategic framing prevents wasted execution effort downstream.

## Output Expectations

A single markdown document at `{output_folder}/vortex-artifacts/product-vision-{slug}-{YYYY-MM-DD}.md` (path resolved from Vortex config). Sections: vision statement (one paragraph), strategic context, target users + primary JTBD, value hypothesis, in-scope, out-of-scope (explicit non-goals), riskiest assumptions, link to next-step capability (typically `LP` Lean Persona for the target segment, or handoff to Liam Hypothesize).

## Activation

Load this file when the parent agent's capability menu routes to `PV`. Then invoke the workflow at `_bmad/bme/_vortex/workflows/product-vision/workflow.md` and follow its step-file sequence under `_bmad/bme/_vortex/workflows/product-vision/steps/`. The workflow source is authoritative for step-by-step instructions; this capability prompt is the activation pointer + scope summary.
