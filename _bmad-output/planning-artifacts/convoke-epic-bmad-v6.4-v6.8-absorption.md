---
stepsCompleted:
  - step-01-validate-prerequisites
  - step-02-design-epics
  - step-03-create-stories
  - step-04-final-validation
inputDocuments:
  - _bmad-output/planning-artifacts/convoke-prd-bmad-v6.4-v6.8-absorption.md
  - _bmad-output/planning-artifacts/convoke-arch-bmad-v6.4-v6.8-absorption.md
initiative: convoke
artifact_type: epic
qualifier: bmad-v6.4-v6.8-absorption
related_initiative: I113
related_prd: convoke-prd-bmad-v6.4-v6.8-absorption.md
related_arch: convoke-arch-bmad-v6.4-v6.8-absorption.md
status: complete
epics: 4
stories: 20
created: '2026-06-21'
schema_version: 1
---

# Convoke v4.1 (Upstream BMAD v6.4–v6.8 Absorption) - Epic Breakdown

## Overview

This document provides the epic and story breakdown for Convoke v4.1, decomposing the PRD requirements and Architecture decisions (AD1–AD9) into implementable stories. **Scope: MVP (E2+E4+E7) + Phase-2 (E1).** The v4.2 capability spikes (E3/E5/E6) are out of scope — their epics are authored when those spikes qualify. The whole initiative is `depends: I97 close (v4.0 ship)` — these epics are commitment-locking plan-ahead, not implementation-ready.

## Requirements Inventory

### Functional Requirements

**Currency Management (E4)**
- FR1: An operator can pin Convoke to a chosen BMAD compat-floor.
- FR2: An operator can opt into a newer upstream channel independently of their pinned floor.
- FR3: An operator can select a default channel that Convoke tracks automatically (set-and-forget).
- FR4: An operator can view which channel and floor they are currently on.
- FR5: An operator can perform channel/floor operations through Convoke's conversational skill surface.
- FR25: The system validates a chosen channel/floor combination and warns or refuses on an incompatible selection.

**Upstream Absorption & Cadence (E4 + N-cadence policy)**
- FR6: The system can classify an upstream update as declaration-only, conformance-required, or breaking (the absorption ternary).
- FR7: An operator can absorb a compat-only upstream update with no Convoke code change. *(Class A — declaration-only.)*
- FR8: The system applies a defined breaking-change protocol when an upstream change is breaking.
- FR9: Convoke publishes a binding N-cadence policy declaring its maximum compat-floor lag.
- FR10: The maintainer can record the v4.1 absorption effort as a reusable baseline for future cadence comparison.
- FR24: The system surfaces a warning when Convoke's compat-floor lag exceeds the N-cadence policy cap.

**Schema Conformance & Migration (E2)**
- FR11: The system migrates Convoke modules' module-help schema to the v6.7 field convention (`after`/`before` → `preceded-by`/`followed-by`).
- FR12: An operator's installed Convoke is migrated to the new schema on update without manual edits.
- FR13: When a migration cannot apply cleanly, the operator receives a next-action message, not a bare error (OC-R6).
- FR14: The system verifies behavioral parity across agents after a schema or channel change.

**Operator Covenant Enforcement (E7)**
- FR15: A Convoke skill halts and waits for the operator at every OC-R5 decision point.
- FR16: A Convoke skill's agent self-confirms each activation step executed before beginning the main workflow.
- FR17: The system enumerates all `_bmad/bme/` pause-point skills mechanically to define enforcement coverage.
- FR18: The Covenant compliance audit can be re-run with the baseline method to confirm ≥ 82% (no regression).
- FR26: The system flags a `_bmad/bme/` skill that lacks OC-R5 self-confirm enforcement (authoring-time durability check).

**Marketplace Distribution & Discoverability (E1 — Phase-2)**
- FR19: Convoke is structured per the marketplace structural contract (`skills/` at root + `module.yaml` + `module-help.csv`).
- FR20: Convoke declares a `plugin_name` distinct from its internal module code.
- FR21: An operator can install Convoke via a documented BYO-URL path when a marketplace listing is unavailable.
- FR22: A standalone operator can submit a demand signal/request through a documented, low-friction path reachable outside the dev loop.

**Re-engagement & Recovery (E4 migration)**
- FR23: A lapsed or forked operator can re-enter on a pinned floor via a documented migration path.

### NonFunctional Requirements

- NFR1 (Parity): 0 operator-facing regressions across the 5 classes; PF1-style battery covers all in-scope agents (source-enumerated).
- NFR2 (Compat-floor): declares/honors ≤ N-3 compat-floor (binding policy); v6.3+ source format must not regress.
- NFR3 (Marketplace structural): repo satisfies the structural contract mechanically AND BYO-URL install verified end-to-end.
- NFR4 (Recoverable migrations): idempotent with a verified recovery path; never partially-written.
- NFR5 (Soft-warn preflight): stderr WARNINGs, exit 0, never block.
- NFR6 (Blast-radius): E2/E4 ship migrations + parity; additive changes don't mutate installs.
- NFR7 (Path-safety): user-path ops resolve+normalize+contains-check; refuse outside project root.
- NFR8 (No hardcoded versions/secrets): versions via `getPackageVersion()`; no credentials; dependency hygiene.
- NFR9 (Allowlist input validation): channel/pin/CSV inputs validated against an allowlist pattern; CSV-injection prefix.
- NFR10 (Currency cost, class-dependent): Class A → 0 source/logic change; Class B → bounded mechanical edits; Class C → protocol. Effort captured as baseline (defined unit).
- NFR11 (Covenant floor): ≥ 82% (baseline method); new `_bmad/bme/` skills pass covenant-compliance checklist (no FAIL cells).
- NFR12 (Cadence observability): system reports current floor, declared cap, actual lag, last-absorption — inspectable + logged.
- NFR13 (Performance): operator ops indicative-budgeted (reported, not gated); CI battery+audit within a declared ceiling (gate); no op regresses > 2× vs baseline (gate).
- NFR14 (Engineering discipline): derive-counts-from-source; delta-only migrations; no `process.cwd`; lint-clean; verification-pipefail; namespace decision recorded.

### Additional Requirements

*From Architecture (AD1–AD9 + cross-cutting):*
- **No starter template (brownfield).** First implementation story = "extend `scripts/update/lib/` with the cadence module," NOT a project init.
- **AD1 Cadence state** in `_bmad/_config/cadence.yaml` (fields: `channel`, `pinned_floor`, `declared_ceiling`, `policy_cap`, `last_absorption`), read via config-loader, never hardcoded.
- **AD2 Ternary classifier** — MVP: assisted operator-declaration with safety asymmetry (conservative default; under-classification requires explicit override). Contract-diff probe = v4.1.x fast-follow.
- **AD3 Migration-safety contract** — all install-touching ops (E2, E4 channel/breaking, FR23) route through one backup→path-safety-guard→idempotency→apply→verify/recover wrapper. **Caveat: verify `migration-runner` is not forward-only; if so, the wrapper is a new opt-in component.**
- **AD4 Covenant enforcement** — per ADR-001 (agent-internal self-confirm extended to OC-R5); authoring-time check CI-gated. **Caveat: decide validator-rule vs sibling checker (content-semantic).**
- **AD5 Compat-surface audit** — gates the Class-A declaration-bump path (under-classification backstop).
- **AD6 N-cadence policy** = governed markdown artifact + breaking-change protocol; cap-breach soft-warn at preflight; `convoke-cadence status` for observability.
- **AD7 Slash-command surface** — `bmad-cadence` skill wrapping `convoke-cadence` CLI (skill-wraps-tested-CLI pattern).
- **AD8 Concurrency** — `cadence.yaml` writes use the `_withCsvLock` advisory-lock pattern.
- **AD9 Baseline capture** — structured per-absorption record (class, files-touched, effort).
- **Implementation sequence (from Architecture):** AD1 → AD8 → AD3 → AD2+AD6+AD9 → AD7 → AD4/AD5. **E7 (AD4) `sequence-after` Epic 1B.**
- **Schema/naming locks** (cadence.yaml fields; class identifiers `declaration-only`/`conformance-required`/`breaking` in shared constants; CLI `convoke-cadence`, skill `bmad-cadence`).
- **Reuse:** `migration-runner`, `refresh-installation`, `validator`, `config-merger`, `_withCsvLock`, `test-constants.js`.

### UX Design Requirements

None — no UI; Convoke is content + CLI/slash-command tooling.

### FR Coverage Map

- FR1-10, FR23, FR24, FR25 → **Epic 1** (Managed Currency)
- FR11-14 → **Epic 2** (Schema Conformance)
- FR15-18, FR26 → **Epic 3** (Enforced Covenant)
- FR19-22 → **Epic 4** (Marketplace — Phase-2)

*All 26 FRs mapped. Dependencies flow backward only. MVP = Epics 1-3; Phase-2 = Epic 4.*

## Epic List

### Epic 1: Managed Currency & the Cadence Floor *(E4 — MVP)*
Operators gain control over their BMAD currency: pin a compat-floor, choose a channel (incl. set-and-forget default), see cadence state (floor/cap/lag/last-absorption), receive cap-breach warnings, classify and absorb upstream updates (Class A zero-code / B mechanical / C protocol), and re-enter from an ancient pin or fork. The binding N-cadence policy is published.
**FRs covered:** FR1, FR2, FR3, FR4, FR5, FR6, FR7, FR8, FR9, FR10, FR23, FR24, FR25
**Story sequence (per architecture):** AD1 state → AD8 lock → **AD3 migration-safety (explicit early SHARED story — Epic 2 depends on it)** → AD2 classifier + AD5 audit + AD6 policy/observability + AD9 baseline → AD7 slash surface.

### Epic 2: Schema Conformance Absorption *(E2 — MVP)*
Operators' installs stay conformant to upstream's v6.7 module-help schema — migrated cleanly, with behavioral-parity verification and Covenant-compliant (OC-R6) failure messaging.
**FRs covered:** FR11, FR12, FR13, FR14
**Dependency:** declares **Epic 1's AD3 migration-safety contract**. The first concrete **Class-B** absorption; captures the first baseline entry.

### Epic 3: Enforced Operator Covenant *(E7 — MVP, the differentiator)*
Operators never silently lose a decision: every Convoke skill halts at OC-R5 pause points and self-confirms each activation step; new `_bmad/bme/` skills cannot ship without enforcement.
**FRs covered:** FR15, FR16, FR17, FR18, FR26
**⚠ Flag:** `blocked-on: external Epic 1B` (v4.0.1 Amelia consolidation — specs unauthored, deferred). `sequence-after` Epic 1B to avoid double-touching activation sequences. **Recommend: sequence E7 LAST among MVP epics, OR run a small decoupling spike** to confirm whether the 1B gate is hard or soft.

### Epic 4: Marketplace Discoverability *(E1 — Phase-2 fast-follow)*
Operators discover and install Convoke via the marketplace (or the verified BYO-URL floor); standalone operators can signal demand for capabilities like Web Bundles.
**FRs covered:** FR19, FR20, FR21, FR22
**Note:** Phase-2 — async marketplace submit (ship MVP regardless of `bmadcode` latency); inherits I97's 5 ADRs; does not gate the MVP.

## Epic 1: Managed Currency & the Cadence Floor

Operators gain control over their BMAD currency and the defensive floor is established. *(MVP. Stories sequenced per architecture: AD1→AD8→AD3→AD2+AD6+AD9→AD7.)*

### Story 1.1: Cadence state with advisory-locked writes

As the system,
I want cadence state stored in `_bmad/_config/cadence.yaml` and read via the config-loader, with all writes serialized through an advisory lock,
So that currency state is data (not logic) and safe under concurrent access.

**Acceptance Criteria:**

**Given** a fresh install **When** cadence state is read **Then** `channel`, `pinned_floor`, `declared_ceiling`, `policy_cap`, and `last_absorption` resolve via the config-loader **And** no value is a hardcoded constant in source.
**Given** two processes writing `cadence.yaml` concurrently **When** they run **Then** writes serialize through the `_withCsvLock` advisory-lock pattern **And** neither read observes a torn file.

### Story 1.2: Migration-safety contract *(SHARED — Epic 2 depends on this)*

As the system,
I want one safety wrapper (backup → path-safety guard → idempotency → apply → verify/recover) through which every install-touching write routes,
So that all mutations are recoverable and cannot escape the project root.

**Acceptance Criteria:**

**Given** a migration that fails midway **When** it is re-run **Then** it converges to the target state (idempotent) **And** never leaves a partially-written install.
**Given** a write targeting a path outside the project root **When** attempted **Then** it is refused (resolve+normalize+contains-check).
**Note:** verify `migration-runner` is not forward-only at implementation; if it is, deliver the contract as a new opt-in component rather than modifying the runner.

### Story 1.3: Pin a floor, select a channel, set a default *(bootstraps the `convoke-cadence` CLI)*

As an operator,
I want to pin a BMAD compat-floor, opt into a channel independently, optionally set a tracked default channel, with incompatible combinations refused,
So that staying current is a safe, deliberate choice.

**Acceptance Criteria:**

**Given** no prior CLI **When** this story is implemented **Then** the `convoke-cadence` CLI entry (arg parsing + dispatch) is established for subsequent subcommands.
**Given** a pinned floor **When** I opt into a newer channel **Then** the channel is recorded independently of the floor (FR1, FR2).
**Given** a default channel is set **When** updates run **Then** Convoke tracks it automatically (FR3).
**Given** a channel/floor combination that is incompatible **When** selected **Then** the system warns or refuses (FR25).

### Story 1.4: N-cadence policy artifact + cap-breach soft-warn

As Convoke,
I want a governed N-cadence policy artifact (declaring `policy_cap` + the breaking-change protocol) and a preflight warning when lag exceeds the cap,
So that the binding lag is published and its breach is visible without blocking.

**Acceptance Criteria:**

**Given** the policy artifact exists **When** read **Then** it declares the maximum compat-floor lag (`policy_cap`) and the breaking-change protocol (FR9).
**Given** actual lag exceeds `policy_cap` **When** preflight runs **Then** a `chalk.yellow` WARNING is emitted to stderr **And** the exit code is 0 (never blocks) (FR24, NFR5).

### Story 1.5: Cadence status / observability

As an operator,
I want a `convoke-cadence status` command reporting my current floor, declared cap, actual lag, and last-absorption,
So that I can see my cadence position at a glance.

**Acceptance Criteria:**

**Given** any cadence state **When** I run `convoke-cadence status` **Then** all four fields render in a fixed, parseable shape (FR4, NFR12).

### Story 1.6: Ternary classifier (assisted) + compat-surface audit gate

As the system,
I want to classify an upstream update as declaration-only / conformance-required / breaking via assisted operator-declaration, with the Class-A path gated by the compat-surface audit,
So that absorption is correctly scoped and under-classification is caught.

**Acceptance Criteria:**

**Given** an uncertain classification **When** the operator declares **Then** the conservative (higher) class is the default **And** lowering it requires an explicit override (FR6, AD2).
**Given** a Class-A (declaration-only) bump **When** the compat-surface audit finds version-specific assumptions in `_bmad/bme/` content (verified with a fixture containing a hardcoded version string) **Then** the bump is blocked (AD5).

### Story 1.7: Absorb a declaration-only update + capture baseline

As an operator,
I want to absorb a declaration-only (Class A) upstream update with zero source/logic change, with each absorption logged,
So that currency is genuinely cheap and the effort is measurable.

**Acceptance Criteria:**

**Given** a fixture Class-A update **When** absorbed **Then** `git diff` touches only manifest/version files — no `scripts/` or `_bmad/bme/` source changes (FR7).
**Given** any absorption **When** it completes **Then** a structured record (`date`, `from_version`, `to_version`, `class`, `files_touched`, `effort`) is appended to the absorption log (FR10, AD9).

### Story 1.8: Breaking-change protocol execution

As the system,
I want a breaking (Class C) upstream change routed to the defined breaking-change protocol,
So that the rare dangerous case is bounded and pre-defined rather than improvised.

**Acceptance Criteria:**

**Given** an update classified as breaking **When** absorption is attempted **Then** the zero-code path is NOT used **And** the breaking-change protocol (from the policy artifact) is invoked (FR8).

### Story 1.9: Fork / ancient-pin re-entry

As a lapsed or forked operator,
I want a documented re-entry path onto a pinned floor,
So that I can rejoin Convoke safely after pinning an ancient version or forking.

**Acceptance Criteria:**

**Given** an ancient pin or a fork **When** I run the re-entry path **Then** I land on a valid pinned floor via the migration-safety contract (FR23).

### Story 1.10: `bmad-cadence` slash-command skill

As an operator,
I want a Covenant-compliant `bmad-cadence` skill wrapping the `convoke-cadence` CLI,
So that currency operations are conversational rather than bare CLI.

**Acceptance Criteria:**

**Given** the `bmad-cadence` skill **When** invoked **Then** it offers defaults, halts at decision points, and gives rationale (passes the covenant-compliance checklist, OC-R0…R7) (FR5, AD7).
**Given** the CLI built across 1.3–1.8 **When** the skill runs **Then** it wraps the tested CLI (no logic duplicated in the skill layer).

## Epic 2: Schema Conformance Absorption

Operators' installs stay conformant to upstream's v6.7 module-help schema. *(MVP. Declares Epic 1's AD3 migration-safety contract. The first concrete Class-B absorption.)*

### Story 2.1: Module-help schema migration

As an operator,
I want my installed Convoke migrated from the `after`/`before` module-help schema to the v6.7 `preceded-by`/`followed-by` convention on update, without manual edits,
So that Convoke stays conformant to upstream's schema.

**Acceptance Criteria:**

**Given** an install on the old schema **When** I update **Then** Convoke modules' `module-help.csv` is migrated to `preceded-by`/`followed-by` (FR11) **And** no manual edits are required (FR12) **And** the migration routes through Epic 1's AD3 safety contract.

### Story 2.2: OC-R6 failure messaging

As an operator,
I want a migration that cannot apply cleanly to tell me what to do next,
So that I am never left with a bare error.

**Acceptance Criteria:**

**Given** a migration that cannot apply **When** it fails **Then** the operator receives a next-action message naming the remedy command (e.g., a recover command), not a bare "failed" (FR13, OC-R6).

### Story 2.3: Behavioral parity verification + baseline entry

As the maintainer,
I want a PF1-style battery confirming zero operator-facing regressions after the schema change, and the absorption recorded as the first baseline entry,
So that the conformance absorption is proven safe and measurable.

**Acceptance Criteria:**

**Given** the schema migration applied **When** the parity battery runs across all in-scope agents (source-enumerated) **Then** zero operator-facing regressions across the 5 classes (FR14, NFR1, MO7).
**Given** the absorption completes **When** logged **Then** it is the first baseline entry (MO2b).

## Epic 3: Enforced Operator Covenant

Operators never silently lose a decision. *(MVP, the differentiator. ⚠ `blocked-on: external Epic 1B` — v4.0.1 Amelia consolidation, specs unauthored. Recommend sequencing LAST among MVP epics OR a decoupling spike to confirm the 1B gate is hard vs soft.)*

### Story 3.1: Enumerate pause-point skills

As the system,
I want the full set of `_bmad/bme/` pause-point skills derived mechanically,
So that enforcement coverage has a verifiable, source-derived denominator.

**Acceptance Criteria:**

**Given** the `_bmad/bme/` tree **When** the enumeration runs **Then** every skill with an OC-R5 pause point is listed (derive-counts-from-source) **And** the list is a reviewable artifact (FR17).

### Story 3.2: OC-R5 enforcement + activation self-confirm retrofit

As an operator,
I want every Convoke skill to halt at OC-R5 decision points and self-confirm each activation step executed,
So that no decision that is mine is silently taken by a short-circuiting agent.

**Acceptance Criteria:**

**Given** an enumerated pause-point skill **When** retrofitted per ADR-001 **Then** the agent self-confirms each activation step before the main workflow (FR16) **And** the skill halts and waits at every OC-R5 decision point (FR15).

### Story 3.3: Authoring-time durability check

As a reviewer,
I want CI to flag any `_bmad/bme/` skill that lacks OC-R5 self-confirm enforcement,
So that E7 is durable and new skills cannot regress it.

**Acceptance Criteria:**

**Given** a `_bmad/bme/` skill lacking OC-R5 enforcement **When** CI runs **Then** it is flagged (FR26). *(Implementation: decide validator-rule vs sibling-checker per AD4 caveat — content-semantic check.)*

### Story 3.4: Covenant compliance re-audit

As the maintainer,
I want the Covenant compliance audit re-run with the baseline method,
So that I can confirm E7 did not regress the differentiator.

**Acceptance Criteria:**

**Given** the post-E7 state **When** the audit re-runs with the identical baseline method **Then** compliance is ≥ 82% **And** no individual Right drops (FR18, NFR11, MO4).

## Epic 4: Marketplace Discoverability *(Phase-2)*

Operators discover and install Convoke via the marketplace or the verified BYO-URL floor. *(Phase-2 fast-follow; async; does not gate the MVP; inherits I97's 5 ADRs.)*

### Story 4.1: Structural restructure + plugin_name

As Convoke,
I want the repo restructured to `skills/` at root with `module.yaml` (declaring a `plugin_name` distinct from the module code) and `module-help.csv`,
So that the marketplace installer accepts the submission.

**Acceptance Criteria:**

**Given** the restructured repo **When** validated **Then** `skills/` is at root, `module.yaml` is valid, `module-help.csv` parses (FR19, NFR3) **And** `plugin_name` (`convoke-agents`) is distinct from the internal module code (FR20).

### Story 4.2: BYO-URL install verified

As an operator,
I want a documented BYO-URL install path that is verified end-to-end,
So that I can install Convoke even when no marketplace listing is available.

**Acceptance Criteria:**

**Given** no marketplace listing **When** I install via the documented BYO-URL path **Then** the install succeeds end-to-end (FR21, MO5). *(BYO-URL is the accepted compat floor; marketplace acceptance is external/unbounded.)*

### Story 4.3: Demand-signal path

As a standalone operator,
I want a low-friction, documented way to request a capability (e.g., a Web Bundle),
So that my demand becomes a signal the maintainer can see — even though I'm outside the dev loop.

**Acceptance Criteria:**

**Given** a standalone operator outside the dev loop **When** they follow the documented request path **Then** the request lands as a signal the maintainer can observe (FR22, MO6 enabler).
