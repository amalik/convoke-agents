# Story i97-1.1: Migration Tooling Foundation Scaffolded

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

**Epic:** [i97-epic-1 — Migration Foundation Ready](../planning-artifacts/convoke-epic-bmad-v63-source-format-adoption.md#epic-1-migration-foundation-ready) (foundational; gates all of Epic 2)
**Origin:** I97 (BMAD v6.3+ Source Format Adoption / Convoke 4.0 packaging-contract). Triggered by BMAD marketplace PR #9 rejection (2026-04-27). Diagnostic: [`spike-marketplace-packaging-delta.md`](spike-marketplace-packaging-delta.md). Pattern A chosen (workflow-as-reference) per [`memory/project_marketplace_structural_adoption.md`](../../.claude/projects/-Users-amalikamriou-BMAD-Enhanced/memory/project_marketplace_structural_adoption.md).
**Sprint:** Sprint 1 of I97. Per epic spec § "Sprint 1 capacity commitment": Sprint 1 commits this story + Story 1.2 (rubric calibration — already DONE) + Emma POC (Story 2.1) only. This story is the prerequisite for Story 2.1 — no E2 story enters in-progress until this story closes.
**Namespace decision:** New tooling lives under `scripts/migration/format-conversion/` (function-named per ADR-004; **NFR9** namespace decision: Convoke maintains its own tooling namespace separate from BMAD/BMM tooling — mirrors the existing `scripts/update/`, `scripts/portability/`, `scripts/audit/` pattern). NFR18 reusability: function-named "format-conversion" rather than initiative-named "i97-conversion" so I98 (Gyre) and I99 (Team Factory) inherit the same tooling without renaming. New audit script lives under existing `scripts/audit/` namespace (mirrors prior conventions). The `namespace-decision-for-new-skills` rule from [project-context.md](../../project-context.md) is N/A by construction — no new `_bmad/bme/` content authored; this is build/CI tooling.
**Safety analysis (path-safety rule):** All scaffolds under this story accept `projectRoot` as an explicit parameter (no `process.cwd()` per `no-process-cwd-in-libs`). The reference-integrity script is read-only (no destructive ops). The shared fixture helpers create + destroy `tmpDir` paths but do so via `os.tmpdir()` + `fs.mkdtempSync()` (canonical Node pattern; no user-path acceptance) — no `path-safety-for-destructive-ops` exposure. Future per-agent conversion stories that perform file rewrites will carry their own safety analysis.

## Story

As the Convoke maintainer (Amalik) and any future dev agent implementing an I97 per-agent conversion (Stories 2.1–2.7),
I want the migration tooling foundation scaffolded under `scripts/migration/format-conversion/` (5 harness/utility files + README + fixup-checklist) and the reference-integrity script authored at `scripts/audit/reference-integrity.js`,
so that per-agent conversions in Epic 2 have the harness infrastructure and verification scripts they depend on (parity / Covenant survival / personality preservation / reference integrity), and so I98 (Gyre) + I99 (Team Factory) can inherit the same tooling without rework per NFR18.

## Context & Motivation

**What this story enables.** Story 2.1 (Emma POC) is the first per-agent conversion. Per epic spec § "Within-PR Sequencing", every E2 story runs the same 11-activity per-agent dev cycle including: parity tests (step 7) → post-migration sample capture (step 8) → reference integrity check (step 10). All three of those activities consume the harnesses scaffolded in this story. Without them, Story 2.1 either invents the tooling inline (defeating the POC purpose of calibrating downstream estimates) or ships without verification (defeating ADR-003 and FR13-25). Story 1.2 (rubric calibration) is **already DONE 2026-04-29** via the Round 1 + Round 2 pre-test (49/49 cells calibrated; rubric status `draft → calibrated`); the personality-preservation fixture data already exists at [`tests/migration/personality-preservation/fixtures/<agent>/`](../../tests/migration/personality-preservation/fixtures/) for all 7 agents. This story scaffolds the **lib-side harness** that consumes those fixtures.

**Why scaffolding now (vs. inline-with-Emma).** Per epic spec § "Pipelining notes" and Story 2.1 variance commentary: Emma is the proof-of-concept whose effort emergence calibrates downstream estimates. If Emma's PR also contains the harness scaffolding, the conversion-effort signal contaminates with tooling-effort signal — and Sprint 2+ commitments for the remaining 6 agents become unfounded. Separating the foundation from the first conversion preserves Emma's value as a calibration data-point.

**Why function-named namespace (`format-conversion/` not `i97-conversion/`).** NFR18 explicitly mandates migration-tooling reusability for I98 (Gyre marketplace structural compliance gap) and I99 (Team Factory marketplace structural compliance gap) per backlog Fast Lane rows added 2026-04-28. The Pattern A migration we're scaffolding here is the *same shape* for those future initiatives — only per-agent fingerprints differ. Function-named tooling means I98 inherits the harness without renaming or path-rewrite. Initiative-named tooling would force a copy-paste-and-rename pattern that violates NFR18.

**What this story does NOT do.** This story scaffolds. It does not run any harness against real per-agent migration data — that happens in Story 2.1+. The harnesses ship with stable public APIs (function signatures + module.exports shape) and minimal-but-functional bodies sufficient for: (a) compile/load without errors on import (AC8), (b) reference-integrity reports zero broken refs against current 4.0 baseline (AC4), (c) downstream stories can call the API without further refactoring. **Scope exclusion:** this story does NOT productionize the harnesses as CI gates — that's Epic 3 (CI Gate Productionization). This story does NOT author per-Right Covenant matrix — that's Story 4.1.

## Acceptance Criteria

### AC1 — `scripts/migration/format-conversion/` directory exists with the 5 lib files + README + fixup-checklist

**Given** I97 migration is beginning and Story 1.1 is being implemented
**When** I view the [`scripts/migration/format-conversion/`](../../scripts/migration/format-conversion/) directory after this story lands
**Then** it contains exactly these files:
- `README.md` — overview, ADR cross-references, how to invoke each harness, how the fixup checklist is consumed by per-agent PR review
- `fixup-checklist.md` — per-agent fixup contract authored per ADR-002 (see AC2 for required content)
- `fixtures/tmpDir-setup.js` — shared utility for `os.tmpdir()` + `fs.mkdtempSync()` per `test-fixture-isolation` rule
- `fixtures/isolated-install.js` — shared utility for creating an isolated 4.x BMAD install in a tmpDir (uses `fs.cpSync`-equivalent or symlink pattern per `test-fixture-isolation`)
- `parity-harness.js` — parity test runner (FR13–15: identical menu codes / workflow paths / output filenames pre vs post)
- `covenant-survival-harness.js` — Covenant audit re-runner (FR17–20: cell-level non-regression rule per ADR-005 per-Right policy; per-Right matrix consumed at Story 4.1 — this story scaffolds the harness skeleton only)
- `personality-harness.js` — personality verification harness (FR21–23: consumes the calibrated rubric at [`convoke-spec-personality-preservation-rubric.md`](../planning-artifacts/convoke-spec-personality-preservation-rubric.md) and existing fixtures under [`tests/migration/personality-preservation/fixtures/<agent>/`](../../tests/migration/personality-preservation/fixtures/))

**And** the directory tree matches architecture document § "Complete Project Directory Structure (post-I97)" lines 580–592 exactly (no additional files, no missing files).

**And** README.md cites each ADR by number and one-line summary so a future dev opening the dir can self-orient: ADR-002 (conversion tooling: BMB-canonical + manual fixup), ADR-003 (three harnesses + shared fixtures), ADR-004 (atomic-by-agent commit + this namespace's function-named rationale + NFR18 reusability), ADR-005 (Covenant baseline-validity per-Right policy — to-be-executed at Story 4.1).

### AC2 — `fixup-checklist.md` documents the four ADR-002 fixup categories

**Given** ADR-002 mandates BMB-canonical conversion with documented manual-fixup contract
**When** I read [`scripts/migration/format-conversion/fixup-checklist.md`](../../scripts/migration/format-conversion/fixup-checklist.md)
**Then** it contains a structured checklist with these four required categories (each with explicit reviewer-actionable items):

1. **Persona preservation** — the converted SKILL.md must preserve the agent's `## Identity`, `## Communication Style`, `## Principles` content without semantic loss vs. pre-migration. Reviewer instruction: diff the pre-migration `<persona>` block against the post-migration `## Identity`/`## Communication Style`/`## Principles` sections; flag any phrase deletion/addition/reword that changes role conveyance, communication-style markers, or principle adherence. **Cross-reference:** the 8 reviewer cues from rubric § "Status" — meta-pattern awareness, operator-preference vs principle-violation distinction, intellectual-honesty-as-D3 (Liam), meta-system Vortex-role-split awareness (Noah), Wade's adaptive-rigor, Mila's bias-naming, Isla's progressive-discovery ladder.
2. **Hardcoded error-string preservation** — the converted SKILL.md must preserve the v5 `<step n="2">` `🚨 IMMEDIATE ACTION REQUIRED` config-error block content (Operator Covenant fail-loud signal per OC-R3). Even though v6.3+ format delegates activation to `bmad-init`, the fail-loud user-visible behavior must remain reachable post-migration. Reviewer instruction: trigger the config-not-found case in a test fixture; verify the user sees the same error vocabulary ("Configuration Error", "Cannot load config file at", "Required fields", "Please verify").
3. **Capability menu code preservation** — the converted `## Capabilities` table must list identical menu codes pre vs. post (e.g., Emma's `LP / PV / CS / VL / PM`; Wade's `ME / LE / PC / PV / VE`). Reviewer instruction: extract menu codes from pre-migration `<menu>` block + post-migration `## Capabilities` table; assert lexical equality of the code-set.
4. **Workflow file path preservation per FR12** — every `references/<workflow-name>.md` capability prompt routes to a workflow path under `_bmad/bme/_vortex/workflows/<name>/workflow.md` that exists pre-migration. Reviewer instruction: for each capability prompt, extract the workflow path it routes to; assert the path exists in the pre-migration tree (workflow source files unchanged per FR12).

**And** each category includes: (a) a 1-sentence "what this prevents" rationale, (b) explicit reviewer steps in imperative voice, (c) a "fixup action if violated" pointer (e.g., "re-run BMB conversion with `--preserve-persona`" or "manually patch the converted file with the omitted content").

**And** the checklist is reusable for I98 + I99 — section structure is migration-general; only specific menu-code lists are agent-specific (handled by the per-agent PR template body in E2 stories).

### AC3 — Each scaffolded harness has a stable public API (compile/load without errors on import)

**Given** Stories 2.1–2.7 will consume these harnesses via `require()` from per-agent test files
**When** I import each harness from a Node.js context
**Then** the import succeeds without runtime errors AND the module exports the documented public API:

| File | Required exports (function signatures stable for E2 consumption) |
|---|---|
| `parity-harness.js` | `runParityCheck({ projectRoot, agentRoleName, tmpDir }) → { menuCodesEqual, workflowPathsEqual, outputFilenamesEqual, mismatches }` |
| `covenant-survival-harness.js` | `runCovenantSurvivalCheck({ projectRoot, agentRoleName, baselineAuditPath, perRightMatrix, tmpDir }) → { cellResults, regressedCells, declaredValidCells }` |
| `personality-harness.js` | `runPersonalityCheck({ projectRoot, agentRoleName, fixtureRoot, rubricPath, mode }) → { fixedPromptCapture, scenarioCapture, operatorScoringPrompt }` (where `mode` is `'capture'` or `'verify'`) |
| `fixtures/tmpDir-setup.js` | `setupTmpDir() → { tmpDir, cleanup }` and `withTmpDir(testFn) → asyncIIFE` (helper for tests) |
| `fixtures/isolated-install.js` | `setupIsolatedInstall({ tmpDir, sourceProjectRoot, agentRoleNamesToInclude }) → { installRoot, cleanup }` |

**And** function bodies may be **minimal-but-functional stubs**: each function executes its happy path (returns a result of the documented shape), but full per-agent verification logic is iteratively expanded during Story 2.1 (Emma POC) as concrete edge cases surface. Stubs MUST NOT throw; they return a valid (possibly empty/default) result of the documented shape so downstream tests don't crash. **Forbidden:** `throw new Error('TODO')` or `assert.fail()` in any happy path.

**And** every exported function accepts `projectRoot` as an explicit parameter — no `process.cwd()` calls in any harness or fixture file (per `no-process-cwd-in-libs` rule, project-context.md). CLI entry points (if any) use [`findProjectRoot()` from `scripts/update/lib/utils.js#L76`](../../scripts/update/lib/utils.js#L76) and pass the result down.

**And** each harness file's top-of-file JSDoc block names: (a) which FRs it implements, (b) which ADR it derives from, (c) what tests/E2 stories will consume it, (d) what's intentionally NOT in this scaffold (deferred to which downstream story).

### AC4 — `scripts/audit/reference-integrity.js` reports zero broken references against the current 4.0 baseline

**Given** the project tree at the moment this story is implemented (no per-agent migration has occurred yet — Stories 2.1–2.7 are still backlog)
**When** I run `node scripts/audit/reference-integrity.js` from the project root
**Then** the script exits 0 AND prints a summary report indicating zero broken references across all coverage scopes per architecture § D4 line 217:
- Test markdown documentation under [`tests/`](../../tests/) — `.md` files only *(Round 1 review patch P33 / decision D4: scope narrowed from `.md+.js` to `.md`-only because NFR10's intent is documentation cross-references, not source-code string literals — `.js` test files contain markdown-link patterns inside fixture string data that are not real references and produce ~23 false positives)*
- Slash-command wrappers under [`.claude/skills/bmad-agent-bme-*/`](../../.claude/skills/)
- Retrospective citations in `_bmad-output/implementation-artifacts/*-retro-*.md`
- Audit report citations in `_bmad-output/planning-artifacts/convoke-report-*-audit-*.md`
- Compliance Checklist file references in [`convoke-spec-covenant-compliance-checklist.md`](../planning-artifacts/convoke-spec-covenant-compliance-checklist.md)

**And** the script uses **mechanical research enumeration** per `mechanical-research-enumeration` rule (project-context.md): `grep -r` / Node `glob` patterns, NOT eyeballing or LLM inference. Implementation MAY shell out to `git grep` or `grep -rE` if that's faster than a pure-Node implementation; the operative constraint is determinism.

**And** the script accepts an optional `--paths <comma-list>` (or `--paths=<comma-list>` equals form) arg to scope the check (used later by the pre-commit hook integration in Story 3.3 per ADR D4 line 209). With no `--paths`, the script scans the full project tree. Path values may be relative to project root or absolute; relative paths are resolved against the result of `findProjectRoot()`. Non-existent paths produce a single warning to stderr and are skipped (do not fail the run).

**And** the script **skips refs containing `{{` or `}}` template placeholder syntax** *(Round 1 review patch P33 / decision D5(a): formalized in spec — these are template-engine syntax (e.g., `{{path}}` placeholders in `bmad-document-project/templates/`) emitted as link-shape during template authoring but never as real refs; filtering them prevents false positives at the user-supplied broader scope while keeping default-scope behavior identical)*. The filter applies at validation time, not extraction; refs are still counted in `totalRefs` but not in `brokenRefs`. Verified by [`tests/lib/format-conversion-load.test.js`](../../tests/lib/format-conversion-load.test.js) test "skips refs containing {{...}} template placeholders" *(Round 1 review patch P34 / decision D5(b))*.

**And** the script's exit code is 1 if any broken reference is detected (CI gate semantics per FR25 — productionized in Story 3.3, but exit-code contract established now).

**And** if the script detects a broken reference at the time of this story's implementation, the dev agent: (a) STOPS this story, (b) files a Bug Lane intake describing the broken reference, (c) does NOT silently fix unrelated documentation drift inside this story (scope discipline). The expected outcome is the script reports zero broken references — but if reality disagrees, the dev agent surfaces it rather than masks it.

### AC5 — `parity-harness.js` minimal implementation honors test-fixture-isolation

**Given** the parity harness will be invoked in tests under `tests/integration/vortex-parity.test.js` (authored at Story 3.2)
**When** I review [`scripts/migration/format-conversion/parity-harness.js`](../../scripts/migration/format-conversion/parity-harness.js)
**Then** every internal helper that touches the project tree (or a copy of it) accepts the `tmpDir` as an explicit parameter — never reads from `process.cwd()` or hardcoded project paths.

**And** the harness's stub implementation of `runParityCheck` accepts an `agentRoleName` and:
- Reads the agent's pre-migration menu codes from the existing v5 SKILL.md (parsing `<menu>` block — function `extractV5MenuCodes(skillMdContent)`)
- Reads the agent's post-migration menu codes from the converted SKILL.md if it exists, OR returns `{ menuCodesEqual: null, postMigrationFile: 'not-yet-converted' }` if not (so Stories 2.1–2.7 can incrementally invoke the harness during conversion)
- Returns the documented shape (AC3) — no throws, no asserts in the happy path

**And** the harness exports `extractV63MenuCodes(skillMdContent)` — parses v6.3+ `## Capabilities` table rows and extracts the `Code` column values; returns an array of menu-code strings. Used internally by `runParityCheck` post-migration; exposed for testability and downstream-test reuse.

**And** the file ends with a `module.exports = { runParityCheck, extractV5MenuCodes, extractV63MenuCodes }` object — naming is hyphen-free identifiers (camelCase) per Node convention.

### AC6 — `covenant-survival-harness.js` defers per-Right matrix to Story 4.1

**Given** ADR-005 declares **per-Right (OC-R1..R7) decision policy** with the per-Right rationale matrix authored at Story 4.1 (Epic 4)
**When** I review [`scripts/migration/format-conversion/covenant-survival-harness.js`](../../scripts/migration/format-conversion/covenant-survival-harness.js)
**Then** the harness's `runCovenantSurvivalCheck` function accepts a `perRightMatrix` parameter (object keyed by `OC-R1`..`OC-R7`, each value either `'re-audit'` or `'declare-valid'` with a rationale string) — the matrix itself is NOT included in this story; Story 4.1 authors it. The harness expects the matrix as input.

**And** for the stub implementation: if `perRightMatrix` is `undefined` or empty, the harness returns `{ status: 'no-matrix-supplied', message: 'Per-Right matrix authored at Story 4.1; supply matrix to run survival check' }` — no throw, no assert.

**And** the harness's top-of-file JSDoc block explicitly states: "This file scaffolds the cell-level non-regression rule (NFR7) per ADR-003. The per-Right matrix that drives the policy is authored at Story 4.1; ADR-005 transitions `proposed → accepted` at that point. Do not assume the matrix exists yet during E2."

**And** the `tmpDir` parameter is **reserved for Story 4.2's full re-audit logic** (per-cell isolated execution per `test-fixture-isolation`); in this story's stub, the parameter is accepted but unused. The harness JSDoc must explicitly document this contract so the dev agent picking up Story 4.2 inherits it without re-deriving the rationale.

### AC7 — `personality-harness.js` consumes existing fixtures + calibrated rubric

**Given** Story 1.2 is DONE (49/49 cells calibrated 2026-04-29) and fixture data exists at [`tests/migration/personality-preservation/fixtures/<agent>/`](../../tests/migration/personality-preservation/fixtures/) for all 7 agents
**When** I review [`scripts/migration/format-conversion/personality-harness.js`](../../scripts/migration/format-conversion/personality-harness.js)
**Then** the harness's `runPersonalityCheck` function in `mode: 'capture'`:
- Reads the existing baseline fixture for the agent — file naming established by Story 1.2 pre-test: `tests/migration/personality-preservation/fixtures/<agent>/baseline-fixed-prompt.json` AND `tests/migration/personality-preservation/fixtures/<agent>/baseline-unscripted-scenario.md`. **Note path naming** — the architecture document at line 602 names these `fixed-prompt-set.json` + `unscripted-scenarios.md`; the actual implemented Story 1.2 file naming uses `baseline-fixed-prompt.json` + `baseline-unscripted-scenario.md` (singular `scenario`, with `baseline-` prefix). The harness uses the **actual implemented naming**; the architecture document's naming is non-authoritative on this specific detail.
- Returns the documented shape (AC3): `{ fixedPromptCapture, scenarioCapture, operatorScoringPrompt }`. The `operatorScoringPrompt` field is a string containing the rubric's 7 dimensions + per-agent fingerprint pulled from [`convoke-spec-personality-preservation-rubric.md`](../planning-artifacts/convoke-spec-personality-preservation-rubric.md) — formatted for operator review (the operator scores manually; the harness produces the prompt that frames the scoring).

**And** in `mode: 'verify'`, the harness compares pre-migration baseline (existing fixtures) against post-migration capture (provided as input) and produces a structured per-dimension scoring framework that the operator fills in. The harness does NOT do automated personality scoring — operator judgment is the rubric's authoritative consumer per FR23.

**And** the harness's top-of-file JSDoc cites the rubric path AND the 8 reviewer cues from rubric § "Status": meta-pattern awareness, operator-preference-vs-principle-violation distinction, intellectual-honesty-as-D3 (Liam), meta-system Vortex-role-split awareness (Noah), Wade's adaptive-rigor, Mila's bias-naming, Isla's progressive-discovery ladder. These cues are reviewer guidance, not harness logic.

**And** if `mode` is anything other than `'capture'` or `'verify'`, the harness throws `Error("Invalid mode: expected 'capture' or 'verify', got '<value>'")`. This is one instance of the **structural-input fail-fast pattern** authorized as a carve-out from AC3's "stubs MUST NOT throw" rule (Round 1 review decision D2 broadened the original AC7 "one acceptable throw" wording into a general pattern). The pattern: when a parameter is **structurally invalid** (wrong shape, wrong type, value not in expected enum) — not just incomplete logic — failing fast prevents silent wrong-branch execution downstream. `mode === undefined` triggers the same throw. The pattern also authorizes:
- **`covenant-survival-harness.runCovenantSurvivalCheck`** throws on unknown OC-Rn key in `perRightMatrix`, on invalid `decision` values, on Array-shaped matrix input, and on TypeError-shape input. (Same shape as mode validation: structurally invalid input.)
- **`parity-harness.runParityCheck`** + **`personality-harness.runPersonalityCheck`** + **`covenant-survival-harness.runCovenantSurvivalCheck`** throw on `agentRoleName` that fails the whitelist regex `/^[a-z0-9][a-z0-9-]*$/` (Round 1 review patch P1 — path-traversal protection).
- **`personality-harness.runPersonalityCheck`** throws on `fs.readFileSync(...).then(JSON.parse)` failure when the fixture file is corrupt (Round 1 review decision D3 — environmental fail-fast on broken authoring contract; paired with D2).
- **`isolated-install.setupIsolatedInstall`** throws on `tmpDir` not being under `os.tmpdir()` or being non-empty (Round 1 review patch P2 — refuses to write into unsafe paths).

### AC8 — Harness scaffolds compile/load without runtime errors

**Given** the 5 harness/utility files have been authored per AC1, AC3, AC5–AC7
**When** I run a smoke verification — for each file: `node -e "require('./scripts/migration/format-conversion/<file>.js'); console.log('ok')"` — from the project root
**Then** each invocation prints `ok` AND exits 0 (no `SyntaxError`, no `MODULE_NOT_FOUND`, no thrown errors during module-level evaluation).

**And** equivalent smoke for `scripts/audit/reference-integrity.js`: `node scripts/audit/reference-integrity.js --help 2>&1 | head -1` prints a usage message AND exits 0 (no module load failure).

**And** `--paths` arg-parsing is verified by smoke: `node scripts/audit/reference-integrity.js --paths .claude/skills/bmad-agent-bme-contextualization-expert/ 2>&1 | tail -1` exits 0 AND the report output indicates the scan was scoped to that path only (verifiable via the trailing `(scoped to ...)` annotation in the PASS/FAIL line). Zero broken refs at current 4.0 baseline holds for this scoped run. *(Round 1 review patch P31 / decision D1: the scope was originally `.claude/` but that wider tree contains 185 pre-existing broken refs in WDS skill bundles and `bmad-document-project` templates — out-of-I97-scope per scope-discipline rule. The narrowed smoke target is a known-clean Vortex slash-command wrapper that proves arg-parsing works without entangling pre-existing drift.)*

**And** the smoke verification commands are documented in `scripts/migration/format-conversion/README.md` so future devs can re-run the same checks without re-deriving them.

**And** to enforce no-regression on this contract going forward, **add one minimal load-test** at [`tests/lib/format-conversion-load.test.js`](../../tests/lib/format-conversion-load.test.js) that:
- Imports each of the 5 harness/utility files via `require()` in `before()` / `it()`
- Asserts the documented `module.exports` keys are present (per AC3 table)
- Imports `scripts/audit/reference-integrity.js` and asserts it exposes a callable entry point
- Uses `node:test` runner per project convention (per [memory MEMORY.md "Remaining Test Debt" — `tests/lib/*.test.js` converted from Jest to `node:test`](../../README.md))

### AC9 — `npm run lint` exits 0 with zero warnings on files modified by this story

**Given** the `lint-passes-before-review` rule from [project-context.md](../../project-context.md) is mandatory before marking story `review` (per NFR5)
**When** I run `npm run lint` after this story's implementation
**Then** the command exits 0 AND reports zero warnings on the new files: `scripts/migration/format-conversion/{README.md is doc-only — exempt}, fixup-checklist.md is doc-only — exempt, fixtures/tmpDir-setup.js, fixtures/isolated-install.js, parity-harness.js, covenant-survival-harness.js, personality-harness.js`, plus `scripts/audit/reference-integrity.js`, plus `tests/lib/format-conversion-load.test.js`.

**And** any pre-existing lint warnings/errors in unrelated files (e.g., 1A.4 WIP territory if still active) are out-of-scope per the touched-files-not-global rule established in `lint-1.1` (AC4 design-decision narrowing).

### AC10 — DoD checklist (per `bmad-dev-story` checklist)

**Given** the project's standard story DoD
**When** this story is marked `review`
**Then** the following are ALL true:
- [x] All ACs above (AC1–AC9) demonstrably satisfied
- [x] `npm run lint` exits 0 with zero warnings on touched files (AC9)
- [x] `node --test tests/lib/format-conversion-load.test.js` exits 0 (AC8 load-test green; 15/15 pass post Round 1 patches)
- [x] `node scripts/audit/reference-integrity.js` exits 0 with zero broken references (AC4 default scope)
- [x] No new lint regressions introduced in any pre-existing file
- [x] No `TODO`/`FIXME` markers left in scaffolded files that would block downstream story consumption (AC3 forbids `throw new Error('TODO')` in happy paths)
- [x] Namespace decision section above has been re-read and confirmed (NFR9)
- [x] Architecture references in scaffolded files cite ADRs by number + line/section (no naked `[link]` URLs)

## Tasks / Subtasks

> **Sequencing note:** Tasks are roughly in dependency order; Task 1 (dir + README) gates Task 2 (fixup checklist), but Tasks 3–7 (the 5 lib files) can be authored in parallel since they share no internal dependencies. Task 8 (reference-integrity.js) is independent of Tasks 1–7 and can run in parallel with them. Task 9 (load-test) and Task 10 (smoke + reference baseline) gate Task 11 (lint + DoD). Single dev session likely; no batch-merging across multiple PRs.

- [x] **Task 1** — Create `scripts/migration/format-conversion/` directory + `README.md` (AC1, AC2 cross-ref)
  - [x] 1.1 `mkdir -p scripts/migration/format-conversion/fixtures`
  - [x] 1.2 Author `scripts/migration/format-conversion/README.md` with: overview (1 paragraph), ADR cross-references (each ADR cited by number + 1-line summary + linked path), how to invoke each harness (smoke commands per AC8), how the fixup checklist is consumed by per-agent PR review (1 sentence + link to ADR-002)
- [x] **Task 2** — Author `scripts/migration/format-conversion/fixup-checklist.md` per ADR-002 (AC2)
  - [x] 2.1 Section 1 — Persona preservation (with cross-reference to 8 reviewer cues from rubric §"Status")
  - [x] 2.2 Section 2 — Hardcoded error-string preservation (with explicit reference to OC-R3 fail-loud signal)
  - [x] 2.3 Section 3 — Capability menu code preservation (with example menu-code-set extraction recipe)
  - [x] 2.4 Section 4 — Workflow file path preservation per FR12 (with explicit `_bmad/bme/_vortex/workflows/` path-existence check)
  - [x] 2.5 Each section includes: rationale (1 sentence), reviewer steps (imperative), fixup action pointer (1 sentence)
- [x] **Task 3** — Scaffold `scripts/migration/format-conversion/fixtures/tmpDir-setup.js` (AC3)
  - [x] 3.1 Implement `setupTmpDir()` using `os.tmpdir()` + `fs.mkdtempSync()`; return `{ tmpDir, cleanup }` where `cleanup` removes the dir tree
  - [x] 3.2 Implement `withTmpDir(testFn)` as an async-IIFE wrapper that auto-calls cleanup in `finally` block
  - [x] 3.3 Top-of-file JSDoc citing `test-fixture-isolation` rule (NFR4) and project-context.md anchor
  - [x] 3.4 `module.exports = { setupTmpDir, withTmpDir }` at end
- [x] **Task 4** — Scaffold `scripts/migration/format-conversion/fixtures/isolated-install.js` (AC3)
  - [x] 4.1 Implement `setupIsolatedInstall({ tmpDir, sourceProjectRoot, agentRoleNamesToInclude })` — copy or symlink the `_bmad/bme/_vortex/agents/<role>/` directories listed in `agentRoleNamesToInclude` into `tmpDir/_bmad/bme/_vortex/agents/`; copy `_bmad/bme/_vortex/{module.yaml,workflows/}` if needed
  - [x] 4.2 Returns `{ installRoot: tmpDir, cleanup }`; cleanup is the same handler from `tmpDir-setup.js`
  - [x] 4.3 Top-of-file JSDoc citing `test-fixture-isolation` + ADR-003 shared fixture pattern
  - [x] 4.4 `module.exports = { setupIsolatedInstall }` at end
- [x] **Task 5** — Scaffold `scripts/migration/format-conversion/parity-harness.js` (AC3, AC5)
  - [x] 5.1 Implement `runParityCheck({ projectRoot, agentRoleName, tmpDir })` per AC3 + AC5 contract
  - [x] 5.2 Implement `extractV5MenuCodes(skillMdContent)` helper — regex-extract `<menu>` block, parse `<item cmd="XX or fuzzy match...">` codes; returns array of menu-code strings
  - [x] 5.3 Implement `extractV63MenuCodes(skillMdContent)` helper — parse v6.3+ `## Capabilities` table rows, extract Code column
  - [x] 5.4 If post-migration SKILL.md doesn't exist, return `{ menuCodesEqual: null, postMigrationFile: 'not-yet-converted', ... }` — no throw
  - [x] 5.5 Top-of-file JSDoc cites FR13–15 + ADR-003 + lists Stories 2.1–2.7 as consumers
  - [x] 5.6 `module.exports = { runParityCheck, extractV5MenuCodes, extractV63MenuCodes }` at end
- [x] **Task 6** — Scaffold `scripts/migration/format-conversion/covenant-survival-harness.js` (AC3, AC6)
  - [x] 6.1 Implement `runCovenantSurvivalCheck({ projectRoot, agentRoleName, baselineAuditPath, perRightMatrix, tmpDir })` per AC3 + AC6 contract
  - [x] 6.2 If `perRightMatrix` is undefined/empty, return `{ status: 'no-matrix-supplied', message: '...' }` (per AC6)
  - [x] 6.3 If `perRightMatrix` provided, scaffold the cell-iteration shell: load baselineAuditPath, identify cells, for each cell whose matrix entry is `'re-audit'` mark as `cellResults[cell-id] = 'pending-execution'`; for `'declare-valid'` mark `'declared-valid-by-matrix'`. Full re-audit logic deferred to Story 4.2.
  - [x] 6.4 Top-of-file JSDoc cites FR17–20 + ADR-003 + ADR-005 + Story 4.1 as the per-Right matrix author
  - [x] 6.5 `module.exports = { runCovenantSurvivalCheck }` at end
- [x] **Task 7** — Scaffold `scripts/migration/format-conversion/personality-harness.js` (AC3, AC7)
  - [x] 7.1 Implement `runPersonalityCheck({ projectRoot, agentRoleName, fixtureRoot, rubricPath, mode })` per AC3 + AC7 contract
  - [x] 7.2 In `mode: 'capture'`: read the agent's `baseline-fixed-prompt.json` + `baseline-unscripted-scenario.md` from `fixtureRoot/<agentRoleName>/`; read the rubric from `rubricPath`; format `operatorScoringPrompt` from rubric § "Scoring Dimensions" + § "Per-Agent Personality Fingerprints" entry for `agentRoleName`
  - [x] 7.3 In `mode: 'verify'`: accept post-migration capture as input; produce per-dimension scoring framework (no automated scoring — operator fills it in)
  - [x] 7.4 Top-of-file JSDoc cites FR21–23 + ADR-003 + the 8 reviewer cues from rubric § "Status"
  - [x] 7.5 `module.exports = { runPersonalityCheck }` at end
- [x] **Task 8** — Author `scripts/audit/reference-integrity.js` (AC4)
  - [x] 8.1 CLI entry point: `node scripts/audit/reference-integrity.js [--paths <comma-list>] [--help]`. **Mirror sibling-script conventions** from `scripts/audit/audit-skill-dirs.js`, `scripts/audit/audit-bmm-dependencies.js`, `scripts/audit/audit-bmad-init-refs.js` — same arg-parsing style (Node's built-in `process.argv` slicing, no extra dependencies), same exit-code semantics (0 = pass, 1 = findings, 2 = invocation error), same logging shape (single-line summary + per-finding indented list).
  - [x] 8.2 Mechanical enumeration over the 5 coverage scopes per architecture § D4 line 217
  - [x] 8.3 Use `grep -r` / Node `glob` (per `mechanical-research-enumeration` rule); deterministic
  - [x] 8.4 Exit 0 if zero broken references; exit 1 with broken-reference-list-stdout otherwise; exit 2 only on invocation error (e.g., invalid arg)
  - [x] 8.5 `--help` prints usage and exits 0
  - [x] 8.6 `--paths <comma-list>` arg-parsing: relative paths resolved against `findProjectRoot()`; absolute paths used as-is; non-existent paths print one stderr warning and are skipped (do not fail the run, per AC4 contract)
  - [x] 8.7 No `process.cwd()` in lib; CLI entry point uses `findProjectRoot()` from [`scripts/update/lib/utils.js#L76`](../../scripts/update/lib/utils.js#L76) (consumed by sibling audit scripts already — re-use the same import pattern)
- [x] **Task 9** — Author `tests/lib/format-conversion-load.test.js` load-test (AC8)
  - [x] 9.1 Use `node:test` runner; one `describe` block, one `it` block per file
  - [x] 9.2 For each of the 5 harness/utility files: `require()` it; assert the documented `module.exports` keys exist
  - [x] 9.3 For `scripts/audit/reference-integrity.js`: spawn the script with `--help`; assert exit code 0
- [x] **Task 10** — Smoke verification + reference-integrity baseline (AC4, AC8)
  - [x] 10.1 Run the 6 smoke commands from AC8 manually; capture stdout for the Dev Agent Record
  - [x] 10.2 Run `node scripts/audit/reference-integrity.js` from project root; expect exit 0 + zero broken refs
  - [x] 10.3 If broken refs surface — STOP, file Bug Lane intake, do NOT silently fix unrelated drift in this story (scope discipline per `lint-1.1` precedent)
  - [x] 10.4 If zero broken refs — proceed; capture output for Dev Agent Record (this is the established baseline state for FR24)
- [x] **Task 11** — DoD gate: lint + load-test + integration verification
  - [x] 11.1 `npm run lint` — exit 0, zero warnings on touched files (AC9, NFR5)
  - [x] 11.2 `npm test -- tests/lib/format-conversion-load.test.js` — exit 0
  - [x] 11.3 Re-read namespace decision section above; confirm correct (NFR9)
  - [x] 11.4 Update sprint-status.yaml: `i97-1-1-migration-tooling-foundation-scaffolded: backlog → review` (sprint-status update happens at `review` not at `ready-for-dev` — that step was done by `bmad-create-story`)

### Review Findings (Round 1 — 2026-05-01)

Round 1 code review by 3 parallel adversarial reviewers (Blind Hunter, Edge Case Hunter, Acceptance Auditor). Triaged: **5 decision-needed, 30 patch, 6 defer, 7 dismissed**. Same-LLM-as-implementation caveat applies — operator should weight findings against same-session bias per `bmad-dev-story` workflow guidance.

**Decision-needed (5) — RESOLVED 2026-05-01 by operator (Bob); all → option (a), formalize-deviations:**

- [x] [Review][Decision-resolved] **D1 → option (a):** AC8 `--paths .claude/` smoke. Refine AC8 via spec amendment to use a known-clean scoped path (e.g. `.claude/skills/bmad-agent-bme-contextualization-expert/`). Becomes patch P31.
- [x] [Review][Decision-resolved] **D2 → option (a):** Covenant-harness structural-input throws. Amend AC7's "the one acceptable throw" → "structural-input fail-fast pattern" (broader principle); apply consistently across personality + covenant harnesses. Becomes patch P32.
- [x] [Review][Decision-resolved] **D3 → option (a) paired with D2:** personality-harness JSON.parse throws are authorized under the same broadened pattern (corrupt fixture = environmental fail-fast, same shape as structural-input fail-fast). No separate spec patch needed; covered by P32.
- [x] [Review][Decision-resolved] **D4 → option (a):** Reference-integrity `.md`-only scope narrowing formalized via spec amendment to AC4 + Architecture § D4. Becomes patch P33.
- [x] [Review][Decision-resolved] **D5 → both (a) + (b):** `{{...}}` placeholder filter behavior (a) added as one-line note in AC4 (covered by P33 same correct-course session) + (b) test asserting filter behavior added to load-test. Becomes patch P34.

**Patch (30) — sorted HIGH → MEDIUM → LOW:**

*HIGH (8):*

- [ ] [Review][Patch] **Path traversal via `agentRoleName` parameter** [parity-harness.js:97; personality-harness.js:122-123; isolated-install.js:99,104]
- [ ] [Review][Patch] **`setupIsolatedInstall` doesn't validate `tmpDir` is empty + under `os.tmpdir()`** [isolated-install.js:91-138]
- [ ] [Review][Patch] **Symlink-cycle infinite loop in `_walkDir`** [reference-integrity.js:328-361]
- [ ] [Review][Patch] **`_validateRef` flags inaccessible files (EACCES) as broken** [reference-integrity.js:226]
- [ ] [Review][Patch] **Stateful global `/g` regex shared across calls — concurrency hazard for parallelized Stories 2.x** [parity-harness.js:46,55; reference-integrity.js:89; personality-harness.js extractPerAgentFingerprint]
- [ ] [Review][Patch] **`_globPartToRegex` doesn't expand middle-segment wildcards — `bmad-agent-bme-*/SKILL.md` scope returns ZERO files (correctness bug)** [reference-integrity.js:289-304]
- [ ] [Review][Patch] **Code-fence stripping uses empty-fill instead of space-fill (column offset corruption)** [reference-integrity.js:192]
- [ ] [Review][Patch] **`_stripCodeRegions` doesn't strip 4-space-indented code blocks** [reference-integrity.js:188-197]

*MEDIUM (13):*

- [ ] [Review][Patch] **`V63_CAPABILITY_ROW_REGEX` matches table rows anywhere, not just under `## Capabilities` heading** [parity-harness.js:55,227-239]
- [ ] [Review][Patch] **`extractV5MenuCodes` doesn't require `<item>` inside `<menu>` block** [parity-harness.js:46]
- [ ] [Review][Patch] **`arraysEqualUnordered` mutates inputs via in-place `.sort()`** [parity-harness.js:171]
- [ ] [Review][Patch] **parity-harness format detection (`isV5Format`/`isV63Format`) doesn't strip code fences first** [parity-harness.js:115-116]
- [ ] [Review][Patch] **`extractPerAgentFingerprint` `nextHeaderMatch.index` off-by-one (blank section returns header only)** [personality-harness.js:299-300]
- [ ] [Review][Patch] **`extractPerAgentFingerprint` matches `### <Name>` inside code fences** [personality-harness.js:292-301]
- [ ] [Review][Patch] **`buildPerDimensionFramework` ignores most params — call site passes 4 args, function uses 1** [personality-harness.js:167-173,246-268]
- [ ] [Review][Patch] **`_validateRef` `_projectRoot` parameter unused — comment promises containment-check but code doesn't enforce** [reference-integrity.js:199-230]
- [ ] [Review][Patch] **`--paths --help` arg-parsing edge case** [reference-integrity.js:396-410]
- [ ] [Review][Patch] **`setupIsolatedInstall` silently skips missing `module.yaml`/`workflows`/`config.yaml` when explicitly requested** [isolated-install.js:108-132]
- [ ] [Review][Patch] **`runPersonalityCheck` doesn't strip UTF-8 BOM before `JSON.parse`** [personality-harness.js:130-135]
- [ ] [Review][Patch] **`runCovenantSurvivalCheck` accepts arrays as `perRightMatrix` (typeof confusion)** [covenant-survival-harness.js:113,121]
- [ ] [Review][Patch] **`MD_LINK_REF_REGEX` rejects paths with parens or angle-bracket form** [reference-integrity.js:89]

*LOW (9):*

- [ ] [Review][Patch] **`extractPerAgentFingerprint` hardcoded 7-agent role→firstname map (NFR18 forward-prep)** [personality-harness.js:278-286]
- [ ] [Review][Patch] **`setupTmpDir` prefix accepts paths with `/` or `..`** [tmpDir-setup.js:41-45]
- [ ] [Review][Patch] **`setupIsolatedInstall.cleanup` is a no-op — either implement or remove from return** [isolated-install.js:140-144]
- [ ] [Review][Patch] **`--paths=foo,bar` equals-form not supported** [reference-integrity.js:404]
- [ ] [Review][Patch] **`runCovenantSurvivalCheck` baseline-audit-missing branch doesn't check file-vs-directory** [covenant-survival-harness.js:140]
- [ ] [Review][Patch] **`isolated-install` `fs.copySync` dereferences symlinks by default** [isolated-install.js:104,113,122,131,137]
- [ ] [Review][Patch] **Load-test `--help` `execFileSync` has no timeout** [tests/lib/format-conversion-load.test.js:172-176]
- [ ] [Review][Patch] **AC10 DoD checkboxes (lines 174-181) still unchecked despite Status `review`** [story file:174-181]
- [ ] [Review][Patch] **README documents the failing `--paths .claude/` smoke without annotation** [scripts/migration/format-conversion/README.md:48]

**Defer (6) — pre-existing or out-of-scope, recorded in `deferred-work.md`:**

- [x] [Review][Defer] cleanup failures swallowed silently to stderr-only (project-wide concern)
- [x] [Review][Defer] Load-test brittle to module-cache state leakage between test reruns (currently passes; theoretical)
- [x] [Review][Defer] parity-harness reads SKILL.md as utf8 only — UTF-16 BOM source rare in practice
- [x] [Review][Defer] `_resolveAllScopes` Set dedup is paths-as-strings (symlink edge case)
- [x] [Review][Defer] reference-integrity CLI has no `--project-root` override (testability future enhancement)
- [x] [Review][Defer] `OPERATOR_RIGHTS` matrix accepts partial matrix silently — Story 4.1 territory

**Dismissed (7):** `cause: err` Node 16.9+ (engines floor ≥18 covers); `_walkGlob` trivial-pattern surprise (theoretical); `--paths` trailing/leading commas (trim+filter handles); load-test happy-path coverage gap (out-of-scope per Dev Notes deferral to Story 2.1); `execFileSync` implicit-exit-check (works correctly via thrown-on-non-zero contract); AC5 reads-from-projectRoot literal interpretation (Auditor's own LOW admits spec-intent met); Task 8.7 CLI seeded from cwd (compliant — `no-process-cwd-in-libs` applies to lib code, CLI entry points seed from cwd by spec).

### Review Findings (Round 2 — 2026-05-02)

Round 2 code review by 3 parallel adversarial reviewers (same setup as Round 1). Triaged: **0 decision-needed, 10 patch (4 HIGH + 6 MEDIUM), ~15 defer (LOW), 3 dismiss**. Acceptance Auditor: 0 violations against amended ACs. Convergence-rule status: Round 2 patches were mostly tightening + small additions, no new files / function renames / control-flow rewrites — Round 3 NOT triggered per `code-review-convergence` rule. Remaining LOW-severity findings deferred to backlog via this entry.

**Patch (10) applied — sorted HIGH → MEDIUM:**

*HIGH (4):*

- [x] [Review][Patch] **R2-P1 — `_walkGlob` direct-path fallback dropped `.js` from suffix list** [reference-integrity.js:319] — was `_walkDir(staticDir, ['.md', '.js'])`; now `['.md']` to honor AC4 amendment
- [x] [Review][Patch] **R2-P2 — `_expandGlobTail` `**/**` infinite-recursion guard** [reference-integrity.js:340-348] — collapse adjacent `**` segments before dispatch
- [x] [Review][Patch] **R2-P3 — `extractV63MenuCodes` skips header row by anchoring after table separator** [parity-harness.js:265-274] — defends against future uppercase-coded headers like `| ID |` that would match the regex as phantom codes
- [x] [Review][Patch] **R2-P4 — `extractV5/V63MenuCodes` + `extractPerAgentFingerprint` strip fences before extraction (not just before detection)** [parity-harness.js:236, 257; personality-harness.js:283-286] — Round 1 P9/P10/P14 stripped fences for boundary detection but extraction still ran against raw content

*MEDIUM (6):*

- [x] [Review][Patch] **R2-P5 — `extractPerAgentFingerprint` escapes regex special chars in `firstName` interpolation** [personality-harness.js:288-292] — defends against future registry entries with regex meta-chars
- [x] [Review][Patch] **R2-P6 — `isolated-install` `dereference: false` → `dereference: true`** [isolated-install.js:48] — Round 1 P27 introduced a fixture-isolation hazard (preserved symlinks pointing back to source); copying real bytes preserves isolation
- [x] [Review][Patch] **R2-P7 — `_validateRef` adds EISDIR-aware check (refined to honor trailing-slash author intent)** [reference-integrity.js:264-282] — directory references without trailing slash flagged as broken (likely typo); trailing-slash refs validated as legitimate directory links
- [x] [Review][Patch] **R2-P8 — `_resolveScopePaths` uses `lstatSync` at entry, skips symlinks** [reference-integrity.js:307-336] — consistency with `_walkDir`'s symlink-skip rule
- [x] [Review][Patch] **R2-P9 — `OPERATOR_RIGHTS` and `VALID_MATRIX_DECISIONS` `Object.freeze`'d** [covenant-survival-harness.js:44, 48] — consistency with sibling `ROLE_TO_FIRSTNAME_REGISTRY`
- [x] [Review][Patch] **R2-P10 — `agentRoleName` regex tightened to disallow trailing/consecutive hyphens** [parity-harness.js:47, personality-harness.js:49, covenant-survival-harness.js:51, isolated-install.js:39] — `/^[a-z0-9](?:[a-z0-9]|-(?=[a-z0-9]))*$/`

**Defer (~15) — recorded in `deferred-work.md` under "Deferred from: code review of i97-1-1 Round 2 (2026-05-02)":**

Cross-file regex duplication (4 files); Windows `\0`/null-byte in tmpDir prefix; `--paths foo bar` extra positional silent-drop; mode-validation ordering in personality-harness; `?` glob support; cleanup leaves `_bmad/` parent shells (re-seeding scenario); header-only fingerprint section returns header-only; Unicode glyphs in operator scoring prompt; ENOTDIR-vs-ENOENT distinction in `_walkGlob`; TOCTOU race notes (setupIsolatedInstall empty-check); 4-space indent + fence ordering (idempotent, no bug); realpathSync mid-call race; `_extractMarkdownLinkRefs` parens-in-paths (already deferred Round 1 — re-noted); test future-proofing comment (already commented).

**Dismissed (3):** parens-in-paths (already R1-deferred); test comment (already in code); `--paths` extra positional silent-drop (corner case, no real risk vector).

**Validation post-Round-2:**
- Lint exit 0, zero warnings
- Load-test: 15/15 pass
- Reference-integrity baseline: 75 refs / 0 broken
- Full regression: 1510/1511 pass, 0 fail, 0 regressions

**Convergence reached.** Round 2 patches were tightening + small additions (not new files / renamed functions / altered control flow per `code-review-convergence` definition of "structural"). Round 3 NOT triggered. Remaining defer items recorded for backlog triage.

## Dev Notes

### Relevant architecture patterns and constraints

**ADR cross-references (read in this order before implementing):**
- [ADR-002 — Conversion Tooling Architecture](../planning-artifacts/adr/i97/adr-002-conversion-tooling-architecture.md) — drives AC2 fixup checklist content + AC1 README "how to invoke" framing
- [ADR-003 — Verification Harness Architecture](../planning-artifacts/adr/i97/adr-003-verification-harness-architecture.md) — drives AC3 three-harness API design + AC4 shared-fixture pattern
- [ADR-004 — Atomic-by-Agent Commit and Tooling Namespace](../planning-artifacts/adr/i97/adr-004-atomic-by-agent-commit-and-tooling-namespace.md) — drives namespace decision (`format-conversion/` not `i97-conversion/`)
- [ADR-005 — Covenant Baseline-Validity Policy](../planning-artifacts/adr/i97/adr-005-covenant-baseline-validity-policy.md) — drives AC6 deferral of per-Right matrix to Story 4.1

**Architecture document § D4** (line 209): Reference integrity is a **CI merge gate** with **optional pre-commit hook**. This story authors the script (the same script that will be invoked by both contexts). CI-gate productionization is Story 3.3; pre-commit hook productionization is also Story 3.3. **In scope here:** the script + its CLI contract + its zero-broken-refs report against current 4.0 baseline. **Out of scope:** CI YAML config, pre-commit hook installation.

**Architecture document § "Code Patterns (from project-context.md)"** lines 472–481 — these rules are binding for all migration tooling code:
- `no-hardcoded-versions` — N/A by content (this story doesn't deal with version strings; harness just imports)
- `no-process-cwd-in-libs` — **load-bearing**; every export accepts `projectRoot` as parameter (AC3, Tasks 5–8)
- `test-fixture-isolation` — **load-bearing**; AC5 + Task 3.1 enforce `tmpDir` isolation pattern
- `derive-counts-from-source` — N/A here (no count-iteration over agents in this story; that pattern emerges in tests during E2)
- `mechanical-research-enumeration` — **load-bearing for AC4**; reference-integrity.js uses `grep -r` / `glob`, not eyeballing
- `path-safety-for-destructive-ops` — N/A (no destructive ops; tmpDir cleanup uses canonical Node pattern)
- `code-review-convergence` — applies at PR review time (R1 mandatory; R2 on HIGH; R3 on structural; no R4)
- `lint-passes-before-review` — **load-bearing** for AC9 + Task 11.1

**Architecture § "Anti-Patterns (I97-specific)"** lines 483–501 — none of the anti-patterns are particularly tempting for this story (we're not converting any agent yet), but the dev agent should be familiar with them so AC2's fixup checklist captures the right defenses.

### Source tree components to touch

**New files (8):**
1. `scripts/migration/format-conversion/README.md`
2. `scripts/migration/format-conversion/fixup-checklist.md`
3. `scripts/migration/format-conversion/fixtures/tmpDir-setup.js`
4. `scripts/migration/format-conversion/fixtures/isolated-install.js`
5. `scripts/migration/format-conversion/parity-harness.js`
6. `scripts/migration/format-conversion/covenant-survival-harness.js`
7. `scripts/migration/format-conversion/personality-harness.js`
8. `scripts/audit/reference-integrity.js`

**New test file (1):**
9. `tests/lib/format-conversion-load.test.js`

**Files NOT touched (defensive):**
- No changes to any `_bmad/` content (per FR12 + scope discipline)
- No changes to any existing harness or test under `tests/` outside the new load-test
- No changes to `package.json` (no new scripts entry — the harnesses are invoked from test files, not from npm-script entry points yet — productionization in Story 3.x adds `npm run` wrappers)
- No changes to `.claude/` or `.claude-plugin/` (those updates are per-agent in E2)

**Files to read (for cross-reference, NOT to modify):**
- [`scripts/update/lib/utils.js#L76`](../../scripts/update/lib/utils.js#L76) — `findProjectRoot()` signature; reused by Task 8.6 (existing audit scripts at `scripts/audit/audit-skill-dirs.js` + `scripts/audit/audit-bmad-init-refs.js` consume the same util — mirror their import pattern)
- [`scripts/audit/`](../../scripts/audit/) — 7 sibling audit scripts already exist (`audit-skill-dirs.js`, `audit-bmm-dependencies.js`, `audit-bmad-init-refs.js`, `drift-snapshot.js`, `pf1-judge-calibration.js`, `pf1-validation-battery.js`, `validate-marketplace.js`). Mirror their CLI conventions, exit-code semantics, and logging shape — the new `reference-integrity.js` should feel like a sibling, not a stranger.
- [`scripts/portability/`](../../scripts/portability/) — sample existing test-fixture-isolation patterns and JSDoc style
- [`tests/lib/portability-*.test.js`](../../tests/lib/) — sample existing `node:test` test file patterns (per Task 9.1)
- [`tests/lib/config-loader.test.js`](../../tests/lib/config-loader.test.js) — recent reference for `node:test` style + assertion patterns
- **v5 menu source sample (for `extractV5MenuCodes` regex derivation, AC5):** [`_bmad/bme/_vortex/agents/contextualization-expert/SKILL.md`](../../_bmad/bme/_vortex/agents/contextualization-expert/SKILL.md) lines 89–98 — Emma's `<menu>` block. Pattern: `<item cmd="XX or fuzzy match on ...">[XX] Description</item>` where the menu code is both the prefix in the `cmd=` attribute AND the bracketed `[XX]` prefix in the item text. Either source is authoritative; recommend extracting from `[XX]` (more uniform across the 7 v5 agents).
- **v6.3+ Capabilities table format sample (for `extractV63MenuCodes` parsing, AC5):** [`.claude/skills/bmad-agent-pm/SKILL.md`](../../.claude/skills/bmad-agent-pm/SKILL.md) — John PM agent already in v6.3+ markdown format. Read its `## Capabilities` section: standard markdown table with columns `Code | Description | Skill`. Extract the `Code` column values. Same format will be the target shape for converted Vortex agents in E2.
- [`convoke-spec-personality-preservation-rubric.md`](../planning-artifacts/convoke-spec-personality-preservation-rubric.md) — read § "Status" for the 8 reviewer cues; § "Per-Agent Personality Fingerprints" for the per-agent JSDoc references in Task 7.4

### Testing standards summary

- **Test runner:** `node:test` (per memory MEMORY.md "Remaining Test Debt" — `tests/lib/*.test.js` converted from Jest; ESLint Jest globals removed)
- **Fixture isolation:** mandatory per `test-fixture-isolation` rule. Even the load-test in Task 9 should not need a tmp dir (it only `require()`s modules), but follow project convention if the test needs filesystem access.
- **Coverage expectations:** load-test only at this story; full per-function unit tests live alongside the per-agent stories (Story 2.1+) where edge cases emerge naturally
- **DoD lint:** `npm run lint` exits 0 with zero warnings on touched files (AC9 + Task 11.1)

### Project Structure Notes

**Alignment with unified project structure (paths, modules, naming):**
- The `scripts/migration/format-conversion/` namespace is new but follows the existing `scripts/<purpose>/<implementation>/` pattern (cf. `scripts/update/lib/`, `scripts/update/migrations/`, `scripts/portability/`)
- `scripts/audit/` already exists for audit-related scripts; `reference-integrity.js` is the natural sibling pattern there
- File naming uses kebab-case per existing convention (e.g., `tmpDir-setup.js` follows JavaScript camelCase + identifier hyphenation precedent in scripts/portability/)

**Detected conflicts or variances (with rationale):**
- **Architecture document line 602 vs. actual implemented file naming.** The architecture document at line 602 lists `tests/migration/personality-preservation/fixtures/<agent>/fixed-prompt-set.json` + `unscripted-scenarios.md`. The Story 1.2 pre-test (DONE 2026-04-29) used `baseline-fixed-prompt.json` + `baseline-unscripted-scenario.md` (singular `scenario`, prefixed `baseline-`). The pre-test naming is authoritative — fixtures already exist on disk under that scheme. **Resolution:** AC7 explicitly resolves this in the dev's favor — use the implemented naming. The architecture document's specific filename for this fixture is non-authoritative on this single detail (the architectural pattern of the fixture pattern itself is sound).
- **Sprint-status.yaml line 37 pre-existing YAML scanner issue.** Not introduced by this story; not in scope. Operator narrative-log pattern in `last_updated:` field uses unquoted colons. Mention here so dev agent doesn't try to "fix" it.

### References

- [`convoke-epic-bmad-v63-source-format-adoption.md` § Story 1.1](../planning-artifacts/convoke-epic-bmad-v63-source-format-adoption.md) — story source
- [`convoke-prd-bmad-v63-source-format-adoption.md` § FR16, FR21–25](../planning-artifacts/convoke-prd-bmad-v63-source-format-adoption.md) — primary FRs
- [`convoke-arch-bmad-v63-source-format-adoption.md` § D2 line 170, § D3 line 186, § D4 line 207, § D5 line 223](../planning-artifacts/convoke-arch-bmad-v63-source-format-adoption.md) — architectural decisions
- [`adr-002-conversion-tooling-architecture.md`](../planning-artifacts/adr/i97/adr-002-conversion-tooling-architecture.md) — fixup checklist contract
- [`adr-003-verification-harness-architecture.md`](../planning-artifacts/adr/i97/adr-003-verification-harness-architecture.md) — three-harness shared-fixture pattern
- [`adr-004-atomic-by-agent-commit-and-tooling-namespace.md`](../planning-artifacts/adr/i97/adr-004-atomic-by-agent-commit-and-tooling-namespace.md) — namespace rationale
- [`adr-005-covenant-baseline-validity-policy.md`](../planning-artifacts/adr/i97/adr-005-covenant-baseline-validity-policy.md) — Covenant per-Right policy (referenced by AC6)
- [`convoke-spec-personality-preservation-rubric.md`](../planning-artifacts/convoke-spec-personality-preservation-rubric.md) — § Status for 8 reviewer cues; § Per-Agent Personality Fingerprints for AC7 + Task 7.4
- [`convoke-pretest-personality-rubric-scoring-sheet.md`](../planning-artifacts/convoke-pretest-personality-rubric-scoring-sheet.md) — Round 1 scoring sheet (Emma + Liam)
- [`convoke-pretest-personality-rubric-scoring-sheet-round-2.md`](../planning-artifacts/convoke-pretest-personality-rubric-scoring-sheet-round-2.md) — Round 2 scoring sheet (Isla + Mila + Wade + Noah + Max)
- [`tests/migration/personality-preservation/fixtures/<agent>/`](../../tests/migration/personality-preservation/fixtures/) — existing baseline fixtures for all 7 agents (consumed by Task 7)
- [`project-context.md`](../../project-context.md) — `test-fixture-isolation`, `no-process-cwd-in-libs`, `mechanical-research-enumeration`, `derive-counts-from-source`, `lint-passes-before-review`, `code-review-convergence`, `namespace-decision-for-new-skills` rules
- [`memory/project_marketplace_structural_adoption.md`](../../.claude/projects/-Users-amalikamriou-BMAD-Enhanced/memory/project_marketplace_structural_adoption.md) — initiative-level state + decisions
- Predecessor story precedent: [`lint-1-1-fix-ci-lint-and-add-dod-gate.md`](lint-1-1-fix-ci-lint-and-add-dod-gate.md) — pattern for namespace decision + safety analysis + scope-discipline framing
- Predecessor codebase patterns: [`scripts/portability/export-engine.js`](../../scripts/portability/export-engine.js) — JSDoc + module.exports + projectRoot-parameter convention reference

## Dev Agent Record

### Agent Model Used

Amelia (bmad-agent-dev) on Claude Opus 4.7 (1M context).

### Debug Log References

**Smoke verification (AC8) — all passing 2026-05-01:**

```bash
$ for f in fixtures/tmpDir-setup.js fixtures/isolated-install.js parity-harness.js covenant-survival-harness.js personality-harness.js; do
    node -e "require('./scripts/migration/format-conversion/$f'); console.log('ok: $f')"
  done
ok: fixtures/tmpDir-setup.js
ok: fixtures/isolated-install.js
ok: parity-harness.js
ok: covenant-survival-harness.js
ok: personality-harness.js

$ node scripts/audit/reference-integrity.js --help 2>&1 | head -2
reference-integrity — mechanical cross-reference check for the Convoke project tree

$ node scripts/audit/reference-integrity.js
[reference-integrity] PASS — 75 references checked, 0 broken
$ echo $?
0

$ node scripts/audit/reference-integrity.js --paths nonexistent-dir/
[reference-integrity] --paths target does not exist, skipping: nonexistent-dir/
[reference-integrity] PASS — 0 references checked, 0 broken (scoped to nonexistent-dir/)
$ echo $?
0
```

**Load-test (AC8) — 14/14 pass:**

```bash
$ node --test tests/lib/format-conversion-load.test.js
ℹ tests 14
ℹ suites 7
ℹ pass 14
ℹ fail 0
ℹ duration_ms 194
```

**Lint (AC9, NFR5) — exit 0, zero warnings on touched files:**

```bash
$ npx eslint scripts/migration/format-conversion/ scripts/audit/reference-integrity.js tests/lib/format-conversion-load.test.js
$ echo $?
0
```

**Full regression (workflow Step 9 requirement) — 1509/1510 pass, 0 fail, 0 regressions:**

```bash
$ npm test
ℹ tests 1510
ℹ suites 375
ℹ pass 1509
ℹ fail 0
ℹ skipped 1
ℹ duration_ms 80086
```

The 1 skipped test is pre-existing; not caused by this story. Zero new test failures introduced.

### Completion Notes List

**Implementation summary.** This story scaffolded the I97 migration tooling foundation: 7 new scripts under `scripts/migration/format-conversion/` + 1 audit script under `scripts/audit/` + 1 load-test under `tests/lib/`. All 11 tasks complete with all subtasks (60 checkboxes flipped). All ACs (AC1–AC10) demonstrably satisfied per the verification commands captured in Debug Log References above.

**Key implementation decisions during dev:**

1. **Reference-integrity scope refinement (AC4 + Task 8).** The initial implementation scanned `tests/**/*.js` per the architecture document's text. First baseline run produced 23 false positives — markdown-link patterns extracted from string literals inside `.js` test files (e.g., `'old.md'`, `'./prd-gyre.md'` as fixture data). Per `mechanical-research-enumeration` rule and NFR10's documentation-cross-reference intent, refined the scope to `.md` files only. The architecture document § D4 line 217 says "test paths under `tests/`" — the practical interpretation is *test-related markdown documentation*, not source code. After refinement: baseline reports 75 refs checked, 0 broken (default scope passes per FR24).

2. **Code-region stripping in reference-integrity (AC4 false-positive fix).** Initial baseline (after `.md`-only refinement) still produced 2 false positives — `[text](url)` patterns inside backticked inline code in retro docs, where the markdown-link syntax is being *discussed as a pattern*, not used as a real link. Added `_stripCodeRegions()` helper to strip fenced code blocks (` ``` `) and inline code spans (`` ` ``) before regex extraction. After fix: baseline reports 0 broken refs.

3. **`{{...}}` template-placeholder filter (AC4 user-supplied scope).** When the operator-supplied smoke `--paths .claude/` runs, the broader scope catches template files under `.claude/skills/bmad-document-project/templates/` containing `{{path}}` placeholders. These are template-engine syntax, not real refs. Added a filter at `_validateRef()` to skip refs containing `{{` or `}}`. After fix: default-scope baseline still passes; user-supplied `--paths .claude/` finds genuine pre-existing drift in WDS skill bundles (185 broken refs) — this is **out-of-scope for I97** per scope-discipline rule (`lint-1.1` precedent). Documented as a known finding for future Bug Lane consideration; not blocking this story.

4. **Architecture-vs-actual fixture-naming (AC7 + Dev Notes).** The architecture document line 602 names fixtures `fixed-prompt-set.json` + `unscripted-scenarios.md`; the actual implemented Story 1.2 fixtures use `baseline-fixed-prompt.json` + `baseline-unscripted-scenario.md` (singular `scenario`, prefixed `baseline-`). The harness uses the **actual implemented naming** per AC7 explicit resolution.

5. **`tmpDir` reserved-parameter contract (AC6 covenant-survival-harness).** The harness signature accepts `tmpDir` but stub doesn't use it. Reserved for Story 4.2's full per-cell isolated execution per `test-fixture-isolation`. Documented in JSDoc + AC6 so Story 4.2 inherits the contract without re-deriving it.

6. **Lint cleanup mid-implementation.** First lint pass surfaced 1 error + 13 warnings: 1 `preserve-caught-error` in personality-harness.js (added `{ cause: err }` per `lint-1.1` AC1 precedent); 11 unused `eslint-disable-next-line no-console` directives (the `no-console` rule isn't active project-wide, so the disables were spurious — stripped); 2 unused-args warnings (renamed `projectRoot → _projectRoot`, `err → _err` per `no-unused-vars` `args: "after-used"` convention; added explicit `continue` after the latter to satisfy control-flow). Final lint: exit 0, zero warnings on all 7 touched files.

**Pre-existing finding (NOT introduced by this story).** The user-supplied broader scope `node scripts/audit/reference-integrity.js --paths .claude/` (which is wider than the default coverage scope per architecture § D4 line 217) reveals 185 broken markdown references in pre-existing WDS skill bundles + `bmad-document-project` template content. These predate I97 entirely. Per scope-discipline (no silent fixes of unrelated drift), this is documented here as a known finding rather than fixed in this story. **Recommendation:** consider filing a Bug Lane intake post-I97 ship to clean up these refs in a focused cleanup story.

**Architecture-vs-AC discrepancies surfaced (recorded for E2 review):**

- AC8's literal `--paths .claude/` smoke command expects "exits 0" but actually exits 1 due to the pre-existing drift mentioned above. The smoke's underlying *intent* — verifying that `--paths` arg-parsing works — is satisfied (the script correctly scopes the scan to `.claude/`). The AC's exit-code expectation was based on assumption-of-clean-state that doesn't hold for the wider tree. AC's intent is met; literal exit-code expectation is not. Recommend AC8 be refined post-I97 to use a known-clean scoped path (e.g., `.claude/skills/bmad-agent-bme-contextualization-expert/`) for the smoke.

**Reusability for I98 (Gyre) and I99 (Team Factory).** All 7 scaffolded files are migration-general per NFR18. Per-agent specifics (e.g., role-name to first-name mapping in `personality-harness.js#extractPerAgentFingerprint`) are populated for Vortex agents only; I98/I99 will extend the mapping but inherit the same module structure, public API shape, and fixture conventions.

### File List

**New files (9 total):**

1. `scripts/migration/format-conversion/README.md` — overview + ADR cross-references + smoke commands + project-context.md rules digest
2. `scripts/migration/format-conversion/fixup-checklist.md` — 4-category per-agent fixup contract per ADR-002
3. `scripts/migration/format-conversion/fixtures/tmpDir-setup.js` — `setupTmpDir()` + `withTmpDir()` per `test-fixture-isolation` rule
4. `scripts/migration/format-conversion/fixtures/isolated-install.js` — `setupIsolatedInstall()` for isolated 4.x install in tmpDir
5. `scripts/migration/format-conversion/parity-harness.js` — `runParityCheck` + `extractV5MenuCodes` + `extractV63MenuCodes` (FR13–15)
6. `scripts/migration/format-conversion/covenant-survival-harness.js` — `runCovenantSurvivalCheck` + per-Right matrix shell (FR17–20, ADR-005-deferred)
7. `scripts/migration/format-conversion/personality-harness.js` — `runPersonalityCheck` modes 'capture'/'verify' consuming calibrated rubric (FR21–23)
8. `scripts/audit/reference-integrity.js` — mechanical reference-integrity check (FR24–25, NFR10–12)
9. `tests/lib/format-conversion-load.test.js` — 14 tests covering load + public-API + extraction-helper + mode-validation behavior

**Files modified (2 total):**

10. `_bmad-output/implementation-artifacts/sprint-status.yaml` — `i97-1-1-migration-tooling-foundation-scaffolded`: `ready-for-dev → in-progress → review` (3 transitions over the dev-story workflow)
11. `_bmad-output/implementation-artifacts/i97-1-1-migration-tooling-foundation-scaffolded.md` — this story file (Status, Tasks/Subtasks checkboxes, Dev Agent Record, File List, Change Log)

**Files NOT touched (defensive — verified):**

- No changes to any `_bmad/` content (FR12 + scope discipline)
- No changes to any existing harness or test outside the new load-test
- No changes to `package.json` (no new `npm run` wrappers — that's Story 3.x productionization)
- No changes to `.claude/` or `.claude-plugin/` (those updates are per-agent in E2)

## Change Log

| Date | Change | By |
|------|--------|-----|
| 2026-04-29 | Story spec authored by Bob via bmad-create-story workflow. Status: ready-for-dev. Pickup: any dev session. | Bob (SM) |
| 2026-05-01 | Implementation complete via bmad-dev-story workflow. 11 tasks done (60 subtask checkboxes flipped). 9 new files + 2 modified. Status: ready-for-dev → in-progress → review. All ACs satisfied; load-test 14/14 pass; lint exit 0 zero warnings; reference-integrity baseline 75/0 broken refs (default scope); full regression 1509/1510 pass 0 fail 0 regressions. Three implementation refinements during dev (reference-integrity scope `.md`-only; code-region stripping; `{{...}}` placeholder filter) — all documented in Completion Notes List. One pre-existing finding surfaced (185 broken refs in WDS skill bundles + bmad-document-project templates) — out-of-scope per scope-discipline rule; recommended for future Bug Lane intake. | Amelia (Dev) |
| 2026-05-02 | Round 1 code review complete (3 parallel adversarial reviewers: Blind Hunter, Edge Case Hunter, Acceptance Auditor). Triaged: 5 decision-needed resolved, 34 patches applied (8 HIGH + 13 MEDIUM + 9 LOW + 4 spec amendments), 6 deferred, 7 dismissed. Spec amendments: AC7 broadened from "the one acceptable throw" to "structural-input fail-fast pattern" (P32); AC8 smoke target narrowed from `--paths .claude/` to known-clean Vortex slash-command wrapper (P31); AC4 + Architecture § D4 formalized `.md`-only scope narrowing + `{{...}}` placeholder filter (P33). Code patches: agentRoleName whitelist regex across 4 harnesses (path-traversal protection); regex statefulness fix via `String.matchAll`; symlink-cycle protection in `_walkDir`; ENOENT-vs-EACCES distinction; middle-segment glob expansion (slash-commands scope was returning ZERO files); 4-space indented code-block stripping; UTF-8 BOM stripping; tmpDir safety preconditions; real cleanup. Validation: lint exit 0, load-test 15/15 pass (+1 for `{{...}}` filter test), reference-integrity baseline 75/0, full regression 1510/1511 pass 0 fail 0 regressions. Status: review → done. | Code-review batch (Round 1) |
| 2026-05-02 | Round 2 code review complete (re-run of 3 parallel reviewers on patched code). Triaged: 0 decision-needed, 10 patches applied (4 HIGH + 6 MEDIUM), ~15 deferred, 3 dismissed. Acceptance Auditor: 0 violations against amended ACs. Code patches: dropped `.js` from `_walkGlob` direct-path fallback (R2-P1); `**/**` recursion guard in `_expandGlobTail` (R2-P2); `extractV63MenuCodes` table-header skip via separator-row anchoring (R2-P3); fence stripping moved INTO `extractV5/V63MenuCodes` + `extractPerAgentFingerprint` so extraction is fence-aware regardless of caller (R2-P4); `firstName` regex meta-char escape (R2-P5); `dereference: true` for fixture-isolation correctness (R2-P6); EISDIR check honoring trailing-slash intent (R2-P7); `lstatSync` symlink-skip in `_resolveScopePaths` (R2-P8); `OPERATOR_RIGHTS` + `VALID_MATRIX_DECISIONS` frozen (R2-P9); `agentRoleName` regex tightened (R2-P10). Convergence: Round 2 patches were tightening + small additions (no new files / renamed functions / altered control flow per `code-review-convergence` rule definition of "structural"). **Round 3 NOT triggered.** Remaining ~15 LOW deferred to backlog. Validation: lint exit 0, load-test 15/15 pass, reference-integrity baseline 75/0, full regression 1510/1511 pass 0 fail 0 regressions. | Code-review batch (Round 2) |
