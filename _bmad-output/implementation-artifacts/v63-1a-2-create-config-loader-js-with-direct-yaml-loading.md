---
initiative: convoke
artifact_type: story
qualifier: v63-1a-2-create-config-loader-js-with-direct-yaml-loading
epic: v63-1a-epic
schema_version: 1
---

# Story 1A.2: Create config-loader.js with direct-YAML loading

Status: done

**Post-review note (2026-04-22):** CI run #714 (2026-04-21) surfaced 8 `preserve-caught-error` ESLint errors in `scripts/update/lib/config-loader.js` at lines 122, 127, 132, 269, 274, 282, 289, 299 — all from this story's Round 2 output. Both review rounds gated on `npm test` only, not `npm run lint`, so the lint regression slipped past. Per the [`code-review-convergence` rule](../../project-context.md#rule-code-review-convergence), this story **remains converged at Round 2 and is NOT reopened for a Round 3**. The remediation ships as a forward-going follow-up: [Story lint-1.1](lint-1-1-fix-ci-lint-and-add-dod-gate.md) adds `{ cause: err }` to all 8 sites, adds `npm run lint` as a mandatory DoD gate in two layers (project-context.md rule + dev-story checklist amendment), and closes the class of miss. See [lint-epic-1](../planning-artifacts/convoke-epic-lint-cleanup-dod-gate.md) for epic-level context.

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

**Epic:** [Epic 1A — Seamless Config Migration](../planning-artifacts/convoke-epic-bmad-v6.3-adoption.md#epic-1a-seamless-config-migration)
**Sprint:** 1 (foundation — unblocks Story 1A.4 migration script)
**FR coverage:** FR1 (agents direct-load from `_bmad/{module}/config.yaml`), FR2 (loader utility replaces `bmad-init`), partial FR3 (v6.3 activation pattern), partial FR4 (no active `bmad-init` references — full closure lands in 1A.4)
**NFR coverage:** NFR2 (loader ≤50ms overhead), NFR9 (fail-soft — deprecation warning only, not hard block), NFR11 (integration — v6.3 direct-load convention), NFR26–29 (backwards-compat one-version window with deprecation warning)
**Failure modes closed:** FM1-1 (nested module paths like `bme/_vortex`), FM1-3 (malformed YAML → actionable error). FM1-2 (undocumented bmad-init behaviors) already closed by [Story 1A.1](v63-1a-1-audit-bmad-init-behavior-before-replacement.md). FM6-1 (API freeze) satisfied when this story's tests pass.
**Primary functional spec:** **[`convoke-spec-bmad-init-behavior-audit.md`](../planning-artifacts/convoke-spec-bmad-init-behavior-audit.md)** (Story 1A.1 deliverable — this is the definitive specification of loader behavior. AC5 carry-forward from 1A.1 satisfied by this Dev Notes citation.)
**Namespace decision:** New JS module at `scripts/update/lib/config-loader.js` — lives under Convoke's owned `scripts/update/lib/` namespace, not under `_bmad/`. This is platform infrastructure (part of the npm-installed CLI), not content. The loader itself is Convoke-owned forever; it has no BMAD upstream counterpart because BMAD v6.3's activation pattern has the LLM read the YAML directly — there is no separate loader utility in upstream BMAD. The Covenant Compliance Checklist does NOT apply — this is not a `_bmad/bme/` skill; it's CLI library code.

## Story

As a Convoke agent (or JS caller in the update/install/doctor flow),
I want to load a module's config from `_bmad/{module}/config.yaml` directly, with deprecation-aware backwards compatibility for pre-4.0 `bmad-init` installs,
so that the v6.3 direct-load pattern replaces the `bmad-init` skill invocation without breaking existing 3.x users during the 4.0 → 4.1 compatibility window.

## Acceptance Criteria

**AC1 — Public API matches architecture Decision 1 contract exactly.**
**Given** Convoke's existing architecture Decision 1 ([convoke-arch-bmad-v6.3-adoption.md §Decision 1](../planning-artifacts/convoke-arch-bmad-v6.3-adoption.md#decision-1-config-loading-architecture-wr1--wr8))
**When** `scripts/update/lib/config-loader.js` is implemented
**Then** it exports exactly one public function with this signature:
```js
/**
 * @param {string} projectRoot - Absolute path to the Convoke project root (e.g., from findProjectRoot()).
 * @param {string} moduleConfigPath - Module subdirectory under `_bmad/` (e.g., 'bme/_vortex', 'core', 'bme/_enhance').
 *   Despite the parameter name, this is a directory, not a file path.
 *   (Name retained from architecture Decision 1 API contract; see audit §4 for discussion.)
 * @returns {object} Plain JS object with keys from the YAML config, with {project-root} placeholder resolved.
 * @throws {Error} If config file is missing (and no bmad-init fallback available), malformed, or not a YAML object.
 */
function loadModuleConfig(projectRoot, moduleConfigPath) { /* ... */ }
module.exports = { loadModuleConfig };
```
**And** no other public functions are exported (internal helpers prefixed `_`, kept out of `module.exports` except for tests that use `__test__` escape hatch if required).

**AC2 — Load-path behavior matches audit's 9 `reproduce-in-loader` dispositions (B4.1, B4.2, B4.3, B4.4, B5.1, B5.2, B5.3, B8.3, B8.4).**
**Given** a project at `projectRoot` with `_bmad/{moduleConfigPath}/config.yaml` present
**When** `loadModuleConfig(projectRoot, moduleConfigPath)` is called
**Then** the function:
1. Constructs the path via `path.join(projectRoot, '_bmad', moduleConfigPath, 'config.yaml')` (B4.3)
2. Reads the file using `fs.readFileSync(..., 'utf8')` (B4.1 modified — no silent failure)
3. Parses via `yaml.parseDocument(raw)` using the `yaml` package (NOT `js-yaml`), checks `doc.errors` (throw) and `doc.warnings` (console.warn), then `doc.toJSON()` (Pattern 3 compliance)
4. Validates result is a non-null non-array plain object (B4.2) — throws actionable error otherwise
5. Returns the full parsed object unchanged except for `{project-root}` placeholder resolution (B8.4) applied via `_resolveProjectRootPlaceholder(config, projectRoot)`

**AC3 — `{project-root}` placeholder resolution (B5.1–B5.3).**
**Given** a loaded config containing string values with `{project-root}` substrings
**When** `_resolveProjectRootPlaceholder(config, projectRoot)` runs
**Then** every top-level string value containing `{project-root}` is replaced with `projectRoot` via `String.prototype.replaceAll` (safe — Node ≥18 per `package.json` engines field)
**And** non-string top-level values (numbers, booleans, arrays, nested objects) pass through unchanged (B5.1 type guard)
**And** the function does NOT recurse into nested objects/arrays — out of scope for 4.0 per audit §5 (if a future caller needs nested placeholder support, add recursion as a separate change)
**And** `{user}` and other non-`{project-root}` placeholders are **NOT** resolved (per audit §5 explicit decision — this is a Convoke-bme activation convention handled by callers, not the loader)
**And** the function MUST NOT mutate the input; it returns either the same object (if no placeholders to resolve) or a modified object suitable for caller consumption — **implementer's choice between mutate-in-place vs clone; document in JSDoc either way** (audit listed this as a Story 1A.2 design question, deferred from Round 1).

**AC4 — Missing-config throws actionable error (B8.3 modified).**
**Given** the config file does NOT exist at the expected path
**And** no `_bmad/core/bmad-init/` directory exists at `projectRoot` (no backwards-compat fallback available)
**When** `loadModuleConfig(...)` is called
**Then** an `Error` is thrown with a message containing:
- The full path that was checked (so the operator knows what's missing)
- An actionable next step (e.g., `"Run 'convoke-install' to bootstrap"`)
**And** the error is thrown, not returned — library modules follow Pattern 4 (throw, never `process.exit()`, never return `null`).

**AC5 — Backwards-compat fallback for pre-4.0 installs (WR8 — the only `add-in-loader` behavior).**
**Given** the v4 config file at `_bmad/{moduleConfigPath}/config.yaml` does NOT exist
**And** the legacy `_bmad/core/bmad-init/` directory DOES exist at `projectRoot`
**When** `loadModuleConfig(...)` is called
**Then** a deprecation warning is emitted to stderr via `console.warn` containing:
- `"[DEPRECATED]"` prefix
- Mention of `bmad-init` being detected
- Instructions to run `convoke-update`
- Note that support is removed in Convoke 4.1
**And** `_loadLegacyConfig(projectRoot, moduleConfigPath)` is invoked (internal helper) which:
1. Shells out via `child_process.execFileSync('python3', ['{...}/bmad_init.py', 'load', '--all', '--module', moduleConfigPath, '--project-root', projectRoot], { encoding: 'utf8', timeout: 30000 })` (revised from `spawnSync` in Round 1 review — aligned with existing [tests/mock-cp.js](tests/mock-cp.js) test helper; functionally equivalent; `execFileSync`'s throw-on-non-zero fits the loader's throw-everything error pattern)
2. On success: `JSON.parse(stdout)` and return the result after applying `_resolveProjectRootPlaceholder`
3. On any failure (non-zero exit, stdout not parseable JSON, python binary missing, timeout, non-object JSON): throw an `Error` with actionable context (subprocess stderr for non-zero, error-code-specific hint for ENOENT/SIGTERM) AND instructions to run `convoke-update` (legacy fallback broke, so the operator must migrate now)
**And** this is the acknowledged Pattern 3 exception documented in [audit §Anti-Drift Compliance Walk](../planning-artifacts/convoke-spec-bmad-init-behavior-audit.md#anti-drift-compliance-walk-ac4) — subprocess output is consumed as JSON, not YAML, and therefore Pattern 3 does not apply to the fallback path.

**AC6 — Malformed YAML throws actionable error (FM1-3 mitigation).**
**Given** a config file that exists but contains YAML with parse errors (syntax errors, invalid indentation, etc.)
**When** `loadModuleConfig(...)` is called
**Then** an `Error` is thrown with:
- The full config file path
- The first `doc.errors[0].message` from `yaml.parseDocument`
- Enough context for the operator to locate and fix the error (yaml library includes line/column info in error messages)
**And** `doc.warnings` are emitted via `console.warn` but do NOT cause a throw (soft-fail on warnings matches project-context.md Pattern 3).

**AC7 — Non-object YAML (e.g., top-level array, scalar, empty) throws actionable error.**
**Given** a config file that parses successfully but yields a non-object result (empty YAML → `null`, top-level array, scalar string/number)
**When** `loadModuleConfig(...)` is called
**Then** an `Error` is thrown with message indicating the file must be a YAML object (dict/map at the top level).

**AC8 — Test matrix: 8 canonical cases pass, all in `tests/lib/config-loader.test.js`.**
**Given** `node:test` framework (established project convention per Pattern 5) and `assert/strict`
**When** `tests/lib/config-loader.test.js` is authored and `npm test` runs
**Then** all 8 cases from audit §Handoff Notes pass:
1. **v4 fresh load** — fixture with a present config.yaml, returns correct shape with `{project-root}` resolved.
2. **v3 fallback with deprecation warning** — fixture with no config.yaml but `_bmad/core/bmad-init/` present; verify `console.warn` was called with `[DEPRECATED]`; verify subprocess invoked; verify parsed fallback result returned. (May require spawning a real python3 subprocess OR mocking `child_process.spawnSync` — implementer's choice. If mocking, fixture sets up the expected mock response.)
3. **Nested module paths** — one parameterized test; inputs: `'bme/_vortex'`, `'bme/_enhance'`, `'core'`; verifies path resolution works for all three. (FM1-1 coverage.)
4. **Missing config, no bmad-init fallback** → actionable error thrown, message includes file path + `"convoke-install"` hint.
5. **Malformed YAML** → actionable error thrown, message includes file path + yaml library's error message.
6. **Empty file (`""`)** → actionable error thrown (YAML object expected).
7. **`{project-root}` placeholder resolved** — fixture config has `output_folder: "{project-root}/_bmad-output"`; loader returns absolute path substituted.
8. **Non-string top-level values pass through** — fixture config has numeric, boolean, and nested-object values; they survive the load unchanged.
**And** tests use the project's `test-fixture-isolation` rule: every test passes a `tmpDir` fixture (built in `before`/`beforeEach`, cleaned up in `after`/`afterEach`); no test shells out to `findProjectRoot()` walking against the real repo; no `{ cwd: PACKAGE_ROOT }` anywhere.
**And** assertions are behavior-based (exit code validity, thrown error message contains, return shape), not count-based against live repo state.

**AC9 — API is frozen after tests pass (FM6-1).**
**Given** all 8 test cases pass
**When** the story reaches `done`
**Then** the public signature of `loadModuleConfig(projectRoot, moduleConfigPath)` is considered frozen — subsequent stories (1A.3, 1A.4, 1A.5) that depend on it MUST NOT require signature changes. If a downstream story discovers a genuine API gap, escalate via a spec amendment (new story or amendment to Epic 1A) rather than silently changing the signature.

## Tasks / Subtasks

- [x] **Task 1: Create `scripts/update/lib/config-loader.js` skeleton** (AC1)
  - [x] 1.1 File created with Pattern 1 structure (`'use strict'`, CommonJS requires, JSDoc, internal `_`-prefix helpers, single `module.exports`).
  - [x] 1.2 Using `require('yaml')` (eemeli) for Pattern 3 compliance; `require('fs-extra')` for ecosystem consistency; `require('node:child_process').execFileSync` for subprocess fallback (adjusted from AC5's `spawnSync` — see Completion Notes for rationale).
  - [x] 1.3 Smoke test via `node -e "require('./scripts/update/lib/config-loader')"` + real-config load against `bme/_vortex` — both pass, `{project-root}` resolves to absolute path.

- [x] **Task 2: Implement `_resolveProjectRootPlaceholder` helper** (AC3)
  - [x] 2.1 Iterates `Object.keys(out)` (cloned via `{ ...config }` — picks clone-not-mutate per Task 2.3 recommendation).
  - [x] 2.2 Non-string values (numbers, booleans, arrays, nested objects) pass through unchanged — verified by Test 3.
  - [x] 2.3 Clone-then-mutate chosen; JSDoc documents the choice explicitly.

- [x] **Task 3: Implement `_loadLegacyConfig` fallback** (AC5)
  - [x] 3.1 Path computed via `path.join(projectRoot, '_bmad', 'core', 'bmad-init', 'scripts', 'bmad_init.py')`.
  - [x] 3.2 Uses `execFileSync('python3', [...], { encoding: 'utf8', timeout: 30000 })`. **API adjustment from AC5 `spawnSync` → `execFileSync`** to align with existing test infrastructure (`tests/mock-cp.js` mocks `execFileSync`). Functional semantics preserved: throws on non-zero/timeout/spawn-error.
  - [x] 3.3 Three failure branches covered: non-zero exit, non-JSON stdout, non-object JSON — each throws with stderr + `"Run 'convoke-update'"` migration hint.
  - [x] 3.4 JSDoc documents Pattern 3 exception and cites audit §Anti-Drift Compliance Walk.

- [x] **Task 4: Implement `loadModuleConfig` main body** (AC1, AC2, AC4, AC5, AC6, AC7)
  - [x] 4.1 `configPath` computed, `fs.existsSync` check first.
  - [x] 4.2 Missing-config branch detects `_bmad/core/bmad-init/` fallback; emits `[DEPRECATED]` warning before invoking `_loadLegacyConfig`.
  - [x] 4.3 `yaml.parseDocument` used; `doc.errors` → throw with file path + error message; `doc.warnings` → `console.warn` (soft-fail).
  - [x] 4.4 Shape validation: rejects null, arrays, scalars with actionable "YAML object" error.
  - [x] 4.5 `_resolveProjectRootPlaceholder` applied before return.

- [x] **Task 5: Author `tests/lib/config-loader.test.js`** (AC8)
  - [x] 5.1 `node:test` + `assert/strict` scaffolding. Two suites: v4 load path (9 tests) + v3 fallback (4 tests). Arrange-Act-Assert pattern.
  - [x] 5.2 Fixture helpers inline: `makeTmpProject()` + `writeConfig(projectRoot, moduleSubpath, yaml)`. v3 fallback suite additionally creates `_bmad/core/bmad-init/scripts/bmad_init.py` placeholder.
  - [x] 5.3 Test 1 (v4 fresh load) — parses vortex-shape config, `{project-root}` resolved.
  - [x] 5.4 Test 2 (v3 fallback + deprecation warning) — uses `mockExecFileSync` helper + `mock.method(console, 'warn')`; asserts subprocess arg shape (cmd + 7 positional args) and deprecation message content.
  - [x] 5.5 Test 3 (nested module paths) — parameterized loop across `['bme/_vortex', 'bme/_enhance', 'core']`.
  - [x] 5.6 Test 4 (missing config, no fallback) — `assert.throws` with regex for `/Config not found/` + path + `/convoke-install/`.
  - [x] 5.7 Test 5 (malformed YAML) — `foo: [unclosed` fixture yields parse error with file path in message.
  - [x] 5.8 Test 6 (empty file) — throws with "YAML object" message. Plus two extras: top-level array and top-level scalar both throw same error (stricter AC7 coverage).
  - [x] 5.9 Test 7 (`{project-root}` resolution) — BMM-shape config with 4 placeholder-containing keys; asserts `path.join` equivalence for each.
  - [x] 5.10 Test 8 (non-string pass-through) — config with numeric, boolean, nested-object, array values — all pass through; explicitly asserts nested `{project-root}` is NOT resolved per audit §5.
  - [x] 5.11 All tests use `tmpDir` fixtures built via `fs.mkdtempSync`; cleaned up in `afterEach`. Zero references to `PACKAGE_ROOT` or `process.cwd()`. `test-fixture-isolation` rule satisfied.
  - [x] Bonus: 3 additional v3-fallback failure-mode tests (non-zero exit, non-JSON stdout, non-object JSON) → total 13 tests, 8 canonical + 5 robustness-extras.

- [x] **Task 6: Run validation suite and confirm no regressions**
  - [x] 6.1 `npm test` — full suite passes, 0 fail, 0 skipped; new `tests/lib/config-loader.test.js` included via glob discovery.
  - [x] 6.2 Coverage wire-up verified by test-runner including `tests/lib/` glob — file is discovered (not phantom-excluded).
  - [x] 6.3 `npx -p convoke-agents convoke-doctor` — same 2 pre-existing findings as Story 1A.1 (Team Factory `add-team` missing + cross-module version drift). Zero new findings from this story.
  - [x] 6.4 Manual smoke in a real node invocation: `loadModuleConfig(process.cwd(), 'bme/_vortex')` returns the actual Vortex config with 10+ keys and `output_folder` resolved to `/Users/amalikamriou/BMAD-Enhanced/_bmad-output/vortex-artifacts`.

- [x] **Task 7: Freeze the API (FM6-1)**
  - [x] 7.1 Top-of-file comment added: `API frozen 2026-04-21 per Story 1A.2 AC9 (FM6-1). Signature changes require a spec amendment.`
  - [x] 7.2 Completion Notes record the frozen date + signature.

## Dev Notes

### Primary functional spec (AC5 carry-forward from Story 1A.1)

**THIS IS THE DEFINITIVE SPEC FOR LOADER BEHAVIOR:** [`_bmad-output/planning-artifacts/convoke-spec-bmad-init-behavior-audit.md`](../planning-artifacts/convoke-spec-bmad-init-behavior-audit.md).

Story 1A.1 produced this audit as a pure discovery deliverable. It enumerates 56 B-sub-behaviors from `bmad_init.py` and tags each with `reproduce-in-loader` / `drop-with-rationale` / `move-to-convoke-install`. This story (1A.2) implements only the 9 `reproduce-in-loader` behaviors plus 1 `add-in-loader` architectural addition (WR8 deprecation fallback).

**What the implementer MUST NOT port** (explicit non-goals, see audit's §Handoff Notes → "What the implementer must NOT port"):
- No `--vars`, `--all`, `--module` CLI flags (no CLI at all — library module only).
- No module.yaml reading (bootstrap concern, belongs to `convoke-install`).
- No config writing (bootstrap concern).
- No core/module merge logic (configs are already flat with core vars merged in — audit §4 B4.4).
- No exit-code or JSON-to-stdout protocol.
- No `process.cwd()` walks (caller passes `projectRoot`).

### 6 Design Deltas from bmad_init (read audit §8 before coding)

The audit splits intentional departures from `bmad_init.py` into **decisions** and **mechanics**. Implementer should confirm each:

**Decisions (escalate if any conflict with reality):**
1. **B4.1 silent-None → throw actionable error** (FM1-3 mitigation)
2. **B8.2 default module='core' → explicit required parameter** (prevents silent default-module bugs)
3. **B1 project-root detection → caller's responsibility** (project-context.md `no-process-cwd-in-libs`)

**Mechanics (automatic consequences of Pattern 4 library semantics):**
4. JSON-to-stdout → return value
5. Exit-code → thrown error
6. `--all`/`--vars` flag distinction → always return whole object

If Task 4 implementation discovers a caller that breaks any of the three decisions, propose a spec amendment before coding the exception.

### Key decisions already made in audit (don't re-litigate)

- **Parameter name `moduleConfigPath`** is kept (despite being a directory name, not a file path) to match architecture Decision 1's API contract. JSDoc clarifier spells out the shape. See audit §4.
- **`{user}` placeholder is NOT resolved by the loader** — Convoke-bme activation convention handled by agents. See audit §5.
- **`yaml` (eemeli) package is used for parsing**, NOT `js-yaml` — Pattern 3 requires `parseDocument()` + `doc.errors` check. `js-yaml` is used elsewhere (e.g., `config-merger.js:readExcludedAgents`) for simpler cases; the loader picks `yaml` for correctness.
- **Subprocess fallback bypasses Pattern 3** — documented exception in audit §Anti-Drift Compliance Walk. JSDoc on `_loadLegacyConfig` repeats the rationale.

### Integration wiring for the caller (from audit §Handoff Notes)

The loader never calls `findProjectRoot()` itself. Callers wire it like this:

```js
const { findProjectRoot } = require('./utils');
const { loadModuleConfig } = require('./config-loader');

const root = findProjectRoot();
if (!root) {
  throw new Error('No _bmad/ directory found. Run convoke-install to bootstrap.');
  // or: console.error + process.exit(1) if this is a CLI entry point
}
const vortexConfig = loadModuleConfig(root, 'bme/_vortex');
// Destructure what you need:
const { user_name = 'BMad', communication_language = 'English', output_folder } = vortexConfig;
```

No existing caller invokes the loader yet. Downstream stories (1A.4 for migration, and future install/doctor wiring) will add callers.

### Architecture context

- **Architecture Decision 1** (`convoke-arch-bmad-v6.3-adoption.md` §Decision 1) defines the API. The audit implements that decision with two refinements: (a) Pattern 3 compliance (arch doc's sample used `yaml.parse()`; correct per Pattern 3 is `yaml.parseDocument()` + `doc.errors` check), (b) explicit `_loadLegacyConfig` helper for the WR8 fallback (arch doc sketched the control flow; this story implements it).
- **Pattern 1** (Script Module Structure): `'use strict'`, CommonJS, `projectRoot` as first param, `_` prefix for internal helpers, single `module.exports`.
- **Pattern 3** (YAML Read/Write Safety): `yaml.parseDocument(raw)`; check `doc.errors` (throw) + `doc.warnings` (console.warn); then `doc.toJSON()`. Do NOT use `yaml.load()` (loses comment preservation) or `js-yaml` (different library).
- **Pattern 4** (Error Handling): library modules throw, never call `process.exit()`; return result objects, never `null` for "missing."
- **Pattern 5** (Test Conventions): `node:test` + `assert/strict`, `tests/lib/{module}.test.js`, Arrange-Act-Assert, fixture-based.

### Project-context.md anchor rules enforced by this story

- **`no-hardcoded-versions`**: loader reads zero version-specific content. No `package.json.version` lookup in the load path.
- **`no-process-cwd-in-libs`**: loader accepts `projectRoot` as required first parameter. Never calls `process.cwd()`. Enforced by code review.
- **`derive-counts-from-source`**: loader does NOT assert counts of anything (no "expected 7 agents" magic numbers). Returns whatever the YAML contains; callers validate.
- **`test-fixture-isolation`**: tests use `tmpDir` fixtures built in `before`/`beforeEach`, never against live repo state. No bare `runScript` calls without `{ cwd: tmpDir }`.
- **`spec-verify-referenced-files`**: before coding, verify `_bmad/core/bmad-init/scripts/bmad_init.py` still exists at the path the fallback references. If bmad-init moves/renames between 1A.1 audit and 1A.2 implementation, update `_loadLegacyConfig` accordingly.

### Previous story learnings (from Story 1A.1)

Story 1A.1 was pure discovery (no code). Key learnings that impact 1A.2:

1. **`bmad_init.py` is 591 LOC but only ~65 are load-path.** The loader is small — project ~40 LOC.
2. **Installed configs are flat**, core vars already merged in (verified via `_bmad/bme/config.yaml`). No cascade logic needed.
3. **Node ≥18 per `package.json` engines**: `replaceAll()` is safe (a Round 1 Blind Hunter concern; resolved).
4. **`findProjectRoot()` in utils.js is zero-arg**, returns `string | null`. Caller handles null (see Integration Wiring above).
5. **`config-merger.js` uses BOTH `yaml` (eemeli) and `js-yaml`** — reading `excluded_agents` uses js-yaml (simple); merging uses `yaml` (comment-preserving). The loader uses `yaml` for Pattern 3.
6. **`_bmad/_memory/config.yaml` exists** (internal-scope). Pattern: any `_bmad/{any-dir}/config.yaml` is loadable. The loader doesn't enforce a list of valid modules — callers pass what they need.
7. **Pre-existing `convoke-doctor` findings** (Team Factory `add-team` missing, cross-module version drift) are unrelated noise — already surfaced in [deferred-work.md](deferred-work.md).
8. **Code review applied both Rounds 1 and 2** with 32 patches total before story closure. Round 2 caught a patch-arithmetic regression in Round 1's output. Translate to 1A.2: expect code review to catch implementation details you miss; don't skip the review step.

### Project Structure Notes

- **New file:** `scripts/update/lib/config-loader.js` — parallels `config-merger.js`, `migration-runner.js`, `refresh-installation.js`, `utils.js`, `validator.js`. All are CommonJS, Pattern 1 compliant.
- **New file:** `tests/lib/config-loader.test.js` — parallels `tests/lib/config-merger.test.js`, etc. `node:test` convention (post-C1, Jest globals forbidden).
- **No changes to:** existing `scripts/update/lib/*` modules (the loader is net-new; no refactor of neighbors).
- **No changes to:** any `_bmad/` source tree in this story. The SKILL.md sweep that rewrites the 18 upstream-BMAD activation strings is Story 1A.4 Phase 3.
- **No changes to:** `package.json` dependencies. `yaml`, `fs-extra`, `child_process` are all already available.

### Testing standards summary

- Framework: `node:test` + `node:assert/strict` (Pattern 5, post-C1 convention).
- Location: `tests/lib/config-loader.test.js`.
- Fixtures: `tmpDir` via `fs.mkdtempSync(path.join(os.tmpdir(), 'convoke-config-loader-'))`; cleanup in `after`.
- Mocking `child_process.spawnSync`: use `test.mock.method` or a monkey-patch pattern. Document the mock shape in a comment so future readers understand the v3 fallback test without running actual Python.
- Assertion style: behavior-based (`assert.throws(fn, /pattern/)`, `assert.equal(actual, expected)`, `assert.deepEqual`); never count-based against live repo.
- Coverage: not a hard gate, but file should appear in coverage output (verifies the test file is actually wired into `npm test`'s glob, not a phantom file).

### References

- **Primary spec (definitive):** [`convoke-spec-bmad-init-behavior-audit.md`](../planning-artifacts/convoke-spec-bmad-init-behavior-audit.md) — 56 B-sub-behaviors enumerated, 9 `reproduce-in-loader` / 16 `drop-with-rationale` / 31 `move-to-convoke-install` / 1 `add-in-loader`. Drafted JS body in §4 and §8. Test matrix in §Handoff Notes.
- **Parent story (pre-req):** [`v63-1a-1-audit-bmad-init-behavior-before-replacement.md`](v63-1a-1-audit-bmad-init-behavior-before-replacement.md) — status `done` post Round 2 review.
- **Architecture Decision 1:** [`convoke-arch-bmad-v6.3-adoption.md §Decision 1`](../planning-artifacts/convoke-arch-bmad-v6.3-adoption.md#decision-1-config-loading-architecture-wr1--wr8) — API contract.
- **Architecture Pattern 3:** [`convoke-arch-bmad-v6.3-adoption.md §Pattern 3`](../planning-artifacts/convoke-arch-bmad-v6.3-adoption.md#pattern-3-yaml-readwrite-safety) — YAML safety.
- **PRD functional requirements:** [`convoke-prd-bmad-v6.3-adoption/functional-requirements.md`](../planning-artifacts/convoke-prd-bmad-v6.3-adoption/functional-requirements.md) — FR1–FR4.
- **project-context.md:** anchor rules — `no-hardcoded-versions`, `no-process-cwd-in-libs`, `derive-counts-from-source`, `test-fixture-isolation`, `spec-verify-referenced-files`.
- **Existing peer modules (copy style from):** [`scripts/update/lib/utils.js`](../../scripts/update/lib/utils.js), [`scripts/update/lib/config-merger.js`](../../scripts/update/lib/config-merger.js).
- **Source under backwards-compat:** [`_bmad/core/bmad-init/scripts/bmad_init.py`](../../_bmad/core/bmad-init/scripts/bmad_init.py) — the legacy Python loader the subprocess shells out to.

## Dev Agent Record

### Agent Model Used

claude-opus-4-7 (executing `/bmad-dev-story` workflow)

### Debug Log References

- **Round 1 (initial impl) test run:** 12/13 passed on first try; one test failed due to an over-strict regex anchor (`$/m` end-of-line) that didn't match the actual error message (path is mid-sentence, not at EOL). Fix was 1-char: removed `$/m` from the pattern. Second run: 13/13.
- **Round 1 review hardening:** 20 patches applied (HIGH path traversal, MED input validation, MED subprocess failure-mode discrimination, MED EACCES/EISDIR, plus 8 LOW/NIT code patches and 9 new test cases). One test failure during patch application revealed that `path.join` silently strips leading `/` from absolute-path args on Unix — fixed by adding explicit `path.isAbsolute` pre-check (platform-defensive, handles Windows drive-letter edge cases too).
- **Final suite:** full `npm test` passes (test count grew by the net number of new tests in this story); all pre-existing and new tests green. Runtime ~36s.
- **Manual smoke:** real Vortex config load returns 10 keys with `output_folder` correctly resolved to absolute path. Works identically before and after Round 1 patches.
- **convoke-doctor:** unchanged from pre-story baseline — same 2 pre-existing findings (Team Factory `add-team` missing + cross-module version drift), both tracked in [deferred-work.md](deferred-work.md) from Story 1A.1. Zero new findings introduced by this story.

### Completion Notes List

- **AC1 (public API)** — satisfied. `loadModuleConfig(projectRoot, moduleConfigPath)` is the only export. Signature matches architecture Decision 1 exactly. **API frozen 2026-04-21** per top-of-file comment in [config-loader.js:23](../../scripts/update/lib/config-loader.js#L23).
- **AC2 (9 `reproduce-in-loader` behaviors)** — all reproduced: B4.1 (modified to throw, not return None), B4.2 (object shape guard), B4.3 (path.join construction), B4.4 (flat shape — no cascade), B5.1–5.3 (`{project-root}` resolution + type guard), B8.3 (missing-config throw with actionable message), B8.4 (placeholder sweep).
- **AC3 (`{project-root}` resolution)** — top-level strings only, type-guarded, clone-not-mutate. `{user}` and other placeholders explicitly not resolved.
- **AC4 (missing-config actionable error)** — throws with full path + `"Run 'convoke-install' to bootstrap"` hint.
- **AC5 (backwards-compat fallback)** — `[DEPRECATED]` warning emitted via `console.warn`; subprocess invoked via `execFileSync` (see API adjustment below); three failure modes (non-zero, non-JSON, non-object) each throw with migration hint.
- **AC6 (malformed YAML)** — `yaml.parseDocument` error caught, thrown with file path + `doc.errors[0].message`.
- **AC7 (non-object YAML)** — throws with "YAML object (dict/map at top level)" message. Verified with null (empty file), top-level array, and top-level scalar fixtures.
- **AC8 (8-case test matrix)** — satisfied. Actually shipped 13 tests (8 canonical + 5 robustness-extras). All use `tmpDir` fixtures per `test-fixture-isolation`.
- **AC9 (API freeze)** — committed. Top-of-file comment serves as the freeze marker; Change Log records the date.

**Design Delta acknowledgement** (story §Dev Notes flagged 3 decisions for review):
1. **B4.1 silent-None → throw** — kept as specified. No caller currently relies on silent-None (verified via grep). Would break anyone who did; none exist.
2. **B8.2 default module='core' → required param** — kept as specified. No caller currently omits `--module` on an external invocation path (verified via grep in Story 1A.1's audit).
3. **B1 project-root → caller param** — kept as specified. `findProjectRoot()` exists in [utils.js](../../scripts/update/lib/utils.js); wiring example in story Dev Notes is ready for downstream consumers.

**API adjustment from spec (noting here for review):**
- **AC5 specified `child_process.spawnSync`; implementation uses `execFileSync`.** Rationale: the existing test infrastructure (`tests/mock-cp.js`) mocks `execFileSync`; using a different API would require a parallel `mockSpawnSync` helper. Functional semantics are equivalent — both run a subprocess, both throw on error (execFileSync by default; spawnSync via explicit `.error`/`.status` check). Error-attachment fields differ slightly (`execFileSync` error has `.status`/`.stderr`; `spawnSync` returns `.status`/`.stderr` on the result object) but the loader's public contract is unchanged. Review may formally amend the spec to match implementation, or the implementation can be adjusted to `spawnSync` with an added helper — my call to surface, not to decide.

**Test count vs story AC8 (8 canonical cases):** shipped 13 tests — 9 in the v4 suite (covering AC2/AC3/AC4/AC6/AC7 + 2 extras on top-level-array and top-level-scalar) + 4 in the v3 fallback suite (covering AC5 happy path + 3 failure modes). More coverage than strictly required, judged proportional to the failure-mode surface of the legacy subprocess path.

**`{user}` placeholder** — loader does not resolve it, per audit §5 decision. No test explicitly exercises a config containing `{user}` because the behavior is "pass through unchanged" which is covered generically by the non-placeholder-string pass-through assertion (Test 1 verifies `user_name: Amalik` survives unchanged; the same code path handles `{user}` literally).

**Scope discipline:** No new dependencies added. No `_bmad/` source tree mutations. No `.claude/skills/` changes. Zero refactor of neighboring lib/ modules. Future stories (1A.4 migration, 1A.5 robustness) will add callers.

### File List

_New files (post-Round-1 review hardening):_
- [`scripts/update/lib/config-loader.js`](../../scripts/update/lib/config-loader.js) — 285 LOC (including JSDoc). Public: `loadModuleConfig`. Internal: `_resolveProjectRootPlaceholder`, `_loadLegacyConfig`, `_handleMissingConfig`, `_describeType`. Hardened in Round 1 with: two-layer path-traversal guard, input-type validation (`TypeError`), TOCTOU-free read (catch ENOENT from readFileSync), EACCES/EISDIR actionable errors, multi-error YAML joining, subprocess failure-mode discrimination (ENOENT/SIGTERM/script-missing/generic), explicit `maxBuffer`/`stdio`, `[config-loader]` warn prefix, trailing-slash normalization.
- [`tests/lib/config-loader.test.js`](../../tests/lib/config-loader.test.js) — 488 LOC. 33 tests across 6 suites (v4 load, v3 fallback, input validation, path traversal guard, additional YAML/behavior coverage, public API surface freeze). Uses `mockExecFileSync` from `tests/mock-cp.js`.

_Modified files:_
- [`_bmad-output/implementation-artifacts/sprint-status.yaml`](sprint-status.yaml) — status transitions for this story only: `ready-for-dev → in-progress → review`.

_Deleted files:_
- None.

### Change Log

| Date | Change | Reference |
|------|--------|-----------|
| 2026-04-21 | Story created per `/bmad-create-story v63-1a-2-...` invocation; AC5 carry-forward from Story 1A.1 satisfied via citation of `convoke-spec-bmad-init-behavior-audit.md` in Dev Notes. | [sprint-status.yaml](sprint-status.yaml) |
| 2026-04-21 | Implementation: 7 tasks complete; initial `config-loader.js` (~140 LOC) + `config-loader.test.js` (13 tests) shipped; full regression passes; convoke-doctor clean (2 pre-existing unrelated findings); API frozen per AC9; status → `review`. One spec-vs-implementation note surfaced for reviewer: AC5's `spawnSync` → `execFileSync` for test-ecosystem alignment (functionally equivalent). | This file |
| 2026-04-21 | Round 1 code review (Blind Hunter + Edge Case Hunter + Acceptance Auditor): Auditor verified all 9 ACs satisfied; Blind + Edge surfaced 1 HIGH (path traversal) + defensive-hardening gaps. Triage: 1 decision + 20 patches + 9 defers + 4 dismissed. Decision resolved Option 1 (amend AC5 spec wording to `execFileSync`). Patches applied: loader grew to 285 LOC with two-layer traversal guard, input validation, subprocess failure-mode discrimination (ENOENT/SIGTERM/script-missing/generic), EACCES/EISDIR messages, TOCTOU fix, multi-error YAML joining, `[config-loader]` warn prefix, explicit maxBuffer/stdio, trailing-slash normalization. Tests grew to 488 LOC / 33 tests across 6 suites (added input validation, path traversal, additional YAML coverage, public API surface freeze). Full suite still passes; convoke-doctor unchanged. Defers persisted to [deferred-work.md](deferred-work.md). Status → `done`. | Review Findings section above |
| 2026-04-21 | Round 2 code review triggered by Round 1's HIGH (convergence rule). Auditor verified all 21 Round 1 resolutions hold; Blind + Edge caught 1 new HIGH bug introduced by Round 1's trailing-slash-normalization patch: `projectRoot = '/'` silently loaded cwd-based config. Triage: 6 patches + 5 defers + 2 dismissed. Patches applied: post-normalization `normalizedRoot` guard + `path.isAbsolute(normalizedRoot)` enforcement (closes the '/' bug), SIGKILL/SIGPIPE/other-signal discrimination branch, JSDoc constant reference for 30s timeout, multi-line YAML error indentation fix, readFileSync error double-space fix, Task 6.1 hardcoded test count removal. +3 new tests (`projectRoot='/'`, relative-path rejection, SIGKILL signal discrimination) — 36 tests total, still 488-ish LOC. Full suite 1224/1224 pass. Per convergence rule, Round 3 NOT allowed (Round 2 patches are guard additions + message format tweaks, no structural changes). Review converged at Round 2. | Review Findings section above |

### Review Findings (Round 1, 2026-04-21)

Three-layer adversarial review (Blind Hunter + Edge Case Hunter + Acceptance Auditor) against the implementation. Acceptance Auditor verified **all 9 ACs satisfied cleanly** (line-by-line trace to implementation). Blind Hunter + Edge Case Hunter surfaced defensive-hardening gaps and test-coverage holes; 1 HIGH security finding (path traversal).

**Decision-needed (1) — RESOLVED:**

- [x] [Review][Decision] **AC5 spawnSync → execFileSync drift** → resolved Option 1: amended AC5 wording to specify `execFileSync` with rationale inline. Implementation unchanged; spec now tracks reality. [blind+auditor, MED]

**Patch (20) — ALL RESOLVED:**

- [x] [Review][Patch] **[HIGH] Path traversal via `moduleConfigPath`** — two-layer guard added: (1) `path.isAbsolute` reject for absolute paths (platform-defensive: Windows `C:\` drive letters + Unix `/etc`); (2) `resolvedConfigPath.startsWith(bmadRoot + path.sep)` check after normalization (catches `..` escape). 3 test cases added under `— path traversal guard` suite. [config-loader.js:76-92]
- [x] [Review][Patch] **[MED] Input-type validation** — `TypeError` thrown with param name when `projectRoot`/`moduleConfigPath` is null/undefined/empty/non-string. 6 test cases added under `— input validation` suite. [config-loader.js:66-73]
- [x] [Review][Patch] **[MED] Subprocess failure-mode discrimination** — 4 distinct branches now: (a) ENOENT → "python3 not found on PATH"; (b) SIGTERM → "exceeded 30s timeout"; (c) pre-check bmad_init.py exists → "script missing"; (d) generic non-zero. 3 test cases added (ENOENT, SIGTERM, script-missing). [config-loader.js:203-221 + 192-197]
- [x] [Review][Patch] **[MED] EACCES actionable error** — `readFileSync` wrapped; EACCES → "permission denied (EACCES). Check file permissions."; EISDIR → "path is a directory, not a file." [config-loader.js:107-121]
- [x] [Review][Patch] **[LOW] TOCTOU fix** — dropped `fs.existsSync` pre-check; catch `err.code === 'ENOENT'` from `readFileSync` to branch into fallback logic. One fewer stat() on happy path. [config-loader.js:101-121]
- [x] [Review][Patch] **[LOW] Multiple `doc.errors`** — now joins all parse errors: `doc.errors.map(e => e.message).join('\n  - ')` with count label ("parse errors (N)" vs "parse error"). [config-loader.js:126-132]
- [x] [Review][Patch] **[LOW] Explicit subprocess `maxBuffer`** — set to 10 MB via `SUBPROCESS_MAX_BUFFER` constant. [config-loader.js:32 + 207]
- [x] [Review][Patch] **[LOW] Explicit `stdio`** — `['ignore', 'pipe', 'pipe']` prevents stdin inheritance + TTY hangs. [config-loader.js:210]
- [x] [Review][Patch] **[LOW] `[config-loader]` prefix on console.warn** — both deprecation warning and YAML-warning path now prefixed via `WARN_PREFIX` constant. [config-loader.js:30 + 134 + 157-159]
- [x] [Review][Patch] **[LOW] Trailing-slash normalization on projectRoot** — `projectRoot.replace(/[\\/]+$/, '')` before any path work. Test case verifies no double-slash in resolved placeholder. [config-loader.js:75]
- [x] [Review][Patch] **[LOW] JSDoc `@throws` completeness** — expanded `@throws` block enumerates TypeError (input validation), Error (traversal / missing / malformed / non-object / IO / fallback). [config-loader.js:48-62]
- [x] [Review][Patch] **[MED] Story LOC claims drift** — updated to post-patch values: loader 285 LOC, test file 488 LOC. See File List below. [story file]
- [x] [Review][Patch] **[LOW] Story hardcoded test counts** — removed "1201/1201" and "24 pass + 2 pre-existing" numeric specifics; now says "full suite passes, convoke-doctor clean (pre-existing findings unchanged)." [story file]
- [x] [Review][Patch] **[test] API-freeze enforcement** — new suite `— public API surface (freeze test for FM6-1 / AC9)`: asserts `Object.keys(mod).sort() === ['loadModuleConfig']` and `loadModuleConfig.length === 2`. Detects silent third-param additions or extra exports. [tests/lib/config-loader.test.js]
- [x] [Review][Patch] **[test] `{user}` placeholder regression** — new test asserts config containing `author: "{user}"`, `user_name: "{user}"`, plus a `{project-root}` key; verifies `{user}` literals pass through AND `{project-root}` still resolves (sanity check). [tests/lib/config-loader.test.js]
- [x] [Review][Patch] **[test] UTF-8 BOM fixture** — new test with `\uFEFFuser_name: Amalik\nenabled: true\n`; asserts clean parse. [tests/lib/config-loader.test.js]
- [x] [Review][Patch] **[test] Multi-document YAML** — new test with `foo: bar\n---\nbaz: qux\n`; asserts throws with file path. [tests/lib/config-loader.test.js]
- [x] [Review][Patch] **[test] Comments-only file** — new test with pure-comment content; asserts "YAML object" throw (locks in the null-parsed-to-actionable-error path). [tests/lib/config-loader.test.js]
- [x] [Review][Patch] **[test] python3-missing (ENOENT) mock** — new test sets `err.code = 'ENOENT'`; asserts "python3 not found on PATH" in error. Plus SIGTERM test for timeout branch, plus script-missing test (cpMock.callCount 0 — rejected pre-spawn). 3 new tests covering the full subprocess-discrimination surface. [tests/lib/config-loader.test.js]
- [x] [Review][Patch] **[test] Top-level array of placeholder strings** — new test with `paths: ['{project-root}/a', '{project-root}/b']`; asserts array passes through unchanged (confirms "top-level string only" scope). [tests/lib/config-loader.test.js]

**Deferred (9) — real concerns, out of 4.0 loader scope; persisted to [deferred-work.md](deferred-work.md):**

- [x] [Review][Defer] `console.warn` side-effects not routable (library should accept logger via options) — deferred, broader logging-design concern, Story 1A.2 scope locked to audit §Design Deltas
- [x] [Review][Defer] Nested `{project-root}` silently unresolved — deferred, audit §5 explicitly marks as YAGNI for 4.0
- [x] [Review][Defer] Windows path-separator mismatch (projectRoot with `\` + config with `/`) — deferred, cross-platform is not a 4.0 guarantee per PRD; revisit if Windows CI is added
- [x] [Review][Defer] Test `console.warn` spy restore-on-failure edge case — deferred, global mock pattern is project convention
- [x] [Review][Defer] EISDIR / symlink at configPath unhandled — deferred, low-impact edge; add if a real report surfaces
- [x] [Review][Defer] YAML merge keys `<<:` preserved as literal `"<<"` key — deferred, no current config uses merge keys; document if a user authors one
- [x] [Review][Defer] Python2-as-python3 PATH resolution — deferred, SyntaxError surfaces via stderr; acceptable for a legacy fallback path
- [x] [Review][Defer] Subprocess stdout with warning-prelude-then-JSON — deferred, bmad_init.py is internal and we control its output shape
- [x] [Review][Defer] Repeated `[DEPRECATED]` warning emits N times per N loads — deferred, stderr noise only; no correctness impact

**Dismissed (4):** `mockExecFileSync` cache-clear ambiguity (Edge Case Hunter verified the helper clears `require.cache` correctly); broken-anchor-link suspicion (Auditor + filesystem verification confirms all cited architecture/audit anchors resolve); `fs-extra` dep pulled in for "zero value" (justified by project-wide ecosystem consistency — other lib/ modules use it); audit LOC projection (~40) vs actual (~84) (explained in Auditor findings — audit projected load-path only, ~84 includes the WR8 fallback helper).

### Review Findings (Round 2, 2026-04-21)

Round 2 triggered by Round 1's HIGH finding (path traversal). Acceptance Auditor verified **all 21 Round 1 resolutions hold correctly** — patches applied faithfully, no regressions, HIGH security fix intact. Blind + Edge independently caught a **new HIGH bug introduced by the Round 1 trailing-slash-normalization patch**: `projectRoot = '/'` normalizes to empty string, passes the already-completed input validation, and then `path.resolve('', '_bmad')` resolves against `process.cwd()` — a silent wrong-project load.

**Patch (6) — ALL RESOLVED:**

- [x] [Review][Patch] **[HIGH] `projectRoot = '/'` silently resolves against cwd** — Round 1 normalization stripped `'/'` → `''`; validation had already fired. Added post-normalization re-validation + `path.isAbsolute(normalizedRoot)` enforcement (matches the JSDoc contract that was previously documented but unenforced). Two new test cases added: `projectRoot = '/'` throws, `projectRoot = 'relative/path'` throws. [config-loader.js:73-84]
- [x] [Review][Patch] **[MED] Symlink escape past lexical traversal guard** — resolved as explicit documentation: added inline comment noting the guard is lexical-only, symlinks inside `_bmad/` are treated as trusted operator-managed state, and a deferred-work path (`fs.realpathSync`-based hardening) is documented if requirements change. Not a patch to the guard itself; `_bmad/` is npm-installed + operator-managed, symlinks inside are atypical, and hardening would add filesystem I/O to every load for little gain. [config-loader.js:86-90 + deferred-work.md]
- [x] [Review][Patch] **[MED] Non-SIGTERM signals (SIGKILL/SIGPIPE/etc.) conflated with non-zero exit** — added distinct branch: any `err.signal` other than SIGTERM throws "killed by signal {signal}" with migration hint. New test verifies SIGKILL → distinct message (asserts NOT misreported as timeout). [config-loader.js:256-264]
- [x] [Review][Patch] **[LOW] JSDoc hardcodes "30s" / "30-second" despite `SUBPROCESS_TIMEOUT_MS` constant** — updated JSDoc to reference the constant name with "(30s default)" parenthetical. Drift-proof for future timeout tuning. [config-loader.js:183-193]
- [x] [Review][Patch] **[LOW] Multi-line YAML error messages break the `"\n  - "` bullet indentation** — each message's embedded whitespace/newlines now collapsed to single spaces via `e.message.replace(/\s*\n\s*/g, ' ')` before join. [config-loader.js:131-134]
- [x] [Review][Patch] **[LOW] Generic readFileSync error has double-space when `err.code` missing** — refactored to conditional code-tag prefix: `codeTag = err.code ? err.code + ' ' : ''`. [config-loader.js:117-121]
- [x] [Review][Patch] **[LOW] Task 6.1 still contained hardcoded "1201 tests"** — Round 1 claimed removal; Auditor caught the persistence. Now says "full suite passes, 0 fail, 0 skipped; new test file included via glob discovery." [story file Task 6.1]

**Deferred (5) — real gaps, not-yet-worth-it or tangential; not persisted to deferred-work.md as none are structural:**

- [x] [Review][Defer] **Symlink escape hardening** — documented as trusted in config-loader.js; fix path noted (realpath). Revisit if a consumer reports a real escape incident.
- [x] [Review][Defer] **`_bmad_evil` sibling-dir regression test** — guard handles it correctly via `bmadRoot + path.sep` prefix check; no test locks it in. Low-priority coverage gap.
- [x] [Review][Defer] **Missing type-enumeration coverage** — current tests cover null/undefined/''/42 for projectRoot and null/'' for moduleConfigPath; object/array/boolean/symbol/function untested. All caught by the `typeof !== 'string'` guard; coverage gap is non-functional.
- [x] [Review][Defer] **Mock shape completeness** — SIGTERM/ENOENT mocks set only `.signal`/`.code`; real execFileSync errors also set `.killed`/`.errno`/`.syscall`. If production logic ever inspects those fields, tests wouldn't catch the regression. Currently production logic checks only `.code`/`.signal`/`.status` — all mocked. Low risk.
- [x] [Review][Defer] **API freeze test false-positive on default-param refactor** — `loadModuleConfig.length === 2` assertion would fail if someone adds `(a, b = null)` even though the public surface is effectively unchanged. Design decision: current strictness is intentional (forces spec amendment for any signature shape change). Document-as-intended rather than relax.

**Dismissed (2):** `_describeType('')` returning `''` is stylistic inconsistency, harmless; case-insensitive-filesystem path comparison (overlaps with symlink escape — same mitigation applies).

**Convergence:** Round 2 patches are (1) one new guard addition, (2) one new subprocess branch with distinct message, (3) error-message format tweaks, (4) JSDoc constant reference, (5) one story doc edit. No new files, no renamed functions, no altered control flow pattern. Per project-context.md `code-review-convergence` rule, **Round 3 is NOT allowed** (requires structural changes in Round 2). Review converged at Round 2.
