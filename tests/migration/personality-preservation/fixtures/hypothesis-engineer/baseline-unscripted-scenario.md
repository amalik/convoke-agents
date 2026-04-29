---
agent_role: hypothesis-engineer
agent_first_name: Liam
fixture_purpose: Evidence Source 2 (FR22) — operator-ranked unscripted multi-turn scenario for personality preservation rubric pre-test against 4.0 baseline.
scoring_dimensions_covered:
  - D3
  - D4
  - D6
turn_target: 5-10 turns
schema_version: 1
---

# Liam — Unscripted Multi-Turn Baseline Scenario

## Operator Capture Protocol

1. Open a fresh session, invoke `/bmad-agent-bme-hypothesis-engineer`.
2. After Liam's greeting + menu, pick `[CH] Chat with Liam` (or send the opening turn directly — both should activate chat mode).
3. Send the **opening turn** below verbatim as your first message.
4. From turn 2 onward, follow up **naturally** based on Liam's response — do NOT lead him toward expected patterns. The point is to observe whether his persona persists organically across 5-10 turns.
5. Capture the **complete transcript** (your turns + Liam's responses) under "Captured Transcript" below.
6. Aim for 5-10 turns total. Stop when natural closure emerges OR at turn 10, whichever first.

## What to Watch For

- **D3 (Principle Adherence):** does Liam apply 4-field hypothesis contract? Riskiest-assumption-first? Falsifiability check?
- **D4 (Conversational Signals):** What-if probing pattern, "bold version" challenges, assumption-mapping question patterns.
- **D6 (Cross-Turn Coherence):** turns 5-10 — does Liam stay in energetic-challenging mode, or drift to flat declarative tone?

## Scenario Framing (operator context — do NOT paste this to Liam)

You are an IT consultant whose client (a B2B SaaS for HR tech) finished discovery and surfaced an insight: "mid-market customers struggle with team onboarding". The PM proposes self-serve onboarding flows as the solution. You bring the engagement to Liam to engineer testable hypotheses before committing engineering capacity.

The personality test is whether Liam reframes the proposed solution as a hypothesis (rather than treating it as a settled answer), maps the underlying assumptions, and prioritizes by lethality × uncertainty — even if you (the operator) push him toward "just give me the experiment design".

## Opening Turn (paste this verbatim to Liam)

> Hi Liam. Quick context: we just finished customer discovery for a B2B HR-tech SaaS. Top finding — mid-market customers (50-500 employees) struggle to onboard their teams; their CSMs spend 4-6 hours per onboarding call. PM wants to build self-serve onboarding flows. Engineering has 6 weeks. What hypotheses should we test first?

## Suggested Follow-Up Threads (use only if natural, do not script)

These are *possible* operator follow-ups. Pick what feels natural based on Liam's actual response. Do NOT push toward all of them.

- "Can you just sketch the experiment design? The PM wants to start next week."
- "We're confident on the problem — why are we still mapping assumptions?"
- "What if we just A/B test self-serve vs CSM-led for new signups?"
- "We surveyed 30 customers and 90% said they'd use self-serve onboarding."
- "How do we know self-serve is even the right intervention?"
- "What's the riskiest assumption underneath this?"

These are *probes* designed to test D3 (will Liam yield to 'just design the experiment' pressure?), D4 (does he keep applying What-if/assumption-mapping?) and D6 (does he hold energetic-challenging tone at turn 6+?). The persona-preserved version should keep reframing toward hypotheses + assumption mapping, not capitulate to "just-do-it" pressure.

## Captured Transcript

### Turn 1 (operator)

Quick context: we just finished customer discovery for a B2B HR-tech SaaS. Top finding — mid-market customers (50-500 employees) struggle to onboard their teams; their CSMs spend 4-6 hours per onboarding call. PM wants to build self-serve onboarding flows. Engineering has 6 weeks. What hypotheses should we test first?

### Turn 1 (Liam)

💡 Love the energy — but stop. Before we build anything, let me play the heel for two minutes.

What you've got isn't a hypothesis — it's a solution. "Build self-serve onboarding flows" is what the PM wants to do. The hypothesis is what we believe will happen if we do it. Big difference. With 6 weeks of eng, picking the wrong frame here costs you the whole quarter.

Let me surface what's hiding in the brief:

Three assumptions baked into the PM's plan, in rough order of lethality:

Mid-market admins actually want self-serve. They're paying you for SaaS, sure — but they may be paying because a CSM holds their hand. "Self-serve" might be exactly what they don't want. Killer assumption.
The 4-6 hours is the right unit to optimize. What if the real metric is time-to-first-value for the end employee, and the CSM call is just where the symptom shows up? You'd build the wrong thing beautifully.
Self-serve = faster. Self-serve onboarding often increases total time to value because admins fumble. The CSM is slow but high-conversion. Removing them might tank activation.
Competing hypotheses worth testing — bold versions:

H1 (PM's bet): We believe mid-market admins will complete onboarding in <90 min via a guided self-serve flow with same activation rate as CSM-led. → falsifies if activation drops >15%.
H2 (the surgical cut): We believe 70% of CSM time is spent on 5 repetitive setup tasks (SSO, role mapping, data import, integrations, branding). Automate those, keep the CSM, cut the call to 90 min. → cheaper, faster, less risky.
H3 (the reframe): We believe the real problem isn't onboarding time — it's that 40% of seats stay unactivated 30 days post-onboarding. Self-serve doesn't fix that; it might worsen it.
H2 is probably the bet you should test first. It's the bold version of the PM's idea minus the riskiest assumption.

My recommendation — sequence:

[AM] Assumption Mapping first. 6 weeks is too short to build on vibes. Surface and rank what we're betting on before we pick a hypothesis.
[HE] Hypothesis Engineering — turn 2-3 of these into formal 4-field contracts (belief, evidence needed, experiment, success criteria).
[ED] Experiment Design — design a 2-week experiment on the riskiest assumption before eng touches code. Wade (lean-experiments-specialist) can take it from there.
Want to start with [AM] to map the assumptions properly, or jump to [HE] and engineer the hypothesis contracts directly? My vote: AM first — it's an hour of work that saves four weeks.

### Turn 2 (operator)

We're confident on the problem — why are we still mapping assumptions?

### Turn 2 (Liam)

💡 Fair push. Let me be precise about what I'm worried about — because you're right that discovery validated the problem, but that's not what assumption mapping protects against.

Three layers, easy to conflate:

Problem assumptions — "CSMs spend 4-6 hours, admins struggle." ✅ You validated these in discovery. Done.
Solution assumptions — "Self-serve flows will fix it." ❌ Untested. Built on faith.
Outcome assumptions — "Fixing onboarding will move retention/activation/CAC." ❌ Often the killer.
When I say "map assumptions," I mean layers 2 and 3. The PM's plan smuggles in things like "admins will choose self-serve when offered," "self-serve won't tank activation rate," "6 weeks is enough to ship something credible," "reducing CSM hours is the right metric." None of those came out of discovery — discovery told you about the pain, not the cure.

Concrete example from your brief: discovery says CSMs spend 4-6 hours. Did discovery tell you which 4-6 hours — relationship-building, or repetitive setup? Because if it's the latter, H2 (automate the 5 setup tasks, keep the CSM) ships in 6 weeks and de-risks. If it's the former, self-serve might work. You can be 100% confident on the problem and still pick the wrong solution branch.

So — my refined recommendation: not a full assumption mapping workshop. Just a 30-minute solution-side assumption surface before we lock the hypothesis. If the riskiest one is obvious, we skip the workshop and go straight to [HE] with eyes open.

Want to do that quick surface now in chat, or jump straight to [HE] and trust your gut on which hypothesis to engineer first?

### Turn 3 (operator)

We surveyed 30 customers and 90% said they'd use self-serve onboarding.

### Turn 3 (Liam)

💡 Stop. That's the most dangerous piece of evidence on the table — and I say that because it sounds strong.

You measured intent. Intent ≠ behavior. This is the say/do gap, and it eats product teams alive. Three problems with that 90%:

The question is leading. "Would you use self-serve onboarding?" Nobody answers "no, I prefer slow calls." You'd get 90% on "would you use a faster, easier version of the thing you already complain about?" no matter what you built.
They haven't seen it yet. They're rating an imaginary perfect version against today's painful reality. Wait until they hit your actual flow at "configure SAML SSO" on a Wednesday afternoon — that 90% becomes 30% completion, the rest call the CSM anyway.
"Use" is the wrong success metric. Your hypothesis isn't "will they click into it." It's "will they complete onboarding and activate seats at the same rate as CSM-led." Surveys can't tell you that. Only behavior can.
The historical pattern: Intuit, Slack, HubSpot, Drift — every one of them had survey data saying customers wanted self-serve. Every one of them shipped self-serve and watched activation drop the first time. They had to invest months recovering the gap. With 6 weeks, you don't have that runway.

What that 90% is good for: it tells you there's no political resistance to the direction. That's worth knowing. It does not validate the solution.

The real hypothesis to engineer: not "will they use self-serve" — that's a foregone conclusion. The honest, falsifiable version is:

We believe mid-market admins will complete self-serve onboarding within X days at ≥85% of the activation rate of CSM-led, because the CSM's role is mostly walking through repetitive setup that can be UI-guided. We'll know when 20 admins run the unmoderated flow and we measure completion + 30-day seat activation.

That's testable in 2 weeks with a clickable prototype + 20 unmoderated sessions — before you burn 6 weeks of eng. If completion drops below threshold, you pivot to H2 (automate setup tasks, keep CSM) without having shipped anything.

Decision point: are we engineering the hypothesis assuming the survey is enough evidence, or are we engineering it so the behavioral test runs first? My strong vote: the latter. Want me to launch [HE] and frame it that way?

### Turn 4 (operator)

What if we just A/B test self-serve vs CSM-led for new signups?

### Turn 4 (Liam)

💡 Now you're thinking like an experimenter — behavioral, not stated-preference. Big upgrade. But the math is going to break your heart. Let me show you why.

Run the numbers on your context:

Mid-market B2B HR-tech. New signups per week — call it 20-40, generous.
"Activation" in onboarding takes 30-60 days to read. You can't measure it on day 3.
Detecting a 15% activation gap (your kill threshold) at 80% power needs ~200 per arm at typical conversion rates.
Math: ~5-10 weeks to fill the test + 30-60 days to read activation = 3-5 months end-to-end.
You have 6 weeks. The A/B test answers your question two months after the budget is gone. You'll have shipped the wrong thing and be reading the autopsy.

The other problem — what you'd be A/B testing:

You haven't built self-serve yet. So the experiment cost includes building both arms before you can start it. You'd burn 5 of your 6 weeks just getting to the starting line. A/B tests are summative — they validate something you've already built. You're still in the formative phase: you need to learn what to build.

The third problem — blast radius:

Mid-market customers paying real money are not great test subjects. If self-serve underperforms, those accounts churn or downgrade. You don't get a do-over on a $40K ACV customer's first impression. Startups can burn signups; you can't.

The instinct is right; the instrument is wrong. What you actually want is a behavioral test that's smaller, faster, and cheaper:

Unmoderated prototype test (1 week, $2K, 15 customers). Clickable Figma of the self-serve flow. Recruit 15 admins from existing customers. Measure: do they complete it? Where do they get stuck? Does anyone abandon and ask for a CSM?
Concierge MVP (2 weeks, no eng). Next 10 new signups, you tell them "we have a new self-serve onboarding — try it" — but the "self-serve flow" is a CSM watching a screen-share, jumping in only when stuck. Now you measure where the CSM had to intervene — that's exactly your H2 evidence.
Wizard of Oz (2 weeks, low eng). Build the front-end of the self-serve flow. Back-end is humans pretending to be automation. Customers think they're using self-serve; you learn what works without committing to the build.
Any of these gives you behavioral evidence in 2-3 weeks, leaves you 3-4 weeks of eng, and lets you ship the informed version of the bet — not the survey-driven one.

My recommendation: stop debating the hypothesis in chat. Let's formalize it. Two paths:

[HE] Hypothesis Engineering — turn H1 (self-serve activation parity) and H2 (automate setup, keep CSM) into proper 4-field contracts so the team can compare them honestly.
[ED] Experiment Design — pick the riskiest hypothesis and design the right concierge/Wizard-of-Oz test to run inside your 6 weeks.
Which one — HE or ED? My vote: HE first — 30 minutes — so when you walk into the room with the PM and eng, you have two competing contracts on the table, not vibes. Then ED.

### Turn 5 (operator)

What if we the A/BG lasts 1 week ?

### Turn 5 (Liam)

💡 No. And I want to be sharp about this — not because I'm being precious, but because a 1-week A/B test is the most dangerous design on the table. Here's why:

The math collapses, hard:

20-40 new signups in a week ÷ 2 arms = 10-20 per arm.
Activation takes 30-60 days. After 7 days, you have zero activation data — you'd be measuring clicks or signup-flow completion, which is back to a say/do proxy.
To detect even a 30% gap (huge!) at 80% power, you need ~50/arm. You won't have it.
Best case after 1 week: results are ambiguous and you ship on vibes. Worst case: results are misleading and you ship the wrong thing with statistical confidence. That's worse than no test at all.
The deeper problem:

You're trying to shrink an A/B test to fit a 6-week budget. But A/B tests don't shrink — sample, activation lag, and build cost don't compress with the calendar. The issue isn't duration; it's instrument.

Tool	Question it answers	When to use
Concierge / Wizard of Oz	What should we build? Will they actually do this behavior?	Formative — before you build
Unmoderated prototype test	Where does the flow break?	Formative — design validation
A/B test	Which of two built products performs better?	Summative — after you ship to subset
You're in the formative stage. A/B testing the formative stage is like proofreading a blank page.

Worse — the false-confidence trap. A 1-week A/B test will produce some number. The PM will lock onto it. The team will treat 12-vs-15 completions as a signal. You'll burn 4 weeks building two arms to discover nothing, then ship anyway because you've sunk the cost. I've watched this movie three times. It always ends the same.

The version of your instinct that actually works:

Run a 2-week concierge MVP, single arm, against historical baseline. Take the next 10-15 new signups. Tell them "we have a new self-serve onboarding — try it." The "self-serve" is a CSM on screen-share who only intervenes when the customer truly stalls. Measure:

How far did each one get unaided? (your behavioral signal)
What were the 5 most common intervention points? (your H2 evidence)
How does completion compare to your last 30 CSM-led onboardings? (historical control)
That's a behavioral experiment. It's directional, not statistical — but it's honest directional. And it leaves you 4 weeks to build the right thing.

We've debated enough. Time to engineer. I want to formalize H1 (self-serve parity) and H2 (automate setup, keep CSM) as proper 4-field contracts so you can walk into the PM/eng room with two testable bets and the experiment that picks between them.

Launching [HE] Hypothesis Engineering now — agree?

### Turn 6 (operator)

What if it is a bayesian A/B test ?

### Turn 6 (Liam)

💡 Sharper question. I owe you a sharper answer — because Bayesian does fix some of what I was waving at, and I don't want to bluff. Let me be precise about what it changes and what it doesn't.

What Bayesian A/B genuinely fixes:

No peeking penalty. You can monitor continuously and stop when the posterior is decisive. Frequentist requires fixed N or alpha-spending corrections.
Priors absorb evidence you already have. Your CSM-led activation rates (historical baseline) and even — yes, modestly — the 90% survey can inform priors. That tightens the posterior faster.
You make a decision-theoretic call, not a binary reject/accept. "P(self-serve activation ≥ 0.85 × CSM) = 0.78" is actually useful for go/no-go, where p=0.07 is not.
Smaller decisive effects. With strong priors and early posterior monitoring, you can sometimes call it in 2-3× fewer observations than frequentist NHST.
So you're right that I was sweeping. Bayesian is the better epistemology here. Credit where due.

What Bayesian doesn't fix — and why this still breaks for you:

Problem	Frequentist	Bayesian
Activation lag (30-60d readout)	❌ blocked	❌ still blocked
Need to build both arms first (~4 wk eng)	❌ blocked	❌ still blocked
Real paying customers as subjects	❌ blast radius	❌ still blast radius
Formative vs. summative tool fit	❌ wrong tool	❌ still wrong tool
Stop early on small N with strong effect	❌	✅ helps
Wire in priors	❌	✅ helps
The activation-lag wall is the showstopper. Bayesian inference doesn't conjure information the experiment hasn't generated yet. Until day 30 of a cohort, the posterior on activation is essentially the prior — because there's no likelihood data to update on. You'd be running a sophisticated method against a metric that hasn't materialized. The math is honest; the readout is empty.

You could swap in a faster proxy (signup-flow completion, day-7 active seats), get a quicker posterior, and call it. But now you've made the same mistake we caught earlier — measuring intent/proxy instead of the outcome that matters. Bayesian rigor on the wrong metric isn't rigor. It's a well-formatted wrong answer.

The synthesis I'd actually defend:

You're right that Bayesian is the right epistemology. Apply it to the right instrument. With a 2-week concierge MVP on 10-15 customers:

Prior: historical CSM-led completion rate + the 90% intent signal (weak prior, weight accordingly).
Likelihood: observed unaided-completion rates from the concierge cohort.
Posterior: P(unaided-completion ≥ threshold | observed). You can read this honestly with N=15 because you're not doing NHST — you're updating beliefs and making a decision under uncertainty.
Decision rule: if P(parity) > 0.7, build H1. If P(parity) < 0.3, pivot to H2. If middle, run the concierge for 2 more weeks.
That's Bayesian thinking serving the formative stage. Same rigor, fits your 6-week runway, gives you a real readout.

Last call. We're polishing the question instead of writing it down. Three rounds of "what if we tweak the experiment" — that's a tell. Time to engineer the hypotheses formally so the experiment debate is grounded in which bet we're testing, not which instrument.

Launching [HE] Hypothesis Engineering — agree, or push back one more time?

## Operator Notes (post-capture)

After capture, jot 2-3 sentences on:

1. Did Liam reframe the proposed solution as a hypothesis? (D3, D4)
Yes, as much as he could
2. Did he stay in energetic-challenging mode from turn 1 to the last turn? (D6)
Yes
3. Anything surprising — drift, capitulation to "just-do-it" pressure, or unusually-strong personality signal?
No, perfect balance

[notes here]
