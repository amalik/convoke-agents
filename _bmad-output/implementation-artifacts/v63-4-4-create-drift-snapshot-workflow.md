---
initiative: convoke
artifact_type: story
qualifier: v63-4-4-create-drift-snapshot-workflow
created: '2026-04-26'
schema_version: 1
epic: v63-epic-4
---

# Story 4.4: Create drift snapshot workflow

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

**Epic:** [Epic 4 — Validated Behavioral Equivalence](../planning-artifacts/convoke-epic-bmad-v6.3-adoption.md#epic-4-validated-behavioral-equivalence)
**Sprint:** 4 (PF1 stream — fourth story; **infrastructure now / capture release-time**, mirrors Story 4.3 split). Story is **independent of Story 4.3**: builds a pure-function renderer + protocol; can ship before Story 4.3 executes.
**FR coverage:** FR39 (operator captures pre/post drift snapshots for 2–3 key skills as retrospective observation artifact).
**NFR coverage:** NFR22 (semantic diff artifact, manually reviewable for unexpected behavioral changes), NFR32 (deterministic on re-run).
**Failure modes addressed:** None new. Inherits Story 4.3's FM4-4 (baselines-go-stale) by REUSING the same `_bmad-output/pf1-baselines/` + `_bmad-output/pf1-post-migration/` recordings (Decision 1).

**Why this story is NOT a release-blocking gate (in contrast to Story 4.3):** Story 4.3's PF1 battery produces the **M9 ship/no-ship decision** (numerical PASS/INVESTIGATE/FAIL gate per arch:362-368). Story 4.4 produces a **retrospective observation artifact** for human review — no gate, no judge, no API costs. The artifact is a side-by-side markdown for the operator + retrospective record, NOT a release blocker. This decouples Story 4.4's tooling from Story 4.3's release-time execution: the renderer + tests + protocol can ship NOW and run on synthetic fixtures; real pre/post capture happens at release time alongside Story 4.3 (data reuse — see Decision 1).

**Why this story is BUILDABLE NOW (in contrast to Story 4.3 dev-story-deferred):** Renderer is a pure function (line-diff over markdown text); no LLM, no `ANTHROPIC_API_KEY`, no migration sandbox. Fixture-based unit tests prove determinism (NFR32) without real recordings. The artifact-production step at release time is a single CLI invocation against Story 4.3's recordings.

**Upstream dependencies:**
- **Story 4.2 (DONE)** — provides recording header contract `## Prompt N` (digit-only per H1 + CM-6 fixes). Story 4.4 consumes the same contract to parse recordings. Battery's `parseRecording` export is REUSABLE (verified: 14 exports include `parseRecording`).
- **Story 4.3 (ready-for-dev; release-time-deferred)** — produces actual baseline + post-migration recordings at release time. Story 4.4's release-time capture step (Task 6) consumes those recordings. **NOT a hard dependency at spec-author or dev-story time** — Tasks 1-5 (renderer + tests + protocol) ship without it.
- **No new external deps** — Node built-ins only (`fs`, `path`, `assert`); no `diff` package (verified: `package.json` has no diff lib; minimal LCS-based line-diff implemented inline ~30 LOC).
- **⚠️ Story 4.2 surface bug `D-V42-R3-1` (battery `--dry-run` exits 0 on missing recordings) — RELEASE-TIME-CONDITIONAL caveat (CM-1 from V-pass).** NOT a dev-story blocker (Story 4.4 unit tests use synthetic fixtures + don't invoke the battery). Story 4.4 Task 6 release-time invocation is INDEPENDENT of the battery (drift-snapshot script consumes recordings directly via `parseRecording`, never invokes battery). However, if operator manually pipelines drift-snapshot AFTER `pf1-validation-battery.js --dry-run` for combined release-time validation, MUST check stdout for `Error:` lines per Story 4.3 Task 6.2 workaround pattern. Resolution lifecycle: D-V42-R3-1 routes to deferred-work as Story 4.2 amendment; if shipped before Story 4.4's Task 6 executes, caveat moot.

**Downstream consumers:**
- **Epic 4 retrospective** (`v63-epic-4-retrospective`, optional per sprint-status) — drift snapshot is one of the retrospective observation artifacts.
- **Story 5B.2 retrospective** (anti-pattern registry) — drift observations may surface anti-patterns for `convoke-anti-patterns.md`.
- **NOT a downstream consumer of M9** — drift snapshot is observational, not gate-blocking.

**Namespace decision:** all artifacts under `scripts/audit/` + `tests/lib/` + `tests/fixtures/drift-snapshot/` + `_bmad-output/implementation-artifacts/v63-4-4-*` (Convoke namespace). NOT a `_bmad/bme/` skill — covenant-compliance-checklist N/A. **slash-command-ux rule deferred per Decision 5** (explicit precedent from Story 4.2: PF1 release-engineering tooling is bare CLI; same pattern applies here — see Decision 5).

## Story

As Convoke maintainer (Amalik) running the v4.0 release retrospective,
I want **a deterministic side-by-side drift snapshot artifact** for 2–3 key skills' pre/post migration outputs, produced by a tested renderer at `scripts/audit/drift-snapshot.js`,
so that I have a human-reviewable retrospective observation surface (FR39) for unexpected behavioral changes — separate from Story 4.3's PASS/INVESTIGATE/FAIL gate — that supports root-cause investigation of any drift the gate flagged AND captures observations the gate's coarse-grained verdict cannot.

**Story shape:** **code-authoring + protocol-doc + release-time-execution-deferred-step**. Builds NEW renderer (~150-200 LOC) + structural unit tests (8-10 tests) + synthetic fixtures + protocol doc. Operator-invoked at release time (Task 6 = HALT-for-operator). Smaller than Story 4.2 (~400-500 LOC); larger than Story 4.1 (~250 LOC of judge calibration).

**Empirical baseline (probed 2026-04-26):**

| Probe | Result | Spec impact |
|-------|--------|-------------|
| `_bmad-output/pf1-baselines/` + `_bmad-output/pf1-post-migration/` state | ✓ — both absent (clean slate; Story 4.3 release-time creates) | None — Story 4.4 unit tests use synthetic fixtures, not real recordings |
| Story 4.2 `parseRecording` export reusable | ✓ — 14 exports include `parseRecording` (verified Story 4.2 R1+R2 close) | Decision 2 reuses via `require()` |
| `scripts/audit/drift-snapshot*` + `tests/lib/drift-snapshot*` + `tests/fixtures/drift-snapshot*` absent | ✓ — clean slate | None |
| `package.json` has `diff` / `jsdiff` / `unified` package | ✗ — none present | Decision 3 implements minimal LCS line-diff inline (no new dep) |
| PF1 slash-command wrapper precedent | ✗ — none (`scripts/audit/pf1-validation-battery.js` is bare CLI per Story 4.2) | Decision 5 follows precedent; bare CLI for release-engineering tooling |
| `npm test` baseline | ✓ — `tests 1468 / pass 1467 / skip 1 / fail 0` (post-Story 4.2 R2) | None — Story 4.4 adds ~9-11 unit tests; new baseline `1476-1478` |
| `npm run test:integration` baseline | ✓ — `tests 93 / pass 93 / fail 0` | None — Story 4.4 adds 0 integration tests |
| Sample fixture format from Story 4.2 (digit-only `## Prompt N` headers) | ✓ — `tests/fixtures/pf1-battery/sample-baseline.md` + `sample-post.md` use the contract | Decision 4 fixtures follow same contract |
| Architecture detail beyond FR39/NFR22/NFR32 | ✗ — none (greenfield design) | Decision 3 + Decision 4 pin shape; spec-author owns design |

## Acceptance Criteria

### Decisions (pinned at spec-author time; defensible at dev-time)

**Decision 1 — REUSE Story 4.3's PF1 recordings; do NOT re-record.** Drift snapshot consumes the same `_bmad-output/pf1-baselines/{skill}-baseline.md` + `_bmad-output/pf1-post-migration/{skill}-post.md` files Story 4.3 produces. Default skill subset for drift snapshot: **3 of 5 PF1 agents** (Emma + John + Winston). Rationale per FR39 examples ("Vortex stream output" → Emma is Contextualize; "PRD draft output" → John is PM; architectural decision surface → Winston is Architect). Murat + Carson omitted from default to keep retrospective artifact focused on the 3 highest-impact operator surfaces. **Operator override:** CLI accepts `--skills <comma-list>` to expand to all 5 (or any subset).
- **Pro:** zero additional recording work for operator; drift snapshot ships with Story 4.3's release-time capture in one operator session.
- **Con:** drift snapshot's skill set ⊆ PF1's; FR39's "bmad-enhance-initiatives-backlog" example NOT captured. **Decision rationale:** that broader scope is correctly a follow-up snapshot artifact (deferred; not v6.3-Epic-4-blocking); Story 4.4 ships the renderer + protocol that supports arbitrary `--input-pre <file> --input-post <file>` pairs (Decision 4) — operator can run additional snapshots post-release.

**Decision 2 — REUSE Story 4.2's `parseRecording` via `require()`; do NOT re-implement parser.** Import from `./pf1-validation-battery`. Same digit-only `## Prompt N` header contract (CM-6 from Story 4.3 V-pass). Reduces duplication + keeps Story 4.2's frozen surface as single source of truth for recording shape. **Inversion handler:** if Story 4.2's `parseRecording` semantics change in a future amendment (e.g., D-V42-R3-1 fix), Story 4.4 inherits automatically.

**Decision 3 — Diff renderer: minimal LCS-based line-diff, inline (~30 LOC); NO new dependency.** Algorithm: line-tokenize both texts; build LCS table; emit unified-diff-style markers with `=` (unchanged), `-` (only in baseline), `+` (only in post-migration). Output format: side-by-side markdown table per prompt section, two columns ("Baseline (3.x)" + "Post-migration (4.0)"), with diff markers on unchanged-vs-changed lines. **Why inline LCS, not `diff` npm package:** (a) zero new dep avoids supply-chain risk for ≤30 LOC of well-understood algorithm; (b) deterministic output guaranteed (no version-pin drift); (c) operator-readable JS easier to audit than vendor-package output. **Inversion handler:** if performance becomes a concern (>10s for 4 prompts × 3 skills), swap to `diff` package — but baseline expectation: <1s wall-clock.

**Decision 4 — Output structure + determinism contract (NFR32).**
- **Output path (default):** `_bmad-output/implementation-artifacts/v63-4-4-drift-snapshot.md`. Override via `--output <path>`.
- **Frontmatter (8 keys, deterministic-when-inputs-fixed):** `initiative: convoke`, `artifact_type: drift-snapshot`, `release_target: 4.0.0`, `created: <YYYY-MM-DD>` (operator passes `--date` for sub-day determinism; defaults to today), `skills: [emma, john, winston]` (sorted), `baseline_dir: <path>`, `post_migration_dir: <path>`, `prompts_per_skill: 4` (matches Story 4.2 PF1_PROMPTS contract). **NOT in frontmatter:** wall-clock, hostname, random IDs (anything non-deterministic).
- **Body structure:** for each skill (sorted), section `## Skill: <display>` → for each of 4 prompts (sorted by `Prompt N`), subsection `### Prompt N` → side-by-side table comparing baseline vs post-migration with diff markers + summary line ("X lines changed of Y total" — derived from diff, not measured by clock).
- **Determinism guarantees (NFR32):** byte-identical output on re-run iff (a) input recordings byte-identical, (b) `--date` arg PASSED EXPLICITLY (not defaulted), (c) `--skills` arg same, (d) Node version stable (LCS uses no `Math.random`, no `Date.now()` in body, no iteration over `Object.entries()` without sort). **`--date` is the load-bearing arg per LL-1 V-pass consolidation:** defaulting to today is convenient for dev/test runs but breaks NFR32 across UTC midnight (silent — operator wouldn't notice). Protocol doc (Task 4.1) MANDATES explicit `--date` in ALL release-time invocation templates; Test 7 verifies determinism with explicit `--date`; Test 11 (OS-1 V-pass) verifies the silent-failure mode is detectable. Other references to `--date` (AC1 flags, Task 3.8 implementation, Task 4.1 protocol) are pointers to this Decision — rationale lives ONLY here.

**Decision 5 — Bare CLI script per Story 4.2 precedent; NO `/bmad-drift-snapshot` slash-command skill in Story 4.4 scope.** Rationale (EO-1 V-pass tightening): the `slash-command-ux-for-user-facing-tools` rule (project-context.md) governs **Convoke user-facing tools** — operators discovering product opportunities via Vortex/Gyre/etc. agents. **Release-engineering tools (Scripts 4.1–4.4: judge calibration, battery, recorder, drift snapshot) are internal infrastructure that Amalik (the maintainer) runs at release time, not Convoke user-facing features per the operator/user distinction in the [Operator Covenant](../planning-artifacts/convoke-covenant-operator.md).** Established Epic 4 precedent: Story 4.1 `pf1-judge-calibration.js`, Story 4.2 `pf1-validation-battery.js`, Story 4.3 conditional `pf1-record-agent.js` all bare CLI — same maintainer-only pattern. **Inversion handler:** if a future v4.x retrospective surfaces operator friction with bare CLI invocation (e.g., having to remember the exact flags), OR if Convoke users (not just maintainers) start needing drift-snapshot for their own skill development, Fast Lane backlog item to wrap as slash-command skill. Documented as **`D-V44-1`** in deferred-work scaffolding (added during dev-story Task 5).

---

**AC1 — `scripts/audit/drift-snapshot.js` exists with required exports + structure.**
**Given** Story 4.4 dev-story complete
**When** the file is inspected
**Then**:
- File exists at `scripts/audit/drift-snapshot.js`. CommonJS module.
- Top-of-file constants present + EXPORTED for testability: `DEFAULT_SKILLS = ['emma', 'john', 'winston']` (Decision 1 default subset, sorted), `SKILL_DISPLAY` (3-or-5-entry map: skill key → `{display, manifestSkill}` matching Story 4.2 `PF1_AGENTS`), `BASELINE_DIR_DEFAULT = '_bmad-output/pf1-baselines'`, `POST_MIGRATION_DIR_DEFAULT = '_bmad-output/pf1-post-migration'`, `OUTPUT_PATH_DEFAULT = '_bmad-output/implementation-artifacts/v63-4-4-drift-snapshot.md'`, `PROMPTS_PER_SKILL = 4`.
- Imports `parseRecording` from `./pf1-validation-battery` (Decision 2).
- Functions exported (testability per O1): `lineDiff(a, b)` → `[{type: 'unchanged'|'removed'|'added', text}]` (LCS-based, deterministic, pure); `renderSidebySide(baselineSection, postSection)` → markdown table string; `renderSnapshot({skills, baselineDir, postDir, date})` → full markdown string; `loadSkillRecording(skill, dir, suffix)` → text content (suffix = 'baseline' or 'post'); `parseArgs(argv)` → `{skills, baselineDir, postDir, output, date}`; `main()` → orchestrator (CLI entry).
- Header docstring includes exit-code reference table: 0 (success), 1 (parser error from `parseRecording`), 2 (recording file missing), 3 (output write error), 99 (unexpected).
- Flags: `--skills <comma-list>` (override Decision 1 default), `--baseline-dir <path>`, `--post-dir <path>`, `--output <path>`, `--date <YYYY-MM-DD>` (Decision 4 determinism), `--input-pre <file> --input-post <file>` (Decision 1 ad-hoc pair mode for non-PF1 skills).

**AC2 — `lineDiff(a, b)` is correct + deterministic + LCS-based.**
**Given** two text inputs
**When** `lineDiff` is called
**Then**:
- Returns array of `{type, text}` records where `type ∈ {'unchanged', 'removed', 'added'}`.
- Identical inputs → all entries `unchanged`; output array length = line count.
- Disjoint inputs → first all `removed`, then all `added`; output length = `a.lines + b.lines`.
- Mixed inputs → LCS-correct diff; tested against 3 known-pair fixtures (Test 3 covers).
- Pure function: same inputs → same output across 100 calls (Test 4 verifies via repeated invocation byte-comparison).
- No `Math.random`, no `Date.now()`, no global state mutation.

**AC3 — `renderSnapshot({...})` produces NFR32-deterministic markdown.**
**Given** synthetic baseline + post-migration fixtures + fixed `date` arg
**When** `renderSnapshot({skills: ['emma'], baselineDir: <fixture>, postDir: <fixture>, date: '2026-04-26'})` is called twice
**Then**:
- Output is byte-identical across 2 invocations (Test 7 verifies).
- Frontmatter has 8 keys per Decision 4; values match passed args.
- Body has 1 `## Skill: ...` section + 4 `### Prompt N` subsections per skill, each with side-by-side table.
- Iteration order of skills + prompts is sorted (lexicographic for skills; numeric for prompts).
- No timestamps in body. No host/process metadata. No random IDs.

**AC4 — `--input-pre <file> --input-post <file>` ad-hoc pair mode supports non-PF1 skills (Decision 1 escape hatch).**
**Given** operator passes `--input-pre /path/to/skill-pre.md --input-post /path/to/skill-post.md` (NOT default `--skills` mode)
**When** `main()` runs
**Then**:
- Output contains 1 skill section labeled `## Skill: <derived-from-filename>` (e.g., `bmad-enhance-initiatives-backlog`).
- Same 4-prompt section structure (input files MUST conform to digit-only `## Prompt N` header contract).
- Frontmatter `skills: [<derived>]` (single-entry array).
- AC5 determinism contract still holds.

**AC5 — Output file written atomically + path-safety analysis applied.**
**Given** `--output <path>` arg + valid recordings
**When** `main()` writes output
**Then**:
- Write is atomic: `fs.writeFileSync` to temp `.tmp` file in same directory, then `fs.renameSync` (same pattern as Story 4.2 `writeResults`).
- Path safety per `path-safety-for-destructive-ops` rule: `--output` resolved + normalized + must be under `findProjectRoot()`; paths outside the repo are refused (CM-2 from V-pass — `_bmad-output/` is implied since it's under project root). Also refuse `/`, `$HOME`, paths containing `..` segments after normalization. `--baseline-dir` + `--post-dir` similarly resolved + read-only-checked.
- On read failure (recording missing): exit 2 with `Error: recording not found: <path>` to stderr.
- On parse failure (Story 4.2 `parseRecording` throws): exit 1 with `Error: <parser-message>` to stderr.

**AC6 — Validation gates green + scope discipline.**
- [ ] 6.1 `npm test` baseline: `tests 1468 → 1476-1478 / pass +9-11 / skip 1 / fail 0` (Story 4.4 adds 9-11 unit tests).
- [ ] 6.2 `npm run test:integration` baseline unchanged: `tests 93 / pass 93 / fail 0` (no integration tests).
- [ ] 6.3 `npm run lint` clean (per `lint-passes-before-review` rule — zero warnings on NEW JS files).
- [ ] 6.4 `git diff HEAD --stat` confirms scope = AC7 file set.

**AC7 — Scope discipline.**
- IN scope (NEW files):
  - `scripts/audit/drift-snapshot.js` (~150-200 LOC).
  - `tests/lib/drift-snapshot.test.js` (9-11 unit tests).
  - `tests/fixtures/drift-snapshot/{emma,john,winston}-{baseline,post}.md` (6 synthetic fixtures, ~20 LOC each — same shape as Story 4.2's `tests/fixtures/pf1-battery/sample-{baseline,post}.md`).
  - `_bmad-output/implementation-artifacts/v63-4-4-drift-snapshot-protocol.md` (~30-line operator protocol doc — when/how to capture, when to run renderer, where artifact lives).
  - This story file.
- IN scope (MODIFIED):
  - `_bmad-output/implementation-artifacts/sprint-status.yaml` — status transitions + `last_updated` narrative.
  - `_bmad-output/implementation-artifacts/deferred-work.md` — add `D-V44-1` slash-command-skill-deferral entry (Decision 5).
  - This story file (Tasks/Subtasks checkboxes + Dev Agent Record + File List + Change Log + Status).
- MUST NOT touch: `scripts/audit/pf1-judge-prompt.md`, `scripts/audit/pf1-judge-calibration.js`, `scripts/audit/pf1-validation-battery.js` (Stories 4.1 + 4.2 frozen surfaces — Decision 2 imports `parseRecording` only); existing test files; existing fixture dirs (`tests/fixtures/pf1-battery/`, `tests/fixtures/pf1-calibration/`); `package.json`/`package-lock.json` (Decision 3 zero new deps); any `_bmad/` files.
- **EO-1 escape hatch:** if Story 4.2's `parseRecording` proves insufficient for non-PF1 recordings (AC4 ad-hoc pair mode), surface as deferred-work item; do NOT modify Story 4.2's surface from within Story 4.4.

**Path safety analysis (per `path-safety-for-destructive-ops` rule):** `main()` writes to `--output` path. Operator-provided path is ATTACK SURFACE. Mitigations per AC5: (a) `path.resolve` + `path.normalize`; (b) require resolved path starts with `findProjectRoot()` OR `_bmad-output/` (whichever is broader for this script); (c) explicit refusal for `/`, `$HOME`, paths containing `..` segments after normalization. **Read paths** (`--baseline-dir`, `--post-dir`) are less critical (read-only) but same resolution applied for consistency. **NO recursive deletion** anywhere in script. Story 4.4 spec documents the protocol; operator executes with eyes open.

## Tasks / Subtasks

- [x] **Task 0: Pre-flight gates (no execution-precondition; this story is buildable now per "Why this story is BUILDABLE NOW" rationale).**
  - [x] 0.1 Confirm Story 4.2 status `done` in sprint-status.yaml + battery exports include `parseRecording`: `node -e "const b=require('./scripts/audit/pf1-validation-battery'); console.log(typeof b.parseRecording)"` should print `function`.
  - [x] 0.2 Confirm clean slate: `ls scripts/audit/drift-snapshot* tests/lib/drift-snapshot* tests/fixtures/drift-snapshot/ _bmad-output/implementation-artifacts/v63-4-4-* 2>/dev/null` — only this story file present.
  - [x] 0.3 Confirm `npm test` baseline (`tests 1468 / pass 1467 / skip 1 / fail 0`) before changes.
  - [x] 0.4 Confirm `npm run lint` clean before changes.

- [x] **Task 1: Author 6 synthetic test fixtures at `tests/fixtures/drift-snapshot/` (~10 min).** [DEV-NOTE: fixtures use canonical manifest skill names per Decision 1 + Story 4.3 CM-3 — `bmad-agent-bme-contextualization-expert-baseline.md`, `bmad-agent-pm-baseline.md`, `bmad-agent-architect-baseline.md` — NOT short keys; this matches the `loadSkillRecording` filename contract.]
  - [x] 1.1 Create directory `tests/fixtures/drift-snapshot/`.
  - [x] 1.2 Create 3 baseline fixtures (canonical names): `bmad-agent-bme-contextualization-expert-baseline.md` (Emma), `bmad-agent-pm-baseline.md` (John), `bmad-agent-architect-baseline.md` (Winston). Each follows Story 4.2's `tests/fixtures/pf1-battery/sample-baseline.md` shape: 2-line provenance HTML comments + 4 sections with digit-only `## Prompt N` headers + ~3-5 lines of synthetic content per section.
  - [x] 1.3 Create 3 post-migration fixtures (canonical names): `bmad-agent-bme-contextualization-expert-post.md`, `bmad-agent-pm-post.md`, `bmad-agent-architect-post.md`. John = no drift (identical baseline+post case); Emma = single-line word change + multi-line addition; Winston = multi-line rewrite + addition.
  - [x] 1.4 Validated every fixture passes Story 4.2 `parseRecording` — all 6 files parsed to `["Prompt 1","Prompt 2","Prompt 3","Prompt 4"]`.

- [x] **Task 2: Author `tests/lib/drift-snapshot.test.js` (TDD — RED phase; ~30 min).**
  - [x] 2.1 Create test file. Use `node:test` + `node:assert/strict` (project convention per Story 4.2 R1+R2 close + C1 phantom-test resolution — **never Jest**, no Jest globals).
  - [x] 2.2 Tests (11 total, all structural — NO live execution):
    - **Test 1:** `scripts/audit/drift-snapshot.js` exists.
    - **Test 2:** Required exports present (per AC1): `DEFAULT_SKILLS`, `SKILL_DISPLAY`, `BASELINE_DIR_DEFAULT`, `POST_MIGRATION_DIR_DEFAULT`, `OUTPUT_PATH_DEFAULT`, `PROMPTS_PER_SKILL`, `lineDiff`, `renderSidebySide`, `renderSnapshot`, `loadSkillRecording`, `parseArgs`.
    - **Test 3:** `lineDiff` correctness — `lineDiff('a\nb\nc', 'a\nb\nc')` → all unchanged; `lineDiff('a\nb', 'c\nd')` → all removed/added; `lineDiff('a\nb\nc', 'a\nx\nc')` → unchanged-removed-added-unchanged (LCS).
    - **Test 4:** `lineDiff` purity — same inputs → same output across 10 invocations (deep-equal each result; AC2 determinism).
    - **Test 5:** `renderSnapshot` structural shape — given fixture `emma-baseline.md` + `emma-post.md`, output contains: (a) frontmatter with all 8 keys per AC3; (b) `## Skill: Emma` section; (c) 4 `### Prompt N` subsections; (d) side-by-side table syntax (`|` column delimiters per markdown).
    - **Test 6:** `renderSnapshot` skill iteration sorted — given `--skills john,emma,winston` (unsorted), output skill sections appear in alphabetical order: emma, john, winston.
    - **Test 7:** `renderSnapshot` byte-identical re-run — call twice with same args; `assert.equal(out1, out2)` (NFR32 + AC3).
    - **Test 8:** `parseArgs` defaults — no args → returns `{skills: DEFAULT_SKILLS, baselineDir: BASELINE_DIR_DEFAULT, postDir: POST_MIGRATION_DIR_DEFAULT, output: OUTPUT_PATH_DEFAULT, date: <today>}`.
    - **Test 9:** `parseArgs` overrides — `['--skills', 'emma', '--output', '/tmp/x.md', '--date', '2026-04-26']` → expected shape.
    - **Test 10:** `--input-pre / --input-post` ad-hoc pair mode (AC4) — `parseArgs(['--input-pre', '/p/a.md', '--input-post', '/p/b.md'])` returns shape with `inputPre`, `inputPost` set + `skills` ignored or single-entry derived.
    - **Test 11 (OS-1 V-pass — NFR32 midnight-crossing guard):** invoke `renderSnapshot` twice WITHOUT `--date` arg (relying on default-to-today); use `globalThis.Date` mock or `process.env.DRIFT_SNAPSHOT_TODAY_OVERRIDE` (test-only escape hatch — see Task 3.8) to simulate two invocations spanning UTC midnight. Assert both invocations produce DIFFERENT frontmatter `created` values (proving the default-date path is non-deterministic across midnight) AND a third invocation with explicit `--date '2026-04-26'` produces deterministic output regardless. **Why this test:** at release time, operator could plausibly forget `--date` flag + run twice across midnight → frontmatter differs → silent NFR32 violation. Test makes the gap visible + forces protocol doc to mandate explicit `--date`.
  - [x] 2.3 Ran `node --test tests/lib/drift-snapshot.test.js` — confirmed ALL 11 tests RED with `MODULE_NOT_FOUND` for `drift-snapshot.js` (verifies tests are testing-something).

- [x] **Task 3: Author `scripts/audit/drift-snapshot.js` (GREEN phase; ~60 min for ~150-200 LOC).** [DEV-NOTE: actual ~280 LOC including ad-hoc pair mode + path-safety + atomic write + exit-code dispatcher.]
  - [x] 3.1 Module skeleton: shebang, strict mode, header docstring with exit codes (per AC1).
  - [x] 3.2 Constants: `DEFAULT_SKILLS`, `SKILL_DISPLAY` (mirrors Story 4.2 `PF1_AGENTS` for 5-skill set; canonical names per Story 4.3 CM-3 fix), default paths.
  - [x] 3.3 Imports: `fs`, `path`, `parseRecording` from `./pf1-validation-battery` (Decision 2), `findProjectRoot` from `../update/lib/utils` (Decision 4 path safety).
  - [x] 3.4 Implemented `lineDiff(a, b)` — LCS-based DP table + backtrack; pure; ~35 LOC.
  - [x] 3.5 Implemented `renderSidebySide(baselineSection, postSection)` — markdown table; pipe-escaping for content; "X lines changed of Y total" summary.
  - [x] 3.6 Implemented `loadSkillRecording(skill, dir, suffix)` — resolves `{dir}/{manifestSkill}-{suffix}.md` via `SKILL_DISPLAY[skill].manifestSkill` (or passthrough if not in map); throws `exitCode=2` on missing.
  - [x] 3.7 Implemented `renderSnapshot({skills, baselineDir, postDir, date})` — orchestrator with sorted-skills iteration; 8-key frontmatter; per-skill section + 4 prompt subsections.
  - [x] 3.8 Implemented `parseArgs(argv)` — minimal arg parser supporting all Decision 4 + AC4 flags. Default `--date` via `getTodayDate()` helper that honors `DRIFT_SNAPSHOT_TODAY_OVERRIDE` env (test-only escape hatch per OS-1 V-pass + Test 11).
  - [x] 3.9 Implemented `main()` — `parseArgs` → `checkPathSafety` (AC5) → `renderSnapshot` OR `renderAdhocSnapshot` (AC4 branch) → `atomicWrite` (temp+rename per AC5) → `process.exit(0)`. Try/catch dispatcher with `err.exitCode` pattern (codes 0/1/2/3/4/5/99).
  - [x] 3.10 Module guard `if (require.main === module) main();`. All 15 exports present after R2 (11 spec'd + `renderAdhocSnapshot` + `checkPathSafety` + `getTodayDate` + `resolveDefaultRelative` added in R2 for default-vs-cwd path resolution).
  - [x] 3.11 Ran tests: 11/11 GREEN. Smoke-tested CLI end-to-end: `node scripts/audit/drift-snapshot.js --skills emma --baseline-dir tests/fixtures/drift-snapshot --post-dir tests/fixtures/drift-snapshot --date 2026-04-26 --output _bmad-output/implementation-artifacts/drift-smoke-test.md` → exit 0, output renders correctly. Path-safety check empirically rejected `/tmp/drift-smoke.md` with exit 4 (verifies AC5).

- [x] **Task 4: Author operator protocol doc (~15 min).**
  - [x] 4.1 Created `_bmad-output/implementation-artifacts/v63-4-4-drift-snapshot-protocol.md` (~70 lines, slightly larger than spec's "~30 lines" estimate due to EO-2 V-pass concrete example + LL-1 explicit `--date` MANDATORY callout):
    - **When to run:** at release time, after Story 4.3 Task 5 (post-migration recordings captured) AND before Story 4.3 Task 7 (release record sign-off). Drift snapshot is a complement to the gate verdict, not a replacement.
    - **How to run (default 3-skill subset):** `node scripts/audit/drift-snapshot.js --date 2026-XX-XX --output _bmad-output/implementation-artifacts/v63-4-4-drift-snapshot-2026-XX-XX.md`. Pass explicit `--date` for filename + frontmatter consistency.
    - **How to run (5-agent expansion):** `node scripts/audit/drift-snapshot.js --skills emma,john,winston,carson,murat --date ... --output ...`.
    - **How to run (non-PF1 skill ad-hoc per EO-2 V-pass — concrete example):** for capturing drift on `bmad-enhance-initiatives-backlog` (FR39's first cited example):
      1. Manually capture pre-migration output: invoke `/bmad-enhance-initiatives-backlog` from convoke 3.x sandbox; paste agent's response into a file with 4 sections delimited by digit-only headers `## Prompt 1`/.../`## Prompt 4`. Save as `_bmad-output/pf1-baselines/bmad-enhance-initiatives-backlog-baseline.md`.
      2. Validate file passes Story 4.2 parser: `node -e "const b=require('./scripts/audit/pf1-validation-battery'); const fs=require('fs'); console.log(Object.keys(b.parseRecording(fs.readFileSync('_bmad-output/pf1-baselines/bmad-enhance-initiatives-backlog-baseline.md','utf8'))));"` — must print `[ 'Prompt 1', 'Prompt 2', 'Prompt 3', 'Prompt 4' ]`.
      3. Repeat steps 1–2 for post-migration in 4.0 sandbox; save as `_bmad-output/pf1-post-migration/bmad-enhance-initiatives-backlog-post.md`.
      4. Invoke ad-hoc pair mode: `node scripts/audit/drift-snapshot.js --input-pre _bmad-output/pf1-baselines/bmad-enhance-initiatives-backlog-baseline.md --input-post _bmad-output/pf1-post-migration/bmad-enhance-initiatives-backlog-post.md --date 2026-XX-XX --output _bmad-output/implementation-artifacts/v63-4-4-drift-snapshot-bmad-enhance-initiatives-backlog-2026-XX-XX.md`.
      Same digit-only header contract enforced (parser-reused per Decision 2). Operator may chain multiple ad-hoc invocations to cover all FR39 examples.
    - **Where artifact lives:** `_bmad-output/implementation-artifacts/v63-4-4-drift-snapshot-<date>.md`. Operator-committed alongside Story 4.3 release record.
    - **What to do with output:** review side-by-side for unexpected behavioral changes; surface concerns in retrospective notes (Epic 4 retro or Story 5B.2). NOT a release-blocking gate (FR39 is observation, not gate).
    - **Determinism caveat:** byte-identical re-run requires same `--date` + same input files; if recordings amended (Story 4.3 re-record), regenerate snapshot.
    - **Cross-reference:** Story 4.3 release record (`v63-4-3-release-record-4.0.md`) should cite the snapshot artifact path under "Retrospective observations" section.
  - [x] 4.2 Validated doc renders cleanly (markdown structure + cross-references).

- [x] **Task 5: Add `D-V44-1` to deferred-work.md (Decision 5 deferral; ~5 min).**
  - [x] 5.1 Appended D-V44-1 entry to `_bmad-output/implementation-artifacts/deferred-work.md` under new section "Deferred from: spec of v63-4-4-create-drift-snapshot-workflow (2026-04-26)":
    > **D-V44-1 — `/bmad-drift-snapshot` slash-command skill wrapper deferred per Decision 5** — Story 4.4 ships drift-snapshot as bare CLI per Story 4.2 PF1-tooling precedent (release-engineering tooling, not Convoke-user-facing). `slash-command-ux-for-user-facing-tools` rule technically applies but is overridden by precedent. **Trigger to lift deferral:** if a future v4.x retrospective surfaces operator friction with bare CLI invocation OR if Convoke users (not just maintainers) start needing drift-snapshot for their own skill development. **Fix scope:** ~50 LOC skill wrapper at `.claude/skills/bmad-drift-snapshot/SKILL.md` + workflow.md that delegates to `scripts/audit/drift-snapshot.js`. Time: ~30 min. → fast-lane Initiative-backlog item if triggered.

- [ ] **Task 6: HALT for operator — release-time execution (deferred until Story 4.3 release-time recordings exist).**
  - [ ] 6.1 **NOT executed at Story 4.4 dev-story time.** This task documents the release-time activity that consumes Story 4.3's recordings. Spec leaves checkbox unchecked at story-close.
  - [ ] 6.2 At release time (post-Story-4.3-Task-5), operator runs: `node scripts/audit/drift-snapshot.js --date $(date +%Y-%m-%d) --output _bmad-output/implementation-artifacts/v63-4-4-drift-snapshot-$(date +%Y-%m-%d).md`.
  - [ ] 6.3 Operator commits artifact alongside Story 4.3 release record.
  - [ ] 6.4 Operator reviews side-by-side, surfaces unexpected drift in retrospective notes.

- [x] **Task 7: Validation gates (AC6).**
  - [x] 7.1 `npm test` — post-R2: `tests 1492 / pass 1491 / skip 1 / fail 0` (+24 from baseline 1468; 11 tests at story-close + 8 R1 coverage tests + 5 R2 coverage tests).
  - [x] 7.2 `npm run test:integration` — `tests 93 / pass 93 / fail 0` unchanged.
  - [x] 7.3 `npm run lint` — clean; exit 0, zero warnings on `scripts/audit/drift-snapshot.js` + `tests/lib/drift-snapshot.test.js`.
  - [x] 7.4 `git status --porcelain` — AC7 scope verified: 5 NEW files (drift-snapshot.js, drift-snapshot.test.js, 6 fixtures dir, drift-snapshot-protocol.md, this story file) + 2 MODIFIED (deferred-work.md D-V44-1, sprint-status.yaml). Pre-existing `convoke-note-initiative-lifecycle-backlog.md` modification is operator-territory (out of Story 4.4 scope; predates story start).

## Dev Notes

**Decision rationales (compact):** D1 = reuse PF1 recordings (zero re-recording for operator); 3-skill default matches FR39 examples + leaves expansion via `--skills`. D2 = reuse Story 4.2 `parseRecording` (single source of truth for header contract). D3 = inline LCS line-diff (zero new deps; ~30 LOC standard algorithm). D4 = NFR32 determinism via no-timestamps-in-body + sorted iteration + atomic write. D5 = bare CLI per Story 4.2 PF1-tooling precedent; deferred slash-command wrapper as `D-V44-1`.

**Anti-patterns to avoid (top 5):**
- DON'T add `diff` / `jsdiff` npm dep — Decision 3 inline LCS is sufficient; new dep needs separate vetting.
- DON'T re-implement parseRecording — Decision 2 imports from Story 4.2; recording header contract is single-source.
- DON'T put timestamps / wall-clock / hostnames in output body — breaks NFR32 determinism (Decision 4).
- DON'T iterate `Object.entries()` or `fs.readdirSync()` without sort — Node iteration order is insertion-order (mostly stable) but cross-platform / cross-version drift risk; sort defensively.
- DON'T touch Stories 4.1/4.2 surfaces — D-V42-R3-1 fix happens in a separate amendment, not Story 4.4 (AC7 + EO-1 escape hatch).

**External dependencies + risk (compact):**

| ID | Risk | Mitigation |
|----|------|-----------|
| PR1 | LCS implementation has off-by-one bug | Test 3 covers identical / disjoint / mixed cases |
| PR2 | Determinism fails on filesystem iteration order | Sort defensively (Decision 4 + anti-pattern #4) |
| PR3 | `parseRecording` semantics shift (D-V42-R3-1 fix lands) | Decision 2 inversion handler — Story 4.4 inherits automatically |
| PR4 | Path-safety check too strict (refuses valid `_bmad-output/` paths) | Test the safety check against the project's actual `_bmad-output/` subtree |
| PR5 | `--input-pre`/`--input-post` ad-hoc files don't conform to digit-only header contract | AC4 + Task 4.1 protocol doc explicitly require contract conformance for ad-hoc files |

**Spike points:** None. Pure-function renderer + structural tests; no DEF-SPIKEs needed.

**Apply Epic 3 retro action items:**
- **PI-9 (`${PIPESTATUS[0]}`):** Task 6 release-time invocations don't pipe through `tee`; if operator wraps via tee, script's exit code is captured by checking `${PIPESTATUS[0]}`.
- **PI-10 (Edge Case Hunter):** code-review at story close MUST include Edge Case Hunter layer (LCS edge cases: empty inputs, single-line, identical inputs, disjoint inputs).
- **PI-11 (DEF-SPIKE inversion handling):** N/A — no DEF-SPIKEs. Decision 1 + 3 + 5 each have inversion handlers documented.
- **PI-12 (spec spot-check rubric audit):** AC1-AC7 each pin verifiable assertions.

**Inheritance from Stories 4.1, 4.2, 4.3:**
- Story 4.1: format/structure conventions for spec; exit-code dispatcher pattern (CM-7 fix from Story 4.1 R1).
- Story 4.2: `parseRecording` import (Decision 2); atomic temp-file-then-rename pattern (AC5); structural-only test surface (Decision 5 implies); 14 exports + `## Prompt N` header contract.
- Story 4.3: 5 PF1 agents canonical names (Decision 1 reuses 3); Decision 5 release-engineering-bare-CLI precedent.

**Story 4.4 is fundamentally a small renderer + protocol** — ~150-200 LOC + 8-10 tests + ~30-line protocol doc. Smaller than Story 4.2 (~400-500 LOC); larger than Story 4.1 calibration (~250 LOC). Time: ~2hr dev-story execution.

**TI-9 cron-durability:** N/A — no scheduled actions.

## Change Log

- 2026-04-26 — Story 4.4 created via `/bmad-create-story v63-4-4`. 7 ACs + 5 Decisions + 8 Tasks + 5 PR risks. Pure-function renderer + protocol; reuses Story 4.2 `parseRecording` + Story 4.3's PF1 recordings (release-time). Bare-CLI per Story 4.2 precedent (slash-command wrapper deferred as `D-V44-1`).
- 2026-04-27 — Story 4.4 R1+R2 code-review converged via `/bmad-code-review`. **R1 batch-applied 14 patches + 5 deferred + 1 dismissed** (~31 raw → 14 net): 3 HIGH (CR-H1 parseArgs flag-without-value crash → exitCode=5; CR-H2 CRLF normalization for cross-platform NFR32; CR-H3 `fs.realpathSync` symlink defense in path-safety) + 8 MED (CR-M1 path-safety on read-paths; CR-M2 unknown skill-key validation; CR-M3 success → stdout per UNIX convention; CR-M4 lineDiff empty-string short-circuit; CR-M5 trailing-newline strip; CR-M6 Test 11 try/finally hygiene; CR-M7 renderAdhocSnapshot dual-name heading; CR-M8 skill dedup via Set; CR-M9 XOR validation on `--input-pre`/`--input-post`) + 3 LOW (CR-L2 backtick escape; CR-L3 Test 2 expanded to 14 exports; CR-L6 `--date` regex). Tests 12-19 added (+8). All gates green: 1487/1486/1/0. **R2 mandatory per convergence rule (R1 had HIGHs)**. **R2 batch-applied 10 patches + 4 deferred + 0 dismissed** (~16 raw → 10 net): 1 HIGH (R2-H1 findProjectRoot null-guard) + 6 MED (R2-M1 backtick HTML-entity escape — backslash escapes don't work inside CommonMark code spans; R2-M2 reject `--`-prefixed value — `--output --date` swallow; R2-M3 emit `skills:` as 2-entry list for mismatched ad-hoc filenames; Edge R2-M1 resolveDefaultRelative against findProjectRoot vs cwd; Edge R2-M2 `--date` semantic round-trip rejects `2026-13-32`; Edge R2-M4 sanitize ad-hoc filenames against `/^[A-Za-z0-9._-]+$/`) + 3 LOW (R2-L1 align +/- prefix with unchanged; Auditor R2-L1 Task 3.10 typo "13" → "15"; Auditor R2-L2 AC6.1 test count update). Tests 20-24 added (+5). **R3 NOT triggered** per convergence rule (R2 patches additive: guards/sanitizers/validators; no new files, no renamed functions, no fundamentally altered control flow). Final cumulative: 24 patches across 2 rounds (14 R1 + 10 R2) + 9 deferred (5 R1 + 4 R2). **All gates green:** unit 1492/1491/1/0 (+24 from baseline 1468; 11 + 8 R1 + 5 R2); integration 93/93 unchanged; lint clean. v6.3 progress: **19/29 stories shipped + 1 ready** (Story 4.3 release-time-deferred; Story 4.4 done).
- 2026-04-27 — Story 4.4 dev-story executed via `/bmad-dev-story` (autonomous single-session). All 7 ACs MET; all 8 Tasks executed (Task 6 release-time-deferred per spec design — checkboxes intentionally unchecked at story-close, matching Story 4.3 pattern); all gates GREEN. **Final shape:** 5 NEW files (~280 LOC drift-snapshot.js + 11-test test file + 6 canonical-name fixtures + ~70-line protocol doc + this story file) + 2 MODIFIED (deferred-work.md D-V44-1, sprint-status.yaml). **Test deltas:** unit 1468 → 1479 (+11); integration 93/93 unchanged; lint clean. **Decision validations during dev:** D1 reuse (3-skill default + ad-hoc pair mode for non-PF1 skills); D2 parseRecording reused from Story 4.2 (no re-implementation); D3 inline LCS ~35 LOC (no new dep); D4 8-key frontmatter + sorted iteration + atomic temp-rename + DRIFT_SNAPSHOT_TODAY_OVERRIDE test-only escape hatch; D5 bare CLI (slash-command wrapper deferred as D-V44-1). **Smoke-test verified end-to-end** (Emma fixture pair → rendered side-by-side markdown with correct diff markers; path-safety check empirically rejected `/tmp` output with exit 4). **Test 11 OS-1 V-pass NFR32 midnight-crossing guard PASSES** — silent default-date failure mode is detectable. Ready for `/bmad-code-review`.
- 2026-04-26 — V-pass batch-applied **6 improvements** (2 critical + 2 enhancement + 1 optimization + 1 LLM-opt) via spec-rewrite. **Empirical probes 14/15 PASS + 1 CAUGHT-DEFECT** (slash-command-ux deferral rationale gap — promoted to enhancement, not critical). **2 critical caught silent-failure-risk defects:** CM-1 (D-V42-R3-1 surface bug from Story 4.2 `--dry-run` silent-exit-0 — added release-time-conditional caveat in Upstream Dependencies; not a dev-story blocker since Story 4.4 unit tests use synthetic fixtures + don't invoke battery, but documented in case operator pipelines drift-snapshot AFTER battery dry-run); CM-2 (AC5 path-safety redundant `_bmad-output/` parenthetical removed — `_bmad-output/` IS under `findProjectRoot()`; tightens contract). Other improvements: EO-1 (Decision 5 deferral rationale grounded in operator/user distinction from Operator Covenant); EO-2 (Task 4.1 protocol doc — added concrete `bmad-enhance-initiatives-backlog` ad-hoc invocation example with parser-validation step); **OS-1 (Test 11 added — NFR32 midnight-crossing guard** — invokes renderer twice without `--date` to surface silent default-date non-determinism; new `process.env.DRIFT_SNAPSHOT_TODAY_OVERRIDE` test-only escape hatch in Task 3.8 enables test without mocking `Date`); LL-1 (`--date` rationale consolidated to Decision 4 with explicit "load-bearing arg per LL-1 V-pass" callout + cross-references; removed redundancy across Task 3.8 + Task 4.1). Test count delta: 8-10 → 9-11 (+1 Test 11). **Final spec:** 7 ACs + 5 Decisions + 8 Tasks + 5 PR risks + 9-11 unit tests. Story remains ready-for-dev. **V-pass ROI:** prevented 1 silent-failure-mode (Test 11 closes NFR32 default-date gap) + tightened 1 path-safety contract + grounded 2 design decisions in project axioms (Decision 5 + Decision 4 LL-1). Lower ROI than Story 4.3's 8/10 empirical-probe defect catch (greenfield + small surface = fewer defect vectors); but Test 11 is non-trivial — it surfaces a release-time silent-failure path the spec author missed (operator-forgets-`--date` flag scenario).

## Dev Agent Record

### Agent Model Used

claude-opus-4-7 (1M context window, Claude Code CLI dev-story session 2026-04-26 → 2026-04-27).

### Debug Log References

- **Task 0 pre-flight gates (4/4 PASS):** parseRecording importable (function); clean slate; npm test 1468/1467/1/0; lint clean.
- **Task 1 fixtures:** Initially authored with short-name files (`emma-baseline.md` etc.); renamed via `mv` to canonical manifest skill names (`bmad-agent-bme-contextualization-expert-baseline.md` etc.) to match `loadSkillRecording` filename contract per Decision 1 + Story 4.3 CM-3. 6 fixtures total; all parser-validated `["Prompt 1","Prompt 2","Prompt 3","Prompt 4"]`.
- **Task 2 RED phase:** All 11 tests failed with `MODULE_NOT_FOUND` for `drift-snapshot.js` — verifies tests are testing-something.
- **Task 3 GREEN phase:** ~280 LOC actual (slightly above spec's 150-200 estimate due to ad-hoc pair mode + path-safety + atomic write + exit-code dispatcher being more substantive than the spec implied). 11/11 tests GREEN. Smoke-tested CLI end-to-end against fixture dir; rendered correctly with diff markers (` `/`-`/`+`); path-safety check empirically rejected `/tmp` output (exit 4).
- **Task 7 validation gates (4/4 PASS):** unit 1479/1478/1/0 (+11); integration 93/93 unchanged; lint clean; scope verified.

### Completion Notes List

- **All 7 ACs MET.** AC1 file + 14 exports (11 spec'd + `renderAdhocSnapshot` + `checkPathSafety` + `getTodayDate`); AC2 lineDiff LCS-correct + pure (Tests 3+4); AC3 renderSnapshot 8-key frontmatter + sorted iteration + byte-identical re-run (Tests 5+6+7); AC4 ad-hoc pair mode supported (Test 10); AC5 atomic write + path-safety check verified empirically; AC6 all gates green; AC7 scope discipline maintained.
- **Test 11 (OS-1 V-pass NFR32 midnight-crossing guard) PASSES** — confirms the silent default-date failure mode is detectable. Operator-facing protocol doc (Task 4) MANDATES explicit `--date` to avoid hitting the failure path.
- **Task 6 release-time-deferred per spec design** — checkboxes intentionally left unchecked at story-close per spec Task 6.1 ("Spec leaves checkbox unchecked at story-close"). Task 6 is a documentation of the future release-time activity, not a dev-story execution step. This is by spec design, not an oversight; matches Story 4.3's release-time-deferred task pattern.
- **Decision 5 deferral logged:** D-V44-1 added to deferred-work.md (`/bmad-drift-snapshot` slash-command wrapper deferred per Story 4.2 PF1-tooling precedent grounded in Operator Covenant operator/user distinction).
- **Code follows project conventions:** `node:test` + `node:assert/strict` (NEVER Jest per C1); `findProjectRoot` from utils (no `process.cwd()`); atomic temp-file-then-rename; exit-code dispatcher via `err.exitCode`; sorted iteration for determinism; pure functions where possible.
- **Empirical inheritance from Story 4.2:** `parseRecording` import works as expected; digit-only `## Prompt N` header contract enforced; same atomic-write pattern.

### File List

**NEW (5):**
- `scripts/audit/drift-snapshot.js` (~280 LOC) — main renderer + CLI orchestration
- `tests/lib/drift-snapshot.test.js` (11 structural tests)
- `tests/fixtures/drift-snapshot/bmad-agent-bme-contextualization-expert-baseline.md`
- `tests/fixtures/drift-snapshot/bmad-agent-bme-contextualization-expert-post.md`
- `tests/fixtures/drift-snapshot/bmad-agent-pm-baseline.md`
- `tests/fixtures/drift-snapshot/bmad-agent-pm-post.md`
- `tests/fixtures/drift-snapshot/bmad-agent-architect-baseline.md`
- `tests/fixtures/drift-snapshot/bmad-agent-architect-post.md`
- `_bmad-output/implementation-artifacts/v63-4-4-drift-snapshot-protocol.md` (~70 lines, operator protocol)

**MODIFIED (2):**
- `_bmad-output/implementation-artifacts/deferred-work.md` (added D-V44-1 entry under new "Deferred from: spec of v63-4-4" section)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (status transitions + last_updated narrative; will become `review` at Step 9)

**MODIFIED (this story file):**
- `_bmad-output/implementation-artifacts/v63-4-4-create-drift-snapshot-workflow.md` (Tasks/Subtasks checkboxes [x], Status `review`, Dev Agent Record + File List + Change Log)
