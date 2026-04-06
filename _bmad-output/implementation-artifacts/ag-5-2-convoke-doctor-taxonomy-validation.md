# Story 5.2: convoke-doctor Taxonomy Validation

Status: ready-for-dev

## Story

As a Convoke operator,
I want `convoke-doctor` to validate my taxonomy configuration,
so that I catch malformed config, invalid IDs, and collisions before they cause problems.

## Acceptance Criteria

1. **Given** taxonomy.yaml exists, **When** operator runs `convoke-doctor`, **Then** a new check verifies taxonomy structure (initiatives.platform, initiatives.user, artifact_types, aliases)
2. Each initiative ID validated: lowercase alphanumeric with optional dashes
3. Each artifact type validated with same rules
4. Duplicates between platform and user sections detected and reported
5. Collisions between initiative IDs and artifact type IDs detected
6. Malformed YAML produces clear, actionable error message (NFR22)
7. If taxonomy.yaml missing: reports warning with fix guidance
8. Check integrates as new validation in existing doctor check sequence
9. Existing `convoke-doctor` tests continue to pass

## Tasks / Subtasks

- [ ] Task 1: Implement `checkTaxonomy(projectRoot)` in convoke-doctor.js (AC: #1-#7)
  - [ ] Add new function `checkTaxonomy(projectRoot)` returning check result object `{ name, passed, error?, warning?, fix? }`
  - [ ] Check 1: file exists at `_bmad/_config/taxonomy.yaml`. If missing: return warning with fix: "run convoke-migrate-artifacts or convoke-update"
  - [ ] Check 2: YAML parseable. If malformed: return error with clear message (NFR22)
  - [ ] Check 3: structure has required sections (initiatives.platform array, initiatives.user array, artifact_types array, aliases object)
  - [ ] Check 4: all IDs match pattern `/^[a-z][a-z0-9-]*$/` (same as `readTaxonomy` validation)
  - [ ] Check 5: no duplicates between `initiatives.platform` and `initiatives.user`
  - [ ] Check 6: no collisions between initiative IDs and artifact type IDs
  - [ ] Return array of check results (one per sub-check, or combined single result with details)

- [ ] Task 2: Integrate into doctor check sequence (AC: #8)
  - [ ] Call `checkTaxonomy(projectRoot)` in the global checks section (after existing checks)
  - [ ] Push results to the `checks[]` array
  - [ ] Match existing check result format: `{ name: 'Taxonomy: ...', passed, error/warning/fix }`

- [ ] Task 3: Write tests (AC: #1-#9)
  - [ ] Add to existing `tests/unit/validator.test.js` or create new test file
  - [ ] Use Node built-in test runner (`node:test`) matching existing doctor test pattern
  - [ ] Test: valid taxonomy passes all checks
  - [ ] Test: missing taxonomy returns warning (not error)
  - [ ] Test: malformed YAML returns actionable error
  - [ ] Test: invalid ID format detected
  - [ ] Test: duplicate between platform/user detected
  - [ ] Test: collision between initiative and artifact type detected
  - [ ] Existing `npm test` must pass (AC #9)

- [ ] Task 4: Run convoke-check and regression suite
  - [ ] Run `node scripts/convoke-check.js --skip-coverage` -- all steps pass
  - [ ] Run `node scripts/convoke-doctor.js` -- shows taxonomy check in output

## Dev Notes

### Previous Story (ag-5-1) Intelligence

- `readTaxonomy(projectRoot)` in `artifact-utils.js` already validates structure and ID format. However, it THROWS on errors — not suitable for doctor which needs to report problems without crashing.
- The ID pattern from `readTaxonomy`: `/^[a-z][a-z0-9-]*$/`
- `taxonomy-merger.js` creates taxonomy with platform defaults. The doctor validates what's there.
- convoke-doctor.js uses inline check functions, NOT the validator.js module.

### Architecture Compliance

**Doctor check pattern**: Each check returns `{ name, passed, error?, warning?, fix?, info? }`. The doctor aggregates and prints all results. Checks should NOT throw — report problems in the result object.

**Reuse readTaxonomy?**: NO — `readTaxonomy` throws on invalid. Doctor needs graceful error reporting. Implement taxonomy validation directly in the check function, using the same rules but catching errors instead of throwing.

### Anti-Patterns to AVOID

- Do NOT import `readTaxonomy` for validation — it throws on error, unsuitable for doctor
- Do NOT modify existing check functions
- Do NOT add taxonomy check to `validator.js` — doctor uses inline checks, validator is for convoke-update
- Do NOT crash on malformed YAML — return error check result

### File Structure

```
scripts/
└── convoke-doctor.js            # MODIFIED — add checkTaxonomy function + integration

tests/
└── unit/
    └── (existing doctor tests or new taxonomy-doctor.test.js)
```

### References

- [Source: prd-artifact-governance-portfolio.md -- FR43; NFR22]
- [Source: scripts/convoke-doctor.js -- existing check pattern]
- [Source: scripts/lib/artifact-utils.js -- readTaxonomy ID validation pattern]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
