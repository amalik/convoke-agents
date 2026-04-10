---
contract: HC3
type: artifact
source_agent: liam
source_workflow: hypothesis-engineering
target_agents: [wade]
input_artifacts:
  - path: "_bmad-output/vortex-artifacts/hc2-problem-definition-forge-2026-03-21.md"
    contract: HC2
created: 2026-03-21
---

# HC3 Hypothesis Contract: Forge — Domain Knowledge Extraction

> **3 hypothesis contracts, 11 assumptions mapped, 6 in "Test First/Test Soon" priority.**
> Zero direct user validation exists — all hypotheses are domain-expertise-driven.

---

## Problem Context

**Problem Statement (from HC2):**
IT consultants conducting enterprise brownfield engagements face a structural knowledge asymmetry problem: tribal knowledge is trapped in client personnel's heads, documentation is stale or missing, and no institutional method exists to extract, structure, and persist that knowledge. Consultants burn 40-80 hours per engagement on ad-hoc knowledge archaeology.

**JTBD Reference:**
> When I land in an unfamiliar enterprise brownfield environment with weeks — not months — to deliver value, I want to systematically map the knowledge landscape and extract tribal knowledge into structured, reusable assets, so I can make sound recommendations from week 2 instead of week 4, and leave behind knowledge that the next consultant (or Gyre) can use without re-extracting.

**Key Pains Targeted:**
- P1: No map of what to learn (High)
- P4: No structured output — knowledge evaporates (High)
- P5: Stakeholder fatigue from unfocused sessions (Medium)
- P6: Reinvented every engagement — no compound learning (Medium)

---

## Hypothesis Contracts

### Hypothesis 1: The Structured Extraction Bet

**Hypothesis Statement:**
> We believe that consultants conducting enterprise brownfield engagements will produce 3+ structured TKAs per engagement and reference them more frequently than personal notes during delivery, because the KORE extraction method (Silo survey → Rune excavation) transforms ephemeral meeting knowledge into persistent, searchable assets that directly inform design decisions.

| Field | Answer |
|-------|--------|
| **Expected Outcome** | Consultants using Forge (Silo + Rune) produce ≥3 structured TKAs per engagement with FG-HC1 frontmatter, and reference these TKAs ≥3 times/week during delivery — more frequently than personal notes |
| **Target Behavior Change** | From "take notes in meetings, never organize them" to "produce TKAs during extraction, reference them during delivery." Observable: TKA count, reference frequency, comparative utility rating |
| **Rationale** | HC2 P4 is highest-impact pain (40-80 hours produce nothing reusable). HC2 G2 is highest-priority gain (structured, reusable TKAs). Both personas converge on persistent knowledge assets as primary desired outcome. Bold claim: TKAs become the primary delivery reference, not a byproduct |
| **Riskiest Assumption** | **A3: TKAs are genuinely useful for delivery work, not just Gyre input.** If TKAs only serve the toolchain, consultants produce them once and never return. Shelf-ware kills adoption permanently |

**Falsification criteria:** TKA count <3 per engagement, OR reference frequency < personal notes, OR utility rating ≤ personal notes

---

### Hypothesis 2: The Stakeholder Experience Bet

**Hypothesis Statement:**
> We believe that client-side stakeholders will prefer structured 45-minute sessions with prepared questions and visible TKA output over unstructured 60-90 minute brain-dumps, because preparation respects their time, targeted questions reduce cognitive load, and seeing what was captured builds trust that their knowledge was heard correctly.

| Field | Answer |
|-------|--------|
| **Expected Outcome** | Sessions with Rune-prepared questions average ≤45 minutes (vs. 60-90 min unprepared), stakeholder satisfaction ≥4/5, AND ≥70% of stakeholders review TKA drafts when provided within 48h |
| **Target Behavior Change** | From "passive brain-dump in long meetings" to "focused responses in short sessions, then reviews visible output." Observable: session duration, satisfaction, TKA review rate |
| **Rationale** | HC2 P5 (stakeholder fatigue) degrades data quality. HC2 G3 (shorter, better sessions) addresses both sides of the asymmetry tension. Stakeholder persona pain #1: "death by a thousand meetings." Bold claim: visible output transforms stakeholders from reluctant sources to engaged participants |
| **Riskiest Assumption** | **A6: Stakeholders prefer prepared, shorter sessions over unstructured brain-dumps.** Some stakeholders may prefer brain-dumps because they require less mental effort — they just talk. Prepared questions may feel constraining or interrogative |

**Falsification criteria:** Session duration >45 min average, OR satisfaction <4/5, OR TKA review rate <70%

---

### Hypothesis 3: The Compound Learning Bet

**Hypothesis Statement:**
> We believe that a second consultant at the same client will ramp to productive understanding in ≤3 days using existing TKAs, because structured Tribal Knowledge Assets persist beyond the individual and engagement, eliminating the need to re-extract knowledge that was already captured — transforming consultancy from a repeated cold start into compound learning.

| Field | Answer |
|-------|--------|
| **Expected Outcome** | Second consultant at same client achieves productive understanding in ≤3 days (vs. 2-4 weeks without TKAs) and rates TKAs as "essential" to ramp-up |
| **Target Behavior Change** | From "start knowledge archaeology from scratch" to "read existing TKAs, validate currency, extend." Observable: ramp time, TKA usage during ramp, essentiality rating |
| **Rationale** | HC2 P6 (reinvented every time) = zero institutional learning. HC2 G4 (compound learning) = long-term differentiation. Consultant persona metric #5: handoff survivability ≤3 days. Bold claim: second consultant is MORE effective than the first was at week 4, because compound knowledge exceeds individual knowledge |
| **Riskiest Assumption** | **A5d: TKAs remain accurate and useful across engagement boundaries.** TKAs may be too context-dependent, too stale, or too incomplete. A bad map is more dangerous than no map — false confidence leads to worse decisions than acknowledged ignorance |

**Falsification criteria:** Ramp time >3 days, OR TKAs rated "not essential," OR second consultant reports misleading information from stale TKAs

---

## Assumption Risk Map

| # | Assumption | Hypothesis | Lethality | Uncertainty | Priority | Status |
|---|-----------|-----------|-----------|-------------|----------|--------|
| A3 | TKAs are useful for delivery work, not just Gyre input | H1 | High | High | **Test First** | Unvalidated |
| A1 | Consultants adopt structured method without perceiving overhead | H1, H2, H3 | High | High | **Test First** | Unvalidated |
| A6 | Stakeholders prefer prepared sessions over brain-dumps | H2 | High | High | **Test First** | Unvalidated |
| A5d | TKAs remain accurate/useful across engagement boundaries | H3 | High | High | **Test First** | Unvalidated |
| A2 | Structured sessions produce better knowledge than brain-dumps | H1, H2 | High | Medium | **Test First** | Unvalidated |
| A5 | Knowledge landscape mappable to ≥80% coverage in week 1 | H1 | High | Medium | **Test First** | Unvalidated |
| U1 | Forge workflows work across different client environments | H1, H2, H3 | Medium | High | **Test Soon** | Unvalidated |
| U2 | Senior consultants will adopt if juniors demonstrate value | H1 | Medium | High | **Test Soon** | Unvalidated |
| U3 | FG-HC1 format serves both human readability and Gyre consumption | H1 | Medium | Medium | Test Soon | Unvalidated |
| U4 | CTO vs. operational expert requires different Rune approaches | H2 | Low | Medium | Monitor | Unvalidated |
| A4 | 40-80 hours on archaeology is accurate | H1, H3 | Medium | Low | Monitor | Partially Validated |

**Risk map visualization:**

```
                    High Uncertainty    Medium Uncertainty    Low Uncertainty
                    ─────────────────   ──────────────────   ───────────────
High Lethality      A3, A1, A6, A5d     A2, A5               —
                    ▲ TEST FIRST        ▲ TEST FIRST

Medium Lethality    U1, U2              U3                    A4
                    △ TEST SOON         △ TEST SOON           ○ MONITOR

Low Lethality       —                   U4                    —
                                        ○ MONITOR
```

---

## Recommended Testing Order

| Priority | Assumption | Hypotheses | Method | Minimum Evidence |
|----------|-----------|-----------|--------|-----------------|
| 1 | **A1: Adoption without overhead** | H1, H2, H3 | Shadow engagement: consultant uses Forge alongside normal process. Overhead rating ≤3/5 | 1 consultant, 1 engagement. If overhead >3, redesign Silo/Rune before testing anything else |
| 2 | **A3: TKA delivery utility** | H1 | Same shadow engagement: track TKA references during delivery weeks 3-6. Self-report vs. personal notes | ≥3 references/week, utility rated higher than personal notes |
| 3 | **A6: Stakeholder session preference** | H2 | A/B on same engagement: 3 prepared sessions (Rune) vs. 3 unprepared. Duration + satisfaction | Prepared ≤45 min avg, satisfaction ≥4/5, TKA review ≥70% |
| 4 | **A2: Structured > unstructured knowledge quality** | H1, H2 | Compare TKA completeness from prepared vs. unprepared sessions (same A/B) | Prepared sessions produce ≥ same completeness in ≤ time |
| 5 | **A5: Week 1 coverage ≥80%** | H1 | Track Silo landscape map vs. what emerges in weeks 2-4 | ≥80% of critical systems/domains identified in Silo output |
| 6 | **A5d: TKA cross-engagement durability** | H3 | Second consultant at same client, ramp time measurement | ≤3 days ramp, TKAs rated "essential." Requires 2 engagement cycles |

**Testing order rationale:**
- A1 gates everything — if consultants won't use Forge, nothing else matters
- A3 is second — even if they use it, TKAs must have delivery value or adoption dies after novelty
- A6 is third — stakeholder experience determines data quality
- A2+A5 can be tested concurrently within the same shadow engagement
- A5d requires the longest feedback cycle (multiple engagements) — validated last

**Key insight:** Assumptions 1-5 can all be tested within a single shadow engagement (weeks 1-6). Only A5d requires a second engagement. This means one well-instrumented shadow engagement validates or invalidates 5 of 6 critical assumptions.

---

## Flagged Concerns

| Concern | Impact | Recommended Action |
|---------|--------|-------------------|
| **Zero direct user validation** — all hypotheses rest on domain expertise, not interviews | All 3 hypotheses could be grounded in incorrect assumptions about consultant behavior and stakeholder preferences | Consider routing A1 to Isla (HC9) for 5 quick consultant interviews before shadow engagement. Low cost (~5 hours), high de-risk. Would convert A1 from "Assumed" to "Partially Validated" |
| **Senior consultant resistance underexplored** — U2 is Medium lethality but culturally critical | If senior consultants reject Forge, junior adoption is unsustainable (seniors set culture) | Consider including 1 senior consultant in the shadow engagement, not just a willing junior |
| **Single-engagement validation** — A5d requires multiple engagement cycles | H3 (compound learning) cannot be validated within the shadow engagement timeframe | Accept that H3 remains provisional after first experiment cycle. Plan for second engagement validation |

---

## Vortex Compass

| If you learned... | Consider next... | Agent | Why |
|---|---|---|---|
| 3 hypotheses with testable assumptions, testing order defined | **lean-experiment** | Wade 🧪 | Design experiments targeting riskiest assumptions (HC3 → HC4) |
| Zero user validation flagged as concern | **user-interview** | Isla 🔍 | 5 quick interviews to de-risk A1 before shadow engagement (HC9) |
| Testing order clear, ready to define signals | **production-intelligence** | Noah 📡 | Define what production signals would confirm or deny hypotheses |

**Recommended next:** Stream 5 — Externalize (Wade). Three hypothesis contracts are ready with explicit testing order. The flagged concern about zero user validation is real, but the shadow engagement design (Priority 1-5 within a single engagement) is efficient enough to test concurrently. Wade designs the experiment protocol.

**Alternative path:** If you want to de-risk A1 before committing to a shadow engagement, route to Isla first for 5 consultant interviews. This adds ~1 week but converts the riskiest assumption from "Assumed" to "Partially Validated."

---

**Created with:** Convoke v2.3.1 - Vortex Pattern (Hypothesize Stream)
**Agent:** Liam (Hypothesis Engineer)
**Workflow:** hypothesis-engineering
