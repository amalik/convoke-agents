---
stepsCompleted:
  - step-01-validate-prerequisites
  - step-02-design-epics
inputDocuments:
  - _bmad-output/planning-artifacts/convoke-prd-initiative-lifecycle-engine.md
  - _bmad-output/planning-artifacts/convoke-arch-initiative-lifecycle-engine.md
  - _bmad-output/planning-artifacts/convoke-brief-initiative-lifecycle-engine.md
  - _bmad-output/planning-artifacts/convoke-brief-initiative-lifecycle-engine-distillate.md
  - _bmad-output/planning-artifacts/convoke-report-implementation-readiness-initiative-lifecycle-engine.md
initiative: convoke
artifact_type: epic
qualifier: initiative-lifecycle-engine
project_name: 'Convoke — Initiative Lifecycle Engine (ILE-1)'
user_name: 'Amalik'
status: draft
created: '2026-04-19'
schema_version: 1
---

# Convoke — Initiative Lifecycle Engine (ILE-1) - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for Convoke — Initiative Lifecycle Engine (ILE-1), decomposing the requirements from the PRD (63 FRs, 36 NFRs) and Architecture (8 ADRs, 24 patterns, complete project tree) into implementable stories. No UX design document exists — ILE-1 is a developer-tool capability layer.

## Requirements Inventory

### Functional Requirements

**Intake, Qualification & Lane Management (FR1–FR13)**

- **FR1**: Users can invoke `bmad-enhance-initiatives-backlog triage` to ingest text input (review transcripts, retros, audit outputs) and extract actionable findings.
- **FR2**: The system logs every extracted finding as an intake in §2.1 of the lifecycle backlog with ID, description, source, date, and raiser.
- **FR3**: Intakes are never removed from §2.1 by any ILE-1 skill operation (append-only preservation of audit trail).
- **FR4**: Authorized qualifiers (Vortex team, John, or Winston) can qualify an intake by assigning a Lane (Bug/Fast/Initiative), a Portfolio attachment, and an initial RICE score.
- **FR5**: Users can mark a finding as RAW (intake only, no lane) when more information is needed before routing.
- **FR6**: The system presents orphan-intake-scan proposals individually per-item, not as batch yes/no, to prevent mis-routing.
- **FR7**: The system detects duplicate findings (semantic similarity against existing backlog items) and surfaces them for user review.
- **FR8**: Users can invoke `bmad-enhance-initiatives-backlog review` to walk initiative-lane items and rescore RICE components.
- **FR9**: Review mode presents prior scoring rationale alongside current values, not just numeric scores.
- **FR10**: Users can invoke `bmad-enhance-initiatives-backlog create` to bootstrap a new lifecycle backlog from scratch.
- **FR11**: The system verifies qualifier authorization before allowing lane/portfolio/RICE assignment; unauthorized users can log intakes but not qualify them.
- **FR12**: The qualifying gate proposes initial lane, portfolio, and RICE values based on finding content; the user confirms or overrides per-item. Proposals are non-binding; accepting is explicit.
- **FR13**: Users can invoke the qualifying gate on previously-logged raw intakes to route them into a lane. The original intake row in §2.1 is updated with lane routing; a new row is not created.

**Portfolio Visibility & Navigation (FR14–FR22)**

- **FR14**: Users can invoke `bmad-portfolio-status` to see a lifecycle-aware view of initiatives with stages, lanes, and WIP signals.
- **FR15**: The portfolio view supports a one-keystroke filter by portfolio attachment (convoke, vortex, gyre, forge, bmm, enhance, loom, helm, or custom).
- **FR16**: The portfolio view supports a filter by staleness-flag state.
- **FR17**: The portfolio view displays an observability-signals summary at the top of the output.
- **FR18**: Users can drill down from a summary signal to its underlying event-level history.
- **FR19**: The portfolio view shows pipeline-completeness indicators (B / P / P✓ / A / IR / E / D) for each initiative.
- **FR20**: The portfolio view renders at consulting scale (60+ initiatives across 10+ portfolios) within the performance SLO.
- **FR21**: Users can return to the portfolio view from a drill-down or review session without re-invoking the portfolio-status skill (session preserves position in parent view).
- **FR22**: When the portfolio view renders more than a threshold number of initiatives (configurable; default 20), the system produces an aggregate summary (counts by lane/stage, signals, top-priority items) before listing individuals.

**Reactive Behaviors & Trust Contract (FR23–FR29)**

- **FR23**: The system detects lifecycle-state-change signals from artifact presence (new PRD, closed epic, sprint closure) and proposes state transitions — it never silently commits.
- **FR24**: For uncertain cases (partial artifact, race condition, moved file, empty-but-present file), the system always requires explicit user confirmation before committing a state transition (propose-before-commit contract).
- **FR25**: The system scans for orphan intakes when a new initiative is logged and proposes attachment to existing items.
- **FR26**: The system detects stale items (> 14 days in the same stage — both qualified lane items and raw intakes included) and flags them in the portfolio view.
- **FR27**: Users can accept or reject proposed state transitions individually.
- **FR28**: Teams can configure artifact validity contracts per their conventions (e.g., "draft PRD counts as Ready only when IR pass is present").
- **FR29**: Individual initiatives can override team-level validity contracts via per-initiative `config:` frontmatter.

**Observability Signals (FR30–FR32)**

- **FR30**: The system computes values for four observability signals from the Change Log and backlog parsing: S1 (reactive misfire rate), S2 (qualifying-gate abandon rate), S3 (backlog entropy), S4 (cross-skill inconsistency).
- **FR31**: When a signal's value crosses a configured threshold (defaults shipped in config; user-overridable), the portfolio view displays a threshold-breach indicator.
- **FR32**: Users can drill down from a signal summary to the event-level history that produced it.

**Shared Data Model, Integration & Governance (FR33–FR40)**

- **FR33**: All three ILE-1 skills read from and write to the same lifecycle backlog file using the same frontmatter schema.
- **FR34**: The system enforces cross-skill round-trip parseability: skill A's output can be read by skill B and re-read by skill A without semantic corruption.
- **FR35**: The lifecycle backlog's Change Log section is append-only at the application layer.
- **FR36**: A second enforcement layer (optional pre-commit hook) catches non-append edits to the Change Log before they are committed to git.
- **FR37**: Every qualifying-gate decision, rescore, or lane move is recorded in the Change Log with qualifier identity and timestamp.
- **FR38**: Concurrent ILE-1 skill invocations against the same backlog are prevented: when a skill is running, any second invocation is refused with a clear error message.
- **FR39**: The system extends `convoke-doctor` to validate ILE-1 schemas and integration contracts.
- **FR40**: The system supports skill portability via the existing Convoke export pipeline, with ILE-1-specific golden-file comparisons per target platform (Claude Code, Copilot, Cursor).

**Onboarding, Help & Error Communication (FR41–FR48)**

- **FR41**: Users invoking the initiatives-backlog skill for the first time see a minimal bootstrap — essential lifecycle process only, not the full canonical text.
- **FR42**: Users can request the full canonical lifecycle process on demand (progressive disclosure).
- **FR43**: Users can invoke contextual help sub-commands at any point in any ILE-1 skill: `explain <concept>`, `why <field>?`, `what does this flag mean?`.
- **FR44**: RICE calibration examples shown during qualification match the user's persona context (OSS-solo vs. enterprise-consulting) rather than a single fixed enterprise-oriented set.
- **FR45**: The system communicates errors with one of four category prefixes: `[USER]`, `[CONFIG]`, `[INTERNAL]`, `[UNCERTAIN]`, each with defined communication semantics.
- **FR46**: Each error carries a registered error code from the seed error-code registry (USER-NNN, CONFIG-NNN, INTERNAL-NNN, UNCERTAIN-NNN).
- **FR47**: Reactive uncertainty is always communicated as a proposal with `[UNCERTAIN]` prefix, never as an error.
- **FR48**: New error codes require a CHANGELOG entry, test fixture producing the error, and category determination — all committed in the same PR.

**Interaction Safety & Recovery (FR49–FR52)**

- **FR49**: Destructive operations (drop intake, archive absorbed item, remove portfolio attachment) require explicit user confirmation in a dedicated confirmation step — no passthrough.
- **FR50**: Users can undo the last qualifying-gate decision within the same session before it is persisted to the backlog file. Once persisted, re-qualification follows the rescore path (FR8).
- **FR51**: Operations exceeding an interactive latency threshold (~2 seconds) display progress indication (spinner, percentage, or stage identifier).
- **FR52**: After any `[USER]` or `[CONFIG]` category error, the system returns the user to the last consistent state (no partial writes committed) and allows retry with corrected input. `[INTERNAL]` errors guide users to doctor-based investigation.

**Schema Evolution, Migration & Lifecycle Completeness (FR53–FR59)**

- **FR53**: The lifecycle backlog frontmatter carries `schema_version` as a monotonically-increasing integer.
- **FR54**: Breaking schema changes (field rename, removal, semantic reinterpretation) bump `schema_version`.
- **FR55**: v1.N skills can read v1.(N-1) backlogs with a deprecation warning; earlier versions require explicit migration.
- **FR56**: Schema migrations run automatically on skill invocation after user confirmation when a version mismatch is detected.
- **FR57**: A non-interactive `--migrate` mode supports CI contexts.
- **FR58**: Users can uninstall ILE-1 via a documented manual procedure; `convoke-doctor` detects partial-removal states and reports diagnostics for cleanup.
- **FR59**: The lifecycle backlog file is preserved across uninstall (user data, never removed).

**Developer Tooling & Debugging (FR60–FR63)**

- **FR60**: Every ILE-1 skill accepts `--verbose` (execution trace) and `--debug` (state dumps) flags.
- **FR61**: The system writes reactive-layer decision logs to a known location with daily rotation, including artifact paths, signal fires, validity check results, proposals made, and user responses.
- **FR62**: Log retention is configurable (default 90 days); users can opt out entirely.
- **FR63**: ILE-1 log-writing code contains no calls to external network endpoints; verifiable via static analysis.

### NonFunctional Requirements

**Performance (NFR1–NFR4)**

- **NFR1**: End-to-end median ILE-1 skill invocation completes within 5s on baseline consulting-scale (60+ initiatives × 10+ portfolios). ILE-1 code alone: < 2s median.
- **NFR2**: End-to-end p99 completes within 15s. ILE-1 code alone: < 5s p99. CI runs isolated code-path benchmark (LLM-excluded).
- **NFR3**: Portfolio view with > 20 initiatives uses summary-first rendering. Threshold configurable.
- **NFR4**: System handles 100+ initiatives with explicit graceful degradation: 100–500 → warn but function (2× SLO OK); 500+ → explicit guidance that performance outside v1 target.

**Security & Privacy (NFR5–NFR8)**

- **NFR5**: Backlog contents never transmitted externally by ILE-1 beyond LLM-agent conversation context. Static-analysis verifiable.
- **NFR6**: No telemetry backend, analytics service, or external update server. Dependency audit on every release.
- **NFR7**: Developer debug logs remain local. No external network endpoints in log-writing modules (static analysis).
- **NFR8**: Scripts accepting user-provided paths for destructive ops perform resolve-normalize-contains-check against project root; refuse paths outside.

**Reliability & Correctness (NFR9–NFR14)**

- **NFR9**: Propose-before-commit contract enforced against all four TAC1 uncertain-case fixtures (partial, race, moved, empty). Zero silent state changes.
- **NFR10**: Data format has no runtime dependency on LLM agent for read access. Backlog + logs remain locally readable via any markdown viewer when LLM is unreachable.
- **NFR11**: Read-only skill invocations are idempotent: same input twice produces identical output.
- **NFR12**: Schema migrations are resume-safe: interruption mid-migration leaves recoverable state; re-invocation completes the migration.
- **NFR13**: All schema-bearing file writes go through atomic-write helper (tmp → verify parse → rename). Static-analysis verifiable: no direct `fs.writeFileSync` into schema files.
- **NFR14**: `[INTERNAL]` category error rate < 1% in any 100-invocation window. Rising rate triggers post-MVP reliability review.

**Maintainability & Extensibility (NFR15–NFR18)**

- **NFR15**: Target < 500 LOC per main script. Exceeding requires PR review justification + decomposition review.
- **NFR16**: Frontmatter schema documented with inline comments in canonical spec. Downstream code references spec for field semantics.
- **NFR17**: Frontmatter schema changes require CHANGELOG entry. Breaking changes require `schema_version` bump + migration.
- **NFR18**: Debug infrastructure enables post-hoc analysis without rebuild/redeploy.

**Compatibility & Interop (NFR19–NFR23)**

- **NFR19**: ILE-1 v1 v6.2/v6.3 compatibility. ADR-6 resolved to **v6.3-gated** — ILE-1 v1 ships in Convoke 4.0+; requires BMAD ≥ 6.3.
- **NFR20**: Backlog survives standard git workflows (merge, rebase, cherry-pick) without corruption. Fixture set at `tests/fixtures/ile-1/git-workflow/{merge-clean,merge-conflict,rebase,cherry-pick}/`.
- **NFR21**: ILE-1 extends `bmad-validate-exports` with schema roundtrip + no fixture-path leaks + golden-file comparison per platform.
- **NFR22**: Node.js support inherited from Convoke core.
- **NFR23**: Cross-skill integration contracts version-matched: `convoke-doctor` checks at install time that all three ILE-1 skills declare same `schema_version`; mismatches = errors.

**Observability & Instrumentation (NFR24–NFR27)**

- **NFR24**: All reactive-layer decisions logged with artifact path, signal fired, validity check result, proposal made, user response. Users can query via `convoke-ile-logs <query>` with filters for initiative, date range, signal type, user-action (accept/reject). **MVP scope**, not Growth.
- **NFR25**: S1–S4 observability signals computable from existing Change Log + backlog parsing. No external instrumentation.
- **NFR26**: Log format stable across v1 patch and minor releases. Breaking log-format changes require CHANGELOG.
- **NFR27**: Each S1–S4 signal must be useful for real-deployment decisions. Month-3 innovation review audits each for actionability.

**Usability (NFR28–NFR31)**

- **NFR28**: Error messages include a `What to try:` line with at least one concrete remediation step. Fixture assertions on all 20 seed codes.
- **NFR29**: Contextual help available at every decision point via `explain <concept>`. No upfront reading mandatory.
- **NFR30**: Operations exceeding ~2 seconds display progress indication.
- **NFR31**: Console output conveys all critical information in plain text. Color coding is informational enhancement only.

**Migration & Lifecycle (NFR32–NFR34)**

- **NFR32**: v1.N skills read v1.(N-1) backlogs with deprecation warning. No v1 skill reads pre-v1 unversioned backlogs without explicit migration.
- **NFR33**: Deprecated features/fields preserved for one full Convoke minor-version cycle before removal.
- **NFR34**: Schema migrations are non-destructive by default. Breaking changes require explicit user confirmation.

**Test Infrastructure (NFR35–NFR36)**

- **NFR35**: Every NFR or FR referencing a test fixture has that fixture in the shipped repo. CI check for orphan-reference.
- **NFR36**: `convoke-doctor` result is reproducible given same installation state — two runs produce identical output.

### Additional Requirements

*(From Architecture — 8 ADRs + 24 patterns + complete project tree)*

**From Step 4 (ADRs):**

- **AR-ADR1**: Build Component 1 as in-memory index regenerated per invocation (no persistent cache in v1). Index builder in `scripts/lifecycle/lib/data/index-builder.js`; loads all artifacts + Change Log at skill entry; discards on exit.
- **AR-ADR4**: Implement `.ile.lock` discipline per-backlog with explicit heartbeat ticks, tiered staleness (<5min active / 5–15min force-unlock w/ confirmation / >15min auto-override), and inspectable lock file carrying `{pid, bootTime, startedAt, lastHeartbeat, invocationId, skillName}`.
- **AR-ADR8**: Build runtime error registry (`ILEError` class) at `scripts/lifecycle/lib/errors/errors.js` + bidirectional test backstop `tests/lib/ile/error-contract.test.js`. Seed 20+ codes with documented `detailsShape`.
- **AR-ADR2**: Implement reactive detector as workflow-step composition (no daemon, no hooks). Every state-mutating ILE-1 skill calls detector as final workflow step. New `/ile-sync` skill for out-of-band recovery.
- **AR-ADR7**: Implement inline text + y/n proposal rendering + batch UX when > 3 pending (homogeneous "accept all similar" or individual review; NO bulk-reject pathway).
- **AR-ADR5**: Every ILE-1 skill workflow begins with `ensureSchemaCurrent()` preamble. Migration registry + runner at `scripts/lifecycle/lib/migrations/`; mirrors install-migration signature.
- **AR-ADR3**: Observability library (`scripts/lifecycle/lib/observability/observability.js`) computes S1–S4 at index-build time (full scan, intra-invocation memoization). NFR1/2 CI fixture at 60/150/300 artifact × 2K/10K/50K Change Log scales; promote cross-invocation cache to v1 if 300-artifact SLO miss.
- **AR-ADR6**: ILE-1 v1 requires BMAD ≥ 6.3. `convoke-doctor` pre-install check with `CONFIG-002` on version mismatch.

**From Step 5 (Cross-cutting patterns — 24 decisions + 3 missing):**

- **AR-ISWC**: Implement `withISWC()` wrapper at `scripts/lifecycle/lib/frame/skill-frame.js`. Skill workflow invariant: `ensureSchemaCurrent → work → reactive-check → exit`. Single conformance test `iswc-conformance.test.js` replaces three separate disciplines.
- **AR-ENV**: Hybrid LLM-Host Model — workflow.md step-00 initializes env var envelope (`ILE_INVOCATION_ID`, `ILE_SKILL_NAME`, `ILE_BACKLOG_PATH`, `ILE_CONFIG_HASH`, `ILE_ENVELOPE_CREATED_AT`); fat-scripts at `scripts/lifecycle/entries/{skill}-entry.js` read envelope via `context-envelope.js` helper; AsyncLocalStorage propagates within-process. 30-min envelope TTL default.
- **AR-REG**: Four consistent registries (error-registry, migration-registry, validity-contracts-registry, doctor-checks-registry) all follow append-only + lazy-load + enumeration-test idiom.
- **AR-PATHS**: Canonical path helpers at `scripts/lifecycle/lib/runtime/paths.js` — all ILE-1 code uses helpers; no literal `.ile/`, `docs/ile/`, `change-log.jsonl`, `pending-reactive-check-`, `logs/` outside `paths.js` + fixtures.
- **AR-LOGGER**: Shared logger at `scripts/lifecycle/lib/runtime/logger.js` with AsyncLocalStorage read + bootstrap fallback (emit `invocationId: 'bootstrap'` when no ISWC context); never throws.
- **AR-ATOMIC**: All writes via `scripts/lifecycle/lib/writes/atomic-write.js` (write-to-tmp → verify → rename). Conformance test `atomic-write-conformance.test.js` greps for direct `fs.writeFile*`/`fs.appendFile*` outside helper.
- **AR-SCHEMA**: JSON Schema via Ajv validation at artifact-load. Schemas at `scripts/lifecycle/lib/data/schemas/{type}.schema.json`. Spec docs at `docs/ile/spec/{type}.md` paired 1:1. Architectural concepts (ISWC, Crash Recovery, Lane Taxonomy) at `docs/ile/concepts/`.
- **AR-CHANGELOG**: Change Log JSONL at `.ile/change-log.jsonl`; append-only atomic rename. Observability reads active + archived logs as unified history.
- **AR-LANES**: Lane taxonomy const enum at `scripts/lifecycle/lib/runtime/lanes.js`. Doctor flags non-enum values as `CONFIG-003`.
- **AR-ULID**: Invocation IDs as ULIDs (Crockford-base32, 26 chars, time-sortable). Via `ulid` npm package.
- **AR-DATE**: All timestamps via `new Date().toISOString()` (UTC only). Conformance test flags `Date.now()`, `.toString()`/`.toLocaleString()` on Date.
- **AR-REFS**: Cross-skill artifact references use both frontmatter `refs: [{to, type, relationship}]` (canonical, machine-readable) + markdown `[label](path)` links (presentational). Doctor flags orphan refs as `CONFIG-005`.
- **AR-CONFIG**: Configuration precedence: `defaults < team (`_bmad/_config/ile.yaml`) < backlog frontmatter < initiative frontmatter < invocation flags`. Via `resolveConfig()` in `scripts/lifecycle/lib/config/config.js`.
- **AR-CRASH**: Three crash windows (W1 pre-mutation / W2 mid-mutation / W3 post-mutation-pre-check) with distinct recovery mechanisms. Crash breadcrumbs at `.ile/pending-reactive-check-{invocationId}`. `/ile-sync` scans + replays.
- **AR-TESTHELP**: Test helper `runInISWC(overrides, testFn)` in `tests/lib/ile/test-helpers.js`; uses `process.env` round-trip for envelope; AsyncLocalStorage for in-process context.

**From Step 6 (Structure):**

- **AR-PKG**: Add `ulid@^2.3.0` runtime dependency; verify or add `ajv@^8.12.0` to `package.json`.
- **AR-CI**: Extend `.github/workflows/ci.yml` with `lint` job (ESLint: `no-floating-promises`, `require-await`, `no-return-await`), `ile-unit`, `ile-integration`, and `ile-portability-matrix` (macos/linux/windows) jobs. All added to `publish-gate.needs`.
- **AR-GITIGNORE**: Append `.ile/` and `tests/tmp/` to `.gitignore`.
- **AR-ESLINT**: Extend `.eslintrc.js` with 3 ILE rules.
- **AR-RULES**: Extend `project-context.md` with 2 new rules: `ile-skill-workflow-contract` (ISWC); `ile-error-contract`.
- **AR-BMMDEP**: Extend `_bmad/_config/bmm-dependencies.csv` with 3 ILE-1 rows (`convoke-ile`, `convoke-lifecycle-lib`, `convoke-ile-spec`).
- **AR-DOCTOR**: Extend `scripts/convoke-doctor.js` with one-line edit loading ILE-1 doctor registry + running its checks.
- **AR-INSTALL**: Extend `scripts/update/lib/refresh-installation.js` to seed ILE-1 trees (`docs/ile/`, `scripts/lifecycle/`, `_bmad/bme/_ile/`, `_bmad/_config/ile.yaml`, `.eslintrc.js` entries, `.gitignore` entries).
- **AR-UNINSTALL**: Uninstall workflow removes `_bmad/bme/_ile/`, `scripts/lifecycle/`, `docs/ile/`, ESLint rule entries, `ulid` dep; preserves `.ile/change-log.jsonl` as archived for audit; `--purge-runtime-state` flag for full removal with explicit-word confirmation.
- **AR-BATCH**: Batch-proposal UX when > 3 pending proposals from one invocation (summary + homogeneous-batch-accept OR individual review; no bulk-reject).
- **AR-FIXTURES**: Fixtures organized at `tests/fixtures/ile/{category}/` — uncertain-case (4 TAC1), round-trip (TAC3), consulting-scale-observability (60/150/300 × 2K/10K/50K), uninstall-partial-states, git-workflow-states, portability-golden/{macos,linux,windows}.
- **AR-STEP00**: Every ILE-1 `workflow.md` begins with step-00 initializing the env var envelope. Conformance: `iswc-workflow-header.test.js`.
- **AR-ENTRIES**: Every fat-script in `scripts/lifecycle/entries/*.js` exports `main(testOverrides?)`, has `require.main === module` guard. Conformance: `entry-structure.test.js`.
- **AR-DISCOVERY**: Three sprint-0 discovery tasks before implementation proceeds past first week: (1) verify `scripts/bmad-validate-exports.js` existence; (2) verify `ajv` in `package.json`; (3) confirm BMAD v6.3 SKILL.md semantics at namespace level vs. per-skill.

### UX Design Requirements

*(No UX design document exists for ILE-1 — this is a developer-tool capability layer. All user-facing surfaces are CLI + BMAD slash commands; UX conventions defined in PRD FR41–48 and Architecture Decision 15 progressive-disclosure help pattern.)*

### FR Coverage Map

All 63 FRs mapped to one of six epics:

| FR | Epic | Brief |
|---|---|---|
| FR1 | Epic 2 | `triage` ingestion |
| FR2 | Epic 2 | Intake logging in §2.1 |
| FR3 | Epic 2 | Append-only intakes |
| FR4 | Epic 2 | Qualifier lane/portfolio/RICE |
| FR5 | Epic 2 | RAW marking |
| FR6 | Epic 2 | Per-item orphan proposals |
| FR7 | Epic 2 | Duplicate detection |
| FR8 | Epic 2 | `review` mode rescore |
| FR9 | Epic 2 | Prior rationale in review |
| FR10 | Epic 2 | `create` bootstrap |
| FR11 | Epic 2 | Qualifier authorization |
| FR12 | Epic 2 | Qualifying gate proposes; user confirms |
| FR13 | Epic 2 | Qualify raw intakes |
| FR14 | Epic 3 | `portfolio-status` skill |
| FR15 | Epic 3 | Portfolio filter |
| FR16 | Epic 3 | Staleness filter |
| FR17 | Epic 3 | Signals summary |
| FR18 | Epic 3 | Drill-down |
| FR19 | Epic 3 | Pipeline completeness indicators |
| FR20 | Epic 3 | Consulting-scale render |
| FR21 | Epic 3 | Session preserves position |
| FR22 | Epic 3 | Summary-first at > 20 |
| FR23 | Epic 4 | State-change signal detection |
| FR24 | Epic 4 | Uncertain cases require confirmation |
| FR25 | Epic 4 | Orphan-intake scan on new initiative |
| FR26 | Epic 4 | Staleness flag > 14 days |
| FR27 | Epic 4 | Individual accept/reject |
| FR28 | Epic 4 | Team validity contracts |
| FR29 | Epic 4 | Per-initiative validity override |
| FR30 | Epic 3 | S1–S4 signal computation |
| FR31 | Epic 3 | Threshold-breach indicator |
| FR32 | Epic 3 | Signal drill-down |
| FR33 | Epic 1 | Shared schema across skills |
| FR34 | Epic 1 | Round-trip parseability |
| FR35 | Epic 4 | Change Log append-only app layer |
| FR36 | Epic 1 | Pre-commit hook enforcement |
| FR37 | Epic 2 | Change Log entries for decisions |
| FR38 | Epic 1 | Concurrent invocation guard |
| FR39 | Epic 1 | `convoke-doctor` ILE-1 checks |
| FR40 | Epic 6 | Skill portability + golden files |
| FR41 | Epic 5 | Minimal bootstrap |
| FR42 | Epic 5 | Full canonical on demand |
| FR43 | Epic 5 | Contextual help sub-commands |
| FR44 | Epic 5 | Persona-matched RICE examples |
| FR45 | Epic 5 | Four error category prefixes |
| FR46 | Epic 5 | Registered error codes |
| FR47 | Epic 4 | Reactive uncertainty as proposal |
| FR48 | Epic 5 | Error-code registration PR discipline |
| FR49 | Epic 6 | Destructive-op confirmation |
| FR50 | Epic 4 | Session undo |
| FR51 | Epic 6 | Progress indication > 2s |
| FR52 | Epic 5 | Error → last consistent state |
| FR53 | Epic 6 | `schema_version` frontmatter |
| FR54 | Epic 6 | Breaking-change bump |
| FR55 | Epic 6 | v1.N reads v1.(N-1) |
| FR56 | Epic 6 | Auto-migration on mismatch |
| FR57 | Epic 6 | `--migrate` non-interactive |
| FR58 | Epic 1 | Uninstall procedure |
| FR59 | Epic 1 | Backlog preserved across uninstall |
| FR60 | Epic 1 | `--verbose` / `--debug` flags |
| FR61 | Epic 1 | Reactive-layer decision logs |
| FR62 | Epic 1 | Configurable log retention |
| FR63 | Epic 1 | No external network in log-writing |

## Epic List

### Epic 1: Safe Ground — Installation, Foundation & Empty-State

**Goal**: Operator installs ILE-1 on their repo. `convoke-doctor` reports all ILE-1 checks green. Operator can invoke any ILE-1 skill on empty state and have it exit cleanly. `--verbose`/`--debug` work. Operator can uninstall without losing the audit trail. The system is safe to try.

**Ship-essential** (adoption gate — nothing else is usable without this).

**FRs covered**: FR33, FR34, FR36, FR38, FR39, FR58, FR59, FR60, FR61, FR62, FR63

**NFRs enforced here**: NFR5, NFR6, NFR7, NFR8, NFR9 (tested, not yet exercised), NFR13, NFR14, NFR15, NFR18, NFR19, NFR22, NFR23, NFR35, NFR36

**Architecture foundations delivered in this epic**:

- **Core runtime infrastructure** (foundational; fully implemented here): AR-ADR1 (index-builder skeleton with empty-state handling), AR-ADR4 (lock with heartbeat + tiered staleness), AR-ADR6 (v6.3 gate via doctor check), AR-ISWC (`withISWC` wrapper), AR-ENV (env envelope + AsyncLocalStorage propagation), AR-PATHS, AR-LOGGER (with bootstrap fallback), AR-ATOMIC, AR-CHANGELOG (JSONL writer/reader; writers exercised), AR-LANES (const enum), AR-ULID, AR-DATE, AR-REFS (frontmatter discipline enforced), AR-CONFIG (`resolveConfig` precedence), AR-TESTHELP (`runInISWC`), AR-FIXTURES (directory scaffolding), AR-STEP00 (workflow template), AR-ENTRIES (fat-script pattern).
- **Registries base infrastructure** (AR-REG): all 4 registries scaffolded (`errors/error-registry.js`, `migrations/registry.js`, `data/validity-contracts/registry.js`, `doctor/registry.js`) — each empty except for items needed for Epic 1 operation (see below).
- **Error system** (AR-ADR8 — scope-narrowed): `ILEError` class + `registerCode` + bidirectional test (`error-contract.test.js`) + 4-category taxonomy + CONFIG-001/002/003/004/005/006/007/008/009 (all CONFIG codes, required for install/doctor/lifecycle). **USER-NNN and INTERNAL-NNN codes register with the epic that throws them** (Epic 2 registers USER codes for qualifying-gate rejection; Epic 5 ensures full seed coverage for NFR28 fixture assertions).
- **Migration system** (AR-ADR5 — scope-narrowed): `schema-migrator.js` + `ensureSchemaCurrent()` preamble + migration registry + **only the `ile-data/implicit-v0-to-1.0.0` migration**. Breaking-change migration machinery, `--migrate` non-interactive mode, and schema_version bump semantics are **Epic 6 scope**.
- **Doctor system** (AR-DOCTOR): `doctor/registry.js` + ILE-1 checks: `bmad-version-gate` (CONFIG-002), `lane-enum-conformance` (CONFIG-003), `schema-validation` (CONFIG-004), `orphan-refs` (CONFIG-005), `single-config-file` (CONFIG-008). Registered with `scripts/convoke-doctor.js` via one-line extension.
- **Schema system** (AR-SCHEMA): JSON Schema base validator (Ajv); ships with `backlog.schema.json` + `change-log-entry.schema.json` + `debug-log-entry.schema.json` (E1-consumed). Per-artifact schemas (prd, brief, ir, proposal, architecture) ship with the epic that references/validates them.
- **Crash recovery** (AR-CRASH — scope-narrowed): breadcrumb-write infrastructure (ISWC postamble-on-error writes `.ile/pending-reactive-check-{invocationId}`). **Breadcrumb scan + replay semantics are Epic 4 scope** (live in `/ile-sync`).
- **Install/uninstall infrastructure**: AR-PKG (deps), AR-CI (ci.yml extensions), AR-GITIGNORE, AR-ESLINT, AR-RULES (`project-context.md` additions), AR-BMMDEP (csv rows), AR-INSTALL (refresh-installation seed list), AR-UNINSTALL (workflow delivered here — preserves audit data per spec).
- **Sprint-0 discovery tasks** (AR-DISCOVERY): 3 prerequisite verifications before Epic 1 implementation proceeds past sprint-0 week 1.

**What Epic 1 explicitly does NOT scaffold** (moved to natural home epics):

- AR-ADR2 reactive detector — **Epic 4** entirely; `reactive-detector.js` created there with real behavior, not a stub.
- AR-ADR3 observability compute — **Epic 3** entirely; `observability.js` (S1–S4 computation) created there.
- AR-ADR7 proposal library — **Epic 4** entirely; `proposal.js` (create/render/apply/batch UX) created there.
- Breadcrumb replay semantics — **Epic 4**; `crash-recovery.js` replay code created with `/ile-sync` skill.
- Schema-bump breaking-change machinery — **Epic 6**.
- USER-NNN + INTERNAL-NNN seed error codes — **registered with throwing epic**; Epic 5 ensures full 20-code seed coverage for NFR28 fixture assertions.

### Epic 2: Intake Capture & Qualifying Gate

**Goal**: Operator can run `bmad-enhance-initiatives-backlog triage` on review transcripts / retros / audit output and have findings automatically logged as intakes. Authorized qualifiers (Vortex / John / Winston) can route intakes into Bug / Fast / Initiative lanes with portfolio + RICE assignment. Operator can invoke `review` to rescore and `create` to bootstrap a fresh backlog. Orphan scanning suggests attachment per-item. Duplicate findings are surfaced.

**Ship-essential** (core intake value; primary user interaction).

**FRs covered**: FR1, FR2, FR3, FR4, FR5, FR6, FR7, FR8, FR9, FR10, FR11, FR12, FR13, FR37

**Architecture integration**: validity-contracts registry populated with intake-evaluation contracts, batch-UX (AR-BATCH) for rescore flow.

### Epic 3: Portfolio Visibility & Observability Signals

**Goal**: Operator can invoke `bmad-portfolio-status` to see a lifecycle-aware view of the portfolio — stages, lanes, WIP signals, observability signals (S1–S4) summary at top, pipeline-completeness indicators, filters by portfolio / staleness, drill-down from signal summary to event-level history, summary-first rendering when > 20 initiatives. Renders at consulting scale within SLO.

**Ship-essential** (basic visibility is core value; signals are the thesis).

**Signals carry explicit data-availability semantics** (to address the Epic 3 ships before Epic 4 sequencing concern):
- Each S1–S4 declares a `minDataThreshold` (e.g., S1 requires ≥10 proposal-decision entries), `dataCount` (current entries backing computation), and `state` (`computed` / `insufficient-data` / `disabled`)
- When `state !== 'computed'`, the portfolio view displays the signal slot with the reason (e.g., `"S1 insufficient data: 3 of 10 proposals required"`) rather than a numeric value — no misleading "0% misfires" when there's no data to measure
- **Data sources + availability timelines**: S3 (backlog entropy) + S4 (cross-skill inconsistency) compute immediately once Epic 2 lands (artifacts in backlog). S2 (gate abandon rate) after Epic 2 (qualifying-gate decisions logged). S1 (reactive misfire rate) only after Epic 4 ships (proposal decisions in Change Log).
- Test fixture at `tests/fixtures/ile/consulting-scale-observability/no-data/` asserts insufficient-data rendering — "no data" is a first-class signal state.

**FRs covered**: FR14, FR15, FR16, FR17, FR18, FR19, FR20, FR21, FR22, FR30, FR31, FR32

**NFRs exercised here**: NFR1, NFR2, NFR3, NFR4, NFR24 (reactive-layer log query `convoke-ile-logs`), NFR25, NFR27

**Architecture integration — this epic fully creates**:
- AR-ADR3 (observability compute) — `scripts/lifecycle/lib/observability/observability.js` with `computeSignals(indexState)` returning `{ s1, s2, s3, s4, computedAt, sourceCounts }` where each signal carries `{ state, dataCount, minDataThreshold, value? }`.
- Portfolio render library — `scripts/lifecycle/lib/observability/portfolio-render.js`.
- `portfolio-status-entry.js` fat-script.
- Per-artifact schemas needed for cross-skill rendering (prd.schema.json, brief.schema.json, ir.schema.json, architecture.schema.json) — added here as portfolio renders reference these artifact types.
- NFR1/2 fixture exercised: `tests/fixtures/ile/consulting-scale-observability/` at 60/150/300 artifact × 2K/10K/50K Change Log scales.

**Architecture integration — this epic consumes**: AR-ADR1 (in-memory index), AR-REFS (cross-skill rendering via frontmatter `refs`).

### Epic 4: Reactive Behaviors & Trust Contract

**Goal**: When artifacts change (new PRD, closed epic, sprint closure), the system proposes lifecycle-state transitions — and never silently commits. For uncertain cases (partial / race / moved / empty-but-present), the system always requires explicit confirmation. Operators accept or reject proposals individually. Teams can configure artifact validity contracts; initiatives can override. `/ile-sync` reconciles out-of-band edits.

**Thesis-essential** (reactive + trust-contract thesis is the product differentiator).

**FRs covered**: FR23, FR24, FR25, FR26, FR27, FR28, FR29, FR35, FR47, FR50

**NFRs exercised here**: NFR9 (trust contract enforced against 4 TAC1 fixtures — zero silent changes)

**Architecture integration — this epic fully creates**:
- **AR-ADR2** — `scripts/lifecycle/lib/reactive/reactive-detector.js` with `detectReactiveProposals(index, triggerContext) => Proposal[]`. Intra-skill-trigger convention enforced: every state-mutating ILE-1 skill calls detector as final workflow step.
- **AR-ADR7** — `scripts/lifecycle/lib/reactive/proposal.js` (createProposal / renderProposal / applyProposal / recordDecision) + batch UX when > 3 pending (homogeneous accept-all OR individual review; no bulk-reject to preserve S1 integrity).
- **AR-CRASH replay semantics** — `scripts/lifecycle/lib/reactive/crash-recovery.js` with `scanOrphanBreadcrumbs()` + `replayMissedReactiveChecks()`. Breadcrumb scan + replay only lives in `/ile-sync`; base breadcrumb-write infra comes from Epic 1.
- **`/ile-sync` skill** (operator-recovery entry point) — full workflow: acquire lock → migrate → scan breadcrumbs → scan drift → batch review.
- **Proposal schema** — `scripts/lifecycle/lib/data/schemas/proposal.schema.json` added here.
- **Validity-contracts registry population** — concrete contracts for state transitions (`prd-ready-for-architecture`, `brief-complete`, `ir-ready`, etc.) added as the trust contract fixtures require them.

**Architecture integration — this epic consumes**: AR-ADR1 (in-memory index), AR-ADR4 (lock for `/ile-sync`), AR-CHANGELOG (proposal-decision entries written), AR-LOGGER (reactive-layer decisions logged per FR61 for observability S1).

### Epic 5: Onboarding, Help & Error Communication

**Goal**: First-time user sees a minimal bootstrap of the lifecycle process (not the full canonical text). Full canonical process available on demand. Contextual help at every decision point via `explain <concept>`, `why <field>?`, `what does this flag mean?`. RICE calibration examples match user's persona (solo vs. consulting). Errors use `[USER]`/`[CONFIG]`/`[INTERNAL]`/`[UNCERTAIN]` category prefixes with registered codes + `What to try:` remediation.

**Thesis-essential** (progressive disclosure + error-communication discipline are load-bearing for adoption).

**FRs covered**: FR41, FR42, FR43, FR44, FR45, FR46, FR48, FR52

**NFRs exercised here**: NFR28 (`What to try:` required; fixture assertions on all 20 seed codes), NFR29 (contextual help at every decision point), NFR31 (plain-text critical info)

**Architecture integration — this epic completes**:
- **Full seed error-code coverage** — ensures all 20 seed codes across USER/CONFIG/INTERNAL/UNCERTAIN categories are registered with `detailsShape`. CONFIG codes already shipped in Epic 1. USER codes and INTERNAL codes are registered by their throwing epics (Epic 2, Epic 4, Epic 6); Epic 5 verifies completeness via fixture assertions on all 20 codes (NFR28).
- **`What to try:` remediation strings** — quality-pass on all 20 registered codes; each has a concrete remediation step. Fixture-tested.
- **Help registry** — per-skill `help.md` content authored + progressive-disclosure tagging (`[beginner] / [intermediate] / [advanced]`) per Step 5 Decision 15. `help-registry.test.js` enforces tagging.
- **Persona-matched RICE calibration examples** — examples swap based on `user_skill_level` / persona config key (OSS-solo vs. enterprise-consulting).
- **`explain <concept>` sub-command** — routes to the appropriate skill's help registry; dispatcher in shared help library.
- **Error → last consistent state behavior** (FR52) — verified across all write paths via integration fixtures.

**Architecture integration — this epic consumes**: AR-LOGGER (bootstrap fallback for pre-ISWC diagnostics), AR-ADR8 (error-code emission discipline — infrastructure from Epic 1; exercise completed here), progressive-disclosure help convention per Step 5 Decision 15.

### Epic 6: Interaction Safety, Schema Evolution & Long-Term Viability

**Goal**: Destructive operations require explicit confirmation (no passthrough). Progress indication appears on operations > 2s. Backlog carries `schema_version`; v1.N skills read v1.(N-1) with deprecation warning; migrations run automatically on version mismatch with confirmation. Non-interactive `--migrate` for CI. Schema migrations are resume-safe and non-destructive by default. `/ile-force-unlock` skill surface. Skill portability via export pipeline + per-platform golden files (Claude Code, Copilot, Cursor).

**Thesis-essential** (long-term viability completes the v1 story; enables upgrade confidence).

**FRs covered**: FR40, FR49, FR51, FR53, FR54, FR55, FR56, FR57

**NFRs exercised here**: NFR12 (resume-safe migrations), NFR17 (schema CHANGELOG discipline), NFR20 (backlog survives git workflows), NFR21 (`bmad-validate-exports` extensions + golden files), NFR30 (progress indication), NFR32, NFR33, NFR34

**Architecture integration — this epic fully creates**:
- **Schema-bump migration machinery** — second migration beyond Epic 1's `ile-data/implicit-v0-to-1.0.0`. Breaking-change detection in `schema-migrator.js` + explicit-word user confirmation + summary of what will change + rollback on failure (`INTERNAL-002`) + Change Log entry on success.
- **`--migrate` non-interactive flag** — supports CI contexts (FR57). Accepts all pending migrations without prompt; logs to debug log.
- **Resume-safe migration semantics** (NFR12) — interruption mid-migration leaves partial state that next `ensureSchemaCurrent()` detects and resumes; migrations are idempotent by construction (per ADR-5 "resumable, not rollbackable" framing).
- **`schema_version` frontmatter enforcement** — FR53–55 implemented: all backlog frontmatter carries `schema_version`; deprecation warning shown on v1.N reading v1.(N-1) backlog.
- **`/ile-force-unlock` skill** — operator-facing slash-command (per slash-command-ux rule). Invokes `ile-force-unlock-entry.js`, displays lock contents, requires explicit-word confirmation, calls `lock.js#releaseForced()`.
- **Skill portability + per-platform golden files** — extends `bmad-validate-exports` (pending AR-DISCOVERY task outcome from Epic 1). Golden files at `tests/fixtures/ile/portability-golden/{macos,linux,windows}/`. CI portability-matrix job validates per-platform exports match goldens.
- **Progress indication library** — implementation of FR51 (operations > 2s display spinner/percentage/stage identifier).
- **Destructive-op confirmation** (FR49) — applied consistently across destructive workflows (drop intake, archive absorbed item, remove portfolio attachment, --purge-runtime-state uninstall). Confirmation step is explicit-word (path-safety rule).

**Architecture integration — this epic consumes**: AR-ADR5 (preamble infrastructure from Epic 1), AR-UNINSTALL (workflow from Epic 1), TAC1–TAC4 fixtures exercised, AR-CHANGELOG (schema-migration entries written).

### Sprint Mapping

| Sprint | Primary | Secondary |
|---|---|---|
| 0 | Epic 1 (infrastructure core) | Sprint-0 discovery tasks (AR-DISCOVERY) |
| 1 | Epic 1 (completion) + Epic 2 start | — |
| 2 | Epic 2 (completion) | Epic 3 start (index + render) |
| 3 | Epic 3 (observability signals) | Epic 4 start (reactive detector) |
| 4 | Epic 4 (trust contract fixtures + /ile-sync) | Epic 5 start (help + bootstrap) |
| 5 | Epic 5 (error registry completion + persona examples) | Epic 6 start (schema migration) |
| 6 | Epic 6 (migration + portability + uninstall) | Integration, release prep |

5–7 sprint baseline from PRD Scoping preserved; Sprint 7 reserved for buffer / integration / release.
