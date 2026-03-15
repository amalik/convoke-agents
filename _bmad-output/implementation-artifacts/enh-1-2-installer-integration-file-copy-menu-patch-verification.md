# Story 1.2: Installer Integration — File Copy, Menu Patch & Verification

Status: done

## Story

As a Product Owner,
I want to install the Enhance module via the standard `convoke-install-vortex` command,
So that the initiatives-backlog workflow is activated in John PM's menu without manual setup.

## Acceptance Criteria

1. **Given** a target project with BMM module installed (pm.md exists) **When** the installer runs `refreshInstallation()` **Then** the `_bmad/bme/_enhance/` directory tree is copied to the target project (FR34) **And** an `<item cmd="IB or fuzzy match on initiatives-backlog" exec="...">` tag is added before `</menu>` in pm.md (FR35) **And** the tag uses 📦 prefix and "(Convoke Enhance)" suffix per architecture convention

2. **Given** the `<item>` tag already exists in pm.md (matching `initiatives-backlog` in cmd attribute) **When** the installer runs again **Then** the tag is not duplicated — skip silently (FR36, FR41, NFR4)

3. **Given** pm.md does not exist in the target project **When** the installer runs **Then** it logs a warning: "pm.md not found — BMM module must be installed first. Skipping Enhance menu patch." and continues without failing (FR37a, NFR5) **And** the `_enhance/` directory copy still proceeds (the files are inert without the menu entry)

4. **Given** pm.md has no `</menu>` tag but has existing `<item>` tags **When** the installer runs **Then** it inserts the new `<item>` tag after the last existing `<item>` tag (fallback anchor)

5. **Given** pm.md exists but has no `</menu>` tag and no `<item>` tags **When** the installer runs **Then** it logs a warning: "pm.md menu structure not recognized — manual patch required. Skipping Enhance menu patch." and continues (FR37b, NFR5)

6. **Given** `config.yaml` at `_bmad/bme/_enhance/config.yaml` is missing **When** the installer runs **Then** it logs a warning: "Enhance config.yaml not found — skipping Enhance installation" and continues (FR49, NFR5)

7. **Given** `config.yaml` is present but unparseable YAML **When** the installer runs **Then** it logs a warning with the parse error and skips Enhance installation (FR49, NFR5)

8. **Given** the installer reads `config.yaml` **When** it discovers registered workflows **Then** it uses the `workflows[]` entries to determine what to install and where (FR38, FR44)

9. **Given** installation completes **When** `validateInstallation()` runs **Then** it confirms all 5 points: (1) enhance directory exists, (2) workflow entry point resolves, (3) menu patch present in pm.md, (4) config.yaml valid, (5) config-to-filesystem consistency (FR39) **And** all failures are reported in a single run, not fail-on-first (FR40)

10. **Given** a Product Owner manually removes the `<item>` tag from pm.md **When** they invoke John PM **Then** the agent works identically to pre-Enhance John PM — no errors, no residual effects (FR42, NFR7a, NFR7b)

11. **Given** the installer has already run once **When** it runs a second time with no changes **Then** `git diff` shows no changes to installer-managed files (NFR4)

## Tasks

### Task 1: Add Enhance directory copy to `refreshInstallation()`

**File:** `scripts/update/lib/refresh-installation.js`

Insert a new section after operation #2 (Vortex workflow copy, ending at line 91) and before operation #3 (config.yaml merge, starting at line 93). The section copies `_bmad/bme/_enhance/` from the package source to the target project.

**Subtasks:**
- 1.1: Read `_bmad/bme/_enhance/config.yaml` from `packageRoot` using `js-yaml`. If file doesn't exist, log warning and skip all Enhance operations. If YAML parse fails, log warning with error details and skip.
- 1.2: Use `fs.copy()` to copy the entire `_bmad/bme/_enhance/` directory tree from `packageRoot` to `projectRoot`. Use `{ overwrite: true }` to handle idempotency.
- 1.3: Respect the `isSameRoot` guard already in `refreshInstallation()` — skip copy when source and destination are the same directory (dev environment).
- 1.4: Push change descriptions to the `changes` array and log when `verbose` is true, matching the style of existing operations.

**Implementation notes:**
- The copy is a whole-directory `fs.copy()`, not file-by-file enumeration. This is simpler and automatically picks up new workflows added to `_enhance/` in future versions.
- The copy happens before the menu patch so that the `<item exec="...">` path points to a file that already exists.
- Unlike Vortex workflows (which `fs.remove()` then `fs.copy()` to clear stale files), Enhance uses `{ overwrite: true }` without pre-removal. Rationale: Enhance has no deprecated files to clean up in v1, and users may add custom files under `_enhance/` that should not be deleted.

### Task 2: Add menu patch logic to `refreshInstallation()`

**File:** `scripts/update/lib/refresh-installation.js`

After the Enhance directory copy (Task 1), add menu patch logic that reads the target pm.md and inserts an `<item>` tag for the initiatives-backlog workflow.

**Subtasks:**
- 2.1: Determine the target agent file path from config.yaml's `workflows[0].target_agent`. Resolve it relative to `projectRoot/_bmad/`. For v1, this resolves to `{projectRoot}/_bmad/bmm/agents/pm.md`.
- 2.2: Check if target agent file exists. If not, log warning: `"${targetAgentFile} not found — BMM module must be installed first. Skipping Enhance menu patch."` and skip patch (do not fail the entire install).
- 2.3: Read the target agent file content as a string.
- 2.4: Build the `<item>` tag string. The tag format is:
  ```
  <item cmd="IB or fuzzy match on initiatives-backlog" exec="{project-root}/_bmad/bme/_enhance/workflows/initiatives-backlog/workflow.md">[IB] 📦 Initiatives Backlog (Convoke Enhance)</item>
  ```
  The `cmd`, `exec`, and label values come from `extensions/bmm-pm.yaml` (read by the installer from the package source, not the target). For v1, these are hardcoded from the single workflow entry.
- 2.5: Check if the tag already exists — search for `initiatives-backlog` in the file content. If found, skip (idempotency). Log: `"Enhance menu patch already present in pm.md — skipping"`.
- 2.6: Find insertion anchor — search for `</menu>`. If found, insert the new `<item>` tag (with proper indentation: 4 spaces) on a new line before `</menu>`.
- 2.7: Fallback anchor — if `</menu>` not found, search for the last `<item` occurrence. If found, insert after the closing `</item>` of that line.
- 2.8: If neither anchor found, log warning: `"pm.md menu structure not recognized — manual patch required. Skipping Enhance menu patch."` and skip.
- 2.9: Write the patched content back to the target agent file.
- 2.10: Push change description and log.

**Implementation notes:**
- Detection uses string `includes('initiatives-backlog')` — this catches the tag regardless of quote style, attribute order, or whitespace. Matching is intentionally broad to prevent duplication.
- Indentation: existing `<item>` tags in pm.md use 4-space indentation inside `<menu>`. Match this.
- The `exec` path uses `{project-root}` prefix (not a resolved absolute path). This is the BMAD convention — the agent runtime resolves `{project-root}` at load time.
- Re-add behavior: if a user removes the tag and runs the installer again, the tag is re-added. This is by design (FR42). To permanently disable, remove the workflow from config.yaml.

### Task 3: Add Enhance verification checks to `validator.js`

**File:** `scripts/update/lib/validator.js`

Add a new `validateEnhanceModule()` function that performs the 5-point verification, and integrate it into `validateInstallation()`.

**Subtasks:**
- 3.1: Create `async function validateEnhanceModule(projectRoot)` that returns a check object `{ name: 'Enhance module', passed: boolean, error: string|null, warning: string|null, info: string|null }`.
- 3.2: If `_bmad/bme/_enhance/` doesn't exist, return `{ passed: true, info: 'Enhance module not installed (optional)' }`. Enhance is optional — its absence is not a failure.
- 3.3: If the directory exists, perform all 5 checks and collect failures:
  - **Check 1 — Directory exists:** `_bmad/bme/_enhance/` exists (already confirmed by reaching this point)
  - **Check 2 — Workflow entry point resolves:** For each workflow in config.yaml, verify `_bmad/bme/_enhance/{entry}` file exists
  - **Check 3 — Menu patch present:** Read target agent file (from config `target_agent`), verify it contains `initiatives-backlog`
  - **Check 4 — Config valid:** Parse `_bmad/bme/_enhance/config.yaml`, verify required fields: `name`, `version`, `description`, `workflows` (array with at least one entry), each workflow has `name`, `entry`, `target_agent`, `menu_patch_name`
  - **Check 5 — Config-to-filesystem consistency:** Every workflow registered in config.yaml has a corresponding directory under `_bmad/bme/_enhance/workflows/` and its `entry` file exists
- 3.4: Collect all failures into a single error string (not fail-on-first). Format: `"Enhance: [check1 failure]; [check2 failure]"`.
- 3.5: Add `checks.push(await validateEnhanceModule(projectRoot))` to `validateInstallation()` after check #7 (workflow step structure).
- 3.6: Export `validateEnhanceModule` from the module.

**Implementation notes:**
- Use `js-yaml` (already imported in validator.js) to parse the Enhance config.
- The check is tolerant of Enhance absence (passed=true with info) but strict when Enhance is present (all 5 points must pass).
- Follows the existing collect-all-failures pattern used by other validator checks.

### Task 4: Write unit tests for `validateEnhanceModule()`

**File:** `tests/unit/validator.test.js` (append new describe block)

**Subtasks:**
- 4.1: Add a new `describe('validateEnhanceModule', ...)` block at the end of the file.
- 4.2: Use the existing test patterns: `before`/`after` with `fs.mkdtemp`/`fs.remove`, `node:test`, `assert/strict`.
- 4.3: Test cases:
  - Passes with info when `_enhance/` directory doesn't exist (optional module)
  - Passes when all 5 checks pass (valid config, workflow entry exists, menu patch present, filesystem consistent)
  - Fails when config.yaml is missing but `_enhance/` dir exists
  - Fails when config.yaml is unparseable
  - Fails when config.yaml is missing required fields (name, version, workflows)
  - Fails when workflow entry point file doesn't exist
  - Fails when menu patch not found in target agent file
  - Fails when config references a workflow that has no directory
  - Reports multiple failures in single error string
- 4.4: For tests requiring a target agent file, create a minimal pm.md in the tmpDir at the path `_bmad/bmm/agents/pm.md` with a `<menu>` block containing `initiatives-backlog`.

**Implementation notes:**
- Import `validateEnhanceModule` from the validator module alongside existing imports.
- Target: 9 test cases covering all 5 verification points plus edge cases.
- Follow the existing test file's style exactly — `describe`/`it` from `node:test`, no external test frameworks.

### Task 5: Write unit tests for Enhance installer operations

**File:** `tests/unit/refresh-installation-enhance.test.js` (new file)

**Subtasks:**
- 5.1: Create a new test file for Enhance-specific `refreshInstallation()` behavior. Using a separate file prevents the existing `refresh-installation.test.js` from growing too large and keeps Enhance tests isolated.
- 5.2: Import `refreshInstallation` from `../../scripts/update/lib/refresh-installation`.
- 5.3: Use the existing test infrastructure: `node:test`, `fs-extra`, `path`, `os`, `js-yaml`, `silenceConsole`/`restoreConsole` from `../helpers`.
- 5.4: Test cases for directory copy:
  - Copies `_enhance/` directory to target project
  - Skips copy in dev environment (source === destination)
  - Skips Enhance operations when `_enhance/config.yaml` doesn't exist in package
  - Logs warning when `config.yaml` is unparseable
- 5.5: Test cases for menu patch:
  - Adds `<item>` tag before `</menu>` in pm.md
  - Does not duplicate tag on second run (idempotency)
  - Uses fallback anchor (after last `<item>`) when no `</menu>`
  - Logs warning when pm.md not found
  - Logs warning when pm.md has no menu structure
  - Tag uses correct indentation (4 spaces)
- 5.6: Test cases for idempotency:
  - Running twice produces identical file content (both pm.md and `_enhance/` tree)
- 5.7: Test case for package.json:
  - Verify `package.json` `files` array includes an entry covering `_bmad/bme/_enhance/` (prevents regression if someone removes it during cleanup)

**Implementation notes:**
- These tests need a real `_enhance/` directory in the package source to copy from. Since Story 1.1 already created these files, the test can use `PACKAGE_ROOT` from helpers.js to reference them.
- For pm.md tests, create a minimal agent file in the tmpDir:
  ```
  <agent>
  <menu>
    <item cmd="test">[T] Test</item>
  </menu>
  </agent>
  ```
- Console silencing: use `silenceConsole()`/`restoreConsole()` to suppress verbose output during tests.
- The `refreshInstallation()` function requires the full Vortex structure to run without errors. Use `createValidInstallation(tmpDir)` from helpers to set up the prerequisite Vortex files, then also create a minimal `_bmad/bmm/agents/pm.md` in the tmpDir for the menu patch target.

### Task 6: Add `_enhance/` to `package.json` `files` array

**File:** `package.json`

The `files` array controls what gets published to npm. Currently it lists `"_bmad/bme/_vortex/"` but not `_enhance/`. Without this entry, the `_enhance/` directory won't be in the published package and `refreshInstallation()` won't have source files to copy.

**Subtasks:**
- 6.1: Add `"_bmad/bme/_enhance/"` to the `files` array in `package.json`, after the existing `"_bmad/bme/_vortex/"` entry.

### Task 7: Verify idempotency and backward compatibility

**Subtasks:**
- 7.1: Run `refreshInstallation()` against a test directory, then run it again. Verify the `_enhance/` directory content is identical and pm.md has exactly one `<item>` tag for initiatives-backlog.
- 7.2: Verify that the existing 328 tests still pass (zero regressions).
- 7.3: Run the new tests and confirm all pass.

## Dev Notes

### Architecture: Where Code Changes Go

**4 files modified, 1 file created:**

| File | Change | Lines affected |
|------|--------|---------------|
| `scripts/update/lib/refresh-installation.js` | Add Enhance section (copy + menu patch) | Insert after line 91 |
| `scripts/update/lib/validator.js` | Add `validateEnhanceModule()` + integrate | New function + 1 line in `validateInstallation()` |
| `package.json` | Add `_enhance/` to `files` array | 1 line insert |
| `tests/unit/validator.test.js` | Add `validateEnhanceModule` test block | Append at end |
| `tests/unit/refresh-installation-enhance.test.js` | New test file | New file |

### refreshInstallation() Operation Order

Current operations (numbered in the code):
1. Copy agent files
2. Copy workflow directories
3. Update config.yaml (Vortex)
4. Regenerate agent-manifest.csv
5. Copy user guides
6. Clean up legacy commands + generate skills
7. Generate customize files

**Enhance operations insert between #2 and #3:**
- 2a. Read Enhance config.yaml from package source
- 2b. Copy `_enhance/` directory tree
- 2c. Patch target agent menu (pm.md)

This position ensures Enhance files are in place before any downstream operations that might reference them. It also means a config.yaml parse failure in Enhance doesn't affect Vortex operations (which are already complete).

### Config Schema Difference — Critical Warning

The Enhance `config.yaml` at `_bmad/bme/_enhance/config.yaml` uses a **different schema** than the Vortex `config.yaml` at `_bmad/bme/_vortex/config.yaml`:

**Enhance config.yaml:**
```yaml
name: enhance
version: 1.0.0
description: "Enhance module — capability upgrades for existing BMAD agents"
workflows:
  - name: initiatives-backlog
    entry: workflows/initiatives-backlog/workflow.md
    target_agent: bmm/agents/pm.md
    menu_patch_name: "initiatives-backlog"
```

**Vortex config.yaml (DO NOT COPY THIS PATTERN):**
```yaml
submodule_name: _vortex
version: 2.2.0
agents: [...]
workflows: [...]
```

The Enhance config is NOT processed by `config-merger.js`. It is read directly with `js-yaml` in the new installer section. Do not call `configMerger.mergeConfig()` or `configMerger.writeConfig()` on the Enhance config — those functions expect the Vortex schema.

### Menu Patch Details

**Target file:** `_bmad/bmm/agents/pm.md` (in target project)

**Current menu structure (lines 50-61 of pm.md):**
```xml
<menu>
    <item cmd="MH or fuzzy match on menu or help">[MH] Redisplay Menu Help</item>
    <item cmd="CH or fuzzy match on chat">[CH] Chat with the Agent about anything</item>
    <item cmd="CP or fuzzy match on create-prd" exec="...">[CP] Create PRD: ...</item>
    <item cmd="VP or fuzzy match on validate-prd" exec="...">[VP] Validate PRD: ...</item>
    <item cmd="EP or fuzzy match on edit-prd" exec="...">[EP] Edit PRD: ...</item>
    <item cmd="CE or fuzzy match on epics-stories" exec="...">[CE] Create Epics and Stories: ...</item>
    <item cmd="IR or fuzzy match on implementation-readiness" exec="...">[IR] Implementation Readiness: ...</item>
    <item cmd="CC or fuzzy match on correct-course" exec="...">[CC] Course Correction: ...</item>
    <item cmd="PM or fuzzy match on party-mode" exec="skill:bmad-party-mode">[PM] Start Party Mode</item>
    <item cmd="DA or fuzzy match on exit, leave, goodbye or dismiss agent">[DA] Dismiss Agent</item>
</menu>
```

**Tag to insert:**
```xml
    <item cmd="IB or fuzzy match on initiatives-backlog" exec="{project-root}/_bmad/bme/_enhance/workflows/initiatives-backlog/workflow.md">[IB] 📦 Initiatives Backlog (Convoke Enhance)</item>
```

**Insertion point:** Before `</menu>` (after the DA item). The tag is indented with 4 spaces to match existing items.

**Detection:** Search for string `initiatives-backlog` in the file content. This catches the tag regardless of attribute order, quote style, or whitespace variations.

### PRD Deviations — Intentional

Two PRD specifications don't match the actual BMAD codebase conventions. Both deviations are intentional:

**1. Tag detection: `name` attribute vs `cmd` attribute**
The PRD (line 338) specifies: *"Detection matches the `name` attribute value."* However, actual pm.md `<item>` tags have **no `name` attribute** — they use `cmd` and optionally `exec`. The story uses broad substring matching (`includes('initiatives-backlog')`) which catches the string in the `cmd` attribute content. This is more robust than matching a non-existent attribute and aligns with the real tag format.

**2. `exec` path format: relative-to-`_bmad/` vs full `{project-root}` prefix**
The PRD (line 340) shows: `exec="bme/_enhance/workflows/..."` (relative to `{project-root}/_bmad/`). However, every existing `exec` attribute in pm.md uses the full prefix: `exec="{project-root}/_bmad/bmm/workflows/..."`. The story follows the actual codebase convention — full `{project-root}` prefix — matching what BMAD core's menu dispatch expects.

### Fail-Soft vs Fail-Fast Design Decision

The PRD specifies fail-fast for missing pm.md (FR37a) and unrecognized menu structure (FR37b). However, `refreshInstallation()` is called during install and update — failing the entire install because of a missing BMM module would block Vortex installation for users who haven't installed BMM yet.

**Design decision:** Enhance operations use **fail-soft** (log warning, skip, continue) rather than fail-fast (throw error, halt install). This means:
- Missing pm.md → warning + skip menu patch (files still copied)
- Unrecognized menu → warning + skip menu patch (files still copied)
- Missing/unparseable config.yaml → warning + skip all Enhance operations
- The 5-point verification in `validateInstallation()` will catch these issues and report them

This matches the existing pattern where `refreshInstallation()` doesn't throw — it returns a changes array and lets the caller decide what to do.

### Existing Test Infrastructure

**Test framework:** `node:test` (Node.js built-in)
**Assertion:** `node:assert/strict`
**File system:** `fs-extra` for `mkdtemp`, `ensureDir`, `copy`, `remove`
**YAML:** `js-yaml`
**Helpers:** `tests/helpers.js` provides `createValidInstallation(tmpDir)`, `silenceConsole()`, `restoreConsole()`, `PACKAGE_ROOT`

**tmpDir pattern:**
```javascript
let tmpDir;
before(async () => { tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'convoke-enh-')); });
after(async () => { await fs.remove(tmpDir); });
```

**Existing test counts:** 328 tests across the suite. Zero regressions required.

### Validator Integration Pattern

The existing `validateInstallation()` runs 7 checks sequentially, collecting results into a `checks` array. The new Enhance check follows the same pattern:

```javascript
// 8. Enhance module validation (optional — passes if not installed)
checks.push(await validateEnhanceModule(projectRoot));
```

The check must handle three states:
1. **Enhance not installed** → `{ passed: true, info: 'Enhance module not installed (optional)' }`
2. **Enhance installed and valid** → `{ passed: true }`
3. **Enhance installed but invalid** → `{ passed: false, error: 'Enhance: [failures]' }`

### Scope Boundaries

**In scope (this story):**
- `refreshInstallation()` — Enhance directory copy + menu patch logic
- `validator.js` — `validateEnhanceModule()` 5-point check
- Unit tests for both
- Idempotency verification

**Out of scope (do NOT touch):**
- Step files — Stories 1.4-1.6, 2.1, 3.1
- workflow.md content — Story 1.3 (mode dispatch)
- `config-merger.js` — Enhance does NOT use the Vortex config merger
- `agent-registry.js` — Enhance is not registered as an agent
- `package.json` `files` array — beyond adding the `_enhance/` entry (Task 6), no other changes needed
- `convoke-doctor` integration — deferred to post-MVP
- The Enhance `config.yaml` file itself — already created in Story 1.1
- The `extensions/bmm-pm.yaml` file — already created in Story 1.1 (documentation-only in v1)

### References

- [Source: epics-p4-enhance-module.md — Story 1.2 acceptance criteria, lines 253-307]
- [Source: prd-p4-enhance-module.md — Installer Integration Requirements, lines 335-347]
- [Source: prd-p4-enhance-module.md — FR34-FR42, FR44, FR49, lines 518-528]
- [Source: prd-p4-enhance-module.md — NFR4-NFR5, NFR7a-NFR7b, lines 552-563]
- [Source: refresh-installation.js — current 7-operation structure, insert after line 91]
- [Source: validator.js — validateInstallation() 7-check pipeline, line 21-53]
- [Source: validator.test.js — test patterns, tmpDir, node:test]
- [Source: helpers.js — createValidInstallation(), silenceConsole(), PACKAGE_ROOT]
- [Previous story: enh-1-1 — created config.yaml, extensions/bmm-pm.yaml, workflow.md, templates]

## Dev Agent Record

### Completion Notes

All 7 tasks completed. 348 tests pass (328 existing + 20 new), zero regressions.

**Tasks 1-2 (refreshInstallation):** Added Enhance section between operations #2 and #3. Three sub-operations: (2a) read Enhance config.yaml from package source with fail-soft on missing/unparseable, (2b) copy `_enhance/` directory tree with `{ overwrite: true }`, (2c) patch target agent menu by inserting `<item>` tag before `</menu>` with 4-space indentation. Idempotency via `includes(patchName)` check. Fallback anchor (last `<item>` tag) when `</menu>` missing. All edge cases log warnings and skip rather than throwing.

**Task 3 (validator):** Added `validateEnhanceModule()` — 5-point verification (directory, entry point, menu patch, config validity, filesystem consistency). Tolerant of Enhance absence (passed=true with info). Collect-all-failures pattern. Integrated as check #8 in `validateInstallation()`.

**Tasks 4-5 (tests):** 9 validator tests covering all 5 checks + edge cases. 11 installer tests covering directory copy, menu patch insertion, fallback anchor, idempotency, missing pm.md, unrecognized menu, indentation, dev environment skip, package.json files array.

**Task 6 (package.json):** Added `"_bmad/bme/_enhance/"` to `files` array for npm publishing.

**Task 7 (verification):** Full suite passes: 348 tests, 0 failures. Idempotency confirmed — running twice produces identical output.

## File List

**Modified:**
- `scripts/update/lib/refresh-installation.js` — Added js-yaml import, Enhance section (2a/2b/2c) between operations #2 and #3
- `scripts/update/lib/validator.js` — Added `validateEnhanceModule()` function, integrated as check #8, added to exports
- `tests/unit/validator.test.js` — Added `validateEnhanceModule` import and 9-test describe block
- `package.json` — Added `"_bmad/bme/_enhance/"` to `files` array

**Created:**
- `tests/unit/refresh-installation-enhance.test.js` — 11 test cases across 4 describe blocks

## Change Log

- 2026-03-15: Implemented Story 1.2 — Enhance installer integration (directory copy, menu patch, 5-point verification, 20 tests, package.json update)
