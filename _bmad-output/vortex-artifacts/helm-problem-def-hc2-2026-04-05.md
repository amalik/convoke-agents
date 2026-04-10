---
contract: HC2
type: artifact
source_agent: mila
source_workflow: research-convergence
target_agents: [liam]
input_artifacts:
  - path: "_bmad-output/vortex-artifacts/pre-registration-strategy-perimeter-2026-04-04.md"
    contract: non-HC1 (pre-registration)
  - path: "_bmad-output/vortex-artifacts/scope-decision-strategy-perimeter-2026-04-04.md"
    contract: non-HC1 (scope decision)
  - path: "_bmad-output/vortex-artifacts/lean-persona-strategic-practitioner-2026-04-04.md"
    contract: non-HC1 (lean persona)
  - path: "_bmad-output/vortex-artifacts/lean-persona-strategic-navigator-2026-04-04.md"
    contract: non-HC1 (lean persona)
  - path: "_bmad-output/vortex-artifacts/empathy-map-strategic-navigator-2026-04-05.md"
    contract: non-HC1 (empathy map)
  - path: "_bmad-output/planning-artifacts/lifecycle-expansion-plan.md"
    contract: non-HC1 (planning artifact)
  - path: "docs/lifecycle-expansion-vision.md"
    contract: non-HC1 (vision document)
created: 2026-04-05
discovery-context: Self-Discovery Protocol — Strategy Perimeter (Wave 0.4)
---

# HC2 Problem Definition: Strategy Perimeter

## 1. Converged Problem Statement

**Problem Statement:**
Strategic practitioners and product teams share a common problem: the judgment layer between "I have strategy frameworks" and "I made a defensible decision" doesn't exist as a transferable, structured practice. Individual frameworks (Porter, Wardley, BMC, Rumelt) are well-documented and teachable, but the critical capabilities — diagnosing which framework fits a situation, combining outputs from multiple frameworks, and synthesizing into a defensible recommendation — live exclusively in experienced practitioners' heads. This judgment takes 15+ years to develop, transfers only through expensive 1:1 mentoring, and disappears when the expert leaves. Meanwhile, novice teams cope by reverse-engineering strategy from their existing product, skipping analysis entirely, or filling templates without interpretation guidance. Both populations — experts and novices — suffer from confidence gaps that prevent them from acting on analysis they've already done, regardless of its actual quality.

**Confidence:** Medium
- Strong convergence across 7 artifacts on the integration gap, judgment transfer problem, and confidence bottleneck
- Practitioner persona is high-confidence (grounded in domain expert's direct experience)
- Navigator persona is low-confidence (expert-projected, no direct novice research)
- The confidence-competence decoupling insight is a convergence finding across multiple artifacts but untested

**Scope:**

*In scope:*
- Strategic diagnosis (situation assessment, framework selection logic)
- Situational awareness and evolution mapping
- Decision synthesis (multi-framework convergence into actionable recommendation)
- Confidence building through coverage verification and structured challenge
- Coach agent for novice onboarding and reasoning transparency
- Optional competitive positioning and business model design modules
- Strategy → Discovery handoff contract (SC4)
- `[KE-CONSUMABLE]` tagging for future Forge/KE integration

*Out of scope:*
- Strategy execution and tracking (PM territory — SP-HC1 handoff anticipated)
- Market research and data collection (Analyst/KE territory)
- Financial modeling, industry-specific strategy, organizational strategy
- Strategy monitoring / entropy detection (Phase 2+)
- Multi-stakeholder strategy negotiation (Phase 2+)

---

## 2. Jobs-to-be-Done

### Primary JTBD — Strategic Practitioner

> **When** I land on a new consulting engagement or face a product inflection point with days to produce a recommendation,
> **I want to** systematically diagnose the situation, select the right analytical frameworks, and synthesize across them into a single defensible position,
> **so I can** deliver a recommendation I'm confident in — one that accounts for blind spots and is grounded in both top-down analysis and bottom-up reality.

### Related JTBD — Strategic Navigator

> **When** my board, investors, or co-founder asks for "our strategy" and I have days to produce something I'll be judged on,
> **I want to** think through the decision using whatever strategic knowledge I have, with guidance that fills gaps I can't name and tells me which angles I'm missing,
> **so I can** walk into that room and present an analysis I understand, own, and can defend — not something that feels borrowed or fake.

### Convergence Point

Both JTBDs converge on a single root cause: the absence of a structured integration layer that confers both rigor and confidence. The functional job is the same (diagnose, select, synthesize, decide); the emotional and social jobs differ in intensity, not kind.

### Job Types

**Functional Job:**
Produce a strategic assessment that correctly diagnoses the situation, selects appropriate analytical frameworks, and synthesizes findings into an actionable recommendation. Measurable: completed in days (not weeks), covers relevant strategic angles, produces concrete decisions.

*Evidence:* Scope decision scoring — A (Diagnosis) 8.2, D (Situational Awareness) 7.6, E (Decision Synthesis) 7.6. Practitioner target: 1-2 days. Navigator target: <1 week part-time.

**Emotional Job:**
Feel confident that the analysis is rigorous enough — that blind spots have been surfaced, that the right lens was chosen, and that the recommendation will survive challenge.

*Evidence:* Convergence finding — confidence-competence decoupling across both personas. Practitioner: blind spot anxiety. Navigator: impostor anxiety. Both seek reassurance through informal gut-check calls.

**Social Job:**
Be perceived as someone who thinks strategically — by clients, boards, investors, and peers. Protect and build professional credibility around strategic judgment.

*Evidence:* Practitioner anxiety: "peers see me using AI tool." Navigator anxiety: "if I ask questions, they'll realize I don't belong." Both manage reputation alongside analysis.

---

## 3. Pains

| # | Pain | Priority | Frequency | Intensity | Evidence Sources | Current Coping |
|---|------|----------|-----------|-----------|-----------------|----------------|
| P1 | **No diagnostic layer** — no structured way to assess situation type before selecting frameworks | High | Every engagement | Cascading — wrong diagnosis pollutes entire analysis | Scope decision (A=8.2). Practitioner pain #1. Navigator pain #4. | Gut selection (practitioner). Google search, first blog recommendation (navigator). |
| P2 | **Synthesis in heads, not process** — combining multi-framework outputs into one recommendation has no external structure | High | Every engagement | Limits quality to individual skill; untransferable | Practitioner pain #2. Amalik testimony. Convergence theme #2. | Mental models. Slides as synthesis proxy. |
| P3 | **Confidence-competence decoupling** — both personas doubt their analysis regardless of actual quality | High | Every engagement | Prevents action on completed analysis; drives rework and gut-check calls | Practitioner pain #3. Navigator empathy map (impostor anxiety). Convergence finding. | Peer challenge session (practitioner). Gut-check call (navigator). Both informal, unstructured. |
| P4 | **Top-down without bottom-up** — analysis built on unverified assumptions about operational reality | High | Per engagement, invisible until failure | Recommendations that don't survive field contact; credibility damage | Practitioner pain #6. Amalik: "main anti-pattern." KE-consumable design. | Early field visits (best practitioners). Skipped under time pressure (most). |
| P5 | **Legitimacy void** — strategy isn't part of daily role, then suddenly demanded | High | Per board/investor trigger (2-4/yr) | Approaches strategy from doubt, not ownership | Navigator pain #1. Empathy map observations. | Avoidance until forced. Reverse-engineering from product. |
| P6 | **Knowledge transfer impossible** — expert judgment doesn't externalize, novice fragments don't integrate | Medium | Continuous | Mentoring bottleneck (expert). Template graveyard (novice). | Both personas. Amalik testimony. Convergence theme #2. | Shadowing (experts). Give up or hire consultant (novices). |

---

## 4. Gains

| # | Gain | Priority | Expected Impact | Evidence Sources |
|---|------|----------|----------------|-----------------|
| G1 | **Structured diagnosis before analysis** — know the situation type before selecting frameworks | High | Eliminates wrong-lens starts. Resolves P1. | Scope decision: Agent A at 8.2. SC1: agents own strategic activities. |
| G2 | **Externalized synthesis process** — structured convergence from multi-framework analysis to recommendation | High | Judgment becomes transferable. Resolves P2 + P6. | Scope decision: Agent E at 7.6. Amalik's core motivation. |
| G3 | **Coverage verification + confidence** — systematic check that relevant angles are covered, with explicit rationale for what's parked | High | Resolves P3 for both personas. Highest-leverage single design target. | Practitioner success metric #3. Navigator gain #2. Convergence: confidence is universal bottleneck. |
| G4 | **Bottom-up grounding hooks** — explicit integration points for operational evidence | High | Resolves P4. Recommendations survive field contact. | KE-consumable tagging. Forge↔Strategy relationship. Amalik: "main anti-pattern." |
| G5 | **Strategic sparring partner** — thinks alongside, challenges assumptions, sustains curiosity flashes | High | Resolves P3 (confidence) + P5 (legitimacy). Transforms strategy from endured to owned. | Empathy map: gut-check call coping. Navigator gains #1 + #3. Coach design brief. |
| G6 | **Graduated learning path** — novice builds literacy through use, eventually engages core agents directly | Medium | Resolves P6 long-term. Navigator graduates to practitioner-level. | Navigator success metric #5. Coach pattern. |

**Highest-leverage opportunity:** G3 (coverage verification + confidence) resolves P3 for both personas simultaneously. If the Strategy perimeter does one thing well, it should make both expert and novice confident their analysis is rigorous enough to act on.

---

## 5. Evidence Summary

| Field | Detail |
|-------|--------|
| **Artifacts Analyzed** | 7 (pre-registration, scope decision, 2 lean personas, empathy map, expansion plan, vision document) |
| **Total Evidence Points** | ~45 discrete findings: 5 scope evaluation criteria, 5 opportunity scores, 6 practitioner pains, 6 navigator pains, 5 navigator says, 5 navigator thinks, 5 navigator does, 5 navigator feels, 5 navigator gains, expert testimony (1 primary statement + 5 field observations) |
| **Convergence Assessment** | **Strong on root cause.** All 7 artifacts point to the integration gap from different angles. Confidence-competence decoupling emerged as a cross-artifact finding. 4 themes identified with 3+ artifact support each. The convergence on "structured integration layer that confers both rigor and confidence" is the strongest signal. |
| **Contradictions** | 2 identified: (1) Practitioner "my approach works" vs. "did I choose the right lens?" — resolved as: approach works most of the time, but can't distinguish success from luck. (2) Confidence vs. competence decoupled in opposite directions across personas — resolved as: same underlying force (confidence bottleneck), different manifestations. |
| **Evidence Gaps** | **Critical:** No direct novice research — Navigator persona and empathy map are expert-projected. **Important:** No competitive landscape data (will emerge from Convoke self-discovery case). Transferability (RA3) untested. Coach pattern (NRA2) unproven. |

### Evidence Provenance

| Finding | Primary Source | Supporting Sources |
|---------|---------------|-------------------|
| Integration gap is the real problem | Scope decision (A=8.2, highest score) | Both personas, vision document, Amalik testimony |
| Judgment doesn't transfer | Amalik testimony ("lighten cognitive load") | Practitioner persona (P6), Navigator persona (template graveyard) |
| Confidence is the universal bottleneck | Cross-artifact convergence finding | Practitioner (blind spots), Navigator (impostor), empathy map (relief-not-pride) |
| Top-down without bottom-up is the main anti-pattern | Amalik direct observation | Practitioner persona, KE-consumable design decision |
| Legitimacy void drives novice behavior | Empathy map (5 observations from Amalik) | Navigator persona, navigator JTBD |
| Curiosity flashes are the Coach entry point | Empathy map (Isla analysis) | Amalik confirmed as "very common" pattern |

---

## 6. Assumptions

| # | Assumption | Basis | Risk if Wrong | Validation Status |
|---|-----------|-------|---------------|-------------------|
| RA1 | The integration layer is the real gap, not framework execution | Scope scoring + Amalik testimony + convergence theme #1 | Agents should be framework tutors, not integration orchestrators | Assumed — test during Convoke self-discovery case |
| RA2 | Structured diagnosis won't feel like overhead under time pressure | Practitioner persona success criteria + 15-minute test design | Adoption dies — the core workflow is rejected | Assumed — test during Convoke case |
| RA3 | Transferability works — second practitioner produces defensible output | Amalik's core motivation (the whole point) | Tool works for experts who don't need it; novices still can't use it | Assumed — test with peer after discovery |
| NRA1 | Scattered knowledge is the norm for novices, not zero knowledge | Amalik observation: "usually they've been trained" | Coach needs to teach fundamentals, not just integrate fragments | Partially validated (expert observation) |
| NRA2 | A Coach agent can bridge the confidence gap | Amalik: "confidence gap occurs in both AI and human contexts" | Coach pattern has fundamental limits | Partially validated (single observation) |
| NRA3 | Strategy squeezed into margins still produces defensible output | Navigator persona time constraints | Workflows need redesign or novice path requires more time | Assumed |
| A7 | The 4 theoretical foundations (Porter, Wardley, BMC, Rumelt) are sufficient coverage | Vision document + scope decision | Missing frameworks produce blind spots in the integration layer itself | Assumed |
| A8 | The Coach pattern is replicable across other Convoke teams | Emerged during scope contextualization (Carson's insight) | Coach is Strategy-specific, not a platform pattern | Assumed — too early to validate |
| A9 | KE-consumable tagging will create natural integration points for Forge | Scope decision design principle | Tagging is theater without actual KE exposition layer | Assumed — depends on Forge Gate 2 decision |

---

## Design Implications for Liam

**Agent architecture grounded in this problem definition:**

| Agent | Strategic Activity | Resolves Pain(s) | Delivers Gain(s) |
|-------|-------------------|-------------------|-------------------|
| Agent A | Strategic Diagnosis — situation assessment, framework selection | P1 (no diagnostic), P4 (top-down, via grounding hooks) | G1 (structured diagnosis), G4 (bottom-up hooks) |
| Agent D | Situational Awareness — evolution mapping, component analysis | P1 (framework selection), P4 (top-down) | G1 (right lens), G3 (coverage) |
| Agent E | Decision Synthesis — trade-off structuring, multi-framework convergence | P2 (synthesis in heads), P3 (confidence via coverage check) | G2 (externalized synthesis), G3 (coverage + confidence) |
| Strategy Coach | Novice companion — explains reasoning, confers legitimacy, sustains curiosity | P3 (confidence), P5 (legitimacy), P6 (transfer) | G3 (confidence), G5 (sparring partner), G6 (graduated learning) |

**Highest-leverage hypothesis for Liam:** G3 (coverage verification + confidence) resolves P3 for both personas simultaneously. If one hypothesis must be tested first, it should be: "Does structured coverage verification increase confidence enough to change behavior (acting on analysis instead of seeking gut-check reassurance)?"

**Handoff contracts to design:**
- Strategy → Discovery (SC4): strategic grounding feeds Emma's Contextualize stream
- Strategy → PM (SP-HC1, anticipated): recommendation artifact feeds product roadmap
- Both extensible to future consumers (Forge, others)

---

## Vortex Compass — Routing Decision

| What we know | Confidence | Recommended next | Agent | Why |
|---|---|---|---|---|
| Converged problem with strong root cause identification | Medium (practitioner high, navigator low) | **Hypothesis engineering** | Liam 💡 | 9 assumptions to formalize into testable contracts. RA1-3 are the make-or-break bets. |
| Navigator persona unvalidated | Low | **User interviews** (parallel) | Isla 🔍 | NRA1-3 need direct novice input before Coach design |
| Coach pattern emerged but unproven | Low | **Hypothesis contract** | Liam 💡 | Coach is a bet — formalize it as such |

**Primary routing: Liam** — this HC2 is ready for hypothesis engineering. The problem is converged, the assumptions are explicit, and the design implications map directly to testable hypotheses.

**Parallel routing: Isla** — design an interview guide for novice validation. This doesn't block Liam's work but strengthens the evidence base for NRA1-3.

---

**Created with:** Convoke v3.0.4 - Vortex Pattern (Synthesize Stream)
**Agent:** Mila (Research Convergence Specialist)
**Workflow:** research-convergence
**Discovery context:** Self-Discovery Protocol — Strategy Perimeter (Wave 0.4)
