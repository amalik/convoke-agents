---
title: "Lean Persona: The Landing Consultant"
date: 2026-03-21
created-by: Amalik with Emma (contextualization-expert)
type: lean-persona
status: HYPOTHESIS
version: 1.0
---

# Lean Persona: The Landing Consultant

> **Remember:** This is a hypothesis until validated. Every insight below needs testing with real users.

## Executive Summary

**Job-to-be-Done:**
Rapidly map the knowledge landscape of an unfamiliar enterprise environment and extract tribal knowledge into structured, reusable assets — so I can become productive within days instead of weeks and leave behind artifacts that survive after I leave.

**Riskiest Assumptions:**
1. Consultants will follow a structured extraction method if it doesn't add perceived overhead
2. TKAs are genuinely useful for delivery work, not just Gyre input
3. A structured method reduces ramp-up time by 50%+ compared to ad-hoc approaches

**Next Validation Steps:**
1. Shadow engagement — run Silo's survey workflow alongside normal process on a real engagement
2. TKA utility tracking — measure how often consultant references TKAs during delivery
3. Handoff test — second consultant ramps using TKAs from first consultant

---

## Job-to-be-Done

### Primary Job
Rapidly map the knowledge landscape of an unfamiliar enterprise environment — who knows what, where documentation exists (and where it's stale), and what systems are in play — so I can become productive within days instead of weeks.

### Context
IT consultants and architects conducting enterprise brownfield engagements. These are experienced professionals (mid to senior) landing in complex client environments with legacy systems, mixed tech stacks, and organizational complexity. They may also be the same person as The Engagement Architect at higher seniority — designing solutions based on extracted knowledge.

### Frequency & Importance
- **Frequency:** Every new engagement (2-4 per year per consultant). Intensive during weeks 1-4, with survey mode (weeks 1-2) and excavation mode (weeks 2-4)
- **Predictability:** Unpredictable — engagement assignments come with short notice
- **Urgency:** HIGH at engagement start — every day spent lost is a day billed without value delivery
- **Importance:** Mission-critical. Knowledge asymmetry is the #1 blocker to productive consulting. A consultant who doesn't understand the landscape makes wrong recommendations, asks the wrong people, and burns client goodwill

### Current Solution
Ad-hoc knowledge archaeology — scattered meetings, corridor conversations, stale wiki pages, reverse-engineering code, personal notes in whatever format feels right that day.

---

## Current State Analysis

### How They Solve It Today
A mix of:
- Reading whatever documentation exists (Confluence, SharePoint — often stale)
- Scheduling meetings with people the client PM suggests
- Reverse-engineering code via git blame and PR history
- Building personal "who knows what" spreadsheets
- Pairing with senior developers for brain-dump sessions
- Taking verbose meeting notes, hoping to organize them later (they don't)

### Pain Points with Current Solution
1. **No map of what to learn** — Consultant doesn't know what they don't know. Weeks pass before discovering critical systems or knowledge holders
2. **Stale documentation trap** — Hours spent reading wiki pages last updated 18 months ago, only to learn "we don't do it that way anymore"
3. **Tribal knowledge gatekeepers** — Critical knowledge lives in 2-3 people's heads. If they're unavailable or defensive, the consultant is blocked
4. **No structured output** — Knowledge extracted in meetings evaporates. Personal notes are unstructured, unsearchable, and die with the engagement
5. **Reinvented every time** — Each consultant develops their own approach. No institutional method. No reusable artifacts for the next consultant

### Workarounds & Hacks
- Personal "who knows what" spreadsheet built in week 1 (ad-hoc Silo equivalent)
- Verbose meeting notes hoping to capture everything, never organized
- Asking client PM "who should I talk to?" and hoping they know (they often don't)
- Git blame / PR history as reverse-engineering substitute for documentation
- Pairing with senior developer for a day — high value but unstructured and unrepeatable

### Cost of Current Solution
- **Time:** 40-80 hours per engagement on knowledge archaeology (1-2 full weeks)
- **Money:** $0 in tools, but at consultant billing rates = tens of thousands per engagement in firm cost
- **Opportunity cost:** Can't start delivering value until ramp-up is done. Client sees weeks of "still learning"
- **Quality cost:** Incomplete knowledge → wrong recommendations → rework → eroded client trust
- **Frustration:** HIGH — "I feel like I'm starting from scratch every single time"

---

## Problem Contexts

### When Does This Problem Occur?
- **Day 1-3:** The "where am I?" phase — maximum knowledge gaps, access credentials, vague brief, kickoff meeting
- **Weeks 1-2:** Survey mode — mapping systems, scheduling stakeholder meetings, reading documentation
- **Weeks 2-4:** Excavation mode — deep-diving into specific domains, extracting tribal knowledge
- **Unpredictable spikes:** Mid-delivery when the consultant hits a wall ("nobody told me about the migration")
- **Engagement handoff:** When a second consultant joins or replaces the first

### Where Does This Problem Occur?
- **Physical:** Client site (40%), home office (40%), hybrid/travel (20%) — increasingly remote-first
- **Digital:** Client's tools — the consultant has no control over the tooling landscape (Confluence, Jira, Slack, Teams, GitHub, Azure DevOps — varies wildly)
- **State of mind:** Cognitive overload. Everything is new — people, systems, acronyms, politics. Simultaneously learning, relationship-building, and trying to appear competent

### Why Does This Problem Matter Now?
- Engagements are getting shorter — clients expect value in weeks, not months
- AI tooling raises client expectations — "Can't the AI just read the codebase?" (tribal knowledge isn't in the codebase)
- Consultant turnover means institutional knowledge about extraction methods walks out the door
- Gyre coming online needs structured TKA inputs via FG-HC1 — without Forge, Gyre runs on incomplete data

### What Triggers the Need?
- **Engagement kickoff:** "You start at ClientCo on Monday"
- **Blocked delivery:** "I can't design this solution because I don't understand the existing system"
- **Stakeholder surprise:** "Wait, there's another team that owns this?"
- **Client frustration:** "Didn't we already explain this to your colleague last time?"
- **Handoff event:** "Sarah is rolling off, you're taking over"

---

## Forces & Anxieties

### Forces Pushing Toward Change
**What makes them want to switch?**
1. **Time pressure** (HIGHEST) — Shorter engagements, clients expect value in weeks. Every archaeology day is a non-delivery day
2. **Repeated pain** — Happens every engagement, 2-4x/year. Cumulative frustration compounds
3. **Quality risk** — Incomplete knowledge leads to wrong recommendations. Getting burned once is enough
4. **Gyre integration** — Structured TKAs feed Gyre's contextual model. Value multiplier visible to both-tool users
5. **Professional reputation** — Understanding the landscape in week 2 instead of week 4 = credibility

### Forces Pulling Back to Status Quo
**What makes them hesitate?**
1. **"My way works"** — Senior consultants have personal methods honed over years. Structured workflow feels like a downgrade
2. **No time to learn** — Too busy doing extraction badly to learn to do it well. Day 1 is the worst time to learn a new tool
3. **Client variability** — "Every client is different." Worry that structured method won't flex
4. **Overhead perception** — "I don't want to fill templates when I could be having conversations"
5. **Solo practice** — Consulting is individual. No team pressure to standardize

### Anxieties About Changing
- "Will this slow me down when I'm already under time pressure?"
- "Will the TKAs actually be useful, or am I producing artifacts nobody reads?"
- "Will it work at THIS client, or is it designed for a 'typical' client that doesn't exist?"
- "Will it make me look junior — like I need a script to do my job?"
- "What if I invest in learning the method and the firm abandons it next quarter?"

### Habits That Need Breaking
- Unstructured meeting notes that never get organized
- "I'll remember it" — relying on memory instead of systematic capture
- Asking broad questions ("tell me about the system") instead of targeted extraction
- Working alone — not sharing knowledge in a reusable format
- Starting delivery before the knowledge landscape is mapped

---

## Success Criteria

### Desired Outcome
"I can walk into any enterprise brownfield environment and have a structured understanding of the knowledge landscape within the first week. By week 4, I've extracted and structured critical tribal knowledge into reusable assets that feed my delivery work and survive after I leave."

### Success Metrics
1. **Time to productive understanding:** ≤1 week (from 2-4 weeks)
2. **Knowledge archaeology hours:** ≤20 hours/engagement (from 40-80)
3. **Knowledge coverage:** ≥80% of critical systems/domains mapped by Silo in week 1
4. **TKA production:** 3-8 TKAs per engagement with FG-HC1 frontmatter
5. **Handoff survivability:** Next consultant ramps in ≤3 days using existing TKAs
6. **Gyre input quality:** TKAs accepted by Gyre contextual model without manual rework

### Time to Value
- **Day 1:** Silo survey workflow feels immediately useful — "this organizes what I'd do anyway, but better"
- **Week 1:** Knowledge landscape map produced. Gaps visible, stakeholder sessions prioritized
- **Week 2-3:** Rune excavation producing TKA drafts from conversations
- **Week 4:** Complete TKA set feeds delivery work and Gyre via FG-HC1
- **Engagement 2:** Noticeably faster than engagement 1. Method internalized

### Acceptable Trade-offs
- ✅ Spend 30 minutes learning Silo's workflow before the engagement — if it saves 20+ hours during
- ✅ Follow structured interview protocol with Rune — if TKAs are genuinely useful for delivery
- ✅ Produce TKAs in specific format (FG-HC1 frontmatter) — if format serves both humans and Gyre
- ✅ Change from brain-dump meetings to guided extraction sessions — if stakeholders respond better

### NOT Acceptable Trade-offs
- ❌ More than 15 minutes overhead per stakeholder session for Forge-specific process
- ❌ Must master Forge before being productive — usable on first engagement
- ❌ Artifacts that only serve Gyre but don't help consultant's delivery work
- ❌ Rigid methodology that can't adapt to different client environments
- ❌ Any process that makes the consultant look scripted or mechanical in front of the client

---

## Assumptions to Validate

### Critical Assumptions (Test First)
1. **ASSUMPTION:** Consultants will follow a structured extraction method if it doesn't add perceived overhead
   - **Why risky:** If Forge feels like paperwork, adoption is zero regardless of output quality. Senior consultants with "my way works" habits are the hardest to convert
2. **ASSUMPTION:** TKAs are genuinely useful for delivery work, not just Gyre input
   - **Why risky:** If TKAs only serve the toolchain but don't help the consultant make better recommendations, they're shelf-ware

### Important Assumptions (Test Soon)
3. **ASSUMPTION:** A structured method reduces ramp-up time by 50%+ compared to ad-hoc approaches
   - **Why risky:** If the improvement is marginal (e.g., 3 weeks → 2.5 weeks), the switching cost isn't justified
4. **ASSUMPTION:** Knowledge landscape mapping (Silo) can achieve ≥80% coverage in week 1
   - **Why risky:** In deeply complex environments, even a structured approach might miss significant domains early

### Nice-to-Validate (Test Later)
5. **ASSUMPTION:** TKAs from one engagement are reusable by a second consultant on the same client
   - **Why risky:** TKAs may be too context-dependent or too stale by the time a second consultant arrives
6. **ASSUMPTION:** FG-HC1 format serves both human readability and Gyre consumption without compromise
   - **Why risky:** Optimizing for one audience may degrade the experience for the other

---

## Validation Plan

### Experiment 1: Shadow Engagement
- **Hypothesis:** If a consultant uses Silo's survey workflow on a real engagement, they will map the knowledge landscape faster and more completely than their ad-hoc approach — AND rate the experience as "no worse than what I normally do" on overhead perception
- **Method:** Next brownfield engagement, one consultant runs Silo's workflow alongside normal process. Track: time to landscape map, coverage (systems/stakeholders identified week 1 vs. what emerges later), overhead rating (1-5)
- **Success Criteria:** ≥80% coverage in week 1 AND overhead rating ≤3/5 ("about the same or less")
- **Timeline:** First available engagement after Forge Phase A ships

### Experiment 2: TKA Utility Tracking
- **Hypothesis:** If a consultant produces TKAs during an engagement, they will reference those TKAs during delivery ≥3 times per week AND rate them as "more useful than my personal notes"
- **Method:** Track TKA usage during weeks 3-6. Self-reported: how often opened a TKA to inform a decision? End-of-engagement survey comparing TKA utility vs. personal notes
- **Success Criteria:** ≥3 TKA references/week AND utility rating higher than personal notes AND ≥1 instance where TKA prevented a knowledge gap
- **Timeline:** Weeks 3-6 of the shadow engagement

### Experiment 3: Handoff Survivability
- **Hypothesis:** If TKAs exist from a previous engagement, a second consultant will ramp in ≤3 days (vs. 2-4 weeks with no artifacts)
- **Method:** On a client where TKAs were produced in Experiment 1, assign a second consultant and measure ramp time. Compare against historical handoff times at the same or similar clients
- **Success Criteria:** Ramp time ≤3 days AND second consultant rates TKAs as "essential to my ramp-up"
- **Timeline:** Next engagement cycle at the same client (or consultant rotation)

---

## Next Steps

1. **Validate riskiest assumption first:** Consultants will follow a structured method without perceiving overhead
2. **Talk to 5 consultants** within the next 2 weeks — validate pain points and willingness to adopt
3. **Run shadow engagement** to test Silo's workflow in a real environment
4. **Decision criteria:** If overhead rating ≤3/5 and coverage ≥80%, then proceed to Rune validation. If overhead >3, redesign Silo before testing further

---

## Revision History

| Date | What Changed | Why | New Assumptions |
|------|--------------|-----|-----------------|
| 2026-03-21 | Initial creation | First hypothesis from Vortex Contextualize + Empathize streams | All assumptions untested |

---

**Created with:** Convoke v2.3.1 - Vortex Pattern (Empathize Stream)
**Agent:** Emma (Contextualization Expert)
**Workflow:** lean-persona
