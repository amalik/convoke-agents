# Pattern Mapping

## Identity

A reconnaissance-before-convergence capability — maps cross-source patterns across research artifacts to identify convergent themes, contradictions, and evidence gaps before committing to a full problem definition. Optimized for *seeing what's there before naming the pattern*.

## How It Works

The workflow runs a focused side-by-side reconnaissance: (1) inventory the artifacts on the table (interview transcripts, support tickets, NPS clusters, behavioral data, sales-call notes — name what's present and what's absent); (2) extract per-artifact themes without forcing convergence yet (let the artifacts speak independently first); (3) cross-cut the themes — which ones surface in 2+ artifacts, which ones surface in only one, which artifacts contradict each other; (4) classify each cross-cutting theme as 🟢 *triangulated* (≥3 sources), 🟡 *promising* (2 sources, deserves a 3rd), or 🔴 *single-source* (anecdotal until corroborated); (5) flag evidence gaps explicitly — which evidence layers would resolve the 🟡 promising themes; (6) produce a Pattern Map artifact with a recommendation: proceed to `RC` if triangulation is sufficient, or return to **Isla** (`bmad-agent-bme-discovery-empathy-expert`) for targeted discovery on the gaps.

**Inputs the operator should bring:** at least 2 research artifacts from upstream Empathize (Isla) or Contextualize (Emma) work. If you have only one artifact, pattern mapping has nothing to cross-cut against — route back to Isla to gather a second source first.

**Operative principle:** pattern mapping is reconnaissance, not commitment. Where research-convergence (`RC`) produces a full HC2 problem definition, pattern mapping identifies what's present and what's missing before that commitment. Holding contradictions in plain view here is the discipline; resolving them prematurely is exactly what convergence work refuses to do. If contradictions surface across artifacts, the right move is usually a targeted discovery probe, not a synthesis hand-wave.

## Output Expectations

A single markdown document at `{output_folder}/vortex-artifacts/pattern-map-{slug}-{YYYY-MM-DD}.md` (path resolved from Vortex config). Sections include: artifacts-on-the-table inventory (with named gaps), per-artifact theme extraction, cross-cutting themes classified by triangulation strength (🟢/🟡/🔴), explicit evidence-gap ledger, recommendation (proceed to `RC` / loop back to Isla for targeted discovery / route to **Liam** if a falsifiable hypothesis surfaced from a 🟢 cross-cutting theme), and named contradictions held open for downstream synthesis.

## Activation

Load this file when the parent agent's capability menu routes to `PA`. Then invoke the workflow at `_bmad/bme/_vortex/workflows/pattern-mapping/workflow.md` and follow its step-file sequence under `_bmad/bme/_vortex/workflows/pattern-mapping/steps/`. The workflow source is authoritative for step-by-step instructions; this capability prompt is the activation pointer + scope summary.
