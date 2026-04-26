---
initiative: convoke
artifact_type: story
qualifier: v63-4-2-create-pf1-validation-battery-harness
created: '2026-04-26'
schema_version: 1
epic: v63-epic-4
---

# Story 4.2: Create PF1 validation battery harness

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

**Epic:** [Epic 4 — Validated Behavioral Equivalence](../planning-artifacts/convoke-epic-bmad-v6.3-adoption.md#epic-4-validated-behavioral-equivalence)
**Sprint:** 4 (PF1 stream — second story; runs independent of FM4-2 spike per Story 4.1 §"Why FM4-2 is NOT a blocker")
**FR coverage:** FR36 (PF1 judge prompt versioned; reuses Story 4.1's prompt), FR38 (battery orchestrates 5 agents × 4 prompts × 3 judge runs), FR45 (per-input PASS/FAIL record).
**NFR coverage:** NFR3 (PF1 ≤15 min per cycle), NFR21 (per-input PASS/FAIL record), NFR30 (median-of-N for variance reduction; same FM4-1 pattern as Story 4.1).
**Failure modes addressed:** FM4-1 (judge variance — median of N runs); FM4-3 partial (4 prompts include deep workflow entry per arch:351). FM7-2 mitigation INHERITED from Story 4.1 (calibration evidence is the regression baseline; this harness consumes the same calibration-passed prompt).

**Why FM4-2 is NOT a blocker for Story 4.2:** FM4-2 is about **agent-output recording** (Story 4.3's territory — does Claude Code CLI support non-interactive prompt input). Story 4.2 BUILDS the battery harness that CONSUMES recordings; it doesn't produce them. If FM4-2 reveals non-scriptable, Story 4.3's recording phase falls back to manual but Story 4.2's harness runs unchanged either way.

**Upstream dependencies:**
- **Story 4.1 (DONE)** — judge prompt at `scripts/audit/pf1-judge-prompt.md` (calibration-passed at median 5/2 zero-variance) + reusable helpers exported from `scripts/audit/pf1-judge-calibration.js`. Verified at spec-author time: 12 exports including `extractText`, `parseScore`, `medianOf`, `loadPromptTemplate`, `formatResponseBlockquote`, `truncateResponse`, `JUDGE_MODEL`, `PROMPT_PATH`.
- **Architecture Decision 4** (`convoke-arch-bmad-v6.3-adoption.md:340-378`) — pins 4-stage pipeline + 1-5 score scale + T=4.0 threshold + 5 agents × 4 prompts × median-of-3 contract.
- **No new external dependencies** — Anthropic SDK already in `devDependencies` from Story 4.1.

**Downstream consumers:**
- **Story 4.3** (`v63-4-3-execute-pf1-validation-cycle-record-compare-and-gate`) — RUNS this harness pre/post migration; provides actual `_bmad-output/pf1-baselines/` + `_bmad-output/pf1-post-migration/` recordings. Story 4.3 forward-pointer: `_bmad/_config/agent-manifest.csv` is missing 3 of 5 PF1 agents (Story 4.3 may need to extend it).
- **Convoke 4.0 publication gate** — PF1 PASS verdict is M9 release gate per Story 4.3 AC.

**Namespace decision:** all artifacts under `scripts/audit/` + `tests/lib/` + `tests/fixtures/pf1-battery/` + `_bmad-output/implementation-artifacts/v63-4-2-*` (Convoke namespace). NOT a `_bmad/bme/` skill — covenant-compliance-checklist N/A.

## Story

As Convoke maintainer (Amalik) preparing the v4.0 release validation infrastructure,
I want **a reusable PF1 validation battery harness** at `scripts/audit/pf1-validation-battery.js` that orchestrates the full 60-call judge pipeline (5 agents × 4 prompts × 3 judge runs / median) against pre-recorded baseline + post-migration outputs and produces a PASS/INVESTIGATE/FAIL verdict per arch Decision 4 gate logic,
so that Story 4.3 can execute the validation cycle pre/post migration with a tested orchestrator + the M9 release gate has automated, repeatable behavioral-equivalence enforcement.

**Story shape:** code-authoring (NEW battery harness ~400-500 LOC + structural unit tests + sample fixture data + spec file). Reuses Story 4.1's hardened helpers via `require()`. Operator-invoked, NOT in CI (same Decision 2 boundary as Story 4.1).

**Empirical baseline (probed 2026-04-26 + V-pass-confirmed):**

| Probe | Result |
|-------|--------|
| Story 4.1 helper exports (all 12 names) | ✓ — `extractText`, `parseScore`, `medianOf`, `loadPromptTemplate`, `formatResponseBlockquote`, `truncateResponse`, `JUDGE_MODEL`, `PROMPT_PATH`, plus 4 calibration-specific |
| Helper behavior (parseScore/medianOf/extractText/loadPromptTemplate) | ✓ — `parseScore('SCORE: 4')=4`; `medianOf([5,5,4])=5`; `medianOf([4,5,4,5])=4.5` (even N → float, see CM-2 below); `loadPromptTemplate` works against current prompt |
| 5 PF1 agents in `_bmad/_config/skill-manifest.csv` | ✓ — Emma `pipeline`; John/Winston/Carson `standalone`; Murat `standalone`; Isla fallback `standalone` |
| `_bmad-output/pf1-baselines/` + `_bmad-output/pf1-post-migration/` | ✓ — both absent (clean slate; Story 4.3 creates) |
| `scripts/audit/pf1-validation-battery*` + `tests/fixtures/pf1-battery*` | ✓ — both absent (clean slate for Story 4.2) |
| `npm test` baseline | ✓ — `tests 1455 / pass 1454 / skip 1 / fail 0` |
| `npm run test:integration` baseline | ✓ — `tests 93 / pass 93 / fail 0` |
| `package.json` SDK pin | ✓ — `@anthropic-ai/sdk: ^0.91.1` |
| `require('./pf1-judge-calibration')` does NOT trigger `main()` | ✓ — `if (require.main === module) main()` guard correct |

## Acceptance Criteria

### Decisions (pinned at spec-author time; defensible at dev-time)

**Decision 1 — Reuse Story 4.1 helpers via `require()`; defer extraction.** Import `extractText`, `parseScore`, `medianOf`, `loadPromptTemplate`, `formatResponseBlockquote`, `truncateResponse`, `JUDGE_MODEL`, `PROMPT_PATH` from `./pf1-judge-calibration`. Keeps Story 4.1's R1+R2-converged surface untouched (refactor risk > correctness gain). `D-V42-1` defers shared-module extraction to follow-up.

**Decision 2 — Operator-invoked, NOT in CI.** Same boundary as Story 4.1: API costs + non-determinism + key-security. CI guarantee = structural-only unit tests (10 tests). Live runs are Story 4.3.

**Decision 3 — 5 PF1 agents pinned per arch:347.** Constant `PF1_AGENTS` maps display name → manifest skill:

| Display | Manifest skill | Tier |
|---|---|---|
| Emma | `bmad-agent-bme-contextualization-expert` | pipeline |
| John | `bmad-agent-pm` | standalone |
| Winston | `bmad-agent-architect` | standalone |
| Carson | `bmad-cis-agent-brainstorming-coach` | standalone |
| Murat | `bmad-tea` | standalone |

Cross-tier (Emma `pipeline`, others `standalone`) is acceptable — PF1's behavioral-testing scope ≠ FR25's distribution scope. Per-agent recording at `_bmad-output/pf1-baselines/{skill}-baseline.md` + `_bmad-output/pf1-post-migration/{skill}-post.md`. **DS3 inversion fallback (pinned):** Emma → Isla (`bmad-agent-bme-discovery-empathy-expert`, verified `standalone`); other agents have no defined fallback (operator decision at dev-time). **Story 4.3 forward-pointer:** `_bmad/_config/agent-manifest.csv` is missing 3 of 5 PF1 agents — Story 4.3 may need to extend it for recording-step automation.

**Decision 4 — 4 prompts pinned per arch:348-352.** Constant `PF1_PROMPTS = ['Prompt 1: Activation greeting + menu', 'Prompt 2: First capability invocation', 'Prompt 3: Follow-up question', 'Prompt 4: Multi-step workflow entry']`. Labels match the markdown headers (`## Prompt 1`/.../`## Prompt 4`) in recording files for parser symmetry. Operator (Story 4.3) records each per-agent file with these 4 sections.

**Decision 5 — Go/no-go gate logic per arch:362-368** — boundary-clarified:
- **PASS:** average median across 5 agents `>= 4.0` AND no single agent's median `> 2` (lowest > 2; i.e., min agent median strictly above 2).
- **INVESTIGATE:** average `>= 4.0` AND lowest agent median `<= 2` (single-agent regression worth investigating).
- **FAIL:** average `< 4.0` (broad behavioral degradation).

**Boundary-case callout:** PASS-with-low (e.g., avg 4.4, Murat 2.5) ships per Decision 5 — counterintuitive but matches arch:362-368. Operator may prefer to override; gate verdict is reported faithfully, ship-decision is operator-owned.

**Per-agent aggregation** (arch:348-352 ambiguous on 4-prompt aggregation): use **median of 4 prompt-medians** (not average). Median is more robust to single-prompt outlier; avoids one bad prompt-pair dragging the agent's score below threshold. Cross-ref arch comment in code; if arch later clarifies preference, swap to average is 1-line change.

---

**AC1 — `scripts/audit/pf1-validation-battery.js` exists with expected exports + structure.**
**Given** Story 4.2 dev-story complete
**When** the file is inspected
**Then**:
- File exists at `scripts/audit/pf1-validation-battery.js`. CommonJS module.
- Top-of-file constants present + EXPORTED for testability: `PF1_AGENTS` (5-entry array of `{display, skill}` objects), `PF1_PROMPTS` (4-entry array of prompt-LABEL strings matching `## Prompt N` headers), `RUNS_PER_AGENT = 3` (matches Story 4.1's `RUNS_PER_PAIR` per FM4-1 + arch:359), `BASELINE_DIR`, `POST_MIGRATION_DIR`, `RESULTS_PATH` (default; env-overridable per AC2), `GATE_THRESHOLDS = { passAvg: 4.0, investigateLowAgent: 2 }`.
- Imports `extractText`, `parseScore`, `medianOf`, `loadPromptTemplate`, `formatResponseBlockquote`, `truncateResponse`, `JUDGE_MODEL`, `PROMPT_PATH` from `./pf1-judge-calibration`.
- Functions exported (testability per O1): `parseRecording(text)` → `{[promptLabel]: responseText}`; `loadAgentRecordings(agent, baselineDir, postMigrationDir)`; `runJudgePairs(client, promptTemplate, baselineText, postText, n)`; `computeGate(agentMedians)` → `{verdict, avg, lowestAgent, lowestMedian, reasoning}`; `writeResults(resultsPath, allResults, judgeModel, gate, totalApiCalls, startTime, endTime)`.
- Header docstring includes exit-code reference table (codes 0/1/2/3/4/99).
- Flags: `--dry-run` (validates recording dirs + parses + renders ALL 20 prompt-pairs without API calls), `--verbose` (per-call timing log to stderr).

**AC2 — Battery harness produces PASS/INVESTIGATE/FAIL verdict per arch Decision 4.**
**Given** AC1 + valid recordings in `_bmad-output/pf1-baselines/` (5 files) + `_bmad-output/pf1-post-migration/` (5 files) + `ANTHROPIC_API_KEY` env var set
**When** operator runs `node scripts/audit/pf1-validation-battery.js`
**Then**:
- Script reads judge prompt via `loadPromptTemplate(PROMPT_PATH)` (reuses Story 4.1's calibration-passed prompt).
- Script iterates: 5 agents × 4 prompts × 3 judge runs = **60 API calls total** (sequential per Story 4.1 pattern; rate-limit safe at Anthropic tier-1 50 RPM).
- Per pair: `runJudgePairs(client, promptTemplate, baseline, post, RUNS_PER_AGENT)` → median-of-3 per `{agent, prompt}` pair. Aggregated per Decision 5: per-agent score = median of 4 prompt-medians.
- `computeGate(agentMedians)` → verdict per Decision 5 contract.
- `writeResults(...)` → atomic-temp-rename to `RESULTS_PATH` (per Story 4.1 P-C7; `<path>.tmp` → `fs.renameSync`). Auto-create directory via `fs.mkdirSync(dirname, {recursive: true})` to support env-overridden paths.
- **Exit codes (split per CM-6):** `0` PASS · `1` INVESTIGATE · `2` FAIL · `3` parse failure · `4` API failure · `5` fixture missing · `99` unhandled bug. Story 4.3 release-gate scripts can distinguish ship-vs-investigate-vs-fail without parsing results file. Inherits Story 4.1's `err.exitCode`-tagged dispatcher pattern (catch handler honors only `err.exitCode`).
- **`RESULTS_PATH` env override:** `PF1_BATTERY_RESULTS_PATH` env var (if set) overrides default `_bmad-output/implementation-artifacts/v63-4-2-battery-results.md`. Story 4.3 uses this for timestamped per-cycle results (e.g., `_bmad-output/pf1-validation-results/cycle-{date}.md`). Override applies in main() only; tests use the default.

**AC3 — Per-agent recording files use defined layout for parsing.**
**Given** AC1 invocation
**When** recordings are loaded via `loadAgentRecordings()`
**Then**:
- Recording files at `_bmad-output/pf1-baselines/{skill}-baseline.md` + `_bmad-output/pf1-post-migration/{skill}-post.md` (`{skill}` = manifest skill name; e.g., `bmad-agent-architect-baseline.md`).
- Each file contains EXACTLY 4 sections delimited by `## Prompt 1`, `## Prompt 2`, `## Prompt 3`, `## Prompt 4` headers (1-indexed). **Parser hardened against agent-quoted "## Prompt N" via lookahead** (CM-4 fix): `parseRecording` uses `/^## Prompt (\d+)\b(?=[^\n]*$)/gm` to anchor matches to header lines only (not inline text); validates `Object.keys(result).length === 4` AND keys are exactly `['Prompt 1', 'Prompt 2', 'Prompt 3', 'Prompt 4']`. If `<4` sections OR `>4` sections OR wrong labels, throw `Object.assign(new Error('Recording <path> has wrong section structure: expected exactly 4 [Prompt 1..Prompt 4], got [<actual>]'), { exitCode: 5 })`.
- Recording-file format documented in this spec; Story 4.3 produces files conforming to this layout.

**AC4 — Results artifact `v63-4-2-battery-results.md` records per-agent + per-prompt + verdict.**
**Given** AC2 PASS/INVESTIGATE/FAIL run
**When** results artifact is inspected
**Then**:
- File exists at `RESULTS_PATH` (default: `_bmad-output/implementation-artifacts/v63-4-2-battery-results.md`; env-overrideable per AC2).
- Frontmatter (**11 keys** — CM-1 fix; consistent count throughout spec): `initiative: convoke`, `artifact_type: validation-results`, `story: v63-4-2-...`, `gate_verdict: PASS|INVESTIGATE|FAIL`, `avg_median: <float>`, `lowest_agent: <skill-name>`, `lowest_median: <float>` (CM-2: even-N median returns float per `medianOf([4,5,4,5])=4.5`; type is float not int), `judge_model: <model-id>`, `created: <YYYY-MM-DD>`, `total_api_calls: <int>` (default 60 = 5 × 4 × 3), `wall_clock_seconds: <float>` (NFR3 measurement per EO-2).
- Body contains: (a) **Gate verdict + reasoning** opening section; (b) **Per-agent table** (5 rows: display, skill, per-prompt medians [4 values], agent median, agent verdict); (c) **Per-prompt detail** (20 sub-sections — 5 agents × 4 prompts — each with 3 individual scores + median + first 500 chars of each judge response per Story 4.1 truncation pattern); (d) **NFR3 timing record** (`startTime`, `endTime`, total wall-clock + per-call mean/min/max).
- Atomic write: `<resultsPath>.tmp` → `fs.renameSync` per Story 4.1 P-C7. Pre-write `fs.mkdirSync(dirname, {recursive: true})` for env-overridden paths (EO-4).
- Frontmatter self-check: all 11 keys present + non-empty before write; HALT exit 99 with key name in error.

**AC5 — Validation gates green + structural-only CI unit tests for harness logic.**
- [ ] 5.1 `npm test` adds **10 new unit test cases** in `tests/lib/pf1-validation-battery.test.js` (structural-only — no live API). Final unit count: **`tests 1455 / pass 1454 / skip 1 / fail 0` → `tests 1465 / pass 1464 / skip 1 / fail 0`**. Test cases:
  1. battery script exists at `scripts/audit/pf1-validation-battery.js`.
  2. required exports present (PF1_AGENTS, PF1_PROMPTS, RUNS_PER_AGENT, GATE_THRESHOLDS, parseRecording, computeGate, runJudgePairs, loadAgentRecordings, writeResults).
  3. PF1_AGENTS has 5 entries matching Decision 3 (display + skill + tier mapping).
  4. PF1_PROMPTS has 4 entries with `Prompt N: <description>` shape; each begins with literal `Prompt 1:` / `Prompt 2:` / `Prompt 3:` / `Prompt 4:` substring.
  5. **JUDGE_MODEL invariant triangle (CM-5 + EO-5 fix):** assert `JUDGE_MODEL` constant in `pf1-validation-battery.js` (imported from calibration) === `JUDGE_MODEL` exported from `pf1-judge-calibration.js` === `judge_model` value in `pf1-judge-prompt.md` frontmatter. Concrete assertion: 3-way equality across all sources.
  6. parseRecording correctly extracts 4 sections from `tests/fixtures/pf1-battery/sample-baseline.md` with `## Prompt 1`/.../`## Prompt 4` headers.
  7. parseRecording throws with `exitCode: 5` when fewer than 4 prompt sections present (3-section synthetic input).
  8. computeGate returns PASS for `{Emma: 5, John: 5, Winston: 5, Carson: 5, Murat: 5}` → avg 5.0, lowestMedian 5 > 2.
  9. computeGate returns INVESTIGATE for `{Emma: 5, John: 5, Winston: 5, Carson: 5, Murat: 2}` → avg 4.4 ≥ 4.0, lowestMedian 2 ≤ 2.
  10. computeGate returns FAIL for `{Emma: 3, John: 3, Winston: 3, Carson: 3, Murat: 3}` → avg 3.0 < 4.0.
- [ ] 5.2 `npm run test:integration` baseline unchanged: `tests 93 / pass 93 / fail 0`.
- [ ] 5.3 `npm run lint` clean across `scripts/audit/pf1-validation-battery.js` + `tests/lib/pf1-validation-battery.test.js`.
- [ ] 5.4 `git diff HEAD --stat` confirms scope = exactly the AC6 file set.

**AC6 — Scope discipline.**
- IN scope (NEW files — 5):
  - `scripts/audit/pf1-validation-battery.js` (AC1+AC2; ~400-500 LOC).
  - `tests/lib/pf1-validation-battery.test.js` (AC5.1; 10 structural tests).
  - `tests/fixtures/pf1-battery/sample-baseline.md` + `tests/fixtures/pf1-battery/sample-post.md` (AC5.1 Tests 6-7 — synthetic 4-section markdown for parser tests).
  - `_bmad-output/implementation-artifacts/v63-4-2-create-pf1-validation-battery-harness.md` (this story file).
- IN scope (MODIFIED — 1):
  - `_bmad-output/implementation-artifacts/sprint-status.yaml` — status transitions: `v63-4-2-create-pf1-validation-battery-harness` `backlog → ready-for-dev → in-progress → review → done`.
- MUST NOT touch: `scripts/audit/pf1-judge-prompt.md` (Story 4.1 prompt — calibration-passed); `scripts/audit/pf1-judge-calibration.js` (Story 4.1 R1+R2-converged surface — Decision 1 defers refactor); `tests/fixtures/pf1-calibration/`; `tests/lib/pf1-judge-prompt.test.js`; `package.json`/`package-lock.json` (no new deps); any `_bmad/` files.

**Path safety analysis (per `path-safety-for-destructive-ops` rule):** N/A. Atomic temp-rename pattern (non-destructive); no `rm` / no recursive ops. Env-overridable `RESULTS_PATH` falls under operator control + `fs.mkdirSync(dirname, {recursive: true})` is non-destructive (creates only); writes occur only at `<RESULTS_PATH>.tmp` → `<RESULTS_PATH>`.

## Tasks / Subtasks

- [x] **Task 0: Pre-flight gates.**
  - [ ] 0.1 Confirm green baseline: `npm test 2>&1 | tail -5` AND `npm run test:integration 2>&1 | tail -5` show `tests 1455 / pass 1454 / skip 1 / fail 0` and `tests 93 / pass 93 / fail 0`. If counts differ, surface drift.
  - [ ] 0.2 Verify Story 4.1 helpers importable: `node -e "const m = require('./scripts/audit/pf1-judge-calibration'); console.log(Object.keys(m).join(','))"` returns 12 exports including `PROMPT_PATH`. If missing, surface — Decision 1 reuse breaks.
  - [ ] 0.3 Verify clean slate: `ls scripts/audit/pf1-* tests/lib/pf1-* tests/fixtures/pf1-* 2>/dev/null` shows 4 Story 4.1 items + ZERO `pf1-validation-battery*` / `pf1-battery*` (clean for Story 4.2).
  - [ ] 0.4 ANTHROPIC_API_KEY check: NOT required for Story 4.2 (Decision 2 — no live API in any task). Story 4.3 will require.

- [x] **Task 1: DEF-SPIKE — verify reusable helpers + agent manifest stability (PI-11 inversion handling).**
  - [ ] 1.1 **DS1: Story 4.1 helpers stability.** Re-import all 8 reusable helpers (the 7 original + `PROMPT_PATH`); spot-check `parseScore('SCORE: 4')===4`, `medianOf([5,5,4])===5`, `medianOf([4,5,4,5])===4.5`. **Inversion handler:** if any helper signature/behavior changed, HALT — Decision 1 reuse breaks; surface spec amendment.
  - [ ] 1.2 **DS2: 5 PF1 agents in manifest.** Run:
    ```
    node -e "const { readManifest } = require('./scripts/portability/manifest-csv'); const { rows, header } = readManifest('_bmad/_config/skill-manifest.csv'); const tierIdx = header.indexOf('tier'); const nameIdx = header.indexOf('name'); ['bmad-agent-bme-contextualization-expert','bmad-agent-pm','bmad-agent-architect','bmad-cis-agent-brainstorming-coach','bmad-tea','bmad-agent-bme-discovery-empathy-expert'].forEach(n => { const r = rows.find(r => r[nameIdx]===n); console.log(n, r ? r[tierIdx] : 'MISSING'); })"
    ```
    Expected: 5 PF1 agents present (Emma `pipeline`; others `standalone`) + Isla fallback `standalone`. **Inversion handler:** if Emma missing, fall back to Isla per Decision 3; if any other primary missing, surface.
  - [ ] 1.3 **DS3: Recording-dir clean slate.** `ls _bmad-output/pf1-baselines/ _bmad-output/pf1-post-migration/ 2>/dev/null`. Both should return "No such file or directory". If either has content, surface — earlier work overlaps.

- [x] **Task 2: Author `scripts/audit/pf1-validation-battery.js` core (AC1).**
  - [ ] 2.1 Create file with header docstring including exit-code reference table (codes 0/1/2/3/4/5/99 per AC2). Copy from Story 4.1 calibration-script header pattern with battery-specific wording.
  - [ ] 2.2 Define top-of-file constants per AC1 list. PF1_PROMPTS array uses `Prompt N: <description>` shape (matches headers).
  - [ ] 2.3 Import shared helpers: `const { extractText, parseScore, medianOf, loadPromptTemplate, formatResponseBlockquote, truncateResponse, JUDGE_MODEL, PROMPT_PATH } = require('./pf1-judge-calibration');`. PROMPT_PATH IS exported (verified via probe; Task 0.2 re-confirms).
  - [ ] 2.4 Implement `parseRecording(text)` per AC3 (CM-4 fix): regex `/^## Prompt (\d+)\b/m` (or split-by-section approach with `\n## Prompt ` lookahead). Build `{[label]: section-text}` keyed `'Prompt 1'`/.../`'Prompt 4'`. Validate exactly 4 keys + correct labels; throw `Object.assign(new Error('Recording <path> has wrong section structure: expected exactly 4 [Prompt 1..Prompt 4], got [<actual>]'), { exitCode: 5 })` on mismatch.
  - [ ] 2.5 Implement `loadAgentRecordings(agent, baselineDir, postMigrationDir)`: read `<baselineDir>/<agent.skill>-baseline.md` + `<postMigrationDir>/<agent.skill>-post.md`; return `{baseline: parseRecording(...), post: parseRecording(...)}`. If either file missing, throw `Object.assign(new Error('Recording missing: <path>'), { exitCode: 5 })`.

- [x] **Task 3: Implement orchestration + gate logic (AC2 + AC4).**
  - [ ] 3.1 Implement `runJudgePairs(client, promptTemplate, baselineText, postText, n)`: loop `n` times — substitute `{{OUTPUT_A}}` with baseline + `{{OUTPUT_B}}` with post (function-form `replace` per Story 4.1 P4); call SDK; `extractText`; `parseScore`; collect scores. Return `{scores, median: medianOf(scores), responses, retries: 0}`. Stderr-log full responses on truncation per Story 4.1 P7. If `--verbose`, log per-call timing to stderr.
  - [ ] 3.2 Implement `computeGate(agentMedians)` (CM-3 fix — empty-input guard + initial-value reduce):
    - `const entries = Object.entries(agentMedians);`
    - `if (entries.length === 0) throw Object.assign(new Error('computeGate: empty agentMedians'), { exitCode: 99 });`
    - `const medians = entries.map(([, m]) => m);`
    - `const avg = medians.reduce((a, b) => a + b, 0) / medians.length;`
    - `const lowest = entries.reduce((min, [agent, m]) => m < min[1] ? [agent, m] : min, entries[0]);`
    - If `avg < GATE_THRESHOLDS.passAvg`: verdict = `'FAIL'`.
    - Else if `lowest[1] <= GATE_THRESHOLDS.investigateLowAgent`: verdict = `'INVESTIGATE'`.
    - Else: verdict = `'PASS'`.
    - Return `{verdict, avg, lowestAgent: lowest[0], lowestMedian: lowest[1], reasoning}`.
  - [ ] 3.3 Implement `writeResults(resultsPath, allResults, judgeModel, gate, totalApiCalls, startTime, endTime)`: build frontmatter with **all 11 keys** per AC4 + body with gate verdict + per-agent table + per-prompt detail (truncate to 500 chars per Story 4.1 P7) + NFR3 timing block. **Pre-write:** `fs.mkdirSync(path.dirname(resultsPath), {recursive: true})` per EO-4. Atomic temp-rename. Frontmatter self-check (all 11 keys non-empty; HALT exit 99 if missing).
  - [ ] 3.4 Implement `parseArgs(argv)`: recognize `--dry-run` + `--verbose`. Implement `main()`:
    - parseArgs;
    - resolve `RESULTS_PATH = process.env.PF1_BATTERY_RESULTS_PATH || DEFAULT_RESULTS_PATH` per EO-3;
    - load prompt;
    - if `--dry-run`: render ALL 20 prompt-pairs (5 agents × 4 prompts) to stdout per CM-7 (not just first); exit 0;
    - else: ANTHROPIC_API_KEY whitespace-check (Story 4.1 P-C6); instantiate `new Anthropic({ maxRetries: 2, timeout: 60_000 })`;
    - track `startTime = Date.now()`;
    - iterate: for each agent → for each prompt → `runJudgePairs(...n=3)` → record per-prompt median;
    - per-agent score = `medianOf(perPromptMedians)` per Decision 5;
    - aggregate `agentMedians = {Emma: ..., John: ..., Winston: ..., Carson: ..., Murat: ...}`;
    - `gate = computeGate(agentMedians)`;
    - `endTime = Date.now()`; `wallClockSeconds = (endTime - startTime) / 1000`;
    - `writeResults(...)`;
    - exit code: PASS=0, INVESTIGATE=1, FAIL=2 per CM-6 (split codes for Story 4.3 release-gate scriptability).
  - [ ] 3.5 Standard Node entry: `if (require.main === module) main().then(c => process.exit(c)).catch(err => { console.error('Error:', err.message); process.exit(err.exitCode !== undefined ? err.exitCode : 99); });`.
  - [ ] 3.6 `module.exports` ALL constants + functions for testability per Story 4.1 P-O1 precedent.

- [x] **Task 4: Author sample fixtures for parser unit tests (AC5.1 Tests 6-7).**
  - [ ] 4.1 `mkdir -p tests/fixtures/pf1-battery`.
  - [ ] 4.2 Author `tests/fixtures/pf1-battery/sample-baseline.md` — 4 sections via `## Prompt 1`/.../`## Prompt 4` headers. Each section ~50-200 chars synthetic content.
  - [ ] 4.3 Author `tests/fixtures/pf1-battery/sample-post.md` — same shape; different content. Used for parser content-agnosticism check.
  - [ ] 4.4 Self-check: `grep -c '^## Prompt [1-4]' tests/fixtures/pf1-battery/sample-baseline.md` returns 4.

- [x] **Task 5: Author `tests/lib/pf1-validation-battery.test.js` (AC5.1 — 10 tests).**
  - [ ] 5.1 Create test file with `node:test` framework + `node:assert/strict`. 1 describe block, 10 test cases per AC5.1 list. Use `findProjectRoot()` for absolute paths.
  - [ ] 5.2 Test 5 (JUDGE_MODEL invariant triangle): require both modules; parse prompt frontmatter via flat YAML (per Story 4.1 P-C5 precedent); assert 3-way equality `battery.JUDGE_MODEL === calibration.JUDGE_MODEL === promptFm.judge_model`.
  - [ ] 5.3 Test 6 fixture loading: `parseRecording(fs.readFileSync(SAMPLE_BASELINE_PATH, 'utf8'))` returns `{Prompt 1, Prompt 2, Prompt 3, Prompt 4}` keys; each value non-empty.
  - [ ] 5.4 Test 7 fixture missing-section: synthesize 3-section variant; `assert.throws(() => parseRecording(...), err => err.exitCode === 5 && /wrong section structure/.test(err.message))`.
  - [ ] 5.5 Tests 8-10 computeGate: hand-crafted agentMedians per Decision 5 + assert verdict + avg + lowestAgent/lowestMedian return values.
  - [ ] 5.6 Run: `node --test tests/lib/pf1-validation-battery.test.js 2>&1 | tail -5`. Expected: `tests 10 / pass 10 / fail 0`.

- [x] **Task 6: Validation gates (AC5).**
  - [ ] 6.1 `npm test 2>&1 | tail -5` — expected: `tests 1465 / pass 1464 / skip 1 / fail 0`.
  - [ ] 6.2 `npm run test:integration 2>&1 | tail -5` — expected: `tests 93 / pass 93 / fail 0`.
  - [ ] 6.3 `npm run lint 2>&1 | tail -5` — expected: clean.
  - [ ] 6.4 `git diff HEAD --stat` — confirms AC6 scope: 5 NEW + 1 MODIFIED. Surface anything outside.
  - [ ] 6.5 NFR3 wall-clock measurement (EO-2): document mean per-call duration in Dev Agent Record so Story 4.3 can budget. Approach: wrap `client.messages.create` in timing log within `runJudgePairs` (already covered by `--verbose` flag); operator runs `--verbose --dry-run` first to verify pipeline structure, then live (in Story 4.3) with `--verbose` to capture timings.

## Dev Notes

**Decision 1 (compact):** reuse Story 4.1 helpers via `require()`; refactor risk > correctness gain; `D-V42-1` defers shared-module extraction.

**Decision 2 (compact):** operator-invoked-not-CI; same Story 4.1 boundary; CI guarantee via 10 structural tests; live runs are Story 4.3.

**Decision 3 (compact):** 5 agents per arch:347; cross-tier OK (Emma `pipeline`, others `standalone`) — PF1 ≠ FR25 distribution scope; Emma → Isla fallback per DS3.

**Decision 4 (compact):** 4 prompts per arch:348-352; LABELS match `## Prompt N` headers for parser symmetry.

**Decision 5 (compact):** PASS/INVESTIGATE/FAIL gate per arch:362-368; PASS-with-low-agent boundary case (e.g., avg 4.4, Murat 2.5) ships per arch (operator may override). Per-agent aggregation = median of 4 prompt-medians (more robust to single-prompt outlier than average; arch ambiguous, can swap to average via 1-line change if arch later clarifies).

**Anti-patterns to avoid:**
- DON'T refactor `pf1-judge-calibration.js` — Decision 1 explicitly defers; refactor risk to R1+R2-converged surface.
- DON'T duplicate Story 4.1 helper logic — `require()` per Decision 1.
- DON'T add battery to `npm test` — Decision 2 boundary.
- DON'T hardcode `claude-sonnet-4-6` — read `JUDGE_MODEL` from import; Test 5 cross-validates.
- DON'T trust `process.cwd()` — use `findProjectRoot()` per project-context.
- DON'T author real agent recordings — synthetic parser-test fixtures only; real recordings are Story 4.3.
- DON'T parallelize judge calls — `D-V42-2` defers parallelization.
- DON'T bypass FAIL gate — INVESTIGATE distinguishes single-agent vs broad regression; both block ship.
- DON'T write results mid-iteration on partial failure — atomic temp-rename per Story 4.1 P-C7.
- DON'T use `parseRecording` regex without exact-4-section validation — CM-4 over-segmentation hardening required.

**External dependencies + risk (compact):**

| ID | Risk | Mitigation |
|----|------|-----------|
| PR1 | Story 4.1 helper drift | DS1 verifies; spec amendment if inversion; `D-V42-1` would harden |
| PR2 | Manifest agent drift | DS2 verifies; Decision 3 fallback (Emma → Isla) |
| PR3 | NFR3 wall-clock budget | 60 calls × ~5-10s/call ≈ 5-10min mean; **worst-case with `maxRetries: 2` (LL-5 corrected): 60 × 60s × 3 attempts = 180min if every call exhausts retries (extreme).** NFR3 = target, not contract. Operator-invoked retry pattern. Task 6.5 measures actual mean for Story 4.3 budget. |
| PR4 | INVESTIGATE masks broader pattern | Per-prompt detail in results (AC4 §c) gives operator drill-down |
| PR5 | Calibration evidence drift | Battery uses same prompt; if calibration regresses, `D-V41-R2-1`-class concerns apply; operator can re-run Story 4.1 calibration |

**Spike points (DEF-SPIKE) tracked in Dev Agent Record:** DS1 helpers stability + DS2 manifest agents + DS3 recording-dir clean-slate — all 3 inversion-aware per PI-11.

**Apply Epic 3 retro action items:**
- **PI-9 (`${PIPESTATUS[0]}`):** N/A — no shell pipelines.
- **PI-10 (Edge Case Hunter as load-bearing for procedural/hybrid stories):** code-review at story close MUST include Edge Case Hunter layer.
- **PI-11 (DEF-SPIKE inversion handling):** applied in Task 1.
- **PI-12 (spec spot-check rubric audit):** AC1-AC6 each pin verifiable assertions (file-existence, regex, exit codes, count delta, frontmatter key count).

**Inheritance from Story 4.1 R1+R2 patterns** (16 patterns):

| Pattern | Source | Reuse mechanism |
|---|---|---|
| `extractText` filter content blocks | Story 4.1 P-C2 | `require()` |
| `parseScore` multi-pattern | Story 4.1 P-C5 | `require()` |
| `medianOf` generalized | Story 4.1 P-C6 | `require()` |
| `loadPromptTemplate` strip-FM | Story 4.1 | `require()` |
| `formatResponseBlockquote` | Story 4.1 | `require()` |
| `truncateResponse` | Story 4.1 | `require()` |
| Atomic temp-file-then-rename | Story 4.1 P-C7 | Re-implement (per writeResults) |
| `--dry-run` flag | Story 4.1 P-O2 | Re-implement |
| `Anthropic({ maxRetries: 2, timeout: 60_000 })` | Story 4.1 P-R2-1 | Re-implement |
| `max_tokens` stop_reason warn | Story 4.1 P-R2-2 | Re-implement (in runJudgePairs) |
| Module-level constants exported | Story 4.1 P-O1 | Re-implement |
| Exit-code dispatcher honors `err.exitCode` | Story 4.1 P-C2-dispatch | Re-implement |
| `?.trim()` env-var check | Story 4.1 P-C6 | Re-implement |
| Frontmatter self-check before write | Story 4.1 P-O3 | Re-implement |
| `JUDGE_MODEL` single source of truth | Story 4.1 D1 + Test 8 | Test 5 invariant triangle (battery + calibration + prompt FM) |
| Recording fixture provenance comments | Story 4.1 AC3 | N/A — Story 4.3 produces real recordings |

**JUDGE_MODEL invariant triangle (EO-5):** Story 4.1's Test 8 enforced 2-way consistency (prompt FM ↔ calibration constant). Story 4.2's Test 5 extends to 3-way: prompt FM ↔ calibration constant ↔ battery import. Battery imports calibration's constant, so battery → calibration is structural; Test 5 closes the loop with prompt FM.

**TI-9 cron-durability follow-through:** N/A for Story 4.2 (no scheduled actions).

## Change Log

- 2026-04-26 — Story 4.2 created via `/bmad-create-story v63-4-2`. 6 ACs + 5 Decisions + 7 Tasks + 5 PR risks documented. Code-authoring story shape (NEW battery harness ~400-500 LOC + 10 structural tests + 2 sample fixtures). Reuses Story 4.1's R1+R2-converged helpers via `require()`; defers shared-module extraction as `D-V42-1`. Decision 5 = PASS/INVESTIGATE/FAIL gate per arch:362-368.
- 2026-04-26 — V-pass batch-applied **21 improvements** (7 critical + 6 enhancement + 3 optimization + 5 LLM-opt) via spec-rewrite. **Empirical probes ran live (8 ran / 8 PASS / 0 caught spec defect):** Story 4.1 helpers + behavior + 5 PF1 agents + clean-slate + npm/integration baselines + SDK pin + `require()` does NOT trigger main() — all confirmed. **No story-killer foundational assumption invalidated.** **2 critical fixes that prevent silent-failure-mode defects:** CM-1 (frontmatter "8 keys" stale → "11 keys" — would have HALT exit 99 in production self-check); CM-2 (`lowest_median: <int>` wrong — even-N median returns float per `medianOf([4,5,4,5])=4.5`; AC2's own example uses `Murat: 3.5`). Other criticals: CM-3 (computeGate empty-input guard + initial-value reduce); CM-4 (parseRecording over-segmentation hardening + exact-4-section validation, exitCode 5); CM-5 (Test 5 concrete assertion target — JUDGE_MODEL 3-way invariant triangle); CM-6 (split exit codes 0/1/2 for PASS/INVESTIGATE/FAIL — Story 4.3 release-gate scriptability); CM-7 (`--dry-run` renders ALL 20 prompt-pairs not just first). Enhancements: EO-1 PASS-with-low boundary callout in Decision 5; EO-2 NFR3 wall-clock task; EO-3 `PF1_BATTERY_RESULTS_PATH` env override semantics; EO-4 `fs.mkdirSync(dirname, {recursive:true})` for env-overridden paths; EO-5 explicit JUDGE_MODEL invariant triangle (3-way); EO-6 arch-cross-ref for median-of-medians (per-agent aggregation choice + 1-line swap path if arch later clarifies). Optimizations: OS-1 Story 4.3 forward-pointer (`agent-manifest.csv` missing 3 of 5 PF1 agents); OS-2 `--verbose` flag for per-call timing; OS-3 budget-aware flag deferred (genuinely scope creep). LLM-opt: LL-1 Decision rationales consolidated to 1-line each; LL-2 Empirical Baseline restructured to table form; LL-3 Inheritance list moved to table; LL-5 PR3 arithmetic corrected (60 × 60s × 3 attempts = 180min worst-case with maxRetries=2, not 60min). **Final spec:** 6 ACs + 5 Decisions + 7 Tasks + 10 unit tests (1455→1465 = +10) + 5 NEW + 1 modified file. Story remains ready-for-dev. **V-pass ROI:** prevented 2 silent-failure defects (CM-1 + CM-2) that would have HALT-exit-99'd in production AND masked aggregation-error bugs; pre-empted 5 task-design defects requiring operator-driven recovery during /bmad-dev-story.

## Review Findings (Round 1 — 2026-04-26)

**Triage summary:** 0 decision-needed · 6 patch · 6 defer · 3 dismissed · Acceptance Auditor verdict: **MET-WITH-NOTES**. Reviewers raised ~30 raw findings (Blind Hunter 18 / Edge Case Hunter 10 / Acceptance Auditor F1-F4 + SD1-SD4); after dedup + dismiss → 15 net. **2 corroborated HIGH findings ⇒ R2 mandatory** per `code-review-convergence` rule. **H1 (story-killer) empirically verified** via `node -e ... parsed[PF1_PROMPTS[0]] is undefined`.

- [ ] [Review][Patch] **H1 STORY-KILLER: PF1_PROMPTS labels mismatch parseRecording keys → silent false-PASS** [scripts/audit/pf1-validation-battery.js:62-67 + :113 + :311-322 + :344-358] — Both Blind Hunter (HIGH) + Edge Case Hunter (H1 HIGH) caught independently. `PF1_PROMPTS = ['Prompt 1: Activation greeting + menu', ...]` (long-form labels) but `parseRecording` returns keys `'Prompt 1', 'Prompt 2', 'Prompt 3', 'Prompt 4'` (digit-only via `result[\`Prompt ${headers[i].num}\`] = body`). Lookup `recs.baseline[promptLabel]` is `undefined` for ALL 60 calls. `String.replace('{{OUTPUT_A}}', () => undefined)` substitutes literal `"undefined"`. Judge sees `"undefined"` vs `"undefined"` → SCORE: 5 → false PASS gate verdict. **Empirically verified:** `parsed['Prompt 1: Activation greeting + menu']` returns `undefined`; `parsed['Prompt 1']` returns body. **Fix:** change `PF1_PROMPTS` to digit-only labels `['Prompt 1', 'Prompt 2', 'Prompt 3', 'Prompt 4']` (Decision 4 descriptions remain in spec only); update Test 4 assertion from `startsWith` to `===`. Aligns labels-used-as-keys with parseRecording output.
- [ ] [Review][Patch] **H2: NaN agentMedian masks FAIL verdict in computeGate** [scripts/audit/pf1-validation-battery.js:177-209] — Edge Case Hunter H2 + Blind Hunter MED bounds-validation. Any NaN in `agentMedians` → `avg = NaN` → NaN comparisons always false → falls through to PASS branch. Verified: `computeGate({Emma: 5, John: NaN, ...})` → `verdict: 'PASS', avg: NaN`. **Fix:** validate `Number.isFinite(m)` for every entry at function entry; throw `Object.assign(new Error('computeGate: non-finite agent median: <agent>=<value>'), { exitCode: 99 })` if any non-finite.
- [ ] [Review][Patch] **Add integration test connecting parseRecording keys → PF1_PROMPTS lookup** [tests/lib/pf1-validation-battery.test.js — new Test 11] — Blind Hunter HIGH (corollary to H1) + Edge Case Hunter explicit. Without this test, the H1-class bug slips through every CI run. **Fix:** add Test 11: `assert.deepEqual(Object.keys(parseRecording(sampleBaseline)).sort(), [...PF1_PROMPTS].sort())` — proves the keys parser emits exactly match the keys main()/dry-run uses for lookup. Final test count: 1465 → **1466** (+1).
- [ ] [Review][Patch] **parseRecording regex `\b` matches `## Prompt 1.5` and `## Prompt 1-suffix` as `Prompt 1`** [scripts/audit/pf1-validation-battery.js:83] — Edge Case Hunter M5. `\b` is between digit and non-word char (`.5` qualifies). Body slice would start at `.5\n...`. **Fix:** tighten regex to `/^## Prompt (\d+)\s*$/gm` — anchors after digit to whitespace + line-end only; rejects `## Prompt 1.5`, `## Prompt 1abc`, `## Prompt 10` cleanly.
- [ ] [Review][Patch] **parseRecording accepts whitespace-only sections silently** [scripts/audit/pf1-validation-battery.js:80-116] — Edge Case Hunter M4. Input `## Prompt 1\n\n\n## Prompt 2\n\n\n...` parses to `{ 'Prompt 1': '', ... }` (4 keys present but bodies empty). Judge gets empty `{{OUTPUT_A}}` / `{{OUTPUT_B}}` → likely false PASS (empty == empty → SCORE 5). **Fix:** after `body = text.slice(start, end).trim()`, validate `if (body.length === 0) throw Object.assign(new Error('Recording has empty section: Prompt ' + headers[i].num), { exitCode: 5 })`.
- [ ] [Review][Patch] **Spec text "11 keys" → "11 keys" sweep + lowest_median float-display** [v63-4-2 spec, ~3 occurrences] — Acceptance Auditor F1 + Edge Case Hunter M6. V-pass added `wall_clock_seconds` per EO-2 making frontmatter 11 keys; spec body still says "10" in places. Cosmetic but inconsistent. **Fix:** sweep `s/11 keys/11 keys/` in spec body; add 1-line note clarifying `lowest_median` displays as `2.5` for float values (cosmetic — rendering format).

- [x] [Review][Defer] NFR3 retry-storm cumulative budget (Edge Case Hunter M3 + Blind Hunter MED) — 60 calls × 3 attempts × 60s = 10800s vs NFR3=900s budget. Acknowledged in spec PR3 ("worst-case 180min, mean-case 5-10min within NFR3"). Mitigation: cumulative-time check + fail-fast OR Story 4.3 measures + reports. → deferred-work `D-V42-R1-1`.
- [x] [Review][Defer] `PF1_BATTERY_RESULTS_PATH` env-path validation (Blind Hunter MED) — env-overridable but no allowlist/sandbox. Operator-controlled trust boundary; unsafe paths = operator error. → deferred-work `D-V42-R1-2`.
- [x] [Review][Defer] JUDGE_MODEL invariant test verifies equality but not validity (Blind Hunter MED) — Test 5 enforces 3 sources align; doesn't verify model exists in Anthropic catalog. Same deferred class as Story 4.1 R1 dismissed (calibration empirically verifies model on live run). → deferred-work `D-V42-R1-3`.
- [x] [Review][Defer] EXDEV `renameSync` cross-volume safety (Blind Hunter LOW + Edge Case Hunter L9) — same fs by construction (`<path>.tmp` next to `<path>`); env-overridden RESULTS_PATH could theoretically cross fs. → deferred-work `D-V42-R1-4`.
- [x] [Review][Defer] Test suite covers only structural happy paths (Blind Hunter MED) — no mock SDK call, no exit-3/exit-4 path test, no boundary tests at gate threshold (3.999 vs 4.0). Story 4.3 will exercise live; deferred to Story 4.3 or follow-up test-coverage sweep. → deferred-work `D-V42-R1-5`.
- [x] [Review][Defer] R1 minor LOWs (Blind Hunter L11/L12/L13/L14/L15/L16/L17/L18/L19) — wall_clock_seconds rename to api_wall_clock_seconds + responses retention unbounded + frontmatter regex CRLF/BOM brittle + gate verdict ternary maps unknowns to FAIL + dead-code `?.` chain + dry-run prerequisite docstring + cross-recording structural mismatch fail-after-load + --verbose oversells + gate-boundary fractional-medians-2.5 ambiguity. Bundle for future polish PR. → deferred-work `D-V42-R1-6`.

**Dismissed (3 — false positives):**
1. **Blind Hunter HIGH "parseScore failure has no try/catch — exit 3 unreachable"** — false positive: parseScore is imported from Story 4.1 calibration script + already throws `Object.assign(..., { exitCode: 3 })` per Story 4.1 P-C5; my main() catch honors `err.exitCode` so exit 3 IS reachable for parse failures. Verified by reading calibration.js + my dispatcher.
2. **Blind Hunter MED "Mutating SDK error objects throws TypeError"** — Anthropic SDK errors are not frozen/proxied at runtime (Story 4.1 calibration uses same pattern + has run live successfully 6+ times); pattern is safe in practice. Documented Story 4.1 R1 P-C2 dispatcher precedent.
3. **Blind Hunter LOW `responses.push` retains all 60 truncated blockquotes unbounded** — by design per Story 4.1 P7 (operator-readable evidence); truncation cap 500 chars × 60 = max 30KB output file, which is acceptable for CI artifact retention.



(Populates during dev-story execution.)

### Implementation Plan (2026-04-26)

Single-session autonomous execution per persona convention (Claude through Epic 4 close). All Tasks 0-6 executed in order; no operator action required (no fixtures to capture, no live API, no calibration).

### Completion Notes (2026-04-26)

**All 7 Tasks executed; all 6 ACs MET; all gates green.**

- **Task 0 ✓:** baseline `tests 1455 / pass 1454 / skip 1 / fail 0` + integration `93/93/0` matches spec exactly. ANTHROPIC_API_KEY check N/A for Story 4.2 per Decision 2.
- **Task 1 ✓:** all 3 DEF-SPIKEs PASS (no inversion handlers triggered). DS1: 8 helpers importable + `parseScore('SCORE: 4')===4` + `medianOf([5,5,4])===5` + `medianOf([4,5,4,5])===4.5` confirmed. DS2: 5 PF1 agents + Isla fallback all in manifest. DS3: clean slate confirmed.
- **Task 2 ✓:** battery script authored at `scripts/audit/pf1-validation-battery.js` (~310 LOC). Imports 8 helpers from `pf1-judge-calibration.js` per Decision 1. `parseRecording` uses `^## Prompt (\d+)\b/gm` regex with header-position tracking + exact-4-section validation + label-order validation; throws `exitCode: 5` on mismatch per CM-4. `loadAgentRecordings` reads baseline + post files; throws `exitCode: 5` if either missing.
- **Task 3 ✓:** orchestration implemented per Decisions 4+5. `runJudgePairs` uses function-form `replace` (Story 4.1 P-C4) + max_tokens stop_reason warn (P-R2-2) + stderr full-response logging (P7) + `--verbose` per-call timing. `computeGate` empty-input guard (CM-3) + initial-value reduce + correct boundary semantics (`< 4.0` FAIL, `<= 2` INVESTIGATE, else PASS). `writeResults` atomic temp-rename (P-C7) + `fs.mkdirSync(dirname, {recursive:true})` (EO-4) + 11-key frontmatter self-check + per-agent table + per-prompt detail with truncation. `main()` resolves `RESULTS_PATH` via env override (EO-3); `--dry-run` renders ALL 20 prompt-pairs (CM-7); split exit codes 0/1/2 for PASS/INVESTIGATE/FAIL (CM-6).
- **Task 4 ✓:** 2 sample fixtures authored at `tests/fixtures/pf1-battery/` with 4 prompt sections each + provenance comments noting they're synthetic parser-test data (NOT real agent recordings).
- **Task 5 ✓:** 10 unit tests authored at `tests/lib/pf1-validation-battery.test.js`; **10/10 PASS**. Test 5 enforces JUDGE_MODEL 3-way invariant triangle (battery ↔ calibration ↔ prompt FM) per CM-5. Test 7 verifies `parseRecording` throws `err.exitCode === 5` on malformed input. Tests 8-10 verify computeGate PASS/INVESTIGATE/FAIL boundaries.
- **Task 6 ✓:** all gates green. `npm test`: **`tests 1465 / pass 1464 / skip 1 / fail 0`** (delta +10 — exact spec match). `npm run test:integration`: `93/93/0` unchanged. `npm run lint`: clean. `git diff HEAD --stat` = AC6 scope (5 NEW + 1 modified).

**`--dry-run` smoke check observation:** runs main()'s up-front recording-load BEFORE entering dry-run branch (per spec AC1 "validates recording dirs"). Pre-Story-4.3 (no recordings yet), dry-run correctly exits 5 with `Recording missing: ...` error. Story 4.3 will produce recordings; dry-run will then render all 20 prompt-pairs as designed.

**Final cumulative shape:** 5 NEW files (battery script + test file + 2 fixtures + this story spec) + 1 modified (sprint-status.yaml). Zero lines of code in `pf1-judge-calibration.js` (Decision 1 reuse-don't-refactor preserved Story 4.1's R1+R2-converged surface). Total LOC delta: ~485 (battery 310 + tests 145 + fixtures 30).

**v6.3 progress: 18/29 stories shipped** (Epic 1A 6/6 + Epic 2 4/4 + Epic 3 5/5 + BUG-7 + Story 4.1 + Story 4.2).

### File List

**NEW (5):**
- `scripts/audit/pf1-validation-battery.js` — Task 2+3 — 60-call battery orchestrator with PASS/INVESTIGATE/FAIL gate
- `tests/lib/pf1-validation-battery.test.js` — Task 5 — 10 structural unit tests
- `tests/fixtures/pf1-battery/sample-baseline.md` — Task 4 — synthetic parser-test fixture
- `tests/fixtures/pf1-battery/sample-post.md` — Task 4 — synthetic parser-test fixture
- `_bmad-output/implementation-artifacts/v63-4-2-create-pf1-validation-battery-harness.md` — this story file

**MODIFIED (1):**
- `_bmad-output/implementation-artifacts/sprint-status.yaml` — Step 4 — `v63-4-2` `ready-for-dev → in-progress → review → done`

## Review Findings (Round 2 — 2026-04-26)

**Triage summary:** 0 decision-needed · 0 patch · 8 defer · 5 dismissed · Acceptance Auditor R2 verdict: **ALL 6 R1 PATCHES VERIFIED (0 net new HIGH defects)**.

**Convergence:** R1 patches classified as **ADDITIVE** (no new files, no renamed functions, no fundamentally altered control flow — only added: 1 constant array reshape + 1 PF1_PROMPT_DESCRIPTIONS map + 1 validation loop in computeGate + 1 regex tighten + 1 early throw + 3 new tests + spec text sweep). **R3 NOT triggered** per `code-review-convergence` rule.

**R1 patch verification (Acceptance Auditor R2 — all 6 PASS):**
- **P1 (H1 STORY-KILLER):** EMPIRICAL VERIFY — `parsed[PF1_PROMPTS[0]]` returns string body (not undefined). PF1_PROMPTS digit-only at battery.js:59; PF1_PROMPT_DESCRIPTIONS at 63-68; exported at 429; Test 4 updated.
- **P2 (NaN guard):** `Number.isFinite(m)` validation at battery.js:195-204; throws exitCode 99 on NaN with `non-finite agent median: <agent>=<value>` message. Empirically verified.
- **P3 (Test 11):** round-trip invariant test passes; would have caught H1 directly.
- **P4 (regex tighten):** `/^## Prompt (\d+)\s*$/gm` at battery.js:86; rejects `## Prompt 1.5` / `## Prompt 1abc`.
- **P5 (whitespace reject):** `body.length === 0` validation at battery.js:118-125; throws exitCode 5 with "empty section" message.
- **P6 (spec sweep):** `grep "10 keys"` returns 0; `grep "11 keys"` returns 5. Cosmetic sweep clean.
- **Tests 12 + 13:** both PASS (NaN guard + empty-section guard).
- **Live test suite:** 13/13 PASS at R2 close.

**8 R2 findings deferred (D-V42-R2-1..7 + R2-8 consolidating with R1-5):** PF1_PROMPT_DESCRIPTIONS unused; regex error message uninformative for descriptive headers; first-empty-section vs consolidated; single-char/zero-width-space body edge; Test 11 doesn't verify body-to-key mapping; R2 minor LOWs bundle (markdown rendering + reduce style + template substitution duplication + API-key fail-fast ordering + test coverage gaps + tie-breaking + even-RUNS_PER_AGENT guard); per-call stderr dump unconditional; thin test coverage (consolidates with R1 D-V42-R1-5). All routed to `deferred-work.md §"Deferred from v63-4-2 R1+R2"`.

**Dismissed (5 — false positives + design-intent):**
1. **Blind Hunter R2 HIGH "parseScore exit 3 unreachable"** — false positive: parseScore IS exitCode-tagged via Story 4.1 P-C5; my main() catch honors `err.exitCode`; exit 3 IS reachable. Same R1 dismissal.
2. **Blind Hunter R2 MED "exit codes 0/1/2 conflate INVESTIGATE + FAIL"** — false positive: exit 1 ≠ exit 2; CI scripts using `case $?` distinguish correctly per CM-6.
3. **Blind Hunter R2 MED "`retries: 0` is a lie"** — same Story 4.1 R1 dismissal: SDK 0.91.x doesn't expose retry count; documented limitation.
4. **Blind Hunter R2 MED "extractText invoked without verifying response shape"** — false positive: extractText DOES verify shape per Story 4.1 R1+R2; throws exitCode 99 OR exitCode 4.
5. **Blind Hunter R2 LOW "Dry-run gives false sense of battery readiness"** — by-design per spec AC1 contract.

## References

- Architecture Decision 4 — `_bmad-output/planning-artifacts/convoke-arch-bmad-v6.3-adoption.md:340-378`
- Story 4.2 epic spec — `_bmad-output/planning-artifacts/convoke-epic-bmad-v6.3-adoption.md:355-363`
- Failure modes FM4-1, FM4-3, FM7-2 — `convoke-arch-bmad-v6.3-adoption.md:489-498`
- Epic 3 retro action items (PI-8, PI-10, PI-11, PI-12) — `_bmad-output/implementation-artifacts/epic-v63-3-retro-2026-04-25.md`
- Project context rules (test-fixture-isolation, no-process-cwd-in-libs, namespace-decision-for-new-skills) — `project-context.md`
- Story 4.1 (judge prompt + calibration test, R1+R2-converged) — `_bmad-output/implementation-artifacts/v63-4-1-create-pf1-judge-prompt-and-calibration-test.md`
- Story 4.1 calibration evidence (median 5/2 baseline) — `_bmad-output/implementation-artifacts/v63-4-1-judge-calibration-evidence.md`
- Anthropic SDK docs — `https://github.com/anthropics/anthropic-sdk-typescript`
- V-pass findings — `.review-cache/v63-4-2-vpass-findings.md` (session scratch; gitignored)
- Story 4.3 forward-pointer (agent-manifest.csv extension) — `_bmad/_config/agent-manifest.csv` is missing 3 of 5 PF1 agents (Emma + Carson + Murat); Story 4.3 may need to extend it for recording-step automation.
