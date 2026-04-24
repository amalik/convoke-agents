---
initiative: convoke
artifact_type: story
qualifier: v63-3-2-compatibility-preflight-and-skill-dir-audit
created: '2026-04-24'
schema_version: 1
epic: v63-epic-3
---

# Story 3.2: Compatibility preflight and skill-dir audit

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

**Epic:** [Epic 3 — Discover via BMAD Marketplace](../planning-artifacts/convoke-epic-bmad-v6.3-adoption.md#epic-3-discover-via-bmad-marketplace)
**Sprint:** 4 (WS2/P23 marketplace stream)
**FR coverage:** FR23 (runtime compatibility preflight at install + upgrade — protects against the missing `bmad_version` field in marketplace schema).
**NFR coverage:** NFR4 (audit-skill-dirs scan completes ≤5s on full install), NFR12 (agent SKILL.md files conform to v6.3 skill-dir convention).
**Failure modes addressed:** FM5-1 (skills[] paths lack SKILL.md — now detected across the full `.claude/skills/` tree, not just marketplace-listed paths). Story 3.1 shipped marketplace-scoped audit (7 Vortex agents); Story 3.2 adds full-install audit (98+ skill dirs).

**Upstream dependencies:**
- **Story 3.1 shipped `validate-marketplace.js` with `auditSkillDirs` helper** scanning marketplace-listed paths (7 Vortex agents). Story 3.2 builds a separate tool for the FULL skill-dir tree (~98 dirs across core, bmm, cis, tea, wds, bme modules). Different scope → different tool; no code sharing with validate-marketplace.js.
- Story 3.1 migrated Vortex agents to skill-dir shape (`<id>/SKILL.md`) — that migration's per-directory `SKILL.md` layout is the canonical shape audit-skill-dirs enforces.
- **No upstream code dependencies on Epic 2** — zero imports from `scripts/audit/audit-bmm-dependencies.js`, `scripts/convoke-doctor.js`, `scripts/update/convoke-update.js`, `scripts/convoke-register-skill.js`.

**Downstream consumers:**
- **Story 3.3 (submit marketplace registry PR)** — requires audit-skill-dirs to pass cleanly before the PR can be opened (alongside 3.1's validate-marketplace).
- **Story 3.4 (dual-distribution parity verification)** — both install paths must produce skill-dir trees that pass audit-skill-dirs identically.
- **Story 3.5 (platform adapter batch validation)** — operates on Tier 1 skills; audit-skill-dirs confirms the source tree is clean before export.
- **Convoke 4.0 publication gate** — `convoke-install` + `convoke-update` preflight is the runtime safety net for users on BMAD < 6.3.

**Namespace decision:**
- `scripts/audit/audit-skill-dirs.js` + `tests/unit/audit-skill-dirs.test.js` — new audit CLI + tests. Pattern 1 reuse from Story 2.1's `audit-bmm-dependencies.js` and Story 3.1's `validate-marketplace.js` (shebang + `'use strict'` + `@module` JSDoc + `findProjectRoot()` + frozen `_internal` export).
- `scripts/update/lib/compat-preflight.js` — new shared helper for FR23 preflight check, consumed by `scripts/install-all-agents.js` (install path) and `scripts/update/convoke-update.js` (upgrade path). Lives in `scripts/update/lib/` alongside the other shared install-time helpers (`utils.js`, `version-detector.js`, `refresh-installation.js`, etc.) — NOT in `scripts/audit/` (audit is validation-at-rest; preflight is gatekeeping-at-install-time).
- `.claude/skills/bmad-audit-skill-dirs/` — new slash-command skill wrapper per `feedback_slash_command_ux` memory (all user-facing tools must be BMAD slash-command skills, not CLI-only).
- **Covenant compliance checklist:** NOT applicable — no new `_bmad/bme/*` agent skill being authored. The `.claude/skills/bmad-audit-skill-dirs/` wrapper is operator tooling, not a user-facing agent.

## Story

As a Convoke installer (operator running `convoke-install` or `convoke-update` for the first time on a v3.x → v4.0 upgrade, OR a new user discovering Convoke through the BMAD marketplace),
I want runtime validation that my BMAD version is compatible AND that every skill directory in my install has a v6.3-compliant `SKILL.md`,
so that installation fails loud (with actionable guidance) when preconditions aren't met — instead of silently producing a broken install that crashes at first agent activation.

**Scope distinction vs. Story 3.1:** Story 3.1's `validate-marketplace.js` audits the 7 marketplace-listed Vortex paths (FM5-1 pre-submission gate). Story 3.2's `audit-skill-dirs.js` audits **every skill directory in `.claude/skills/`** (98+ wrappers across all installed modules). Different scope, different failure modes, different operators (maintainer-submitting-PR vs. operator-installing). The two tools coexist as specialists.

## Acceptance Criteria

**Decision 1 (pinned): BMAD version detection strategy.** FR23 exists because marketplace schema lacks a `bmad_version` field — we can't read it from the plugin metadata directly. Options considered:
- **(a) Read `node_modules/bmad-method/package.json`'s `version` field** (selected). BMAD is distributed as an npm package (`bmad-method`); if present in `node_modules`, the installer is on a proper BMAD install. Version string is authoritative. If `bmad-method` is absent from `node_modules` (standalone/git-clone install), emit a WARNING noting "BMAD core not detected — cannot verify v6.3 compatibility; proceed at your own risk" but do not block. This matches the user intent of `install` and `update` being best-effort in unusual environments.
- **(b) Parse `_bmad/*/config.yaml` for markers** — rejected: config.yaml doesn't declare BMAD version; Convoke's config stamps Convoke version, not BMAD. Would require sniffing module-specific markers (fragile).
- **(c) Require operator to pass `--bmad-version` flag** — rejected: defeats the point of automated preflight; operators won't know the version offhand.

**Decision 2 (pinned): audit-skill-dirs scope — all `.claude/skills/` dirs.** The audit scans **every** directory under `.claude/skills/` (the runtime install target), reporting any dir missing `SKILL.md` or with non-v6.3 frontmatter. NOT marketplace-scoped (that's 3.1); NOT source-tree-scoped (source is `_bmad/` — audit operates on the post-install runtime layout which is what Claude Code / Cursor / Copilot actually load). Scope rationale: a broken runtime wrapper breaks agent activation regardless of source cleanliness, and the runtime layout is the flattest, most-uniform target (98+ identical-shape directories).

**Decision 3 (pinned): Preflight is soft-warn, not hard-block.** FR23 says "emits version warning"; AC1 implements that as stderr warning + exit 0 (continue install). Operator sees the warning but can proceed. Rationale: (a) BMAD version detection is best-effort (Decision 1(a) has a fallback path for unusual installs); (b) false-positive hard-blocks would trap operators whose environments legitimately deviate; (c) Story 3.2 is the FIRST preflight, not the final one — Story 3.3's publish-gate and Story 4.x's behavioral-equivalence validation are the harder backstops. Per `feedback_process_uniformity`: anchor this in `project-context.md` so the rationale is dev-agent-readable, not just retro-documented.

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

**And** the preflight helper MUST live at [`scripts/update/lib/compat-preflight.js`](../../scripts/update/lib/compat-preflight.js) and export `runCompatPreflight(projectRoot)` — called from both `scripts/install-all-agents.js` and `scripts/update/convoke-update.js` at the top of each entry point (after `findProjectRoot()`, before any config read).

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
- **Budget rationale:** 98 dirs × (1 stat + 1 readFileSync + 1 YAML parse) ≈ 98 × (0.3ms + 2ms + 2ms) ≈ 420ms pure I/O. 5000ms gives 10× headroom over cold-start realistic cost; catches anything worth investigating (e.g., accidentally recursive traversal, unbounded reads).

**AC4 — Bin entry + slash-command skill wrapper per `feedback_slash_command_ux` memory.**
**Given** the operator wants to invoke the audit
**When** they type `/bmad-audit-skill-dirs` in Claude Code OR run `convoke-audit-skill-dirs` in their shell
**Then** both invocations MUST work:
- **CLI bin:** `package.json` `bin` map gets `"convoke-audit-skill-dirs": "scripts/audit/audit-skill-dirs.js"` alongside the existing `convoke-validate-marketplace` entry.
- **Slash-command skill:** new `.claude/skills/bmad-audit-skill-dirs/` directory with `SKILL.md` + `workflow.md`. `SKILL.md` frontmatter declares the trigger phrase `"audit skill dirs"` / `"check skill directories"` (matching the BMAD slash-command naming convention). `workflow.md` is a thin wrapper that invokes the CLI and surfaces its output to the operator.
- **Discoverability:** slash command appears in the agent catalog via `_bmad/_config/skill-manifest.csv` — add one row for `bmad-audit-skill-dirs`.

**AC5 — Scope discipline: zero Epic 2 governance imports; zero changes to Story 3.1's `validate-marketplace.js`.**
**Given** the Story 3.2 diff
**When** `git diff HEAD --stat` is reviewed
**Then** the following files MUST NOT appear in the diff:
- `scripts/audit/audit-bmm-dependencies.js`
- `scripts/audit/validate-marketplace.js`
- `scripts/convoke-doctor.js`
- `scripts/update/convoke-update.js` — **EXCEPTION:** ONE addition allowed (preflight call-site; AC1). Any other edit to this file is a scope violation.
- `scripts/convoke-register-skill.js`

**And** the following files ARE in scope:
- **New:** `scripts/audit/audit-skill-dirs.js`, `tests/unit/audit-skill-dirs.test.js`, `scripts/update/lib/compat-preflight.js`, `tests/unit/compat-preflight.test.js`, `.claude/skills/bmad-audit-skill-dirs/SKILL.md`, `.claude/skills/bmad-audit-skill-dirs/workflow.md`.
- **Modified:** `scripts/install-all-agents.js` (preflight call-site), `scripts/update/convoke-update.js` (preflight call-site, 1 line only), `package.json` (`bin` + `files[]` additions), `_bmad/_config/skill-manifest.csv` (1 new row for the slash-command skill).

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

- `tests/unit/compat-preflight.test.js` — unit tests for `compat-preflight.js`. Test cases:
  1. **BMAD 6.3.0 detected → silent pass** (mock `node_modules/bmad-method/package.json` with `"version": "6.3.0"`; assert no stderr output).
  2. **BMAD 6.4.0 detected → silent pass** (semver-range accepted).
  3. **BMAD 6.2.0 detected → WARNING emitted** (assert stderr contains version mismatch + upgrade hint; exit 0 pass-through).
  4. **`node_modules/bmad-method/` missing → WARNING emitted** (assert stderr contains `"BMAD core not detected"`; exit 0).
  5. **Non-TTY environment still emits WARNING text** (run under `TERM= ` and pipe stderr; assert text present, just no color codes).
  6. **Preflight called with invalid projectRoot → throws clean error** (no half-silent swallow).

**And** `tests/integration/install-preflight.test.js` — ONE integration test (optional but recommended) asserting that `convoke-install` + `convoke-update` entry points both emit the WARNING text when `node_modules/bmad-method/` is missing. Skippable if integration infrastructure is in flux; unit coverage is sufficient per AC6's primary test set.

**AC7 — Docs + skill-manifest registration.**
**Given** the new skill is in place
**When** the operator runs `convoke-doctor` OR inspects the skill catalog
**Then** the new `bmad-audit-skill-dirs` skill MUST appear:
- In `_bmad/_config/skill-manifest.csv` with the canonical row shape (name, displayName, description, trigger phrase, source module, path, runtime path).
- In `_bmad/_config/agent-manifest.csv` — **not applicable**: this is skill tooling, not an agent. Skip agent-manifest.

**And** a one-paragraph README/docstring in the script header explaining the scope vs. Story 3.1's `validate-marketplace.js` (avoid operator confusion about which tool does what).

## Tasks / Subtasks

- [ ] **Task 1: Research BMAD 6.3 compatibility detection (DEF-SPIKE).** Before writing `compat-preflight.js`:
  - [ ] 1.1 Check if `node_modules/bmad-method/package.json` exists in this repo (confirm Decision 1(a) assumption).
  - [ ] 1.2 If absent, try `node_modules/bmad-core/`, `node_modules/@bmad/core`, or similar (BMAD may ship under multiple package names).
  - [ ] 1.3 Document findings in a short comment at the top of `compat-preflight.js` — cite the exact package name observed.
  - [ ] 1.4 If NO BMAD package is present in `node_modules`, Decision 1(a)'s fallback path (absent-package WARNING) is the primary behavior; note this in Dev Agent Record.

- [ ] **Task 2: Implement `scripts/update/lib/compat-preflight.js`.**
  - [ ] 2.1 Pattern 1 module structure: shebang NOT required (helper, not CLI); `'use strict'`; `@module` JSDoc; `findProjectRoot()` imported from `../utils.js`.
  - [ ] 2.2 Export `runCompatPreflight(projectRoot)` returning `{ detected, version, warning }` for caller introspection; side-effect: write WARNING to stderr when applicable.
  - [ ] 2.3 Use `chalk.yellow()` (already in deps) for WARNING text; chalk auto-disables colors on non-TTY (AC1).
  - [ ] 2.4 Export frozen `_internal` with helpers (`_readBmadPackageJson`, `_compareVersion`) for unit testability.
  - [ ] 2.5 NO process.exit, NO throw on missing package — only write-to-stderr + return. Caller controls flow.

- [ ] **Task 3: Wire preflight into install + update entry points.**
  - [ ] 3.1 Add `const { runCompatPreflight } = require('./update/lib/compat-preflight');` at top of `scripts/install-all-agents.js`.
  - [ ] 3.2 Call `runCompatPreflight(findProjectRoot())` immediately after `findProjectRoot()` resolves, BEFORE any filesystem writes.
  - [ ] 3.3 Same pattern in `scripts/update/convoke-update.js` — preflight at top of the main entry; do NOT invoke inside refreshInstallation.
  - [ ] 3.4 Both call-sites swallow return value (fire-and-forget; warning goes to stderr). Single LOC addition per call-site.

- [ ] **Task 4: Implement `scripts/audit/audit-skill-dirs.js`.**
  - [ ] 4.1 Pattern 1 structure (shebang + `'use strict'` + `@module` + `findProjectRoot` + frozen `_internal`).
  - [ ] 4.2 Main check function `checkSkillDir(skillDirPath, projectRoot)` returns `{passed, error?, info?}` (Story 2.2 shape).
  - [ ] 4.3 Iteration helper `auditAllSkillDirs(projectRoot)` — reads `.claude/skills/` one level deep, filters to directories only (AC6 Test 15), runs `checkSkillDir` on each, aggregates findings.
  - [ ] 4.4 Size guard constant `SKILL_MD_MAX_BYTES = 1_000_000` with comment explaining decimal-MB decision (R2-L1 deferred from Story 3.1 — adopt cleaner `>=` here).
  - [ ] 4.5 Symlink-escape guard (R2-H3 strict `startsWith(rootWithSep)` — no `=== projectRoot` fallback) + TOCTOU try/catch around `lstatSync`/`realpathSync` (R2-H2).
  - [ ] 4.6 CLI main: `parseArgs` handles `--verbose` / `--dry-run` / `--help`; `--help` wins over other parse errors (R2-M5 pattern).
  - [ ] 4.7 `renderResults` — green/yellow/red chalk per finding status; summary line; exit code per AC2.

- [ ] **Task 5: Slash-command skill wrapper at `.claude/skills/bmad-audit-skill-dirs/`.**
  - [ ] 5.1 `SKILL.md` with v6.3 frontmatter: `name: bmad-audit-skill-dirs`, `description: "Audit every .claude/skills/ directory for v6.3 SKILL.md compliance. Use when the user says 'audit skill dirs' or 'check skill directories'."`
  - [ ] 5.2 `workflow.md` — thin procedural wrapper: invoke CLI via Bash, surface output to operator, interpret exit code.
  - [ ] 5.3 Add one row to `_bmad/_config/skill-manifest.csv` matching the slash-command registration shape (see `bmad-register-skill` row as template).

- [ ] **Task 6: Tests.**
  - [ ] 6.1 `tests/unit/audit-skill-dirs.test.js` — 15 test cases per AC6.
  - [ ] 6.2 `tests/unit/compat-preflight.test.js` — 6 test cases per AC6.
  - [ ] 6.3 Optional: `tests/integration/install-preflight.test.js` — 1 case (install + update entry points both emit WARNING).
  - [ ] 6.4 PI-6 retro action: AND-conjunction substring assertions for rendered output (e.g., `stdout.includes('BMAD') && stdout.includes('6.3.0')`).
  - [ ] 6.5 `node:test` convention: use `TestContext.skip(...)` for any test that needs external fixtures unavailable in CI (R2-M2 pattern — visible SKIPPED, not silent PASS).

- [ ] **Task 7: `package.json` updates.**
  - [ ] 7.1 Add `"convoke-audit-skill-dirs": "scripts/audit/audit-skill-dirs.js"` to `bin` map.
  - [ ] 7.2 Verify `.claude/skills/` and `scripts/update/lib/` are already in `files[]` (they should be from Story 3.1 + Epic 2 — confirm; add if missing).
  - [ ] 7.3 Run `npm pack --dry-run | grep -E 'audit-skill-dirs|compat-preflight|bmad-audit-skill-dirs'` and verify all 4 new artifacts ship (audit script, preflight helper, SKILL.md, workflow.md).

- [ ] **Task 8: Validation gates.**
  - [ ] 8.1 `npm test` — full suite passes. Baseline at Story 3.1 close: **1393/1393**. Expected delta: +15 audit tests + +6 preflight tests + 1 optional integration = up to +22. Target: ~1415/1415.
  - [ ] 8.2 `npm run lint` — clean (address any issues mid-implementation; lint-passes-before-review anchor rule).
  - [ ] 8.3 Perf smoke: `time node scripts/audit/audit-skill-dirs.js > /dev/null` on real repo; 3 runs, warm median ≤5000 ms (AC3).
  - [ ] 8.4 Live smoke: `convoke-install --help` (confirm preflight didn't break help text); `convoke-update --help` (same).
  - [ ] 8.5 Live smoke: `convoke-audit-skill-dirs --verbose` on the real repo — expect clean pass on all 98 dirs.
  - [ ] 8.6 Slash-command smoke: in Claude Code, type `/bmad-audit-skill-dirs` — verify the skill is discoverable and the workflow.md invokes the CLI correctly.
  - [ ] 8.7 `npm run test:all` (full gate including integration + p0 per Story 3.1 R1-H1 retro action — `npm test` alone is NOT sufficient).

## Dev Notes

**Previous-story intelligence (Story 3.1 Round 1 + Round 2 lessons):**

Story 3.1 shipped `validate-marketplace.js` with `auditSkillDirs` helper. Story 3.2's `audit-skill-dirs.js` is a different tool with different scope — **don't conflate them**. Key differences:

| Aspect | Story 3.1 `auditSkillDirs` (inside validate-marketplace.js) | Story 3.2 `audit-skill-dirs.js` (new tool) |
|--------|------------------------------------------------------------|---------------------------------------------|
| Scope | 7 marketplace-listed Vortex paths | All 98+ `.claude/skills/` dirs |
| Source | `marketplace.json.plugins[0].skills` array | Directory walk of `.claude/skills/` |
| Purpose | Pre-submission PR gate (FM5-1) | Runtime install validation (NFR12) |
| Operator | Convoke maintainer | Every Convoke user |
| Exit code impact | Blocks PR submission if failed | Blocks install continuation if failed |

**R1/R2 patterns to reuse (from Story 3.1):**
- **R1-M2 + R2-H3 symlink-escape guard** — use `lstatSync` → `realpathSync` → `startsWith(rootWithSep)` (strict; no `=== projectRoot` fallback). Protects against skill dirs symlinked outside the project root.
- **R2-H2 TOCTOU try/catch** — wrap `lstatSync` / `realpathSync` in try/catch so concurrent deletes + broken symlinks emit clean per-path errors instead of crashing the whole audit mid-iteration.
- **R1-M6 + R2-M5 trim-reject** — reject empty-string + whitespace-only + literal `"undefined"` / `"null"` for frontmatter `name:` / `description:` (never trust YAML's "truthy" gate alone).
- **R2-H4 set-identity match** — NOT applicable here (audit-skill-dirs is purely shape-validation, not identity-count-validation). Story 3.2 does NOT enforce which skills are present — only that present skills are v6.3-compliant.
- **R2-M1 test split** — if a test grows to cover two invariants, split into nested `describe` with shared `before()` + two `it()` blocks.
- **R2-M2 `TestContext.skip()`** — for any test requiring external state unavailable in all CI environments (git history, network, etc.), use `t.skip('reason')` not silent `return`.

**Patterns to apply from Story 2.1 / 2.2 / 2.3:**
- **Pattern 1 module structure** (shebang + `'use strict'` + `@module` JSDoc + `findProjectRoot()` + frozen `_internal` export). The module skeleton template is `scripts/audit/audit-bmm-dependencies.js`.
- **Check-function shape** `{passed, error?, warning?, info?}` matching Story 2.2's `checkBmmDependencies` finding shape.
- **AND-conjunction substring assertions** in CLI tests (Epic 2 retro PI-6).
- **Non-TTY guard pattern** (Story 2.4 R2-M5 + R1-M8) — preflight is INFORMATIONAL; chalk auto-disables, text stays. No special-casing.

**Anti-patterns to avoid:**
- **DO NOT** recursively walk `.claude/skills/<dir>/steps/` — audit is one-level-deep directory walk only. Nested dirs inside a skill (like `steps/`, `templates/`, `checklists/`) are implementation details; audit only checks the `<dir>/SKILL.md` shape at the top level.
- **DO NOT** import `scripts/audit/validate-marketplace.js` or reuse its `auditSkillDirs` helper. The two tools are deliberately separate — shared scope would drag validate-marketplace.js into the install runtime path, violating Epic 3 scope discipline.
- **DO NOT** hard-block the install/update flow on preflight failure. AC1 + Decision 3 pin this as soft-warn-only. Hard-blocking is a different story (not scheduled for Epic 3; future NFR revisit if evidence emerges).
- **DO NOT** require `bmad-method` to be installed via npm. Decision 1(a)'s happy path assumes that, but (4)'s fallback is the honest behavior for git-clone or monorepo installs.
- **DO NOT** trust `process.cwd()` — use `findProjectRoot()` (project-context anchor rule `no-process-cwd-in-libs`).
- **DO NOT** author a new TODO.md or deferred-work-local.md — use the canonical `deferred-work.md` in `implementation-artifacts/` with a per-story heading.

**Spike points tracked in Dev Agent Record:**
- **DEF-SPIKE 1:** BMAD's npm package name is currently assumed to be `bmad-method`. If Task 1.1 discovers a different name (e.g., `@bmad/core`, `bmad-core`), update Decision 1(a) inline with a citation and proceed.
- **DEF-SPIKE 2:** SemVer comparison — do we require `>= 6.3.0` strict, or `^6.3.0` range (which rejects 7.x)? Decision 1 implies strict `>= 6.3.0` (major-minor gate). If Task 2 implementation finds a stronger reason to range-lock, surface to user.

## Testing

**Test count target:** 15 (audit-skill-dirs) + 6 (compat-preflight) + 1 optional (integration) = **21 tests**.

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
  - `scripts/audit/audit-skill-dirs.js` — projected 250–350 LOC (main + helpers + parseArgs + renderResults + frozen `_internal`).
  - `scripts/update/lib/compat-preflight.js` — projected 80–120 LOC (small helper).
  - `tests/unit/audit-skill-dirs.test.js` — projected 400–500 LOC (15 test cases; fixture seeders).
  - `tests/unit/compat-preflight.test.js` — projected 150–200 LOC (6 test cases; mock node_modules layout).
  - `.claude/skills/bmad-audit-skill-dirs/SKILL.md` — ~20 LOC (frontmatter + short body).
  - `.claude/skills/bmad-audit-skill-dirs/workflow.md` — ~50 LOC (thin procedural wrapper).

- **Modified files (4):**
  - `scripts/install-all-agents.js` — ~3 LOC (import + call-site; AC5 exception).
  - `scripts/update/convoke-update.js` — ~3 LOC (import + call-site; AC5 exception).
  - `package.json` — ~2 LOC (bin entry + files[] confirmation).
  - `_bmad/_config/skill-manifest.csv` — ~1 LOC (new row for bmad-audit-skill-dirs).

- **Projected total:** ~960–1290 LOC baseline + ~20-40% retro PI-3 overhead → **~1150–1550 LOC** (post-R1 + R2). Story 3.1 real shipped LOC was ~1900 (high end of projection) due to the 7-agent skill-dir migration cascade; Story 3.2 has no such migration — expect lower-end of projection.

## Dev Agent Record

**DEF-SPIKE tracking:**
- [ ] DEF-SPIKE 1 resolved at Task 1.3 — actual BMAD package name noted: `______` (fill in during implementation).
- [ ] DEF-SPIKE 2 resolved at Task 2 — version gate strategy: strict `>= 6.3.0` (major-minor); confirmed OR revised to: `______`.

**Deviations from spec:** (fill in during implementation)

**Lint + test numbers at completion:** (fill in at Task 8)

### Change Log

| Date | Change | Reference |
|------|--------|-----------|
| 2026-04-24 | Story created post-Story-3.1 close via `/bmad-create-story v63-3-2`. 7 ACs covering runtime compatibility preflight (FR23) + full-tree skill-dir audit (NFR4 + NFR12) + bin entry + slash-command skill wrapper + scope discipline + tests + docs. 3 Decisions pinned: (1) BMAD version detection via `node_modules/bmad-method/package.json` with absent-package fallback; (2) audit scope is all `.claude/skills/` one-level-deep, not marketplace-scoped; (3) preflight is soft-warn (exit 0 pass-through), not hard-block. Previous-story intelligence applies Story 3.1 R1/R2 hardening patterns preemptively: symlink-escape strict `startsWith` (R2-H3), TOCTOU try/catch (R2-H2), `>= SKILL_MD_MAX_BYTES` (R2-L1 adopt-forward), `TestContext.skip()` for external-state tests (R2-M2), test-split via nested `describe` where applicable (R2-M1). Pattern 1 module structure + check-function shape from Story 2.1/2.2. Epic 2 scope discipline held: zero imports from audit-bmm-dependencies.js, validate-marketplace.js, convoke-doctor.js, convoke-update.js (except one preflight call-site addition), convoke-register-skill.js. Projected LOC: 960–1290 baseline + PI-3 60% overhead → 1150–1550. Projected test delta: +21 tests (15 audit + 6 preflight). Ready for `/bmad-validate-create-story` (recommended given 2 DEF-SPIKEs) then `/bmad-dev-story`. | [sprint-status.yaml](sprint-status.yaml) |
