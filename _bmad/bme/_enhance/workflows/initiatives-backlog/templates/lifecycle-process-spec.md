# Lifecycle Process Specification

Canonical text for **Part 1: Lifecycle Process** in the Convoke Initiative Lifecycle & Backlog file. Create mode emits this verbatim. Triage/Review modes load it for context but never modify it.

The text below the `---` marker is the verbatim Part 1 content. Do not edit it without coordinating with the lifecycle process governance — the same text appears in active backlog files and changing it requires migration.

---

## Part 1: Lifecycle Process

### 1.1 Intake

Any conversation about a problem, idea, observation, or improvement — regardless of source — enters the lifecycle as an **intake**.

**Intake rules:**

- Anyone can raise an intake: team members, code reviews, retros, party mode sessions, external feedback
- Intakes are logged immediately in Section 2.1 with: ID, description, source, date, raiser
- Intakes remain in the log permanently — they are the audit trail
- An intake has no lane, no priority, and no commitment until it passes the qualifying gate
- Intakes do not block or consume sprint capacity

**Logging format:**

| Field | Required | Description |
|-------|----------|-------------|
| ID | Yes | Sequential: `IN-{number}` |
| Description | Yes | One-line summary (detail in appendix if needed) |
| Source | Yes | Where it came from (code review, retro, party mode, user report, etc.) |
| Date | Yes | Date logged (absolute, not relative) |
| Raiser | Yes | Who raised it (person or agent name) |

### 1.2 Qualifying Gate

The qualifying gate is the single decision point that determines what happens to an intake. It is performed by one of three qualified parties:

1. **Vortex team** — through discovery (full 7-stream or partial)
2. **John (PM)** — product framing shortcut
3. **Winston (Architect)** — technical framing shortcut

**Gate rules:**

- John or Winston may shortcut the Vortex discovery phase when the problem is well-understood
- Vortex team can qualify intakes during discovery and ship spikes directly in a quick process
- The qualifier assigns: lane, portfolio attachment, and initial RICE score
- The qualifying decision is recorded with rationale
- For capability-type intakes (new skill, agent, or team proposals): run the **Capability Evaluation Framework** decision tree (`convoke-note-capability-evaluation-framework.md`) to determine form factor (Skill → Agent → Team) before assigning a lane. Friction log evidence (`convoke-note-friction-log-template.md`) is the required input signal — vision is not demand.

**Gate output:** one of three lanes.

### 1.3 Three Lanes

#### Bug Lane

**Trigger:** Something is broken — observed incorrect behavior, data loss risk, or regression.

**Pipeline:** Reproduce → Fix → Test → Ship

**Rules:**

- Bugs get a fix, not a redesign. The bug lane is for the fix only.
- If the fix reveals a deeper structural issue, spawn a follow-up:
  - Refactoring story or light epic → **Fast Lane**
  - Larger rework → **Initiative Lane**
- Risk vs. cost triage governs priority
- RICE scored — impact is often hardcoded high, effort is low, so bugs rise organically in the backlog

#### Fast Lane (Quick Wins + Spikes)

**Trigger:** The qualifier judges the full initiative pipeline unnecessary.

**Pipeline:** Story with ACs → Implement → Review → Ship

**What belongs here:**

- Point fixes from code reviews
- Refactoring follow-ups from bug fixes
- Process rules to encode
- Small enhancements (single-module, contained scope)
- Spikes (time-boxed learning with uncertain outcome)
- Documentation improvements
- Test debt items

**Rules:**

- Vortex team can ship spikes directly during discovery
- Each item gets a story with acceptance criteria before implementation
- RICE scored — low effort denominator means good items rise naturally
- Can be bundled into themed groups for sprint planning

#### Initiative Lane

**Trigger:** The work is multi-module, requires architectural decisions, affects user-facing behavior, or has enough scope that skipping planning steps would create risk.

**Pipeline (sequential, non-skippable):**

```
Brief → PRD → Architecture → PRD Validation → IR → Epic Breakdown
```

**Rules:**

- Full pipeline, no way out. No step can be skipped.
- The only shortcut is at intake qualification — John or Winston can qualify without Vortex discovery. Once qualified as an initiative, the pipeline is the pipeline.
- Attaches to a portfolio item (existing taxonomy or new — see 1.4)
- RICE scored
- Pipeline stages track progress (see 1.5)

**v6.3 Adoption standard (reference bar):**

The BMAD v6.3 Adoption initiative established the quality bar: 50 FRs, 33 NFRs, 16 failure modes mitigated, 12-check PRD validation (5/5), full FR→Architecture→Epic traceability, pre-registered experiments, innovation hypotheses with falsification criteria. This is the benchmark.

### 1.4 Portfolio Attachment

Every initiative attaches to a portfolio item. The portfolio item answers: "which part of the product does this serve?"

**Current taxonomy:**

| Portfolio Item | Scope |
|---------------|-------|
| convoke | Core platform, CLI, update system, meta-infrastructure |
| vortex | Discovery team (7 agents, Shiftup Innovation Vortex) |
| gyre | Readiness team (contextual assessment) |
| forge | Knowledge extraction team (brownfield capture) |
| bmm | Build module (upstream BMAD agents, workflows) |
| enhance | Skills module (workflow extensions on existing agents) |
| loom | Orchestration / Team Factory |
| helm | Strategic governance |

**Taxonomy growth rule:**

- New portfolio items are created when an initiative doesn't fit any existing item
- Decision to create a new portfolio item is made by John + Winston
- New items are logged with rationale

**Fast Lane and Bug Lane items** also receive a portfolio attachment where applicable, for traceability. Items that are purely cross-cutting may use `convoke`.

### 1.5 Pipeline Stages (Evolvable)

Initiatives in the Initiative Lane track their progress through pipeline stages.

**Current stages:**

| Stage | Meaning |
|-------|---------|
| **Qualified** | Passed the gate. Lane and portfolio assigned. No planning artifacts yet. |
| **In Pipeline** | Planning work in progress (Brief, PRD, Architecture, etc.) |
| **Ready** | Full pipeline complete — Brief + PRD + Arch + PRD Validation + IR + Epics all exist |
| **In Sprint** | Stories are being executed |
| **Done** | Shipped |

**Artifacts tracking (within "In Pipeline"):**

Each initiative's row includes an artifacts indicator showing what exists:

- `B` = Brief
- `P` = PRD
- `P✓` = PRD validated
- `A` = Architecture
- `IR` = Implementation Readiness report
- `E` = Epic breakdown
- `D` = Discovery (Vortex)

Example: `D, P✓, A, IR, E` = has Discovery, validated PRD, Architecture, IR report, and Epic breakdown.

**Stage evolution rule:**

- These stages are configuration, not dogma
- Stages are adapted when evidence shows the current set is insufficient
- Changes are logged with rationale and date in this section

### 1.6 RICE Scoring

RICE scoring applies to **all three lanes**. It determines priority within each lane.

| Factor | Scale | Description |
|--------|-------|-------------|
| **Reach** | 1–10 | How many users/quarter will this affect? (10 = all users, 1 = edge case) |
| **Impact** | 0.25–3 | Per-user impact (3 = massive, 2 = high, 1 = medium, 0.5 = low, 0.25 = minimal) |
| **Confidence** | 20–100% | How sure are we about reach and impact estimates? |
| **Effort** | 1–10 | Relative effort in story points (1 = trivial, 10 = multi-epic) |
| **Score** | calculated | (Reach x Impact x Confidence) / Effort |

**Lane-specific scoring notes:**

- **Bug Lane:** Impact is often hardcoded high (2–3) when user-facing. Effort is typically low (1–2). Bugs rise organically.
- **Fast Lane:** Effort is typically 1–3. Items above score 3.0 are strong sprint candidates.
- **Initiative Lane:** Full RICE applies. Effort reflects pipeline + execution (not just coding).
