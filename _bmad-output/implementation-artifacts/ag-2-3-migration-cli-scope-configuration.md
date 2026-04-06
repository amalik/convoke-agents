# Story 2.3: Migration CLI & Scope Configuration

Status: ready-for-dev

## Story

As a Convoke operator,
I want to control migration scope and get help on usage,
so that I can migrate specific directories and understand all available options.

## Acceptance Criteria

1. **Given** the migration script exists at `scripts/migrate-artifacts.js` with bin entry `"convoke-migrate-artifacts"` in package.json, **When** the operator runs `convoke-migrate-artifacts --help`, **Then** usage documentation is displayed covering: dry-run (default), --apply, --force, --include, --verbose, and all flags
2. `--include planning-artifacts,vortex-artifacts,gyre-artifacts` is the default scope
3. `--include` accepts comma-separated directory names and replaces defaults
4. `_bmad-output/_archive/` is always excluded regardless of --include (FR50)
5. The script creates `taxonomy.yaml` with platform defaults if not present before processing (FR49, idempotent -- never overwrites existing). Bootstrap includes: 8 platform initiatives, empty user array, standard artifact types, empty aliases map.
6. The script uses `findProjectRoot()` to locate the project root (never `process.cwd()`)
7. `parseArgs()` is extracted as a named function at the top of the CLI entry point
8. Dry-run is the default behavior (no flags needed) -- calls `generateManifest()` + `formatManifest()` and prints result
9. `--apply` and `--force` are recognized by `parseArgs()` but print "Not yet implemented -- coming in ag-3-1" and exit 0 (execution flow is Epic 3 scope)
10. `--verbose` is passed through to `generateManifest({ verbose: true })` for cross-reference display
11. Malformed `taxonomy.yaml` produces a clear, actionable error message with no stack traces (NFR22)

## Tasks / Subtasks

- [ ] Task 1: Create `scripts/migrate-artifacts.js` with `parseArgs()` (AC: #1, #2, #3, #7)
  - [ ] Create `scripts/migrate-artifacts.js` with shebang `#!/usr/bin/env node`
  - [ ] Implement `parseArgs(argv)` as a named function at file top
  - [ ] Parse `process.argv.slice(2)` using direct string matching (no library -- follows existing pattern)
  - [ ] Supported flags: `--help`, `--include <dirs>`, `--apply`, `--force`, `--verbose`
  - [ ] `--include` splits on comma, trims whitespace, replaces defaults
  - [ ] Default `includeDirs`: `['planning-artifacts', 'vortex-artifacts', 'gyre-artifacts']`
  - [ ] Return `{ help, includeDirs, apply, force, verbose }` object

- [ ] Task 2: Implement archive exclusion and taxonomy bootstrap (AC: #4, #5, #6, #11)
  - [ ] In the main function, call `findProjectRoot()` from `scripts/update/lib/utils.js`
  - [ ] If null, print error "Not in a Convoke project. Could not find _bmad/ directory." and exit 1
  - [ ] Hardcode `_archive` in `excludeDirs` -- strip it from `includeDirs` if user includes it, warn
  - [ ] Before calling `generateManifest()`, check if `_bmad/_config/taxonomy.yaml` exists via `fs.existsSync`
  - [ ] If absent, create it with platform defaults: 8 platform initiatives, empty user array, standard artifact_types list, **empty** aliases map (aliases are migration-specific, not defaults)
  - [ ] If present, do nothing (idempotent -- never overwrite)
  - [ ] Wrap `readTaxonomy()` call in try/catch -- on error, print actionable message (file path + error detail), no stack traces, exit 1 (NFR22)

- [ ] Task 3: Implement `--help` output (AC: #1)
  - [ ] Print usage text covering all flags with descriptions and examples
  - [ ] Include: command name, description, flags table, examples section
  - [ ] Show default scope directories
  - [ ] Exit after printing help

- [ ] Task 4: Implement dry-run default flow (AC: #8, #10)
  - [ ] Call `generateManifest(projectRoot, { includeDirs, excludeDirs, verbose })` from artifact-utils.js
  - [ ] Call `formatManifest(manifest, { verbose })` to get text output
  - [ ] Print formatted manifest to stdout
  - [ ] Always exit 0 for dry-run (conflicts/ambiguous are informational, not errors)
  - [ ] Exit 1 only for actual failures (no project root, malformed taxonomy, I/O errors)

- [ ] Task 5: Implement `--apply`/`--force` stub and bin entry (AC: #9, #1)
  - [ ] When `--apply` or `--force` is set: print "Not yet implemented -- coming in ag-3-1" and exit 0
  - [ ] No readline prompt logic -- execution flow is Epic 3 scope
  - [ ] Add `"convoke-migrate-artifacts": "scripts/migrate-artifacts.js"` to package.json bin section (direct path, matching existing pattern -- no `bin/` shim directory)

- [ ] Task 6: Write CLI tests (AC: #1-#11)
  - [ ] Create `tests/lib/migrate-artifacts.test.js`
  - [ ] Test `parseArgs()`:
    - Default args -> correct defaults (3 default dirs, all flags false)
    - `--help` flag detected
    - `--include a,b,c` parsed correctly (splits, trims, replaces defaults)
    - `--apply` and `--force` flags detected
    - `--verbose` flag detected
    - Unknown flags ignored (no error)
  - [ ] Test archive exclusion:
    - `_archive` in includeDirs is stripped and warning emitted
  - [ ] Test taxonomy bootstrap:
    - Creates taxonomy.yaml when absent (use temp dir with `_bmad/_config/` structure)
    - Does not overwrite when present
    - Bootstrap has empty aliases (not the 6 migration-specific aliases)
  - [ ] Test NFR22 error handling:
    - Malformed taxonomy.yaml produces actionable error, no stack trace
  - [ ] Test dry-run output:
    - Integration test against real project root, verify manifest output is non-empty
  - [ ] Test `--apply` stub:
    - Prints "Not yet implemented" message

- [ ] Task 7: Export and run regression checks
  - [ ] Export `parseArgs` and `main` for testability
  - [ ] Run `npx jest tests/lib/` -- all tests pass (139 existing + new)
  - [ ] Run `node scripts/archive.js --rename` -- regression check
  - [ ] Test `node scripts/migrate-artifacts.js --help` prints usage and exits 0

## Dev Notes

### Previous Story (ag-2-2) Intelligence

- `generateManifest(projectRoot, options)` is the main orchestrator -- takes `{ includeDirs, excludeDirs, verbose }`, returns `{ entries, collisions, summary }`
- `formatManifest(manifest, options)` formats to text -- takes `{ verbose }`, returns string
- `readTaxonomy(projectRoot)` loads and validates `_bmad/_config/taxonomy.yaml`
- `findProjectRoot()` is in `scripts/update/lib/utils.js` -- returns absolute path or null
- All 139 tests pass across 4 test files
- `inferArtifactType` now returns `typeConfidence` and `typeSource` fields
- `buildManifestEntry` filters non-`.md` files as SKIP
- `getContextClues` uses `execFileSync` (safe from shell injection)

### Architecture Compliance

**Script location**: `scripts/migrate-artifacts.js` (NOT in `scripts/update/` -- this is a new top-level script, not part of the update system). The existing `scripts/update/convoke-migrate.js` is the version migration CLI -- completely separate.

**Bin entry**: Direct path in package.json `"convoke-migrate-artifacts": "scripts/migrate-artifacts.js"`. No `bin/` directory exists in this project -- all existing bin entries point directly to script files.

**CLI flag parsing**: Direct `process.argv` parsing (Decision 5 from architecture). No library. Follows existing pattern from `archive.js`. The `parseArgs()` function must be extracted at the file top as a named function per enforcement guideline.

**Pipeline position**: This is the CLI wrapper around Phase 1 (Plan/dry-run). Phase 2-3 (execution) are placeholders in this story -- actual implementation is ag-3-1+.

**Taxonomy bootstrap (FR49)**: Create `_bmad/_config/taxonomy.yaml` with platform defaults if absent. Bootstrap structure: 8 platform initiatives, empty user array, standard artifact_types list, **empty** aliases map. The current repo's taxonomy.yaml has 6 aliases, but those are migration-specific (added by ag-2-1) -- a fresh bootstrap should NOT include them. Use `fs.existsSync` for the check and `fs.writeFileSync` + `yaml.dump` for creation.

**Archive exclusion (FR50)**: Two-level: strip from parsed includeDirs + hardcode in excludeDirs passed to `generateManifest`.

### Existing CLI Pattern Reference

Check `scripts/archive.js` for the established CLI pattern in this project:
- Direct `process.argv.slice(2)` + `args.includes('--flag')` pattern
- `findProjectRoot()` usage with null check + exit 1
- Exit codes: 0 success, 1 actual error (not informational warnings)
- Console output uses emoji prefixes, NOT chalk (archive.js has no chalk import)
- `chalk` IS available as a dependency (`^4.1.2`) but usage is optional -- match archive.js style

### Anti-Patterns to AVOID

- Do NOT use `process.cwd()` -- always use `findProjectRoot()`
- Do NOT add a CLI library (yargs, commander, etc.) -- direct argv parsing per architecture
- Do NOT implement actual file renames in this story -- that's ag-3-1
- Do NOT modify `convoke-migrate.js` -- that's the version migration CLI, completely separate
- Do NOT modify `artifact-utils.js` -- this story only consumes the existing API
- Do NOT implement readline prompts -- execution flow (--apply confirm) is Epic 3 scope
- Do NOT include migration-specific aliases in taxonomy bootstrap -- aliases are added by the inference engine (ag-2-1), not seeded as defaults

### File Structure

```
scripts/
├── migrate-artifacts.js     # NEW -- migration CLI entry point
└── lib/
    └── artifact-utils.js    # EXISTING -- consumed, not modified

package.json                 # MODIFIED -- add convoke-migrate-artifacts to bin section

tests/
└── lib/
    └── migrate-artifacts.test.js  # NEW -- CLI tests
```

### Testing Standards

- Jest test framework
- File: `tests/lib/migrate-artifacts.test.js`
- Test `parseArgs()` as a pure function (no I/O)
- For taxonomy bootstrap: use `tmp` dir or jest `fs` mocking
- For dry-run output: mock `generateManifest` and `formatManifest`, verify they're called with correct args
- For integration: call against real project root, verify output contains expected entries
- Run full `tests/lib/` suite after: 139 existing + new must all pass

### References

- [Source: arch-artifact-governance-portfolio.md -- Decision 5: CLI Argument Parsing, Pipeline Phase 1]
- [Source: prd-artifact-governance-portfolio.md -- FR7, FR19, FR20, FR49, FR50, NFR22]
- [Source: scripts/update/lib/utils.js -- findProjectRoot()]
- [Source: scripts/archive.js -- existing CLI pattern reference]
- [Source: scripts/lib/artifact-utils.js -- generateManifest, formatManifest, readTaxonomy]
- [Source: _bmad/_config/taxonomy.yaml -- platform defaults structure]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
