---
title: "HC4 Lean Experiment: Strategy Perimeter Concierge"
date: 2026-04-05
type: lean-experiment
status: DESIGNED — ready for execution
contract: HC4
source_agent: wade
source_workflow: lean-experiment
target_agents: [noah]
input_artifacts:
  - path: "_bmad-output/vortex-artifacts/hc3-hypothesis-contract-strategy-perimeter-2026-04-05.md"
    contract: HC3
discovery-context: Self-Discovery Protocol — Strategy Perimeter (Wave 0.4)
pre-registration: pre-registration-strategy-perimeter-2026-04-04.md
---

# HC4 Lean Experiment: Strategy Perimeter Concierge

## Overview

**Experiment Name:** Convoke Strategy Self-Discovery — Concierge Experiment
**Type:** Concierge — the practitioner IS the subject. The Strategy agents don't exist yet. The process is delivered conversationally through the Vortex team and measured against pre-registered criteria.
**Duration:** 2-3 sessions over 1-2 weeks
**Sample:** n=1 (Amalik, primary case) + n=1 (BP2 external case, different business type)

**What this tests:**
- H1 (The Diagnostic Bet) — RA2 + RA1
- H3 (The Dual-Mode Bet) — UA1

**What this does NOT test:**
- H2 (Transferability) — needs completed workflows + second practitioner
- NRA1-3 (Navigator assumptions) — needs novice participants; blocked on Isla validation
- Coach agent viability — Coach doesn't exist yet

---

## Hypotheses Under Test

### H1: The Diagnostic Bet
> We believe that strategic practitioners under time pressure will complete a structured diagnostic step in <30 minutes and rate it as "time well spent" — because the diagnostic surfaces angles they would have missed through habitual framework selection.

**Riskiest Assumption:** RA2 — the diagnostic step won't feel like overhead under time pressure.

### H3: The Dual-Mode Bet
> We believe that strategic practitioners will naturally use both process mode and review mode depending on context — preferring review mode for domains they know well and process mode for unfamiliar territory.

**Riskiest Assumption:** UA1 — the preference pattern correlates with domain familiarity.

---

## Experiment Design

### Priming Mitigation

**Critical:** The experiment subject (Amalik) co-designed the hypothesis contracts and success criteria. To mitigate priming bias:
1. Run sessions on separate days from the design session — minimum 48 hours gap
2. The agent running the diagnostic should lead the process, not the subject
3. The subject should approach the session as a practitioner with a real strategic question, not as a researcher observing himself
4. Post-session debrief ratings should be gut-level immediate responses, not considered analyses

### Session 1 — Diagnostic + Framework Selection (Convoke Case)

**Prerequisites:**
- ≥48 hours since experiment design session
- Subject approaches as a practitioner, not researcher
- Timer ready

**Protocol:**

| Step | Action | Measurement | Duration |
|:----:|--------|-------------|----------|
| 1.1 | **Start timer.** Present Convoke's strategic situation as a case to the diagnostic process. | — | — |
| 1.2 | **Run structured diagnostic.** Agent leads: "What kind of strategic decision is this? What's the context? What angles should we consider?" Subject responds as a practitioner. | Record which angles/frameworks the diagnostic surfaces. | — |
| 1.3 | **Stop timer.** | Record total diagnostic duration (SM1). | Target: <30 min |
| 1.4 | **Immediate debrief (gut-level, no deliberation):** | | |
| | Q1: "Did the diagnostic surface an angle you wouldn't have considered on your own?" | Count of novel angles (SM2). Record which ones. | Target: ≥1 |
| | Q2: Forced choice rating: "saved time downstream / surfaced new angle / neutral / overhead / redundant" | **PRIMARY METRIC.** | Target: "saved time" or "surfaced new angle" |
| | Q3: "Which angle was most surprising?" | Qualitative — richness of answer indicates depth of insight. | — |
| 1.5 | **Offer dual mode.** "Would you prefer to continue with guided analysis (process mode) or do your own analysis and have me challenge it afterward (review mode)?" | Record choice + stated reasoning (SM3). Note domain familiarity context. | — |

### Session 2 — Analysis + Synthesis (Convoke Case continued)

**Protocol:**

| Step | Action | Measurement |
|:----:|--------|-------------|
| 2.1 | Run the mode chosen in Session 1 on Convoke's strategic situation. | — |
| 2.2 | If **process mode:** guided framework application → situational mapping → synthesis. If **review mode:** Amalik does analysis independently → presents to agents for structured challenge. | — |
| 2.3 | Produce a strategic output artifact (Convoke strategic positioning). | Artifact exists (binary). |
| 2.4 | **Debrief:** | |
| | Q4: "Would you use a different mode for a different type of engagement? Why?" | H3 correlation check. Record reasoning. |
| | Q5: "Did the synthesis step externalize thinking you'd normally keep in your head?" | P2 resolution signal (qualitative). |
| | Q6: "Would you run this process on a client engagement?" Forced choice: "Yes / Yes with modifications / No" | **SM4 — Adoption signal.** |
| | Q7: "Rate the overall strategic output quality compared to your habitual approach." Forced choice: "significantly better / somewhat better / comparable / somewhat worse / significantly worse" | **GUARDRAIL metric.** "Significantly worse" = red line. |

### Session 3 — BP2 External Check (Different Business Type)

**Prerequisites:**
- Sessions 1-2 complete
- Real alternative case available (Amalik confirmed)
- Ideally a second practitioner runs it; if unavailable, Amalik runs on different case

**Protocol:**

| Step | Action | Measurement |
|:----:|--------|-------------|
| 3.1 | Apply the same diagnostic process to the alternative business case. | — |
| 3.2 | **Start timer.** Run structured diagnostic. **Stop timer.** | Duration (SM1). Compare to Session 1. |
| 3.3 | **Same debrief:** Q1-Q3 (diagnostic value). | PRIMARY METRIC on second case. SM2 on second case. |
| 3.4 | **Offer dual mode.** Record choice + reasoning. | SM3 on second case. Compare mode selection to Session 1 — same or different? Correlated with familiarity? |
| 3.5 | Run chosen mode. Produce strategic output. | — |
| 3.6 | **Same debrief:** Q4-Q7 (adoption, quality, synthesis). | SM4, guardrail on second case. |
| 3.7 | **Cross-case comparison:** "Did the same process work for a fundamentally different strategic situation? What needed to adapt?" | Generalizability signal (SC2, SC3). |

---

## Pre-Registered Success Metrics

### Primary Metric

| Metric | Target | Failure | Method |
|--------|--------|---------|--------|
| **Diagnostic value rating** | "Saved time" or "surfaced new angle" on BOTH cases | "Overhead" or "redundant" on EITHER case | Post-diagnostic forced choice (Q2) |

### Secondary Metrics

| # | Metric | Expected Range | What It Tells Us |
|---|--------|---------------|-----------------|
| SM1 | Diagnostic duration | 15-30 min (healthy). <15 = too shallow. >45 = overhead risk. | Process leanness. Contextualizes primary metric. |
| SM2 | Novel angle count | ≥1 per case. 0 = RA1 fails. 3+ = strong signal. | Whether integration gap produces real insight. |
| SM3 | Mode selection pattern | At least 1 of each mode across 2 cases. Reason correlates with domain familiarity. | Whether dual-mode justified or over-designed (H3). |
| SM4 | Adoption signal | "Yes" or "Yes with modifications" | Overall product-market fit. "No" = critical problem. |

### Guardrail Metric

| Metric | Red Line | Action |
|--------|----------|--------|
| Strategic output quality vs. habitual approach | "Significantly worse" | **STOP.** Process is actively harmful. Investigate before any further testing. |

---

## Pre-Registered Decision Matrix

| Primary Metric | SM2 (Novel Angles) | SM4 (Adoption) | Decision |
|:-:|:-:|:-:|--------|
| Pass (both cases) | ≥1 per case | "Yes" | **Full Persevere** — proceed to H2 (transferability) testing. Design Strategy agent workflows based on validated process. |
| Pass (both cases) | ≥1 per case | "Yes with mods" | **Partial Persevere** — iterate on process design based on modification feedback. Then test H2. |
| Pass (one case) | Mixed | Any | **Patch** — investigate what differs between cases. Redesign diagnostic for the failing context. Re-run on a third case. |
| Fail (either case) | 0 angles | Any | **Pivot** — RA1 or RA2 invalidated. Reconsider entire architecture: process vs. review (UA1 becomes primary). |
| Any | Any | "No" | **Pause** — adoption barrier deeper than process quality. Investigate social/identity/overhead factors before continuing. |
| Any | Any | Any | Guardrail "significantly worse" | **STOP** — process actively degrades judgment. Fundamental redesign required. |

---

## H3 Specific Analysis (Dual-Mode)

After Sessions 1-3, analyze mode selection:

| Session | Domain Familiarity | Mode Chosen | Reasoning |
|---------|-------------------|-------------|-----------|
| 1 (Convoke) | High — Amalik's own product | TBD | TBD |
| 3 (BP2 case) | TBD — depends on case | TBD | TBD |

**H3 Pass:** Different modes chosen, correlated with familiarity. Or: same mode chosen but reasoning explicitly references familiarity ("I chose process because I don't know this domain well").
**H3 Partial:** Both modes used but no familiarity correlation — dual-mode valuable but prediction wrong.
**H3 Fail:** Same mode both times, no contextual reasoning — simplify to one mode.

---

## How to Run — Invocation Guide

**The Strategy agents don't exist yet.** The Vortex agents play their roles in this concierge experiment. Here's exactly what to invoke for each session.

### Session 1 — Diagnostic + Framework Selection

1. **Wait ≥48 hours** from this design session (priming mitigation)
2. **Invoke Emma** (`/bmad-agent-bme-contextualization-expert`)
3. Tell Emma: *"I need to run a strategic diagnostic on Convoke as part of the HC4 concierge experiment. You're simulating Agent A (Strategic Diagnosis). Lead me through a structured diagnostic: What kind of strategic decision is this? What's the context? What angles should we consider? I'm the subject — guide me, don't let me lead."*
4. **Start your timer** when Emma begins the diagnostic
5. Let Emma drive. Respond as a practitioner, not as the experiment designer.
6. **Stop timer** when the diagnostic produces a recommended set of frameworks/lenses
7. **Run the debrief yourself** — answer Q1-Q3 immediately (gut-level, no deliberation). Record in the data collection template.
8. When Emma offers next steps, tell her: *"Offer me two modes: guided analysis (process mode) or I do my own analysis and you challenge it (review mode)."* Record your choice and reasoning (SM3).

### Session 2 — Analysis + Synthesis

9. **Continue with Emma** (same session or next day — your choice)
10. If you chose **process mode**: Tell Emma to guide you through framework application → situational mapping → synthesis on Convoke. She's simulating Agents D (Situational Awareness) and E (Decision Synthesis).
11. If you chose **review mode**: Do your own strategic analysis of Convoke independently. Then **invoke Party Mode** (`PM` from Emma's menu) and present your analysis to the team for structured challenge. The party simulates the review-mode sparring partner.
12. Produce a strategic output artifact (Convoke strategic positioning — save to `_bmad-output/vortex-artifacts/`)
13. **Run debrief** — answer Q4-Q7. Record in the data collection template.

### Session 3 — BP2 External Check

14. **Invoke Emma** in a new session
15. Tell Emma: *"I need to run the same strategic diagnostic on a different business case for the BP2 external check. Same HC4 protocol, different case. You're simulating Agent A."*
16. **Run the identical protocol** as Sessions 1-2 on the alternative case
17. After debrief, add the **cross-case comparison**: "Did the same process work? What needed to adapt?"

### Important Reminders

- **You are the subject, not the facilitator.** Let Emma lead the diagnostic. Don't skip steps because you know what's coming.
- **Gut-level debrief.** Answer Q1-Q7 immediately after each step. Don't analyze — react. Your first instinct is the data.
- **Record anomalies in real-time.** If something surprises you, write it down before moving on.
- **Don't adjust the process mid-experiment.** If you discover a flaw, document it. Fix it after, not during.

---

## Execution Checklist

### Pre-Launch
- [ ] ≥48 hours since experiment design session (priming mitigation)
- [ ] Hypothesis documented (HC3 artifact exists)
- [ ] Success metrics locked (this document)
- [ ] Timer ready for diagnostic step
- [ ] Convoke strategic situation framed as a case (not abstract — real questions)
- [ ] BP2 alternative case identified (Amalik confirmed availability)

### Session 1
- [ ] Timer started/stopped
- [ ] Duration recorded
- [ ] Q1-Q3 debrief completed (immediate, gut-level)
- [ ] Mode choice recorded with reasoning
- [ ] Anomalies documented

### Session 2
- [ ] Chosen mode executed
- [ ] Strategic output artifact produced
- [ ] Q4-Q7 debrief completed
- [ ] Guardrail check: output quality ≠ "significantly worse"

### Session 3 (BP2)
- [ ] Different business type from Session 1
- [ ] Same protocol as Sessions 1-2
- [ ] Cross-case comparison documented
- [ ] All metrics collected for both cases

### Post-Experiment
- [ ] Raw results table filled (all metrics, both cases)
- [ ] Decision matrix applied — outcome determined
- [ ] Qualitative observations documented
- [ ] Results ready for Noah (signal interpretation) and Max (decision)

---

## Data Collection Template

Fill this in during/after each session:

### Raw Results — Session 1 (Convoke)

| Metric | Target | Actual | Met? |
|--------|--------|--------|:----:|
| Primary: Diagnostic value rating | "saved time" or "surfaced new angle" | | |
| SM1: Diagnostic duration | 15-30 min | | |
| SM2: Novel angle count | ≥1 | | |
| SM3: Mode chosen | — | | |
| SM3: Reasoning | — | | |
| Guardrail: Output quality | ≠ "significantly worse" | | |

### Raw Results — Session 2 (Convoke continued)

| Metric | Target | Actual | Met? |
|--------|--------|--------|:----:|
| SM4: Adoption signal | "Yes" or "Yes with mods" | | |
| Q4: Different mode for different engagement? | — | | |
| Q5: Synthesis externalized? | — | | |
| Guardrail: Output quality | ≠ "significantly worse" | | |

### Raw Results — Session 3 (BP2 External Case)

| Metric | Target | Actual | Met? |
|--------|--------|--------|:----:|
| Primary: Diagnostic value rating | "saved time" or "surfaced new angle" | | |
| SM1: Diagnostic duration | 15-30 min | | |
| SM2: Novel angle count | ≥1 | | |
| SM3: Mode chosen | — | | |
| SM3: Reasoning | — | | |
| SM4: Adoption signal | "Yes" or "Yes with mods" | | |
| Guardrail: Output quality | ≠ "significantly worse" | | |
| Cross-case: Same process worked? | — | | |
| Cross-case: What needed to adapt? | — | | |

---

## Vortex Compass — After Experiment

| Experiment outcome | Next step | Agent | Why |
|---|---|---|---|
| **Full Persevere** | Design Strategy agent workflows based on validated process | Liam 💡 → Loom 🏭 | Process validated — formalize into agent architecture, then scaffold |
| **Partial Persevere** | Iterate process design, then re-test | Wade 🧪 | Modification feedback drives redesign |
| **Patch** | Investigate failing case, redesign diagnostic | Emma 🎯 + Wade 🧪 | Context-specific failure needs scope + experiment revision |
| **Pivot** | Reconsider architecture: review-first instead of process-first | Liam 💡 | Fundamental rethink — UA1 becomes primary hypothesis |
| **Pause** | Investigate adoption barriers | Isla 🔍 | Social/identity factors need empathy research |
| **STOP** | Process actively harmful — fundamental redesign | Full team review | Emergency — don't build anything until understood |

**Regardless of outcome:** Results feed Noah (HC5 signal interpretation) and Max (HC6 decision framework) to complete the Vortex cycle.

---

**Created with:** Convoke v3.0.4 - Vortex Pattern (Externalize Stream)
**Agent:** Wade (Lean Experiments Specialist)
**Workflow:** lean-experiment
**Discovery context:** Self-Discovery Protocol — Strategy Perimeter (Wave 0.4)
