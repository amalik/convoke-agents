---
title: "Scope Decision: Team Factory"
date: 2026-03-21
created-by: Amalik with Emma (contextualization-expert)
type: scope-decision
status: DECIDED
version: 1.0
---

# Scope Decision: Team Factory

## Decision Summary

**Selected Problem Space:** D — Team Architecture Reference

**Rationale:** Highest weighted score (8.65). Maximum unblocking power — all three factory workflows (Add Team, Add Agent, Add Skill) depend on having a codified blueprint of what a valid BMAD team looks like. No dependencies, high feasibility (raw audit material already exists), fast to validate against Gyre.

**De-scoped (Not Now):**
- A: Add Team workflow (Phase 2 — first consumer of the reference)
- B: Add Agent workflow (Phase 3)
- C: Add Skill workflow (Phase 3)
- E: BMB Integration Layer (woven into Phase 2 as needed)

---

## Problem Opportunities Considered

| # | Opportunity | Description |
|---|------------|-------------|
| A | **Add Team** | Complete factory workflow for creating a new team end-to-end (scaffold, agents, workflows, contracts, config, registry) |
| B | **Add Agent to Existing Team** | Factory workflow for adding an agent to an existing team (file, menu, registry, contracts, scope check) |
| C | **Add Skill/Workflow to Existing Agent** | Factory workflow for adding a workflow/skill (steps, template, menu update, manifest) |
| D | **Team Architecture Reference** | Extract canonical patterns from Vortex + native teams into a reusable blueprint document |
| E | **BMB Integration Layer** | Enhance BMB to support delegation from factory workflows |

---

## Evaluation Criteria

| # | Criterion | Weight | Description |
|---|-----------|--------|-------------|
| 1 | Unblocking Power | 30% | Does this unblock the most downstream work? |
| 2 | Impact on Quality Gap | 25% | How much does this close the gap between "edit files directly" and "follow a proper process"? |
| 3 | Feasibility / Complexity | 20% | How well-understood is the problem? Do we have reference material? |
| 4 | Dependency Chain | 15% | Can it start now? Does it block others? |
| 5 | Validation Speed | 10% | How quickly can we test if it works? |

---

## Scoring Matrix

| Opportunity | Unblocking (30%) | Quality Gap (25%) | Feasibility (20%) | Dependencies (15%) | Validation Speed (10%) | **Weighted** |
|---|---|---|---|---|---|---|
| **A: Add Team** | 9 | 9 | 6 | 4 | 7 | **7.15** |
| **B: Add Agent** | 6 | 7 | 8 | 7 | 8 | **7.00** |
| **C: Add Skill** | 4 | 5 | 9 | 8 | 9 | **6.30** |
| **D: Architecture Reference** | 10 | 6 | 9 | 10 | 9 | **8.65** |
| **E: BMB Integration** | 7 | 4 | 7 | 6 | 6 | **6.05** |

*Note: Preliminary scoring. To be reviewed by John (PM) with RICE scoring for formal prioritization.*

---

## Selected Scope

### Problem Space
Extract the canonical architectural patterns that define a valid BMAD team into a single, authoritative Team Architecture Reference document. This reference will serve as the blueprint for all factory workflows that follow.

### Boundaries (What's In)
- Extract patterns from **Vortex** (Orchestrated Submodule archetype — 7 agents, contracts, routing)
- Extract patterns from **native BMAD teams** (Classic Module archetype — BMM, CIS, TEA, WDS, BMB)
- Document the **Extension** archetype from Enhance
- Produce a **Team Architecture Reference** covering:
  - Required directory structure per archetype
  - Required files and conventions (config.yaml, module-help.csv, activation XML, naming)
  - Registration checklist (agent-registry.js, refresh-installation.js, validator.js)
  - Contract patterns (when needed, how structured)
  - Config field patterns (shared vs. module-specific)
  - Party mode / team assembly patterns
- Validate the reference against **Gyre** (does it describe Gyre accurately?)

### Boundaries (What's Out)
- Building any factory workflows (Phase 2-3)
- BMB modifications (Phase 2, woven into Add Team)
- Alternative team architectures not yet observed
- Installer/migration pipeline changes
- Workflow internals documentation (step-file architecture, template-output patterns)
- Community-facing documentation or contributor guides

---

## Strategic Fit

| Dimension | Assessment |
|-----------|-----------|
| **Vision Alignment** | Strong — codifies what "BMAD compliance" means, the foundation the entire vision stands on |
| **Team Capabilities** | Fully capable — Vortex audit and native teams audit already completed, this is synthesis |
| **Resource Requirements** | Low — single-document deliverable, no code changes |
| **Market Timing** | Urgent — Gyre ready to dev, Forge in discovery, 7 teams incoming. Every team built without it risks inconsistency |

---

## Next Steps

### Recommended Sequence

**Phase 1 (Current scope): Team Architecture Reference**
- Synthesize audit findings into authoritative reference document
- Validate against Gyre structure
- Review with John for formal RICE scoring of Phase 2-3 items

**Phase 2: Add Team Factory Workflow**
- Build orchestration layer using the reference as backbone
- Integrate BMB delegation for artifact generation
- Test on Gyre as first factory-built team

**Phase 3: Add Agent + Add Skill Workflows**
- Smaller factory workflows for incremental extensions
- First colleague self-serve test

### Vortex Compass — Recommended Next Streams

| If you learned... | Consider next... | Agent | Why |
|---|---|---|---|
| Scope is clear, need to formalize hypotheses | hypothesis-engineering | Liam 💡 | Turn "the reference will generalize" into testable hypotheses |
| Ready to build the reference now | Skip to execution | — | The scope is well-defined enough to start directly |
| Want to validate with a colleague first | user-interview | Isla 🔍 | Confirm a colleague would actually use the factory |

---

**Created with:** Convoke v2.3.1 - Vortex Pattern (Contextualize Stream)
**Agent:** Emma (Contextualization Expert)
**Workflow:** contextualize-scope
