---
initiative: convoke
artifact_type: story
qualifier: v63-3-5-platform-adapter-batch-validation
created: '2026-04-25'
schema_version: 1
epic: v63-epic-3
---

# Story 3.5: Platform adapter batch validation

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

**Epic:** [Epic 3 — Discover via BMAD Marketplace](../planning-artifacts/convoke-epic-bmad-v6.3-adoption.md#epic-3-discover-via-bmad-marketplace)
**Sprint:** 4 (WS2/P23 marketplace stream — final story)
**FR coverage:** FR25 (Tier 1 batch export passes structural validation; 3 spot-check skills × 3 platforms = 9 manual smoke checks proving "Convoke ships everywhere" beyond the single-skill EXP3 result).
**NFR coverage:** none beyond inherited tier classification (NFR15 — `_bmad/_portability/`).
**Failure modes addressed:** none new — extends the EXP3 single-skill GO decision to batch coverage.

**Upstream dependencies:**
- **EXP3 (2026-04-12, GO/PASS)** authored on `bmad-cis-agent-brainstorming-coach` (Carson) — proved the single-skill round-trip across all 3 adapter platforms ([`convoke-note-exp3-platform-agnostic-smoke-test.md`](../planning-artifacts/convoke-note-exp3-platform-agnostic-smoke-test.md)). Story 3.5 is the BATCH expansion.
- **Existing portability infrastructure** (Sprint 2/4/5 ports skill plus prior Convoke work):
  - `scripts/portability/convoke-export.js` — `convoke-export --tier 1` batch CLI (already exists; bin entry in `package.json:37`).
  - `scripts/portability/validate-exports.js` — structural validator with `MANUAL_SMOKE_SKILLS` const declaring the 3 spot-check candidates: `bmad-brainstorming` (Carson), `bmad-agent-architect` (Winston), `bmad-tea` (Murat).
  - `scripts/portability/generate-adapters.js` — already produces 3 adapter formats per skill: `claude-code/SKILL.md`, `copilot/copilot-instructions.md`, `cursor/<name>.md`.
- **Stories 3.1-3.4** (all done) — Story 3.5 is independent of their deliverables. No upstream code dependencies.

**Downstream consumers:**
- **Convoke 4.0 publication gate** — FR25 is the LAST acceptance criterion in Epic 3. Closing this story closes Epic 3.
- **Epic 3 retrospective** — fires after 3.5 closes.

**Namespace decision:** all artifacts under `_bmad-output/implementation-artifacts/v63-3-5-*` (Convoke namespace).
- `_bmad-output/implementation-artifacts/v63-3-5-platform-adapter-batch-validation.md` — this story.
- `_bmad-output/implementation-artifacts/v63-3-5-validation-report.md` — output of `validate-exports` (auto-generated; renamed from default `VALIDATION-REPORT.md` for namespace compliance).
- `_bmad-output/implementation-artifacts/v63-3-5-spot-check-report.md` — manual smoke evidence (operator-authored).
- **Out of scope:** modifying `convoke-export.js`, `validate-exports.js`, `generate-adapters.js`, `_bmad/_portability/`, or any test under `tests/lib/portability-*.test.js`. Existing infrastructure is CONSUMED, not modified. If the run reveals a defect in the validators, surface to user — that's a separate Bug Lane item, not Story 3.5 scope.
- **Covenant compliance checklist:** N/A — no new `_bmad/bme/*` skill being authored.

## Story

As Convoke maintainer (Amalik) preparing the v4.0 release,
I want **proof that the entire Tier 1 skill batch (60 standalone skills) exports cleanly across all 3 adapter platforms** (Claude Code + GitHub Copilot + Cursor), with structural validation green and 3 representative skills × 3 platforms manually spot-checked,
so that FR25's "Convoke ships everywhere" promise is verifiable beyond the single-skill EXP3 GO decision and Epic 3's marketplace-distribution stream is fully proven for the 4.0 publication gate.

**Story shape:** procedural / verification (no production code). Like Story 3.3 (registry-submission) and Story 3.4 (parity-verification), the deliverables are EVIDENCE ARTIFACTS, not code. Existing portability infrastructure does the work; this story RUNS it + RECORDS results.

**EXP3 baseline (2026-04-12 PASS):** single-skill Carson smoke test verified all 3 adapters install + behave reasonably. EXP3's per-adapter checks (persona present, no framework leaks, ready-to-drop format) define the spot-check rubric Story 3.5 extends to 3 representative skills.

## Acceptance Criteria

**Decision 1 (pinned): Tier 1 batch = all skills with `tier: standalone` in `_bmad/_config/skill-manifest.csv`** (currently 60 skills as of 2026-04-25; derived at runtime, NOT hardcoded per `derive-counts-from-source` Rule). `convoke-export --tier 1` already implements this scope ([`scripts/portability/convoke-export.js:14`](../../scripts/portability/convoke-export.js)).

**Decision 2 (pinned): Spot-check skills = the 3 in `MANUAL_SMOKE_SKILLS`** ([`scripts/portability/validate-exports.js:31-35`](../../scripts/portability/validate-exports.js)):
- `bmad-brainstorming` (Carson — brainstorming facilitator) — repeats EXP3's subject for continuity, confirms batch run hasn't regressed Carson's adapter shape.
- `bmad-agent-architect` (Winston — system architect) — extends to a different persona archetype.
- `bmad-tea` (Murat — test architect) — extends to a third archetype.
Each spot-checked across all 3 platforms = **9 manual smoke checks**. Per-platform rubric inherited from EXP3: persona present, framework-leak-free, ready-to-drop into the platform's expected location.

**Decision 3 (pinned): NO new code in this story.** Convoke-export + validate-exports + generate-adapters all exist. If Task 1 spike reveals a defect, HALT and surface — defect is a separate Bug Lane item, not Story 3.5 scope.

---

**AC1 — `convoke-export --tier 1` runs cleanly against the current Tier 1 batch.**
- **Given** a clean working tree (validation gates green at story start)
- **When** the operator runs `node scripts/portability/convoke-export.js --tier 1 --output _bmad-output/implementation-artifacts/v63-3-5-staging`
- **Then** the command MUST exit 0 with a "Tier 1 export complete" terminal line.
- **And** the output staging dir MUST contain N skill subdirs where `N === <count of rows in skill-manifest.csv with tier=standalone>` (derived; currently 60).
- **And** every skill subdir MUST have `instructions.md` + `README.md` + `adapters/{claude-code,copilot,cursor}/` populated.

**AC2 — `validate-exports` passes structural validation against the staging dir.**
- **Given** the AC1 output staging dir
- **When** the operator runs `node scripts/portability/validate-exports.js --input _bmad-output/implementation-artifacts/v63-3-5-staging --report _bmad-output/implementation-artifacts/v63-3-5-validation-report.md`
- **Then** the command MUST exit 0.
- **And** `v63-3-5-validation-report.md` MUST be generated with structural-validation results: zero `instructions.md` issues, zero forbidden-string matches in adapter content, zero missing persona sections per `MANUAL_SMOKE_SKILLS`.

**AC3 — 9 manual spot-checks pass (3 skills × 3 platforms) per EXP3 rubric.**
- **Given** the AC1 staging dir contains the 3 spot-check skills' adapter trees
- **When** the operator manually inspects each adapter file
- **Then** for each `(skill, platform)` of the 9 cells:
  - **Claude Code adapter** (`adapters/claude-code/SKILL.md`): YAML frontmatter present (`name`, `description`); persona section present; ready-to-drop into target's `.claude/skills/<name>/SKILL.md`.
  - **Copilot adapter** (`adapters/copilot/copilot-instructions.md`): HTML comment header `<!-- Skill: ... -->` present; full persona + workflow content; ready to append to target's `.github/copilot-instructions.md`.
  - **Cursor adapter** (`adapters/cursor/<name>.md`): clean markdown (no YAML frontmatter); persona + workflow present; ready to drop into target's `.cursor/rules/`.
  - **All 3 adapters per skill:** zero framework leaks (no `bmad-init`/`bmad-help`/`.claude/skills`/`BMAD Method` strings in adapter content — leaks in README ARE acceptable per EXP3 since README contains legitimate install instructions).

Results recorded in `v63-3-5-spot-check-report.md` with per-cell verdict + evidence (file path + size + first 50-byte sample).

**AC4 — Scope discipline.**
- MUST NOT touch: `scripts/portability/convoke-export.js`, `scripts/portability/validate-exports.js`, `scripts/portability/generate-adapters.js`, `scripts/portability/test-constants.js`, `scripts/portability/export-engine.js`, `scripts/portability/manifest-csv.js`, `_bmad/_portability/`, `_bmad/_config/skill-manifest.csv`, `package.json`, any file under `tests/lib/portability-*.test.js`.
- IN scope (3 new + 1 modified):
  - **New:** this story file, `v63-3-5-validation-report.md` (auto-generated), `v63-3-5-spot-check-report.md` (operator-authored).
  - **Modified:** `_bmad-output/implementation-artifacts/sprint-status.yaml` (status transitions only).
- The staging dir `_bmad-output/implementation-artifacts/v63-3-5-staging/` is scratch space — created by AC1, consumed by AC2-AC3, then DELETED at story close (it's ~200 files; checking it in would bloat the repo). Documented in Task 5.

**AC5 — Validation gates green.**
- [ ] 5.1 `npm test` baseline unchanged (story adds 0 new tests; existing portability tests at `tests/lib/portability-*.test.js` should still pass).
- [ ] 5.2 `npm run test:integration` baseline unchanged.
- [ ] 5.3 `npm run lint` clean (no JS files touched).
- [ ] 5.4 `git diff HEAD --stat` confirms AC4 scope (only the 3 new artifact files + sprint-status.yaml).

## Tasks / Subtasks

- [ ] **Task 0: Pre-flight gates.**
  - [ ] 0.1 Confirm green baseline: `npm test 2>&1 | tail -3` AND `npm run test:integration 2>&1 | tail -3` BOTH show `pass N / fail 0`. Capture N values.
  - [ ] 0.2 Verify Tier 1 skill count: `node -e "const m=require('fs').readFileSync('_bmad/_config/skill-manifest.csv','utf8').split('\n').slice(1); console.log('standalone:', m.filter(l => l.split(',')[6]==='standalone').length)"`. Record current count (expected ~60). If wildly different from EXP3 baseline, surface to user — manifest may have drifted.
  - [ ] 0.3 Confirm `convoke-export` + `validate-exports` are invocable: `node scripts/portability/convoke-export.js --help; node scripts/portability/validate-exports.js --help`. Both should exit 0 and print usage.

- [ ] **Task 1: DEF-SPIKE — sanity-check the existing infrastructure.** (Procedural confidence; existing tests pass per Task 0, but a manifest/config drift between EXP3 (2026-04-12) and 3.5 (2026-04-25) could surface.)
  - [ ] 1.1 **DS1: Tier 1 manifest stability.** Read `_bmad/_config/skill-manifest.csv`; confirm the manifest has the expected `tier` column at index 6, `standalone` is a valid value, and the count matches Task 0.2's number. If the column ordering changed since EXP3, the parser may need attention — surface.
  - [ ] 1.2 **DS2: MANUAL_SMOKE_SKILLS still represent good spot-check candidates.** Read `MANUAL_SMOKE_SKILLS` array in `validate-exports.js:31-35`. For each (`bmad-brainstorming`, `bmad-agent-architect`, `bmad-tea`), confirm: (a) the skill exists as a `tier: standalone` row in the manifest (so it'll be in the export batch); (b) the skill files exist on disk under their `path` column. If either fails, surface — `MANUAL_SMOKE_SKILLS` may have drifted.
  - [ ] 1.3 **DS3: Adapter generator hasn't regressed since EXP3.** Run a single-skill smoke test against `bmad-cis-agent-brainstorming-coach` (EXP3's subject; expect: no skill named `bmad-cis-agent-brainstorming-coach` in current manifest — actual name is `bmad-brainstorming` per `MANUAL_SMOKE_SKILLS`. **VERIFY** by grepping the manifest. If EXP3's subject name was renamed, document the rename in DS3 outcome and proceed with the current name.) Run: `node scripts/portability/convoke-export.js bmad-brainstorming --output /tmp/v63-3-5-ds3`. Verify all 3 adapter files exist + have non-zero size. Clean up `/tmp/v63-3-5-ds3` after.

- [ ] **Task 2: Run the batch export (AC1).**
  - [ ] 2.1 Create the staging dir: `mkdir -p _bmad-output/implementation-artifacts/v63-3-5-staging`. (Sibling: `_bmad-output/exp3-smoke-test/` is a precedent for this layout.)
  - [ ] 2.2 Run: `node scripts/portability/convoke-export.js --tier 1 --output _bmad-output/implementation-artifacts/v63-3-5-staging 2>&1 | tee /tmp/v63-3-5-export-stdout.log`. Capture full stdout for AC1 evidence.
  - [ ] 2.3 Verify exit 0 + "Tier 1 export complete" terminal line present + N skills exported (matches Task 0.2 count).
  - [ ] 2.4 Spot-check 1 skill's structure: `ls _bmad-output/implementation-artifacts/v63-3-5-staging/<some-skill>/adapters/{claude-code,copilot,cursor}/` should show 1 file each.

- [ ] **Task 3: Run structural validation (AC2).**
  - [ ] 3.1 Run: `node scripts/portability/validate-exports.js --input _bmad-output/implementation-artifacts/v63-3-5-staging --report _bmad-output/implementation-artifacts/v63-3-5-validation-report.md 2>&1 | tee /tmp/v63-3-5-validate-stdout.log`. Capture stdout.
  - [ ] 3.2 Verify exit 0. If non-zero: HALT and triage — review `v63-3-5-validation-report.md` for the failures; if defects are in the validator (false positives) document under DS-scope and surface to user; if defects are in the export output (real issues), surface to user — Story 3.5 cannot ship until export is clean.
  - [ ] 3.3 Confirm `v63-3-5-validation-report.md` exists + is non-empty + frontmatter parses.

- [ ] **Task 4: 9 manual spot-checks (AC3).**
  - [ ] 4.1 Author `_bmad-output/implementation-artifacts/v63-3-5-spot-check-report.md` with frontmatter (artifact_type: validation-evidence; story: v63-3-5-platform-adapter-batch-validation; created: today's date) and 9-cell table: rows = `bmad-brainstorming` / `bmad-agent-architect` / `bmad-tea`; cols = `claude-code` / `copilot` / `cursor`. One verdict per cell (PASS/FAIL/CAVEAT).
  - [ ] 4.2 For each cell: read the adapter file (`v63-3-5-staging/<skill>/adapters/<platform>/...`); apply EXP3 rubric (persona present + framework-leak-free + ready-to-drop format); record per-cell evidence (file path + byte size + verdict). Sample evidence cell: "claude-code/SKILL.md (8211B): YAML frontmatter present (`name`, `description`); '## You are' persona section at line 12; zero matches for forbidden strings (FORBIDDEN_STRINGS verified via `grep -F`); PASS."
  - [ ] 4.3 If any cell FAILs, surface to user — adapter regression vs EXP3.

- [ ] **Task 5: Tear down staging dir + write evidence-complete note.**
  - [ ] 5.1 `rm -rf _bmad-output/implementation-artifacts/v63-3-5-staging` — staging dir is scratch (60 skills × ~6 files = ~360 files; checking it in bloats the repo). Documented in AC4. **Note:** evidence in `v63-3-5-validation-report.md` + `v63-3-5-spot-check-report.md` references SHA-pinned content (file sizes, first-N-byte samples) so deletion doesn't lose evidence.
  - [ ] 5.2 Append a "tear-down completed" line to `v63-3-5-spot-check-report.md` confirming the staging dir was removed + when.

- [ ] **Task 6: Validation gates (AC5).**
  - [ ] 6.1 `npm test` — baseline unchanged.
  - [ ] 6.2 `npm run test:integration` — baseline unchanged.
  - [ ] 6.3 `npm run lint` — clean (no JS files touched).
  - [ ] 6.4 `git diff HEAD --stat` — confirms AC4 scope (3 new artifact files + sprint-status.yaml).

## Dev Notes

**Story shape:** procedural verification (matches Stories 3.3 + 3.4 patterns). No production code; existing infrastructure is CONSUMED. The 2 evidence artifacts (`v63-3-5-validation-report.md` + `v63-3-5-spot-check-report.md`) ARE the deliverable.

**Why Decision 1 (Tier 1 = all standalone):** `convoke-export --tier 1` is the existing semantic — matches what the architecture's "platform adapter validation (post-EXP3 GO)" instruction prescribes (`convoke-arch-bmad-v6.3-adoption.md:420`). FR25 says "exported Tier 1 skills validated across 3 platforms"; this is what Tier 1 means in the codebase.

**Why Decision 2 (3 spot-check skills):** `MANUAL_SMOKE_SKILLS` already exists in `validate-exports.js:31-35` with 3 explicit cell candidates (Carson, Winston, Murat). Three different persona archetypes (creative facilitator + system architect + test architect) cover diverse content shapes. Reusing the existing list keeps the spot-check rubric stable and aligns with the validator's expectations.

**Why Decision 3 (no new code):** Story 3.5 is the FINAL Epic 3 story; goal is to PROVE existing infrastructure works at batch scale, not extend it. New code = scope creep. If Task 1 spike or Task 2-3 runs reveal a defect, surface to user as Bug-Lane item; do NOT silently fix.

**Anti-patterns to avoid:**
- DON'T modify `convoke-export.js` / `validate-exports.js` / `generate-adapters.js` — Story 3.5 is downstream-only.
- DON'T modify `MANUAL_SMOKE_SKILLS` — DS2 verifies the list is still current; if it's drifted, surface to user (separate item).
- DON'T modify `_bmad/_config/skill-manifest.csv` — manifest is generated by `refreshInstallation` from registry data.
- DON'T hardcode "60" anywhere — derive from manifest at runtime per `derive-counts-from-source` Rule.
- DON'T trust `process.cwd()` in any glue scripting — Story 3.5 should have minimal scripting; if Task 4 needs a small Bash helper for spot-check enumeration, follow `no-process-cwd-in-libs` pattern (read manifest path explicitly).
- DON'T check the `v63-3-5-staging/` dir into git — Task 5.1 deletes it post-validation. Evidence references it via file paths + byte sizes captured in the report files.
- DON'T close Story 3.5 if any spot-check FAILs — surface adapter regression vs EXP3.

**External dependencies + risk:**
- **PR1 — Manifest drift since EXP3 (2026-04-12 → 2026-04-25, 13 days).** Tier 1 count was implicit at EXP3 (single-skill); now it's explicit (60 standalone). DS1 catches drift. Likeliest scenario: count grew (Convoke added skills); should still be a clean PASS. Surface only if count SHRANK or column ordering changed.
- **PR2 — `MANUAL_SMOKE_SKILLS` drift.** EXP3's subject was `bmad-cis-agent-brainstorming-coach`; current `MANUAL_SMOKE_SKILLS` lists `bmad-brainstorming`. If the canonical name was renamed, that's a known artifact of the Convoke evolution; DS2 verifies + the rename is documented in the v63-3-5-spot-check-report.md frontmatter.
- **PR3 — Adapter generator regression.** Unlikely since `tests/lib/portability-*.test.js` would catch it. DS3 single-skill smoke confirms; if it fails, halt + Bug-Lane item.

**Spike points (DEF-SPIKE) tracked in Dev Agent Record:**
- **DS1 (Tier 1 manifest stability):** Task 1.1.
- **DS2 (MANUAL_SMOKE_SKILLS still good candidates):** Task 1.2.
- **DS3 (adapter generator hasn't regressed):** Task 1.3.

**Pattern reuse:**
- `_bmad-output/exp3-smoke-test/<skill>/` — precedent for the staging dir layout; per-skill subdir with `adapters/{platform}/<file>` shape.
- [`convoke-note-exp3-platform-agnostic-smoke-test.md`](../planning-artifacts/convoke-note-exp3-platform-agnostic-smoke-test.md) — precedent for the per-adapter rubric (persona, leaks, ready-to-drop) used in Task 4.2.
- Story 3.3 (`v63-3-3-validation-log.md` + `v63-3-3-pr-link.md`) — precedent for the procedural-evidence-artifact shape (frontmatter + structured findings).

## Testing

**No new tests** (procedural verification — same shape as Stories 3.3 + 3.4 procedural cases). The deliverable is the evidence artifacts.

**Test count delta:** +0 from this story.

**Validation surface for review sign-off:**
- AC1: `convoke-export --tier 1` exit 0 + N skills exported (N derived from manifest; currently 60).
- AC2: `validate-exports` exit 0 + `v63-3-5-validation-report.md` generated.
- AC3: 9-cell spot-check table in `v63-3-5-spot-check-report.md` all PASS.
- AC4: `git diff --stat` confirms scope.
- AC5: gates green.

## References

- **Epic 3 Story 3.5:** [`convoke-epic-bmad-v6.3-adoption.md §Story 3.5`](../planning-artifacts/convoke-epic-bmad-v6.3-adoption.md#story-35-platform-adapter-batch-validation).
- **EXP3 baseline:** [`convoke-note-exp3-platform-agnostic-smoke-test.md`](../planning-artifacts/convoke-note-exp3-platform-agnostic-smoke-test.md) (PASS, 2026-04-12).
- **Architecture Decision 5:** [`convoke-arch-bmad-v6.3-adoption.md`](../planning-artifacts/convoke-arch-bmad-v6.3-adoption.md) — platform-adapter-validation framing.
- **Existing infrastructure:** `scripts/portability/{convoke-export,validate-exports,generate-adapters,export-engine,manifest-csv,test-constants}.js`.
- **Project rules:** [`project-context.md`](../../project-context.md) — applied: `derive-counts-from-source`, `no-process-cwd-in-libs`, `lint-passes-before-review`.

## Project structure notes

**New files (3):**
- `_bmad-output/implementation-artifacts/v63-3-5-platform-adapter-batch-validation.md` (this file).
- `_bmad-output/implementation-artifacts/v63-3-5-validation-report.md` — auto-generated by `validate-exports` (~50-200 LOC depending on findings).
- `_bmad-output/implementation-artifacts/v63-3-5-spot-check-report.md` — operator-authored (~50-100 LOC for the 9-cell table + per-cell evidence).

**Modified files (1):** `_bmad-output/implementation-artifacts/sprint-status.yaml`.

**Scratch (deleted at story close):** `_bmad-output/implementation-artifacts/v63-3-5-staging/` — Tier 1 batch export output, ~60 skills × ~6 files = ~360 files. NOT checked in.

**No external work; no production code; no `_bmad/bme/` touched.**

**Projected total:** ~150-300 LOC across 3 markdown files (this story + 2 evidence artifacts). **Leanest of the v6.3 stories** — pure verification of existing infrastructure.

## Dev Agent Record

**Agent Model Used:** (filled at story-execute time)

**DEF-SPIKE tracking:**
- [ ] DS1 (Tier 1 manifest stability) — Task 1.1.
- [ ] DS2 (MANUAL_SMOKE_SKILLS still good candidates) — Task 1.2.
- [ ] DS3 (adapter generator hasn't regressed since EXP3) — Task 1.3.

**Deviations from spec:** (filled during implementation)

**Debug Log References:**
- `/tmp/v63-3-5-export-stdout.log` (Task 2.2 — convoke-export stdout).
- `/tmp/v63-3-5-validate-stdout.log` (Task 3.1 — validate-exports stdout).

**Completion Notes List:**
**File List:**

### Change Log

| Date | Change | Reference |
|------|--------|-----------|
| 2026-04-25 | Story created post-Story-3.4 close via `/bmad-create-story v63-3-5`. **5 ACs + 3 Decisions + 6 Tasks + 3 DEF-SPIKEs** covering FR25 platform adapter batch validation. Tests-only / procedural verification (matches Stories 3.3 + 3.4 patterns); no production code. Existing infrastructure (`convoke-export`, `validate-exports`, `generate-adapters`) is CONSUMED. Decision 1: Tier 1 batch = all standalone skills per `skill-manifest.csv` (currently 60; derived at runtime). Decision 2: spot-check skills = `MANUAL_SMOKE_SKILLS` const in validate-exports.js (Carson + Winston + Murat) × 3 platforms = 9 manual cells. Decision 3: NO new code — defects surface as Bug-Lane items, not Story 3.5 scope. EXP3 baseline (2026-04-12 PASS, single-skill Carson) defines the per-adapter rubric. Projected ~150-300 LOC across 3 markdown files (story + auto-generated validation report + operator-authored spot-check report). Staging dir `_bmad-output/implementation-artifacts/v63-3-5-staging/` deleted at story close (scratch space; ~360 files; evidence references file paths + byte sizes). **Critical risk PR1:** Manifest drift since EXP3 (13 days) — DS1 catches; expected count grew, surface only if shrank or column ordering changed. **Story 3.5 closes Epic 3** (4/5 → 5/5 stories shipped). Anchor rules applied: derive-counts-from-source, no-process-cwd-in-libs, lint-passes-before-review. Ready for `/bmad-validate-create-story` (recommended given 3 DEF-SPIKEs + cross-version drift risk) then `/bmad-dev-story`. | [sprint-status.yaml](sprint-status.yaml) |
