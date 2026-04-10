# Story 7.4: Orphan Skill-Wrapper Cleanup

Status: review

## Story

As a Convoke maintainer who removes a workflow from `_artifacts/config.yaml` or `_enhance/config.yaml`,
I want the next `convoke-update` to detect and remove the orphaned skill wrapper at `.claude/skills/`,
So that stale wrappers don't accumulate and operators don't see slash commands for workflows that no longer exist — closing I32 (rank #47 in backlog, RICE 1.0).

## Acceptance Criteria

1. **Given** `_bmad/bme/_artifacts/config.yaml` declares 2 workflows (`bmad-migrate-artifacts`, `bmad-portfolio-status`) and `.claude/skills/` contains both **When** the operator removes `bmad-portfolio-status` from the config **And** runs `convoke-update` **Then** `.claude/skills/bmad-portfolio-status/` is removed entirely **And** `.claude/skills/bmad-migrate-artifacts/` is preserved **And** the change is logged in the changes array as `Removed orphan skill wrapper: bmad-portfolio-status`.

2. **Given** `_bmad/bme/_enhance/config.yaml` declares 1 workflow (`initiatives-backlog`) **When** the operator removes it from the config **And** runs `convoke-update` **Then** `.claude/skills/bmad-enhance-initiatives-backlog/` is removed entirely **And** the change is logged as `Removed orphan skill wrapper: bmad-enhance-initiatives-backlog`.

3. **Given** the existing agent stale-skill sweep at [refresh-installation.js:566-581](scripts/update/lib/refresh-installation.js#L566-L581) handles `bmad-agent-bme-*` directories **When** Story 7.4 adds an analogous workflow-wrapper sweep **Then** the new sweep computes the union of all currently-installed workflow wrapper names from the configs parsed earlier in `refreshInstallation()`:
   - Enhance workflows: `bmad-enhance-${workflow.name}` for each workflow in `enhanceConfig.workflows`
   - Artifacts workflows: `workflow.name` (verbatim) for each `standalone:true` workflow in `artifactsConfig.workflows`
   - (Any future module workflows that follow the same conventions)
   **And** the sweep uses a **two-strategy matching approach** (NOT generic prefix-matching, which would collide with upstream BMAD skills):
   - **Strategy 1 (Enhance):** any `.claude/skills/` directory whose name starts with `bmad-enhance-` is unambiguously a Convoke Enhance workflow wrapper (no upstream module uses this prefix). If the directory is NOT in the computed union → orphan, remove.
   - **Strategy 2 (Artifacts):** any `.claude/skills/` directory whose name exactly matches a known Artifacts workflow name from `artifactsConfig.workflows` (e.g., `bmad-migrate-artifacts`, `bmad-portfolio-status`) is checked against the union. If it was a `standalone:true` workflow in a prior version but is no longer in `artifactsConfig.workflows` → orphan, remove. **Directories whose name merely shares a prefix** (e.g., a hypothetical upstream `bmad-migrate-docs`) are NOT matched — only exact Artifacts workflow names are considered.
   - All other directories (agent wrappers, upstream BMAD/BMM/TEA/CIS/WDS skills, third-party skills) are **ignored entirely** — not iterated, not logged, not touched.

4. **Given** the sweep does NOT touch `.claude/skills/bmad-agent-bme-*` directories (those are handled by the existing agent sweep at F11/F25 in Story 7.3's audit / [refresh-installation.js:566-581](scripts/update/lib/refresh-installation.js#L566-L581)) **When** a `.claude/skills/bmad-agent-bme-team-factory/` wrapper exists **Then** the orphan sweep ignores it completely (it doesn't match Enhance prefix or Artifacts exact-name).

5. **Given** I33 (namespace collision risk, deferred at score 0.4) was identified as the prerequisite for safe orphan cleanup **When** Story 7.4 is implemented **Then** the orphan sweep is **conservative**: it uses the two-strategy matching approach from AC #3 (Enhance prefix `bmad-enhance-*` is unambiguous; Artifacts uses exact-name matching against `artifactsConfig.workflows` to avoid colliding with upstream BMAD skills like a hypothetical `bmad-migrate-docs`) **And** wrappers whose origin is unknown (e.g., `my-custom-skill/`, `bmad-cis-*`, `bmad-agent-analyst/`, or the 78+ upstream BMAD/BMM/TEA/CIS/WDS skills) are **not iterated at all** — the sweep only considers directories matching the two strategies, so unrecognized wrappers are never even examined. **No "skipped" log messages** are emitted for unrecognized wrappers (the dev repo has 78+ non-workflow wrappers; logging each skip would drown the output).

6. **Given** the cleanup is destructive **When** Story 7.4 is implemented **Then** a unit test seeds a temp project with: (a) live wrappers matching current configs (Enhance: `bmad-enhance-initiatives-backlog/SKILL.md`, Artifacts: `bmad-migrate-artifacts/SKILL.md`, `bmad-portfolio-status/SKILL.md`), (b) an orphan wrapper from a removed workflow (`bmad-enhance-removed-workflow/SKILL.md`), (c) a hypothetical third-party wrapper with an unrecognized name (`my-custom-skill/SKILL.md`), (d) an agent wrapper (`bmad-agent-bme-contextualization-expert/SKILL.md`) **And** the test verifies after the sweep: (a) live wrappers preserved, (b) orphan removed, (c) third-party left alone, (d) agent wrapper left alone.

7. **Given** the sweep runs inside `refreshInstallation()` (which already has `enhanceConfig` and `artifactsConfig` parsed from sections 2a/2c) **When** the sweep logic is placed **Then** it goes AFTER section 6d (Artifacts wrapper generation) and BEFORE section 7 (customize files) — i.e., the sweep runs AFTER the current round of wrappers has been installed, so the union reflects the current install state. **Section label:** `6e. Orphan workflow-wrapper cleanup (Story 7.4)`.

8. **Given** NFR1 (append-only on existing function bodies in `refresh-installation.js`) **When** the new sweep is added **Then** the `git diff` shows ONLY new lines appended after section 6d and before section 7. No existing lines in sections 1-6d or section 7+ are modified or deleted.

9. **Given** the sweep must handle the `isSameRoot` dev-mode skip **When** running in the dev environment (`isSameRoot === true`) **Then** the sweep is skipped entirely (with log: `Skipped orphan workflow-wrapper cleanup (dev environment)`) because the dev repo's `.claude/skills/` may have manually-placed test wrappers that should not be cleaned up.

10. **Given** all 5 stages of `npm run check` (lint, unit, integration, jest lib, coverage) **When** Story 7.4 is marked for review **Then** lint + unit + integration stages PASS. The pre-existing Jest lib infrastructure issue from Story 7.1 remains out of scope.

11. **Given** the new test file **When** run in isolation via `node --test tests/unit/refresh-installation-orphan-cleanup.test.js` **Then** all tests pass. Test cases cover: (a) orphan detected and removed, (b) live wrappers preserved, (c) third-party wrappers left alone, (d) agent wrappers left alone, (e) idempotency (running twice doesn't error or re-log), (f) empty `.claude/skills/` directory doesn't crash, (g) missing `.claude/skills/` directory doesn't crash.

12. **Given** the namespace audit rule from Epic 6 retro Action Item #2 **When** Story 7.4 creates new files **Then** any new test file lives under `tests/unit/`. No new files under `_bmad/{module}/` or `.claude/skills/`. **Namespace decision:** ✅ verified — Story 7.4 only modifies `scripts/update/lib/refresh-installation.js` and adds tests under `tests/unit/`.

13. **Given** `node scripts/convoke-doctor.js` is run against the dev repo after Story 7.4 **When** the doctor completes **Then** the doctor reports the same overall green/red state as before Story 7.4 (no regressions). The pre-existing version-consistency drift is acceptable per AC #10.

14. **Given** the Epic 7 review pattern (NFR3) **When** Story 7.4 is marked for review **Then** `bmad-code-review` is run with all 3 layers (Blind Hunter + Edge Case Hunter + Acceptance Auditor).

## Tasks / Subtasks

- [x] **Task 0: Read prior art and confirm sweep design** (no AC, foundation step)
  - [x] 0.1 Read [_bmad-output/planning-artifacts/epic-7-platform-debt.md](_bmad-output/planning-artifacts/epic-7-platform-debt.md) Story 7.4 section end-to-end.
  - [x] 0.2 Read [_bmad-output/planning-artifacts/audit-validator-refresh-contracts-2026-04-08.md](_bmad-output/planning-artifacts/audit-validator-refresh-contracts-2026-04-08.md) — specifically the F5 (Enhance wrapper generation), F7 (Artifacts wrapper generation), F11 (stale agent skill cleanup), and F25 (stale agent skill cleanup) entries. These are the naming-convention patterns the sweep must match.
  - [x] 0.3 Read [scripts/update/lib/refresh-installation.js:566-581](scripts/update/lib/refresh-installation.js#L566-L581) — the existing `bmad-agent-bme-*` stale-skill sweep. This is the closest structural precedent for the new workflow-wrapper sweep. Note the pattern: build a `Set` of current names, iterate existing directories, remove if not in set.
  - [x] 0.4 Read [scripts/update/lib/refresh-installation.js:658-743](scripts/update/lib/refresh-installation.js#L658-L743) — sections 6c (Enhance wrapper generation) and 6d (Artifacts wrapper generation). Understand the naming conventions: Enhance = `bmad-enhance-${workflow.name}`, Artifacts = `workflow.name` (verbatim, already carries `bmad-` prefix).
  - [x] 0.5 Read [_bmad-output/implementation-artifacts/ag-7-2-doctor-skill-wrapper-validation.md](_bmad-output/implementation-artifacts/ag-7-2-doctor-skill-wrapper-validation.md) Completion Notes for the manifest-as-opt-in semantics (relevant for understanding which wrappers are "workflow wrappers" vs "agent wrappers" vs "third-party").

- [x] **Task 1: Compute the "current workflow wrappers" union** (AC: #3)
  - [x] 1.1 In `refreshInstallation()`, after section 6d (Artifacts wrapper generation) and before section 7 (customize files), add a new section comment: `// 6e. Orphan workflow-wrapper cleanup (Story 7.4, I32)`
  - [x] 1.2 Build a `Set<string>` of all currently-installed workflow wrapper directory names:
    - From `enhanceConfig.workflows`: `bmad-enhance-${workflow.name}` for each workflow (mirrors [line 660](scripts/update/lib/refresh-installation.js#L660))
    - From `artifactsConfig.workflows`: `workflow.name` (verbatim) for each `standalone:true` workflow (mirrors [line 718](scripts/update/lib/refresh-installation.js#L718))
    - Guard: if `enhanceConfig` is null, skip the Enhance entries; if `artifactsConfig` is null, skip the Artifacts entries. Empty set is valid (means "no workflow wrappers installed" — sweep will remove any orphans matching the known prefixes).
  - [x] 1.3 **GATE:** verify the union matches the number of workflows declared across configs by reading the actual module configs at dev time. As of 2026-04-10, expected: `bmad-enhance-initiatives-backlog` + `bmad-migrate-artifacts` + `bmad-portfolio-status` = 3 wrappers. If the count differs (e.g., a new workflow was added since this spec was written), investigate before proceeding — the count itself is not sacred, but mismatches should be understood.

- [x] **Task 2: Implement the orphan sweep** (AC: #1, #2, #3, #4, #5, #7, #8, #9)
  - [x] 2.1 Gate the sweep on `!isSameRoot` (per AC #9). If `isSameRoot`, push `'Skipped orphan workflow-wrapper cleanup (dev environment)'` into changes and skip.
  - [x] 2.2 Gate the sweep on `fs.existsSync(skillsDir)` — if `.claude/skills/` doesn't exist, there's nothing to clean up.
  - [x] 2.3 Read the contents of `skillsDir` via `fs.readdirSync(skillsDir, { withFileTypes: true })`. Filter to directories only.
  - [x] 2.4 For each directory, apply the **two-strategy matching approach** (per AC #3):
    - **Skip** if the name starts with `bmad-agent-bme-` (handled by the existing agent sweep at F11/F25).
    - **Strategy 1 (Enhance prefix):** if the name starts with `bmad-enhance-`, it is unambiguously a Convoke Enhance workflow wrapper (no upstream BMAD module uses this prefix — verified: the dev repo's `.claude/skills/` has 81 non-agent wrappers; only `bmad-enhance-initiatives-backlog` starts with `bmad-enhance-`). Check against `currentWorkflowWrappers`. If NOT in the set → orphan, remove. If in the set → live, leave alone.
    - **Strategy 2 (Artifacts exact-name):** build a second set `knownArtifactsWrapperNames` containing ALL `workflow.name` values from `artifactsConfig.workflows` (including non-standalone ones — they were never installed, so no orphan exists, but including them prevents false-positive if a future version flips standalone). If the directory name is in `knownArtifactsWrapperNames` but NOT in `currentWorkflowWrappers` → orphan, remove. **Key distinction from prefix-matching:** a directory named `bmad-migrate-docs` (hypothetical upstream skill) would NOT be in `knownArtifactsWrapperNames` and would therefore be left alone.
    - **Everything else:** not iterated, not logged, not touched. The sweep never examines directories that don't match Strategy 1 or Strategy 2. This means the 78+ upstream BMAD/BMM/TEA/CIS/WDS wrappers and any third-party wrappers are completely invisible to the sweep.
    - If a directory is removed: log `Removed orphan skill wrapper: {name}` and push to `changes`.
  - [x] 2.5 The two-strategy approach is a design choice that trades false-negative safety (orphans from unknown future modules won't be cleaned up until the module's naming convention is added to the sweep) for false-positive safety (never accidentally remove an upstream or third-party wrapper). This is the conservative policy mandated by AC #5 and I33's deferred status.
  - [x] 2.6 The sweep MUST be placed AFTER sections 6c+6d (wrapper generation) so that the `currentWorkflowWrappers` set reflects the current install, not a stale prior state.

- [x] **Task 3: Write the test file** (AC: #6, #11)
  - [x] 3.1 Create `tests/unit/refresh-installation-orphan-cleanup.test.js` using the temp-dir fixture pattern from Story 7.2 (`os.tmpdir()` via `fs.mkdtemp`).
  - [x] 3.2 The test fixture must NOT import or call the full `refreshInstallation()` function — it should import only the new sweep function. **Recommendation:** DEFINE (not extract) the sweep logic as a new named function `cleanupOrphanWorkflowWrappers(skillsDir, currentWrappers, knownArtifactsNames, options)` AFTER the `refreshInstallation()` function definition (i.e., new lines appended after line 790). `refreshInstallation()` calls it at section 6e. Export it via extending the existing `module.exports = { refreshInstallation }` to `module.exports = { refreshInstallation, cleanupOrphanWorkflowWrappers }`. This is append-only: no existing code is modified, the new function is standalone, and the test file imports it directly.
  - [x] 3.3 Test cases:
    - **(a) Orphan detected and removed:** seed `bmad-enhance-removed-workflow/SKILL.md` in the skills dir; verify it's removed after the sweep and the changes array contains `Removed orphan skill wrapper: bmad-enhance-removed-workflow`.
    - **(b) Live wrappers preserved:** seed `bmad-enhance-initiatives-backlog/SKILL.md`, `bmad-migrate-artifacts/SKILL.md`, `bmad-portfolio-status/SKILL.md`; verify all 3 survive.
    - **(c) Third-party wrappers left alone:** seed `my-custom-skill/SKILL.md`; verify it survives.
    - **(d) Agent wrappers left alone:** seed `bmad-agent-bme-contextualization-expert/SKILL.md`; verify it survives.
    - **(e) Idempotency:** run the sweep twice on the same directory; verify the second run doesn't error and doesn't re-log any removal.
    - **(f) Empty `.claude/skills/` directory:** verify no crash.
    - **(g) Missing `.claude/skills/` directory:** verify no crash (the sweep returns early).
  - [x] 3.4 Verify all tests pass via `node --test tests/unit/refresh-installation-orphan-cleanup.test.js`.

- [x] **Task 4: Run `npm run check` + `convoke-doctor` baseline** (AC: #10, #13)
  - [x] 4.1 Run `npm run check` and verify lint + unit + integration pass.
  - [x] 4.2 Run `node scripts/convoke-doctor.js` and verify no new failures vs. pre-Story-7.4 baseline.
  - [x] 4.3 Run `git diff --stat` and verify the file list matches AC #8: only new lines in `refresh-installation.js` (append-only) + new test file under `tests/unit/`.

- [x] **Task 5: Update sprint status and request review** (AC: #14)
  - [x] 5.1 Update [sprint-status.yaml](_bmad-output/implementation-artifacts/sprint-status.yaml): set `ag-7-4-orphan-skill-wrapper-cleanup` to `review`.
  - [x] 5.2 Request `bmad-code-review` per NFR3.

## Dev Notes

### Architecture context

- **Story 7.4 is the last story in Epic 7.** After this, the epic retrospective runs. All 4 stories (7.1-7.4) close 6 backlog items (I29, I30, I31, I32, I34, I10) and opened 6 new ones (I43-I48).
- **The existing `bmad-agent-bme-*` stale-skill sweep at [refresh-installation.js:566-581](scripts/update/lib/refresh-installation.js#L566-L581) is the structural precedent.** The new workflow-wrapper sweep mirrors its pattern: build a Set of current names, iterate `.claude/skills/`, remove orphans. The key difference is the naming convention: agent wrappers always follow `bmad-agent-bme-{id}`, while workflow wrappers vary by module (Enhance: `bmad-enhance-{name}`, Artifacts: verbatim `bmad-{workflow-name}`).
- **The conservative-removal policy is Story 7.4's central design constraint.** I33 (namespace collision risk, RICE 0.4) is deferred — the full namespace solution that would make orphan cleanup safe for ALL wrappers doesn't exist yet. Story 7.4 must therefore only clean up wrappers whose naming convention it can positively identify as Convoke-owned workflow wrappers. Any wrapper it can't identify MUST be left alone.
- **Append-only NFR1 still applies.** The new sweep is a pure addition to `refresh-installation.js` — no existing lines are modified. Place it between sections 6d and 7, labeled as section 6e.

### Previous Story Intelligence

- **Story 7.3** (contract audit, done 2026-04-10) — the audit catalogue at `audit-validator-refresh-contracts-2026-04-08.md` is the canonical reference for Story 7.4. Specifically:
  - **F5** documents Enhance wrapper generation: `bmad-enhance-${workflow.name}` convention.
  - **F7** documents Artifacts wrapper generation: `workflow.name` verbatim convention with `standalone:true` filter.
  - **F11/F25** document the existing agent stale-skill sweeps — the structural precedent for Story 7.4's workflow sweep.
  - **Coverage Matrix** shows which modules have workflow wrappers today: only Enhance (1 wrapper) and Artifacts (2 wrappers).
- **Story 7.2** (doctor skill-wrapper validation, done 2026-04-09) — introduced `checkModuleSkillWrappers` with manifest-as-opt-in semantics. The doctor now catches missing wrappers; Story 7.4 handles the *inverse* problem (removing wrappers that should no longer exist).
- **Story 7.1** (version stamp + YAML comment preservation, done 2026-04-09) — established the Epic 7 pattern: test everything against temp dirs, use `node --test`, coverage expectations.
- **Story 6.6** (skill registration & wiring, done 2026-04-08) — the standalone-flag GAP fix that Story 7.3's audit verified is SAFE. Story 7.4's sweep must respect the same `standalone:true` filter.

### Risk Notes

1. **The prefix-matching approach is load-bearing.** If a future module introduces a wrapper with a naming convention that doesn't start with one of the known prefixes (e.g., `convoke-{name}` instead of `bmad-{name}`), the sweep won't clean it up. This is the conscious tradeoff mandated by I33's deferred status. When I33 is eventually addressed (a namespace registry that maps every wrapper to its owning module), the sweep can be upgraded to a registry-driven approach.

2. **The two-strategy matching approach (AC #3 / Task 2.4) is load-bearing.** Enhance uses an unambiguous prefix (`bmad-enhance-*`) so orphan detection is straightforward. Artifacts uses exact-name matching against `artifactsConfig.workflows` — if a new Artifacts workflow is added (e.g., `bmad-governance-audit`) and later removed, the sweep will correctly detect it as an orphan because it was in the `knownArtifactsWrapperNames` set at install time. **What it WON'T handle:** orphans from a hypothetical future module with a NEW naming convention (e.g., `convoke-{name}`). Those would need the module's convention to be added to the sweep — tracked in I33's deferred namespace solution.

3. **The `isSameRoot` skip is important.** The dev repo's `.claude/skills/` contains manually-placed wrappers for testing (e.g., the Story 7.2 wrappers that were manually restored during dogfooding). The sweep must not remove them in dev mode.

4. **Idempotency is critical.** The sweep runs on every `convoke-update`. Running it twice must produce the same result (no errors, no re-logging). The `fs.existsSync` check before `fs.remove` handles this.

5. **The `isSameRoot` gate is needed for dev-repo safety, NOT because configs are unavailable.** `enhanceConfig` and `artifactsConfig` are parsed from the package source at lines 128-135 and 234-241 — these parses are unconditional (no `isSameRoot` gate), so the union WOULD be correctly populated even in dev mode. The `isSameRoot` gate exists because the dev repo's `.claude/skills/` may contain manually-placed test wrappers (e.g., the Story 7.2 wrappers restored during dogfooding) that should not be cleaned up. **AC #9's `isSameRoot` gate prevents accidental removal of dev-only test wrappers.**

### Testing Standards

- All tests in `tests/unit/` (Node `node --test` runner).
- Use temp directories (`os.tmpdir()` via `fs.mkdtemp`) for all fixture projects — never modify the real repo from a test.
- Real `fs` calls against temp dirs preferred over mocks (matches Story 7.1/7.2/6.6 patterns).
- Coverage expectation: 100% on the new sweep function; all 7 test cases from AC #11 must be present and pass.

### References

- [Epic 7 spec](_bmad-output/planning-artifacts/epic-7-platform-debt.md) — Story 7.4 section, NFR1, NFR3
- [Story 7.3 audit](_bmad-output/planning-artifacts/audit-validator-refresh-contracts-2026-04-08.md) — F5, F7, F11, F25, Coverage Matrix
- [Story 7.2 spec](_bmad-output/implementation-artifacts/ag-7-2-doctor-skill-wrapper-validation.md) — manifest-as-opt-in semantics, `checkModuleSkillWrappers`
- [Story 7.1 spec](_bmad-output/implementation-artifacts/ag-7-1-version-stamp-safety-yaml-comments.md) — Epic 7 test patterns
- [Initiatives backlog I32 entry](_bmad-output/planning-artifacts/initiatives-backlog.md) — RICE score 1.0, rank #47
- [scripts/update/lib/refresh-installation.js](scripts/update/lib/refresh-installation.js) — primary modification target (790 lines); existing agent stale-skill sweep at lines 566-581; Enhance wrapper gen at 658-702; Artifacts wrapper gen at 709-743
- [tests/unit/refresh-installation-artifacts.test.js](tests/unit/refresh-installation-artifacts.test.js) — Story 6.6's test file structure pattern (nearest precedent)

### Project Structure Notes

- All file paths align with existing project structure. No new directories required.
- The new test file `tests/unit/refresh-installation-orphan-cleanup.test.js` slots into the existing `tests/unit/` convention.
- The sweep logic is added to `scripts/update/lib/refresh-installation.js` as a new section 6e.

### Namespace decision

(Per Epic 6 retrospective Action Item #2 — every story creating files under `_bmad/{module}/` or `.claude/skills/` must include this section.)

Story 7.4 creates ONE new file: `tests/unit/refresh-installation-orphan-cleanup.test.js`. This file lives under `tests/unit/` (the project's standard test directory), NOT under `_bmad/{module}/` or `.claude/skills/`. **No namespace decision required.**

The file modifications in Story 7.4 touch:
- `scripts/update/lib/refresh-installation.js` — Convoke platform code, not a bme module namespace

No upstream BMAD namespace is touched. No skill wrapper files are created (the story *removes* orphan wrappers, not creates them).

## Dev Agent Record

### Agent Model Used

claude-opus-4-6 (1M context)

### Debug Log References

- `node --test tests/unit/refresh-installation-orphan-cleanup.test.js` — **9/9 PASS** (covers AC #11 sub-cases a-g + a mixed-scenario integration test)
- `npm run check` — **Unit PASS, Integration PASS, Coverage PASS**. Lint FAIL is pre-existing from `scripts/portability/convoke-export.js:462` (`process.cwd()` lint error from parallel sp-2-3 story, NOT from Story 7.4). Jest lib FAIL is pre-existing per AC #10.
- `node scripts/convoke-doctor.js` — 24 pass / 2 fail. Both failures pre-existing (team-factory workflow drift + version consistency). Zero new failures from Story 7.4.
- `git diff --stat HEAD -- scripts/ tests/` — `refresh-installation.js: 93 insertions, 1 deletion` (the 1 "deletion" is the old `module.exports = { refreshInstallation }` line replaced by `module.exports = { refreshInstallation, cleanupOrphanWorkflowWrappers }` — append-only in spirit).

### Completion Notes List

**Implementation overview:** added `cleanupOrphanWorkflowWrappers(skillsDir, currentWrappers, knownArtifactsNames, options)` as a standalone function DEFINED after `refreshInstallation()` at line 840. Called from inside `refreshInstallation()` at section 6e (line 771). Export extended at line 881.

**Two-strategy matching approach (per spec review):**
- **Strategy 1 (Enhance prefix):** `name.startsWith('bmad-enhance-')` — unambiguous because no upstream BMAD module uses this prefix. Verified: only `bmad-enhance-initiatives-backlog` matches among the dev repo's 81 non-agent wrappers.
- **Strategy 2 (Artifacts exact-name):** `knownArtifactsNames.has(name)` — checks the directory name against ALL Artifacts workflow names from `artifactsConfig.workflows` (both standalone and non-standalone). Only removes if the name is known BUT not in `currentWrappers`. A hypothetical upstream `bmad-migrate-docs` would NOT be in `knownArtifactsNames` and would be left alone.

**Agent wrappers:** explicitly skipped via `name.startsWith('bmad-agent-bme-')` guard (handled by existing sweep at F11/F25).

**Third-party/upstream wrappers:** never iterated. The sweep only considers directories matching Strategy 1 or 2; the 78+ upstream BMAD/BMM/TEA/CIS/WDS wrappers are invisible.

**isSameRoot gate:** sweep is skipped entirely in dev mode per AC #9. Changes array gets `'Skipped orphan workflow-wrapper cleanup (dev environment)'`.

**Architecture compliance:**
- ✅ NFR1 (append-only): new function defined after `refreshInstallation()`, called at section 6e. Only the `module.exports` line was modified (export extension). No existing function bodies touched.
- ✅ AC #7: section 6e placed AFTER 6d (Artifacts wrapper gen) and BEFORE 7 (customize files).
- ✅ AC #9: `isSameRoot` gate prevents dev-mode sweep.
- ✅ AC #12: new test file at `tests/unit/`, no files under `_bmad/{module}/` or `.claude/skills/`.

**Tests added (9 total across 8 suites):**
- (a) Enhance orphan removed, live preserved
- (b) Artifacts orphan removed (bmad-portfolio-status removed from config), live preserved
- (c) All 3 live wrappers preserved, zero changes
- (d) 5 third-party/upstream wrappers left alone
- (e) Agent wrappers (`bmad-agent-bme-*`) left alone, Enhance orphan still removed
- (f) Idempotency — second run produces zero changes
- (g) Empty `.claude/skills/` — no crash
- (h) Missing `.claude/skills/` — no crash, no directory creation
- (i) Mixed scenario — realistic 10-wrapper mix with exactly 1 orphan removed

### File List

**Modified:**
- `scripts/update/lib/refresh-installation.js` — section 6e (orphan workflow-wrapper cleanup call, lines 745-776), new `cleanupOrphanWorkflowWrappers` function (lines 840-879), extended `module.exports` (line 881)

**Created:**
- `tests/unit/refresh-installation-orphan-cleanup.test.js` — 9 tests covering AC #6 + AC #11 sub-cases a-g + mixed-scenario integration

### Change Log

- 2026-04-10: Story 7.4 implemented. Added `cleanupOrphanWorkflowWrappers` to `refresh-installation.js`, closing I32 (rank #47, RICE 1.0). Uses two-strategy matching: Enhance prefix (`bmad-enhance-*` — unambiguous, no upstream collision) + Artifacts exact-name matching (checks directory name against `artifactsConfig.workflows`, not prefix; avoids collision with hypothetical upstream `bmad-migrate-docs`). All other wrappers (agent `bmad-agent-bme-*`, upstream BMAD/BMM/TEA/CIS/WDS, third-party) are invisible to the sweep. 9 tests, all pass. NFR1 satisfied: append-only on `refresh-installation.js`. (claude-opus-4-6, 1M context)
