---
title: "Lean Persona: The Knowledge Holder"
date: 2026-03-21
created-by: Amalik with Emma (contextualization-expert)
type: lean-persona
status: HYPOTHESIS
version: 1.0
---

# Lean Persona: The Knowledge Holder

> **Remember:** This is a hypothesis until validated. Every insight below needs testing with real users.

## Executive Summary

**Job-to-be-Done:**
Transfer what I know about our systems, processes, and history to the external consultant — without it consuming my entire week or making me feel like I'm being interrogated.

**Riskiest Assumptions:**
1. Structured, shorter sessions with prepared questions reduce stakeholder fatigue AND produce better knowledge
2. Showing stakeholders TKA drafts after sessions increases their engagement and trust
3. The range from CTO to operational expert requires different extraction approaches (strategic vs. tactical)

**Next Validation Steps:**
1. Prepared vs. unprepared session A/B test on real engagement
2. TKA draft review — measure stakeholder response to visible output
3. Stakeholder satisfaction survey across different seniority levels

---

## Job-to-be-Done

### Primary Job
Transfer what I know about our systems, processes, and history to the external consultant — without it consuming my entire week or making me feel like I'm being interrogated.

### Context
Client-side stakeholders ranging from CTOs and CPOs (strategic, eager for the engagement to succeed) to operational experts and tech leads (tactical, see consultants as overhead on top of their real work). They are the *source* of knowledge, not the *user* of Forge. But if their experience is bad, the consultant gets bad data.

### Frequency & Importance
- **Frequency:** Per engagement (when an external consultant lands). Typically 3-8 sessions over weeks 1-4, then tapering
- **Predictability:** Unpredictable from their perspective — consultant requests come between their regular work
- **Urgency:** LOW for the stakeholder (this is the consultant's problem, not theirs). They participate because directed to, not because they want to
- **Importance:** Important but asymmetric — mission-critical for the consultant, nice-to-have for the stakeholder. Exception: CTOs who want the engagement to succeed see it as important

### Current Solution
Respond to consultant requests as they come — meetings, emails, Slack messages, screen shares. No structure, no preparation, no visibility into what was captured.

---

## Current State Analysis

### How They Solve It Today
- Accept meeting invites from the consultant
- Improvise responses to broad questions ("tell me about the system")
- Send document dumps ("here are 15 links, read these first")
- Delegate to a technical lead as single point of contact
- Occasionally pre-write "onboarding docs" for consultants (rare, high-value, never maintained)

### Pain Points with Current Solution
1. **Death by a thousand meetings** — Consultant books 5 separate meetings that could have been 2 with better preparation
2. **Repeating themselves** — "I already explained this to the last consultant 6 months ago." No institutional memory on the consulting side
3. **No preparation from consultant** — Broad questions force stakeholder to improvise brain dumps
4. **Invisible output** — Stakeholder gives an hour of their time and never sees what was captured. Were they heard correctly?
5. **Interrupts real work** — Knowledge transfer is overhead on top of their actual job

### Workarounds & Hacks
- Pre-written "onboarding docs" for new consultants (rare, high-value, never maintained)
- Redirect to "the other person who knows this better" (deflection as self-defense)
- Massive email with links ("read this first, then we'll talk" — documentation dump)
- CTO delegates to a technical lead as single point of contact (reduces their burden, creates bottleneck)

### Cost of Current Solution
- **Time:** 5-15 hours per engagement (spread across multiple stakeholders)
- **Frustration:** MEDIUM-HIGH for operational experts ("I have real work"), LOW-MEDIUM for CTOs (they want success)
- **Opportunity cost:** Every hour explaining the system is an hour not improving the system
- **Emotional cost:** Feeling unheard when the consultant doesn't capture their input accurately or at all

---

## Problem Contexts

### When Does This Problem Occur?
- When the external consultant arrives (unpredictable from stakeholder's perspective)
- Between regular meetings and operational work — knowledge transfer squeezed into gaps
- Clustered in weeks 1-2 then tapering — "I gave them 3 meetings, they should have enough"
- **WORST TIMING:** During incidents, releases, or quarter-end — exactly when consultant needs most context and stakeholder has least time

### Where Does This Problem Occur?
- Their regular workspace (office or home) — they don't change context for the consultant
- In their tools — screen-sharing dashboards, architecture diagrams, internal wikis
- **State of mind:** Interrupted. This is overhead. Goodwill varies by role and personality

### Why Does This Problem Matter Now?
- Growing consultant churn means stakeholders repeat themselves more frequently
- Remote work makes informal knowledge transfer harder — no more "grab coffee and explain"
- System complexity is increasing — what was a 30-minute explanation is now a 2-hour deep dive

### What Triggers the Need?
- Calendar invite from the consultant: "Knowledge transfer: Payment Systems"
- Slack DM: "Quick question about how deploys work here"
- Manager directive: "Please make time for the consultant this week"
- (Rarely) Self-motivated: "I should document this before I leave"

---

## Forces & Anxieties

### Forces Pushing Toward Change
**What makes them want to switch?**
1. **Fewer repeat sessions** (HIGHEST) — If consultant captures it once in a TKA, stakeholder never explains it again
2. **Visible output** — Seeing a TKA draft after a session gives confidence their time wasn't wasted
3. **Better questions** — Consultant using Rune arrives with specific, prepared questions. Meetings are shorter
4. **Organizational value** — CTOs see TKAs as documentation that outlives the engagement. Their own team benefits

### Forces Pulling Back to Status Quo
**What makes them hesitate?**
1. **Not my problem** — "The consultant should figure it out, that's what we're paying them for"
2. **Time cost** — Any structured approach that takes MORE stakeholder time is a non-starter
3. **Trust gap** — "How will this knowledge be used? Will it make my team look bad?"
4. **Past experience** — "The last consultant took notes and nothing came of it"

### Anxieties About Changing
- "Will this take more of my time, not less?"
- "Is what I say being captured accurately, or twisted?"
- "Will sensitive information about our technical debt be shared with leadership?"
- "Am I being evaluated, or being helped?"

### Habits That Need Breaking
- Brain-dump meeting style ("let me tell you everything in no order")
- Deflection ("talk to someone else, they know more")
- Over-sharing or under-sharing based on trust level, not relevance

---

## Success Criteria

### Desired Outcome
"The consultant asked smart, specific questions, the meetings were short, I could see what they captured, and I never had to repeat myself to the next consultant."

### Success Metrics
1. **Stakeholder time per engagement:** ≤5 hours (from 5-15)
2. **Repeat explanations:** Zero — TKAs persist across engagements
3. **Session quality:** Targeted, prepared questions (stakeholder satisfaction ≥4/5)
4. **Output visibility:** TKA draft reviewed within 48h of session
5. **Accuracy:** Stakeholder confirms TKA accurately reflects their input (sign-off rate ≥90%)

### Time to Value
- **First session:** Consultant arrives prepared with specific questions. Stakeholder notices immediately
- **After first session:** Receives TKA draft to review. "They actually captured what I said correctly." Trust established
- **Subsequent sessions:** Shorter, more focused, building on what was captured. Process converging, not expanding

### Acceptable Trade-offs
- ✅ Spend 10-15 minutes reviewing a TKA draft — if it means never repeating themselves
- ✅ Answer more specific questions — if meetings are shorter overall
- ✅ Follow light structure in sessions — if consultant drives it and stakeholder just responds

### NOT Acceptable Trade-offs
- ❌ More total time than the ad-hoc approach
- ❌ Being recorded or transcribed without explicit consent
- ❌ Input used to make their team or systems look bad in reports
- ❌ Any process that feels like an interrogation rather than a conversation

---

## Assumptions to Validate

### Critical Assumptions (Test First)
1. **ASSUMPTION:** Structured, shorter sessions with prepared questions reduce stakeholder fatigue AND produce better knowledge
   - **Why risky:** Stakeholders might prefer the brain-dump because it requires less of THEIR preparation. Structured sessions demand more precise engagement
2. **ASSUMPTION:** Showing stakeholders TKA drafts increases engagement and trust
   - **Why risky:** Some stakeholders may not care enough to review, or may be alarmed at seeing their input formalized

### Important Assumptions (Test Soon)
3. **ASSUMPTION:** The range from CTO to operational expert requires different extraction approaches
   - **Why risky:** If we design a one-size-fits-all approach, it may alienate one end of the spectrum
4. **ASSUMPTION:** Stakeholders will confirm TKA accuracy if the review burden is ≤15 minutes
   - **Why risky:** Even 15 minutes may be too much for operational experts who see this as the consultant's problem

### Nice-to-Validate (Test Later)
5. **ASSUMPTION:** TKAs that persist reduce total stakeholder time across multiple consultant rotations
   - **Why risky:** Only provable over multiple engagements at the same client — long feedback cycle
6. **ASSUMPTION:** CTO-level stakeholders will champion structured knowledge transfer within their organization
   - **Why risky:** CTOs may agree in principle but not enforce in practice

---

## Validation Plan

### Experiment 1: Prepared vs. Unprepared Sessions
- **Hypothesis:** If a consultant arrives with Rune-prepared questions (based on Silo's landscape map), the session will be ≤45 minutes (vs. typical 60-90 min) AND the stakeholder will rate it higher on "my time was well spent"
- **Method:** On a real engagement, run 3 stakeholder sessions with Rune preparation and 3 without (natural A/B). Measure: session duration, stakeholder satisfaction (1-5), knowledge captured (TKA completeness)
- **Success Criteria:** Prepared sessions ≤45 min average AND stakeholder satisfaction ≥4/5 AND TKA completeness ≥ unprepared sessions
- **Timeline:** Weeks 2-4 of shadow engagement

### Experiment 2: TKA Draft Review
- **Hypothesis:** If stakeholders receive a TKA draft within 48h of their session, at least 70% will review and provide feedback, AND those who review will rate their experience higher than those who don't see output
- **Method:** Send TKA drafts to all stakeholders after sessions. Track: review rate, time to review, feedback quality, satisfaction delta between reviewers and non-reviewers
- **Success Criteria:** ≥70% review rate AND review time ≤15 minutes AND satisfaction ≥4/5
- **Timeline:** Concurrent with Experiment 1

### Experiment 3: Seniority-Differentiated Approach
- **Hypothesis:** If extraction sessions are tailored by stakeholder role (strategic for CTOs, tactical for operational experts), both groups will rate session quality ≥4/5
- **Method:** Design two Rune session variants (strategic and tactical). Run each with appropriate stakeholders. Compare satisfaction and TKA quality across variants
- **Success Criteria:** Both variants achieve ≥4/5 satisfaction AND TKA quality rated "useful" by consuming consultant
- **Timeline:** Second engagement using Forge (after initial experiments)

---

## Next Steps

1. **Validate riskiest assumption first:** Prepared sessions produce better outcomes than unprepared sessions
2. **Talk to 3-5 client stakeholders** who have recently worked with consultants — validate pain points
3. **Run prepared vs. unprepared A/B** on first shadow engagement
4. **Decision criteria:** If prepared sessions ≤45 min and satisfaction ≥4/5, then Rune's facilitation model is sound. If stakeholders prefer brain-dump, rethink Rune to process brain-dumps post-hoc instead of guiding sessions

---

## Revision History

| Date | What Changed | Why | New Assumptions |
|------|--------------|-----|-----------------|
| 2026-03-21 | Initial creation | First hypothesis from Vortex Contextualize + Empathize streams | All assumptions untested |

---

**Created with:** Convoke v2.3.1 - Vortex Pattern (Empathize Stream)
**Agent:** Emma (Contextualization Expert)
**Workflow:** lean-persona
