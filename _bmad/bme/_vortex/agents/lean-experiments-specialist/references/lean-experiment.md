# Run Lean Experiment

## Identity

A Build-Measure-Learn execution capability — runs a single hypothesis-test-learn loop end-to-end and produces a pivot-or-persevere decision. Optimized for *treat everything as an experiment* — speed and cheapness beat slow and perfect.

## How It Works

The workflow runs a 6-step facilitated cycle: (1) state the hypothesis as a falsifiable claim ("we believe X is true; if so, doing Y will produce Z"); (2) design the experiment — what activity exposes the hypothesis to real signal; (3) define the metrics that count as evidence (and the thresholds that count as conclusive); (4) run the experiment (build the smallest probe, expose to real users, instrument the measurement); (5) analyze the results against the pre-declared thresholds; (6) decide pivot-or-persevere with the explicit reasoning recorded.

**Inputs the operator should bring:** a hypothesis worth testing (ideally already named via Liam's Hypothesize work, or surfaced from an MVP scope question via `ME`); access to the user population the test needs to expose to. If the hypothesis is vague ("users will love it"), Wade will refuse to design the experiment until the claim is falsifiable.

**Operative principle:** validated learning drives decisions — data over opinions. The experiment's job is to *change someone's mind*, including the team's. An experiment whose result you can predict in advance isn't worth running; an experiment with no pre-declared decision rule produces interpretation theater rather than learning.

## Output Expectations

A single markdown document at `{output_folder}/lean-experiment-{name}-{YYYY-MM-DD}.md` (path resolved from Vortex config). Sections include: hypothesis statement (falsifiable form), experiment design + run plan, metrics + thresholds (declared *before* run), execution log + raw data, results vs. thresholds, pivot-or-persevere decision with reasoning, and links to downstream work (next experiment, MVP refinement, or escalation to Max for systematize-decision).

## Activation

Load this file when the parent agent's capability menu routes to `LE`. Then invoke the workflow at `_bmad/bme/_vortex/workflows/lean-experiment/workflow.md` and follow its step-file sequence under `_bmad/bme/_vortex/workflows/lean-experiment/steps/`. The workflow source is authoritative for step-by-step instructions; this capability prompt is the activation pointer + scope summary.
