---
contract: HC3
type: artifact
source_agent: liam
source_workflow: hypothesis-engineering
target_agents: [wade]
input_artifacts:
  - path: "_bmad-output/vortex-artifacts/hc2-problem-definition-gyre-2026-03-21.md"
    contract: HC2
created: 2026-03-21
---

# HC3 Hypothesis Contract: Gyre — Operational Readiness Discovery

> **3 hypothesis contracts, 9 assumptions mapped, 6 in "Test First/Test Soon" priority.**
> Domain research and PRD provide stronger starting evidence than Forge — but zero direct user validation exists.

---

## Problem Context

**Problem Statement (from HC2):**
Software teams shipping to production face a structural readiness gap: they don't know what they don't know. SRE expertise, DORA research, and compliance frameworks exist — but teams cannot map this knowledge to their specific stack and context. Generic checklists miss stack-specific gaps, single-domain tools miss compound risks, and flat lists fail to prioritize. The result: readiness gaps surface as incidents, not findings.

**JTBD Reference:**
> When I'm preparing to ship a service to production (or already running one that had an incident), I want to systematically discover what readiness gaps exist in my specific stack — across observability, deployment, compliance, and infrastructure — so I can prioritize the highest-impact fixes, communicate clearly to leadership about launch readiness, and avoid surprises that cause incidents or audit failures.

**Key Pains Targeted:**
- P1: Unknown-unknowns — no context-specific discovery (High)
- P2: Cross-domain blind spots — compound risks invisible (High)
- P3: No prioritization — flat lists paralyze or invite risk-taking (High)
- P4: Leadership visibility gap — no evidence for "when can we go live?" (Medium)

---

## Hypothesis Contracts

### Hypothesis 1: The Contextual Discovery Bet

**Hypothesis Statement:**
> We believe that engineering leads running Gyre on their codebase will discover ≥2 previously unknown readiness gaps per analysis and confirm ≥70% of the generated capabilities manifest as relevant to their stack, because the contextual model detects what *should* exist based on the detected stack — not what a generic checklist says — and compares it against what *does* exist, surfacing absences that are invisible to predefined criteria.

| Field | Answer |
|-------|--------|
| **Expected Outcome** | ≥70% model accuracy before amendments (≥85% after), ≥2 novel findings per analysis confirmed as previously unknown to the team, <30% false positive rate, ≥60% of pilot teams modify the generated manifest (engagement signal) |
| **Target Behavior Change** | From "copy checklist from blog post, check what we remember to check" to "review generated model, amend for our context, act on absence-detection findings." Observable: model amendment rate, novel finding count, false positive dismissal rate, review-and-amend adoption |
| **Rationale** | HC2 P1 is highest-impact pain (unknown-unknowns). G1 is the core innovation. The generated contextual model is what makes Gyre fundamentally different from IDPs and checklists — it discovers what "ready" means per stack instead of checking against predefined criteria. If this doesn't work, Gyre has no unique value. Bold claim: absence detection (finding what's missing, not just what's misconfigured) is the primary value — the "aha!" moment |
| **Riskiest Assumption** | **A4: Generated contextual models are accurate enough (≥70%) for first-run trust.** If models produce >30% false positives or miss obvious things, engineers dismiss Gyre permanently. First impressions are the only impressions in developer tooling. The PRD's kill switch (70% accuracy) exists for this reason |

**Falsification criteria:** Model accuracy <70% before amendments, OR <2 novel findings per analysis, OR false positive rate >30%, OR ≥3/5 pilot teams don't modify the manifest (no engagement)

---

### Hypothesis 2: The Actionable Prioritization Bet

**Hypothesis Statement:**
> We believe that RICE-scored readiness backlogs with 3 severity tiers (blockers, recommended, nice-to-have) will cause engineering leads to pull ≥1 blocker-tier finding into their next sprint without external prompting, because prioritization transforms a paralyzing flat list into a focused action queue where the most impactful items are obvious — and the sprint-compatible format means readiness work integrates into existing planning workflows instead of competing with feature work.

| Field | Answer |
|-------|--------|
| **Expected Outcome** | ≥3/5 pilot teams pull ≥1 blocker-tier finding into their next sprint. Findings acted on within 2 sprints of discovery. ≥1 team shares the leadership summary with PM/CTO |
| **Target Behavior Change** | From "everything looks equally important → do nothing or panic" to "fix the top 3 blockers this sprint, defer the rest." Observable: sprint pull rate, time from finding to action, leadership summary sharing |
| **Rationale** | HC2 P3 (no prioritization) is what prevents behavior change even when discovery works. A team that discovers 20 gaps but can't prioritize them is no better off than a team that doesn't know. RICE scoring is the mechanism that converts findings into action. Source tagging (static vs. contextual) and confidence ratings let teams trust the prioritization. Bold claim: Gyre findings compete successfully with feature work in sprint planning |
| **Riskiest Assumption** | **A1: Engineering leads will act on findings — pulling into sprints alongside feature work.** The hardest behavior change: readiness competes with features for sprint capacity. If findings stay in a report and never reach the sprint board, Gyre is a reporting tool, not a behavior-changing tool |

**Falsification criteria:** <3/5 teams pull any finding into sprint, OR findings not acted on within 2 sprints, OR teams report "useful information but we can't prioritize it over features"

---

### Hypothesis 3: The Compound Risk Bet

**Hypothesis Statement:**
> We believe that cross-domain correlation between Observability and Deployment findings will produce ≥1 compound risk finding per analysis that teams confirm as valid, previously invisible, and more impactful than either constituent finding alone, because interaction effects between domains create emergent risks that no single-domain assessment tool can detect — and these compound risks are often the ones that cause the worst production incidents.

| Field | Answer |
|-------|--------|
| **Expected Outcome** | ≥1 compound finding per analysis confirmed valid by team. Team confirms: (1) they weren't aware of the interaction, (2) the compound risk is more severe than either individual finding, (3) they would prioritize the compound finding. Example: "no rollback telemetry + no deployment event markers = blind rollbacks — you can't detect or recover from failed deploys" |
| **Target Behavior Change** | From "assess each domain independently, miss interactions" to "actively look for how gaps in one domain amplify risks in another." Observable: compound finding count, team validation rate, compound finding RICE score relative to single-domain findings |
| **Rationale** | HC2 P2 (cross-domain blind spots) is Gyre's key differentiator. Every existing tool assesses one domain at a time. Cross-domain correlation is what makes Gyre's 2-agent MVP more than the sum of its parts. If compound findings are real, this differentiator deepens with every additional domain agent (v2 Compliance, v3 FinOps). If they're not, Gyre is two independent readiness checkers sharing a UI. Bold claim: compound findings are where the worst incidents hide |
| **Riskiest Assumption** | **A3: Cross-domain correlation produces findings that single-domain tools can't find.** If compound findings are trivial ("you should have monitoring AND good deployments" — obvious), or non-existent (domains are truly independent), Gyre's competitive moat collapses. The differentiator is the interaction effect, not the individual findings |

**Falsification criteria:** <1 compound finding per analysis, OR compound findings rated as "obvious" by team, OR compound findings not rated higher than individual findings

---

## Assumption Risk Map

| # | Assumption | Hypothesis | Lethality | Uncertainty | Priority | Status |
|---|-----------|-----------|-----------|-------------|----------|--------|
| A4 | Generated models accurate enough (≥70%) for first-run trust | H1 | High | High | **Test First** | Unvalidated |
| A1 | Engineering leads act on findings (pull into sprints) | H2 | High | High | **Test First** | Unvalidated |
| A3 | Cross-domain correlation finds unique compound risks | H3 | High | Medium | **Test First** | Unvalidated |
| A2 | RICE scoring effectively prioritizes (blockers vs nice-to-have) | H2 | Medium | Medium | **Test Soon** | Unvalidated |
| A5 | Leadership summary consumed by non-technical stakeholders | H2 | Medium | Medium | **Test Soon** | Unvalidated |
| A6 | Static + contextual model sufficient without runtime data | H1 | Medium | High | **Test Soon** | Unvalidated |
| A7 | Cross-team normalization possible for portfolio view (Ravi) | H2 | Medium | High | **Test Later** | Unvalidated |
| A8 | Teams self-serve without Ravi pushing | H2 | Low | Medium | **Test Later** | Unvalidated |
| A9 | Teams re-run quarterly, not just in crisis | H1, H2 | Low | Medium | **Test Later** | Unvalidated |

**Risk map visualization:**

```
                    High Uncertainty    Medium Uncertainty    Low Uncertainty
                    ─────────────────   ──────────────────   ───────────────
High Lethality      A4, A1              A3                    —
                    ▲ TEST FIRST        ▲ TEST FIRST

Medium Lethality    A6, A7              A2, A5                —
                    △ TEST SOON         △ TEST SOON

Low Lethality       —                   A8, A9                —
                                        ○ TEST LATER
```

---

## Recommended Testing Order

| Priority | Assumption | Hypotheses | Method | Minimum Evidence |
|----------|-----------|-----------|--------|--------------------|
| 1 | **A4: Model accuracy ≥70%** | H1 | Run contextual model generator on 3 real codebases from pilot teams. Team reviews generated manifest. Track accuracy before and after amendments | ≥70% accuracy before amendments on ≥2 of 3 stacks. <30% false positive rate |
| 2 | **A1: Sprint pull rate** | H2 | After model accuracy validated, observe pilot teams for 1 sprint. Track which findings were pulled into sprint planning | ≥3/5 teams pull ≥1 blocker without prompting |
| 3 | **A3: Compound risk value** | H3 | During same pilot, present cross-domain findings separately. Ask: "Were you aware of this interaction? Is the compound risk more severe?" | ≥1 compound finding per analysis rated valid and previously unknown |
| 4 | **A2: RICE scoring effectiveness** | H2 | Post-sprint interview: "Did the severity tiers help you prioritize? Would you have picked the same items without RICE scoring?" | Teams confirm prioritization helped. Different teams with different stacks still find tiers useful |
| 5 | **A5: Leadership summary consumption** | H2 | Track: did any pilot team share the leadership summary with PM/CTO? Post-pilot: ask PM "was the summary useful?" | ≥1 team shares summary. Recipient confirms it answered "when can we go live?" |
| 6 | **A6: Static + contextual sufficiency** | H1 | Post-pilot: catalog what pilot teams say Gyre missed. Categorize: would runtime data have caught it? | <3 significant gaps attributable to missing runtime data |

**Testing order rationale:**
- A4 gates everything — if the model isn't accurate, nothing else matters. Unlike Forge (which needed a 6-week engagement), Gyre can test A4 in days by running the generator on real codebases
- A1 is second — even with accurate models, findings must convert to action
- A3 is third — determines whether Gyre has a moat or is just "two readiness tools in a trench coat"
- A2, A5, A6 can be tested concurrently during the pilot observation period

**Key advantage over Forge's testing cycle:** Gyre's riskiest assumption (A4: model accuracy) can be tested in days, not weeks. Run the generator on 3 codebases, have teams review. Feedback loop is 10x faster than Forge's 6-week shadow engagement.

---

## Flagged Concerns

| Concern | Impact | Recommended Action |
|---------|--------|-------------------|
| **Zero direct user validation** — all hypotheses rest on domain expertise, PRD analysis, and domain research, not interviews | H1 and H2 could be grounded in incorrect assumptions about engineering lead behavior | P1-disc interviews (5 teams) are already designed. Run them before the model accuracy test to validate problem severity and willingness to adopt |
| **2-agent compound limitation** — with only Observability + Deployment in MVP, cross-domain correlation is limited to one pair | H3 is tested on the easiest case (2 domains most likely to interact). Compound findings with Compliance or FinOps are untested | Accept MVP limitation. If H3 validates on the Obs×Deploy pair, each new domain agent multiplies compound finding opportunities |
| **First-run credibility is binary** — unlike Forge where methodology can be patched and re-tested, a bad first impression with Gyre kills adoption permanently | H1 failure has no "partial persevere" path. Engineers don't give developer tools a second chance | Invest heavily in model accuracy before any user-facing pilot. Internal testing on ≥5 stacks before exposing to pilot teams |
| **Pilot team selection bias** — 5-team cohort (same for interviews and testing) may not represent stack diversity | All 3 hypotheses could validate on familiar stacks but fail on edge cases | Ensure pilot includes ≥3 distinct stacks (e.g., Node.js/EKS, Python/Lambda, Java/Spring Boot). Include ≥1 "unusual" stack |

---

## Vortex Compass

| If you learned... | Consider next... | Agent | Why |
|---|---|---|---|
| 3 hypotheses with testable assumptions, testing order defined | **lean-experiment** | Wade 🧪 | Design experiments targeting riskiest assumptions (HC3 → HC4) |
| Zero user validation flagged as concern | **user-interview** | Isla 🔍 | P1-disc 5-team interviews to validate problem before experimenting |
| Testing order clear, ready to define signals | **production-intelligence** | Noah 📡 | Define production signals that confirm or deny hypotheses |

**Recommended next:** Stream 5 — Externalize (Wade). Three hypothesis contracts are ready with explicit testing order. Gyre has a key advantage: A4 (model accuracy) can be tested in days by running the generator on real codebases — no 6-week engagement required. Wade designs the experiment protocol.

**Note on P1-disc:** Wade's 5-team interview experiment already exists (`lean-experiment-gyre-discovery-interviews-2026-03-20.md`). The HC4 experiment should build on this — interviews validate the problem, then model accuracy test validates the solution. Two-phase experiment design.

---

**Created with:** Convoke v2.3.1 - Vortex Pattern (Hypothesize Stream)
**Agent:** Liam (Hypothesis Engineer)
**Workflow:** hypothesis-engineering
