---
title: "Product Vision: Team Factory"
date: 2026-03-21
created-by: Amalik with Emma (contextualization-expert)
type: product-vision
status: DRAFT
version: 1.0
---

# Product Vision: Team Factory

## Vision Statement

> For IT consultants and BMAD users who need to extend the framework with new teams, agents, and skills, the Team Factory is a guided orchestration layer that enforces architectural thinking and produces fully wired, BMAD-compliant modules. Unlike directly editing files or using BMB alone, the Team Factory ensures every addition goes through structured discovery, produces complete integration (registry, config, contracts), and is indistinguishable in quality from native BMAD teams.

**For** IT consultants and BMAD users (colleagues and contributors)
**Who** need to extend the framework with new teams, agents, and skills but lack deep architectural knowledge
**The** Team Factory **is a** guided orchestration layer
**That** enforces architectural thinking and produces fully wired, BMAD-compliant modules end-to-end
**Unlike** directly editing files or using BMB alone (which generates artifacts but not integration)
**Our product** ensures every addition goes through structured discovery, includes complete system wiring (registry, config, contracts), and matches native BMAD team quality

---

## The Problem We're Solving

### Problem Statement
Extending the BMAD framework with new teams, agents, or skills requires deep architectural knowledge and manual wiring across multiple files, making it impossible for colleagues and contributors to self-serve.

### Why This Matters
- **Bottleneck:** All additions flow through one person (the framework creator) — doesn't scale with 7 teams incoming
- **Adoption:** Colleagues give up or produce inconsistent results when attempting extensions independently
- **Quality:** People skip BMM workflows, edit files directly, don't think about blind spots, overlaps, or orchestration mode — producing structurally valid but architecturally broken teams

### Market Size & Opportunity
- 7 new teams expected in the near term
- Tool shared within the company and publicly on GitHub — growing demand from both channels
- Each team addition currently requires deep framework knowledge across: agent-registry.js, config.yaml, module-help.csv, refresh-installation.js, contracts, activation XML, naming conventions

### Current Alternatives & Their Limitations
1. **Manual creation** — Edit files directly. Fast but error-prone, no quality gates, no integration wiring, skips thinking steps
2. **BMB (BMAD Builder)** — Generates high-quality agent files, workflow steps, and module scaffolds (~55% coverage). But stops at the file boundary: no registry updates, no contract generation, no config wiring, no submodule awareness, no enforcement of discovery process
3. **Copy-paste from Vortex** — Tempting but fragile. Produces structural mimicry without understanding, leads to orphaned files and broken contracts

---

## Who We Serve

### Primary Target User
IT consultants (the creator and direct colleagues) with:
- **Surface-level BMAD knowledge** — know what teams and agents are, don't know the internal wiring
- **Fluent with Claude Code** and similar AI-assisted development tools
- **Building teams for their own use** — client engagements, internal tooling, consulting workflows

### Secondary Target Users (v2+)
- Community contributors on GitHub — need even more guardrails, documentation, and onboarding guidance
- Future: other organizations adopting BMAD who want to create custom teams

### Market Segments
- **Segment A (v1 target):** Internal colleagues — know the context, need the process
- **Segment B (v2):** GitHub contributors — need context AND process
- **Segment C (future):** External adopters — need onboarding, context, AND process

---

## Our Unique Approach

### What Makes Us Different
The core insight: **the quality of a BMAD team isn't in the files — it's in the thinking that precedes them.**

The Team Factory is thinking-first, not artifact-first:
- **BMB** = "Tell me what you want, I'll generate the files" (artifact-first)
- **Team Factory** = "Let's think through what this team needs to be, then I'll generate AND wire everything" (thinking-first, then artifacts, then integration)

### Our Competitive Advantage
1. **Proven reference implementation** — Vortex is a complete, working team. Patterns are extracted from real experience, not theory
2. **Two more teams in progress** (Gyre, Forge) — immediate test cases for the factory
3. **Complete audit of native BMAD teams** (BMM, CIS, TEA, WDS, BMB) — three archetypes identified, patterns documented
4. **BMB delegation** — don't rebuild file generation; orchestrate it

### Why Now?
7 teams incoming. The manual approach breaks at this scale. Gyre is ready to dev, Forge is in discovery — both are immediate customers of the factory.

---

## Future State (12-24 Months)

### Where We're Headed
BMAD becomes a modular, community-extensible framework where adding a new team is a guided 2-hour workflow, not a 2-week deep dive. The framework ships with a growing library of teams built by different people, all structurally consistent and interoperable.

### Success Looks Like

**For users (colleagues):**
- A colleague can create a new BMAD team end-to-end without the framework creator's involvement
- Every team produced is structurally valid, has proper contracts, and passes validation
- No more "fixing up" teams others created

**For the framework:**
- 7+ teams, all built through the same factory process
- New teams are indistinguishable in quality from Vortex
- BMB + Team Factory = complete self-serve platform

**For the community:**
- Contributors submit well-formed teams via PR, not half-baked file dumps

### Key Milestones
- **M1:** Team Architecture Reference extracted from Vortex + native teams audit (the blueprint)
- **M2:** "Add Team" factory workflow operational — tested on Gyre
- **M3:** "Add Agent" and "Add Skill" workflows operational
- **M4:** First colleague creates a team fully self-served
- **M5:** 7 teams live, all factory-built

---

## Guiding Principles

### What We Won't Compromise
1. **Thinking before files** — Every team creation goes through discovery (problem space, agent roles, contracts, overlaps) before any file is generated
2. **BMAD compliance** — Output must be structurally indistinguishable from native BMAD teams. Same config pattern, same activation XML, same registry wiring
3. **No orphaned artifacts** — If a file is created, it's registered, wired, and discoverable. No dead files

### What We Say No To
- No "quick mode" that skips the thinking steps
- No teams without at least a validated module brief
- No agents without defined scope boundaries (to prevent overlap with existing agents)
- No contracts without both sender and receiver defined

### Our Values

**Trade-off framework:**
| When choosing between... | Winner |
|--------------------------|--------|
| Speed vs. Quality | Quality — a bad team is worse than no team |
| Flexibility vs. Consistency | Consistency — all teams follow the same patterns |
| Complete vs. Lean | Lean — start with minimum viable team, grow it |
| Generic vs. Opinionated | Opinionated — enforce BMM workflows, don't just suggest them |

**Product philosophy:**
- **Guided opinionation** — Strong defaults, enforced sequence, but room for creative decisions on *what* the team does (not *how* it's structured)
- **Delegate, don't duplicate** — Use BMB for file generation, don't rebuild it
- **Validate continuously** — Don't wait until the end to check; validate at each step

---

## Success Metrics

### North Star Metric
**Can a colleague with surface-level BMAD knowledge create a valid, fully-wired team without assistance?** — Binary quality gate.

### Supporting Metrics
- Time to create a team (target: hours, not days)
- Number of post-creation fixes required (target: zero)
- Validation pass rate on first attempt
- Number of teams created through the factory vs. manually

### Leading Indicators
- Colleague attempts a team creation without asking for help
- Factory-built teams pass the same validator as Vortex
- No orphaned files detected by `convoke-doctor`

---

## Strategic Assumptions

### Critical Assumptions (Must be true)
- The three-archetype model (Classic Module, Orchestrated Submodule, Extension) covers all future team patterns for v1
- BMB's artifact generation is solid enough to delegate to — no need to rebuild it
- Users will accept an opinionated, sequential process over freestyle file creation

### Important Assumptions (Should validate)
- The Vortex is a representative enough reference implementation to extract universal patterns from
- Colleagues have enough Claude Code fluency to follow a guided workflow without hand-holding
- 7 teams can be built with the same factory without hitting edge cases that break the model

### Nice-to-Validate (Lower priority)
- Community contributors adopt the factory (v1 targets internal users)
- Gyre and Forge validate the process without major rework

---

## Validation Plan

### How We'll Test This Vision

| Milestone | Validation Question | Success Criteria |
|-----------|-------------------|-----------------|
| M1: Blueprint | Does the blueprint capture all structural patterns? | Validated against Vortex + all native teams |
| M2: "Add Team" | Can it produce a Gyre-equivalent? | Gyre rebuilt through factory, passes validator |
| M3: Colleague test | Can a colleague create a team without help? | End-to-end completion, zero intervention |
| M4: Agent + Skill | Do smaller workflows work independently? | Agent added to existing team, skill wired correctly |
| M5: Scale test | Did the factory hold up at 7 teams? | All teams factory-built, structurally consistent |

### Timeline
- **M1** first — foundation for everything else
- **M2** immediately after — proves the concept
- **M3** is the real validation — proves the target user can self-serve
- **M4-M5** follow naturally

### Decision Criteria
**Assumptions to validate FIRST:**
1. The Vortex blueprint is generalizable (not Vortex-specific)
2. BMB delegation works cleanly (no rework needed)
3. An opinionated sequential process is fast enough that users don't abandon it

---

## Team Alignment

### Who Contributed
- Amalik (framework creator, primary user, product owner)
- Emma (contextualization-expert, Vortex Stream 1)

### Alignment Score
Fully aligned. Single decision-maker with clear vision.

### Open Questions
- How will alternative team architectures (single-agent, contract-less) be handled in v2?
- What's the right level of BMB delegation vs. custom generation for integration files?
- Should the factory produce migration files for team updates, or is that a separate concern?

---

**Created with:** Convoke v2.3.1 - Vortex Pattern (Contextualize Stream)
**Agent:** Emma (Contextualization Expert)
**Workflow:** product-vision
