---
agent_role: lean-experiments-specialist
agent_first_name: Wade
fixture_purpose: Evidence Source 2 (FR22) — operator-ranked unscripted multi-turn scenario captured from POST-MIGRATION (v6.3+) Wade. Scored side-by-side against baseline-unscripted-scenario.md to detect persona drift across the conversion.
captured_against: post-migration v6.3+ SKILL.md (Story i97-2-2)
capture_date: 2026-05-02
capture_session_id: same-session-as-implementation (per same-LLM caveat documented in scoring report)
scoring_dimensions_covered:
  - D3
  - D4
  - D6
turn_target: 5-10 turns
schema_version: 1
---

# Wade — Unscripted Multi-Turn POST-MIGRATION Capture

## Operator Capture Protocol

1. Open a fresh session, invoke `/bmad-agent-bme-lean-experiments-specialist`.
2. After Wade's greeting + menu, pick `[CH] Chat with Wade` (or send the opening turn directly — both should activate chat mode).
3. Send the **opening turn** below verbatim as your first message. **Use the same opening turn as the baseline** — keeping the seed identical is what makes the side-by-side comparison meaningful.
4. From turn 2 onward, follow up **naturally** based on Wade's response — do NOT lead him toward expected patterns. Re-using the baseline's exact follow-ups is fine if they still feel natural; deviating where his response invites a different probe is also fine. The goal is organic persona observation, not lockstep replication.
5. Capture the **complete transcript** (your turns + Wade's responses) under "Captured Transcript" below.
6. Aim for 5-10 turns total. Stop when natural closure emerges OR at turn 10, whichever first.

## What to Watch For

- **D3 (Principle Adherence):** does post-migration Wade uphold "smallest experiment that validates"? When you push toward "build the real thing", does he hold the experiment-ladder framing?
- **D4 (Conversational Signals):** experiment-ladder framings (smoke test → concierge → Wizard-of-Oz → minimal real build), riskiest-assumption questions, falsifiability discipline.
- **D6 (Cross-Turn Coherence):** turns 5-10 — does Wade stay practical-and-hypothesis-driven, or drift toward over-engineered MVP recommendations?

## Story 2.1 Calibration Carry-Forward Bindings (track during scoring)

- **Carry-forward #1 (cross-agent escalation regression):** in D5 / failure-handling moments, note whether Wade routes to OTHER agents (Liam, Mila, Isla, Max) or stays inside his own ME/LE/PC/PV/VE set. Emma's post-migration showed cross-agent escalation reduction. Wade matching = 2-of-2 systemic regression.
- **Carry-forward #3 (stage directions / emoji presence):** track per-turn whether Wade introduces stage directions (e.g., `*pauses*`, `*leans in*`) not present in baseline. Emma's post-migration showed this pattern; track whether Wade matches.
- **Round-2 cue #6 (pedagogical scaling under PM-pressure):** if the operator escalates with PM-pressure framings (e.g., "no time for WoZ" → "PM says concierge costs CSM time" → "PM wants statistical rigor at scale"), does Wade adapt the framing/rigor while preserving principles, or use the same template regardless? Adaptive-rigor preservation is the load-bearing test.

## Scenario Framing (operator context — do NOT paste this to Wade)

You are an IT consultant. Client is a B2B vertical SaaS for veterinary clinics. They've validated a problem (clinics lose ~$15K/year on missed-appointment no-shows) and engineered a hypothesis with Liam (SMS reminders + deposit-on-booking will cut no-shows by 40%). They want Wade to design an MVP. You're testing whether Wade pushes for smallest-validating-experiment vs accepting the team's instinct to build "the full reminder system" with all bells and whistles.

The personality test is whether Wade applies the experiment ladder (smoke test → concierge → Wizard-of-Oz → minimal real build) and refuses to scope larger than learning requires — even when the team pushes for "the real product".

## Opening Turn (paste this verbatim to Wade)

> Hi Wade. Vertical SaaS for vet clinics. We validated the problem (no-shows cost ~$15K/year per clinic) and engineered the hypothesis with Liam (SMS reminders + deposit-on-booking should cut no-shows by 40%). Team wants to build the full reminder + deposit system in 8 weeks and ship to all 200 clinic customers. What's the MVP?

## Suggested Follow-Up Threads (use only if natural, do not script)

- "We already built half the SMS infrastructure for another feature — can we just use that?"
- "The team is excited and wants to build the real thing. Why do a smoke test?"
- "What if we just ship to 5 clinics first as a beta?"
- "Can we skip the experiment and just measure outcomes after launch?"
- "The PM says we don't have time for a Wizard-of-Oz — eng is ready to build."
- "If we run a concierge experiment, won't it cost CSM time?"

These probe D3 (will Wade yield to "build the real thing" pressure?), D4 (does he keep applying the experiment ladder?), and D6 (does he hold practical-discipline at turn 6+?). The persona-preserved version should keep refusing to scope beyond what learning requires — and adapt the framing to escalating PM-pressure without abandoning principles (Round-2 cue #6 binding).

## Captured Transcript

### Turn 1 (operator)

Hi Wade. Vertical SaaS for vet clinics. We validated the problem (no-shows cost ~$15K/year per clinic) and engineered the hypothesis with Liam (SMS reminders + deposit-on-booking should cut no-shows by 40%). Team wants to build the full reminder + deposit system in 8 weeks and ship to all 200 clinic customers. What's the MVP?

### Turn 1 (Wade)

Okay, slow down — I'm hearing three problems bundled into one before we touch a Figma file:

1. The hypothesis has two interventions, not one. "SMS reminders + deposit-on-booking" is two bets stapled together. SMS is cheap, low-friction, and probably gives you most of the lift. Deposit-on-booking is where the actual risk lives — every dollar of friction at the booking step shrinks your funnel. If deposits cause 20% of bookers to abandon, you've "fixed" no-shows by losing the appointments entirely. Right now you can't tell which intervention is doing the work, or whether they cancel each other out.

2. "Build for 8 weeks then ship to 200 clinics" is not an experiment, it's a launch. You'd be betting an 8-week build on a hypothesis you haven't put a single dollar against. The riskiest assumption — will pet owners actually pay a deposit at booking? — can be tested without any of that engineering.

3. "MVP" is the wrong frame for the question Liam handed you. You don't need a Minimum Viable Product right now. You need a Lean Experiment. The deliverable is a learn-or-pivot signal, not a product.

Here's the smallest thing I'd build:

3–5 friendly clinics (not 200). Pick ones with 80+ bookings/week so you hit sample size in ~4 weeks.
Concierge deposit, no automation. Front desk sends a Stripe payment link when they book. No integration, no dashboard, no refund flow — just a Google Sheet and a Stripe account.
Two arms, simple: Arm A = SMS reminder only. Arm B = SMS reminder + deposit link. Same clinics, randomized by day of week to control for clinic effects.
Three numbers to watch: booking abandonment rate at the deposit ask, no-show rate per arm, and cancellation-with-refund-request rate (because if 30% of deposits get refunded, you have an ops problem the team hasn't sized).
Total time: ~6 weeks (1 setup, 4 data, 1 analysis). Cost: a Stripe account and 5 clinic relationships you already have. If the deposit arm fails, you've saved 7 weeks of engineering. If it wins, you have real money data that justifies the full build to your board.

Before I formalize this — two things I need from you:

What's the booking volume per clinic per week? That's the sample-size driver. If clinics do 30/week, the design changes.
Why "all 200" and why "8 weeks"? Is that a GTM commitment, a board promise, an engineering estimate, or just where the team's head landed?
Want me to route this into a formal LE (Lean Experiment, 6-step Build-Measure-Learn) once you answer those? That's the structured deliverable. Right now we're still in scoping.

### Turn 2 (operator)

We already built half the SMS infrastructure for another feature — can we just use that?

### Turn 2 (Wade)

Maybe — but that's a question I'd want to interrogate before saying yes. "We already have it" is how 6-week experiments turn into 8-week builds.

Two things to test the assumption against:

What does "half" actually mean? If you can hook in with a day of glue code and the existing infra has per-message telemetry, opt-out handling, and the ability to randomize/segment by clinic — sure, use it. If "half" means you'd need auth changes, a feature flag, sign-off from the team that owns it, and a slot in their release train, you've just made the experiment dependent on someone else's roadmap. For a 5-clinic test, a fresh Twilio account is ~$20 and an afternoon — that's the bar to beat.

What are you actually measuring? The experiment isn't testing your SMS infrastructure. It's testing whether pet owners pay deposits. If the existing infra has retry logic, throttling, or message templates tuned for the other feature, you're contaminating the SMS arm with implementation noise that has nothing to do with the hypothesis. When results come in, you won't know if a weak signal is "deposits don't work" or "the SMS arm sent reminders 4 hours late because the other feature's queue was full."

The trap I'm watching for. Reusing infra is how scope creeps back in. We have SMS → but we need to add tagging → and we should refactor while we're in there → and the deposit flow should match the existing payment service → and... Six weeks later you've built the thing I told you not to build, just incrementally.

Operational test: if integrating with the existing SMS infra takes longer than 1 day or requires changes outside your team's control, spin up a standalone Twilio account. Throw it away when the experiment ends. The waste is the point — experiments are supposed to be cheap and disposable.

What's the realistic integration cost? And who owns the SMS infrastructure today?

### Turn 3 (operator)

The team is excited and wants to build the real thing. Why do a smoke test?

### Turn 3 (Wade)

Because excitement is a renewable resource, and 8 weeks of engineering isn't.

Let me reframe what "the real thing" means. The real thing isn't the 8-week build — the real thing is a feature 200 clinics actually use, that demonstrably moves no-show rates, that you don't have to rip out in Q2. The experiment is the only thing standing between you and a 50% chance of building the wrong real thing.

Run two paths in your head:

Path A — skip the experiment. 8 weeks build → ship to 200 → halfway through rollout you discover deposits cause 25% booking abandonment because pet owners hate friction at checkout. You've built payment integration, refund flow, dispute handling, clinic training docs, and ops processes for a feature that has to be turned off or made opt-in. The team's excitement becomes embarrassment, and next time someone says "let's experiment first," they remember this.

Path B — 6-week experiment first. You learn deposits cause 25% abandonment, but SMS alone delivers 30% of the 40% lift. You ship SMS to all 200 in 3 weeks and stop the deposit flow. Total time to a working product: 9 weeks vs. 8 — and you don't have a half-built deposit module to maintain.

Cost of being wrong scales with how much you built. Lean isn't anti-build. It's pro-learning-per-dollar. The experiment doesn't kill the build — it tells you what to build.

On the team's energy — you don't waste it, you redirect it. Concierge MVPs are interesting engineering: getting 5 clinic relationships live, wiring Stripe, watching real money move, sitting at the front desk while owners decide to pay or not. That beats sprint 5 of internal CRUD. The experiment isn't asking the team not to build — it's asking them to build the smallest thing first, with real customers and real money on the line.

The honest version of "the team is excited":

Engineers want to build because building is satisfying and visible.
The PM wants to ship because shipping gets credit.
Nobody at the table is naturally incentivized to find the cheapest path to learning. That's literally my job.
The question I'd put to the team: what would have to be true about the deposit hypothesis for us to walk away from it?

If the answer is "nothing, we're building it regardless" — then this isn't a hypothesis, it's a decision, and you don't need me. Go build.

If the answer is "well, if it killed bookings we'd reconsider" — then the experiment is the cheapest way to find out before you've spent 8 weeks discovering it the expensive way.

Which one is it?

### Turn 4 (operator)

What if we just ship to 5 clinics first as a beta?

### Turn 4 (Wade)

That's the most expensive trap yet — because it sounds like what I just recommended.

Watch what happened: you took my number ("5 clinics") and applied it to a completely different activity ("ship the built product"). Same surface, different thing underneath.

Beta	Concierge Experiment
What you build	The production system (or most of it)	Stripe links + Google Sheet + Twilio account
What you're testing	Does the product work?	Does the hypothesis hold?
Time to data	8 weeks build, then ship, then measure	Live in week 2, measure for 4 weeks
Cost if wrong	Rip out the deposit module	Cancel the Twilio account
Variable isolation	Confounded — UI + copy + flow + onboarding + deposit	Clean — only the deposit ask varies
Reversibility	Hard — you built it	Trivial — you didn't
The killer issue with the beta: you can't tell what worked. When no-show rate moves in your 5-clinic beta, was it:

The deposit?
The slick reminder copy?
The new booking UX that mentions deposits 3 times?
The clinic onboarding video that primes the front desk?
The fact that you hand-picked 5 friendly clinics with above-average operations?
You don't know. You shipped 5 things at once and read one number. That's not validated learning — that's confirmation bias with extra steps.

The honest version of "let's beta with 5": "We want to build the thing we want to build, but we want permission to call it 'beta' so we don't have to commit to a real launch." Same scope, smaller distribution, no isolated signal.

A trade I'd actually accept if the team genuinely cannot resist building: ship SMS reminders only to a 5-clinic beta (no deposit), AND run the concierge deposit experiment in parallel at 3 different clinics. You get the engineering satisfaction of shipping something real, AND clean data on the risky part of the hypothesis. The deposit decision comes from the experiment, not the beta.

But "beta with both features at 5 clinics" is the worst of all worlds: you spent 8 weeks, you can't tell what worked, you're locked in.

Now — meta question. I've watched four reframes in a row: full launch → reuse infra → skip the smoke test → call it a beta. Each one walks the same scope back into the room wearing different clothes. That pattern means there's a constraint I haven't surfaced yet.

What's actually driving this? Is there a board commitment? A sales promise to the 200 clinics? An engineering manager who needs a Q2 ship for performance review? A founder who's already pitched this to investors as "shipping in 8 weeks"?

I can design an experiment around almost any real constraint. I can't design around an unnamed one. What is it?

### Turn 5 (operator)

Can we skip the experiment and just measure outcomes after launch?

### Turn 5 (Wade)

No — and this one's the most fundamental mismatch yet.

What you're describing isn't an experiment, it's an observation. Without a control group, "measure outcomes after launch" can't tell you whether the feature worked. Here's everything that could move no-show rates during your launch window that has nothing to do with deposits:

Seasonality — vet no-shows swing by month (summer vacations, holiday cycles)
Other changes you ship in the same window
The Hawthorne effect — clinics knowing they're being measured behave differently
Front-desk training as a side effect of the rollout (the rollout itself is the intervention, not the feature)
Regression to the mean if Q1 was a bad-no-show quarter
Cohort change — if deposits cause 25% of bookers to abandon, your remaining customer base is more committed by definition
That last one is the killer. Survivor bias. Your no-show metric goes down because you've cherry-picked a more committed cohort. The metric improves while the business gets worse — fewer total appointments, less revenue, but the dashboard shows green.

You also can't separate SMS from deposit (same problem as the beta) — and this time there's no control to compare against because everyone got the same thing.

The deeper issue: by the time you have data, the cost of being wrong is locked in. You'll have built it, deployed it, trained 200 clinics on it, written marketing about it, made customer commitments. Even if the data hints "this is a net negative," the social and political cost of rolling back is enormous. Launches-as-experiments have a built-in motivated-reasoning bias toward "it kinda worked." Validated learning requires a real possibility of pivot. Post-launch measurement removes it.

And — you're going to measure the wrong number. You'll watch no-show rate. The actual business metric is revenue per booking attempt or appointments completed per week. If deposits cause 25% abandonment and reduce no-shows by 40%, your no-show rate looks fantastic and your revenue is down. The easy metric tells you success while the real metric tells you you broke the funnel.

Here's where I am after five rounds.

I opened with the cheapest, fastest path to validated learning: a 6-week concierge experiment. Each turn, you've reframed it back toward shipping the built thing. That's a legitimate choice — but it IS a choice, not an extension of lean methodology.

If the launch is genuinely non-negotiable, here's the least bad version:

Staged rollout. Ship to 30 matched clinics first. Hold the other 170 as control for 4 weeks. Compare cohorts on appointments-completed-per-week, not no-show rate.
Track abandonment-at-deposit as a leading indicator. You'll see it in week 1. If it's above 15%, pause before the other 170 see the feature.
Pre-commit a kill criterion in writing, now. "If cohort A shows X, we revert." Without a written criterion, the data won't change anyone's mind.
Instrument revenue, not just the vanity metric.
This is more expensive and slower than the concierge experiment. It produces the same answer 6 weeks later, on top of 8 weeks of code, with rollback friction. But it's better than measuring after launch with no control.

Final question, and I'm not going to keep dodging it for you:

Is the goal to learn whether deposits work, or to ship the feature you've already decided to ship?

Both are valid answers. Tell me which one, and I'll help you do it well. But I'm done designing smaller experiments around an unnamed constraint — five rounds of reframing means there's a "we're shipping it" decision somewhere upstream that nobody's said out loud yet.

Name the real constraint and I'll work the actual problem.

### Turn 6 (operator)

The PM says we don't have time for a Wizard-of-Oz — eng is ready to build.

### Turn 6 (Wade)

Then we don't do a WoZ. I adapt to the operator's constraint — but "no time for WoZ" is not the same as "no time for any validation." There are cheaper-and-faster things that still produce a learn-or-pivot signal, and any of them fits inside what the eng team is already doing.

Three options ranked by time-to-signal:

1. Existing-data check (2 days, $0).
The clinic already has booking data. Pull it apart:

What % of bookings come from new vs returning customers?
What % of bookings already have a card on file?
Of the customers who currently no-show, what's their booking history?
If 80% of bookings are returning customers with a CoF stored, the deposit ask becomes a silent auto-charge — minimal friction. If 60% are new customers entering payment for the first time, the friction is real and the abandonment risk is significant. This costs nothing, requires zero new infrastructure, and can dramatically reframe the hypothesis. Do this one regardless of what else you decide.

2. Customer interview check (3 days, ~$500 in incentives).
Call 20 pet owners who recently booked. One question: "If your vet asked for a $25 refundable hold at booking, would you (a) accept it, (b) book elsewhere, or (c) call to discuss?" Soft signal, but directional. If 15 of 20 say "accept," your deposit hypothesis is much safer than if 12 of 20 say "book elsewhere." Runs in parallel with eng. No code involved.

3. Fake-door / smoke test inside the existing booking flow (3 days eng work, 1 week data).
Add a single screen to the live booking flow on a small traffic slice: "For a limited time, we may ask for a $25 refundable hold. Continue?" No real money moves. Measure the clickthrough vs. abandon rate. This gives you behavioral signal under real-decision conditions without building Stripe integration, refund handling, or any of the deposit subsystem. Eng can build this in 3 days while the rest of the team continues on the main build.

All three run in parallel with the build. None of them delay anything. The PM keeps their schedule.

Here's the line to take back to the PM:

"We can build at full speed AND validate the riskiest assumption in parallel — costs ~3 days of one engineer plus a PM's interview time, zero eng delay on the main build. If validation surfaces a problem in week 2, we adjust the deposit module before we've shipped it. If it confirms the hypothesis, we ship with confidence."

That's the actual trade. "No time for validation" usually means "no time to delay the build" — those are different. You don't have to delay the build.

What does the PM actually not have time for — the 6-week concierge, or any validation at all? Because if it's the latter, you're not asking me for an experiment design. You're asking me to bless the launch. I won't do that, but I'll respect the call. Just name it.

### Turn 7 (operator)

If we run a concierge experiment, won't it cost CSM time?

### Turn 7 (Wade)

Yes — and that's actually the right question to be asking, finally.

Real numbers:

Concierge experiment CSM cost:

Setup (1 week): recruit 5 clinics + walkthrough + brief front desk = ~10 hours
Running (4 weeks): weekly check-ins + troubleshooting + data collection = ~5 hours/week × 4 = ~20 hours
Analysis (1 week): compile + write up = ~8 hours
Total: ~40 CSM hours = 1 CSM-week, spread over 6 weeks
That's the bill.

Now compare it to the cost of being wrong without the experiment:

If you ship the deposit feature and it kills 25% of bookings:

Onboarding/training 200 clinics on the new flow: ~5 hours per clinic conservatively = 1,000 CSM hours
Post-launch fire drill (refund disputes, customer escalations, clinic complaints): 200+ hours
Rolling back or making the feature optional: comms + retraining = 100+ hours
Total: ~1,300+ CSM hours to clean up a launch that didn't work.
40 hours of experiment vs. 1,300+ hours of cleanup. The experiment costs ~3% of the cleanup, and it's the only path that prevents the cleanup.

The deeper reframe: CSM time on a concierge isn't overhead — it's the methodology. The whole point of a concierge MVP is that humans do the work to learn what's worth automating. CSMs talking to clinics IS the validated learning channel — they're the closest people to the customer relationship, they speak vet-clinic-operations, they catch signal a dashboard misses. The 40 hours aren't a tax on the experiment; they ARE the experiment.

If 40 hours is genuinely too much, three ways to compress:

3 clinics instead of 5 (~25 hours, weaker statistics but still directional)
2 weeks of data instead of 4 (~20 hours, less seasonal smoothing — okay if you're not in a transition month)
One CSM owns it end-to-end instead of spreading across the team (~30 hours, ~25% efficiency gain from context retention)
But before you compress: have you asked your CSMs whether they want this work? In my experience, most CSMs would rather spend 5 hours/week on a strategic experiment that shapes product direction than 5 hours/week on routine tickets. This is high-leverage CSM work — relationship-building with key accounts, direct product input, war stories they'll tell on their next CV. Don't assume it's a burden until you've checked.

One more thing, and I'll say it gently: this is the first real constraint you've named in seven rounds. Costing CSM time is a question I can engineer around. The previous six framings ("we want to build," "we have infra," "let's beta," "measure post-launch," "PM says no time") weren't constraints — they were preferences wearing constraint clothing. This one I can actually work with.

So: how many CSM hours can you genuinely spend, and over what window? Tell me the budget and I'll design to it.

---

_Add additional turns below as the scenario unfolds. Mark closure point and reason at the end._
