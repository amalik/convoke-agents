---
initiative: convoke
artifact_type: note
created: '2026-04-10'
updated: '2026-04-18'
schema_version: 1
---
# Lifecycle Expansion Plan — Draft for Challenge

> **Status:** Draft v3 — Strategy self-discovery track added (2026-04-04 Vortex+CIS challenge)
> **Source:** [Lifecycle Expansion Vision](../../docs/lifecycle-expansion-vision.md)
> **Date:** 2026-04-04
> **Principle:** This plan follows the vision's default gradient, but the gravity model governs — evidence shifts priority, not the plan.
> **WIP Limit:** Maximum 2 perimeters consuming active creative/authoring energy simultaneously. Lightweight validation work (desk exercises, entropy prototyping) doesn't count against the limit. Provisional — revisit after Wave 1.

---

## Active Infrastructure Initiative: v6.3 Adoption (Convoke 4.0)

> **Added 2026-04-18.** Running in parallel with Wave 0 perimeter work.

Convoke 4.0 aligns the platform with BMAD Method v6.3.0. This is infrastructure work that benefits all current and future perimeters — it does not count against the WIP limit (infrastructure, not creative/authoring energy).

**Key deliverables:**
- **Config-loader migration** — replaces `bmad-init` with direct YAML loading. All ~25 SKILL.md files migrated. Factory-produced teams (Loom) must follow the new v6.3 activation template (Pattern 6).
- **Marketplace distribution** — `.claude-plugin/marketplace.json` enables community discovery. This makes the demand-pull pattern (§ "How this ecosystem grows") concrete: new users find Convoke through the BMAD marketplace alongside other extensions.
- **BMM dependency governance** — scan tool and CSV registry for custom skill compatibility. Catches drift after upgrades.
- **Agent consolidation** — Bob/Quinn/Barry consolidated into upstream Amelia.
- **Behavioral equivalence validation (PF1)** — LLM-as-judge battery proving upgrade safety before release.

**Scope:** 5 sprints, 28 stories, 50 FRs, 33 NFRs. See [Epic Breakdown](convoke-epic-bmad-v6.3-adoption.md).

**Impact on this plan:** Team Factory (Loom) scaffolding must produce v6.3-compliant output. Marketplace distribution is now a concrete growth mechanism, not hypothetical.

---

## How to Read This Plan

Each wave lists work items with:
- **Scope estimate** — team size (agents), complexity class (Infrastructure / Practice / Lens)
- **Dependencies** — what must exist before this can start
- **Evidence trigger** — what real-world signal would accelerate or defer this item
- **Decision gate** — what must be validated before committing resources

The plan is deliberately NOT time-boxed. Consulting engagements generate the evidence that pulls gravity — the plan says *what order makes sense by default*, not *when*.

---

## Wave 0 — Foundations

> **Theme:** Infrastructure that every future perimeter depends on. Without these, practice perimeters operate on quicksand (Vision Principle #2).

### 0.1 Knowledge Engineering Perimeter (Forge)

| Attribute | Detail |
|-----------|--------|
| **Type** | Infrastructure perimeter (team) |
| **Agents** | Phase A: 2 (Silo, Rune). Phase B-C: 3 more (Aria, Sage, Warden) |
| **Current status** | Discovery COMPLETE (9 Vortex artifacts). Phase A epics ready (5 epics). Shadow experiment designed. |
| **Dependencies** | None — this is the foundation |
| **Decision gate** | **Gate 1:** Shadow engagement validates KORE methodology (6 weeks) |
| **Evidence trigger to accelerate** | Brownfield engagement imminent; knowledge archaeology pain acute |
| **Evidence trigger to defer** | No brownfield engagements on horizon; greenfield-only consulting period |
| **Known gap** | Forge-as-planned is narrower than KE-as-envisioned (see audit). Phase A is valid regardless — design decision about KE scope happens between Gate 1 and Phase B spec. |
| **Open design question** | Does Forge grow into full KE perimeter (exposition layer, all-perimeter consumers), or does KE become a separate infrastructure layer that Forge feeds? Decide after Gate 1. |

**Work items:**
1. Run shadow engagement (Gate 1) — 6 weeks, external dependency
2. **Parallel desk exercise** — apply KORE retroactively to a past brownfield engagement to de-risk A2 (extraction quality) and A3 (TKA utility) while waiting for Gate 1 *(C6)*
3. Gate 1 decision: Persevere / Patch / Pivot
4. If Gate 1 passes → Scaffold Forge Phase A via Loom (5 sprints). **Acceptance criterion:** Governance checklist (0.3) applied to agent design *(C1)*. **Note (2026-04-18):** Loom (Team Factory) shipped in v3.2 and is validated on Vortex and Gyre — scaffolding mechanism is ready. Factory output must follow v6.3 conventions (see Active Infrastructure Initiative above).
5. Author domain content (personas, workflow steps, KORE methodology formalization) — **authored by:** domain expert (Amalik) with agent-assisted drafting. See Resource Model below *(C4)*
6. Implement Forge↔Gyre contracts (FG-HC1, FG-HC2, GF-HC1)
7. Gate 2 decision: Scope of Phase B/C — pure Forge or broader KE perimeter?

### 0.2 Entropy Monitoring Baseline

| Attribute | Detail |
|-----------|--------|
| **Type** | Infrastructure capability (cross-cutting, not a team) |
| **Agents** | 0 — this is a protocol, not an agent team. Could manifest as a shared library or a lightweight validation module. |
| **Current status** | Not started. Concept defined in vision Section 6. Noah's signal interpretation in Vortex is the closest existing pattern. |
| **Dependencies** | None technically, but benefits from KE exposition layer to know *what* artifacts exist |
| **Decision gate** | Specify before Wave 1 ships — practice perimeters need artifact validity monitoring |
| **Evidence trigger to accelerate** | Stale TKAs or outdated Gyre assessments cause downstream harm |
| **Evidence trigger to defer** | Artifact volume is still low enough for manual review |

**Work items:**
1. **IMMEDIATE:** Prototype on existing Vortex artifacts — they've been accumulating since March 2026 and are a free testbed for staleness/drift detection *(C2)*
2. Define staleness detection protocol (half-life per artifact type)
3. Define drift monitoring protocol (assumption vs. current evidence comparison)
4. Define decay scoring model (quantitative confidence signal)
5. Decide form factor: shared module? Extension to each team? Dedicated lightweight agent?

### 0.3 Governance & Change Lens

| Attribute | Detail |
|-----------|--------|
| **Type** | Lens (design principles embedded into other perimeters, not a standalone team yet) |
| **Agents** | 0 in Wave 0. Graduates to full perimeter in Wave 2. |
| **Current status** | Not formalized. Vision identifies: Fogg's tiny habits, Rogers' diffusion, Edmondson's psychological safety, Cynefin for agent autonomy. |
| **Dependencies** | None — this is a design constraint, not a deliverable |
| **Decision gate** | Must be codified before Wave 1 perimeters are designed — they need adoption patterns baked in |
| **Evidence trigger to accelerate** | Agent adoption resistance observed in consulting engagements |
| **Evidence trigger to defer** | Adoption is organic and frictionless (unlikely at scale) |

**Work items:**
1. **IMMEDIATE:** Codify governance design principles as a checklist for perimeter designers — this is an input to Forge Phase A scaffolding *(C1)*
2. Define adoption pattern library (tiny habits, diffusion factors, psychological safety indicators)
3. Define Cynefin-based agent autonomy spectrum (which decisions agents handle vs. require humans)
4. Apply retroactively to Vortex/Gyre as validation (do existing teams pass?)

### 0.4 Strategy Perimeter — Self-Discovery Track

> **Rationale for Wave 0 inclusion *(Vortex+CIS challenge, 2026-04-04):*** The expansion plan was built without strategic evidence. The gravity model needs strategic grounding to sequence everything correctly. Strategy discovery isn't Wave 2 work pulled forward — it's **Wave 0 work that was missing.** Running it now provides the evidence the entire plan depends on. *(Victor, Sophia)*

| Attribute | Detail |
|-----------|--------|
| **Type** | Practice perimeter (team) — discovered via self-discovery protocol |
| **Estimated agents** | 3-4 (competitive analysis, business model design, situational awareness, strategic positioning) |
| **Composition** | TBD — discovery will reveal. Likely Independent (strategy capabilities invoked contextually, not pipelined). |
| **Current status** | Not started. Vision identifies gap: "Discovery starts without strategic grounding." Theory established (Porter, Wardley, BMC, Rumelt). |
| **Dependencies** | None — this is a discovery track, not a build. WIP-compliant: Forge in build/waiting, Strategy in discovery. |
| **Decision gate** | Strategy discovery complete → team spec validated on 2 business types → ready for Loom scaffolding |
| **Evidence trigger to accelerate** | Already present — Convoke needs strategic positioning for lifecycle expansion. Agentic AI market moving fast. |
| **Evidence trigger to defer** | None identified — this was unanimously supported by Vortex+CIS challenge. |
| **Key theory** | Porter (Five Forces), Wardley Mapping, Osterwalder (BMC), Rumelt (Good Strategy) |

**Discovery method: Self-Discovery Protocol** *(see protocol definition below)*

Run full 7-stream Vortex discovery where:
- **Subject domain:** strategic analysis methodology
- **Test case:** Convoke's own strategic positioning (lifecycle expansion, competitive landscape, moat analysis)
- **Output:** (1) validated Strategy team spec ready for Loom, AND (2) actual strategic artifacts for Convoke

**7 Bulletproof Conditions** *(from Vortex+CIS challenge session):*

| # | Condition | Why | How to verify |
|---|-----------|-----|---------------|
| **BP1** | Discovery outputs take priority over Convoke strategy artifacts | Prevents optimizing for the test case at the expense of team design *(Liam)* | Explicit priority rule in discovery kickoff. When team design and Convoke output conflict, team design wins. |
| **BP2** | Include external perspective check — apply Strategy workflows to a second, different business type | Validates generalizability, prevents circular reasoning *(Isla, Mila, Wade)* | After Convoke case completes, run lightweight second case (e.g., B2C marketplace or past client, anonymized). Both must pass. |
| **BP3** | Design framework selection as orchestration logic, not hard-wired | Convoke won't exercise all 4 theoretical foundations equally *(Mila)* | Agent selects Porter/Wardley/BMC/Rumelt based on context. Convoke validates 2-3; external check validates the rest. |
| **BP4** | Pre-register success criteria before starting | Without them, dogfooding becomes anecdote, not evidence *(Wade)* | 4 criteria: (1) 3-4 agents with non-overlapping scope covering all 4 foundations, (2) workflows produce client-handable artifacts, (3) framework selection logic works across business types, (4) Strategy→Discovery handoff contract viable. |
| **BP5** | Acknowledge that Convoke strategy output may rewrite the wave sequence | The plan needs strategic evidence to function — Strategy discovery may reveal that depth (Vortex+Gyre+Forge) matters more than breadth (more perimeters) *(Victor, Sophia)* | After Strategy discovery, run a Gravity Check: does the wave ordering still hold? Update plan if not. |
| **BP6** | WIP limit defined as cognitive load, not item count | Forge desk exercise + entropy prototype are lightweight; Strategy discovery is the active creative work *(Liam)* | Already updated in plan header. Strategy discovery = 1 of 2 allowed creative slots. |
| **BP7** | Document the self-discovery pattern as a replicable protocol | If it works, this becomes standard for future perimeter discovery *(Carson)* — but only when Convoke is a valid representative case *(Dr. Quinn)* | Protocol written (see below). Each future use must pass the "valid representative" test. |

**Pre-registered success criteria *(BP4):***
1. **Agent scope validation:** 3-4 agents defined with non-overlapping responsibilities covering all 4 theoretical foundations
2. **Workflow utility:** Designed workflows produce artifacts a consultant could hand to a client (not just Convoke-specific output)
3. **Framework selection logic:** Orchestration pattern correctly selects appropriate framework(s) for a given context — verified on at least 2 different business types
4. **Handoff contract viability:** Strategy output can feed into Vortex discovery as strategic grounding (Strategy→Discovery handoff)

**Work items:**
1. Pre-register success criteria (BP4) and priority rule (BP1) before discovery starts
2. Run full 7-stream Vortex discovery on Strategy perimeter using Convoke as test case
3. Produce Strategy team spec (primary output) + Convoke strategic artifacts (secondary output)
4. External perspective check (BP2): apply Strategy workflows to a second business type
5. Validate framework selection logic across both cases (BP3)
6. Gravity Check (BP5): does strategic evidence change the wave sequence?
7. If all 4 success criteria pass → team spec ready for Loom scaffolding
8. Document self-discovery protocol learnings (BP7)

---

## Self-Discovery Protocol *(BP7)*

> A replicable pattern for discovering new perimeters by using Convoke itself as the first test case.

**When to use:** When Convoke is a valid representative of the perimeter's target user base. Strategy — yes (Convoke needs strategic positioning). Operations — maybe (Convoke has some operational concerns). Growth — weaker (Convoke is a framework, not a product with AARRR metrics). *(Dr. Quinn)*

**The pattern:**
1. **Validity check:** Is Convoke a realistic test case for this perimeter's core workflows? If edge case, don't use self-discovery — use standard discovery with external cases.
2. **Priority rule:** Discovery outputs (team spec) always take precedence over Convoke-specific artifacts. Convoke output is a bonus, not the goal.
3. **Full Vortex discovery:** Run all 7 streams. The novelty is the perimeter-as-agentic-team, even if the underlying discipline is established.
4. **Dual output:** Produce (1) validated team spec + (2) real Convoke artifacts.
5. **External validation:** After Convoke case, apply designed workflows to a second, different business type. Both must pass success criteria.
6. **Gravity Check:** After discovery, reassess the expansion plan — strategic evidence may shift priorities.
7. **Document learnings:** What worked, what didn't, whether the pattern should be used for the next perimeter.

**The pattern breaks when:** Convoke is an edge case for the perimeter, or when the person running discovery is simultaneously product owner + test user + evaluator with no external check. The external perspective check (step 5) is the safety valve. *(Isla)*

---

## Wave 1 — Core Lifecycle Completion

> **Theme:** Close the three biggest gaps in the current lifecycle. Each is a practice perimeter that bridges an existing team's output to real-world operations.

### Prerequisites from Wave 0
- Entropy baseline defined (practice perimeters need it)
- Governance lens codified (adoption patterns embedded in design)
- Forge Phase A shipping or shipped — **soft dependency with escape hatch:** Wave 1 can start without Forge, but any Wave 1 team designed for brownfield use MUST consume KE assets if available *(C5 — Liam)*

### Default Ordering *(C3)*
If no engagement evidence pulls a specific perimeter, the default tiebreaker is: **Delivery first** (shortest dependency chain — only Gyre; most universally observed gap). Evidence can override.

### Discovery Track *(C5)*
Wave 1 perimeters cover **established disciplines** (release engineering, SRE, DevSecOps). Full 7-stream Vortex discovery is not required. Use a **lightweight discovery track:** scope decision → problem definition → epic breakdown. Reserve full Vortex for genuinely novel methodologies (like Forge/KORE was).

### 1.1 Delivery Perimeter

| Attribute | Detail |
|-----------|--------|
| **Type** | Practice perimeter (team) |
| **Estimated agents** | 3-4 (release strategy, feature flag management, rollback analysis, progressive delivery) |
| **Composition** | Likely **Independent with optional sequencing** — release strategy, feature flags, and rollback are contextually invoked, not a fixed pipeline *(Liam challenge)* |
| **Current status** | GAP identified. TEA designs CI/CD, Gyre assesses readiness, but nothing bridges ready → live. |
| **Dependencies** | Gyre (readiness assessment feeds release decisions). TEA (CI/CD pipeline design). |
| **Handoff contracts** | Gyre → Delivery (readiness report → release plan). Delivery → Operations (release events → incident awareness). |
| **Decision gate** | Vortex discovery on Delivery perimeter (run 7 streams). |
| **Evidence trigger to accelerate** | Consulting engagement hits "ready but can't ship" gap. Production incidents traceable to release process gaps. |
| **Evidence trigger to defer** | Clients have mature release processes; Gyre readiness reports are sufficient. |
| **Key theory** | Continuous Delivery (Humble & Farley), Progressive Delivery (Hodgson), Trunk-Based Development |

**Work items:**
1. Lightweight discovery: scope decision → problem definition → epic breakdown *(C5)*
2. Scaffold via Loom
3. Author domain content (see Resource Model)
4. Implement Gyre → Delivery handoff contracts
5. **Gravity Check** after ship *(C7)*

### 1.2 Operations Perimeter

| Attribute | Detail |
|-----------|--------|
| **Type** | Practice perimeter (team) |
| **Estimated agents** | 3-4 (incident command, runbook engineering, resilience analysis, SRE workflows) |
| **Composition** | Likely Independent — operational capabilities are invoked on-demand, not pipelined |
| **Current status** | GAP identified. Gyre identifies operational gaps but offers no operational follow-through. |
| **Dependencies** | Gyre (gap findings). Delivery (release events). KE (operational tribal knowledge from Forge). |
| **Handoff contracts** | Gyre → Operations (readiness gaps → operational workflows). Delivery → Operations (release events). Operations → Vortex (incident learnings → discovery re-entry). |
| **Decision gate** | Vortex discovery on Operations perimeter. |
| **Evidence trigger to accelerate** | Post-Gyre engagement reveals operational gaps with no remediation path. Incident without runbook. |
| **Evidence trigger to defer** | Clients have mature SRE practices; Gyre gap reports are actionable without agent support. |
| **Key theory** | SRE (Beyer et al.), Chaos Engineering (Rosenthal), Learning from Incidents (Woods) |

**Work items:**
1. Lightweight discovery: scope decision → problem definition → epic breakdown *(C5)*
2. Scaffold via Loom
3. Author domain content (see Resource Model)
4. Implement cross-team contracts (Gyre→Ops, Delivery→Ops, Ops→Vortex feedback)
5. **Gravity Check** after ship *(C7)*

### 1.3 Security Perimeter

| Attribute | Detail |
|-----------|--------|
| **Type** | Practice perimeter (cross-cutting — spans lifecycle but activates as a team) |
| **Estimated agents** | 3-4 (threat modeling, DevSecOps workflows, compliance mapping, supply chain audit) |
| **Composition** | Likely Independent — security capabilities are invoked contextually across lifecycle phases |
| **Current status** | GAP identified. Gyre detects security gaps but doesn't remediate. TEA has security-adjacent test workflows. |
| **Dependencies** | Gyre (security gap findings). KE/Forge (compliance context from RCAs via FG-HC2). |
| **Handoff contracts** | Gyre → Security (gap findings → threat model). Forge → Security (RCAs → compliance context). Security → Build (security requirements → implementation constraints). |
| **Decision gate** | Vortex discovery on Security perimeter. |
| **Evidence trigger to accelerate** | Regulatory audit. EU AI Act compliance requirement. Security incident at client. |
| **Evidence trigger to defer** | Clients have dedicated security teams; Gyre's detection is sufficient. |
| **Key theory** | STRIDE (Shostack), DevSecOps (OWASP), EU AI Act, ISO 42001 |

**Work items:**
1. Lightweight discovery: scope decision → problem definition → epic breakdown *(C5)*
2. Scaffold via Loom
3. Author domain content (see Resource Model)
4. Implement cross-team contracts
5. **Gravity Check** after ship *(C7)*

---

## Wave 2 — Lifecycle Extension + Full Governance

> **Theme:** Extend coverage to growth (downstream), formalize documentation, and graduate governance to a full perimeter. Strategy perimeter moved to Wave 0 (self-discovery track).

### Prerequisites from Wave 1
- At least one Wave 1 perimeter shipped and validated in production
- Entropy monitoring active (artifacts from Wave 0-1 monitored)
- Cross-team handoff patterns proven (Forge↔Gyre, Gyre→Delivery/Ops/Security)
- Strategy perimeter discovery complete (Wave 0.4) — strategic evidence informs Wave 2 ordering

### 2.1 Growth Perimeter

| Attribute | Detail |
|-----------|--------|
| **Type** | Practice perimeter (team) |
| **Estimated agents** | 3-4 (funnel analysis, onboarding architecture, retention strategy, experimentation) |
| **Current gap** | Noah interprets production signals but no activation, retention, or growth workflows. Post-launch is blind. |
| **Evidence trigger to accelerate** | Client product launched, data flowing, but no systematic growth practice. |
| **Key theory** | Product-Led Growth (Bush), Pirate Metrics (McClure), Experimentation at Scale (Kohavi) |

### 2.2 Documentation Perimeter

| Attribute | Detail |
|-----------|--------|
| **Type** | Infrastructure perimeter |
| **Estimated agents** | 2-3 (documentation strategy, knowledge capture, learning documentation) |
| **Current gap** | WDS covers design docs, Paige handles technical writing, but no systematic documentation strategy across lifecycle. |
| **Evidence trigger to accelerate** | Knowledge loss observed as perimeters multiply. Artifact volume outpaces comprehension. |
| **Key theory** | Diataxis (Procida), Docs-as-Code (Gentle), ADRs (Nygard), SECI (Nonaka) |

### 2.3 Governance & Change Perimeter (Full)

| Attribute | Detail |
|-----------|--------|
| **Type** | Meta-perimeter (helps organizations adopt other perimeters) |
| **Estimated agents** | 3-4 (change architecture, governance design, adoption facilitation, transformation assessment) |
| **Current gap** | Not addressed. Wave 0 lens provides principles; Wave 2 graduates to dedicated capabilities. |
| **Evidence trigger to accelerate** | Client struggles with agentic adoption despite good tooling. Transformation resistance patterns observed. |
| **Key theory** | Kotter, ADKAR, Rogers' diffusion, Fogg's tiny habits, Edmondson, Cynefin, EU AI Act, ISO 42001 |

---

## Wave 3 — Complete the Picture

> **Theme:** Lifecycle closure and domain specialization. Only when evidence demands it.

### 3.1 Sunset Perimeter

| Attribute | Detail |
|-----------|--------|
| **Type** | Practice perimeter |
| **Estimated agents** | 2-3 (technical debt analysis, migration planning, legacy modernization) |
| **Evidence trigger** | Consulting engagement focused on legacy system modernization or decommissioning |
| **Key theory** | Technical Debt (Cunningham), Behavioral Code Analysis (Tornhill), Strangler Fig (Fowler) |

### 3.2 Domain-Specialized Perimeters

| Domain | Port Maturity Start | Evidence Trigger |
|--------|-------------------|------------------|
| AgentOps | Level 1 (Advise) | Clients building agentic systems need operational guidance |
| MLOps | Level 1 (Advise) | ML workloads in consulting engagements |
| DataOps | Level 1 (Advise) | Data pipeline maturity gaps at clients |
| PlatformOps | Level 1 (Advise) | Platform engineering consulting demand |

These start at advisory level and graduate through assess → build → monitor as demand justifies.

---

## Scale Summary

| Wave | Items | Estimated Agents | New Teams |
|------|-------|-----------------|-----------|
| Wave 0 | KE/Forge + Strategy (self-discovery) + Entropy baseline + Governance lens | 5 (Forge Phase A: 2, Phase B-C: 3) + 3-4 (Strategy) + 0 + 0 | 2 teams + 2 capabilities |
| Wave 1 | Delivery + Operations + Security | ~10-12 | 3 teams |
| Wave 2 | Growth + Documentation + Governance | ~9-11 | 3 teams |
| Wave 3 | Sunset + Domain specializations | ~5-10+ | 1 team + N domains |
| **Total** | **~15 perimeters** | **~35-45 agents** | **~9 teams + capabilities** |

---

## Resource Model *(C4)*

> The plan's biggest unstated assumption was: who writes the domain content for 35-45 agents?

**Per-agent effort model (estimate from Forge Phase A: 5 sprints for 2 agents):**
- Structural scaffolding via Loom: ~0.5 sprints per team (automated)
- Domain content authoring (personas, workflow steps, templates): ~2 sprints per agent
- Contract design and wiring: ~0.5 sprints per contract
- Validation and iteration: ~0.5 sprints per team

**Authoring model:**
- **Domain expert (Amalik)** owns: persona depth, methodology formalization, workflow step content, acceptance criteria
- **Agent-assisted drafting** accelerates: Vortex discovery artifacts provide raw material; BMB and Loom generate structural skeletons; domain expert reviews and enriches
- **Contracted domain experts** for specialized perimeters: Security (threat modeling), Operations (SRE), Growth (PLG) — if internal expertise is insufficient

**Scale reality:**
- Wave 0: 5-9 agents (Forge 2-5 + Strategy 3-4) — feasible solo with agent assistance. Strategy discovery is the creative work; Forge desk exercise is lightweight.
- Wave 1: ~10-12 agents — stretches solo capacity. Consider domain expert partnerships for at least 1 perimeter.
- Wave 2+: ~12-15 agents — requires either domain expert partnerships or a significantly longer timeline

**This means:** At solo + agent-assisted pace, Waves 0-1 are realistic within 12-18 months. Waves 2-3 require either more people or a longer horizon. This is a resource constraint, not a design flaw.

---

## Gravity Check Protocol *(C7)*

After each wave completion (or after any perimeter ships), run a structured gravity reassessment:

1. **Evidence review** — What have recent consulting engagements revealed? Which gaps are pulling hardest?
2. **Plan validation** — Does the next planned perimeter still match the strongest gravitational pull? If not, reorder.
3. **Assumption check** — Have any plan assumptions been invalidated? (e.g., "clients have mature release processes" turned out to be false)
4. **WIP check** — Are we within the 2-perimeter active development limit? If not, park the lower-priority item.
5. **Entropy check** — Are existing perimeters' artifacts still valid? Any staleness signals?
6. **Resource check** — Is the authoring model sustainable at current pace? Adjust timeline or seek partnerships if not.

**Output:** Updated plan priorities, or confirmation that current ordering holds. Document the decision rationale.

---

## Risk Register

| # | Risk | Impact | Mitigation |
|---|------|--------|------------|
| R1 | **Gate 1 fails** — KORE methodology doesn't validate in shadow engagement | Wave 0 delays, Forge pivot required | Decision framework pre-registered with Patch/Pivot options. Methodology can be revised without losing infrastructure investment. |
| R2 | **Infrastructure debt** — Wave 1 ships without entropy baseline | Practice perimeters produce artifacts that silently decay | Hard prerequisite: entropy protocol defined before first Wave 1 perimeter ships. |
| R3 | **Adoption resistance** — clients don't adopt agent teams despite good design | All waves affected | Governance lens from Wave 0 embeds adoption patterns. Shadow engagement tests adoption (A1 assumption). |
| R4 | **Scope creep via vision** — vision's ambition pulls resources from validated work | Forge Phase A delayed by Wave 1 design work | Strict gate discipline: no Wave 1 design starts until Gate 1 passes and Phase A is scaffolded. |
| R5 | **Cross-team contract complexity** — handoff contracts multiply as teams grow | Governance overhead, brittleness | Vision Open Question #1. Address explicitly before Wave 2 when contract count exceeds ~15. |
| R6 | **Gravity model thrashing** — too many perimeters active simultaneously | Nothing completes, everything is in progress | WIP limit set at 2 perimeters max. Enforced via Gravity Check protocol. *(superseded by R10 — kept for traceability)* |
| R7 | **Forge ≠ KE** — Forge-as-built doesn't evolve into the full KE perimeter the vision requires | Infrastructure gap persists, practice perimeters lack knowledge foundation | Decision gate between Gate 1 and Phase B: explicitly choose Forge-grows-into-KE or KE-is-separate. |
| R8 | **Calendar risk on Gate 1** — no suitable brownfield engagement materializes for months | Entire Wave 0→1→2 sequence blocked | Parallel desk exercise on a past engagement de-risks A2/A3 while waiting. *(C6)* |
| R9 | **Domain authoring bottleneck** — solo capacity insufficient for 35-45 agents | Waves 2-3 timeline extends significantly or quality drops | Resource model makes this explicit. Seek domain expert partnerships before Wave 2. *(C4)* |
| R10 | **Gravity thrashing without WIP limit** — too many perimeters active simultaneously | Nothing completes, everything in progress | Provisional WIP limit: max 2 perimeters in active dev. Enforced via Gravity Check protocol. *(C7)* |
| R11 | **Strategy self-discovery circular reasoning** — agents designed on Convoke case don't generalize | Strategy team only works for framework products, not client engagements | External perspective check (BP2) on second business type is mandatory. Both cases must pass. *(C8)* |
| R12 | **Strategy evidence rewrites plan** — Convoke's moat is depth not breadth, invalidating Wave 1-2 ordering | Sunk cost on Wave 1 planning if priorities shift | This is a feature, not a bug (BP5). Gravity Check #1 is the decision point. Better to learn early than build wrong perimeters. |
| R13 | **Strategy + Forge parallel overload** — two Wave 0 discovery/build tracks strain solo capacity | Both tracks slow down, neither completes well | WIP limit redefined as cognitive load (C8). Strategy is discovery (creative), Forge desk exercise is lightweight validation. If Gate 1 fires and Forge enters build while Strategy is mid-discovery, pause Strategy or bring in support. |

---

## Decision Sequence

```
NOW (parallel immediate actions)
 │
 ├── Codify Governance lens checklist (input to Forge scaffolding) [C1]
 ├── Prototype Entropy monitoring on existing Vortex artifacts [C2]
 ├── Identify shadow engagement candidate for Forge Gate 1
 ├── Start KORE desk exercise on a past engagement (de-risks A2/A3) [C6]
 └── Pre-register Strategy success criteria (BP4) + priority rule (BP1) [C8]
      │
      ├──────────────────────────────────┐
      ▼                                  ▼
FORGE TRACK                        STRATEGY TRACK (parallel)
                                   │
GATE 1 (Shadow engagement          Begin full 7-stream Vortex
complete — ~6 weeks)               discovery on Strategy perimeter
 │                                 using Convoke as test case
 ├── Persevere → Scaffold          │
 │   Forge Phase A via Loom        Produce Strategy team spec
 │   (governance checklist) [C1]   + Convoke strategic artifacts
 ├── Patch → Revise, re-test       │
 └── Pivot → Reassess              External perspective check (BP2):
      │                            apply to second business type
      │                            │
      ▼                            ▼
FORGE PHASE A SHIPS          STRATEGY DISCOVERY COMPLETE
 │                                 │
 ├─────────────────────────────────┤
 │                                 │
 ▼                                 ▼
GRAVITY CHECK #1 [C7] — CRITICAL CHECKPOINT
 │
 ├── GATE 2: Forge scope decision (grows into KE or stays narrow?)
 ├── BP5 CHECK: Does Strategy evidence change the wave sequence?
 │   (Convoke's moat = depth or breadth? This may rewrite Wave 1 ordering)
 ├── If Strategy success criteria pass → team spec ready for Loom
 ├── Begin lightweight discovery on Delivery perimeter (default) [C3/C5]
 │   (or different perimeter if Strategy evidence overrides)
 └── Validate entropy baseline on Vortex + Forge artifacts
      │
      ▼
FIRST WAVE 1 PERIMETER SHIPS
 │
 ├── GRAVITY CHECK #2 [C7]
 ├── Validate cross-team contract patterns at scale
 ├── Validate entropy monitoring in production
 ├── Resource check: is solo authoring sustainable for remaining Wave 1? [C4]
 └── Begin lightweight discovery on next Wave 1 candidate
      │
      ▼
WAVE 1 COMPLETE
 │
 ├── GRAVITY CHECK #3 [C7]
 ├── Revisit WIP limit (still 2, or adjust?)
 ├── Resource decision: domain expert partnerships for Wave 2? [C4]
 ├── GATE: Is Forge/KE exposition layer sufficient for Wave 2 consumers?
 └── Begin Wave 2 discovery (evidence-driven ordering)
      │
      ▼
WAVE 2+ (gravity model governs ordering, Gravity Checks after each ship)
```

---

## Challenging This Plan

This plan should be challenged on these dimensions:

1. **Are the agent counts realistic?** Each "3-4 agents" estimate is a placeholder. Discovery will reveal actual scope.
2. **Is the Loom ready for this volume?** 9 teams is ambitious. Factory reliability and template quality become critical.
3. **Where does the written-knowledge agent (Scribe) land?** If shadow engagement validates it, Forge Phase A scope expands.
4. **Is the 12-18 month estimate for Waves 0-1 compatible with the agentic AI market pace?** Strategy self-discovery should illuminate this — if the market is moving faster, what gets cut or parallelized?
5. **Are domain expert partnerships realistic?** For Security, Operations, Growth — who, when, at what cost?
6. **What happens if Forge Gate 1 and Strategy discovery complete simultaneously?** Two teams ready for Loom scaffolding at once. Is that within capacity?
7. **Does the self-discovery pattern create confirmation bias?** The external perspective check (BP2) is the safeguard — but is one additional case sufficient?

### Resolved Challenges

**v2 — Vortex team challenge (2026-04-04):**

| # | Challenge | Resolution |
|---|-----------|------------|
| C1 | Governance lens not wired as Forge input | Added as scaffolding acceptance criterion + immediate work item |
| C2 | Entropy prototype should start now | Moved to immediate action on Vortex artifacts |
| C3 | Wave 1 needs default tiebreaker | Delivery designated as default first |
| C4 | Domain authoring at scale unstated | Resource Model section added with per-agent effort model |
| C5 | Not every perimeter needs full Vortex discovery | Lightweight discovery track defined for established disciplines |
| C6 | Shadow engagement calendar risk | Parallel desk exercise added to de-risk A2/A3 |
| C7 | No feedback loops or WIP limits | Gravity Check protocol added; WIP limit set at 2 |

**v3 — Vortex+CIS challenge on Strategy self-discovery (2026-04-04):**

| # | Challenge | Resolution |
|---|-----------|------------|
| C8 | Strategy perimeter missing from Wave 0 — plan built without strategic evidence | Strategy added as Wave 0.4 self-discovery track, parallel to Forge. Moved from Wave 2. |
| BP1 | Discovery outputs could be compromised by Convoke-specific optimization | Explicit priority rule: team spec > Convoke artifacts. Pre-registered before discovery starts. |
| BP2 | Single test case (Convoke) risks circular reasoning | Mandatory external perspective check on second business type after Convoke case. |
| BP3 | Hard-wired framework selection won't generalize | Orchestration logic selects Porter/Wardley/BMC/Rumelt based on context, not hard-wired. |
| BP4 | Dogfooding without success criteria = anecdote | 4 success criteria pre-registered: agent scope, workflow utility, framework selection, handoff viability. |
| BP5 | Strategy evidence may invalidate wave ordering | Acknowledged as feature. Gravity Check #1 is the decision point after Strategy discovery completes. |
| BP6 | WIP limit definition too rigid for mixed work types | Redefined as cognitive load, not item count. Lightweight validation doesn't count. |
| BP7 | Self-discovery pattern undocumented | Self-Discovery Protocol section added as replicable pattern with validity check. |

---

*This plan is a living artifact. It follows the lifecycle expansion vision's default gradient but is governed by the gravity model: evidence and risk shift priority, not the plan itself. The Strategy self-discovery track (v3) ensures the plan is grounded in strategic evidence, not just gap analysis.*
