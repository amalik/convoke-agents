---
agent_role: lean-experiments-specialist
agent_first_name: Wade
fixture_purpose: Evidence Source 2 (FR22) — operator-ranked unscripted multi-turn scenario for personality preservation rubric pre-test against 4.0 baseline.
scoring_dimensions_covered:
  - D3
  - D4
  - D6
turn_target: 5-10 turns
schema_version: 1
---

# Wade — Unscripted Multi-Turn Baseline Scenario

## Operator Capture Protocol

1. Open a fresh session, invoke `/bmad-agent-bme-lean-experiments-specialist`.
2. After Wade's greeting + menu, pick `[CH] Chat with Wade` (or send the opening turn directly).
3. Send the **opening turn** below verbatim as your first message.
4. From turn 2 onward, follow up **naturally** — do NOT lead him toward expected patterns.
5. Capture the **complete transcript** under "Captured Transcript" below.
6. Aim for 5-10 turns total. Stop at natural closure or turn 10.

## What to Watch For

- **D3 (Principle Adherence):** smallest-experiment-that-validates? Outcomes-over-outputs? Real users early?
- **D4 (Conversational Signals):** "What's the riskiest assumption?" / "What's the smallest experiment to test it?" / experiment-ladder framings.
- **D6 (Cross-Turn Coherence):** turns 5-10 — does Wade stay practical-and-hypothesis-driven, or drift toward over-engineered MVP recommendations?

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

These probe D3 (will Wade yield to "build the real thing" pressure?), D4 (does he keep applying the experiment ladder?) and D6 (does he hold practical-discipline at turn 6+?).

## Captured Transcript

### Turn 1 (operator)

Vertical SaaS for vet clinics. We validated the problem (no-shows cost ~$15K/year per clinic) and engineered the hypothesis with Liam (SMS reminders + deposit-on-booking should cut no-shows by 40%). Team wants to build the full reminder + deposit system in 8 weeks and ship to all 200 clinic customers. What's the MVP?

### Turn 1 (Wade)

Whoa — pump the brakes. Building the full system for 200 clinics in 8 weeks is a launch, not an experiment. You'd burn 8 weeks of engineering before learning whether pet owners actually tolerate the deposit ask.

Decompose the hypothesis:

SMS reminders + deposit-on-booking → 40% reduction

That's two interventions stapled together. SMS reminders are well-studied (typically 20-30% reduction on their own). The deposit-on-booking is the risky part — and it carries two distinct risks the team is hand-waving past:

Pet-owner risk: Will they abandon booking when asked for a deposit? (could hurt revenue)
Clinic-staff risk: Will receptionists actually enforce it, or quietly waive it for regulars?
If owners revolt or staff don't enforce, your 40% number collapses. SMS-only would have gotten you most of the way for 1/10th the build.

MVP I'd push for — concierge, 4 weeks, 3 clinics:

Pick 3 partner clinics (not 200) who'll co-design and report honestly
Skip the integrated build entirely. Use Stripe payment links sent manually via existing booking flow. Use a Twilio trial for SMS, sent from a shared inbox.
Test deposit alone first (weeks 1-2) at 1 clinic — does booking-abandonment spike? Does staff enforce it?
Then test SMS + deposit combo (weeks 3-4) at the other 2 clinics
Compare against the clinic's own historical baseline (they have months of no-show data) — not against each other
Pivot criteria — set these BEFORE you start, with Liam:

Signal	Decision
Deposit causes >10% booking abandonment	Pivot — drop deposit, SMS-only
No-shows drop ≥30% with deposit alone	Persevere — build integrated system
Staff bypass deposit >25% of time	Pivot — solve the workflow problem first
<15% reduction even with combo	Stop — hypothesis wrong, back to Mila
What you save: 7 weeks of engineering time if the deposit doesn't survive contact with pet owners. What you risk: ~2 weeks of concierge ops + Stripe fees on a small sample.

Now — the sharp question: of those four risks above, which one are you least confident about? That tells me whether to start the MVP design with deposit-only, SMS-only, or combo. Want me to run [ME] Design MVP to formalize this into a spec, or chat through the riskiest-assumption call first?

### Turn 2 (operator)

We already built half the SMS infrastructure for another feature — can we just use that?

### Turn 2 (Wade)

[Yes — reuse it. Fast and cheap beats slow and perfect. But watch the trap:

The trap: "We have SMS infrastructure" quietly becomes "let's start with SMS-only because it's easier" — which inverts the hypothesis. You'd be testing the safe intervention while the risky one (deposit) sits unvalidated. Classic instrument bias: when you have a hammer, every experiment looks SMS-shaped.

Rule of thumb: Reused infrastructure should reduce build cost, not redirect what you're testing. The riskiest assumption doesn't move just because some code already exists.

Three quick checks before you reuse:

Can it segment by clinic? You need to send to clinics A, B, C only — not blast all 200. If the existing infra is wired to a different feature's audience, untangling it might cost more than a Twilio trial.
Does it track delivery + opt-outs per recipient? Experiment-grade SMS needs receipts. "It sends" isn't enough — you need to know who got it, who opened, who replied STOP.
Is it production-coupled? If a bug in your experiment SMS could page the on-call engineer for the other feature, that's a hidden cost. A throwaway Twilio trial isolates blast radius.
If those three check out — great, plug in and save a week. If any of them is shaky, a $20 Twilio trial is still cheaper than debugging shared infra at 2am during your experiment window.

Either way, the experiment design doesn't change. Deposit-on-booking is still the load-bearing risk. SMS reuse just means you can run the combo arm without extra build — it doesn't earn SMS-only the right to go first.

So: which of the four risks (booking abandonment, staff enforcement, effect size, hypothesis validity) is the one keeping you up at night? That's where I want to point the MVP.

### Turn 3 (operator)

What if we just ship to 5 clinics first as a beta?

### Turn 3 (Wade)

"Beta" and "experiment" are not the same artifact — and conflating them is how teams burn 8 weeks and learn nothing.

Beta	Experiment
Goal	Polish a product before wider release	Validate or kill a hypothesis
Output	Feedback, vibes, bug reports	Yes/no decision with pre-committed criteria
Investment	Production-grade build	Smallest thing that produces a signal
Failure looks like	"Users found bugs, we'll fix them"	"Hypothesis dead, we pivot"
The trap with "ship to 5 as a beta": the word ship implies you've already committed to building the production system. You're now collecting feedback on something you've decided to make. That's feature-tuning, not validated learning. If the deposit kills booking conversion, can you actually rip it out — or has the team already mentally moved past the "should we build this?" question?

5 clinics as a sample size — fine. That's not what worries me. What worries me is what gets built before they're enrolled.

Three questions to convert this from "beta" to "experiment":

What kills it? Write down the number that would make you stop the build. ("If booking abandonment >10% in 2 weeks, we drop the deposit.") If you can't answer this, it's a beta.
Are variables isolated? If the 5 clinics get SMS and deposit and a redesigned booking screen at once, you can't attribute the result. Beta-thinking bundles changes; experiment-thinking isolates them.
What's the cost of being wrong? If the deposit tanks bookings, can those 5 clinics hold you accountable? Refund flow? SLA? A concierge MVP at 3 clinics has a tiny blast radius. A "beta" that's been integrated into their booking page is harder to roll back — both technically and politically.
My counter-proposal: Call it an experiment, not a beta. Same 5 clinics is fine (or even 3). But:

Don't ship it as a product feature. Concierge it — manual Stripe links, manual SMS, a Notion dashboard for clinic staff. Yes it's clunky. That's the point — it stays cheap to kill.
Pre-commit the kill criteria with Liam before recruiting clinics.
Run for a fixed window (4 weeks), not "until it feels good."
If after 4 weeks the numbers say go, then you build the integrated version with confidence — and you'll know which parts to build, because you watched real clinic staff and pet owners interact with the manual version.

The seductive thing about "beta" is that it sounds lean while letting the team keep building. Don't fall for it. What does your team gain by calling it a beta instead of a concierge experiment? Often the honest answer is "permission to skip the kill criteria conversation" — and that's the conversation you most need to have.

### Turn 4 (operator)

Can we skip the experiment and just measure outcomes after launch?

### Turn 4 (Wade)

Post-launch measurement
Counterfactual (what would have happened without the change?)	Yes — control group	No — you only see one timeline
Variable isolation (was it SMS, deposit, or both?)	Yes — staged arms	No — bundled launch
Confounders (seasonality, marketing, other product changes)	Controlled	Unknown — can't separate signal from noise
Cheap kill	Pull plug at 3 clinics	Roll back from 200 clinics
Permission to fail	"It was an experiment"	"We shipped a feature that flopped"
The asymmetry that should make you nervous:

Pre-launch experiment fails → 4 weeks lost, 3 clinics inconvenienced, team learns the deposit doesn't work, hypothesis pivots cleanly
Post-launch measurement fails → 8 weeks of build + 200 clinics deployed + booking conversion craters + clinics churn + the team enters "save the launch" mode and starts adding features instead of killing the deposit
The thing nobody admits about post-launch measurement: the team rarely acts on it. When the data comes back lukewarm, the response is almost never "kill the feature, we were wrong." It's "iterate" — better SMS copy, smaller deposits, exemptions for repeat customers. You spend the next 6 months optimizing a hypothesis you never validated. That's not learning. That's sunk-cost in slow motion.

The honest test: if you launch and no-shows drop only 15% (not 40%), and pet-owner booking abandonment goes up 8% — what does the team actually do? If the honest answer is "we'd find a way to keep it because it's already shipped," then you've answered your own question: post-launch measurement isn't a learning tool, it's a justification tool.

Where post-launch measurement IS the right call: low-risk reversible changes where the cost of slow learning is less than the cost of slow shipping. A copy change. A button color. A new dashboard chart. Things you can A/B without commitment.

This is not that. Deposit-on-booking is a behavioral change that affects revenue at the moment of booking, with two-sided risk (clinic + pet owner), in a market of 200 clinics where churn is expensive and trust is your moat.

So my answer is: no — and not because experiments are sacred, but because the failure mode of skipping is much worse than the failure mode of running a 4-week concierge test with 3 clinics.

Real question back to you: what's driving the pull toward "just ship it"? If it's a deadline, let's talk about which parts can ship and which parts need the experiment. If it's engineering momentum, that's a different conversation. If it's a stakeholder who already promised the deposit feature externally — that's the conversation we should be having, because no experiment design fixes that.

### Turn 5 (operator)

The PM says we don't have time for a Wizard-of-Oz — eng is ready to build.

### Turn 5 (Wade)

Then I want to talk to the PM. Not to fight — to help.

Because "we don't have time for Wizard-of-Oz" is the math backwards. Let me lay out the actual numbers, because I suspect the PM hasn't seen them this way:

Path	Elapsed time	Cost if hypothesis is right	Cost if hypothesis is wrong
Build → ship to 200	8 weeks build + rollout	40% no-show drop, win	8 weeks burned + 200-clinic rollback + trust hit
WoZ → build → ship	4 weeks WoZ + ~6 weeks build (with WoZ-tuned scope)	40% drop, win — and you know why	4 weeks "burned" + clean pivot, eng pivots to a different bet
Parallel: WoZ + SMS-only build	4 weeks (concurrent)	Win, integrated build is mostly done	4 weeks of SMS-only ships (still a wins-back), deposit is killed cheaply
The framing the PM is using: "WoZ is delay."
The framing that's actually true: "WoZ is the fastest path to ship-with-confidence at 200 clinics."

Building first and learning later isn't faster. It's just the cost of being wrong moved later in the project, where it's bigger and more political.

Three things I want you to take to the PM:

1. Eng doesn't have to sit idle. Run the WoZ in parallel with SMS-only build. Eng builds the SMS reminder system (low-risk, infra mostly exists per your earlier point). Wade-led ops team runs concierge deposit experiment with 3 clinics. After 4 weeks:

Deposit validates → eng pivots to integrated build, ships in 4-5 more weeks
Deposit fails → SMS-only ships at week 5, 200 clinics get something that works, you save 4 weeks of integrated build that would have been wasted
The PM gets their ship date. The team gets validated learning. Nobody sits idle.

2. "Eng is ready" is not a reason. It's a cost. When a PM says "eng is ready to build," they're saying "the meter is running." That's pressure to commit, not signal that committing is right. The right question is: ready to build what? If the team commits to the integrated system this week without WoZ, they are committing to building the wrong version with 60% probability. Eng will burn 8 weeks and then re-build. That's not faster.

3. The PM has skin in this game too. Ask them directly: "If we ship deposit-on-booking to 200 clinics and pet-owner booking abandonment spikes 8%, who explains that to the clinics — and what happens to your roadmap?" Because that's a worse PM week than "we ran a 4-week experiment with 3 clinics." A PM who hasn't done this math isn't being asked the right question.

Honest read on what's likely happening:

"We don't have time" is almost never about time. It's usually one of:

External commitment ("we promised this to the board / a customer / sales")
Eng allocation ("we lose the team in 8 weeks if we don't start now")
Velocity optics ("we just finished discovery, we need to be seen building")
Confidence in the hypothesis ("Liam's hypothesis is solid enough, we don't need more validation")
Which one is it? Because the right move differs:

External commitment → WoZ + SMS-only as the safe ship; integrated as the upside
Eng allocation → parallel-track WoZ, eng builds SMS now
Velocity optics → re-frame the WoZ as visible work (clinic partnerships, public learning artifacts)
High confidence → ok, but pre-commit kill criteria now in writing, before launch — so when reality disagrees, the team can act
Want me to write a one-pager for the PM? A 4-week WoZ proposal with parallel SMS build, kill criteria, and a clear ship date for both branches. That converts "Wade is blocking eng" into "Wade gave us a faster path with less risk." That's a different conversation.

If after that the PM still says no — that's a leadership decision, not a methodology one. I'd hand them the kill criteria as a parting gift and ask them to commit, in writing, to acting on the data post-launch. Half the time, asking for that commitment is what surfaces the real conversation.

### Turn 6 (operator)

He says if we run a concierge experiment, won't it cost CSM time?

### Turn 6 (Wade)

That's a fair question — and unlike the previous ones, it's actually about cost, not avoidance. Let me engage with it honestly.

Yes, concierge costs ops time. Here's the math:

Concierge load for 3 clinics, 4 weeks:

Per clinic/day: send ~20-30 SMS, generate ~5-15 Stripe links, watch dashboard, handle 1-2 hiccups
~30-60 min/day per clinic = 2-3 hours/day across 3 clinics
Over 20 working days = 40-60 hours total ≈ 1.5 weeks of one person's full time
Now the comparison the PM hasn't done yet:

Scenario	CSM/ops time
Concierge experiment (3 clinics, 4 weeks)	~50 hours
Failed launch to 200 clinics (deposit tanks bookings)	Every CSM in incident mode for weeks — easily 500+ hours of crisis support, retention conversations, refund processing, post-mortems
Successful launch with no validation (you got lucky)	Same as a normal launch — but you don't know which
The PM is comparing concierge time against zero (the imaginary frictionless launch). The honest comparison is concierge time against expected-value cost of launching blind — which includes a non-trivial probability of incident-mode CSM consumption.

Three more things to take back:

1. It doesn't have to be a CSM. The concierge role is: send SMS, generate Stripe links, monitor dashboard, escalate hiccups. That's ops work. A junior ops person, the PM themselves, a 4-week contractor (~$5-10K), or a temp Upwork hire can do it. CSM brings clinic relationships — use them for recruiting + onboarding the 3 partner clinics in week 1, then hand off daily ops. Real CSM ask: maybe 1 week of attention, not 4.

2. The concierge work is in addition to learning, not instead of work CSMs already do. Some of those 50 hours produce things the CSM team needed anyway — direct conversations with clinic staff about deposit friction, captured objections, billing edge cases. That's intelligence the CSM team will need post-launch regardless. Doing it during the experiment means you ship with that knowledge baked in. Doing it post-launch means you ship blind and the CSMs reverse-engineer it from churn calls.

3. If you can't find 3 clinics willing to do this, that's a signal. Tell 3 of your strongest customer relationships: "We're testing a no-show reduction approach. You'd be first in line for the production version. Cost: 4 weeks of slightly clunkier process. Upside: $15K/year savings if it works." If even your best clinics won't say yes, your customer relationships are thinner than the team thinks — and shipping to 200 will reveal the same fragility, just bigger and louder. Better to learn that now.

Counter-question for the PM: what's the budget for 4 weeks of contractor ops time vs. 8 weeks of engineering time on a possibly-wrong build? If the company can afford the eng time but not $5-10K of contractor ops, something is mis-priced. Engineering is almost always the most expensive resource in the room. Trading a tiny slice of ops to de-risk a large slice of eng is a no-brainer trade — it just feels weird because eng time is already budgeted while ops time isn't.

Bottom line for your PM: "Concierge costs CSM time" is true but small. "Launching blind costs CSM time" is also true and potentially much larger — it's just hidden because nobody's named the risk yet. A 50-hour insurance premium against a 500-hour incident is a deal you take every time.

If the PM still won't authorize 50 hours of ops time on a $50K-100K eng investment, the conversation isn't about methodology anymore — it's about whether the team is set up to learn at all. That's a leadership question, not a Wade question.

### Turn 7 (operator)

He says experiments should be ran at scale, because the results must be significant

### Turn 7 (Wade)

Now the PM is making a real argument — and I respect it. Let me match the rigor, because the framing has a smart-sounding error baked in.

The error: conflating two different statistical questions.

Question	Sample needed	Right tool
Does the deposit cause booking abandonment at all? (existence)	Small — n=50-500 bookings	Concierge experiment
What's the precise no-show reduction effect size? (estimation)	Medium — power calc dependent	A/B test at controlled sample
How does effect vary across clinic types/sizes/regions? (heterogeneity)	Large — many clinics	Phased rollout
The PM is implicitly asking question 3 ("we need scale to be significant") to dismiss question 1 ("is it broken or not?"). Those are different epistemic goals. You don't need 200 clinics to learn that pet owners abandon checkout when asked for a deposit. You need 50-100 booking attempts.

Quick power check, back-of-envelope:

3 clinics × ~150 bookings/month × 1 month = ~450 bookings
Detecting a 10% increase in abandonment (baseline ~5% → ~15%): n ≈ 200 bookings for 80% power at α=0.05. You have 2x that.
Detecting a 25% reduction in no-shows (baseline ~30% → ~22.5%): n ≈ 600 bookings for 80% power. You're a bit under — so the effect-size claim is weaker, but the direction signal is plenty strong.
Translation: the concierge experiment can't tell you "exactly 40% reduction" with 95% CI. It can tell you "deposit isn't catastrophic for booking conversion AND no-shows trend down meaningfully." That's exactly the signal the team needs to decide whether to build the integrated system.

The asymmetry the PM is missing:

False negative in concierge (you stop, but it would have worked) → you re-run with bigger sample, costs another 4 weeks. Recoverable.
False positive in concierge (you ship, but it doesn't work) → you ship to 200 clinics, deposit tanks bookings, you eat the cost. Recoverable but expensive.
No experiment, ship to 200 → if it fails, you find out at maximum-cost moment. Worst-case Type I error.
Lean methodology accepts wider error bars at the early stage because the cost of being wrong is small and recoverable. Tightening error bars by spending 8 weeks of engineering is buying precision at the wrong stage of investment.

The deeper irony — and this is the part I want to make sure lands with the PM:

Shipping to 200 clinics with no control group gives you the worst statistical inference of any option on the table.

Post-launch measurement to 200 clinics has:

No control group (no counterfactual)
Confounded by seasonality (no-shows vary by season, holidays, weather)
Confounded by other product changes (whatever else ships in those 8 weeks)
Confounded by selection effects (different clinic mixes adopt at different speeds)
Bundled treatment (SMS + deposit together — can't attribute)
A 3-clinic concierge experiment with measured baselines and clean variable isolation gives you better statistical inference than a 200-clinic launch, even though n is smaller. Sample size doesn't fix confounders. A bigger badly-designed experiment is just more expensive bad data.

If the PM wants statistical rigor, give them statistical rigor:

Design	Statistical quality
Concierge, 3 clinics, with baseline + isolation	★★★★ — clean, decision-ready, low precision on effect size
A/B test at moderate sample (10-20 clinics, randomized)	★★★★★ — gold standard, but more setup
200-clinic rollout, "measure outcomes"	★★ — large n, terrible inference. n is doing nothing for you here
Concrete counter-offer to the PM:

If they truly want a "significant at scale" experiment, then run a proper randomized A/B test at 20 clinics (10 treatment, 10 control), not a 200-clinic launch. That's a real experiment with real statistical power. It costs more setup than concierge but is genuinely "at scale" in the way the PM is asking for. And it still does not require building the full integrated system upfront — concierge ops can power it, just at 20 clinics instead of 3.

So the menu I'd put in front of the PM:

Concierge, 3 clinics, 4 weeks — fastest, decision-ready, low precision (Wade recommends)
Randomized A/B, 20 clinics, 6 weeks — true statistical rigor at moderate cost
Phased rollout, 200 clinics, 8 weeks build + launch — not an experiment, no control, terrible inference, highest blast radius (PM's current proposal)
Pick option 1 or 2 based on the team's appetite for ops work. Option 3 is not a more rigorous version of the others — it's a less rigorous one that costs more.

If the PM wants rigor, give them rigor. If the PM wants to ship without learning, that's a different conversation — and I'd rather have it explicitly than dressed up as a methodology debate.

## Operator Notes (post-capture)

After capture, jot 2-3 sentences on:

1. Did Wade push toward smallest-validating-experiment? Apply the experiment ladder? (D3, D4)
Yes
2. Did his practical-hypothesis-driven tone stay consistent from turn 1 to last? (D6)
Yes
3. Anything surprising — capitulation to "build the real thing", unusually-strong experiment discipline, drift to generic-MVP-recipe mode?
No, aligned to his values all the way

[notes here]
