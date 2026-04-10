---
title: "Assumption Risk Map: Team Factory"
date: 2026-03-22
created-by: Amalik with Liam (hypothesis-engineer)
type: assumption-map
status: VALIDATED
version: 1.0
upstream-artifacts:
  - product-vision-team-factory-2026-03-21.md
  - scope-decision-team-factory-2026-03-21.md
elicitation-methods-applied:
  - First Principles Analysis
  - Socratic Questioning
  - Thesis Defense Simulation
---

# Assumption Risk Map: Team Factory

## Hypotheses Analyzed

Five hypotheses extracted from the product vision and scope decision (non-HC3 conforming, produced inline):

| # | Hypothesis | Core Belief |
|---|-----------|------------|
| H1 | The Blueprint Generalizes | Patterns from Vortex + native teams are universal enough for any new team |
| H2 | Composition Patterns Cover All Cases | Independent and Sequential composition (+ Extension deployment) cover v1 needs |
| H3 | BMB Delegation Works | BMB's artifact generation can be called from a factory orchestration layer |
| H4 | Discoverable Process Beats Invisible Process | A fluent, visible factory workflow will be adopted by colleagues |
| H5 | The Reference Is Sufficient | A single Team Architecture Reference document is enough for factory workflows |

### Key Hypothesis Refinements During Analysis

**H2 — Originally "Three Archetypes Cover All Cases"**
First Principles Analysis revealed that archetypes should be classified by *composition pattern*, not directory structure. Socratic Questioning further collapsed five theoretical patterns to two real ones (Independent, Sequential) plus one deployment mechanism (Extension). Parallel and Hierarchical composition are theoretical — no existing BMAD examples.

**H4 — Originally "Enforced Process Beats Freedom"**
Thesis Defense revealed the real problem isn't that colleagues resist processes — they don't know processes exist or how to follow them fluently. Reframed from "enforcement" to "discoverability and fluency."

---

## Architecture Model (Post-Elicitation)

### Quality Framework: Four Properties
Every BMAD team capability must be:
1. **Discoverable** — users can find it (skill manifest, agent menu, module-help.csv) — *only property with proven failure evidence (WDS duplication)*
2. **Installable** — system can deploy it (registry, refresh pipeline)
3. **Configurable** — config connects it to user context (config.yaml variables)
4. **Composable** — capabilities can work together through defined interfaces

### Composition Patterns (v1)
| Pattern | Type | Status | Example |
|---------|------|--------|---------|
| **Independent** | Composition | Proven | BMM, CIS, TEA, WDS — agents work alone |
| **Sequential** | Composition | Proven | Vortex — agents hand off via contracts (HC1-HC5) |
| **Extension** | Deployment mechanism | Proven | Enhance — injects capabilities into existing agents |
| Parallel | Composition | Theoretical | No existing example. Party Mode is co-presence, not composition |
| Hierarchical | Composition | Theoretical | bmad-master routes, doesn't orchestrate |

### Design Principle
> The factory should be discoverable and fluent, not strict and enforced. The problem isn't that colleagues resist process — it's that they can't find it or don't know how to flow through it.

---

## Final Assumption Risk Map

### Test First (High priority)

| # | Assumption | Hypothesis | Lethality | Uncertainty | Suggested Method | Minimum Evidence |
|---|-----------|-----------|-----------|-------------|-----------------|-----------------|
| A5' | Four properties (discoverable, installable, configurable, composable) are the right quality framework | H1, H2, H5 | High | Medium | Build reference around them, validate against Gyre | Reference accurately predicts Gyre's strengths AND weaknesses |
| A6' | Composition patterns (Independent, Sequential) are the right classification basis | H2 | High | Medium | Categorize all known teams. Any that don't fit? | Every team cleanly maps to one or a mix of both |
| A4 | Gyre follows the same model as Vortex | H1, H2 | High | Medium | Structural diff against blueprint | Gyre passes same checklist as Vortex |
| A12 | BMB can scaffold submodules under `_bmad/bme/` | H3 | High | Medium | Technical spike: invoke BMB for `_bmad/bme/_test/` | BMB produces valid output in submodule path |
| A13 | Factory can call BMB as a sub-workflow without breaking its flow | H3 | High | Medium | Technical spike: call BMB from another workflow | BMB completes without breaking state |
| A19 | Surface-level BMAD user can follow the reference without mentoring | H5 | High | Medium | Give draft to one colleague, ask them to explain process | Colleague articulates steps without help |
| A22 | Factory workflow will be discoverable by colleagues who don't know it exists | H4, H5 | High | Medium | Check: where would a colleague look? Clear entry point? | Colleague finds the factory without being told where it is |

### Test Soon (Medium priority)

| # | Assumption | Hypothesis | Lethality | Uncertainty |
|---|-----------|-----------|-----------|-------------|
| A21' | Written reference organized around four properties + composition patterns is the right format | H5 | Medium | Medium |
| A11 | BMB doesn't need factory context to produce compatible artifacts | H3 | Medium | Medium |
| A17 | Process won't be too rigid for unexpected team designs | H4 | Medium | Medium |
| A18 | Tacit BMAD knowledge can be captured in a single document | H5 | Medium | Medium |
| A8 | Forge will fit one of the composition patterns | H2 | Medium | Medium |
| A7' | Factory doesn't need to explicitly support mixed composition declarations | H2 | Medium | Medium |
| A9' | 7 incoming teams' composition patterns expressible as Independent, Sequential, or mix | H2 | Low | Medium |

### Monitor (Low priority)

| # | Assumption | Hypothesis | Lethality | Uncertainty |
|---|-----------|-----------|-----------|-------------|
| A10 | BMB output format is stable enough to wire | H3 | Medium | Low |
| A3 | Today's audit captured all structural patterns | H1 | Medium | Low |
| A14' | Colleagues will discover and fluently follow the factory workflow when visible and intuitive | H4 | High | Low |
| A15' | Fast, obvious thinking steps prevent duplicate/broken teams | H4 | Medium | Low |
| A20 | Reference won't become stale as framework evolves | H5 | Low | Medium |
| A2 | Native BMAD teams follow consistent enough patterns | H1 | Medium | Low |
| A1 | Vortex directory structure is a pattern, not one-off | H1 | Low | Low |
| A16 | Colleagues comfortable with Claude Code | H4 | Low | Low |

---

## Flagged Concerns

| Concern | Assumption | Impact | Action |
|---------|-----------|--------|--------|
| Zero data on colleague workflow preferences | A22 | If factory isn't discoverable, no users | The reference IS the test — observe whether colleagues find and use it |
| 5 of 7 planned teams are undefined | A9' | Could break the model if unusual patterns emerge | Gather one-sentence descriptions when available. Not blocking |

---

## Routing Decision

**Route: Execute — Build the Architecture Reference**

Rationale:
- The reference simultaneously validates the highest-priority assumptions (A5', A6', A4)
- Sharing it with a colleague validates A19 and A22
- No assumptions require Isla's user discovery first
- No hypotheses need structural revision
- The Pragmatist challenge confirmed: stop analyzing, start building

**The Architecture Reference is not a deliverable that precedes validation — it IS the validation.**

---

## Session Insights (Non-Obvious Learnings)

1. **Archetypes should be classified by composition pattern, not directory structure** — First Principles Analysis
2. **Five theoretical patterns collapsed to two proven ones** — Socratic Questioning confirmed Parallel and Hierarchical are theoretical with no BMAD examples
3. **Extension is a deployment mechanism, not a composition pattern** — it modifies agents, doesn't compose them
4. **Enforcement is the wrong frame — fluency and discoverability are the real design constraints** — Thesis Defense revealed colleagues don't resist process, they can't find it
5. **Discoverability is the only quality property with proven failure evidence** (WDS duplication incident) — weight it highest in the reference

---

**Created with:** Convoke v2.3.1 - Vortex Pattern (Hypothesize Stream)
**Agent:** Liam (Hypothesis Engineer)
**Workflow:** assumption-mapping
**Elicitation:** First Principles Analysis, Socratic Questioning, Thesis Defense Simulation
