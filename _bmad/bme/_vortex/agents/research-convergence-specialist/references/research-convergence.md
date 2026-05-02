# Research Convergence

## Identity

A synthesis-and-problem-definition capability — produces a defensible JTBD-grounded problem statement by triangulating across divergent research streams and surfacing the load-bearing pain/gain. Optimized for *convergence over collection* — synthesize before you define.

## How It Works

The workflow runs a 6-step facilitated synthesis: (1) inventory the evidence layers available (interviews, support tickets, behavioral data, NPS verbatims, churn reasons, exit interviews — surface gaps explicitly); (2) extract verbatim signal from each layer (no paraphrase — users speak in solutions, the convergence work translates back to jobs); (3) cross-source triangulate — claim a pattern only when ≥3 evidence layers converge on the same insight; (4) reframe surviving patterns into Jobs-to-be-Done (functional + emotional + social); (5) Pains & Gains analysis — what users tolerate today vs what they hire workarounds for; (6) author the problem definition with assumption flags + verbatim anchors + named blindspots.

**Inputs the operator should bring:** at least 2 evidence layers (interview transcripts, support ticket cluster, behavioral analytics, NPS verbatims, exit interviews, sales-call recordings). If only one layer exists, hand off to **Isla** (`bmad-agent-bme-discovery-empathy-expert`) for upstream discovery first — synthesizing one source into a "pattern" is exactly what convergence work refuses to do.

**Operative principle:** one data point is an anecdote, three from different sources are a pattern. Same-source repetition isn't triangulation — five interviews from one recruiting channel is one signal repeated five times. The convergence discipline is to call the gap before naming the pattern, then either fill the gap (route back to Isla) or reduce the claim to its actually-supported scope.

## Output Expectations

A single markdown document at `{output_folder}/vortex-artifacts/problem-definition-{slug}-{YYYY-MM-DD}.md` (path resolved from Vortex config). Sections include: triangulation table (evidence layers × signals), JTBD statement (functional + emotional + social), Pains tolerated today, Gains they're hiring solutions for, verbatim anchors, blindspot ledger (which evidence layers are missing and why that matters), assumption flags with confidence ratings, and link to downstream Hypothesize work (handoff to **Liam** for falsifiable hypothesis engineering, or back to Wade if a riskiest-assumption test is needed before commitment).

## Activation

Load this file when the parent agent's capability menu routes to `RC`. Then invoke the workflow at `_bmad/bme/_vortex/workflows/research-convergence/workflow.md` and follow its step-file sequence under `_bmad/bme/_vortex/workflows/research-convergence/steps/`. The workflow source is authoritative for step-by-step instructions; this capability prompt is the activation pointer + scope summary.
