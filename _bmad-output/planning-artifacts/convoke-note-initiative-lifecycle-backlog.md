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
| IN-10 | Refactor `DEFAULT_ARTIFACT_TYPES` to single source of truth — eliminate drift across `scripts/migrate-artifacts.js:135`, `scripts/update/lib/taxonomy-merger.js:11`, and `taxonomy.yaml` → I54 | Code review oc-1-2 Round 1 (Blind Hunter) | 2026-04-18 | Winston |
| IN-11 | Derive ADR type list from taxonomy in `generateGovernanceADR` — `scripts/lib/artifact-utils.js:2033` hardcodes "Artifact types (21)" while taxonomy has 23 → BUG-1 | Code review oc-1-2 Round 1 (Edge Case Hunter) | 2026-04-18 | Winston |
| IN-12 | Vortex audit expansion — oc-1-1 sampled only lean-persona (least-violating Vortex workflow); spot-check shows assumption-mapping has ~10 novel concepts in step-01. Audit 3-4 more Vortex workflows to compute Vortex-specific Right-to-pacing rate → A8 | Code review oc-1-1 Round 3 (Edge Case Hunter) | 2026-04-18 | Winston |
| IN-13 | Decision-support archetype undersampled — oc-1-1 had only 1 decision-support skill (enhance-backlog) which also carried COI disclosure. Add 1 more decision-support skill to v2 Covenant audit baseline → A9 | Code review oc-1-1 Round 3 (Acceptance Auditor) | 2026-04-18 | Winston |
| IN-14 | Reproducibility gate ≥3 cells for future Covenant audits — oc-1-1 AC #1 literal reading says "cells" (plural); v1 gate measured 1 cell via D2a pragmatic reading. Future audits should cover ≥3 cells (expected-PASS + expected-FAIL + borderline) per §2.5 → A10 | Code review oc-1-1 Round 3 (Acceptance Auditor) | 2026-04-18 | Winston |
| IN-15 | Migration scar re-interpretation evidence grounding — oc-1-1 §4.2 asserted Right-to-next-action scar shape using current CLI evidence, not historical scar-era quotes. Locate scar-era retro/logs or soften the re-interpretation with evidence-limitation note → A11 | Code review oc-1-1 Round 3 (Edge Case Hunter) | 2026-04-18 | Winston |
| IN-16 | `compareVersions` silently coerces pre-release versions to base — `scripts/update/lib/utils.js:27-39` does `Number('4-alpha') → NaN → 0`, so `compareVersions('1.0.4-alpha', '1.0.4') === 0`. Shared utility used by changelog-reader filter and migration-path decisions → U11 | Code review BUG-1+U7 Round 1 (Edge Case Hunter) | 2026-04-18 | Winston |
| IN-17 | Empty `taxonomy.initiatives.platform` / `artifact_types` not validated — `readTaxonomy` (`scripts/lib/artifact-utils.js:148-160`) accepts empty arrays; operator commenting out all entries produces degenerate ADR text like "**Platform initiatives (0):** " → I55 | Code review BUG-1+U7 Round 1 (Edge Case Hunter) | 2026-04-18 | Winston |
| IN-18 | `taxonomy.initiatives.user` silently dropped from generated ADR — `scripts/lib/artifact-utils.js:2031` renders only `platform`; user-scope initiatives invisible in governance artifact → I56 | Code review BUG-1+U7 Round 1 (Blind Hunter) | 2026-04-18 | Winston |
| IN-19 | **OC-R7 doc-mapping double-counts in Paige's 4-part format** — Compliance Checklist says "each part counts per the glossary" but every section has 4 parts × ≥1 concept = budget always exceeded. **Story 1.4 pre-requisite: MUST resolve before Covenant self-compliance gate.** → A12 | Code review oc-1-3 Round 3 (Edge Case Hunter) | 2026-04-18 | Winston |
| IN-20 | OC-R7 concept-counting ambiguity persists even with inline §2.6 glossary — compound concepts (4-level importance taxonomy = 1 or 4?) produce reviewer disagreement. Overlaps audit §9.3. → A13 | Code review oc-1-3 Round 3 (Edge Case Hunter) | 2026-04-18 | Winston |
| IN-21 | Conditional-surface skills (e.g., Gyre single- vs multi-service) don't fit 2-variant N/A taxonomy; needs `N/A — conditional (<branch>)` variant or per-branch verdicts. → A14 | Code review oc-1-3 Round 3 (Edge Case Hunter) | 2026-04-18 | Winston |
| IN-22 | Layer 3 uncontrollable stderr — skills wrapping external CLIs (git, npm) whose errors lack next-action clauses lock OC-R6 to permanent FAIL. Need external-declaration escape hatch in worst-case rule. → A15 | Code review oc-1-3 Round 3 (Edge Case Hunter) | 2026-04-18 | Winston |
| IN-23 | Workflow-inherited concepts rule uni-directional — no rule for out-of-order review or concepts used-before-defined. Checklist audit-discipline ambiguity. → A16 | Code review oc-1-3 Round 3 (Blind Hunter) | 2026-04-18 | Winston |
| IN-24 | Cross-module exclusion-ID validation for `excluded_agents` — `mergeConfig`, `refresh-installation`, and `convoke-doctor` silently no-op on typos (`noha` for `noah`) or wrong-module IDs (Vortex ID in Gyre config). Add a cross-registry warn when an ID isn't recognized. → I57 | Code review U8 Round 1 (Blind Hunter) | 2026-04-18 | Winston |
| IN-25 | `excluded_agents: []` default appears in pre-U8 upgraded configs without the explanatory comment — `merged.excluded_agents = excludedAgents` emits the field but the comment lives only in the shipped source YAML. Inject it via `writeConfig` comment-preservation path. → U12 | Code review U8 Round 1 (Edge Case Hunter) | 2026-04-18 | Winston |
| IN-26 | YAML parser asymmetry between `readExcludedAgents` (js-yaml) and `mergeConfig` (yaml package) — rare anchor/merge-key divergence could cause `refresh-installation` to copy an excluded agent while `mergeConfig` filters it out. Unify on the `yaml` package. → I58 | Code review U8 Round 1 (Edge Case Hunter) | 2026-04-18 | Winston |
| IN-27 | Duplicate entries in `excluded_agents` not deduped — `['noah', 'noah']` persists both entries through merge, inconsistent with `Set`-based dedup on `agents`. → I59 | Code review U8 Round 1 (Blind Hunter) | 2026-04-18 | Winston |
| IN-28 | `EXTRA_BME_AGENTS` (team-factory + other standalone bme agents) have no exclusion mechanism — `refresh-installation` only reads Vortex + Gyre configs for exclusion snapshots; standalone bme agents have no opt-out path. → U13 | Code review U8 Round 1 (Edge Case Hunter) | 2026-04-18 | Winston |
| IN-29 | Dev-mode (`isSameRoot`) skill wrapper generation loops (§6, §6b) don't honor `excluded_agents` — agent-file copy is skipped but skill wrappers are still generated when `packageRoot === projectRoot`. → U14 | Code review U8 Round 1 (Blind Hunter) | 2026-04-18 | Winston |
| IN-30 | bme/README submodule table omits `_bmad/bme/config.yaml` — sibling config file not listed in Submodules table; contributor orienting via the README won't learn it exists. Out of scope for oc-1-5 (Covenant surfacing). → D8 | Code review oc-1-5 Round 1 (Edge Case Hunter) | 2026-04-19 | Winston |
| IN-31 | `docs/` directory has 6 contributor files with no Covenant pointer — no `docs/README.md` or `docs/index.md` exists; contributor landing via GitHub tree sees 6 docs with no Covenant orientation. Create `docs/README.md` as docs index with Covenant callout to legitimize AC #3's 4-of-4 coverage. → D9 | Code review oc-1-5 Round 1 (Edge Case Hunter) | 2026-04-19 | Winston |
| IN-32 | Canonical Covenant location under `_bmad-output/planning-artifacts/` — path smell conflating workflow output with canonical spec. Covenant + Checklist are durable required-reading but live in the output tree, which is conventionally ephemeral. Consider moving to `docs/covenant/` or new convention with `_bmad-output/` retaining pointer. Cross-reference impact: ~8 existing references. → P24 | Code review oc-1-5 Round 1 (Blind Hunter) | 2026-04-19 | Winston |
| IN-33 | A10 3-cell minimum doesn't scale — 2-skill audit has 14 cells (21% sample); 8-skill audit has 56 cells (5%). Fixed floor regardless of audit size. Add percentage floor or "≥3 OR ≥10% of matrix" scaling. → A17 | Code review A15+A5+A10 Round 1 (Edge Case Hunter) | 2026-04-19 | Winston |
| IN-34 | A15 OC-R0 format extension — `(internal)/(external)` qualifier added to OC-R0 row but not propagated to §§3.x/§§8.x evidence-note examples. Templates should carry the format for audit-template copy. → A18 | Code review A15+A5+A10 Round 1 (Edge Case Hunter) | 2026-04-19 | Winston |
| IN-35 | A5 `mechanical-research-enumeration` has no operational test — is a retrospective covered? A portfolio status report? A PRD personas section? Rule needs a definition or example list. → A19 | Code review A15+A5+A10 Round 1 (Edge Case Hunter) | 2026-04-19 | Winston |
| IN-36 | A5 retroactive gap — v1 audit §6 sample selection was not mechanical per the new rule; rule is prospective by design but framing not documented. → A20 | Code review A15+A5+A10 Round 1 (Edge Case Hunter) | 2026-04-19 | Winston |
| IN-37 | A15+A10 interaction — N/A-variant disagreement (`external-declared` vs `out-of-scope` vs `FAIL`) slips through verdict-agreement threshold. Threshold treats all non-PASS/FAIL agreement as equivalent. → A21 | Code review A15+A5+A10 Round 1 (Blind Hunter) | 2026-04-19 | Winston |
| IN-38 | A5 story templates not updated — `bmad-create-story` + sprint-planning templates should require a search-command field for research/catalog/audit/inventory stories. → I60 | Code review A15+A5+A10 Round 1 (Edge Case Hunter) | 2026-04-19 | Winston |
| IN-39 | Parser grammar § doesn't formalize the `Layers:` evidence-note prefix — enforcement aspirational until Story 2.2 Loom parser exists. Lightweight spec extension lets Loom author have a target. → I61 | Code review A15+A5+A10 Round 2 (Blind Hunter) | 2026-04-19 | Winston |
| IN-40 | Revisions table cell growing — 430+ words per patch cycle. Split to per-patch rows or extract round detail to a `revisions/` folder with pointer. → D10 | Code review A15+A5+A10 Round 2 (Blind Hunter) | 2026-04-19 | Winston |
| IN-41 | `(external)/(internal)` OC-R0 tokens substring-collide with `external-declared` OC-R6 value — grep tooling scanning evidence notes for `external` matches both contexts. Rename (e.g., `owned/unowned`) or document collision in Parser grammar §. → A22 | Code review A15+A5+A10 Round 2 (Blind Hunter) | 2026-04-19 | Winston |
| IN-42 | Misprediction + DISPUTED interaction edge case unspecified in A10 — if auditor predicted PASS, reviewers unanimously FAIL (mispredicted but reproducible), then cell is DISPUTED via path (b) in a re-run, the interaction between calibration-logging and DISPUTED exclusion isn't defined. → A23 | Code review A15+A5+A10 Round 2 (Blind Hunter) | 2026-04-19 | Winston |

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
| _none_ | | | | | | | | | | |

**Note:** Bug Lane is currently empty. BUG-1 (first-ever active entry, logged 2026-04-18) shipped same day — see §2.5. Latent risks (YAML parsing, atomic writes, etc.) sit in Fast Lane as preventive hardening, not observed bugs.

### 2.3 Fast Lane (Quick Wins + Spikes)

Items qualified as not needing the full initiative pipeline. Sorted by RICE score.

| ID | Description | R | I | C | E | Score | Portfolio | Status | Dependencies |
|----|-------------|---|---|---|---|-------|-----------|--------|--------------|
| T3 | End-to-end update test on real project | 5 | 2 | 80% | 3 | 2.7 | convoke | Backlog | — |
| I50 | `--quiet` flag for `convoke-export` batch mode (or drop) | 6 | 0.5 | 90% | 1 | 2.7 | enhance | Backlog | — |
| T4 | Migration idempotency CLI test | 3 | 1 | 80% | 1 | 2.4 | convoke | Backlog | — |
| I2 | `gh auth` for CI release creation | 6 | 1 | 80% | 2 | 2.4 | convoke | Backlog | — |
| A8 | Vortex audit expansion — audit 3-4 more Vortex workflows (empathy-map, assumption-mapping, hypothesis-engineering, lean-experiment) for Vortex-specific Right-to-pacing rate; oc-1-1 sampled only lean-persona (least-violating) | 6 | 1 | 80% | 2 | 2.4 | vortex | Backlog | deferred-from: oc-1-1 Round 3 |
| I20 | Portfolio markdown formatter — render `--show-unattributed` | 5 | 0.5 | 90% | 1 | 2.3 | enhance | Backlog | — |
| D2 | Add output examples for more agents (Isla, Wade, Noah) | 6 | 1 | 70% | 2 | 2.1 | convoke | Backlog | — |
| I16 | Skill description generator — semantic descriptions for bme skills | 5 | 0.5 | 80% | 1 | 2.0 | convoke | Backlog | — |
| I22 | Resolution-map key normalization (migration skill) | 5 | 1 | 80% | 2 | 2.0 | enhance | Backlog | — |
| I25 | Resolution-map missing-from-manifest validation | 5 | 0.5 | 80% | 1 | 2.0 | enhance | Backlog | — |
| P22 | SP Epic 6 — skill portability UX slash command wrappers (4 stories) | 7 | 1 | 70% | 4 | 1.2 | enhance | Backlog | — |
| I60 | A5 story templates — add required `search-command` field to `bmad-create-story` + sprint-planning templates for research/catalog/audit/inventory stories | 4 | 0.5 | 90% | 1 | 1.8 | convoke | Backlog | deferred-from: A15+A5+A10 R1 · depends: A19 |
| I1 | NPM_TOKEN secret for CI publish | 8 | 2 | 90% | 8 | 1.8 | convoke | Backlog | — |
| I7 | Team Factory CSV quoting hardening | 4 | 0.5 | 90% | 1 | 1.8 | loom | Backlog | — |
| I23 | Format contract test between CLI and migration skill | 4 | 0.5 | 90% | 1 | 1.8 | enhance | Backlog | — |
| A6 | Structured-source for count-sensitive deliverables | 5 | 1 | 70% | 2 | 1.8 | convoke | Backlog | — |
| A19 | A5 `mechanical-research-enumeration` operational test — add definition or example list for "research/catalog/audit/inventory" scope (retrospectives? portfolio status? PRD personas?) | 4 | 0.5 | 80% | 1 | 1.6 | convoke | Backlog | deferred-from: A15+A5+A10 R1 |
| D6 | Reduce narrative overlap in journey example | 4 | 0.5 | 80% | 1 | 1.6 | convoke | Backlog | — |
| I18 | Pre-compile regex in `_scanCorpusForInitiative` per migration run | 4 | 0.5 | 80% | 1 | 1.6 | enhance | Backlog | — |
| I36 | `yaml` package `doc.warnings` ignored at 5 write sites | 4 | 0.5 | 80% | 1 | 1.6 | convoke | Backlog | — |
| A9 | Decision-support archetype addition for v2 Covenant audit — add creative-problem-solver or innovation-strategy to break enhance-backlog single-sample-with-COI dependency | 4 | 0.5 | 80% | 1 | 1.6 | convoke | Backlog | deferred-from: oc-1-1 Round 3 |
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
| I54 | Refactor `DEFAULT_ARTIFACT_TYPES` to single source of truth (migrate-artifacts.js + taxonomy-merger.js + taxonomy.yaml) | 4 | 0.5 | 90% | 2 | 0.9 | convoke | Backlog | — |
| U11 | `compareVersions` semver-aware pre-release handling — fix `Number('4-alpha')→0` coercion in `scripts/update/lib/utils.js:27-39`; proper tuple compare + pre-release identifier ordering per semver spec | 2 | 0.5 | 90% | 1 | 0.9 | convoke | Backlog | deferred-from: BUG-1+U7 Round 1 |
| A11 | Migration scar re-interpretation evidence grounding — locate scar-era retro/logs to anchor Right-to-next-action classification, or soften re-interpretation with evidence-limitation note | 3 | 0.5 | 60% | 1 | 0.9 | convoke | Backlog | deferred-from: oc-1-1 Round 3 |
| A13 | OC-R7 concept-counting rules for compound concepts (taxonomies, tiers, mental models) — add counting conventions to the novel-concept glossary to resolve reviewer disagreement | 5 | 1 | 70% | 3 | 1.17 | convoke | Backlog | deferred-from: oc-1-3 Round 3 |
| A14 | N/A taxonomy extension — add `N/A — conditional (<branch>)` variant (or per-branch verdicts) for skills with conditional operator surfaces | 3 | 0.5 | 80% | 1 | 1.2 | convoke | Backlog | deferred-from: oc-1-3 Round 3 |
| A16 | Workflow-inherited concepts rule — add bidirectional/out-of-order review guidance to the Checklist glossary | 2 | 0.5 | 90% | 0.5 | 1.8 | convoke | Backlog | deferred-from: oc-1-3 Round 3 |
| I33 | Workflow-name namespace collision risk (verbatim names) | 4 | 1 | 70% | 3 | 0.9 | enhance | Backlog | ✓I32 (I32 made orphan deletion active — blast radius increased) |
| I39 | Non-atomic version stamp writes in `refresh-installation.js` | 4 | 1 | 70% | 3 | 0.9 | convoke | Backlog | bundles-with: I46 |
| A18 | A15 OC-R0 format — propagate `(internal)/(external)` qualifier examples into §§3.x and §§8.x evidence-note templates in Compliance Checklist + audit report | 2 | 0.5 | 90% | 1 | 0.9 | convoke | Backlog | deferred-from: A15+A5+A10 R1 |
| A1 | Add validate menu items to Wave 3 Vortex agents (Mila, Liam, Noah) | 4 | 0.5 | 80% | 2 | 0.8 | vortex | Backlog | — |
| A3 | Add `agentic` + `team-of-teams` npm keywords | 3 | 0.25 | 100% | 1 | 0.8 | convoke | Backlog | — |
| I6 | `--verbose` flag across all CLI commands | 4 | 0.5 | 80% | 2 | 0.8 | convoke | Backlog | — |
| T1 | `convoke-update.js` coverage to 80%+ | 3 | 1 | 80% | 3 | 0.8 | convoke | Backlog | — |
| U2 | Validate migration modules at load time | 2 | 0.5 | 80% | 1 | 0.8 | convoke | Backlog | — |
| I17 | `suggestDifferentiator` — support extensions beyond `.md`/`.yaml` | 4 | 0.25 | 80% | 1 | 0.8 | enhance | Backlog | — |
| I19 | Share `_scanCorpus` between portfolio engine and migration suggester | 4 | 0.25 | 80% | 1 | 0.8 | enhance | Backlog | — |
| I41 | `convoke-doctor` `console.warn` breaks structured-output contract | 4 | 0.25 | 80% | 1 | 0.8 | convoke | Backlog | — |
| I56 | Render `taxonomy.initiatives.user` in generated ADR — add a "User initiatives" line to `generateGovernanceADR` so operator-added initiatives appear in the governance artifact | 2 | 0.5 | 80% | 1 | 0.8 | convoke | Backlog | deferred-from: BUG-1+U7 Round 1 |
| I35 | Naive `split('\n')` CSV parsing — CRLF + quoted-newline edges | 4 | 0.5 | 70% | 2 | 0.7 | convoke | Backlog | — |
| I40 | `loadSkillManifest` Map silently overwrites duplicate paths | 3 | 0.25 | 90% | 1 | 0.7 | convoke | Backlog | — |
| I44 | No `validateGyreModule` function in validator.js | 2 | 1.5 | 70% | 3 | 0.7 | gyre | Backlog | ✓I34 |
| A17 | A10 3-cell gate scaling — add percentage floor or `≥3 OR ≥10% of matrix` rule so large audits aren't under-sampled | 2 | 1 | 70% | 2 | 0.7 | convoke | Backlog | deferred-from: A15+A5+A10 R1 |
| A21 | A15+A10 N/A-variant disagreement threshold — treat `external-declared` vs `out-of-scope` vs `FAIL` disagreement as reviewer-agreement failure, not just PASS/FAIL match | 2 | 1 | 70% | 2 | 0.7 | convoke | Backlog | deferred-from: A15+A5+A10 R1 |
| I8 | Team Factory write verification — value correctness | 3 | 0.5 | 80% | 2 | 0.6 | loom | Backlog | — |
| I57 | Cross-module exclusion-ID validation for `excluded_agents` — `readExcludedAgents` + doctor warn when an ID doesn't match any known agent in any module's registry | 2 | 0.5 | 90% | 2 | 0.5 | convoke | Backlog | deferred-from: U8 Round 1 |
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
| I61 | Parser grammar § — formalize `Layers:` evidence-note prefix alongside Compliance Status cell grammar; gives Story 2.2 Loom parser a target | 1 | 0.5 | 70% | 1 | 0.35 | convoke | Backlog | deferred-from: A15+A5+A10 R2 |
| I58 | Unify YAML parser in `readExcludedAgents` to use the `yaml` package (match `mergeConfig`) — closes js-yaml / `yaml` library split that could cause filesystem/config state drift | 1 | 1 | 60% | 2 | 0.3 | convoke | Backlog | deferred-from: U8 Round 1 |
| T5 | Expand docs audit — tense consistency + prose patterns | 2 | 0.5 | 60% | 2 | 0.3 | convoke | Backlog | — |
| I38 | `mergeConfig` Document mutation not idempotent across writes | 2 | 0.5 | 80% | 3 | 0.3 | convoke | Backlog | — |
| I48 | Agent-manifest.csv doctor check + CSV-parse validator upgrade | 2 | 0.5 | 60% | 2 | 0.3 | convoke | Backlog | ✓I34, bundles-with: I15 |
| A4 | Fix temp dir prefix inconsistency (`bmad-` vs `convoke-`) | 1 | 0.25 | 100% | 1 | 0.3 | convoke | Backlog | — |
| U14 | Honor `excluded_agents` in dev-mode (`isSameRoot`) skill wrapper generation loops — align with agent-file copy skip behavior | 1 | 0.25 | 100% | 1 | 0.25 | convoke | Backlog | deferred-from: U8 Round 1 |
| I59 | Dedup duplicate entries in `excluded_agents` using Set — consistent with `Set`-based dedup on `agents` | 1 | 0.25 | 100% | 1 | 0.25 | convoke | Backlog | deferred-from: U8 Round 1 |
| A20 | A5 retroactive-gap framing — add explicit "rule is prospective" statement to A5, OR add §6 note to v1 audit acknowledging sample-selection predates the rule | 1 | 0.25 | 90% | 1 | 0.2 | convoke | Backlog | deferred-from: A15+A5+A10 R1 |
| U13 | Extend `excluded_agents` support to `EXTRA_BME_AGENTS` (team-factory + other standalone bme agents) — add per-submodule exclusion plumbing in `refresh-installation` + doctor | 2 | 0.5 | 70% | 3 | 0.2 | convoke | Backlog | deferred-from: U8 Round 1 |
| A2 | Create `.agent.yaml` source files for Vortex agents | 2 | 0.5 | 60% | 4 | 0.2 | vortex | Backlog | — |
| I42 | `MERGED_DOC_SENTINEL` doesn't survive spread or JSON-serialize | 2 | 0.25 | 70% | 2 | 0.2 | convoke | Backlog | — |
| I53 | Carry-forward: CRLF writeManifest + basename collision | 2 | 0.25 | 40% | 1 | 0.2 | enhance | Backlog | — |
| I55 | Validate `taxonomy.initiatives.platform` + `artifact_types` non-empty in `readTaxonomy` — reject/warn on all-commented config before rendering degenerate ADR text | 1 | 0.25 | 90% | 1 | 0.2 | convoke | Backlog | deferred-from: BUG-1+U7 Round 1 |
| A23 | A10 misprediction + DISPUTED interaction — add one sentence to A10 covering auditor-predicted PASS → reviewers unanimously FAIL → DISPUTED-via-path-(b) re-run edge | 1 | 0.25 | 60% | 1 | 0.15 | convoke | Backlog | deferred-from: A15+A5+A10 R2 |
| I45 | Workflow-manifest CSV registration drift not validated | 1 | 0.5 | 60% | 2 | 0.15 | convoke | Backlog | ✓I34, bundles-with: I15 |
| D10 | Revisions table hygiene — split multi-patch rows to per-patch rows, or extract round-detail to a `revisions/` folder with pointer from the table | 1 | 0.25 | 100% | 2 | 0.1 | convoke | Backlog | deferred-from: A15+A5+A10 R2 |
| A22 | `(external)/(internal)` OC-R0 tokens vs `external-declared` OC-R6 value — rename to `(owned)/(unowned)` OR document the collision in Parser grammar § | 1 | 0.25 | 80% | 2 | 0.1 | convoke | Backlog | deferred-from: A15+A5+A10 R2 |
| U12 | Inject `excluded_agents` inline comment on pre-U8 config upgrade via `writeConfig` — operators upgrading see the field appear without context | 2 | 0.25 | 70% | 3 | 0.1 | convoke | Backlog | deferred-from: U8 Round 1 |

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
| ILE-1 | **Initiative Lifecycle Engine** (Portfolio-as-Code — rework of backlog/portfolio/governance skills into integrated lifecycle management) | 9 | 3 | 60% | 8 | 2.0 | helm | **In Pipeline** | B, P, IR(pre-arch) | ✓P15, ✓P10, ✓I49, ✓bmad-enhance-initiatives-backlog-v2.0.0 |
| U9 | **Module-aware refresh and validation (modules-manifest.yaml)** | 8 | 2 | 70% | 6 | 1.9 | convoke | **Qualified** | — | — |
| P24 | **Relocate Covenant + Checklist out of `_bmad-output/planning-artifacts/`** — path smell conflating workflow output with canonical spec; propose `docs/covenant/` with pointer retained in old location; touches ~8 references | 4 | 1 | 70% | 2 | 1.4 | convoke | **Qualified** | — | deferred-from: oc-1-5 Round 1 |
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
| A12 | Covenant OC-R7 doc-mapping double-count fix — clarifies that doc rule uses cumulative vocabulary (concepts introduced in earlier Covenant sections are pre-existing for later sections) and that example/anti-pattern illustrations don't count as novel if they illustrate an already-introduced concept. Code review Round 1 applied 3 follow-up patches (softened shipping claim, added Covenant preamble authoring contract, closed illustration loophole). Narrows OC-R7 failure surface; Section 1 passability depends on preamble contract. | 2026-04-18 | 6.3 | convoke |
| D8 | `_bmad/bme/README.md` now lists `config.yaml` under a new `## Files at _bmad/bme/ root` section — sits between Submodules (directories) and "When to add here vs upstream". Contributor orientation no longer misses the config file. Semantic separation preserved (Submodules stays directories-only). | 2026-04-19 | 7.5 | convoke |
| D9 | `docs/README.md` created as docs index with Covenant pointer as the featured callout — AC #3's 4th discovery path now real. Contents table enumerates the 6 existing contributor-facing docs; cross-refs to repo README, bme README, and `project-context.md`. oc-1-5 Dev Notes `[Review][Defer]` line retired → `[Defer→Resolved]`. 1 round of code review applied 5 patches (broaden Covenant trigger, dogfood `derive-counts-from-source` on hardcoded counts, trim `development.md` description accuracy, close oc-1-5 paper trail, remove invented "supporting BME specialists" category). Convergence at Round 1 (0 HIGH). | 2026-04-19 | 9.0 | convoke |
| A10 | Reproducibility gate for multi-skill Covenant audits — new §Reproducibility gate in Compliance Checklist spec. v2+ audits cover ≥3 cells (expected-PASS + expected-FAIL + borderline with hardness test), explicit 5-step audit sequence, threshold 100% at N=3-4 / ≥80% at N≥5, four-path failure-mode (revise / DISPUTED-exclude with N-recomputation / methodology-invalid / shrink-scope), three-way disagreement handling, gate-size-fixed-at-selection guard against N-inflation. 2 rounds of code review applied 9 patches (incl. 3 HIGH in Round 2: §10.5 factual correction, sequencing circularity resolved, DISPUTED-exclusion N recomputation). v1 audit §2.5, §10.2, §10.5 amended. 6 items deferred. | 2026-04-18 | 2.7 | convoke |
| A5 | Research stories must use mechanical search protocol — new `project-context.md` rule `mechanical-research-enumeration`. Catalog/audit/inventory deliverables must enumerate via grep/glob, raw output as evidence. Origin: AG Epic 7 retro A1, Story 7.3 recurrence. | 2026-04-18 | 2.8 | convoke |
| A15 | OC-R6 external-declared escape hatch — sixth Compliance Status value `N/A — external-declared (<tool>)` for skills wrapping git/npm/docker/etc. whose stderr they can't rewrite. Worst-case aggregation carve-out. OC-R0 row now requires `(internal)/(external)` qualifier per L3 entry. Required evidence-note template `Layers: L1 PASS (<ref>), L2 PASS (<ref>), L3 external-declared (<tool>)` with concrete evidence refs. Two-step parser validation (regex + rule-ID scope), anti-regex-folding justification, tiebreaker vs `out-of-scope`. 2 rounds of code review applied 7 patches. 4 items deferred. | 2026-04-18 | 3.2 | convoke |
| U8 | Respect user agent exclusions on update — new `excluded_agents: []` field in Vortex + Gyre `config.yaml` with `readExcludedAgents()` helper. `mergeConfig` filters excluded from `merged.agents`; `refresh-installation` skips agent-file copy, user-guide copy, skill-wrapper generation, and manifest rows for excluded agents. `validator` + `convoke-doctor` honor exclusions. 2 rounds of code review applied 9 patches (HIGH: manifest drift; MEDIUM: falsy-updates filter bypass, user-guide skip, IO error discrimination). 14 new tests; 6 items deferred. | 2026-04-18 | 3.2 | convoke |
| U7 | Changelog surface during `convoke-update` — new `changelog-reader.js` parses Keep-a-Changelog headers (incl. pre-release), pre-prompt "What's New" block in refresh-only + upgrade paths. Code review Round 1 applied 4 patches (taxonomy guard, broadened HEADER_RE + semver post-filter, fenced-code tracking, integration tests). 15 tests added; 6 items deferred. | 2026-04-18 | 4.3 | convoke |
| BUG-1 | `generateGovernanceADR` now derives platform + artifact-type counts and lists from taxonomy (was hardcoded "(21)" / "(8)"). Fix + 1 new test asserting custom taxonomy reflected. | 2026-04-18 | 2.7 | convoke |
| I49 | Process uniformity — 4 rules added to project-context.md: derive-counts-from-source, shared-test-constants, catch-all-phase-review, spec-verify-referenced-files. | 2026-04-18 | 4.3 | convoke |
| P10 | Capability Evaluation Framework operationalized — moved from archive to planning-artifacts, referenced from lifecycle §1.2 + project-context.md rule. | 2026-04-18 | 5.6 | helm |
| P11 | Friction log template operationalized — moved from archive to planning-artifacts, linked as CEF input feed. | 2026-04-18 | 5.6 | helm |
| A7 | Review convergence rule — R1 mandatory, R2 if HIGH, R3 if structural, no R4. Encoded in project-context.md + step-04-present.md (both source and installed). | 2026-04-18 | 6.4 | convoke |
| T6 | Python test execution in CI — `python-test` job, 5 files, 116+ tests, publish gate updated. Resolves Gyre DL-001 blocker. | 2026-04-17 | 14.4 | convoke |
| I43 | Doctor validates all 12 bme agent skill wrappers — `checkAgentSkillWrappers()`. Closes F6+F20+F21 GAPs. | 2026-04-17 | 6.4 | convoke |
| T7 | Python linting in CI — ruff added to `python-test` job. `ruff.toml` config, 40 auto-fixes, 3 manual fixes. | 2026-04-17 | 2.4 | convoke |
| T8 | PEP 723 standardized — `pyyaml>=6.0` pinning, syntax fix, `>=3.9` version, 2 missing blocks added. 24/24 files covered. | 2026-04-17 | 1.6 | convoke |
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
| 2026-04-19 | **D8 shipped.** `_bmad/bme/README.md` now has a `## Files at _bmad/bme/ root` section listing `config.yaml` with a one-line description (operator name, languages, output folder; preserved across updates). Placed between the Submodules table (directories-only) and the "When to add here vs upstream" guidance — semantic separation preserved. Closes oc-1-5 `[Review][Defer]` follow-up #1 (bme/README config.yaml omission). D8 moved Fast Lane → §2.5 Completed. |
| 2026-04-19 | **D9 code review — 1 round, convergence reached.** 5 patches applied (0 HIGH, all MEDIUM/LOW): Covenant callout trigger broadened from authoring-only to "authoring, reviewing, or extending" with explicit planner/reviewer acknowledgment; hardcoded counts removed (dogfoods A5 `mechanical-research-enumeration` + `derive-counts-from-source` rules shipped earlier today) — "Vortex (7 streams) / Gyre (4 agents) / seven Operator Rights" → role-based phrasing; `development.md` description trimmed for accuracy (doesn't cover skill patterns per Edge Case verification); oc-1-5 `[Review][Defer]` line for this exact gap marked `[Defer→Resolved]` with D9 closure reference; invented "supporting BME specialists" category removed from `agents.md` description. 0 deferred. |
| 2026-04-19 | **D9 shipped.** New `docs/README.md` created as the docs index. Covenant pointer featured as the first callout block (mirrors the `README.md` + `_bmad/bme/README.md` convention); Contents table enumerates the 6 existing contributor-facing docs with one-line descriptions; cross-refs the three sibling discovery paths. **AC #3 of oc-1-5 now achieves 4/4 discovery-path coverage** (previously 3/4 with substitution documented). D9 moved Fast Lane → §2.5 Completed. |
| 2026-04-19 | **Triage by Winston: Logged 10 intakes (IN-33 through IN-42) from code reviews of A15+A5+A10 Rounds 1 and 2.** Qualified 10 to Fast Lane: I60 (A5 story template search-command field, score 1.8), A19 (A5 operational test, 1.6), A18 (A15 OC-R0 evidence-note examples, 0.9), A17 (A10 3-cell gate scaling, 0.7), A21 (N/A-variant disagreement threshold, 0.7), I61 (parser grammar Layers: prefix, 0.35), A20 (A5 retroactive-gap framing, 0.2), A23 (misprediction+DISPUTED edge, 0.15), D10 (Revisions table hygiene, 0.1), A22 (external-declared token namespace collision, 0.1). I60 depends on A19. Raw intakes: 0. Dropped: 0. Note: oc-1-5-adoption-surface deferrals (3 items) were already triaged by a prior session as IN-30/31/32 → D8, D9, P24 — not re-logged. BUG-1+U7 "too speculative" deferrals (__dirname, verbose-gating) remain in `deferred-work.md` only. |
| 2026-04-19 | **Triage by Winston: Logged 3 intakes (IN-30, IN-31, IN-32) from code review of oc-1-5-adoption-surface Round 1.** Qualified 3 total — Fast Lane: D9 (create `docs/README.md` as docs index, score 9.0), D8 (add `config.yaml` to bme/README, 7.5). Initiative Lane: P24 (relocate Covenant + Checklist out of `_bmad-output/planning-artifacts/`, 1.4). Raw intakes: 0. Dropped: 0. All deferred-from oc-1-5 Round 1. Closes Epic 1 (Convoke Operator Covenant) triage. |
| 2026-04-18 | **A15 + A5 + A10 code review — 2 rounds complete.** Round 1 surfaced 5 HIGH + 9 MEDIUM + 2 LOW; 9 patches applied (A15 evidence-note template + parser two-step validation + disambiguation; A10 threshold rework / four-path failure-mode / borderline hardness / headline-findings definition / misprediction exclusion; audit report §10.5 + §10.2 forward-refs). Round 2 surfaced 3 HIGH + 7 MEDIUM + 3 LOW; 13 patches applied (§10.5 factual correction — Migration + Portfolio DO wrap git; OC-R0 qualifier at point-of-entry; path (d) shrink-scope; explicit 5-step audit sequence; DISPUTED-exclusion N-recomputation; N-inflation guard; three-way disagreement handling; `out-of-scope` tiebreaker; "grandfathered" defined; §7 de-dup). 10 items deferred total across both rounds (4 from Round 2, 6 from Round 1). Convergence reached — Round 3 declined per diminishing returns despite allowed structural changes. Total 22 patches across 3 files (`convoke-spec-covenant-compliance-checklist.md`, `convoke-report-operator-covenant-audit-2026-04-18.md`, `project-context.md`). |
| 2026-04-18 | **A10 shipped.** New `## Reproducibility gate (multi-skill audits)` section in `convoke-spec-covenant-compliance-checklist.md`: v2+ Covenant audits MUST cover ≥3 cells — at least one expected-PASS, one expected-FAIL, one borderline — with blind dual-reviewer verdicts at ≥80% agreement. Adds pre-gate verdict expectation discipline (auditor records predictions before blind review, yielding calibration signal separate from concurrence). Single-skill audits and Story 1.4 self-compliance exempt. v1 audit report §2.5 amended with forward-reference to the formalized rule. Revisions entry added (change type: scope-rule-edit). A10 moved Fast Lane → §2.5 Completed. |
| 2026-04-18 | **A5 shipped.** New `project-context.md` rule `mechanical-research-enumeration` encoded: research/catalog/audit/inventory deliverables must enumerate via `grep`/`glob`/`rg` rather than section-header eyeballing; raw search output is evidence of completeness. Story specs for research work must include the exact search command. Origin: AG Epic 7 retro A1 (Story 7.3 went through 3 review rounds from non-mechanical enumeration). Complements existing `spec-verify-referenced-files` (same origin, narrower scope). Total `project-context.md` rules: 14. A5 moved Fast Lane → §2.5 Completed. |
| 2026-04-18 | **A15 shipped.** OC-R6 external-declared escape hatch added to the Compliance Checklist spec. New sixth Compliance Status value `N/A — external-declared (<tool>)` applies to OC-R6 only, for skills wrapping externally-owned CLIs (git, npm, docker, ...) whose stderr the skill doesn't rewrite. Worst-case aggregation gains an OC-R6-specific carve-out: Layer 3 excluded when declaration is used, with three mandatory evidence-note preconditions (tool named, OC-R0 enumeration, L1+L2 independently PASS OC-R6). If L1 or L2 would FAIL, cell is FAIL regardless — carve-out does not mask skill-authored violations. Extended parser regex and em-dash normalization anchor; `No partial credit` note updated. 6 spec edits in `convoke-spec-covenant-compliance-checklist.md`; no code changes (pure spec; Loom parser still deferred). A15 moved Fast Lane → §2.5 Completed. |
| 2026-04-18 | **U8 shipped.** New `excluded_agents: []` field in Vortex + Gyre `config.yaml` with operator-facing comment; new `readExcludedAgents(configPath)` helper in `config-merger.js`; `mergeConfig` filters excluded from `merged.agents`; `refresh-installation` skips agent-file copy + user-guide copy + skill-wrapper generation + manifest rows for excluded agents; `validator.validateAgentFiles` and `convoke-doctor.checkModuleAgents`/`checkAgentSkillWrappers` honor exclusions. 2 rounds of code review applied 9 patches (HIGH: manifest drift; MEDIUM: falsy-updates filter bypass, user-guide skip, IO error discrimination; LOW: hoisted `guide` var, Gyre positive assertion). Full suite 1167/1167 (+14 new tests). U8 moved Fast Lane → §2.5 Completed. |
| 2026-04-18 | **Triage by Winston: Logged 6 intakes (IN-24, IN-25, IN-26, IN-27, IN-28, IN-29) from code review of U8 Round 1.** Qualified 6 to Fast Lane: I57 (cross-module exclusion-ID validation, score 0.5), I58 (unify YAML parser in `readExcludedAgents`, 0.3), U14 (honor exclusion in dev-mode skill wrapper generation, 0.25), I59 (dedup duplicate `excluded_agents`, 0.25), U13 (extend `excluded_agents` to `EXTRA_BME_AGENTS`, 0.2), U12 (inject `excluded_agents` comment on upgrade, 0.1). All deferred-from U8 Round 1. Raw intakes: 0. Dropped: 0. |
| 2026-04-18 | **A12 shipped + Round 1 code-review follow-up.** Initial A12 fix applied (cumulative vocabulary + illustration carve-out). Round 1 code review surfaced 3 HIGH findings: (H1) Section 1 still exceeds budget in statement alone; (H2) illustration/introduction adjudication subjective; (H3) shipping claim overstated. Follow-up patches applied inline: softened Revisions claim to "narrows surface", added Covenant preamble authoring contract (preamble MUST pre-introduce 9 foundational terms: `default`, `fallback`, `override`, `unresolvable state`, `exclusion`, `decision point`, `interaction round`, `concept budget`, `scope`), closed illustration loophole (new domain nouns inside illustrations still count). A12 + follow-up moved Fast Lane → §2.5 Completed (shipped 2026-04-18, score 6.3). Story 1.4 authoring contract now explicit. |
| 2026-04-18 | **Triage by Winston: Logged 5 intakes (IN-19, IN-20, IN-21, IN-22, IN-23) from code review of oc-1-3-checklist-derivation Round 3.** Qualified 5 to Fast Lane: A12 (Covenant OC-R7 doc-mapping double-count fix — score 6.3, blocks Story 1.4), A15 (Layer 3 uncontrollable stderr escape hatch — score 3.2), A16 (workflow-inherited concepts bidirectional rule — score 1.8), A14 (conditional-surface N/A variant — score 1.2), A13 (compound-concept counting rules — score 1.17). Per no-R4 convergence rule — remaining Round 3 findings triaged to backlog. ⚠️ A12 blocks Story 1.4. |
| 2026-04-18 | **Triage by Amalik: Logged 3 intakes (IN-16, IN-17, IN-18) from code review of BUG-1+U7 Round 1.** Qualified 3 to Fast Lane: U11 (compareVersions semver-aware pre-release handling, score 0.9), I56 (render `taxonomy.initiatives.user` in ADR, score 0.8), I55 (validate non-empty taxonomy arrays, score 0.2). All deferred-from BUG-1+U7 Round 1. Other deferred items (D1=I54 duplicate, D5 __dirname fragility, D6 verbose-gating) remain in `deferred-work.md` only — too speculative for intake qualification. |
| 2026-04-18 | **U7 shipped.** New `scripts/update/lib/changelog-reader.js` (pure parser, Keep-a-Changelog headers incl. pre-release, fenced-code-aware, semver post-filter). Wired into `convoke-update.js` via `printChangelog()` helper — "What's New" block surfaces before the confirm prompt in both refresh-only and upgrade branches. Code review Round 1 applied 4 patches (taxonomy guard in `generateGovernanceADR`, broadened HEADER_RE, fenced-code tracking, integration tests). Full suite 1142/1142 (+16 new tests). U7 moved Fast Lane → §2.5 Completed. |
| 2026-04-18 | **ILE-1 PRD complete.** 12-step PRD workflow delivered `convoke-prd-initiative-lifecycle-engine.md`: Executive Summary, Project Classification (developer_tool / capability-layer / portfolio-and-program-management / high / brownfield), Success Criteria (3 user success + business success + L1-L2 leading + M1-M4 outcomes + 4 falsification + 2 kill criteria w/ diagnostic + 4 TACs + 4 observability signals), Product Scope (MVP 6 items + Growth + Vision), 8 User Journeys + requirements summary + open questions + UX risk, Domain Requirements, Innovation (Christensen-honest framing + 3 positioning framings + 4 feature claims + 2-tier validation + month-3/6 reviews + 3-question kill diagnostic), Project-Type Requirements (13 subsections incl. Error Contract w/ 20 seed codes), Project Scoping & Phased Development (ship-essential vs thesis-essential + dependency graph + 5-7 sprint baseline + 4-tier contingency + descope governance), 63 FRs across 9 capability areas, 36 NFRs across 9 categories. 10 rounds of elicitation + multiple party-mode reviews. Stage: In Pipeline; artifacts: B, P. Next pipeline step: Architecture. |
| 2026-04-18 | **BUG-1 shipped.** `generateGovernanceADR` (`scripts/lib/artifact-utils.js:2001`) now accepts `taxonomy` param and derives platform + artifact-type counts/lists from it (was hardcoded "(8)" and "(21)"); call site `scripts/migrate-artifacts.js:384` passes the already-loaded taxonomy through. Tests updated (`tests/lib/migration-execution.test.js:1210`) — 1 new case asserts custom taxonomy is reflected in output, not hardcoded. Full suite 1126/1126 green. BUG-1 moved Bug Lane → §2.5 Completed; Bug Lane empty again. |
| 2026-04-18 | **Triage by Winston: Logged 4 intakes (IN-12, IN-13, IN-14, IN-15) from code review of oc-1-1-covenant-audit Round 3.** Qualified 4 to Fast Lane: A10 (reproducibility ≥3 cells for v2 audits, score 2.7), A8 (Vortex audit expansion, score 2.4), A9 (decision-support archetype addition, score 1.6), A11 (Migration scar evidence grounding, score 0.9). All deferred-from oc-1-1 Round 3 per code-review-convergence no-R4 rule. Raw intakes: 0. Dropped: 0. |
| 2026-04-18 | **Triage by Winston: Logged 2 intakes (IN-10, IN-11) from code review of oc-1-2-taxonomy-extension Round 1.** Qualified 2: Bug Lane 1 (BUG-1 — `generateGovernanceADR` hardcoded type count, score 2.7), Fast Lane 1 (I54 — `DEFAULT_ARTIFACT_TYPES` refactor to single source, score 0.9). Raw intakes: 0. Dropped: 0. I54 cross-references A6 (Structured-source for count-sensitive deliverables) as a related item. Bug Lane first-populated (previously empty). |
| 2026-04-18 | **ILE-1 Brief complete.** Product brief authored at `convoke-brief-initiative-lifecycle-engine.md` + detail pack at `convoke-brief-initiative-lifecycle-engine-distillate.md`. Stage advanced Qualified → In Pipeline. Artifact indicator updated: `—` → `B` (Brief). Positioning established as "Portfolio-as-Code." Co-primary personas: consulting team lead + solo practitioner. Success criteria: <60s context re-entry, portfolio health without altitude change, findings auto-land in correct lane. V1 scope locked (shared model + lifecycle-aware portfolio + kanban + reactive behaviors + pipeline dashboard + skill integration). Data model decision deferred to Architecture. **Next pipeline step: PRD.** |
| 2026-04-18 | **I49 shipped.** 4 rules added to `project-context.md`: `derive-counts-from-source` (no hardcoded counts — compute from source data), `shared-test-constants` (import from shared files like `test-constants.js`, don't duplicate), `catch-all-phase-review` (review catch-all matcher output for false positives before shipping), `spec-verify-referenced-files` (existence-check all file paths in specs before dev starts). Path-safety was already covered by existing rule. Total project-context.md rules: 13. Origin: SP Epic 5 retro A1. |
| 2026-04-18 | **P10+P11 shipped.** Capability Evaluation Framework and Friction Log Template moved from `_archive/exploratory/` to `planning-artifacts/` with governance naming. Framework referenced from lifecycle §1.2 qualifying gate (capability-type intakes must run decision tree). Friction log linked as required input feed. `project-context.md` rule `capability-form-factor-evaluation` added. `lifecycle-process-spec.md` template updated with same gate rule. Archive INDEX.md entries annotated with move dates. |
| 2026-04-18 | **A7 shipped.** Review convergence rule encoded in two locations: `project-context.md` (Rule: `code-review-convergence` — R1 mandatory, R2 only if HIGH, R3 only if structural changes, no R4, remainder deferred to backlog) and `bmad-code-review` step-04-present.md section 7 (enforcement logic: round counting via `### Review Findings` subsections, stopping criteria gate before offering re-run option). Both source (`_bmad/bmm/4-implementation/`) and installed (`.claude/skills/`) copies updated. Origin: ag-epic-7 retro Action Item #3. |
| 2026-04-17 | **Shipped items moved to §2.5.** T6, I43, T7, T8 moved from §2.3 Fast Lane to §2.5 Completed per format spec. |
| 2026-04-15 | **WS1 spike: `bmad-enhance-initiatives-backlog` skill reworked to v2.0.0.** 14 files rewritten (workflow.md, 11 step files, SKILL.md) + 2 new templates (backlog-format-spec.md rewrite, lifecycle-process-spec.md new). Three modes updated: Triage now logs to Intakes then runs qualifying gate (lane + portfolio + RICE); Review is lane-aware with scope selection; Create emits Part 1 verbatim from template. Step renames: step-t-03-score → step-t-03-qualify, step-c-03-score → step-c-03-qualify, step-c-04-prioritize → step-c-04-generate. |
| 2026-04-17 | **I43 shipped.** `checkAgentSkillWrappers()` added to `convoke-doctor.js`. Validates all 12 bme agent skill wrappers (7 Vortex + 4 Gyre + 1 team-factory) at `.claude/skills/bmad-agent-bme-{id}/SKILL.md`. Imports AGENTS/GYRE_AGENTS/EXTRA_BME_AGENTS from agent-registry.js. Mirrors I31 pattern. Verified: passes with all 12 present, fails with clear diagnostic when any missing. All 1,123 tests pass. Closes F6+F20+F21 GAPs from ag-7-3 contract audit. |
| 2026-04-17 | **T7 shipped.** Ruff linting added to CI (`python-test` job, piggybacked on T6). Config: `ruff.toml` (line-length 120, select E/W/F/I/N/UP, per-file E501 ignores for HTML generators + data-heavy files). 40 auto-fixes applied (import sorting, unused imports, redundant open modes). 3 manual fixes (f-string refactor in analyze_sources.py × 2, unused variable in test-merge-help-csv.py). All 116 tests pass post-fix. |
| 2026-04-17 | **T8 shipped.** PEP 723 standardized across all 24 Python files. Fixes: `"pyyaml"` → `"pyyaml>=6.0"` (4 files), `# ///` syntax → standard `# ` content lines (2 distillator files), `>=3.10` → `>=3.9` (2 bmad-init files), added missing metadata blocks (2 test files). 22→24 files now have consistent PEP 723 blocks. |
| 2026-04-17 | **T6 shipped.** Python test execution added to CI (`python-test` job in ci.yml). 5 test files, ~116 tests across BMB (merge-config, merge-help-csv, cleanup-legacy) and Core (bmad_init, analyze_sources). Publish gate updated to require `python-test`. Resolves Gyre DL-001 blocker. CI green. |
| 2026-04-17 | **Rescore I33** (Workflow-name namespace collision risk): 0.4 → 0.9. R:4→4, I:0.5→1, C:60%→70%, E:3→3. Rationale: I32 shipped active orphan deletion (two-strategy matching) which increased collision blast radius from overwrite-only to overwrite + cleanup deletes. Moved from rank ~78 to 0.9 block (after I52, before I39). Fast Lane re-sorted within 0.9 tiebreak (C:90% before C:70%). |
| 2026-04-15 | **Dependencies column added** to all three lane tables (§2.2 Bug, §2.3 Fast, §2.4 Initiative). Notation rules added to backlog-format-spec.md: comma-separated IDs, cross-lane allowed, `—` for none, `✓ID` for shipped deps, `bundles-with: ID` for paired items, `external: short-desc` for non-backlog blockers. Bulk-added `—` to all existing rows; populated meaningful dependencies on ~13 items (Initiative: P9, P13, v6.3, ILE-1, P3, P2; Fast: T7, T8, I43, I44, I45, I46, I47, I48, I15, I39, I33). Format spec column counts updated: Bug 11, Fast 10, Initiative 11. |
| 2026-04-15 | **Qualifying gate run on IN-9.** Qualifier: John+Winston (per §1.2 shortcut rule). Lane: Initiative. Portfolio: helm (current-best-fit, revisitable). RICE: R:9 I:3 C:60% E:8 = 2.0. New row added to §2.4 Initiative Lane as **ILE-1** (Initiative Lifecycle Engine). Intake row IN-9 in §2.1 cross-referenced via `→ ILE-1` per §1.1 audit-trail rule. Appendix entry added with three-workstream scope hint and precedent notes (WS1+WS2 already executed as spikes; skill rework v2.0.0 partially shipped). Initiative Lane re-sorted: ILE-1 (2.0) sits between v6.3 Adoption (2.3) and U9 (1.9). |
| 2026-04-12 | **Pass 1 + Pass 2 complete.** Document created from `convoke-note-initiatives-backlog.md` retroactive review. All 88 items classified across three lanes per lifecycle process established in party mode session (John, Winston, Amalik). Supersedes `convoke-note-initiatives-backlog.md`. Intakes: 9 (was 8 "exploration candidates" + 1 new meta-initiative IN-9). Bug Lane: 0. Fast Lane: 65. Initiative Lane: 11 (4 absorbed into v6.3, 7 standalone). Absorbed/Archived: 27 (4 absorbed into v6.3 Epic, 2 absorbed into S3, 21 completed). S1/S2 folded into S3. Original IDs preserved for traceability. |
