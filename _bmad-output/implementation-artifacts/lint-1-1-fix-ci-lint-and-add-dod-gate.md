# Story lint-1.1: Fix CI lint failures and add `npm run lint` as DoD gate

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

**Epic:** [lint-epic-1 — Lint Cleanup & DoD Gate](../planning-artifacts/convoke-epic-lint-cleanup-dod-gate.md) (cross-cutting platform debt; single-story epic following [`convoke-epic-7-platform-debt.md`](../planning-artifacts/convoke-epic-7-platform-debt.md) precedent)
**Origin:** CI run #714 (2026-04-21) — `npm run lint` surfaced 8 errors + 15 warnings
**Sprint:** inline with v63-1a-4 (unblocks CI green for merge pipeline)
**Namespace decision:** No new skills or `_bmad/bme/` content. Work touches: (1) infrastructure code under `scripts/update/lib/` + `scripts/portability/`, (2) test files under `tests/`, (3) project convention docs (`project-context.md`, `.claude/skills/bmad-dev-story/checklist.md`). The `namespace-decision-for-new-skills` rule from [project-context.md](../../project-context.md#rule-namespace-decision-for-new-skills) is N/A by construction — nothing new is authored, existing code is cleaned up. The `covenant-compliance-for-convoke-skills` rule is also N/A — none of the touched files live under `_bmad/bme/`.
**Safety analysis (path-safety rule):** N/A — no scripts that accept user paths or perform destructive operations are added or modified.

## Story

As the platform maintainer (Amalik) and any future dev agent implementing a Convoke story,
I want `npm run lint` to exit 0 and to be a mandatory DoD gate before any story can move to `review`,
so that lint regressions are caught at authoring time instead of in CI, and the "green test suite ships broken lint" pattern from Story 1A.2 cannot recur.

## Context & Motivation

Story 1A.2 (`v63-1a-2-create-config-loader-js-with-direct-yaml-loading`) shipped with all 1,224 tests passing and two code-review rounds converged — but produced 8 `preserve-caught-error` ESLint errors in [scripts/update/lib/config-loader.js](../../scripts/update/lib/config-loader.js) that were first surfaced by CI run #714. The review gated on `npm test`, not `npm run lint`, so the regression slipped past two review rounds.

Separately, `npm run lint` also surfaces 15 pre-existing `no-unused-vars` warnings across `scripts/portability/` and `tests/lib/` + `tests/unit/` that have been accumulating since `sp-epic-1` through `sp-epic-5` — the portability suite was never gated on lint, so warning debt accreted undisturbed. CI run #714 exits non-zero *only* because of the 8 errors; the 15 warnings do not fail CI today, but they are the symptom of the same missing gate and should be cleared in the same story so the gate starts from zero.

The `bmad-dev-story` DoD checklist at [.claude/skills/bmad-dev-story/checklist.md:47](../../.claude/skills/bmad-dev-story/checklist.md#L47) already lists lint under "Code Quality" — but with the weasel qualifier **"when configured in project"**. Lint *is* configured (`package.json` script `lint` + `eslint.config.mjs` since Convoke 3.x), so the conditional made the line ambiguous-to-skip. This story removes the ambiguity.

## Acceptance Criteria

**AC1 — Zero `preserve-caught-error` errors in `config-loader.js`.**
**Given** [scripts/update/lib/config-loader.js](../../scripts/update/lib/config-loader.js) currently has 8 `preserve-caught-error` ESLint errors at lines 122, 127, 132, 269, 274, 282, 289, 299 (ESLint 10 `recommended` config, active via [eslint.config.mjs:4](../../eslint.config.mjs#L4))
**When** the story is implemented
**Then** each `throw new Error(...)` inside a `catch (err)` block attaches the caught error as `cause`, per the [ECMAScript Error cause proposal](https://github.com/tc39/proposal-error-cause) and Node.js `Error` constructor signature:
```js
throw new Error(message, { cause: err });
```
**And** the pattern mirrors the existing codebase convention in [scripts/lib/artifact-utils.js:139](../../scripts/lib/artifact-utils.js#L139) and [:224](../../scripts/lib/artifact-utils.js#L224) — verified 2026-04-22 as the only two prior `{ cause: err }` sites in `scripts/` (via `grep -rn '{ cause:' scripts/`). Dev agent should re-run that grep at implementation time and mirror whatever convention has emerged; if the count is still 2, this story is the third adoption.
**And** behavior is functionally unchanged — existing tests in [tests/lib/config-loader.test.js](../../tests/lib/config-loader.test.js) (33 tests across 6 suites, all `.message`-based assertions) continue to pass without modification.
**And** `npm run lint -- scripts/update/lib/config-loader.js` exits 0.

**AC2 — Zero `no-unused-vars` warnings across the 8 files CI #714 reported.**
**Given** the mechanical enumeration below (from `npm run lint` 2026-04-21):
| File | Line | Kind | Fix strategy |
|---|---|---|---|
| [scripts/portability/classify-skills.js](../../scripts/portability/classify-skills.js) | 259 | caught `e` unused | rename to `_e` (swallow-continue pattern) |
| [scripts/portability/export-engine.js](../../scripts/portability/export-engine.js) | 105 | arg `warnings` unused | rename to `_warnings` (public API — signature preserved) |
| scripts/portability/export-engine.js | 592 | arg `workflowContent` unused | rename to `_workflowContent` |
| scripts/portability/export-engine.js | 623 | arg `stepContents` unused | rename to `_stepContents` |
| scripts/portability/export-engine.js | 1008 | var `options` unused (destructured default-param) | rename param to `_options` |
| [scripts/portability/validate-classification.js](../../scripts/portability/validate-classification.js) | 147, 182, 191, 202, 217 | 5× caught `e` unused | rename each to `_e` |
| [tests/lib/portability-cli-entry-point.test.js](../../tests/lib/portability-cli-entry-point.test.js) | 56 | caught `e` unused | rename to `_e` |
| [tests/lib/portability-export-engine.test.js](../../tests/lib/portability-export-engine.test.js) | 140 | caught `e` unused | rename to `_e` |
| [tests/lib/portability-tier2-export.test.js](../../tests/lib/portability-tier2-export.test.js) | 72 | var `lightDepsCount` unused | see AC2 note below |
| [tests/lib/portability-validation.test.js](../../tests/lib/portability-validation.test.js) | 82 | caught `e` unused | rename to `_e` |
| [tests/unit/refresh-installation-artifacts.test.js](../../tests/unit/refresh-installation-artifacts.test.js) | 156 | var `pmBefore` unused | see AC2 note below |

**When** the story is implemented
**Then** `npm run lint` reports zero warnings for each file listed above (derived at runtime via post-fix `npm run lint` — do not hardcode total warning counts; per [`derive-counts-from-source` rule](../../project-context.md#rule-derive-counts-from-source)).

**AC2 note — `lightDepsCount` and `pmBefore` decision (dead-assertion class).** These two are not swallow-continue noise; each captures meaningful test state that the surrounding assertion forgot to use. Dev agent decides per-case:
- **Prefer: strengthen the assertion.** E.g., [portability-tier2-export.test.js:72](../../tests/lib/portability-tier2-export.test.js#L72) computes `lightDepsCount` but the test only asserts `successLines.length >= standaloneCount` — add `successLines.length >= standaloneCount + lightDepsCount` (or similar intent-matching check). [refresh-installation-artifacts.test.js:156](../../tests/unit/refresh-installation-artifacts.test.js#L156) reads `pmBefore` but never compares it to `pmAfter` — add an assertion that `pmAfter` differs from `pmBefore` in the Enhance-menu-patched region.
- **Fallback: delete the line and rename surrounding vars** only if the dead-assertion intent is genuinely unreachable from context (e.g., the captured state is already asserted elsewhere in the same test).
- **Forbidden: `_` prefix rename** — unused test-state captures are a latent assertion gap, not intentional signature preservation. Masking with `_` defeats the value of the lint rule for this class.

**AC3 — Lint-passes-before-review rule added to [project-context.md](../../project-context.md).**
**Given** the existing project-context.md has 15 rules encoded for dev agents (`test-fixture-isolation`, `no-hardcoded-versions`, `no-process-cwd-in-libs`, etc.)
**When** the story is implemented
**Then** a new rule titled `lint-passes-before-review` is added with the standard rule structure: **Statement**, **Why**, **How to apply** (including "Before marking a story `review`, run `npm run lint` — if it exits non-zero or reports warnings in files you touched, fix before proceeding"), **Reviewing a PR** (including "block if the diff touches `scripts/**` or `tests/**` without evidence that `npm run lint` was run").
**And** the rule cites Story 1A.2 + CI #714 as the scar-story evidence.
**And** the rule is placed adjacent to the `code-review-convergence` rule to group process conventions together.

**AC4 — Dev-story DoD checklist line is unambiguous.**
**Given** [.claude/skills/bmad-dev-story/checklist.md:47](../../.claude/skills/bmad-dev-story/checklist.md#L47) currently reads: `Code Quality: Linting and static checks pass when configured in project`
**When** the story is implemented
**Then** the line is rewritten to remove the `"when configured in project"` weasel qualifier (Convoke *has* lint configured — `package.json` `lint` script + `eslint.config.mjs`; the conditional misleads)
**And** the new wording explicitly references the command the dev agent must run (e.g., `"Code Quality: npm run lint exits 0 with zero warnings in files modified by this story"`)
**And** the Required-Inputs frontmatter is updated so lint reports are a **required** input rather than optional (line 13 currently lists `'Linting reports'` under `optional-inputs`).

**AC4 — Design decision on DoD scope (touched-files, not global).** The wording `"zero warnings in files modified by this story"` is a **deliberate narrowing**, not an oversight. Rationale: (1) CI's `npm run lint` job already enforces the global gate — it exits non-zero on any error and is blocking. (2) Scoping the DoD to the story's diff means a story cannot ship with its *own* new lint violations, but it also cannot be blocked by pre-existing unrelated warning debt that some other initiative needs to clean up. (3) Without this narrowing, every future story would become a de-facto co-owner of the full portability/test warning surface, which is exactly the scope-creep anti-pattern that this epic's Scope Exclusions warn against (NFR4 of [the epic file](../planning-artifacts/convoke-epic-lint-cleanup-dod-gate.md)). The dev agent amending the DoD wording in Task 6.2 must preserve the "in files modified by this story" qualifier, not strip it.

**AC5 — CI goes green.**
**Given** local `npm run lint` currently reports `✖ 25 problems (8 errors, 17 warnings)` (17 not 15 because 2 new warnings appeared in [tests/unit/migration-3.3.x-to-4.0.0.test.js](../../tests/unit/migration-3.3.x-to-4.0.0.test.js) after CI #714 ran — these are v63-1a-4 WIP territory, **scope-excluded** per §Scope Exclusions)
**When** the story is implemented (AC1 + AC2 applied)
**Then** `npm run lint` exits 0 **for files in scope** (AC1 + AC2).
**And** the 2 `migration-3.3.x-to-4.0.0.test.js` warnings are **not blockers** for this story — they belong to in-flight Story 1A.4 and will be caught by the new DoD gate (AC3) when that story moves to `review`.
**And** a note is added to the v63-1a-4 story file (Status section or Dev Notes) flagging that the new lint DoD gate will require fixing those 2 warnings before 1A.4 can reach `review`.

**AC6 — No new regressions in files touched by this story.** *(Amended 2026-04-22 mid-implementation per operator option (3): original "1237 passing" baseline premise invalidated by 1A.4 WIP drift — see Change Log.)*
**Given** the pre-implementation test baseline captured 2026-04-22 in Dev Agent Record Debug Log: `npm test` exits 1 with **15 pre-existing failing tests (unique names, dedup-stripped), all in 1A.4 WIP files** ([migration-runner-orchestration.test.js](../../tests/unit/migration-runner-orchestration.test.js), [migration-3.3.x-to-4.0.0.test.js](../../tests/unit/migration-3.3.x-to-4.0.0.test.js), and related registry-chain fixtures). These are NOT caused by lint-1.1 work and are owned by 1A.4.
**When** the story is implemented
**Then** `npm test` exit status is allowed to remain 1 (pre-existing 1A.4 WIP failures), but:
  - The **count** of failing tests MUST NOT increase beyond the captured baseline (16).
  - The **identity** of failing tests MUST match the baseline set — no new test names appear in the failures list.
  - Tests that currently pass in files lint-1.1 touches ([tests/lib/config-loader.test.js](../../tests/lib/config-loader.test.js), [tests/lib/portability-*.test.js](../../tests/lib/), [tests/unit/refresh-installation-artifacts.test.js](../../tests/unit/refresh-installation-artifacts.test.js)) MUST continue to pass — zero tolerance for regressions in scope.
**And** `npm run test:integration` is allowed to have pre-existing failures only from 1A.4 WIP territory, same scope-isolation rule.
**And** the Error `cause` additions in AC1 do not change `.message` strings — re-verify via:
```bash
grep -nE 'err\.message|\.message\.(includes|match|startsWith)|assert\.match.*err|assert\.(ok|strictEqual).*err\.message' tests/lib/config-loader.test.js
```
Every hit from that grep represents an assertion that must keep passing after AC1's `{ cause: err }` additions (since `{ cause }` is a second-arg option that does not alter the stringified message).
**And** a one-line note is added to [v63-1a-4 story file](v63-1a-4-create-migration-script-3-x-to-4-0-js.md) (via Task 7.2) that the 15 baseline failures are owned by 1A.4 and must be green before 1A.4 moves to `review`.

**AC7 — Story 1A.2 retrospective carry-forward note.**
**Given** Story 1A.2's commentary in [sprint-status.yaml](sprint-status.yaml) notes that "Review converged at Round 2" and "per convergence rule, Round 3 NOT allowed" — but the review missed lint
**When** the story is implemented
**Then** a one-line note is appended to [v63-1a-2-create-config-loader-js-with-direct-yaml-loading.md](v63-1a-2-create-config-loader-js-with-direct-yaml-loading.md) under Status or a new "Post-review note" section (do **NOT** reopen the story — convergence rule is preserved) referencing this story (`lint-1-1`) as the lint-only remediation, with a pointer back to CI #714.
**And** the note explicitly states that the code-review-convergence rule is **upheld** (no Round 3) — remediation ships as a follow-up story, not a review reopening.

## Scope Exclusions

- **`tests/unit/migration-3.3.x-to-4.0.0.test.js` (2 warnings).** Active WIP on Story 1A.4; owner is the 1A.4 dev agent. This story adds the DoD gate (AC3) that will force 1A.4 to fix them before `review`.
- **Any fix beyond the 8 errors + 15 explicitly-listed warnings in AC2.** (15 = 13 `_`-rename cases in Task 3 + 2 dead-assertion cases in Task 4.) If new lint violations surface between story authoring and implementation time, log them as deferred items to the initiatives backlog; do not scope-creep this story. (Per [`code-review-convergence`](../../project-context.md#rule-code-review-convergence) retro precedent.)
- **Pre-commit hooks / husky / lefthook.** Friction-adding local hooks are deliberately out of scope — CI already enforces lint (CI run #714 proved it). The DoD gate (AC3) + explicit dev-story checklist (AC4) are sufficient without adding a local hook dependency. Log "consider lefthook" as a candidate for the initiatives backlog if the DoD gate alone proves insufficient after 2+ additional lint regressions.
- **Fixing the underlying portability test-state dead-assertions in a deeper way.** AC2's note for `lightDepsCount` and `pmBefore` favors adding the missing assertion, but a fuller audit of the portability suite for similar dead-captures is not in scope. If the dev agent finds more than 2 additional dead-assertion patterns while fixing these two, log a follow-up backlog item.

## Tasks / Subtasks

- [x] **Task 1 — Capture pre-fix lint baseline** (AC5, AC6; enumeration contract per [`mechanical-research-enumeration` rule](../../project-context.md#rule-mechanical-research-enumeration))
  - [x] 1.1. Run `npm run lint 2>&1 | tee /tmp/lint-before.txt`; store output in story Dev Agent Record (Debug Log References) as evidence of starting state
  - [x] 1.2. Run `npm test` and note the baseline test count (expected ≥ 1237; re-baseline if 1A.4 has landed) — **baseline drifted**, see Change Log + AC6 amendment
  - [x] 1.3. `git status` — confirm working tree matches expectations before editing

- [x] **Task 2 — Fix 8 `preserve-caught-error` errors in config-loader.js** (AC1)
  - [x] 2.1. Line 122 — `throw new Error(...)` for `EACCES` → add `{ cause: err }`
  - [x] 2.2. Line 127 — `throw new Error(...)` for `EISDIR` → add `{ cause: err }`
  - [x] 2.3. Line 132 — `throw new Error(...)` for generic IO error → add `{ cause: err }`
  - [x] 2.4. Line 269 — `throw new Error(...)` for `ENOENT` (python3 missing) → add `{ cause: err }`
  - [x] 2.5. Line 274 — `throw new Error(...)` for `SIGTERM` → add `{ cause: err }`
  - [x] 2.6. Line 282 — `throw new Error(...)` for other signal → add `{ cause: err }`
  - [x] 2.7. Line 289 — `throw new Error(...)` for generic subprocess failure → add `{ cause: err }`
  - [x] 2.8. Line 299 — `throw new Error(...)` for non-JSON stdout → add `{ cause: err }`
  - [x] 2.9. Run `npm run lint -- scripts/update/lib/config-loader.js` → expect 0 errors 0 warnings **✓ clean**
  - [x] 2.10. Run `node --test tests/lib/config-loader.test.js` → all 33 tests still pass (AC6 guardrail) **✓ 0 fail**

- [x] **Task 3 — Fix 11 swallow-continue and arg-preservation warnings** (AC2; these are safe `_`-prefix renames)
  - [x] 3.1. classify-skills.js:259 — rename caught `e` → `_e`
  - [x] 3.2. export-engine.js:105 — rename arg `warnings` → `_warnings`
  - [x] 3.3. export-engine.js:592 — rename arg `workflowContent` → `_workflowContent`
  - [x] 3.4. export-engine.js:623 — rename arg `stepContents` → `_stepContents`
  - [x] 3.5. export-engine.js:1008 — rename destructured param `options` → `_options`
  - [x] 3.6. validate-classification.js lines 147, 182, 191, 202, 217 — rename each caught `e` → `_e` (5 sites; lines 453 & 472 excluded — they use `e.message`)
  - [x] 3.7. portability-cli-entry-point.test.js:56, portability-export-engine.test.js:140, portability-validation.test.js:82 — rename each caught `e` → `_e` (3 sites)
  - [x] 3.8. Run `npm run lint` → verify only `lightDepsCount` + `pmBefore` + the 2 scope-excluded `migration-3.3.x-to-4.0.0.test.js` warnings remain — **✓ 6 touched files: 0 lint output**
  - [x] 3.9. Run `node --test tests/lib/portability-*.test.js tests/portability/*.test.js` → all tests pass (AC6 guardrail; confirm no `_`-rename broke destructuring downstream) — **✓ 40/40 pass**

- [x] **Task 4 — Address dead-assertion class in 2 test files** (AC2 note)
  - [x] 4.1. [portability-tier2-export.test.js:72](../../tests/lib/portability-tier2-export.test.js#L72) — **decision: strengthen.** Changed `>= standaloneCount` → `>= standaloneCount + lightDepsCount` with diagnostic message. Rationale: the test name claims "includes both tier 1 and tier 2" but the weaker assertion only checked tier 1 coverage. Hardcoded `bmad-create-prd` check kept as belt-and-suspenders for at least one named light-deps skill.
  - [x] 4.2. [refresh-installation-artifacts.test.js:156](../../tests/unit/refresh-installation-artifacts.test.js#L156) — **decision: strengthen.** Added `assert.notStrictEqual(pmAfter, pmBefore)` and a positive `pmAfter.includes('initiatives-backlog')` check. Rationale: the comment claimed pm.md WOULD have the Enhance menu patch, but the test only checked the absence of artifacts entries. Now both positive (Enhance patch present) and negative (no artifacts leakage) are asserted.
  - [x] 4.3. Run targeted tests: `node --test tests/lib/portability-tier2-export.test.js tests/unit/refresh-installation-artifacts.test.js` → pass **✓ 20/20**
  - [x] 4.4. Run `npm run lint` → expect only the 2 scope-excluded `migration-3.3.x-to-4.0.0.test.js` warnings remaining (AC5) — **verified at Task 8**

- [x] **Task 5 — Add `lint-passes-before-review` rule to project-context.md** (AC3)
  - [x] 5.1. Read [project-context.md](../../project-context.md) — identify insertion point after `code-review-convergence` rule (≈line 120)
  - [x] 5.2. Author the rule using the standard 3-4 section structure (**Statement**, **Why**, **How to apply**, and optionally **Reviewing a PR**). Match tone/format of adjacent rules
  - [x] 5.3. Cite Story 1A.2 + CI #714 as scar-story evidence
  - [x] 5.4. Specify the command verbatim: `npm run lint` must exit 0 with zero warnings in files touched by the story
  - [x] 5.5. Save; open in editor and read through adjacent rules for tone consistency

- [x] **Task 6 — Amend dev-story DoD checklist** (AC4)
  - [x] 6.1. Open [.claude/skills/bmad-dev-story/checklist.md](../../.claude/skills/bmad-dev-story/checklist.md)
  - [x] 6.2. Line 47 — rewrite "Code Quality: Linting and static checks pass when configured in project" → `"Code Quality: **npm run lint** exits 0 with zero warnings in files modified by this story"`
  - [x] 6.3. Frontmatter — move `'Linting reports'` from `optional-inputs` (line 13) to `required-inputs`
  - [x] 6.4. Add a corresponding bullet to `validation-rules` frontmatter (line 14-18) mentioning lint must pass
  - [x] 6.5. No other DoD items changed — minimize diff scope

- [x] **Task 7 — Annotate v63-1a-2 and v63-1a-4 with cross-references** (AC5, AC7)
  - [x] 7.1. Append "Post-review note" to [v63-1a-2 story file](v63-1a-2-create-config-loader-js-with-direct-yaml-loading.md) — citing lint-1.1 and CI #714, explicitly noting the convergence rule is **upheld** (no Round 3 reopening)
  - [x] 7.2. Add a note to [v63-1a-4 story file](v63-1a-4-create-migration-script-3-x-to-4-0-js.md) (file exists — verified 2026-04-22) flagging the 5 scope-excluded errors, 2 warnings, and 15 baseline-failing tests that must be cleared before it can reach `review` under the new DoD gate

- [x] **Task 8 — Final verification** (AC5, AC6)
  - [x] 8.1. `npm run lint` → exit 0, 0 errors, 0 warnings (excluding the 2 scope-excluded 1A.4 warnings if still present) — **exit 1 (expected per AC5): 5 errors + 2 warnings remaining, all in 1A.4 WIP files (`scripts/update/migrations/3.3.x-to-4.0.0.js` + `tests/unit/migration-3.3.x-to-4.0.0.test.js`). 23 in-scope issues eliminated as planned.**
  - [x] 8.2. `npm test` → exit 0, test count ≥ baseline from Task 1.2 — **exit 0, 1258/1258 pass. Baseline was 15 failing; now 0. 1A.4 files were externally modified during my work (mtime progressed 07:01 → 07:23), fixing those failures. My changes did not cause any regressions.**
  - [x] 8.3. `npm run test:integration` → exit 0 — **exit 1 (allowed per AC5 scope-isolation): 82/85 pass, 3 fail. All 3 failures in [upgrade.test.js](../../tests/integration/upgrade.test.js) migration-chain tests — 1A.4 WIP territory, not caused by this story's changes.**
  - [x] 8.4. `git diff --stat` — review the diff for scope creep (expect ≤13 files touched: config-loader.js (1) + 3 portability scripts (classify/export/validate) + 5 test files + project-context.md + dev-story checklist + 2 cross-reference story-file notes = 13) — **13 files from this story (matches spec). 3 additional modified files (`scripts/update/migrations/registry.js`, `tests/unit/registry.test.js`, `tests/unit/migration-runner-orchestration.test.js`) are external 1A.4 WIP parallel edits — not from lint-1.1.**
  - [x] 8.5. Update File List section of this story with every modified file — **see File List below**

## Dev Notes

### Why `{ cause: err }` is the right fix for AC1

ESLint 10's `preserve-caught-error` rule enforces the [ECMAScript Error cause proposal](https://github.com/tc39/proposal-error-cause) (Node 16.9+, part of ES2022). When an inner error is re-thrown as a symptom error, attaching `cause` preserves the chain for debuggers, `util.inspect`, and any caller that walks `err.cause`. Alternative fixes rejected:

- **Disable the rule locally** (`/* eslint-disable preserve-caught-error */`): defeats the rule's purpose; the point of upgrading to ESLint 10 is to surface exactly this class.
- **Rename `err` to `_err`**: wrong rule — `preserve-caught-error` fires regardless of the caught variable name; only `{ cause }` on the thrown error satisfies it.
- **Bubble the original `err`**: would change the public error contract (message text, name). AC6 forbids this.

### Why `_`-prefix is safe for AC2 (except the 2 dead-assertion cases)

The existing `eslint.config.mjs:30` sets `"caughtErrorsIgnorePattern": "^_"`, `"varsIgnorePattern": "^_"`, and `"argsIgnorePattern": "^_"` — so `_e`, `_warnings`, `_workflowContent`, `_stepContents`, `_options` are lint-invisible. The rename is a **no-behavior-change** edit: it preserves function signatures (callers continue to pass positional args), preserves destructuring semantics, and the `_` prefix is a well-known JS idiom for "intentionally unused".

`lightDepsCount` and `pmBefore` are different in kind — the surrounding test asserts on other things but the captured state itself is never checked. A `_` rename there would convert a latent assertion gap into a silent forever-gap. AC2 note requires the dev agent to either **add the missing assertion** (preferred) or **delete the dead read** (fallback), not mask with `_`.

### Where the DoD gate lives (AC3 + AC4)

Two layers, both required:
1. **Human-readable convention**: `project-context.md` rule (AC3). Dev agents read this file at the start of every story. This is where the "must run `npm run lint` before review" norm lives as a citable rule.
2. **Checklist-enforced gate**: `.claude/skills/bmad-dev-story/checklist.md` DoD (AC4). The dev-story workflow references this when validating before marking `review`. Moving lint from "when configured" conditional to unconditional + lifting "Linting reports" to `required-inputs` is what turns the convention into an actual gate.

CI's existing `npm run lint` job ([.github/workflows/ci.yml:14-30](../../.github/workflows/ci.yml#L14-L30)) is the third layer, already enforced. This story does not add a fourth (pre-commit hook) per §Scope Exclusions — CI enforcement + explicit DoD is sufficient without adding local-hook friction.

### Testing standards summary

- **Test framework:** `node:test` (Convoke migrated off Jest in 2026-04-08 → 2026-04-11 per the C1 phantom-test retro). All new assertions use `node:assert/strict`.
- **Coverage expectation:** this story should not reduce coverage (AC6). `npm run test:coverage` is not required to run, but if the dev agent adds assertions (Task 4.1, 4.2), those should land in existing `describe` blocks — no new test files.
- **Fixture isolation:** `refresh-installation-artifacts.test.js` already uses a `tmpDir` fixture (per `test-fixture-isolation` rule). Adding an assertion on `pmBefore`/`pmAfter` stays within the existing fixture — no new fixture setup needed.

### Project Structure Notes

- No new directories created.
- No new files created under `scripts/` or `tests/`.
- One new document section (the lint-passes rule) in project-context.md — appended in-place.
- No conflicts with existing unified project structure.

### References

- [CI run #714 lint output](sprint-status.yaml#L62) — scar-story evidence, captured in sprint-status commentary 2026-04-21
- [Story 1A.2: Create config-loader.js with direct-YAML loading](v63-1a-2-create-config-loader-js-with-direct-yaml-loading.md) — source of the 8 errors; do NOT reopen per convergence rule
- [project-context.md](../../project-context.md) — §Rule: code-review-convergence (convergence semantics upheld), §Rule: derive-counts-from-source (use runtime lint output, not hardcoded counts), §Rule: mechanical-research-enumeration (enumeration is from `npm run lint` itself), §Rule: spec-verify-referenced-files (verified 2026-04-22 — all 13 cited source/spec files exist: config-loader.js, classify-skills.js, export-engine.js, validate-classification.js, 4× `tests/lib/portability-*.test.js`, refresh-installation-artifacts.test.js, project-context.md, bmad-dev-story/checklist.md, eslint.config.mjs, v63-1a-2 + v63-1a-4 story files; catch-block line anchors spot-checked in validate-classification.js, portability-cli-entry-point.test.js, portability-export-engine.test.js, portability-validation.test.js)
- [.claude/skills/bmad-dev-story/checklist.md](../../.claude/skills/bmad-dev-story/checklist.md) — DoD source (AC4 target)
- [eslint.config.mjs](../../eslint.config.mjs) — rule source; `caughtErrorsIgnorePattern: "^_"` (L30) is why `_e` rename is valid
- [ESLint `preserve-caught-error` rule docs](https://eslint.org/docs/latest/rules/preserve-caught-error) — rationale for `{ cause: err }` fix
- [ECMAScript Error cause proposal](https://github.com/tc39/proposal-error-cause) — language-level justification

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

**Pre-fix baseline captured 2026-04-22 (Task 1.1, 1.2):**

- `npm run lint` → exit 1, **30 problems (13 errors, 17 warnings)**. Raw output: `/tmp/lint-before.txt`.
  - In-scope for this story: 8 errors in [config-loader.js](../../scripts/update/lib/config-loader.js) + 15 warnings across portability scripts/tests + refresh-installation-artifacts.test.js (matches AC1/AC2).
  - **Drift since story authoring (2026-04-22 earlier):** 5 new errors + 2 new warnings in [scripts/update/migrations/3.3.x-to-4.0.0.js](../../scripts/update/migrations/3.3.x-to-4.0.0.js) + [tests/unit/migration-3.3.x-to-4.0.0.test.js](../../tests/unit/migration-3.3.x-to-4.0.0.test.js). **1A.4 WIP territory — scope-excluded per epic NFR4.** The new DoD gate (AC3) will force 1A.4 to clear them before that story reaches `review`.

- `npm test` → exit 1, **15 pre-existing failing tests** (unique names, timings stripped). Raw output: `/tmp/test-before.txt`. Clean failure list: `/tmp/baseline-failures-names.txt`.
  - All 15 failures are in 1A.4 WIP territory: `migration-runner-orchestration`, `registry`-chain, `convoke-update` dry-run/verbose paths. None are in lint-1.1's touched files.
  - Identity-pinned list:
    - `applies full migration chain from 1.5.2 and records all in history`
    - `chains from 1.0.5 through all 5 hops`, `chains from 1.1.3 through all 5 hops`, `chains from 1.3.7 through 4 hops`, `chains from 1.5.2 through 3 hops`, `chains from 1.6.0 through 2 hops`, `chains from 1.7.1 through 2 hops`
    - `getBreakingChanges`, `getMigrationsFor - chain traversal`
    - `returns breaking change for 1.1.x (chain reaches 1.7.x-to-2.0.0)`, `returns breaking change for 1.5.x (chain reaches 1.7.x-to-2.0.0)`, `returns breaking changes for 1.0.x (chain includes 1.0.x and 1.7.x)`
    - `returns single hop from 2.0.1`, `returns single hop from 3.0.4 (parallel entry)`
    - `runMigrations multi-version chain traversal`

- `git status` (Task 1.3): tracked modifications = sprint-status.yaml (this story's in-progress bump); untracked = `scripts/update/migrations/3.3.x-to-4.0.0.js` (1A.4 WIP), `_bmad-output/planning-artifacts/convoke-epic-lint-cleanup-dod-gate.md` (this story's epic, authored earlier in session), `_bmad-output/implementation-artifacts/lint-1-1-fix-ci-lint-and-add-dod-gate.md` (this story file). No unexpected state.

### Completion Notes List

- **Task 2 (8 × `{ cause: err }` additions, config-loader.js):** Mirrored the existing codebase convention at [scripts/lib/artifact-utils.js:139](../../scripts/lib/artifact-utils.js#L139) and [:224](../../scripts/lib/artifact-utils.js#L224). All 8 sites now preserve the caught error via `{ cause: err }`. Zero message-string drift — all 33 config-loader tests pass without modification.
- **Task 3 (13 × `_`-prefix renames):** All swallow-continue and arg-preservation warnings fixed. Note: [validate-classification.js](../../scripts/portability/validate-classification.js) has 7 `catch (e)` sites total; only 5 were flagged by ESLint because lines 453 and 472 use `e.message` in the catch body — those were correctly left alone.
- **Task 4.1 (`lightDepsCount` strengthened):** Changed `successLines.length >= standaloneCount` → `>= standaloneCount + lightDepsCount` with diagnostic. Rationale: test name claimed "includes both tier 1 and tier 2" but weaker check didn't verify tier-2 coverage at all. Strengthened assertion passed on first run, confirming `--all` does export both tiers fully.
- **Task 4.2 (`pmBefore` strengthened):** Added `notStrictEqual(pmAfter, pmBefore)` + `pmAfter.includes('initiatives-backlog')`. Test now verifies both the negative claim (no artifacts entries) AND the positive claim (Enhance menu was patched) — the comment already predicted both.
- **Task 5 (project-context.md rule):** New `lint-passes-before-review` rule added after `code-review-convergence` (process-rules grouped). Cites Story 1A.2 + CI #714 as scar-story evidence. Includes explicit guidance for the ESLint `args: "after-used"` vs TS strict-unused mismatch surfaced during implementation.
- **Task 6 (dev-story DoD checklist):** Removed "when configured in project" weasel qualifier from line 47. Moved `'Linting reports'` from `optional-inputs` to `required-inputs` with specific wording. Added a corresponding `validation-rules` bullet that cross-references the new project-context rule.
- **Task 7 (cross-references):** v63-1a-2 now carries a "Post-review note" explicitly upholding `code-review-convergence` (NOT reopened — lint-1.1 is the forward-going remediation). v63-1a-4 now carries a forward-constraint note listing the 5 scope-excluded errors + 2 warnings + 15 baseline-failing tests that must be cleared under the new DoD gate before it can reach `review`.
- **AC6 amendment context (see Change Log):** 1A.4's impl + test files were externally updated during my work (mtime `Apr 22 07:01` baseline → `07:23` + `07:15` at verification), which fortuitously fixed all 15 baseline-failing unit tests. This is orthogonal to lint-1.1 — my changes touched neither 1A.4 file. Post-fix state: `npm test` 1258/1258 pass (exit 0), `npm run lint` 7 issues remaining (all 1A.4 WIP per NFR4), `npm run test:integration` 82/85 (3 failures in `upgrade.test.js` — 1A.4 migration chain territory, scope-excluded per AC5).
- **Baseline drift discipline:** Throughout implementation, I distinguished my in-scope work from parallel 1A.4 WIP by mechanical file-path checks (config-loader.js and portability/ vs. migrations/ and migration-* tests). No in-scope assertions about test count or failure identity were altered to compensate for 1A.4 drift — AC6 was amended once at Task 1 (documented in Change Log) and held thereafter.

### File List

**Modified by this story (13 files, in scope):**

- `scripts/update/lib/config-loader.js` — 8 `{ cause: err }` additions (Task 2)
- `scripts/portability/classify-skills.js` — catch `e` → `_e` rename (Task 3.1)
- `scripts/portability/export-engine.js` — 4 arg renames (Tasks 3.2–3.5)
- `scripts/portability/validate-classification.js` — 5 catch `_e` renames (Task 3.6)
- `tests/lib/portability-cli-entry-point.test.js` — catch `_e` rename (Task 3.7)
- `tests/lib/portability-export-engine.test.js` — catch `_e` rename (Task 3.7)
- `tests/lib/portability-tier2-export.test.js` — catch `_e` + strengthened assertion using `lightDepsCount` (Task 3.7 + Task 4.1)
- `tests/lib/portability-validation.test.js` — catch `_e` rename (Task 3.7)
- `tests/unit/refresh-installation-artifacts.test.js` — strengthened assertions using `pmBefore` (Task 4.2)
- `project-context.md` — new `lint-passes-before-review` rule (Task 5)
- `.claude/skills/bmad-dev-story/checklist.md` — DoD line rewrite + frontmatter input promotion + validation-rule addition (Task 6)
- `_bmad-output/implementation-artifacts/v63-1a-2-create-config-loader-js-with-direct-yaml-loading.md` — post-review note upholding convergence rule (Task 7.1)
- `_bmad-output/implementation-artifacts/v63-1a-4-create-migration-script-3-x-to-4-0-js.md` — forward-constraint note for 1A.4 DoD gate (Task 7.2)

**Also modified this story, workflow-required:**
- `_bmad-output/implementation-artifacts/lint-1-1-fix-ci-lint-and-add-dod-gate.md` — this story file (Status, Tasks/Subtasks, Dev Agent Record, File List, Change Log, AC6 amendment)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` — status transitions for lint-1-1 and lint-epic-1

**Not modified by this story (external 1A.4 parallel edits observed in working tree):**
- `scripts/update/migrations/registry.js`, `tests/unit/registry.test.js`, `tests/unit/migration-runner-orchestration.test.js` — 1A.4 WIP, documented here for transparency only.

## Change Log

- **2026-04-22** — Operator-authorized AC6 amendment mid-implementation (option 3 of 3 presented). Original AC6 premise "npm test → 1237 tests passing" invalidated by 1A.4 WIP drift (1A.4's `scripts/update/migrations/3.3.x-to-4.0.0.js` + test file were partially shipped between story authoring and dev pickup, contributing 15 pre-existing failures and 5 new lint errors + 2 new warnings). AC6 rewritten to (a) pin the 15 baseline failure identities as expected-state, (b) assert zero-tolerance for new failures in files touched by this story, (c) allow `npm test` exit 1 as long as failure count and identity match baseline, (d) add an explicit Task 7.2 carry-forward obligation to v63-1a-4 to clear those 15 failures before `review`. The 5 new 1A.4 lint errors and 2 warnings are scope-excluded per epic NFR4 and carry forward to 1A.4 under the new DoD gate.
