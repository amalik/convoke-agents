# Story cov-1.1: Close 0.48% functions coverage gap to restore green CI

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

**Epic:** [cov-epic-1 — Restore Green CI: Close Functions Coverage Gap](../planning-artifacts/convoke-epic-restore-coverage-green-ci.md) (cross-cutting platform debt; single-story epic following [`convoke-epic-lint-cleanup-dod-gate.md`](../planning-artifacts/convoke-epic-lint-cleanup-dod-gate.md) precedent)
**Origin:** GitHub Actions `coverage` job red on every push since 2026-05-01T23:15:46Z. Diagnosed in party-mode session 2026-05-03 (Winston + Murat); root cause is c8 include-glob hygiene, not test or production-code defect.
**Sprint:** Out-of-band hotfix; runs in parallel with I97 Epic 2 Stories 2.3-2.7 (Vortex agent conversions); does not enter sprint capacity planning.
**Namespace decision:** No new skills or `_bmad/bme/` content. Work touches: (1) repo-root config [.c8rc.json](../../.c8rc.json), (2) possibly new test files under [tests/](../../tests/) if Path 2 is chosen, (3) possibly excluded paths under [scripts/](../../scripts/) if Path 1 is chosen. The `namespace-decision-for-new-skills` rule from [project-context.md](../../project-context.md) is N/A by construction — nothing new is authored under `_bmad/bme/`. The `covenant-compliance-for-convoke-skills` rule is N/A — no Convoke skill content touched.
**Safety analysis (path-safety rule):** N/A — no scripts that accept user paths or perform destructive operations are added or modified.

## Story

As the platform maintainer (Amalik) and any dev agent currently picking up an I97 conversion story,
I want `npm run test:coverage` to exit 0 in GitHub Actions,
so that CI returns to green and unrelated work can merge again.

## Context & Motivation

**Timeline:**
- **2026-05-01T14:56:02Z:** Last green CI run (commit before "Create format-conversion-load.test.js").
- **2026-05-01T23:15:46Z:** First red CI run. The `coverage` job has failed on every push since (8 consecutive failures across the i97-2-1 Emma POC ship + the 6 commits that followed).
- **2026-05-02:** I97 Story 2.1 (Emma POC) shipped and merged. Six new files landed under [scripts/migration/format-conversion/](../../scripts/migration/format-conversion/) plus [scripts/audit/reference-integrity.js](../../scripts/audit/reference-integrity.js).

**Why CI is red:** [.c8rc.json](../../.c8rc.json) currently includes `"scripts/**/*.js"` and `"index.js"` for coverage measurement, with `"tests/**"` and `"node_modules/**"` excluded. The new I97 files are migration **test infrastructure** (parity harness, personality harness, covenant-survival harness, fixtures) — they're functionally tests but live under `scripts/`, so c8 measured them. Their per-file functions coverage is intentionally low because they themselves *are* the test plumbing — there's nothing meaningful to test inside a Playwright-style harness wrapper.

**Per-file coverage (CI run 2026-05-03T10:50:13Z, before any fix):**

| File | Functions | Lines | Classification |
|---|---|---|---|
| [scripts/migration/format-conversion/personality-harness.js](../../scripts/migration/format-conversion/personality-harness.js) | 20% | 47% | I97 test infrastructure |
| [scripts/migration/format-conversion/parity-harness.js](../../scripts/migration/format-conversion/parity-harness.js) | 80% | 78% | I97 test infrastructure |
| [scripts/migration/format-conversion/covenant-survival-harness.js](../../scripts/migration/format-conversion/covenant-survival-harness.js) | 100% | 64% | I97 test infrastructure |
| [scripts/migration/format-conversion/fixtures/isolated-install.js](../../scripts/migration/format-conversion/fixtures/isolated-install.js) | 0% | 39% | I97 test fixture |
| [scripts/migration/format-conversion/fixtures/tmpDir-setup.js](../../scripts/migration/format-conversion/fixtures/tmpDir-setup.js) | 66% | 86% | I97 test fixture |
| [scripts/audit/reference-integrity.js](../../scripts/audit/reference-integrity.js) | 58% | 55% | UNCLASSIFIED — see Path 1 below |
| [scripts/audit/pf1-judge-calibration.js](../../scripts/audit/pf1-judge-calibration.js) | 0% | 19% | UNCLASSIFIED — see Path 1 below |
| [scripts/audit/pf1-validation-battery.js](../../scripts/audit/pf1-validation-battery.js) | 28% | 42% | UNCLASSIFIED — see Path 1 below |
| [scripts/update/migrations/1.1.x-to-1.3.0.js](../../scripts/update/migrations/1.1.x-to-1.3.0.js) | 0% | 75% | UNCLASSIFIED — legacy migration |
| [scripts/update/migrations/1.2.x-to-1.3.0.js](../../scripts/update/migrations/1.2.x-to-1.3.0.js) | 0% | 75% | UNCLASSIFIED — legacy migration |
| [scripts/update/migrations/3.0.x-to-3.1.0.js](../../scripts/update/migrations/3.0.x-to-3.1.0.js) | 0% | 43% | UNCLASSIFIED — legacy migration |

**Pre-fix CI baseline (2026-05-03T10:50:22Z):**
```
Statements   : 84.88% ( 18477/21767 )
Branches     : 80.48% (  3142/3904  )
Functions    : 86.34% (   373/432   )   ← 88% threshold trips here
Lines        : 84.88% ( 18477/21767 )
ERROR: Coverage for functions (86.34%) does not meet global threshold (88%)
```

**Partial fix already in working tree (uncommitted at story-authoring time):** [.c8rc.json](../../.c8rc.json) `exclude` array gained `"scripts/migration/format-conversion/**"`. Local re-run confirmed:
```
Statements   : 86.35% ( 17727/20528 )
Branches     : 80.98% (  3104/3833  )
Functions    : 87.52% (   365/417   )   ← still 0.48% short
Lines        : 86.35% ( 17727/20528 )
ERROR: Coverage for functions (87.52%) does not meet global threshold (88%)
```

The format-conversion exclude correctly removed 15 functions of test-infrastructure denominator (432→417). The residual 2-function gap requires deciding what to do with the **UNCLASSIFIED** files in the table above — that's the dev's call per ACs below.

**Gap math:** `ceil(0.88 × 417) = 367` functions needed; currently 365 covered → gap = 2 functions. If the denominator changes during implementation (more excludes added, or new files in `scripts/`), recompute as `gap = ceil(0.88 × N) - covered`.

**Why coverage trips while test matrix is green:** the `coverage` job runs `npm run test:coverage` which wraps the test runner in `c8` with `check-coverage: true` against the 88% functions threshold ([.c8rc.json](../../.c8rc.json)). The test matrix jobs (`test (18|20|22)`) run `npm test` + `npm run test:integration` directly, with no c8 wrapper and no threshold check. So matrix can pass while coverage gates fail — they measure different things. The coverage runner also exercises `tests/p0` in addition to the matrix's set ([package.json:42](../../package.json#L42) for `npm test` vs [package.json:47](../../package.json#L47) for `test:coverage`).

## Acceptance Criteria

**AC1 — c8 `check-coverage` gate passes; coverage-job exit-0 partly conditional on parallel `i97-bug-1` hotfix.** *(Amended 2026-05-03 mid-implementation per Option A operator authorization — pre-existing P0 test failures in `tests/p0/p0-activation.test.js` discovered at Task 4.4. Scope-isolated to parallel I97 hotfix story; see Change Log entry "Option A operator authorization 2026-05-03". Original AC1 binding to "GitHub Actions coverage job exits 0" rewritten to bind cov-1.1 to its narrowed scope and explicitly identify the second cause as out-of-scope.)*
**Given** the pre-fix baseline above (functions coverage 86.34% from CI; or 87.52% if the working-tree partial fix has been preserved)
**When** the story is implemented
**Then** local `npm run test:coverage` produces a c8 summary block with **no** `ERROR: Coverage for X does not meet global threshold` line — i.e., c8's `check-coverage` gate passes for all configured thresholds in [.c8rc.json](../../.c8rc.json) (`lines: 83`, `functions: 88`, `branches: 80`; statements has no explicit threshold and passes vacuously per c8 default).
**And** the GitHub Actions `coverage` job for the cov-1.1 commit shows the same — c8 summary block free of `ERROR:` line — even if the job's overall exit status is still non-zero due to scope-excluded test failures (see scope-isolation clause below).
**And** **scope-isolation clause:** the coverage-job's overall exit-0 outcome is conditional on a parallel I97 hotfix story (`i97-bug-1`, to be cut by SM after this story closes) addressing the pre-existing P0 test failures in [tests/p0/p0-activation.test.js](../../tests/p0/p0-activation.test.js) (75+ assertions across multiple converted Vortex agents — Emma, Mila, etc.). These failures pre-date cov-1.1 (verified in CI run #25277123569 log lines 5028–5210+) and are I97 conversion-artifact defects, not c8 hygiene. cov-1.1 satisfies its share of AC1 (c8 gate passing) when the c8 summary block is `ERROR:`-free; the full coverage-job-green outcome materializes when both cov-1.1 and i97-bug-1 land.
**And** the test matrix jobs (`test (18)`, `test (20)`, `test (22)`) continue to be green (zero regressions in test suite — see NFR1 / AC4 / AC6).

**AC2 — Format-conversion exclude is preserved and committed.**
**Given** the working tree at story-pickup time has [.c8rc.json](../../.c8rc.json) with `"scripts/migration/format-conversion/**"` in the `exclude` array (already-correct partial fix from party-mode session)
**When** the story is implemented
**Then** that exclude entry is preserved in the final committed [.c8rc.json](../../.c8rc.json).
**And** if the dev agent regenerated [.c8rc.json](../../.c8rc.json) from scratch for any reason, the format-conversion exclude is re-added and verified via `git diff`.

**AC3 — 88% functions threshold preserved (default) — or explicit Path 3 invocation with debt-ticket.**
**Given** the [.c8rc.json](../../.c8rc.json) `functions: 88` threshold currently sets the gate
**When** the story is implemented
**Then** by default, `functions: 88` is preserved in [.c8rc.json](../../.c8rc.json) and AC1 is closed by Path 1 (more excludes) or Path 2 (more tests).
**Or** if and only if Paths 1 and 2 are both demonstrated infeasible inside the suggested time budget (30 min Path 1 attempts + 30 min Path 2 attempts = 1 hour total before Path 3 fallback becomes available), the dev agent MAY drop `functions: 88` to `functions: 87`. In that case:
- A Fast Lane backlog candidate MUST be added to [`convoke-note-initiative-lifecycle-backlog.md`](../planning-artifacts/convoke-note-initiative-lifecycle-backlog.md) §2.3 with the entry: **"Restore c8 functions threshold to 88% — temporarily lowered to 87% by cov-1.1 on 2026-05-03 because Paths 1+2 were both infeasible at the time"** with rationale.
- The Change Log entry MUST cite which path-1 + path-2 attempts were tried and what blocked them.
- Operator (Amalik) confirmation MUST be obtained before commit.

**AC4 — Path decision rationale recorded in Dev Notes.**
**Given** three paths are available (FR3/FR4/FR5 in the epic):
1. **Classify-and-exclude operational tooling.** For each UNCLASSIFIED file in the Context table, add a one-line rationale tagging it as **operational-tooling** (excluded) or **production-path** (kept). Tooling files get added to [.c8rc.json](../../.c8rc.json) `exclude`. **Constraint:** legacy migration files (`scripts/update/migrations/{1.1,1.2,3.0}.x-to-*.js`) are production-path by construction — they are invoked by the migration chain in [scripts/update/migrations/registry.js](../../scripts/update/migrations/registry.js) and CANNOT be excluded under Path 1. They are addressable only via Path 2 (test) or Path 3 (threshold drop). Path 1 effectively targets the `scripts/audit/` subset minus any audit script imported by `scripts/convoke-*.js` (see Dev Notes "How to mechanically classify..." for the spot-check).
2. **Add ~2 targeted unit tests.** Pick the cheapest uncovered functions across the UNCLASSIFIED files, write `node:test`-style unit tests under [tests/](../../tests/) following existing taxonomy (e.g., [tests/unit/](../../tests/unit/) or [tests/lib/](../../tests/lib/)). Functions covered must be real entry points, not import-only shims.
3. **Drop threshold to 87%.** Per AC3, this is the fallback only.

**When** the story is implemented
**Then** the Dev Notes section MUST include a labeled subsection "Path Chosen" stating: which path (1, 2, or 3); a 2-3 sentence rationale; the post-fix functions coverage percentage from `npm run test:coverage`.
**And** if Path 1 was chosen: each newly-excluded file MUST appear in the File List with its tooling-vs-production classification reasoning.
**And** if Path 2 was chosen: each new test file MUST appear in the File List, follow the C1-retro `node:test` conventions (no Jest globals, uses `node:assert/strict`), and target real function entry points.

**AC5 — Out-of-scope backlog candidate logged.**
**Given** the broader classification question (`scripts/audit/*.js` + `scripts/update/migrations/*.js` as tooling vs production-path) is explicitly out of scope per epic FR6
**When** the story is implemented
**Then** a new Fast Lane entry is appended to [`convoke-note-initiative-lifecycle-backlog.md`](../planning-artifacts/convoke-note-initiative-lifecycle-backlog.md) §2.3 with title: **"Classify `scripts/audit/*.js` and legacy `scripts/update/migrations/{1.0,1.1,1.2,2.0,3.0}.x-to-*.js` as operational tooling vs production code path"** and a 1-paragraph description citing this story and the c8 glob-hygiene context.
**And** the entry references this story (`cov-1.1`) and the epic ([`convoke-epic-restore-coverage-green-ci.md`](../planning-artifacts/convoke-epic-restore-coverage-green-ci.md)).
**And** if Path 1 was chosen and the dev agent already classified some of those files in this story's diff, the backlog entry is amended to note which files are already classified (no double-work).

**AC6 — No new test regressions.** *(Amended 2026-05-03 at Task 4.2 verification per Option A authorization — local `npm test` exit 0 cannot be guaranteed under Node ≠ 20 due to environmental timing variance. Scope-isolated to environmental class.)*
**Given** the test matrix (`test (18)`, `test (20)`, `test (22)`) is currently green; only `coverage` is red
**When** the story is implemented
**Then** all three matrix jobs continue to exit 0 on the next push (CI Node 20 environment is the authoritative gate).
**And** local `npm test` exit status MAY be non-zero ONLY if the failure(s) match: (a) timing-related failures in `tests/lib/migrate-artifacts.test.js` (or similar timeout-bounded tests) on Node ≠ 20, AND (b) the same test(s) verifiably pass on CI Node 20 in the most recent run. All other failure classes block the AC.
**And** local `npm run test:integration` continues to exit 0.

## Scope Exclusions

- **Broad audit-scripts and legacy-migrations classification.** Per epic FR6 and AC5 of this story — log as backlog, do NOT classify all unclassified files in this story's diff unless directly required to close AC1.
- **Tightening other coverage thresholds** (`lines: 83 → ?`, `branches: 80 → ?`; or adding a `statements` threshold which c8 currently leaves at default 0). Currently passing; not in scope.
- **Promoting CI runners off Node.js 20** (the deprecation warning fires on every run; not blocking until 2026-06-02). Backlog candidate only.
- **Switching coverage tools or adding external reporters** (CodeCov, Coveralls). Not in scope.
- **Pre-commit hooks for coverage.** Per `lint-epic-1` precedent — friction-adding local hooks deferred.

## Tasks / Subtasks

- [x] **Task 1 — Capture pre-fix coverage baseline** (AC1, AC4; per `mechanical-research-enumeration` rule)
  - [x] 1.1. Node version verification: `node --version` reported `v25.8.1`; Node 20 not installed locally and no nvm available. `package.json` `engines: ">=18.0.0"` permits Node 25. Functions coverage is AST-driven (largely stable across Node versions); CI Node 20 is the authoritative gate per AC1. Proceeded with Node 25 and documented variance risk in Debug Log. Local baseline confirmed identical to CI's post-FR1 numbers (87.52% functions) — Node version variance was a non-issue empirically.
  - [x] 1.2. `git status .c8rc.json` showed `M .c8rc.json` with `"scripts/migration/format-conversion/**"` already in the `exclude` array. Working-tree partial fix preserved as required by AC2.
  - [x] 1.3. `npm run test:coverage 2>&1 | tee /tmp/cov-1-1-baseline.txt` — captured. Functions: 87.52% (365/417), within expected 87.0–87.9% band. No drift since story authoring.
  - [x] 1.4. Cheapest path identified via `c8 --reporter=json-summary` JSON output: Path 1 single-file exclude of `scripts/audit/pf1-judge-calibration.js` (12 total functions, 0 covered) yields 365/(417−12) = 90.12% — comfortable margin above 88% with minimum diff.

- [x] **Task 2 — Choose path and execute** (AC1, AC3, AC4)
  - [x] 2.1. **Path 1 chosen** — single-file exclude of `scripts/audit/pf1-judge-calibration.js`. Rationale recorded in Dev Notes "Path Chosen" subsection.
  - [x] 2.2. **Path 1 branch** executed:
    - [x] 2.2.1. Mechanical classification spot-check across all 8 audit scripts via `grep -rn "require.*['\"]\.\.*\/audit\/<name>" scripts/ index.js`: only `audit-bmm-dependencies.js` had production importers (`scripts/convoke-doctor.js:14`, 4 sites in `scripts/convoke-register-skill.js`). All other 7 audit scripts had ZERO production importers — confirmed operational-tooling. Full classification table in Dev Notes "Path Chosen" subsection.
    - [x] 2.2.2. Added single tooling file (`scripts/audit/pf1-judge-calibration.js`) to [.c8rc.json](../../.c8rc.json) `exclude` array. Did NOT exclude the other 6 confirmed-tooling files — they are minimum-diff scope-excluded and logged as I101 backlog candidate (see AC5).
    - [x] 2.2.3. Re-ran `npm run test:coverage` — Functions: 90.12% (365/405). c8 `check-coverage` gate passes for all configured thresholds: lines 87.52% ≥ 83, branches 80.99% ≥ 80, functions 90.12% ≥ 88. (Statements 87.52% — no explicit threshold; passes vacuously per c8 default.) No `ERROR: Coverage for X does not meet global threshold` line in output. Stopped after one addition per Task 2.2.3 ("stop as soon as functions ≥ 88%").
  - [ ] 2.3. **Path 2 branch** — not taken (Path 1 closed the gap with comfortable margin).
    - [ ] 2.3.1. — N/A
    - [ ] 2.3.2. — N/A
    - [ ] 2.3.3. — N/A
    - [ ] 2.3.4. — N/A
  - [ ] 2.4. **Path 3 branch** — not taken (Path 1 sufficient; 88% threshold preserved).
    - [ ] 2.4.1. — N/A
    - [ ] 2.4.2. — N/A
    - [ ] 2.4.3. — N/A
    - [ ] 2.4.4. — N/A

- [x] **Task 3 — Verify CI configuration unchanged** (AC1)
  - [x] 3.1. `git diff .github/workflows/ci.yml` — zero changes. CI workflow untouched.
  - [x] 3.2. [.c8rc.json](../../.c8rc.json) re-read: only the `exclude` array was modified (added one entry); `check-coverage`, `lines`, `functions`, `branches`, `reporter`, `include` all unchanged.

- [x] **Task 4 — Local pre-commit verification** (AC1, AC6) *(scope-amended per Change Log 2026-05-03 entry "Option A operator authorization" — pre-existing P0 test failures discovered at this task; scope-isolated)*
  - [x] 4.1. `npm run lint .c8rc.json` → exit 0 (only a benign config-warning that ESLint has no parser rule for `.json`; not a lint violation).
  - [x] 4.2. `npm test` → exit 1 with one failure: `tests/lib/migrate-artifacts.test.js:300:3 generateManifest + formatManifest produces non-empty output (test timed out after 30000ms)`. **Verified scope-excluded:** the same test passed cleanly on CI (Node 20) per CI run #25277123569 log line 2916–2917 (`ok 1 - generateManifest + formatManifest produces non-empty output`). Failure is a Node 25-specific timing variance, not a real test correctness regression. AC6 binds to "the test matrix `test (18|20|22)` continues to be green" — that condition still holds.
  - [x] 4.3. `npm run test:integration` → exit 0 (82/82 pass).
  - [x] 4.4. `npm run test:coverage` → exit 1 — but **NOT due to coverage threshold**. c8 gate passes (functions 90.12% ≥ 88%, no `ERROR:` line in c8 output). Exit 1 is driven by ~75 pre-existing P0 test failures in [tests/p0/p0-activation.test.js](../../tests/p0/p0-activation.test.js) affecting Emma, Mila, and likely all converted Vortex agents. **These failures pre-date cov-1.1's diff**: same failures present in CI run #25277123569 log lines 5028–5210+ (75 ✖ markers). They are I97 conversion-artifact defects (e.g. Emma's converted XML missing the `id` attribute) — scope-isolated to a parallel I97 hotfix story (`i97-bug-1`, to be cut by SM after this story closes). Cov-1.1's contribution to AC1 is closing the c8 functions threshold gap; the second cause closes when i97-bug-1 ships. See Change Log 2026-05-03 entry for AC1 amendment authorization.

- [x] **Task 5 — Log out-of-scope backlog candidate** (AC5)
  - [x] 5.1. [`convoke-note-initiative-lifecycle-backlog.md`](../planning-artifacts/convoke-note-initiative-lifecycle-backlog.md) §2.3 Fast Lane located.
  - [x] 5.2. Added I101 row: **"Classify `scripts/audit/*.js` and legacy `scripts/update/migrations/{1.0,1.1,1.2,2.0,3.0}.x-to-*.js` as operational tooling vs production code path"** — RICE 3·2·80%·2 = **2.4**. Captures the c8 hygiene followup work covering the 6 other confirmed-tooling audit scripts not excluded by minimum-diff Path 1 in this story.
  - [x] 5.3. Added U18 row: **"Migrate CI actions to Node.js 24"** — RICE 5·1·90%·1 = **4.5**. Hard deadlines: 2026-06-02 (forced opt-in) / 2026-09-16 (Node 20 removed). High recency.

- [ ] **Task 6 — Commit and push** (AC1) *(deferred to operator per CLAUDE.md "NEVER commit unless explicitly asked"; story precedent lint-1-1 also leaves commit/push to operator)*
  - [ ] 6.1. (operator action) Stage the minimal diff per File List below.
  - [ ] 6.2. (operator action) Commit message: `cov-1.1: close functions coverage gap, restore green CI`.
  - [ ] 6.3. (operator action) Push to main.
  - [ ] 6.4. (operator action) Watch the GitHub Actions run for the commit. Note: per AC1 amendment, the `coverage` job will likely remain red until i97-bug-1 (parallel hotfix) lands. cov-1.1's specific contribution — c8 functions threshold passes, no `ERROR: Coverage for X does not meet global threshold` line in c8 output — is verifiable by reading the c8 summary block of the run.

- [x] **Task 7 — Final verification** (AC1, AC4, AC5) *(7.1 deferred to operator; 7.2 + 7.3 done)*
  - [ ] 7.1. (operator action) Confirm GitHub Actions run for the commit shows: `lint + test (18|20|22) + python-test + security + package-check` green; `coverage` job at minimum no longer trips the c8 functions threshold (c8 summary block free of `ERROR:` line). Full coverage-job green expected after i97-bug-1 ships.
  - [x] 7.2. File List section updated with every modified file (see below).
  - [x] 7.3. sprint-status.yaml: `cov-1-1-close-functions-coverage-gap: in-progress → review`.

## Dev Notes

### Why this is a one-story epic (precedent: lint-epic-1, mig-test-epic-1)

CI hotfixes that emerge from incidents — not from a planned PRD — have followed the single-story-mini-epic pattern in this repo. See [`convoke-epic-lint-cleanup-dod-gate.md`](../planning-artifacts/convoke-epic-lint-cleanup-dod-gate.md) (8 errors + 15 warnings, 2026-04-22) and [`convoke-epic-migration-test-identity-assertions.md`](../planning-artifacts/convoke-epic-migration-test-identity-assertions.md) (3 test count drift assertions, 2026-04-23). cov-1.1 follows the same pattern: incident-driven, narrow scope, retrospective optional.

### Path 1 — likely shape based on spot-checks

Mechanical spot-checks at story-authoring time (see "How to mechanically classify..." below) produced this picture:
- The format-conversion harness exclusion already in working tree is correct — test infrastructure shouldn't be measured.
- Most files in [scripts/audit/](../../scripts/audit/) (the `pf1-*`, `reference-integrity`, etc. — see Spot-check note) had zero production importers and are operational tooling; they are good Path 1 candidates.
- One audit file is imported by production CLIs (`audit-bmm-dependencies.js`) and is NOT a Path 1 candidate.
- Legacy migration files (1.1/1.2/3.0) ARE production-path — invoked by the chain-walker in [registry.js](../../scripts/update/migrations/registry.js) — and CANNOT be excluded under Path 1. Their low functions coverage reflects rare-traversal-by-design rather than missing tests.

Net: Path 1 will likely close the gap by excluding 2-3 non-imported audit scripts. If the math doesn't work out (e.g., the audit excludes shift the denominator without crossing 88%), Path 2 (cheap unit tests on legacy migrations or remaining audit functions) is the fallback before Path 3.

### Why the 88% threshold matters

Per Murat (party-mode session 2026-05-03): "Don't pick C. Test infrastructure measuring its own coverage is a category error — c8 was never going to give you useful numbers on a Playwright-style harness wrapper. Option A is the honest fix." The threshold is a ratchet — once lowered, it tends to stay lowered. Path 3 is genuinely a fallback; per AC3's time budget, the dev agent should burn 30 min on Path 1 + 30 min on Path 2 (1 hour total) before invoking it.

### How to mechanically classify a script as tooling vs production-path

A file under [scripts/](../../scripts/) is **operational-tooling** if all three conditions hold:
1. **No production importers.** `grep -rn "require.*<basename>" scripts/ index.js | grep -v "<file's-own-dir>"` returns zero matches outside the file's own subtree.
2. **No CLI binding** in [package.json](../../package.json) `bin` section that's intended for end-user runtime use (only operator-facing CLIs like `convoke-doctor` are ambiguous — those are tooling for the operator but production for an end-user).
3. **Documented as audit / governance / migration helper** (file header comment, README under same directory, or [project-context.md](../../project-context.md) reference).

If any condition fails, the file is **production-path** and must be either tested (Path 2) or kept measured (don't exclude it).

**Spot-check at story-authoring time (2026-05-03):** [scripts/audit/audit-bmm-dependencies.js](../../scripts/audit/audit-bmm-dependencies.js) IS imported by [scripts/convoke-doctor.js:14](../../scripts/convoke-doctor.js#L14) and four sites in [scripts/convoke-register-skill.js](../../scripts/convoke-register-skill.js) — it is **production-path** and MUST NOT be excluded. Other audit scripts (`pf1-judge-calibration.js`, `pf1-validation-battery.js`, `reference-integrity.js`, `audit-bmad-init-refs.js`, `audit-skill-dirs.js`, `drift-snapshot.js`, `validate-marketplace.js`) had zero production importers at spot-check time. Apply the rubric per-file at implementation time — do not directory-glob `scripts/audit/**` to exclude.

### Testing standards summary

- **Test framework:** `node:test` (Convoke migrated off Jest in 2026-04-08 → 2026-04-11 per the C1 phantom-test retro). All new assertions use `node:assert/strict`.
- **Coverage tool:** [c8 v10.1.3](https://github.com/bcoe/c8) per [package.json:98](../../package.json#L98). Config in [.c8rc.json](../../.c8rc.json).
- **Coverage runner:** `npm run test:coverage` invokes `c8 node scripts/test-runner.js tests/unit tests/team-factory tests/lib tests/integration tests/p0` per [package.json:47](../../package.json#L47). Note this set is broader than `npm test`'s set — covered tests includes `tests/p0`, `tests/team-factory`, `tests/lib`.
- **Fixture isolation:** if Path 2 adds tests that touch the filesystem, use the `tmpDir` fixture pattern already established in [tests/lib/](../../tests/lib/) — see [refresh-installation-artifacts.test.js](../../tests/unit/refresh-installation-artifacts.test.js) for an example.

### Project Structure Notes

- No new directories created.
- No new files created under [scripts/](../../scripts/) or [_bmad/](../../_bmad/).
- Possibly new test files under [tests/unit/](../../tests/unit/) or [tests/lib/](../../tests/lib/) if Path 2 chosen.
- One config edit in [.c8rc.json](../../.c8rc.json) (Path 1 = `exclude` array; Path 3 = `functions` value).
- One backlog edit in [`convoke-note-initiative-lifecycle-backlog.md`](../planning-artifacts/convoke-note-initiative-lifecycle-backlog.md).
- This story file's status transitions in [sprint-status.yaml](sprint-status.yaml).

### References

- [.c8rc.json](../../.c8rc.json) — c8 configuration; the gate definition
- [.github/workflows/ci.yml](../../.github/workflows/ci.yml) §coverage (lines 93-108) — the failing job
- [package.json](../../package.json) §scripts.test:coverage — coverage invocation
- [convoke-epic-lint-cleanup-dod-gate.md](../planning-artifacts/convoke-epic-lint-cleanup-dod-gate.md) — single-story-mini-epic precedent (epic file)
- [lint-1-1-fix-ci-lint-and-add-dod-gate.md](lint-1-1-fix-ci-lint-and-add-dod-gate.md) — single-story-mini-epic precedent (story file; same shape as cov-1.1)
- [convoke-epic-migration-test-identity-assertions.md](../planning-artifacts/convoke-epic-migration-test-identity-assertions.md) — single-story-mini-epic precedent (epic file)
- [mig-test-1-1-replace-upgrade-test-count-assertions.md](mig-test-1-1-replace-upgrade-test-count-assertions.md) — single-story-mini-epic precedent (story file)
- [project-context.md](../../project-context.md) — §Rule: code-review-convergence (do not reopen Story 2.1), §Rule: derive-counts-from-source (use runtime coverage output), §Rule: mechanical-research-enumeration (per-file classification check), §Rule: spec-verify-referenced-files (verified 2026-05-03), §Rule: lint-passes-before-review (Task 4.1), §Rule: test-fixture-isolation (if Path 2)
- [convoke-note-initiative-lifecycle-backlog.md](../planning-artifacts/convoke-note-initiative-lifecycle-backlog.md) §2.3 Fast Lane — backlog candidate target (AC5)
- [c8 documentation](https://github.com/bcoe/c8#readme) — `check-coverage`, `exclude` glob semantics
- I97 Story 2.1 (Emma POC) — [convoke-report-operator-covenant-self-check-emma-conversion-2026-05-02.md](../planning-artifacts/convoke-report-operator-covenant-self-check-emma-conversion-2026-05-02.md) — origin of the new harness scripts

## Dev Agent Record

### Agent Model Used

claude-opus-4-7[1m] (Claude Opus 4.7, 1M context)

### Debug Log References

**Pre-fix baseline captured 2026-05-03 (Task 1.2 + 1.3):**

- `node --version` → `v25.8.1`. Node 20 not installed locally; nvm not present. `package.json` `engines: ">=18.0.0"` permits this. Variance risk acknowledged; CI Node 20 is the authoritative gate per AC1.
- `git status .c8rc.json` → `M .c8rc.json`. Working-tree partial fix (`scripts/migration/format-conversion/**` exclude) preserved per AC2.
- `npm run test:coverage 2>&1 | tee /tmp/cov-1-1-baseline.txt` → exit 1. c8 summary: Statements 86.35%, Branches 80.48%, Functions **87.52%** (365/417), Lines 86.35%. ERROR: Coverage for functions (87.52%) does not meet global threshold (88%). Identical to CI's post-FR1 numbers — Node 25 vs 20 was empirically a non-issue for c8 functions on this codebase.
- `c8 --reporter=json-summary` (Task 1.4) — exact per-file function counts captured for all 8 audit scripts and 13 migration files (table preserved in Path Chosen).

**Post-fix verification 2026-05-03 (Task 2.2.3 + 4.x):**

- `npm run test:coverage` → c8 summary: Statements 87.52%, Branches 80.99%, Functions **90.12%** (365/405), Lines 87.52%. **No `ERROR: Coverage for X does not meet global threshold` line in output.** c8 `check-coverage` gate passes for all four metrics.
- `npm run test:coverage` overall exit code → 1. Investigated: failures are 75+ pre-existing P0 test assertions in [tests/p0/p0-activation.test.js](../../tests/p0/p0-activation.test.js) affecting Emma, Mila, and likely all converted Vortex agents. Same failures present in CI run #25277123569 log lines 5028–5210+ — they pre-date cov-1.1 and are I97 conversion-artifact defects. Scope-isolated per AC1 amendment; new I97 hotfix story `i97-bug-1` to be cut by SM.
- `npm test` → exit 1 with one failure: `tests/lib/migrate-artifacts.test.js:300:3 generateManifest + formatManifest produces non-empty output (test timed out after 30000ms)`. Same test passed on CI Node 20 (run #25277123569 line 2916–2917 `ok 1`). Node 25 timing variance, not a regression; scope-isolated per AC6 amendment.
- `npm run test:integration` → exit 0 (82/82 pass). Clean.
- `npm run lint .c8rc.json` → exit 0 (one benign config warning about no parser for `.json`).
- `git diff .github/workflows/ci.yml` → no changes (Task 3.1).

### Completion Notes List

- **Task 1 — baseline captured.** Empirical confirmation that local Node 25.8.1 produces functions coverage identical to CI Node 20 (87.52% post-FR1, 90.12% post-fix). The story's Node-version-match warning was a useful prophylactic but did not bite on this codebase's coverage metric.
- **Task 2.2 — Path 1 chosen (single-file exclude).** `scripts/audit/pf1-judge-calibration.js` excluded — operational tooling with zero production importers and 0/12 functions covered. Result: functions 87.52% → **90.12%** (365/405). Comfortable margin above 88% threshold; minimum-diff approach per Task 2.2.3.
- **Task 2.2.1 — full audit-scripts classification table generated** (mechanical `grep -rn "require.*['\"]\.\.*\/audit\/<name>"` for all 8 audit scripts). Only `audit-bmm-dependencies.js` is production-path (5 import sites in `convoke-doctor.js` + `convoke-register-skill.js`). Remaining 6 confirmed-tooling files (`pf1-validation-battery`, `reference-integrity`, `audit-bmad-init-refs`, `drift-snapshot`, `validate-marketplace`, `audit-skill-dirs`) NOT excluded in this story per minimum-diff principle (Task 2.2.3 "stop as soon as functions ≥ 88%"). Logged as I101 for follow-on hygiene work.
- **Task 4.4 — discovery: dual-cause CI red.** Local `npm run test:coverage` exits 1 even with c8 gate passing. Investigation surfaced ~75 P0 test failures pre-dating cov-1.1, present in CI run #25277123569. These are I97 conversion-artifact defects (e.g. Emma's converted XML missing `id` attribute, Mila's persona.role missing). HALT triggered; presented options to operator; Option A (story split + parallel `i97-bug-1` hotfix) authorized 2026-05-03.
- **Task 5 — backlog candidates added.** I101 (audit-scripts/legacy-migrations classification, RICE 2.4) for AC5; U19 (Node 24 CI action-runtime migration, RICE 4.5) for Task 5.3. *(U19 was originally appended as U18 but renumbered during R1 code-review per Patch P01 — existing U18 was already taken.)*
- **Tasks 6 + 7.1 deferred to operator** per CLAUDE.md "NEVER commit unless explicitly asked" and lint-1-1 precedent.

### Path Chosen

**Path 1 — single-file exclude of `scripts/audit/pf1-judge-calibration.js`.**

**Rationale:** the file has 12 functions, 0 covered (highest uncovered:total ratio of any candidate file), and zero production importers (verified via `grep -rn "require.*['\"]\.\.*\/audit\/pf1-judge-calibration" scripts/ index.js`). Excluding it alone yields 365/(417−12) = **365/405 = 90.12%** functions coverage — comfortable margin above the 88% threshold with the smallest possible diff. Per Task 2.2.3 ("stop as soon as functions ≥ 88%"), no further excludes were needed.

**Audit-scripts classification table (mechanical, 2026-05-03):**

| File | Total Fn | Covered Fn | Production importers | Disposition |
|---|---|---|---|---|
| `pf1-judge-calibration.js` | 12 | 0 | 0 | **Excluded by cov-1.1** ✓ |
| `pf1-validation-battery.js` | 7 | 2 | 0 | Tooling — backlog (I101) |
| `reference-integrity.js` | 12 | 7 | 0 | Tooling — backlog (I101) |
| `audit-bmad-init-refs.js` | 10 | 8 | 0 | Tooling — backlog (I101) |
| `drift-snapshot.js` | 16 | 13 | 0 | Tooling — backlog (I101) |
| `validate-marketplace.js` | 11 | 10 | 0 | Tooling — backlog (I101) |
| `audit-skill-dirs.js` | 6 | 6 | 0 | Tooling but already 100% covered — no action |
| `audit-bmm-dependencies.js` | 20 | 19 | 5 (convoke-doctor.js + convoke-register-skill.js × 4) | **Production-path — KEEP** |

**Why minimum-diff over comprehensive cleanup:** AC1's binary criterion (88% threshold met) is satisfied by the single-file exclude. Excluding the other 6 confirmed-tooling files would add ~74 functions of denominator delta and shift the ratio further (to ~93%), but for no AC value. The 6 remaining files become a tightly-scoped backlog item (I101) with all the spadework done — RICE 2.4 captures the work for a future c8 hygiene pass when prioritized.

### Review Findings

**Round 1 — 2026-05-03.** 3-layer adversarial review (Blind Hunter + Edge Case Hunter + Acceptance Auditor). Triage: 1 decision-needed, 7 patch, 1 defer, 16 dismissed. No HIGH findings post-triage (auditor verdict CHANGES REQUESTED on backlog hygiene only — load-bearing AC1 verified live in CI run #25282010960).

**Decision-needed:**

- [x] [Review][Decision resolved] CR-cov-1-1-D01 (Edge HIGH) — `pf1-judge-calibration.js` exclude has cross-coupling within `scripts/audit/`. **Resolved 2026-05-03 by operator: option (c) — sharpen I101 backlog handoff.** Asymmetry preserved (cov-1.1 minimum-diff principle held); risk bounded (audit-tooling is operator-run; production importers route through `audit-bmm-dependencies.js` which IS measured). I101 description to be amended to explicitly call out the cross-coupling cluster (`pf1-judge-calibration` + `pf1-validation-battery` + their test files) as a unit-of-work for the followup story. See **CR-cov-1-1-P08** below for the patch action.

**Patches:**

- [x] [Review][Patch applied] CR-cov-1-1-P01 (Edge HIGH + Auditor CONCERN) — U18 backlog ID collision: existing U18 already taken by `--dry-run` UX hardening bundle for convoke-register-skill. Renumber the new Node.js 24 migration row to U19. [`convoke-note-initiative-lifecycle-backlog.md:526`]
- [x] [Review][Patch applied] CR-cov-1-1-P02 (Edge HIGH) — Story References link to Emma POC report uses bare relative filename which resolves under `_bmad-output/implementation-artifacts/`, but the file lives under `_bmad-output/planning-artifacts/`. Rewrite the link target to `../planning-artifacts/convoke-report-operator-covenant-self-check-emma-conversion-2026-05-02.md`. [`cov-1-1-close-functions-coverage-gap.md:258`]
- [x] [Review][Patch applied] CR-cov-1-1-P03 (Edge MED) — Story prose cites a non-existent `statements: 83` threshold three places: Scope Exclusions list, Path Chosen Task 2.2.3 evidence ("83/80/88/83"), AC1 amendment text ("all four metrics"). `.c8rc.json` only configures `lines: 83, functions: 88, branches: 80` — no `statements` (c8 default = 0). Fix wording to reflect the three actually-configured metrics; statements passes vacuously. [`cov-1-1-close-functions-coverage-gap.md:73, 121, 139`]
- [x] [Review][Patch applied] CR-cov-1-1-P04 (Auditor MINOR) — Story File List omits the new epic file (`convoke-epic-restore-coverage-green-ci.md`) — diff creates 5 files but story File List enumerates only 4. [`cov-1-1-close-functions-coverage-gap.md` File List]
- [x] [Review][Patch applied] CR-cov-1-1-P05 (Blind MED) — U19 entry (after P01 renumber) conflates GitHub Actions runtime deprecation (Node.js 20 → 24 for action JS runtime) with the package's Node-version test matrix (`[18, 20, 22]`). The two are independent; bundling could mislead an operator into dropping Node 18 from the matrix unnecessarily. Split scope or clarify in the entry. [`convoke-note-initiative-lifecycle-backlog.md:526`]
- [x] [Review][Patch applied] CR-cov-1-1-P06 (Blind MED) — AC3 internal time-budget contradiction: AC3 line says "30 min Path 1 + 30 min Path 2 = 1 hour total before Path 3"; Dev Notes "Why the 88% threshold matters" says "burn ~30 min on Path 1 + Path 2 before invoking it". Pick one budget. [`cov-1-1-close-functions-coverage-gap.md:110, 217`]
- [x] [Review][Patch applied] CR-cov-1-1-P07 (Blind LOW) — AC5 amend-clause states "if Path 1 was chosen and the dev agent already classified some of those files in this story's diff, the backlog entry is amended to note which files are already classified (no double-work)." I101 references the classification table by pointing at "story Dev Notes spot-check" but does not enumerate the 6 confirmed-tooling files in-row. Inline the file list (or anchor-link to the story Dev Notes section directly). [`convoke-note-initiative-lifecycle-backlog.md:527`]
- [x] [Review][Patch applied] CR-cov-1-1-P08 (Edge HIGH, resolved from D01) — Amend I101 description in `convoke-note-initiative-lifecycle-backlog.md` to explicitly call out the **`pf1-judge-calibration` + `pf1-validation-battery` cross-coupling cluster** (including test files `tests/lib/pf1-validation-battery.test.js` and `tests/lib/pf1-judge-prompt.test.js`) as a unit-of-work for the followup story. The cluster should be classified-and-handled together (either symmetric exclude OR per-function unit tests OR a c8 ignore comment) rather than file-by-file. [`convoke-note-initiative-lifecycle-backlog.md:527`]

**Deferred:**

- [x] [Review][Defer] CR-cov-1-1-D01 (Blind LOW) — sprint-status.yaml `last_updated` field has grown into a multi-paragraph prose log embedded in a YAML scalar value. Risk of YAML parse issues if a future entry contains reserved characters; diffs are also harder to read. **Pre-existing pattern across all stories — out of scope for cov-1.1.** Logged to deferred-work.md for a future `last_updated_log:` structural-cleanup story.

**Dismissed (16, summary):** AC1+AC6 amendment goalpost-moving (operator-authorized via Option A; documented in Change Log); glob vs literal-path c8 exclude mixing (empirically validated — exclude matched in CI run #25282010960 yielding 90.12% functions); AC1 "ERROR:" string-format dependency (already clarified by behavioral "i.e." clause in same AC); AC6 escape-hatch "or similar timeout-bounded tests" (operator-authorized scope); "8 consecutive failures" rough count (verified ~accurate); cov-epic-1-retrospective placeholder placement (matches lint-epic-1 / mig-test-epic-1 precedent); ESLint config-warning interpretation (verified actual ESLint output); epic Overview prose framing of reference-integrity (FR1 + per-file table separately accurate); pre-fix coverage covered-numerator-drop pedantry; Task 5.3 ratification governance (story-spec-authored task); audit-skill-dirs note tangent; .c8rc.json reformat-mixed-with-semantic-change; CI matrix Node-version pre-existing design; Path 1 prediction-vs-actual (story-authoring guidance); fresh post-amendment coverage run (CI #25282010960 satisfies the verification).

**No Round 2 trigger:** zero HIGH findings post-triage (the 3 HIGH findings raised by Edge Case Hunter were classified — 1 to decision-needed [D01], 2 to patch [P01, P02]). Per `code-review-convergence` rule, Round 1 is the convergence point unless decision-needed resolution introduces structural changes.

### File List

**Modified by this story (5 files, in scope):**

- `.c8rc.json` — added `scripts/audit/pf1-judge-calibration.js` to `exclude` array; reformatted array to multi-line for readability. Format-conversion exclude (from working tree at pickup) preserved per AC2.
- `_bmad-output/planning-artifacts/convoke-epic-restore-coverage-green-ci.md` — **new** epic file (single-story mini-epic; lint-epic-1 / mig-test-epic-1 precedent). 6 FRs / 4 NFRs; references the cov-1.1 story.
- `_bmad-output/planning-artifacts/convoke-note-initiative-lifecycle-backlog.md` — appended I101 (audit-scripts classification, RICE 2.4) and U19 (Node 24 CI action-runtime migration, RICE 4.5) to §2.3 Fast Lane. *(Note: U19 was originally appended as U18 but renumbered during R1 code-review since U18 was already taken — see cov-1-1 R1 Patch P01.)*
- `_bmad-output/implementation-artifacts/cov-1-1-close-functions-coverage-gap.md` — this story file (Status, AC1/AC6 amendments, Tasks/Subtasks checkboxes, Dev Agent Record, File List, Change Log, Review Findings).
- `_bmad-output/implementation-artifacts/sprint-status.yaml` — status transition `ready-for-dev → in-progress → review` for `cov-1-1-close-functions-coverage-gap`; matching epic transition `cov-epic-1: in-progress`; `last_updated` chain extended at story authoring time.

**Pre-existing in working tree at story pickup (already present, this story preserves them):**

- The format-conversion exclude in `.c8rc.json` (from party-mode session 2026-05-03; preserved per AC2).

**Not modified by this story:**

- No production scripts touched. No new tests added (Path 2 not taken). No CI workflow changes. No migration scripts touched.

## Change Log

- **2026-05-03 (Round 1 code review — V-pass+R1 only per `feedback_avoid_overcomplicating_audits`).** `/bmad-code-review` Round 1 executed with 3 parallel adversarial layers (Blind Hunter + Edge Case Hunter + Acceptance Auditor). Triage: **1 decision-needed (resolved 2026-05-03 by operator option (c) — sharpen I101 backlog handoff)**, **8 patches (all batch-applied)**, **1 defer (logged to deferred-work.md)**, **16 dismissed as noise / pre-existing / operator-resolved**. Auditor verdict: APPROVE on substantive ACs (AC1 verified live in CI #25282010960 c8 summary block free of `ERROR:` line, functions 90.12%); CHANGES REQUESTED on backlog hygiene (U18 ID collision, File List omission of epic file, fictional `statements: 83` threshold prose) — all addressed by patches P01–P08. Patches applied: (P01) U18→U19 renumber in backlog; (P02) Emma report relative-path fix in story References; (P03) drop fictional `statements: 83` threshold from 3 prose locations and align AC1 wording with actually-configured metrics; (P04) add new epic file to story File List; (P05) U19 entry scope-clarified to action-runtime-only (separate from package test-matrix); (P06) AC3 time-budget aligned at 60 min total (Dev Notes `~30 min` rephrased); (P07) I101 description inlines the 8-row classification table; (P08) I101 amended to call out `pf1-judge-calibration` ↔ `pf1-validation-battery` cross-coupling cluster as unit-of-work for followup. **R2 NOT triggered** per `code-review-convergence` rule + `feedback_avoid_overcomplicating_audits` — V-pass+R1 only; the 3 HIGH findings (D01, P01, P02) were resolved in-place; patches were content/governance fixes, no structural rewrites.
- **2026-05-03 (Option A operator authorization — story-split scope amendment).** At Task 4.4 verification, discovered that `npm run test:coverage` exit code 1 had **two** causes, not one: (a) c8 functions threshold trip (cov-1.1's scope) and (b) ~75 pre-existing P0 test failures in [tests/p0/p0-activation.test.js](../../tests/p0/p0-activation.test.js) for Emma, Mila, and likely all converted Vortex agents. Verified pre-existence in CI run #25277123569 log lines 5028–5210+ — these are I97 conversion-artifact defects (e.g. Emma's converted XML missing `id` attribute), not c8 hygiene. HALT triggered per dev-story workflow Step 5; options presented to operator. **Operator (Amalik) selected Option A 2026-05-03:** narrow cov-1.1 to c8 hygiene only; cut a parallel I97 hotfix story (`i97-bug-1`) for the P0 test failures. AC1 amended in-place to bind cov-1.1 to "c8 summary block free of `ERROR:` line" (binary, single-cause) with explicit scope-isolation clause for the parallel hotfix; AC6 amended to scope-isolate Node-version-environmental timing failures. Both amendments preserve cov-1.1's narrowed-but-completable shape; full coverage-job-green outcome materializes when both stories ship.
- **2026-05-03 (story authored).** Story authored by Bob (SM) via `bmad-create-story` workflow. Origin: party-mode session (Winston + Murat) diagnosed CI red since 2026-05-01T23:15:46Z; root cause = c8 include-glob caught I97 test infrastructure. Partial fix (`scripts/migration/format-conversion/**` exclude) already in working tree at story-authoring time, recovering 87.52% functions; this story closes the residual 0.48% gap to 88%.
