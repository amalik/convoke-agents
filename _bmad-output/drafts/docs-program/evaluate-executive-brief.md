# BMAD Method + Convoke — Executive brief

*Two pages. Every product claim here was established by running the published software on 17 September
2026; every external claim is listed with its source in Appendix B of the accompanying whitepaper, and was
checked against that primary source. Where evidence does not exist, this brief says so rather than filling the gap.*

---

## What it is

**BMAD Method** is an open-source framework that wraps AI coding assistants in a defined process, delivered
as agent skills. **Convoke** is an extension to it covering the two ends of the lifecycle that BMAD's own
modules do not: *discovery* — deciding what to build, through research with real users, hypotheses and
experiments — and *readiness* — judging whether what was built is fit to run. Convoke adds seven discovery
agents across 22 guided workflows and four readiness agents across seven, plus the hand-off contracts that
define what each stage passes to the next. It installs into Claude Code — today the only supported
assistant — and is not a platform, a service, or somewhere your data goes.

## Why now

AI coding assistance is already mainstream: in a 2026 survey of more than 15,000 professional developers,
90% reported using AI coding agents at work at least weekly (the survey's publisher sells developer tools,
and weights its sample by familiarity with its own products). The business case is far less settled.

The most consequential finding for a delivery organisation is Google's DORA research, which associated AI
adoption with **less stable software delivery** in both 2024 and 2025 — in 2025, throughput and product
performance improved while stability did not. DORA's own conclusion is that AI *amplifies* what an
organisation already is. Strong process gets stronger; weak process gets faster and worse.

That is the argument for adopting method alongside tooling, and it is the argument this product exists to
serve. It is not an argument that this product has been proven to work.

## What changes for a delivery organisation

Three things, concretely:

1. **Discovery is designed to produce artifacts, not opinions.** Each stage's output is specified in
   advance — empathy artifacts, problem definition, hypothesis, experiment context, signal report — so a
   reviewer can ask whether it exists and what it says. The intent is that decisions become inspectable
   after the fact.
2. **Readiness becomes a step rather than an assumption.** The readiness team is built to detect the stack
   in a repository, derive a capability model, and name the gaps against production expectations. It is the
   younger of the two teams: classed internally as still in development, on the older agent format, and its
   team guide is not copied into your project.
3. **The operator stays the decision-maker.** When the method cannot resolve something, it is designed to
   hand the person the decision with a default, a way to override it, and the reason it matters.

**The limit that governs all three, and the most important sentence in this brief:** no workflow in either
team has been driven end to end to a finished artifact and checked, by us or by anyone we can name. What has
been verified by running it is installation, upgrade and the release pipeline — including upgrades from
3.3.0 and from 4.0.2, 31 health checks, and a deliberately damaged install correctly rejected — plus that
every agent installs and starts. What was *not* verified is the thing the three points above describe: that
running these workflows produces better decisions. That is the design, not a measured result.

Separately, and just as important: agents are *instructed* to follow the contracts. No software validates a
document against its template, and nothing enforces the operator-decides standard in code. These are
disciplines the method encourages, not controls it imposes. An organisation that needs enforcement must add
it.

## What is proven, and what is not

The accompanying maturity ledger classifies sixteen capabilities against what was verified by running the
software: **four Shipped, six Works with limits, six Mapped but not built**. The maturity ledger, supplied alongside, gives the full
table and the commands behind each row.

Five disclosures a vendor document would not usually volunteer, and which we would rather you heard from us
than found later:

- **There is no independent evidence that this method — or any competing structured AI-delivery framework —
  improves delivery outcomes.** We searched and found none. Any vendor claiming otherwise is ahead of the
  evidence.
- **Convoke's own agents are not portable** to other AI coding assistants. Portability is a stated
  direction, not a current capability.
- **The team-building tool ships but should not be adopted.** It is classed *Mapped, not built* — it has
  never produced a working team — and its maintainer has ruled it internal scaffolding rather than a
  customer-facing capability.
- **Until the day this brief is dated, a fresh install left 8 of the 12 agents unable to start at all.**
  Fixed in the 4.0.3 release of 17 September 2026 and verified by starting every agent. It is here because
  it tells you what stage of maturity this is at.
- **No organisation can be named as a reference.** We are not aware of an adopter whose experience you could
  check, and that deserves as much weight as anything else in this brief.

The product is young and its release discipline is visible: releases build from a tagged commit and must
pass a full test suite and a clean-install trial. Signed build provenance, verifiable against a public
transparency log, has been carried since `4.0.1-rc.0` — four of the twenty-seven published versions; earlier
ones have no attestation.

## What adoption looks like

A pilot, not a rollout. The adoption research is consistent that tool use spreads through peer networks
rather than mandates, and that most organisations are not yet extracting value from AI at scale.

A defensible pilot shape:

- **One team that wants it**, on one real product decision, for one discovery cycle.
- **Success judged by whether the method held** — were the artifacts produced, did a hypothesis get
  falsified, did the decision change on evidence — **not by a productivity claim**, because no credible
  productivity claim is available for any framework in this category.
- **A named upstream policy.** BMAD published nineteen stable versions between February and September 2026,
  several with breaking changes. An organisation standardising on this stack should decide deliberately how
  closely it tracks upstream.
- **A review path for what gets installed.** This is an ecosystem-level concern rather than a property of
  this product: agent instruction files are context, not enforced configuration, and independent testing has
  found substantial proportions of published agent extensions carrying security issues.

## The decision being asked for

Whether to run one pilot, on the terms above, with the limits stated above understood — not whether to
standardise on this stack.

What you would be betting on is that method and inspectable artifacts are the right response to AI making
delivery faster without making it more stable. What you would *not* be betting on is a proven productivity
outcome, because no such proof exists for this category today, from anyone.

---

*Regulatory note: nothing in this brief or the accompanying whitepaper constitutes a compliance claim. The
EU AI Act's human-oversight obligations bind system providers and deploying organisations; a development
tool cannot discharge them. This method can help an organisation evidence how decisions were made and by
whom. It cannot make an organisation compliant, and no software can. The whitepaper's regulatory section
has not been reviewed by counsel.*
