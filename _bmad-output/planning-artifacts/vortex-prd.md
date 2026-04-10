---
stepsCompleted: [step-01-init, step-02-discovery, step-03-success, step-04-journeys, step-05-domain, step-06-innovation, step-07-project-type, step-08-scoping, step-09-functional, step-10-nonfunctional, step-11-polish, step-12-complete]
inputDocuments:
  - _bmad-output/planning-artifacts/product-brief-Convoke-2026-02-22.md
  - docs/agents.md
  - docs/testing.md
  - docs/development.md
  - docs/faq.md
workflowType: 'prd'
documentCounts:
  briefs: 1
  research: 0
  projectDocs: 4
classification:
  projectType: "Developer Tool + Content Platform (hybrid)"
  domain: "Product Discovery / Innovation Methodology"
  complexity: medium
  projectContext: brownfield
version: "1.6.0"
---

# Product Requirements Document - Convoke v1.6.0

**Author:** Amalik
**Date:** 2026-02-22

## Executive Summary

Convoke v1.6.0 completes the Vortex Pattern — the first AI-guided product discovery framework covering all 7 streams of the Shiftup Innovation Vortex. Wave 3 adds three agents: **Mila** (Synthesize — research convergence), **Liam** (Hypothesize — hypothesis engineering), and **Noah** (Sensitize — production intelligence), joining the existing Emma, Isla, Wade, and Max. The release ships 10 handoff contracts with declared artifact schemas and a Compass routing decision matrix that enables non-sequential, evidence-driven navigation across all 7 agents. Together they form a Double Diamond structure: Emma and Isla discover the problem space, Mila and Liam converge on solutions, Wade externalizes through experiments, Noah monitors production, and Max drives decisions. This is a brownfield content platform expansion delivered via npm, with targeted infrastructure updates to the agent registry, validator, manifest, and migration system.

**Target users:** Product managers, solo founders, and product teams using AI-assisted product discovery. Secondary users: module developers extending the framework and team leads reviewing Vortex artifacts.

**Differentiator:** Complete 7-stream Vortex with seamless inter-agent handoffs. The value is in the handoffs, not the agents — each agent's output is the next agent's input, with no manual reshaping.

## Success Criteria

### User Success

- **Seamless handoff experience** — A user who completes a Synthesize workflow produces an artifact that Hypothesize can consume directly. No manual reshaping. The output format of each agent matches the input expectations of the next agent in the chain. *(Traced to: FR25-29)*
- **Synthesize convergence** — User brings multiple Isla artifacts and leaves with a single, actionable problem definition grounded in JTBD and Pains & Gains. *(Traced to: FR1-6)*
- **Hypothesize engineering** — User brings a problem definition and leaves with 1-3 investment-grade hypothesis contracts (expected outcome + target behavior + rationale + riskiest assumption) ready for Wade. *(Traced to: FR7-11)*
- **Sensitize intelligence** — User brings Wade's graduated experiment context and gets production signals interpreted through Vortex history — not raw dashboard numbers. *(Traced to: FR12-16)*
- **Compass routing clarity** — At the end of every workflow, users know exactly which agent to go to next and why. No dead ends. *(Traced to: FR19-24)*

### Business Success

- **Vortex completion** — All 7 Innovation Vortex streams have guided AI support. The framework's value proposition is whole.
- **Adoption parity (directional)** — Wave 3 agents eventually see comparable usage to Emma, Isla, Wade, and Max within their respective lifecycle stages. Tracked via npm downloads, GitHub stars, and discussions — no hard targets.
- **Framework credibility** — The complete 7-stream Vortex becomes a defensible market position.

*Business success criteria are outcome-level metrics validated post-release — they trace to the aggregate delivery of all FRs, not to individual requirements.*

### Technical Success

- **Release quality gates** — All 8 gates from product brief pass before publish (agent integrity, workflow completeness, Compass integration, handoff coverage, registry consistency, test suite, install flow, user guides). *(Traced to: FR34-38, FR46-52)*
- **Runtime quality** — Agent responses stay in character and follow workflow step-file architecture. Workflows complete without dead ends or broken Compass routing. Handoff contracts produce artifacts in the declared format. *(Traced to: NFR15-17, NFR21)*
- **Artifact format consistency** — Each agent's output artifact matches the schema expected by downstream agents. *(Traced to: FR25-29, NFR16)*
- **Backward compatibility** — Existing Emma, Isla, Wade, Max workflows continue to function identically. Compass updates add routes without breaking existing ones. *(Traced to: FR33, NFR3-4)*

### Measurable Outcomes

| Outcome | Measurement | Target |
|---------|-------------|--------|
| All 7 agents installed and functional | `convoke-doctor` validation | Pass |
| All 10 handoff contracts have Compass triggers | Contract-to-trigger audit | 10/10 |
| All existing tests pass + new coverage | `npm test` | Zero failures |
| Install flow end-to-end | Installer E2E test | Pass |
| Agent output → downstream input compatibility | Manual handoff walkthrough per contract | 10/10 seamless |
| Existing agent workflows unaffected | Regression test | Zero regressions |

## Scope & Implementation Strategy

### MVP Strategy

**MVP Approach:** Completeness MVP — v1.6.0 ships all 7 Vortex streams as a single release. The framework's value proposition depends on wholeness; shipping 5/7 or 6/7 agents would undermine the "first framework to cover all 7 Innovation Vortex streams" positioning.

**Core insight:** The 10 handoff contracts and Compass routing matrix are the **actual product**. Agents and workflows are the delivery mechanism. Wave 3 is primarily a **content project** with infrastructure support, not the reverse.

**Resource Requirements:** Single developer (Amalik) with AI-assisted development. The bottleneck is designing step files with consistent personas and correct handoff formats.

### MVP Feature Set (v1.6.0)

**Must-Have Capabilities (build order reflects priority):**

**First — The Product (contracts + routing):**
- **10 handoff contract schemas** — Exact artifact schema for each contract (fields, format, required sections). Schemas define artifact types generically (e.g., "problem definition schema"), not agent-coupled outputs. Any agent — or the user directly — can produce a schema-compliant artifact.
- **Compass routing decision matrix** — Pre-implementation deliverable mapping every workflow exit to every possible next agent with selection criteria, including the three-way distinction (new problem space → Emma, reframe within known space → Mila, zoom out → Emma's Contextualize Scope)

**Second — The Delivery (agents + content):**
- **Mila** (Synthesize) — Workflows: JTBD convergence, Pains & Gains, problem definition output
- **Liam** (Hypothesize) — Workflows: Structured ideation, 4-field hypothesis contract output
- **Noah** (Sensitize) — Workflows: Signal interpretation, experiment-aware monitoring, growth optimization
- Workflow count per agent driven by contract requirements — expected range 2-3, but the number serves the contracts, not a count target
- Existing agents (Isla, Wade, Max) updated with new Compass routes
- User guides: MILA-USER-GUIDE.md, LIAM-USER-GUIDE.md, NOAH-USER-GUIDE.md
- Party Mode integration from day one

**Third — The Plumbing (infrastructure):**
- Registry expanded to 7 agents, validator updated, manifest generation
- Migration entry for v1.5.x → v1.6.0 upgrade path

### Implementation Build Order

No phasing for the release — but a deliberate build sequence:

1. **Contract schemas + routing matrix first** — Define all 10 handoff contract schemas and the Compass routing decision matrix before any step files are written. Schemas define artifact types generically so downstream agents accept input from any source — preserving the Vortex's non-sequential nature.
2. **Mila second** — Has the hardest routing distinction (Mila vs. Emma: when to converge vs. recontextualize). If that distinction doesn't work in practice, the Compass model needs revision before Liam and Noah are built.
3. **Liam third** — Consumes the "problem definition" schema (not Mila-specific output). Liam's output (4-field hypothesis contract) feeds Wade's existing input expectations — lower risk.
4. **Noah last** — Depends on Wade's existing output, not on Wave 3 agents. Most independent, least risky.

### Post-MVP Features

**Phase 2 (Growth):**
- Agent enable/disable toggle via `config.yaml` — individual Wave 3 agents can be activated/deactivated without uninstalling
- Workflow template variations (quick synthesis, deep ideation, lightweight monitoring)
- Cross-agent orchestration ("full Vortex run")
- Additional ideation techniques for Liam (SCAMPER, worst-possible-idea)
- Deeper signal interpretation patterns for Noah
- P0 test suites for all Wave 3 agents

**Phase 3 (Vision):**
- New framework standing beside Vortex (unrelated domain possible) — not a completion nor an extension
- Vortex enters maintenance mode — minor workflow refinements, Compass tuning from user feedback

### Risk Mitigation Strategy

**Technical Risks:**
- **Compass routing graph complexity** — Biggest technical risk. Going from 4 to 7 agents multiplies routing paths. The three-way routing distinction must be unambiguous in every Compass decision point.
- **Mitigation:** Compass routing decision matrix as first deliverable. Build Mila first to validate the hardest routing distinction early. Automated dead-end detection in CI.

**Content Design Risks:**
- **Primary bottleneck** — Writing step files that maintain persona consistency, produce schema-compliant artifacts, and keep Compass routing unambiguous.
- **Mitigation:** Contract schemas defined before step files. Build order (contracts → Mila → Liam → Noah) so each agent's output is validated before the next agent's input is designed.

**Market Risks:**
- **Adoption of new agents** — Users may not understand when to use Mila vs. Emma, or Noah vs. dashboards.
- **Mitigation:** User guides with explicit "when to use this agent" positioning. Example artifacts. Journey documentation demonstrating non-linear entry.

**Resource Risks:**
- **Workflow count serves contracts, not targets** — If an agent's contract requirements need 1 workflow or 4, the count flexes. If time pressure arises, the relief valve is simplifying individual step files (fewer sub-steps), not cutting workflows.
- **Mitigation:** Build order reduces rework risk. Infrastructure updates are incremental.

### Content Quality Validation Plan

Defined **before implementation begins**. User Journeys 1-5 serve as structured test scripts. **Prioritized by cost-to-fix post-release** (hardest to patch first).

**Pre-Implementation Deliverable:** Handoff contract schemas — the exact artifact schema for each of the 10 contracts (fields, format, required sections). These serve as both design artifacts and test fixtures.

| Priority | Validation | Method | Maps to Journey | Why This Order |
|----------|-----------|--------|----------------|----------------|
| **P0** | **Handoff contract verification** — Agent A's output matches contract schema. Agent B accepts it without reshaping. | Structured script: input → Agent A → artifact → schema check → Agent B → verify | Journeys 1, 2, 3 | Format mismatch cascades to every downstream agent — hardest to fix |
| **P1** | **Compass routing decision test** — Each workflow's final Compass produces correct routing for 3-4 scenarios. Three-way distinction validated. | Manual scenario testing | Journey 4, Journey 5 | Routing ambiguity affects every workflow's final step |
| **P2** | **Existing agent regression** — Isla, Wade, Max with new Compass routes still produce/consume correctly. No routing changes break current workflows. | Manual walkthrough of 1 existing workflow per updated agent | N/A (regression) | Scoped to 3 agents, known patterns |
| **P3** | **Persona consistency** — Agent stays in character across all step transitions, communication style matches manifest. | Manual structured walkthrough | Journeys 1, 2, 3 | Easy to patch — update the agent .md file |
| **P4** | **Dead-end detection** — Every workflow's final step includes Compass routing. Every referenced agent exists in registry. | Automated grep + registry cross-check — **CI-integrated, runs on every commit** | N/A (infrastructure) | Already automated — CI catches it |

## User Journeys

### Journey 1: Mila — Converging Divergent Research

**Persona:** Kara, a product manager at a B2B SaaS company. She's been working with Isla for two weeks — three empathy maps, two interview syntheses, and an observation report. She has a pile of rich user insights but no single problem definition.

**Opening Scene:** Kara opens her IDE and looks at `_bmad-output/vortex-artifacts/`. Five files from Isla. Each tells a different story. She knows there's a pattern, but she can't articulate a single problem statement from all this divergence. She invokes Mila.

**Rising Action:** Mila asks for Isla's artifacts as input — this is non-negotiable. Kara points to the files. Mila guides her through Jobs-to-be-Done framing: "What job is the user hiring your product to do?" Then Pains & Gains analysis across all artifacts. Kara starts seeing the convergence — three interviews pointed at the same underlying frustration, but from different angles.

**Climax:** Mila produces a single problem definition that synthesizes all five artifacts. Kara reads it and realizes she couldn't have written this from any one artifact alone — it required the synthesis of all of them.

**Resolution:** The Vortex Compass offers routing: "Take this to Liam for hypothesis engineering, or back to Isla if you want to validate a specific assumption before proceeding." Kara chooses Liam.

---

### Journey 2: Liam — Engineering Testable Hypotheses

**Persona:** Marcus, a solo founder building a productivity tool. He's been working with Emma to frame the problem space and just finished a Synthesize session with Mila. He has a crisp problem definition but no idea what solution to test first. He invokes Liam directly.

**Opening Scene:** Marcus has "users waste 40 minutes daily context-switching between project tools" as his converged problem. He knows the problem. He doesn't know the solution. He says "let's try gamification" — a vague intuition, not a testable hypothesis.

**Rising Action:** Liam runs a structured brainwriting session — not facilitating a room, but generating and challenging ideas alongside Marcus as a creative peer. They explore five directions. Liam pushes: "What's the expected outcome? What behavior would change? Why do you believe this? And most importantly — what's the riskiest assumption that, if wrong, kills this idea?"

**Climax:** Marcus has three hypothesis contracts, each with four fields. The riskiest assumptions are different for each. He can see exactly which one to test first — the one where the assumption is most uncertain and most lethal.

**Resolution:** Compass routes to Wade with the hypothesis contract. But during ideation, Liam flagged an unvalidated user assumption ("users actually want fewer tools, not better integration"). Compass also offers routing back to Isla: "Before proceeding to Wade, consider validating this assumption with a quick user interview."

---

### Journey 3: Noah — Vortex-Aware Production Intelligence

**Persona:** Priya, a head of product at a startup that launched three months ago. Wade validated their onboarding flow through an experiment (success criteria: 60% completion within 7 days). It hit 72% during the experiment. Now in production, it's trending at 54% and dropping. Dashboard shows the number. Nobody remembers the experiment context.

**Opening Scene:** Priya sees the drop on her analytics dashboard but doesn't know if it's normal variance or a regression. She invokes Noah with Wade's original experiment context (results, success criteria, metrics, confirmed hypotheses).

**Rising Action:** Noah inherits the experiment lineage. It connects "54% onboarding completion" to "Wade's experiment #3: validated at 72% with success threshold 60%." Noah interprets: "This metric is 25% below its validated performance. The experiment confirmed that simplified onboarding drives completion. Production conditions differ — larger user base, less handholding, different demographics."

**Climax:** Noah produces a signal for Max in strict format: **Signal** (onboarding completion 54%, down from validated 72%) + **Context** (experiment #3, simplified flow, success threshold 60%) + **Trend** (declining 3% week-over-week for 4 weeks). No strategic recommendation — Max decides.

**Resolution:** Compass routes to Max with interpreted intelligence. But Noah also detected unexpected behavior: users are completing onboarding but immediately abandoning the core feature. Compass offers routing to Isla: "Unexpected user behavior detected — consider discovery research on post-onboarding drop-off."

---

### Journey 4: Non-Linear Vortex Entry — Starting with Max

**Persona:** Diego, a CPO who just joined a company with an existing product. He has no Vortex history — no experiments, no empathy maps, no problem definitions. But he has production data and intuition that something's wrong. He invokes Max directly.

**Opening Scene:** Diego doesn't follow a sequence. He starts at Systematize because that's where his evidence is — production metrics and customer churn data. Max's Vortex Navigation workflow analyzes his evidence gaps.

**Rising Action:** Max identifies: "You have production signals but no experiment history to contextualize them (Sensitize gap), no hypothesis contracts to trace back to (Hypothesize gap), and no converged problem definition (Synthesize gap). Your strongest evidence is in production behavior, but it's ungrounded."

**Climax:** Max routes Diego not to the "first" agent but to the agent that fills his most critical gap. In this case: "Your production signals suggest user behavior diverges from assumptions — start with Isla to build empathy for what's actually happening, then bring findings to Mila for convergence."

**Resolution:** Diego enters the Vortex at the point his evidence gaps are widest. There is no "step 1." The Vortex meets him where he is.

---

### Journey 5: Backflow — Pivot Routing to Mila (Not Emma)

**Persona:** Kara again, three months later. Her team ran Wade's experiments based on Liam's hypotheses. Max's Pivot/Patch/Persevere analysis says: **Pivot**. The solution direction is wrong, but the problem definition is right — users do waste 40 minutes on context-switching, just not in the way the team assumed.

**Opening Scene:** Max delivers the pivot decision. The old Vortex (4 agents) would have routed Kara back to Emma to reframe the entire problem space. But this isn't a new problem space — it's a reframe within a known one.

**Rising Action:** Max routes to Mila, not Emma. Mila takes Isla's original artifacts plus the new evidence from Wade's failed experiments. She re-synthesizes: the JTBD is the same, but the pains and gains need revision based on what the experiments revealed.

**Climax:** Mila produces an updated problem definition that incorporates the pivot evidence. Kara doesn't start over — she iterates within the known space.

**Resolution:** Back to Liam for new hypotheses grounded in the revised definition. The Vortex loops, not restarts.

---

### Journey 6: Module Developer — Building on the Framework

**Persona:** Alex, a developer who wants to create a custom agent for their company's specific domain (e.g., a compliance-focused agent for fintech). They have Convoke installed and want to extend it.

**Opening Scene:** Alex reads the development guide (`docs/development.md`). They see the agent architecture pattern: clone an existing agent, customize the persona, create workflow step files, register in manifest.

**Rising Action:** Alex clones Mila's agent definition as a template. They customize the persona for compliance expertise, create 2 workflows (regulatory scan, compliance checklist), and add step files following the established pattern. They register the agent in the manifest CSV.

**Climax:** `npx convoke-install` picks up their custom agent. Party Mode includes it. The Compass routing in their custom workflows references existing Vortex agents where relevant.

**Resolution:** Alex's compliance agent works alongside the 7 Vortex agents. The framework is extensible without forking.

---

### Journey 7: Team Lead — Reviewing Vortex Artifacts

**Persona:** Samira, VP of Product. Her team of 3 PMs each use different Vortex agents. She doesn't use the agents directly — she reviews the artifacts they produce and makes portfolio decisions.

**Opening Scene:** Samira opens `_bmad-output/vortex-artifacts/` and sees structured artifacts from across the Vortex: problem definitions from Mila, hypothesis contracts from Liam, experiment results from Wade, production signals from Noah, and decision records from Max.

**Rising Action:** The artifacts are self-documenting — each references its input source and downstream destination. Samira can trace a hypothesis contract back to the problem definition it came from, and forward to the experiment that tested it.

**Resolution:** Samira doesn't need to use the agents. The artifact chain tells the story. She reviews, challenges, and approves at the artifact level.

---

### Journey Requirements Summary

| Journey | Key Capabilities Revealed | Traced to FRs |
|---------|--------------------------|---------------|
| Mila (Convergence) | Artifact input validation, JTBD facilitation, Pains & Gains analysis, single-definition output format | FR1-6, FR17 |
| Liam (Hypothesis) | Brainwriting/ideation as creative peer, 4-field contract output, assumption flagging, Isla backflow routing | FR7-11, FR10, FR17 |
| Noah (Intelligence) | Experiment context inheritance, signal-context-trend formatting, anomaly detection, Isla backflow for unexpected behavior | FR12-16, FR17 |
| Non-linear entry | Vortex Navigation gap analysis, evidence-based routing to any agent, no assumed sequence | FR23, FR18, FR20 |
| Backflow (Pivot) | Max→Mila routing, re-synthesis with new evidence, iteration within known space | FR5, FR32, FR20 |
| Module developer | Agent cloning pattern, manifest registration, workflow step-file creation, framework extensibility | FR34, FR50-51, NFR9 |
| Team lead | Self-documenting artifacts, traceability chain (input→output→downstream), portfolio-level review | FR29, FR25 |

## Developer Tool + Content Platform Requirements

### Project-Type Overview

Convoke is a hybrid: an npm-distributed developer tool (infrastructure) and a content platform (agents/workflows). Wave 3 is primarily a content expansion — 3 agents, 6-9 workflows, 30+ step files, user guides — with targeted infrastructure updates.

### Installation & Distribution

- **Package manager:** npm (unchanged) — `npx convoke-install` installs all 7 agents
- **Node.js compatibility:** Node 18/20/22 (existing CI matrix, unchanged)
- **No new runtime dependencies** — Wave 3 adds content files (.md, .yaml), not code dependencies
- **Backward-compatible install** — v1.5.x users upgrading to v1.6.0 get all 7 agents through the migration system

### Agent Content Architecture

Each Wave 3 agent follows the established pattern from Emma, Isla, Wade, Max:

| Component | Convention | Wave 3 Deliverables |
|-----------|-----------|-------------------|
| Agent definition | `_bmad/bme/_vortex/agents/{role-name}.md` | `research-convergence-specialist.md`, `hypothesis-engineer.md`, `production-intelligence-specialist.md` |
| Workflows | `_bmad/bme/_vortex/workflows/{workflow-name}/` | 6-9 new workflow directories |
| Step files | `workflows/{name}/steps/step-{nn}-{name}.md` | 30+ step files |
| Templates | `workflows/{name}/template/` | Output templates per workflow |
| User guide | `_bmad-output/vortex-artifacts/{NAME}-USER-GUIDE.md` | MILA, LIAM, NOAH guides |
| Example artifacts | Committed to repo in `_bmad-output/vortex-artifacts/` | Sample outputs per agent (repo-only, not installed) |

**File Naming (Resolved):** `research-convergence-specialist.md` (Mila), `hypothesis-engineer.md` (Liam), `production-intelligence-specialist.md` (Noah).

### Example Artifacts

Each Wave 3 agent ships with example artifacts committed to the repo (not installed):

- **Mila:** Sample converged problem definition (JTBD + Pains & Gains output format)
- **Liam:** Sample 4-field hypothesis contract (expected outcome + behavior change + rationale + riskiest assumption)
- **Noah:** Sample signal report (signal + context + trend format linked to experiment history)

These serve as format references for downstream agents and users.

### Infrastructure Updates

| Component | Current State | Wave 3 Change |
|-----------|--------------|---------------|
| `agent-registry.js` | 4 agents with persona data | Expand to 7 agents |
| `validator.js` | Validates 4 agents, 13 workflows | Validate 7 agents, 19-22 workflows |
| `install-vortex-agents.js` | Installs 4 agents, generates manifest | Install 7 agents |
| `convoke-doctor` | Checks 4 agents | Check 7 agents |
| `config.yaml` | Lists 4 agents, 13 workflows | List 7 agents, 19-22 workflows |
| Manifest CSV | 4 agent rows | 7 agent rows |
| `config-merger.js` | Seeds 4 agents; validates 4 agents | Seeds 7 agents; schema accepts 7 agents |
| `migrations/registry.js` | Migrations up to v1.5.0 | New v1.6.0 migration entry |

### Migration Path (v1.5.x → v1.6.0)

1. **Delta logic:** Add 3 new agents to config's `agents` array; add new workflows to `workflows` array
2. **Refresh:** `refreshInstallation()` copies new agent files, workflow directories, and user guides
3. **Validation:** `validateInstallation()` confirms all 7 agents, expanded workflow count, manifest integrity
4. **Fresh install defaults:** `mergeConfig` seeds all 7 agents and their workflows for new installs

Migration appends to existing config — user customizations preserved.

### Documentation Updates

| Document | Update Needed |
|----------|--------------|
| `docs/agents.md` | Add Mila, Liam, Noah sections with workflows, positioning, and when-to-use |
| `docs/faq.md` | Update "What's coming in Wave 3?" to reflect shipped state |
| `docs/development.md` | Update project structure (7 agents, expanded workflow count) |
| `docs/testing.md` | Update test counts and coverage after Wave 3 tests added |
| `CHANGELOG.md` | Add v1.6.0 entry |
| `README.md` | Update agent count and Vortex diagram |

### Implementation Considerations

- **No new npm dependencies** — Content-only expansion
- **Registry-driven** — All new agents registered in `agent-registry.js` as single source of truth (per v1.5.2 architecture)
- **Migration-tested** — v1.6.0 migration entry must be covered by integration tests (upgrade path from v1.5.x)
- **Config backward compatibility** — Existing 4-agent configs must be gracefully migrated, not rejected by validation

## Functional Requirements

### Synthesis & Convergence (Mila)

- FR1: User can invoke Mila with one or more Isla artifacts (empathy maps, interview syntheses, observation reports) as input
- FR2: Mila can guide the user through Jobs-to-be-Done framing based on provided artifacts
- FR3: Mila can facilitate Pains & Gains analysis across multiple input artifacts
- FR4: Mila can produce a single converged problem definition that synthesizes all input artifacts into the "problem definition" schema
- FR5: User can invoke Mila with prior evidence from failed experiments (pivot scenario) to re-synthesize a revised problem definition
- FR6: Mila can accept any well-formed input artifacts — not only Isla's output — preserving non-sequential Vortex entry

### Hypothesis Engineering (Liam)

- FR7: User can invoke Liam with a problem definition conforming to the "problem definition" schema
- FR8: Liam can facilitate structured brainwriting/ideation as a creative peer alongside the user
- FR9: Liam can produce 1-3 hypothesis contracts in the 4-field format (expected outcome + target behavior change + rationale + riskiest assumption)
- FR10: Liam can flag unvalidated assumptions discovered during ideation and recommend routing back to Isla for validation
- FR11: Liam can accept problem definitions from any source (Mila, Emma, user-provided) — not coupled to a specific upstream agent

### Production Intelligence (Noah)

- FR12: User can invoke Noah with Wade's experiment context (results, success criteria, metrics, confirmed hypotheses)
- FR13: Noah can interpret production signals by connecting them to their originating experiment context and Vortex history
- FR14: Noah can produce signals for Max in strict format: signal + context + trend — with no strategic recommendations
- FR15: Noah can detect unexpected user behavior patterns not covered by the original experiment hypothesis
- FR16: Noah can route anomalous findings to Isla for discovery research when unexpected behavior is detected

### Input Validation & Error Handling

- FR17: Each agent can detect non-conforming input and guide the user to provide schema-compliant artifacts
- FR18: Compass can present an "insufficient evidence" state with guidance on what evidence to gather when routing cannot be determined

### Vortex Compass Routing

- FR19: Every Wave 3 workflow's final step presents Compass routing with evidence-based recommendations for the next agent
- FR20: Compass can distinguish between three routing scenarios: new problem space (→ Emma), reframe within known space (→ Mila), zoom out (→ Emma's Contextualize Scope)
- FR21: Compass routing recommendations reference specific handoff contracts and declare what artifact the next agent expects
- FR22: User can override any Compass recommendation and navigate to any agent directly
- FR23: Max's Vortex Navigation workflow can analyze evidence gaps across all 7 agents and route to the agent that fills the most critical gap
- FR24: The Compass routing decision matrix exists as a maintained reference document accessible to all agents

### Handoff Contracts

**Contract Inventory (10 contracts):**

| # | Source | Target | Artifact Type | PRD Evidence |
|---|--------|--------|--------------|-------------|
| HC1 | Isla → | Mila | Empathy artifacts (maps, syntheses, observations) | Journey 1, FR1 |
| HC2 | Mila → | Liam | Problem definition (JTBD + Pains & Gains) | Journey 2, FR4→FR7 |
| HC3 | Liam → | Wade | Hypothesis contract (4-field) | Journey 2, FR9 |
| HC4 | Wade → | Noah | Graduated experiment context (results, criteria, metrics) | Journey 3, FR12 |
| HC5 | Noah → | Max | Signal report (signal + context + trend) | Journey 3, FR14 |
| HC6 | Max → | Mila | Pivot decision + original evidence | Journey 5, FR32 |
| HC7 | Max → | Isla | Evidence gap routing (go discover) | Journey 4, FR23 |
| HC8 | Max → | Emma | Recontextualize routing (new problem space) | FR20 |
| HC9 | Liam → | Isla | Unvalidated assumption for validation | Journey 2, FR10 |
| HC10 | Noah → | Isla | Anomalous behavior for discovery research | Journey 3, FR16 |

- FR25: Each of the 10 handoff contracts has a defined artifact schema (fields, format, required sections) including a required `sourceArtifact` reference field
- FR26: Each agent's output artifact conforms to the declared contract schema for that handoff
- FR27: Each receiving agent can consume a schema-compliant artifact without manual reshaping
- FR28: Handoff contracts define artifact types generically (e.g., "problem definition") — any producer (agent or user) can create schema-compliant input
- FR29: Each agent's output artifact includes a `sourceArtifact` reference in frontmatter linking to its input artifact(s), enabling traceability across the Vortex

### Existing Agent Updates

- FR30: Isla's workflows include Compass routes to Mila (for convergence after discovery)
- FR31: Wade's workflows include Compass routes to Noah (for production signal interpretation after experiment graduation)
- FR32: Max's Pivot/Patch/Persevere analysis can route to Mila (not only Emma) when the problem definition is correct but the solution direction needs revision
- FR33: Existing Isla, Wade, Max workflows continue to function identically — new Compass routes are additive, not replacing existing routes

### Installation & Infrastructure

- FR34: The existing `npx convoke-install` command installs all 7 Vortex agents without requiring a new command or flag
- FR35: Agent registry (`agent-registry.js`) contains entries for all 7 agents with complete persona data
- FR36: `convoke-doctor` validates all 7 agents, expanded workflow count, manifest integrity
- FR37: Agent manifest CSV contains rows for all 7 Vortex agents
- FR38: Party Mode includes all 7 agents in collaborative discussions from day one

### Migration & Compatibility

- FR39: Users upgrading from v1.5.x to v1.6.0 receive all 3 new agents through the migration system
- FR40: Migration appends new agents and workflows to existing config — preserving user customizations
- FR41: `mergeConfig` seeds all 7 agents and their workflows for fresh installs
- FR42: Validator accepts both 4-agent (pre-upgrade) and 7-agent (post-upgrade) configurations during migration

### Documentation & Guidance

- FR43: Each Wave 3 agent has a user guide (MILA-USER-GUIDE.md, LIAM-USER-GUIDE.md, NOAH-USER-GUIDE.md) with "when to use this agent" positioning
- FR44: Each Wave 3 agent has example artifacts committed to the repo showing expected output format
- FR45: `docs/agents.md` documents all 7 agents with workflows, positioning, and when-to-use guidance

### Content Quality Assurance

- FR46: Every workflow step file has valid frontmatter (name, description, nextStepFile)
- FR47: Every workflow's final step includes Compass routing referencing all declared handoff contracts for that agent
- FR48: CI pipeline includes automated dead-end detection (grep + registry cross-check) on every commit
- FR49: Every workflow directory has a template subdirectory with at least one output template

### BMAD Core Architecture Compliance

- FR50: Each Wave 3 agent loads persona, communication style, and principles from its agent definition file at runtime per BMAD Core standards
- FR51: Each Wave 3 workflow uses micro-file step architecture where each step loads the next step file sequentially
- FR52: Each Wave 3 workflow step presents the standard A/P/C menu (Advanced Elicitation / Party Mode / Continue) at appropriate decision points

## Non-Functional Requirements

### Compatibility

- NFR1: All Wave 3 agents and workflows function on Node.js 18, 20, and 22 (existing CI matrix)
- NFR2: Fresh installs on any supported Node version produce a fully functional 7-agent Vortex with zero manual intervention
- NFR3: Upgrades from v1.5.x preserve all user-customized config values — no data loss during migration
- NFR4: All existing tests (184+) continue to pass after Wave 3 additions — zero regressions
- NFR5: Wave 3 content files use only CommonMark-compliant markdown — no IDE-specific extensions

### Installability

- NFR6: Install time does not degrade noticeably from v1.5.x with the addition of Wave 3 content
- NFR7: Running `npx convoke-install` twice produces identical results — install is fully idempotent

### Maintainability

- NFR8: Each agent's behavior is fully defined by its `.md` definition file and workflow step files — no logic encoded outside content files
- NFR9: Adding a new workflow to an existing agent requires only: new step files + workflow directory + config entry + registry update — no code changes to core infrastructure
- NFR10: The Compass routing decision matrix is a single reference document — routing logic changes require updating one document, not scattered step files
- NFR11: Compass routing logic in step files is consistent with the routing decision matrix — no undocumented routing paths exist in step files
- NFR12: Handoff contract schemas are version-controlled and referenced by agents — schema changes are traceable through git history
- NFR13: Agent persona definitions are self-contained — modifying one agent's persona does not affect any other agent's behavior
- NFR14: All Wave 3 files follow established naming conventions: agent files as `{role-with-dashes}.md`, workflow dirs as `{workflow-name}/`, step files as `step-{nn}-{name}.md`

### Content Consistency

- NFR15: Agent persona definitions include sufficient detail (communication style, principles, identity) to enable consistent LLM behavior across step transitions
- NFR16: All output artifacts produced by Wave 3 agents conform to their declared handoff contract schema on every execution
- NFR17: Compass routing at the end of every workflow recommends at least one next agent — no dead ends
- NFR18: Every step file within a workflow follows identical structural conventions (frontmatter fields, execution protocols, menu system)
- NFR19: User guides follow a consistent format across all 7 agents — MILA/LIAM/NOAH guides are structurally identical to EMMA/ISLA/WADE/MAX guides
- NFR20: Individual step files remain concise enough to fit within a single LLM context load alongside conversation history

### Reliability

- NFR21: Every workflow can be completed from start to finish without encountering broken file references, missing step files, or undefined Compass routes
- NFR22: `convoke-doctor` detects all structural integrity issues (missing agents, missing workflows, broken manifest, invalid config) in a single diagnostic run
- NFR23: All `convoke-doctor` diagnostic messages include the specific issue and expected state, enabling resolution without additional investigation
- NFR24: The migration system either fully succeeds or fails cleanly with a diagnostic message — no partial migration states
- NFR25: Party Mode functions correctly with all 7 agents loaded — no agent loading failures when manifest expands to 7 Vortex entries

### Test Coverage

- NFR26: Wave 3 infrastructure code changes maintain or exceed the current 83% line coverage threshold. No new infrastructure code ships without unit test coverage.

## Document Status

PRD complete. 52 functional requirements across 12 capability areas, 26 non-functional requirements across 6 quality categories, 7 user journeys with FR traceability. Ready for Architecture and Epic breakdown.
