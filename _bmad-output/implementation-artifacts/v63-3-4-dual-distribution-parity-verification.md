---
initiative: convoke
artifact_type: story
qualifier: v63-3-4-dual-distribution-parity-verification
created: '2026-04-25'
schema_version: 1
epic: v63-epic-3
---

# Story 3.4: Dual-distribution parity verification

Status: in-progress

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

**Epic:** [Epic 3 — Discover via BMAD Marketplace](../planning-artifacts/convoke-epic-bmad-v6.3-adoption.md#epic-3-discover-via-bmad-marketplace)
**Sprint:** 4 (WS2/P23 marketplace stream)
**FR coverage:** FR22 (`diff -r` empty between npm-standalone install tree and simulated-marketplace install tree, applying FM5-2 exclusion list).
**NFR coverage:** none beyond inheritance from Stories 3.1/3.2 (skill-dir conformance must hold across both paths — Story 3.2's `audit-skill-dirs` is the validator that runs over both produced trees).
**Failure modes addressed:** FM5-2 (parity diff false failures from `.DS_Store` / timestamps / ephemeral metadata).

**Upstream dependencies:**
- **Story 3.1 shipped `.claude-plugin/marketplace.json`** — SOURCE OF TRUTH for what the marketplace install path produces. Decision 1 pins parity scope to the file set declared in `marketplace.json.plugins[0].skills[]` (7 paths verified live; the field `module_definition` is NOT in the JSON despite arch Decision 5 referencing it conceptually — see Decision 1 below).
- **Story 3.1 shipped `validate-marketplace.js`** — runs `auditSkillDirs` on the 7 marketplace-listed paths; both sandbox trees should pass it.
- **Story 3.2 shipped `audit-skill-dirs.js`** — runs over the full `.claude/skills/` tree (98+ dirs); applies only to the npm side (marketplace path doesn't bootstrap `.claude/skills/`).
- **Story 3.3 shipped registry submission PR** — context only; per epic, "actual merged PR not required" for FR22, so PR #9 merge state is irrelevant to Story 3.4.
- **No upstream code dependencies on Epic 2** — pure distribution scope.

**Downstream consumers:**
- **Story 3.5 (platform adapter batch validation)** — depends on parity being established; 3.5's per-platform export validates a different axis.
- **Convoke 4.0 publication gate** — FR22 is on the critical path: shipping without parity-proof means a marketplace user gets a different `_bmad/` tree than an npm user, breaking the M12a/M12b ship gate's "discover via marketplace" promise.

**Namespace decision:** all new artifacts under `tests/integration/` (Convoke namespace, not BMAD upstream).
- `tests/integration/dual-distribution-parity.test.js` — integration test (per arch Decision 7).
- `tests/integration/lib/marketplace-installer-sim.js` — marketplace-install simulator. NEW dir `tests/integration/lib/` (no existing convention for integration-test helpers; promote when >1 helper).
- `tests/unit/marketplace-installer-sim.test.js` — unit tests for the simulator (3 cases per O1).
- **Out of scope:** modifying `.claude-plugin/marketplace.json`, `_bmad/bme/_vortex/module.yaml`, `audit-skill-dirs.js`, `validate-marketplace.js`, any install/update script.
- **Covenant compliance checklist:** N/A — tests-only verification; no `_bmad/bme/*` skill authored.

## Story

As Convoke maintainer (Amalik) preparing the v4.0 release,
I want **proof that both install paths produce identical state** in the file set declared by `marketplace.json`,
so that FR21–FR22's "discover via BMAD marketplace and get the same Convoke as npm users" promise is verifiable, and any future drift between the two paths breaks CI loudly instead of silently.

**Scope distinction vs. Stories 3.1/3.2:** 3.1 declared WHAT ships; 3.2 audited HOW skills are SHAPED; 3.4 verifies INSTALL-TIME PARITY between the two paths. The three stories together are the marketplace stream's complete certificate: shape + content + parity.

**Why "simulated" marketplace install:** Story 3.3 DEF-SPIKE 4 confirmed no local PluginResolver CLI exists for community modules. Story 3.4 simulates PluginResolver's CONTRACT in-process via a Convoke-side helper (Decision 2). When BMAD ships a real PluginResolver CLI later, swap simulator for `runScript` — test contract invariant.

## Acceptance Criteria

**Decision 1 (pinned): parity scope = the 7 paths in `marketplace.json.plugins[0].skills[]`, NOT a `module_definition` path (verified live via `node -e`: marketplace.json line 7-25 contains keys `name, source, description, version, author, skills` only — no `module_definition`).**
- The npm-standalone path runs `convoke-install` which seeds far more than the marketplace declares (config.yaml, manifests, `_bmad-output/`, `_enhance/`, Gyre, deprecated-workflow archival).
- Per BMAD's PluginResolver contract (DS1 verifies; provisional understanding: PluginResolver reads `marketplace.json`, materializes `skills[]` paths), the marketplace path produces ONLY the declared file set.
- Comparing full trees would either require the marketplace path to also run `convoke-install` (contradicting FR21's "discover via marketplace" framing) or fail by construction. Pinning parity to the declared set makes the test meaningful AND tractable.
- **The 7 `skills[]` paths = 7 paths in scope.** Each path-relative file MUST byte-equal across both trees.
- **Note on `module_definition` gap:** arch Decision 5 line 414 mentions `module_definition: _bmad/bme/_vortex/module.yaml` conceptually, but Story 3.1 didn't add the field to `marketplace.json`. **This is a Story 3.1 follow-up, NOT a Story 3.4 fix** (AC7 forbids touching marketplace.json). Defer per E11 (deferred-work.md item to add after this story).

**Decision 2 (pinned): marketplace install simulator at `tests/integration/lib/marketplace-installer-sim.js` implements PluginResolver's CONTRACT, not its implementation.** Reads `.claude-plugin/marketplace.json`, copies each `skills[]` path verbatim from source repo into destination's mirror tree. Documented assumptions (DS1 verifies):
- (i) PluginResolver materializes files into the destination (vs path-registration-only).
- (ii) PluginResolver does NOT run package `bin` scripts at install time. **CRITICAL ASSUMPTION** — if false, the marketplace path would run `convoke-install` as postinstall, the npm + marketplace trees would converge by construction, and Story 3.4's parity test becomes vacuous. DS1 spike (Task 1.1) MUST fetch + read PluginResolver source from `bmad-code-org/BMAD-METHOD/tools/cli/installers/` before authoring the simulator. Time-box 60 min; if inconclusive, ship with PROVISIONAL assumption + log a deferred re-verification item per E5.
- (iii) PluginResolver preserves source-relative paths in the destination (vs flattening to `.claude/skills/`). DS2 verifies via `whiteport-design-studio` post-install layout.

**Decision 3 (pinned): exclusion list per FM5-2, exported as `PARITY_EXCLUSIONS` constant from simulator module.**
- Basenames (case-insensitive match): `.DS_Store`, `Thumbs.db`, `desktop.ini` (per E1+E2 — Convoke supports macOS + Windows + Linux).
- Suffix: `.bak` (backup-manager artifacts).
- Path contains: `/node_modules/` (defensive — shouldn't appear under `_bmad/`).
- File mtimes ignored entirely (compare CONTENTS not stat).

**Decision 4 (pinned): AC6 perf-budget overrun action = mark test `t.skip()` with diagnostic + surface to user.** No silent relaxation.

---

**AC1 — Integration test file `tests/integration/dual-distribution-parity.test.js` exists and uses `node:test`.**
- Imports: `node:test`, `node:assert/strict`, `path`, `fs-extra`, `os`. Match sibling pattern in [`fresh-install.test.js`](../../tests/integration/fresh-install.test.js).
- Project convention: `node:test` since 2026-04-08 — see MEMORY.md "C1 phantom-test class resolved" (per C3).
- Test file picked up by `npm run test:integration` (per C2; verified live: `package.json:45` runs `node scripts/test-runner.js tests/integration`. Note: `npm test` runs `tests/unit + tests/team-factory + tests/lib` only; `npm run test:integration` is the correct invocation for this file).
- File path per arch Decision 7's testability table.

**AC2 — Test creates 2 sandbox installs in tmpdirs.**
- **Sandbox A (npm-standalone):** `refreshInstallation(sandboxA, { backupGuides: false, verbose: false })` from `scripts/update/lib/refresh-installation.js`. Direct API call (faster + deterministic than CLI shell-out — `installer-e2e.test.js` already covers CLI mechanics).
- **Sandbox B (simulated-marketplace):** `marketplaceInstall(sandboxB, { sourceRepo: PACKAGE_ROOT })` from `tests/integration/lib/marketplace-installer-sim.js` (Task 2).
- Both via `fs.mkdtemp(os.tmpdir() + '/convoke-parity-')`; cleaned up in `after()`.
- Honors `test-fixture-isolation` Rule: zero coupling to `PACKAGE_ROOT` for assertions; `PACKAGE_ROOT` is read-only context (the source the simulator reads from).

**AC3 — Per-path byte-equality across `marketplace.json.plugins[0].skills[]`.**
- Schema-guard FIRST (per E9): assert `marketplace.plugins[0].skills.length > 0` before iterating; fail loudly with "marketplace metadata regression" message if empty/missing.
- For each path in `marketplace.plugins[0].skills` (count derived at runtime per `derive-counts-from-source` Rule — currently 7):
  - Directory MUST exist in BOTH sandboxes.
  - For every file under the directory (recursive, post-exclusion), file MUST exist in BOTH sandboxes AND have identical bytes.
- Byte-compare contract (per C6, single threshold pinned):
  - All files compared via `Buffer.compare(fs.readFileSync(a), fs.readFileSync(b)) === 0`. NO size threshold — `node:test` handles large buffers fine; the `diff -q` shell-out fallback was over-engineering.
  - Symlinks: detect via `fs.lstatSync(p).isSymbolicLink()`; compare resolved target paths (relative to sandbox root) for equality, NOT content.
  - Empty files: `Buffer.compare(empty, empty) === 0` works correctly — no special case.

**AC4 — Exclusion list applied mechanically (Decision 3).**
- `PARITY_EXCLUSIONS` imported from simulator (per `shared-test-constants` Rule).
- Helper applies: `basename.toLowerCase() ∈ exclusionBasenames` (case-insensitive per E2) OR `basename.endsWith('.bak')` OR `path.includes('/node_modules/')`.
- File mtimes never inspected.

**AC5 — Drift produces actionable failure with pinned hint table.**
- Failure cases + hints (table exported from simulator per E6):
  - `missing-in-A`: "marketplace.json declares path that `refreshInstallation` didn't seed — check `AGENT_IDS` registry."
  - `missing-in-B`: "`refreshInstallation` produced file outside marketplace.json scope — check Decision 1 scope OR if it should be added to skills[]."
  - `byte-diff`: "Source content differs between npm and marketplace install — check whether either path mutates the file post-copy."
  - `symlink-diff`: "Symlink target differs — check whether one path resolves links and the other doesn't."
- Failure includes path + mode + sizes + first-differing-offset (for byte-diff). Surfaced via `assert` message (not `console.log`) so `node:test --reporter=spec` renders it.

**AC6 — Test runs in ≤ 10 seconds total.**
- Budget: 2× NFR4 (audit ≤5s on full install) since parity does 2 install simulations + diff.
- Likeliest culprit if over: `refreshInstallation` (~3-5s).
- Overrun action per Decision 4: `t.skip("AC6 perf budget exceeded — see Story 3.4 follow-up")` + log diagnostic. NOT silent relaxation.

**AC7 — Scope discipline.**
- MUST NOT touch: `.claude-plugin/marketplace.json`, `_bmad/bme/_vortex/module.yaml`, `scripts/install-*.js`, `scripts/audit/*.js`, `scripts/update/lib/*.js`, `scripts/postinstall.js`, `package.json`, any file under `_bmad/bme/_vortex/agents/` or `.claude/skills/`.
- IN scope (4 new files + 1 modified):
  - **New:** this story file, `tests/integration/dual-distribution-parity.test.js`, `tests/integration/lib/marketplace-installer-sim.js`, `tests/unit/marketplace-installer-sim.test.js` (per O1).
  - **Modified:** `_bmad-output/implementation-artifacts/sprint-status.yaml` (status only).
- Spec-deviation guardrail: if Task 1's DS1 spike inverts assumption (ii) — PluginResolver DOES run package bin scripts — surface to user; this is a Decision 1 inversion conversation, not a silent test design flip.

**AC8 — Validation gates green.**
- [ ] 8.1 `npm run test:integration` passes (per C2 — NOT `npm test`). New file `dual-distribution-parity.test.js` adds N test cases (≥5).
- [ ] 8.2 `npm test` passes (the existing unit suite picks up `tests/unit/marketplace-installer-sim.test.js` per O1).
- [ ] 8.3 `npm run lint` clean for the 3 new JS files.
- [ ] 8.4 `git diff HEAD --stat` confirms AC7 scope (4 new files + sprint-status.yaml).
- [ ] 8.5 Both sandboxes pass `audit-skill-dirs` defensively (5th `it()` block per E7 — promotes the AC8.4-optional check from previous draft).

## Tasks / Subtasks

(Tasks reference ACs by number; ACs hold the spec — Tasks are execution steps per L2.)

- [ ] **Task 0: Pre-flight gates** (AC8 baseline).
  - [ ] 0.1 `npm run test:integration 2>&1 | tail -3` shows `pass N / fail 0`. Capture N for AC8.1 delta math.
  - [ ] 0.2 Verify marketplace.json (Decision 1): `node -e "const m=require('./.claude-plugin/marketplace.json'); console.log('skills:', m.plugins[0].skills.length, 'has_module_def:', !!m.plugins[0].module_definition)"` should print `skills: 7 has_module_def: false` (current confirmed state). If different, Story 3.1 has drifted — surface to user.
  - [ ] 0.3 Verify test runner glob: `cat scripts/test-runner.js | grep -A1 'tests/integration'` confirms integration tests are picked up by `test:integration` script.

- [ ] **Task 1: DEF-SPIKE — verify PluginResolver assumptions before authoring simulator** (Decision 2 + per C5/E5).
  - [ ] 1.1 **DS1 (60-min time-box per E5):** fetch BMAD PluginResolver source. Run `gh api repos/bmad-code-org/BMAD-METHOD/contents/tools/cli/installers --jq '.[].name'` to enumerate installer files; identify the resolver entry (likely `plugin-resolver.js` or `installer.js`); fetch via `gh api ... --jq .content | base64 -d` and read the `install()` / equivalent function. Document findings:
    - Does it materialize files OR register paths? (Assumption (i))
    - Does it run package `bin`/postinstall scripts? (Assumption (ii) — CRITICAL)
    - Does it preserve source-relative paths or flatten? (Assumption (iii))
  - [ ] 1.2 If 60min elapses without conclusive answer: ship with PROVISIONAL Decision 2 assumptions (i)+(ii)+(iii); add backlog item to `deferred-work.md` for re-verification when BMAD ships PluginResolver CLI.
  - [ ] 1.3 **DS2 (~15 min):** verify path preservation via existing community module. Fetch `whiteport-design-studio.yaml` registry entry; clone its source repo; inspect post-install layout (or read its README/install docs). Confirm whether `skills[]` paths land at source-relative or flattened destinations. Update Decision 2 (iii) if findings diverge.
  - [ ] 1.4 **DS3 (~10 min):** run `refreshInstallation(tmpdir)` interactively; `find <tmpdir>/_bmad/bme/_vortex/agents/contextualization-expert -type f` to enumerate files. Confirm only SKILL.md (no per-agent README, .gitkeep, etc.) — or if found, ensure they're identical in source. Update Decision 3 exclusion list if new offenders surface.
  - [ ] 1.5 **HALT condition:** if DS1 reveals assumption (ii) is FALSE (PluginResolver runs package bin), surface to user — Decision 1 inversion needed.

- [ ] **Task 2: Author `tests/integration/lib/marketplace-installer-sim.js`** (Decision 2 + AC4 + AC5).
  - [ ] 2.1 `mkdir -p tests/integration/lib`. Confirm filename ends in `-sim.js` NOT `.test.js` (per C7 — runner globs `*.test.js`).
  - [ ] 2.2 Implement per Decision 2:
    ```js
    'use strict';
    const fs = require('fs-extra');
    const path = require('path');

    const PARITY_EXCLUSIONS = Object.freeze({
      basenames: new Set(['.ds_store', 'thumbs.db', 'desktop.ini']),  // lowercase per E2
      suffixes: ['.bak'],
      pathContains: ['/node_modules/']
    });

    const PARITY_HINTS = Object.freeze({
      'missing-in-A': 'marketplace.json declares path that refreshInstallation didn\'t seed — check AGENT_IDS registry.',
      'missing-in-B': 'refreshInstallation produced file outside marketplace.json scope — check Decision 1 scope OR if it should be added to skills[].',
      'byte-diff': 'Source content differs between npm and marketplace install — check whether either path mutates the file post-copy.',
      'symlink-diff': 'Symlink target differs — check whether one path resolves links and the other doesn\'t.'
    });

    function isExcluded(filePath) {
      const base = path.basename(filePath).toLowerCase();
      if (PARITY_EXCLUSIONS.basenames.has(base)) return true;
      if (PARITY_EXCLUSIONS.suffixes.some(s => base.endsWith(s))) return true;
      if (PARITY_EXCLUSIONS.pathContains.some(p => filePath.includes(p))) return true;
      return false;
    }

    async function marketplaceInstall(destRoot, { sourceRepo }) {
      // E4: read fresh, do NOT require() to avoid Node module cache
      const manifestPath = path.join(sourceRepo, '.claude-plugin/marketplace.json');
      const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'));
      // E9: schema-guard
      if (!manifest.plugins?.[0]?.skills?.length) {
        throw new Error('marketplace.json regression: plugins[0].skills missing or empty');
      }
      for (const plugin of manifest.plugins) {
        for (const skillRel of plugin.skills) {
          const src = path.join(sourceRepo, skillRel);
          const dest = path.join(destRoot, skillRel.replace(/^\.\//, ''));
          await fs.copy(src, dest, { overwrite: true });
        }
        // module_definition intentionally omitted — Decision 1 scope (field not in marketplace.json)
      }
    }

    module.exports = { marketplaceInstall, PARITY_EXCLUSIONS, PARITY_HINTS, isExcluded };
    ```
  - [ ] 2.3 Smoke-test: `node -e "(async()=>{const t=await require('fs-extra').mkdtemp(require('os').tmpdir()+'/sim-'); await require('./tests/integration/lib/marketplace-installer-sim').marketplaceInstall(t,{sourceRepo:process.cwd()}); console.log(require('fs').readdirSync(t+'/_bmad/bme/_vortex/agents'))})()"` should print 7 agent dirs.

- [ ] **Task 3: Author `tests/unit/marketplace-installer-sim.test.js`** (per O1; 3 cases).
  - [ ] 3.1 Test cases:
    - **U1:** simulator parses manifest correctly + materializes 7 paths into a tmpdir.
    - **U2:** `isExcluded()` correctly classifies `.DS_Store` (case-insensitive), `Thumbs.db`, `foo.bak`, `path/with/node_modules/file`.
    - **U3:** simulator throws on malformed manifest (missing plugins, missing skills, empty skills).
  - [ ] 3.2 Pattern: import from simulator + use `fs-extra` + `os.tmpdir()` (mirror existing unit test conventions).

- [ ] **Task 4: Author `tests/integration/dual-distribution-parity.test.js`** (AC1-AC6 + AC8.5).
  - [ ] 4.1 Scaffold from `fresh-install.test.js` template.
  - [ ] 4.2 Test cases (≥ 5 per AC count + AC8.5):
    - **I1: Schema-guard pass** — assert marketplace.plugins[0].skills.length > 0 (sanity; AC3).
    - **I2: Per-skill byte-equality** — for each of 7 `skills[]` paths, every recursive file (post-exclusion) byte-matches across sandboxes.
    - **I3: Drift detection (uses sub-fixture per E10)** — clone `sandboxB` to `sandboxBPrime`, mutate one byte in known SKILL.md in `sandboxBPrime`, call parity helper inside `assert.throws(...)`, assert message includes the path + `byte-diff` mode + a hint from `PARITY_HINTS`. Mutation isolated to clone — does NOT pollute other tests.
    - **I4: Exclusion list applied** — touch `.DS_Store` in sandboxA under marketplace tree; assert parity still passes.
    - **I5 (per AC8.5): both sandboxes pass `audit-skill-dirs`** — defensive cross-check via `runScript('scripts/audit/audit-skill-dirs.js', [], { cwd: sandbox })`.
  - [ ] 4.3 Implement local `assertParityForPaths(sandboxA, sandboxB, declaredPaths)` helper. Uses `PARITY_EXCLUSIONS` + `PARITY_HINTS` from simulator.
  - [ ] 4.4 `DEBUG=convoke:parity` env var (per O2): when set, log path + size of every compared file. Off by default.

- [ ] **Task 5: Verify perf + scope + lint** (AC6 + AC7 + AC8.3).
  - [ ] 5.1 `node --test tests/integration/dual-distribution-parity.test.js` — capture wall-clock; should be ≤ 10s.
    - If exceeded: profile via `--test-reporter=spec`. Per Decision 4: skip with diagnostic + surface to user, not silent relaxation.
  - [ ] 5.2 `npm run lint` — clean for `tests/integration/dual-distribution-parity.test.js`, `tests/integration/lib/marketplace-installer-sim.js`, `tests/unit/marketplace-installer-sim.test.js`.
  - [ ] 5.3 `git diff HEAD --stat` — confirm AC7 scope.
  - [ ] 5.4 Spot-check: `npx convoke-validate-marketplace` exits 0 (defensive — no validate-marketplace.js touched but cheap regression guard).

## Dev Notes

**Story shape:** tests-only verification (no production code). Deliverable is a CI-enforced INVARIANT (parity), not a feature. Existence of test IS the value.

**Why Decision 1 (parity scope = declared set):** the two paths CANNOT produce identical full trees by construction — npm path runs full bootstrap (manifests, output dirs, gyre, _enhance, deprecated archival); marketplace path materializes only declared paths per BMAD's contract. Naive "diff -r" on full trees would fail by definition. Pinning parity to "for the file set the marketplace promises, do both paths deliver the same bytes?" is the meaningful question.

**Why Decision 2 (simulator over real PluginResolver):** Story 3.3 DEF-SPIKE 4 confirmed no local PluginResolver CLI for community modules. Building a Convoke-side simulator implementing the documented CONTRACT (assumptions (i)+(ii)+(iii) — DS1 verifies) gives deterministic, fast, in-process verification. Swap for real CLI when BMAD ships one — test contract invariant.

**Why Decision 4 (perf overrun = skip + surface):** silent relaxation hides perf regressions. Forcing a `t.skip` + diagnostic surfaces the conversation: optimize or relax the AC explicitly.

**Anti-patterns to avoid:**
- DON'T modify `marketplace.json`/`module.yaml` (Story 3.1 territory; the missing `module_definition` is a 3.1 follow-up — see Decision 1 note).
- DON'T modify `refreshInstallation`/install-vortex (would invalidate one side of comparison).
- DON'T spawn `convoke-install` CLI for sandbox A (`installer-e2e.test.js` already covers CLI; per L5, "shell out" here means the convoke-install binary; spawning `diff -q` for byte comparison was the previous draft's over-engineering and is removed).
- DON'T hardcode "7" anywhere — derive from `marketplace.json.plugins[0].skills.length` per `derive-counts-from-source` Rule.
- DON'T compare file mtimes / sizes-as-content-proxy.
- DON'T `require()` marketplace.json in the test (per E4 — Node module cache means a future test mutating the file sees stale data); use `fs.readFileSync + JSON.parse`.
- DON'T trust `process.cwd()` in the simulator (per `no-process-cwd-in-libs` Rule); accept `sourceRepo` as a parameter.

**External dependencies + risk:**
- **PR1 — DS1 may invert assumption (ii).** If PluginResolver runs `npm install` + `bin` postinstall, the marketplace path would converge with npm path; Story 3.4's parity test becomes vacuous. Surface immediately to user; Decision 1 needs inversion conversation. (Per C5: spike MUST fetch + read PluginResolver source, not just enumerate filenames.)
- **PR2 — DS2 may reveal path flattening.** If PluginResolver flattens `skills[]` paths to `.claude/skills/<name>/`, Decision 2 (iii) is wrong; sandbox B has different layout than sandbox A; parity helper needs normalized "content-equality regardless of destination path layout." Surface to user.
- **PR3 — `tests/integration/lib/` is a new dir.** Test runner walks `*.test.js`; simulator file is `*-sim.js` (no false collection). Verified Task 2.1.

## Testing

**New tests:** ≥ 5 cases in integration test (`I1–I5`) + 3 cases in unit test (`U1–U3`) = 8 new test functions.

**Test count delta:** baseline `npm run test:integration` count + 5; baseline `npm test` count + 3.

**Validation surface for review sign-off:**
- AC1 file exists at correct path + uses `node:test`.
- AC2 sandboxes are tmpdirs; teardown cleans up.
- AC3-4 parity helper enumerates marketplace.json declarations + applies exclusions; case-insensitive basename match.
- AC5 synthetic-mutation case (I3) PROVES assertion fires loudly with hint from `PARITY_HINTS`.
- AC6 wall-clock recorded ≤ 10s (or skipped with diagnostic per Decision 4).
- AC7 `git diff --stat` confirms 4 new files + sprint-status.yaml.
- AC8 `npm run test:integration` + `npm test` + `npm run lint` all green.

## References

- **Epic 3 Story 3.4:** [`convoke-epic-bmad-v6.3-adoption.md §Story 3.4`](../planning-artifacts/convoke-epic-bmad-v6.3-adoption.md#story-34-dual-distribution-parity-verification).
- **Architecture Decision 5 + 7:** [`convoke-arch-bmad-v6.3-adoption.md`](../planning-artifacts/convoke-arch-bmad-v6.3-adoption.md) — Decision 5 declares marketplace + FM5-2 mitigation; Decision 7 pins test file location.
- **Story 3.1 (shipped):** [`v63-3-1-create-and-validate-marketplace-metadata.md`](v63-3-1-create-and-validate-marketplace-metadata.md) — source of marketplace.json.
- **Project rules:** [`project-context.md`](../../project-context.md) — applied: `test-fixture-isolation`, `derive-counts-from-source`, `shared-test-constants`, `no-process-cwd-in-libs`, `lint-passes-before-review`.

## Project structure notes

**New files (4):**
- `_bmad-output/implementation-artifacts/v63-3-4-dual-distribution-parity-verification.md` (this file).
- `tests/integration/dual-distribution-parity.test.js` — projected ~150-200 LOC.
- `tests/integration/lib/marketplace-installer-sim.js` — projected ~60-90 LOC.
- `tests/unit/marketplace-installer-sim.test.js` — projected ~80-120 LOC (3 cases).

**Modified files (1):** `_bmad-output/implementation-artifacts/sprint-status.yaml`.

**No external work; no production code; no `_bmad/bme/` touched.**

**Projected total:** ~290-410 LOC test code + this story file.

## Dev Agent Record

**Agent Model Used:** (filled at story-execute time)

**DEF-SPIKE tracking:**
- [ ] DS1 (PluginResolver materialization + bin postinstall + path preservation) — Task 1.1; 60-min time-box; HALT-on-(ii)-false.
- [ ] DS2 (path preservation via whiteport precedent) — Task 1.3; ~15min.
- [ ] DS3 (exclusion list completeness) — Task 1.4; ~10min.

**Deferred work to surface during/after dev:**
- **E11 (deferred-work.md):** Story 3.1 follow-up to add `module_definition: _bmad/bme/_vortex/module.yaml` to `.claude-plugin/marketplace.json` (per arch Decision 5; not in current JSON). Story 3.4 explicitly out-of-scope; track for next marketplace amendment.
- **E5 backlog (if DS1 inconclusive):** PluginResolver behavior re-verification when BMAD ships local CLI.

**Deviations from spec:** (filled during implementation)

**Debug Log References:**
**Completion Notes List:**
**File List:**

### Change Log

| Date | Change | Reference |
|------|--------|-----------|
| 2026-04-25 | V-pass (`/bmad-validate-create-story` fresh-context) applied **26 improvements** (7 critical + 10 enhancement + 4 optimization + 5 LLM-opt). **Critical fixes:** C1 (`module_definition` hallucination — verified `marketplace.json.plugins[0]` lacks the field; Decision 1 narrowed to 7 `skills[]` paths only; deferred-work item logged for Story 3.1 follow-up); C2 (`npm test` doesn't run `tests/integration/` — verified `package.json:42`; AC8 + Tasks now use `npm run test:integration`); C3 (`feedback_no_jest` reference dropped; replaced with MEMORY.md C1 reference); C4 ("M3 ship gate" replaced with M12a/M12b); C5 (Task 1.1 spike now mandates fetching + reading PluginResolver source from `bmad-code-org/BMAD-METHOD/tools/cli/installers/`, with HALT condition on assumption (ii) inversion); C6 (byte-comparison threshold pinned single value — no shell-out fallback; symlink handling via `lstatSync`); C7 (Task 2.1 explicit assertion simulator file ends in `-sim.js`). **Enhancement fixes:** E1 (Windows `Thumbs.db` + `desktop.ini` added); E2 (case-insensitive basename match); E3+Decision 4 (perf overrun → skip + surface, no silent relaxation); E4 (read marketplace.json via `fs.readFileSync + JSON.parse`, NOT `require()` — avoids Node cache hidden coupling); E5 (DS1 time-boxed 60min + provisional + backlog re-verification); E6 (`PARITY_HINTS` table exported from simulator); E7 (AC8.5 promotes audit-skill-dirs cross-check to real `it()` block I5); E8 (8 paths → 7 paths everywhere); E9 (schema-guard `skills.length > 0` before iterating); E10 (drift detection uses cloned sub-fixture sandboxBPrime to avoid polluting other `it()` blocks). **Optimization fixes:** O1 (added `tests/unit/marketplace-installer-sim.test.js` with 3 cases U1-U3); O2 (`DEBUG=convoke:parity` env var); O3 (agent-manifest.csv reference dropped); O4 (capture exit code, not grep output, in Task 5.1). **LLM-opt fixes:** L1 (collapsed Decision X + "Why Decision X" duplication; ~30% length cut); L2 (Tasks reference ACs by number, no restating); L3 (References list trimmed); L4 (Change Log entries → bullet structure); L5 (clarified "shell out" semantics — DON'T spawn convoke-install; spawning `diff -q` was over-engineering and removed entirely). **Final spec shape:** 8 ACs + **4 Decisions** (added Decision 4 for AC6 overrun action) + **5 Tasks** + **3 DEF-SPIKEs** (DS1 with HALT condition; DS2 + DS3 inline-resolvable) + **8 new test functions** (5 integration I1-I5 + 3 unit U1-U3). **Story shape unchanged:** tests-only verification; no production code; no `_bmad/bme/` touched; covenant-checklist N/A. **V-pass ROI:** prevented 2 story-killing critical defects (C1+C2 — C1 would have caused dev agent to author code against a non-existent field; C2 would have caused AC8 gates to silently never run); pre-empted 4 task-design defects (C5/E5/E10/O1) requiring operator-driven recovery during /bmad-dev-story; trimmed ~30% of token waste (L1) for the dev agent that consumes this story. Story remains ready-for-dev. | This file |
| 2026-04-25 | Story created via `/bmad-create-story v63-3-4`. 8 ACs + 3 Decisions + 5 Tasks + 3 DEF-SPIKEs covering FR22 dual-distribution parity. Tests-only verification; no production code. Projected ~200-300 LOC test code. | [sprint-status.yaml](sprint-status.yaml) |
