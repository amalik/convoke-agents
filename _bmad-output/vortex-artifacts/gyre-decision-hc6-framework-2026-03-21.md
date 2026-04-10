---
contract: HC6
type: artifact
source_agent: max
source_workflow: learning-card
target_agents: [emma, mila, liam, wade, noah]
input_artifacts:
  - path: "_bmad-output/vortex-artifacts/hc5-signal-framework-gyre-2026-03-21.md"
    contract: HC5
  - path: "_bmad-output/vortex-artifacts/hc4-experiment-gyre-pilot-2026-03-21.md"
    contract: HC4
  - path: "_bmad-output/vortex-artifacts/hc3-hypothesis-contract-gyre-2026-03-21.md"
    contract: HC3
  - path: "_bmad-output/vortex-artifacts/hc2-problem-definition-gyre-2026-03-21.md"
    contract: HC2
created: 2026-03-21
status: PRE-REGISTERED
tags: [gyre, operational-readiness, decision-framework, contextual-model, production-readiness]
---

# HC6 Decision Framework: Gyre — Operational Readiness Discovery

> **Status:** PRE-REGISTERED — decision gates defined, assumption cascades pre-registered. Activates when Phase 1 interviews produce results. E1 build runs in parallel.

---

## One-Sentence Summary

We have designed but not yet validated that generated contextual models will accurately (≥70%) discover unknown readiness gaps in production stacks and that engineering leads will act on RICE-scored findings by pulling them into sprints, which means the next action is to run the 3-phase pilot experiment (interviews → model accuracy → sprint integration) and let the pre-registered decision criteria determine Gyre's fate.

**Confidence:** EXPLORATORY — framework complete, zero data. Will upgrade to LOW after Phase 1 interviews, MEDIUM after Phase 2 model accuracy pilot, HIGH after Phase 3 sprint integration + 20 teams.

---

## Vortex Discovery Completeness

| Stream | Agent | Artifact | Status |
|--------|-------|----------|--------|
| 1. Contextualize | Emma 🎯 | [scope-decision-gyre-2026-03-21.md](scope-decision-gyre-2026-03-21.md) | Complete — Gyre selected at 4.52/5, 5 alternatives de-scoped |
| 2. Empathize | Isla 🔍 | [lean-persona-engineering-lead](lean-persona-engineering-lead-2026-03-21.md), [lean-persona-sre-platform-engineer](lean-persona-sre-platform-engineer-2026-03-21.md), [lean-persona-compliance-officer](lean-persona-compliance-officer-2026-03-21.md) | Complete — 3 personas (Sana primary, Ravi v2+, Priya v2 activation), JTBD defined, forces mapped |
| 3. Synthesize | Mila 🔬 | [hc2-problem-definition-gyre](hc2-problem-definition-gyre-2026-03-21.md) | Complete — converged problem, 6 pains, 5 gains, 6 assumptions |
| 4. Hypothesize | Liam 💡 | [hc3-hypothesis-contract-gyre](hc3-hypothesis-contract-gyre-2026-03-21.md) | Complete — 3 hypotheses, 9 assumptions, testing order |
| 5. Externalize | Wade 🧪 | [hc4-experiment-gyre-pilot](hc4-experiment-gyre-pilot-2026-03-21.md) + [lean-experiment-gyre-discovery-interviews](lean-experiment-gyre-discovery-interviews-2026-03-20.md) | Complete — 3-phase pilot designed, metrics pre-registered |
| 6. Sensitize | Noah 📡 | [hc5-signal-framework-gyre](hc5-signal-framework-gyre-2026-03-21.md) | Complete — 14 signals, 6 anomaly patterns, 3-tier monitoring |
| 7. Systematize | Max 🧭 | This document | Complete — 4 decision gates, assumption cascades, strategy implications |

**Full Vortex cycle complete.** All 7 streams have produced artifacts. The discovery phase is done. The next phase is execution (Phase 1 interviews → Phase 2 model accuracy → Phase 3 sprint integration → decisions).

**Key difference from Forge:** Gyre E1 is already in active development (ADR-001 Phase 1). Discovery runs in parallel with build — it validates the "why" while E1 builds the "what." Forge's build depends on Enhance + Vortex redesign; Gyre's build is underway.

---

## Decision Gates

### Gate 1: Problem Validation (Phase 1 Complete — Week 1)

**Purpose:** Confirm the problem exists as described and the solution approach is viable

**Input:** Phase 1 interview results — 6 pre-registered criteria from existing experiment design

**Decision matrix:**

| Outcome | Trigger | Action | Next Gate |
|---------|---------|--------|-----------|
| **Proceed** | All 6 criteria met | Problem validated. Continue E1 build + proceed to Phase 2 | Gate 2 |
| **Adjust** | 5/6 met, one partially | Minor scope or positioning adjustment. Continue build with noted adjustment | Gate 2 |
| **Pivot** | Unknown gap ratio <60% | Reframe Gyre: "known gap accelerator" not "unknown gap discoverer." Adjust PRD value proposition. H1 hypothesis modified | Revised Gate 2 |
| **Halt** | Gyre-detectable <50% AND code analysis trust <4/5 | Solution approach invalid. Code analysis can't find the gaps AND teams don't trust it. Return to Mila | Back to Stream 3 |

**Phase-specific failure responses:**

| Criterion Failed | Likely Cause | Patch |
|-----------------|-------------|-------|
| Unknown gap ratio <60% | Teams know their gaps but deprioritize | Reposition: prioritization accelerator, not discovery tool |
| Gyre-detectable <50% | Gaps are real but in runtime/social domain, not code | Hybrid approach: code analysis + guided questions (Rune-like facilitation) |
| Code analysis trust <4/5 | Engineers prefer self-assessment or distrust automation | Heavier review-and-amend UX, more transparency, IDP-style questionnaire fallback |
| Process gap <3/5 | Teams have working readiness processes | Anti-persona misidentification. Target less mature teams or different market segment |

---

### Gate 2: Model Accuracy — THE KILL SWITCH (Phase 2 Complete — Week 3)

**Purpose:** Validate the core technical innovation. This is the highest-stakes gate

**Input:** V1, V2, V3 across 3 pilot stacks

**Decision matrix:**

| Outcome | Trigger | Action | Next Gate |
|---------|---------|--------|-----------|
| **Proceed** | V1 ≥70% on ≥2/3 stacks, V2 <30%, V3 ≥2 on ≥2/3 | Model works. Core innovation validated. Proceed to Phase 3 | Gate 3 |
| **Patch** | V1 60-69% on 2+ stacks, V2 <30% | Model directionally useful but noisy. Iterate on generation heuristics. Re-test on same stacks | Gate 2 (re-run) |
| **Kill** | V1 <60% on 2+ stacks | **Generated contextual model doesn't work.** Fundamental rethink. Consider: static-analysis-only (different product), hybrid guided-questions (different approach). Return to HC2 | Back to Stream 3 |
| **Descope** | V1 ≥70% but V3 <2 on all stacks | Model is accurate but not discovering unknowns. Reposition: acceleration tool (finds known gaps faster), not discovery tool (finds unknown gaps) | Adjusted Gate 3 |

**Why this gate is the kill switch:** Unlike Forge (where methodology can be patched and re-tested with a human), Gyre's contextual model either works at a technical level or it doesn't. A 55% accuracy model cannot be fixed by changing the user workflow — it requires fundamental changes to model generation. And first-run credibility in developer tooling is non-recoverable: engineers who see >30% false positives won't give a tool a second chance.

---

### Gate 3: Sprint Integration (Phase 3 Complete — Week 7)

**Purpose:** Validate behavioral change — technical product works, but do humans change behavior?

**Input:** Q1, Q4 from 5 pilot teams + post-sprint interviews

**Decision matrix:**

| Outcome | Trigger | Action | Next Gate |
|---------|---------|--------|-----------|
| **Proceed** | Q1 ≥60% (≥3/5 pull into sprint), Q4 ≥1/5 share summary | Technical + behavioral validated. Full confidence | Gate 4 |
| **Adjust** | Q1 ≥60% but Q4 = 0/5 | Teams act but don't share with leadership. Summary needs redesign. Continue build | Gate 4 |
| **Patch — Format** | Q1 <60% but findings rated "valid and useful" | Good findings, bad format. Sprint integration UX needs work (effort estimates? Jira export? Different granularity?) | Gate 3 (re-run) |
| **Patch — Timing** | Q1 <60%, teams say "useful but wrong time" | Findings arrive when sprint is already planned. Need anticipation mode (v2) or better timing integration | Gate 3 (re-run after timing fix) |
| **Pause** | Q1 <40% AND findings rated "not actionable" | Behavioral change not happening. Root cause investigation: format? relevance? organizational? | Investigation → Gate 3 (re-run) |

**Key question at this gate:** Is the action barrier a *format problem* (fixable) or an *organizational problem* (readiness always loses to features — not fixable with tooling)? If organizational, Gyre's value ceiling is "awareness and reporting," not "behavioral change." Still valuable, but a different product.

---

### Gate 4: Scale Readiness (20 Teams + v2 Planning)

**Purpose:** Validate Gyre is ready to scale and add complexity (new domains, Forge integration)

**Input:** Full Tier 1 + Tier 2 signals across 20+ teams, E3, E4

**Decision matrix:**

| Outcome | Trigger | Action |
|---------|---------|--------|
| **Scale** | V1-V5 Healthy across stacks, Q1-Q5 Healthy trends, E3 ≥2/quarter, E4 growing | Full product-market fit. Proceed to v2: Compliance & Security agent + anticipation mode |
| **Deepen** | V1-V5 Healthy but Q1 Warning or Q5 Warning | Product works but adoption/retention flagging. Invest in UX, onboarding, sprint integration before adding domains |
| **Narrow** | V1 Healthy on some stacks, Critical on others (AN1) | Stack coverage uneven. Focus on high-accuracy stacks. Stack-specific model templates for weak stacks before v2 |
| **Simplify** | AN6 confirmed (static valued, contextual model adds noise) | Core innovation underdelivering. Static-analysis-only as default, contextual model opt-in. Dramatic simplification |

**Strategic implication of Simplify:** Gyre still delivers value (static analysis finds misconfigurations and drift). But the "generated contextual model" innovation — the thing that makes Gyre fundamentally different from every existing tool — isn't working as the primary discovery mechanism. This changes Gyre from a "category-creating product" to a "better version of existing products."

---

## Assumption Cascade by Scenario

### Full Proceed (All Gates Pass)

| Assumption | Before | After | Note |
|-----------|--------|-------|------|
| A4 (model accuracy) | Assumed | Validated | ≥70% on 3+ stacks. Stack-specific variance documented |
| A1 (sprint pull) | Assumed | Validated | ≥60% pull rate across 5+ teams |
| A3 (compound findings) | Assumed | Validated | ≥1 per analysis confirmed. Differentiator real |
| A2 (RICE effectiveness) | Assumed | Validated | Teams confirm prioritization helped decide what to work on |
| A5 (leadership summary) | Assumed | Partially Validated | Some teams share. Format may need iteration. n=5 insufficient for confidence |
| A6 (static+contextual) | Assumed | Validated | <3 significant gaps from missing runtime data |
| **A7 (cross-team normalization)** | **Assumed** | **Unchanged** | **Cannot test in 5-team pilot — requires 20+ teams** |

### Model Accuracy Fails (A4 Invalidated — Kill)

| Impact | Change |
|--------|--------|
| Value proposition | Shifts from "discovers unknown-unknowns via generated model" to "accelerates known-gap assessment via static analysis" |
| Core innovation | Generated contextual model abandoned or fundamentally rearchitected |
| Competitive position | Loses primary differentiator. Becomes IDP-adjacent with better UX |
| Gyre scope | Reduces to static analysis tool. May descope from Team to fewer agents (per Capability Evaluation Framework) |
| Forge integration | FG-HC1 weakened — no contextual model to enrich with TKAs |
| ADR-001 | Not affected — Gyre E1 still proves team module pattern for Enhance regardless of model accuracy |

### Compound Findings Fail (A3 Invalidated)

| Impact | Change |
|--------|--------|
| Value proposition | Shifts from "cross-domain insight" to "parallel domain assessment" |
| Differentiation | Loses key moat. 2-agent MVP is two independent checkers sharing a UI |
| v2/v3 strategy | Additional domains add linear value, not exponential. Each domain is a standalone readiness checker |
| Gyre scope | Still valuable — parallel assessment beats ad-hoc checklists. But weaker positioning |

### Sprint Pull Fails (A1 Invalidated)

| Impact | Change |
|--------|--------|
| Value proposition | Gyre is "readiness awareness" not "readiness improvement" |
| Target user | Shifts from Sana (engineer who acts) to leadership (consumer of reports) |
| Output format | Needs fundamental redesign for consumption, not action |
| Key question | Format problem (fixable) or organizational problem (not fixable with tooling)? |

### Full Fail (A4 + A1 + A3 All Fail)

| Impact | Change |
|--------|--------|
| Value proposition | Unproven. Production readiness may not be discoverable via code analysis alone |
| Gyre | Paused. Not cancelled — learning captured for future re-examination |
| ADR-001 | Partially affected — Gyre E1 still proves team module pattern, but Gyre product value is uncertain |
| Ecosystem | Friction log capture accelerated. Look for new demand signals |
| Key question | Is the problem real but the solution wrong? Or is code analysis the wrong lens for readiness discovery? |

---

## Strategy Implications Pre-Registered

| Outcome | Value Proposition | Target User | Build Sequence |
|---------|------------------|-------------|----------------|
| Full Proceed | "Discovers unknown readiness gaps in your specific stack" | Sana (primary), Ravi (v2+) | ADR-001 proceeds: Gyre E1 → Enhance → Vortex redesign → Forge |
| A4 fails | "Accelerates known-gap assessment via static analysis" | Same users, narrower JTBD | Gyre simplifies. Still proves team module pattern for Enhance |
| A3 fails | "Parallel domain assessment, better than checklists" | Same users, weaker differentiation | Fewer domains may be better. Deep per-domain analysis over broad correlation |
| A1 fails | "Readiness reporting and awareness" | Sana + leadership (reports) | Output redesign. PM becomes primary consumer. Consider dashboard-first approach |
| All fail | Unproven | Reconsider lens | Gyre paused. Code analysis may be wrong approach. Explore guided-questions hybrid |

---

## Recommended Next Actions

### Immediately
1. **Run Phase 1 interviews** — 5 engineering leads, 45 min each, 4 discovery questions. Experiment already designed (`lean-experiment-gyre-discovery-interviews-2026-03-20.md`)
2. **Continue E1 build** — discovery and build run in parallel. Interviews don't block implementation
3. **Internal model testing** — run contextual model generator on ≥5 internal/test stacks before exposing to pilot teams. First-run credibility is non-recoverable

### This Sprint (E1 Context)
4. **Instrument V4 and V5** — time-to-first-finding and analysis completion should be automated from E1 launch
5. **Prepare Phase 2 materials** — accuracy tracking spreadsheet, finding review guide, post-review interview guide
6. **Identify pilot teams** — ≥3 distinct stacks, ≥1 "unusual" stack, mix of startup and mid-size

### This Quarter
7. **Execute Phase 2** — model accuracy pilot on 3 stacks. Go/no-go within 2 weeks (vs. Forge's 6-week shadow engagement)
8. **Execute Gate 2 decision** — use pre-registered criteria (V1 ≥70%, V2 <30%, V3 ≥2). Not improvised judgment
9. **If Gate 2 passes:** Execute Phase 3. Sprint integration observation, 2-4 weeks
10. **If Gate 3 passes:** Plan v2 scope (Compliance & Security agent + anticipation mode)

### Flag for Review
11. **AN6 early detection** — during Phase 2, explicitly ask: "Were static or contextual model findings more valuable?" If static consistently wins, flag before Phase 3
12. **Forge↔Gyre integration timing** — FG-HC1/HC2/GF-HC1 designed but activate only after both Gyre and Forge are in production. Don't force integration prematurely
13. **Ravi persona validation** — include ≥1 SRE/platform engineer in Phase 1 interviews (already noted in P1-disc). Ravi's portfolio pain validates v2/v3 features

---

## Learning Links

| Relationship | Reference |
|-------------|-----------|
| **Builds on** | Scope decision (Stream 1) — Gyre selected from 6 opportunities |
| **Builds on** | 3 lean personas — Sana (primary), Ravi (v2+ force multiplier), Priya (v2 compliance validator) |
| **Builds on** | PRD (43 FRs, 17 NFRs) — full product specification |
| **Builds on** | Domain research — $4.5B SRE market, competitor analysis |
| **Builds on** | ADR-001 — Gyre is Phase 1 (Active), first in build sequence |
| **Builds on** | Capability Evaluation Framework — Gyre entered as Tier 3 (Team), with demotion path if scope shrinks |
| **Informs** | Gyre E1 build — discovery validates "why" while E1 builds "what" |
| **Informs** | Gyre v2 planning — Compliance & Security agent + anticipation mode, gated by Gate 4 |
| **Informs** | Forge↔Gyre integration — FG-HC1/HC2/GF-HC1 activate post-both-teams-in-production |
| **Informs** | Enhance framework — Gyre E1 is the second reference module for template extraction |
| **Contradicts** | Nothing yet — first Vortex cycle for Gyre |
| **Enables** | Future learning cards from pilot results |
| **Enables** | Gyre v3 planning (FinOps agent + portfolio view + role-based sign-off) if Gate 4 passes at Scale |

---

## The Gyre Learning Cycle

```
                    ┌─────────────────────────────────────────┐
                    │         VORTEX DISCOVERY (COMPLETE)       │
                    │  Scope → Personas → Problem → Hypotheses │
                    │  → Experiment → Signals → Decisions       │
                    └──────────────────┬──────────────────────┘
                                       │
                              ┌────────┴────────┐
                              ▼                  ▼
                    ┌───────────────┐   ┌──────────────────┐
                    │  E1 BUILD     │   │  PHASE 1:        │
                    │  (parallel)   │   │  INTERVIEWS      │
                    │  Scout, Atlas │   │  5 teams, 1 week │
                    │  Lens, Coach  │   └────────┬─────────┘
                    └───────┬───────┘            │
                            │           ┌────────┴────────┐
                            │           ▼                  ▼
                            │  ┌───────────────┐  ┌──────────────┐
                            │  │  GATE 1:      │  │  GATE 1:     │
                            │  │  PASS         │  │  FAIL        │
                            │  │  Problem      │  │  Pivot /     │
                            │  │  validated    │  │  Halt         │
                            │  └───────┬───────┘  └──────────────┘
                            │          │
                            ▼          ▼
                    ┌─────────────────────────────────────────┐
                    │    PHASE 2: MODEL ACCURACY PILOT          │
                    │    3 stacks, 2 weeks — THE KILL SWITCH    │
                    │    V1 ≥70%? V2 <30%? V3 ≥2?              │
                    └──────────────────┬──────────────────────┘
                              ┌────────┴────────┐
                              ▼                  ▼
                    ┌───────────────┐   ┌──────────────────┐
                    │  GATE 2:      │   │  GATE 2:         │
                    │  PASS         │   │  KILL / PATCH    │
                    │  Model works  │   │  Rethink model   │
                    └───────┬───────┘   └──────────────────┘
                            │
                            ▼
                    ┌─────────────────────────────────────────┐
                    │   PHASE 3: SPRINT INTEGRATION             │
                    │   5 teams, 1 sprint — DO TEAMS ACT?       │
                    │   Q1 ≥60%? Q4 ≥1/5?                      │
                    └──────────────────┬──────────────────────┘
                            │
                            ▼
                    ┌─────────────────────────────────────────┐
                    │   GATE 4: SCALE READINESS (20 teams)      │
                    │   Full signals + Forge integration         │
                    │   Scale / Deepen / Narrow / Simplify       │
                    └─────────────────────────────────────────┘
```

---

**Created with:** Convoke v2.3.1 - Vortex Pattern (Systematize Stream)
**Agent:** Max (Learning & Decision Expert)
**Workflow:** learning-card
