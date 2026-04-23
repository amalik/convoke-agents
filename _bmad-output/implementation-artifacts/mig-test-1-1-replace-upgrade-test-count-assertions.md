# Story mig-test-1.1: Replace hardcoded chain-count assertions with identity assertions in `upgrade.test.js`

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

**Epic:** [mig-test-epic-1 — Migration Chain Test Identity Assertions](../planning-artifacts/convoke-epic-migration-test-identity-assertions.md) (cross-cutting platform debt; single-story epic following [lint-epic-1](../planning-artifacts/convoke-epic-lint-cleanup-dod-gate.md) precedent)
**Origin:** 2026-04-23 CI triage — `npm run test:integration` reports 3 failures in [tests/integration/upgrade.test.js](../../tests/integration/upgrade.test.js) at lines 130, 404, 412. Root cause: Story 1A.4 appended 4 new breaking migrations to [scripts/update/migrations/registry.js](../../scripts/update/migrations/registry.js) (3.3.x/3.2.x/3.1.x/3.0.x → 4.0.0), extending upstream chains by 1 hop + 1 breaking change. The upgrade tests hardcoded pre-4.0 counts, so assertions rotted silently.
**Sprint:** inline with v63-epic-1a closure (unblocks CI green, needed for v63-1a-6 Round 2 review to complete and for the merge queue generally).
**Namespace decision:** No new skills, workflows, or agents under `_bmad/bme/`. Work touches a single test file under `tests/integration/`. The [`namespace-decision-for-new-skills`](../../project-context.md) rule is N/A by construction — nothing new is authored; three existing assertions are refactored. The [`covenant-compliance-for-convoke-skills`](../../project-context.md) rule is also N/A — no `_bmad/bme/` surface is touched.
**Safety analysis (path-safety rule):** N/A — no scripts that accept user paths or perform destructive operations are added or modified.

## Story

As the platform maintainer (Amalik) and any future dev agent who appends a migration to [scripts/update/migrations/registry.js](../../scripts/update/migrations/registry.js),
I want the three integration tests in [tests/integration/upgrade.test.js](../../tests/integration/upgrade.test.js) at lines 130/404/412 to assert *identity* (which migrations appear, which breaking descriptions surface) rather than *count* (how many total),
so that future registry appends do not silently rot these assertions and CI stays green without a test-file patch every time a migration is added.

## Context & Motivation

Story 1A.4 (`v63-1a-4-create-migration-script-3-x-to-4-0-js`) shipped four new breaking migrations in [scripts/update/migrations/registry.js](../../scripts/update/migrations/registry.js): a primary `3.3.x-to-4.0.0` entry + parallel entries for `3.0.x`, `3.1.x`, and `3.2.x` (all pointing to `4.0.0`). Every upstream chain that previously reached `3.1.0` now extends one hop further to `4.0.0` and picks up one additional breaking change.

The integration tests in [tests/integration/upgrade.test.js](../../tests/integration/upgrade.test.js) were written before `3.3.x-to-4.0.0` existed and hardcoded the pre-4.0 chain counts:

- **Line 130** — `assert.equal(changes.length, 1)` for v1.3.8 breaking changes — now returns 2 (`Product rename` + the v4.0 direct-load migration).
- **Line 404** — `assert.equal(migrations.length, 2)` for v1.7.1 chain — now returns 3 (`1.7.x-to-2.0.0`, `2.0.x-to-3.1.0`, `3.1.x-to-4.0.0`).
- **Line 412** — `assert.equal(changes.length, 1)` for v1.7.1 breaking changes — now returns 2 (rename + v4.0 direct-load).

The sprint-status.yaml log for lint-1.1's dev-story execution (2026-04-22) explicitly flagged these three failures as *"1A.4 territory, scope-excluded per AC5"* — lint-1.1 correctly declined to scope-creep. This story is the forward-going remediation artifact that closes that deferred obligation.

Governing rule: [`derive-counts-from-source`](../../project-context.md) — *"Tests that assert counts must derive those counts from the authoritative source — never hardcode them."* The fix replaces `length === N` assertions with identity checks against the specific migration names and breaking-description substrings. After the fix, appending a 5th migration to any tested chain does not break these three tests.

The `code-review-convergence` rule is **preserved**: Story 1A.4 converged at its own review; this story does **not** reopen it. The pattern matches lint-1.1's relationship to Story 1A.2 exactly — a forward-going remediation epic, not a Round 3 reopening.

## Acceptance Criteria

**AC1 — v1.3.8 breaking-change identity assertion.**
**Given** the current assertion at [tests/integration/upgrade.test.js:128-132](../../tests/integration/upgrade.test.js#L128-L132):
```js
it('reports breaking changes for v1.3.8 (chain reaches 1.7.x-to-2.0.0)', () => {
  const changes = registry.getBreakingChanges('1.3.8');
  assert.equal(changes.length, 1);
  assert.ok(changes[0].includes('Product rename'));
});
```
**When** the story is implemented
**Then** the `assert.equal(changes.length, 1)` line is replaced with an identity assertion:
```js
assert.ok(
  changes.some(c => c.includes('Product rename')),
  'v1.3.8 chain should include the v2.0.0 Product rename breaking change'
);
```
**And** the `assert.ok(changes[0].includes('Product rename'))` line is removed (superseded by the `some(...)` check — ordering is not guaranteed contract).
**And** the test name and its surrounding `it(...)` scope are unchanged.
**And** after the fix, the test passes against the current registry state (2 breaking changes from v1.3.8: `Product rename` + v6.3 direct-load migration).
**And** the assertion is append-safe: if a 5th breaking migration is added to the chain in the future, this test continues to pass without modification.

**AC2 — v1.7.1 chain-composition identity assertion.**
**Given** the current assertion at [tests/integration/upgrade.test.js:402-408](../../tests/integration/upgrade.test.js#L402-L408):
```js
it('finds applicable migrations for v1.7.1 (chains to 2.0.x)', () => {
  const migrations = registry.getMigrationsFor('1.7.1');
  assert.equal(migrations.length, 2);
  assert.equal(migrations[0].name, '1.7.x-to-2.0.0');
  assert.equal(migrations[0].breaking, true);
  assert.equal(migrations[1].name, '2.0.x-to-3.1.0');
});
```
**When** the story is implemented
**Then** the `assert.equal(migrations.length, 2)` line is **removed** (replaced by nothing — the ordered-name checks already establish the identity contract).
**And** the three surviving assertions — `migrations[0].name === '1.7.x-to-2.0.0'`, `migrations[0].breaking === true`, `migrations[1].name === '2.0.x-to-3.1.0'` — are **retained unchanged**. They are the story's identity contract: "from v1.7.1, the chain must start with these two migrations in this order."
**And** the test name is updated from `(chains to 2.0.x)` to `(chain starts with 1.7.x-to-2.0.0 then 2.0.x-to-3.1.0)` to reflect the identity-based contract (the old name was a count-implication; the new name is an identity).
**And** after the fix, the test passes against the current registry state (3 migrations: `1.7.x-to-2.0.0`, `2.0.x-to-3.1.0`, `3.1.x-to-4.0.0`).

**AC3 — v1.7.1 breaking-change identity assertion.**
**Given** the current assertion at [tests/integration/upgrade.test.js:410-414](../../tests/integration/upgrade.test.js#L410-L414):
```js
it('reports breaking changes for v1.7.1', () => {
  const changes = registry.getBreakingChanges('1.7.1');
  assert.equal(changes.length, 1);
  assert.ok(changes[0].includes('rename') || changes[0].includes('Convoke'), 'should describe the rename');
});
```
**When** the story is implemented
**Then** the `assert.equal(changes.length, 1)` line is replaced with an identity assertion:
```js
assert.ok(
  changes.some(c => c.includes('rename') || c.includes('Convoke')),
  'v1.7.1 chain should include the v2.0.0 rename breaking change'
);
```
**And** the original `assert.ok(changes[0].includes(...), 'should describe the rename')` line is removed (superseded by `some(...)`).
**And** after the fix, the test passes against the current registry state (2 breaking changes from v1.7.1: rename + v6.3 direct-load).
**And** the assertion is append-safe.

**AC4 — No changes outside the three identified assertions.**
**Given** the story's mechanical scope is three assertion sites in one file
**When** the diff is reviewed
**Then** exactly **one** production/test file is modified in `scripts/` or `tests/`: `tests/integration/upgrade.test.js`.
**And** the diff against main shows changes only within the three `it(...)` blocks cited in AC1/AC2/AC3 — no incidental edits elsewhere in the test file.
**And** [scripts/update/migrations/registry.js](../../scripts/update/migrations/registry.js) is **not** modified. The registry contract is append-only; this story changes tests only.
**And** no other test file (integration or unit) is modified in this story. If the implementer spots similar `assert.equal(*.length, <number>)` patterns against registry APIs elsewhere during implementation, log them as a follow-up backlog item per epic NFR4 — do not scope-creep.
**And** admin-file modifications are expected and tracked separately: this story file itself (Task 8 — Status + File List), [sprint-status.yaml](sprint-status.yaml) (status transitions), and [v63-1a-4 story file](v63-1a-4-create-migration-script-3-x-to-4-0-js.md) (cross-reference note per Task 7). These are not AC4 violations — they are the administrative surface of any BMAD story and are scoped by their own tasks.

**AC5 — CI matrix goes fully green.**
**Given** the current CI state (2026-04-23 triage): `test × Node 18/20/22` + `coverage` all red; `lint`, `security`, `package-check`, `python-test` all green.
**When** the story is implemented
**Then** `npm run test:integration` exits 0 locally (85/85 pass on Node ≥18).
**And** `npm test` continues to pass (no regressions introduced in unit tests).
**And** `npm run test:coverage` exits 0 (same tests, wrapped in c8).
**And** `npm run lint` continues to pass (no new warnings/errors in the touched file).
**And** the fix is verified against all 3 CI Node matrix versions if accessible (via `nvm use` or equivalent); if the local environment only has one Node version available, document the limitation in Dev Agent Record and rely on CI for the other versions.

**AC6 — Append-safety verification (mental model / simulation).**
**Given** the purpose of this story is to prevent *future* rot
**When** verifying the fix
**Then** the implementer performs a thought experiment or temporary edit: add a hypothetical `4.0.x-to-5.0.0` breaking migration to `registry.js` and run the three tests.
**And** all three tests still pass without modification (identity contracts hold).
**And** the temporary registry edit is reverted before final `git diff` review — it's for verification only.
**And** the verification is documented in Dev Agent Record ("simulated chain extension and confirmed tests remain green").

**AC7 — Story 1A.4 convergence-rule preservation.**
**Given** the existing sprint-status.yaml log already captured these 3 failures as scope-excluded from lint-1.1 and documented them as 1A.4 territory
**When** the story is implemented
**Then** a one-line "Post-review note" is appended to [v63-1a-4-create-migration-script-3-x-to-4-0-js.md](v63-1a-4-create-migration-script-3-x-to-4-0-js.md) under its Status or a new "Post-review note" section (do **NOT** reopen the story — `code-review-convergence` is preserved) referencing this story (`mig-test-1-1`) as the forward-going test-assertion remediation.
**And** the note explicitly states that the code-review-convergence rule is **upheld** (no Round 3 reopening of 1A.4) — remediation ships as a follow-up story, exactly the pattern lint-1.1 established for 1A.2.

## Scope Exclusions

- **Changes to [scripts/update/migrations/registry.js](../../scripts/update/migrations/registry.js).** The registry contract is append-only and correct. The rot is in the tests, not the registry.
- **Compliance sweep for other `assert.equal(*.length, <number>)` patterns.** If the implementer encounters ≥2 additional hardcoded-count assertions against registry/manifest/config APIs during implementation, log a follow-up backlog item (`derive-counts-from-source` compliance sweep) — do not scope-creep.
- **Automated enforcement** (ESLint rule, review-time check). Manual enforcement + the scar story in [project-context.md](../../project-context.md) is the current gate. Promote to automation only if this class of regression recurs.
- **Changes to unit tests** in `tests/unit/registry.test.js` or `tests/unit/migration-runner-orchestration.test.js`. These files were externally edited during lint-1.1's execution and are currently green; touching them would expand scope without evidence they need fixing. If they later surface with similar patterns, handle in a separate story.

## Tasks / Subtasks

- [x] **Task 1 — Capture pre-fix baseline** (AC5; enumeration per [`mechanical-research-enumeration` rule](../../project-context.md))
  - [x] 1.1. Run `npm run test:integration 2>&1 | tee /tmp/integration-before.txt` → expect 82/85 pass, 3 fail (the three in AC1/AC2/AC3)
  - [x] 1.2. Run `npm test` → expect exit 0, unit suite green baseline captured
  - [x] 1.3. Run `npm run lint` → expect exit 0 (baseline post-lint-1.1)
  - [x] 1.4. `git status` — confirm working tree matches expectations before editing

- [x] **Task 2 — Implement AC1 (v1.3.8 breaking identity)**
  - [x] 2.1. Open [tests/integration/upgrade.test.js](../../tests/integration/upgrade.test.js) at line 130
  - [x] 2.2. Replace `assert.equal(changes.length, 1)` with `assert.ok(changes.some(c => c.includes('Product rename')), 'v1.3.8 chain should include the v2.0.0 Product rename breaking change')`
  - [x] 2.3. Remove the subsequent `assert.ok(changes[0].includes('Product rename'))` line (superseded by `some(...)`)
  - [x] 2.4. Run the single test: `node --test --test-name-pattern='reports breaking changes for v1.3.8' tests/integration/upgrade.test.js` → pass

- [x] **Task 3 — Implement AC2 (v1.7.1 chain composition)**
  - [x] 3.1. At line 402-408, remove the `assert.equal(migrations.length, 2)` line (the three subsequent ordered-name/breaking checks remain unchanged)
  - [x] 3.2. Update the test name from `'finds applicable migrations for v1.7.1 (chains to 2.0.x)'` to `'finds applicable migrations for v1.7.1 (chain starts with 1.7.x-to-2.0.0 then 2.0.x-to-3.1.0)'` to reflect the identity-based contract
  - [x] 3.3. Run the single test → pass

- [x] **Task 4 — Implement AC3 (v1.7.1 breaking identity)**
  - [x] 4.1. At line 410-414, replace `assert.equal(changes.length, 1)` with `assert.ok(changes.some(c => c.includes('rename') || c.includes('Convoke')), 'v1.7.1 chain should include the v2.0.0 rename breaking change')`
  - [x] 4.2. Remove the subsequent `assert.ok(changes[0].includes('rename') || changes[0].includes('Convoke'), 'should describe the rename')` line (superseded)
  - [x] 4.3. Run the single test → pass

- [x] **Task 5 — Append-safety verification** (AC6)
  - [x] 5.1. Before editing, capture the pre-probe state for safe revert: `git diff scripts/update/migrations/registry.js > /tmp/registry-pre-probe.diff`. If that diff is non-empty, STOP and surface to operator — `registry.js` has unsaved changes from parallel work and running the probe could contaminate them.
  - [x] 5.2. Open [scripts/update/migrations/registry.js](../../scripts/update/migrations/registry.js) and append a dummy entry to `MIGRATIONS` (insert inside the array, after the existing `3.2.x-to-4.0.0` entry):
    ```js
    { name: '4.0.x-to-5.0.0', fromVersion: '4.0.x', breaking: true, description: 'Hypothetical future migration (append-safety probe — revert before commit)', module: null },
    ```
  - [x] 5.3. Run `npm run test:integration` → all 3 previously-fixed tests must still pass (identity contracts hold against the simulated extension).
  - [x] 5.4. **Revert surgically**: delete the single probe line added in 5.2 by opening the file and removing exactly that line (identifiable by the `'append-safety probe — revert before commit'` description text). Do **NOT** use `git checkout -- scripts/update/migrations/registry.js` — that would overwrite any unrelated working-tree changes to the file.
  - [x] 5.5. Confirm revert: `git diff scripts/update/migrations/registry.js` — expect empty diff (back to HEAD). If non-empty, compare against `/tmp/registry-pre-probe.diff` from 5.1 and restore manually.
  - [x] 5.6. Re-run `npm run test:integration` → confirm registry is back to real state and all tests still pass (85/85).
  - [x] 5.7. Document the simulation result in Dev Agent Record (one line: "append-safety simulation passed — chain extension did not re-rot assertions").

- [x] **Task 6 — Full verification** (AC5)
  - [x] 6.1. `npm run test:integration` → 85/85 pass (exit 0)
  - [x] 6.2. `npm test` → no new failures vs Task 1.2 baseline (exit 0)
  - [x] 6.3. `npm run lint` → exit 0, no new warnings/errors in `tests/integration/upgrade.test.js`
  - [x] 6.4. `npm run test:coverage` → exit 0 (same tests, wrapped in c8)
  - [x] 6.5. `git diff --stat` → verify exactly ONE file modified: `tests/integration/upgrade.test.js` (matches AC4)

- [x] **Task 7 — Cross-reference 1A.4 with convergence-rule note** (AC7)
  - [x] 7.1. Open [v63-1a-4-create-migration-script-3-x-to-4-0-js.md](v63-1a-4-create-migration-script-3-x-to-4-0-js.md)
  - [x] 7.2. Append (do not modify existing content): a short "Post-review note (2026-04-23)" section under Status or at end of Dev Notes, citing `mig-test-1-1` as the forward-going test-assertion remediation, explicitly stating `code-review-convergence` is **upheld** (no Round 3 reopening of 1A.4), and noting that the registry append itself was correct — only the tests needed updating
  - [x] 7.3. Save. Do not change v63-1a-4's Status or any AC — the note is purely informational

- [x] **Task 8 — Update story Status and File List**
  - [x] 8.1. Set this story's Status from `ready-for-dev` → `review`
  - [x] 8.2. Populate File List below with: `tests/integration/upgrade.test.js`, `v63-1a-4-...md` (post-review note), this story file, `sprint-status.yaml` (status transition)
  - [x] 8.3. Ready for `/bmad-code-review`

## Dev Notes

### Why identity over count (the architectural instinct)

The count assertion `length === 2` was never the contract the original test author meant to express. What they meant was: "from v1.7.1, the chain must reach v2.0.0 via `1.7.x-to-2.0.0` and then `2.0.x-to-3.1.0`." The `length === 2` was a *proxy* for that intent — at the time, there was no migration after `2.0.x-to-3.1.0`, so asserting the count was coincidentally also asserting the identity.

Identity assertions make the *real* contract explicit. They survive registry growth because growth doesn't change what "from v1.7.1 you must pass through these two migrations" means — it only adds hops after them. The three identity forms this story installs:

1. **`some(c => c.includes(...))`** — "the chain contains at least one entry matching this description." Used for breaking changes where position isn't meaningful (AC1, AC3).
2. **Position + name** — `migrations[0].name === '1.7.x-to-2.0.0'` — "at this position in the chain, this specific migration must appear." Used when chain order matters for user-facing migration sequencing (AC2).
3. **Position + attribute** — `migrations[0].breaking === true` — "at this position, this attribute must hold." Used to pin the breaking-ness of the first hop (AC2, retained unchanged).

### Why no registry change

The registry's [matchesVersionRange](../../scripts/update/migrations/registry.js#L211-L225) + [parseTargetVersion](../../scripts/update/migrations/registry.js#L140-L143) + chain-walk loop ([getMigrationsFor](../../scripts/update/migrations/registry.js#L95-L132)) is working correctly. The P5 Migration Chaining Fix epic (shipped retroactively 2026-04-21) proved the chain traversal is solid. The failures are test-side only.

### Why `some(...)` over `find(...).includes(...)` in AC1/AC3

`Array.prototype.some()` returns a boolean, which `assert.ok` consumes directly — short, idiomatic, readable. The alternative `assert.ok(changes.find(c => c.includes('Product rename')))` would work but:
- relies on the implicit truthiness of the found string
- reads ambiguously ("find the rename" vs "assert some match")
- doesn't communicate the boolean intent as clearly

`some(...)` is the right primitive for existence checks.

### Why update the test name in AC2 but not AC1/AC3

AC2's test was named `(chains to 2.0.x)` — a description of the target. Post-fix, the assertion content is explicitly *"chain starts with 1.7.x-to-2.0.0 then 2.0.x-to-3.1.0"* — which is a richer identity claim than "chains to 2.0.x" (it now also asserts that 2.0.x comes second). The name update aligns the test title with what it actually asserts.

AC1 and AC3 test names already describe identity (`reports breaking changes for v1.3.8 (chain reaches 1.7.x-to-2.0.0)` and `reports breaking changes for v1.7.1`). No rename needed.

### Why AC6's simulation is a thought experiment, not a permanent test

The permanent append-safety contract is the identity assertion itself — it's structurally append-safe by construction. The simulation in Task 5 is a one-time verification that the assertion actually holds against a hypothetical extension, not a regression test that needs to live on. Adding a permanent "future migration simulation" test would:
- require mocking or modifying the registry, which violates the test-fixture-isolation rule's spirit
- couple the test suite to a specific future migration pattern, which is premature
- duplicate what the identity assertion already guarantees semantically

The simulation is discipline; the identity assertion is the enforcement.

### Testing standards summary

- **Framework:** `node:test` with `node:assert/strict` (Convoke migrated off Jest; C1 phantom-test class resolved 2026-04-11).
- **Fixture isolation:** The existing `upgrade.test.js` suites use `tmpDir` fixtures created in `before()` — this story does not change any fixture setup.
- **Node version matrix:** CI runs the test job on Node 18, 20, 22. The `node:test` API is stable across all three; the fix does not depend on any Node-version-specific feature.

### Project Structure Notes

- No new directories, no new files.
- One modified file: `tests/integration/upgrade.test.js`.
- One amended cross-reference: `v63-1a-4-create-migration-script-3-x-to-4-0-js.md` (post-review note).
- No conflicts with existing unified project structure.

### References

- [project-context.md](../../project-context.md) — §Rule: `derive-counts-from-source` (governing rule), §Rule: `code-review-convergence` (preserved; no 1A.4 reopening), §Rule: `mechanical-research-enumeration` (enumeration is `npm run test:integration` failure output), §Rule: `spec-verify-referenced-files` (verified 2026-04-23 — `upgrade.test.js`, `registry.js`, `v63-1a-4-...md` all exist; line anchors 130, 402-408, 410-414 spot-checked during epic authoring)
- [tests/integration/upgrade.test.js](../../tests/integration/upgrade.test.js) — target file
- [scripts/update/migrations/registry.js](../../scripts/update/migrations/registry.js) — authoritative source (read-only in this story)
- [v63-1a-4 story file](v63-1a-4-create-migration-script-3-x-to-4-0-js.md) — cross-reference target for AC7
- [lint-1-1 story file](lint-1-1-fix-ci-lint-and-add-dod-gate.md) — pattern precedent (forward-going remediation for a converged story, convergence preserved)
- [sprint-status.yaml 2026-04-22 lint-1.1 dev-story log](sprint-status.yaml) — documents the 3 failures as "1A.4 territory, scope-excluded per AC5" (this story closes that deferred obligation)
- [Convoke Epic — lint-epic-1](../planning-artifacts/convoke-epic-lint-cleanup-dod-gate.md) — structural analog (single-story cross-cutting epic)
- [Convoke Epic — mig-test-epic-1](../planning-artifacts/convoke-epic-migration-test-identity-assertions.md) — this story's parent epic

## Dev Agent Record

### Agent Model Used

claude-opus-4-7[1m] (acting via Winston architect persona per bmad-agent-architect skill's persona-carry-through directive; dev-story work executed while staying in architect mode on operator's explicit hand-off from /bmad-dev-story invocation)

### Debug Log References

**Task 1 — Pre-fix baseline (2026-04-23):**
- `npm run test:integration` → exit 1, **82/85 pass, 3 fail** — identities match story AC1/AC2/AC3 exactly:
  - `tests/integration/upgrade.test.js:130` — `reports breaking changes for v1.3.8 (chain reaches 1.7.x-to-2.0.0)` — AssertionError `2 !== 1`
  - `tests/integration/upgrade.test.js:404` — `finds applicable migrations for v1.7.1 (chains to 2.0.x)` — AssertionError `3 !== 2`
  - `tests/integration/upgrade.test.js:412` — `reports breaking changes for v1.7.1` — AssertionError `2 !== 1`
- `npm test` → exit 0, **1301/1301 pass** (grew from story-authoring baseline of 1268 due to v63-2-1 landing 33 new tests in parallel — confirmed via sprint-status, no regression risk).
- `npm run lint` → exit 0, clean (post-lint-1.1 baseline maintained).
- `git status` → expected working tree: modified sprint-status.yaml + tf-2-11 (operator-paused); csv-utils.js + test (v63-2-1); mig-test story file + epic file (this story's admin artifacts); v63-2-1 story file + its outputs (bmm-dependencies.csv, audit-bmm-dependencies.js, fixtures/, test). No contamination in `scripts/update/migrations/registry.js` — safe for Task 5 probe.

**Task 5 — Append-safety simulation (2026-04-23):**
- Pre-probe `git diff scripts/update/migrations/registry.js` → empty (clean).
- Probe installed: appended `{ name: '4.0.x-to-5.0.0', fromVersion: '4.0.x', breaking: true, ... }` to `MIGRATIONS` array + created stub `scripts/update/migrations/4.0.x-to-5.0.0.js` exporting `{ name, fromVersion, breaking, preview, apply }`.
- **Discovery during simulation**: the story's Task 5 as originally written assumed a registry-entry-only probe would suffice. In practice, `loadMigrationModule` (registry.js:157-170) gates chain-extension on `require('./{name}')` succeeding — a naked entry fails silently and the chain walker breaks *before* appending the probe. Created a minimal valid stub to make the probe honestly extend the chain. **Append-safety simulation passed** — all 85 tests green with the simulated chain extension. Identity assertions held as predicted.
- Post-probe revert: deleted probe entry from registry.js + deleted stub file. `git diff scripts/update/migrations/` → empty. Re-ran `npm run test:integration` → **85/85 pass**.

**Task 6 — Full verification (2026-04-23):**
- `npm run test:integration` → exit 0, **85/85 pass** (was 82/85 pre-fix).
- `npm test` → exit 0, **1301/1301 pass** (no unit regressions).
- `npm run lint` → exit 0, clean (no new warnings/errors in touched file).
- `npm run test:coverage` → exit 0, **2032/2032 pass, 0 fail** (unit + integration + team-factory + lib + p0 suites combined; 89.81% statements, 81.94% branches, 91.9% functions).
- `git diff --stat tests/ scripts/` → 1 production/test file modified in-scope: `tests/integration/upgrade.test.js` (15 line delta). The `tests/team-factory/csv-utils.test.js` modification in the same diff (52 line delta) is from parallel v63-2-1 work (in `review` per sprint-status), NOT this story — matches AC4's admin-exclusion clause.

### Completion Notes List

- **AC1 (v1.3.8 breaking identity):** Replaced `assert.equal(changes.length, 1)` + subsequent `changes[0].includes(...)` with a single `assert.ok(changes.some(c => c.includes('Product rename')), ...)` — existence check decouples test from chain length. Test name retained (already identity-based). Now passes against real state (2 breaking changes from v1.3.8 chain); proven append-safe via Task 5.
- **AC2 (v1.7.1 chain composition):** Removed `assert.equal(migrations.length, 2)` — three surviving assertions (`migrations[0].name`, `[0].breaking`, `[1].name`) retained unchanged; they establish identity by position + name. Test name updated from `(chains to 2.0.x)` to `(chain starts with 1.7.x-to-2.0.0 then 2.0.x-to-3.1.0)` to reflect the new richer identity contract. Passes against real state (3 migrations); proven append-safe.
- **AC3 (v1.7.1 breaking identity):** Parallel to AC1 — replaced `length === 1` + ordered `[0].includes` with `some(c => c.includes('rename') || c.includes('Convoke'))`. Retained the same substring disjunction that the original author intended. Passes; append-safe.
- **AC4 (scope):** Production/test diff = exactly 1 file in `tests/` (`upgrade.test.js`). `registry.js` unchanged (probe reverted cleanly per Task 5). Admin files (this story file, sprint-status.yaml, v63-1a-4 cross-reference) modified per AC4's explicit allowance. The `csv-utils.test.js` in the global diff is external v63-2-1 work — not this story.
- **AC5 (CI green):** All 4 in-scope CI job replicas green locally: `npm run lint` ✓, `npm test` (unit) 1301/1301 ✓, `npm run test:integration` 85/85 ✓, `npm run test:coverage` 2032/2032 ✓. Local Node version = 25.8.1; CI matrix (18/20/22) uses `node:test` which is stable across all three — no Node-version-specific dependency introduced.
- **AC6 (append-safety simulation):** Executed with one enhancement to the story spec — added a minimal loader stub alongside the probe registry entry (required by `loadMigrationModule`'s require-based gate; the story spec's naked-entry-only approach would have silently failed to extend the chain). Simulation produced 85/85 green with the probe in place, confirming identity contracts hold against chain extension. Revert was surgical + verified empty by `git diff`.
- **AC7 (convergence-rule preservation):** Post-review note appended to [v63-1a-4 story file](v63-1a-4-create-migration-script-3-x-to-4-0-js.md) under its existing "Convergence note" section. Note explicitly states `code-review-convergence` is upheld and mig-test-1.1 is NOT a Round 3 reopening — same pattern lint-1.1 established for 1A.2. No AC or Status change to v63-1a-4; purely informational.
- **Spec deviation surfaced during execution (documented at AC6 above):** Task 5's original subtask list assumed a registry-entry-only probe. In practice, the registry's chain-walker requires the migration module to be `require`-loadable — a bare entry fails silently. Enhanced Task 5 execution to create a transient valid stub alongside the entry; both reverted after simulation. Worth noting in retrospective: future identity-assertion stories touching the migration registry should specify "probe = entry + stub" rather than "probe = entry alone." Not a story bug; a discovery during implementation that ensures the simulation actually tested what it claimed to test.

### File List

**Modified by this story (1 file, in production/test scope per AC4):**

- `tests/integration/upgrade.test.js` — three assertion edits: line 128-132 (AC1 → `some`-based identity), line 402-408 (AC2 → removed length assertion, updated test name), line 410-414 (AC3 → `some`-based identity with `rename`/`Convoke` substring disjunction preserved)

**Modified by this story (admin artifacts, per AC4 explicit allowance):**

- `_bmad-output/implementation-artifacts/mig-test-1-1-replace-upgrade-test-count-assertions.md` — this story file (Status transitions + Tasks checkboxes + Dev Agent Record + File List + Change Log)
- `_bmad-output/implementation-artifacts/v63-1a-4-create-migration-script-3-x-to-4-0-js.md` — post-review note appended (Task 7; cross-reference + convergence-rule upheld)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` — status transitions for mig-test-1-1 (backlog → ready-for-dev → in-progress → review at completion) and log banners

**Created by this story (epic artifact, authored during /bmad-create-story phase):**

- `_bmad-output/planning-artifacts/convoke-epic-migration-test-identity-assertions.md` — parent epic for this story

**Touched during Task 5 simulation and fully reverted (not in final diff):**

- `scripts/update/migrations/registry.js` — one-line probe entry added + removed; verified clean via `git diff`
- `scripts/update/migrations/4.0.x-to-5.0.0.js` — minimal stub created + deleted

**NOT modified by this story (external parallel work observed in working tree):**

- `tests/team-factory/csv-utils.test.js`, `_bmad/bme/_team-factory/lib/utils/csv-utils.js`, `_bmad-output/implementation-artifacts/v63-2-1-create-bmm-dependency-scan-tool-and-registry.md`, `_bmad/_config/bmm-dependencies.csv`, `scripts/audit/audit-bmm-dependencies.js`, `tests/fixtures/bmm-dependencies/`, `tests/lib/audit-bmm-dependencies.test.js` — all from v63-2-1 (now in `review`). `_bmad-output/implementation-artifacts/tf-2-11-end-to-end-pilot-run.md` — from operator-paused tf-2-11 story. None of these are mig-test-1-1 outputs; documented here for reviewer transparency.

### Review Findings (Round 1, 2026-04-23)

Round 1 code review via `/bmad-code-review` with three parallel adversarial layers (Blind Hunter, Edge Case Hunter, Acceptance Auditor). **Acceptance Auditor verdict: all 7 ACs VERIFIED.** Blind + Edge surfaced 16 findings on top of AC compliance; after dedup and triage: 2 decision-needed, 4 patches, 5 defers, 5 dismissed.

**Decision-needed (2):**

- [x] [Review][Decision resolved] **D1 positional vs existence contract → option 3 (migration-name anchor)** — Resolved 2026-04-23 by operator. AC1/AC3 will be rewritten to derive the expected breaking-change description from the registry's `MIGRATIONS` array by migration name (`1.7.x-to-2.0.0`), then assert `changes.includes(thatDescription)`. This is the canonical `derive-counts-from-source` pattern — expected value comes from the authoritative source — and survives both reordering (fixes D1's concern) and description rewording (fixes D2's concern). Becomes patch D1-P (applied to both AC1 and AC3).

- [x] [Review][Decision resolved] **D2 description-substring vs migration-name identity anchor → option 2 (migration-name anchor)** — Resolved 2026-04-23 by operator, jointly with D1. Same code pattern as D1 above; subsumes P1 (substring over-match) by construction.

**Patches (4):**

- [x] [Review][Patch subsumed] **P1 `'rename'`/`'Convoke'` substring over-match** — Subsumed by D1+D2 resolution. The migration-name anchor pattern (D1-P) makes the substring irrelevant: the test asserts `changes.includes(v20Migration.description)` where `v20Migration` is looked up by name. Dismissed as separate patch; fix ships as part of D1-P.

- [x] [Review][Patch applied] **D1-P migration-name anchor for AC1 and AC3** — Rewrote both assertions to look up the v2.0.0 migration via `registry.getAllMigrations().find(m => m.name === '1.7.x-to-2.0.0')` and assert `changes.includes(v20Migration.description)`. Derives expected value from the authoritative source per `derive-counts-from-source`. Immune to description rewording (registry-backed), chain reordering (set-membership, not position), and substring over-match (exact-string equality). [tests/integration/upgrade.test.js:128-136, :411-419]

- [x] [Review][Patch applied] **P2 stale test name on AC1 test** — Updated from `'reports breaking changes for v1.3.8 (chain reaches 1.7.x-to-2.0.0)'` to `'reports breaking changes for v1.3.8 (chain includes 1.7.x-to-2.0.0 breaking migration)'`. Describes what the assertion verifies (identity), not an obsolete chain endpoint. [tests/integration/upgrade.test.js:128]

- [x] [Review][Patch applied] **P3 empty-chain failure message disambiguation** — Added `assert.ok(changes.length > 0, 'v1.X.Y chain must produce at least 1 breaking change')` before the identity assertion in both AC1 and AC3 tests. Chain-empty failures now surface as "chain must produce..." rather than masking as identity-mismatch. [tests/integration/upgrade.test.js:131, :415]

- [x] [Review][Patch applied] **P4 `migrations.length >= 2` precondition for AC2** — Added `assert.ok(migrations.length >= 2, 'v1.7.1 chain should produce at least 2 migrations')` before the positional `[0]`/`[1]` checks. Prevents `TypeError` on chain regression; produces meaningful assertion failure instead. [tests/integration/upgrade.test.js:404]

**Deferred (5):**

- [x] [Review][Defer] **Df1 `migrations[1].breaking` unchecked** — AC2 asserts `migrations[0].breaking === true` but does not check `migrations[1].breaking === false`. If `2.0.x-to-3.1.0`'s breaking flag ever flipped, this test would pass. Out of scope for count-rot fix — deferred to `derive-counts-from-source` compliance sweep. [tests/integration/upgrade.test.js:405-407]

- [x] [Review][Defer] **Df2 unfixed hardcoded count `config.workflows.length >= 13`** — Same rot class, different file area (config-level rather than registry-chain-level). Per Scope Exclusion: deferred to compliance sweep. [tests/integration/upgrade.test.js:289]

- [x] [Review][Defer] **Df3 unfixed hardcoded count `config.agents.length >= 7` with only 2/7 named** — Same rot class, same deferral path. Strengthening to `for (const a of ALL_7_AGENTS) assert.ok(config.agents.includes(a))` would be append-safe. [tests/integration/upgrade.test.js:442-449]

- [x] [Review][Defer] **Df4 v3.0.x chain-walker non-determinism in registry.js** — `getMigrationsFor('3.0.5')` could match either `3.0.x-to-3.1.0` OR `3.0.x-to-4.0.0` depending on registry ordering; `Array.prototype.find` returns the first match. Registry-side concern, pre-existing, out of this story's scope. Log for future registry-housekeeping story. [scripts/update/migrations/registry.js:151-153]

- [x] [Review][Defer] **Df5 append-safety simulation did not cover mid-chain insertion** — Task 5 probe extended the tail (`4.0.x-to-5.0.0`). A hypothetical mid-chain insert (e.g., a patch migration between `2.0.x-to-3.1.0` and `3.1.x-to-4.0.0`) would rot `migrations[1].name === '2.0.x-to-3.1.0'` in AC2. Positional-identity checks are only invariant under tail appends. AC1/AC3's `some(...)` would survive either way. Not blocking; log for future reviewers. [Task 5 / AC6]

**Dismissed (5 — reasoning retained for audit trail):**

- Dx1 "Sprint-status log self-contradicts with Dev Agent Record" (BH-5) — the Dev Agent Record explicitly *discloses* the spec-enhancement; it is transparency, not contradiction.
- Dx2 "AC4 scope violated by transient registry touch" (BH-6) — AC4 governs the *final* in-scope diff; transient Task 5 state was reverted and verified empty via `git diff`. The Acceptance Auditor explicitly VERIFIED AC4 after revert.
- Dx3 "Cross-reference links in v63-1a-4 note not validated" (BH-8) — `../../` from `implementation-artifacts/` correctly climbs to repo root; links hand-verified during authoring.
- Dx4 "Test count reporting nit" (BH-11) — unit suite 1301 is independent of integration 85; reporting is internally consistent.
- Dx5 "Case-sensitive `'Product rename'` substring" (EH-8) — defensive nit; no current or planned description variant uses different casing. Subset of D2.

**Convergence note:** Round 1 had 2 HIGH findings (Blind Hunter's BH-1, BH-2). Both were reclassified during triage: BH-1 ("migrations[2] untested") → P4 patch (length precondition) + Df1 defer; BH-2 ("positional guarantee lost") → D1 decision → D1-P patch (migration-name anchor). **All decisions resolved, all 4 patches applied, defers logged to deferred-work.md, 5 findings dismissed with rationale.** Post-patch verification: `npm run lint` clean, `npm test` 1321/1321 pass, `npm run test:integration` 85/85 pass, `npm run test:coverage` 2048/2048 pass. Per `code-review-convergence` rule, HIGH findings in Round 1 authorize Round 2. Round 2 decision deferred to operator — patches are small, mechanical, in same 2 `it(...)` blocks, and fully green; Round 2's expected value is low but non-zero (pattern precedent: v63-1a-2 Round 2 caught a HIGH bug introduced by Round 1's own trailing-slash fix).

## Change Log

- **2026-04-23 (code review Round 1, /bmad-code-review)** — 3 parallel adversarial layers (Blind Hunter, Edge Case Hunter, Acceptance Auditor). Acceptance Auditor VERIFIED all 7 ACs against live code. Blind + Edge surfaced 16 defensive-hardening findings; triage: 2 decision-needed (both resolved by operator → D1 option 3 + D2 option 2: migration-name anchor), 4 patches (all applied), 5 deferred to deferred-work.md, 5 dismissed. Patches applied: D1-P (rewrote AC1 and AC3 assertions to derive expected breaking-change description from `registry.getAllMigrations().find(m => m.name === '1.7.x-to-2.0.0').description` — canonical `derive-counts-from-source` pattern), P2 (updated AC1 test name to reflect identity assertion, not obsolete chain endpoint), P3 (added `changes.length > 0` precondition in AC1 and AC3 to disambiguate chain-empty vs identity-mismatch failures), P4 (added `migrations.length >= 2` precondition in AC2 to prevent TypeError on chain regression). Net: the shipped fix is now **stricter** than the original before-rot assertions — expected values are derived from the registry at test time, so registry wording changes auto-propagate and substring collisions are eliminated. Post-patch verification: `npm run lint` clean, `npm test` 1321/1321 pass (grew from 1301 due to v63-2-1 landing in parallel), `npm run test:integration` 85/85 pass, `npm run test:coverage` 2048/2048 pass. Per `code-review-convergence`: Round 1 had HIGH findings → Round 2 authorized but not auto-triggered; operator call per workflow step 7.
- **2026-04-23 (dev-story, /bmad-dev-story)** — Implementation complete. All 8 tasks checked, all 7 ACs satisfied. 3 assertion edits in `tests/integration/upgrade.test.js` replaced length-based counts with identity-based `some(...)` checks (AC1, AC3) and removed redundant length assertion while retaining positional identity checks (AC2). Append-safety simulation (Task 5 / AC6) proved the fix outlasts future registry growth — walk-through required a minor in-place enhancement (adding a loader stub alongside the registry probe, documented in Dev Agent Record) to honestly test the extended-chain case. Full local CI-job replica: `npm run lint` ✓, `npm test` 1301/1301 ✓, `npm run test:integration` 85/85 ✓, `npm run test:coverage` 2032/2032 ✓. Post-review cross-reference appended to v63-1a-4 upholding `code-review-convergence` (no Round 3 reopening — this is a forward-going remediation artifact, same pattern as lint-1.1 → 1A.2). Ready for `/bmad-code-review`.
- **2026-04-23 (create-story, /bmad-create-story)** — Story authored with 7 ACs + 8 tasks + comprehensive Dev Notes. Two pre-dispatch fixes applied during architect review: AC4 scoped to production/test code only (with explicit allowance for admin-file modifications per Tasks 7 + 8) to resolve contradiction with sprint-status + cross-reference updates; Task 5 revert step rewritten from `git checkout --` (which could overwrite unrelated working-tree changes) to surgical single-line deletion with pre-probe diff capture for safe fallback.
