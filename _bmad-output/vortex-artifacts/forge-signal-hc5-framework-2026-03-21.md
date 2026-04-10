---
contract: HC5
type: artifact
source_agent: noah
source_workflow: signal-interpretation
target_agents: [max]
input_artifacts:
  - path: "_bmad-output/vortex-artifacts/hc4-experiment-forge-shadow-2026-03-21.md"
    contract: HC4
created: 2026-03-21
status: PRE-DEPLOYMENT
---

# HC5 Signal Framework: Forge — Production Intelligence

> **Status:** PRE-DEPLOYMENT — signal monitoring framework defined. Activates when shadow engagement produces first data. No production signals exist yet.

---

## Signal Framework Summary

This HC5 artifact defines what to watch, what "healthy" looks like, and what triggers investigation for Forge across three lifecycle phases:

1. **Shadow engagement** (first data) — manual tracking, n=1, directional learning
2. **Early production** (engagements 2-5) — pattern establishment, trend baselines
3. **Scaled production** (engagements 6+) — ecosystem signals, compound learning validation

**Total signals defined:** 15 (5 vital signs + 5 quality signals + 4 ecosystem signals + 1 compound learning)
**Anomaly patterns pre-registered:** 6

---

## Experiment Lineage

| Field | Value |
|-------|-------|
| **Originating Experiment** | HC4: Forge Shadow Engagement — Single-Consultant Validation |
| **Hypotheses** | H1 (structured extraction), H2 (stakeholder experience), H3 (compound learning) |
| **Assumptions Under Test** | A1, A2, A3, A5, A6 (shadow engagement); A5d (requires 2nd engagement) |
| **Experiment Status** | Pre-registered. Awaiting execution |
| **Problem Definition** | HC2: Knowledge asymmetry — 40-80 hours burned per engagement on ad-hoc archaeology |
| **Hypothesis Origin** | HC3: 3 hypotheses, 11 assumptions, 6 in Test First/Test Soon priority |

---

## Signal Catalog

### Tier 1: Vital Signs (Every Engagement)

These are the signals that determine whether Forge is fundamentally working. Check every engagement without exception.

| # | Signal | Healthy | Warning | Critical | Assumption | Lineage |
|---|--------|---------|---------|----------|------------|---------|
| V1 | **Silo coverage accuracy** — % of critical domains mapped in week 1 vs. all critical domains by week 6 | ≥80% | 60-79% | <60% | A5 | HC3 H1 → HC4 Phase 1 primary metric |
| V2 | **TKA production count** — structured TKAs produced per engagement | 3-8 | 1-2 | 0 | H1 outcome | HC3 H1 → HC4 Phase 2 secondary |
| V3 | **TKA delivery reference rate** — times/week consultant references TKAs during delivery | ≥3/week | 1-2/week | <1/week | A3 | HC3 H1 riskiest → HC4 Phase 3 primary |
| V4 | **Consultant methodology rating** — overall Forge methodology satisfaction | ≥4/5 | 3/5 | ≤2/5 | A1 | HC3 all hypotheses → HC4 guardrail |
| V5 | **Methodology completion** — did consultant use both Silo + Rune through engagement? | Full (both used) | Partial (one only) | Abandoned <week 4 | A1 | HC3 all hypotheses → HC4 guardrail |

**Vital sign interpretation rules:**
- V5 Critical → **Immediate halt.** A1 invalidated by behavior. No amount of survey data overrides an abandonment
- V3 Critical for 2+ engagements → **A3 invalidation.** TKAs are shelf-ware. Pause Forge build, investigate TKA format
- V4 Critical → **Methodology redesign required** before next engagement. Don't accumulate negative experiences
- V1 + V2 both Critical → **Core methodology failure.** Route to Mila for HC2 re-synthesis

### Tier 2: Quality Signals (Quarterly, Across Engagements)

These signals reveal whether Forge is producing good outcomes, not just being used. Meaningful only with 3+ engagements of data.

| # | Signal | Healthy | Warning | Critical | Assumption | Lineage |
|---|--------|---------|---------|----------|------------|---------|
| Q1 | **Prepared vs. unprepared session duration** — time gap between Rune-prepared and unprepared sessions | Prepared ≤45 min (gap ≥15 min) | Gap 5-14 min | Gap <5 min or prepared longer | A6, A2 | HC3 H2 → HC4 Phase 2 primary |
| Q2 | **Stakeholder satisfaction** — post-session rating across all sessions | ≥4/5 average | 3-3.9/5 | <3/5 | A6 | HC3 H2 → HC4 Phase 2 primary |
| Q3 | **TKA review rate** — % of stakeholders who review TKA draft within 48h | ≥70% | 50-69% | <50% | H2 engagement | HC3 H2 → HC4 Phase 2 secondary |
| Q4 | **Knowledge gap incidents** — critical info discovered NOT in TKAs during delivery | ≤2/engagement | 3-4 | ≥5 | A5 | HC3 H1 → HC4 Phase 3 secondary |
| Q5 | **TKA utility vs. personal notes** — consultant comparative rating | TKAs rated higher | Rated equal | Rated lower | A3 | HC3 H1 riskiest → HC4 Phase 3 primary |

**Quality signal interpretation rules:**
- Q1 gap narrowing + Q2 stable = consultants getting better at all sessions (experience effect, not methodology failure)
- Q1 gap narrowing + Q2 declining = preparation isn't helping AND sessions are worse overall. A6 under threat
- Q3 declining = stakeholder disengagement from feedback loop. Silent quality degradation — TKAs lose accuracy without review
- Q5 declining over time = **most dangerous slow-burn signal.** TKAs becoming less useful. Eventual adoption collapse. Investigate whether TKA format needs evolution or whether personal notes are being updated while TKAs aren't

### Tier 3: Ecosystem Signals (When Gyre Integration Is Live)

These signals only activate after Forge Phase A ships AND Gyre is operational with FG-HC1 integration.

| # | Signal | Healthy | Warning | Critical | Tests | Lineage |
|---|--------|---------|---------|----------|-------|---------|
| E1 | **FG-HC1 compliance rate** — % of TKAs passing frontmatter validation | ≥90% | 70-89% | <70% | U3 | Forge↔Gyre handoff contract |
| E2 | **Gyre contextual model enrichment** — TKAs accepted by Gyre without rework | Accepted cleanly | Minor rework needed | Rejected/ignored | FG-HC1 | Forge↔Gyre integration |
| E3 | **GF-HC1 feedback loop activation** — Gyre gaps routed back to Forge queue | Active routing | Gaps found, not routed | No gap detection | GF-HC1 | Forge↔Gyre compounding cycle |
| E4 | **Cross-engagement TKA reuse** — 2nd consultant usage of existing TKAs | ≥50% reused | 20-49% | <20% or ignored | A5d | HC3 H3 → compound learning |

**Ecosystem signal interpretation rules:**
- E1 declining = TKA format drifting. Either consultants customizing (investigate why — may be improvement signal) or spec too rigid
- E2 Critical = FG-HC1 format doesn't serve both humans and Gyre. U3 assumption failing. Format revision needed
- E3 inactive = Forge↔Gyre compounding cycle not activating. The strategic differentiator isn't materializing
- E4 Critical = **H3 invalidation.** Compound learning bet lost. TKAs don't survive across engagement boundaries. Accept that Forge delivers per-engagement value only (still valuable, but different ROI model)

---

## Anomaly Detection Framework

Pre-registered anomaly patterns to watch for — unexpected behaviors outside hypothesis predictions:

| # | Pattern | What It Looks Like | Why It Matters | Investigation Route |
|---|---------|-------------------|----------------|-------------------|
| AN1 | **Selective adoption** | Consultants use Silo but skip Rune, or vice versa | Partial adoption may be optimal. One workflow adds value, the other doesn't | Investigate which half adds value. Consider single-agent Forge |
| AN2 | **Stakeholder-initiated sharing** | Stakeholders proactively send context before sessions | Positive anomaly — process visibility changes stakeholder behavior | Route to Isla. Understand trigger. Design for it in Rune |
| AN3 | **TKA format divergence** | Consultants significantly modify TKA template | Positive if improving for context; negative if breaking FG-HC1 | Collect divergence patterns. Feed into template revision cycle |
| AN4 | **Senior resistance despite junior success** | Juniors adopt, seniors refuse or undermine | Cultural adoption risk. Metrics alone won't capture this | Route to engagement leads. Top-down endorsement needed |
| AN5 | **Client environment rejection** | Works at some clients, fails systematically at others | Environment variability exceeds methodology flexibility (U1) | Cluster failures by client type. Consider Rune variants |
| AN6 | **TKA hoarding** | TKAs produced but not shared / marked personal | Knowledge sharing culture problem. Tool can't solve alone | Investigate incentive structure. May need firm-level policy change |

---

## Data Quality Assessment

| Phase | Quality | Sample | Biases | Mitigation |
|-------|---------|--------|--------|------------|
| **Shadow engagement** | Low-Medium | n=1 consultant, self-reported | Hawthorne effect (being observed changes behavior). Self-selection (willing participant ≠ representative). Single client environment | Sufficient for directional learning only. Do not generalize from n=1 |
| **Early production (2-5)** | Medium | 2-5 consultants, mixed self-report + automated | Hawthorne fading. Survivorship bias (only completed engagements measured) | Track V5 explicitly to capture abandonment. Include ≥1 skeptical consultant by engagement 3 |
| **Scaled production (6+)** | Medium-High | 6+ consultants, automated signals (V2, E1) + surveys | Response bias on surveys. Tool adoption confound (using tool ≠ methodology works) | Cross-reference automated signals (V2, V3) with survey signals (V4, Q5). Automated signals are ground truth |

**Confidence escalation:** Conclusions from the shadow engagement are hypotheses, not facts. By engagement 5, trends become directional. By engagement 10, patterns are reliable enough for strategic decisions.

---

## Signal Monitoring Schedule

| Cadence | What to Check | Who Reviews | Decision Gate |
|---------|--------------|-------------|---------------|
| **Per engagement** | V1-V5 (vital signs) | Engagement lead + Forge maintainer | Any Critical → immediate investigation |
| **Quarterly** | Q1-Q5 (quality signals) + trend analysis across engagements | Consulting team lead | Warning trends → patch methodology. Critical trends → pause and investigate |
| **Per Gyre release** | E1-E4 (ecosystem signals) | Forge + Gyre maintainers | E1/E2 Critical → format revision. E3 inactive → integration investigation |
| **Ad hoc** | AN1-AN6 (anomaly patterns) | Anyone who notices | Document immediately. Route per framework |

---

## Activation Sequence

1. **NOW:** Framework defined. All signals, thresholds, and anomaly patterns pre-registered
2. **Shadow engagement starts:** Activate V1-V5 + Q1-Q5. Manual tracking via spreadsheet
3. **Shadow engagement ends:** First data arrives. Run HC4 decision criteria (Wade's pre-registered thresholds)
4. **Forge Phase A ships:** Transition from manual to agent-assisted tracking where possible. V2, E1 become automated
5. **Gyre integration live:** Activate E1-E4. The full signal catalog is now active
6. **Engagement 5+:** Begin quarterly trend analysis. First reliable trend data available
7. **Engagement 10+:** Full signal maturity. Trends are strategic inputs, not just directional signals

---

## Vortex Compass

| If you learned... | Consider next... | Agent | Why |
|---|---|---|---|
| Signal framework defined, ready for decision framework | **learning-card** | Max 🧭 | Build the decision framework that consumes these signals (HC5 → HC6) |
| Anomaly patterns suggest pre-experiment discovery needed | **user-discovery** | Isla 🔍 | Investigate anomaly patterns before they manifest (HC10) |
| Signal framework ready, experiment next | **lean-experiment** | Wade 🧪 | Execute the shadow engagement now that monitoring is pre-registered |

**Recommended next:** Stream 7 — Systematize (Max). The signal framework is the last input Max needs. Max builds the decision framework: what decisions these signals drive, what thresholds trigger pivot/patch/persevere, and how the Forge learning cycle connects back to the Vortex.

---

**Created with:** Convoke v2.3.1 - Vortex Pattern (Sensitize Stream)
**Agent:** Noah (Production Intelligence Specialist)
**Workflow:** signal-interpretation
