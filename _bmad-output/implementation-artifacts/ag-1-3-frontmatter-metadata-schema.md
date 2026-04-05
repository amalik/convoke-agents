# Story 1.3: Frontmatter Metadata Schema

Status: done

## Story

As a Convoke operator,
I want a defined frontmatter schema for artifact metadata,
so that governance tools can read and write consistent structured data in every artifact.

## Acceptance Criteria

1. Frontmatter schema v1 defines fields: `initiative` (required), `artifact_type` (required), `created` (required), `schema_version` (required, integer = 1), `status` (optional, enum: draft/validated/superseded/active)
2. `schema_version` is always set to `1`
3. `status` accepts only: `draft`, `validated`, `superseded`, `active` — rejects anything else
4. Existing frontmatter fields are preserved — new fields added, never overwritten (NFR20)
5. Content below frontmatter is preserved byte-for-byte
6. Field conflicts are detected and reported, not silently resolved
7. Files with no existing frontmatter receive a new frontmatter block
8. Metadata-only files (frontmatter with empty content) are handled safely
9. Unit tests validate all edge cases

## Tasks / Subtasks

- [x] Task 1: Create schema validation helper (AC: #1, #2, #3)
  - [x] Added `validateFrontmatterSchema(fields, taxonomy)` to `scripts/lib/artifact-utils.js`
  - [x] Validates required fields: initiative, artifact_type, created, schema_version
  - [x] Validates created is ISO 8601 date format
  - [x] Validates schema_version is integer >= 1
  - [x] Validates status (if present) is one of closed enum
  - [x] Validates initiative exists in taxonomy
  - [x] Validates artifact_type exists in taxonomy
  - [x] Returns `{ valid, errors }` with clear messages
  - [x] Exported VALID_STATUSES constant

- [x] Task 2: Create `buildSchemaFields()` convenience function (AC: #1, #2)
  - [x] Added `buildSchemaFields(initiative, artifactType, options)` to artifact-utils.js
  - [x] Returns complete frontmatter with schema_version: 1, created defaults to today
  - [x] Status included only when provided in options
  - [x] Does NOT validate — separate concern

- [x] Task 3: Write schema validation tests (AC: #1, #2, #3, #9)
  - [x] 14 test cases: valid pass, all 4 statuses pass, missing fields reject (4), invalid status, schema_version 0, schema_version string, initiative not in taxonomy, type not in taxonomy, invalid created format, multiple errors collected

- [x] Task 4: Write `buildSchemaFields()` tests (AC: #2)
  - [x] 5 test cases: required fields, schema_version=1, today's date, status optional, custom created

- [x] Task 5: Verify existing `injectFrontmatter()` tests still pass (AC: #4, #5, #6, #7, #8)
  - [x] All 62 tests pass (28 from 1.1 + 15 from 1.2 + 19 new)
  - [x] ACs #4-#8 confirmed satisfied by existing Story 1.1 tests

## Dev Notes

### Previous Story Learnings (ag-1-1 and ag-1-2)

- `injectFrontmatter()` already exists in `scripts/lib/artifact-utils.js` and handles: field preservation (NFR20), conflict detection, content preservation, metadata-only files, no-frontmatter files
- **5 existing `injectFrontmatter` tests** already cover ACs #4-#8 — do NOT duplicate them
- `parseFrontmatter()` has input validation (type check) and error handling (try/catch around gray-matter)
- `readTaxonomy()` exists and returns `TaxonomyConfig` — use it for initiative/type validation
- `taxonomy.yaml` exists at `_bmad/_config/taxonomy.yaml` with 8 platform IDs and 21 artifact types

### What This Story Actually Adds

Story 1.1 built the low-level read/write functions. This story adds the **schema contract** — validation that the fields being injected conform to the governance schema. Specifically:

1. `validateFrontmatterSchema(fields)` — validates a set of fields against schema rules
2. `buildSchemaFields(initiative, artifactType, options)` — convenience to construct a valid field set

These are used by the migration script (Story 3.2) and workflow adoption (Story 5.3) when injecting frontmatter into artifacts. They ensure every injection produces schema-compliant metadata.

### Architecture Compliance

- **CommonJS only** — `require()`, not `import`
- **JSDoc type annotations** on new function signatures
- **No new dependencies** — uses existing taxonomy.yaml + readTaxonomy()
- **Status enum is a CONSTANT** — define `VALID_STATUSES = ['draft', 'validated', 'superseded', 'active']` and export it
- **schema_version is always 1** for this story. Future stories may increment it.

### Anti-Patterns to AVOID

- ❌ Do NOT modify `injectFrontmatter()` — it's a generic low-level function. Schema validation is a separate concern.
- ❌ Do NOT duplicate the existing 5 `injectFrontmatter` tests — they already pass. Just verify they still pass.
- ❌ Do NOT hardcode initiative IDs in the validation function — read from taxonomy via parameter
- ❌ Do NOT make `status` required — it's optional per the schema spec

### Project Structure Notes

```
scripts/
└── lib/
    ├── artifact-utils.js    # MODIFIED — add validateFrontmatterSchema(), buildSchemaFields(), VALID_STATUSES
    └── types.js             # EXISTING — FrontmatterSchema typedef already defined

tests/
└── lib/
    ├── artifact-utils.test.js  # MODIFIED — add schema validation + buildSchemaFields tests
    └── taxonomy.test.js        # EXISTING (Story 1.2) — not modified
```

### Testing Standards

- Jest test framework
- Append new `describe` blocks to existing `tests/lib/artifact-utils.test.js`
- `validateFrontmatterSchema` tests: ~11 cases (valid pass, missing fields reject, invalid values reject)
- `buildSchemaFields` tests: ~5 cases
- Run full `tests/lib/` suite after changes: 43 existing + new tests must all pass

### References

- [Source: arch-artifact-governance-portfolio.md — Decision 4: Frontmatter Schema v1]
- [Source: prd-artifact-governance-portfolio.md — FR4, NFR20]
- [Source: scripts/lib/artifact-utils.js — existing injectFrontmatter(), parseFrontmatter()]
- [Source: scripts/lib/types.js — FrontmatterSchema typedef]
- [Source: _bmad/_config/taxonomy.yaml — initiative + type lists for validation]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (1M context)

### Debug Log References

- 62/62 lib tests pass (28 story 1.1 + 15 story 1.2 + 19 new)
- Archive regression: 69 warnings (67 + 2 new files from stories 1.2/1.3 — expected)

### Completion Notes List

- ✅ Added `validateFrontmatterSchema(fields, taxonomy)` — validates all required fields, types, enums, and taxonomy membership
- ✅ Added `buildSchemaFields(initiative, artifactType, options)` — convenience builder with schema_version: 1 and today's date default
- ✅ Exported `VALID_STATUSES` constant: ['draft', 'validated', 'superseded', 'active']
- ✅ 14 validation test cases + 5 builder test cases = 19 new tests
- ✅ All existing tests unaffected — 43 prior tests still pass

### File List

- `scripts/lib/artifact-utils.js` — MODIFIED (added validateFrontmatterSchema, buildSchemaFields, VALID_STATUSES, DATE_PATTERN)
- `tests/lib/artifact-utils.test.js` — MODIFIED (added 19 tests in 2 new describe blocks)
