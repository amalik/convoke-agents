# Story 1A.1: Audit bmad-init behavior before replacement

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

**Epic:** [Epic 1A — Seamless Config Migration](convoke-epic-bmad-v6.3-adoption.md#epic-1a-seamless-config-migration)
**Sprint:** 0 (pre-work item, blocks [Story 1A.2](convoke-epic-bmad-v6.3-adoption.md#story-1a2-create-config-loaderjs-with-direct-yaml-loading))
**FR coverage:** — (audit deliverable, no FR directly; prerequisite for FR1–FR4)
**Failure mode closed:** [FM1-2](_bmad-output/planning-artifacts/convoke-arch-bmad-v6.3-adoption.md#known-failure-modes--mitigations) — "bmad-init undocumented behaviors"
**Namespace decision:** Audit deliverable lives in `_bmad-output/planning-artifacts/` (Convoke-owned output, not a reusable skill). No `_bmad/bme/` artifacts produced. Covenant compliance check not applicable — this is a specification document, not a skill. See project-context.md `namespace-decision-for-new-skills`.

## Story

As a maintainer (Amalik) preparing to replace `bmad-init` with a direct-YAML loader,
I want a complete behavioral audit of the existing `bmad_init.py` script documenting every transformation it applies,
so that the replacement `config-loader.js` (Story 1A.2) reproduces the load-path behaviors faithfully and explicitly drops the bootstrap-path behaviors with recorded rationale.

## Acceptance Criteria

**AC1 — Exhaustive behavior inventory.**
**Given** [`_bmad/core/bmad-init/scripts/bmad_init.py`](_bmad/core/bmad-init/scripts/bmad_init.py) (591 LOC, 4 subcommands: `load`, `check`, `resolve-defaults`, `write`)
**When** audited end-to-end via mechanical function-level read
**Then** the deliverable audit document lists every observable behavior under these categories:
1. **Project-root detection** (`find_project_root`, [bmad_init.py:46-71](_bmad/core/bmad-init/scripts/bmad_init.py#L46-L71))
2. **Module.yaml discovery** (`find_core_module_yaml`, `find_target_module_yaml`, [bmad_init.py:112-140](_bmad/core/bmad-init/scripts/bmad_init.py#L112-L140))
3. **Config file loading** (`load_config_file`, `load_module_config`, [bmad_init.py:147-160](_bmad/core/bmad-init/scripts/bmad_init.py#L147-L160))
4. **`{project-root}` placeholder resolution** (`resolve_project_root_placeholder`, [bmad_init.py:163-169](_bmad/core/bmad-init/scripts/bmad_init.py#L163-L169))
5. **Variable-spec parsing** (`parse_var_specs`, [bmad_init.py:172-189](_bmad/core/bmad-init/scripts/bmad_init.py#L172-L189))
6. **Template expansion** (`expand_template`, `apply_result_template`, [bmad_init.py:196-225](_bmad/core/bmad-init/scripts/bmad_init.py#L196-L225))
7. **`cmd_load` behaviors** — default module, missing-config handling, `{project-root}` resolution pass, `--all` vs `--vars` flows, empty-string treatment ([bmad_init.py:232-272](_bmad/core/bmad-init/scripts/bmad_init.py#L232-L272))
8. **`cmd_check` behaviors** — status enum values, module.yaml inclusion rules ([bmad_init.py:279-338](_bmad/core/bmad-init/scripts/bmad_init.py#L279-L338))
9. **`cmd_resolve_defaults` behaviors** — context construction, per-variable default expansion ([bmad_init.py:345-396](_bmad/core/bmad-init/scripts/bmad_init.py#L345-L396))
10. **`cmd_write` behaviors** — core-first ordering, existing-config merge strategy (`existing.update`), directory creation from `module.yaml`, context propagation across modules ([bmad_init.py:403-520](_bmad/core/bmad-init/scripts/bmad_init.py#L403-L520))
11. **Config file write format** (`_write_config_file`, [bmad_init.py:523-530](_bmad/core/bmad-init/scripts/bmad_init.py#L523-L530)) — header comment, UTC timestamp, yaml.safe_dump settings (`default_flow_style=False`, `allow_unicode=True`, `sort_keys=False`)
12. **Error-handling patterns** — JSON error output to stderr, exit-code conventions, silent `None` returns on YAML parse errors

**AC2 — Per-behavior disposition.**
**Given** the behavior inventory from AC1
**When** each behavior is evaluated against [Decision 1 in `convoke-arch-bmad-v6.3-adoption.md`](_bmad-output/planning-artifacts/convoke-arch-bmad-v6.3-adoption.md#decision-1-config-loading-architecture-wr1--wr8) (new `loadModuleConfig(projectRoot, moduleConfigPath)` load-path utility)
**Then** each behavior is tagged with exactly one of:
- **`reproduce-in-loader`** — must appear in `config-loader.js`. Include the JS-equivalent approach (library, function signature, error mode).
- **`drop-with-rationale`** — explicitly not ported. Rationale cites either (a) architectural decision (e.g., "bootstrap concern, belongs to `convoke-install`, not load path") or (b) v6.3 convention divergence (e.g., "flat per-module config already includes core vars, no cascade needed").
- **`move-to-convoke-install`** — behavior belongs in the installer, not the loader. Names the target module (e.g., `scripts/convoke-install.js` or a future `scripts/install/lib/config-writer.js`).

**AC3 — Mechanical enumeration evidence.**
**Given** project-context.md `mechanical-research-enumeration` rule
**When** the audit document is authored
**Then** it cites the mechanical commands used to enumerate the subject space, specifically:
- `wc -l _bmad/core/bmad-init/scripts/bmad_init.py` (size baseline)
- `grep -n '^def \|^    def ' _bmad/core/bmad-init/scripts/bmad_init.py` (function inventory)
- `glob _bmad/*/config.yaml` (installed config shape verification — confirms flat per-module format)
- `grep -rn 'bmad-init\|bmad_init' _bmad/bme/` (callers in Convoke's owned namespace — confirms sweep surface)

**AC4 — Anti-drift anchor.**
**Given** Convoke's existing architecture rules ([project-context.md](project-context.md))
**When** the audit recommends implementation approaches for `reproduce-in-loader` behaviors
**Then** each recommendation is compatible with:
- `no-hardcoded-versions` — loader must not hardcode `package.json` version
- `no-process-cwd-in-libs` — loader accepts `projectRoot` param, never calls `process.cwd()` directly
- `derive-counts-from-source` — no magic numbers about "number of modules" or "expected config keys"
- Pattern 3 (YAML Read/Write Safety) from architecture doc — uses `yaml.parseDocument()` with `doc.errors`/`doc.warnings` check, not `yaml.load()` ([convoke-arch-bmad-v6.3-adoption.md §Pattern 3](_bmad-output/planning-artifacts/convoke-arch-bmad-v6.3-adoption.md#pattern-3-yaml-readwrite-safety))

**AC5 — Committed deliverable location.**
**Given** the audit is a planning artifact, not implementation
**When** written
**Then** the file is saved at `_bmad-output/planning-artifacts/convoke-spec-bmad-init-behavior-audit.md` with frontmatter conforming to the Convoke artifact taxonomy:
```yaml
---
initiative: convoke
artifact_type: spec
qualifier: bmad-init-behavior-audit
status: complete
created: <ISO date>
schema_version: 1
---
```
**And** the file is referenced from [Story 1A.2's Dev Notes](convoke-epic-bmad-v6.3-adoption.md#story-1a2-create-config-loaderjs-with-direct-yaml-loading) as the input to the loader implementation.

## Tasks / Subtasks

- [ ] **Task 1: Run mechanical enumeration** (AC3)
  - [ ] 1.1 `wc -l _bmad/core/bmad-init/scripts/bmad_init.py` — capture LOC for audit header
  - [ ] 1.2 Grep function inventory — paste raw output into working notes as completeness evidence
  - [ ] 1.3 Glob installed configs (`_bmad/*/config.yaml`) — confirm flat per-module shape
  - [ ] 1.4 Grep callers in `_bmad/bme/` — identify the Convoke sweep surface (feeds Story 1A.3 inventory)

- [ ] **Task 2: Author behavior inventory** (AC1)
  - [ ] 2.1 Read [`bmad_init.py`](_bmad/core/bmad-init/scripts/bmad_init.py) end-to-end
  - [ ] 2.2 For each of the 12 behavior categories (AC1), write a subsection with: function name + line range, inputs, outputs, side effects, exception paths
  - [ ] 2.3 Cross-reference each category with the calling SKILL.md at [`_bmad/core/bmad-init/SKILL.md`](_bmad/core/bmad-init/SKILL.md) to verify the documented contract matches the code

- [ ] **Task 3: Tag dispositions** (AC2)
  - [ ] 3.1 For each behavior, tag one of `reproduce-in-loader` / `drop-with-rationale` / `move-to-convoke-install`
  - [ ] 3.2 For `reproduce-in-loader` items, draft the JS-equivalent approach citing `yaml` package, `fs`, `path` idioms
  - [ ] 3.3 For `drop-with-rationale` items, cite the architectural or convention rationale
  - [ ] 3.4 For `move-to-convoke-install` items, name the target module file

- [ ] **Task 4: Verify anti-drift compliance** (AC4)
  - [ ] 4.1 Walk each `reproduce-in-loader` recommendation against the 4 anchor rules
  - [ ] 4.2 Flag any recommendation that violates — rework before finalizing

- [ ] **Task 5: Write deliverable** (AC5)
  - [ ] 5.1 Author `convoke-spec-bmad-init-behavior-audit.md` at [`_bmad-output/planning-artifacts/`](_bmad-output/planning-artifacts/)
  - [ ] 5.2 Include frontmatter per AC5 schema
  - [ ] 5.3 Structure: Executive summary → Mechanical enumeration evidence → Behavior inventory (12 sections) → Disposition table → Compatibility with anchor rules → Handoff notes for Story 1A.2

- [ ] **Task 6: Run convoke-doctor and validate artifact governance** (anchor validation)
  - [ ] 6.1 `npx -p convoke-agents convoke-doctor` — confirm new artifact doesn't break governance checks
  - [ ] 6.2 Verify frontmatter passes `_bmad/_config/taxonomy.yaml` validation (artifact_type: spec is a valid taxonomy entry)

## Dev Notes

### Behavioral audit scope

This is a **discovery/audit story** — no JS code ships. The deliverable is a single markdown document that serves as the functional spec for Story 1A.2's implementation.

### Key insight: load-path vs bootstrap-path split

`bmad_init.py` conflates two concerns that v6.3 separates:

| Concern | `bmad_init.py` command | v6.3 destination |
|---------|------------------------|-------------------|
| **Load** an already-written config | `cmd_load` | New `config-loader.js` (this initiative) |
| **Bootstrap** a missing config | `cmd_check`, `cmd_resolve_defaults`, `cmd_write` | Remains in `convoke-install` / convoke-install-vortex flow |

Most of the 591 LOC in `bmad_init.py` is bootstrap logic. The replacement `config-loader.js` is expected to be small (~50 LOC per architecture doc) because it only owns the load path. Be wary of the temptation to port bootstrap logic into the loader — the architecture explicitly partitions these concerns.

### Prior observations (already confirmed via Read in spec-authoring session)

1. **Installed configs are flat per-module** — [`_bmad/bme/config.yaml`](_bmad/bme/config.yaml:1-11) shows `user_name`, `communication_language`, `document_output_language`, `output_folder` already present in the BME module config, merged in by `bmad-init` at write time. The loader does NOT need to re-merge core values — they are already in the module file. This means the loader's job is literally `fs.readFileSync` + `yaml.parse` + one `{project-root}` substitution pass.
2. **`{project-root}` is the only placeholder that needs runtime resolution** — [`bmad_init.py:163-169`](_bmad/core/bmad-init/scripts/bmad_init.py#L163-L169). Other placeholders (`{value}`, `{directory_name}`, `{var-name}`) are resolved at **write time** by `apply_result_template`, not at load time.
3. **`cmd_load` returns JSON to stdout on success, JSON to stderr on failure, exit 1 on missing config** — this contract is what the calling SKILL.md depends on. The JS loader's contract is different (it's imported, not shelled out) — it will throw on malformed/missing instead. See architecture Decision 1 for the new contract.
4. **Silent `None` returns on YAML parse errors are a bug preserved for compatibility** — the architecture Decision 1 FM1-3 mitigation explicitly fixes this by requiring actionable error messages in the new loader.

### Reference implementation hints for Story 1A.2

When Story 1A.2 picks up this audit, the loader body will be roughly:

```js
function loadModuleConfig(projectRoot, moduleConfigPath) {
  const configPath = path.join(projectRoot, '_bmad', moduleConfigPath, 'config.yaml');
  // ... existence check + deprecation fallback (see Decision 1 WR8) ...
  const doc = yaml.parseDocument(fs.readFileSync(configPath, 'utf8'));
  if (doc.errors.length) throw new Error(`YAML parse error in ${configPath}: ${doc.errors[0].message}`);
  const config = doc.toJSON();
  // Resolve {project-root} placeholder in all string values
  for (const key in config) {
    if (typeof config[key] === 'string' && config[key].includes('{project-root}')) {
      config[key] = config[key].replace('{project-root}', projectRoot);
    }
  }
  return config;
}
```

The audit document should make it possible for Story 1A.2's dev to write this with zero ambiguity — including naming *what not to port* (the entire bootstrap path).

### Project Structure Notes

- **Audit document lives in `_bmad-output/planning-artifacts/`** — aligns with other `convoke-spec-*` and `convoke-arch-*` artifacts (governance-convention pattern).
- **No source tree changes** — `bmad_init.py` stays untouched in Sprint 0. Story 1A.4 deprecates it; it's not removed until Convoke 4.1.
- **Artifact governance frontmatter** per [_bmad/_config/taxonomy.yaml](_bmad/_config/taxonomy.yaml) conventions.

### Testing standards summary

No unit tests for this story — discovery deliverable. Validation is:
1. AC1 coverage count (12 categories present) — reviewable by counting section headers in the audit document.
2. AC2 disposition tags (every listed behavior has exactly one tag) — reviewable by greppable tag pattern `^\*\*Disposition:\*\*`.
3. AC3 evidence (raw command output pasted) — reviewable by presence of code-fenced command output at the top of the audit document.
4. AC4 anchor rules walk (one line per rule explicitly confirming compliance) — reviewable by section header.
5. AC5 frontmatter — reviewable by `convoke-doctor` (Task 6.1).

### References

- [`_bmad/core/bmad-init/scripts/bmad_init.py`](_bmad/core/bmad-init/scripts/bmad_init.py) — script under audit (591 LOC)
- [`_bmad/core/bmad-init/SKILL.md`](_bmad/core/bmad-init/SKILL.md) — declares the existing contract Convoke agents depend on
- [`_bmad/core/bmad-init/resources/core-module.yaml`](_bmad/core/bmad-init/resources/core-module.yaml) — core variable definitions with `prompt` / `default` / `result` keys (confirms the `result` template is bootstrap-side, not load-side)
- [`_bmad/bme/config.yaml`](_bmad/bme/config.yaml) — example installed config (flat, core merged in)
- [convoke-arch-bmad-v6.3-adoption.md §Decision 1](_bmad-output/planning-artifacts/convoke-arch-bmad-v6.3-adoption.md#decision-1-config-loading-architecture-wr1--wr8) — target design for `loadModuleConfig`
- [convoke-arch-bmad-v6.3-adoption.md §FM1-2](_bmad-output/planning-artifacts/convoke-arch-bmad-v6.3-adoption.md#known-failure-modes--mitigations) — the failure mode this story closes
- [convoke-arch-bmad-v6.3-adoption.md §Pattern 3](_bmad-output/planning-artifacts/convoke-arch-bmad-v6.3-adoption.md#pattern-3-yaml-readwrite-safety) — YAML safety pattern the loader must follow
- [convoke-prd-bmad-v6.3-adoption/functional-requirements.md §Direct-Load Configuration](_bmad-output/planning-artifacts/convoke-prd-bmad-v6.3-adoption/functional-requirements.md) — FR1–FR4 this pre-work unblocks
- [project-context.md](project-context.md) — anchor rules (mechanical-research-enumeration, namespace-decision-for-new-skills, no-hardcoded-versions, no-process-cwd-in-libs, derive-counts-from-source, spec-verify-referenced-files)
- [convoke-epic-bmad-v6.3-adoption.md](_bmad-output/planning-artifacts/convoke-epic-bmad-v6.3-adoption.md) — parent epic; see §Pre-Work Items and §Epic 1A

## Dev Agent Record

### Agent Model Used

_(to be filled by dev agent)_

### Debug Log References

### Completion Notes List

### File List

_Expected new files:_
- `_bmad-output/planning-artifacts/convoke-spec-bmad-init-behavior-audit.md` (audit deliverable, ~200–400 lines)

_Expected modified files:_
- None

_Expected deleted files:_
- None
