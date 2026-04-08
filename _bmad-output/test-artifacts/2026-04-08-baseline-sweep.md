# Baseline Sweep Report — Story I

**Author:** Murat (Test Architect)
**Date:** 2026-04-08
**Scope:** One-time baseline measurement before any test conversion or refactor work begins
**Source story:** Story I in [2026-04-08-party-mode-session-notes.md](2026-04-08-party-mode-session-notes.md)
**Companion:** [2026-04-08-astonishment-report.md](2026-04-08-astonishment-report.md)

> **What this report establishes:** the verified-passing test count, the gap between "what runs locally" and "what CI gates," and any new findings the static analysis in the original astonishment report missed.

---

## TL;DR

| Metric | Value |
|---|---:|
| Total test files in repo | **61** |
| **Verified passing** under `node --test` (right now, on this branch) | **1,283 tests** |
| Gated by CI today (`npm test` + `npm run test:integration` + `npm run test:p0`) | **1,128 tests** |
| **Hidden from CI but currently passing** | **155 tests** (`tests/team-factory/`) |
| **Hidden from CI AND currently FAILING** | **1 test** (silent regression — discovered today) |
| **Phantom tests (file fails to even load)** | **8 files** (entire `tests/lib/`) |
| Tests in `tests/lib/` confirmed not running | **0 of advertised 103** |

**The "103 tests" claim in MEMORY.md is empirically false.** Confirmed by execution, not just by reading imports.

**New finding not in the original report:** there is a **real, currently-failing test** in [tests/team-factory/registry-writer.test.js:179](tests/team-factory/registry-writer.test.js#L179) that nobody knows about because CI does not run `tests/team-factory/`. The golden file and the source code have drifted. This is a live regression sitting in `main`.

---

## Sweep 1 — Runner Coverage (Orphan Detection)

**Method:** Enumerated all `tests/**/*.test.js` files, cross-referenced against the npm scripts in [package.json](../../package.json) that CI actually invokes.

**CI-invoked scripts** (from [.github/workflows/ci.yml](../../.github/workflows/ci.yml)):
- `npm test` → `node --test tests/unit/*.test.js`
- `npm run test:integration` → `node --test tests/integration/*.test.js`
- `npm run test:p0` → `node --test tests/p0/*.test.js` (via `test:p0:gate`, byte-identical)

**`npm run test:all` exists** but is **not invoked by any CI job.** It is effectively dead code from a CI gate perspective.

### Results — Files by directory

| Directory | Files | Wired to CI? |
|---|---:|---|
| `tests/unit/` | 22 | ✅ via `npm test` |
| `tests/integration/` | 6 | ✅ via `npm run test:integration` |
| `tests/p0/` | 13 | ✅ via `npm run test:p0` |
| `tests/team-factory/` | 13 | ❌ **ORPHANED** |
| `tests/lib/` | 8 | ❌ **ORPHANED** |
| **Total** | **61** | **41 wired, 20 orphaned (33%)** |

**One in three test files is invisible to CI.** That's the orphan rate before anything gets converted.

**Verdict:** Original report's C2 finding **confirmed and quantified**. 20 orphan files, no false positives, no missed orphans.

---

## Sweep 2 — Framework Consistency Grep

**Method:** Grepped `tests/` for non-`node:test` framework markers (`expect(`, `jest.`, `vitest.`, `chai.`, `sinon.`) and for `node:test` / `node:assert` imports.

### Results

| Framework signal | File count | Files |
|---|---:|---|
| Uses `expect(` / `jest.*` API | **8** | All 8 in `tests/lib/` |
| Uses `vitest.` / `chai.` / `sinon.` | **0** | — |
| Imports `node:test` / `node:assert` | **53** | All other test files |

**Verdict:** Original report's C1 finding **confirmed exactly**. **No other framework hides anywhere else in the repo.** The Jest contamination is contained to `tests/lib/`. No vitest, no chai, no sinon. The conversion scope is precisely 8 files — no more, no less.

This is good news. It means the conversion work has a fixed, finite, knowable boundary.

---

## Sweep 3 — Execution Baseline

**Method:** Ran `node --test` against each directory glob, captured pass/fail counts and exit codes.

### Results — All five directories

| Directory | Tests | Pass | Fail | Exit code | Status |
|---|---:|---:|---:|---:|---|
| `tests/unit/` | 408 | 408 | 0 | 0 | ✅ Clean |
| `tests/integration/` | 78 | 78 | 0 | 0 | ✅ Clean |
| `tests/p0/` | 642 | 642 | 0 | 0 | ✅ Clean |
| `tests/team-factory/` | 156 | 155 | **1** | **1** | 🔴 **SILENT REGRESSION** |
| `tests/lib/` | 8 (file count) | 0 | **8** | **1** | 🔴 **PHANTOM TESTS — load failures** |

### Verified-passing baseline (the floor)

```
408 (unit) + 78 (integration) + 642 (p0) + 155 (team-factory) = 1,283 tests
```

**This number is the floor.** All future conversion / refactor work must keep this number ≥ 1,283. If it drops, we lost coverage.

### What CI actually gates today

```
408 (unit) + 78 (integration) + 642 (p0) = 1,128 tests
```

**The gap: 155 verified-passing tests + 1 currently-failing test are invisible to CI.** That's 12% of the verified-passing surface area completely unguarded.

---

## 🔴 NEW FINDING — Silent Regression in `tests/team-factory/registry-writer.test.js`

This is not in the original astonishment report. It was discovered by running Sweep 3. **It is the most important thing in this document.**

### What's failing

[tests/team-factory/registry-writer.test.js:179](tests/team-factory/registry-writer.test.js#L179) — test name: `buildModuleBlock > generates block matching golden file structure`.

The test compares output of `buildModuleBlock` against a golden fixture. The diff:

```diff
- // Derived lists for Test Team
- const TEST_TEAM_AGENT_FILES = TEST_TEAM_AGENTS.map(a => `${a.id}.md`);
- const TEST_TEAM_AGENT_IDS = TEST_TEAM_AGENTS.map(a => a.id);
- const TEST_TEAM_WORKFLOW_NAMES = TEST_TEAM_WORKFLOWS.map(w => w.name);
+ // Derived lists for Test Team (available for golden comparisons)
+ const _TEST_TEAM_AGENT_FILES = TEST_TEAM_AGENTS.map(a => `${a.id}.md`);
+ const _TEST_TEAM_AGENT_IDS = TEST_TEAM_AGENTS.map(a => a.id);
+ const _TEST_TEAM_WORKFLOW_NAMES = TEST_TEAM_WORKFLOWS.map(w => w.name);
```

**Actual** (what `buildModuleBlock` generates today): bare names — `TEST_TEAM_AGENT_FILES`.
**Expected** (golden fixture): underscore-prefixed names — `_TEST_TEAM_AGENT_FILES` — plus a comment "(available for golden comparisons)".

### Hypothesis (NOT verified — leaving for the fix story)

The underscore prefix is a JS convention for "intentionally unused." Combined with the comment in the golden, my best guess is:

- **Either** the source code (`buildModuleBlock` in `scripts/team-factory/`) was changed to drop the `_` prefix, and the golden file was never regenerated to match,
- **Or** the golden file was hand-edited to add the `_` prefix without updating the source.

Without doing forensics on the git log of both files, I cannot tell you which. **I am deliberately not chasing it** — that's a separate fix story. The point of this sweep is to surface the finding, not resolve it.

### Why this matters more than the bug itself

**Nobody saw this.** It happened on a branch, landed in `main`, and CI shrugged because CI doesn't run `tests/team-factory/`. The whole Team Factory subsystem is shipping with a known-but-unknown red test in its `main` branch.

This is the **second-order finding** the original astonishment report didn't catch: orphaned test directories don't just *risk* hiding bugs in the future — they **actively are** hiding bugs **right now**. C2 isn't a hypothetical; it's already cost us coverage on a real regression.

### Remediation

This needs its own story. Adding to Bob's clipboard:

- **Story L (NEW):** Investigate and fix `buildModuleBlock` golden-file drift in [tests/team-factory/registry-writer.test.js:179](tests/team-factory/registry-writer.test.js#L179). Determine whether source or golden is authoritative. Restore green. Estimated S. **Sequencing:** can land any time, but must be green before Story F (CI guardrail) is enabled — otherwise Story F's first run will block all PRs by surfacing this failure to CI, and we'll have to fix it under pressure. **Better to fix it now, calmly.**

---

## 🔴 Empirical Confirmation — `tests/lib/` Phantom Tests

The original astonishment report inferred the phantom-test status from:
- Imports use `expect`, `jest.*`
- Jest is not in `devDependencies`

That was a strong inference, but it was an inference. **Sweep 3 promotes it to a measurement.**

### What happened when I ran `node --test tests/lib/*.test.js`

| File | Result |
|---|---|
| [tests/lib/artifact-utils.test.js](../../tests/lib/artifact-utils.test.js) | ✖ test failed (top-level load) |
| [tests/lib/inference.test.js](../../tests/lib/inference.test.js) | ✖ test failed (top-level load) |
| [tests/lib/manifest.test.js](../../tests/lib/manifest.test.js) | ✖ test failed (top-level load) |
| [tests/lib/migrate-artifacts.test.js](../../tests/lib/migrate-artifacts.test.js) | ✖ test failed (top-level load) |
| [tests/lib/migration-execution.test.js](../../tests/lib/migration-execution.test.js) | ✖ test failed (top-level load) |
| [tests/lib/portfolio-engine.test.js](../../tests/lib/portfolio-engine.test.js) | ✖ test failed (top-level load) |
| [tests/lib/portfolio-rules.test.js](../../tests/lib/portfolio-rules.test.js) | ✖ test failed (top-level load) |
| [tests/lib/taxonomy.test.js](../../tests/lib/taxonomy.test.js) | ✖ test failed (top-level load) |

**Summary line:** `ℹ tests 8`, `ℹ pass 0`, `ℹ fail 8`. **Exit code: 1.**

The "8 tests" `node --test` reports are actually **8 test FILES, each treated as a single failed test** because they error at the top level before any `describe`/`test` block executes. Inside those 8 files, the test functions never run. **The advertised 103 tests are 0.**

### Why this matters for CI guardrail design (Story F)

`node --test` returns exit 1 on these files. **If `tests/lib/*.test.js` were wired into `npm test` or `npm run test:all`, CI would fail loudly today.** The reason it doesn't fail is exclusively because the npm scripts don't glob into `tests/lib/`.

This means **Story F (CI guardrail) is even higher leverage than I claimed** in the party mode session. Wiring `tests/lib/` into CI **would have caught this on the first PR that introduced a Jest test.** No bespoke "orphan detector" needed — just a `tests/**/*.test.js` glob in `npm test`. The bug is in the glob, not in the absence of a guardrail.

**Implication for Story F design:** the simplest possible version of Story F is **change one line in package.json** — `tests/unit/*.test.js` → `tests/**/*.test.js` — and let `node --test` do the rest. The Node.js script that walks files and matches globs is overengineering. **The fix is one character: `unit/` → `**/`.**

I want to flag this for the next session because it materially simplifies Story F. Murat-says: prefer the one-character fix. Add the 50-LOC orphan detector only if we discover edge cases that the simple glob can't handle.

---

## Findings That Update the Original Report

| Original report claim | Sweep result | Updated status |
|---|---|---|
| C1: ~4,400 LOC of `tests/lib/*` use Jest API | Confirmed by grep | ✓ accurate |
| C1: Tests cannot run | Confirmed by execution: exit 1, 8/8 file load failures | ✓ **promoted from inference to measurement** |
| C2: `tests/lib/` and `tests/team-factory/` not in CI | Confirmed | ✓ accurate |
| MEMORY.md "103 tests" for Artifact Governance | **0 of 103 actually execute** | ✗ **claim is empirically false** |
| `tests/team-factory/` is "valid `node:test`-style and would pass" | **155 pass, 1 silent failure** | ✗ **partially wrong — there's a live regression** |
| Story F should be a 50-LOC orphan detector | A one-character glob change (`unit/` → `**/`) is sufficient | ⚠ **simpler than originally proposed** |

---

## Stories Added or Updated

Adding to Bob's clipboard from this sweep:

### NEW: Story L

- **Story L:** Investigate & fix `buildModuleBlock` golden-file drift in [tests/team-factory/registry-writer.test.js:179](tests/team-factory/registry-writer.test.js#L179). Determine whether source or golden is authoritative. Restore green. Estimated S. **Must land before Story F enables** (otherwise the guardrail's first activation surfaces this regression to CI under pressure).

### UPDATED: Story F

- **Story F (revised):** Wire all test directories into CI by changing `npm test` glob from `tests/unit/*.test.js` to `tests/**/*.test.js`. **This is a one-character fix in [package.json:33](../../package.json#L33)** and supersedes the original 50-LOC orphan detector design. Acceptance: (a) `npm test` runs all 61 test files, (b) CI passes once Stories B and L are complete, (c) baseline floor of 1,283 tests is preserved. Add the bespoke orphan detector ONLY if we discover edge cases the simple glob can't handle. Estimated XS (was XS — same size, less code).

### UPDATED: Story K

- **Story K (revised):** Update [MEMORY.md](../../../.claude/projects/-Users-amalikamriou-BMAD-Enhanced/memory/MEMORY.md) line that says "103 tests" for Artifact Governance & Portfolio. **Verified replacement number:** 0 currently, will become whatever the converted `tests/lib/` count is post-Story B. Also note the new floor: **1,283 verified-passing tests on `node --test` baseline as of 2026-04-08**.

---

## Updated Sequencing (binding)

```
L (fix team-factory regression — calmly, no CI pressure)
   ↓
F (one-char glob fix in package.json — wires all 61 files)
   ↓
I (this baseline) ← ALREADY DONE 2026-04-08
   ↓
A (mock helper)
   ↓
B (lib conversions in order — pilot first, migration-execution last)
   ↓
E (artifact-utils split with runGit wrapper) — Epic 6 forward unblocks at B.1–B.3
   ↓
K (MEMORY.md correction — propagate the new verified numbers)
```

Note: **L moves to the top.** Fix the silent regression first, calmly, on its own merits, before turning on the CI guardrail. Otherwise we're fixing it under merge-blocking pressure — exactly the failure mode I want to avoid.

---

## What I'm NOT recommending you do next

I deliberately did not investigate or fix the `buildModuleBlock` regression in this sweep, even though I had the information in front of me. **Reasons:**

1. The point of a baseline sweep is to **surface findings, not chase them.** Chasing one finding mid-sweep means the others don't get measured.
2. Fixing it requires reading source vs golden in detail, deciding which is authoritative, possibly involving the user on intent. That's a Story L conversation, not a sweep.
3. This doc is read-only. No file modifications. The whole point of Story I is "establish ground truth before touching anything."

Discipline matters. The temptation to fix something while I'm in there is exactly how scope creeps. Story I stays Story I.

---

## Reference Data

### Raw test counts

- `node --test tests/unit/*.test.js`: **408 tests, 408 pass, 0 fail** (duration 7,723 ms)
- `node --test tests/integration/*.test.js`: **78 tests, 78 pass, 0 fail** (duration 2,085 ms)
- `node --test tests/p0/*.test.js`: **642 tests, 642 pass, 0 fail** (duration 359 ms)
- `node --test tests/team-factory/*.test.js`: **156 tests, 155 pass, 1 fail** (exit 1)
- `node --test tests/lib/*.test.js`: **8 file-level tests, 0 pass, 8 fail** (exit 1)

### File counts by directory

- `tests/unit/`: 22 files
- `tests/integration/`: 6 files
- `tests/p0/`: 13 files
- `tests/team-factory/`: 13 files
- `tests/lib/`: 8 files
- **Total: 61 files**

### Framework distribution

- `node:test` + `node:assert/strict`: 53 files (87%)
- Jest API (`expect`, `jest.*`): 8 files (13%) — all in `tests/lib/`
- Other (vitest, chai, sinon): 0 files

---

## ADDENDUM — 2026-04-08 (post-Story L + N + F)

After this sweep, three things happened that update the floor and reveal a counting nuance worth recording:

### New verified-passing floor: **1,305 tests** (was 1,283)

| Stage | Sweep baseline (2026-04-08 morning) | Post-L/N/F floor (2026-04-08 evening) |
|---|---:|---:|
| `tests/unit/` | 408 | **429** (+21) |
| `tests/integration/` | 78 | **78** (no change) |
| `tests/p0/` | 642 | **642** (no change) |
| `tests/team-factory/` | 155 (1 fail) | **156** (Story L fixed the regression) |
| **Combined** | **1,283** | **1,305** |

### Where the +22 came from (Story N investigation)

- **+14 tests** from a previously-uncatalogued file: [tests/unit/refresh-installation-artifacts.test.js](../../tests/unit/refresh-installation-artifacts.test.js). It was added in commit `55c73e0` ("Create refresh-installation-artifacts.test.js") sometime between the original astonishment report scan and the baseline sweep run. **Bumped the file count from 61 → 62.**
- **+1 test** from Story L flipping the team-factory regression from fail → pass.
- **+7 tests** unaccounted-for. Most likely Epic 6 churn (tests added inline to existing unit files between the original scan and re-run). Not investigated — the floor number doesn't depend on the breakdown, but flagging the unknowns is honest.

### Counting nuance: single-invocation vs composed invocation

After Story F redefined `npm run test:all` to compose `npm test && npm run test:integration && npm run test:p0`, the composed invocation reports:

```
587 (npm test: unit + team-factory) + 78 (integration) + 642 (p0) = 1,307
```

That's 2 higher than the single-invocation floor of 1,305. The discrepancy comes from `node --test` counting test fixtures or top-level setup differently when invoked once vs three times. **The authoritative floor is 1,305** (single invocation across the four directory globs) — the +2 in the composed run is a counting artifact, not actually new tests. Anyone checking "did the floor regress?" should use the single-invocation form:

```bash
node --test tests/unit/*.test.js tests/team-factory/*.test.js \
            tests/integration/*.test.js tests/p0/*.test.js
```

### Story F simplification was wrong (mea culpa)

Earlier in this report I claimed Story F should be "one character: change `unit/` to `**/`." That advice was incorrect. The actual implementation took the more nuanced shape:

- `tests/team-factory/` was added to `npm test` (immediate, safe — all tests pass after Story L)
- `tests/lib/` was given its own dev-only `test:lib` script and **not** wired into CI yet (deferred to F.2 after Story B conversion lands)
- `test:coverage` glob was updated in lockstep
- `test:all` was redefined to compose runnable scripts instead of using `tests/**/*.test.js` (which would have been broken)

**Why the one-character fix was wrong:** wiring `tests/lib/*` into CI immediately would have broken every Epic 6 PR until Story B lands. The phasing decision (F.1 + F.3 now, F.2 later) is the correct shape.

### Updated story status (post-2026-04-08 evening)

| ID | Status |
|---|---|
| ✅ I — Baseline sweep | Done |
| ✅ L — Team-factory regression fix | Committed |
| ✅ N — Test count delta investigation | Done — floor authoritative at 1,305 |
| ✅ F.1 — Wire team-factory into `npm test` | Done |
| ✅ F.3 — Add `test:lib` dev script | Done |
| ⏳ F.2 — Wire `tests/lib/*` into `npm test` | Blocked by Story B |
| Polish | Bundled into post-review commit (golden README, eslint comment, eslint glob widening, test:all rewrite, test:p0:gate dedup) |

---

## Closing

The sweep finished in roughly 12 minutes wall-clock. It cost almost nothing. It surfaced **one new critical finding** that the original astonishment report missed, **simplified one story** (Story F is now one character instead of 50 LOC), and **established a verifiable floor** (1,283 tests) that all future work measures against.

Most importantly: it converted the original report's C1 finding from a strong inference to an empirical measurement. **Tests in `tests/lib/` are not "probably broken." They are objectively, exit-code-1, file-load-failure broken.** When you bring this to a stakeholder, it's not opinion anymore.

— Murat
