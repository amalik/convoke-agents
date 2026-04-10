---
contract: HC4
type: artifact
source_agent: wade
source_workflow: lean-experiment
target_agents: [noah]
input_artifacts:
  - path: "_bmad-output/planning-artifacts/product-brief-gyre-2026-03-19.md"
    contract: product-brief
  - path: "_bmad-output/planning-artifacts/research/domain-operational-readiness-research-2026-03-19.md"
    contract: domain-research
title: "Lean Experiment: Gyre Discovery Interviews"
date: 2026-03-20
type: lean-experiment
status: designed
---

# Lean Experiment: Gyre Discovery Interviews

## Hypothesis

**We believe that** engineering leads (Sana persona) shipping production services **will** confirm that unknown operational readiness gaps — not known gaps — are their primary source of production incidents and launch delays, **because** 98% of engineering leaders report readiness failures and existing tools (checklists, IDPs) only address known gaps.

**Riskiest assumption:** Teams experience readiness failures primarily from gaps they didn't know existed (unknown unknowns), not from gaps they knew about but deprioritized (known trade-offs).

## Experiment Design

### Overview

Semi-structured interviews with 5 engineering teams. Same cohort serves as MVP pilot testers — interview first, build for their stacks, measure MVP success criteria against their usage. This dual-purpose cohort eliminates recruitment overhead and creates continuity from discovery through validation.

### Cohort Selection Criteria

| Criteria | Requirement | Rationale |
|----------|-------------|-----------|
| **Team size** | 5-12 engineers | Sana persona range |
| **Production service** | ≥1 service in production for ≥3 months | Must have experienced readiness gaps, not hypothetical |
| **Stack diversity** | ≥3 distinct stacks across the 5 teams | Validates generated contextual model across architectures |
| **No dedicated SRE** | ≤1 team with full-time SRE support | Primary persona (Sana) wears all hats |
| **Willing to pilot** | Committed to running `gyre analyze .` on their repo | Dual-purpose cohort requirement |

**Target mix:**

- 2 startups (Sana wears all hats)
- 2 mid-size (Sana + Ravi available)
- 1 with compliance pressure (Sana + Priya scenario)

### Interview Protocol

**Format:** 45-minute semi-structured interview
**Interviewer:** Product owner (Amalik)
**Recording:** With consent, for categorization accuracy
**Setting:** 1-on-1 with the engineering lead (Sana equivalent)

### The 4 Discovery Questions

Each question has a primary intent, follow-up probes, and maps to specific product brief assumptions.

---

**Q1: "What was the hardest part of going to production?"**

| Aspect | Detail |
|--------|--------|
| **Intent** | Surface the *felt* pain — what they remember. Memory bias toward the most painful moments reveals priority. |
| **Follow-up probes** | "Walk me through the last time." / "Who was involved?" / "How long did it take to resolve?" / "Was this the first time or a pattern?" |
| **Validates** | Problem statement (teams don't know what they don't know). Maps pain to the 4 readiness domains. |
| **Listen for** | Whether the answer describes a *known* gap they deprioritized or a gap they *discovered during the incident*. This is the key distinction. |
| **Categorize against** | Observability / Deployment / Compliance & Security / Capacity & FinOps / Cross-domain |

---

**Q2: "What did you discover too late?"**

| Aspect | Detail |
|--------|--------|
| **Intent** | Directly elicit unknown unknowns. Q1 gets the pain; Q2 isolates the *discovery moment* — the gap between what they planned for and what actually happened. |
| **Follow-up probes** | "When did you realize it was missing?" / "Could you have found it earlier? How?" / "What would have made it visible before launch?" / "Did any tool or review catch it?" |
| **Validates** | Core value proposition — Gyre discovers gaps teams didn't know existed. If teams consistently say "we knew but deprioritized," the hypothesis is weakened. |
| **Listen for** | The ratio of "I didn't know" vs "I knew but didn't prioritize." Also: cross-domain compound gaps (e.g., "we had monitoring but not on deployments, so we couldn't tell when a deploy broke things"). |
| **Categorize against** | Observability / Deployment / Compliance & Security / Capacity & FinOps / Cross-domain |

---

**Q3: "How do you currently assess production readiness?"**

| Aspect | Detail |
|--------|--------|
| **Intent** | Map the competitive landscape from the user's perspective. What they actually do (not what tools exist) reveals the real gap Gyre fills. |
| **Follow-up probes** | "Is it written down?" / "Is it the same across teams?" / "Who decides when you're ready?" / "What happens if someone disagrees?" / "Do you use any tools for this?" |
| **Validates** | "No structured process" claim (66% of leaders cite inconsistent standards). Also validates anti-persona boundary — if a team has a mature, working process, they're not the target. |
| **Listen for** | Checklists (static), tribal knowledge (walks out the door), "we just ship it" (no process), IDP scorecards (measure but don't discover). The absence of context-aware, stack-specific assessment confirms the gap. |
| **Categorize against** | No process / Static checklist / IDP/scorecard / Tribal knowledge / Other |

---

**Q4: "Would you trust findings from code analysis over a self-assessment questionnaire?"**

| Aspect | Detail |
|--------|--------|
| **Intent** | Validate the "observation over declaration" design decision. This is a product architecture question disguised as a preference question. |
| **Follow-up probes** | "Why?" / "Have you had self-assessments that turned out wrong?" / "What would make you trust an automated finding?" / "What would make you distrust one?" / "Would you want to review the model it used?" |
| **Validates** | Discovery method (code analysis vs self-assessment). Also validates the `.gyre/capabilities.yaml` review-and-amend workflow — if teams want to see what the tool "thinks" about their stack, the generated manifest has value. |
| **Listen for** | Trust conditions (accuracy threshold, explainability, ability to override). First-run credibility concern (Sana persona). Whether they want to *validate* the model (confirms review-and-amend UX) or just *consume* outputs. |
| **Categorize against** | Strong trust in code analysis / Conditional trust (with review) / Prefers self-assessment / No preference |

---

### Interview Flow

| Phase | Duration | Activity |
|-------|----------|----------|
| **Warm-up** | 5 min | Context setting. "We're building a tool that discovers operational readiness gaps in codebases. I want to understand your experience going to production." No product demo — pure discovery. |
| **Q1** | 10 min | Hardest part of going to production. Let them tell the story. Follow probes. |
| **Q2** | 10 min | What they discovered too late. This is the key question — spend time here. |
| **Q3** | 8 min | Current readiness assessment process. |
| **Q4** | 7 min | Code analysis vs self-assessment trust. |
| **Wrap-up** | 5 min | "Anything else about production readiness that keeps you up at night?" Explain MVP pilot: "We'd like to run our tool on your repo in a few weeks — would you be open to that?" |

### Categorization Framework

Each interview produces a structured categorization card:

```markdown
## Interview Card: [Team Name]

**Date:** [date]
**Interviewee:** [name, role]
**Team size:** [n]
**Stack:** [e.g., Node.js/Express on EKS]
**Production tenure:** [how long in production]
**Has dedicated SRE:** [yes/no]

### Q1 Categorization: Hardest Part

| Domain | Mentioned | Unknown at Time? | Severity (1-5) | Quote |
|--------|-----------|-------------------|-----------------|-------|
| Observability | | | | |
| Deployment | | | | |
| Compliance & Security | | | | |
| Capacity & FinOps | | | | |
| Cross-domain | | | | |

### Q2 Categorization: Discovered Too Late

| Finding | Domain | Was Unknown? | Could Gyre Detect? | Discovery Method (static/contextual/cross-domain) |
|---------|--------|-------------|---------------------|--------------------------------------------------|
| [finding 1] | | | | |
| [finding 2] | | | | |

**Unknown ratio:** [n unknown / n total findings]

### Q3 Categorization: Current Process

| Process Type | Details |
|-------------|---------|
| No process | |
| Static checklist | |
| IDP/scorecard | |
| Tribal knowledge | |
| Other | |

**Cross-team consistency:** [yes/no/partial]

### Q4 Categorization: Trust in Code Analysis

| Dimension | Response |
|-----------|----------|
| Trust level | [strong / conditional / prefers self-assessment / no preference] |
| Trust conditions | [what they need to trust it] |
| Wants to review model | [yes/no] |
| First-run concern | [what would make them write it off] |

### Pilot Readiness

| Item | Status |
|------|--------|
| Willing to pilot | [yes/no] |
| Stack for pilot | [stack details] |
| Repo access feasible | [yes/no] |
| Timeline constraints | [any] |
```

### Aggregate Analysis Template

After all 5 interviews, produce an aggregate analysis:

```markdown
## Aggregate Analysis (n=5)

### Unknown vs Known Gap Ratio
- Total gaps reported: [n]
- Unknown at time of incident: [n] ([%])
- Known but deprioritized: [n] ([%])
→ Hypothesis [validated/invalidated]: teams [do/don't] primarily suffer from unknown unknowns

### Domain Heat Map

| Domain | Times Mentioned (Q1) | Times Discovered Too Late (Q2) | Gyre-Detectable (Q2) |
|--------|---------------------|-------------------------------|----------------------|
| Observability | | | |
| Deployment | | | |
| Compliance & Security | | | |
| Capacity & FinOps | | | |
| Cross-domain | | | |

→ MVP agent selection [confirmed/adjusted]: [reasoning]

### Current Process Gap
- No process: [n/5]
- Static checklist: [n/5]
- IDP/scorecard: [n/5]
- Tribal knowledge: [n/5]
→ "No structured process" claim [confirmed/invalidated]

### Code Analysis Trust
- Strong trust: [n/5]
- Conditional (with review): [n/5]
- Prefers self-assessment: [n/5]
→ "Observation over declaration" design [confirmed/adjusted]
→ Review-and-amend UX [confirmed/not needed]

### Persona Validation
- Sana pattern confirmed: [n/5]
- Ravi pattern observed: [n/5]
- Priya pattern observed: [n/5]
→ Persona model [confirmed/adjusted]

### Cross-Domain Compound Gaps
[List any compound gaps reported across domains]
→ Cross-domain correlation feature [validated/not validated]

### MVP Adjustments
[Any scope changes based on interview findings]

### Pilot Cohort Confirmed
| Team | Stack | Willing | Timeline |
|------|-------|---------|----------|
| | | | |
```

## Pre-Defined Success Criteria

| Metric | Target Threshold | Rationale |
|--------|-----------------|-----------|
| **Unknown gap ratio** | ≥60% of reported gaps were unknown at time of incident | Validates core hypothesis: unknown unknowns > known trade-offs |
| **Gyre-detectable ratio** | ≥50% of Q2 findings could be detected by static analysis or contextual model | Validates that code analysis can surface these gaps |
| **Cross-domain mentions** | ≥3 compound gap examples across 5 interviews | Validates cross-domain correlation feature in MVP |
| **Code analysis trust** | ≥4/5 teams trust or conditionally trust code analysis over self-assessment | Validates "observation over declaration" design |
| **Process gap** | ≥3/5 teams have no structured, stack-specific readiness process | Validates problem statement |
| **Pilot commitment** | 5/5 teams commit to MVP pilot | Dual-purpose cohort intact |

### Decision Matrix

| Outcome | Action |
|---------|--------|
| All 6 criteria met | Proceed to MVP build with current product brief scope |
| 5/6 met, one partially | Proceed with minor adjustments to the weak area |
| Unknown gap ratio fails (<60%) | Pivot: reframe Gyre as "known gap accelerator" not "unknown gap discoverer" — different value prop |
| Gyre-detectable ratio fails (<50%) | Pivot: the gaps are real but code analysis can't find them — consider hybrid approach (analysis + guided questions) |
| Code analysis trust fails (<4/5) | Adjust: add more transparency to discovery method, emphasize review-and-amend UX |
| Pilot commitment fails (<5/5) | Recruit replacements before building — must have 5 pilot teams |

## Results

*To be completed after interviews*

## Decision

*Pivot or persevere — to be completed after aggregate analysis*

---

**Created with:** Convoke v2.3.1
**Workflow:** lean-experiment
**Input:** Product Brief — Gyre (2026-03-19), Domain Research — Operational Readiness (2026-03-19)
