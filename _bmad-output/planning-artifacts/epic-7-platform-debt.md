---
artifact_type: epic
initiative: convoke
created: 2026-04-08
schema_version: 1
status: active
inputDocuments:
  - _bmad-output/planning-artifacts/initiatives-backlog.md
  - _bmad-output/implementation-artifacts/ag-epic-6-retro-2026-04-08.md
---

# Epic 7 — Cross-Cutting Platform Debt

## Overview

Epic 7 addresses cross-cutting platform debt surfaced by the Epic 6 retrospective when wiring the new `_bmad/bme/_artifacts/` submodule alongside the existing Enhance and team-factory modules. Epic 6 made these issues *visible* by adding the second module that follows the Enhance/standalone pattern; it didn't create them. This epic closes them in one focused pass before they multiply across future modules.

**Source documents:**
- [`ag-epic-6-retro-2026-04-08.md`](../implementation-artifacts/ag-epic-6-retro-2026-04-08.md) — surfaced the cross-cutting debt and authorized this epic
- [`initiatives-backlog.md`](initiatives-backlog.md) — RICE-scored items I29, I30, I31, I32, I34, I10 (after triage on 2026-04-08)

**Why now:** Five of the items belong to a single code-path family — refresh-installation/validator/doctor contracts and YAML safety on config writes. Fixing them one-by-one across future feature epics would mean retrofitting each fix into three different modules. Doing them in one focused epic is cheaper and prevents the next platform-debt cluster from forming on top of unfixed foundations.

**Stakeholder:** Platform maintainers (operators of `convoke-update`, `convoke-doctor`, and anyone authoring new bme submodules).

## Requirements Inventory

Epic 7 has no formal PRD because its requirements are already documented as RICE-scored backlog items. The "FRs" below restate the backlog item descriptions in functional-requirement form for traceability.

### Functional Requirements

FR1: When `refresh-installation.js` stamps a module config's `version` field, it MUST guard against `getPackageVersion()` returning `undefined` and fail loudly with a clear error rather than silently writing `version: null`. *(Source: I30, score 9.6)*

FR2: When `refresh-installation.js` stamps a module config's `version` field OR when team-factory's `appendConfigAgent`/`appendConfigWorkflow` mutate config files, the operation MUST preserve YAML comments — not strip them via `yaml.load → mutate → yaml.dump`. *(Source: I29 + I10, combined score ~2.1)*

FR3: When `convoke-doctor` runs its per-module checks, it MUST verify that every workflow declared in `{module}/config.yaml` has a corresponding skill wrapper at `.claude/skills/{workflow.name}/SKILL.md`. *(Source: I31, score 3.2)*

FR4: An audit document MUST exist that lists every flag-gated refresh path in the install pipeline (Enhance `target_agent`, Artifacts `standalone`, Gyre flags, team-factory submodule wiring) and verifies whether the corresponding validator respects the same gate. *(Source: I34, score 2.4)*

FR5: When a workflow is removed from `_artifacts/config.yaml` or `_enhance/config.yaml`, the next `convoke-update` MUST detect and remove its orphaned skill wrapper at `.claude/skills/{workflow.name}/`. *(Source: I32, score 1.0)*

### Non-Functional Requirements

NFR1: All Epic 7 changes MUST be append-only on `refresh-installation.js`, `validator.js`, and `convoke-doctor.js` — existing module sections (Vortex, Gyre, team-factory, Enhance, Artifacts) are untouched except where the audit (FR4) explicitly identifies a contract gap requiring patching.

NFR2: Every Epic 7 story MUST run `npm run check` (5 stages) before being marked for review. Zero CI failures across the epic, continuing the Epic 5+6 streak.

NFR3: Every Epic 7 story MUST be code-reviewed adversarially using `bmad-code-review` (Blind Hunter + Edge Case Hunter + Acceptance Auditor) before merge. No exceptions — Epic 6 proved the value when Story 6.6's review caught the standalone-flag contract gap that motivated FR4.

NFR4: Epic 7 stories MUST follow the `feedback_namespace_audit` rule from Epic 6 — every story that creates new files under `_bmad/{module}/` or `.claude/skills/` includes a "Namespace decision" rationale section.

NFR5: Comment-preserving YAML library evaluation (FR2) MUST happen before story implementation begins — a single library decision applied across both refresh-installation.js and team-factory's config-appender.js. No two-library outcome.

### Additional Requirements (from existing architecture)

- **Validator/refresh contract pattern:** Per Story 6.6's lesson, every refresh-installation flag-gate (e.g., `if (workflow.standalone !== true) continue`) MUST have a corresponding validator branch that respects the same gate. Failure to do so creates latent future-traps. FR3 + FR4 jointly enforce this.
- **Refresh-installation section ordering:** New module-aware logic (FR3, FR5) lives in section 6+ of `refresh-installation.js` because `skillsDir` is defined late in the file. Mirror the Enhance/Artifacts split (config/copy in section 2, skill-wrapper logic in section 6).
- **Doctor auto-discovery:** `convoke-doctor` already discovers modules via `_bmad/bme/*/config.yaml` scan. FR3 plugs into the existing per-module check loop at [`scripts/convoke-doctor.js:60-65`](../../scripts/convoke-doctor.js#L60-L65). No new discovery code required.

### FR Coverage Map

| Story | FRs | NFRs | Source backlog items |
|-------|-----|------|---------------------|
| 7.1 Version stamp safety + YAML comment preservation | FR1, FR2 | NFR1, NFR2, NFR3, NFR5 | I30 (9.6), I29 (1.2), I10 (0.9) |
| 7.2 Doctor skill-wrapper validation | FR3 | NFR1, NFR2, NFR3 | I31 (3.2) |
| 7.3 Validator/refresh contract audit | FR4 | NFR2, NFR3 | I34 (2.4) |
| 7.4 Orphan skill-wrapper cleanup | FR5 | NFR1, NFR2, NFR3 | I32 (1.0) |

**Total:** 5 FRs, 5 NFRs, 4 stories, 6 backlog items closed.

## Epic List

### Epic 7: Cross-Cutting Platform Debt
Close the validator/refresh/doctor contract gaps and YAML-safety issues that Epic 6 surfaced when adding the `_artifacts` submodule. Prevent the next debt cluster from forming on top of unfixed foundations.

**Backlog items closed:** I29, I30, I31, I32, I34, I10 (6 items)
**Standalone value:** Operators get reliable version stamps, doctor catches partial installs, comment-documented configs survive updates, and orphaned skill wrappers self-clean. Future bme submodules inherit a verified contract.
**Depends on:** Epic 6 (shipped)
**Defers to backlog:** I33 (namespace collision, score 0.4) — defer until I32 forces the ownership question. I17–I28 minus the 6 fixed (UX polish, opportunistic uptake).

---

**Delivery order:** Story 7.1 → 7.2 → 7.3 → 7.4. Story 7.1 first because the version-stamp guard (FR1) is the highest-leverage item in the entire backlog (I30 = 9.6) and the YAML library decision (FR2 + NFR5) affects every later story.

---

## Epic 7: Cross-Cutting Platform Debt

### Story 7.1: Version Stamp Safety & YAML Comment Preservation

As a Convoke maintainer publishing platform updates,
I want module config version stamps to be safe (guarded against undefined) and non-destructive (comments preserved),
So that `convoke-update` cannot silently corrupt installed configs and YAML documentation comments survive every install.

**Acceptance Criteria:**

**Given** `getPackageVersion()` returns `undefined` (corrupt or missing `package.json`)
**When** `refresh-installation.js` reaches the Enhance version-stamp block (line ~148-151) or the Artifacts version-stamp block (line ~253-256)
**Then** the function throws a clear error like `Refresh: cannot stamp config — getPackageVersion() returned undefined; check package.json` BEFORE writing anything to disk
**And** the partially-written config (if any) is left untouched
**And** an integration test verifies the throw path with a temp project that has a malformed package.json

**And Given** an installed `_bmad/bme/_artifacts/config.yaml` containing the documentation comment about `standalone: true` (lines 4-8)
**When** `convoke-update` runs and the version stamp is rewritten
**Then** the comment lines are preserved byte-for-byte after the stamp
**And** the same guarantee holds for `_bmad/bme/_enhance/config.yaml` (Enhance-specific comments) and any future `_bmad/bme/{module}/config.yaml`

**And Given** team-factory's `appendConfigAgent()` and `appendConfigWorkflow()` in `_bmad/bme/_team-factory/lib/writers/config-appender.js`
**When** they mutate a target module's `config.yaml`
**Then** existing YAML comments in that file are preserved (closes I10)
**And** the same comment-preserving YAML library is used by both `refresh-installation.js` and `config-appender.js` (NFR5: single library decision)

**And Given** the Epic 6 retro identified `yaml` package CST mode as a candidate
**When** the library evaluation happens BEFORE story implementation starts
**Then** the chosen library is documented in the story's Dev Notes with rationale (size, maintenance status, CST or text-stamp approach)
**And** if no suitable library exists, the fallback is a text-level regex stamper that finds the `version:` line and rewrites only that line

**And Given** all 5 stages of `npm run check` (lint, unit, integration, jest lib, coverage)
**When** Story 7.1 is marked for review
**Then** all 5 stages pass
**And** new tests cover: (a) the undefined-version throw path, (b) comment preservation across refresh-installation in temp project, (c) comment preservation across team-factory append in temp project, (d) the chosen library's round-trip identity on representative configs

**Backlog items closed:** I30, I29, I10
**Files touched:** `scripts/update/lib/refresh-installation.js`, `_bmad/bme/_team-factory/lib/writers/config-appender.js`, `package.json` (new dep), `tests/unit/refresh-installation-*.test.js`, `tests/team-factory/config-appender.test.js`

---

### Story 7.2: Doctor Skill-Wrapper Validation

As a Convoke operator running `convoke-doctor` after an install,
I want the doctor to verify every declared workflow has its skill wrapper installed,
So that partial installs (e.g., source tree copied but `.claude/skills/` failed) cannot be reported as healthy.

**Acceptance Criteria:**

**Given** `convoke-doctor` discovers modules via `_bmad/bme/*/config.yaml` scan
**When** it runs the per-module check loop at [`scripts/convoke-doctor.js:60-65`](../../scripts/convoke-doctor.js#L60-L65)
**Then** for each module with a non-empty `config.workflows` array, the doctor calls a new `checkModuleSkillWrappers(mod)` function
**And** `checkModuleSkillWrappers` walks `mod.config.workflows`, derives the canonical wrapper path (matching the wrapper-path convention each module uses — `bmad-enhance-${name}` for Enhance, `${name}` verbatim for Artifacts), and verifies `{projectRoot}/.claude/skills/{wrapperName}/SKILL.md` exists
**And** missing wrappers produce a per-workflow failure with clear `error: "Missing skill wrapper for {workflow.name}: .claude/skills/{wrapperName}/SKILL.md"` and `fix: "Run convoke-update"`

**And Given** an `_artifacts` install where `_bmad/bme/_artifacts/` is present and complete but `.claude/skills/bmad-migrate-artifacts/SKILL.md` was deleted manually
**When** `convoke-doctor` runs
**Then** the doctor reports: ✗ `_artifacts skill wrappers — Missing skill wrapper for bmad-migrate-artifacts`
**And** does NOT report the module as healthy

**And Given** a workflow-only module like `_artifacts` and an agent-only module like a hypothetical future `_foo`
**When** `checkModuleSkillWrappers` runs against both
**Then** workflow-only modules check workflow wrappers; agent-only modules check agent wrappers (already covered by `checkModuleAgents` — do NOT duplicate); modules with both check both
**And** modules with neither (config exists but is empty) produce neither check (gated like the existing `checkModuleAgents` and `checkModuleWorkflows`)

**And Given** the wrapper-path convention varies by module (Enhance prefixes, Artifacts uses verbatim)
**When** `checkModuleSkillWrappers` derives the path
**Then** the convention is read from a per-module hint, not hardcoded — either via a `wrapper_prefix` field in the module's `config.yaml` (default empty = verbatim) OR via a lookup table in convoke-doctor.js with module-name keys
**And** the chosen approach is documented in the story's Dev Notes (see Story 7.3 for the audit that would surface other gaps in this same area)

**And Given** all 5 stages of `npm run check`
**When** Story 7.2 is marked for review
**Then** all 5 stages pass
**And** new tests cover: (a) healthy install (all wrappers present), (b) missing wrapper for an Artifacts workflow, (c) missing wrapper for an Enhance workflow (different naming convention), (d) workflow-only module, (e) agent-only module (no false-positive workflow check)

**Backlog item closed:** I31
**Files touched:** `scripts/convoke-doctor.js`, `tests/unit/convoke-doctor.test.js` (or similar)

---

### Story 7.3: Validator/Refresh Contract Audit

As a Convoke maintainer planning future bme submodules,
I want a documented audit of every flag-gated refresh path and whether the validator respects the same gate,
So that the next module I add doesn't inherit a latent contract gap like the Story 6.6 standalone-flag bug.

**Acceptance Criteria:**

**Given** the install pipeline contains 4+ module wirings (Vortex, Gyre, Enhance, Artifacts, team-factory) and an unknown number of flag-gated branches in `refresh-installation.js`
**When** the audit is performed
**Then** the output is a single document at `_bmad-output/planning-artifacts/audit-validator-refresh-contracts-2026-04-08.md` that lists, for every flag-gated branch in `refresh-installation.js`:
- The flag name (e.g., `workflow.standalone`, `workflow.target_agent`, EXTRA_BME_AGENTS submodule presence, isSameRoot)
- The file location (`refresh-installation.js:LINE`)
- What the refresh logic does in the gated and ungated branches
- Whether the corresponding validator (`validator.js`) checks the same gate
- **Verdict:** SAFE (validator respects gate), GAP (validator doesn't check the gate — latent future-trap), or N/A (no validator check needed)
- For each GAP, a recommended fix (typically a one-line skip in the validator branch)

**And Given** the audit identifies a GAP
**When** the maintainer reads the document
**Then** the GAP entry includes a code snippet showing the fix and a test case sketch demonstrating the failure mode

**And Given** the audit is purely discovery (no code changes required)
**When** Story 7.3 is marked for review
**Then** the audit doc exists and is complete
**And** all GAPs are either fixed in this story (if trivial — single-file 1-3 line patches) OR promoted to a follow-up story in the backlog with their own RICE score
**And** the document is added to the planning-artifacts index

**And Given** the doctor wrapper validation from Story 7.2 is now in place
**When** the audit reviews `convoke-doctor.js` per-module checks
**Then** it cross-references the new `checkModuleSkillWrappers` function and verifies it covers all module pairs identified in the audit
**And** any module pair where the doctor doesn't yet check wrappers is flagged as a follow-up

**And Given** all 5 stages of `npm run check`
**When** Story 7.3 is marked for review
**Then** all 5 stages pass (the audit is mostly documentation; only trivial GAP fixes touch code)
**And** if any GAP fixes are applied, regression tests are added for each

**Backlog item closed:** I34
**Files touched:** `_bmad-output/planning-artifacts/audit-validator-refresh-contracts-2026-04-08.md` (new), possibly small patches to `scripts/update/lib/validator.js` and `scripts/update/lib/refresh-installation.js` if trivial GAPs surface

---

### Story 7.4: Orphan Skill-Wrapper Cleanup

As a Convoke maintainer who removes a workflow from `_artifacts/config.yaml` or `_enhance/config.yaml`,
I want the next `convoke-update` to detect and remove the orphaned skill wrapper at `.claude/skills/`,
So that stale wrappers don't accumulate and operators don't see slash commands for workflows that no longer exist.

**Acceptance Criteria:**

**Given** `_bmad/bme/_artifacts/config.yaml` declares 2 workflows (`bmad-migrate-artifacts`, `bmad-portfolio-status`) and `.claude/skills/` contains both
**When** the operator removes `bmad-portfolio-status` from the config
**And** runs `convoke-update`
**Then** `.claude/skills/bmad-portfolio-status/` is removed entirely
**And** `.claude/skills/bmad-migrate-artifacts/` is preserved
**And** the change is logged in the changes array as `Removed orphan skill wrapper: bmad-portfolio-status`

**And Given** the existing agent stale-skill sweep at [`refresh-installation.js:553-567`](../../scripts/update/lib/refresh-installation.js#L553-L567) handles `bmad-agent-bme-*` directories
**When** Story 7.4 implementation adds an analogous workflow-wrapper sweep
**Then** the new sweep computes the union of installed workflows: `enhanceConfig.workflows ∪ artifactsConfig.workflows ∪ (any future module workflows)`
**And** for each `.claude/skills/` directory whose name matches a workflow-wrapper convention (Enhance prefix, Artifacts verbatim, or any other module's convention identified by Story 7.3's audit), it checks whether the directory's wrapper name is in the union
**And** if not in the union, the directory is removed
**And** the sweep does NOT touch `.claude/skills/bmad-agent-bme-*` directories (those are handled by the existing agent sweep)

**And Given** I33 (namespace collision risk, deferred to backlog at score 0.4) was identified as the *prerequisite* for safe orphan cleanup
**When** Story 7.4 is implemented
**Then** the orphan sweep is conservative: it ONLY removes wrappers whose name matches one of the known module conventions documented in Story 7.3's audit
**And** wrappers whose origin is unknown (potential third-party installs) are LEFT ALONE
**And** the conservative behavior is documented in the changes log as `Skipped potential third-party wrapper: {name}` for any unknown wrapper observed

**And Given** the cleanup is destructive
**When** Story 7.4 is implemented
**Then** an integration test seeds a temp project with: (a) live wrappers matching current configs, (b) an orphan wrapper from a removed workflow, (c) a hypothetical third-party wrapper with an unrecognized name
**And** the test verifies after `refreshInstallation()`: (a) live wrappers preserved, (b) orphan removed, (c) third-party left alone

**And Given** all 5 stages of `npm run check`
**When** Story 7.4 is marked for review
**Then** all 5 stages pass
**And** new tests cover: (a) orphan detection, (b) removal, (c) preservation of live wrappers, (d) preservation of unknown-origin wrappers, (e) idempotency (running twice doesn't error)

**Backlog item closed:** I32
**Backlog item NOT closed (intentional):** I33 — handled by the conservative-removal policy in this story; full namespace solution remains deferred
**Files touched:** `scripts/update/lib/refresh-installation.js` (new sweep block in section 6+), `tests/unit/refresh-installation-orphan-cleanup.test.js` (new)

---

## Epic 7 Completion Criteria

Epic 7 is complete when:

1. All 4 stories are marked `done` in `sprint-status.yaml`
2. Backlog items I29, I30, I31, I32, I34, I10 are moved to the `## Completed` section of `initiatives-backlog.md`
3. The audit document from Story 7.3 exists and is referenced from this epic file
4. `npm run check` passes on the final commit
5. `convoke-doctor` reports green on the dev repo (the existing version-consistency drift on `_enhance: 1.0.0`, `_gyre: 1.0.0`, `_artifacts: 1.0.0`, `_team-factory: 1.0.0` is pre-existing and out of scope for Epic 7)
6. The Epic 7 retrospective is run via `bmad-retrospective`

## Out of Scope

- **I33 (workflow-name namespace collision):** Deferred to backlog at score 0.4. Story 7.4's conservative-removal policy mitigates the immediate risk; full namespace solution remains deferred.
- **I17–I28 minus the items closed:** UX polish and optimization items remain in the backlog for opportunistic uptake. Not part of Epic 7's scope.
- **New module wiring:** Epic 7 is purely a debt-closure epic. No new bme submodules, no new agents, no new workflows.
- **PRD/Architecture rewrites:** Epic 7 is small enough that the existing PRD (`prd-artifact-governance-portfolio.md`) and architecture (`arch-artifact-governance-portfolio.md`) need no updates.

## Notes for Story Creation

When `bmad-create-story` is run for each Epic 7 story:

- Story 7.1's spec MUST include the YAML library evaluation as a Task 0 (decide before code is touched)
- Story 7.3's audit document is the *primary deliverable* — the story is mostly research, not code. ACs should be calibrated accordingly.
- Story 7.4's conservative-removal policy depends on Story 7.3's audit being complete first, OR the dev needs to inline the convention discovery into Story 7.4 itself. Recommend the former (sequence: 7.1 → 7.2 → 7.3 → 7.4).
- All four stories MUST cite this epic file in their `## Dev Notes → ### References` section.
