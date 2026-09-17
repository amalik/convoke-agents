# Governed AI-assisted delivery: BMAD Method + Convoke

*Draft for the upcoming leadership review. Every product claim in this document was derived from the
published package `convoke-agents@4.0.3` on 17 September 2026 by running it, not by reading its
documentation. Every external claim traces to the accompanying state-of-the-art research note, whose citation
tables were independently claim-checked against their primary sources on the same date. **Appendix B, which
reproduces those citations inline, is not yet assembled** — until it is, an external claim must be followed
into that note rather than looked up here.*

> **Draft status.** Page one (*The stakes*) is deliberately not written yet: its framing is being set by
> interviews with evaluating organisations, and writing it first would mean arguing backwards from a
> conclusion. Sections 1 to 6 do not depend on it. The regulatory subsection (5.3) is self-contained by
> design, so it can be reviewed by counsel, or removed entirely, without disturbing the rest.

---

## Page 2 — What is proven, what works with limits, what is only planned

The full ledger is a separate document (*Convoke Maturity Ledger*), re-derived against 4.0.3. It is page 2
because an evaluating organisation's first question about a young product is not "what does it do" but
"what of this is real". The summary:

| | Count | What it means |
|---|---|---|
| **Shipped** | 4 of 16 capabilities | Verified by running the software or by an automated test that exercises it |
| **Works with limits** | 6 of 16 | Works, with a named defect or gap that affects the documented outcome |
| **Mapped, not built** | 6 of 16 | Documented as planned. No working implementation |

Three things that ledger says which a vendor document usually would not:

- The Team Factory — a tool for building new agent teams — is classed *Mapped, not built*: it ships and its
  design steps run, but it has never produced a working team, and the maintainer has since decided it is
  internal scaffolding rather than a capability to adopt. It still ships. Do not plan on it.
- Convoke's own agents are **not portable** to other AI coding assistants. The export tool works; what it
  exports for Convoke's own agents is a notice saying a full install is required.
- Four of the six module configuration files are rewritten from the template on every install, so
  customisation in those four does not persist.

Nothing in this document should be read as claiming more than that ledger allows.

---

## 1. The problem: the two riskiest ends of the lifecycle

Most AI-assisted delivery tooling addresses the middle of the lifecycle — writing, reviewing and testing
code. That is where the tools are strongest and where the market is most crowded. It is not where the
expensive mistakes are made.

The two ends carry the risk. At the front, deciding what to build: an organisation that builds the wrong
thing faster has not improved, and AI makes building faster. At the back, knowing whether what was built
is fit to run: readiness is where an unglamorous gap becomes an incident.

AI coding assistance is already mainstream — in a 2026 survey of more than 15,000 professional developers,
90% reported using AI coding agents at work at least weekly (the survey's publisher is itself a tool vendor,
and re-weights its sample by familiarity with its own products). The business case is far less settled.

The industry evidence points the same way, and it is uncomfortable reading for anyone selling AI tooling.
Google's DORA research found AI adoption associated with *less stable* software delivery in both 2024 and
2025 — in 2025 throughput and product performance turned positive while stability did not. DORA's own
summary is that AI amplifies what an organisation already is: strong teams get stronger, and weak process
gets faster and worse. Vendor telemetry points in the same direction, with more code reaching production
and a growing share of it arriving with no review at all.

That is the case for method rather than more tooling. It is also the case for candour: the same research
literature contains no independent evidence that any structured AI-delivery framework — BMAD, Convoke, or
any competitor — improves delivery outcomes. We searched for it; we did not find it. Anyone claiming
otherwise about their own framework is ahead of the evidence.

## 2. How it works

BMAD Method is an open-source framework that wraps AI coding assistants in a defined process, delivered
as agent skills. Convoke is an extension to it, covering the two ends described above.

| Stage | Who provides it | What it is |
|---|---|---|
| **Discovery** | Convoke — *Vortex* | 7 specialist agents, 22 guided workflows |
| **Design** | BMAD ecosystem — *WDS* | A separate BMAD extension, not Convoke's |
| **Build and test** | BMAD — *BMM*, *TEA* | The BMAD Method's own modules |
| **Readiness** | Convoke — *Gyre* | 4 agents, 7 workflows |

Convoke owns and maintains only what is in the `_bmad/bme/` namespace: the discovery and readiness teams
and their supporting modules. It does not ship, maintain or assess the BMAD ecosystem modules it runs
alongside, and this document does not assess them either.

**The discovery team (Vortex)** takes a team from framing a problem, through research with real users,
synthesis, hypotheses and experiments, to a pivot / patch / persevere decision. Its seven agents map to
the seven streams of the Shiftup Innovation Vortex: contextualize, empathize, synthesize, hypothesize,
externalize, sensitize, systematize.

**The readiness team (Gyre)** detects the technology stack in a repository, builds a capability model from
it, finds the gaps between that model and production expectations, and reviews them with an engineer.

**Hand-off contracts are the load-bearing idea.** Five contract templates define what each discovery stage
passes to the next — empathy artifacts, problem definition, hypothesis, experiment context, signal report —
and five routing rules define which agent picks up when work flows backwards. This is what makes the
process auditable: the artifact a stage produces is specified in advance, so a reviewer can ask whether it
was produced and what it says.

**One limit stated plainly:** the agents are *instructed* to follow those contracts. No software validates a
document against its template. An organisation that needs enforcement rather than instruction needs to add
it.

## 3. Theoretical grounding, stream by stream

Each discovery stream implements an established practice rather than inventing one. This section describes
that lineage; it is not a claim that the implementations have been empirically validated.

| Stream | Established practice it implements |
|---|---|
| Contextualize | Framing and jobs-to-be-done: what situation is the customer in, what progress are they trying to make |
| Empathize | Qualitative user research — interviews, empathy mapping |
| Synthesize | Research convergence: turning many observations into a defensible problem statement |
| Hypothesize | Hypothesis-driven development: stating a falsifiable belief before building |
| Externalize | Lean experiments and minimum viable tests, in the Lean Startup tradition |
| Sensitize | Production intelligence: instrumenting for signal rather than opinion |
| Systematize | Validated learning and the pivot / persevere decision |

The evidence base for *AI's role* in these practices is mixed and worth stating precisely, because it
determines where the product should and should not be trusted:

- **AI helps most where it works with real people.** Evidence supports using AI to run and analyse
  research with real participants.
- **AI-simulated "synthetic users" are contested.** A 2026 *Nature* study found they predict average
  survey-experiment effects well. Other peer-reviewed work finds they flatten differences between groups,
  and practitioner studies find they tell teams what they want to hear. A review of twelve peer-reviewed
  papers found most reported discrepancies between synthetic and human results, concluding it is
  "premature to rely on research with synthetic users for critical decision-making".

Convoke's discovery workflows are built for research *with* real users. That is a deliberate position, and
the evidence above is why.

## 4. State of the art, and where this honestly sits

Structured AI-delivery frameworks are a young and crowded category. Others include GitHub Spec Kit,
OpenSpec, AWS AI-DLC, Superpowers and GSD. Nobody has counted the field; the only published comparison we
found selected six by a traction threshold, and its author also wrote one of the six — a conflict that
paper declares.

**Where the landscape is ahead of us.** AWS AI-DLC already spans ideation through operation with approval
gates after every stage. "Coverage on both sides of the build" is therefore not a differentiator on its
own. Thoughtworks assessed the spec-driven-development approach in November 2025 and has not carried that
assessment into its current Radar; it also singles out BMAD as heavier and more rigid than lighter
alternatives, and advises teams to keep re-checking whether such frameworks are still needed as the
underlying models improve. That advice applies to this product too.

**What appears defensible, stated as interpretation rather than finding.** Discovery grounded in real users
and experiments, rather than requirements elicitation; readiness assessment independent of any one cloud;
and the candour of the maturity ledger itself. We did not audit competitors' stages against the first two,
so we do not claim they are absent there.

**What is not defensible.** Any outcome claim. There is no independent evidence that this method improves
delivery outcomes, and the most rigorous study of AI-assisted development effects could not measure the
effect reliably at all.

## 5. What is at stake in adopting it

### 5.1 Adoption and scaling

The adoption literature is consistent on two points: most organisations are not yet getting value from AI
at scale, and tool use spreads through peer networks rather than mandates. Both argue for piloting with a
team that wants it, rather than a broad rollout.

The relevant constraint here is upstream dependency. BMAD published nineteen stable 6.x versions between
17 February and 4 September 2026, several with breaking changes. An organisation standardising on this
stack should expect to track upstream, and should agree a version policy — Convoke's own proposal is to
run one minor version behind upstream — rather than assume stability.

### 5.2 Portability and interoperability

Stated plainly: **Convoke's own agents are not portable.** The export tool produces usable instruction
files for other assistants from ecosystem skills, but Convoke's twelve installed agents — the eleven discovery and readiness agents plus the Team Factory agent — are classed non-portable and
export as a notice that a full install is required. Portability is a direction, not a destination, and the
product's own README says so.

Convoke installs for Claude Code. The wider ecosystem is converging on shared formats — the agent skills
format, MCP, AGENTS.md, A2A — but Convoke does not yet implement those interfaces.

### 5.3 Governance and regulatory context

> *This subsection maps product behaviour onto regulatory obligations. It is written to be removable: no
> other section depends on it. It has not been reviewed by counsel.*

The Operator Covenant is Convoke's governance standard: when a skill cannot resolve something, it hands the
operator the decision with a default, a way to override it, and the reason it matters. Note before anything
else that **the Covenant documents are not copied into an installed project** — they live in the package and
on GitHub, so the standard the rest of this subsection describes never arrives in your repository. What it
is, and is not:

- It is applied through review, **not enforced by software**. The product's own README now says exactly
  that. An April 2026 audit found 46 of 56 checks passing (82%), across eight skills out of roughly
  thirty-three. Three caveats travel with that number, and all three are the auditor's own: the reviewer was
  **an AI persona written by this project, scoring files written by this project** — the report states that
  "an external audit would add independence that this report does not claim"; it was a single reviewer, not
  a panel; and the compliance rate is "likely a ceiling, not a floor" (said of the 84% figure from an
  earlier round). The audit also predates 4.0, and the discovery team scored **25%** on one of the seven
  rights — a number the 82% aggregate conceals.
- The EU AI Act's Article 14 obliges **providers** to design high-risk systems so that human overseers can
  understand and override them; deployers must implement those measures and assign competent overseers
  (Article 26). These are obligations on organisations and on system providers. **A development tool cannot
  discharge them.**
- Whether any given system is high-risk is determined by Article 6 and Annex III. We have not performed
  that classification for any product, and nothing here should be read as one.
- Research on automation bias is directly relevant: people follow confident AI advice even when it is
  wrong, and fluent, authoritative output makes this worse. "Operator decides" is a necessary design
  posture and an insufficient control on its own.

The honest formulation: this method can *help* an organisation evidence how decisions were made and who
made them. It cannot make an organisation compliant, and no software can.

*GDPR and data-protection obligations are out of scope for this document and were not researched.*

### 5.4 Security and data handling

Convoke runs inside the operator's existing AI coding assistant and adds no separate service, network
listener or data store. What it adds is instructions and artifact templates written into the project
directory.

Two ecosystem-level risks belong in an evaluation, because they are properties of the environment this runs
in rather than of this product: agent instruction files are context, not enforced configuration — hard
limits need hooks or managed settings — and independent testing of skill and MCP ecosystems has found
substantial proportions of published extensions carrying security issues. An organisation adopting any
agent-skills tooling needs a review path for what it installs.

## 6. Roadmap and release management

Convoke ships from a CI pipeline: a release builds from a tagged commit, must pass the full test suite and a
clean-install trial, and carries signed build provenance verifiable against a public transparency log. The
4.0.3 release of 17 September 2026 was verified this way. **This applies from 4.0.1 onward** — three of the
twenty-seven published versions. Releases before that have no attestation.

Two honest notes about that pipeline. Nothing in it re-reads the registry after publishing, so a green
pipeline is not by itself proof that a release reached users — and after 4.0.3 the registry reported the
previous version for about two and a half minutes, long enough for a naive check to report a successful
release as a failed one. Release verification is therefore a documented manual step, not an automated gate.

The near-term roadmap is deliberately narrow: finish converting the remaining agents to the current BMAD
format, close the defects named in the ledger, and complete the operator-facing documentation. New teams
are designed but not built, and are not offered as a reason to adopt.

---

## Appendix A — Glossary

*To be written: agent, skill, workflow, hand-off contract, module, stream, provenance, deployer/provider.*

## Appendix B — References

*To be assembled from the state-of-the-art research note's citation tables, which were independently
claim-checked on 17 September 2026. Every external claim in this document traces to a row there.*
