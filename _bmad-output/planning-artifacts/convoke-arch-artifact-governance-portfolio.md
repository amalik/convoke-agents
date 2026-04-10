---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
status: 'complete'
completedAt: '2026-04-05'
inputDocuments:
  - _bmad-output/planning-artifacts/prd-artifact-governance-portfolio.md
  - _bmad-output/planning-artifacts/adr-repo-organization-conventions-2026-03-22.md
  - docs/lifecycle-expansion-vision.md
  - _bmad-output/planning-artifacts/report-implementation-readiness-artifact-governance-2026-04-05.md
  - scripts/archive.js
workflowType: 'architecture'
project_name: 'Artifact Governance & Portfolio'
user_name: 'Amalik'
date: '2026-04-05'
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## Project Context Analysis

### Requirements Overview

**Functional Requirements: 50 FRs across 8 capability areas**

Architecturally, these decompose into two distinct systems with a shared data layer:

1. **Migration Script (FR7-FR21, FR46-FR50)** — 20 FRs. A batch CLI tool that transforms the existing artifact corpus. Architecturally, this is a **pipeline**: scan → infer → plan → review → execute → verify. The critical path is the inference engine (FR9-FR10) which must map ~3 predictable filename patterns (after excluding implementation-artifacts) to initiative+type pairs. The second critical path is link updating (FR15) — a cross-file transformation pass.

2. **Portfolio Skill (FR22-FR38, FR48)** — 18 FRs. A read-only query tool that scans artifacts and produces a portfolio view. Architecturally, this is a **reader with heuristic inference**: scan → parse → infer → format → output. The critical path is the inference engine (FR28-FR34) which must derive phase and status from heterogeneous signals (frontmatter, artifact chains, git history).

3. **Shared Data Layer (FR1-FR6, FR39-FR45, FR49)** — 12 FRs. Taxonomy config, frontmatter schema, update pipeline integration, doctor validation, workflow adoption. This is the **contract layer** that both tools consume and that future workflows must honor.

**Non-Functional Requirements: 22 NFRs — architecturally significant:**
- **NFR5** (rollback via `git reset --hard`) — migration pipeline must be transactional with rollback points
- **NFR7** (dry-run 100% accurate) — planning phase must produce an exact execution plan
- **NFR10** (modular inference) — portfolio inference must use a pluggable pattern
- **NFR17-18** (100% inference coverage) — inference rules must be individually testable units
- **NFR20** (byte-for-byte preservation) — frontmatter injection must use a precise parser

### Scale & Complexity

- **Primary domain:** Node.js CLI tooling + BMAD skill (markdown-based conversational)
- **Complexity level:** Medium-High (concentrated in inference engines)
- **Estimated architectural components:** 8-10 modules
- **Data volume:** ~60 files MVP, ~200 files at scale
- **Concurrency:** Single operator, sequential operations. No concurrency concerns.

### Technical Constraints & Dependencies

| Constraint | Source | Impact |
|-----------|--------|--------|
| Node.js ≥18.x | NFR12, existing platform | Runtime target |
| `findProjectRoot()` from `scripts/update/lib/utils.js` | Existing pattern | Must reuse, not reinvent |
| `archive.js` shares filename parsing logic | Existing code | Extract shared lib |
| `git mv` for renames | FR12, Domain Requirements | Git must be available |
| YAML parsing (js-yaml) | NFR16, existing deps | Already in project dependencies |
| Two-commit atomic sequence | Domain Requirements (hard constraint) | Migration pipeline must be transactional |
| `_bmad/` paths untouched | Domain Requirements | Migration scope is `_bmad-output/` only |
| `config-merger.js` pattern for taxonomy updates | FR41, existing pattern | Reuse merge strategy |

### Cross-Cutting Concerns

1. **Inference logic** — shared concern between migration (initiative/type inference from filenames) and portfolio (phase/status inference from artifacts). Different inference problems but same architectural pattern: rules → confidence → output.
2. **Taxonomy reading** — both tools read `taxonomy.yaml`. Shared parser needed.
3. **Git operations** — migration writes (`git mv`, `git commit`), portfolio reads (`git log`). Shared git utility.
4. **Frontmatter handling** — migration writes frontmatter, portfolio reads it. Shared YAML frontmatter parser/writer.
5. **Error handling** — NFR22 requires graceful error messages for malformed config. Shared error formatting.
6. **Clean-tree safeguard** — migration requires clean working tree before executing. Also beneficial for archive.js.

### Shared Library Architecture

`archive.js` already contains reusable logic: `parseFilename()`, `VALID_CATEGORIES`, `NAMING_PATTERN`, `SCAN_DIRS`. Extraction to shared lib brings untested archive.js logic under test coverage for the first time — a net improvement to platform quality.

**Architectural decision (ADR-1):** Extract into `scripts/lib/artifact-utils.js`:
- `parseFilename(filename, taxonomy)` — extended to accept taxonomy for initiative inference
- `scanArtifactDirs(projectRoot, includeDirs)` — configurable directory scanner
- `readTaxonomy(projectRoot)` — taxonomy.yaml loader with validation
- `parseFrontmatter(content)` / `injectFrontmatter(content, fields)` — frontmatter read/write
- `ensureCleanTree(scopeDirs)` — checks tracked diffs AND untracked files within scope directories

Both `archive.js` (refactored) and `migrate-artifacts.js` consume this shared lib. Portfolio skill consumes the read-only subset. Archive.js gains clean-tree check as a "while we're here" improvement.

### Migration Pipeline Architecture (ADR-2)

**Decision: Full transactional pipeline with rollback.**

Pipeline phases: scan → infer → plan (dry-run) → review → execute → verify

- **Clean-tree safeguard:** Before execution, verify no uncommitted changes (`git diff --quiet && git diff --cached --quiet`) AND no untracked files within scope directories. Abort with clear message if dirty.
- **Commit 1 (renames):** All `git mv` operations. If any fails, `git reset --hard HEAD` to undo all renames. Nothing is committed in partial state.
- **Commit 2 (frontmatter injection):** All frontmatter injections. If any fails, `git reset --hard` back to commit 1 state (renames preserved, failed injections discarded).
- **Idempotent recovery (FR46):** Each commit phase is independently resumable. Re-run detects: "renames done, frontmatter pending" → skips to commit 2.

### Portfolio Inference Architecture (ADR-3)

**Decision: Rule chain pattern.**

Ordered list of rules, each enriching an initiative data object:

```javascript
// Inference contract — data structure flowing through rule chain
{
  initiative: 'helm',
  phase: { value: 'discovery', source: 'artifact-chain', confidence: 'inferred' },
  status: { value: 'ongoing', source: 'git-recency', confidence: 'inferred' },
  lastArtifact: { file: 'helm-hypothesis-hc3-2026-04-05.md', date: '2026-04-05' },
  nextAction: { value: 'HC4 experiment design', source: 'chain-gap' }
}
```

**Rule chain execution order:**
1. Read frontmatter (explicit status — highest priority)
2. Analyze artifact chain (inferred phase — Vortex HC sequence, epic presence)
3. Check git log (recency, stale detection)
4. Resolve conflicts (explicit wins over inferred)

Each rule is an independent module. New heuristics = new rule file appended to chain. NFR10 (modular inference) satisfied.

**Verbose output mode:** `--verbose` flag exposes the inference trace — showing source and confidence for each field. Default output is clean and compact. Verbose is for debugging and trust-building.

### Test Architecture Notes

- Integration tests for migration transactional rollback require **real git repos** as test fixtures — cannot be mocked
- Shared lib extraction brings `archive.js` filename parsing under test coverage for the first time
- Each inference rule in the portfolio chain is independently unit-testable
- Test fixtures must represent all known filename patterns in the current repository (NFR19)

## Starter Template Evaluation

### Primary Technology Domain

**Node.js CLI tooling + BMAD skill extension** — extending the existing Convoke platform, not creating a new project.

### No Starter Template Required

This is a brownfield extension. The "starter" is the existing codebase, which establishes all conventions.

### Architectural Decisions Inherited from Platform

| Decision | Source | Implication |
|----------|--------|-------------|
| CommonJS, not ESM | Existing `scripts/` | All new modules use `require()`. Consistency over modernization — mixed module formats create cognitive tax. |
| Plain JS with JSDoc | Existing convention | No TypeScript build step. **JSDoc type annotations mandated** on inference contract, rule chain interfaces, and all shared lib function signatures. |
| Jest for testing | Existing `tests/` | Test files follow `*.test.js` pattern |
| `fs-extra` for file ops | `archive.js`, update system | Superset of native `fs`. Already a dependency. |
| `findProjectRoot()` | `scripts/update/lib/utils.js` | All tools use this, never `process.cwd()` directly |
| Dry-run default | `archive.js`, `convoke-update` | Migration follows same UX pattern |

### New Dependency: `gray-matter`

**Decision:** Add `gray-matter` as the sole new dependency for frontmatter parsing.

**Rationale:** NFR20 requires byte-for-byte preservation of content below frontmatter. `gray-matter` handles all identified edge cases: existing frontmatter merge, `---` horizontal rules, empty frontmatter. Rolling our own parser risks NFR20 violations.

**Maintenance status:** ~25M weekly npm downloads. Used by Gatsby, Next.js, Astro. Stable — frontmatter parsing is a solved problem. API hasn't changed because it doesn't need to.

**Implementation pattern:**
```javascript
const matter = require('gray-matter');
function injectFrontmatter(fileContent, newFields) {
  const parsed = matter(fileContent);
  const merged = { ...newFields, ...parsed.data }; // new fields, never overwrite existing
  return matter.stringify(parsed.content, merged);
}
```

### Shared Library File Structure

```
scripts/
├── lib/
│   ├── artifact-utils.js    # Functions: parseFilename, scanArtifactDirs, readTaxonomy,
│   │                        #   parseFrontmatter, injectFrontmatter, ensureCleanTree
│   └── types.js             # JSDoc typedefs: InitiativeState, RenameManifestEntry,
│                            #   LinkUpdate, TaxonomyConfig, FrontmatterSchema
├── archive.js               # Refactored to consume artifact-utils.js
├── migrate-artifacts.js     # New: migration pipeline
└── update/
    └── lib/
        └── utils.js         # Existing: findProjectRoot(), getPackageVersion(), etc.
```

`artifact-utils.js` = functions. `types.js` = shapes. Both consumed by migration, portfolio, and refactored archive.js.

**Note:** No project initialization story needed. First story is shared lib extraction from `archive.js`.

## Core Architectural Decisions

### Decision Priority Analysis

**Critical Decisions (Block Implementation):**
1. Migration inference rule set — filename pattern → initiative+type mapping
2. Portfolio phase detection logic — artifact presence → phase inference
3. Two-commit transaction implementation — git command sequence + rollback

**Important Decisions (Shape Architecture):**
4. Frontmatter schema v1 — exact fields, types, validation
5. CLI argument parsing — process.argv (no library)
6. Portfolio output formatting — template strings (no library)

**Deferred Decisions (Post-MVP):**
- Grouped portfolio output (Growth — Clara's persona)
- YAML output format (Growth — no consumer)
- Confidence scoring on inference (Growth)
- `--all-branches` flag for portfolio git log scanning (Growth)

### Decision 1: Migration Inference Rule Set

The migration maps existing filenames to `{initiative}-{artifact-type}` pairs across MVP-scope directories.

**Planning artifacts (~40 files) — patterns:**

| Current Pattern | Example | Initiative Inference | Type Inference |
|----------------|---------|---------------------|----------------|
| `{type}-{initiative}.md` | `prd-gyre.md` | From suffix | From prefix |
| `{type}-{initiative}-{qualifier}.md` | `epic-forge-phase-a.md` | From second segment | From prefix |
| `{type}-{descriptor}-{date}.md` | `brief-gyre-2026-03-19.md` | From second segment | From prefix |
| `{type}.md` (no initiative) | `prd.md`, `architecture.md` | **Ambiguous** — surface for manual resolution | From filename |
| `{type}-{descriptor}.md` (no initiative) | `spec-baseartifact-contract.md` | **Ambiguous** — infer from content or surface | From prefix |

**Vortex artifacts (~20 files) — patterns:**

| Current Pattern | Example | Initiative Inference | Type Inference |
|----------------|---------|---------------------|----------------|
| `{hc-id}-{type}-{initiative}-{date}.md` | `hc2-problem-definition-gyre-2026-03-21.md` | From segment after type | HC prefix → type |
| `{type}-{initiative}-{date}.md` | `lean-persona-strategic-navigator-2026-04-04.md` | From qualifier context | lean-persona → type |
| `{type}-{initiative}-{date}.md` | `scope-decision-strategy-perimeter-2026-04-04.md` | `strategy-perimeter` → `helm` via alias | From prefix |

**Inference algorithm — three-step lookup:**
1. **Exact match** against taxonomy initiative IDs
2. **Alias match** against `aliases` map in taxonomy.yaml
3. **Ambiguous** — surface in dry-run manifest with context clues

**Greedy type matching:** Match longest artifact type first with **dash boundary**. Rule: `filename.startsWith(type + '-')` or `filename === type + '.md'`. Prevents partial matches (e.g., `persona` doesn't match `lean-persona-*`). Sort artifact types by length descending before matching.

**Alias map in taxonomy.yaml (migration-only concern):**
```yaml
aliases:
  strategy-perimeter: helm
  strategy: helm
  team-factory: loom
```
Portfolio skill does not consume aliases — post-migration, all files use canonical IDs.

**Ambiguity handling:** Files with `confidence: 'low'` are surfaced in dry-run manifest with context clues:
- Always shown: first 3 lines of content, git log last author + date
- On `--verbose`: list of files that reference this file (cross-reference scan)

**Target collision detection:** Planning phase checks for filename collisions *before* execution. If new name already exists, flag in dry-run manifest for operator resolution.

### Decision 2: Portfolio Phase Detection Logic

Phase inferred from artifact presence. **Rule: later phases override earlier phases.**

| Priority | Artifacts Present | Inferred Phase |
|----------|------------------|----------------|
| 1 (highest) | Explicit `phase` in frontmatter | **Overrides all inference** |
| 2 | Epic file with stories marked done | `complete` |
| 3 | Epic file exists, sprint plan exists | `build` |
| 4 | Architecture doc exists, no epic | `planning` |
| 5 | Vortex HC artifacts (any) | `discovery` |
| 6 | Only a PRD or brief | `planning` |
| 7 (lowest) | Artifacts exist but don't match rules 1-6 | `unknown` |

**Flexible epic status markers:** Parse `done`, `complete`, `✅`, `[x]`, and strikethrough as completion indicators. Multiple epic files for same initiative → use latest modified.

**Status inference (rule chain from ADR-3):**

| Priority | Signal | Inferred Status |
|----------|--------|----------------|
| 1 (highest) | Frontmatter `status: blocked` on any artifact | `blocked (explicit)` |
| 2 | Git activity within stale_days threshold | `ongoing (inferred)` |
| 3 | No git activity beyond stale_days | `stale (inferred)` |
| 4 | All expected artifacts present + validated | `complete (inferred)` |
| 5 (lowest) | Cannot determine | `unknown (inferred)` |

**Known limitation (MVP):** Stale detection checks current branch only. Work on feature branches won't be detected. Growth: `--all-branches` flag.

### Decision 3: Two-Commit Transaction Implementation

```
Phase 0: Pre-flight
  - ensureCleanTree(scopeDirs)    // tracked diffs + untracked in scope
  - readTaxonomy(projectRoot)     // load IDs + aliases
  - scanArtifactDirs(projectRoot, includeDirs)

Phase 1: Plan (dry-run)
  - For each file: inferInitiative() + inferArtifactType()
    (greedy type match, three-step initiative lookup)
  - For each file: generateNewFilename()
  - Collision detection: check no target filename already exists
  - For all .md files in scope: scanMarkdownLinks() → map old→new
  - Output: RenameManifest[] + LinkUpdate[]
  - Surface ambiguous files with context clues
  - HALT for operator review (or proceed if --force)

Phase 2: Rename (commit 1)
  - For each RenameManifest entry: git mv old new
  - If any git mv fails: git reset --hard HEAD → abort
  - git commit -m "chore: rename artifacts to governance convention"

Phase 3: Inject frontmatter + update links (commit 2)
  - For each renamed file: injectFrontmatter(content, fields)
    (gray-matter: add fields, never overwrite. Skip metadata-only files safely.)
  - For each LinkUpdate: apply link replacements
  - Generate artifact-rename-map.md
  - If any write fails: git reset --hard HEAD~0 → abort (back to commit 1)
  - git commit -m "chore: inject frontmatter metadata and update links"

Phase 4: Verify
  - Sample 5 files: git log --follow → verify history chain
  - Report: "Migration complete. X files renamed, Y frontmatter injected, Z links updated."
```

### Decision 4: Frontmatter Schema v1

```yaml
---
initiative: helm          # Required. From taxonomy.yaml (platform or user)
artifact_type: hypothesis # Required. From taxonomy.yaml artifact_types list
status: validated         # Optional. Enum: draft|validated|superseded|active
created: 2026-04-05      # Required. ISO 8601 date
schema_version: 1         # Required. Integer ≥ 1, enables future evolution
---
```

**Validation rules:**
- `initiative` must exist in taxonomy (platform or user section)
- `artifact_type` must exist in taxonomy artifact_types list
- `status` if present must be one of: `draft`, `validated`, `superseded`, `active`
- `created` must be valid ISO 8601 date
- `schema_version` must be integer ≥ 1
- Existing frontmatter fields preserved — migration adds, never overwrites (NFR20)
- Field conflicts surfaced in dry-run manifest for manual resolution

### Decision 5: CLI Argument Parsing

**Decision: `process.argv` directly — no library.**

Migration has ~5 flags (`--dry-run`, `--apply`, `--force`, `--include`, `--help`). Portfolio has ~4 flags (`--markdown`, `--terminal`, `--sort`, `--filter`, `--verbose`). Within manual parsing range. Follows existing pattern (`archive.js`, `convoke-update`).

### Decision 6: Portfolio Output Formatting

**Terminal format:**
```
┌──────────┬───────────┬──────────────────┬──────────────────────────────────┐
│ helm     │ Discovery │ Ongoing (inf.)   │ Last: hypothesis-hc3 (Apr 5)    │
│ forge    │ Planning  │ Blocked (exp.)   │ Blocked: Gate 1                 │
│ gyre     │ Complete  │ Complete (exp.)  │ Last: validation-report (Mar 23) │
└──────────┴───────────┴──────────────────┴──────────────────────────────────┘
WIP: 5 active (threshold: 4) — sorted by last activity
Governance: 47/60 governed (78%)
```

**Markdown format:** Same data as markdown table. No box drawing characters.

**Verbose mode (`--verbose`):** Includes inference trace for each initiative — source and confidence for every field. For debugging and trust-building.

**No library** for table formatting — template strings with `padEnd()`. 4 fixed columns.

### Decision Impact Analysis

**Implementation Sequence:**
1. Shared lib extraction (artifact-utils.js, types.js) + gray-matter + archive.js refactor
2. Migration inference rules (testable units, greedy matching, alias map)
3. Migration pipeline (scan → plan → execute → verify, transactional)
4. Taxonomy config + doctor validation
5. Portfolio inference rules (testable units, rule chain)
6. Portfolio skill (scan → infer → format → output)
7. Workflow adoption (PRD + epics workflows emit frontmatter)
8. Update pipeline integration (taxonomy creation for pre-I14)

**Cross-Component Dependencies:**
- Migration and portfolio share: artifact-utils.js, types.js, taxonomy reader
- Migration depends on: gray-matter, git (mv, commit, reset), alias map
- Portfolio depends on: git (log for recency), gray-matter (frontmatter reading), rule chain
- Both depend on: taxonomy.yaml existing
- Migration produces artifacts that portfolio consumes (I14 → P15 dependency)

## Implementation Patterns & Consistency Rules

### Critical Conflict Points Identified

7 areas where AI agents could make inconsistent choices, all addressed below.

### Naming Patterns

**Function naming:**
- `camelCase` for all functions and variables — follows existing codebase (`findProjectRoot`, `parseFilename`, `getPackageVersion`)
- Module exports: named exports via `module.exports = { functionName }`, not default exports

**File naming:**
- Scripts: `kebab-case.js` — follows existing (`archive.js`, `migrate-artifacts.js`)
- Test files: `kebab-case.test.js` in `tests/` directory mirroring source structure
- Config files: `kebab-case.yaml` or `kebab-case.json`

**Git commit messages:**
- Migration commits: `chore: {description}` prefix
- Story implementation: follow existing project conventions

### Structure Patterns

**Corrected module organization (post-Code Review Gauntlet):**

BMAD skills are markdown-based conversational tools — they cannot `require()` JS. The portfolio engine is JavaScript that scans files and runs git commands. These are different runtime contexts. The skill invokes the engine via CLI.

```
scripts/
├── lib/
│   ├── artifact-utils.js        # Shared: parseFilename, scanArtifactDirs, readTaxonomy,
│   │                            #   injectFrontmatter, ensureCleanTree
│   ├── types.js                 # JSDoc typedefs: InitiativeState, RenameManifestEntry,
│   │                            #   LinkUpdate, TaxonomyConfig, FrontmatterSchema
│   └── portfolio/
│       ├── portfolio-engine.js  # Core: scan → infer → format → output
│       ├── rules/
│       │   ├── frontmatter-rule.js    # Rule 1: explicit status (highest priority)
│       │   ├── artifact-chain-rule.js # Rule 2: phase from chain analysis
│       │   ├── git-recency-rule.js    # Rule 3: stale detection
│       │   └── conflict-resolver.js   # Rule 4: priority resolution
│       └── formatters/
│           ├── terminal-formatter.js  # Box-drawing table + colors
│           └── markdown-formatter.js  # Markdown table
├── migrate-artifacts.js         # Migration pipeline entry point
├── archive.js                   # Existing (refactored to use lib/)
└── update/
    └── lib/
        └── utils.js             # Existing: findProjectRoot(), getPackageVersion()

.claude/skills/
└── bmad-portfolio-status/
    └── workflow.md              # Thin wrapper — invokes: convoke-portfolio --markdown

bin/
├── convoke-migrate-artifacts    # #!/usr/bin/env node → require('../scripts/migrate-artifacts.js')
└── convoke-portfolio            # #!/usr/bin/env node → require('../scripts/lib/portfolio/portfolio-engine.js')

tests/
├── lib/
│   ├── artifact-utils.test.js
│   ├── portfolio/
│   │   ├── portfolio-engine.test.js
│   │   ├── rules/
│   │   │   ├── frontmatter-rule.test.js
│   │   │   ├── artifact-chain-rule.test.js
│   │   │   ├── git-recency-rule.test.js
│   │   │   └── conflict-resolver.test.js
│   │   └── formatters/
│   │       └── terminal-formatter.test.js
│   └── types.test.js
├── migrate-artifacts.test.js
├── migrate-artifacts.integration.test.js  # Real git repo tests
└── fixtures/
    └── artifact-samples/        # All known filename patterns (NFR19)
```

**Rule: One concern per file.** Each inference rule is its own file. Each formatter is its own file. Enables NFR17-18 (100% inference coverage) by making each rule independently testable. Justification: Growth extensibility — adding rule 5 or 6 means adding a file, not modifying existing rules (NFR10).

**Estimated new files: ~12-14** (excluding tests).

### Format Patterns

**CLI output conventions:**
- Progress messages: `console.log` — no prefix for normal output
- Warnings: `console.warn` with `⚠️` prefix
- Errors: `console.error` with `❌` prefix
- Success: `✅` prefix
- Dry-run items: indented with `  ` (2 spaces)

**Dry-run manifest format:**
```
old-filename.md → new-filename.md
  Initiative: helm (confidence: high, source: filename suffix)
  Type: prd (confidence: high, source: prefix match)
```

**Ambiguous entries:**
```
⚠️ prd.md → ??? (ambiguous — cannot infer initiative)
  First line: "# Product Requirements Document - Convoke"
  Git author: Amalik (2026-02-22)
  Referenced by: epic-phase3.md, architecture.md  [--verbose only]
  Candidates: convoke, gyre
  ACTION REQUIRED: Specify initiative for this file
```

**Conflict entries (invalid-governed):**
```
⚠️ helm-prd.md → CONFLICT (filename says helm, frontmatter says gyre)
  ACTION REQUIRED: Resolve initiative conflict before migration
```

### Error Handling Patterns

**Structured error for migration rollback (NFR5):**
```javascript
class MigrationError extends Error {
  constructor(message, { file, phase, recoverable }) {
    super(message);
    this.name = 'MigrationError';
    this.file = file;       // which file caused the error
    this.phase = phase;     // 'rename' or 'inject' — drives rollback target
    this.recoverable = recoverable; // can re-run fix this?
  }
}
```

Structured error is not over-engineering — `phase` drives programmatic rollback decisions: phase 2 failure → `git reset --hard HEAD`, phase 3 failure → `git reset --hard HEAD~1`.

**Error handling rules:**
- File-level errors: skip file with warning, continue processing (NFR4)
- Phase-level errors: rollback phase, abort (NFR5)
- Config errors: abort immediately with actionable message (NFR22)
- Never swallow errors silently — always log or surface

### Process Patterns

**Four governance states (idempotency check):**
```javascript
function getGovernanceState(filename, content) {
  const nameMatch = GOVERNANCE_PATTERN.test(filename);
  const fm = matter(content);
  const hasFrontmatter = fm.data && fm.data.initiative;
  
  if (nameMatch && hasFrontmatter) {
    // Check for conflict: does filename initiative match frontmatter initiative?
    const fileInitiative = extractInitiativeFromFilename(filename);
    if (fileInitiative !== fm.data.initiative) return 'invalid-governed'; // conflict
    return 'fully-governed';  // skip
  }
  if (nameMatch && !hasFrontmatter) return 'half-governed';  // inject frontmatter only
  return 'ungoverned';  // full migration
}
```

`invalid-governed` is a pre-flight check — surfaced in dry-run manifest as "conflict" for operator resolution before execution.

**Git operation pattern:**
```javascript
function gitMv(oldPath, newPath) {
  return execSync(`git mv "${oldPath}" "${newPath}"`, { encoding: 'utf8', stdio: 'pipe' });
}

function gitReset(target) {
  execSync(`git reset --hard ${target}`, { encoding: 'utf8', stdio: 'pipe' });
}
```

All git commands via `child_process.execSync` with `stdio: 'pipe'` (capture output, don't print to terminal).

### Testing Patterns

**Unit test example:**
```javascript
describe('parseFilename', () => {
  test('greedy type match: lean-persona before persona', () => {
    const result = parseFilename('lean-persona-strategic-navigator-2026-04-04.md', taxonomy);
    expect(result.artifactType).toBe('lean-persona');
  });
  
  test('alias resolution: strategy-perimeter → helm', () => {
    const result = parseFilename('scope-decision-strategy-perimeter-2026-04-04.md', taxonomy);
    expect(result.initiative).toBe('helm');
  });

  test('invalid-governed: filename/frontmatter conflict', () => {
    const state = getGovernanceState('helm-prd.md', '---\ninitiative: gyre\n---\nContent');
    expect(state).toBe('invalid-governed');
  });
});
```

**Integration test mandate:**
```javascript
beforeEach(async () => {
  tmpDir = await createTempGitRepo(fixtures); // copy fixtures into real git repo
});
afterEach(async () => {
  await fs.remove(tmpDir);
});
```

Integration tests must create temp git repos — never test git operations in-place.

**Test fixtures:** `tests/fixtures/artifact-samples/` with representative files for every known filename pattern (NFR19).

### Enforcement Guidelines

**All AI agents MUST:**
1. Use `require()` from `scripts/lib/artifact-utils.js` for any filename parsing — never write custom regex
2. Use `gray-matter` for any frontmatter read/write — never parse `---` manually
3. Use `findProjectRoot()` — never use `process.cwd()` directly
4. Follow the error class hierarchy — `MigrationError` for migration, plain `Error` with clear message for portfolio
5. One inference rule = one file in `scripts/lib/portfolio/rules/`
6. Integration tests create temp git repos — never test in-place

**Anti-Patterns:**
- ❌ Hardcoding initiative IDs — always read from taxonomy.yaml
- ❌ Using `fs.renameSync` instead of `git mv` — breaks history
- ❌ Catching errors without logging — violates "never swallow silently"
- ❌ Using `process.argv` parsing inline — extract to a `parseArgs()` function at the top of each CLI entry point
- ❌ Putting JS engine code inside `.claude/skills/` — skills are markdown-only, engines live in `scripts/`

## Project Structure & Boundaries

### Component Boundary Map

4 bounded components. No component directly imports from another's internals — they communicate through shared lib only.

```
┌─────────────────────────────────────────────────────────┐
│                    SHARED LIB                            │
│  scripts/lib/artifact-utils.js  +  types.js             │
│  (consumed by all three components below)                │
├──────────────┬──────────────────┬────────────────────────┤
│  MIGRATION   │    PORTFOLIO     │   ARCHIVE (existing)   │
│  scripts/    │  scripts/lib/    │   scripts/             │
│  migrate-    │  portfolio/      │   archive.js           │
│  artifacts.js│  portfolio-      │   (refactored)         │
│              │  engine.js       │                        │
│  bin/convoke │  bin/convoke-    │   npm run archive      │
│  -migrate-   │  portfolio       │                        │
│  artifacts   │                  │                        │
│              │  .claude/skills/ │                        │
│              │  bmad-portfolio- │                        │
│              │  status/         │                        │
│              │  workflow.md     │                        │
└──────────────┴──────────────────┴────────────────────────┘
         │              │                    │
         └──────────────┴────────────────────┘
                        │
              ┌─────────┴──────────┐
              │   CONFIG LAYER     │
              │  _bmad/_config/    │
              │  taxonomy.yaml     │
              │                    │
              │  _bmad/bmm/        │
              │  config.yaml       │
              │  (portfolio section)│
              └────────────────────┘
```

### FR-to-File Mapping

| FR Range | Component | Primary File(s) |
|----------|-----------|-----------------|
| FR1-FR6 | Config Layer | `_bmad/_config/taxonomy.yaml` |
| FR7-FR20 | Migration | `scripts/migrate-artifacts.js` + `scripts/lib/artifact-utils.js` |
| FR21 | Migration | `scripts/migrate-artifacts.js` → generates `_bmad-output/planning-artifacts/adr-artifact-governance-convention-{date}.md` AND updates existing ADR status to `SUPERSEDED` |
| FR22-FR27 | Portfolio | `scripts/lib/portfolio/portfolio-engine.js` + `formatters/` |
| FR28-FR34 | Portfolio | `scripts/lib/portfolio/rules/` (4 rule files) |
| FR35-FR37 | Portfolio | `scripts/lib/portfolio/portfolio-engine.js` (WIP section) |
| FR38-FR39 | Portfolio | `scripts/lib/portfolio/portfolio-engine.js` (degraded mode + prereq check) |
| FR40-FR42 | Update Pipeline | `scripts/update/migrations/` (new migration file) |
| FR43 | Doctor | `scripts/convoke-doctor.js` (new validation check) |
| FR44-FR45 | Workflow Updates | `.claude/skills/bmad-create-prd/` + `.claude/skills/bmad-create-epics-and-stories/` |
| FR46-FR47 | Migration | `scripts/migrate-artifacts.js` (transaction + interactive flow) |
| FR48 | Portfolio | `scripts/lib/portfolio/portfolio-engine.js` (sort option) |
| FR49-FR50 | Migration | `scripts/migrate-artifacts.js` (taxonomy bootstrap + archive exclusion) |

**Validation: 50/50 FRs mapped. 22/22 NFRs have architectural support. 0 orphan files.**

### Config File Locations

| File | Purpose | Created By | Read By |
|------|---------|-----------|---------|
| `_bmad/_config/taxonomy.yaml` | Initiative IDs, artifact types, aliases | Migration script (FR49) or `convoke-update` (FR40) | Migration, portfolio, doctor |
| `_bmad/bmm/config.yaml` (portfolio section) | WIP threshold, stale days | Manual or `convoke-update` | Portfolio only |
| `artifact-rename-map.md` | Old→new filename mapping | Migration script (FR16) | Humans (reference) |

### Modification Boundaries

**Files CREATED (new):** ~14 files
- `scripts/lib/artifact-utils.js`, `scripts/lib/types.js`
- `scripts/lib/portfolio/portfolio-engine.js`
- `scripts/lib/portfolio/rules/` (4 rule files)
- `scripts/lib/portfolio/formatters/` (2 formatter files)
- `scripts/migrate-artifacts.js`
- `bin/convoke-migrate-artifacts`, `bin/convoke-portfolio`
- `.claude/skills/bmad-portfolio-status/workflow.md`
- `_bmad/_config/taxonomy.yaml`

**Files MODIFIED (existing):**
- `scripts/archive.js` — refactored to import from shared lib (ADR-1)
- `scripts/convoke-doctor.js` — add taxonomy validation check (FR43)
- `package.json` — add gray-matter dep + bin entries + npm scripts
- `_bmad/bmm/config.yaml` — add portfolio section (FR37)
- `.claude/skills/bmad-create-prd/` — add frontmatter emission (FR44)
- `.claude/skills/bmad-create-epics-and-stories/` — add frontmatter emission (FR45)
- `scripts/update/migrations/` — new migration for taxonomy bootstrap (FR40-42)
- `_bmad-output/planning-artifacts/adr-repo-organization-conventions-2026-03-22.md` — status → SUPERSEDED (FR21)

**Files NEVER touched:**
- `_bmad/` directory structure (BMAD Method compatibility)
- `_bmad-output/_archive/` (FR50)
- `scripts/update/lib/utils.js` (consumed, not modified)
- Any file outside `_bmad-output/` scope during migration

### Implementation Sequence → Story Mapping

| Step | Scope | Estimated Stories |
|------|-------|-------------------|
| 1 | Shared lib extraction + gray-matter + archive.js refactor | 1 story |
| 2 | Migration inference rules (greedy matching, aliases) | 1 story |
| 3 | Migration pipeline (scan → plan → execute → verify, transactional) | 1 story |
| 4 | Taxonomy config + doctor validation | 1 story |
| 5 | Portfolio inference rules (4 rule files) | 1 story |
| 6 | Portfolio engine + formatters + CLI wrapper | 1 story |
| 7 | Workflow adoption (PRD + epics emit frontmatter) | 1 story |
| 8 | Update pipeline integration (taxonomy bootstrap) | 1 story |

## Architecture Validation Results

### Coherence Validation ✅

**Decision Compatibility:** CommonJS + gray-matter + fs-extra + js-yaml — all compatible. Jest + CommonJS — native. process.argv + bin/ — standard Node.js CLI. Rule chain + gray-matter + git — sequential, no concurrency conflicts. No contradictions.

**Pattern Consistency:** camelCase functions, kebab-case files. Named exports everywhere. MigrationError for migration, plain Error for portfolio. --flag CLI pattern with --help and dry-run default. Consistent with existing platform tools.

**Structure Alignment:** Shared lib consumed by 3 components, no circular dependencies. Portfolio engine in scripts/ not .claude/skills/ — correct runtime boundary. Config in _bmad/ — follows platform conventions. Tests mirror source — discoverable.

### Requirements Coverage ✅

- **Functional Requirements:** 50/50 mapped to files (self-consistency validated)
- **Non-Functional Requirements:** 22/22 with architectural support
- **No orphan files** — every new file traces to at least one FR/NFR

### Implementation Readiness ✅

- 6 core decisions documented with rationale and trade-offs
- 3 ADRs with formal option analysis
- 8 failure mode findings integrated
- Code review gauntlet corrections applied (portfolio engine location, invalid-governed state)
- 7 reverse-engineering clarity fixes applied (output examples, pseudocode, UX, link patterns)

### Gap Analysis

**Critical Gaps:** None.
**Important Gaps:** None remaining.
**Deferred to Growth:** --all-branches, grouped output, YAML format, confidence scoring, --upgrade-schema.

### Architecture Completeness Checklist

- [x] Project context analyzed (50 FRs, 22 NFRs, 3 personas)
- [x] Scale assessed (Medium-High, ~60 MVP files, ~14 new code files)
- [x] 8 technical constraints identified
- [x] 6 cross-cutting concerns mapped
- [x] 3 ADRs: shared lib, transactional migration, rule chain
- [x] 6 core decisions with rationale
- [x] gray-matter: sole new dependency
- [x] Naming, structure, error handling, process, testing patterns defined
- [x] 7 conflict points addressed with enforcement guidelines + anti-patterns
- [x] Complete file tree with FR-to-file mapping (50/50)
- [x] Component boundaries: migration, portfolio, archive, shared lib
- [x] Implementation sequence → 8 stories

### Architecture Readiness Assessment

**Overall Status: READY FOR IMPLEMENTATION**

**Confidence Level: High** — validated through multiple A/P/C cycles at every step. Failure mode analysis, code review gauntlet, self-consistency validation, and reverse-engineering test all completed.

**Key Strengths:**
- Every FR traceable to a file. Every NFR has architectural support.
- Shared lib prevents code duplication across 3 consumers
- Transactional migration with rollback prevents data loss
- Rule chain enables Growth extensibility without modifying MVP code
- gray-matter handles byte-for-byte preservation without custom parser risk
- Inference pseudocode and exact link patterns eliminate implementation ambiguity

**Areas for Future Enhancement:**
- Multi-branch git scanning for stale detection
- Grouped/hierarchical portfolio output for scale
- Schema evolution tooling (--upgrade-schema)
- Confidence scoring on portfolio inference

### Implementation Handoff

**Target Personas (from PRD):**
- **Amalik (Solo Operator):** 5+ initiatives, needs cross-initiative coherence. Primary MVP persona.
- **Clara (Consultant):** Multiple clients, needs prefix filtering. Enabled by taxonomy extensibility.
- **Dario (Platform Builder):** Needs phase/status visibility for build readiness decisions.

**Status Enum Relationship:**
- **Artifact-level status** (frontmatter: draft/validated/superseded/active) = **input data** written by workflows
- **Initiative-level status** (portfolio: ongoing/blocked/paused/complete/stale/unknown) = **computed output** derived by portfolio skill

**AI Agent Guidelines:**
- Follow all architectural decisions exactly as documented
- Use implementation patterns consistently across all components
- Respect project structure and boundaries — shared lib is the integration point
- Refer to this document for all architectural questions
- Never put JS engine code inside .claude/skills/ — skills are markdown-only

**First Implementation Priority:**
Step 1: Shared lib extraction from `archive.js` → `scripts/lib/artifact-utils.js` + `scripts/lib/types.js` + `npm install gray-matter`
