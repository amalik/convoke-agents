---
stepsCompleted:
  - step-01-validate-prerequisites
  - step-02-design-epics
  - step-03-create-stories
  - step-04-final-validation
status: complete
completedAt: '2026-04-12'
inputDocuments:
  - _bmad-output/planning-artifacts/convoke-prd-bmad-v6.3-adoption/index.md
  - _bmad-output/planning-artifacts/convoke-arch-bmad-v6.3-adoption.md
  - _bmad-output/planning-artifacts/convoke-note-exp3-platform-agnostic-smoke-test.md
initiative: convoke
artifact_type: epic
qualifier: bmad-v6.3-adoption
created: '2026-04-12'
schema_version: 1
---

# Convoke 4.0 — Epic Breakdown (BMAD v6.3.0 Adoption)

## Overview

This document decomposes the 50 Functional Requirements, 33 Non-Functional Requirements, and architecture decisions from the Convoke 4.0 PRD and Architecture doc into implementable epics and stories. Organized by the 5-sprint architecture build order (Decision 6).

## Requirements Inventory

### Functional Requirements

**50 FRs across 10 capability areas:**

- **FR1–FR4:** Direct-Load Configuration — agents load config directly from YAML, loader utility replaces bmad-init, v6.3-compliant activation, no active bmad-init references
- **FR5–FR11:** User Migration — single-command upgrade, auto-migration, idempotent, path-safe, resume-safe, migration guide ≤1 page, zero new concepts
- **FR12–FR18:** Extensions Governance — bmm-dependencies.csv registry, scan tool, doctor validation, update gate, custom skill registration, honest warnings, recursive tooling first
- **FR19–FR25:** Marketplace Distribution — marketplace.json, module_definition, marketplace install, dual-distribution parity, compatibility preflight, registry entry, three install methods
- **FR26–FR30:** Agent Consolidation — remove Bob/Quinn/Barry, integrate upstream Amelia, update manifests, update workflows, cross-reference grep clean
- **FR31–FR35:** Release Discipline — playbook artifact, playbook content, Sprint 1 experiments, experiment downstream statements, strategic bet ADR
- **FR36–FR40:** Validation & Equivalence — PF1 battery, drift threshold T comparison, failure blocks release, drift snapshots, N=1 external user validation
- **FR41–FR44:** Release Communication — CHANGELOG with mostHonestOneLineSummary, cliché grep test, dual-framing vocabulary, maintainer sign-off
- **FR45–FR46:** Quality Gates — IR gate before dev, architecture doc with numeric T
- **FR47–FR50:** Retrospective & Learning — retrospective scheduled in Sprint 0, anti-pattern registry, innovation hypothesis observations, findings feed backlog

### Non-Functional Requirements

**33 NFRs across 7 categories:**

- **NFR1–NFR5:** Performance — update ≤60s, loader ≤50ms overhead, PF1 ≤15min, audit ≤5s, scan ≤10s
- **NFR6–NFR10:** Reliability — idempotent, resume-after-failure, offline-safe, fail-soft governance, graceful doctor degradation
- **NFR11–NFR15:** Integration — marketplace.json schema, SKILL.md v6.3 convention, module.yaml schema, activation protocol, alongside-BMAD install
- **NFR16–NFR20:** Maintainability — LOC bounded, single-page migration guide, self-contained playbook, audit scripts in single directory, numeric T
- **NFR21–NFR25:** Observability — per-input PASS/FAIL, semantic diff artifact, recursive validation log, experiment timestamps, hypothesis observation status
- **NFR26–NFR29:** Backwards Compatibility — one-version compat window, deprecated→warned→removed timeline, custom skills keep working, install-over-3.x works
- **NFR30–NFR33:** Reproducibility — numeric T, ≥5 representative inputs, deterministic snapshots, re-runnable post-release

### Additional Requirements (from Architecture)

**Architecture decisions that create implementation requirements:**

- Config loader API: `loadModuleConfig(projectRoot, moduleConfigPath)` at `scripts/update/lib/config-loader.js` — must handle nested module paths (FM1-1 fix)
- Migration: 5-phase pipeline with template-based activation section rewrite (FM2-1 fix), per-phase checkpointing with per-file tracking in Phase 3
- Governance scan: frontmatter `dependencies` field + step-file code grep, doc-body excluded (FM3-1 fix). CSV via csv-utils.js (FM3-3)
- PF1: LLM-as-judge, T=4.0, 5 agents × 4 prompts, median of 3 runs, judge calibration test (FM7-2). Sprint 1 CLI scriptability spike required (FM4-2)
- Marketplace: skills[] paths must have SKILL.md (FM5-1). Parity diff with exclusion list (FM5-2)
- API freeze: config-loader API locked after Sprint 1 tests pass (FM6-1)
- Pre-work: bmad-init behavior audit (FM1-2) before building loader
- 8 implementation patterns (module structure, CSV handling, YAML safety, error handling, test conventions, SKILL.md template, migration contract, CLI verbose)

### UX Design Requirements

N/A — CLI tool, no visual UI. UX is textual: migration guide (FR10–FR11) and CHANGELOG voice (FR41–FR44).

### FR Coverage Map

```
FR1–FR4:   Epic 1A (Direct-Load Configuration)
FR5–FR11:  Epic 1A (User Migration)
FR12–FR18: Epic 2  (Extensions Governance)
FR19–FR25: Epic 3  (Marketplace Distribution)
FR26–FR30: Epic 1B (Agent Consolidation)
FR31–FR35: Epic 5A (Sprint 1 Experiments & ADR)
FR36–FR40: Epic 4  (Validation & Behavioral Equivalence)
FR41–FR44: Epic 5B (Release Communication)
FR45–FR46: Epic 4  (Quality Gates)
FR47–FR50: Epic 5B (Retrospective & Learning)
```

**Coverage: 50/50 FRs mapped. Zero gaps.**
**NFR mapping: 33 NFRs become acceptance criteria within FR stories (mapped in Step 3).**

## Epic List

**Problem-solving epics (57%):** 1A, 2, 3, 4 (32 FRs) — address the core drift-prevention problem
**Process-discipline epics (43%):** 1B, 5A, 5B (18 FRs) — sustain release practice and communication

**Named deferral paths:**
- **Path A (6 epics):** Drop Epic 1B → defer agent consolidation to 4.1
- **Path B (5 epics):** Drop 1B + 5A → accept Sprint 2 risk (must still run EXP1 informally)
- **Path C (5 epics, alt):** Drop 1B + 5B → ad-hoc CHANGELOG and informal retrospective

### Epic 1A: Seamless Config Migration
**Primary beneficiary:** User (Priya) | **Deferrable:** No — foundation
**User outcome:** Existing users upgrade from 3.x to 4.0 in a single command. Config loads directly. Auto-migration handles everything. Migration guide ≤1 page, zero new concepts.
**FRs covered:** FR1–FR11 (11 FRs)
**Sprint:** 1–3 (config-loader in Sprint 1, migration sweep in Sprint 2–3)
**Story flags:** PR5-4 — migration guide must be standalone story with own ACs

### Epic 1B: Upstream Agent Consolidation
**Primary beneficiary:** Codebase | **Deferrable:** Yes (PRD MVP, Path A/B/C)
**User outcome:** Bob/Quinn/Barry removed, upstream Amelia integrated. Manifests and workflows updated.
**FRs covered:** FR26–FR30 (5 FRs)
**Sprint:** 2–3 (parallel to migration sweep)

### Epic 2: Custom Skills Stay Safe
**Primary beneficiary:** User (Priya edge case) | **Deferrable:** No — governance
**User outcome:** Custom BMM extensions survive upgrades. Governance registry catches drift. Honest warnings, not blocks.
**FRs covered:** FR12–FR18 (7 FRs)
**Sprint:** 2–3

### Epic 3: Discover via BMAD Marketplace
**Primary beneficiary:** User (Samira) | **Deferrable:** Yes (not correctness-blocking)
**User outcome:** New users find and install Convoke through the BMAD community module browser. Platform adapters validated across Claude Code, Copilot, Cursor.
**FRs covered:** FR19–FR25 (7 FRs)
**Sprint:** 4
**Story flags:** PR5-5 — platform adapter batch validation must be explicit story

### Epic 4: Validated Behavioral Equivalence
**Primary beneficiary:** Maintainer → Users (trust) | **Deferrable:** No — quality bar
**User outcome:** Users trust the upgrade — behavioral equivalence tested and proven before release.
**FRs covered:** FR36–FR40, FR45–FR46 (7 FRs)
**Sprint:** 4 (FM4-2 conditional on recording stories — fallback noted)
**Story flags:** PR5-6 — N=1 external user validation (FR40) must be its own Sprint 5 story

### Epic 5A: Sprint 1 Experiments & Strategic ADR
**Primary beneficiary:** Maintainer (Amalik) | **Deferrable:** Yes (risk trade-off)
**User outcome:** Three pre-registered experiments run in week 1, decisions logged and acted upon. Strategic bet documented as revalidatable ADR.
**FRs covered:** FR31–FR35 (5 FRs)
**Sprint:** 1

### Epic 5B: Release Communication & Learning
**Primary beneficiary:** Users + Maintainer | **Deferrable:** No — honest communication
**User outcome:** CHANGELOG is honest and trustworthy. Retrospective captures anti-patterns. Innovation hypotheses observed. Findings feed backlog.
**FRs covered:** FR41–FR44, FR47–FR50 (8 FRs)
**Sprint:** 5

---

## Pre-Work Items (Sprint 0/1, not stories)

- **bmad-init behavior audit** (FM1-2) — audit `bmad_init.py` before building config-loader. Blocks Story 1A.2.
- **CLI scriptability spike** (FM4-2) — 30 min. Verify Claude Code CLI supports non-interactive input. Go/no-go for PF1 automation vs manual fallback.
- **Schedule retrospective** — Sprint 0: name owner, date, questions, backlog destination. 10-minute scheduling task.

---

## Epic 1A: Seamless Config Migration

### Story 1A.1: Audit bmad-init behavior before replacement

As a maintainer, I want a complete audit of `bmad_init.py`'s actual behavior, So that the replacement config-loader reproduces all transformations.

**Acceptance Criteria:**
- **Given** `bmad_init.py` at `_bmad/core/bmad-init/scripts/` **When** audited end-to-end **Then** document lists every behavior: variable resolution, default cascading, path expansion, error handling
- **And** each behavior tagged "reproduce in loader" or "drop with rationale"

### Story 1A.2: Create config-loader.js with direct-YAML loading

As a Convoke agent, I want to load config directly from `_bmad/{module}/config.yaml`, So that I don't depend on the deprecated `bmad-init` skill.

**Acceptance Criteria:**
- **Given** v4 config layout **When** `loadModuleConfig(projectRoot, 'bme/_vortex')` called **Then** returns parsed YAML matching bmad-init output
- **And** nested paths (`bme/_vortex`, `bme/_enhance`, `core`) all resolve correctly
- **Given** pre-v4 install with bmad-init **When** config path missing **Then** emits deprecation warning and falls back to legacy loading (NFR26)
- **Given** malformed YAML **When** loaded **Then** throws error naming file + line, never crashes silently
- **Tests:** `tests/lib/config-loader.test.js`. API frozen after tests pass (FM6-1).

### Story 1A.3: Create v6.3 migration inventory

As a maintainer, I want a frozen inventory of SKILL.md files requiring migration, So that the sweep has a definitive target list.

**Acceptance Criteria:**
- **Given** Convoke source tree **When** scanned for bmad-init activation references **Then** `_bmad/_config/v6.3-migration-inventory.csv` generated with file + module config path per entry
- **And** count matches ~25 agents; amendments allowed via change record (M1)

### Story 1A.4: Create migration script (3.x-to-4.0.js)

As an existing user, I want `convoke-update` to auto-migrate my install to v6.3 conventions, So that I upgrade in one command with no manual steps.

**Acceptance Criteria:**

*Phase 1 — Detect:*
- **Given** a 3.x install **When** migration runs **Then** Phase 1 correctly detects pre-v4 state

*Phase 2 — Config layout:*
- **Given** Phase 1 complete **When** Phase 2 runs **Then** direct-load config paths verified/created for each module
- **And** state checkpointed to `migration-state-4.0.yaml`

*Phase 3 — SKILL.md sweep:*
- **Given** frozen inventory (1A.3) **When** Phase 3 runs **Then** each agent's "On Activation" section replaced with v4 template (Pattern 6), parameterized by module path
- **And** template-based rewrite used, NOT substring replacement (FM2-1)
- **And** per-file progress tracked in state file (resume-safe)

*Phase 4 — Deprecation:*
- **Given** Phases 1–3 complete **When** Phase 4 runs **Then** bmad-init marked deprecated
- **Given** Phases 1–3 complete **When** Phase 4 runs **Then** bmad-init marked deprecated

*Phase 5 — Validation:*
- **Given** Phase 4 complete **When** Phase 5 runs convoke-doctor **Then** diffs structured JSON health reports (before vs after migration) (FM2-3); only new issues flagged; fail-soft (NFR9)

- **And** script follows Pattern 7 migration contract: `{ version, detect, apply }`, registered in `registry.js`

### Story 1A.5: Migration robustness (idempotency, resume, offline, lockfile)

As an existing user, I want the migration to be safe under all conditions, So that I can't accidentally corrupt my install.

**Acceptance Criteria:**
- **Given** completed migration **When** `convoke-update` re-run **Then** zero filesystem changes (NFR6, M4)
- **Given** interrupted Phase 3 **When** re-run **Then** resumes from `remaining` list in state file (NFR7)
- **Given** no network **When** migration runs **Then** completes successfully; marketplace checks may warn but don't block (NFR8)
- **Given** concurrent terminal runs **When** second instance starts **Then** lockfile detected, refuses with clear message (FM2-2)
- **And** all operations use `path.resolve()` with `projectRoot`; no ops outside `_bmad/` or `.claude/skills/` (FR8)

### Story 1A.6: Author migration guide (standalone deliverable)

As an existing user, I want a ≤1 page migration guide, So that I can upgrade confidently without reading the PRD.

**Acceptance Criteria:**
- **Given** draft at `convoke-migration-guide-3.x-to-4.0-draft.md` **When** finalized **Then** ≤1 page rendered (FR10, NFR17)
- **And** zero new concepts introduced (FR11)
- **And** linked from `convoke-update` terminal output + CHANGELOG
- **And** saved at `docs/migration/3.x-to-4.0.md`

---

## Epic 1B: Upstream Agent Consolidation

### Story 1B.1: Remove deprecated agents and update manifests

As a maintainer, I want Bob/Quinn/Barry removed and manifests updated, So that Convoke tracks upstream v6.3's consolidated Amelia lineup.

**Acceptance Criteria:**
- **Given** `bmad-agent-qa`, `bmad-agent-sm`, `bmad-agent-quick-flow-solo-dev` **When** removed from `_bmad/bmm/` (source) and `.claude/skills/` (installed) **Then** no trace remains (FR26)
- **And** `skill-manifest.csv`, `files-manifest.csv`, `agent-manifest.csv` updated with Amelia, stale entries removed (FR28)
- **And** CSV updates use csv-utils.js (Pattern 2)

### Story 1B.2: Integrate upstream Amelia v6.3+

As a Convoke user, I want the consolidated Amelia agent available, So that I get upstream's combined dev/QA/SM capabilities.

**Acceptance Criteria:**
- **Given** upstream Amelia v6.3+ source at `bmad-code-org/BMAD-METHOD` repo (agent definition under `tools/agents/` or equivalent v6.3 path — verify exact location during Sprint 2) **When** integrated into Convoke's bmm module **Then** SKILL.md follows v4 activation template (Pattern 6) (FR27)

### Story 1B.3: Update workflow references and verify clean grep

As a maintainer, I want zero stale references to removed agents, So that no workflow breaks.

**Acceptance Criteria:**
- **Given** Bme workflows (Vortex, Gyre, etc.) **When** cross-reference grep runs for Bob/Quinn/Barry **Then** zero matches (FR29, FR30)

---

## Epic 2: Custom Skills Stay Safe

### Story 2.1: Create BMM dependency scan tool and registry

As a maintainer, I want a scan tool that discovers BMM dependencies, So that the governance registry is generated automatically.

**Acceptance Criteria:**
- **Given** `.claude/skills/` directory **When** `audit-bmm-dependencies.js` runs **Then** generates `_bmad/_config/bmm-dependencies.csv` per Decision 3 schema (FR12, FR13)
- **And** detects via frontmatter `dependencies` + step-file code grep; excludes doc-body (FM3-1)
- **And** uses csv-utils.js (FM3-3, Pattern 2)
- **And** first skill scanned is `bmad-enhance-initiatives-backlog` (FR18 recursive tooling ordering)
- **Tests:** `tests/lib/audit-bmm-dependencies.test.js`

### Story 2.2: Integrate governance check into convoke-doctor

As a user, I want `convoke-doctor` to validate BMM dependencies, So that drift is surfaced as a health finding.

**Acceptance Criteria:**
- **Given** `bmm-dependencies.csv` exists **When** doctor runs **Then** validates each entry's skill+agent exist (FR14)
- **And** warns on stale entries, surfaces unregistered custom skills with honest non-blocking warnings (FR17)

### Story 2.3: Integrate registry gate into convoke-update

As a user, I want post-upgrade BMM dependency checking, So that extension drift is caught after upgrade.

**Acceptance Criteria:**
- **Given** upgrade complete **When** post-upgrade gate runs **Then** re-scans and diffs against CSV (FR15)
- **And** fail-soft: warnings allow override (NFR9)

### Story 2.4: Custom skill registration and honest warnings

As a user with a custom BMM extension, I want to register my skill, So that future upgrades validate it.

**Acceptance Criteria:**
- **Given** user adds row to `bmm-dependencies.csv` **Then** row preserved across re-scans (FR16)
- **Given** unregistered custom skill detected **Then** honest warning + registration instructions emitted (FR17)

---

## Epic 3: Discover via BMAD Marketplace

### Story 3.1: Create and validate marketplace metadata

As a new user browsing BMAD marketplace, I want Convoke listed with valid metadata, So that I can install it.

**Acceptance Criteria:**
- **Given** `.claude-plugin/marketplace.json` created **Then** passes PluginResolver validation (FR19, NFR11)
- **And** references `_bmad/bme/_vortex/module.yaml` as `module_definition` (FR20)
- **And** all `skills[]` paths contain SKILL.md with v6.3 frontmatter (FM5-1)
- **And** `module.yaml` validates against BMAD expected schema (NFR13)

### Story 3.2: Compatibility preflight and skill-dir audit

As a Convoke installer, I want validation that my BMAD version is compatible and skills comply with v6.3, So that installation succeeds.

**Acceptance Criteria:**
- **Given** BMAD < 6.3.0 **When** `convoke-install` runs **Then** emits version warning (FR23)
- **Given** `audit-skill-dirs.js` **When** scans `.claude/skills/` **Then** every directory has SKILL.md with v6.3 frontmatter (NFR12); completes ≤5s (NFR4)

### Story 3.3: Submit marketplace registry PR

As a maintainer, I want Convoke registered in the BMAD marketplace, So that new users can discover it.

**Acceptance Criteria:**
- **Given** validated metadata **When** PR submitted to `bmad-plugins-marketplace` **Then** `trust_tier: unverified`, complete schema, passes validation (FR24, M12a)

### Story 3.4: Dual-distribution parity verification

As a maintainer, I want proof that both install paths produce identical state.

**Acceptance Criteria:**
- **Given** two sandbox installs (npm standalone + simulated marketplace via local `git clone` + BMAD PluginResolver — actual merged PR not required) **When** `diff -r` on `_bmad/` trees **Then** empty diff (excluding timestamps, .DS_Store per FM5-2) (FR22)

### Story 3.5: Platform adapter batch validation

As a maintainer, I want exported Tier 1 skills validated across 3 platforms, So that "Convoke ships everywhere" is proven beyond the single EXP3 test.

**Acceptance Criteria:**
- **Given** `convoke-export --tier 1` **When** run on all Tier 1 skills **Then** `validate-exports` passes (FR25)
- **And** 3 adapters spot-checked per platform (Claude Code, Copilot, Cursor)

---

## Epic 4: Validated Behavioral Equivalence

### Story 4.1: Create PF1 judge prompt and calibration test

As a maintainer, I want a reliable LLM-as-judge scoring system, So that behavioral equivalence is measured consistently.

**Acceptance Criteria:**
- **Given** `pf1-judge-prompt.md` **When** used with 2 calibration fixtures **Then** identical pair ≥ 4, different pair ≤ 2 (FM7-2)
- **And** structured output: SCORE, STRUCTURAL_MATCH, PERSONA_CONSISTENT, CAPABILITIES_COMPLETE, REASONING

### Story 4.2: Create PF1 validation battery harness

As a maintainer, I want a script orchestrating the full PF1 pipeline, So that validation is repeatable.

**Acceptance Criteria:**
- **Given** `pf1-validation-battery.js` **When** run **Then** invokes judge 3× per agent (median), 5 agents × 4 prompts
- **And** produces go/no-go: PASS (avg ≥ 4.0, no agent ≤ 2), INVESTIGATE, or FAIL
- **And** per-input PASS/FAIL record (NFR21); completes ≤15 min (NFR3)
- **Note:** If FM4-2 spike shows CLI not scriptable, recording step is manual; judge + gate are still automated.

### Story 4.3: Execute PF1 validation cycle (record + compare + gate)

As a maintainer, I want to record baselines, run post-migration comparison, and get a PASS/FAIL, So that I know whether to ship.

**Acceptance Criteria:**
- **Given** 5 agents (Emma, John, Winston, Carson, Murat) **When** baseline recorded IMMEDIATELY before migration (FM4-4) **Then** saved to `_bmad-output/pf1-baselines/`
- **Given** migration complete **When** post-migration recorded and battery run **Then** produces per-agent scores + overall average + go/no-go (M9, NFR30)
- **And** T=4.0 applied; result logged in release record (M6)
- **Time-box:** Recording capped at 2 hours. If FM4-2 manual fallback, budget full day for this story.

### Story 4.4: Create drift snapshot workflow

As a maintainer, I want pre/post snapshots for key skills, So that I have a retrospective drift artifact.

**Acceptance Criteria:**
- **Given** 2–3 key skills **When** snapshot captured **Then** side-by-side markdown comparison file produced showing paired pre/post outputs with highlighted differences (FR39, NFR22)
- **And** deterministic on re-run (NFR32)

### Story 4.5: N=1 external user validation (Sprint 5)

As a maintainer, I want one non-maintainer user to validate the upgrade, So that real-world experience is confirmed.

**Acceptance Criteria:**
- **Given** a non-Amalik human **When** they run `convoke-update` **Then** result logged in release record (FR40, M17)

---

## Epic 5A: Sprint 1 Experiments & Strategic ADR

### Story 5A.1: Run Sprint 1 experiments and log decisions

As a maintainer, I want EXP1 + EXP2 run in week 1 with logged go/no-go decisions, So that downstream scope is informed.

**Acceptance Criteria:**
- **Given** EXP1 (migration dry-run on one agent) **When** run **Then** go/no-go logged with "what this changed downstream" statement (FR33, FR34)
- **Given** EXP2 (marketplace PR pathfinder) **When** submitted **Then** process feedback captured, go/no-go logged (FR33, FR34)

### Story 5A.2: Create strategic ADR and playbook outline

As a future maintainer, I want the BMAD coupling decision documented and the release playbook started, So that v6.4+ adoption has a template.

**Acceptance Criteria:**
- **Given** `docs/adr/adr-bmad-coupling-v4.0.md` **When** created **Then** contains decision, ≥2 alternatives, revalidation trigger + owner, PRD link (FR35, M15)
- **Given** `host-framework-sync-playbook.md` **When** initialized **Then** contains release class definition, trigger criteria, workstream template outline (FR31)
- **And** playbook completed in Sprint 5 with validation battery ref, known-pitfalls, Winston sign-off (FR32, M13)

---

## Epic 5B: Release Communication & Learning

### Story 5B.1: Author and validate CHANGELOG

As an existing user, I want an honest, trustworthy CHANGELOG, So that I understand what changed and can decide to upgrade.

**Acceptance Criteria:**
- **Given** draft from `convoke-announcement-4.0-draft.md` **When** CHANGELOG authored **Then** `mostHonestOneLineSummary` verbatim, Sophia's section order followed (FR41)
- **And** grep-tested: zero cliché violations (FR42), zero `internalOnly` phrases in user-facing text (FR43)
- **And** maintainer sign-off recorded in release commit message (FR44, M16)

### Story 5B.2: Run retrospective and create anti-pattern registry

As a maintainer, I want the retrospective to capture what we learned and create a standing anti-pattern registry, So that future releases benefit.

**Acceptance Criteria:**
- **Given** scheduled retrospective **When** run **Then** each innovation hypothesis (I1, S1, S3, I3, I5, S2, L1) gets PASS/FAIL/DEFERRED status recorded as a YAML table in the retrospective artifact (hypothesis, status, observation) (FR49, NFR25)
- **And** `convoke-anti-patterns.md` created with observations from 4.0 (FR48)
- **And** findings feed `convoke-note-initiatives-backlog.md` as new/updated items with provenance (FR50)

### Story 5B.3: Complete playbook and ship release artifacts

As a maintainer, I want the playbook finalized and all release artifacts shipped, So that 4.0 is officially live.

**Acceptance Criteria:**
- **Given** `host-framework-sync-playbook.md` outline (from 5A.2) **When** completed **Then** includes validation battery reference, known-pitfalls, Winston sign-off (FR32, M13)
- **And** release tagged, GitHub release created, npm published

---

## Story Summary (Consolidated)

| Epic | Stories | FRs | Sprint |
|------|---------|-----|--------|
| **1A** Config Migration | 6 | FR1–FR11 | 1–3 |
| **1B** Agent Consolidation | 3 | FR26–FR30 | 2–3 |
| **2** Custom Skills | 4 | FR12–FR18 | 2–3 |
| **3** Marketplace | 5 | FR19–FR25 | 4 |
| **4** Validation | 5 | FR36–FR40, FR45–FR46 | 4–5 |
| **5A** Experiments & ADR | 2 | FR31–FR35 | 1 |
| **5B** Communication & Learning | 3 | FR41–FR44, FR47–FR50 | 5 |
| **Total** | **28** | **50/50 FRs** | **Sprints 1–5** |

*Note: 28 stories (one more than the 27 projected — Story 5B.3 was added to cover playbook completion + release ship, which was implicit in the 27 count but deserved its own story.)*

**Pre-work items (not stories):** bmad-init audit (blocks 1A.2), CLI scriptability spike (informs 4.2/4.3), schedule retrospective (Sprint 0).

**50/50 FRs covered. 33 NFRs mapped as ACs. 3 story flags (PR5-4/5/6) addressed. Sustainable pace: ~5.6 stories/sprint.**
