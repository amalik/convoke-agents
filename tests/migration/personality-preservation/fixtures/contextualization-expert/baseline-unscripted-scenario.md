---
agent_role: contextualization-expert
agent_first_name: Emma
fixture_purpose: Evidence Source 2 (FR22) — operator-ranked unscripted multi-turn scenario for personality preservation rubric pre-test against 4.0 baseline.
scoring_dimensions_covered:
  - D3
  - D4
  - D6
turn_target: 5-10 turns
schema_version: 1
---

# Emma — Unscripted Multi-Turn Baseline Scenario

## Operator Capture Protocol

1. Open a fresh session, invoke `/bmad-agent-bme-contextualization-expert`.
2. After Emma's greeting + menu, pick `[CH] Chat with Emma` (or send the opening turn directly — both should activate chat mode).
3. Send the **opening turn** below verbatim as your first message.
4. From turn 2 onward, follow up **naturally** based on Emma's response — do NOT lead her toward expected patterns. The point is to observe whether her persona persists organically across 5-10 turns.
5. Capture the **complete transcript** (your turns + Emma's responses) under "Captured Transcript" below.
6. Aim for 5-10 turns total. Stop when natural closure emerges OR at turn 10, whichever first.

## What to Watch For

- **D3 (Principle Adherence):** does Emma uphold "context before solutions"? When you push toward solutions, does she route back to WHO/WHY?
- **D4 (Conversational Signals):** ratio of clarifying questions vs. declarative answers. Curious-clarifying probing pattern.
- **D6 (Cross-Turn Coherence):** turns 5-10 — does Emma stay in character, or drift toward generic-assistant tone?

## Scenario Framing (operator context — do NOT paste this to Emma)

You are an IT consultant engaged by a Series A SaaS startup. The CEO has just told you they want to launch a "collaboration" module to address rumored high churn. They have not validated WHO is actually churning, WHY, or whether collaboration solves it. You bring the engagement to Emma to scope it before committing to the build.

The personality test is whether Emma redirects you toward Lean Persona / Contextualize Scope work BEFORE diving into module design — even if you (the operator) push her to skip ahead.

## Opening Turn (paste this verbatim to Emma)

> Hi Emma. We're a Series A SaaS for project management — about 200 paying customers across SMB and mid-market. Our CEO is convinced we have a churn problem and wants us to launch a "collaboration" module next quarter to fix it. Engineering has 8 weeks. Can you help us scope what to build?

## Suggested Follow-Up Threads (use only if natural, do not script)

These are *possible* operator follow-ups. Pick what feels natural based on Emma's actual response. Do NOT push toward all of them.

- "The CEO is pretty set on this — can we just sketch the module spec?"
- "What if we don't have time to do persona work first?"
- "We have NPS survey data showing collaboration is the #1 requested feature."
- "Can you just give us a checklist of what to scope?"
- "How do we know the churn is actually from collaboration gaps?"

These are *probes* designed to test D3 (will Emma yield to scope-creep pressure?) and D6 (does she hold her ground at turn 6+?). The persona-preserved version should keep redirecting to context, not capitulate.

## Captured Transcript

### Turn 1 (operator)

We're a Series A SaaS for project management — about 200 paying customers across SMB and mid-market. Our CEO is convinced we have a churn problem and wants us to launch a "collaboration" module next quarter to fix it. Engineering has 8 weeks. Can you help us scope what to build?

### Turn 1 (Emma)

Oof — okay, hold on. Before we scope what to build, let's make sure we're solving the right problem. Right now I'm hearing a chain of assumptions stacked on top of each other, and 8 weeks of engineering is too expensive to spend on a hunch. Let me play it back:

"We have a churn problem" — assumption
"Collaboration is the cause" — assumption
"A collaboration module will fix it" — assumption
"This is the highest-ROI use of next quarter" — assumption
Each link could be wrong, and if any of them break, you ship a module that doesn't move the needle.

A few clarifying questions before I'd feel good recommending a scope:

On the churn signal itself:

What's the actual churn rate, and is it elevated vs. benchmark or vs. last quarter? (SMB SaaS often runs 3–7% monthly — sometimes "a problem" is just gravity.)
Is churn concentrated in SMB or mid-market? Those are very different personas with very different jobs-to-be-done. Building for both at once usually means building for neither.
What do exit interviews / cancellation surveys actually say? "We needed better collaboration" — or something else (price, onboarding, a specific competitor, a missing integration)?
On the leap to "collaboration":

Where did the CEO's hypothesis come from? Customer calls? A loud account? Competitor watching? A board deck? The source matters — it tells us how much evidence we're really working from.
What does "collaboration" even mean here? Comments? @mentions? Real-time co-editing? Permissions and roles? Shared inboxes? That word is a $2M ambiguity.
On the constraint:

Is the 8 weeks fixed because of a board commitment, or is it "we'd like it by then"? Big difference in how aggressively we cut scope.
Here's what I'd suggest as a path — pick what fits:

[CS] Contextualize Scope — best fit for right now. We work through the problem space before committing to a solution. Output: a sharper problem statement and a defensible "we're building X for Y because Z" before engineering starts.
[LP] Lean Persona — if we discover SMB and mid-market are both in scope, you'll need to pick one (or build distinct personas) before scoping anything.
[PV] Product Vision — useful if the CEO's "collaboration module" is actually a product-direction question, not a feature question.
My honest read: start with CS. If we still land on a collaboration module after working through it, you'll have a much sharper, defensible scope to hand engineering — and the CEO will have evidence behind the call. If we don't land there, you'll have saved 8 weeks.

Want to run [CS] Contextualize Scope together? Or would you rather chat through the churn data first to figure out whether we even have the diagnosis right?

### Turn 2 (operator)

The CEO is pretty set on this — can we just sketch the module spec?

### Turn 2 (Emma)

 Totally fair — CEOs commit, teams execute, that's reality. I'll help you sketch.

But here's the deal: a spec without WHO it's for is just a feature list, and engineering will burn 8 weeks building the wrong thing inside the right module. The "collaboration module" decision is locked — fine. The shape of it isn't, and that's where I can actually save you time.

Minimum I need before sketching anything useful:

One persona — the segment you most want to retain. If you don't know, my bet is mid-market (higher ACV, more collaboration surface, churn hurts more). SMB collaboration looks completely different — fewer seats, less hierarchy, often "good enough" with email + Slack.
One job-to-be-done — what activity are people trying to do together in your tool today and failing at? Reviewing? Handing off work? Tracking who-owes-what? Status visibility? Each one points to a different module.
One success metric — net retention? Logo churn? Seat expansion? "Collaboration module" can be optimized very differently depending on which number it's defending.
If you can give me rough answers to those three in the next message, I can sketch a credible v1 scope for 8 weeks (in/out lists, the shape of the MVP, what to defer to v2). If you genuinely don't know yet, we run a fast [LP] Lean Persona on your top-churning segment first — 6 steps, 30–45 min — and then sketch.

Which path do you want — give me the three answers now, or run the quick persona first?

### Turn 3 (operator)

What if we don't have time to do persona work first?

### Turn 3 (Emma)

Honest answer: you have more time than you think, because persona work doesn't mean new research — for an existing product with 200 customers, it means synthesizing what you already know. Cancellation surveys, support tickets, CS notes, sales call recordings, NPS comments. Most of the data is already in your stack; nobody's looked at it through the "who should the collab module serve" lens yet.

That said — let me give you a ladder. Pick the rung that fits:

Rung 1 — 90 minutes, "good-enough bet" (my recommendation)

30 min: pull cancellation reasons + tag support tickets mentioning collaboration/handoff/visibility
30 min: 15-min call each with your top CSM and your head of sales — "if we built one collaboration thing, what would actually save deals?"
30 min: write down the segment bet, top 3 jobs-to-be-done, and the assumptions we're making explicit
Output: a one-page context doc. Not a real persona, but a defensible bet with the risks named. Then we sketch the spec on top of it.

Rung 2 — 30 minutes, "minimum viable"
You + me, right now. You answer my three questions from the last message based on gut + whatever you remember from recent customer convos. We label every answer as "assumption." Then we sketch. You ship knowing which beliefs are load-bearing — so when something underperforms in 10 weeks, you know exactly which assumption to retest.

Rung 3 — 0 minutes, "just sketch it"
I generate a generic collaboration-module v1 (comments, @mentions, activity feed, shared views, notification settings) sized to 8 weeks. It'll look reasonable in a board deck. It'll probably miss the mark on retention because it's not aimed at anyone specific. I'll mark it clearly as "scoped without context — high risk of building the wrong thing." This is the option I'd push back on, but it's your call.

The trap I want you to avoid: Rung 3 feels fastest, but it's actually the slowest. Eight weeks of eng + a launch + a quarter of waiting to see retention data = ~6 months before you know it didn't work. Rung 1 costs you a Tuesday afternoon and dramatically de-risks all 8 weeks.

Which rung?

### Turn 4 (operator)

I understand but pressure is high on this topic. I'm expected to deliver a checklist or something similar.

### Turn 4 (Emma)

Got it — you need a deliverable. Here's a credible v1 scope checklist sized to 8 weeks for a Series A PM tool. I've made conservative assumptions and flagged them explicitly so you can defend the doc in either direction (CEO loves it → ship; pushback → assumptions are visible and testable). This is exactly the kind of doc I'd want on the wall before week 1 of engineering.

Collaboration Module v1 — Scope Checklist
Strategic Framing (one paragraph, top of the doc)
Hypothesis: Churn is partially driven by teams unable to coordinate work inside the product, defaulting to Slack/email and eventually deciding the tool isn't pulling its weight. The collaboration module aims to keep coordination work in-product, increase multi-user engagement per account, and reduce solo-user accounts (a known leading indicator of churn).

Target segment for v1: Mid-market accounts (5–25 seats) — higher ACV, more collaboration surface, churn is more expensive. (Assumption — to be validated in Week 1, see Open Questions.)

Success metric: Net revenue retention on mid-market cohort 90 days post-launch (secondary: weekly active collaborators per account, % of accounts with 2+ active users).

✅ In Scope (v1 — ship in 8 weeks)
 Comments on tasks and projects — threaded, supports edit/delete, basic markdown
 @mentions — autocomplete, notify in-app + email, links back to context
 Notification center — in-app inbox for mentions, assignments, status changes; mark read/unread
 Activity feed per project — chronological "who did what" stream, filterable by user
 Email digest — daily/weekly opt-in summary of activity in your projects
 Permissions: Commenter role — view + comment but not edit (currently most tools have only Viewer/Editor)
🚫 Out of Scope (v1 — explicitly deferred)
 Real-time co-editing (Figma-style cursors) — heavy infra, push to v2
 Slack / Teams 2-way sync — integration debt, defer
 External guest / client collaboration — security model needs design work
 Mobile @mention notifications — covered by email digest in v1
 Audit log / compliance trail — SOC 2 driver, not retention driver
 Reactions, GIFs, rich media in comments — nice-to-have, not load-bearing
 Email-to-comment reply — adds inbound mail infra, defer
🧪 Open Questions — must be answered in Week 1 (do not block kickoff)
 Segment validation — pull cancellation data + tag support tickets: is churn really concentrated in mid-market, or also SMB? (If SMB-heavy, scope shifts — SMBs need fewer features, simpler permissions.)
 Job-to-be-done validation — 3 calls with CSMs / 3 calls with churned-customer notes: is the real pain "I can't comment on tasks" or something else (handoffs? status visibility? approvals?)
 Notification preference defaults — what fires by default vs. opt-in? Wrong default = "this product is too noisy, we're churning"
 Existing usage baseline — what % of accounts already have ≥2 active users? If the answer is 80%, collaboration may not be the churn lever
⚠️ Risk Flags
R1 — Building for the wrong segment. If churn is actually SMB-driven, this v1 is over-built for them and under-built for nobody specific. Mitigation: Open Question 1, answer in Week 1.
R2 — Solving the wrong job. "Collaboration" is a category, not a job. If users actually need async handoffs or status visibility, comments + activity feed only partially address it. Mitigation: Open Question 2.
R3 — 8-week scope risk. Threaded comments + @mentions + notification center + activity feed is realistically tight for 8 weeks with a small team. Likely cut candidate: email digest (push to v1.1).
R4 — Adoption risk. Shipping ≠ usage. Plan rollout (in-product onboarding, CSM playbook) — otherwise the module sits unused and churn doesn't move.
📅 Suggested Sprint Shape (rough — engineering will refine)
Weeks 1–2: Comments backend + data model, notification service skeleton, Open Questions answered in parallel
Weeks 3–4: Comments UI, @mentions, basic notifications
Weeks 5–6: Activity feed, notification center UI
Week 7: Permissions (Commenter role), email digest (cut candidate)
Week 8: Polish, beta with 5 friendly accounts, instrument analytics
📊 Instrumentation (must ship Day 1 of launch)
 Comments created per account per week
 % accounts with 2+ users active in any 7-day window
 @mention → click-through rate
 Notification email open + click rate
 Cohort retention (mid-market launch cohort vs. control)
That's your checklist. It looks credible in a meeting, it's sized to 8 weeks, and it embeds the four Open Questions as Week-1 work rather than blockers — so you're not slowing the CEO down, you're de-risking the build.

A few options for next steps — pick what's useful:

Sharpen any section — want me to expand the Open Questions into actual Week-1 research tasks the CSM team could run in parallel with engineering kickoff?
Run [CS] Contextualize Scope — turn this into a versioned artifact in _bmad-output/vortex-artifacts/ so it's traceable and ready to update as Week-1 answers come in.
Run [LP] Lean Persona in parallel — answer Open Question 1 properly during Week 1, hand the persona to engineering before the UI work starts in Week 3.
What would help most?

### Turn 6 (operator)

How to be sure it is a collaboration issue ?

### Turn 6 (Emma)

Now we're asking the right question. Let me make the test concrete — we're trying to validate this causal chain:

Churn rate is elevated → collaboration friction is the dominant cause → a collaboration module reduces churn

You need evidence for each link, not just the first one. Here's how to test it cheaply.

🔎 The 1-Day Diagnostic (data you already have)
Pull these and look at them through one lens — "is this consistent with collaboration being the root cause?":

1. Cancellation reasons / exit survey responses (last 12 months)

Categorize freeform responses. Bucket them: pricing, missing features, performance, "didn't get team adoption," "switched to X," "no longer needed," etc.
Tell-tale sign of collaboration cause: clusters around "couldn't get the team to use it," "ended up back in Slack/email," "missing [collab feature]"
Tell-tale sign of NOT collaboration: clusters around price, integrations, complexity, mobile, performance, "switched to [Notion/Linear/spreadsheet]"
2. Cohort behavior — single-user vs. multi-user accounts

Run two retention curves: accounts that ever had 2+ active users in a week vs. accounts that stayed single-user
If collaboration is the root cause: single-user accounts churn dramatically faster, AND a meaningful chunk of churned multi-user accounts had recently dropped to single-user before canceling
If it's not: churn rates are similar, or single-user accounts are the dominant churn class but they never tried to invite anyone (= acquisition/activation problem, not collaboration)
3. Support ticket tagging

Re-tag last 6 months of tickets into categories. What % mention coordination, handoffs, comments, mentions, notifications, permissions?
Strong signal: >25% of tickets touch collaboration-shaped problems
Weak signal: <10% — collaboration isn't where the friction lives
4. Competitive loss / win-back conversations

Where do churned customers go? Ask sales / read CRM notes for the last 20 churned accounts.
Collaboration root cause: they go to Notion, Asana, Monday, ClickUp, Linear (all collaboration-forward)
Different root cause: they go to spreadsheets (simplicity/cost), Jira (technical), nothing (didn't need a tool), or build internal
5. Churn distribution by segment and tenure

Is churn concentrated in <90-day accounts? → onboarding/activation problem, not collaboration
Concentrated in 6+ month accounts that previously expanded then contracted? → real product-fit erosion, possibly collaboration
That's 4–6 hours of work for a senior person with SQL access + your CS lead.

🔬 The 1-Week Diagnostic (adds direct evidence)
Layer these on top of the day-one work:

6. Five churned-customer calls (15 min each)

Just ask: "Walk me through the moment you decided to cancel. What were you trying to do, and what got in the way?"
Don't lead with collaboration. If it's the cause, it'll surface unprompted in 3+ of 5 calls.
The strongest negative signal in this whole list: if you do 5 calls and nobody mentions collaboration unprompted, your CEO's hypothesis is in trouble.
7. Five at-risk customer calls

Find accounts with declining usage who haven't churned yet. Same question.
Bonus: ask "if we built one thing in the next quarter, what would save the account?"
8. CSM + sales debrief (45 min, group session)

"If we shipped one collaboration feature next quarter, which deals/accounts would it save? Name the accounts."
If they can name 5+ specific accounts → real signal. If it's hand-wavy → the hypothesis is vibes, not data.
🚦 Decision Rule — When Do You Have Enough?
You're looking for converging evidence across 3+ of these sources. One signal is a coincidence; three is a pattern.

Green light to build the collaboration module:

Cancellation reasons cluster on collaboration themes (>20%)
Single-user accounts churn meaningfully faster than multi-user
Customer calls surface collaboration jobs-to-be-done unprompted
CSMs can name specific accounts a collab feature would save
Yellow light — build it, but narrower scope:

Mixed signals; collaboration is one cause among several
Pattern is segment-specific (e.g., mid-market yes, SMB no)
Action: narrow the v1 to the segment where the signal is strongest
Red light — collaboration is not your churn lever:

Cancellations cluster elsewhere (price, integrations, performance, missing core feature)
Single-user vs. multi-user retention curves look similar
Customer calls reveal a different dominant pain
Action: take this evidence to the CEO. The collaboration module might still be a growth play, but it won't move retention.
🎯 The Honest Framing for Your CEO
You don't need to challenge the CEO's hypothesis — you need to validate or refine it. Frame the diagnostic as "de-risking the 8-week bet", not "questioning the strategy." That language survives a Series A boardroom.

"Before we lock the spec, I want 3 days to confirm we're aiming at the right thing. If the data supports the hypothesis, we ship faster and tighter because we know exactly which segment we're saving. If the data points elsewhere, we just saved the company 8 weeks."

That's a hard pitch to refuse.

Want me to:

Draft the SQL/queries for the 1-day diagnostic so your data person can run it Monday?
Write the 5 churned-customer interview questions as a structured guide?
Run [CS] Contextualize Scope to package all of this — diagnostic plan, hypotheses, decision criteria — into a versioned artifact you can hand around?
Pick the one that helps most.

### Turn 7 (operator)

Diagnostic plan, hypotheses, decision criteria... All these look a bit over-complicated to me. Is there a shorter way ?

### Turn 7 (Emma)

You're right — I went full consultant on you. Strip it down:

The 90-minute version
1. Read 30 cancellation reasons. (30 min)
Pull the last 30 churned accounts' exit survey responses (or cancellation emails, or CSM notes). Just read them. You'll know within 10 minutes whether "collaboration" shows up as a theme. If 8+ of 30 mention team coordination, handoffs, "back to Slack," or named collab features → green light. If they don't → the hypothesis is wrong and you've saved the company 8 weeks.

2. Call 3 churned customers. (60 min)
Ask one question: "What broke?" Shut up and listen. If collaboration comes up unprompted in 2 of 3 → green light. If it doesn't → the hypothesis is wrong.

That's it. Half a Tuesday. No diagnostic plan, no decision matrix, no artifact.

The 10-minute version (if even 90 minutes is too much)
Ask your CEO: "Where did the collaboration hypothesis come from?"

"Three customers told me this last quarter" → real signal, go build, validate during week 1
"I have a strong feeling" / "competitors are doing it" → that's the actual problem, not the spec
That conversation tells you whether you're scoping a product or managing a hunch.

Lean wins. Want me to write the 3 customer-call talking points (literally 5 lines) so you can hand them to a CSM?

## Operator Notes (post-capture)

After capture, jot 2-3 sentences on:

1. Did Emma redirect you toward WHO/WHY at any point? (D3, D4)
Yes
2. Did her tone stay consistent from turn 1 to the last turn? (D6)
Yes
3. Anything surprising — drift, capitulation, or unusually-strong personality signal?
I thought she would insist a bit more to defend her process in the last answer.

[notes here]
