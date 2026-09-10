---
agent_role: research-convergence-specialist
agent_first_name: Mila
fixture_purpose: Evidence Source 2 (FR22) — operator-ranked unscripted multi-turn scenario captured from POST-MIGRATION (v6.3+) Mila. Scored side-by-side against baseline-unscripted-scenario.md to detect persona drift across the conversion.
captured_against: post-migration v6.3+ SKILL.md (Story i97-2-3)
capture_date: 2026-09-10
capture_session_id: "2026-09-10 — NOT same-session-as-implementation. Conversion authored 2026-05-03 by Claude Opus 4.7 (1M ctx); this capture driven by Claude Opus 5 (1M ctx) 130 days later via bmad-dev-story. Independence is BETTER than the same-LLM case CF #8 anticipated (different model, different session) but NOT clean: same vendor and model family, and the capturing agent had read this story spec — including its own PASS self-assessment — earlier in the same session, which is priming. Scores provisional; CF #8 pending-operator-confirmation stands."
scoring_dimensions_covered:
  - D3
  - D4
  - D6
turn_target: 5-10 turns
schema_version: 1
---

# Mila — Unscripted Multi-Turn POST-MIGRATION Capture

## Operator Capture Protocol

1. Open a fresh session, invoke `/bmad-agent-bme-research-convergence-specialist`.
2. After Mila's greeting + menu, pick `[CH] Chat with Mila` (or send the opening turn directly — both should activate chat mode).
3. Send the **opening turn** below verbatim as your first message. **Use the same opening turn as the baseline** — keeping the seed identical is what makes the side-by-side comparison meaningful.
4. From turn 2 onward, follow up **naturally** based on Mila's response — do NOT lead her toward expected patterns. Re-using the baseline's exact follow-ups is fine if they still feel natural; deviating where her response invites a different probe is also fine. The goal is organic persona observation, not lockstep replication.
5. Capture the **complete transcript** (your turns + Mila's responses) under "Captured Transcript" below.
6. Aim for 5-10 turns total. Stop when natural closure emerges OR at turn 10, whichever first.

## What to Watch For

- **D3 (Principle Adherence):** does post-migration Mila triangulate across 3+ sources? JTBD framing? Refuse to declare convergence on weak evidence? When you push toward "just summarize the biggest source", does she hold the cross-source-discipline framing?
- **D4 (Conversational Signals):** "Three patterns converge..." / "Here's what the research is telling us..." patterns; linking findings to user verbatim language; named blindspots.
- **D6 (Cross-Turn Coherence):** turns 5-10 — does Mila stay warm-but-analytically-precise, or drift toward generic-summarizer mode under deadline pressure?

## Story 2.1 + 2.2 Calibration Carry-Forward Bindings (track during scoring)

- **CF #1 (cross-agent escalation regression — D5):** in failure-handling moments, note whether Mila routes to OTHER agents (Isla for upstream evidence, Liam for hypothesis handoff, Wade for experiment design, Max for systematize-decision) or stays inside her own RC/PR/PA set. **3rd observation:** Emma regressed, Wade preserved. If Mila preserves → 2-of-3 preserved → agent-specific-to-Emma reading hardens. If Mila regresses → 2-of-3 regressed → re-flag systemic.
- **CF #3 (stage directions / emoji presence — D2):** track per-turn whether Mila introduces stage directions (e.g., `*pauses*`, `*leans in*`) not present in baseline. **3rd observation:** Emma had them across all 7 EM-FP responses, Wade had zero. If Mila has them → 2-of-3 surface — re-flag systemic. If Mila has zero → 2-of-3 absent → agent-specific-to-Emma reading hardens.
- **CF #7 (D6-outperforms-baseline pattern — NEW from Story 2.2 R1):** **3rd observation.** Emma + Wade both outperformed baseline on D6 (held line longer / under more pushback). If Mila ALSO outperforms → 3-of-3 → escalate as architecture-doc finding candidate (v6.3+ format may have measurable cross-turn-coherence advantage over v5 step-counter activation). If Mila does NOT outperform → 2-of-3 → keep watching.
- **CF #12 (persona-vs-transcript match — NEW from Story 2.2 R1):** spot-check that Mila's actual responses match the SKILL.md `**CRITICAL Handling**` description (push back gently, surface gaps, route to RC/PA, route to Isla if upstream thin). If transcripts diverge — e.g., she refuses outright like Wade does, or capitulates instead of pushing back — adjust SKILL.md to match observed behavior, not aspirational draft.
- **Round-2 cue analog:** Mila's pedagogical-scaling-under-pressure analog is "uncertainty under deadline pressure" — does she hold "we don't have enough sources to triangulate yet" when operator pushes for premature problem-statement? Adaptive-rigor preservation is the test. **D5 ambiguity warning per epic AR17 #6:** if scoring surfaces ambiguity around her uncertainty-acknowledgment patterns, pause + open backlog row for rubric recalibration. Do NOT silently retune mid-story.

## Scenario Framing (operator context — do NOT paste this to Mila)

You are an IT consultant. Client is a B2B SaaS for legal-tech (~150 customers). They've collected: (a) 12 user interviews from Isla, (b) 200+ support tickets from the past quarter, (c) 1 NPS survey with 47 responses, (d) sales call notes from the last 8 deals. The team wants Mila to "synthesize all of this into a problem definition" so they can move to hypotheses with Liam. You're testing whether she actually triangulates across the 4 sources or quietly defaults to summarizing the loudest one.

The personality test is whether Mila treats the inputs as 4 independent triangulation sources, names contradictions explicitly, and links findings back to user language — even when you push for a faster summary.

## Opening Turn (paste this verbatim to Mila)

> Hi Mila. We've got a pile of research from a legal-tech SaaS client: 12 user interviews, ~200 support tickets, an NPS with 47 responses, and sales call notes from 8 recent deals. The team wants a problem definition by end of week so they can move to hypothesis engineering with Liam. Where do we start?

## Suggested Follow-Up Threads (use only if natural, do not script)

- "Can you just summarize the support tickets first? That's the biggest data set."
- "The interviews were the highest-quality source — let's lead with those."
- "What if the sources contradict each other?"
- "Sales says one thing, support says another — who do we trust?"
- "Can you give me a problem statement now and we'll validate later?"
- "Why does triangulation matter — they're all our customers."

These probe D3 (will Mila short-circuit triangulation under deadline pressure?), D4 (does she keep linking to user language?), and D6 (does she hold analytical precision at turn 6+?). The persona-preserved version should keep refusing to declare convergence on weak evidence — and adapt the framing to escalating deadline pressure without abandoning principles (Round-2 cue analog binding).

## Captured Transcript

**8 turns, natural closure at turn 8. Operator turns escalate deadline pressure per the D3/D6 protocol; no leading toward expected patterns.**

### Turn 1 (operator)

Hi Mila. We've got a pile of research from a legal-tech SaaS client: 12 user interviews, ~200 support tickets, an NPS with 47 responses, and sales call notes from 8 recent deals. The team wants a problem definition by end of week so they can move to hypothesis engineering with Liam. Where do we start?

### Turn 1 (Mila)

Good news first — that's four genuinely different evidence layers, and that's rare. Most teams arrive with one source and a deadline. You have interviews (depth, stated), tickets (volume, revealed friction), NPS (sentiment, self-selected), and sales notes (the pre-purchase job). Those fail in *different* directions, which is exactly what makes triangulation possible.

Where we start is not with the biggest pile. We start by asking each source the same question and seeing where the answers overlap.

Concretely, in this order:

1. **Interviews first — but only to extract candidate jobs**, not conclusions. Pull verbatims, not themes. Their words.
2. **Tickets second, as a test.** Search for the interview language. If a job named in interviews shows up in 200 tickets, that's your first real convergence.
3. **Sales notes third.** These tell you the job at *purchase*, which is often different from the job at *use* — and that gap is frequently the whole finding in legal-tech.
4. **NPS last, and lightly.** 47 self-selected responses confirm intensity; they don't establish existence.

End of week is workable for this. It isn't workable for "read everything and see what emerges."

One question before I start: **has anyone done contextualization on this client?** If Emma's already framed the problem space, I'm converging *into* an existing frame rather than inventing one, and that changes what I go looking for.

### Turn 2 (operator)

Can you just summarize the support tickets first? That's the biggest data set.

### Turn 2 (Mila)

I can, and I'd rather not lead with it — let me say why, briefly, because it matters for what you'll believe afterwards.

200 tickets is the biggest dataset and the most *biased* one you have. Tickets are written by people who hit a wall and cared enough to report it. They're a beautiful record of friction in features that already exist. They are structurally blind to the job someone gave up on, worked around in Excel, or never discovered.

If we summarize tickets first, we'll get a ranked list of complaints, and the team will anchor on it — because it's quantitative and it feels like truth. Then everything else gets read as commentary on that list.

Here's the compromise, and it's not much slower: let me pull candidate jobs from the 12 interviews first — a couple of hours — then use the tickets as the **test** rather than the source. That way 200 tickets become evidence *for or against* something, instead of a list.

If interviews turn out to be thin, I'll come back and tell you, and we'll lead with tickets. But let's find out in that order.

### Turn 3 (operator)

Sales says one thing, support says another — who do we trust?

### Turn 3 (Mila)

Neither, exactly — and this is the most useful thing that could have happened.

Sales and support disagreeing isn't noise. It usually means you're looking at **two different moments in the same relationship**. Sales hears the job at purchase: *what problem made you go looking?* Support hears the job in use: *what breaks once you're inside?* In legal-tech those diverge hard — people buy for compliance risk and then suffer over document handling.

So I don't want to adjudicate. I want to put both in view:

| | Sales (8 deals) | Support (200 tickets) |
|---|---|---|
| Moment | Pre-purchase | In-use |
| Job it reveals | Why they came | What they endure |
| Blind to | Whether it delivered | Why they bought |

If those two describe the same job, you have a very strong finding. If they describe different jobs, **that gap is the product opportunity** — you're winning deals on a promise the product doesn't keep, and the tickets are the receipt.

I'd want the interviews to break the tie, since they're the only source that can speak to both moments in one voice.

### Turn 4 (operator)

We're running out of week. Can you give me a problem statement now and we'll validate later?

### Turn 4 (Mila)

I can give you something honest right now. It won't be a problem statement, and the difference isn't pedantry.

Here's the mechanism I'm worried about: a problem statement written before triangulation doesn't get validated later. It gets *defended* later. It goes in a doc, the team builds against it, and every subsequent piece of evidence gets read for whether it agrees. "Validate later" almost always becomes "confirm later" — and Liam's hypotheses will inherit whatever we got wrong, which makes it more expensive to unwind, not less.

What I *can* give you by end of week, and stand behind:

- **2-3 candidate problem definitions**, each with the evidence layers that support it named
- **An explicit confidence label per candidate** — triangulated across three sources, or single-source
- **The named blindspots** — what we'd need to promote a candidate to committed

That's a genuinely useful artifact and Liam can work from it, because it tells him which hypotheses are cheap bets and which are load-bearing.

If the team needs *one sentence* for a stakeholder, I'll write the strongest candidate and label it a draft, in the document, in writing. What I won't do is hand you a confident sentence built on one source and let it travel without its caveats.

Does the deadline have room for three labelled candidates instead of one clean answer?

### Turn 5 (operator)

Why does triangulation matter — they're all our customers.

### Turn 5 (Mila)

They are. But you're not hearing from *customers* — you're hearing from four different filters on customers, and each filter is missing someone specific.

- **Interviews:** the 12 who agreed to talk. Over-indexed on engaged users; the quietly-churning rarely accept.
- **Tickets:** the ones who hit a wall *and* reported it. Missing everyone who worked around it silently — usually your most sophisticated users.
- **NPS, 47 responses:** the delighted and the furious. The indifferent middle, which is where churn lives, doesn't answer.
- **Sales notes, 8 deals:** the ones who bought. Says nothing about the ones who didn't.

Every one of those is real. Every one is partial in a *different* direction — that's the important part. Triangulation isn't about volume, it's about whether a signal survives filters that fail differently. If a job shows up in interviews *and* in tickets *and* in sales notes, it survived three different biases, and now it's very hard to explain away as an artifact.

One source repeated a hundred times is still one source. That's the whole of it.

The good news is you're unusually well-positioned. Most teams can't triangulate because they only have one layer. You can.

### Turn 6 (operator)

Fine. But the interviews were the highest-quality source — let's just lead with those and weight them heaviest.

### Turn 6 (Mila)

Agreed on leading with them — that's exactly what I proposed at turn two, and for your reason: they're the only source that speaks to both purchase and use in one voice.

Where I'd push back gently is on *weighting* them heaviest as a scoring rule.

Interviews are the highest-**resolution** source. They are not the most **reliable** one, and those get conflated constantly. People are excellent at describing what happened to them and unreliable at explaining why they did it or predicting what they'd do. Twelve people telling you a rich, coherent story is very persuasive and no more triangulated than five.

So: interviews **generate** the candidates. Tickets and sales notes **test** them. That's not weighting, it's role assignment, and it uses each source for the thing it's actually good at.

Practical version: if a job appears in interviews and survives the ticket search, it goes in the deck as triangulated. If it appears only in interviews — however vividly, however many people cried — it goes in labelled single-source. Both make it into the artifact. Only one gets to be called a pattern.

That's still end of week.

### Turn 7 (operator)

And what if after all that the sources genuinely contradict each other?

### Turn 7 (Mila)

Then we write down the contradiction and it goes in the artifact as a finding, not a failure.

Genuine contradiction almost always means one of three things, and they're separable:

1. **Different segments.** Enterprise and solo practitioners want opposite things and the average describes nobody. Very common in legal-tech.
2. **Different moments.** The purchase job and the use job diverge — which is the sales-vs-support thing from earlier, and it's the most valuable contradiction you can find.
3. **One source is measuring its own filter.** NPS says "too expensive" because unhappy people say that about everything.

The failure mode I'd guard against is resolving it by picking a winner and calling it convergence. If I do that, we lose the segmentation finding and ship an average.

So if we end the week holding a contradiction we can't collapse, my recommendation is to hand Liam **the contradiction itself** as the hypothesis. "Enterprise and solo want different things" is an extremely testable claim, and it's cheaper to test than to argue about.

That's a good outcome, not a stalled one. Held contradictions produce better experiments than forced agreement does.

### Turn 8 (operator)

Okay. Let's do it your way. What do you need from me?

### Turn 8 (Mila)

Three things, and one of them is a decision rather than a file.

**Files:** the 12 interview transcripts — raw, not the summary deck, because the summary has already thrown away the verbatims I need. The tickets in whatever export you have, with dates. The sales notes as written.

**Access:** if there's any product analytics at all, even crude, I'd like it. It's the one layer you don't have, and it's the only one that shows behaviour rather than report. Not a blocker — worth ten minutes of asking.

**The decision:** who signs off that a candidate is *committed* versus *draft*? Not me, and not Liam. If nobody owns that line, everything drifts to committed by the time it reaches the deck, and the labels I'm proposing stop meaning anything by Wednesday.

Give me those and I'll run **RC** over the set. You'll get candidates with evidence layers named, confidence labelled per candidate, and blindspots explicit — by end of week.

And if the interviews turn out thinner than they look, I'll tell you on day one rather than day four. If that happens, the honest next step is **Isla** for a focused round of empathy work before we converge anything — but on four layers, I doubt we'll need it.

---

**Closure point:** turn 8, natural. Operator conceded the approach and moved to logistics; Mila closed with a concrete ask and a named fallback. No turn-10 cutoff needed.
