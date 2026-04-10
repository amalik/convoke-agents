---
contract: HC4
type: artifact
source_agent: wade
source_workflow: lean-experiment
target_agents: [noah]
input_artifacts:
  - path: "_bmad-output/vortex-artifacts/hc3-hypothesis-contract-gyre-2026-03-21.md"
    contract: HC3
  - path: "_bmad-output/vortex-artifacts/lean-experiment-gyre-discovery-interviews-2026-03-20.md"
    contract: HC4 (Phase 1 — pre-existing)
created: 2026-03-21
status: PRE-REGISTERED
---

# HC4 Experiment: Gyre Model Accuracy & Sprint Integration Pilot

> **Status:** PRE-REGISTERED — experiment designed, metrics locked. Phase 1 (discovery interviews) already designed in separate artifact. This HC4 covers the full 3-phase experiment chain.

---

## Experiment Summary

| Field | Value |
|-------|-------|
| **Name** | Gyre Pilot — Discovery Interviews + Model Accuracy + Sprint Integration |
| **Type** | Three-phase: Semi-structured interviews → Accuracy pilot → Observation study |
| **Duration** | 5-8 weeks total (1 week + 2 weeks + 2-4 weeks) |
| **Sample** | 5 engineering teams (same cohort across all 3 phases) |
| **Graduation Status** | Pending execution |
| **Assumptions Tested** | Phase 1: Problem validation. Phase 2: A4 (model accuracy), A3 (compound findings), A6 (static+contextual). Phase 3: A1 (action), A2 (prioritization), A5 (leadership summary) |

**Design rationale:** Three sequential phases with go/no-go gates between each. Phase 1 validates the problem exists as described. Phase 2 tests the riskiest technical assumption (A4: model accuracy — the kill switch). Phase 3 tests behavioral assumptions (do teams act on findings?). Each phase can halt the experiment early, preventing wasted effort. Key advantage over Forge: the riskiest assumption (A4) is testable in days, not weeks.

---

## Hypotheses Tested

### H1: The Contextual Discovery Bet
> We believe that engineering leads running Gyre on their codebase will discover ≥2 previously unknown readiness gaps and confirm ≥70% model accuracy, because the contextual model detects what should exist based on the detected stack and compares it against what does exist.

**Riskiest assumption:** A4 — Generated models accurate enough (≥70%) for first-run trust

### H2: The Actionable Prioritization Bet
> We believe that RICE-scored readiness backlogs will cause engineering leads to pull ≥1 blocker into their next sprint, because prioritization transforms a paralyzing flat list into a focused action queue.

**Riskiest assumption:** A1 — Engineering leads act on findings alongside feature work

### H3: The Compound Risk Bet
> We believe that cross-domain correlation will produce ≥1 compound risk finding per analysis that teams confirm as valid and previously invisible.

**Riskiest assumption:** A3 — Cross-domain correlation finds unique compound risks

---

## Phase 1: Discovery Interviews (Pre-Existing)

**Full design:** See `lean-experiment-gyre-discovery-interviews-2026-03-20.md`

**Summary:** 5 semi-structured interviews (45 min each), 4 discovery questions, categorization framework. Same cohort serves as Phase 2 and 3 pilot teams.

**Duration:** 1 week

**Gate to Phase 2:**

| Criterion | Target | Gate Decision |
|-----------|--------|---------------|
| Unknown gap ratio | ≥60% of gaps were unknown at time of incident | **Pass:** Problem validated. Proceed to Phase 2 |
| Gyre-detectable ratio | ≥50% of Q2 findings could be detected by code analysis | **Pass:** Solution approach validated |
| Code analysis trust | ≥4/5 teams trust or conditionally trust code analysis | **Pass:** Observation-over-declaration confirmed |
| Process gap | ≥3/5 teams lack structured, stack-specific readiness process | **Pass:** Market gap confirmed |
| Pilot commitment | 5/5 teams commit to MVP pilot | **Pass:** Cohort intact |

**Phase 1 failure responses:**

| Failure | Interpretation | Action |
|---------|---------------|--------|
| Unknown gap ratio <60% | Teams know their gaps but deprioritize them | Pivot: reframe Gyre as "known gap accelerator" — prioritization tool, not discovery tool. Adjust H1 |
| Gyre-detectable ratio <50% | Gaps are real but code analysis can't find them | Pivot: hybrid approach (analysis + guided questions). Rune-like facilitation instead of pure automation |
| Code analysis trust <4/5 | Teams prefer self-assessment or distrust automation | Adjust: heavier review-and-amend UX. More transparency. Consider IDP-style questionnaire as fallback |
| Pilot commitment <5/5 | Insufficient commitment to complete the experiment | Recruit replacement teams before proceeding. Do not reduce sample size below 5 |

---

## Phase 2: Model Accuracy Pilot

**Purpose:** Test the riskiest technical assumption (A4) before investing in behavioral observation. If the model isn't accurate enough, halt before Phase 3.

**Duration:** 2 weeks

**Prerequisites:**
1. Phase 1 gate passed
2. Gyre E1 MVP functional (Scout + Atlas workflows producing capabilities manifest and readiness backlog)
3. ≥3 distinct stacks available from pilot teams

### Materials to Prepare

1. **Gyre E1 MVP** — Scout (stack detection) + Atlas (model generation) + Lens (readiness analysis) producing capabilities manifest and RICE-scored backlog
2. **Accuracy tracking spreadsheet** — Per-capability review: relevant / irrelevant / missing
3. **Finding review guide** — Per-finding: valid / false positive / unclear. Source tag: static / contextual / cross-domain
4. **Post-review interview guide** — Semi-structured, 30 min: "What surprised you? What did you already know? What's wrong? What's missing?"

### Execution Protocol

**Stack selection:** Choose 3 stacks from the 5 pilot teams ensuring diversity:

| Slot | Target Stack Profile | Rationale |
|------|---------------------|-----------|
| Stack 1 | Node.js or Python on Kubernetes (EKS/GKE) | High community knowledge density — model should be richest here |
| Stack 2 | Serverless (Lambda/Cloud Functions) | Different readiness profile — tests model generation flexibility |
| Stack 3 | Java/Spring Boot or .NET on VMs/containers | Enterprise pattern — different operational concerns |

**For each stack (days 1-3 per stack):**

1. **Day 1: Run Gyre analysis**
   - Scout detects stack, produces stack profile (GC1)
   - Atlas generates capabilities manifest (GC2)
   - Lens produces readiness backlog (GC3)
   - Record: time to first finding, total findings count, finding sources (static/contextual/cross-domain)

2. **Day 2: Team reviews capabilities manifest**
   - Engineering lead reviews each generated capability: relevant / irrelevant / missing
   - Track per-capability: was this already known? Is this surprising?
   - Engineering lead adds missing capabilities (amendments)
   - Record: accuracy before amendments, accuracy after amendments, amendment count

3. **Day 3: Team reviews readiness backlog**
   - Engineering lead reviews each finding: valid / false positive / unclear
   - For cross-domain findings specifically: "Were you aware of this interaction? Is the compound risk more severe than either individual finding?"
   - Post-review interview (30 min): surprises, concerns, trust level
   - Record: false positive rate, novel finding count, compound finding validity

### Phase 2 Primary Metrics

#### Metric 1: Model Accuracy

| Field | Value |
|-------|-------|
| **Metric** | Generated contextual model accuracy — % of capabilities confirmed relevant by team before amendments |
| **Target** | ≥70% accuracy on ≥2 of 3 stacks |
| **Failure** | <70% accuracy on ≥2 of 3 stacks |
| **Method** | Team reviews each capability in manifest: relevant / irrelevant / missing. Accuracy = relevant / (relevant + irrelevant). Missing capabilities tracked separately |
| **Tests** | A4 (model accuracy — the kill switch) |

#### Metric 2: False Positive Rate

| Field | Value |
|-------|-------|
| **Metric** | % of findings marked as false positives (irrelevant or incorrect) |
| **Target** | <30% false positive rate across all 3 stacks |
| **Failure** | >30% on any single stack, OR >40% aggregate |
| **Method** | Team reviews each finding in backlog: valid / false positive / unclear. FP rate = false positives / total findings |
| **Tests** | A4 (first-run credibility), H1 (trust) |

#### Metric 3: Novel Findings

| Field | Value |
|-------|-------|
| **Metric** | Number of contextual-model-sourced findings per analysis that team confirms as previously unknown |
| **Target** | ≥2 novel findings per analysis on ≥2 of 3 stacks |
| **Failure** | <2 novel findings on ≥2 of 3 stacks |
| **Method** | For each finding sourced from contextual model: "Did you already know about this gap?" Novel = team confirms they were not aware |
| **Tests** | H1 (discovery value), G1 (core gain) |

### Phase 2 Secondary Metrics

| Metric | Expected | Tests |
|--------|----------|-------|
| Post-amendment model accuracy | ≥85% | A4 (team amendments close the gap) |
| Review-and-amend adoption | ≥2/3 teams modify manifest | H1 (engagement signal — teams care enough to amend) |
| Cross-domain compound findings | ≥1 per analysis confirmed valid | A3 (compound risk bet) |
| Compound findings rated higher severity | Compound > individual findings | H3 (interaction effects are worse) |
| Time to first finding | <2 min | M1 (fast enough to be useful) |
| Findings addressable by static+contextual | ≥80% of valid findings | A6 (runtime not needed for MVP) |

### Gate to Phase 3

| Criterion | Target | Gate Decision |
|-----------|--------|---------------|
| Model accuracy ≥70% | On ≥2 of 3 stacks | **Pass:** Contextual model works |
| False positive rate <30% | Aggregate across stacks | **Pass:** First-run credibility intact |
| Novel findings ≥2 | Per analysis on ≥2 of 3 stacks | **Pass:** Discovery value confirmed |
| No guardrail triggered | Zero frustration signals | **Pass:** Safe to proceed |

**Phase 2 failure responses:**

| Failure | Interpretation | Action |
|---------|---------------|--------|
| Accuracy 60-69% on 2+ stacks | Model is directionally useful but too noisy | **Patch:** Improve model generation. Add domain-specific heuristics. Re-test on same stacks |
| Accuracy <60% on 2+ stacks | **Kill switch.** Model generation fundamentally unreliable | **Kill:** Halt experiment. Generated contextual model approach doesn't work. Return to Mila for HC2 re-synthesis. Consider hybrid: guided questions + static analysis (no generated model) |
| FP rate >30% | First-run credibility at risk | **Patch:** Investigate FP sources (stack-specific or systemic?). Tighten model generation. Re-test |
| Novel findings <2 on 2+ stacks | Discovery value is low — Gyre finds what teams already know | **Pivot:** Reframe from "discovery" to "acceleration" — Gyre confirms and prioritizes known gaps faster, not discovers unknown ones. Changes value proposition |
| Compound findings 0 across stacks | Cross-domain correlation doesn't produce unique insights | **Descope:** Remove compound findings from differentiation. 2-agent MVP is two independent readiness checkers, not an integrated system. Still valuable but different positioning |

---

## Phase 3: Sprint Integration Observation

**Purpose:** Test behavioral assumptions — do teams act on findings? Is prioritization effective? Does leadership consume the summary?

**Duration:** 2-4 weeks (1 sprint cycle)

**Prerequisites:**
1. Phase 2 gate passed
2. Same 5 pilot teams continue (3 from Phase 2 + 2 who had interviews only)
3. For the 2 teams not in Phase 2: run Gyre analysis and brief review before Phase 3 starts

### Execution Protocol

1. **Sprint planning observation (day 1 of sprint)**
   - Provide readiness backlog to engineering lead before sprint planning
   - Do NOT prompt them to act on it — observe whether findings enter sprint planning organically
   - Track: which findings discussed, which pulled into sprint, which deferred, which dismissed

2. **During sprint (passive observation)**
   - No intervention. Teams work normally
   - End of each week: brief check-in (5 min): "Did you work on any Gyre findings this week?"
   - Track: findings completed, findings started, findings deferred

3. **Leadership summary tracking**
   - Provide leadership summary alongside engineering backlog
   - Track: did engineering lead share with PM/CTO? Did PM/CTO reference it?

4. **Post-sprint interview (30 min)**
   - "Did Gyre change what you worked on this sprint?"
   - "Was the prioritization (blockers vs. recommended vs. nice-to-have) useful?"
   - "Did you share the readiness summary with anyone outside engineering?"
   - "Would you run Gyre again next quarter?"
   - "What would you change about the output format?"

### Phase 3 Primary Metrics

#### Metric 1: Sprint Pull Rate

| Field | Value |
|-------|-------|
| **Metric** | Number of teams that pull ≥1 blocker-tier finding into sprint without prompting |
| **Target** | ≥3/5 teams |
| **Failure** | <3/5 teams |
| **Method** | Observation during sprint planning + weekly check-in + post-sprint interview |
| **Tests** | A1 (engineering leads act on findings) |

#### Metric 2: Prioritization Effectiveness

| Field | Value |
|-------|-------|
| **Metric** | Teams confirm severity tiers helped them choose what to work on |
| **Target** | ≥4/5 teams rate prioritization as "helpful" or "very helpful" |
| **Failure** | <3/5 rate prioritization as helpful |
| **Method** | Post-sprint interview question: "Was the prioritization useful?" |
| **Tests** | A2 (RICE scoring works) |

#### Metric 3: Leadership Summary Consumption

| Field | Value |
|-------|-------|
| **Metric** | Number of teams that share readiness summary with non-engineering stakeholders |
| **Target** | ≥1/5 teams share summary with PM/CTO |
| **Failure** | 0/5 teams share |
| **Method** | Tracking + post-sprint interview |
| **Tests** | A5 (dual-audience value) |

### Phase 3 Secondary Metrics

| Metric | Expected | Tests |
|--------|----------|-------|
| Findings completed within sprint | ≥1 per team | A1 (follow-through, not just planning) |
| Re-run intent | ≥3/5 would run Gyre again next quarter | A9 (continuous value, not one-shot) |
| Organic referral | ≥1 team mentions Gyre to non-pilot team | Product-market fit signal |
| Output format satisfaction | ≥3/5 rate format as "useful" or "very useful" | UX validation |

---

## Decision Criteria (Pre-Registered)

### End-of-Experiment Decision Matrix

| Outcome | Trigger | Action |
|---------|---------|--------|
| **Full Persevere** | All 3 phases meet primary targets | Gyre E1 validated. Proceed with build confidence. All 3 hypotheses confirmed |
| **Partial Persevere** | Phase 1 + 2 pass. Phase 3: sprint pull ≥3/5 but leadership summary 0/5 | Model works, teams act. Leadership summary needs redesign. Proceed with build, adjust output format |
| **Patch — Model** | Phase 1 passes. Phase 2: accuracy 60-69% | Model directionally useful but noisy. Iterate on generation. Re-test before full pilot |
| **Patch — Action** | Phase 1 + 2 pass. Phase 3: sprint pull <3/5 but teams rate findings as "valid" | Findings are good but not actionable in current format. Investigate: sprint integration UX, finding granularity, effort estimates |
| **Pivot — Value Prop** | Phase 1: unknown gap ratio <60% | Teams know their gaps. Reframe Gyre as prioritization accelerator, not discovery tool |
| **Pivot — Method** | Phase 1: Gyre-detectable ratio <50% | Gaps are real but code analysis can't find them. Hybrid approach needed |
| **Kill** | Phase 2: accuracy <60% on 2+ stacks | Generated contextual model doesn't work. Fundamental rethink required |

---

## Guardrail Metrics

| Guardrail | Red Line | Action |
|-----------|----------|--------|
| **False positive cascade** | ≥2 pilot teams express frustration with irrelevant findings after Phase 2 | Immediate halt. First-run credibility is non-recoverable. Investigate model generation before any further exposure |
| **Privacy concern** | Any team raises concern about code leaving their environment | Immediate transparency: show exactly what data reaches the LLM. Provide data flow diagram. If not satisfiable, remove that team from pilot |
| **Stack failure** | Model generation fails entirely on ≥1 stack (no output or nonsensical output) | Document stack. Do not expose to team. Fix generator before proceeding. If ≥2 stacks fail, halt Phase 2 |
| **Team dropout** | ≥2 teams drop out before Phase 3 | Cohort too small for meaningful observation. Recruit replacements or extend timeline |
| **Negative perception spread** | Any pilot team discourages others from trying Gyre | Halt experiment. Investigate cause. First impressions spreading negatively is worse than no impressions |

---

## Expected Production Behavior (If Graduating)

If the 3-phase experiment validates all hypotheses:

1. **Scout agent** detects stack automatically — produces GC1 stack profile in <30 seconds
2. **Atlas agent** generates capabilities manifest — GC2 contextual model tailored to detected stack, reviewed and amended by team
3. **Lens agent** produces readiness backlog — GC3 RICE-scored findings with cross-domain correlation, source tagging, confidence ratings
4. **Coach agent** guides review session — GC4 interactive walkthrough of findings, amendment facilitation
5. **Expected metrics at scale:** ≥70% model accuracy (validated), ≥2 novel findings per analysis (validated), ≥1 compound finding per analysis (validated), <2 min to first finding (validated)

---

## Timeline

```
Week 1        Phase 1: Discovery Interviews (5 teams × 45 min)
              ├─ Categorize responses
              └─ Gate 1 decision

Weeks 2-3     Phase 2: Model Accuracy Pilot (3 stacks)
              ├─ Day 1-3: Stack 1 (run + review + interview)
              ├─ Day 4-6: Stack 2
              ├─ Day 7-9: Stack 3
              └─ Gate 2 decision

Weeks 4-7     Phase 3: Sprint Integration Observation
              ├─ Run Gyre on remaining 2 teams
              ├─ Observe 1 sprint cycle (all 5 teams)
              ├─ Weekly check-ins
              ├─ Post-sprint interviews
              └─ Final decision

Week 8        Aggregate analysis + decision
```

**Total elapsed time: 5-8 weeks** (vs. Forge's 6 weeks for Phase 1 alone)

**Key speed advantage:** Phase 2 gate (model accuracy) produces a go/no-go signal in 2 weeks. If A4 fails, the experiment halts at week 3 — 5 weeks saved vs. running through to Phase 3.

---

## Relationship to Existing Experiment

The pre-existing `lean-experiment-gyre-discovery-interviews-2026-03-20.md` covers Phase 1 in full detail with:
- 4 discovery questions with follow-up probes
- Categorization framework (per-interview cards)
- Aggregate analysis template
- 6 success criteria and decision matrix

This HC4 artifact **extends** that design by adding Phase 2 (model accuracy) and Phase 3 (sprint integration), creating the complete experiment chain from problem validation through behavioral validation.

---

## Vortex Compass

| If you learned... | Consider next... | Agent | Why |
|---|---|---|---|
| Experiment designed, metrics locked, ready for monitoring framework | **production-intelligence** | Noah 📡 | Define production signals that confirm or deny hypotheses at scale (HC4 → HC5) |
| Want to capture learning framework before running | **learning-card** | Max 🧭 | Pre-register the decision framework so criteria are institutional |
| Need to de-risk A4 before full pilot | Run Phase 2 first | Wade 🧪 | Model accuracy is testable in days — fast feedback before committing to full experiment |

**Recommended next:** Stream 6 — Sensitize (Noah). The experiment is designed and pre-registered across 3 phases. Noah defines the production monitoring framework — what signals will tell us Gyre is working (or failing) once it graduates from experiment to real tool.

---

**Created with:** Convoke v2.3.1 - Vortex Pattern (Externalize Stream)
**Agent:** Wade (Lean Experiments Specialist)
**Workflow:** lean-experiment
