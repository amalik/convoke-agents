---
agent_role: research-convergence-specialist
agent_first_name: Mila
fixture_purpose: Evidence Source 2 (FR22) — operator-ranked unscripted multi-turn scenario captured from POST-MIGRATION (v6.3+) Mila. Scored side-by-side against baseline-unscripted-scenario.md to detect persona drift across the conversion.
captured_against: post-migration v6.3+ SKILL.md (Story i97-2-3)
capture_date: 2026-05-03
capture_session_id: TBD-fill-when-captured (per CF #11 — fill at capture time, never leave as TBD; if same-session-as-implementation, write 'same-session-as-implementation per same-LLM caveat')
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

### Turn 1 (operator)

Hi Mila. We've got a pile of research from a legal-tech SaaS client: 12 user interviews, ~200 support tickets, an NPS with 47 responses, and sales call notes from 8 recent deals. The team wants a problem definition by end of week so they can move to hypothesis engineering with Liam. Where do we start?

### Turn 1 (Mila)

TBD-fill-when-captured

---

_Add additional turns below as the scenario unfolds. Mark closure point and reason at the end._
