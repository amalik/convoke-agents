# Story 1A.3: Create v6.3 migration inventory

Status: ready-for-dev

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

- [ ] **Task 1: Create `scripts/audit/` directory + `audit-bmad-init-refs.js` skeleton** (AC1)
  - [ ] 1.1 Create the new directory (per architecture doc §File Additions this is NEW). Add a one-line `README.md` explaining the directory scope ("audit/ — committed scan tools that generate machine-readable inventories of repo state").
  - [ ] 1.2 Stub `audit-bmad-init-refs.js` with Pattern 1 structure, imports for `fs-extra`, `path`, `gray-matter` (for frontmatter parsing — already in project deps per other lib/ modules), and the csv-utils helper.
  - [ ] 1.3 Smoke test: `node -e "require('./scripts/audit/audit-bmad-init-refs')"` must load without syntax errors.

- [ ] **Task 2: Implement `scanBmadInitRefs(projectRoot)`** (AC1, AC3, AC6, AC9)
  - [ ] 2.1 Glob `_bmad/**/SKILL.md` (via `fast-glob` or `glob` — check what's already in project deps; if neither, use a simple `fs.readdirSync` recursive walk scoped to `_bmad/`).
  - [ ] 2.2 For each SKILL.md: (a) read the file, (b) filter out self-references (`_bmad/core/bmad-init/**`), (c) check for the canonical pattern `1. **Load config via bmad-init skill**` at the start of an "On Activation" list item, (d) if not canonical, check for any `bmad-init` / `bmad_init` mention → mark as `candidate`, (e) parse frontmatter via `gray-matter` to extract `name`, (f) infer `module_config_path` from the first path segment under `_bmad/` (e.g., `_bmad/bmm/.../SKILL.md` → `bmm`).
  - [ ] 2.3 Per-entry verification (AC6): for each emitted entry, verify the file exists (trivially true since we just read it), the pattern_matched line actually appears where claimed, and `{projectRoot}/_bmad/{module}/config.yaml` exists. Emit `console.warn` to stderr for any failing check; do NOT remove the entry from the output.
  - [ ] 2.4 Return an array of `{file, moduleConfigPath, module, agentName, patternMatched, candidateStatus}` objects sorted by `file` path (deterministic output for AC8).

- [ ] **Task 3: Implement `writeInventoryCsv(entries, outputPath)`** (AC2, AC4, AC8)
  - [ ] 3.1 Build the header row literal: `file,module_config_path,module,agent_name,pattern_matched,candidate_status`.
  - [ ] 3.2 Use `formatCsvRow` from [`_bmad/bme/_team-factory/lib/utils/csv-utils.js`](../../_bmad/bme/_team-factory/lib/utils/csv-utils.js) for each entry row. (Check if there's a parallel `formatCsvRow` export — if not, this story ships the minimal `_formatCsvValue` helper inline following the same escape rules. Do NOT add a new csv-utils dependency; reuse or inline-replicate.)
  - [ ] 3.3 Write with `\n` line endings (LF, not CRLF — Unix convention matches other `_bmad/_config/*.csv` files).
  - [ ] 3.4 Verify determinism: running the function twice on the same input produces a byte-identical file.

- [ ] **Task 4: Add CLI entry point** (developer UX, supports AC4 operator workflow)
  - [ ] 4.1 At the bottom of `audit-bmad-init-refs.js`, add `if (require.main === module) { ... }` that runs `scanBmadInitRefs(findProjectRoot())` and pipes the result into `writeInventoryCsv(entries, '_bmad/_config/v6.3-migration-inventory.csv')`. Prints summary to stdout: `"Wrote N canonical + M candidate entries to {path}"`.
  - [ ] 4.2 Support `--dry-run` flag that prints the CSV to stdout without writing to disk (for pre-commit review).
  - [ ] 4.3 Support `--verify-only` flag that compares the scan output to the committed CSV and exits non-zero if they differ (for CI drift detection).

- [ ] **Task 5: Run the tool, verify count reconciles with audit, commit the CSV** (AC4, AC5, AC9)
  - [ ] 5.1 Run `node scripts/audit/audit-bmad-init-refs.js` against the current tree.
  - [ ] 5.2 Verify count: canonical ≥ 15 and ≤ 22 (sanity-band around the audit's 18); candidates count documented. If count is materially different, STOP and investigate (likely Epic 1B ran ahead of schedule or upstream BMAD changed).
  - [ ] 5.3 Verify no `_bmad/bme/**` paths in the output (AC9 regression: Convoke's own agents must not appear).
  - [ ] 5.4 Open the generated CSV, manually sanity-check the 18 rows against the audit's canonical table in §Mechanical Enumeration Evidence.
  - [ ] 5.5 Commit `_bmad/_config/v6.3-migration-inventory.csv` along with the scan tool.

- [ ] **Task 6: Author tests** (AC7)
  - [ ] 6.1 Scaffold `tests/lib/audit-bmad-init-refs.test.js` using `node:test` + `assert/strict`. Build a tmpDir fixture helper that creates a mini `_bmad/` tree with controlled SKILL.md content.
  - [ ] 6.2 Test: canonical-pattern match detects a SKILL.md with the exact `1. **Load config via bmad-init skill**` line.
  - [ ] 6.3 Test: candidate-only match distinguishes a SKILL.md that mentions `bmad-init` without the exact activation pattern.
  - [ ] 6.4 Test: self-reference filtering — `_bmad/core/bmad-init/SKILL.md` is excluded from both sets.
  - [ ] 6.5 Test: CSV schema stability — generated CSV matches the 6-column header; RFC 4180 quoting handles a fixture entry with a comma in the `pattern_matched` field.
  - [ ] 6.6 Test: empty project — no bmad-init mentions → empty array, CSV with only header.
  - [ ] 6.7 Test: per-entry verification — fixture with a SKILL.md where the `pattern_matched` claim doesn't match actual content emits `console.warn` but entry stays in CSV.
  - [ ] 6.8 Test: AC9 regression — fixture with a `_bmad/bme/_vortex/agents/fake.md` that does NOT invoke bmad-init is NOT in the output.

- [ ] **Task 7: Run validation suite + doctor**
  - [ ] 7.1 `npm test` — full regression; new tests included via glob.
  - [ ] 7.2 `npx -p convoke-agents convoke-doctor` — confirm no new findings.
  - [ ] 7.3 Run `node scripts/audit/audit-bmad-init-refs.js --verify-only` one more time and confirm exit 0 (committed CSV matches freshly-regenerated output). This is the AC8 determinism check.

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

_(to be filled by dev agent)_

### Debug Log References

### Completion Notes List

### File List

_Expected new files:_
- `scripts/audit/audit-bmad-init-refs.js` (~120 LOC — scan + CSV writer + CLI entry + flags)
- `scripts/audit/README.md` (~10 lines — directory scope note)
- `_bmad/_config/v6.3-migration-inventory.csv` (19+ rows — header + 18 canonical + any candidates)
- `tests/lib/audit-bmad-init-refs.test.js` (7 test cases + tmpDir fixture helpers)

_Expected modified files:_
- None. Callers (Story 1A.4 migration script Phase 3) will consume the CSV; wiring lives in 1A.4, not here.

_Expected deleted files:_
- None.

### Change Log

| Date | Change | Reference |
|------|--------|-----------|
| 2026-04-21 | Story created per `/bmad-create-story v63-1a-3-...` invocation. Primary functional spec = Story 1A.1 audit §Mechanical Enumeration Evidence (canonical 18 + 1 candidate). | [sprint-status.yaml](sprint-status.yaml) |
