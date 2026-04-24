# What Convoke Brings to BMAD Method

> A companion explainer to the [Lifecycle Expansion Vision](lifecycle-expansion-vision.md).
> This document describes how Convoke extends BMAD Method — what it adds, why, and how the two work together.
>
> **Audience:** CTOs, CPOs, and engineering leaders evaluating Convoke.
> **Date:** April 2026

---

## The BMAD Method Foundation

The BMAD Method is one of the most rigorous frameworks for AI-assisted software engineering available today. Its agent-based architecture, structured workflows, and artifact-driven processes give teams a reliable spine for building software with LLM collaboration. Where most "AI development" tools offer probabilistic autocomplete, BMAD Method offers a deterministic process: structured agents with defined roles, workflows with explicit artifacts, and handoff contracts that make state transitions auditable.

Its core modules cover four canonical phases of software delivery:

- **BMM (Business Methods Module)** — four phases spanning analysis (Mary), planning (John, Sally), solutioning (Winston), and implementation (Amelia, Quinn, Bob).
- **TEA (Test Architecture)** — Murat as a dedicated Master Test Architect, covering risk-based testing, ATDD, CI/CD governance, and scalable quality gates.
- **CIS (Creative Intelligence Suite)** — creative and innovation agents for brainstorming (Carson), storytelling (Sophia), design thinking (Maya), innovation strategy (Victor), and presentation design (Caravaggio).
- **BMB (Builder)** — tooling for creating new agents, modules, and workflows in a BMAD-compliant way.

BMAD Method gets you from "we need to build something" to "we've built it with quality." That is a remarkable amount of ground. But it is not everything a modern product team needs.

## What Convoke Adds

Convoke is not a fork of BMAD Method. It is an extension — a set of modules, agents, workflows, and governance capabilities that live alongside BMAD's core platform. Convoke depends on BMAD; it does not replace it. Five additions matter most.

### 1. Discovery & Validation — The Vortex Module

Before BMM's Analyst can write a useful PRD, somebody has to know there is a problem worth solving. Before the Architect can design a system, somebody has to know what behaviors the system must support. Convoke's Vortex module fills this gap with a complete discovery and validation engine — seven agents organized around Jurgen Appelo's Innovation Vortex pattern.

- **Emma** (Contextualize) frames the problem space and validates strategic assumptions.
- **Isla** (Empathize) runs user research and empathy mapping.
- **Mila** (Synthesize) converges research into Jobs-to-be-Done-framed problem definitions.
- **Liam** (Hypothesize) engineers testable hypotheses and assumption maps.
- **Wade** (Externalize) designs and runs lean experiments — MVPs, PoCs, PoVs.
- **Noah** (Sensitize) interprets production signals and behavioral patterns.
- **Max** (Systematize) captures validated learning and drives pivot/patch/persevere decisions.

Twenty-two workflows, ten handoff contracts, and a compass routing system that moves between streams based on evidence rather than fixed sequence. The compass is the critical detail: discovery is not a pipeline, and Vortex is the only module in the BMAD ecosystem designed accordingly. When Noah's production signals reveal a misread of user needs, the system routes back to Isla, not forward to Max. This non-linearity is the foundation of the gravity model that Convoke extends to the full lifecycle.

### 2. Production Readiness — The Gyre Module

After BMM Phase 4 ships code, is it ready for production? BMAD Method does not answer that question. Gyre does, with four agents in a sequenced pipeline:

- **Scout** detects the technology stack from filesystem artifacts — manifests, configs, infrastructure-as-code files. Evidence over inference.
- **Atlas** generates a capabilities manifest grounded in DORA metrics, Google Production Readiness Review, OpenTelemetry, and SLSA. Industry standards inform; stack relevance decides.
- **Lens** identifies absence patterns — not just what is misconfigured but what is *missing*. Cross-domain correlation surfaces compound gaps that single-domain analysis misses.
- **Coach** facilitates review with the user, captures amendments, and closes the loop back to Atlas.

Seven workflows. Zero speculation. The critical property is evidence-tagging: every finding cites its source, and confidence levels reflect actual evidence strength. Gyre tells you what is missing against accepted capability models — not what some auditor thinks should be missing. This distinction matters because readiness audits that inflate severity lose credibility, and credibility is the currency of production readiness work.

### 3. Strategic Design — The WDS Module

BMAD Method's UX Designer (Sally) covers tactical design — interface patterns, interaction design, user flows. Convoke's WDS (Workshop Design System) replaces Sally when installed, upgrading to strategic design work led by two agents:

- **Freya** — strategic UX designer who starts with WHY before HOW. Design without strategy is decoration.
- **Saga** — strategic business analyst who builds understanding through conversation, creating product briefs and trigger maps as north stars.

WDS operates across ten phases — from project onboarding through product brief, trigger mapping, UX design, agentic development, asset generation, design systems, and product evolution. The distinction from BMM's UX coverage is sharp. Sally designs screens; Freya and Saga design the *strategic product* — trigger maps that connect business goals to user psychology, product briefs that coordinate all downstream teams, design systems that grow organically from actual usage rather than upfront speculation.

For organizations where design is strategic rather than decorative, WDS is the upgrade path.

### 4. Governance & Industrialization

BMAD Method is a framework a team can use. Convoke makes it a platform an organization can run. Three capabilities enable that shift:

- **Enhance** — RICE-scored backlog management layered onto John (PM). Prioritization on Reach, Impact, Confidence, Effort — not vibes, not loudest-voice-wins.
- **Team Factory** — a workflow for creating new BMAD-compliant teams. Organizations scale Convoke itself by industrializing the creation of specialized agent teams for their domains.
- **Artifact Governance** — taxonomy-based artifact management, migration tooling, sprint status tracking, retrospective workflows, and portfolio-level views across initiatives.

These are not glamorous additions. They are what the enterprise actually needs to run BMAD Method across many simultaneous initiatives without losing track of what is happening, what is decided, and what is owned by whom.

### 5. The Lifecycle Expansion Vision

Beyond what ships today, Convoke publishes a coherent architectural vision for where the framework is going. The [Lifecycle Expansion Vision](lifecycle-expansion-vision.md) describes five structural principles:

1. The lifecycle is a gravity model, not a pipeline.
2. Infrastructure perimeters must be built before practice perimeters.
3. Entropy is a cross-cutting force, not a lifecycle endpoint.
4. Domain mesh ports mature asymmetrically.
5. The governance and change management lens is active from Wave 0.

The vision identifies gaps in current coverage — Strategy, Delivery, Growth, Operations, Security, Sunset, Documentation, Knowledge Engineering — and provides theoretical foundations for closing them: Porter on competitive strategy, Wardley on situational awareness, Cynefin on decision governance, SECI on knowledge conversion, Data Mesh on domain ownership, Lehman on software evolution.

This matters because it tells decision-makers: Convoke is not a collection of features. It is a coherent architectural vision with an explicit roadmap. Organizations investing in Convoke today know where the framework is headed tomorrow.

## How They Work Together

Convoke modules live at `_bmad/bme/` — the Convoke-specific module root. BMAD's `_bmad/` directory paths and `.claude/commands/bmad-*` skill files remain untouched for upstream compatibility. The npm package `convoke-agents` installs both BMAD Method and Convoke's extensions in a single dependency.

Teams can use BMAD Method alone. They can activate Convoke modules as their needs expand. Discovery work activates Vortex. Production concerns activate Gyre. Strategic design activates WDS. Governance pressure activates Enhance and Artifact Governance. The activation is evidence-driven — which is the gravity model in practice, at the module level.

## Who Should Use Convoke

- **Product teams** that need discovery rigor, not only build rigor. If your PRDs are template-filled rather than research-grounded, Vortex is the answer.
- **Platform engineering teams** responsible for production readiness across multiple services. Gyre's capabilities manifests and absence detection replace tribal-knowledge audits.
- **Organizations** adopting agentic workflows at scale. Artifact governance, sprint status tracking, and portfolio views prevent the fragmentation that kills enterprise AI adoption.
- **Consultancies** that want an extensible framework they can tailor to client domains. Team Factory lets you build specialized agent teams without forking the core platform.

If BMAD Method gets you from requirements to shipped code, Convoke gets you from *possible problem* to *validated production system* — with the governance to do it repeatedly, at scale, and with coherent vision for where you are going.

## The Short Version

BMAD Method gave agentic software engineering a spine. Convoke extends that spine into the full product lifecycle, with a coherent architectural vision for the perimeters still to come. It is not a replacement. It is what happens when BMAD Method meets the full reality of building, shipping, and sustaining products in organizations that are becoming agentic.

---

*Related reading: [Lifecycle Expansion Vision](lifecycle-expansion-vision.md) · [Theoretical Foundations](lifecycle-expansion-references.md)*
