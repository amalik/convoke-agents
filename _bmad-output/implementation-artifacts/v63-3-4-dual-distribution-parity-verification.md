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
**FR coverage:** FR22 (dual-distribution parity — npm-standalone + simulated-marketplace install paths produce **byte-equivalent SKILL.md content** for the 7 Vortex agents declared in `marketplace.json.skills[]`).
**NFR coverage:** none beyond inheritance from Stories 3.1/3.2.
**Failure modes addressed:** FM5-2 (parity diff false failures from `.DS_Store` / timestamps / OS-metadata — exclusion list per Decision 3).

**Upstream dependencies:**
- Story 3.1 shipped `.claude-plugin/marketplace.json` + 7 `<id>/SKILL.md` source files. SOURCE OF TRUTH.
- Story 3.2 shipped `audit-skill-dirs.js`. Both produced trees should pass it (defensive cross-check, AC8.5).
- Story 3.3 shipped registry submission PR (context only; not required for FR22 per epic).

**Downstream consumers:**
- Story 3.5 (platform adapter batch validation) — orthogonal axis.
- Convoke 4.0 publication gate — FR22 is on the critical path.

**Namespace decision:** all new artifacts under `tests/` (Convoke namespace).
- `tests/integration/dual-distribution-parity.test.js` — integration test (per arch Decision 7).
- `tests/integration/lib/marketplace-installer-sim.js` — simulator. NEW dir `tests/integration/lib/`.
- `tests/unit/marketplace-installer-sim.test.js` — unit tests for simulator (3 cases per O1).
- **Out of scope:** `marketplace.json`, `module.yaml`, `audit-skill-dirs.js`, `validate-marketplace.js`, install/update scripts.
- **Covenant compliance checklist:** N/A — tests-only.

## Story

As Convoke maintainer (Amalik) preparing the v4.0 release,
I want **proof that both install paths land byte-equivalent SKILL.md content for the 7 Vortex agents declared in `marketplace.json`** (npm-standalone via `convoke-install` + simulated-marketplace via Convoke-side replica of BMAD's PluginResolver Strategy 5 + IDE-target materialization),
so that FR21–FR22's "discover via BMAD marketplace and get the same Convoke as npm users" promise is verifiable at the level that matters to users (the Claude Code skill content), and any future drift in the source SKILL.md files breaks CI loudly.

**Why "content equivalence" not "tree equivalence":** DS1 spike (`bmad-code-org/BMAD-METHOD@HEAD`, 2026-04-25) verified that BMAD's marketplace install fundamentally restructures the file layout — skills land in IDE-specific dirs (`.claude/skills/<canonicalId>/SKILL.md`) and `_bmad/.../<id>/` skill-dirs are REMOVED post-install (`installer.js:91 _cleanupSkillDirs`). Convoke's npm install produces BOTH `_bmad/bme/_vortex/agents/<id>/SKILL.md` (source) AND `.claude/skills/bmad-agent-bme-<id>/SKILL.md` (wrapper). The two produce **structurally different trees by design**. Naive "diff -r on `_bmad/`" would fail by construction. The MEANINGFUL parity question — "does a marketplace user get the same SKILL.md content a npm user gets?" — is what FR22 actually promises and what this story tests.

## Acceptance Criteria

**Decision 1 (pinned post-DS1, REVISED 2026-04-25):** parity scope = **byte-equivalence of SKILL.md CONTENT** for each of the 7 Vortex agents declared in `marketplace.json.plugins[0].skills[]`, regardless of destination path.

The two install paths produce **structurally different file layouts** — this is by design per BMAD v6.3:
- **npm-standalone (`refreshInstallation`):** copies source `<repo>/_bmad/bme/_vortex/agents/<id>/SKILL.md` → destination's `_bmad/bme/_vortex/agents/<id>/SKILL.md` (source preserved) AND `.claude/skills/bmad-agent-bme-<id>/SKILL.md` (wrapper that points back at source).
- **marketplace install (BMAD's `installer.js` + `ide-config-driven.installVerbatimSkills`):** clones repo → walks for SKILL.md → builds skill-manifest.csv with `canonicalId = path.basename(skillDir)` → copies sourceDir → `<ideTargetPath>/<canonicalId>/SKILL.md` → REMOVES `_bmad/.../<id>/` skill-dirs (`_cleanupSkillDirs`).

The MEANINGFUL parity test: **for each of the 7 Vortex agents, the SKILL.md file BYTES match the source repo's SKILL.md bytes in BOTH sandboxes, regardless of where each path puts it.**

**Why content not paths:** users running Claude Code activate a skill by canonicalId; what they care about is "the skill behaves the same." The skill behaves the same if the SKILL.md content is byte-equal. Path divergence is a BMAD architectural choice (IDE dir vs source preservation) that's invisible to the user.

**Note on `module_definition` field:** still missing from `marketplace.json` (Story 3.1 follow-up, deferred-work item D-V34-E11). Decision 1 stays scoped to the `skills[]` array only — what's actually declared.

**Decision 2 (pinned post-DS1, REVISED): simulator at `tests/integration/lib/marketplace-installer-sim.js` replicates BMAD's marketplace install END STATE — not the full installer choreography.**

What the simulator does:
1. Reads `<sourceRepo>/.claude-plugin/marketplace.json`.
2. Schema-guard: `manifest.plugins[0].skills.length > 0` (else throw).
3. For each `skills[]` path:
   - Resolve to absolute source dir.
   - `canonicalId = path.basename(skillRel)` (matches BMAD's manifest-generator.js:143 rule).
   - Copy sourceDir → `<destRoot>/.claude/skills/<canonicalId>/` with FILTER (Decision 3 exclusion list).
4. Does NOT invoke `npm install` on cloned repo (Convoke's postinstall is benign — verified DS1; running it adds no skills, just prints help text).
5. Does NOT invoke ideManager itself (we replicate end state, not choreography — `installVerbatimSkills`'s skill-manifest.csv intermediary is an implementation detail; the SHIP STATE is "SKILL.md at `<ide>/skills/<canonicalId>/`").

Documented assumptions (DS1-verified at `bmad-code-org/BMAD-METHOD@HEAD` 2026-04-25):
- (i) BMAD installer DOES materialize files (via `installVerbatimSkills`); PluginResolver itself doesn't (just resolves) — split discovered DS1.
- (ii) BMAD installer DOES run `npm install --omit=dev` on cloned repo — but Convoke's `scripts/postinstall.js` is benign (verified prior; just prints help text).
- (iii) Destination paths are FLATTENED to `.claude/skills/<canonicalId>/` where `canonicalId = path.basename(sourceDir)` — NOT source-relative-preserved.
- (iv) Convoke would hit PluginResolver Strategy 5 (synthesize fallback) since: no `module.yaml` at `_bmad/bme/_vortex/agents/` common parent (it's at `_bmad/bme/_vortex/`); no `module-help.csv`; no `-setup` skill; 7 skills (not 1); none have `assets/`. The simulator DOES NOT model the synthesized module.yaml/module-help.csv outputs because they don't materialize SKILL.md content — they're metadata sidecars not in scope.

**Decision 3 (pinned, EXTENDED post-DS1): exclusion list MIRRORS BMAD's own filter** in `installVerbatimSkills` (verified `ide-config-driven.js:171-178`):
- Basenames (case-insensitive): `.DS_Store`, `Thumbs.db`, `desktop.ini`
- Suffixes: `.bak`, `~`, `.swp`, `.swo`
- Dot-prefixed files (except `.gitkeep`)
- Path contains: `/node_modules/` (defensive)
- File mtimes ignored entirely (compare bytes only)

Centralized as `PARITY_EXCLUSIONS` constant exported from simulator module.

**Decision 4 (pinned): AC6 perf-budget overrun action = `t.skip()` + diagnostic + surface to user.** No silent relaxation.

---

**AC1 — Integration test file `tests/integration/dual-distribution-parity.test.js` exists and uses `node:test`.**
- Imports `node:test`, `node:assert/strict`, `path`, `fs-extra`, `os`. Match sibling pattern in [`fresh-install.test.js`](../../tests/integration/fresh-install.test.js).
- Picked up by `npm run test:integration` (verified Task 0.3).
- File path per arch Decision 7.

**AC2 — Test creates 2 sandbox installs in tmpdirs.**
- **Sandbox A (npm-standalone):** `refreshInstallation(sandboxA, { backupGuides: false, verbose: false })`. Direct API call.
- **Sandbox B (simulated-marketplace):** `marketplaceInstall(sandboxB, { sourceRepo: PACKAGE_ROOT })` from new simulator.
- Both via `fs.mkdtemp(os.tmpdir() + '/convoke-parity-')`; cleaned up in `after()`.
- Honors `test-fixture-isolation` Rule.

**AC3 — Per-agent SKILL.md content byte-equality across both sandboxes (Decision 1 scope).**
- Schema-guard FIRST: assert `marketplace.plugins[0].skills.length > 0`; fail with "marketplace metadata regression" if empty.
- For each path in `marketplace.plugins[0].skills` (count derived at runtime per `derive-counts-from-source` Rule — currently 7):
  - `canonicalId = path.basename(skillRel)` (e.g., `contextualization-expert`).
  - **Source SKILL.md** in repo at `<PACKAGE_ROOT>/<skillRel>/SKILL.md`. Read bytes.
  - **Sandbox A SKILL.md(s)** at:
    - `<sandboxA>/_bmad/bme/_vortex/agents/<canonicalId>/SKILL.md` (source preserved by `refreshInstallation`)
    - `<sandboxA>/.claude/skills/bmad-agent-bme-<canonicalId>/SKILL.md` (wrapper — content WILL DIFFER from source per Story 3.1 design; wrapper points back at source via `<agent-activation>` block; **NOT in parity scope** per AC3 — see I5 cross-check)
  - **Sandbox B SKILL.md** at `<sandboxB>/.claude/skills/<canonicalId>/SKILL.md` (BMAD-flattened layout).
  - **Assertion:** source SKILL.md bytes === sandbox A's `_bmad/.../SKILL.md` bytes === sandbox B's `.claude/skills/<canonicalId>/SKILL.md` bytes.
- Failure produces structured message via `assert` (path + mode + first-differing-offset).

**AC4 — Exclusion list applied mechanically (Decision 3, mirrors BMAD's filter).**
- `PARITY_EXCLUSIONS` imported from simulator (`shared-test-constants` Rule).
- Helper applies: `basename.toLowerCase() ∈ exclusionBasenames` OR `basename.endsWith(<suffix>)` (any of `.bak`, `~`, `.swp`, `.swo`) OR `basename.startsWith('.') && basename !== '.gitkeep'` OR `path.includes('/node_modules/')`.
- File mtimes never inspected.

**AC5 — Drift produces actionable failure with hint table.**
- `PARITY_HINTS` table exported from simulator. Hints:
  - `source-missing`: "marketplace.json declares path that doesn't exist in source repo — check Story 3.1's marketplace.json or skill-dir migration."
  - `npm-missing`: "`refreshInstallation` didn't materialize <id>/SKILL.md — check `AGENT_IDS` registry coverage."
  - `marketplace-sim-missing`: "marketplace simulator failed to copy <id>/SKILL.md — check simulator + filter list."
  - `byte-diff`: "<id>/SKILL.md content differs from source — one path is mutating the file post-copy."

**AC6 — Test runs in ≤ 10 seconds total.**
- Budget: 2× NFR4 audit budget. Likeliest culprit if over: `refreshInstallation` (~3-5s).
- Overrun action per Decision 4: `t.skip()` + diagnostic + surface.

**AC7 — Scope discipline.**
- MUST NOT touch: `.claude-plugin/marketplace.json`, `_bmad/bme/_vortex/module.yaml`, `scripts/install-*.js`, `scripts/audit/*.js`, `scripts/update/lib/*.js`, `scripts/postinstall.js`, `package.json`, any `_bmad/bme/_vortex/agents/` file, any `.claude/skills/` file.
- IN scope (4 new + 1 modified):
  - **New:** this story file, `tests/integration/dual-distribution-parity.test.js`, `tests/integration/lib/marketplace-installer-sim.js`, `tests/unit/marketplace-installer-sim.test.js`.
  - **Modified:** `_bmad-output/implementation-artifacts/sprint-status.yaml` (status only).

**AC8 — Validation gates green.**
- [ ] 8.1 `npm run test:integration` passes; baseline N=87 → N+5 (≥5 cases I1-I5).
- [ ] 8.2 `npm test` passes; new unit-test file adds 3 cases (U1-U3).
- [ ] 8.3 `npm run lint` clean for the 3 new JS files.
- [ ] 8.4 `git diff HEAD --stat` confirms AC7 scope.
- [ ] 8.5 Both sandboxes pass `audit-skill-dirs` defensively (5th `it()` block I5 — runs `runScript('scripts/audit/audit-skill-dirs.js', [], { cwd: sandbox })` against both sandboxes; both should exit 0).

## Tasks / Subtasks

(Tasks reference ACs by number; Tasks are execution steps.)

- [x] **Task 0: Pre-flight gates** ✅ All 3 subtasks green post-BUG-6 side-fix commit.
  - [x] 0.1 `npm run test:integration` baseline: **87 pass / 0 fail / 0 skip / exit 0**. N=87 captured for AC8.1 delta math. _Initial run flagged 8 pre-existing failures from Story 3.1 skill-dir test-fixture lag → HALTed → operator drove BUG-6 side-fix off-branch → resumed green._
  - [x] 0.2 marketplace.json verified: `skills: 7 has_module_def: false`.
  - [x] 0.3 Test runner glob verified: `scripts/test-runner.js` walks roots recursively, collects `*.test.js`. `tests/integration/lib/marketplace-installer-sim.js` (no `.test.js` suffix) won't be collected — correct.

- [x] **Task 1: DEF-SPIKE — verify PluginResolver behavior** ✅ DS1 fully resolved (15 min, well within 60-min time-box). DS2 + DS3 superseded by DS1 findings (no longer needed).
  - [x] 1.1 **DS1 (CRITICAL):** fetched `tools/installer/modules/plugin-resolver.js` (398 LOC) + `tools/installer/core/installer.js` (1594 LOC) + `tools/installer/modules/community-manager.js` (484 LOC) + `tools/installer/ide/_config-driven.js` (647 LOC) + `tools/installer/core/manifest-generator.js` (852 LOC) from `bmad-code-org/BMAD-METHOD@HEAD` 2026-04-25.
    - **Finding 1:** PluginResolver only RESOLVES (returns `ResolvedModule[]`); doesn't INSTALL. Consumer in `installer.js → _setupIdes → ide-config-driven.installVerbatimSkills` materializes files.
    - **Finding 2:** Convoke would hit Strategy 5 (synthesize fallback) — no `module.yaml` at `_bmad/bme/_vortex/agents/` common parent, no `module-help.csv`, no `-setup` skill, 7 skills (not 1), no `assets/` dirs.
    - **Finding 3 (CRITICAL — INVERTED Decision 1 v1):** marketplace install REMOVES `_bmad/.../<id>/` skill-dirs post-install (`installer.js:91 _cleanupSkillDirs`); skills land ONLY in IDE dirs (`.claude/skills/<canonicalId>/SKILL.md` where `canonicalId = path.basename(sourceDir)` per `manifest-generator.js:143`). Convoke's npm path produces BOTH `_bmad/.../<id>/SKILL.md` AND `.claude/skills/bmad-agent-bme-<id>/SKILL.md` — STRUCTURALLY DIFFERENT TREES.
    - **Finding 4:** Filter list in BMAD's `installVerbatimSkills` (`ide-config-driven.js:171-178`): `.DS_Store`, `Thumbs.db`, `desktop.ini`, dot-prefixed (except `.gitkeep`), suffixes `~`/`.swp`/`.swo`/`.bak`. **Decision 3 v1 was directionally correct but missing `Thumbs.db`/`desktop.ini`/dot-prefix/swap-suffixes — extended in v2.**
    - **Finding 5:** BMAD installer runs `npm install --omit=dev` on cloned community repo (`community-manager.js:380`). Convoke's `scripts/postinstall.js` verified benign (prints help text only; no agent materialization). Assumption (ii) holds for Convoke specifically.
    - **OUTCOME:** Decision 1 v1 inverted — pivoted to "content-equivalence regardless of destination path" (Decision 1 v2). Spec rewrite applied.
  - [x] 1.2 60-min time-box not hit (~15 min total). No backlog re-verification item needed.
  - [x] 1.3 **DS2 (whiteport precedent):** SUPERSEDED by DS1 findings. With direct knowledge of BMAD's install behavior + filter list, whiteport-design-studio post-install layout would just confirm the same. Skipped.
  - [x] 1.4 **DS3 (refreshInstallation non-content audit):** SUPERSEDED. Decision 3 exclusion list now mirrors BMAD's own filter list verbatim — adequacy proven by construction.

- [ ] **Task 2: Author `tests/integration/lib/marketplace-installer-sim.js`** (Decision 2 v2).
  - [ ] 2.1 `mkdir -p tests/integration/lib`. Filename ends in `-sim.js` not `.test.js`.
  - [ ] 2.2 Implement per Decision 2 v2:
    ```js
    'use strict';
    const fs = require('fs-extra');
    const path = require('path');

    const PARITY_EXCLUSIONS = Object.freeze({
      basenames: new Set(['.ds_store', 'thumbs.db', 'desktop.ini']),  // lowercase per case-insensitive match
      suffixes: ['.bak', '~', '.swp', '.swo'],
      pathContains: ['/node_modules/']
    });

    const PARITY_HINTS = Object.freeze({
      'source-missing': "marketplace.json declares path that doesn't exist in source repo — check Story 3.1's marketplace.json or skill-dir migration.",
      'npm-missing': "refreshInstallation didn't materialize <id>/SKILL.md — check AGENT_IDS registry coverage.",
      'marketplace-sim-missing': "marketplace simulator failed to copy <id>/SKILL.md — check simulator + filter list.",
      'byte-diff': "<id>/SKILL.md content differs from source — one path is mutating the file post-copy."
    });

    function isExcluded(filePath) {
      const base = path.basename(filePath).toLowerCase();
      if (PARITY_EXCLUSIONS.basenames.has(base)) return true;
      if (PARITY_EXCLUSIONS.suffixes.some(s => base.endsWith(s))) return true;
      if (base.startsWith('.') && base !== '.gitkeep') return true;
      if (PARITY_EXCLUSIONS.pathContains.some(p => filePath.includes(p))) return true;
      return false;
    }

    async function marketplaceInstall(destRoot, { sourceRepo }) {
      const manifestPath = path.join(sourceRepo, '.claude-plugin/marketplace.json');
      const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'));
      if (!manifest.plugins?.[0]?.skills?.length) {
        throw new Error('marketplace.json regression: plugins[0].skills missing or empty');
      }
      const ideSkillsDir = path.join(destRoot, '.claude/skills');
      for (const plugin of manifest.plugins) {
        for (const skillRel of plugin.skills) {
          const cleanRel = skillRel.replace(/^\.\//, '');
          const sourceDir = path.join(sourceRepo, cleanRel);
          const canonicalId = path.basename(cleanRel);
          const destDir = path.join(ideSkillsDir, canonicalId);
          await fs.copy(sourceDir, destDir, {
            overwrite: true,
            filter: (src) => !isExcluded(src) || src === sourceDir
          });
        }
      }
    }

    module.exports = { marketplaceInstall, PARITY_EXCLUSIONS, PARITY_HINTS, isExcluded };
    ```
  - [ ] 2.3 Smoke-test:
    ```bash
    node -e "(async()=>{const t=await require('fs-extra').mkdtemp(require('os').tmpdir()+'/sim-'); await require('./tests/integration/lib/marketplace-installer-sim').marketplaceInstall(t,{sourceRepo:process.cwd()}); console.log(require('fs').readdirSync(t+'/.claude/skills'))})()"
    ```
    Expected: 7 canonicalId dirs (`contextualization-expert`, `discovery-empathy-expert`, `hypothesis-engineer`, `lean-experiments-specialist`, `learning-decision-expert`, `production-intelligence-specialist`, `research-convergence-specialist`).

- [ ] **Task 3: Author `tests/unit/marketplace-installer-sim.test.js`** (per O1; 3 cases).
  - [ ] 3.1 Test cases:
    - **U1:** simulator parses manifest + materializes 7 paths into `<dest>/.claude/skills/<canonicalId>/`.
    - **U2:** `isExcluded()` correctly classifies `.DS_Store`, `Thumbs.db`, `foo.bak`, `foo~`, `foo.swp`, `.hidden`, `.gitkeep` (not excluded), `path/with/node_modules/file`.
    - **U3:** simulator throws on malformed manifest (missing plugins, missing skills, empty skills).

- [ ] **Task 4: Author `tests/integration/dual-distribution-parity.test.js`** (AC1-AC6 + AC8.5).
  - [ ] 4.1 Scaffold from `fresh-install.test.js` template.
  - [ ] 4.2 Test cases (≥ 5):
    - **I1: Schema-guard pass** — assert `marketplace.plugins[0].skills.length > 0`.
    - **I2: Per-agent content equivalence (sandbox A vs source)** — for each `skillRel` in `marketplace.plugins[0].skills`, source SKILL.md bytes === sandbox A's `_bmad/<skillRel>/SKILL.md` bytes.
    - **I3: Per-agent content equivalence (sandbox B vs source)** — for each `skillRel`, source SKILL.md bytes === sandbox B's `.claude/skills/<canonicalId>/SKILL.md` bytes.
    - **I4: Drift detection (sub-fixture)** — clone `sandboxB` to `sandboxBPrime`, mutate one byte in known SKILL.md in `sandboxBPrime`, call parity helper inside `assert.throws(...)`, assert message includes path + `byte-diff` + hint from `PARITY_HINTS`.
    - **I5 (per AC8.5): both sandboxes pass `audit-skill-dirs`** — defensive cross-check via `runScript('scripts/audit/audit-skill-dirs.js', [], { cwd: sandbox })`. Both sandboxes should exit 0.
  - [ ] 4.3 Implement local `assertContentEquivalence(skillRels, source, sandboxA, sandboxB)` helper in test file.
  - [ ] 4.4 `DEBUG=convoke:parity` env var: when set, log path + size of every compared file. Off by default.

- [ ] **Task 5: Verify perf + scope + lint** (AC6 + AC7 + AC8.3).
  - [ ] 5.1 `node --test tests/integration/dual-distribution-parity.test.js` — wall-clock ≤ 10s. If exceeded: per Decision 4, skip + diagnostic + surface.
  - [ ] 5.2 `npm run lint` — clean for 3 new JS files.
  - [ ] 5.3 `git diff HEAD --stat` — confirm AC7 scope.
  - [ ] 5.4 Spot-check: `npx convoke-validate-marketplace` exits 0 (defensive).

## Dev Notes

**Story shape:** tests-only verification (no production code). Deliverable is a CI-enforced INVARIANT (content equivalence), not a feature.

**Why Decision 1 v2 (content not paths):** the two paths produce structurally different trees by BMAD design (npm preserves `_bmad/.../<id>/` source; marketplace flattens to `.claude/skills/<canonicalId>/` and removes `_bmad/.../<id>/`). Comparing trees-as-paths is structurally impossible. The MEANINGFUL question for FR22 is: "does the user get the same SKILL.md bytes regardless of install path?" That's what Decision 1 v2 tests.

**Why Decision 2 v2 (replicate END STATE not choreography):** BMAD's full install pipeline (PluginResolver → synthesized module-help.csv → npm install → manifest-generator → installVerbatimSkills) involves intermediate metadata sidecars that don't materialize SKILL.md content. Replicating just the SKILL.md materialization step (the part that affects user experience) keeps the simulator focused + deterministic.

**Why Decision 3 v2 (mirror BMAD's filter):** verified at `ide-config-driven.js:171-178`. Using BMAD's own filter list eliminates a class of false-positive failures and keeps Convoke's parity test aligned with BMAD's own behavior.

**Anti-patterns to avoid:**
- DON'T modify `marketplace.json`/`module.yaml` (Story 3.1 territory; missing `module_definition` is D-V34-E11 follow-up).
- DON'T modify `refreshInstallation`/install-vortex (would invalidate one side of comparison).
- DON'T spawn `convoke-install` CLI for sandbox A (`installer-e2e.test.js` already covers CLI).
- DON'T hardcode "7" anywhere — derive from `marketplace.json.plugins[0].skills.length`.
- DON'T compare file mtimes / sizes / wrapper-content (wrapper SKILL.md DIFFERS from source SKILL.md by design — Story 3.1 wraps with activation block).
- DON'T `require()` marketplace.json in test (Node module cache); use `fs.readFileSync + JSON.parse`.
- DON'T trust `process.cwd()` in simulator; accept `sourceRepo` parameter.

**External dependencies + risk:**
- **PR1 RESOLVED post-DS1:** Decision 1 inversion confirmed + applied; spec rewritten. No further surprises expected.
- **PR2:** if BMAD changes the `canonicalId = path.basename(skillDir)` convention in a future v6.4+, the simulator will need an update. Bound to BMAD-METHOD@HEAD as of 2026-04-25.

## Testing

**New tests:** ≥ 5 cases in integration test (`I1–I5`) + 3 cases in unit test (`U1–U3`) = 8 new test functions.

**Test count delta:** baseline `npm run test:integration` 87 → 92 (+5); baseline `npm test` 1423 → 1426 (+3).

**Validation surface for review sign-off:**
- AC1 file exists at correct path + uses `node:test`.
- AC2 sandboxes are tmpdirs; teardown cleans up.
- AC3 content equivalence verified across source + both sandboxes.
- AC4 exclusion list mirrors BMAD's filter.
- AC5 synthetic-mutation case (I4) PROVES assertion fires loudly.
- AC6 wall-clock ≤ 10s (or skipped per Decision 4).
- AC7 `git diff --stat` confirms 4 new files + sprint-status.yaml.
- AC8 npm + lint green.

## References

- **Epic 3 Story 3.4:** [`convoke-epic-bmad-v6.3-adoption.md §Story 3.4`](../planning-artifacts/convoke-epic-bmad-v6.3-adoption.md#story-34-dual-distribution-parity-verification).
- **Architecture Decision 5 + 7:** [`convoke-arch-bmad-v6.3-adoption.md`](../planning-artifacts/convoke-arch-bmad-v6.3-adoption.md).
- **Story 3.1 (shipped):** [`v63-3-1-create-and-validate-marketplace-metadata.md`](v63-3-1-create-and-validate-marketplace-metadata.md).
- **BMAD source verified:** `bmad-code-org/BMAD-METHOD@HEAD` 2026-04-25 — `tools/installer/modules/plugin-resolver.js`, `tools/installer/core/installer.js`, `tools/installer/core/manifest-generator.js`, `tools/installer/ide/_config-driven.js`.
- **Project rules:** [`project-context.md`](../../project-context.md).

## Project structure notes

**New files (4):**
- `_bmad-output/implementation-artifacts/v63-3-4-dual-distribution-parity-verification.md` (this file).
- `tests/integration/dual-distribution-parity.test.js` — projected ~140-180 LOC.
- `tests/integration/lib/marketplace-installer-sim.js` — projected ~50-70 LOC.
- `tests/unit/marketplace-installer-sim.test.js` — projected ~80-110 LOC (3 cases).

**Modified files (1):** `_bmad-output/implementation-artifacts/sprint-status.yaml`.

**Projected total:** ~270-360 LOC test code.

## Dev Agent Record

**Agent Model Used:** Opus 4.7 (1M context).

**DEF-SPIKE tracking (post-DS1, all resolved or superseded):**
- [x] **DS1 RESOLVED** (15 min, well within 60-min time-box) — fetched + read PluginResolver + installer + manifest-generator + ide-config-driven from `bmad-code-org/BMAD-METHOD@HEAD`. 5 findings inverted Decision 1 v1; spec rewritten in place 2026-04-25 per operator option 4 (spec-rewrite).
- [x] **DS2 SUPERSEDED** by DS1 (whiteport-precedent path-preservation check no longer needed; direct BMAD source knowledge supersedes inference from precedent).
- [x] **DS3 SUPERSEDED** by DS1 (exclusion list now mirrors BMAD's own filter; adequacy proven by construction not audit).

**Deferred work to surface during/after dev:**
- **D-V34-E11 (deferred-work.md, logged at story creation):** Story 3.1 follow-up to add `module_definition: _bmad/bme/_vortex/module.yaml` to `.claude-plugin/marketplace.json`. Still applicable — marketplace.json still lacks the field.
- **D-V34-E5 (deferred-work.md, logged at V-pass):** PluginResolver CLI re-verification when BMAD ships local CLI. **Now PARTIALLY RESOLVED via DS1** — direct source-read of PluginResolver + installer + ide-config-driven proves the install behavior at @HEAD 2026-04-25. Re-verification still useful when BMAD ships a stable CLI release; demote to "monitor for BMAD CLI release notes."

**Deviations from spec (filled during implementation):**
- **2026-04-25 DS1 inversion:** Decision 1 v1 (parity-of-tree-paths) inverted to Decision 1 v2 (parity-of-content). Decision 2 v1 (preserve source-relative paths) updated to Decision 2 v2 (flatten to `.claude/skills/<canonicalId>/` per BMAD's `manifest-generator.js:143` rule). Decision 3 v1 (4-class exclusion list) extended to v2 (mirrors BMAD's full filter — adds `Thumbs.db`/`desktop.ini`/dot-prefix/swap-suffixes). Decision 4 unchanged. Spec rewritten in place per operator option 4.

**Debug Log References:**
- DS1 spike artifacts: `/tmp/plugin-resolver.js`, `/tmp/bmad-installer.js`, `/tmp/community-manager.js`, `/tmp/ide-config-driven.js`, `/tmp/manifest-gen.js`, `/tmp/bmad-install-cmd.js`, `/tmp/ide-manager.js`. All fetched 2026-04-25 from `bmad-code-org/BMAD-METHOD@HEAD`.

**Completion Notes List:**

**File List:**

### Change Log

| Date | Change | Reference |
|------|--------|-----------|
| 2026-04-25 | **Spec-rewrite applied per operator option 4 post-DS1 inversion.** DS1 spike (Task 1.1) fetched 5 BMAD source files from `bmad-code-org/BMAD-METHOD@HEAD` (~3.5K LOC total) and discovered: (1) PluginResolver only RESOLVES, doesn't INSTALL — consumer in `installer.js → _setupIdes → ide-config-driven.installVerbatimSkills` materializes; (2) Convoke would hit Strategy 5 (synthesize fallback); (3) **CRITICAL** — marketplace install REMOVES `_bmad/.../<id>/` skill-dirs post-install (`installer.js:91 _cleanupSkillDirs`); skills land ONLY in IDE dirs at `.claude/skills/<canonicalId>/SKILL.md` where `canonicalId = path.basename(sourceDir)` (`manifest-generator.js:143`); (4) BMAD's own filter list at `ide-config-driven.js:171-178` includes `Thumbs.db`/`desktop.ini`/dot-prefix/swap-suffixes — Decision 3 v1 was missing 4 of these classes; (5) BMAD installer DOES run `npm install --omit=dev` on cloned repo but Convoke's postinstall is benign. **Decision 1 inverted:** v1 (parity-of-tree-paths in `_bmad/.../<id>/`) → v2 (content-equivalence regardless of destination path). **Decision 2 rewritten:** simulator now models END STATE (flatten to `.claude/skills/<canonicalId>/` with BMAD's filter), not the original source-relative-paths assumption. **Decision 3 extended** to mirror BMAD's full filter list. **Decision 4 unchanged** (perf overrun = skip + surface). **ACs rewritten** — AC3 now asserts byte-equality of SKILL.md content across source + both sandboxes (npm path's `_bmad/.../<id>/SKILL.md` AND marketplace path's `.claude/skills/<canonicalId>/SKILL.md`); wrapper SKILL.md (`bmad-agent-bme-<id>`) explicitly NOT in parity scope (Story 3.1 design — wrapper differs from source by activation block). **Tasks rewritten** — Task 1 closed (DS1 done; DS2 + DS3 superseded by DS1's direct knowledge); Task 2 simulator simplified (no synthesized module-help.csv modeling — out of scope per Decision 2 v2); Task 4 test cases reframed around content-equivalence (I2 npm-vs-source + I3 marketplace-vs-source + I4 drift-detection + I5 audit-skill-dirs cross-check). **Story shape unchanged:** tests-only; no production code; no `_bmad/bme/` touched; covenant-checklist N/A. **DS1 finding documented in deferred-work.md as partial resolution of D-V34-E5** (PluginResolver re-verification): direct source knowledge supersedes the original "wait for BMAD CLI" path. **Story status remains in-progress** — Task 0 + Task 1 complete; Tasks 2-5 pending implementation. Estimated complexity REDUCED vs v1 (simulator is simpler — flatten + filter, no source-relative-path mapping; tests focus on content equivalence which is conceptually simpler than tree-equivalence). Total time on DS1 + spec-rewrite: ~30 min. **Operator-action callout:** spec rewrite preserves story scope (FR22 — dual-distribution parity) but reframes the comparison axis from path-equality to content-equality. Operator should verify the new framing matches FR22's INTENT before proceeding to Task 2 implementation. | This file, `tests/integration/lib/marketplace-installer-sim.js` (TBD), `tests/unit/marketplace-installer-sim.test.js` (TBD), `tests/integration/dual-distribution-parity.test.js` (TBD) |
| 2026-04-25 | V-pass (`/bmad-validate-create-story` fresh-context) applied **26 improvements** (7 critical + 10 enhancement + 4 optimization + 5 LLM-opt). **Critical fixes:** C1 (`module_definition` hallucination — verified `marketplace.json.plugins[0]` lacks the field; Decision 1 narrowed to 7 `skills[]` paths only; deferred-work item logged for Story 3.1 follow-up); C2 (`npm test` doesn't run `tests/integration/` — verified `package.json:42`; AC8 + Tasks now use `npm run test:integration`); C3 (`feedback_no_jest` reference dropped; replaced with MEMORY.md C1 reference); C4 ("M3 ship gate" replaced with M12a/M12b); C5 (Task 1.1 spike now mandates fetching + reading PluginResolver source from `bmad-code-org/BMAD-METHOD/tools/cli/installers/`, with HALT condition on assumption (ii) inversion); C6 (byte-comparison threshold pinned single value — no shell-out fallback; symlink handling via `lstatSync`); C7 (Task 2.1 explicit assertion simulator file ends in `-sim.js`). **Enhancement fixes:** E1 (Windows `Thumbs.db` + `desktop.ini` added); E2 (case-insensitive basename match); E3+Decision 4 (perf overrun → skip + surface, no silent relaxation); E4 (read marketplace.json via `fs.readFileSync + JSON.parse`, NOT `require()` — avoids Node cache hidden coupling); E5 (DS1 time-boxed 60min + provisional + backlog re-verification); E6 (`PARITY_HINTS` table exported from simulator); E7 (AC8.5 promotes audit-skill-dirs cross-check to real `it()` block I5); E8 (8 paths → 7 paths everywhere); E9 (schema-guard `skills.length > 0` before iterating); E10 (drift detection uses cloned sub-fixture sandboxBPrime to avoid polluting other `it()` blocks). **Optimization fixes:** O1 (added `tests/unit/marketplace-installer-sim.test.js` with 3 cases U1-U3); O2 (`DEBUG=convoke:parity` env var); O3 (agent-manifest.csv reference dropped); O4 (capture exit code, not grep output, in Task 5.1). **LLM-opt fixes:** L1 (collapsed Decision X + "Why Decision X" duplication; ~30% length cut); L2 (Tasks reference ACs by number, no restating); L3 (References list trimmed); L4 (Change Log entries → bullet structure); L5 (clarified "shell out" semantics — DON'T spawn convoke-install; spawning `diff -q` was over-engineering and removed entirely). **Final spec shape:** 8 ACs + **4 Decisions** (added Decision 4 for AC6 overrun action) + **5 Tasks** + **3 DEF-SPIKEs** (DS1 with HALT condition; DS2 + DS3 inline-resolvable) + **8 new test functions** (5 integration I1-I5 + 3 unit U1-U3). **Story shape unchanged:** tests-only verification; no production code; no `_bmad/bme/` touched; covenant-checklist N/A. **V-pass ROI:** prevented 2 story-killing critical defects (C1+C2 — C1 would have caused dev agent to author code against a non-existent field; C2 would have caused AC8 gates to silently never run); pre-empted 4 task-design defects (C5/E5/E10/O1) requiring operator-driven recovery during /bmad-dev-story; trimmed ~30% of token waste (L1) for the dev agent that consumes this story. Story remains ready-for-dev. | This file |
| 2026-04-25 | Story created via `/bmad-create-story v63-3-4`. 8 ACs + 3 Decisions + 5 Tasks + 3 DEF-SPIKEs covering FR22 dual-distribution parity. Tests-only verification; no production code. Projected ~200-300 LOC test code. | [sprint-status.yaml](sprint-status.yaml) |
