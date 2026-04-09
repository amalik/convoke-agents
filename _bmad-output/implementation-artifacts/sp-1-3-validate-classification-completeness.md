# Story SP-1.3: Validate Classification Completeness

Status: ready-for-dev

## Story

As a platform maintainer,
I want a validator script that checks the classified skill manifest for completeness, vocabulary correctness, and dependency integrity,
so that the exporter (Epic 2) and catalog generator (Epic 3) can assume a clean manifest, and so that future Convoke releases catch classification drift before it ships.

## Acceptance Criteria

1. A validator script exists at `scripts/portability/validate-classification.js` that reads `_bmad/_config/skill-manifest.csv` and runs the checks below. It exits with code 0 on success and code 1 on any validation failure. It can be invoked via `node scripts/portability/validate-classification.js`.

2. **Completeness check:** every data row has non-empty `tier` AND non-empty `intent` (the `dependencies` column may be empty per the schema rule from Story 1.1). Any unclassified row produces a `[MISSING]` finding with the skill name.

3. **Vocabulary check:** every `tier` value is one of `standalone`, `light-deps`, `pipeline`. Every `intent` value is one of the 9 canonical categories defined in [_bmad/_config/portability-schema.md](../../_bmad/_config/portability-schema.md). Any out-of-vocabulary value produces an `[INVALID]` finding with the skill name and the offending value.

4. **Dependency path resolution check:** every dependency entry of the form `_bmad/...` (an absolute project-relative path) must resolve to an existing file under `projectRoot`. Any unresolvable path produces a `[BROKEN-DEP]` finding with the skill name, the dependency string, and the resolved absolute path that failed.

5. **Dependency config-key check:** every dependency entry of the form `config:<key>` is recognized — the `<key>` portion must be a non-empty alphanumeric/underscore string. Unknown config keys are NOT validated against any specific config schema (that would require module knowledge); only the format is checked. Malformed entries produce a `[BAD-CONFIG-DEP]` finding.

6. **Dependency skill-name check (orphan detection):** every dependency entry that is a bare skill name (does not start with `_bmad/` and does not contain a `:`) must exist as a `name` column value somewhere else in the same `skill-manifest.csv`. Orphan references produce an `[ORPHAN-DEP]` finding with the source skill, the missing dependency, and a recommendation ("dependency may have been removed; re-run classify-skills.js or remove the entry").

7. **Tier 3 prerequisite documentation check:** every `pipeline` skill must have a non-empty `dependencies` column UNLESS its intent is `meta-platform`. The rationale: pipeline skills consume prior artifacts or other skills, so their `dependencies` column should document those prerequisites. Empty deps on a non-meta pipeline produces a `[MISSING-PREREQS]` finding (warning, not error — exits 0 but logs to report).

8. **Output:** the validator produces a human-readable report at `_bmad-output/planning-artifacts/portability-validation-report.md` with sections per finding type. The report header shows total skills checked, count by finding type, and overall pass/fail status. The report is overwritten on each run.

9. **Idempotency + bookkeeping:** running the validator does NOT modify `skill-manifest.csv`, the schema doc, or any source files. It is a read-only operation except for the report file. Re-running produces an identical report (modulo timestamp).

10. **Tests:** a new test file `tests/lib/portability-validation.test.js` adds at least 5 tests:
   - Validator exits 0 on the current clean manifest (success path)
   - Synthetic test fixture with a missing tier triggers `[MISSING]`
   - Synthetic test fixture with `tier=invalid-value` triggers `[INVALID]`
   - Synthetic test fixture with `dependencies=_bmad/nonexistent.md` triggers `[BROKEN-DEP]`
   - Synthetic test fixture with an orphan skill-name dep triggers `[ORPHAN-DEP]`

## Tasks / Subtasks

- [ ] Task 1: Build the validator script skeleton (AC: #1, #9)
  - [ ] Create `scripts/portability/validate-classification.js` using CommonJS
  - [ ] Use `findProjectRoot()` from `scripts/update/lib/utils.js`
  - [ ] Import `readManifest` from `scripts/portability/manifest-csv.js` (read-only — no `writeManifest` import)
  - [ ] Define constants `VALID_TIERS` and `VALID_INTENTS` matching the values in `classify-skills.js`
  - [ ] No CLI flags. The script always writes the report and exits 0 or 1 based on hard findings. Future stories (CI integration) can add `--report-only` / `--quiet` if needed.

- [ ] Task 2: Implement completeness + vocabulary checks (AC: #2, #3)
  - [ ] Walk all data rows
  - [ ] For each row, check non-empty `tier` and `intent`; emit `[MISSING]` finding if either is empty
  - [ ] For each row with non-empty values, check membership in `VALID_TIERS` / `VALID_INTENTS`; emit `[INVALID]` finding if out-of-vocabulary
  - [ ] Findings include the skill `name` (from row), the field, and (for INVALID) the offending value

- [ ] Task 3: Implement dependency parsing + path resolution (AC: #4, #5, #6)
  - [ ] Build a `Set` of valid skill names from the manifest (column `name`) — same approach as `classify-skills.js`
  - [ ] For each row with non-empty `dependencies`, split by `;` (not `;` followed by space — strict no-spaces format from the schema spec)
  - [ ] For each dependency entry, classify by prefix:
    - Starts with `_bmad/` → file path → resolve via `path.join(projectRoot, dep)` and check `fs.existsSync` → emit `[BROKEN-DEP]` if missing
    - Starts with `../` or `./` → relative template → resolve via `path.resolve(skillDir, dep)` where `skillDir = path.dirname(path.join(projectRoot, row.path))`, then check `fs.existsSync`. If the resolved path exists, emit no finding. If it does NOT exist, emit `[BROKEN-DEP]` (escalated from warning to error because we CAN resolve it now). If the resolved path escapes `projectRoot`, emit `[BROKEN-DEP]` with an "escapes project root" reason.
    - Starts with `config:` → config-key → check format `config:[a-z_][a-z0-9_]*` → emit `[BAD-CONFIG-DEP]` if malformed
    - Otherwise → bare skill name → check membership in `validSkillNames` → emit `[ORPHAN-DEP]` if missing
  - [ ] Skip self-references (a skill listing its own name as a dep is a no-op, not an error)
  - [ ] Note: `[RELATIVE-DEP]` was originally specified as a warning-only category, but since the source skill's directory is available in the same row (the `path` column), we can fully resolve relative paths. Upgraded to behave like `[BROKEN-DEP]` (resolves cleanly OR fails as an error). Removed `[RELATIVE-DEP]` from the finding vocabulary entirely.

- [ ] Task 4: Implement Tier 3 prerequisite check (AC: #7)
  - [ ] For each row where `tier == 'pipeline'`:
    - If `intent == 'meta-platform'`, skip (these are framework-internals, prerequisites are implicit)
    - Else if `dependencies` is empty, emit `[MISSING-PREREQS]` warning with the skill name
  - [ ] This is a warning-level finding (does not fail the validator unless `--strict` flag is added, which is out of scope for this story)

- [ ] Task 5: Generate the validation report (AC: #8)
  - [ ] Build the report markdown with this structure:

```markdown
# Portability Classification — Validation Report

Generated by `scripts/portability/validate-classification.js` on YYYY-MM-DD.

**Total skills checked:** N
**Status:** PASS | FAIL

## Summary

| Finding type | Count |
|--------------|-------|
| [MISSING]          | N |
| [INVALID]          | N |
| [BROKEN-DEP]       | N |
| [BAD-CONFIG-DEP]   | N |
| [ORPHAN-DEP]       | N |
| [MISSING-PREREQS]  | N (warning) |

## [MISSING] — Unclassified rows

[table or _None._]

## [INVALID] — Out-of-vocabulary values

[table or _None._]

## [BROKEN-DEP] — File-path dependencies that don't resolve

[table or _None._]

## [BAD-CONFIG-DEP] — Malformed config: dependencies

[table or _None._]

## [ORPHAN-DEP] — Skill-name dependencies that don't exist in the manifest

[table or _None._]

## [MISSING-PREREQS] — Pipeline skills with empty dependencies (warning)

[table or _None._]
```

  - [ ] Each finding section is a 3-column table: `Skill | Finding detail | Recommendation`
  - [ ] Write to `_bmad-output/planning-artifacts/portability-validation-report.md`
  - [ ] Mkdir parent if needed

- [ ] Task 6: Wire exit codes (AC: #1)
  - [ ] Hard failures (exit 1): `[MISSING]`, `[INVALID]`, `[BROKEN-DEP]`, `[BAD-CONFIG-DEP]`, `[ORPHAN-DEP]`
  - [ ] Warnings (exit 0 even if present): `[MISSING-PREREQS]`
  - [ ] Print a single-line summary to stdout: `PASS: 101 skills validated, 0 findings` or `FAIL: 101 skills checked, 3 findings (2 BROKEN-DEP, 1 ORPHAN-DEP)`. Warnings are reported separately from failures: `PASS: 101 skills validated, 0 errors, 15 warnings`.

- [ ] Task 7: Run validator against current clean manifest (AC: #1, #9)
  - [ ] Run `node scripts/portability/validate-classification.js`
  - [ ] **Expected baseline (do NOT fix these — they are known/expected):**
    - Status: **PASS** (exit 0)
    - Errors: **0**
    - Warnings: approximately **15 [MISSING-PREREQS]** — these are pipeline skills (`bmad-create-story`, `bmad-dev-story`, `bmad-sprint-planning`, etc.) whose `dependencies` column is empty because sp-1-2's classifier doesn't extract artifact-consumption patterns (it only catches templates/sidecars/chained skills). This is a known limitation, not a bug. Document the count in completion notes; do NOT modify the classifier or hand-edit the manifest.
  - [ ] If hard errors appear, investigate. The most likely cause is a relative-template path that doesn't resolve when the validator computes `path.resolve(skillDir, dep)`. If the file genuinely doesn't exist, it's a real bug in sp-1-2's classification — flag it in completion notes for follow-up, do NOT silently fix it in this story.
  - [ ] Re-run the validator twice. The report content (modulo timestamp) MUST be identical between runs. If not, idempotency is broken.

- [ ] Task 8: Write validator tests (AC: #10)
  - [ ] Create `tests/lib/portability-validation.test.js`
  - [ ] Use a tmp directory pattern to write synthetic manifest fixtures
  - [ ] Test 1: validator exits 0 on the current real `skill-manifest.csv` (smoke test, also validates that sp-1-2's output is clean)
  - [ ] Test 2: synthetic fixture with one row missing `tier` → expect MISSING finding
  - [ ] Test 3: synthetic fixture with `tier=bogus` → expect INVALID finding
  - [ ] Test 4: synthetic fixture with `dependencies=_bmad/nonexistent/path.md` → expect BROKEN-DEP finding
  - [ ] Test 5: synthetic fixture with `dependencies=bmad-fake-skill` (not in the same fixture's name column) → expect ORPHAN-DEP finding
  - [ ] Bonus Test 6: synthetic fixture with `dependencies=config:bad key with spaces` → expect BAD-CONFIG-DEP finding
  - [ ] All tests use `manifest-csv.js` for parsing/writing fixtures (consistent with sp-1-1 P3 refactor and sp-1-2 Task 8)

- [ ] Task 9: Run regression suite + convoke-doctor (AC: #9)
  - [ ] `npx jest tests/lib/portability-schema.test.js tests/lib/portability-classification.test.js tests/lib/portability-validation.test.js tests/unit/refresh-installation-enhance.test.js`
  - [ ] All tests pass (5 + 7 + 6 + 20 = 38 tests minimum)
  - [ ] `node scripts/convoke-doctor.js` — same baseline as previous SP stories (2 pre-existing issues OK)
  - [ ] Verify no manifest mutations: `git diff _bmad/_config/skill-manifest.csv` should show no changes after running the validator

## Dev Notes

### Architecture Compliance (CRITICAL)

- **Read-only operation.** The validator MUST NOT modify `skill-manifest.csv`, the schema doc, agent files, workflow files, or anything except the validation report file at `_bmad-output/planning-artifacts/portability-validation-report.md`.
- **CommonJS only.** Use `require()`. Match existing codebase convention.
- **Build on sp-1-1 + sp-1-2.** Reuse `scripts/portability/manifest-csv.js` for parsing. Reuse the canonical `VALID_TIERS` and `VALID_INTENTS` from `portability-schema.md`. Do NOT redefine the schema.
- **No new npm dependencies.** Use only `fs`, `path`, and existing project utilities.
- **`findProjectRoot()` from `scripts/update/lib/utils.js`** — never `process.cwd()`.

### Why a separate validator (not part of classify-skills.js)

The classifier and validator have different invariants:
- **Classifier:** writes the manifest, may have heuristic misses, tolerates ambiguity
- **Validator:** read-only, fails hard on any anomaly, suitable for CI gates

Splitting them lets the validator be invoked as a standalone CI check without the side effects of the classifier. It also lets future stories (Epic 2 exporter) call the validator before consuming the manifest, without pulling in classifier dependencies.

### Finding type vocabulary (locked)

| Type | Severity | Exit | Meaning |
|------|----------|------|---------|
| `[MISSING]` | error | 1 | A row has empty `tier` or `intent` |
| `[INVALID]` | error | 1 | A `tier` or `intent` value is not in the canonical vocabulary |
| `[BROKEN-DEP]` | error | 1 | A file-path dependency (absolute `_bmad/...` OR relative `./`/`../` resolved against the source skill's directory) doesn't resolve to an existing file, or a relative path escapes the project root |
| `[BAD-CONFIG-DEP]` | error | 1 | A `config:` dependency is malformed |
| `[ORPHAN-DEP]` | error | 1 | A bare-skill-name dependency doesn't exist in the manifest |
| `[MISSING-PREREQS]` | warning | 0 | A pipeline skill has empty `dependencies` and isn't meta-platform — known limitation of sp-1-2's classifier (it doesn't extract artifact-consumption patterns); flagged for visibility, NOT a bug to fix in this story |

### Dependency notation rules (from sp-1-1 schema doc)

Format: semicolon-delimited list. Each entry is one of:
- **File path:** starts with `_bmad/`, relative to project root (e.g., `_bmad/bmm/templates/prd-template.md`)
- **Config key:** prefix `config:` followed by `[a-z_][a-z0-9_]*` (e.g., `config:output_folder`)
- **Skill name:** bare canonical ID matching another row's `name` (e.g., `bmad-create-story`)

The validator enforces this format strictly. Any entry that doesn't match one of these forms triggers a finding (likely `[BAD-CONFIG-DEP]` or `[ORPHAN-DEP]` depending on shape).

### Closes deferred items from sp-1-2 review

The sp-1-2 code review deferred 4 items to this story:
- **D3 (orphan deps):** AC #6 explicitly catches stale skill-name references after a skill is renamed/removed
- **D4 (sidecar regex over-broadness):** AC #4's path resolution check will surface false positives that the over-broad regex captured (any `_bmad/...` dep that points to a non-template file)
- **D1 (CRLF preservation):** out of scope for this story — this is a `manifest-csv.js`/`writeManifest` concern, not validation. Will be addressed in Epic 2 if it bites in practice.
- **D2 (symlink loops):** out of scope — defensive only, not currently triggered.

This story closes D3 and D4 explicitly.

### Source Files to Touch

| Path | Action | Purpose |
|------|--------|---------|
| `scripts/portability/validate-classification.js` | Create | Validator script |
| `tests/lib/portability-validation.test.js` | Create | 6 validator tests with synthetic fixtures |
| `_bmad-output/planning-artifacts/portability-validation-report.md` | Create (via script) | Report output |

### Out of Scope (Do NOT do in this story)

- Building the exporter or transformer (Epic 2)
- Building the catalog generator (Epic 3)
- Re-classifying any skills (Story 1.2's job — validator is read-only)
- Modifying `manifest-csv.js`, `classify-skills.js`, or any other sp-1-1 / sp-1-2 file
- Adding a `--strict` flag that escalates warnings to errors (deferred — current AC is sufficient)
- Adding CI integration (separate ops story)
- Symlink-loop detection
- CRLF preservation in writeManifest
- Validating against an external config schema (no module-knowledge requirement)

### Story Foundation (from Epic 1, Story 1.3)

This story closes Epic 1 (Skill Classification & Metadata). After completion:
- The manifest is verifiably clean
- Epic 2 (exporter) can consume `tier`, `intent`, and `dependencies` with full confidence
- Future Convoke releases that add new skills can run the validator as a CI gate

### Project Structure Notes

- Validator lives in `scripts/portability/` alongside `classify-skills.js` and `manifest-csv.js`
- Report lives in `_bmad-output/planning-artifacts/` next to `portability-borderline.md` (the classifier's review file)
- Test fixtures use temporary directories — do NOT commit fixture files to the repo
- No conflicts with existing structure — purely additive

### References

- [vision-skill-portability.md](../planning-artifacts/vision-skill-portability.md) — vision doc
- [epics-skill-portability.md](../planning-artifacts/epics-skill-portability.md#story-13-validate-classification-completeness) — Epic 1 Story 1.3 original AC
- [_bmad/_config/portability-schema.md](../../_bmad/_config/portability-schema.md) — schema reference
- [sp-1-1-define-portability-schema.md](sp-1-1-define-portability-schema.md) — Story 1.1 (schema)
- [sp-1-2-classify-all-skills.md](sp-1-2-classify-all-skills.md) — Story 1.2 (classifier)
- `scripts/portability/classify-skills.js` — produces the manifest this validator checks
- `scripts/portability/manifest-csv.js` — shared CSV parser/writer
- `tests/lib/portability-classification.test.js` — pattern reference for test fixtures

## Dev Agent Record

### Agent Model Used

(to be filled by dev agent)

### Debug Log References

### Completion Notes List

### File List
