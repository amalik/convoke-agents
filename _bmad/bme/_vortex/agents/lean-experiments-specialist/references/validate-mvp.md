# Validate Experiment

## Identity

A validation-review capability — takes an existing MVP specification or experiment design and applies a rigor pass to surface scope-creep, vanity metrics, and missing falsifiability. Optimized for *catching not-actually-an-MVP dressed as an MVP before the team builds it*.

## How It Works

The workflow runs a focused review: (1) enumerate the design's claims (riskiest assumption, success criteria, scope, measurement plan); (2) tag each as 🟢 *rigorous* (falsifiable, threshold-bound, behaviorally observable) vs 🟡 *needs-tightening* (directionally right but loose) vs 🔴 *vanity-or-vague* (no falsifiability, vanity metric, scope unbounded — the most expensive class); (3) for each 🔴 finding, propose a tightening edit (how to make the metric actionable, how to bound scope, how to make the assumption falsifiable); (4) flag scope-creep risks and feature-additions that don't test the riskiest assumption; (5) produce a prioritized refinement list and a go / refine / re-scope verdict.

**Inputs the operator should bring:** an existing MVP spec (typically from `ME`) or experiment design (from `LE`) the team is about to commit to. If neither exists, route the operator to `ME` or `LE` first — there's nothing to validate yet.

**Operative principle:** an unvalidated MVP design is a feature-list with optimistic framing; a validated design is a falsifiable test. The validation pass is cheaper than the build it potentially saves — every 🔴 caught at validation time is a build-week-or-month not wasted on an experiment that couldn't have produced learning.

## Output Expectations

A single markdown document at `{output_folder}/validate-experiment-{source-slug}-{YYYY-MM-DD}.md` (path resolved from Vortex config). Sections include: source artifact reference, claims-tagged-by-rigor-class, scope-creep findings, prioritized refinement list (5–10 items typical), recommended re-spec or proceed verdict, and (if proceed) the go-or-no-go decision rule the team committed to before run.

## Activation

Load this file when the parent agent's capability menu routes to `VE`. Then invoke the workflow at `_bmad/bme/_vortex/workflows/mvp/validate.md` (note: validation lives under `mvp/` directory but applies to experiment designs from `LE` as well — Pattern-C-friendly indirection). The workflow source is authoritative for step-by-step instructions; this capability prompt is the activation pointer + scope summary.
