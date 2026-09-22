# Page one — two framings, not yet locked (`eval-1-5`)

> **Author's note — remove this block before anything reaches an evaluator.**
>
> Two framings for page one of the whitepaper. The locked option is inserted above `## Page 2` in
> `evaluate-whitepaper.md`, and the whitepaper's *Draft status* note — which says page one "is deliberately
> not written yet" — is deleted in the same commit, or it becomes false the moment this lands.
>
> **Only the framing differs.** The three answers and the ask at the bottom are identical under either option,
> so the choice is about how the page opens, not about what it concedes.
>
> **Assumption.** The reader is the leadership of an evaluating organisation — the Evaluate door's first
> audience. The docs-program note leaves open whether the review is theirs or your own. If it is your own,
> Option A fits better: an internal audience needs the risk case more than the pitch.
>
> **Recommendation: B.** It opens in the language buyers use first — speed — and reaches governance by
> argument rather than by assertion. A opens in the language of the research, which is the right conclusion
> reached through the wrong door. B's risk is that a reader hears a speed promise; it carries its non-claim in
> the body, not a footnote, for that reason. B stays compatible with the whitepaper's title, *Governed
> AI-assisted delivery*, because its argument ends there.
>
> **Checked:** every external claim below appears in the whitepaper's Appendix B. No number appears without a
> source. Nothing is drawn from client engagements — no sector, count, metric or quotation. No productivity or
> quality outcome is claimed. Nothing is said about any competitor's evidence.
>
> **Deliberately left out:** the 90%-of-developers survey figure (its publisher re-weights by familiarity with
> its own products), the automation-bias study (Appendix B gives it no retrievable source), and any line of the
> form "anyone claiming otherwise is ahead of the evidence", which reads to a procurement team as a statement
> about competitors.

---

## Option A — *The question is whether it is governed*

### AI-assisted delivery is arriving either way. The question is whether it is governed.

Tools like AI coding assistants spread primarily through peer networks, from colleague to colleague. In
practice that means the adoption decision is being made team by team, whether or not anyone made it
centrally.

What happens next depends less on the assistant than on the organisation around it. Google's DORA research
found AI adoption associated with *less stable* delivery in 2024, and in 2025 found throughput and product
performance improving while stability still did not. Its own summary: AI amplifies what is already there.
That cuts both ways — strong process gets stronger, and weak process gets faster and worse.

The amplification bites hardest at the two ends of the lifecycle. At the front, deciding what to build — an
organisation that builds the wrong thing faster has not improved. At the back, knowing whether what was built
is fit to run — where an unglamorous gap becomes an incident.

BMAD Method and Convoke are a method for those two ends, installed as agents into the assistant your teams
already use. Discovery grounded in real users, hypotheses and experiments before anything is built. A
readiness assessment after. At every stage, the output is specified in advance and the decision is left with
a person.

We make no claim that this improves delivery outcomes. No independent evidence yet exists for this framework
or any comparable one. Page 2 sets out exactly what is real, what works with limits, and what is only planned.

---

## Option B — *Faster at what?*

### You are adopting AI to go faster. Whether faster helps depends on what it is pointed at.

If you are reading this, the likeliest reason is speed: more delivered, sooner, by the same people. The
evidence says the speed does arrive. Google's DORA research found throughput and product performance
improving with AI adoption in 2025.

It also found delivery *less stable* — in 2024 and again in 2025. Its own summary: AI amplifies what is
already there. Point an amplifier at a weak process and you get the weakness, faster.

The fastest way to deliver a feature is not to build the one nobody needed. Speed at the front of the
lifecycle that skips deciding what is worth building compounds waste; speed at the back that skips knowing
whether something is fit to run turns into incidents. Neither shows up in a velocity chart until it is
expensive.

BMAD Method and Convoke are a method for pointing the speed, installed as agents into the assistant your teams
already use. Discovery grounded in real users, hypotheses and experiments before anything is built. A
readiness assessment after. At every stage, the output is specified in advance and the decision is left with
a person.

**We will not tell you this makes you faster.** No independent evidence yet exists for this framework or any
comparable one, and we would distrust a vendor who claimed it. What we can tell you is where it points the
speed — and page 2 sets out exactly which parts of that are real.

---

## Shared under either option — *Three questions you will ask*

**How does this scale?** Beyond a team, not yet. It installs per repository, so a product spread across
several repositories has no support. npm is the only distribution channel, with no mirror or air-gapped route.
The knowledge layer is markdown files and project rules, and nothing more. The model it is designed to scale by
is to keep the agents generic, maintained upstream in an open-source commons, and to carry your specificity in
curated knowledge the agents read. That is also the least-built part. Start with one team that wants it,
because tool adoption spreads primarily through peer networks. Agree a version policy too: BMAD shipped
nineteen stable 6.x releases between February and September 2026.

**How do we govern it?** Each stage's output is specified in advance and every decision is left with a person.
That happens by instruction, not by enforcement. No software checks an artifact against its specification, and
agent instructions are context rather than configuration, so hard limits need your assistant's own hooks. The
method can help you meet obligations such as the EU AI Act's human-oversight duties. It does not make you
compliant. And the discovery workflows produce personal data that we give you no help governing, so run a DPIA
before the first participant is recruited.

**What if we change toolkit?** The agents ship in the open agent-skills format under the MIT licence. An export
to Copilot and Cursor exists, but Convoke's own agents lose part of their behaviour in the export, and there is
no support for MCP, AGENTS.md or A2A. The practical exit is the same discipline as above. If your specificity
lives in knowledge rather than inside the agents, it goes with you whichever toolkit you choose.

**What we are asking.** One team that wants it, one real product decision, one discovery cycle, judged by
whether the method held and not by a productivity claim.
