# Story SP-4.1: Create and Seed Repository

Status: done

## Story

As a consultant,
I want a GitHub repository I can browse to find and copy skills,
so that I don't need to install BMAD or ask Amalik for help.

## Acceptance Criteria

1. A **seed script** exists at `scripts/portability/seed-catalog-repo.js` (CommonJS, executable) that generates the complete catalog repo content into a staging directory. The script:
   - Runs `exportSkill()` for all Tier 1 standalone skills (reuses the engine, not the CLI subprocess)
   - Runs `generateCatalog()` from `catalog-generator.js` to produce the root `README.md`
   - Writes `buildReadme()` output per skill (reuses from `convoke-export.js`)
   - Creates `LICENSE` (MIT, matching the main Convoke repo)
   - Creates `CONTRIBUTING.md` explaining skills are auto-generated
   - Outputs the staging directory path on success

2. The staging directory structure matches the vision doc:
   ```
   <staging>/
     README.md                    ← decision-tree catalog
     LICENSE                      ← MIT license
     CONTRIBUTING.md              ← auto-generation notice
     bmad-brainstorming/
       README.md                  ← polished per-skill README
       instructions.md            ← canonical LLM-agnostic content
     bmad-agent-architect/
       ...
     (44 skill directories total)
   ```
   No `adapters/` subdirectories for sp-4-1 — those are sp-5-2's territory.

3. **Programmatic verification** is built into the seed script. After generating, it self-verifies:
   - Directory count equals unique standalone skill count (44)
   - Every skill directory contains both `README.md` and `instructions.md`
   - Zero forbidden strings across all `instructions.md` files (same 17-entry list)
   - Every `README.md` contains `How to use`, all 3 platform names, and is under 80 lines
   - Zero `_bmad/` or `.claude/hooks` references in ANY file (README + instructions)
   - Root `README.md` contains `# Convoke Skills Catalog`
   - `LICENSE` contains `MIT`
   - `CONTRIBUTING.md` contains `auto-generated`
   If any check fails, the script prints the failures and exits non-zero WITHOUT creating the staging directory (or cleans it up). If all pass, it prints a success summary.

4. **CLI interface:**
   - `node scripts/portability/seed-catalog-repo.js --output <path>` — generates the staging directory at `<path>` (required flag, no default — explicit is safer for repo seeding)
   - `node scripts/portability/seed-catalog-repo.js --help` — prints usage
   - Exit code 0 on success, 1 on usage error, 2 on generation failure, 3 on verification failure
   - The script does NOT create a git repo, push, or interact with GitHub. It only produces a directory tree. The user handles `git init`, `gh repo create`, and `git push` manually (or via a follow-up script in sp-4-2).

5. **`LICENSE` file** is a standard MIT license with `Copyright (c) 2026 Convoke Contributors` (matching the main repo's `package.json` author field). The license text is embedded as a string constant in the seed script — not copied from the main repo (the catalog repo is a separate project with its own license file).

6. **`CONTRIBUTING.md` file** contains:
   - Title: `# Contributing`
   - A clear statement that skills are auto-generated from the main Convoke repository
   - A note that PRs to skill content will be overwritten on the next regeneration
   - A link to the main Convoke repo for contributing to skill sources
   - Instructions for reporting issues (link to main repo's issues)
   - ~20 lines total

7. **A test file at `tests/lib/portability-seed-catalog.test.js`** adds at least 4 tests:
   - **Test 1: seed script generates correct directory count.** Run the seed script with `--output <tmpdir>`. Assert exit 0, directory count = 44, root `README.md` exists.
   - **Test 2: every skill directory has both files.** For each skill dir, assert `README.md` and `instructions.md` both exist and are non-empty.
   - **Test 3: zero BMAD internals across entire tree.** Walk every `.md` file in the staging tree. Assert none contain `_bmad/`, `bmad-init`, `.claude/hooks`, or `{project-root}`.
   - **Test 4: LICENSE and CONTRIBUTING.md present and valid.** Assert `LICENSE` contains `MIT`, `CONTRIBUTING.md` contains `auto-generated`.

   Tests use `beforeAll` to run the seed script once (takes 2-5s for 44 skills) and share the output. `afterAll` cleans up. **Set `beforeAll` timeout to 30000ms** (same pattern as sp-2-4) — the default 5s Jest timeout is too tight for 44 skill exports + catalog generation + verification.

8. **The seed script reuses existing modules directly** — it does NOT shell out to `convoke-export` CLI or `catalog-generator.js` CLI. It imports:
   - `exportSkill` from `export-engine.js`
   - `generateCatalog` from `catalog-generator.js`
   - `buildReadme` from `convoke-export.js`
   - `readManifest` from `manifest-csv.js`
   - `findProjectRoot` from `utils.js`

   This avoids subprocess overhead and gives the script direct access to error handling (no exit-code parsing).

## Tasks / Subtasks

- [x] Task 1: Create the seed script skeleton (AC: #1, #4, #8)
  - [ ] Create `scripts/portability/seed-catalog-repo.js` with shebang
  - [ ] Import all required modules directly (no subprocess calls)
  - [ ] Parse `--output <path>` and `--help` flags
  - [ ] Exit codes: 0 success, 1 usage, 2 generation failure, 3 verification failure
  - [ ] `--output` is required (no default) — print usage and exit 1 if missing

- [x] Task 2: Implement the generation pipeline (AC: #1, #2, #5, #6)
  - [ ] Read manifest, get unique standalone skill names (Set-based dedup)
  - [ ] For each skill: call `exportSkill(skillName, projectRoot)` to get the engine result, then call `loadSkillRow(skillName, projectRoot)` (exported from `export-engine.js`) to get the skill row as a keyed object (`.name`, `.tier`, `.description`, etc.), then call `buildReadme(skillRow, result, projectRoot)` to get the README content. Write both `instructions.md` (from `result.instructions`) and `README.md` (from `buildReadme`) to `<output>/<skillName>/`
  - [ ] Call `generateCatalog()` and write to `<output>/README.md`
  - [ ] Write `LICENSE` (MIT, embedded constant)
  - [ ] Write `CONTRIBUTING.md` (embedded constant, ~20 lines)
  - [ ] Wrap the entire pipeline in try/catch — on failure, clean up the staging dir and exit 2

- [x] Task 3: Implement self-verification (AC: #3)
  - [ ] After generation, run all 8 verification checks listed in AC #3
  - [ ] Collect all failures into an array
  - [ ] If any failures: print them, clean up the staging dir, exit 3
  - [ ] If all pass: print success summary (skill count, file count, zero violations)

- [x] Task 4: Write tests (AC: #7)
  - [ ] Create `tests/lib/portability-seed-catalog.test.js`
  - [ ] `beforeAll` runs the seed script once via `spawnSync` with `--output <tmpdir>`
  - [ ] All 4 tests from AC #7 implemented
  - [ ] `afterAll` cleanup

- [x] Task 5: Run regression suite + verify (AC: #1-8)
  - [ ] `npx jest tests/lib/portability` — all portability tests pass (63 existing + 4 new = 67 minimum)
  - [ ] `node scripts/convoke-doctor.js` — same baseline
  - [ ] Manual smoke check: `node scripts/portability/seed-catalog-repo.js --output /tmp/catalog-staging && ls /tmp/catalog-staging/ | head -20`

## Dev Notes

### Architecture Compliance (CRITICAL)

- **The seed script is a build-time orchestrator, not a user-facing CLI.** It coordinates the export engine, catalog generator, and README builder into a single pipeline. It's invoked by the maintainer when seeding or regenerating the catalog repo.
- **Direct module imports, not subprocess calls.** The seed script calls `exportSkill()`, `generateCatalog()`, and `buildReadme()` directly. This avoids the overhead of spawning 44+ subprocesses and gives direct access to error objects.
- **CommonJS.** Match existing convention.
- **No new npm dependencies.**
- **The script does NOT interact with GitHub.** No `gh repo create`, no `git init`, no `git push`. Those are manual user actions (or a future CI script). The seed script only produces a directory tree.

### FORBIDDEN_STRINGS is now 5 copies (growing debt)

The verification check uses the same 17-entry forbidden-string list that sp-2-1/sp-2-2/sp-2-4/sp-3-1 tests use. This is the 5th copy. Epic 3 retro A1 flagged this as the #1 test-debt item. The seed script's copy should use the exact same 17 entries as sp-2-4's `portability-export-all.test.js`. If the dev has bandwidth, extracting to a shared constant (`scripts/portability/test-constants.js`) would close A1 — but it's optional for this story.

### Why no default output path

Unlike `convoke-export` (which defaults to `./exported-skills/`), the seed script requires `--output`. This is deliberate — the staging directory is a transient build artifact that the user will `cd` into and `git init`. Defaulting to a project-relative path would risk accidentally committing the catalog into the main Convoke repo.

### GitHub repo creation is manual

`gh` CLI is installed but not authenticated on this machine. Even if it were, creating a public GitHub repo is a high-stakes action that should be user-initiated, not automated by a build script. The seed script produces the directory; the user runs:
```bash
cd <staging-dir>
git init
git add -A
git commit -m "Initial catalog seed — 44 Tier 1 skills"
gh repo create convoke-skills-catalog --public --source=. --push
```

sp-4-2 (End-to-End Validation) may add a convenience wrapper for this, but sp-4-1 keeps it manual.

### `buildReadme` import from `convoke-export.js`

`buildReadme` is exported from `convoke-export.js`. The seed script imports it directly. This requires that `convoke-export.js` is structured for import (it is — `require.main === module` guard protects the CLI entry point from executing on import).

Note: `buildReadme(skillRow, result, projectRoot)` needs a `skillRow` object (manifest row) and an `exportSkill` result. The seed script already has both from its generation loop.

### Self-verification vs. test separation

The seed script has built-in verification (AC #3) because a broken catalog repo is worse than no catalog repo. The tests (AC #7) also verify the output, but from the outside (subprocess invocation). The overlap is intentional — the script catches issues at generation time (fail-fast), the tests catch regressions across code changes.

### Previous Story Intelligence

- sp-2-4 established the batch pattern: iterate standalone skills, call `exportSkill()` per skill, collect results
- sp-3-1's `generateCatalog()` is already exported and takes `projectRoot` as input
- sp-3-2's `buildReadme()` is already exported and takes `(skillRow, result, projectRoot)`
- The `_templateCache` in `convoke-export.js` persists across calls within the same process — good for the seed script (reads template once, reuses for 44 skills)

### References

- [Source: epics-skill-portability.md#Story 4.1](../planning-artifacts/epics-skill-portability.md) — original AC
- [Source: vision-skill-portability.md](../planning-artifacts/vision-skill-portability.md) — repo structure, "zero barrier to entry" framing
- [Source: scripts/portability/export-engine.js](../../scripts/portability/export-engine.js) — `exportSkill()`, `loadSkillRow()`
- [Source: scripts/portability/catalog-generator.js](../../scripts/portability/catalog-generator.js) — `generateCatalog()`
- [Source: scripts/portability/convoke-export.js](../../scripts/portability/convoke-export.js) — `buildReadme()`
- [Source: scripts/portability/manifest-csv.js](../../scripts/portability/manifest-csv.js) — `readManifest()`

## Out of Scope

- **GitHub repo creation / git operations** — manual user action. The script produces a directory, not a repo.
- **CI/CD pipeline for automatic regeneration** — future story.
- **Platform adapter subdirectories** (`adapters/claude-code/`, `adapters/copilot/`, etc.) — sp-5-2's territory.
- **End-to-end validation** (testing exported skills in a clean project) — sp-4-2's job.
- **`--quiet` flag for batch warnings** — deferred from Epic 2 retro A3.
- **FORBIDDEN_STRINGS shared module** — deferred from Epic 3 retro A1 (the seed script's verification uses its own inline list).

## Dev Agent Record

### Agent Model Used

claude-opus-4-6[1m]

### Debug Log References

### Completion Notes List

- **Tasks 1-3 — Seed script:** Built `scripts/portability/seed-catalog-repo.js` (~280 lines). Direct module imports (no subprocess calls): `exportSkill`, `loadSkillRow`, `generateCatalog`, `buildReadme`, `readManifest`. Pipeline: export 44 skills → generate catalog README → write LICENSE + CONTRIBUTING.md. Built-in self-verification: 8 checks (directory count, both files per skill, zero forbidden strings, README validity, zero BMAD internals, root README, LICENSE, CONTRIBUTING). Cleanup on failure (generation or verification). Exit codes: 0/1/2/3.
- **Smoke test:** `--output /tmp/sp41-smoke` → exit 0, 44 skills, 91 files, verification PASSED (zero violations).
- **MIT LICENSE:** Embedded as constant (not copied from main repo). `Copyright (c) 2026 Convoke Contributors`.
- **CONTRIBUTING.md:** 20 lines. Clear auto-generation notice, links to main repo for contributions + issues.
- **4 tests all passing.** `beforeAll` with 60s timeout. Tests verify: directory count (44), both files per skill, zero BMAD internals across entire tree, LICENSE + CONTRIBUTING validity.
- **Regression:** 67/67 portability tests pass. Doctor: 2 pre-existing issues.

### File List

**New:**
- `scripts/portability/seed-catalog-repo.js` (~280 lines, executable)
- `tests/lib/portability-seed-catalog.test.js` (4 tests, ~100 lines)
