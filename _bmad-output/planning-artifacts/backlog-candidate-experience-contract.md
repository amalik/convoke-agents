# Backlog Candidate: Convoke Experience Contract

**Origin:** Party mode session (2026-04-06) — Winston + Loom Master discussing Artifact Governance release UX gaps
**For:** John (PM) to triage into initiatives backlog

## Problem Statement

Convoke skills are structurally consistent (Loom validates file structure, wiring, naming) but **experientially inconsistent**. No codified rules govern how skills interact with operators. This was surfaced when Migration dumped 31 "ACTION REQUIRED" items with no guidance and Portfolio silently dropped 108/151 files.

## Proposed Deliverable

An **Experience Contract** — a reference document codifying operator-facing interaction patterns that all Convoke skills must follow. Becomes a Loom validation gate (Step 05) for future skills.

## Draft Rules (to be refined by PM + UX)

- When the engine can't resolve something, **suggest a default** — never just say "unknown"
- When presenting lists, **batch by category** — never dump a flat wall
- When asking the operator to decide, **explain why it matters** — never just present raw options
- When showing results, **explain what's missing and why** — never silently drop data
- Step flows must **WAIT FOR INPUT** at every decision point
- Errors must be **actionable** — tell the operator what to do, not just what went wrong
- Progressive disclosure: max 3 new concepts per interaction round

## Dependencies

- Loom Add Skill workflow (also on backlog) — experience contract becomes a validation gate
- Existing skills may need retrofitting once contract is ratified

## Suggested RICE Inputs

- **Reach:** Every skill, every operator interaction — high
- **Impact:** Directly addresses operator confusion and abandonment — high
- **Confidence:** Rules are clear from real UX failures — high
- **Effort:** One reference doc + one Loom gate addition — low-medium
