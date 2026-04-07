# Story SP-1.1: Define Portability Schema

Status: ready-for-dev

## Story

As a platform maintainer,
I want a documented schema for skill portability metadata,
so that classification is consistent and the exporter can consume it programmatically.

## Acceptance Criteria

1. `_bmad/_config/skill-manifest.csv` is extended with three new columns: `tier`, `intent`, `dependencies` (in that order, appended after the existing `install_to_bmad` column)
2. The `tier` column accepts exactly three string values: `standalone`, `light-deps`, `pipeline`
3. The `intent` column accepts one of the following category strings: `think-through-problem`, `define-what-to-build`, `review-something`, `write-documentation`, `plan-your-work`, `test-your-code`, `discover-product-fit`, `assess-readiness`, `meta-platform`
4. The `dependencies` column is a semicolon-delimited list of dependency identifiers (template paths relative to project root, config keys as `config:key-name`, or skill names). Empty string is valid for skills with no dependencies.
5. A schema reference document exists at `_bmad/_config/portability-schema.md` that documents:
   - Each new field's purpose, valid values, and examples
   - The full intent category taxonomy with one-line descriptions of each category
   - The dependency notation conventions (path format, prefix conventions for non-file deps)
   - At least one fully-worked example per tier (standalone, light-deps, pipeline)
6. The schema document explicitly states the rule that Tier 3 (pipeline) skills are NOT force-exported standalone — their `dependencies` column documents prerequisites instead
7. All existing 99 skill manifest rows remain valid CSV after the column addition (no parse errors when reading with a standard CSV parser); pre-existing column values are preserved unchanged
8. New unit test verifies the manifest can be parsed and that all rows have either empty or valid values in the new columns (validation that they exist as columns, not yet that every row is classified — that is Story 1.2's job)

## Tasks / Subtasks

- [ ] Task 1: Add new columns to skill manifest header (AC: #1, #7)
  - [ ] Read `_bmad/_config/skill-manifest.csv` with the existing CSV utilities (`scripts/lib/csv-utils.js` if available, otherwise use `scripts/update/lib/utils.js` patterns)
  - [ ] Append `tier,intent,dependencies` to the header row
  - [ ] Append `,,` (three empty fields) to every existing data row to preserve CSV column count alignment
  - [ ] Verify file parses cleanly with a standard CSV parser
  - [ ] Verify line count is unchanged (100 lines including header)

- [ ] Task 2: Create the schema reference document (AC: #5, #6)
  - [ ] Create `_bmad/_config/portability-schema.md`
  - [ ] Add header section explaining the purpose: "Defines the metadata schema used by the skill exporter and catalog generator for the Skill Portability initiative. Source: vision-skill-portability.md."
  - [ ] Add `## Tier` section documenting the three valid values with criteria for each:
    - `standalone`: Agent persona + instructions, no external file deps. Exports as-is with framework refs stripped.
    - `light-deps`: Needs templates or config defaults to function. Exporter inlines template content and replaces config refs with placeholders.
    - `pipeline`: Depends on prior artifacts (e.g., a story file from SM) or chained skills. NOT force-exported standalone — prerequisites documented instead.
  - [ ] Add `## Intent` section listing all 9 intent categories with one-line descriptions and example skills
  - [ ] Add `## Dependencies` section documenting the notation:
    - File path format: relative to project root (e.g., `_bmad/bmm/templates/prd-template.md`)
    - Config key format: `config:` prefix (e.g., `config:output_folder`)
    - Skill name format: bare skill name (e.g., `bmad-init`)
    - Multiple values: semicolon-delimited
  - [ ] Add `## Examples` section with one fully-worked example per tier:
    - Tier 1 example: `bmad-brainstorming` (Carson) — tier=standalone, intent=think-through-problem, dependencies=
    - Tier 2 example: `bmad-create-prd` (John) — tier=light-deps, intent=define-what-to-build, dependencies=`_bmad/bmm/templates/prd-template.md;config:output_folder`
    - Tier 3 example: `bmad-dev-story` (Amelia) — tier=pipeline, intent=plan-your-work, dependencies=`bmad-create-story;config:implementation_artifacts`

- [ ] Task 3: Write unit test for schema column existence (AC: #8)
  - [ ] Create `tests/lib/portability-schema.test.js` (or add to existing manifest test if one exists)
  - [ ] Test 1: Parse `skill-manifest.csv` and assert the header contains `tier`, `intent`, `dependencies` columns
  - [ ] Test 2: Parse all data rows and assert each has 9 columns (the original 6 + the 3 new ones)
  - [ ] Test 3: For any row where `tier` is non-empty, assert it equals one of `standalone`, `light-deps`, `pipeline`
  - [ ] Test 4: For any row where `intent` is non-empty, assert it equals one of the 9 valid intent categories
  - [ ] All tests pass with empty values (this story does NOT classify the skills — Story 1.2 does)

- [ ] Task 4: Verify no regressions in existing tooling (AC: #7)
  - [ ] Run any existing tests that consume `skill-manifest.csv` (search for test files referencing it)
  - [ ] Run `convoke-doctor` to verify it doesn't choke on the new columns
  - [ ] Run `convoke-update --dry-run` to verify the validator doesn't flag the new columns

## Dev Notes

### Architecture Compliance (CRITICAL)

- **Source of truth:** [vision-skill-portability.md](../planning-artifacts/vision-skill-portability.md) and [epics-skill-portability.md](../planning-artifacts/epics-skill-portability.md). Story is Epic 1, Story 1.1.
- **Manifest contract:** `_bmad/_config/skill-manifest.csv` is a load-bearing file. The installer, validator, and doctor all read it. Adding columns is safe ONLY if existing readers tolerate extra columns (they should — CSV is positional).
- **CommonJS only** — use `require()`, not `import`. Follow existing codebase convention.
- **No new dependencies** — use existing CSV parsing patterns. Do NOT add `csv-parse` or similar.
- **Path handling:** use `path.join()` and `findProjectRoot()` from `scripts/update/lib/utils.js` — never `process.cwd()` directly.
- **Naming convention compatibility:** new file paths must be lowercase-kebab. The schema doc filename is `portability-schema.md` (no date, no initiative prefix — it's a stable config reference, not a dated artifact).

### Source Files to Touch

| Path | Action | Purpose |
|------|--------|---------|
| `_bmad/_config/skill-manifest.csv` | Edit | Add 3 new columns + pad existing rows |
| `_bmad/_config/portability-schema.md` | Create | Schema reference document |
| `tests/lib/portability-schema.test.js` | Create | Validation tests |

### Existing Manifest Format

Current CSV header (6 columns):
```
canonicalId,name,description,module,path,install_to_bmad
```

After this story (9 columns):
```
canonicalId,name,description,module,path,install_to_bmad,tier,intent,dependencies
```

Total existing rows: **99 skills** (file has 100 lines including header).

### Intent Category Taxonomy (final)

These 9 categories are the canonical set defined by the vision doc. They MUST match exactly the strings used by the catalog generator (Story 3.1):

| Category | Example Skills |
|----------|---------------|
| `think-through-problem` | bmad-brainstorming, bmad-cis-problem-solving, bmad-cis-design-thinking |
| `define-what-to-build` | bmad-create-prd, bmad-product-brief, bmad-create-ux-design, bmad-create-architecture |
| `review-something` | bmad-code-review, bmad-review-adversarial-general, bmad-editorial-review-prose |
| `write-documentation` | bmad-document-project, bmad-generate-project-context, bmad-index-docs |
| `plan-your-work` | bmad-create-story, bmad-create-epics-and-stories, bmad-sprint-planning |
| `test-your-code` | bmad-testarch-test-design, bmad-testarch-atdd, bmad-qa-generate-e2e-tests |
| `discover-product-fit` | bmad-agent-bme-* (Vortex stream agents) |
| `assess-readiness` | bmad-agent-bme-stack-detective (Gyre agents), bmad-check-implementation-readiness |
| `meta-platform` | bmad-init, bmad-help, bmad-party-mode, bmad-builder-setup |

### Tier Classification Rules

- **Tier 1 (standalone):** No external file dependencies beyond the skill's own `SKILL.md` and any sibling files in the same directory. Pure agent personas (CIS), reviews, and elicitation typically qualify.
- **Tier 2 (light-deps):** Depends on templates (e.g., PRD template), config values (e.g., `output_folder`), or sidecar memory files. Self-contained after template inlining.
- **Tier 3 (pipeline):** Requires either a prior artifact (e.g., story file from SM, epic file) OR another skill in a chain. Examples: `bmad-dev-story` needs a story file, `bmad-sprint-planning` needs epics, WDS phases run sequentially.

**Decision rule for borderline cases:** If a skill could function with EMPTY input and produce useful output, it's Tier 1 or Tier 2. If it errors or produces nonsense without specific prior artifacts, it's Tier 3.

### Story Foundation (from Epic 1, Story 1.1)

This story is the **foundation** for the entire Skill Portability initiative. Every subsequent story (1.2 classification, 2.x exporter, 3.x catalog) consumes this schema. Get the column names exactly right — renames cascade.

### Project Structure Notes

- Manifest CSVs live in `_bmad/_config/` and are read by installer, validator, and doctor scripts under `scripts/`.
- The schema doc lives alongside the CSV (`_bmad/_config/portability-schema.md`) so it's discoverable next to the data it describes.
- Tests live in `tests/lib/` following the existing pattern (see `tests/lib/migration-execution.test.js`, `tests/lib/portfolio-engine.test.js`).
- No conflicts with existing structure — purely additive change.

### Out of Scope (Do NOT do in this story)

- Classifying actual skills (that is Story 1.2)
- Validating dependency paths resolve to existing files (that is Story 1.3)
- Building the exporter or catalog (Epics 2 and 3)
- Modifying any agent files, workflow files, or runtime code

### References

- [vision-skill-portability.md](../planning-artifacts/vision-skill-portability.md) — Vision doc, "New metadata needed" section
- [epics-skill-portability.md](../planning-artifacts/epics-skill-portability.md#story-11-define-portability-schema) — Epic 1 Story 1.1 with original AC
- `_bmad/_config/skill-manifest.csv` — Existing manifest file to extend
- `_bmad/_config/agent-manifest.csv` — Sister manifest, useful as a structural reference
- `tests/lib/migration-execution.test.js` — Test pattern reference

## Dev Agent Record

### Agent Model Used

(to be filled by dev agent)

### Debug Log References

### Completion Notes List

### File List
