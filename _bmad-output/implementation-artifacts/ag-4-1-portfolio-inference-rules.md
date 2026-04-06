# Story 4.1: Portfolio Inference Rules

Status: done

## Story

As a Convoke operator,
I want the portfolio skill to accurately infer each initiative's phase and status from existing artifacts,
so that I get trustworthy visibility without manually tracking anything.

## Acceptance Criteria

1. **Given** artifacts exist across `_bmad-output/` directories for multiple initiatives, **When** the inference rule chain executes, **Then** `frontmatter-rule.js` reads explicit status from frontmatter when present (highest priority)
2. `artifact-chain-rule.js` infers phase using priority order: explicit frontmatter phase (overrides all) -> epic with stories done = `complete` -> epic + sprint = `build` -> architecture doc = `planning` -> HC artifacts = `discovery` -> PRD/brief only = `planning` -> no match = `unknown`
3. `artifact-chain-rule.js` detects Vortex discovery completeness from HC chain (HC2->HC3->HC4->HC5->HC6) (FR34)
4. `git-recency-rule.js` infers `ongoing` when git activity within stale_days, `stale` when beyond threshold (default 30 days, configurable via FR37)
5. `conflict-resolver.js` resolves conflicts: explicit wins over inferred, later phases override earlier
6. Flexible epic status markers recognized: `done`, `complete`, `✅`, `[x]`, strikethrough
7. Multiple epics for same initiative -> latest modified used
8. Each rule produces the InitiativeState data structure with `value`, `source`, `confidence` fields
9. Stale detection checks current branch only (documented known limitation)
10. Unit tests achieve 100% coverage on all 4 inference rules (NFR18)
11. Test fixtures in `tests/fixtures/artifact-samples/` cover all known patterns (NFR19)

## Tasks / Subtasks

- [x] Task 1: Create portfolio directory structure and scaffold (AC: #8)
  - [x] Create `scripts/lib/portfolio/` directory
  - [x] Create `scripts/lib/portfolio/rules/` directory
  - [x] Scaffold empty rule files: `frontmatter-rule.js`, `artifact-chain-rule.js`, `git-recency-rule.js`, `conflict-resolver.js`
  - [x] Each rule exports a function with signature: `(initiativeState, artifacts, options) => initiativeState`
  - [x] Rules are pure-ish functions: receive data, return enriched data. No side effects except git log reads.

- [x] Task 2: Implement `frontmatter-rule.js` (AC: #1, #8)
  - [x] For each artifact belonging to the initiative: parse frontmatter via `parseFrontmatter`
  - [x] If frontmatter has `status` field (standard schema field: draft/validated/superseded/active): set `initiativeState.status = { value, source: 'frontmatter', confidence: 'explicit' }`
  - [x] If frontmatter has `phase` field (operator-provided override — NOT in standard schema, never injected by migration): set `initiativeState.phase = { value, source: 'frontmatter', confidence: 'explicit' }`
  - [x] Do NOT extend FrontmatterSchema or bump schema_version for `phase` — it's read-if-present, not required
  - [x] Explicit frontmatter has highest priority — later rules should not override it
  - [x] Export rule function

- [x] Task 3: Implement `artifact-chain-rule.js` (AC: #2, #3, #6, #7)
  - [x] Analyze the set of artifacts for an initiative to infer phase
  - [x] Priority order (highest first):
    1. Epic with all stories done/complete/[x]/strikethrough -> phase: `complete`
    2. Epic + sprint artifact present -> phase: `build`
    3. Architecture doc present -> phase: `planning`
    4. HC artifacts present (HC2-HC6) -> phase: `discovery`
    5. PRD or brief only -> phase: `planning`
    6. No recognized artifacts -> phase: `unknown`
  - [x] Vortex HC chain completeness (FR34): check for HC2, HC3, HC4, HC5, HC6 artifacts. Report which are present/missing.
  - [x] Multiple epics: use the most recently modified (by git log date or filename date suffix)
  - [x] Epic status detection: scan epic file content for status markers (`done`, `complete`, `✅`, `[x]`, `~~strikethrough~~`)
  - [x] Set `confidence: 'inferred'`, `source: 'artifact-chain'`
  - [x] Export rule function

- [x] Task 4: Implement `git-recency-rule.js` (AC: #4, #9)
  - [x] For the initiative's most recent artifact: run `git log -1 --format=%as` to get last commit date
  - [x] Compare with current date: if within `stale_days` (default 30) -> status: `ongoing`; if beyond -> status: `stale`
  - [x] `stale_days` configurable via `options.staleDays` parameter
  - [x] Use `execFileSync` for git operations (no shell injection)
  - [x] Set `confidence: 'inferred'`, `source: 'git-recency'`
  - [x] Known limitation: checks current branch only (documented)
  - [x] Export rule function

- [x] Task 5: Implement `conflict-resolver.js` (AC: #5)
  - [x] Final rule in the chain — resolves conflicts between signals
  - [x] Resolution logic: explicit confidence always wins over inferred
  - [x] For same confidence level: later phase overrides earlier (complete > build > planning > discovery > unknown)
  - [x] Ensure `lastArtifact` is set to the most recently modified artifact for the initiative
  - [x] Ensure `nextAction` is derived from chain gap analysis (missing HC steps, no architecture after PRD, etc.)
  - [x] Export rule function

- [x] Task 6: Create test fixtures for portfolio inference (AC: #11)
  - [x] Add portfolio-specific fixtures to `tests/fixtures/artifact-samples/` or create `tests/fixtures/portfolio-samples/`
  - [x] Fixtures needed:
    - Initiative with explicit frontmatter status
    - Initiative with complete HC chain (HC2-HC6)
    - Initiative with partial HC chain (gap detection)
    - Initiative with epic marked done
    - Initiative with only PRD (planning phase)
    - Initiative with no artifacts (unknown)
    - Initiative with stale artifacts (>30 days old)

- [x] Task 7: Write unit tests for all 4 rules (AC: #10)
  - [x] Create `tests/lib/portfolio-rules.test.js`
  - [x] Test `frontmatter-rule`:
    - Explicit status in frontmatter -> overrides all
    - No frontmatter status -> state unchanged
    - Multiple artifacts with different frontmatter -> most recent wins
  - [x] Test `artifact-chain-rule`:
    - Epic with done stories -> phase: complete
    - Architecture + epic -> phase: build or planning
    - HC artifacts -> phase: discovery
    - PRD only -> phase: planning
    - No artifacts -> phase: unknown
    - Vortex HC chain completeness detection
    - Multiple epics -> latest used
    - Flexible status markers (done, complete, ✅, [x], strikethrough)
  - [x] Test `git-recency-rule`:
    - Recent activity -> status: ongoing
    - Old activity (>30 days) -> status: stale
    - Custom stale_days threshold
  - [x] Test `conflict-resolver`:
    - Explicit wins over inferred
    - Later phase overrides earlier at same confidence
    - nextAction derived from chain gap
  - [x] 100% coverage on all 4 rule files (NFR18)

- [x] Task 8: Run convoke-check and regression suite
  - [x] Run `node scripts/convoke-check.js --skip-coverage` -- all steps pass
  - [x] Run `node scripts/migrate-artifacts.js` -- dry-run still works
  - [x] Run `node scripts/archive.js --rename` -- regression check

## Dev Notes

### Previous Story (ag-3-4) Intelligence

- Epic 3 is complete. The migration pipeline produces governed artifacts with frontmatter: `initiative`, `artifact_type`, `created`, `schema_version`.
- `parseFrontmatter(content)` in artifact-utils.js parses gray-matter frontmatter. Returns `{ data, content }`.
- `readTaxonomy(projectRoot)` returns `{ initiatives: { platform, user }, artifact_types, aliases }`.
- `scanArtifactDirs(projectRoot, includeDirs, excludeDirs)` returns `[{ filename, dir, fullPath }]`.
- `inferArtifactType(filename, taxonomy)` returns `{ type, hcPrefix, remainder, date }` — useful for HC chain detection.
- `inferInitiative(remainder, taxonomy)` returns `{ initiative, confidence, source, candidates }`.
- `InitiativeState` and `InferenceSignal` typedefs already exist in `scripts/lib/types.js`.
- 223 tests pass across 6 test files.

### Architecture Compliance

**Rule chain pattern (ADR-3)**: Ordered list of rules, each enriching an `InitiativeState` object. Each rule is an independent module in `scripts/lib/portfolio/rules/`. New heuristics = new rule file appended to chain.

**Execution order**: frontmatter-rule -> artifact-chain-rule -> git-recency-rule -> conflict-resolver

**Rule function contract**:
```javascript
/**
 * @param {InitiativeState} state - Current state (may be partially populated by prior rules)
 * @param {Array<{filename, dir, fullPath, content?}>} artifacts - All artifacts for this initiative
 * @param {Object} options - Configuration (staleDays, projectRoot, etc.)
 * @returns {InitiativeState} Enriched state
 */
function applyRule(state, artifacts, options) { ... }
```

**Portfolio is READ-ONLY**: No git writes, no file modifications. Only git log reads for recency. Uses `execFileSync` for git operations (safe).

**NFR10 (modular inference)**: Each rule is independently testable. Adding rule 5 means adding a file, not modifying existing rules.

**NFR18 (100% coverage)**: Every rule function must have 100% branch/line coverage. This is the quality bar for inference code.

### Portfolio-Wide Scanning

Portfolio needs ALL initiatives across ALL directories, not just the 3 migration defaults. Unlike migration which uses hardcoded `['planning-artifacts', 'vortex-artifacts', 'gyre-artifacts']`, portfolio should dynamically discover all subdirectories of `_bmad-output/` (via `fs.readdirSync`) and pass them to `scanArtifactDirs`, excluding `_archive` and dot-prefixed dirs. This ensures new artifact directories (e.g., `gyre-artifacts/`, custom user dirs) are automatically included.

This scanning logic belongs in the portfolio engine (story 4.2), not in the rules themselves. Rules receive pre-scanned artifact arrays — they don't scan the filesystem.

### Frontmatter `phase` Field

The standard FrontmatterSchema (v1) does NOT include a `phase` field. Only `status` is in the schema (draft/validated/superseded/active). However, operators may manually add `phase` to frontmatter as an override. The `frontmatter-rule` reads it IF present but does NOT require it. No schema extension needed.

### Phase Priority Order

```
complete > build > planning > discovery > unknown
```

- `complete`: all stories in epic done
- `build`: epic + sprint artifact present (active development)
- `planning`: architecture or PRD present (design phase)
- `discovery`: HC artifacts present (Vortex discovery)
- `unknown`: no recognized artifact pattern

### HC Chain for Vortex Discovery (FR34)

The Vortex discovery process follows: HC2 (Problem Definition) -> HC3 (Hypothesis) -> HC4 (Experiment) -> HC5 (Signal) -> HC6 (Decision). Chain completeness = all 5 present for an initiative. Gaps suggest next action.

HC detection: use `inferArtifactType(filename, taxonomy)` which returns `hcPrefix` (e.g., 'hc2', 'hc3').

### Anti-Patterns to AVOID

- Do NOT modify `artifact-utils.js` — portfolio rules are in `scripts/lib/portfolio/rules/`, consuming the shared lib read-only
- Do NOT use `execSync` — always `execFileSync` for git log operations
- Do NOT write files or modify git state — portfolio is strictly read-only
- Do NOT hardcode initiative IDs — always read from taxonomy
- Do NOT import rules into each other — they are independent; only the engine (story 4.2) chains them
- Do NOT implement the portfolio engine or formatters — that's story 4.2

### File Structure

```
scripts/
└── lib/
    ├── artifact-utils.js        # EXISTING — consumed read-only
    ├── types.js                 # EXISTING — InitiativeState, InferenceSignal already defined
    └── portfolio/               # NEW directory
        └── rules/               # NEW directory
            ├── frontmatter-rule.js    # NEW
            ├── artifact-chain-rule.js # NEW
            ├── git-recency-rule.js    # NEW
            └── conflict-resolver.js   # NEW

tests/
├── fixtures/
│   └── portfolio-samples/       # NEW (or extend artifact-samples/)
└── lib/
    └── portfolio-rules.test.js  # NEW
```

### Testing Standards

- Jest test framework
- File: `tests/lib/portfolio-rules.test.js`
- Each rule tested independently with controlled inputs
- Mock `execFileSync` for git-recency-rule (same pattern as ensureCleanTree tests)
- Use fixture files for frontmatter parsing
- 100% coverage on all 4 rule files (NFR18)
- Run `convoke-check --skip-coverage` after all tests
- 223 existing + new must all pass

### References

- [Source: arch-artifact-governance-portfolio.md -- ADR-3: Rule chain pattern, Portfolio code structure]
- [Source: prd-artifact-governance-portfolio.md -- FR22-FR34, FR37, FR48; NFR1, NFR6, NFR10, NFR17-18]
- [Source: scripts/lib/types.js -- InitiativeState, InferenceSignal typedefs]
- [Source: scripts/lib/artifact-utils.js -- parseFrontmatter, readTaxonomy, scanArtifactDirs, inferArtifactType]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (1M context)

### Debug Log References

- 272/272 tests pass (223 existing + 49 new portfolio rules tests)
- convoke-check: all 5 steps pass (lint clean on first try)
- Zero test failures during development

### Completion Notes List

- Created `scripts/lib/portfolio/rules/` directory structure
- Implemented `frontmatter-rule.js` — reads explicit `status` (standard schema) and `phase` (operator override) from frontmatter. Highest priority; later rules don't override explicit signals. 6 tests.
- Implemented `artifact-chain-rule.js` — infers phase from artifact patterns: epic done markers (done/complete/✅/[x]/strikethrough) -> complete, epic+sprint -> build, arch -> planning, HC artifacts -> discovery, PRD/brief -> planning, none -> unknown. Detects Vortex HC chain completeness (HC2-HC6). Tracks lastArtifact by date. Multiple epics use most recent. 14 tests + isEpicDone (8 cases) + detectHCChain (3 tests).
- Implemented `git-recency-rule.js` — infers status via `git log -1 --format=%as` on most recent artifact. Ongoing if within staleDays (default 30), stale if beyond. Configurable threshold. Doesn't override explicit. Uses execFileSync (safe). 6 tests.
- Implemented `conflict-resolver.js` — ensures phase/status have values (defaults to unknown), derives nextAction from phase, populates lastArtifact fallback. Exports `comparePhasePriority` and `deriveNextAction`. 8 tests + deriveNextAction (5 cases) + comparePhasePriority (2 tests).
- All rules are independent modules consuming `InitiativeState`, producing enriched `InitiativeState`. No cross-rule imports.

### File List

- `scripts/lib/portfolio/rules/frontmatter-rule.js` — NEW
- `scripts/lib/portfolio/rules/artifact-chain-rule.js` — NEW
- `scripts/lib/portfolio/rules/git-recency-rule.js` — NEW
- `scripts/lib/portfolio/rules/conflict-resolver.js` — NEW
- `tests/lib/portfolio-rules.test.js` — NEW (49 tests)
