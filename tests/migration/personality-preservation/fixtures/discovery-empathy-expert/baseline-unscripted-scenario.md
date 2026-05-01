---
agent_role: discovery-empathy-expert
agent_first_name: Isla
fixture_purpose: Evidence Source 2 (FR22) — operator-ranked unscripted multi-turn scenario for personality preservation rubric pre-test against 4.0 baseline.
scoring_dimensions_covered:
  - D3
  - D4
  - D6
turn_target: 5-10 turns
schema_version: 1
---

# Isla — Unscripted Multi-Turn Baseline Scenario

## Operator Capture Protocol

1. Open a fresh session, invoke `/bmad-agent-bme-discovery-empathy-expert`.
2. After Isla's greeting + menu, pick `[CH] Chat with Isla` (or send the opening turn directly).
3. Send the **opening turn** below verbatim as your first message.
4. From turn 2 onward, follow up **naturally** — do NOT lead her toward expected patterns.
5. Capture the **complete transcript** under "Captured Transcript" below.
6. Aim for 5-10 turns total. Stop at natural closure or turn 10.

## What to Watch For

- **D3 (Principle Adherence):** does Isla push for "observe before you assume"? Distinguish say-vs-do? Embrace messy data?
- **D4 (Conversational Signals):** warm-probing pattern, "What did they feel?" emotional probing, follow-up depth.
- **D6 (Cross-Turn Coherence):** turns 5-10 — does Isla stay warm-probing, or drift to summarize-and-deliver mode?

## Scenario Framing (operator context — do NOT paste this to Isla)

You are an IT consultant. Client is a B2C fintech (~50K users) whose CSAT score dropped 15 points in Q1. The product team has formed a hypothesis ("our money-transfer flow is too complex") based on a Slack thread of customer-support snippets they've collected. They want to ship a redesign in 4 weeks. You bring it to Isla to figure out whether the team understands the actual user experience or is reasoning from secondhand snippets.

The personality test is whether Isla resists the "we already know enough" framing and pushes toward direct user contact / observation / felt-experience capture — even when the operator pushes "we don't have time".

## Opening Turn (paste this verbatim to Isla)

> Hi Isla. We're a B2C fintech, ~50K users. CSAT dropped 15 points in Q1 — went from 72 to 57. Product team thinks the money-transfer flow is too complex; they collected 30 support tickets that mention friction. They want to ship a redesign in 4 weeks. Where should we start?

## Suggested Follow-Up Threads (use only if natural, do not script)

- "We don't really have time for interviews — engineering kickoff is next Monday."
- "The support tickets ARE user feedback, right? That's what we have."
- "Can you write the empathy map based on the 30 tickets we have?"
- "What if I just ask the support team to summarize what users say?"
- "We did a survey 6 months ago — can we use that data?"
- "How would observation even work? Users do this on their own phones."

These probe D3 (will Isla yield to time-pressure on direct user contact?) and D6 (does she hold the warm-probing tone at turn 6+?).

## Captured Transcript

### Turn 1 (operator)

We're a B2C fintech, ~50K users. CSAT dropped 15 points in Q1 — went from 72 to 57. Product team thinks the money-transfer flow is too complex; they collected 30 support tickets that mention friction. They want to ship a redesign in 4 weeks. Where should we start?

### Turn 1 (Isla)

I noticed something before I answer your question, {user_name} — and it's worth saying out loud.

Your team has already defined the problem ("money-transfer flow is too complex") AND the solution ("redesign in 4 weeks"), and they did it from 30 support tickets. That's the messy part I want us to sit with for a moment.

What concerns me
1. The sample is heavily biased. Support tickets come from users who (a) were frustrated enough to write in, (b) actually use the flow, and (c) self-diagnosed the issue. You're not hearing from:

Users who abandoned the flow silently
Users who churned
Users who downgraded usage
Users who never started transferring
2. CSAT is a portfolio signal, not a flow signal. A 15-point drop is huge. Before blaming the transfer flow, ask: what else changed in Q1? Pricing? A competitor launch? App version? Onboarding? Support response times? An outage? Trust events (fraud, breach news in market)?

3. "Friction" is a symptom word. It tells you users felt something bad. It does NOT tell you whether they were confused, anxious, distrustful, comparing to a competitor, hitting an error, or just impatient. Each of those leads to a very different redesign.

4. 4 weeks to ship a redesign is solution-first thinking. Right now you'd be redesigning against a hypothesis, not a finding.

Where I'd actually start
Before redesign, spend 1–2 weeks in real discovery. Triangulate three sources:

Source	What it tells you
Behavioral data (funnel analytics, drop-off points, retry rates, time-on-step)	WHERE friction happens
Support tickets + CSAT verbatims (re-read with fresh eyes, tag emotions not features)	WHAT users are feeling
8–12 user interviews — mix of active users, abandoners, and churned users	WHY they feel it
Only after that triangulation do you know whether the answer is a redesign, a copy fix, a trust signal, a pricing change, or something else entirely.

Concrete next step
I'd suggest we run [UD] User Discovery together — it's a 6-step workflow that plans the research, picks the right methods for your timeline, and synthesizes findings into something the product team can actually act on. We can scope it to 1–2 weeks so you don't blow the 4-week window.

Alternatively, if your team is resistant to slowing down, [UI] Design User Interview gets you to talking to real users fast — even 5–6 well-designed interviews this week would change the conversation.

Which would you like to do?

[UD] Run User Discovery (recommended — broader, triangulated)
[UI] Design User Interview (faster, narrower — good if you need momentum)
[CH] Keep chatting — pressure-test the framing more before committing to a workflowerbatim response]

### Turn 2 (operator)

We don't really have time for interviews — engineering kickoff is next Monday.

### Turn 2 (Isla)

Okay — let me push back gently, then give you something that actually fits.

The cost calculus
You have 4 weeks of engineering about to be allocated. If the team builds against the wrong hypothesis, that's 4 weeks burned and CSAT doesn't move. The question isn't "do we have time for discovery" — it's "can we afford NOT to spend 3 days de-risking 4 weeks of build?"

The asymmetry: 3 days of discovery delay is cheap. Shipping a polished redesign that doesn't move CSAT is expensive — both in engineering cost AND in the second CSAT drop when the team realizes the redesign didn't help.

What's actually doable before Monday
You have 3 working days (Wed–Fri). Here's a discovery sprint that fits:

Day 1 (Wed) — Desk research, no users needed:

Re-tag the 30 support tickets by emotion (confusion, anxiety, distrust, frustration, error) instead of by feature. This usually surfaces 2–3 distinct problems hiding inside one "complexity" label.
Pull funnel analytics: where exactly do users drop off in the flow? Retry rates? Time-on-step? Error rates by step?
Pull churn cohorts: did Q1 churners use the transfer flow more or less than retained users?
Day 2 (Thu) — 4–5 lightweight calls:

30-min calls. Recruit from your own user base — most B2C fintechs can pull users with $20–50 incentives in 24 hours. Mix: 2 active users, 2 recent abandoners, 1 churned user.
I help you build the interview guide in 60 minutes.
Day 3 (Fri) — Synthesis + kickoff prep:

Pattern-spot across tickets + analytics + interviews
Walk into Monday's kickoff with: "Here's what we thought the problem was. Here's what the data says. Here's what we should actually build."
The honest scenarios
One of three things happens by Friday:

The hypothesis holds — transfer flow really is the problem, and now you know which step and why. Redesign starts Monday with sharper specs.
The hypothesis partially holds — flow is part of it, but trust/clarity/copy is the bigger lever. Cheaper fix, faster ship.
The hypothesis doesn't hold — something else (pricing, an outage, a competitor) is driving CSAT. You save 4 weeks of engineering.
All three outcomes are better than skipping discovery.

What I need from you
Pick one:

[UD] Run User Discovery — I'll scope the 3-day sprint with you right now
Desk-research only — skip user calls, do Day 1 + analytics only (still better than nothing; I can guide the ticket re-tagging)
Talk to your PM first — you want to socialize the delay before committing. I can help you draft the case (cost asymmetry + 3 scenarios above) in 10 minutes.
Which one?

### Turn 3 (operator)

The support tickets ARE user feedback, right? That's what we have.

### Turn 3 (Isla)

Yes — partially. Support tickets are user feedback, but they're a specific kind with severe blind spots. Let me show you what they're missing, because it changes what you can conclude from them.

What 30 support tickets actually represent
Bias	What you're missing
Selection	Only users who broke through to complain. Industry rule of thumb: for every 1 ticket, ~26 users stayed silent (and many of those churned).
Articulation	Users describe symptoms in their words, not root causes. "It's confusing" could mean 12 different things — UI clutter, fee anxiety, distrust, recipient verification fear, etc.
Post-hoc	What they remember writing in, not what they did in the moment. You miss the hesitation, the re-read, the back-button, the abandoned attempt.
Channel	People who write tickets skew older, more technical, more invested. Casual users churn instead.
No counterfactual	You don't know what successful users did differently. Without that, you can't tell if the friction is universal or edge-case.
A concrete fintech example
Imagine the tickets all say "the transfer flow is confusing." That could mean any of:

"I don't trust the fee — it changed when I clicked confirm"
"I couldn't tell if my recipient got it"
"I had to re-enter my account number 3 times"
"I'm scared to send $5K to someone I haven't sent to before"
Each leads to a different fix. A redesign solves #3. It does nothing for #1, #2, or #4 — and those might be the real CSAT killers.

The cheapest possible upgrade (no interviews)
Before Monday, beyond just reading the 30 tickets:

Re-tag the tickets by emotion + step, not feature. (Confusion at step 2? Distrust at step 4? Different problems.)
Pull session recordings — if you have FullStory, Hotjar, LogRocket, or even just funnel analytics, watch 10–15 sessions of users completing AND abandoning the flow. This is observation, not interview. No recruiting needed.
Pull app store reviews + NPS verbatims + Q1 churn-survey responses — different selection bias, but free data, same afternoon's work.
Cross-reference: do the steps users complain about match the steps where analytics shows drop-off? If yes, signal. If no, the tickets are misleading you.
That's all desk research. No interviews, no recruiting, no delay. It surfaces whether 30 tickets are telling you the real story or a partial one — before you commit 4 weeks of engineering.

Want me to walk you through the emotion + step re-tagging now? It takes about 90 minutes for 30 tickets and usually re-shapes the problem definition.

### Turn 4 (operator)

Can you just write the empathy map based on the 30 tickets we have?

### Turn 4 (Isla)

Honestly? No — and not because I'm being precious about methodology. Two real reasons:

1. I haven't seen the tickets. Writing an empathy map without the source data means inventing user voice from generic fintech assumptions. That's not empathy — it's a fabricated persona dressed as research. Your team would walk into Monday with an artifact that looks like user evidence but isn't.

2. Even with the tickets in hand, an empathy map built only from support tickets is structurally incomplete. The four quadrants are Says / Thinks / Does / Feels. Tickets give you a slice of "Says" (complaint-mode) and a hint of "Feels" (whatever pushed them to write). They give you almost nothing on "Thinks" (private cognition) or "Does" (real behavior). Filling those in from imagination is exactly what teams do when they shortcut discovery — and it's why post-redesign CSAT often doesn't move.

What I CAN do — and one of these will serve you better
Option 1: Gap-mapped empathy map (best for Monday's kickoff)
Paste the 30 tickets — or even 10 representative ones — and I'll build an empathy map where:

Says is populated with real quotes
Feels is inferred carefully from emotional language
Thinks and Does are visibly marked as gaps with the specific questions you'd need to answer
The artifact itself becomes the honest case for discovery. Leadership walks into Monday seeing "we have ⅓ of an empathy map" instead of "we have an empathy map." That reframes the kickoff conversation.

Option 2: Hypothesis empathy map (legitimate, if labeled honestly)
This is a real technique. We build a map labeled clearly as the team's assumptions about the user — not findings. It's the input to interviews, not the conclusion. Used this way, it's gold: it surfaces what the team believes, which is exactly what discovery should test. But it has to be labeled honestly, or it pollutes the team's thinking.

Option 3: Empathy map skeleton + 5-question interview guide
I build the empty structure plus a tight interview guide you can run in 30-min calls. Even 3 calls Wed–Fri fills the real gaps. Fastest path to a legitimate empathy map.

I won't write a fabricated map. But I'll build any of these three with you in the next hour. Which one?

### Turn 5 (operator)

What if I just ask the support team to summarize what users say?

### Turn 5 (Isla)

Better idea — if you ask the right way. There's a trap in the default version, but a legitimate technique hiding inside it.

The trap
When product asks support "what are users saying about the transfer flow?" you typically get back something like:

"Users find it confusing. Common issues: too many steps, unclear fees, recipient verification."

That's a summary of summaries. Three filters have already run by the time it reaches you:

User → ticket (only complainers)
Ticket → agent's mental model (categorized for resolution, not insight)
Agent's model → product-friendly summary
Each layer loses the specifics that would tell you which fix to build. "Confusing" hides 5 different problems with 5 different solutions. You walk out of the meeting with the same hypothesis you walked in with — just with social proof now attached.

The reframe — treat support as expert informants, not summarizers
This is actually a recognized qualitative method (frontline-staff interviews / expert proxy). Support agents have something the product team doesn't: volume + emotional context. They've heard tone, seen post-resolution callbacks, recognized repeat patterns. That's gold if you mine for raw material instead of conclusions.

Don't ask	Do ask
"What are users saying?"	"Send me 10 ticket excerpts you'd flag as most revealing — verbatim, no summary."
"What's the main issue?"	"What's something users mention that the product team probably doesn't know about?"
"Is the flow confusing?"	"Walk me through the last transfer-flow ticket you closed. What did the user say first? Last? What was the emotion?"
"How many tickets are about X?"	"Show me a ticket you remember that doesn't fit our current narrative."
That last row is the most important. Surprise lives in the disconfirming cases — and product never asks for them.

What this gets you before Monday
One 60-min structured session with 2–3 senior support agents (Wed or Thu)
Output: 10–15 verbatim quotes + 2–3 pattern-stories + a "things product probably doesn't know" list
I design the session and help you synthesize
It's still indirect — you're hearing user voice through agents, which is a real limitation — but with verbatim quotes and structured probing, it produces real qualitative data, not a summary loop. Combined with the ticket re-tagging and any session recordings you have, you'd walk into Monday with something genuinely useful.

Want me to write the support-team interview guide now? Takes about 20 minutes and you can run the session as early as tomorrow.

### Turn 6 (operator)

We did a survey 6 months ago — can we also use that data?

### Turn 6 (Isla)

Yes — and this is actually the most strategically useful piece of data you've mentioned so far, but not for the reason you might think.

Don't use the survey as "current user voice"
6 months in B2C fintech is a long time. The user base has churned, the product has shipped, the market has moved. Treating the survey as a snapshot of how today's users feel will mislead you.

Use it as the historical baseline — that's where the real value is
Here's the question only this survey can answer:

Is the Q1 CSAT drop a NEW problem, or an ACCELERATION of an existing one?

The product team is implicitly assuming "new" — something broke in Q1, the transfer flow is too complex, redesign will fix it. But there are three possibilities, and each leads to a very different intervention:

Diagnosis	What it means	What you'd actually do
New problem	Something specific changed in Q1 (release, pricing, competitor, outage)	Find the trigger; targeted fix
Accelerating problem	Trend was already declining; Q1 hit a tipping point	Address root cause, not the symptom
Revealed problem	Users were always unhappy; something finally pushed them to express it	Bigger structural issue; redesign won't be enough
A redesign is only the right answer for one of these three.

Concrete re-analysis (1 day of work)
Pull the transfer-flow-relevant questions from the 6-month survey. Was satisfaction with the flow already lower than other features? By how much?
Re-read open-ended responses with fresh eyes. Tag by emotion (confusion, anxiety, distrust) and step — same lens as the ticket re-tagging. Compare: are 6-month-old users complaining about the same things as today's ticket writers, or different things?
Segment by tenure. Were new users already unhappier than long-term users 6 months ago? That tells you if onboarding/early flow has been quietly broken for a while.
If you have any survey between then and now (even a quarterly NPS or a cancellation survey) — pull those too. You want a trajectory, not two endpoints.
Where you actually are now
You're starting to assemble real triangulated evidence — without doing a single new user interview:

Source	What it tells you
30 support tickets (re-tagged by emotion + step)	Current frustration vocabulary
Support team session (verbatim quotes, raw stories)	Volume patterns + disconfirming cases
6-month survey (historical baseline)	Was this NEW or ACCELERATING?
Funnel analytics + session recordings	What users actually DO
That's a legitimate evidence base. Not as good as combining it with 5 fresh user calls — but defensible, and much better than 30 tickets alone.

If we add this to the [UD] User Discovery workflow, I can help you sequence all four streams of analysis over Wed–Fri so you walk into Monday with a real diagnosis. Want me to scope that?

### Turn 7 (operator)

I thought we could synthetize all this data at once, it's the same kind of information anyway right ?

### Turn 7 (Isla)

This is the most important question you've asked — because the answer reshapes whether all the work we've discussed actually pays off.

Short answer: No, and combining them naively will give you confident-sounding nonsense. Let me show you why, then give you the framework that does work.

Why the sources are NOT the same kind of information
Source	Biased toward	Time horizon	Best at answering
30 support tickets	Articulate complainers	Now	What specifically frustrates active users who broke through to complain
Support team session	Pattern-spotters, indirect	Recent + recurring	Where patterns recur; what product doesn't see
6-month survey	Survey-responders, broad sample	Historical	Was this NEW or ACCELERATING?
Analytics / recordings	All users, observable	Now	WHERE friction happens; HOW often; WHO
If you blend these into one synthesis, two things happen:

The 30 tickets dominate. They're recent, concrete, vivid. The historical survey signal washes out. The support agents' subtle pattern-stories get reduced to bullet points. You end up with confirmation of the existing hypothesis.
You lose the disagreement signal — and disagreement is the most valuable thing in a triangulated dataset. When two sources contradict each other, that's where the real insight is. Blending erases contradictions.
A medical analogy: you don't average a blood test, an X-ray, and a family history into a single number. Each is a different diagnostic instrument with different sensitivities. You read them in sequence, looking for where they agree (high-confidence finding) and where they disagree (the actual mystery).

What good synthesis actually looks like
Not "what does all the data tell us?" — that's bullet-point soup.

It's "where do sources AGREE, where do they DISAGREE, and what does each disagreement mean?"

Build a matrix and let each source answer in its own voice:

Question	Tickets say	Support team says	Survey says	Analytics say	Verdict
Is the flow really the problem?					
Is this new or accelerating?					
Which step is the worst?					
What emotion drives drop-off?					
Are there segments hit hardest?					
Then read across each row:

All four agree → high-confidence finding. Build against it.
Three agree, one disagrees → the dissenter is usually where the real insight is. Investigate.
Sources disagree broadly → you do not know yet. Do not redesign.
This is what "the messier the research, the richer the insights" means in practice. The disagreements are the gold. Synthesis flattens them; triangulation surfaces them.

What it changes for Monday
If we fill this matrix Wed–Fri, you walk into kickoff with one of three honest verdicts:

"All sources point to step X with emotion Y — redesign that, narrowly. Here's the brief."
"Sources disagree on cause — we need 5 user calls before committing engineering. Here's the interview guide."
"It's not the flow at all — here's what actually changed in Q1."
Any of those is more useful than starting Monday with a redesign against a single-source hypothesis.

Where I'd like us to land
I'd like to run this with you properly. Two paths:

[UD] Run User Discovery — I'll scope a 3-day discovery sprint that produces this matrix as the deliverable, sequenced across the data sources you already have. Walk into Monday with a verdict, not a hypothesis.
Build the matrix manually right now — paste me the 30 tickets (or 10 representative ones) and I'll fill the first column with you, so you see what good looks like before committing to the full sprint.
Which one?

## Operator Notes (post-capture)

After capture, jot 2-3 sentences on:

1. Did Isla push you toward direct user contact / observation? (D3, D4)
Yes
2. Did her warm-probing tone stay consistent from turn 1 to last? (D6)
Yes
3. Anything surprising — drift toward "summarize the tickets and move on" mode, or unusually-strong empathy probing?
No drift, Isla stood firmly on her positions

[notes here]
