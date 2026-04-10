---
contract: HC4
type: artifact
source_agent: wade
source_workflow: lean-experiment
target_agents: [noah]
input_artifacts:
  - path: "_bmad-output/vortex-artifacts/hc3-hypothesis-contract-forge-2026-03-21.md"
    contract: HC3
created: 2026-03-21
status: PRE-REGISTERED
---

# HC4 Experiment: Forge Shadow Engagement

> **Status:** PRE-REGISTERED — experiment designed, metrics locked. Awaiting execution on a real engagement.

---

## Experiment Summary

| Field | Value |
|-------|-------|
| **Name** | Forge Shadow Engagement — Single-Consultant Validation |
| **Type** | Concierge + A/B hybrid |
| **Duration** | 6 weeks (survey → extraction → delivery) |
| **Sample** | 1 mid-level consultant, 1 brownfield engagement, 6-8 stakeholders |
| **Graduation Status** | Pending execution |
| **Assumptions Tested** | A1 (adoption), A2 (structured > unstructured), A3 (TKA utility), A5 (week 1 coverage), A6 (stakeholder preference) |

**Design rationale:** One integrated engagement tests 5 of 6 critical assumptions. Only A5d (cross-engagement TKA durability) requires a second engagement. Concierge format because we're validating the KORE methodology, not the AI agent implementation — if the method fails with a human following it, no automation can save it.

---

## Hypotheses Tested

### H1: The Structured Extraction Bet
> We believe that consultants will produce 3+ TKAs per engagement and reference them more than personal notes during delivery, because KORE transforms ephemeral meeting knowledge into persistent, searchable assets.

**Riskiest assumption:** A3 — TKAs are useful for delivery, not just Gyre input

### H2: The Stakeholder Experience Bet
> We believe that stakeholders will prefer structured 45-min sessions with prepared questions and visible TKA output over 60-90 min brain-dumps.

**Riskiest assumption:** A6 — Stakeholders prefer prepared sessions over brain-dumps

### H3: The Compound Learning Bet (partial — full validation requires second engagement)
> We believe that TKAs persist beyond the engagement and individual, enabling compound learning.

**Riskiest assumption:** A5d — TKAs remain accurate across engagement boundaries (not testable in this experiment)

---

## Method

### Materials to Prepare (Before Engagement)

1. **Silo survey checklist** — Printed/digital card with landscape mapping questions:
   - Systems inventory (name, purpose, owner, tech stack, documentation state)
   - Knowledge holder map (who knows what, availability, willingness)
   - Documentation audit (what exists, last updated, accuracy rating)
   - Gap identification (what's undocumented, what's tribal-only)

2. **Rune session prep template** — Questions derived from Silo map:
   - Domain context (what does this system do, why does it exist)
   - Decision history (why was it built this way, what alternatives were considered)
   - Tribal knowledge (what's not documented, what do new people always get wrong)
   - Integration points (what depends on this, what does this depend on)

3. **TKA template** — Markdown with FG-HC1 frontmatter fields:
   - Source stakeholder, date, domain, confidence level
   - Knowledge content (structured by: context, facts, risks, dependencies)
   - Gyre relevance tags (for future FG-HC1 integration)
   - Review status (draft → stakeholder-reviewed → validated)

4. **Tracking spreadsheet** — Daily self-report + session data:
   - Session log (date, stakeholder, duration, prepared Y/N, satisfaction, TKA completeness)
   - TKA reference log (date, which TKA, for what decision)
   - Weekly overhead rating (1-5)
   - Anomaly/surprise notes

5. **End-of-engagement interview guide** — Semi-structured, 30 min:
   - Overall methodology rating (1-5) + why
   - "What would you change?"
   - "Would you use this on your next engagement?"
   - "Did TKAs help you make better decisions?"
   - "What did the methodology miss?"

### Execution Protocol

**Phase 1: Survey (Weeks 1-2)**
- Day 1-2: Consultant learns Silo methodology (30 min orientation using checklist)
- Day 2-5: Consultant conducts landscape mapping alongside normal onboarding activities
- End of week 1: Silo landscape map produced. Consultant rates overhead (1-5)
- Week 2: Continue refining map. Identify stakeholders for extraction sessions

**Phase 2: Extraction (Weeks 2-4)**
- Schedule 6 stakeholder sessions (mix of seniority levels)
- Sessions 1, 3, 5: Rune-prepared (consultant uses Silo map → specific questions)
- Sessions 2, 4, 6: Unprepared (consultant's normal approach)
- After each session: clock duration, stakeholder rates satisfaction (1-5), consultant rates TKA completeness (1-5)
- Within 48h of each prepared session: send TKA draft to stakeholder for review. Track review Y/N

**Phase 3: Delivery (Weeks 4-6)**
- Consultant proceeds with normal delivery work
- Daily self-report: "Did you reference a TKA today?" (which one, for what decision)
- End of week 6: End-of-engagement interview. Overall methodology rating. TKA utility vs. personal notes

### A/B Assignment

| Session | Stakeholder Type | Preparation | Order Rationale |
|---------|-----------------|-------------|-----------------|
| 1 | Operational expert | Prepared | Start prepared — consultant has Silo map fresh |
| 2 | Technical lead | Unprepared | Alternate for comparison |
| 3 | CTO/CPO level | Prepared | Strategic stakeholder benefits most from preparation |
| 4 | Operational expert | Unprepared | Alternate |
| 5 | Technical lead | Prepared | Test preparation with mid-level stakeholder |
| 6 | Varies | Unprepared | Final comparison point |

**Alternation rationale:** Alternating rather than block assignment reduces ordering bias (consultant gets better at sessions over time regardless of preparation).

---

## Pre-Defined Success Criteria

### Phase 1 Primary Metric: Knowledge Landscape Coverage

| Field | Value |
|-------|-------|
| **Metric** | Silo coverage accuracy — % of critical domains in week 1 map vs. all critical domains by week 6 |
| **Target** | ≥80% coverage |
| **Failure** | <60% coverage |
| **Method** | Week 1 map vs. week 6 retrospective. Coverage = (week 1 items still relevant) / (all critical items) |
| **Tests** | A5 (week 1 coverage ≥80%) |

### Phase 1 Secondary Metrics

| Metric | Expected | Tests |
|--------|----------|-------|
| Consultant overhead rating for Silo (1-5) | ≤3 | A1 |
| Time to complete landscape map | ≤3 days | Feasibility |
| Systems/domains identified | ≥10 | Sanity check |

### Phase 2 Primary Metric: Session Efficiency Index

| Field | Value |
|-------|-------|
| **Metric** | Prepared vs. unprepared composite: duration, satisfaction, TKA completeness |
| **Target** | Prepared sessions score higher on ALL THREE: duration ≤45 min, satisfaction ≥4/5, TKA completeness ≥ unprepared |
| **Failure** | Prepared sessions score lower on ANY dimension |
| **Method** | 3 prepared vs. 3 unprepared. Clock duration, stakeholder satisfaction 1-5, TKA completeness 1-5 |
| **Tests** | A6 (stakeholder preference), A2 (structured > unstructured quality) |

### Phase 2 Secondary Metrics

| Metric | Expected | Tests |
|--------|----------|-------|
| TKA review rate (stakeholders who review draft within 48h) | ≥70% | Stakeholder engagement |
| TKAs produced by end of week 4 | ≥3 | A3 (partial — production, not utility) |
| Consultant overhead rating for Rune preparation (1-5) | ≤3 | A1 (extraction phase) |

### Phase 3 Primary Metric: TKA Delivery Utility

| Field | Value |
|-------|-------|
| **Metric** | TKA reference frequency + comparative utility rating |
| **Target** | ≥3 references/week AND rated "more useful than personal notes" |
| **Failure** | <1 reference/week OR rated "less useful than personal notes" |
| **Method** | Daily self-report + end-of-engagement interview |
| **Tests** | A3 (TKA delivery utility — the riskiest assumption) |

### Phase 3 Secondary Metrics

| Metric | Expected | Tests |
|--------|----------|-------|
| Knowledge gap incidents (critical info NOT in TKAs) | ≤2 over 2 weeks | A5 validation from delivery side |
| Total TKAs produced | 3-8 | H1 expected outcome range |
| Overall methodology rating (1-5) | ≥4 | Holistic adoption signal |

### Guardrail Metrics

| Guardrail | Red Line | Action |
|-----------|----------|--------|
| Stakeholder drop-out | >1 refuses to participate | Halt extraction phase. Investigate cause |
| Consultant abandons methodology | Stops before week 4 | A1 invalidated by behavior. End experiment |
| Client relationship damage | Any negative feedback attributed to methodology | Immediate halt. Engagement relationship is sacred |

---

## Decision Criteria (Pre-Registered)

| Outcome | Trigger | Action |
|---------|---------|--------|
| **Full Persevere** | ALL 3 primary metrics meet target thresholds | Proceed to Forge Phase A build (per ADR-001 sequence). Methodology validated |
| **Partial Persevere** | 2 of 3 primary metrics meet target. Failed metric borderline | Patch the failed phase. Re-test on next engagement before building |
| **Patch** | 1-2 primary metrics fail but methodology rating ≥3 | Redesign failing component. Run patched experiment before committing to build |
| **Pivot** | All primary metrics fail, OR methodology rating ≤2, OR guardrail triggered | Return to Mila (HC2 re-synthesis). The methodology doesn't work as designed |

---

## Expected Production Behavior (If Graduating)

If the shadow engagement validates the methodology:

1. **Silo agent** automates the landscape mapping workflow — guided survey questions, automatic gap identification, knowledge holder prioritization
2. **Rune agent** automates session preparation — generates targeted questions from Silo map, produces TKA drafts from session notes, routes TKA drafts to stakeholders for review
3. **TKA production** becomes standard engagement deliverable with FG-HC1 frontmatter for Gyre consumption
4. **Expected metrics at scale:** Coverage ≥80% (validated by experiment), TKA production 3-8 per engagement (validated), session duration ≤45 min with preparation (validated)

## Signal Thresholds (For Noah — Post-Graduation Monitoring)

| Signal | Healthy Range | Investigate If | Source |
|--------|--------------|----------------|--------|
| Silo coverage accuracy | ≥80% | <70% across 2+ engagements | Week 6 retrospective |
| TKA production rate | 3-8 per engagement | <3 for 2+ consecutive engagements | TKA count tracking |
| Stakeholder satisfaction | ≥4/5 | <3/5 for any single engagement | Post-session surveys |
| TKA reference frequency | ≥3/week during delivery | <1/week for 2+ weeks | Self-report tracking |
| Methodology abandonment | 0% | Any consultant stops mid-engagement | Consultant behavior |
| Consultant overhead perception | ≤3/5 | >3 for 2+ consultants | Weekly ratings |

---

## Open Items for Execution

1. **Consultant selection** — Identify a willing mid-level consultant with a brownfield engagement starting within the experiment window
2. **KORE spec draft** — Ensure the draft methodology document is available as the consultant's reference
3. **Stakeholder consent** — Client stakeholders should know their satisfaction is being tracked (not the A/B assignment — that introduces bias)
4. **Baseline data** — If possible, gather the same consultant's ramp time on their PREVIOUS engagement for comparison
5. **Timeline dependency** — This experiment can run BEFORE Forge Phase A is built (per ADR-001). It validates the methodology that Enhance will scaffold into agents

---

## Vortex Compass

| If you learned... | Consider next... | Agent | Why |
|---|---|---|---|
| Experiment designed, metrics locked, ready for monitoring framework | **production-intelligence** | Noah 📡 | Define production signals that would confirm or deny hypotheses at scale (HC4 → HC5) |
| Want to capture learning framework before running | **learning-card** | Max 🧭 | Pre-register the decision framework so pivot/patch/persevere criteria are institutional |
| Need to de-risk A1 before committing to 6-week engagement | **user-interview** | Isla 🔍 | 5 quick consultant interviews (~1 week) to partially validate adoption assumption |

**Recommended next:** Stream 6 — Sensitize (Noah). The experiment is designed and pre-registered. Noah defines the production monitoring framework — what signals will tell us Forge is working (or failing) once it graduates from experiment to real tool.

---

**Created with:** Convoke v2.3.1 - Vortex Pattern (Externalize Stream)
**Agent:** Wade (Lean Experiments Specialist)
**Workflow:** lean-experiment
