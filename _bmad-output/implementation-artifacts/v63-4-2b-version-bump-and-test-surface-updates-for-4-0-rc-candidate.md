---
initiative: convoke
artifact_type: story
qualifier: v63-4-2b-version-bump-and-test-surface-updates-for-4-0-rc-candidate
created: '2026-04-28'
schema_version: 1
epic: v63-epic-4
---

# Story 4.2b: Version bump + test-surface updates for 4.0 RC candidate

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

**Epic:** [Epic 4 — Validated Behavioral Equivalence](../planning-artifacts/convoke-epic-bmad-v6.3-adoption.md#epic-4-validated-behavioral-equivalence)
**Sprint:** 4 (PF1 stream — **inserted between Story 4.2 and Story 4.3 to close a load-bearing spec gap discovered during Story 4.3's first dev-story attempt 2026-04-28**).
**FR coverage:** none new — closes a missing precondition for Story 4.3 Task 0.5(b) (FR39 release-blocking gate).
**NFR coverage:** none new — preserves existing test invariants.
**Failure modes addressed:** **FM-SPEC-GAP-1 (newly identified 2026-04-28).** Story 4.3 Task 0.5(b) requires `package.json` to be 4.0 candidate as a *precondition*, but Story 4.3 AC7 forbids modifying `package.json/package-lock.json` *within* the story. Empirical evidence: bumping `3.3.0 → 4.0.0-rc.1` immediately fails ~20 unit tests + at least 1 integration test in `convoke-update`, `runMigrations`, `validateConfigStructure`/`validateInstallation` test surfaces. No existing story owned the version-bump-with-companion-test-updates work; Story 5B.3 owns the release commit but runs *after* 4.3 — chicken-and-egg. Story 4.2b closes the gap by pairing the bump with the necessary test-surface updates in a single, scoped story.

**Why this story is BUILDABLE NOW:** Pure dev work — no LLM, no API key, no operator interaction. ~4-8 hours of (a) bumping `package.json`, (b) walking the failing tests file-by-file, (c) applying minimum fix per test (fixture update, assertion update, or migration-aware setup), (d) verifying full suite green. No spike, no migration sandbox, no recordings. Standard dev-story shape with clear success criterion (all tests pass).

**Why this story is NOT a release-blocking gate (in contrast to Story 4.3):** This story produces no PASS/FAIL gate verdict. It is a precondition-satisfier that unblocks Story 4.3's Task 0.5(b). Once shipped, Story 4.3 Task 0 pre-flight checks pass and the PF1 cycle can run.

**Upstream dependencies:**
- **Story 1A.4 (DONE)** — provides `scripts/update/migrations/3.3.x-to-4.0.0.js` (verified 2026-04-28: `ls scripts/update/migrations/ | grep 3.3.x-to-4.0.0.js` returns the path). The new migration is what extends the chain and breaks the test fixtures.
- **Stories 4.1 + 4.2 + 4.4 (DONE)** — the rest of Epic 4's pre-release work; nothing new from them needed.
- **No new external deps** — Node built-ins + existing test framework only.

**Downstream consumers:**
- **Story 4.3** — Task 0.5(b) precondition becomes permanently green after this story ships. Story 4.3 dev-story can resume immediately.
- **Stories 4.5 + 5B.3** — also gated on 4.0 candidate version; this story unblocks them by transitivity.
- **No code consumes this story's outputs directly** — outputs are `package.json` version field + updated tests; consumed by CI / release infrastructure, not by app code.

**Namespace decision:** Convoke namespace (`package.json`, `tests/unit/`). NOT a `_bmad/bme/` skill — covenant-compliance-checklist N/A. Tests are pre-existing Convoke surfaces, not new skill authorship.

**Path safety analysis:** N/A — no destructive operations; no user-provided paths; just version field edit + test-file edits.

## Story

As Convoke maintainer (Amalik) preparing the v4.0 release sequence,
I want **`package.json` bumped to `4.0.0-rc.1` and all unit/integration tests passing under the bumped version**,
so that Story 4.3's Task 0.5(b) precondition is permanently satisfied and the release sequence (4.3 → 4.5 → 5B.3) can proceed without test regressions blocking the gate.

**Story shape:** **code-authoring + test-maintenance / no-operator-interaction / shippable-in-single-session**. Pure dev work; no HALT-for-operator steps; no spikes; no fixtures to author from scratch. Walk failing tests, apply minimum fix, verify green. Larger than a typo fix; smaller than Story 4.2 (~no new code beyond test edits).

**Empirical baseline (probed 2026-04-28):**

| Probe | Result | Spec impact |
|-------|--------|-------------|
| Pre-bump `npm test` | ✓ — `tests 1492 / pass 1491 / skip 1 / fail 0` (post-Story-4.4) | AC1 baseline |
| Pre-bump `npm run test:integration` | ✓ — `tests 93 / pass 93 / fail 0` (per Story 4.3 spec) | AC2 baseline |
| Pre-bump `npm run lint` | ✓ — clean (verified 2026-04-28 under bumped state too — lint is version-independent) | AC3 baseline |
| **Post-bump `npm test`** | ⚠️ — **~20 tests fail** across 4 files (see "Affected test surfaces" table below) | Tasks 2-5 fix |
| **Post-bump `npm run test:integration`** | ⚠️ — at least 1 hook-level failure (`actual: 1, expected: 0` in `Suite.runHook`) | Task 6 investigates |
| Hardcoded `3.3.0` in failing test files | ✗ — only 1 comment reference in `convoke-update.test.js:752`; no assertion-level coupling | Test failures are INDIRECT coupling (via `getPackageVersion()` → migration chain), not direct |
| `scripts/update/migrations/3.3.x-to-4.0.0.js` | ✓ — exists (Story 1A.4 deliverable) | Confirmed; migration chain extension is the proximate cause of test failures |
| **All three** `3.x-to-4.0.0.js` migrations exist | ✓ — `3.1.x-to-4.0.0.js`, `3.2.x-to-4.0.0.js`, `3.3.x-to-4.0.0.js` all present | Tests starting from 1.4.x or 1.5.2 walk through ALL three; chain extension affects every from-version test, not just 3.3.x-to-4.0.0 |
| `convoke-update.test.js:752` comment | ✓ — references "the migration chain lands on a -to-4.0.0 hop" | Authorial note — Story 1A.4 author anticipated this surface but did not retire all coupling |

**Affected test surfaces (concrete file:line catalog from 2026-04-28 probe):**

| File | Line | Test | Likely root cause |
|------|------|------|---------|
| `tests/unit/convoke-update-governance.test.js` | 76 | emits governance section header on successful upgrade-path update | convoke-update flow now walks 3.3.x-to-4.0.0 migration; fixture state mismatch |
| `tests/unit/convoke-update-governance.test.js` | 99 | emits governance section header on successful refresh-only update | same |
| `tests/unit/convoke-update-governance.test.js` | 133 | emits yellow ⚠ when bmm-dependencies.csv is absent post-upgrade (softWarning) | same |
| `tests/unit/convoke-update-governance.test.js` | 165 | renders "Post-upgrade governance check:" section header | same |
| `tests/unit/convoke-update-governance.test.js` | 183 | exits 0 even when governance warnings are surfaced | same |
| `tests/unit/convoke-update.test.js` | 405 | skips confirmation with --yes flag | same |
| `tests/unit/convoke-update.test.js` | 478 | runs migration when user confirms with y | same |
| `tests/unit/convoke-update.test.js` | 532 | updates config version and agents after upgrade with --yes | same |
| `tests/unit/migration-runner-orchestration.test.js` | 27 | runs a full migration cycle (1.4.x → current) | `runMigrations('1.4.1')` chain now extends to 4.0.0; fixture state at end-of-chain mismatched |
| `tests/unit/migration-runner-orchestration.test.js` | 42 | creates a migration log file | log contents include 4.0.0 hop; downstream assertion mismatch |
| `tests/unit/migration-runner-orchestration.test.js` | 59 | updates migration history in config.yaml | history now includes 4.0.0 entry; assertion may need length update |
| `tests/unit/migration-runner-orchestration.test.js` | 170 | removes stale lock and proceeds | likely cascade from 27 |
| `tests/unit/migration-runner-orchestration.test.js` | 205 | skips already-applied migrations on second run | history-filtering on extended chain |
| `tests/unit/migration-runner-orchestration.test.js` | 249 | skips pre-applied migration and continues with remaining flow | same |
| `tests/unit/migration-runner-orchestration.test.js` | 298 | applies full migration chain from 1.5.2 and records all in history | chain extension |
| `tests/unit/migration-runner-orchestration.test.js` | 335 | second run is idempotent — zero deltas applied | history-filter under extended chain |
| `tests/unit/migration-runner-orchestration.test.js` | 366 | `dry-run after real run shows no migrations to preview` | dry-run logic now sees the new 4.0.0 hops in chain |
| `tests/unit/migration-runner-orchestration.test.js` | 400 | `creates an error log when migration fails` | error-log content includes 4.0.0 hop entry |
| `tests/unit/validator.test.js` | 65 | `passes for valid config` (inside `describe('validateConfigStructure')` at line 28) | fixture's `fullConfig()` helper builds version field that must match `getPackageVersion()`; bump breaks the match |
| `tests/unit/validator.test.js` | 451 | `returns valid:true for a complete installation` (inside `describe('validateInstallation')` at line 439) | `validateInstallation` checks include version-match; bump breaks the match |
| `tests/integration/<unknown>` | — | (integration suite hook-level failure: `actual: 1, expected: 0`) | Task 6 investigates; may be the same surface, different framing |

## Acceptance Criteria

### Decisions (pinned at spec-author time)

**Decision 1 — Fix preference order: assertion update > fixture update > test rewrite.**
- **Preferred (assertion update):** if the test asserts on a count, length, or specific value that has shifted by exactly +1 (the new 4.0 hop), update the assertion to reflect the extended chain. Cheapest, most truthful fix.
- **Fallback (fixture update):** if the test fixture's end-state doesn't match what the new migration produces, update the fixture's expected post-state. Slightly more involved but bounded.
- **Last resort (test rewrite):** if a test is fundamentally coupled to "current chain ends at 3.x," rewrite it to use explicit `runMigrations(from, to)` form OR pin the from/to via fixture so the test is version-agnostic going forward. Most expensive; avoid unless first two don't apply.
- **Per `test-fixture-isolation` rule** (project-context.md): the rewrite path is the architecturally correct answer for any test that ends up coupled to "current version" semantics. Apply judgment: if the rewrite is a 5-line change, do it; if it's a 50-line change, prefer assertion update + log a `D-V42b-Rn` deferred-work item for a later isolation pass.

**Decision 2 — DO NOT modify the migration script `3.3.x-to-4.0.0.js`.** That script is Story 1A.4's frozen deliverable and is the source-of-truth for what the 4.0 migration actually does. If a test fails because of a real migration bug (not a fixture mismatch), surface it as a separate Bug-Lane item per BUG-6 precedent — do NOT fix it from inside Story 4.2b's scope.

**Decision 3 — DO NOT modify any production code in `scripts/update/lib/` or related libraries, with ONE narrow exception (amended 2026-04-28).** This story is test-surface maintenance only. If a test failure points to a real production code defect, surface as separate Bug-Lane item.

**Exception (operator-approved 2026-04-28 via Option B path):** The version-validation regex at `scripts/update/lib/config-merger.js:212` MAY be updated within this story's scope. Specifically: the regex `/^\d+\.\d+\.\d+$/` (which rejects semver pre-release suffixes like `4.0.0-rc.1`) is the proximate cause of every Tasks 2-6 failure — it's the load-bearing chain-link between "4.0.0-rc.1 in package.json" and "tests pass." Without this fix, the bump cannot stand and Story 4.2b cannot meet AC2/AC3. The fix is a 1-character regex change (`/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/` per [semver spec section 9](https://semver.org/#spec-item-9)) plus updating the error message + adding 1-2 unit tests covering pre-release-format acceptance + 1 unit test confirming the regex still rejects malformed versions (e.g., `4.0`, `4.0.0.0`). Scope is bounded: only the regex line + its companion error message + co-located validator tests in `tests/unit/config-merger.test.js` (or whichever test file currently covers `validateConfig`). NO other production code edits in this story.

**Why amend in-place (not separate Bug-Lane fix):** the defect is intrinsic to "make 4.0.0-rc.1 viable as current version" — exactly Story 4.2b's scope. Authoring a separate bug-lane story for a 1-character regex update is bureaucratic overhead that doesn't improve quality. Decision 3's original intent was preventing scope creep on *unrelated* production-code defects; this one is the load-bearing mechanism the story is built around.

**Decision 4 — DO NOT modify any test that is currently passing.** The 1492-test baseline is the floor; only the ~20 failing tests + integration hook are in scope. Touching passing tests is scope creep.

**Decision 5 — Rerun discovery probe before fixing each file.** The 2026-04-28 baseline (1492/1491/1/0 pre-bump; ~20 unit + 1 integration fail post-bump) is the spec-author-time probe. Dev-time may differ if Story 4.4's recent ship adds more tests, or if I62/related work landed since. Before each test-file fix, rerun `npm test 2>&1 | grep -E "^✖" | grep "<file>"` to confirm the file's failure inventory is what the spec describes. **YELLOW** if inventory differs by ≤2 tests (proceed with caution); **RED** if inventory differs by >2 tests (escalate before fixing).

---

**AC1 — Version bump applied + visible in `package.json`.**
**Given** Story 4.2b dev-story start
**When** Task 1 runs
**Then**:
- `grep '"version":' package.json` returns `"version": "4.0.0-rc.1",`.
- No other `package.json` fields modified (verified by `git diff package.json` showing only the version line).
- `package-lock.json` version field synced if it exists and tracks `package.json` (run `npm install --package-lock-only` if needed; verify no other `package-lock.json` mutations).

**AC2 — `npm test` passes 100% post-bump.**
**Given** AC1 applied + Tasks 2-5 complete
**When** `npm test` runs
**Then**:
- `tests N / pass N-1 / skip 1 / fail 0` where `N ≥ 1492` (the post-Story-4.4 baseline; may be higher if other stories added tests since).
- All ~20 previously-failing tests in the spec table now pass.
- No new failures introduced in tests that were passing pre-bump.
- Run on a clean checkout (no stash, no in-flight uncommitted changes from other stories) — see Decision 4 + AC7.

**AC3 — `npm run test:integration` passes 100% post-bump.**
**Given** AC1 applied + Task 6 complete
**When** `npm run test:integration` runs
**Then**:
- `tests 93 / pass 93 / fail 0` (or higher if Story 4.4 added integration tests — verify expected count from pre-bump probe).
- The hook-level `actual: 1, expected: 0` failure observed under bump is resolved.
- If the integration failure roots to a real production defect (per Decision 3), HALT and route to Bug-Lane.

**AC4 — `npm run lint` clean per `lint-passes-before-review` rule.**
**Given** AC1-AC3 complete
**When** `npm run lint` runs unprefixed (CI parity)
**Then**:
- Exit 0.
- Zero new warnings or errors in any file the story modifies (per `lint-passes-before-review` rule's scope-of-touched-files clause).

**AC5 — Story 4.3 Task 0.5(b) precondition permanently satisfied.**
**Given** AC1-AC4 complete
**When** Story 4.3 Task 0.5 pre-flight is rerun
**Then**:
- `grep '"version":' package.json` returns 4.0 candidate (PASSES).
- `scripts/update/migrations/3.3.x-to-4.0.0.js` exists (already passing pre-Story-4.2b).
- All v6.3 implementation work continues to show `done` in sprint-status.yaml.
- Story 4.3 dev-story can resume Task 1 (FM4-2 spike) without HALT at Task 0.

**AC6 — Validation gates green at story close.**
- [ ] 6.1 `npm test 2>&1 | tail -10` shows `fail 0`.
- [ ] 6.2 `npm run test:integration 2>&1 | tail -10` shows `fail 0`.
- [ ] 6.3 `npm run lint 2>&1 | tail -10` clean.
- [ ] 6.4 `git diff HEAD --stat` confirms scope = AC7 file set.

**AC7 — Scope discipline.**
- IN scope (NEW files):
  - This story file.
- IN scope (MODIFIED):
  - `package.json` (version field only).
  - `package-lock.json` (version field sync only — `npm install --package-lock-only` is the only permitted mutation).
  - **`scripts/update/lib/config-merger.js`** (regex line at `:212` + companion error-message text only — per Decision 3 narrow exception).
  - `tests/unit/convoke-update-governance.test.js` (5 tests at lines 76, 99, 133, 165, 183).
  - `tests/unit/convoke-update.test.js` (3 tests at lines 405, 478, 532).
  - `tests/unit/migration-runner-orchestration.test.js` (10 tests at lines 27, 42, 59, 170, 205, 249, 298, 335, 366, 400).
  - `tests/unit/validator.test.js` (2 tests at lines 65, 451).
  - **`tests/unit/config-merger.test.js`** (or wherever `validateConfig` is currently tested) — add 1-2 pre-release-format-acceptance tests + 1 reject-malformed-version test per Decision 3 exception.
  - One or more integration test files in `tests/integration/` (TBD per Task 6 investigation; bound to whatever the hook-level failure roots to).
  - `_bmad-output/implementation-artifacts/sprint-status.yaml` — status transitions + `last_updated` entry.
  - This story file (Tasks/Subtasks checkboxes + Dev Agent Record + File List + Change Log + Status).
- MUST NOT touch:
  - `scripts/update/migrations/3.3.x-to-4.0.0.js` (Story 1A.4 frozen surface — Decision 2).
  - Any `scripts/update/lib/*` production code **except the one line at `config-merger.js:212` + its error message** (Decision 3 narrow exception).
  - Any test that is currently passing (Decision 4).
  - Any `_bmad/` files.
  - Any other `package.json` fields beyond the version line.
- **Escape hatch (per BUG-6 precedent):** if a test failure surfaces a real production defect (migration bug, validator regression, governance gate logic flaw), STOP fixing the test, document the defect, route to Bug-Lane via `bmad-enhance-initiatives-backlog`, and HALT Story 4.2b for operator triage. Do NOT silently fix production code from inside this story.

## Tasks / Subtasks

- [x] **Task 0: Pre-flight gates.**
  - [x] 0.1 Confirm Stories 1A.4, 4.1, 4.2, 4.4 status `done` in sprint-status.yaml. ✅ All confirmed done.
  - [x] 0.2 Confirm test baseline pre-bump: `npm test 2>&1 | tail -5` shows `fail 0`. ✅ 1492/1491/1/0.
  - [x] 0.3 Confirm integration baseline pre-bump: `npm run test:integration 2>&1 | tail -5` shows `fail 0`. ✅ 93/93/0.
  - [x] 0.4 Confirm migration script exists: `ls scripts/update/migrations/3.3.x-to-4.0.0.js` returns the path. ✅
  - [x] 0.5 Run staleness pre-flight per `staleness-preflight-for-backlog-pickup` rule. ✅ Same-day-as-pickup; pre-flight not required.

- [x] **Task 1: Apply version bump.**
  - [x] 1.1 Edit `package.json`: change `"version": "3.3.0"` → `"version": "4.0.0-rc.1"`. ✅
  - [x] 1.2 Sync `package-lock.json`: `npm install --package-lock-only`. ✅ minimal diff.
  - [x] 1.3 Verify bump applied. ✅ both files at `4.0.0-rc.1`.

- [x] **Task 1.5: Update version-validation regex per Decision 3 exception.**
  - [x] 1.5.1 Edit `scripts/update/lib/config-merger.js:212`: regex `/^\d+\.\d+\.\d+$/` → `/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/`. ✅
  - [x] 1.5.2 Update companion error message. ✅
  - [x] 1.5.3 Locate existing tests for `validateConfig`. ✅ Found in `tests/unit/config-merger.test.js` (line 48 `describe('validateConfig')`) and `tests/unit/config-merger-negative.test.js` (multiple negative cases).
  - [x] 1.5.4 Add 4 new tests covering: (a) `4.0.0-rc.1` accepted, (b) `4.0.0-alpha.0` accepted, (c) `4.0` still rejected (incomplete), (d) `4.0.0.0` still rejected (too many parts). ✅ added at `tests/unit/config-merger.test.js:79-118`. **Plus repurposed 1 obsolete negative test at `tests/unit/config-merger-negative.test.js:116-128`** (was "rejects version with alpha characters" using `1.0.0-beta` — now valid; repurposed to "rejects version with invalid pre-release characters" using `1.0.0-beta!` — still rejected). Repurpose covered by Decision 3 exception language ("wherever validateConfig is currently tested").
  - [x] 1.5.5 Run config-merger tests in isolation. ✅ 43/43 pass.

- [x] **Task 2: Fix `tests/unit/migration-runner-orchestration.test.js` (10 tests).** ✅ **All 14/14 tests pass with ZERO test edits.** Root cause was unified at Task 1.5 (regex defect); no per-test walking required. The "test-surface coupling" hypothesis in the spec was wrong.
  - [x] 2.1 Probe rerun confirmed inventory matches spec (Decision 5 GREEN). ✅
  - [x] 2.2 No per-test walking needed — Task 1.5 regex fix unblocked all failures.
  - [x] 2.3 Single post-fix probe at end. ✅
  - [x] 2.4 `node --test tests/unit/migration-runner-orchestration.test.js`: 14/14 pass. ✅

- [x] **Task 3: Fix `tests/unit/convoke-update-governance.test.js` (5 tests).** ✅ **All 9/9 tests pass with ZERO test edits.** Same unified root cause as Task 2.
  - [x] 3.1-3.4 ✅ `node --test tests/unit/convoke-update-governance.test.js`: 9/9 pass.

- [x] **Task 4: Fix `tests/unit/convoke-update.test.js` (3 tests).** ✅ **All 40/40 tests pass with ZERO test edits.** Same unified root cause.
  - [x] 4.1-4.4 ✅ `node --test tests/unit/convoke-update.test.js`: 40/40 pass.
  - [x] 4.3 Comment at line 752 unchanged (authorial context, semantics still hold).

- [x] **Task 5: Fix `tests/unit/validator.test.js` (2 tests).** ✅ **All 74/74 tests pass with ZERO test edits.** Same unified root cause.
  - [x] 5.1-5.3 ✅ `node --test tests/unit/validator.test.js`: 74/74 pass.

- [x] **Task 6: Investigate + fix integration suite hook-level failure.** ✅ **Integration suite 93/93 pass with ZERO edits.** Same unified root cause — the regex fix resolved the integration suite hook failure too. The original `actual: 1 expected: 0` error was a downstream effect of `validateInstallation` failing on bumped version.
  - [x] 6.1-6.4 ✅ `npm run test:integration`: 93/93 pass.

- [x] **Task 7: Validation gates (AC6).** ✅ all gates green.
  - [x] 7.1 `npm test`: tests 1496 / pass 1495 / fail 0 / skipped 1. ✅ (count went from 1492 → 1496 due to 4 new pre-release-format tests in `config-merger.test.js`; net pass 1491 → 1495.)
  - [x] 7.2 `npm run test:integration`: 93/93 pass. ✅
  - [x] 7.3 `npm run lint`: exit 0 clean. ✅
  - [x] 7.4 `git diff HEAD --stat` scope verified — AC7 file set respected (see File List below). ✅

- [x] **Task 8: Verify Story 4.3 Task 0.5 precondition permanently green (AC5).** ✅
  - [x] 8.1 (a) v6.3 implementation work `done`: ✅ all upstream stories `done` in sprint-status.yaml; (b) `package.json` is 4.0 candidate: ✅ `4.0.0-rc.1`; (c) `scripts/update/migrations/3.3.x-to-4.0.0.js` exists: ✅. **All three preconditions PERMANENTLY GREEN until 4.0 ships.**
  - [x] 8.2 **Story 4.3 Task 0.5 precondition unblocked; dev-story can resume.** Spec gap closure marker recorded.

## Dev Notes

**Decision rationales (compact):** D1 = fix preference order (assertion > fixture > rewrite) optimizes for cheapest-truthful-fix. D2 = migration script frozen per Story 1A.4 ownership. D3 = no production code edits (test maintenance only). D4 = passing tests are the floor; touching them is scope creep. D5 = rerun-probe discipline against per-file inventory before fixing.

**Anti-patterns to avoid (top 5):**
- DON'T edit `scripts/update/migrations/3.3.x-to-4.0.0.js` to "fix" failing tests — that's a Story 1A.4 frozen surface.
- DON'T skim assertions and assume they need to change — read each test's intent first; the right fix may be a fixture update, not an assertion edit.
- DON'T add `// eslint-disable` comments to silence lint — fix the underlying issue per `lint-passes-before-review` rule.
- DON'T update tests that were passing pre-bump — they are out of scope; touching them is scope creep (Decision 4).
- DON'T silently fix a production-code regression you discover — surface to Bug-Lane per BUG-6 precedent and HALT (Decision 3 + AC7 escape hatch).

**External dependencies + risk (compact):**

| ID | Risk | Mitigation |
|----|------|-----------|
| PR1 | Test failure roots to real production defect (not fixture/assertion drift) | Decision 3 + AC7 escape hatch — Bug-Lane route, HALT story |
| PR2 | Fixing a test breaks a sibling test | Decision 4 — rerun full suite per file (not just per test) |
| PR3 | `package-lock.json` sync produces unexpected diff | Task 1.2 verifies diff is minimal; if not, surface |
| PR4 | Story 4.4's recently-shipped tests added new failure modes | Decision 5 rerun-probe catches inventory drift |
| PR5 | Lint clean pre-bump but warnings under 4.0-rc.1 | Already verified: lint output was clean under bumped state during 2026-04-28 spec-author probe |
| PR6 | Some failing tests are inherently coupled to "current version" semantics | Decision 1 last-resort path (test rewrite) handles them; defer wide-scope fixture-isolation to a separate `D-V42b-Rn` deferred-work pass |

**Spike points:** none. This is straight test-maintenance work.

**Apply Epic 3 retro action items:**
- **PI-9 (`${PIPESTATUS[0]}`):** N/A — no `tee` pipelines in this story.
- **PI-10 (Edge Case Hunter as load-bearing):** code-review at story close MUST include Edge Case Hunter layer.
- **PI-11 (DEF-SPIKE inversion handling):** N/A — no DEF-SPIKE in this story.
- **PI-12 (spec spot-check rubric audit):** AC1-AC7 each pin verifiable assertions.

**Story 4.2b is the bridge between Story 1A.4 (which delivered the migration script) and Story 4.3 (which uses it).** Story 1A.6 author wrote a comment at `tests/unit/convoke-update.test.js:752` (self-attributed to "Story v63-1a-6 AC4") anticipating the "-to-4.0.0 hop" scenario and explicitly noting that 3.3.0 equals current package.json version. The comment-author worked around it by using 3.2.0 as the from-version for one specific test. Story 4.2b retires the rest of the coupled tests that other stories' authors did not anticipate. **Pattern hint for dev agent:** the v63-1a-6 workaround (use a non-current from-version to trigger upgrade output) may be applicable to some failing tests — read the test's intent before applying assertion-vs-fixture-vs-rewrite per Decision 1.

**TI-9 cron-durability:** N/A — no scheduled actions.

## Change Log

- 2026-04-28 — Story 4.2b created via direct authorship (skill-driven authoring not applicable: this is a gap-closure story for a spec-gap discovered during Story 4.3's first dev-story attempt, with full empirical context already gathered; bmad-create-story workflow's auto-discovery would not have surfaced this story). 7 ACs + 5 Decisions + 9 Tasks + 6 PR risks. **Test-surface maintenance story.** Pre-bump baselines + post-bump failure inventory both empirically captured 2026-04-28 within the same dev-session that discovered the spec gap.
- 2026-04-28 — Code review Round 1 complete; Story marked **done**. 3 reviewers (Blind Hunter + Edge Case Hunter + Acceptance Auditor) ran in parallel. Acceptance Auditor: **0 AC violations** (all 7 ACs + 5 Decisions confirmed within amended language). Triage: 0 patch / 3 decision-needed (all batch-deferred per operator Option 0) / 2 defer / 9 dismiss (false positives, handled-elsewhere, style preferences). All 3 decision-needed findings center on strict-semver-compliance theme; logged as unified `CR-V42b-DN-batch — strict-semver hardening` deferred-work item. Convergence: HIGH findings deferred (not fixed), so Round 2 not triggered per `code-review-convergence` rule (no fixes → no need to re-review). Story 4.3 dev-story now unblocked.
- 2026-04-28 — Story shipped to `review`. Single dev-story session: Tasks 0-1 + Task 1.5 (regex fix) + Task 2-8 (verified by test run, no per-test edits). Final test counts: `npm test` 1496/1495/0/1 (was 1492/1491/0/1 pre-bump; +4 new tests); `npm run test:integration` 93/93/0; `npm run lint` exit 0. **Story 4.3 Task 0.5 precondition permanently green; Story 4.3 dev-story unblocked.** **Pre-existing test-isolation defect surfaced (out of scope):** an integration test leaks `_bmad/bme/_vortex/config.yaml` version-field mutation during `npm test`; not introduced by 4.2b but exposed by it. Routed to operator as separate Bug-Lane candidate per `test-fixture-isolation` rule. **Unified root cause discovery:** all ~20 unit + 1 integration test failures rooted to single regex defect at `config-merger.js:212`; the spec's "test-surface coupling" hypothesis was wrong. Decision 3 exception narrowness held; only 1 repurposed test in `config-merger-negative.test.js` + 4 new tests in `config-merger.test.js`.
- 2026-04-28 — Mid-execution amendment (operator-approved Option B): dev-story Task 2 hit AC7 escape hatch; root cause was real production defect at `scripts/update/lib/config-merger.js:212` (version regex rejects semver pre-release suffixes — every Tasks 2-6 failure roots here). Operator decided amend-in-place over separate Bug-Lane fix story since the defect is intrinsic to "make 4.0.0-rc.1 viable" — Story 4.2b's exact scope. **Decision 3** amended to allow narrow exception: regex line + error message + co-located tests in `tests/unit/config-merger.test.js`. **AC7** updated to reflect: `scripts/update/lib/config-merger.js` and validator-test file now IN-scope (bounded to regex line + error message + new pre-release-format tests). **NEW Task 1.5** added with 5 sub-tasks covering the regex update + error-message update + companion-test additions. Pre-amendment Decision 3 invariants for all OTHER `scripts/update/lib/*` files remain in force. AC counts unchanged (still 7); Decision count unchanged (still 5; D3 amended in place not split); Task count now 10 (was 9; added Task 1.5).
- 2026-04-28 — V-pass batch-applied **4 improvements** (3 critical + 1 enhancement) via spec-rewrite. **Empirical probes 14/14 PASS + 4 CAUGHT-DEFECT** (validator naming convention, missing test names at 366/400, comment misattribution, additional 4.0 migrations not surfaced). **CM-1** validator.test.js spec-table entries previously cited suite-level names ("validateConfigStructure", "validateInstallation") but pointed to inner `it` lines (65, 451) — fixed to show actual `it` names ("passes for valid config", "returns valid:true for a complete installation") plus parenthetical describe-block reference at lines 28 + 439, with concrete root-cause probed via test-body inspection. **CM-3** filled in test names at lines 366 ("dry-run after real run shows no migrations to preview") and 400 ("creates an error log when migration fails") — previously placeholder "(test name to be inspected by dev agent)" was lazy authorship since names are mechanically knowable per `mechanical-research-enumeration` rule. **CM-5** Dev Notes attribution corrected: comment at `convoke-update.test.js:752` self-attributes to "Story v63-1a-6 AC4", not Story 1A.4 author (1A.4 still authored the migration script; just not the comment). Added "Pattern hint for dev agent" — 1a-6 workaround (use non-current from-version to trigger upgrade output) may be applicable to some failing tests. **EO-3** Empirical baseline table now notes ALL THREE 3.x-to-4.0.0 migrations exist (3.1.x, 3.2.x, 3.3.x) — tests starting from older from-versions (1.4.x, 1.5.2) walk through all three; chain-extension impact applies to every from-version test, not just 3.3.x-targeted ones. **V-pass ROI:** prevented dev agent from chasing two ghost test names, prevented misattribution propagation in retro/audit trails, surfaced a multi-migration consideration that affects fix-strategy choice. All structural counts (7 ACs / 5 Decisions / 9 Tasks / 6 PR risks / 5 anti-patterns) confirmed accurate. Test baseline pre-bump confirmed 1492/1491/1/0 (unit) + 93/93/0 (integration). Cross-references confirmed: Story 4.3 AC7 forbids `package.json/package-lock.json` (verbatim verified); migration scripts present; project-context.md rules referenced exist (test-fixture-isolation, lint-passes-before-review, staleness-preflight-for-backlog-pickup).

## Dev Agent Record

### Implementation Plan

Initial plan (per spec) was test-surface maintenance: bump version, then walk each of ~20 failing tests across 4 files + 1 integration hook, applying minimum fix per Decision 1. Discovered at Task 2 (probe rerun) that the failures unified to a single root cause: `scripts/update/lib/config-merger.js:212` regex `/^\d+\.\d+\.\d+$/` rejecting semver pre-release suffixes.

Triggered AC7 escape hatch + surfaced to operator. Operator chose Option B (amend Decision 3 in place over separate Bug-Lane fix) since the defect is intrinsic to "make 4.0.0-rc.1 viable" — Story 4.2b's exact scope. Spec amended (new Decision 3 narrow exception + Task 1.5 + AC7 scope expansion); resumed dev-story.

After regex fix at Task 1.5: all Tasks 2-6 went green with ZERO test-file edits — the "test-surface coupling" hypothesis was wrong; failures rooted to one production-code defect. The only test edits were:
1. **4 new pre-release-acceptance tests** added per Decision 3 exception (`tests/unit/config-merger.test.js`).
2. **1 obsolete negative test repurposed** (`tests/unit/config-merger-negative.test.js:116`) — was asserting `1.0.0-beta` is rejected (old behavior); now asserts `1.0.0-beta!` is rejected (still-invalid case post-regex-update).

### Completion Notes

- **Spec gap closure (AC5):** Story 4.3 Task 0.5 precondition is permanently green. Dev-story for Story 4.3 can resume immediately.
- **Unified root cause discovered:** ~20 unit + 1 integration test failures all rooted to single regex defect at `config-merger.js:212`. Fixed via Decision 3 narrow exception (operator-approved Option B). Story-level RoI: minimal test-file edits (1 repurposed + 4 added) vs. spec's anticipated walk-each-of-20.
- **Test results:**
  - `npm test`: 1496 / pass 1495 / fail 0 / skip 1 (was 1492/1491/1/0 pre-bump; +4 new tests).
  - `npm run test:integration`: 93/93 fail 0.
  - `npm run lint`: exit 0 clean.
- **Pre-existing test-isolation defect surfaced (out of scope):** A test (likely integration suite, candidate: `Upgrade from v1.7.x (simulated)` test "refreshInstallation updates config version to current package") leaks the live `_bmad/bme/_vortex/config.yaml` version field during `npm test` runs. Pre-bump it was invisible because pre-write version equaled post-write version. Reverted on each test cycle; surface to operator as separate Bug-Lane item per `test-fixture-isolation` rule. NOT introduced by this story; this story exposes it.
- **Decision 3 exception language proved sound:** "or wherever validateConfig is currently tested" correctly covered the negative test repurpose at `config-merger-negative.test.js:116`. No further amendments needed.
- **Anti-patterns observed (none new):** the spec's anti-pattern list (DON'T edit migration script, DON'T skim assertions, DON'T disable lint, DON'T touch passing tests, DON'T silently fix prod regressions) all held up under execution. Decision 3 exception narrowness preserved them.

### File List

**Modified (in scope per AC7 + Decision 3 exception):**
- `package.json` — version bump 3.3.0 → 4.0.0-rc.1 (1 line)
- `package-lock.json` — version field synced via `npm install --package-lock-only` (4 lines)
- `scripts/update/lib/config-merger.js` — regex update at line 212 + companion error message (2 lines, 1 logical change)
- `tests/unit/config-merger.test.js` — added 4 tests (acceptance: `4.0.0-rc.1`, `4.0.0-alpha.0`; rejection: `4.0` incomplete, `4.0.0.0` too-many-parts) at lines 79-118 (~42 lines)
- `tests/unit/config-merger-negative.test.js` — repurposed 1 test at lines 116-128 (was "rejects version with alpha characters" using `1.0.0-beta`; now "rejects version with invalid pre-release characters" using `1.0.0-beta!`) (~6 lines net)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` — status transitions (`v63-4-2b: ready-for-dev` → `in-progress` → final state on story close) + multi-entry `last_updated` change log
- `_bmad-output/implementation-artifacts/v63-4-2b-version-bump-and-test-surface-updates-for-4-0-rc-candidate.md` — this story file (Tasks/Subtasks checkboxes [x] + Dev Agent Record + File List + Change Log + Status)

**Verified untouched (per AC7 must-not-touch list):**
- `scripts/update/migrations/3.3.x-to-4.0.0.js` (frozen Story 1A.4 surface) — confirmed unchanged.
- All other `scripts/update/lib/*` files (only `config-merger.js:212` + error msg edited per Decision 3 exception).
- All previously-passing tests (only `config-merger-negative.test.js:116` repurposed per Decision 3 exception language; was negative-coverage of behavior we deliberately changed).
- `_bmad/` files unchanged (modulo the pre-existing fixture-isolation leak in `_bmad/bme/_vortex/config.yaml`, which is reverted on each cycle).

**Lines of change:** ~50 lines net (package.json/lock minor + 1 regex line + ~42 test lines added + ~6 test lines amended).

### Review Findings (Round 1, 2026-04-28)

**Sources:** Blind Hunter (no project context, ≥10 issues), Edge Case Hunter (path tracer with project access), Acceptance Auditor (spec verification).

**Acceptance Auditor verdict:** No AC violations found. All 7 ACs satisfied; all 5 Decisions respected within their amended language; AC7 scope discipline preserved on both IN-scope and MUST-NOT-TOUCH lists.

#### decision-needed

*All 3 decision-needed findings batch-deferred 2026-04-28 per operator choice (Option 0). Reason: scope discipline — Story 4.2b's immediate goal (`4.0.0-rc.1` viable, Story 4.3 unblocked, all tests green) is met; strict-semver hardening is a separate follow-up concern routed to Bug-Lane / Fast-Lane backlog. None of the 3 break the current production path. Logged as a unified `strict-semver hardening` deferred-work item (CR-V42b-DN-batch).*

- [x] [Review][Defer] **Regex grammar permissive beyond strict semver** — Current regex `/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/` accepts malformed pre-release identifiers per SemVer §9: `1.0.0-rc..1` (empty identifier), `1.0.0-rc.01` (leading zero), `1.0.0-`, `1.0.0--rc.1`. Strict alternative: `/^\d+\.\d+\.\d+(?:-(?:[0-9A-Za-z-]+)(?:\.[0-9A-Za-z-]+)*)?$/`. **Deferred 2026-04-28** — no current code path generates these strings.
- [x] [Review][Defer] **Build metadata (`+build` segment) not handled but error message claims "semver"** — Regex rejects `1.2.3+build.5`. Either extend regex or scope error-message text to "pre-release suffix only". **Deferred 2026-04-28** — Convoke does not currently produce build-metadata versions; trivial fix (re-word error message) or full extension can ship in the strict-semver hardening item.
- [x] [Review][Defer] **`compareVersions()` + `getMigrationPath()` may not handle pre-release ordering** — UNVERIFIED edge case: RC → final flows. **Deferred 2026-04-28** — never reached in current production (RC builds not published publicly). Verify as part of strict-semver hardening backlog item before any future RC publication.

#### defer

- [x] [Review][Defer] **`migration_history` items not validated against version regex** [config-merger.js:218-227] — pre-existing concern; not introduced by Story 4.2b. Custom validator checks field existence but not format. Worth fixing if/when version-format invariants tighten.
- [x] [Review][Defer] **Repurposed negative test uses single weak input; missing edge-case coverage** [config-merger-negative.test.js:122] — `1.0.0-beta!` is one character flip. Could add: `1.0.0-` (empty pre-release), `1.0.0-rc..1` (empty identifier), `1.0.0-rc.01` (leading zero), `1.0.0-rc 1` (whitespace), `1.0.a` (alpha in core). **Tied to the strict-semver hardening deferred item:** if strict-semver is adopted, these tests become required.

#### dismissed (false positives + handled-elsewhere + non-issues, 9 items)

- Major-version bump without migration (Blind #8) — false positive: `scripts/update/migrations/3.3.x-to-4.0.0.js` exists per Story 1A.4; Blind Hunter had no project access.
- Version not propagated to agent-pack config.yaml (Blind #10) — false positive: by architectural design, migration script propagates version to user installations at update-time, not synchronous-bump in dev tree.
- CHANGELOG/release notes not updated (Blind #9) — handled elsewhere: Story 5B.3 owns release commit + CHANGELOG; RC bump is intermediate.
- Migration registry parseTargetVersion (Edge #6) — false positive: migration filenames use strict `x.y.z`; pre-release tags never appear in filenames.
- Story IDs in test comments (Blind #13) — convention preference; consistent with other v63 stories (e.g., Story 1A.6 comment at convoke-update.test.js:752).
- RC tag without alpha/beta trail (Blind #12) — style preference; not a defect.
- `result.warnings` assertion granularity (Blind #15) — hypothetical future; no such field currently exists.
- No bounds on absurd core version `99999999.99999999.99999999` (Blind #7) — pre-existing with original regex; not introduced by 4.2b.
- Acceptance Auditor's Decision-4 letter-vs-spirit observation — auditor itself confirms covered by Decision 3 amendment language; not a finding to act on.

## References

- Story 4.3 (release-time-deferred; gated on this story shipping) — `_bmad-output/implementation-artifacts/v63-4-3-execute-pf1-validation-cycle-record-compare-and-gate.md`
- Story 1A.4 (delivered `scripts/update/migrations/3.3.x-to-4.0.0.js`) — `_bmad-output/implementation-artifacts/v63-1a-4-create-migration-script-3-x-to-4-0-js.md`
- Spec gap discovery context — sprint-status.yaml `last_updated` entry 2026-04-28 (Story 4.3 dev-story HALT'd, package.json bumped + reverted, ~20 unit + 1 integration test failures captured)
- Project context rules — `project-context.md` (in particular: `test-fixture-isolation`, `lint-passes-before-review`, `staleness-preflight-for-backlog-pickup`, `mechanical-research-enumeration`)
- Architecture doc — `_bmad-output/planning-artifacts/convoke-arch-bmad-v6.3-adoption.md` (FR39 release-blocking gate that Story 4.3 produces)
- BUG-6 precedent (test-surfaces-real-production-defect → Bug-Lane route) — `_bmad-output/planning-artifacts/convoke-note-initiative-lifecycle-backlog.md` §2.2 Bug Lane
- v6.3 adoption initiative — auto-memory `project_v63_adoption.md`
