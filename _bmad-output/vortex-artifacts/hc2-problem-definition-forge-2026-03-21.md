---
contract: HC2
type: artifact
source_agent: mila
source_workflow: research-convergence
target_agents: [liam]
input_artifacts:
  - path: "_bmad-output/vortex-artifacts/scope-decision-forge-2026-03-21.md"
    contract: non-HC1 (contextualize-scope output)
  - path: "_bmad-output/vortex-artifacts/lean-persona-landing-consultant-2026-03-21.md"
    contract: non-HC1 (lean-persona output)
  - path: "_bmad-output/vortex-artifacts/lean-persona-knowledge-holder-2026-03-21.md"
    contract: non-HC1 (lean-persona output)
created: 2026-03-21
---

# HC2 Problem Definition: Forge — Domain Knowledge Extraction

> **Confidence:** Medium-High — strong convergence across 3 artifacts on core problem. Evidence gap: no direct user validation yet.

## Converged Problem Statement

IT consultants conducting enterprise brownfield engagements face a structural knowledge asymmetry problem: tribal knowledge is trapped in client personnel's heads, documentation is stale or missing, and no institutional method exists to extract, structure, and persist that knowledge. Consultants burn 40-80 hours per engagement on ad-hoc knowledge archaeology — improvising meetings, reading outdated wikis, and taking notes that die with the individual. The stakeholders who hold the knowledge are fatigued by unfocused sessions and frustrated by repeating themselves to successive consultants. The result: delayed value delivery, wrong recommendations from incomplete understanding, and zero compound learning across engagements.

Forge addresses this by providing a structured, agent-guided extraction methodology (KORE) that maps the knowledge landscape in week 1 (Silo) and excavates tribal knowledge into reusable Tribal Knowledge Assets in weeks 2-4 (Rune) — assets that serve both the consultant's delivery work and Gyre's contextual model via FG-HC1.

**Scope:**
- **In:** Knowledge extraction for IT consultants in enterprise brownfield engagements (Phase A: Silo + Rune agents)
- **Out:** Knowledge codification (Aria — Phase B), validation (Sage — Phase C), stewardship (Warden — Phase C), greenfield projects, non-technical domain knowledge

---

## Jobs-to-be-Done

### Primary JTBD

> **When** I land in an unfamiliar enterprise brownfield environment with weeks — not months — to deliver value,
> **I want to** systematically map the knowledge landscape and extract tribal knowledge into structured, reusable assets,
> **so I can** make sound recommendations from week 2 instead of week 4, and leave behind knowledge that the next consultant (or Gyre) can use without re-extracting.

### Functional Job
Extract and structure domain knowledge from an enterprise environment — mapping systems, identifying knowledge holders, conducting targeted extraction sessions, and producing Tribal Knowledge Assets (TKAs) that are reusable and Gyre-compatible.

**Evidence:** Scope decision (40-80 hours on archaeology, 5/5 engagement frequency), Consultant persona (success metrics: ≤20 hours, 3-8 TKAs produced, FG-HC1 compliance)

### Emotional Job
Feel competent and in control during the most disorienting phase of an engagement — when everything is new and the client is watching.

**Evidence:** Consultant persona (state of mind: "cognitive overload, simultaneously learning, relationship-building, trying to appear competent"), forces ("professional reputation — understanding the landscape in week 2 = credibility"), anxieties ("will it make me look junior?")

### Social Job
Be perceived by the client as a consultant who "gets it" quickly — someone who asks smart questions, doesn't waste stakeholder time, and delivers structured understanding that impresses.

**Evidence:** Consultant persona (trigger: "client frustration — didn't we already explain this?"), Stakeholder persona (desired outcome: "the consultant asked smart, specific questions"), scope decision (quality cost: "wrong recommendations → eroded client trust")

---

## Pains

| # | Pain | Priority | Frequency | Intensity | Evidence Sources | Current Coping |
|---|------|----------|-----------|-----------|-----------------|----------------|
| P1 | **No map of what to learn** — consultant doesn't know what they don't know. Weeks pass before discovering critical systems or knowledge holders | High | Every engagement, day 1 | Blocks productive work for 1-2 weeks | Scope decision (5/5 freq), Consultant persona (pain #1) | Personal "who knows what" spreadsheet |
| P2 | **Stale documentation trap** — hours spent reading wiki pages last updated 18 months ago | High | Every engagement, week 1 | 5-15 hours wasted per engagement | Consultant persona (pain #2) | Ask in meetings "is this still accurate?" |
| P3 | **Tribal knowledge in heads** — critical knowledge locked in 2-3 people who may be unavailable or defensive | High | Every engagement, weeks 1-4 | Blocks delivery if gatekeepers unavailable | Scope decision (core problem statement), Consultant persona (pain #3) | Pair with senior dev for brain dump |
| P4 | **No structured output** — knowledge extracted in meetings evaporates. Personal notes are unstructured, unsearchable, and die with the individual | High | Every extraction session | Cumulative: 40-80 hours produce nothing reusable | Consultant persona (pain #4), Stakeholder persona (pain #2: "repeating myself") | Verbose notes, never organized |
| P5 | **Stakeholder fatigue** — too many unfocused meetings exhaust knowledge holders | Medium | Weeks 1-4, per stakeholder | Reduces data quality as stakeholder disengages | Stakeholder persona (pains #1, #3, #5) | Delegate to tech lead, deflect, document-dump |
| P6 | **Reinvented every time** — no institutional method. Each consultant develops their own approach from scratch | Medium | Every engagement | Firm loses compound learning. No improvement curve | Scope decision (boundary), Consultant persona (pain #5) | Each consultant develops personal approach |

**Root cause convergence:** P1-P4 converge on a single root cause: **unstructured process**. There is no method to guide what to learn (P1), validate what's current (P2), extract what's tacit (P3), or persist what's captured (P4). P5-P6 are systemic consequences: stakeholders bear the cost of process absence (P5), and the firm never learns (P6).

---

## Gains

| # | Gain | Priority | Expected Impact | Evidence Sources |
|---|------|----------|----------------|-----------------|
| G1 | **Knowledge landscape mapped in week 1** — systems, knowledge holders, documentation state all visible. Gaps identified, stakeholder sessions prioritized | High | Cuts ramp-up from 2-4 weeks to ≤1 week. Enables targeted extraction instead of random exploration | Consultant persona (success metrics #1, #3) |
| G2 | **Structured, reusable TKAs** — tribal knowledge persists beyond the engagement and the individual. FG-HC1 compatible for Gyre consumption | High | Handoff survivability (≤3 days for next consultant), Gyre input quality, eliminates repeat extraction for stakeholders | Consultant persona (metrics #4, #5, #6), Stakeholder persona (gain: "never repeat myself") |
| G3 | **Shorter, better stakeholder sessions** — consultant arrives with prepared, specific questions. Stakeholder sees what was captured | Medium | Stakeholder time ≤5 hours (from 5-15), satisfaction ≥4/5, trust through TKA draft visibility | Stakeholder persona (all success metrics), Consultant persona (acceptable tradeoff) |
| G4 | **Compound institutional learning** — method + artifacts improve across engagements. Second consultant ramps in days, not weeks | Medium | Firm-wide ROI multiplier. Each engagement makes the next easier. Forge+Gyre compounding cycle via FG-HC1/GF-HC1 | Scope decision (strategic fit: "compounding value cycle"), Consultant persona (metric #5) |

**Gain convergence:** G1-G2 serve the JTBD expected outcome directly. G3 resolves the core tension between consultant thoroughness and stakeholder brevity. G4 is the long-term compounding value that justifies institutional investment.

---

## Evidence Summary

| Field | Assessment |
|-------|-----------|
| **Artifacts Analyzed** | 3: scope decision (7 opportunities, weighted scoring), consultant lean persona (6 steps, full JTBD), stakeholder lean persona (6 steps, full JTBD) |
| **Total Evidence Points** | ~45 discrete findings across scope evaluation (7×5 criteria matrix), consultant persona (5 pains, 6 metrics, 5 push forces, 5 pull forces, 5 anxieties, 5 habits), stakeholder persona (5 pains, 5 metrics, 4 push forces, 4 pull forces, 4 anxieties) |
| **Convergence Assessment** | **Strong.** All 3 artifacts independently arrive at knowledge asymmetry as the root cause. Pains cluster around two themes: unstructured process (P1-P4) and stakeholder burden (P3, P5). Gains converge on one outcome: structured, persistent, reusable knowledge assets |
| **Contradictions** | 1. Consultant thoroughness vs. stakeholder brevity — designed resolution: Rune preparation reduces session count/duration while increasing extraction quality. 2. Methodology vs. flexibility — designed resolution: adaptive workflow structure, not rigid template |
| **Evidence Gaps** | No direct user interviews with consultants or stakeholders. TKA format untested. Stakeholder willingness to engage in structured sessions unmeasured. Senior consultant adoption risk unvalidated |

**Provenance:**

| Finding | Primary Source | Supporting Sources |
|---------|---------------|-------------------|
| 40-80 hours on archaeology | Scope decision (problem statement) | Consultant persona (current cost) |
| Knowledge asymmetry as root cause | Scope decision (selected problem space) | Both personas (JTBD, pains) |
| Stakeholder fatigue | Stakeholder persona (pains #1, #5) | Consultant persona (workaround: "asks PM who to talk to") |
| TKA as solution artifact | Scope decision (FG-HC1 contract) | Consultant persona (success metric #4), Stakeholder persona (gain: "never repeat myself") |
| Senior consultant resistance | Consultant persona (pull force #1: "my way works") | Scope decision (implied: "reinvented every engagement" = no standard exists) |
| Gyre integration value | Scope decision (strategic fit, FG-HC1/GF-HC1) | Consultant persona (success metric #6) |

---

## Assumptions

| # | Assumption | Basis | Risk if Wrong | Status |
|---|-----------|-------|---------------|--------|
| A1 | Consultants will adopt a structured extraction method if it doesn't add perceived overhead | Domain expertise + consultant persona forces analysis (push forces outweigh pull forces) | Forge produces good artifacts nobody uses. Adoption = 0 regardless of quality | Assumed |
| A2 | Structured sessions with prepared questions produce better knowledge than unstructured brain-dumps | Logical inference: preparation → targeted questions → higher signal-to-noise | Rune's facilitation model needs fundamental redesign (post-hoc processing vs. guided extraction) | Assumed |
| A3 | TKAs are genuinely useful for the consultant's own delivery work, not just Gyre input | Consultant persona success criteria (TKA references ≥3/week during delivery) | TKAs become shelf-ware, adoption collapses after initial novelty | Assumed |
| A4 | Consultants burn 40-80 hours per engagement on knowledge archaeology | Domain expertise, consulting team reports, normalized across engagement types | Problem is smaller than estimated, Forge's ROI case weakens | Partially Validated |
| A5 | Knowledge landscape can be mapped to ≥80% coverage in week 1 using Silo | Silo workflow design hypothesis (structured survey > ad-hoc exploration) | Forge underdelivers on its core promise. Consultant loses trust in the method | Assumed |
| A6 | Stakeholders prefer prepared, shorter sessions over unstructured brain-dumps | Stakeholder persona forces analysis (fewer sessions + visible output = primary push forces) | Rune's approach alienates stakeholders who prefer to control the conversation | Assumed |

**Assumption priority for Liam:** A1 and A3 are the riskiest — they determine whether Forge gets used at all. A2 and A6 determine whether Forge produces good output. A4 and A5 determine whether the ROI case holds.

---

## Vortex Compass

| If you learned... | Consider next... | Agent | Why |
|---|---|---|---|
| Problem clearly defined, assumptions identified | **hypothesis-engineering** | Liam 💡 | Converge assumptions into testable hypothesis contracts (HC3) |
| Evidence gaps need filling first | **user-discovery** | Isla 🔍 | Interview real consultants/stakeholders before hypothesizing |
| Problem scope needs adjustment | **contextualize-scope** | Emma 🎯 | Re-examine boundaries if problem definition doesn't fit |

**Recommended next:** Stream 4 — Hypothesize (Liam). Problem definition is converged with 6 explicit assumptions ranked by risk. Liam converts these into testable hypothesis contracts that feed Wade's experiment design.

---

**Created with:** Convoke v2.3.1 - Vortex Pattern (Synthesize Stream)
**Agent:** Mila (Research Convergence Specialist)
**Workflow:** research-convergence
