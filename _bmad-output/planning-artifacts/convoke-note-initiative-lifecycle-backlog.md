---
initiative: convoke
artifact_type: note
qualifier: initiative-lifecycle-backlog
created: '2026-04-12'
schema_version: 1
status: draft
origin: party-mode-session-2026-04-12 (John, Winston, Amalik)
supersedes: convoke-note-initiatives-backlog.md
---

# Convoke Initiative Lifecycle & Backlog

**Created:** 2026-04-12
**Origin:** Party mode session — John (PM), Winston (Architect), Amalik
**Status:** Draft (Pass 2 — full backlog populated from retroactive review)

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

---

## Part 2: Backlog

**Migration note:** Pass 2 reclassified all 88 items from `convoke-note-initiatives-backlog.md` into the three-lane model. Original IDs preserved for traceability. Items previously in "Completed" moved to §2.5. Items previously in "Exploration Candidates" moved to §2.1 (Intakes) — they never passed a qualifying gate.

### 2.1 Intakes (Unqualified)

Items awaiting qualification. No lane, no priority, no commitment.

| ID | Description | Source | Date | Raiser |
|----|-------------|--------|------|--------|
| IN-1 (was N1) | Usage telemetry (opt-in) — track workflow usage, completion rates, drop-off | Multi-agent review (Noah) | 2026-03-08 | Noah |
| IN-2 (was P5) | Convoke website — public landing/docs site, team showcase, getting started | Product owner | 2026-03-08 | Amalik |
| IN-3 (was P6) | Tool-enabled agents — select agents use external tools (MCP, CLI, file ops) | Product owner | 2026-03-08 | Amalik |
| IN-4 (was H4) | Validate "strategic conversation" hypothesis — measure triage engagement (modification rate) | P4 PRD (Innovation Hypotheses) | 2026-03-15 | John |
| IN-5 (was D4) | Video walkthrough or tutorial — screencast of Emma's Lean Persona workflow | Contributing section | 2026-03-08 | Maya/Carson |
| IN-6 (was W1) | Wardley Mapping as shared capability — cross-team strategic lens (multiple agents) | Winston ArcKit analysis | 2026-03-22 | Winston |
| IN-7 (was W2) | Pre-write artifact validation hooks — Claude Code hooks validating artifacts before write | Winston ArcKit analysis | 2026-03-22 | Winston |
| IN-8 (was P9-wka) | Forge Written Knowledge Analysis agent — potential third Forge agent for doc/code analysis | Emma contextualization | 2026-03-22 | Emma |
| IN-9 | Initiative Lifecycle Engine — product-lens rework of backlog/portfolio/governance skills into integrated lifecycle management → ILE-1 | Party mode session | 2026-04-12 | Amalik (via John+Winston) |

**Notes on intakes:**

- IN-1, IN-2, IN-3, IN-5 were flagged as "Next Step: define scope" — never qualified.
- IN-4 is an innovation hypothesis awaiting observation data.
- IN-6 and IN-7 need qualification against the Capability Evaluation Framework (which P10 delivered).
- IN-8 needs Forge shadow engagement evidence before qualification.
- IN-9 was qualified by John+Winston on 2026-04-15 → ILE-1 in §2.4 Initiative Lane (portfolio: helm). The intake row stays here as audit trail per §1.1.

### 2.2 Bug Lane

Active bugs — fix pipeline only. Deeper follow-ups spawn Fast Lane or Initiative items.

| ID | Description | R | I | C | E | Score | Portfolio | Status | Dependencies | Linked Follow-up |
|----|-------------|---|---|---|---|-------|-----------|--------|--------------|------------------|
| *(none active)* | | | | | | | | | | — |

**Note:** No actively broken functionality in the backlog as of 2026-04-12. All previous latent risks (YAML parsing, atomic writes, etc.) were never observed as bugs — they sit in Fast Lane as preventive hardening.

### 2.3 Fast Lane (Quick Wins + Spikes)

Items qualified as not needing the full initiative pipeline. Sorted by RICE score.

| ID | Description | R | I | C | E | Score | Portfolio | Status | Dependencies |
|----|-------------|---|---|---|---|-------|-----------|--------|--------------|
| T6 | Python test execution in CI (blocker — Gyre DL-001) | 8 | 2 | 90% | 1 | 14.4 | convoke | Shipped | — |
| I43 | Doctor validates all 12 bme agent skill wrappers | 8 | 2 | 80% | 2 | 6.4 | convoke | Backlog | ✓I34 |
| A7 | Review convergence rule (R1 mandatory, R2 if HIGH, R3 if structural) | 8 | 1 | 80% | 1 | 6.4 | convoke | Backlog | — |
| P10 | Operationalize Capability Evaluation Framework (doc complete, needs integration) | 7 | 2 | 80% | 2 | 5.6 | helm | Backlog | — |
| P11 | Distribute friction log template to consulting teams | 8 | 1 | 70% | 1 | 5.6 | helm | Backlog | — |
| U7 | Changelog surface during `convoke-update` | 8 | 2 | 80% | 3 | 4.3 | convoke | Backlog | — |
| I49 | Process uniformity — encoded constraints file (project-context.md) | 8 | 2 | 80% | 3 | 4.3 | convoke | Backlog | — |
| U8 | Respect user agent exclusions on update | 6 | 2 | 80% | 3 | 3.2 | convoke | Backlog | — |
| A5 | Research stories must use mechanical search protocol | 7 | 1 | 80% | 2 | 2.8 | convoke | Backlog | — |
| T3 | End-to-end update test on real project | 5 | 2 | 80% | 3 | 2.7 | convoke | Backlog | — |
| I50 | `--quiet` flag for `convoke-export` batch mode (or drop) | 6 | 0.5 | 90% | 1 | 2.7 | enhance | Backlog | — |
| T4 | Migration idempotency CLI test | 3 | 1 | 80% | 1 | 2.4 | convoke | Backlog | — |
| T7 | Python linting in CI pipeline | 6 | 1 | 80% | 2 | 2.4 | convoke | Shipped | ✓T6 |
| I2 | `gh auth` for CI release creation | 6 | 1 | 80% | 2 | 2.4 | convoke | Backlog | — |
| I20 | Portfolio markdown formatter — render `--show-unattributed` | 5 | 0.5 | 90% | 1 | 2.3 | enhance | Backlog | — |
| D2 | Add output examples for more agents (Isla, Wade, Noah) | 6 | 1 | 70% | 2 | 2.1 | convoke | Backlog | — |
| I16 | Skill description generator — semantic descriptions for bme skills | 5 | 0.5 | 80% | 1 | 2.0 | convoke | Backlog | — |
| I22 | Resolution-map key normalization (migration skill) | 5 | 1 | 80% | 2 | 2.0 | enhance | Backlog | — |
| I25 | Resolution-map missing-from-manifest validation | 5 | 0.5 | 80% | 1 | 2.0 | enhance | Backlog | — |
| P22 | SP Epic 6 — skill portability UX slash command wrappers (4 stories) | 7 | 1 | 70% | 4 | 1.2 | enhance | Backlog | — |
| I1 | NPM_TOKEN secret for CI publish | 8 | 2 | 90% | 8 | 1.8 | convoke | Backlog | — |
| I7 | Team Factory CSV quoting hardening | 4 | 0.5 | 90% | 1 | 1.8 | loom | Backlog | — |
| I23 | Format contract test between CLI and migration skill | 4 | 0.5 | 90% | 1 | 1.8 | enhance | Backlog | — |
| A6 | Structured-source for count-sensitive deliverables | 5 | 1 | 70% | 2 | 1.8 | convoke | Backlog | — |
| T8 | Standardize Python PEP 723 dependency declarations | 4 | 0.5 | 80% | 1 | 1.6 | convoke | Shipped | ✓T6 |
| D6 | Reduce narrative overlap in journey example | 4 | 0.5 | 80% | 1 | 1.6 | convoke | Backlog | — |
| I18 | Pre-compile regex in `_scanCorpusForInitiative` per migration run | 4 | 0.5 | 80% | 1 | 1.6 | enhance | Backlog | — |
| I36 | `yaml` package `doc.warnings` ignored at 5 write sites | 4 | 0.5 | 80% | 1 | 1.6 | convoke | Backlog | — |
| U4 | Test upgrade-path step file cleanup | 3 | 1 | 90% | 2 | 1.4 | convoke | Backlog | — |
| I9 | Registry writer idempotency drift detection | 3 | 0.5 | 90% | 1 | 1.4 | loom | Backlog | — |
| I5 | Workflow output naming enforcement (ADR Phase C) | 8 | 0.5 | 90% | 3 | 1.2 | convoke | Backlog | — |
| I21 | Parent-dir attribution scan over-match on multi-token dirs | 3 | 0.5 | 70% | 1 | 1.1 | enhance | Backlog | — |
| I26 | Portfolio skill — case-insensitive input + alias normalization | 5 | 0.25 | 90% | 1 | 1.1 | enhance | Backlog | — |
| I51 | Manifest duplicate rows hygiene (same skill across modules) | 3 | 0.5 | 70% | 1 | 1.1 | enhance | Backlog | — |
| I28 | Portfolio engine — `--filter` interaction with summary lines | 5 | 0.5 | 80% | 2 | 1.0 | enhance | Backlog | — |
| D3 | BMAD Core return arrow in diagram | 4 | 0.25 | 90% | 1 | 0.9 | convoke | Backlog | — |
| I10 | Config appender YAML comment preservation (Team Factory) | 4 | 0.5 | 90% | 2 | 0.9 | loom | Backlog | — |
| I15 | `validateManifest` CSV parsing — replace substring matching | 4 | 0.5 | 90% | 2 | 0.9 | convoke | Backlog | bundles-with: I45, I48 |
| I27 | Portfolio skill — Option [4] empty-state messaging | 4 | 0.25 | 90% | 1 | 0.9 | enhance | Backlog | — |
| I52 | Collision resolution flag for migration CLI | 4 | 0.5 | 90% | 2 | 0.9 | enhance | Backlog | — |
| I33 | Workflow-name namespace collision risk (verbatim names) | 4 | 1 | 70% | 3 | 0.9 | enhance | Backlog | ✓I32 (I32 made orphan deletion active — blast radius increased) |
| I39 | Non-atomic version stamp writes in `refresh-installation.js` | 4 | 1 | 70% | 3 | 0.9 | convoke | Backlog | bundles-with: I46 |
| A1 | Add validate menu items to Wave 3 Vortex agents (Mila, Liam, Noah) | 4 | 0.5 | 80% | 2 | 0.8 | vortex | Backlog | — |
| A3 | Add `agentic` + `team-of-teams` npm keywords | 3 | 0.25 | 100% | 1 | 0.8 | convoke | Backlog | — |
| I6 | `--verbose` flag across all CLI commands | 4 | 0.5 | 80% | 2 | 0.8 | convoke | Backlog | — |
| T1 | `convoke-update.js` coverage to 80%+ | 3 | 1 | 80% | 3 | 0.8 | convoke | Backlog | — |
| U2 | Validate migration modules at load time | 2 | 0.5 | 80% | 1 | 0.8 | convoke | Backlog | — |
| I17 | `suggestDifferentiator` — support extensions beyond `.md`/`.yaml` | 4 | 0.25 | 80% | 1 | 0.8 | enhance | Backlog | — |
| I19 | Share `_scanCorpus` between portfolio engine and migration suggester | 4 | 0.25 | 80% | 1 | 0.8 | enhance | Backlog | — |
| I41 | `convoke-doctor` `console.warn` breaks structured-output contract | 4 | 0.25 | 80% | 1 | 0.8 | convoke | Backlog | — |
| I35 | Naive `split('\n')` CSV parsing — CRLF + quoted-newline edges | 4 | 0.5 | 70% | 2 | 0.7 | convoke | Backlog | — |
| I40 | `loadSkillManifest` Map silently overwrites duplicate paths | 3 | 0.25 | 90% | 1 | 0.7 | convoke | Backlog | — |
| I44 | No `validateGyreModule` function in validator.js | 2 | 1.5 | 70% | 3 | 0.7 | gyre | Backlog | ✓I34 |
| I8 | Team Factory write verification — value correctness | 3 | 0.5 | 80% | 2 | 0.6 | loom | Backlog | — |
| U3 | Robust version detection fallback | 3 | 0.5 | 60% | 2 | 0.5 | convoke | Backlog | — |
| I11 | Registry Fragment Architecture (D-Q6) | 3 | 1 | 60% | 4 | 0.5 | loom | Backlog | — |
| I13 | Team Factory Express Mode (pre-filled spec file input) | 2 | 1 | 70% | 3 | 0.5 | loom | Backlog | — |
| I37 | Non-scalar/merge/anchor YAML keys crash `writeConfig` loop | 3 | 0.25 | 70% | 1 | 0.5 | convoke | Backlog | — |
| I46 | Version-stamp post-check absence in refresh | 2 | 1 | 50% | 2 | 0.5 | convoke | Backlog | ✓I34, bundles-with: I39 |
| T2 | `convoke-version.js` coverage to 80%+ | 2 | 0.5 | 80% | 2 | 0.4 | convoke | Backlog | — |
| I12 | Validator.js hardcoded to Vortex paths (make module-agnostic) | 3 | 0.5 | 80% | 3 | 0.4 | convoke | Backlog | — |
| I3 | CSV parser library for manifest (replace regex) | 2 | 0.25 | 70% | 1 | 0.4 | convoke | Backlog | — |
| I24 | Mock git in unit tests instead of bumping timeouts | 4 | 0.25 | 80% | 2 | 0.4 | enhance | Backlog | — |
| I47 | Doctor missing Enhance menu-patch check + parallel coverage consolidation | 1 | 1 | 70% | 2 | 0.35 | convoke | Backlog | ✓I34 |
| T5 | Expand docs audit — tense consistency + prose patterns | 2 | 0.5 | 60% | 2 | 0.3 | convoke | Backlog | — |
| I38 | `mergeConfig` Document mutation not idempotent across writes | 2 | 0.5 | 80% | 3 | 0.3 | convoke | Backlog | — |
| I48 | Agent-manifest.csv doctor check + CSV-parse validator upgrade | 2 | 0.5 | 60% | 2 | 0.3 | convoke | Backlog | ✓I34, bundles-with: I15 |
| A4 | Fix temp dir prefix inconsistency (`bmad-` vs `convoke-`) | 1 | 0.25 | 100% | 1 | 0.3 | convoke | Backlog | — |
| A2 | Create `.agent.yaml` source files for Vortex agents | 2 | 0.5 | 60% | 4 | 0.2 | vortex | Backlog | — |
| I42 | `MERGED_DOC_SENTINEL` doesn't survive spread or JSON-serialize | 2 | 0.25 | 70% | 2 | 0.2 | convoke | Backlog | — |
| I53 | Carry-forward: CRLF writeManifest + basename collision | 2 | 0.25 | 40% | 1 | 0.2 | enhance | Backlog | — |
| I45 | Workflow-manifest CSV registration drift not validated | 1 | 0.5 | 60% | 2 | 0.15 | convoke | Backlog | ✓I34, bundles-with: I15 |

### 2.4 Initiative Lane

Items requiring the full pipeline: Brief → PRD → Arch → PRD Validation → IR → Epics.

| ID | Description | R | I | C | E | Score | Portfolio | Stage | Artifacts | Dependencies |
|----|-------------|---|---|---|---|-------|-----------|-------|-----------|--------------|
| P21 | **Convoke Experience Contract — codified UX rules + Loom validation gate** | 9 | 2 | 80% | 3 | 4.8 | convoke | **Qualified** | Candidate doc | — |
| S3 | **One-command standalone install (`npx convoke-agents init`)** | 9 | 2 | 80% | 4 | 3.6 | convoke | **Qualified** | Strategy doc | — |
| P12 | **Enhance framework — Team Module Generator (BMB)** | 8 | 3 | 80% | 6 | 3.2 | enhance | **Qualified** | ADR only | — |
| P9 | **Forge team — Domain Knowledge Extraction** | 9 | 3 | 90% | 8 | 3.0 | forge | **In Pipeline** (Blocked on Gate 1) | D, E(partial) | external: shadow engagement (Gate 1) |
| P13 | **Vortex redesign (align to Enhance-codified patterns)** | 7 | 2 | 70% | 4 | 2.5 | vortex | **Qualified** (Blocked on P12) | — | P12 |
| U10+P23+A8+A9 | **BMAD v6.3.0 Adoption (Convoke 4.0)** | 10 | 2 | 80% | 7 | 2.3 | convoke | **In Sprint** | B, P✓, A, IR, E | external: BMAD v6.3.0 release |
| ILE-1 | **Initiative Lifecycle Engine** (rework of backlog/portfolio/governance skills into integrated lifecycle management) | 9 | 3 | 60% | 8 | 2.0 | helm | **Qualified** | — | ✓P15, ✓bmad-enhance-initiatives-backlog-v2.0.0 |
| U9 | **Module-aware refresh and validation (modules-manifest.yaml)** | 8 | 2 | 70% | 6 | 1.9 | convoke | **Qualified** | — | — |
| P3 | **Team installer architecture (`convoke-install <module-name>`)** | 6 | 1 | 80% | 4 | 1.2 | convoke | **Qualified** | — | bundles-with: S3 |
| P7 | **ML/AI Engineering team exploration** | 6 | 2 | 30% | 3 | 1.2 | *(pending)* | **Qualified** (needs discovery) | — | — |
| P8 | **Governance & Support skill set** | 5 | 1 | 30% | 3 | 0.5 | helm | **Qualified** (needs discovery) | — | — |
| P2 | **Multi-module collaboration workflows (cross-team handoffs)** | 5 | 2 | 30% | 8 | 0.4 | convoke | **Qualified** (Unblocked by P1) | — | ✓P1 |

**Notes on initiatives:**

- **v6.3 Adoption** is the only initiative at **In Sprint** with the full artifact set. This is the reference standard.
- **P9 (Forge)** has complete Vortex discovery (all 7 streams, 9 artifacts) and partial epic breakdown. Missing: formal PRD, Architecture, IR report. Blocked on Gate 1 (shadow engagement).
- **P12 (Enhance)** has only an ADR. Needs the full pipeline before build.
- **S3, P21, U9, P3, P13, P7, P8, P2** are all **Qualified** — they have a backlog entry and rationale but no planning artifacts. Next step: Product Brief.
- **P7** portfolio is pending — could be a new portfolio item or absorbed into an existing one. Decision deferred to qualification session.

### 2.5 Absorbed / Archived

Items removed from the active backlog. Nothing disappears without a receipt.

#### Absorbed into v6.3 Adoption epic breakdown

| ID | Original Description | Absorbed Into | Reference | Date |
|----|---------------------|---------------|-----------|------|
| A8 | Adopt upstream Amelia consolidation (WS3) | v6.3 Adoption Epic 1B | `convoke-epic-bmad-v6.3-adoption.md` §Epic 1B | 2026-04-12 |
| A9 | Convoke extensions compatibility governance (WS4) | v6.3 Adoption Epic 2 | `convoke-epic-bmad-v6.3-adoption.md` §Epic 2 | 2026-04-12 |
| U10 | BMAD v6.3.0 direct-load migration (WS1) | v6.3 Adoption Epic 1A | `convoke-epic-bmad-v6.3-adoption.md` §Epic 1A | 2026-04-12 |
| P23 | BMAD v6.3.0 marketplace publication (WS2) | v6.3 Adoption Epic 3 | `convoke-epic-bmad-v6.3-adoption.md` §Epic 3 | 2026-04-12 |

**Note:** U10/P23/A8/A9 are grouped as a single initiative in §2.4 for visibility; their individual scope is absorbed into epic stories.

#### Absorbed into larger initiatives

| ID | Original Description | Absorbed Into | Reference | Date |
|----|---------------------|---------------|-----------|------|
| S1 | Interactive installer with project-type questions | S3 (One-command install) | Backlog item S3 explicitly subsumes S1 | 2026-04-12 |
| S2 | Simplified entry point — single "Start Discovery" command | S3 (One-command install) | S3 includes guided first-run experience | 2026-04-12 |

#### Completed (shipped)

| ID | Description | Shipped | Score | Portfolio |
|----|-------------|---------|-------|-----------|
| I14 | Artifact Governance — naming convention, taxonomies, migration skill (7 epics) | 2026-04-10 | 3.2 | convoke |
| P15 | Portfolio skill — cross-initiative visibility, WIP radar, context re-entry | 2026-04-10 | 1.7 | convoke |
| P16 | Standalone skills repository (49 skills, 86 tests) | 2026-04-10 | 4.2 | enhance |
| P17 | Skill portability metadata schema | 2026-04-10 | 2.8 | enhance |
| P18 | LLM-agnostic skill exporter CLI (`convoke-export`) | 2026-04-10 | 1.9 | enhance |
| P19 | Intent-based skill catalog generator | 2026-04-10 | 1.9 | enhance |
| P20 | Multi-platform adapter generation (Claude Code, Copilot, Cursor) | 2026-04-10 | 1.8 | enhance |
| I29 | YAML comment preservation on module config version stamp | 2026-04-10 | 1.2 | convoke |
| I30 | `acContent.version` unguarded against `undefined` (`assertVersion` guard) | 2026-04-10 | 9.6 | convoke |
| I31 | `convoke-doctor` validates skill wrappers (`checkModuleSkillWrappers`) | 2026-04-10 | 3.2 | convoke |
| I32 | Orphan skill-wrapper cleanup (`cleanupOrphanWorkflowWrappers`) | 2026-04-10 | 1.0 | convoke |
| I34 | Validator/refresh contract audit (25-row catalogue) | 2026-04-10 | 2.4 | convoke |
| P14 | Team Factory — Guided Team Creation Workflow (3 epics, 16 stories, 156 tests) | 2026-03-25 | 3.6 | loom |
| I4 | BMAD v6.2.1 convention alignment (3 specs) | 2026-03-25 | 2.0 | convoke |
| P1 | Gyre team — Operational Readiness (4 epics, 25 stories, 4 agents) | 2026-03-24 | 3.6 | gyre |
| P4 | Enhance module — BME section with RICE initiatives backlog skill | 2026-03-16 | 2.8 | enhance |
| S4 | Migrate to skills format & native module compliance (v2.2.0) | 2026-03-14 | 3.6 | convoke |
| S3 *(original)* | Install BME slash commands with Vortex | 2026-03-14 | 8.0 | convoke |
| D7 | Fix ASCII art banner and Vortex stream diagram (v2.0.1) | 2026-03-09 | 8.1 | convoke |
| D5 | Problem-framing sentence in README (v2.0.1) | 2026-03-09 | 8.1 | convoke |
| D1 | Workflow list in README or docs (v2.0.1) | 2026-03-09 | 5.6 | convoke |
| U5 | `postinstall.js` npx command fix (v2.0.1) | 2026-03-09 | 4.0 | convoke |
| U1 | Check migration history before delta execution (v2.0.1) | 2026-03-09 | 3.2 | convoke |

**ID collision note:** The current S3 (One-command standalone install) reuses an ID previously assigned to a completed item ("Install BME slash commands with Vortex", 2026-03-14). Original S3 preserved above as `S3 *(original)*` for audit. Future ID assignment should avoid reuse.

---

## Appendix: Initiative Details

Full descriptions for items in §2.4 whose table row is a one-liner.

### U10+P23+A8+A9 — BMAD v6.3.0 Adoption (Convoke 4.0)

**Stage:** In Sprint | **Portfolio:** convoke | **RICE:** 2.3 (U10 dominant)

**Planning artifacts (complete):**

- Briefing: `briefing-bmad-v6.3-adoption.md`
- PRD (sharded, 14 files): `convoke-prd-bmad-v6.3-adoption/index.md` — validated 5/5 across 12 systematic checks
- Architecture: `convoke-arch-bmad-v6.3-adoption.md` — 8 decisions, 16 failure modes
- PRD Validation Report: `convoke-report-prd-validation-bmad-v6.3-adoption.md`
- Implementation Readiness: `convoke-report-implementation-readiness-bmad-v6.3-adoption.md`
- Epic Breakdown: `convoke-epic-bmad-v6.3-adoption.md` — 28 stories, 50/50 FRs mapped, 5 sprints

**Sub-workstreams (absorbed into epics):**

- **WS1 (U10):** Direct-load migration — retire `bmad-init`, migrate ~25 agent SKILL.md files. Epic 1A.
- **WS2 (P23):** Marketplace publication — `.claude-plugin/marketplace.json`, registry PR. Epic 3.
- **WS3 (A8):** Upstream Amelia consolidation — remove Bob/Quinn/Barry. Epic 1B.
- **WS4 (A9):** Extensions compatibility governance — `bmm-dependencies.csv` registry. Epic 2.

### P9 — Forge team (Domain Knowledge Extraction / KORE)

**Stage:** In Pipeline (Blocked on Gate 1) | **Portfolio:** forge | **RICE:** 3.0

**Planning artifacts:**

- Vortex Discovery (complete, all 7 streams, 9 artifacts in `_bmad-output/vortex-artifacts/`)
- Epic breakdown (partial): `epics-forge-phase-a.md`
- Ecosystem vision: `convoke-vision-ecosystem.md`
- Forge-Gyre handoff contract: `forge-gyre-handoff-contract.md`

**Missing (to reach Ready):** Formal PRD, Architecture, PRD Validation report, IR report.

**Blocker:** Gate 1 (shadow engagement) — 6-week concierge+A/B experiment on brownfield engagement validates KORE methodology before Phase A build. Team Factory (loom) is ready to scaffold when Gate 1 passes.

**Key artifacts from discovery:** scope decision (4.65/5), 2 lean personas, HC2-HC6 chain, 15 signals, 6 anomaly patterns, 4 decision gates. Phase A targets Silo (Survey) + Rune (Excavate).

### P12 — Enhance framework (Team Module Generator / BMB)

**Stage:** Qualified | **Portfolio:** enhance | **RICE:** 3.2

**Planning artifacts:** ADR `adr-enhance-gyre-build-sequencing.md` (sequencing decision only, not feature PRD).

**Missing (to reach Ready):** Brief, PRD, Architecture, PRD Validation, IR, Epics.

**Scope hint:** Meta-tool generating new Convoke team modules from templates. 6-step workflow (Discovery, Agent Design, Contract Design, Workflow Design, Integration, Validation). Extracts templates from Vortex + Gyre (two proven reference modules). **MVP = Structural tier** (parameterized XML activation protocol — no LLM-generated content).

**Note:** This initiative is often cited as the reusable pattern for future teams (Forge). Its planning quality directly impacts downstream initiative velocity.

### S3 — One-command standalone install

**Stage:** Qualified | **Portfolio:** convoke | **RICE:** 3.6

**Planning artifacts:** `docs/standalone-decoupling-strategy.md` (strategy, not PRD).

**Missing:** Brief, PRD, Architecture, PRD Validation, IR, Epics.

**Scope hint:** Replace two-step flow (`npm install -g` + `convoke-install`) with single `npx convoke-agents init`. Subsumes S1 (interactive questions) and S2 (simplified entry point). Unified `convoke-install` with flags for global-install users.

### P21 — Convoke Experience Contract

**Stage:** Qualified | **Portfolio:** convoke | **RICE:** 4.8

**Planning artifacts:** `backlog-candidate-experience-contract.md` (candidate doc, not PRD).

**Missing:** Brief, PRD, Architecture, PRD Validation, IR, Epics.

**Scope hint:** Codify operator-facing interaction patterns all Convoke skills must follow (suggest defaults, batch lists, explain WHY, never silently drop data, wait for input, actionable errors, max 3 new concepts per round). Becomes a Loom validation gate (Step 05) for new skills + retrofit candidate for existing skills.

### U9 — Module-aware refresh and validation

**Stage:** Qualified | **Portfolio:** convoke | **RICE:** 1.9

**Missing:** Brief, PRD, Architecture, PRD Validation, IR, Epics.

**Scope hint:** Create `_bmad/_config/modules-manifest.yaml` as explicit module registry (installed modules + version + enabled flag). Make `refreshInstallation()` and validator conditional on manifest. Update installers to register modules. Backward-compat migration auto-generates manifest from filesystem state.

### P3 — Team installer architecture

**Stage:** Qualified | **Portfolio:** convoke | **RICE:** 1.2

**Missing:** Brief, PRD, Architecture, PRD Validation, IR, Epics.

**Scope hint:** Generalize `convoke-install-vortex` to `convoke-install <module-name>`. Installer understands `bmad-skill-manifest.yaml` (v6.2.0 convention). Related to S3 (possibly absorbable).

### P13 — Vortex redesign (align to Enhance patterns)

**Stage:** Qualified (Blocked on P12) | **Portfolio:** vortex | **RICE:** 2.5

**Blocker:** Depends on P12 Enhance template lock (Phase 4 of ADR-001).

**Missing:** Brief, PRD, Architecture, PRD Validation, IR, Epics.

**Scope hint:** Retroactively align Vortex to Enhance-codified patterns. Vortex *consumes* Enhance templates for validation — must not feed them.

### P7 — ML/AI Engineering team exploration

**Stage:** Qualified (needs discovery) | **Portfolio:** *(pending)* | **RICE:** 1.2

**Missing:** Everything — starts with Vortex discovery.

**Scope hint:** Discovery spike to determine team-vs-skill question for ML/AI domain. Evaluate through Capability Evaluation Framework (P10) before committing form factor. Options: new team (3-4 agents) vs. Enhance-style skills.

### P8 — Governance & Support skill set

**Stage:** Qualified (needs discovery) | **Portfolio:** helm | **RICE:** 0.5

**Missing:** Everything — starts with discovery.

**Scope hint:** Transversal advisory skills (compliance, coaching, change management). "Review and advise" pattern — not a team but cross-cutting capability. Skills for PM (compliance), SM (coaching), Architect (change management).

### P2 — Multi-module collaboration workflows

**Stage:** Qualified (Unblocked by P1) | **Portfolio:** convoke | **RICE:** 0.4

**Missing:** Brief, PRD, Architecture, PRD Validation, IR, Epics.

**Scope hint:** Cross-module handoffs and routing between Teams (Vortex, Gyre) and Skills (Enhance). Example: Enhance backlog feeding Vortex discovery.

### ILE-1 — Initiative Lifecycle Engine

**Stage:** Qualified | **Portfolio:** helm | **RICE:** 2.0

**Origin:** Party mode session 2026-04-12 (John, Winston, Amalik). Qualified 2026-04-15 by John+Winston (per §1.2 shortcut rule).

**Planning artifacts:** None yet. Intake row in §2.1 (IN-9) is the only existing reference.

**Missing (to reach Ready):** Brief, PRD, Architecture, PRD Validation, IR, Epics.

**Scope hint (three workstreams):**

1. **Rework existing skills as views on a shared model.**
   - `bmad-enhance-initiatives-backlog` becomes the **write surface** (lifecycle-aware, lane-aware) — already reworked in 2026-04-15 session as v2.0.0; data model still implicit
   - `bmad-portfolio-status` becomes the **read surface** (cross-initiative dashboard, pipeline completeness, WIP signals)
   - `bmad-migrate-artifacts` feeds the shared model (artifact creation auto-advances pipeline stage)
   - All three need a **shared data layer** (structured source + generated markdown views)

2. **Enhance with new capabilities:**
   - Kanban view (columns = lifecycle stages, rows = initiatives, WIP limits)
   - Backlog-portfolio integration (creating a PRD auto-advances stage)
   - Pipeline completeness dashboard (live "what artifacts exist?" computed from disk)

3. **Reactive behaviors layer:**
   - New initiative logged → orphan intake scan suggests attachment
   - Artifact created → pipeline stage auto-advances
   - Sprint closes → staleness detector flags broken file references
   - RICE rescore requested → pulls current context (recent ships, adjacent changes)
   - Epic completed → close absorbed items + unblock dependent items

**Why helm (portfolio):** This is strategic governance tooling. Per §1.4 taxonomy, helm covers strategic governance — this is its flagship feature. Helm doesn't exist as a built team yet, but initiatives can attach to portfolio items that aren't yet scaffolded (precedent: P9 attached to forge before Forge team exists).

**Why Initiative (lane):** Multi-module (3 skills + new shared layer), architectural (shared data model + reactive behaviors), user-facing (kanban + new commands), substantial scope (three workstreams). All §1.3 Initiative triggers fire.

**Risk note:** Portfolio attachment (helm) is a current-best-fit, not a final answer. If WS3 planning surfaces a better home (e.g., a new "governance" portfolio item), revisit per §1.4 growth rule.

**Scope precedents already absorbed (do not duplicate in pipeline):**
- WS1 (process rules + restructure) and WS2 (retroactive review) — already executed as spikes on 2026-04-15 (Pass 1 and Pass 2 of the lifecycle backlog)
- The skill rework of `bmad-enhance-initiatives-backlog` v2.0.0 — already shipped 2026-04-15, but only the write surface; the shared data model and integration with the other two skills remain

---

## Change Log

| Date | Change |
|------|--------|
| 2026-04-17 | **T7 shipped.** Ruff linting added to CI (`python-test` job, piggybacked on T6). Config: `ruff.toml` (line-length 120, select E/W/F/I/N/UP, per-file E501 ignores for HTML generators + data-heavy files). 40 auto-fixes applied (import sorting, unused imports, redundant open modes). 3 manual fixes (f-string refactor in analyze_sources.py × 2, unused variable in test-merge-help-csv.py). All 116 tests pass post-fix. |
| 2026-04-17 | **T8 shipped.** PEP 723 standardized across all 24 Python files. Fixes: `"pyyaml"` → `"pyyaml>=6.0"` (4 files), `# ///` syntax → standard `# ` content lines (2 distillator files), `>=3.10` → `>=3.9` (2 bmad-init files), added missing metadata blocks (2 test files). 22→24 files now have consistent PEP 723 blocks. |
| 2026-04-17 | **T6 shipped.** Python test execution added to CI (`python-test` job in ci.yml). 5 test files, ~116 tests across BMB (merge-config, merge-help-csv, cleanup-legacy) and Core (bmad_init, analyze_sources). Publish gate updated to require `python-test`. Resolves Gyre DL-001 blocker. CI green. |
| 2026-04-17 | **Rescore I33** (Workflow-name namespace collision risk): 0.4 → 0.9. R:4→4, I:0.5→1, C:60%→70%, E:3→3. Rationale: I32 shipped active orphan deletion (two-strategy matching) which increased collision blast radius from overwrite-only to overwrite + cleanup deletes. Moved from rank ~78 to 0.9 block (after I52, before I39). Fast Lane re-sorted within 0.9 tiebreak (C:90% before C:70%). |
| 2026-04-15 | **Dependencies column added** to all three lane tables (§2.2 Bug, §2.3 Fast, §2.4 Initiative). Notation rules added to backlog-format-spec.md: comma-separated IDs, cross-lane allowed, `—` for none, `✓ID` for shipped deps, `bundles-with: ID` for paired items, `external: short-desc` for non-backlog blockers. Bulk-added `—` to all existing rows; populated meaningful dependencies on ~13 items (Initiative: P9, P13, v6.3, ILE-1, P3, P2; Fast: T7, T8, I43, I44, I45, I46, I47, I48, I15, I39, I33). Format spec column counts updated: Bug 11, Fast 10, Initiative 11. |
| 2026-04-15 | **Qualifying gate run on IN-9.** Qualifier: John+Winston (per §1.2 shortcut rule). Lane: Initiative. Portfolio: helm (current-best-fit, revisitable). RICE: R:9 I:3 C:60% E:8 = 2.0. New row added to §2.4 Initiative Lane as **ILE-1** (Initiative Lifecycle Engine). Intake row IN-9 in §2.1 cross-referenced via `→ ILE-1` per §1.1 audit-trail rule. Appendix entry added with three-workstream scope hint and precedent notes (WS1+WS2 already executed as spikes; skill rework v2.0.0 partially shipped). Initiative Lane re-sorted: ILE-1 (2.0) sits between v6.3 Adoption (2.3) and U9 (1.9). |
| 2026-04-12 | **Pass 1 + Pass 2 complete.** Document created from `convoke-note-initiatives-backlog.md` retroactive review. All 88 items classified across three lanes per lifecycle process established in party mode session (John, Winston, Amalik). Supersedes `convoke-note-initiatives-backlog.md`. Intakes: 9 (was 8 "exploration candidates" + 1 new meta-initiative IN-9). Bug Lane: 0. Fast Lane: 65. Initiative Lane: 11 (4 absorbed into v6.3, 7 standalone). Absorbed/Archived: 27 (4 absorbed into v6.3 Epic, 2 absorbed into S3, 21 completed). S1/S2 folded into S3. Original IDs preserved for traceability. |
