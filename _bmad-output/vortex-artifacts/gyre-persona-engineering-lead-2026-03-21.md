---
title: "Lean Persona: Sana — Engineering Lead"
date: 2026-03-21
created-by: Amalik with Emma (contextualization-expert)
type: lean-persona
status: HYPOTHESIS
version: 1.0
scope-decision: scope-decision-gyre-2026-03-21.md
---

# Lean Persona: Sana — Engineering Lead

> **Remember:** This is a hypothesis until validated. Every insight below needs testing with real users.

## Executive Summary

**Job-to-be-Done:**
When preparing to ship a service to production (or recovering from an incident), systematically discover what readiness gaps exist in my specific stack so I can prioritize fixes, communicate clearly to leadership, and avoid surprises.

**Riskiest Assumptions:**
1. A4: Generated contextual models are accurate enough (≥70%) to earn first-run trust — if not, engineers write Gyre off permanently
2. A1: Engineering leads will act on findings — pulling them into sprints alongside feature work, not treating them as a separate "readiness project"
3. A3: Cross-domain correlation produces findings that single-domain assessment wouldn't — the compound risk insight is real and valued

**Next Validation Steps:**
1. 5-team pilot interviews (P1-disc: Wade's experiment) — validate problem severity, current coping, and willingness to adopt
2. First-run credibility test — run Gyre on 3 different stacks, measure false positive rate and novel finding count
3. Sprint integration observation — do teams actually pull findings into sprints?

---

## Job-to-be-Done

### Primary Job

> **When** I'm preparing to ship a service to production (or already running one that had an incident),
> **I want to** systematically discover what readiness gaps exist in my specific stack — across observability, deployment, compliance, and infrastructure —
> **so I can** prioritize the highest-impact fixes, communicate clearly to leadership about launch readiness, and avoid surprises that cause incidents or audit failures.

### Functional Job
Discover what's missing from a production stack — gaps in observability, deployment, security, compliance, and cost that are invisible until they cause incidents. Produce a prioritized backlog of fixes with severity tiers and confidence ratings.

**Evidence:** PRD problem statement (teams cannot map existing knowledge to their specific product context), domain research ($4.5B SRE platform market, 66% cite inconsistent standards), product brief (discovery of unknown-unknowns is the core value)

### Emotional Job
Feel confident and in control of production readiness — not anxious that something unknown will break at the worst possible moment.

**Evidence:** Product brief (Sana's success vision: "Gyre told me exactly what was missing — things I didn't even think to check"), PRD anti-metrics ("time spent in Gyre — shorter is better" = tool should relieve anxiety, not create it)

### Social Job
Be perceived by leadership and peers as someone who ships reliably — who can answer "when can we go live?" with evidence, not gut feel.

**Evidence:** Product brief (P4: "Leadership can't get a straight answer"), PRD dual-audience output (engineering view + leadership view), user journey step 3 (spread: "Sana's PM notices the dashboard data")

### Context

- Leads 5-12 engineers shipping a product or service
- At a startup, wears all hats (SRE, compliance, platform). At an enterprise, has Ravi (SRE) and Priya (compliance) as support
- Knows the service "should" have better monitoring and rollback strategies but doesn't know where to start or what "good" looks like for *her specific stack*
- Most common trigger: incident or compliance pressure (crisis mode entry)

### Frequency & Importance

- **Frequency:** Every service launch or major production incident. At least quarterly for ongoing services. Continuous for teams with active delivery
- **Importance:** Critical — readiness gaps directly cause revenue loss, security breaches, compliance failures, and team burnout

### Current Solution

Ad-hoc checklists copied from blog posts + tribal knowledge from senior engineers + post-incident discovery (learning what was missing after it breaks). Enterprise teams may have IDP scorecards (Cortex/Backstage) that measure compliance with known rules but don't discover unknown gaps.

---

## Current State Analysis

### How They Solve It Today

1. **Ad-hoc checklists** — Copies from blog posts, Google PRR, AWS ORR. Generic, not tailored to stack. Same checklist for Node.js/EKS and Python/Lambda
2. **Tribal knowledge** — Asks senior engineers "what are we missing?" Quality depends entirely on who she asks and their availability
3. **Post-incident discovery** — Learns what was missing after it breaks. Most common but most expensive learning path. Gaps surface as outages, not findings
4. **IDP scorecards** (enterprise only) — Cortex/Backstage score against predefined criteria. Measures "how ready are we?" against rules someone else wrote. Doesn't discover "what does ready mean for *us*?"
5. **Pre-launch review meeting** — Brainstorming session disguised as a gate. Quality varies by who attends and how tired they are

### Pain Points with Current Solution

| # | Pain | Severity | Frequency | Evidence |
|---|------|----------|-----------|----------|
| P1 | **Don't know what I don't know** — generic checklists miss stack-specific gaps. Absence of something isn't visible on a checklist that doesn't list it | High | Every assessment | PRD core problem: "teams cannot map existing knowledge to their specific product context" |
| P2 | **Cross-domain blind spots** — observability, deployment, security, and cost assessed independently. Compound risks invisible ("no rollback telemetry + no deployment markers = blind rollbacks") | High | Every assessment | Product brief key differentiator #2: cross-domain gap correlation |
| P3 | **No prioritization** — checklists are flat. Everything looks equally important. Can't distinguish blockers from nice-to-haves | High | Every assessment | Product brief: "RICE-scored readiness backlog, not flat list of action items" |
| P4 | **Leadership can't get a straight answer** — PM asks "when can we go live?" and Sana has no evidence-based answer | Medium | Every launch | PRD dual-audience output, product brief user journey |
| P5 | **Assessments don't persist** — ad-hoc reviews produce meeting notes, not versioned artifacts. Knowledge evaporates. Next quarter, same exercise from scratch | Medium | Quarterly | PRD: capabilities manifest is version-controlled, team-owned |

**Root cause convergence:** P1-P3 converge on a single root cause: **assessment tools operate on predefined criteria, not context-specific discovery.** Gyre doesn't measure readiness against someone else's definition — it discovers what readiness *means* for this stack, then measures.

### Workarounds & Hacks

- Personal Notion page with "things to check before launch" — incomplete, not stack-specific, not shared
- "Pre-launch review meeting" that's really unstructured brainstorming
- Senior dev's Slack thread: "here's what we need before launch" — authoritative but undiscoverable later
- Copy-paste from other teams' runbooks, adapting by gut feel
- Running multiple monitoring tools (Datadog, Grafana, PagerDuty) without understanding whether coverage is complete

### Cost of Current Solution

- **Direct:** 2-4 engineer-days per assessment, repeated from scratch each time
- **Indirect:** Post-incident costs when gaps surface in production (mean time to first significant incident: ~3 months after launch for teams without structured readiness)
- **Opportunity cost:** Sana's time on ad-hoc reviews instead of shipping features
- **Cultural cost:** "Launch readiness" becomes a dreaded gate, not a value-adding discovery. Teams game it or skip it

---

## Problem Contexts

### When Does This Problem Occur?

- **Crisis trigger (most common entry):** First production incident reveals gaps. "We just got our first enterprise client, they want SOC 2, we have 6 weeks"
- **Pre-launch gate:** Team is "done building" and someone asks "but is it production ready?"
- **Post-incident review:** Retro reveals the gap was visible in code but no one looked
- **Continuous delivery:** Services evolving in production — configuration drift from initial readiness state

### Where Does This Problem Occur?

- In the **codebase** — misconfigurations, missing instrumentation, IaC drift are code-level artifacts
- In **CI/CD pipelines** — deployment strategy gaps, missing rollback hooks, no canary strategy
- In **architecture decisions** — choices made early (Lambda vs. EKS) constrain what "ready" means
- In the **gap between engineering and leadership** — no shared language for readiness evidence

### Why Does This Problem Matter Now?

- Cloud-native architectures increase surface area (microservices, containers, serverless each add readiness dimensions)
- Regulatory landscape accelerating (EU AI Act, DORA regulation for financial services, evolving GDPR enforcement)
- DevSecOps and FinOps are no longer optional — security and cost are engineering concerns
- AI-assisted development accelerates feature delivery but doesn't accelerate operational maturity — the gap widens
- $4.5B SRE platform market growing at 14.2% CAGR — demand is real and increasing

### What Triggers the Need?

1. **Production incident** (reactive — most common and most expensive)
2. **Enterprise client demand** (compliance trigger — "they want SOC 2")
3. **Audit notification** (regulatory trigger — external deadline)
4. **Team scaling** (new engineers need operational context — onboarding trigger)
5. **Proactive leadership mandate** (rarest but highest value — "assess everything before Q4")

---

## Forces & Anxieties

### Forces Pushing Toward Change
**What makes Sana want to adopt Gyre?**

| # | Force | Strength | Evidence |
|---|-------|----------|----------|
| F1 | **Incident pressure** — last outage cost us. Leadership noticed. Can't happen again | Strong | User journey trigger: "incident or compliance pressure" |
| F2 | **Leadership visibility** — PM/CTO asking "when can we go live?" and Sana has no evidence-based answer | Strong | Product brief P4, PRD dual-audience rendering |
| F3 | **Unknown-unknowns anxiety** — knows there are gaps but can't see them. Post-incident discovery is too expensive | Strong | PRD core value proposition: absence detection |
| F4 | **Cross-domain compound risks** — suspects gaps interact but can't see the connections with single-domain tools | Medium | Product brief differentiator #2 |
| F5 | **Time savings** — 2-4 engineer-days per assessment from scratch is too expensive to repeat | Medium | Product brief cost analysis |

### Forces Pulling Back to Status Quo
**What makes Sana hesitate?**

| # | Force | Strength | Evidence |
|---|-------|----------|----------|
| H1 | **"My team knows our stack"** — belief that internal knowledge suffices | Strong | Common in teams with senior engineers who've run the service for years |
| H2 | **First-run false positives** — if first analysis produces irrelevant findings, engineers write it off permanently | Strong | PRD critical constraint: "first-run credibility" |
| H3 | **Tool fatigue** — already have Cortex/Backstage/Datadog/PagerDuty, don't need another dashboard | Medium | Competitive landscape — Gyre must complement, not add noise |
| H4 | **"We're different"** — belief that no generic tool can understand their architecture choices | Medium | Mitigated by generated contextual model (not pre-built) |
| H5 | **Delivery pressure** — any time not shipping features feels like a cost | Low | Mitigated by <2 min time-to-first-finding |

### Anxieties About Changing

| # | Anxiety | Severity | Mitigation in Product |
|---|---------|----------|----------------------|
| A1 | **"Will it understand our stack?"** — fear of generic, irrelevant recommendations | High | Generated contextual model — detects stack, generates for it. No pre-built models |
| A2 | **"Will it create busywork?"** — fear of a 200-item flat checklist that paralyzes | High | RICE-scored backlog with 3 severity tiers. Prioritization is the product |
| A3 | **"Will it send our code somewhere?"** — privacy concern, especially enterprise | Medium | Local static analysis. Only structured metadata reaches the LLM |
| A4 | **"Will my team respect it?"** — fear of adopting a tool senior engineers dismiss | Medium | Observation-based (code analysis > self-assessment). Findings challengeable. Trust earned through challenge |
| A5 | **"Is this management surveillance?"** — fear that readiness scores become team rankings | Medium | Explicitly not a ranking tool. Portfolio risk *trends*, not leaderboards |

### Habits That Need Breaking

- "We'll figure it out as we go" — ad-hoc over structured
- Post-incident learning as the default discovery mechanism
- Equating "feature complete" with "production ready"
- One-time assessments instead of continuous readiness tracking
- Copying other teams' checklists instead of discovering context-specific criteria

---

## Success Criteria

### Desired Outcome

Sana says: *"Gyre analyzed our codebase and told me exactly what was missing — things I didn't even think to check. The backlog is prioritized so we fix what matters first. When leadership asks about readiness, I have evidence."*

### Success Metrics

| # | Metric | Target | Validates |
|---|--------|--------|-----------|
| M1 | Time to first actionable finding | <2 minutes from analysis start | Fast enough to be useful — run before sprint planning |
| M2 | Novel findings per analysis | ≥2 contextual-model-sourced findings the team didn't previously track | Discovery value — finding unknown-unknowns |
| M3 | Sprint pull rate | ≥1 blocker-tier finding pulled into next sprint | Findings are actionable, not shelf-ware |
| M4 | First-run model accuracy | ≥70% of capabilities confirmed relevant (before amendments) | Contextual model earns trust |
| M5 | Cross-domain compound findings | ≥1 per analysis confirmed valid by team | Key differentiator proven |
| M6 | Leadership communication | Readiness summary shared with PM/CTO at least once | Dual-audience value confirmed |

### Time to Value

- **Immediate:** First finding in <2 minutes
- **Same sprint:** First blocker pulled into active work
- **Within quarter:** Readiness becomes a tracked signal, not an ad-hoc gate

### Acceptable Trade-offs

- Model richness varies by stack community density (Node.js/K8s richer than Rust/bare-metal) — acceptable if team amendments close the gap
- MVP covers 2 domains only (Observability + Deployment) — acceptable if cross-domain correlation proves the pattern
- Crisis mode only in MVP (no CI integration) — acceptable because crisis is the entry point
- Findings may require team context to interpret — acceptable if the tool surfaces them, even imperfectly
- Some false positives on first run — acceptable if <30% and the correct findings are novel enough to justify the noise

---

## Assumptions to Validate

### Critical Assumptions (Test First)

| # | Assumption | Risk if Wrong |
|---|-----------|---------------|
| A4 | Generated contextual models are accurate enough (≥70%) to earn first-run trust | Engineers dismiss Gyre permanently. No second chance. The tool is dead on arrival |
| A1 | Engineering leads will act on findings — pulling them into sprints alongside feature work | Findings become shelf-ware. Gyre produces reports nobody reads. No behavior change |
| A3 | Cross-domain correlation produces findings that single-domain assessment wouldn't | Key differentiator invalidated. Gyre becomes "yet another readiness checker" |

### Important Assumptions (Test Soon)

| # | Assumption | Risk if Wrong |
|---|-----------|---------------|
| A2 | RICE scoring effectively prioritizes findings (blockers vs. nice-to-have distinction is useful) | Teams overwhelmed by flat lists despite our intent to prioritize. UX/scoring redesign needed |
| A5 | Leadership summary is consumed and valued by non-technical stakeholders | Dual-audience bet fails. Gyre serves engineers only. Still valuable but narrower |
| A6 | Static analysis + contextual model combination is sufficient without runtime data | Discovery misses dynamic gaps (load-dependent issues, intermittent failures). May need runtime mode in v2 |

### Nice-to-Validate (Test Later)

| # | Assumption | Risk if Wrong |
|---|-----------|---------------|
| A7 | Teams will re-run Gyre quarterly (not just once in crisis) | One-shot value only. Continuous readiness tracking doesn't materialize |
| A8 | Organic adoption spreads engineer-to-engineer | Need top-down mandate for adoption. Changes go-to-market strategy |
| A9 | Capabilities manifest amendments persist and improve model over time | Team ownership of the model is aspirational, not practiced |

---

## Validation Plan

### Experiment 1: 5-Team Pilot Interviews (P1-disc)
- **Hypothesis:** Engineering leads experience the pains described above and would value context-specific readiness discovery over generic checklists
- **Method:** Wade's 5-team interview design. 4 discovery questions: (1) hardest part going to production, (2) what you discovered too late, (3) how you currently assess readiness, (4) would you trust code-analysis findings over self-assessment. Categorize against 4 readiness domains
- **Success Criteria:** ≥4/5 teams confirm unknown-unknowns as a real problem. ≥3/5 express interest in Gyre's approach
- **Timeline:** 1 week (5 interviews, 30 min each)

### Experiment 2: First-Run Credibility Test
- **Hypothesis:** Generated contextual models produce ≥70% relevant capabilities and ≥2 novel findings per analysis across different stacks
- **Method:** Run Gyre on 3 distinct stacks from pilot teams (e.g., Node.js/EKS, Python/Lambda, Java/Spring Boot). Team reviews capabilities manifest. Track: accuracy rate, novel findings, false positive rate
- **Success Criteria:** ≥70% accuracy before amendments, <30% false positive rate, ≥2 novel findings per analysis
- **Timeline:** 2 weeks (build MVP → run on 3 stacks → collect feedback)

### Experiment 3: Sprint Integration Observation
- **Hypothesis:** Teams pull ≥1 blocker-tier finding into their next sprint without being prompted
- **Method:** After Experiment 2, observe pilot teams for 1 sprint cycle. Track: which findings were actioned, which were deferred, which were dismissed. Post-sprint interview: "Did Gyre change what you worked on?"
- **Success Criteria:** ≥3/5 teams pull ≥1 finding into sprint. ≥1 team shares readiness summary with leadership
- **Timeline:** 2-4 weeks (1 sprint observation)

---

## Next Steps

1. **Validate riskiest assumption first:** A4 (model accuracy / first-run credibility) — if the model isn't accurate enough, nothing else matters
2. **Talk to 5 engineering leads** within 1 week (P1-disc interviews)
3. **Run first-run credibility test** on 3 different stacks
4. **Decision criteria:** If ≥70% model accuracy AND ≥2 novel findings per analysis AND ≥3/5 teams express interest, then proceed to MVP build

---

## Revision History

| Date | What Changed | Why | New Assumptions |
|------|--------------|-----|-----------------|
| 2026-03-21 | Initial creation | First hypothesis based on PRD, product brief, and domain research | All assumptions untested |

---

**Created with:** Convoke v2.3.1 - Vortex Pattern (Empathize Stream)
**Agent:** Isla (Discovery & Empathy Expert)
**Workflow:** lean-persona
