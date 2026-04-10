---
contract: HC5
type: artifact
source_agent: noah
source_workflow: signal-interpretation
target_agents: [max]
input_artifacts:
  - path: "_bmad-output/vortex-artifacts/hc4-experiment-gyre-pilot-2026-03-21.md"
    contract: HC4
created: 2026-03-21
status: PRE-DEPLOYMENT
---

# HC5 Signal Framework: Gyre — Production Intelligence

> **Status:** PRE-DEPLOYMENT — signal monitoring framework defined. Activates when pilot teams produce first data. No production signals exist yet.

---

## Signal Framework Summary

This HC5 artifact defines what to watch, what "healthy" looks like, and what triggers investigation for Gyre across three lifecycle phases:

1. **Pilot** (first 5 teams) — accuracy, trust, action signals. Manual tracking
2. **Early production** (teams 6-20) — pattern establishment, organic adoption, trend baselines
3. **Scaled production** (20+ teams) — portfolio signals, ecosystem integration, Forge↔Gyre handoff

**Total signals defined:** 14 (5 vital signs + 5 quality signals + 4 ecosystem signals)
**Anomaly patterns pre-registered:** 6

---

## Experiment Lineage

| Field | Value |
|-------|-------|
| **Originating Experiment** | HC4: Gyre Pilot — 3-phase (interviews → model accuracy → sprint integration) |
| **Hypotheses** | H1 (contextual discovery), H2 (actionable prioritization), H3 (compound risk) |
| **Assumptions Under Test** | Phase 2: A4, A3, A6. Phase 3: A1, A2, A5. Later: A7, A8, A9 |
| **Experiment Status** | Pre-registered. Awaiting execution |
| **Problem Definition** | HC2: Structural readiness gap — teams don't know what they don't know about production readiness |
| **Hypothesis Origin** | HC3: 3 hypotheses, 9 assumptions, 6 in Test First/Test Soon priority |

---

## Signal Catalog

### Tier 1: Vital Signs (Every Analysis Run)

These signals determine whether Gyre is fundamentally working. Check every analysis run without exception.

| # | Signal | Healthy | Warning | Critical | Assumption | Lineage |
|---|--------|---------|---------|----------|------------|---------|
| V1 | **Model accuracy** — % of capabilities in generated manifest confirmed relevant by team before amendments | ≥70% | 60-69% | <60% | A4 | HC3 H1 → HC4 Phase 2 primary metric |
| V2 | **False positive rate** — % of findings marked irrelevant or incorrect by team | <20% | 20-30% | >30% | A4 | HC3 H1 → HC4 Phase 2 primary metric |
| V3 | **Novel finding count** — contextual-model-sourced findings per analysis that team confirms as previously unknown | ≥2 | 1 | 0 | H1 outcome | HC3 H1 → HC4 Phase 2 primary metric |
| V4 | **Time to first finding** — seconds from analysis start to first finding presented | <2 min | 2-5 min | >5 min | M1 | PRD NFR1 performance target |
| V5 | **Analysis completion** — did the full Scout→Atlas→Lens→Coach cycle complete without errors? | Full cycle | Partial (one agent skipped or errored) | Failed mid-cycle | Technical health | Gyre agent architecture |

**Vital sign interpretation rules:**
- V1 Critical → **Kill switch activated.** Model generation fundamentally unreliable for this stack. Halt rollout to similar stacks. Investigate: stack-specific or systemic? If systemic across 2+ stacks, return to Mila (HC2 re-synthesis)
- V2 Critical → **Trust collapse.** Engineers will dismiss Gyre permanently. Immediate halt for affected stack. Investigate false positive sources: stack-specific heuristics wrong? Contextual model overgenerating? Static analysis misconfigured?
- V1 + V2 both Critical → **Core product failure.** Generated contextual model approach may not work. Route to HC2 re-synthesis. Consider fallback: static-analysis-only mode (still valuable, different value proposition)
- V3 = 0 for 3+ consecutive analyses → **Discovery value absent.** Gyre only finds what teams already know. Two paths: (1) teams are very mature and don't need discovery (anti-persona misidentification), or (2) contextual model isn't generating beyond obvious capabilities. Investigate team maturity first
- V4 Critical → **Performance regression.** Teams won't wait >5 min for developer tooling. Optimize before expanding. Check: model generation step timing, static analysis parallelization, codebase size scaling
- V5 partial for 2+ runs → **Agent reliability issue.** Identify failing agent (Scout? Atlas? Lens?). Fix before proceeding. Coach skip may be intentional (AN3) — investigate separately

### Tier 2: Quality Signals (Monthly, Across Teams)

These signals reveal whether Gyre is producing good outcomes, not just running. Meaningful only with 5+ teams of data.

| # | Signal | Healthy | Warning | Critical | Assumption | Lineage |
|---|--------|---------|---------|----------|------------|---------|
| Q1 | **Sprint pull rate** — % of teams pulling ≥1 blocker-tier finding into their next sprint after analysis | ≥60% | 40-59% | <40% | A1 | HC3 H2 → HC4 Phase 3 primary metric |
| Q2 | **Compound finding hit rate** — average cross-domain findings per analysis across all teams | ≥1.0 | 0.5-0.9 | <0.5 | A3 | HC3 H3 → HC4 Phase 2 secondary metric |
| Q3 | **Review-and-amend rate** — % of teams that modify the generated capabilities manifest | ≥50% | 30-49% | <30% | H1 engagement | HC3 H1 → model engagement signal |
| Q4 | **Leadership summary sharing** — % of teams that share readiness summary with non-engineering stakeholders | ≥30% | 10-29% | <10% | A5 | HC3 H2 → HC4 Phase 3 primary metric |
| Q5 | **Re-run rate** — % of teams that run Gyre again within 90 days of first analysis | ≥40% | 20-39% | <20% | A9 | Continuous value signal |

**Quality signal interpretation rules:**
- Q1 declining + Q3 stable = Teams engage with the model but don't act on findings. Possible causes: findings too abstract (need effort estimates), findings conflict with sprint priorities (need PM buy-in), format not sprint-compatible (need Jira/Linear integration)
- Q1 declining + Q3 declining = Overall disengagement. Gyre losing relevance. Investigate: are findings stale on re-run? Is the tool being mandated top-down without team buy-in?
- Q2 declining as more domains added (v2/v3) = New domain pairs don't correlate as well as Observability×Deployment. Compound finding quality varies by domain pair. May need domain-specific correlation rules
- Q2 stable + new domains added = Good sign. Compound finding mechanism generalizes across domains
- Q3 declining over time = **Most dangerous slow-burn signal.** Teams not engaging with the model means either: (1) trusting blindly (dangerous — model may be wrong), or (2) ignoring the model (running Gyre for the backlog only, not the discovery). Either way, the "generated contextual model" innovation is underdelivering
- Q4 = 0 for 2+ months = Dual-audience bet failing. Leadership summary not useful or not reaching leadership. Investigate: format problem? Distribution problem? Content problem?
- Q5 declining = Gyre is a one-shot crisis tool, not a continuous readiness signal. Adjust expectations — still valuable but different business model (per-event vs. recurring)

### Tier 3: Ecosystem Signals (When Forge Integration Is Live)

These signals only activate after Gyre is operational AND Forge Phase A ships with FG-HC1 integration.

| # | Signal | Healthy | Warning | Critical | Tests | Lineage |
|---|--------|---------|---------|----------|-------|---------|
| E1 | **FG-HC1 activation rate** — % of engagements where Forge TKAs are available and enrich Gyre's contextual model | TKAs accepted, model enriched | TKAs found but format mismatch requiring rework | No TKA integration attempted despite availability | FG-HC1 | Forge↔Gyre handoff contract |
| E2 | **GF-HC1 activation rate** — % of Gyre gap findings routed back to Forge extraction queue | Active routing, Forge processes gaps | Gaps identified but not routed | No gap-to-extraction pipeline active | GF-HC1 | Forge↔Gyre compounding cycle |
| E3 | **Organic adoption rate** — new teams adopting Gyre without direct outreach or mandate | ≥2 new teams/quarter | 1/quarter | 0/quarter | Product-market fit | Product brief organic referral metric |
| E4 | **Stack coverage breadth** — number of distinct stacks successfully analyzed (V1 ≥ 70%) | Growing quarter-over-quarter | Stable | Shrinking (teams with low-accuracy stacks churning) | Platform viability | PRD any-stack claim |

**Ecosystem signal interpretation rules:**
- E1 Warning (format mismatch) = FG-HC1 contract needs revision. TKA format and capabilities manifest format not aligned. Fix contract before scaling integration
- E1 Critical = Forge and Gyre are operating independently despite available integration. Investigate: is integration adding value? Teams may prefer separate tools
- E2 inactive = The Forge↔Gyre compounding cycle isn't materializing. Gyre finds gaps that Forge could fill, but the feedback loop isn't closing. Investigate: routing mechanism broken? Forge team not processing queue? Gap-to-extraction mapping unclear?
- E3 Critical for 2+ quarters = Gyre is not spreading organically. Adoption requires mandate or sales effort. Changes go-to-market strategy fundamentally
- E4 shrinking = Teams with stacks Gyre doesn't handle well are leaving. Model generation has a stack ceiling. Prioritize model improvements for churning stacks

---

## Anomaly Detection Framework

Pre-registered anomaly patterns to watch for — unexpected behaviors outside hypothesis predictions:

| # | Pattern | What It Looks Like | Why It Matters | Investigation Route |
|---|---------|-------------------|----------------|-------------------|
| AN1 | **Accuracy variance by stack** | Model works well on K8s (≥80%) but poorly on serverless (<60%) or vice versa | Stack-specific model generation gaps. Not systemic failure but still painful for affected teams. May indicate model generation relies too heavily on one ecosystem's conventions | Cluster V1 by stack type. Prioritize model improvements for lowest-accuracy stacks. If gap persists after 2 improvement cycles, consider stack-specific model templates as fallback |
| AN2 | **Finding fatigue** | High engagement initially (Q3 ≥60%), declining by 3rd run (Q3 <30%). Re-run findings are repetitive | Fixed items not removed from backlog. Or: no new findings on re-run because nothing changed. Signals need for diff-mode (show only new/changed since last run) | Track finding overlap between runs. If >80% overlap, implement diff-mode. If overlap is low but engagement still drops, investigate whether the *type* of finding changes (diminishing novelty) |
| AN3 | **Coach bypass** | Teams skip the Coach review session, go straight to the readiness backlog | Positive anomaly if experienced teams don't need hand-holding. Negative if teams miss important nuance (amendments, context, compound finding explanation) | Track amendment rates for Coach-skipping vs. Coach-using teams. If amendment rates are similar, Coach may be unnecessary for experienced users. If lower, Coach adds value that's being missed |
| AN4 | **Leadership overconsumption** | PM/CTO uses readiness data for cross-team comparison, team ranking, or pressure ("Team A has 2 blockers, why do you have 8?") | Gyre becomes surveillance tool. Teams resist adoption, game findings, or refuse to run. Cultural damage undermines the product | Explicit guidance in leadership summary: "For improvement tracking, not team ranking." Monitor: do teams report feeling surveilled? If yes, consider removing cross-team comparison capability entirely |
| AN5 | **Enterprise vs startup divergence** | Gyre adoption and satisfaction significantly different between small teams (Sana wears all hats) and large orgs (Sana + Ravi + Priya) | Product-market fit is narrower than expected. Different org sizes may need different workflows or onboarding | Segment all Tier 1 and Tier 2 signals by org size. If divergence is significant (>20% gap on V1 or Q1), consider org-size-specific modes or separate onboarding paths |
| AN6 | **Static-only sufficiency** | Teams consistently report that static analysis findings (misconfigurations, drift) are valuable but contextual model findings (absences) add noise | The core innovation (generated contextual model) may be less valuable than the straightforward static analysis. The "aha!" moment isn't materializing — instead, teams value the "obvious fix" list | If V3 (novel findings) is Warning/Critical while V2 (false positives from contextual model) is Warning → the contextual model is adding noise, not signal. Consider: static-only mode as default, contextual model as opt-in for mature teams. Dramatic simplification but clearer value |

---

## Data Quality Assessment

| Phase | Quality | Sample | Biases | Mitigation |
|-------|---------|--------|--------|------------|
| **Pilot (5 teams)** | Low-Medium | n=5, mixed self-report + automated (V4, V5) | Selection bias (willing participants ≠ representative). Hawthorne effect (being studied changes behavior). Stack selection bias (pilot stacks may not represent the long tail) | Sufficient for directional learning only. Do not generalize. Ensure ≥3 distinct stacks. Note that pilot teams are pre-warmed (Phase 1 interviews) — first-run credibility test is not cold |
| **Early production (6-20)** | Medium | 6-20 teams, increasing automated signals | Survivorship bias (teams that continue ≠ teams that tried and left). Early adopter bias (teams seeking readiness tools are more receptive than average) | Track churn explicitly. Include ≥2 "skeptical" teams (not self-selected) by team 15. Cross-reference automated signals (V1, V2, V4, V5) with survey signals (Q1, Q4) — automated signals are ground truth |
| **Scaled production (20+)** | Medium-High | 20+ teams, primarily automated signals | Response bias on surveys. Tool adoption confound (running tool ≠ tool works). Stack-specific accuracy variance may be masked by aggregate numbers | Segment all signals by stack type, org size, and team maturity. Automated signals (V1-V5) are primary. Survey signals (Q1, Q4, Q5) are secondary validation. Flag any metric where automated and survey signals diverge |

**Confidence escalation:** Conclusions from the pilot are hypotheses, not facts. By team 10, patterns become directional. By team 20, patterns are reliable enough for strategic decisions (expansion, new domain agents, Forge integration).

---

## Signal Monitoring Schedule

| Cadence | What to Check | Who Reviews | Decision Gate |
|---------|--------------|-------------|---------------|
| **Per analysis run** | V1-V5 (vital signs) | Gyre maintainer | Any Critical → immediate investigation. V1 or V2 Critical → halt rollout to that stack type |
| **Monthly** | Q1-Q5 (quality signals) + trend analysis across teams | Product owner + Gyre maintainer | Warning trends → investigate root cause. Critical trends → pause expansion and investigate |
| **Per Gyre release** | Regression check on V1-V5 across 3 reference stacks | Gyre maintainer | Any V1/V2 regression → hotfix before release |
| **Per Forge release** | E1-E2 (ecosystem signals) | Forge + Gyre maintainers | E1/E2 Critical → integration investigation |
| **Quarterly** | E3, E4 (adoption, coverage) + full trend review | Product owner | E3 Critical → go-to-market adjustment. E4 shrinking → model improvement sprint |
| **Ad hoc** | AN1-AN6 (anomaly patterns) | Anyone who notices | Document immediately. Route per framework |

---

## Activation Sequence

1. **NOW:** Framework defined. All signals, thresholds, and anomaly patterns pre-registered
2. **Phase 1 starts (interviews):** No signal monitoring needed — qualitative data only
3. **Phase 2 starts (model accuracy pilot):** Activate V1-V5 for the 3 pilot stacks. Manual tracking via spreadsheet
4. **Phase 3 starts (sprint observation):** Activate Q1, Q4. Manual tracking via interview + observation data
5. **Gyre E1 ships:** Transition from manual to automated tracking where possible. V1, V2, V4, V5 become automated (instrument in agent workflows). Q3 partially automated (manifest diff detection)
6. **Teams 6-20:** Activate full Q1-Q5. Monthly review cadence begins. Trend baselines established
7. **Forge integration live:** Activate E1-E2. Ecosystem signal catalog fully active
8. **Teams 20+:** Activate E3, E4. Quarterly strategic review. Segment all signals by stack type, org size, team maturity
9. **Full signal maturity (team 30+):** Trends are strategic inputs. Signal-driven decisions on new domain agents, enterprise features, and Forge integration depth

---

## Gyre-Specific Signal Considerations

### Model Accuracy is the Master Signal

Unlike Forge (where methodology adoption was the master signal), Gyre's master signal is **model accuracy (V1)**. Everything flows from it:
- If V1 is Healthy → V2 likely Healthy (fewer false positives) → V3 likely Healthy (novel findings emerge from accurate models) → Q1 likely Healthy (teams act on trustworthy findings)
- If V1 is Critical → V2 likely Critical (more false positives) → Q1 likely Critical (teams don't act on untrustworthy findings) → Q5 likely Critical (teams don't re-run an inaccurate tool)

**Implication:** Monitor V1 obsessively. Segment by stack type immediately. Model accuracy improvements have the highest leverage on all downstream signals.

### Stack Diversity Creates Signal Variance

Forge's signals are relatively uniform (one methodology, similar engagement structures). Gyre's signals will vary significantly by stack:
- A K8s team may see V1 ≥80% while a serverless team sees V1 = 65%
- Compound finding rates (Q2) depend on which domains interact most for a given stack
- Time to first finding (V4) scales with codebase size

**Implication:** Always segment signals by stack type. Aggregate numbers can mask stack-specific problems. A "Healthy" aggregate V1 of 72% might hide a "Critical" serverless V1 of 55%.

---

## Vortex Compass

| If you learned... | Consider next... | Agent | Why |
|---|---|---|---|
| Signal framework defined, ready for decision framework | **learning-card** | Max 🧭 | Build the decision framework that consumes these signals (HC5 → HC6) |
| Anomaly patterns suggest pre-experiment investigation | **user-discovery** | Isla 🔍 | Investigate anomaly patterns before they manifest (P1-disc interviews may surface early signals) |
| Signal framework ready, experiment next | **lean-experiment** | Wade 🧪 | Execute Phase 1 interviews now that monitoring is pre-registered |

**Recommended next:** Stream 7 — Systematize (Max). The signal framework is the last input Max needs. Max builds the decision framework: what decisions these signals drive, what thresholds trigger pivot/patch/persevere, and how the Gyre learning cycle connects to the broader Convoke ecosystem.

---

**Created with:** Convoke v2.3.1 - Vortex Pattern (Sensitize Stream)
**Agent:** Noah (Production Intelligence Specialist)
**Workflow:** signal-interpretation
