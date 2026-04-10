---
contract: HC3
type: artifact
source_agent: liam
source_workflow: hypothesis-engineering
target_agents: [wade]
input_artifacts:
  - path: "_bmad-output/vortex-artifacts/hc2-problem-definition-strategy-perimeter-2026-04-05.md"
    contract: HC2
created: 2026-04-05
discovery-context: Self-Discovery Protocol — Strategy Perimeter (Wave 0.4)
pre-registration: pre-registration-strategy-perimeter-2026-04-04.md
---

# HC3 Hypothesis Contract: Strategy Perimeter

## 1. Problem Context

**Problem Statement:**
The judgment layer between "I have strategy frameworks" and "I made a defensible decision" doesn't exist as a transferable, structured practice. Experts carry it in their heads and can't externalize it. Novices don't know it exists and cope by reverse-engineering strategy from products or skipping it entirely. Both suffer from confidence gaps that prevent them from acting on analysis they've already done.

**JTBD Reference:**

> **Practitioner:** When I land on a new engagement with days to produce a recommendation, I want to systematically diagnose, select frameworks, and synthesize into a defensible position, so I can deliver a recommendation I'm confident in — without blind spots and grounded in both top-down and bottom-up reality.

> **Navigator:** When my board asks for "our strategy" and I have days to produce something I'll be judged on, I want to think through it with guidance that fills gaps I can't name, so I can present an analysis I understand, own, and can defend.

**Key Pains Targeted:**
- P1: No diagnostic layer (highest-scoring opportunity, 8.2)
- P2: Synthesis happens in heads, not process
- P3: Confidence-competence decoupling (universal bottleneck)
- P4: Top-down without bottom-up

---

## 2. Hypothesis Contracts

### Hypothesis 1: The Diagnostic Bet

> **We believe that** strategic practitioners under time pressure will complete a structured diagnostic step in <30 minutes and rate it as "time well spent" — because the diagnostic surfaces angles they would have missed through habitual framework selection, and this insight-generation outweighs the time cost.

| Field | Contract |
|-------|---------|
| **Expected Outcome** | Practitioner completes diagnostic step in <30 minutes. Rates it as "saved time downstream" or "surfaced something I'd have missed." Does NOT rate it as "overhead" or "redundant." At least 1 analytical angle surfaced that the practitioner wouldn't have considered without the diagnostic. |
| **Target Behavior Change** | Practitioner diagnoses situation BEFORE selecting frameworks (instead of jumping to habitual framework). Reaches for at least one analytical lens they wouldn't have considered without the diagnostic. |
| **Rationale** | HC2 Pain P1 (no diagnostic layer) scored highest at 8.2. Convergence across 7 artifacts on the integration gap as root cause. Practitioner persona: "framework selection is gut-driven" + "time pressure forces shortcuts." Current coping: gut selection or Google search for first credible recommendation. |
| **Riskiest Assumption** | **RA2: The diagnostic step won't feel like overhead under time pressure.** If the first interaction feels bureaucratic, adoption dies — regardless of whether the diagnostic produces better outcomes. The 15-minute test is the gate. |

**Falsification criteria:**
- Diagnostic rated "overhead" on 2+ test cases → H1 fails
- Diagnostic takes >45 minutes → H1 fails
- No new angle surfaced on either test case → RA1 (integration gap) fails alongside

**Tests simultaneously:** RA1 (integration gap is real) + RA2 (doesn't feel like overhead). Two "Test First" assumptions with one experiment.

---

### Hypothesis 2: The Transferability Bet

> **We believe that** a second practitioner — without the designing expert's 15+ years of synthesis experience — will produce strategic output that the expert rates as "defensible" when following the same Strategy workflows, because the workflows externalize enough of the judgment layer (diagnostic logic, framework selection, synthesis structure) to make strategic integration transferable.

| Field | Contract |
|-------|---------|
| **Expected Outcome** | Expert reviews output blind and rates it using pre-registered grading scale: (A) defensible — presentable with minor adjustments, (B) directionally right — fixable with a review pass, (C) fundamentally off — needs rework. Grade A = full pass. Grade B = partial pass. Grade C = fail. |
| **Target Behavior Change** | Second practitioner follows the workflow and produces a complete strategic assessment without needing mentoring, coaching calls, or "it depends" guidance from the expert. Maximum 2 clarifying questions allowed (not coaching interventions). |
| **Rationale** | HC2 Pain P2 (synthesis in heads) + P6 (knowledge transfer impossible). Amalik's core motivation: "lighten my cognitive load... so that I don't have to spend days on training or mentoring." If this fails, the Strategy perimeter builds a tool for experts who don't need it. |
| **Riskiest Assumption** | **RA3: Transferability works.** The workflows encode enough judgment for a non-expert to produce defensible output. If the quality gap between expert and non-expert output is too large, the core value proposition collapses. |

**Falsification criteria:**
- Expert rates output as Grade C ("fundamentally off") → H2 fails
- Second practitioner requires >2 coaching interventions → "without mentoring" claim fails
- Grade B (partial pass) → workflows need a built-in review layer, not a failure but a design revision

**Grading scale pre-registered to avoid post-hoc rationalization.**

---

### Hypothesis 3: The Dual-Mode Bet

> **We believe that** strategic practitioners will naturally use both process mode ("guide me through diagnosis") AND review mode ("challenge my existing analysis") depending on context — preferring review mode for domains they know well and process mode for unfamiliar territory — because experts default to their own judgment until they encounter uncertainty.

| Field | Contract |
|-------|---------|
| **Expected Outcome** | When offered both modes, practitioners use each at least once across 3 strategic engagements. Mode selection correlates with domain familiarity: familiar domain → review mode, unfamiliar → process mode. |
| **Target Behavior Change** | Practitioners engage Strategy agents in two distinct interaction patterns instead of forcing a single approach. The agents become both a guide (process) AND a sparring partner (review). |
| **Rationale** | UA1 (surfaced during assumption mapping): practitioners want both process change and output review. Amalik confirmed: "practitioners could do both." Empathy map: gut-check call is an existing informal review mode. Practitioner persona: time pressure forces shortcuts in unfamiliar territory, creating demand for process mode specifically when judgment is uncertain. |
| **Riskiest Assumption** | **UA1 (revised): The preference pattern correlates with domain familiarity.** If practitioners always prefer one mode regardless of context, dual-mode is over-designed. If the split is random, the preference model is wrong (but dual-mode may still be valuable for different reasons). |

**Falsification criteria:**
- Practitioner uses only one mode across 3+ engagements → dual-mode hypothesis fails (simplify to one mode)
- Mode selection doesn't correlate with domain familiarity → preference model wrong (investigate actual driver)
- Both modes used but with no pattern → dual-mode valuable but prediction wrong (keep both, drop the prediction)

**Design implication:** If H3 passes, every Strategy agent needs both a process entry point and a review entry point. This is an architecture decision, not just an adoption question.

---

## 3. Assumption Risk Map

| # | Assumption | Hypothesis | Lethality | Uncertainty | Priority | Validation Status |
|---|-----------|:---------:|:---------:|:-----------:|:--------:|:-----------------:|
| RA2 | Structured diagnosis doesn't feel like overhead | H1 | High | High | Test First | Unvalidated |
| RA1 | Integration gap is the real problem, not execution | H1 | High | Medium | Test First | Unvalidated |
| RA3 | Transferability — second practitioner produces defensible output | H2 | High | High | Test First | Unvalidated |
| NRA2 | Coach agent bridges the confidence gap | (Coach — deferred) | High | Medium | Test First | Partially validated (single observation) |
| UA1 | Dual-mode preference correlates with domain familiarity | H3 | Medium | Medium | Test Soon | Unvalidated |
| NRA1 | Novices have scattered knowledge, not zero | (Coach — deferred) | Medium | Medium | Test Soon | Partially validated (expert observation) |
| NRA3 | Strategy in margins produces defensible output | (Coach — deferred) | Medium | High | Test Soon | Unvalidated |
| UA3 | 4-agent decomposition is correct | All | Medium | Medium | Test Soon | Unvalidated |
| UA6 | Problem definition is complete | All | Medium | Medium | Test Soon | Unvalidated |
| UA2 | "Strategy integration" is a recognized category | All | Medium | High | Monitor | Unvalidated |
| UA4 | 2 test cases sufficient for generalizability | All | Medium | Medium | Monitor | Unvalidated |
| UA5 | No social stigma for AI-assisted strategy | All | High | Low | Monitor | Partially validated (field evidence) |
| A7 | Framework-agnostic architecture accommodates evolution | All | Low | Low | Monitor | Architecture constraint (not a bet) |
| A8 | Coach pattern replicable across teams | (Coach) | Low | High | Monitor | Unvalidated — too early |
| A9 | KE-consumable tags work for Forge integration | All | Low | High | Monitor | Depends on Forge Gate 2 |

---

## 4. Recommended Testing Order

| Priority | Assumption | Hypothesis | Method | Minimum Evidence |
|:--------:|-----------|:---------:|--------|-----------------|
| 1 | **RA2** — Diagnosis doesn't feel like overhead | H1 | 15-minute test during Convoke self-discovery case. Time the diagnostic step. Post-completion rating. | <30 min. Rated "saved time" or "surfaced new angle." "Overhead" = fail. |
| 2 | **RA1** — Integration gap is real | H1 | Same Convoke case: does the diagnostic surface angles practitioner wouldn't have reached? | ≥1 new angle surfaced. Rated "valuable" not "redundant." |
| 3 | **RA3** — Transferability | H2 | After Convoke + BP2 cases: peer runs workflows on third case. Expert blind review with pre-registered A/B/C grading. | Grade A or B. Grade C = fail. >2 coaching interventions = "without mentoring" fails. |
| 4 | **NRA2** — Coach bridges confidence gap | (Deferred) | BP2 external check: novice scenario. Pre/post confidence rating. | Confidence ≥6/10 post-Coach. <4/10 = fail. |
| 5 | **UA1** — Dual-mode preference pattern | H3 | Convoke case: offer both modes. Track natural gravitation. Repeat across 2-3 engagements with familiarity annotation. | Both modes used. Correlation with familiarity observable. |
| 6 | **NRA3** — Strategy in margins | (Deferred) | Pilot with novice team. Track sessions, hours, output quality. | ≤4 sessions, ≤12 hours. Output rated "presentable." |

**Testing dependency chain:**
- Priority 1+2 (RA2, RA1) testable during Convoke self-discovery case — **immediate**
- Priority 3 (RA3) requires completed workflows — **after Convoke + BP2 cases**
- Priority 4 (NRA2) requires Coach prototype + novice participant — **after Isla validation**
- Priority 5 (UA1) requires multiple engagements — **longitudinal, starts during Convoke case**
- Priority 6 (NRA3) requires novice team pilot — **after Coach designed**

---

## 5. Flagged Concerns

| Concern | Assumption(s) | Impact | Recommended Action |
|---------|:------------:|--------|-------------------|
| Navigator persona entirely expert-projected | NRA1, NRA2, NRA3 | Coach agent would be designed on unvalidated assumptions about novice behavior | **Route to Isla** for 3-5 novice interviews BEFORE Coach design. Specific question: "Walk me through the last time you faced a strategic decision." This does NOT block H1, H2, H3 — it blocks Coach design only. |
| Dual-mode architecture adds complexity | UA1, UA3 | If H3 fails, we've over-designed every agent with two entry points | **Design for easy removal.** Build process mode first (the current design). Add review mode as an extension, not a rewrite. If H3 fails, remove review mode with minimal cost. |
| Transferability has no precedent in this domain | RA3 | No known agentic strategy product has demonstrated that encoded workflows transfer strategic judgment | **Pre-register the A/B/C grading scale** (done above) to prevent post-hoc rationalization. Be prepared for Grade B (partial pass) as the most likely outcome — and have the "review layer" design ready as the patch. |

---

## Design Decisions Carried Forward

These decisions emerged during hypothesis engineering and should inform Wade's experiment design and the eventual Loom scaffolding:

1. **Dual-mode architecture:** Every Strategy agent needs both process mode (guided diagnostic) and review mode (challenge existing analysis). Process mode is primary; review mode is an extension. (Source: UA1 → H3)

2. **Framework-agnostic design:** Porter, Wardley, BMC, Rumelt are the initial default set. The orchestration logic must accommodate adding, swapping, or retiring frameworks. Agents own activities, not theories. (Source: A7 revision)

3. **Three-grade transferability scale:** Grade A (defensible), Grade B (directionally right, needs review pass), Grade C (fundamentally off). Pre-registered to prevent rationalization. (Source: H2)

4. **Coach blocked on Isla validation:** NRA1-3 must be validated with direct novice research before Coach agent is designed. This does NOT block H1, H2, H3 or the core 3-agent architecture. (Source: flagged concern #1)

5. **`[KE-CONSUMABLE]` tagging:** Every workflow step where external knowledge is consumed gets tagged. Manual input until Forge/KE is live. (Source: scope decision, carried through)

---

## Vortex Compass — Routing Decision

| What we know | Recommended next | Agent | Why |
|---|---|---|---|
| 3 hypothesis contracts with falsification criteria, testing order ready | **Experiment design** | Wade 🧪 | Design the Convoke self-discovery experiment targeting Priority 1-2 (RA2, RA1) |
| Navigator assumptions need direct research | **User interviews** (parallel) | Isla 🔍 | 3-5 novice interviews — blocks Coach, not core agents |
| Convoke self-discovery case is the primary experiment | **Lean experiment** | Wade 🧪 | The Convoke case tests H1 + H3 simultaneously |
| H2 (transferability) requires completed workflows | **After Convoke case** | Wade 🧪 | Can't test transferability until the workflows exist |

**Primary routing: Wade** — design the Convoke self-discovery experiment as a multi-hypothesis test (H1 priorities 1-2 + H3 priority 5). The Convoke case is where we get first signal on the riskiest bets.

**Parallel routing: Isla** — novice interviews to validate NRA1-3. This unblocks Coach design without delaying the core agent path.

---

**Created with:** Convoke v3.0.4 - Vortex Pattern (Hypothesize Stream)
**Agent:** Liam (Hypothesis Engineer)
**Workflows:** assumption-mapping + hypothesis-engineering
**Discovery context:** Self-Discovery Protocol — Strategy Perimeter (Wave 0.4)
