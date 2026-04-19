---
stepsCompleted:
  - step-01-validate-prerequisites
  - step-02-design-epics
  - step-03-create-stories
  - step-04-final-validation
status: complete
completedAt: '2026-04-19'
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
| FR50 | Epic 2 | Session undo (qualifying-gate decisions) |
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
- **Reactive-detector stub** — `scripts/lifecycle/lib/reactive/reactive-detector.js` ships as `detectReactiveProposals(index, triggerContext) => []` (always returns empty; Epic 4 replaces with real detection). Stub lets `iswc-conformance.test.js` assert the reactive-check step exists in workflows without requiring E4 to land.
- **First concrete fat-scripts** — `scripts/lifecycle/entries/doctor-entry.js` (runs `convoke-doctor` checks via ISWC frame — exercises full entry pattern + gives E1 a meaningful user-facing `/ile-doctor` capability) + `scripts/lifecycle/entries/uninstall-entry.js` + `scripts/lifecycle/entries/ile-force-unlock-entry.js` (minimum viable force-unlock — shows lock contents, explicit-word confirmation, releases. Polish moves to Epic 6.)
- **Registries base infrastructure** (AR-REG): all 4 registries scaffolded (`errors/error-registry.js`, `migrations/registry.js`, `data/validity-contracts/registry.js`, `doctor/registry.js`) — each empty except for items needed for Epic 1 operation (see below).
- **Error system** (AR-ADR8 — scope-narrowed): `ILEError` class + `registerCode` + bidirectional test (`error-contract.test.js`) + 4-category taxonomy + CONFIG-001/002/003/004/005/006/007/008/009 (all CONFIG codes, required for install/doctor/lifecycle). **USER-NNN and INTERNAL-NNN codes register with the epic that throws them** (Epic 2 registers USER codes for qualifying-gate rejection; Epic 5 ensures full seed coverage for NFR28 fixture assertions).
- **Migration system** (AR-ADR5 — scope-narrowed): `schema-migrator.js` + `ensureSchemaCurrent()` preamble + migration registry + **only the `ile-data/implicit-v0-to-1.0.0` migration**. Breaking-change migration machinery, `--migrate` non-interactive mode, and schema_version bump semantics are **Epic 6 scope**.
- **Doctor system** (AR-DOCTOR): `doctor/registry.js` + ILE-1 checks: `bmad-version-gate` (CONFIG-002), `lane-enum-conformance` (CONFIG-003), `schema-validation` (CONFIG-004), `orphan-refs` (CONFIG-005), `single-config-file` (CONFIG-008). Registered with `scripts/convoke-doctor.js` via one-line extension.
- **Schema system** (AR-SCHEMA): JSON Schema base validator (Ajv); ships with `backlog.schema.json` + `change-log-entry.schema.json` + `debug-log-entry.schema.json` (E1-consumed). Per-artifact schemas (prd, brief, ir, proposal, architecture) ship with the epic that references/validates them. **`spec-conformance.test.js` uses a registered-specs allowlist** — Epic 1 ships ONLY specs for artifacts with schemas present (backlog, change-log, debug-log). Each later epic registers new (spec, schema) pairs together — never one without the other — to keep the set-equality test honestly passing across the lifecycle.
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
- **Onboarding banner** — the portfolio view's first render per session (when any signal is `insufficient-data`) shows a one-line banner: `"Observability signals mature as ILE-1 sees data from your workflow. Run 'explain signals' for details."` Epic 5's help registry includes an `explain signals` entry covering the S1–S4 minimum-data thresholds and timelines.

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
- **AR-ADR2** — replaces Epic 1's stub with real `scripts/lifecycle/lib/reactive/reactive-detector.js`: `detectReactiveProposals(index, triggerContext) => Proposal[]`. Intra-skill-trigger convention enforced: every state-mutating ILE-1 skill calls detector as final workflow step.
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
- **Timeline-aware seed error-code completeness check** — ensures all codes known at E5's point in the timeline are registered with `detailsShape` and have `What to try:` remediation strings. CONFIG codes shipped in Epic 1. USER and INTERNAL codes registered by their throwing epics (E2, E4) up to E5's ship point. **Full 20-code seed coverage assertion (NFR28) moves to Epic 6 final story / sprint-7 integration** — Epic 5's assertion is "all codes known-at-this-point are present and compliant," not "all 20." Avoids failure when E6 hasn't shipped yet.
- **Help registry includes `explain signals`** (covers S1–S4 minimum-data thresholds + availability timelines — referenced from Epic 3's onboarding banner).
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
- **Schema-bump migration machinery** — second migration beyond Epic 1's `ile-data/implicit-v0-to-1.0.0`. Breaking-change detection in `schema-migrator.js` + explicit-word user confirmation + summary of what will change + rollback on failure (`INTERNAL-002`) + Change Log entry on success. **Synthetic-fixture test migration** `ile-data/test-fixture-v1.0.0-to-test-fixture-v1.1.0` ships in `tests/fixtures/ile/migrations/` — exercises the full breaking-change path in CI without requiring a real v1.1 schema during v1 development. Real v1.N→v1.(N+1) migrations ship as future Convoke releases bump the ILE-1 schema.
- **Full 20-code seed coverage assertion (NFR28)** — Epic 6 final story / sprint-7 integration verifies all 20 seed codes across USER/CONFIG/INTERNAL/UNCERTAIN are registered with `detailsShape` + `What to try:` remediation. Fixture assertions on each code emit the registered shape.
- **`--migrate` non-interactive flag** — supports CI contexts (FR57). Accepts all pending migrations without prompt; logs to debug log.
- **Resume-safe migration semantics** (NFR12) — interruption mid-migration leaves partial state that next `ensureSchemaCurrent()` detects and resumes; migrations are idempotent by construction (per ADR-5 "resumable, not rollbackable" framing).
- **`schema_version` frontmatter enforcement** — FR53–55 implemented: all backlog frontmatter carries `schema_version`; deprecation warning shown on v1.N reading v1.(N-1) backlog.
- **`/ile-force-unlock` skill polish** — Epic 1 scaffolded the minimum viable force-unlock (`ile-force-unlock-entry.js` + basic show-lock + confirmation + release). Epic 6 polishes: richer lock-content display formatting, additional safety checks (detect long-running migrations that shouldn't be force-unlocked, warn on recent heartbeat), per-skill diagnostic hints.
- **Skill portability + per-platform golden files** — extends `bmad-validate-exports` (pending AR-DISCOVERY task outcome from Epic 1). Golden files at `tests/fixtures/ile/portability-golden/{macos,linux,windows}/`. CI portability-matrix job validates per-platform exports match goldens.
- **Progress indication library** — implementation of FR51 (operations > 2s display spinner/percentage/stage identifier).
- **Destructive-op confirmation** (FR49) — applied consistently across destructive workflows (drop intake, archive absorbed item, remove portfolio attachment, --purge-runtime-state uninstall). Confirmation step is explicit-word (path-safety rule).

**Architecture integration — this epic consumes**: AR-ADR5 (preamble infrastructure from Epic 1), AR-UNINSTALL (workflow from Epic 1), TAC1–TAC4 fixtures exercised, AR-CHANGELOG (schema-migration entries written).

### Sprint Mapping (revised for 66-story reality)

Epic 1's expansion from 14 → 20 stories (NFR coverage + sizing splits) pushes it across ~2.5 sprints. Epic 2 can parallelize starting mid-Sprint 1 once shared data model (Story 1.7) lands.

| Sprint | Primary | Secondary (parallelizable) |
|---|---|---|
| 0 | Epic 1 Stories 1.1–1.9 (spike + runtime + errors + atomic-write + lock + ISWC + schemas + config + index-stub) | — |
| 1 | Epic 1 Stories 1.10–1.16 (migration + breadcrumbs + doctor + entries + CI + security + LOC) | Epic 2 Story 2.1 can start once 1.7 lands |
| 2 | Epic 1 tail + Epic 2 (2.1–2.9 complete) | Epic 3 Story 3.1 can start once 2.1 lands |
| 3 | Epic 3 (3.1–3.9) | Epic 4 start (Story 4.1 validity contracts) once 3.7 observability shape lands |
| 4 | Epic 4 (4.2–4.8) | Epic 5 start (5.1–5.3 help) |
| 5 | Epic 5 (5.4–5.9) | Epic 6 start (6.1–6.4 destructive + schema) |
| 6 | Epic 6 core (6.5–6.9 migrations + portability) | — |
| 7 | Epic 6 tail (6.10–6.11 release gate) + integration + release prep | — |

**Sprint baseline revised**: 7 sprints realistic (was 5–7; now trending toward upper end of range due to NFR coverage expansion). Still within PRD's 3–10 sprint range. Actual velocity will vary; dependencies allow parallel Epic starts.

## Epic 1: Safe Ground — Installation, Foundation & Empty-State

Operator installs ILE-1 on their repo. `convoke-doctor` reports all ILE-1 checks green. Operator can invoke any ILE-1 skill on empty state and have it exit cleanly. `--verbose`/`--debug` work. Operator can uninstall without losing the audit trail. The system is safe to try.

### Story 1.1 [SPIKE]: Sprint-0 Discovery Tasks Verified

**Spike note**: This is a time-boxed investigation, not a feature-delivery story. Completion criterion is "answers obtained + documented," not "code shipped." Target box: ≤ 2 dev-agent sessions.

As an operator,
I want the 3 prerequisite discovery tasks verified,
So that Epic 1 implementation proceeds on confirmed infrastructure assumptions.

**Acceptance Criteria:**

**Given** ILE-1 architecture document's 3 sprint-0 discovery tasks
**When** discovery is performed
**Then** `scripts/bmad-validate-exports.js` existence is confirmed (or absence noted with a sprint-5+ scope note)
**And** `ajv` dependency presence in `package.json` is confirmed (or added to dependencies)
**And** BMAD v6.3 `SKILL.md` namespace-vs-per-skill semantics is confirmed via upstream BMAD doc reference
**And** findings are recorded in `_bmad-output/implementation-artifacts/ile-sprint-0-discovery.md`

### Story 1.2: Core Runtime Libraries

As a developer,
I want `scripts/lifecycle/lib/runtime/` with paths helpers, shared logger, ULID generation, ISO date utilities, and LANES const enum,
So that all later stories have canonical runtime primitives.

**Acceptance Criteria:**

**Given** a fresh ILE-1 codebase
**When** runtime libraries are implemented
**Then** `paths.js` exports `getProjectRoot`, `getBacklogPath`, `getChangeLogPath`, `getLockPath`, `getLogPath`, `getBreadcrumbPath`, `getSpecDir`, `getConceptsDir`, `getSchemaDir`, `getPendingBreadcrumbGlob` with no `process.cwd()` reads
**And** `logger.js` exports `info`/`debug`/`warn`/`error` with AsyncLocalStorage read + bootstrap fallback (emits `invocationId: 'bootstrap'` when no ISWC context); never throws
**And** `lanes.js` exports frozen `LANES` enum (INTAKE, QUALIFYING_GATE, BUG, FAST, INITIATIVE)
**And** `paths-discipline.test.js`, `logger-discipline.test.js`, `lane-enum-conformance.test.js`, `date-format-conformance.test.js` all pass

### Story 1.3: Error Registry + ILEError Class + CONFIG Codes

As a developer,
I want `scripts/lifecycle/lib/errors/` (ILEError class + error-registry + CONFIG-001–009 registered with `detailsShape`),
So that all ILE-1 error paths emit through a consistent API.

**Acceptance Criteria:**

**Given** error-registry.js + errors.js modules
**When** modules are loaded at startup
**Then** `ILEError` class throws `INTERNAL-001` when instantiated with unregistered code
**And** registry is populated with CONFIG-001 through CONFIG-009 (9 codes: generic, BMAD version, lane enum, schema validation, orphan refs, archived logs INFO, unknown config keys, multiple config files, config drift)
**And** each CONFIG code has `message`, `remediation` (`What to try:` string), and `detailsShape` documented
**And** `error-contract.test.js` bidirectional check passes (source ⟷ registry)

### Story 1.4: Atomic Write Helper + Change Log JSONL

As a developer,
I want `atomic-write.js` (tmp → rename primitive) + `change-log.js` (JSONL append-only writer/reader),
So that every ILE-1 write is durable and audit-logged.

**Acceptance Criteria:**

**Given** implemented atomic-write + change-log modules
**When** any ILE-1 code writes an artifact or Change Log entry
**Then** writes go through `atomicWrite(path, content)` helper exclusively
**And** `atomic-write-conformance.test.js` greps for direct `fs.writeFile*`/`fs.appendFile*` outside the helper and asserts zero matches
**And** Change Log entries validated against `change-log-entry.schema.json`; `change-log-schema.test.js` passes
**And** observability reads `change-log.jsonl` + any `change-log-archived-*.jsonl` as unified history

### Story 1.5: `.ile.lock` + Heartbeat + Tiered Staleness

As an operator,
I want concurrent ILE-1 invocations prevented via `.ile.lock` with heartbeat and tiered staleness,
So that simultaneous runs can't corrupt my backlog.

**Acceptance Criteria:**

**Given** lock.js + heartbeat.js modules
**When** an ILE-1 skill runs and acquires the lock
**Then** lock file contains `{pid, bootTime, startedAt, lastHeartbeat, invocationId, skillName}` via atomic write
**And** `heartbeat.tick(label)` updates `lastHeartbeat` via atomic rename
**And** second invocation with `(now - lastHeartbeat) < 5min` returns `UNCERTAIN-001` with retry remediation
**And** second invocation with `5min ≤ age < 15min` returns `UNCERTAIN-002` with force-unlock instructions + lock contents
**And** second invocation with `age ≥ 15min` auto-overrides with warning logged to Change Log
**And** error messages include lock contents, recovery command, and auto-clear ETA per spec

### Story 1.6: Context Envelope + withISWC + AsyncLocalStorage

As a developer,
I want `withISWC()` + env var envelope + AsyncLocalStorage propagation,
So that ILE-1 skills have consistent frame behavior and context flows within-process.

**Acceptance Criteria:**

**Given** skill-frame.js + context-envelope.js modules
**When** `withISWC({...opts}, body)` is invoked
**Then** `readEnvelope()` reads `ILE_INVOCATION_ID`, `ILE_SKILL_NAME`, `ILE_BACKLOG_PATH`, `ILE_CONFIG_HASH`, `ILE_ENVELOPE_CREATED_AT` env vars
**And** envelope TTL (default 30min) triggers fresh ULID generation on expired envelopes
**And** `ileContext.run()` propagates context; `ileContext.getStore()` returns valid context inside body
**And** 100 generated IDs match `/^[0-9A-HJKMNP-TV-Z]{26}$/` and are time-sortable
**And** `iswc-conformance.test.js` passes all assertions

### Story 1.7: JSON Schema Validation + Base Schemas + Spec Docs

As a developer,
I want JSON Schemas for backlog + change-log-entry + debug-log-entry with Ajv validation at load + matching spec docs,
So that artifact shape is enforced and documented.

**Acceptance Criteria:**

**Given** schemas at `scripts/lifecycle/lib/data/schemas/` + spec docs at `docs/ile/spec/`
**When** an artifact is loaded
**Then** Ajv validates against the matching schema with `strict: true, useDefaults: false`
**And** validation failure throws `CONFIG-004` with failing field in `details`
**And** `backlog.schema.json` + `change-log-entry.schema.json` + `debug-log-entry.schema.json` + their spec-doc counterparts exist
**And** `spec-conformance.test.js` uses a registered-specs allowlist and asserts set-equality for the registered pairs
**And** `schema-enforcement.test.js` loads invalid fixtures and asserts `CONFIG-004` raised

### Story 1.8: Config Resolution + Team Config Seed

As an operator,
I want `resolveConfig()` with 5-level precedence + seeded `_bmad/_config/ile.yaml`,
So that I can override ILE-1 defaults at appropriate levels.

**Acceptance Criteria:**

**Given** config.js + config-defaults.js modules
**When** an ILE-1 skill resolves configuration
**Then** precedence is `defaults < team < backlog < initiative < invocation flags`
**And** `config-precedence.test.js` (integration) verifies order with layered fixtures
**And** `config-read-discipline.test.js` greps for `yaml.load`/`JSON.parse` of config-like paths outside `config.js` and asserts zero matches
**And** unknown config keys emit WARN log entries; `unknown-config-keys.test.js` asserts expected warn entries
**And** `_bmad/_config/ile.yaml` is seeded with comments-only example content per specification during install

### Story 1.9: In-Memory Index Builder + Stub Reactive Detector

As a developer,
I want `data/index-builder.js` with empty-state handling + `reactive/reactive-detector.js` stub returning `[]`,
So that later epics have concrete interfaces to build against.

**Acceptance Criteria:**

**Given** index-builder + reactive-detector modules
**When** `buildIndex(backlogPath)` runs on an empty or non-existent backlog
**Then** it returns a valid index object with empty collections (no crash)
**And** `detectReactiveProposals(index, triggerContext)` stub returns `[]` deterministically
**And** stub enables `iswc-conformance.test.js` to assert reactive-check step exists in workflows
**And** Epic 4 replaces the stub without changing the exported signature

### Story 1.10: Migration Registry + Implicit-v0 Migration + Preamble

As an operator,
I want `ensureSchemaCurrent()` preamble that migrates un-versioned artifacts to v1.0.0,
So that my pre-ILE-1 backlog migrates gracefully on first invocation.

**Acceptance Criteria:**

**Given** schema-migrator.js + migration registry + `ile-data-implicit-v0-to-1.0.0.js` modules
**When** ILE-1 skill invokes `ensureSchemaCurrent(backlogPath)` on an artifact missing `schemaVersion` frontmatter
**Then** migration runs, inserts `schemaVersion: 1.0.0`
**And** Change Log records `{type: 'schema-migration', migrationName: 'ile-data/implicit-v0-to-1.0.0', from: '(implicit v0)', to: '1.0.0', at, artifactsMigrated}`
**And** migration is idempotent (re-running on already-migrated artifact is no-op)
**And** `migration-registry-conformance.test.js` asserts registry module shape matches install-migration signature

### Story 1.11: Crash Breadcrumb Write Infrastructure

As a developer,
I want breadcrumb-write infra in ISWC postamble,
So that Epic 4's replay mechanism has data to consume.

**Acceptance Criteria:**

**Given** ISWC wrapper with breadcrumb hooks
**When** a mutating skill body throws an error
**Then** postamble writes `.ile/pending-reactive-check-{invocationId}` before lock release
**And** successful execution clears the breadcrumb via atomic rename delete
**And** breadcrumb file contains `{invocationId, skillName, at, mutatedArtifacts?}` for future replay
**And** Epic 4 scans + replays breadcrumbs via `/ile-sync` (scope boundary preserved — E1 writes only)

### Story 1.12: Doctor Check Registry + ILE-1 Checks

As an operator,
I want `convoke-doctor` to run ILE-1 checks,
So that I can verify my ILE-1 install is healthy.

**Acceptance Criteria:**

**Given** `scripts/lifecycle/lib/doctor/` registry + checks
**When** `convoke-doctor` runs
**Then** doctor loads ILE-1 registry + runs its checks after existing Convoke checks
**And** `bmad-version-gate` fires `CONFIG-002` if BMAD <6.3
**And** `lane-enum-conformance` fires `CONFIG-003` on non-enum lane values in backlog
**And** `schema-validation` fires `CONFIG-004` on frontmatter schema violations
**And** `orphan-refs` fires `CONFIG-005` on unresolvable `refs:` entries
**And** `single-config-file` fires `CONFIG-008` if multiple `_bmad/_config/ile*.yaml` files detected
**And** clean install reports all ILE-1 checks green
**And** `doctor-registry-conformance.test.js` asserts every .js in `doctor/` self-registers
**And** NFR36 — doctor reproducibility test asserts two runs on the same install state produce byte-identical output
**And** NFR23 — `cross-skill-version-match` check verifies all 3 ILE-1 skills declare the same `schema_version` in their manifests; mismatches fire `CONFIG-011` (not warnings)

### Story 1.13a: `/ile-doctor` Fat-Script

As an operator,
I want `/ile-doctor` as a first user-facing skill that wraps `convoke-doctor` check loop in ISWC,
So that I can verify my ILE-1 install is healthy + the fat-script pattern is exercised in production code.

**Acceptance Criteria:**

**Given** `scripts/lifecycle/entries/doctor-entry.js` + `_bmad/bme/_ile/workflows/ile-doctor/` workflow
**When** operator invokes `/ile-doctor`
**Then** `doctor-entry.js` exports `main(testOverrides?)` with `require.main === module` guard
**And** workflow wraps the `convoke-doctor` check loop in `withISWC()`, exercising full ISWC frame
**And** heartbeat ticks per doctor check (for progress indication)
**And** workflow.md starts with step-00 envelope initialization; `iswc-workflow-header.test.js` asserts pattern
**And** `entry-structure.test.js` asserts `main` + require-main guard pattern

### Story 1.13b: `/ile-force-unlock` Minimum Viable

As an operator facing a stuck lock,
I want `/ile-force-unlock` as a minimum-viable safety net from Epic 1,
So that I can recover from stale locks without waiting for Epic 6 polish.

**Acceptance Criteria:**

**Given** `scripts/lifecycle/entries/ile-force-unlock-entry.js` + `_bmad/bme/_ile/workflows/ile-force-unlock/` workflow
**When** operator invokes `/ile-force-unlock`
**Then** the skill reads the current lock file and displays its contents (pid, skillName, heartbeat age)
**And** prompts for explicit-word confirmation (exact phrase typed, not y/n)
**And** on confirmation, calls `lock.releaseForced()` which atomically removes the lock file
**And** cancellation on phrase mismatch returns operator to pre-state without side effects
**And** polish (pretty-printed display, safety checks for recent heartbeat, per-skill hints) is Epic 6 scope

### Story 1.13c: `/ile-uninstall` Workflow

As an operator removing ILE-1 from a repo,
I want `/ile-uninstall` to remove ILE-1 trees while preserving audit trail per uninstall spec,
So that I can try ILE-1 without losing my Change Log history.

**Acceptance Criteria:**

**Given** `scripts/lifecycle/entries/uninstall-entry.js` + `_bmad/bme/_ile/workflows/uninstall/` workflow
**When** operator invokes `/ile-uninstall`
**Then** `.ile/change-log.jsonl` is renamed to `.ile/change-log-archived-{YYYY-MM-DD}.jsonl` (preserved as audit)
**And** removes `_bmad/bme/_ile/`, `scripts/lifecycle/`, `docs/ile/` + ILE-1-specific edits to `.eslintrc.js` / `project-context.md` / `bmm-dependencies.csv`
**And** prompts for `_bmad/_config/ile.yaml` removal (operator decides)
**And** `--purge-runtime-state` flag fully removes `.ile/` with explicit-word confirmation (loses audit)
**And** orphan `refs:` frontmatter warns (non-fatal); archived Change Log path logged as final Change Log entry before archival
**And** integration test verifies uninstall + re-install round-trip preserves observability history via archived logs

### Story 1.14a: CI Pipeline Extensions

As a maintainer,
I want CI pipeline jobs (lint + ile-unit + ile-integration + ile-portability-matrix) gated before publish,
So that ILE-1 code quality is enforced on every PR.

**Acceptance Criteria:**

**Given** `.github/workflows/ci.yml`
**When** the workflow is updated
**Then** `lint` job runs `npm run lint` (ESLint) and `ruff check` (Python)
**And** `ile-unit` job runs `tests/lib/ile/*.test.js`
**And** `ile-integration` job runs `tests/integration/ile/*.test.js`
**And** `ile-portability-matrix` job runs per-platform on `{macos-latest, ubuntu-latest, windows-latest}` matrix
**And** all four jobs are listed in `publish-gate.needs[]`
**And** `.eslintrc.js` has rules `no-floating-promises`, `require-await`, `no-return-await` enabled

### Story 1.14b: Package Dependencies + Install Seeding

**Dependency note**: this story requires Story 1.14a completion — `ile-unit` + `ile-integration` CI jobs must exist before this story's install-seed test can verify fresh-clone install via CI.

As a maintainer,
I want package deps + install-seeding extensions,
So that fresh installs get ILE-1 trees + `_bmad/_config/ile.yaml` properly seeded.

**Acceptance Criteria:**

**Given** Story 1.14a complete (CI jobs exist) and `package.json` + `scripts/update/lib/refresh-installation.js` + `scripts/update/lib/config-merger.js`
**When** dependencies and install extensions are applied
**Then** `package.json` includes `ulid@^2.3.0` (and `ajv@^8.12.0` if not already present)
**And** `package.json` `engines` field inherits from Convoke core — Node.js range matches Convoke's declared range (NFR22)
**And** `refresh-installation.js` seed list includes `docs/ile/`, `scripts/lifecycle/`, `_bmad/bme/_ile/`
**And** `config-merger.js` seeds `_bmad/_config/ile.yaml` from the spec'd example content
**And** fresh-clone install via `convoke-update` seeds all ILE-1 trees + `_bmad/_config/ile.yaml`
**And** `convoke-doctor` runs green post-install

### Story 1.14c: Project-Context Rules + BMM Dependencies + Gitignore

As a maintainer,
I want project-context rule additions + bmm-dependencies entries + gitignore hygiene,
So that ILE-1 is registered in the Convoke extension governance system.

**Acceptance Criteria:**

**Given** `project-context.md` + `_bmad/_config/bmm-dependencies.csv` + `.gitignore`
**When** changes are applied
**Then** `project-context.md` has 2 new rules appended: `ile-skill-workflow-contract`, `ile-error-contract`
**And** `bmm-dependencies.csv` has 3 ILE-1 rows (`convoke-ile`, `convoke-lifecycle-lib`, `convoke-ile-spec`) per v6.3 A9 governance
**And** `.gitignore` includes `.ile/` + `tests/tmp/`
**And** each rule has a descriptive one-line hook + points to the governing artifact

### Story 1.15: Security-by-Design Static Analysis (NFR5/6/7/8)

As a **privacy-sensitive operator** running ILE-1 on confidential portfolios,
I want static-analysis verification that ILE-1 code has no external network calls, no telemetry, and no external log transmission per NFR5, NFR6, NFR7,
So that I can trust the "no external transmission" claim.

**Acceptance Criteria:**

**Given** ILE-1 source tree at `scripts/lifecycle/`, `_bmad/bme/_ile/`, `tests/lib/ile/`
**When** `tests/lib/ile/security-static-analysis.test.js` runs
**Then** grep-based scan flags zero matches for `http(s)://` strings outside allow-listed locations (docs, fixtures, error remediation text)
**And** zero matches for `fetch(`, `require('axios')`, `require('got')`, `require('node-fetch')`, `require('https')` outside allow-list
**And** zero matches for `require('http')` or `require('dns')` outside allow-list
**And** path-safety enforcement (NFR8): all scripts accepting user-provided destructive-op paths call `resolve-normalize-contains-check` against project root; test asserts zero direct `fs.rm*` / `fs.unlink*` / `fs.rmdir*` calls outside the safety helper
**And** CI fails the build on any violation

### Story 1.16: LOC Budget Enforcement (NFR15)

As a **maintainer** preserving readability discipline,
I want LOC budget enforcement per NFR15 (< 500 LOC per main script),
So that scripts stay reviewable and invite decomposition when they grow.

**Acceptance Criteria:**

**Given** a CI check that counts LOC per `scripts/lifecycle/**/*.js` file (excluding tests + fixtures)
**When** the check runs on a PR
**Then** files > 500 LOC are flagged in the CI output
**And** a PR with any file > 500 LOC is allowed to proceed only with a PR-description justification (human-reviewed exception)
**And** the check runs as part of the `lint` CI job
**And** LOC count excludes blank lines + comment-only lines (substantive code only)

## Epic 2: Intake Capture & Qualifying Gate

Operator can run `bmad-enhance-initiatives-backlog triage` on review transcripts / retros / audit output and have findings automatically logged as intakes. Authorized qualifiers (Vortex / John / Winston) can route intakes into Bug / Fast / Initiative lanes with portfolio + RICE assignment. Operator can invoke `review` to rescore and `create` to bootstrap a fresh backlog. Orphan scanning suggests attachment per-item. Duplicate findings are surfaced.

### Story 2.1: Intake Schema + Append-Only Persistence

As a developer,
I want the intake data model (schema at `docs/ile/spec/intake.md` + `intake.schema.json`) with append-only write through the existing Change Log + §2.1 section,
So that every FR2 intake log is structurally enforced and audit-safe.

**Acceptance Criteria:**

**Given** intake schema (`{id, description, source, date, raiser}`) + §2.1 backlog section
**When** an intake is logged via ILE-1 code
**Then** Ajv validates the intake against `intake.schema.json`
**And** `spec-conformance.test.js` passes for the new (intake.md, intake.schema.json) pair
**And** attempts to mutate an existing §2.1 intake row fire `CONFIG-004` (append-only violation)
**And** all writes route through `atomic-write.js`

### Story 2.2: `bmad-enhance-initiatives-backlog triage` Ingestion

As an operator,
I want `triage` to ingest text and extract findings + log each as an intake per FR1–FR2,
So that I can capture findings from review sessions in one step.

**Acceptance Criteria:**

**Given** `bmad-enhance-initiatives-backlog triage` invoked on raw text input
**When** the skill extracts actionable findings from the text
**Then** each finding is logged as a new intake row in §2.1 with a fresh ID, description, source, date, and raiser
**And** every logged intake has a matching Change Log entry with `type: 'intake-logged'`
**And** the skill supports multi-line + multi-paragraph input
**And** empty input or no-findings-detected paths exit cleanly with informational message

### Story 2.3: Duplicate Detection on Triage

As an operator,
I want triage to detect semantic-similarity duplicates against existing backlog items per FR7 and surface them for review,
So that I don't pollute the backlog with re-logged findings.

**Acceptance Criteria:**

**Given** an incoming finding during triage
**When** similarity against existing intake/item exceeds the configurable threshold
**Then** the finding is flagged for review before log
**And** operator sees side-by-side comparison (new vs. existing)
**And** operator can choose log-anyway, merge-as-update, or discard
**And** duplicate detection uses lexical + structural matching (exact-title + token-overlap signals)

### Story 2.4a: Qualifier Authorization Gate

As an operator invoking the qualifying gate,
I want qualifier authorization verified before any qualification logic runs per FR11,
So that unauthorized users cannot assign lanes/portfolios/RICE.

**Acceptance Criteria:**

**Given** a configured qualifier list in `_bmad/_config/ile.yaml` (defaulting to Vortex, John, Winston)
**When** an operator invokes the qualifying gate
**Then** the identity of the invoking operator is checked against the authorized list
**And** unauthorized operators receive `USER-001` with remediation (`What to try:` explains authorized-qualifier rule + how to update config)
**And** authorized operators proceed to the qualification flow (Story 2.4b)
**And** unauthorized users can still log raw intakes via `triage` (per FR11 two-tier permission)

### Story 2.4b: Qualifying Gate — Lane + Portfolio + RICE Assignment Flow

As an authorized qualifier (Vortex / John / Winston),
I want to assign a finding's Lane, Portfolio, and initial RICE score per FR4 + FR12,
So that intakes are routed into the appropriate downstream track.

**Acceptance Criteria:**

**Given** authorized qualifier has passed the authorization gate (Story 2.4a)
**When** the gate proposes initial lane, portfolio, and RICE values based on finding content
**Then** each proposed field is displayed with its rationale
**And** operator confirms or overrides each field explicitly (no silent acceptance)
**And** on confirmation, qualifying-gate writes lane + portfolio + RICE to the intake row
**And** Change Log entry is recorded per FR37 with qualifier identity, timestamp, proposed vs. final values

### Story 2.5: RAW Intakes + Re-qualification

As an operator,
I want to mark a finding as RAW per FR5 + later re-qualify it per FR13,
So that findings lacking routing context are preserved and routable when context arrives.

**Acceptance Criteria:**

**Given** a qualifying-gate session on a new finding
**When** operator chooses `mark as RAW`
**Then** an intake row is created in §2.1 with no lane assigned
**And** RAW intakes display an explicit RAW marker in the portfolio view
**When** the operator later invokes `qualify` on the raw intake
**Then** the SAME §2.1 row is updated with lane/portfolio/RICE (no duplicate row)
**And** Change Log records the original RAW log plus the subsequent qualification as distinct entries

### Story 2.6: Orphan-Intake Scan (Per-Item Proposals)

As an operator,
I want orphan-intake scanning to propose attachments per-item per FR6,
So that I'm not forced into batch yes/no decisions that cause mis-routing.

**Acceptance Criteria:**

**Given** an intake is logged + existing backlog has potential attachment candidates
**When** the orphan scan runs
**Then** attachment proposals are presented one-at-a-time with accept / reject / skip
**And** no batch-approve option exists (per-item rule enforced)
**And** each decision is logged individually in the Change Log with `type: 'orphan-attachment'`
**And** scan completes + exits to qualifying-gate flow regardless of attachment outcome

### Story 2.7: `review` Mode — Rescore RICE with Prior Rationale

As an operator,
I want `review` to walk initiative-lane items and show prior scoring rationale + re-collect RICE per FR8 + FR9,
So that rescoring preserves calibration history.

**Acceptance Criteria:**

**Given** `bmad-enhance-initiatives-backlog review` invoked
**When** the skill walks initiative-lane items
**Then** items are sorted by staleness (oldest rescore first)
**And** for each item, prior R/I/C/E values + rationale are shown alongside current values
**And** operator edits R/I/C/E + provides new rationale; skill computes new RICE score
**And** Change Log records rescore with both old + new values + reason per FR37
**And** review exits cleanly when operator signals completion

### Story 2.8: `create` Mode — Bootstrap Empty Backlog

As an operator,
I want `create` mode to bootstrap a fresh lifecycle backlog per FR10,
So that a new project can adopt ILE-1 without manual setup.

**Acceptance Criteria:**

**Given** `bmad-enhance-initiatives-backlog create` invoked on a repo
**When** no existing backlog file is present
**Then** the skill generates a fully-conformant backlog at the configured path
**And** the generated file passes `backlog.schema.json` validation (v1.0.0 schema)
**And** the file contains empty §2.1 + lane sections + Change Log + all required frontmatter
**When** an existing backlog is present
**Then** the skill refuses to overwrite and requires explicit-word confirmation (path-safety rule)

### Story 2.9: Session Undo for Qualifying-Gate Decisions

As an operator,
I want to undo the last qualifying-gate decision within the same session before persistence per FR50,
So that immediate mis-clicks or mis-calibrations are recoverable.

**Acceptance Criteria:**

**Given** a qualifying-gate decision made in the current session but not yet persisted
**When** operator invokes `undo` within the same session
**Then** the in-memory decision state reverts to pre-decision
**And** operator re-enters the qualifying-gate flow for that intake
**When** the decision has already been persisted to the backlog
**Then** `undo` is no longer offered; operator must use `review` mode (FR8) to rescore
**And** Change Log never records an un-persisted decision (no ghost entries)

## Epic 3: Portfolio Visibility & Observability Signals

Operator can invoke `bmad-portfolio-status` to see a lifecycle-aware view of the portfolio — stages, lanes, WIP signals, observability signals (S1–S4) summary at top, pipeline-completeness indicators, filters by portfolio / staleness, drill-down from signal summary to event-level history, summary-first rendering when > 20 initiatives. Renders at consulting scale within SLO.

### Story 3.1: `bmad-portfolio-status` Skill — Basic Kanban Render

As an operator,
I want `bmad-portfolio-status` to render a lifecycle-aware portfolio view with stages, lanes, and WIP signals per FR14,
So that I can see my portfolio at a glance.

**Acceptance Criteria:**

**Given** a backlog with initiatives across lanes
**When** `bmad-portfolio-status` is invoked
**Then** a kanban-style view renders with lanes (Intake / Qualifying Gate / Bug / Fast / Initiative)
**And** initiative stages within each lane are displayed
**And** WIP signals (counts, stale flags) appear per lane
**And** invocation on an empty backlog exits cleanly with an informational message

### Story 3.2: Portfolio Filters — Portfolio + Staleness

As an operator,
I want one-keystroke filters by portfolio (FR15) and staleness-flag state (FR16),
So that I can focus on specific slices.

**Acceptance Criteria:**

**Given** `bmad-portfolio-status` invoked with filter flags
**When** `--portfolio <name>` is passed
**Then** the view filters to items attached to the named portfolio (convoke/vortex/gyre/forge/bmm/enhance/loom/helm/custom)
**When** `--stale` is passed
**Then** the view filters to items flagged stale
**And** filters compose (multiple filters narrow the view)
**And** invalid portfolio name fires `USER-NNN` with remediation

### Story 3.3: Pipeline-Completeness Indicators

As an operator,
I want each initiative to show which artifacts exist per FR19,
So that I can see pipeline progress at a glance without opening individual files.

**Acceptance Criteria:**

**Given** an initiative with various artifacts
**When** the portfolio view renders the initiative
**Then** an indicator shows B / P / P✓ / A / IR / E / D based on presence of brief, PRD, validated-PRD, architecture, IR, epics, dev-complete artifacts
**And** detection uses frontmatter `refs:` or canonical file-path patterns
**And** missing artifacts display as `—`
**And** indicator accuracy verified against fixture initiatives with known artifact sets

### Story 3.4: Summary-First Rendering at > 20 Items

As an operator with a consulting-scale backlog,
I want summary-first rendering when > 20 initiatives per FR22 + NFR3,
So that my session context isn't consumed by individual items I'm not inspecting.

**Acceptance Criteria:**

**Given** a backlog with more than the configured threshold (default 20) of initiatives
**When** the portfolio view renders
**Then** aggregate summary appears first (lane counts, stage distribution, signals, top-3 by RICE)
**And** individual listings appear below the summary
**And** threshold is configurable via `portfolioSummaryFirstThreshold` config key
**And** backlog with ≤ threshold items renders without summary-first (original format)

### Story 3.5: Session Position Preservation

As an operator navigating portfolio → drill-down → back,
I want session to preserve my position per FR21,
So that I don't lose context mid-investigation.

**Acceptance Criteria:**

**Given** operator navigates from portfolio view into an initiative drill-down
**When** the operator returns to the portfolio view from the drill-down
**Then** the portfolio view restores to the same scroll/focus position
**And** state is held in-memory within the ISWC session (no persistence, per ADR-1 in-memory scope)
**And** a fresh invocation (new ISWC session) starts at the default position

### Story 3.6: Consulting-Scale Rendering Performance

As an operator with 60+ initiatives across 10+ portfolios,
I want rendering within NFR1/NFR2 SLO per FR20,
So that the tool remains usable at real scale.

**Acceptance Criteria:**

**Given** consulting-scale fixtures at 60 / 150 / 300 artifact counts
**When** the portfolio view renders
**Then** at 60 initiatives: end-to-end < 5s median / < 15s p99; ILE-1 code alone < 2s median / < 5s p99
**And** at 150 initiatives: same SLO (degrades gracefully)
**And** at 300 initiatives: if SLO breaks, Epic 1's cross-invocation cache escape hatch is promoted to v1 scope per ADR-1
**And** CI fixture runs at all three scales; failure breaks the build

### Story 3.7: `observability.js` — S1/S2/S3/S4 Compute + Data-Availability States

As a developer,
I want `observability.js` with full S1–S4 computation and data-availability state handling per FR30 + AR-ADR3,
So that signals compute honestly with minimum-data thresholds.

**Acceptance Criteria:**

**Given** observability.js module + Change Log + backlog index
**When** `computeSignals(indexState)` is called at index-build time
**Then** it returns `{s1, s2, s3, s4, computedAt, sourceCounts}`
**And** each signal includes `{state: 'computed' | 'insufficient-data' | 'disabled', value?, dataCount, minDataThreshold}`
**And** S3 (backlog entropy) + S4 (cross-skill inconsistency) compute immediately from current backlog
**And** S2 (gate abandon rate) computes from qualifying-gate Change Log entries
**And** S1 (reactive misfire rate) computes from proposal-decision Change Log entries; reports `insufficient-data` until Epic 4 ships
**And** `tests/fixtures/ile/consulting-scale-observability/no-data/` asserts insufficient-data rendering

### Story 3.8: Signals Summary + Threshold-Breach + Onboarding Banner

As an operator,
I want observability signals at the top of portfolio view (FR17) + threshold-breach indicators (FR31) + onboarding banner for insufficient-data,
So that I understand signal state and why some signals aren't yet actionable.

**Acceptance Criteria:**

**Given** portfolio view + computed signals
**When** the view renders
**Then** S1–S4 summary appears at the top of the output
**And** signals with value crossing the configured threshold show a breach indicator
**And** when ANY signal is `insufficient-data`, a one-line banner appears: "Observability signals mature as ILE-1 sees data from your workflow. Run 'explain signals' for details."
**And** thresholds configurable per signal via config

### Story 3.9: Signal Drill-Down via `convoke-ile-logs`

As an operator investigating a signal,
I want drill-down from signal summary to event-level history per FR18 + FR32 via `convoke-ile-logs <query>` (NFR24),
So that I can see the events that produced the signal value.

**Acceptance Criteria:**

**Given** portfolio view with signals displayed
**When** operator invokes signal drill-down (keystroke or explicit command)
**Then** result shows filtered Change Log entries that contributed to the signal's computation
**And** `convoke-ile-logs` accepts filters for initiative, date range, signal type, user-action (accept/reject)
**And** drill-down is MVP scope (not deferred to Growth)
**And** query performance on 50K-entry Change Log completes within NFR1 SLO

## Epic 4: Reactive Behaviors & Trust Contract

When artifacts change (new PRD, closed epic, sprint closure), the system proposes lifecycle-state transitions — and never silently commits. For uncertain cases (partial / race / moved / empty-but-present), the system always requires explicit confirmation. Operators accept or reject proposals individually. Teams can configure artifact validity contracts; initiatives can override. `/ile-sync` reconciles out-of-band edits.

### Story 4.1: Validity Contract Registry Population

As a developer,
I want concrete validity contracts registered via `registerContract()` per FR28 + AR-ADR2,
So that Epic 4's detector has evaluation logic for each lifecycle-state-change signal.

**Acceptance Criteria:**

**Given** the validity-contracts registry from Epic 1
**When** Epic 4 populates validity contracts
**Then** at least 8 contracts registered: `prd-ready-for-architecture`, `brief-complete`, `ir-ready`, `architecture-ready-for-epics`, `epics-ready-for-sprint-planning`, `sprint-closed`, `intake-orphan-candidate`, `item-stale-14-days`
**And** each follows `evaluatorFn: (artifact, index) => { status, reasons, missing? }` signature
**And** each contract has unit tests with fixture artifacts covering complete/uncertain/invalid paths
**And** `validity-contract-registry.test.js` enumeration test passes

### Story 4.2: Real `reactive-detector.js` — Replaces Epic 1 Stub

As a developer,
I want the real `detectReactiveProposals(index, triggerContext)` implementation per FR23 + AR-ADR2,
So that the reactive layer produces genuine state-change proposals.

**Acceptance Criteria:**

**Given** the real reactive-detector module
**When** invoked with an index + trigger context
**Then** it iterates registered validity contracts + applies each to relevant artifacts
**And** returns `Proposal[]` with fields `{id, triggeredBy, targetArtifact, proposedMutation, reason, createdAt}`
**And** result sorts deterministically by `targetArtifact` then `proposedMutation.type`
**And** empty return = "checked, nothing to propose" (distinct from undefined/null which is an ISWC violation)
**And** Epic 1's stub signature is preserved (no exported-signature change)

### Story 4.3: Per-Initiative Validity Contract Overrides

As an operator,
I want to override team-level validity contracts per-initiative via `config:` frontmatter per FR29,
So that special-case initiatives can define their own completion criteria.

**Acceptance Criteria:**

**Given** an initiative artifact with `config: {validityContracts: {...}}` frontmatter
**When** the reactive detector evaluates that initiative's artifacts
**Then** the initiative-level override takes precedence over team-level + defaults via config-precedence merger
**And** override applies only to that initiative's own artifacts (no leakage to siblings)
**And** unknown contract names in override emit WARN + fire `CONFIG-007` via doctor check

### Story 4.4: Proposal Library — Create/Render/Apply + Inline Y/N UX

As a developer,
I want `proposal.js` with full create/render/apply/recordDecision flow + inline text y/n rendering per FR27 + AR-ADR7,
So that individual proposals can be accepted or rejected.

**Acceptance Criteria:**

**Given** proposal.js module
**When** a proposal is created + rendered
**Then** `createProposal()` returns a valid Proposal object
**And** `renderProposal()` outputs human-readable text with reason + target + proposed mutation
**And** operator response `y` → `applyProposal()` + Change Log entry with `decision: 'accepted'`
**And** operator response `n` → Change Log entry with `decision: 'rejected'`
**And** no edit primitive is offered (reject + manual action is the workflow)
**And** no bulk-reject pathway exists (preserves S1 integrity per ADR-7)

### Story 4.5: Batch Proposal UX for `/ile-sync` Catch-up

As an operator returning from a catch-up gap,
I want batch UX when > 3 proposals are pending per AR-ADR7 + AR-BATCH,
So that I'm not exhausted by sequential individual reviews.

**Acceptance Criteria:**

**Given** `/ile-sync` produces > 3 proposals in one invocation
**When** the batch UX is triggered
**Then** a pre-prompt summary renders: `Found N pending transitions: ...` with per-category counts
**And** menu offers `(i) Review individually / (b) Accept homogeneous batches / (q) Quit` — no reject all
**And** `b` offers per-category accept-all with expand-detail option (e.g., "Accept 9 × Intake → Qualifying Gate? (y/n/expand)")
**And** batch acceptance records `decision: 'accepted-in-batch'` with shared `batchId`
**And** destructive proposals (archive, delete, demote-lane) are never batch-acceptable (each requires individual explicit-word confirmation)

### Story 4.6: Crash-Recovery Replay via `/ile-sync` (W3 Window)

As an operator recovering from a mid-session crash,
I want `/ile-sync` to scan + replay orphan reactive-check breadcrumbs per AR-CRASH replay semantics,
So that missed proposals surface at recovery time.

**Acceptance Criteria:**

**Given** `/ile-sync` is invoked with orphan `.ile/pending-reactive-check-*` breadcrumbs present
**When** the preamble scans breadcrumbs
**Then** breadcrumbs with mtime > active Change Log creation time → replay (normal flow)
**And** breadcrumbs with mtime < active Change Log creation time → archive to `.ile/breadcrumbs-archived-{date}/` + WARN (stale from prior cycle)
**And** each replay invokes the detector against current state + surfaces proposals via batch UX
**And** test fixtures at `tests/fixtures/ile/crash-recovery/` cover W1 (pre-mutation), W2 (mid-mutation), W3 (post-mutation-pre-check) crash windows

### Story 4.7: `/ile-sync` Skill — Full Operator-Recovery Entry Point

**Bundling judgment**: this story intentionally bundles 5 workflow steps because they form a single workflow-composition unit (`/ile-sync` IS the composition), not independent capabilities. Unlike Stories 1.13 or 2.4 which split because they covered orthogonal concerns, `/ile-sync`'s 5 steps (acquire lock → migrate → replay → scan → batch review) are sequential phases of one operator-recovery entry point. Splitting would fragment the skill definition.

As an operator,
I want `/ile-sync` as the operator-recovery entry point per AR-ADR2 + FR24 + FR27,
So that I have one skill covering out-of-band edits, missed proposals, and drift.

**Acceptance Criteria:**

**Given** `/ile-sync` workflow.md + `ile-sync-entry.js` fat-script
**When** operator invokes `/ile-sync`
**Then** workflow sequence executes: step-00 envelope init → step-01 acquire lock → step-02 ensureSchemaCurrent → step-03 replay breadcrumbs (W3) → step-04 scan drift (all artifacts re-evaluated) → step-05 batch review
**And** `/ile-sync` is discoverable via `convoke-doctor` drift-heuristic (artifact mtime > Change-Log mtime → suggests `/ile-sync`)
**And** scan-drift step uses all validity contracts from Story 4.1

### Story 4.8: Trust-Contract Fixtures + Intra-Skill Trigger Discipline

As a developer,
I want NFR9 trust-contract enforcement against 4 TAC1 fixtures + intra-skill trigger discipline per ISWC,
So that the propose-before-commit contract is mechanically verified.

**Acceptance Criteria:**

**Given** `tests/fixtures/ile/uncertain-case-fixtures/` with 4 TAC1 fixtures
**When** the integration test runs the 4 fixtures (partial artifact / race condition / moved file / empty-but-present)
**Then** test asserts zero silent state changes across all four fixtures
**And** `iswc-conformance.test.js` asserts every state-mutating ILE-1 skill workflow ends in a reactive-check step
**And** FR35 Change Log append-only enforced at app layer + verified by schema validation on non-append mutations

## Epic 5: Onboarding, Help & Error Communication

First-time user sees a minimal bootstrap of the lifecycle process (not the full canonical text). Full canonical process available on demand. Contextual help at every decision point via `explain <concept>`, `why <field>?`, `what does this flag mean?`. RICE calibration examples match user's persona (solo vs. consulting). Errors use category prefixes with registered codes and `What to try:` remediation.

### Story 5.1: Minimal Bootstrap for First-Time Users

As a first-time operator,
I want a minimal bootstrap on initiatives-backlog first invocation per FR41,
So that I'm not overwhelmed by the full canonical lifecycle text.

**Acceptance Criteria:**

**Given** a fresh install with no prior ILE-1 use (`.ile/` absent or empty Change Log)
**When** the initiatives-backlog skill is invoked for the first time
**Then** a condensed lifecycle summary renders (lanes + qualifying gate + core commands)
**And** the condensed summary is substantially shorter than the full canonical text
**And** pointer to `explain lifecycle` for the full text appears in the summary
**And** subsequent invocations skip the bootstrap (detected via Change Log presence)

### Story 5.2: Full Canonical Lifecycle on Demand

As an operator,
I want to request the full canonical lifecycle process on demand per FR42,
So that I can read the complete spec when needed.

**Acceptance Criteria:**

**Given** the canonical lifecycle content in `docs/ile/concepts/lifecycle-process.md`
**When** the operator invokes `explain lifecycle` (or equivalent command)
**Then** the full canonical lifecycle text renders
**And** content is sourced from the single canonical file (no duplication across skills)
**And** the minimal bootstrap from Story 5.1 points to this command as the path to the full text

### Story 5.3: Contextual Help Sub-Commands

As an operator at any decision point,
I want contextual help sub-commands per FR43,
So that I can get just-in-time guidance without leaving the current flow.

**Acceptance Criteria:**

**Given** help registry populated with concepts + field definitions + flag documentation
**When** operator invokes `explain <concept>`
**Then** the system routes to the concept's help entry (e.g., `explain signals`, `explain lanes`, `explain qualifying-gate`)
**When** operator invokes `why <field>?`
**Then** system returns the field's definition + rationale
**When** operator invokes `what does this flag mean?` in context of a prompt
**Then** system returns the current flag's documentation
**And** unknown concepts fire `USER-NNN` with remediation suggesting `explain --list` to enumerate available concepts

### Story 5.4: Per-Skill Help Content + Progressive Disclosure

As an operator viewing a skill's help,
I want progressive disclosure by `user_skill_level` per AR-CONFIG + Decision 15,
So that I see concepts appropriate to my experience.

**Acceptance Criteria:**

**Given** every ILE-1 skill has `_bmad/bme/_ile/workflows/{skill-name}/help.md` with heading-tagged content
**When** help is rendered
**Then** tags `[beginner]`, `[intermediate]`, `[advanced]` filter by `user_skill_level` config
**And** `--verbose` flag overrides filter to show all sections
**And** `help-presence.test.js` asserts every ILE-1 skill directory contains `help.md`
**And** `help-registry.test.js` asserts every heading in every help.md has exactly one of the three tags

### Story 5.5: Persona-Matched RICE Calibration Examples

As an operator in the qualifying gate,
I want RICE examples that match my persona per FR44,
So that calibration signals are relevant to my scale.

**Acceptance Criteria:**

**Given** config key `persona: 'solo' | 'consulting'` in `_bmad/_config/ile.yaml`
**When** the qualifying gate displays RICE calibration examples
**Then** `solo` persona shows examples referencing single-product OSS contexts
**And** `consulting` persona shows examples referencing multi-client engagements
**And** default persona inferred from config (falls back to prompting on first use if absent)
**And** persona can be switched by editing the config file (no code change)

### Story 5.6: USER + INTERNAL Error Codes — Timeline-Aware Coverage

As a developer,
I want all USER-NNN + INTERNAL-NNN error codes known at E5's point in the timeline registered with `detailsShape` per FR46 + FR48,
So that Epic 5's discipline is enforced across all already-shipped error paths.

**Acceptance Criteria:**

**Given** codes thrown by Epics 1–4 (E1: INTERNAL-001 unregistered-code, INTERNAL-002 migration rollback; E2: USER-001 unauthorized qualifier, USER-002 invalid input; E3: USER-003 invalid filter; E4: USER-004 force-unlock misuse)
**When** E5's error-contract completeness check runs
**Then** every code known-at-this-point is registered with `message`, `remediation`, `detailsShape`
**And** fixture tests assert each registered code emits the documented shape
**And** full-20-code seed coverage assertion is Epic 6 scope (E5 asserts only codes-known-at-this-point)

### Story 5.7: `What to try:` Remediation Quality Pass

As an operator seeing any error,
I want every error's `What to try:` remediation to be concrete and actionable per FR45 + NFR28,
So that errors guide me to resolution.

**Acceptance Criteria:**

**Given** every registered error code (CONFIG-001–009, USER-001–004, INTERNAL-001–004)
**When** the remediation quality test runs
**Then** each code's remediation text is non-empty
**And** each contains at least one imperative verb (action-oriented)
**And** generic "error occurred" strings fail the test
**And** remediation is reviewed by human for concrete next-step quality

### Story 5.8: Error → Last-Consistent-State Behavior

As an operator recovering from any error,
I want error paths to return me to the last consistent state per FR52,
So that I don't lose progress mid-retry.

**Acceptance Criteria:**

**Given** any USER or CONFIG category error raised during a write operation
**When** the error propagates
**Then** the operator is returned to pre-error state with no partial writes committed (atomic-write discipline)
**And** retry with corrected input resumes cleanly
**When** an INTERNAL category error is raised
**Then** the operator sees guidance to run `convoke-doctor` for investigation
**And** integration tests verify across all write paths (intake log, qualify, rescore, migration)

### Story 5.9: First-Run Experience Integration Test

As a first-time operator adopting ILE-1,
I want a cohesive first-run experience from install through first qualify + first portfolio view,
So that I form a correct mental model of the tool without friction between individual feature surfaces.

**Acceptance Criteria:**

**Given** a clean repo with ILE-1 freshly installed (Story 1.14b) + no prior ILE-1 use
**When** an integration test walks the full first-time-user path
**Then** `/ile-doctor` reports green with beginner-friendly output
**And** `bmad-enhance-initiatives-backlog create` produces an empty backlog
**And** `bmad-enhance-initiatives-backlog triage` on sample text produces intakes + minimal-bootstrap lifecycle summary
**And** qualifying gate runs with persona-matched RICE examples (Story 5.5)
**And** `bmad-portfolio-status` renders with observability onboarding banner (Story 3.8)
**And** `explain <concept>` works at every decision point
**And** no orphaned ISWC frame, no uncleared breadcrumb, no unlogged decision across the full path
**And** test asserts that each prompt contains at least one `explain`-style help pointer to the next help registry entry

## Epic 6: Interaction Safety, Schema Evolution & Long-Term Viability

Destructive operations require explicit confirmation. Progress indication appears on operations > 2s. Backlog carries `schema_version`; v1.N skills read v1.(N-1) with deprecation warning; migrations run automatically on version mismatch with confirmation. Non-interactive `--migrate` for CI. Schema migrations are resume-safe and non-destructive by default. `/ile-force-unlock` skill polish. Skill portability via export pipeline + per-platform golden files.

### Story 6.1: Destructive-Op Confirmation Across All Workflows

As an operator,
I want destructive operations to require explicit-word confirmation per FR49,
So that I can't accidentally drop an intake, archive an absorbed item, or remove a portfolio attachment.

**Acceptance Criteria:**

**Given** any destructive operation (drop intake, archive absorbed item, remove portfolio attachment, `--purge-runtime-state` uninstall)
**When** the operator triggers the operation
**Then** an explicit-word confirmation prompt appears (exact phrase typed, not y/n)
**And** the prompt displays what will be destroyed + consequences
**And** typing anything except the exact phrase cancels the operation
**And** integration tests cover each destructive path with both confirm + cancel flows

### Story 6.2: Progress Indication on > 2s Operations

As an operator running a slow operation,
I want progress indication per FR51 + NFR30,
So that I know the skill hasn't hung.

**Acceptance Criteria:**

**Given** an operation expected to exceed ~2s interactive latency
**When** the operation runs
**Then** a progress indicator displays (spinner, percentage, or stage identifier)
**And** `heartbeat.tick(label)` labels feed the progress display (e.g., "index-build:parsing" shown as "Parsing artifacts...")
**And** consulting-scale `/ile-sync`, observability compute, and large migrations all show progress
**And** plain-text rendering conveys all critical info (color is informational only per NFR31)

### Story 6.3: `schema_version` Frontmatter + Deprecation Warning

As a developer,
I want `schema_version` frontmatter enforced + deprecation warning on v1.N reading v1.(N-1) per FR53 + FR54 + FR55,
So that schema evolution is explicit and backward compatibility is bounded.

**Acceptance Criteria:**

**Given** a backlog file
**When** an ILE-1 skill loads the file
**Then** frontmatter must contain `schema_version` as a monotonic integer
**And** writes missing `schema_version` fire `CONFIG-004`
**When** a v1.N skill reads a v1.(N-1) backlog
**Then** a deprecation WARN is emitted recommending migration
**When** a v1.N skill reads a pre-v1 unversioned backlog (and `ensureSchemaCurrent()` didn't already migrate)
**Then** `CONFIG-010` is raised requiring explicit migration
**And** fixture tests cover each version cross-read scenario

### Story 6.4: Schema-Bump Migration Machinery + Synthetic Test Fixture

As a developer,
I want schema-bump migration machinery + a synthetic test fixture per FR56 + AR-ADR5,
So that future real v1.N migrations work and CI exercises the full path.

**Acceptance Criteria:**

**Given** `schema-migrator.js` extended + `ile-data/test-fixture-v1.0.0-to-test-fixture-v1.1.0` synthetic migration at `tests/fixtures/ile/migrations/`
**When** a breaking-change migration is detected
**Then** operator is prompted with explicit-word confirmation + summary from `preview()` action list
**And** migration applies atomically (write-to-tmp → verify → rename per NFR13)
**And** Change Log records the migration entry
**When** migration fails mid-way
**Then** `INTERNAL-002` is raised + rollback leaves artifacts consistent
**And** CI integration test exercises the full breaking-change path

### Story 6.5: `--migrate` Non-Interactive Mode

As a maintainer running CI pipelines,
I want `--migrate` non-interactive mode per FR57,
So that migrations can run in automated contexts without prompts.

**Acceptance Criteria:**

**Given** any ILE-1 skill invoked with `--migrate` flag
**When** pending migrations are detected
**Then** all pending migrations are auto-accepted without prompts
**And** breaking-change migrations log WARN to debug log identifying what was auto-accepted
**When** a migration lacks a `preview()` action list (safety barrier)
**Then** `--migrate` refuses to auto-accept and reports which migration is blocking
**And** integration test verifies the non-interactive path

### Story 6.6: Resume-Safe Migration Semantics

As an operator recovering from an interrupted migration,
I want resume-safe semantics per NFR12,
So that crashes mid-migration don't corrupt my backlog.

**Acceptance Criteria:**

**Given** a migration interrupted mid-way
**When** the next `ensureSchemaCurrent()` runs
**Then** partial state is detected and migration resumes from the interruption point
**And** each migration is idempotent by construction (re-run on partial state completes cleanly)
**And** Change Log records resumption as a distinct entry (not confused with initial attempt)
**And** fixture tests interrupt migrations at various points and verify resume completion

### Story 6.7: `/ile-force-unlock` Polish

As an operator using force-unlock,
I want enriched display + safety checks per FR49 discipline,
So that I can make informed decisions without accidentally overriding legitimate work.

**Acceptance Criteria:**

**Given** Epic 1's minimum-viable `/ile-force-unlock` skill
**When** Epic 6 polishes the skill
**Then** lock-content display is pretty-printed with timestamps localized for readability (UTC preserved in audit)
**And** long-running migrations in-progress (recent `lastHeartbeat`) are flagged specifically with warning
**And** heartbeat < 5 min old triggers warn-with-reason (not automatic blocking, but prominent caution)
**And** diagnostic hints appear per skill if skill metadata is available
**And** cancellation on explicit-word mismatch returns operator to pre-force state without side effects

### Story 6.8: Skill Portability + Per-Platform Golden Files

As an operator on Copilot / Cursor (not just Claude Code),
I want ILE-1 skills to export cleanly per FR40 + NFR21,
So that I can use ILE-1 regardless of my LLM host.

**Acceptance Criteria:**

**Given** `bmad-validate-exports` extended with ILE-1-specific assertions
**When** ILE-1 skills are exported
**Then** schema roundtrip passes (exported skills re-import without semantic loss)
**And** no fixture-path leaks occur in exports
**And** per-platform golden files at `tests/fixtures/ile/portability-golden/{macos,linux,windows}/` match exactly
**And** CI `ile-portability-matrix` job runs per-platform and asserts match
**And** mismatch produces readable diff output for operator debugging

### Story 6.9: Git-Workflow Resilience Fixtures

As a team operator using standard git workflows,
I want backlog survival across merge / rebase / cherry-pick per NFR20,
So that my audit trail and lifecycle state aren't corrupted by ordinary git operations.

**Acceptance Criteria:**

**Given** fixture set at `tests/fixtures/ile/git-workflow/{merge-clean,merge-conflict,rebase,cherry-pick}/`
**When** each fixture's git scenario is reproduced
**Then** the backlog file is parseable post-operation
**And** the backlog passes `backlog.schema.json` validation
**And** `merge-conflict/` fixture documents conflict-resolution guidance for operators
**And** integration tests run all 4 fixtures + assert pass

### Story 6.10: Full 20-Code Seed Coverage + v1 Release Gate

**Gate-aggregator note**: This story aggregates the outcomes of many prior stories — it does NOT re-implement them. Required-green input stories: **1.15** (security static analysis), **1.16** (LOC budget), **3.6** (consulting-scale NFR fixture), **4.8** (TAC1 trust-contract fixtures), **5.6 + 5.7** (error-code coverage + remediation quality), **6.4** (schema-bump machinery), **6.6** (resume-safe migration), **6.8** (portability goldens), **6.9** (git-workflow fixtures), **6.11** (log format stability).

As a release engineer,
I want the full 20-code seed coverage assertion + complete v1 gate checks per NFR28 + NFR14,
So that we know v1 is shipment-ready.

**Acceptance Criteria:**

**Given** all input stories listed above are green + all seed codes registered across Epics 1–5 + Epic 6 additions
**When** the final release gate runs
**Then** full 20-code seed coverage is verified (5 USER + 5 canonical CONFIG + 5 INTERNAL + 5 UNCERTAIN; plus CONFIG-006–011 extensions)
**And** each code has `detailsShape`, `message`, `remediation`; fixture asserts emission produces documented shape
**And** `[INTERNAL]` error rate < 1% per 100-invocation window (NFR14) verified via instrumented fixture
**And** all conformance tests green (inputs listed above)
**And** all portability goldens match (Story 6.8 output)
**And** NFR1/NFR2 fixtures green at 60/150/300 artifact scales (Story 3.6 output)
**And** `convoke-doctor` reports green on a clean install (Story 1.12 output)
**And** uninstall round-trip verified — install → use → uninstall → re-install with archived-log recovery (Story 1.13c + Story 4.6 + Story 6.8 integration)

### Story 6.11: Log Format Stability Test (NFR26)

As a release engineer preserving log consumer compatibility,
I want a log-format stability test per NFR26,
So that patch/minor releases don't silently break downstream log consumers or observability readers.

**Acceptance Criteria:**

**Given** a golden-fixture debug log generated from a canonical scenario + JSON Schema at `debug-log-entry.schema.json`
**When** the stability test runs on a PR
**Then** current release's debug log output is validated against the same schema as the prior release
**And** any breaking format change (removed field, renamed field, type change) fails the test
**And** breaking format changes are allowed only with a CHANGELOG entry referencing `NFR26-break` tag + explicit maintainer sign-off
**And** additive changes (new optional fields) pass without CHANGELOG requirement
