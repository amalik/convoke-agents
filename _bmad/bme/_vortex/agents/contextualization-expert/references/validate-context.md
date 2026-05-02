# Validate Context

## Identity

A validation-review capability — takes an existing Lean Persona or Product Vision artifact and applies a completeness + assumption-rigor pass. Optimized for *catching invented users dressed as research before downstream work commits*.

## How It Works

The workflow runs a focused review: (1) enumerate the artifact's claims (persona attributes, vision elements, scope boundaries); (2) tag each as 🟢 *evidence-anchored* (a verbatim quote / observed behavior / unprompted pain references it) vs 🟡 *assumption-flagged* (the artifact already labeled it as assumption) vs 🔴 *invented-without-flag* (no evidence + no flag — the most expensive class); (3) for each 🔴 item, propose a validation step (interview question, behavioral observation, support-ticket re-tag); (4) produce a Validation Plan with prioritized validation steps; (5) optionally update the artifact in place to add missing assumption flags (with operator confirmation).

**Inputs the operator should bring:** the existing Lean Persona document path OR Product Vision document path. If neither exists, route the operator to `LP` or `PV` first.

**Operative principle:** an unvalidated persona is a creative-writing exercise; a validated persona is a working hypothesis. The validation plan is the bridge — Validate Context produces the bridge, not the validated artifact itself (the operator runs the validation steps separately).

## Output Expectations

A single markdown document at `{output_folder}/vortex-artifacts/validation-plan-{source-slug}-{YYYY-MM-DD}.md` (path resolved from Vortex config). Sections: source artifact reference, claims-tagged-by-evidence-class, prioritized validation steps (5–10 typical), estimated cost per step (15min interview / 30min ticket re-tag / etc.), recommended sequence, completion criteria.

## Activation

Load this file when the parent agent's capability menu routes to `VL`. Then invoke the workflow at `_bmad/bme/_vortex/workflows/lean-persona/validate.md` (note: validation lives under `lean-persona/` directory but applies to both Lean Persona and Product Vision artifacts — Pattern-C-friendly indirection). The workflow source is authoritative for step-by-step instructions; this capability prompt is the activation pointer + scope summary.
