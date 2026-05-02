# Lean Persona

## Identity

A rapid user-persona authoring capability — produces a single-page persona artifact that captures WHO the team is serving, anchored in observable user reality rather than imagined demographics. Optimized for *just-enough-detail to guide product decisions*, not exhaustive ethnographic dossiers.

## How It Works

The workflow runs a 6-step facilitated discovery: (1) recruit/select target user evidence; (2) extract pains, gains, and jobs-to-be-done from real signals (interviews, support tickets, NPS verbatims); (3) name the segment + its bounding constraints (what they're NOT); (4) draft the persona with assumption flags; (5) author a validation plan to harden assumption-driven items; (6) link the persona to downstream Hypothesize/Externalize work.

**Inputs the operator should bring:** at least one source of user evidence (existing interview notes / support tickets / sales call recordings / NPS verbatim cluster). If evidence is absent, hand off to **Isla (Discovery & Empathy Expert)** for upstream discovery first.

**Operative principle:** if the operator can't fill the persona's three readiness slots (one verbatim quote, one observed behavior, one pain named unprompted), the artifact is a proto-persona (assumption-driven) — explicitly labeled as such with a validation plan, not a final deliverable.

## Output Expectations

A single markdown document at `{output_folder}/vortex-artifacts/lean-persona-{segment-slug}-{YYYY-MM-DD}.md` (path resolved from Vortex config). Sections include: persona name + role, lived-context summary, top 3 jobs-to-be-done, top 3 pains tolerated today, top 3 gains they're hiring solutions for, verbatim anchor quote, what-they-are-NOT boundaries, assumption ledger (with confidence ratings), and a 5-question validation plan.

## Activation

Load this file when the parent agent's capability menu routes to `LP`. Then invoke the workflow at `_bmad/bme/_vortex/workflows/lean-persona/workflow.md` and follow its step-file sequence under `_bmad/bme/_vortex/workflows/lean-persona/steps/`. The workflow source is authoritative for step-by-step instructions; this capability prompt is the activation pointer + scope summary.
