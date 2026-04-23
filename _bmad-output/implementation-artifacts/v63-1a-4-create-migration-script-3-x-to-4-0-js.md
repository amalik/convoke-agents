---
initiative: convoke
artifact_type: story
qualifier: v63-1a-4-create-migration-script-3-x-to-4-0-js
epic: v63-1a-epic
schema_version: 1
---

# Story 1A.4: Create migration script (3.x-to-4.0.js)

Status: done

**Inbound note from [Story lint-1.1](lint-1-1-fix-ci-lint-and-add-dod-gate.md) (2026-04-22, updated at lint-1.1 review-time):** At lint-1.1's baseline capture (2026-04-22 morning), this story's in-flight files contributed 5 lint errors (4 × `preserve-caught-error` + 1 × `no-control-regex`) in `scripts/update/migrations/3.3.x-to-4.0.0.js`, 2 × `no-unused-vars` warnings in `tests/unit/migration-3.3.x-to-4.0.0.test.js`, and 15 failing tests across the migration-chain / registry / convoke-update test suites. lint-1.1 scope-excluded all of these per [epic NFR4](../planning-artifacts/convoke-epic-lint-cleanup-dod-gate.md) as 1A.4 WIP territory.

**Status at lint-1.1 review (2026-04-22 afternoon):** this story's parallel implementation work resolved the above between lint-1.1's baseline and its verification. `npm run lint scripts/update/migrations/3.3.x-to-4.0.0.js tests/unit/migration-3.3.x-to-4.0.0.test.js` is now clean, and `npm test` passes 1258/1258 (the 15 baseline failures are all green). No forward-carry constraint from lint-1.1 remains.

**Going forward:** the new [`lint-passes-before-review` rule](../../project-context.md#rule-lint-passes-before-review) and the [amended dev-story DoD checklist](../../.claude/skills/bmad-dev-story/checklist.md) apply to any *future* changes this story makes before it reaches `review`. If additional lint debt is introduced, it must be cleared; if any of the 15 unit tests regress, they must be made green again.

Per `code-review-convergence`, this note is NOT a pre-review reopening of anything; it is a forward-carry record of a constraint that was already satisfied in parallel.

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

**Epic:** [Epic 1A — Seamless Config Migration](../planning-artifacts/convoke-epic-bmad-v6.3-adoption.md#epic-1a-seamless-config-migration)
**Sprint:** 2–3 (execution — this is the story that actually rewrites the 18 upstream-BMAD activation strings)
**FR coverage:** FR4 (no active `bmad-init` references post-migration), FR5 (auto-migration via `convoke-update`), FR6 (single-command upgrade), partial FR7 (idempotency — full coverage in Story 1A.5), partial FR8 (resume-safe — full coverage in 1A.5)
**NFR coverage:** NFR1 (update ≤60s), NFR9 (fail-soft doctor degradation), NFR20 (audit scripts in single directory), partial NFR6/NFR7/NFR8 (full coverage in 1A.5)
**Failure modes closed:** FM2-1 (template-based rewrite — NOT substring replacement), FM2-3 (convoke-doctor structured JSON diff before/after)
**Primary functional specs:**
- **[`convoke-spec-bmad-init-behavior-audit.md`](../planning-artifacts/convoke-spec-bmad-init-behavior-audit.md)** — canonical behaviors the migration must preserve
- **[`_bmad/_config/v6.3-migration-inventory.csv`](../../_bmad/_config/v6.3-migration-inventory.csv)** — Story 1A.3 deliverable; the sweep target list (18 canonical + 1 candidate)
- **[`scripts/update/lib/config-loader.js`](../../scripts/update/lib/config-loader.js)** — Story 1A.2 deliverable; the v4 load path that replaces `bmad-init`
**Namespace decision:** New migration module at `scripts/update/migrations/3.x-to-4.0.0.js` — parallels existing migrations (`2.0.x-to-3.1.0.js`, `3.0.x-to-3.1.0.js`, etc.). Registered in `scripts/update/migrations/registry.js`. Migration state file at `_bmad/_memory/migration-state-4.0.yaml` — lives under `_bmad/_memory/` alongside existing memory config. Neither is a `_bmad/bme/` skill; Covenant Compliance Checklist does NOT apply.

## Story

As an existing Convoke 3.x user running `convoke-update` to upgrade to 4.0,
I want the migration to automatically: detect my pre-v4 state, verify/create module configs, rewrite the 18 upstream-BMAD SKILL.md activation strings from `bmad-init`-based to v4 direct-load, mark `bmad-init` as deprecated, and validate via `convoke-doctor` that nothing obvious broke,
so that I get a working v4 install in one command with no manual steps and a clear signal if something regressed.

## Acceptance Criteria

**AC1 — Migration module contract (Pattern 7 compliance).**
**Given** existing Convoke migration conventions in `scripts/update/migrations/*.js`
**When** the new migration module is authored
**Then** it lives at `scripts/update/migrations/3.x-to-4.0.0.js` and exports exactly this shape:
```js
module.exports = {
  name: '3.x-to-4.0.0',
  fromVersion: '3.x',
  breaking: true,  // 4.0 is a breaking release per PRD
  description: 'v6.3 direct-load migration: rewrites 18 upstream-BMAD SKILL.md activation blocks from bmad-init invocation to v4 direct-YAML-load pattern. Marks bmad-init deprecated. Validates via convoke-doctor diff.',

  async preview(projectRoot) { /* returns { actions: string[] } describing what apply() will do */ },

  async apply(projectRoot) { /* runs the 5 phases; returns changes: string[] */ },
};
```
**And** the module is registered in [`registry.js`](../../scripts/update/migrations/registry.js) as an **append-only** addition (do NOT edit existing entries — Pattern 3 append-only rule).
**And** the registration sets `breaking: true` so `convoke-update`'s breaking-change prompt fires before execution.

**AC2 — Phase 1: Detect pre-v4 state.**
**Given** a 3.x Convoke install
**When** Phase 1 runs
**Then** it returns `{ isPreV4: true, currentVersion: <string>, reason: <string> }` when ANY of:
- `_bmad/core/bmad-init/` directory exists AND at least one SKILL.md in `_bmad/bmm/`, `_bmad/cis/`, `_bmad/wds/`, or `_bmad/tea/` matches the v6.3 migration inventory canonical pattern.
- `_bmad/_memory/migration-state-4.0.yaml` does NOT exist.
**And** returns `{ isPreV4: false }` when the v4 migration has already completed (state file exists with `phase5_complete: true`).
**And** Phase 1 is pure detection — no filesystem mutations.

**AC3 — Phase 2: Verify/create module configs (zero mutations to sweep target files).**
**Given** Phase 1 detected pre-v4 state
**When** Phase 2 runs
**Then** for each module appearing in the migration inventory (`bmm`, `cis`, `wds`, `tea`), verify `_bmad/{module}/config.yaml` exists; if any is missing, log a warning and skip that module from the Phase 3 sweep (fail-soft per NFR9).
**And** write `_bmad/_memory/migration-state-4.0.yaml` with:
```yaml
schema_version: 1
started_at: '<ISO timestamp>'
phase1_complete: true
phase2_complete: true
phase3_files_total: <N>
phase3_files_done: []
phase4_complete: false
phase5_complete: false
```
**And** Phase 2 does NOT touch any SKILL.md file.

**AC4 — Phase 3: SKILL.md sweep using template-based rewrite (FM2-1 mitigation).**
**Given** Phase 2 complete, inventory loaded from `_bmad/_config/v6.3-migration-inventory.csv` (Story 1A.3)
**And** only the `canonical` entries from the inventory (not `candidate`) are swept — candidates require human review per Story 1A.3 AC2.
**When** Phase 3 runs
**Then** for each canonical entry:
1. Read the SKILL.md file.
2. Locate the `## On Activation` section header.
3. Locate the `1. **Load config via bmad-init skill**` list item and identify its extent (up to the next top-level `2.` numbered item at the same indent level, or end-of-section).
4. **Replace the entire "step 1" block** (header line + all indented sub-bullets) with the v4 template below, parameterized by `{module}` from the inventory row:
```markdown
1. **Load config** — Read `{project-root}/_bmad/{module}/config.yaml` directly. Do NOT invoke the deprecated `bmad-init` skill.
   - If the config file is missing or unreadable, STOP and display: "Config error: `_bmad/{module}/config.yaml` could not be loaded. Run `convoke-install` to bootstrap."
   - Store all fields as session variables: `{user_name}`, `{communication_language}`, plus any module-specific vars.
   - VERIFY required fields (`user_name`, `communication_language`) are present; STOP with an error if any are missing.
```
5. Preserve everything before `## On Activation` and everything after the rewritten step 1 unchanged byte-for-byte (except final-newline normalization to LF).
6. Write the file back via `fs.writeFileSync(..., 'utf8')` with LF line endings.
7. Append the `file` path to `phase3_files_done` in the state file (checkpointed after each successful file).

**And** if step 3 fails to locate the target block (file doesn't match expected shape), log a warning to stderr and continue with remaining files — do NOT abort Phase 3 on one bad file (NFR9 fail-soft).
**And** the rewrite is **template-based**: constructed as a new string from the template constant + `{module}` substitution, then spliced into the file content. NOT `.replace()`-style substring surgery on the original file content.
**And** the final content preserves the file's original line-ending convention (sniff `\r\n` vs `\n` from the pre-migration file; if mixed, normalize to `\n`).

**AC5 — Phase 4: Mark `bmad-init` deprecated.**
**Given** Phase 3 complete
**When** Phase 4 runs
**Then** `_bmad/core/bmad-init/SKILL.md` is annotated with a deprecation banner inserted at the top of the file (AFTER frontmatter, BEFORE the first markdown body line):
```markdown
> ⚠️ **DEPRECATED in Convoke 4.0** — this skill is retained for one-version backwards-compat only. The config-loading path has moved to direct-YAML reads via `scripts/update/lib/config-loader.js`. `bmad-init` will be removed in Convoke 4.1. See [`convoke-spec-bmad-init-behavior-audit.md`](...) for the migration plan.
```
**And** if the banner already exists (detected via `> ⚠️ **DEPRECATED in Convoke 4.0**` substring match), Phase 4 is a no-op (idempotent).
**And** the state file's `phase4_complete` is set to `true`.

**AC6 — Phase 5: convoke-doctor diff validation (FM2-3 mitigation).**
**Given** Phase 4 complete
**When** Phase 5 runs
**Then** it executes `npx -p convoke-agents convoke-doctor --json` before the migration started (from a pre-migration snapshot captured in Phase 2) AND after (from a fresh run now), parses both outputs as JSON, and diffs the `findings` arrays.
**And** only NEW findings (present in after-run but not in before-run) are flagged to the operator with a summary line.
**And** Phase 5 is **fail-soft (NFR9)**: new findings are WARNINGS, not errors. The migration reports as successful; operator decides whether to investigate.
**And** the state file's `phase5_complete` is set to `true` and `new_doctor_findings: []` is populated.

**Note:** if the current `convoke-doctor` CLI doesn't support `--json`, the migration must fall back to text parsing (grep for `✗` / `✓` counts) and still produce a before/after diff. Story 1A.4 does NOT add a new `--json` flag to `convoke-doctor` — that's out of scope and lands in a separate story if needed.

**AC7 — Pattern 7 `preview()` returns actionable summary.**
**Given** `convoke-update --dry-run` invokes the migration's `preview()`
**When** `preview(projectRoot)` runs against a pre-v4 install
**Then** it returns an `actions` array describing:
- The number of SKILL.md files that will be rewritten (count from inventory canonical rows)
- The bmad-init deprecation banner addition
- The convoke-doctor validation step
- The state-file path
**And** `preview()` does NOT perform any filesystem mutations.

**AC8 — Tests.**
**Given** `node:test` + `tests/unit/migrations/` convention (existing migration tests live under `tests/unit/migrations/`)
**When** `tests/unit/migrations/3.x-to-4.0.0.test.js` is authored
**Then** the test matrix covers:
1. **Migration module contract** — `module.exports` has the 5 required properties (`name`, `fromVersion`, `breaking`, `preview`, `apply`); `name === '3.x-to-4.0.0'`, `fromVersion === '3.x'`, `breaking === true`.
2. **Phase 1 happy path** — fixture with a `_bmad/core/bmad-init/` dir and a bmm SKILL.md matching canonical pattern → `{ isPreV4: true }`.
3. **Phase 1 post-migration idempotency** — fixture with `_bmad/_memory/migration-state-4.0.yaml` containing `phase5_complete: true` → `{ isPreV4: false }`.
4. **Phase 2 state file creation** — after Phase 2, state file exists with expected schema.
5. **Phase 2 missing module config** — fixture missing `_bmad/bmm/config.yaml` → warning logged, bmm module SKIPPED from the sweep list, Phase 2 still completes.
6. **Phase 3 template-based rewrite correctness** — fixture SKILL.md containing the canonical step-1 block → after rewrite, file contains the v4 template with `{module}` substituted, and all other lines preserved byte-identical.
7. **Phase 3 mixed line endings** — fixture with CRLF → post-rewrite, file uses LF consistently.
8. **Phase 3 malformed file (no match)** — fixture SKILL.md missing the canonical block → warning logged, file unchanged, Phase 3 continues with other files.
9. **Phase 3 checkpointing** — after N files processed, state file's `phase3_files_done` contains exactly those N files.
10. **Phase 4 deprecation banner** — `_bmad/core/bmad-init/SKILL.md` fixture → banner inserted after frontmatter, before body.
11. **Phase 4 idempotency** — banner already present → Phase 4 is a no-op, file unchanged.
12. **Phase 5 doctor diff happy path** — mocked doctor output showing zero new findings → Phase 5 reports success.
13. **Phase 5 new findings detected** — mocked doctor output with one new finding → Phase 5 emits a warning summary but migration still succeeds.
14. **`preview()` correctness** — returns an `actions` array with expected counts and descriptions; does NOT mutate filesystem.

**And** all tests use tmpDir fixtures per `test-fixture-isolation`. Doctor output is MOCKED (not by spawning real convoke-doctor subprocesses) — use `child_process.execFileSync` mocking per `tests/mock-cp.js` pattern.

**AC9 — Integration via `convoke-update`.**
**Given** the migration is registered in `registry.js`
**When** a user on 3.x runs `npx -p convoke-agents convoke-update`
**Then** `registry.getMigrationsFor('3.2.0')` includes `3.x-to-4.0.0` in the chain.
**And** the breaking-change banner fires (because `breaking: true`).
**And** on user confirmation, `apply(projectRoot)` runs end-to-end.
**And** on successful completion, the migration is recorded in `config.yaml`'s `migration_history` so a re-run skips it (existing infrastructure per `migration-runner.js:hasMigrationBeenApplied`).

## Tasks / Subtasks

- [ ] **Task 1: Scaffold `3.x-to-4.0.0.js` migration module** (AC1)
  - [ ] 1.1 Create `scripts/update/migrations/3.x-to-4.0.0.js` with Pattern 1/7 structure: `'use strict'`, CommonJS, `module.exports = { name, fromVersion, breaking, description, preview, apply }`.
  - [ ] 1.2 Import dependencies: `fs-extra`, `path`, `js-yaml` (for state file), the Story 1A.2 loader (`scripts/update/lib/config-loader.js`) if needed for validation, `scripts/audit/audit-bmad-init-refs.js` (optional — or parse the CSV directly).
  - [ ] 1.3 Smoke test: `node -e "require('./scripts/update/migrations/3.x-to-4.0.0')"` loads cleanly.

- [ ] **Task 2: Implement Phase 1 — detect pre-v4 state** (AC2)
  - [ ] 2.1 Check existence of `_bmad/_memory/migration-state-4.0.yaml`; if present and `phase5_complete: true`, return `{ isPreV4: false }`.
  - [ ] 2.2 Check existence of `_bmad/core/bmad-init/` directory.
  - [ ] 2.3 Check presence of at least one canonical inventory entry's target file on disk (load inventory CSV, verify at least one of its `file` paths exists).
  - [ ] 2.4 Return `{ isPreV4: true|false, currentVersion, reason }`.

- [ ] **Task 3: Implement Phase 2 — verify/create module configs + write initial state** (AC3)
  - [ ] 3.1 Parse the inventory CSV into entries.
  - [ ] 3.2 For each unique `module` in the canonical entries, verify `_bmad/{module}/config.yaml` exists; if missing, log warning + exclude the module from the sweep set.
  - [ ] 3.3 Write `_bmad/_memory/migration-state-4.0.yaml` with initial schema (see AC3 example).
  - [ ] 3.4 Capture the pre-migration `convoke-doctor --json` snapshot (or text fallback) and store in the state file at `phase2_doctor_baseline` — reused by Phase 5 for the diff.

- [ ] **Task 4: Implement Phase 3 — SKILL.md sweep with template-based rewrite** (AC4)
  - [ ] 4.1 Define the v4 template as a module constant (see AC4 body). Use `{module}` as the substitution token.
  - [ ] 4.2 For each canonical inventory entry NOT in the skip set from Phase 2:
    - Read the file, sniff line endings, locate `## On Activation`, locate `1. **Load config via bmad-init skill**`, identify the block's end (next `^2\.` at same indent level, or end-of-section).
    - Construct the replacement via `V4_TEMPLATE.replace('{module}', entry.module)`.
    - Splice: `preBlock + v4Block + postBlock`.
    - Normalize to LF; write back via `fs.writeFileSync`.
    - Append `file` to `phase3_files_done`; persist state.
  - [ ] 4.3 If block location fails (no match), log warning to stderr, skip file, continue.
  - [ ] 4.4 After all files processed, set `phase3_complete: true` in state.

- [ ] **Task 5: Implement Phase 4 — deprecation banner on `_bmad/core/bmad-init/SKILL.md`** (AC5)
  - [ ] 5.1 Read the file; check for banner idempotency (substring match on `> ⚠️ **DEPRECATED in Convoke 4.0**`).
  - [ ] 5.2 If absent: parse frontmatter, insert banner after frontmatter close marker (`---\n`) + blank line.
  - [ ] 5.3 Write back with LF line endings; set `phase4_complete: true`.

- [ ] **Task 6: Implement Phase 5 — convoke-doctor diff** (AC6)
  - [ ] 6.1 Run `convoke-doctor` (subprocess: `execFileSync('npx', ['-p', 'convoke-agents', 'convoke-doctor', '--json'])`). If `--json` flag unsupported (stderr contains "unknown flag" OR exit-code indicates it), fall back to text parsing.
  - [ ] 6.2 Diff before/after. `diff = after.findings.filter(f => !before.findings.some(b => deepEqual(b, f)))`.
  - [ ] 6.3 If `diff.length === 0`: log `"Phase 5: convoke-doctor clean — no new findings"`.
  - [ ] 6.4 If `diff.length > 0`: log each new finding to stderr with `[WARNING]` prefix; persist to state as `new_doctor_findings`. **Do NOT throw** — fail-soft per NFR9.
  - [ ] 6.5 Set `phase5_complete: true`.

- [ ] **Task 7: Implement `preview()`** (AC7)
  - [ ] 7.1 Parse inventory CSV; count canonical entries.
  - [ ] 7.2 Return `{ actions: [...] }` with 4–5 descriptive strings summarizing what `apply()` will do. Zero mutations.

- [ ] **Task 8: Register in `registry.js`** (AC1, AC9)
  - [ ] 8.1 Edit [`scripts/update/migrations/registry.js`](../../scripts/update/migrations/registry.js): APPEND a new entry to `MIGRATIONS` array (between `3.0.x-to-3.1.0` and the future — do NOT edit existing entries):
    ```js
    {
      name: '3.x-to-4.0.0',
      fromVersion: '3.x',
      breaking: true,
      description: 'v6.3 direct-load migration — rewrites 18 upstream-BMAD SKILL.md activation blocks to direct-YAML-load. Marks bmad-init deprecated.',
      module: null
    }
    ```
  - [ ] 8.2 Verify `registry.getMigrationsFor('3.2.0')` returns a chain that includes the new entry (run `node -e "console.log(require('./scripts/update/migrations/registry').getMigrationsFor('3.2.0').map(m => m.name))"`).

- [ ] **Task 9: Author tests** (AC8)
  - [ ] 9.1 Scaffold `tests/unit/migrations/3.x-to-4.0.0.test.js` using `node:test` + `assert/strict` + `mockExecFileSync` helper from [`tests/mock-cp.js`](../../tests/mock-cp.js).
  - [ ] 9.2 Fixture helpers: `makeTmpPreV4Project(opts)` builds a mini `_bmad/` tree with `core/bmad-init/SKILL.md`, one `bmm/.../SKILL.md` with the canonical block, seeded `_bmad/{module}/config.yaml` files.
  - [ ] 9.3 Tests 1–14 per AC8 matrix. All use tmpDir fixtures.
  - [ ] 9.4 Doctor subprocess mocked via `mockExecFileSync` — set impl to return canned JSON strings for before/after snapshots.

- [ ] **Task 10: Run validation suite**
  - [ ] 10.1 `npm test` — full regression; new tests discovered via glob.
  - [ ] 10.2 `npx -p convoke-agents convoke-doctor` — confirm doctor unchanged (still has pre-existing 2 findings — this story doesn't touch those).
  - [ ] 10.3 Manual smoke: build a tmpDir pre-v4 fixture; run `apply(tmpDir)`; `git diff`-style inspect two rewritten SKILL.md files + the deprecation banner + the state file.

## Dev Notes

### Primary functional specs

Three inputs converge on this story:

1. **[Audit §Mechanical Enumeration Evidence + §Appendix](../planning-artifacts/convoke-spec-bmad-init-behavior-audit.md)** — what the migration preserves semantically (the load path stays the same; only the invocation mechanism changes).
2. **[Inventory CSV](../../_bmad/_config/v6.3-migration-inventory.csv)** — Story 1A.3 canonical 18 target files + 1 candidate (candidate is NOT swept — human review only).
3. **[config-loader.js](../../scripts/update/lib/config-loader.js)** — Story 1A.2 loader. The v4 activation template tells agents to load `_bmad/{module}/config.yaml` directly, matching the Convoke-bme convention the loader enforces.

The migration does NOT need to call `loadModuleConfig` itself during Phase 3 — the rewrite changes SKILL.md markdown so that agents (LLMs) will direct-load at activation time. The loader is for JS callers (migration-runner, validator, doctor).

### v4 activation template rationale

The audit §Appendix shows Convoke's own bme agents use an XML-style activation with `<activation>` / `<step>` tags. Upstream BMAD agents use plain-markdown numbered lists. The migration preserves plain-markdown style (matching each file's original style) so the rewrite is minimal-surface-area. A future initiative could unify the two styles, but that's out of scope for 4.0.

The template MUST:
- Say "Read `{project-root}/_bmad/{module}/config.yaml`" — this signals direct-load to the LLM.
- Include error handling ("If config missing, STOP and display").
- Store `{user_name}`, `{communication_language}` as session vars (existing agent contract).

### Phase 3 template-based rewrite — the critical detail (FM2-1)

**Do NOT** use `content.replace('1. **Load config via bmad-init skill**', v4Block)`. This is substring replacement and is fragile:
- Varying whitespace breaks the match
- The original step 1 has an EM-DASH followed by explanatory text and sub-bullets — substring replace only catches the first line
- Multi-line replacement with regex risks greedy matches

**Instead**: parse the file line-by-line, identify the `## On Activation` section, find the `^1\. \*\*Load config via bmad-init skill\*\*` line, scan forward until the next `^2\.` at the same indent level (or `^##` section end, or EOF), build `[preLines, ...newBlockLines, ...postLines]`, and write `lines.join(lineEnding)`.

Reference pattern from a future-implementer perspective:

```js
function rewriteActivation(content, module, template) {
  const lineEnding = content.includes('\r\n') ? '\r\n' : '\n';
  const lines = content.split(/\r?\n/);
  const activationIdx = lines.findIndex(l => /^##\s+On Activation/.test(l));
  if (activationIdx === -1) return { rewritten: false, reason: 'no On Activation section' };

  const step1Idx = lines.findIndex((l, i) => i > activationIdx && /^1\.\s+\*\*Load config via bmad-init skill\*\*/.test(l));
  if (step1Idx === -1) return { rewritten: false, reason: 'no step-1 bmad-init line' };

  // Scan forward for end of block: next "2." at column 0, or "##" section start, or EOF.
  let endIdx = lines.length;
  for (let i = step1Idx + 1; i < lines.length; i++) {
    if (/^2\.\s/.test(lines[i]) || /^##\s/.test(lines[i])) { endIdx = i; break; }
  }

  const newBlock = template.replace(/\{module\}/g, module).split('\n');
  const result = [...lines.slice(0, step1Idx), ...newBlock, ...lines.slice(endIdx)];
  return { rewritten: true, content: result.join(lineEnding) };
}
```

### Idempotency / resume / lockfile — DEFERRED to Story 1A.5

This story ships the **happy-path** migration. Story 1A.5 adds:
- **Idempotency** — `convoke-update` re-run on a migrated project has zero filesystem changes.
- **Resume** — interrupted Phase 3 picks up from `phase3_files_done` in state.
- **Lockfile** — concurrent `convoke-update` invocations detect + refuse.
- **Offline-safe** — migration completes without network.

For 1A.4, the state file's `phase3_files_done` tracking IS sufficient for basic resume (re-running skips already-done files). But exhaustive robustness testing lives in 1A.5.

### State file schema (`_bmad/_memory/migration-state-4.0.yaml`)

```yaml
schema_version: 1
started_at: '2026-04-21T10:00:00Z'
completed_at: null  # set when phase5 completes
phase1_complete: true
phase2_complete: true
phase2_doctor_baseline:  # captured in Phase 2 for Phase 5 diff
  findings: [...]        # raw doctor JSON (or text-parsed equivalent)
phase3_files_total: 18
phase3_files_done:
  - _bmad/bmm/1-analysis/bmad-agent-analyst/SKILL.md
  - _bmad/bmm/1-analysis/bmad-agent-tech-writer/SKILL.md
  # ...
phase3_files_skipped:
  - { file: '_bmad/foo/SKILL.md', reason: 'no On Activation section' }
phase4_complete: true
phase5_complete: true
new_doctor_findings: []  # populated by Phase 5
```

### Integration with existing `migration-runner.js`

The migration-runner provides: backup before run, lock acquisition, per-migration invocation via `migration.module.apply(projectRoot)`, post-migration `refreshInstallation` + recording in `migration_history`. This story's module plugs into that infrastructure — DO NOT reimplement any of it.

In particular:
- Backup is handled upstream — do not add backup logic in the migration itself.
- Lock is handled upstream (via `migration-runner:acquireMigrationLock`) — Story 1A.5 may extend this for 4.0-specific concerns, but not here.
- `migration_history` recording is handled by migration-runner after `apply()` returns cleanly.

### project-context.md anchor rules

- `no-hardcoded-versions` — migration does read version strings (for state file header, etc.); use `getPackageVersion()` from utils, never hardcoded literals.
- `no-process-cwd-in-libs` — `apply(projectRoot)` takes projectRoot; migration-runner passes it; never call `process.cwd()`.
- `derive-counts-from-source` — file counts come from the inventory CSV, not hardcoded "18".
- `test-fixture-isolation` — all tests use tmpDir; no tests touch the live repo tree.
- `mechanical-research-enumeration` — inventory CSV IS the enumeration (Story 1A.3's output); migration consumes it verbatim.
- `spec-verify-referenced-files` — before running Phase 3, assert the inventory CSV exists and parses; abort with actionable error if not.

### Previous story learnings (Stories 1A.1 / 1A.2 / 1A.3)

1. **Audit is authoritative** — don't re-enumerate sweep targets. Consume the CSV.
2. **Code review catches real bugs** — 1A.2 Round 1 caught HIGH path traversal; 1A.2 Round 2 caught HIGH `/` → cwd regression introduced by Round 1's own fix. Expect Phase 3 rewrite logic to be a Round 1 HIGH magnet.
3. **LOC-drift is a recurring bug** — Story 1A.2 and 1A.3 both needed patches to update File List LOC claims post-review. Write LOC from actual `wc -l` after Round 1 hardening, not the initial-draft estimate.
4. **Tests MUST mock subprocess calls** — `mockExecFileSync` pattern is the project standard; use it for the doctor invocation.
5. **Determinism matters** — tests that assert file content must normalize line endings; fixture must write the expected EOL convention.

### Project Structure Notes

- **New file:** `scripts/update/migrations/3.x-to-4.0.0.js` — projected ~250–350 LOC (5 phases + preview + helpers). Similar scale to `1.5.x-to-1.6.0.js`.
- **New file:** `tests/unit/migrations/3.x-to-4.0.0.test.js` — projected 14 tests per AC8.
- **Modified:** `scripts/update/migrations/registry.js` — single APPEND of a new MIGRATIONS entry.
- **Runtime state file (not committed):** `_bmad/_memory/migration-state-4.0.yaml` — created at migration runtime in the user's project; `.gitignore` rule likely already excludes `_bmad/_memory/*.yaml` (verify in Task 1).
- **No changes to:** any `_bmad/bmm/*`, `_bmad/cis/*`, `_bmad/wds/*`, `_bmad/tea/*` source files during story development (those are the migration's *runtime* targets, not build-time edits). The migration is authored to rewrite those files when a 3.x user runs `convoke-update`.

### Why `convoke-doctor` isn't called as a library import

`convoke-doctor` is a CLI entry (`scripts/convoke-doctor.js`). The migration runs it as a subprocess via `execFileSync`. Reasons:
1. The doctor has its own process boundary (exit codes + stderr) that cleanly composes with the migration's error handling.
2. The migration doesn't need the doctor's internals — just before/after findings.
3. Importing the doctor as a library would create a circular dep (doctor might use config-loader, loader is used by … etc.).

### Testing standards

- Framework: `node:test` + `node:assert/strict`.
- Location: `tests/unit/migrations/3.x-to-4.0.0.test.js` (parallels `tests/unit/migrations/1.5.x-to-1.6.0.test.js` if it exists — check; else `tests/lib/migration-*.test.js`).
- Fixtures: `os.tmpdir()` + `fs.mkdtempSync`; mini `_bmad/` tree per test. Cleanup in `afterEach`.
- Mocking: `mockExecFileSync` for doctor subprocess. DO NOT spawn real convoke-doctor in tests.
- Assertion style: content-comparison (read file back, assert expected shape); state-file assertions on YAML structure.

### References

- **Primary functional spec:** [`convoke-spec-bmad-init-behavior-audit.md`](../planning-artifacts/convoke-spec-bmad-init-behavior-audit.md)
- **Inventory (sweep targets):** [`_bmad/_config/v6.3-migration-inventory.csv`](../../_bmad/_config/v6.3-migration-inventory.csv)
- **Loader (the thing agents now read after migration):** [`scripts/update/lib/config-loader.js`](../../scripts/update/lib/config-loader.js)
- **Parent epic §Story 1A.4:** [`convoke-epic-bmad-v6.3-adoption.md`](../planning-artifacts/convoke-epic-bmad-v6.3-adoption.md#story-1a4-create-migration-script-3x-to-40js)
- **Architecture doc:** [`convoke-arch-bmad-v6.3-adoption.md`](../planning-artifacts/convoke-arch-bmad-v6.3-adoption.md) §Decision 1 (loader), §Pattern 6 (v4 activation), §Pattern 7 (migration contract), §FM2-1 (template-based rewrite), §FM2-3 (doctor diff).
- **Existing migration reference shape:** [`scripts/update/migrations/3.0.x-to-3.1.0.js`](../../scripts/update/migrations/3.0.x-to-3.1.0.js)
- **Registry:** [`scripts/update/migrations/registry.js`](../../scripts/update/migrations/registry.js)
- **Migration runner (plug-in target):** [`scripts/update/lib/migration-runner.js`](../../scripts/update/lib/migration-runner.js)
- **Subprocess mock helper:** [`tests/mock-cp.js`](../../tests/mock-cp.js)
- **project-context.md:** anchor rules cited above.

## Dev Agent Record

### Agent Model Used

claude-opus-4-7 (executing `/bmad-dev-story` workflow)

### Debug Log References

- **Migration name convention decision:** spec said `fromVersion: '3.x'` but registry's `matchesVersionRange` only recognizes `{major}.{minor}.x` patterns (verified via reading [`registry.js:213-228`](../../scripts/update/migrations/registry.js#L213-L228)). Using `3.3.x-to-4.0.0` (current package is 3.3.0). Users on 3.0/3.1/3.2 would need parallel entry points or the chain to cascade through intermediate migrations — neither currently exists, so this migration only reaches 3.3.x users. Documented as a known limitation; future sprint can add parallel entries `3.0.x-to-4.0.0`, `3.1.x-to-4.0.0`, `3.2.x-to-4.0.0` if telemetry suggests users stuck on those versions. Filename + registry name match per lazy-load convention.
- **Test location:** existing convention is `tests/unit/migration-*.test.js` (flat), not `tests/unit/migrations/` — used the existing convention.
- **Test count grew 14 → 19:** initial matrix had 14 cases; broader coverage shipped with bonus cases for `_rewriteActivation` edge cases (no activation section, no canonical step-1) and `preview` missing-inventory graceful path.
- **`convoke-doctor --json` not supported:** parsed text output directly (`_parseDoctorOutput` looks for lines starting with `✗`). If a future story adds `--json` to convoke-doctor, this parser can be swapped for `JSON.parse`.
- **Chain traversal verified:** `registry.getMigrationsFor('3.3.0')` returns `['3.3.x-to-4.0.0']` ✓; `registry.getMigrationsFor('3.3.5')` also returns `['3.3.x-to-4.0.0']` ✓; users below 3.3.x do not chain-reach 4.0.0 per the limitation above.

### Completion Notes List

- **AC1 (Pattern 7 contract)** — satisfied. `module.exports` shape: `{name, fromVersion, breaking, description, preview, apply}` + `_internal` testing hooks.
- **AC2 (Phase 1 detect)** — tri-branch detection: state-file-marks-complete → false; bmad-init-dir-or-canonical-target-on-disk → true; otherwise false. 3 tests cover all branches.
- **AC3 (Phase 2 configs + state)** — state file written with full schema including `phase2_doctor_baseline` (captured for Phase 5 diff). Missing module configs warned + module excluded from sweep. 2 tests cover the happy path + fail-soft branch.
- **AC4 (Phase 3 template-based rewrite)** — `_rewriteActivation` uses line-index splice (NOT substring replace): find `## On Activation` header → find step-1 `1. **Load config via bmad-init skill**` → scan forward for next `^\d+\.` or `^##` or EOF → splice v4 template with `{module}` substitution. 5 tests cover happy path, byte-identical preservation of pre-section content, CRLF handling, missing section, non-canonical step-1.
- **AC5 (Phase 4 deprecation banner)** — banner inserted after frontmatter; idempotent when already present (substring match on banner prefix). 2 tests cover both branches.
- **AC6 (Phase 5 doctor diff)** — text parsing of `✗` lines (JSON flag not available in current `convoke-doctor`); `_findingKey = "name::message"` deduplicates findings across runs. Fail-soft: emits warnings to stderr, state still completes. 2 tests cover zero-new-findings + one-new-finding-WARNING branches.
- **AC7 (preview)** — returns actions array with 4 items; no filesystem mutations (verified via snapshot comparison in test). 2 tests cover typical + missing-inventory branches.
- **AC8 (tests)** — shipped 19 tests across 7 suites. All use tmpDir fixtures per `test-fixture-isolation` rule. Doctor subprocess mocked via `mockExecFileSync` — no real convoke-doctor invocations during test runs.
- **AC9 (integration)** — registry entry added (append-only at [`registry.js:85-91`](../../scripts/update/migrations/registry.js#L85-L91)). `breaking: true` so `convoke-update`'s breaking-change prompt fires. `getMigrationsFor('3.3.0')` includes the new entry. Existing `migration-runner.js` picks up the entry automatically — no changes to runner.

**Scope discipline:** No mutations to any `_bmad/bmm/*`, `_bmad/cis/*`, `_bmad/wds/*`, or `_bmad/tea/*` source files during story development. Those are the migration's *runtime* targets, not build-time edits. The migration runs against a user's install via `convoke-update`. No changes to package.json, no new deps. No changes to `migration-runner.js`, `config-loader.js`, or the inventory CSV.

**Explicit deferrals to Story 1A.5:**
- Idempotency (re-running `convoke-update` on already-migrated project yields zero filesystem changes)
- Full resume robustness (interrupted Phase 3 picks up from state correctly — basic `phase3_files_done` checkpoint IS present here, but exhaustive testing + edge cases land in 1A.5)
- Lockfile for concurrent `convoke-update` invocations
- Offline-safe verification

### File List

_New files:_
- [`scripts/update/migrations/3.3.x-to-4.0.0.js`](../../scripts/update/migrations/3.3.x-to-4.0.0.js) — 513 LOC. Public: 5 migration-contract properties (`name`, `fromVersion`, `breaking`, `description`, `preview`, `apply`). `_internal` export for test access: `_phase1_detect`, `_phase2_verifyConfigs`, `_phase3_sweepSkillMd`, `_phase4_deprecateBmadInit`, `_phase5_doctorDiff`, `_rewriteActivation`, `_insertBannerAfterFrontmatter`, `_parseInventoryCsv`, `_parseDoctorOutput`, plus template/banner/state-path constants.
- [`tests/unit/migration-3.3.x-to-4.0.0.test.js`](../../tests/unit/migration-3.3.x-to-4.0.0.test.js) — 508 LOC. 19 tests across 7 suites (contract + Phase 1 × 3 + `_rewriteActivation` × 5 + Phase 2/3 integration × 4 + Phase 4 × 2 + Phase 5 × 2 + preview × 2). Uses `mockExecFileSync` for doctor subprocess.

_Modified files:_
- [`scripts/update/migrations/registry.js`](../../scripts/update/migrations/registry.js) — single APPEND entry after the `3.0.x-to-3.1.0` row. No edits to existing entries (append-only rule honored).
- [`_bmad-output/implementation-artifacts/sprint-status.yaml`](sprint-status.yaml) — status transitions: `ready-for-dev → in-progress → review`.

_Deleted files:_
- None.

### Change Log

| Date | Change | Reference |
|------|--------|-----------|
| 2026-04-21 | Story created per `/bmad-create-story v63-1a-4-...` invocation. Primary inputs: Story 1A.1 audit + Story 1A.3 inventory CSV + Story 1A.2 loader. Depends on registry.js (append-only) and migration-runner.js (plug-in). | [sprint-status.yaml](sprint-status.yaml) |
| 2026-04-22 | Implementation: 10 tasks complete. Shipped `scripts/update/migrations/3.3.x-to-4.0.0.js` (513 LOC, 5-phase migration) + `tests/unit/migration-3.3.x-to-4.0.0.test.js` (19 tests across 7 suites) + registry.js APPEND entry. Full suite 1256/1256 pass; convoke-doctor unchanged (2 pre-existing findings carried forward from 1A.1 baseline). Migration name set to `3.3.x-to-4.0.0` (not spec's `3.x` — registry pattern constraint; known-limitation noted for 3.0/3.1/3.2 users). Status → `review`. | This file |
| 2026-04-22 | Round 1 code review (3 parallel subagent reviewers: Blind Hunter, Edge Case Hunter, Acceptance Auditor). Auditor verified all 9 ACs. Blind + Edge surfaced 23 findings (6 HIGH / 8 MED / 6 LOW / 3 NIT). Triage: 2 decision-needed resolved (D1 keep-strict regex with drift-protection noted; D2 add 3 parallel registry entries for 3.0/3.1/3.2 users); 15 patches batch-applied; 3 deferred; 2 dismissed. Code patches: atomic state writes (tmpfile+rename), dominant-EOL detection, fenced-code-block tracking in Phase 3 end-of-block scan, ANSI strip in doctor parser, `_findingKey` name-only (drops volatile message), path-traversal guard in Phase 3, CSV column-count validation, `_runDoctor` fail-loud on ENOENT/SIGTERM/MAXBUFFER, banner HTML-comment sentinel for idempotency, dedupe blank line after frontmatter, explicit NO_COLOR/FORCE_COLOR env for doctor, YAML lineWidth:-1, preview() short-circuit when phase5_complete, Phase 3 write-failure try/catch. Test patches: ANSI-colored doctor output test, updated banner-idempotency fixture to include HTML sentinel, preview short-circuit tests. D2 parallel entries: created `3.0.x-to-4.0.0.js`, `3.1.x-to-4.0.0.js`, `3.2.x-to-4.0.0.js` (thin wrappers re-exporting base module), extending chain coverage to all 3.x users. Pre-existing registry + orchestration tests updated to reflect extended migration chain (Story 1A.4 adds tail entry to every chain from 1.x/2.x/3.x). Full suite 1258/1258 pass; convoke-doctor unchanged. Per convergence rule, Round 2 allowed by Round 1 HIGH findings — user decision on whether to trigger. Status → `done`. | Review Findings below |

### Review Findings (Round 1, 2026-04-22)

Round 1 code review (Blind Hunter + Edge Case Hunter + Acceptance Auditor via parallel subagent launch). Acceptance Auditor verdict: **all 9 ACs + 6 anchor rules verified clean.** Blind + Edge independently surfaced 23 defensive-hardening findings; most recurring themes: regex rigidity, doctor subprocess fragility, non-atomic state writes.

**Decisions resolved (2):**

- [x] [Review][Decision] **D1 regex rigidity (H1 + H2)** → resolved: keep strict canonical-pattern regex; add fence-block tracking defensively (H2). Inventory CSV built with the same strict regex by Story 1A.3 — in-repo files MUST match (verified via `--verify-only`). Upstream drift caught by regenerating the inventory before Story 1A.4 runs; documented for Story 1A.5 / future robustness work.
- [x] [Review][Decision] **D2 module-name chain gap (H5)** → resolved: shipped 3 parallel registry entries (`3.0.x-to-4.0.0`, `3.1.x-to-4.0.0`, `3.2.x-to-4.0.0`) via thin wrappers re-exporting the 3.3.x-to-4.0.0 module. Closes shipping defect — 3.0.0 users now chain via existing `3.0.x-to-3.1.0` → `3.1.x-to-4.0.0`; 3.1.0/3.2.0 users get dedicated entries. Chain coverage verified: all 3.0–3.3 users reach 4.0.0. Cross-test impact: 7 pre-existing tests in `registry.test.js` + 2 in `migration-runner-orchestration.test.js` updated to reflect extended chain.

**Patches applied (15):**

- [x] [Review][Patch] [HIGH H3] Atomic state writes via tmpfile + rename; crash-mid-write no longer produces torn YAML
- [x] [Review][Patch] [HIGH H4] `_runDoctor` fail-loud on ENOENT / SIGTERM / ERR_CHILD_PROCESS_STDIO_MAXBUFFER; silent-false-clean baseline eliminated
- [x] [Review][Patch] [HIGH H6] Dominant-EOL detection: counts CRLF vs LF, picks majority (was: any single `\r\n` flipped all line endings)
- [x] [Review][Patch] [HIGH H2] Fence-block (\`\`\`) tracking in Phase 3 end-of-block scan — numbered lines inside code fences no longer terminate the rewrite block prematurely
- [x] [Review][Patch] [MED M1] ANSI escape codes stripped before `_parseDoctorOutput` regex; doctor findings no longer missed when subprocess emits colored output
- [x] [Review][Patch] [MED M2] Path-traversal guard in Phase 3 sweep: `resolvedAbsPath.startsWith(resolvedRoot + path.sep)` rejects `..`-containing inventory entries
- [x] [Review][Patch] [MED M3] `_findingKey` now uses `name` only; volatile message data (file paths, counts) no longer produces spurious "NEW" findings
- [x] [Review][Patch] [MED M4] CSV parser validates required columns (`file`, `module`, `candidate_status`) + warns on row-level column drift
- [x] [Review][Patch] [MED M5] `preview()` short-circuits via `_phase1_detect` when `projectRoot` passed + state marks phase5_complete; runner's zero-arg path unaffected (backwards-compat with existing contract)
- [x] [Review][Patch] [MED M8] Phase 3 `fs.writeFileSync` wrapped in try/catch; EACCES/ENOSPC mid-sweep surfaces as per-file skip, not abort
- [x] [Review][Patch] [LOW L1] Banner idempotency uses HTML-comment sentinel (`<!-- convoke:deprecation-banner:bmad-init -->`) — survives banner wording changes
- [x] [Review][Patch] [LOW L3] `yaml.dump` uses `lineWidth: -1` (no wrap); long finding messages don't fold inside quoted scalars
- [x] [Review][Patch] [LOW] Explicit `NO_COLOR=1` / `FORCE_COLOR=0` in doctor subprocess env (preemptively suppresses ANSI before parser fallback)
- [x] [Review][Patch] [NIT N1] Dedupe blank-line-after-frontmatter in `_insertBannerAfterFrontmatter` — no more `---\n\n\n> banner`
- [x] [Review][Patch] [test] ANSI-colored doctor output test added; simulates chalk-styled `\x1b[31m✗[0m` and verifies stripping works end-to-end

**Deferred (3):**

- [x] [Review][Defer] **H1 regex rigidity (case-insensitive / tolerant wording)** — inventory CSV regeneration + `--verify-only` drift check protects against upstream rename; full tolerance is a future hardening story.
- [x] [Review][Defer] **L4 Phase 2 baseline double-capture guard** — defensive assertion for hypothetical future refactor; not currently reachable.
- [x] [Review][Defer] **L6 registry/filename/module-export triple-sync integrity test** — add a module-load-time assertion in a future registry-housekeeping story; not blocking 1A.4.

**Dismissed (2):**

- Auditor LOW: EOL preservation stricter than spec AC4 — stricter/better behavior, documented as intentional.
- Auditor LOW: `_runDoctor` skips `--json` attempt — current `convoke-doctor` has no `--json` flag; try-then-fallback would be dead branch, documented at AC6 note.

**Convergence note:** Round 1 had 6 HIGH findings. Per `code-review-convergence` rule, Round 2 is allowed. Round 2 would re-review the 15 applied patches for regressions (similar to Story 1A.2 Round 2 catching the `projectRoot='/'` regression introduced by Round 1's own trailing-slash fix). Applying patches introduced structural changes (new helpers: `_previewActionsWithCount`, `_detectDominantEol`; new files: 3 parallel migration wrappers; new tests). Recommend running Round 2 to verify — but user's call.

### Post-review note (2026-04-23) — mig-test-1.1 cross-reference

Story `mig-test-1-1-replace-upgrade-test-count-assertions` ships forward-going remediation for 3 integration-test assertions in [tests/integration/upgrade.test.js](../../tests/integration/upgrade.test.js) that rotted when this story (1A.4) shipped its correct chain-extension: the primary `3.3.x-to-4.0.0` entry + three parallel wrappers (`3.0.x/3.1.x/3.2.x-to-4.0.0`). The registry append itself was correct — only the test-side count assertions were stale. The `code-review-convergence` rule is **upheld**: 1A.4 remains at its current convergence state, and mig-test-1.1 is NOT a Round 3 reopening of 1A.4 — same pattern lint-1.1 established for 1A.2's post-review lint regression. See [mig-test-1-1 story](mig-test-1-1-replace-upgrade-test-count-assertions.md) and [mig-test-epic-1](../planning-artifacts/convoke-epic-migration-test-identity-assertions.md) for the governing-rule citation (`derive-counts-from-source`) and the identity-assertion fix detail.
