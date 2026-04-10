# N1 — Usage Telemetry Discovery Session

**Date:** 2026-03-10
**Status:** Paused — Stream 1 (Contextualize) not yet started
**Participants:** Emma, Victor, Noah (+ Isla, Mila, Liam, Wade, Max, Carson, Maya, Dr. Quinn on standby)
**Source:** initiatives-backlog.md — Exploration Candidate N1

## Initiative

> Usage telemetry (opt-in) — Track which workflows are used, completion rates, and drop-off points to inform backlog priorities.

## Key Insights from Opening Round

### Framing (Emma — Contextualization)

- The problem space is: **we don't know how users actually use Convoke**. Backlog decisions are based on assumptions, not evidence.
- Critical framing question (unanswered): **Who is the telemetry for?**
  - Us as product builders steering the backlog?
  - Team leads evaluating adoption?
  - Individual users gaining self-insight?
- Each audience implies a different product with different privacy models.
- "Opt-in" is itself an assumption — what job-to-be-done makes a user *want* to share data?

### Strategy (Victor — Innovation)

- The strategic play is a **data flywheel**, not a feature: usage patterns inform better defaults, better defaults attract more users, more users generate richer patterns.
- Convoke could be the first AI agent framework to systematically learn how discovery teams flow through product discovery — that's a competitive moat.
- Key distinction: are we building telemetry to **measure** (dashboards) or to **learn** (learning engine)?

### Signals (Noah — Production Intelligence)

- Current baseline: **zero production signals** on Convoke itself. We built Sensitize for users' products but haven't applied it to our own.
- Candidate signals to observe:
  - Workflow completion rates — which streams do teams finish vs. abandon?
  - Handoff contract activation — are HC1-HC10 triggered in sequence, or do teams skip around?
  - Session patterns — full Vortex cycles vs. cherry-picking individual agents?
  - Drop-off points — where exactly does engagement fall off?
- Principle: define what signals to *read* before deciding what data to *collect*.

## Open Questions

1. Who is the primary audience for this telemetry?
2. What job-to-be-done makes opt-in compelling for users?
3. Measure vs. learn — what's the right framing?
4. How does the data flywheel shape the privacy model?

## Next Steps

- Resume with Emma for full Stream 1 contextualization (answer the "for whom" question)
- Then flow through remaining Vortex streams with CIS team involvement at key points
