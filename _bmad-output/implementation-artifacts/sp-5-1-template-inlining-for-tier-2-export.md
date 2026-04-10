# Story SP-5.1: Template Inlining for Tier 2 Export

Status: ready-for-dev

## Story

As a platform maintainer,
I want the export engine to inline referenced templates into the canonical format and handle skill/sidecar dependencies gracefully,
so that Tier 2 (light-deps) skills can be exported as self-contained files that work without the BMAD framework.

## Acceptance Criteria

1. The export engine (`scripts/portability/export-engine.js`) is extended to support `tier === 'light-deps'` skills. The existing tier check in `exportSkill()` is relaxed from rejecting all non-standalone to rejecting only `pipeline` tier. When a light-deps skill is processed, the engine reads its `dependencies` column from the manifest and categorizes each dependency as one of:
   - **template** — a `.md` file path (relative or absolute within `_bmad/`) that should be inlined
   - **skill-ref** — another skill name (e.g., `bmad-advanced-elicitation`) that can't be inlined but should be documented as a companion requirement
   - **sidecar** — a data file path (e.g., `_bmad/_memory/...`) that is runtime state, not instructional content

   The categorization heuristic: if the dependency matches a skill name in the manifest, it's a `skill-ref`. If it's a path ending in `.md` and exists on disk, it's a `template`. Otherwise it's a `sidecar`.

2. **Template inlining:** For each `template` dependency, the engine reads the file content, strips its YAML frontmatter (if any), applies the same 7-phase transformation pipeline (tool names, framework calls, config vars, etc.), and appends it to the `instructions.md` under a new section:
   ```
   ## Template: <template-display-name>

   Use this template as the starting structure for your output document.

   <inlined template content>
   ```
   The `template-display-name` is derived from the filename (e.g., `prd-template.md` → `PRD Template`). Template placeholder vars like `{{project_name}}`, `{{user_name}}`, `{{date}}` are left as-is with a note: "Replace `{{project_name}}` with your project's actual name."

3. **Skill-ref handling:** For each `skill-ref` dependency, the engine appends a note to the `## Inputs you may need` section:
   ```
   - **Companion skill: <skill-display-name>.** This skill works best alongside <skill-name>. If available, install it separately.
   ```
   The skill-ref is NOT inlined — it's a cross-reference, not content. If the referenced skill is standalone (Tier 1), the note adds "Available in the skills catalog."

4. **Sidecar handling:** For each `sidecar` dependency, the engine appends a note to the `## Inputs you may need` section:
   ```
   - **Persistent data: <filename>.** This skill maintains a data file for session history. Create an empty file at this path if starting fresh.
   ```

5. **Template references in workflow text are replaced.** Lines in the instructions that reference template file paths (e.g., `load ../templates/prd-template.md`, `Read the template at _bmad/...`) are replaced with `see the "Template: <name>" section below`. The replacement is done during the `extractHowToProceed` phase, after step inlining but before final transformations.

6. **The resulting `instructions.md` is self-contained.** After inlining, no external `_bmad/` file references remain (verified by the existing forbidden-string check for `_bmad/`). Config variable references (`{output_folder}`, `{project_name}`, etc.) are either substituted by Phase 6 or left as template placeholders with explicit instructions.

7. **The CLI (`convoke-export.js`) is updated** to accept `--tier 2` (or `--tier light-deps`). The `validateTier()` function is relaxed: `--tier 2` / `--tier light-deps` now proceeds (was exit 3). `--tier 3` / `--tier pipeline` still exits 3. `--all` now exports both Tier 1 AND Tier 2 (was Tier 1 only).

8. **A test file at `tests/lib/portability-tier2-export.test.js`** adds at least 6 tests:
   - **Test 1: `bmad-create-prd` exports successfully.** Call `exportSkill('bmad-create-prd', projectRoot)`. Assert it returns a result (no throw). Assert `instructions` contains `## Template: PRD Template`.
   - **Test 2: template content is inlined.** Assert the result's `instructions` contains the PRD template's body text (e.g., `Product Requirements Document`). Assert no `_bmad/` paths remain.
   - **Test 3: skill-ref dependencies are documented.** Assert `instructions` contains `Companion skill:` for `bmad-advanced-elicitation`.
   - **Test 4: `bmad-cis-agent-storyteller` exports with sidecar notes.** Assert `instructions` contains `Persistent data:`.
   - **Test 5: CLI `--tier 2` batch works.** Run `convoke-export --tier 2 --dry-run`. Assert exit 0 (or 4 if some fail), prints success lines for light-deps skills.
   - **Test 6: `--all` now includes both tiers.** Run `convoke-export --all --dry-run`. Assert success count >= standalone count + light-deps count.

9. **Existing Tier 1 tests are unaffected.** The 71 existing portability tests must still pass. The engine changes are additive — Tier 1 skills follow the same path as before (no dependencies to inline).

## Tasks / Subtasks

- [ ] Task 1: Categorize dependencies in the engine (AC: #1)
  - [ ] Add a function `categorizeDependencies(depsString, projectRoot, manifestSkillNames)` that splits the `;`-separated deps string and classifies each as `template`, `skill-ref`, or `sidecar`
  - [ ] For template deps: resolve the path via `findFileInSubtree` or direct resolution against the skill's directory
  - [ ] Return `{ templates: [{name, path, content}], skillRefs: [{name, tier}], sidecars: [{name, path}] }`

- [ ] Task 2: Implement template inlining (AC: #2, #5, #6)
  - [ ] For each template: read file, strip frontmatter, apply transformations **Phases 1-5 and 7 ONLY** (skip Phase 6 — config var substitution). Phase 6's catch-all regex `\{\{[\w_-]+\}\}` would strip template placeholders like `{{project_name}}`, `{{fr_list}}`, `{{nfr_list}}` with `[your context]`. Templates need their `{{var}}` placeholders preserved so the user knows what to fill in.
  - [ ] To achieve this: extract Phase 6 out of `applyTransformations()` into a separate function `applyConfigVarSubstitution(text, warnings)`. The main `applyTransformations()` calls it as before (no behavior change for existing callers). Template inlining calls `applyTransformations()` with a new `{ skipPhase6: true }` option, or calls the individual phases directly.
  - [ ] Template display name: strip `.md` extension, replace hyphens with spaces, title-case
  - [ ] Add a note line above each inlined template: `> Replace template placeholders (\{\{...\}\}) with your project's actual values.`
  - [ ] Replace template-path references in the workflow text with `see the "Template: <name>" section below`

- [ ] Task 3: Implement skill-ref and sidecar handling (AC: #3, #4)
  - [ ] For skill-refs: append companion-skill notes to the inputs section
  - [ ] For sidecars: append persistent-data notes to the inputs section
  - [ ] Both integrated into `extractInputs()` or as a post-processing step on the sections

- [ ] Task 4: Relax tier check in engine + CLI (AC: #1, #7)
  - [ ] In `exportSkill()`: change the tier check from `!== 'standalone'` to `=== 'pipeline'` (reject only pipeline)
  - [ ] In `convoke-export.js` `validateTier()`: make `--tier 2` / `--tier light-deps` proceed instead of exit 3
  - [ ] In `convoke-export.js` batch mode: `--all` now iterates both `standalone` and `light-deps` tiers
  - [ ] Update `--help` text to reflect the new tier support
  - [ ] **Update sp-2-3 Test 6** (`tests/lib/portability-cli-entry-point.test.js`): currently asserts `--all` and `--tier 1` produce identical success sets. After this change, `--all` includes light-deps too. Change the assertion to: `--all` success count >= `--tier 1` success count (not equal). The `--tier 1` set must be a subset of the `--all` set.

- [ ] Task 5: Write tests (AC: #8)
  - [ ] Create `tests/lib/portability-tier2-export.test.js`
  - [ ] All 6 tests from AC #8 implemented
  - [ ] Use `findProjectRoot()` for engine tests (direct call, not subprocess)
  - [ ] Use `spawnSync` for CLI tests (Tests 5-6)

- [ ] Task 6: Run regression suite + verify (AC: #9)
  - [ ] `npx jest tests/lib/portability` — all portability tests pass (71 existing + 6 new = 77 minimum)
  - [ ] `node scripts/convoke-doctor.js` — same baseline
  - [ ] Manual smoke: `node scripts/portability/convoke-export.js bmad-create-prd --output /tmp/tier2-smoke` — verify the PRD template is inlined

## Dev Notes

### Architecture Compliance (CRITICAL)

- **Template inlining goes in `export-engine.js`** — it's a transformation concern, not a CLI concern. The engine reads template files, transforms them, and includes them in the output. The CLI just calls `exportSkill()` as before.
- **CommonJS.** Match existing convention.
- **No new npm dependencies.**
- **Read-only on source tree.** The engine reads template files but writes nothing.
- **Reuse `applyTransformations()`** for template content — same 7-phase pipeline that processes workflow content.
- **Reuse `findFileInSubtree`** from `validate-classification.js` for template path resolution (Epic 1 retro A2).

### The 5 light-deps skills and their dependency shapes

| Skill | Templates | Skill-refs | Sidecars |
|---|---|---|---|
| `bmad-create-prd` | `prd-template.md` (10 lines) | `bmad-advanced-elicitation`, `bmad-party-mode` | — |
| `bmad-create-epics-and-stories` | `epics-template.md` (61 lines) | `bmad-advanced-elicitation`, `bmad-party-mode` | — |
| `bmad-generate-project-context` | — | `bmad-advanced-elicitation`, `bmad-party-mode` | — |
| `bmad-enhance-initiatives-backlog` | — | `bmad-party-mode` | — |
| `bmad-cis-agent-storyteller` | — | `bmad-cis-storytelling`, `bmad-help` | `stories-told.md`, `story-preferences.md` |

Only 2 skills have actual template files to inline. The other 3 have skill-refs and/or sidecars only — they'll get companion-skill notes but no inlined content.

### Template placeholder handling

Templates contain `{{project_name}}`, `{{user_name}}`, `{{date}}`, `{{fr_list}}`, `{{nfr_list}}`, etc. These are NOT the same as the engine's Phase 6 `{var}` placeholders (single braces). The engine's catch-all regex `\{[\w_-]+\}` would strip single-brace vars, but double-brace `{{var}}` are not caught by that regex. So template placeholders survive the transformation pipeline naturally. Add a note line: "Replace template placeholders ({{...}}) with your project's actual values."

### The tier-check relaxation is minimal

Change one line in `exportSkill()`: `if (skillRow.tier !== 'standalone')` → `if (skillRow.tier === 'pipeline')`. This lets both `standalone` and `light-deps` through. The dependency-inlining code is only triggered when dependencies exist (empty deps string = no-op), so Tier 1 skills are completely unaffected.

### Previous Story Intelligence

- sp-2-2 established the 7-phase transformation pipeline. Template content goes through the same pipeline.
- sp-1-2's `classify-skills.js` populated the `dependencies` column with `;`-separated values. Some are relative paths (`../templates/prd-template.md`), some are skill names (`bmad-advanced-elicitation`), some are absolute-ish paths (`_bmad/_memory/...`).
- sp-1-3's `validate-classification.js` already resolved these paths via `findFileInSubtree`. Reuse that pattern.
- sp-2-3's `validateTier()` returns `{ ok: false, exitCode: EXIT_TIER_NOT_SUPPORTED }` for `--tier 2`. Relax to `{ ok: true, normalizedTier: 'light-deps' }`.

### Path safety (Epic 4 retro A2)

The template inlining reads files from `_bmad/` — these are inside the project tree, not user-provided paths. No cleanup/deletion involved. The path-safety feedback doesn't apply here, but noted for completeness.

### References

- [Source: epics-skill-portability.md#Story 5.1](../planning-artifacts/epics-skill-portability.md) — original AC
- [Source: scripts/portability/export-engine.js](../../scripts/portability/export-engine.js) — `exportSkill()`, `applyTransformations()`, `extractInputs()`
- [Source: scripts/portability/convoke-export.js](../../scripts/portability/convoke-export.js) — `validateTier()`, batch mode
- [Source: _bmad/_config/skill-manifest.csv](../../_bmad/_config/skill-manifest.csv) — dependencies column
- [Source: scripts/portability/validate-classification.js](../../scripts/portability/validate-classification.js) — `findFileInSubtree` pattern

## Out of Scope

- **Platform adapters** (Claude Code/Copilot/Cursor wrappers) — sp-5-2's job.
- **Exporting the full Tier 2 batch and updating the catalog** — sp-5-3's job.
- **Tier 3 (pipeline) export** — explicitly excluded per the portability schema. Pipeline skills are not portable.
- **Inlining referenced skills** — skill-refs are cross-references, not content to inline. A skill that depends on `bmad-advanced-elicitation` gets a note, not the full elicitation instructions.
- **Resolving sidecar file content** — sidecars are runtime state. The export documents their existence but doesn't inline empty/sample content.

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
