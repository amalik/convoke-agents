---
title: "Scope Decision: Forge — Domain Knowledge Extraction"
date: 2026-03-21
created-by: Amalik with Emma (contextualization-expert)
type: scope-decision
status: DECIDED
version: 1.0
---

# Scope Decision: Forge — Domain Knowledge Extraction

## Decision Summary

**Selected Problem Space:** Domain knowledge extraction for IT consultants conducting enterprise brownfield engagements (KORE Method)

**Rationale:** Scored 4.65/5 on weighted evaluation — highest of 7 opportunities. Forge addresses the most frequent, most time-consuming gap: consultants burn 40-80 hours per engagement on ad-hoc knowledge archaeology because tribal knowledge is trapped in people's heads and documentation is stale or missing. Strategic fit validated across all four dimensions (vision alignment, team capabilities, resource requirements, market timing). Direct integration with Gyre via FG-HC1/HC2/GF-HC1 handoff contracts creates a compounding value cycle.

**De-scoped (Not Now):**
- **Sentinel** (incident lifecycle) — Evaluated through Capability Evaluation Framework: 1 agent in Gyre, not standalone team. No friction log demand.
- **Ledger** (audit/compliance) — Hypothesis. Likely a module, not a team. Evaluate when regulated-industry engagements demand it.
- **Pulse** (adoption/change) — Hypothesis. Evaluate when large transformations with end-user adoption risk demand it.
- **Loom** (human-agent orchestration) — Hypothesis. Evaluate when multiple teams are active on same engagement.
- **Conduit** (data migration) — Hypothesis. Evaluate when engagements involve significant data migration.
- **Compass** (stakeholder alignment) — Hypothesis. Lowest score (2.15). Handled informally through consultant experience today.

---

## Problem Opportunities Considered

### Opportunity A: Domain Knowledge Extraction (Forge)

- **Problem:** Consultants landing in enterprise brownfield environments burn weeks on knowledge archaeology — tribal knowledge is trapped in people's heads, documentation is stale or missing, and onboarding is reinvented every engagement
- **Who experiences it:** IT consultants and architects at the firm
- **Market size:** Every enterprise brownfield engagement the firm runs
- **Interest:** HIGH — validated demand from consulting teams

### Opportunity B: Operational Readiness Assessment (Gyre)

- **Problem:** Teams ship to production without knowing if they're actually ready — missing SLOs, incomplete observability, unreviewed deployment strategies
- **Who experiences it:** Platform engineers and tech leads at client sites
- **Market size:** Every production launch the consultancy supports
- **Interest:** HIGH — already in development

### Opportunity C: Incident Lifecycle Management (Sentinel scope)

- **Problem:** When production breaks, response is improvised — no structured incident command, no blameless reviews, no feedback loop to improve
- **Who experiences it:** On-call engineers and ops teams at client sites
- **Market size:** Every client running production systems
- **Interest:** LOW — hypothesis, no direct demand yet

### Opportunity D: Audit & Compliance Traceability (Ledger scope)

- **Problem:** Regulated-industry clients can't prove to auditors that they followed their own policies throughout the dev lifecycle
- **Who experiences it:** Compliance officers, architects in banking/healthcare/public sector
- **Market size:** Subset of clients in regulated industries
- **Interest:** MEDIUM — not yet demanded but likely for certain verticals

### Opportunity E: Adoption & Change Management (Pulse scope)

- **Problem:** Technically sound solutions fail because the organization wasn't ready — end users resist, training gaps, no adoption metrics
- **Who experiences it:** Change managers, project leads at client organizations
- **Market size:** Large brownfield transformations with significant end-user impact
- **Interest:** LOW-MEDIUM — recognized problem but not where the firm currently focuses

### Opportunity F: Stakeholder Alignment & Political Navigation (Compass scope)

- **Problem:** Delivery gets blocked by organizational politics — missing buy-in, invisible stakeholders, competing agendas
- **Who experiences it:** Engagement leads, senior consultants
- **Market size:** New enterprise client relationships
- **Interest:** LOW — handled informally today through consultant experience

### Opportunity G: Data Migration Lifecycle (Conduit scope)

- **Problem:** Brownfield modernizations involving data migration have no structured methodology — profiling, mapping, transformation, verification done ad-hoc
- **Who experiences it:** Data engineers, architects on migration projects
- **Market size:** Subset of engagements involving significant data migration
- **Interest:** LOW-MEDIUM — real when it's needed, but not every engagement

---

## Evaluation Criteria

| # | Criterion | Weight | What it measures |
|---|-----------|--------|-----------------|
| 1 | **Engagement Frequency** | 25% | How often does this problem show up across engagements? (Every engagement vs. some vs. rare) |
| 2 | **Time Burned** | 25% | How many consultant-hours are wasted on this problem per engagement? (Direct cost to the firm) |
| 3 | **Buildability** | 20% | Can we design and build this as an agent team within BMAD/Convoke? Do we have the domain expertise? |
| 4 | **Strategic Fit** | 15% | Does this strengthen the Convoke ecosystem? Does it integrate with what already exists (Vortex, Gyre)? |
| 5 | **Speed to Value** | 15% | How quickly can consultants get value on a real engagement? (Weeks vs. months to first useful output) |

**Scoring scale:** 1-5 (1 = low, 5 = high)
**Rationale:** Engagement Frequency and Time Burned weighted highest because tools are built for internal consultants — ROI is measured in consultant productivity, not market revenue.

---

## Scoring Matrix

**Scoring scale: 1-5 | Weights: Freq 25%, Time 25%, Build 20%, Fit 15%, Speed 15%**

| # | Opportunity | Freq (25%) | Time (25%) | Build (20%) | Fit (15%) | Speed (15%) | **Weighted** |
|---|---|---|---|---|---|---|---|
| 1 | **A: Forge** (Knowledge Extraction) | 5 | 5 | 4 | 5 | 4 | **4.65** |
| 2 | **B: Gyre** (Operational Readiness) | 4 | 4 | 4 | 5 | 3 | **4.00** |
| 3 | **D: Ledger** (Audit/Compliance) | 3 | 3 | 3 | 4 | 2 | **3.05** |
| 4 | **G: Conduit** (Data Migration) | 2 | 4 | 3 | 3 | 2 | **2.85** |
| 5 | **C: Sentinel** (Incident Lifecycle) | 2 | 2 | 3 | 4 | 2 | **2.55** |
| 6 | **E: Pulse** (Adoption/Change) | 2 | 3 | 2 | 3 | 2 | **2.40** |
| 7 | **F: Compass** (Stakeholder Politics) | 2 | 2 | 2 | 2 | 3 | **2.15** |

**Key insight:** Forge leads by a significant margin (4.65 vs 4.00) because knowledge problems hit every engagement from day 1, while other scopes are phase-specific or vertical-specific.

---

## Selected Scope

### Problem Space

Domain knowledge extraction for IT consultants conducting enterprise brownfield engagements. Consultants face knowledge asymmetry — tribal knowledge is trapped in client personnel's heads, documentation is stale or missing, and 40-80 hours per engagement are burned on ad-hoc knowledge archaeology.

### Boundaries (What's In)

**User segment:**
- IT consultants and architects conducting enterprise brownfield engagements

**Use cases:**
- Knowledge landscape survey — mapping systems, knowledge holders, and documentation state (week 1)
- Tribal knowledge excavation — structured extraction from client personnel and code (weeks 2-4)
- Gyre-compatible asset production — TKAs with FG-HC1 frontmatter feeding Gyre's contextual model

**Environment:**
- Enterprise brownfield client environments (legacy systems, mixed tech stacks, organizational complexity)
- Agent-assisted workflows (consultant drives, Silo/Rune guide and structure)

**Agents delivered:** Silo (Survey) and Rune (Excavate) only

### Boundaries (What's Out)

**Explicitly not solving:**
- Knowledge codification into formal standards (Aria — Phase B)
- Knowledge validation with client stakeholders (Sage — Phase C)
- Long-term knowledge stewardship post-engagement (Warden — Phase C)
- Automated knowledge extraction without human guidance (Forge is human-assisted, not autonomous)
- Greenfield projects (no tribal knowledge to extract)
- Non-technical domain knowledge (business strategy, market positioning — stays in Vortex)

**Phase B (next):** Aria (codification) + FG-HC2 contract (RCAs → Gyre Compliance)
**Phase C (later):** Sage (validation) + Warden (stewardship) + GF-HC1 contract (Gyre gaps → Forge queue)

---

## Strategic Fit

### 1. Vision Alignment ✅

Forge fills the UNDERSTAND gap — the most critical missing piece between Vortex (DISCOVER) and BMAD (BUILD). Without Forge, consultants jump from "should we build this?" to "let's build it" without systematically capturing what the client organization already knows. Forge is not a nice-to-have extension — it's a missing lifecycle stage.

### 2. Team Capabilities ✅

- Agent design pattern: proven (7 Vortex agents, Gyre in development)
- BMAD module structure: understood (installer, config, manifest)
- Domain expertise: consultants do knowledge extraction every engagement — Forge formalizes what they already do informally
- Handoff contract pattern: established (HC1-HC10 in Vortex, FG-HC1/HC2 already designed)
- **Note:** Knowledge extraction workflows are inherently more conversational and less automatable than Gyre's static analysis — agent design will lean on guided facilitation rather than automated detection.

### 3. Resource Requirements ✅

- Phase A is 2 agents (Silo + Rune), not 5 — manageable scope
- KORE spec draft exists as starting point
- Forge↔Gyre handoff contracts already designed
- Epic breakdown exists with 5 epics across ~5 sprints
- No external dependencies (no APIs, no infrastructure, no client data)

### 4. Market Timing ✅

- Gyre in development → Forge ships alongside or just after, enabling integration multiplier from day one
- Active engagements where Forge would be used immediately
- Building now means battle-tested by the time Gyre ships, FG-HC1 integration validated on real data

---

## Next Steps

### Immediate: Continue Vortex Discovery (Streams 2-7)

Contextualize stream complete. Next streams:
1. **Empathize (Isla)** — Who are Forge's users? Build lean personas for consultants using Forge.
2. **Synthesize (Mila)** — Converge empathy findings into prioritized problem definitions
3. **Hypothesize (Liam)** — What are the riskiest assumptions? Build hypothesis contracts.
4. **Externalize (Wade)** — Design experiments to validate Forge's core assumptions
5. **Sensitize (Noah)** — What signals will tell us Forge is working?
6. **Systematize (Max)** — Decision framework for Forge's pivot/patch/persevere gates

### Build Sequence: ADR-001 Dependency Chain

Forge is **Task 4** in the ADR-001 build sequence. It does not get hand-crafted — it gets scaffolded by the Enhance framework after the pattern is proven:

```
Task 1: Gyre E1 (module foundation + Scout) — proves second team module pattern
Task 2: Enhance framework — extracts templates from Vortex + Gyre E1
Task 3: Vortex redesign — retroactively aligns to Enhance-codified patterns
Task 4: Forge — scaffolded by Enhance, domain content filled from Vortex discovery
```

**What Vortex discovery produces that Enhance consumes:**
- Scope decision (this document) → informs `config.yaml` generation
- Lean personas → inform agent persona design (Silo and Rune communication styles)
- Hypothesis contracts → inform handoff contract design (FG-HC1/HC2/GF-HC1 already drafted)
- Experiment results → validate the knowledge extraction workflow design

**What Enhance scaffolds for Forge:**
- Module structure (`_bmad/bme/_forge/`)
- Agent skeletons (Silo, Rune — filled with domain content from discovery)
- Workflow step-file skeletons (filled with excavation methodology from discovery)
- Contract skeletons (FG-HC1/HC2/GF-HC1 — already designed, templates pre-filled)
- Installer integration (`convoke-install-forge`)
- Registry and manifest entries

### Parallel Track: Friction Logs

While the ADR-001 sequence executes (Gyre E1 → Enhance → Vortex redesign), consulting teams should be running friction logs on real engagements. By the time Forge is ready to scaffold, friction log data validates (or challenges) the Vortex discovery findings.

## Vortex Compass

| If you learned... | Consider next... | Agent | Why |
|---|---|---|---|
| Scope is defined, users unknown | **lean-persona** | Emma 🎯 | Understand who exists in this problem space |
| Scope chosen, need user validation | **user-interview** | Isla 🔍 | Confirm real users care about this scope |
| Ready to test assumptions | **mvp** | Wade 🧪 | Design the smallest test for your scope decision |

**Recommended next:** Stream 2 — Empathize (Isla). Scope is defined. Users are "consultants" but we haven't built lean personas yet — who exactly are they, what are their jobs-to-be-done, what forces push and pull them?

---

**Created with:** Convoke v2.3.1 - Vortex Pattern (Contextualize Stream)
**Agent:** Emma (Contextualization Expert)
**Workflow:** contextualize-scope
