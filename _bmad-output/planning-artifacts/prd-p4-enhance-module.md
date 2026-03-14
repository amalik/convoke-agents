---
stepsCompleted: [step-01-init, step-02-discovery, step-02b-vision, step-02c-executive-summary, step-03-success]
inputDocuments:
  - _bmad-output/planning-artifacts/P4-enhance-module-architecture.md
  - _bmad-output/planning-artifacts/initiatives-backlog.md
workflowType: 'prd'
documentCounts:
  briefs: 0
  research: 0
  projectDocs: 2
classification:
  projectType: "Content Platform + Workflow System"
  domain: "Product Discovery / Innovation Methodology"
  complexity: "medium (v1 scope), with architectural note that the Enhance pattern establishes cross-module extension precedent"
  projectContext: brownfield
elicitation:
  methods_applied: [architecture-decision-records, stakeholder-round-table, first-principles-analysis, 5-whys-deep-dive]
  core_framing: "Closing the review-to-backlog feedback loop"
  success_metric: "80% reduction in time-to-backlog-update (currently 20-40 minutes manual)"
  incubation_angle: "Prove the Enhance pattern in Convoke, then propose upstream to BMAD core as dynamic extensions tag"
  adrs:
    - "ADR-1: Single install via convoke-install-vortex — no new CLI command"
    - "ADR-2: Verify workflow entry point in installer — additive-only patch, fail-fast on missing"
    - "ADR-3: Explicit user menu for mode selection (T/R/C) — no auto-detection"
    - "ADR-4: No mode switching — modes run independently, backlog file is shared state"
    - "ADR-5: Shared RICE scoring guide as reference doc in templates/"
  stakeholder_concerns:
    - "John PM: Triage mode is the highest-value deliverable"
    - "Winston: Cross-module coupling boundaries and failure isolation"
    - "Morgan: Installation path and package distribution for _enhance/"
    - "Wendy: Tri-modal workflow complexity and shared state"
    - "Emma: RICE scoring must feel like strategic conversation, not calculator"
    - "Max: Input format flexibility for diverse review transcript types"
  first_principles: "Core deliverable is RICE backlog workflow for John PM. The _enhance/ structure is an architectural investment. Option C chosen — full v1 with pattern establishment."
  vision:
    statement: "Convoke's Enhance module makes existing BMAD agents more capable. First enhancement — RICE backlog management for John PM — closes the feedback loop between review sessions and strategic prioritization."
    differentiator: "Going from chaos (a review transcript) to clarity (a scored, prioritized list) in one step. Not a new tool — a capability upgrade to an agent you already use."
    core_insight: "The bottleneck isn't generating findings, it's turning findings into prioritized action."
    interaction_model: "Agent proposes, human validates. Batch validation — John extracts all, scores all, presents in one shot, user validates in one pass."
    proof_of_concept_bar: "Zero lost findings + calibrated scoring = success"
  party_mode_refinements:
    - "Batch over individual — one interaction per phase, not one per finding"
    - "Success metric reframed to 80% reduction rather than absolute minutes"
    - "Deprecation question acknowledged but deferred to post-v1"
---

# Product Requirements Document - Convoke P4: Enhance Module

**Author:** Amalik
**Date:** 2026-03-14

## Executive Summary

Convoke P4 introduces the Enhance module (`_bmad/bme/_enhance/`) — a new submodule that upgrades existing BMAD agents with capabilities they don't have today. While Vortex adds new agent teams, Enhance makes agents you already use more powerful. The first enhancement is a RICE Initiatives Backlog workflow for John PM, closing the feedback loop between review sessions and strategic prioritization.

Today, after every multi-agent review cycle (party mode, adversarial review, retrospective), findings must be manually extracted, RICE-scored, and formatted into the initiatives backlog. This takes an estimated 20-40 minutes, produces inconsistent scoring, and risks losing findings. P4 automates this: John PM ingests a review transcript, extracts all findings, proposes RICE scores in batch, and presents them for human validation in a single pass. Agent proposes, human validates.

The workflow is tri-modal — Triage (ingest review findings), Review (rescore existing backlog), Create (build backlog from scratch) — with Triage as the critical path. All three modes reference a shared RICE scoring guide template for consistent calibration and write to the same backlog file. The workflow attaches to John PM via a single `<item>` tag added to `pm.md` — if removed, John works exactly as before. The Enhance module ships via the existing `convoke-install-vortex` installer with no new CLI commands.

P4 is deliberately scoped as Option C (full pattern establishment) rather than a minimal workflow addition, because the Enhance pattern — one module upgrading another module's agent — is the architectural proof-of-concept for a proposed BMAD core `<extensions>` mechanism. The v1 investment in directory structure, config, guide, and extension documentation serves that upstream goal. If the pattern proves valuable, it becomes the basis for declarative agent extensibility across the BMAD ecosystem.

**v1 scope:** Workflow content (11 step files, 3 modes), installer integration, menu patch, config, and guide. **Deferred:** Workflow manifests, skill manifests, BMAD external module registration, dynamic extensions mechanism, individual initiative files.

### What Makes This Special

The differentiation moment: a user finishes a 16-agent party mode session with pages of findings, tells John to triage them, and sees every finding extracted, scored, and formatted in one shot. Chaos to clarity in one step — with zero lost findings and calibrated scoring as the measurable proof. Not a new tool to learn — a capability upgrade to an agent they already trust.

Success metric: 80% reduction in time-to-backlog-update.

## Project Classification

- **Project Type:** Content Platform + Workflow System — the deliverable is markdown workflow step files and YAML config, shipped via npm
- **Domain:** Product Discovery / Innovation Methodology
- **Complexity:** Medium (v1 scope). Architectural note: this establishes the cross-module extension pattern — one module modifying another module's agent menu — which has higher complexity implications for future versions
- **Project Context:** Brownfield — extending Convoke v2.2.0, adding second submodule alongside Vortex

## Success Criteria

### User Success

- **Triage completes without lost actionable findings** — every actionable item (proposes a change, identifies a gap, or flags a risk) in a review transcript appears in the proposed batch. Observations and commentary excluded unless user escalates during validation.
- **Scoring requires minimal correction** — user accepts 80%+ of proposed RICE scores without modification. Guard: no more than 3 items with identical scores in the top 10 of the prioritized view.
- **Backlog update is fast** — under 10 minutes for a 12-finding transcript (baseline: estimated 20-40 minutes manual).
- **The interaction feels like strategic conversation** — RICE scoring questions prompt genuine reflection, not rubber-stamping.

### Business Success

- **The Enhance pattern works** — one module successfully extends another module's agent without breakage, coupling issues, or user confusion. Ready for upstream proposal to BMAD core as `<extensions>` mechanism.
- **Convoke positioning expands** — Enhance establishes Convoke as "Vortex + upgrades to existing agents," not just "Vortex."

### Technical Success

- **Zero test regressions** — existing John PM test suite passes unchanged after menu patch applied.
- **Installer integration clean** — `convoke-install-vortex` installs Enhance files alongside Vortex. `verifyInstallation()` confirms workflow entry point exists.
- **Idempotent** — running the installer twice produces identical results.
- **Update-resilient** — BMAD upstream updates to `pm.md` do not break the Enhance workflow (the `exec` path is stable).

### Measurable Outcomes

| Metric | Target | How Measured |
|--------|--------|-------------|
| Actionable findings extraction | 100% | Compare transcript findings to proposed batch |
| Score acceptance rate | 80%+ without modification | Count approved vs. adjusted scores |
| Score distribution health | No more than 3 identical scores in top 10 | Inspect prioritized view |
| Time-to-backlog-update | Under 10 min (12-finding transcript) | Stopwatch on real session |
| Installer success | Pass on first run | `verifyInstallation()` all checks green |
| Test regression | Zero failures | Existing PM test suite |

## Product Scope

### MVP — Minimum Viable Product

- **Triage mode** (4 step files) — ingest review transcript, extract actionable findings, propose RICE scores in batch, update backlog with user approval
- **Review mode** (3 step files) — load existing backlog, walk through items for rescoring, regenerate prioritized view
- **Create mode** (4 step files) — initialize new backlog, gather initiatives, score, generate prioritized view
- **Workflow entry point** — mode selection menu (T/R/C), shared RICE scoring guide template
- **Installer integration** — section 8 in `refreshInstallation()`, verification check, `package.json` files array. **Highest-risk MVP item** — only part that touches existing codebase.
- **Menu patch** — single `<item>` tag added to John PM's `pm.md`
- **Directory structure** — `_bmad/bme/_enhance/` with config.yaml, extensions/, workflows/, guides/, templates/
- **Lean guide** — half-page `ENHANCE-GUIDE.md` (30-minute writing budget). Audience: end users + future module authors.

### Growth Features (Post-MVP)

- **Individual initiative files** (v2) — per-item markdown files with RICE frontmatter, auto-generated summary view
- **Cross-agent routing** — "next actions by agent" section in backlog output
- **Additional enhancement workflows** — second and third workflows for other BMAD agents (candidates TBD based on usage)

### Vision (Future)

- **Dynamic `<extensions>` tag** (v3) — proposed BMAD core mechanism for declarative agent extensibility
- **Enhance ecosystem** — multiple modules contributing enhancements to shared agents
- **BMAD external module registration** — Convoke listed in `external-official-modules.yaml`

### Architecture Constraints (from ADRs)

- **ADR-1:** Single install via `convoke-install-vortex` — no new CLI command
- **ADR-2:** Verify workflow entry point in installer — additive-only patch (`<item>` tag removable, John works without it), fail-fast on missing files
- **ADR-3:** Explicit user menu for mode selection (T/R/C) — no auto-detection
- **ADR-4:** No mode switching — modes run independently, backlog file is shared state
- **ADR-5:** Shared RICE scoring guide as reference document in templates/
