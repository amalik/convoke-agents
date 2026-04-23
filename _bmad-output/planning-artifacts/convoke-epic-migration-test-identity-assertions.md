---
initiative: convoke
artifact_type: epic
created: 2026-04-23T00:00:00.000Z
schema_version: 1
status: active
inputDocuments:
  - _bmad-output/implementation-artifacts/sprint-status.yaml
  - _bmad-output/implementation-artifacts/v63-1a-4-create-migration-script-3-x-to-4-0-js.md
  - tests/integration/upgrade.test.js
  - scripts/update/migrations/registry.js
---

# Epic mig-test-1 — Migration Chain Test Identity Assertions

## Overview

This epic closes a rotted-count regression surfaced 2026-04-23 during a CI triage: three integration tests in [tests/integration/upgrade.test.js](../../tests/integration/upgrade.test.js) are failing (2026-04-23 local repro: 82/85 integration-pass) because Story 1A.4 appended four new **breaking** migrations (`3.3.x-to-4.0.0` + parallel entries `3.0.x/3.1.x/3.2.x-to-4.0.0`) to [scripts/update/migrations/registry.js](../../scripts/update/migrations/registry.js), which extended every upstream migration chain by one hop and added one breaking change. The upgrade tests hardcoded pre-4.0 counts (`length === 1`, `length === 2`), so the chain extension rotted the assertions silently — the three failures propagate across the CI `test` matrix (Node 18/20/22) and the `coverage` job.

This is a textbook instance of the [derive-counts-from-source](../../project-context.md) rule (*"Tests that assert counts must derive those counts from the authoritative source — never hardcode them"*). The fix replaces count assertions with *identity* assertions — the tests assert which migrations appear in the chain (by name) and which breaking descriptions surface (by substring match), not how many.

**Source documents:**
- [sprint-status.yaml 2026-04-22 commentary on lint-1.1 dev-story](../implementation-artifacts/sprint-status.yaml) — documents the three failures as "1A.4 territory, scope-excluded per AC5"
- [Story 1A.4 file](../implementation-artifacts/v63-1a-4-create-migration-script-3-x-to-4-0-js.md) — the origin of the new migration entries; NOT reopened per `code-review-convergence`
- [scripts/update/migrations/registry.js](../../scripts/update/migrations/registry.js) — the authoritative source the tests must derive from

**Why now:** CI has been red since 1A.4 shipped its registry delta. The merge queue is blocked on every PR that touches anything the `test` or `coverage` jobs gate. This is the *only* reason those four CI jobs are red — fixing three assertions unblocks everything.

**Stakeholder:** Platform maintainers + every future dev agent who appends a migration to the registry (identity-based assertions are append-safe; count-based are not).

## Requirements Inventory

Epic mig-test-1 has no formal PRD — it closes one CI-observable regression plus the pattern gap that allowed it. The FRs below restate the fix scope.

### Functional Requirements

FR1: [tests/integration/upgrade.test.js:130](../../tests/integration/upgrade.test.js) — the assertion `assert.equal(changes.length, 1)` in *"reports breaking changes for v1.3.8 (chain reaches 1.7.x-to-2.0.0)"* MUST be replaced with an identity assertion that verifies the chain **contains** a breaking change whose description includes `"Product rename"`, without asserting total count. *(Source: 2026-04-23 repro, `2 !== 1` AssertionError)*

FR2: [tests/integration/upgrade.test.js:404](../../tests/integration/upgrade.test.js) — the assertion `assert.equal(migrations.length, 2)` in *"finds applicable migrations for v1.7.1 (chains to 2.0.x)"* MUST be replaced with an identity assertion that verifies the first two chain entries are `1.7.x-to-2.0.0` (breaking) and `2.0.x-to-3.1.0` in order, without asserting total count. The existing `migrations[0].name` and `migrations[1].name` checks are retained; only the length assertion is removed. *(Source: 2026-04-23 repro, `3 !== 2` AssertionError)*

FR3: [tests/integration/upgrade.test.js:412](../../tests/integration/upgrade.test.js) — the assertion `assert.equal(changes.length, 1)` in *"reports breaking changes for v1.7.1"* MUST be replaced with an identity assertion that verifies the chain **contains** a breaking change describing the rename (existing substring check `rename`/`Convoke` is retained and becomes authoritative). *(Source: 2026-04-23 repro, `2 !== 1` AssertionError)*

FR4: No changes to [scripts/update/migrations/registry.js](../../scripts/update/migrations/registry.js). The fix is test-side only. Registry is the authoritative source; the tests must derive from it, not the inverse.

FR5: Full CI matrix — `npm run lint` + `npm test` + `npm run test:integration` + `npm run test:coverage` — MUST exit clean before the story moves to `review`. This closes the lint-1.1 DoD gate (`lint-passes-before-review`) plus the analogous test-gate (run integration tests before review, not just unit).

### Non-Functional Requirements

NFR1: Behavior-preserving — no changes to production code; assertion replacements do not alter the semantic intent of the tests (the *identity* they assert is the same thing the original authors intended; `derive-counts-from-source` just makes that identity explicit).

NFR2: Append-safe — the new assertions MUST continue to pass if a future migration is appended to the registry that extends any of the tested chains. Verification: add a mental-model migration `4.0.x-to-5.0.0` locally and confirm all three tests stay green without modification.

NFR3: Code-review per `code-review-convergence` — Round 1 mandatory; Round 2 only if Round 1 produces HIGH findings; no Round 4. Given scope (three assertion edits in one file), Round 1 is expected to converge.

NFR4: Scope discipline — similar count-based patterns elsewhere in the test suite MUST NOT be silently refactored in this story. If the implementer finds ≥2 additional hardcoded-count assertions against registry APIs during implementation, log as a follow-up backlog item (`derive-counts-from-source` compliance sweep) — do not scope-creep.

### Additional Requirements (from project-context.md)

- **`derive-counts-from-source`:** The governing rule for this epic. The story MUST cite this rule by name in its opening section.
- **`code-review-convergence`:** Preserved — this epic does NOT reopen Story 1A.4. Story 1A.4 converged at its review; this is a forward-going remediation artifact, identical in structure to lint-1.1's relationship to Story 1A.2.
- **`test-fixture-isolation`:** Applies — the existing `upgrade.test.js` suite uses `tmpDir` fixtures already. No new fixture setup needed; the three assertion changes are inside existing `before()` scopes.
- **`spec-verify-referenced-files`:** Verified 2026-04-23 — [tests/integration/upgrade.test.js](../../tests/integration/upgrade.test.js) and [scripts/update/migrations/registry.js](../../scripts/update/migrations/registry.js) exist at epic-creation time; line anchors `130`, `404`, `412` verified by Read during triage.
- **`namespace-decision-for-new-skills`:** N/A — no skills, workflows, or agents under `_bmad/bme/` are touched.
- **`covenant-compliance-for-convoke-skills`:** N/A — same reason as above.
- **`path-safety-for-destructive-ops`:** N/A — no scripts accepting user paths or performing destructive ops are touched.
- **`mechanical-research-enumeration`:** The three assertion sites were enumerated mechanically via `npm run test:integration` failure output 2026-04-23 (not eyeballed). Raw failure output is cited in the story's evidence section.
- **`lint-passes-before-review`:** FR5 applies this rule directly. `npm run lint` must be clean for the story's touched files before `review`.

## Stories

| ID | Title | Status | Notes |
|---|---|---|---|
| mig-test-1.1 | Replace hardcoded chain-count assertions with identity assertions in `upgrade.test.js` | backlog | Single story; covers FR1–FR5. |

## Convergence & Sequencing

- **Pre-conditions:** None. The fix is self-contained in one test file. Can ship immediately.
- **Parallel with:** v63-1a-6 (currently in `review`), v63-2-1 (currently `in-progress`). No file overlap — this story touches only `tests/integration/upgrade.test.js`; 1A.6 and 2-1 touch different surfaces.
- **Unblocks:** Every PR currently blocked by the `test × Node 18/20/22` + `coverage` CI jobs. Specifically — v63-1a-6 Round 2 code review cannot complete validation without a green CI baseline.
- **Retrospective:** Optional (single-story epic, scar-pattern well-understood). If a *third* rotted-count regression surfaces within the next two migration-registry appends (i.e., the two-strike rule fires), run a retro and evaluate an ESLint / review-time rule to catch `assert.equal(*.length, <number>)` against registry APIs.

## Out of Scope (for this epic, future-candidates for backlog)

- **Compliance sweep.** A proactive scan for other hardcoded-count assertions against any registry/manifest/config API. If the implementer trips over ≥2 during implementation, log a backlog item; otherwise deferred.
- **Automated `derive-counts-from-source` enforcement.** An ESLint rule or review-time check that flags `assert.equal(*.length, <number>)` where `*` is known to derive from a registry. Deferred — manual enforcement + the scar-story in [project-context.md](../../project-context.md) is the current gate; promote to automation only if the current gate fails again.
- **Registry-schema changes.** The registry contract is intentionally append-only. Any change to `registry.js`'s API shape is out of scope for this epic.
