# Story SP-1.2: Classify All Skills

Status: ready-for-dev

## Story

As a platform maintainer,
I want every skill in `skill-manifest.csv` classified with tier, intent, and exporter-essential dependencies,
so that the exporter (Story 2.x) and catalog generator (Story 3.x) can operate on the full skill set without manual data entry.

## Acceptance Criteria

1. A classification script exists at `scripts/portability/classify-skills.js` that reads `_bmad/_config/skill-manifest.csv`, opens each skill's source files (`SKILL.md` and any referenced workflow / step files), applies the heuristics in this story's Dev Notes, and writes back the manifest with `tier`, `intent`, and `dependencies` columns populated for every row.
2. After running the script, every data row in `skill-manifest.csv` has non-empty `tier` and non-empty `intent` values; the `dependencies` column may be empty (per the schema rule from Story 1.1).
3. Every `tier` value is one of `standalone`, `light-deps`, `pipeline`. Every `intent` value is one of the 9 canonical categories defined in [_bmad/_config/portability-schema.md](../../_bmad/_config/portability-schema.md).
4. The script is **idempotent**: running it twice in a row produces no diff. If a skill's source files have changed between runs, the script updates the row; otherwise it leaves the row unchanged.
5. The script is **non-destructive on conflict**: if a row already has a classification that differs from what the heuristics would produce, the script leaves the existing values alone and writes the proposed values to a `BORDERLINE.md` file at `_bmad-output/planning-artifacts/portability-borderline.md` for human review. This protects manual overrides from being clobbered.
6. A `BORDERLINE.md` review file at `_bmad-output/planning-artifacts/portability-borderline.md` lists every skill the script flagged as ambiguous (heuristics produced no clear answer or multiple plausible answers). Each entry includes the skill name, the values the script proposed, and the reason for ambiguity.
7. The 9 `meta-platform` intent skills (`bmad-init`, `bmad-help`, `bmad-party-mode`, `bmad-builder-setup`, `bmad-shard-doc`, `bmad-index-docs`, `bmad-distillator`, `bmad-advanced-elicitation`, `bmad-generate-project-context` — verify exact set during implementation) are classified as `tier=pipeline` with `intent=meta-platform`. Their `dependencies` column documents internal Convoke artifacts they need (e.g., `config:user_name`, framework conventions). They are explicitly NOT exported as standalone — Story 4.x catalog generator must show them with a "framework-internal" badge.
8. Existing tests continue to pass: `tests/lib/portability-schema.test.js` (5 tests) and `tests/unit/refresh-installation-enhance.test.js` (20 tests). Tests 3 and 4 in the schema test file now have meaningful assertion coverage because all rows have non-empty tier and intent values.
9. A new test `tests/lib/portability-classification.test.js` adds at least 4 tests:
   - Every row has non-empty `tier` and non-empty `intent`
   - All known CIS agent skills are classified `tier=standalone, intent=think-through-problem` (spot-check)
   - All known TEA testarch skills are classified `intent=test-your-code` (spot-check)
   - All `meta-platform` skills are classified `tier=pipeline` per AC #7

## Tasks / Subtasks

- [ ] Task 1: Build the classification script skeleton (AC: #1, #4)
  - [ ] Create directory `scripts/portability/`
  - [ ] Create `scripts/portability/classify-skills.js` using CommonJS
  - [ ] Use `findProjectRoot()` from `scripts/update/lib/utils.js` for path resolution
  - [ ] Use the RFC-4180-aware CSV parser from `tests/lib/portability-schema.test.js` as a starting point — extract it into `scripts/portability/csv-utils.js` so both the script and the test can share it (this also retroactively fixes a code-review concern from Story 1.1)
  - [ ] Read existing manifest, parse rows, prepare to rewrite
  - [ ] Add a `--dry-run` flag that prints the planned classifications without writing the CSV
  - [ ] Add a `--force` flag that overrides the non-destructive-on-conflict rule (escape hatch for re-classification)

- [ ] Task 2: Implement tier classification heuristics (AC: #2, #3, #4)
  - [ ] For each skill row, locate its `SKILL.md` file via the `path` column
  - [ ] Read the `SKILL.md` and any files it references via `Load:` / `read fully and follow:` directives (recursive, with a depth limit of 3 to prevent infinite loops)
  - [ ] Apply tier heuristics in this priority order (first match wins):
    1. **Pipeline indicators (Tier 3):**
       - Skill name matches `bmad-dev-story`, `bmad-sprint-planning`, `bmad-sprint-status`, `bmad-create-story`, `bmad-correct-course`, `bmad-retrospective`, `bmad-code-review`, `bmad-check-implementation-readiness`, `bmad-validate-prd`, `bmad-edit-prd` (skills that consume prior artifacts)
       - Workflow content references `{implementation_artifacts}/*.md` for input (consumes artifacts)
       - Workflow content invokes another skill via `Skill tool` or `bmad-*` slash command
       - Path matches `wds-*` (WDS phase pipeline)
       - Path matches `_bmad/bme/_vortex/` or `_bmad/bme/_gyre/` (sequential team pipelines)
       - Skill is in the `meta-platform` intent set (per AC #7)
    2. **Light-deps indicators (Tier 2):**
       - Workflow content has a `templateFile:` frontmatter field
       - Workflow content references `_bmad/*/templates/*.md` via `Load template:` or `Load:` directive
       - Workflow content references a sidecar memory file under `_bmad/_memory/`
    3. **Standalone (Tier 1):** Default if neither pipeline nor light-deps indicators match
  - [ ] If multiple plausible answers exist (e.g., a skill has both pipeline and light-deps indicators), prefer the higher tier (pipeline) and add to `BORDERLINE.md`

- [ ] Task 3: Implement intent classification heuristics (AC: #2, #3)
  - [ ] Apply intent heuristics by inspecting `name`, `description`, and `path` columns:
    - `bmad-cis-agent-*` or `bmad-brainstorming` or `bmad-cis-problem-solving` or `bmad-cis-design-thinking` → `think-through-problem`
    - `bmad-create-prd`, `bmad-edit-prd`, `bmad-validate-prd`, `bmad-product-brief`, `bmad-create-ux-design`, `bmad-create-architecture`, `bmad-create-epics-and-stories` → `define-what-to-build`
    - `bmad-code-review`, `bmad-review-*`, `bmad-editorial-review-*` → `review-something`
    - `bmad-document-project`, `bmad-generate-project-context`, `bmad-index-docs`, `bmad-tech-writer*` → `write-documentation`
    - `bmad-create-story`, `bmad-sprint-*`, `bmad-correct-course`, `bmad-retrospective`, `bmad-dev-story`, `bmad-quick-dev` → `plan-your-work`
    - `bmad-testarch-*`, `bmad-qa-*`, `bmad-teach-me-testing` → `test-your-code`
    - `bmad-agent-bme-*` (Vortex 7 agents) → `discover-product-fit`
    - `bmad-agent-bme-stack-detective`, `bmad-agent-bme-model-curator`, `bmad-agent-bme-readiness-analyst`, `bmad-agent-bme-review-coach` (Gyre 4 agents), `bmad-check-implementation-readiness` → `assess-readiness`
    - `bmad-init`, `bmad-help`, `bmad-party-mode`, `bmad-builder-setup`, `bmad-shard-doc`, `bmad-index-docs`, `bmad-distillator`, `bmad-advanced-elicitation` → `meta-platform`
    - `bmad-agent-*` (other persona-only agent skills like `bmad-agent-pm`, `bmad-agent-architect`, `bmad-agent-dev`, `bmad-agent-sm`, `bmad-agent-qa`, `bmad-agent-ux-designer`, `bmad-agent-analyst`, `bmad-agent-tech-writer`, `bmad-agent-quick-flow-solo-dev`, `bmad-agent-builder`) → classify by domain: PM/PRD → `define-what-to-build`, dev/QA → `plan-your-work`, etc.
    - WDS skills (`wds-*`) → use phase number: `wds-1` (brief) → `define-what-to-build`, `wds-3` (scenarios) → `define-what-to-build`, `wds-4` (UX) → `define-what-to-build`, etc.
  - [ ] If no heuristic matches, log to `BORDERLINE.md` and assign a best-guess based on the description text

- [ ] Task 4: Implement dependency extraction (AC: #2 — exporter-essential only)
  - [ ] For each skill, parse its `SKILL.md` and workflow files for dependency markers
  - [ ] Extract **only exporter-essential** deps (per Story 1.2 policy):
    - **Templates:** any `Load template:`, `templateFile:`, or `_bmad/*/templates/*.md` reference → add as a relative path
    - **Sidecars:** any `_bmad/_memory/*` reference → add as a relative path
    - **Chained skills:** any `Skill tool` invocation or slash-command reference to another `bmad-*` skill → add as a bare skill name
  - [ ] **Exclude** universal dependencies (the exporter handles these centrally):
    - `bmad-init` calls (every skill calls it)
    - Config var references (`{user_name}`, `{communication_language}`, `{output_folder}`, `{planning_artifacts}`, `{implementation_artifacts}`, `{document_output_language}`)
    - The skill's own files (sibling files in the same directory don't count as deps)
  - [ ] Format multiple dependencies as semicolon-delimited (no spaces around `;`)
  - [ ] Empty string is valid for skills with no exporter-essential deps

- [ ] Task 5: Conflict detection and BORDERLINE handling (AC: #5, #6)
  - [ ] Before writing each row, check if existing values for `tier`, `intent`, `dependencies` are non-empty AND differ from proposed values
  - [ ] If conflict detected: skip the write, log to `BORDERLINE.md` with both existing and proposed values, mark as "MANUAL OVERRIDE PROTECTED"
  - [ ] If `--force` flag: write proposed values regardless of conflict; still log to `BORDERLINE.md` with a "FORCED" tag
  - [ ] Create `_bmad-output/planning-artifacts/portability-borderline.md` with format:

```markdown
# Portability Classification — Borderline Cases

Generated by `scripts/portability/classify-skills.js` on YYYY-MM-DD.

## Manual Override Protected
| Skill | Existing | Proposed | Reason |
|-------|----------|----------|--------|
| ... | tier=X intent=Y deps=Z | tier=A intent=B deps=C | Existing values differ from heuristics |

## Ambiguous (multiple plausible classifications)
| Skill | Tier | Intent | Reason |
|-------|------|--------|--------|
| ... | ... | ... | Has both pipeline and light-deps indicators — chose pipeline (higher) |

## Heuristic Misses (no clear match)
| Skill | Best guess | Confidence | Recommendation |
|-------|-----------|------------|----------------|
| ... | ... | ... | Manual review needed |
```

- [ ] Task 6: Run the script and inspect output (AC: #2, #3)
  - [ ] Run `node scripts/portability/classify-skills.js --dry-run` to preview
  - [ ] Inspect the dry-run output for obvious misclassifications
  - [ ] Run `node scripts/portability/classify-skills.js` to write the manifest
  - [ ] Run a second time to verify idempotency: `node scripts/portability/classify-skills.js` should produce zero diff
  - [ ] Review `_bmad-output/planning-artifacts/portability-borderline.md` and resolve any flagged items by either editing the manifest manually or fixing the heuristics in the script

- [ ] Task 7: Write classification tests (AC: #9)
  - [ ] Create `tests/lib/portability-classification.test.js`
  - [ ] Test 1: Every data row has non-empty `tier` AND non-empty `intent` (closes the vacuous-pass gap from Story 1.1 review finding D1)
  - [ ] Test 2: Spot-check CIS agents — `bmad-brainstorming`, `bmad-cis-agent-storyteller`, `bmad-cis-agent-creative-problem-solver` all have `tier=standalone, intent=think-through-problem`
  - [ ] Test 3: Spot-check TEA skills — at least 3 `bmad-testarch-*` skills have `intent=test-your-code`
  - [ ] Test 4: Spot-check meta-platform — `bmad-init`, `bmad-help`, `bmad-party-mode` all have `tier=pipeline, intent=meta-platform`
  - [ ] All tests use the same loader pattern as `portability-schema.test.js` (BOM/CRLF tolerant via the now-shared `csv-utils.js`)

- [ ] Task 8: Refactor the test parser into shared utility (closes Story 1.1 deferred D3 partially)
  - [ ] Move the RFC-4180-aware `parseCsvRow` from `tests/lib/portability-schema.test.js` into `scripts/portability/csv-utils.js`
  - [ ] Both `tests/lib/portability-schema.test.js` and `tests/lib/portability-classification.test.js` import from the shared utility
  - [ ] Verify all 5 schema tests still pass after the refactor
  - [ ] Note: this is the *test* CSV utility, separate from `scripts/lib/csv-utils.js` (Team Factory's writer utility) — naming chosen to avoid collision

- [ ] Task 9: Verify regressions and run convoke-doctor (AC: #8)
  - [ ] `npx jest tests/lib/portability-schema.test.js tests/lib/portability-classification.test.js tests/unit/refresh-installation-enhance.test.js`
  - [ ] All tests pass
  - [ ] `node scripts/convoke-doctor.js` — same baseline as Story 1.1 (2 pre-existing issues OK)
  - [ ] Manual diff inspection: `git diff _bmad/_config/skill-manifest.csv` should show 101 rows changed (all classifications populated), no row removals, no header changes

## Dev Notes

### Architecture Compliance (CRITICAL)

- **Build on Story 1.1 foundation:** The schema and column structure are locked. This story populates values; it does NOT change the schema.
- **CommonJS only.** Use `require()`. Match existing codebase convention.
- **No new npm dependencies.** Use only `fs`, `path`, and existing project utilities.
- **`findProjectRoot()` from `scripts/update/lib/utils.js`** — never `process.cwd()`.
- **Idempotency is non-negotiable.** A re-run with no source changes must produce zero diff. Test this explicitly in Task 6.
- **Non-destructive on conflict.** If a human has manually classified a row, the script must NOT clobber it. Use the conflict-detection logic in Task 5.

### Why a script, not manual edits

The vision and code review both flagged this concern. Reasons for a script:
- 101 rows × 3 columns = 303 manual edits = high error rate
- Future Convoke releases will add new skills; the script can re-run incrementally
- The script is the audit trail — anyone can read it and understand *why* a skill was classified the way it was
- Heuristics can be tuned in code review; manual edits cannot

The trade-off: the script is more upfront work than 303 manual edits. Worth it.

### Classification policy decisions (locked)

These were debated and decided before this story was written. Do NOT relitigate them in implementation:

1. **Conservative bias on borderline cases:** When in doubt, classify as the *lower* tier (Tier 1 over Tier 2 over Tier 3). Easier to upgrade than to discover broken exports.
2. **`meta-platform` intent → Tier 3 pipeline:** These skills only make sense inside the BMAD framework. Classifying them as pipeline (with `framework-internal` badge later) is more honest than pretending they're portable.
3. **Dependencies are exporter-essential only:** Templates, sidecars, chained skills. Universal deps (config vars, `bmad-init`, output paths) are excluded — the exporter handles them centrally.
4. **Borderline cases get logged, not skipped:** The script always assigns *some* classification, then flags ambiguous cases in `BORDERLINE.md` for human review.

### Tier classification heuristics (locked in Task 2)

The priority order is **pipeline → light-deps → standalone (default)**. First match wins.

**Pipeline indicators (Tier 3):**
- Skill name on the explicit pipeline list (Task 2 enumerates them)
- Workflow consumes prior artifacts via `{implementation_artifacts}/*.md` paths
- Workflow invokes another skill via `Skill tool`
- Path matches `wds-*`, `_bmad/bme/_vortex/`, or `_bmad/bme/_gyre/`
- Intent is `meta-platform`

**Light-deps indicators (Tier 2):**
- Workflow has `templateFile:` frontmatter
- Workflow references `_bmad/*/templates/*.md`
- Workflow references `_bmad/_memory/*` sidecar

**Standalone (Tier 1):** default if no other indicator matches.

### Intent classification heuristics (locked in Task 3)

Pattern-matching on skill name + path + module. See Task 3 for the full mapping table. The 9 categories are stable (defined in `_bmad/_config/portability-schema.md`).

### Dependency extraction policy (locked in Task 4)

**Include:** templates, sidecars, chained skills.
**Exclude:** `bmad-init`, config vars, output paths, the skill's own sibling files.

The exporter (Story 2.x) will handle universal stripping centrally. Listing every config var in every skill's dependencies would be 90% noise.

### Source Files to Touch

| Path | Action | Purpose |
|------|--------|---------|
| `scripts/portability/classify-skills.js` | Create | Classification script |
| `scripts/portability/csv-utils.js` | Create | Shared RFC-4180 CSV parser |
| `_bmad/_config/skill-manifest.csv` | Edit (via script) | Populate tier/intent/dependencies for 101 rows |
| `_bmad-output/planning-artifacts/portability-borderline.md` | Create (via script) | Borderline review file |
| `tests/lib/portability-classification.test.js` | Create | New classification tests |
| `tests/lib/portability-schema.test.js` | Edit | Refactor parser to import from shared utility |

### Out of Scope (Do NOT do in this story)

- Building the exporter or transformer (Epic 2)
- Building the catalog generator (Epic 3)
- Validating dependency paths resolve to existing files (Story 1.3)
- Modifying any agent files, workflow files, or runtime code
- Changing the schema columns or category vocabulary (locked in Story 1.1)
- Re-running classification on every commit (CI integration is future work)

### Story Foundation (from Epic 1, Story 1.2)

This story populates the metadata foundation. After completion:
- Story 1.3 will add path-resolution validation
- Epic 2 (exporter) will consume `tier` and `dependencies` to drive transformation logic
- Epic 3 (catalog) will consume `intent` to build the decision-tree menu

Get the heuristics right — they're easier to fix here than after the exporter is built on top of them.

### Project Structure Notes

- `scripts/portability/` is a NEW directory. No existing scripts live there. This is the start of the Skill Portability initiative's runtime code.
- The shared `csv-utils.js` is intentionally separate from `scripts/lib/csv-utils.js` (which is the Team Factory writer utility). Different concerns, different consumers.
- `BORDERLINE.md` lives in `_bmad-output/planning-artifacts/` because it's a planning artifact reviewers consume, not an implementation artifact.

### References

- [vision-skill-portability.md](../planning-artifacts/vision-skill-portability.md) — vision doc
- [epics-skill-portability.md](../planning-artifacts/epics-skill-portability.md#story-12-classify-all-skills) — Epic 1 Story 1.2 original AC
- [_bmad/_config/portability-schema.md](../../_bmad/_config/portability-schema.md) — schema reference (Story 1.1 output)
- `_bmad/_config/skill-manifest.csv` — target manifest (101 data rows + header)
- [sp-1-1-define-portability-schema.md](sp-1-1-define-portability-schema.md) — Story 1.1, completed; the foundation this story builds on
- `tests/lib/portability-schema.test.js` — pattern reference for the new classification test

## Dev Agent Record

### Agent Model Used

(to be filled by dev agent)

### Debug Log References

### Completion Notes List

### File List
