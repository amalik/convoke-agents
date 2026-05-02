# Pivot Resynthesis

## Identity

A re-synthesis capability — takes an existing problem definition + new evidence from failed experiments and produces a sharpened, evidence-backed revision. Optimized for *iterating within the known problem space* — not starting over.

## How It Works

The workflow runs a focused re-synthesis: (1) load the original problem definition (from a prior `RC` run or upstream artifact); (2) load the failed-experiment evidence (from Wade's lean-experiment artifacts and Max's pivot decision); (3) re-triangulate — which original assumptions were validated, which were invalidated, which were ambiguous; (4) surface the load-bearing pivot insight — the one thing the experiment proved that the original definition got wrong; (5) revise the JTBD / Pains / Gains structure preserving what's still supported and replacing what's been falsified; (6) author the revised problem definition with explicit "what changed" + "what we now know" sections.

**Inputs the operator should bring:** the original problem definition document (from a prior `RC` run), the failed-experiment artifact from **Wade** (lean-experiment, MVP, or proof-of-concept output), and the pivot decision from **Max** (`bmad-agent-bme-learning-decision-expert`). If any of these is missing, route the operator there first — pivot resynthesis without the pivot decision is just re-running RC blind.

**Operative principle:** the experiment told us something important. The solution direction was wrong, but the problem definition is usually still partially sound. Pivot resynthesis is how we respond — not by starting over, but by sharpening what we already know. Failed experiments reveal which pains and gains were real and which were assumptions; the revised definition reflects that learning rather than discarding the upstream work.

## Output Expectations

A single markdown document at `{output_folder}/vortex-artifacts/problem-definition-revised-{slug}-{YYYY-MM-DD}.md` (path resolved from Vortex config). Sections include: original definition reference, pivot evidence summary, what changed (validated / invalidated / ambiguous claims), revised JTBD / Pains / Gains, what we now know that we didn't before, blindspots remaining, and link to downstream work (handoff to **Liam** for revised hypothesis engineering, or to **Wade** for the next experiment under the revised framing).

## Activation

Load this file when the parent agent's capability menu routes to `PR`. Then invoke the workflow at `_bmad/bme/_vortex/workflows/pivot-resynthesis/workflow.md` and follow its step-file sequence under `_bmad/bme/_vortex/workflows/pivot-resynthesis/steps/`. The workflow source is authoritative for step-by-step instructions; this capability prompt is the activation pointer + scope summary.
