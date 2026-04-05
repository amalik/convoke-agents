# Story 2.1: Initiative Inference Engine

Status: done

## Story

As a Convoke operator,
I want the migration to correctly infer which initiative owns each artifact,
so that the dry-run manifest proposes accurate renames.

## Acceptance Criteria

1. Greedy type matching: longest artifact type prefix matched first with dash boundary (`type + '-'` or exact `type + '.md'`)
2. Three-step initiative lookup: exact taxonomy match → alias match → ambiguous
3. `strategy-perimeter` resolves to `helm` via alias map
4. `team-factory` resolves to `loom` via alias map
5. Files where initiative cannot be confidently inferred are marked `confidence: 'low'` with candidate list
6. Four governance states detected: fully-governed (name + frontmatter match), half-governed (name matches, no frontmatter), ungoverned (no match), invalid-governed (name/frontmatter conflict)
7. Unit tests cover all known filename patterns from current repository with 100% inference rule coverage (NFR17)

## Tasks / Subtasks

- [ ] Task 1: Create test fixtures from current repository (AC: #7)
  - [ ] Create `tests/fixtures/artifact-samples/` directory
  - [ ] Create sample files representing each filename pattern found in the current repo (see Filename Inventory below)
  - [ ] Include files with and without frontmatter for governance state testing
  - [ ] Include at least one file with conflicting frontmatter (initiative in filename differs from frontmatter) for invalid-governed testing

- [ ] Task 1.5: Update taxonomy.yaml with additional initiative aliases (Design Decision #7)
  - [ ] Add to `_bmad/_config/taxonomy.yaml` aliases section: `strategic-navigator: helm`, `strategic-practitioner: helm`, `strategic: helm`
  - [ ] These cover the lean-persona and empathy-map filenames that use `strategic` variants
  - [ ] Run existing taxonomy tests to verify: `npx jest tests/lib/taxonomy.test.js`
  - [ ] Update taxonomy test to verify new alias count (was 3, now 6)

- [ ] Task 2: Implement `inferArtifactType(filename, taxonomy)` (AC: #1)
  - [ ] Add to `scripts/lib/artifact-utils.js`
  - [ ] Define `ARTIFACT_TYPE_ALIASES` constant: `{ 'problem-definition': 'problem-def', 'pre-registration': 'pre-reg', 'architecture': 'arch', 'hypothesis-contract': 'hypothesis' }`
  - [ ] Sort `taxonomy.artifact_types` by length descending (longest first)
  - [ ] For each type, check: `baseName.startsWith(type + '-')` OR `baseName === type`
  - [ ] If no greedy match: check if any `ARTIFACT_TYPE_ALIASES` key is a prefix of baseName → map to canonical type
  - [ ] Return first match (greedy canonical → then alias fallback)
  - [ ] Handle HC-prefixed files: strip `hcN-` prefix first, then match type from remainder
  - [ ] If no match at all, return `null`
  - [ ] Export `ARTIFACT_TYPE_ALIASES` for testing
  - [ ] JSDoc with `@param` and `@returns`

- [ ] Task 3: Implement `inferInitiative(filename, artifactType, taxonomy)` (AC: #2, #3, #4, #5)
  - [ ] Add to `scripts/lib/artifact-utils.js`
  - [ ] After type is removed from filename, extract the remainder as initiative candidate
  - [ ] Three-step lookup:
    1. **Exact match**: check candidate against `taxonomy.initiatives.platform` + `taxonomy.initiatives.user`
    2. **Alias match**: check candidate against `taxonomy.aliases` keys → return mapped value
    3. **Multi-segment alias**: try combining segments (e.g., `strategy-perimeter` is two segments that together form an alias)
  - [ ] If no match: return `{ initiative: null, confidence: 'low', candidates: [...possibleMatches] }`
  - [ ] If match: return `{ initiative: matchedId, confidence: 'high', source: 'exact'|'alias' }`
  - [ ] JSDoc with `@param` and `@returns`

- [ ] Task 4: Implement `getGovernanceState(filename, fileContent, taxonomy)` (AC: #6)
  - [ ] Add to `scripts/lib/artifact-utils.js`
  - [ ] Uses `inferArtifactType()` + `inferInitiative()` to check if filename follows convention
  - [ ] Uses `parseFrontmatter()` to check if frontmatter has `initiative` field
  - [ ] Four states:
    - `fully-governed`: filename matches convention AND frontmatter has matching `initiative`
    - `half-governed`: filename matches convention BUT no frontmatter `initiative` field
    - `ungoverned`: filename doesn't match convention
    - `invalid-governed`: filename matches convention BUT frontmatter `initiative` differs from filename
  - [ ] Returns `{ state: string, fileInitiative: string|null, frontmatterInitiative: string|null }`
  - [ ] JSDoc with `@param` and `@returns`

- [ ] Task 5: Implement `generateNewFilename(filename, initiative, artifactType, taxonomy)` (AC: #1, #2)
  - [ ] Add to `scripts/lib/artifact-utils.js`
  - [ ] Constructs `{initiative}-{artifactType}[-{qualifier}]-{date}.md` from parsed components
  - [ ] Extracts qualifier: whatever remains after removing type prefix, initiative, and date from original filename
  - [ ] Preserves date from original filename if present
  - [ ] If no date in original, omit date from new filename
  - [ ] Returns the new filename string

- [ ] Task 6: Write inference unit tests (AC: #1, #2, #3, #4, #5, #6, #7)
  - [ ] Create `tests/lib/inference.test.js`
  - [ ] Test `inferArtifactType()`:
    - `prd-gyre.md` → type: `prd`
    - `lean-persona-strategic-navigator-2026-04-04.md` → type: `lean-persona` (not `persona` — greedy match)
    - `hc2-problem-definition-gyre-2026-03-21.md` → type: `problem-def` (after HC strip)
    - `epic-forge-phase-a.md` → type: `epic`
    - `architecture.md` → type: `arch` or null (depends on matching strategy)
    - `empathy-map-strategic-navigator-2026-04-05.md` → type: `empathy-map`
    - `decision-scope-forge-2026-03-21.md` → type: `decision`
    - `signal-gyre-brownfield-pilot-2026-04-02.md` → type: `signal`
    - `pre-registration-strategy-perimeter-2026-04-04.md` → type: `pre-reg` (via ARTIFACT_TYPE_ALIASES)
    - `architecture-gyre.md` → type: `arch` (via ARTIFACT_TYPE_ALIASES)
    - `architecture.md` → type: `arch` (via ARTIFACT_TYPE_ALIASES, exact match)
    - Unknown type file → null
  - [ ] Test `inferInitiative()`:
    - After type `prd` removed from `prd-gyre.md` → initiative: `gyre` (exact match)
    - After type removed, remainder is `strategy-perimeter` → initiative: `helm` (alias match)
    - After type removed, remainder is `team-factory` → initiative: `loom` (alias match)
    - After type removed, remainder is `convoke-ecosystem` → initiative: `convoke` (exact partial)
    - Remainder has no match → confidence: `low`, candidates populated
  - [ ] Test `getGovernanceState()`:
    - File with matching convention + matching frontmatter → `fully-governed`
    - File with matching convention + no frontmatter → `half-governed`
    - File with non-convention name → `ungoverned`
    - File with convention name but different frontmatter initiative → `invalid-governed`
  - [ ] Test `generateNewFilename()`:
    - `prd-gyre.md` with initiative `gyre`, type `prd` → `gyre-prd.md`
    - `hc2-problem-definition-gyre-2026-03-21.md` with initiative `gyre`, type `problem-def` → `gyre-problem-def-hc2-2026-03-21.md`
    - `lean-persona-strategic-navigator-2026-04-04.md` with initiative `helm`, type `lean-persona` → `helm-lean-persona-strategic-navigator-2026-04-04.md`
    - Dated file preserves date, undated file omits date
  - [ ] All tests use the real taxonomy from `_bmad/_config/taxonomy.yaml` via `readTaxonomy()`

- [ ] Task 7: Export new functions and run full test suite
  - [ ] Export `inferArtifactType`, `inferInitiative`, `getGovernanceState`, `generateNewFilename` from `artifact-utils.js`
  - [ ] Run `npx jest tests/lib/` — all existing 62 tests + new tests must pass
  - [ ] Run `node scripts/archive.js --rename` — regression check, output must match baseline

## Dev Notes

### Previous Story Learnings (Epic 1)

- `parseFilename()` exists but uses the OLD `VALID_CATEGORIES` list (from ADR). It does NOT do initiative inference — it only extracts category prefix. The new functions in this story work *alongside* parseFilename, not replacing it.
- `readTaxonomy()` loads taxonomy.yaml and returns `TaxonomyConfig` with `initiatives`, `artifact_types`, and `aliases`.
- `parseFrontmatter()` loads frontmatter from file content — used by `getGovernanceState()`.
- `VALID_STATUSES` and `validateFrontmatterSchema()` exist but are NOT needed in this story.
- **Retro Action Item #1**: This story MUST be reviewed by Amalik before dev handoff.

### Architecture Reference — Inference Algorithm

**Step-by-step pseudocode (from architecture Decision 1):**

```
For each file in scope:
  1. Extract date suffix (if present) using DATED_PATTERN
  2. Remove date suffix to get baseName
  3. Sort taxonomy.artifact_types by length descending
  4. Try each type: does baseName start with `type + '-'` or equal `type`?
     → First match wins (greedy, longest prefix)
  5. Special: if baseName starts with `hcN-`, strip the HC prefix, re-run type match on remainder
  6. After type matched, extract remainder as initiative candidate
  7. Three-step initiative lookup:
     a. Exact match against taxonomy.initiatives.platform + user
     b. Alias match against taxonomy.aliases keys
     c. Multi-segment: try combining remaining segments into alias candidates
  8. If no match → ambiguous (confidence: low)
```

### Current Filename Inventory (for test fixtures)

**Planning artifacts — patterns detected:**

| Filename | Expected Type | Expected Initiative | Notes |
|----------|--------------|-------------------|-------|
| `prd-gyre.md` | prd | gyre | Simple type-initiative |
| `prd.md` | prd | **ambiguous** | No initiative segment |
| `architecture.md` | arch | **ambiguous** | No initiative segment |
| `architecture-gyre.md` | arch | gyre | Via ARTIFACT_TYPE_ALIASES: `architecture` → `arch` |
| `epic-forge-phase-a.md` | epic | forge | Qualifier: phase-a |
| `brief-gyre-2026-03-19.md` | brief | gyre | Dated |
| `adr-repo-organization-conventions-2026-03-22.md` | adr | **ambiguous** | Descriptor, no clear initiative |
| `report-prd-validation-gyre.md` | report | gyre | Complex descriptor |
| `spec-baseartifact-contract.md` | spec | **ambiguous** | Descriptor, no initiative |
| `initiatives-backlog.md` | **none** | **ambiguous** | No type prefix match |
| `sprint-change-proposal-2026-03-07.md` | sprint | **ambiguous** | Descriptor, no initiative |
| `story-team-factory-review-fixes.md` | story | loom | Via alias: team-factory → loom |

**Vortex artifacts — patterns detected:**

| Filename | Expected Type | Expected Initiative | Notes |
|----------|--------------|-------------------|-------|
| `hc2-problem-definition-gyre-2026-03-21.md` | problem-def | gyre | HC prefix + type + initiative |
| `hc3-hypothesis-contract-forge-2026-03-21.md` | hypothesis | forge | HC prefix (note: `hypothesis-contract` needs careful matching) |
| `hc4-experiment-strategy-concierge-2026-04-05.md` | experiment | helm | Via alias: strategy → helm |
| `lean-persona-strategic-navigator-2026-04-04.md` | lean-persona | helm | Via initiative alias: `strategic-navigator` → `helm` |
| `persona-engineering-lead-2026-03-21.md` | persona | **ambiguous** | No clear initiative in name |
| `empathy-map-strategic-navigator-2026-04-05.md` | empathy-map | helm | Via initiative alias: `strategic-navigator` → `helm` |
| `decision-scope-forge-2026-03-21.md` | decision | forge | |
| `scope-decision-strategy-perimeter-2026-04-04.md` | scope | helm | Via alias: strategy-perimeter → helm |
| `pre-registration-strategy-perimeter-2026-04-04.md` | pre-reg | helm | Via ARTIFACT_TYPE_ALIASES: `pre-registration` → `pre-reg`. Via initiative alias: `strategy-perimeter` → `helm` |
| `signal-gyre-brownfield-pilot-2026-04-02.md` | signal | gyre | |
| `vision-team-factory-2026-03-21.md` | vision | loom | Via alias: team-factory → loom |
| `experiment-gyre-discovery-interviews-2026-03-20.md` | experiment | gyre | |
| `report-usage-telemetry-discovery-2026-03-10.md` | report | **ambiguous** | No clear initiative |

**Gyre artifacts:**

| Filename | Expected Type | Expected Initiative | Notes |
|----------|--------------|-------------------|-------|
| `accuracy-validation-2026-03-23.md` | **none** | gyre | Infer from folder context |

### Critical Design Decisions

1. **`architecture.md` vs `arch-*.md`**: The taxonomy has type `arch`, but existing files use `architecture-`. These don't match `arch + '-'`. Decision: files starting with `architecture` that don't match `arch-` are treated as **ambiguous** — surfaced for manual resolution. The migration will rename them.

2. **HC prefix handling**: `hc2-problem-definition-gyre-...` — strip the `hcN-` prefix first. The `hc` is NOT the artifact type; `problem-def` is. The HC number becomes a qualifier in the new name: `gyre-problem-def-hc2-2026-03-21.md`.

3. **`hypothesis-contract` vs `hypothesis`**: The type is `hypothesis` but the old filename says `hypothesis-contract`. After greedy matching, `hypothesis` matches the prefix. The remainder (`contract-forge-...`) contains the initiative. `contract` becomes part of the qualifier.

4. **Initiative from middle segments**: In `lean-persona-strategic-navigator-2026-04-04.md`, after type `lean-persona` is matched and date is stripped, the remainder is `strategic-navigator`. Neither is a direct initiative. But `strategic` → via alias candidates, try `strategy` → alias match to `helm`. The inference engine needs to try sub-segments and known alias patterns.

5. **Folder-based inference fallback**: `accuracy-validation-2026-03-23.md` in `gyre-artifacts/` — if filename inference fails, the folder name is a strong hint. For vortex-artifacts, folder doesn't indicate initiative. For gyre-artifacts, the folder IS the initiative.

6. **Artifact type long-form mismatch**: The taxonomy uses abbreviations (`problem-def`, `pre-reg`, `arch`) but existing filenames use long forms (`problem-definition`, `pre-registration`, `architecture`). The dash-boundary greedy match (`problem-def-` ≠ `problem-definition-`) FAILS on these. **Solution**: Add an `artifact_type_aliases` map to the inference engine (NOT to taxonomy.yaml — this is inference-time mapping, not config):

   ```javascript
   const ARTIFACT_TYPE_ALIASES = {
     'problem-definition': 'problem-def',
     'pre-registration': 'pre-reg',
     'architecture': 'arch',
     'hypothesis-contract': 'hypothesis'
   };
   ```

   The inference algorithm becomes: try greedy match first → if no match, check if any `ARTIFACT_TYPE_ALIASES` key is a prefix → map to canonical type. This is a constant in the code, not in taxonomy.yaml, because it maps OLD naming to NEW naming — it's migration-specific.

7. **Initiative inference from qualifiers with partial alias matches**: In `lean-persona-strategic-navigator-2026-04-04.md`, after stripping type + date, the remainder is `strategic-navigator`. The alias map has `strategy → helm` but NOT `strategic → helm`. The engine should try progressively shorter prefixes of multi-segment remainders against the alias map: `strategic-navigator` (no match) → `strategic` (no match) → give up. This file is **ambiguous** for initiative unless we add `strategic` as an alias. **Decision**: Add `strategic: helm` to taxonomy.yaml aliases for migration. Same for `strategic-navigator: helm` and `strategic-practitioner: helm` (covers both lean-persona files).

### Anti-Patterns to AVOID

- ❌ Do NOT modify `parseFilename()` — it serves archive.js backward compatibility. Create new functions alongside it.
- ❌ Do NOT hardcode initiative IDs — always read from taxonomy via parameter
- ❌ Do NOT make inference functions async — they operate on already-loaded data (filename strings + taxonomy object)
- ❌ Do NOT read file content in inference functions — `getGovernanceState` receives content as a parameter, doesn't read files itself
- ❌ Do NOT try to handle ALL edge cases perfectly — ambiguous files are surfaced for manual resolution. That's the design.

### Project Structure Notes

```
scripts/
└── lib/
    ├── artifact-utils.js    # MODIFIED — add inferArtifactType, inferInitiative, getGovernanceState, generateNewFilename
    └── types.js             # EXISTING — types already defined

tests/
├── fixtures/
│   └── artifact-samples/    # NEW — sample files for inference testing
└── lib/
    ├── artifact-utils.test.js  # EXISTING — not modified
    ├── taxonomy.test.js        # EXISTING — not modified
    └── inference.test.js       # NEW — inference engine tests
```

### Testing Standards

- Jest test framework
- File: `tests/lib/inference.test.js` (separate from artifact-utils.test.js — this is a distinct concern)
- Load real taxonomy via `readTaxonomy(findProjectRoot())`
- 100% coverage on all inference functions (NFR17)
- Test with real filenames from current repo (the inventory above)
- Test all 4 governance states with fixture files
- Run full `tests/lib/` suite after: 62 existing + new must all pass

### References

- [Source: arch-artifact-governance-portfolio.md — Decision 1: Migration Inference Rule Set]
- [Source: arch-artifact-governance-portfolio.md — Greedy type matching, alias map, ambiguity handling]
- [Source: prd-artifact-governance-portfolio.md — FR9, FR10, FR11, FR18]
- [Source: scripts/lib/artifact-utils.js — parseFilename(), readTaxonomy(), parseFrontmatter()]
- [Source: _bmad/_config/taxonomy.yaml — initiative IDs, artifact types, aliases]
- [Source: ag-epic-1-retro-2026-04-05.md — Action Item #1: story review before dev]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (1M context)

### Debug Log References

- 100/100 lib tests pass (62 existing + 38 new inference tests)
- Archive regression: 71 warnings (expected — new fixture + story files)
- 3 test failures during development, all resolved:
  1. `hypothesis-contract` alias ordering — fixed by checking aliases before canonical types
  2. `prd-validation-gyre` initiative from suffix — added suffix matching step to inferInitiative
  3. `scope-decision-strategy-perimeter` qualifier extraction — rewrote generateNewFilename to handle both prefix and suffix initiative consumption

### Completion Notes List

- ✅ Created 29 test fixture files in `tests/fixtures/artifact-samples/` representing all filename patterns
- ✅ Updated `taxonomy.yaml` with 3 additional initiative aliases: `strategic`, `strategic-navigator`, `strategic-practitioner` → `helm`
- ✅ Implemented `inferArtifactType(filename, taxonomy)` — greedy longest-prefix match with ARTIFACT_TYPE_ALIASES fallback. Aliases checked FIRST (longer, more specific) then canonical types.
- ✅ Implemented `inferInitiative(remainder, taxonomy)` — 5-step lookup: exact → alias → progressive prefix → progressive suffix → first segment
- ✅ Implemented `getGovernanceState(filename, fileContent, taxonomy)` — 4 states: fully-governed, half-governed, ungoverned, invalid-governed
- ✅ Implemented `generateNewFilename(filename, initiative, artifactType, taxonomy)` — handles HC prefix as qualifier, prefix/suffix initiative consumption, date preservation
- ✅ Defined `ARTIFACT_TYPE_ALIASES` constant: problem-definition→problem-def, pre-registration→pre-reg, architecture→arch, hypothesis-contract→hypothesis
- ✅ 38 new tests: 15 inferArtifactType, 12 inferInitiative, 5 getGovernanceState, 7 generateNewFilename
- ✅ Taxonomy test updated for 6 aliases (was 3)

### File List

- `scripts/lib/artifact-utils.js` — MODIFIED (added 4 inference functions + ARTIFACT_TYPE_ALIASES + HC_PREFIX_PATTERN)
- `_bmad/_config/taxonomy.yaml` — MODIFIED (added 3 initiative aliases)
- `tests/lib/inference.test.js` — NEW (38 tests)
- `tests/lib/taxonomy.test.js` — MODIFIED (updated alias count assertion)
- `tests/fixtures/artifact-samples/` — NEW (29 fixture files)
