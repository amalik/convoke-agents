---
stepsCompleted:
  - step-01-validate-prerequisites
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

*(To be populated in Step 2 during epic design)*

## Epic List

*(To be populated in Step 2 during epic design)*
