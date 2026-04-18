---
title: "Product Brief Distillate: Initiative Lifecycle Engine (ILE-1)"
type: llm-distillate
initiative: convoke
artifact_type: distillate
qualifier: initiative-lifecycle-engine
source: convoke-brief-initiative-lifecycle-engine.md
created: '2026-04-18'
schema_version: 1
purpose: "Token-efficient context for downstream PRD creation. Captures overflow detail from the Brief discovery session that didn't fit the executive summary."
---

# ILE-1 Brief — Detail Pack for PRD Creation

## Scope Signals

### In v1 (concrete)
- Shared data model under all three skills (initiatives-backlog, portfolio-status, migrate-artifacts)
- Portfolio-status rework: stages, lanes, WIP signals, pipeline completeness view
- Kanban view: columns = pipeline stages (Qualified → In Pipeline → Ready → In Sprint → Done), WIP limits per column, sortable by portfolio attachment
- Reactive behaviors layer: (1) new initiative logged → orphan intake scan suggests attachment, (2) artifact created → pipeline stage auto-advances, (3) sprint close → staleness detector flags broken refs/outdated scores, (4) epic completed → absorbed items closed, dependents unblocked
- Pipeline completeness dashboard: per-initiative artifact presence indicator (B, P, P✓, A, IR, E, D) → "what's missing to reach Ready"
- Integration/contracts between the three skills (shared markdown source of truth, consistent lane/stage/portfolio vocabulary)

### Explicit non-goals v1 (deferred to v2+)
- **Benefits Realization Management (BRM):** Identify → Analyze → Deliver → Sustain tracking, benefit owners, benefit realization ratio. Conceptually maps to post-"Done" stages but not built in v1.
- **OKRs / strategy-execution linkage:** strategic objective tree above initiatives. V2+.
- **WSJF as alternative prioritization:** evaluate after v1 RICE adoption data accumulates.
- **ESG / sustainability portfolio criteria:** future dimension.
- **Multi-user dashboards / real-time collaboration:** deliberately out — ILE-1 is single-user-per-repo by design.
- **Steering committee / governance board formalization:** qualifying gate (Vortex/John/Winston) is sufficient for v1.
- **Flow metrics (throughput, lead time, flow efficiency):** requires accumulated stage transition timestamps. V2+.

## Architecture-Phase Decisions (Deferred From Brief)

- **Data model: markdown-as-source vs. structured backing store.** Load-bearing decision for every reactive behavior and every view. Reviewer (skeptic) flagged as risk; user agreed this is Architecture-phase, not Brief-phase.
- **Deployment model:** ship as part of existing Convoke `npm install`, or separate module? (Not yet decided — affects upgrade story and install UX.)
- **Helm vs. Loom boundary:** ILE-1 is attached to `helm` portfolio, but reactive behaviors (WS3) overlap with Loom's orchestration scope. Scope note already exists in backlog Appendix — Architecture must resolve explicitly.
- **Event model for reactive behaviors:** file-watch, git-hook, explicit skill invocation, or scheduled scan? Each has different UX and failure mode properties.
- **Idempotency / conflict resolution:** what happens when auto-advancement runs concurrently with a manual edit? Race conditions need a contract.

## User Personas (Dense)

### Co-primary A: Consulting team lead
- Runs 3–8 concurrent initiatives across client engagements
- Team of 2–6 consultants using BMAD + Convoke
- Pains: lateral context switching (topic A → topic B), vertical altitude switching (strategy → ops → strategy), 5+ min context reconstruction per switch
- Success: re-enter any initiative < 60s, portfolio health without altitude change, findings auto-land in correct lane
- Adjacent use: structured onboarding for new team member joining mid-engagement — "show me everything in flight, where each stands"

### Co-primary B: Solo practitioner with many concurrent initiatives
- OSS maintainer (5+ active repos), indie founder (product + marketing + infra), internal platform team lead (parallel workstreams)
- Larger absolute addressable population than consulting leads
- Drives adoption volume; consulting leads drive depth
- Same lifecycle discipline need, less governance overhead
- Pattern already validated by user across their own teams (per user — no user research needed)

### Tertiary use: Client-facing transparency
- Export pipeline/kanban views as status artifacts (rendered markdown/HTML)
- Client-trust differentiator with zero additional effort
- Same data, different audience

## Positioning

- **Category label: "Portfolio-as-Code"** (chosen over "IDE-native SPM"). Mirrors Infrastructure-as-Code, which the target audience already knows. Catchier, more searchable, more aspirational.
- **Anti-SaaS differentiators (full list):** zero per-seat licensing, zero migration risk, zero data residency concerns (compliance advantage for regulated consulting — finance, health), no separate tool to context-switch to, git-native (diffable, version-controlled, portable)
- **Category-defining claim:** no existing tool offers Portfolio-as-Code. Linear/Notion/Jira add AI to databases. ILE-1 inverts: AI IS the system.
- **Reactive behaviors = the moat** (not the views). Anyone can render kanban in markdown. Artifact presence triggering pipeline state is the novel mechanism.

## Standards & References Informing Design

- PMI Standard for Portfolio Management (4th Ed) — strategic alignment, governance roles, PMIS
- PMI Standard for Program Management (4th Ed) — BRM, KPIs, stakeholder engagement
- PMI Benefits Realization Management Practice Guide — Identify → Analyze → Deliver → Sustain
- MSP 5th Edition — vision + Target Operating Model, principles, adaptive governance
- SAFe Lean Portfolio Management — portfolio kanban, WSJF, flow metrics, lean budgets with guardrails, participatory budgeting
- ISO 21504:2022 — international portfolio management standard
- PMI (forthcoming) Standard for AI in Portfolio, Program, and Project Management — public comment closed 2025
- PMBOK 8th Edition (Jan 2026) — principles/focus areas/performance domains structure
- Mik Kersten, *Project to Product* — Flow Framework, VMO concept
- John Doerr, *Measure What Matters* — OKRs

## Competitive Intelligence (From Web Research)

- **Linear:** closest spirit competitor, AI features on traditional SaaS database. Different shape.
- **Notion AI:** wiki + AI, not lifecycle-aware.
- **Dart PM / Airplane.dev / Magic Loops:** AI-first PM as hosted SaaS. No agent-native approach.
- **Sweep AI / Devin:** agentic but code-task focused, not portfolio.
- **GitHub Projects / Plane.so:** code-adjacent work management but SaaS-shaped underneath.
- **Backstage (Spotify):** closest structural analog — catalog-as-code for services. ILE-1 is "catalog-as-code for initiatives."
- **Market signal:** "AI-Augmented Software Engineering" near Peak of Inflated Expectations (Gartner 2025). Agentic coding hot (Devin, Claude Code, Copilot Workspace). Portfolio/lifecycle within agent workflows = unoccupied niche.
- **Risk:** market education. **Opportunity:** first-mover in a defined category.

## Vision Roadmap (North Star)

### v2 (near-term after v1 adoption)
- BRM lifecycle tracking (Identify → Analyze → Deliver → Sustain) — post-"Done" stages
- OKRs linked to initiatives (strategic objective tree above portfolio)
- Flow metrics computed from stage transitions (throughput, lead time, flow efficiency)
- WSJF as alternative prioritization alongside RICE

### v3 (medium-term)
- Adaptive governance with rolling reforecasting + scenario planning
- Stakeholder engagement as managed theme
- Cross-portfolio dependency visualization
- Value stream funding models (SAFe LPM lean budgets with guardrails)

### Long-term (aspirational, 2027+)
- **Autonomous portfolio management within human-set guardrails.** AI agents continuously rebalance investment across initiatives based on flow metrics, benefits signals, strategic alignment. Portfolio manages itself; humans set strategy and review outcomes.
- Context engineering (not prompt engineering) becomes the PMO skill
- ESG / sustainability as first-class portfolio criteria
- Geopolitical / supply chain resilience dimensions

## Pre-existing Work & Dependencies (Informational)

- **initiatives-backlog v2.0.0** (shipped 2026-04-15): already the "write surface." Triage / Review / Create modes, lane-aware, qualifying gate with portfolio + RICE. Partially delivers WS1.
- **Lifecycle process** (codified 2026-04-15): Part 1 of the backlog doc contains the canonical lifecycle definition (Intake → Qualifying Gate → 3 lanes → 5 stages). Referenced as semi-static by Triage and Review modes; emitted verbatim by Create mode. ILE-1 consumes this process model.
- **Capability Evaluation Framework (P10)** (operationalized 2026-04-18): skill → agent → team decision framework. Referenced from §1.2 qualifying gate for capability-type intakes. ILE-1 should surface this when relevant.
- **project-context.md rules** (13 rules, accumulated): codified dev constraints. ILE-1 skills must comply (test-fixture-isolation, no-hardcoded-versions, path-safety, shared-test-constants, catch-all-phase-review, spec-verify-referenced-files, code-review-convergence, capability-form-factor-evaluation, etc.).
- **Dependency cross-refs in backlog:** P13 blocked on P12 (Enhance framework); P9 blocked on Gate 1 (Forge shadow engagement); v6.3 Adoption shipped the lifecycle-engine infrastructure.

## Known Risks Captured From Review Panel

- **Scaling limits of markdown-as-database:** no indexes, queries, transactions. Architecture must decide if this is acceptable for v1 or if structured backing store is needed.
- **Race conditions in reactive automation:** concurrent auto-advance + manual edit needs a contract. Design unspecified in Brief.
- **State corruption risk if artifacts are partial/moved/deleted:** reactive behaviors must handle degenerate cases (e.g., PRD file exists but is empty, Architecture file was moved mid-session).
- **No rollback/degradation story** if reactive automation misbehaves. Architecture must design a "safe mode" or manual-override affordance.
- **Qualifying gate bottleneck:** only Vortex/John/Winston can qualify. On a real team, one person becomes the bottleneck. Delegation or self-service qualification path not designed for v1 — worth surfacing in PRD as open question.
- **Learning curve compound:** ILE-1 vocabulary (lanes, stages, qualifying gate, RICE) layered on top of BMAD vocabulary (agents, workflows, skills, modules). Onboarding UX unspecified.
- **Bootstrap problem:** new team with no existing backlog must run Create → Triage → Qualify (3 sequential steps) before seeing value. "Aha moment" latency not designed.

## Open Questions for PRD

- Data model: markdown-as-source vs. structured backing store (YAML/JSON + generated markdown view)
- Deployment model: part of Convoke install vs. separate module
- Helm vs. Loom boundary formalization
- Reactive event model: file-watch / git-hook / explicit invocation / scheduled
- Idempotency and race-condition contract for auto-advancement
- Qualifying gate delegation / self-service path
- Onboarding UX / bootstrap sequence

## Rejected / Deferred Ideas (So PRD Doesn't Re-Propose)

- **Multi-user real-time collaboration:** deliberately out. ILE-1 is single-user-per-repo. If multi-user is ever needed, it's a separate initiative, not v2 of ILE-1.
- **SaaS rendering layer:** considered and rejected. Export to HTML/markdown is OK (tertiary use); hosted dashboard is not.
- **Innovation hypothesis validation via user research:** user rejected (pattern seen many times across their teams; no validation session needed before PRD).
- **Steering committee formalization in v1:** deferred to v3 adaptive governance work.
- **WSJF as replacement for RICE:** deferred — evaluated alongside RICE in v2, not replacing.

## Confidence & Readiness

- **Confidence:** High. Vision is well-articulated (two research documents grounding state-of-the-art), architecture patterns are known (PMI/MSP/SAFe LPM), existing skills provide concrete starting points, user has lived the problem across multiple teams.
- **Biggest Architecture-phase risk:** the data model decision. Everything else depends on it.
- **Ready for:** PRD creation via `bmad-create-prd` pointed at this brief + distillate.
