---
title: "Scope Decision: Strategy Perimeter"
date: 2026-04-04
created-by: Amalik with Emma (contextualization-expert)
type: scope-decision
status: DECIDED
version: 1.0
discovery-context: Self-Discovery Protocol — Vortex discovery on Strategy perimeter using Convoke as test case
pre-registration: pre-registration-strategy-perimeter-2026-04-04.md
---

# Scope Decision: Strategy Perimeter

## Decision Summary

**Selected Problem Space:** Strategic thinking as a structured, agent-mediated practice — encoding the flow from diagnosis through situational mapping to decision synthesis, with optional competitive and business model modules.

**Rationale:** The lifecycle expansion plan (v3) identified Strategy as missing Wave 0 infrastructure — the gravity model needs strategic evidence to sequence all downstream work. The scope was shaped by a key insight: the primary value isn't in the frameworks themselves (Porter, Wardley, BMC, Rumelt are well-documented) but in **the judgment of when and how to combine them** — expertise that takes years to develop and is expensive to transfer via mentoring.

**De-scoped (Not Now):**
- Strategy execution and tracking (PM territory — handoff contract SP-HC1 anticipated)
- Market research and data collection (Analyst/KE territory — consumption points tagged `[KE-CONSUMABLE]`)
- Financial modeling, industry-specific strategy, organizational strategy (see boundaries below)
- Strategy monitoring / entropy detection on strategic assumptions (Phase 2+)
- Multi-stakeholder strategy negotiation (Phase 2+)

---

## Problem Opportunities Considered

| ID | Opportunity | Description |
|----|-------------|-------------|
| A | **Strategic Diagnosis** | Teams jump to solutions without diagnosing the real strategic challenge or knowing which framework fits the situation |
| B | **Competitive & Market Positioning** | Teams don't systematically analyze competitive landscape; rely on instinct or outdated assumptions |
| C | **Business Model Design & Validation** | Teams haven't rigorously modeled value flow; BMC used as checkbox, not thinking tool |
| D | **Situational Awareness & Evolution Mapping** | Teams can't see where components sit on the evolution curve; over-invest in commodities, under-invest in differentiators |
| E | **Strategic Decision Synthesis** | After analysis, teams struggle to converge — the last mile from "we analyzed" to "we decided" is where strategies die |

---

## Evaluation Criteria

Equal weights (20% each) — deliberately symmetric at this stage. Weights to be reassessed after feedback from first engagements.

| # | Criterion | Weight | Measures |
|---|-----------|--------|----------|
| 1 | Leverage Depth | 20% | How much field experience can be leveraged (not cloned) to accelerate others |
| 2 | Generalizability | 20% | Works across business types and engagement contexts |
| 3 | Standalone Value | 20% | Delivers value independently of other opportunities |
| 4 | Differentiation | 20% | Unique value vs. existing tools, templates, and agents |
| 5 | Self-Discovery Fit | 20% | Validatable on the Convoke test case |

---

## Scoring Matrix

| Opportunity | Leverage (20%) | Generalizability (20%) | Standalone (20%) | Differentiation (20%) | Self-Discovery Fit (20%) | **Weighted** |
|-------------|:-:|:-:|:-:|:-:|:-:|:-:|
| **A — Strategic Diagnosis** | 8 | 9 | 9 | 7 | 8 | **8.2** |
| **D — Situational Awareness** | 9 | 7 | 6 | 9 | 7 | **7.6** |
| **E — Decision Synthesis** | 8 | 9 | 5 | 8 | 8 | **7.6** |
| **B — Competitive Positioning** | 6 | 7 | 7 | 5 | 7 | **6.4** |
| **C — Business Model Design** | 6 | 6 | 6 | 4 | 6 | **5.6** |

**Key insight:** The three highest-scoring opportunities (A, D, E) are exactly the ones identified as the mandatory core flow. B and C score lower because their value is contextual — important when activated, but not the perimeter's identity.

---

## Selected Scope

### Problem Space

A structured strategic thinking practice encoded as an agent team, with a mandatory core flow and optional expansion modules:

**Mandatory core flow:** A (Diagnose) → D (Map) → E (Decide)
**Optional modules:** B (Position) and C (Model) — activated when engagement context warrants

### Architecture: 4 Agents

| Agent | Strategic Activity | Mandatory | Audience |
|-------|-------------------|:---------:|----------|
| **Agent A** | Strategic Diagnosis — situation assessment, framework selection, challenge identification | Yes | Consultants + product teams (via Coach) |
| **Agent D** | Situational Awareness — evolution mapping, component analysis, build-vs-buy positioning | Yes | Consultants + product teams (via Coach) |
| **Agent E** | Decision Synthesis — trade-off structuring, multi-framework convergence, actionable recommendation | Yes | Consultants + product teams (via Coach) |
| **Strategy Coach** | Novice companion — explains reasoning, mediates between user and core agents, builds strategic literacy | Yes | Product teams, strategy novices |

**Design principles:**
- Agents own strategic *activities*, not theoretical frameworks
- Framework selection is orchestration logic — context determines which tools the agent reaches for
- Workflows produce artifacts describable without referencing any specific product (SC2)
- Coach pattern is replicable across other Convoke teams (Discovery Coach, Readiness Coach, etc.)

### Target Personas

| Persona | Description | Entry Point |
|---------|-------------|-------------|
| **Competent consultant** | Has foundations, needs synthesized judgment. Wants to work at expert level without 15+ years of accumulated pattern-matching. | Direct interaction with core agents (A, D, E) |
| **Product team (novice)** | May lack formal strategy training. Needs structured guidance through the right frameworks. | Strategy Coach mediates, explains, recommends |

### Boundaries (What's In)

- Strategic diagnosis with context-sensitive framework selection
- Situational awareness and evolution mapping (Wardley-informed but not Wardley-exclusive)
- Decision synthesis converging multi-framework analysis into actionable recommendations
- Strategy Coach for novice onboarding and reasoning transparency
- Optional competitive positioning module (B)
- Optional business model design module (C)
- Handoff contract design: Strategy → Discovery (SC4), Strategy → PM (SP-HC1 anticipated)
- `[KE-CONSUMABLE]` tags at all external knowledge consumption points — KE-ready from day one

### Boundaries (What's Out)

- **Strategy execution and tracking** — Strategy diagnoses and decides; execution is PM territory. **Anticipated handoff: SP-HC1 (Strategy → PM)** — recommendation artifact → roadmap input. Contract shape informs Decision Synthesis output format.
- **Market research and data collection** — Strategy agents *consume* market data; they don't gather it. **KE anticipation:** consumption points tagged `[KE-CONSUMABLE]` — ready for KE exposition layer when available, manual user input until then.
- **Financial modeling** — Strategic model design, not spreadsheet projections. Financial context is a `[KE-CONSUMABLE]` input.
- **Industry-specific strategy** — Domain-agnostic perimeter. Industry knowledge is a `[KE-CONSUMABLE]` input, not a built-in capability.
- **Organizational strategy** — Product/market strategy only. Governance perimeter (Wave 2) owns organizational transformation.

### Phase 2+ (Not Now)

- **Strategy monitoring** — Detecting when strategic assumptions are invalidated by market shifts (overlaps with Entropy monitoring baseline)
- **Strategy ↔ Forge integration** — Strategic priorities inform knowledge extraction. Handoff contract extensible (SC4) but not built in Phase 1.
- **Multi-stakeholder strategy** — Phase 1 assumes a single decision-maker or aligned team. Multi-stakeholder negotiation is Phase 2.
- **Coach pattern generalization** — Extracting the Coach pattern into a reusable template for other teams (Discovery Coach, Readiness Coach, etc.)

---

## Strategic Fit

| Dimension | Assessment | Verdict |
|-----------|------------|---------|
| **Vision Alignment** | Fills a named gap in the lifecycle expansion vision. Elevated to Wave 0 — foundational, not optional. | Strong fit |
| **Team Capabilities** | Domain expert (Amalik) has deep synthesis expertise for the consultant persona. Novice persona (product teams) has lower confidence — addressed by Strategy Coach agent and BP2 external validation. | Strong fit with known gap addressed |
| **Resource Requirements** | Runs parallel to Forge (in waiting/desk exercise mode). WIP-compliant. 4 agents at ~2 sprints domain authoring each = ~8 sprints total. | Feasible within planning horizon |
| **Market Timing** | Agentic AI space moving fast. Strategic grounding needed before committing to Wave 1-2 perimeters. Self-discovery protocol is a first-mover pattern. | Timing is right — deferral has a cost |

---

## Emergent Patterns (Discovery Byproducts)

Two replicable patterns emerged during scope contextualization:

1. **Coach Pattern** — A companion agent that mediates between sophisticated workflows and novice users. Explains reasoning, translates jargon, builds literacy. Applicable to any Convoke team where the primary agents target experienced practitioners.

2. **`[KE-CONSUMABLE]` Tagging** — Marking external knowledge consumption points in workflow design so that future KE integration has a ready-made spec. Applicable to any perimeter that consumes domain knowledge it doesn't own.

Both should be documented as platform-level patterns alongside the Self-Discovery Protocol (BP7).

---

## Next Steps

### Vortex Compass — Evidence-Driven Recommendations

| What we know | Recommended next | Agent | Why |
|---|---|---|---|
| Scope defined, two personas identified but not deeply characterized | **Lean Persona** for both personas | Emma 🎯 | Ground the agent design in who we're actually serving |
| Consultant persona well-understood, novice persona lower confidence | **User interview** or observation | Isla 🔍 | Validate novice persona assumptions before designing the Coach |
| Coach pattern emerged but is untested | **Hypothesis engineering** | Liam 💡 | Formalize "Coach pattern works for novices" as a testable hypothesis |

**Recommended immediate next:** Lean Personas (both consultant and product team) — staying with Emma before handing off to Isla for empathy validation on the novice persona.

---

**Created with:** Convoke v3.0.4 - Vortex Pattern (Contextualize Stream)
**Agent:** Emma (Contextualization Expert)
**Workflow:** contextualize-scope
**Discovery context:** Self-Discovery Protocol — Strategy Perimeter (Wave 0.4)
