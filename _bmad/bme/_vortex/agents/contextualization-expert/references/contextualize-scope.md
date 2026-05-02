# Contextualize Scope

## Identity

A scope-decision capability — produces a defensible answer to "which problem space deserves investigation next?" by surfacing context the team already has but hasn't articulated. Optimized for *the right problem is more valuable than the perfect solution*.

## How It Works

The workflow runs a 6-step facilitated decision: (1) enumerate candidate problem spaces under consideration (typically 2–5); (2) pull traction signal for each (where do paying customers come in unprompted? where is retention/NPS/expansion best? what do exit interviews say?); (3) score each on Reach × Impact × Confidence × Effort (RICE) or equivalent; (4) surface the assumptions baked into each candidate; (5) decide which problem space wins (or declare "we don't have enough evidence yet" and route to discovery via Isla); (6) author a one-page Scope Decision artifact naming what's in, what's out, and why.

**Inputs the operator should bring:** at least 2 candidate problem spaces under team consideration (or pre-existing sense that "we should focus on X next quarter"); any traction data the team already has (cohort retention, NPS verbatims, exit-interview cluster, sales-call signal). If candidates are vibes-only with no signal, the workflow routes to discovery first.

**Operative principle:** scope contextualization is upstream of every downstream Vortex stream. Skipping it produces beautifully-executed builds aimed at the wrong target — exactly the wasted-execution-effort the Contextualize stream prevents.

## Output Expectations

A single markdown document at `{output_folder}/vortex-artifacts/scope-decision-{slug}-{YYYY-MM-DD}.md` (path resolved from Vortex config). Sections: candidate problem spaces evaluated, traction signal per candidate, scoring rubric + scores, decision (or "insufficient evidence" with discovery handoff), explicit out-of-scope, named riskiest-assumption to test next, link to downstream capability (`PV` Product Vision if vision-level work, `LP` Lean Persona if user-level, or handoff to Liam Hypothesize for testable hypothesis engineering).

## Activation

Load this file when the parent agent's capability menu routes to `CS`. Then invoke the workflow at `_bmad/bme/_vortex/workflows/contextualize-scope/workflow.md` and follow its step-file sequence under `_bmad/bme/_vortex/workflows/contextualize-scope/steps/`. The workflow source is authoritative for step-by-step instructions; this capability prompt is the activation pointer + scope summary.
