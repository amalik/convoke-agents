# Story SP-2.4: Export All Tier 1 Skills

Status: in-progress

## Story

As a platform maintainer,
I want all Tier 1 skills exported with zero failures and quality-verified via automated grep checks,
so that the first batch of portable skills is ready for the catalog repository (sp-3-1/sp-4-1) and I can confidently ship them to teammates.

## Acceptance Criteria

1. Running `node scripts/portability/convoke-export.js --tier 1 --output <tmpdir>` exits 0 (zero failures) and every standalone skill in the manifest produces both `<skill>/instructions.md` and `<skill>/README.md` in the output directory.

2. The export engine's persona resolution succeeds for all 44 unique standalone skills (16 currently pass, 28 currently fail). The fix is a **Strategy 5: workflow-derived persona** added to `export-engine.js`'s `loadPersona()` function. Strategy 5 activates only when Strategies 1-4 all miss. It reads the skill's workflow.md (and optionally SKILL.md) and synthesizes a minimal persona from:
   - **name:** the `**Goal:**` line's action noun or the skill's humanized name (e.g., `bmad-distillator` → `Distillator`)
   - **icon:** `🔧` (generic tool icon — these are persona-less utilities, not named agents)
   - **role:** extracted from `**Goal:**` line or `Your Role:` line if present
   - **identity:** first non-empty paragraph of the `## Overview` section, or the manifest `description` column, capped at 200 chars
   - **communicationStyle:** `''` (empty — these skills are task-oriented, not personality-driven)
   - **principles:** `''` (empty)
   - **source:** `'workflow-derived'`

   Strategy 5 does NOT throw — it always succeeds, producing a minimal-but-valid persona. The fail-loud behavior from sp-2-2 (Fix 4) is preserved for Strategies 1-4; Strategy 5 is the fallback that prevents hard failures for tool-like and wrapper skills.

3. Each exported `instructions.md` contains zero forbidden strings from the sp-2-2 test's `FORBIDDEN_STRINGS` list (19 entries: `Read tool`, `Edit tool`, `Write tool`, `Bash tool`, `Glob tool`, `Grep tool`, `bmad-init`, `bmad-help`, `bmad-speak`, `_bmad/`, `.claude/hooks`, `{project-root}`, `Load step:`, `read fully and follow`, `Read fully and execute:`, `Load fully and follow:`). Verified by a programmatic grep in the test, not eyeballing.

4. Each exported `instructions.md` contains the persona section heading `## You are` (every skill, including workflow-derived personas, gets a `## You are <name>` block).

5. Each exported `README.md` contains: (a) the persona name, (b) the skill description (manifest `description` column), and (c) the literal string `How to use` (the "How to use it" section from the readme-template.md stub).

6. At least 12 exported skills come from the "named persona" categories (bmad-agent-*, bmad-cis-agent-*, bmad-tea, bmad-brainstorming). This is the epic AC's "6 CIS agents + 4 reviews + elicitation + distillator" floor, softened to allow for exact-count variance. The remaining skills (up to 44 total) are workflow-derived persona skills.

7. `exported-skills/` is added to `.gitignore` so the default output directory doesn't pollute the working tree. (This was explicitly deferred from sp-2-3.)

8. A test file at `tests/lib/portability-export-all.test.js` adds at least 5 tests:
   - **Test 1: full batch exits 0.** Run the CLI with `--tier 1 --output <tmpdir>`. Assert exit code 0. Assert the skill directory count equals the manifest's unique standalone count.
   - **Test 2: zero forbidden strings across all exports.** For each `instructions.md` in the output, assert none of the 19 forbidden strings appear.
   - **Test 3: persona section present in all exports.** For each `instructions.md`, assert `## You are` heading exists.
   - **Test 4: README stub validity across all exports.** For each `README.md`, assert it contains the persona name (from the engine result), `How to use`, and the manifest description (first 40 chars — enough to distinguish skills). Strip HTML comments before checking for leftover `<[a-z]...>` placeholders.
   - **Test 5: at least 12 named-persona skills exported.** Load `_bmad/_config/agent-manifest.csv` via `readManifest()` and collect all `displayName` values into a Set (e.g., `{'Carson', 'Winston', 'Murat', 'Sophia', ...}`). For each exported `instructions.md`, check whether its `## You are` line contains any name from that Set. Count the matches. Assert >= 12. This distinguishes rich named-persona exports from workflow-derived `## You are Distillator 🔧` exports without hard-coding a name list.

9. The `ALLOWED_WARNING_TYPES` set in `export-engine.js` is NOT extended — Strategy 5 does not introduce new warning types. The existing `unresolved-template-path` warning (from sp-2-2's Phase 6 catch-all) may fire more often on workflow-derived skills; that's expected and acceptable.

## Tasks / Subtasks

- [ ] Task 1a: Fix Strategy 2 stem-mismatch for 4 CIS wrapper skills (AC: #2)
  - [ ] Debug why Strategies 1-4 fail for the 4 `bmad-cis-*` wrapper skills. The root cause is a stem mismatch between skill name and agent-manifest name:
    - `bmad-cis-storytelling` → agent is `bmad-cis-agent-storyteller` (stem: `storytelling` vs `storyteller`)
    - `bmad-cis-innovation-strategy` → agent is `bmad-cis-agent-innovation-strategist` (stem: `innovation-strategy` vs `innovation-strategist`)
    - `bmad-cis-design-thinking` → agent is `bmad-cis-agent-design-thinking-coach` (suffix: `-coach` IS tried by Strategy 2 — verify this is actually failing, may be a different bug)
    - `bmad-cis-problem-solving` → agent is `bmad-cis-agent-creative-problem-solver` (stem: `problem-solving` vs `creative-problem-solver`)
  - [ ] Add a fuzzy-match fallback to Strategy 2: after the exact-suffix candidates fail, try a **longest-prefix match** against all agent-manifest rows whose name starts with `bmad-cis-agent-`. If a single agent row shares a longest common prefix of at least 20 chars with any candidate, accept it. This handles `-coach`, `-specialist`, `-strategist`, `-solver` stem variations without a hard-coded alias map.
  - [ ] Alternatively (simpler): add a small **alias map** inside `loadPersona()` that maps the 4 known mismatches:
    ```
    const CIS_SKILL_TO_AGENT = {
      'bmad-cis-storytelling': 'bmad-cis-agent-storyteller',
      'bmad-cis-innovation-strategy': 'bmad-cis-agent-innovation-strategist',
      'bmad-cis-design-thinking': 'bmad-cis-agent-design-thinking-coach',
      'bmad-cis-problem-solving': 'bmad-cis-agent-creative-problem-solver',
    };
    ```
    Try alias-map lookup as Strategy 2b (after the suffix candidates, before Strategy 3). The alias map is explicit, auditable, and doesn't risk false-matching new agents.
  - [ ] Choose whichever approach (fuzzy or alias map) is more robust — dev's judgment call. The alias map is safer for a 4-entry set; fuzzy is more forward-compatible.
  - [ ] After this fix, the 4 CIS wrapper skills should resolve to their named personas (Sophia, Victor, Maya, Dr. Quinn) via Strategy 2/2b, NOT via Strategy 5. Verify by re-running the batch and confirming these 4 now appear with rich personas.

- [ ] Task 1b: Add Strategy 5 (workflow-derived persona) to `export-engine.js` (AC: #2)
  - [ ] Add a new function `synthesizePersonaFromWorkflow(skillName, skillContent, workflowContent, skillRow)` below `extractInlinePersona`
  - [ ] Extract `name` from: (a) `**Goal:**` line action noun if recognizable, else (b) `humanizeSkillName(skillRow.name)` — e.g., `bmad-distillator` → `Distillator`, `bmad-testarch-atdd` → `Testarch Atdd`
  - [ ] Set `icon` to `🔧` (generic tool icon)
  - [ ] Extract `role` from: (a) `**Goal:**` line text, or (b) `Your Role:` line text, or (c) manifest `description`
  - [ ] Extract `identity` from: (a) `## Overview` section first paragraph, or (b) manifest `description`, capped at 200 chars
  - [ ] Set `communicationStyle` and `principles` to empty strings
  - [ ] Set `source` to `'workflow-derived'`
  - [ ] This function ALWAYS returns a valid persona object — it never throws
  - [ ] Wire it into `loadPersona()` as the new Strategy 5 (after Strategy 4, before the throw)
  - [ ] After this, only the 24 remaining skills (Groups B + C minus the 4 CIS now fixed) should hit Strategy 5

- [ ] Task 2: Verify all 44 standalone skills export successfully (AC: #1, #2)
  - [ ] Run `node scripts/portability/convoke-export.js --tier 1 --output /tmp/sp-2-4-verify` and confirm exit 0
  - [ ] Count the output directories: should equal the manifest's unique standalone count (currently 44)
  - [ ] Spot-check 3 workflow-derived persona skills: verify the persona section is minimal but valid (`## You are <humanized name> 🔧`)
  - [ ] Spot-check 3 named-persona skills (Carson, Winston, Murat): verify the persona section is rich (name + icon + role + identity + communication style + principles)

- [ ] Task 3: Programmatic forbidden-string verification (AC: #3, #4, #5)
  - [ ] Write a script or inline test that iterates every `instructions.md` in the output and checks for all 19 forbidden strings
  - [ ] Write a check that every `instructions.md` contains `## You are`
  - [ ] Write a check that every `README.md` contains persona name, description, and `How to use`
  - [ ] If any violations are found, fix the engine/CLI (likely transformation rule gaps for skills that weren't tested before)

- [ ] Task 4: Add `exported-skills/` to `.gitignore` (AC: #7)
  - [ ] Check if `.gitignore` exists at project root. If yes, append `exported-skills/` on a new line. If no, create it with `exported-skills/\n` as content. Do NOT clobber existing entries.
  - [ ] Verify `git status` no longer shows the directory after a test export

- [ ] Task 5: Write tests (AC: #8)
  - [ ] Create `tests/lib/portability-export-all.test.js`
  - [ ] Use `child_process.spawnSync` to run the CLI as a subprocess (match sp-2-3 test pattern)
  - [ ] Use `os.tmpdir() + crypto.randomUUID()` for isolated output directories
  - [ ] `afterAll` cleanup with `fs.rmSync(tmpDir, { recursive: true, force: true })`
  - [ ] All 5 tests from AC #8 implemented
  - [ ] **Performance note:** the full batch export takes ~2-5 seconds; use `beforeAll` to run the CLI once and share the output across all 5 tests (avoid running the batch 5x)

- [ ] Task 6: Run regression suite + verify (AC: #1-9)
  - [ ] `npx jest tests/lib/portability` — all portability tests pass (47 existing + 5 new = 52 minimum)
  - [ ] `node scripts/convoke-doctor.js` — same baseline (2 pre-existing issues OK)
  - [ ] `git status --porcelain` after the test run shows NO changes outside tmpdirs

## Dev Notes

### Architecture Compliance (CRITICAL)

- **Strategy 5 goes in `export-engine.js`, NOT the CLI.** The engine is the single source of persona resolution. The CLI just calls `exportSkill()` and handles the result.
- **Strategy 5 is a fallback, not a replacement.** Strategies 1-4 are tried first, in order. Strategy 5 only fires if all 4 miss. This preserves the rich persona data for named agents while providing a minimal persona for tool-like skills.
- **No new npm dependencies.** Strategy 5 uses the same `fs`, `path`, string parsing already in the engine.
- **CommonJS.** Match existing convention.
- **Read-only on source tree.** Strategy 5 reads workflow.md/SKILL.md but writes nothing.

### Why 28 skills fail persona resolution today

The 28 failing standalone skills fall into 3 categories:

**Group A (19 thin wrappers):** `bmad-cis-design-thinking`, `bmad-cis-innovation-strategy`, `bmad-cis-problem-solving`, `bmad-cis-storytelling`, `bmad-create-architecture`, `bmad-create-ux-design`, `bmad-document-project`, `bmad-domain-research`, `bmad-market-research`, `bmad-technical-research`, `bmad-teach-me-testing`, `bmad-testarch-atdd`, `bmad-testarch-automate`, `bmad-testarch-ci`, `bmad-testarch-framework`, `bmad-testarch-nfr`, `bmad-testarch-test-design`, `bmad-testarch-test-review`, `bmad-testarch-trace`. Their SKILL.md just says "Follow the instructions in ./workflow.md" — no inline persona, no agent-manifest match.

**Group B (5 tool-like utilities):** `bmad-advanced-elicitation`, `bmad-editorial-review-prose`, `bmad-editorial-review-structure`, `bmad-index-docs`, `bmad-review-edge-case-hunter`. Functional modules with goal/steps but no persona identity. They have `## Goal`, `Your Role:`, `## Principles` but NOT the `## Identity` / `## Communication Style` headings that Strategy 4 expects.

**Group C (4 partial inline):** `bmad-distillator`, `bmad-product-brief`, `bmad-review-adversarial-general`, `bmad-shard-doc`. Have `## Overview` or `Your Role:` but lack the full `# Name` + `## Identity` + `## Communication Style` trio that Strategy 4's `extractInlinePersona` requires.

**Strategy 5 solves all 3 groups** by synthesizing a minimal persona from the workflow's goal/role/overview text. It doesn't try to invent a rich personality — it provides just enough for the canonical format's `## You are <name>` block to be valid and informative.

### The "persona" vs "no persona" design tension

The epic AC says "each exported `instructions.md` contains the full persona section (name, icon, role, style)." For named agents (Group A skills that dispatch to CIS agents, BMM agents, etc.), this is natural — the persona IS the agent. For tool-like utilities (Groups B and C), forcing a persona is slightly artificial — these skills don't have personalities, they have functions.

Strategy 5 resolves this by producing a persona that reads as a role description rather than a character: `## You are Distillator 🔧` with a role extracted from the goal line, no communication style, no principles. This satisfies the structural invariant without pretending a utility script has a personality.

### Duplicate skill rows in the manifest

The manifest has duplicate rows for skills that appear in multiple modules (e.g., `bmad-shard-doc` appears 3x). sp-2-3 added `Set`-based dedup in the CLI's batch mode. sp-2-4 inherits this behavior — the test asserts the directory count equals the **unique** standalone count (44), not the raw row count.

### Previous Story Intelligence (sp-2-3)

From sp-2-3's completion notes:
- `convoke-export --tier 1 --dry-run` processed all 44 unique standalone skills: 16 success, 28 failure (persona resolution). Exit code 4 (partial failure).
- README stub generation uses `buildReadmeStub()` with 10-placeholder substitution. communicationStyle fallback chain: `communicationStyle → identity → 'See instructions.md for details.'`. Strategy 5's empty communicationStyle will trigger the `identity` fallback in the stub.
- P6 patch routed failure lines to stderr. Tests assert accordingly.
- The reporter only shows `(N warnings)` when N > 0 — clean batch runs are uncluttered.

### Test structure: shared batch run

The full `--tier 1` export takes 2-5 seconds. To avoid running it 5 times, use `beforeAll` to run the CLI once and populate a shared output directory, then run all 5 tests against that snapshot. Use `afterAll` (not `afterEach`) for cleanup.

```js
let tmpDir, cliResult;
beforeAll(() => {
  tmpDir = makeTmpDir();
  cliResult = runCli(['--tier', '1', '--output', tmpDir]);
});
afterAll(() => cleanupTmpDir(tmpDir));
```

### Project Structure Notes

**Files to modify:**
- `scripts/portability/export-engine.js` — add `synthesizePersonaFromWorkflow()`, wire into `loadPersona()` as Strategy 5
- `.gitignore` — add `exported-skills/`

**Files to create:**
- `tests/lib/portability-export-all.test.js` — 5 batch-verification tests

**Files NOT modified:**
- `scripts/portability/convoke-export.js` — CLI is not touched; all persona logic stays in the engine
- `scripts/portability/manifest-csv.js` — read-only
- `_bmad/_config/skill-manifest.csv` — read-only
- `_bmad/_config/agent-manifest.csv` — read-only

**Namespace decision:** Convoke-side code (`scripts/portability/`). Not upstream BMAD.

### References

- [Source: epics-skill-portability.md#Story 2.4](../planning-artifacts/epics-skill-portability.md) — original AC list
- [Source: sp-2-3-cli-entry-point.md](sp-2-3-cli-entry-point.md) — CLI implementation, batch dedup, persona-gap findings
- [Source: sp-2-2-export-engine.md](sp-2-2-export-engine.md) — engine API, 4-strategy persona resolution, `ALLOWED_WARNING_TYPES`
- [Source: scripts/portability/export-engine.js](../../scripts/portability/export-engine.js) — `loadPersona()`, `extractInlinePersona()`, `humanizeSkillName()`
- [Source: scripts/portability/convoke-export.js](../../scripts/portability/convoke-export.js) — CLI, `runBatch()`, `buildReadmeStub()`
- [Source: tests/lib/portability-export-engine.test.js](../../tests/lib/portability-export-engine.test.js) — `FORBIDDEN_STRINGS` list, `assertStructuralInvariants`

## Out of Scope

- **Enriching Strategy 5 personas with actual personality traits** — these are tool-like skills; they don't have personalities. If a skill's maintainer wants a richer persona, they should add a row to agent-manifest.csv (Strategy 1 or 2 picks it up automatically).
- **Fixing manifest duplicate rows** — worked around in CLI; root-cause cleanup is a separate manifest-hygiene story.
- **Reclassifying standalone skills** — if a skill was misclassified as standalone but should be light-deps or pipeline, that's a classify-skills.js fix, not an sp-2-4 concern.
- **Full per-skill README generation** — sp-3-2's job. sp-2-4 only verifies the stub README satisfies the structural invariants.
- **Publishing to the catalog repo** — sp-4-1's job.
- **Tier 2 export** — sp-5-1's job.

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
