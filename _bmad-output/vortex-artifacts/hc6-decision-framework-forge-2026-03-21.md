---
contract: HC6
type: artifact
source_agent: max
source_workflow: learning-card
target_agents: [emma, mila, liam, wade, noah]
input_artifacts:
  - path: "_bmad-output/vortex-artifacts/hc5-signal-framework-forge-2026-03-21.md"
    contract: HC5
  - path: "_bmad-output/vortex-artifacts/hc4-experiment-forge-shadow-2026-03-21.md"
    contract: HC4
  - path: "_bmad-output/vortex-artifacts/hc3-hypothesis-contract-forge-2026-03-21.md"
    contract: HC3
  - path: "_bmad-output/vortex-artifacts/hc2-problem-definition-forge-2026-03-21.md"
    contract: HC2
created: 2026-03-21
status: PRE-REGISTERED
tags: [forge, knowledge-extraction, KORE, decision-framework, brownfield-consulting]
---

# HC6 Decision Framework: Forge — Institutional Learning System

> **Status:** PRE-REGISTERED — decision gates defined, assumption cascades pre-registered. Activates when shadow engagement produces results.

---

## One-Sentence Summary

We have designed but not yet validated that structured knowledge extraction (KORE method) will reduce consultant ramp time by 50%+ and produce reusable Tribal Knowledge Assets, which means the next action is to execute the shadow engagement on the first available brownfield engagement and let the pre-registered decision criteria determine Forge's fate.

**Confidence:** EXPLORATORY — framework complete, zero data. Will upgrade to LOW after shadow engagement, MEDIUM after 3 engagements, HIGH after 5+ with Gyre integration.

---

## Vortex Discovery Completeness

| Stream | Agent | Artifact | Status |
|--------|-------|----------|--------|
| 1. Contextualize | Emma 🎯 | [scope-decision-forge-2026-03-21.md](scope-decision-forge-2026-03-21.md) | Complete — Forge selected at 4.65/5, 6 alternatives de-scoped |
| 2. Empathize | Emma 🎯 | [lean-persona-landing-consultant](lean-persona-landing-consultant-2026-03-21.md), [lean-persona-knowledge-holder](lean-persona-knowledge-holder-2026-03-21.md) | Complete — 2 personas, JTBD defined, forces mapped |
| 3. Synthesize | Mila 🔬 | [hc2-problem-definition-forge](hc2-problem-definition-forge-2026-03-21.md) | Complete — converged problem, 6 pains, 4 gains, 6 assumptions |
| 4. Hypothesize | Liam 💡 | [hc3-hypothesis-contract-forge](hc3-hypothesis-contract-forge-2026-03-21.md) | Complete — 3 hypotheses, 11 assumptions, testing order |
| 5. Externalize | Wade 🧪 | [hc4-experiment-forge-shadow](hc4-experiment-forge-shadow-2026-03-21.md) | Complete — shadow engagement designed, metrics pre-registered |
| 6. Sensitize | Noah 📡 | [hc5-signal-framework-forge](hc5-signal-framework-forge-2026-03-21.md) | Complete — 15 signals, 6 anomaly patterns, 3-tier monitoring |
| 7. Systematize | Max 🧭 | This document | Complete — 4 decision gates, assumption cascades, strategy implications |

**Full Vortex cycle complete.** All 7 streams have produced artifacts. The discovery phase is done. The next phase is execution (shadow engagement → data → decisions).

---

## Decision Gates

### Gate 1: Shadow Engagement Complete (Week 6 of Experiment)

**Purpose:** Validate the KORE methodology with a human following it

**Input:** HC4 pre-registered metrics — 3 primary, 9 secondary, 3 guardrails

**Decision matrix:**

| Outcome | Trigger | Action | Next Gate |
|---------|---------|--------|-----------|
| **Full Persevere** | ALL 3 primary metrics meet target | Methodology validated. Proceed to Gate 2 | Gate 2 |
| **Partial Persevere** | 2 of 3 meet target, failed metric borderline | Patch failed phase. Re-test on next engagement | Gate 1 (re-run) |
| **Patch** | 1-2 fail but methodology rating ≥3 | Redesign failing components. Run patched experiment | Gate 1 (re-run) |
| **Pivot** | All fail, rating ≤2, or guardrail triggered | Return to Mila (HC2 re-synthesis). Methodology doesn't work as designed | Back to Stream 3 |

**Phase-specific failure responses:**

| Phase Failed | Likely Cause | Patch |
|-------------|-------------|-------|
| Survey (V1, A5) | Silo too rigid for client structure | Modularize Silo checklist. Re-test on different client |
| Extraction (Q1, Q2, A6) | Preparation didn't outperform brain-dump | Consider post-hoc Rune (process after, not guide during) |
| Delivery (V3, Q5, A3) | TKAs not referenced | Redesign TKA format for decision context, not extraction context |

---

### Gate 2: Forge Phase A Build Decision

**Purpose:** Decide whether to invest in building Forge as a Convoke team module

**Prerequisites:**
1. Gate 1 = Full or Partial Persevere (methodology validated)
2. ADR-001 Phase 4 complete (Enhance templates locked)

**Decision matrix:**

| Condition | Decision | Rationale |
|-----------|----------|-----------|
| Both prerequisites met | **Build** — scaffold Forge via Enhance (ADR-001 Task 4) | Methodology validated + infrastructure ready |
| Gate 1 passed, Enhance not ready | **Defer** — continue manual KORE on engagements | Don't hand-craft what Enhance will scaffold. Use delay to gather more engagement data |
| Gate 1 patched, passing on re-run | **Build with caution** — scaffold but plan early Gate 3 | Methodology partially validated. Agent implementation may surface new issues |

---

### Gate 3: Early Production Review (3 Engagements with Agents)

**Purpose:** Verify agent implementation preserves methodology value

**Input:** Noah's Tier 1 vital signs (V1-V5) across 3 engagements

**Decision matrix:**

| Outcome | Trigger | Action |
|---------|---------|--------|
| **Continue** | All vital signs Healthy in ≥2 of 3 engagements | Forge agents work. Proceed to Gyre integration (Epic 4 of Phase A) |
| **Adjust** | 1-2 vital signs in Warning | Identify which agent needs refinement. Ship patch before next engagement |
| **Pause** | Any vital sign Critical in ≥2 engagements | Agent implementation is degrading the methodology. Investigate: is automation introducing friction the human didn't have? |

**Key question at this gate:** Does the Silo/Rune agent experience match or exceed the manual concierge experience? If agents are worse, the problem is implementation, not methodology.

---

### Gate 4: Ecosystem Integration Review (5 Engagements + Gyre Live)

**Purpose:** Validate the Forge↔Gyre compounding value cycle

**Input:** Noah's Tier 3 (E1-E4) + Tier 2 trends (Q1-Q5)

**Decision matrix:**

| Outcome | Trigger | Action |
|---------|---------|--------|
| **Scale** | E1-E4 Healthy + Q1-Q5 Healthy trends | Full ecosystem value confirmed. Proceed to Forge Phase B (Aria) |
| **Refine** | E1-E2 Warning (format issues) | FG-HC1 format needs revision. Adjust TKA template for better Gyre compatibility |
| **Descope** | E3 inactive + E4 Critical | Compound learning bet (H3) lost. Accept per-engagement value only. Defer Phase B |

**Strategic implication of Descope:** Forge still delivers value (per-engagement ramp reduction), but the ecosystem multiplier doesn't materialize. This changes Forge from a "team" to potentially 1-2 agents that could be absorbed into an existing team (per Capability Evaluation Framework demotion triggers).

---

## Assumption Cascade by Scenario

### Full Persevere

| Assumption | Before | After | Note |
|-----------|--------|-------|------|
| A1 (adoption) | Assumed | Partially Validated | n=1. Need 3+ for confidence |
| A2 (structured > unstructured) | Assumed | Partially Validated | A/B was directional (n=3 per condition) |
| A3 (TKA utility) | Assumed | Partially Validated | Used in delivery. Novelty or sustained? Watch Q5 |
| A5 (week 1 coverage) | Assumed | Partially Validated | Worked at this client. U1 still open |
| A6 (stakeholder preference) | Assumed | Partially Validated | Won the A/B. Directional only |
| **A5d (cross-engagement)** | **Assumed** | **Unchanged** | **Cannot test in single engagement** |

### TKA Utility Fails (A3 Invalidated)

| Impact | Change |
|--------|--------|
| Value proposition | Shifts to "better knowledge mapping" not "better knowledge artifacts" |
| Forge scope | May become Silo-only (1 agent). Rune's TKA production is its primary output |
| Gyre integration | FG-HC1 weakened — TKAs don't exist to feed Gyre. Integration value drops |
| Capability tier | Consider demotion: Team → Agent (per Capability Evaluation Framework) |

### Stakeholder Preference Fails (A6 Invalidated)

| Impact | Change |
|--------|--------|
| Value proposition | "Better for consultants" only, not "better for both sides" |
| Rune design | Redesign: post-hoc processing of brain-dumps instead of guided facilitation |
| Stakeholder persona | Knowledge Holder becomes passive source only, not engaged participant |
| TKA quality | May decrease — unstructured input = unstructured output. Compensate with better post-processing |

### Full Pivot (All Fail)

| Impact | Change |
|--------|--------|
| Value proposition | Unproven. Knowledge extraction may not be structurable |
| Forge | Paused. Not cancelled — learning captured for future re-examination |
| ADR-001 | Unaffected — Enhance framework proceeds (not dependent on Forge) |
| Ecosystem | Friction log capture accelerated. Look for new demand signals |
| Key question | Is the problem real but the solution wrong? Or did we misunderstand the problem? |

---

## Strategy Implications Pre-Registered

| Outcome | Value Proposition | Target User | Build Sequence |
|---------|------------------|-------------|----------------|
| Full Persevere | "Structured extraction saves 50%+ ramp time" confirmed | Mid-level consultants, brownfield | ADR-001 proceeds: Enhance → Vortex redesign → Forge |
| A3 fails | Shifts to "better mapping, not better artifacts" | Same users, narrower JTBD | Forge may descope to Silo-only (1 agent in existing team) |
| A6 fails | "Better for consultants" only | Same primary user, stakeholder passive | Rune redesign (post-hoc, not guided) |
| All fail | Unproven | Reconsider problem framing | Forge paused. Friction logs accelerated |

---

## Recommended Next Actions

### Immediately
1. **Identify shadow engagement candidate** — mid-level consultant, brownfield engagement starting within next 4 weeks
2. **Prepare experiment materials** — Silo checklist, Rune prep template, TKA template, tracking spreadsheet, interview guide (as defined in HC4)
3. **Brief the consultant** — 30 min orientation on KORE methodology. Emphasize: "follow the method, be honest about what works and doesn't"

### This Sprint (ADR-001 Context)
4. **Continue Gyre E1** — Forge validation is independent of Gyre implementation. Both tracks proceed in parallel
5. **Update initiatives backlog** — Forge discovery complete (P9-disc → P9 status: Ready for Experiment). Shadow engagement is the next milestone

### This Quarter
6. **Run the shadow engagement** — 6 weeks of data collection following HC4 protocol
7. **Execute Gate 1 decision** — use pre-registered criteria, not improvised judgment
8. **If Gate 1 passes:** Assess ADR-001 Phase 4 readiness for Gate 2

### Flag for Review
9. **Zero direct user validation** — Liam flagged this. Consider 5 quick consultant interviews (~1 week) to de-risk A1 before committing to 6-week shadow engagement. This is optional but recommended
10. **Senior consultant inclusion** — Include ≥1 senior consultant by engagement 3 to test U2 (cultural adoption)

---

## Learning Links

| Relationship | Reference |
|-------------|-----------|
| **Builds on** | Scope decision (Stream 1) — Forge selected from 7 opportunities |
| **Builds on** | Capability Evaluation Framework — Forge entered as Tier 3 (Team), with demotion path to Tier 2 if scope shrinks |
| **Builds on** | ADR-001 — Forge is Task 4 in build sequence, scaffolded by Enhance |
| **Informs** | Forge Phase A epics (`epics-forge-phase-a.md`) — build proceeds only after Gate 1+2 pass |
| **Informs** | Forge↔Gyre handoff contracts (`forge-gyre-handoff-contract.md`) — FG-HC1/HC2/GF-HC1 activate at Gate 4 |
| **Contradicts** | Nothing yet — first Vortex cycle |
| **Enables** | Future learning cards from shadow engagement results |
| **Enables** | Forge Phase B discovery (Aria — codification) if Gate 4 passes |

---

## The Forge Learning Cycle

```
                    ┌─────────────────────────────────────────┐
                    │         VORTEX DISCOVERY (COMPLETE)       │
                    │  Scope → Personas → Problem → Hypotheses │
                    │  → Experiment → Signals → Decisions       │
                    └──────────────────┬──────────────────────┘
                                       │
                                       ▼
                    ┌─────────────────────────────────────────┐
                    │       SHADOW ENGAGEMENT (NEXT)           │
                    │  Manual KORE: Silo survey + Rune extract │
                    │  6 weeks, 1 consultant, pre-registered   │
                    └──────────────────┬──────────────────────┘
                                       │
                              ┌────────┴────────┐
                              ▼                  ▼
                    ┌───────────────┐   ┌──────────────────┐
                    │   GATE 1:     │   │   GATE 1:        │
                    │   PASS        │   │   FAIL           │
                    │   Methodology │   │   Patch/Pivot    │
                    │   validated   │   │   Re-test or     │
                    └───────┬───────┘   │   re-synthesize  │
                            │           └──────────────────┘
                            ▼
                    ┌─────────────────────────────────────────┐
                    │       GATE 2: BUILD DECISION             │
                    │  Requires: Gate 1 pass + Enhance ready   │
                    │  Output: Scaffold Forge via Enhance      │
                    └──────────────────┬──────────────────────┘
                            │
                            ▼
                    ┌─────────────────────────────────────────┐
                    │   GATE 3: EARLY PRODUCTION (3 engmt)    │
                    │   Do agents preserve methodology value?  │
                    └──────────────────┬──────────────────────┘
                            │
                            ▼
                    ┌─────────────────────────────────────────┐
                    │   GATE 4: ECOSYSTEM (5 engmt + Gyre)    │
                    │   Does Forge↔Gyre compound value?        │
                    │   Scale / Refine / Descope               │
                    └─────────────────────────────────────────┘
```

---

**Created with:** Convoke v2.3.1 - Vortex Pattern (Systematize Stream)
**Agent:** Max (Learning & Decision Expert)
**Workflow:** learning-card
