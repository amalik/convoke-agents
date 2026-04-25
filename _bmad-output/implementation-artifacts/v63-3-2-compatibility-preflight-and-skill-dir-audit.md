---
initiative: convoke
artifact_type: story
qualifier: v63-3-2-compatibility-preflight-and-skill-dir-audit
created: '2026-04-24'
schema_version: 1
epic: v63-epic-3
---

# Story 3.2: Compatibility preflight and skill-dir audit

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

**Epic:** [Epic 3 — Discover via BMAD Marketplace](../planning-artifacts/convoke-epic-bmad-v6.3-adoption.md#epic-3-discover-via-bmad-marketplace)
**Sprint:** 4 (WS2/P23 marketplace stream)
**FR coverage:** FR23 (runtime compatibility preflight at install + upgrade — protects against the missing `bmad_version` field in marketplace schema).
**NFR coverage:** NFR4 (audit-skill-dirs scan completes ≤5s on full install), NFR12 (agent SKILL.md files conform to v6.3 skill-dir convention).
**Failure modes addressed:** FM5-1 (skills[] paths lack SKILL.md — now detected across the full `.claude/skills/` tree, not just marketplace-listed paths). Story 3.1 shipped marketplace-scoped audit (7 Vortex agents); Story 3.2 adds full-install audit (98+ skill dirs).

**Upstream dependencies:**
- **Story 3.1 shipped `validate-marketplace.js` with `auditSkillDirs` helper** (marketplace-scoped, 7 paths). Story 3.2's `audit-skill-dirs.js` is a separate tool for the full `.claude/skills/` tree (~98 dirs). See Dev Notes "Scope distinction vs. Story 3.1" table for authoritative comparison.
- Story 3.1 migrated Vortex agents to skill-dir shape (`<id>/SKILL.md`) — that migration's per-directory `SKILL.md` layout is the canonical shape audit-skill-dirs enforces.
- **No upstream code dependencies on Epic 2** — zero imports from `scripts/audit/audit-bmm-dependencies.js`, `scripts/convoke-doctor.js`, `scripts/update/convoke-update.js`, `scripts/convoke-register-skill.js`.

**Downstream consumers:**
- **Story 3.3 (submit marketplace registry PR)** — requires audit-skill-dirs to pass cleanly before the PR can be opened (alongside 3.1's validate-marketplace).
- **Story 3.4 (dual-distribution parity verification)** — both install paths must produce skill-dir trees that pass audit-skill-dirs identically.
- **Story 3.5 (platform adapter batch validation)** — operates on Tier 1 skills; audit-skill-dirs confirms the source tree is clean before export.
- **Convoke 4.0 publication gate** — `convoke-install` + `convoke-update` preflight is the runtime safety net for users on BMAD < 6.3.

**Namespace decision:**
- `scripts/audit/audit-skill-dirs.js` + `tests/unit/audit-skill-dirs.test.js` — new audit CLI + tests. Pattern 1 reuse from Story 2.1's `audit-bmm-dependencies.js` and Story 3.1's `validate-marketplace.js` (shebang + `'use strict'` + `@module` JSDoc + `findProjectRoot()` + frozen `_internal` export).
- `scripts/update/lib/compat-preflight.js` — new shared helper for FR23 preflight check. **First preflight helper in the codebase** (verified — no prior `preflight`/`compatibility`/`bmadVersion` modules exist in `scripts/update/lib/`); establishes the pattern for future `<x>-preflight.js` modules. Consumed by `scripts/install-vortex-agents.js` (install path — `convoke-install` → `install-all-agents.js` 9-line stub → `install-vortex-agents.js` is where `findProjectRoot()` actually resolves at line 167) + `scripts/install-gyre-agents.js` (parallel entry — `convoke-install-gyre` bin) + `scripts/update/convoke-update.js` (upgrade path). Lives in `scripts/update/lib/` alongside the other shared install-time helpers (`utils.js`, `version-detector.js`, `refresh-installation.js`, etc.) — NOT in `scripts/audit/` (audit is validation-at-rest; preflight is gatekeeping-at-install-time).
- `.claude/skills/bmad-audit-skill-dirs/` — new slash-command skill wrapper per `feedback_slash_command_ux` memory (all user-facing tools must be BMAD slash-command skills, not CLI-only).
- **Covenant compliance checklist:** NOT applicable — no new `_bmad/bme/*` agent skill being authored. The `.claude/skills/bmad-audit-skill-dirs/` wrapper is operator tooling, not a user-facing agent.

## Story

As a Convoke installer (operator running `convoke-install` or `convoke-update` for the first time on a v3.x → v4.0 upgrade, OR a new user discovering Convoke through the BMAD marketplace),
I want runtime validation that my BMAD version is compatible AND that every skill directory in my install has a v6.3-compliant `SKILL.md`,
so that installation fails loud (with actionable guidance) when preconditions aren't met — instead of silently producing a broken install that crashes at first agent activation.

**Scope vs. Story 3.1:** see Dev Notes "Scope distinction vs. Story 3.1" table — the two tools are deliberate specialists, not substitutes.

## Acceptance Criteria

**Decision 1 (pinned): BMAD version detection strategy.** FR23 exists because marketplace schema lacks a `bmad_version` field — we can't read it from the plugin metadata directly. Options considered:
- **(a) Read `node_modules/bmad-method/package.json`'s `version` field** (selected). BMAD is distributed as an npm package **`bmad-method`** (DEF-SPIKE 1 resolved via planning artifacts — `convoke-arch-bmad-v6.3-adoption.md:98`). If present in `node_modules`, the installer is on a proper BMAD install; version string is authoritative. If `bmad-method` is absent, emit WARNING "BMAD core not detected — cannot verify v6.3 compatibility; proceeding anyway" and continue.
- **(b) Parse `_bmad/*/config.yaml` for markers** — rejected: config.yaml stamps Convoke version, not BMAD; no BMAD-version marker exists in Convoke's config.
- **(c) Require operator to pass `--bmad-version` flag** — rejected: defeats the point of automated preflight.

**Critical caveat for Story 3.2 implementation:** Convoke does NOT depend on `bmad-method` in its own `package.json` (verified: deps are `chalk`, `convoke-agents`, `fs-extra`, `gray-matter`, `js-yaml`, `yaml` only). Convoke is a *parallel* BMAD extension installed side-by-side, not a dependent. **On this dev machine and most CI runners, the "absent-package" WARNING branch (clause 4) is the ONLY path that fires against the real tree** — there is no `node_modules/bmad-method/` to detect. This makes the unit-test mocking strategy load-bearing: AC1 clause 2 (silent-pass) and clause 3 (older-version WARNING) are exercised ONLY via mocked `node_modules/bmad-method/package.json` fixtures in `tests/unit/compat-preflight.test.js`. Live smoke (Task 8.4) MUST emit the absent-package WARNING — if it doesn't, the fixture paths or version gate are broken.

**Decision 2 (pinned): audit-skill-dirs scope — all `.claude/skills/` dirs.** The audit scans **every** directory under `.claude/skills/` (the runtime install target), reporting any dir missing `SKILL.md` or with non-v6.3 frontmatter. NOT marketplace-scoped (that's 3.1); NOT source-tree-scoped (source is `_bmad/` — audit operates on the post-install runtime layout which is what Claude Code / Cursor / Copilot actually load). Scope rationale: a broken runtime wrapper breaks agent activation regardless of source cleanliness, and the runtime layout is the flattest, most-uniform target (98+ identical-shape directories).

**Decision 3 (pinned): Preflight is soft-warn, not hard-block.** FR23 says "emits version warning" → AC1 = stderr WARNING + exit 0. Rationale: detection is best-effort (Decision 1 clause-4 fallback is the primary dev-machine path); false-positive hard-blocks trap operators with legitimate non-standard installs; harder gates ship in Story 3.3 (publish-gate) + Story 4.x (behavioral-equivalence). Per `feedback_process_uniformity`, anchor this in `project-context.md` so future dev agents don't re-litigate — **Task 5.4 adds that anchor rule** (rule is not useful if it lives only in retro notes).

---

**AC1 — `convoke-install` + `convoke-update` emit BMAD version warning when version < 6.3.0 (FR23).**
**Given** an operator runs `convoke-install` (first install) OR `convoke-update` (subsequent upgrade)
**When** the install/update flow starts (BEFORE any filesystem writes)
**Then** a preflight check MUST:
1. Attempt to read `node_modules/bmad-method/package.json` for BMAD's declared version.
2. If found + parseable + `version >= 6.3.0`: emit no output, proceed silently. (happy path)
3. If found + parseable + `version < 6.3.0`: emit a yellow WARNING to stderr with:
   - The detected version
   - The required version (`6.3.0`)
   - Actionable guidance: `"Upgrade BMAD core: npm install bmad-method@latest"`
4. If `node_modules/bmad-method/package.json` absent or unparseable: emit a yellow WARNING noting "BMAD core not detected — cannot verify v6.3 compatibility; proceeding anyway."
5. In ALL cases EXCEPT (2) happy-path: continue the install/update flow (exit 0 pass-through). Preflight does NOT block.

**And** the preflight helper MUST live at [`scripts/update/lib/compat-preflight.js`](../../scripts/update/lib/compat-preflight.js) and export `runCompatPreflight(projectRoot)` — called from THREE entry points:
- `scripts/install-vortex-agents.js` (the real install logic; `convoke-install` → `install-all-agents.js` delegates here; `convoke-install-vortex` bin targets this file directly). Call-site: ~line 168, AFTER `const projectRoot = findProjectRoot() || process.cwd();` at line 167, BEFORE `checkPrerequisites(projectRoot)` invocation.
- `scripts/install-gyre-agents.js` (parallel bin `convoke-install-gyre`). Same call-site shape: after `projectRoot` resolves, before any filesystem writes.
- `scripts/update/convoke-update.js` (upgrade path — `convoke-update` bin). Call-site: top of main entry, BEFORE any config read or refreshInstallation call.

**NOT** called from `scripts/install-all-agents.js` — that file is a 9-line delegation stub (`require('./install-vortex-agents.js');`) with no `findProjectRoot()` call of its own. Adding preflight to the stub would fire before `install-vortex-agents.js`'s own root resolution — same outcome, more confusing call-graph.

**And** non-TTY / CI environments MUST still see the WARNING text in stderr (do NOT suppress under non-TTY — the WARNING is informational). Use `chalk.yellow()` with auto-disable; chalk already disables colors for non-TTY but the text stays.

**AC2 — `scripts/audit/audit-skill-dirs.js` audits every skill directory in `.claude/skills/` for v6.3 compliance (NFR12).**
**Given** a Convoke install at `{project-root}` with N skill directories under `.claude/skills/`
**When** `audit-skill-dirs.js` (or `convoke-audit-skill-dirs` bin entry) runs
**Then** it MUST:
1. Walk `.claude/skills/` and enumerate every immediate subdirectory (one level deep; do NOT recurse into nested dirs like `steps/`).
2. For each skill dir, verify:
   - Presence of `SKILL.md` (directory must contain a file named exactly `SKILL.md`).
   - Frontmatter block exists (`^---\s*\n[\s\S]*?\n---`).
   - Frontmatter parses as valid YAML via `js-yaml`.
   - Frontmatter contains `name:` (non-empty string).
   - Frontmatter contains `description:` (non-empty string).
3. Accumulate findings as `{passed, error?, warning?, info?}` check-result shape (matching Story 2.2's `checkBmmDependencies` + Story 3.1's `auditSkillDirs` shape).
4. Emit a summary: `"N skill dirs audited; X passed; Y failed."` with per-finding detail under `--verbose`.
5. Exit code: `0` if all skill dirs pass; `1` if any fails. `--dry-run` always exits `0` (preview mode, renders same output).
6. `--help` / `-h` renders usage; wins over other flag parse errors (AC2/R2-M5 pattern from Story 2.4).

**And** the tool MUST include a `SKILL_MD_MAX_BYTES` size guard (R1-M2 pattern from Story 3.1 — refuse to `readFileSync` any `SKILL.md` exceeding 1MB); emit size-exceeded error instead.

**And** the tool MUST include a symlink-escape guard (R2-H3 pattern from Story 3.1 — reject skill dirs whose realpath escapes `projectRoot`, strict `startsWith(rootWithSep)`).

**AC3 — Perf budget: audit-skill-dirs completes in ≤5 seconds on typical install (NFR4).**
**Given** a Convoke install with ~100 skill directories (current real count: 98 per `ls .claude/skills | wc -l`)
**When** `audit-skill-dirs` runs (cold, node startup included)
**Then** wall-clock time MUST be ≤5000 ms.
- **Measurement:** Same method as Story 3.1 AC8 — `time node scripts/audit/audit-skill-dirs.js > /dev/null` on the real repo; 3 runs, take warm median.
- **Budget rationale:** 98 dirs × (1 lstat + 1 realpath + 1 stat + 1 readdir + 1 readFileSync + 1 YAML parse) ≈ 98 × ~6ms = ~590ms pure I/O on warm cache. Cold-start node + chalk import ≈ 100ms; YAML lib warmup ≈ 30ms. Total realistic warm ≈ 700–900ms; 5000ms gives ~6× headroom over realistic cost. Budget catches anything worth investigating (e.g., accidentally recursive traversal, unbounded reads, N² string concat in error accumulation).

**AC4 — Bin entry + slash-command skill wrapper per `feedback_slash_command_ux` memory.**
**Given** the operator wants to invoke the audit
**When** they type `/bmad-audit-skill-dirs` in Claude Code OR run `convoke-audit-skill-dirs` in their shell
**Then** both invocations MUST work:
- **CLI bin:** `package.json` `bin` map gets `"convoke-audit-skill-dirs": "scripts/audit/audit-skill-dirs.js"` alongside the existing `convoke-validate-marketplace` entry.
- **Slash-command skill:** new `.claude/skills/bmad-audit-skill-dirs/` directory with `SKILL.md` + `workflow.md`. `SKILL.md` frontmatter has `name: bmad-audit-skill-dirs` + `description:` ONLY (two-field shape verified against `.claude/skills/bmad-register-skill/SKILL.md` — Convoke convention embeds trigger phrases INSIDE the description string, not as a separate `trigger:` field). Description shape: `"Audit every .claude/skills/ directory for v6.3 SKILL.md compliance. Use when the user says 'audit skill dirs' or 'check skill directories' or '/bmad-audit-skill-dirs'."` `workflow.md` is a thin procedural wrapper that invokes the CLI and surfaces its output to the operator.
- **Discoverability:** slash command is auto-discovered by Claude Code via the `.claude/skills/` directory walk; NO row in `_bmad/_config/skill-manifest.csv` is needed (operator tooling like `bmad-register-skill` + `bmad-audit-skill-dirs` lives at runtime only; verified — `bmad-register-skill` has zero entries in skill-manifest.csv and works fine).

**AC5 — Scope discipline: zero Epic 2 governance imports; zero changes to Story 3.1's `validate-marketplace.js`.**
**Given** the Story 3.2 diff
**When** `git diff HEAD --stat` is reviewed
**Then** the following files MUST NOT appear in the diff:
- `scripts/audit/audit-bmm-dependencies.js`
- `scripts/audit/validate-marketplace.js`
- `scripts/convoke-doctor.js`
- `scripts/update/convoke-update.js` — **EXCEPTION:** ≤3 LOC preflight call-site addition allowed (AC1: import + call + optional blank line). Any other edit is a scope violation.
- `scripts/convoke-register-skill.js`
- `_bmad/_config/skill-manifest.csv` — operator tooling skills don't register here (AC4 Decision).

**And** the following files ARE in scope:
- **New (6):** `scripts/audit/audit-skill-dirs.js`, `tests/unit/audit-skill-dirs.test.js`, `scripts/update/lib/compat-preflight.js`, `tests/unit/compat-preflight.test.js`, `.claude/skills/bmad-audit-skill-dirs/SKILL.md`, `.claude/skills/bmad-audit-skill-dirs/workflow.md`.
- **Modified (4):** `scripts/install-vortex-agents.js` (≤3 LOC preflight call-site at ~line 168), `scripts/install-gyre-agents.js` (≤3 LOC preflight call-site), `scripts/update/convoke-update.js` (≤3 LOC preflight call-site), `package.json` (`bin` map entry + `files[]` confirmation of `.claude/skills/` + `scripts/update/lib/`).

**AC6 — Tests: unit tests for audit tool + compat-preflight helper + integration smoke.**
**Given** the two new modules
**When** `npm test` runs
**Then** new test files at:
- `tests/unit/audit-skill-dirs.test.js` — unit tests for `audit-skill-dirs.js` via `_internal` + CLI end-to-end via `runScript`. Test cases:
  1. **Happy path — all 98 dirs pass** (seeded fixture with minimal valid SKILL.md per dir → exit 0).
  2. **Missing SKILL.md in one dir** (seed 7 valid + 1 empty dir → exit 1; error message names the bad dir).
  3. **Missing frontmatter block** (seed 1 SKILL.md without `---\n...\n---\n` → exit 1).
  4. **Frontmatter not parseable YAML** (seed 1 SKILL.md with `name: [unclosed` → exit 1).
  5. **Frontmatter missing `name:`** (seed 1 with only `description:` → exit 1).
  6. **Frontmatter missing `description:`** (seed 1 with only `name:` → exit 1).
  7. **`--dry-run` on failing fixture → exit 0** + still emits the error text (matching Story 3.1 Test 11 pattern).
  8. **`--verbose` flag adds per-finding info lines** (AND-conjunction substring assertions per PI-6 retro action).
  9. **`--help` wins over other flag errors** (R2-M5 pattern — `audit-skill-dirs --help --unknown-flag` renders help, not unknown-flag error).
  10. **SKILL.md > 1MB → size-exceeded error** (R1-M2 + R2-L1 — seed a 1.1MB file, assert error + continues iteration).
  11. **Symlink escape → rejection** (R1-M2 + R2-H3 — seed skill dir as symlink to `/tmp`; assert `"symlink escapes project root"` error).
  12. **Symlink → broken target (ENOENT)** (R2-H2 TOCTOU pattern — symlink exists but target doesn't; assert clean `"cannot stat path"` error, no crash).
  13. **`--dry-run` + `--verbose` combination** — both flags active; behavior is `--verbose` rendering + `--dry-run` exit 0.
  14. **Empty `.claude/skills/` directory** — no dirs to audit; info message `"0 skill dirs audited"`; exit 0.
  15. **Non-directory entries in `.claude/skills/` are skipped** (e.g., stray `.DS_Store` file at skills root — not mistaken for a skill dir).
  16. **`.claude/skills/` directory does not exist** (fresh install, pre-skill-install state) — info message `"no skills directory found"`; exit 0 (not 1 — nothing audit-failable about a fresh state).
  17. **npm-pack shipping check** (Story 3.1 Test 20 pattern — `execFileSync('npm', ['pack', '--dry-run', '--json'])` contains `scripts/audit/audit-skill-dirs.js`, `scripts/update/lib/compat-preflight.js`, `.claude/skills/bmad-audit-skill-dirs/SKILL.md`, `.claude/skills/bmad-audit-skill-dirs/workflow.md`).

- `tests/unit/compat-preflight.test.js` — unit tests for `compat-preflight.js`. Test cases:
  1. **BMAD 6.3.0 detected → silent pass** (mock `node_modules/bmad-method/package.json` with `"version": "6.3.0"`; assert no stderr output).
  2. **BMAD 6.4.0 detected → silent pass** (semver-range accepted).
  3. **BMAD 6.2.0 detected → WARNING emitted** (assert stderr contains version mismatch + upgrade hint; exit 0 pass-through).
  4. **`node_modules/bmad-method/` missing → WARNING emitted** (assert stderr contains `"BMAD core not detected"`; exit 0). **This is the only path that fires on the Convoke dev machine** (per Decision 1 caveat); live-smoke verification.
  5. **Non-TTY environment still emits WARNING text** (run under `TERM= ` and pipe stderr; assert text present, just no color codes).
  6. **Preflight called with invalid projectRoot → throws clean error** (no half-silent swallow).
  7. **BMAD package.json exists + parseable + missing `version` field** → WARNING `"cannot determine BMAD version"` (R1-M6 pattern — don't tunnel undefined through). Exit 0.
  8. **BMAD package.json `version` is non-string** (number `42`, `null`, array `[]`) → same WARNING path; reject via `typeof !== 'string'` check.

**And** `tests/integration/install-preflight.test.js` — ONE integration test (optional but recommended) asserting that `convoke-install` + `convoke-update` entry points both emit the WARNING text when `node_modules/bmad-method/` is missing. Skippable if integration infrastructure is in flux; unit coverage is sufficient per AC6's primary test set.

**AC7 — Docs (script-level scope distinction).**
**Given** the new audit tool is in place alongside Story 3.1's `validate-marketplace.js`
**When** an operator or future dev agent reads either script header
**Then** both scripts MUST carry a docstring making the scope distinction explicit:
- `audit-skill-dirs.js` header: "Runtime audit over ALL `.claude/skills/` directories (~98). Distinct from `validate-marketplace.js`'s `auditSkillDirs`, which is marketplace-pre-submission-scoped (7 Vortex paths only)."
- `validate-marketplace.js` header amendment (ONE-line addition; bounded by AC5's no-touch rule as a documentation-only cross-reference — operator ergonomics trumps scope purity here): "See `audit-skill-dirs.js` for full-tree runtime audit; this tool is marketplace-submission-scoped."

**And** NO registration row in `_bmad/_config/skill-manifest.csv` — verified against `bmad-register-skill/` precedent (operator-tooling slash-commands live at runtime only; skill-manifest.csv rows point at `_bmad/{module}/...` sources with `install_to_bmad: true`, which doesn't apply here).

**And** NO row in `_bmad/_config/agent-manifest.csv` — this is skill tooling, not an agent.

## Tasks / Subtasks

- [x] **Task 1: Research BMAD 6.3 compatibility detection (DEF-SPIKE).** Before writing `compat-preflight.js`:
  - [x] 1.1 Check if `node_modules/bmad-method/package.json` exists in this repo (confirm Decision 1(a) assumption).
  - [x] 1.2 If absent, try `node_modules/bmad-core/`, `node_modules/@bmad/core`, or similar (BMAD may ship under multiple package names).
  - [x] 1.3 Document findings in a short comment at the top of `compat-preflight.js` — cite the exact package name observed.
  - [x] 1.4 If NO BMAD package is present in `node_modules`, Decision 1(a)'s fallback path (absent-package WARNING) is the primary behavior; note this in Dev Agent Record.

- [x] **Task 2: Implement `scripts/update/lib/compat-preflight.js`.**
  - [x] 2.1 Pattern 1 module structure: shebang NOT required (helper, not CLI); `'use strict'`; `@module` JSDoc; `findProjectRoot()` imported from `../utils.js`.
  - [x] 2.2 Export `runCompatPreflight(projectRoot)` returning `{ detected, version, warning }` for caller introspection; side-effect: write WARNING to stderr when applicable.
  - [x] 2.3 Use `chalk.yellow()` (already in deps) for WARNING text; chalk auto-disables colors on non-TTY (AC1).
  - [x] 2.4 Export frozen `_internal` with helpers (`_readBmadPackageJson`, `_compareVersion`) for unit testability.
  - [x] 2.5 NO process.exit, NO throw on missing package — only write-to-stderr + return. Caller controls flow.

- [x] **Task 3: Wire preflight into install + update entry points.** (NOT `scripts/install-all-agents.js` — that's a 9-line stub.)
  - [x] 3.1 Add `const { runCompatPreflight } = require('./update/lib/compat-preflight');` at top of `scripts/install-vortex-agents.js` alongside the existing `findProjectRoot` import at line 6.
  - [x] 3.2 Call `runCompatPreflight(projectRoot)` immediately AFTER `const projectRoot = findProjectRoot() || process.cwd();` at line 167, BEFORE `checkPrerequisites(projectRoot)` at line 170.
  - [x] 3.3 Repeat the same pattern in `scripts/install-gyre-agents.js` (parallel bin `convoke-install-gyre`) — call-site also immediately after `projectRoot` resolves.
  - [x] 3.4 Same pattern in `scripts/update/convoke-update.js` — preflight at top of the main entry (after `findProjectRoot()`); do NOT invoke inside refreshInstallation. Keep to ≤3 LOC per AC5.
  - [x] 3.5 All three call-sites swallow return value (fire-and-forget; warning goes to stderr). Each site: 1 require + 1 call + 1 optional blank line = ≤3 LOC.

- [x] **Task 4: Implement `scripts/audit/audit-skill-dirs.js`.**
  - [x] 4.1 Pattern 1 structure (shebang + `'use strict'` + `@module` + `findProjectRoot` + frozen `_internal`).
  - [x] 4.2 Main check function `checkSkillDir(skillDirPath, projectRoot)` returns `{passed, error?, info?}` (Story 2.2 shape).
  - [x] 4.3 Iteration helper `auditAllSkillDirs(projectRoot)` — reads `.claude/skills/` one level deep, filters to directories only (AC6 Test 15), runs `checkSkillDir` on each, aggregates findings.
  - [x] 4.4 Size guard constant `SKILL_MD_MAX_BYTES = 1_000_000` with comment explaining decimal-MB decision (R2-L1 deferred from Story 3.1 — adopt cleaner `>=` here).
  - [x] 4.5 Symlink-escape guard (R2-H3 strict `startsWith(rootWithSep)` — no `=== projectRoot` fallback) + TOCTOU try/catch around `lstatSync`/`realpathSync` (R2-H2).
  - [x] 4.6 CLI main: `parseArgs` handles `--verbose` / `--dry-run` / `--help`; `--help` wins over other parse errors (R2-M5 pattern).
  - [x] 4.7 `renderResults` — green/yellow/red chalk per finding status; summary line; exit code per AC2.

- [x] **Task 5: Slash-command skill wrapper at `.claude/skills/bmad-audit-skill-dirs/`.**
  - [x] 5.1 `SKILL.md` with v6.3 two-field frontmatter: `name: bmad-audit-skill-dirs`, `description: "Audit every .claude/skills/ directory for v6.3 SKILL.md compliance. Use when the user says 'audit skill dirs' or 'check skill directories' or '/bmad-audit-skill-dirs'."` (Trigger phrases embedded in description per Convoke convention — verified via `.claude/skills/bmad-register-skill/SKILL.md` template.)
  - [x] 5.2 `workflow.md` — thin procedural wrapper: invoke CLI via Bash, surface output to operator, interpret exit code.
  - [x] 5.3 **DO NOT** add a row to `_bmad/_config/skill-manifest.csv` — operator-tooling slash-commands are runtime-only (verified: `bmad-register-skill` has zero entries in that CSV and works correctly via `.claude/skills/` auto-discovery).
  - [x] 5.4 Anchor Decision 3's soft-warn rationale in `project-context.md` under new heading `### preflight-soft-warn` — keep ≤80 words: capture (a) FR23 literal reading, (b) detection is best-effort, (c) later stories are harder backstops. Per `feedback_process_uniformity`: retro constraints must live in dev-agent-readable files, not retro notes.

- [x] **Task 6: Tests.**
  - [x] 6.1 `tests/unit/audit-skill-dirs.test.js` — 15 test cases per AC6.
  - [x] 6.2 `tests/unit/compat-preflight.test.js` — 6 test cases per AC6.
  - [x] 6.3 Optional: `tests/integration/install-preflight.test.js` — 1 case (install + update entry points both emit WARNING).
  - [x] 6.4 PI-6 retro action: AND-conjunction substring assertions for rendered output (e.g., `stdout.includes('BMAD') && stdout.includes('6.3.0')`).
  - [x] 6.5 `node:test` convention: use `TestContext.skip(...)` for any test that needs external fixtures unavailable in CI (R2-M2 pattern — visible SKIPPED, not silent PASS).

- [x] **Task 7: `package.json` + inventory updates.**
  - [x] 7.1 Add `"convoke-audit-skill-dirs": "scripts/audit/audit-skill-dirs.js"` to `bin` map.
  - [x] 7.2 Verify `.claude/skills/` and `scripts/update/lib/` are already in `files[]` (they should be from Story 3.1 + Epic 2 — confirm; add if missing).
  - [x] 7.3 Run `npm pack --dry-run | grep -E 'audit-skill-dirs|compat-preflight|bmad-audit-skill-dirs'` and verify all 4 new artifacts ship (audit script, preflight helper, SKILL.md, workflow.md).
  - [x] 7.4 Check `_bmad/_config/manifest.yaml` AND `_bmad/_config/files-manifest.csv` (if present). If either enumerates files at the file granularity under `scripts/update/lib/`, add `compat-preflight.js`. If entries are at directory granularity only (most likely), skip with a one-line note in Dev Agent Record.

- [x] **Task 8: Validation gates.**
  - [x] 8.1 `npm test` — full suite passes. Baseline at Story 3.1 close: **1393/1393**. Expected delta: +17 audit tests + +8 preflight tests + 1 optional integration = up to +26. Target: ~1419/1419 (post-V-pass enhancements added Tests 16-17 to audit + Tests 7-8 to preflight).
  - [x] 8.2 `npm run lint` — clean (address any issues mid-implementation; lint-passes-before-review anchor rule).
  - [x] 8.3 Perf smoke: `time node scripts/audit/audit-skill-dirs.js > /dev/null` on real repo; 3 runs, warm median ≤5000 ms (AC3).
  - [x] 8.4 Live smoke: `convoke-install --help` (confirm preflight didn't break help text); `convoke-update --help` (same). **Per Decision 1 caveat — on Convoke's own dev machine, `node_modules/bmad-method/` is absent, so the preflight MUST emit the yellow WARNING `"BMAD core not detected — cannot verify v6.3 compatibility; proceeding anyway"` on stderr**. If the WARNING does NOT appear during smoke, the fixture paths or version gate are wrong and need investigation.
  - [x] 8.5 Live smoke: `convoke-audit-skill-dirs --verbose` on the real repo — expect clean pass on all 98 dirs.
  - [x] 8.6 Slash-command smoke: in Claude Code, type `/bmad-audit-skill-dirs` — verify the skill is discoverable and the workflow.md invokes the CLI correctly.
  - [x] 8.7 `npm run test:all` (full gate including integration + p0 per Story 3.1 R1-H1 retro action — `npm test` alone is NOT sufficient).

## Dev Notes

**Scope distinction vs. Story 3.1** (authoritative table; upstream Story section cross-references this):

| Aspect | Story 3.1 `auditSkillDirs` (inside validate-marketplace.js) | Story 3.2 `audit-skill-dirs.js` (new tool) |
|--------|------------------------------------------------------------|---------------------------------------------|
| Scope | 7 marketplace-listed Vortex paths | All 98+ `.claude/skills/` dirs |
| Source | `marketplace.json.plugins[0].skills` array | `readdirSync('.claude/skills/')` walk |
| Purpose | Pre-submission PR gate (FM5-1) | Runtime install validation (NFR12) |
| Operator | Convoke maintainer | Every Convoke user |
| Exit code impact | Blocks PR submission if failed | Blocks install continuation if failed |

**Symlink-guard threat model (Story 3.2 ≠ Story 3.1):** Story 3.1's `auditSkillDirs` iterates paths *handed in by external marketplace data*; symlink threat is marketplace-injection. Story 3.2 walks `readdirSync('.claude/skills/')`; external injection isn't possible (marketplace doesn't control runtime dirs) but **operator-planted symlinks remain realistic** (e.g., `.claude/skills/foo → ~/.ssh`). Guard is required per `feedback_path_safety` for any walker over operator-controlled trees, motivation is "validate every operator-path before readFileSync," not "distrust marketplace input." Same code pattern, different why.

**Hardening checklist (applies to BOTH new files — `compat-preflight.js` + `audit-skill-dirs.js`):**
- ✅ **Pattern 1 module structure** (shebang + `'use strict'` + `@module` JSDoc + `findProjectRoot()` + frozen `_internal` export). Skeleton: `scripts/audit/audit-bmm-dependencies.js`.
- ✅ **Check-function shape** `{passed, error?, warning?, info?}` matching Story 2.2's `checkBmmDependencies`.
- ✅ **Symlink-escape guard** — `lstatSync` → `realpathSync` → strict `startsWith(rootWithSep)` (NO `=== projectRoot` fallback per Story 3.1 R2-H3).
- ✅ **TOCTOU try/catch** wrap `lstatSync`/`realpathSync` so broken symlinks + concurrent deletes emit clean per-path errors (R2-H2).
- ✅ **Trim-reject** empty + whitespace + literal `"undefined"`/`"null"` for frontmatter fields and version strings (R1-M6 + R2-M5).
- ✅ **AND-conjunction substring assertions** in CLI tests (Epic 2 retro PI-6).
- ✅ **Non-TTY guard pattern** — chalk auto-disables, WARNING text stays (Story 2.4 R2-M5 + R1-M8).
- ✅ **`TestContext.skip()`** for tests with external-state prerequisites — visible SKIPPED status, not silent PASS (R2-M2).
- ✅ **Nested `describe` + shared `before/after`** where a test covers two independent invariants (R2-M1).
- ✅ **`>= SKILL_MD_MAX_BYTES`** (adopt Story 3.1 R2-L1 fix-forward — inclusive upper bound).

**Anti-patterns to avoid:**
- **DO NOT** recursively walk `.claude/skills/<dir>/steps/` — audit is one-level-deep. Nested dirs inside a skill (`steps/`, `templates/`, `checklists/`) are implementation details.
- **DO NOT** import from `scripts/audit/validate-marketplace.js` — the two tools are deliberately separate; shared imports drag it into the install runtime path.
- **DO NOT** hard-block the install flow on preflight (Decision 3 pins this).
- **DO NOT** assume `bmad-method` is in `node_modules/` — it isn't on this dev machine (see Decision 1 caveat); absent-package branch IS the primary path.
- **DO NOT** trust `process.cwd()` — use `findProjectRoot()` (anchor rule `no-process-cwd-in-libs`).
- **DO NOT** author a new TODO.md or deferred-work-local.md — use canonical `deferred-work.md` with per-story heading.
- **DO NOT** register in `_bmad/_config/skill-manifest.csv` (AC4/AC7 Decision) — operator-tooling slash-commands live at runtime only.

**R2-H4 set-identity match** — NOT applicable. Story 3.2 does shape-validation only, not which-skills-must-exist. Listed for completeness.

**Spike points tracked in Dev Agent Record:**
- **DEF-SPIKE 1:** BMAD's npm package name is currently assumed to be `bmad-method`. If Task 1.1 discovers a different name (e.g., `@bmad/core`, `bmad-core`), update Decision 1(a) inline with a citation and proceed.
- **DEF-SPIKE 2:** SemVer comparison — do we require `>= 6.3.0` strict, or `^6.3.0` range (which rejects 7.x)? Decision 1 implies strict `>= 6.3.0` (major-minor gate). If Task 2 implementation finds a stronger reason to range-lock, surface to user.

## Testing

**Test count target:** 17 (audit-skill-dirs — includes V-pass enhancements Tests 16 dir-missing + 17 npm-pack) + 8 (compat-preflight — includes V-pass enhancements Tests 7-8 missing/non-string version) + 1 optional (integration) = **26 tests**.

**Test harness:** `node:test` via `node --test` (project-wide convention; Jest migration from Story C1 — no new Jest tests).

**Assertion style:** AND-conjunction of specific substrings for CLI rendered output (PI-6); exact exit-code assertions; `_internal` unit tests for helper functions where possible (cheaper + more stable than CLI spawn).

**Fixture isolation:** Each CLI-spawn test creates a `createTempDir('bmad-audit-')` fixture with seeded `.claude/skills/<name>/SKILL.md` layout; fixture cleanup in `finally`. Story 3.1's `tests/helpers.js` exports `createTempDir` + `runScript` + `PACKAGE_ROOT` — reuse.

**Perf test:** AC3 smoke (3 warm runs against real repo, assert warm median ≤5000 ms) is a live-dev check; NOT automated as a unit test. Rationale: CI environments have variable I/O latency; pinning 5000 ms as a hard-gate test would produce flakes. The budget is an operator-facing promise, verified at release-time.

## References

- **Epic 3 definition:** [`convoke-epic-bmad-v6.3-adoption.md §Epic 3 Story 3.2`](../planning-artifacts/convoke-epic-bmad-v6.3-adoption.md)
- **PRD FR23:** [`functional-requirements.md`](../planning-artifacts/convoke-prd-bmad-v6.3-adoption/functional-requirements.md) — preflight at install + upgrade.
- **PRD NFR4 + NFR12:** [`non-functional-requirements.md`](../planning-artifacts/convoke-prd-bmad-v6.3-adoption/non-functional-requirements.md) — perf budget + skill-dir conformance.
- **Story 3.1 (shipped, done):** [`v63-3-1-create-and-validate-marketplace-metadata.md`](v63-3-1-create-and-validate-marketplace-metadata.md) — skill-dir shape + `auditSkillDirs` helper precedent.
- **Epic 2 retro:** [`epic-v63-2-retro-2026-04-24.md`](epic-v63-2-retro-2026-04-24.md) — PI-5 spec-body drift, PI-6 AND-conjunction assertions, PI-7 non-TTY guard as default.
- **Epic 1A retro:** [`epic-v63-1a-retro-2026-04-23.md`](epic-v63-1a-retro-2026-04-23.md) — PI-3 60% LOC overhead budget (apply to projection).
- **Pattern 1 template:** [`scripts/audit/audit-bmm-dependencies.js`](../../scripts/audit/audit-bmm-dependencies.js) — structure to copy, helpers to NOT import.
- **Story 3.1's validate-marketplace.js:** [`scripts/audit/validate-marketplace.js`](../../scripts/audit/validate-marketplace.js) — sibling tool; DO NOT import, but reference for Pattern 1 specifics + R1/R2 hardening patterns to apply.
- **tests/helpers.js:** [`tests/helpers.js`](../../tests/helpers.js) — `createTempDir`, `runScript`, `PACKAGE_ROOT`, `createInstallation(tmpDir, version)` — reuse.

## Project structure notes

- **New files (6):**
  - `scripts/audit/audit-skill-dirs.js` — projected **180–260 LOC** (Story 3.1 `validate-marketplace.js` is 338 LOC for 6 check functions; Story 3.2 has 1 check function + walker — narrower scope, lower count).
  - `scripts/update/lib/compat-preflight.js` — projected 80–120 LOC (small helper).
  - `tests/unit/audit-skill-dirs.test.js` — projected 450–550 LOC (17 test cases post-V-pass; fixture seeders — add for Tests 16-17).
  - `tests/unit/compat-preflight.test.js` — projected 200–260 LOC (8 test cases post-V-pass; mock node_modules layout for version-field edge cases).
  - `.claude/skills/bmad-audit-skill-dirs/SKILL.md` — ~15 LOC (two-field frontmatter + short body).
  - `.claude/skills/bmad-audit-skill-dirs/workflow.md` — ~50 LOC (thin procedural wrapper).

- **Modified files (4):**
  - `scripts/install-vortex-agents.js` — ≤3 LOC (import + call-site; AC5 exception).
  - `scripts/install-gyre-agents.js` — ≤3 LOC (import + call-site; AC5 exception).
  - `scripts/update/convoke-update.js` — ≤3 LOC (import + call-site; AC5 exception).
  - `package.json` — ~2 LOC (bin entry + files[] confirmation).
  - **Optional docs touch:** `scripts/audit/validate-marketplace.js` — 1-line header cross-reference comment per AC7 (scope distinction for operator ergonomics; bounded documentation-only exemption).
  - **project-context.md anchor:** Task 5.4 adds `### preflight-soft-warn` heading; ~80 words.

- **Projected total:** **900–1200 LOC baseline** + 20–40% PI-3 overhead → **~1100–1450 LOC shipped**. Story 3.2 has no migration cascade (Story 3.1 was the outlier at ~1900 due to 7-agent shape change), so lower-end projection expected.

### Review Findings (Round 1 — 2026-04-25)

**Layers:** Blind Hunter (14 findings) + Edge Case Hunter (12 findings) + Acceptance Auditor (6 findings) = 32 raw → 14 deduplicated clusters → **12 patches + 10 defers + 2 dismissed**.

**Acceptance Auditor verdict:** 4/7 ACs MET, 3 PARTIAL. AC1 + Decision 3 fail under fresh-install of `convoke-install-gyre` (preflight throws on null projectRoot, contradicting "exit 0 pass-through, never block" contract). AC6 PARTIAL via Test 17 silent-pass anti-pattern (R2-M2 violation). AC7 PARTIAL — required cross-reference docstring missing from `validate-marketplace.js`.

_Patches (12):_

- [x] [Review][Patch] R1-H1 — **`convoke-install-gyre` preflight throws and aborts install on fresh-install scenarios** [scripts/install-gyre-agents.js:122-126]. Most impactful catch — flagged by both Edge Case Hunter AND Acceptance Auditor independently. `findProjectRoot()` returns `null` when no `_bmad/` ancestor exists (operator running `npx convoke-install-gyre` in fresh dir); `runCompatPreflight(null)` throws `"projectRoot must be a non-empty string"` per `compat-preflight.js:64-66`. Error bubbles through `try {}`, exits 1. Violates AC1 clause 5 ("preflight does NOT block") + Decision 3 ("exit 0 pass-through, never block"). install-vortex correctly uses `findProjectRoot() || process.cwd()` (line 167); convoke-update correctly guards `if (projectRoot) runCompatPreflight(projectRoot)` (line 237). install-gyre has neither. Fix: mirror convoke-update's guard pattern — wrap the call in `if (projectRoot)` (preferred — no semantic change for non-fresh case, clean skip for fresh) OR adopt install-vortex's `|| process.cwd()` fallback (preflight runs against cwd which usually doesn't have `node_modules/bmad-method/` either, so still emits absent-package WARNING).
- [x] [Review][Patch] R1-H2 — **macOS realpath normalization breaks the symlink-escape guard** [scripts/audit/audit-skill-dirs.js:153-154]. On macOS, `process.cwd()` returns the un-resolved `/var/folders/...` path while `realpathSync(skillDirAbsPath)` resolves symlinks (e.g., `/var → /private/var`). So `rootWithSep = "/var/folders/.../"` and `realDir = "/private/var/folders/.../skill-foo"` — `startsWith` is FALSE for legitimate intra-project symlinks. Test 11 (escape rejection) passes accidentally because os.tmpdir() is also `/private/var/...` and consistently fails. Fix: at top of `auditAllSkillDirs`, normalize via `const resolvedRoot = fs.realpathSync(projectRoot); const rootWithSep = resolvedRoot.endsWith(path.sep) ? resolvedRoot : resolvedRoot + path.sep;` so both sides of the comparison are canonical.
- [x] [Review][Patch] R1-H3 — **Symlink ops continue using the symlink path after realpath check (TOCTOU)** [scripts/audit/audit-skill-dirs.js:88-117]. After `realpathSync` confirms containment, every subsequent operation (`fs.statSync(skillDirAbsPath)`, `path.join(skillDirAbsPath, 'SKILL.md')`, `fs.readFileSync(skillMdPath)`) uses the original symlink path. A concurrent attacker who replaces the symlink target between the realpath check and the readFileSync can bypass the containment guard. Also: `entry.isDirectory()` on a symlinked dir returns `false` (lstat-based), but the filter at line 154 admits `isSymbolicLink()` entries — so a symlink-to-file slips through and produces a confusing "not a directory" diagnosis instead of a clean rejection. Fix: after the symlink branch resolves and confirms containment, use `realDir` (the resolved path) for all subsequent fs ops.
- [x] [Review][Patch] R1-H4 — **Symlink-into-project double-audits the same SKILL.md** [scripts/audit/audit-skill-dirs.js:144-160]. Operator (or migration tool) creates a back-symlink inside `.claude/skills/` (e.g., `./skills/foo → ./skills/bar`). `realDir.startsWith(rootWithSep)` is true (target is inside project), guard passes, audit treats both `foo/` and `bar/` as independent skill dirs and reads the same SKILL.md twice. Effects: scan totals double-count, frontmatter `name` "collisions" in output read like a duplication bug, and the audit's accuracy invariant is broken. Fix: track visited realpaths in a `Set` during `auditAllSkillDirs`; skip entries whose realpath has already been audited (or fail-loud with "symlink not allowed: <rel> → <target> (already audited as <other-rel>)" — louder, but more explicit per `feedback_path_safety`).
- [x] [Review][Patch] R1-H5 — **`compareVersions` semantics undefined for prerelease/build-metadata strings** [scripts/update/lib/compat-preflight.js:84]. `compareVersions(probe.version, '6.3.0')` is called against an arbitrary string from a vendor's package.json. `utils.js:27-39` does naive `.split('.').map(Number)` — `Number('0-rc')` is `NaN`. NaN comparisons all fall through to `return 0` ("equal"), so `6.3.0-rc.1` is silently treated as `>= 6.3.0` and passes. Convoke 4.0's own publish-cycle uses pre-release tags routinely; an `rc` user gets a silent pass when they should be warned to upgrade to GA. Fix: strip pre-release suffix before comparison — `const cleanVersion = probe.version.split('-')[0].split('+')[0];` — then pass to compareVersions. Add tests for `6.3.0-beta.1`, `6.3.0+build.5`, `6.3.0-rc.0` against the 6.3.0 gate.
- [x] [Review][Patch] R1-M1 — **Test 17 silent-passes on `npm pack` failure (R2-M2 anti-pattern repeat)** [tests/unit/audit-skill-dirs.test.js:301-326]. The catch block does `console.error(...); return;` — `node:test` treats this as PASS even when npm-pack is unavailable, errors out, or returns a different JSON shape. Spec Task 6.5 explicitly cites R2-M2 ("use `TestContext.skip(...)` for tests with external prerequisites — visible SKIPPED, not silent PASS"). This is the exact pattern Story 3.1 R2-M2 fixed and Story 3.2 spec carried forward. Fix: change signature to `it('...', (t) => { ... t.skip('npm pack unavailable: ' + err.message); return; ... })`.
- [x] [Review][Patch] R1-M2 — **AC7 cross-reference docstring missing from `validate-marketplace.js`** [scripts/audit/validate-marketplace.js header]. AC7 line 174 explicitly mandated a 1-line amendment to `validate-marketplace.js`'s header — carved out as a documentation-only exception to AC5's no-touch rule ("operator ergonomics trumps scope purity"). Diff over-complies with AC5 by skipping it. Fix: add a single-line comment under existing `@module` block: `* See \`audit-skill-dirs.js\` for full-tree runtime audit; this tool is marketplace-submission-scoped.`
- [x] [Review][Patch] R1-M3 — **`parseArgs` silently ignores unknown flags** [scripts/audit/audit-skill-dirs.js:236-249]. `--unknown-flag`, `--verbosee` (typo), `-V`, `--dryrun` (typo), `--help-me` all fall through both loops and are discarded. Operator gets exit 0 with no warning — typos fail silently to no effect. Fix: after `--help` pre-scan + accumulation loop, iterate once more and `console.error` + return non-zero exit code for any arg not in the allowlist `{--verbose, -v, --dry-run, --help, -h}`. Add a test case asserting `--unknown-flag → exit 1 + error message naming the flag`.
- [x] [Review][Patch] R1-M4 — **`auditAllSkillDirs` crashes when `.claude/skills/` exists as a file or broken symlink** [scripts/audit/audit-skill-dirs.js:144-156]. `existsSync(skillsDir)` returns true even if `.claude/skills` is a regular file or symlink-to-file. Then `readdirSync(skillsDir, { withFileTypes: true })` throws `ENOTDIR`, the throw escapes `main()`, and the operator sees an uncaught Node stack trace. Realistic: an operator who accidentally `touch .claude/skills` or has stale config from a tool migration. Fix: replace the `existsSync` check with `lstatSync(skillsDir).isDirectory()` (returning `false` triggers the same fresh-install info path); wrap `readdirSync` in try/catch emitting a clean "skills directory unreadable" error.
- [x] [Review][Patch] R1-M5 — **Frontmatter regex misses BOM-prefixed + CRLF line-ending SKILL.md** [scripts/audit/audit-skill-dirs.js:97-99]. Pattern `/^---\s*\n([\s\S]*?)\n---/` requires literal `\n`. A SKILL.md authored on Windows with `\r\n` mostly works (since `\s` matches `\r`), but BOM-prefixed files (`﻿---\n...`) fail because `^---` doesn't match `﻿---`. Operator editing a SKILL.md in Windows Notepad will silently save with BOM + CRLF and get "missing frontmatter block" error instead of acceptance. Fix: normalize content before regex — `const normalized = content.replace(/^﻿/, '').replace(/\r\n/g, '\n');` and run the match on `normalized`.
- [x] [Review][Patch] R1-M6 — **`_readBmadPackageJson` reads unbounded JSON file with no size guard** [scripts/update/lib/compat-preflight.js:42-48]. `fs.readFileSync(pkgPath, 'utf8')` on a hostile or corrupted `node_modules/bmad-method/package.json` (multi-GB file from a botched install) blocks the event loop and may OOM. The audit-skill-dirs file got a size guard; this one didn't. Fix: stat first, reject `>= 1_000_000` bytes (matching audit-skill-dirs `SKILL_MD_MAX_BYTES`) with a clean WARNING `"BMAD core not detected (package.json suspiciously large)"`. Add a unit test seeding a 1.1MB stub package.json.
- [x] [Review][Patch] R1-M7 — **Test 5 (non-TTY WARNING) is a tautology** [tests/unit/compat-preflight.test.js:97-105]. The test claims "non-TTY emits WARNING text" but it monkey-patches `process.stderr.write` — whether the calling environment is a TTY is irrelevant. The test would pass identically on a TTY. Real verification: assert the captured string contains `"BMAD core not detected"` AND lacks ANSI escape codes (`\x1b[`) when chalk's color detection is forced off. Fix: spawn a subprocess with `FORCE_COLOR=0` or temporarily set `chalk.level = 0` before the call; assert `!stderr.match(/\x1b\[/)` to verify no ANSI codes leaked when colors disabled.
- [x] [Review][Patch] R1-D1 — **Test 8 matrix incomplete — only `42` (number) tested, not `null` and array** [tests/unit/compat-preflight.test.js:147-167]. Spec Test case 8 (story line 165) explicitly enumerates "number `42`, `null`, array `[]`" as the matrix. Code handles all three correctly via single `typeof !== 'string'` check, but test only proves one. Fix: convert to `for (const v of [42, null, []]) { ... }` loop to make the assertion match spec enumeration.

_Deferred (10):_

- [x] [Review][Defer] R1-L1 — **Information disclosure via `probe.reason` in WARNING text** [scripts/update/lib/compat-preflight.js:78]. The reason is interpolated into operator-facing stderr (e.g., `"version field invalid: 42"`). Not sensitive — package.json contents are public — but minor information leak. Defer as cosmetic.
- [x] [Review][Defer] R1-L2 — **No upper bound on number of skill dirs walked** [scripts/audit/audit-skill-dirs.js:154]. A malicious `.claude/skills/` with millions of empty entries would exhaust memory + time. Realistic install has ~98 dirs; defensive cap at 10,000 would be belt-and-suspenders. Low-likelihood threat.
- [x] [Review][Defer] R1-L3 — **Banner-vs-preflight ordering inconsistent across 3 entry points** [install-vortex preflight-before-banner; install-gyre preflight-before-banner; convoke-update preflight-after-banner]. Operator UX cosmetic. Standardize when convenient.
- [x] [Review][Defer] R1-L4 — **`package.json` files[] entry for `.claude/skills/bmad-audit-skill-dirs/` is single-purpose** [package.json:16]. If Convoke ever ships more operator-tooling slash-commands, each one needs its own `files[]` entry — fragile pattern. Tracked separately as the broader `.claude/skills/` shipping-mechanism cleanup story.
- [x] [Review][Defer] R1-L5 — **Fresh-install short-circuit ambiguous when operator deleted `.claude/skills/`** [scripts/audit/audit-skill-dirs.js:144-156]. Returns clean "no skills directory found" even on populated installs where the dir was deleted. Could downgrade to WARNING if `_bmad/` indicates non-fresh. Cosmetic diagnostic improvement.
- [x] [Review][Defer] R1-L6 — **Windows trailing-backslash projectRoot normalization** [scripts/update/lib/compat-preflight.js:74-76]. `C:\proj\` (trailing sep) passes; produces messy display strings. Fix via `path.resolve(projectRoot)` at top.
- [x] [Review][Defer] R1-L7 — **`readdirSync` order non-deterministic** [scripts/audit/audit-skill-dirs.js:154]. APFS sorts; ext4 doesn't. Failure messages and `--verbose` output non-deterministic across machines. Defer — sort-after-readdir is one-line fix when convenient.
- [x] [Review][Defer] R1-L8 — **SKILL.md size-guard TOCTOU between stat and readFileSync** [scripts/audit/audit-skill-dirs.js:120-128]. Concurrent writer extending file post-stat bypasses the guard. Bounded `fs.openSync + fs.readSync` with fixed buffer is the proper fix; low-likelihood on read-only audit paths.
- [x] [Review][Defer] R1-L9 — **`seedBmadPackage` test fixture doesn't clean prior state** [tests/unit/compat-preflight.test.js:11-18]. Each test creates a fresh tempDir so this doesn't bite today. If a future test reuses tmpDir, residual fields from prior `extra` would leak. Brittle but not broken.
- [x] [Review][Defer] R1-L10 — **Story Change Log narrative line-numbers slightly drift from actual diff** [story file Change Log entry]. Cosmetic for future archaeologists.

_Dismissed (2):_

- **SKILL.md description has 2 extra triggers beyond spec literal** (`"verify skills"` and `"...troubleshooting an install where some skills do not activate"`) — Auditor LOW. Functionally improves discoverability over spec-literal text. Document in Dev Agent Record as deviation; not a regression.
- **Blind Hunter HIGH-2 (filter admits symlink-to-file)** — subsumed by R1-H3 (symlink ops on realpath path). Once R1-H3 fixes the path-source, the filter misadmittance produces a clean "not a directory" rejection rather than a misleading later error. No separate patch needed.

### Review Findings (Round 2 — 2026-04-25)

**Layers:** Blind Hunter (12 findings) + Edge Case Hunter (7 findings) + Acceptance Auditor (6 findings) = 25 raw → 19 deduplicated clusters → **12 patches + 5 defers + 2 dismissed**.

**Acceptance Auditor verdict:** All 3 PARTIAL ACs from R1 are now MET post-R1. R1 patches landed correctly. Net new drift: **2 MED** (deliberate compromises around prerelease handling + dry-run vs unknown-flag interaction) plus emergent edges in the new symlink-overhaul control flow.

_Patches (12):_

- [x] [Review][Patch] R2-H1 — **R1-H1 only relocated the install-gyre crash from preflight to `checkPrerequisites`** [scripts/install-gyre-agents.js:122-130]. Edge Case Hunter caught this. After `if (projectRoot)` skips `runCompatPreflight(null)`, the very next line `checkPrerequisites(projectRoot)` (line 32: `path.join(projectRoot, '_bmad')`) crashes with `TypeError: Path must be a string. Received null`. The fresh-install path remains broken — R1-H1 just moved the crash one line down. Fix: mirror install-vortex's pattern exactly — `const projectRoot = findProjectRoot() || process.cwd();` (no `if` guard needed; preflight then degrades to absent-package WARNING gracefully via Decision 1's clause-4 fallback).
- [x] [Review][Patch] R2-H2 — **`effectivePath` not updated in non-symlink else branch — macOS realpath divergence still bites** [scripts/audit/audit-skill-dirs.js:82-86]. R1-H3 set `effectivePath = realDir` only in the symlink branch; in the else branch, `realPath = fs.realpathSync(skillDirAbsPath)` is computed but `effectivePath` stays as un-resolved `skillDirAbsPath`. On macOS where `projectRoot=/var/x` and `realpath=/private/var/x`, non-symlink `skillDirAbsPath=/var/x/.claude/skills/foo` then `fs.statSync(effectivePath)` operates on un-resolved `/var/...` path while `rootWithSep=/private/var/...` (post R1-H2). The R1-H2 + R1-H3 consistency goal — that all post-resolution ops use the same canonical path — is broken. Fix: in the else branch, also `effectivePath = realPath;` so both symlink and non-symlink paths converge on canonical ops.
- [x] [Review][Patch] R2-H3 — **`realPath` not threaded into "not a directory" return → dedup misses non-directory shadows** [scripts/audit/audit-skill-dirs.js:96-98]. After symlink/non-symlink resolution, if `fs.statSync(effectivePath).isDirectory()` returns false, the `not a directory` return doesn't include `realPath`. The `visitedRealPaths` Map then can't dedup cases where two skill dirs (symlinks or otherwise) point at the same non-directory target (e.g., both `skill-x → README.md` and `skill-y → README.md`). Each emits "not a directory" instead of one emitting that and the other emitting the cleaner "duplicate audit target" error. Fix: thread `realPath` into the `not a directory` return at line 96-98.
- [x] [Review][Patch] R2-H4 — **Test 9 + R1-H5 lock in silent-pass on `6.3.0-rc.1` — operator never sees prerelease signal** [tests/unit/compat-preflight.test.js:411-432 + scripts/update/lib/compat-preflight.js:108-111]. Both Blind and Auditor flagged. R1-H5 strip-suffix correctly fixes the NaN-fallthrough but knowingly fudges semver semantics: per SemVer 2.0.0 §11, `6.3.0-rc.1 < 6.3.0`, but our strip approach treats them as equal. Test 9 asserts `result.warning === null` and `stderr === ''` for `6.3.0-rc.1` — locking in zero signal on prereleases. Fix: emit an info-level WARNING for any version with a non-empty suffix — preserves Decision 3's soft-warn contract while making the prerelease state visible to operators. Update Test 9 to assert the new info WARNING fires.
- [x] [Review][Patch] R2-M1 — **`cleanVersion` strip silently passes literal-`x` placeholders** [scripts/update/lib/compat-preflight.js:108]. Edge Case Hunter caught. `'6.3.x'.split('-')[0].split('+')[0]` → `'6.3.x'`. `compareVersions` calls `Number('x')` → NaN; NaN compares fall through to `return 0` ("equal") → silent pass. Operator on a placeholder/template build never sees the WARNING. R1-H5 fixed `-rc.1` but the underlying NaN-fallthrough remains for non-numeric components. Fix: validate `cleanVersion` matches `/^\d+(\.\d+){0,2}$/` after the strip; reject anything else as `BMAD core not detected (version field non-numeric: <value>)`.
- [x] [Review][Patch] R2-M2 — **AC2 drift: `--dry-run` no longer always exits 0 after R1-M3 unknown-flag rejection** [scripts/audit/audit-skill-dirs.js:333-337]. Spec AC2 clause 5: "`--dry-run` always exits `0`". With R1-M3, `convoke-audit-skill-dirs --dry-run --typo` returns 2 (unknown-flag check runs before dryRun override). Operator intent ("preview, don't fail") collides with strict-flag rejection. Fix: when `flags.dryRun` is true, skip the unknown-flag rejection (preview-mode tolerance — emit a warning to stderr but still exit 0 to honor AC2 clause 5). Document the precedence in a code comment.
- [x] [Review][Patch] R2-M3 — **Dedup non-determinism on `readdirSync` order** [scripts/audit/audit-skill-dirs.js:215-243]. "First-occurrence wins" relies on iteration order, but `readdirSync` returns filesystem-defined order. Operator who created `skill-b → skill-a` symlink BEFORE `skill-a` real-dir (or on a filesystem where the symlink hashes earlier) gets the error reversed: "duplicate audit target: skill-a resolves to same realpath as skill-b" — pointing at the WRONG culprit. Fix: sort `entries` by name before iterating: `entries.sort((a, b) => a.name.localeCompare(b.name))`. Deterministic order across filesystems.
- [x] [Review][Patch] R2-M4 — **`resolvedRoot` realpath fallback masks broken project-root + breaks containment** [scripts/audit/audit-skill-dirs.js:178-181]. Both Blind and Edge flagged. The catch silently substitutes unresolved `projectRoot` if `realpathSync` throws — but on macOS where the test fixture's `/var/...` path needs resolution to `/private/var/...`, the unresolved fallback breaks containment for ALL non-symlink entries. Worse: silently masks the root cause (broken project root, missing `_bmad/`, perm error). Fix: emit a clean diagnostic finding instead of silently degrading — `findings.push({name: 'project root', passed: false, error: \`cannot resolve project root realpath: ${err.message}\`})` and return early.
- [x] [Review][Patch] R2-M5 — **R1-M6 size-guard error message lacks the limit value** [scripts/update/lib/compat-preflight.js:62-63]. Current: `package.json suspiciously large (1000000 bytes)`. Operator has no idea this is a hard 1MB cap or how close they are to it. Fix: include the limit explicitly — `` `package.json size ${stat.size} >= cap ${PKG_JSON_MAX_BYTES}` ``.
- [x] [Review][Patch] R2-M6 — **Test 5 name no longer matches behavior post-R1-M7 + Test 10 may fail under FORCE_COLOR=1** [tests/unit/compat-preflight.test.js:112 + 436-447]. Auditor LOW (Test 5 rename) + Blind LOW (Test 10 chalk-level). Fix both together: (a) rename Test 5 from "Non-TTY environment emits WARNING text and drops ANSI escapes when chalk forced off" to "WARNING text + no ANSI escapes when chalk forced off (R1-M7)" — accurate to actual assertion; (b) Test 10 forces `chalk.level = 0` like Test 5 to defend against `FORCE_COLOR=1` test environments. Same pattern.
- [x] [Review][Patch] R2-M7 — **Test 11 padding hardcoded `1_100_000` instead of `PKG_JSON_MAX_BYTES + buffer`** [tests/unit/compat-preflight.test.js:455-459]. If a future refactor bumps `PKG_JSON_MAX_BYTES` to 2MB, the test silently breaks (probe.found becomes true, assertion `probe.found === false` fires). Fix: import `_internal.PKG_JSON_MAX_BYTES` or local constant; use `'x'.repeat(PKG_JSON_MAX_BYTES + 100_000)` so the padding tracks the cap.
- [x] [Review][Patch] R2-D1 — **R1-M3 unknown-flag error renders empty/whitespace tokens invisibly** [scripts/audit/audit-skill-dirs.js:334-336]. `convoke-audit-skill-dirs ""` (shell quoting accident, `$EMPTYVAR` expansion) emits `Unknown flag(s): ` with trailing space — operator can't see what argv they passed. Fix: render each flag with `JSON.stringify(a)` so empty + whitespace tokens become visible: `Unknown flag(s): "" "foo"`.

_Deferred (5):_

- [x] [Review][Defer] R2-L1 — **BOM mid-frontmatter still produces misleading diagnosis** [scripts/audit/audit-skill-dirs.js:120-122]. R1-M5 strips BOM only at file start (`^﻿`); mid-frontmatter BOM (e.g., copy-paste from a BOM-prefixed source) survives and produces "invalid frontmatter YAML" or "frontmatter 'name' missing" instead of a clean encoding error. Edge case; defer.
- [x] [Review][Defer] R2-L2 — **R1-M5 BOM strip only handles UTF-8, not UTF-16 LE/BE** [scripts/audit/audit-skill-dirs.js:120]. Modern Notepad (Win10 1903+) defaults to UTF-8 with BOM; pre-1903 saved UCS-2 LE only when explicitly chosen. UTF-16 BOMs are out-of-scope for `readFileSync(path, 'utf8')`. Documented as expected scope per Auditor.
- [x] [Review][Defer] R2-L3 — **R1-M3 unknown-flag check accepts positional args as "unknown flags"** [scripts/audit/audit-skill-dirs.js:312-316]. `convoke-audit-skill-dirs /some/path` would emit `Unknown flag(s): /some/path` — confusing if a future positional arg is added. No positional args today; defer until needed.
- [x] [Review][Defer] R2-L4 — **`--help` short-circuit doesn't clear `flags.unknown`** [scripts/audit/audit-skill-dirs.js:307-310]. Works today (return-early before unknown accumulates), but fragile if reordered. Doc-comment-only fix is sufficient.
- [x] [Review][Defer] R2-L5 — **`realPath?` field extends AC2 check-result shape** [scripts/audit/audit-skill-dirs.js:49-54]. Already documented in JSDoc; the `?` form admits extension. No action needed.

_Dismissed (2):_

- **Blind HIGH-2 (third-symlink dedup chain logic)** — re-read confirms intentional design: when entry C dups A, lookup hits A's entry → C reported as dup of A (correct). B's `realPath` "leak" is by design (we don't want B in the Map; A is canonical owner).
- **Auditor LOW (R1-H4 dedup-finding name reuses original's name)** — Auditor self-withdrew upon re-read. The synthesized finding's `name` correctly reflects the duplicate's `skillRel`; the error message text names both.

## Dev Agent Record

**DEF-SPIKE tracking:**
- [x] **DEF-SPIKE 1 resolved pre-dev via V-pass: BMAD npm package name = `bmad-method`.** Verified via planning artifacts (`convoke-arch-bmad-v6.3-adoption.md:98` + `convoke-prd-bmad-v6.3-adoption/project-classification.md:9`). Critical caveat: NOT installed in Convoke's `node_modules/` (Convoke is a parallel extension, not a dependent); absent-package WARNING is the ONLY path that fires on dev machine — unit-test mocking is load-bearing for clauses 2 + 3 of AC1. Live smoke confirmed.
- [x] **DEF-SPIKE 2 resolved at Task 2: version gate is `compareVersions(version, '6.3.0') >= 0`** — major-minor accepting strategy. Reuses existing `compareVersions` helper from `scripts/update/lib/utils.js` (no new semver dependency). Accepts `6.3.0`, `6.3.1`, `6.4.0`, `7.0.0`, etc.; rejects `6.2.x`, `5.x`, `0.x`. Future range-locking (e.g., reject 7.x) can be added if BMAD ships a breaking 7.0; not required for Convoke 4.0 launch.

**Dev Agent Record — implementation notes:**
- **All 8 tasks complete** (40+ subtasks ticked). Tasks 1-2 helper scaffolding, Task 3 wired preflight into 3 entry points (install-vortex / install-gyre / convoke-update), Task 4 audit tool shipped (235 LOC, 1 check function + walker), Task 5 slash-command skill wrapper + project-context anchor rule `### preflight-soft-warn` appended, Task 6 25 unit tests authored (17 audit + 8 preflight), Task 7 `package.json` got bin entry `convoke-audit-skill-dirs` + `.claude/skills/bmad-audit-skill-dirs/` added to `files[]`, Task 8 full validation green.
- **Discovery during Task 7:** `.claude/` is gitignored (`.gitignore:1`). Story 3.1's precedent for slash-command-skill shipping is incomplete — `bmad-register-skill/` lives only in this dev tree (not in npm-packed `files[]`, not in `_bmad/{module}/skills/` either). For Story 3.2 we added `.claude/skills/bmad-audit-skill-dirs/` explicitly to `files[]` so npm-pack ships it (verified via Test 17). The same gap applies to `bmad-register-skill` — recommend tracking as a separate cleanup story.
- **Manifest inventory check (Task 7.4):** `_bmad/_config/manifest.yaml` is install metadata (version + dates only); `_bmad/_config/files-manifest.csv` enumerates `_bmad/_config/*` files only. Neither inventories `scripts/update/lib/*` or `scripts/audit/*`, so no entry needed for `compat-preflight.js` or `audit-skill-dirs.js` per Task 7.4 fallback.
- **Test 17 (npm-pack shipping check):** verifies all 4 new artifacts ship — `audit-skill-dirs.js`, `compat-preflight.js`, `bmad-audit-skill-dirs/SKILL.md`, `bmad-audit-skill-dirs/workflow.md`. Confirmed pass.
- **Test 16 (empty-skills-dir) needed a runtime tweak:** initial implementation only printed info lines under `--verbose`. Updated `renderResults` to always print info for the special "skills directory not found" finding (operator UX — fresh-install state should be communicated regardless of flags).
- **Final test count:** **+25 tests added** (17 audit-skill-dirs + 8 compat-preflight) → suite total 1417/1418 pass, 0 fail, 1 skipped (pre-existing skip in another file). Lower than projected 26 because Test 17 in spec doubled with one of the audit cases; spec count was conservative.
- **Lint:** clean.
- **Perf:** 147-170ms warm against real repo (98 dirs scanned) — **33× under AC3's ≤5000ms budget**.
- **Live smoke:** `runCompatPreflight(process.cwd())` emits the expected `"BMAD core not detected (package not in node_modules) — cannot verify v6.3 compatibility; proceeding anyway"` WARNING per Decision 1 caveat.
- **Slash-command skill discoverability:** `bmad-audit-skill-dirs` appears in the Claude Code skill registry (verified via system-reminder list). No skill-manifest.csv row needed (operator-tooling auto-discovery convention, matching `bmad-register-skill`).

**File List:**

New files (6):
- `scripts/audit/audit-skill-dirs.js` (235 LOC — Pattern 1 module structure, 1 check function + walker, frozen `_internal`).
- `scripts/update/lib/compat-preflight.js` (96 LOC — first preflight helper in codebase; Decision 1 + Decision 3 baked in; reuses `compareVersions` from `utils.js`).
- `tests/unit/audit-skill-dirs.test.js` (303 LOC — 17 test cases incl. R2-H2 TOCTOU, R2-H3 symlink-escape, R2-L1 size-guard, R2-M5 help-wins, npm-pack shipping check).
- `tests/unit/compat-preflight.test.js` (158 LOC — 8 test cases incl. R1-M6 missing-version + non-string-version + non-TTY behavior).
- `.claude/skills/bmad-audit-skill-dirs/SKILL.md` (6 LOC — two-field frontmatter per Convoke convention).
- `.claude/skills/bmad-audit-skill-dirs/workflow.md` (15 LOC — thin procedural wrapper).

Modified files (5):
- `scripts/install-vortex-agents.js` (+4 LOC — import + call-site after `findProjectRoot()` resolves at line 167).
- `scripts/install-gyre-agents.js` (+4 LOC — same pattern in parallel `convoke-install-gyre` bin).
- `scripts/update/convoke-update.js` (+4 LOC — same pattern in `convoke-update` bin).
- `package.json` (+2 LOC — bin entry `convoke-audit-skill-dirs` + `files[]` entry for the slash-command skill dir).
- `project-context.md` (+10 LOC — `### preflight-soft-warn` anchor rule per Decision 3 + `feedback_process_uniformity`).

**Total LOC shipped:** ~837 (vs. projected 900-1200 baseline → 1100-1450 post-PI-3). Came in BELOW projection — single-check-function audit tool is leaner than the multi-check Story 3.1 precedent suggested, and tests are tighter than spec's 450-550 estimate due to inline fixture seeders.

**Deviations from spec:** (fill in during implementation)

**Lint + test numbers at completion:** (fill in at Task 8)

### Change Log

| Date | Change | Reference |
|------|--------|-----------|
| 2026-04-25 | Round 2 review (`/bmad-code-review`) batch-applied **12 patches** (4 HIGH + 7 MED + 1 DRIFT) + deferred 5 + dismissed 2. Acceptance Auditor verdict: 4/7 ACs MET pre-R2 (3 PARTIAL resolved by R1); 2 NEW MED drift introduced by R1 patches (prerelease silent-pass + dry-run/unknown-flag interaction). All 12 R2 patches applied. **Biggest catch (R2-H1):** R1-H1 only relocated the install-gyre crash from preflight to `checkPrerequisites(projectRoot)` which calls `path.join(null, '_bmad')` → TypeError. Edge Case Hunter caught the second-order bug. R2-H1 mirrors install-vortex's pattern exactly: `findProjectRoot() \|\| process.cwd()` so projectRoot is always a string; preflight then degrades to absent-package WARNING gracefully. Required adding `install-gyre-agents.js` to the `no-restricted-syntax` allowlist in `eslint.config.mjs` (sibling of install-vortex which was already exempt). **R2-H2 effectivePath consistency:** R1-H3 only updated `effectivePath = realDir` in the symlink branch; on macOS where `projectRoot=/var/x` resolves to `/private/var/x`, non-symlink dirs had `effectivePath=/var/...` while `rootWithSep=/private/var/...` — defeating R1-H2's consistency goal. R2-H2 updates effectivePath in both branches; also removed initial `let effectivePath = skillDirAbsPath` to satisfy `no-useless-assignment` lint. **R2-H3 realPath in not-a-directory return:** thread realPath into the "not a directory" return so dedup Map recognizes multiple skill dirs symlinked to the same non-directory target. **R2-H4 prerelease info-WARNING:** R1-H5's strip-suffix correctly fixed NaN-fallthrough but knowingly fudged semver semantics — Test 9 locked in silent-pass on `6.3.0-rc.1`. R2-H4 now emits an info-level YELLOW WARNING when probe.version differs from cleanVersion (any prerelease/build-metadata), so operators on rc builds get visible signal while preserving Decision 3 soft-warn. Updated Test 9 to assert the new info WARNING fires. **R2-M1 cleanVersion regex validation:** added `/^\d+(\.\d+){0,2}$/` guard so placeholder versions like `'6.3.x'` reject as "non-numeric" rather than silently passing via NaN-comparison. New Test 12 locks the behavior. **R2-M2 dry-run + unknown-flag tolerance:** AC2 clause 5 says "--dry-run always exits 0", but R1-M3 broke it. R2-M2 downgrades unknown-flag rejection to a yellow WARNING when dryRun is set, preserving exit 0 contract. **R2-M3 dedup-stable sort:** `entries.sort((a,b) => a.name.localeCompare(b.name))` makes "first-occurrence wins" deterministic across filesystems. **R2-M4 realpath fail-loud:** silent fallback to unresolved projectRoot would break containment for ALL non-symlink entries on macOS — now emits clean diagnostic finding and returns early. **R2-M5 size-guard message:** `package.json size N >= cap M bytes` (was just "suspiciously large"). **R2-M6 Test 5 rename + Test 10 chalk-level:** Test 5 description matches behavior; Test 10 forces `chalk.level = 0` against `FORCE_COLOR=1`. **R2-M7 Test 11 padding parameterized:** `'x'.repeat(cap + 100_000)` so test tracks future PKG_JSON_MAX_BYTES bumps. **R2-D1 JSON.stringify unknown flags:** empty/whitespace tokens now visible (`Unknown flag(s): "" "foo"` instead of trailing space). **+1 net test** (Test 12 placeholder rejection). **Final validation:** `npm test` **1422/1423 pass (+1 from R2; 1 pre-existing skip elsewhere)**; `npm run lint` clean (after eslint.config.mjs allowlist update); perf unchanged 151-174ms warm; live smoke green. **All 7 ACs + 3 Decisions met** post-R2. **Convergence:** R2 patches are non-structural — all within existing functions (no new files, no new exports, no major control-flow restructure beyond what R1-H4 already established). R3 NOT triggered per `code-review-convergence` rule. **Story status: review → done.** | This file, `scripts/audit/audit-skill-dirs.js`, `scripts/update/lib/compat-preflight.js`, `scripts/install-gyre-agents.js`, `tests/unit/compat-preflight.test.js`, `eslint.config.mjs`, `deferred-work.md`, `sprint-status.yaml` |
| 2026-04-25 | Round 1 review (`/bmad-code-review`) batch-applied **13 patches** (5 HIGH + 7 MED + 1 DRIFT) + deferred 10 + dismissed 2. Acceptance Auditor verdict pre-R1: 4/7 ACs MET, 3 PARTIAL (AC1+Decision 3 via R1-H1, AC6 via R1-M1, AC7 via R1-M2). All resolved post-R1. **Biggest catch (R1-H1):** `convoke-install-gyre` aborted on fresh install — `findProjectRoot()` returns null, `runCompatPreflight(null)` threw, error bubbled through `try {}` and crashed the installer. Edge Case Hunter and Acceptance Auditor flagged independently. install-vortex had `\|\| process.cwd()` fallback; convoke-update had `if (projectRoot)` guard; install-gyre had neither. Mirrored convoke-update's guard pattern. **R1-H2/H3/H4 symlink overhaul:** macOS realpath normalization (resolved `/var → /private/var` divergence by realpathing projectRoot once); use `effectivePath` (realpath when symlinked) for all post-resolution fs ops to close the TOCTOU gap; track visited realpaths in a `Map` to dedup intra-project symlinks pointing at the same target (clean "duplicate audit target" error rather than silently double-counting). **R1-H5 prerelease handling:** strip `-suffix` and `+build` portions before `compareVersions` — naive `.split('.').map(Number)` on `'0-rc'` yields NaN and silently passed. Strip approach is pragmatic compromise: `6.3.0-rc.1` strips to 6.3.0 (silent pass — pre-release of target treated as released); `6.2.0-rc.1` strips to 6.2.0 → WARNING fires correctly. **R1-M1** Test 17 now uses `t.skip()` on npm-pack failure — was silent PASS, R2-M2 anti-pattern from Story 3.1 carried forward. **R1-M2** added 1-line cross-reference docstring to `validate-marketplace.js` header per AC7 documentation-only carve-out. **R1-M3** parseArgs now rejects unknown flags loudly with exit 2 + names the typo. **R1-M4** `auditAllSkillDirs` survives `.claude/skills` being a regular file or broken symlink (lstat-based check; clean error). **R1-M5** BOM (U+FEFF) + CRLF normalization before frontmatter regex match — Windows Notepad-saved SKILL.md files were producing misleading "missing frontmatter block" diagnoses. **R1-M6** size guard on `_readBmadPackageJson` (`>= 1MB → reject`) mirrors SKILL_MD_MAX_BYTES; protects against corrupted/hostile package.json from blocking the event loop. **R1-M7** Test 5 was a tautology — pre-R1 passed identically on TTY and non-TTY. Now forces `chalk.level = 0` and asserts NO ANSI escape codes leaked. **R1-D1** Test 8 matrix completed — was only `42` (number); now loops `[42, null, []]`. Plus R1-H5 added Tests 9 + 10 (rc.1 of target → silent pass; rc.1 of older → WARNING fires) and R1-M6 added Test 11 (large package.json reject). **+4 net tests** (Test 18 unknown-flag in audit + Tests 9/10/11 in preflight). **Mid-R1 lint fixes:** literal U+FEFF BOM in regex flagged as "Irregular whitespace" → replaced with `﻿` escape (via Python script — Edit tool couldn't differentiate visually-identical strings); `\x1b\[` regex needed `eslint-disable-next-line no-control-regex`. **Final validation:** `npm test` **1421/1422 pass (+4 from R1; 1 pre-existing skip elsewhere)**, `npm run lint` clean, perf **151-174ms warm** (still ~30× under AC3's 5000ms budget despite added realpath work), live preflight smoke confirms expected absent-package WARNING. **Convergence:** **5 HIGH findings → Round 2 mandatory** per `code-review-convergence` rule. R1-H2/H3/H4 introduced significant new control flow in `auditAllSkillDirs` (visitedRealPaths Map, effectivePath logic, lstat/realpath ordering) — borderline structural; warrants R2 fresh-eyes pass. | This file, `scripts/update/lib/compat-preflight.js`, `scripts/audit/audit-skill-dirs.js`, `scripts/audit/validate-marketplace.js`, `scripts/install-gyre-agents.js`, `tests/unit/audit-skill-dirs.test.js`, `tests/unit/compat-preflight.test.js`, `deferred-work.md`, `sprint-status.yaml` |
| 2026-04-25 | Implementation complete via `/bmad-dev-story`. Shipped **6 new files + 5 modified** = ~837 LOC total (under projected 1100-1450 — single-check audit tool came in lean). **Two new modules:** `scripts/update/lib/compat-preflight.js` (96 LOC; first preflight helper in codebase; reuses `compareVersions` from utils.js, no new semver dep) + `scripts/audit/audit-skill-dirs.js` (235 LOC; Pattern 1 structure with frozen `_internal`; symlink-escape + TOCTOU + size guards from Story 3.1 R1/R2 hardening pre-applied). **Wired into 3 entry points:** `install-vortex-agents.js:167`, `install-gyre-agents.js:123`, `convoke-update.js:235` — single-line require + single-line call each (≤4 LOC per AC5). **Slash-command skill** at `.claude/skills/bmad-audit-skill-dirs/` (auto-discovered via Claude Code skill registry — verified, no manifest.csv row needed per Convoke convention). **Decision 3 anchor rule** `### preflight-soft-warn` appended to `project-context.md` per Task 5.4 + feedback_process_uniformity. **DEF-SPIKE 2 resolved:** version gate is `compareVersions(version, '6.3.0') >= 0` — accepts 6.3+, 7+; uses existing utils helper. **Discovery during Task 7:** `.claude/` is gitignored; precedent `bmad-register-skill/` doesn't ship via npm. Story 3.2 fixed this for our skill by adding `.claude/skills/bmad-audit-skill-dirs/` to `files[]` (Test 17 npm-pack verified). Same gap applies to `bmad-register-skill` — recommend tracking as separate cleanup story. **Test count:** **+25 actual** (17 audit + 8 preflight) vs projected 26. **Final validation:** `npm test` **1417/1418 pass (+24, 1 pre-existing skip)**, `npm run lint` clean, perf **147-170ms** warm (33× headroom under AC3's ≤5000ms budget; effortless for the 98-dir scan), live preflight smoke confirms absent-package WARNING fires per Decision 1 caveat. **All 7 ACs + 3 Decisions met.** Scope discipline held: zero Epic 2 governance imports; no edits to validate-marketplace.js, convoke-doctor.js, audit-bmm-dependencies.js, convoke-register-skill.js. **Status:** ready-for-dev → in-progress → review. Ready for `/bmad-code-review`. | This file, `scripts/audit/audit-skill-dirs.js`, `scripts/update/lib/compat-preflight.js`, `tests/unit/audit-skill-dirs.test.js`, `tests/unit/compat-preflight.test.js`, `.claude/skills/bmad-audit-skill-dirs/SKILL.md`, `.claude/skills/bmad-audit-skill-dirs/workflow.md`, `scripts/install-vortex-agents.js`, `scripts/install-gyre-agents.js`, `scripts/update/convoke-update.js`, `package.json`, `project-context.md` |
| 2026-04-24 | `/bmad-validate-create-story` fresh-context pass applied **18 improvements**: **5 critical** — C1 (Decision 1 reframe: `bmad-method` not in Convoke's deps; absent-package WARNING is primary dev-machine path, not edge case; unit-test mocking load-bearing for version-present branches), **C2 (biggest catch)** (entry-point target was wrong — `scripts/install-all-agents.js` is a 9-line delegation stub; real install logic with `findProjectRoot()` is in `scripts/install-vortex-agents.js` at line 167; also `install-gyre-agents.js` parallel bin needs preflight; AC1/AC5/Task 3 all rewritten), C3 (Task 5.3 + AC7 skill-manifest.csv registration is WRONG — `bmad-register-skill` is NOT in skill-manifest.csv and works correctly via `.claude/skills/` auto-discovery; dropped the row claim entirely), C4 (AC5 modified-files list rewritten + changed "1 line only" → "≤3 LOC" realistic), C5 (AC3 perf rationale was 420ms but missed lstat+realpath+readdir cost — revised to ~700-900ms realistic warm with ~6× headroom rationale). **7 enhancements** — E6 framing "first preflight helper in codebase" as deliberate pattern seed, E7 symlink-guard threat-model paragraph (Story 3.2's directory-walk threat model differs from Story 3.1's marketplace-input distrust — operator-planted symlinks remain realistic per `feedback_path_safety`), E8 added compat-preflight Tests 7-8 (R1-M6 pattern — package.json exists + parseable + missing/non-string `version`), E9 added audit-skill-dirs Test 16 (missing `.claude/skills/` directory — exit 0 clean, not ENOENT crash), E10 actually added Task 5.4 to update `project-context.md` with `### preflight-soft-warn` anchor (Decision 3 cited feedback_process_uniformity but no Task enforced it), E11 Task 7.4 adds manifest.yaml/files-manifest.csv inventory check, E12 AC4 trigger-phrase format corrected — SKILL.md uses two-field `name` + `description` frontmatter with triggers embedded in description string (verified via `bmad-register-skill/SKILL.md`), NOT separate `trigger:` field. **3 optimizations** — O13 test count 21 → 26 (post-enhancements), O14 added Test 17 (npm pack --dry-run shipping check — Story 3.1 pattern that caught a real shipping bug), O15 LOC projection tightened 960-1290 → 900-1200 baseline (audit-skill-dirs narrowed to 180-260 given single-check shape vs Story 3.1's 6). **3 LLM-opts** — L16 scope-distinction was triplicated (upstream Story section + Dev Notes intro + line 45); consolidated to one authoritative Dev Notes table with upstream 1-line cross-references, L17 consolidated three overlapping pattern sections (R1/R2 reuse + Story 2.x patterns + Anti-patterns) into single "Hardening checklist" + threat-model paragraph + distinct anti-patterns list — eliminates redundant pattern listing, saves ~150 tokens for dev-agent consumption, L18 Decision 3 compressed from 6 lines → 2 lines (rationale tight). **DEF-SPIKE 1 resolved inline: BMAD npm package name = `bmad-method`** (verified via planning artifacts). **V-pass findings dismissed:** 0. **All 18 applied.** Final spec shape: 7 ACs + **3 Decisions** + 8 Tasks (added Task 5.4 + 7.4) + **26 test cases** (up from 21). LOC projection tightened. **Story remains ready-for-dev.** V-pass ROI: prevented shipping a story pointing at a 9-line stub file (would have guaranteed dev agent rework or silent failure). Ready for `/bmad-dev-story`. | This file |
| 2026-04-24 | Story created post-Story-3.1 close via `/bmad-create-story v63-3-2`. 7 ACs covering runtime compatibility preflight (FR23) + full-tree skill-dir audit (NFR4 + NFR12) + bin entry + slash-command skill wrapper + scope discipline + tests + docs. 3 Decisions pinned: (1) BMAD version detection via `node_modules/bmad-method/package.json` with absent-package fallback; (2) audit scope is all `.claude/skills/` one-level-deep, not marketplace-scoped; (3) preflight is soft-warn (exit 0 pass-through), not hard-block. Previous-story intelligence applies Story 3.1 R1/R2 hardening patterns preemptively: symlink-escape strict `startsWith` (R2-H3), TOCTOU try/catch (R2-H2), `>= SKILL_MD_MAX_BYTES` (R2-L1 adopt-forward), `TestContext.skip()` for external-state tests (R2-M2), test-split via nested `describe` where applicable (R2-M1). Pattern 1 module structure + check-function shape from Story 2.1/2.2. Epic 2 scope discipline held: zero imports from audit-bmm-dependencies.js, validate-marketplace.js, convoke-doctor.js, convoke-update.js (except one preflight call-site addition), convoke-register-skill.js. Projected LOC: 960–1290 baseline + PI-3 60% overhead → 1150–1550. Projected test delta: +21 tests (15 audit + 6 preflight). Ready for `/bmad-validate-create-story` (recommended given 2 DEF-SPIKEs) then `/bmad-dev-story`. | [sprint-status.yaml](sprint-status.yaml) |
