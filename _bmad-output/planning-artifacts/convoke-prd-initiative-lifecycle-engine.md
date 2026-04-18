---
stepsCompleted:
  - step-01-init
  - step-02-discovery
  - step-02b-vision
  - step-02c-executive-summary
  - step-03-success
  - step-04-journeys
  - step-05-domain
  - step-06-innovation
  - step-07-project-type
  - step-08-scoping
inputDocuments:
  - _bmad-output/planning-artifacts/convoke-brief-initiative-lifecycle-engine.md
  - _bmad-output/planning-artifacts/convoke-brief-initiative-lifecycle-engine-distillate.md
  - _bmad-output/planning-artifacts/convoke-note-initiative-lifecycle-backlog.md
  - _bmad-output/planning-artifacts/convoke-note-capability-evaluation-framework.md
  - _bmad-output/planning-artifacts/convoke-note-friction-log-template.md
  - _bmad-output/planning-artifacts/convoke-vision-ecosystem.md
  - project-context.md
workflowType: 'prd'
initiative: convoke
artifact_type: prd
qualifier: initiative-lifecycle-engine
status: draft
created: '2026-04-18'
schema_version: 1
classification:
  projectType: developer_tool
  productNature: capability-layer
  productCategory: portfolio-and-program-management
  domain: devtools + governance
  complexity: high
  projectContext: brownfield
  classificationRationale: 'Party-mode revision (John, Winston, Mary): projectType kept as developer_tool for PRD template-fit (CLI/API sections, skip visual UX). productNature=capability-layer signals to Architecture "design for sibling integration, not third-party extensibility" (NOT a meta-framework). productCategory=portfolio-and-program-management captures both PMI Portfolio + PMI Program + MSP framings (qualifying gate + stage routing is program-level; RICE scoring + portfolio attachment is portfolio-level). Complexity=high due to standards-grade ambition (PMI/MSP/SAFe LPM) and load-bearing architecture decisions (data model, reactive event model, race conditions, bootstrap UX).'
---

# Product Requirements Document — Initiative Lifecycle Engine (ILE-1)

**Author:** Amalik
**Date:** 2026-04-18

## Executive Summary

Consulting team leads running 3–8 concurrent initiatives lose 5+ minutes reconstructing context every time they switch topics. Solo practitioners managing parallel workstreams — OSS maintainers with 5+ active repos, indie founders juggling product/marketing/infrastructure, platform team leads — suffer the same pattern: cognitive load from constant lateral and vertical context switching, compounded by accountability fog about who owns what and who decided what. Today they cope with personal workaround systems that solve navigation poorly and leave no audit trail.

ILE-1 — the Initiative Lifecycle Engine — is a capability layer within Convoke that eliminates that loss. It gives teams a map AND an audit trail, simultaneously, delivered through AI agent conversations and markdown contracts in the developer's IDE. Three existing Convoke skills (initiatives-backlog, portfolio-status, migrate-artifacts) are reworked into integrated views on a shared data model, augmented with a kanban view and pipeline completeness dashboard, and connected by reactive automation that reads artifact state and proposes lifecycle transitions — never silently commits state changes.

Success is measured pragmatically first: the ~12 current Convoke users adopt ILE-1 weekly. Longer-horizon aspiration: operational backbone for consulting teams using AI agents to manage complex work.

### What Makes This Special

**Map and audit trail, in one system.** Most tools pick one — flow or governance. ILE-1 merges them: the qualifying gate, lane routing, RICE scoring, dependency tracking, and artifact-presence indicators are simultaneously the map and the audit trail.

**Portfolio-as-Code.** Lifecycle state lives in git-native markdown with structured frontmatter — portable, diffable, version-controlled. Zero per-seat licensing. Zero migration risk. No cloud dependency, compliance-friendly for data-residency-sensitive contexts. Same pattern as Infrastructure-as-Code: declarative state in git.

**Trust-preserving automation.** Reactive automation reads artifact state and proposes lifecycle transitions. For uncertain cases (partial artifacts, race conditions, moved files), automation proposes before committing. Trust is earned through correctness. The event model (file-watch, git-hook, explicit invocation) is an Architecture-phase decision.

**Standards grounding, developer delivery.** The lifecycle model draws from PMI Standard for Portfolio Management, PMI Standard for Program Management, MSP 5th Edition, and SAFe Lean Portfolio Management. The delivery mechanism is agent conversations plus markdown contracts — familiar to developers using Claude Code, Copilot, Cursor. SaaS incumbents are architecturally locked into database+UI models; rebuilding as agent+markdown is a rewrite, not a feature.

**Agent-enforced structure.** RICE scores, qualifying gates, lane routing, and pipeline stages are machine-readable contracts. Agents enforce the structure at creation time instead of hoping humans fill UI fields consistently. Inconsistency becomes an error, not a coping mechanism.

## Project Classification

- **Project Type:** `developer_tool` (CLI + agent skills + markdown)
- **Product Nature:** `capability-layer` (siblings integration, not third-party extensibility)
- **Product Category:** `portfolio-and-program-management` (spans PMI Portfolio, PMI Program, MSP, SAFe LPM framings)
- **Domain:** `devtools + governance`
- **Complexity:** `high` (standards-grade ambition, load-bearing architecture decisions: shared data model, reactive event model, race conditions, bootstrap UX)
- **Project Context:** `brownfield` (reworks three existing Convoke skills + introduces shared data layer and new capabilities)
- **Business model:** Consulting amplifier in initial phase. Optional evolution toward standalone product if near-term validation lands. Near-term success measured as weekly adoption by the ~12 current Convoke users; long-term aspiration is operational backbone for AI-agent-equipped consulting teams.

## Success Criteria

### User Success

Three core criteria locked in the Brief. Each pairs a **mechanistic** target (what we measure) with an **experiential** phrasing (what the user says when it works). Monitor both: mechanistic targets can hit green while users still don't feel served.

1. **Context re-entry under 60 seconds.**
   - *Mechanistic:* User can understand any initiative's current stage, work done, next step, and blockers in under 1 minute, without leaving their current conversation. Baseline: current workaround systems require 5+ minutes of archaeology per switch.
   - *Experiential:* *"I know where P9 stands without stopping what I was doing."*

2. **Portfolio health without altitude change.**
   - *Mechanistic:* Portfolio-level visibility (WIP, pipeline completeness, health signals) available in the same environment where operational work happens. No separate tool, no tab switch.
   - *Experiential:* *"I can see the whole map without leaving the task I'm on."*

3. **Findings auto-land in the right place.**
   - *Mechanistic:* New findings flow through the qualifying gate and arrive in the correct lane with RICE scores, without manual triage overhead.
   - *Experiential:* *"I don't have to remember where to put things."*

### Business Success

Aligned with **consulting amplifier** business model:

- **Near-term (Q1 post-ship):** ≥ 80% of current active Convoke cohort adopts ILE-1 weekly (user attestation)
- **Medium-term (6 months post-ship):** ≥ 1 engagement with explicit user feedback citing ILE-1 as a Convoke-adoption factor (any form — retro, written, conversation, issue/PR)
- **Long-term (12+ months):** Operational backbone for consulting teams using AI agents to manage complex work. *Aspirational, not committed.*

### Leading Indicators

Early signals, measurable within days of ship:

- **L1: First-session completion rate** — % of users who invoke ILE-1 for the first time and complete a full qualifying-gate session without abandoning. Target: ≥ 70%.
- **L2: Week-1 invocation rate** — % of onboarded users invoking any ILE-1 skill in the 7 days after first session. Target: ≥ 50%.

### Outcome Metrics

Lagging measurements of whether the value proposition lands. Each metric carries an **explicit hypothesis**; if the hypothesis turns out wrong, the metric is measuring the wrong thing — change the metric, don't hit a meaningless target.

| # | Outcome | Hypothesis being tested | Measurement Method | Target |
|---|---------|------------------------|---------------------|--------|
| M1 | Context re-entry time | Context re-entry time is the bottleneck in altitude switching | Self-timed directional test: "tell me where P9 stands" from cold start | < 60s (directional, not controlled) |
| M2 | Weekly adoption in active cohort | Weekly usage is the right cadence for this workflow | User attestation | ≥ 80% of cohort, weekly |
| M3 | Finding auto-routing rate | Manual re-routing is costly enough that automating 80% solves the pain | Change Log analysis: % of extracted findings reaching a lane without a subsequent re-route entry | ≥ 80% |
| M4 | Explicit user feedback citing ILE-1 | Unprompted user feedback within 6 months is a real adoption signal | Any form (retro, written, conversation, issue/PR) | ≥ 1 engagement in 6 months |

### Falsification Criteria

Observations that would prove the **Portfolio-as-Code thesis** is wrong — not just "ILE-1 isn't being used":

- Users adopt the qualifying gate for intake but route them *all* through Fast Lane to skip the lifecycle pipeline. *Implication: the lifecycle model is overhead, not value.*
- Users invoke ILE-1 but maintain a parallel personal workaround system for "real" tracking. *Implication: trust in the system isn't established.*
- Reactive behaviors' proposed transitions are rejected > 40% of the time. *Implication: the automation model is noisier than helpful.*
- Backlog entropy (S3 signal) rises above 50% within 3 months. *Implication: the source of truth is not being maintained; users are logging intakes but letting them rot. The entire thesis depends on this not happening.*

### Kill Criteria

Explicit thresholds where "kill-or-pivot" is the decision. Each criterion specifies decision ownership, observation window, and pivot pathway — otherwise the criteria are decorative.

**Kill 1: Adoption failure.**
- Trigger: L2 week-1 invocation rate < 30% across active cohort
- Decision owner: John + Winston (joint call); Amalik solo if both unavailable
- Observation window: sustained across weeks 1–4 (not a single-week reading)
- Pivot pathway: party-mode re-evaluation session; Vortex sub-discovery if persona/scope questions surface; otherwise restrict to maintenance-only investment

**Kill 2: Reactive layer failure.**
- Trigger: reactive behaviors' proposed transitions rejected > 60%
- Decision owner: John + Winston (joint call)
- Observation window: sustained across a 2-week window with ≥ 20 proposed transitions (data-point floor)
- Pivot pathway: disable reactive layer in config; spike on tightened event model before re-enabling

### Technical Acceptance Criteria (Quality Gates)

| # | Criterion | How Verified |
|---|-----------|--------------|
| TAC1 | Propose-before-commit on all enumerated uncertain-case fixtures: (a) partial artifact — required frontmatter missing; (b) race condition — two skills write same file within the same session; (c) moved file — artifact in git history but not current tree; (d) empty-but-present — file exists, zero bytes | Fixture-based test suite in `tests/lib/reactive-behaviors.test.js` |
| TAC2 | `convoke-doctor` green post-install, with ILE-1 schemas understood | CI gate: `python-test` + `convoke-doctor` exit 0 in fresh-install fixture. Implicit MVP scope: doctor extended to know ILE-1 schemas. |
| TAC3 | Cross-skill round-trip semantic parseability | Integration test: skill A writes → skill B reads → skill A reloads → semantic equivalence (equivalence class: ignore whitespace-only changes and YAML anchor-expansion differences; preserve all key-value pairs, ordering within lists, and comments) |
| TAC4 | ILE-1 skill invocation performance SLO | Bench test in `tests/perf/ile-invocation.test.js`: median < 5s, p99 < 15s, on a typical Convoke-scale backlog (< 500 items). Run in CI as a soft gate (warns but doesn't fail to avoid flake). |

*Note: schema-freeze governance is a process commitment — documented in the Change Management section of the PRD, not verified as a technical acceptance criterion.*

### Observability Signals (MVP-grade)

System-push signals that warn when something is going wrong *before* users complain. All computed from existing Change Log + backlog parsing — no fancy instrumentation required.

- **S1: Reactive-behaviors misfire rate** — of proposed state changes, what % are accepted vs. reverted by the user?
- **S2: Qualifying-gate abandon rate** — triage sessions started vs. completed. Target: < 20%.
- **S3: Backlog entropy** — % of items stuck in the same stage for > 14 days. Rising entropy signals logged-but-not-qualified intake accumulation.
- **S4: Cross-skill inconsistency** — when portfolio-status and initiatives-backlog disagree on a field's value (staleness detector finds the diff). Target: 0.

## Product Scope

### MVP — Minimum Viable Product

Essential for proving the Portfolio-as-Code thesis. Six items (core + observability + onboarding). *Scope amended 2026-04-18 post-Journey-review to reflect capabilities that Step 4 surfaced as MVP-necessary.*

1. **Shared data model** — frontmatter schema + parseable markdown tables across all three skills. Doctor-aware (extends `convoke-doctor` to validate ILE-1 schemas — TAC2 verification).

2. **Portfolio-status lifecycle-aware view**. Stages, lanes, WIP signals.
   - *Sub-requirements:* one-keystroke portfolio filter; staleness-flag filter; observability signals summary surfaced at top of output; drill-down from signal to event history; performance at consulting scale (60+ items across 10+ portfolios).

3. **Reactive behaviors (trust-preserving)**. Intake orphan scan at qualifying gate (per-item confirmation), staleness detection on sprint close (including raw intakes), artifact→stage *proposal* (not auto-commit) on artifact creation. Propose-before-commit contract enforced against the 4 enumerated fixtures (TAC1).
   - *Sub-requirements:* per-item orphan confirmation (not batch); configurable artifact validity contract per team convention; per-initiative config override (artifact path, branch, custom validity); review mode shows prior scoring rationale alongside current values.

4. **Integration contracts** between the three skills — shared model + cross-skill round-trip tested (TAC3).

5. **Observability (S1–S4)** — the 4 system-push signals computed from Change Log + backlog parsing.
   - *Sub-requirements:* signals surfaced in portfolio-status output (summary at top); drill-down from summary to event-level history; threshold-aware flagging (automatic callout when a signal degrades past a per-signal threshold).

6. **Onboarding UX (NEW)** — progressive-disclosure bootstrap (minimal lifecycle process initially, full canonical process available on demand); on-demand contextual help sub-command available at any point in any ILE-1 skill (`explain lanes`, `why RICE?`, `what does this flag mean?`); persona-matched RICE calibration examples (OSS-solo vs. enterprise-consulting).

### Growth Features (Post-MVP)

Makes it competitive, not essential for MVP:

- **Additional view modes** in portfolio-status (beyond the MVP view — separate pipeline completeness dashboard, list view, dependency graph view)
- **Kanban view** as a distinct view mode (if not chosen as the MVP view)
- **Full auto-commit reactive behaviors** — graduated trust based on observed reliability (reactive misfire rate below threshold)
- **Epic-completion cascading** — auto-close absorbed items, auto-unblock dependents
- **Flow metrics computed from stage transition timestamps** — throughput, lead time, flow efficiency
- **Cross-initiative dependency visualization**
- **Client-facing export** — kanban/pipeline rendered as HTML for client review
- **WSJF as alternative prioritization** alongside RICE
- **Doctor extensions for future schema evolution** — versioned schema migration support

### Vision (Future)

The dream version, not committed, not blocking MVP:

- BRM lifecycle tracking (Identify → Analyze → Deliver → Sustain) — full post-Done benefits observation
- OKRs linked to initiatives (strategic objective tree above portfolio)
- Adaptive governance: rolling reforecasting + scenario planning
- Stakeholder engagement as managed theme
- Value-stream funding models (Lean Portfolio Management)
- Autonomous portfolio management within human-set guardrails
- ESG / sustainability as portfolio criteria

## User Journeys

### Journey 1: Priya, Consulting Team Lead — Monday Morning Context Re-Entry (Success Path at Scale)

**Opening Scene.** Monday 9:04am. Priya leads a 4-person consulting team running ten concurrent engagements with 60+ active initiatives across her firm's portfolio. She opens her IDE needing to realign her whole team — but first must remember where every engagement stands.

**Rising Action.** Before ILE-1, this took 30+ minutes of archaeology across initiative files. Today she invokes `convoke-portfolio-status`. In under 30 seconds she sees the Kanban view — filtered by portfolio (a one-keystroke filter, visible by default). Two cards are flagged: staleness detector says they haven't moved in 18 days.

**Climax.** Priya clicks the flagged "fintech-compliance-gap-audit" card and invokes `convoke-enhance-initiatives-backlog review` on it. In 20 seconds she sees: current RICE, last rescore date, 2 blocking dependencies, artifacts present (Brief only — no PRD yet), and a proposed next step. She updates RICE (compliance deadline shifted), leaves a note for her team, returns to the kanban.

**Resolution.** By 9:12am — 8 minutes in — Priya has re-entered context on all 60+ initiatives, identified the 3 needing her attention this week, and assigned a team member to start the PRD on the flagged item. Monday standup runs 15 minutes instead of 45.

**Capabilities revealed:** Portfolio-status kanban with one-keystroke portfolio filter (MVP #2); performance at consulting scale (TAC4 includes 60+ items fixture); staleness detector (MVP #3, S3); review mode with full context; navigation continuity.

---

### Journey 2: Priya — New Finding Intake from a Code Review (Per-Item Orphan Confirmation)

**Opening Scene.** Wednesday afternoon. Priya's senior engineer paste-drops a 600-word code review transcript: 12 findings across security, performance, test coverage, and architecture.

**Rising Action.** Priya invokes `bmad-enhance-initiatives-backlog triage`. The skill extracts 12 intakes into §2.1 — every finding captured. Then the qualifying gate: per finding, confirm Lane + Portfolio + RICE.

**Climax.** Halfway through, the orphan-intake scanner proposes attachments. Critically, it presents each proposal **individually** — not as a batch. Priya reviews each: "Finding #5 → AUTH-REWRITE?" → *yes*. "Finding #7 → AUTH-REWRITE?" → *no, this is about a different auth flow*. Two other proposals turn out to be duplicates; she flags them.

**Resolution.** In 8 minutes: 12 findings triaged, 9 qualified (6 Fast, 3 Initiative), 2 attached to existing initiatives, 1 pinned as raw intake. Zero mis-routes. Change Log documents the session.

**Capabilities revealed:** Triage mode ingest → extract → §2.1 audit trail; qualifying gate per-intake with qualifier identity; per-item orphan confirmation (MVP #3 correction, not batch); duplicate detection signal.

---

### Journey 3: Priya — Reactive Stage Advance with Proposal (Trust-Preserving Edge Case)

**Opening Scene.** Friday. Junior consultant Sam drafts a PRD for the fintech compliance initiative.

**Rising Action.** The reactive layer detects the new file. The validity check finds: `status: draft` in frontmatter, referenced architecture file doesn't exist. System *proposes* the stage advance — does not commit silently. Next time Priya invokes portfolio-status, she sees a pending proposal.

**Climax.** *(Open question for Architecture: conflict resolution.)* If Priya had manually advanced the stage before seeing the proposal, the proposal must gracefully merge or supersede — not duplicate or conflict. Assuming no conflict: Priya reviews, accepts — the PRD is substantive enough despite draft status. S1 reactive-acceptance signal ticks up.

**Resolution.** If rejections start piling up past 40%, the falsification criterion fires. Trust is earned incrementally.

**Capabilities revealed:** Artifact-presence → propose-before-commit (MVP #3, TAC1); partial-artifact fixture (TAC1a); observability S1; open question: conflict resolution.

---

### Journey 4: Marcus, Solo Practitioner — First-Session Onboarding with Progressive Disclosure + Model Understanding

**Opening Scene.** Marcus is an OSS maintainer juggling 7 active repos. He's just run `convoke install`. No existing lifecycle backlog.

**Rising Action.** Marcus invokes `bmad-enhance-initiatives-backlog`. The skill offers Create mode. The skill bootstraps a **minimal** lifecycle backlog — not the full 300-line canonical process. A 2-line note: *"full lifecycle process available when you're ready."* Then: "Got some items to add?" Marcus dumps 14 items from his personal Notion doc.

**Climax.** The skill extracts 14 intakes into §2.1. For the qualifying gate, it shows calibration examples matched to Marcus's persona (solo OSS: reach = # users affected, effort = rough dev-days) — not enterprise consulting examples. Before qualifying item 5, Marcus types `explain lanes`. The skill returns a 3-sentence contextual explanation with 2 examples drawn from his own gathered intakes. Before qualifying item 8, he types `why RICE?` — gets a 2-sentence answer on why per-factor scoring beats single-dimension priority. He proceeds with confidence.

**Resolution.** Marcus has his first lifecycle backlog, right-sized to his context. L1 session completion ticks +1. Next week he invokes portfolio-status twice and triages 3 new intakes — L2 week-1 invocation ticks +1. By week 4 he's abandoned Notion.

**Capabilities revealed:** Create mode with progressive disclosure (MVP #6); on-demand contextual help sub-command (`explain X`, `why Y?`) — MVP #6; persona-matched RICE calibration (MVP #6); smart defaults for qualifying gate; first-session completion flow (L1).

---

### Journey 5: Priya — When Things Go Wrong (Failure Recovery)

**Opening Scene.** Three weeks in. Priya notices a mess: ~40 raw intakes accumulated after she got busy. Reactive layer proposals keep getting rejected — something's off.

**Rising Action.** Priya invokes review mode scoped to raw intakes. The skill walks through each: "still relevant?", "archive?", "qualify now?". She rapid-fires: 12 archived, 20 qualified (batch with similar-item defaults), 8 deferred. Then she checks observability: S1 reactive acceptance at 45% — below the 60% rejection threshold but trending wrong.

**Climax.** She investigates. The reactive layer keeps proposing "PRD created → stage to In Pipeline" on draft PRDs. Her team's convention: PRDs stay `status: draft` until IR passes. Every propose-advance is premature. She edits her team's artifact validity contract: *"treat `status: draft + IR present` as the advance trigger, not just PRD file exists."* S1 starts climbing.

**Resolution.** A week later S1 is at 75%, S3 has dropped. Failure recovered through **configuration, not code change**. Validity contract is tunable per team convention.

**Capabilities revealed:** Raw-intake rot detection (staleness detector extended — MVP #3); observability signals guide diagnosis (S1, S3); configurable artifact validity contract (MVP #3 sub-requirement); failure modes recoverable without code changes.

---

### Journey 6: Priya — Client-Facing Export (Growth Feature)

**Opening Scene.** Quarterly client review. Client wants visibility into engagement status.

**Rising Action.** Priya invokes client-facing export — renders the relevant engagement's portfolio view as clean HTML/markdown with privacy controls: internal notes, unqualified intakes, items tagged `internal` are redacted.

**Resolution.** Client sees the lifecycle state Priya sees, in presentable form, with nothing sensitive leaking.

**Capabilities revealed:** Client-facing export (Growth, not MVP); privacy/visibility controls ship with the feature, not as an afterthought.

---

### Journey 7: Diego — Inheriting a Backlog Mid-Engagement (Assigned User)

**Opening Scene.** Diego is a mid-level consultant assigned to Priya's fintech compliance engagement in week 6. Backlog has 22 active initiatives. He's never used ILE-1 before; his colleagues already have.

**Rising Action.** Day 1, Diego clones the engagement repo, invokes portfolio-status. He sees the kanban but doesn't understand what "Qualified" vs "In Pipeline" means or why some items are flagged. He invokes the contextual help sub-command — gets a short explanation with the option to explore deeper only if he wants.

**Climax.** A senior consultant messages: "Pick up the staleness-flagged items from last sprint." Diego filters by staleness flag — sees 2 initiatives. He invokes review mode on the first. The skill shows prior RICE scoring *rationale* (not just numbers) — *"why R was 7, why E dropped to 3."* Diego updates confidently because context is visible, not buried in a separate doc.

**Resolution.** End of day 1: Diego has contributed to 2 initiatives. He learned the system through doing, not through reading 300 lines upfront. L1 completion +1 via productive use, not orientation.

**Capabilities revealed:** Contextual help at any point — MVP #6; staleness-flag filter (MVP #2 sub-requirement); review mode shows prior scoring rationale (MVP #3 sub-requirement); learn-by-doing onboarding for inheriting users.

---

### Journey 8: Priya Discovers an Observability Signal Degrading

**Opening Scene.** Week 3. Priya invokes portfolio-status and notices a new section at the top: **Observability signals (last 7 days)**. S1 reactive acceptance is 52% — down from 78% last week. The system flagged this as worth noticing (threshold-aware).

**Rising Action.** Priya invokes the observability drill-down. Sees: 11 of the last 22 reactive proposals were rejected by Sam, all on the auth-rewrite initiative. She messages Sam: "What's going on?" Sam replies: "I've been working in a branch with a different PRD file. Reactive layer keeps proposing on the main PRD; my work is on the branch one."

**Climax.** Priya configures a per-initiative path override in the initiative's frontmatter: `prd_path: ./branches/sam-rework/PRD.md`. The reactive layer reads the right file. Next 10 proposals have 8 acceptances. S1 climbs back toward 80%.

**Resolution.** Observability surfaced real drift; user investigated; fixed through configuration. No code change, no bug ticket. The system taught the user what was wrong by making it visible.

**Capabilities revealed:** Observability signals summary in portfolio-status output (MVP #5 UX surface); drill-down from signal to event history (MVP #5); per-initiative configuration override (MVP #3 sub-requirement); failure modes surface as config opportunities.

---

### Journey Requirements Summary

Eight journeys reveal the following capability set:

| Capability | Journeys | MVP item |
|---|---|---|
| Shared data model with frontmatter schema | 1,2,3,4,5,7,8 | MVP #1 |
| Portfolio-status lifecycle-aware view, filter/grouping, staleness-flag filter | 1,5,7 | MVP #2 (filter sub-requirements) |
| Observability summary + drill-down UX surface | 8 | MVP #5 UX sub-requirement |
| Triage: ingest → extract → §2.1 | 2,4,5 | MVP #3 |
| Qualifying gate + per-item orphan confirmation | 2,4,5 | MVP #3 |
| Reactive behaviors (propose, not commit) | 1,3,5,8 | MVP #3 |
| Staleness detector (including raw intakes) | 1,5,7 | MVP #3 |
| Configurable artifact validity contract + per-initiative config override | 3,5,8 | MVP #3 sub-requirement |
| Cross-skill integration round-trip | 1,2,3,8 | MVP #4 |
| Observability S1–S4 with threshold-aware flagging | 1,3,5,8 | MVP #5 |
| Progressive-disclosure onboarding + model-understanding delivery | 4,7 | MVP #6 |
| On-demand contextual help sub-command | 4,7 | MVP #6 |
| Persona-matched RICE calibration examples | 4 | MVP #6 |
| Review mode shows prior scoring rationale | 7 | MVP #3 sub-requirement |
| Performance at consulting scale (60+ items) | 1 | TAC4 fixture |
| Client-facing export with privacy controls | 6 | Growth |

Every MVP capability is exercised by at least one journey. Journey 6 confirms Growth roadmap has real user pull.

### Architecture-Phase Open Questions (from Journey Review)

These surfaced during Journeys but are Architecture-phase decisions, collected here and carried forward to Step 7:

- **Rendering medium** for portfolio-status output: terminal text, markdown-rendered, dedicated viewer, or other
- **Interaction pattern** for filter/configuration: interactive conversation vs. CLI flag vs. slash sub-command
- **Reactive detection mechanism**: file-watch, git-hook, explicit skill invocation, or scheduled scan
- **Conflict resolution** when user edit + reactive proposal collide on the same item
- **Failure UX surface**: where observability signals and reactive proposals appear in-product
- **Minimal lifecycle-process subset** for progressive-disclosure bootstrap: which sections survive, which collapse

### UX Quality Risk

*Invocation experience clumsiness risk:* if Claude Code conversation flow is slow or ambiguous, the journeys' stated durations (8-minute triage, 30-second re-entry) become 25 minutes or 3 minutes in practice. Flagged for a dedicated UX sub-review after MVP ships.

## Domain-Specific Requirements

ILE-1's domain is `devtools + governance`. It has no direct regulatory mandates but operates in contexts that inherit compliance and technical concerns from its users and the surrounding framework.

### Compliance & Regulatory (Inherited Context)

ILE-1 has no direct regulatory compliance mandates. It inherits considerations from target users working in regulated consulting (finance, healthcare, government):

- **Data residency — state.** The lifecycle backlog (a markdown file with structured frontmatter) is written only to the user's local git repository. ILE-1 performs no network I/O with the backlog file contents.
- **Data residency — conversation.** LLM agent inputs and outputs are governed by the user's chosen LLM provider's data handling policies (Anthropic for Claude Code; Microsoft/GitHub for Copilot; OpenAI/Anthropic for Cursor). ILE-1 adds no additional data transit and makes no additional data-handling guarantees beyond those the LLM provider itself provides. Users are responsible for not embedding sensitive content (API keys, credentials, customer PII) in backlog notes, since that content will reach the LLM provider as conversation context.
- **Compliance posture.** The architecture does not introduce new data-residency compliance barriers — lifecycle state stays local. Specific framework compliance (HIPAA, GDPR, SOX, etc.) depends on the user's broader environment, LLM provider choice, and operational controls. ILE-1 is a component, not a compliant solution.
- **Audit trail — application layer.** Append-only is enforced at two layers: (a) the skill's write operations target only Change Log offsets ≥ current EOF; (b) a pre-commit validator (installed via `convoke-update`) rejects non-append edits to the Change Log section. Direct markdown edits bypassing the skill can still edit prior entries, but the pre-commit gate catches them before the edit reaches git. Qualifier identity and timestamps are recorded for every gate decision, rescore, or lane move.
- **Audit trail — git layer.** Git history preserves the modification trace of the backlog file. Note: git history can be rewritten via privileged operations (`filter-branch`, `push --force`). For strict audit-trail requirements, combine ILE-1 with git-server-side hooks enforcing append-only writes.

### Technical Constraints

- **Single-user-per-repo model.** ILE-1 is designed for one lifecycle backlog per git repository. Multi-user real-time collaboration is explicitly out of scope. If multiple collaborators edit the same backlog concurrently, standard git merge conflicts apply. ILE-1 does not provide semantic merge assistance for lifecycle-state conflicts (two users advancing the same initiative's stage, for example, produces a conflict git can't auto-resolve).

- **Invocation atomicity — single-invocation-per-backlog.** One ILE-1 skill can run at a time against a given backlog file. A simple per-backlog lockfile (`.ile.lock` adjacent to the backlog) is acquired at skill start and released at skill end or on process exit. Second invocation during an active session detects the lock and refuses with a clear message. No multi-invocation coordination needed in v1.

- **Markdown-first, agent-readable.** All state must be human-readable markdown with structured frontmatter. No binary formats, no opaque encodings.

- **Schema versioning.** The lifecycle backlog frontmatter carries an explicit `schema_version` field (integer, incremented on any breaking change).
  - *Breaking-change policy:* any schema change that renames a field, removes a field, or changes a field's semantic interpretation is a breaking change and triggers a schema-version bump.
  - *Cross-version read:* v1.N skills can read v1.(N-1) backlogs with a deprecation warning. Cannot read v1.(N-2) or earlier — must migrate first.
  - *Migration trigger:* migrations run automatically on invocation when a version mismatch is detected, after user confirmation. Users can opt into `--migrate` explicit mode for CI contexts.

- **Per-initiative config location.** Per-initiative configuration overrides (artifact paths, custom validity contracts, branch mappings) live in the **initiative file's frontmatter** under a `config:` key. This keeps configuration portable with the initiative — rename or move the file and config travels with it. Team-level defaults live in `_bmad/bme/config.yaml`; initiative-level values override team defaults.

- **BMAD compatibility.** ILE-1 ships as Convoke skills within the BMAD framework. It must satisfy BMAD's agent-skill contract (SKILL.md activation, workflow.md orchestration, step-file architecture) and pass `convoke-doctor` validation. **Version compatibility:** ILE-1 v1 must work on both BMAD v6.2 (current default) and v6.3 (post-migration), OR its release must be explicitly gated behind v6.3 shipping — Architecture-phase decision required.

- **Performance at consulting scale.** TAC4 fixture specifies 60+ initiatives across 10+ portfolios. This is an initial estimate based on Priya's persona — revisit if early user feedback indicates consulting-firm scale is larger (100+, 500+) or smaller (20-30).

### Integration Requirements

- **With existing Convoke skills.** Integration contracts defined between the three reworked skills (initiatives-backlog, portfolio-status, migrate-artifacts). Cross-skill round-trip parseability verified (TAC3).

- **With BMAD framework.** Registered in `_bmad/_config/agent-manifest.csv`, validated by `convoke-doctor`, installable via `convoke-update`. Schema extensions to the doctor are an MVP scope item (TAC2).

- **With git.** Lifecycle backlog is a file in the user's repo. Must survive standard git workflows (merge, rebase, cherry-pick) without corruption. Merge conflicts should produce readable diffs, not binary garbage.

- **With LLM coding agents.** Claude Code is v1's primary target. Copilot and Cursor support is inherited from the existing Convoke skill portability pipeline.
  - *Portability validation (`bmad-validate-exports` pass criteria for ILE-1):* (a) ILE-1 frontmatter fields serialize to platform-specific format without loss; (b) round-trip parseability — the exported format can be re-imported without semantic drift; (c) golden-file comparison per platform stored in `tests/portability/ile-1-golden/{platform}/*.md`; (d) no ILE-1-specific keywords or fixture-path references leak into the exported instructions.
  - *Untested platform behavior:* the Convoke skill manifest declares `supported_platforms: [claude-code, copilot-via-export, cursor-via-export]` for ILE-1 skills. Installation on an unlisted platform emits a warning, installs the skill files anyway (they are just markdown), and flags in `convoke-doctor` output: *"ILE-1 not validated on `<platform>`; behavior may be degraded."*

### Standards Alignment

ILE-1 draws terminology and patterns from established portfolio/program management standards:

- **PMI Standard for Portfolio Management (4th Ed)** — portfolio attachment, strategic alignment
- **PMI Standard for Program Management (4th Ed)** — qualifying gate as program-level governance
- **MSP 5th Edition** — vision + target operating model framing (Growth work)
- **SAFe Lean Portfolio Management** — portfolio kanban, WSJF as alternative prioritization (Growth), flow metrics (Growth)
- **PMI Benefits Realization Management Practice Guide** — BRM lifecycle (Vision roadmap)

**Verification mechanism.** User-facing terminology referencing the portfolio/program management domain must either: (a) cite the source standard with the exact term's definition, or (b) explicitly document any Convoke-specific reinterpretation as a deliberate divergence.

**Operational commitment.** A living terminology glossary is maintained at `docs/standards-terminology.md` in the Convoke repo. Each entry: term, Convoke usage, source standard + exact source definition, any deliberate Convoke-specific reinterpretation. The glossary is updated *before* the code change that introduces or alters a term — enforced as a PR review checklist item.

**Reviewer pass** (post-hoc quality gating): before any major release (v2.0, v3.0, etc.), a standards-savvy reviewer (external if needed) compares the glossary against user-facing strings in the codebase and flags drift. Deviating from standard usage (e.g., inventing a new "stage" that doesn't map to either Portfolio Kanban or PMBOK lifecycle phases) undermines the positioning and must be a conscious, documented choice — not drift.

### Domain Risks & Mitigations

| Risk | Mitigation |
|---|---|
| **Source-of-truth rot** (backlog falls out of date faster than updated) | Falsification criterion (S3 backlog entropy > 50% in 3 months); staleness detector extended to raw intakes (MVP #3) |
| **Frontmatter convention drift** (user conventions diverge from reactive-layer assumptions) | Configurable artifact validity contract per team convention (MVP #3 sub-requirement); per-initiative config override |
| **Single-user bottleneck at qualifying gate** | Any of 3 authorized roles (Vortex, John, Winston). Delegation mechanics deferred (open question) |
| **Standards misuse** (terms borrowed but reinterpreted) | Source citations required; reinterpretation documented; terminology glossary in repo; standards-savvy reviewer pass before major releases |
| **LLM-agent portability** (ILE-1 works in Claude Code but breaks in Copilot/Cursor) | MVP uses existing Convoke skill export pipeline; ILE-1 schemas must pass `bmad-validate-exports` per target platform with golden-file comparison |
| **LLM provider availability** (Claude API outage disables ILE-1) | Inherited BMAD-wide risk. Mitigation: graceful failure messaging when provider is unreachable; offline-readable backlog (markdown is always readable without the agent) |
| **Context-window cost at scale** (backlog content in every session as context; token cost scales with backlog size) | Summary-first rendering in portfolio-status (emit aggregate signals before full item lists); drill-down on demand. Long-term: per-session context pruning. |
| **Schema evolution / data migration** (post-MVP schema changes risk existing-backlog data loss) | Versioned schema in frontmatter; breaking-change policy; automatic migration on invocation with user confirmation; TAC4 extended with migration-round-trip test when first schema change ships |

## Innovation & Novel Patterns

### Christensen-Honest Framing

ILE-1 is **sustaining innovation with a disruptive delivery mechanism**. Three of its four innovation claims (context re-entry UX, standards-grounded lifecycle, trust-preserving reactive automation) improve PM tools on dimensions incumbents already compete on — that's sustaining. One claim (git-native markdown + agent-as-management-system) enters a segment (developer teams in regulated consulting) that incumbents underserve — that's potentially disruptive delivery.

This framing justifies Strategic Decision 2 from the vision phase (capability-differentiation first, category-creation optional later). ILE-1 is not a new PM category; it is a better PM tool for an underserved segment. "Capability-differentiation" is the correct Christensen read.

### Positioning Framings

Three complementary framings sit above the feature-level claims. All three are defensible; each speaks to a different audience. No single primary hook is declared — different channels may emphasize different framings.

**Framing A — Lifecycle-as-Commit-Discipline.**
Every lifecycle transition is a commit. Qualifying a gate is a commit. Rescoring is a commit. Advancing a stage is a commit. The lifecycle history IS git history. Portfolio decisions can be bisected, blamed, branched, merged. Git's primitives become portfolio governance primitives. Strongest when pitching to developers who think in git-native terms.

**Framing B — Agent-Accountable Decisions.**
Every automated proposal carries a full audit chain: artifact → signal → proposal → decision → decider. Qualifier identity and timestamp attached to every decision. Explainable automation for PM — a step toward what the PMO industry calls "explainable AI in governance." Strongest for regulated or governance-sensitive audiences.

**Framing C — Zero-Install Enterprise Governance.**
Enterprise-grade lifecycle governance without enterprise installation cost. Teams already in the IDE get PM capability without onboarding friction, without per-seat licensing, without data residency concerns. Strongest on adoption-economics for teams previously blocked from enterprise PM tooling by cost or compliance.

### Detected Innovation Areas (Feature-Level Claims)

**1. Portfolio-as-Code as a delivery application.**
Novel *application* of an established pattern (structured-data-in-git), applied to a domain (portfolio/program management) that hasn't received this treatment. The "agent conversations + markdown contracts" combination is uniquely ours; the structured-data-in-git half is inherited from Backstage, Jira-as-Code efforts, GitHub Projects.

**2. Trust-preserving reactive automation.**
Novel as a *design-stance commitment*, not a technical invention. When the category default is maximal automation (Linear auto-triage, GitHub Actions fire-and-forget), propose-before-commit for uncertain cases is a deliberate inversion we haven't seen in PM tooling. Technically replicable; defensibility rests on execution discipline — TAC1 fixture-based enforcement, S1 observability, Kill 2 automatic shutdown.

**3. Standards-grounded × developer-native delivery.**
The *combination* is rare, not each part alone. Vendors like ServiceNow, Planview, Planisware are standards-grounded but hosted-SaaS. Developer-native tools like Linear are opinionated but not standards-grade. No widely-adopted developer-native implementation of PMI/MSP/SAFe LPM exists. (Not exhaustive competitor analysis; if counter-evidence emerges, revise.) SaaS incumbents can add agent interfaces but remain architecturally bound to hosted storage — incompatible with the no-cloud compliance posture ILE-1 offers. Structural advantage for regulated-consulting users specifically, not a general moat.

**4. Configurable reactive (validity) contracts.**
Jira/Linear/GitHub Actions have configurable *rule-based* event automation ("when X happens, do Y"). ILE-1 introduces configurable *validity contracts* ("propose Y only if artifact passes check Z"). The configurability is about what counts as a trustworthy signal, not what to do when the signal fires. Mid-claim novelty: applied in a new way for PM tooling.

### Market Context & Competitive Landscape

(Synthesized from web research during Brief phase; not re-run.)

- **Direct competitors in AI-native project/portfolio management** — none operate as agent-native in the IDE. Linear adds AI to a database. Notion AI augments a wiki. Dart PM / Airplane.dev / Magic Loops are AI-first SaaS. Devin / Sweep are agentic but focused on code tasks, not portfolio.
- **Adjacent — code/markdown-native work management** — GitHub Projects, Plane.so (Linear OSS alternative), Backstage (Spotify, closest structural analog but for infrastructure, not initiatives). None apply structured-data-as-repo-file to *initiatives*.
- **Standards frameworks** — PMI, MSP, SAFe LPM have no widely-adopted developer-native implementations. PMI's forthcoming *Standard for AI in Portfolio, Program, and Project Management* (public comment closed late 2025) signals institutional recognition; no reference implementation exists yet.
- **Analyst coverage** — "AI-Augmented Software Engineering" near Peak of Inflated Expectations (Gartner 2025). "Agentic coding" category is hot. Portfolio/lifecycle management *within* agent workflows is an unoccupied niche.
- **Gartner 2026 PPM predictions** — Gartner signals autonomous decisioning as the 2026 direction in SPM. ILE-1's reactive-behaviors layer is a step toward that — trust-preserving, human-in-loop, automating the decisions that *can* be automated.

### Validation Approach

Validation is split into two tiers. **Innovation/thesis-level signals override adoption-level signals** in decision-making — green adoption dashboards do not validate an innovation whose hypotheses are unconfirmed.

**Adoption-level validation (weeks 1–12 post-MVP):**
- L1 first-session completion ≥ 70%
- L2 week-1 invocation rate ≥ 50%
- M2 weekly adoption ≥ 80% of active cohort
- S1 reactive acceptance ≥ 60% and climbing

These signal that users are adopting and staying engaged. They do NOT validate the innovation thesis — users could adopt for non-innovative reasons (novelty, team policy, low friction).

**Innovation/thesis-level validation (3–6 months):**
- M1 hypothesis: "Context re-entry time is the bottleneck in altitude switching." Target < 60s validates the thesis.
- M3 hypothesis: "Manual re-routing is costly enough that automating 80% solves the pain." Hit target → thesis validated.
- M4 hypothesis: "Unprompted user feedback within 6 months is a real adoption signal." ≥ 1 engagement citing ILE-1 as adoption factor validates thesis.
- Falsification criteria (Success Criteria section): four explicit disconfirmations. If any fires, the Portfolio-as-Code thesis is falsified — not just misexecuted.

**Scheduled innovation reviews (closed-loop machinery):**
- **Month 3 post-MVP:** explicit walkthrough of M1–M4 hypotheses + falsification criteria. Attendees: John + Winston + Amalik. Output: innovation-status decision (validated / unvalidated / falsified).
- **Month 6 post-MVP:** repeated walkthrough, plus explicit yes/no on each falsification criterion. Output: continue / pivot / sunset.

Without these scheduled reviews, adoption-level metrics will drown out innovation-level signals, and the team will celebrate green dashboards while the thesis fails silently.

### Risk Mitigation

Novel patterns carry adoption risk. Known risks and mitigations:

- **Category-creation risk.** Strategic Decision 2 (vision phase): capability-differentiation first, category-creation ambition optional later. No market-education work committed in v1.
- **First-mover disadvantage.** If competitors replicate, ILE-1's defense comes from specific execution disciplines: TAC1 fixture-based enforcement of propose-before-commit (makes correctness auditable); S1 observability as early-warning + Kill 2 automatic shutdown (prevents trust collapse); structural compliance advantage (no-cloud architecture incompatible with SaaS hosted storage).
- **Reactive-automation trust collapse.** Mitigations: propose-before-commit on uncertain cases (TAC1a–d); fixture-based enforcement in CI; S1 early-warning; Kill 2 threshold.
- **Standards misuse.** Operational terminology glossary in `docs/standards-terminology.md`; standards-savvy reviewer pass before major releases.
- **Innovation mis-identification.** Outcome-metric hypotheses (Success Criteria) catch this — hypothesis-level validation, not usage-level. If users adopt but hypotheses don't validate, the innovation was mis-identified. Scheduled innovation reviews force the team to look at hypothesis signals explicitly.

**Kill Criteria — 3-question diagnostic framework.**

At the moment a kill criterion fires (Success Criteria section), run this diagnostic *before* deciding the pivot:

1. **Is execution measurably broken in observable ways?** (S2 qualifying-gate abandon rate > 40%, TAC4 performance failing at scale, UX clumsiness reported by multiple users)
   → YES → **execution pivot**: fix the broken UX/performance before declaring innovation failure.
2. **Is the hypothesis formally falsified?** (M1–M4 hypothesis target missed by > 50%, or falsification criterion fired)
   → YES → **thesis pivot**: the innovation claim is wrong; return to strategic framing (not party-mode re-tune).
3. **Is it user-segment fit?** (adoption in one persona segment, rejection in the other — e.g., solo practitioners adopt but consulting leads don't)
   → YES → **segment pivot**: scope ILE-1 to the segment that adopts; deprecate or re-architect for the rejecting segment.

Pivot pathway from Kill Criteria ("party-mode re-evaluation; Vortex sub-discovery") applies based on which diagnostic lights up.

**Fallback.** If innovation validation fails entirely (reactive behaviors prove too noisy even after tuning, or standards-grounding is rejected as overhead): disable the reactive layer (Kill 2); ship ILE-1 as views-only + qualifying gate. That is still a net improvement over the three-disconnected-skills baseline. The innovation fails gracefully into a capable tool without the novel claim.

## Developer Tool Specific Requirements

### Project-Type Overview

ILE-1 is classified as `developer_tool` with `productNature: capability-layer`. It is atypical for this project-type: not a library, SDK, or framework consumed via `import`. Instead, ILE-1 is a suite of agent-invoked capabilities delivered as part of the `convoke-agents` npm package, operating on markdown contracts in the user's git repository. The CSV's standard lenses (language support, package managers, API surface) map to an unconventional surface area — the skill invocation contract, not a code API.

### Platform Matrix (language_matrix adapted)

ILE-1 is programming-language agnostic at the product layer (it operates on markdown, not code). The relevant matrix is the LLM-agent platform matrix:

| Platform | Support Level | Delivery |
|---|---|---|
| **Claude Code** | Primary | Native BMAD skill invocation |
| **Copilot** | Secondary | Via Convoke skill portability export pipeline |
| **Cursor** | Secondary | Via Convoke skill portability export pipeline |
| **Other** (Codeium, Continue, Aider, etc.) | Unsupported in v1 | Manifest declaration + `convoke-doctor` warning |

Implementation language for supporting scripts (reactive-behaviors engine, shared data model validators, observability computations): **JavaScript** (consistent with Convoke's existing codebase). Python scripts may be used for data-processing pieces aligned with existing Convoke patterns.

### Installation Methods

ILE-1 ships as part of the `convoke-agents` npm package. No standalone installation mechanism.

- **Primary path:** `npm install convoke-agents` followed by `convoke-install` (or `npx convoke-agents init` when S3 ships).
- **Upgrade path:** existing Convoke users get ILE-1 via `convoke-update` after the release. Migration from the pre-ILE-1 three-skill arrangement is handled by a version-gated migration.
- **Version compatibility:** ILE-1 v1 must work on BMAD v6.2 (current default) and v6.3 (post-migration), OR its release is explicitly gated behind v6.3 shipping — Architecture-phase decision per Domain Requirements.
- **No separate SDK/API bindings.** Consumers are agents in Claude Code / Copilot / Cursor. No external code API for third-party integration in v1.

### API Surface (skill invocation contract)

The "API" of ILE-1 is the **skill invocation contract** — what skills exist, what inputs they accept, what outputs they produce.

**v1 skill-level surface:**

| Skill | Invocation | Inputs | Outputs |
|---|---|---|---|
| `bmad-enhance-initiatives-backlog` | User invokes, mode selection (Triage/Review/Create) | Text input (triage), existing backlog file (review), empty state (create) | Appended §2.1 rows, lane rows (qualified), Change Log entries |
| `bmad-portfolio-status` (reworked) | User invokes, optional portfolio filter | Existing backlog file | Kanban view + observability signals summary + drill-down |
| `bmad-migrate-artifacts` (integrated) | User invokes on an artifact | Artifact file + frontmatter | Renamed/relocated artifact; lifecycle stage transition proposal |

**Frontmatter schema** (the data-layer API): backlog frontmatter carries `schema_version`, `initiative`, `artifact_type`, `qualifier`, lane/stage/portfolio fields; per-initiative config lives under `config:`; Change Log is an append-only table (two-layer enforcement: application + pre-commit validator).

**Contextual help sub-commands** (MVP #6):
- `explain <concept>` — context-sensitive explanation of lifecycle concept (lanes, gates, RICE, stages)
- `why <field>?` — rationale for a feature or convention
- `what does this flag mean?` — explains observability signals or validity-check results

**Cross-skill integration contract** (MVP #4): shared data model; round-trip parseability; TAC3 fixture-based integration test.

### Code Examples (usage examples)

The **eight user journeys** from the Journey section are the canonical usage examples for v1.

**MVP ships the following fixtures for test and example purposes:**

*TAC1 reactive-behaviors fixtures:*
- `tests/fixtures/ile-1/partial-artifact.md` (TAC1a — required frontmatter missing)
- `tests/fixtures/ile-1/race-condition.md` (TAC1b — concurrent write)
- `tests/fixtures/ile-1/moved-file.md` (TAC1c — in git history, not tree)
- `tests/fixtures/ile-1/empty-but-present.md` (TAC1d — zero bytes)

*TAC4 performance fixture:*
- `tests/fixtures/ile-1/consulting-scale-backlog.md` (60+ initiatives across 10+ portfolios)

*Error Contract fixtures (per-category, for regression testing):*
- `tests/fixtures/ile-1/errors/user-error-invalid-input.md`
- `tests/fixtures/ile-1/errors/config-error-missing-field.md`
- `tests/fixtures/ile-1/errors/internal-error-corrupted-state.md`
- `tests/fixtures/ile-1/errors/reactive-uncertain-partial-artifact.md` (reuses TAC1a)

*Uninstall partial-state fixtures (for doctor diagnosis testing):*
- `tests/fixtures/ile-1/uninstall-partial/skills-removed.md`
- `tests/fixtures/ile-1/uninstall-partial/hooks-stale.md`
- `tests/fixtures/ile-1/uninstall-partial/config-orphan.md`

*Portability golden files:*
- `tests/portability/ile-1-golden/claude-code/*.md`
- `tests/portability/ile-1-golden/copilot/*.md`
- `tests/portability/ile-1-golden/cursor/*.md`

*Walk-through documentation:*
- `docs/examples/first-backlog-bootstrap-oss.md` (Marcus's Journey 4)
- `docs/examples/consulting-team-monday.md` (Priya's Journey 1)

### Migration Guide (from pre-ILE-1 to ILE-1)

Existing Convoke users have three disconnected skills today. Migration via `convoke-update`:

1. **Run `convoke-update`** — detects pre-ILE-1 installation; runs versioned migration automatically.
2. **Schema migration** — existing backlog frontmatter receives `schema_version: 1`; missing fields populated with defaults; deprecated field names mapped to new ones.
3. **Config migration** — existing `_bmad/bme/config.yaml` gets new ILE-1 entries (team-level artifact validity contract defaults).
4. **Validation pass** — `convoke-doctor` runs; inconsistencies reported.
5. **Backward compatibility** — v1.N skills can read v1.(N-1) backlogs with deprecation warning; no v1 skill reads pre-ILE-1 unversioned backlogs without migration.

**Breaking change policy** (recap): field rename, removal, or semantic reinterpretation = schema-version bump.

**Automatic migration on invocation** (recap): migrations run automatically on version mismatch after user confirmation. CI-friendly `--migrate` mode for non-interactive contexts.

### Error Contract

Errors surfaced by ILE-1 fall into four categories, each with defined communication semantics. Trust requires users distinguish a *proposal* from an *error* from an *uncertain-state warning*.

| Category | Prefix | Examples | Communication | Exit code (CLI wrapper) |
|---|---|---|---|---|
| **User error** | `[USER]` | Invalid input, malformed command, missing required field | Inline in conversation with specific correction hint | 2 |
| **Configuration error** | `[CONFIG]` | Invalid validity contract, missing required config, unresolved per-initiative override path | Inline with source location | 3 |
| **Internal error** | `[INTERNAL]` | Unhandled exception, corrupted state, integration-contract violation | Inline with reference to logs; user asked to report | 1 |
| **Reactive uncertainty** | `[UNCERTAIN]` | Partial artifact, ambiguous validity check, race-condition detected | Inline *proposal* (not error) with explicit user confirmation required | 0 (not a failure) |

**Design rule:** reactive uncertainty is *never* presented as an error. Errors mean "something is broken and needs fixing"; uncertainty means "I need you to decide." Conflating the two collapses trust.

**Seed error-code registry (v1 ships with these; enumerable per category):**

| Code | Description |
|---|---|
| `USER-001` | Invalid command or unrecognized mode |
| `USER-002` | Required input field missing (field name specified) |
| `USER-003` | Input format mismatch (e.g., malformed markdown table row) |
| `USER-004` | Action refused: operating on path outside project root |
| `USER-005` | Authorized qualifier role required (Vortex/John/Winston only) |
| `CONFIG-001` | Invalid validity contract (malformed YAML or unrecognized fields) |
| `CONFIG-002` | Missing required config field (field name specified) |
| `CONFIG-003` | Per-initiative override path unresolvable (file doesn't exist) |
| `CONFIG-004` | Team-level config conflicts with initiative-level override |
| `CONFIG-005` | Schema version mismatch; migration required |
| `INTERNAL-001` | Unhandled exception in reactive-behaviors engine |
| `INTERNAL-002` | Corrupted backlog state detected (schema parse failed) |
| `INTERNAL-003` | Integration-contract violation (cross-skill round-trip produced semantic drift) |
| `INTERNAL-004` | Lockfile acquisition failed unexpectedly |
| `INTERNAL-005` | Logger state corrupted (logs directory unwritable) |
| `UNCERTAIN-001` | Partial artifact detected (required field missing in frontmatter) |
| `UNCERTAIN-002` | Race condition detected (concurrent write in same session) |
| `UNCERTAIN-003` | Moved file detected (artifact in git history, not current tree) |
| `UNCERTAIN-004` | Empty-but-present file detected |
| `UNCERTAIN-005` | Ambiguous validity-check result (multiple contracts match, conflicting) |

**Registration rule:** new error codes require (a) a CHANGELOG entry, (b) a test fixture that produces the error, (c) a category determination — all committed in the same PR. No ad-hoc codes.

### Dependencies

ILE-1 is **part of the `convoke-agents` npm package** — not a separate distribution. Dependencies are inherited from the package:

**Runtime dependencies (required):**
- **LLM agent provider** — Anthropic (Claude Code), Microsoft/GitHub (Copilot), OpenAI (Cursor). Provider outage disables ILE-1 skill execution; backlog file remains readable without the agent.
- **Git** — lifecycle state lives in the user's git repo; per-initiative config in initiative frontmatter. Git read/write/commit required.
- **Node.js runtime** — supporting scripts are JavaScript.

**Integration components (also within `convoke-agents`):**
- **`convoke-doctor`** — validates ILE-1 schemas and integration contracts
- **`bmad-validate-exports`** — portability CI gate for Copilot/Cursor platforms

**Optional external:**
- **Pre-commit hook infrastructure** — required only if audit-trail strict-mode is installed

**Non-dependencies:** No external network services beyond the LLM agent provider. No telemetry backend, no analytics service, no license server, no update server.

**Version constraint for v1:** Convoke core version = exact same release as ILE-1's own release (since ILE-1 ships within Convoke, versions are inseparable). Compatibility matrix across multiple Convoke versions is deferred to Growth.

### Versioning and Release Cadence

ILE-1 does not have an independent semver trajectory. It ships within `convoke-agents`.

**Product versioning:** ILE-1's version *is* Convoke's version. When `convoke-agents` releases 4.0.0, ILE-1's MVP ships inside it. Release cadence follows Convoke's (ad-hoc, release-when-stable; no monthly/quarterly commitment in v1).

**Schema versioning (separate, additive):** the lifecycle backlog frontmatter carries `schema_version`, a monotonically-increasing integer tracking breaking changes to ILE-1's data contract — independent of Convoke's product version. A Convoke patch does not change schema version; a Convoke minor or major introducing a breaking schema change bumps schema version.

**Convoke semver interpretation for ILE-1-relevant changes:**
- **Convoke major** (4.x.y → 5.0.0) — may include breaking ILE-1 changes (skill removal, breaking schema bump requiring migration)
- **Convoke minor** (4.0.y → 4.1.0) — may include new ILE-1 capabilities (new skill, new reactive behavior, new signal, non-breaking schema extension)
- **Convoke patch** (4.0.0 → 4.0.1) — ILE-1 bug fixes, error-message improvements, performance tuning

**Deprecation policy.** A skill feature or schema field marked *deprecated* is preserved for one full Convoke minor-version cycle (e.g., deprecated in 4.3.0 → removed in 4.5.0 at earliest). Deprecation notices appear in `convoke-update` output and `CHANGELOG.md` with migration guidance.

**Stability commitment for v1:** the frontmatter schema locked by TAC4 is the first stable contract. Breaking it requires a Convoke major-version bump.

### Developer Telemetry and Debug Logging

Debugging reactive misfires without logs is archaeology. ILE-1 ships with developer-facing debug infrastructure:

- **Verbosity flags (scope: all ILE-1 skills):** every ILE-1 skill (initiatives-backlog, portfolio-status, migrate-artifacts for ILE-1 operations) accepts `--verbose` (detailed execution trace) and `--debug` (full state dumps before/after each decision). Default is quiet. Broader Convoke skill verbosity consistency is tracked as Fast Lane item I6, not an ILE-1 responsibility.
- **Log output location:** `_bmad-output/logs/ile-1/{YYYY-MM-DD}.log` (daily-rotated). Includes reactive-layer decisions: artifact path, signal fired, validity check result, proposal made, user response (accepted/rejected).
- **Session recording for post-hoc analysis.** When a user reports "ILE-1 proposed something wrong," logs capture the full decision chain with timestamps. No external transmission; logs stay local.
- **Log retention.** 90-day rolling retention by default, configurable. User can opt out entirely via config.
- **Privacy note:** logs may contain backlog content (descriptions, portfolio names). They are local files governed by the user's git/repo privacy. Recommended to add `_bmad-output/logs/` to `.gitignore` (documented).

### Uninstall and Removal

**v1 approach: manual procedure with doctor-guided cleanup.** CLI uninstall automation (`convoke-update --uninstall ile-1`) is deferred to Growth.

**Manual uninstall procedure:**

1. **Preserve user data.** The lifecycle backlog file is user data — don't touch it. Users who later reinstall resume with their existing backlog (schema-migrated if needed).
2. **Remove ILE-1-specific skill wrappers.** Delete `.claude/skills/bmad-enhance-initiatives-backlog/`, `.claude/skills/bmad-portfolio-status/`, and any other ILE-1-specific skill wrapper directories. The authoritative list ships in uninstall documentation.
3. **Remove pre-commit validator** (if installed for strict audit-trail mode): delete hook files; users can re-init git hooks if desired.
4. **Run `convoke-doctor`** — verifies no ILE-1-specific skill wrappers remain; flags any partial-removal state (orphan wrappers, stale hooks, dangling config references).
5. **Orphan config.** Per-initiative `config:` keys in initiative frontmatter persist as inert fields after uninstall. Hand-remove if desired; no data loss either way.
6. **Logs.** `_bmad-output/logs/ile-1/` preserved for audit purposes. User can manually delete.

**Partial-install recovery.** If uninstall is interrupted mid-operation, `convoke-doctor` post-uninstall detects and reports the partial state (fixtures `tests/fixtures/ile-1/uninstall-partial/*.md`) for manual cleanup.

**Growth scope:** `convoke-update --uninstall ile-1` as a single-command inverse migration automating the manual procedure and adding idempotency guarantees.

### Skipped Sections (per CSV)

- **visual_design** — N/A. ILE-1 is CLI + conversation + markdown output. Rendering medium is an Architecture-phase decision (Domain Requirements open questions), not a visual design task.
- **store_compliance** — N/A. Not distributed through app stores. npm is the package registry; no store-specific compliance.

### Implementation Considerations

- **Reactive event model** — open question in Architecture (file-watch, git-hook, explicit invocation, scheduled scan). Impacts detection latency and UX notification semantics.
- **Observability signal computation** — all four signals (S1–S4) computed from existing Change Log + backlog parsing. No external telemetry. Per-session computation acceptable for MVP; caching strategy deferred to Growth if performance requires.
- **Lockfile mechanism** — `.ile.lock` file adjacent to backlog for single-invocation-per-backlog enforcement. Standard filesystem-based locking.
- **Progressive-disclosure bootstrap** — minimal lifecycle process subset defined in Architecture. Candidates: §1.1 Intake + §1.3 Three Lanes stubs; full §1.2 Qualifying Gate + §1.5 Pipeline Stages on first deep-use moment.
- **Contextual help implementation** — each ILE-1 skill registers a help registry of concepts it owns; `explain <concept>` routes to the registering skill's help content. No central help catalog.
- **Per-platform export validation** — `bmad-validate-exports` extended with ILE-1-specific assertions: schema roundtrip, no fixture-path leaks, golden-file comparison per platform. CI gate.
- **Error-category contract enforcement** — test assertion pattern: every error emitted in tests must carry the Error Contract category prefix (`[USER]`/`[CONFIG]`/`[INTERNAL]`/`[UNCERTAIN]`) and a registered error code. CI gate catches drift.
- **Uninstall round-trip testing** — fixtures for partial-removal states drive doctor-diagnostic assertions. Each partial-state fixture should produce a specific doctor output.

## Project Scoping & Phased Development

### MVP Strategy & Philosophy

**MVP Approach: Problem-solving MVP with integrated skeleton.**

ILE-1's MVP is not a *reduced-feature MVP* nor a *concierge MVP*. It is a **problem-solving MVP with an integrated skeleton** — the smallest coherent product that proves the Portfolio-as-Code thesis end-to-end.

Essentialness has two concepts, not one:

- **Ship-essential items:** MVP #1 (shared data model), MVP #2-basic (lifecycle-aware view), MVP #4 (integration contracts). Without these, there is no integrated product. These cannot be cut without reverting to today's disconnected-skills baseline.
- **Thesis-essential items:** MVP #2-full (with filter/grouping/observability UX surface), MVP #3 (reactive behaviors), MVP #5 (observability), MVP #6 (onboarding UX). Without these, the product ships but the innovation claim is unvalidated. These are what make ILE-1 Portfolio-as-Code rather than "three integrated skills."

The contingency ladder (below) trades thesis-essential items first, preserving ship-essential through every tier.

**Why not a reduced-feature MVP?**
The innovation claim rests on integration (map + audit trail, reactive behaviors feeding observability). Shipping ship-essential without thesis-essential regresses to the pre-ILE-1 baseline. That is a non-shipment, not an MVP.

**Why not a concierge MVP?**
The reactive-behaviors layer is the operational differentiator. Manual-first doesn't test the trust-preserving contract. We want the risk *in* the MVP where we can measure it (S1 acceptance rate) and react.

**Resource requirements for MVP:**
- **Team size:** 1 primary developer + 1 architect (Winston) for design decisions + 1 PM (John/Amalik) for scope/review. Convoke's established model.
- **Skills needed:** JavaScript (supporting scripts), agent-skill authoring (SKILL.md conventions), BMAD framework familiarity, LLM-agent tooling.
- **Parallelism vs. team size:** the dependency graph (below) allows parallel execution of independent branches; Convoke's solo-dev model executes sequentially regardless.

### MVP Feature Set (Phase 1)

Detailed in **Success Criteria → Scope → MVP**. Summary reference:

1. Shared data model (ship-essential)
2. Portfolio-status lifecycle-aware view (ship-essential basic; thesis-essential full)
3. Reactive behaviors (thesis-essential)
4. Integration contracts (ship-essential)
5. Observability (thesis-essential)
6. Onboarding UX (thesis-essential)

**Core journeys supported in MVP:** Journeys 1, 2, 3, 4, 5, 7, 8 — all except Journey 6 (client-facing export, Growth). Every MVP item is exercised by at least one journey.

### Dependency Graph

The MVP items form a graph with 5 edges, not a star:

```
#1 (shared data model, ship-essential, root)
 ├─→ #2 (portfolio-status rework) — partially depends on #5 for UX surface
 ├─→ #4 (integration contracts) — then enables #3
 │    └─→ #3 (reactive behaviors) — depends on #4 for cross-skill consistency
 ├─→ #5 (observability) — computes independently; surfaces through #2
 └─→ #6 (onboarding UX) — independent after #1 stabilizes
```

Independent branches after #1 stabilizes: (#4→#3) and (#2+#5) and (#6). A larger team could parallelize. Convoke's solo-dev model executes sequentially.

### Phased Development Roadmap

**Phase 1 — MVP (post-Architecture through v1 ship).**

Estimated execution: **5–7 Convoke sprints under baseline assumptions** (Architecture decisions clear, reactive-behaviors implementation goes roughly as designed, no major rework). Range: 3 sprints (everything clean, heavy AI-dev acceleration) to 10 sprints (unforeseen Architecture complexity, scope discovery during build, or Tier-1 descope recovery).

Sprint-level decomposition (baseline):
- **Sprint 1** — MVP #1 (shared data model)
- **Sprint 2** — MVP #4 (integration contracts)
- **Sprint 3** — MVP #2 (portfolio-status rework, single view)
- **Sprint 4** — MVP #3 (reactive behaviors with TAC1 fixtures)
- **Sprint 5** — MVP #5 (observability)
- **Sprint 6** — MVP #6 (onboarding UX)
- **Sprint 7** — buffer / polish / integration testing

**Phase 2 — Growth (post-MVP validation, months 3–9).**

Unlocked only after innovation validation passes (scheduled innovation review at month 3). Growth items:
- Additional view modes in portfolio-status
- Full auto-commit reactive behaviors (graduated trust)
- Epic-completion cascading
- Flow metrics from stage transitions
- Cross-initiative dependency visualization
- Client-facing export with privacy controls (Journey 6)
- WSJF as alternative prioritization
- Doctor extensions for future schema evolution
- `convoke-update --uninstall ile-1` CLI automation

**Phase 3 — Vision (months 9+, directional not committed).**

PMI/MSP/SAFe LPM alignment items: BRM lifecycle tracking; OKRs linked to initiatives; adaptive governance with rolling reforecasting; stakeholder engagement as managed theme; value-stream funding models; autonomous portfolio management; ESG/sustainability criteria.

### Risk-Based Scoping

**Technical Risks (ranked by severity):**

1. **Reactive-behaviors event model** (Architecture-phase open question).
   *Risk:* wrong event model (file-watch, git-hook, scheduled, explicit) makes reactive layer either over-eager or too latent.
   *Mitigation:* propose-before-commit contract (TAC1) is correct regardless of event model; event model is a UX-latency decision, not correctness. Explicit invocation is the safest fallback.

2. **Shared data model choice** (Architecture-phase: markdown-as-source vs. structured backing).
   *Risk:* markdown-as-source has scaling limits; structured backing adds implementation cost.
   *Mitigation:* v1 starts with markdown-as-source + parseable frontmatter. If scaling limits hit (TAC4 fails), introduce structured backing in Phase 2 as incremental migration.

3. **Performance at consulting scale** (TAC4 benchmark).
   *Risk:* median-5s / p99-15s target may not hold at 60+ items across 10+ portfolios.
   *Mitigation:* benchmark fixture in MVP; summary-first rendering + drill-down covers common case if failing.

**Market Risks:**

1. **Adoption failure (Kill Criterion 1).**
   *Risk:* L2 week-1 invocation < 30% sustained.
   *Mitigation:* onboarding UX as MVP #6; party-mode diagnostic before declaring innovation failure (execution vs. thesis vs. segment).

2. **Innovation mis-identification.**
   *Risk:* users adopt for non-innovative reasons; hypothesis-level signals remain unvalidated while adoption dashboards look green.
   *Mitigation:* innovation-level signals weighted above adoption-level; scheduled innovation reviews at month 3 + month 6 force hypothesis walkthrough.

**Resource Risks:**

1. **Single primary developer bottleneck.**
   *Risk:* Convoke's solo-maintainer model means illness, context-switching, or competing priorities stretch MVP timeline.
   *Mitigation:* six MVP items are decomposable via contingency ladder (below); ship-essential floor in extremis = MVP #1 + #4 + #2-basic. Not the target MVP, but a safe floor.

2. **LLM-agent platform cost at scale.**
   *Risk:* context-window cost per session grows with backlog size; could bottleneck heavy users.
   *Mitigation:* summary-first rendering in portfolio-status reduces per-invocation context; Growth-phase context pruning if needed.

### Contingency Scope Ladder

**Descope ordering principle:** preserve thesis-essential items (reactive, observability, onboarding) longer; give up polish (calibration examples) first. Each tier down costs more innovation validation.

**Validation-signal impact at each tier** is annotated explicitly. Tiers 2+ require compensating mechanisms (manual user interviews replace missing telemetry); without compensation, tier decisions are made without reliable signal.

| Descope tier | What's cut | What remains | Validation signal impact | Compensation required |
|---|---|---|---|---|
| **Tier 1** (minor stretch) | Persona-matched RICE calibration examples | All 6 MVP items; one polish piece missing | Clean — all signals intact | None |
| **Tier 2** (meaningful stretch) | Onboarding UX progressive disclosure + contextual help | 5 MVP items; onboarding becomes read-the-docs-first | **Signal contaminated** — L1/L2 measure a degraded experience, not the innovation claim | Manual user interviews with first-session users to discriminate degraded-UX signal from innovation signal |
| **Tier 3** (hard stretch) | Observability UX surface (signals still computed, drill-down deferred) | 4 MVP items; observability signals logged but not visible | **Signal lost at user layer** — users can't see S1/S3 degradation; scheduled innovation review loses primary input | Manual log analysis by John/Winston at month 3/6 reviews; user interviews to ask "did you notice X?" |
| **Tier 4** (minimum viable floor) | Reactive behaviors disabled; kanban view minimal; observability internal only | Shared data model + integration contracts + basic views | **Half the validation machinery turned off** — Kill 2 / Falsification #3 can't fire; reactive hypothesis un-testable | Innovation thesis is partially de-committed; v1 ships as "integrated three skills" without the novel claim; Kill 2 fires preemptively |

**Tier 4 as floor:** Tier 4 delivers the ship-essential layer (integration without innovation). It is a coherent, better-than-today product — just not a novel one. Below Tier 4 falls back to the current three-skills baseline with no net gain, so shipping makes no sense.

### Descope Governance

**Descope triggers (any invokes the call):**
- (a) Dev estimates remaining work > 1.5× original estimate
- (b) An Architecture-phase open question blocks progress > 2 weeks
- (c) A TAC fixture is repeatedly failing without clear path to fix

**Trigger precedence (when multiple fire simultaneously):**
1. Architecture blocker (b) takes priority — resolve Architecture question and re-estimate *before* descoping.
2. Fixture failure (c) second — investigate root cause (often linked to an Architecture gap) before descoping.
3. Time overrun (a) last — the "pure" descope trigger applies only when (b) and (c) don't.

**Trigger timing:**
- Trigger (a) — evaluated at sprint retrospective only.
- Triggers (b) and (c) — evaluated continuously.
- **Mid-sprint descope** (triggered by b or c) requires an emergency John+Winston call with rationale logged. No mid-sprint descopes on pure time-overrun basis — wait for retro.

**Decision owner:** John + Winston joint call. Amalik solo only if both unavailable.

**Disagreement-breaking / unavailability:** If the joint call cannot resolve within 48 hours (both unavailable, or they disagree and escalation path is unclear), default to the **conservative call** — keep more scope, extend timeline — with decision logged. Team continues at original scope until resolution. Dev MAY NOT unilaterally descope during a sprint.

**Re-scope-up mechanism:** Descope is reversible within a limited window. If a trigger-cause resolves within 30 days of descope call (Architecture question answered, fixture fixed, scope estimate corrected), John+Winston may re-scope up with a recorded decision note. After 30 days, the descoped tier locks in; re-expansion becomes a Phase 2 backlog item.
