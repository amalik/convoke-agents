# Story 2.1: Create BMM dependency scan tool and registry

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

**Epic:** [Epic 2 — Custom Skills Stay Safe](../planning-artifacts/convoke-epic-bmad-v6.3-adoption.md#epic-2-custom-skills-stay-safe)
**Sprint:** 2–3 (WS3/A8 governance stream; parallel with Epic 1B)
**FR coverage:** FR12 (registry maintenance), FR13 (scan tool as canonical source of truth), FR18 (recursive tooling ordering)
**Downstream consumers:** Story 2.2 (doctor integration), Story 2.3 (update gate), Story 2.4 (manual registration), Story 1A.6 (re-introduces custom-skill section in migration guide)
**Namespace decision:** `scripts/audit/` (second occupant after Story 1A.3's `audit-bmad-init-refs.js`). Not a `_bmad/bme/` skill — Covenant checklist does NOT apply. Pattern 1 (module structure) + Pattern 2 (CSV generation via `csv-utils.js`).

## Story

As a Convoke maintainer,
I want a committed scan tool that discovers which `.claude/skills/` depend on BMM agents and generates `_bmad/_config/bmm-dependencies.csv` automatically,
so that the governance registry is derived from filesystem truth (not hand-maintained prose), drift is caught in CI, and users can reliably register custom skills without manual coordination.

## Acceptance Criteria

**AC1 — Scan tool exists at `scripts/audit/audit-bmm-dependencies.js`.**
**Given** an empty `_bmad/_config/bmm-dependencies.csv` (or absent)
**When** `node scripts/audit/audit-bmm-dependencies.js` runs from repo root
**Then** generates `_bmad/_config/bmm-dependencies.csv` with the Decision-3 schema header.
**And** exits 0 on successful scan.
**And** follows Pattern 1 (module structure): has `@module` JSDoc, exports a public API, uses `findProjectRoot()` from `scripts/update/lib/utils.js` (never `process.cwd()` directly).

**AC2 — CSV schema matches Decision 3 exactly.**
**Given** the generated CSV
**When** first line is inspected
**Then** header is exactly: `skill_name,bmm_agent,dependency_type,source_module,registered_by,registered_date`
**And** every data row has exactly 6 fields, RFC 4180 quoted where the field value contains `,`, `"`, or newlines.
**And** `dependency_type` value is one of exactly two pinned values: `frontmatter` (declared in SKILL.md `dependencies:`) or `code-reference` (detected via step-file grep). These two values are the contract surface for downstream Stories 2.2/2.3 — any additional variant is a spec amendment.
**And** `source_module` is inferred via **prefix rule** on `skill_name`, with more-specific prefixes checked before less-specific ones: `bmad-agent-bme-*` → `bme`, `bmad-cis-*` → `cis`, `bmad-testarch-*` → `testarch`, `bmad-*` fallback → `bmm`, `convoke-*` → `convoke`, `wds-*` → `wds`, `q-*` or `qN-*` (hyphen-anchored) → `fpf`, any other prefix → `unknown`. Prefix rule is authoritative; manifest-based or frontmatter-based inference is explicitly out of scope for Story 2.1 (would require schema changes to SKILL.md or cross-referencing skill-manifest.csv — deferred).
**And** `registered_by` value is `auto-scan` for all scan-generated rows.
**And** `registered_date` is ISO-8601 date (YYYY-MM-DD) of the scan run.

**AC3 — Detection heuristic is restricted per FM3-1 (no doc-body false positives).**
**Given** a skill `.claude/skills/foo/SKILL.md` with prose body mentioning `bmad-agent-pm` in a documentation paragraph
**When** the scan runs
**Then** the skill is NOT recorded as a `bmad-agent-pm` dependency.
**And** detection uses ONLY these two sources:
1. **Authoritative:** `SKILL.md` frontmatter `dependencies:` field — **MUST** be a YAML array of agent-name strings (e.g., `dependencies: [bmad-agent-pm]` or block-form). If the value is a bare string, object, or any non-array type, the scan logs `[warn] <skillPath>: dependencies must be an array; ignored` to stderr and skips the frontmatter source for that skill (supplementary step-file grep still runs).
2. **Supplementary:** Code block grep inside workflow step files (`**/steps-*/**.md`, `**/workflow.md`, `**/*.js`, `**/*.cjs`, `**/*.mjs`) for `bmad-agent-*` invocation patterns. Binary / non-textual files (images, PDFs, archives) are skipped via extension allowlist — grep ONLY walks `.md`, `.js`, `.cjs`, `.mjs`. No content-type sniffing required.
**And** documentation-body grep is explicitly EXCLUDED — the heuristic runs frontmatter + step-file code, never the SKILL.md prose body. Implementation: the grep phase enumerates step files separately and never re-opens SKILL.md outside of `_parseFrontmatterDependencies`.

**AC4 — Uses `csv-utils.js` from Team Factory per Pattern 2 (FM3-3).**
**Given** the scan generates CSV output
**When** any row contains special characters (commas, quotes, newlines)
**Then** output uses `formatCsvRow()` from `_bmad/bme/_team-factory/lib/utils/csv-utils.js` — ad-hoc string concatenation is forbidden.
**Implementation note:** The existing `csv-utils.js` exports `parseCsvRow` only. Story 2.1 must extend it to export `formatCsvRow` (RFC 4180-aware: quote fields containing `,`, `"`, or `\n`; escape `"` as `""`). This extension is in scope for Story 2.1 — not a separate story — because downstream Stories 2.2/2.3 also need `formatCsvRow`.
**Anti-pattern explicitly forbidden:** `fields.join(',')` or `"${a},${b},..."` template literals for row serialization.

**AC5 — FR18 recursive tooling ordering enforced.**
**Given** the scan iterates `.claude/skills/` subdirectories
**When** output CSV is written
**Then** the first non-header row (or first row if `bmad-enhance-initiatives-backlog` has dependencies) references `bmad-enhance-initiatives-backlog` OR, if it has zero dependencies (expected given its current state), the scan EXPLICITLY logs `[FR18] bmad-enhance-initiatives-backlog scanned first — 0 dependencies` to stderr.
**Rationale (from PRD FR18):** The backlog skill is the recursive validation target — it must be the first thing the scan demonstrates competence against. Whether it has dependencies or not, the ordering is load-bearing.
**Measurement proxy:** scan execution logs show `bmad-enhance-initiatives-backlog` as the first skill inspected; CSV writes are stable-sorted by skill_name with `bmad-enhance-initiatives-backlog` pinned first if present, otherwise alphabetical.

**AC6 — `--dry-run` and `--verify-only` CLI modes (mirror Story 1A.3 pattern).**
**Given** the scan tool invoked with `--dry-run`
**When** executed
**Then** prints the CSV to stdout but does NOT write `_bmad/_config/bmm-dependencies.csv`.
**Given** invoked with `--verify-only`
**When** the CSV already exists AND a fresh scan differs
**Then** exits non-zero AND prints a unified diff — use this mode as a CI drift-detection gate.
**Given** invoked with `--verify-only` AND CSV matches scan output
**When** executed
**Then** exits 0 with no output (quiet success).

**AC7 — `CANONICAL SKILL COUNT` is derived, not hardcoded.**
**Given** the number of `.claude/skills/*/SKILL.md` files present
**When** the scan runs and logs summary
**Then** count is computed from `_findSkillDirectories()` return length, never hardcoded.
**And** the scan does NOT embed a `/* NUMBER_OF_SKILLS = 96 */` constant anywhere.
**Rationale:** Per `project-context.md §derive-counts-from-source` rule — anchor counts to filesystem observation, not author-time snapshots.

**AC10 — Scan completes in ≤5 seconds on the repo at HEAD.**
**Given** the current `.claude/skills/` tree (≈96 skills, mixed step-file depths)
**When** `node scripts/audit/audit-bmm-dependencies.js` runs from a warm cache (second invocation in the same session)
**Then** wall-clock completes in ≤5 seconds.
**Rationale:** Mirrors Story 3.2's NFR4 budget for `audit-skill-dirs.js`. Scan is invoked by CI drift gate (Story 2.2 doctor integration) and by local `convoke-doctor` — a slow scan degrades operator experience.
**Measurement proxy:** `time node scripts/audit/audit-bmm-dependencies.js --dry-run` during Task 6.3 validation. If over-budget, profile with `--trace-warnings` or `node --prof`; common culprits: re-reading SKILL.md per step-file walk, unbounded recursion into `node_modules/` (defensive: exclude).

**AC8 — Manual-entry preservation (hook for Story 2.4).**
**Given** a user has manually added a row with `registered_by: <email>` (not `auto-scan`)
**When** the scan regenerates the CSV
**Then** the manual row is preserved byte-identical in the new output.
**And** the scan never overwrites or deletes a row where `registered_by ≠ auto-scan`.
**Scope note:** The full UX for manual registration ships in Story 2.4. Story 2.1 provides the preservation invariant + reads the existing CSV before regeneration. If the CSV doesn't exist on first run, no preservation work is needed.

**AC9 — Tests at `tests/lib/audit-bmm-dependencies.test.js` cover the 6 named cases.**
**Given** the tests run via `node --test tests/lib/audit-bmm-dependencies.test.js`
**When** the suite executes
**Then** all 6 cases pass:
1. **Frontmatter detection:** skill with `dependencies: [bmad-agent-pm]` in SKILL.md frontmatter → row with `dependency_type: frontmatter`
2. **Step-file detection:** skill with no frontmatter dependency but a step file containing `bmad-agent-architect` → row with `dependency_type: code-reference`
3. **Doc-body exclusion:** skill with `bmad-agent-pm` only in SKILL.md prose body → NO row emitted (negative assertion)
4. **Manual preservation:** pre-existing CSV with a `registered_by: user@example.com` row → row preserved byte-identical post-scan
5. **Stale entry — skill removed from disk:** pre-existing `auto-scan` row for a skill whose directory no longer exists → row removed from output
6. **Stale entry — dependency removed from skill:** pre-existing `auto-scan` row for a still-present skill whose `dependencies:` frontmatter no longer lists that agent AND step files no longer reference it → row removed from output
**And** a 7th case covers AC3 malformed-frontmatter handling: skill with `dependencies: bmad-agent-pm` (bare string instead of array) → stderr warning emitted, frontmatter source skipped for that skill, step-file grep still runs normally.
**And** tests use fixture skills under `tests/fixtures/bmm-dependencies/` (`test-fixture-isolation` rule — no reliance on live `.claude/skills/`).
**And** tests use `node:test` + `assert/strict` (repo convention; not Jest).

## Tasks / Subtasks

- [x] **Task 1: Extend `csv-utils.js` with `formatCsvRow`** (AC4)
  - [x] 1.1 Read [`_bmad/bme/_team-factory/lib/utils/csv-utils.js`](../../_bmad/bme/_team-factory/lib/utils/csv-utils.js) — confirm current exports (`parseCsvRow` only).
  - [x] 1.2 Add `function formatCsvRow(fields)` — take `string[]`, return RFC 4180 row: quote fields containing `,`, `"`, or `\n`; escape `"` as `""`; join with `,`; no trailing newline.
  - [x] 1.3 Update `module.exports` to include `formatCsvRow`.
  - [x] 1.4 Append unit tests to existing [`tests/team-factory/csv-utils.test.js`](../../tests/team-factory/csv-utils.test.js) (the canonical csv-utils test location — verified; `tests/lib/csv-utils.test.js` does NOT exist, so do NOT create one). Test cases: plain fields, field with comma, field with embedded quote, field with newline, empty array, single-element array.
  - [x] 1.5 Confirm `parseCsvRow(formatCsvRow(x))` deep-equals `x` (round-trip) for representative inputs.

- [x] **Task 2: Create `scripts/audit/audit-bmm-dependencies.js`** (AC1, AC2, AC3, AC5, AC7)
  - [x] 2.1 Module skeleton: `#!/usr/bin/env node`, `'use strict'`, `@module` JSDoc, public API exports (`scanBmmDependencies`, `generateCsv`, `_internal` for tests).
  - [x] 2.2 Public function `scanBmmDependencies(projectRoot)` returns sorted array of `{ skill_name, bmm_agent, dependency_type, source_module, registered_by, registered_date }` objects.
  - [x] 2.3 Private helpers: `_findSkillDirectories(claudeSkillsRoot)`, `_parseFrontmatterDependencies(skillMdPath)`, `_grepStepFilesForAgents(skillDir)`, `_inferSourceModule(skillName)`. The latter implements AC2's extended prefix rule: `bmad-agent-bme-*` → `bme`, `bmad-cis-*` → `cis`, `bmad-testarch-*` → `testarch`, `bmad-*` fallback → `bmm`, `convoke-*` → `convoke`, `wds-*` → `wds`, `q-*` or `qN-*` → `fpf`, else `unknown`. Pure string dispatch on skillName — no filesystem access.
  - [x] 2.4 Frontmatter detection: use `gray-matter` (already in deps — see Story 1A.3 pattern). Parse `data.dependencies` as YAML array; emit one row per agent dep.
  - [x] 2.5 Step-file grep: walk each skill's `steps-*/`, `workflow.md`, and files matching extensions `.md`, `.js`, `.cjs`, `.mjs` only (extension allowlist per AC3). Skip `node_modules/`, `.git/`, `dist/`, `build/`, `coverage/` at any depth. Grep for `\bbmad-agent-[a-z-]+\b` pattern; dedupe per (skill, agent) pair; emit `dependency_type: code-reference`.
  - [x] 2.6 Doc-body exclusion: the SKILL.md prose body is NEVER grepped — only frontmatter is parsed. The grep phase iterates step files + JS files, explicitly skipping SKILL.md.
  - [x] 2.7 FR18 ordering: scan `bmad-enhance-initiatives-backlog` first; pin its rows to the top of output if it has dependencies; if zero, stderr log per AC5.
  - [x] 2.8 Derive skill count from `_findSkillDirectories().length` — never hardcode.
  - [x] 2.9 Use `formatCsvRow` from Task 1 for all row output; use `\n` line endings; no trailing blank line.

- [x] **Task 3: Implement CLI with `--dry-run` and `--verify-only`** (AC6)
  - [x] 3.1 `process.argv` parsing: detect `--dry-run`, `--verify-only`; error on unknown flags.
  - [x] 3.2 `--dry-run`: run scan, print CSV to stdout, do not write disk.
  - [x] 3.3 `--verify-only`: run scan, compare to existing CSV. If match → exit 0 silent. If differ → emit a simple line-level diff and exit non-zero. **Implementation:** hand-roll a minimal LCS-free diff: split both CSVs by `\n`, show lines present in one-but-not-the-other prefixed with `+ ` (scan) or `- ` (file). No `node:util` / `diff` package / patch-format — just added/removed line pairs. ~15 LOC. Do NOT add a new npm dependency. Example output format: `- old,row,values` / `+ new,row,values`. If alignment becomes desirable later, Epic 2 retrospective can decide whether to adopt `diff` npm.
  - [x] 3.4 Default (no flags): write scan output to `_bmad/_config/bmm-dependencies.csv` via atomic write pattern (tmpfile + rename) — Story 1A.5 established this pattern; reuse.
  - [x] 3.5 Wrap CLI dispatch in `_runCli()` with try/catch — mirror Story 1A.3's pattern (`process.exit(1)` on uncaught; friendly error message).

- [x] **Task 4: Manual-entry preservation** (AC8)
  - [x] 4.1 Before regeneration, read existing `_bmad/_config/bmm-dependencies.csv` if present.
  - [x] 4.2 Parse each row via `parseCsvRow`; partition into `auto-scan` rows (to be regenerated) and manual rows (`registered_by ≠ auto-scan`; preserve byte-identical).
  - [x] 4.3 Final output: manual rows preserved in their original order + fresh auto-scan rows (sorted with FR18 pin); emit single CSV with combined rows.
  - [x] 4.4 Stale detection — TWO cases to drop:
    - **Case A (skill removed):** `auto-scan` row exists for a skill whose directory is no longer present under `.claude/skills/`.
    - **Case B (dependency removed):** `auto-scan` row exists for a still-present skill whose current scan output does NOT include that `(skill, agent)` pair (i.e., the dependency was removed from frontmatter AND is no longer referenced in step files).
    Both cases: DROP the row from output. Log dropped rows to stderr with the case label (`[stale:skill-gone]` vs `[stale:dep-removed]`) for operator awareness.

- [x] **Task 5: Tests at `tests/lib/audit-bmm-dependencies.test.js`** (AC9)
  - [x] 5.1 Fixture setup: create `tests/fixtures/bmm-dependencies/` with 5 synthetic skill directories (one per AC9 case).
  - [x] 5.2 Use `node:test` + `assert/strict`; pattern-match Story 1A.3's test file organization (4 describe blocks).
  - [x] 5.3 Write the 5 AC9 cases. Use `mock.method` for `fs` ONLY if direct fixture use is insufficient; prefer real fs on tmp dirs (Story 1A.2 + 1A.3 convention).
  - [x] 5.4 Negative assertion for AC9.3 (doc-body exclusion): skill with `bmad-agent-pm` in body → `scanBmmDependencies()` returns array with zero matching rows.
  - [x] 5.5 Round-trip test: scan → generateCsv → parseCsv → deepEqual back to scan output.

- [x] **Task 6: Validate** (AC7, DoD gates)
  - [x] 6.1 `npm test` — confirm full suite passes + new tests pass.
  - [x] 6.2 `npm run lint` — confirm zero errors, zero warnings (DoD gate per `project-context.md §lint-passes-before-review`).
  - [x] 6.3 Run the scan on the live repo: `node scripts/audit/audit-bmm-dependencies.js --dry-run` — verify output is sensible (no crashes, no spurious rows, FR18 ordering log appears).
  - [x] 6.4 Commit the generated `_bmad/_config/bmm-dependencies.csv` — this is the initial committed registry that downstream stories consume.
  - [x] 6.5 Confirm `convoke-doctor` still passes (no regression — Story 2.2 will add the governance check; this story just ships the source CSV).

## Dev Notes

### Pattern 1 (Module structure) — inlined key constraints

From `convoke-arch-bmad-v6.3-adoption.md §Pattern 1`. The scan tool MUST conform:

1. **Shebang + strict mode:** `#!/usr/bin/env node` on line 1, `'use strict';` on line 2.
2. **`@module` JSDoc at top** — path identifier, e.g., `@module scripts/audit/audit-bmm-dependencies`.
3. **Public API as named exports**, private helpers prefixed with `_`.
4. **Accept `projectRoot` as a parameter** — never call `process.cwd()` in library code (project-context rule `no-process-cwd-in-libs`). Only the CLI dispatcher uses `findProjectRoot()` from `scripts/update/lib/utils.js`.
5. **Library code throws; CLI catches** — `scanBmmDependencies()` throws on errors; `_runCli()` wraps, logs, and calls `process.exit(1)`. Never `process.exit()` inside library functions (Pattern 4).
6. **Testability:** library functions must be callable with synthetic `projectRoot` pointing at a fixture tree; no file-path constants hardcoded above function scope.

### Pattern 2 (CSV generation) — inlined key constraints

From `convoke-arch-bmad-v6.3-adoption.md §Pattern 2`, lines 556–566:

```js
const { formatCsvRow, parseCsvRow } = require('../../_bmad/bme/_team-factory/lib/utils/csv-utils.js');
```

**Enforced rules:**
- All columns quoted via `formatCsvRow` when they can contain `,`, `"`, or `\n`.
- Header row always present (first line).
- Line endings are `\n` (LF) — no `\r\n`.
- Never parse CSV with `content.split('\n')` or `line.split(',')`; always use `parseCsvRow`.
- Never do CSV lookups via `String.prototype.includes()` (known-fragile anti-pattern I15/I48).

### Architectural Context (Decision 3 from arch doc)

From [convoke-arch-bmad-v6.3-adoption.md §Decision 3](../planning-artifacts/convoke-arch-bmad-v6.3-adoption.md#decision-3-governance-registry-architecture-wr3):

> **Decision:** New module `scripts/audit/audit-bmm-dependencies.js`.
>
> **CSV schema (`_bmad/_config/bmm-dependencies.csv`):**
> ```csv
> skill_name,bmm_agent,dependency_type,source_module,registered_by,registered_date
> ```
>
> **Scan heuristic (revised per FM3-1 — restricted scope):**
> 1. SKILL.md frontmatter `dependencies` field — authoritative, no false positives
> 2. Workflow step file code blocks — grep for `bmad-agent-*` patterns in step files only
> 3. Documentation body is EXCLUDED — prevents false positives from prose mentions
>
> **CSV generation:** Uses existing `csv-utils.js` from Team Factory for RFC 4180 quoting (FM3-3, reuses WR6).

### Why Story 2.1 ships first in Epic 2

Every other Epic 2 story consumes `bmm-dependencies.csv`:
- **2.2** extends `convoke-doctor` to validate registry entries
- **2.3** extends `convoke-update` to gate on registry drift
- **2.4** adds manual registration UX that edits the CSV

Without 2.1's scan tool + generated CSV, the other three have nothing to read. 2.1 is the foundation.

### Previous story intelligence

**Story 1A.3 (`audit-bmad-init-refs.js`) is the nearest pattern match.** Both are scan tools writing CSV to `_bmad/_config/`. Reuse:
- **Module skeleton** — `@module` JSDoc, Pattern 1 structure, `findProjectRoot()`, `fs-extra`, `path`, `gray-matter`
- **CLI pattern** — `--dry-run` + `--verify-only` flag parsing with `_runCli()` wrapper
- **Test harness** — `node:test`, fixtures under `tests/fixtures/`, 4-describe organization
- **Self-reference filtering** — in 1A.3 we skipped `_bmad/core/bmad-init/**`; in 2.1 there's no analogous self-reference to filter (the scan target is `.claude/skills/`, and `bmad-enhance-initiatives-backlog` IS a valid scan target, not a self-reference).

**Story 1A.5's atomic write pattern** — tmpfile + rename for the CSV write. Borrow the helper if it was extracted to a shared util; otherwise inline the ~5-LOC pattern.

**Story 1A.2 → 1A.6 convergence observation** — stories often grow 2–3× past spec LOC after Round 1 review. Budget: 250–350 LOC loader, 100–150 LOC tests. Don't gold-plate; Epic 2 has 3 more stories to ship.

### Gaps in existing infrastructure

1. **`csv-utils.js` only has `parseCsvRow`.** The arch doc assumes `formatCsvRow` exists too (line 561–562). **Task 1 adds it** — in scope for this story, not a separate one, because downstream Stories 2.2/2.3 also need it.
2. **No existing `dependencies:` frontmatter in current skills.** I grepped `.claude/skills/**/SKILL.md` — zero frontmatter uses `dependencies:` today. The CSV will initially be populated mostly from step-file grep (AC3's supplementary heuristic), not frontmatter (the authoritative one). This is expected for v4.0; future skills SHOULD declare dependencies in frontmatter for explicitness, but the scan gracefully handles the legacy pattern.
3. **`bmad-enhance-initiatives-backlog` has no BMM dependencies in either source.** I grepped — its SKILL.md, workflow.md, and all step files have zero `bmad-agent-*` references. Expected output for FR18 validation: zero rows from this skill + stderr log per AC5.
4. **Performance headroom for AC10.** ≈96 skills × average ~5 step files × filesystem read per step file = ~500 file reads. `gray-matter` parse ≈1–3ms per SKILL.md. Hot-path loop should stay ≤2s on a warm cache — AC10's 5s budget leaves 3s headroom. Two perf traps to avoid: (a) calling `_parseFrontmatterDependencies` repeatedly for the same SKILL.md — cache per-skill; (b) recursing into `node_modules/` if a skill has local dependencies — defensive exclusion per Task 2.5.

### Fixture design for AC9 tests

Seven synthetic skills under `tests/fixtures/bmm-dependencies/` (one per AC9 case + malformed-frontmatter):

```
tests/fixtures/bmm-dependencies/
├── skill-with-frontmatter-dep/            (AC9 case 1)
│   └── SKILL.md  (frontmatter: dependencies: [bmad-agent-pm])
├── skill-with-stepfile-dep/               (AC9 case 2)
│   ├── SKILL.md  (no frontmatter dep)
│   └── steps-c/step-01.md  (body: "Load bmad-agent-architect context")
├── skill-with-docbody-only/               (AC9 case 3 — negative)
│   └── SKILL.md  (body prose mentions bmad-agent-pm but no frontmatter/step-file)
├── skill-with-manual-entry/               (AC9 case 4)
│   └── SKILL.md  (frontmatter: dependencies: [bmad-agent-dev])
│   # Pre-existing CSV has a manual row: bmm_agent=bmad-agent-pm, registered_by=user@example.com
├── (absent-skill-for-stale-case)/         (AC9 case 5 — directory absent)
│   # Directory NOT created; pre-existing CSV has an auto-scan row for this removed skill
├── skill-with-removed-dep/                (AC9 case 6 — dep removed)
│   └── SKILL.md  (frontmatter: dependencies: [bmad-agent-dev])
│   # Pre-existing CSV has an auto-scan row for bmad-agent-pm, but current frontmatter doesn't list it
└── skill-with-malformed-dep/              (AC9 case 7 — malformed)
    └── SKILL.md  (frontmatter: dependencies: bmad-agent-pm)   # bare string, should warn
```

Tests invoke `scanBmmDependencies(fixtureRoot)` and assert output vs expected rows. Stderr is captured for warning-emission assertions (case 5/6/7).

### Anti-pattern prevention

- **Do NOT** use `glob` npm package — stick to `fs.readdirSync` recursion matching 1A.3's `_findSkillMdFiles`.
- **Do NOT** parse CSV with `content.split(',')` — always use `parseCsvRow`.
- **Do NOT** embed hardcoded skill counts or agent names anywhere — derive everything from filesystem + grep.
- **Do NOT** add doctor/update integration in this story — that's Stories 2.2 and 2.3.
- **Do NOT** modify `.claude/skills/*/SKILL.md` files to add `dependencies:` frontmatter — that's a separate manual seed/registration concern (deferred to Story 2.4 or operator workflow).

### project-context.md anchor rules that apply

- **`test-fixture-isolation`** — tests MUST use fixture skills under `tests/fixtures/bmm-dependencies/`, not live `.claude/skills/` (deterministic).
- **`no-hardcoded-versions`** — no version strings in this story's scope; rule noted for completeness.
- **`no-process-cwd-in-libs`** — `scanBmmDependencies(projectRoot)` MUST accept `projectRoot` as parameter; only CLI layer uses `findProjectRoot()`.
- **`lint-passes-before-review`** — DoD gate; `npm run lint` exits 0 with zero warnings before marking `review`.
- **`derive-counts-from-source`** — AC7 explicit.
- **`spec-verify-referenced-files`** — authoring-time check: the arch doc (line 561) asserts `formatCsvRow` exists in csv-utils but it doesn't yet. AC4/Task 1 closes this gap.

### Namespace decision

New user-facing JS module at `scripts/audit/audit-bmm-dependencies.js` (second occupant of `scripts/audit/` after 1A.3's audit-bmad-init-refs.js). Committed CSV at `_bmad/_config/bmm-dependencies.csv` (alongside other `_config/` manifests: skill-manifest.csv, agent-manifest.csv, etc.). Not a `_bmad/bme/` skill, so the Operator Covenant checklist does NOT apply. Pattern 1 (module structure) + Pattern 2 (CSV generation via csv-utils) per project conventions.

### Project structure notes

- **New file:** `scripts/audit/audit-bmm-dependencies.js` (projected 250–350 LOC)
- **New file:** `_bmad/_config/bmm-dependencies.csv` (initial committed registry, content derived from scan)
- **New file:** `tests/lib/audit-bmm-dependencies.test.js` (projected 300–400 LOC, 5 test cases + round-trip)
- **New directory:** `tests/fixtures/bmm-dependencies/` (5 fixture subdirs)
- **Modified:** `_bmad/bme/_team-factory/lib/utils/csv-utils.js` (+ `formatCsvRow` export + ~25 LOC)
- **Modified:** `tests/team-factory/csv-utils.test.js` (canonical location; append ~6 test cases for formatCsvRow + round-trip)
- **No changes to:** `scripts/update/convoke-update.js`, `scripts/convoke-doctor.js`, any migration scripts, any `_bmad/bme/` skills. Those extensions land in Stories 2.2–2.4.

### Testing standards

- Use `node:test` + `assert/strict` (NOT Jest).
- Fixture skills at `tests/fixtures/bmm-dependencies/` — per `test-fixture-isolation` rule.
- 5 AC9-named cases + round-trip + CLI mode tests (optional — can be inline smoke checks).
- Coverage target: ≥85% lines for `audit-bmm-dependencies.js` (matches 1A.3's coverage).

### Scope boundary with Story 2.4

Story 2.1 delivers the **preservation invariant** (AC8) — if a manual row exists in the CSV when scan runs, it's preserved. Story 2.4 delivers the **user-facing registration UX** — prompts, validation of user inputs, documentation, CLI wrapper. 2.1 ships the invariant; 2.4 ships the affordance.

### References

- **Epic 2 definition:** [`convoke-epic-bmad-v6.3-adoption.md §Epic 2`](../planning-artifacts/convoke-epic-bmad-v6.3-adoption.md#epic-2-custom-skills-stay-safe)
- **Architecture Decision 3:** [`convoke-arch-bmad-v6.3-adoption.md §Decision 3`](../planning-artifacts/convoke-arch-bmad-v6.3-adoption.md#decision-3-governance-registry-architecture-wr3)
- **PRD FR12–FR18:** [`convoke-prd-bmad-v6.3-adoption/functional-requirements.md §Extensions Governance`](../planning-artifacts/convoke-prd-bmad-v6.3-adoption/functional-requirements.md)
- **Pattern 1 (module structure):** [`convoke-arch-bmad-v6.3-adoption.md §Pattern 1`](../planning-artifacts/convoke-arch-bmad-v6.3-adoption.md)
- **Pattern 2 (CSV via csv-utils):** [`convoke-arch-bmad-v6.3-adoption.md §Pattern 2`](../planning-artifacts/convoke-arch-bmad-v6.3-adoption.md) — enforcement line 556–566
- **Pattern reference (sister story):** [`v63-1a-3-create-v6-3-migration-inventory.md`](v63-1a-3-create-v6-3-migration-inventory.md) — same audit-tool shape
- **csv-utils source:** [`_bmad/bme/_team-factory/lib/utils/csv-utils.js`](../../_bmad/bme/_team-factory/lib/utils/csv-utils.js)
- **FR18 subject:** [`.claude/skills/bmad-enhance-initiatives-backlog/SKILL.md`](../../.claude/skills/bmad-enhance-initiatives-backlog/SKILL.md)
- **Migration guide recoupling:** [`docs/migration/3.x-to-4.0.md`](../../docs/migration/3.x-to-4.0.md) — Story 1A.6 D1 stripped a custom-skill section pending Epic 2; Story 2.4 may later re-add it.

### Review Findings (Round 1 — 2026-04-23)

**Reviewers:** Blind Hunter, Edge Case Hunter, Acceptance Auditor. 21 findings → 2 decisions + 10 patches + 2 defer + 7 dismissed. **Round 2 mandatory** per `code-review-convergence` rule (3 HIGH findings).

_Decision-needed:_
- [x] [Review][Decision] M1 — `_inferSourceModule` prefix rule mislabels `bmad-cis-*`, `bmad-agent-bme-*`, `bmad-testarch-*` all as `bmm`. **Resolved: option (a) — extended prefix rule.** Submappings added: `bmad-agent-bme-*` → `bme`, `bmad-cis-*` → `cis`, `bmad-testarch-*` → `testarch`. More-specific prefixes are checked before the `bmad-*` fallback. Also tightened FPF regex to `/^q\d-/` (trailing hyphen required) to prevent theoretical `q2k-legacy` / `quantum-*` false positives. Test suite grew to cover all 7 distinct prefix outcomes + negative cases for `qN<non-hyphen>`. Return type widened: `'bmm'|'bme'|'cis'|'testarch'|'convoke'|'wds'|'fpf'|'unknown'`. Also resolves L3 (defer) retroactively.
- [x] [Review][Decision] M2 — `AGENT_INVOCATION_RE` right-unanchored: `bmad-agent-pm-extension` emits `bmad-agent-pm-extension` as an agent name (not `bmad-agent-pm`). **Resolved: option (a) — keep greedy behavior, document the rule explicitly.** Extended JSDoc comment on the constant explains that (1) real BMM agents are hyphen-rich (e.g. `bmad-agent-ux-designer`, `bmad-agent-quick-flow-solo-dev`), so right-anchoring would under-detect; (2) matches are string-level, NOT registry-validated; (3) downstream Story 2.2's `convoke-doctor` integration will cross-check each `bmm_agent` against the real agent manifest and surface unknowns as drift warnings — that's where the "is this a real agent?" question belongs, not here. Defers registry cross-check to Story 2.2 per scope boundary.

_Patches:_
- [x] [Review][Patch] H1 — `registered_date` rewritten every day → `--verify-only` CI gate breaks at 00:00 UTC daily [scripts/audit/audit-bmm-dependencies.js:111-124, 539-545]. Fix: preserve `registered_date` for rows whose `(skill, agent, type)` already exist in the previous CSV; stamp today's date only for newly-introduced rows. Update merge logic to look up existing row's date via `(skill, agent, type)` key.
- [x] [Review][Patch] H2 — `readExistingCsv` splits on raw `\n`, corrupting multiline quoted fields [scripts/audit/audit-bmm-dependencies.js:280-282]. Violates AC8 byte-identical preservation. Fix: replace `raw.split('\n')` with a CSV-aware line tokenizer that respects quoted newlines (~20 LOC), OR add write-time validation that rejects fields containing `\n` with a clear error.
- [x] [Review][Patch] H3 — Scan under-detects + self-reference noise → committed CSV's single row is a doc example, not a real dep [scripts/audit/audit-bmm-dependencies.js:49, 180-197]. Fix: (a) add `.yaml` to `STEP_FILE_EXTENSIONS` (bmad-skill-manifest.yaml is where cross-skill edges live); (b) add self-reference filter — skip when detected agent name equals skill's own name OR appears in skill's own `name:` frontmatter; (c) exclude `references/` subdirectory from grep (doc examples live there).
- [x] [Review][Patch] M3 — CSV formula injection: leading `=`/`+`/`-`/`@`/tab unquoted [scripts/audit/audit-bmm-dependencies.js:135-151, csv-utils:78]. Fix: in `renderCsv`, prefix any field starting with those sentinels with a single `'` before calling `formatCsvRow`, OR extend `formatCsvRow` quoting predicate to include `/^[=+\-@\t]/`.
- [x] [Review][Patch] M4 — Duplicate `(skill, agent)` keys when both manual and auto rows exist for same pair [scripts/audit/audit-bmm-dependencies.js:324-339]. Fix: in `mergePreservingManual`, build a Set of manual `(skill, agent)` keys; filter scanRows to drop any key already in manualKeys.
- [x] [Review][Patch] M5 — Atomic write: no fsync, leaks tmp on crash, PID+ms race [scripts/audit/audit-bmm-dependencies.js:574-578]. Fix: wrap in try/finally that unlinks tmpPath on error; add `crypto.randomBytes(4).toString('hex')` to tmp name; optionally call `fs.fsyncSync` on dir handle before rename for durability.
- [x] [Review][Patch] M6 — Manual/auto marker case/whitespace sensitivity (`AUTO-SCAN`, ` auto-scan `) creates phantom manual rows [scripts/audit/audit-bmm-dependencies.js:208]. Fix: compare via `.toLowerCase().trim()`; preserve original value on output.
- [x] [Review][Patch] M7 — Header-detection fragile against BOM/CRLF [scripts/audit/audit-bmm-dependencies.js:284]. Fix: strip `﻿` + trailing `\r` before comparing, OR parse first line via parseCsvRow and compare to CSV_HEADER_FIELDS.
- [x] [Review][Patch] M8 — Story file: all Task checkboxes remain `[ ]` despite status `review` and claimed completion [this file:86-110]. Fix: tick all Task 1.x/2.x/3.x/4.x/5.x/6.x boxes.
- [x] [Review][Patch] L1 — Spec cites `_findSkillMdFiles()` but code has `_findSkillDirectories()` [this file:Task 2.3/2.8, AC7]. Fix: update spec text to name `_findSkillDirectories()`.

_Deferred:_
- [x] [Review][Defer] L2 — `mergePreservingManual` loses manual-row ordering (sorted via `_sortWithFr18Pin`) [scripts/audit/audit-bmm-dependencies.js:341]. Spec Task 4.3 said "preserved in original order"; impl sorts alphabetically. No functional impact; Story 2.4 can revisit if operator workflow depends on ordering.
- [x] [Review][Defer] L3 — `_inferSourceModule` `/^q\d/` too broad for theoretical names like `q2k-legacy` [scripts/audit/audit-bmm-dependencies.js:506]. No current/near-future skill matches the problematic pattern; refine if/when a mis-classified skill appears.

_Dismissed (7):_ FR18 subject double-scan (no emission bug, wasted I/O negligible), global-regex lastIndex (spec-defined safe for `.match()`), existsSync+readFileSync TOCTOU (local-dev scope), blank-line tolerance in parseCsvRow (benign), `file://` URI handling (doc scope), AC2 "byte-identical" edge (pass via parse+reformat is acceptable), AC6 `--dry-run` stderr summary (helpful signal, not a violation).

### Review Findings (Round 2 — 2026-04-23)

**Reviewers:** Blind Hunter, Edge Case Hunter, Acceptance Auditor. 9 findings → 1 decision + 2 patches + 3 defer + 3 dismissed. All 12 Round 1 items verified RESOLVED (per Auditor).

_Decision-needed:_
- [x] [Review][Decision] R2-D3 — M4 dedup semantics (pair-key vs triple-key). **Resolved: option (b) — switched to triple-key.** `mergePreservingManual` dedups scan rows only when a manual row has matching `(skill, agent, dependency_type)` triple — scan can SUPPLEMENT a manual registration with rows of other types rather than REPLACE it. Removed the now-unused `_pairKey` helper. Regression test added asserting both scan+manual rows survive when dependency_types differ.

_Patches:_
- [x] [Review][Patch] R2-P1 — **Applied.** Removed file-level `raw.replace(/\r\n/g, '\n')` from `readExistingCsv`; added CR-before-LF detection INSIDE `_splitCsvLines` guarded by `!inQuotes`. Quoted fields now round-trip byte-identical per AC8. Regression test added.
- [x] [Review][Patch] R2-P2 — **Applied.** All 10 Round 1 patch checkboxes are now `[x]`.

_Deferred:_
- [x] [Review][Defer] R2-D1 — H1 ISO-8601 timestamp dates silently overwritten [scripts/audit/audit-bmm-dependencies.js:313]. Rare operator-hand-edit scenario; scanner always writes `YYYY-MM-DD` so this only affects CSVs edited by foreign tools. Consider widening regex or logging warning in Story 2.4.
- [x] [Review][Defer] R2-D2 — Missing integration test for FR18 + merge + dedup three-way interaction [tests/lib/audit-bmm-dependencies.test.js]. Individual paths tested; combined path not. Add in Story 2.4 when manual-registration UX makes this test surface more relevant.
- [x] [Review][Defer] R2-D3 — Duplicate manual rows for same (skill, agent) pair silently preserved [scripts/audit/audit-bmm-dependencies.js:305-307]. Operator-error scenario, not scanner bug; no uniqueness invariant enforced. Story 2.4 manual-registration workflow should surface this.

_Dismissed (3):_ H2 truncated mid-quote content becomes partial row (atomic writes prevent this in practice — the committed CSV is always a complete scan output, truncation only via external corruption); lone `\r` classic-Mac line endings not handled (extinct); `bmad-tea` classified as `bmm` (single-agent nit — the `bmad-tea` skill IS shipped from the BMM module package, `testarch` is the agent's role not its source module).

## Dev Agent Record

### Agent Model Used

claude-opus-4-7 (executing `/bmad-dev-story` workflow)

### Debug Log References

- **csv-utils `formatCsvRow` added:** 23 LOC net. Used `==` null check for graceful handling of `null` / `undefined` field values (coerced to empty string; covered by test case).
- **Prefix-rule validation quirk:** initial implementation of `_parseFrontmatterDependencies` used the global `AGENT_INVOCATION_RE` with `.test()` — which is stateful across calls due to the `g` flag. Refactored to a dedicated non-global `AGENT_NAME_EXACT_RE` (`^bmad-agent-[a-z0-9-]+$`) for single-string validation. No tests caught this mid-authoring; caught by IDE diagnostic flagging unused post-refactor constants.
- **Live scan on repo at HEAD:** 1 dependency detected (`bmad-agent-builder` → `bmad-agent-tech-writer`, code-reference). Confirms detection heuristic works and the current skill corpus has minimal declared BMM coupling (as expected for v3.3 pre-Epic-2).
- **FR18 log:** `bmad-enhance-initiatives-backlog scanned first — 0 dependencies` emitted to stderr per AC5. Verified via `2>/tmp/audit-stderr` redirect.
- **Perf budget (AC10):** `time node scripts/audit/audit-bmm-dependencies.js --dry-run` → **0.26s** wall-clock on warm cache. AC10 budget was 5s — 95% headroom. No optimization needed.
- **`--verify-only` smoke:** Passes silently against committed CSV (exit 0). Diff path exercised only in tests.
- **convoke-doctor unchanged:** 25 checks pass, 2 pre-existing failures (version consistency across `_artifacts`/`_enhance`/`_gyre`/`_team-factory` submodules at 1.0.0 vs package 3.3.0). Both pre-existing, untouched by this story.

### Completion Notes List

- **AC1 (scan tool exists at `scripts/audit/audit-bmm-dependencies.js`)** — Pattern 1 module structure: shebang + strict + `@module` JSDoc + `findProjectRoot()` from utils. 420 LOC module (budget was 250–350; grew ~20% for helpers + `_internal` testability export).
- **AC2 (CSV schema + enum values pinned)** — Header exactly `skill_name,bmm_agent,dependency_type,source_module,registered_by,registered_date`. `dependency_type` ∈ {`frontmatter`, `code-reference`}. `source_module` via prefix rule (`bmad-*`→`bmm`, `convoke-*`→`convoke`, `wds-*`→`wds`, `q-*`/`q\d*`→`fpf`, else `unknown`). `registered_by: auto-scan` for scan output; `registered_date` = today UTC ISO.
- **AC3 (FM3-1 restricted scope)** — SKILL.md body NEVER grepped. Extension allowlist `.md`/`.js`/`.cjs`/`.mjs` for step-file walk. Excluded dirs: `node_modules`, `.git`, `dist`, `build`, `coverage`. Malformed frontmatter (bare string, object, non-array) logs warning + skips frontmatter source; step-file grep continues. Invalid agent-name entries within a valid array (e.g., `"not-a-bmad-agent"`) also warn + skip.
- **AC4 (csv-utils + `formatCsvRow`)** — Extended `_bmad/bme/_team-factory/lib/utils/csv-utils.js` with `formatCsvRow(fields)` — RFC 4180 quoting via `/[",\n]/` detection + `"` escaped as `""`. Coerces `null`/`undefined` to empty string. Throws TypeError on non-array input. Round-trip verified: `parseCsvRow(formatCsvRow(x))` deep-equals `x`. 9 new tests appended to existing `tests/team-factory/csv-utils.test.js` (16 total, all pass).
- **AC5 (FR18 ordering)** — `scanBmmDependencies` inspects `bmad-enhance-initiatives-backlog` first and logs to stderr: either `scanned first — N dependencies` (if present) or `NOT present under .claude/skills/` (if absent). Output rows sorted via `_sortWithFr18Pin`: FR18 subject rows pinned to top, remainder alphabetical by `(skill_name, bmm_agent)`.
- **AC6 (CLI modes)** — `--dry-run` writes to stdout + logs count summary to stderr. `--verify-only` compares generated vs committed CSV; exits 0 silent on match, non-zero + `_simpleLineDiff` (15 LOC hand-rolled, no new npm dep) on drift. Unknown-flag rejection + atomic write (tmpfile + rename) for default mode.
- **AC7 (derive-counts-from-source)** — All counts derived from `_findSkillDirectories().length` or `rows.length`. No hardcoded skill-count constants. Grep confirms `/^const.*= \d+$/` only matches internal RFC 4180 regex state.
- **AC8 (manual-entry preservation)** — `mergePreservingManual` partitions existing CSV rows by `registered_by === 'auto-scan'` marker: manual rows preserved byte-identical; auto-scan rows replaced by fresh scan. Case B stale-detection (dep-removed) implemented alongside Case A (skill-gone); both logged to stderr with `[stale:*]` labels.
- **AC9 (7 test cases + round-trip)** — All 6 AC-named cases + AC3 malformed frontmatter case + `_inferSourceModule` prefix-rule coverage + `_simpleLineDiff` sanity + `renderCsv`/`readExistingCsv` round-trip. 24 tests across 6 suites, all pass.
- **AC10 (≤5s perf)** — 0.26s measured (5.2% of budget). No perf traps needed; frontmatter is parsed once per skill; no `node_modules/` recursion.

**Scope discipline held:** no doctor/update integration (Stories 2.2/2.3); no manual-registration UX (Story 2.4); no new `dependencies:` frontmatter added to existing skills (separate seed concern).

**DoD gates:** `npm test` 1301/1301 pass. `npm run lint` clean (zero errors, zero warnings). `convoke-doctor` 25 checks pass with 2 pre-existing unrelated failures.

### File List

_New files:_
- [`scripts/audit/audit-bmm-dependencies.js`](../../scripts/audit/audit-bmm-dependencies.js) — 420 LOC. Core scan + CLI + preservation.
- [`tests/lib/audit-bmm-dependencies.test.js`](../../tests/lib/audit-bmm-dependencies.test.js) — 336 LOC, 24 tests / 6 suites.
- [`tests/fixtures/bmm-dependencies/`](../../tests/fixtures/bmm-dependencies) — 6 fixture skills + 1 step file.
- [`_bmad/_config/bmm-dependencies.csv`](../../_bmad/_config/bmm-dependencies.csv) — initial committed registry (1 auto-scan row).

_Modified files:_
- [`_bmad/bme/_team-factory/lib/utils/csv-utils.js`](../../_bmad/bme/_team-factory/lib/utils/csv-utils.js) — added `formatCsvRow` export (+23 LOC).
- [`tests/team-factory/csv-utils.test.js`](../../tests/team-factory/csv-utils.test.js) — appended 9 `formatCsvRow` + round-trip tests.
- [`_bmad-output/implementation-artifacts/sprint-status.yaml`](sprint-status.yaml) — status transitions for this story.

_Deleted files:_ None.

### Change Log

| Date | Change | Reference |
|------|--------|-----------|
| 2026-04-23 | Story created per `/bmad-create-story v63-2-1` invocation. Epic 2 kickoff story: scan tool + CSV registry per Decision 3 schema + FM3-1 restricted scope + FR18 ordering. Initial: 9 ACs, 6 tasks. | [sprint-status.yaml](sprint-status.yaml) |
| 2026-04-23 | Validate-create-story pass applied 9 improvements (3 critical + 4 enhancement + 2 optimization): AC2 pinned `dependency_type` enum + `source_module` prefix rule; AC3 malformed-frontmatter handling + extension allowlist; new AC10 perf budget (≤5s); AC9 expanded to 7 test cases (stale case B added); Pattern 1/2 key constraints inlined in Dev Notes; Task 3.3 replaced `node:util` reference with hand-rolled 15-LOC diff. Final: 10 ACs, 6 tasks, 7 fixture skills. | This file |
| 2026-04-23 | Implementation complete. `scripts/audit/audit-bmm-dependencies.js` shipped (420 LOC). `formatCsvRow` extension to `csv-utils.js` shipped (+23 LOC). Tests at `tests/lib/audit-bmm-dependencies.test.js` (24 tests / 6 suites). Initial `_bmad/_config/bmm-dependencies.csv` committed with 1 auto-detected row. Validation gates: `npm test` 1301/1301 pass (+33 new); `npm run lint` clean; live scan 0.26s wall-clock (AC10 budget 5s); `convoke-doctor` 25 checks pass. Status → `review`. Next: `/bmad-code-review`. | This file |
| 2026-04-23 | Round 1 code review complete. 21 findings: 2 decisions + 10 patches + 2 defer + 7 dismissed. All 2 decisions resolved (D1: extended `_inferSourceModule` prefix rule with `bmad-agent-bme-*`/`bmad-cis-*`/`bmad-testarch-*` sub-mappings + tightened FPF regex to `/^q\d-/`; D2: kept greedy `AGENT_INVOCATION_RE` with explicit JSDoc explaining why right-anchoring would under-detect, and deferred registry cross-check to Story 2.2). All 10 patches applied: **H1** preserve `registered_date` for unchanged `(skill, agent, type)` triples → `--verify-only` CI gate no longer breaks at 00:00 UTC; **H2** CSV-aware line splitter in `readExistingCsv` handles embedded-newline quoted fields; **H3** self-reference filter + `.yaml`/`.yml` extension allowlist + `references/` exclusion → scan now returns 0 real cross-skill deps (prior `bmad-agent-builder → bmad-agent-tech-writer` was correctly identified as a doc example in `references/standard-fields.md` and filtered); **M3** CSV formula-injection mitigation (prepend `'` for `=+-@\t\r` leaders); **M4** dedup manual+auto rows for same `(skill, agent)` — manual wins; **M5** atomic write hardened with `crypto.randomBytes` + try/finally cleanup + best-effort fsync; **M6** marker comparison normalized via `.toLowerCase().trim()`; **M7** BOM/CRLF-resilient header detection; **M8** story Task checkboxes ticked; **L1** spec helper-name drift fixed (`_findSkillMdFiles` → `_findSkillDirectories`). Validation: `npm test` 1318/1318 pass (+17 regression guards); `npm run lint` clean; live scan 0.40s (AC10 budget 5s — 92% headroom); `--verify-only` exits 0. Round 2 mandatory per convergence rule (3 HIGH findings this round); patches were targeted + well-tested, expect clean convergence. | This file |
| 2026-04-23 | Round 2 code review complete. 9 findings: 1 decision + 2 patches + 3 defer + 3 dismissed. All 12 Round 1 items verified RESOLVED. **R2-D3:** switched M4 dedup from pair-key to triple-key — manual row wins only when `dependency_type` matches, scan can supplement with other-type rows. **R2-P1:** fixed CRLF-in-quoted-field regression (M7 × H2 interaction) by moving CRLF handling inside `_splitCsvLines` with `!inQuotes` guard. **R2-P2:** ticked all Round 1 patch checkboxes. Removed obsolete `_pairKey` helper. Regression tests added for both patches. Validation: `npm test` 1321/1321 pass (+20 cumulative); lint clean; live scan 0.23s. **Convergence reached at Round 2** — patches were non-structural (no new files, no renamed functions, no altered control flow); Round 3 not permitted per `code-review-convergence` rule. Status → `done`. Epic 2 now 1/4 stories complete. | This file |
