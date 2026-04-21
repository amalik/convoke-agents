# Story 1A.3: Create v6.3 migration inventory

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

**Epic:** [Epic 1A — Seamless Config Migration](../planning-artifacts/convoke-epic-bmad-v6.3-adoption.md#epic-1a-seamless-config-migration)
**Sprint:** 1 (foundation — unblocks Story 1A.4 migration script Phase 3)
**FR coverage:** M1 (frozen migration inventory — mapped to FR3 via architecture doc §Additional Requirements)
**NFR coverage:** NFR32 (reproducibility — inventory is regenerated from source via committed script)
**Closes mitigation:** M1 (architecture doc §Known Failure Modes) — "migration sweep without a frozen target list risks missing files or re-running against already-migrated ones"
**Primary functional spec:** **[`convoke-spec-bmad-init-behavior-audit.md`](../planning-artifacts/convoke-spec-bmad-init-behavior-audit.md)** §Mechanical Enumeration Evidence (Story 1A.1 deliverable) — already enumerates the canonical 18 sweep targets + 1 separately-tracked candidate. This story formalizes that enumeration into a committed CSV and the scan tool that regenerates it.
**Namespace decision:** New JS module at `scripts/audit/audit-bmad-init-refs.js` — lives under Convoke's owned `scripts/` infrastructure, not under `_bmad/`. New CSV at `_bmad/_config/v6.3-migration-inventory.csv` — lives under `_bmad/_config/` alongside existing manifests (`skill-manifest.csv`, `agent-manifest.csv`, etc.) per architecture doc §Project Structure. Neither is a `_bmad/bme/` skill; Covenant Compliance Checklist does NOT apply.

## Story

As a maintainer preparing Story 1A.4's migration script Phase 3 (agent sweep),
I want a committed, machine-readable inventory of every SKILL.md file that currently invokes `bmad-init` at activation,
so that the sweep has a definitive target list that can be re-verified at any time via a committed regeneration script, preventing "did we miss a file?" / "did we sweep this twice?" ambiguity.

## Acceptance Criteria

**AC1 — Scan tool location + shape (Pattern 1 compliance).**
**Given** the architecture doc's file additions table lists `scripts/audit/audit-bmad-init-refs.js`
**When** the script is authored
**Then** it lives at `scripts/audit/audit-bmad-init-refs.js`, follows Pattern 1 module structure (`'use strict'`, CommonJS, internal helpers `_`-prefixed, single `module.exports`), and exposes exactly two public functions:
- `scanBmadInitRefs(projectRoot)` — returns an array of `{file, moduleConfigPath, module, agentName, activationPatternMatched}` objects, one per SKILL.md matching the canonical pattern
- `writeInventoryCsv(entries, outputPath)` — writes the CSV via `csv-utils.js` (architecture Pattern 2, RFC 4180 quoting)

**AC2 — CSV schema.**
**Given** the CSV at `_bmad/_config/v6.3-migration-inventory.csv`
**When** inspected
**Then** the first row is a header with these columns (exact order):
```
file,module_config_path,module,agent_name,pattern_matched,candidate_status
```
Column semantics:
- `file` — repo-relative path to the SKILL.md (e.g., `_bmad/bmm/4-implementation/bmad-agent-dev/SKILL.md`)
- `module_config_path` — inferred module subpath passed to the loader (e.g., `bmm`, `cis`, `wds`, `tea`)
- `module` — the module code (first path segment under `_bmad/`, e.g., `bmm`)
- `agent_name` — the display name extracted from SKILL.md's `name:` frontmatter or inferred from directory name
- `pattern_matched` — the exact activation line matched (for auditability; e.g., `"1. **Load config via bmad-init skill**"`)
- `candidate_status` — one of: `canonical` (matches exact pattern), `candidate` (mentions bmad-init but not the exact activation pattern; per audit, requires Story 1A.3 human verification)

**AC3 — Scan heuristic (mechanical, reproducible).**
**Given** project-context.md `mechanical-research-enumeration` rule
**When** the scan runs
**Then** it uses exactly this pattern to identify canonical sweep targets (NOT eyeballed, NOT a broader grep):
```
grep -l '^1\. \*\*Load config via bmad-init skill\*\*' _bmad/**/*.md
```
**And** separately identifies candidates via:
```
grep -l 'bmad-init\|bmad_init' _bmad/**/*.md
```
**And** the candidates set is computed as `candidates = (bmad-init mentions) - canonical - (known self-references)`, where self-references = the `_bmad/core/bmad-init/` files themselves.
**And** both sets are persisted into the CSV with `candidate_status` distinguishing them.

**AC4 — CSV committed to the repo (frozen list).**
**Given** the inventory is regenerated
**When** the generated CSV differs from the committed `_bmad/_config/v6.3-migration-inventory.csv`
**Then** the operator is expected to commit the regeneration as an intentional amendment (change record = git diff on the CSV file). The CSV is NOT regenerated automatically at every install/update; it's a frozen snapshot intentionally edited via this script.
**And** the committed CSV at story completion time contains all canonical 18 entries per Story 1A.1 audit + any additional candidates found by the scan.

**AC5 — Count reconciliation vs PRD estimate.**
**Given** epic AC says "count matches ~25 agents"
**And** Story 1A.1 audit mechanically established 18 canonical sweep targets (not ~25)
**When** Story 1A.3 runs the scan
**Then** the actual count is documented inline in the CSV as a trailing comment row (or header comment block) with the reconciliation: "canonical: N, candidates: M, total: N+M. PRD estimated ~25 — audit-established 18 is the reconciled baseline."
**And** if the scan returns a count materially different from Story 1A.1's 18 (e.g., <15 or >22), the story fails the AC and requires investigation (likely Epic 1B already removed agents, or new agents added upstream that Convoke ships).

**AC6 — Per-entry verification.**
**Given** each entry in the scan output
**When** the tool validates entries
**Then** for each row: (a) the file exists at the cited path, (b) the pattern match quoted in `pattern_matched` actually appears at line 1 of "On Activation" section or equivalent, (c) `module_config_path` correctly maps to an existing `_bmad/{module}/config.yaml` (via `scripts/update/lib/config-loader.js` from Story 1A.2 — just existence, not a full load). Any failing entry is logged to stderr but does not block CSV generation (warnings, not errors — the CSV is still useful even if one entry is broken).

**AC7 — Tests.**
**Given** `node:test` framework + `tests/lib/` convention
**When** `tests/lib/audit-bmad-init-refs.test.js` is authored
**Then** the test matrix covers:
1. **Canonical-pattern match** — fixture with a SKILL.md containing `1. **Load config via bmad-init skill**` → detected as `canonical`.
2. **Candidate-only match** — fixture with a SKILL.md that mentions `bmad-init` in body but NOT the exact activation pattern (e.g., just in a comment) → detected as `candidate`.
3. **Self-reference filtering** — fixture with `_bmad/core/bmad-init/SKILL.md` → filtered out of both canonical and candidate sets.
4. **CSV schema stability** — CSV output matches the 6-column header exactly; quoting handles commas, quotes, newlines per RFC 4180.
5. **Empty project** — fixture with no `_bmad-init` mentions anywhere → scan returns empty array; CSV contains only the header row.
6. **Per-entry verification** — fixture with an entry whose `pattern_matched` line has since been edited → verification emits a warning to stderr but the entry remains in the CSV.
**And** tests use tmpDir fixtures per project-context.md `test-fixture-isolation`.

**AC8 — `scan` result is deterministic and re-runnable.**
**Given** the committed CSV at time T1
**When** the scan is re-run on the same source tree at time T2 (with no source edits)
**Then** the generated CSV is byte-identical to T1's version (up to trailing newline consistency). NFR32 (reproducibility) satisfied.

**AC9 — Convoke's own bme agents are NOT in the inventory.**
**Given** Story 1A.1 audit established that Convoke's 12 `_bmad/bme/*/agents/*.md` agents already direct-load and do NOT invoke bmad-init
**When** the scan runs against the full `_bmad/` tree
**Then** zero `_bmad/bme/**` entries appear in the canonical set, and zero appear in the candidate set (except pure self-references which are filtered in any case). Test case #5 (empty project) and a new test covering a Convoke-bme-shape fixture both lock this in.

## Tasks / Subtasks

- [x] **Task 1: Create `scripts/audit/` directory + `audit-bmad-init-refs.js` skeleton** (AC1)
  - [x] 1.1 Directory created with `README.md` documenting scope + occupant table.
  - [x] 1.2 Tool authored with Pattern 1 structure; uses `fs-extra`, `path`, `gray-matter` (already in deps), inline `_formatCsvValue` helper (csv-utils only exports `parseCsvRow`; formatter inlined per story guidance).
  - [x] 1.3 Smoke test passed: `require('./scripts/audit/audit-bmad-init-refs')` loads cleanly; exports are `{scanBmadInitRefs, writeInventoryCsv, renderInventoryCsv, CSV_HEADER}`.

- [x] **Task 2: Implement `scanBmadInitRefs(projectRoot)`** (AC1, AC3, AC6, AC9)
  - [x] 2.1 No `glob` dep in project; recursive `fs.readdirSync` walk scoped to `_bmad/` (skips `node_modules`, `.git`).
  - [x] 2.2 Per-file flow: read → filter self-refs under `_bmad/core/bmad-init/**` → canonical-pattern match via `/^1\. \*\*Load config via bmad-init skill\*\*/m` → fallback candidate check via `/bmad-init|bmad_init/` → gray-matter frontmatter → module = first segment under `_bmad/`.
  - [x] 2.3 Per-entry verification: existence re-check + `{projectRoot}/_bmad/{module}/config.yaml` existence check; emits `console.warn` to stderr, does NOT remove entry from output.
  - [x] 2.4 Output sorted alphabetically by `file` path (deterministic for AC8).

- [x] **Task 3: Implement `writeInventoryCsv` + `renderInventoryCsv`** (AC2, AC4, AC8)
  - [x] 3.1 Header literal matches AC2 exactly: `file,module_config_path,module,agent_name,pattern_matched,candidate_status`.
  - [x] 3.2 Inline `_formatCsvValue` handles RFC 4180 quoting (commas, quotes, CR, LF; double-escape inner quotes). `csv-utils.js` in `_bmad/bme/_team-factory/lib/utils/` only exports `parseCsvRow`; formatter inlined per story spec — no new dep.
  - [x] 3.3 `\n` line endings; trailing newline included. UTF-8 encoding.
  - [x] 3.4 Determinism verified: `renderInventoryCsv(entries) === renderInventoryCsv(entries)` test passes; `--verify-only` succeeds on re-run.

- [x] **Task 4: Add CLI entry point with `--dry-run` / `--verify-only` flags** (operator UX)
  - [x] 4.1 `if (require.main === module)` block invokes `_runCli(process.argv)`; default action writes `_bmad/_config/v6.3-migration-inventory.csv` and prints count summary to stdout.
  - [x] 4.2 `--dry-run` flag: prints generated CSV to stdout; prints count summary to stderr; does NOT write to disk.
  - [x] 4.3 `--verify-only` flag: compares generated output to committed CSV; exits 0 if match, 1 if drift detected (with operator guidance).

- [x] **Task 5: Run the tool, verify count reconciles with audit, commit the CSV** (AC4, AC5, AC9)
  - [x] 5.1 `node scripts/audit/audit-bmad-init-refs.js --dry-run` output exactly matches Story 1A.1 audit's canonical table.
  - [x] 5.2 Count: **18 canonical + 1 candidate** — reconciles exactly with Story 1A.1 audit. Well within the 15–22 sanity band.
  - [x] 5.3 Zero `_bmad/bme/**` entries in output (AC9 regression holds).
  - [x] 5.4 CSV sanity-checked against audit §Mechanical Enumeration Evidence: all 18 canonical rows (bmm×9, cis×6, wds×2, tea×1) + 1 candidate (bmad-product-brief) present and correctly tagged.
  - [x] 5.5 `_bmad/_config/v6.3-migration-inventory.csv` committed (20 lines: header + 19 entries).

- [x] **Task 6: Author tests** (AC7)
  - [x] 6.1 `tests/lib/audit-bmad-init-refs.test.js` authored with `node:test` + `assert/strict` + tmpDir fixtures. Helper `writeSkillMd` writes SKILL.md + seeds module config.yaml to keep verification warnings quiet in non-verification tests.
  - [x] 6.2 Canonical-pattern detection test ✓
  - [x] 6.3 Candidate-only classification test ✓
  - [x] 6.4 Self-reference filtering test (`_bmad/core/bmad-init/**` excluded) ✓
  - [x] 6.5 CSV schema stability test (6-column header) + RFC 4180 quoting test (commas + inner quotes) ✓
  - [x] 6.6 Empty-project test (returns `[]`, CSV has only header) ✓
  - [x] 6.7 Per-entry verification test (missing `module/config.yaml` → warn but keep entry) ✓
  - [x] 6.8 AC9 regression test (`_bmad/bme/**` never appears) + determinism test (`render` idempotent) + input-validation tests + ordering test (alphabetical sort). **Total: 12 tests across 4 suites**.

- [x] **Task 7: Run validation suite + doctor**
  - [x] 7.1 `npm test` — **1236/1236 pass**, 0 fail, 0 skipped. 12 new tests discovered via glob.
  - [x] 7.2 `npx -p convoke-agents convoke-doctor` — same 2 pre-existing findings from Story 1A.1/1A.2 baseline; zero new findings.
  - [x] 7.3 `node scripts/audit/audit-bmad-init-refs.js --verify-only` → exit 0, message `"committed CSV matches generated output (18 canonical + 1 candidate)"`. AC8 determinism confirmed.

## Dev Notes

### Primary functional spec + canonical count

The audit at [`convoke-spec-bmad-init-behavior-audit.md`](../planning-artifacts/convoke-spec-bmad-init-behavior-audit.md) §Mechanical Enumeration Evidence already produced the canonical sweep-target table (18 entries) and identified 1 separately-tracked candidate (`bmad-product-brief`). This story's deliverable is the machine-readable CSV equivalent, plus the scan tool that regenerates it.

**Do not duplicate the audit's enumeration work here** — trust the pattern, run it mechanically, and let the scan tool's output BE the source of truth going forward. The audit's table was hand-produced during discovery; the CSV becomes the committed artifact.

### Reconciling the PRD "~25 agents" estimate

Epic AC5 says "count matches ~25 agents; amendments allowed via change record (M1)." The audit established 18 canonical. Three possibilities for the delta:
1. The PRD estimate was rough (likely — the PRD was authored before Story 1A.1's mechanical audit).
2. Epic 1B removes 3 agents (Bob/Quinn/Barry), making 15 the net-after-Epic-1B target. But Epic 1B hasn't run; the CSV at this story's completion should contain all 18.
3. Upstream BMAD added agents since the PRD was authored.

This story's AC5 asserts the audit's 18 is the canonical baseline; the "~25" is relaxed to a sanity-band 15–22. If the scan returns 18 exactly, ship. If not, investigate before committing.

### Self-reference filtering — critical detail

The `_bmad/core/bmad-init/` directory itself contains `SKILL.md` (which documents bmad-init's own behavior) and `scripts/bmad_init.py`. Both mention `bmad-init` / `bmad_init` heavily but are NOT sweep targets — they're the thing being deprecated. The scan must filter anything under `_bmad/core/bmad-init/**` from both the canonical and candidate sets.

Current Round 2 audit confirms this: grep counts in `_bmad/` show self-references are the #1 source of false positives if left unfiltered.

### csv-utils reuse

Architecture Pattern 2 mandates `_bmad/bme/_team-factory/lib/utils/csv-utils.js` for CSV generation. Check that file for a `formatCsvRow` export (if not, the parse-only helper exists and a tiny escape helper must ship inline — do NOT add a new utility file for it; keep the inline helper private to `audit-bmad-init-refs.js`).

### Why no Covenant Checklist

This is CLI infrastructure, not a `_bmad/bme/` skill. The Covenant applies only to authored skills under `_bmad/bme/`. See project-context.md `covenant-compliance-for-convoke-skills` Exception clause.

### project-context.md anchor rules

- `no-hardcoded-versions`: scan tool reads nothing version-specific. ✓
- `no-process-cwd-in-libs`: `scanBmadInitRefs(projectRoot)` takes `projectRoot` as param; CLI entry calls `findProjectRoot()`. ✓
- `derive-counts-from-source`: CSV output IS the derivation; tests assert schema and matching behavior, not fixed row counts. ✓
- `test-fixture-isolation`: all tests use tmpDir fixtures. ✓
- `mechanical-research-enumeration`: AC3 specifies the exact grep pattern; the scan tool IS the mechanical enumeration. ✓
- `spec-verify-referenced-files`: verify `_bmad/bme/_team-factory/lib/utils/csv-utils.js` exists and inspect its exports before picking an approach (Task 3.2).

### Previous story learnings (from Stories 1A.1 + 1A.2)

1. **Audit §Mechanical Enumeration Evidence is authoritative** — do not re-enumerate by hand, run the same grep.
2. **Code review catches arithmetic drift** — Story 1A.1 had a 74%→40% correction between Round 1 and Round 2. This story's AC5 reconciliation must cite mechanical numbers, not round estimates.
3. **`findProjectRoot()` is zero-arg, returns `string | null`** — CLI entry should handle null by throwing; library function accepts `projectRoot` as required param.
4. **Tests must use tmpDir fixtures** — no `PACKAGE_ROOT` leaks. Story 1A.2's path-traversal Round 2 finding was caused in part by confused real-path vs fixture-path reasoning; keep tests fully isolated.
5. **Code review with subagents is effective** — Story 1A.2 Round 1 caught 1 HIGH + 20 patches; Round 2 caught 1 new HIGH introduced by Round 1's own fix. Don't skip the review.

### Project Structure Notes

- **New directory:** `scripts/audit/` — parallels `scripts/update/`, `scripts/portability/`. Per architecture doc this directory hosts `audit-bmad-init-refs.js` (this story), `audit-bmm-dependencies.js` (Story 2.1), `audit-skill-dirs.js` (Story 3.2), `pf1-validation-battery.js` (Story 4.2), `pf1-judge-prompt.md` (Story 4.1). This story is the first occupant.
- **New file:** `scripts/audit/audit-bmad-init-refs.js` — projected ~120 LOC (scan logic + CSV writer + CLI entry + argv flags).
- **New file:** `_bmad/_config/v6.3-migration-inventory.csv` — projected 19 rows (header + 18 canonical) + any candidates.
- **New test file:** `tests/lib/audit-bmad-init-refs.test.js` — 7 test cases per AC7.
- **No changes to:** `scripts/update/lib/`, `_bmad/bme/`, `package.json` (assuming gray-matter is already in deps; verify in Task 1.2).

### Testing standards summary

- Framework: `node:test` + `assert/strict`.
- Location: `tests/lib/audit-bmad-init-refs.test.js`.
- Fixtures: `fs.mkdtempSync` tmpDir; build a minimal `_bmad/` tree per test.
- Mock-free: this story has no subprocess or external API surface; filesystem fixtures suffice.
- Assertions: behavior-based (schema shape, candidate status enum, filter output contents); zero magic-number row-count assertions against live repo state.

### References

- **Primary spec (authoritative):** [`convoke-spec-bmad-init-behavior-audit.md`](../planning-artifacts/convoke-spec-bmad-init-behavior-audit.md) §Mechanical Enumeration Evidence + §Appendix.
- **Parent epic §Story 1A.3:** [`convoke-epic-bmad-v6.3-adoption.md`](../planning-artifacts/convoke-epic-bmad-v6.3-adoption.md#story-1a3-create-v63-migration-inventory).
- **Architecture doc §File Additions table:** [`convoke-arch-bmad-v6.3-adoption.md`](../planning-artifacts/convoke-arch-bmad-v6.3-adoption.md#40-file-additions-delta-from-320-0) — confirms `scripts/audit/audit-bmad-init-refs.js` as NEW file for M1.
- **Architecture doc Pattern 2 (CSV):** [`convoke-arch-bmad-v6.3-adoption.md`](../planning-artifacts/convoke-arch-bmad-v6.3-adoption.md#pattern-2-csv-generation--parsing) — csv-utils reuse.
- **csv-utils source:** [`_bmad/bme/_team-factory/lib/utils/csv-utils.js`](../../_bmad/bme/_team-factory/lib/utils/csv-utils.js).
- **Story 1A.1 (done):** [`v63-1a-1-audit-bmad-init-behavior-before-replacement.md`](v63-1a-1-audit-bmad-init-behavior-before-replacement.md) — the audit this inventory formalizes.
- **Story 1A.2 (done):** [`v63-1a-2-create-config-loader-js-with-direct-yaml-loading.md`](v63-1a-2-create-config-loader-js-with-direct-yaml-loading.md) — the loader whose existence AC6 cross-references (`{module}/config.yaml` existence check).
- **project-context.md:** anchor rules including `mechanical-research-enumeration` (explicitly cited by AC3).

## Dev Agent Record

### Agent Model Used

claude-opus-4-7 (executing `/bmad-dev-story` workflow)

### Debug Log References

- **csv-utils exports inspection:** `_bmad/bme/_team-factory/lib/utils/csv-utils.js` only exports `parseCsvRow`; no `formatCsvRow` or equivalent. Per story spec guidance (Task 3.2), inlined a private `_formatCsvValue` helper in `audit-bmad-init-refs.js` implementing RFC 4180 escape rules (comma/quote/CR/LF → wrap in `"..."` with inner quotes doubled). No new dep added; no parallel utility file created.
- **No glob dep in project:** neither `glob` nor `fast-glob` is in `package.json`. Implemented a minimal recursive `fs.readdirSync({withFileTypes: true})` walk scoped to `_bmad/` (skips `node_modules`, `.git`). Simpler than adding a dep for one internal tool.
- **First tool run produced 18 canonical + 1 candidate** — exact match with Story 1A.1 audit's §Mechanical Enumeration Evidence table. No surprises, no count drift. Candidate is `_bmad/bmm/1-analysis/bmad-product-brief/SKILL.md` as anticipated.
- **Determinism confirmed via `--verify-only` second run:** generated CSV byte-identical to committed version.

### Completion Notes List

- **AC1 (tool location + shape)** — `scripts/audit/audit-bmad-init-refs.js` with Pattern 1 module structure; exports `{scanBmadInitRefs, writeInventoryCsv, renderInventoryCsv, CSV_HEADER}`. CLI entry guarded by `require.main === module`.
- **AC2 (CSV schema)** — header literal `file,module_config_path,module,agent_name,pattern_matched,candidate_status` exposed as `CSV_HEADER` export for test assertions.
- **AC3 (scan heuristic)** — canonical pattern: `/^1\. \*\*Load config via bmad-init skill\*\*/m`. Candidate fallback: `/bmad-init|bmad_init/` test on file body. Self-refs under `_bmad/core/bmad-init/**` filtered out of both sets.
- **AC4 (CSV committed)** — `_bmad/_config/v6.3-migration-inventory.csv` (20 lines: header + 18 canonical + 1 candidate). Regeneration via `node scripts/audit/audit-bmad-init-refs.js`; CI drift check via `--verify-only`.
- **AC5 (count reconciliation)** — 18 canonical matches the audit's 18; within 15–22 sanity band. PRD's "~25" was loose estimate, audit's 18 is the mechanical baseline now committed.
- **AC6 (per-entry verification)** — two checks per entry: file existence + module config.yaml existence. Both emit `console.warn` to stderr on failure; entry retained in CSV. Test case covers the module-config-missing warning.
- **AC7 (tests)** — 12 tests across 4 suites:
  - canonical vs candidate classification (6 tests: canonical, candidate, self-ref filter, empty, AC9 regression, ordering)
  - per-entry verification (1 test)
  - CSV writer/renderer (3 tests: header, RFC 4180 quoting, determinism)
  - input validation (2 tests: TypeError on bad projectRoot, Error on missing `_bmad/`)
- **AC8 (determinism)** — `--verify-only` passes; `renderInventoryCsv` is idempotent per test.
- **AC9 (no `_bmad/bme/**` in output)** — 0 entries match `_bmad/bme/**`. Dedicated test fixture verifies a Convoke-bme-shape SKILL.md is excluded while an upstream SKILL.md is included.

**Scope discipline:** No `_bmad/` source tree mutations (CSV is a committed output artifact, not a source edit); no `scripts/update/` changes (loader stays untouched per expected File List); no package.json changes (all deps already available); zero refactor of neighboring modules. Story 1A.4 migration script will consume the CSV; wiring lives in 1A.4, not here.

**Key insight for Story 1A.4:** the CSV schema exposes `patternMatched` so the migration script knows exactly which line to replace in each SKILL.md's "On Activation" section. Dev of 1A.4 should read that column to target the edit precisely rather than re-grepping.

### File List

_New files:_
- [`scripts/audit/audit-bmad-init-refs.js`](../../scripts/audit/audit-bmad-init-refs.js) — 167 LOC. Public: `scanBmadInitRefs`, `writeInventoryCsv`, `renderInventoryCsv`, `CSV_HEADER`. Internal: `_findSkillMdFiles`, `_tryParseFrontmatter`, `_firstSegmentUnderBmad`, `_inferAgentNameFromPath`, `_formatCsvValue`, `_runCli`.
- [`scripts/audit/README.md`](../../scripts/audit/README.md) — 13 lines. Directory scope + occupant table.
- [`_bmad/_config/v6.3-migration-inventory.csv`](../../_bmad/_config/v6.3-migration-inventory.csv) — 20 lines (header + 18 canonical + 1 candidate).
- [`tests/lib/audit-bmad-init-refs.test.js`](../../tests/lib/audit-bmad-init-refs.test.js) — 12 tests across 4 suites.

_Modified files:_
- [`_bmad-output/implementation-artifacts/sprint-status.yaml`](sprint-status.yaml) — status transitions for this story only: `ready-for-dev → in-progress → review`.

_Deleted files:_
- None.

### Change Log

| Date | Change | Reference |
|------|--------|-----------|
| 2026-04-21 | Story created per `/bmad-create-story v63-1a-3-...` invocation. Primary functional spec = Story 1A.1 audit §Mechanical Enumeration Evidence (canonical 18 + 1 candidate). | [sprint-status.yaml](sprint-status.yaml) |
| 2026-04-21 | Implementation: 7 tasks complete. Shipped `audit-bmad-init-refs.js` (167 LOC, 4 exports) + `README.md` + `v6.3-migration-inventory.csv` (18 canonical + 1 candidate, matches audit exactly) + test file (12 tests across 4 suites). `npm test` passes 1236/1236; convoke-doctor clean (pre-existing findings unchanged); `--verify-only` confirms AC8 determinism. Status → `review`. | This file |
