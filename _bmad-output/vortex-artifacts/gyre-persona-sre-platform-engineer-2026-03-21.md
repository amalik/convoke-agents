---
title: "Lean Persona: Ravi — SRE / Platform Engineer"
date: 2026-03-21
created-by: Amalik with Emma (contextualization-expert)
type: lean-persona
status: HYPOTHESIS
version: 1.0
scope-decision: scope-decision-gyre-2026-03-21.md
---

# Lean Persona: Ravi — SRE / Platform Engineer

> **Remember:** This is a hypothesis until validated. Every insight below needs testing with real users.

## Executive Summary

**Job-to-be-Done:**
When supporting multiple product teams' production readiness across the organization, see normalized risk trends and readiness gaps across all services so I can prioritize which teams need attention, enforce consistent baselines, and stop being the bottleneck for ad-hoc readiness reviews.

**Riskiest Assumptions:**
1. A6: Ravi sees Gyre as a force multiplier, not a replacement or surveillance tool — adoption depends on positioning
2. A7: Cross-team normalization is possible — different stacks, different contexts, yet comparable readiness signals
3. A8: Teams will self-serve with Gyre output instead of requesting Ravi's manual reviews

**Next Validation Steps:**
1. Include ≥1 SRE/platform engineer in P1-disc 5-team interviews — validate portfolio pain and cross-team visibility need
2. Test normalization: can Gyre outputs from different stacks be meaningfully compared?
3. Observe whether teams share Gyre output with Ravi proactively or still request manual reviews

---

## Job-to-be-Done

### Primary Job

> **When** I'm supporting multiple product teams' production readiness across the organization,
> **I want to** see normalized risk trends and readiness gaps across all services I support,
> **so I can** prioritize which teams need my attention, enforce consistent baselines, and stop being the bottleneck for ad-hoc "can you review our readiness?" requests.

### Functional Job
Maintain production readiness standards across 5-15+ services. Detect drift from golden paths. Identify which teams are at highest risk. Review readiness evidence, not hand-hold teams through assessments.

**Evidence:** Product brief (Ravi persona: "Teams come to me with readiness reports based on actual code analysis. I see risk trends across all my services and know which need attention. I review artifacts, not hand-hold."), PRD portfolio view (v3)

### Emotional Job
Feel in control of a portfolio that's too large for one person to manually review — not stretched thin and perpetually behind.

**Evidence:** Product brief (Ravi's problem: "stretched thin across too many services"), anti-metrics ("readiness score as a KPI — scores track improvement, not team ranking")

### Social Job
Be perceived as the person who elevated the organization's operational maturity — not the bottleneck who slows down launches.

**Evidence:** Product brief (Ravi's two modes: single-team reviewer vs. org-wide platform deployer), user journey step 3 ("Ravi deploys org-wide in platform mode")

### Context

- Maintains platform infrastructure, defines golden paths, supports multiple product teams
- Operates in two modes: (1) reviewing a single team's Gyre output as expert, (2) deploying Gyre org-wide as a platform capability
- At enterprise scale, supports 5-15+ services across different stacks and team maturity levels
- Expert who knows what "good" looks like but can't be everywhere at once

### Frequency & Importance

- **Frequency:** Continuous — Ravi's portfolio never stops evolving. Reviews are triggered by team requests, launches, incidents, and quarterly assessments
- **Importance:** High — Ravi is the organizational multiplier. His effectiveness determines whether readiness is consistent or team-dependent

### Current Solution

Manual reviews on request + golden path templates + IDP scorecards. Ravi wrote the rules but can't verify adoption or detect drift at scale. Reactive, not proactive.

---

## Current State Analysis

### How They Solve It Today

1. **Manual reviews on request** — Teams come to Ravi: "we're launching Monday, can you review?" He spends 4-8 hours per review, often too late to make meaningful changes
2. **Golden path templates** — Ravi defines standard IaC, CI/CD, and observability templates. Teams adopt them initially but drift over time. No automated drift detection
3. **IDP scorecards** (Cortex/Backstage) — Shows compliance scores against rules Ravi wrote. Measures known criteria, doesn't discover gaps Ravi hasn't codified yet
4. **Firefighting** — When a team has an incident, Ravi joins the war room. Post-incident, he writes recommendations that may or may not be followed
5. **Org-wide audits** — Quarterly manual sweep across services. Takes 2-3 weeks. Findings are stale by the time he finishes

### Pain Points with Current Solution

| # | Pain | Severity | Frequency | Evidence |
|---|------|----------|-----------|----------|
| P1 | **Teams come too late** — "we're launching Monday" leaves no time for meaningful review | High | Every launch | Product brief (Ravi's problem statement) |
| P2 | **No cross-team visibility** — can't see which of 15 services needs attention most. Priority is whoever shouts loudest | High | Continuous | PRD portfolio view requirement (v3) |
| P3 | **Consistency impossible** — each team defines "ready" differently. No shared baseline that adapts to different stacks | Medium | Every review | PRD: 66% cite inconsistent standards |
| P4 | **Golden path drift** — templates exist but teams deviate silently. Drift is invisible until the next manual review or incident | Medium | Continuous | PRD: IaC verification, golden path compliance |
| P5 | **Review bottleneck** — Ravi is a single point of failure. His review bandwidth caps the organization's launch velocity | Medium | Every launch | Product brief (50% reduction in ad-hoc requests as success metric) |

**Root cause convergence:** P1-P5 converge on: **Ravi's expertise doesn't scale.** He knows what to look for, but can't look at everything. Gyre scales the looking, Ravi retains the judgment.

### Workarounds & Hacks

- Maintains a "readiness review request queue" in Jira — teams submit requests, Ravi triages by launch date urgency
- Wrote a shell script that checks for basic golden path compliance (Dockerfile exists, CI config has required stages) — brittle, doesn't understand context
- Delegates "easy" reviews to senior engineers on product teams — inconsistent quality
- Publishes a quarterly "state of production" Confluence page — high effort, quickly stale
- "Office hours" for readiness questions — well-intentioned but poorly attended (teams only come when they're already in crisis)

### Cost of Current Solution

- **Direct:** 4-8 hours per manual review × 15+ services × quarterly = 60-120 hours/quarter on reviews alone
- **Indirect:** Inconsistent readiness across teams → some teams launch well, others have incidents. Ravi's reputation tied to teams he couldn't review in time
- **Opportunity cost:** Time spent on reviews is time not spent improving the platform
- **Organizational cost:** Readiness becomes Ravi-dependent. If Ravi leaves, the organization loses its readiness standard

---

## Problem Contexts

### When Does This Problem Occur?

- **Launch surge:** Multiple teams launching in the same quarter. Ravi can't review them all
- **Post-incident:** Ravi joins the war room, discovers gaps he would have caught in review — if he'd had time
- **Quarterly audit:** Manual sweep across all services reveals drift that accumulated silently
- **New team onboarding:** Team adopts the platform without understanding the golden paths. Drift from day one
- **Regulatory change:** New compliance requirement (EU AI Act) requires reassessing all services. Manual effort multiplied by service count

### Where Does This Problem Occur?

- Across the **platform layer** — golden path templates, shared infrastructure, CI/CD pipelines
- In **team-owned services** — each team's drift from baselines is invisible to Ravi until review
- In **the gap between platform and product** — Ravi defines standards, teams interpret them differently
- In **organizational planning** — leadership wants aggregate readiness data that doesn't exist

### Why Does This Problem Matter Now?

- Microservices architectures multiply the number of services Ravi supports (from 3-5 monoliths to 15-30 services)
- Platform engineering is the industry response, but platform engineers are scarce and expensive
- Regulatory scope expanding — more compliance requirements per service per quarter
- Developer experience expectation: teams expect self-service, not gatekeeping

### What Triggers the Need?

1. **Scale inflection** — Ravi's portfolio grows past what manual review can cover (typically 8-10 services)
2. **Incident cluster** — Multiple teams have readiness-related incidents in the same quarter
3. **Compliance mandate** — New regulation requires org-wide reassessment
4. **Platform team formation** — Organization decides to formalize platform engineering. Needs tooling, not just people

---

## Forces & Anxieties

### Forces Pushing Toward Change
**What makes Ravi want to adopt Gyre?**

| # | Force | Strength | Evidence |
|---|-------|----------|----------|
| F1 | **Drowning in ad-hoc reviews** — can't keep up with review requests. Teams wait or launch without review | Strong | Product brief (50% reduction target) |
| F2 | **No portfolio visibility** — can't see aggregate risk trends across services | Strong | PRD portfolio view requirement |
| F3 | **Golden path drift detection** — needs to know when teams deviate, not discover it post-incident | Medium | PRD: IaC verification, golden path compliance |
| F4 | **Empower teams to self-serve** — wants teams to assess themselves so he reviews output, not hand-holds | Medium | Product brief (Ravi's success vision) |
| F5 | **Consistency across teams** — wants normalized baselines that adapt to different stacks | Medium | PRD: 66% cite inconsistent standards |

### Forces Pulling Back to Status Quo
**What makes Ravi hesitate?**

| # | Force | Strength | Evidence |
|---|-------|----------|----------|
| H1 | **"I already have Cortex/Backstage"** — IDP tools already provide scorecards. Why another tool? | Strong | Competitive landscape — Gyre complements IDPs, doesn't replace them |
| H2 | **"Teams will game any automated scoring"** — if readiness becomes a metric, teams optimize for the score not the substance | Medium | Anti-metric: "readiness score as a KPI" |
| H3 | **"One more tool to maintain"** — platform engineers are already maintaining too much tooling | Medium | Gyre must be low-maintenance or Ravi won't deploy it |
| H4 | **"Does it understand the nuance I bring?"** — Ravi's value is contextual judgment. Can a tool replicate that? | Medium | Positioning: Gyre handles discovery, Ravi handles judgment |

### Anxieties About Changing

| # | Anxiety | Severity | Mitigation in Product |
|---|---------|----------|----------------------|
| A6 | **"Will this replace me or amplify me?"** — existential concern about automation of his expertise | High | Gyre is positioned as force multiplier. Ravi reviews findings, makes judgment calls. Tool surfaces; human decides |
| A7 | **"Can outputs be compared across different stacks?"** — normalization across Node.js/EKS, Python/Lambda, Java/Spring Boot | Medium | RICE scoring provides cross-stack comparison framework. Severity tiers are stack-agnostic |
| A8 | **"Will teams actually use it without me pushing?"** — self-serve requires team motivation, not just tool availability | Medium | Sana's crisis trigger drives initial adoption. Ravi's deployment role comes after team-level validation |
| A9 | **"Will leadership misuse this as a ranking tool?"** — aggregate data could become team leaderboards | Medium | Explicit design: portfolio risk *trends*, not rankings. Improvement trajectories, not performance scores |

### Habits That Need Breaking

- Being the single reviewer for all readiness decisions
- Manual quarterly audits instead of continuous monitoring
- Defining standards in documents instead of code (golden paths as wikis, not templates)
- Reactive engagement (war room) instead of proactive oversight (portfolio trends)

---

## Success Criteria

### Desired Outcome

Ravi says: *"Teams come to me with readiness reports based on actual code analysis. I see risk trends across all my services and know which need attention. I review artifacts, not hand-hold."*

### Success Metrics

| # | Metric | Target | Validates | Activation |
|---|--------|--------|-----------|------------|
| M1 | Reduction in ad-hoc review requests | 50% at 6 months | Teams self-serving with Gyre | v2+ (requires multi-team adoption) |
| M2 | Portfolio risk trend visibility | Aggregate view across all services | Cross-team normalization works | v3 (portfolio view) |
| M3 | Time to review a team's readiness | From 4-8 hours (manual) to <1 hour (review Gyre output + spot-check) | Gyre output is expert-reviewable | MVP (single team) |
| M4 | Golden path compliance detection | Drift detected automatically | Continuous monitoring value | v2 (anticipation mode) |
| M5 | Teams self-serve without Ravi | ≥3 teams run Gyre independently after initial setup | Platform deployment model works | v2+ |

### Time to Value

- **MVP (single team):** Ravi reviews one team's Gyre output in <1 hour instead of 4-8 hours manual review
- **v2 (multi-team):** Teams self-serve. Ravi's review requests drop by 50%
- **v3 (portfolio):** Aggregate risk trends. Ravi sees which teams need attention proactively

### Acceptable Trade-offs

- MVP is single-team only — Ravi's portfolio view is v3. Acceptable because single-team review time improvement is already valuable
- No golden path drift detection in MVP — acceptable because static analysis catches some drift, full detection requires anticipation mode (v2)
- Cross-team comparison is approximate — RICE scoring normalizes but context varies. Ravi's judgment still needed for prioritization across teams

---

## Assumptions to Validate

### Critical Assumptions (Test First)

| # | Assumption | Risk if Wrong |
|---|-----------|---------------|
| A6 | Ravi sees Gyre as a force multiplier, not a threat or surveillance tool | Ravi blocks adoption or damns with faint praise. Platform deployment never happens |
| A7 | Cross-team normalization is possible — different stacks produce comparable readiness signals via RICE scoring | Portfolio view is meaningless. Each team is an island. Ravi still reviews manually |

### Important Assumptions (Test Soon)

| # | Assumption | Risk if Wrong |
|---|-----------|---------------|
| A8 | Teams will self-serve with Gyre output instead of requesting Ravi's manual reviews | Gyre adds a step but doesn't remove one. Review bottleneck persists |
| A9 | Leadership consumes portfolio data as improvement trends, not team rankings | Gyre becomes a surveillance tool. Teams resist. Cultural damage |

### Nice-to-Validate (Test Later)

| # | Assumption | Risk if Wrong |
|---|-----------|---------------|
| A10 | Golden path drift is detectable via static analysis comparison | Drift detection requires runtime data. More complex than anticipated |
| A11 | Ravi can deploy Gyre org-wide without per-team customization | Each team needs bespoke setup. Scales linearly with Ravi's time, not better |

---

## Validation Plan

### Experiment 1: SRE Interview (Within P1-disc)
- **Hypothesis:** SRE/platform engineers experience the portfolio pain described above and would value normalized cross-team readiness visibility
- **Method:** Include ≥1 SRE/platform engineer in Wade's 5-team interview. Additional questions: (1) how many services do you support, (2) how do you prioritize which team gets your attention, (3) what would a "readiness dashboard" need to show, (4) what's the worst that happens when you can't review before launch
- **Success Criteria:** SRE confirms ad-hoc review burden and cross-team visibility gap. Expresses interest in Gyre-as-platform
- **Timeline:** Within P1-disc interviews (1 week)

### Experiment 2: Expert Review of Gyre Output
- **Hypothesis:** An SRE can review a team's Gyre output in <1 hour and confirm findings are expert-grade
- **Method:** After Experiment 2 from Sana's plan (first-run credibility test), ask Ravi-persona to review the output. Time the review. Ask: "Would you trust this as a starting point? What's missing? What's wrong?"
- **Success Criteria:** Review completed in <1 hour. ≥80% of findings confirmed valid. Missing gaps identified feed back into model improvement
- **Timeline:** 1 week after Sana's Experiment 2

### Experiment 3: Cross-Team Normalization Test
- **Hypothesis:** RICE-scored findings from different stacks can be meaningfully compared in an aggregate view
- **Method:** Run Gyre on 3 different stacks. Present aggregate findings to Ravi-persona in a simulated portfolio view. Ask: "Can you use this to prioritize which team needs attention first?"
- **Success Criteria:** Ravi correctly identifies highest-risk team from aggregate data. Agrees the comparison is meaningful
- **Timeline:** v2 planning phase

---

## Activation Note

**Ravi is a v2+ persona for most features but informs MVP architecture:**
- MVP outputs must be **normalizable** — structured format, consistent RICE scoring, source tagging
- MVP outputs must be **reviewable by experts** — Ravi should be able to review Gyre output faster than manual assessment
- MVP outputs must be **aggregatable** — even if v3 builds the portfolio view, the data shape must support it from MVP

Designing for Ravi from day one prevents costly re-architecture when portfolio features ship.

---

## Revision History

| Date | What Changed | Why | New Assumptions |
|------|--------------|-----|-----------------|
| 2026-03-21 | Initial creation | First hypothesis based on PRD, product brief, and domain research | All assumptions untested |

---

**Created with:** Convoke v2.3.1 - Vortex Pattern (Empathize Stream)
**Agent:** Isla (Discovery & Empathy Expert)
**Workflow:** lean-persona
